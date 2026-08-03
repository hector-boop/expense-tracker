import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaCalendarAlt, FaThLarge } from 'react-icons/fa';

export const DatePickerModal = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Select Date',
  maxDate = new Date().toISOString().split('T')[0],
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  };

  const getParsedDate = (dStr) => {
    if (!dStr) return new Date();
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const initialDate = getParsedDate(selectedDate);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [pickerMode, setPickerMode] = useState('days'); // 'days' | 'years' | 'months'

  if (!isOpen) return null;

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (day) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

    if (maxDate && dateStr > maxDate) return;

    onSelectDate(dateStr);
    handleClose();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Generate Year Range (1920 to current year)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1920; y--) {
    years.push(y);
  }

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 pt-20 pb-4 overflow-hidden bg-pink-950/30 backdrop-blur-[5px] ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
    >
      <div 
        className={`w-full max-w-sm bg-white rounded-3xl p-6 border-2 border-pink-300 shadow-2xl space-y-4 relative overflow-hidden ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="w-4 h-4 text-rose-700" />
            <h3 className="text-xl font-bold text-rose-900 font-cursive leading-none">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-rose-700 hover:text-rose-900 hover:bg-pink-100 rounded-xl transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Header Navigation & View Mode Buttons */}
        <div className="flex items-center justify-between gap-2 px-1">
          {pickerMode === 'days' ? (
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-rose-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <FaChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* Interactive Header Buttons for Switching Modes */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase">
            <button
              type="button"
              onClick={() => setPickerMode(prev => prev === 'months' ? 'days' : 'months')}
              className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                pickerMode === 'months'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-pink-50 text-rose-900 border-pink-300 hover:bg-pink-100'
              }`}
            >
              {MONTH_NAMES[viewMonth]}
            </button>

            <button
              type="button"
              onClick={() => setPickerMode(prev => prev === 'years' ? 'days' : 'years')}
              className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                pickerMode === 'years'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-pink-50 text-rose-900 border-pink-300 hover:bg-pink-100'
              }`}
            >
              {viewYear}
            </button>
          </div>

          {pickerMode === 'days' ? (
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-rose-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors cursor-pointer"
              title="Next Month"
            >
              <FaChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* 1. DAYS VIEW */}
        {pickerMode === 'days' && (
          <div className="space-y-2">
            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-rose-700 tracking-wider">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1 text-xs font-bold">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-9" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const formattedMonth = String(viewMonth + 1).padStart(2, '0');
                const formattedDay = String(day).padStart(2, '0');
                const cellDateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

                const isSelected = selectedDate === cellDateStr;
                const isDisabled = maxDate && cellDateStr > maxDate;
                const isToday = todayStr === cellDateStr;

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDayClick(day)}
                    className={`h-9 w-full rounded-2xl flex items-center justify-center transition-all text-xs font-extrabold cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md border-2 border-rose-700'
                        : isDisabled
                        ? 'text-pink-300 bg-pink-50/40 cursor-not-allowed opacity-50'
                        : isToday
                        ? 'bg-pink-100 text-rose-900 border-2 border-pink-400 hover:bg-pink-200'
                        : 'bg-white text-rose-900 border border-pink-200 hover:bg-pink-100 hover:text-rose-950'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MONTHS GRID VIEW */}
        {pickerMode === 'months' && (
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-rose-700 uppercase tracking-wider">
              Select Month
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {MONTH_SHORT.map((mShort, idx) => {
                const isSelected = viewMonth === idx;
                return (
                  <button
                    key={mShort}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setPickerMode('days');
                    }}
                    className={`py-3 rounded-2xl text-xs font-bold uppercase transition-all border-2 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                        : 'bg-pink-50 text-rose-900 border-pink-200 hover:bg-pink-100'
                    }`}
                  >
                    {mShort}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. YEARS GRID VIEW */}
        {pickerMode === 'years' && (
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-rose-700 uppercase tracking-wider">
              Select Year
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {years.map(y => {
                const isSelected = viewYear === y;
                const isDisabled = y > currentYear;
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setViewYear(y);
                      setPickerMode('days');
                    }}
                    className={`py-2.5 rounded-2xl text-xs font-black transition-all border-2 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                        : isDisabled
                        ? 'text-pink-300 bg-pink-50/40 cursor-not-allowed opacity-50'
                        : 'bg-pink-50 text-rose-900 border-pink-200 hover:bg-pink-100 hover:text-rose-950'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Shortcut */}
        <div className="flex items-center justify-between pt-2 text-xs font-bold uppercase border-t border-pink-100">
          <button
            type="button"
            onClick={() => {
              setViewYear(currentYear);
              setViewMonth(new Date().getMonth());
              setPickerMode('days');
              handleDayClick(new Date().getDate());
            }}
            disabled={maxDate && todayStr > maxDate}
            className="text-rose-700 hover:text-rose-950 transition-colors cursor-pointer font-extrabold flex items-center gap-1"
          >
            <FaThLarge className="w-3 h-3" />
            <span>Select Today</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="text-rose-800 hover:bg-pink-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
