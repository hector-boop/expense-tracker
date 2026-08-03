import { FaCalendarAlt, FaClock, FaHashtag } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';
import { LoadingWrapper } from './Loader';

const PesoIcon = () => (
  <span className="font-extrabold text-sm leading-none text-rose-700 select-none">
    ₱
  </span>
);

export const SummaryCards = ({ expenses = [], isLoading = false }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split('T')[0];

  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const monthlyExpenses = expenses
    .filter(item => {
      if (!item.expense_date) return false;
      const d = new Date(item.expense_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const todayExpenses = expenses
    .filter(item => item.expense_date === todayStr)
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const transactionCount = expenses.length;

  const cards = [
    {
      title: 'TOTAL EXPENSES',
      value: formatCurrency(totalExpenses),
      subtitle: 'All-Time Total',
      icon: PesoIcon,
    },
    {
      title: 'THIS MONTH',
      value: formatCurrency(monthlyExpenses),
      subtitle: `${now.toLocaleString('default', { month: 'short' })} ${currentYear}`,
      icon: FaCalendarAlt,
    },
    {
      title: "EXPENSE FOR TODAY",
      value: formatCurrency(todayExpenses),
      subtitle: todayStr,
      icon: FaClock,
    },
    {
      title: 'TRANSACTIONS',
      value: transactionCount,
      subtitle: 'Total Logged Entries',
      icon: FaHashtag,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="clean-pink-card p-6 flex flex-col justify-between bg-white h-[148px] animate-list-item-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                {card.title}
              </span>
              <div className="w-8 h-8 rounded-full bg-pink-100 text-rose-700 border border-pink-300 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="space-y-2 py-1 select-none">
                  <div className="w-32 h-8 rounded-xl bg-pink-100/80 animate-pulse" />
                  <div className="w-20 h-3.5 rounded-md bg-pink-50 animate-pulse" />
                </div>
              ) : (
                <div className="animate-content-fade">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                    {card.value}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 font-bold uppercase tracking-wide">
                    {card.subtitle}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
