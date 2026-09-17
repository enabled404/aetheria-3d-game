import * as THREE from 'three';
import { HumanoidModel } from '../character/HumanoidModel.js';
import { AnimationSystem } from '../character/AnimationSystem.js';
import { CONFIG } from '../config.js';
import { settings } from '../core/SettingsManager.js';

export class Player {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.model = new HumanoidModel({
      type: 'player',
      irisTexture: assetManager.textures.irisBlue,
      armorColor: 0x223249,
      accentColor: 0x00ffff
    });
    this.scene.add(this.model.group);

    this.animator = new AnimationSystem(this.model);

    this.position = this.model.group.position;
    this.position.set(0, 15, 60);
    this.model.group.rotation.y = Math.PI;

    this.velocity = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isSwimming = false;
    this.isThrusterActive = false;
    this.isGroundSlamming = false;

    // Personal Lumitech Illumination (Player character and immediate ground are always crisp & bright)
    this.beacon = new THREE.PointLight(0x7fe3ff, 2.4, 28, 1.3);
    this.beacon.position.set(0, 1.25, 0);
    this.model.group.add(this.beacon);

    // Forward chest lantern beam
    this.chestLight = new THREE.SpotLight(0xaad8ff, 1.6, 36, Math.PI / 3.2, 0.45, 1.2);
    this.chestLight.position.set(0, 1.25, 0.25);
    this.chestLightTarget = new THREE.Object3D();
    this.chestLightTarget.position.set(0, 1.25, 8.0);
    this.model.group.add(this.chestLight);
    this.model.group.add(this.chestLightTarget);
    this.chestLight.target = this.chestLightTarget;

    const beaconEnabled = settings.get('playerBeacon') !== false;
    this.beacon.visible = beaconEnabled;
    this.chestLight.visible = beaconEnabled;

    settings.onChange((key, val) => {
      if (key === 'playerBeacon') {
        this.beacon.visible = !!val;
        this.chestLight.visible = !!val;
      }
    });

    // Stats
    this.health = CONFIG.PLAYER.MAX_HEALTH;
    this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
    this.stamina = CONFIG.PLAYER.MAX_STAMINA;
    this.maxStamina = CONFIG.PLAYER.MAX_STAMINA;
    this.hunger = CONFIG.PLAYER.MAX_HUNGER;
    this.maxHunger = CONFIG.PLAYER.MAX_HUNGER;

    this.level = 1;
    this.xp = 0;
    this.nextLevelXp = 100;

    // Inventory
    this.inventory = {
      wood: 12,
      stone: 8,
      crystal: 4,
      raw_meat: 2,
      cooked_meat: 1,
      berries: 5,
      health_potion: 1,
      titan_core: 0
    };

