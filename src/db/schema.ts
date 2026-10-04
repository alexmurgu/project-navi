import { relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
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

export const account = pgTable(
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
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const task = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1),
});

export const categoryConfig = pgTable("category_config", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#F59E0B"), // Default Amber
  icon: text("icon"),
});

export const expense = pgTable("expense", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in cents
  category: text("category").notNull(), // e.g., 'Groceries', 'Rent', etc.
  date: timestamp("date", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  isMonthly: boolean("is_monthly").notNull().default(false),
  status: text("status", { enum: ["pending", "paid"] })
    .notNull()
    .default("paid"),
  recurrenceId: text("recurrence_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
  accountType: text("account_type", { enum: ["main", "credit"] })
    .notNull()
    .default("main"),
  accountId: text("account_id"), // ID of creditCard
});

export const income = pgTable("income", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in cents
  category: text("category").notNull().default("Salary"),
  date: timestamp("date", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  status: text("status", { enum: ["pending", "paid"] })
    .notNull()
    .default("paid"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const savingsAccount = pgTable("savings_account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull().default("#494fdf"),
  targetAmount: integer("target_amount"), // in cents
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const creditCard = pgTable("credit_card", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull().default("#f43f5e"), // Default Rose
  limit: integer("limit"), // in cents
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const transfer = pgTable("transfer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  fromType: text("from_type", { enum: ["main", "savings", "credit"] }).notNull(),
  fromId: text("from_id"), // ID of savingsAccount or creditCard
  toType: text("to_type", { enum: ["main", "savings", "credit"] }).notNull(),
  toId: text("to_id"), // ID of savingsAccount or creditCard
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
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
  creditCards: many(creditCard),
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

export const incomeRelations = relations(income, ({ one }) => ({
  user: one(user, {
    fields: [income.userId],
    references: [user.id],
  }),
}));

export const creditCardRelations = relations(creditCard, ({ one, many }) => ({
  user: one(user, {
    fields: [creditCard.userId],
    references: [user.id],
  }),
  expenses: many(expense),
  transfersFrom: many(transfer, { relationName: "fromAccount" }),
  transfersTo: many(transfer, { relationName: "toAccount" }),
}));

export const expenseRelations = relations(expense, ({ one }) => ({
  user: one(user, {
    fields: [expense.userId],
    references: [user.id],
  }),
  creditCard: one(creditCard, {
    fields: [expense.accountId],
    references: [creditCard.id],
  }),
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
  fromCreditCard: one(creditCard, {
    fields: [transfer.fromId],
    references: [creditCard.id],
    relationName: "fromAccount",
  }),
  toCreditCard: one(creditCard, {
    fields: [transfer.toId],
    references: [creditCard.id],
    relationName: "toAccount",
  }),
}));
