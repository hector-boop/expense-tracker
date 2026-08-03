import { useState } from 'react';
import { FaTimes, FaCheck, FaListUl } from 'react-icons/fa';

export const OptionPickerModal = ({
  isOpen,
  onClose,
  title = 'Select Option',
  options = [],
  selectedValue,
  onSelectValue,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/20 backdrop-blur-xs ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-sm bg-white rounded-3xl p-6 border-2 border-pink-300 shadow-2xl space-y-4 relative overflow-hidden ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <FaListUl className="w-4 h-4 text-rose-700" />
            <h3 className="text-xl font-bold text-rose-900 font-cursive leading-none">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-rose-700 hover:text-rose-900 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Options Grid / List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {options.map((opt) => {
            const isObject = typeof opt === 'object' && opt !== null;
            const val = isObject ? opt.value : opt;
            const label = isObject ? opt.label : opt;
            const Icon = isObject ? opt.icon : null;
            const isSelected = selectedValue === val;

            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onSelectValue(val);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase transition-all border-2 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-pink-50 text-rose-900 border-pink-200 hover:bg-pink-100 hover:text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{label}</span>
                </div>
                {isSelected && <FaCheck className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer Cancel */}
        <div className="flex justify-end pt-2 border-t border-pink-100">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-bold uppercase text-rose-800 hover:bg-pink-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
