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

    // 1. Multi-Tiered Conifer Trees
    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.32, 0.52, 4.2, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
    this.treeTrunks = new THREE.InstancedMesh(trunkGeom, trunkMat, CONFIG.WORLD.TREE_COUNT);
    this.treeTrunks.castShadow = true;

    // Tier 1 (Bottom wide tier)
    const tier1Geom = new THREE.ConeGeometry(2.5, 3.2, 7);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x245428, roughness: 0.75, flatShading: true });
    this.treeTier1 = new THREE.InstancedMesh(tier1Geom, leavesMat, CONFIG.WORLD.TREE_COUNT);
    this.treeTier1.castShadow = true;

    // Tier 2 (Middle tier)
    const tier2Geom = new THREE.ConeGeometry(2.0, 2.8, 7);
    this.treeTier2 = new THREE.InstancedMesh(tier2Geom, leavesMat, CONFIG.WORLD.TREE_COUNT);
    this.treeTier2.castShadow = true;

    // Tier 3 (Top crown)
    const tier3Geom = new THREE.ConeGeometry(1.4, 2.4, 7);
    this.treeTier3 = new THREE.InstancedMesh(tier3Geom, leavesMat, CONFIG.WORLD.TREE_COUNT);
    this.treeTier3.castShadow = true;

    const dummy = new THREE.Object3D();
    let treeIdx = 0;

    for (let i = 0; i < CONFIG.WORLD.TREE_COUNT * 2 && treeIdx < CONFIG.WORLD.TREE_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const z = (Math.random() - 0.5) * size * 0.8;
      const dist = Math.hypot(x, z);

      if (dist < 48) continue; // Keep summit mountain clear

      const y = this.terrain.getHeightAt(x, z);
      if (y > 2.2 && y < 28.0) {
        const s = 0.85 + Math.random() * 0.45;
        const rotY = Math.random() * Math.PI * 2;

        // Trunk
        dummy.position.set(x, y + 2.1 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set(0, rotY, 0);
        dummy.updateMatrix();
        this.treeTrunks.setMatrixAt(treeIdx, dummy.matrix);

        // Tier 1
        dummy.position.set(x, y + 3.8 * s, z);
        dummy.updateMatrix();
        this.treeTier1.setMatrixAt(treeIdx, dummy.matrix);

        // Tier 2
        dummy.position.set(x, y + 5.2 * s, z);
        dummy.updateMatrix();
        this.treeTier2.setMatrixAt(treeIdx, dummy.matrix);

        // Tier 3
        dummy.position.set(x, y + 6.6 * s, z);
        dummy.updateMatrix();
        this.treeTier3.setMatrixAt(treeIdx, dummy.matrix);

        this.trees.push({ x, y, z, radius: 1.4 * s, hp: 5 });
        treeIdx++;
      }
    }

    this.treeTrunks.count = treeIdx;
    this.treeTier1.count = treeIdx;
    this.treeTier2.count = treeIdx;
    this.treeTier3.count = treeIdx;

    this.treeTrunks.instanceMatrix.needsUpdate = true;
    this.treeTier1.instanceMatrix.needsUpdate = true;
    this.treeTier2.instanceMatrix.needsUpdate = true;
    this.treeTier3.instanceMatrix.needsUpdate = true;

    this.scene.add(this.treeTrunks);
    this.scene.add(this.treeTier1);
    this.scene.add(this.treeTier2);
    this.scene.add(this.treeTier3);

    // 2. Realistic Mossy Granite Boulders
    const rockGeom = new THREE.DodecahedronGeometry(1.3, 1);
    // Deform vertices slightly for organic rock look
    const posAttr = rockGeom.attributes.position;
    for (let j = 0; j < posAttr.count; j++) {
      const vx = posAttr.getX(j);
      const vy = posAttr.getY(j);
      const vz = posAttr.getZ(j);
      const noise = 1.0 + (Math.sin(vx * 4) * Math.cos(vz * 4)) * 0.15;
      posAttr.setXYZ(j, vx * noise, vy * noise, vz * noise);
    }
    rockGeom.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x68646b,
      roughness: 0.88,
      metalness: 0.1,
      flatShading: true
    });
    this.rockMesh = new THREE.InstancedMesh(rockGeom, rockMat, CONFIG.WORLD.ROCK_COUNT);
    this.rockMesh.castShadow = true;
    this.rockMesh.receiveShadow = true;

    let rockIdx = 0;
    for (let i = 0; i < CONFIG.WORLD.ROCK_COUNT * 2 && rockIdx < CONFIG.WORLD.ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.85;
      const z = (Math.random() - 0.5) * size * 0.85;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 1.2) {
        const s = 0.75 + Math.random() * 0.9;
        // Partially embed rock into ground (y - 0.3 * s) so it sits naturally
        dummy.position.set(x, y + 0.35 * s, z);
        dummy.scale.set(s * (1 + Math.random() * 0.4), s * 0.75, s * (1 + Math.random() * 0.4));
        dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
        dummy.updateMatrix();
        this.rockMesh.setMatrixAt(rockIdx, dummy.matrix);

        this.rocks.push({ x, y, z, radius: 1.1 * s, hp: 6 });
        rockIdx++;
      }
    }
    this.rockMesh.count = rockIdx;
    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.rockMesh);

    // 3. Faceted Hexagonal Crystal Spires
    const crystalGeom = new THREE.CylinderGeometry(0.24, 0.45, 2.4, 6);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9,
      flatShading: true
    });

    this.crystalMesh = new THREE.InstancedMesh(crystalGeom, crystalMat, CONFIG.WORLD.CRYSTAL_COUNT);
    this.crystalMesh.castShadow = true;

    let crystalIdx = 0;
    for (let i = 0; i < CONFIG.WORLD.CRYSTAL_COUNT * 2 && crystalIdx < CONFIG.WORLD.CRYSTAL_COUNT; i++) {
      const x = (Math.random() - 0.5) * size * 0.75;
      const z = (Math.random() - 0.5) * size * 0.75;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 3.0) {
        const s = 0.8 + Math.random() * 0.6;
        dummy.position.set(x, y + 1.1 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
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
