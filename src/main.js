import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Renderer } from './core/Renderer.js';
import { CameraController } from './core/CameraController.js';
import { InputManager } from './core/InputManager.js';
import { AssetManager } from './core/AssetManager.js';
import { ParticleEngine } from './core/ParticleEngine.js';
import { SaveSystem } from './core/SaveSystem.js';

import { Terrain } from './world/Terrain.js';
import { Ocean } from './world/Ocean.js';
import { SkyAtmosphere } from './world/SkyAtmosphere.js';
import { FoliageSystem } from './world/FoliageSystem.js';

import { Player } from './entities/Player.js';
import { Lyra } from './entities/NPCs/Lyra.js';
import { Thorne } from './entities/NPCs/Thorne.js';
import { Kaelen } from './entities/NPCs/Kaelen.js';
import { BossTitan } from './entities/BossTitan.js';
import { Enemy } from './entities/Enemy.js';
import { Deer } from './entities/Wildlife.js';

import { CombatManager } from './combat/CombatManager.js';
import { BuildGrid } from './building/BuildGrid.js';
import { Deployables } from './building/Deployables.js';
import { AudioEngine } from './audio/AudioEngine.js';

import { HUD } from './ui/HUD.js';
import { DialogueBox } from './ui/DialogueBox.js';
import { DialogueSystem } from './dialogue/DialogueSystem.js';
import { TopoMap } from './ui/TopoMap.js';
import { HolographicCompass } from './ui/HolographicCompass.js';
import { CraftingUI } from './ui/CraftingUI.js';

// 1. Initialize Core Engine & Systems
const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const cameraController = new CameraController();
renderer.setCamera(cameraController.camera);

const inputManager = new InputManager(canvas);
const assetManager = new AssetManager();
const audioEngine = new AudioEngine();
const particleEngine = new ParticleEngine(renderer.scene);
const saveSystem = new SaveSystem();

// 2. Initialize World
const terrain = new Terrain(renderer.scene);
const ocean = new Ocean(renderer.scene);
const sky = new SkyAtmosphere(renderer.scene);
const foliage = new FoliageSystem(renderer.scene, terrain);

// 3. Initialize Player
const player = new Player(renderer.scene, assetManager);
player.position.set(0, terrain.getHeightAt(0, 60), 60);

// 4. Initialize NPCs
const npcs = [
  new Lyra(renderer.scene, assetManager, new THREE.Vector3(18, terrain.getHeightAt(18, 48), 48)),
  new Thorne(renderer.scene, assetManager, new THREE.Vector3(-32, terrain.getHeightAt(-32, 65), 65)),
  new Kaelen(renderer.scene, assetManager, new THREE.Vector3(55, terrain.getHeightAt(55, -25), -25))
];

// 5. Initialize Boss & Hostiles
const bossTitan = new BossTitan(renderer.scene, terrain);
const enemies = [
  new Enemy(renderer.scene, terrain, 'grunt', new THREE.Vector3(35, terrain.getHeightAt(35, 90), 90)),
  new Enemy(renderer.scene, terrain, 'brute', new THREE.Vector3(-50, terrain.getHeightAt(-50, 110), 110)),
  new Enemy(renderer.scene, terrain, 'stalker', new THREE.Vector3(80, terrain.getHeightAt(80, 20), 20))
];

const wildlife = [
  new Deer(renderer.scene, terrain, new THREE.Vector3(-25, terrain.getHeightAt(-25, 30), 30)),
  new Deer(renderer.scene, terrain, new THREE.Vector3(40, terrain.getHeightAt(40, -40), -40))
];

// 6. Combat & Building
const combatManager = new CombatManager(renderer.scene, cameraController, particleEngine);
const buildGrid = new BuildGrid(renderer.scene);
const deployables = new Deployables(renderer.scene);

// 7. UI Systems
const hud = new HUD();
const dialogueBox = new DialogueBox();
const dialogueSystem = new DialogueSystem(dialogueBox);
const topoMap = new TopoMap(terrain);
const compass = new HolographicCompass();
const craftingUI = new CraftingUI();

