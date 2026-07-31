import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { balanceAfterByMovementId } from '@/lib/debt/balanceAfterMovements';

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
  setBalance: (id: string, balance: number) => void;
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
      setBalance: (id: string, balance: number) => {
        set((state: CustomerStore) => ({
          customers: state.customers.map((c: Customer) =>
            c.id === id ? { ...c, balance } : c
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
          .select('*, debtors(name, balance)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(50);

        if (!movementsError && movements && movements.length > 0) {
          const debtorIds = [...new Set(movements.map((m: { debtor_id: string }) => m.debtor_id))];

          // Full ledger for those clients → Total Fiado after each movement
          const ledgerRows: {
            id: string;
            debtor_id: string;
            amount: number;
            date: string;
            created_at?: string | null;
          }[] = [];
          const pageSize = 1000;
          for (let from = 0; ; from += pageSize) {
            const { data: page, error: ledgerError } = await supabase
              .from('debts')
              .select('id, debtor_id, amount, date, created_at')
              .in('debtor_id', debtorIds)
              .range(from, from + pageSize - 1);
            if (ledgerError) break;
            if (!page || page.length === 0) break;
            ledgerRows.push(...page);
            if (page.length < pageSize) break;
          }

          const balanceByDebtor: Record<string, number> = {};
          for (const m of movements) {
            const bal = (m as { debtors?: { balance?: number } }).debtors?.balance;
            if (typeof bal === 'number') balanceByDebtor[m.debtor_id] = bal;
          }

          const afterMap = balanceAfterByMovementId(ledgerRows, balanceByDebtor);

          set({
            lastMovements: movements.map((m) => ({
              ...m,
              balance_after: afterMap.get(m.id) ?? (m as { debtors?: { balance?: number } }).debtors?.balance ?? 0,
            })),
          });
        } else if (!movementsError) {
          set({ lastMovements: movements || [] });
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
    }),
    {
      name: 'chanchi-customers',
    }
  )
);
