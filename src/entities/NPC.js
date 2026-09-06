import * as THREE from 'three';
import { HumanoidModel } from '../character/HumanoidModel.js';
import { AnimationSystem } from '../character/AnimationSystem.js';

export class NPC {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.npcType = options.type || 'lyra';
    this.name = options.name || 'NPC';
    this.title = options.title || '';
    this.color = options.color || '#00ffff';

    this.model = new HumanoidModel({
      type: this.npcType,
      irisTexture: options.irisTexture || null,
      armorColor: options.armorColor || 0x222a38,
      accentColor: options.accentColor || 0x00ffff
    });
    this.scene.add(this.model.group);

    this.animator = new AnimationSystem(this.model);
    this.position = this.model.group.position;
    if (options.position) {
      this.position.copy(options.position);
    }

    this.interactionRadius = 4.0;
    this.createNameplate();
  }

  createNameplate() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d');

    ctx.fillStyle = 'rgba(8, 14, 24, 0.75)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name} [E]`, 128, 30);

    ctx.fillStyle = '#b0c4de';
    ctx.font = '14px sans-serif';
    ctx.fillText(this.title, 128, 50);

    const tex = new THREE.CanvasTexture(c);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    this.nameplate = new THREE.Sprite(spriteMat);
    this.nameplate.scale.set(2.4, 0.6, 1);
    this.nameplate.position.set(0, 2.4, 0);
    this.model.group.add(this.nameplate);
  }

  update(dt, playerPosition, cameraPosition) {
    const distToPlayer = this.position.distanceTo(playerPosition);

    // Turn head and body to look at player when close
    if (distToPlayer < 7.0) {
      const dx = playerPosition.x - this.position.x;
      const dz = playerPosition.z - this.position.z;
      const targetAngle = Math.atan2(dx, dz);
      this.model.group.rotation.y = THREE.MathUtils.lerp(
        this.model.group.rotation.y,
        targetAngle,
        Math.min(1.0, dt * 5.0)
      );
      this.model.facialAnimator.setGazeTarget(playerPosition.clone().add(new THREE.Vector3(0, 1.6, 0)));
    } else {
      this.model.facialAnimator.setGazeTarget(null);
    }

    this.animator.update(dt, new THREE.Vector3(), true, false);
    this.model.update(dt, cameraPosition);
  }
}
