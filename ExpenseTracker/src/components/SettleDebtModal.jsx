import { useState } from 'react';
import { Modal } from './Modal';
import { formatCurrency } from '../utils/formatters';
import { FaDollarSign, FaCheckCircle, FaReceipt } from 'react-icons/fa';

export const SettleDebtModal = ({ isOpen, onClose, debt, onSettle }) => {
  const remainingBalance = debt ? Math.max(0, debt.amount - debt.amount_paid) : 0;
  const [paymentAmount, setPaymentAmount] = useState(debt ? String(remainingBalance) : '');
  const [logAsExpense, setLogAsExpense] = useState(debt ? debt.type === 'i_owe' : true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!debt) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a payment amount greater than 0');
      return;
    }
    if (amt > remainingBalance + 0.001) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    setSubmitting(true);
    try {
      await onSettle(debt.id, amt, logAsExpense && debt.type === 'i_owe');
      onClose();
    } catch (err) {
      console.error('Error settling debt:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debt.type === 'i_owe' ? `Pay Debt to ${debt.person}` : `Receive Payment from ${debt.person}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Debt Context Banner */}
        <div className="p-3 bg-pink-50 rounded-2xl border-2 border-pink-200 space-y-1">
          <p className="text-xs font-black text-rose-950 truncate">
            {debt.title || 'Debt Entry'}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-800 font-bold">Total Amount:</span>
            <span className="font-black text-rose-950">{formatCurrency(debt.amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-800 font-bold">Already Paid:</span>
            <span className="font-black text-rose-950">{formatCurrency(debt.amount_paid)}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-pink-200">
            <span className="text-rose-900 font-black">Remaining Unpaid Balance:</span>
            <span className="font-black text-rose-950 text-sm">{formatCurrency(remainingBalance)}</span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
            Payment Amount ($)
          </label>
          <div className="relative">
            <FaDollarSign className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingBalance}
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-pink-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-950 placeholder-rose-400 font-black"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setPaymentAmount(String((remainingBalance / 2).toFixed(2)))}
              className="text-[11px] font-black uppercase text-rose-800 hover:text-rose-950 bg-pink-100 border border-pink-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
            >
              50% ({formatCurrency(remainingBalance / 2)})
            </button>
            <button
              type="button"
              onClick={() => setPaymentAmount(String(remainingBalance))}
              className="text-[11px] font-black uppercase text-rose-800 hover:text-rose-950 bg-pink-100 border border-pink-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
            >
              Full ({formatCurrency(remainingBalance)})
            </button>
          </div>
        </div>

        {/* Log as expense option for "I Owe" debts */}
        {debt.type === 'i_owe' && (
          <div className="p-3 bg-white border-2 border-pink-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="logAsExpenseCheck"
              checked={logAsExpense}
              onChange={(e) => setLogAsExpense(e.target.checked)}
              className="mt-0.5 rounded border-pink-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="logAsExpenseCheck" className="text-xs text-rose-900 cursor-pointer select-none">
              <span className="font-bold flex items-center gap-1.5 text-rose-950">
                <FaReceipt className="w-3.5 h-3.5 text-rose-600 inline" />
                Add payment to Expense Tracker
              </span>
              <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                Automatically logs this payment amount as a new expense item under "Bills" for today's date.
              </p>
            </label>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-800 font-bold text-center">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-black uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black uppercase text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 border-2 border-rose-700 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <FaCheckCircle className="w-3.5 h-3.5" />
            <span>{submitting ? 'Recording...' : 'Confirm Payment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
