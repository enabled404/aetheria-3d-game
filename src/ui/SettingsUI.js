import { settings } from '../core/SettingsManager.js';

export class SettingsUI {
  constructor(inputManager = null, gameCursor = null) {
    this.inputManager = inputManager;
    this.gameCursor = gameCursor;
    this.isOpen = false;
    this.activeTab = 'controls';

    this.createDOM();
    this.bindEvents();
    this.syncFromSettings();
  }

  setGameCursor(gc) {
    this.gameCursor = gc;
  }

  createDOM() {
    // 1. Trigger button in HUD
    const btn = document.createElement('button');
    btn.id = 'hud-settings-btn';
    btn.className = 'glass-panel';
    btn.innerHTML = '⚙️ Settings';
    btn.title = 'Open Game Settings (Esc / O)';
    document.body.appendChild(btn);
    this.triggerBtn = btn;

    // 2. Settings Modal Container
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.innerHTML = `
      <div class="settings-panel glass-panel">
        <div class="settings-header">
          <div class="settings-title">
            <span style="font-size:22px;">⚙️</span>
            <h2>SYSTEM & PREFERENCES</h2>
          </div>
          <button id="settings-close-x" class="settings-close-btn">&times;</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="settings-tabs">
          <button class="settings-tab active" data-tab="controls">🎮 CONTROLS</button>
          <button class="settings-tab" data-tab="audio">🔊 AUDIO</button>
          <button class="settings-tab" data-tab="graphics">👁️ LIGHTING & VISUALS</button>
          <button class="settings-tab" data-tab="keybinds">⌨️ KEYBINDS</button>
        </div>

        <!-- Tab 1: Controls -->
        <div class="settings-tab-content active" id="tab-controls">
          <div class="setting-row">
            <div class="setting-label">
              <span>Mouse Look Sensitivity</span>
              <small>Adjusts cursor rotation speed</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-sens" min="0.2" max="3.0" step="0.1" value="1.0">
              <span id="setting-sens-val" class="setting-val-display">1.0x</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Invert Y-Axis (Pitch)</span>
              <small>Push up to look down (Flight-sim style)</small>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-invert-y">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Camera Orbit Distance</span>
              <small>Third-person zoom distance behind character</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-dist" min="2.0" max="6.5" step="0.2" value="3.8">
              <span id="setting-dist-val" class="setting-val-display">3.8m</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Field of View (FOV)</span>
              <small>Perspective camera lens angle</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-fov" min="60" max="95" step="1" value="70">
              <span id="setting-fov-val" class="setting-val-display">70°</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Audio -->
        <div class="settings-tab-content" id="tab-audio">
          <div class="setting-row">
            <div class="setting-label">
              <span>Master Volume</span>
              <small>Overall synthesized sound level</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-master-vol" min="0" max="1" step="0.05" value="0.75">
              <span id="setting-master-val" class="setting-val-display">75%</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>SFX Volume</span>
              <small>Blasters, katana, shockwaves & footsteps</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-sfx-vol" min="0" max="1" step="0.05" value="0.70">
              <span id="setting-sfx-val" class="setting-val-display">70%</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Music & Ambience</span>
              <small>Procedural synth pads & nature soundscapes</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-music-vol" min="0" max="1" step="0.05" value="0.35">
              <span id="setting-music-val" class="setting-val-display">35%</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Synthesizer Drums & Percussion</span>
              <small>Dynamic boss battle kicks and high-hat beats</small>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-drums" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Tab 3: Graphics & Lighting -->
        <div class="settings-tab-content" id="tab-graphics">
          <div class="setting-row">
            <div class="setting-label">
              <span>Night Island Glow</span>
              <small>Moonlight & ambient island illumination intensity</small>
            </div>
            <div class="setting-control">
              <input type="range" id="setting-night-glow" min="0.6" max="2.2" step="0.1" value="1.3">
              <span id="setting-glow-val" class="setting-val-display">1.3x</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Player Lumitech Beacon</span>
              <small>Wearable chest light illuminating player & surroundings</small>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-beacon" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Dynamic Shadows</span>
              <small>Real-time sun and moon shadow maps</small>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-shadows" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Particle Density</span>
              <small>Combat sparks, smoke motes, and dust debris</small>
            </div>
            <div class="setting-control">
              <select id="setting-particles" class="setting-select">
                <option value="low">Low (Performance)</option>
                <option value="medium">Medium</option>
                <option value="high" selected>High (Rich)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tab 4: Keybinds -->
        <div class="settings-tab-content" id="tab-keybinds">
          <div class="keybinds-grid">
            <div class="keybind-card"><kbd>W A S D</kbd> <span>Directional Movement</span></div>
            <div class="keybind-card"><kbd>Shift</kbd> <span>Sprint (Uses Stamina)</span></div>
            <div class="keybind-card"><kbd>Space</kbd> <span>Jump / Hold in Air for Thrusters</span></div>
            <div class="keybind-card"><kbd>Ctrl / C</kbd> <span>(In Air) Aerial Ground Slam</span></div>
            <div class="keybind-card"><kbd>Q</kbd> <span>Temporal Stasis Time Bubble</span></div>
            <div class="keybind-card"><kbd>LMB</kbd> <span>Attack / Hold to Charge Mega-Blaster</span></div>
            <div class="keybind-card"><kbd>RMB</kbd> <span>Parry Shield Deflection (Katana)</span></div>
            <div class="keybind-card"><kbd>E</kbd> <span>Interact (NPCs, Altar, Campfire Cooking)</span></div>
            <div class="keybind-card"><kbd>Tab</kbd> <span>Tech Forge & Crafting Menu</span></div>
            <div class="keybind-card"><kbd>M</kbd> <span>Topographic Island Survey Map</span></div>
            <div class="keybind-card"><kbd>V</kbd> <span>Toggle 1st / 3rd Person View</span></div>
            <div class="keybind-card"><kbd>Esc / O</kbd> <span>Pause & Settings Menu</span></div>
            <div class="keybind-card"><kbd>F5 / F9</kbd> <span>Quick Save / Quick Load State</span></div>
            <div class="keybind-card"><kbd>1 - 6</kbd> <span>Select Hotbar Weapons & Tools</span></div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="settings-footer">
          <button id="settings-reset-btn" class="settings-sec-btn">Reset Defaults</button>
          <button id="settings-resume-btn" class="settings-pri-btn">Resume Game</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
  }

  bindEvents() {
    // Open on HUD button click
    this.triggerBtn.addEventListener('click', () => {
      this.open();
    });

    // Close button
    const closeBtn = document.getElementById('settings-close-x');
    closeBtn?.addEventListener('click', () => this.close());

    // Resume button
    const resumeBtn = document.getElementById('settings-resume-btn');
    resumeBtn?.addEventListener('click', () => {
      this.close();
      this.inputManager?.requestPointerLock();
    });

    // Reset Defaults button
    const resetBtn = document.getElementById('settings-reset-btn');
    resetBtn?.addEventListener('click', () => {
      settings.resetDefaults();
      this.syncFromSettings();
    });

    // Tab Navigation
    const tabs = this.modal.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetTab = tab.dataset.tab;
        this.modal.querySelectorAll('.settings-tab-content').forEach(tc => {
          tc.classList.toggle('active', tc.id === `tab-${targetTab}`);
        });
      });
    });

    // Controls inputs
    const sensInput = document.getElementById('setting-sens');
    sensInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-sens-val').textContent = `${val.toFixed(1)}x`;
      settings.set('mouseSens', val);
    });

    const invertInput = document.getElementById('setting-invert-y');
    invertInput?.addEventListener('change', (e) => {
      settings.set('invertY', e.target.checked);
    });

    const distInput = document.getElementById('setting-dist');
    distInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-dist-val').textContent = `${val.toFixed(1)}m`;
      settings.set('cameraDistance', val);
    });

    const fovInput = document.getElementById('setting-fov');
    fovInput?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('setting-fov-val').textContent = `${val}°`;
      settings.set('fov', val);
    });

    // Audio inputs
    const masterInput = document.getElementById('setting-master-vol');
    masterInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-master-val').textContent = `${Math.round(val * 100)}%`;
      settings.set('masterVolume', val);
    });

    const sfxInput = document.getElementById('setting-sfx-vol');
    sfxInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-sfx-val').textContent = `${Math.round(val * 100)}%`;
      settings.set('sfxVolume', val);
    });

    const musicInput = document.getElementById('setting-music-vol');
    musicInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-music-val').textContent = `${Math.round(val * 100)}%`;
      settings.set('musicVolume', val);
    });

    const drumsInput = document.getElementById('setting-drums');
    drumsInput?.addEventListener('change', (e) => {
      settings.set('synthDrums', e.target.checked);
    });

    // Graphics inputs
    const glowInput = document.getElementById('setting-night-glow');
    glowInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('setting-glow-val').textContent = `${val.toFixed(1)}x`;
      settings.set('nightGlow', val);
    });

    const beaconInput = document.getElementById('setting-beacon');
    beaconInput?.addEventListener('change', (e) => {
      settings.set('playerBeacon', e.target.checked);
    });

    const shadowInput = document.getElementById('setting-shadows');
    shadowInput?.addEventListener('change', (e) => {
      settings.set('shadows', e.target.checked);
    });

    const particleSelect = document.getElementById('setting-particles');
    particleSelect?.addEventListener('change', (e) => {
      settings.set('particleDensity', e.target.value);
    });
  }

  syncFromSettings() {
    const s = settings.settings;

    const sensInput = document.getElementById('setting-sens');
    if (sensInput) {
      sensInput.value = s.mouseSens;
      document.getElementById('setting-sens-val').textContent = `${Number(s.mouseSens).toFixed(1)}x`;
    }

    const invertInput = document.getElementById('setting-invert-y');
    if (invertInput) invertInput.checked = !!s.invertY;

    const distInput = document.getElementById('setting-dist');
    if (distInput) {
      distInput.value = s.cameraDistance;
      document.getElementById('setting-dist-val').textContent = `${Number(s.cameraDistance).toFixed(1)}m`;
    }

    const fovInput = document.getElementById('setting-fov');
    if (fovInput) {
      fovInput.value = s.fov;
      document.getElementById('setting-fov-val').textContent = `${s.fov}°`;
    }

    const masterInput = document.getElementById('setting-master-vol');
    if (masterInput) {
      masterInput.value = s.masterVolume;
      document.getElementById('setting-master-val').textContent = `${Math.round(s.masterVolume * 100)}%`;
    }

    const sfxInput = document.getElementById('setting-sfx-vol');
    if (sfxInput) {
      sfxInput.value = s.sfxVolume;
      document.getElementById('setting-sfx-val').textContent = `${Math.round(s.sfxVolume * 100)}%`;
    }

    const musicInput = document.getElementById('setting-music-vol');
    if (musicInput) {
      musicInput.value = s.musicVolume;
      document.getElementById('setting-music-val').textContent = `${Math.round(s.musicVolume * 100)}%`;
    }

    const drumsInput = document.getElementById('setting-drums');
    if (drumsInput) drumsInput.checked = s.synthDrums !== false;

    const glowInput = document.getElementById('setting-night-glow');
    if (glowInput) {
      glowInput.value = s.nightGlow;
      document.getElementById('setting-glow-val').textContent = `${Number(s.nightGlow).toFixed(1)}x`;
    }

    const beaconInput = document.getElementById('setting-beacon');
    if (beaconInput) beaconInput.checked = s.playerBeacon !== false;

    const shadowInput = document.getElementById('setting-shadows');
    if (shadowInput) shadowInput.checked = s.shadows !== false;

    const particleSelect = document.getElementById('setting-particles');
    if (particleSelect) particleSelect.value = s.particleDensity || 'high';
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
    return this.isOpen;
  }

  open() {
    this.isOpen = true;
    this.syncFromSettings();
    this.modal.style.display = 'flex';
    this.gameCursor?.openUI('settings');
    this.inputManager?.exitPointerLock();
  }

  close() {
    this.isOpen = false;
    this.modal.style.display = 'none';
    this.gameCursor?.closeUI('settings');
  }
}
