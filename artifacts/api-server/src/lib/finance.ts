import type { Transaction } from "@workspace/db";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}

function txMonthKey(t: Transaction): string {
  // date is "YYYY-MM-DD"
  return t.date.slice(0, 7);
}

interface MonthTotals {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

function emptyTotals(): MonthTotals {
  return { income: 0, expenses: 0, savings: 0, investments: 0 };
}

function addToTotals(totals: MonthTotals, t: Transaction): void {
  switch (t.type) {
    case "Income":
      totals.income += t.amount;
      break;
    case "Expense":
      totals.expenses += t.amount;
      break;
    case "Investment":
      totals.investments += t.amount;
      break;
    default:
      break;
  }
}

export function computeSummary(transactions: Transaction[], now = new Date()) {
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curKey = monthKey(curYear, curMonth);

  // Per-month buckets
  const buckets = new Map<string, MonthTotals>();
  for (const t of transactions) {
    const key = txMonthKey(t);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = emptyTotals();
      buckets.set(key, bucket);
    }
    addToTotals(bucket, t);
  }
  // savings = income - expenses per month
  for (const bucket of buckets.values()) {
    bucket.savings = bucket.income - bucket.expenses;
  }

  // Current month totals
  const current = buckets.get(curKey) ?? emptyTotals();
  const currentMonth = {
    income: current.income,
    expenses: current.expenses,
    savings: current.income - current.expenses,
    investments: current.investments,
  };

  // Last 6 months trend (oldest -> newest)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const key = monthKey(d.getFullYear(), d.getMonth());
    const b = buckets.get(key) ?? emptyTotals();
    monthlyTrend.push({
      month: monthLabel(d.getFullYear(), d.getMonth()),
      income: b.income,
      expenses: b.expenses,
      savings: b.income - b.expenses,
      investments: b.investments,
    });
  }

  // Last 12 months savings trend
  const savingsTrend = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const key = monthKey(d.getFullYear(), d.getMonth());
    const b = buckets.get(key) ?? emptyTotals();
    savingsTrend.push({
      month: monthLabel(d.getFullYear(), d.getMonth()),
      savings: b.income - b.expenses,
    });
  }

  // Expense breakdown by category (current month)
  const categoryMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "Expense") continue;
    if (txMonthKey(t) !== curKey) continue;
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  }
  const expenseByCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Investments
  let totalInvested = 0;
  let investedThisMonth = 0;
  for (const t of transactions) {
    if (t.type !== "Investment") continue;
    totalInvested += t.amount;
    if (txMonthKey(t) === curKey) investedThisMonth += t.amount;
  }

  return {
    currentMonth,
    monthlyTrend,
    expenseByCategory,
    savingsTrend,
    totalInvested,
    investedThisMonth,
    transactionCount: transactions.length,
  };
}

export function computeSpentThisMonth(
  transactions: Transaction[],
  now = new Date(),
): Map<string, number> {
  const curKey = monthKey(now.getFullYear(), now.getMonth());
  const spent = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "Expense") continue;
    if (txMonthKey(t) !== curKey) continue;
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
  }
  return spent;
}
