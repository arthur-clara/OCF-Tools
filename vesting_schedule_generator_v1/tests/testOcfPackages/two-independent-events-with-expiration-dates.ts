import { OcfPackageContent } from "read_ocf_package";
import {
  TX_Equity_Compensation_Issuance,
  TX_Vesting_Event,
  TX_Vesting_Start,
  VestingCondition,
  VestingTerms,
} from "vesting_schedule_generator_v1/types";

const vestingConditions: VestingCondition[] = [
  {
    id: "vesting-start",
    quantity: "0",
    trigger: {
      type: "VESTING_START_DATE",
    },
    next_condition_ids: ["A-expires", "A-occurs", "B-expires", "B-occurs"],
  },
  {
    id: "A-expires",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2026-01-01",
    },
    next_condition_ids: [
      "B-expires-after-A-expires",
      "B-occurs-after-A-expires",
    ],
  },
  {
    id: "B-expires-after-A-expires",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2027-01-01",
    },
    next_condition_ids: [],
  },
  {
    id: "B-occurs-after-A-expires",
    portion: {
      numerator: "3",
      denominator: "4",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
  {
    id: "A-occurs",
    portion: {
      numerator: "1",
      denominator: "4",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: ["B-expires-after-A-occurs", "B-occurs-after-A-occurs"],
  },
  {
    id: "B-expires-after-A-occurs",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2027-01-01",
    },
    next_condition_ids: [],
  },
  {
    id: "B-occurs-after-A-occurs",
    portion: {
      numerator: "3",
      denominator: "4",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
  {
    id: "B-expires",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2027-01-01",
    },
    next_condition_ids: [],
  },
  {
    id: "B-occurs",
    portion: {
      numerator: "3",
      denominator: "4",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: ["A-expires-after-B-occurs", "A-occurs-after-B-occurs"],
  },
  {
    id: "A-expires-after-B-occurs",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2026-01-01",
    },
    next_condition_ids: [],
  },
  {
    id: "A-occurs-after-B-occurs",
    portion: {
      numerator: "1",
      denominator: "4",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
];

const vestingTerms: VestingTerms[] = [
  {
    id: "two-independent-events-with-expiration-dates",
    object_type: "VESTING_TERMS",
    name: "two-independent-events-with-expiration-dates",
    description: "two-independent-events-with-expiration-dates",
    allocation_type: "CUMULATIVE_ROUND_DOWN",
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
    vesting_terms_id: "two-independent-events-with-expiration-dates",
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
