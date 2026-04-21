import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { categories, users } from "@shared/schema";
import {
  setupSession,
  requireAuth,
  hashSecret,
  verifySecret,
  ensureUser,
} from "./auth";
import { eq } from "drizzle-orm";

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

  // Setup session middleware
  setupSession(app);

  // Auth routes (public)
  app.get(api.auth.status.path, async (req, res) => {
    const user = await storage.getUser();
    const isSetup = !!(user?.passwordHash && user?.username);
    res.json({
      isSetup,
      isAuthenticated: !!req.session?.isAuthenticated && isSetup,
      username: user?.username ?? null,
    });
  });

  app.post(api.auth.setup.path, async (req, res) => {
    try {
      const input = api.auth.setup.input.parse(req.body);
      const user = await ensureUser();
      if (user.passwordHash && user.username) {
        return res.status(400).json({ message: "Account already set up" });
      }
      const passwordHash = await hashSecret(input.password);
      const securityAnswerHash = await hashSecret(input.securityAnswer.trim().toLowerCase());
      await db.update(users)
        .set({
          username: input.username.trim(),
          passwordHash,
          securityQuestion: input.securityQuestion.trim(),
          securityAnswerHash,
        })
        .where(eq(users.id, user.id));
      req.session.isAuthenticated = true;
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUser();
      if (!user?.passwordHash || !user?.username) {
        return res.status(400).json({ message: "Account not set up yet" });
      }
      if (user.username.toLowerCase() !== input.username.trim().toLowerCase()) {
        return res.status(401).json({ message: "Incorrect username or password" });
      }
      const ok = await verifySecret(input.password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "Incorrect username or password" });
      }
      req.session.isAuthenticated = true;
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("wealthwise.sid", { path: "/" });
      res.json({ success: true });
    });
  });

  app.post(api.auth.recoveryQuestion.path, async (req, res) => {
    try {
      const input = api.auth.recoveryQuestion.input.parse(req.body);
      const user = await storage.getUser();
      if (!user?.username || !user?.securityQuestion ||
          user.username.toLowerCase() !== input.username.trim().toLowerCase()) {
        return res.status(404).json({ message: "No account found for that username" });
      }
      res.json({ question: user.securityQuestion });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const input = api.auth.resetPassword.input.parse(req.body);
      const user = await storage.getUser();
      if (!user?.username || !user?.securityAnswerHash ||
          user.username.toLowerCase() !== input.username.trim().toLowerCase()) {
        return res.status(404).json({ message: "No account found for that username" });
      }
      const ok = await verifySecret(input.securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
      if (!ok) {
        return res.status(401).json({ message: "Incorrect answer to your security question" });
      }
      const newHash = await hashSecret(input.newPassword);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Protect all subsequent /api routes
  app.use("/api", requireAuth);

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
