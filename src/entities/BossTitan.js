import * as THREE from 'three';

export class BossTitan {
  constructor(scene, terrain, collisionSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.collisionSystem = collisionSystem;

    this.position = new THREE.Vector3(0, terrain.getHeightAt(0, 0), 0);
    this.health = 1100;
    this.maxHealth = 1100;
    this.phase = 1;
    this.isAwake = false;
    this.isDead = false;

    this.stompTimer = 4.0;
    this.throwTimer = 6.0;
    this.meteorTimer = 4.5;
    this.minionTimer = 12.0;

    this.shieldCrystals = [];
    this.forcefieldMesh = null;
    this.activeMeteors = [];

    this.buildTitanMesh();
    this.buildSummitAltar();
    this.buildForcefield();
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
      const mx = Math.cos(ang) * 11;
      const mz = Math.sin(ang) * 11;
      const mono = new THREE.Mesh(monoGeom, runeMat);
      mono.position.set(mx, 4.5, mz);
      mono.castShadow = true;
      this.altarGroup.add(mono);

      if (this.collisionSystem) {
        this.collisionSystem.addCollider(this.position.x + mx, this.position.z + mz, 1.2, 7.0, 'monolith');
      }
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

  buildForcefield() {
    const geom = new THREE.IcosahedronGeometry(7.2, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
      wireframe: true
    });
    this.forcefieldMesh = new THREE.Mesh(geom, mat);
    this.forcefieldMesh.position.y = 5.5;
    this.forcefieldMesh.visible = false;
    this.group.add(this.forcefieldMesh);
  }

  spawnShieldCrystals() {
    this.shieldCrystals = [];
    const count = 3;
    const crystalGeom = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(crystalGeom, crystalMat);
      const angle = (i / count) * Math.PI * 2;
      const dist = 12.5;
      mesh.position.set(Math.cos(angle) * dist, 5.0, Math.sin(angle) * dist);
      this.group.add(mesh);

      this.shieldCrystals.push({
        mesh,
        angle,
        health: 60,
        maxHealth: 60,
        isDead: false
      });
    }

    this.forcefieldMesh.visible = true;
  }

  damageCrystal(crystal, amount) {
    if (crystal.isDead) return false;
    crystal.health = Math.max(0, crystal.health - amount);
    if (crystal.health <= 0) {
      crystal.isDead = true;
      this.group.remove(crystal.mesh);

      // Check if all crystals destroyed
      const anyAlive = this.shieldCrystals.some(c => !c.isDead);
      if (!anyAlive) {
        this.forcefieldMesh.visible = false; // Shield shattered!
      }
      return true; // crystal destroyed
    }
    return false;
  }

  awaken() {
    this.isAwake = true;
    this.eyeMat.color.setHex(0xff2200);
  }

  takeDamage(amount) {
    if (!this.isAwake || this.isDead) return false;

    // Phase 3 Invulnerability while crystals live
    if (this.phase === 3 && this.shieldCrystals.some(c => !c.isDead)) {
      return false; // Deflected by Runic Forcefield!
    }

    this.health = Math.max(0, this.health - amount);

    // Transition to Phase 2 (Magma Enrage at <60% HP)
    if (this.health <= this.maxHealth * 0.60 && this.phase === 1) {
      this.phase = 2;
      this.magmaMat.emissiveIntensity = 1.3;
      this.magmaMat.color.setHex(0xff0044);
    }

    // Transition to Phase 3 (Apex Overdrive at <25% HP)
    if (this.health <= this.maxHealth * 0.25 && this.phase === 2) {
      this.phase = 3;
      this.magmaMat.emissiveIntensity = 2.0;
      this.magmaMat.color.setHex(0xff00ff);
      this.spawnShieldCrystals();
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.group.position.y -= 1.5;
      if (this.forcefieldMesh) this.forcefieldMesh.visible = false;
      return true; // Boss defeated!
    }
    return false;
  }

  update(dt, playerPosition, onShockwave, onThrowBoulder, onSummonMinions = null, onMeteorStrike = null) {
    if (!this.isAwake || this.isDead) return;

    // Look at player
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const targetAngle = Math.atan2(dx, dz);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, dt * 2.5);

    // Movement toward player if far
    const dist = Math.hypot(dx, dz);
    if (dist > 8.5) {
      const speed = (this.phase === 3) ? 5.2 : (this.phase === 2 ? 4.2 : 2.8);
      this.group.position.x += Math.sin(targetAngle) * speed * dt;
      this.group.position.z += Math.cos(targetAngle) * speed * dt;
      this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    }

    // 1. Ground Stomp Attack
    this.stompTimer -= dt;
    if (this.stompTimer <= 0) {
      this.stompTimer = (this.phase === 3) ? 2.8 : (this.phase === 2 ? 3.5 : 5.0);
      this.rArm.position.y = 7.0;
      setTimeout(() => { if (this.rArm) this.rArm.position.y = 4.5; }, 300);
      onShockwave?.(this.group.position.clone());
    }

    // 2. Boulder Throw
    this.throwTimer -= dt;
    if (this.throwTimer <= 0) {
      this.throwTimer = (this.phase === 3) ? 3.2 : (this.phase === 2 ? 4.0 : 6.5);
      onThrowBoulder?.(this.group.position.clone().add(new THREE.Vector3(0, 6, 0)), playerPosition.clone());
    }

    // 3. Phase 2 Minion Reinforcements
    if (this.phase >= 2) {
      this.minionTimer -= dt;
      if (this.minionTimer <= 0) {
        this.minionTimer = 18.0;
        onSummonMinions?.(this.group.position.clone());
      }
    }

    // 4. Phase 3 Runic Crystals Orbit & Meteor Cataclysm
    if (this.phase === 3) {
      const time = Date.now() * 0.002;
      for (const c of this.shieldCrystals) {
        if (!c.isDead) {
          c.angle += dt * 1.4;
          const r = 12.5;
          c.mesh.position.set(Math.cos(c.angle) * r, 5.0 + Math.sin(time + c.angle) * 1.2, Math.sin(c.angle) * r);
          c.mesh.rotation.y += dt * 2.0;
        }
      }

      // Forcefield pulse
      if (this.forcefieldMesh && this.forcefieldMesh.visible) {
        this.forcefieldMesh.rotation.y += dt * 0.8;
      }

      // Cataclysmic Falling Magma Meteors
      this.meteorTimer -= dt;
      if (this.meteorTimer <= 0) {
        this.meteorTimer = 3.6;
        // Target near player
        const mx = playerPosition.x + (Math.random() - 0.5) * 16.0;
        const mz = playerPosition.z + (Math.random() - 0.5) * 16.0;
        const my = this.terrain.getHeightAt(mx, mz);
        onMeteorStrike?.(new THREE.Vector3(mx, my, mz));
      }
    }
  }
}
