import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login'; // Import the new Login component
import { AnalysisState, SavedReport, Account, AccountType } from './types';
import { analyzeStatement } from './services/geminiService';
import { fileToBase64 } from './utils/fileHelpers';
import { saveReport, getReports, deleteReport, getAccounts, createAccount, deleteAccount } from './utils/storage';
import { aggregateFinancialData } from './utils/analytics';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('isAuthenticated'));

  const [activeView, setActiveView] = useState<'UNIFIED' | 'UPLOAD' | string>('UNIFIED'); 
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allReports, setAllReports] = useState<SavedReport[]>([]);
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    data: null,
  });

  // Load initial data only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setActiveView('UNIFIED'); // Reset view on logout
  };

  const refreshData = () => {
    setAccounts(getAccounts());
    setAllReports(getReports());
  };

  const handleFileSelect = async (file: File, accountId: string, isNewAccount?: boolean, newAccountName?: string, newAccountType?: AccountType) => {
    setAnalysisState({ isLoading: true, error: null, data: null });
    
    try {
      let targetAccountId = accountId;

      if (isNewAccount && newAccountName && newAccountType) {
        const newAccount = createAccount(newAccountName, newAccountType);
        targetAccountId = newAccount.id;
        setAccounts(getAccounts()); 
      }

      const base64Pdf = await fileToBase64(file);
      const analysisResult = await analyzeStatement(base64Pdf);
      
      saveReport(targetAccountId, analysisResult, file.name);
      refreshData();

      setAnalysisState({
        isLoading: false,
        error: null,
        data: null, 
      });
      
      setActiveView(targetAccountId);
    } catch (error: any) {
      setAnalysisState({
        isLoading: false,
        error: error.message || 'An unexpected error occurred',
        data: null,
      });
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(id);
      refreshData();
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this account and all its data?')) {
      deleteAccount(id);
      refreshData();
      setActiveView('UNIFIED');
    }
  };

  const getCurrentData = () => {
    if (activeView === 'UNIFIED') {
      return aggregateFinancialData(allReports, accounts);
    } else if (activeView === 'UPLOAD') {
      return null;
    } else {
      const accountReports = allReports.filter(r => r.accountId === activeView);
      const data = aggregateFinancialData(accountReports, accounts);
      data.statementPeriod = accounts.find(a => a.id === activeView)?.name || 'Account View';
      return data;
    }
  };

  const currentDashboardData = getCurrentData();

  // If not authenticated, show the Login component
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Otherwise, render the main application
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            FinSight
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button
            onClick={() => setActiveView('UNIFIED')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'UNIFIED' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Unified Dashboard
          </button>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Accounts
          </div>

          {accounts.map(acc => (
            <div key={acc.id} className="group flex items-center justify-between">
              <button
                onClick={() => setActiveView(acc.id)}
                className={`flex-1 flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeView === acc.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full mr-3`} style={{ backgroundColor: acc.color }}></span>
                <span className="truncate">{acc.name}</span>
              </button>
            </div>
          ))}

          <button
            onClick={() => setActiveView('UPLOAD')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mt-4 text-emerald-600 hover:bg-emerald-50 ${activeView === 'UPLOAD' ? 'bg-emerald-50' : ''}`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Import Statement
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-200 space-y-3">
           <div className="bg-indigo-900 rounded-xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-indigo-500 rounded-full opacity-50 blur-lg"></div>
              <p className="text-xs text-indigo-200 font-medium mb-1">Total Net Savings</p>
              <p className="text-xl font-bold">
                 {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                    aggregateFinancialData(allReports, accounts).summary.netSavings
                 )}
              </p>
           </div>
           
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-500 hover:bg-slate-100 hover:text-rose-600"
           >
             <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10">
          <h1 className="text-lg font-bold text-slate-800">FinSight</h1>
          <button onClick={() => setActiveView(activeView === 'UPLOAD' ? 'UNIFIED' : 'UPLOAD')} className="text-indigo-600 font-medium text-sm">
             {activeView === 'UPLOAD' ? 'Cancel' : '+ Import'}
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          
          {analysisState.error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center text-rose-700 animate-[shake_0.5s_ease-in-out]">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {analysisState.error}
            </div>
          )}

          {activeView === 'UPLOAD' ? (
            <div className="max-w-2xl mx-auto py-8 animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Import New Statement</h2>
              <p className="text-slate-500 text-center mb-8">Upload a PDF statement to update your analytics.</p>
              
              <FileUpload 
                accounts={accounts} 
                onFileSelect={handleFileSelect} 
                isLoading={analysisState.isLoading} 
              />
              
              <div className="mt-8 flex justify-center">
                 <button onClick={() => setActiveView('UNIFIED')} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {currentDashboardData && (
                <div className="max-w-7xl mx-auto">
                   {activeView !== 'UNIFIED' && activeView !== 'UPLOAD' && (
                     <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-bold text-slate-900">
                             {accounts.find(a => a.id === activeView)?.name}
                          </h2>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                             {accounts.find(a => a.id === activeView)?.type === AccountType.BANK ? 'Bank Account' : 'Credit Card'}
                          </span>
                        </div>
                        <button 
                           onClick={() => handleDeleteAccount(activeView)}
                           className="text-rose-500 hover:text-rose-700 text-sm font-medium flex items-center"
                        >
                           <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           Delete Account
                        </button>
                     </div>
                   )}

                   {activeView !== 'UNIFIED' && (
                     <div className="mb-8">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Statement History</h3>
                        <div className="flex flex-wrap gap-3">
                           {allReports.filter(r => r.accountId === activeView).map(report => (
                              <div key={report.id} className="relative group bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center hover:border-indigo-400 transition-colors">
                                 <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                 <span className="text-sm text-slate-700 font-medium mr-2">{report.fileName}</span>
                                 <button 
                                   onClick={() => handleDeleteReport(report.id)}
                                   className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                                 >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                              </div>
                           ))}
                           {allReports.filter(r => r.accountId === activeView).length === 0 && (
                             <p className="text-sm text-slate-400 italic">No statements uploaded yet.</p>
                           )}
                        </div>
                     </div>
                   )}

                   <Dashboard 
                     data={currentDashboardData} 
                     onBack={() => setActiveView('UNIFIED')} 
                   />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
