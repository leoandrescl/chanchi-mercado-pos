'use client';

import { useEffect, useState, useCallback } from 'react';

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
  /** Android browser (typical case: need menu install if no native prompt yet) */
  isAndroid: boolean;
  /** True when the app is already installed / running in standalone mode */
  isInstalled: boolean;
  /** True while waiting for the user to respond to the install prompt */
  isPrompting: boolean;
  /** Trigger the native install prompt (Android/Chrome). No-op on iOS or if no event. */
  promptInstall: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    // iPhone / iPod / iPad (incl. iPadOS con UA de “Macintosh”)
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (typeof navigator !== 'undefined' &&
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    setIsAndroid(/Android/i.test(ua));

    // Detect standalone (already installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore – iOS Safari specific
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    // Capture the Chrome/Android install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If installed from homescreen, update state
    const mq = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt]);

  const hasNativeInstallPrompt = deferredPrompt !== null;
  // Android: en muchos celulares `beforeinstallprompt` no llega (PWA ya instalada mismo dominio,
  // incógnito, políticas, etc.) pero igual conviene mostrar el acceso con guía al menú ⋮.
  const canInstall =
    !isInstalled && (hasNativeInstallPrompt || isIOS || isAndroid);

  return {
    canInstall,
    hasNativeInstallPrompt,
    isIOS,
    isAndroid,
    isInstalled,
    isPrompting,
    promptInstall,
  };
}
