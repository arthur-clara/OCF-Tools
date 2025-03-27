import {
  VestingConditionStrategy,
  VestingConditionStrategyConfig,
} from "./strategy";
import type { AbsoluteGraphNode } from "../../types";
import { parseISO } from "date-fns";

export class VestingAbsoluteStrategy extends VestingConditionStrategy<AbsoluteGraphNode> {
  constructor(config: VestingConditionStrategyConfig<AbsoluteGraphNode>) {
    super(config);
  }

  protected evaluate() {
    // Absolute conditions are deemed to be in the execution path
    return true;
  }

  protected determineNodeDate(): Date {
    return parseISO(this.config.node.trigger.date);
  }
}
