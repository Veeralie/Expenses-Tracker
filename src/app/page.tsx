"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("USD");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "expense",
    category: "",
  });

  useEffect(() => {
    setTransactions(getTransactions());

    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem("currency", value);
  };

  const handleAdd = () => {
    if (!form.name || !form.amount) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      name: form.name,
      amount: Number(form.amount),
      type: form.type as "expense" | "income",
      category: form.category || "Other",
      date: new Date().toISOString(),
    };

    const updated = [...transactions, newTx];
    setTransactions(updated);
    saveTransactions(updated);

    setForm({
      name: "",
      amount: "",
      type: "expense",
      category: "",
    });
  };

  const handleDelete = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl bg-blue-700 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Budget Tracker</h1>
          <p className="mt-1 text-blue-100">
            Track income, bills, and expenses in your own currency.
          </p>

          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="mt-4 w-full rounded-xl border-0 p-3 text-slate-900"
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

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Income</p>
            <p className="text-2xl font-bold text-green-600">
              {currencySymbols[currency]}
              {income}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {currencySymbols[currency]}
              {expenses}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Balance</p>
            <p
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-blue-700" : "text-red-600"
              }`}
            >
              {currencySymbols[currency]}
              {balance}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-4 text-xl font-bold">Add Transaction</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="rounded-xl border p-3"
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border p-3"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border p-3"
            />
          </div>

          <button
            onClick={handleAdd}
            className="mt-4 w-full rounded-xl bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800"
          >
            Add Transaction
          </button>
        </div>

        <div className="space-y-3">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow"
            >
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-slate-500">{t.category}</p>
              </div>

              <div className="text-right">
                <p
                  className={`font-bold ${
                    t.type === "expense" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {t.type === "expense" ? "-" : "+"}
                  {currencySymbols[currency]}
                  {t.amount}
                </p>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-sm text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
