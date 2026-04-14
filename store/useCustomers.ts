import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  balance: number;
}

interface CustomerStore {
  customers: Customer[];
  selectedCustomerId: string | null;
  addCustomer: (customer: Omit<Customer, 'id' | 'balance'>) => void;
  selectCustomer: (id: string | null) => void;
  updateBalance: (id: string, amount: number) => void;
  getSelectedCustomer: () => Customer | undefined;
  fetchCustomers: () => Promise<void>;
  globalTotal: number;
  lastMovements: any[];
  isFetchingMetrics: boolean;
  fetchGlobalMetrics: () => Promise<void>;
}

export const useCustomers = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomerId: null,
      globalTotal: 0,
      lastMovements: [],
      isFetchingMetrics: false,
      addCustomer: (data) => {
        const newCustomer: Customer = {
          ...data,
          id: Math.random().toString(36).substring(2, 9),
          balance: 0,
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },
      selectCustomer: (id) => set({ selectedCustomerId: id }),
      updateBalance: (id: string, amount: number) => {
        set((state: CustomerStore) => ({
          customers: state.customers.map((c: Customer) =>
            c.id === id ? { ...c, balance: c.balance + amount } : c
          ),
        }));
      },
      getSelectedCustomer: () => {
        const { customers, selectedCustomerId } = get() as CustomerStore;
        return customers.find((c: Customer) => c.id === selectedCustomerId);
      },
      fetchCustomers: async () => {
        const { data: debtors, error: debtorsError } = await supabase
          .from('debtors')
          .select('*, debts(amount, is_paid)');

        if (debtorsError) {
          console.error('Error fetching debtors:', debtorsError);
          return;
        }

        const formattedCustomers: Customer[] = (debtors || []).map((d: any) => {
          const balance = d.debts?.reduce((acc: number, debt: any) => {
            return acc + (debt.is_paid ? 0 : debt.amount);
          }, 0) || 0;

          return {
            id: d.id,
            name: d.name,
            whatsapp: d.phone || '',
            balance,
          };
        });

        // Sort by name
        formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));

        set({ customers: formattedCustomers });
        // Also update global metrics whenever we refresh customers
        get().fetchGlobalMetrics();
      },
      fetchGlobalMetrics: async () => {
        set({ isFetchingMetrics: true });
        // 1. Fetch total unpaid debt
        const { data: totalData, error: totalError } = await supabase
          .from('debts')
          .select('amount')
          .eq('is_paid', false);

        if (!totalError && totalData) {
          const total = totalData.reduce((acc, d) => acc + d.amount, 0);
          set({ globalTotal: total });
        }

        // 2. Fetch last 5 movements
        const { data: movements, error: movementsError } = await supabase
          .from('debts')
          .select('*, debtors(name)')
          .order('date', { ascending: false })
          .limit(5);

        if (!movementsError && movements) {
          set({ lastMovements: movements });
        }
        set({ isFetchingMetrics: false });
      },
    }),
    {
      name: 'chanchi-customers',
    }
  )
);
