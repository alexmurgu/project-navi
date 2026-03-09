import { db } from "@/lib/db";
import { expense, income, categoryConfig } from "@/lib/db/schema";
import { getSession } from "@/lib/get-session";
import { redirect, notFound } from "next/navigation";
import { CategoriesContent } from "./categories-content";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export default async function CategoriesPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.user.email !== ADMIN_EMAIL) {
        notFound();
    }

    // Get all unique categories currently in use
    const uniqueExpenseCategories = await db.selectDistinct({ name: expense.category }).from(expense);
    const uniqueIncomeCategories = await db.selectDistinct({ name: income.category }).from(income);
    const inUseNames = Array.from(new Set([
        ...uniqueExpenseCategories.map(c => c.name),
        ...uniqueIncomeCategories.map(c => c.name)
    ])).filter(Boolean);

    // Get existing configs
    const configs = await db.select().from(categoryConfig);
    const configMap: Record<string, { id: string; name: string; color: string }> = {};
    configs.forEach(c => {
        configMap[c.name] = c;
    });

    // Merge: show everything in use + everything already configured
    const allCategoryNames = Array.from(new Set([
        ...inUseNames,
        ...configs.map(c => c.name)
    ])).sort();

    return (
        <CategoriesContent 
            allCategoryNames={allCategoryNames} 
            configMap={configMap} 
        />
    );
}
