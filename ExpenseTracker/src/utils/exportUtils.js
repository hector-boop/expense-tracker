import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export expenses to CSV file
 */
export const exportToCSV = (expenses, filename = 'expense_tracker_export.csv') => {
  if (!expenses || expenses.length === 0) return false;

  const headers = ['Title', 'Category', 'Amount (PHP)', 'Payment Method', 'Date', 'Notes'];
  const rows = expenses.map(exp => [
    `"${(exp.title || '').replace(/"/g, '""')}"`,
    `"${(exp.category || '').replace(/"/g, '""')}"`,
    `"${Number(exp.amount || 0).toFixed(2)}"`,
    `"${(exp.payment_method || 'Cash').replace(/"/g, '""')}"`,
    `"${exp.expense_date || ''}"`,
    `"${(exp.notes || '').replace(/"/g, '""')}"`
  ]);

  // UTF-8 BOM (\uFEFF) for Excel compatibility with currency symbols
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
  return true;
};

/**
 * Export expenses to PDF file
 */
export const exportToPDF = (expenses, filename = 'expense_tracker_report.pdf', title = 'Expense Tracker Report') => {
  if (!expenses || expenses.length === 0) return false;

  const doc = new jsPDF();

  // Header Title & Date
  doc.setFontSize(18);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 14, 27);

  // Total summary
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Entries: ${expenses.length}  |  Total Expenses: PHP ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, 34);

  // Table columns & rows
  const tableColumn = ['#', 'Title', 'Category', 'Amount (PHP)', 'Payment', 'Date'];
  const tableRows = expenses.map((exp, index) => [
    index + 1,
    exp.title || 'Untitled',
    exp.category || 'Uncategorized',
    `PHP ${Number(exp.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    exp.payment_method || 'Cash',
    exp.expense_date || ''
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242]
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  doc.save(filename);
  return true;
};

/**
 * Export expenses to DOCX file
 */
export const exportToDOCX = async (expenses, filename = 'expense_tracker_report.docx', title = 'Expense Tracker Report') => {
  if (!expenses || expenses.length === 0) return false;

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const tableHeaderRow = new TableRow({
    children: ['#', 'Title', 'Category', 'Amount (PHP)', 'Payment', 'Date'].map(headerText => (
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: headerText, bold: true, color: 'FFFFFF', size: 20 })],
          alignment: AlignmentType.CENTER
        })],
        shading: { fill: 'E11D48' },
        width: { size: 16, type: WidthType.PERCENTAGE }
      })
    ))
  });

  const tableDataRows = expenses.map((exp, index) => (
    new TableRow({
      children: [
        (index + 1).toString(),
        exp.title || 'Untitled',
        exp.category || 'Uncategorized',
        `PHP ${Number(exp.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        exp.payment_method || 'Cash',
        exp.expense_date || ''
      ].map((cellText, cellIdx) => (
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cellText, size: 18 })],
            alignment: cellIdx === 3 ? AlignmentType.RIGHT : AlignmentType.LEFT
          })],
          shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'FFF1F2' }
        })
      ))
    })
  ));

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true, size: 36, color: 'E11D48' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}  |  Total Entries: ${expenses.length}  |  Total: PHP ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              bold: true,
              size: 20,
              color: '475569'
            })
          ],
          spacing: { after: 300 }
        }),
        new Table({
          rows: [tableHeaderRow, ...tableDataRows],
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
  return true;
};

// ============================================================
// DEBTS EXPORT FUNCTIONS
// ============================================================

/**
 * Export debts to CSV file
 */
export const exportDebtsToCSV = (debts, filename = 'debt_tracker_export.csv') => {
  if (!debts || debts.length === 0) return false;

  const headers = ['Person', 'Title / Reason', 'Type', 'Total Amount (PHP)', 'Amount Paid (PHP)', 'Remaining Balance (PHP)', 'Status', 'Due Date', 'Notes'];
  const rows = debts.map(d => {
    const total = Number(d.amount || 0);
    const paid = Number(d.amount_paid || 0);
    const remaining = Math.max(0, total - paid);
    const typeLabel = d.type === 'i_owe' ? 'I Owe (Payable)' : 'Owed to Me (Receivable)';
    const statusLabel = d.status === 'settled' ? 'Settled' : d.status === 'partially_paid' ? 'Partially Paid' : 'Unpaid';

    return [
      `"${(d.person || '').replace(/"/g, '""')}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${typeLabel}"`,
      `"${total.toFixed(2)}"`,
      `"${paid.toFixed(2)}"`,
      `"${remaining.toFixed(2)}"`,
      `"${statusLabel}"`,
      `"${d.due_date || ''}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
  return true;
};

/**
 * Export debts to PDF file
 */
export const exportDebtsToPDF = (debts, filename = 'debt_tracker_report.pdf', title = 'Debt Manager Summary Report') => {
  if (!debts || debts.length === 0) return false;

  const doc = new jsPDF({ orientation: 'landscape' });

  // Header Title & Date
  doc.setFontSize(18);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text(title, 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 14, 24);

  // Totals
  let totalIOwe = 0;
  let totalOwedToMe = 0;
  debts.forEach(d => {
    const rem = Math.max(0, Number(d.amount || 0) - Number(d.amount_paid || 0));
    if (d.type === 'i_owe') totalIOwe += rem;
    else totalOwedToMe += rem;
  });

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Total Entries: ${debts.length}  |  Total Money You Owe: PHP ${totalIOwe.toLocaleString('en-US', { minimumFractionDigits: 2 })}  |  Total Money You're Owed: PHP ${totalOwedToMe.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    14,
    30
  );

  const tableColumn = ['#', 'Person', 'Reason / Title', 'Type', 'Total (PHP)', 'Paid (PHP)', 'Remaining (PHP)', 'Status', 'Due Date'];
  const tableRows = debts.map((d, index) => {
    const total = Number(d.amount || 0);
    const paid = Number(d.amount_paid || 0);
    const remaining = Math.max(0, total - paid);
    const typeLabel = d.type === 'i_owe' ? 'I Owe' : 'Owed to Me';
    const statusLabel = d.status === 'settled' ? 'Settled' : d.status === 'partially_paid' ? 'Partially Paid' : 'Unpaid';

    return [
      index + 1,
      d.person || 'Unknown',
      d.title || '-',
      typeLabel,
      `PHP ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `PHP ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `PHP ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      statusLabel,
      d.due_date || '-'
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242]
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    }
  });

  doc.save(filename);
  return true;
};

