
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum AccountType {
  BANK = 'BANK',
  CREDIT_CARD = 'CREDIT_CARD'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  accountId?: string; // Optional for backward compatibility, but filled in analytics
  accountName?: string;
}

export interface SavingsOpportunity {
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FinancialAnalysis {
  statementPeriod?: string;
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    topExpenseCategory: string;
  };
  savingsOpportunities: SavingsOpportunity[];
  spendingHabits: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: FinancialAnalysis | null;
}

export interface SavedReport {
  id: string;
  accountId: string;
  fileName: string;
  analysisDate: string;
  data: FinancialAnalysis;
}

export interface SavedCard {
  id: string;
  bankName: string;
  cardName?: string; // e.g. "Regalia Gold", "Sapphire Reserve"
  network: string; // Visa, Mastercard, Rupay, Amex
  cardType: string; // Credit, Debit
  last4: string;
  colorStart: string;
  colorEnd: string;
}

export interface BankOffer {
  id: string;
  bank: string;
  platform: string; // Amazon, Flipkart, Swiggy, etc.
  logoUrl?: string;
  title: string;
  description: string;
  code?: string;
  category: string; // Shopping, Food, Travel
  validTill?: string;
}

export interface AppData {
  accounts: Account[];
  reports: SavedReport[];
  savedCards: SavedCard[];
}
