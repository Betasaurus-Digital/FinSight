import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/fileHelpers';

interface TransactionListProps {
  transactions: Transaction[];
}

type GroupMode = 'NONE' | 'MONTH' | 'CATEGORY';

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [groupMode, setGroupMode] = useState<GroupMode>('NONE');
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'ASC' | 'DESC' }>({ 
    key: 'date', 
    direction: 'DESC' 
  });

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const months = new Set<string>();
    const years = new Set<string>();

    if (!Array.isArray(transactions)) return { categories: [], months: [], years: [] };

    transactions.forEach(t => {
      if (t && t.category && typeof t.category === 'string') {
          categories.add(t.category);
      }
      try {
        if (t && t.date) {
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) {
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
            years.add(d.getFullYear().toString());
            }
        }
      } catch (e) {}
    });

    return {
      categories: Array.from(categories).sort(),
      months: Array.from(months).sort().reverse(),
      years: Array.from(years).sort().reverse()
    };
  }, [transactions]);

  // Filter and Sort Logic
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter(t => {
      if (!t) return false;

      // 1. Search Text
      const searchLower = (searchTerm || '').toLowerCase();
      // Safely access properties with explicit type checks
      const desc = (t.description && typeof t.description === 'string') ? t.description.toLowerCase() : '';
      const cat = (t.category && typeof t.category === 'string') ? t.category.toLowerCase() : '';
      const acc = (t.accountName && typeof t.accountName === 'string') ? t.accountName.toLowerCase() : '';

      const matchesSearch = 
        desc.includes(searchLower) ||
        cat.includes(searchLower) ||
        acc.includes(searchLower);

      // 2. Type
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
      
      // 3. Category
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      
      // 4. Date (Month & Year)
      let matchesDate = true;
      try {
        if (t.date) {
            const d = new Date(t.date);
            const tMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const tYear = d.getFullYear().toString();

            if (monthFilter !== 'ALL' && tMonth !== monthFilter) matchesDate = false;
            if (yearFilter !== 'ALL' && tYear !== yearFilter) matchesDate = false;
        } else {
            matchesDate = false;
        }
      } catch(e) { matchesDate = false; }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    }).sort((a, b) => {
      // Sort logic
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, monthFilter, yearFilter, sortConfig]);

  // Grouping Logic
  const groupedData = useMemo<Record<string, Transaction[]>>(() => {
    if (groupMode === 'NONE') return { 'All Transactions': filteredTransactions };

    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(t => {
      let key = 'Other';
      if (groupMode === 'MONTH') {
        try {
          if (t.date) {
             const d = new Date(t.date);
             key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          } else {
             key = 'Unknown Date';
          }
        } catch(e) { key = 'Unknown Date'; }
      } else if (groupMode === 'CATEGORY') {
        key = t.category || 'Uncategorized';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupMode === 'MONTH') {
        // approximate sort by date string content
        return new Date(b).getTime() - new Date(a).getTime();
      }
      return a.localeCompare(b);
    });

    const sortedGroups: Record<string, Transaction[]> = {};
    sortedKeys.forEach(k => sortedGroups[k] = groups[k]);
    return sortedGroups;
  }, [filteredTransactions, groupMode]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'DESC' ? 'ASC' : 'DESC'
    }));
  };

  const getMonthLabel = (yyyy_mm: string) => {
    const [y, m] = yyyy_mm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const calculateGroupTotal = (txs: Transaction[]) => {
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[800px] overflow-hidden">
      {/* Filters Header */}
      <div className="p-5 border-b border-slate-100 space-y-4 bg-white z-20">
        {/* Top Row: Title, Search, Group Toggle */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Transactions
              <span className="bg-slate-100 text-slate-500 text-xs py-0.5 px-2 rounded-full font-medium">
                {filteredTransactions.length}
              </span>
            </h3>
            
            {/* Group Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setGroupMode('NONE')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${groupMode === 'NONE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>List</button>
              <button onClick={() => setGroupMode('MONTH')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${groupMode === 'MONTH' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>By Month</button>
              <button onClick={() => setGroupMode('CATEGORY')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${groupMode === 'CATEGORY' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>By Category</button>
            </div>
          </div>
          
          <div className="relative w-full xl:w-64">
            <input
               type="text"
               placeholder="Search..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap gap-3 pt-1">
           {/* Type Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-lg">
             {(['ALL', 'EXPENSE', 'INCOME'] as const).map(f => (
               <button
                 key={f}
                 onClick={() => setTypeFilter(f)}
                 className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                   typeFilter === f 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
               </button>
             ))}
           </div>

           {/* Year Filter */}
           {filterOptions.years.length > 0 && (
             <select 
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <option value="ALL">All Years</option>
              {filterOptions.years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
           )}

           {/* Month Filter */}
           <div className="relative">
             <select 
               value={monthFilter}
               onChange={e => setMonthFilter(e.target.value)}
               className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
             >
               <option value="ALL">All Months</option>
               {filterOptions.months.map(m => (
                 <option key={m} value={m}>{getMonthLabel(m)}</option>
               ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
           </div>

           {/* Category Filter */}
           <div className="relative">
             <select
               value={categoryFilter}
               onChange={e => setCategoryFilter(e.target.value)}
               className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
             >
               <option value="ALL">All Categories</option>
               {filterOptions.categories.map(c => (
                 <option key={c} value={c}>{c}</option>
               ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
           </div>
           
           <button 
             onClick={() => {
               setSearchTerm('');
               setTypeFilter('ALL');
               setYearFilter('ALL');
               setMonthFilter('ALL');
               setCategoryFilter('ALL');
             }}
             className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1.5"
           >
             Clear Filters
           </button>
        </div>
      </div>

      {/* Table Container - Vertical Scroll handled here for sticky headers to work */}
      <div className="overflow-auto flex-1 custom-scrollbar relative bg-white">
        <table className="w-full text-left border-collapse relative">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th onClick={() => handleSort('date')} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group w-32">
                <div className="flex items-center gap-1">
                  Date 
                  <span className={`transition-opacity ${sortConfig.key === 'date' ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover:opacity-50'}`}>
                    {sortConfig.key === 'date' && sortConfig.direction === 'DESC' ? '↓' : '↑'}
                  </span>
                </div>
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th onClick={() => handleSort('category')} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-1">
                  Category
                  <span className={`transition-opacity ${sortConfig.key === 'category' ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover:opacity-50'}`}>
                    {sortConfig.key === 'category' && sortConfig.direction === 'DESC' ? '↓' : '↑'}
                  </span>
                </div>
              </th>
              <th onClick={() => handleSort('amount')} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <span className={`transition-opacity ${sortConfig.key === 'amount' ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover:opacity-50'}`}>
                    {sortConfig.key === 'amount' && sortConfig.direction === 'DESC' ? '↓' : '↑'}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {Object.entries(groupedData).map(([groupName, groupTxs]: [string, Transaction[]]) => {
              const { income, expense } = calculateGroupTotal(groupTxs);
              return (
                <React.Fragment key={groupName}>
                  {groupMode !== 'NONE' && (
                    <tr className="bg-slate-50/80 sticky top-[41px] z-0">
                      <td colSpan={5} className="px-6 py-2 border-b border-slate-200 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                             {groupMode === 'MONTH' ? (
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             ) : (
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                             )}
                             {groupName} 
                             <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{groupTxs.length}</span>
                           </span>
                           <div className="flex gap-4 text-xs">
                             {income > 0 && <span className="text-emerald-600 font-medium">In: {formatCurrency(income)}</span>}
                             <span className="text-slate-600 font-medium">Out: {formatCurrency(expense)}</span>
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {groupTxs.map((t, idx) => (
                    <tr key={`${groupName}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                        {t.date ? formatDate(t.date) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {t.accountName || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-medium group-hover:text-indigo-600 transition-colors">
                        {t.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {t.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${
                        t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-800'
                      }`}>
                        {t.type === TransactionType.INCOME ? '+' : ''}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && (
           <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400 h-full">
             <div className="bg-slate-50 p-4 rounded-full mb-4">
               <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
               </svg>
             </div>
             <p className="text-slate-600 font-medium">No transactions found</p>
             <p className="text-sm mt-1">Try adjusting your filters to see more results.</p>
           </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-100 p-3 text-xs text-slate-400 text-center z-20">
        Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};