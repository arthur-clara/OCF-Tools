import { OcfPackageContent } from "../read_ocf_package/index.ts";
import { getOCFDataBySecurityId } from "./get-ocf-data-by-security-id.ts";
import { createVestingGraph } from "./create-vesting-graph.ts";
import {
  GraphNode,
  OCFDataBySecurityId,
  VestingInstallment,
  VestingScheduleStatus,
} from "./types/index.ts";
import { compareAsc, isBefore, parseISO } from "date-fns";
import { VestingInstallmentBuilder } from "./VestingInstallmentBuilder.ts";
import { ExecutionPathBuilder } from "./ExecutionPathBuilder.ts";
import {
  IVestingConditionStrategyFactory,
  VestingConditionStrategyFactory,
} from "./vesting-condition-strategies/factory.ts";
import { detectCycles } from "./detect-cycles.ts";

export class VestingScheduleGenerator {
  constructor(
    private ocfPackage: OcfPackageContent,
    private executionPathBuilder: new (
      graph: Map<string, GraphNode>,
      rootNodes: string[],
      ocfData: OCFDataBySecurityId,
      vestingConditionStrategyFactory: IVestingConditionStrategyFactory
    ) => ExecutionPathBuilder,
    private vestingConditionStrategyFactory: IVestingConditionStrategyFactory
  ) {}

  private getOCFData(securityId: string): OCFDataBySecurityId {
    return getOCFDataBySecurityId(this.ocfPackage, securityId);
  }

  /**
   * If both `vesting_terms_id` and `vestings` are provided, defer to the `vesting_terms_id`.
   * Absence of both `vesting_terms_id` and `vestings` means the shares are fully vested on issuance.
   */
  private getStrategy(OCFDataBySecurityId: OCFDataBySecurityId) {
    if (OCFDataBySecurityId.issuanceVestingTerms) {
      return this.imperativeStrategy(OCFDataBySecurityId);
    } else if (OCFDataBySecurityId.vestingObjects) {
      return this.declarativeStrategy(OCFDataBySecurityId);
    } else {
      return this.fullyVestedStrategy(OCFDataBySecurityId);
    }
  }

  private imperativeStrategy(OCFDataBySecurityId: OCFDataBySecurityId) {
    // Prepare vesting conditions
    const vestingConditions =
      OCFDataBySecurityId.issuanceVestingTerms!.vesting_conditions;
    const graphNodes = vestingConditions.map((vc) => {
      const graphNode: GraphNode = {
        ...vc,
        triggeredDate: undefined,
        prior_condition_ids: [],
      };

      return graphNode;
    });

    // Create vesting graph
    const { graph, rootNodes } = createVestingGraph(graphNodes);

    // Detect cycles
    detectCycles(graph);

    // Create the execution stack
    const executionPathBuilder = new this.executionPathBuilder(
      graph,
      rootNodes,
      OCFDataBySecurityId,
      this.vestingConditionStrategyFactory
    );
    const executionPath = executionPathBuilder.build();

    // Create installments from the execution stack
    const vestingInstallmentBuilder = new VestingInstallmentBuilder(
      graph,
      OCFDataBySecurityId,
      executionPath,
      VestingConditionStrategyFactory
    );

    const vestingSchedule = vestingInstallmentBuilder.build();

    return vestingSchedule;
  }

  private declarativeStrategy(OCFDataBySecurityId: OCFDataBySecurityId) {
    return OCFDataBySecurityId.vestingObjects!.map((obj) => ({
      date: parseISO(obj.date),
      quantity: parseFloat(obj.amount),
    }));
  }

  private fullyVestedStrategy(OCFDataBySecurityId: OCFDataBySecurityId) {
    return [
      {
        date: parseISO(OCFDataBySecurityId.issuanceTransaction.date),
        quantity: parseFloat(OCFDataBySecurityId.issuanceTransaction.quantity),
      },
    ];
  }

