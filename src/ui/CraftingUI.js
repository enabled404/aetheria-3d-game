import { CONFIG } from '../config.js';

export class CraftingUI {
  constructor(gameCursor = null) {
    this.modal = document.getElementById('crafting-modal');
    this.listElem = document.getElementById('crafting-list');
    this.isOpen = false;
    this.gameCursor = gameCursor;
  }

  setGameCursor(gc) {
    this.gameCursor = gc;
  }

  toggle(player) {
    if (this.isOpen) {
      return this.close();
    } else {
      return this.open(player);
    }
  }

  open(player) {
    this.isOpen = true;
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.renderRecipes(player);
    }
    this.gameCursor?.openUI('crafting');
    return this.isOpen;
  }

  close() {
    this.isOpen = false;
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.gameCursor?.closeUI('crafting');
    return this.isOpen;
  }

  renderRecipes(player) {
    if (!this.listElem) return;
    this.listElem.innerHTML = '';

    for (const r of CONFIG.RECIPES) {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      let canCraft = true;
      const costStr = Object.entries(r.cost).map(([itemKey, qty]) => {
        const has = player.inventory[itemKey] || 0;
        if (has < qty) canCraft = false;
        return `${CONFIG.ITEMS[itemKey.toUpperCase()]?.name || itemKey}: ${has}/${qty}`;
      }).join(' • ');

      card.innerHTML = `
        <div class="recipe-header">
          <span class="recipe-name">${r.name}</span>
          <span class="recipe-category">${r.category.toUpperCase()}</span>
        </div>
        <div class="recipe-desc">${r.desc}</div>
        <div class="recipe-cost ${canCraft ? 'affordable' : 'unaffordable'}">${costStr}</div>
      `;

      const craftBtn = document.createElement('button');
      craftBtn.className = `craft-btn ${canCraft ? '' : 'disabled'}`;
      craftBtn.textContent = canCraft ? 'Forge Craft' : 'Lacking Reagents';
      craftBtn.disabled = !canCraft;

      craftBtn.addEventListener('click', () => {
        if (canCraft) {
          for (const [itemKey, qty] of Object.entries(r.cost)) {
            player.inventory[itemKey] -= qty;
          }
          if (r.id === 'campfire') player.inventory['wood'] = (player.inventory['wood'] || 0);
          player.addXp(20);
          this.renderRecipes(player);
        }
      });

      card.appendChild(craftBtn);
      this.listElem.appendChild(card);
    }
  }
}
