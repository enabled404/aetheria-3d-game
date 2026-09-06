import * as THREE from 'three';

export class BuildGrid {
  constructor(scene) {
    this.scene = scene;
    this.blocks = [];
    this.deployables = [];

    // Preview ghost wireframe
    const geom = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    this.ghostMesh = new THREE.Mesh(geom, mat);
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);

    this.gridStep = 2.0;
  }

  snap(val) {
    return Math.round(val / this.gridStep) * this.gridStep;
  }

  updatePreview(rayOrigin, rayDir, maxDist = 8.0) {
    const target = rayOrigin.clone().add(rayDir.clone().multiplyScalar(maxDist));
    const sx = this.snap(target.x);
    const sy = Math.max(1, this.snap(target.y));
    const sz = this.snap(target.z);

    this.ghostMesh.position.set(sx, sy, sz);
    this.ghostMesh.visible = true;
    return this.ghostMesh.position;
  }

  hidePreview() {
    this.ghostMesh.visible = false;
  }

  placeBlock(pos, type = 'wood') {
    const geom = new THREE.BoxGeometry(2, 2, 2);
    let mat;

    if (type === 'stone') {
      mat = new THREE.MeshStandardMaterial({ color: 0x4f4f56, roughness: 0.9 });
    } else if (type === 'crystal') {
      mat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00bcd4,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1
      });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0x6e4526, roughness: 0.8 });
    }

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const block = { mesh, pos: pos.clone(), type, hp: 50 };
    this.blocks.push(block);
    return block;
  }
}
