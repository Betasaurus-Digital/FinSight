import React from 'react';
import { FinancialAnalysis } from '../types';
import { SpendingByCategory, DailySpending } from './Charts';
import { TransactionList } from './TransactionList';
import { FeesAnalysis } from './FeesAnalysis';
import { formatCurrency } from '../utils/fileHelpers';

interface DashboardProps {
  data: FinancialAnalysis;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onBack }) => {
  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900">
              {data.statementPeriod ? `${data.statementPeriod} Overview` : 'Financial Overview'}
            </h2>
          </div>
          <p className="text-slate-500">Analysis of your uploaded statement</p>
        </div>
        <button 
          onClick={onBack}
          className="hidden md:flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Back to Home
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Income</p>
          <p className="mt-2 text-3xl font-bold text-emerald-500">{formatCurrency(data.summary.totalIncome)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{formatCurrency(data.summary.totalExpense)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Net Flow</p>
          <p className={`mt-2 text-3xl font-bold ${data.summary.netSavings >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
            {data.summary.netSavings >= 0 ? '+' : ''}{formatCurrency(data.summary.netSavings)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Top Category</p>
          <p className="mt-2 text-xl font-bold text-slate-800 truncate" title={data.summary.topExpenseCategory}>
            {data.summary.topExpenseCategory}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Charts & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Spending by Category</h3>
              <SpendingByCategory transactions={data.transactions} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Spending Trend</h3>
              <DailySpending transactions={data.transactions} />
            </div>
          </div>
          
          {/* Transaction List */}
          <TransactionList transactions={data.transactions} />
        </div>

        {/* Right Column - Insights & Fees */}
        <div className="space-y-8">
          
          {/* Fees & Charges Module (New) */}
          <div className="h-auto">
             <FeesAnalysis transactions={data.transactions} />
          </div>

          {/* Scope for Reduction */}
          <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
             {/* Decorative background element */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-700 rounded-full blur-3xl opacity-50"></div>
             
             <h3 className="text-xl font-bold mb-6 relative z-10">Scope for Reduction</h3>
             
             <div className="space-y-6 relative z-10">
               {data.savingsOpportunities.map((opp, idx) => (
                 <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-semibold text-indigo-100">{opp.title}</h4>
                     <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                       opp.impact === 'HIGH' ? 'bg-emerald-500/20 text-emerald-300' :
                       opp.impact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                       'bg-slate-500/20 text-slate-300'
                     }`}>
                       {opp.impact} Impact
                     </span>
                   </div>
                   <p className="text-sm text-indigo-200 mb-3">{opp.description}</p>
                   <div className="text-2xl font-bold text-white">
                     ~{formatCurrency(opp.estimatedMonthlySavings)}<span className="text-xs font-normal text-indigo-300 ml-1">/mo saved</span>
                   </div>
                 </div>
               ))}
               
               {data.savingsOpportunities.length === 0 && (
                 <p className="text-indigo-200">Great job! No obvious wasteful spending detected.</p>
               )}
             </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Insights
            </h3>
            <ul className="space-y-4">
              {data.spendingHabits.map((habit, idx) => (
                <li key={idx} className="flex items-start text-sm text-slate-600">
                  <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-indigo-400 rounded-full flex-shrink-0"></span>
                  {habit}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};