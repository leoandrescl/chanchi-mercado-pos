'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  LayoutDashboard,
  ShoppingBag,
  History
} from 'lucide-react';

interface AdminNavbarProps {
  onAddProduct?: () => void;
}

export default function AdminNavbar({ onAddProduct }: AdminNavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Clientes',
      href: '/clientes',
      icon: Users,
      color: 'emerald'
    },
    {
      label: 'Inventario',
      href: '/inventario',
      icon: LayoutDashboard,
      color: 'blue'
    },
    {
      label: 'Catálogo',
      href: '/acceso-total-chanchi/catalogo',
      icon: ShoppingBag,
      color: 'amber'
    }
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-50 shadow-sm transition-all duration-300">
      <div className="mx-auto w-full max-w-xl px-2 py-3 flex flex-col gap-4">
        {/* Brand */}
        <Link href="/acceso-total-chanchi" className="flex flex-col items-center text-center leading-none group mx-auto">
          <span className="font-serif text-2xl text-slate-900 tracking-tight transition-all group-hover:text-amber-600">ChanchiMercado</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-400 mt-1">Mercado & Punto de Venta</span>
        </Link>

        {/* Actions & Navigation */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Main Action - TRANSFORMED TO HOME */}
          <Link
            href="/acceso-total-chanchi"
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 shrink-0"
          >
            <div className="h-8 w-8 flex items-center justify-center">
              <Home size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest leading-none text-center">Inicio</span>
          </Link>



          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const colorMap: Record<string, string> = {
                emerald: 'hover:bg-emerald-50 hover:text-emerald-600',
                amber: 'hover:bg-amber-50 hover:text-amber-600',
                blue: 'hover:bg-blue-50 hover:text-blue-600',
                purple: 'hover:bg-purple-50 hover:text-purple-600'
              };

              const activeMap: Record<string, string> = {
                emerald: 'bg-emerald-50 text-emerald-600',
                amber: 'bg-amber-50 text-amber-600',
                blue: 'bg-blue-50 text-blue-600',
                purple: 'bg-purple-50 text-purple-600'
              };

              const colorClasses = colorMap[item.color] || colorMap.amber;
              const activeClasses = activeMap[item.color] || activeMap.amber;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl transition-all duration-200 shrink-0
                    ${isActive ? activeClasses : `text-slate-400 ${colorClasses}`}
                  `}
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none text-center ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
