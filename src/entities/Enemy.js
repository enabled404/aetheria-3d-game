import * as THREE from 'three';

export class Enemy {
  constructor(scene, terrain, type = 'grunt', pos = new THREE.Vector3(), audioEngine = null, particleEngine = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.type = type; // 'grunt' | 'brute' | 'stalker' | 'phantom' | 'berserker' | 'wyrm'
    this.audioEngine = audioEngine;
    this.particleEngine = particleEngine;

    // Base attributes
    this.setupAttributes();

    this.cooldownTimer = 0;
    this.isDead = false;
    this.isFrozen = false;
    this.freezeTimer = 0;

    // Special archetype timers
    this.warpCooldown = 3.5;
    this.chargeTimer = 5.0;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.chargeDir = new THREE.Vector3();
    this.isEnraged = false;
    this.flightAngle = Math.random() * Math.PI * 2;
    this.flightRadius = 16.0 + Math.random() * 12.0;

    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.buildMesh();
    this.scene.add(this.group);
  }

  setupAttributes() {
    switch (this.type) {
      case 'berserker':
        this.health = 280;
        this.speed = 5.2;
        this.damage = 32;
        this.attackRange = 3.2;
        this.attackCooldown = 1.6;
        break;
      case 'phantom':
        this.health = 110;
        this.speed = 6.2;
        this.damage = 22;
        this.attackRange = 24.0; // Ranged spellcaster
        this.attackCooldown = 2.4;
        break;
      case 'wyrm':
        this.health = 95;
        this.speed = 14.0;
        this.damage = 20;
        this.attackRange = 26.0; // Aerial dive
        this.attackCooldown = 2.8;
        break;
      case 'brute':
        this.health = 150;
        this.speed = 5.4;
        this.damage = 26;
        this.attackRange = 3.0;
        this.attackCooldown = 1.5;
        break;
      case 'stalker':
        this.health = 60;
        this.speed = 12.0;
        this.damage = 16;
        this.attackRange = 2.2;
        this.attackCooldown = 1.1;
        break;
      case 'grunt':
      default:
        this.health = 75;
        this.speed = 7.4;
        this.damage = 14;
        this.attackRange = 2.2;
        this.attackCooldown = 1.4;
        break;
    }
    this.maxHealth = this.health;
  }

