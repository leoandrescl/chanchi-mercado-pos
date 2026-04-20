'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  /** True when the PWA can be installed on this device */
  canInstall: boolean;
  /** True when running on iOS (Safari install banner) */
  isIOS: boolean;
  /** True when the app is already installed / running in standalone mode */
  isInstalled: boolean;
  /** True while waiting for the user to respond to the install prompt */
  isPrompting: boolean;
  /** Trigger the native install prompt (Android/Chrome). No-op on iOS. */
  promptInstall: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

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

  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  return { canInstall, isIOS, isInstalled, isPrompting, promptInstall };
}
