export class HUD {
  constructor() {
    this.hpBar = document.getElementById('hp-bar');
    this.hpVal = document.getElementById('hp-val');
    this.staBar = document.getElementById('sta-bar');
    this.hunBar = document.getElementById('hun-bar');
    this.xpBar = document.getElementById('xp-bar');
    this.lvlVal = document.getElementById('lvl-val');

    this.bossCard = document.getElementById('boss-card');
    this.bossHpBar = document.getElementById('boss-hp-bar');
    this.bossHpVal = document.getElementById('boss-hp-val');

    this.hotbarSlots = document.querySelectorAll('.hotbar-slot');
    this.chargeReticle = document.getElementById('charge-reticle');

    // Enhanced UI Elements
    this.radarCanvas = document.getElementById('mini-radar-canvas');
    this.radarCtx = this.radarCanvas?.getContext('2d');

    this.vignette = document.getElementById('damage-vignette');
    this.vignetteOpacity = 0;

    this.speedLines = document.getElementById('speed-lines');
    this.speedLinesCtx = this.speedLines?.getContext('2d');
    if (this.speedLines) {
      this.speedLines.width = window.innerWidth;
      this.speedLines.height = window.innerHeight;
      window.addEventListener('resize', () => {
        this.speedLines.width = window.innerWidth;
        this.speedLines.height = window.innerHeight;
      });
    }

    this.toastElem = document.getElementById('hud-toast');
    this.toastTimer = 0;

    this.promptElem = document.getElementById('context-prompt');
  }

  showToast(text) {
    if (!this.toastElem) return;
    this.toastElem.textContent = text;
    this.toastElem.style.opacity = '1';
    this.toastElem.style.transform = 'translate(-50%, 0)';
    this.toastTimer = 2.8;
  }

  showPrompt(text) {
    if (!this.promptElem) return;
    if (text) {
      this.promptElem.textContent = text;
      this.promptElem.style.opacity = '1';
    } else {
      this.promptElem.style.opacity = '0';
    }
  }

  flashDamage() {
    this.vignetteOpacity = 0.85;
  }

  update(player, bossTitan, combatManager, enemies = [], npcs = [], yaw = 0, isSprinting = false, dt = 0.016) {
    // 1. Bars
    if (this.hpBar) {
      const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
      this.hpBar.style.width = `${hpPct}%`;
      this.hpVal.textContent = `${Math.round(player.health)} / ${player.maxHealth}`;
    }

    if (this.staBar) {
      const staPct = Math.max(0, (player.stamina / player.maxStamina) * 100);
      this.staBar.style.width = `${staPct}%`;
    }

    if (this.hunBar) {
      const hunPct = Math.max(0, (player.hunger / player.maxHunger) * 100);
      this.hunBar.style.width = `${hunPct}%`;
    }

    if (this.xpBar) {
      const xpPct = Math.max(0, (player.xp / player.nextLevelXp) * 100);
      this.xpBar.style.width = `${xpPct}%`;
      this.lvlVal.textContent = `LVL ${player.level}`;
    }

    // 2. Boss Bar
    if (this.bossCard) {
      if (bossTitan && bossTitan.isAwake && !bossTitan.isDead) {
        this.bossCard.style.display = 'block';
        const bPct = Math.max(0, (bossTitan.health / bossTitan.maxHealth) * 100);
        this.bossHpBar.style.width = `${bPct}%`;
        this.bossHpVal.textContent = `${Math.round(bossTitan.health)} / ${bossTitan.maxHealth}`;
      } else {
        this.bossCard.style.display = 'none';
      }
    }

    // 3. Charge Reticle
    if (this.chargeReticle && combatManager) {
      if (combatManager.isCharging) {
        this.chargeReticle.style.display = 'block';
        const prog = Math.min(1.0, combatManager.chargeTime / 1.2);
        this.chargeReticle.style.transform = `scale(${1 + prog * 0.8})`;
        this.chargeReticle.style.borderColor = prog >= 1.0 ? '#ff00e5' : '#00ffff';
      } else {
        this.chargeReticle.style.display = 'none';
      }
    }

    // 4. Damage Vignette
    if (this.vignette) {
      const lowHpFactor = Math.max(0, (0.35 - player.health / player.maxHealth) * 2.0);
      this.vignetteOpacity = Math.max(this.vignetteOpacity - dt * 2.0, lowHpFactor);
      this.vignette.style.opacity = `${this.vignetteOpacity}`;
    }

    // 5. Toast Timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0 && this.toastElem) {
        this.toastElem.style.opacity = '0';
        this.toastElem.style.transform = 'translate(-50%, -10px)';
      }
    }

    // 6. Speed Lines Canvas
    if (this.speedLinesCtx) {
      const ctx = this.speedLinesCtx;
      const w = this.speedLines.width;
      const h = this.speedLines.height;
      ctx.clearRect(0, 0, w, h);

      if (isSprinting || player.isThrusterActive) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 1.5;
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const r1 = Math.min(w, h) * 0.38 + Math.random() * 80;
          const r2 = r1 + 60 + Math.random() * 80;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
          ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
          ctx.stroke();
        }
      }
    }

    // 7. Mini-Radar
    if (this.radarCtx && this.radarCanvas) {
      this.renderMiniRadar(player.position, enemies, npcs, bossTitan, yaw);
    }
  }

  renderMiniRadar(playerPos, enemies, npcs, bossTitan, yaw) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 4;
    const radarRange = 65.0; // World meters visible on radar

    ctx.clearRect(0, 0, w, h);

    // Background circle
    ctx.fillStyle = 'rgba(6, 12, 22, 0.75)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Range rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Coordinate rotation matrix relative to player yaw
    const toRadar = (worldPos) => {
      const dx = worldPos.x - playerPos.x;
      const dz = worldPos.z - playerPos.z;

      // Rotate by player yaw so radar heads forward
      const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);

      const px = cx + (rx / radarRange) * (radius - 6);
      const py = cy + (rz / radarRange) * (radius - 6);
      return { px, py, dist: Math.hypot(rx, rz) };
    };

    // Summit Altar / Boss
    if (bossTitan) {
      const b = toRadar(bossTitan.group.position);
      if (b.dist < radarRange) {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(b.px, b.py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Friendly NPCs
    for (const npc of npcs) {
      const n = toRadar(npc.position);
      if (n.dist < radarRange) {
        ctx.fillStyle = npc.color || '#00ffff';
        ctx.beginPath();
        ctx.arc(n.px, n.py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hostile Enemies
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const e = toRadar(enemy.group.position);
      if (e.dist < radarRange) {
        ctx.fillStyle = '#ff3344';
        ctx.beginPath();
        ctx.arc(e.px, e.py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player arrow in center
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  setHotbarActive(index) {
    this.hotbarSlots.forEach((slot, i) => {
      if (i === index) slot.classList.add('active');
      else slot.classList.remove('active');
    });
  }
}
