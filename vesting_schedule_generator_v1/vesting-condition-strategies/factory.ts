import type { GraphNode } from "../types";
import {
  VestingConditionStrategy,
  VestingConditionStrategyConfig,
} from "./strategies/strategy";
import { VestingAbsoluteStrategy } from "./strategies/vesting_absolute";
import { VestingEventStrategy } from "./strategies/vesting_event";
import { VestingRelativeStrategy } from "./strategies/vesting_relative";
import { VestingStartStrategy } from "./strategies/vesting_start";

export type IVestingConditionStrategyFactory = {
  getStrategy<T extends GraphNode>(
    node: T
  ): new (
    config: VestingConditionStrategyConfig<T>
  ) => VestingConditionStrategy<T>;
};

export class VestingConditionStrategyFactory {
  static getStrategy<T extends GraphNode>(node: T) {
    switch (node.trigger.type) {
      case "VESTING_START_DATE":
        return VestingStartStrategy as unknown as new (
          config: VestingConditionStrategyConfig<T>
        ) => VestingConditionStrategy<T>;
      case "VESTING_EVENT":
        return VestingEventStrategy as unknown as new (
          config: VestingConditionStrategyConfig<T>
        ) => VestingConditionStrategy<T>;
      case "VESTING_SCHEDULE_ABSOLUTE":
        return VestingAbsoluteStrategy as unknown as new (
          config: VestingConditionStrategyConfig<T>
        ) => VestingConditionStrategy<T>;
      case "VESTING_SCHEDULE_RELATIVE":
        return VestingRelativeStrategy as unknown as new (
          config: VestingConditionStrategyConfig<T>
        ) => VestingConditionStrategy<T>;
    }
  }
}
