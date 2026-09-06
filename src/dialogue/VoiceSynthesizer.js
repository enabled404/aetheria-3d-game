export class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.isReady = false;

    if (this.synth) {
      const loadVoices = () => {
        this.voices = this.synth.getVoices();
        this.isReady = this.voices.length > 0;
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  speak(text, characterType = 'lyra', onStart = null, onEnd = null) {
    if (!this.synth) {
      onStart?.();
      setTimeout(() => onEnd?.(), 1500);
      return;
    }

    this.synth.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);

    // Profile settings per persona
    switch (characterType) {
      case 'lyra': {
        utterance.pitch = 1.25;
        utterance.rate = 1.1;
        // Prefer natural female English voice if available
        const femaleVoice = this.voices.find(v => (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Victoria')) && v.lang.startsWith('en'));
        if (femaleVoice) utterance.voice = femaleVoice;
        break;
      }
      case 'thorne': {
        utterance.pitch = 0.72;
        utterance.rate = 0.95;
        // Prefer deep male English voice
        const maleVoice = this.voices.find(v => (v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('David') || v.name.includes('George')) && v.lang.startsWith('en'));
        if (maleVoice) utterance.voice = maleVoice;
        break;
      }
      case 'kaelen': {
        utterance.pitch = 0.85;
        utterance.rate = 0.88;
        const mystVoice = this.voices.find(v => (v.name.includes('Fred') || v.name.includes('Oliver') || v.name.includes('Google UK English Male')) && v.lang.startsWith('en'));
        if (mystVoice) utterance.voice = mystVoice;
        break;
      }
      case 'titan': {
        utterance.pitch = 0.45;
        utterance.rate = 0.72;
        break;
      }
      default:
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
