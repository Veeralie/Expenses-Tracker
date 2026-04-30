export type EntryType = 'expense' | 'income';
export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type EntryStatus = 'scheduled' | 'paid' | 'cancelled' | 'extended';

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: EntryType | 'both';
};

export type Entry = {
  id: string;
  type: EntryType;
  name: string;
  amount: number;
  categoryId: string;
  dueDate: string;
  recurrence: Recurrence;
  reminderDays: number;
  status: EntryStatus;
  paidDate?: string;
  extendedUntil?: string;
  notes?: string;
};

export type PremiumFlags = {
  unlimitedCategories: boolean;
  advancedCharts: boolean;
  monthComparison: boolean;
  csvExport: boolean;
  sharedHousehold: boolean;
  cloudSync: boolean;
};
