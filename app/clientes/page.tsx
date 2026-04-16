'use client';

import React, { useState, useEffect } from 'react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { UserCheck, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerAdminModal from '@/components/customers/CustomerAdminModal';
import CustomerCard from '@/components/customers/CustomerCard';
import HeaderPage from '@/components/ui/HeaderPage';
import InputSearch from '@/components/ui/InputSearch';
import Button from '@/components/ui/Button';
import { getDebtorFullAudit } from '@/lib/actions/reporting';
import { generateFullAuditMessage } from '@/lib/whatsapp';

export default function CustomersPage() {
  const { customers, fetchCustomers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
  const [loadingWhatsAppId, setLoadingWhatsAppId] = useState<string | null>(null);
  
  const router = useRouter();
  const selectCustomerStore = useCustomers(state => state.selectCustomer);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleEnterProfile = (customer: Customer) => {
    selectCustomerStore(customer.id);
    router.push('/');
  };

  const handleWhatsApp = async (customer: Customer) => {
    if (!customer.whatsapp || loadingWhatsAppId) return;
    
    setLoadingWhatsAppId(customer.id);
    try {
      const result = await getDebtorFullAudit(customer.id);
      if (result.success && result.data) {
        const link = generateFullAuditMessage({
          customerName: customer.name,
          phone: customer.whatsapp,
          totalPurchases: result.data.totalPurchases,
          totalAbonos: result.data.totalAbonos,
          finalBalance: result.data.finalBalance,
          monthsData: result.data.monthsData
        });
        window.open(link, '_blank');
      } else {
        throw new Error(result.error || 'Error al generar reporte');
      }
    } catch (error) {
      console.error('Error WhatsApp Detail:', error);
      // Fallback to simple message if audit fails
      const phone = customer.whatsapp.replace(/\D/g, '');
      const message = `¡Hola ${customer.name}! Tu total fiado es de *${formatPrice(customer.balance)}*.`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } finally {
      setLoadingWhatsAppId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFCF9] px-4 sm:px-12 py-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        <HeaderPage 
          title="Gestión de Deudores"
          primaryAction={{
            label: "Nuevo Deudor",
            onClick: handleCreate
          }}
        />

        <div className="space-y-8">
          <InputSearch 
            placeholder="¿A quién busca?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  index={index}
                  onCardClick={handleEnterProfile}
                  onWhatsAppClick={handleWhatsApp}
                  onEditClick={handleEdit}
                  loadingWhatsApp={loadingWhatsAppId === customer.id}
                />
              ))}
            </AnimatePresence>

            {filteredCustomers.length === 0 && (
              <div className="py-24 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <Search size={32} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-slate-300 text-lg">No encontramos resultados...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        mode={modalMode}
      />
    </main>
  );
}
