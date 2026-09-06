import * as THREE from 'three';

export class Enemy {
  constructor(scene, terrain, type = 'grunt', pos = new THREE.Vector3()) {
    this.scene = scene;
    this.terrain = terrain;
    this.type = type; // 'grunt' | 'brute' | 'stalker'

    this.health = (type === 'brute') ? 140 : (type === 'stalker' ? 50 : 75);
    this.maxHealth = this.health;
    this.speed = (type === 'stalker') ? 11.5 : (type === 'brute' ? 5.2 : 7.2);
    this.damage = (type === 'brute') ? 24 : 14;
    this.attackRange = (type === 'brute') ? 3.0 : 2.2;
    this.attackCooldown = 1.4;
    this.cooldownTimer = 0;
    this.isDead = false;

    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.buildMesh();
    this.scene.add(this.group);
  }

  buildMesh() {
    const mat = new THREE.MeshStandardMaterial({
      color: (this.type === 'brute') ? 0x1f1724 : (this.type === 'stalker' ? 0x2b4429 : 0x242d3d),
      roughness: 0.7,
      metalness: 0.3
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: (this.type === 'brute') ? 0xff2200 : (this.type === 'stalker' ? 0xffee00 : 0x00e5ff)
    });

    const s = (this.type === 'brute') ? 1.6 : (this.type === 'stalker' ? 0.9 : 1.1);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 1.1 * s, 0.5 * s), mat);
    body.position.y = 0.8 * s;
    body.castShadow = true;
    this.group.add(body);

    // Visor / Eye
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.15 * s, 0.1 * s), eyeMat);
    eye.position.set(0, 1.1 * s, 0.26 * s);
    this.group.add(eye);

    // Limbs
    this.lArm = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s), mat);
    this.lArm.position.set(-0.48 * s, 0.7 * s, 0);
    this.group.add(this.lArm);

    this.rArm = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s), mat);
    this.rArm.position.set(0.48 * s, 0.7 * s, 0);
    this.group.add(this.rArm);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isDead = true;
      this.scene.remove(this.group);
      return true; // died
    }
    return false;
  }

  update(dt, playerPosition, onAttackPlayer) {
    if (this.isDead) return;

    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 26.0) {
      // Rotate toward player
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;

      if (dist > this.attackRange) {
        // Chase player
        this.group.position.x += Math.sin(angle) * this.speed * dt;
        this.group.position.z += Math.cos(angle) * this.speed * dt;
        this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);

        // Walk swing
        this.lArm.rotation.x = Math.sin(Date.now() * 0.01) * 0.6;
        this.rArm.rotation.x = -Math.sin(Date.now() * 0.01) * 0.6;
      } else {
        // Attack
        if (this.cooldownTimer <= 0) {
          this.cooldownTimer = this.attackCooldown;
          this.rArm.rotation.x = -1.5;
          setTimeout(() => { this.rArm.rotation.x = 0; }, 250);
          onAttackPlayer?.(this.damage);
        }
      }
    }
  }
}
