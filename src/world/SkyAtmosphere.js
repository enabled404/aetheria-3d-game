import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class SkyAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.22; // 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
    this.dayDuration = CONFIG.DAY_NIGHT.DAY_DURATION_SECONDS;

    // 1. Directional Sun
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 450;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    // 2. Ambient Light
    this.ambientLight = new THREE.HemisphereLight(0xb4d8f2, 0x3d4e33, 0.65);
    this.scene.add(this.ambientLight);

    // 3. Sun & Moon Visual Orbs
    const sunGeom = new THREE.SphereGeometry(14, 16, 16);
    this.sunMesh = new THREE.Mesh(sunGeom, new THREE.MeshBasicMaterial({ color: 0xfff6cf }));
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(10, 16, 16);
    this.moonMesh = new THREE.Mesh(moonGeom, new THREE.MeshBasicMaterial({ color: 0xdde8ff }));
    this.scene.add(this.moonMesh);

    // 4. Starfield
    this.createStarfield();

    // 5. Cloud Deck
    this.createClouds();
  }

  createStarfield() {
    const starCount = 1400;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 460.0;

      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // Hemisphere
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.0
    });
    this.starPoints = new THREE.Points(geom, this.starMaterial);
    this.scene.add(this.starPoints);
  }

  createClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudGeom = new THREE.BoxGeometry(22, 5, 22);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.55
    });

    for (let i = 0; i < 45; i++) {
      const c = new THREE.Mesh(cloudGeom, cloudMat);
      c.position.set(
        (Math.random() - 0.5) * 450,
        75 + Math.random() * 20,
        (Math.random() - 0.5) * 450
      );
      c.scale.set(1 + Math.random() * 2, 0.6, 1 + Math.random() * 2);
      this.cloudGroup.add(c);
    }
    this.scene.add(this.cloudGroup);
  }

  update(dt, playerPosition) {
    // Progress time
    this.timeOfDay = (this.timeOfDay + dt / this.dayDuration) % 1.0;

    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunDist = CONFIG.DAY_NIGHT.SUN_DISTANCE;

    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * sunDist;
    const sunZ = Math.sin(angle * 0.4) * 60;

    this.sunMesh.position.set(playerPosition.x + sunX, playerPosition.y + sunY, playerPosition.z + sunZ);
    this.moonMesh.position.set(playerPosition.x - sunX, playerPosition.y - sunY, playerPosition.z - sunZ);

    this.sunLight.position.copy(this.sunMesh.position);
    this.sunLight.target.position.copy(playerPosition);
    this.sunLight.target.updateMatrixWorld();

    // Cloud drift
    this.cloudGroup.position.x = (this.cloudGroup.position.x + dt * 2.5) % 450;

    // Day/Night atmosphere colors
    const isDay = sunY > 0;
    const sunElevation = Math.max(-0.2, sunY / sunDist);

    if (isDay) {
      this.sunLight.intensity = Math.max(0.2, sunElevation * 2.4);
      this.ambientLight.intensity = Math.max(0.25, sunElevation * 0.75);
      this.starMaterial.opacity = 0.0;
      this.scene.fog.color.setHex(0x89b0d6).lerp(new THREE.Color(0xf69d62), Math.max(0, 1.0 - sunElevation * 3.5));
    } else {
      this.sunLight.intensity = 0.05;
      this.ambientLight.intensity = 0.18;
      this.starMaterial.opacity = Math.min(0.9, -sunElevation * 2.5);
      this.scene.fog.color.setHex(0x060b17);
    }
  }
}
