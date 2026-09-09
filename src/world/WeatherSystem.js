import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene, terrain, particleEngine, audioEngine, cameraController) {
    this.scene = scene;
    this.terrain = terrain;
    this.particleEngine = particleEngine;
    this.audioEngine = audioEngine;
    this.cameraController = cameraController;

    this.weathers = ['clear', 'storm', 'blood_moon', 'blizzard'];
    this.currentWeather = 'clear';
    this.weatherTimer = 0;
    this.weatherDuration = 180; // 3 minutes per cycle

    // Lightning strike timer during storm
    this.lightningTimer = 6.0;
    this.activeLightning = null;
    this.lightningLight = null;

    // Particle Groups
    this.createRainSystem();
    this.createSnowSystem();
    this.createBloodMistSystem();
    this.createLightningLight();
  }

  createLightningLight() {
    this.lightningLight = new THREE.PointLight(0xddeeff, 0, 350, 1.2);
    this.scene.add(this.lightningLight);
  }

  createRainSystem() {
    const count = 1800;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      velocities[i] = 45.0 + Math.random() * 25.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.35,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    this.rainPoints = new THREE.Points(geom, this.rainMat);
    this.rainVelocities = velocities;
    this.scene.add(this.rainPoints);
  }

  createSnowSystem() {
    const count = 1200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      seeds[i] = Math.random() * 100;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.45,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    this.snowPoints = new THREE.Points(geom, this.snowMat);
    this.snowSeeds = seeds;
    this.scene.add(this.snowPoints);
  }

  createBloodMistSystem() {
    const count = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = 0.5 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.mistMat = new THREE.PointsMaterial({
      color: 0xff1144,
      size: 1.8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    this.bloodMistPoints = new THREE.Points(geom, this.mistMat);
    this.scene.add(this.bloodMistPoints);
  }

  setWeather(type) {
    if (!this.weathers.includes(type)) return;
    this.currentWeather = type;
    this.weatherTimer = 0;
  }

  nextWeather() {
    const idx = (this.weathers.indexOf(this.currentWeather) + 1) % this.weathers.length;
    this.setWeather(this.weathers[idx]);
  }

  triggerLightningStrike(playerPos, onGroundHit = null) {
    // Pick ground target within 20-55m of player
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 42;
    const targetX = playerPos.x + Math.cos(angle) * dist;
    const targetZ = playerPos.z + Math.sin(angle) * dist;
    const targetY = this.terrain.getHeightAt(targetX, targetZ);
    const hitPos = new THREE.Vector3(targetX, targetY, targetZ);

    // Build procedural zigzag lightning bolt
    const points = [];
    const segments = 10;
    let curr = new THREE.Vector3(targetX + (Math.random() - 0.5) * 15, 120, targetZ + (Math.random() - 0.5) * 15);
    points.push(curr.clone());

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const interp = curr.clone().lerp(hitPos, 0.35);
      interp.x += (Math.random() - 0.5) * 14 * (1.0 - t * 0.5);
      interp.y = 120 - t * (120 - targetY);
      interp.z += (Math.random() - 0.5) * 14 * (1.0 - t * 0.5);
      points.push(interp);
      curr = interp;
    }
    points.push(hitPos.clone());

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const bolt = new THREE.Line(geom, mat);
    this.scene.add(bolt);

    // Flash island lighting
    this.lightningLight.position.set(targetX, targetY + 12, targetZ);
    this.lightningLight.intensity = 18.0;

    // Effects & Audio
    this.cameraController.addShake(0.45);
    this.audioEngine.playThunderClap(dist < 32);
    this.particleEngine.spawnSparks(hitPos, 28, 0x00ffff, 14.0);
    this.particleEngine.spawnGroundSlamShockwave(hitPos);

    onGroundHit?.(hitPos);

    // Rapid bolt decay
    setTimeout(() => {
      this.scene.remove(bolt);
      geom.dispose();
      mat.dispose();
      this.lightningLight.intensity = 0;
    }, 120);
  }

  update(dt, playerPos, sky, onLightningDamage = null) {
    this.weatherTimer += dt;
    if (this.weatherTimer >= this.weatherDuration) {
      this.nextWeather();
    }

    // Smoothly transition particle opacities based on weather
    const targetRain = (this.currentWeather === 'storm') ? 0.75 : 0.0;
    const targetSnow = (this.currentWeather === 'blizzard') ? 0.85 : 0.0;
    const targetMist = (this.currentWeather === 'blood_moon') ? 0.55 : 0.0;

    this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, targetRain, dt * 2.0);
    this.snowMat.opacity = THREE.MathUtils.lerp(this.snowMat.opacity, targetSnow, dt * 2.0);
    this.mistMat.opacity = THREE.MathUtils.lerp(this.mistMat.opacity, targetMist, dt * 2.0);

    // 1. Update Rain Particles
    if (this.rainMat.opacity > 0.01) {
      const pos = this.rainPoints.geometry.attributes.position;
      this.rainPoints.position.set(playerPos.x, playerPos.y, playerPos.z);
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - this.rainVelocities[i] * dt;
        if (y < -5.0) y = 45.0 + Math.random() * 8.0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 2. Update Snow Particles
    if (this.snowMat.opacity > 0.01) {
      const pos = this.snowPoints.geometry.attributes.position;
      this.snowPoints.position.set(playerPos.x, playerPos.y, playerPos.z);
      const time = Date.now() * 0.001;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 6.5;
        let x = pos.getX(i) + Math.sin(time + this.snowSeeds[i]) * dt * 3.5;
        if (y < -3.0) y = 42.0;
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }

    // 3. Update Blood Mist Particles
    if (this.mistMat.opacity > 0.01) {
      this.bloodMistPoints.position.set(playerPos.x, playerPos.y, playerPos.z);
      const pos = this.bloodMistPoints.geometry.attributes.position;
      const time = Date.now() * 0.0015;
      for (let i = 0; i < pos.count; i++) {
        const y = 0.8 + Math.sin(time + i) * 1.5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 4. Update Dynamic Lightning in Storm
    if (this.currentWeather === 'storm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 4.5 + Math.random() * 6.0;
        this.triggerLightningStrike(playerPos, onLightningDamage);
      }
    }

    // 5. Sky & Fog Tinting
    if (this.currentWeather === 'blood_moon') {
      this.scene.fog.color.lerp(new THREE.Color(0x380512), dt * 1.5);
      this.scene.fog.density = 0.018;
      sky.moonMesh.material.color.setHex(0xff1122);
      sky.ambientLight.color.lerp(new THREE.Color(0x882035), dt * 1.5);
    } else if (this.currentWeather === 'storm') {
      this.scene.fog.color.lerp(new THREE.Color(0x182435), dt * 1.5);
      this.scene.fog.density = 0.022;
      sky.ambientLight.color.lerp(new THREE.Color(0x405570), dt * 1.5);
    } else if (this.currentWeather === 'blizzard') {
      this.scene.fog.color.lerp(new THREE.Color(0xdde8f5), dt * 1.5);
      this.scene.fog.density = 0.032; // Dense whiteout fog
    } else {
      this.scene.fog.density = 0.012;
      sky.moonMesh.material.color.setHex(0xe6f0ff);
    }
  }

  get isBloodMoon() {
    return this.currentWeather === 'blood_moon';
  }

  get isStorm() {
    return this.currentWeather === 'storm';
  }

  get isBlizzard() {
    return this.currentWeather === 'blizzard';
  }

  getWeatherStatus() {
    switch (this.currentWeather) {
      case 'storm':
        return {
          id: 'storm',
          icon: '⚡',
          label: 'Electric Storm',
          detail: 'Lightning Hazard Active',
          color: '#00ffff'
        };
      case 'blood_moon':
        return {
          id: 'blood_moon',
          icon: '🩸',
          label: 'Blood Moon Eclipse',
          detail: 'Monsters Enraged (+Double XP)',
          color: '#ff2244'
        };
      case 'blizzard':
        return {
          id: 'blizzard',
          icon: '❄️',
          label: 'Glacial Blizzard',
          detail: 'Dense Fog / Low Visibility',
          color: '#80d0ff'
        };
      case 'clear':
      default:
        return {
          id: 'clear',
          icon: '☀️',
          label: 'Temperate Skies',
          detail: 'Calm Island Atmosphere',
          color: '#20e386'
        };
    }
  }
}
