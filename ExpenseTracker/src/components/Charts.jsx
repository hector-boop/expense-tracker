import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, CATEGORY_COLORS } from '../utils/formatters';
import { Loader } from './Loader';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-2xl border-2 border-pink-300 shadow-lg text-xs">
        <p className="font-bold text-rose-900 mb-1">{label || payload[0].name}</p>
        <p className="font-black text-rose-700">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const Charts = ({ expenses = [], isLoading = false }) => {
  const textColor = '#880e4f';
  const gridColor = '#f8bbd0';

  if (isLoading) {
    return (
      <div className="space-y-6 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Pie Chart Skeleton */}
          <div className="clean-pink-card p-6 h-[380px] flex flex-col justify-between bg-white">
            <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
              Breakdown of Expenses
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-44 h-44 rounded-full border-[14px] border-pink-200/60 bg-pink-50/40 animate-pulse flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-pink-100/50" />
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-3.5 rounded bg-pink-100 animate-pulse" />
                <div className="w-16 h-3.5 rounded bg-pink-100 animate-pulse" />
                <div className="w-16 h-3.5 rounded bg-pink-100 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Monthly Spending Bar Chart Skeleton */}
          <div className="clean-pink-card p-6 h-[380px] flex flex-col justify-between bg-white">
            <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
              Monthly Spending
            </h3>
            <div className="flex-1 flex items-end justify-around pb-6 px-4 gap-3">
              <div className="w-10 h-28 rounded-t-xl bg-pink-200/50 animate-pulse" />
              <div className="w-10 h-44 rounded-t-xl bg-pink-200/70 animate-pulse" />
              <div className="w-10 h-32 rounded-t-xl bg-pink-200/50 animate-pulse" />
              <div className="w-10 h-52 rounded-t-xl bg-pink-200/80 animate-pulse" />
              <div className="w-10 h-36 rounded-t-xl bg-pink-200/60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Daily Expenses Area Chart Skeleton */}
        <div className="clean-pink-card p-6 h-[348px] flex flex-col justify-between bg-white">
          <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
            Daily Expenses Timeline
          </h3>
          <div className="flex-1 w-full rounded-2xl bg-gradient-to-t from-pink-100/60 via-pink-50/30 to-transparent border border-pink-100/50 animate-pulse flex items-center justify-center">
            <div className="w-3/4 h-0.5 bg-pink-300/40 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 1. Category Pie Chart Data
  const categoryMap = {};
  expenses.forEach(item => {
    const cat = item.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.amount) || 0);
  });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  // 2. Monthly Spending Bar Chart Data (Last 6 Months)
  const monthlyMap = {};
  expenses.forEach(item => {
    if (!item.expense_date) return;
    const date = new Date(item.expense_date);
    if (isNaN(date.getTime())) return;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + (Number(item.amount) || 0);
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const barData = sortedMonths.slice(-6).map(key => {
    const [year, month] = key.split('-');
    const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('default', { month: 'short' });
    return {
      month: `${monthName} ${year.slice(2)}`,
      amount: Number(monthlyMap[key].toFixed(2)),
    };
  });

  // 3. Daily Spending Area Line Chart Data (Last 14 Days)
  const dailyMap = {};
  expenses.forEach(item => {
    if (!item.expense_date) return;
    dailyMap[item.expense_date] = (dailyMap[item.expense_date] || 0) + (Number(item.amount) || 0);
  });

  const sortedDays = Object.keys(dailyMap).sort();
  const lineData = sortedDays.slice(-14).map(dateStr => {
    const d = new Date(dateStr);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      date: label,
      fullDate: dateStr,
      amount: Number(dailyMap[dateStr].toFixed(2)),
    };
  });

  return (
    <div className="space-y-6 animate-content-fade">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <div className="clean-pink-card p-6 bg-white">
          <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
            Breakdown of Expenses
          </h3>
          {pieData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => {
                      const hex = CATEGORY_COLORS[entry.name]?.hex || '#e91e63';
                      return <Cell key={`cell-${index}`} fill={hex} stroke="#ffffff" strokeWidth={2} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-rose-900 font-bold uppercase">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-rose-700 font-bold uppercase">
              No category data available
            </div>
          )}
        </div>

        {/* Monthly Spending Trend (Bar Chart) */}
        <div className="clean-pink-card p-6 bg-white">
          <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
            Monthly Spending
          </h3>
          {barData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} fontWeight="bold" />
                  <YAxis stroke={textColor} fontSize={11} tickLine={false} fontWeight="bold" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#d81b60" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-rose-700 font-bold uppercase">
              No monthly data available
            </div>
          )}
        </div>
      </div>

      {/* Daily Expenses Line/Area Chart */}
      <div className="clean-pink-card p-6 bg-white">
        <h3 className="text-2xl font-bold text-rose-900 mb-4 font-cursive">
          Daily Expenses Timeline
        </h3>
        {lineData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f8bbd0" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#fce4ec" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} fontWeight="bold" />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} fontWeight="bold" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#d81b60"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPink)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-rose-700 font-bold uppercase">
            No daily transaction data available
          </div>
        )}
      </div>
    </div>
  );
};
