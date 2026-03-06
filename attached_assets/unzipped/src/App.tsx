import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  PieChart as PieChartIcon, 
  Wallet, 
  Settings, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Trash2,
  Plus,
  X,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Banknote,
  PiggyBank,
  Smartphone,
  Edit2,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { AppProvider, useApp } from './AppContext';
import { SmartInsights } from './components/SmartInsights';
import { ACCOUNT_TYPES, Account, CURRENCIES } from './types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function Dashboard() {
  const { 
    user, accounts, transactions, budgets, loading, 
    addTransaction, updateTransaction, deleteTransaction,
    addAccount, addBudget, updateUserSettings, resetApp 
  } = useApp();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exportDates, setExportDates] = useState({ 
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const currencySymbol = useMemo(() => {
    return CURRENCIES.find(c => c.code === user?.currency_preference)?.symbol || '$';
  }, [user?.currency_preference]);

  // Stats Calculations
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return isWithinInterval(date, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  });

  const prevMonthTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return isWithinInterval(date, { 
      start: startOfMonth(subMonths(new Date(), 1)), 
      end: endOfMonth(subMonths(new Date(), 1)) 
    });
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthlyIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeTrend = prevMonthlyIncome > 0 
    ? ((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100 
    : (monthlyIncome > 0 ? 100 : 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthlyExpenses = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseTrend = prevMonthlyExpenses > 0 
    ? ((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100 
    : (monthlyExpenses > 0 ? 100 : 0);

  const burnRate = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

  // Chart Data
  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category_name || 'Other';
        data[cat] = (data[cat] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [currentMonthTransactions]);

  const last6MonthsData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });

      data.push({
        name: format(date, 'MMM'),
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      });
    }
    return data;
  }, [transactions]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">WealthWise</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ArrowRightLeft size={20} />} label="Transactions" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <NavItem icon={<Wallet size={20} />} label="Accounts" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
          <NavItem icon={<PieChartIcon size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
                <p className="text-slate-500">Welcome back! Here's what's happening with your money.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddTransaction(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Plus size={20} />
                  Add Transaction
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Balance" value={`${currencySymbol}${totalBalance.toLocaleString()}`} icon={<Wallet className="text-indigo-600" />} />
              <StatCard 
                label="Monthly Income" 
                value={`${currencySymbol}${monthlyIncome.toLocaleString()}`} 
                icon={<ArrowUpRight className="text-emerald-600" />} 
                trend={`${incomeTrend >= 0 ? '+' : ''}${incomeTrend.toFixed(0)}%`} 
              />
              <StatCard 
                label="Monthly Expenses" 
                value={`${currencySymbol}${monthlyExpenses.toLocaleString()}`} 
                icon={<ArrowDownLeft className="text-rose-600" />} 
                trend={`${expenseTrend >= 0 ? '+' : ''}${expenseTrend.toFixed(0)}%`} 
              />
              <StatCard 
                label="Burn Rate" 
                value={`${burnRate.toFixed(1)}%`} 
                icon={<TrendingUp className="text-amber-600" />} 
                subtext={burnRate > 100 ? "Spending more than earning" : "Healthy spending"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-6">Income vs Expenses</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last6MonthsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Spending Distribution */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-6">Spending Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {expenseByCategory.slice(0, 4).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-900">{currencySymbol}{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Budgets */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Budgets</h3>
                  <button onClick={() => setShowAddBudget(true)} className="text-indigo-600 text-sm font-medium hover:underline">Manage</button>
                </div>
                <div className="space-y-6">
                  {budgets.length > 0 ? budgets.map(budget => {
                    const spent = currentMonthTransactions
                      .filter(t => t.category_id === budget.category_id && t.type === 'expense')
                      .reduce((sum, t) => sum + t.amount, 0);
                    const percent = Math.min((spent / budget.limit_amount) * 100, 100);
                    
                    return (
                      <div key={budget.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">{budget.category_name}</span>
                          <span className="text-slate-500">{currencySymbol}{spent.toLocaleString()} / {currencySymbol}{budget.limit_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{width: `${percent}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-slate-500 text-sm text-center py-4">No budgets set. Start by setting a limit for a category.</p>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              <SmartInsights />
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
              <button 
                onClick={() => setShowAddTransaction(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Plus size={20} />
                New Transaction
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-bottom border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(t.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{backgroundColor: `${t.category_color}20`, color: t.category_color}}>
                          {t.category_name || (t.type === 'transfer' ? 'Transfer' : 'Other')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{t.account_name || <span className="italic text-slate-400">Deleted Account</span>}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-slate-600'}`}>
                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{currencySymbol}{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => setEditingTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Delete this transaction?')) deleteTransaction(t.id); }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Accounts</h2>
              <button 
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Plus size={20} />
                Add Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(account => (
                <div key={account.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setDeletingAccount(account)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{account.name}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{account.type}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {currencySymbol}{account.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Settings</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">General Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Currency & Region</label>
                    <select 
                      value={user?.currency_preference}
                      onChange={(e) => updateUserSettings({ currency_preference: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-400">This will update the currency symbol across the entire application.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Management</h3>
                <p className="text-slate-500 text-sm mb-6">Export your data or reset your entire financial history.</p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Export Transactions</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">From</label>
                        <input 
                          type="date" 
                          value={exportDates.start}
                          onChange={e => setExportDates({...exportDates, start: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">To</label>
                        <input 
                          type="date" 
                          value={exportDates.end}
                          onChange={e => setExportDates({...exportDates, end: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => window.location.href = `/api/export?startDate=${exportDates.start}&endDate=${exportDates.end}&format=json`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl transition-colors w-full font-medium shadow-sm hover:bg-indigo-700"
                      >
                        <Download size={18} />
                        Download JSON
                      </button>
                      <button 
                        onClick={() => window.location.href = `/api/export?startDate=${exportDates.start}&endDate=${exportDates.end}&format=csv`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl transition-colors w-full font-medium shadow-sm hover:bg-slate-200"
                      >
                        <Download size={18} />
                        Download CSV
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => { if(confirm('Wipe all data? This cannot be undone.')) resetApp(); }}
                    className="flex items-center gap-3 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors w-full border border-rose-100"
                  >
                    <Trash2 size={20} />
                    <div className="text-left">
                      <p className="font-medium">Reset System</p>
                      <p className="text-xs text-rose-400">Permanently delete all accounts and transactions</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">About WealthWise</h3>
                <p className="text-slate-500 text-sm">Version 1.3.0 • Personal Finance Manager</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddTransaction && <AddTransactionModal onClose={() => setShowAddTransaction(false)} />}
      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} />}
      {showAddBudget && <AddBudgetModal onClose={() => setShowAddBudget(false)} />}
      {editingTransaction && <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />}
      {deletingAccount && <DeleteAccountModal account={deletingAccount} onClose={() => setDeletingAccount(null)} />}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function StatCard({ label, value, icon, trend, subtext }: { label: string, value: string, icon: React.ReactNode, trend?: string, subtext?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
  );
}

function getAccountIcon(type: string) {
  switch(type) {
    case 'bank': return <Banknote size={24} />;
    case 'credit': return <CreditCard size={24} />;
    case 'savings': return <PiggyBank size={24} />;
    case 'mfs': return <Smartphone size={24} />;
    default: return <Wallet size={24} />;
  }
}

// Modal Components
function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { accounts, categories, addTransaction } = useApp();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    account_id: '',
    to_account_id: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransaction({
      ...formData,
      amount: parseFloat(formData.amount),
      type,
      category_id: type === 'transfer' ? null : parseInt(formData.category_id),
      account_id: parseInt(formData.account_id),
      to_account_id: type === 'transfer' ? parseInt(formData.to_account_id) : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Add Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input 
              type="number" required step="0.01"
              value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input 
              type="text" required
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Lunch, Salary, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" required
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
              <select 
                required
                value={formData.account_id} onChange={e => setFormData({...formData, account_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Account</label>
              <select 
                required
                value={formData.to_account_id} onChange={e => setFormData({...formData, to_account_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select Destination</option>
                {accounts.filter(a => a.id.toString() !== formData.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                required
                value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select Category</option>
                {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4">
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { addAccount } = useApp();
  const [formData, setFormData] = useState<{ name: string; type: Account['type']; balance: string }>({ 
    name: '', 
    type: 'bank', 
    balance: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAccount({ ...formData, balance: parseFloat(formData.balance || '0') });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Add Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
            <input 
              type="text" required
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="e.g. Chase Checking, My Wallet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
            <select 
              required
              value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as Account['type']})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
            <input 
              type="number" step="0.01"
              value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

function AddBudgetModal({ onClose }: { onClose: () => void }) {
  const { categories, addBudget } = useApp();
  const [formData, setFormData] = useState({ category_id: '', limit_amount: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBudget({ category_id: parseInt(formData.category_id), limit_amount: parseFloat(formData.limit_amount) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Set Budget</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              required
              value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Select Category</option>
              {categories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit</label>
            <input 
              type="number" required step="0.01"
              value={formData.limit_amount} onChange={e => setFormData({...formData, limit_amount: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4">
            Save Budget
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTransactionModal({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  const { accounts, categories, updateTransaction } = useApp();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction.type);
  const [formData, setFormData] = useState({
    amount: transaction.amount.toString(),
    description: transaction.description,
    category_id: transaction.category_id?.toString() || '',
    account_id: transaction.account_id.toString(),
    to_account_id: transaction.to_account_id?.toString() || '',
    date: transaction.date
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTransaction(transaction.id, {
      ...formData,
      amount: parseFloat(formData.amount),
      type,
      category_id: type === 'transfer' ? null : parseInt(formData.category_id),
      account_id: parseInt(formData.account_id),
      to_account_id: type === 'transfer' ? parseInt(formData.to_account_id) : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Edit Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input 
              type="number" required step="0.01"
              value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input 
              type="text" required
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" required
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
              <select 
                required
                value={formData.account_id} onChange={e => setFormData({...formData, account_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Account</label>
              <select 
                required
                value={formData.to_account_id} onChange={e => setFormData({...formData, to_account_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select Destination</option>
                {accounts.filter(a => a.id.toString() !== formData.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                required
                value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4">
            Update Transaction
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteAccountModal({ account, onClose }: { account: any, onClose: () => void }) {
  const { deleteAccount } = useApp();
  const [deleteTransactions, setDeleteTransactions] = useState(false);

  const handleDelete = async () => {
    await deleteAccount(account.id, deleteTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-bold">Delete Account</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-900">"{account.name}"</span>? 
            This action cannot be undone.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={deleteTransactions} 
                onChange={e => setDeleteTransactions(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Delete associated transactions</p>
                <p className="text-slate-500">Remove all history linked to this account. If unchecked, data will be kept but unlinked.</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
