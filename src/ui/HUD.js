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
  }

  update(player, bossTitan, combatManager) {
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

    // Boss Bar
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

    // Charge Reticle
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
  }

  setHotbarActive(index) {
    this.hotbarSlots.forEach((slot, i) => {
      if (i === index) slot.classList.add('active');
      else slot.classList.remove('active');
    });
  }
}
