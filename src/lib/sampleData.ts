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

export const getTransactions = (): Transaction[] => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem("transactions") || "[]");
  } catch {
    return [];
  }
};

export const saveTransactions = (data: Transaction[]) => {
  localStorage.setItem("transactions", JSON.stringify(data));
};
