import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("wealthwise.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    currency_preference TEXT DEFAULT 'USD'
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'cash', 'bank', 'credit', 'savings', 'mfs', 'investment'
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL -- 'income', 'expense'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    account_id INTEGER,
    to_account_id INTEGER, -- For transfers
    type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    limit_amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly',
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Seed default categories if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)");
  const defaults = [
    ['Salary', 'Briefcase', '#10b981', 'income'],
    ['Freelance', 'Laptop', '#3b82f6', 'income'],
    ['Food', 'Utensils', '#ef4444', 'expense'],
    ['Rent', 'Home', '#f59e0b', 'expense'],
    ['Transport', 'Car', '#8b5cf6', 'expense'],
    ['Entertainment', 'Film', '#ec4899', 'expense'],
    ['Shopping', 'ShoppingBag', '#6366f1', 'expense'],
    ['Health', 'Heart', '#f43f5e', 'expense'],
    ['Utilities', 'Zap', '#06b6d4', 'expense'],
  ];
  defaults.forEach(cat => insertCategory.run(...cat));
}

// Seed default user if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, currency_preference) VALUES (?, ?)").run('user@example.com', 'USD');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user);
  });

  app.post("/api/user/settings", (req, res) => {
    const { currency_preference } = req.body;
    db.prepare("UPDATE users SET currency_preference = ?").run(currency_preference);
    res.json({ success: true });
  });

  app.get("/api/accounts", (req, res) => {
    const accounts = db.prepare("SELECT * FROM accounts").all();
    res.json(accounts);
  });

  app.post("/api/accounts", (req, res) => {
    const { name, type, balance } = req.body;
    const result = db.prepare("INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)").run(name, type, balance || 0);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      ORDER BY t.date DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { amount, date, description, category_id, account_id, type, to_account_id } = req.body;
    
    const transaction = db.transaction(() => {
      // Insert transaction
      const result = db.prepare(`
        INSERT INTO transactions (amount, date, description, category_id, account_id, to_account_id, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(amount, date, description, category_id, account_id, to_account_id, type);

      // Update account balances
      if (type === 'income') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'expense') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'transfer') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to_account_id);
      }

      return result.lastInsertRowid;
    });

    const id = transaction();
    res.json({ id });
  });

  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
    `).all();
    res.json(budgets);
  });

  app.post("/api/budgets", (req, res) => {
    const { category_id, limit_amount } = req.body;
    const existing = db.prepare("SELECT id FROM budgets WHERE category_id = ?").get(category_id) as { id: number } | undefined;
    if (existing) {
      db.prepare("UPDATE budgets SET limit_amount = ? WHERE id = ?").run(limit_amount, existing.id);
      res.json({ id: existing.id });
    } else {
      const result = db.prepare("INSERT INTO budgets (category_id, limit_amount) VALUES (?, ?)").run(category_id, limit_amount);
      res.json({ id: result.lastInsertRowid });
    }
  });

  app.post("/api/reset", (req, res) => {
    db.transaction(() => {
      db.prepare("DELETE FROM transactions").run();
      db.prepare("DELETE FROM budgets").run();
      db.prepare("DELETE FROM accounts").run();
      // Reset user preference if needed
      db.prepare("UPDATE users SET currency_preference = 'USD'").run();
    })();
    res.json({ success: true });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { amount, date, description, category_id, account_id, type, to_account_id } = req.body;

    const transaction = db.transaction(() => {
      // 1. Get old transaction to revert its impact
      const old = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
      if (!old) throw new Error("Transaction not found");

      // Revert old impact
      if (old.type === 'income') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.account_id);
      } else if (old.type === 'expense') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
      } else if (old.type === 'transfer') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.to_account_id);
      }

      // 2. Update transaction
      db.prepare(`
        UPDATE transactions 
        SET amount = ?, date = ?, description = ?, category_id = ?, account_id = ?, to_account_id = ?, type = ?
        WHERE id = ?
      `).run(amount, date, description, category_id, account_id, to_account_id, type, id);

      // 3. Apply new impact
      if (type === 'income') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'expense') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'transfer') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to_account_id);
      }

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const transaction = db.transaction(() => {
      const old = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
      if (!old) throw new Error("Transaction not found");

      // Revert impact
      if (old.type === 'income') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.account_id);
      } else if (old.type === 'expense') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
      } else if (old.type === 'transfer') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.to_account_id);
      }

      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { deleteTransactions } = req.query;

    const transaction = db.transaction(() => {
      if (deleteTransactions === 'true') {
        db.prepare("DELETE FROM transactions WHERE account_id = ? OR to_account_id = ?").run(id, id);
      } else {
        // Orphan them or link to null
        db.prepare("UPDATE transactions SET account_id = NULL WHERE account_id = ?").run(id);
        db.prepare("UPDATE transactions SET to_account_id = NULL WHERE to_account_id = ?").run(id);
      }
      db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
    });

    transaction();
    res.json({ success: true });
  });

  app.get("/api/export", (req, res) => {
    const { startDate, endDate, format } = req.query;
    let query = `
      SELECT t.date, t.description, t.type, t.amount, c.name as category, a.name as account
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      query += ` WHERE t.date BETWEEN ? AND ? `;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY t.date DESC `;
    
    const transactions = db.prepare(query).all(...params) as any[];
    
    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Type', 'Amount', 'Category', 'Account'];
      const rows = transactions.map(t => [
        t.date,
        `"${t.description?.replace(/"/g, '""') || ''}"`,
        t.type,
        t.amount,
        t.category || '',
        t.account || ''
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
    res.send(JSON.stringify(transactions, null, 2));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
