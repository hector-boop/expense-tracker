import { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';

export const Modal = ({ isOpen, onClose, title, children }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-pink-950/40 backdrop-blur-xs overflow-y-auto ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-pink-300 overflow-hidden my-auto max-h-[88vh] flex flex-col ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header - Fixed White Bar with Title & Close Button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-white border-b border-pink-100 shrink-0 select-none z-10">
          <h3 className="text-2xl font-bold text-rose-900 font-cursive leading-none">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-pink-400 hover:text-rose-600 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
            title="Close modal"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body - Scrollable Container */}
        <div className="p-6 bg-white overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
