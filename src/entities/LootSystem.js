import * as THREE from 'three';

export class LootSystem {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];

    // Shared geometries
    this.orbGeom = new THREE.DodecahedronGeometry(0.25);
    this.crystalGeom = new THREE.OctahedronGeometry(0.24);
    this.coreGeom = new THREE.TorusGeometry(0.28, 0.08, 8, 16);

    // Shared materials
    this.healthMat = new THREE.MeshStandardMaterial({
      color: 0x22ff66,
      emissive: 0x00cc44,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    this.chronoMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaff,
      emissiveIntensity: 0.9,
      roughness: 0.15
    });

    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff6600,
      emissiveIntensity: 0.95,
      metalness: 0.8
    });
  }

  spawnDrop(position, enemyType = 'grunt') {
    const group = new THREE.Group();
    group.position.copy(position).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      0.6,
      (Math.random() - 0.5) * 0.8
    ));

    // Determine drop type
    let itemType = 'vitality_orb';
    let label = '+25 HP Vitality Core';
    let mesh;

    const roll = Math.random();
    if (enemyType === 'brute' || roll < 0.45) {
      itemType = 'chrono_shard';
      label = '+2 Chrono Shards 💎';
      mesh = new THREE.Mesh(this.crystalGeom, this.chronoMat);
    } else if (enemyType === 'titan') {
      itemType = 'titan_core';
      label = '👑 Primordial Titan Core!';
      mesh = new THREE.Mesh(this.coreGeom, this.coreMat);
    } else {
      itemType = 'vitality_orb';
      label = '+25 HP Vitality Orb ❤️';
      mesh = new THREE.Mesh(this.orbGeom, this.healthMat);
    }

    mesh.castShadow = true;
    group.add(mesh);

    // Floating glow light
    const light = new THREE.PointLight(
      itemType === 'chrono_shard' ? 0x00ffff : (itemType === 'titan_core' ? 0xffaa00 : 0x22ff66),
      2.0,
      8.0
    );
    group.add(light);

    this.scene.add(group);

    this.drops.push({
      group,
      mesh,
      light,
      itemType,
      label,
      initialY: group.position.y,
      life: 45.0, // persists 45 seconds
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  update(dt, playerPosition, onCollect) {
    const headPos = playerPosition.clone().add(new THREE.Vector3(0, 1.0, 0));

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life -= dt;

      if (drop.life <= 0) {
        this.scene.remove(drop.group);
        this.drops.splice(i, 1);
        continue;
      }

      // Bobbing and spinning
      drop.mesh.rotation.y += dt * 2.5;
      drop.mesh.rotation.x += dt * 1.2;

      const dist = drop.group.position.distanceTo(headPos);

      // Magnetic suction physics when within 5.5 meters
      if (dist < 5.5) {
        const pullDir = headPos.clone().sub(drop.group.position).normalize();
        const pullSpeed = Math.min(24.0, (6.0 - dist) * 7.5 + 4.0);
        drop.group.position.add(pullDir.multiplyScalar(pullSpeed * dt));

        // Collection threshold
        if (dist < 0.85) {
          onCollect?.(drop.itemType, drop.label);
          this.scene.remove(drop.group);
          this.drops.splice(i, 1);
          continue;
        }
      } else {
        drop.group.position.y = drop.initialY + Math.sin(Date.now() * 0.003 + drop.bobOffset) * 0.2;
      }
    }
  }
}
