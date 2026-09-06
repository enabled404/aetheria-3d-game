import * as THREE from 'three';

export class BossTitan {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    this.position = new THREE.Vector3(0, terrain.getHeightAt(0, 0), 0);
    this.health = 950;
    this.maxHealth = 950;
    this.phase = 1;
    this.isAwake = false;
    this.isDead = false;

    this.stompTimer = 4.0;
    this.throwTimer = 6.0;

    this.buildTitanMesh();
    this.buildSummitAltar();
  }

  buildSummitAltar() {
    this.altarGroup = new THREE.Group();
    this.altarGroup.position.copy(this.position);

    const daisGeom = new THREE.CylinderGeometry(14, 16, 2.5, 12);
    const daisMat = new THREE.MeshStandardMaterial({ color: 0x242428, roughness: 0.9 });
    const dais = new THREE.Mesh(daisGeom, daisMat);
    dais.position.y = 1.25;
    dais.receiveShadow = true;
    this.altarGroup.add(dais);

    // 4 Runic Monoliths
    const monoGeom = new THREE.BoxGeometry(1.8, 6.5, 1.8);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const mono = new THREE.Mesh(monoGeom, runeMat);
      mono.position.set(Math.cos(ang) * 11, 4.5, Math.sin(ang) * 11);
      mono.castShadow = true;
      this.altarGroup.add(mono);
    }

    this.scene.add(this.altarGroup);
  }

  buildTitanMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d44,
      roughness: 0.95,
      metalness: 0.1
    });

    this.magmaMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff3300,
      emissiveIntensity: 0.6,
      roughness: 0.4
    });

    // Torso
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6, 1), stoneMat);
    torso.position.y = 5.5;
    torso.castShadow = true;
    this.group.add(torso);

    // Magma Core in chest
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 12), this.magmaMat);
    core.position.set(0, 5.5, 1.8);
    this.group.add(core);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.2), stoneMat);
    this.head.position.set(0, 9.2, 0.4);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Glowing Eyes
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.2), this.eyeMat);
    lEye.position.set(-0.65, 0.2, 1.15);
    this.head.add(lEye);
    const rEye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.2), this.eyeMat);
    rEye.position.set(0.65, 0.2, 1.15);
    this.head.add(rEye);

    // Massive Stone Arms
    this.lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 6.0, 8), stoneMat);
    this.lArm.position.set(-4.5, 4.5, 0);
    this.lArm.rotation.z = 0.3;
    this.lArm.castShadow = true;
    this.group.add(this.lArm);

    this.rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 6.0, 8), stoneMat);
    this.rArm.position.set(4.5, 4.5, 0);
    this.rArm.rotation.z = -0.3;
    this.rArm.castShadow = true;
    this.group.add(this.rArm);

    this.scene.add(this.group);
  }

  awaken() {
    this.isAwake = true;
    this.eyeMat.color.setHex(0xff2200); // Awaken to glowing red/orange eyes
  }

  takeDamage(amount) {
    if (!this.isAwake || this.isDead) return false;
    this.health = Math.max(0, this.health - amount);

    if (this.health <= this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.magmaMat.emissiveIntensity = 1.2;
      this.magmaMat.color.setHex(0xff0044);
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.group.position.y -= 1.5;
      return true; // Boss defeated!
    }
    return false;
  }

  update(dt, playerPosition, onShockwave, onThrowBoulder) {
    if (!this.isAwake || this.isDead) return;

    // Look at player
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const targetAngle = Math.atan2(dx, dz);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, dt * 2.5);

    // Movement toward player if far
    const dist = Math.hypot(dx, dz);
    if (dist > 8.0) {
      const speed = (this.phase === 2) ? 4.5 : 2.8;
      this.group.position.x += Math.sin(targetAngle) * speed * dt;
      this.group.position.z += Math.cos(targetAngle) * speed * dt;
      this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    }

    // Ground Stomp Attack
    this.stompTimer -= dt;
    if (this.stompTimer <= 0) {
      this.stompTimer = (this.phase === 2) ? 3.5 : 5.0;
      this.rArm.position.y = 7.0; // Slam animation
      setTimeout(() => { this.rArm.position.y = 4.5; }, 300);
      onShockwave?.(this.group.position.clone());
    }

    // Boulder Throw
    this.throwTimer -= dt;
    if (this.throwTimer <= 0) {
      this.throwTimer = (this.phase === 2) ? 4.0 : 6.5;
      onThrowBoulder?.(this.group.position.clone().add(new THREE.Vector3(0, 6, 0)), playerPosition.clone());
    }
  }
}
