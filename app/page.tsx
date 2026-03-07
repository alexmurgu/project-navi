import { db } from "@/lib/db";
import { expense, income, user, categoryConfig } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export default async function Page() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    // Fetch all users for attribution selection
    const allUsers = await db.select({ id: user.id, name: user.name }).from(user);

    // Fetch all family data
    const familyExpenses = await db
        .select({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            isMonthly: expense.isMonthly,
            userId: expense.userId,
            userName: user.name
        })
        .from(expense)
        .leftJoin(user, eq(expense.userId, user.id))
        .orderBy(desc(expense.date));

    const familyIncomes = await db
        .select({
            id: income.id,
            description: income.description,
            amount: income.amount,
            category: income.category,
            date: income.date,
            userId: income.userId,
            userName: user.name
        })
        .from(income)
        .leftJoin(user, eq(income.userId, user.id))
        .orderBy(desc(income.date));

    const uniqueExpenseCategories = await db.selectDistinct({ category: expense.category }).from(expense);
    const uniqueIncomeCategories = await db.selectDistinct({ category: income.category }).from(income);
    const categoryConfigs = await db.select().from(categoryConfig);
    
    const allCategories = Array.from(new Set([
        ...uniqueExpenseCategories.map((c) => c.category),
        ...uniqueIncomeCategories.map((c) => c.category)
    ])).filter(Boolean);

    const data = {
        user: session.user,
        users: allUsers,
        expenses: familyExpenses.map((e) => ({ ...e, userName: e.userName || 'Family Wide', date: e.date.toISOString() })),
        incomes: familyIncomes.map((i) => ({ ...i, userName: i.userName || 'Family Wide', date: i.date.toISOString() })),
        categories: allCategories,
        categoryConfigs
    };

    return <DashboardContent data={data} />;
}
