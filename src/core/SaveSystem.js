export class SaveSystem {
  constructor(storageKey = 'aetheria_save_v3') {
    this.storageKey = storageKey;
    this.autoSaveTimer = 60.0;
  }

  save(gameContext, isAuto = false) {
    try {
      const p = gameContext.player;
      const b = gameContext.bossTitan;
      const bg = gameContext.buildGrid;
      const dep = gameContext.deployables;
      const sky = gameContext.sky;

      const saveData = {
        version: '3.5.0',
        timestamp: Date.now(),
        player: {
          x: p.position.x,
          y: p.position.y,
          z: p.position.z,
          rotY: p.model.group.rotation.y,
          health: p.health,
          maxHealth: p.maxHealth,
          stamina: p.stamina,
          hunger: p.hunger,
          level: p.level,
          xp: p.xp,
          nextLevelXp: p.nextLevelXp,
          inventory: p.inventory,
          hotbar: p.hotbar
        },
        sky: {
          timeOfDay: sky ? sky.timeOfDay : 0.25
        },
        boss: {
          isAwake: b ? b.isAwake : false,
          isDead: b ? b.isDead : false,
          health: b ? b.health : 950,
          phase: b ? b.phase : 1
        },
        blocks: bg ? bg.blocks.map(blk => ({ x: blk.pos.x, y: blk.pos.y, z: blk.pos.z, type: blk.type })) : [],
        deployables: {
          campfires: dep ? dep.campfires.map(c => ({ x: c.pos.x, y: c.pos.y, z: c.pos.z })) : [],
          crates: dep ? dep.crates.map(c => ({ x: c.pos.x, y: c.pos.y, z: c.pos.z })) : [],
          turrets: dep ? dep.turrets.map(t => ({ x: t.pos.x, y: t.pos.y, z: t.pos.z })) : []
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      return { success: true, isAuto };
    } catch (err) {
      console.warn('Save failed:', err);
      return { success: false, error: err };
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Load failed:', err);
      return null;
    }
  }

  hasSave() {
    return !!localStorage.getItem(this.storageKey);
  }

  update(dt, gameContext, onToast) {
    this.autoSaveTimer -= dt;
    if (this.autoSaveTimer <= 0) {
      this.autoSaveTimer = 60.0;
      const res = this.save(gameContext, true);
      if (res.success) {
        onToast?.('💾 Game Auto-Saved');
      }
    }
  }
}
