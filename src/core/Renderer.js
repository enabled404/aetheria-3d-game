import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x89b0d6, 0.0035);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  setCamera(cam) {
    this.camera = cam;
    this.onWindowResize();
  }

  render() {
    if (this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
