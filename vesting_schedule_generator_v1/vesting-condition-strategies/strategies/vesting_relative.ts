import {
  addDays,
  addMonths,
  compareAsc,
  getDate,
  lastDayOfMonth,
  setDate,
} from "date-fns";
import {
  VestingConditionStrategy,
  VestingConditionStrategyConfig,
} from "./strategy";
import type {
  Day_Of_Month,
  GraphNode,
  RelativeGraphNode,
  VestingInstallment,
} from "../../types";
import Fraction from "fraction.js";
import { VestingModeService } from "../VestingModeService";

export class VestingRelativeStrategy extends VestingConditionStrategy<RelativeGraphNode> {
  private relativeCondition: GraphNode | undefined;
  constructor(config: VestingConditionStrategyConfig<RelativeGraphNode>) {
    super(config);
    this.relativeCondition = this.config.executionPath.get(
      this.config.node.trigger.relative_to_condition_id
    );
  }

  protected evaluate() {
    if (!this.relativeCondition) {
      return false;
    }

    if (!this.relativeCondition.triggeredDate) {
      throw new Error(
        `Vesting condition with id ${this.relativeCondition?.id} is in the execution stack but does not have a triggered date`
      );
    }

    return true;
  }

  protected determineNodeDate(): Date {
    const baseDay = getDate(this.relativeCondition!.triggeredDate!);
    const baseDate = setDate(this.relativeCondition!.triggeredDate!, baseDay);

    const type = this.config.node.trigger.period.type;
    const length = this.config.node.trigger.period.length;

    let newDate = setDate(baseDate, baseDay);

    let day_of_month: Day_Of_Month;

    if (type === "MONTHS") {
      day_of_month = this.config.node.trigger.period.day_of_month;
      newDate = this.incrementTransactionDate(
        baseDate,
        type,
        length,
        day_of_month
      );
    } else if (type === "DAYS") {
      newDate = addDays(baseDate, length);
    }

    return newDate;
  }

  getInstallments(vestedCount: number) {
    const installments = this.createAllInstallments(vestedCount);
    const installmentsWithTriggeredDate =
      this.processTriggeredDate(installments);
    return installmentsWithTriggeredDate;
  }

  private createAllInstallments(vestedCount: number): VestingInstallment[] {
    const { length, type, occurrences } = this.config.node.trigger.period;

    const relativeConditionId =
      this.config.node.trigger.relative_to_condition_id;

    const relativeCondition =
      this.config.executionPath.get(relativeConditionId);

    if (!relativeCondition) {
      throw new Error(
        `Vesting condition with id ${this.config.node.id} is in the execution path but the node it references in its \`relative_to_condition_id\` field is not in the execution path`
      );
    }

    if (!relativeCondition.triggeredDate) {
      throw new Error(
        `vesting condition with id ${this.config.node.id} is in the execution path but the node it references in its \`relative_to_condition_id\` field does not have a triggered date`
      );
    }

    const baseDay = getDate(relativeCondition.triggeredDate);
    let baseDate = setDate(relativeCondition.triggeredDate, baseDay);

    let day_of_month: Day_Of_Month;

    if (type === "MONTHS") {
      day_of_month = this.config.node.trigger.period.day_of_month;
    }

    const sharesVesting = this.getSharesVesting(vestedCount)
      .mul(new Fraction(occurrences))
      .valueOf();

    const vestingMode = VestingModeService.determineVestingMode(
      this.config.ocfData.issuanceVestingTerms!.allocation_type
    );

    const installments = Array.from({ length: occurrences }, (_, index) => {
      const newDate = this.incrementTransactionDate(
        baseDate,
        type,
        length,
        day_of_month
      );

      const quantity = vestingMode(index, occurrences, sharesVesting);

      const installment = {
        date: newDate,
        quantity,
      };

      baseDate = newDate;

      return installment;
    });

    return installments;
  }

  private incrementTransactionDate(
    baseDate: Date,
    type: "DAYS" | "MONTHS",
    length: number,
    day_of_month?: Day_Of_Month
  ) {
    const baseDay = getDate(baseDate);
    let newDate = setDate(baseDate, baseDay);

    if (type === "MONTHS") {
      const nextMonthDate = addMonths(baseDate, length);
      const lastDateOfMonth = lastDayOfMonth(nextMonthDate);
      const lastDay = getDate(lastDateOfMonth);
      let targetDay: number;

      switch (day_of_month) {
        case "29_OR_LAST_DAY_OF_MONTH":
          targetDay = Math.min(29, lastDay);
          newDate = setDate(nextMonthDate, targetDay);
        case "30_OR_LAST_DAY_OF_MONTH":
          targetDay = Math.min(30, lastDay);
          newDate = setDate(nextMonthDate, targetDay);
        case "31_OR_LAST_DAY_OF_MONTH":
          targetDay = Math.min(31, lastDay);
          newDate = setDate(nextMonthDate, targetDay);
          break;
        case "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH":
          targetDay = Math.min(baseDay, lastDay);
          newDate = setDate(nextMonthDate, targetDay);
          break;
        default:
          targetDay = baseDay;
          newDate = setDate(nextMonthDate, targetDay);
          break;
      }
    } else if (type === "DAYS") {
      newDate = addDays(baseDate, length);
    }

    return newDate;
  }

  private processTriggeredDate(
    vestingSchedule: VestingInstallment[]
  ): VestingInstallment[] {
    let accumulatedQuantity = 0;
    const triggeredDate = this.config.node.triggeredDate;

    if (!triggeredDate) {
      throw new Error(
        `Vesting condition with id ${this.config.node.id} is in the execution stack but does not have a triggered date`
      );
    }

    const firstIndexOnOrAfterRelativeDate = vestingSchedule.findIndex(
      (installment) =>
        // this determines whether installment.date is after or equal to the triggered date
        compareAsc(installment.date, triggeredDate) >= 0
    );

    const vestingScheduleWithTriggeredDate = vestingSchedule.reduce(
      (acc, installment, index) => {
        accumulatedQuantity += installment.quantity;

        // Accumulate and move on if the installment is before the firstIndexOnOrAfterRelativeDate
        if (index < firstIndexOnOrAfterRelativeDate) {
          return acc;
        }

        if (index === firstIndexOnOrAfterRelativeDate) {
          const modInstallment: VestingInstallment = {
            ...installment,
            quantity: accumulatedQuantity,
          };

          acc.push(modInstallment);
          return acc;
        }

        acc.push(installment);
        return acc;
      },
      [] as VestingInstallment[]
    );

    return vestingScheduleWithTriggeredDate;
  }
}
