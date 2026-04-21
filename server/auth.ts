import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Request, Response, NextFunction, Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
  }
}

export function setupSession(app: Express) {
  const MemoryStore = createMemoryStore(session);
  app.set("trust proxy", 1);
  app.use(session({
    secret: process.env.SESSION_SECRET || "wealthwise-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({ checkPeriod: 86400000 }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export async function getStoredPasswordHash(): Promise<string | null> {
  const user = await storage.getUser();
  return user?.passwordHash ?? null;
}

export async function setStoredPasswordHash(hash: string): Promise<void> {
  let user = await storage.getUser();
  if (!user) {
    await db.insert(users).values({ email: "user@example.com", currencyPreference: "USD", passwordHash: hash });
    return;
  }
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, user.id));
}
