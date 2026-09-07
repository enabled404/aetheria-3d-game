import * as THREE from 'three';

export class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // 1. Point Cloud for fast sparks & ambient motes
    this.maxPoints = 1200;
    this.pointGeom = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxPoints * 3);
    this.colors = new Float32Array(this.maxPoints * 3);
    this.sizes = new Float32Array(this.maxPoints);

    this.pointGeom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointGeom.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.pointMat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointMesh = new THREE.Points(this.pointGeom, this.pointMat);
    this.scene.add(this.pointMesh);

    // 2. Mesh Debris / Spores
    this.debrisPool = [];
    this.maxDebris = 120;
    const debGeom = new THREE.DodecahedronGeometry(0.12, 0);
    const debMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < this.maxDebris; i++) {
      const m = new THREE.Mesh(debGeom, debMat.clone());
      m.visible = false;
      this.scene.add(m);
      this.debrisPool.push({
        mesh: m,
        active: false,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0
      });
    }

    this.ambientTimer = 0;
  }

  spawnSparks(origin, count = 16, colorHex = 0x00ffff, speed = 8.0) {
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxPoints) {
        this.particles.shift();
      }

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = speed * (0.4 + Math.random() * 0.8);

      const vx = Math.sin(phi) * Math.cos(theta) * spd;
      const vy = Math.cos(phi) * spd + 1.5;
      const vz = Math.sin(phi) * Math.sin(theta) * spd;

      this.particles.push({
        x: origin.x,
        y: origin.y,
        z: origin.z,
        vx, vy, vz,
        r: col.r, g: col.g, b: col.b,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        gravity: 12.0,
        size: 3.5 + Math.random() * 2.5
      });
    }
  }

  spawnJetpackPlume(origin, backward) {
    const col = Math.random() > 0.4 ? new THREE.Color(0x00e5ff) : new THREE.Color(0xff6600);
    for (let i = 0; i < 4; i++) {
      if (this.particles.length >= this.maxPoints) this.particles.shift();

      const spread = 0.35;
      const vx = (backward.x + (Math.random() - 0.5) * spread) * 4.5;
      const vy = -3.5 - Math.random() * 2.0;
      const vz = (backward.z + (Math.random() - 0.5) * spread) * 4.5;

      this.particles.push({
        x: origin.x + (Math.random() - 0.5) * 0.2,
        y: origin.y - 0.2,
        z: origin.z + (Math.random() - 0.5) * 0.2,
        vx, vy, vz,
        r: col.r, g: col.g, b: col.b,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        gravity: -2.0,
        size: 4.0 + Math.random() * 3.0
      });
    }
  }

  spawnGroundSlamShockwave(origin) {
    this.spawnSparks(origin, 45, 0xff3300, 14.0);
    this.spawnSparks(origin, 30, 0x00ffff, 10.0);

    for (let i = 0; i < 18; i++) {
      const deb = this.debrisPool.find(d => !d.active);
      if (!deb) break;

      deb.active = true;
      deb.mesh.visible = true;
      deb.mesh.position.copy(origin).add(new THREE.Vector3(0, 0.2, 0));
      deb.mesh.material.color.setHex(0x554433);

      const ang = (i / 18) * Math.PI * 2;
      const spd = 6.0 + Math.random() * 8.0;
      deb.vel.set(Math.cos(ang) * spd, 4.0 + Math.random() * 6.0, Math.sin(ang) * spd);
      deb.rotVel.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
      deb.life = 0;
      deb.maxLife = 1.2 + Math.random() * 0.4;
    }
  }

  spawnAmbientSpores(playerPos) {
    for (let i = 0; i < 3; i++) {
      if (this.particles.length >= this.maxPoints) this.particles.shift();

      const r = 16.0 * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;

      this.particles.push({
        x: playerPos.x + r * Math.cos(theta),
        y: playerPos.y + 0.5 + Math.random() * 6.0,
        z: playerPos.z + r * Math.sin(theta),
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.4,
        r: 0.2, g: 0.95, b: 0.65,
        life: 3.5 + Math.random() * 2.5,
        maxLife: 6.0,
        gravity: -0.05,
        size: 2.2
      });
    }
  }

  update(dt, playerPos) {
    this.ambientTimer += dt;
    if (this.ambientTimer >= 0.15) {
      this.ambientTimer = 0;
      this.spawnAmbientSpores(playerPos);
    }

    let activeCount = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vy -= p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const alpha = Math.min(1.0, p.life / p.maxLife);

      this.positions[activeCount * 3 + 0] = p.x;
      this.positions[activeCount * 3 + 1] = p.y;
      this.positions[activeCount * 3 + 2] = p.z;

      this.colors[activeCount * 3 + 0] = p.r * alpha;
      this.colors[activeCount * 3 + 1] = p.g * alpha;
      this.colors[activeCount * 3 + 2] = p.b * alpha;

      this.sizes[activeCount] = p.size * alpha;

      activeCount++;
      if (activeCount >= this.maxPoints) break;
    }

    this.pointGeom.setDrawRange(0, activeCount);
    this.pointGeom.attributes.position.needsUpdate = true;
    this.pointGeom.attributes.color.needsUpdate = true;
    this.pointGeom.attributes.size.needsUpdate = true;

    for (const deb of this.debrisPool) {
      if (!deb.active) continue;
      deb.life += dt;
      if (deb.life >= deb.maxLife) {
        deb.active = false;
        deb.mesh.visible = false;
        continue;
      }

      deb.vel.y -= 22.0 * dt;
      deb.mesh.position.addScaledVector(deb.vel, dt);
      deb.mesh.rotation.x += deb.rotVel.x * dt;
      deb.mesh.rotation.y += deb.rotVel.y * dt;
      deb.mesh.material.opacity = 1.0 - (deb.life / deb.maxLife);
    }
  }
}
