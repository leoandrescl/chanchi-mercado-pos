'use client';

import React, { useState } from 'react';
import { Smartphone, X, Share, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  /** Compact mode: shows a small icon pill (for headers/navbars) */
  compact?: boolean;
}

export default function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { canInstall, isIOS, isInstalled, isPrompting, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !canInstall || dismissed) return null;

  const handleClick = () => {
    if (isIOS) setShowIOSGuide(true);
    else promptInstall();
  };

  return (
    <>
      {/* ── COMPACT MODE (for catalog header) ────────────── */}
      {compact ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleClick}
          disabled={isPrompting}
          title="Instalar ChanchiMercado"
          className="flex items-center gap-2 h-9 px-3 rounded-2xl
            bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest
            shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all
            disabled:opacity-60 shrink-0"
        >
          {isPrompting ? (
            <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={13} strokeWidth={2.5} />
          )}
          <span className="hidden sm:inline">{isPrompting ? '...' : 'Instalar'}</span>
        </motion.button>
      ) : (
        /* ── FULL MODE (for dashboard) ─────────────────────── */
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              {isPrompting ? (
                <div className="h-5 w-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <Smartphone size={20} strokeWidth={1.75} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">
                Instalar App
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                {isIOS ? 'Añadir a pantalla de inicio' : 'Sin descargas · Funciona sin internet'}
              </p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-widest">
              Gratis
            </div>
          </motion.button>

          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
            title="No mostrar"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}

      {/* ── iOS Step-by-Step Guide (shared for both modes) ─── */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
              className="fixed inset-0 z-[10001] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10002] bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="flex justify-center pt-4 pb-2">
                <div className="h-1.5 w-12 rounded-full bg-slate-200" />
              </div>

              <div className="px-7 pb-10 pt-4 space-y-7">
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
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                          {icon}
                        </div>
                        {step < 3 && <div className="h-5 w-px bg-slate-100" />}
                      </div>
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
