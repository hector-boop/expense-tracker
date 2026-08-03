import { useState } from 'react';
import { Modal } from './Modal';
import { FaFilePdf, FaFileCsv, FaFileWord, FaDownload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { 
  exportToPDF, 
  exportToCSV, 
  exportToDOCX, 
  exportDebtsToPDF, 
  exportDebtsToCSV, 
  exportDebtsToDOCX 
} from '../utils/exportUtils';

export const ExportModal = ({ 
  isOpen, 
  onClose, 
  expenses, 
  debts, 
  dataType = 'expenses', 
  defaultTitle, 
  modalTitle 
}) => {
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv' | 'docx'
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isDebts = dataType === 'debts';
  const dataList = isDebts ? (debts || []) : (expenses || []);
  const titleText = modalTitle || (isDebts ? 'Export Debt Data' : 'Export Expenses Data');
  const reportHeader = defaultTitle || (isDebts ? 'Debt Manager Summary Report' : 'Expense Tracker Report');
  const itemLabel = isDebts ? 'debt record' : 'expense entry';
  const itemLabelPlural = isDebts ? 'debt records' : 'expense entries';

  const handleExport = async () => {
    if (!dataList || dataList.length === 0) {
      setErrorMsg(`No ${itemLabelPlural} available to export. Add some entries first!`);
      return;
    }

    setErrorMsg('');
    setIsExporting(true);

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      let success = false;

      if (isDebts) {
        if (exportFormat === 'pdf') {
          success = exportDebtsToPDF(dataList, `debt_tracker_${dateStr}.pdf`, reportHeader);
        } else if (exportFormat === 'csv') {
          success = exportDebtsToCSV(dataList, `debt_tracker_${dateStr}.csv`);
        } else if (exportFormat === 'docx') {
          success = await exportDebtsToDOCX(dataList, `debt_tracker_${dateStr}.docx`, reportHeader);
        }
      } else {
        if (exportFormat === 'pdf') {
          success = exportToPDF(dataList, `expense_tracker_${dateStr}.pdf`, reportHeader);
        } else if (exportFormat === 'csv') {
          success = exportToCSV(dataList, `expense_tracker_${dateStr}.csv`);
        } else if (exportFormat === 'docx') {
          success = await exportToDOCX(dataList, `expense_tracker_${dateStr}.docx`, reportHeader);
        }
      }

      if (success) {
        onClose();
      } else {
        setErrorMsg('Failed to generate export file. Please try again.');
      }
    } catch (err) {
      console.error('Export error:', err);
      setErrorMsg(err.message || 'Error occurred during export generation');
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'pdf',
      title: 'PDF Document (.pdf)',
      desc: 'Formated printable document layout with headers & summary table.',
      icon: FaFilePdf,
      iconColor: 'text-rose-600',
    },
    {
      id: 'csv',
      title: 'CSV Spreadsheet (.csv)',
      desc: 'Raw structured data suitable for Excel, Google Sheets, or data analysis.',
      icon: FaFileCsv,
      iconColor: 'text-emerald-600',
    },
    {
      id: 'docx',
      title: 'Word Document (.docx)',
      desc: 'Editable Microsoft Word document formatted with clean tables.',
      icon: FaFileWord,
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="flex flex-col flex-1 min-h-0 text-xs font-bold uppercase overflow-hidden -m-6">
        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
            Select export format to download your {dataList.length} logged {dataList.length === 1 ? itemLabel : itemLabelPlural}.
          </p>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-shake">
              <FaExclamationTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Format selection cards */}
          <div className="space-y-3">
            {formats.map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = exportFormat === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-rose-600 bg-pink-50/80 shadow-xs'
                      : 'border-pink-200 bg-white hover:border-pink-300 hover:bg-pink-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-white border border-pink-200 flex items-center justify-center shrink-0 shadow-xs ${fmt.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-rose-950 truncate">
                          {fmt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 font-semibold normal-case mt-0.5 leading-snug">
                        {fmt.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-pink-300 bg-white'
                      }`}
                    >
                      {isSelected && <FaCheckCircle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Sticky Bottom Footer Bar */}
        <div className="px-6 py-3.5 bg-pink-50/50 border-t border-pink-100 flex items-center justify-end gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer border-2 border-pink-300 uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || dataList.length === 0}
            className="px-6 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating {exportFormat.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <FaDownload className="w-3.5 h-3.5" />
                <span>Download {exportFormat.toUpperCase()} File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
