import { useCallback, useEffect, useState } from 'react';

export interface SoundPlayer {
  key(): void;
  space(): void;
  bell(): void;
  carriageReturn(): void;
  stamp(): void;
}

type AudioContextConstructor = typeof AudioContext;

/** Every sound is synthesized from a shared noise buffer and a few oscillators. */
class TypewriterSynth implements SoundPlayer {
  enabled = true;
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;

  /** Browsers only allow audio after a user gesture, so this runs on the first pointer/key event. */
  unlock() {
    if (!this.ctx) {
      const AC: AudioContextConstructor | undefined =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const length = Math.floor(this.ctx.sampleRate * 0.6);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private running(): AudioContext | null {
    return this.enabled && this.ctx?.state === 'running' ? this.ctx : null;
  }

  private burst(c: AudioContext, t: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass') {
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const amp = c.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(amp).connect(c.destination);
    src.start(t, Math.random() * 0.4);
    src.stop(t + dur + 0.02);
  }

  private tone(c: AudioContext, t: number, freq: number, dur: number, gain: number, type: OscillatorType = 'sine') {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const amp = c.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  key = () => {
    const c = this.running();
    if (!c) return;
    const t = c.currentTime;
    this.burst(c, t, 0.035, 1600 + Math.random() * 900, 1.4, 0.32);
    this.tone(c, t, 115 + Math.random() * 30, 0.06, 0.16, 'triangle');
  };

  space = () => {
    const c = this.running();
    if (!c) return;
    this.burst(c, c.currentTime, 0.04, 700, 0.8, 0.16);
  };

  bell = () => {
    const c = this.running();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, t, 2093, 1.3, 0.1);
    this.tone(c, t, 4186, 0.7, 0.03);
  };

  carriageReturn = () => {
    const c = this.running();
    if (!c) return;
    const t = c.currentTime;
    for (let i = 0; i < 6; i++) this.burst(c, t + i * 0.05, 0.025, 2600, 2, 0.11);
    this.burst(c, t + 0.33, 0.08, 400, 0.7, 0.3, 'lowpass');
  };

  stamp = () => {
    const c = this.running();
    if (!c) return;
    const t = c.currentTime;
    this.burst(c, t, 0.18, 260, 0.7, 0.9, 'lowpass');
    this.tone(c, t, 62, 0.2, 0.35);
  };
}

export function useTypewriterSound() {
  const [synth] = useState(() => new TypewriterSynth());
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    synth.enabled = enabled;
  }, [synth, enabled]);

  useEffect(() => {
    const unlock = () => synth.unlock();
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, [synth]);

  const toggle = useCallback(() => setEnabled((on) => !on), []);

  return { enabled, toggle, player: synth as SoundPlayer };
}
