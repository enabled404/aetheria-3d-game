import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { settings } from '../core/SettingsManager.js';

export class SkyAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25; // 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
    this.dayDuration = CONFIG.DAY_NIGHT.DAY_DURATION_SECONDS;

    // 1. Directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff8ea, 2.4);
    this.sunLight.castShadow = settings.get('shadows') !== false;
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

    // 2. Directional Moonlight (Illuminates entire island at night)
    this.moonLight = new THREE.DirectionalLight(0x94c8ff, 0.0);
    this.moonLight.castShadow = settings.get('shadows') !== false;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 450;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0006;
    this.scene.add(this.moonLight);

    // 3. Ambient Hemisphere Light (Sky & Ground Bounce)
    this.ambientLight = new THREE.HemisphereLight(0xaad8ff, 0x475e3a, 0.85);
    this.scene.add(this.ambientLight);

    // 4. Sky Dome Mesh with vertical gradient
    this.createSkyDome();

    // 5. Visual Sun & Moon Orbs
    const sunGeom = new THREE.SphereGeometry(14, 16, 16);
    this.sunMesh = new THREE.Mesh(sunGeom, new THREE.MeshBasicMaterial({ color: 0xfff6cf }));
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(12, 16, 16);
    this.moonMesh = new THREE.Mesh(moonGeom, new THREE.MeshBasicMaterial({ color: 0xe6f0ff }));
    this.scene.add(this.moonMesh);

    // 6. Starfield
    this.createStarfield();

    // 7. Aurora Borealis Ribbon Curtain
    this.createAurora();

    // 8. Cosmic Shooting Stars
    this.createShootingStars();

    // 9. Puffy Volumetric Cloud Clusters
    this.createPuffyClouds();

    // Initialize background color
    this.skyColor = new THREE.Color(0x6eb7ec);
    this.scene.background = this.skyColor;

    // React to settings changes
    settings.onChange((key, val) => {
      if (key === 'shadows') {
        this.sunLight.castShadow = !!val;
        this.moonLight.castShadow = !!val;
      }
    });
  }

  createSkyDome() {
    const skyGeom = new THREE.SphereGeometry(480, 24, 16);
    skyGeom.scale(-1, 1, 1);

    const count = skyGeom.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = skyGeom.attributes.position;

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y + 50) / 450));
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

  createAurora() {
    // High-altitude northern sky aurora ribbon
    const width = 420;
    const height = 90;
    const geom = new THREE.PlaneGeometry(width, height, 48, 16);

    const vShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Wave curtain oscillation
        float fold = sin(pos.x * 0.024 + uTime * 0.42) * 22.0
                   + cos(pos.x * 0.05 + uTime * 0.65) * 9.0;
        pos.z += fold;
        pos.y += sin(pos.x * 0.018 + uTime * 0.28) * 6.0;

        vec4 wPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * wPos;
      }
    `;

    const fShader = `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        // Vertical fade at top and bottom
        float vFade = sin(vUv.y * 3.14159);
        vFade = pow(vFade, 0.85);

        // Shimmering vertical light curtains
        float rays = 0.5 + 0.5 * sin(vUv.x * 75.0 + sin(vWorldPos.y * 0.08 + uTime * 1.6) * 3.5);
        rays = mix(0.7, 1.35, rays);

        // Bioluminescent emerald to luminous cosmic violet
        vec3 emerald = vec3(0.08, 0.95, 0.65);
        vec3 violet = vec3(0.65, 0.20, 0.98);
        vec3 auroraColor = mix(emerald, violet, vUv.y);

        float alpha = vFade * uOpacity * 0.85;
        gl_FragColor = vec4(auroraColor * rays, alpha);
      }
    `;

    this.auroraUniforms = {
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 }
    };

    this.auroraMat = new THREE.ShaderMaterial({
      vertexShader: vShader,
      fragmentShader: fShader,
      uniforms: this.auroraUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.auroraMesh = new THREE.Mesh(geom, this.auroraMat);
    this.auroraMesh.position.set(0, 180, -280);
    this.scene.add(this.auroraMesh);
  }

  createShootingStars() {
    this.shootingStars = [];
    const trailGeom = new THREE.CylinderGeometry(0.12, 0.0, 16.0, 6);
    trailGeom.rotateX(Math.PI / 2);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffeeaa,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 4; i++) {
      const star = new THREE.Mesh(trailGeom, starMat.clone());
      star.visible = false;
      star.timer = 2.0 + Math.random() * 8.0;
      star.duration = 0.0;
      star.vel = new THREE.Vector3();
      this.scene.add(star);
      this.shootingStars.push(star);
    }
  }

  createPuffyClouds() {
    this.cloudGroup = new THREE.Group();
    this.cloudSpheres = [];

    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const sphereGeom = new THREE.DodecahedronGeometry(1.0, 1);

    // Multi-tier clouds: low cumulus (45-75m), mid towers (100-140m), high stratus (210-260m)
    const tiers = [
      { count: 18, baseAlt: 55, altVar: 20, scaleMin: 9, scaleVar: 8, puffs: 7 },
      { count: 16, baseAlt: 115, altVar: 25, scaleMin: 14, scaleVar: 12, puffs: 9 },
      { count: 10, baseAlt: 230, altVar: 30, scaleMin: 22, scaleVar: 16, puffs: 11 }
    ];

    for (const tier of tiers) {
      for (let c = 0; c < tier.count; c++) {
        const cluster = new THREE.Group();
        const numPuffs = tier.puffs + Math.floor(Math.random() * 4);
        const baseScale = tier.scaleMin + Math.random() * tier.scaleVar;

        const clusterX = (Math.random() - 0.5) * 520;
        const clusterY = tier.baseAlt + (Math.random() - 0.5) * tier.altVar;
        const clusterZ = (Math.random() - 0.5) * 520;

        for (let p = 0; p < numPuffs; p++) {
          const puff = new THREE.Mesh(sphereGeom, cloudMat);
          const px = (Math.random() - 0.5) * baseScale * 1.7;
          const py = (Math.random() - 0.5) * baseScale * 0.48;
          const pz = (Math.random() - 0.5) * baseScale * 1.3;
          puff.position.set(px, py, pz);

          const s = baseScale * (0.6 + Math.random() * 0.55);
          puff.scale.set(s, s * 0.55, s);
          cluster.add(puff);

          // Store for fly-through collision / vapor detection
          this.cloudSpheres.push({
            pos: new THREE.Vector3(clusterX + px, clusterY + py, clusterZ + pz),
            radius: s * 1.2
          });
        }

        cluster.position.set(clusterX, clusterY, clusterZ);
        this.cloudGroup.add(cluster);
      }
    }

    this.scene.add(this.cloudGroup);
  }

  isInsideCloud(position, buffer = 4.0) {
    if (!position || !this.cloudSpheres) return false;
    for (let i = 0; i < this.cloudSpheres.length; i += 2) { // sample every other puff for speed
      const c = this.cloudSpheres[i];
      const dx = position.x - (c.pos.x + this.cloudGroup.position.x);
      const dy = position.y - c.pos.y;
      const dz = position.z - c.pos.z;
      if (dx * dx + dy * dy + dz * dz < (c.radius + buffer) * (c.radius + buffer)) {
        return true;
      }
    }
    return false;
  }

  update(dt, playerPosition) {
    this.timeOfDay = (this.timeOfDay + dt / this.dayDuration) % 1.0;

    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunDist = CONFIG.DAY_NIGHT.SUN_DISTANCE;

    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * sunDist;
    const sunZ = Math.sin(angle * 0.4) * 60;

    // Sun & Moon Positions
    this.sunMesh.position.set(playerPosition.x + sunX, playerPosition.y + sunY, playerPosition.z + sunZ);
    this.moonMesh.position.set(playerPosition.x - sunX, playerPosition.y - sunY, playerPosition.z - sunZ);

    this.sunLight.position.copy(this.sunMesh.position);
    this.sunLight.target.position.copy(playerPosition);
    this.sunLight.target.updateMatrixWorld();

    this.moonLight.position.copy(this.moonMesh.position);
    this.moonLight.target.position.copy(playerPosition);
    this.moonLight.target.updateMatrixWorld();

    // Center sky dome on player
    this.skyDome.position.copy(playerPosition);

    // Cloud drift
    this.cloudGroup.position.x = (this.cloudGroup.position.x + dt * 2.2) % 440;

    // Atmospheric calculations
    const sunElevation = sunY / sunDist; // 1 = noon, 0 = horizon, -1 = midnight
    const nightGlow = settings.get('nightGlow') || 1.3;

    const daySkyColor = new THREE.Color(0x56aee8);
    const sunsetSkyColor = new THREE.Color(0xf69352);
    const nightSkyColor = new THREE.Color(0x101e38); // Ethereal sapphire night sky, NEVER pitch black

    const dayFogColor = new THREE.Color(0x89c4ed);
    const sunsetFogColor = new THREE.Color(0xf49564);
    const nightFogColor = new THREE.Color(0x142340); // Soft moonlit fog

    if (sunElevation > 0.15) {
      // Full Daytime
      this.skyColor.copy(daySkyColor);
      this.scene.fog.color.copy(dayFogColor);
      this.sunLight.color.setHex(0xfff8ea);
      this.sunLight.intensity = Math.max(0.8, sunElevation * 2.5);
      this.moonLight.intensity = 0.0;
      this.ambientLight.color.setHex(0xaad8ff);
      this.ambientLight.groundColor.setHex(0x475e3a);
      this.ambientLight.intensity = 0.88;
      this.starMaterial.opacity = 0.0;
    } else if (sunElevation > -0.15) {
      // Golden Hour / Sunset / Dawn
      const t = (sunElevation + 0.15) / 0.3; // 0 = night, 1 = day
      this.skyColor.copy(sunsetSkyColor).lerp(daySkyColor, t);
      this.scene.fog.color.copy(sunsetFogColor).lerp(dayFogColor, t);
      this.sunLight.color.setHex(0xff7733).lerp(new THREE.Color(0xfff8ea), t);
      this.sunLight.intensity = Math.max(0.2, t * 2.2);
      this.moonLight.intensity = (1.0 - t) * 0.6 * nightGlow;
      this.ambientLight.intensity = (0.55 + t * 0.33);
      this.starMaterial.opacity = (1.0 - t) * 0.5;
    } else {
      // Nighttime — High Visibility Moonlit Wonderland
      const nightFactor = Math.min(1.0, (-sunElevation - 0.15) / 0.3);
      this.skyColor.copy(sunsetSkyColor).lerp(nightSkyColor, nightFactor);
      this.scene.fog.color.copy(sunsetFogColor).lerp(nightFogColor, nightFactor);

      this.sunLight.intensity = 0.0;
      // Active moonlight illuminating entire island
      const moonElevation = Math.max(0.2, -sunElevation);
      this.moonLight.intensity = THREE.MathUtils.clamp(moonElevation * 1.15 * nightGlow, 0.4, 1.4);

      // Elevated ambient light with rich lunar indigo/cyan tones
      this.ambientLight.color.setHex(0x5a78aa);
      this.ambientLight.groundColor.setHex(0x283850);
      this.ambientLight.intensity = THREE.MathUtils.clamp(0.68 * nightGlow, 0.45, 1.25);

      this.starMaterial.opacity = Math.min(0.95, nightFactor);
    }

    // Update Aurora Borealis
    if (this.auroraUniforms) {
      this.auroraUniforms.uTime.value += dt;
      const targetAuroraOpacity = sunElevation < -0.05 ? Math.min(0.92, (-sunElevation - 0.05) / 0.35) : 0.0;
      this.auroraUniforms.uOpacity.value = THREE.MathUtils.lerp(this.auroraUniforms.uOpacity.value, targetAuroraOpacity, dt * 2.5);
      if (this.auroraMesh) {
        this.auroraMesh.position.x = playerPosition.x;
        this.auroraMesh.position.z = playerPosition.z - 280;
      }
    }

    // Update Cosmic Shooting Stars during night
    if (this.shootingStars && sunElevation < -0.1) {
      for (const star of this.shootingStars) {
        star.timer -= dt;
        if (star.timer <= 0 && !star.visible) {
          star.visible = true;
          star.duration = 0.6 + Math.random() * 0.4;
          const startX = playerPosition.x + (Math.random() - 0.5) * 320;
          const startY = 190 + Math.random() * 80;
          const startZ = playerPosition.z + (Math.random() - 0.5) * 320;
          star.position.set(startX, startY, startZ);

          const speed = 260 + Math.random() * 120;
          const angle = Math.random() * Math.PI * 2;
          star.vel.set(Math.cos(angle) * speed, -speed * 0.45, Math.sin(angle) * speed);
          star.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), star.vel.clone().normalize());
          star.material.opacity = 0.95;
        } else if (star.visible) {
          star.position.addScaledVector(star.vel, dt);
          star.duration -= dt;
          star.material.opacity = Math.max(0, star.duration / 0.8);
          if (star.duration <= 0) {
            star.visible = false;
            star.timer = 4.0 + Math.random() * 12.0;
          }
        }
      }
    } else if (this.shootingStars) {
      for (const star of this.shootingStars) {
        star.visible = false;
      }
    }

    // Always update scene.background so sky is never a void
    this.scene.background.copy(this.skyColor);
  }
}
