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
        setErrorMsg('Failed to generate export file.');
      }
    } catch (err) {
      console.error('Export error:', err);
      setErrorMsg(err.message || 'Error occurred during export generation.');
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      ext: '.pdf',
      desc: `Clean printable PDF report with formatted table & total breakdown`,
      icon: FaFilePdf,
      color: 'text-rose-600 bg-pink-50 border-pink-200 hover:border-pink-400'
    },
    {
      id: 'csv',
      name: 'CSV Spreadsheet',
      ext: '.csv',
      desc: 'Raw comma-separated data compatible with Excel, Google Sheets & Numbers',
      icon: FaFileCsv,
      color: 'text-rose-600 bg-pink-50 border-pink-200 hover:border-pink-400'
    },
    {
      id: 'docx',
      name: 'Word Document',
      ext: '.docx',
      desc: 'Editable Microsoft Word document with formatted header & table',
      icon: FaFileWord,
      color: 'text-rose-600 bg-pink-50 border-pink-200 hover:border-pink-400'
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="space-y-5 py-1 text-xs font-bold text-rose-900 uppercase">
        {/* Intro */}
        <div className="space-y-1">
          <p className="text-sm font-black text-rose-950">Select Export Format</p>
          <p className="text-xs text-rose-700 font-extrabold normal-case">
            Export {dataList.length} {dataList.length === 1 ? itemLabel : itemLabelPlural} to your preferred file format:
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-pink-50 border-2 border-rose-300 text-xs font-extrabold text-rose-800 flex items-center gap-2 normal-case">
            <FaExclamationTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Format Selection Cards */}
        <div className="grid grid-cols-1 gap-3">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = exportFormat === fmt.id;

            return (
              <div
                key={fmt.id}
                onClick={() => setExportFormat(fmt.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-rose-600 bg-pink-50/70 shadow-xs ring-2 ring-rose-300'
                    : 'border-pink-200 bg-white hover:border-pink-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${fmt.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-rose-950">{fmt.name}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-pink-100 text-rose-700">
                        {fmt.ext}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer border-2 border-pink-300 uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || dataList.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
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
