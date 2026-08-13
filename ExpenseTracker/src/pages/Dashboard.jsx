import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SummaryCards } from '../components/SummaryCards';
import { BudgetOverviewCard } from '../components/BudgetOverviewCard';
import { IncomingBillsSection } from '../components/IncomingBillsSection';
import { Charts } from '../components/Charts';
import { ExpenseTable } from '../components/ExpenseTable';
import { Modal } from '../components/Modal';
import { ExpenseForm } from '../components/ExpenseForm';
import { Toast } from '../components/Toast';
import { OnboardingModal } from '../components/OnboardingModal';
import { ExportModal } from '../components/ExportModal';
import { useAuth } from '../hooks/useAuth';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { FaArrowRight, FaCheck } from 'react-icons/fa';

export const Dashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetFormAmount, setBudgetFormAmount] = useState('');
  const [budgetFormPeriod, setBudgetFormPeriod] = useState('monthly');
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState('');

  const navigate = useNavigate();

  // Show tutorial ONCE ONLY for newly registered users on their first visit
  useEffect(() => {
    if (!user?.email) return;
    const cleanEmail = user.email.toLowerCase().trim();
    const isNewUser = localStorage.getItem(`new_registration_${cleanEmail}`) === 'true';
    const hasCompleted = localStorage.getItem(`onboarding_completed_${cleanEmail}`) === 'true';

    if (isNewUser && !hasCompleted) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCloseOnboarding = () => {
    if (user?.email) {
      const cleanEmail = user.email.toLowerCase().trim();
      localStorage.setItem(`onboarding_completed_${cleanEmail}`, 'true');
      localStorage.removeItem(`new_registration_${cleanEmail}`);
    }
    setIsOnboardingOpen(false);
  };

  const refreshExpenses = async () => {
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data || []);
      if (budget) {
        const summary = budgetService.getSpendingSummary(data || [], budget);
        if (summary.isOverBudget) {
          setToast({
            message: `🚨 Over Budget Alert: You have overspent by ₱${summary.overspendAmount.toLocaleString()} this ${summary.period}!`,
            type: 'error'
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setToast({ message: 'Failed to load expenses', type: 'error' });
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      expenseService.getExpenses(),
      budgetService.getBudget()
    ]).then(([data, budgetData]) => {
      if (mounted) {
        setExpenses(data || []);
        setBudget(budgetData || null);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Fetch error:', err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenBudgetModal = () => {
    setBudgetFormAmount(budget?.amount ? String(budget.amount) : '');
    setBudgetFormPeriod(budget?.period || 'monthly');
    setBudgetError('');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudgetModal = async (e) => {
    e.preventDefault();
    setBudgetError('');
    const parsed = parseFloat(budgetFormAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setBudgetError('Please enter a valid positive budget amount');
      return;
    }
    setIsSavingBudget(true);
    try {
      const updated = await budgetService.setBudget({ amount: parsed, period: budgetFormPeriod });
      setBudget(updated);
      setIsBudgetModalOpen(false);
      setToast({ message: 'Budget saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Failed to save budget:', err);
      setToast({ message: 'Failed to save budget', type: 'error' });
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, formData);
        setToast({ message: 'Entry updated successfully!', type: 'success' });
      } else {
        await expenseService.addExpense(formData);
        setToast({ message: 'Entry added successfully!', type: 'success' });
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      await refreshExpenses();
    } catch (err) {
      console.error('Failed to save expense:', err);
      setToast({ message: 'Failed to save expense', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      setToast({ message: 'Entry deleted successfully!', type: 'success' });
      await refreshExpenses();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setToast({ message: 'Failed to delete expense', type: 'error' });
    }
  };

  const handleDeleteMultiple = async (ids) => {
    try {
      await expenseService.deleteExpenses(ids);
      setToast({ message: `Successfully deleted ${ids.length} entries!`, type: 'success' });
      await refreshExpenses();
    } catch (err) {
      console.error('Failed to batch delete expenses:', err);
      setToast({ message: 'Failed to delete selected entries', type: 'error' });
    }
  };

  // Recent transactions (Top 5 newest)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))
    .slice(0, 5);

  return (
    <DashboardLayout
      title="Expense Tracker Dashboard"
      onOpenAddModal={() => {
        setEditingExpense(null);
        setIsModalOpen(true);
      }}
      onOpenTour={() => setIsOnboardingOpen(true)}
      onOpenExport={() => setIsExportModalOpen(true)}
    >
      {/* 1. Summary Cards */}
      <SummaryCards expenses={expenses} isLoading={loading} />

      {/* 1.5. Budget / Salary Overview Card */}
      <div className="pt-2">
        <BudgetOverviewCard expenses={expenses} budget={budget} isLoading={loading} onEditBudget={handleOpenBudgetModal} />
      </div>

      {/* 2. Incoming Bills Tracker Section */}
      <div className="pt-2">
        <IncomingBillsSection onBillPaid={refreshExpenses} />
      </div>

      {/* 3. Charts Section */}
      <div className="pt-2">
        <Charts expenses={expenses} isLoading={loading} />
      </div>

      {/* 4. Recent Transactions Header & Table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-rose-900 font-cursive">
              Recent Spreadsheet Entries
            </h3>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
              Latest 5 logged expenses
            </p>
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-rose-800 hover:text-rose-950 transition-colors cursor-pointer"
          >
            <span>View Full Spreadsheet</span>
            <FaArrowRight className="w-3 h-3" />
          </button>
        </div>

        <ExpenseTable
          expenses={recentExpenses}
          isLoading={loading}
          onEdit={(expense) => {
            setEditingExpense(expense);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          onDeleteMultiple={handleDeleteMultiple}
        />
      </div>

      {/* Budget Edit Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Edit Budget"
      >
        <form onSubmit={handleSaveBudgetModal} noValidate className="space-y-4 text-xs font-bold uppercase">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-rose-900 mb-1">Budget / Salary Limit (₱) *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-pink-400 font-extrabold text-sm select-none">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetFormAmount}
                  onChange={(e) => { setBudgetFormAmount(e.target.value); setBudgetError(''); }}
                  placeholder="e.g. 50000"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 focus:outline-none focus:ring-2 font-bold ${
                    budgetError ? 'border-red-500 ring-2 ring-red-200' : 'border-pink-300 focus:ring-rose-500'
                  }`}
                  autoFocus
                />
              </div>
              {budgetError && (
                <p className="mt-1.5 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">{budgetError}</p>
              )}
            </div>
            <div>
              <label className="block text-rose-900 mb-1">Budget Period</label>
              <select
                value={budgetFormPeriod}
                onChange={(e) => setBudgetFormPeriod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingBudget}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer"
            >
              {isSavingBudget ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaCheck className="w-3.5 h-3.5" />
              )}
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Entry' : 'Add New Entry'}
      >
        <ExpenseForm
          key={editingExpense ? editingExpense.id : 'new-dashboard-form'}
          initialData={editingExpense}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
        />
      </Modal>

      {/* Interactive Onboarding Tutorial Modal */}
      <OnboardingModal
        key={isOnboardingOpen ? 'tour-open' : 'tour-closed'}
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      {/* Export Data Modal (PDF / CSV / DOCX) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        budget={budget}
        defaultTitle="Expense Tracker Summary Report"
      />

      {/* Toast feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
};
