import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class FoliageSystem {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    this.trees = [];
    this.rocks = [];
    this.crystals = [];

    this.spawnFoliage();
  }

  spawnFoliage() {
    const size = CONFIG.WORLD.SIZE;
    const half = size / 2;

    // 1. Instanced Trees
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 6);
    const leavesGeom = new THREE.ConeGeometry(2.6, 5.5, 6);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.85 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x225528, roughness: 0.75, flatShading: true });

    this.treeTrunks = new THREE.InstancedMesh(trunkGeom, trunkMat, CONFIG.WORLD.TREE_COUNT);
    this.treeLeaves = new THREE.InstancedMesh(leavesGeom, leavesMat, CONFIG.WORLD.TREE_COUNT);
    this.treeTrunks.castShadow = true;
    this.treeLeaves.castShadow = true;

    const dummy = new THREE.Object3D();
    let treeIdx = 0;

    for (let i = 0; i < CONFIG.WORLD.TREE_COUNT * 2 && treeIdx < CONFIG.WORLD.TREE_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const z = (Math.random() - 0.5) * size * 0.8;
      const dist = Math.hypot(x, z);

      // Don't spawn on summit mountain peak
      if (dist < 45) continue;

      const y = this.terrain.getHeightAt(x, z);
      // Spawn only in meadow / forest altitudes (above beach, below snow)
      if (y > 2.2 && y < 28.0) {
        const s = 0.8 + Math.random() * 0.5;

        // Trunk
        dummy.position.set(x, y + 2.2 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        this.treeTrunks.setMatrixAt(treeIdx, dummy.matrix);

        // Leaves
        dummy.position.set(x, y + 5.0 * s, z);
        dummy.updateMatrix();
        this.treeLeaves.setMatrixAt(treeIdx, dummy.matrix);

        this.trees.push({ x, y, z, radius: 1.2 * s, hp: 5 });
        treeIdx++;
      }
    }
    this.treeTrunks.count = treeIdx;
    this.treeLeaves.count = treeIdx;
    this.treeTrunks.instanceMatrix.needsUpdate = true;
    this.treeLeaves.instanceMatrix.needsUpdate = true;
    this.scene.add(this.treeTrunks);
    this.scene.add(this.treeLeaves);

    // 2. Instanced Rocks
    const rockGeom = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x484649, roughness: 0.9 });
    this.rockMesh = new THREE.InstancedMesh(rockGeom, rockMat, CONFIG.WORLD.ROCK_COUNT);
    this.rockMesh.castShadow = true;

    let rockIdx = 0;
    for (let i = 0; i < CONFIG.WORLD.ROCK_COUNT * 2 && rockIdx < CONFIG.WORLD.ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.85;
      const z = (Math.random() - 0.5) * size * 0.85;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 1.2) {
        const s = 0.7 + Math.random() * 0.8;
        dummy.position.set(x, y + 0.6 * s, z);
        dummy.scale.set(s * (1 + Math.random() * 0.3), s, s * (1 + Math.random() * 0.3));
        dummy.rotation.set(Math.random(), Math.random(), Math.random());
        dummy.updateMatrix();
        this.rockMesh.setMatrixAt(rockIdx, dummy.matrix);

        this.rocks.push({ x, y, z, radius: 1.0 * s, hp: 6 });
        rockIdx++;
      }
    }
    this.rockMesh.count = rockIdx;
    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.rockMesh);

    // 3. Glowing Aetheria Crystals
    const crystalGeom = new THREE.ConeGeometry(0.5, 2.2, 5);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.7
    });
    this.crystalMesh = new THREE.InstancedMesh(crystalGeom, crystalMat, CONFIG.WORLD.CRYSTAL_COUNT);

    let crystalIdx = 0;
    for (let i = 0; i < CONFIG.WORLD.CRYSTAL_COUNT * 2 && crystalIdx < CONFIG.WORLD.CRYSTAL_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.75;
      const z = (Math.random() - 0.5) * size * 0.75;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 3.0) {
        const s = 0.8 + Math.random() * 0.6;
        dummy.position.set(x, y + 1.1 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
        dummy.updateMatrix();
        this.crystalMesh.setMatrixAt(crystalIdx, dummy.matrix);

        this.crystals.push({ x, y, z, radius: 0.8 * s, hp: 4 });
        crystalIdx++;
      }
    }
    this.crystalMesh.count = crystalIdx;
    this.crystalMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.crystalMesh);
  }
}
