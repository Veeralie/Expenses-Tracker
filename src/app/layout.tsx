import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budget/Bill/Expenses Tracker',
  description: 'Calendar and scheduled payments tracker with income, expenses, reminders, recurrence, and premium-ready features.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
