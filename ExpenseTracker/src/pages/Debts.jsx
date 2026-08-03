import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { LoadingWrapper } from '../components/Loader';
import { DebtFormModal } from '../components/DebtFormModal';
import { SettleDebtModal } from '../components/SettleDebtModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { ExportModal } from '../components/ExportModal';
import { debtService } from '../services/debtService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  FaCoins, 
  FaPlus, 
  FaSearch, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaEdit, 
  FaTrash, 
  FaClock, 
  FaWallet, 
  FaUser, 
  FaTag, 
  FaArrowUp, 
  FaArrowDown,
  FaBalanceScale
} from 'react-icons/fa';

export const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters & Search
  const [filterType, setFilterType] = useState('all'); // 'all' | 'i_owe' | 'owed_to_me' | 'settled'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('due_date'); // 'due_date' | 'amount_desc' | 'amount_asc' | 'newest'

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [settlingDebt, setSettlingDebt] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingDebtId, setDeletingDebtId] = useState(null);

  // Navbar Menu Extras (Tour & Export)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const refreshDebts = async () => {
    try {
      const data = await debtService.getDebts();
      setDebts(data || []);
    } catch (err) {
      console.error('Failed to load debts:', err);
      setToast({ message: 'Failed to load debt records', type: 'error' });
    }
  };

  useEffect(() => {
    let mounted = true;
    debtService.getDebts().then((data) => {
      if (mounted) {
        setDebts(data || []);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Fetch debts error:', err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Summary Calculations
  const stats = useMemo(() => {
    let totalIOwe = 0;
    let totalOwedToMe = 0;
    let overdueCount = 0;

    debts.forEach(d => {
      const remaining = Math.max(0, d.amount - d.amount_paid);
      if (d.type === 'i_owe') {
        totalIOwe += remaining;
      } else if (d.type === 'owed_to_me') {
        totalOwedToMe += remaining;
      }

      if (d.status !== 'settled' && d.due_date && d.due_date < todayStr) {
        overdueCount += 1;
      }
    });

    const netBalance = totalOwedToMe - totalIOwe;

    return {
      totalIOwe,
      totalOwedToMe,
      netBalance,
      overdueCount
    };
  }, [debts, todayStr]);

  // Filtered & Sorted Debts List
  const filteredDebts = useMemo(() => {
    return debts
      .filter(d => {
        // Tab Filter
        if (filterType === 'i_owe' && (d.type !== 'i_owe' || d.status === 'settled')) return false;
        if (filterType === 'owed_to_me' && (d.type !== 'owed_to_me' || d.status === 'settled')) return false;
        if (filterType === 'settled' && d.status !== 'settled') return false;

        // Search Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchPerson = d.person.toLowerCase().includes(term);
          const matchTitle = (d.title || '').toLowerCase().includes(term);
          const matchNotes = (d.notes || '').toLowerCase().includes(term);
          if (!matchPerson && !matchTitle && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (sortBy === 'amount_desc') {
          return (b.amount - b.amount_paid) - (a.amount - a.amount_paid);
        }
        if (sortBy === 'amount_asc') {
          return (a.amount - a.amount_paid) - (b.amount - b.amount_paid);
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
      });
  }, [debts, filterType, searchTerm, sortBy]);

  // Exportable debt objects for ExportModal
  const exportableDebts = useMemo(() => {
    return debts.map(d => ({
      title: `${d.type === 'i_owe' ? '[Payable] I Owe' : '[Receivable] Owed to Me'}: ${d.person} - ${d.title || 'Debt'}`,
      amount: Math.max(0, d.amount - d.amount_paid),
      category: d.category || 'Debts',
      payment_method: d.status.toUpperCase(),
      expense_date: d.due_date || (d.created_at ? d.created_at.split('T')[0] : todayStr),
      notes: `Total Amount: ${formatCurrency(d.amount)}, Paid: ${formatCurrency(d.amount_paid)}. ${d.notes || ''}`.trim()
    }));
  }, [debts, todayStr]);

  // Handlers
  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingDebt) {
        await debtService.updateDebt(editingDebt.id, formData);
        setToast({ message: 'Debt entry updated successfully!', type: 'success' });
      } else {
        await debtService.addDebt(formData);
        setToast({ message: 'Debt entry added successfully!', type: 'success' });
      }
      setIsFormModalOpen(false);
      setEditingDebt(null);
      await refreshDebts();
    } catch (err) {
      console.error('Error saving debt:', err);
      setToast({ message: 'Failed to save debt entry', type: 'error' });
    }
  };

  const handleSettle = async (id, paymentAmt, logAsExpense) => {
    try {
      await debtService.recordPayment(id, paymentAmt, logAsExpense);
      setToast({ message: 'Payment recorded successfully!', type: 'success' });
      setSettlingDebt(null);
      await refreshDebts();
    } catch (err) {
      console.error('Error settling debt:', err);
      setToast({ message: 'Failed to record payment', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingDebtId) return;
    try {
      await debtService.deleteDebt(deletingDebtId);
      setToast({ message: 'Debt record deleted!', type: 'success' });
      setIsDeleteConfirmOpen(false);
      setDeletingDebtId(null);
      await refreshDebts();
    } catch (err) {
      console.error('Error deleting debt:', err);
      setToast({ message: 'Failed to delete debt', type: 'error' });
    }
  };

  return (
    <DashboardLayout
      title="Debt Manager"
      onOpenTour={() => setIsOnboardingOpen(true)}
      onOpenExport={() => setIsExportModalOpen(true)}
      onOpenAddModal={() => {
        setEditingDebt(null);
        setIsFormModalOpen(true);
      }}
    >
      <div className="space-y-6">
        {/* Header Title & Add Button Banner */}
        <div className="clean-pink-card p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-rose-900 font-cursive flex items-center gap-2">
              <FaCoins className="w-7 h-7 text-rose-600 inline" />
              Debt Manager
            </h2>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wide mt-1">
              Track money i owe, track money owed to me, and payment progress
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDebt(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span>Add Debt Record</span>
          </button>
        </div>

        {/* 1. Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total I Owe */}
          <div className="clean-pink-card p-6 flex flex-col justify-between bg-white h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total I Owe</span>
              <div className="w-8 h-8 rounded-full bg-pink-100 text-rose-700 border border-pink-300 flex items-center justify-center">
                <FaArrowDown className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-2 py-1 select-none">
                  <div className="w-32 h-8 rounded-xl bg-pink-100/80 animate-pulse" />
                  <div className="w-24 h-3.5 rounded-md bg-pink-50 animate-pulse" />
                </div>
              ) : (
                <div className="animate-content-fade">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                    {formatCurrency(stats.totalIOwe)}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 font-bold uppercase tracking-wide">
                    Money You Owe
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Total Owed to Me */}
          <div className="clean-pink-card p-6 flex flex-col justify-between bg-white h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Owed to Me</span>
              <div className="w-8 h-8 rounded-full bg-pink-100 text-rose-700 border border-pink-300 flex items-center justify-center">
                <FaArrowUp className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-2 py-1 select-none">
                  <div className="w-32 h-8 rounded-xl bg-pink-100/80 animate-pulse" />
                  <div className="w-24 h-3.5 rounded-md bg-pink-50 animate-pulse" />
                </div>
              ) : (
                <div className="animate-content-fade">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                    {formatCurrency(stats.totalOwedToMe)}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 font-bold uppercase tracking-wide">
                    Money You're Owed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Net Position */}
          <div className="clean-pink-card p-6 flex flex-col justify-between bg-white h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Net Position</span>
              <div className="w-8 h-8 rounded-full bg-pink-100 text-rose-700 border border-pink-300 flex items-center justify-center">
                <FaBalanceScale className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-2 py-1 select-none">
                  <div className="w-32 h-8 rounded-xl bg-pink-100/80 animate-pulse" />
                  <div className="w-24 h-3.5 rounded-md bg-pink-50 animate-pulse" />
                </div>
              ) : (
                <div className="animate-content-fade">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                    {formatCurrency(stats.netBalance)}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 font-bold uppercase tracking-wide">
                    {stats.netBalance >= 0 ? 'Surplus Receivable' : 'Net Deficit'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Overdue Alert Count */}
          <div className="clean-pink-card p-6 flex flex-col justify-between bg-white h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Overdue Alerts</span>
              <div className="w-8 h-8 rounded-full bg-pink-100 text-rose-700 border border-pink-300 flex items-center justify-center">
                <FaExclamationTriangle className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-2 py-1 select-none">
                  <div className="w-16 h-8 rounded-xl bg-pink-100/80 animate-pulse" />
                  <div className="w-28 h-3.5 rounded-md bg-pink-50 animate-pulse" />
                </div>
              ) : (
                <div className="animate-content-fade">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                    {stats.overdueCount}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 font-bold uppercase tracking-wide">
                    {stats.overdueCount === 0 ? 'All payments up to date' : 'Debts past due date'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Controls & Search Bar */}
        <div className="clean-pink-card p-4 sm:p-6 bg-white space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Tab filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1.5 bg-pink-50/80 rounded-2xl border-2 border-pink-200">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 ${
                  filterType === 'all'
                    ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                    : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
                }`}
              >
                All Debts
              </button>
              <button
                onClick={() => setFilterType('i_owe')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 ${
                  filterType === 'i_owe'
                    ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                    : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
                }`}
              >
                I Owe (Payables)
              </button>
              <button
                onClick={() => setFilterType('owed_to_me')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 ${
                  filterType === 'owed_to_me'
                    ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                    : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
                }`}
              >
                Owed to Me (Receivables)
              </button>
              <button
                onClick={() => setFilterType('settled')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 ${
                  filterType === 'settled'
                    ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                    : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
                }`}
              >
                Settled
              </button>
            </div>

            {/* Search and Sort controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 md:w-64">
                <FaSearch className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search person or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold uppercase bg-white border-2 border-pink-300 rounded-2xl text-rose-950 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>

              {/* Sort Select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2.5 px-3.5 text-xs font-bold uppercase bg-white border-2 border-pink-300 rounded-2xl text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="due_date">Sort: Due Date (Earliest)</option>
                <option value="amount_desc">Sort: Highest Remaining</option>
                <option value="amount_asc">Sort: Lowest Remaining</option>
                <option value="newest">Sort: Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Debts Card Grid List */}
        <LoadingWrapper isLoading={loading}>
          {filteredDebts.length === 0 ? (
            <div className="clean-pink-card p-12 text-center bg-white space-y-3">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-rose-700 border-2 border-pink-300">
                <FaCoins className="w-8 h-8 text-rose-600" />
              </div>
              <h4 className="text-2xl font-bold text-rose-900 font-cursive">No Debt Records Found</h4>
              <p className="text-xs text-rose-700 font-bold uppercase max-w-md mx-auto">
                {searchTerm || filterType !== 'all'
                  ? 'No debt entries matched your search or filter criteria. Try adjusting your filters.'
                  : 'You have not added any debt records yet. Click "Add Debt Record" above to get started.'}
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => {
                    setEditingDebt(null);
                    setIsFormModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-2xl border-2 border-rose-700 transition-colors cursor-pointer"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                  <span>Add First Debt Record</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDebts.map((debt, index) => {
                const remaining = Math.max(0, debt.amount - debt.amount_paid);
                const percentPaid = debt.amount > 0 ? Math.min(100, Math.round((debt.amount_paid / debt.amount) * 100)) : 0;
                const isOverdue = debt.status !== 'settled' && debt.due_date && debt.due_date < todayStr;

                return (
                  <div
                    key={debt.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="clean-pink-card p-6 bg-white flex flex-col justify-between relative border-pink-300 animate-list-item-in"
                  >
                    <div>
                      {/* Card Header: Type Badge & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border bg-pink-100 text-rose-900 border-pink-300">
                          {debt.type === 'i_owe' ? (
                            <>
                              <FaArrowDown className="w-2.5 h-2.5 text-rose-600" />
                              <span>I Owe (Payable)</span>
                            </>
                          ) : (
                            <>
                              <FaArrowUp className="w-2.5 h-2.5 text-rose-600" />
                              <span>Owed to Me (Receivable)</span>
                            </>
                          )}
                        </span>

                        {/* Status Badge */}
                        {debt.status === 'settled' ? (
                          <span className="px-2.5 py-0.5 bg-pink-100 text-rose-900 border border-pink-300 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3 text-rose-600" />
                            <span>Settled</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-0.5 bg-pink-100 text-rose-900 border border-pink-300 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                            <FaExclamationTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                            <span>Overdue</span>
                          </span>
                        ) : debt.status === 'partially_paid' ? (
                          <span className="px-2.5 py-0.5 bg-pink-50 text-rose-900 border border-pink-300 rounded-full text-[10px] font-black uppercase">
                            Partially Paid ({percentPaid}%)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-pink-50 text-rose-900 border border-pink-300 rounded-full text-[10px] font-black uppercase">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {/* Person Name & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FaUser className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <h3 className="text-lg font-black text-rose-950 truncate">
                            {debt.person}
                          </h3>
                        </div>
                        <p className="text-xs text-rose-700 font-bold uppercase tracking-wide flex items-center gap-1.5 pl-5">
                          <FaTag className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{debt.title || 'No description'}</span>
                        </p>
                      </div>

                      {/* Financial Amounts Breakdown */}
                      <div className="mt-4 p-3.5 bg-pink-50/70 rounded-2xl border border-pink-200 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Remaining Balance:</span>
                          <span className="text-xl font-black text-rose-950 tracking-tight">
                            {formatCurrency(remaining)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-pink-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-rose-600 transition-all duration-300"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-rose-700 uppercase tracking-wide">
                            <span>Paid: {formatCurrency(debt.amount_paid)}</span>
                            <span>Total: {formatCurrency(debt.amount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Due Date & Notes */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        {debt.due_date && (
                          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wide text-rose-800">
                            <FaClock className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Due: {formatDate(debt.due_date)}</span>
                            {isOverdue && <span className="uppercase text-[9px] bg-pink-100 text-rose-800 px-1.5 py-0.5 rounded font-black border border-pink-300">Past Due</span>}
                          </div>
                        )}
                        {debt.notes && (
                          <p className="text-[11px] text-rose-800 font-semibold italic line-clamp-2 bg-pink-50/40 p-2 rounded-xl border border-pink-100">
                            "{debt.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between gap-2">
                      <button
                        disabled={debt.status === 'settled'}
                        onClick={() => setSettlingDebt(debt)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-2 ${
                          debt.status === 'settled'
                            ? 'bg-pink-50 text-rose-400 border-pink-200 cursor-not-allowed'
                            : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-xs'
                        }`}
                      >
                        <FaWallet className="w-3.5 h-3.5" />
                        <span>{debt.status === 'settled' ? 'Settled' : debt.type === 'i_owe' ? 'Pay Debt' : 'Record Payment'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingDebt(debt);
                          setIsFormModalOpen(true);
                        }}
                        title="Edit debt"
                        className="p-2 text-rose-800 hover:text-rose-950 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded-xl transition-colors cursor-pointer"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setDeletingDebtId(debt.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        title="Delete debt"
                        className="p-2 text-rose-800 hover:text-rose-950 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded-xl transition-colors cursor-pointer"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </LoadingWrapper>

        {/* Modal: Add / Edit Debt */}
        <DebtFormModal
          key={editingDebt ? editingDebt.id : isFormModalOpen ? 'open-new' : 'closed'}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingDebt(null);
          }}
          initialData={editingDebt}
          onSubmit={handleCreateOrUpdate}
        />

        {/* Modal: Settle Payment */}
        <SettleDebtModal
          key={settlingDebt ? settlingDebt.id : 'no-settle'}
          isOpen={!!settlingDebt}
          onClose={() => setSettlingDebt(null)}
          debt={settlingDebt}
          onSettle={handleSettle}
        />

        {/* Interactive Onboarding Tutorial Modal */}
        <OnboardingModal
          key={isOnboardingOpen ? 'tour-open' : 'tour-closed'}
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />

        {/* Export Data Modal (PDF / CSV / DOCX) for Debts */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          dataType="debts"
          debts={debts}
          modalTitle="Export Debt Data"
          defaultTitle="Debt Manager Summary Report"
        />

        {/* Modal: Delete Confirmation */}
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setDeletingDebtId(null);
          }}
          title="Delete Debt Record"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs font-bold text-rose-900 uppercase">
              Are you sure you want to delete this debt record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingDebtId(null);
                }}
                className="px-5 py-2.5 text-xs font-black uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 text-xs font-black uppercase text-white bg-rose-600 hover:bg-rose-700 border-2 border-rose-700 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </div>
    </DashboardLayout>
  );
};
