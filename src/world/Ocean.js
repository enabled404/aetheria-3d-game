import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Ocean {
  constructor(scene) {
    this.scene = scene;
    this.size = CONFIG.WORLD.SIZE * 1.8;
    this.time = 0;

    const geom = new THREE.PlaneGeometry(this.size, this.size, 64, 64);
    geom.rotateX(-Math.PI / 2);

    this.material = new THREE.MeshStandardMaterial({
      color: 0x165b82,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.y = 0.0;
    this.scene.add(this.mesh);
  }

  update(dt) {
    this.time += dt;
    const pos = this.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gerstner wave approximation
      const wave = Math.sin(x * 0.08 + this.time * 1.8) * 0.22 +
                   Math.cos(z * 0.06 + this.time * 1.4) * 0.18 +
                   Math.sin((x + z) * 0.12 + this.time * 2.2) * 0.1;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
  }
}
