/**
 * Audio utility for subtle POS micro-interactions.
 * Uses Web Audio API to generate a clean "pop" sound without external assets.
 */

export const playPop = () => {
  if (typeof window === 'undefined') return;

  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    
    // Cleanup
    setTimeout(() => {
      context.close();
    }, 200);
  } catch (e) {
    console.warn('Audio feedback blocked or not supported', e);
  }
};
