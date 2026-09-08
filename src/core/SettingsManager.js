export class SettingsManager {
  constructor() {
    this.storageKey = 'aetheria_settings_v3';
    this.defaults = {
      mouseSens: 1.0,
      invertY: false,
      cameraDistance: 3.8,
      fov: 70,
      masterVolume: 0.75,
      sfxVolume: 0.70,
      musicVolume: 0.35,
      synthDrums: true,
      nightGlow: 1.3,
      playerBeacon: true,
      shadows: true,
      particleDensity: 'high'
    };

    this.settings = { ...this.defaults };
    this.listeners = [];
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...this.defaults, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load settings from localStorage:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, val) {
    this.settings[key] = val;
    this.save();
    this.notify(key, val);
  }

  setAll(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save();
    for (const [k, v] of Object.entries(newSettings)) {
      this.notify(k, v);
    }
  }

  resetDefaults() {
    this.settings = { ...this.defaults };
    this.save();
    for (const [k, v] of Object.entries(this.settings)) {
      this.notify(k, v);
    }
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify(key, val) {
    for (const cb of this.listeners) {
      try {
        cb(key, val, this.settings);
      } catch (e) {
        console.error('Settings listener error:', e);
      }
    }
  }
}

export const settings = new SettingsManager();
