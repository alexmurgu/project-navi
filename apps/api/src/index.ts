import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { auth } from './auth';
import { db } from './db';
import { expense, income, user, categoryConfig } from './db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();

app.use('*', cors());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

// Better Auth handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Middleware to get user session
const getSession = async (c: any) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  });
  return session;
};

// --- API Routes ---

// Dashboard Data
app.get('/api/dashboard', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const expenses = await db.select({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    isMonthly: expense.isMonthly,
    userId: expense.userId,
    userName: sql`COALESCE(${user.name}, 'Family Wide')`
  }).from(expense)
    .leftJoin(user, eq(expense.userId, user.id));

  const incomes = await db.select({
    id: income.id,
    description: income.description,
    amount: income.amount,
    category: income.category,
    date: income.date,
    userId: income.userId,
    userName: sql`COALESCE(${user.name}, 'Family Wide')`
  }).from(income)
    .leftJoin(user, eq(income.userId, user.id));

  const users = await db.select({ id: user.id, name: user.name }).from(user);
  const configs = await db.select().from(categoryConfig);
  
  const expenseCategories = Array.from(new Set(expenses.map((e: { category: string }) => e.category)));
  const incomeCategories = Array.from(new Set(incomes.map((i: { category: string }) => i.category)));

  return c.json({
    user: session.user,
    users,
    expenses,
    incomes,
    expenseCategories,
    incomeCategories,
    categoryConfigs: configs
  });
});

// Expenses
app.post('/api/expenses', zValidator('json', z.object({
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  isMonthly: z.boolean().optional(),
  date: z.string().optional(),
  userId: z.string().nullable()
})), async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const data = c.req.valid('json');
  await db.insert(expense).values({
    userId: data.userId === 'family' ? null : data.userId || session.user.id,
    description: data.description,
    amount: Math.round(data.amount),
    category: data.category,
    isMonthly: data.isMonthly || false,
    date: data.date ? new Date(data.date) : new Date()
  });
  return c.json({ success: true });
});

app.put('/api/expenses/:id', zValidator('json', z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string(),
    isMonthly: z.boolean().optional(),
    date: z.string().optional(),
    userId: z.string().nullable()
  })), async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const data = c.req.valid('json');
    await db.update(expense).set({
      userId: data.userId === 'family' ? null : data.userId || session.user.id,
      description: data.description,
      amount: Math.round(data.amount),
      category: data.category,
      isMonthly: data.isMonthly || false,
      date: data.date ? new Date(data.date) : new Date()
    }).where(eq(expense.id, id));
    return c.json({ success: true });
});

app.delete('/api/expenses/:id', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  await db.delete(expense).where(eq(expense.id, id));
  return c.json({ success: true });
});

// Incomes
app.post('/api/incomes', zValidator('json', z.object({
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  date: z.string().optional(),
  userId: z.string().nullable()
})), async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const data = c.req.valid('json');
  await db.insert(income).values({
    userId: data.userId === 'family' ? null : data.userId || session.user.id,
    description: data.description,
    amount: Math.round(data.amount),
    category: data.category,
    date: data.date ? new Date(data.date) : new Date()
  });
  return c.json({ success: true });
});

app.put('/api/incomes/:id', zValidator('json', z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string(),
    date: z.string().optional(),
    userId: z.string().nullable()
  })), async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const data = c.req.valid('json');
    await db.update(income).set({
      userId: data.userId === 'family' ? null : data.userId || session.user.id,
      description: data.description,
      amount: Math.round(data.amount),
      category: data.category,
      date: data.date ? new Date(data.date) : new Date()
    }).where(eq(income.id, id));
    return c.json({ success: true });
});

app.delete('/api/incomes/:id', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  await db.delete(income).where(eq(income.id, id));
  return c.json({ success: true });
});

// Bulk Import
app.post('/api/import', zValidator('json', z.array(z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: z.enum(['expense', 'income']),
    category: z.string(),
    userId: z.string().nullable(),
    isMonthly: z.boolean().optional()
}))), async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const transactions = c.req.valid('json');
    for (const tx of transactions) {
        const userId = tx.userId === 'family' ? null : tx.userId;
        if (tx.type === 'expense') {
            await db.insert(expense).values({
                userId, description: tx.description, amount: Math.round(tx.amount),
                category: tx.category, isMonthly: tx.isMonthly || false, date: new Date(tx.date)
            });
        } else {
            await db.insert(income).values({
                userId, description: tx.description, amount: Math.round(tx.amount),
                category: tx.category, date: new Date(tx.date)
            });
        }
    }
    return c.json({ success: true });
});

// Admin - Users
app.get('/api/admin/users', async (c) => {
  const session = await getSession(c);
  if (!session || session.user.email !== ADMIN_EMAIL) return c.json({ error: 'Unauthorized' }, 401);
  const users = await db.select().from(user);
  return c.json(users);
});

app.post('/api/admin/users', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string()
})), async (c) => {
  const session = await getSession(c);
  if (!session || session.user.email !== ADMIN_EMAIL) return c.json({ error: 'Unauthorized' }, 401);
  const data = c.req.valid('json');
  await auth.api.signUpEmail({ body: data });
  return c.json({ success: true });
});

app.delete('/api/admin/users/:id', async (c) => {
  const session = await getSession(c);
  if (!session || session.user.email !== ADMIN_EMAIL) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const [userToDelete] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (userToDelete?.email === ADMIN_EMAIL) return c.json({ error: 'Cannot delete admin' }, 400);
  await db.delete(user).where(eq(user.id, id));
  return c.json({ success: true });
});

// Admin - Categories
app.post('/api/admin/categories', zValidator('json', z.object({
  name: z.string(),
  color: z.string(),
  icon: z.string().nullable().optional()
})), async (c) => {
  const session = await getSession(c);
  if (!session || session.user.email !== ADMIN_EMAIL) return c.json({ error: 'Unauthorized' }, 401);
  const data = c.req.valid('json');
  await db.insert(categoryConfig).values({
    name: data.name,
    color: data.color,
    icon: data.icon ?? null
  }).onConflictDoUpdate({
    target: categoryConfig.name,
    set: {
      color: data.color,
      icon: data.icon ?? null
    }
  });
  return c.json({ success: true });
});

app.delete('/api/admin/categories/:id', async (c) => {
  const session = await getSession(c);
  if (!session || session.user.email !== ADMIN_EMAIL) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  await db.delete(categoryConfig).where(eq(categoryConfig.id, id));
  return c.json({ success: true });
});

// Static Assets (Production)
app.use('/assets/*', serveStatic({ root: '../web/dist' }));
app.get('*', async (c) => {
  // SPA fallback for TanStack Router
  try {
    const indexPath = path.join(__dirname, '../../web/dist/index.html');
    const content = await fs.readFile(indexPath, 'utf-8');
    return c.html(content);
  } catch {
    return c.text('Project Navi API - Use port 5173 for Frontend Dev', 200);
  }
});

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
