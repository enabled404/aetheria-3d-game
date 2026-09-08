import * as THREE from 'three';
import { settings } from './SettingsManager.js';

export class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      settings.get('fov') || 70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.mode = 'third'; // 'first' | 'third'
    this.baseDistance = settings.get('cameraDistance') || 3.8;
    this.aimDistance = 1.75;
    this.distance = this.baseDistance;
    this.targetDistance = this.distance;
    this.heightOffset = 1.45;
    this.baseShoulderOffset = 0.45;
    this.aimShoulderOffset = 0.54;
    this.shoulderOffset = this.baseShoulderOffset;

    this.baseFov = settings.get('fov') || 70;
    this.aimFov = 48;
    this.isAiming = false;
    this.aimProgress = 0.0;

    this.yaw = 0;
    this.pitch = 0.08; // slightly looking forward/up
    this.minPitch = -1.22; // looking down at ground (~-70 deg)
    this.maxPitch = 1.25;  // looking up at sky (~+72 deg)

    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;

    this.currentPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();

    // Listen for real-time setting updates
    settings.onChange((key, val) => {
      if (key === 'fov') {
        this.baseFov = val;
        if (!this.isAiming) {
          this.camera.fov = val;
          this.camera.updateProjectionMatrix();
        }
      } else if (key === 'cameraDistance') {
        this.baseDistance = val;
        if (!this.isAiming) {
          this.targetDistance = val;
        }
      }
    });
  }

  setAiming(isAiming) {
    this.isAiming = !!isAiming;
  }

  toggleMode() {
    this.mode = (this.mode === 'third') ? 'first' : 'third';
    return this.mode;
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 1.5);
  }

  applyMouseDelta(dx, dy) {
    const sensMultiplier = settings.get('mouseSens') || 1.0;
    const aimSensScale = this.isAiming ? 0.72 : 1.0;
    const baseSens = 0.0022 * sensMultiplier * aimSensScale;
    const invertY = settings.get('invertY') || false;

    // Yaw: moving mouse right rotates right
    this.yaw -= dx * baseSens;

    // Pitch: moving mouse UP (dy < 0) looks UP; moving mouse DOWN (dy > 0) looks DOWN
    const pitchDelta = invertY ? (dy * baseSens) : (-dy * baseSens);
    this.pitch += pitchDelta;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  getForwardVector() {
    // Horizontal forward vector
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  getRightVector() {
    // Horizontal right vector
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  getAimDirection() {
    // True 3D aim vector taking yaw and pitch into account
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }

  update(dt, playerPosition, terrainHeightFunc = null) {
    // Smoothly transition ADS aim progress
    const targetAim = this.isAiming ? 1.0 : 0.0;
    this.aimProgress = THREE.MathUtils.lerp(this.aimProgress, targetAim, Math.min(1.0, dt * 14.0));

    // Dynamic FOV Zoom for PUBG ADS
    const currentFov = THREE.MathUtils.lerp(this.baseFov, this.aimFov, this.aimProgress);
    if (Math.abs(this.camera.fov - currentFov) > 0.05) {
      this.camera.fov = currentFov;
      this.camera.updateProjectionMatrix();
    }

    // Dynamic distance & shoulder offset
    this.targetDistance = THREE.MathUtils.lerp(this.baseDistance, this.aimDistance, this.aimProgress);
    const effectiveShoulder = THREE.MathUtils.lerp(this.baseShoulderOffset, this.aimShoulderOffset, this.aimProgress);

    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    }

    const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeZ = (Math.random() - 0.5) * this.shakeIntensity * 0.35;

    const headPos = playerPosition.clone().add(new THREE.Vector3(0, this.heightOffset, 0));
    const forward = this.getForwardVector();
    const right = this.getRightVector();
    const aimDir = this.getAimDirection();

    if (this.mode === 'first') {
      this.camera.position.copy(headPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));
      this.camera.lookAt(headPos.clone().add(aimDir.clone().multiplyScalar(20.0)));
    } else {
      // Over-the-shoulder third-person camera
      const shoulder = right.clone().multiplyScalar(effectiveShoulder);

      // Camera orbital offset behind player
      // When pitching UP (pitch > 0), camera lowers slightly and angles up towards the sky
      // When pitching DOWN (pitch < 0), camera elevates higher above player and angles down towards the ground
      const orbitPitch = this.pitch * 0.72;
      const camOffset = new THREE.Vector3(
        Math.sin(this.yaw) * Math.cos(orbitPitch),
        -Math.sin(orbitPitch) * 0.75 + 0.28,
        Math.cos(this.yaw) * Math.cos(orbitPitch)
      );

      this.targetPos.copy(headPos)
        .add(shoulder)
        .add(camOffset.multiplyScalar(this.targetDistance));

      // Terrain collision clamp so camera never clips into landscape
      if (terrainHeightFunc) {
        const floorH = terrainHeightFunc(this.targetPos.x, this.targetPos.z) + 0.65;
        if (this.targetPos.y < floorH) {
          this.targetPos.y = floorH;
        }
      }

      this.currentPos.lerp(this.targetPos, Math.min(1.0, dt * 20.0));
      this.camera.position.copy(this.currentPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));

      // Focus point: Look along aim direction ahead of player
      const focusTarget = headPos.clone()
        .add(shoulder.clone().multiplyScalar(0.3))
        .add(aimDir.clone().multiplyScalar(24.0));

      this.camera.lookAt(focusTarget);
    }
  }
}
