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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/20 backdrop-blur-xs ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-pink-300 overflow-hidden ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean White with Rose Title */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 bg-white">
          <h3 className="text-2xl font-bold text-rose-900 font-cursive">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-pink-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
