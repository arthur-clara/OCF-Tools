import { isBefore, parse } from "date-fns";
import { VestingScheduleGenerator } from "../index";
import { ExecutionPathBuilder } from "../ExecutionPathBuilder";
import { ocfPackage as all_or_nothing } from "./testOcfPackages/documentation_examples/all-or-nothing";
import { ocfPackage as all_or_nothing_with_expiration } from "./testOcfPackages/documentation_examples/all-or-nothing-with-expiration";
import { ocfPackage as fourYear_oneYear_cliff_schedule } from "./testOcfPackages/documentation_examples/4yr-1yr-cliff-schedule";
import { ocfPackage as sixYear_option_back_loaded } from "./testOcfPackages/documentation_examples/6-yr-option-back-loaded";
import { ocfPackage as custom_vesting_100pct_upfront } from "./testOcfPackages/documentation_examples/custom-vesting-100pct-upfront";
import { ocfPackage as multi_tranche_event_based } from "./testOcfPackages/documentation_examples/multi-tranche-event-based";
import { ocfPackage as path_dependent_milestone_vesting } from "./testOcfPackages/documentation_examples/path-dependent-milestone-vesting";
import { ocfPackage as grant_date_after_VCD_no_cliff } from "./testOcfPackages/grant_date_after_VCD_no_cliff";
import { ocfPackage as two_independent_events_with_expiration_dates } from "./testOcfPackages/two-independent-events-with-expiration-dates";
import { ocfPackage as two_interdependent_events_with_expiration_dates } from "./testOcfPackages/two-interdependent-events-with-expiration-dates";

import type {
  TX_Vesting_Event,
  TX_Vesting_Start,
  VestingScheduleStatus,
} from "../types";
import { OcfPackageContent } from "../../read_ocf_package";
import { VestingConditionStrategyFactory } from "../vesting-condition-strategies/factory";

/******************************
 * helper functions
 ******************************/
const getTotalSharesUnderlying = (ocfPackage: OcfPackageContent) => {
  return ocfPackage.transactions.reduce((acc, tx) => {
    if (tx.object_type === "TX_EQUITY_COMPENSATION_ISSUANCE") {
      return (acc += parseFloat(tx.quantity));
    }
    return acc;
  }, 0);
};

const getSchedule = (ocfPackage: OcfPackageContent) => {
  // return generateVestingSchedule(ocfPackage, "equity_compensation_issuance_01");
  const generator = new VestingScheduleGenerator(
    ocfPackage,
    ExecutionPathBuilder,
    VestingConditionStrategyFactory
  );

  return generator.generateScheduleWithStatus(
    "equity_compensation_issuance_01"
  );
};

const getAggregateVested = (schedule: VestingScheduleStatus[]) => {
  return schedule.reduce((acc, installment) => {
    return (acc += installment.quantity);
  }, 0);
};

const getAggregateBecameExecisable = (schedule: VestingScheduleStatus[]) => {
  return schedule.reduce((acc, installment) => {
    return (acc += installment.becameExercisable);
  }, 0);
};

const getLastInstallmentTotalVested = (schedule: VestingScheduleStatus[]) => {
  return schedule[schedule.length - 1].totalVested;
};

const getLastInstallmentTotalUnvested = (schedule: VestingScheduleStatus[]) => {
  return schedule[schedule.length - 1].totalUnvested;
};

/******************************
 * all or nothing
 ******************************/
describe("all or nothing", () => {
  const ocfPackage: OcfPackageContent = {
    ...all_or_nothing,
  };

  describe("Event does not occur", () => {
    const schedule = getSchedule(ocfPackage);

    test("The total shares underlying should equal 4800", () => {
      expect(getTotalSharesUnderlying(ocfPackage)).toEqual(4800);
    });

    test("No shares should vest", () => {
      expect(getAggregateVested(schedule)).toEqual(0);
      expect(getLastInstallmentTotalVested(schedule)).toEqual(0);
      expect(getLastInstallmentTotalUnvested(schedule)).toEqual(
        getTotalSharesUnderlying(ocfPackage)
      );
    });

    test("No shares should become exercisable", () => {
      expect(getAggregateBecameExecisable(schedule)).toEqual(0);
    });
  });
  describe("Event occurs", () => {
    const event: TX_Vesting_Event = {
      id: "qualifying-sale",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "qualifying-sale",
    };

    ocfPackage.transactions.push(event);
    const schedule = getSchedule(ocfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("The total shares underlying should equal 4800", () => {
      expect(totalSharesUnderlying).toEqual(4800);
    });

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });

    test("Should not have a vesting event before 2026-01-01", () => {
      const vestingEventBeforeCliff = schedule.find(
        (installment) =>
          isBefore(
            installment.date,
            parse("2026-01-01", "yyyy-MM-dd", new Date())
          ) && installment.quantity > 0
      );
      expect(vestingEventBeforeCliff).toBeUndefined();
    });
  });
});

