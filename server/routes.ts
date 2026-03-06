import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { categories, users } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function seedDatabase() {
  const existingUser = await storage.getUser();
  if (!existingUser) {
    await db.insert(users).values({ email: "user@example.com", currencyPreference: "USD" });
  }

  const existingCategories = await storage.getCategories();
  if (existingCategories.length === 0) {
    const defaults = [
      { name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'income' },
      { name: 'Freelance', icon: 'Laptop', color: '#3b82f6', type: 'income' },
      { name: 'Food', icon: 'Utensils', color: '#ef4444', type: 'expense' },
      { name: 'Rent', icon: 'Home', color: '#f59e0b', type: 'expense' },
      { name: 'Transport', icon: 'Car', color: '#8b5cf6', type: 'expense' },
      { name: 'Entertainment', icon: 'Film', color: '#ec4899', type: 'expense' },
      { name: 'Shopping', icon: 'ShoppingBag', color: '#6366f1', type: 'expense' },
      { name: 'Health', icon: 'Heart', color: '#f43f5e', type: 'expense' },
      { name: 'Utilities', icon: 'Zap', color: '#06b6d4', type: 'expense' }
    ];
    await db.insert(categories).values(defaults);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed initial data
  seedDatabase().catch(console.error);

  app.get(api.user.get.path, async (req, res) => {
    const user = await storage.getUser();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post(api.user.updateSettings.path, async (req, res) => {
    try {
      const input = api.user.updateSettings.input.parse(req.body);
      await storage.updateUserPreference(input.currencyPreference);
      res.json({ success: true });
    } catch(err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.accounts.list.path, async (req, res) => {
    const accounts = await storage.getAccounts();
    res.json(accounts);
  });

  app.post(api.accounts.create.path, async (req, res) => {
    try {
      const input = api.accounts.create.input.parse(req.body);
      const account = await storage.createAccount(input);
      res.status(201).json(account);
    } catch(err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.accounts.delete.path, async (req, res) => {
    await storage.deleteAccount(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.transactions.list.path, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction(input);
      
      // Update account balances
      if (input.type === 'income') {
        await storage.updateAccountBalance(input.accountId!, input.amount);
      } else if (input.type === 'expense') {
        await storage.updateAccountBalance(input.accountId!, -input.amount);
      } else if (input.type === 'transfer') {
        await storage.updateAccountBalance(input.accountId!, -input.amount);
        await storage.updateAccountBalance(input.toAccountId!, input.amount);
      }
      
      res.status(201).json(tx);
    } catch(err) {
       if (err instanceof z.ZodError) {
          return res.status(400).json({
            message: err.errors[0].message,
            field: err.errors[0].path.join('.'),
          });
        }
        throw err;
    }
  });

  app.put(api.transactions.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.transactions.update.input.parse(req.body);
      const oldTx = await storage.getTransaction(id);
      if (!oldTx) return res.status(404).json({ message: "Transaction not found" });

      // Revert old transaction
      if (oldTx.type === 'income') {
        await storage.updateAccountBalance(oldTx.accountId!, -oldTx.amount);
      } else if (oldTx.type === 'expense') {
        await storage.updateAccountBalance(oldTx.accountId!, oldTx.amount);
      } else if (oldTx.type === 'transfer') {
        await storage.updateAccountBalance(oldTx.accountId!, oldTx.amount);
        await storage.updateAccountBalance(oldTx.toAccountId!, -oldTx.amount);
      }

      const tx = await storage.updateTransaction(id, input);

      // Apply new transaction
      if (input.type === 'income') {
        await storage.updateAccountBalance(input.accountId!, input.amount);
      } else if (input.type === 'expense') {
        await storage.updateAccountBalance(input.accountId!, -input.amount);
      } else if (input.type === 'transfer') {
        await storage.updateAccountBalance(input.accountId!, -input.amount);
        await storage.updateAccountBalance(input.toAccountId!, input.amount);
      }

      res.json(tx);
    } catch(err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const oldTx = await storage.getTransaction(id);
    if (!oldTx) return res.status(404).json({ message: "Transaction not found" });

    // Revert transaction
    if (oldTx.type === 'income') {
      await storage.updateAccountBalance(oldTx.accountId!, -oldTx.amount);
    } else if (oldTx.type === 'expense') {
      await storage.updateAccountBalance(oldTx.accountId!, oldTx.amount);
    } else if (oldTx.type === 'transfer') {
      await storage.updateAccountBalance(oldTx.accountId!, oldTx.amount);
      await storage.updateAccountBalance(oldTx.toAccountId!, -oldTx.amount);
    }

    await storage.deleteTransaction(id);
    res.status(204).send();
  });

  app.get(api.budgets.list.path, async (req, res) => {
    const budgets = await storage.getBudgets();
    res.json(budgets);
  });

  app.post(api.budgets.upsert.path, async (req, res) => {
    try {
      const input = api.budgets.upsert.input.parse(req.body);
      const budget = await storage.upsertBudget(input);
      res.json(budget);
    } catch(err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.settings.wipe.path, async (req, res) => {
    await storage.wipeData();
    res.json({ success: true });
  });

  app.get(api.settings.export.path, async (req, res) => {
    const format = req.query.format as string;
    const txs = await storage.getTransactions();
    
    if (format === 'csv') {
      const header = "Date,Description,Type,Amount,Category,Account\n";
      const rows = txs.map(t => `${t.date},${t.description || ''},${t.type},${t.amount/100},${t.categoryName || ''},${t.accountName || ''}`).join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=wealthwise_export.csv');
      return res.send(header + rows);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=wealthwise_export.json');
    res.json(txs);
  });

  return httpServer;
}
