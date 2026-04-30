import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flonbyhyhafzyqcmbqxi.supabase.co";
const supabaseAnonKey = "sb_publishable_0ynt254GmfAKKURC9D7qLA_OKEjRgPB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id?: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  recurrence: "none" | "weekly" | "monthly" | "annually";
  dueDate?: string;
  status?: "pending" | "paid";
};

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function saveTransaction(tx: Transaction) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([tx])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function updateTransaction(
  transaction: Transaction
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .update({
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      recurrence: transaction.recurrence,
      due_date: transaction.dueDate,
      status: transaction.status || "pending",
    })
    .eq("id", transaction.id)
    .select()
    .single();

  if (error) {
    console.error("Update transaction error:", error);
    alert(error.message);
    return null;
  }

  return mapFromDb(data);
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
  }
}