    // Hotbar item IDs [0 - 5]
    this.hotbar = ['blaster', 'katana', 'harvest_tool', 'building_kit', 'cooked_meat', 'health_potion'];
    this.stepTimer = 0;
  }

  setEquippedItem(itemId) {
    this.model.setEquippedItem(itemId);
  }

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level++;
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
      this.maxHealth += 10;
      this.health = this.maxHealth;
      return true;
    }
    return false;
  }

  respawn(terrain = null, hud = null) {
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.hunger = this.maxHunger;
    this.velocity.set(0, 0, 0);
    const spawnX = 0;
    const spawnZ = 60;
    const spawnY = terrain ? (terrain.getHeightAt(spawnX, spawnZ) + 0.2) : 15;
    this.position.set(spawnX, spawnY, spawnZ);
    this.isGrounded = true;
    this.isGroundSlamming = false;
    this.isThrusterActive = false;
    if (hud) {
      hud.vignetteOpacity = 0;
      hud.showToast('✨ Respawned at Coast Haven Camp');
    }
  }

  takeDamage(amount, terrain = null, hud = null) {
    this.health = Math.max(0, this.health - amount);
    this.animator.triggerAction('hit', 0.25);
    if (this.health <= 0) {
      this.respawn(terrain, hud);
      return true;
    }
    return false;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eatFood(hungerAmt, healAmt) {
    this.hunger = Math.min(this.maxHunger, this.hunger + hungerAmt);
    this.heal(healAmt);
  }

  update(dt, input, cameraController, terrain, particleEngine = null, onGroundSlam = null, collisionSystem = null, audioEngine = null) {
    // 1. Movement Inputs from Camera
    const fwd = cameraController.getForwardVector();
    const right = cameraController.getRightVector();

    let moveDir = new THREE.Vector3();
    if (input.isKeyDown('KeyW')) moveDir.add(fwd);
    if (input.isKeyDown('KeyS')) moveDir.sub(fwd);
    if (input.isKeyDown('KeyD')) moveDir.add(right);
    if (input.isKeyDown('KeyA')) moveDir.sub(right);

    if (cameraController.isAiming) {
      const aimDir = cameraController.getAimDirection();
      const targetAngle = Math.atan2(aimDir.x, aimDir.z);
      this.model.group.rotation.y = THREE.MathUtils.lerp(
        this.model.group.rotation.y,
        targetAngle,
        Math.min(1.0, dt * 20.0)
      );
    } else if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      // Rotate character model to face moving direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.model.group.rotation.y = THREE.MathUtils.lerp(
        this.model.group.rotation.y,
        targetAngle,
        Math.min(1.0, dt * 16.0)
      );
    }

    // 2. Sprint & Speeds
    const isSprinting = input.isKeyDown('ShiftLeft') && this.stamina > 5 && moveDir.lengthSq() > 0.001;
    let targetSpeed = CONFIG.PLAYER.WALK_SPEED;
    if (isSprinting) {
      targetSpeed = CONFIG.PLAYER.SPRINT_SPEED;
      this.stamina = Math.max(0, this.stamina - dt * 18.0);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 14.0);
    }

    // Hunger drain
    this.hunger = Math.max(0, this.hunger - dt * 0.12);

    // Smooth momentum inertia (acceleration and friction)
    const accelRate = this.isGrounded ? 16.0 : 6.0;
    this.targetVelocity.set(moveDir.x * targetSpeed, 0, moveDir.z * targetSpeed);
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, this.targetVelocity.x, Math.min(1.0, dt * accelRate));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, this.targetVelocity.z, Math.min(1.0, dt * accelRate));

    // 3. Terrain Slope Physics
    const groundH = terrain.getHeightAt(this.position.x, this.position.z);
    const normal = terrain.getNormalAt?.(this.position.x, this.position.z) || new THREE.Vector3(0, 1, 0);

    // Steep slope & cliff check
    if (this.isGrounded) {
      if (normal.y < 0.62) {
        // Steep cliff (> 52 deg) -> dynamic slide downhill
        this.velocity.x += normal.x * 16.0 * dt;
        this.velocity.z += normal.z * 16.0 * dt;
        if (particleEngine && Math.random() < 0.25) {
          particleEngine.spawnDustCloud(this.position, 0.4);
        }
      } else if (normal.y < 0.78) {
        // Moderate slope (38 - 52 deg): footing holds, but uphill speed throttled
        const uphillDot = moveDir.x * normal.x + moveDir.z * normal.z;
        if (uphillDot < 0) {
          targetSpeed *= 0.68;
        }
      }
    }

    // 4. Gravity, Jumps & Swimming
    this.isSwimming = this.position.y < CONFIG.WORLD.WATER_LEVEL + 0.35;

    if (this.isSwimming) {
      this.velocity.y = 0;
      if (input.isKeyDown('Space')) {
        this.velocity.y = CONFIG.PLAYER.SWIM_SPEED;
      }
      this.isGrounded = false;
      this.isThrusterActive = false;
      this.isGroundSlamming = false;
    } else {
      if (this.position.y <= groundH + 0.15) {
        // Landed on ground
        if (!this.isGrounded) {
          const fallSpeed = -this.velocity.y;
          if (fallSpeed > 5.5) {
            cameraController.addShake(Math.min(0.28, fallSpeed * 0.022));
            if (audioEngine) audioEngine.playFootstep('rock');
            if (particleEngine) particleEngine.spawnDustCloud(this.position, 0.7);
          }
        }

        if (this.isGroundSlamming) {
          this.isGroundSlamming = false;
          onGroundSlam?.(this.position.clone());
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, groundH, Math.min(1.0, dt * 25.0));
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isThrusterActive = false;

        if (input.wasKeyJustPressed('Space') && this.stamina >= 10) {
          this.velocity.y = CONFIG.PLAYER.JUMP_FORCE;
          this.isGrounded = false;
          this.stamina -= 10;
        }
      } else {
        // Airborne
        this.isGrounded = false;

        // Aerial Ground Slam
        if ((input.wasKeyJustPressed('ControlLeft') || input.wasKeyJustPressed('KeyC')) && !this.isGroundSlamming && this.stamina >= 20) {
          this.isGroundSlamming = true;
          this.velocity.y = -38.0;
          this.stamina -= 20;
          cameraController.addShake(0.08);
        } else if (this.isGroundSlamming) {
          this.velocity.y = -42.0;
        } else if (input.isKeyDown('Space') && this.stamina > 4) {
          // Anti-Grav Thruster Boost
          this.isThrusterActive = true;
          this.velocity.y = Math.min(18.0, this.velocity.y + CONFIG.PLAYER.THRUSTER_FORCE * dt * 2.0);
          this.stamina = Math.max(0, this.stamina - dt * 32.0);
          cameraController.addShake(0.015);

          // Emit jetpack plume
          if (particleEngine) {
            const back = cameraController.getForwardVector().multiplyScalar(-1);
            particleEngine.spawnJetpackPlume(this.position.clone().add(new THREE.Vector3(0, 1.2, 0)), back);
          }
        } else {
          this.isThrusterActive = false;
          this.velocity.y -= CONFIG.PLAYER.GRAVITY * dt;
        }
      }
    }

    // Apply Velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 5. Continuous Spatial Collision Resolution (Trees, Rocks, Crystals, Structures, Vehicles)
    if (collisionSystem) {
      const collided = collisionSystem.resolveCircleCollision(this.position, 0.45, this.velocity);
      if (collided) {
        this.targetVelocity.x = this.velocity.x;
        this.targetVelocity.z = this.velocity.z;
      }
    }

    // Clamp floor
    const updatedGroundH = terrain.getHeightAt(this.position.x, this.position.z);
    if (this.position.y < updatedGroundH) {
      if (this.isGroundSlamming) {
        this.isGroundSlamming = false;
        onGroundSlam?.(this.position.clone());
      }
      this.position.y = updatedGroundH;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 6. Footstep Sound Trigger
    if (this.isGrounded && audioEngine) {
      const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (hSpeed > 0.8) {
        this.stepTimer += dt * (hSpeed / CONFIG.PLAYER.WALK_SPEED) * 2.3;
        if (this.stepTimer >= 1.0) {
          this.stepTimer = 0;
          let surface = 'grass';
          if (this.position.y < CONFIG.WORLD.WATER_LEVEL + 0.4) {
            surface = 'water';
          } else if (terrain.isInsideAirfield && terrain.isInsideAirfield(this.position.x, this.position.z, 0)) {
            surface = 'asphalt';
          } else if (this.position.y < 2.4) {
            surface = 'sand';
          } else if (normal.y < 0.78) {
            surface = 'rock';
          }
          audioEngine.playFootstep(surface);
        }
      }
    }

    // 7. Update Animations & Face
    this.animator.update(dt, this.velocity, this.isGrounded, this.isThrusterActive);
    this.model.update(dt, cameraController.camera.position);
  }
}
