/**
 * GameCursor — Seamless In-Game Cursor & Pointer Lock Manager
 * Eliminates cursor friction:
 * 1. Automatically frees cursor when dialogues, crafting, settings, or map open.
 * 2. Seamlessly re-requests pointer lock when modals close with zero extra clicks.
 * 3. Provides Alt-key Free Cursor Mode (hold Alt to inspect HUD/settings, release to resume aiming).
 * 4. Displays custom holographic pointer when cursor is active.
 */

export class GameCursor {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.activeUIs = new Set();
    this.isAltHeld = false;
    this.cursorElem = null;
    this.onStateChangeCallbacks = [];

    this.createCustomCursorDOM();
    this.bindEvents();
  }

  createCustomCursorDOM() {
    let elem = document.getElementById('game-cursor');
    if (!elem) {
      elem = document.createElement('div');
      elem.id = 'game-cursor';
      elem.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
          <defs>
            <filter id="cursor-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#00ffff" flood-opacity="0.9"/>
            </filter>
          </defs>
          <path d="M3 2 L19 12 L11 14 L8 21 Z" fill="#061220" stroke="#00ffff" stroke-width="1.8" filter="url(#cursor-glow)"/>
          <circle cx="11" cy="14" r="1.5" fill="#ff00e5" />
        </svg>
      `;
      document.body.appendChild(elem);
    }
    this.cursorElem = elem;
  }

  bindEvents() {
    // Mouse movement updates the custom cursor position when unlocked
    window.addEventListener('mousemove', (e) => {
      if (!this.inputManager.isPointerLocked && this.cursorElem) {
        this.cursorElem.style.left = `${e.clientX}px`;
        this.cursorElem.style.top = `${e.clientY}px`;
      }
    });

    // Alt key holds Free Cursor Mode
    window.addEventListener('keydown', (e) => {
      if (e.code === 'AltLeft' || e.code === 'AltRight') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        if (!this.isAltHeld) {
          this.isAltHeld = true;
          this.activeUIs.add('alt_inspect');
          this.inputManager.exitPointerLock();
          this.updateCursorVisibility();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'AltLeft' || e.code === 'AltRight') {
        if (this.isAltHeld) {
          this.isAltHeld = false;
          this.activeUIs.delete('alt_inspect');
          this.updateCursorVisibility();
          if (!this.isAnyUIOpen()) {
            this.requestReLock();
          }
        }
      }
    });

    // Pointer lock change listener to sync cursor visibility
    document.addEventListener('pointerlockchange', () => {
      this.updateCursorVisibility();
    });

    // Fallback: clicking game canvas when no UI is open re-locks
    this.inputManager.domElement.addEventListener('click', () => {
      if (!this.isAnyUIOpen() && !this.inputManager.isPointerLocked) {
        this.requestReLock();
      }
    });
  }

  isAnyUIOpen() {
    return this.activeUIs.size > 0;
  }

  openUI(uiId) {
    this.activeUIs.add(uiId);
    this.inputManager.exitPointerLock();
    this.updateCursorVisibility();
    this.notifyStateChange();
  }

  closeUI(uiId) {
    this.activeUIs.delete(uiId);
    this.updateCursorVisibility();
    this.notifyStateChange();

    // If all UI modals are now closed, instantly re-engage camera lock!
    if (!this.isAnyUIOpen()) {
      this.requestReLock();
    }
  }

  toggleUI(uiId) {
    if (this.activeUIs.has(uiId)) {
      this.closeUI(uiId);
      return false;
    } else {
      this.openUI(uiId);
      return true;
    }
  }

  requestReLock() {
    requestAnimationFrame(() => {
      if (!this.isAnyUIOpen()) {
        this.inputManager.requestPointerLock();
      }
    });
  }

  updateCursorVisibility() {
    const showCursor = !this.inputManager.isPointerLocked;
    if (this.cursorElem) {
      this.cursorElem.style.display = showCursor ? 'block' : 'none';
    }
    document.body.classList.toggle('ui-cursor-active', showCursor);
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  notifyStateChange() {
    for (const cb of this.onStateChangeCallbacks) {
      cb(this.isAnyUIOpen(), Array.from(this.activeUIs));
    }
  }
}
