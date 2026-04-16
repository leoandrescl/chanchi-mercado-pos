'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'default', 
  fullWidth = false, 
  icon, 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseStyles = "flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-slate-950 text-white font-bold tracking-tight hover:bg-slate-800 rounded-xl shadow-sm",
    secondary: "bg-white text-slate-900 border border-slate-200 font-semibold hover:bg-slate-50 rounded-xl shadow-sm",
    ghost: "text-slate-500 font-medium hover:text-slate-900",
    outline: "border border-slate-200 bg-transparent"
  };

  const sizes = {
    default: "h-12 px-6 text-sm",
    large: "h-14 px-8 text-base"
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
