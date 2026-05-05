import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import {
  expense,
  income,
  user as userSchema,
  categoryConfig,
  savingsAccount,
  creditCard,
  transfer,
} from "./db/schema";
import { eq, sql, and, isNotNull, desc, like } from "drizzle-orm";
import { auth } from "./auth";
import { getRequest } from "@tanstack/react-start/server";
import { addMonths, isBefore, startOfMonth } from "date-fns";

// Middleware-like session helper for server functions
const getSession = async () => {
  const request = getRequest();
  if (!request) return null;
  return await auth.api.getSession({
    headers: request.headers,
  });
};

const parseDate = (d: any) => {
  if (!d) return d;
  if (d instanceof Date) return d;
  if (typeof d === "string" && d.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    // Treat YYYY-MM-DD as local 12 AM
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d);
};

const syncRecurringExpenses = async () => {
  // Find all expenses that are recurring
  const recurringTemplates = await db
    .select()
    .from(expense)
    .where(and(eq(expense.isMonthly, true), isNotNull(expense.recurrenceId)));

  const now = new Date();
  const currentMonthStart = startOfMonth(now);

  for (const template of recurringTemplates) {
    // Find the latest instance for this recurrenceId
    const [latestInstance] = await db
      .select()
      .from(expense)
      .where(eq(expense.recurrenceId, template.recurrenceId!))
      .orderBy(desc(expense.date))
      .limit(1);

    if (!latestInstance) continue;

    let nextDate = addMonths(new Date(latestInstance.date), 1);

    // Generate instances up to the current month
    while (
      isBefore(startOfMonth(nextDate), currentMonthStart) ||
      startOfMonth(nextDate).getTime() === currentMonthStart.getTime()
    ) {
      // Check if we already created it (extra safety)
      const [exists] = await db
        .select()
        .from(expense)
        .where(
          and(
            eq(expense.recurrenceId, template.recurrenceId!),
            sql`strftime('%m-%Y', ${expense.date} / 1000, 'unixepoch') = ${sql.placeholder("monthYear")}`,
          ),
        )
        .limit(1)
        .prepare()
        .execute({ monthYear: `${nextDate.getMonth() + 1}-${nextDate.getFullYear()}` });

      if (!exists) {
        await db.insert(expense).values({
          userId: template.userId,
          description: template.description,
          amount: template.amount,
          category: template.category,
          date: nextDate,
          isMonthly: true,
          status: "pending",
          recurrenceId: template.recurrenceId,
        });
      }
      nextDate = addMonths(nextDate, 1);
    }
  }
};

