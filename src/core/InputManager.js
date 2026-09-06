export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = {};
    this.justPressedKeys = {};
    this.mouseButtons = {};
    this.justPressedMouse = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isPointerLocked = false;
    this.selectedHotbarIndex = 0;

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.justPressedKeys[code] = true;
      }
      this.keys[code] = true;

      // Hotbar 1-6
      if (e.key >= '1' && e.key <= '6') {
        this.selectedHotbarIndex = parseInt(e.key, 10) - 1;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) {
        this.requestPointerLock();
        return;
      }
      this.mouseButtons[e.button] = true;
      this.justPressedMouse[e.button] = true;
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDelta.x += e.movementX || 0;
        this.mouseDelta.y += e.movementY || 0;
      }
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked) return;
      if (e.deltaY > 0) {
        this.selectedHotbarIndex = (this.selectedHotbarIndex + 1) % 6;
      } else if (e.deltaY < 0) {
        this.selectedHotbarIndex = (this.selectedHotbarIndex + 5) % 6;
      }
    }, { passive: true });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
    });
  }

  requestPointerLock() {
    this.domElement.requestPointerLock?.();
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  wasKeyJustPressed(code) {
    const val = !!this.justPressedKeys[code];
    this.justPressedKeys[code] = false;
    return val;
  }

  isMouseDown(btn) {
    return !!this.mouseButtons[btn];
  }

  wasMouseJustPressed(btn) {
    const val = !!this.justPressedMouse[btn];
    this.justPressedMouse[btn] = false;
    return val;
  }

  consumeMouseDelta() {
    const d = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return d;
  }

  clearFrame() {
    this.justPressedKeys = {};
    this.justPressedMouse = {};
  }
}
