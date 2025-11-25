import React from 'react';
import { SavedReport } from '../types';
import { formatCurrency, formatDate } from '../utils/fileHelpers';

interface HistoryListProps {
  reports: SavedReport[];
  onSelect: (report: SavedReport) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ reports, onSelect, onDelete }) => {
  if (reports.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-16 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-slate-800">Recent Analysis History</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id}
            onClick={() => onSelect(report)}
            className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                {report.data.statementPeriod || 'Statement'}
              </div>
              <button
                onClick={(e) => onDelete(report.id, e)}
                className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-rose-50"
                title="Delete report"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <h3 className="font-semibold text-slate-800 mb-1 truncate" title={report.fileName}>
              {report.fileName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Analyzed {formatDate(report.analysisDate)}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Income</p>
                <p className="text-emerald-600 font-bold text-sm">
                  {formatCurrency(report.data.summary.totalIncome)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Expense</p>
                <p className="text-slate-700 font-bold text-sm">
                  {formatCurrency(report.data.summary.totalExpense)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};