import * as THREE from 'three';

export class TitleScreen {
  constructor(options = {}) {
    this.isActive = true;
    this.hasSave = !!options.hasSave;
    this.onStart = options.onStart || null;
    this.onContinue = options.onContinue || null;
    this.onOpenSettings = options.onOpenSettings || null;

    this.flyoverAngle = 0.5;
    this.swoopProgress = 0;
    this.isSwooping = false;
    this.startCamPos = new THREE.Vector3();
    this.targetCamPos = new THREE.Vector3();

    this.createDOM();
  }

  createDOM() {
    const el = document.createElement('div');
    el.id = 'title-screen';
    el.innerHTML = `
      <div class="title-container">
        <div class="title-badge">CHRONOMANTIC EXPEDITION 3.0</div>
        <h1 class="game-logo">A E T H E R I A</h1>
        <div class="game-sublogo">OPEN-WORLD 3D ACTION SURVIVAL RPG</div>

        <p class="title-lore">
          Your vessel fractured across temporal fault lines above the uncharted island of Aetheria.
          Chop timber, quarry stone, forge ion armaments, master time stasis bubbles, and ascend the mountain summit to defeat The Ancient Titan.
        </p>

        <div class="title-actions">
          <button id="btn-start-expedition" class="title-btn-pri">
            <span style="font-size:18px;">⚡</span> START EXPEDITION
          </button>
          ${this.hasSave ? `
            <button id="btn-continue-expedition" class="title-btn-sec">
              💾 CONTINUE SAVED EXPEDITION
            </button>
          ` : ''}
          <button id="btn-title-settings" class="title-btn-ter">
            ⚙️ PREFERENCES & CONTROLS
          </button>
        </div>

        <div class="title-features-strip">
          <div class="tf-item">🌲 Real-time Tree & Rock Harvesting</div>
          <div class="tf-item">🗡️ 3D Equippable Weapons & Shields</div>
          <div class="tf-item">⏳ Chrono Stasis & Ground Slams</div>
          <div class="tf-item">🧭 Epic Narrative Quests & Titan Boss</div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.domElement = el;

    document.getElementById('btn-start-expedition')?.addEventListener('click', () => {
      this.beginGame(false);
    });

    document.getElementById('btn-continue-expedition')?.addEventListener('click', () => {
      this.beginGame(true);
    });

    document.getElementById('btn-title-settings')?.addEventListener('click', () => {
      this.onOpenSettings?.();
    });
  }

  beginGame(isContinue) {
    this.domElement.style.opacity = '0';
    this.domElement.style.pointerEvents = 'none';
    setTimeout(() => {
      this.domElement.style.display = 'none';
    }, 600);

    this.isActive = false;
    if (isContinue) {
      this.onContinue?.();
    } else {
      this.onStart?.();
    }
  }

  updateFlyover(dt, camera) {
    if (!this.isActive) return;

    this.flyoverAngle += dt * 0.12;
    const radius = 175.0;
    const camY = 65.0 + Math.sin(this.flyoverAngle * 0.8) * 12.0;

    camera.position.set(
      Math.cos(this.flyoverAngle) * radius,
      camY,
      Math.sin(this.flyoverAngle) * radius
    );
    camera.lookAt(0, 18, 0);
  }
}
