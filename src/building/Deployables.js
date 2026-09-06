import * as THREE from 'three';

export class Deployables {
  constructor(scene) {
    this.scene = scene;
    this.turrets = [];
    this.campfires = [];
    this.crates = [];
  }

  placeCampfire(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Stone ring
    const ringGeom = new THREE.TorusGeometry(0.7, 0.18, 6, 12);
    ringGeom.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeom, new THREE.MeshStandardMaterial({ color: 0x3d3936 }));
    group.add(ring);

    // Burning Logs
    const logGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 5);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x221307 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(logGeom, logMat);
      log.rotation.x = Math.PI / 2;
      log.rotation.z = (i / 3) * Math.PI;
      group.add(log);
    }

    // Warm Fire Light
    const light = new THREE.PointLight(0xff6600, 3.5, 16);
    light.position.set(0, 0.4, 0);
    group.add(light);

    this.scene.add(group);
    const campfire = { group, light, pos: pos.clone(), type: 'campfire' };
    this.campfires.push(campfire);
    return campfire;
  }

  placeStorageCrate(pos) {
    const geom = new THREE.BoxGeometry(1.4, 1.1, 1.0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5a391e, roughness: 0.8 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const crate = { mesh, pos: pos.clone(), type: 'crate', items: {} };
    this.crates.push(crate);
    return crate;
  }

  placeTurret(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base tripod
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0x252a33, metalness: 0.8 }));
    base.position.y = 0.4;
    group.add(base);

    // Swivel Head
    const head = new THREE.Group();
    head.position.y = 1.0;
    group.add(head);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00bcd4, emissiveIntensity: 0.6 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, 0.5);
    head.add(barrel);

    this.scene.add(group);
    const turret = { group, head, pos: pos.clone(), cooldown: 0, range: 20.0 };
    this.turrets.push(turret);
    return turret;
  }

  update(dt, enemies, onTurretFire) {
    // Turret automated target tracking
    for (const t of this.turrets) {
      if (t.cooldown > 0) t.cooldown -= dt;

      let closestEnemy = null;
      let closestDist = t.range;

      for (const e of enemies) {
        if (e.isDead) continue;
        const dist = t.pos.distanceTo(e.group.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        const dx = closestEnemy.group.position.x - t.pos.x;
        const dz = closestEnemy.group.position.z - t.pos.z;
        const angle = Math.atan2(dx, dz);
        t.head.rotation.y = angle;

        if (t.cooldown <= 0) {
          t.cooldown = 0.9;
          onTurretFire?.(t.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), closestEnemy);
        }
      }
    }
  }
}
