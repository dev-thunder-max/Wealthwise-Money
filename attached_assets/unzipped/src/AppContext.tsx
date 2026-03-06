import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Account, Category, Transaction, Budget } from './types';

interface AppContextType {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  addAccount: (data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number, deleteTransactions: boolean) => Promise<void>;
  addBudget: (data: Partial<Budget>) => Promise<void>;
  updateUserSettings: (settings: { currency_preference: string }) => Promise<void>;
  resetApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [u, a, c, t, b] = await Promise.all([
        fetch('/api/user').then(res => res.json()),
        fetch('/api/accounts').then(res => res.json()),
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/transactions').then(res => res.json()),
        fetch('/api/budgets').then(res => res.json()),
      ]);
      setUser(u);
      setAccounts(a);
      setCategories(c);
      setTransactions(t);
      setBudgets(b);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTransaction = async (data: Partial<Transaction>) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const updateTransaction = async (id: number, data: Partial<Transaction>) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const deleteTransaction = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const addAccount = async (data: Partial<Account>) => {
    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const deleteAccount = async (id: number, deleteTransactions: boolean) => {
    await fetch(`/api/accounts/${id}?deleteTransactions=${deleteTransactions}`, { method: 'DELETE' });
    await fetchData();
  };

  const addBudget = async (data: Partial<Budget>) => {
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const updateUserSettings = async (settings: { currency_preference: string }) => {
    await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    await fetchData();
  };

  const resetApp = async () => {
    await fetch('/api/reset', { method: 'POST' });
    await fetchData();
  };

  return (
    <AppContext.Provider value={{
      user, accounts, categories, transactions, budgets, loading,
      refreshData: fetchData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      deleteAccount,
      addBudget,
      updateUserSettings,
      resetApp
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
