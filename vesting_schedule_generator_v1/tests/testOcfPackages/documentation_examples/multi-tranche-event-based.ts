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
    next_condition_ids: [
      "vesting-expired",
      "double-trigger-acceleration",
      "100k-sale-1",
    ],
  },
  {
    id: "vesting-expired",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 48,
        type: "MONTHS",
        occurrences: 1,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "vesting-start",
    },
    next_condition_ids: [],
  },
  {
    id: "double-trigger-acceleration",
    portion: {
      numerator: "1",
      denominator: "1",
      remainder: true,
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
  {
    id: "100k-sale-1",
    portion: {
      numerator: "20",
      denominator: "100",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [
      "vesting-expired",
      "double-trigger-acceleration",
      "100k-sale-2",
    ],
  },
  {
    id: "100k-sale-2",
    portion: {
      numerator: "20",
      denominator: "100",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [
      "vesting-expired",
      "double-trigger-acceleration",
      "100k-sale-3",
    ],
  },
  {
    id: "100k-sale-3",
    portion: {
      numerator: "20",
      denominator: "100",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [
      "vesting-expired",
      "double-trigger-acceleration",
      "100k-sale-4",
    ],
  },
  {
    id: "100k-sale-4",
    portion: {
      numerator: "20",
      denominator: "100",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [
      "vesting-expired",
      "double-trigger-acceleration",
      "100k-sale-5",
    ],
  },
  {
    id: "100k-sale-5",
    portion: {
      numerator: "20",
      denominator: "100",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
];

const vestingTerms: VestingTerms[] = [
  {
    id: "multi-tranche-event-based",
    object_type: "VESTING_TERMS",
    name: "Multi-tranche, event-based with 100%, double-trigger acceleration",
    description:
      "20% of the options vest each time a sale is made in excess of $100,000 in the aggregate, so long as such sale is made prior to Noon Eastern 4 years from vesting commencement.",
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
    vesting_terms_id: "multi-tranche-event-based",
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
