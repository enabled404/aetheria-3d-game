export class HolographicCompass {
  constructor() {
    this.tape = document.getElementById('compass-tape');
  }

  update(yaw) {
    if (!this.tape) return;
    // Normalized yaw in degrees
    const deg = ((-yaw * (180 / Math.PI)) % 360 + 360) % 360;
    const pxOffset = -(deg / 360) * 800;
    this.tape.style.transform = `translateX(${pxOffset}px)`;
  }
}
