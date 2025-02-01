import { parseISO } from "date-fns";
import type { EventGraphNode, TX_Vesting_Event } from "../../types";
import {
  VestingConditionStrategy,
  VestingConditionStrategyConfig,
} from "./strategy";

export class VestingEventStrategy extends VestingConditionStrategy<EventGraphNode> {
  private tx: TX_Vesting_Event | undefined;
  constructor(config: VestingConditionStrategyConfig<EventGraphNode>) {
    super(config);
    this.tx = this.config.ocfData.vestingEventTransactions.find(
      (tx): tx is TX_Vesting_Event =>
        tx.vesting_condition_id === this.config.node.id
    );
  }

  protected evaluate() {
    return this.tx !== undefined;
  }

  protected determineNodeDate(): Date {
    return parseISO(this.tx!.date);
  }
}
