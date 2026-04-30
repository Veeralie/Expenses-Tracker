"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CalendarDays,
  CheckCircle,
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

const todayString = () => new Date().toISOString().slice(0, 10);

const daysUntilDue = (dueDate?: string) => {
  if (!dueDate) return null;

  const today = new Date(todayString());
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getDueLabel = (t: Transaction) => {
  if (t.type !== "expense" || t.status === "paid") return null;

  const diff = daysUntilDue(t.dueDate);

  if (diff === null) return null;
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due Today";
  if (diff <= 2) return "Due Soon";

  return null;
};

export default function Home() {
  
  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*");

      console.log("Supabase data:", data);
      console.log("Supabase error:", error);
    };

    testSupabase();
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "expense",
    category: "Bills",
    date: todayString(),
    recurrence: "none",
    dueDate: todayString(),
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
      recurrence: "none",
      dueDate: selectedDate,
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
              recurrence: form.recurrence as
                | "none"
                | "weekly"
                | "monthly"
                | "annually",
              dueDate: form.dueDate,
              status: t.status || "pending",
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
      recurrence: form.recurrence as
        | "none"
        | "weekly"
        | "monthly"
        | "annually",
      dueDate: form.dueDate,
      status: "pending",
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
      recurrence: t.recurrence || "none",
      dueDate: t.dueDate?.slice(0, 10) || selectedDate,
    });
  };

  const handleDelete = (id: string) => {
    saveAll(transactions.filter((t) => t.id !== id));
  };

  const markAsPaid = (id: string) => {
    saveAll(
      transactions.map((t) =>
        t.id === id ? { ...t, status: "paid" as const } : t
      )
    );
  };

  const extendDueDate = (id: string) => {
    const days = prompt("Extend by how many days?");
    if (!days || Number.isNaN(Number(days))) return;

    const updated = transactions.map((t) => {
      if (t.id !== id) return t;

      const currentDue = new Date(t.dueDate || t.date);
      currentDue.setDate(currentDue.getDate() + Number(days));

      return {
        ...t,
        dueDate: currentDue.toISOString().slice(0, 10),
        status: "pending" as const,
      };
    });

    saveAll(updated);
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const blanks = Array(firstDay.getDay()).fill(null);

    const days = Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().slice(0, 10);
    });

    return [...blanks, ...days];
  };

  const calendarDays = getCalendarDays(currentMonth);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const paidExpenses = transactions
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - paidExpenses;

  const dueSoonCount = transactions.filter(
    (t) => getDueLabel(t) === "Due Soon" || getDueLabel(t) === "Due Today"
  ).length;

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
                Track income, expenses, recurring bills, due dates, and spending
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

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Income"
            amount={income}
            icon={<Wallet />}
            color="text-emerald-400"
            currency={currencySymbols[currency]}
          />
          <SummaryCard
            title="Paid Expenses"
            amount={paidExpenses}
            icon={<CheckCircle />}
            color="text-rose-400"
            currency={currencySymbols[currency]}
          />
          <SummaryCard
            title="Remaining Balance"
            amount={balance}
            icon={<CreditCard />}
            color={balance >= 0 ? "text-blue-300" : "text-rose-400"}
            currency={currencySymbols[currency]}
          />
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <CalendarDays />
            </div>
            <p className="text-sm text-blue-100">Due Soon</p>
            <p className="mt-1 text-3xl font-black text-yellow-300">
              {dueSoonCount}
            </p>
          </div>
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
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                    category: e.target.value === "income" ? "Customize" : "Bills",
                  })
                }
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
                  placeholder={
                    form.type === "income"
                      ? "Salary, Bonus, Part-time..."
                      : "Enter custom category"
                  }
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
                />
              )}

              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                    dueDate: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
              />

              {form.type === "expense" && (
                <>
                  <select
                    value={form.recurrence}
                    onChange={(e) =>
                      setForm({ ...form, recurrence: e.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
                  >
                    <option value="none">No Recurrence</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/90 p-3 text-slate-900"
                  />
                </>
              )}

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
            <p className="mt-3 text-sm text-blue-100">
              Total scheduled expenses: {currencySymbols[currency]}
              {totalExpenses}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                className="rounded-xl bg-white/20 px-4 py-2 font-bold hover:bg-white/30"
              >
                ←
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-black">
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <p className="text-sm text-blue-100">
                  Select a date to manage payments
                </p>
              </div>

              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                className="rounded-xl bg-white/20 px-4 py-2 font-bold hover:bg-white/30"
              >
                →
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-blue-100">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="min-h-20 rounded-2xl bg-white/5"
                    />
                  );
                }

                const dayTransactions = transactions.filter(
                  (t) => t.date?.slice(0, 10) === day
                );

                const dayIncome = dayTransactions
                  .filter((t) => t.type === "income")
                  .reduce((sum, t) => sum + t.amount, 0);

                const dayExpenses = dayTransactions
                  .filter((t) => t.type === "expense")
                  .reduce((sum, t) => sum + t.amount, 0);

                const isToday = day === todayString();
                const isSelected = day === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(day);
                      setForm({ ...form, date: day, dueDate: day });
                    }}
                    className={`min-h-20 rounded-2xl p-2 text-left shadow transition hover:scale-[1.02] ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : isToday
                        ? "bg-yellow-100 text-slate-900"
                        : "bg-white/90 text-slate-900 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black">
                        {new Date(day).getDate()}
                      </span>

                      {isToday && (
                        <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                          Today
                        </span>
                      )}
                    </div>

                    {dayTransactions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {dayIncome > 0 && (
                          <p className="truncate text-[11px] font-bold text-emerald-600">
                            +{currencySymbols[currency]}
                            {dayIncome}
                          </p>
                        )}

                        {dayExpenses > 0 && (
                          <p className="truncate text-[11px] font-bold text-rose-600">
                            -{currencySymbols[currency]}
                            {dayExpenses}
                          </p>
                        )}

                        <div className="flex gap-1">
                          {dayTransactions.slice(0, 3).map((tx) => (
                            <span
                              key={tx.id}
                              className={`h-2 w-2 rounded-full ${
                                tx.type === "income"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
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

              {selectedTransactions.map((t) => {
                const dueLabel = getDueLabel(t);

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl bg-white p-4 text-slate-900 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">{t.name}</p>

                          {t.status === "paid" && (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                              Paid
                            </span>
                          )}

                          {dueLabel && (
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                dueLabel === "Overdue"
                                  ? "bg-rose-100 text-rose-700"
                                  : dueLabel === "Due Today"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {dueLabel}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500">{t.category}</p>

                        {t.type === "expense" && (
                          <p className="text-xs text-slate-400">
                            Due: {t.dueDate || t.date} · Recurring:{" "}
                            {t.recurrence || "none"}
                          </p>
                        )}
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

                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                          >
                            <Pencil size={15} />
                          </button>

                          {t.type === "expense" && t.status !== "paid" && (
                            <>
                              <button
                                onClick={() => markAsPaid(t.id)}
                                className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                              >
                                Paid
                              </button>

                              <button
                                onClick={() => extendDueDate(t.id)}
                                className="rounded-lg bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-200"
                              >
                                Extend
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDelete(t.id)}
                            className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
