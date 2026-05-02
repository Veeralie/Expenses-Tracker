"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
  supabase,
  getTransactions,
  saveTransaction,
  updateTransaction,
  deleteTransaction,
  createNextRecurringTransaction,
  Transaction,
} from "../lib/supabase";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
  const setupAuth = async () => {
    if (window.location.hash.includes("type=recovery")) {
      setIsResetMode(true);
    }

    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  setupAuth();

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  const savedCurrency = localStorage.getItem("currency");
  if (savedCurrency) setCurrency(savedCurrency);

  return () => {
    data.subscription.unsubscribe();
  };
}, []);
  
useEffect(() => {
  const loadTransactions = async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const data = await getTransactions();
    setTransactions(data);
  };

  loadTransactions();
}, [user]);

useEffect(() => {
  if (cooldown <= 0) return;

  const timer = window.setTimeout(() => {
    setCooldown((prev) => Math.max(prev - 1, 0));
  }, 1000);

  return () => window.clearTimeout(timer);
}, [cooldown]);

  const finalCategory =
    form.category === "Customize" && customCategory.trim()
      ? customCategory.trim()
      : form.category;

  const signIn = async () => {
  if (!email || !password) {
    setAuthMessage("Please enter email and password.");
    return;
  }

  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setAuthMessage(error.message);
  }else{
    setAuthMessage("");
  }

  setAuthLoading(false);
};

  const signUp = async () => {
  if (!email || !password) {
    setAuthMessage("Please enter email and password.");
    return;
  }

  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setAuthMessage(error.message);
  } else {
    setAuthMessage("Account created! You can now log in.");
  }

  setAuthLoading(false);
};

  const resetPassword = async () => {
  if (!email) {
    setAuthMessage("Please enter your email first.");
    return;
  }

  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

  if (error) {
    setAuthMessage(error.message);
  } else {
    setAuthMessage("Password reset email sent. Check your inbox.");
  }

  setAuthLoading(false);
};

  const updatePassword = async () => {
  if (!newPassword) {
    setAuthMessage("Please enter a new password.");
    return;
  }

  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    setAuthMessage(error.message);
  } else {
    setAuthMessage("Password updated successfully.");
    setIsResetMode(false);
    setNewPassword("");

    await supabase.auth.signOut();
    setUser(null);
  }

  setAuthLoading(false);
};

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTransactions([]);
  };

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

  const handleSave = async () => {

  if (!user) {
    alert("Please log in first.");
    return;
  }

  if (!form.name || !form.amount) {
    alert("Please enter name and amount.");
    return;
  }

  const transactionData = {
    name: form.name,
    amount: Number(form.amount),
    type: form.type as "expense" | "income",
    category: finalCategory,
    date: form.date,
    recurrence: form.recurrence as "none" | "weekly" | "monthly" | "annually",
    dueDate: form.dueDate,
    status: "pending" as const,
  };

  if (editingId) {
    const updatedTransaction = {
      ...transactionData,
      id: editingId,
    };

    const saved = await updateTransaction(updatedTransaction);

    if (!saved) {
      alert("Update failed.");
      return;
    }

    setTransactions((current) =>
      current.map((t) => (t.id === editingId ? saved : t))
    );

    setSelectedDate(saved.date);
    setCurrentMonth(new Date(saved.date));
    resetForm();
    return;
  }

  const saved = await saveTransaction(transactionData);

  if (!saved) {
    alert("Save failed. Check Supabase table/RLS.");
    return;
  }

  setTransactions((current) => [saved, ...current]);
  setSelectedDate(saved.date);
  setCurrentMonth(new Date(saved.date));

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

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const markAsPaid = async (id: string) => {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  const paidTransaction = {
    ...transaction,
    status: "paid" as const,
  };

  await updateTransaction(paidTransaction);

  let nextTransaction: Transaction | null = null;

  if (
    transaction.type === "expense" &&
    transaction.recurrence &&
    transaction.recurrence !== "none"
  ) {
    nextTransaction = await createNextRecurringTransaction(transaction);
  }

  setTransactions((current) => {
    const updated = current.map((t) =>
      t.id === id ? paidTransaction : t
    );

    return nextTransaction ? [nextTransaction, ...updated] : updated;
  });
};

  const extendDueDate = async (id: string) => {
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

    const changed = updated.find((t) => t.id === id);
    if (changed) await updateTransaction(changed);

    setTransactions(updated);
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

  if (isResetMode) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-[2rem] bg-white/10 p-8 text-white">
        <h1 className="mb-4 text-3xl font-black">Create new password</h1>

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-3 w-full rounded-2xl bg-white p-3 text-slate-900"
        />

        <button
          onClick={updatePassword}
          className="w-full rounded-2xl bg-blue-500 p-3 font-bold text-white"
        >
          Update Password
        </button>

        {authMessage && (
          <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm">{authMessage}</p>
        )}
      </div>
    </main>
  );
}
  
  if (!user) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-black text-white">
          Expenses Tracker
        </h1>

        <p className="mb-5 text-blue-100">
          Log in with your email and password so your budget data is saved securely.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-2xl bg-white p-3 text-slate-900"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-2xl bg-white p-3 text-slate-900"
        />

        <button
          onClick={signIn}
          disabled={authLoading}
          className="w-full rounded-2xl bg-blue-500 p-3 font-bold text-white disabled:opacity-60"
        >
          {authLoading ? "Logging in..." : "Log In"}
        </button>

        <button
  onClick={signUp}
  disabled={authLoading}
  className="w-full rounded-2xl bg-green-500 p-3 font-bold text-white mt-2"
>
  Sign Up
</button>

        <button
  onClick={resetPassword}
  disabled={authLoading}
  className="mt-2 w-full rounded-2xl bg-white/10 p-3 font-bold text-white"
>
  Forgot password?
</button>

        {authMessage && (
          <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white">
            {authMessage}
          </p>
        )}
      </div>
    </main>
  );
}

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

            <div className="flex flex-col gap-3 md:flex-row">
  <p className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-blue-100">
    {user?.email}
  </p>

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

              <button
    onClick={signOut}
    className="rounded-2xl bg-white/20 px-4 py-3 font-bold text-white hover:bg-white/30"
  >
    Logout
  </button>
</div>
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
                    category:
                      e.target.value === "income" ? "Customize" : "Bills",
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
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
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
