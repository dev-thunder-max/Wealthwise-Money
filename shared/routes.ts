import { z } from "zod";
import { insertAccountSchema, insertBudgetSchema, insertCategorySchema, insertTransactionSchema, insertUserSchema, accounts, budgets, categories, transactions, users } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    status: {
      method: "GET" as const,
      path: "/api/auth/status" as const,
      responses: {
        200: z.object({
          isSetup: z.boolean(),
          isAuthenticated: z.boolean(),
          username: z.string().nullable().optional(),
        })
      }
    },
    setup: {
      method: "POST" as const,
      path: "/api/auth/setup" as const,
      input: z.object({
        username: z.string().min(2, "Username must be at least 2 characters"),
        password: z.string().min(4, "Password must be at least 4 characters"),
        securityQuestion: z.string().min(3, "Security question is required"),
        securityAnswer: z.string().min(1, "Security answer is required"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout" as const,
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    recoveryQuestion: {
      method: "POST" as const,
      path: "/api/auth/recovery-question" as const,
      input: z.object({ username: z.string().min(1) }),
      responses: { 200: z.object({ question: z.string() }) }
    },
    resetPassword: {
      method: "POST" as const,
      path: "/api/auth/reset-password" as const,
      input: z.object({
        username: z.string().min(1),
        securityAnswer: z.string().min(1),
        newPassword: z.string().min(4, "Password must be at least 4 characters"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  user: {
    get: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    updateSettings: {
      method: "POST" as const,
      path: "/api/user/settings" as const,
      input: z.object({ currencyPreference: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() })
      }
    },
    changeUsername: {
      method: "POST" as const,
      path: "/api/user/change-username" as const,
      input: z.object({
        newUsername: z.string().min(2, "Username must be at least 2 characters"),
        currentPassword: z.string().min(1, "Current password is required"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    changePassword: {
      method: "POST" as const,
      path: "/api/user/change-password" as const,
      input: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(4, "New password must be at least 4 characters"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    changeSecurityQuestion: {
      method: "POST" as const,
      path: "/api/user/change-security-question" as const,
      input: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        securityQuestion: z.string().min(3, "Security question is required"),
        securityAnswer: z.string().min(1, "Security answer is required"),
      }),
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  accounts: {
    list: {
      method: "GET" as const,
      path: "/api/accounts" as const,
      responses: { 200: z.array(z.custom<typeof accounts.$inferSelect>()) }
    },
    create: {
      method: "POST" as const,
      path: "/api/accounts" as const,
      input: insertAccountSchema,
      responses: { 201: z.custom<typeof accounts.$inferSelect>() }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/accounts/:id" as const,
      responses: { 204: z.void() }
    }
  },
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories" as const,
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) }
    }
  },
  transactions: {
    list: {
      method: "GET" as const,
      path: "/api/transactions" as const,
      responses: { 
        200: z.array(z.custom<typeof transactions.$inferSelect & {
          categoryName?: string, categoryIcon?: string, categoryColor?: string, accountName?: string
        }>())
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/transactions" as const,
      input: insertTransactionSchema,
      responses: { 201: z.custom<typeof transactions.$inferSelect>() }
    },
    update: {
      method: "PUT" as const,
      path: "/api/transactions/:id" as const,
      input: insertTransactionSchema,
      responses: { 200: z.custom<typeof transactions.$inferSelect>() }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/transactions/:id" as const,
      responses: { 204: z.void() }
    }
  },
  budgets: {
    list: {
      method: "GET" as const,
      path: "/api/budgets" as const,
      responses: {
        200: z.array(z.custom<typeof budgets.$inferSelect & { categoryName?: string, categoryColor?: string }>())
      }
    },
    upsert: {
      method: "POST" as const,
      path: "/api/budgets" as const,
      input: insertBudgetSchema,
      responses: { 200: z.custom<typeof budgets.$inferSelect>() }
    }
  },
  settings: {
    wipe: {
      method: "POST" as const,
      path: "/api/settings/wipe" as const,
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    export: {
      method: "GET" as const,
      path: "/api/settings/export" as const,
      input: z.object({ format: z.enum(["csv", "json"]) }),
      responses: { 200: z.any() } // Returns a file
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
