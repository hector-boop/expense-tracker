import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseCard } from '../components/ExpenseCard';
import { Modal } from '../components/Modal';
import { LoadingWrapper } from '../components/Loader';
import { ExpenseForm } from '../components/ExpenseForm';
import { Toast } from '../components/Toast';
import { OnboardingModal } from '../components/OnboardingModal';
import { ExportModal } from '../components/ExportModal';
import { OptionPickerModal } from '../components/OptionPickerModal';
import { DatePickerModal } from '../components/DatePickerModal';
import { expenseService, DEFAULT_CATEGORIES } from '../services/expenseService';
import { 
  formatCurrency, 
  formatDate,
  PAYMENT_METHODS, 
  getCategoryIcon, 
  getPaymentMethodIcon 
} from '../utils/formatters';
import { 
  FaSearch, 
  FaThList, 
  FaThLarge,
  FaChevronDown,
  FaSortAmountDown,
  FaCalendarAlt
} from 'react-icons/fa';

export const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Filter Modals
  const [isCatFilterOpen, setIsCatFilterOpen] = useState(false);
  const [isPmFilterOpen, setIsPmFilterOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const refreshExpenses = async () => {
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setToast({ message: 'Error loading expenses', type: 'error' });
    }
  };

  useEffect(() => {
    let mounted = true;
    expenseService.getExpenses().then(data => {
      if (mounted) {
        setExpenses(data || []);
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

  // Handle Save (Add/Update)
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

  // Handle Delete
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

  // Handle Bulk Batch Delete
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

  // Categories list including custom categories found in expenses
  const allCategories = useMemo(() => {
    const custom = expenses.map(e => e.category).filter(c => Boolean(c));
    return ['All', ...Array.from(new Set([...DEFAULT_CATEGORIES, ...custom]))];
  }, [expenses]);

  const categoryFilterOptions = allCategories.map(cat => ({
    value: cat,
    label: cat,
    icon: cat === 'All' ? null : getCategoryIcon(cat),
  }));

  const paymentFilterOptions = ['All', ...PAYMENT_METHODS].map(pm => ({
    value: pm,
    label: pm,
    icon: pm === 'All' ? null : getPaymentMethodIcon(pm),
  }));

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Amount' },
    { value: 'lowest', label: 'Lowest Amount' },
  ];

  // Filtering & Sorting Pipeline
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // 1. Search by title or notes
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(term) ||
          (item.notes && item.notes.toLowerCase().includes(term))
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 3. Payment Method Filter
    if (selectedPaymentMethod !== 'All') {
      result = result.filter(item => (item.payment_method || 'Cash') === selectedPaymentMethod);
    }

    // 4. Month Filter (YYYY-MM)
    if (selectedMonth) {
      result = result.filter(item => {
        if (!item.expense_date) return false;
        return item.expense_date.startsWith(selectedMonth);
      });
    }

    // 5. Date range filter
    if (startDate) {
      result = result.filter(item => item.expense_date >= startDate);
    }
    if (endDate) {
      result = result.filter(item => item.expense_date <= endDate);
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.expense_date) - new Date(a.expense_date);
      }
      if (sortBy === 'oldest') {
        return new Date(a.expense_date) - new Date(b.expense_date);
      }
      if (sortBy === 'highest') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'lowest') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, selectedMonth, startDate, endDate, sortBy]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredExpenses]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPaymentMethod('All');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  const getSortLabel = (val) => {
    return sortOptions.find(s => s.value === val)?.label || 'Newest First';
  };

  return (
    <DashboardLayout
      title="Expense Tracker Spreadsheet"
      onOpenAddModal={() => {
        setEditingExpense(null);
        setIsModalOpen(true);
      }}
      onOpenTour={() => setIsOnboardingOpen(true)}
      onOpenExport={() => setIsExportModalOpen(true)}
    >
      {/* Search & Filter Control Bar */}
      <div className="clean-pink-card p-4 sm:p-6 space-y-4 bg-white">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-3.5 text-pink-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter spreadsheet entries..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 placeholder-pink-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs font-bold transition-all uppercase"
            />
          </div>

          {/* Quick Stats & View Toggle */}
          <div className="flex items-center justify-between lg:justify-end gap-4">
            <div className="text-right">
              <p className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">Filtered Total</p>
              {loading ? (
                <div className="w-24 h-6 rounded-lg bg-pink-100/80 animate-pulse ml-auto mt-1" />
              ) : (
                <p className="text-xl font-black text-rose-900 animate-content-fade">
                  {formatCurrency(filteredTotal)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 bg-pink-100 p-1 rounded-2xl border-2 border-pink-300">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
                title="Table View"
              >
                <FaThList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
                title="Cards Grid View"
              >
                <FaThLarge className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Buttons Grid with Custom Modals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 text-xs font-bold uppercase">
          {/* Category Filter Modal Trigger */}
          <div>
            <label className="block text-rose-900 mb-1">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsCatFilterOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold hover:border-pink-400 cursor-pointer"
            >
              <span className="truncate">{selectedCategory}</span>
              <FaChevronDown className="w-3 h-3 text-pink-400 shrink-0" />
            </button>
          </div>

          {/* Payment Method Filter Modal Trigger */}
          <div>
            <label className="block text-rose-900 mb-1">
              Payment Method
            </label>
            <button
              type="button"
              onClick={() => setIsPmFilterOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold hover:border-pink-400 cursor-pointer"
            >
              <span className="truncate">{selectedPaymentMethod}</span>
              <FaChevronDown className="w-3 h-3 text-pink-400 shrink-0" />
            </button>
          </div>

          {/* From Date Modal Trigger */}
          <div>
            <label className="block text-rose-900 mb-1">
              From Date
            </label>
            <button
              type="button"
              onClick={() => setIsStartDateModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold hover:border-pink-400 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <FaCalendarAlt className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span className="truncate">{startDate ? formatDate(startDate) : 'Select'}</span>
              </div>
              <FaChevronDown className="w-3 h-3 text-pink-400 shrink-0" />
            </button>
          </div>

          {/* To Date Modal Trigger */}
          <div>
            <label className="block text-rose-900 mb-1">
              To Date
            </label>
            <button
              type="button"
              onClick={() => setIsEndDateModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold hover:border-pink-400 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <FaCalendarAlt className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span className="truncate">{endDate ? formatDate(endDate) : 'Select'}</span>
              </div>
              <FaChevronDown className="w-3 h-3 text-pink-400 shrink-0" />
            </button>
          </div>

          {/* Sort By Modal Trigger */}
          <div>
            <label className="block text-rose-900 mb-1">
              Sort By
            </label>
            <button
              type="button"
              onClick={() => setIsSortModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold hover:border-pink-400 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <FaSortAmountDown className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span className="truncate">{getSortLabel(sortBy)}</span>
              </div>
              <FaChevronDown className="w-3 h-3 text-pink-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Active Filters Reset */}
        {(searchTerm || selectedCategory !== 'All' || selectedPaymentMethod !== 'All' || selectedMonth || startDate || endDate || sortBy !== 'newest') && (
          <div className="flex items-center justify-between pt-2 text-xs font-bold uppercase">
            <span className="text-rose-700">
              Showing {filteredExpenses.length} of {expenses.length} entries
            </span>
            <button
              onClick={clearFilters}
              className="text-red-600 hover:underline cursor-pointer font-black"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Expense List Content */}
      {viewMode === 'table' ? (
        <ExpenseTable
          expenses={filteredExpenses}
          isLoading={loading}
          onEdit={(expense) => {
            setEditingExpense(expense);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          onDeleteMultiple={handleDeleteMultiple}
        />
      ) : (
        <LoadingWrapper isLoading={loading} message="Loading expense cards..." minHeight="min-h-64">
          {filteredExpenses.length === 0 ? (
            <div className="clean-pink-card p-12 text-center bg-white">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-100 text-rose-700 flex items-center justify-center border border-pink-300">
                <FaThLarge className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-rose-900 tracking-tight uppercase">No entries found</h3>
              <p className="mt-1 text-xs text-rose-700 font-bold max-w-sm mx-auto uppercase">
                Try clearing your search or filters, or click "Add Entry" to log a new expense.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={(exp) => {
                    setEditingExpense(exp);
                    setIsModalOpen(true);
                  }}
                  onDelete={(exp) => handleDelete(exp.id)}
                />
              ))}
            </div>
          )}
        </LoadingWrapper>
      )}

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
          key={editingExpense ? editingExpense.id : 'new-expenses-form'}
          initialData={editingExpense}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
        />
      </Modal>

      {/* Category Filter Modal */}
      <OptionPickerModal
        isOpen={isCatFilterOpen}
        onClose={() => setIsCatFilterOpen(false)}
        title="Filter by Category"
        options={categoryFilterOptions}
        selectedValue={selectedCategory}
        onSelectValue={(val) => setSelectedCategory(val)}
      />

      {/* Payment Method Filter Modal */}
      <OptionPickerModal
        isOpen={isPmFilterOpen}
        onClose={() => setIsPmFilterOpen(false)}
        title="Filter by Payment Method"
        options={paymentFilterOptions}
        selectedValue={selectedPaymentMethod}
        onSelectValue={(val) => setSelectedPaymentMethod(val)}
      />

      {/* Sort By Option Modal */}
      <OptionPickerModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Entries By"
        options={sortOptions}
        selectedValue={sortBy}
        onSelectValue={(val) => setSortBy(val)}
      />

      {/* Date Pickers for Range */}
      <DatePickerModal
        isOpen={isStartDateModalOpen}
        onClose={() => setIsStartDateModalOpen(false)}
        selectedDate={startDate}
        onSelectDate={(d) => setStartDate(d)}
        title="Filter From Date"
        maxDate={todayStr}
      />

      <DatePickerModal
        isOpen={isEndDateModalOpen}
        onClose={() => setIsEndDateModalOpen(false)}
        selectedDate={endDate}
        onSelectDate={(d) => setEndDate(d)}
        title="Filter To Date"
        maxDate={todayStr}
      />

      {/* Interactive Onboarding Tutorial Modal */}
      <OnboardingModal
        key={isOnboardingOpen ? 'tour-open' : 'tour-closed'}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Export Data Modal (PDF / CSV / DOCX) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={filteredExpenses}
        defaultTitle="Expense Tracker Spreadsheet Report"
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
};
