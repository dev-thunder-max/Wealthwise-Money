import { Type } from "@google/genai";

export interface User {
  id: number;
  email: string;
  currency_preference: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings' | 'mfs' | 'investment';
  balance: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  category_id: number | null;
  account_id: number;
  to_account_id: number | null;
  type: 'income' | 'expense' | 'transfer';
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
}

export interface Budget {
  id: number;
  category_id: number;
  limit_amount: number;
  period: string;
  category_name?: string;
  category_color?: string;
}

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'savings', label: 'Savings' },
  { value: 'mfs', label: 'Mobile Financial Service (MFS)' },
  { value: 'investment', label: 'Investment' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];
