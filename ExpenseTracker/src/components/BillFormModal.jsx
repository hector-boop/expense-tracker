import { useState } from 'react';
import { Modal } from './Modal';
import { SubmitButton } from './SubmitButton';
import { DatePickerModal } from './DatePickerModal';
import { OptionPickerModal } from './OptionPickerModal';
import { DEFAULT_CATEGORIES } from '../services/expenseService';
import { 
  formatDate, 
  PAYMENT_METHODS, 
  getCategoryIcon, 
  getPaymentMethodIcon,
  getOrdinalSuffix 
} from '../utils/formatters';
import { FaCalendarAlt, FaChevronDown, FaPlus, FaRedo, FaExclamationCircle } from 'react-icons/fa';

export const BillFormModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  
  // Due mode: 'recurring' | 'specific'
  const [dueMode, setDueMode] = useState('recurring');
  const [recurringDayInput, setRecurringDayInput] = useState('15');
  const [dueDate, setDueDate] = useState('');
  
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal Pickers
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false);

  const calculateDueDateFromDay = (dayNum) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (currentDay > dayNum) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    const formattedMonth = String(targetMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    return `${targetYear}-${formattedMonth}-${formattedDay}`;
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Bill description / title is required';
    }
    if (amount === '' || amount === null || amount === undefined) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      newErrors.amount = 'Valid positive amount is required';
    }
    if (dueMode === 'recurring') {
      const num = Number(recurringDayInput);
      if (!recurringDayInput || isNaN(num) || num < 1 || num > 31) {
        newErrors.dueDate = 'Day must be between 1 and 31';
      }
    } else if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let finalDueDate = dueDate;
    let finalRecurringDay = null;

    if (dueMode === 'recurring') {
      finalRecurringDay = Number(recurringDayInput);
      finalDueDate = calculateDueDateFromDay(finalRecurringDay);
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        payment_method: paymentMethod,
        due_date: finalDueDate,
        recurring_day: finalRecurringDay,
        notes: notes.trim(),
      });
      // Reset form
      setTitle('');
      setAmount('');
      setCategory('Bills');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDueDate('');
      setRecurringDayInput('15');
      setNotes('');
      setErrors({});
      onClose();
    } catch (err) {
      console.error('Error submitting bill form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = DEFAULT_CATEGORIES.map(cat => ({
    value: cat,
    label: cat,
    icon: getCategoryIcon(cat),
  }));

  const paymentOptions = PAYMENT_METHODS.map(pm => ({
    value: pm,
    label: pm,
    icon: getPaymentMethodIcon(pm),
  }));

  const categoryIcon = getCategoryIcon(category)({ className: 'w-4 h-4 text-rose-700' });
  const paymentIcon = getPaymentMethodIcon(paymentMethod)({ className: 'w-4 h-4 text-rose-700' });

  const numDay = Number(recurringDayInput);
  const ordinalLabel = numDay && numDay >= 1 && numDay <= 31 ? getOrdinalSuffix(numDay) : '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Incoming Bill"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs font-bold uppercase">
          {/* Modal Error Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs font-bold uppercase text-red-700 flex items-center gap-2">
              <FaExclamationCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Please fill in all required bill fields.</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
              Bill Description / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="Enter bill description or service..."
              className={`w-full px-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-rose-400 font-medium focus:outline-hidden focus:ring-2 transition-all font-bold ${
                errors.title
                  ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                  : 'border-pink-300 focus:ring-rose-500'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Amount & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
                Estimated Amount (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full px-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-rose-400 font-medium focus:outline-hidden focus:ring-2 transition-all font-bold ${
                  errors.amount
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
              {errors.amount && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                  <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            {/* Category Trigger */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold transition-all hover:border-pink-400 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {categoryIcon}
                  <span>{category}</span>
                </div>
                <FaChevronDown className="w-3 h-3 text-pink-400" />
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
              Payment Method *
            </label>
            <button
              type="button"
              onClick={() => setIsPaymentPickerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold transition-all hover:border-pink-400 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {paymentIcon}
                <span>{paymentMethod}</span>
              </div>
              <FaChevronDown className="w-3 h-3 text-pink-400" />
            </button>
          </div>

          {/* Due Schedule Mode Selector (Recurring Text Box vs Specific Date) */}
          <div className="space-y-2 pt-1 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <label className="block tracking-wider text-rose-900">
                Due Date Schedule *
              </label>
              <div className="flex items-center gap-1 bg-pink-100 p-1 rounded-xl border border-pink-300 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDueMode('recurring')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                    dueMode === 'recurring'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-800 hover:bg-pink-200'
                  }`}
                >
                  <FaRedo className="w-2.5 h-2.5" />
                  <span>Every Month</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDueMode('specific')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                    dueMode === 'specific'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-800 hover:bg-pink-200'
                  }`}
                >
                  <FaCalendarAlt className="w-2.5 h-2.5" />
                  <span>Specific Date</span>
                </button>
              </div>
            </div>

            {/* 1. RECURRING DAY TEXT BOX OR 2. SPECIFIC DATE PICKER BUTTON */}
            <div key={dueMode} className="transition-all duration-300 ease-in-out animate-content-fade">
              {dueMode === 'recurring' ? (
                <div className={`p-3 bg-pink-50/70 rounded-2xl border-2 space-y-2 ${
                  errors.dueDate ? 'border-red-500 bg-red-50/20' : 'border-pink-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-900 shrink-0">EVERY</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={recurringDayInput}
                      onChange={(e) => {
                        setRecurringDayInput(e.target.value);
                        if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
                      }}
                      placeholder="15"
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-pink-300 bg-white text-rose-950 font-black text-center text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-xs"
                    />
                    <span className="text-xs font-black text-rose-900 shrink-0">
                      OF THE MONTH
                    </span>
                  </div>

                  {ordinalLabel && (
                    <p className="text-[11px] font-extrabold text-rose-700 tracking-wider">
                      Bill due on the <strong className="text-rose-950">{ordinalLabel}</strong> day of every month
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(true)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 font-bold transition-all hover:border-pink-400 cursor-pointer ${
                      errors.dueDate ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20' : 'border-pink-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className={`w-4 h-4 ${errors.dueDate ? 'text-red-500' : 'text-rose-700'}`} />
                      <span>{dueDate ? formatDate(dueDate) : 'Select Specific Due Date'}</span>
                    </div>
                    <FaChevronDown className="w-3 h-3 text-pink-400" />
                  </button>
                </div>
              )}
            </div>
            {errors.dueDate && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.dueDate}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter additional notes or details..."
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 placeholder-rose-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none font-bold"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <SubmitButton
              loading={submitting}
              icon={FaPlus}
              className="px-6 py-2.5 text-xs font-bold"
            >
              Add Bill
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Specific Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate}
        onSelectDate={(d) => setDueDate(d)}
        title="Select Specific Due Date"
        maxDate={null}
      />

      {/* Category Option Picker Modal */}
      <OptionPickerModal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        title="Select Category"
        options={categoryOptions}
        selectedValue={category}
        onSelectValue={(val) => setCategory(val)}
      />

      {/* Payment Method Option Picker Modal */}
      <OptionPickerModal
        isOpen={isPaymentPickerOpen}
        onClose={() => setIsPaymentPickerOpen(false)}
        title="Select Payment Method"
        options={paymentOptions}
        selectedValue={paymentMethod}
        onSelectValue={(val) => setPaymentMethod(val)}
      />
    </>
  );
};
