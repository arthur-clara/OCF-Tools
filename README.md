# Open Cap Table Format (OCF) Toolset

Version: 0.1.0

Date: 01 February 2025

A growing toolset to help validate and utilize Open Cap Table Format datasets.

Currently, the dataset includes 5 tools:

## Read OCF Package

This tool creates a workable JSON object of the content of an OCF folder from the path of the directory holding the OCF files.

```ts
const ocfPackage = readOcfPackage(ocfPackageFolderDir);
```

## Generate Vesting Schedule v1

The following describes the vesting schedule generator found in the `vesting_shedule_generator_v1` directory.
An alternative implementation is found in the `vesting_schedule_generator` directory.

The vesting schedule generator

This tool generates an array of objects representing a vesting schedule, in ascending order by date.

The tool can handle any [allocation-type](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/objects/VestingTerms/#object-vesting-terms), any [day_of_month](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/types/vesting/VestingPeriodInMonths/#type-vesting-period-in-months) designation, and any upfront vesting or cliff periods.

### 📝 Notes

The vesting schedule generator found in the `vesting_shedule_generator_v1` directory does not include any additional tooling to create cliffs.

The vesting schedule generator found in the `vesting_schedule_generator` directory utilizes a `cliff_length` field within the `Vesting Schedule Relative Trigger` object, which is not in the current released version of OCF as of February 1, 2025. [Open-Cap-Table-Format-OCT Issue #514](https://github.com/Open-Cap-Table-Coalition/Open-Cap-Format-OCF/issues/514#issue-2468182057)

```ts
{
  type: "VESTING_SCHEDULE_RELATIVE";
  period: Period_Months | Period_Days;
  relative_to_condition_id: string;
  cliff_length?: number;
}
```

### 🔧 Usage

A `VestingScheduleGenerator` class instance is instantiated with:

- the `ocfPackage` returned from `readOcfPackage`,
- an `ExecutionPathBuilder` class, and
- a `VestingConditionStrategyFactory class.

```ts
const generator = new VestingScheduleGenerator(
  ocfPackage,
  ExecutionPathBuilder,
  VestingConditionStrategyFactory
);
```

A vesting schedule is created by providing an equity compensation issuance [`security_id`](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/objects/transactions/issuance/EquityCompensationIssuance/#object-equity-compensation-issuance-transaction) as a parameter to the `generateSchedule` method.

```ts
const schedule = generator.generateSchedule("equity_compenstion_issuance_01");
```

which returns an array of `VestingInstallment` objects

```ts
{
  date: Date;
  quantity: number;
}
[];
```

A more detailed vesting schedule with the following additional information:

```ts
{
  becameVested: number;
  totalVested: number;
  totalUnvested: number;
  becameExercisable: number;
}
```

is obtained by providing an equity compensation issuance [`security_id`](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/objects/transactions/issuance/EquityCompensationIssuance/#object-equity-compensation-issuance-transaction) as a parameter to the `generateScheduleWithStatus` method.

```ts
const scheduleWithStatus = generator.generateScheduleWithStatus(
  "equity_compensation_01"
);
```

The "status" described above can be determined as as of a given date by provided a dateString in 'YYYY-MM-DD' format and an equity compensation issuance [`security_id`](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/objects/transactions/issuance/EquityCompensationIssuance/#object-equity-compensation-issuance-transaction) as parameters to the `getStatusAsOfDate` method.

```ts
const statusAsOfDate = generator.getStatusAsOfDate(
  "equity_compensation_01",
  "2020-06-15"
);
```

### 🔍 Examples

The following commands print examples to the console

```bash
npm run print:vesting_schedule.ts
npm run print:vesting_status.ts
```

## ISO / NSO Split Calculator

This tool allows a user to determine the ISO / NSO split for equity compensation issuances for a given stakeholder.

### ⚠️ **Warning**

> This tool is in development and should not be relied on for legal purposes.

### 📝 Notes

This tool uses vesting_schedule_generator_v1 under the hood.

This tool utilizes a `valuation_id` within the `Equity_Compensation_Issuance` object, which is not in the current released version of OCF as of November 2, 2024. [Open-Cap-Table-Format-OCT Issue #535](https://github.com/Open-Cap-Table-Coalition/Open-Cap-Format-OCF/issues/535#issue-2595216527)

### 💡Conventions

If one or more `valuation_id`s are provided, the fair market value as of the grant date is assumed to be last valuation prior to the grant date. Otherwise, the fair market value as of the grant date is assumed to be the `exercise-price`.

This tool throws an error if neither a `valuation_id` nor an `exercise_price` is provided.

### 🔧 Usage

The `ISONSOCalculatorService` takes the `ocfPackage` returned from `readOcfPackage` and an equity compensation issuance [`stakeholder_id`](https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/schema_markdown/schema/objects/transactions/issuance/EquityCompensationIssuance/#object-equity-compensation-issuance-transaction) as parameters.

```ts
const ocfPackage = readOcfPackage(ocfPackageFolderDir);
const calculator = new ISOCalculator(ocfPackage);
const results = calculator.execute(stakeholderId);
```

`.execute()` returns an array of the following objects:

```ts
{
  Year: number,
  date: Date,
  quantity: number,
  grantDate: Date,
  securityId: string,
  becameExercisable: number,
  FMV: number,
  StartingCapacity: number,
  ISOShares: number,
  NSOShares: number,
  CapacityUtilized: number,
  CapacityRemaining: number,
}
```

## OCF Validator

This tool tests the logical and structural validity of an OCF package. We are continuing to build out the rules set for validity but have good coverage for stock transactions and basic validations for all other transactions. The tool outputs a JSON object with the variables of `result: string` , `report: string[]` and `snapshots: any[]` . The result shows if the package is valid or what the issue is if it is not. The report shows a list of all the validity checks completed per transaction and snapshots shows an array of end of day captables based on the package.

```typescript
const ocfValidation = ocfValidator(ocfPackageFolderDir);
```

## OCF Snapshot

This tool allows the user to see the outstanding captable of a OCF package on a given date.

```typescript
const snapshot = ocfSnapshot(ocfPackageFolderDir, ocfSnapshotDate);
```

## How to use the toolset

### (before publication to NPM)

Download this repository and run `npm i; npm run build; npm link;`

In the project that you want to use ocf-tools, run `npm link ocf-tools` and add
` const { readOcfPackage, generateSchedule, vestingStatusCheck, isoNsoCalculator, ocfValidator, ocfSnapshot } = require("ocf-tools");`
to the top of the file you want to use the ocf-tools in.
