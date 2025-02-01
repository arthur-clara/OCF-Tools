import { VestingScheduleGenerator } from "../vesting_schedule_generator_v1";
import { ocfPackage } from "../vesting_schedule_generator_v1/tests/testOcfPackages/documentation_examples/all-or-nothing-with-expiration";
import {
  TX_Vesting_Event,
  TX_Vesting_Start,
} from "../vesting_schedule_generator_v1/types";
import { ExecutionPathBuilder } from "../vesting_schedule_generator_v1/ExecutionPathBuilder";
import { VestingConditionStrategyFactory } from "../vesting_schedule_generator_v1/vesting-condition-strategies/factory";

try {
  const securityId = "equity_compensation_issuance_01";

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2022-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  const event: TX_Vesting_Event = {
    id: "qualifying-sale",
    object_type: "TX_VESTING_EVENT",
    date: "2024-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "qualifying-sale",
  };

  ocfPackage.transactions.push(start_event);
  ocfPackage.transactions.push(event);

  const vestingSchedule = new VestingScheduleGenerator(
    ocfPackage,
    ExecutionPathBuilder,
    VestingConditionStrategyFactory
  ).generateSchedule(securityId);
  console.table(vestingSchedule);
} catch (error) {
  if (error instanceof Error) {
    console.error("Error message:", error.message);
  }
  console.error("Unknown error:", error);
}
