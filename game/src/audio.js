// All sound is generated in code with WebAudio: short oscillator bleeps and
// little jingles. No audio files, no network, and nothing to load.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freq, dur, type, volume, when = 0, slideTo = null) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  // A cheerful autumn walk: C major pentatonic, one note per beat.
  const MELODY = [523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 587, 523];

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopMusic();
      return muted;
    },
    get muted() {
      return muted;
    },
    jump() {
      tone(320, 0.16, 'sine', 0.16, 0, 640);
    },
    doubleJump() {
      tone(420, 0.14, 'sine', 0.14, 0, 760);
      tone(660, 0.12, 'triangle', 0.1, 0.05, 990);
    },
    dash() {
      tone(180, 0.18, 'sawtooth', 0.07, 0, 520);
    },
    pickup() {
      tone(880, 0.09, 'triangle', 0.14);
      tone(1318, 0.12, 'triangle', 0.12, 0.07);
    },
    feather() {
      [660, 880, 1108, 1318].forEach((f, i) => tone(f, 0.12, 'triangle', 0.13, i * 0.06));
    },
    hit() {
      tone(140, 0.3, 'sawtooth', 0.22, 0, 60);
      tone(90, 0.35, 'square', 0.14, 0.02, 45);
    },
    gobble() {
      // Two quick gobbles: low clucks that rise.
      [220, 260, 220, 300].forEach((f, i) => tone(f, 0.07, 'square', 0.1, i * 0.09));
    },
    caught() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.16));
    },
    escaped() {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) =>
        tone(f, 0.18, 'triangle', 0.16, i * 0.11),
      );
    },
    click() {
      tone(700, 0.06, 'sine', 0.1);
    },
    startMusic() {
      if (musicTimer || muted) return;
      ensure();
      musicTimer = setInterval(() => {
        if (muted) return;
        const note = MELODY[musicStep % MELODY.length];
        musicStep += 1;
        tone(note, 0.22, 'triangle', 0.045);
        tone(note / 2, 0.24, 'sine', 0.03);
      }, 240);
    },
    stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
}
