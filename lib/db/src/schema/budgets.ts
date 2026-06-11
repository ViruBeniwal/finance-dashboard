import { pgTable, text, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetsTable = pgTable("budgets", {
  category: text("category").primaryKey(),
  limit: doublePrecision("limit").notNull(),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable);
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;