export const fetchSession = createServerFn({ method: "GET" }).handler(async () => {
  return await getSession();
});

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await syncRecurringExpenses();

  const expenses = await db
    .select({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      isMonthly: expense.isMonthly,
      status: expense.status,
      recurrenceId: expense.recurrenceId,
      userId: expense.userId,
      accountType: expense.accountType,
      accountId: expense.accountId,
      userName: sql<string>`COALESCE(${userSchema.name}, 'Family Wide')`,
    })
    .from(expense)
    .leftJoin(userSchema, eq(expense.userId, userSchema.id));

  const incomes = await db
    .select({
      id: income.id,
      description: income.description,
      amount: income.amount,
      category: income.category,
      date: income.date,
      status: income.status,
      userId: income.userId,
      userName: sql<string>`COALESCE(${userSchema.name}, 'Family Wide')`,
    })
    .from(income)
    .leftJoin(userSchema, eq(income.userId, userSchema.id));

  const users = await db.select({ id: userSchema.id, name: userSchema.name }).from(userSchema);
  const configs = await db.select().from(categoryConfig);

  const savings = await db.select().from(savingsAccount);
  const creditCards = await db.select().from(creditCard);
  const allTransfers = await db.select().from(transfer);

  const savingsIds = new Set(savings.map((s) => s.id));
  const creditCardIds = new Set(creditCards.map((c) => c.id));
  const validTransfers = allTransfers.filter((t) => {
    if (t.fromType === "savings" && !savingsIds.has(t.fromId!)) return false;
    if (t.toType === "savings" && !savingsIds.has(t.toId!)) return false;
    if (t.fromType === "credit" && !creditCardIds.has(t.fromId!)) return false;
    if (t.toType === "credit" && !creditCardIds.has(t.toId!)) return false;
    return true;
  });

  // Synthesize transfers into expenses/incomes for transparency and simpler math
  const transferIncomes = validTransfers
    .filter(
      (t) =>
        (t.fromType === "savings" || t.fromType === "credit") && t.toType === "main",
    )
    .map((t) => {
      const sa = savings.find((s) => s.id === t.fromId);
      const cc = creditCards.find((c) => c.id === t.fromId);
      return {
        id: t.id,
        description: `From ${sa?.name || cc?.name || "Account"}`,
        amount: t.amount,
        category: "Transfer",
        date: t.date,
        status: "paid" as const,
        userId: t.userId,
        userName: "Family Wide",
        isTransfer: true,
      };
    });

  const transferExpenses = validTransfers
    .filter(
      (t) =>
        t.fromType === "main" && (t.toType === "savings" || t.toType === "credit"),
    )
    .map((t) => {
      const sa = savings.find((s) => s.id === t.toId);
      const cc = creditCards.find((c) => c.id === t.toId);
      return {
        id: t.id,
        description: `Transfer: ${sa?.name || cc?.name || "Account"}`,
        amount: t.amount,
        category: "Transfer",
        date: t.date,
        status: "paid" as const,
        userId: t.userId,
        userName: "Family Wide",
        isTransfer: true,
      };
    });

  const allExpenses = [...expenses, ...transferExpenses];
  const allIncomes = [...incomes, ...transferIncomes];

  // Calculate balances for savings accounts
  const savingsWithBalances = savings.map((sa) => {
    const toAmount = validTransfers
      .filter((t) => t.toType === "savings" && t.toId === sa.id)
      .reduce((acc, t) => acc + t.amount, 0);
    const fromAmount = validTransfers
      .filter((t) => t.fromType === "savings" && t.fromId === sa.id)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      ...sa,
      currentBalance: toAmount - fromAmount,
    };
  });

  const creditCardsWithBalances = creditCards.map((cc) => {
    const expensesAmount = expenses
      .filter((e) => e.accountType === "credit" && e.accountId === cc.id)
      .reduce((acc, e) => acc + e.amount, 0);
    const paymentsToAmount = validTransfers
      .filter((t) => t.toType === "credit" && t.toId === cc.id)
      .reduce((acc, t) => acc + t.amount, 0);
    const transfersFromAmount = validTransfers
      .filter((t) => t.fromType === "credit" && t.fromId === cc.id)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      ...cc,
      currentBalance: expensesAmount - paymentsToAmount + transfersFromAmount,
    };
  });

  return {
    user: session.user,
    users,
    expenses: allExpenses,
    incomes: allIncomes,
    expenseCategories: Array.from(new Set(allExpenses.map((e) => e.category))),
    incomeCategories: Array.from(new Set(allIncomes.map((i) => i.category))),
    categoryConfigs: configs,
    savingsAccounts: savingsWithBalances,
    creditCards: creditCardsWithBalances,
    transfers: validTransfers,
  };
});

export const addExpense = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const recurrenceId = data.isMonthly ? crypto.randomUUID() : null;

    await db.insert(expense).values({
      userId: data.userId === "family" ? null : data.userId || session.user.id,
      description: data.description,
      amount: Math.round(data.amount),
      category: data.category,
      isMonthly: data.isMonthly || false,
      date: parseDate(data.date) || new Date(),
      status: data.status || "paid",
      recurrenceId,
      accountType: data.accountType || "main",
      accountId: data.accountId || null,
    });
    return { success: true };
  });

