export class QuestEngine {
  constructor() {
    this.currentQuestIndex = 0;
    this.killCount = 0;
    this.isVictory = false;

    this.quests = [
      {
        id: 'meet_lyra',
        chapter: 'CHAPTER I',
        title: 'Stranded in Time',
        desc: 'Meet Lyra at the coastal drop site.',
        targetPos: { x: 18, z: 48 },
        targetLabel: 'Lyra',
        progress: () => 'Awaiting contact',
        rewardText: '+50 XP • Chrono Codex'
      },
      {
        id: 'gather_resources',
        chapter: 'CHAPTER II',
        title: 'Survival Armament',
        desc: 'Equip Harvest Tool [3] and gather 6 Timber and 4 Granite.',
        targetPos: null,
        targetLabel: 'Forest Flora',
        progress: (player) => `Wood: ${Math.min(6, player?.inventory?.wood || 0)}/6 • Stone: ${Math.min(4, player?.inventory?.stone || 0)}/4`,
        isComplete: (player) => (player?.inventory?.wood >= 6 && player?.inventory?.stone >= 4),
        rewardText: '+80 XP • Vitality Elixir'
      },
      {
        id: 'slay_grunts',
        chapter: 'CHAPTER III',
        title: 'Void Incursion',
        desc: 'Neutralize 2 Void Grunt patrols in the glade.',
        targetPos: { x: 35, z: 90 },
        targetLabel: 'Void Patrol',
        progress: () => `Grunts Purged: ${Math.min(2, this.killCount)}/2`,
        isComplete: () => this.killCount >= 2,
        rewardText: '+120 XP • 2 Chrono Crystals'
      },
      {
        id: 'find_thorne',
        chapter: 'CHAPTER IV',
        title: 'The Mountain Ascent',
        desc: 'Seek out Thorne at the Forge Outpost or scale the summit.',
        targetPos: { x: -32, z: 65 },
        targetLabel: 'Thorne',
        progress: () => 'Climb to elevation',
        rewardText: '+150 XP • Master Schematic'
      },
      {
        id: 'defeat_titan',
        chapter: 'FINALE',
        title: 'The Ancient Titan',
        desc: 'Ascend the summit altar and vanquish The Ancient Titan.',
        targetPos: { x: 0, z: 0 },
        targetLabel: 'Summit Altar',
        progress: (player, boss) => boss?.isAwake ? `Titan HP: ${Math.max(0, Math.round(boss.health))}` : 'Press [E] at Altar to Awaken',
        isComplete: (player, boss) => boss?.isDead,
        rewardText: '👑 Aetheria Liberated!'
      }
    ];

    this.createHUD();
  }

  createHUD() {
    let card = document.getElementById('quest-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'quest-card';
      card.className = 'glass-panel';
      document.getElementById('ui-overlay')?.appendChild(card);
    }
    this.hudCard = card;
  }

  getCurrentQuest() {
    return this.quests[this.currentQuestIndex] || null;
  }

  getTargetWaypoint() {
    const q = this.getCurrentQuest();
    if (!q || !q.targetPos) return null;
    return { ...q.targetPos, label: q.targetLabel };
  }

  onNpcTalk(npcName, player, audioEngine = null, hud = null) {
    if (this.currentQuestIndex === 0 && npcName.toLowerCase() === 'lyra') {
      this.advanceQuest(player, audioEngine, hud);
    } else if (this.currentQuestIndex === 3 && npcName.toLowerCase() === 'thorne') {
      this.advanceQuest(player, audioEngine, hud);
    }
  }

  onEnemyDefeated(enemyType, player, audioEngine = null, hud = null) {
    if (this.currentQuestIndex === 2) {
      this.killCount++;
      if (this.killCount >= 2) {
        this.advanceQuest(player, audioEngine, hud);
      }
    }
  }

  onBossDefeated(player, audioEngine = null, hud = null) {
    if (this.currentQuestIndex === 4 && !this.isVictory) {
      this.isVictory = true;
      audioEngine?.playVictoryFanfare?.();
      hud?.showToast('👑 VICTORY! THE ANCIENT TITAN HAS FALLEN!');
      this.showVictoryModal();
    }
  }

  advanceQuest(player, audioEngine = null, hud = null) {
    const completed = this.quests[this.currentQuestIndex];
    if (!completed) return;

    this.currentQuestIndex++;
    audioEngine?.playQuestCompleteSound?.();
    hud?.showToast(`✨ Quest Complete: ${completed.title}!`);

    if (player) {
      player.addXp?.(80);
    }
  }

  update(dt, player, bossTitan, audioEngine = null, hud = null) {
    const q = this.getCurrentQuest();
    if (!q || this.isVictory) return;

    // Check automatic completion conditions
    if (q.isComplete && q.isComplete(player, bossTitan)) {
      this.advanceQuest(player, audioEngine, hud);
    }

    // Update HUD display
    if (this.hudCard) {
      const prog = q.progress ? q.progress(player, bossTitan) : '';
      this.hudCard.innerHTML = `
        <div class="quest-header">
          <span class="quest-chapter">${q.chapter}</span>
          <span class="quest-tag">ACTIVE OBJECTIVE</span>
        </div>
        <div class="quest-title">${q.title}</div>
        <div class="quest-desc">${q.desc}</div>
        ${prog ? `<div class="quest-progress">📌 ${prog}</div>` : ''}
        <div class="quest-reward">🎁 ${q.rewardText}</div>
      `;
    }
  }

  showVictoryModal() {
    let modal = document.getElementById('victory-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'victory-modal';
      modal.innerHTML = `
        <div class="victory-panel glass-panel">
          <div style="font-size: 48px; margin-bottom: 8px;">👑</div>
          <h1 style="color: #00e5ff; font-size: 28px; letter-spacing: 3px;">EXPEDITION VICTORIOUS</h1>
          <p style="color: #cadbee; font-size: 14px; margin: 12px 0 20px; line-height: 1.6;">
            The Ancient Titan has fallen. The temporal anomalies on Aetheria have stabilized, and the chronological fracture is sealed forever.
          </p>
          <div class="victory-stats">
            <div class="v-stat"><span>Time Incursion</span><strong>Complete</strong></div>
            <div class="v-stat"><span>Titan Core</span><strong>Recovered</strong></div>
            <div class="v-stat"><span>Island Rank</span><strong style="color:#00ffff;">Apex Chronomancer</strong></div>
          </div>
          <button id="victory-continue-btn" class="settings-pri-btn" style="margin-top: 20px; width: 100%; font-size: 14px;">
            Continue Exploring Island
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('victory-continue-btn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    modal.style.display = 'flex';
  }
}
