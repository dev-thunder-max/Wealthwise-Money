# WealthWise Money Manager

A full-stack personal finance app built with React, Express, and PostgreSQL.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn UI + wouter + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM (Neon-compatible)
- **Auth**: scrypt password hashing, express-session (memorystore), 7-day rolling sessions
- **Email**: Resend (`RESEND_API_KEY` secret) for email verification codes

## Features
- Dashboard with charts (income/expense/balance overview)
- Transactions (income, expense, transfer) with category and account tracking
- Accounts management (cash, bank, credit, savings, MFS, investment)
- Budgets with per-category spending limits
- Profile page: change username, password, security question, set/verify email
- Settings: currency preference (USD, EUR, GBP, JPY, INR, BDT, CAD), CSV/JSON export, secure data wipe
- Login with username + password, forgot-password recovery via security question

## Key Files
- `shared/schema.ts` — Drizzle ORM table definitions and Zod schemas
- `shared/routes.ts` — Typed API route definitions shared by frontend and backend
- `server/routes.ts` — Express route handlers
- `server/auth.ts` — Session setup, password hashing, requireAuth middleware
- `server/email.ts` — Resend email service for verification codes
- `server/storage.ts` — Database storage interface
- `client/src/App.tsx` — Root app with AuthGate and router
- `client/src/pages/` — Dashboard, Transactions, Accounts, Budgets, Profile, Settings, Login
- `client/src/components/AppSidebar.tsx` — Navigation sidebar

## Environment Secrets
- `SESSION_SECRET` — Express session secret
- `RESEND_API_KEY` — Resend API key for sending verification emails
- `DATABASE_URL` — PostgreSQL connection string (managed by Replit)

## Notes
- Amounts are stored in **cents** (integers) throughout
- Single-user app — one row in the `users` table
- Resend free tier sends from `onboarding@resend.dev`. To send to any email address (not just the Resend account owner's email), verify a custom domain at resend.com/domains
- Session cookie: `wealthwise.sid`, httpOnly, sameSite lax, 7-day rolling
- Deploy via Replit Deployments (`npm run build` → `node ./dist/index.cjs`)
- Post-merge script: `scripts/post-merge.sh` (runs `npm install && npm run db:push`)
