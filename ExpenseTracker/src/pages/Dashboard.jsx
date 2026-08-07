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
import { FaArrowRight } from 'react-icons/fa';

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
        <BudgetOverviewCard expenses={expenses} budget={budget} isLoading={loading} />
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
