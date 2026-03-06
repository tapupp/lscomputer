import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import multer from "multer";
import { google } from "googleapis";

const db = new Database("shop.db");
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Multer setup for backup restores
const upload = multer({ dest: 'uploads/' });

// Initialize Database Schema
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfs_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      commission REAL DEFAULT 0,
      customer_phone TEXT,
      trx_id TEXT,
      vendor_id INTEGER,
      shop_number_id INTEGER,
      payment_status TEXT DEFAULT 'Paid', -- Paid, Partial, Due
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      customer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recharge_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Recharge',
      amount REAL NOT NULL,
      profit REAL DEFAULT 0,
      customer_phone TEXT,
      vendor_id INTEGER,
      shop_number_id INTEGER,
      payment_status TEXT DEFAULT 'Paid',
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      customer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_type TEXT NOT NULL,
      variant TEXT NOT NULL,
      pages INTEGER NOT NULL,
      price REAL NOT NULL,
      cost REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Paid',
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      customer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT UNIQUE,
      quantity INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS other_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      amount REAL NOT NULL,
      profit REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Paid',
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      customer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'Paid',
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      vendor_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shop_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      type TEXT NOT NULL,
      number TEXT NOT NULL,
      password TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      description TEXT NOT NULL,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendor_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff', -- 'admin' or 'staff'
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initial Data
  db.exec(`
    INSERT OR IGNORE INTO inventory (item_name, quantity) VALUES ('Paper Rims', 0);
    INSERT OR IGNORE INTO settings (key, value) VALUES ('bkash_cashout_comm', '4.5');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('nagad_cashout_comm', '4.0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('rocket_cashout_comm', '4.0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('cost_bw', '2.0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('cost_color', '12.0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('bkash_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('nagad_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('rocket_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('gp_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('robi_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('bl_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('airtel_opening_balance', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('teletalk_opening_balance', '0');
  `);

} catch (err) {
  console.error("Database initialization failed:", err);
}

