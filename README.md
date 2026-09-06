# Aetheria 3.0 — The Modular S-Tier 3D Open-World RPG

A next-generation, high-performance 3D open-world survival RPG built with Three.js, Vite, and the Web Audio / Speech API.

🎮 **Live Production on Vercel**: [https://aetheria-game-eta.vercel.app](https://aetheria-game-eta.vercel.app)

---

## 🌟 What Makes Aetheria 3.0 an S-Tier Breakthrough

### 1. 👤 Complete Procedural Characters with Anatomical Faces
- **Facial Geometry**: Procedurally sculpted skull, tapered jawline, cheekbones, defined 3D nose with bridge and nostrils, defined lips/mouth with oral cavity, and articulated brow.
- **Expressive Eyes & Gaze Tracking**: Twin ocular spheres with white sclera, limbal rings, radial iris striations (customized per character), black pupils, and cornea specular reflection.
- **Natural Blinking**: Stochastic eye blinking cycle (every 2.5–5 seconds) with realistic fast-close and smooth-open eyelid curves.
- **Dynamic Lip-Sync**: Articulated jaw and mouth shapes (phonemes) that animate in real time synchronized with spoken character voice lines!
- **Distinct Stylized Personas & Silhouettes**:
  - **The Explorer (Player)**: Sleek environmental explorer suit, gauntlet forearm emitter, windswept dark hair, and twin-thruster anti-grav jetpack.
  - **Lyra, The Chrono-Cartographer**: Scholarly explorer robes, twin glowing cyan chronomantic goggles on her forehead, and a floating orbiting Astrolabe drone.
  - **Commander Thorne, The Iron Vanguard**: Heavy battle-scarred plate armor, reinforced pauldron, and a red tactical cybernetic ocular implant.
  - **Kaelen, The Shadow Alchemist**: Deep draped cowl casting soft atmospheric shadows over his face, with an alchemical potion bandolier.
  - **The Ancient Titan (World Boss)**: Massive colossal stone titan with glowing magma core, burning runic eyes, and earth-shattering attacks.

### 2. 🎭 Full In-Browser Voiced Dialogue Trees
- Every NPC possesses a rich backstory, distinct speaking personality, and **full voice acting** synthesized in real-time via the browser's Web Speech API and Web Audio formant shaping:
  - **Lyra**: Energetic, inquisitive cadence, guiding the player through island anomalies and ancient monoliths.
  - **Commander Thorne**: Low, gritty, authoritative battle veteran cadence, offering combat tips and bounties.
  - **Kaelen**: Whispering, resonant, melodic cadence, trading crystal reagents and revealing the Titan's vulnerabilities.
- Interactive RPG dialogue modal with character portraits, typewriter text, and branching narrative choices.

### 3. 🤸 Fluid Skeletal Animation & Multi-Stage Combat
- Full multi-joint humanoid bone hierarchy (Pelvis, Spine, Chest, Neck, Head, Clavicles, Shoulders, Elbows, Wrists, Hands, Hips, Knees, Ankles, Feet).
- Smooth state blending:
  - **Idle**: Rhythmic breathing cycle and subtle weight shifts.
  - **Walk / Run / Sprint**: Dynamic bipedal stride with pelvic roll, forward athletic lean, and wind trail particle effects.
  - **Jump**: Takeoff anticipation crouch, airborne hang-time, and compression landing shock.
  - **Anti-Grav Jetpack**: Hold <kbd>Space</kbd> while airborne to fire vertical rocket thrusters with cyan particle trails.
  - **3-Hit Katana Combo**: Horizon Slash -> Rising Cross Cut -> 360 Cyclone Whirlwind Finisher with glowing ribbon trails and screen tremor.
  - **Parry Shield**: Hold <kbd>RMB</kbd> to raise an energy deflection barrier that stuns enemies and negates incoming damage.
  - **Dual-Mode Plasma Blaster**: Click for rapid energy bolts; **hold <kbd>LMB</kbd>** to charge an unstable Singularity Orb that causes a devastating explosive shockwave.
  - **3D Bouncing Damage Numbers**: Pop-up RPG combat indicators with critical hit multipliers and color coding.

### 4. 🌍 Vast Multi-Biome Terrain & Advanced Shaders
- Multi-octave Simplex / Perlin fBm procedural island with radial ocean falloff and the central mountain peak.
- Custom terrain slope splatting shader blending golden beach sand, rolling lush grass, sheer cliff rock, and mountain snow.
- Gerstner wave ocean simulation with animated swells, shoreline foam, and specular sun glints.
- Dynamic celestial dome with day/night cycle, Rayleigh/Mie atmospheric scattering, volumetric cloud decks, and starlit nights.

### 5. 🧱 Deployable Base Fortifications
- Snapped voxel construction: Fortified Wood, Obsidian Masonry, Crystal Forcefield.
- **Cooking Campfire**: Wards off nocturnal predators, emits warm point light, and cooks raw meat into **Roasted Steaks** (<kbd>E</kbd>).
- **Storage Crate**: Persistent resource storage.
- **Crystal Defense Turret**: Automated perimeter sentinel with 360° target tracking and laser bolts.

### 6. 🎶 Dynamic Procedural Soundtrack
- Generative Web Audio synthesizer:
  - **Day**: Tranquil, ethereal major 7th chord progressions.
  - **Night**: Atmospheric, mysterious minor tension chords.
  - **Boss Encounter**: Driving, urgent battle pulse.

---

## 🕹️ Controls Guide

| Key | Action |
|---|---|
| <kbd>W A S D</kbd> | Movement |
| <kbd>Shift</kbd> | Sprint (consumes stamina) |
| <kbd>Space</kbd> | Jump / Swim Upward |
| <kbd>Space</kbd> *(hold in air)* | **Anti-Grav Thruster Jetpack Boost** |
| <kbd>LMB</kbd> | Attack / **Hold to Charge Mega-Blaster** |
| <kbd>RMB</kbd> | **Parry Shield** (Katana) / Deflect |
| <kbd>E</kbd> | **Interact** (Talk to NPCs, Awaken Summit Titan, Cook at Campfire) |
| <kbd>Tab</kbd> | **Tech Forge Crafting Menu** |
| <kbd>M</kbd> | **Toggle Full Topographic Island Map** |
| <kbd>V</kbd> | Toggle 1st / 3rd Person Camera View |
| <kbd>1 - 6</kbd> / <kbd>Scroll</kbd> | Select Hotbar Item |

---

## 🛠️ Development & Architecture

Built with modern ES modules and Vite:
```bash
# Install dependencies
npm install

# Start local HMR development server
npm run dev

# Build production bundle
npm run build
```
