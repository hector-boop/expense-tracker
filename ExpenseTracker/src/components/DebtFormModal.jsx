import { useState } from 'react';
import { Modal } from './Modal';
import { SubmitButton } from './SubmitButton';
import { DatePickerModal } from './DatePickerModal';
import { formatDate } from '../utils/formatters';
import { FaUser, FaTag, FaCalendarAlt, FaStickyNote, FaHandHoldingUsd, FaCoins, FaChevronDown } from 'react-icons/fa';

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Type selector toggle */}
        <div>
          <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5">
            Debt Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-pink-50 rounded-2xl border border-pink-200">
            <button
              type="button"
              onClick={() => setType('i_owe')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'i_owe'
                  ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                  : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
              }`}
            >
              <FaCoins className={`w-3.5 h-3.5 ${type === 'i_owe' ? 'text-white' : 'text-rose-600'}`} />
              <span>I Owe </span>
            </button>
            <button
              type="button"
              onClick={() => setType('owed_to_me')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'owed_to_me'
                  ? 'bg-rose-600 text-white shadow-xs border-2 border-rose-700'
                  : 'text-rose-900 bg-white hover:bg-pink-100 border border-pink-200'
              }`}
            >
              <FaHandHoldingUsd className={`w-3.5 h-3.5 ${type === 'owed_to_me' ? 'text-white' : 'text-rose-600'}`} />
              <span>Owed to Me </span>
            </button>
          </div>
        </div>

        {/* Person / Contact */}
        <div>
          <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
            {type === 'i_owe' ? 'Creditor ' : 'Debtor'}
          </label>
          <div className="relative">
            <FaUser className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={type === 'i_owe' ? 'Who do you owe?' : 'Who owes you?'}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 placeholder-rose-400 font-bold ${
                errors.person ? 'border-rose-600 bg-pink-50' : 'border-pink-300'
              }`}
            />
          </div>
          {errors.person && <p className="text-xs text-rose-800 mt-1 font-bold">{errors.person}</p>}
        </div>

        {/* Title / Description */}
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
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 placeholder-rose-400 font-bold ${
                errors.title ? 'border-rose-600 bg-pink-50' : 'border-pink-300'
              }`}
            />
          </div>
          {errors.title && <p className="text-xs text-rose-800 mt-1 font-bold">{errors.title}</p>}
        </div>

        {/* Amount & Amount Paid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              Total Amount (₱) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-rose-600 font-extrabold text-sm select-none">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 placeholder-rose-400 font-bold ${
                  errors.amount ? 'border-rose-600 bg-pink-50' : 'border-pink-300'
                }`}
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-800 mt-1 font-bold">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
              Already Paid (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-rose-600 font-extrabold text-sm select-none">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-pink-50/50 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 placeholder-rose-400 font-bold ${
                  errors.amountPaid ? 'border-rose-600 bg-pink-50' : 'border-pink-300'
                }`}
              />
            </div>
            {errors.amountPaid && <p className="text-xs text-rose-800 mt-1 font-bold">{errors.amountPaid}</p>}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
            Due Date (Optional)
          </label>
          <div 
            onClick={() => setIsDatePickerOpen(true)}
            className="relative cursor-pointer"
          >
            <FaCalendarAlt className="absolute left-3.5 top-3.5 text-rose-600 w-3.5 h-3.5" />
            <input
              type="text"
              readOnly
              value={dueDate ? formatDate(dueDate) : ''}
              placeholder="Select due date..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-pink-50/50 border-2 border-pink-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-rose-950 font-bold placeholder-rose-400 cursor-pointer"
            />
            <FaChevronDown className="absolute right-3.5 top-3.5 text-pink-400 w-3.5 h-3.5 pointer-events-none" />
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

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-100">
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

      {/* Custom Pink Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate}
        onSelectDate={(d) => setDueDate(d)}
        title="Select Due Date"
        maxDate={null}
      />
    </Modal>
  );
};
