import { randomUUID } from "node:crypto";
import { db, transactionsTable, budgetsTable, metaTable } from "@workspace/db";
import type { InsertTransaction, InsertBudget } from "@workspace/db";

export const SEEDED_META_KEY = "seeded";

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const EXPENSE_CATEGORIES: Array<{
  category: string;
  description: string;
  min: number;
  max: number;
}> = [
  { category: "Housing", description: "Monthly apartment rent", min: 22000, max: 22000 },
  { category: "Food & Dining", description: "Groceries & restaurants", min: 8000, max: 12000 },
  { category: "Transportation", description: "Fuel & cab rides", min: 2000, max: 3500 },
  { category: "Utilities", description: "Electricity & water bill", min: 2500, max: 4000 },
  { category: "Healthcare", description: "Pharmacy & checkups", min: 500, max: 3000 },
  { category: "Entertainment", description: "Movies & outings", min: 800, max: 2000 },
  { category: "Shopping", description: "Clothing & essentials", min: 1500, max: 6000 },
  { category: "Subscriptions", description: "OTT & app subscriptions", min: 600, max: 1500 },
  { category: "Personal Care", description: "Salon & grooming", min: 500, max: 1500 },
  { category: "EMI/Loan", description: "Personal loan EMI", min: 6000, max: 6000 },
];

const BUDGETS: InsertBudget[] = [
  { category: "Housing", limit: 22000 },
  { category: "Food & Dining", limit: 12000 },
  { category: "Transportation", limit: 4000 },
  { category: "Utilities", limit: 4000 },
  { category: "Healthcare", limit: 3000 },
  { category: "Entertainment", limit: 2500 },
  { category: "Shopping", limit: 6000 },
  { category: "Subscriptions", limit: 1500 },
  { category: "Personal Care", limit: 1500 },
  { category: "EMI/Loan", limit: 6000 },
];

function randBetween(min: number, max: number): number {
  if (min === max) return min;
  return Math.round((min + Math.random() * (max - min)) / 100) * 100;
}

export function buildSeedTransactions(now = new Date()): InsertTransaction[] {
  const txns: InsertTransaction[] = [];
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const today = now.getDate();

  // 4 months of data: 3 previous full months + current (partial) month.
  for (let i = 3; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const isCurrentMonth = i === 0;
    const dayCap = isCurrentMonth ? today : 28;

    // Salary income on the 1st
    txns.push({
      id: randomUUID(),
      date: isoDate(year, month, 1),
      description: "Monthly salary",
      category: "Salary",
      type: "Income",
      amount: 80000,
      notes: null,
    });

    // Occasional freelance income (skip if too early in current month)
    if (dayCap >= 15) {
      txns.push({
        id: randomUUID(),
        date: isoDate(year, month, 15),
        description: "Freelance project",
        category: "Freelance",
        type: "Income",
        amount: randBetween(8000, 15000),
        notes: null,
      });
    }

    // Quarterly bonus (only in the oldest seeded month)
    if (i === 3 && dayCap >= 20) {
      txns.push({
        id: randomUUID(),
        date: isoDate(year, month, 20),
        description: "Performance bonus",
        category: "Bonus",
        type: "Income",
        amount: 25000,
        notes: "Quarterly incentive",
      });
    }

    // Expenses spread through the month
    for (const exp of EXPENSE_CATEGORIES) {
      const day =
        exp.category === "Housing"
          ? 3
          : 2 + Math.floor(Math.random() * (dayCap - 2));
      if (day > dayCap) continue;
      txns.push({
        id: randomUUID(),
        date: isoDate(year, month, day),
        description: exp.description,
        category: exp.category,
        type: "Expense",
        amount: randBetween(exp.min, exp.max),
        notes: null,
      });
    }

    // Investments (SIP) on the 5th
    if (dayCap >= 5) {
      txns.push({
        id: randomUUID(),
        date: isoDate(year, month, 5),
        description: "Axis Bluechip SIP",
        category: "Mutual Fund",
        type: "Investment",
        amount: 10000,
        notes: "Monthly SIP",
      });
      txns.push({
        id: randomUUID(),
        date: isoDate(year, month, 5),
        description: "Nifty 50 index stocks",
        category: "Stocks",
        type: "Investment",
        amount: 5000,
        notes: null,
      });
    }
  }

  return txns;
}

export async function seedIfEmpty(now = new Date()): Promise<boolean> {
  const existing = await db.select().from(transactionsTable).limit(1);
  if (existing.length > 0) return false;

  const txns = buildSeedTransactions(now);
  await db.insert(transactionsTable).values(txns);

  // Seed budgets (idempotent upsert)
  for (const b of BUDGETS) {
    await db
      .insert(budgetsTable)
      .values(b)
      .onConflictDoUpdate({ target: budgetsTable.category, set: { limit: b.limit } });
  }

  // Mark that the current data set is sample/seed data.
  await db
    .insert(metaTable)
    .values({ key: SEEDED_META_KEY, value: "true" })
    .onConflictDoUpdate({ target: metaTable.key, set: { value: "true" } });

  return true;
}

// Mark the data set as user-modified so it is no longer treated as sample data.
export async function clearSeededFlag(): Promise<void> {
  await db
    .insert(metaTable)
    .values({ key: SEEDED_META_KEY, value: "false" })
    .onConflictDoUpdate({ target: metaTable.key, set: { value: "false" } });
}
