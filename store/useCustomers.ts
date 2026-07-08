import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  balance: number;
  legacy_id?: number | null;
}

interface CustomerStore {
  customers: Customer[];
  selectedCustomerId: string | null;
  addCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'legacy_id'>) => void;
  selectCustomer: (id: string | null) => void;
  updateBalance: (id: string, amount: number) => void;
  getSelectedCustomer: () => Customer | undefined;
  fetchCustomers: () => Promise<void>;
  addCustomerSupabase: (name: string, phone: string) => Promise<any>;
  updateCustomerSupabase: (id: string, name: string, phone: string) => Promise<void>;
  deleteCustomerSupabase: (id: string) => Promise<void>;
  globalTotal: number;
  lastMovements: any[];
  isFetchingMetrics: boolean;
  fetchGlobalMetrics: () => Promise<void>;
  showGlobalBalance: boolean;
  toggleGlobalBalance: () => void;
  deleteDebtSupabase: (debtId: string, debtorId: string, amount: number, description: string) => Promise<void>;
  updateDebtSupabase: (
    debtId: string,
    debtorId: string,
    newAmount: number,
    oldAmount: number,
    newDescription: string,
    newDateInput?: string
  ) => Promise<void>;
}

export const useCustomers = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomerId: null,
      globalTotal: 0,
      lastMovements: [],
      isFetchingMetrics: false,
      showGlobalBalance: true,
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
          .select('*');

        if (debtorsError) {
          console.error('Error fetching debtors:', debtorsError);
          return;
        }

        const formattedCustomers: Customer[] = (debtors || []).map((d: any) => {
          return {
            id: d.id,
            name: d.name,
            whatsapp: d.phone || '',
            balance: d.balance || 0,
            legacy_id: d.legacy_id,
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
        // 1. Fetch total unpaid debt directly from debtors table
        const { data: totalData, error: totalError } = await supabase
          .from('debtors')
          .select('balance');

        if (!totalError && totalData) {
          const total = totalData.reduce((acc, d) => acc + (d.balance || 0), 0);
          set({ globalTotal: total });
        }

        // 2. Fetch recent movements (debts ledger)
        const { data: movements, error: movementsError } = await supabase
          .from('debts')
          .select('*, debtors(name)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(50);

        if (!movementsError && movements) {
          set({ lastMovements: movements });
        }
        set({ isFetchingMetrics: false });
      },
      addCustomerSupabase: async (name: string, phone: string) => {
        const cleanPhone = phone.replace(/\D/g, ''); // Clear formatting, only numbers
        
        const { data, error } = await supabase
          .from('debtors')
          .insert({ name, phone: cleanPhone })
          .select()
          .single();

        if (error) throw error;

        // Refresh customers to include the new one
        await get().fetchCustomers();
        return data;
      },
      updateCustomerSupabase: async (id: string, name: string, phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const { error } = await supabase
          .from('debtors')
          .update({ name, phone: cleanPhone, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        await get().fetchCustomers();
      },
      deleteCustomerSupabase: async (id: string) => {
        const { error } = await supabase
          .from('debtors')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Deselect if active
        if (get().selectedCustomerId === id) {
          set({ selectedCustomerId: null });
        }
        
        await get().fetchCustomers();
      },
      toggleGlobalBalance: () => set((state) => ({ showGlobalBalance: !state.showGlobalBalance })),
      deleteDebtSupabase: async (debtId, debtorId, amount, description) => {
        const { deleteDebtAction } = await import('@/app/actions/history');
        const res = await deleteDebtAction(debtId, debtorId, amount, description);
        if (res.success) {
          await get().fetchCustomers();
        } else {
          throw new Error(res.error);
        }
      },
      updateDebtSupabase: async (debtId, debtorId, newAmount, oldAmount, newDescription, newDateInput) => {
        const { updateDebtAction } = await import('@/app/actions/history');
        const res = await updateDebtAction(debtId, debtorId, newAmount, oldAmount, newDescription, newDateInput);
        if (res.success) {
          await get().fetchCustomers();
        } else {
          throw new Error(res.error);
        }
      },
    }),
    {
      name: 'chanchi-customers',
    }
  )
);
