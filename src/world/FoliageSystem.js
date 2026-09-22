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
    this.spawnSakuraGrove();
    this.spawnCoastalPalms();
    this.spawnBioluminescentShrooms();
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

  spawnSakuraGrove() {
    // Eastern Plateau Cherry Blossom (Sakura) Grove
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.9 });
    const crownGeom = new THREE.DodecahedronGeometry(3.2, 1);
    const sakuraMat = new THREE.MeshStandardMaterial({
      color: 0xffa0be,
      roughness: 0.6,
      emissive: 0xff7799,
      emissiveIntensity: 0.25
    });

    const sakuraPositions = [
      { x: 55, z: -15 }, { x: 62, z: -22 }, { x: 48, z: -28 }, { x: 70, z: -18 },
      { x: 58, z: -8 }, { x: 68, z: -30 }, { x: 75, z: -22 }, { x: 50, z: -18 }
    ];

    for (const pos of sakuraPositions) {
      const y = this.terrain.getHeightAt(pos.x, pos.z);
      const group = new THREE.Group();
      group.position.set(pos.x, y, pos.z);

      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 2.25;
      trunk.rotation.z = 0.08;
      trunk.castShadow = true;
      group.add(trunk);

      const crown = new THREE.Mesh(crownGeom, sakuraMat);
      crown.position.set(0.3, 4.6, 0);
      crown.scale.set(1.1, 0.9, 1.1);
      crown.castShadow = true;
      group.add(crown);

      this.scene.add(group);

      if (this.collisionSystem) {
        this.collisionSystem.addCollider(pos.x, pos.z, 0.6, 5.0, 'tree');
      }
    }
  }

  spawnCoastalPalms() {
    // Coastal Palm Trees leaning towards the ocean along beach perimeters
    const trunkGeom = new THREE.CylinderGeometry(0.24, 0.42, 6.0, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5238, roughness: 0.85 });
    const frondGeom = new THREE.BoxGeometry(0.5, 0.08, 4.2);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x228833, roughness: 0.7, side: THREE.DoubleSide });

    const palmLocations = [
      { x: -140, z: 20, rotZ: 0.22 }, { x: -135, z: -70, rotZ: -0.2 }, { x: -90, z: 120, rotZ: 0.25 },
      { x: 110, z: 85, rotZ: -0.22 }, { x: 125, z: -60, rotZ: -0.25 }, { x: -40, z: -140, rotZ: 0.18 },
      { x: 60, z: 130, rotZ: -0.2 }, { x: -125, z: 80, rotZ: 0.24 }
    ];

    for (const loc of palmLocations) {
      const y = this.terrain.getHeightAt(loc.x, loc.z);
      if (y > 0.8 && y < 4.5) {
        const group = new THREE.Group();
        group.position.set(loc.x, y, loc.z);

        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2.9;
        trunk.rotation.z = loc.rotZ;
        trunk.castShadow = true;
        group.add(trunk);

        // Palm Crown Fronds
        const topX = -Math.sin(loc.rotZ) * 5.8;
        const topY = Math.cos(loc.rotZ) * 5.8;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2;
          const frond = new THREE.Mesh(frondGeom, frondMat);
          frond.position.set(topX + Math.cos(ang) * 1.8, topY - 0.2, Math.sin(ang) * 1.8);
          frond.rotation.y = ang;
          frond.rotation.x = 0.35;
          group.add(frond);
        }

        this.scene.add(group);
        if (this.collisionSystem) {
          this.collisionSystem.addCollider(loc.x, loc.z, 0.45, 6.0, 'tree');
        }
      }
    }
  }

  spawnBioluminescentShrooms() {
    // Forest clearings with glowing mushrooms emitting teal and violet light
    const capGeom = new THREE.SphereGeometry(0.55, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const stemGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6);
    const shroomMatTeal = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00e5bb,
      emissiveIntensity: 1.6,
      roughness: 0.3
    });
    const shroomMatPurple = new THREE.MeshStandardMaterial({
      color: 0xcc44ff,
      emissive: 0xaa22ff,
      emissiveIntensity: 1.6,
      roughness: 0.3
    });

    const shroomPatches = [
      { x: -20, z: 35, color: 'teal' },
      { x: 30, z: -40, color: 'purple' },
      { x: -45, z: 80, color: 'teal' },
      { x: 15, z: 75, color: 'purple' }
    ];

    for (const patch of shroomPatches) {
      const baseY = this.terrain.getHeightAt(patch.x, patch.z);
      const isTeal = patch.color === 'teal';
      const mat = isTeal ? shroomMatTeal : shroomMatPurple;
      const lightColor = isTeal ? 0x00ffcc : 0xcc44ff;

      for (let s = 0; s < 5; s++) {
        const sx = patch.x + (Math.random() - 0.5) * 4.5;
        const sz = patch.z + (Math.random() - 0.5) * 4.5;
        const sy = this.terrain.getHeightAt(sx, sz);

        const group = new THREE.Group();
        group.position.set(sx, sy, sz);
        const scale = 0.6 + Math.random() * 0.7;
        group.scale.set(scale, scale, scale);

        const stem = new THREE.Mesh(stemGeom, new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 }));
        stem.position.y = 0.4;
        group.add(stem);

        const cap = new THREE.Mesh(capGeom, mat);
        cap.position.y = 0.8;
        group.add(cap);

        this.scene.add(group);
      }

      // Atmospheric glowing point light in patch
      const patchLight = new THREE.PointLight(lightColor, 1.8, 14, 1.5);
      patchLight.position.set(patch.x, baseY + 1.2, patch.z);
      this.scene.add(patchLight);
    }
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