  /**
   * Rounds partial shares down to the nearest whole share
   * Note that rounded is separately handled for vesting conditions with a `relative` trigger type
   */
  private applyRounding(vestingSchedule: VestingInstallment[]) {
    let cumulativeRemainder = 0;

    const roundedVestingSchedule = vestingSchedule.reduce(
      (acc, installment) => {
        const total = installment.quantity + cumulativeRemainder;
        const roundedQuantity = Math.floor(total);
        cumulativeRemainder = total - roundedQuantity;

        acc.push({
          ...installment,
          quantity: roundedQuantity,
        });

        return acc;
      },
      [] as VestingInstallment[]
    );

    return roundedVestingSchedule;
  }

  /**
   * Ensures that no shares vest prior to the grant date of the security
   * Accumulates quantities that would have otherwise vested prior to the grant date,
   * and creates a new schedule starting at the grant date.
   */
  private processFirstVestingDate(
    vestingSchedule: VestingInstallment[],
    grantDate: Date
  ) {
    const firstValidIndex = vestingSchedule.findIndex(
      (installment) => compareAsc(installment.date, grantDate) > 0
    );

    const totalAccumulated = vestingSchedule.reduce(
      (sum, inst) => sum + inst.quantity,
      0
    );

    if (firstValidIndex === -1)
      return [
        {
          date: grantDate,
          quantity: totalAccumulated,
        },
      ];

    const accumulated = vestingSchedule
      .slice(0, firstValidIndex + 1)
      .reduce((sum, inst) => sum + inst.quantity, 0);

    return [
      {
        date: vestingSchedule[firstValidIndex].date,
        quantity: accumulated,
      },
      ...vestingSchedule.slice(firstValidIndex + 1),
    ];
  }

  public generateSchedule(securityId: string): VestingInstallment[] {
    const OCFDataBySecurityId = this.getOCFData(securityId);
    const unroundedSchedule = this.getStrategy(OCFDataBySecurityId);

    const roundedSchedule = this.applyRounding(unroundedSchedule);

    const grantDate = parseISO(OCFDataBySecurityId.issuanceTransaction.date);
    const processedSchedule = this.processFirstVestingDate(
      roundedSchedule,
      grantDate
    );

    return processedSchedule;
  }

  public generateScheduleWithStatus(securityId: string) {
    const ocfData = this.getOCFData(securityId);
    const vestingSchedule = this.generateSchedule(securityId);

    const EARLY_EXERCISABLE = !!ocfData.issuanceTransaction.early_exercisable;
    const totalQuantity = parseFloat(ocfData.issuanceTransaction.quantity);

    // sort by vesting date
    vestingSchedule.sort((a, b) => compareAsc(a.date, b.date));

    let totalVested = 0;
    let totalUnvested = totalQuantity;

    const vestingScheduleWithStatus = vestingSchedule.map((installment) => {
      totalVested += installment.quantity;
      totalUnvested -= installment.quantity;

      const status: VestingScheduleStatus = {
        ...installment,
        totalVested,
        totalUnvested,
        becameExercisable: EARLY_EXERCISABLE ? 0 : installment.quantity,
      };

      return status;
    });

    // Add an installment for the grant date if the option is EARLY_EXERCISABLE and not fully vested on the grant date

    if (
      (ocfData.issuanceVestingTerms || ocfData.vestingObjects) &&
      EARLY_EXERCISABLE
    ) {
      vestingScheduleWithStatus.unshift({
        date: parseISO(ocfData.issuanceTransaction.date),
        quantity: 0,
        totalVested: 0,
        totalUnvested: totalQuantity,
        becameExercisable: EARLY_EXERCISABLE ? totalQuantity : 0,
      });
    }

    return vestingScheduleWithStatus;
  }

  getStatusAsOfDate(securityId: string, dateString: string) {
    const dateFormatRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateFormatRegex.test(dateString)) {
      console.error("Invalid date format.  Use 'YYYY-MM-DD'.");
      return null;
    }

    const checkDate = parseISO(dateString);

    const vestingScheduleWithStatus =
      this.generateScheduleWithStatus(securityId);

    let latestInstallment: VestingScheduleStatus | null = null;
    for (let installment of vestingScheduleWithStatus) {
      if (isBefore(installment.date, checkDate)) {
        if (
          latestInstallment === null ||
          isBefore(latestInstallment.date, checkDate)
        ) {
          latestInstallment = installment;
        }
      }
    }

    if (latestInstallment === null) {
      console.error("The date provided is before the vesting start date");
    } else {
      console.table(latestInstallment);
    }
  }
}
