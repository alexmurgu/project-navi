# Implementation Plan: Monthly Recurrence & Payment Status

## Objective
Implement a system for handling monthly recurring expenses and incomes, including tracking whether an auto-generated instance has been "paid" or is still "pending" for the current month.

## Key Files & Context
- `src/db/schema.ts`: Database schema definitions.
- `src/actions.ts`: Server-side actions for data mutation and fetching.
- `src/dashboard-content.tsx`: The main dashboard view and transaction list.
- `src/expenses-content.tsx` & `src/incomes-content.tsx`: The dedicated list views.
- `src/components/transaction-sheet.tsx`: The form used to create/edit transactions.

## Implementation Steps

### 1. Database Schema Updates
- **Table `expense`:**
  - Add `status: text("status", { enum: ["pending", "paid"] }).notNull().default("paid")`.
  - Add `recurrenceId: text("recurrence_id")` to group auto-generated instances back to their original template.
- **Table `income`:**
  - Add `status: text("status", { enum: ["pending", "paid"] }).notNull().default("paid")`. (No recurrence for incomes).

### 2. Server Logic (`src/actions.ts`)
- **`syncRecurringTransactions` Function:** 
  - Create a helper that runs when fetching dashboard data.
  - It finds all transactions where `isMonthly = true` in the `expense` table.
  - For each, it checks if an instance exists for the *current calendar month* with the same `recurrenceId`.
  - If no instance exists for this month, it auto-generates a new record in the `expense` table with `status = "pending"` and the correct date.
- **Update Mutations (`addExpense`, `updateExpense`):**
  - Accept and save the new `status` and `recurrenceId` fields.
  - If a new expense is marked `isMonthly = true`, generate a unique UUID for its `recurrenceId` to track future instances.
- **Toggle Status Action:**
  - Add a dedicated action `toggleTransactionStatus(id: string, type: "expense" | "income", newStatus: "pending" | "paid")`.

### 3. UI Enhancements
- **Dashboard Totals:** Update the calculation logic in `dashboard-content.tsx` so that only `paid` expenses/incomes affect the "Available Balance" and "Expenses (Monthly)" totals.
- **Transaction Rows:** 
  - Add a visual indicator (e.g., an amber "Pending" badge) to transactions with `status === "pending"`.
  - Add a quick-action button on the row to instantly mark it as "Paid".
- **Transaction Sheet:**
  - Add a toggle for "Status: Pending / Paid" when editing or creating an item.
  - Keep the existing "Monthly" toggle, but clarify its intent (e.g., "Repeat Monthly").

## Verification & Testing
1. Create a "Monthly" expense on a past date.
2. Reload the dashboard; a new "Pending" instance should be auto-generated for the current month.
3. Verify the "Pending" amount does not deduct from the available balance.
4. Click "Mark as Paid" and verify the balance updates and the badge disappears.
