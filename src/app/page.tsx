"use client";

import { useEffect, useState } from "react";
import { getTransactions, saveTransactions, Transaction } from "../lib/sampleData";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "expense",
    category: "",
  });

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const handleAdd = () => {
    if (!form.name || !form.amount) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      name: form.name,
      amount: Number(form.amount),
      type: form.type as "expense" | "income",
      category: form.category,
      date: new Date().toISOString(),
    };

    const updated = [...transactions, newTx];
    setTransactions(updated);
    saveTransactions(updated);

    setForm({ name: "", amount: "", type: "expense", category: "" });
  };

  const handleDelete = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Budget Tracker</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Amount"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleAdd}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-500">{t.category}</p>
            </div>

            <div className="text-right">
              <p
                className={
                  t.type === "expense" ? "text-red-500" : "text-green-500"
                }
              >
                {t.type === "expense" ? "-" : "+"}${t.amount}
              </p>

              <button
                onClick={() => handleDelete(t.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
