import type {
  GraphNode,
  VestingInstallment,
  OCFDataBySecurityId,
} from "./types";
import { IVestingConditionStrategyFactory } from "./vesting-condition-strategies/factory";

export class VestingInstallmentBuilder {
  private vestingSchedule: VestingInstallment[] = [];
  private vestedCount = 0;
  constructor(
    private graph: Map<string, GraphNode>,
    private ocfData: OCFDataBySecurityId,
    private executionPath: Map<string, GraphNode>,
    private strategyFactor: IVestingConditionStrategyFactory
  ) {}

  private addToVestingSchedule(installments: VestingInstallment[]) {
    const totalVested = installments.reduce((acc, installment) => {
      return (acc += installment.quantity);
    }, 0);

    this.vestedCount += totalVested;

    this.vestingSchedule.push(...installments);
  }

  private createInstallments(node: GraphNode) {
    const Strategy = this.strategyFactor.getStrategy(node);

    const installments = new Strategy({
      node,
      graph: this.graph,
      ocfData: this.ocfData,
      executionPath: this.executionPath,
    }).getInstallments(this.vestedCount);

    return installments;
  }

  public build() {
    for (const node of this.executionPath.values()) {
      const installments = this.createInstallments(node);
      this.addToVestingSchedule(installments);
    }

    return this.vestingSchedule;
  }
}