export const updateExpense = createServerFn({ method: "POST" }) // Start uses POST for 'mutations' generally
  .inputValidator((data: { id: string; [key: string]: any }) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updateData } = data;

    // If it's turning into a monthly expense and didn't have a recurrenceId, give it one
    const [existing] = await db.select().from(expense).where(eq(expense.id, id)).limit(1);
    let recurrenceId = existing.recurrenceId;
    if (updateData.isMonthly && !recurrenceId) {
      recurrenceId = crypto.randomUUID();
    } else if (!updateData.isMonthly) {
      recurrenceId = null;
    }

    await db
      .update(expense)
      .set({
        userId: updateData.userId === "family" ? null : updateData.userId || session.user.id,
        description: updateData.description,
        amount: Math.round(updateData.amount),
        category: updateData.category,
        isMonthly: updateData.isMonthly || false,
        ...(updateData.date && { date: parseDate(updateData.date) }),
        status: updateData.status || "paid",
        recurrenceId,
        accountType: updateData.accountType || "main",
        accountId: updateData.accountId || null,
      })
      .where(eq(expense.id, id));
    return { success: true };
  });

export const updateTransactionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const table = data.type === "expense" ? expense : income;
    await db.update(table).set({ status: data.status }).where(eq(table.id, data.id));
    return { success: true };
  });
export const deleteExpense = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await db.delete(expense).where(eq(expense.id, id));
    return { success: true };
  });

export const addIncome = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.insert(income).values({
      userId: data.userId === "family" ? null : data.userId || session.user.id,
      description: data.description,
      amount: Math.round(data.amount),
      category: data.category,
      date: parseDate(data.date) || new Date(),
      status: data.status || "paid",
    });
    return { success: true };
  });

export const updateIncome = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; [key: string]: any }) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updateData } = data;
    await db
      .update(income)
      .set({
        userId: updateData.userId === "family" ? null : updateData.userId || session.user.id,
        description: updateData.description,
        amount: Math.round(updateData.amount),
        category: updateData.category,
        ...(updateData.date && { date: parseDate(updateData.date) }),
        status: updateData.status || "paid",
      })
      .where(eq(income.id, id));
    return { success: true };
  });

export const deleteIncome = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await db.delete(income).where(eq(income.id, id));
    return { success: true };
  });

export const bulkDeleteTransactions = createServerFn({ method: "POST" })
  .inputValidator((data: { ids: string[]; type: "expense" | "income" }) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const table = data.type === "expense" ? expense : income;
    const { inArray } = await import("drizzle-orm");
    await db.delete(table).where(inArray(table.id, data.ids));
    return { success: true };
  });

export const bulkImportTransactions = createServerFn({ method: "POST" })
  .inputValidator((data: any[]) => data)
  .handler(async ({ data: transactions }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    for (const tx of transactions) {
      const userId = tx.userId === "family" ? null : tx.userId;
      if (tx.type === "expense") {
        await db.insert(expense).values({
          userId,
          description: tx.description,
          amount: Math.round(tx.amount),
          category: tx.category,
          isMonthly: tx.isMonthly || false,
          date: parseDate(tx.date) || new Date(),
          status: tx.status || "paid",
          accountType: tx.accountType || "main",
          accountId: tx.accountId || null,
        });
      } else {
        await db.insert(income).values({
          userId,
          description: tx.description,
          amount: Math.round(tx.amount),
          category: tx.category,
          date: parseDate(tx.date) || new Date(),
          status: tx.status || "paid",
        });
      }
    }
    return { success: true };
  });

// --- Savings & Transfer Actions ---

export const addSavingsAccount = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.insert(savingsAccount).values({
      userId: session.user.id,
      name: data.name,
      icon: data.icon,
      color: data.color || "#494fdf",
      targetAmount: data.targetAmount ? Math.round(data.targetAmount) : null,
    });
    return { success: true };
  });

