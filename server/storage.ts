import { db } from "./db";
import {
  users, accounts, categories, transactions, budgets,
  type User, type InsertUser,
  type Account, type InsertAccount,
  type Category, type InsertCategory,
  type Transaction, type InsertTransaction,
  type Budget, type InsertBudget
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(): Promise<User | undefined>;
  updateUserPreference(currencyPreference: string): Promise<User | undefined>;
  
  getAccounts(): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  deleteAccount(id: number): Promise<void>;
  updateAccountBalance(id: number, balanceChange: number): Promise<void>;

  getCategories(): Promise<Category[]>;
  
  getTransactions(): Promise<(Transaction & { categoryName?: string, categoryIcon?: string, categoryColor?: string, accountName?: string })[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  
  getBudgets(): Promise<(Budget & { categoryName?: string, categoryColor?: string })[]>;
  upsertBudget(budget: InsertBudget): Promise<Budget>;

  wipeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(): Promise<User | undefined> {
    const [user] = await db.select().from(users).limit(1);
    return user;
  }

  async updateUserPreference(currencyPreference: string): Promise<User | undefined> {
    const user = await this.getUser();
    if (!user) {
      const [newUser] = await db.insert(users).values({ email: "user@example.com", currencyPreference }).returning();
      return newUser;
    }
    const [updatedUser] = await db.update(users)
      .set({ currencyPreference })
      .where(eq(users.id, user.id))
      .returning();
    return updatedUser;
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async updateAccountBalance(id: number, balanceChange: number): Promise<void> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    if (account) {
      await db.update(accounts).set({ balance: account.balance + balanceChange }).where(eq(accounts.id, id));
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getTransactions(): Promise<(Transaction & { categoryName?: string, categoryIcon?: string, categoryColor?: string, accountName?: string })[]> {
    const txs = await db.select({
      id: transactions.id,
      amount: transactions.amount,
      date: transactions.date,
      description: transactions.description,
      categoryId: transactions.categoryId,
      accountId: transactions.accountId,
      toAccountId: transactions.toAccountId,
      type: transactions.type,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      accountName: accounts.name
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .orderBy(desc(transactions.date));
    return txs;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(transaction).returning();
    return newTx;
  }

  async updateTransaction(id: number, transaction: InsertTransaction): Promise<Transaction> {
    const [updatedTx] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return updatedTx;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getBudgets(): Promise<(Budget & { categoryName?: string, categoryColor?: string })[]> {
    return await db.select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      limitAmount: budgets.limitAmount,
      period: budgets.period,
      categoryName: categories.name,
      categoryColor: categories.color
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id));
  }

  async upsertBudget(budget: InsertBudget): Promise<Budget> {
    const [existing] = await db.select().from(budgets).where(eq(budgets.categoryId, budget.categoryId));
    if (existing) {
      const [updated] = await db.update(budgets)
        .set({ limitAmount: budget.limitAmount, period: budget.period })
        .where(eq(budgets.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newBudget] = await db.insert(budgets).values(budget).returning();
      return newBudget;
    }
  }

  async wipeData(): Promise<void> {
    await db.delete(transactions);
    await db.delete(budgets);
    await db.delete(accounts);
  }
}

export const storage = new DatabaseStorage();
