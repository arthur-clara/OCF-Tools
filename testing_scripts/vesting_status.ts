import { VestingScheduleGenerator } from "vesting_schedule_generator_v1";
import { OcfPackageContent, readOcfPackage } from "../read_ocf_package";
import { isBefore, parseISO } from "date-fns";
import { VestingScheduleStatus } from "../vesting_schedule_generator_v1/types";
import { ExecutionPathBuilder } from "vesting_schedule_generator_v1/ExecutionPathBuilder";
import { VestingConditionStrategyFactory } from "vesting_schedule_generator_v1/vesting-condition-strategies/factory";

const packagePath = "./sample_ocf_folders/acme_holdings_limited";
const securityId = "equity_compensation_issuance_01";
const ocfPackage: OcfPackageContent = readOcfPackage(packagePath);

try {
  const checkDateString = "2020-06-15";
  const scheduleGenerator = new VestingScheduleGenerator(
    ocfPackage,
    ExecutionPathBuilder,
    VestingConditionStrategyFactory
  );
  scheduleGenerator.getStatusAsOfDate(securityId, checkDateString);
} catch (error) {
  if (error instanceof Error) {
    console.error("Error message:", error.message);
  }
  console.error("Unknown error:", error);
}