export const updateSavingsAccount = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updateData } = data;
    await db
      .update(savingsAccount)
      .set({
        name: updateData.name,
        icon: updateData.icon,
        color: updateData.color,
        targetAmount: updateData.targetAmount ? Math.round(updateData.targetAmount) : null,
      })
      .where(eq(savingsAccount.id, id));
    return { success: true };
  });

export const deleteSavingsAccount = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.delete(savingsAccount).where(eq(savingsAccount.id, id));
    return { success: true };
  });

export const addTransfer = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.insert(transfer).values({
      userId: session.user.id,
      amount: Math.round(data.amount),
      description: data.description,
      date: parseDate(data.date) || new Date(),
      fromType: data.fromType,
      fromId: data.fromId || null,
      toType: data.toType,
      toId: data.toId || null,
    });
    return { success: true };
  });

export const deleteTransfer = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await db.delete(transfer).where(eq(transfer.id, id));
    return { success: true };
  });

// --- Credit Card Actions ---

export const addCreditCard = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.insert(creditCard).values({
      userId: session.user.id,
      name: data.name,
      icon: data.icon,
      color: data.color || "#f43f5e",
      limit: data.limit ? Math.round(data.limit) : null,
    });
    return { success: true };
  });

export const updateCreditCard = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updateData } = data;
    await db
      .update(creditCard)
      .set({
        name: updateData.name,
        icon: updateData.icon,
        color: updateData.color,
        limit: updateData.limit ? Math.round(updateData.limit) : null,
      })
      .where(eq(creditCard.id, id));
    return { success: true };
  });

export const deleteCreditCard = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.delete(creditCard).where(eq(creditCard.id, id));
    return { success: true };
  });

// --- Admin Actions ---

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

const checkAdmin = async () => {
  const session = await getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return session;
};

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  await checkAdmin();
  return await db.select().from(userSchema);
});

export const addAdminUser = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    await checkAdmin();
    await auth.api.signUpEmail({ body: data });
    return { success: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await checkAdmin();
    const [userToDelete] = await db.select().from(userSchema).where(eq(userSchema.id, id)).limit(1);
    if (userToDelete?.email === ADMIN_EMAIL) throw new Error("Cannot delete admin");
    await db.delete(userSchema).where(eq(userSchema.id, id));
    return { success: true };
  });

export const addAdminCategory = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; color: string; icon?: string | null }) => data)
  .handler(async ({ data }) => {
    await checkAdmin();
    await db
      .insert(categoryConfig)
      .values({
        name: data.name,
        color: data.color,
        icon: data.icon ?? null,
      })
      .onConflictDoUpdate({
        target: categoryConfig.name,
        set: {
          color: data.color,
          icon: data.icon ?? null,
        },
      });
    return { success: true };
  });

export const deleteAdminCategory = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await checkAdmin();
    await db.delete(categoryConfig).where(eq(categoryConfig.id, id));
    return { success: true };
  });

export const getTransactionSuggestions = createServerFn({ method: "GET" })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    if (!query || query.length < 2) return [];

    // Query both tables for matching descriptions
    const expenseMatches = await db
      .select({
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        type: sql<string>`'expense'`,
      })
      .from(expense)
      .where(like(expense.description, `%${query}%`))
      .orderBy(desc(expense.date))
      .limit(20);

    const incomeMatches = await db
      .select({
        description: income.description,
        category: income.category,
        amount: income.amount,
        type: sql<string>`'income'`,
      })
      .from(income)
      .where(like(income.description, `%${query}%`))
      .orderBy(desc(income.date))
      .limit(20);

    // Combine and unique by description
    const combined = [...expenseMatches, ...incomeMatches];
    const unique = Array.from(new Map(combined.map((item) => [item.description, item])).values());

    return unique.slice(0, 5);
  });
