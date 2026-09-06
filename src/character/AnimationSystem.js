import * as THREE from 'three';

export class AnimationSystem {
  constructor(model) {
    this.model = model;
    this.bones = model.bones;
    this.state = 'idle'; // 'idle' | 'walk' | 'run' | 'sprint' | 'jump' | 'thruster' | 'attack1' | 'attack2' | 'attack3' | 'parry' | 'roll' | 'hit'
    this.time = 0;
    this.actionTime = 0;
    this.actionDuration = 0;
    this.isActionLocked = false;
  }

  setState(newState, force = false) {
    if (this.isActionLocked && !force) return;
    if (this.state !== newState) {
      this.state = newState;
    }
  }

  triggerAction(actionName, duration = 0.45) {
    this.state = actionName;
    this.actionTime = 0;
    this.actionDuration = duration;
    this.isActionLocked = true;
  }

  update(dt, velocity = new THREE.Vector3(), isGrounded = true, isThruster = false) {
    this.time += dt;

    if (this.isActionLocked) {
      this.actionTime += dt;
      if (this.actionTime >= this.actionDuration) {
        this.isActionLocked = false;
        this.state = isGrounded ? 'idle' : 'jump';
      }
    } else {
      const speed = Math.hypot(velocity.x, velocity.z);
      if (isThruster) {
        this.state = 'thruster';
      } else if (!isGrounded) {
        this.state = 'jump';
      } else if (speed > 18.0) {
        this.state = 'sprint';
      } else if (speed > 10.0) {
        this.state = 'run';
      } else if (speed > 0.5) {
        this.state = 'walk';
      } else {
        this.state = 'idle';
      }
    }

    this.applyPose(dt);
  }

