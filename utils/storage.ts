import { SavedReport, FinancialAnalysis, Account, AccountType, AppData } from '../types';

const STORAGE_KEY = 'finsight_data_v2';

const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  
  // Migration or fallback
  return { accounts: [], reports: [] };
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
