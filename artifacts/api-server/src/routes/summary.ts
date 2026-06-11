import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable, metaTable } from "@workspace/db";
import { GetSummaryResponse } from "@workspace/api-zod";
import { computeSummary } from "../lib/finance";
import { SEEDED_META_KEY } from "../lib/seed";

const router: IRouter = Router();

router.get("/summary", async (_req, res): Promise<void> => {
  const [transactions, seededRows] = await Promise.all([
    db.select().from(transactionsTable),
    db.select().from(metaTable).where(eq(metaTable.key, SEEDED_META_KEY)),
  ]);
  const isSampleData = seededRows[0]?.value === "true";
  res.json(
    GetSummaryResponse.parse({ ...computeSummary(transactions), isSampleData }),
  );
});

export default router;
