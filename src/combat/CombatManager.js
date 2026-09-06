import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { DamageNumbers } from './DamageNumbers.js';

export class CombatManager {
  constructor(scene, cameraController) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.damageNumbers = new DamageNumbers(scene);

    this.projectiles = [];
    this.boulders = [];
    this.shockwaves = [];

    this.isParrying = false;
    this.comboIndex = 0;
    this.comboResetTimer = 0;
    this.chargeTime = 0;
    this.isCharging = false;
  }

  startCharging() {
    this.isCharging = true;
    this.chargeTime = 0;
  }

  releaseCharge(origin, forward) {
    if (!this.isCharging) return;
    const isFullCharge = this.chargeTime >= 1.2;
    this.isCharging = false;

    if (isFullCharge) {
      this.fireChargedOrb(origin, forward);
    } else {
      this.fireRapidBolt(origin, forward);
    }
  }

  fireRapidBolt(origin, forward) {
    const geom = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin);

    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      vel: forward.clone().multiplyScalar(42.0),
      damage: CONFIG.COMBAT.BLASTER_DAMAGE,
      radius: 0.5,
      life: 3.0,
      isAOE: false
    });
    this.cameraController.addShake(0.04);
  }

  fireChargedOrb(origin, forward) {
    const geom = new THREE.SphereGeometry(0.65, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00e5 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin);

    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      vel: forward.clone().multiplyScalar(28.0),
      damage: CONFIG.COMBAT.BLASTER_CHARGE_DAMAGE,
      radius: 3.5,
      life: 4.0,
      isAOE: true
    });
    this.cameraController.addShake(0.18);
  }

  performMeleeAttack(player, onHitTarget) {
    this.comboIndex = (this.comboIndex + 1) % 3;
    const animName = `attack${this.comboIndex + 1}`;
    player.animator.triggerAction(animName, 0.4);
    this.cameraController.addShake(0.06);

    const dmg = CONFIG.COMBAT.KATANA_COMBO_DAMAGE[this.comboIndex];
    onHitTarget?.(dmg, this.comboIndex === 2); // 3rd hit is crit
  }

  spawnBossShockwave(pos) {
    const ringGeom = new THREE.RingGeometry(0.5, 1.2, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff3b00, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(ringGeom, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
    this.scene.add(mesh);

    this.shockwaves.push({ mesh, radius: 1.0, maxRadius: 32.0, life: 2.2 });
    this.cameraController.addShake(0.35);
  }

  spawnBossBoulder(fromPos, toPos) {
    const geom = new THREE.DodecahedronGeometry(1.2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x221815, emissive: 0xff3300, emissiveIntensity: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(fromPos);
    this.scene.add(mesh);

    const dir = toPos.clone().sub(fromPos).normalize();
    this.boulders.push({ mesh, vel: dir.multiplyScalar(22.0), life: 4.0 });
  }

  update(dt, enemies, bossTitan, player, onPlayerTakeDamage, onEnemyKilled) {
    this.damageNumbers.update(dt);

    if (this.isCharging) {
      this.chargeTime += dt;
    }

    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      // Check hits on Boss Titan
      if (bossTitan && bossTitan.isAwake && !bossTitan.isDead) {
        if (p.mesh.position.distanceTo(bossTitan.group.position) < 5.0 + p.radius) {
          const killed = bossTitan.takeDamage(p.damage);
          this.damageNumbers.spawn(p.damage, bossTitan.group.position, p.isAOE);
          this.cameraController.addShake(0.12);
          if (killed) onEnemyKilled?.(bossTitan, 250);

          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check hits on regular enemies
      let hit = false;
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        if (p.mesh.position.distanceTo(enemy.group.position) < 1.4 + p.radius) {
          const killed = enemy.takeDamage(p.damage);
          this.damageNumbers.spawn(p.damage, enemy.group.position, p.isAOE);
          this.cameraController.addShake(0.08);
          if (killed) onEnemyKilled?.(enemy, 35);
          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      s.radius += dt * 14.0;
      s.mesh.scale.set(s.radius, s.radius, s.radius);
      s.mesh.material.opacity = Math.max(0, s.life / 2.2);

      // Check if shockwave hits player
      const dist = s.mesh.position.distanceTo(player.position);
      if (Math.abs(dist - s.radius) < 1.5 && player.position.y <= s.mesh.position.y + 0.8) {
        onPlayerTakeDamage?.(22);
      }

      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Boulders
    for (let i = this.boulders.length - 1; i >= 0; i--) {
      const b = this.boulders[i];
      b.life -= dt;
      b.mesh.position.addScaledVector(b.vel, dt);

      if (b.mesh.position.distanceTo(player.position) < 2.0) {
        onPlayerTakeDamage?.(28);
        this.scene.remove(b.mesh);
        this.boulders.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.boulders.splice(i, 1);
      }
    }
  }
}
