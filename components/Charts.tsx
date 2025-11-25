import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/fileHelpers';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#94a3b8'];

export const SpendingByCategory: React.FC<ChartsProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;
    
    expenses.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      totalExpense += t.amount;
    });

    // Convert to array and sort
    let sortedData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group small categories into "Others" if we have too many
    if (sortedData.length > 6) {
      const topCategories = sortedData.slice(0, 5);
      const otherCategories = sortedData.slice(5);
      const otherTotal = otherCategories.reduce((sum, item) => sum + item.value, 0);
      
      sortedData = [
        ...topCategories,
        { name: 'Others', value: otherTotal }
      ];
    }

    return sortedData;
  }, [transactions]);

  if (data.length === 0) {
    return (
        <div className="h-80 w-full flex items-center justify-center text-slate-400 text-sm">
            No expense data available
        </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Spent']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle" 
            wrapperStyle={{ fontSize: '12px', maxWidth: '120px' }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DailySpending: React.FC<ChartsProps> = ({ transactions }) => {
  const { data, viewType } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    
    if (expenses.length === 0) return { data: [], viewType: 'Daily' };

    // Find date range
    const dates = expenses.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
    if (dates.length === 0) return { data: [], viewType: 'Daily' };

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dayDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // If range > 60 days, aggregate by Month
    const isLongRange = dayDiff > 60;

    const timeMap: Record<string, number> = {};
    
    expenses.forEach(t => {
        try {
            const d = new Date(t.date);
            if (isNaN(d.getTime())) return;

            let key: string;
            if (isLongRange) {
                // YYYY-MM
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else {
                // MM-DD (or YYYY-MM-DD for sorting, but simplified for display)
                // storing as ISO for sorting
                key = t.date.substring(0, 10); 
            }
            
            timeMap[key] = (timeMap[key] || 0) + t.amount;
        } catch (e) {}
    });

    const chartData = Object.entries(timeMap)
      .map(([dateKey, amount]) => ({ 
          dateKey, 
          amount,
          // Format label for display
          displayLabel: isLongRange 
            ? new Date(dateKey + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })
            : new Date(dateKey).toLocaleString('default', { day: 'numeric', month: 'short' })
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return { data: chartData, viewType: isLongRange ? 'Monthly' : 'Daily' };
  }, [transactions]);

  if (data.length === 0) {
    return (
        <div className="h-80 w-full flex items-center justify-center text-slate-400 text-sm">
            No expense data available
        </div>
    );
  }

  return (
    <div className="h-80 w-full relative">
       <div className="absolute top-[-20px] right-0 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
          View: {viewType}
       </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="displayLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#64748b', fontSize: 11}}
            dy={10}
            interval={data.length > 10 ? 'preserveStartEnd' : 0} // Avoid crowding labels
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#64748b', fontSize: 11}}
            tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            width={45}
          />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="amount" 
            fill="#6366f1" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50} // Prevent overly thick bars in monthly view
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
