import { useState, useEffect } from 'react';

export const Loader = ({ message = 'Loading Tracker...' }) => {
  return (
    <div className="w-full clean-pink-card bg-white p-6 select-none space-y-4">
      {/* Standardized Pink Pulse Skeleton Header matching Dashboard & Expense Table */}
      <div className="flex items-center justify-between pb-4 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100/80 animate-pulse shrink-0" />
          <div className="space-y-2">
            <div className="w-44 h-4 rounded-md bg-pink-100/80 animate-pulse" />
            <div className="w-28 h-3 rounded-md bg-pink-50 animate-pulse" />
          </div>
        </div>
        <div className="w-24 h-6 rounded-xl bg-pink-100/60 animate-pulse shrink-0" />
      </div>

      {/* Grid of Skeleton Cards to match full table or card grid width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded-md bg-pink-100/80 animate-pulse" />
              <div className="w-14 h-4 rounded-full bg-pink-200/60 animate-pulse" />
            </div>
            <div className="w-36 h-7 rounded-xl bg-pink-200/70 animate-pulse" />
            <div className="w-full h-2.5 rounded-full bg-pink-200/50 animate-pulse" />
            <div className="flex justify-between pt-1">
              <div className="w-16 h-3 rounded bg-pink-100/80 animate-pulse" />
              <div className="w-16 h-3 rounded bg-pink-100/80 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className="pt-3 flex items-center justify-center gap-2 border-t border-pink-100">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
          <p className="text-xs font-black uppercase tracking-wider text-rose-900 animate-pulse">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export const LoadingWrapper = ({ isLoading, message, children, minHeight = "min-h-[220px]" }) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setIsFadingOut(false);
    } else if (showLoader) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShowLoader(false);
        setIsFadingOut(false);
      }, 200); // 200ms smooth fade-out
      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoader]);

  if (showLoader) {
    return (
      <div className={`transition-opacity duration-200 ease-out w-full flex items-center justify-center ${minHeight} ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Loader message={message} />
      </div>
    );
  }

  return (
    <div className="animate-content-fade w-full">
      {children}
    </div>
  );
};

export default Loader;
