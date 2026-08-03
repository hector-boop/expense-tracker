import { supabase } from '../lib/supabase';
import { expenseService } from './expenseService';

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

const getUserDebtKey = (user) => {
  if (!user) return 'tracker_debts_guest';
  const identifier = user.id || user.email || 'guest';
  return `tracker_debts_${identifier}`;
};

const getLocalDebts = (user) => {
  const key = getUserDebtKey(user);
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
};

const saveLocalDebts = (user, debts) => {
  const key = getUserDebtKey(user);
  localStorage.setItem(key, JSON.stringify(debts));
};

export const debtService = {
  async getDebts() {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const queryPromise = supabase
          .from('debts')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: false });

        const { data, error } = await withTimeout(queryPromise, 1500);

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB debt fetch fallback to local storage:', err.message);
    }

    return getLocalDebts(activeUser);
  },

  async addDebt(debt) {
    const activeUser = await getActiveUser();
    const amount = Math.max(0, parseFloat(debt.amount) || 0);
    const amountPaid = Math.max(0, parseFloat(debt.amount_paid) || 0);

    let status = 'pending';
    if (amountPaid >= amount && amount > 0) {
      status = 'settled';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    }

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          type: debt.type || 'i_owe',
          person: debt.person ? debt.person.trim() : 'Unknown',
          title: debt.title ? debt.title.trim() : '',
          amount: amount,
          amount_paid: amountPaid,
          due_date: debt.due_date || null,
          notes: debt.notes || '',
          category: debt.category || 'Debts',
          status: status,
          user_id: activeUser.id,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('debts')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB debt add fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalDebts(activeUser);
    const newDebt = {
      id: 'debt-' + Date.now(),
      type: debt.type || 'i_owe',
      person: debt.person ? debt.person.trim() : 'Unknown',
      title: debt.title ? debt.title.trim() : '',
      amount: amount,
      amount_paid: amountPaid,
      due_date: debt.due_date || '',
      notes: debt.notes || '',
      category: debt.category || 'Debts',
      status: status,
      user_id: activeUser?.id || activeUser?.email || 'guest',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newDebt, ...local];
    saveLocalDebts(activeUser, updated);
    return newDebt;
  },

  async updateDebt(id, updatedFields) {
    const activeUser = await getActiveUser();
    const currentDebts = await this.getDebts();
    const existing = currentDebts.find(d => d.id === id);

    const amount = updatedFields.amount !== undefined ? Math.max(0, parseFloat(updatedFields.amount) || 0) : (existing?.amount || 0);
    const amountPaid = updatedFields.amount_paid !== undefined ? Math.max(0, parseFloat(updatedFields.amount_paid) || 0) : (existing?.amount_paid || 0);

    let status = 'pending';
    if (amountPaid >= amount && amount > 0) {
      status = 'settled';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    }

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          ...updatedFields,
          amount,
          amount_paid: amountPaid,
          status,
          due_date: updatedFields.due_date || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('debts')
          .update(payload)
          .eq('id', id)
          .eq('user_id', activeUser.id)
          .select()
          .single();

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB debt update fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalDebts(activeUser);
    const index = local.findIndex(d => d.id === id);
    if (index !== -1) {
      const updatedDebt = {
        ...local[index],
        ...updatedFields,
        amount,
        amount_paid: amountPaid,
        status,
        updated_at: new Date().toISOString(),
      };
      local[index] = updatedDebt;
      saveLocalDebts(activeUser, local);
      return updatedDebt;
    }
    throw new Error('Debt not found');
  },

  async recordPayment(id, paymentAmount, logAsExpense = false) {
    const activeUser = await getActiveUser();
    const currentDebts = await this.getDebts();
    const debt = currentDebts.find(d => d.id === id);

    if (!debt) {
      throw new Error('Debt not found');
    }

    const addAmt = Math.max(0, parseFloat(paymentAmount) || 0);
    const newPaidAmt = Math.min(debt.amount, debt.amount_paid + addAmt);

    let status = 'pending';
    if (newPaidAmt >= debt.amount && debt.amount > 0) {
      status = 'settled';
    } else if (newPaidAmt > 0) {
      status = 'partially_paid';
    }

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          amount_paid: newPaidAmt,
          status,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('debts')
          .update(payload)
          .eq('id', id)
          .eq('user_id', activeUser.id)
          .select()
          .single();

        if (error) throw error;

        if (logAsExpense && debt.type === 'i_owe' && addAmt > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          await expenseService.addExpense({
            title: `Debt Payment: ${debt.title || debt.person} (${debt.person})`,
            amount: addAmt,
            category: debt.category || 'Bills',
            payment_method: 'Bank Transfer',
            expense_date: todayStr,
            notes: `Payment towards debt to ${debt.person}. ${debt.notes || ''}`.trim()
          });
        }

        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB debt record payment fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalDebts(activeUser);
    const index = local.findIndex(d => d.id === id);
    if (index !== -1) {
      local[index].amount_paid = newPaidAmt;
      local[index].status = status;
      local[index].updated_at = new Date().toISOString();
      saveLocalDebts(activeUser, local);

      if (logAsExpense && debt.type === 'i_owe' && addAmt > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        await expenseService.addExpense({
          title: `Debt Payment: ${debt.title || debt.person} (${debt.person})`,
          amount: addAmt,
          category: debt.category || 'Bills',
          payment_method: 'Bank Transfer',
          expense_date: todayStr,
          notes: `Payment towards debt to ${debt.person}. ${debt.notes || ''}`.trim()
        });
      }

      return local[index];
    }
    throw new Error('Debt not found');
  },

  async deleteDebt(id) {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', id)
          .eq('user_id', activeUser.id);

        if (error) throw error;
        return true;
      }
    } catch (err) {
      console.warn('Supabase DB debt delete fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalDebts(activeUser);
    const filtered = local.filter(d => d.id !== id);
    saveLocalDebts(activeUser, filtered);
    return true;
  },

  async deleteDebts(ids) {
    if (!ids || ids.length === 0) return true;
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const { error } = await supabase
          .from('debts')
          .delete()
          .in('id', ids)
          .eq('user_id', activeUser.id);

        if (error) throw error;
        return true;
      }
    } catch (err) {
      console.warn('Supabase DB debt delete batch fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalDebts(activeUser);
    const filtered = local.filter(d => !ids.includes(d.id));
    saveLocalDebts(activeUser, filtered);
    return true;
  }
};