/******************************
 * all or nothing with expiration
 ******************************/
describe("all or nothing with expiration", () => {
  const ocfPackage = {
    ...all_or_nothing_with_expiration,
  };

  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  describe("qualifying sale does not occur", () => {
    const schedule = getSchedule(ocfPackage);

    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("No shares should vest", () => {
      expect(aggregateVested).toEqual(0);
      expect(lastInstallmentTotalVested).toEqual(0);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying);
    });

    test("No shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(0);
    });
  });

  describe("qualifying sale occurs", () => {
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
    const schedule = getSchedule(ocfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });

    test("Should not have a vesting event before 2024-01-01", () => {
      const vestingEventBeforeCliff = schedule.find(
        (installment) =>
          isBefore(
            installment.date,
            parse("2024-01-01", "yyyy-MM-dd", new Date())
          ) && installment.quantity > 0
      );
      expect(vestingEventBeforeCliff).toBeUndefined();
    });
  });
});

/******************************
 * Four year one year cliff schedule
 ******************************/

describe("Four year one year cliff schedule", () => {
  const ocfPackage = {
    ...fourYear_oneYear_cliff_schedule,
  };

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  ocfPackage.transactions.push(start_event);
  const schedule = getSchedule(ocfPackage);
  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
  const aggregateVested = getAggregateVested(schedule);
  const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
  const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
  const lastInstallmentTotalUnvested =
    getLastInstallmentTotalUnvested(schedule);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  test("Final total vested should equal the total shares underyling", () => {
    expect(aggregateVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalUnvested).toEqual(0);
  });

  test("All shares should become exercisable", () => {
    expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
  });

  test("Should not have a vesting event before 2026-01-01", () => {
    const vestingEventBeforeCliff = schedule.find(
      (installment) =>
        isBefore(
          installment.date,
          parse("2026-01-01", "yyyy-MM-dd", new Date())
        ) && installment.quantity > 0
    );
    expect(vestingEventBeforeCliff).toBeUndefined();
  });
});

/******************************
 * Six Year Option Back Loaded
 ******************************/

describe("Six Year Option Back Loaded", () => {
  const ocfPackage = {
    ...sixYear_option_back_loaded,
  };

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  ocfPackage.transactions.push(start_event);

  const schedule = getSchedule(ocfPackage);
  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
  const aggregateVested = getAggregateVested(schedule);
  const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
  const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
  const lastInstallmentTotalUnvested =
    getLastInstallmentTotalUnvested(schedule);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  test("Final total vested should equal the total shares underyling", () => {
    expect(aggregateVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalUnvested).toEqual(0);
  });

  test("All shares should become exercisable", () => {
    expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
  });

  test("Should not have a vesting event before 2027-01-01", () => {
    const vestingEventBeforeCliff = schedule.find(
      (installment) =>
        isBefore(
          installment.date,
          parse("2027-01-01", "yyyy-MM-dd", new Date())
        ) && installment.quantity > 0
    );
    expect(vestingEventBeforeCliff).toBeUndefined();
  });
});

/******************************
 * Custom Vesting 100% Upfront
 ******************************/

describe("Custom Vesting 100% Upfront", () => {
  const ocfPackage = { ...custom_vesting_100pct_upfront };

  const event: TX_Vesting_Event = {
    id: "full-vesting",
    object_type: "TX_VESTING_EVENT",
    date: "2024-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "full-vesting",
  };

  ocfPackage.transactions.push(event);

  const schedule = getSchedule(ocfPackage);
  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
  const aggregateVested = getAggregateVested(schedule);
  const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
  const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
  const lastInstallmentTotalUnvested =
    getLastInstallmentTotalUnvested(schedule);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  test("Final total vested should equal the total shares underyling", () => {
    expect(aggregateVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalUnvested).toEqual(0);
  });

  test("All shares should become exercisable", () => {
    expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
  });

  test("Should not have a vesting event before 2024-01-01", () => {
    const vestingEventBeforeCliff = schedule.find(
      (installment) =>
        isBefore(
          installment.date,
          parse("2024-01-01", "yyyy-MM-dd", new Date())
        ) && installment.quantity > 0
    );
    expect(vestingEventBeforeCliff).toBeUndefined();
  });
});

/******************************
 * Multi-Tranche Event-Based
 ******************************/

