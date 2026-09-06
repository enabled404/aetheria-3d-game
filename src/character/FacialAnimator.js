import * as THREE from 'three';

export class FacialAnimator {
  constructor(model) {
    this.model = model;
    this.blinkTimer = 2.0 + Math.random() * 2.0;
    this.isBlinking = false;
    this.blinkProgress = 0;

    this.isSpeaking = false;
    this.speechTimer = 0;
    this.phonemeTimer = 0;
    this.targetMouthOpen = 0;
    this.currentMouthOpen = 0;

    this.gazeTarget = new THREE.Vector3();
    this.hasGazeTarget = false;
  }

  setGazeTarget(vec) {
    if (vec) {
      this.gazeTarget.copy(vec);
      this.hasGazeTarget = true;
    } else {
      this.hasGazeTarget = false;
    }
  }

  startSpeaking(duration = 2.0) {
    this.isSpeaking = true;
    this.speechTimer = duration;
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.speechTimer = 0;
    this.targetMouthOpen = 0;
  }

  update(dt, cameraPosition) {
    // 1. Organic Blinking Cycle
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 2.5 + Math.random() * 3.5;
    }

    if (this.isBlinking) {
      this.blinkProgress += dt * 9.0; // ~0.11s total blink duration
      let blinkValue = 0;
      if (this.blinkProgress < 0.4) {
        blinkValue = this.blinkProgress / 0.4;
      } else if (this.blinkProgress < 1.0) {
        blinkValue = 1.0 - (this.blinkProgress - 0.4) / 0.6;
      } else {
        this.isBlinking = false;
        blinkValue = 0;
      }

      if (this.model.leftEyelid && this.model.rightEyelid) {
        this.model.leftEyelid.scale.y = 1.0 - blinkValue * 0.95;
        this.model.rightEyelid.scale.y = 1.0 - blinkValue * 0.95;
      }
    }

    // 2. Speech Lip-Syncing & Mouth Morphs
    if (this.isSpeaking) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) {
        this.stopSpeaking();
      } else {
        this.phonemeTimer -= dt;
        if (this.phonemeTimer <= 0) {
          this.phonemeTimer = 0.08 + Math.random() * 0.12; // Fast speech cadence
          // Pick randomized phonetic openness: A (0.8), E (0.4), O (0.7), M (0.05)
          const phonemes = [0.1, 0.4, 0.75, 0.9, 0.35];
          this.targetMouthOpen = phonemes[Math.floor(Math.random() * phonemes.length)];
        }
      }
    }

    this.currentMouthOpen = THREE.MathUtils.lerp(this.currentMouthOpen, this.targetMouthOpen, Math.min(1.0, dt * 18.0));
    if (this.model.jaw) {
      this.model.jaw.rotation.x = this.currentMouthOpen * 0.28;
    }
    if (this.model.mouthHole) {
      this.model.mouthHole.scale.y = 0.2 + this.currentMouthOpen * 1.6;
    }

    // 3. Gaze & Eye Tracking
    const target = this.hasGazeTarget ? this.gazeTarget : cameraPosition;
    if (target && this.model.head) {
      const worldHeadPos = new THREE.Vector3();
      this.model.head.getWorldPosition(worldHeadPos);
      const dir = target.clone().sub(worldHeadPos).normalize();

      // Eye micro-saccades
      const saccadeX = (Math.random() - 0.5) * 0.02;
      const saccadeY = (Math.random() - 0.5) * 0.02;

      if (this.model.leftEye && this.model.rightEye) {
        this.model.leftEye.rotation.y = THREE.MathUtils.clamp(-dir.x * 0.4 + saccadeX, -0.35, 0.35);
        this.model.leftEye.rotation.x = THREE.MathUtils.clamp(dir.y * 0.3 + saccadeY, -0.25, 0.25);
        this.model.rightEye.rotation.y = this.model.leftEye.rotation.y;
        this.model.rightEye.rotation.x = this.model.leftEye.rotation.x;
      }
    }
  }
}
