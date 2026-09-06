import { NPC } from '../NPC.js';

export class Thorne extends NPC {
  constructor(scene, assetManager, pos) {
    super(scene, {
      type: 'thorne',
      name: 'Commander Thorne',
      title: 'Iron Vanguard',
      color: '#ff4433',
      irisTexture: assetManager.textures.irisAmber,
      armorColor: 0x2b1d1d,
      accentColor: 0xff3322,
      position: pos
    });
  }
}
