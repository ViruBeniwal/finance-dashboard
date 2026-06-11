import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, ilike, lte, or, inArray } from "drizzle-orm";
import { db, transactionsTable, budgetsTable, metaTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
  BulkDeleteTransactionsBody,
} from "@workspace/api-zod";
import { clearSeededFlag } from "../lib/seed";

const router: IRouter = Router();

function serialize(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    date: t.date,
    description: t.description,
    category: t.category,
    type: t.type,
    amount: t.amount,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { type, category, search, startDate, endDate } = query.data;

  const conditions = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(transactionsTable.description, pattern),
        ilike(transactionsTable.category, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt));

  res.json(ListTransactionsResponse.parse(rows.map(serialize)));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(transactionsTable)
    .values({
      id: randomUUID(),
      date: parsed.data.date,
      description: parsed.data.description,
      category: parsed.data.category,
      type: parsed.data.type,
      amount: parsed.data.amount,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  await clearSeededFlag();
  res.status(201).json(UpdateTransactionResponse.parse(serialize(row)));
});

// Bulk delete must be registered before the parametrized routes.
router.post("/transactions/bulk-delete", async (req, res): Promise<void> => {
  const parsed = BulkDeleteTransactionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.ids.length > 0) {
    await db
      .delete(transactionsTable)
      .where(inArray(transactionsTable.id, parsed.data.ids));
    await clearSeededFlag();
  }
  res.sendStatus(204);
});

router.delete("/transactions", async (_req, res): Promise<void> => {
  await db.delete(transactionsTable);
  await db.delete(budgetsTable);
  await db.delete(metaTable);
  res.sendStatus(204);
});

router.put("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(transactionsTable)
    .set({
      date: parsed.data.date,
      description: parsed.data.description,
      category: parsed.data.category,
      type: parsed.data.type,
      amount: parsed.data.amount,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  await clearSeededFlag();
  res.json(UpdateTransactionResponse.parse(serialize(row)));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  await clearSeededFlag();
  res.sendStatus(204);
});

export default router;
