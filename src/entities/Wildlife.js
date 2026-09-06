import * as THREE from 'three';

export class Deer {
  constructor(scene, terrain, pos) {
    this.scene = scene;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.speed = 9.0;
    this.health = 25;
    this.isDead = false;

    this.buildMesh();
    this.scene.add(this.group);
  }

  buildMesh() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xd9c8b4, roughness: 0.5 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 1.4), mat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.group.add(body);

    // Neck & Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.5), mat);
    head.position.set(0, 1.45, 0.7);
    this.group.add(head);

    // Antlers
    const lHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5), hornMat);
    lHorn.position.set(-0.15, 1.8, 0.65);
    lHorn.rotation.z = -0.35;
    this.group.add(lHorn);
    const rHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5), hornMat);
    rHorn.position.set(0.15, 1.8, 0.65);
    rHorn.rotation.z = 0.35;
    this.group.add(rHorn);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      this.scene.remove(this.group);
      return true;
    }
    return false;
  }

  update(dt, playerPosition) {
    if (this.isDead) return;

    const dx = this.group.position.x - playerPosition.x;
    const dz = this.group.position.z - playerPosition.z;
    const dist = Math.hypot(dx, dz);

    // Flee if player is close
    if (dist < 16.0) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
      this.group.position.x += Math.sin(angle) * this.speed * dt;
      this.group.position.z += Math.cos(angle) * this.speed * dt;
      this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    }
  }
}
