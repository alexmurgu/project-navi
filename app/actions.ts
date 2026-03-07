"use server";

import { db } from "@/lib/db";
import { expense, income, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";

export async function addExpense(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const description = formData.get('description')?.toString();
    const amount = parseFloat(formData.get('amount')?.toString() || '0');
    const category = formData.get('category')?.toString();
    const isMonthly = formData.get('isMonthly') === 'on';
    const dateStr = formData.get('date')?.toString();
    const targetUserId = formData.get('userId')?.toString();

    if (!description || isNaN(amount) || !category) {
        return;
    }

    const amountCents = Math.round(amount * 100);
    const date = dateStr ? new Date(dateStr) : new Date();
    const userId = targetUserId === 'family' ? null : targetUserId || session.user.id;

    await db.insert(expense).values({
        userId,
        description,
        amount: amountCents,
        category,
        isMonthly,
        date
    });

    revalidatePath("/");
}

export async function deleteExpense(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = formData.get('id')?.toString();
    if (!id) return;

    await db.delete(expense).where(eq(expense.id, id));
    revalidatePath("/");
}

export async function updateExpense(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = formData.get('id')?.toString();
    const description = formData.get('description')?.toString();
    const amount = parseFloat(formData.get('amount')?.toString() || '0');
    const category = formData.get('category')?.toString();
    const isMonthly = formData.get('isMonthly') === 'on';
    const dateStr = formData.get('date')?.toString();
    const targetUserId = formData.get('userId')?.toString();

    if (!id || !description || isNaN(amount) || !category) {
        return;
    }

    const amountCents = Math.round(amount * 100);
    const date = dateStr ? new Date(dateStr) : new Date();
    const userId = targetUserId === 'family' ? null : targetUserId || session.user.id;

    await db.update(expense).set({
        userId,
        description,
        amount: amountCents,
        category,
        isMonthly,
        date
    }).where(eq(expense.id, id));

    revalidatePath("/");
}

export async function addIncome(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const description = formData.get('description')?.toString();
    const amount = parseFloat(formData.get('amount')?.toString() || '0');
    const category = formData.get('category')?.toString();
    const dateStr = formData.get('date')?.toString();
    const targetUserId = formData.get('userId')?.toString();

    if (!description || isNaN(amount) || !category) {
        return;
    }

    const amountCents = Math.round(amount * 100);
    const date = dateStr ? new Date(dateStr) : new Date();
    const userId = targetUserId === 'family' ? null : targetUserId || session.user.id;

    await db.insert(income).values({
        userId,
        description,
        amount: amountCents,
        category,
        date
    });

    revalidatePath("/");
}

export async function deleteIncome(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = formData.get('id')?.toString();
    if (!id) return;

    await db.delete(income).where(eq(income.id, id));
    revalidatePath("/");
}

export async function updateIncome(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const id = formData.get('id')?.toString();
    const description = formData.get('description')?.toString();
    const amount = parseFloat(formData.get('amount')?.toString() || '0');
    const category = formData.get('category')?.toString();
    const dateStr = formData.get('date')?.toString();
    const targetUserId = formData.get('userId')?.toString();

    if (!id || !description || isNaN(amount) || !category) {
        return;
    }

    const amountCents = Math.round(amount * 100);
    const date = dateStr ? new Date(dateStr) : new Date();
    const userId = targetUserId === 'family' ? null : targetUserId || session.user.id;

    await db.update(income).set({
        userId,
        description,
        amount: amountCents,
        category,
        date
    }).where(eq(income.id, id));

    revalidatePath("/");
}
