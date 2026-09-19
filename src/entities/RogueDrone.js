import * as THREE from 'three';

export class RogueDrone {
  constructor(scene, terrain, pos = new THREE.Vector3(0, 120, 0), audioEngine = null, particleEngine = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.audioEngine = audioEngine;
    this.particleEngine = particleEngine;

    this.group = new THREE.Group();
    this.group.position.copy(pos);

    this.health = 180;
    this.maxHealth = 180;
    this.isDead = false;
    this.speed = 32.0;
    this.maxSpeed = 50.0;
    this.state = 'patrol'; // 'patrol' | 'intercept' | 'dogfight' | 'evade'

    this.stateTimer = 0;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolCenter = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.attackCooldown = 0.8;
    this.flareCooldown = 4.0;

    this.velocity = new THREE.Vector3();
    this.debrisGroup = null;

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // Delta-wing stealth drone chassis
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      metalness: 0.85,
      roughness: 0.25
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff2244,
      emissive: 0xff0033,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });

    // 1. Central fuselage wedge
    const fuseGeom = new THREE.ConeGeometry(1.2, 5.4, 4);
    fuseGeom.rotateX(-Math.PI / 2);
    fuseGeom.scale(1.2, 0.45, 1.0);
    const fuseMesh = new THREE.Mesh(fuseGeom, bodyMat);
    fuseMesh.castShadow = true;
    this.group.add(fuseMesh);

    // 2. Swept delta wings
    const wingGeom = new THREE.BufferGeometry();
    const wingVerts = new Float32Array([
      // Left Wing
      0, 0, 1.2,
      -5.2, 0, -1.8,
      -0.8, 0, -2.4,

      // Right Wing
      0, 0, 1.2,
      0.8, 0, -2.4,
      5.2, 0, -1.8
    ]);
    const wingNorms = new Float32Array([
      0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, 1, 0,  0, 1, 0,  0, 1, 0
    ]);
    wingGeom.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
    wingGeom.setAttribute('normal', new THREE.BufferAttribute(wingNorms, 3));
    const wingMesh = new THREE.Mesh(wingGeom, bodyMat);
    wingMesh.castShadow = true;
    this.group.add(wingMesh);

    // 3. Canting twin vertical fins
    const finGeom = new THREE.BoxGeometry(0.12, 1.4, 1.8);
    const leftFin = new THREE.Mesh(finGeom, bodyMat);
    leftFin.position.set(-1.8, 0.6, -1.5);
    leftFin.rotation.z = -0.35;
    this.group.add(leftFin);

    const rightFin = new THREE.Mesh(finGeom, bodyMat);
    rightFin.position.set(1.8, 0.6, -1.5);
    rightFin.rotation.z = 0.35;
    this.group.add(rightFin);

    // 4. Optical scanner visor eye
    const eyeGeom = new THREE.BoxGeometry(0.8, 0.18, 0.3);
    const eyeMesh = new THREE.Mesh(eyeGeom, glowMat);
    eyeMesh.position.set(0, 0.18, 2.5);
    this.group.add(eyeMesh);

    // 5. Twin pulse thruster exhausts
    const exhaustGeom = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8);
    exhaustGeom.rotateX(Math.PI / 2);
    const leftNozzle = new THREE.Mesh(exhaustGeom, glowMat);
    leftNozzle.position.set(-0.75, 0, -2.5);
    this.group.add(leftNozzle);

    const rightNozzle = new THREE.Mesh(exhaustGeom, glowMat);
    rightNozzle.position.set(0.75, 0, -2.5);
    this.group.add(rightNozzle);

    // Dynamic thruster point light
    this.thrusterLight = new THREE.PointLight(0xff2233, 1.8, 14);
    this.thrusterLight.position.set(0, 0, -3.0);
    this.group.add(this.thrusterLight);
  }

  getForwardVector() {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion).normalize();
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;

    // Trigger hit spark particles
    this.particleEngine?.spawnSparks(this.group.position, 12, 0xff3300, 8.0);

    if (this.health <= 0) {
      this.destroy();
    } else {
      this.state = 'evade';
      this.stateTimer = 2.5;
    }
  }

  destroy() {
    if (this.isDead) return;
    this.isDead = true;

    // Sound effect
    this.audioEngine?.playSonicBoom();

    // Spawn massive fiery debris burst
    this.particleEngine?.spawnExplosion(this.group.position, 1.8);
    this.particleEngine?.spawnSparks(this.group.position, 36, 0xffaa00, 18.0);

    // Create tumbling debris pieces
    this.debrisGroup = new THREE.Group();
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const shardGeom = new THREE.BoxGeometry(0.8, 0.4, 1.2);

    for (let i = 0; i < 8; i++) {
      const shard = new THREE.Mesh(shardGeom, debrisMat);
      shard.position.copy(this.group.position);
      shard.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 24.0,
        Math.random() * 16.0 + 4.0,
        (Math.random() - 0.5) * 24.0
      );
      shard.rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      this.debrisGroup.add(shard);
    }
    this.scene.add(this.debrisGroup);
    this.scene.remove(this.group);
  }

  update(dt, playerPlane, combatManager = null) {
    if (this.isDead) {
      // Update tumbling falling debris
      if (this.debrisGroup) {
        for (const shard of this.debrisGroup.children) {
          shard.vel.y -= 18.0 * dt;
          shard.position.addScaledVector(shard.vel, dt);
          shard.rotation.x += shard.rotVel.x * dt;
          shard.rotation.y += shard.rotVel.y * dt;
          shard.rotation.z += shard.rotVel.z * dt;
        }
      }
      return;
    }

    const pos = this.group.position;
    const fwd = this.getForwardVector();

    let targetPos = null;
    let distToPlayer = 9999;

    if (playerPlane && playerPlane.isPilotInside) {
      const pPos = playerPlane.group.position;
      distToPlayer = pos.distanceTo(pPos);

      if (this.state === 'evade') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = 'dogfight';
        // Evade: break away and climb
        targetPos = pos.clone().add(fwd.clone().multiplyScalar(40)).add(new THREE.Vector3(0, 25, 0));
        this.group.rotation.z += dt * 4.2; // Barrel roll
      } else if (distToPlayer < 350) {
        this.state = distToPlayer < 180 ? 'dogfight' : 'intercept';
        targetPos = pPos.clone();
      }
    }

    if (!targetPos) {
      // Patrol in wide high-altitude orbits
      this.patrolAngle += dt * 0.25;
      targetPos = new THREE.Vector3(
        this.patrolCenter.x + Math.cos(this.patrolAngle) * 160,
        this.patrolCenter.y + Math.sin(this.patrolAngle * 0.5) * 20,
        this.patrolCenter.z + Math.sin(this.patrolAngle) * 160
      );
    }

    // Steer towards target position
    const desiredDir = targetPos.clone().sub(pos).normalize();
    const currentDir = fwd.clone();
    const newDir = currentDir.lerp(desiredDir, Math.min(1.0, dt * 2.8)).normalize();

    // Look along flight vector
    const lookTarget = pos.clone().add(newDir.clone().multiplyScalar(20));
    this.group.lookAt(lookTarget);

    // Bank into turns
    const cross = new THREE.Vector3().crossVectors(currentDir, desiredDir);
    const targetRoll = cross.y * 1.8;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -targetRoll, Math.min(1.0, dt * 4.0));

    // Thrust forward
    const curSpeed = this.state === 'intercept' || this.state === 'evade' ? this.maxSpeed : this.speed;
    pos.addScaledVector(newDir, curSpeed * dt);

    // Terrain ground clearance floor
    const minHeight = this.terrain.getHeightAt(pos.x, pos.z) + 24.0;
    if (pos.y < minHeight) {
      pos.y = minHeight;
    }

    // Attack player aircraft if in dogfight
    this.attackCooldown -= dt;
    if (this.state === 'dogfight' && this.attackCooldown <= 0 && distToPlayer < 190 && combatManager) {
      const toPlayer = playerPlane.group.position.clone().sub(pos).normalize();
      const dot = fwd.dot(toPlayer);

      if (dot > 0.88) { // Target within boresight cone
        this.attackCooldown = 0.9;
        // Fire twin red pulse blaster bolts
        const leftOrigin = pos.clone().add(new THREE.Vector3(-1.2, 0, 0.5).applyQuaternion(this.group.quaternion));
        const rightOrigin = pos.clone().add(new THREE.Vector3(1.2, 0, 0.5).applyQuaternion(this.group.quaternion));
        combatManager.spawnEnemyProjectile(leftOrigin, fwd, 75.0, 16);
        combatManager.spawnEnemyProjectile(rightOrigin, fwd, 75.0, 16);
      }
    }
  }
}
