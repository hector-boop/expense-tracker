import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus, 
  FaChartPie, 
  FaFilter, 
  FaCheck, 
  FaTimes, 
  FaTable,
  FaCoins,
  FaReceipt,
  FaWallet,
  FaDownload,
  FaPaw
} from 'react-icons/fa';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('next');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setCurrentStep(0);
      setDirection('next');
    }, 180);
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Expense Tracker!',
      subtitle: 'Your Personal Finance & Spreadsheet Dashboard',
      icon: FaTable,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaTable className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Welcome aboard! Track your daily expenses, manage budgets, track debts, and view real-time spreadsheet analytics.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Tip: Your account starts clean with zero mock placeholders so you can start logging your real finances!
          </div>
        </div>
      ),
    },
    {
      title: 'Log Expenses & Receipt Photos',
      subtitle: 'Record Amounts in Philippine Pesos (₱)',
      icon: FaPlus,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaPlus className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Click <strong className="text-rose-700">&quot;+ Add Entry&quot;</strong> in the navigation bar to log transactions with full detail.
          </p>
          <ul className="text-xs font-bold text-rose-800 text-left space-y-1.5 max-w-xs mx-auto bg-pink-50 p-3.5 rounded-2xl border border-pink-200">
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Enter Amount (₱), Category & Payment Method</span>
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Attach multiple receipt photos with auto-compression</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Debt & Lend Manager',
      subtitle: 'Track Money You Owe & Money Owed to You',
      icon: FaCoins,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaCoins className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Keep track of payables and receivables in the <strong className="text-rose-700">Debt Manager</strong>.
          </p>
          <ul className="text-xs font-bold text-rose-800 text-left space-y-1.5 max-w-xs mx-auto bg-pink-50 p-3.5 rounded-2xl border border-pink-200">
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Track &quot;Money I Owe&quot; & &quot;Money Owed to Me&quot;</span>
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Record partial/full payments & auto-log as expenses</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Incoming Bills & Subscriptions',
      subtitle: 'Stay on Top of Upcoming Dues',
      icon: FaReceipt,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaReceipt className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Schedule recurring bills, utilities, and subscriptions directly on your dashboard.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Get due date countdown badges and one-click &quot;Pay Bill&quot; action to instantly create expense entries.
          </div>
        </div>
      ),
    },
    {
      title: 'Salary & Budget Spending Limits',
      subtitle: 'Monitor Spending vs Target Limits',
      icon: FaWallet,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaWallet className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Set weekly, monthly, or yearly budget limits in <strong className="text-rose-700">Settings</strong>.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            View live visual budget progress bars with automatic warnings when you reach 80% or 100% of your limit.
          </div>
        </div>
      ),
    },
    {
      title: 'Export Financial Reports',
      subtitle: 'Download PDF, CSV, & Word Documents',
      icon: FaDownload,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaDownload className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Export all your expenses and debt records anytime via the <strong className="text-rose-700">&quot;Export&quot;</strong> button in the top bar.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Choose from formatted PDF summaries, Excel-compatible CSVs, or Microsoft Word (.docx) documents.
          </div>
        </div>
      ),
    },
    {
      title: 'Wandering Pet & Customization',
      subtitle: 'Interactive Desk Buddy & Custom Categories',
      icon: FaPaw,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaPaw className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Meet your animated desk buddy! Click your pet for financial tips and encouragement.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Switch between the Duck and White Cat in Settings, toggle visibility anytime in the sidebar, and create custom spending categories!
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection('next');
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('back');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('has_completed_onboarding', 'true');
    handleClose();
  };

  const modalElement = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-pink-950/20 backdrop-blur-[3px] ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-pink-300 overflow-hidden relative min-h-[490px] flex flex-col justify-between transform transition-all ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with locked top-right X button */}
        <div className="relative px-6 pt-6 pb-2 bg-white flex items-start justify-between min-h-[84px] shrink-0">
          <div key={`header-${currentStep}`} className={`pr-8 ${direction === 'next' ? 'animate-step-next' : 'animate-step-back'}`}>
            <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h3 className="text-2xl font-bold text-rose-900 font-cursive leading-tight mt-0.5">
              {currentStepData.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleComplete}
            className="absolute top-5 right-5 p-2 text-pink-400 hover:text-rose-600 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
            title="Close tutorial"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Body content with fixed height container to prevent modal resizing */}
        <div className="px-6 pb-6 pt-1 bg-white flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex items-center justify-center my-auto min-h-[210px]">
            <div key={`content-${currentStep}`} className={`w-full ${direction === 'next' ? 'animate-step-next' : 'animate-step-back'}`}>
              {currentStepData.content}
            </div>
          </div>

          <div className="space-y-4 pt-2 shrink-0">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6 bg-rose-600' : 'w-2 bg-pink-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between uppercase text-xs font-bold pt-1">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-4 py-2 text-rose-700 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {currentStep === steps.length - 1 ? 'Start Tracking!' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : modalElement;
};