try {
  // Migration: Add cost column to service_sales if it doesn't exist
  const tableInfo = db.prepare("PRAGMA table_info(service_sales)").all();
  const hasCostColumn = tableInfo.some((col: any) => col.name === 'cost');
  if (!hasCostColumn && tableInfo.length > 0) {
    db.exec("ALTER TABLE service_sales ADD COLUMN cost REAL DEFAULT 0");
  }

  // Migration: Add vendor_id and type to recharge_transactions
  const rechargeTableInfo = db.prepare("PRAGMA table_info(recharge_transactions)").all();
  if (rechargeTableInfo.length > 0) {
    if (!rechargeTableInfo.some((col: any) => col.name === 'vendor_id')) {
      db.exec("ALTER TABLE recharge_transactions ADD COLUMN vendor_id INTEGER");
    }
    if (!rechargeTableInfo.some((col: any) => col.name === 'type')) {
      db.exec("ALTER TABLE recharge_transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'Recharge'");
    }
    if (!rechargeTableInfo.some((col: any) => col.name === 'shop_number_id')) {
      db.exec("ALTER TABLE recharge_transactions ADD COLUMN shop_number_id INTEGER");
    }
    // Migration: Add payment columns to recharge_transactions
    if (!rechargeTableInfo.some((col: any) => col.name === 'payment_status')) db.exec("ALTER TABLE recharge_transactions ADD COLUMN payment_status TEXT DEFAULT 'Paid'");
    if (!rechargeTableInfo.some((col: any) => col.name === 'paid_amount')) db.exec("ALTER TABLE recharge_transactions ADD COLUMN paid_amount REAL DEFAULT 0");
    if (!rechargeTableInfo.some((col: any) => col.name === 'due_amount')) db.exec("ALTER TABLE recharge_transactions ADD COLUMN due_amount REAL DEFAULT 0");
    if (!rechargeTableInfo.some((col: any) => col.name === 'customer_id')) db.exec("ALTER TABLE recharge_transactions ADD COLUMN customer_id INTEGER");
  }

  // Migration: Add vendor_id to mfs_transactions
  const mfsTableInfo = db.prepare("PRAGMA table_info(mfs_transactions)").all();
  if (mfsTableInfo.length > 0) {
    if (!mfsTableInfo.some((col: any) => col.name === 'vendor_id')) {
      db.exec("ALTER TABLE mfs_transactions ADD COLUMN vendor_id INTEGER");
    }
    if (!mfsTableInfo.some((col: any) => col.name === 'shop_number_id')) {
      db.exec("ALTER TABLE mfs_transactions ADD COLUMN shop_number_id INTEGER");
    }
    // Migration: Add payment columns to mfs_transactions
    if (!mfsTableInfo.some((col: any) => col.name === 'payment_status')) db.exec("ALTER TABLE mfs_transactions ADD COLUMN payment_status TEXT DEFAULT 'Paid'");
    if (!mfsTableInfo.some((col: any) => col.name === 'paid_amount')) db.exec("ALTER TABLE mfs_transactions ADD COLUMN paid_amount REAL DEFAULT 0");
    if (!mfsTableInfo.some((col: any) => col.name === 'due_amount')) db.exec("ALTER TABLE mfs_transactions ADD COLUMN due_amount REAL DEFAULT 0");
    if (!mfsTableInfo.some((col: any) => col.name === 'customer_id')) db.exec("ALTER TABLE mfs_transactions ADD COLUMN customer_id INTEGER");
  }

  // Migration: Add payment columns to service_sales
  if (tableInfo.length > 0) {
    if (!tableInfo.some((col: any) => col.name === 'payment_status')) db.exec("ALTER TABLE service_sales ADD COLUMN payment_status TEXT DEFAULT 'Paid'");
    if (!tableInfo.some((col: any) => col.name === 'paid_amount')) db.exec("ALTER TABLE service_sales ADD COLUMN paid_amount REAL DEFAULT 0");
    if (!tableInfo.some((col: any) => col.name === 'due_amount')) db.exec("ALTER TABLE service_sales ADD COLUMN due_amount REAL DEFAULT 0");
    if (!tableInfo.some((col: any) => col.name === 'customer_id')) db.exec("ALTER TABLE service_sales ADD COLUMN customer_id INTEGER");
  }

  // Migration: Add payment columns to other_sales
  const otherSalesTableInfo = db.prepare("PRAGMA table_info(other_sales)").all();
  if (otherSalesTableInfo.length > 0) {
    if (!otherSalesTableInfo.some((col: any) => col.name === 'payment_status')) db.exec("ALTER TABLE other_sales ADD COLUMN payment_status TEXT DEFAULT 'Paid'");
    if (!otherSalesTableInfo.some((col: any) => col.name === 'paid_amount')) db.exec("ALTER TABLE other_sales ADD COLUMN paid_amount REAL DEFAULT 0");
    if (!otherSalesTableInfo.some((col: any) => col.name === 'due_amount')) db.exec("ALTER TABLE other_sales ADD COLUMN due_amount REAL DEFAULT 0");
    if (!otherSalesTableInfo.some((col: any) => col.name === 'customer_id')) db.exec("ALTER TABLE other_sales ADD COLUMN customer_id INTEGER");
  }

  // Migration: Add payment columns to expenses
  const expensesTableInfo = db.prepare("PRAGMA table_info(expenses)").all();
  if (expensesTableInfo.length > 0) {
    if (!expensesTableInfo.some((col: any) => col.name === 'payment_status')) db.exec("ALTER TABLE expenses ADD COLUMN payment_status TEXT DEFAULT 'Paid'");
    if (!expensesTableInfo.some((col: any) => col.name === 'paid_amount')) db.exec("ALTER TABLE expenses ADD COLUMN paid_amount REAL DEFAULT 0");
    if (!expensesTableInfo.some((col: any) => col.name === 'due_amount')) db.exec("ALTER TABLE expenses ADD COLUMN due_amount REAL DEFAULT 0");
    if (!expensesTableInfo.some((col: any) => col.name === 'vendor_id')) db.exec("ALTER TABLE expenses ADD COLUMN vendor_id INTEGER");
  }

} catch (err) {
  console.error("Migration failed:", err);
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'deshishop-secret-key-change-this';

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // Debug logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  const PORT = 3000;

  // Initialize Admin User
  const initAdmin = async () => {
    const adminUser = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run('admin', hashedPassword, 'admin', 'Administrator');
      console.log("Default admin user created: admin / admin123");
    }
  };
  initAdmin();

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth Endpoints
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
      } else {
        res.status(400).json({ error: "Invalid password" });
      }
    } catch (e) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User Management Endpoints (Admin Only)
  app.get("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = db.prepare("SELECT id, username, role, name, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/users", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { username, password, role, name } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)");
      const info = stmt.run(username, hashedPassword, role || 'staff', name);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: "Username likely already exists" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // MFS Endpoints
  app.post("/api/mfs", (req, res) => {
    try {
      const { operator, type, amount, customer_phone, trx_id, vendor_id, shop_number_id, payment_status, paid_amount, due_amount, customer_id } = req.body;
      let commission = 0;
      if (type === "Cash-out") {
        const commRate = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(`${operator.toLowerCase()}_cashout_comm`)?.value || "0");
        commission = (amount / 1000) * commRate;
      }
      
      // Default values for payment fields if not provided
      const pStatus = payment_status || 'Paid';
      const pPaid = paid_amount !== undefined ? paid_amount : amount;
      const pDue = due_amount !== undefined ? due_amount : 0;

      const stmt = db.prepare(`
        INSERT INTO mfs_transactions (operator, type, amount, commission, customer_phone, trx_id, vendor_id, shop_number_id, payment_status, paid_amount, due_amount, customer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(operator, type, amount, commission, customer_phone, trx_id, vendor_id, shop_number_id, pStatus, pPaid, pDue, customer_id);

      // Handle Customer Due
      if (pDue > 0 && customer_id) {
        db.prepare("INSERT INTO customer_transactions (customer_id, type, amount, description) VALUES (?, ?, ?, ?)")
          .run(customer_id, 'Due', pDue, `Due for MFS ${type} (${operator}) - TrxID: ${trx_id || 'N/A'}`);
      }

      // Sync with Vendor Ledger if it's a B2B transaction
      if (vendor_id && (type === 'B2B-Buy' || type === 'B2B-Pay')) {
        const vendorType = type === 'B2B-Buy' ? 'Purchase' : 'Payment';
        const description = `${type} (${operator}): ${customer_phone || ''} (Ref: MFS-${info.lastInsertRowid})`;
        
        const vStmt = db.prepare("INSERT INTO vendor_transactions (vendor_id, type, amount, description) VALUES (?, ?, ?, ?)");
        const vInfo = vStmt.run(vendor_id, vendorType, amount, description);

        // If it's a payment, also record it as an expense
        if (vendorType === 'Payment') {
          const vendor = db.prepare("SELECT name FROM vendors WHERE id = ?").get(vendor_id);
          db.prepare("INSERT INTO expenses (category, description, amount) VALUES (?, ?, ?)")
            .run('Vendor Payment', `Paid to ${vendor.name}: ${description} (Ref: VT-${vInfo.lastInsertRowid})`, amount);
        }
      }

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("MFS Transaction Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/mfs/balances", (req, res) => {
    const operators = ['bKash', 'Nagad', 'Rocket'];
    const balances: any = {};

    operators.forEach(op => {
      const opening = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(`${op.toLowerCase()}_opening_balance`)?.value || "0");
      
      const stats = db.prepare(`
        SELECT 
          SUM(CASE WHEN type IN ('Cash-out', 'Receive', 'B2B-Buy') THEN amount ELSE 0 END) as total_in,
          SUM(CASE WHEN type IN ('Cash-in', 'B2B-Pay') THEN amount ELSE 0 END) as total_out
        FROM mfs_transactions 
        WHERE operator = ?
      `).get(op);

      balances[op] = opening + (stats.total_in || 0) - (stats.total_out || 0);
    });

    res.json(balances);
  });

  app.get("/api/mfs", (req, res) => {
    const { search } = req.query;
    let query = "SELECT * FROM mfs_transactions";
    const params = [];
    if (search) {
      query += " WHERE customer_phone LIKE ? OR trx_id LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY timestamp DESC LIMIT 50";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  // Recharge Endpoints
  app.post("/api/recharge", (req, res) => {
    try {
      const { operator, type, amount, customer_phone, vendor_id, shop_number_id, payment_status, paid_amount, due_amount, customer_id } = req.body;
      const profit = (type === 'Recharge') ? amount * 0.025 : 0; // Default 2.5% profit for recharge
      
      const pStatus = payment_status || 'Paid';
      const pPaid = paid_amount !== undefined ? paid_amount : amount;
      const pDue = due_amount !== undefined ? due_amount : 0;

      const stmt = db.prepare(`
        INSERT INTO recharge_transactions (operator, type, amount, profit, customer_phone, vendor_id, shop_number_id, payment_status, paid_amount, due_amount, customer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(operator, type || 'Recharge', amount, profit, customer_phone, vendor_id, shop_number_id, pStatus, pPaid, pDue, customer_id);

      // Handle Customer Due
      if (pDue > 0 && customer_id) {
        db.prepare("INSERT INTO customer_transactions (customer_id, type, amount, description) VALUES (?, ?, ?, ?)")
          .run(customer_id, 'Due', pDue, `Due for Recharge ${operator} - ${customer_phone}`);
      }

      // Sync with Vendor Ledger if it's a B2B transaction
      if (vendor_id && (type === 'B2B-Buy' || type === 'B2B-Pay')) {
        const vendorType = type === 'B2B-Buy' ? 'Purchase' : 'Payment';
        const description = `${type} (${operator}): ${customer_phone || ''} (Ref: REC-${info.lastInsertRowid})`;
        
        const vStmt = db.prepare("INSERT INTO vendor_transactions (vendor_id, type, amount, description) VALUES (?, ?, ?, ?)");
        const vInfo = vStmt.run(vendor_id, vendorType, amount, description);

        // If it's a payment, also record it as an expense
        if (vendorType === 'Payment') {
          const vendor = db.prepare("SELECT name FROM vendors WHERE id = ?").get(vendor_id);
          db.prepare("INSERT INTO expenses (category, description, amount) VALUES (?, ?, ?)")
            .run('Vendor Payment', `Paid to ${vendor.name}: ${description} (Ref: VT-${vInfo.lastInsertRowid})`, amount);
        }
      }

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Recharge Transaction Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/recharge/balances", (req, res) => {
    const operators = ['GP', 'Robi', 'BL', 'Airtel', 'Teletalk'];
    const balances: any = {};

    operators.forEach(op => {
      const opening = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(`${op.toLowerCase()}_opening_balance`)?.value || "0");
      
      const stats = db.prepare(`
        SELECT 
          SUM(CASE WHEN type IN ('B2B-Buy') THEN amount ELSE 0 END) as total_in,
          SUM(CASE WHEN type IN ('Recharge', 'B2B-Pay') THEN amount ELSE 0 END) as total_out
        FROM recharge_transactions 
        WHERE operator = ?
      `).get(op);

      balances[op] = opening + (stats.total_in || 0) - (stats.total_out || 0);
    });

    res.json(balances);
  });

  app.get("/api/recharge", (req, res) => {
    const rows = db.prepare("SELECT * FROM recharge_transactions ORDER BY timestamp DESC LIMIT 50").all();
    res.json(rows);
  });

  // Service Endpoints
  app.post("/api/services", (req, res) => {
    try {
      const { service_type, variant, pages, price, payment_status, paid_amount, due_amount, customer_id } = req.body;
      
      // Determine cost based on variant
      const isColor = variant.toLowerCase().includes('color');
      const costKey = isColor ? 'cost_color' : 'cost_bw';
      const unitCost = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(costKey)?.value || "0");
      const totalCost = unitCost * pages;

      const pStatus = payment_status || 'Paid';
      const pPaid = paid_amount !== undefined ? paid_amount : price;
      const pDue = due_amount !== undefined ? due_amount : 0;

      const stmt = db.prepare(`
        INSERT INTO service_sales (service_type, variant, pages, price, cost, payment_status, paid_amount, due_amount, customer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(service_type, variant, pages, price, totalCost, pStatus, pPaid, pDue, customer_id);
      
      // Handle Customer Due
      if (pDue > 0 && customer_id) {
        db.prepare("INSERT INTO customer_transactions (customer_id, type, amount, description) VALUES (?, ?, ?, ?)")
          .run(customer_id, 'Due', pDue, `Due for ${service_type} (${variant}) - ${pages} pages`);
      }

      // Deduct paper inventory (roughly 1 rim = 500 pages)
      db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE item_name = 'Paper Rims'").run(pages);
      
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Service Transaction Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/services", (req, res) => {
    const rows = db.prepare("SELECT * FROM service_sales ORDER BY timestamp DESC LIMIT 50").all();
    res.json(rows);
  });

  // Other Sales Endpoints
  app.post("/api/other-sales", (req, res) => {
    try {
      const { item_name, amount, profit, payment_status, paid_amount, due_amount, customer_id } = req.body;
      
      const pStatus = payment_status || 'Paid';
      const pPaid = paid_amount !== undefined ? paid_amount : amount;
      const pDue = due_amount !== undefined ? due_amount : 0;

      const stmt = db.prepare(`
        INSERT INTO other_sales (item_name, amount, profit, payment_status, paid_amount, due_amount, customer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(item_name, amount, profit, pStatus, pPaid, pDue, customer_id);

      // Handle Customer Due
      if (pDue > 0 && customer_id) {
        db.prepare("INSERT INTO customer_transactions (customer_id, type, amount, description) VALUES (?, ?, ?, ?)")
          .run(customer_id, 'Due', pDue, `Due for Sale: ${item_name}`);
      }

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Other Sales Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/other-sales", (req, res) => {
    const rows = db.prepare("SELECT * FROM other_sales ORDER BY timestamp DESC LIMIT 50").all();
    res.json(rows);
  });

  // Expense Endpoints
  app.post("/api/expenses", (req, res) => {
    try {
      const { category, description, amount, payment_status, paid_amount, due_amount, vendor_id } = req.body;
      
      const pStatus = payment_status || 'Paid';
      const pPaid = paid_amount !== undefined ? paid_amount : amount;
      const pDue = due_amount !== undefined ? due_amount : 0;

      const stmt = db.prepare(`
        INSERT INTO expenses (category, description, amount, payment_status, paid_amount, due_amount, vendor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(category, description, amount, pStatus, pPaid, pDue, vendor_id);

      // Handle Vendor Due (Purchase)
      if (pDue > 0 && vendor_id) {
        db.prepare("INSERT INTO vendor_transactions (vendor_id, type, amount, description) VALUES (?, ?, ?, ?)")
          .run(vendor_id, 'Purchase', pDue, `Due Expense: ${category} - ${description}`);
      }

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Expense Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/expenses", (req, res) => {
    const rows = db.prepare("SELECT * FROM expenses ORDER BY timestamp DESC LIMIT 50").all();
    res.json(rows);
  });

  // Vendor Endpoints
  app.get("/api/vendors", (req, res) => {
    const rows = db.prepare(`
      SELECT v.*, 
      (SELECT SUM(amount) FROM vendor_transactions WHERE vendor_id = v.id AND type = 'Purchase') as total_purchase,
      (SELECT SUM(amount) FROM vendor_transactions WHERE vendor_id = v.id AND type = 'Payment') as total_payment
      FROM vendors v
    `).all();
    res.json(rows.map((r: any) => ({
      ...r,
      balance: (r.total_purchase || 0) - (r.total_payment || 0)
    })));
  });

  app.post("/api/vendors", (req, res) => {
    const { name, phone, details } = req.body;
    const stmt = db.prepare("INSERT INTO vendors (name, phone, details) VALUES (?, ?, ?)");
    const info = stmt.run(name, phone, details);
    res.json({ success: true, id: info.lastInsertRowid });
  });

  app.get("/api/vendors/:id/ledger", (req, res) => {
    const rows = db.prepare("SELECT * FROM vendor_transactions WHERE vendor_id = ? ORDER BY timestamp DESC").all(req.params.id);
    res.json(rows);
  });

  app.post("/api/vendor-transactions", (req, res) => {
    const { vendor_id, type, amount, description } = req.body;
    const stmt = db.prepare("INSERT INTO vendor_transactions (vendor_id, type, amount, description) VALUES (?, ?, ?, ?)");
    const info = stmt.run(vendor_id, type, amount, description);
    
    // If it's a payment, also record it as an expense
    if (type === 'Payment') {
      const vendor = db.prepare("SELECT name FROM vendors WHERE id = ?").get(vendor_id);
      db.prepare("INSERT INTO expenses (category, description, amount) VALUES (?, ?, ?)")
        .run('Vendor Payment', `Paid to ${vendor.name}: ${description} (Ref: VT-${info.lastInsertRowid})`, amount);
    }
    
    res.json({ success: true });
  });

  app.put("/api/vendor-transactions/:id", (req, res) => {
    const { type, amount, description } = req.body;
    const oldTx = db.prepare("SELECT * FROM vendor_transactions WHERE id = ?").get(req.params.id);
    
    db.prepare("UPDATE vendor_transactions SET type = ?, amount = ?, description = ? WHERE id = ?")
      .run(type, amount, description, req.params.id);

    // Update expense if it was a payment
    if (oldTx.type === 'Payment' || type === 'Payment') {
      const vendor = db.prepare("SELECT name FROM vendors WHERE id = ?").get(oldTx.vendor_id);
      // Delete old expense if it existed
      db.prepare("DELETE FROM expenses WHERE category = 'Vendor Payment' AND description LIKE ?")
        .run(`%Ref: VT-${req.params.id}%`);
      
      // Add new expense if it's still a payment
      if (type === 'Payment') {
        db.prepare("INSERT INTO expenses (category, description, amount) VALUES (?, ?, ?)")
          .run('Vendor Payment', `Paid to ${vendor.name}: ${description} (Ref: VT-${req.params.id})`, amount);
      }
    }
    
    res.json({ success: true });
  });

  app.delete("/api/vendor-transactions/:id", (req, res) => {
    const tx = db.prepare("SELECT * FROM vendor_transactions WHERE id = ?").get(req.params.id);
    if (tx.type === 'Payment') {
      db.prepare("DELETE FROM expenses WHERE category = 'Vendor Payment' AND description LIKE ?")
        .run(`%Ref: VT-${req.params.id}%`);
    }
    db.prepare("DELETE FROM vendor_transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Customer Endpoints
  app.get("/api/customers", (req, res) => {
    const rows = db.prepare(`
      SELECT c.*, 
      (SELECT SUM(amount) FROM customer_transactions WHERE customer_id = c.id AND type = 'Due') as total_due,
      (SELECT SUM(amount) FROM customer_transactions WHERE customer_id = c.id AND type = 'Payment') as total_paid
      FROM customers c
    `).all();
    res.json(rows.map((r: any) => ({
      ...r,
      balance: (r.total_due || 0) - (r.total_paid || 0)
    })));
  });

  app.post("/api/customers", (req, res) => {
    const { name, phone, address } = req.body;
    const stmt = db.prepare("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)");
    const info = stmt.run(name, phone, address);
    res.json({ success: true, id: info.lastInsertRowid });
  });

  app.get("/api/customers/:id/ledger", (req, res) => {
    const rows = db.prepare("SELECT * FROM customer_transactions WHERE customer_id = ? ORDER BY timestamp DESC").all(req.params.id);
    res.json(rows);
  });

  app.post("/api/customer-transactions", (req, res) => {
    const { customer_id, type, amount, description } = req.body;
    const stmt = db.prepare("INSERT INTO customer_transactions (customer_id, type, amount, description) VALUES (?, ?, ?, ?)");
    stmt.run(customer_id, type, amount, description);
    res.json({ success: true });
  });

  app.delete("/api/customer-transactions/:id", (req, res) => {
    db.prepare("DELETE FROM customer_transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/history", (req, res) => {
    const { search } = req.query;
    let params: any[] = [];
    
    let mfsQuery = "SELECT id, operator, type, amount, customer_phone, trx_id, timestamp, NULL as service_type, NULL as variant, NULL as pages, NULL as price, 'mfs' as source FROM mfs_transactions";
    let rechargeQuery = "SELECT id, operator, 'Recharge' as type, amount, customer_phone, NULL as trx_id, timestamp, NULL as service_type, NULL as variant, NULL as pages, NULL as price, 'recharge' as source FROM recharge_transactions";
    let servicesQuery = "SELECT id, NULL as operator, NULL as type, NULL as amount, NULL as customer_phone, NULL as trx_id, timestamp, service_type, variant, pages, price as amount, 'services' as source FROM service_sales";
    let otherQuery = "SELECT id, item_name as operator, 'Sale' as type, amount, NULL as customer_phone, NULL as trx_id, timestamp, NULL as service_type, NULL as variant, NULL as pages, NULL as price, 'other' as source FROM other_sales";
    let expenseQuery = "SELECT id, category as operator, 'Expense' as type, amount, description as customer_phone, NULL as trx_id, timestamp, NULL as service_type, NULL as variant, NULL as pages, NULL as price, 'expense' as source FROM expenses";

    if (search) {
      const searchPattern = `%${search}%`;
      mfsQuery += " WHERE customer_phone LIKE ? OR trx_id LIKE ?";
      rechargeQuery += " WHERE customer_phone LIKE ?";
      servicesQuery += " WHERE service_type LIKE ? OR variant LIKE ?";
      otherQuery += " WHERE item_name LIKE ?";
      expenseQuery += " WHERE category LIKE ? OR description LIKE ?";
      params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
    }

    const unifiedQuery = `
      SELECT * FROM (
        ${mfsQuery}
        UNION ALL
        ${rechargeQuery}
        UNION ALL
        ${servicesQuery}
        UNION ALL
        ${otherQuery}
        UNION ALL
        ${expenseQuery}
      ) ORDER BY timestamp DESC LIMIT 100
    `;

    const rows = db.prepare(unifiedQuery).all(...params);
    res.json(rows);
  });

  // Inventory Endpoints
  app.get("/api/inventory", (req, res) => {
    const rows = db.prepare("SELECT * FROM inventory").all();
    res.json(rows);
  });

  app.post("/api/inventory/add", (req, res) => {
    const { quantity } = req.body;
    db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE item_name = 'Paper Rims'").run(quantity);
    res.json({ success: true });
  });

  // Shop Numbers Endpoints
  app.get("/api/shop-numbers", (req, res) => {
    const rows = db.prepare("SELECT * FROM shop_numbers").all();
    res.json(rows);
  });

  app.post("/api/shop-numbers", (req, res) => {
    const { operator, type, number, password } = req.body;
    const stmt = db.prepare("INSERT INTO shop_numbers (operator, type, number, password) VALUES (?, ?, ?, ?)");
    stmt.run(operator, type, number, password);
    res.json({ success: true });
  });

  app.delete("/api/shop-numbers/:id", (req, res) => {
    db.prepare("DELETE FROM shop_numbers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Orders Endpoints
  app.get("/api/orders", (req, res) => {
    const { status } = req.query;
    let query = "SELECT * FROM orders";
    const params = [];
    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }
    query += " ORDER BY timestamp DESC";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  app.post("/api/orders", (req, res) => {
    const { customer_name, customer_phone, description, amount, status } = req.body;
    const stmt = db.prepare("INSERT INTO orders (customer_name, customer_phone, description, amount, status) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(customer_name, customer_phone, description, amount || 0, status || 'Pending');
    res.json({ success: true, id: info.lastInsertRowid });
  });

  app.put("/api/orders/:id", (req, res) => {
    const { customer_name, customer_phone, description, amount, status } = req.body;
    const stmt = db.prepare("UPDATE orders SET customer_name = ?, customer_phone = ?, description = ?, amount = ?, status = ? WHERE id = ?");
    stmt.run(customer_name, customer_phone, description, amount, status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings Endpoints
  app.get("/api/settings", (req, res) => {
    const rows = db.prepare("SELECT * FROM settings").all();
    res.json(rows);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value.toString());
    res.json({ success: true });
  });

  // Analytics Endpoints
  app.get("/api/analytics", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get MFS breakdown
      const mfsStats = db.prepare(`
        SELECT 
          SUM(CASE WHEN type = 'Cash-in' THEN amount ELSE 0 END) as cash_in,
          SUM(CASE WHEN type = 'Cash-out' THEN amount ELSE 0 END) as cash_out,
          SUM(CASE WHEN type = 'Receive' THEN amount ELSE 0 END) as received,
          SUM(amount) as total_volume,
          SUM(commission) as profit
        FROM mfs_transactions 
        WHERE date(timestamp) = date('now')
      `).get();

      const rechargeToday = db.prepare("SELECT SUM(amount) as total, SUM(profit) as profit FROM recharge_transactions WHERE date(timestamp) = date('now')").get();
      const servicesToday = db.prepare("SELECT SUM(price) as total, SUM(cost) as cost, SUM(pages) as pages FROM service_sales WHERE date(timestamp) = date('now')").get();
      const otherSalesToday = db.prepare("SELECT SUM(amount) as total, SUM(profit) as profit FROM other_sales WHERE date(timestamp) = date('now')").get();
      const expensesToday = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date(timestamp) = date('now')").get();
      const inventory = db.prepare("SELECT quantity FROM inventory WHERE item_name = 'Paper Rims'").get();
      
      // Calculate Total Customer Due
      const customerStats = db.prepare(`
        SELECT 
          SUM(CASE WHEN type = 'Due' THEN amount ELSE 0 END) as total_due,
          SUM(CASE WHEN type = 'Payment' THEN amount ELSE 0 END) as total_paid
        FROM customer_transactions
      `).get();
      const totalCustomerDue = (customerStats?.total_due || 0) - (customerStats?.total_paid || 0);

      // Calculate "Cash in Hand" (Physical Cash flow)
      const mfsCashFlow = (mfsStats?.cash_in || 0) - (mfsStats?.cash_out || 0) + (mfsStats?.received || 0);
      
      // Calculate MFS Balances
      const mfsOperators = ['bKash', 'Nagad', 'Rocket'];
      const mfsBalances: any = {};
      mfsOperators.forEach(op => {
        const opening = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(`${op.toLowerCase()}_opening_balance`)?.value || "0");
        const stats = db.prepare(`
          SELECT 
            SUM(CASE WHEN type IN ('Cash-out', 'Receive', 'B2B-Buy') THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN type IN ('Cash-in', 'B2B-Pay') THEN amount ELSE 0 END) as total_out
          FROM mfs_transactions 
          WHERE operator = ?
        `).get(op);
        mfsBalances[op] = opening + (stats?.total_in || 0) - (stats?.total_out || 0);
      });

      // Calculate Recharge Balances
      const rechargeOperators = ['GP', 'Robi', 'BL', 'Airtel', 'Teletalk'];
      const rechargeBalances: any = {};
      rechargeOperators.forEach(op => {
        const opening = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get(`${op.toLowerCase()}_opening_balance`)?.value || "0");
        const stats = db.prepare(`
          SELECT 
            SUM(CASE WHEN type IN ('B2B-Buy') THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN type IN ('Recharge', 'B2B-Pay') THEN amount ELSE 0 END) as total_out
          FROM recharge_transactions 
          WHERE operator = ?
        `).get(op);
        rechargeBalances[op] = opening + (stats?.total_in || 0) - (stats?.total_out || 0);
      });

      const customerPaymentsToday = db.prepare("SELECT SUM(amount) as total FROM customer_transactions WHERE type = 'Payment' AND date(timestamp) = date('now')").get();

      const cashInHand = mfsCashFlow + (rechargeToday?.total || 0) + (servicesToday?.total || 0) + (otherSalesToday?.total || 0) - (expensesToday?.total || 0) + (customerPaymentsToday?.total || 0);
      const serviceProfit = (servicesToday?.total || 0) - (servicesToday?.cost || 0);
      const totalProfit = (mfsStats?.profit || 0) + (rechargeToday?.profit || 0) + serviceProfit + (otherSalesToday?.profit || 0) - (expensesToday?.total || 0);

      res.json({
        mfs: { total: mfsStats?.total_volume || 0, profit: mfsStats?.profit || 0 },
        recharge: rechargeToday || { total: 0, profit: 0 },
        services: { ...(servicesToday || { total: 0, pages: 0 }), profit: serviceProfit },
        other: otherSalesToday || { total: 0, profit: 0 },
        expenses: expensesToday || { total: 0 },
        inventory: inventory?.quantity || 0,
        mfsBalances,
        rechargeBalances,
        cashInHand,
        totalProfit,
        totalCustomerDue
      });
    } catch (err: any) {
      console.error("Analytics Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/analytics/chart-data", (req, res) => {
    // Get last 7 days data
    const days = 7;
    const labels = [];
    const salesData = [];
    const mfsData = [];
    const profitData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

      // Daily Sales (Services + Other + Recharge Profit + MFS Profit)
      // Note: This is an approximation. Ideally we sum up actual transactions per day.
      
      const mfsProfit = db.prepare("SELECT SUM(commission) as val FROM mfs_transactions WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const rechargeProfit = db.prepare("SELECT SUM(profit) as val FROM recharge_transactions WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const serviceSales = db.prepare("SELECT SUM(price) as val FROM service_sales WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const otherSales = db.prepare("SELECT SUM(amount) as val FROM other_sales WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const serviceCost = db.prepare("SELECT SUM(cost) as val FROM service_sales WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const otherProfit = db.prepare("SELECT SUM(profit) as val FROM other_sales WHERE date(timestamp) = ?").get(dateStr)?.val || 0;
      const expenses = db.prepare("SELECT SUM(amount) as val FROM expenses WHERE date(timestamp) = ?").get(dateStr)?.val || 0;

      const totalSales = serviceSales + otherSales; // Revenue from direct sales
      const totalProfit = mfsProfit + rechargeProfit + (serviceSales - serviceCost) + otherProfit - expenses;
      
      const mfsVolume = db.prepare("SELECT SUM(amount) as val FROM mfs_transactions WHERE date(timestamp) = ?").get(dateStr)?.val || 0;

      salesData.push(totalSales);
      mfsData.push(mfsVolume);
      profitData.push(totalProfit);
    }

    res.json({ labels, salesData, mfsData, profitData });
  });



  // --- Backup Logic ---

  const performBackup = async () => {
    const date = new Date().toISOString().split('T')[0];
    const backupPath = path.join(BACKUP_DIR, `shop-backup-${date}.db`);
    
    try {
      // Close DB temporarily to ensure a clean copy (or use backup() method if available)
      // better-sqlite3 has a .backup() method which is safer
      await db.backup(backupPath);
      console.log(`Backup created at ${backupPath}`);
      return backupPath;
    } catch (err) {
      console.error("Backup failed:", err);
      throw err;
    }
  };

  // Daily backup at midnight
  cron.schedule('0 0 * * *', () => {
    console.log("Running daily backup...");
    performBackup();
  });

  // Backup Endpoints
  app.get("/api/backups", (req, res) => {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        date: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    res.json(files);
  });

  app.get("/api/backups/download/:filename", (req, res) => {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.post("/api/backups/create", async (req, res) => {
    try {
      const path = await performBackup();
      res.json({ success: true, path });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/backups/restore/:filename", async (req, res) => {
    const backupPath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    try {
      // Close current DB
      db.close();
      // Copy backup to shop.db
      fs.copyFileSync(backupPath, "shop.db");
      // Restart process or re-open DB
      // In this environment, we can just re-open
      // But it's safer to tell the user to refresh
      res.json({ success: true, message: "Database restored. Please refresh the page." });
      process.exit(0); // The platform will restart the server
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/backups/upload", upload.single('backup'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const targetPath = path.join(BACKUP_DIR, `uploaded-${Date.now()}.db`);
    fs.renameSync(req.file.path, targetPath);
    res.json({ success: true, filename: path.basename(targetPath) });
  });

  // Google Drive Integration
  app.post("/api/backups/cloud-sync", async (req, res) => {
    const credentialsJson = db.prepare("SELECT value FROM settings WHERE key = 'google_drive_credentials'").get()?.value;
    if (!credentialsJson) {
      return res.status(400).json({ error: "Google Drive not configured. Please add Service Account JSON in Settings." });
    }
    
    try {
      const credentials = JSON.parse(credentialsJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const drive = google.drive({ version: 'v3', auth });
      const backupPath = await performBackup();
      const fileName = path.basename(backupPath);

      const fileMetadata = {
        name: fileName,
        parents: [] // Optional: specify a folder ID if needed
      };
      
      const media = {
        mimeType: 'application/x-sqlite3',
        body: fs.createReadStream(backupPath),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      res.json({ success: true, message: "Backup synced to Google Drive.", fileId: response.data.id });
    } catch (err: any) {
      console.error("Cloud sync failed:", err);
      res.status(500).json({ error: `Cloud sync failed: ${err.message}. Ensure the JSON is a valid Service Account key.` });
    }
  });

  // Global Error Handler - returns JSON instead of HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal Server Error" });
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
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
