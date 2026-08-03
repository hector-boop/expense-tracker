import { useState } from 'react';
import { FaEdit, FaTrash, FaCamera } from 'react-icons/fa';
import { 
  formatCurrency, 
  formatDate, 
  getCategoryIcon, 
  getCategoryColor,
  getPaymentMethodIcon,
  getPaymentMethodStyle
} from '../utils/formatters';
import { PhotoViewerModal } from './PhotoViewerModal';

export const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const iconElement = getCategoryIcon(expense.category)({ className: 'w-4 h-4' });
  const categoryStyle = getCategoryColor(expense.category);

  const pmMethod = expense.payment_method || 'Cash';
  const pmIcon = getPaymentMethodIcon(pmMethod)({ className: 'w-3 h-3' });
  const pmStyle = getPaymentMethodStyle(pmMethod);

  const photos = expense.photos || (expense.photo ? [expense.photo] : []);

  return (
    <>
      <div className="clean-pink-card p-5 flex flex-col justify-between bg-white space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${categoryStyle.bg} ${categoryStyle.text}`}>
              {iconElement}
            </div>
            <div>
              <h4 className="font-bold text-rose-900 line-clamp-1">
                {expense.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-bold text-rose-700 uppercase">
                  {expense.category}
                </span>
                <span className="text-pink-300">•</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${pmStyle.bg} ${pmStyle.text}`}>
                  {pmIcon}
                  <span>{pmMethod}</span>
                </span>
              </div>
            </div>
          </div>
          <span className="text-lg font-black text-rose-900 whitespace-nowrap">
            {formatCurrency(expense.amount)}
          </span>
        </div>

        {expense.notes && (
          <p className="text-xs text-rose-800 bg-pink-50 p-3 rounded-2xl border border-pink-200 line-clamp-2">
            {expense.notes}
          </p>
        )}

        {/* Attached Photos Strip */}
        {photos.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPhotoViewerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-pink-100 text-rose-800 border border-pink-300 hover:bg-pink-200 transition-colors cursor-pointer"
              title="View attached photos"
            >
              <FaCamera className="w-3 h-3 text-rose-600" />
              <span>{photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Attached</span>
            </button>
            <div className="flex items-center gap-1">
              {photos.slice(0, 3).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  onClick={() => setIsPhotoViewerOpen(true)}
                  className="w-6 h-6 rounded-lg object-cover border border-pink-300 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-rose-700 font-bold uppercase border-t border-pink-100">
          <span>{formatDate(expense.expense_date)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-2 text-rose-700 hover:text-rose-900 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
              title="Edit entry"
            >
              <FaEdit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(expense)}
              className="p-2 text-rose-700 hover:text-rose-900 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
              title="Delete entry"
            >
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      <PhotoViewerModal
        isOpen={isPhotoViewerOpen}
        onClose={() => setIsPhotoViewerOpen(false)}
        photos={photos}
        title={`Attached Receipts for ${expense.title}`}
      />
    </>
  );
};
