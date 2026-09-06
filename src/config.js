export const CONFIG = {
  VERSION: '3.0.0',
  WORLD: {
    SIZE: 500,
    SEGMENTS: 160,
    HEIGHT_SCALE: 58,
    WATER_LEVEL: 0.0,
    SEED: 42.1337,
    TREE_COUNT: 450,
    ROCK_COUNT: 280,
    CRYSTAL_COUNT: 180,
    GRASS_DENSITY: 2500
  },
  PLAYER: {
    MAX_HEALTH: 100,
    MAX_STAMINA: 100,
    MAX_HUNGER: 100,
    WALK_SPEED: 8.5,
    RUN_SPEED: 15.0,
    SPRINT_SPEED: 21.0,
    JUMP_FORCE: 14.0,
    THRUSTER_FORCE: 16.0,
    GRAVITY: 32.0,
    SWIM_SPEED: 6.0,
    REACH: 6.0
  },
  COMBAT: {
    BLASTER_DAMAGE: 28,
    BLASTER_CHARGE_DAMAGE: 110,
    BLASTER_COOLDOWN: 0.22,
    KATANA_COMBO_DAMAGE: [32, 45, 80],
    PARRY_WINDOW: 0.45,
    PARRY_STAMINA: 15,
    DODGE_STAMINA: 20
  },
  DAY_NIGHT: {
    DAY_DURATION_SECONDS: 240,
    SUN_DISTANCE: 320
  },
  ITEMS: {
    WOOD: { id: 'wood', name: 'Driftwood Log', icon: '🪵', category: 'material' },
    STONE: { id: 'stone', name: 'Obsidian Cobble', icon: '🪨', category: 'material' },
    CRYSTAL: { id: 'crystal', name: 'Aetheria Shard', icon: '💎', category: 'material' },
    RAW_MEAT: { id: 'raw_meat', name: 'Raw Venison', icon: '🥩', category: 'food' },
    COOKED_MEAT: { id: 'cooked_meat', name: 'Roasted Steak', icon: '🍖', category: 'food', heal: 45, hunger: 50 },
    BERRIES: { id: 'berries', name: 'Glow Berries', icon: '🫐', category: 'food', heal: 15, hunger: 20 },
    HEALTH_POTION: { id: 'health_potion', name: 'Vitality Elixir', icon: '🧪', category: 'consumable', heal: 75 },
    TITAN_CORE: { id: 'titan_core', name: 'The Titan Core', icon: '👑', category: 'relic' }
  },
  RECIPES: [
    { id: 'wood_block', name: 'Fortified Wood Block', cost: { wood: 4 }, category: 'building', desc: 'Sturdy wooden fortification block.' },
    { id: 'stone_brick', name: 'Obsidian Masonry', cost: { stone: 6 }, category: 'building', desc: 'Heavy stone brick with blast resistance.' },
    { id: 'crystal_barrier', name: 'Crystal Forcefield', cost: { crystal: 4 }, category: 'building', desc: 'Translucent glowing energy barrier.' },
    { id: 'campfire', name: 'Cooking Campfire', cost: { wood: 6, stone: 4 }, category: 'deployable', desc: 'Cooks raw venison into steak; deters night beasts.' },
    { id: 'storage_crate', name: 'Expedition Storage Crate', cost: { wood: 10, stone: 4 }, category: 'deployable', desc: 'Stores up to 16 resource stacks.' },
    { id: 'defense_turret', name: 'Crystal Defense Turret', cost: { wood: 8, stone: 12, crystal: 8 }, category: 'deployable', desc: 'Automated perimeter sentinel with 360° laser targeting.' },
    { id: 'vitality_elixir', name: 'Vitality Elixir', cost: { berries: 3, crystal: 1 }, category: 'alchemy', desc: 'Restores 75 HP instantly.' },
    { id: 'overcharge_cell', name: 'Plasma Overcharger', cost: { crystal: 5, stone: 5 }, category: 'tech', desc: 'Boosts weapon damage by +25% for 60 seconds.' }
  ]
};
