export class TopoMap {
  constructor(terrain, gameCursor = null) {
    this.terrain = terrain;
    this.modal = document.getElementById('map-modal');
    this.canvas = document.getElementById('map-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.isOpen = false;
    this.gameCursor = gameCursor;
  }

  setGameCursor(gc) {
    this.gameCursor = gc;
  }

  toggle(playerPos, npcs, bossTitan, deployables) {
    if (this.isOpen) {
      return this.close();
    } else {
      return this.open(playerPos, npcs, bossTitan, deployables);
    }
  }

  open(playerPos, npcs, bossTitan, deployables) {
    this.isOpen = true;
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.renderMap(playerPos, npcs, bossTitan, deployables);
    }
    this.gameCursor?.openUI('map');
    return this.isOpen;
  }

  close() {
    this.isOpen = false;
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.gameCursor?.closeUI('map');
    return this.isOpen;
  }

  renderMap(playerPos, npcs, bossTitan, deployables) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const halfSize = this.terrain.size / 2;

    this.ctx.fillStyle = '#0a1220';
    this.ctx.fillRect(0, 0, w, h);

    // Render terrain elevation contours
    const step = 4;
    for (let py = 0; py < h; py += step) {
      const z = -halfSize + (py / h) * this.terrain.size;
      for (let px = 0; px < w; px += step) {
        const x = -halfSize + (px / w) * this.terrain.size;
        const ht = this.terrain.getHeightAt(x, z);

        if (ht > 32.0) this.ctx.fillStyle = '#e8efff';
        else if (ht > 15.0) this.ctx.fillStyle = '#4c525a';
        else if (ht > 2.0) this.ctx.fillStyle = '#2f6828';
        else if (ht > 0.0) this.ctx.fillStyle = '#d1b988';
        else this.ctx.fillStyle = '#103956';

        this.ctx.fillRect(px, py, step, step);
      }
    }

    const worldToMap = (wx, wz) => ({
      x: ((wx + halfSize) / this.terrain.size) * w,
      y: ((wz + halfSize) / this.terrain.size) * h
    });

    // Airport Runway
    const rStart = worldToMap(-110, -120);
    const rEnd = worldToMap(-110, 60);
    this.ctx.strokeStyle = '#1e2430';
    this.ctx.lineWidth = 7;
    this.ctx.beginPath();
    this.ctx.moveTo(rStart.x, rStart.y);
    this.ctx.lineTo(rEnd.x, rEnd.y);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText('🛫 AERODROME', rStart.x - 42, (rStart.y + rEnd.y) / 2);

    // Summit Altar
    const altar = worldToMap(0, 0);
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.beginPath();
    this.ctx.arc(altar.x, altar.y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // NPCs
    for (const npc of npcs) {
      const np = worldToMap(npc.position.x, npc.position.z);
      this.ctx.fillStyle = npc.color || '#00ffff';
      this.ctx.beginPath();
      this.ctx.arc(np.x, np.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Player marker
    const pp = worldToMap(playerPos.x, playerPos.z);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(pp.x, pp.y, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}
