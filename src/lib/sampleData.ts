import { supabase } from "./supabase";

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
  recurrence?: "none" | "weekly" | "monthly" | "annually";
  dueDate?: string;
  status?: "pending" | "paid";
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Load transactions error:", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    amount: Number(item.amount),
    type: item.type,
    category: item.category,
    date: item.date,
    recurrence: item.recurrence || "none",
    dueDate: item.due_date || item.date,
    status: item.status || "pending",
  }));
};

export const saveTransaction = async (
  transaction: Omit<Transaction, "id">
): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        name: transaction.name,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        recurrence: transaction.recurrence,
        due_date: transaction.dueDate,
        status: transaction.status,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Save transaction error:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    amount: Number(data.amount),
    type: data.type,
    category: data.category,
    date: data.date,
    recurrence: data.recurrence || "none",
    dueDate: data.due_date || data.date,
    status: data.status || "pending",
  };
};

export const updateTransaction = async (
  transaction: Transaction
): Promise<void> => {
  const { error } = await supabase
    .from("transactions")
    .update({
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      recurrence: transaction.recurrence,
      due_date: transaction.dueDate,
      status: transaction.status,
    })
    .eq("id", transaction.id);

  if (error) console.error("Update transaction error:", error);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) console.error("Delete transaction error:", error);
};
