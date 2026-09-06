import * as THREE from 'three';

export class AssetManager {
  constructor() {
    this.textures = {};
    this.materials = {};
    this.initProceduralTextures();
  }

  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  initProceduralTextures() {
    // 1. Iris Texture
    this.textures.irisBlue = this.generateIrisTexture('#00eeff', '#0055aa');
    this.textures.irisGreen = this.generateIrisTexture('#33ff88', '#006633');
    this.textures.irisAmber = this.generateIrisTexture('#ffaa00', '#773300');
    this.textures.irisViolet = this.generateIrisTexture('#bb55ff', '#440077');

    // 2. Wood Bark
    this.textures.bark = this.generateBarkTexture();

    // 3. Foliage Leaves
    this.textures.leaf = this.generateLeafTexture();

    // 4. Rune Glow
    this.textures.rune = this.generateRuneTexture();
  }

  generateIrisTexture(coreColor, edgeColor) {
    const c = this.createCanvas(128, 128);
    const ctx = c.getContext('2d');
    const cx = 64, cy = 64;

    // Sclera base
    ctx.fillStyle = '#f8f8fb';
    ctx.fillRect(0, 0, 128, 128);

    // Limbal ring & Iris gradient
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 54);
    grad.addColorStop(0, '#0a0d14'); // pupil edge
    grad.addColorStop(0.2, coreColor);
    grad.addColorStop(0.7, edgeColor);
    grad.addColorStop(0.95, '#040711'); // limbal ring
    grad.addColorStop(1.0, '#eaf0f8');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();

    // Radial striations
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 16);
      ctx.lineTo(cx + Math.cos(ang) * 50, cy + Math.sin(ang) * 50);
      ctx.stroke();
    }

    // Pupil
    ctx.fillStyle = '#05070d';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  generateBarkTexture() {
    const c = this.createCanvas(128, 256);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#422817';
    ctx.fillRect(0, 0, 128, 256);

    ctx.fillStyle = '#2d1b0f';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 256;
      const w = 2 + Math.random() * 3;
      const h = 10 + Math.random() * 30;
      ctx.fillRect(x, y, w, h);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateLeafTexture() {
    const c = this.createCanvas(64, 64);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2f7a3e';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#3da354';
    for (let i = 0; i < 80; i++) {
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 4, 4);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  generateRuneTexture() {
    const c = this.createCanvas(128, 128);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, Math.PI * 2);
    ctx.moveTo(64, 20); ctx.lineTo(64, 108);
    ctx.moveTo(20, 64); ctx.lineTo(108, 64);
    ctx.stroke();

    return new THREE.CanvasTexture(c);
  }
}
