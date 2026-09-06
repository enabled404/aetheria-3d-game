import * as THREE from 'three';
import { FacialAnimator } from './FacialAnimator.js';

export class HumanoidModel {
  constructor(options = {}) {
    this.type = options.type || 'player'; // 'player' | 'lyra' | 'thorne' | 'kaelen' | 'grunt'
    this.group = new THREE.Group();

    this.skinColor = options.skinColor || 0xd69b74;
    this.hairColor = options.hairColor || 0x221a14;
    this.irisTexture = options.irisTexture || null;
    this.armorColor = options.armorColor || 0x1d273a;
    this.accentColor = options.accentColor || 0x00e5ff;

    this.bones = {};
    this.buildSkeletonAndMesh();
    this.facialAnimator = new FacialAnimator(this);
  }

  buildSkeletonAndMesh() {
    const skinMat = new THREE.MeshStandardMaterial({
      color: this.skinColor,
      roughness: 0.65,
      metalness: 0.05
    });

    const armorMat = new THREE.MeshStandardMaterial({
      color: this.armorColor,
      roughness: 0.45,
      metalness: 0.4
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: this.accentColor,
      emissive: this.accentColor,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.8
    });

    // 1. Root & Pelvis
    this.root = new THREE.Group();
    this.group.add(this.root);

    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.root.add(this.pelvis);
    this.bones.pelvis = this.pelvis;

    // Pelvis Mesh / Belt
    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.26), armorMat);
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // 2. Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.12;
    this.pelvis.add(this.spine);
    this.bones.spine = this.spine;

    this.chest = new THREE.Group();
    this.chest.position.y = 0.32;
    this.spine.add(this.chest);
    this.bones.chest = this.chest;

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.28), armorMat);
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Glowing Chest Core / Insignia
    const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), accentMat);
    coreMesh.rotation.x = Math.PI / 2;
    coreMesh.position.set(0, 0.05, 0.15);
    this.chest.add(coreMesh);

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.22;
    this.chest.add(this.neck);
    this.bones.neck = this.neck;

    this.head = new THREE.Group();
    this.head.position.y = 0.14;
    this.neck.add(this.head);
    this.bones.head = this.head;

    // Head Base (Cranium)
    const headGeom = new THREE.SphereGeometry(0.18, 16, 14);
    headGeom.scale(1.0, 1.15, 1.05);
    const cranium = new THREE.Mesh(headGeom, skinMat);
    cranium.castShadow = true;
    this.head.add(cranium);

    // Defined Chin & Jaw
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.08, 0.05);
    this.head.add(this.jaw);

    const jawGeom = new THREE.BoxGeometry(0.16, 0.1, 0.18);
    const jawMesh = new THREE.Mesh(jawGeom, skinMat);
    jawMesh.position.set(0, -0.04, 0.02);
    this.jaw.add(jawMesh);

    // Mouth / Lips
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xaa5b5b, roughness: 0.7 });
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.02), lipMat);
    upperLip.position.set(0, -0.06, 0.18);
    this.head.add(upperLip);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), lipMat);
    lowerLip.position.set(0, -0.02, 0.11);
    this.jaw.add(lowerLip);

    this.mouthHole = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: 0x110505 }));
    this.mouthHole.position.set(0, -0.075, 0.178);
    this.head.add(this.mouthHole);

    // 3D Nose with bridge & tip
    const noseGeom = new THREE.ConeGeometry(0.03, 0.08, 4);
    noseGeom.rotateX(Math.PI / 2.2);
    const nose = new THREE.Mesh(noseGeom, skinMat);
    nose.position.set(0, 0.0, 0.19);
    this.head.add(nose);

    // Expressive Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2 });
    const eyeGeom = new THREE.SphereGeometry(0.042, 12, 10);

    // Left Eye
    this.leftEye = new THREE.Group();
    this.leftEye.position.set(-0.068, 0.045, 0.155);
    this.head.add(this.leftEye);
    const lSclera = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    this.leftEye.add(lSclera);

    const irisGeom = new THREE.CircleGeometry(0.024, 12);
    const irisMat = new THREE.MeshBasicMaterial({
      map: this.irisTexture,
      color: (this.type === 'kaelen') ? 0xcc44ff : (this.type === 'lyra' ? 0x00ffff : 0x3399ff)
    });
    const lIris = new THREE.Mesh(irisGeom, irisMat);
    lIris.position.set(0, 0, 0.041);
    this.leftEye.add(lIris);

    // Left Eyelids
    this.leftEyelid = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.03), skinMat);
    this.leftEyelid.position.set(0, 0.03, 0.035);
    this.leftEye.add(this.leftEyelid);

    // Right Eye
    this.rightEye = new THREE.Group();
    this.rightEye.position.set(0.068, 0.045, 0.155);
    this.head.add(this.rightEye);
    const rSclera = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    this.rightEye.add(rSclera);

    const rIris = new THREE.Mesh(irisGeom, irisMat);
    rIris.position.set(0, 0, 0.041);
    this.rightEye.add(rIris);

    // Right Eyelid
    this.rightEyelid = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.03), skinMat);
    this.rightEyelid.position.set(0, 0.03, 0.035);
    this.rightEye.add(this.rightEyelid);

    // Eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.9 });
    const lBrow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.025), browMat);
    lBrow.position.set(-0.068, 0.09, 0.17);
    lBrow.rotation.z = 0.08;
    this.head.add(lBrow);

    const rBrow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.025), browMat);
    rBrow.position.set(0.068, 0.09, 0.17);
    rBrow.rotation.z = -0.08;
    this.head.add(rBrow);

    // Ears
    const earGeom = new THREE.BoxGeometry(0.04, 0.08, 0.04);
    const lEar = new THREE.Mesh(earGeom, skinMat);
    lEar.position.set(-0.19, 0.02, 0.0);
    this.head.add(lEar);
    const rEar = new THREE.Mesh(earGeom, skinMat);
    rEar.position.set(0.19, 0.02, 0.0);
    this.head.add(rEar);

    // Distinct Type Accoutrements & Hair
    this.buildPersonaSpecifics(skinMat, armorMat, accentMat, browMat);

    // 4. Arms (Left & Right)
    this.leftArm = this.buildArm(-1, armorMat, skinMat);
    this.chest.add(this.leftArm.shoulder);
    this.bones.leftShoulder = this.leftArm.shoulder;
    this.bones.leftElbow = this.leftArm.elbow;
    this.bones.leftHand = this.leftArm.hand;

    this.rightArm = this.buildArm(1, armorMat, skinMat);
    this.chest.add(this.rightArm.shoulder);
    this.bones.rightShoulder = this.rightArm.shoulder;
    this.bones.rightElbow = this.rightArm.elbow;
    this.bones.rightHand = this.rightArm.hand;

    // 5. Legs (Left & Right)
    this.leftLeg = this.buildLeg(-1, armorMat);
    this.pelvis.add(this.leftLeg.hip);
    this.bones.leftHip = this.leftLeg.hip;
    this.bones.leftKnee = this.leftLeg.knee;
    this.bones.leftFoot = this.leftLeg.foot;

    this.rightLeg = this.buildLeg(1, armorMat);
    this.pelvis.add(this.rightLeg.hip);
    this.bones.rightHip = this.rightLeg.hip;
    this.bones.rightKnee = this.rightLeg.knee;
    this.bones.rightFoot = this.rightLeg.foot;
  }

  buildPersonaSpecifics(skinMat, armorMat, accentMat, browMat) {
    if (this.type === 'lyra') {
      // Scholar hair with side braids
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x9b5a2b, roughness: 0.8 });
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 10), hairMat);
      hairTop.position.set(0, 0.04, -0.02);
      this.head.add(hairTop);

      const braidGeom = new THREE.CylinderGeometry(0.03, 0.015, 0.35, 6);
      const lBraid = new THREE.Mesh(braidGeom, hairMat);
      lBraid.position.set(-0.16, -0.15, 0.02);
      this.head.add(lBraid);

      // Chrono-Goggles resting on forehead
      const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0x886622, metalness: 0.8 }));
      goggleFrame.position.set(0, 0.12, 0.15);
      this.head.add(goggleFrame);

      const lensMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.7 });
      const lLens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), lensMat);
      lLens.rotation.x = Math.PI / 2;
      lLens.position.set(-0.065, 0.12, 0.19);
      this.head.add(lLens);
      const rLens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), lensMat);
      rLens.rotation.x = Math.PI / 2;
      rLens.position.set(0.065, 0.12, 0.19);
      this.head.add(rLens);

      // Floating Astrolabe tethered to shoulder
      this.astrolabe = new THREE.Group();
      this.astrolabe.position.set(0.35, 0.3, 0.1);
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 24), lensMat);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 20), new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9 }));
      ring2.rotation.x = Math.PI / 3;
      this.astrolabe.add(ring1);
      this.astrolabe.add(ring2);
      this.chest.add(this.astrolabe);

    } else if (this.type === 'thorne') {
      // Commander Thorne: Battle-scarred brow & cybernetic tactical ocular lens
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x444449, roughness: 0.9 });
      const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.34), hairMat);
      hairMesh.position.set(0, 0.15, -0.02);
      this.head.add(hairMesh);

      // Cybernetic red ocular frame over right eye
      const cybMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.9 });
      const cybLensMat = new THREE.MeshStandardMaterial({ color: 0xff1133, emissive: 0xff0022, emissiveIntensity: 0.9 });
      const cybPlate = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.04), cybMat);
      cybPlate.position.set(0.068, 0.045, 0.17);
      this.head.add(cybPlate);
      const cybLens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), cybLensMat);
      cybLens.rotation.x = Math.PI / 2;
      cybLens.position.set(0.068, 0.045, 0.19);
      this.head.add(cybLens);

      // Heavy Vanguard Pauldron
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), new THREE.MeshStandardMaterial({ color: 0x222a38, metalness: 0.8 }));
      pauldron.position.set(-0.32, 0.24, 0.0);
      this.chest.add(pauldron);

    } else if (this.type === 'kaelen') {
      // Shadow Alchemist: Deep Cowl / Hood casting dramatic shadows
      const cowlMat = new THREE.MeshStandardMaterial({ color: 0x151224, roughness: 0.9 });
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 8), cowlMat);
      hood.position.set(0, 0.15, -0.04);
      hood.rotation.x = -0.2;
      this.head.add(hood);

      const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), cowlMat);
      hoodRim.position.set(0, 0.05, 0.1);
      this.head.add(hoodRim);

      // Potion Bandolier with glowing vials
      const potionMat = new THREE.MeshStandardMaterial({ color: 0xa842ff, emissive: 0x7b1fa2, emissiveIntensity: 0.8 });
      for (let i = 0; i < 3; i++) {
        const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 6), potionMat);
        vial.position.set(-0.14 + i * 0.12, -0.08, 0.17);
        this.chest.add(vial);
      }
    } else {
      // Player: Modern explorer hair & cybernetic gauntlet
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.8 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), hairMat);
      hair.position.set(0, 0.06, -0.02);
      this.head.add(hair);

      // Spiky front bangs
      for (let i = 0; i < 5; i++) {
        const bang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), hairMat);
        bang.rotation.x = Math.PI / 1.6;
        bang.rotation.z = (i - 2) * 0.25;
        bang.position.set((i - 2) * 0.045, 0.12, 0.16);
        this.head.add(bang);
      }

      // Jetpack on Back
      const jetpackMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.8 });
      const jetpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), jetpackMat);
      jetpack.position.set(0, 0.02, -0.18);
      this.chest.add(jetpack);

      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.6 });
      const lNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.08, 8), nozzleMat);
      lNozzle.position.set(-0.08, -0.16, -0.18);
      this.chest.add(lNozzle);
      const rNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.08, 8), nozzleMat);
      rNozzle.position.set(0.08, -0.16, -0.18);
      this.chest.add(rNozzle);
    }
  }

  buildArm(side, armorMat, skinMat) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.28, 0.12, 0);

    const bicepMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.26, 8), armorMat);
    bicepMesh.position.y = -0.13;
    bicepMesh.castShadow = true;
    shoulder.add(bicepMesh);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.24, 8), armorMat);
    forearmMesh.position.y = -0.12;
    forearmMesh.castShadow = true;
    elbow.add(forearmMesh);

    const hand = new THREE.Group();
    hand.position.y = -0.24;
    elbow.add(hand);

    const handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.05), skinMat);
    handMesh.position.y = -0.045;
    hand.add(handMesh);

    return { shoulder, elbow, hand };
  }

  buildLeg(side, armorMat) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, -0.1, 0);

    const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.38, 8), armorMat);
    thighMesh.position.y = -0.19;
    thighMesh.castShadow = true;
    hip.add(thighMesh);

    const knee = new THREE.Group();
    knee.position.y = -0.38;
    hip.add(knee);

    const shinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36, 8), armorMat);
    shinMesh.position.y = -0.18;
    shinMesh.castShadow = true;
    knee.add(shinMesh);

    const foot = new THREE.Group();
    foot.position.y = -0.36;
    knee.add(foot);

    const bootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.5 }));
    bootMesh.position.set(0, -0.04, 0.05);
    bootMesh.castShadow = true;
    foot.add(bootMesh);

    return { hip, knee, foot };
  }

  update(dt, cameraPosition) {
    this.facialAnimator.update(dt, cameraPosition);

    if (this.astrolabe) {
      this.astrolabe.rotation.y += dt * 1.5;
      this.astrolabe.rotation.z += dt * 0.8;
    }
  }
}
