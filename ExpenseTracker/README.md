# 💖 Expense Tracker & Financial Dashboard

A modern, full-featured web application for managing personal finances, tracking spreadsheet expenses, monitoring debts/receivables, managing recurring bills, and exporting comprehensive financial reports. Built with a clean pink aesthetic, dynamic micro-animations, and full cloud synchronization powered by **Supabase**.

---

## ✨ Features Overview

### 📊 1. Interactive Dashboard
- **Real-Time Financial Metrics**: Instant breakdown of total expenses, monthly spend, daily expenditure, and transaction count.
- **Visual Analytics & Charts**: Interactive spend breakdown by category and timeline charts powered by **Recharts**.
- **Recent Spreadsheet Entries**: Quick preview of recent logged expenses with search and navigation shortcuts.

### 💸 2. Expense Tracker Spreadsheet
- **Complete CRUD Operations**: Create, view, update, delete, and bulk-delete logged expense entries.
- **Categorization & Payment Methods**: Organize expenses by custom or default categories (Food, Transportation, Bills, Health, etc.) and payment types.
- **Receipt Photo Attachment & Storage**: Compress and attach receipt images directly to expenses with instant lightbox photo viewer and cloud storage.
- **Advanced Filtering & Search**: Filter by category, payment method, date range, or keywords.

### 🤝 3. Debt & Credit Manager
- **Payables vs. Receivables**: Separate tracking for *Money I Owe* vs *Money Owed to Me*.
- **Partial & Full Settlement**: Record partial payments with visual progress bars or mark debts as fully settled.
- **Auto-Expense Logging**: Option to automatically log debt payments as real expense spreadsheet entries upon payment.
- **Overdue Detection**: Built-in overdue alerts for overdue debts past their target date.

### 📄 4. Incoming Bills Tracker
- **Upcoming & Recurring Bills**: Track due dates for utility bills, subscriptions, and payables.
- **Status Indicators**: Visual badges for *Due Today*, *Overdue*, *Upcoming*, and *Paid*.
- **One-Click Pay**: Marking a bill as paid automatically creates a corresponding entry in your main expense spreadsheet.

### ☁️ 5. Supabase Cloud Sync & Storage
- **Authentication**: User registration and login powered by Supabase Auth with Row Level Security (RLS).
- **PostgreSQL Database**: Real-time sync for `expenses`, `incoming_bills`, and `debts`.
- **Supabase Storage**: Dedicated `expense-photos` storage bucket for uploaded receipt images.
- **Offline & Demo Fallback**: Seamless fallback to user-isolated `localStorage` for demo accounts or offline mode.

### 📥 6. Multi-Format Data Reports & Export
- **Export Formats**: Generate downloadable financial summary reports in **PDF**, **CSV**, and **DOCX** formats.
- **Custom Date Ranges & Data Selection**: Filter exactly what data to export into clean report layouts.

### 🐥 7. Interactive Wandering Duck Pet
- A cute interactive desktop pet widget that wanders around your dashboard with quack animations, floating bubbles, and togglable states!

---

## 🛠️ Technology Stack

| Technology | Usage |
|---|---|
| **React 18** | Core UI component framework |
| **Vite** | Blazing-fast development server & bundle build tool |
| **Tailwind CSS** | Styling, custom utility classes & responsive layouts |
| **Supabase** | PostgreSQL Database, Auth, Row Level Security & Storage |
| **Recharts** | Interactive spend breakdown & financial analytical charts |
| **React Icons** | Icon library (`react-icons/fa`) |
| **jspdf & html2canvas** | Client-side PDF export generation |
| **xlsx & docx** | Spreadsheet CSV and Word document report generation |

---

## 📁 Project Structure

```text
ExpenseTracker/
├── public/                # Static assets & favicon
├── src/
│   ├── assets/            # Static images & graphics
│   ├── components/        # Reusable UI components & modals
│   │   ├── ExpenseForm.jsx
│   │   ├── ExpenseTable.jsx
│   │   ├── IncomingBillsSection.jsx
│   │   ├── DebtFormModal.jsx
│   │   ├── PhotoViewerModal.jsx
│   │   ├── Loader.jsx
│   │   └── WanderingDuck.jsx
│   ├── context/           # React Context (AuthContext & ThemeContext)
│   ├── hooks/             # Custom React Hooks (useAuth, useTheme)
│   ├── layouts/           # DashboardLayout & Sidebar wrappers
│   ├── lib/               # Supabase client setup (`supabase.js`)
│   ├── pages/             # Main application pages
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Debts.jsx
│   │   ├── Settings.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── services/          # API & database services (expense, bill, debt)
│   ├── utils/             # Formatters, export helpers, image compression
│   ├── App.jsx            # Routing & App entry
│   └── main.jsx           # React DOM root render
├── .env                   # Environment variables (git-ignored)
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Node.js** (v18 or higher) installed on your machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hector-boop/expense-tracker.git
   cd expense-tracker/ExpenseTracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of `ExpenseTracker/`:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:5173`.

---

## 💾 Database Schema (Supabase)

If setting up your own Supabase project, execute the following SQL tables:

```sql
-- 1. Expenses Table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT DEFAULT 'Other',
  payment_method TEXT DEFAULT 'Cash',
  expense_date DATE NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Incoming Bills Table
CREATE TABLE public.incoming_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT DEFAULT 'Bills',
  payment_method TEXT DEFAULT 'Cash',
  due_date DATE,
  notes TEXT DEFAULT '',
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Debts Table
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'i_owe',
  person TEXT NOT NULL,
  title TEXT DEFAULT '',
  amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  due_date DATE,
  notes TEXT DEFAULT '',
  category TEXT DEFAULT 'Debts',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS & Storage
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

Crafted with 💖 by **[Hector Boop](https://github.com/hector-boop)**
