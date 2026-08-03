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

const getUserBillKey = (user) => {
  if (!user) return 'tracker_bills_guest';
  const identifier = user.id || user.email || 'guest';
  return `tracker_bills_${identifier}`;
};

const getLocalBills = (user) => {
  const key = getUserBillKey(user);
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
};

const saveLocalBills = (user, bills) => {
  const key = getUserBillKey(user);
  localStorage.setItem(key, JSON.stringify(bills));
};

export const billService = {
  async getBills() {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const queryPromise = supabase
          .from('incoming_bills')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: false });

        const { data, error } = await withTimeout(queryPromise, 1500);

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB bill fetch fallback to local storage:', err.message);
    }

    return getLocalBills(activeUser);
  },

  async addBill(bill) {
    const activeUser = await getActiveUser();

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const payload = {
          title: bill.title,
          amount: parseFloat(bill.amount),
          category: bill.category || 'Bills',
          payment_method: bill.payment_method || 'Cash',
          due_date: bill.due_date || null,
          notes: bill.notes || '',
          is_paid: false,
          user_id: activeUser.id,
        };

        const { data, error } = await supabase
          .from('incoming_bills')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        if (data) return data;
      }
    } catch (err) {
      console.warn('Supabase DB bill add fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalBills(activeUser);
    const newBill = {
      id: 'bill-' + Date.now(),
      title: bill.title,
      amount: parseFloat(bill.amount),
      category: bill.category || 'Bills',
      payment_method: bill.payment_method || 'Cash',
      due_date: bill.due_date,
      notes: bill.notes || '',
      is_paid: false,
      user_id: activeUser?.id || activeUser?.email || 'guest',
      created_at: new Date().toISOString(),
    };
    const updated = [newBill, ...local];
    saveLocalBills(activeUser, updated);
    return newBill;
  },

  async markAsPaid(billId) {
    const activeUser = await getActiveUser();
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        // Fetch the bill first so we can log it as an expense
        const { data: bill, error: fetchError } = await supabase
          .from('incoming_bills')
          .select('*')
          .eq('id', billId)
          .eq('user_id', activeUser.id)
          .single();

        if (fetchError) throw fetchError;

        const { data: updated, error: updateError } = await supabase
          .from('incoming_bills')
          .update({ is_paid: true, paid_at: new Date().toISOString() })
          .eq('id', billId)
          .eq('user_id', activeUser.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log bill payment as an expense
        const paidExpenseDate = (bill.due_date && bill.due_date < todayStr) ? bill.due_date : todayStr;
        await expenseService.addExpense({
          title: bill.title,
          amount: bill.amount,
          category: bill.category || 'Bills',
          payment_method: bill.payment_method || 'Cash',
          expense_date: paidExpenseDate,
          notes: bill.notes || '',
        });

        return updated;
      }
    } catch (err) {
      console.warn('Supabase DB bill markAsPaid fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalBills(activeUser);
    const index = local.findIndex(b => b.id === billId);
    if (index !== -1) {
      const bill = local[index];
      bill.is_paid = true;
      bill.paid_at = new Date().toISOString();
      local[index] = bill;
      saveLocalBills(activeUser, local);

      const paidExpenseDate = (bill.due_date && bill.due_date < todayStr) ? bill.due_date : todayStr;
      await expenseService.addExpense({
        title: bill.title,
        amount: bill.amount,
        category: bill.category || 'Bills',
        payment_method: bill.payment_method || 'Cash',
        expense_date: paidExpenseDate,
        notes: bill.notes || '',
      });

      return bill;
    }
    throw new Error('Bill not found');
  },

  async deleteBill(billId) {
    const activeUser = await getActiveUser();
    try {
      if (activeUser?.id && !activeUser.id.startsWith('usr_')) {
        const { error } = await supabase
          .from('incoming_bills')
          .delete()
          .eq('id', billId)
          .eq('user_id', activeUser.id);

        if (error) throw error;
        return true;
      }
    } catch (err) {
      console.warn('Supabase DB bill delete fallback to local storage:', err.message);
    }

    // Local user-isolated fallback
    const local = getLocalBills(activeUser);
    const filtered = local.filter(b => b.id !== billId);
    saveLocalBills(activeUser, filtered);
    return true;
  },
};
