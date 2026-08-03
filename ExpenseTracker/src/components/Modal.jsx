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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-22 pb-4 overflow-hidden bg-pink-950/50 backdrop-blur-md ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-pink-300 overflow-hidden max-h-[calc(100vh-6.5rem)] flex flex-col ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean White with Rose Title */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-white border-b border-pink-100 shrink-0">
          <h3 className="text-2xl font-bold text-rose-900 font-cursive">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-pink-400 hover:text-rose-600 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-white overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
