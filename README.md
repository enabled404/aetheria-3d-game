# Aetheria 3.5 — The Ultimate S-Tier 3D Open-World RPG

A next-generation, high-performance 3D open-world survival RPG built with Three.js, Vite, and the Web Audio / Speech API.

🎮 **Live Production on Vercel**: [https://aetheria-game-eta.vercel.app](https://aetheria-game-eta.vercel.app)

---

## 🌟 What Makes Aetheria 3.5 an S-Tier Breakthrough

### 1. ✨ High-Performance Particle Engine
- **Combat Particles**: Fiery yellow-orange sparks on melee strikes, electric cyan sparks on parries, and magenta explosions on charged plasma impacts.
- **Thruster Plumes**: Dynamic cyan and orange flame plumes with drifting smoke particles when using the anti-grav jetpack.
- **Atmospheric Particles**: Golden ambient sun motes in daylight, glowing bioluminescent spores in the forest, and mountain summit snow flurries.
- **Debris Physics**: Rock fragments and dust shockwaves erupting from titan stomps and player ground slams.

### 2. ⏳ Chrono-Gauntlet Abilities & Combat Polish
- **Temporal Stasis Bubble (<kbd>Q</kbd>)**: Cast a shimmering chronomantic bubble (9m radius) that freezes enemies and incoming magma boulders in mid-air for 4.5 seconds.
- **Aerial Ground Slam (<kbd>Ctrl</kbd> / <kbd>C</kbd> in air)**: Accelerate downward into an explosive ground slam, knocking back and dealing heavy AOE damage to surrounding monsters.
- **Visceral Hit-Stop**: 45ms micro-pause and camera impact zoom on critical strikes, charged blaster hits, and parries.
- **Damage Vignette & Speed Lines**: Screen edge red pulse when taking damage and peripheral motion streaks during sprint and jetpack boosts.

### 3. 🧭 Mini-Radar & 3D Contextual Prompts
- **HUD Mini-Radar**: Real-time rotating radar display in the top-left corner tracking player orientation, nearby hostiles (red), friendly NPCs (cyan), and the Summit Altar (gold).
- **Contextual 3D Prompts**: Smooth floating indicators (`[E] Speak with Lyra`, `[E] Awaken Titan`, `[E] Cook Food`, etc.) when approaching interactive objects.

### 4. 💾 State Persistence (Auto-Save & Quick-Save)
- Automatic background saving every 60 seconds with toast notifications.
- <kbd>F5</kbd> Quick Save & <kbd>F9</kbd> Quick Load persisting player stats, position, inventory, placed structures, and boss state.

### 5. 👤 Complete Procedural Characters & Voiced Personas
- Sculpted facial anatomy with jawline, cheekbones, 3D nose, lips, and oral cavity.
- Articulated eyes with stochastic blinking (2.5–5s cycle) and gaze tracking.
- Dynamic phonetic lip-syncing synchronized with spoken dialogue.
- **Lyra, Chrono-Cartographer**: Energetic scholar guiding exploration.
- **Commander Thorne, Iron Vanguard**: Battle veteran offering combat instruction and bounties.
- **Kaelen, Shadow Alchemist**: Enigmatic wanderer trading crystal reagents and brewing elixirs.
- **The Ancient Titan**: Colossal mountain demigod with magma core and earth-shattering attacks.

### 6. 🎶 Dynamic Synthesizer Percussion & Soundscape
- Web Audio procedural drum machine (kick, snare, hi-hats) accelerating during boss battles.
- Daytime ethereal major 7th pads, nighttime mystery chords, and surface-aware footstep audio.

---

## 🕹️ Controls Guide

| Key | Action |
|---|---|
| <kbd>W A S D</kbd> | Movement |
| <kbd>Shift</kbd> | Sprint (consumes stamina) |
| <kbd>Space</kbd> | Jump / Swim Upward |
| <kbd>Space</kbd> *(hold in air)* | **Anti-Grav Thruster Jetpack Boost** |
| <kbd>Ctrl</kbd> / <kbd>C</kbd> *(in air)* | **Aerial Ground Slam** |
| <kbd>Q</kbd> | **Temporal Stasis Bubble** |
| <kbd>LMB</kbd> | Attack / **Hold to Charge Mega-Blaster** |
| <kbd>RMB</kbd> | **Parry Shield** (Katana) / Deflect |
| <kbd>E</kbd> | **Interact** (Talk to NPCs, Awaken Summit Titan, Cook at Campfire) |
| <kbd>F5</kbd> / <kbd>F9</kbd> | **Quick Save / Quick Load** |
| <kbd>Tab</kbd> | **Tech Forge Crafting Menu** |
| <kbd>M</kbd> | **Toggle Full Topographic Island Map** |
| <kbd>V</kbd> | Toggle 1st / 3rd Person Camera View |
| <kbd>1 - 6</kbd> / <kbd>Scroll</kbd> | Select Hotbar Item |

---

## 🛠️ Development & Architecture

```bash
# Install dependencies
npm install

# Start local HMR development server
npm run dev

# Build production bundle
npm run build
```
