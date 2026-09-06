export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isInitialized = false;

    this.musicTimer = 0;
    this.chordStep = 0;
    this.currentMode = 'day'; // 'day' | 'night' | 'boss'
  }

  init() {
    if (this.isInitialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.45;
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

    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  updateMusic(dt) {
    if (!this.isInitialized) return;
    this.musicTimer -= dt;

    if (this.musicTimer <= 0) {
      if (this.currentMode === 'boss') {
        this.musicTimer = 1.2;
        // Fast aggressive battle pulse
        const chords = [110, 130.8, 146.8, 164.8];
        const root = chords[this.chordStep % chords.length];
        this.playSynthNote(root, 0.8, 'sawtooth', 0.12);
        this.playSynthNote(root * 1.5, 0.6, 'square', 0.08);
      } else if (this.currentMode === 'night') {
        this.musicTimer = 3.5;
        // Atmospheric mystery minor chords
        const chords = [
          [220, 261.6, 329.6], // Am
          [174.6, 220, 261.6], // F
          [164.8, 196, 246.9]  // Em
        ];
        const chord = chords[this.chordStep % chords.length];
        chord.forEach(f => this.playSynthNote(f, 3.2, 'sine', 0.09));
      } else {
        this.musicTimer = 4.2;
        // Peaceful daytime major 7th chords
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
