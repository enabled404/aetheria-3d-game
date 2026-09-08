import * as THREE from 'three';

export class HarvestSystem {
  constructor(scene, cameraController, particleEngine, foliageSystem, collisionSystem) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.particleEngine = particleEngine;
    this.foliageSystem = foliageSystem;
    this.collisionSystem = collisionSystem;

    this.swingCooldown = 0;
  }

  update(dt) {
    if (this.swingCooldown > 0) this.swingCooldown -= dt;
  }

  performHarvest(player, onGather) {
    if (this.swingCooldown > 0) return null;
    this.swingCooldown = 0.42;

    // Trigger harvesting swing animation
    player.animator.triggerAction('attack1', 0.4);
    this.cameraController.addShake(0.05);

    const fwd = this.cameraController.getForwardVector();
    const pPos = player.position;

    // Check for nearby harvestable trees, rocks, and crystals within 3.5m forward cone
    let bestTarget = null;
    let minScore = Infinity;

    // 1. Check Trees
    if (this.foliageSystem?.trees) {
      for (const t of this.foliageSystem.trees) {
        if (t.hp <= 0) continue;
        const dx = t.x - pPos.x;
        const dz = t.z - pPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 3.4) {
          const dot = (dx * fwd.x + dz * fwd.z) / dist;
          if (dot > 0.3) {
            const score = dist - dot * 1.5;
            if (score < minScore) {
              minScore = score;
              bestTarget = { type: 'tree', obj: t, x: t.x, y: t.y + 1.2, z: t.z };
            }
          }
        }
      }
    }

    // 2. Check Rocks
    if (this.foliageSystem?.rocks) {
      for (const r of this.foliageSystem.rocks) {
        if (r.hp <= 0) continue;
        const dx = r.x - pPos.x;
        const dz = r.z - pPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 3.2) {
          const dot = (dx * fwd.x + dz * fwd.z) / dist;
          if (dot > 0.3) {
            const score = dist - dot * 1.5;
            if (score < minScore) {
              minScore = score;
              bestTarget = { type: 'rock', obj: r, x: r.x, y: r.y + 0.6, z: r.z };
            }
          }
        }
      }
    }

    // 3. Check Crystals
    if (this.foliageSystem?.crystals) {
      for (const c of this.foliageSystem.crystals) {
        if (c.hp <= 0) continue;
        const dx = c.x - pPos.x;
        const dz = c.z - pPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 3.0) {
          const dot = (dx * fwd.x + dz * fwd.z) / dist;
          if (dot > 0.3) {
            const score = dist - dot * 1.5;
            if (score < minScore) {
              minScore = score;
              bestTarget = { type: 'crystal', obj: c, x: c.x, y: c.y + 1.0, z: c.z };
            }
          }
        }
      }
    }

    if (!bestTarget) {
      return { hit: false };
    }

    const hitPos = new THREE.Vector3(bestTarget.x, bestTarget.y, bestTarget.z);
    bestTarget.obj.hp = (bestTarget.obj.hp || 5) - 1;

    let resourceType = '';
    let amount = 0;
    let label = '';
    let color = 0xffffff;

    if (bestTarget.type === 'tree') {
      resourceType = 'wood';
      amount = 2 + Math.floor(Math.random() * 2);
      label = `+${amount} Timber 🪵`;
      color = 0x8b5a2b;
      this.particleEngine?.spawnSparks(hitPos, 14, 0x9c6644, 5.0);
      player.inventory.wood = (player.inventory.wood || 0) + amount;

      if (bestTarget.obj.hp <= 0) {
        player.inventory.wood += 4;
        this.particleEngine?.spawnSparks(hitPos, 28, 0x582f0e, 7.0);
        label = `🌲 Tree Felled (+${amount + 4} Timber)`;
      }
    } else if (bestTarget.type === 'rock') {
      resourceType = 'stone';
      amount = 2 + Math.floor(Math.random() * 2);
      label = `+${amount} Granite 🪨`;
      color = 0x888888;
      this.particleEngine?.spawnSparks(hitPos, 16, 0xaaaaaa, 5.5);
      player.inventory.stone = (player.inventory.stone || 0) + amount;

      if (bestTarget.obj.hp <= 0) {
        player.inventory.stone += 3;
        this.particleEngine?.spawnSparks(hitPos, 30, 0x666666, 7.5);
        label = `🪨 Boulder Shattered (+${amount + 3} Granite)`;
      }
    } else if (bestTarget.type === 'crystal') {
      resourceType = 'crystal';
      amount = 1 + Math.floor(Math.random() * 2);
      label = `+${amount} Chrono Crystal 💎`;
      color = 0x00ffff;
      this.particleEngine?.spawnSparks(hitPos, 22, 0x00e5ff, 8.0);
      player.inventory.crystal = (player.inventory.crystal || 0) + amount;

      if (bestTarget.obj.hp <= 0) {
        player.inventory.crystal += 2;
        this.particleEngine?.spawnSparks(hitPos, 35, 0x00ffff, 10.0);
        label = `💎 Crystal Harvested (+${amount + 2} Crystals)`;
      }
    }

    this.cameraController.addShake(0.08);

    onGather?.({
      hit: true,
      type: bestTarget.type,
      resourceType,
      amount,
      label,
      hitPos
    });

    return {
      hit: true,
      type: bestTarget.type,
      resourceType,
      amount,
      label,
      hitPos
    };
  }
}
