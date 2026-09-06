import * as THREE from 'three';

export class DamageNumbers {
  constructor(scene) {
    this.scene = scene;
    this.numbers = [];
  }

  spawn(amount, pos, isCrit = false) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext('2d');

    ctx.fillStyle = isCrit ? '#ffcc00' : '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.font = isCrit ? 'bold 36px sans-serif' : 'bold 28px sans-serif';
    ctx.textAlign = 'center';

    const text = isCrit ? `CRIT ${amount}!` : `${amount}`;
    ctx.strokeText(text, 64, 45);
    ctx.fillText(text, 64, 45);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(isCrit ? 2.2 : 1.6, isCrit ? 1.1 : 0.8, 1);
    sprite.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.2, (Math.random() - 0.5) * 0.6));

    this.scene.add(sprite);
    this.numbers.push({
      sprite,
      velY: 2.2 + Math.random() * 0.8,
      life: 0.85
    });
  }

  update(dt) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.life -= dt;
      n.sprite.position.y += n.velY * dt;
      n.velY -= dt * 3.5;
      n.sprite.material.opacity = Math.max(0, n.life / 0.85);

      if (n.life <= 0) {
        this.scene.remove(n.sprite);
        this.numbers.splice(i, 1);
      }
    }
  }
}