  applyPose(dt) {
    const b = this.bones;
    if (!b.chest || !b.pelvis) return;

    const t = this.time;

    // Reset base rotations before applying procedural offsets
    let spineX = 0, spineY = 0, spineZ = 0;
    let chestX = 0;
    let lShoulderX = 0, lShoulderZ = 0, rShoulderX = 0, rShoulderZ = 0;
    let lElbowX = -0.2, rElbowX = -0.2;
    let lHipX = 0, rHipX = 0;
    let lKneeX = 0.1, rKneeX = 0.1;
    let pelvisY = 0.95;

    switch (this.state) {
      case 'idle': {
        // Subtle rhythmic breathing
        chestX = Math.sin(t * 2.2) * 0.035;
        b.spine.position.y = 0.12 + Math.sin(t * 2.2) * 0.01;
        lShoulderZ = 0.1 + Math.sin(t * 1.5) * 0.02;
        rShoulderZ = -0.1 - Math.sin(t * 1.5) * 0.02;
        lShoulderX = Math.cos(t * 1.5) * 0.04;
        rShoulderX = -Math.cos(t * 1.5) * 0.04;
        break;
      }
      case 'walk': {
        const stride = t * 6.5;
        pelvisY = 0.95 + Math.abs(Math.sin(stride)) * 0.04;
        lHipX = Math.sin(stride) * 0.45;
        rHipX = -Math.sin(stride) * 0.45;
        lKneeX = Math.max(0.05, -Math.sin(stride) * 0.6);
        rKneeX = Math.max(0.05, Math.sin(stride) * 0.6);

        lShoulderX = -Math.sin(stride) * 0.4;
        rShoulderX = Math.sin(stride) * 0.4;
        lElbowX = -0.35 + Math.cos(stride) * 0.2;
        rElbowX = -0.35 - Math.cos(stride) * 0.2;
        spineZ = Math.sin(stride) * 0.04;
        break;
      }
      case 'run': {
        const stride = t * 10.5;
        pelvisY = 0.94 + Math.abs(Math.sin(stride)) * 0.08;
        spineX = 0.22; // Athletic forward lean
        lHipX = Math.sin(stride) * 0.85;
        rHipX = -Math.sin(stride) * 0.85;
        lKneeX = Math.max(0.1, -Math.sin(stride) * 1.1);
        rKneeX = Math.max(0.1, Math.sin(stride) * 1.1);

        lShoulderX = -Math.sin(stride) * 0.8;
        rShoulderX = Math.sin(stride) * 0.8;
        lElbowX = -0.7;
        rElbowX = -0.7;
        spineY = Math.sin(stride) * 0.08;
        break;
      }
      case 'sprint': {
        const stride = t * 13.5;
        pelvisY = 0.91 + Math.abs(Math.sin(stride)) * 0.1;
        spineX = 0.38; // Aerodynamic aggressive tilt
        lHipX = Math.sin(stride) * 1.1;
        rHipX = -Math.sin(stride) * 1.1;
        lKneeX = Math.max(0.15, -Math.sin(stride) * 1.35);
        rKneeX = Math.max(0.15, Math.sin(stride) * 1.35);

        lShoulderX = -Math.sin(stride) * 1.0;
        rShoulderX = Math.sin(stride) * 1.0;
        lElbowX = -1.1;
        rElbowX = -1.1;
        break;
      }
      case 'jump': {
        spineX = -0.1;
        lHipX = 0.35; rHipX = -0.2;
        lKneeX = 0.6; rKneeX = 0.4;
        lShoulderX = -0.8; rShoulderX = -0.8;
        lShoulderZ = 0.4; rShoulderZ = -0.4;
        break;
      }
      case 'thruster': {
        spineX = 0.15;
        lHipX = 0.1; rHipX = 0.1;
        lKneeX = 0.2; rKneeX = 0.2;
        lShoulderX = 0.4; rShoulderX = 0.4;
        lShoulderZ = 0.3; rShoulderZ = -0.3;
        break;
      }
      case 'attack1': {
        // Horizontal Horizon Slash
        const p = this.actionTime / this.actionDuration;
        spineY = (p - 0.5) * 1.4;
        rShoulderX = -1.2 + p * 0.8;
        rShoulderZ = -0.6 + p * 1.2;
        rElbowX = -0.8 + p * 0.6;
        break;
      }
      case 'attack2': {
        // Rising Cross Cut
        const p = this.actionTime / this.actionDuration;
        spineX = 0.2 - p * 0.4;
        rShoulderX = 0.6 - p * 2.2;
        rShoulderZ = -0.4;
        rElbowX = -0.9 + p * 0.8;
        break;
      }
      case 'attack3': {
        // 360 Cyclone Whirlwind Finisher
        const p = this.actionTime / this.actionDuration;
        this.model.group.rotation.y += dt * 14.0;
        rShoulderX = -1.5;
        rShoulderZ = -1.2;
        lShoulderX = -1.5;
        lShoulderZ = 1.2;
        break;
      }
      case 'parry': {
        // Energy Shield Deflection Stance
        spineX = 0.12;
        lShoulderX = -1.1;
        lShoulderZ = 0.8;
        lElbowX = -1.3;
        rShoulderX = -0.6;
        rShoulderZ = -0.3;
        break;
      }
    }

    // Smooth dampening towards target rotation
    const lerpSpeed = Math.min(1.0, dt * 16.0);
    b.pelvis.position.y = THREE.MathUtils.lerp(b.pelvis.position.y, pelvisY, lerpSpeed);
    b.spine.rotation.x = THREE.MathUtils.lerp(b.spine.rotation.x, spineX, lerpSpeed);
    b.spine.rotation.y = THREE.MathUtils.lerp(b.spine.rotation.y, spineY, lerpSpeed);
    b.spine.rotation.z = THREE.MathUtils.lerp(b.spine.rotation.z, spineZ, lerpSpeed);
    b.chest.rotation.x = THREE.MathUtils.lerp(b.chest.rotation.x, chestX, lerpSpeed);

    b.leftShoulder.rotation.x = THREE.MathUtils.lerp(b.leftShoulder.rotation.x, lShoulderX, lerpSpeed);
    b.leftShoulder.rotation.z = THREE.MathUtils.lerp(b.leftShoulder.rotation.z, lShoulderZ, lerpSpeed);
    b.leftElbow.rotation.x = THREE.MathUtils.lerp(b.leftElbow.rotation.x, lElbowX, lerpSpeed);

    b.rightShoulder.rotation.x = THREE.MathUtils.lerp(b.rightShoulder.rotation.x, rShoulderX, lerpSpeed);
    b.rightShoulder.rotation.z = THREE.MathUtils.lerp(b.rightShoulder.rotation.z, rShoulderZ, lerpSpeed);
    b.rightElbow.rotation.x = THREE.MathUtils.lerp(b.rightElbow.rotation.x, rElbowX, lerpSpeed);

    b.leftHip.rotation.x = THREE.MathUtils.lerp(b.leftHip.rotation.x, lHipX, lerpSpeed);
    b.leftKnee.rotation.x = THREE.MathUtils.lerp(b.leftKnee.rotation.x, lKneeX, lerpSpeed);
    b.rightHip.rotation.x = THREE.MathUtils.lerp(b.rightHip.rotation.x, rHipX, lerpSpeed);
    b.rightKnee.rotation.x = THREE.MathUtils.lerp(b.rightKnee.rotation.x, rKneeX, lerpSpeed);
  }
}
