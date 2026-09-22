import * as THREE from 'three';

export class FloatingSanctuary {
  constructor(scene, collisionSystem = null) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;

    this.position = new THREE.Vector3(70, 195, -130);
    this.sizeX = 140;
    this.sizeZ = 120;
    this.surfaceHeight = 195.0;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.buildSanctuary();
    this.scene.add(this.group);
  }

  buildSanctuary() {
    // 1. Inverted Floating Island Crag Base
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x2d3238,
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });

    const coneGeom = new THREE.ConeGeometry(55, 65, 14);
    coneGeom.rotateX(Math.PI);
    const cragBase = new THREE.Mesh(coneGeom, rockMat);
    cragBase.position.y = -32.5;
    cragBase.castShadow = true;
    cragBase.receiveShadow = true;
    this.group.add(cragBase);

    // 2. Lush Surface Meadow (Top Disc)
    const topGeom = new THREE.CylinderGeometry(56, 54, 4.0, 16);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3d7e35,
      roughness: 0.75,
      metalness: 0.05
    });
    const surface = new THREE.Mesh(topGeom, grassMat);
    surface.position.y = -2.0;
    surface.receiveShadow = true;
    this.group.add(surface);

    // 3. High-Altitude Stone Cloud Runway
    // Allows landing airplanes directly onto the floating sky island!
    const runwayGeom = new THREE.BoxGeometry(26, 0.4, 98);
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.85,
      metalness: 0.2
    });
    const runway = new THREE.Mesh(runwayGeom, runwayMat);
    runway.position.set(0, 0.2, 0);
    runway.receiveShadow = true;
    this.group.add(runway);

    // Runway Centerline Glowing Runes
    const markMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    for (let z = -40; z <= 40; z += 12) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 5.0), markMat);
      dash.position.set(0, 0.42, z);
      this.group.add(dash);
    }

    // Glowing Runway Edge Lights (Cyan / Emerald)
    const edgeLightGeom = new THREE.SphereGeometry(0.35, 8, 8);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    for (let z = -46; z <= 46; z += 15) {
      const leftLight = new THREE.Mesh(edgeLightGeom, edgeMat);
      leftLight.position.set(-13.5, 0.5, z);
      this.group.add(leftLight);

      const rightLight = new THREE.Mesh(edgeLightGeom, edgeMat);
      rightLight.position.set(13.5, 0.5, z);
      this.group.add(rightLight);
    }

    // 4. Central Celestial Shrine & Anti-Gravity Monolith
    const monolithGeom = new THREE.OctahedronGeometry(4.5, 0);
    monolithGeom.scale(1.0, 2.5, 1.0);
    this.monolithMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00e5ff,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.9
    });
    this.monolith = new THREE.Mesh(monolithGeom, this.monolithMat);
    this.monolith.position.set(0, 15, -35);
    this.monolith.castShadow = true;
    this.group.add(this.monolith);

    // Shrine Dais
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 16, 2.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x1f2228, roughness: 0.8 })
    );
    dais.position.set(0, 1.1, -35);
    dais.receiveShadow = true;
    this.group.add(dais);

    // Glowing Altar Point Light
    this.shrineLight = new THREE.PointLight(0x00e5ff, 3.5, 45);
    this.shrineLight.position.set(0, 12, -35);
    this.group.add(this.shrineLight);

    // 5. Panoramic Cloud Diving Platform
    const plankGeom = new THREE.BoxGeometry(4.5, 0.35, 16);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const divingPlank = new THREE.Mesh(plankGeom, plankMat);
    divingPlank.position.set(0, 0.2, 54);
    this.group.add(divingPlank);

    // 6. Anti-Gravity Crystalline Pillars Underneath
    const crystalGeom = new THREE.ConeGeometry(2.2, 12, 5);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00bcd4,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.88
    });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const cx = Math.cos(ang) * 26;
      const cz = Math.sin(ang) * 26;
      const crystal = new THREE.Mesh(crystalGeom, crystalMat);
      crystal.position.set(cx, -16 - Math.random() * 8, cz);
      crystal.rotation.x = Math.PI + (Math.random() - 0.5) * 0.4;
      crystal.rotation.z = (Math.random() - 0.5) * 0.4;
      this.group.add(crystal);
    }

    // Register colliders in collision system
    if (this.collisionSystem) {
      this.collisionSystem.addCollider(this.position.x, this.position.z - 35, 4.0, 20.0, 'shrine_monolith');
    }
  }

  isPointOnSanctuary(x, z, margin = 2.0) {
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    return (dx * dx + dz * dz) < (54.0 + margin) * (54.0 + margin);
  }

  getSurfaceElevation(x, z) {
    if (this.isPointOnSanctuary(x, z)) {
      return this.surfaceHeight;
    }
    return -999;
  }

  update(dt) {
    // Monolith slow levitation and rotation
    if (this.monolith) {
      this.monolith.rotation.y += dt * 0.6;
      this.monolith.position.y = 15 + Math.sin(Date.now() * 0.002) * 1.5;
    }
  }
}
