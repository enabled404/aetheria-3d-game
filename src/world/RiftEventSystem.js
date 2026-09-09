import * as THREE from 'three';

export class RiftEventSystem {
  constructor(scene, terrain, particleEngine, audioEngine) {
    this.scene = scene;
    this.terrain = terrain;
    this.particleEngine = particleEngine;
    this.audioEngine = audioEngine;

    this.activeRift = null;
    this.spawnTimer = 60.0; // First rift opens 60s into the run, then every 240s
    this.interval = 240.0;
  }

  spawnRift(playerPos, onSpawnGuardians = null, onAnnounce = null) {
    if (this.activeRift) return;

    // Pick a dramatic location 45-80m away from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 48 + Math.random() * 32;
    const rx = playerPos.x + Math.cos(angle) * dist;
    const rz = playerPos.z + Math.sin(angle) * dist;
    const ry = this.terrain.getHeightAt(rx, rz);
    const pos = new THREE.Vector3(rx, ry, rz);

    // 1. Vertical Sky Beacon
    const beaconGeom = new THREE.CylinderGeometry(0.8, 1.8, 180, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xb026ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(rx, ry + 90, rz);
    this.scene.add(beacon);

    // 2. Swirling Dimensional Core
    const coreGeom = new THREE.DodecahedronGeometry(2.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x140d24,
      emissive: 0xaa11ff,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.position.set(rx, ry + 3.0, rz);
    this.scene.add(coreMesh);

    // 3. Ground Runic Ring
    const ringGeom = new THREE.RingGeometry(2.0, 5.5, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xb026ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(rx, ry + 0.15, rz);
    this.scene.add(ring);

    this.activeRift = {
      pos,
      beacon,
      coreMesh,
      ring,
      health: 140,
      maxHealth: 140,
      life: 180, // 3 minutes to defeat
      isCompleted: false
    };

    this.particleEngine.spawnSparks(pos, 35, 0xb026ff, 14.0);
    this.audioEngine.playWarpSound();
    onAnnounce?.('🌀 A Dimensional Void Rift has opened! Check your survey map.');

    // Spawn 2 Phantoms and 1 Berserker guarding the rift
    onSpawnGuardians?.(pos);
  }

  damageRift(amount, onRiftDefeated = null) {
    if (!this.activeRift || this.activeRift.isCompleted) return false;

    this.activeRift.health = Math.max(0, this.activeRift.health - amount);
    this.particleEngine.spawnSparks(this.activeRift.coreMesh.position, 12, 0xb026ff, 6.0);

    if (this.activeRift.health <= 0) {
      this.completeRift(onRiftDefeated);
      return true;
    }
    return false;
  }

  completeRift(onRiftDefeated = null) {
    if (!this.activeRift) return;
    this.activeRift.isCompleted = true;

    const pos = this.activeRift.pos.clone();
    this.particleEngine.spawnGroundSlamShockwave(pos);
    this.particleEngine.spawnSparks(pos, 45, 0xffd700, 16.0);
    this.audioEngine.playExplosionSound();

    this.scene.remove(this.activeRift.beacon);
    this.scene.remove(this.activeRift.coreMesh);
    this.scene.remove(this.activeRift.ring);

    onRiftDefeated?.(pos);
    this.activeRift = null;
    this.spawnTimer = this.interval;
  }

  update(dt, playerPos, onSpawnGuardians, onAnnounce, onRiftDefeated) {
    if (!this.activeRift) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnRift(playerPos, onSpawnGuardians, onAnnounce);
      }
      return;
    }

    // Rotate core & ring
    this.activeRift.coreMesh.rotation.y += dt * 1.5;
    this.activeRift.coreMesh.rotation.x += dt * 0.8;
    this.activeRift.ring.rotation.z += dt * 0.5;

    // Timeout check
    this.activeRift.life -= dt;
    if (this.activeRift.life <= 0) {
      // Rift collapsed
      this.scene.remove(this.activeRift.beacon);
      this.scene.remove(this.activeRift.coreMesh);
      this.scene.remove(this.activeRift.ring);
      this.activeRift = null;
      this.spawnTimer = this.interval;
    }
  }

  getRiftPosition() {
    return this.activeRift ? this.activeRift.pos : null;
  }
}
