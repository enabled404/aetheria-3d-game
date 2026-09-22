import * as THREE from 'three';

export class CelestialLeviathan {
  constructor(scene, particleEngine = null, audioEngine = null) {
    this.scene = scene;
    this.particleEngine = particleEngine;
    this.audioEngine = audioEngine;

    this.group = new THREE.Group();
    this.segments = [];
    this.fins = [];
    this.time = 0;

    this.flightRadius = 260.0;
    this.flightHeight = 155.0;
    this.flightSpeed = 22.0;
    this.flightAngle = Math.PI * 0.4;

    this.buildBody();
    this.scene.add(this.group);
  }

  buildBody() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x14283c,
      roughness: 0.35,
      metalness: 0.8
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    const finMat = new THREE.MeshStandardMaterial({
      color: 0x1ce8db,
      emissive: 0x0088aa,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.78,
      roughness: 0.1,
      side: THREE.DoubleSide
    });

    // 1. Head (Sculpted sleek cetacean / dragon snout)
    const headGeom = new THREE.ConeGeometry(3.6, 8.5, 12);
    headGeom.rotateX(-Math.PI / 2);
    this.head = new THREE.Mesh(headGeom, bodyMat);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Glowing Crown / Horns
    const hornGeom = new THREE.ConeGeometry(0.5, 4.2, 6);
    hornGeom.rotateX(-Math.PI / 3);
    const leftHorn = new THREE.Mesh(hornGeom, glowMat);
    leftHorn.position.set(-1.6, 2.2, 1.5);
    this.head.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeom, glowMat);
    rightHorn.position.set(1.6, 2.2, 1.5);
    this.head.add(rightHorn);

    // Bioluminescent Eyes
    const eyeGeom = new THREE.SphereGeometry(0.55, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeom, glowMat);
    leftEye.position.set(-2.2, 0.8, 1.2);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, glowMat);
    rightEye.position.set(2.2, 0.8, 1.2);
    this.head.add(rightEye);

    // 2. Undulating Spine Segments (12 Body Sections)
    let parent = this.head;
    const numSegs = 12;

    for (let i = 0; i < numSegs; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(0, 0, -4.2);

      // Tapered body rings
      const t = i / numSegs;
      const radius = (1.0 - t * 0.72) * 3.4;
      const segMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.92, radius, 4.4, 10),
        bodyMat
      );
      segMesh.rotateX(Math.PI / 2);
      segMesh.castShadow = true;
      segGroup.add(segMesh);

      // Glowing Dorsal Spine Ridge
      const spineSpike = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.4 + (1.0 - t) * 1.8, 2.2),
        glowMat
      );
      spineSpike.position.set(0, radius + 0.4, 0);
      segGroup.add(spineSpike);

      // Pectoral Wings / Gliding Fins on segment 1 & 2
      if (i === 1) {
        const wingSpan = 18.0;
        const leftWing = new THREE.Mesh(new THREE.ConeGeometry(2.4, wingSpan, 4), finMat);
        leftWing.rotateZ(Math.PI / 2);
        leftWing.rotateY(-0.3);
        leftWing.position.set(-radius - wingSpan / 2, 0, 0);
        segGroup.add(leftWing);
        this.fins.push(leftWing);

        const rightWing = new THREE.Mesh(new THREE.ConeGeometry(2.4, wingSpan, 4), finMat);
        rightWing.rotateZ(-Math.PI / 2);
        rightWing.rotateY(0.3);
        rightWing.position.set(radius + wingSpan / 2, 0, 0);
        segGroup.add(rightWing);
        this.fins.push(rightWing);
      }

      parent.add(segGroup);
      this.segments.push(segGroup);
      parent = segGroup;
    }

    // 3. Ethereal Flukes / Crescent Tail
    const tailGeom = new THREE.ConeGeometry(1.6, 9.0, 4);
    tailGeom.rotateZ(Math.PI / 2);
    this.tailFluke = new THREE.Mesh(tailGeom, finMat);
    this.tailFluke.position.set(0, 0, -4.5);
    parent.add(this.tailFluke);

    // Glowing Aura Light
    this.auraLight = new THREE.PointLight(0x00e5ff, 2.8, 60);
    this.head.add(this.auraLight);
  }

  update(dt, playerPlane = null, hud = null) {
    this.time += dt;

    // Smooth wide flight circle around island cloud peaks
    this.flightAngle += (this.flightSpeed / this.flightRadius) * dt;

    const x = Math.cos(this.flightAngle) * this.flightRadius;
    const z = Math.sin(this.flightAngle) * this.flightRadius;
    const y = this.flightHeight + Math.sin(this.time * 0.4) * 18.0;

    // Target position slightly ahead on path
    const nextAngle = this.flightAngle + 0.08;
    const nextX = Math.cos(nextAngle) * this.flightRadius;
    const nextZ = Math.sin(nextAngle) * this.flightRadius;
    const nextY = this.flightHeight + Math.sin((this.time + 0.5) * 0.4) * 18.0;

    this.group.position.set(x, y, z);
    this.group.lookAt(nextX, nextY, nextZ);

    // Gentle banking into turn
    this.group.rotation.z = -0.32;

    // Sinusoidal serpentine spine undulation
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const wave = Math.sin(this.time * 2.2 - i * 0.45);
      seg.rotation.y = wave * 0.12;
      seg.rotation.x = Math.cos(this.time * 1.8 - i * 0.4) * 0.06;
    }

    // Fin rippling motion
    if (this.fins.length >= 2) {
      const finFlap = Math.sin(this.time * 1.6) * 0.28;
      this.fins[0].rotation.x = finFlap;
      this.fins[1].rotation.x = finFlap;
    }

    // Emit starlight particles from tail
    if (this.particleEngine && Math.random() < 0.4) {
      const tailPos = new THREE.Vector3();
      this.tailFluke.getWorldPosition(tailPos);
      this.particleEngine.spawnSparks(tailPos, 3, 0x00ffff, 4.0);
    }

    // Celestial Slipstream Boost for player aircraft!
    if (playerPlane && playerPlane.isPilotInside) {
      const dist = this.group.position.distanceTo(playerPlane.group.position);
      if (dist < 60.0) {
        // Accelerate player aircraft with starlight slipstream
        const boostDir = playerPlane.getForwardVector();
        playerPlane.velocity.addScaledVector(boostDir, 28.0 * dt);

        if (hud && !this.boostToastTimer) {
          this.boostToastTimer = 4.0;
          hud.showToast('✦ CELESTIAL SLIPSTREAM (+28 m/s Boost!)');
          if (this.audioEngine) {
            this.audioEngine.playSynthNote(880, 0.8, 'sine', 0.2);
            this.audioEngine.playSynthNote(1320, 1.2, 'sine', 0.25);
          }
        }
        if (this.particleEngine) {
          this.particleEngine.spawnSparks(playerPlane.group.position, 6, 0x00e5ff, 8.0);
        }
      }
    }

    if (this.boostToastTimer > 0) {
      this.boostToastTimer -= dt;
      if (this.boostToastTimer <= 0) this.boostToastTimer = null;
    }
  }
}
