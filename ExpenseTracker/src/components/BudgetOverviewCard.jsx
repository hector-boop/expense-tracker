import { useNavigate } from 'react-router-dom';
import { FaWallet, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaArrowRight } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';
import { budgetService } from '../services/budgetService';

export const BudgetOverviewCard = ({ expenses = [], budget = null, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="clean-pink-card p-6 bg-white space-y-4 select-none">
        <div className="flex items-center justify-between">
          <div className="w-40 h-6 rounded bg-pink-100 animate-pulse" />
          <div className="w-20 h-6 rounded-full bg-pink-100 animate-pulse" />
        </div>
        <div className="w-full h-4 rounded-full bg-pink-100 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-2xl bg-pink-50 animate-pulse" />
          <div className="h-16 rounded-2xl bg-pink-50 animate-pulse" />
          <div className="h-16 rounded-2xl bg-pink-50 animate-pulse" />
        </div>
      </div>
    );
  }

  const summary = budgetService.getSpendingSummary(expenses, budget);

  if (!summary.hasBudget) {
    return (
      <div className="clean-pink-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-dashed border-pink-300">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
            <FaWallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-rose-900 font-cursive">Salary / Budget Limit</h3>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
              Set your budget to track overspending & manage income
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-colors cursor-pointer uppercase shrink-0 flex items-center gap-2"
        >
          <span>Set Budget in Settings</span>
          <FaArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const { budgetAmount, period, totalSpent, remaining, percentUsed, isOverBudget, overspendAmount } = summary;
  const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

  // Status banner styling & content
  let statusBg = 'bg-emerald-50 text-emerald-900 border-emerald-300';
  let StatusIcon = FaCheckCircle;
  let iconColor = 'text-emerald-600';
  let statusText = `On track — You've spent ${percentUsed.toFixed(0)}% of your ${period} budget.`;
  let barGradient = 'from-rose-500 to-pink-500';

  if (percentUsed > 80 || isOverBudget) {
    statusBg = 'bg-red-50 text-red-900 border-red-300';
    StatusIcon = FaTimesCircle;
    iconColor = 'text-red-600';
    barGradient = 'from-red-500 to-rose-600';
    if (isOverBudget) {
      statusText = `Over Spending! You've overspent by ${formatCurrency(overspendAmount)} this ${period}!`;
    } else {
      statusText = `Over Spending Warning! You've used ${percentUsed.toFixed(0)}% of your ${period} budget limit!`;
    }
  } else if (percentUsed >= 60) {
    statusBg = 'bg-amber-50 text-amber-900 border-amber-300';
    StatusIcon = FaExclamationTriangle;
    iconColor = 'text-amber-600';
    barGradient = 'from-amber-400 to-amber-500';
    statusText = `Near Limit — You've used ${percentUsed.toFixed(0)}% of your ${period} budget!`;
  }

  return (
    <div className="clean-pink-card p-6 bg-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
            <FaWallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-rose-900 font-cursive">Budget Tracker Overview</h3>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
              {period} Spending vs limit
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-xl transition-colors cursor-pointer uppercase"
        >
          Edit Budget
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold uppercase text-rose-900">
          <span>Budget Usage</span>
          <span>{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-pink-100 rounded-full overflow-hidden border border-pink-200 p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-pink-50/80 border-2 border-pink-200 flex flex-col">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">BUDGET LIMIT</span>
          <span className="text-lg font-black text-rose-950">{formatCurrency(budgetAmount)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-pink-50/80 border-2 border-pink-200 flex flex-col">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">TOTAL SPENT ({period})</span>
          <span className="text-lg font-black text-rose-950">{formatCurrency(totalSpent)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-pink-50/80 border-2 border-pink-200 flex flex-col">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
            {isOverBudget ? 'OVER BUDGET BY' : 'REMAINING'}
          </span>
          <span className={`text-lg font-black ${isOverBudget ? 'text-red-600' : 'text-emerald-700'}`}>
            {isOverBudget ? formatCurrency(overspendAmount) : formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 ${statusBg}`}>
        <StatusIcon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <span className="text-xs font-bold uppercase tracking-wide">{statusText}</span>
      </div>
    </div>
  );
};
