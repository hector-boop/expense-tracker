import { useState } from 'react';
import { Modal } from './Modal';
import { SubmitButton } from './SubmitButton';
import { FaUser, FaTag, FaDollarSign, FaCalendarAlt, FaStickyNote, FaHandHoldingUsd, FaCoins } from 'react-icons/fa';

export const DebtFormModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [type, setType] = useState(initialData?.type || 'i_owe');
  const [person, setPerson] = useState(initialData?.person || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [amountPaid, setAmountPaid] = useState(initialData?.amount_paid ? String(initialData.amount_paid) : '0');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!person.trim()) {
      newErrors.person = 'Person / entity name is required';
    }
    if (!title.trim()) {
      newErrors.title = 'Reason / title is required';
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    const numPaid = parseFloat(amountPaid);
    if (!isNaN(numPaid) && !isNaN(numAmount) && numPaid > numAmount) {
      newErrors.amountPaid = 'Amount paid cannot exceed total amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        person: person.trim(),
        title: title.trim(),
        amount: parseFloat(amount),
        amount_paid: parseFloat(amountPaid) || 0,
        due_date: dueDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error submitting debt:', err);
      setErrors({ submit: err.message || 'Failed to save debt' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Debt Record' : 'Add Debt Record'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs font-bold uppercase overflow-hidden -m-6">
        {/* Scrollable Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {/* Type selector toggle */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5">
              Debt Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-pink-50 rounded-2xl border border-pink-200">
              <button
                type="button"
                onClick={() => setType('i_owe')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  type === 'i_owe'
                    ? 'bg-rose-600 text-white shadow-xs border border-rose-700'
                    : 'text-rose-900 hover:bg-pink-100'
                }`}
              >
                <FaCoins className="w-3.5 h-3.5" />
                <span>I Owe (Payable)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('owed_to_me')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  type === 'owed_to_me'
                    ? 'bg-rose-600 text-white shadow-xs border border-rose-700'
                    : 'text-rose-900 hover:bg-pink-100'
                }`}
              >
                <FaHandHoldingUsd className="w-3.5 h-3.5" />
                <span>Owed to Me (Receivable)</span>
              </button>
            </div>
          </div>

          {errors.submit && (
            <p className="text-xs text-rose-600 font-bold text-center">{errors.submit}</p>
          )}

          {/* Person Name */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              {type === 'i_owe' ? 'Creditor (Who do you owe?)' : 'Debtor (Who owes you?)'}
            </label>
            <div className="relative">
              <FaUser className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="e.g. John Doe, Credit Card, Bank"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold ${
                  errors.person ? 'border-rose-500 bg-rose-50' : 'border-pink-300'
                }`}
              />
            </div>
            {errors.person && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.person}</p>}
          </div>

          {/* Reason / Title */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              Reason / Description
            </label>
            <div className="relative">
              <FaTag className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="e.g. Dinner bill split, Loan for laptop, Rent share"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold ${
                  errors.title ? 'border-rose-500 bg-rose-50' : 'border-pink-300'
                }`}
              />
            </div>
            {errors.title && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.title}</p>}
          </div>

          {/* Amounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Total Amount */}
            <div>
              <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                Total Amount ($)
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold ${
                    errors.amount ? 'border-rose-500 bg-rose-50' : 'border-pink-300'
                  }`}
                />
              </div>
              {errors.amount && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.amount}</p>}
            </div>

            {/* Already Paid Amount */}
            <div>
              <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                Already Paid ($)
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold ${
                    errors.amountPaid ? 'border-rose-500 bg-rose-50' : 'border-pink-300'
                  }`}
                />
              </div>
              {errors.amountPaid && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.amountPaid}</p>}
            </div>
          </div>

          {/* Target Due Date */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              Due Date (Optional)
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 border-pink-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              Notes / Payment Instructions (Optional)
            </label>
            <div className="relative">
              <FaStickyNote className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
              <textarea
                rows="2"
                placeholder="e.g. GCash/Bank account info or payment notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 border-pink-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 placeholder-rose-400 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Fixed Sticky Bottom Footer Bar */}
        <div className="px-6 py-3.5 bg-pink-50/50 border-t border-pink-100 flex items-center justify-end gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <SubmitButton
            loading={submitting}
            className="px-5 py-2.5 text-xs font-bold uppercase"
          >
            {initialData ? 'Update Record' : 'Save Debt Record'}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
};
