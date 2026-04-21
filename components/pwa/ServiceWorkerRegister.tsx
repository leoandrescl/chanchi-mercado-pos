'use client';

import { useEffect } from 'react';

/**
 * Registra el SW en `/sw.js` (scope `/`) para que Chrome pueda disparar
 * `beforeinstallprompt` en móvil. La primera carga puede requerir un refresh
 * hasta que el SW controle la página.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const { protocol, hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (protocol !== 'https:' && !isLocal) return;

    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (cancelled) return;
        void reg.update();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