/**
 * Export debts to DOCX file
 */
export const exportDebtsToDOCX = async (debts, filename = 'debt_tracker_report.docx', title = 'Debt Manager Summary Report') => {
  if (!debts || debts.length === 0) return false;

  let totalIOwe = 0;
  let totalOwedToMe = 0;
  debts.forEach(d => {
    const rem = Math.max(0, Number(d.amount || 0) - Number(d.amount_paid || 0));
    if (d.type === 'i_owe') totalIOwe += rem;
    else totalOwedToMe += rem;
  });

  const tableHeaderRow = new TableRow({
    children: ['#', 'Person', 'Reason / Title', 'Type', 'Total (PHP)', 'Paid (PHP)', 'Remaining (PHP)', 'Status', 'Due Date'].map(headerText => (
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: headerText, bold: true, color: 'FFFFFF', size: 18 })],
          alignment: AlignmentType.CENTER
        })],
        shading: { fill: 'E11D48' },
        width: { size: 11, type: WidthType.PERCENTAGE }
      })
    ))
  });

  const tableDataRows = debts.map((d, index) => {
    const total = Number(d.amount || 0);
    const paid = Number(d.amount_paid || 0);
    const remaining = Math.max(0, total - paid);
    const typeLabel = d.type === 'i_owe' ? 'I Owe' : 'Owed to Me';
    const statusLabel = d.status === 'settled' ? 'Settled' : d.status === 'partially_paid' ? 'Partially Paid' : 'Unpaid';

    return new TableRow({
      children: [
        (index + 1).toString(),
        d.person || 'Unknown',
        d.title || '-',
        typeLabel,
        `PHP ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `PHP ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `PHP ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        statusLabel,
        d.due_date || '-'
      ].map((cellText, cellIdx) => (
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cellText, size: 16 })],
            alignment: [4, 5, 6].includes(cellIdx) ? AlignmentType.RIGHT : AlignmentType.LEFT
          })],
          shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'FFF1F2' }
        })
      ))
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true, size: 32, color: 'E11D48' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}  |  Total Entries: ${debts.length}  |  Total You Owe: PHP ${totalIOwe.toLocaleString('en-US', { minimumFractionDigits: 2 })}  |  Total You're Owed: PHP ${totalOwedToMe.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              bold: true,
              size: 18,
              color: '475569'
            })
          ],
          spacing: { after: 250 }
        }),
        new Table({
          rows: [tableHeaderRow, ...tableDataRows],
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
  return true;
};
