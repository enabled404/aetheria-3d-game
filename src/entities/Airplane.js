import * as THREE from 'three';

export class Airplane {
  constructor(scene, terrain, position = new THREE.Vector3(-75, 4.22, -30), audioEngine = null, particleEngine = null, collisionSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.audioEngine = audioEngine;
    this.particleEngine = particleEngine;
    this.collisionSystem = collisionSystem;

    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Physics state
    this.velocity = new THREE.Vector3();
    this.speed = 0; // forward airspeed (m/s)
    this.throttle = 0; // 0.0 to 1.0
    this.targetThrottle = 0;
    this.rpm = 0.2; // 0.2 idle to 1.0 max
    this.isAfterburner = false;

    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;
    this.groundPitch = 0; // Takeoff rotation pitch angle
    this.gForce = 1.0;
    this.aoa = 0.0; // Angle of attack

    this.isGrounded = true;
    this.isPilotInside = false;
    this.pilot = null;

    this.brakes = false;
    this.isStalled = false;
    this.stallTimer = 0;

    // Aircraft physical specs
    this.gearHeight = 1.35; // height of fuselage center above ground on wheels
    this.minTakeoffSpeed = 10.5; // m/s (~38 km/h with elevator rotation)
    this.maxSpeed = 62.0; // m/s (~223 km/h)
    this.stallSpeed = 11.5; // m/s
    this.thrustForce = 38.0;
    this.afterburnerThrust = 54.0;

    // Control surfaces & moving parts references
    this.propellers = [];
    this.leftAileron = null;
    this.rightAileron = null;
    this.elevator = null;
    this.rudder = null;
    this.noseGearGroup = null;
    this.noseGearWheel = null;
    this.leftMainGear = null;
    this.rightMainGear = null;
    this.mainGearWheels = [];
    this.gearPosition = 1.0; // 1.0 = down, 0.0 = retracted
    this.targetGearPosition = 1.0;
    this.strobeLights = [];
    this.strobeTimer = 0;
    this.trailTimer = 0;
    this.weaponCooldown = 0;

    // Supersonic & Guided Missile systems
    this.afterburnerFlames = [];
    this.shockDiamonds = [];
    this.afterburnerLight = null;
    this.vaporCone = null;
    this.isSupersonic = false;
    this.mach = 0.0;
    this.missileAmmo = 4;
    this.missileCooldown = 0;
    this.activeMissiles = [];
    this.missileMeshes = [];
    this.lockedTarget = null;
    this.cameraController = null;

    // Spatial Colliders for Solid Obstacle Presence on Foot
    this.colliders = [];

    this.buildModel();
    this.initColliders();
    this.scene.add(this.group);

    // Initial orientation facing down runway (North, towards Z = -100)
    this.group.rotation.y = Math.PI;
  }

  initColliders() {
    if (!this.collisionSystem) return;
    const pos = this.group.position;
    this.fuselageCol = this.collisionSystem.addCollider(pos.x, pos.z, 1.4, 3.5, 'vehicle', this);
    this.leftWingCol = this.collisionSystem.addCollider(pos.x - 4.2, pos.z, 1.1, 2.2, 'vehicle', this);
    this.rightWingCol = this.collisionSystem.addCollider(pos.x + 4.2, pos.z, 1.1, 2.2, 'vehicle', this);
    this.noseCol = this.collisionSystem.addCollider(pos.x, pos.z + 3.2, 0.9, 2.2, 'vehicle', this);
    this.colliders = [this.fuselageCol, this.leftWingCol, this.rightWingCol, this.noseCol];
  }

  updateColliders() {
    if (!this.collisionSystem || this.colliders.length === 0) return;
    const pos = this.group.position;
    const right = this.getRightVector();
    const fwd = this.getForwardVector();

    this.collisionSystem.updateCollider(this.fuselageCol, pos.x, pos.z);
    this.collisionSystem.updateCollider(this.leftWingCol, pos.x - right.x * 4.2, pos.z - right.z * 4.2);
    this.collisionSystem.updateCollider(this.rightWingCol, pos.x + right.x * 4.2, pos.z + right.z * 4.2);
    this.collisionSystem.updateCollider(this.noseCol, pos.x + fwd.x * 3.2, pos.z + fwd.z * 3.2);
  }

  setCollidersActive(active) {
    for (const c of this.colliders) {
      if (c) c.active = !!active;
    }
  }

  buildModel() {
    // 1. Sleek Aerodynamic Composite Fuselage
    const fuselageGroup = new THREE.Group();

    // Main fuselage body (tapered rounded cylinder)
    const bodyGeom = new THREE.CylinderGeometry(0.85, 0.45, 9.2, 14);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a2436,
      metalness: 0.7,
      roughness: 0.35
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    fuselageGroup.add(bodyMesh);

    // Streamlined Nose Cone
    const noseGeom = new THREE.ConeGeometry(0.85, 2.2, 14);
    noseGeom.rotateX(-Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.8, roughness: 0.2 });
    const noseMesh = new THREE.Mesh(noseGeom, noseMat);
    noseMesh.position.set(0, 0, 5.7);
    noseMesh.castShadow = true;
    fuselageGroup.add(noseMesh);