  buildMesh() {
    let color = 0x242d3d;
    let eyeColor = 0x00e5ff;
    let s = 1.1;

    if (this.type === 'brute') {
      color = 0x1f1724;
      eyeColor = 0xff2200;
      s = 1.6;
    } else if (this.type === 'stalker') {
      color = 0x1c3822;
      eyeColor = 0xffee00;
      s = 0.95;
    } else if (this.type === 'phantom') {
      color = 0x140d24;
      eyeColor = 0xb026ff;
      s = 1.25;
    } else if (this.type === 'berserker') {
      color = 0x2a1818;
      eyeColor = 0xff0044;
      s = 1.85;
    } else if (this.type === 'wyrm') {
      color = 0x152538;
      eyeColor = 0x00ffff;
      s = 1.4;
    }

    this.scaleFactor = s;
    this.mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.35
    });
    this.origColor = color;

    this.eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    this.origEyeColor = eyeColor;

    if (this.type === 'wyrm') {
      // Winged Aerial Wyrm
      this.buildWyrmMesh(s);
    } else if (this.type === 'phantom') {
      // Floating Specter with hover daggers
      this.buildPhantomMesh(s);
    } else {
      // Humanoid Chassis (Grunt, Stalker, Brute, Berserker)
      this.buildHumanoidMesh(s);
    }

    // 3D Billboard Floating Health Bar
    this.buildHealthBar(s);
  }

  buildHumanoidMesh(s) {
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 1.1 * s, 0.5 * s), this.mat);
    body.position.y = 0.8 * s;
    body.castShadow = true;
    this.group.add(body);

    // Visor
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.15 * s, 0.1 * s), this.eyeMat);
    eye.position.set(0, 1.1 * s, 0.26 * s);
    this.group.add(eye);

    // Arms
    this.lArm = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s), this.mat);
    this.lArm.position.set(-0.48 * s, 0.7 * s, 0);
    this.group.add(this.lArm);

    this.rArm = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.8 * s, 0.22 * s), this.mat);
    this.rArm.position.set(0.48 * s, 0.7 * s, 0);
    this.group.add(this.rArm);

    // Berserker Frontal Energy Riot Shield
    if (this.type === 'berserker') {
      const shieldGeom = new THREE.BoxGeometry(1.1 * s, 1.4 * s, 0.08 * s);
      this.shieldMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2
      });
      this.shieldMesh = new THREE.Mesh(shieldGeom, this.shieldMat);
      this.shieldMesh.position.set(0, 0.75 * s, 0.55 * s);
      this.group.add(this.shieldMesh);
    }
  }

  buildPhantomMesh(s) {
    // Floating Hooded Robe
    const robeGeom = new THREE.ConeGeometry(0.6 * s, 1.6 * s, 8);
    robeGeom.rotateX(Math.PI);
    const robe = new THREE.Mesh(robeGeom, this.mat);
    robe.position.y = 1.0 * s;
    this.group.add(robe);

    // Dark Hood & Visor Eye
    const hoodGeom = new THREE.DodecahedronGeometry(0.42 * s, 1);
    const hood = new THREE.Mesh(hoodGeom, this.mat);
    hood.position.y = 1.75 * s;
    this.group.add(hood);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18 * s, 8, 8), this.eyeMat);
    eye.position.set(0, 1.75 * s, 0.3 * s);
    this.group.add(eye);

    // Hovering Obsidian Blades
    this.blades = [];
    for (let i = 0; i < 3; i++) {
      const bGeom = new THREE.ConeGeometry(0.08 * s, 0.65 * s, 4);
      bGeom.rotateX(Math.PI / 2);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x6a1b9a, roughness: 0.3, metalness: 0.8 });
      const blade = new THREE.Mesh(bGeom, bMat);
      this.group.add(blade);
      this.blades.push(blade);
    }
  }

  buildWyrmMesh(s) {
    // Serpentine Body
    const bodyGeom = new THREE.ConeGeometry(0.4 * s, 2.2 * s, 6);
    bodyGeom.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, this.mat);
    body.position.y = 0.5 * s;
    this.group.add(body);

    // Head
    const headGeom = new THREE.DodecahedronGeometry(0.35 * s, 1);
    const head = new THREE.Mesh(headGeom, this.mat);
    head.position.set(0, 0.5 * s, 1.2 * s);
    this.group.add(head);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.12 * s, 0.1 * s), this.eyeMat);
    eye.position.set(0, 0.6 * s, 1.45 * s);
    this.group.add(eye);

    // Wings
    const wingGeom = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 0, 0,
      -1.8 * s, 0.2 * s, -0.6 * s,
      -0.8 * s, 0, 0.8 * s
    ]);
    wingGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0088aa,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide
    });

    this.lWing = new THREE.Mesh(wingGeom, wingMat);
    this.lWing.position.set(-0.2 * s, 0.6 * s, 0);
    this.group.add(this.lWing);

    const rWingGeom = new THREE.BufferGeometry();
    const rVerts = new Float32Array([
      0, 0, 0,
      1.8 * s, 0.2 * s, -0.6 * s,
      0.8 * s, 0, 0.8 * s
    ]);
    rWingGeom.setAttribute('position', new THREE.BufferAttribute(rVerts, 3));
    this.rWing = new THREE.Mesh(rWingGeom, wingMat);
    this.rWing.position.set(0.2 * s, 0.6 * s, 0);
    this.group.add(this.rWing);
  }

  buildHealthBar(s) {
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = (this.type === 'wyrm') ? 1.6 * s : 2.1 * s;

    const bgGeom = new THREE.PlaneGeometry(1.05 * s, 0.12 * s);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x060c18, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(bgGeom, bgMat);
    this.hpBarGroup.add(hpBg);

    const fillGeom = new THREE.PlaneGeometry(1.01 * s, 0.085 * s);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xff2e5b, side: THREE.DoubleSide });
    this.hpBarFill = new THREE.Mesh(fillGeom, fillMat);
    this.hpBarFill.position.z = 0.01;
    this.hpBarGroup.add(this.hpBarFill);

    this.group.add(this.hpBarGroup);
  }

  takeDamage(amount, attackerPosition = null) {
    if (this.isDead) return false;

    // Berserker Frontal Shield Absorption
    if (this.type === 'berserker' && this.shieldMesh && this.shieldMesh.visible && attackerPosition && !this.isFrozen) {
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
      const toAttacker = attackerPosition.clone().sub(this.group.position).normalize();
      const dot = fwd.dot(toAttacker);
      if (dot > 0.35) {
        // Frontal hit absorbed by shield
        amount *= 0.15;
        this.particleEngine?.spawnSparks(this.group.position.clone().add(new THREE.Vector3(0, 1.4, 0.6)), 8, 0x00ffff, 4.0);
        this.audioEngine?.playParrySound();
      }
    }

    this.health = Math.max(0, this.health - amount);
    const pct = this.health / this.maxHealth;
    this.hpBarFill.scale.x = Math.max(0.001, pct);
    this.hpBarFill.position.x = -((1.0 - pct) * 0.5 * this.scaleFactor);

    // Phantom Phase-Shift Teleport on Damage
    if (this.type === 'phantom' && this.warpCooldown <= 0 && this.health > 0) {
      this.triggerPhantomWarp(attackerPosition);
    }

    // Berserker Enrage (<35% HP)
    if (this.type === 'berserker' && pct < 0.35 && !this.isEnraged) {
      this.isEnraged = true;
      if (this.shieldMesh) this.shieldMesh.visible = false;
      this.mat.color.setHex(0xff3300);
      this.mat.emissive = new THREE.Color(0x991100);
      this.speed = 9.8;
      this.attackCooldown = 0.8;
      this.audioEngine?.playBerserkerRoar();
      this.particleEngine?.spawnSparks(this.group.position, 25, 0xff3300, 8.0);
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.scene.remove(this.group);
      return true; // died
    }
    return false;
  }

  triggerPhantomWarp(playerPos = null) {
    this.warpCooldown = 4.0;
    this.audioEngine?.playWarpSound();
    this.particleEngine?.spawnSparks(this.group.position, 20, 0xb026ff, 8.0);

    // Teleport to flank or behind player (12-18m away)
    if (playerPos) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12.0 + Math.random() * 6.0;
      const newX = playerPos.x + Math.cos(angle) * dist;
      const newZ = playerPos.z + Math.sin(angle) * dist;
      const newY = this.terrain.getHeightAt(newX, newZ);
      this.group.position.set(newX, newY, newZ);
      this.particleEngine?.spawnSparks(this.group.position, 20, 0xb026ff, 8.0);
    }
  }

  setBloodMoonEmpowered(isEmpowered) {
    if (this.isDead) return;
    if (isEmpowered) {
      this.eyeMat.color.setHex(0xff0033);
      this.speedMultiplier = 1.3;
    } else {
      this.eyeMat.color.setHex(this.origEyeColor);
      this.speedMultiplier = 1.0;
    }
  }

  update(dt, playerPosition, onAttackPlayer, collisionSystem = null, camera = null, onSpawnProjectile = null) {
    if (this.isDead) return;

    // Billboard health bar to face camera
    if (camera && this.hpBarGroup) {
      this.hpBarGroup.quaternion.copy(camera.quaternion);
    }

    // Chrono Stasis Freeze
    if (this.isFrozen) {
      this.freezeTimer -= dt;
      this.mat.color.setHex(0x00e5ff);
      if (this.freezeTimer <= 0) {
        this.isFrozen = false;
        this.mat.color.setHex(this.isEnraged ? 0xff3300 : this.origColor);
      }
      return;
    }

    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.warpCooldown > 0) this.warpCooldown -= dt;

    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);
    const speedMult = this.speedMultiplier || 1.0;

    // --- Archetype Specific Behaviors ---
    if (this.type === 'wyrm') {
      this.updateWyrm(dt, playerPosition, onAttackPlayer, onSpawnProjectile);
      return;
    }

    if (this.type === 'phantom') {
      this.updatePhantom(dt, playerPosition, onSpawnProjectile);
      return;
    }

    if (this.type === 'berserker') {
      this.updateBerserker(dt, playerPosition, onAttackPlayer, collisionSystem, speedMult);
      return;
    }

    // Standard Humanoids (Grunt, Brute, Stalker)
    if (dist < 32.0) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;

      if (dist > this.attackRange) {
        this.group.position.x += Math.sin(angle) * this.speed * speedMult * dt;
        this.group.position.z += Math.cos(angle) * this.speed * speedMult * dt;
        if (collisionSystem) collisionSystem.resolveCircleCollision(this.group.position, 0.65);
        this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);

        if (this.lArm && this.rArm) {
          this.lArm.rotation.x = Math.sin(Date.now() * 0.01) * 0.6;
          this.rArm.rotation.x = -Math.sin(Date.now() * 0.01) * 0.6;
        }
      } else {
        if (this.cooldownTimer <= 0) {
          this.cooldownTimer = this.attackCooldown;
          if (this.rArm) {
            this.rArm.rotation.x = -1.5;
            setTimeout(() => { if (this.rArm) this.rArm.rotation.x = 0; }, 250);
          }
          onAttackPlayer?.(this.damage);
        }
      }
    }
  }

  updateBerserker(dt, playerPosition, onAttackPlayer, collisionSystem, speedMult) {
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);
    this.chargeTimer -= dt;

    // Juggernaut Bull Charge Trigger (between 9m and 25m)
    if (this.chargeTimer <= 0 && !this.isCharging && dist > 9.0 && dist < 25.0) {
      this.isCharging = true;
      this.chargeDuration = 1.3;
      this.chargeTimer = 7.5;
      this.chargeDir.set(dx, 0, dz).normalize();
      this.group.rotation.y = Math.atan2(dx, dz);
      this.audioEngine?.playBerserkerRoar();
      this.particleEngine?.spawnSparks(this.group.position, 16, 0xff2200, 6.0);
    }

    if (this.isCharging) {
      this.chargeDuration -= dt;
      const chargeSpeed = 19.0;
      this.group.position.addScaledVector(this.chargeDir, chargeSpeed * dt);
      if (collisionSystem) collisionSystem.resolveCircleCollision(this.group.position, 0.9);
      this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);

      // Hit check during charge
      if (this.group.position.distanceTo(playerPosition) < 2.5) {
        onAttackPlayer?.(this.damage * 1.4);
        this.particleEngine?.spawnGroundSlamShockwave(this.group.position);
        this.isCharging = false;
      }

      if (this.chargeDuration <= 0) {
        this.isCharging = false;
      }
      return;
    }

    // Regular Berserker chase / melee
    if (dist < 32.0) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;

      if (dist > this.attackRange) {
        this.group.position.x += Math.sin(angle) * this.speed * speedMult * dt;
        this.group.position.z += Math.cos(angle) * this.speed * speedMult * dt;
        if (collisionSystem) collisionSystem.resolveCircleCollision(this.group.position, 0.85);
        this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
      } else {
        if (this.cooldownTimer <= 0) {
          this.cooldownTimer = this.attackCooldown;
          onAttackPlayer?.(this.damage);
          this.particleEngine?.spawnSparks(this.group.position, 12, 0xff0044, 5.0);
        }
      }
    }
  }

  updatePhantom(dt, playerPosition, onSpawnProjectile) {
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    // Floating bob animation
    const groundY = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    this.group.position.y = groundY + 1.6 + Math.sin(Date.now() * 0.003) * 0.35;

    // Rotate hovering daggers
    if (this.blades) {
      const time = Date.now() * 0.004;
      this.blades.forEach((b, i) => {
        const ang = time + (i / 3) * Math.PI * 2;
        b.position.set(Math.cos(ang) * 0.85, 1.2 + Math.sin(time * 2 + i) * 0.2, Math.sin(ang) * 0.85);
      });
    }

    // Auto-warp if player gets too close
    if (dist < 5.0 && this.warpCooldown <= 0) {
      this.triggerPhantomWarp(playerPosition);
      return;
    }

    if (dist < 38.0) {
      this.group.rotation.y = Math.atan2(dx, dz);

      // Cast Dark Void Orb
      if (this.cooldownTimer <= 0 && dist > 5.5) {
        this.cooldownTimer = this.attackCooldown;
        const origin = this.group.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        const aimDir = playerPosition.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin).normalize();
        onSpawnProjectile?.(origin, aimDir, 18, 'dark_orb');
        this.particleEngine?.spawnSparks(origin, 14, 0xb026ff, 6.0);
      }
    }
  }

  updateWyrm(dt, playerPosition, onAttackPlayer, onSpawnProjectile) {
    // Circle overhead in 3D aerial path
    this.flightAngle += dt * 0.85;
    const targetX = playerPosition.x + Math.cos(this.flightAngle) * this.flightRadius;
    const targetZ = playerPosition.z + Math.sin(this.flightAngle) * this.flightRadius;
    const baseGround = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    const targetY = baseGround + 16.0 + Math.sin(this.flightAngle * 2.0) * 4.0;

    this.group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 3.5);

    // Look along flight path
    const tangent = new THREE.Vector3(-Math.sin(this.flightAngle), 0, Math.cos(this.flightAngle));
    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

    // Wing flapping
    const flap = Math.sin(Date.now() * 0.015) * 0.55;
    if (this.lWing) this.lWing.rotation.z = flap;
    if (this.rWing) this.rWing.rotation.z = -flap;

    // Aerial Lightning Barrage
    const distToPlayer = this.group.position.distanceTo(playerPosition);
    if (distToPlayer < 40.0 && this.cooldownTimer <= 0) {
      this.cooldownTimer = this.attackCooldown;
      this.audioEngine?.playWyrmScreech();
      const origin = this.group.position.clone();
      const aimDir = playerPosition.clone().sub(origin).normalize();
      onSpawnProjectile?.(origin, aimDir, 22, 'wyrm_bolt');
      this.particleEngine?.spawnSparks(origin, 16, 0x00ffff, 7.0);
    }
  }
}
