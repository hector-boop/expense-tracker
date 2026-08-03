import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <FaCheckCircle className="w-4 h-4 text-white" />,
    error: <FaExclamationCircle className="w-4 h-4 text-white" />,
    info: <FaInfoCircle className="w-4 h-4 text-white" />,
  };

  const bgStyles = {
    success: 'bg-rose-600 border-2 border-rose-700 text-white',
    error: 'bg-red-600 border-2 border-red-700 text-white',
    info: 'bg-pink-600 border-2 border-pink-700 text-white',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-toast-in ${bgStyles[type]}`}>
        {icons[type]}
        <p className="text-xs font-bold uppercase tracking-wider">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1 text-white/90 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
