import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/fileHelpers';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface FeesAnalysisProps {
  transactions: Transaction[];
}

const FEE_CATEGORIES = [
  "Late Payment Fee",
  "Interest Charge",
  "Forex Fee",
  "Annual/Renewal Fee",
  "Service Charge",
  "Tax/GST",
  "Overlimit Fee"
];

const AVOIDABLE_FEES = ["Late Payment Fee", "Interest Charge", "Overlimit Fee"];

export const FeesAnalysis: React.FC<FeesAnalysisProps> = ({ transactions }) => {
  const { 
    totalFees, 
    avoidableTotal, 
    feeBreakdown, 
    feePercentage,
    hasFees 
  } = useMemo(() => {
    // Safety check: ensure transactions is an array
    if (!Array.isArray(transactions)) {
        return { totalFees: 0, avoidableTotal: 0, feeBreakdown: [], feePercentage: 0, hasFees: false };
    }

    const feeTransactions = transactions.filter(t => {
      // Strict safety checks
      if (!t || t.type !== TransactionType.EXPENSE) return false;
      
      // Ensure category is a string before processing
      if (!t.category || typeof t.category !== 'string') return false;
      
      const cat = t.category.toLowerCase();
      
      return (
        FEE_CATEGORIES.includes(t.category) || 
        cat.includes('fee') || 
        cat.includes('tax') ||
        cat.includes('interest') ||
        cat.includes('charge')
      );
    });

    const totalExpense = transactions
      .filter(t => t && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

    const breakdown: Record<string, number> = {};
    let total = 0;
    let avoidable = 0;

    feeTransactions.forEach(t => {
      total += t.amount;
      const cat = t.category || 'Uncategorized Fee';
      breakdown[cat] = (breakdown[cat] || 0) + t.amount;

      // Safe string conversion
      const catLower = String(cat).toLowerCase();
      
      if (AVOIDABLE_FEES.includes(cat) || 
          catLower.includes('late') || 
          catLower.includes('interest')) {
        avoidable += t.amount;
      }
    });

    const feePercentage = totalExpense > 0 ? (total / totalExpense) * 100 : 0;

    // Format for chart
    const chartData = Object.entries(breakdown).map(([name, value]) => ({ name, value }));

    return {
      totalFees: total,
      avoidableTotal: avoidable,
      feeBreakdown: chartData,
      feePercentage,
      hasFees: feeTransactions.length > 0
    };
  }, [transactions]);

  if (!hasFees) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center h-full">
         <div className="text-center">
            <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Clean Sheet!</h3>
            <p className="text-slate-500 text-sm">No extra charges, fees, or penalties detected in this period.</p>
         </div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981', '#64748b'];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
           <span className="bg-rose-100 text-rose-600 p-1 rounded">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </span>
           Charges & Fees Analysis
        </h3>
        <div className="text-right">
           <span className="block text-xs text-slate-400 font-medium uppercase">Total Fees</span>
           <span className="text-xl font-bold text-slate-800">{formatCurrency(totalFees)}</span>
        </div>
      </div>

      {/* Top Warning if High Avoidable Fees */}
      {avoidableTotal > 0 && (
         <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
               <p className="text-sm font-bold text-rose-700">Avoidable Charges Detected</p>
               <p className="text-xs text-rose-600 mt-1">
                  You spent <span className="font-bold">{formatCurrency(avoidableTotal)}</span> on late fees or interest. Paying bills on time could save this amount.
               </p>
            </div>
         </div>
      )}

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
         {/* Chart */}
         <div className="h-40 sm:h-auto relative">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                     data={feeBreakdown}
                     cx="50%"
                     cy="50%"
                     innerRadius={40}
                     outerRadius={60}
                     paddingAngle={5}
                     dataKey="value"
                  >
                     {feeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number) => [formatCurrency(value), 'Amount']}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
               </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                  <span className="text-xs text-slate-400 font-medium">Of Spend</span>
                  <div className="text-lg font-bold text-slate-700">{feePercentage.toFixed(1)}%</div>
               </div>
            </div>
         </div>

         {/* Legend List */}
         <div className="flex flex-col justify-center space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
            {feeBreakdown.sort((a,b) => b.value - a.value).map((item, idx) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                     <span className="text-slate-600 truncate max-w-[100px]" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(item.value)}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};