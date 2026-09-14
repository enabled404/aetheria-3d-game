import * as THREE from 'three';

export class Airport {
  constructor(scene, terrain, collisionSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.collisionSystem = collisionSystem;

    this.center = new THREE.Vector3(-110, 4.22, -30);
    this.runwayLength = 180;
    this.runwayWidth = 22;
    this.group = new THREE.Group();

    this.animatedLights = [];
    this.beaconGroup = null;
    this.windsockMesh = null;

    this.buildRunway();
    this.buildMarkings();
    this.buildLighting();
    this.buildApronAndTaxiways();
    this.buildHangar();
    this.buildControlTower();
    this.buildWindsock();
    this.buildAirfieldSignage();

    this.scene.add(this.group);
  }

  buildRunway() {
    // Main asphalt runway strip
    const runwayGeom = new THREE.PlaneGeometry(this.runwayWidth, this.runwayLength);
    runwayGeom.rotateX(-Math.PI / 2);

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e22,
      roughness: 0.94,
      metalness: 0.08
    });

    const runwayMesh = new THREE.Mesh(runwayGeom, asphaltMat);
    runwayMesh.position.set(this.center.x, this.center.y + 0.04, this.center.z);
    runwayMesh.receiveShadow = true;
    this.group.add(runwayMesh);

    // Concrete shoulders on left and right
    const shoulderWidth = 4.0;
    const shoulderGeom = new THREE.PlaneGeometry(shoulderWidth, this.runwayLength);
    shoulderGeom.rotateX(-Math.PI / 2);

    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x3a3c42,
      roughness: 0.88
    });

    const leftShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    leftShoulder.position.set(this.center.x - this.runwayWidth / 2 - shoulderWidth / 2, this.center.y + 0.02, this.center.z);
    leftShoulder.receiveShadow = true;
    this.group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    rightShoulder.position.set(this.center.x + this.runwayWidth / 2 + shoulderWidth / 2, this.center.y + 0.02, this.center.z);
    rightShoulder.receiveShadow = true;
    this.group.add(rightShoulder);

    // Blast pads / overruns at both ends (chevron pavement)
    const blastPadGeom = new THREE.PlaneGeometry(this.runwayWidth + shoulderWidth * 2, 12);
    blastPadGeom.rotateX(-Math.PI / 2);
    const blastPadMat = new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.9 });

    const northPad = new THREE.Mesh(blastPadGeom, blastPadMat);
    northPad.position.set(this.center.x, this.center.y + 0.02, this.center.z - this.runwayLength / 2 - 6);
    this.group.add(northPad);

    const southPad = new THREE.Mesh(blastPadGeom, blastPadMat);
    southPad.position.set(this.center.x, this.center.y + 0.02, this.center.z + this.runwayLength / 2 + 6);
    this.group.add(southPad);
  }

  buildMarkings() {
    const whiteMarkingMat = new THREE.MeshBasicMaterial({ color: 0xf5f7fa });
    const yellowMarkingMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    const markY = this.center.y + 0.06;

    // 1. Centerline dashed stripes down entire runway
    const dashLength = 6.0;
    const dashGap = 5.0;
    const dashWidth = 0.75;
    const numDashes = Math.floor((this.runwayLength - 30) / (dashLength + dashGap));
    const startZ = this.center.z - (numDashes * (dashLength + dashGap)) / 2;

    const dashGeom = new THREE.PlaneGeometry(dashWidth, dashLength);
    dashGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < numDashes; i++) {
      const z = startZ + i * (dashLength + dashGap);
      const dash = new THREE.Mesh(dashGeom, whiteMarkingMat);
      dash.position.set(this.center.x, markY, z);
      this.group.add(dash);
    }

    // 2. Threshold "Piano Keys" (8 stripes at each runway end)
    const keyWidth = 1.0;
    const keyLength = 9.0;
    const keyGeom = new THREE.PlaneGeometry(keyWidth, keyLength);
    keyGeom.rotateX(-Math.PI / 2);

    const keySpacing = 2.2;
    const numKeys = 8;
    const keyStartX = this.center.x - ((numKeys - 1) * keySpacing) / 2;

    // North Threshold (Runway 18)
    const northZ = this.center.z - this.runwayLength / 2 + 8.0;
    for (let k = 0; k < numKeys; k++) {
      const key = new THREE.Mesh(keyGeom, whiteMarkingMat);
      key.position.set(keyStartX + k * keySpacing, markY, northZ);
      this.group.add(key);
    }

    // South Threshold (Runway 36)
    const southZ = this.center.z + this.runwayLength / 2 - 8.0;
    for (let k = 0; k < numKeys; k++) {
      const key = new THREE.Mesh(keyGeom, whiteMarkingMat);
      key.position.set(keyStartX + k * keySpacing, markY, southZ);
      this.group.add(key);
    }

    // 3. Touchdown Zone & Aiming Point Bars
    const aimGeom = new THREE.PlaneGeometry(2.4, 12.0);
    aimGeom.rotateX(-Math.PI / 2);

    const aimOffsets = [-4.5, 4.5];
    for (const offX of aimOffsets) {
      // North aiming point
      const aimN = new THREE.Mesh(aimGeom, whiteMarkingMat);
      aimN.position.set(this.center.x + offX, markY, northZ + 28);
      this.group.add(aimN);

      // South aiming point
      const aimS = new THREE.Mesh(aimGeom, whiteMarkingMat);
      aimS.position.set(this.center.x + offX, markY, southZ - 28);
      this.group.add(aimS);
    }

    // 4. Runway Side Border Lines (Solid White)
    const borderGeom = new THREE.PlaneGeometry(0.5, this.runwayLength - 16);
    borderGeom.rotateX(-Math.PI / 2);

    const leftBorder = new THREE.Mesh(borderGeom, whiteMarkingMat);
    leftBorder.position.set(this.center.x - this.runwayWidth / 2 + 0.6, markY, this.center.z);
    this.group.add(leftBorder);

    const rightBorder = new THREE.Mesh(borderGeom, whiteMarkingMat);
    rightBorder.position.set(this.center.x + this.runwayWidth / 2 - 0.6, markY, this.center.z);
    this.group.add(rightBorder);
  }

  buildLighting() {
    const lightFixturesGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.35, 6);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x444850, metalness: 0.8 });

    const greenEmissive = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const whiteEmissive = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redEmissive = new THREE.MeshBasicMaterial({ color: 0xff2233 });
    const blueEmissive = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    const lensGeom = new THREE.SphereGeometry(0.12, 8, 8);

    const addLightFixture = (x, z, mat, colorHex = null) => {
      const fix = new THREE.Mesh(lightFixturesGeom, fixtureMat);
      fix.position.set(x, this.center.y + 0.18, z);
      this.group.add(fix);

      const bulb = new THREE.Mesh(lensGeom, mat);
      bulb.position.set(x, this.center.y + 0.38, z);
      this.group.add(bulb);

      if (colorHex) {
        const pLight = new THREE.PointLight(colorHex, 0.9, 8.0, 1.8);
        pLight.position.set(x, this.center.y + 0.45, z);
        this.group.add(pLight);
        this.animatedLights.push(pLight);
      }
    };

    // 1. Green Threshold Lights at North approach
    const northZ = this.center.z - this.runwayLength / 2;
    for (let i = -10; i <= 10; i += 2.5) {
      addLightFixture(this.center.x + i, northZ, greenEmissive, (Math.abs(i) < 6) ? 0x00ff66 : null);
    }

    // 2. Green Threshold Lights at South approach
    const southZ = this.center.z + this.runwayLength / 2;
    for (let i = -10; i <= 10; i += 2.5) {
      addLightFixture(this.center.x + i, southZ, greenEmissive, (Math.abs(i) < 6) ? 0x00ff66 : null);
    }

    // 3. White Runway Edge Lights along entire length (spaced every 15m)
    const edgeOffset = this.runwayWidth / 2 + 0.5;
    for (let z = northZ + 8; z <= southZ - 8; z += 16) {
      addLightFixture(this.center.x - edgeOffset, z, whiteEmissive, 0xffffff);
      addLightFixture(this.center.x + edgeOffset, z, whiteEmissive, 0xffffff);
    }

    // 4. Red Runway End Indicator Lights (REIL)
    addLightFixture(this.center.x - edgeOffset - 2, northZ - 2, redEmissive, 0xff2233);
    addLightFixture(this.center.x + edgeOffset + 2, northZ - 2, redEmissive, 0xff2233);
    addLightFixture(this.center.x - edgeOffset - 2, southZ + 2, redEmissive, 0xff2233);
    addLightFixture(this.center.x + edgeOffset + 2, southZ + 2, redEmissive, 0xff2233);

    // 5. PAPI (Precision Approach Path Indicator) 4-light array
    const papiZ = northZ + 35;
    const papiX = this.center.x - edgeOffset - 4.5;
    for (let p = 0; p < 4; p++) {
      const pMat = p < 2 ? redEmissive : whiteEmissive;
      const pColor = p < 2 ? 0xff2233 : 0xffffff;
      addLightFixture(papiX - p * 1.5, papiZ, pMat, pColor);
    }
  }

  buildApronAndTaxiways() {
    // Taxiway connecting runway to hangar apron
    const taxiWidth = 14;
    const taxiLength = 32;
    const taxiGeom = new THREE.PlaneGeometry(taxiLength, taxiWidth);
    taxiGeom.rotateX(-Math.PI / 2);

    const taxiMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.92
    });

    const taxiMesh = new THREE.Mesh(taxiGeom, taxiMat);
    taxiMesh.position.set(this.center.x + this.runwayWidth / 2 + taxiLength / 2, this.center.y + 0.03, this.center.z);
    taxiMesh.receiveShadow = true;
    this.group.add(taxiMesh);

    // Main Parking Apron (Spacious paved area in front of hangar)
    const apronWidth = 34;
    const apronLength = 48;
    const apronGeom = new THREE.PlaneGeometry(apronWidth, apronLength);
    apronGeom.rotateX(-Math.PI / 2);

    const apronMesh = new THREE.Mesh(apronGeom, taxiMat);
    apronMesh.position.set(this.center.x + 48, this.center.y + 0.03, this.center.z);
    apronMesh.receiveShadow = true;
    this.group.add(apronMesh);

    // Taxiway yellow centerline guide
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const guideGeom = new THREE.PlaneGeometry(taxiLength + 14, 0.4);
    guideGeom.rotateX(-Math.PI / 2);
    const guideMesh = new THREE.Mesh(guideGeom, yellowMat);
    guideMesh.position.set(this.center.x + this.runwayWidth / 2 + taxiLength / 2 - 2, this.center.y + 0.06, this.center.z);
    this.group.add(guideMesh);
  }

  buildHangar() {
    const hangarX = this.center.x + 58;
    const hangarZ = this.center.z;
    const hangarY = this.center.y;

    const hangarWidth = 26;
    const hangarDepth = 22;
    const hangarHeight = 12;

    const hangarGroup = new THREE.Group();
    hangarGroup.position.set(hangarX, hangarY, hangarZ);

    // Concrete foundation floor
    const floorGeom = new THREE.BoxGeometry(hangarWidth + 4, 0.4, hangarDepth + 4);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2c2e33, roughness: 0.85 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = 0.2;
    floor.receiveShadow = true;
    hangarGroup.add(floor);

    // Arched barrel vault roof
    const archRadius = hangarWidth / 2;
    const archGeom = new THREE.CylinderGeometry(archRadius, archRadius, hangarDepth, 24, 1, false, 0, Math.PI);
    archGeom.rotateZ(Math.PI / 2);
    archGeom.rotateY(Math.PI / 2);

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x363942,
      metalness: 0.65,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const roof = new THREE.Mesh(archGeom, roofMat);
    roof.position.set(0, archRadius, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    hangarGroup.add(roof);

    // Rear wall
    const rearWallGeom = new THREE.PlaneGeometry(hangarWidth, archRadius);
    const rearWallMat = new THREE.MeshStandardMaterial({ color: 0x282a30, metalness: 0.5, side: THREE.DoubleSide });
    const rearWall = new THREE.Mesh(rearWallGeom, rearWallMat);
    rearWall.position.set(0, archRadius / 2, hangarDepth / 2);
    rearWall.castShadow = true;
    hangarGroup.add(rearWall);

    // Glowing cyan structural arch accents
    const archRingGeom = new THREE.TorusGeometry(archRadius + 0.1, 0.25, 8, 24, Math.PI);
    archRingGeom.rotateY(Math.PI / 2);
    const archRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    const frontRing = new THREE.Mesh(archRingGeom, archRingMat);
    frontRing.position.set(0, 0, -hangarDepth / 2);
    hangarGroup.add(frontRing);

    const midRing = new THREE.Mesh(archRingGeom, archRingMat);
    midRing.position.set(0, 0, 0);
    hangarGroup.add(midRing);

    // Interior Floodlight
    const floodLight = new THREE.SpotLight(0xafe4ff, 3.5, 32, Math.PI / 2.8, 0.4, 1.2);
    floodLight.position.set(0, archRadius + 1, 0);
    floodLight.target.position.set(0, 0, 0);
    hangarGroup.add(floodLight);
    hangarGroup.add(floodLight.target);

    // Workbenches & Fuel Drums inside hangar
    const drumGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 10);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0xb53526, roughness: 0.6, metalness: 0.4 });
    const drum1 = new THREE.Mesh(drumGeom, drumMat);
    drum1.position.set(8, 0.6, 6);
    hangarGroup.add(drum1);

    const drum2 = new THREE.Mesh(drumGeom, drumMat);
    drum2.position.set(9.2, 0.6, 5.5);
    hangarGroup.add(drum2);

    if (this.collisionSystem) {
      this.collisionSystem.addCollider(hangarX, hangarZ + hangarDepth / 2, 4.0, 10.0, 'structure');
      this.collisionSystem.addCollider(hangarX - hangarWidth / 2, hangarZ, 3.0, 10.0, 'structure');
      this.collisionSystem.addCollider(hangarX + hangarWidth / 2, hangarZ, 3.0, 10.0, 'structure');
    }

    this.group.add(hangarGroup);
  }

  buildControlTower() {
    const towerX = this.center.x + 36;
    const towerZ = this.center.z - 36;
    const towerY = this.center.y;

    const towerGroup = new THREE.Group();
    towerGroup.position.set(towerX, towerY, towerZ);

    // Tower base shaft
    const shaftHeight = 18.0;
    const shaftGeom = new THREE.CylinderGeometry(2.4, 3.2, shaftHeight, 6);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x4a4d55,
      roughness: 0.85,
      metalness: 0.2
    });
    const shaft = new THREE.Mesh(shaftGeom, concreteMat);
    shaft.position.y = shaftHeight / 2;
    shaft.castShadow = true;
    towerGroup.add(shaft);

    // Cantilevered Observation Cab Deck
    const cabDeckGeom = new THREE.CylinderGeometry(5.0, 3.0, 2.0, 8);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x22242a, metalness: 0.7 });
    const deck = new THREE.Mesh(cabDeckGeom, deckMat);
    deck.position.y = shaftHeight + 1.0;
    towerGroup.add(deck);

    // Glass Observation Cab
    const glassGeom = new THREE.CylinderGeometry(4.8, 4.8, 3.2, 8);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x003344,
      emissiveIntensity: 0.6
    });
    const cab = new THREE.Mesh(glassGeom, glassMat);
    cab.position.y = shaftHeight + 3.6;
    towerGroup.add(cab);

    // Roof & Radome
    const roofGeom = new THREE.ConeGeometry(5.2, 1.4, 8);
    const roof = new THREE.Mesh(roofGeom, deckMat);
    roof.position.y = shaftHeight + 5.8;
    towerGroup.add(roof);

    const radomeGeom = new THREE.SphereGeometry(1.2, 12, 8);
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const radome = new THREE.Mesh(radomeGeom, radomeMat);
    radome.position.y = shaftHeight + 6.8;
    towerGroup.add(radome);

    // Rotating Aerodrome Beacon Light (Standard Dual Beam: White & Green)
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.position.set(0, shaftHeight + 7.5, 0);

    const whiteBeam = new THREE.SpotLight(0xffffff, 4.0, 90, Math.PI / 6, 0.35, 1.1);
    whiteBeam.position.set(0, 0, 0);
    whiteBeam.target.position.set(0, -5, 50);
    this.beaconGroup.add(whiteBeam);
    this.beaconGroup.add(whiteBeam.target);

    const greenBeam = new THREE.SpotLight(0x00ff66, 4.0, 90, Math.PI / 6, 0.35, 1.1);
    greenBeam.position.set(0, 0, 0);
    greenBeam.target.position.set(0, -5, -50);
    this.beaconGroup.add(greenBeam);
    this.beaconGroup.add(greenBeam.target);

    const beaconBulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.beaconGroup.add(beaconBulb);

    towerGroup.add(this.beaconGroup);

    if (this.collisionSystem) {
      this.collisionSystem.addCollider(towerX, towerZ, 3.2, shaftHeight, 'tower');
    }

    this.group.add(towerGroup);
  }

  buildWindsock() {
    const sockX = this.center.x + this.runwayWidth / 2 + 5;
    const sockZ = this.center.z - 20;
    const sockY = this.center.y;

    const sockGroup = new THREE.Group();
    sockGroup.position.set(sockX, sockY, sockZ);

    // Mast
    const mastGeom = new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.y = 2.75;
    sockGroup.add(mast);

    // Swivel frame
    const swivelGeom = new THREE.TorusGeometry(0.45, 0.05, 8, 12);
    const swivelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const swivel = new THREE.Mesh(swivelGeom, swivelMat);
    swivel.position.y = 5.4;
    sockGroup.add(swivel);

    // Fabric wind cone
    const sockGeom = new THREE.ConeGeometry(0.45, 2.2, 8, 1, true);
    sockGeom.rotateX(Math.PI / 2);
    const sockMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    this.windsockMesh = new THREE.Mesh(sockGeom, sockMat);
    this.windsockMesh.position.set(0, 5.4, 1.1);
    sockGroup.add(this.windsockMesh);

    this.group.add(sockGroup);
  }

  buildAirfieldSignage() {
    // Illuminated Runway 36-18 Identifier Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(this.center.x + this.runwayWidth / 2 + 3.0, this.center.y + 0.6, this.center.z + 4);

    const signBoardGeom = new THREE.BoxGeometry(2.4, 0.8, 0.15);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signGroup.add(signBoard);

    // Glowing text plate
    const plateGeom = new THREE.PlaneGeometry(2.2, 0.65);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(0, 0, 256, 80);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('36 - 18', 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    const plateMat = new THREE.MeshBasicMaterial({ map: tex });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.z = 0.08;
    signGroup.add(plate);

    this.group.add(signGroup);
  }

  update(dt) {
    // Rotate aerodrome beacon
    if (this.beaconGroup) {
      this.beaconGroup.rotation.y += dt * 1.8;
    }

    // Dynamic windsock swaying
    if (this.windsockMesh) {
      const time = Date.now() * 0.002;
      this.windsockMesh.rotation.z = Math.sin(time) * 0.15;
      this.windsockMesh.rotation.y = Math.cos(time * 0.5) * 0.25;
    }
  }
}