// 8. Restore Saved Game if exists
const savedData = saveSystem.load();
if (savedData && savedData.player) {
  player.position.set(savedData.player.x, savedData.player.y, savedData.player.z);
  player.health = savedData.player.health;
  player.maxHealth = savedData.player.maxHealth || 100;
  player.stamina = savedData.player.stamina;
  player.hunger = savedData.player.hunger;
  player.level = savedData.player.level || 1;
  player.xp = savedData.player.xp || 0;
  if (savedData.player.inventory) player.inventory = savedData.player.inventory;

  // Restore placed blocks
  if (savedData.blocks) {
    for (const b of savedData.blocks) {
      buildGrid.placeBlock(new THREE.Vector3(b.x, b.y, b.z), b.type);
    }
  }
  hud.showToast('⚡ Saved Game Loaded');
}

// 9. User Interaction Listeners
window.addEventListener('click', () => {
  audioEngine.init();
});

let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // Mouse deltas for camera
  const md = inputManager.consumeMouseDelta();
  if (inputManager.isPointerLocked) {
    cameraController.applyMouseDelta(md.x, md.y);
  }

  // Camera Mode Toggle
  if (inputManager.wasKeyJustPressed('KeyV')) {
    cameraController.toggleMode();
  }

  // World Map Toggle
  if (inputManager.wasKeyJustPressed('KeyM')) {
    const isOpen = topoMap.toggle(player.position, npcs, bossTitan, deployables);
    if (isOpen) inputManager.exitPointerLock();
    else inputManager.requestPointerLock();
  }

  // Crafting Toggle
  if (inputManager.wasKeyJustPressed('Tab')) {
    const isOpen = craftingUI.toggle(player);
    if (isOpen) inputManager.exitPointerLock();
    else inputManager.requestPointerLock();
  }

  // Temporal Stasis Bubble (Q)
  if (inputManager.wasKeyJustPressed('KeyQ')) {
    combatManager.castStasisBubble(player.position.clone());
    audioEngine.playStasisSound();
    hud.showToast('⏳ Chrono Stasis Deployed');
  }

  // Quick Save (F5) & Quick Load (F9)
  if (inputManager.wasKeyJustPressed('F5')) {
    saveSystem.save({ player, bossTitan, buildGrid, deployables, sky });
    audioEngine.playToastSound();
    hud.showToast('💾 Quick Save Successful');
  }
  if (inputManager.wasKeyJustPressed('F9')) {
    const loaded = saveSystem.load();
    if (loaded && loaded.player) {
      player.position.set(loaded.player.x, loaded.player.y, loaded.player.z);
      player.health = loaded.player.health;
      player.inventory = loaded.player.inventory;
      audioEngine.playToastSound();
      hud.showToast('⚡ Quick Load Complete');
    }
  }

  // Contextual Interaction Check
  let promptText = null;
  for (const npc of npcs) {
    if (player.position.distanceTo(npc.position) < npc.interactionRadius) {
      promptText = `[E] Speak with ${npc.name}`;
      break;
    }
  }
  if (!promptText && player.position.distanceTo(bossTitan.position) < 18.0 && !bossTitan.isAwake) {
    promptText = `[E] Awaken The Ancient Titan`;
  }
  for (const c of deployables.campfires) {
    if (player.position.distanceTo(c.pos) < 3.0) {
      promptText = `[E] Cook Food at Campfire`;
      break;
    }
  }
  hud.showPrompt(promptText);

  // Interaction Key (E)
  if (inputManager.wasKeyJustPressed('KeyE')) {
    // 1. NPC Interaction
    for (const npc of npcs) {
      if (player.position.distanceTo(npc.position) < npc.interactionRadius) {
        dialogueSystem.startDialogue(npc);
        inputManager.exitPointerLock();
        break;
      }
    }

    // 2. Summit Altar / Boss Awakening
    if (player.position.distanceTo(bossTitan.position) < 18.0 && !bossTitan.isAwake) {
      bossTitan.awaken();
      audioEngine.setMusicMode('boss');
      cameraController.addShake(0.5);
      particleEngine.spawnGroundSlamShockwave(bossTitan.position);
      hud.showToast('👑 The Ancient Titan Awakens!');
    }

    // 3. Campfire Cooking
    for (const c of deployables.campfires) {
      if (player.position.distanceTo(c.pos) < 3.0) {
        if (player.inventory.raw_meat > 0) {
          player.inventory.raw_meat--;
          player.inventory.cooked_meat = (player.inventory.cooked_meat || 0) + 1;
          particleEngine.spawnSparks(c.pos, 16, 0xffaa00, 5.0);
          audioEngine.playToastSound();
          hud.showToast('🥩 Cooked Roasted Steak!');
        } else {
          hud.showToast('⚠️ No raw meat to cook');
        }
        break;
      }
    }
  }

  // Combat Inputs
  const activeSlot = player.hotbar[inputManager.selectedHotbarIndex];
  hud.setHotbarActive(inputManager.selectedHotbarIndex);

  if (activeSlot === 'blaster') {
    if (inputManager.isMouseDown(0)) {
      if (!combatManager.isCharging) combatManager.startCharging();
    } else if (combatManager.isCharging) {
      const origin = player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const fwd = cameraController.getForwardVector();
      combatManager.releaseCharge(origin, fwd);
      audioEngine.playBlasterSound(combatManager.chargeTime >= 1.2);
    }
  } else if (activeSlot === 'katana') {
    if (inputManager.wasMouseJustPressed(0)) {
      const fwd = cameraController.getForwardVector();
      combatManager.performMeleeAttack(player, (dmg, isCrit) => {
        audioEngine.playSwordSound(isCrit);
        for (const e of enemies) {
          if (!e.isDead && player.position.distanceTo(e.group.position) < 3.2) {
            e.takeDamage(dmg);
            combatManager.damageNumbers.spawn(dmg, e.group.position, isCrit);
            particleEngine.spawnSparks(e.group.position, isCrit ? 22 : 12, 0x00ffff, 8.0);
          }
        }
        if (bossTitan.isAwake && !bossTitan.isDead && player.position.distanceTo(bossTitan.group.position) < 6.5) {
          bossTitan.takeDamage(dmg);
          combatManager.damageNumbers.spawn(dmg, bossTitan.group.position, isCrit);
          particleEngine.spawnSparks(bossTitan.group.position, 25, 0xff00e5, 10.0);
        }
      });
    }

    // Parry Shield (Hold RMB)
    if (inputManager.isMouseDown(2)) {
      player.animator.setState('parry');
      combatManager.isParrying = true;
    } else {
      combatManager.isParrying = false;
    }
  } else if (activeSlot === 'building_kit') {
    const fwd = cameraController.getForwardVector();
    const buildPos = buildGrid.updatePreview(player.position, fwd);
    if (inputManager.wasMouseJustPressed(0)) {
      buildGrid.placeBlock(buildPos, 'wood');
      player.inventory.wood = Math.max(0, (player.inventory.wood || 0) - 2);
      particleEngine.spawnSparks(buildPos, 10, 0xd4a373, 4.0);
    }
  } else {
    buildGrid.hidePreview();
  }

  // Quick Consume
  if (inputManager.wasMouseJustPressed(0)) {
    if (activeSlot === 'cooked_meat' && player.inventory.cooked_meat > 0) {
      player.inventory.cooked_meat--;
      player.eatFood(50, 45);
      particleEngine.spawnSparks(player.position, 12, 0x20e386, 4.0);
      hud.showToast('🍖 Savored Steak (+50 HUN, +45 HP)');
    } else if (activeSlot === 'health_potion' && player.inventory.health_potion > 0) {
      player.inventory.health_potion--;
      player.heal(75);
      particleEngine.spawnSparks(player.position, 20, 0xa842ff, 6.0);
      hud.showToast('🧪 Vitality Elixir (+75 HP)');
    }
  }

  // Update Game Entities & Ground Slam
  player.update(
    dt,
    inputManager,
    cameraController,
    terrain,
    particleEngine,
    (slamPos) => {
      // Ground Slam Landing
      combatManager.spawnBossShockwave(slamPos);
      audioEngine.playGroundSlamSound();
      cameraController.addShake(0.4);
      hud.showToast('💥 Aerial Ground Slam!');
      for (const e of enemies) {
        if (!e.isDead && slamPos.distanceTo(e.group.position) < 9.0) {
          e.takeDamage(55);
          combatManager.damageNumbers.spawn(55, e.group.position, true);
        }
      }
    }
  );

  cameraController.update(dt, player.position, (x, z) => terrain.getHeightAt(x, z));

  ocean.update(dt);
  sky.update(dt, player.position);

  // Music mode
  if (!bossTitan.isAwake || bossTitan.isDead) {
    audioEngine.setMusicMode(sky.timeOfDay > 0.45 && sky.timeOfDay < 0.95 ? 'night' : 'day');
  }
  audioEngine.updateMusic(dt);

  // Update NPCs
  for (const npc of npcs) {
    npc.update(dt, player.position, cameraController.camera.position);
  }

  // Update Boss Titan
  bossTitan.update(
    dt,
    player.position,
    (shockPos) => combatManager.spawnBossShockwave(shockPos),
    (from, to) => combatManager.spawnBossBoulder(from, to)
  );

  // Update Hostile Enemies
  for (const enemy of enemies) {
    enemy.update(dt, player.position, (dmg) => {
      if (combatManager.isParrying) {
        audioEngine.playParrySound();
        combatManager.damageNumbers.spawn('PARRY!', player.position, true);
        particleEngine.spawnSparks(player.position, 18, 0x00ffff, 9.0);
        cameraController.addShake(0.1);
      } else {
        player.takeDamage(dmg);
        hud.flashDamage();
        particleEngine.spawnSparks(player.position, 12, 0xff2244, 6.0);
        cameraController.addShake(0.2);
      }
    });
  }

  // Update Wildlife
  for (const deer of wildlife) {
    deer.update(dt, player.position);
  }

  // Update Deployables & Turret AI
  deployables.update(dt, enemies, (origin, target) => {
    const fwd = target.group.position.clone().sub(origin).normalize();
    combatManager.fireRapidBolt(origin, fwd);
    audioEngine.playBlasterSound(false);
  });

  // Update Combat Manager
  combatManager.update(
    dt,
    enemies,
    bossTitan,
    player,
    (dmg) => {
      player.takeDamage(dmg);
      hud.flashDamage();
      cameraController.addShake(0.25);
    },
    (killedObj, xp) => {
      player.addXp(xp);
      particleEngine.spawnSparks(player.position, 20, 0xffd700, 7.0);
      hud.showToast(`✨ Gained +${xp} XP!`);
    }
  );

  // Update Particles
  particleEngine.update(dt, player.position);

  // Update Auto-Save
  saveSystem.update(dt, { player, bossTitan, buildGrid, deployables, sky }, (toastMsg) => {
    hud.showToast(toastMsg);
  });

  // Update UI & Compass & Mini-Radar
  const isSprinting = inputManager.isKeyDown('ShiftLeft') && player.stamina > 5;
  hud.update(player, bossTitan, combatManager, enemies, npcs, cameraController.yaw, isSprinting, dt);
  compass.update(cameraController.yaw);

  // Clear per-frame input edge triggers
  inputManager.clearFrame();

  // Render Scene
  renderer.render();
}

// Launch Engine
requestAnimationFrame(animate);
console.log(`🌟 Aetheria ${CONFIG.VERSION} Ultra Polish Engine Booted Successfully.`);
