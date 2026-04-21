'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  /** True when we should show the install entry point (native prompt, iOS, or Android manual path) */
  canInstall: boolean;
  /** Chrome/Edge etc. captured `beforeinstallprompt` — native sheet available */
  hasNativeInstallPrompt: boolean;
  /** True when running on iOS / iPadOS (Safari “Añadir a inicio”) */
  isIOS: boolean;
  /** Android browser (Chrome puede no entregar el evento si el sitio ya está instalado u otro motivo) */
  isAndroid: boolean;
  /** True when the app is already installed / running in standalone mode */
  isInstalled: boolean;
  /** True while waiting for the user to respond to the install prompt */
  isPrompting: boolean;
  /** Trigger the native install prompt when the event was already captured. Returns whether a prompt was shown. */
  promptInstall: () => Promise<boolean>;
  /**
   * En Android a veces `beforeinstallprompt` llega unos cientos de ms después del SW o del gesto.
   * Espera un poco y, si aparece el evento, abre el instalador nativo.
   */
  tryPromptAfterBriefWait: (maxMs?: number) => Promise<boolean>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (typeof navigator !== 'undefined' &&
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    setIsAndroid(/Android/i.test(ua));

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      deferredRef.current = ev;
      setDeferredPrompt(ev);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const mq = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const p = deferredRef.current;
    if (!p) return false;
    setIsPrompting(true);
    try {
      await p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      deferredRef.current = null;
      setDeferredPrompt(null);
      return true;
    } catch {
      return false;
    } finally {
      setIsPrompting(false);
    }
  }, []);

  const tryPromptAfterBriefWait = useCallback(
    async (maxMs = 3200) => {
      const step = 200;
      for (let waited = 0; waited < maxMs; waited += step) {
        if (deferredRef.current) {
          return promptInstall();
        }
        await new Promise((r) => setTimeout(r, step));
      }
      if (deferredRef.current) {
        return promptInstall();
      }
      return false;
    },
    [promptInstall]
  );

  const hasNativeInstallPrompt = deferredPrompt !== null;
  const canInstall = !isInstalled && (hasNativeInstallPrompt || isIOS || isAndroid);

  return {
    canInstall,
    hasNativeInstallPrompt,
    isIOS,
    isAndroid,
    isInstalled,
    isPrompting,
    promptInstall,
    tryPromptAfterBriefWait,
  };
}