describe("Multi-Tranche Event-Based", () => {
  let ocfPackage = { ...multi_tranche_event_based };

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  ocfPackage.transactions.push(start_event);

  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  describe("qualifying sale does not occur", () => {
    const schedule = getSchedule(ocfPackage);

    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("No shares should vest", () => {
      expect(aggregateVested).toEqual(0);
      expect(lastInstallmentTotalVested).toEqual(0);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying);
    });

    test("No shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(0);
    });
  });

  describe("One sale occurs", () => {
    const event: TX_Vesting_Event = {
      id: "100k-sale-1",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-1",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 20% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.2);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.2);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying * 0.8);
    });

    test("20% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.2);
    });
  });

  describe("Two sales occur", () => {
    const event1: TX_Vesting_Event = {
      id: "100k-sale-1",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-1",
    };

    const event2: TX_Vesting_Event = {
      id: "100k-sale-2",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-2",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 40% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.4);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.4);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying * 0.6);
    });

    test("40% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.4);
    });
  });

  describe("Two sales occur, then the 4th occurs but not the 3rd", () => {
    const event1: TX_Vesting_Event = {
      id: "100k-sale-1",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-1",
    };

    const event2: TX_Vesting_Event = {
      id: "100k-sale-2",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-2",
    };

    const event4: TX_Vesting_Event = {
      id: "100k-sale-2",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "100k-sale-2",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2, event4],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 40% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.4);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.4);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying * 0.6);
    });

    test("40% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.4);
    });
  });

  describe("Double-trigger acceleration occurs", () => {
    const event: TX_Vesting_Event = {
      id: "double-trigger-acceleration",
      object_type: "TX_VESTING_EVENT",
      date: "2026-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "double-trigger-acceleration",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });
});

/*********************************************
 * Path Dependent Milestone Vesting
 *********************************************/
describe("Path Dependent Milestone Vesting", () => {
  const ocfPackage = { ...path_dependent_milestone_vesting };

  const start_event: TX_Vesting_Start = {
    id: "vest-start",
    object_type: "TX_VESTING_START",
    date: "2015-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vest-start",
  };

  ocfPackage.transactions.push(start_event);

  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  describe("FDA acceptance deadline missed", () => {
    const schedule = getSchedule(ocfPackage);

    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("No shares should vest", () => {
      expect(aggregateVested).toEqual(0);
      expect(lastInstallmentTotalVested).toEqual(0);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying);
    });

    test("No shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(0);
    });
  });

  describe("Qualified FDA acceptance", () => {
    const event: TX_Vesting_Event = {
      id: "qualified-fda-acceptance",
      object_type: "TX_VESTING_EVENT",
      date: "2016-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "qualified-fda-acceptance",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 60% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.6);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.6);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying * 0.4);
    });

    test("60% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.6);
    });
  });

  describe("Qualified FDA acceptance followed by qualified acquisition", () => {
    const event1: TX_Vesting_Event = {
      id: "qualified-fda-acceptance",
      object_type: "TX_VESTING_EVENT",
      date: "2016-01-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "qualified-fda-acceptance",
    };

    const event2: TX_Vesting_Event = {
      id: "qualified-acquisition",
      object_type: "TX_VESTING_EVENT",
      date: "2016-02-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "qualified-acquisition",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });
});

/******************************
 * Grant Date After VCD No Cliff
 ******************************/
describe("Grant Date After VCD No Cliff", () => {
  const ocfPackage = { ...grant_date_after_VCD_no_cliff };

  const start_event: TX_Vesting_Start = {
    id: "start_condition",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "start_condition",
  };

  ocfPackage.transactions.push(start_event);

  const schedule = getSchedule(ocfPackage);
  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
  const aggregateVested = getAggregateVested(schedule);
  const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
  const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
  const lastInstallmentTotalUnvested =
    getLastInstallmentTotalUnvested(schedule);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  test("Final total vested should equal the total shares underyling", () => {
    expect(aggregateVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
    expect(lastInstallmentTotalUnvested).toEqual(0);
  });

  test("All shares should become exercisable", () => {
    expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
  });

  test("Should not have a vesting event before 2025-08-05", () => {
    const vestingEventBeforeCliff = schedule.find(
      (installment) =>
        isBefore(
          installment.date,
          parse("2025-08-05", "yyyy-MM-dd", new Date())
        ) && installment.quantity > 0
    );
    expect(vestingEventBeforeCliff).toBeUndefined();
  });

  test("Last vesting date should be 2028-06-01", () => {
    const lastDate = schedule[schedule.length - 1].date;
    expect(lastDate).toStrictEqual(
      parse("2028-06-01", "yyyy-MM-dd", new Date())
    );
  });
});

/******************************
 * Two Independent Events With Expiration Dates
 ******************************/
describe("Two independent events with expiration dates", () => {
  const ocfPackage = { ...two_independent_events_with_expiration_dates };

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  ocfPackage.transactions.push(start_event);

  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  describe("Both events expire", () => {
    const schedule = getSchedule(ocfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("No shares should vest", () => {
      expect(aggregateVested).toEqual(0);
      expect(lastInstallmentTotalVested).toEqual(0);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying);
    });

    test("No shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(0);
    });
  });

  describe("A expires then B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs-after-A-expires",
      object_type: "TX_VESTING_EVENT",
      date: "2026-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs-after-A-expires",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 75% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.25
      );
    });

    test("75% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.75);
    });
  });

  describe("A occurs then B expires", () => {
    const event1: TX_Vesting_Event = {
      id: "A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 25% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.25);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.25);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.75
      );
    });

    test("25% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.25);
    });
  });

  describe("A occurs then B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs",
    };

    const event2: TX_Vesting_Event = {
      id: "B-occurs-after-A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2026-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs-after-A-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });

  describe("A expires after B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 75% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.25
      );
    });

    test("75% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.75);
    });
  });

  describe("A occurs after B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs",
    };

    const event2: TX_Vesting_Event = {
      id: "A-occurs-after-B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-12-31",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs-after-B-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });
});

