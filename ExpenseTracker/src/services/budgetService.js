import { supabase } from '../lib/supabase';

const withTimeout = (promise, ms = 1500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms))
  ]);
};

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

const getUserBudgetKey = (user) => {
  if (!user) return 'tracker_budget_guest';
  const identifier = user.id || user.email || 'guest';
  return `tracker_budget_${identifier}`;
};

const getLocalBudget = (user) => {
  const key = getUserBudgetKey(user);
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const saveLocalBudget = (user, budget) => {
  const key = getUserBudgetKey(user);
  if (!budget) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(budget));
  }
};

export const budgetService = {
  // Get active user's budget
  async getBudget() {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const queryPromise = supabase
          .from('budgets')
          .select('*')
          .eq('user_id', activeUser.id)
          .maybeSingle();

        const { data, error } = await withTimeout(queryPromise, 1500);
        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB budget fetch fallback to local storage:', err.message);
    }

    return getLocalBudget(activeUser);
  },

  // Set / update active user's budget (upsert)
  async setBudget({ amount, period = 'monthly', start_date = new Date().toISOString().split('T')[0] }) {
    const activeUser = await getActiveUser();
    const parsedAmount = Math.max(0, parseFloat(amount) || 0);

    const payload = {
      amount: parsedAmount,
      period,
      start_date,
      updated_at: new Date().toISOString(),
    };

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const { data: existing } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', activeUser.id)
          .maybeSingle();

        let res;
        if (existing?.id) {
          res = await supabase
            .from('budgets')
            .update(payload)
            .eq('id', existing.id)
            .eq('user_id', activeUser.id)
            .select()
            .single();
        } else {
          res = await supabase
            .from('budgets')
            .insert([{ ...payload, user_id: activeUser.id }])
            .select()
            .single();
        }

        if (res.error) throw res.error;
        if (res.data) return res.data;
      }
    } catch (err) {
      console.warn('Supabase DB setBudget fallback to local storage:', err.message);
    }

    // Local fallback
    const localBudget = {
      id: 'bgt-' + Date.now(),
      user_id: activeUser?.id || activeUser?.email || 'guest',
      ...payload,
      created_at: new Date().toISOString(),
    };
    saveLocalBudget(activeUser, localBudget);
    return localBudget;
  },

  // Pure summary calculation from given expenses array and budget object
  getSpendingSummary(expenses = [], budget = null) {
    if (!budget || !budget.amount || Number(budget.amount) <= 0) {
      return {
        hasBudget: false,
        budgetAmount: 0,
        period: budget?.period || 'monthly',
        totalSpent: 0,
        remaining: 0,
        percentUsed: 0,
        isOverBudget: false,
        overspendAmount: 0,
      };
    }

    const budgetAmount = Number(budget.amount) || 0;
    const period = budget.period || 'monthly';
    const now = new Date();

    const filteredExpenses = expenses.filter(item => {
      if (!item.expense_date) return false;
      const d = new Date(item.expense_date);
      if (isNaN(d.getTime())) return false;

      if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }

      if (period === 'yearly') {
        return d.getFullYear() === now.getFullYear();
      }

      // Default: monthly
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const totalSpent = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remaining = budgetAmount - totalSpent;
    const percentUsed = (totalSpent / budgetAmount) * 100;
    const isOverBudget = totalSpent > budgetAmount;
    const overspendAmount = isOverBudget ? totalSpent - budgetAmount : 0;

    return {
      hasBudget: true,
      budgetAmount,
      period,
      totalSpent,
      remaining,
      percentUsed,
      isOverBudget,
      overspendAmount,
    };
  }
};
