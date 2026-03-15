import { useCallback, useRef } from "react";

export const useSoundNotification = () => {
  const audioRef = useRef(null);

  const play = useCallback(async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification.mp3");
        audioRef.current.preload = "auto";
      }

      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (_err) {
      // Fallback beep when media file is missing or autoplay is blocked.
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const context = new AudioCtx();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gain.gain.setValueAtTime(0.001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.26);
      } catch (_fallbackErr) {
        // Ignore playback failures.
      }
    }
  }, []);

  return { playNotificationSound: play };
};
