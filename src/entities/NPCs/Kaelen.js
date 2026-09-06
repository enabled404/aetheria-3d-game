import { NPC } from '../NPC.js';

export class Kaelen extends NPC {
  constructor(scene, assetManager, pos) {
    super(scene, {
      type: 'kaelen',
      name: 'Kaelen',
      title: 'Shadow Alchemist',
      color: '#bf55ec',
      irisTexture: assetManager.textures.irisViolet,
      armorColor: 0x1f142b,
      accentColor: 0xa842ff,
      position: pos
    });
  }
}
