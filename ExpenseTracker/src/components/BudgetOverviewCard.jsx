import { FaWallet, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSlidersH } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';
import { budgetService } from '../services/budgetService';

export const BudgetOverviewCard = ({ expenses = [], budget = null, isLoading = false, onEditBudget }) => {

  if (isLoading) {
    return (
      <div className="clean-pink-card p-6 bg-white space-y-6 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="w-40 h-5 rounded bg-pink-100 animate-pulse" />
              <div className="w-48 h-3 rounded bg-pink-100 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-6 rounded-full bg-pink-100 animate-pulse" />
            <div className="w-24 h-6 rounded-full bg-pink-100 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 rounded bg-pink-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-rose-100/60">
          <div className="h-16 rounded-xl bg-pink-50 animate-pulse" />
          <div className="h-16 rounded-xl bg-pink-50 animate-pulse" />
          <div className="h-16 rounded-xl bg-pink-50 animate-pulse" />
          <div className="h-16 rounded-xl bg-pink-50 animate-pulse" />
        </div>
      </div>
    );
  }

  const summary = budgetService.getSpendingSummary(expenses, budget);

  if (!summary.hasBudget) {
    return (
      <div className="clean-pink-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-dashed border-pink-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 text-white">
              <FaWallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-rose-950 font-sans">Salary / Budget Limit</h3>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wide">
              Set your budget to track overspending & manage income
            </p>
          </div>
        </div>
        <button
          onClick={onEditBudget}
          className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-md transition-colors cursor-pointer uppercase shrink-0 flex items-center gap-2"
        >
          <span>Set Budget</span>
        </button>
      </div>
    );
  }

  const { budgetAmount, period, totalSpent, remaining, percentUsed, isOverBudget, overspendAmount } = summary;
  const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

  // Calculate today's spending and all-time spending
  const today = new Date();
  const todaySpent = expenses
    .filter(item => {
      if (!item.expense_date) return false;
      const d = new Date(item.expense_date);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    })
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const allTimeSpent = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Status badge styling & content
  let statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let StatusIcon = FaCheckCircle;
  let statusText = `On Track (${percentUsed.toFixed(0)}% used)`;
  let barBg = 'bg-emerald-500';

  if (percentUsed > 100 || isOverBudget) {
    statusBg = 'bg-rose-50 text-rose-700 border-rose-200';
    StatusIcon = FaTimesCircle;
    statusText = `Over Budget (${percentUsed.toFixed(0)}% used)`;
    barBg = 'bg-rose-600';
  } else if (percentUsed >= 60) {
    statusBg = 'bg-amber-50 text-amber-700 border-amber-200';
    StatusIcon = FaExclamationTriangle;
    statusText = `Near Limit (${percentUsed.toFixed(0)}% used)`;
    barBg = 'bg-orange-500';
  }

  return (
    <div className="clean-pink-card p-6 bg-white space-y-6 select-none">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 text-white">
              <FaWallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg md:text-xl font-bold text-rose-950 tracking-tight">
              Budget Tracker Overview
            </h3>
            <span className="text-[11px] font-bold text-rose-600 lowercase tracking-wide mt-0.5">
              {period} budget limit vs. actual spending
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBg}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusText}</span>
          </div>

          <button
            onClick={onEditBudget}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-full transition-all cursor-pointer shadow-sm"
          >
            <FaSlidersH className="w-3 h-3" />
            <span>Edit Budget</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-rose-950 font-sans tracking-wide uppercase">
          <span>{period} Budget Progress</span>
          <span>{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2.5 bg-rose-50 rounded-full overflow-hidden border border-rose-100/60 p-0.5">
          <div
            className={`h-full rounded-full ${barBg} transition-all duration-500`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-rose-100/60">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">BUDGET LIMIT</span>
          <h3 className="text-xl md:text-2xl font-black text-rose-950 mt-1">{formatCurrency(budgetAmount)}</h3>
          <span className="text-[11px] font-bold text-rose-600 lowercase mt-0.5">{period} cap</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">SPENT ({period.toUpperCase()})</span>
          <h3 className="text-xl md:text-2xl font-black text-rose-950 mt-1">{formatCurrency(totalSpent)}</h3>
          <span className="text-[11px] font-bold text-rose-600 lowercase mt-0.5">{percentUsed.toFixed(0)}% of limit</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">REMAINING</span>
          <h3 className={`text-xl md:text-2xl font-black mt-1 ${isOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
            {isOverBudget ? formatCurrency(overspendAmount) : formatCurrency(remaining)}
          </h3>
          <span className="text-[11px] font-bold text-rose-600 lowercase mt-0.5">
            {isOverBudget ? 'over budget limit' : 'available to spend'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">TODAY / ALL-TIME</span>
          <h3 className="text-xl md:text-2xl font-black text-rose-950 mt-1">{formatCurrency(todaySpent)}</h3>
          <span className="text-[11px] font-bold text-rose-600 lowercase mt-0.5">{formatCurrency(allTimeSpent)} lifetime total</span>
        </div>
      </div>
    </div>
  );
};
