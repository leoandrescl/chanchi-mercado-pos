'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const pathname = usePathname();
  const router = useRouter();

  const CORRECT_PIN = process.env.NEXT_PUBLIC_APP_PIN || '1234';

  useEffect(() => {
    const authStatus = sessionStorage.getItem('chanchi_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // If not authenticated and NOT on the secret access page, kick to home
    if (!isLoading && !isAuthenticated && pathname !== '/acceso-total-chanchi') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          sessionStorage.setItem('chanchi_auth', 'true');
          setIsAuthenticated(true);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  if (isLoading) return null;

  if (isAuthenticated) return <>{children}</>;

  // If we are here, and user is NOT on secret route, they should have been redirected by the useEffect.
  // We show the PIN ONLY on /acceso-total-chanchi
  if (pathname !== '/acceso-total-chanchi') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Halloween Decor */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <span className="absolute left-8 top-10 text-3xl hv-float opacity-70">🦇</span>
        <span className="absolute right-10 top-24 text-3xl hv-float hv-delay-2 opacity-70">🕷️</span>
        <span className="absolute left-12 bottom-16 text-3xl hv-float hv-delay-3 opacity-70">🎃</span>
        <span className="absolute right-14 bottom-24 text-3xl hv-float opacity-70">👻</span>
      </div>

      <div className="relative w-full max-w-sm px-8 py-12 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[2.5rem] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Header Section */}
        <div className="mb-10 relative">
          <div className="flex justify-center mb-6">
            <div className={`h-24 w-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center transition-all duration-500 ${error ? 'animate-shake bg-rose-50 border-rose-100' : 'border border-slate-50'}`}>
              <div className="relative">
                <Lock className={`h-10 w-10 transition-colors duration-300 ${error ? 'text-rose-500' : 'text-slate-900 font-light'}`} strokeWidth={1.2} />
                {!error && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
              </div>
            </div>
          </div>

          <h1 className="font-serif text-4xl italic text-slate-900 tracking-tight mb-2">Chanchi Mercado 🎃</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Security Protocol Required</p>
        </div>

        {/* PIN Entry Visualization */}
        <div className="flex justify-center gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                i < pin.length 
                ? (error ? 'bg-rose-500 scale-125' : 'bg-slate-900 scale-125 shadow-lg shadow-slate-900/20') 
                : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Number Pad Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="group relative h-16 w-full rounded-2xl bg-white/60 text-xl font-medium text-slate-900 shadow-sm border border-white/80 hover:bg-white hover:shadow-md active:scale-95 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">{num}</span>
              <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <div className="h-16 flex items-center justify-center opacity-20 italic font-serif text-xs text-slate-400">PIN</div>
          <button
            onClick={() => handleKeyPress('0')}
            className="group relative h-16 w-full rounded-2xl bg-white/60 text-xl font-medium text-slate-900 shadow-sm border border-white/80 hover:bg-white hover:shadow-md active:scale-95 transition-all duration-200 overflow-hidden"
          >
             <span className="relative z-10">0</span>
             <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleDelete}
            className="h-16 w-full flex items-center justify-center text-slate-400 hover:text-slate-900 active:scale-90 transition-all duration-200"
          >
            <Delete size={20} strokeWidth={1.5} />
          </button>
        </div>
        
        <p className="text-[9px] font-medium text-slate-300 tracking-widest mt-6 uppercase">Encrypted Session</p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
