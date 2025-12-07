import { SavedReport, FinancialAnalysis, Account, AccountType, AppData, SavedCard } from '../types';

const STORAGE_KEY = 'finsight_data_v2';

const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: Ensure savedCards exists
      if (!parsed.savedCards) parsed.savedCards = [];
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  
  // Migration or fallback
  return { accounts: [], reports: [], savedCards: [] };
};

const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getAccounts = (): Account[] => {
  return getAppData().accounts;
};

export const createAccount = (name: string, type: AccountType): Account => {
  const data = getAppData();
  
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const color = colors[data.accounts.length % colors.length];

  const newAccount: Account = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    name,
    type,
    color
  };

  data.accounts.push(newAccount);
  saveAppData(data);
  return newAccount;
};

export const getReports = (accountId?: string): SavedReport[] => {
  const data = getAppData();
  if (accountId) {
    return data.reports.filter(r => r.accountId === accountId);
  }
  return data.reports;
};

export const saveReport = (accountId: string, data: FinancialAnalysis, fileName: string): SavedReport => {
  const appData = getAppData();
  
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  const newReport: SavedReport = {
    id,
    accountId,
    fileName,
    analysisDate: new Date().toISOString(),
    data
  };
  
  // Add to beginning
  appData.reports.unshift(newReport);
  saveAppData(appData);
  return newReport;
};

export const deleteReport = (id: string) => {
  const data = getAppData();
  data.reports = data.reports.filter(r => r.id !== id);
  saveAppData(data);
};

export const deleteAccount = (id: string) => {
  const data = getAppData();
  data.accounts = data.accounts.filter(a => a.id !== id);
  // Also delete associated reports
  data.reports = data.reports.filter(r => r.accountId !== id);
  saveAppData(data);
};

// --- Card Storage Methods ---

export const getSavedCards = (): SavedCard[] => {
  return getAppData().savedCards || [];
};

export const saveCard = (card: SavedCard) => {
  const data = getAppData();
  if (!data.savedCards) data.savedCards = [];
  data.savedCards.push(card);
  saveAppData(data);
};

export const deleteCard = (id: string) => {
  const data = getAppData();
  if (!data.savedCards) return;
  data.savedCards = data.savedCards.filter(c => c.id !== id);
  saveAppData(data);
};