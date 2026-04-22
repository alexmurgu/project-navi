import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import { expense, income, user as userSchema, categoryConfig } from "./db/schema";
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
    while (isBefore(startOfMonth(nextDate), currentMonthStart) || 
           startOfMonth(nextDate).getTime() === currentMonthStart.getTime()) {
      
      // Check if we already created it (extra safety)
      const [exists] = await db
        .select()
        .from(expense)
        .where(and(
          eq(expense.recurrenceId, template.recurrenceId!),
          sql`strftime('%m-%Y', ${expense.date} / 1000, 'unixepoch') = ${sql.placeholder('monthYear')}`
        ))
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

  const expenseCategories = Array.from(new Set(expenses.map((e) => e.category)));
  const incomeCategories = Array.from(new Set(incomes.map((i) => i.category)));

  return {
    user: session.user,
    users,
    expenses,
    incomes,
    expenseCategories,
    incomeCategories,
    categoryConfigs: configs,
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
      date: data.date ? new Date(data.date) : new Date(),
      status: data.status || "paid",
      recurrenceId,
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
        date: updateData.date ? new Date(updateData.date) : new Date(),
        status: updateData.status || "paid",
        recurrenceId,
      })
      .where(eq(expense.id, id));
    return { success: true };
  });

export const updateTransactionStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) => data)
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
      date: data.date ? new Date(data.date) : new Date(),
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
        date: updateData.date ? new Date(updateData.date) : new Date(),
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
          date: new Date(tx.date),
          status: tx.status || "paid",
        });
      } else {
        await db.insert(income).values({
          userId,
          description: tx.description,
          amount: Math.round(tx.amount),
          category: tx.category,
          date: new Date(tx.date),
          status: tx.status || "paid",
        });
      }
    }
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
