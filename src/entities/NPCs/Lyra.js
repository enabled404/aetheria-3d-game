import { NPC } from '../NPC.js';

export class Lyra extends NPC {
  constructor(scene, assetManager, pos) {
    super(scene, {
      type: 'lyra',
      name: 'Lyra',
      title: 'Chrono-Cartographer',
      color: '#00ffff',
      irisTexture: assetManager.textures.irisBlue,
      armorColor: 0x1a2e3b,
      accentColor: 0x00ffff,
      position: pos
    });
  }
}
