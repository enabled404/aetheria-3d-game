import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class GrassSystem {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.time = 0;
    this.playerPos = new THREE.Vector3();

    this.initGrass();
  }

  initGrass() {
    const bladeCount = 14000;
    const size = CONFIG.WORLD.SIZE;

    // 1. Sleek Tapered Grass Blade Geometry (5 vertices, 3 triangles)
    //    Base is wide, mid-blade bends slightly, tip comes to a sharp point
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      // Triangle 1 (lower left)
      -0.09, 0.0, 0.0,
       0.09, 0.0, 0.0,
      -0.07, 0.65, 0.08,

      // Triangle 2 (lower right)
       0.09, 0.0, 0.0,
       0.07, 0.65, 0.08,
      -0.07, 0.65, 0.08,

      // Triangle 3 (upper taper to tip)
      -0.07, 0.65, 0.08,
       0.07, 0.65, 0.08,
       0.0,  1.35, 0.22
    ]);

    const normals = new Float32Array([
      0, 0.3, 0.95,  0, 0.3, 0.95,  0, 0.3, 0.95,
      0, 0.3, 0.95,  0, 0.3, 0.95,  0, 0.3, 0.95,
      0, 0.2, 0.98,  0, 0.2, 0.98,  0, 0.2, 0.98
    ]);

    // Height factor for vertex shader wind displacement (0.0 at ground, 1.0 at tip)
    const heightWeights = new Float32Array([
      0.0, 0.0, 0.5,
      0.0, 0.5, 0.5,
      0.5, 0.5, 1.0
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geom.setAttribute('aHeightWeight', new THREE.BufferAttribute(heightWeights, 1));

    // 2. MeshStandardMaterial with onBeforeCompile for Wind & Player Interaction
    this.material = new THREE.MeshStandardMaterial({
      color: 0x388232,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uPlayerPos = { value: new THREE.Vector3() };
      this.shaderUniforms = shader.uniforms;

      shader.vertexShader = `
        attribute float aHeightWeight;
        uniform float uTime;
        uniform vec3 uPlayerPos;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position for instance
        vec4 instanceWorldPos = instanceMatrix * vec4(position, 1.0);

        // Sinusoidal dual-harmonic wind sway applied to blade tips
        float windSway = sin(uTime * 2.8 + instanceWorldPos.x * 0.22 + instanceWorldPos.z * 0.16) * 0.32
                       + cos(uTime * 1.9 + instanceWorldPos.z * 0.35) * 0.14;
        
        // Directional gust displacement
        transformed.x += windSway * aHeightWeight * 0.45;
        transformed.z += windSway * aHeightWeight * 0.38;

        // Player proximity repulsion (grass bends away underfoot)
        vec2 toPlayer = instanceWorldPos.xz - uPlayerPos.xz;
        float pDist = length(toPlayer);
        if (pDist < 1.8) {
          float push = (1.8 - pDist) / 1.8;
          vec2 pushDir = normalize(toPlayer + vec2(0.001));
          transformed.x += pushDir.x * push * aHeightWeight * 0.65;
          transformed.z += pushDir.y * push * aHeightWeight * 0.65;
          transformed.y -= push * aHeightWeight * 0.25;
        }
        `
      );

      // Color variation from root to tip in fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        // Subtle sunlit gradient on diffuse color
        diffuseColor.rgb = mix(diffuseColor.rgb * 0.72, diffuseColor.rgb * 1.28, vNormal.y * 0.5 + 0.5);
        `
      );
    };

    // 3. Instanced Mesh setup
    this.instancedMesh = new THREE.InstancedMesh(geom, this.material, bladeCount);
    this.instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colorRoot = new THREE.Color(0x1d471b);
    const colorTip = new THREE.Color(0x56a842);
    let validCount = 0;

    for (let i = 0; i < bladeCount * 2 && validCount < bladeCount; i++) {
      const x = (Math.random() - 0.5) * size * 0.82;
      const z = (Math.random() - 0.5) * size * 0.82;
      const dist = Math.hypot(x, z);

      if (dist < 46) continue; // Skip rocky summit mountain
      if (this.terrain.isInsideAirfield && this.terrain.isInsideAirfield(x, z, 2.0)) continue; // Keep runway clear

      const y = this.terrain.getHeightAt(x, z);
      // Grass thrives between coastal dunes and alpine tree line
      if (y > 2.0 && y < 24.5) {
        dummy.position.set(x, y - 0.05, z);
        const scale = 0.75 + Math.random() * 0.55;
        dummy.scale.set(scale, scale, scale);
        dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
        dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(validCount, dummy.matrix);

        // Subtle per-instance hue variation
        const tint = colorRoot.clone().lerp(colorTip, 0.4 + Math.random() * 0.6);
        this.instancedMesh.setColorAt(validCount, tint);

        validCount++;
      }
    }

    this.instancedMesh.count = validCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instancedMesh);
  }

  update(dt, playerPosition) {
    this.time += dt;
    if (playerPosition) {
      this.playerPos.copy(playerPosition);
    }

    if (this.shaderUniforms) {
      this.shaderUniforms.uTime.value = this.time;
      this.shaderUniforms.uPlayerPos.value.copy(this.playerPos);
    }
  }
}
