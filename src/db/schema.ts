import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const task = sqliteTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1),
});

export const categoryConfig = sqliteTable("category_config", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#F59E0B"), // Default Amber
  icon: text("icon"),
});

export const expense = sqliteTable("expense", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in cents
  category: text("category").notNull(), // e.g., 'Groceries', 'Rent', etc.
  date: integer("date", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  isMonthly: integer("is_monthly", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["pending", "paid"] })
    .notNull()
    .default("paid"),
  recurrenceId: text("recurrence_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const income = sqliteTable("income", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in cents
  category: text("category").notNull().default("Salary"),
  date: integer("date", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  status: text("status", { enum: ["pending", "paid"] })
    .notNull()
    .default("paid"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const savingsAccount = sqliteTable("savings_account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull().default("#494fdf"),
  targetAmount: integer("target_amount"), // in cents
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const transfer = sqliteTable("transfer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: integer("date", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  fromType: text("from_type", { enum: ["main", "savings"] }).notNull(),
  fromId: text("from_id").references(() => savingsAccount.id, {
    onDelete: "cascade",
  }), // ID of savingsAccount if from_type is "savings"
  toType: text("to_type", { enum: ["main", "savings"] }).notNull(),
  toId: text("to_id").references(() => savingsAccount.id, {
    onDelete: "cascade",
  }), // ID of savingsAccount if to_type is "savings"
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  expenses: many(expense),
  incomes: many(income),
  savingsAccounts: many(savingsAccount),
  transfers: many(transfer),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const expenseRelations = relations(expense, ({ one }) => ({
  user: one(user, {
    fields: [expense.userId],
    references: [user.id],
  }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  user: one(user, {
    fields: [income.userId],
    references: [user.id],
  }),
}));

export const savingsAccountRelations = relations(savingsAccount, ({ one, many }) => ({
  user: one(user, {
    fields: [savingsAccount.userId],
    references: [user.id],
  }),
  transfersFrom: many(transfer, { relationName: "fromAccount" }),
  transfersTo: many(transfer, { relationName: "toAccount" }),
}));

export const transferRelations = relations(transfer, ({ one }) => ({
  user: one(user, {
    fields: [transfer.userId],
    references: [user.id],
  }),
  fromAccount: one(savingsAccount, {
    fields: [transfer.fromId],
    references: [savingsAccount.id],
    relationName: "fromAccount",
  }),
  toAccount: one(savingsAccount, {
    fields: [transfer.toId],
    references: [savingsAccount.id],
    relationName: "toAccount",
  }),
}));
