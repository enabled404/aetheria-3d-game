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

    // Tactical Reticle Elements
    this.crosshairElem = document.getElementById('tactical-crosshair');
    this.hitmarkerElem = document.getElementById('reticle-hitmarker');
    this.targetTagElem = document.getElementById('reticle-target-tag');
    this.altInspectElem = document.getElementById('alt-inspect-banner');
    this.recoilBloom = 9.0;
    this.hitmarkerTimer = 0;

    // Enhanced UI Elements
    this.radarCanvas = document.getElementById('mini-radar-canvas');
    this.radarCtx = this.radarCanvas?.getContext('2d');

    this.vignette = document.getElementById('damage-vignette');
    this.vignetteOpacity = 0;

    this.toastElem = document.getElementById('hud-toast');
    this.toastTimer = 0;

    this.promptElem = document.getElementById('context-prompt');

    // Weather Pill Elements
    this.weatherPill = document.getElementById('weather-pill');
    this.weatherIcon = document.getElementById('weather-icon');
    this.weatherLabel = document.getElementById('weather-label');
    this.weatherDetail = document.getElementById('weather-detail');
  }

  setWeatherStatus(status) {
    if (!this.weatherPill) {
      this.weatherPill = document.getElementById('weather-pill');
      this.weatherIcon = document.getElementById('weather-icon');
      this.weatherLabel = document.getElementById('weather-label');
      this.weatherDetail = document.getElementById('weather-detail');
    }
    if (!status || !this.weatherPill) return;
    if (this.weatherIcon) this.weatherIcon.textContent = status.icon;
    if (this.weatherLabel) {
      this.weatherLabel.textContent = status.label;
      this.weatherLabel.style.color = status.color || '#00ffff';
    }
    if (this.weatherDetail) this.weatherDetail.textContent = status.detail;
    this.weatherPill.style.borderColor = status.color || 'rgba(0, 229, 255, 0.35)';
  }

  setAiming(isAiming) {
    if (this.crosshairElem) {
      this.crosshairElem.classList.toggle('aiming', !!isAiming);
    }
  }

  setTargetLock(target) {
    if (!this.crosshairElem || !this.targetTagElem) return;
    if (target) {
      this.crosshairElem.classList.add('locked-on');
      this.targetTagElem.textContent = `${target.icon || '🎯'} ${target.name} [${Math.round(target.distance)}m]`;
      this.targetTagElem.className = `visible ${target.isHostile ? 'hostile' : ''}`;
    } else {
      this.crosshairElem.classList.remove('locked-on');
      this.targetTagElem.className = '';
    }
  }

  flashHitmarker(isCrit = false) {
    if (!this.hitmarkerElem) return;
    this.hitmarkerElem.className = isCrit ? 'hit crit' : 'hit';
    this.hitmarkerTimer = 0.22;
  }

  setAltInspect(isActive) {
    if (this.altInspectElem) {
      this.altInspectElem.style.display = isActive ? 'block' : 'none';
    }
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

  update(player, bossTitan, combatManager, enemies = [], npcs = [], yaw = 0, isSprinting = false, dt = 0.016, riftPos = null, airplanes = []) {
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

    // 4. Hitmarker Timer
    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer -= dt;
      if (this.hitmarkerTimer <= 0 && this.hitmarkerElem) {
        this.hitmarkerElem.className = '';
      }
    }

    // 5. Dynamic Tactical Reticle Recoil Bloom
    if (this.crosshairElem) {
      let targetGap = 9.0;
      if (this.crosshairElem.classList.contains('aiming')) targetGap = 5.0;
      else if (isSprinting) targetGap = 16.0;
      if (combatManager?.isCharging) targetGap += Math.min(10.0, combatManager.chargeTime * 8.0);

      this.recoilBloom += (targetGap - this.recoilBloom) * Math.min(1.0, dt * 16.0);
      this.crosshairElem.style.setProperty('--reticle-gap', `${this.recoilBloom.toFixed(1)}px`);
    }

    // 6. Damage Vignette
    if (this.vignette) {
      const lowHpFactor = Math.max(0, (0.35 - player.health / player.maxHealth) * 2.0);
      this.vignetteOpacity = Math.max(this.vignetteOpacity - dt * 2.0, lowHpFactor);
      this.vignette.style.opacity = `${this.vignetteOpacity}`;
    }

    // 7. Toast Timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0 && this.toastElem) {
        this.toastElem.style.opacity = '0';
        this.toastElem.style.transform = 'translate(-50%, -10px)';
      }
    }

    // 8. Mini-Radar (clean, accurate orientation)
    if (this.radarCtx && this.radarCanvas) {
      this.renderMiniRadar(player.position, enemies, npcs, bossTitan, yaw, riftPos, airplanes);
    }
  }

  renderMiniRadar(playerPos, enemies, npcs, bossTitan, yaw, riftPos = null, airplanes = []) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 4;
    const radarRange = 65.0; // World meters visible on radar

    ctx.clearRect(0, 0, w, h);

    // Background circle
    ctx.fillStyle = 'rgba(6, 12, 22, 0.8)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Range rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Coordinate rotation matrix relative to player yaw
    const toRadar = (worldPos) => {
      const dx = worldPos.x - playerPos.x;
      const dz = worldPos.z - playerPos.z;

      // Rotate by player yaw so radar forward matches view
      const rx = dx * Math.cos(-yaw) - dz * Math.sin(-yaw);
      const rz = dx * Math.sin(-yaw) + dz * Math.cos(-yaw);

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
        ctx.arc(b.px, b.py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Friendly NPCs
    for (const npc of npcs) {
      const n = toRadar(npc.position);
      if (n.dist < radarRange) {
        ctx.fillStyle = npc.color || '#00ffff';
        ctx.beginPath();
        ctx.arc(n.px, n.py, 4, 0, Math.PI * 2);
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
        ctx.arc(e.px, e.py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Aeroplanes / Airport
    if (airplanes) {
      for (const plane of airplanes) {
        const pl = toRadar(plane.group.position);
        if (pl.dist < radarRange) {
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(pl.px, pl.py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
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
