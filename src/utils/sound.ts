/**
 * Web Audio API based sound synthesizer for Halloween Minute to Win It.
 * Specially designed for Halloween party / projector atmosphere:
 * - Ominous cinematic start drone
 * - Complete silence during normal countdown (no annoying ticking during first 50s)
 * - Intense, rising pitch countdown ticking during the final 10 seconds (extra tension at 3, 2, 1)
 * - Deep resonant gothic gong when time expires
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  public startSoundEnabled: boolean = true;
  public urgentTickEnabled: boolean = true;
  public gongEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public configure(opts: {
    soundEnabled?: boolean;
    volume?: number;
    mysticStartSoundEnabled?: boolean;
    urgentCountdownBeepEnabled?: boolean;
    timesUpGongEnabled?: boolean;
  }) {
    if (opts.soundEnabled !== undefined) this.isMuted = !opts.soundEnabled;
    if (opts.volume !== undefined) this.volume = opts.volume;
    if (opts.mysticStartSoundEnabled !== undefined) this.startSoundEnabled = opts.mysticStartSoundEnabled;
    if (opts.urgentCountdownBeepEnabled !== undefined) this.urgentTickEnabled = opts.urgentCountdownBeepEnabled;
    if (opts.timesUpGongEnabled !== undefined) this.gongEnabled = opts.timesUpGongEnabled;
  }

  /**
   * Ominous, cinematic dark Halloween start sound effect.
   * Multi-layered sub-bass rumble + eerie minor swell.
   */
  public playMysticStart() {
    if (this.isMuted || !this.startSoundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume * 0.9, now);
      master.connect(this.ctx.destination);

      // Layer 1: Sub-bass rumble sweep (deep punch)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.9);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.7, now + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      subOsc.connect(subGain);
      subGain.connect(master);
      subOsc.start(now);
      subOsc.stop(now + 1.2);

      // Layer 2: Ominous horror dissonance (D-minor / tritone interval: 146Hz & 207Hz)
      const tones = [146.8, 207.65, 293.66];
      tones.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 1.4);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 1.4);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.4 / (idx + 1), now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now);
        osc.stop(now + 1.5);
      });
    } catch {
      // Audio error suppressed
    }
  }

  /**
   * Urgent countdown tick precisely for the last 10 seconds.
   * Scales in pitch and urgency from 10 down to 1.
   * At 3, 2, 1: double-hit high tension pulse!
   */
  public playUrgentTick(sec: number) {
    if (this.isMuted || !this.urgentTickEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const isCritical = sec <= 3;

      // Base frequency scales higher as time runs out (10s = 850Hz -> 1s = 1750Hz)
      const baseFreq = 800 + (10 - sec) * 95;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);

      const amp = this.volume * (isCritical ? 0.75 : 0.45);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isCritical ? 0.12 : 0.08));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (isCritical ? 0.12 : 0.08));

      // Extra accent click for seconds 3, 2, 1 (double impact)
      if (isCritical) {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
        gain2.gain.setValueAtTime(this.volume * 0.35, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.1);
      }
    } catch {
      // Audio error suppressed
    }
  }

  /**
   * Powerful deep gothic gong / bell when time is up.
   */
  public playTimesUpGong() {
    if (this.isMuted || !this.gongEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [85, 170, 260, 345, 510, 680, 890];
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume * 0.95, now);
      master.connect(this.ctx.destination);

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const decay = idx === 0 ? 4.5 : 2.5 / (idx * 0.5 + 1);
        gain.gain.setValueAtTime((1 / (idx + 1)) * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(master);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch {
      // Audio error suppressed
    }
  }

  /**
   * UI Click / subtle action sound
   */
  public playTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Audio error suppressed
    }
  }

  /**
   * Fanfare / celebration for tournament victory or game win
   */
  public playCelebration() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 261.63, t: 0.0, d: 0.2 },
        { f: 329.63, t: 0.2, d: 0.2 },
        { f: 392.0, t: 0.4, d: 0.25 },
        { f: 523.25, t: 0.65, d: 0.9 },
        { f: 659.25, t: 0.78, d: 1.0 },
      ];

      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.0001, now + note.t);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, now + note.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch {
      // Audio error suppressed
    }
  }
}

export const soundEngine = new SoundEngine();
