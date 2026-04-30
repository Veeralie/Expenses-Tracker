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


// ✅ GET ALL
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


// ✅ INSERT
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


// ✅ UPDATE
export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}


// ✅ DELETE
export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
  }
}
