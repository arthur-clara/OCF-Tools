import { OcfPackageContent } from "../../../../read_ocf_package";
import type {
  TX_Equity_Compensation_Issuance,
  TX_Vesting_Event,
  TX_Vesting_Start,
  VestingCondition,
  VestingTerms,
} from "../../../types";

const vestingConditions: VestingCondition[] = [
  {
    id: "vesting-start",
    quantity: "0",
    trigger: {
      type: "VESTING_START_DATE",
    },
    next_condition_ids: ["10pct-after-24-months"],
  },
  {
    id: "10pct-after-24-months",
    description: "10% payout at 2 years",
    portion: {
      numerator: "1",
      denominator: "10",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 24,
        type: "MONTHS",
        occurrences: 1,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "vesting-start",
    },
    next_condition_ids: ["1.25pct-each-month-for-12-months"],
  },
  {
    id: "1.25pct-each-month-for-12-months",
    description: "1.25% payout each month for 12 months",
    portion: {
      numerator: "1",
      denominator: "80",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 1,
        type: "MONTHS",
        occurrences: 12,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "10pct-after-24-months",
    },
    next_condition_ids: ["1.67pct-each-month-for-12-months"],
  },
  {
    id: "1.67pct-each-month-for-12-months",
    description: "1.67% payout each month for 12 months",
    portion: {
      numerator: "1",
      denominator: "60",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 1,
        type: "MONTHS",
        occurrences: 12,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "1.25pct-each-month-for-12-months",
    },
    next_condition_ids: ["2.08pct-each-month-for-12-months"],
  },
  {
    id: "2.08pct-each-month-for-12-months",
    description: "2.08% payout each month for 12 months",
    portion: {
      numerator: "1",
      denominator: "48",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 1,
        type: "MONTHS",
        occurrences: 12,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "1.67pct-each-month-for-12-months",
    },
    next_condition_ids: ["2.5pct-each-month-for-12-months"],
  },
  {
    id: "2.5pct-each-month-for-12-months",
    description: "2.5% payout each month for 12 months",
    portion: {
      numerator: "1",
      denominator: "40",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 1,
        type: "MONTHS",
        occurrences: 12,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "2.08pct-each-month-for-12-months",
    },
    next_condition_ids: [],
  },
];

const vestingTerms: VestingTerms[] = [
  {
    id: "6-yr-option-back-loaded",
    object_type: "VESTING_TERMS",
    name: "Six Year Option - Back Loaded",
    description:
      "Grant vests at a rate of 10% of the original number of shares on the 24th month; then vests 1.25% for 12 months; 1.67% for 12 months; 2.08% for 12 months; and 2.5% for 12 months",
    allocation_type: "BACK_LOADED",
    vesting_conditions: vestingConditions,
  },
];

const transactions: (
  | TX_Equity_Compensation_Issuance
  | TX_Vesting_Start
  | TX_Vesting_Event
)[] = [
  {
    id: "eci_01",
    object_type: "TX_EQUITY_COMPENSATION_ISSUANCE",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    custom_id: "EC-1",
    stakeholder_id: "emilyEmployee",
    security_law_exemptions: [],
    quantity: "4800",
    exercise_price: { amount: "1.0", currency: "USD" },
    early_exercisable: false,
    compensation_type: "OPTION",
    option_grant_type: "ISO",
    expiration_date: "2034-12-31",
    termination_exercise_windows: [
      {
        reason: "VOLUNTARY_GOOD_CAUSE",
        period: 3,
        period_type: "MONTHS",
      },
    ],
    vesting_terms_id: "6-yr-option-back-loaded",
    valuation_id: "valuation_01",
  },
];

export const ocfPackage: OcfPackageContent = {
  manifest: [],
  stakeholders: [],
  stockClasses: [],
  transactions: transactions,
  stockLegends: [],
  stockPlans: [],
  vestingTerms: vestingTerms,
  valuations: [],
};
