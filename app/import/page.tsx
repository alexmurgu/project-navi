import { db } from "@/lib/db";
import { user, expense, income, categoryConfig } from "@/lib/db/schema";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { ImportContent } from "./import-content";

export default async function ImportPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const allUsers = await db.select({ id: user.id, name: user.name }).from(user);
    
    const uniqueExpenseCategories = await db.selectDistinct({ category: expense.category }).from(expense);
    const uniqueIncomeCategories = await db.selectDistinct({ category: income.category }).from(income);
    const categoryConfigs = await db.select().from(categoryConfig);
    
    const allCategories = Array.from(new Set([
        ...uniqueExpenseCategories.map((c) => c.category),
        ...uniqueIncomeCategories.map((c) => c.category)
    ])).filter(Boolean);

    return (
        <ImportContent 
            users={allUsers} 
            categories={allCategories} 
            categoryConfigs={categoryConfigs}
            currentUserId={session.user.id} 
        />
    );
}
