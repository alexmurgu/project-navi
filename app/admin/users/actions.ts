"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/get-session";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export async function createUser(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized");
    }

    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const name = formData.get('name')?.toString() ?? '';

    if (!email || !password || !name) {
        return;
    }

    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        });
        revalidatePath("/admin/users");
    } catch (err: any) {
        console.error(err);
    }
}

export async function deleteUser(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized");
    }

    const id = formData.get('id')?.toString();
    if (!id) {
        return;
    }

    const [userToDelete] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (userToDelete?.email === ADMIN_EMAIL) {
        return;
    }

    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/admin/users");
}
