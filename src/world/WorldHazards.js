import * as THREE from 'three';

export class WorldHazards {
  constructor(scene, terrain, particleEngine, audioEngine, cameraController) {
    this.scene = scene;
    this.terrain = terrain;
    this.particleEngine = particleEngine;
    this.audioEngine = audioEngine;
    this.cameraController = cameraController;

    this.magmaCrystals = [];
    this.healingFlora = [];

    this.spawnWorldHazards();
  }

  spawnWorldHazards() {
    // 1. Spawn Volatile Magma Crystals across island
    const crystalGeom = new THREE.DodecahedronGeometry(1.2, 1);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x220505,
      emissive: 0xff3300,
      emissiveIntensity: 1.2,
      roughness: 0.3
    });

    const crystalPositions = [
      new THREE.Vector3(25, 0, 70),
      new THREE.Vector3(-42, 0, 95),
      new THREE.Vector3(65, 0, 35),
      new THREE.Vector3(-18, 0, -50),
      new THREE.Vector3(45, 0, -75),
      new THREE.Vector3(-60, 0, 40)
    ];

    for (const p of crystalPositions) {
      p.y = this.terrain.getHeightAt(p.x, p.z) + 0.8;
      const mesh = new THREE.Mesh(crystalGeom, crystalMat.clone());
      mesh.position.copy(p);
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(mesh);

      this.magmaCrystals.push({
        mesh,
        pos: p.clone(),
        health: 15,
        isDetonated: false
      });
    }

    // 2. Spawn Luminescent Healing Spore Flora
    const stalkGeom = new THREE.CylinderGeometry(0.3, 0.45, 1.4, 8);
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x184428, roughness: 0.8 });
    const capGeom = new THREE.SphereGeometry(1.1, 8, 8);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00e577,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    const floraPositions = [
      new THREE.Vector3(12, 0, 40),
      new THREE.Vector3(-15, 0, 55),
      new THREE.Vector3(30, 0, -20),
      new THREE.Vector3(-35, 0, -30)
    ];

    for (const p of floraPositions) {
      p.y = this.terrain.getHeightAt(p.x, p.z);
      const group = new THREE.Group();
      group.position.copy(p);

      const stalk = new THREE.Mesh(stalkGeom, stalkMat);
      stalk.position.y = 0.7;
      group.add(stalk);

      const cap = new THREE.Mesh(capGeom, capMat);
      cap.position.y = 1.4;
      cap.scale.set(1.0, 0.5, 1.0);
      group.add(cap);

      this.scene.add(group);

      this.healingFlora.push({
        group,
        pos: p.clone(),
        cooldown: 0
      });
    }
  }

  checkExplosions(projectilePos, radius, enemies, onDamageTarget) {
    for (const c of this.magmaCrystals) {
      if (c.isDetonated) continue;
      if (c.pos.distanceTo(projectilePos) < 2.2 + radius) {
        this.detonateCrystal(c, enemies, onDamageTarget);
        return true;
      }
    }
    return false;
  }

  detonateCrystal(crystal, enemies, onDamageTarget) {
    crystal.isDetonated = true;
    this.scene.remove(crystal.mesh);

    const pos = crystal.pos;
    this.particleEngine.spawnGroundSlamShockwave(pos);
    this.particleEngine.spawnSparks(pos, 32, 0xff3300, 14.0);
    this.audioEngine.playExplosionSound();
    this.cameraController.addShake(0.4);

    // AOE Damage to all enemies within 12m
    for (const e of enemies) {
      if (!e.isDead && e.group.position.distanceTo(pos) < 12.0) {
        onDamageTarget?.(e, 85, true);
      }
    }
  }

  update(dt, player, onHealPlayer) {
    // 1. Gentle pulse on crystals
    const time = Date.now() * 0.003;
    for (const c of this.magmaCrystals) {
      if (!c.isDetonated) {
        c.mesh.rotation.y += dt * 0.5;
        c.mesh.material.emissiveIntensity = 1.0 + Math.sin(time + c.pos.x) * 0.4;
      }
    }

    // 2. Check player proximity to healing flora
    for (const f of this.healingFlora) {
      if (f.cooldown > 0) {
        f.cooldown -= dt;
        continue;
      }

      if (player.position.distanceTo(f.pos) < 3.2 && player.health < player.maxHealth) {
        f.cooldown = 20.0; // 20s recharge
        onHealPlayer?.(35);
        this.particleEngine.spawnSparks(f.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 18, 0x00ff88, 5.0);
        this.audioEngine.playLootChime();
      }
    }
  }
}
