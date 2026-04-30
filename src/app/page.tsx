"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getTransactions,
  saveTransactions,
  Transaction,
} from "../lib/sampleData";

const currencySymbols: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  PHP: "₱",
  CAD: "C$",
  AUD: "A$",
  INR: "₹",
  JPY: "¥",
};

const categories = [
  "Bills",
  "Food",
  "Transport",
  "Insurance",
  "Childcare",
  "Utilities",
  "Connectivity",
  "School",
  "Customize",
];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "expense",
    category: "Bills",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setTransactions(getTransactions());

    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const saveAll = (data: Transaction[]) => {
    setTransactions(data);
    saveTransactions(data);
  };

  const finalCategory =
    form.category === "Customize" && customCategory.trim()
      ? customCategory.trim()
      : form.category;

  const resetForm = () => {
    setEditingId(null);
    setCustomCategory("");
    setForm({
      name: "",
      amount: "",
      type: "expense",
      category: "Bills",
      date: selectedDate,
    });
  };

  const handleSave = () => {
    if (!form.name || !form.amount) return;

    if (editingId) {
      const updated = transactions.map((t) =>
        t.id === editingId
          ? {
              ...t,
              name: form.name,
              amount: Number(form.amount),
              type: form.type as "expense" | "income",
              category: finalCategory,
              date: form.date,
            }
          : t
      );

      saveAll(updated);
      resetForm();
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      name: form.name,
      amount: Number(form.amount),
      type: form.type as "expense" | "income",
      category: finalCategory,
      date: form.date,
    };

    saveAll([...transactions, newTx]);
    resetForm();
  };

  const handleEdit = (t: Transaction) => {
    const isPresetCategory = categories.includes(t.category);

    setEditingId(t.id);
    setCustomCategory(isPresetCategory ? "" : t.category);

    setForm({
      name: t.name,
      amount: String(t.amount),
      type: t.type,
      category: isPresetCategory ? t.category : "Customize",
      date: t.date?.slice(0, 10) || selectedDate,
    });
  };

  const handleDelete = (id: string) => {
    saveAll(transactions.filter((t) => t.id !== id));
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 14 + i);
    return d.toISOString().slice(0, 10);
  });

  const selectedTransactions = transactions.filter(
    (t) => t.date?.slice(0, 10) === selectedDate
  );

  const chartData = useMemo(() => {
    const allCategories = Array.from(
      new Set([
        ...categories.filter((c) => c !== "Customize"),
        ...transactions.map((t) => t.category),
      ])
    );

    return allCategories.map((cat) => ({
      category: cat,
      amount: transactions
        .filter((t) => t.type === "expense" && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [transactions]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-100">
                Premium Budget Dashboard
              </p>
              <h1 className="text-4xl font-black md:text-5xl">
                Expenses Tracker
              </h1>
              <p className="mt-2 max-w-2xl text-blue-100">
                Track income, expenses, bills, calendar payments, and spending
                trends.
              </p>
            </div>

            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                localStorage.setItem("currency", e.target.value);
              }}
              className="rounded-2xl border border-white/20 bg-white/90 p-3 font-semibold text-slate-900 shadow-lg"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="EUR">EUR - Euro</option>
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total Income"
            amount={income}
            icon={<Wallet />}
            color="text-emerald-400"
            currency={currencySymbols[currency]}
          />
          <SummaryCard
            title="Total Expenses"
            amount={expenses}
            icon={<CreditCard />}
            color="text-rose-400"
            currency={currencySymbols[currency]}
          />
          <SummaryCard
            title="Remaining Balance"
            amount={balance}
            icon={<CalendarDays />}
            color={balance >= 0 ? "text-blue-300" : "text-rose-400"}
            currency={currencySymbols[currency]}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur lg:col-span-1">
            <h2 className="mb-4 text-2xl font-bold">
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <div className="space-y-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              />

              <input
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              />

              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              {form.category === "Customize" && (
                <input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
                />
              )}

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              />

              <button
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 p-3 font-bold text-white shadow-lg hover:bg-blue-600"
              >
                <Plus size={18} />
                {editingId ? "Save Changes" : "Add Transaction"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="w-full rounded-2xl bg-white/20 p-3 font-bold text-white hover:bg-white/30"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur lg:col-span-2">
            <h2 className="mb-4 text-2xl font-bold">Spending Chart</h2>
            <div className="h-72 rounded-3xl bg-white p-4 text-slate-900">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#2563eb" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-2xl font-bold">Calendar</h2>

            <div className="grid grid-cols-5 gap-2 md:grid-cols-7">
              {days.map((day) => {
                const count = transactions.filter(
                  (t) => t.date?.slice(0, 10) === day
                ).length;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(day);
                      setForm({ ...form, date: day });
                    }}
                    className={`rounded-2xl p-3 text-sm font-bold shadow ${
                      selectedDate === day
                        ? "bg-blue-500 text-white"
                        : "bg-white/90 text-slate-900 hover:bg-blue-100"
                    }`}
                  >
                    <div>{new Date(day).getDate()}</div>
                    <div className="text-xs opacity-70">
                      {new Date(day).toLocaleString("default", {
                        month: "short",
                      })}
                    </div>
                    {count > 0 && (
                      <div className="mx-auto mt-1 h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-2xl font-bold">
              Transactions on {selectedDate}
            </h2>

            <div className="space-y-3">
              {selectedTransactions.length === 0 && (
                <p className="rounded-2xl bg-white/10 p-4 text-blue-100">
                  No transactions for this date.
                </p>
              )}

              {selectedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 text-slate-900 shadow-lg"
                >
                  <div>
                    <p className="font-black">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.category}</p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-black ${
                        t.type === "expense"
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {t.type === "expense" ? "-" : "+"}
                      {currencySymbols[currency]}
                      {t.amount}
                    </p>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  amount,
  icon,
  color,
  currency,
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  currency: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
        {icon}
      </div>
      <p className="text-sm text-blue-100">{title}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>
        {currency}
        {amount}
      </p>
    </div>
  );
}
