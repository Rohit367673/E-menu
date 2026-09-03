/**
 * Synthesizes a clean, pleasant café order chime using the Web Audio API.
 * No external sound files or asset loading needed.
 */
export function playOrderNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic double bell chime (D5 587.33Hz -> A5 880Hz)
    const playBell = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playBell(587.33, now, 0.45);        // Note 1: D5
    playBell(880.0, now + 0.14, 0.65);   // Note 2: A5
  } catch (err) {
    console.warn('Audio chime playback blocked or unsupported:', err);
  }
}
