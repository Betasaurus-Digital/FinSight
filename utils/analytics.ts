import { FinancialAnalysis, SavedReport, Account, Transaction } from '../types';

export const aggregateFinancialData = (reports: SavedReport[], accounts: Account[]): FinancialAnalysis => {
  if (reports.length === 0) {
    return {
      transactions: [],
      summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, topExpenseCategory: 'N/A' },
      savingsOpportunities: [],
      spendingHabits: [],
      statementPeriod: 'No Data'
    };
  }

  // 1. Merge Transactions
  let allTransactions: Transaction[] = [];
  
  reports.forEach(report => {
    // Safety check if report.data is missing
    if (!report.data) return;

    const account = accounts.find(a => a.id === report.accountId);
    // Safety check for transactions array
    const reportTransactions = report.data.transactions || [];
    
    const transactionsWithMeta = reportTransactions.map(t => ({
      ...t,
      accountId: report.accountId,
      accountName: account?.name || 'Unknown Account'
    }));
    allTransactions = [...allTransactions, ...transactionsWithMeta];
  });

  // Sort by date desc
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Calculate Summaries
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, number> = {};

  allTransactions.forEach(t => {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      const cat = t.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    }
  });

  // Find top category
  let topExpenseCategory = 'N/A';
  let maxCatVal = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > maxCatVal) {
      maxCatVal = val;
      topExpenseCategory = cat;
    }
  });

  // 3. Merge Opportunities
  // Use flatMap with a safety check (|| []) and filter(Boolean) to remove undefined entries
  const allOpportunities = reports
    .flatMap(r => r.data?.savingsOpportunities || [])
    .filter(opp => opp && typeof opp === 'object' && opp.title);
    
  // Sort by savings amount desc
  allOpportunities.sort((a, b) => (b.estimatedMonthlySavings || 0) - (a.estimatedMonthlySavings || 0));

  // 4. Merge Habits
  const allHabits = reports
    .flatMap(r => r.data?.spendingHabits || [])
    .filter(habit => typeof habit === 'string');

  const uniqueHabits = Array.from(new Set(allHabits));

  return {
    statementPeriod: 'Unified View',
    transactions: allTransactions,
    summary: {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      topExpenseCategory
    },
    savingsOpportunities: allOpportunities,
    spendingHabits: uniqueHabits
  };
};