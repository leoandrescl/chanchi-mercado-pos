import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  customerId?: string;
  customerName?: string;
  type: 'Venta' | 'Abono' | 'Nuevo Cliente';
  amount: number;
  items?: string;
  date: string;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  clearHistory: () => void;
}

export const useTransactions = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (data) => {
        const newTransaction: Transaction = {
          ...data,
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          date: new Date().toISOString(),
        };
        set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
      },
      clearHistory: () => set({ transactions: [] }),
    }),
    {
      name: 'chanchi-transactions',
    }
  )
);
