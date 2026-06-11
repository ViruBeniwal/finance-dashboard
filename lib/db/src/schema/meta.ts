import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metaTable = pgTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const insertMetaSchema = createInsertSchema(metaTable);
export type InsertMeta = z.infer<typeof insertMetaSchema>;
export type Meta = typeof metaTable.$inferSelect;
