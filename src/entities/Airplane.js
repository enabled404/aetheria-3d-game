import * as THREE from 'three';

export class Airplane {
  constructor(scene, terrain, position = new THREE.Vector3(-75, 4.22, -30), audioEngine = null, particleEngine = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.audioEngine = audioEngine;
    this.particleEngine = particleEngine;

    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Physics state
    this.velocity = new THREE.Vector3();
    this.speed = 0; // forward airspeed (m/s)
    this.throttle = 0; // 0.0 to 1.0
    this.targetThrottle = 0;
    this.rpm = 0.2; // 0.2 idle to 1.0 max

    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;

    this.isGrounded = true;
    this.isPilotInside = false;
    this.pilot = null;

    this.brakes = false;
    this.isStalled = false;
    this.stallTimer = 0;

    // Aircraft physical specs
    this.gearHeight = 1.35; // height of fuselage center above ground on wheels
    this.minTakeoffSpeed = 14.5; // m/s (~52 km/h)
    this.maxSpeed = 58.0; // m/s (~210 km/h)
    this.stallSpeed = 12.0; // m/s
    this.thrustForce = 38.0;

    // Control surfaces & moving parts references
    this.propellers = [];
    this.leftAileron = null;
    this.rightAileron = null;
    this.elevator = null;
    this.rudder = null;
    this.noseGearWheel = null;
    this.mainGearWheels = [];
    this.strobeLights = [];
    this.strobeTimer = 0;
    this.trailTimer = 0;
    this.weaponCooldown = 0;

    this.buildModel();
    this.scene.add(this.group);

    // Initial orientation facing down runway (North, towards Z = -100)
    this.group.rotation.y = Math.PI;
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

      // Afterburner Exhaust Glow at rear of engine
      const exhaustGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 10);
      exhaustGeom.rotateX(Math.PI / 2);
      const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
      exhaust.position.set(engX, -0.1, -0.65);
      fuselageGroup.add(exhaust);
    }

    // 5. Tricycle Landing Gear (Nose Wheel + Main Gear)
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });
    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12);
    wheelGeom.rotateZ(Math.PI / 2);

    // Nose Gear (Steerable)
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

    // Main Gear (Left & Right)
    for (const mgX of [-2.4, 2.4]) {
      const mainGearGroup = new THREE.Group();
      mainGearGroup.position.set(mgX, -0.15, 0.3);

      const mainStrutGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8);
      const mainStrut = new THREE.Mesh(mainStrutGeom, strutMat);
      mainStrut.position.y = -0.68;
      mainGearGroup.add(mainStrut);

      const mainWheel = new THREE.Mesh(wheelGeom, tireMat);
      mainWheel.position.y = -1.35;
      mainWheel.castShadow = true;
      mainGearGroup.add(mainWheel);
      this.mainGearWheels.push(mainWheel);

      fuselageGroup.add(mainGearGroup);
    }

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

    this.group.add(fuselageGroup);
  }

  mount(player) {
    this.isPilotInside = true;
    this.pilot = player;
    player.model.group.visible = false;
    this.targetThrottle = 0.25; // idle throttle upon starting engines
    if (this.audioEngine) {
      this.audioEngine.startPlaneEngine(this.throttle);
    }
  }

  dismount() {
    if (!this.pilot) return;
    this.isPilotInside = false;
    const exitPos = this.group.position.clone().add(this.getRightVector().multiplyScalar(3.2));
    exitPos.y = this.terrain.getHeightAt(exitPos.x, exitPos.z) + 0.2;
    this.pilot.position.copy(exitPos);
    this.pilot.velocity.set(0, 0, 0);
    this.pilot.model.group.visible = true;
    this.pilot = null;

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
    this.weaponCooldown = 0.14; // rapid fire dogfight plasma

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

    const boltSpeed = 120.0;
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
      if (inputManager.isKeyDown('ShiftLeft')) {
        this.targetThrottle = Math.min(1.0, this.targetThrottle + dt * 0.45);
      }
      if (inputManager.isKeyDown('ControlLeft')) {
        this.targetThrottle = Math.max(0.0, this.targetThrottle - dt * 0.55);
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
    }

    if (this.weaponCooldown > 0) {
      this.weaponCooldown = Math.max(0, this.weaponCooldown - dt);
    }

    // Engine spooling inertia
    this.throttle = THREE.MathUtils.lerp(this.throttle, this.targetThrottle, Math.min(1.0, dt * 2.2));
    this.rpm = THREE.MathUtils.lerp(this.rpm, 0.2 + this.throttle * 0.8, Math.min(1.0, dt * 3.0));

    // Spin Propellers
    const propSpeed = this.rpm * 48.0;
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

    // 2. Flight Aerodynamics & Attitude Control
    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    if (this.isPilotInside && inputManager) {
      // Pitch: S pulls back (Nose UP), W pushes forward (Nose DOWN)
      if (inputManager.isKeyDown('KeyS') || inputManager.isKeyDown('ArrowDown')) pitchInput -= 1.0;
      if (inputManager.isKeyDown('KeyW') || inputManager.isKeyDown('ArrowUp')) pitchInput += 1.0;

      // Roll: A banks Left, D banks Right
      if (inputManager.isKeyDown('KeyA') || inputManager.isKeyDown('ArrowLeft')) rollInput -= 1.0;
      if (inputManager.isKeyDown('KeyD') || inputManager.isKeyDown('ArrowRight')) rollInput += 1.0;

      // Yaw: Q rudders Left, E rudders Right
      if (inputManager.isKeyDown('KeyQ')) yawInput -= 1.0;
      if (inputManager.isKeyDown('KeyE')) yawInput += 1.0;
    }

    // Animate control surfaces
    if (this.elevator) this.elevator.rotation.x = -pitchInput * 0.45;
    if (this.rudder) this.rudder.rotation.y = -yawInput * 0.45;
    if (this.leftAileron) this.leftAileron.rotation.x = rollInput * 0.4;
    if (this.rightAileron) this.rightAileron.rotation.x = -rollInput * 0.4;
    if (this.noseGearGroup) this.noseGearGroup.rotation.y = -yawInput * 0.5;

    // Airspeed calculation
    this.speed = Math.max(0, this.velocity.dot(forward));

    // Aerodynamic control authority scales with dynamic pressure
    const dynamicPressure = Math.min(1.2, this.speed / 24.0);

    if (!this.isGrounded) {
      // In-flight angular rotation
      const targetPitchRate = pitchInput * 1.45 * dynamicPressure;
      const targetRollRate = rollInput * 2.4 * dynamicPressure;
      const targetYawRate = yawInput * 0.65 * dynamicPressure;

      this.pitchRate = THREE.MathUtils.lerp(this.pitchRate, targetPitchRate, dt * 5.0);
      this.rollRate = THREE.MathUtils.lerp(this.rollRate, targetRollRate, dt * 6.0);
      this.yawRate = THREE.MathUtils.lerp(this.yawRate, targetYawRate, dt * 4.0);

      // Apply rotations in local aerodynamic axes
      this.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), this.pitchRate * dt);
      this.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), -this.rollRate * dt);
      this.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), -this.yawRate * dt);

      // Natural aerodynamic roll self-leveling at low bank angles
      if (Math.abs(rollInput) < 0.1) {
        const bankAngle = Math.asin(Math.max(-1, Math.min(1, right.y)));
        this.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), bankAngle * dt * 0.75);
      }
    } else {
      // On ground taxi steering (nosewheel turns aircraft)
      const taxiTurnSpeed = (yawInput || rollInput) * (this.speed / 8.0) * 1.6;
      this.group.rotation.y -= taxiTurnSpeed * dt;

      // Keep wings level with ground on wheels
      this.pitchRate = 0;
      this.rollRate = 0;
    }

    // 3. Aerodynamic Forces (Thrust, Lift, Drag, Gravity)
    // Thrust accelerates along forward vector
    const thrust = forward.clone().multiplyScalar(this.throttle * this.thrustForce);
    this.velocity.addScaledVector(thrust, dt);

    // Aerodynamic Lift: generated perpendicular to forward vector
    // Lift factor drops sharply if airspeed is below stall speed
    let liftCoeff = 1.0;
    if (this.speed < this.stallSpeed) {
      liftCoeff = Math.max(0, this.speed / this.stallSpeed);
      this.isStalled = (!this.isGrounded && this.speed < this.stallSpeed && this.throttle < 0.6);
    } else {
      this.isStalled = false;
    }

    if (this.isStalled) {
      this.stallTimer += dt;
      if (this.audioEngine && (this.stallTimer % 0.6) < 0.25) {
        this.audioEngine.playStallAlarm();
      }
      // Stall nose-drop tendency
      this.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), dt * 0.85);
    }

    const liftForce = up.clone().multiplyScalar(liftCoeff * Math.min(32.0, (this.speed * this.speed) * 0.055));
    if (!this.isGrounded) {
      this.velocity.addScaledVector(liftForce, dt);
    }

    // Aerodynamic Drag (proportional to velocity squared)
    const dragCoeff = 0.012 + (this.brakes ? 0.035 : 0.0);
    const drag = this.velocity.clone().multiplyScalar(-dragCoeff * this.velocity.length());
    this.velocity.addScaledVector(drag, dt);

    // Gravity
    const gravity = new THREE.Vector3(0, -9.81, 0);
    this.velocity.addScaledVector(gravity, dt);

    // Ground rolling friction & wheel brakes
    if (this.isGrounded) {
      const brakeForce = this.brakes ? 16.0 : 2.5;
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

    // Island Terrain Height Clamp
    const groundY = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    const minAltitude = groundY + this.gearHeight;

    if (this.group.position.y <= minAltitude) {
      const sinkRate = -this.velocity.y;
      this.group.position.y = minAltitude;
      this.velocity.y = 0;

      if (!this.isGrounded) {
        // Touchdown event!
        this.isGrounded = true;
        if (sinkRate > 1.8 && this.audioEngine) {
          this.audioEngine.playTouchdownScreech();
        }
      }
    } else {
      // In air
      if (this.group.position.y > minAltitude + 0.3) {
        this.isGrounded = false;
      }
    }

    // Update Pilot position while seated
    if (this.isPilotInside && this.pilot) {
      this.pilot.position.copy(this.group.position);
    }

    // Audio engine update
    if (this.isPilotInside && this.audioEngine) {
      this.audioEngine.updatePlaneEngine(this.throttle, this.speed);
    }

    // Wingtip Vapor Trails / Contrails during high G or high speed
    if (!this.isGrounded && (this.speed > 32 || Math.abs(this.rollRate) > 1.2 || this.pitchRate > 0.8)) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.05 && this.particleEngine) {
        this.trailTimer = 0;
        const leftTip = this.group.position.clone().add(right.clone().multiplyScalar(-6.7));
        const rightTip = this.group.position.clone().add(right.clone().multiplyScalar(6.7));
        this.particleEngine.spawnDustCloud(leftTip, 0.4);
        this.particleEngine.spawnDustCloud(rightTip, 0.4);
      }
    }
  }
}
