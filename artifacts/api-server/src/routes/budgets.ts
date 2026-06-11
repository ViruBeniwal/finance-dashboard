import { Router, type IRouter } from "express";
import { db, budgetsTable, transactionsTable } from "@workspace/db";
import {
  ListBudgetsResponse,
  SetBudgetBody,
  SetBudgetResponse,
} from "@workspace/api-zod";
import { computeSpentThisMonth } from "../lib/finance";
import { clearSeededFlag } from "../lib/seed";

const router: IRouter = Router();

router.get("/budgets", async (_req, res): Promise<void> => {
  const [budgets, transactions] = await Promise.all([
    db.select().from(budgetsTable),
    db.select().from(transactionsTable),
  ]);

  const spent = computeSpentThisMonth(transactions);

  const result = budgets
    .map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: spent.get(b.category) ?? 0,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  res.json(ListBudgetsResponse.parse(result));
});

router.post("/budgets", async (req, res): Promise<void> => {
  const parsed = SetBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [budget] = await db
    .insert(budgetsTable)
    .values({ category: parsed.data.category, limit: parsed.data.limit })
    .onConflictDoUpdate({
      target: budgetsTable.category,
      set: { limit: parsed.data.limit },
    })
    .returning();

  await clearSeededFlag();

  const transactions = await db.select().from(transactionsTable);
  const spent = computeSpentThisMonth(transactions);

  res.json(
    SetBudgetResponse.parse({
      category: budget.category,
      limit: budget.limit,
      spent: spent.get(budget.category) ?? 0,
    }),
  );
});

export default router;
