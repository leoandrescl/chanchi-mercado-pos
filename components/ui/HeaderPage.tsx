'use client';

import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';

interface HeaderPageProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  className?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export default function HeaderPage({ 
  title, 
  backHref = "/acceso-total-chanchi", 
  onBack,
  className,
  primaryAction 
}: HeaderPageProps) {
  
  const BackWrapper = ({ children }: { children: React.ReactNode }) => {
    const defaultClassName = "flex items-center justify-center w-12 h-12 bg-white rounded-full border border-slate-100 shadow-sm hover:bg-slate-50 transition-all shrink-0 active:scale-95";
    
    if (onBack) {
      return (
        <button onClick={onBack} className={defaultClassName}>
          {children}
        </button>
      );
    }
    
    if (backHref) {
      return (
        <Link href={backHref} className={defaultClassName}>
          {children}
        </Link>
      );
    }

    return null;
  };

  return (
    <header className={className || "flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 mb-8 border-b border-slate-100 px-6 sm:px-0"}>
      <div className="flex items-center gap-4">
        <BackWrapper>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </BackWrapper>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
          {title}
        </h1>
      </div>
      
      {primaryAction && (
        <Button 
          onClick={primaryAction.onClick}
          icon={primaryAction.icon || <Plus className="w-5 h-5" />}
        >
          {primaryAction.label}
        </Button>
      )}
    </header>
  );
}
