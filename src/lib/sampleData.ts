import { Category, Entry, PremiumFlags } from './types';

export const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', icon: '🍜', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'school', name: 'School', icon: '🎒', type: 'expense' },
  { id: 'kids', name: 'Kids', icon: '🧸', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: '💡', type: 'expense' },
  { id: 'rent', name: 'Rent', icon: '🏠', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💼', type: 'income' },
  { id: 'part-time', name: 'Part Time', icon: '⏱️', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: 'investments', name: 'Investments', icon: '📈', type: 'income' },
  { id: 'others', name: 'Others', icon: '✨', type: 'both' }
];

export const defaultEntries: Entry[] = [
  { id: '1', type: 'income', name: 'Salary', amount: 3200, categoryId: 'salary', dueDate: new Date().toISOString().slice(0, 10), recurrence: 'monthly', reminderDays: 0, status: 'paid' },
  { id: '2', type: 'expense', name: 'Rent', amount: 1100, categoryId: 'rent', dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().slice(0, 10), recurrence: 'monthly', reminderDays: 3, status: 'scheduled' },
  { id: '3', type: 'expense', name: 'Internet', amount: 60, categoryId: 'utilities', dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().slice(0, 10), recurrence: 'monthly', reminderDays: 2, status: 'scheduled' },
  { id: '4', type: 'expense', name: 'Groceries', amount: 180, categoryId: 'food', dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 17).toISOString().slice(0, 10), recurrence: 'weekly', reminderDays: 1, status: 'scheduled' }
];

export const premiumFlags: PremiumFlags = {
  unlimitedCategories: false,
  advancedCharts: false,
  monthComparison: false,
  csvExport: false,
  sharedHousehold: false,
  cloudSync: false
};
