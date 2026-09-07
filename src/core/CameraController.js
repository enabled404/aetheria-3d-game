import * as THREE from 'three';

export class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.mode = 'third'; // 'first' | 'third'
    this.distance = 3.8;
    this.targetDistance = 3.8;
    this.heightOffset = 1.45;
    this.shoulderOffset = 0.45;

    this.yaw = 0;
    this.pitch = 0.12;
    this.minPitch = -1.15;
    this.maxPitch = 1.25;

    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;

    this.currentPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
  }

  toggleMode() {
    this.mode = (this.mode === 'third') ? 'first' : 'third';
    return this.mode;
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 1.5);
  }

  applyMouseDelta(dx, dy, sensitivity = 0.0022) {
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  getForwardVector() {
    // Standard forward vector in horizontal plane
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  getRightVector() {
    // Standard right vector in horizontal plane
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  update(dt, playerPosition, terrainHeightFunc = null) {
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    }

    const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeZ = (Math.random() - 0.5) * this.shakeIntensity * 0.35;

    const headPos = playerPosition.clone().add(new THREE.Vector3(0, this.heightOffset, 0));
    const forward = this.getForwardVector();
    const right = this.getRightVector();

    if (this.mode === 'first') {
      this.camera.position.copy(headPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));
      const lookDir = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      );
      this.camera.lookAt(headPos.clone().add(lookDir));
    } else {
      // Third Person Over-The-Shoulder Camera
      // Camera is positioned BEHIND the player (opposite of forward)
      const backward = new THREE.Vector3(
        Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        Math.cos(this.yaw) * Math.cos(this.pitch)
      );

      const shoulder = right.clone().multiplyScalar(this.shoulderOffset);
      this.targetPos.copy(headPos).add(shoulder).add(backward.multiplyScalar(this.targetDistance));

      // Prevent clipping into terrain
      if (terrainHeightFunc) {
        const floorH = terrainHeightFunc(this.targetPos.x, this.targetPos.z) + 0.6;
        if (this.targetPos.y < floorH) {
          this.targetPos.y = floorH;
        }
      }

      this.currentPos.lerp(this.targetPos, Math.min(1.0, dt * 18.0));
      this.camera.position.copy(this.currentPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));

      // Camera focuses at the player's head + slight shoulder bias
      const focusPoint = headPos.clone().add(shoulder.multiplyScalar(0.35));
      this.camera.lookAt(focusPoint);
    }
  }
}
