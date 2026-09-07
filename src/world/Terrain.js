import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.size = CONFIG.WORLD.SIZE;
    this.segments = CONFIG.WORLD.SEGMENTS;
    this.heightScale = CONFIG.WORLD.HEIGHT_SCALE;

    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));
    this.generateHeightfield();
    this.createMesh();
  }

  // Multi-octave pseudo-perlin fBm noise
  noise(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  smoothNoise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;

    const s = fx * fx * (3.0 - 2.0 * fx);
    const t = fy * fy * (3.0 - 2.0 * fy);

    const n00 = this.noise(i, j);
    const n10 = this.noise(i + 1, j);
    const n01 = this.noise(i, j + 1);
    const n11 = this.noise(i + 1, j + 1);

    const nx0 = THREE.MathUtils.lerp(n00, n10, s);
    const nx1 = THREE.MathUtils.lerp(n01, n11, s);

    return THREE.MathUtils.lerp(nx0, nx1, t);
  }

  fbm(x, y, octaves = 5) {
    let val = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let o = 0; o < octaves; o++) {
      val += this.smoothNoise(x * freq, y * freq) * amp;
      freq *= 2.05;
      amp *= 0.5;
    }
    return val;
  }

  calculateHeight(worldX, worldZ) {
    const distFromCenter = Math.hypot(worldX, worldZ);
    const maxRadius = this.size * 0.44;

    // Island radial falloff mask
    const islandMask = Math.max(0, 1.0 - Math.pow(distFromCenter / maxRadius, 2.2));

    // Mountain peak in center
    const mountainRadius = 90;
    const mountainFalloff = Math.max(0, 1.0 - (distFromCenter / mountainRadius));
    const mountainHeight = Math.pow(mountainFalloff, 2.0) * 42.0;

    // Rolling hills fBm
    const nx = worldX * 0.009;
    const nz = worldZ * 0.009;
    const baseH = this.fbm(nx, nz, 5) * this.heightScale;

    // Coastal ridges
    const ridge = Math.abs(this.fbm(nx * 2, nz * 2, 3) - 0.5) * 14.0;

    const totalHeight = (baseH + ridge + mountainHeight) * islandMask - 4.0;
    return totalHeight;
  }

  generateHeightfield() {
    const half = this.size / 2;
    const step = this.size / this.segments;

    let idx = 0;
    for (let i = 0; i <= this.segments; i++) {
      const z = -half + i * step;
      for (let j = 0; j <= this.segments; j++) {
        const x = -half + j * step;
        const h = this.calculateHeight(x, z);
        this.heightData[idx++] = h;
      }
    }
  }

  createMesh() {
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, this.heightData[i]);
    }
    geom.computeVertexNormals();

    // High-fidelity natural biome slope colors
    const colors = new Float32Array(pos.count * 3);
    const normals = geom.attributes.normal;

    const sandColor = new THREE.Color(0xd8bf8a);
    const wetSandColor = new THREE.Color(0xa38c5b);
    const grassColor = new THREE.Color(0x4a7c36);
    const grassHighlight = new THREE.Color(0x5c964a);
    const rockColor = new THREE.Color(0x504d52);
    const snowColor = new THREE.Color(0xedf3fc);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ny = normals.getY(i); // 1 = flat, 0 = vertical cliff
      const slope = 1.0 - ny;

      // Micro-variation noise for organic surface texture
      const microNoise = (Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 0.08;

      let c = grassColor.clone().lerp(grassHighlight, 0.5 + microNoise);

      if (y < 0.6) {
        // Wet sand under/at water line
        c = wetSandColor.clone();
      } else if (y < 2.5) {
        // Shoreline beach sand
        const t = Math.max(0, (y - 0.6) / 1.9);
        c = sandColor.clone().lerp(grassColor, t);
      } else if (y > 30.0 && slope < 0.38) {
        // Mountain snow cap
        const t = Math.min(1.0, (y - 30.0) / 10.0);
        c.lerp(snowColor, t);
      } else if (slope > 0.32) {
        // Rocky cliffs and steep inclines
        const t = Math.min(1.0, (slope - 0.32) / 0.25);
        c.lerp(rockColor, t);
      }

      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.08,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  getHeightAt(x, z) {
    const half = this.size / 2;
    if (x < -half || x > half || z < -half || z > half) return -10;

    const gx = ((x + half) / this.size) * this.segments;
    const gz = ((z + half) / this.size) * this.segments;

    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(x0 + 1, this.segments);
    const z1 = Math.min(z0 + 1, this.segments);

    const fx = gx - x0;
    const fz = gz - z0;

    const w = this.segments + 1;
    const h00 = this.heightData[z0 * w + x0];
    const h10 = this.heightData[z0 * w + x1];
    const h01 = this.heightData[z1 * w + x0];
    const h11 = this.heightData[z1 * w + x1];

    const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
    const hx1 = THREE.MathUtils.lerp(h01, h11, fx);

    return THREE.MathUtils.lerp(hx0, hx1, fz);
  }

  getNormalAt(x, z) {
    const delta = 0.5;
    const hL = this.getHeightAt(x - delta, z);
    const hR = this.getHeightAt(x + delta, z);
    const hD = this.getHeightAt(x, z - delta);
    const hU = this.getHeightAt(x, z + delta);

    const normal = new THREE.Vector3(hL - hR, 2.0 * delta, hD - hU).normalize();
    return normal;
  }
}
