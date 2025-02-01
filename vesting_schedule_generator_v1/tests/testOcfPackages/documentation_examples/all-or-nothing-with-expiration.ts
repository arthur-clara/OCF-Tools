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
    description: "The date on which the vesting period begins",
    trigger: {
      type: "VESTING_START_DATE",
    },
    quantity: "0",
    next_condition_ids: [
      "relative-expiration",
      "absolute-expiration",
      "qualifying-sale",
    ],
  },
  {
    id: "relative-expiration",
    description: "0% vesting three years after vesting start",
    portion: {
      numerator: "0",
      denominator: "1",
    },
    trigger: {
      type: "VESTING_SCHEDULE_RELATIVE",
      period: {
        length: 36,
        type: "MONTHS",
        occurrences: 1,
        day_of_month: "VESTING_START_DAY_OR_LAST_DAY_OF_MONTH",
      },
      relative_to_condition_id: "vesting-start",
    },
    next_condition_ids: [],
  },
  {
    id: "absolute-expiration",
    description: "0% vesting after 1 Jan, 2027",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2027-01-01",
    },
    next_condition_ids: [],
  },
  {
    id: "qualifying-sale",
    description: "Company is acquired for > $100MM",
    portion: {
      numerator: "1",
      denominator: "1",
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
];

const vestingTerms: VestingTerms[] = [
  {
    id: "all-or-nothing-with-expiration",
    object_type: "VESTING_TERMS",
    name: "Documentation: Example 2",
    description:
      "100% of the options vest on a security-specific date, within time boundaries",
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
    vesting_terms_id: "all-or-nothing-with-expiration",
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
