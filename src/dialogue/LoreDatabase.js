export const LORE_DATABASE = {
  lyra: {
    name: 'Lyra',
    title: 'Chrono-Cartographer',
    portraitColor: '#00eeff',
    greeting: 'Ah, explorer! Look at the temporal readings across this archipelago—the timeline is fracturing!',
    dialogueTree: {
      root: {
        text: 'You survived the drop! I am Lyra. My expedition was investigating temporal anomalies when our cruiser broke apart above Aetheria.',
        choices: [
          { text: 'Where are we, exactly?', next: 'island_lore' },
          { text: 'What is that giant mountain in the center?', next: 'mountain_lore' },
          { text: 'How do I survive out here?', next: 'survival_advice' }
        ]
      },
      island_lore: {
        text: 'This is Aetheria—an uncharted sovereign realm suspended in a localized time dilation field. The crystals you see are crystallized chronomantic energy.',
        choices: [
          { text: 'Can we escape this place?', next: 'escape' },
          { text: 'Tell me about the mountain.', next: 'mountain_lore' }
        ]
      },
      mountain_lore: {
        text: 'The Obsidian Spire. At the peak lies the Summit Altar. Legend holds that The Ancient Titan sleeps beneath the stone, awaiting an explorer worthy to activate the runes.',
        choices: [
          { text: 'I will face this Titan.', next: 'titan_challenge' },
          { text: 'Sounds dangerous. I need better gear first.', next: 'root' }
        ]
      },
      titan_challenge: {
        text: 'Brave, or reckless! You will need a charged Plasma Blaster, high-tier armor, and plenty of Roasted Steaks to endure its seismic wrath.',
        choices: [
          { text: 'Understood. I will prepare.', next: 'root' }
        ]
      },
      survival_advice: {
        text: 'Harvest Driftwood and Obsidian Cobble. Press [4] to equip your Building Kit—craft a Campfire to cook raw meat, or deploy an automated Defense Turret before night falls!',
        choices: [
          { text: 'Thanks for the guidance, Lyra.', next: 'root' }
        ]
      },
      escape: {
        text: 'Only by obtaining the Titan Core from the mountain summit can we recalibrate my Astrolabe and punch through the atmospheric barrier.',
        choices: [
          { text: 'Then the Titan will fall.', next: 'root' }
        ]
      }
    }
  },

  thorne: {
    name: 'Commander Thorne',
    title: 'Iron Vanguard',
    portraitColor: '#ff4433',
    greeting: 'At ease, soldier. Keep your weapon drawn—nocturnal beasts roam these woods.',
    dialogueTree: {
      root: {
        text: 'Commander Thorne, 7th Fleet Vanguard. My platoon was overrun by Void Brutes on the eastern ridge. If you intend to stay alive, you must master the blade.',
        choices: [
          { text: 'Teach me your combat techniques.', next: 'combat_training' },
          { text: 'Tell me about the enemy beasts.', next: 'enemy_intel' },
          { text: 'Any bounties or missions for me?', next: 'bounty_mission' }
        ]
      },
      combat_training: {
        text: 'With your Katana, perform a 3-strike combo with LMB. On the 3rd strike, you execute a 360 Whirlwind. And hold RMB to raise your Parry Shield to deflect enemy blows!',
        choices: [
          { text: 'What about the Blaster?', next: 'blaster_intel' },
          { text: 'I will put it to the test.', next: 'root' }
        ]
      },
      blaster_intel: {
        text: 'Hold LMB to accumulate unstable plasma. When the holographic rings converge, release it to fire a Singularity Orb that clears whole swarms.',
        choices: [
          { text: 'Understood, Commander.', next: 'root' }
        ]
      },
      enemy_intel: {
        text: 'You will encounter swift Forest Stalkers in the redwoods and armored Void Grunts near the ruins. At night, their aggression doubles. Stay near campfires.',
        choices: [
          { text: 'Good to know.', next: 'root' }
        ]
      },
      bounty_mission: {
        text: 'Hunt down 3 Void Grunts roaming near the stone ruins. Bring me proof of their defeat and I will reward you with tactical crafting materials.',
        choices: [
          { text: 'Consider it done.', next: 'root' }
        ]
      }
    }
  },

  kaelen: {
    name: 'Kaelen',
    title: 'Shadow Alchemist',
    portraitColor: '#bf55ec',
    greeting: 'The whispers of the island grow louder... what brings you to my shadows?',
    dialogueTree: {
      root: {
        text: 'I distill the raw essence of Aetheria. Everything in this realm—the flora, the crystal shards, the beast blood—holds alchemical secrets.',
        choices: [
          { text: 'What can you brew for me?', next: 'alchemy_shop' },
          { text: 'Tell me about the Titan Core.', next: 'titan_core_lore' },
          { text: 'How do you survive out here alone?', next: 'cowl_lore' }
        ]
      },
      alchemy_shop: {
        text: 'Bring me Glow Berries and Crystal Shards. I can brew Vitality Elixirs that instantly mend fractured bone and restore full combat vigor.',
        choices: [
          { text: 'I will gather the reagents.', next: 'root' }
        ]
      },
      titan_core_lore: {
        text: 'The Titan Core is no mere stone. It is a beating heart of primordial energy. Wielding it grants the bearer absolute sovereignty over the island ley lines.',
        choices: [
          { text: 'I will claim it from the mountain.', next: 'root' }
        ]
      },
      cowl_lore: {
        text: 'The shadows are not hostile if you know how to blend into them. Crouch with [Ctrl] to muffle your footsteps and strike unseen.',
        choices: [
          { text: 'A valuable trick.', next: 'root' }
        ]
      }
    }
  }
};
