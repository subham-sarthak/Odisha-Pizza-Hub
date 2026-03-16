import { useCallback, useEffect, useRef } from "react";

// Persistent AudioContext shared for the lifetime of the hook.
let sharedContext = null;

const getAudioContext = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext) {
    sharedContext = new AudioCtx();
  }
  return sharedContext;
};

const playBeep = async (context, frequency, startTime, duration) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.01);
};

export const useSoundNotification = () => {
  const unlockedRef = useRef(false);

  // Unlock AudioContext on first user interaction so subsequent calls always work.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      const context = getAudioContext();
      if (context && context.state === "suspended") {
        context.resume().catch(() => {});
      }
      unlockedRef.current = true;
      document.removeEventListener("click", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
    };

    document.addEventListener("click", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("touchstart", unlock, true);

    return () => {
      document.removeEventListener("click", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      const context = getAudioContext();
      if (!context) return;

      // Resume in case it is still suspended (e.g. called before first interaction).
      if (context.state === "suspended") {
        await context.resume();
      }

      const now = context.currentTime;
      // Three ascending tones: 660 Hz → 880 Hz → 1100 Hz, 0.18 s each, 0.22 s apart.
      await playBeep(context, 660, now, 0.18);
      await playBeep(context, 880, now + 0.22, 0.18);
      await playBeep(context, 1100, now + 0.44, 0.22);
    } catch (_err) {
      // Silently ignore if audio is unavailable.
    }
  }, []);

  return { playNotificationSound };
};
