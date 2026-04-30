"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function Home() {
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
    form.category === "Customize" && customCategory
      ? customCategory
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
              recurrence: form.recurrence as any,
              dueDate: form.dueDate,
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
      recurrence: form.recurrence as any,
      dueDate: form.dueDate,
      status: "pending",
    };

    saveAll([...transactions, newTx]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    saveAll(transactions.filter((t) => t.id !== id));
  };

  const markPaid = (id: string) => {
    saveAll(
      transactions.map((t) =>
        t.id === id ? { ...t, status: "paid" } : t
      )
    );
  };

  const extend = (t: Transaction) => {
    const days = prompt("Extend how many days?");
    if (!days) return;

    const newDate = new Date(t.dueDate!);
    newDate.setDate(newDate.getDate() + Number(days));

    saveAll(
      transactions.map((tx) =>
        tx.id === t.id
          ? { ...tx, dueDate: newDate.toISOString().slice(0, 10) }
          : tx
      )
    );
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
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const balance = income - expenses;

  const chartData = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      amount: transactions
        .filter((t) => t.category === cat)
        .reduce((s, t) => s + t.amount, 0),
    }));
  }, [transactions]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex justify-between">
          <h1 className="text-3xl font-black">Expenses Tracker</h1>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              localStorage.setItem("currency", e.target.value);
            }}
            className="rounded-xl p-2 text-black"
          >
            {Object.keys(currencySymbols).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card title="Income" value={income} currency={currencySymbols[currency]} />
          <Card title="Expenses" value={expenses} currency={currencySymbols[currency]} />
          <Card title="Balance" value={balance} currency={currencySymbols[currency]} />
        </div>

        {/* CALENDAR */}
        <div className="bg-white/10 p-5 rounded-3xl mb-6">
          <div className="flex justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>◀</button>
            <h2>{currentMonth.toLocaleString("default",{month:"long",year:"numeric"})}</h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>▶</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, i) =>
              day ? (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className="bg-white p-2 text-black rounded-xl"
                >
                  {new Date(day).getDate()}
                </button>
              ) : (
                <div key={i} />
              )
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-xl text-black flex justify-between">
              <div>
                {t.name}
                <div className="text-xs">{t.category}</div>
              </div>

              <div>
                {currencySymbols[currency]}{t.amount}

                <div className="flex gap-2 mt-2">
                  <button onClick={() => markPaid(t.id)}>Paid</button>
                  <button onClick={() => extend(t)}>Extend</button>
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

function Card({ title, value, currency }: any) {
  return (
    <div className="bg-white p-4 rounded-xl text-black">
      <div>{title}</div>
      <div className="text-xl font-bold">
        {currency}{value}
      </div>
    </div>
  );
}
