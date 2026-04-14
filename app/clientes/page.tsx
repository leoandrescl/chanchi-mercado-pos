'use client';

import React, { useState, useEffect } from 'react';
import { useCustomers, Customer } from '@/store/useCustomers';
import { Search, UserPlus, Edit2, Trash2, ArrowLeft, Phone, Wallet, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerAdminModal from '@/components/customers/CustomerAdminModal';

export default function CustomersPage() {
  const { customers, fetchCustomers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');

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

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('delete');
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#FDFCF9] pb-24">
      {/* Header Estilo Boutique */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95 bg-white shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-3xl italic text-slate-900 tracking-tight">Gestión de Deudores</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">Directorio de Clientes</p>
          </div>
        </div>

        <button 
          onClick={handleCreate}
          className="h-14 px-6 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          <UserPlus size={20} strokeWidth={1.5} />
          <span className="font-sans font-bold text-sm tracking-wide hidden sm:inline">Nuevo Cliente</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-10">
        {/* Buscador de Alta Densidad */}
        <div className="relative mb-10">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
            <Search size={22} />
          </div>
          <input
            type="text"
            placeholder="¿A quién buscas?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 pl-16 pr-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm focus:border-slate-300 focus:shadow-md transition-all font-sans text-lg text-slate-900 placeholder:text-slate-300"
          />
        </div>

        {/* Listado de Clientes */}
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <span className="font-serif text-xl italic font-bold leading-none">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 text-lg group-hover:translate-x-1 transition-transform duration-300">{customer.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                          <Phone size={12} className={customer.whatsapp ? 'text-emerald-500' : ''} />
                          {customer.whatsapp || 'Sin teléfono'}
                        </div>
                        {customer.legacy_id && (
                          <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-tighter">
                            Legacy #{customer.legacy_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right mr-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">Saldo Pendiente</p>
                      <span className={`font-sans text-xl font-medium tabular-nums ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatPrice(customer.balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 h-14 bg-slate-50 rounded-2xl px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="h-10 w-10 rounded-xl bg-white text-slate-400 hover:text-slate-900 hover:shadow-sm flex items-center justify-center transition-all active:scale-90"
                      >
                        <Edit2 size={16} />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200" />
                      <button 
                        onClick={() => handleDelete(customer)}
                        className="h-10 w-10 rounded-xl bg-white text-rose-300 hover:text-rose-600 hover:shadow-sm flex items-center justify-center transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredCustomers.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Search size={40} strokeWidth={1} />
              </div>
              <p className="font-serif italic text-lg text-slate-400">No encontramos ningún deudor con ese nombre...</p>
            </div>
          )}
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
