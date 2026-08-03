import { 
  FaUtensils, 
  FaCar, 
  FaFileInvoiceDollar, 
  FaShoppingBag, 
  FaFilm, 
  FaHeartbeat, 
  FaGraduationCap, 
  FaBolt, 
  FaTag,
  FaHeart,
  FaMoneyBillWave,
  FaCreditCard,
  FaWallet
} from 'react-icons/fa';

export const formatCurrency = (amount, currency = 'PHP') => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const getOrdinalSuffix = (day) => {
  const num = Number(day);
  if (!num || isNaN(num)) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
};

export const CATEGORY_ICONS = {
  Food: FaUtensils,
  Transportation: FaCar,
  Bills: FaFileInvoiceDollar,
  Shopping: FaShoppingBag,
  Entertainment: FaFilm,
  Health: FaHeartbeat,
  Education: FaGraduationCap,
  Utilities: FaBolt,
  Other: FaTag,
};

export const CATEGORY_COLORS = {
  Food: { bg: 'bg-pink-100 border border-pink-300', text: 'text-pink-900', hex: '#fce4ec' },
  Transportation: { bg: 'bg-pink-200 border border-pink-400', text: 'text-pink-900', hex: '#f8bbd0' },
  Bills: { bg: 'bg-pink-300 border border-pink-500', text: 'text-pink-950', hex: '#f48fb1' },
  Shopping: { bg: 'bg-rose-200 border border-rose-400', text: 'text-rose-950', hex: '#f06292' },
  Entertainment: { bg: 'bg-rose-300 border border-rose-500', text: 'text-white', hex: '#ec407a' },
  Health: { bg: 'bg-pink-400 border border-pink-600', text: 'text-white', hex: '#e91e63' },
  Education: { bg: 'bg-rose-500 border border-rose-700', text: 'text-white', hex: '#d81b60' },
  Utilities: { bg: 'bg-pink-500 border border-pink-700', text: 'text-white', hex: '#c2185b' },
  Other: { bg: 'bg-pink-50 border border-pink-200', text: 'text-pink-800', hex: '#f8bbd0' },
};

export const getCategoryIcon = (categoryName) => {
  const IconComponent = CATEGORY_ICONS[categoryName] || FaHeart;
  return IconComponent;
};

export const getCategoryColor = (categoryName) => {
  return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Other;
};

// Payment Method Helpers
export const PAYMENT_METHODS = ['Cash', 'Card', 'Online Wallet'];

export const PAYMENT_METHOD_ICONS = {
  Cash: FaMoneyBillWave,
  Card: FaCreditCard,
  'Online Wallet': FaWallet,
};

export const getPaymentMethodIcon = (method) => {
  return PAYMENT_METHOD_ICONS[method] || FaMoneyBillWave;
};

export const getPaymentMethodStyle = (method) => {
  switch (method) {
    case 'Card':
      return { bg: 'bg-purple-100 border border-purple-300', text: 'text-purple-900' };
    case 'Online Wallet':
      return { bg: 'bg-sky-100 border border-sky-300', text: 'text-sky-900' };
    case 'Cash':
    default:
      return { bg: 'bg-emerald-100 border border-emerald-300', text: 'text-emerald-900' };
  }
};
