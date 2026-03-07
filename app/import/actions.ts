"use server";

import { db } from "@/lib/db";
import { expense, income } from "@/lib/db/schema";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";

export async function bulkImportTransactions(transactions: any[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    for (const tx of transactions) {
        const amountCents = Math.round(tx.amount * 100);
        const userId = tx.userId === 'family' ? null : tx.userId;

        if (tx.type === 'expense') {
            await db.insert(expense).values({
                userId,
                description: tx.description,
                amount: amountCents,
                category: tx.category,
                isMonthly: tx.isMonthly || false,
                date: new Date(tx.date)
            });
        } else {
            await db.insert(income).values({
                userId,
                description: tx.description,
                amount: amountCents,
                date: new Date(tx.date)
            });
        }
    }

    revalidatePath("/");
    return { success: true };
}
