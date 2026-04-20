'use client';

import React, { useState } from 'react';
import { Smartphone, X, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { canInstall, isIOS, isInstalled, isPrompting, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't render if already installed or no install path available
  if (isInstalled || !canInstall || dismissed) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      promptInstall();
    }
  };

  return (
    <>
      {/* ── Install Button ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="relative"
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleClick}
          disabled={isPrompting}
          className="group flex items-center gap-3 w-full px-5 py-4 rounded-2xl
            bg-white/60 backdrop-blur-md border border-slate-200/80
            shadow-lg shadow-slate-900/5
            hover:bg-white hover:border-amber-200 hover:shadow-amber-100/50
            transition-all duration-300 disabled:opacity-60"
        >
          {/* Icon */}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            {isPrompting ? (
              <div className="h-5 w-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            ) : (
              <Smartphone size={20} strokeWidth={1.75} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">
              Instalar App
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              {isIOS ? 'Añadir a pantalla de inicio' : 'Sin descargas · Funciona sin internet'}
            </p>
          </div>

          {/* Badge */}
          <div className="shrink-0 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-widest">
            Gratis
          </div>
        </motion.button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors text-xs"
          title="No mostrar"
        >
          <X size={12} />
        </button>
      </motion.div>

      {/* ── iOS Guide Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
              className="fixed inset-0 z-[10001] bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10002] bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="h-1.5 w-12 rounded-full bg-slate-200" />
              </div>

              <div className="px-7 pb-10 pt-4 space-y-7">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1">Instalación</p>
                    <h3 className="font-serif text-2xl italic text-slate-900">ChanchiMercado</h3>
                  </div>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      icon: <Share size={22} className="text-blue-500" />,
                      title: 'Toca el botón Compartir',
                      description: 'El ícono de cuadrado con flecha ↑ en la barra inferior del navegador',
                    },
                    {
                      step: 2,
                      icon: <Plus size={22} className="text-slate-700" />,
                      title: 'Elige "Añadir a pantalla de inicio"',
                      description: 'Desliza hacia abajo en el menú hasta encontrar esta opción',
                    },
                    {
                      step: 3,
                      icon: <Smartphone size={22} className="text-amber-500" />,
                      title: '¡Listo! Ya está instalada',
                      description: 'ChanchiMercado aparecerá en tu pantalla de inicio como una app nativa',
                    },
                  ].map(({ step, icon, title, description }) => (
                    <div key={step} className="flex items-start gap-4">
                      {/* Step number + icon */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                          {icon}
                        </div>
                        {step < 3 && <div className="h-5 w-px bg-slate-100" />}
                      </div>
                      {/* Text */}
                      <div className="pt-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Paso {step}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 mb-0.5">{title}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  ¡Entendido!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
