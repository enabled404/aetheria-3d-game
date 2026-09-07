import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class SkyAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25; // 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
    this.dayDuration = CONFIG.DAY_NIGHT.DAY_DURATION_SECONDS;

    // 1. Directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff8ea, 2.4);
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
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // 2. Ambient Hemisphere Light (Sky & Ground Bounce)
    this.ambientLight = new THREE.HemisphereLight(0xaad8ff, 0x475e3a, 0.85);
    this.scene.add(this.ambientLight);

    // 3. Sky Dome Mesh with vertical gradient
    this.createSkyDome();

    // 4. Visual Sun & Moon Orbs
    const sunGeom = new THREE.SphereGeometry(14, 16, 16);
    this.sunMesh = new THREE.Mesh(sunGeom, new THREE.MeshBasicMaterial({ color: 0xfff6cf }));
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(10, 16, 16);
    this.moonMesh = new THREE.Mesh(moonGeom, new THREE.MeshBasicMaterial({ color: 0xdde8ff }));
    this.scene.add(this.moonMesh);

    // 5. Starfield
    this.createStarfield();

    // 6. Puffy Volumetric Cloud Clusters (no flat boxes!)
    this.createPuffyClouds();

    // Initialize background color so it is NEVER pitch black
    this.skyColor = new THREE.Color(0x6eb7ec);
    this.scene.background = this.skyColor;
  }

  createSkyDome() {
    const skyGeom = new THREE.SphereGeometry(480, 24, 16);
    // Invert geometry so faces point inward
    skyGeom.scale(-1, 1, 1);

    // Vertical gradient colors on sky dome
    const count = skyGeom.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = skyGeom.attributes.position;

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y + 50) / 450));
      // Zenith (deep azure) -> Horizon (soft sky tint)
      const c = new THREE.Color(0x2278bf).lerp(new THREE.Color(0x9bd0f5), 1.0 - t);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    skyGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeom, this.skyMat);
    this.scene.add(this.skyDome);
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
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.starPoints = new THREE.Points(geom, this.starMaterial);
    this.scene.add(this.starPoints);
  }

  createPuffyClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const sphereGeom = new THREE.DodecahedronGeometry(1.0, 1);

    // Build 24 organic, puffy cloud clusters
    for (let c = 0; c < 24; c++) {
      const cluster = new THREE.Group();
      const numPuffs = 6 + Math.floor(Math.random() * 6);
      const baseScale = 8 + Math.random() * 8;

      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(sphereGeom, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * baseScale * 1.6,
          (Math.random() - 0.5) * baseScale * 0.45,
          (Math.random() - 0.5) * baseScale * 1.2
        );
        const s = baseScale * (0.55 + Math.random() * 0.55);
        puff.scale.set(s, s * 0.55, s);
        cluster.add(puff);
      }

      cluster.position.set(
        (Math.random() - 0.5) * 440,
        90 + Math.random() * 25,
        (Math.random() - 0.5) * 440
      );
      this.cloudGroup.add(cluster);
    }
    this.scene.add(this.cloudGroup);
  }

  update(dt, playerPosition) {
    // Progress day/night cycle
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

    // Center sky dome on player
    this.skyDome.position.copy(playerPosition);

    // Cloud drift
    this.cloudGroup.position.x = (this.cloudGroup.position.x + dt * 2.2) % 440;

    // Atmospheric colors based on sun elevation
    const sunElevation = sunY / sunDist; // 1 = noon, 0 = horizon, -1 = midnight

    const daySkyColor = new THREE.Color(0x56aee8);
    const sunsetSkyColor = new THREE.Color(0xf69352);
    const nightSkyColor = new THREE.Color(0x060d1e);

    const dayFogColor = new THREE.Color(0x89c4ed);
    const sunsetFogColor = new THREE.Color(0xf49564);
    const nightFogColor = new THREE.Color(0x081024);

    if (sunElevation > 0.15) {
      // Full Daytime
      this.skyColor.copy(daySkyColor);
      this.scene.fog.color.copy(dayFogColor);
      this.sunLight.color.setHex(0xfff8ea);
      this.sunLight.intensity = Math.max(0.8, sunElevation * 2.5);
      this.ambientLight.intensity = 0.85;
      this.starMaterial.opacity = 0.0;
    } else if (sunElevation > -0.15) {
      // Golden Hour / Sunset / Dawn
      const t = (sunElevation + 0.15) / 0.3; // 0 = night, 1 = day
      this.skyColor.copy(sunsetSkyColor).lerp(daySkyColor, t);
      this.scene.fog.color.copy(sunsetFogColor).lerp(dayFogColor, t);
      this.sunLight.color.setHex(0xff7733).lerp(new THREE.Color(0xfff8ea), t);
      this.sunLight.intensity = Math.max(0.3, t * 2.2);
      this.ambientLight.intensity = 0.5 + t * 0.35;
      this.starMaterial.opacity = (1.0 - t) * 0.4;
    } else {
      // Nighttime
      const nightFactor = Math.min(1.0, (-sunElevation - 0.15) / 0.3);
      this.skyColor.copy(sunsetSkyColor).lerp(nightSkyColor, nightFactor);
      this.scene.fog.color.copy(sunsetFogColor).lerp(nightFogColor, nightFactor);
      this.sunLight.intensity = 0.08;
      this.ambientLight.intensity = 0.24;
      this.starMaterial.opacity = Math.min(0.95, nightFactor);
    }

    // CRITICAL: Always update scene.background so sky is never a black void
    this.scene.background.copy(this.skyColor);
  }
}
