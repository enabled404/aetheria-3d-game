import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Ocean {
  constructor(scene) {
    this.scene = scene;
    this.size = CONFIG.WORLD.SIZE * 1.85;
    this.time = 0;

    // High-density GPU grid for fluid Gerstner waves
    const geom = new THREE.PlaneGeometry(this.size, this.size, 160, 160);
    geom.rotateX(-Math.PI / 2);

    this.uniforms = {
      uTime: { value: 0.0 },
      uSunPosition: { value: new THREE.Vector3(120, 150, 80) },
      uCameraPosition: { value: new THREE.Vector3(0, 20, 60) },
      uShallowColor: { value: new THREE.Color(0x18d0bd) }, // Caribbean / Tropical turquoise
      uDeepColor: { value: new THREE.Color(0x0a224a) },    // Deep abyssal sapphire blue
      uFoamColor: { value: new THREE.Color(0xffffff) },
      uSunColor: { value: new THREE.Color(0xfff5d6) }
    };

    const vertexShader = `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vWaveHeight;

      // Gerstner Wave helper: calculates displacement and partial derivatives for analytical normal
      void gerstnerWave(
        vec2 dir, float steepness, float wavelength, float speed,
        vec2 pos, float time,
        inout vec3 p, inout vec3 tangent, inout vec3 binormal
      ) {
        float k = 6.2831853 / wavelength;
        float c = sqrt(9.8 / k) * speed;
        vec2 d = normalize(dir);
        float f = k * (dot(d, pos) - c * time);
        float a = steepness / k;

        p.x += d.x * (a * cos(f));
        p.z += d.y * (a * cos(f));
        p.y += a * sin(f);

        tangent += vec3(
          -d.x * d.x * (steepness * sin(f)),
          d.x * (steepness * cos(f)),
          -d.x * d.y * (steepness * sin(f))
        );
        binormal += vec3(
          -d.x * d.y * (steepness * sin(f)),
          d.y * (steepness * cos(f)),
          -d.y * d.y * (steepness * sin(f))
        );
      }

      void main() {
        vec3 displaced = position;
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 binormal = vec3(0.0, 0.0, 1.0);

        // 4 Multi-Directional Gerstner Wave Trains
        gerstnerWave(vec2(1.0, 0.4), 0.18, 38.0, 0.85, position.xz, uTime, displaced, tangent, binormal);
        gerstnerWave(vec2(-0.5, 0.85), 0.14, 22.0, 0.95, position.xz, uTime, displaced, tangent, binormal);
        gerstnerWave(vec2(0.3, 1.0), 0.10, 11.0, 1.15, position.xz, uTime, displaced, tangent, binormal);
        gerstnerWave(vec2(-0.8, -0.3), 0.07, 6.0, 1.35, position.xz, uTime, displaced, tangent, binormal);

        vec3 worldNormal = normalize(cross(binormal, tangent));
        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);

        vWorldPosition = worldPos.xyz;
        vNormal = worldNormal;
        vWaveHeight = displaced.y;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform vec3 uSunPosition;
      uniform vec3 uCameraPosition;
      uniform vec3 uShallowColor;
      uniform vec3 uDeepColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunColor;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vWaveHeight;

      void main() {
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        vec3 normal = normalize(vNormal);

        // Sun reflection and specular glint
        vec3 sunDir = normalize(uSunPosition - vWorldPosition);
        vec3 halfVector = normalize(sunDir + viewDir);
        float NdotH = max(0.0, dot(normal, halfVector));
        float specular = pow(NdotH, 80.0) * 2.2;

        // Fresnel reflection factor
        float NdotV = max(0.0, dot(normal, viewDir));
        float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 4.0);

        // Depth gradient: shallow turquoise near shore/peaks, deep oceanic blue in troughs
        vec3 waterBase = mix(uDeepColor, uShallowColor, smoothstep(-0.6, 0.6, vWaveHeight));

        // Wave crest dynamic foam
        float foamFactor = smoothstep(0.42, 0.75, vWaveHeight);
        vec3 finalColor = mix(waterBase, uFoamColor, foamFactor * 0.75);

        // Sun glitter highlight
        finalColor += uSunColor * specular;

        // Sky reflection tint via Fresnel
        vec3 skyReflection = vec3(0.45, 0.72, 0.95);
        finalColor = mix(finalColor, skyReflection, fresnel * 0.45);

        // Subtle alpha transparency based on viewing angle
        float alpha = mix(0.82, 0.96, fresnel);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.y = 0.0;
    this.scene.add(this.mesh);
  }

  update(dt, sunPos = null, cameraPos = null) {
    this.time += dt;
    this.uniforms.uTime.value = this.time;

    if (sunPos) {
      this.uniforms.uSunPosition.value.copy(sunPos);
    }
    if (cameraPos) {
      this.uniforms.uCameraPosition.value.copy(cameraPos);
    }
  }
}
