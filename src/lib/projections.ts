import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  isBefore,
  isAfter,
  isSameMonth,
  getDaysInMonth,
  getDate,
  getMonth,
} from "date-fns";

export interface CategoryProjection {
  name: string;
  actualAmount: number;
  expectedAmount: number;
  count: number;
  percentageOfTotal: number;
}

export interface UpcomingIncomeItem {
  id: string;
  name: string;
  expectedAmount: number; // in cents
  expectedDay: number;
}

export interface MonthProjections {
  isCurrentMonth: boolean;
  isFutureMonth: boolean;
  isPastMonth: boolean;

  // Expenses in cents
  actualExpenses: number;
  projectedExpenses: number;
  remainingExpenses: number;

  // Income in cents
  actualIncome: number;
  projectedIncome: number;
  remainingIncome: number;

  // Net in cents
  actualNet: number;
  projectedNet: number;

  // Estimated end of month balance (cents)
  projectedEOMBalance: number;

  // Breakdown by category
  categoryProjections: CategoryProjection[];

  // Uncollected recurring incomes expected in current month
  upcomingIncomes: UpcomingIncomeItem[];
}

export interface RawTransaction {
  id: string;
  amount: number;
  category: string;
  date: string | Date;
  description?: string;
  userId?: string | null;
  userName?: string;
  status?: "pending" | "paid";
  isTransfer?: boolean;
  accountType?: string;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function normalizeIncomeKey(inc: RawTransaction): {
  key: string;
  name: string;
  isAnnual?: boolean;
  annualMonth?: number;
} {
  const desc = (inc.description || "").toLowerCase();
  const userName = (inc.userName || "").toLowerCase();

  const isAlex = desc.includes("alex") || userName === "alex";
  const isIrina = desc.includes("irina") || userName === "irina";
  const isSalary =
    desc.includes("salary") ||
    desc.includes("salariu") ||
    (inc.category || "").toLowerCase() === "salary";

  if (isSalary && isAlex) return { key: "alex_salary", name: "Alex Salary" };
  if (isSalary && isIrina) return { key: "irina_salary", name: "Irina Salary" };

  if (desc.includes("concediu") || desc.includes("holiday") || desc.includes("prima")) {
    const incDate = new Date(inc.date);
    return {
      key: "holiday_money",
      name: "Holiday Money",
      isAnnual: true,
      annualMonth: getMonth(incDate),
    };
  }

  if (desc.includes("aftermind")) return { key: "aftermind", name: "Aftermind" };

  const clean = desc.replace(/[^a-z0-9]/g, "");
  return {
    key: clean ? `${userName}_${clean}` : `${userName}_${(inc.category || "income").toLowerCase()}`,
    name: inc.description?.trim() || "Income",
  };
}

export function calculateProjections({
  expenses,
  incomes,
  currentBalance,
  selectedDate,
  now = new Date(),
}: {
  expenses: RawTransaction[];
  incomes: RawTransaction[];
  currentBalance: number;
  selectedDate: Date;
  now?: Date;
}): MonthProjections {
  const currentMonthStart = startOfMonth(now);
  const selectedMonthStart = startOfMonth(selectedDate);
  const selectedMonthEnd = endOfMonth(selectedDate);

  const isCurrentMonth = isSameMonth(selectedDate, now);
  const isFutureMonth = isAfter(selectedMonthStart, currentMonthStart);
  const isPastMonth = isBefore(selectedMonthStart, currentMonthStart);

  // Filter settled, non-transfer, main account items
  const paidExpenses = expenses.filter(
    (e) => e.status !== "pending" && !e.isTransfer && e.accountType !== "credit",
  );
  const paidIncomes = incomes.filter((i) => !i.isTransfer && i.status !== "pending");

  // Determine up to 6 completed reference months (3-6 months lookback) for robust statistical baselining
  const referenceMonths = [1, 2, 3, 4, 5, 6].map((offset) => {
    const monthDate = subMonths(currentMonthStart, offset);
    return {
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    };
  });

  // 1. RECURRING INCOMES ENGINE
  // Track incomes across reference months to identify regular salaries vs irregular/annual streams
  const streamHistories = new Map<
    string,
    {
      key: string;
      name: string;
      isAnnual?: boolean;
      annualMonth?: number;
      monthSums: Map<number, number>;
      instances: { amount: number; date: Date; day: number }[];
    }
  >();

  for (const inc of paidIncomes) {
    const d = new Date(inc.date);
    const { key, name, isAnnual, annualMonth } = normalizeIncomeKey(inc);

    if (!streamHistories.has(key)) {
      streamHistories.set(key, {
        key,
        name,
        isAnnual,
        annualMonth,
        monthSums: new Map(),
        instances: [],
      });
    }
    const history = streamHistories.get(key)!;

    for (let i = 0; i < referenceMonths.length; i++) {
      if (isWithinInterval(d, referenceMonths[i])) {
        history.monthSums.set(i, (history.monthSums.get(i) || 0) + inc.amount);
        history.instances.push({ amount: inc.amount, date: d, day: getDate(d) });
      }
    }
  }

  // Monthly recurring streams must appear in >= 2 of recent reference months
  const recurringStreams: {
    key: string;
    name: string;
    expectedAmount: number;
    expectedDay: number;
    isAnnual?: boolean;
    annualMonth?: number;
  }[] = [];

  for (const history of streamHistories.values()) {
    // If it's an annual stream (e.g. holiday money in June)
    if (history.isAnnual && history.annualMonth !== undefined) {
      const sorted = [...history.instances].sort((a, b) => b.date.getTime() - a.date.getTime());
      const latest = sorted[0];
      const days = history.instances.map((x) => x.day).sort((a, b) => a - b);
      recurringStreams.push({
        key: history.key,
        name: history.name,
        expectedAmount: latest?.amount || 0,
        expectedDay: days[Math.floor(days.length / 2)] || 15,
        isAnnual: true,
        annualMonth: history.annualMonth,
      });
      continue;
    }

    // Monthly recurring stream: must be present in at least 2 of reference months
    const recentPresentCount = [0, 1, 2].filter((i) => history.monthSums.has(i)).length;
    if (recentPresentCount >= 2 || history.monthSums.size >= 3) {
      const sorted = [...history.instances].sort((a, b) => b.date.getTime() - a.date.getTime());
      const latest = sorted[0];
      const sums = Array.from(history.monthSums.values());
      const med = median(sums);
      const days = history.instances.map((x) => x.day).sort((a, b) => a - b);
      const medianDay = days[Math.floor(days.length / 2)] || 6;

      recurringStreams.push({
        key: history.key,
        name: history.name,
        // Latest confirmed monthly salary takes precedence, median as fallback
        expectedAmount: latest?.amount || med,
        expectedDay: medianDay,
      });
    }
  }

  // Actual incomes in selected month
  const currentMonthIncomes = paidIncomes.filter((i) =>
    isWithinInterval(new Date(i.date), { start: selectedMonthStart, end: selectedMonthEnd }),
  );
  const actualIncome = currentMonthIncomes.reduce((acc, i) => acc + i.amount, 0);

  let remainingIncome = 0;
  const upcomingIncomes: UpcomingIncomeItem[] = [];
  const selectedMonthIndex = getMonth(selectedDate);

  for (const stream of recurringStreams) {
    // If it is an annual stream, only evaluate it in its specific anniversary month
    if (stream.isAnnual && stream.annualMonth !== selectedMonthIndex) {
      continue;
    }

    const matching = currentMonthIncomes.filter((i) => normalizeIncomeKey(i).key === stream.key);
    const collectedAmount = matching.reduce((acc, i) => acc + i.amount, 0);

    if (isPastMonth) {
      // Past month is settled
    } else if (isCurrentMonth) {
      if (collectedAmount < stream.expectedAmount * 0.8) {
        const streamRemaining = stream.expectedAmount - collectedAmount;
        remainingIncome += streamRemaining;
        upcomingIncomes.push({
          id: stream.key,
          name: stream.name,
          expectedAmount: streamRemaining,
          expectedDay: stream.expectedDay,
        });
      }
    } else {
      // Future month
      remainingIncome += stream.expectedAmount;
      upcomingIncomes.push({
        id: stream.key,
        name: stream.name,
        expectedAmount: stream.expectedAmount,
        expectedDay: stream.expectedDay,
      });
    }
  }

  const projectedIncome = isPastMonth
    ? actualIncome
    : isFutureMonth
      ? recurringStreams
          .filter((s) => !s.isAnnual || s.annualMonth === selectedMonthIndex)
          .reduce((acc, s) => acc + s.expectedAmount, 0)
      : actualIncome + remainingIncome;

  // 2. EXPENSES ENGINE (Median Outlier Filtering & Prorated Run-Rate)
  const allCategories = Array.from(new Set(paidExpenses.map((e) => e.category)));
  const categoryStats = new Map<string, { baseline: number; medCount: number; isFixed: boolean }>();

  for (const cat of allCategories) {
    const monthlySums: number[] = [];
    const monthlyCounts: number[] = [];
    for (const ref of referenceMonths) {
      const matching = paidExpenses.filter(
        (e) =>
          e.category === cat &&
          isWithinInterval(new Date(e.date), { start: ref.start, end: ref.end }),
      );
      monthlySums.push(matching.reduce((acc, curr) => acc + curr.amount, 0));
      monthlyCounts.push(matching.length);
    }

    // Use median monthly spend across reference months.
    // This accurately captures true ongoing monthly spending habits
    // while ignoring one-off spikes, annual bills (like home insurance in Sep), or irregular expenses.
    const baseline = median(monthlySums);
    const medCount = median(monthlyCounts);

    const lower = cat.toLowerCase();
    const isFixed =
      lower.includes("loan") ||
      lower.includes("insurance") ||
      lower.includes("mortgage") ||
      lower.includes("subscription") ||
      lower.includes("rent");

    categoryStats.set(cat, { baseline, medCount, isFixed });
  }

  // Selected month expenses
  const currentMonthExpenses = paidExpenses.filter((e) =>
    isWithinInterval(new Date(e.date), { start: selectedMonthStart, end: selectedMonthEnd }),
  );
  const actualExpenses = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const categoryActualMap = new Map<string, { amount: number; count: number }>();
  for (const exp of currentMonthExpenses) {
    const prev = categoryActualMap.get(exp.category) || { amount: 0, count: 0 };
    categoryActualMap.set(exp.category, {
      amount: prev.amount + exp.amount,
      count: prev.count + 1,
    });
  }

  const daysInCurrentMonth = getDaysInMonth(now);
  const currentDay = getDate(now);
  const remainingFraction = Math.max(0, daysInCurrentMonth - currentDay) / daysInCurrentMonth;

  const involvedCategories = Array.from(
    new Set([...categoryActualMap.keys(), ...categoryStats.keys()]),
  ).filter((cat) => {
    const actual = categoryActualMap.get(cat)?.amount || 0;
    const stats = categoryStats.get(cat);
    return actual > 0 || (stats && stats.baseline > 0);
  });

  const categoryProjections: CategoryProjection[] = involvedCategories.map((cat) => {
    const actual = categoryActualMap.get(cat)?.amount || 0;
    const count = categoryActualMap.get(cat)?.count || 0;
    const stats = categoryStats.get(cat) || { baseline: 0, medCount: 0, isFixed: false };

    let expected = 0;
    if (isPastMonth) {
      expected = actual;
    } else if (isFutureMonth) {
      expected = stats.baseline;
    } else {
      // Current active month
      if (stats.isFixed) {
        if (actual >= stats.baseline * 0.8 && actual > 0) {
          expected = actual;
        } else {
          expected = Math.max(actual, stats.baseline);
        }
      } else {
        // Variable spend:
        // If actual has already exceeded normal baseline (e.g. an unexpected surgery or bulk purchase),
        // we lock expected to actual and do not project phantom run-rate on top.
        if (actual >= stats.baseline) {
          expected = actual;
        } else {
          const remainingRunRate = Math.round(stats.baseline * remainingFraction);
          expected = actual + remainingRunRate;
        }
      }
    }

    return {
      name: cat,
      actualAmount: actual,
      expectedAmount: expected,
      count,
      percentageOfTotal: 0,
    };
  });

  categoryProjections.sort((a, b) => {
    const valB = isPastMonth ? b.actualAmount : b.expectedAmount;
    const valA = isPastMonth ? a.actualAmount : a.expectedAmount;
    return valB - valA;
  });

  const projectedExpenses = isPastMonth
    ? actualExpenses
    : categoryProjections.reduce((acc, c) => acc + c.expectedAmount, 0);

  for (const cp of categoryProjections) {
    const basis = isPastMonth ? actualExpenses : projectedExpenses;
    const val = isPastMonth ? cp.actualAmount : cp.expectedAmount;
    cp.percentageOfTotal = basis > 0 ? (val / basis) * 100 : 0;
  }

  const remainingExpenses = Math.max(0, projectedExpenses - actualExpenses);

  const actualNet = actualIncome - actualExpenses;
  const projectedNet = projectedIncome - projectedExpenses;

  // Projected EOM balance: liquid available cash + pending inflows - pending outflows
  const projectedEOMBalance = isPastMonth
    ? currentBalance
    : currentBalance + remainingIncome - remainingExpenses;

  return {
    isCurrentMonth,
    isFutureMonth,
    isPastMonth,
    actualExpenses,
    projectedExpenses,
    remainingExpenses,
    actualIncome,
    projectedIncome,
    remainingIncome,
    actualNet,
    projectedNet,
    projectedEOMBalance,
    categoryProjections,
    upcomingIncomes,
  };
}
