/**
 * Web Audio API Sound Synthesizer for Galaxy Arcade
 * Fully self-contained, no external MP3 dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private bgmEnabled = true;
  private masterGain: GainNode | null = null;
  private bgmOsc: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private initialized = false;

  private init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (!enabled && this.bgmOsc) {
      try {
        this.bgmOsc.stop();
        this.bgmOsc.disconnect();
        this.bgmOsc = null;
      } catch {
        // ignore
      }
    } else if (enabled && this.initialized) {
      this.startSpaceAmbience();
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Player laser fire
   */
  public playLaser(isDual = false) {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDual ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isDual ? 980 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(isDual ? 0.35 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);

    // If dual fighter, play a secondary harmonized pulse
    if (isDual) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1240, now);
      osc2.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now);
      osc2.stop(now + 0.13);
    }
  }

  /**
   * Enemy bullet shot
   */
  public playEnemyLaser() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Dive swoosh sound
   */
  public playDiveSound(isBoss = false) {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startFreq = isBoss ? 620 : 780;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq + 100, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Armor hit impact tick
   */
  public playHit() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Explosion sound with noise buffer
   */
  public playExplosion(type: 'small' | 'med' | 'boss') {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const duration = type === 'boss' ? 0.8 : type === 'med' ? 0.45 : 0.25;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'boss' ? 400 : 700, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    const peak = type === 'boss' ? 0.6 : type === 'med' ? 0.35 : 0.2;
    gain.gain.setValueAtTime(peak, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();

    // Additional low frequency punch for boss
    if (type === 'boss') {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);
      subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + duration);
    }
  }

  /**
   * Tractor beam alien hum
   */
  public playTractorBeam() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now); // fast vibrato
    lfoGain.gain.setValueAtTime(60, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.6);
    osc.stop(now + 0.6);
  }

  /**
   * Power-up chime
   */
  public playPowerup() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.16);
    });
  }

  /**
   * Smart Bomb / EMP Blast
   */
  public playBomb() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.7);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  /**
   * Iconic Galaga-style Stage Intro melody
   */
  public playStageStart() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    // Classic 7-note arcade fanfare arpeggio
    const melody = [
      { note: 261.63, dur: 0.1 }, // C4
      { note: 329.63, dur: 0.1 }, // E4
      { note: 392.00, dur: 0.1 }, // G4
      { note: 523.25, dur: 0.15 }, // C5
      { note: 392.00, dur: 0.1 }, // G4
      { note: 523.25, dur: 0.3 }, // C5
    ];

    let t = this.ctx.currentTime;
    melody.forEach((item) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(item.note, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + item.dur);
      t += item.dur;
    });
  }

  /**
   * Challenging Stage Perfect Fanfare
   */
  public playPerfect() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const melody = [
      { note: 523.25, dur: 0.12 },
      { note: 659.25, dur: 0.12 },
      { note: 783.99, dur: 0.12 },
      { note: 1046.50, dur: 0.35 },
    ];
    let t = this.ctx.currentTime;
    melody.forEach((item) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.note, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + item.dur);
      t += item.dur;
    });
  }

  /**
   * Dual Fighter rescued & joined fanfare
   */
  public playDualFighterConnected() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const chords = [
      [330, 440],
      [392, 523],
      [493, 659],
      [587, 880],
    ];
    let t = this.ctx.currentTime;
    chords.forEach((pair) => {
      if (!this.ctx || !this.masterGain) return;
      pair.forEach((f) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.17);
      });
      t += 0.14;
    });
  }

  /**
   * Game Over descending chime
   */
  public playGameOver() {
    if (!this.soundEnabled) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const notes = [440, 415, 392, 349, 311, 261];
    let t = this.ctx.currentTime;
    notes.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.23);
      t += 0.2;
    });
  }

  /**
   * Subtle cosmic background drone
   */
  private startSpaceAmbience() {
    if (!this.bgmEnabled || !this.ctx || !this.masterGain || this.bgmOsc) return;
    try {
      this.bgmOsc = this.ctx.createOscillator();
      this.bgmGain = this.ctx.createGain();
      this.bgmOsc.type = 'sine';
      this.bgmOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 space rumble
      this.bgmGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(this.masterGain);
      this.bgmOsc.start();
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
