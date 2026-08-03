import { useState, useEffect } from 'react';
import { billService } from '../services/billService';
import { BillFormModal } from './BillFormModal';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { Loader, LoadingWrapper } from './Loader';
import { 
  formatCurrency, 
  formatDate, 
  getCategoryIcon,
  getPaymentMethodIcon,
  getPaymentMethodStyle,
  getOrdinalSuffix
} from '../utils/formatters';
import { 
  FaFileInvoiceDollar, 
  FaPlus, 
  FaCheckCircle, 
  FaTrash, 
  FaClock,
  FaCalendarCheck,
  FaRedo
} from 'react-icons/fa';

export const IncomingBillsSection = ({ onBillPaid }) => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingBill, setDeletingBill] = useState(null); // { id, title }
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [processingBillIds, setProcessingBillIds] = useState(new Set());

  const refreshBills = async () => {
    try {
      const data = await billService.getBills();
      setBills(data || []);
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    billService.getBills().then(data => {
      if (mounted) {
        setBills(data || []);
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Failed to fetch bills:', err);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddBill = async (billData) => {
    try {
      await billService.addBill(billData);
      setToast({ message: 'Incoming bill added successfully!', type: 'success' });
      await refreshBills();
    } catch (err) {
      console.error('Failed to add bill:', err);
      setToast({ message: 'Failed to add bill', type: 'error' });
    }
  };

  const handleMarkAsPaid = async (billId, title) => {
    if (processingBillIds.has(billId)) return;
    setProcessingBillIds(prev => new Set(prev).add(billId));
    try {
      await billService.markAsPaid(billId);
      setToast({ message: `Marked "${title}" as Paid & logged to spreadsheet!`, type: 'success' });
      await refreshBills();
      if (onBillPaid) onBillPaid();
    } catch (err) {
      console.error('Failed to mark bill as paid:', err);
      setToast({ message: 'Failed to update bill', type: 'error' });
    } finally {
      setProcessingBillIds(prev => {
        const next = new Set(prev);
        next.delete(billId);
        return next;
      });
    }
  };

  const handleDeleteBill = async (billId, title) => {
    try {
      await billService.deleteBill(billId);
      setToast({ message: `Deleted bill "${title}"`, type: 'success' });
      await refreshBills();
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getDueDateStatus = (dueDate, isPaid) => {
    if (isPaid) {
      return { label: 'Paid', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', isDueSoon: false };
    }
    if (!dueDate) {
      return { label: 'Upcoming', bg: 'bg-pink-100 text-rose-900 border-pink-300', isDueSoon: false };
    }

    const today = new Date(todayStr);
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Overdue', bg: 'bg-red-100 text-red-900 border-red-300', isDueSoon: true };
    } else if (diffDays === 0) {
      return { label: 'Due Today', bg: 'bg-amber-100 text-amber-900 border-amber-300', isDueSoon: true };
    } else if (diffDays <= 3) {
      return { label: `Due in ${diffDays}d`, bg: 'bg-amber-100 text-amber-900 border-amber-300', isDueSoon: true };
    } else {
      return { label: `Due in ${diffDays}d`, bg: 'bg-pink-100 text-rose-900 border-pink-300', isDueSoon: false };
    }
  };

  const pendingBills = bills.filter(b => !b.is_paid);
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <>
      <div className="clean-pink-card p-6 bg-white space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-pink-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-700 border border-pink-200">
              <FaFileInvoiceDollar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-rose-900 font-cursive leading-none">
                  Incoming Bills & Subscriptions
                </h3>
                {pendingBills.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                    {pendingBills.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide mt-0.5">
                Upcoming recurring bills & due date tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {pendingBills.length > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Total Pending</p>
                <p className="text-sm font-black text-rose-900">{formatCurrency(totalPendingAmount)}</p>
              </div>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer uppercase shrink-0"
            >
              <FaPlus className="w-3 h-3" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        {/* Bills Body */}
        {isLoading ? (
          <div className="py-8 bg-pink-50/40 rounded-2xl border-2 border-dashed border-pink-200/60 p-6 flex flex-col items-center justify-center space-y-3 h-[162px] select-none">
            <div className="w-10 h-10 rounded-2xl bg-pink-100/70 animate-pulse" />
            <div className="w-48 h-4 rounded-xl bg-pink-100/80 animate-pulse" />
            <div className="w-64 h-3 rounded-lg bg-pink-50 animate-pulse" />
          </div>
        ) : bills.length === 0 ? (
          <div className="py-8 text-center bg-pink-50/50 rounded-2xl border-2 border-dashed border-pink-200 p-6 space-y-2">
            <FaCalendarCheck className="w-8 h-8 mx-auto text-pink-300" />
            <h4 className="text-sm font-black text-rose-900 uppercase">No Incoming Bills Scheduled</h4>
            <p className="text-xs font-bold text-rose-700 max-w-sm mx-auto uppercase">
              Click "+ Add Bill" above to track upcoming electricity, water, internet, or subscription bills!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
              {/* List of Pending & Paid Bills */}
            {bills.map((bill, index) => {
              const categoryIcon = getCategoryIcon(bill.category)({ className: 'w-4 h-4 text-rose-700' });
              const pmMethod = bill.payment_method || 'Cash';
              const pmIcon = getPaymentMethodIcon(pmMethod)({ className: 'w-3 h-3' });
              const pmStyle = getPaymentMethodStyle(pmMethod);
              const status = getDueDateStatus(bill.due_date, bill.is_paid);
              const isProcessing = processingBillIds.has(bill.id);

              return (
                <div
                  key={bill.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-list-item-in ${
                    bill.is_paid
                      ? 'bg-pink-50/30 border-pink-200 opacity-75'
                      : status.isDueSoon
                      ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                      : 'bg-white border-pink-200 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-pink-100 border border-pink-200 shrink-0">
                      {categoryIcon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-extrabold text-rose-950 truncate ${bill.is_paid ? 'line-through' : ''}`}>
                          {bill.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${status.bg}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-rose-700 uppercase flex-wrap">
                        <span className="flex items-center gap-1">
                          {bill.recurring_day ? (
                            <FaRedo className="w-3 h-3 text-rose-600" />
                          ) : (
                            <FaClock className="w-3 h-3 text-pink-400" />
                          )}
                          <span>
                            {bill.recurring_day
                              ? `Every ${getOrdinalSuffix(bill.recurring_day)} of the month (${formatDate(bill.due_date)})`
                              : `Due: ${formatDate(bill.due_date)}`}
                          </span>
                        </span>
                        <span>•</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${pmStyle.bg} ${pmStyle.text}`}>
                          {pmIcon}
                          <span>{pmMethod}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-pink-100">
                    <span className="text-base font-black text-rose-950 whitespace-nowrap">
                      {formatCurrency(bill.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      {!bill.is_paid ? (
                        <button
                          onClick={() => handleMarkAsPaid(bill.id, bill.title)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs border border-emerald-700 transition-all cursor-pointer uppercase"
                          title="Mark as paid & log to spreadsheet"
                        >
                          {isProcessing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : (
                            <FaCheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{isProcessing ? 'Processing...' : 'Mark Paid'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                          <FaCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Paid</span>
                        </span>
                      )}

                      <button
                        onClick={() => setDeletingBill({ id: bill.id, title: bill.title })}
                        className="p-2 text-rose-700 hover:text-rose-900 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
                        title="Delete bill"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Creation Form Modal */}
      <BillFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddBill}
      />

      {/* Confirm Delete Bill Modal */}
      <Modal
        isOpen={!!deletingBill}
        onClose={() => setDeletingBill(null)}
        title="Delete Bill"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-rose-900 uppercase">
            Are you sure you want to delete the bill &quot;{deletingBill?.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={() => setDeletingBill(null)}
              className="px-5 py-2.5 text-xs font-black uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deletingBill) {
                  handleDeleteBill(deletingBill.id, deletingBill.title);
                  setDeletingBill(null);
                }
              }}
              className="px-5 py-2.5 text-xs font-black uppercase text-white bg-red-600 hover:bg-red-700 border-2 border-red-700 rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </>
  );
};
