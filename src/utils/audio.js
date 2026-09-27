// Web Audio API ambient tone synthesizer and interactive feedback
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.ambientGain = null;
    this.isPlayingAmbient = false;
    this.soundEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playThemeSwitchChime(freq = 432) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Audio playback fails silently if user hasn't interacted with DOM yet
    }
  }

  playRadialHoverBlip(freq = 580) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  toggleAmbient(freq = 432) {
    this.init();
    if (!this.ctx) return false;

    if (this.isPlayingAmbient) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient(freq);
      return true;
    }
  }

  startAmbient(freq = 432) {
    try {
      this.init();
      if (!this.ctx) return;

      if (this.oscillator) {
        this.stopAmbient();
      }

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const biquad = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime((freq / 2) + 1.5, this.ctx.currentTime); // Binaural beat

      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 2);

      osc1.connect(biquad);
      osc2.connect(biquad);
      biquad.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.oscillator = [osc1, osc2];
      this.isPlayingAmbient = true;
    } catch {
      this.isPlayingAmbient = false;
    }
  }

  updateAmbientFreq(freq) {
    if (this.isPlayingAmbient && this.oscillator && this.ctx) {
      try {
        this.oscillator[0].frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + 1.2);
        this.oscillator[1].frequency.exponentialRampToValueAtTime((freq / 2) + 1.5, this.ctx.currentTime + 1.2);
      } catch {
        // frequency update error handling
      }
    }
  }

  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (this.oscillator) {
            this.oscillator.forEach(o => {
              try { o.stop(); o.disconnect(); } catch {}
            });
            this.oscillator = null;
          }
        }, 800);
      } catch {}
    }
    this.isPlayingAmbient = false;
  }
}

export const soundEngine = new SoundEngine();
