export class PauseMenu {
  constructor({ onResume, onRespawnRunway, onQuickSave, onOpenSettings, onReturnTitle }) {
    this.onResume = onResume;
    this.onRespawnRunway = onRespawnRunway;
    this.onQuickSave = onQuickSave;
    this.onOpenSettings = onOpenSettings;
    this.onReturnTitle = onReturnTitle;

    this.visible = false;
    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'pause-menu';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(4, 9, 20, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1500;
      font-family: 'Segoe UI', -apple-system, Roboto, sans-serif;
      color: #f1f5f9;
      user-select: none;
    `;

    this.overlay.innerHTML = `
      <div style="
        max-width: 780px;
        width: 92%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 32px 36px;
        background: rgba(10, 18, 32, 0.88);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 229, 255, 0.25);
        display: flex;
        flex-direction: column;
        gap: 20px;
      ">
        <!-- Pause Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 26px;">⏸</span>
            <div>
              <h2 style="font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #00ffff; margin: 0;">EXPEDITION PAUSED</h2>
              <div style="font-size: 11px; color: #94a3b8; letter-spacing: 1px;">WORLD SIMULATION FROZEN</div>
            </div>
          </div>
          <button id="pause-close-btn" style="
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #94a3b8;
            font-size: 16px;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          ">&times;</button>
        </div>

        <!-- Live Telemetry Status Strip -->
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          background: rgba(14, 24, 44, 0.65);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 10px;
          padding: 12px 16px;
        ">
          <div>
            <div style="font-size: 10px; color: #7ad7ff; letter-spacing: 1px;">HEALTH</div>
            <div id="pause-stat-hp" style="font-size: 16px; font-weight: 800; color: #ff4d6d;">100 / 100</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #7ad7ff; letter-spacing: 1px;">LEVEL / XP</div>
            <div id="pause-stat-lvl" style="font-size: 16px; font-weight: 800; color: #ffaa00;">LVL 1 (0 XP)</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #7ad7ff; letter-spacing: 1px;">LOCATION</div>
            <div id="pause-stat-pos" style="font-size: 15px; font-weight: 700; color: #00e5ff;">Island Center</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #7ad7ff; letter-spacing: 1px;">WEATHER</div>
            <div id="pause-stat-weather" style="font-size: 15px; font-weight: 700; color: #20e386;">Temperate</div>
          </div>
        </div>

        <!-- Action Buttons & Controls Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px;">
          <!-- Primary Actions -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="pause-btn-resume" style="
              background: linear-gradient(135deg, #00e5ff 0%, #0077ff 100%);
              border: none;
              color: #ffffff;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 2px;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 0 20px rgba(0, 229, 255, 0.45);
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <span>▶</span> RESUME GAME (ESC)
            </button>

            <button id="pause-btn-unstuck" style="
              background: rgba(0, 229, 255, 0.12);
              border: 1px solid rgba(0, 229, 255, 0.4);
              color: #7ad7ff;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <span>✈️</span> RESPAWN AT AIRPORT (UNSTUCK)
            </button>

            <button id="pause-btn-save" style="
              background: rgba(32, 227, 134, 0.12);
              border: 1px solid rgba(32, 227, 134, 0.4);
              color: #20e386;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <span>💾</span> QUICK SAVE (F5)
            </button>

            <button id="pause-btn-settings" style="
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.12);
              color: #e2e8f0;
              font-size: 12px;
              font-weight: 700;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <span>⚙️</span> SYSTEM & GRAPHICS
            </button>

            <button id="pause-btn-title" style="
              background: rgba(255, 50, 70, 0.12);
              border: 1px solid rgba(255, 50, 70, 0.35);
              color: #ff6b81;
              font-size: 12px;
              font-weight: 700;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-top: 6px;
            ">
              <span>🏠</span> RETURN TO TITLE
            </button>
          </div>

          <!-- Integrated Controls Reference -->
          <div style="
            background: rgba(14, 24, 44, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 14px;
            font-size: 11px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          ">
            <div style="font-weight: 800; color: #00ffff; letter-spacing: 1px; margin-bottom: 2px;">QUICK CONTROLS REFERENCE</div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Movement / Sprint</span><span><kbd>WASD</kbd> + <kbd>Shift</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Jump / Jetpack Thruster</span><span><kbd>Space</kbd> / <kbd>Hold</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Aerial Ground Slam</span><span><kbd>Ctrl</kbd> / <kbd>C</kbd> (in air)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Attack / Tactical ADS</span><span><kbd>LMB</kbd> / <kbd>RMB</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Chrono Stasis Bubble</span><span><kbd>Q</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Board Aircraft / Livery</span><span><kbd>F</kbd> / <kbd>L</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Flight Throttle / Brakes</span><span><kbd>Shift</kbd>/<kbd>Ctrl</kbd> + <kbd>Space</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Air-to-Air Missiles</span><span><kbd>RMB</kbd> / <kbd>X</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Camera / Free Cursor</span><span><kbd>V</kbd> / <kbd>Hold Alt</kbd></span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">Tech Forge / Island Map</span><span><kbd>Tab</kbd> / <kbd>M</kbd></span></div>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #pause-btn-resume:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(0, 229, 255, 0.75);
      }
      #pause-btn-unstuck:hover {
        background: rgba(0, 229, 255, 0.25);
        color: #ffffff;
      }
      #pause-btn-save:hover {
        background: rgba(32, 227, 134, 0.25);
        color: #ffffff;
      }
      #pause-btn-settings:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }
      #pause-btn-title:hover {
        background: rgba(255, 50, 70, 0.25);
        color: #ffffff;
      }
      #pause-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    // Event listeners
    document.getElementById('pause-btn-resume')?.addEventListener('click', () => this.onResume?.());
    document.getElementById('pause-close-btn')?.addEventListener('click', () => this.onResume?.());
    document.getElementById('pause-btn-unstuck')?.addEventListener('click', () => this.onRespawnRunway?.());
    document.getElementById('pause-btn-save')?.addEventListener('click', () => this.onQuickSave?.());
    document.getElementById('pause-btn-settings')?.addEventListener('click', () => this.onOpenSettings?.());
    document.getElementById('pause-btn-title')?.addEventListener('click', () => this.onReturnTitle?.());
  }

  updateStats({ health, maxHealth, level, xp, position, weather }) {
    const hpElem = document.getElementById('pause-stat-hp');
    if (hpElem) hpElem.textContent = `${Math.round(health)} / ${maxHealth}`;

    const lvlElem = document.getElementById('pause-stat-lvl');
    if (lvlElem) lvlElem.textContent = `LVL ${level} (${xp} XP)`;

    const posElem = document.getElementById('pause-stat-pos');
    if (posElem && position) {
      posElem.textContent = `X:${Math.round(position.x)} Y:${Math.round(position.y)} Z:${Math.round(position.z)}`;
    }

    const weatherElem = document.getElementById('pause-stat-weather');
    if (weatherElem && weather) {
      weatherElem.textContent = `${weather.icon || '☀️'} ${weather.label || 'Temperate'}`;
    }
  }

  show(statusInfo = null) {
    if (statusInfo) this.updateStats(statusInfo);
    this.visible = true;
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = 'none';
  }

  isOpen() {
    return this.visible;
  }
}
