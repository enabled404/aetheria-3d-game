import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class FoliageSystem {
  constructor(scene, terrain, collisionSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.collisionSystem = collisionSystem;

    this.trees = [];
    this.rocks = [];
    this.crystals = [];
    this.waystones = [];

    this.spawnFoliage();
    this.spawnWaystoneLanterns();
  }

  spawnFoliage() {
    const size = CONFIG.WORLD.SIZE;

    // 1. Multi-Tiered Conifer Trees
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
      if (this.terrain.isInsideAirfield && this.terrain.isInsideAirfield(x, z, 3.0)) continue; // Keep airfield clear

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

        // Save tree reference
        const treeObj = { x, y, z, radius: 0.55 * s, hp: 5 };
        this.trees.push(treeObj);

        // Register trunk cylinder in spatial physics grid
        if (this.collisionSystem) {
          this.collisionSystem.addCollider(x, z, 0.52 * s, 6.0, 'tree', treeObj);
        }

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
      if (this.terrain.isInsideAirfield && this.terrain.isInsideAirfield(x, z, 3.0)) continue;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 1.2) {
        const s = 0.75 + Math.random() * 0.9;
        dummy.position.set(x, y + 0.35 * s, z);
        dummy.scale.set(s * (1 + Math.random() * 0.4), s * 0.75, s * (1 + Math.random() * 0.4));
        dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
        dummy.updateMatrix();
        this.rockMesh.setMatrixAt(rockIdx, dummy.matrix);

        const rockObj = { x, y, z, radius: 1.15 * s, hp: 6 };
        this.rocks.push(rockObj);

        // Register boulder in spatial physics grid
        if (this.collisionSystem) {
          this.collisionSystem.addCollider(x, z, 1.15 * s, 3.0, 'rock', rockObj);
        }

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
      emissiveIntensity: 0.8,
      roughness: 0.2,
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
      if (this.terrain.isInsideAirfield && this.terrain.isInsideAirfield(x, z, 3.0)) continue;
      const y = this.terrain.getHeightAt(x, z);
      if (y > 3.0) {
        const s = 0.8 + Math.random() * 0.6;
        dummy.position.set(x, y + 1.1 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
        dummy.updateMatrix();
        this.crystalMesh.setMatrixAt(crystalIdx, dummy.matrix);

        const crystalObj = { x, y, z, radius: 0.65 * s, hp: 4 };
        this.crystals.push(crystalObj);

        // Register crystal spire in spatial physics grid
        if (this.collisionSystem) {
          this.collisionSystem.addCollider(x, z, 0.6 * s, 3.5, 'crystal', crystalObj);
        }

        // Add glowing point lights to top prominent crystal clusters
        if (crystalIdx < 6) {
          const crystalLight = new THREE.PointLight(0x00e5ff, 2.2, 18, 1.4);
          crystalLight.position.set(x, y + 2.0 * s, z);
          this.scene.add(crystalLight);
        }

        crystalIdx++;
      }
    }
    this.crystalMesh.count = crystalIdx;
    this.crystalMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.crystalMesh);
  }

  spawnWaystoneLanterns() {
    // Ancient runic stone pillars with glowing fire lanterns along paths & key sites
    const waystoneLocations = [
      { x: 12, z: 42, label: "Coast Haven Waystone" },
      { x: -24, z: 52, label: "Forge Trail Waystone" },
      { x: 42, z: -15, label: "Eastern Glade Waystone" },
      { x: 0, z: 32, label: "South Ascent Waystone" },
      { x: -18, z: -25, label: "Northern Ridge Waystone" },
      { x: 26, z: 80, label: "Overlook Waystone" }
    ];

    const stoneGeom = new THREE.CylinderGeometry(0.35, 0.45, 2.6, 6);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x424652, roughness: 0.85 });

    const lanternGeom = new THREE.DodecahedronGeometry(0.32);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffb733 });

    for (const loc of waystoneLocations) {
      const y = this.terrain.getHeightAt(loc.x, loc.z);
      const group = new THREE.Group();
      group.position.set(loc.x, y, loc.z);

      // Stone base pillar
      const pillar = new THREE.Mesh(stoneGeom, stoneMat);
      pillar.position.y = 1.3;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      // Glowing amber lantern core
      const lantern = new THREE.Mesh(lanternGeom, lanternMat);
      lantern.position.y = 2.7;
      group.add(lantern);

      // Warm amber point light casting radius over surrounding landscape
      const light = new THREE.PointLight(0xffa834, 3.2, 22, 1.4);
      light.position.y = 2.7;
      group.add(light);

      this.scene.add(group);
      this.waystones.push({ group, light, pos: group.position, label: loc.label });

      // Register solid waystone in collision system
      if (this.collisionSystem) {
        this.collisionSystem.addCollider(loc.x, loc.z, 0.65, 3.2, 'waystone');
      }
    }
  }
}
