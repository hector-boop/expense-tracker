import { supabase } from '../lib/supabase';
import { deletePhotoFromStorage } from '../utils/imageUtils';

// Default initial categories
export const DEFAULT_CATEGORIES = [
  'Food',
  'Transportation',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Utilities',
  'Other',
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

const sanitizeExpenseDate = (dStr) => {
  const today = getTodayStr();
  if (!dStr || dStr > today) {
    return today;
  }
  return dStr;
};

const withTimeout = (promise, ms = 1500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms))
  ]);
};

// Helper to get active user (either from Supabase session or demo_user in localStorage)
const getActiveUser = async () => {
  const savedDemoUser = localStorage.getItem('demo_user');
  if (savedDemoUser) {
    try {
      const parsed = JSON.parse(savedDemoUser);
      if (parsed) return parsed;
    } catch { /* ignore */ }
  }

  try {
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 1500);
    if (user) return user;
  } catch (err) {
    console.warn('Supabase auth get user error:', err.message);
  }

  return null;
};

// Helper to get user-specific storage key so accounts NEVER share data
const getUserStorageKey = (user) => {
  if (!user) return 'tracker_expenses_guest';
  const identifier = user.id || user.email || 'guest';
  return `tracker_expenses_${identifier}`;
};

const getLocalExpensesForUser = (user) => {
  const key = getUserStorageKey(user);
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
  const parsed = JSON.parse(data);
  // Auto-clamp any existing future expense dates to todayStr
  const today = getTodayStr();
  return parsed.map(exp => {
    if (exp.expense_date && exp.expense_date > today) {
      return { ...exp, expense_date: today };
    }
    return exp;
  });
};

const saveLocalExpensesForUser = (user, expenses) => {
  const key = getUserStorageKey(user);
  localStorage.setItem(key, JSON.stringify(expenses));
};

export const expenseService = {
  // Clear all local data across all accounts
  clearAllAccountData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('tracker_expenses_') || 
          key.startsWith('custom_categories_') || 
          key === 'tracker_expenses_fallback'
        ) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  // Read all expenses for active user (isolated per user account)
  async getExpenses() {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const queryPromise = supabase
          .from('expenses')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('expense_date', { ascending: false });

        const { data, error } = await withTimeout(queryPromise, 1500);

        if (error) throw error;
        if (data) {
          return data.map(exp => ({
            ...exp,
            expense_date: sanitizeExpenseDate(exp.expense_date)
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase DB fetch fallback to user-isolated storage:', err.message);
    }

    // Return user-specific isolated expenses (starts clean [] for new accounts)
    return getLocalExpensesForUser(activeUser);
  },

  // Create new expense for active user
  async addExpense(expense) {
    const activeUser = await getActiveUser();
    const safeDate = sanitizeExpenseDate(expense.expense_date);

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          title: expense.title,
          amount: parseFloat(expense.amount),
          category: expense.category,
          payment_method: expense.payment_method || 'Cash',
          expense_date: safeDate,
          notes: expense.notes || '',
          photos: expense.photos || [],
          user_id: activeUser.id,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('expenses')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB add fallback to user-isolated storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalExpensesForUser(activeUser);
    const newExpense = {
      ...expense,
      amount: parseFloat(expense.amount),
      payment_method: expense.payment_method || 'Cash',
      expense_date: safeDate,
      photos: expense.photos || [],
      id: 'exp-' + Date.now(),
      user_id: activeUser?.id || activeUser?.email || 'guest',
      created_at: new Date().toISOString(),
    };
    const updated = [newExpense, ...local];
    saveLocalExpensesForUser(activeUser, updated);
    return newExpense;
  },

  // Update existing expense for active user
  async updateExpense(id, expense) {
    const activeUser = await getActiveUser();
    const safeDate = sanitizeExpenseDate(expense.expense_date);

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          title: expense.title,
          amount: parseFloat(expense.amount),
          category: expense.category,
          payment_method: expense.payment_method || 'Cash',
          expense_date: safeDate,
          notes: expense.notes || '',
          photos: expense.photos || [],
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', id)
          .eq('user_id', activeUser.id)
          .select()
          .single();

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB update fallback to user-isolated storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalExpensesForUser(activeUser);
    const index = local.findIndex(item => item.id === id);
    if (index !== -1) {
      local[index] = { 
        ...local[index], 
        ...expense, 
        amount: parseFloat(expense.amount),
        expense_date: safeDate,
        photos: expense.photos || local[index].photos || [],
        payment_method: expense.payment_method || local[index].payment_method || 'Cash'
      };
      saveLocalExpensesForUser(activeUser, local);
      return local[index];
    }
    throw new Error('Expense not found');
  },

  // Delete single expense for active user
  async deleteExpense(id) {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        // Fetch photos before deleting so we can clean up storage
        const { data: existing } = await supabase
          .from('expenses')
          .select('photos')
          .eq('id', id)
          .eq('user_id', activeUser.id)
          .single();

        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', activeUser.id);

        if (error) throw error;

        // Clean up storage photos (silently ignores Base64 entries)
        if (existing?.photos?.length) {
          await Promise.allSettled(existing.photos.map(url => deletePhotoFromStorage(url)));
        }

        return true;
      }
    } catch (err) {
      console.warn('Supabase DB delete fallback to user-isolated storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalExpensesForUser(activeUser);
    const filtered = local.filter(item => item.id !== id);
    saveLocalExpensesForUser(activeUser, filtered);
    return true;
  },

  // Delete multiple expenses for active user
  async deleteExpenses(ids) {
    if (!ids || ids.length === 0) return true;
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        // Fetch photos for all expenses before deleting
        const { data: existing } = await supabase
          .from('expenses')
          .select('photos')
          .in('id', ids)
          .eq('user_id', activeUser.id);

        const { error } = await supabase
          .from('expenses')
          .delete()
          .in('id', ids)
          .eq('user_id', activeUser.id);

        if (error) throw error;

        // Clean up all storage photos in parallel
        if (existing?.length) {
          const allUrls = existing.flatMap(e => e.photos || []);
          await Promise.allSettled(allUrls.map(url => deletePhotoFromStorage(url)));
        }

        return true;
      }
    } catch (err) {
      console.warn('Supabase DB delete batch fallback:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalExpensesForUser(activeUser);
    const filtered = local.filter(item => !ids.includes(item.id));
    saveLocalExpensesForUser(activeUser, filtered);
    return true;
  }
};
