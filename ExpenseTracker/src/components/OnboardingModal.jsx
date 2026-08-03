import { useState } from 'react';
import { FaPlus, FaChartPie, FaFilter, FaCheck, FaTimes, FaTable } from 'react-icons/fa';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
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
            Welcome aboard! We are thrilled to have you here. Track all your daily expenses.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Tip: Your new account starts 100% clean with zero mock placeholders so you can start logging your real finances!
          </div>
        </div>
      ),
    },
    {
      title: 'Logging Your First Expense',
      subtitle: 'Record Amounts in Philippine Pesos (₱)',
      icon: FaPlus,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaPlus className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Click the <strong className="text-rose-700">"+ Add Entry"</strong> button in the top navigation bar anytime to log a new purchase or bill.
          </p>
          <ul className="text-xs font-bold text-rose-800 text-left space-y-1.5 max-w-xs mx-auto bg-pink-50 p-3.5 rounded-2xl border border-pink-200">
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Enter Description, Amount (₱), & Category</span>
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-rose-600 shrink-0" />
              <span>Pick transaction date & optional notes</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Live Expense Analytics',
      subtitle: 'Visual Charts & Monthly Timelines',
      icon: FaChartPie,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaChartPie className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Your dashboard automatically calculates your <strong>Total Expenses</strong>, <strong>Expense for Today</strong>, and <strong>This Month</strong> breakdown in real time.
          </p>
          <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-xs font-bold text-rose-800">
            Enjoy interactive Category Breakdown Pie Charts and Daily Timeline Area Charts!
          </div>
        </div>
      ),
    },
    {
      title: 'Filter, Search & Custom Categories',
      subtitle: 'Full Control Over Your Spreadsheet Data',
      icon: FaFilter,
      content: (
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 border-2 border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
            <FaFilter className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-rose-900 leading-relaxed">
            Head over to the <strong className="text-rose-700">Expenses Table</strong> tab to search entries by keyword, month, date range, or category.
          </p>
          <p className="text-xs font-bold text-rose-800 bg-pink-50 p-3 rounded-2xl border border-pink-200">
            You can also add your own custom categories in Settings!
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('has_completed_onboarding', 'true');
    setCurrentStep(0);
    handleClose();
  };

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 pb-4 overflow-hidden bg-pink-950/40 backdrop-blur-xs ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-pink-300 overflow-hidden transform transition-all ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 bg-white">
          <div>
            <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h3 className="text-2xl font-bold text-rose-900 font-cursive leading-tight">
              {currentStepData.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleComplete}
            className="p-2 text-rose-700 hover:text-rose-900 rounded-xl transition-colors cursor-pointer"
            title="Close tutorial"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 bg-white space-y-4">
          {currentStepData.content}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
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
          <div className="flex items-center justify-between pt-4 uppercase text-xs font-bold">
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
  );
};
