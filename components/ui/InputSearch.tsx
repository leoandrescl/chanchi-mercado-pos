'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface InputSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export default function InputSearch({ containerClassName, ...props }: InputSearchProps) {
  return (
    <div className={`relative w-full ${containerClassName || ''}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input 
        type="text" 
        {...props}
        className={`w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 text-sm focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:outline-none transition-all shadow-sm ${props.className || ''}`}
      />
    </div>
  );
}
