let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const start = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

export const sounds = {
  click() {
    tone(600, 0.08, 'square', 0.08);
  },
  bet() {
    tone(440, 0.1, 'sine', 0.12);
    tone(660, 0.1, 'sine', 0.1, 0.06);
  },
  win() {
    tone(523, 0.12, 'sine', 0.15);
    tone(659, 0.12, 'sine', 0.15, 0.1);
    tone(784, 0.2, 'sine', 0.15, 0.2);
    tone(1047, 0.3, 'sine', 0.12, 0.3);
  },
  loss() {
    tone(300, 0.15, 'sawtooth', 0.12);
    tone(200, 0.25, 'sawtooth', 0.1, 0.1);
  },
  cardReveal() {
    tone(800, 0.05, 'triangle', 0.06);
    tone(500, 0.05, 'triangle', 0.04, 0.03);
  },
};

let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

export function play(sound: keyof typeof sounds) {
  if (muted) return;
  sounds[sound]();
}
