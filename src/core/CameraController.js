import * as THREE from 'three';

export class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.mode = 'third'; // 'first' | 'third'
    this.distance = 5.2;
    this.targetDistance = 5.2;
    this.heightOffset = 1.6;
    this.shoulderOffset = 0.55;

    this.yaw = 0;
    this.pitch = 0.15;
    this.minPitch = -1.25;
    this.maxPitch = 1.35;

    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;

    this.lookTarget = new THREE.Vector3();
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

  update(dt, playerPosition, terrainHeightFunc = null) {
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    }

    const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.35;
    const shakeZ = (Math.random() - 0.5) * this.shakeIntensity * 0.35;

    const headPos = playerPosition.clone().add(new THREE.Vector3(0, this.heightOffset, 0));

    if (this.mode === 'first') {
      this.camera.position.copy(headPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));
      const lookDir = new THREE.Vector3(
        Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        Math.cos(this.yaw) * Math.cos(this.pitch)
      );
      this.camera.lookAt(headPos.clone().add(lookDir));
    } else {
      // Third person over-the-shoulder orbit
      const side = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(this.shoulderOffset);
      const back = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), -Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
      
      this.targetPos.copy(headPos).add(side).add(back.clone().multiplyScalar(this.targetDistance));

      // Terrain clip prevention
      if (terrainHeightFunc) {
        const floorH = terrainHeightFunc(this.targetPos.x, this.targetPos.z) + 0.8;
        if (this.targetPos.y < floorH) {
          this.targetPos.y = floorH;
        }
      }

      this.currentPos.lerp(this.targetPos, Math.min(1.0, dt * 14.0));
      this.camera.position.copy(this.currentPos).add(new THREE.Vector3(shakeX, shakeY, shakeZ));

      const focusPoint = headPos.clone().add(side.clone().multiplyScalar(0.4)).add(new THREE.Vector3(0, 0.2, 0));
      this.camera.lookAt(focusPoint);
    }
  }

  getForwardVector() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  getRightVector() {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }
}
