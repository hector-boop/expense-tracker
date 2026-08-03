import { FaBars, FaPlus, FaTable, FaQuestionCircle, FaDownload } from 'react-icons/fa';

export const Navbar = ({ onToggleSidebar, onOpenAddModal, onOpenTour, onOpenExport, title = 'Dashboard' }) => {
  return (
    <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-pink-200/80 px-4 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-rose-700 hover:bg-pink-100 focus:outline-hidden"
          aria-label="Open sidebar menu"
        >
          <FaBars className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FaTable className="w-4 h-4 text-rose-700 hidden sm:block" />
          <h2 className="text-2xl font-bold text-rose-900 tracking-wide font-cursive">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-800 bg-pink-50 hover:bg-pink-100 border-2 border-pink-300 rounded-2xl transition-colors cursor-pointer"
            title="Take interactive user tutorial"
          >
            <FaQuestionCircle className="w-4 h-4 text-rose-700" />
            <span className="hidden md:inline uppercase">Take Tour</span>
          </button>
        )}

        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 border-2 border-rose-700 rounded-2xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Export expenses to PDF, CSV, or DOCX"
          >
            <FaDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase">Export</span>
          </button>
        )}

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border-2 border-rose-700 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        )}
      </div>
    </header>
  );
};
