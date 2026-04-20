'use server';

import { supabase } from '@/lib/supabase';

export interface BackupData {
  metadata: {
    exportedAt: string;
    version: string;
    description: string;
    totalCustomers: number;
    totalProducts: number;
    totalDebts: number;
  };
  customers: {
    id: string;
    name: string;
    phone: string;
    balance: number;
    legacy_id: number | null;
    created_at: string;
    debts: {
      id: string;
      description: string;
      amount: number;
      remaining_amount: number | null;
      is_paid: boolean;
      date: string;
      created_at: string;
    }[];
  }[];
  products: {
    id: string;
    name: string;
    price: number;
    category: string | null;
    image_url: string | null;
    stock: number | null;
    created_at: string;
  }[];
}

export async function generateBackup(): Promise<{ success: true; data: BackupData } | { success: false; error: string }> {
  try {
    // 1. Fetch all customers (debtors)
    const { data: debtors, error: debtorsError } = await supabase
      .from('debtors')
      .select('*')
      .order('name', { ascending: true });

    if (debtorsError) throw debtorsError;

    // 2. Fetch all debts
    const { data: allDebts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .order('date', { ascending: true });

    if (debtsError) throw debtsError;

    // 3. Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (productsError) throw productsError;

    // 4. Group debts by debtor
    const debtsByDebtor: Record<string, any[]> = {};
    for (const debt of allDebts || []) {
      if (!debtsByDebtor[debt.debtor_id]) {
        debtsByDebtor[debt.debtor_id] = [];
      }
      debtsByDebtor[debt.debtor_id].push({
        id: debt.id,
        description: debt.description,
        amount: debt.amount,
        remaining_amount: debt.remaining_amount ?? null,
        is_paid: debt.is_paid,
        date: debt.date,
        created_at: debt.created_at,
      });
    }

    // 5. Build structured customer data
    const customers = (debtors || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone || '',
      balance: d.balance || 0,
      legacy_id: d.legacy_id ?? null,
      created_at: d.created_at,
      debts: debtsByDebtor[d.id] || [],
    }));

    const backupData: BackupData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        description: 'Respaldo completo ChanchiMercado — clientes, movimientos y productos',
        totalCustomers: customers.length,
        totalProducts: (products || []).length,
        totalDebts: (allDebts || []).length,
      },
      customers,
      products: (products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category ?? null,
        image_url: p.image_url ?? null,
        stock: p.stock ?? null,
        created_at: p.created_at,
      })),
    };

    return { success: true, data: backupData };
  } catch (err: any) {
    console.error('Backup error:', err);
    return { success: false, error: err.message };
  }
}