/******************************
 * Two Interdependent Events With Expiration Dates
 ******************************/
describe("Two interdependent events with expiration dates", () => {
  const ocfPackage = { ...two_interdependent_events_with_expiration_dates };

  const start_event: TX_Vesting_Start = {
    id: "vesting-start",
    object_type: "TX_VESTING_START",
    date: "2025-01-01",
    security_id: "equity_compensation_issuance_01",
    vesting_condition_id: "vesting-start",
  };

  ocfPackage.transactions.push(start_event);

  const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);

  test("The total shares underlying should equal 4800", () => {
    expect(totalSharesUnderlying).toEqual(4800);
  });

  describe("Both events expire", () => {
    const schedule = getSchedule(ocfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(ocfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("No shares should vest", () => {
      expect(aggregateVested).toEqual(0);
      expect(lastInstallmentTotalVested).toEqual(0);
      expect(lastInstallmentTotalUnvested).toEqual(totalSharesUnderlying);
    });

    test("No shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(0);
    });
  });

  describe("A expires then B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs-after-A-expires",
      object_type: "TX_VESTING_EVENT",
      date: "2026-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs-after-A-expires",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 75% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.25
      );
    });

    test("75% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.75);
    });
  });

  describe("A occurs then B expires", () => {
    const event1: TX_Vesting_Event = {
      id: "A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 25% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.25);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.25);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.75
      );
    });

    test("25% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.25);
    });
  });

  describe("A occurs then B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs",
    };

    const event2: TX_Vesting_Event = {
      id: "B-occurs-after-A-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2026-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs-after-A-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });

  describe("A expires after B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal 75% of the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying * 0.75);
      expect(lastInstallmentTotalUnvested).toEqual(
        totalSharesUnderlying * 0.25
      );
    });

    test("75% of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying * 0.75);
    });
  });

  describe("A occurs after B occurs", () => {
    const event1: TX_Vesting_Event = {
      id: "B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-06-01",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "B-occurs",
    };

    const event2: TX_Vesting_Event = {
      id: "A-occurs-after-B-occurs",
      object_type: "TX_VESTING_EVENT",
      date: "2025-12-31",
      security_id: "equity_compensation_issuance_01",
      vesting_condition_id: "A-occurs-after-B-occurs",
    };

    const newOcfPackage = {
      ...ocfPackage,
      transactions: [...ocfPackage.transactions, event1, event2],
    };

    const schedule = getSchedule(newOcfPackage);
    const totalSharesUnderlying = getTotalSharesUnderlying(newOcfPackage);
    const aggregateVested = getAggregateVested(schedule);
    const aggregateBecameExercisable = getAggregateBecameExecisable(schedule);
    const lastInstallmentTotalVested = getLastInstallmentTotalVested(schedule);
    const lastInstallmentTotalUnvested =
      getLastInstallmentTotalUnvested(schedule);

    test("Final total vested should equal the total shares underyling", () => {
      expect(aggregateVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalVested).toEqual(totalSharesUnderlying);
      expect(lastInstallmentTotalUnvested).toEqual(0);
    });

    test("All of the shares should become exercisable", () => {
      expect(aggregateBecameExercisable).toEqual(totalSharesUnderlying);
    });
  });
});
