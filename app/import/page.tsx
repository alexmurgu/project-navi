import { db } from "@/lib/db";
import { user, expense } from "@/lib/db/schema";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { ImportContent } from "./import-content";

export default async function ImportPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const allUsers = await db.select({ id: user.id, name: user.name }).from(user);
    const uniqueCategories = await db.selectDistinct({ category: expense.category }).from(expense);
    const allCategories = uniqueCategories.map((c) => c.category).filter(Boolean);

    return (
        <ImportContent 
            users={allUsers} 
            categories={allCategories} 
            currentUserId={session.user.id} 
        />
    );
}
