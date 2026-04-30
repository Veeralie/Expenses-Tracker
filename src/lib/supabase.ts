import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flonbyhyhafzyqcmbqxi.supabase.co";
const supabaseAnonKey = "sb_publishable_0ynt254GmfAKKURC9D7qLA_OKEjRgPB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  recurrence?: "none" | "weekly" | "monthly" | "annually";
  dueDate?: string;
  status?: "pending" | "paid";
};

// 🔁 Map DB → App format
const mapFromDb = (row: any): Transaction => ({
  id: row.id,
  name: row.name,
  amount: Number(row.amount),
  type: row.type,
  category: row.category,
  date: row.date,
  recurrence: row.recurrence || "none",
  dueDate: row.due_date || row.date,
  status: row.status || "pending",
});

// 📥 GET
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data.map(mapFromDb);
}

// ➕ CREATE
export async function saveTransaction(
  transaction: Omit<Transaction, "id">
): Promise<Transaction | null> {
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
        status: transaction.status || "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    alert(error.message);
    return null;
  }

  return mapFromDb(data);
}

// ✏️ UPDATE (fixed version)
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
    console.error("Update error:", error);
    alert(error.message);
    return null;
  }

  return mapFromDb(data);
}

// ❌ DELETE
export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    alert(error.message);
  }
}

export async function createNextRecurringTransaction(
  transaction: Transaction
): Promise<Transaction | null> {
  if (!transaction.recurrence || transaction.recurrence === "none") {
    return null;
  }

  const nextDate = new Date(transaction.dueDate || transaction.date);

  if (transaction.recurrence === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  if (transaction.recurrence === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  if (transaction.recurrence === "annually") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return saveTransaction({
    name: transaction.name,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: nextDate.toISOString().slice(0, 10),
    recurrence: transaction.recurrence,
    dueDate: nextDate.toISOString().slice(0, 10),
    status: "pending",
  });
}
