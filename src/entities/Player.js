import * as THREE from 'three';
import { HumanoidModel } from '../character/HumanoidModel.js';
import { AnimationSystem } from '../character/AnimationSystem.js';
import { CONFIG } from '../config.js';

export class Player {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.model = new HumanoidModel({
      type: 'player',
      irisTexture: assetManager.textures.irisBlue,
      armorColor: 0x141f32,
      accentColor: 0x00e5ff
    });
    this.scene.add(this.model.group);

    this.animator = new AnimationSystem(this.model);

    this.position = this.model.group.position;
    this.position.set(0, 15, 60);

    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isSwimming = false;
    this.isThrusterActive = false;

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
  }

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level++;
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
      this.maxHealth += 10;
      this.health = this.maxHealth;
      return true; // leveled up
    }
    return false;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.animator.triggerAction('hit', 0.25);
    return this.health <= 0;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eatFood(hungerAmt, healAmt) {
    this.hunger = Math.min(this.maxHunger, this.hunger + hungerAmt);
    this.heal(healAmt);
  }

  update(dt, input, cameraController, terrain) {
    // 1. Movement Inputs
    const fwd = cameraController.getForwardVector();
    const right = cameraController.getRightVector();

    let moveDir = new THREE.Vector3();
    if (input.isKeyDown('KeyW')) moveDir.add(fwd);
    if (input.isKeyDown('KeyS')) moveDir.sub(fwd);
    if (input.isKeyDown('KeyD')) moveDir.add(right);
    if (input.isKeyDown('KeyA')) moveDir.sub(right);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      // Rotate model towards movement direction smoothly
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.model.group.rotation.y = THREE.MathUtils.lerp(
        this.model.group.rotation.y,
        targetAngle,
        Math.min(1.0, dt * 14.0)
      );
    }

    // 2. Sprint / Run Speeds
    const isSprinting = input.isKeyDown('ShiftLeft') && this.stamina > 5 && moveDir.lengthSq() > 0.001;
    let speed = CONFIG.PLAYER.WALK_SPEED;
    if (isSprinting) {
      speed = CONFIG.PLAYER.SPRINT_SPEED;
      this.stamina = Math.max(0, this.stamina - dt * 18.0);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 12.0);
    }

    // Hunger drain
    this.hunger = Math.max(0, this.hunger - dt * 0.15);

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // 3. Gravity & Jumps
    const groundH = terrain.getHeightAt(this.position.x, this.position.z);
    this.isSwimming = this.position.y < CONFIG.WORLD.WATER_LEVEL + 0.4;

    if (this.isSwimming) {
      this.velocity.y = 0;
      if (input.isKeyDown('Space')) {
        this.velocity.y = CONFIG.PLAYER.SWIM_SPEED;
      }
      this.isGrounded = false;
      this.isThrusterActive = false;
    } else {
      if (this.position.y <= groundH + 0.1) {
        this.position.y = groundH;
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

        // Anti-Grav Thruster Boost (holding Space in air)
        if (input.isKeyDown('Space') && this.stamina > 4) {
          this.isThrusterActive = true;
          this.velocity.y = Math.min(18.0, this.velocity.y + CONFIG.PLAYER.THRUSTER_FORCE * dt * 2.0);
          this.stamina = Math.max(0, this.stamina - dt * 32.0);
          cameraController.addShake(0.015);
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

    // Prevent sinking into terrain
    if (this.position.y < groundH) {
      this.position.y = groundH;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 4. Update Animations & Face
    this.animator.update(dt, this.velocity, this.isGrounded, this.isThrusterActive);
    this.model.update(dt, cameraController.camera.position);
  }
}
