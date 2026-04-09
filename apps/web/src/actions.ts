import axios from 'axios'; export async function addExpense(data: any) { return axios.post('/api/expenses', data);
} export async function updateExpense(id: string, data: any) { return axios.put(`/api/expenses/${id}`, data);
} export async function deleteExpense(id: string) { return axios.delete(`/api/expenses/${id}`);
} export async function addIncome(data: any) { return axios.post('/api/incomes', data);
} export async function updateIncome(id: string, data: any) { return axios.put(`/api/incomes/${id}`, data);
} export async function deleteIncome(id: string) { return axios.delete(`/api/incomes/${id}`);
} export async function bulkDeleteTransactions(ids: string[], type: 'expense' | 'income') { return axios.post('/api/bulk-delete', { ids, type });
}
