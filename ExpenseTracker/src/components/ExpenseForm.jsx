import { useState } from 'react';
import { DEFAULT_CATEGORIES } from '../services/expenseService';
import { DatePickerModal } from './DatePickerModal';
import { OptionPickerModal } from './OptionPickerModal';
import { PhotoViewerModal } from './PhotoViewerModal';
import { uploadPhotoToStorage } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';
import { 
  formatDate, 
  PAYMENT_METHODS, 
  getCategoryIcon, 
  getPaymentMethodIcon 
} from '../utils/formatters';
import { 
  FaCalendarAlt, 
  FaChevronDown, 
  FaExclamationCircle, 
  FaCamera, 
  FaTrash, 
  FaImage, 
  FaPlus,
  FaEye
} from 'react-icons/fa';

export const ExpenseForm = ({ initialData, onSubmit, onCancel, customCategories = [] }) => {
  const categoriesList = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || DEFAULT_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || PAYMENT_METHODS[0]);
  const [expenseDate, setExpenseDate] = useState(initialData?.expense_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photos, setPhotos] = useState(() => initialData?.photos || (initialData?.photo ? [initialData.photo] : []));
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Description / Title is required';
    }
    if (amount === '' || amount === null || amount === undefined) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      newErrors.amount = 'Valid positive amount is required';
    }
    if (!expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    } else if (expenseDate > todayStr) {
      newErrors.expenseDate = 'Future dates are not allowed';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingPhoto(true);
    try {
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch { /* offline or demo mode */ }

      const uploadedUrls = [];
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const url = await uploadPhotoToStorage(file, userId);
          uploadedUrls.push(url);
        }
      }
      setPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        notes: notes.trim(),
        photos,
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categoriesList.map(cat => ({
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

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 text-xs font-bold uppercase overflow-hidden -m-6">
        {/* Scrollable Form Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {/* Modal Error Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs font-bold uppercase text-red-700 flex items-center gap-2">
              <FaExclamationCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Please fill in all required fields.</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
              Description / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="Enter title or description..."
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
                Amount (₱) *
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

            {/* Category Trigger Button */}
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

          {/* Payment Method & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method Trigger Button */}
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

            {/* Date Trigger Button */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
                Date *
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 font-bold transition-all hover:border-pink-400 cursor-pointer ${
                  errors.expenseDate
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className={`w-4 h-4 ${errors.expenseDate ? 'text-red-500' : 'text-rose-700'}`} />
                  <span>{expenseDate ? formatDate(expenseDate) : 'Select date'}</span>
                </div>
                <FaChevronDown className="w-3 h-3 text-pink-400" />
              </button>
              {errors.expenseDate && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                  <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                  <span>{errors.expenseDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-900 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 placeholder-rose-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all resize-none font-bold"
            />
          </div>

          {/* Photos / Attachments Submission */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block tracking-wider text-rose-900">
                Receipts / Photos (Optional)
              </label>
              {photos.length > 0 && (
                <span className="text-[11px] font-black text-rose-700 bg-pink-100 px-2 py-0.5 rounded-lg border border-pink-200">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              )}
            </div>

            {/* Photo Dropzone & Select Button */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handlePhotoFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                isDragOver ? 'border-rose-600 bg-pink-100/60' : 'border-pink-300 bg-pink-50/50 hover:bg-pink-50'
              }`}
            >
              {/* Photo Thumbnails Preview */}
              {photos.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  {photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewIndex(idx);
                        setIsPhotoViewerOpen(true);
                      }}
                      className="relative group w-10 h-10 rounded-lg overflow-hidden border-2 border-pink-300 shadow-xs bg-white cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all shrink-0"
                      title="Click to view full photo"
                    >
                      <img
                        src={photoUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-rose-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FaEye className="w-3 h-3 text-white drop-shadow-md" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md opacity-90 group-hover:opacity-100 shadow-md transition-all cursor-pointer z-10"
                        title="Remove photo"
                      >
                        <FaTrash className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-1.5">
                {photos.length === 0 && (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-white border border-pink-200 text-rose-600 flex items-center justify-center shadow-xs">
                      <FaCamera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-rose-900">
                      Drag & drop receipts / photos here
                    </p>
                    <p className="text-[10px] text-rose-700 font-semibold uppercase">
                      Supports PNG, JPG, JPEG (Compressed automatically)
                    </p>
                  </>
                )}

                <label className="mt-1 px-4 py-2 text-xs font-extrabold text-rose-800 bg-white hover:bg-pink-100 border-2 border-pink-300 rounded-xl cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5">
                  <FaPlus className="w-3 h-3 text-rose-600" />
                  <span>{photos.length > 0 ? 'Add More Photos' : 'Upload Photos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoFiles(e.target.files)}
                    className="hidden"
                  />
                </label>

                {isProcessingPhoto && (
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-bold mt-2">
                    <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    <span>Processing images...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Sticky Bottom Footer Bar */}
        <div className="px-6 py-3.5 bg-pink-50/50 border-t border-pink-100 flex items-center justify-end gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{initialData ? 'Update Expense' : 'Save Expense'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Custom Pink Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={expenseDate}
        onSelectDate={(d) => setExpenseDate(d)}
        title="Select Expense Date"
        maxDate={todayStr}
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

      {/* Full-Screen Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={isPhotoViewerOpen}
        onClose={() => setIsPhotoViewerOpen(false)}
        photos={photos}
        title="Uploaded Receipt Preview"
      />
    </>
  );
};
