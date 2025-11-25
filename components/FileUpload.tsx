import React, { useCallback, useState, useEffect } from 'react';
import { Account, AccountType } from '../types';

interface FileUploadProps {
  accounts: Account[];
  onFileSelect: (file: File, accountId: string, isNewAccount?: boolean, newAccountName?: string, newAccountType?: AccountType) => void;
  isLoading: boolean;
}

const LOADING_MESSAGES = [
  "Securely reading your PDF...",
  "Scanning for transaction details...",
  "Identifying dates and merchants...",
  "Categorizing your spending...",
  "Analyzing financial habits...",
  "Finalizing your report..."
];

export const FileUpload: React.FC<FileUploadProps> = ({ accounts, onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts.length > 0 ? accounts[0].id : 'new');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>(AccountType.BANK);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Cycle loading messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setLoadingMsgIndex(0);
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500); // Change message every 2.5s
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (selectedAccountId === 'new') {
      if (!newAccountName.trim()) {
        alert('Please enter an account name');
        return;
      }
      onFileSelect(file, 'new', true, newAccountName, newAccountType);
    } else {
      onFileSelect(file, selectedAccountId);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        processFile(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  }, [processFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        processFile(file);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Account</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Account</label>
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={isLoading}
              className="block w-full rounded-lg border-slate-300 border p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type === AccountType.BANK ? 'Bank' : 'Card'})</option>
              ))}
              <option value="new">+ Create New Account</option>
            </select>
          </div>

          {selectedAccountId === 'new' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Savings, Amex Platinum"
                  value={newAccountName}
                  disabled={isLoading}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="block w-full rounded-lg border-slate-300 border p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                <select
                  value={newAccountType}
                  disabled={isLoading}
                  onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                  className="block w-full rounded-lg border-slate-300 border p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50"
                >
                  <option value={AccountType.BANK}>Bank Account</option>
                  <option value={AccountType.CREDIT_CARD}>Credit Card</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        onDragOver={!isLoading ? handleDragOver : undefined}
        onDragLeave={!isLoading ? handleDragLeave : undefined}
        onDrop={!isLoading ? handleDrop : undefined}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
          ${isLoading ? 'border-indigo-200 bg-slate-50 cursor-default' : ''}
        `}
      >
        <div className={`flex flex-col items-center justify-center space-y-4 ${isLoading ? 'opacity-20 blur-[1px]' : ''}`}>
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-800">
              Upload PDF Statement
            </h3>
            <p className="text-slate-500 text-xs">
              Drag & drop or click to browse
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors">
            Select PDF
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf"
              onChange={handleInputChange}
            />
          </label>
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            </div>
            <p className="text-indigo-800 font-semibold text-sm animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
            <p className="text-slate-400 text-xs mt-2 max-w-xs">
              Large statements may take up to 30 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
};