    // Tinted Cockpit Glass Canopy
    const canopyGeom = new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeom.scale(0.8, 0.75, 2.0);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x003355,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x002233,
      emissiveIntensity: 0.3
    });
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.55, 1.6);
    fuselageGroup.add(canopy);

    // Pilot Seat & Cockpit Avionics Panel
    const seatGeom = new THREE.BoxGeometry(0.6, 0.8, 0.6);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.set(0, 0.3, 1.4);
    fuselageGroup.add(seat);

    const mfdGeom = new THREE.BoxGeometry(0.7, 0.35, 0.1);
    const mfdMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const mfd = new THREE.Mesh(mfdGeom, mfdMat);
    mfd.position.set(0, 0.6, 2.4);
    mfd.rotation.x = -0.3;
    fuselageGroup.add(mfd);

    // 2. High-Aspect-Ratio Main Wings
    const wingSpan = 13.5;
    const wingRootChord = 2.4;
    const wingTipChord = 1.2;

    const wingShape = new THREE.Shape();
    wingShape.moveTo(-wingSpan / 2, 0);
    wingShape.lineTo(-wingSpan / 2, -wingTipChord);
    wingShape.lineTo(-0.8, -wingRootChord);
    wingShape.lineTo(0.8, -wingRootChord);
    wingShape.lineTo(wingSpan / 2, -wingTipChord);
    wingShape.lineTo(wingSpan / 2, 0);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const wingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeom.rotateX(Math.PI / 2);
    wingGeom.rotateZ(Math.PI);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x223048,
      metalness: 0.6,
      roughness: 0.4
    });
    const mainWing = new THREE.Mesh(wingGeom, wingMat);
    mainWing.position.set(0, 0.15, 0.6);
    mainWing.castShadow = true;
    fuselageGroup.add(mainWing);

    // Wing Dihedral Winglets
    const wingletGeom = new THREE.BoxGeometry(0.12, 0.9, 0.8);
    const wingletMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.7 });

    const leftWinglet = new THREE.Mesh(wingletGeom, wingletMat);
    leftWinglet.position.set(-wingSpan / 2 + 0.1, 0.5, 0.1);
    leftWinglet.rotation.z = -0.25;
    fuselageGroup.add(leftWinglet);

    const rightWinglet = new THREE.Mesh(wingletGeom, wingletMat);
    rightWinglet.position.set(wingSpan / 2 - 0.1, 0.5, 0.1);
    rightWinglet.rotation.z = 0.25;
    fuselageGroup.add(rightWinglet);

    // 3. Moveable Flight Control Surfaces (Ailerons, Elevators, Rudder)
    const aileronGeom = new THREE.BoxGeometry(2.4, 0.08, 0.45);
    const controlMat = new THREE.MeshStandardMaterial({ color: 0x121b2b, metalness: 0.7 });

    this.leftAileron = new THREE.Mesh(aileronGeom, controlMat);
    this.leftAileron.position.set(-4.5, 0.15, -0.6);
    fuselageGroup.add(this.leftAileron);

    this.rightAileron = new THREE.Mesh(aileronGeom, controlMat);
    this.rightAileron.position.set(4.5, 0.15, -0.6);
    fuselageGroup.add(this.rightAileron);

    // Tail Section (Empennage)
    // Vertical Stabilizer & Rudder
    const finGeom = new THREE.BoxGeometry(0.15, 2.2, 1.8);
    const fin = new THREE.Mesh(finGeom, wingMat);
    fin.position.set(0, 1.25, -3.8);
    fin.rotation.x = -0.3;
    fuselageGroup.add(fin);

    const rudderGeom = new THREE.BoxGeometry(0.12, 1.8, 0.55);
    this.rudder = new THREE.Mesh(rudderGeom, controlMat);
    this.rudder.position.set(0, 1.25, -4.6);
    fuselageGroup.add(this.rudder);

    // Horizontal Stabilizers & Elevators
    const hStabGeom = new THREE.BoxGeometry(4.6, 0.12, 1.2);
    const hStab = new THREE.Mesh(hStabGeom, wingMat);
    hStab.position.set(0, 0.4, -4.2);
    fuselageGroup.add(hStab);

    const elevGeom = new THREE.BoxGeometry(4.4, 0.08, 0.45);
    this.elevator = new THREE.Mesh(elevGeom, controlMat);
    this.elevator.position.set(0, 0.4, -4.9);
    fuselageGroup.add(this.elevator);

    // 4. Twin Turboprop / Jet Engines with Spinning Blades
    const engineOffsets = [-2.8, 2.8];
    const nacelleGeom = new THREE.CylinderGeometry(0.48, 0.42, 2.8, 12);
    nacelleGeom.rotateX(Math.PI / 2);
    const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x141e2e, metalness: 0.8, roughness: 0.3 });

    const propBladeGeom = new THREE.BoxGeometry(0.16, 2.2, 0.04);
    const propBladeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });

    for (const engX of engineOffsets) {
      const nacelle = new THREE.Mesh(nacelleGeom, nacelleMat);
      nacelle.position.set(engX, -0.1, 0.8);
      nacelle.castShadow = true;
      fuselageGroup.add(nacelle);

      // Spinning Propeller Hub
      const propGroup = new THREE.Group();
      propGroup.position.set(engX, -0.1, 2.3);

      const spinnerGeom = new THREE.ConeGeometry(0.24, 0.6, 10);
      spinnerGeom.rotateX(-Math.PI / 2);
      const spinner = new THREE.Mesh(spinnerGeom, noseMat);
      propGroup.add(spinner);

      const blade1 = new THREE.Mesh(propBladeGeom, propBladeMat);
      const blade2 = new THREE.Mesh(propBladeGeom, propBladeMat);
      blade2.rotation.z = Math.PI / 2;
      propGroup.add(blade1);
      propGroup.add(blade2);

      fuselageGroup.add(propGroup);
      this.propellers.push(propGroup);

      // Supersonic Afterburner Exhaust Nozzles & Shock Diamond Cones
      const exhaustGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 12);
      exhaustGeom.rotateX(Math.PI / 2);
      const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95 });
      const exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
      exhaust.position.set(engX, -0.1, -0.65);
      fuselageGroup.add(exhaust);

      // Outer supersonic afterburner flame plume
      const flameGeom = new THREE.ConeGeometry(0.38, 3.2, 10);
      flameGeom.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });
      const flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(engX, -0.1, -2.2);
      fuselageGroup.add(flame);

      // Inner high-density shock diamond core
      const diamondGeom = new THREE.OctahedronGeometry(0.18, 0);
      diamondGeom.scale(0.8, 0.8, 2.4);
      const diamondMat = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });
      const diamond = new THREE.Mesh(diamondGeom, diamondMat);
      diamond.position.set(engX, -0.1, -1.8);
      fuselageGroup.add(diamond);

      this.afterburnerFlames.push({ flame, diamond, flameMat, diamondMat });
    }

    // Dynamic Afterburner Nozzle Point Light
    this.afterburnerLight = new THREE.PointLight(0xff5500, 0.0, 36);
    this.afterburnerLight.position.set(0, -0.1, -2.5);
    fuselageGroup.add(this.afterburnerLight);

    // Transonic Condensation Vapor Cone (Prandtl-Glauert Singularity)
    const vaporGeom = new THREE.ConeGeometry(2.6, 1.1, 16, 1, true);
    vaporGeom.rotateX(Math.PI / 2);
    const vaporMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.vaporCone = new THREE.Mesh(vaporGeom, vaporMat);
    this.vaporCone.position.set(0, 0.2, 0.4);
    fuselageGroup.add(this.vaporCone);

    // 5. Tricycle Landing Gear (Nose Wheel + Main Gear)
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });
    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12);
    wheelGeom.rotateZ(Math.PI / 2);

    // Nose Gear (Steerable & Retractable)
    this.noseGearGroup = new THREE.Group();
    this.noseGearGroup.position.set(0, -0.4, 3.8);

    const noseStrutGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
    const noseStrut = new THREE.Mesh(noseStrutGeom, strutMat);
    noseStrut.position.y = -0.55;
    this.noseGearGroup.add(noseStrut);

    this.noseGearWheel = new THREE.Mesh(wheelGeom, tireMat);
    this.noseGearWheel.position.y = -1.1;
    this.noseGearWheel.castShadow = true;
    this.noseGearGroup.add(this.noseGearWheel);
    fuselageGroup.add(this.noseGearGroup);

    // Main Gear (Left & Right Retractable)
    this.leftMainGear = new THREE.Group();
    this.leftMainGear.position.set(-2.4, -0.15, 0.3);
    const leftMainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8), strutMat);
    leftMainStrut.position.y = -0.68;
    this.leftMainGear.add(leftMainStrut);
    const leftWheel = new THREE.Mesh(wheelGeom, tireMat);
    leftWheel.position.y = -1.35;
    leftWheel.castShadow = true;
    this.leftMainGear.add(leftWheel);
    this.mainGearWheels.push(leftWheel);
    fuselageGroup.add(this.leftMainGear);

    this.rightMainGear = new THREE.Group();
    this.rightMainGear.position.set(2.4, -0.15, 0.3);
    const rightMainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8), strutMat);
    rightMainStrut.position.y = -0.68;
    this.rightMainGear.add(rightMainStrut);
    const rightWheel = new THREE.Mesh(wheelGeom, tireMat);
    rightWheel.position.y = -1.35;
    rightWheel.castShadow = true;
    this.rightMainGear.add(rightWheel);
    this.mainGearWheels.push(rightWheel);
    fuselageGroup.add(this.rightMainGear);

    // 6. Navigation Lights & Wingtip Strobes
    const navLensGeom = new THREE.SphereGeometry(0.08, 8, 8);
    // Port (Left) Red
    const portNav = new THREE.Mesh(navLensGeom, new THREE.MeshBasicMaterial({ color: 0xff1122 }));
    portNav.position.set(-wingSpan / 2, 0.2, 0.1);
    fuselageGroup.add(portNav);

    // Starboard (Right) Green
    const starNav = new THREE.Mesh(navLensGeom, new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
    starNav.position.set(wingSpan / 2, 0.2, 0.1);
    fuselageGroup.add(starNav);

    // Flashing White Strobes
    const leftStrobe = new THREE.Mesh(navLensGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    leftStrobe.position.set(-wingSpan / 2, 0.25, -0.1);
    fuselageGroup.add(leftStrobe);
    this.strobeLights.push(leftStrobe);

    const rightStrobe = new THREE.Mesh(navLensGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    rightStrobe.position.set(wingSpan / 2, 0.25, -0.1);
    fuselageGroup.add(rightStrobe);
    this.strobeLights.push(rightStrobe);

    // Nose Taxi Spotlight
    this.taxiLight = new THREE.SpotLight(0xfff0dd, 2.5, 45, Math.PI / 4, 0.3, 1.2);
    this.taxiLight.position.set(0, -0.2, 5.0);
    this.taxiLightTarget = new THREE.Object3D();
    this.taxiLightTarget.position.set(0, -0.8, 25.0);
    fuselageGroup.add(this.taxiLight);
    fuselageGroup.add(this.taxiLightTarget);
    this.taxiLight.target = this.taxiLightTarget;

    // 7. Twin Wing-Mounted Plasma Cannons (Dogfight Guns)
    for (const gunX of [-3.8, 3.8]) {
      const barrelGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8);
      barrelGeom.rotateX(Math.PI / 2);
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
      const barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(gunX, 0.08, 1.2);
      fuselageGroup.add(barrel);
    }

    // 8. Under-Wing Missile Pylons & Guided Air-to-Air Missiles
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x182436, metalness: 0.8 });
    const missileMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.3 });
    const missileFinMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });

    const pylonOffsets = [-5.2, -4.4, 4.4, 5.2];
    for (let i = 0; i < pylonOffsets.length; i++) {
      const px = pylonOffsets[i];
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 1.2), pylonMat);
      pylon.position.set(px, 0.02, 0.4);
      fuselageGroup.add(pylon);

      // Missile Model
      const missileGroup = new THREE.Group();
      missileGroup.position.set(px, -0.16, 0.4);

      const mBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), missileMat);
      mBody.rotateX(Math.PI / 2);
      missileGroup.add(mBody);

      const mNose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
      mNose.rotateX(-Math.PI / 2);
      mNose.position.z = 0.92;
      missileGroup.add(mNose);

      // Fins
      for (let f = 0; f < 4; f++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.3), missileFinMat);
        fin.rotation.z = (f * Math.PI) / 2;
        fin.position.z = -0.55;
        missileGroup.add(fin);
      }

      fuselageGroup.add(missileGroup);
      this.missileMeshes.push(missileGroup);
    }

    this.group.add(fuselageGroup);
  }

  mount(player) {
    this.isPilotInside = true;
    this.pilot = player;
    player.model.group.visible = false;
    this.targetThrottle = 0.25; // idle throttle upon starting engines
    this.setCollidersActive(false);
    if (this.audioEngine) {
      this.audioEngine.startPlaneEngine(this.throttle);
    }
  }

  dismount() {
    if (!this.pilot) return;
    this.isPilotInside = false;
    const exitPos = this.group.position.clone().add(this.getRightVector().multiplyScalar(3.5));
    exitPos.y = this.terrain.getHeightAt(exitPos.x, exitPos.z) + 0.2;
    this.pilot.position.copy(exitPos);
    this.pilot.velocity.set(0, 0, 0);
    this.pilot.model.group.visible = true;
    this.pilot = null;
    this.isAfterburner = false;
    this.setCollidersActive(true);
    this.updateColliders();

    if (this.audioEngine) {
      this.audioEngine.stopPlaneEngine();
    }
  }

  getForwardVector() {
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.group.quaternion);
    return forward.normalize();
  }

  getRightVector() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.group.quaternion);
    return right.normalize();
  }

  getUpVector() {
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(this.group.quaternion);
    return up.normalize();
  }

  fireCannons(combatManager) {
    if (this.weaponCooldown > 0) return;
    this.weaponCooldown = 0.12; // rapid fire dogfight plasma

    const fwd = this.getForwardVector();
    const right = this.getRightVector();
    const up = this.getUpVector();

    const leftMuzzle = this.group.position.clone()
      .add(fwd.clone().multiplyScalar(2.0))
      .add(right.clone().multiplyScalar(-3.8))
      .add(up.clone().multiplyScalar(0.1));

    const rightMuzzle = this.group.position.clone()
      .add(fwd.clone().multiplyScalar(2.0))
      .add(right.clone().multiplyScalar(3.8))
      .add(up.clone().multiplyScalar(0.1));

    const boltSpeed = 140.0;
    const boltVel = fwd.clone().multiplyScalar(boltSpeed).add(this.velocity);

    if (combatManager) {
      combatManager.spawnPlasmaBolt(leftMuzzle, boltVel, 35, true);
      combatManager.spawnPlasmaBolt(rightMuzzle, boltVel, 35, true);
    }

    if (this.audioEngine) {
      this.audioEngine.playPlaneCannonSound();
    }
  }

  update(dt, inputManager, combatManager = null) {
    // 1. Handle Throttle & Pilot Controls
    if (this.isPilotInside && inputManager) {
      // Mouse wheel throttle adjustment
      const wheelDelta = inputManager.consumeMouseWheelDelta();
      if (wheelDelta !== 0) {
        this.targetThrottle = THREE.MathUtils.clamp(this.targetThrottle - (wheelDelta > 0 ? 0.08 : -0.08), 0.0, 1.0);
      }

      // Shift accelerates throttle; at max throttle, activates afterburner
      if (inputManager.isKeyDown('ShiftLeft')) {
        this.targetThrottle = Math.min(1.0, this.targetThrottle + dt * 0.55);
        this.isAfterburner = (this.throttle > 0.94);
      } else {
        this.isAfterburner = false;
      }

      // Ctrl decelerates throttle
      if (inputManager.isKeyDown('ControlLeft')) {
        this.targetThrottle = Math.max(0.0, this.targetThrottle - dt * 0.65);
      }
      this.brakes = inputManager.isKeyDown('Space');

      // Dogfight Cannons firing
      if (inputManager.mouseButtons && inputManager.mouseButtons[0]) {
        this.fireCannons(combatManager);
      }
    } else {
      // Unoccupied engine decelerates
      this.targetThrottle = 0;
      this.brakes = true;
      this.isAfterburner = false;
      this.updateColliders();
    }

    if (this.weaponCooldown > 0) {
      this.weaponCooldown = Math.max(0, this.weaponCooldown - dt);
    }

    // Engine spooling inertia
    this.throttle = THREE.MathUtils.lerp(this.throttle, this.targetThrottle, Math.min(1.0, dt * 2.8));
    this.rpm = THREE.MathUtils.lerp(this.rpm, 0.2 + this.throttle * 0.8 + (this.isAfterburner ? 0.2 : 0.0), Math.min(1.0, dt * 3.5));

    // Spin Propellers
    const propSpeed = this.rpm * 52.0;
    for (const prop of this.propellers) {
      prop.rotation.z += propSpeed * dt;
    }

    // Strobe lights blinking
    this.strobeTimer += dt;
    const strobeOn = (this.strobeTimer % 1.2) < 0.12;
    for (const strobe of this.strobeLights) {
      strobe.visible = strobeOn;
    }

    const forward = this.getForwardVector();
    const up = this.getUpVector();
    const right = this.getRightVector();

    // 2. Flight Aerodynamics & Hybrid Control
    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    if (this.isPilotInside && inputManager) {
      // Keyboard Pitch: S pulls back (Nose UP), W pushes forward (Nose DOWN)
      if (inputManager.isKeyDown('KeyS') || inputManager.isKeyDown('ArrowDown')) pitchInput -= 1.0;
      if (inputManager.isKeyDown('KeyW') || inputManager.isKeyDown('ArrowUp')) pitchInput += 1.0;

      // Keyboard Roll: A banks Left, D banks Right
      if (inputManager.isKeyDown('KeyA') || inputManager.isKeyDown('ArrowLeft')) rollInput -= 1.0;
      if (inputManager.isKeyDown('KeyD') || inputManager.isKeyDown('ArrowRight')) rollInput += 1.0;

      // Keyboard Yaw: Q rudders Left, E rudders Right
      if (inputManager.isKeyDown('KeyQ')) yawInput -= 1.0;
      if (inputManager.isKeyDown('KeyE')) yawInput += 1.0;

      // Mouse Flight input blending (intuitive flight stick feel)
      const md = inputManager.consumeMouseDelta();
      pitchInput += md.y * 0.022;
      rollInput += md.x * 0.026;
      yawInput += md.x * 0.012;

      pitchInput = THREE.MathUtils.clamp(pitchInput, -1.0, 1.0);
      rollInput = THREE.MathUtils.clamp(rollInput, -1.0, 1.0);
      yawInput = THREE.MathUtils.clamp(yawInput, -1.0, 1.0);
    }

    // Animate control surfaces
    if (this.elevator) this.elevator.rotation.x = -pitchInput * 0.45;
    if (this.rudder) this.rudder.rotation.y = -yawInput * 0.45;
    if (this.leftAileron) this.leftAileron.rotation.x = rollInput * 0.4;
    if (this.rightAileron) this.rightAileron.rotation.x = -rollInput * 0.4;
    if (this.noseGearGroup) this.noseGearGroup.rotation.y = -yawInput * 0.5;

    // Airspeed calculation
    this.speed = Math.max(0, this.velocity.dot(forward));

    // Dynamic pressure scales aerodynamic authority
    const dynamicPressure = Math.min(1.35, this.speed / 20.0);

    if (!this.isGrounded) {
      // In-flight angular rates with aerodynamic damping
      const targetPitchRate = pitchInput * 1.65 * dynamicPressure;
      const targetRollRate = rollInput * 2.85 * dynamicPressure;
      const targetYawRate = yawInput * 0.85 * dynamicPressure;

      this.pitchRate = THREE.MathUtils.lerp(this.pitchRate, targetPitchRate, Math.min(1.0, dt * 6.0));
      this.rollRate = THREE.MathUtils.lerp(this.rollRate, targetRollRate, Math.min(1.0, dt * 7.5));
      this.yawRate = THREE.MathUtils.lerp(this.yawRate, targetYawRate, Math.min(1.0, dt * 5.0));

      // Apply rotations in local aerodynamic axes
      this.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), this.pitchRate * dt);
      this.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), -this.rollRate * dt);
      this.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), -this.yawRate * dt);

      // Coordinated Bank-to-Turn: Carve realistic turns when banked
      const bankSin = right.y; // < 0 when banked right, > 0 when banked left
      const turnRate = -bankSin * Math.min(1.6, (this.speed / 24.0) * 1.5);
      this.group.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), turnRate * dt);

      // Natural aerodynamic roll self-leveling trim when input is neutral
      if (Math.abs(rollInput) < 0.08) {
        const bankAngle = Math.asin(THREE.MathUtils.clamp(right.y, -1, 1));
        this.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), bankAngle * dt * 1.15);
      }
    } else {
      // On ground taxi steering (nosewheel turns aircraft)
      const taxiTurnSpeed = (yawInput * 1.25 + rollInput * 0.55) * Math.min(1.6, this.speed / 6.0) * 1.8;
      this.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), -taxiTurnSpeed * dt);

      // Takeoff pitch rotation (Vr): Pulling back rotates nose up on rear wheels
      if (this.speed > 8.0 && pitchInput < -0.05) {
        const rotSpeed = -pitchInput * 0.75;
        this.groundPitch = Math.min(0.22, this.groundPitch + rotSpeed * dt);
      } else {
        this.groundPitch = Math.max(0.0, this.groundPitch - dt * 2.2);
      }

      if (this.groundPitch > 0) {
        this.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), -this.groundPitch * dt * 6.0);
      }

      this.pitchRate = 0;
      this.rollRate = 0;
    }

    // 3. Aerodynamic Forces (Thrust, AoA Lift, Ground Effect, Drag, Gravity)
    const thrustMagnitude = (this.isAfterburner ? this.afterburnerThrust : this.thrustForce) * this.throttle;
    const thrust = forward.clone().multiplyScalar(thrustMagnitude);
    this.velocity.addScaledVector(thrust, dt);

    // Calculate Angle of Attack (AoA)
    const velLen = this.velocity.length();
    let aoa = 0;
    if (velLen > 0.1) {
      const velDir = this.velocity.clone().normalize();
      aoa = -Math.asin(THREE.MathUtils.clamp(velDir.dot(up), -1, 1)) * (180 / Math.PI);
    }
    this.aoa = aoa;

    // Aerodynamic Lift with AoA curve
    let liftCoeff = THREE.MathUtils.clamp(1.0 + (aoa / 12.0) * 0.9, -0.4, 2.4);

    if (this.speed < this.stallSpeed && Math.abs(aoa) > 18) {
      liftCoeff *= Math.max(0.2, this.speed / this.stallSpeed);
      this.isStalled = (!this.isGrounded && this.throttle < 0.6);
    } else {
      this.isStalled = false;
    }

    if (this.isStalled) {
      this.stallTimer += dt;
      if (this.audioEngine && (this.stallTimer % 0.5) < 0.2) {
        this.audioEngine.playStallAlarm();
      }
      // Stall nose-drop recovery torque
      this.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), dt * 0.95);
    }

    // Ground Effect Cushion: within 1 wingspan (< 12m), induced drag drops & lift rises
    const groundY = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    const minAltitude = groundY + this.gearHeight;
    const altAboveGround = Math.max(0, this.group.position.y - minAltitude);
    const groundEffect = THREE.MathUtils.clamp(1.0 - (altAboveGround / 12.0), 0.0, 1.0);
    const liftMultiplier = 1.0 + groundEffect * 0.24;
    const dragMultiplier = 1.0 - groundEffect * 0.32;

    const liftMagnitude = liftCoeff * Math.min(38.0, (this.speed * this.speed) * 0.054) * liftMultiplier;
    const liftForce = up.clone().multiplyScalar(liftMagnitude);

    if (!this.isGrounded) {
      this.velocity.addScaledVector(liftForce, dt);
    } else {
      // Takeoff transition: when lift overcomes gravity + margin and speed is sufficient
      if (liftMagnitude > 9.81 * 1.06 && this.speed > this.minTakeoffSpeed) {
        this.isGrounded = false;
        this.velocity.y += (liftMagnitude - 9.81) * dt * 0.8;
      }
    }

    // G-force calculation for HUD and camera feedback
    this.gForce = THREE.MathUtils.lerp(this.gForce, 1.0 + (liftMagnitude - 9.81) / 9.81, dt * 7.0);

    // Aerodynamic Drag
    const baseDrag = 0.0105 + (this.brakes ? 0.042 : 0.0);
    const totalDrag = baseDrag * dragMultiplier;
    const drag = this.velocity.clone().multiplyScalar(-totalDrag * velLen);
    this.velocity.addScaledVector(drag, dt);

    // Gravity
    const gravity = new THREE.Vector3(0, -9.81, 0);
    this.velocity.addScaledVector(gravity, dt);

    // Ground rolling friction & wheel brakes
    if (this.isGrounded) {
      const brakeForce = this.brakes ? 22.0 : 2.6;
      const forwardVel = forward.clone().multiplyScalar(this.velocity.dot(forward));
      const lateralVel = this.velocity.clone().sub(forwardVel);

      // Kill lateral ground slide instantly (rubber tires grip asphalt)
      this.velocity.sub(lateralVel);

      // Decelerate rolling forward speed
      const decel = Math.min(this.speed, brakeForce * dt);
      this.velocity.addScaledVector(forward, -decel);

      // Roll wheels
      const wheelDist = this.speed * dt;
      const wheelRot = wheelDist / 0.35;
      if (this.noseGearWheel) this.noseGearWheel.rotation.x += wheelRot;
      for (const mw of this.mainGearWheels) mw.rotation.x += wheelRot;
    }

    // 4. Integrate Position & Ground Collision Detection
    this.group.position.addScaledVector(this.velocity, dt);

    // Auto-retract / deploy landing gear based on altitude and ground state
    if (!this.isGrounded && altAboveGround > 4.5 && this.targetGearPosition === 1.0) {
      this.targetGearPosition = 0.0;
      if (this.audioEngine) this.audioEngine.announceVoice('GEAR UP');
    } else if (altAboveGround < 5.5 && this.velocity.y < 0 && this.targetGearPosition === 0.0) {
      this.targetGearPosition = 1.0;
      if (this.audioEngine) this.audioEngine.announceVoice('GEAR DOWN');
    }

    // Manual Gear Toggle key (G)
    if (inputManager && inputManager.isKeyDown('KeyG') && !this.gearKeyDebounce) {
      this.gearKeyDebounce = true;
      this.targetGearPosition = this.targetGearPosition > 0.5 ? 0.0 : 1.0;
      if (this.audioEngine) {
        this.audioEngine.announceVoice(this.targetGearPosition > 0.5 ? 'GEAR DOWN' : 'GEAR UP');
      }
    } else if (inputManager && !inputManager.isKeyDown('KeyG')) {
      this.gearKeyDebounce = false;
    }

    // Animate Retractable Gear
    this.gearPosition = THREE.MathUtils.lerp(this.gearPosition, this.targetGearPosition, dt * 2.8);
    if (this.noseGearGroup) {
      this.noseGearGroup.rotation.x = (1.0 - this.gearPosition) * 1.45;
      this.noseGearGroup.visible = this.gearPosition > 0.05;
    }
    if (this.leftMainGear) {
      this.leftMainGear.rotation.z = -(1.0 - this.gearPosition) * 1.35;
      this.leftMainGear.visible = this.gearPosition > 0.05;
    }
    if (this.rightMainGear) {
      this.rightMainGear.rotation.z = (1.0 - this.gearPosition) * 1.35;
      this.rightMainGear.visible = this.gearPosition > 0.05;
    }

    // Supersonic & Mach calculations (42 m/s = Mach 1.0)
    this.mach = this.speed / 42.0;

    // Sonic Boom shockwave detonation
    if (!this.isSupersonic && this.mach >= 1.0) {
      this.isSupersonic = true;
      if (this.audioEngine) this.audioEngine.playSonicBoom();
      if (this.cameraController) this.cameraController.addShake(0.48);
      if (this.particleEngine) {
        this.particleEngine.spawnSparks(this.group.position, 48, 0x00ffff, 20.0);
      }
    } else if (this.mach < 0.93) {
      this.isSupersonic = false;
    }

    // Transonic Vapor Cone (Prandtl-Glauert Singularity)
    if (this.vaporCone) {
      if (this.mach >= 0.88 && this.mach <= 1.08 && !this.isGrounded) {
        const intensity = 1.0 - Math.abs(this.mach - 0.98) / 0.1;
        this.vaporCone.material.opacity = Math.max(0, intensity * 0.75);
        this.vaporCone.scale.set(1.0 + Math.random() * 0.08, 1.0 + Math.random() * 0.08, 1.0);
      } else {
        this.vaporCone.material.opacity = 0;
      }
    }

    // Supersonic Afterburner shock diamond plumes & dynamic light
    if (this.afterburnerFlames.length > 0) {
      for (const { flame, diamond, flameMat, diamondMat } of this.afterburnerFlames) {
        if (this.isAfterburner) {
          const flicker = 0.85 + Math.random() * 0.3;
          flameMat.opacity = 0.92;
          diamondMat.opacity = 0.88;
          flame.scale.set(1.0, 1.0, flicker * 1.4);
          diamond.scale.set(0.8, 0.8, 2.2 * flicker);
        } else if (this.throttle > 0.35) {
          flameMat.opacity = this.throttle * 0.35;
          diamondMat.opacity = 0.0;
          flame.scale.set(0.6, 0.6, 0.5);
        } else {
          flameMat.opacity = 0.0;
          diamondMat.opacity = 0.0;
        }
      }
    }
    if (this.afterburnerLight) {
      this.afterburnerLight.intensity = this.isAfterburner ? 4.2 : (this.throttle > 0.4 ? 0.8 : 0.0);
    }

    // Cockpit Voice Warnings
    if (this.isPilotInside && this.audioEngine) {
      if (this.gForce > 4.5) {
        this.audioEngine.announceVoice('WARNING: OVER G');
      }
      if (!this.isGrounded && -this.velocity.y > 10.0 && altAboveGround < 32.0) {
        this.audioEngine.announceVoice('PULL UP, TERRAIN');
      }
    }

    if (this.group.position.y <= minAltitude) {
      const sinkRate = -this.velocity.y;
      this.group.position.y = minAltitude;
      this.velocity.y = 0;

      if (!this.isGrounded) {
        // Touchdown event!
        this.isGrounded = true;
        this.groundPitch = 0;
        if (sinkRate > 1.8 && this.audioEngine) {
          this.audioEngine.playTouchdownScreech();
        }
      }
    } else {
      // In air
      if (this.group.position.y > minAltitude + 0.25) {
        this.isGrounded = false;
      }
    }

    // Update Pilot position while seated
    if (this.isPilotInside && this.pilot) {
      this.pilot.position.copy(this.group.position);
    }

    // Audio engine update with afterburner & wind speed
    if (this.isPilotInside && this.audioEngine) {
      this.audioEngine.updatePlaneEngine(this.throttle, this.speed, this.isAfterburner);
    }

    // Wingtip Vapor Trails / Contrails during high G or high speed
    if (!this.isGrounded && (this.speed > 30 || Math.abs(this.rollRate) > 1.1 || Math.abs(this.gForce - 1.0) > 0.8)) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.045 && this.particleEngine) {
        this.trailTimer = 0;
        const leftTip = this.group.position.clone().add(right.clone().multiplyScalar(-6.7));
        const rightTip = this.group.position.clone().add(right.clone().multiplyScalar(6.7));
        this.particleEngine.spawnDustCloud(leftTip, 0.35);
        this.particleEngine.spawnDustCloud(rightTip, 0.35);
      }
    }

    // Update active guided missiles
    this.updateMissiles(dt);
  }

  fireMissile(targetDrone = null) {
    if (this.missileAmmo <= 0 || this.missileCooldown > 0) return false;
    this.missileAmmo--;
    this.missileCooldown = 1.2;

    // Hide one under-wing missile mesh
    if (this.missileMeshes[this.missileAmmo]) {
      this.missileMeshes[this.missileAmmo].visible = false;
    }

    const forward = this.getForwardVector();
    const right = this.getRightVector();
    const pylonOffset = (this.missileAmmo % 2 === 0 ? -4.4 : 4.4);
    const spawnPos = this.group.position.clone()
      .add(right.clone().multiplyScalar(pylonOffset))
      .add(forward.clone().multiplyScalar(1.2))
      .add(new THREE.Vector3(0, -0.3, 0));

    const missileMesh = new THREE.Group();
    const mBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 })
    );
    mBody.rotateX(Math.PI / 2);
    missileMesh.add(mBody);

    const mNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    mNose.rotateX(-Math.PI / 2);
    mNose.position.z = 1.0;
    missileMesh.add(mNose);

    missileMesh.position.copy(spawnPos);
    missileMesh.quaternion.copy(this.group.quaternion);
    this.scene.add(missileMesh);

    const missile = {
      mesh: missileMesh,
      pos: spawnPos,
      velocity: forward.clone().multiplyScalar(this.speed + 22.0),
      target: targetDrone,
      life: 6.0,
      speed: this.speed + 22.0,
      trailTimer: 0
    };
    this.activeMissiles.push(missile);

    if (this.audioEngine) {
      this.audioEngine.playMissileLaunch();
      this.audioEngine.announceVoice('MISSILE AWAY');
    }
    if (this.cameraController) {
      this.cameraController.addShake(0.18);
    }
    return true;
  }

  updateMissiles(dt) {
    this.missileCooldown = Math.max(0, this.missileCooldown - dt);

    for (let i = this.activeMissiles.length - 1; i >= 0; i--) {
      const m = this.activeMissiles[i];
      m.life -= dt;
      m.speed = Math.min(95.0, m.speed + 45.0 * dt);

      let fwd = m.velocity.clone().normalize();

      // Proportional Navigation Homing toward target drone
      if (m.target && !m.target.isDead) {
        const toTarget = m.target.group.position.clone().sub(m.mesh.position).normalize();
        fwd.lerp(toTarget, Math.min(1.0, dt * 6.5)).normalize();
      }

      m.velocity.copy(fwd.clone().multiplyScalar(m.speed));
      m.mesh.position.addScaledVector(m.velocity, dt);
      m.mesh.lookAt(m.mesh.position.clone().add(fwd.clone().multiplyScalar(10)));

      // Rocket booster smoke trail
      m.trailTimer += dt;
      if (m.trailTimer > 0.035 && this.particleEngine) {
        m.trailTimer = 0;
        this.particleEngine.spawnDustCloud(m.mesh.position, 0.35);
        this.particleEngine.spawnSparks(m.mesh.position, 2, 0xff8800, 3.0);
      }

      // Hit target drone check
      let hit = false;
      if (m.target && !m.target.isDead) {
        const dist = m.mesh.position.distanceTo(m.target.group.position);
        if (dist < 4.2) {
          hit = true;
          m.target.takeDamage(120);
        }
      }

      // Ground impact check
      const groundY = this.terrain.getHeightAt(m.mesh.position.x, m.mesh.position.z);
      if (m.mesh.position.y <= groundY + 0.5) hit = true;

      if (hit || m.life <= 0) {
        if (this.particleEngine) {
          this.particleEngine.spawnExplosion(m.mesh.position, 2.0);
          this.particleEngine.spawnSparks(m.mesh.position, 28, 0xff7700, 16.0);
        }
        if (this.audioEngine) {
          this.audioEngine.playHitSound();
        }
        this.scene.remove(m.mesh);
        this.activeMissiles.splice(i, 1);
      }
    }
  }
}
