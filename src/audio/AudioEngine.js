import { settings } from '../core/SettingsManager.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isInitialized = false;

    this.musicTimer = 0;
    this.beatTimer = 0;
    this.beatStep = 0;
    this.chordStep = 0;
    this.currentMode = 'day'; // 'day' | 'night' | 'boss'

    // Listen to real-time volume setting adjustments
    settings.onChange((key, val) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (key === 'masterVolume' && this.masterGain) {
        this.masterGain.gain.setValueAtTime(val, now);
      } else if (key === 'musicVolume' && this.musicGain) {
        this.musicGain.gain.setValueAtTime(val, now);
      } else if (key === 'sfxVolume' && this.sfxGain) {
        this.sfxGain.gain.setValueAtTime(val, now);
      }
    });
  }

  init() {
    if (this.isInitialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = settings.get('masterVolume') ?? 0.75;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = settings.get('musicVolume') ?? 0.35;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = settings.get('sfxVolume') ?? 0.70;
    this.sfxGain.connect(this.masterGain);

    this.isInitialized = true;
  }

  setMusicMode(mode) {
    this.currentMode = mode;
  }

  playSynthNote(freq, duration = 1.2, type = 'sine', gainVal = 0.15) {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gainVal, this.ctx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.musicGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playKick() {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.2);

    g.gain.setValueAtTime(0.45, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(g);
    g.connect(this.musicGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHiHat() {
    if (!this.isInitialized) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);

    noise.start();
  }

  playBlasterSound(isCharged = false) {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = isCharged ? 'sawtooth' : 'triangle';
    const startFreq = isCharged ? 350 : 850;
    const endFreq = isCharged ? 60 : 120;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + (isCharged ? 0.45 : 0.16));

    g.gain.setValueAtTime(0.35, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isCharged ? 0.45 : 0.16));

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + (isCharged ? 0.45 : 0.16));
  }

  playHitmarkerSound(isCrit = false) {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 2600 : 1900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.055);

    g.gain.setValueAtTime(0.24, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.055);
  }

  playAimSound() {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.06);

    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playSwordSound(isCrit = false) {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isCrit ? 680 : 420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);

    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playParrySound() {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.35);

    g.gain.setValueAtTime(0.45, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playThunderClap(isClose = true) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    // 1. Initial Lightning Crack (White Noise burst)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isClose ? 0.75 : 0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);

    // 2. Rolling Thunder Low-Frequency Rumble
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isClose ? 75 : 55, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 2.2);

    g.gain.setValueAtTime(isClose ? 0.65 : 0.35, now);
    g.gain.linearRampToValueAtTime(isClose ? 0.45 : 0.25, now + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 2.0);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 2.4);
  }

  playWarpSound() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);

    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playBerserkerRoar() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.65);

    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  playWyrmScreech() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.45);

    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playExplosionSound() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.8, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    noise.start(now);
  }

  playStasisSound() {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.8);

    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  playGroundSlamSound() {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);

    g.gain.setValueAtTime(0.5, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playToastSound() {
    if (!this.isInitialized) return;
    this.playSynthNote(523.25, 0.25, 'triangle', 0.2); // C5
    setTimeout(() => this.playSynthNote(659.25, 0.35, 'triangle', 0.2), 120); // E5
  }

  playFootstep(surface = 'grass') {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (surface === 'rock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      g.gain.setValueAtTime(0.10, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (surface === 'sand') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      // Grass / soil
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.12);
  }

  playWoodChop() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.15);
  }

  playStoneClink() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.18);
  }

  playLootChime() {
    if (!this.isInitialized) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playSynthNote(freq, 0.22, 'triangle', 0.18), idx * 60);
    });
  }

  playQuestCompleteSound() {
    if (!this.isInitialized) return;
    const notes = [440, 554.37, 659.25, 880]; // A major fanfare
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playSynthNote(freq, 0.45, 'triangle', 0.25), idx * 110);
    });
  }

  playVictoryFanfare() {
    if (!this.isInitialized) return;
    const chords = [
      [523.25, 659.25, 783.99], // Cmaj
      [587.33, 739.99, 880.00], // Dmaj
      [659.25, 830.61, 987.77], // Emaj
      [1046.5, 1318.5, 1567.9]  // C6 grand
    ];
    chords.forEach((chord, cIdx) => {
      setTimeout(() => {
        chord.forEach(freq => this.playSynthNote(freq, 1.2, 'triangle', 0.22));
      }, cIdx * 350);
    });
  }

  updateMusic(dt) {
    if (!this.isInitialized) return;

    // 1. Rhythmic Beats
    this.beatTimer -= dt;
    if (this.beatTimer <= 0) {
      this.beatTimer = (this.currentMode === 'boss') ? 0.35 : 0.65;
      if (settings.get('synthDrums') !== false) {
        if (this.currentMode === 'boss') {
          if (this.beatStep % 2 === 0) this.playKick();
          this.playHiHat();
        } else if (this.currentMode === 'night') {
          if (this.beatStep % 4 === 0) this.playHiHat();
        }
      }
      this.beatStep++;
    }

    // 2. Chords & Pads
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      if (this.currentMode === 'boss') {
        this.musicTimer = 1.4;
        const chords = [110, 130.8, 146.8, 164.8];
        const root = chords[this.chordStep % chords.length];
        this.playSynthNote(root, 0.8, 'sawtooth', 0.14);
        this.playSynthNote(root * 1.5, 0.6, 'square', 0.09);
      } else if (this.currentMode === 'night') {
        this.musicTimer = 3.5;
        const chords = [
          [220, 261.6, 329.6], // Am
          [174.6, 220, 261.6], // F
          [164.8, 196, 246.9]  // Em
        ];
        const chord = chords[this.chordStep % chords.length];
        chord.forEach(f => this.playSynthNote(f, 3.2, 'sine', 0.1));
      } else {
        this.musicTimer = 4.2;
        const chords = [
          [261.6, 329.6, 392.0, 493.8], // Cmaj7
          [349.2, 440.0, 523.2, 659.2], // Fmaj7
          [392.0, 493.8, 587.3, 783.9]  // G6
        ];
        const chord = chords[this.chordStep % chords.length];
        chord.forEach(f => this.playSynthNote(f, 3.8, 'sine', 0.08));
      }
      this.chordStep++;
    }
  }
}
