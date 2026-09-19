import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';

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
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x89b0d6, 0.0035);

    this.camera = null;
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.rgbShiftPass = null;
    this.vignettePass = null;
    this.outputPass = null;
    this.postProcessingEnabled = true;

    this.targetChromaticAberration = 0.0006;
    this.currentChromaticAberration = 0.0006;
    this.targetVignetteDarkness = 1.12;
    this.currentVignetteDarkness = 1.12;

    this.initPostProcessing();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initPostProcessing() {
    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.composer = new EffectComposer(this.renderer);

      this.renderPass = new RenderPass(this.scene, this.camera || new THREE.PerspectiveCamera());
      this.composer.addPass(this.renderPass);

      // HDR Unreal Bloom: subtle glowing afterburner, lasers, sci-fi relics, sun
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        0.52, // strength
        0.42, // radius
        0.78  // threshold
      );
      this.composer.addPass(this.bloomPass);

      // Chromatic Aberration for high speed, shockwaves, supersonic flight
      this.rgbShiftPass = new ShaderPass(RGBShiftShader);
      this.rgbShiftPass.uniforms['amount'].value = 0.0006;
      this.composer.addPass(this.rgbShiftPass);

      // Cinematic Vignette
      this.vignettePass = new ShaderPass(VignetteShader);
      this.vignettePass.uniforms['offset'].value = 1.05;
      this.vignettePass.uniforms['darkness'].value = 1.12;
      this.composer.addPass(this.vignettePass);

      // Output pass with color space mapping
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);

    } catch (err) {
      console.warn('Post-processing unavailable, falling back to WebGLRenderer:', err);
      this.composer = null;
    }
  }

  setChromaticAberration(amount) {
    this.targetChromaticAberration = amount;
  }

  setVignetteDarkness(darkness) {
    this.targetVignetteDarkness = darkness;
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (this.composer) {
      this.composer.setSize(w, h);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(w, h);
      }
    }
  }

  setCamera(cam) {
    this.camera = cam;
    if (this.renderPass) {
      this.renderPass.camera = cam;
    }
    this.onWindowResize();
  }

  render(dt = 0.016) {
    if (!this.camera) return;

    // Smoothly interpolate post-processing values
    this.currentChromaticAberration = THREE.MathUtils.lerp(
      this.currentChromaticAberration,
      this.targetChromaticAberration,
      Math.min(1.0, dt * 8.0)
    );
    if (this.rgbShiftPass) {
      this.rgbShiftPass.uniforms['amount'].value = this.currentChromaticAberration;
    }

    this.currentVignetteDarkness = THREE.MathUtils.lerp(
      this.currentVignetteDarkness,
      this.targetVignetteDarkness,
      Math.min(1.0, dt * 6.0)
    );
    if (this.vignettePass) {
      this.vignettePass.uniforms['darkness'].value = this.currentVignetteDarkness;
    }

    if (this.composer && this.postProcessingEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
