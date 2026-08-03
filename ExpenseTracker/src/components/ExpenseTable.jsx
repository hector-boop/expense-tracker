import { useState } from 'react';
import { FaEdit, FaTrash, FaTable, FaCamera } from 'react-icons/fa';
import { 
  formatCurrency, 
  formatDate, 
  getCategoryIcon, 
  getCategoryColor,
  getPaymentMethodIcon,
  getPaymentMethodStyle
} from '../utils/formatters';
import { Modal } from './Modal';
import { PhotoViewerModal } from './PhotoViewerModal';
import { Loader, LoadingWrapper } from './Loader';

export const ExpenseTable = ({ expenses = [], onEdit, onDelete, onDeleteMultiple, isLoading }) => {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [photoViewerState, setPhotoViewerState] = useState({ isOpen: false, photos: [], title: '' });

  const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenses.map(e => e.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedIds.length > 0) {
      if (onDeleteMultiple) {
        onDeleteMultiple(selectedIds);
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="clean-pink-card bg-white p-6 h-[320px] flex flex-col justify-between select-none">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="w-36 h-4 rounded bg-pink-100/80 animate-pulse" />
          <div className="w-24 h-4 rounded bg-pink-100/60 animate-pulse" />
        </div>
        <div className="space-y-4 py-2 flex-1 flex flex-col justify-around">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-100/60 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 rounded bg-pink-100/80 animate-pulse" />
                  <div className="w-20 h-3 rounded bg-pink-50 animate-pulse" />
                </div>
              </div>
              <div className="w-24 h-4 rounded bg-pink-100/60 animate-pulse shrink-0" />
              <div className="w-20 h-5 rounded-lg bg-pink-200/50 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {expenses.length === 0 ? (
        <div className="clean-pink-card p-12 text-center bg-white">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-100 text-rose-700 flex items-center justify-center border border-pink-300">
            <FaTable className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-rose-900 tracking-tight uppercase">No entries in spreadsheet</h3>
          <p className="mt-1 text-xs text-rose-700 font-bold max-w-sm mx-auto uppercase">
            Click "Add Entry" to log transactions into your tracker spreadsheet.
          </p>
        </div>
      ) : (
        <div className="clean-pink-card bg-white space-y-2">
          {/* Bulk Action Header Bar when 1 or more items are selected */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 px-5 bg-rose-50 border-b-2 border-rose-200 flex items-center justify-between animate-content-fade">
            <div className="flex items-center gap-2 text-xs font-black text-rose-900 uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span>{selectedIds.length} {selectedIds.length === 1 ? 'entry' : 'entries'} selected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-rose-800 hover:underline uppercase cursor-pointer"
              >
                Deselect All
              </button>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md border border-red-700 transition-all cursor-pointer uppercase"
              >
                <FaTrash className="w-3 h-3" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto animate-content-fade">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-pink-100/80 text-rose-900 font-extrabold uppercase tracking-wider border-b-2 border-pink-200">
                {/* Select All Checkbox Column */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded-md border-2 border-pink-400 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                    title="Select All"
                  />
                </th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Description / Title</th>
                <th className="py-3.5 px-4 text-center">Receipts</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {expenses.map((expense) => {
                const categoryIcon = getCategoryIcon(expense.category)({ className: 'w-3.5 h-3.5' });
                const categoryStyle = getCategoryColor(expense.category);

                const pmMethod = expense.payment_method || 'Cash';
                const pmIcon = getPaymentMethodIcon(pmMethod)({ className: 'w-3 h-3' });
                const pmStyle = getPaymentMethodStyle(pmMethod);
                const isChecked = selectedIds.includes(expense.id);

                return (
                  <tr
                    key={expense.id}
                    className={`transition-colors ${
                      isChecked ? 'bg-pink-100/50 font-bold' : 'hover:bg-pink-50/70'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(expense.id)}
                        className="w-4 h-4 rounded-md border-2 border-pink-400 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-bold text-rose-900 whitespace-nowrap">
                      {formatDate(expense.expense_date)}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold ${categoryStyle.bg} ${categoryStyle.text}`}
                      >
                        {categoryIcon}
                        <span>{expense.category}</span>
                      </span>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${pmStyle.bg} ${pmStyle.text}`}
                      >
                        {pmIcon}
                        <span>{pmMethod}</span>
                      </span>
                    </td>

                    {/* Description / Title */}
                    <td className="py-3.5 px-4 font-bold text-rose-900">
                      <div>
                        <span>{expense.title}</span>
                        {expense.notes && (
                          <p className="text-[11px] text-rose-700 font-semibold line-clamp-1">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Photo Column */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {expense.photos && expense.photos.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {expense.photos.slice(0, 2).map((photoUrl, pIdx) => (
                            <img
                              key={pIdx}
                              src={photoUrl}
                              alt="Receipt thumbnail"
                              onClick={() => setPhotoViewerState({ isOpen: true, photos: expense.photos, title: `Receipt for ${expense.title}` })}
                              className="w-7 h-7 rounded-lg object-cover border border-pink-300 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                              title="Click to view attached receipt photos"
                            />
                          ))}
                          {expense.photos.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPhotoViewerState({ isOpen: true, photos: expense.photos, title: `Receipt for ${expense.title}` })}
                              className="w-7 h-7 rounded-lg bg-pink-100 border border-pink-300 text-rose-800 font-black text-[10px] flex items-center justify-center hover:bg-pink-200 transition-colors cursor-pointer"
                              title="View all receipt photos"
                            >
                              +{expense.photos.length - 2}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-pink-300 font-bold text-xs">-</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-black text-rose-900 text-sm">
                      {formatCurrency(expense.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-2 text-rose-700 hover:text-rose-900 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit entry"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="p-2 text-rose-700 hover:text-rose-900 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Single Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-rose-900">
            Are you sure you want to delete entry{' '}
            <strong className="text-rose-950">{deleteTarget?.title}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md transition-all cursor-pointer uppercase"
            >
              Delete Entry
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Confirm Batch Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-rose-900">
            Are you sure you want to delete <strong className="text-rose-950">{selectedIds.length}</strong> selected entries? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDeleteConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-md transition-all cursor-pointer uppercase"
            >
              Delete {selectedIds.length} Entries
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo Viewer Lightbox Modal */}
      <PhotoViewerModal
        isOpen={photoViewerState.isOpen}
        onClose={() => setPhotoViewerState({ isOpen: false, photos: [], title: '' })}
        photos={photoViewerState.photos}
        title={photoViewerState.title}
      />
    </>
  );
};
