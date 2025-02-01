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
    id: "vest-start",
    description: "vesting start date",
    quantity: "0",
    trigger: {
      type: "VESTING_START_DATE",
    },
    next_condition_ids: [
      "fda-acceptance-deadline-missed",
      "qualified-fda-acceptance",
    ],
  },
  {
    id: "qualified-fda-acceptance",
    description:
      '60% of the shares subject to the Stock Option shall vest and become immediately exercisable upon the FDA’s acceptance of an IND application submitted by the Company relating to the Program; provided, that such acceptance occurs on or before September 30, 2016, and the Warrant Exercise has not occurred prior to such date (the "Qualified FDA Acceptance"',
    portion: {
      numerator: "60",
      denominator: "100",
      remainder: false,
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [
      "acquisition-deadline-missed",
      "qualified-acquisition",
    ],
  },
  {
    id: "qualified-acquisition",
    description:
      'Provided that the Warrant Exercise has not occurred, an additional 40% of the Shares subject to this option shall vest and become immediately exercisable upon the closing of an Acquisition (as defined below) of the Company by a third party at a Purchase Price (as defined below)that is equal to or greater than $30,000,000 (a "Qualified Acquisition"); provided, that (i) the Qualified FDA Acceptance occurs prior to the closing of such Qualified Acquisition and (ii) the closing of such Qualified Acquisition occurs on or prior to March 31, 2017.',
    portion: {
      numerator: "40",
      denominator: "100",
      remainder: false,
    },
    trigger: {
      type: "VESTING_EVENT",
    },
    next_condition_ids: [],
  },
  {
    id: "fda-acceptance-deadline-missed",
    description:
      "Qualified FDA acceptance does not occur on or before September 30, 2016",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2016-10-01",
    },
    next_condition_ids: [],
  },
  {
    id: "acquisition-deadline-missed",
    description:
      "Qualified Acquisition does not occur on or before March 31, 2017",
    quantity: "0",
    trigger: {
      type: "VESTING_SCHEDULE_ABSOLUTE",
      date: "2017-04-01",
    },
    next_condition_ids: [],
  },
];

const vestingTerms: VestingTerms[] = [
  {
    id: "path-dependent-milestone-vesting",
    object_type: "VESTING_TERMS",
    name: "Path-Dependent Milestone Vesting",
    description:
      '1. 60% of the shares subject to the Stock Option shall vest and become immediately exercisable upon the FDA’s acceptance of an IND application submitted by the Company relating to the Program; provided, that such acceptance occurs on or before September 30, 2016, and the Warrant Exercise has not occurred prior to such date (the "Qualified FDA Acceptance")\n2. Provided that the Warrant Exercise has not occurred, an additional 40% of the Shares subject to this option shall vest and become immediately exercisable upon the closing of an Acquisition (as defined below) of the Company by a third party at a Purchase Price (as defined below)that is equal to or greater than $30,000,000 (a "Qualified Acquisition"); provided, that (i) the Qualified FDA Acceptance occurs prior to the closing of such Qualified Acquisition and (ii) the closing of such Qualified Acquisition occurs on or prior to March 31, 2017.',
    allocation_type: "CUMULATIVE_ROUNDING",
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
    vesting_terms_id: "path-dependent-milestone-vesting",
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
