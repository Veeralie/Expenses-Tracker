'use client';

import { addDays, differenceInCalendarDays, endOfMonth, format, getDay, isSameDay, parseISO, startOfMonth } from 'date-fns';
import { CalendarDays, CreditCard, Crown, DollarSign, Download, Plus, RefreshCw, Settings, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { defaultCategories, defaultEntries, premiumFlags } from '@/lib/sampleData';
import { Category, Entry, EntryStatus, EntryType, Recurrence } from '@/lib/types';

const recurrenceOptions: Recurrence[] = ['none', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
const statusOptions: EntryStatus[] = ['scheduled', 'paid', 'cancelled', 'extended'];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nextDate(date: string, recurrence: Recurrence) {
  const base = parseISO(date);
  const days = recurrence === 'weekly' ? 7 : recurrence === 'biweekly' ? 14 : recurrence === 'monthly' ? 30 : recurrence === 'quarterly' ? 91 : recurrence === 'yearly' ? 365 : 0;
  return days ? addDays(base, days).toISOString().slice(0, 10) : date;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(defaultEntries);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [cycleStart, setCycleStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [cycleEnd, setCycleEnd] = useState(endOfMonth(new Date()).toISOString().slice(0, 10));
  const [form, setForm] = useState<Omit<Entry, 'id'>>({ type: 'expense', name: '', amount: 0, categoryId: 'food', dueDate: selectedDate, recurrence: 'none', reminderDays: 1, status: 'scheduled' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '✨', type: 'expense' as EntryType });

  const month = parseISO(selectedDate);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const blanks = Array.from({ length: getDay(monthStart) });
  const days = Array.from({ length: Number(format(monthEnd, 'd')) }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1));

  const cycleEntries = useMemo(() => entries.filter(e => e.dueDate >= cycleStart && e.dueDate <= cycleEnd && e.status !== 'cancelled'), [entries, cycleStart, cycleEnd]);
  const income = cycleEntries.filter(e => e.type === 'income' && e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = cycleEntries.filter(e => e.type === 'expense' && e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const scheduledExpenses = cycleEntries.filter(e => e.type === 'expense' && e.status === 'scheduled').reduce((sum, e) => sum + e.amount, 0);
  const remaining = income - paidExpenses - scheduledExpenses;
  const dueSoon = entries.filter(e => e.type === 'expense' && e.status === 'scheduled' && differenceInCalendarDays(parseISO(e.dueDate), new Date()) <= e.reminderDays && differenceInCalendarDays(parseISO(e.dueDate), new Date()) >= 0);

  const chartData = categories.filter(c => c.type !== 'income').map(c => ({ name: `${c.icon} ${c.name}`, amount: cycleEntries.filter(e => e.categoryId === c.id && e.type === 'expense').reduce((s, e) => s + e.amount, 0) })).filter(x => x.amount > 0);

  function addEntry() {
    if (!form.name || !form.amount) return;
    setEntries(prev => [{ ...form, id: crypto.randomUUID(), dueDate: form.dueDate || selectedDate }, ...prev]);
    setForm({ ...form, name: '', amount: 0, dueDate: selectedDate });
  }

  function updateStatus(id: string, status: EntryStatus, extendDays = 0) {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (status === 'paid') return { ...e, status, paidDate: todayISO() };
      if (status === 'extended') return { ...e, status: 'scheduled', dueDate: addDays(parseISO(e.dueDate), extendDays).toISOString().slice(0, 10), extendedUntil: addDays(parseISO(e.dueDate), extendDays).toISOString().slice(0, 10) };
      return { ...e, status };
    }));
  }

  function duplicateRecurring(entry: Entry) {
    if (entry.recurrence === 'none') return;
    setEntries(prev => [{ ...entry, id: crypto.randomUUID(), dueDate: nextDate(entry.dueDate, entry.recurrence), status: 'scheduled', paidDate: undefined }, ...prev]);
  }

  function addCategory() {
    if (!newCategory.name) return;
    const id = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setCategories(prev => [...prev, { id, ...newCategory }]);
    setNewCategory({ name: '', icon: '✨', type: 'expense' });
  }

  const selectedEntries = entries.filter(e => isSameDay(parseISO(e.dueDate), parseISO(selectedDate)));

  return <main className="min-h-screen p-4 md:p-8">
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Budget/Bill/Expenses Tracker</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">Payments calendar + cycle-based budget dashboard</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Track income, bills, reminders, due dates, recurring payments, and monthly cycle totals. Premium modules are feature-flagged and ready to launch.</p>
        </div>
        <div className="rounded-3xl bg-white/10 p-4 text-sm backdrop-blur">
          <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-300"/> Premium ready</div>
          <p className="mt-2 text-slate-300">Turn on charts, comparisons, export, household sharing, and cloud sync when monetization is ready.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<DollarSign/>} label="Paid income" value={money(income)} />
        <Stat icon={<CreditCard/>} label="Paid expenses" value={money(paidExpenses)} />
        <Stat icon={<CalendarDays/>} label="Scheduled expenses" value={money(scheduledExpenses)} />
        <Stat icon={<Wallet/>} label="Projected remaining" value={money(remaining)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Regular Payments Calendar" action={<input type="month" value={format(month, 'yyyy-MM')} onChange={e => setSelectedDate(`${e.target.value}-01`)} className="rounded-xl border px-3 py-2 text-sm"/>}>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-2">{blanks.map((_, i) => <div key={`b${i}`} />)}{days.map(d => {
            const iso = d.toISOString().slice(0, 10);
            const dayEntries = entries.filter(e => e.dueDate === iso);
            return <button key={iso} onClick={() => { setSelectedDate(iso); setForm(f => ({ ...f, dueDate: iso })); }} className={`min-h-24 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow ${iso === selectedDate ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white'}`}>
              <div className="font-bold">{format(d, 'd')}</div>
              <div className="mt-1 space-y-1">{dayEntries.slice(0, 3).map(e => <div key={e.id} className={`truncate rounded-lg px-2 py-1 text-[11px] ${e.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{categories.find(c => c.id === e.categoryId)?.icon} {e.name}</div>)}</div>
            </button>;
          })}</div>
        </Panel>

        <Panel title={`Add Expenses/Income for ${format(parseISO(selectedDate), 'MMM d, yyyy')}`}>
          <EntryForm form={form} setForm={setForm} categories={categories} onSubmit={addEntry} />
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold">Customize category + icon</h3>
            <div className="mt-2 grid grid-cols-[70px_1fr_110px] gap-2">
              <input value={newCategory.icon} onChange={e => setNewCategory(v => ({ ...v, icon: e.target.value }))} className="rounded-xl border p-2" />
              <input placeholder="Category name" value={newCategory.name} onChange={e => setNewCategory(v => ({ ...v, name: e.target.value }))} className="rounded-xl border p-2" />
              <select value={newCategory.type} onChange={e => setNewCategory(v => ({ ...v, type: e.target.value as EntryType }))} className="rounded-xl border p-2"><option value="expense">Expense</option><option value="income">Income</option></select>
            </div>
            <button onClick={addCategory} className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-white"><Plus className="mr-1 inline h-4 w-4"/> Add category</button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Selected date items">
          <EntryList entries={selectedEntries} categories={categories} updateStatus={updateStatus} duplicateRecurring={duplicateRecurring} />
        </Panel>
        <Panel title="Scheduled Payments - manual list view">
          <div className="mb-4 grid gap-2 md:grid-cols-2">
            <label className="text-sm">Cycle start<input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} className="mt-1 w-full rounded-xl border p-2"/></label>
            <label className="text-sm">Cycle end<input type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} className="mt-1 w-full rounded-xl border p-2"/></label>
          </div>
          {dueSoon.length > 0 && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Reminder: {dueSoon.length} expense(s) due within their reminder window.</div>}
          <EntryList entries={cycleEntries} categories={categories} updateStatus={updateStatus} duplicateRecurring={duplicateRecurring} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Expense overview chart">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v) => money(Number(v))}/><Bar dataKey="amount" radius={[10,10,0,0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Premium launch recommendations">
          <div className="grid gap-3">
            {[
              ['Unlimited customized categories', 'Free users get core categories; premium unlocks unlimited names/icons/budgets.'],
              ['Advanced charts and insights', 'Category trends, income-vs-expense, cashflow forecast, and spending heatmaps.'],
              ['Month comparison', '“You spent less/more this cycle vs previous cycle” with actionable notes.'],
              ['Smart reminders', 'Email/push reminders, overdue alerts, and recurring auto-generation.'],
              ['CSV/PDF export', 'Export budget summaries for family review, tax prep, or accounting.'],
              ['Shared household wallet', 'Invite partner/family members with roles and shared bills.'],
              ['Savings goals', 'Emergency fund, school fund, kids fund, vacation fund, and progress tracking.'],
              ['Cloud sync + backup', 'Secure account login, device sync, and recovery.']
            ].map(([title, desc]) => <div key={title} className="rounded-2xl border bg-white p-4"><div className="font-semibold"><Crown className="mr-2 inline h-4 w-4 text-amber-500"/>{title}</div><p className="mt-1 text-sm text-slate-600">{desc}</p></div>)}
          </div>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(premiumFlags, null, 2)}</pre>
        </Panel>
      </div>
    </section>
  </main>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-[2rem] bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{title}</h2>{action}</div>{children}</section>;
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[2rem] bg-white p-5 shadow-soft"><div className="flex items-center gap-3 text-slate-500">{icon}<span>{label}</span></div><div className="mt-3 text-2xl font-black">{value}</div></div>;
}
function EntryForm({ form, setForm, categories, onSubmit }: { form: Omit<Entry, 'id'>; setForm: (value: Omit<Entry, 'id'> | ((v: Omit<Entry, 'id'>) => Omit<Entry, 'id'>)) => void; categories: Category[]; onSubmit: () => void }) {
  const filtered = categories.filter(c => c.type === form.type || c.type === 'both');
  return <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-2"><button onClick={() => setForm(v => ({ ...v, type: 'expense', categoryId: 'food' }))} className={`rounded-xl p-3 ${form.type === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100'}`}>Expense</button><button onClick={() => setForm(v => ({ ...v, type: 'income', categoryId: 'salary', status: 'paid' }))} className={`rounded-xl p-3 ${form.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>Income</button></div>
    <input placeholder="Name of Expenses/Income" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} className="rounded-xl border p-3" />
    <input type="number" placeholder="Amount" value={form.amount || ''} onChange={e => setForm(v => ({ ...v, amount: Number(e.target.value) }))} className="rounded-xl border p-3" />
    <select value={form.categoryId} onChange={e => setForm(v => ({ ...v, categoryId: e.target.value }))} className="rounded-xl border p-3">{filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
    <div className="grid grid-cols-2 gap-2"><input type="date" value={form.dueDate} onChange={e => setForm(v => ({ ...v, dueDate: e.target.value }))} className="rounded-xl border p-3"/><select value={form.recurrence} onChange={e => setForm(v => ({ ...v, recurrence: e.target.value as Recurrence }))} className="rounded-xl border p-3">{recurrenceOptions.map(r => <option key={r}>{r}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-2"><input type="number" min={0} value={form.reminderDays} onChange={e => setForm(v => ({ ...v, reminderDays: Number(e.target.value) }))} className="rounded-xl border p-3" placeholder="Reminder days before"/><select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value as EntryStatus }))} className="rounded-xl border p-3">{statusOptions.map(s => <option key={s}>{s}</option>)}</select></div>
    <button onClick={onSubmit} className="rounded-xl bg-slate-900 p-3 font-semibold text-white"><Plus className="mr-2 inline h-4 w-4"/> Add Expenses/Income</button>
  </div>;
}
function EntryList({ entries, categories, updateStatus, duplicateRecurring }: { entries: Entry[]; categories: Category[]; updateStatus: (id: string, status: EntryStatus, extendDays?: number) => void; duplicateRecurring: (entry: Entry) => void }) {
  if (!entries.length) return <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">No items yet.</p>;
  return <div className="space-y-3">{entries.map(e => <div key={e.id} className="rounded-2xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-bold">{categories.find(c => c.id === e.categoryId)?.icon} {e.name}</div><div className="text-sm text-slate-500">{e.type} • {format(parseISO(e.dueDate), 'MMM d, yyyy')} • {e.recurrence}</div></div><div className={`rounded-full px-3 py-1 text-sm ${e.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{money(e.amount)}</div></div>
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => updateStatus(e.id, 'paid')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Paid</button><button onClick={() => updateStatus(e.id, 'cancelled')} className="rounded-lg bg-slate-200 px-3 py-2 text-sm">Cancel</button><button onClick={() => updateStatus(e.id, 'extended', 7)} className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">Extend 7 days</button>{e.recurrence !== 'none' && <button onClick={() => duplicateRecurring(e)} className="rounded-lg bg-indigo-100 px-3 py-2 text-sm text-indigo-800"><RefreshCw className="mr-1 inline h-4 w-4"/>Next recurring</button>}</div>
  </div>)}</div>;
}
