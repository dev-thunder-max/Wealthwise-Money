import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  currencyPreference: text("currency_preference").default('USD').notNull()
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'cash', 'bank', 'credit', 'savings', 'mfs', 'investment'
  balance: integer("balance").default(0).notNull() // Stored in cents
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  type: text("type").notNull() // 'income', 'expense'
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(), // Stored in cents
  date: text("date").notNull(), // ISO string YYYY-MM-DD
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  accountId: integer("account_id").references(() => accounts.id),
  toAccountId: integer("to_account_id").references(() => accounts.id),
  type: text("type").notNull() // 'income', 'expense', 'transfer'
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  limitAmount: integer("limit_amount").notNull(), // Stored in cents
  period: text("period").default('monthly').notNull()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull()
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
