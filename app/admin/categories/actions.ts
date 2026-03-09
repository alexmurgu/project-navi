"use server";

import { db } from "@/lib/db";
import { categoryConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export async function upsertCategoryColor(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized");
    }

    const name = formData.get('name')?.toString();
    const color = formData.get('color')?.toString();

    if (!name || !color) return;

    await db.insert(categoryConfig)
        .values({ name, color })
        .onConflictDoUpdate({
            target: categoryConfig.name,
            set: { color }
        });

    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function deleteCategoryConfig(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized");
    }

    const id = formData.get('id')?.toString();
    if (!id) return;

    await db.delete(categoryConfig).where(eq(categoryConfig.id, id));
    
    revalidatePath("/admin/categories");
    revalidatePath("/");
}
