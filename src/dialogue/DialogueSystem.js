import { LORE_DATABASE } from './LoreDatabase.js';
import { VoiceSynthesizer } from './VoiceSynthesizer.js';

export class DialogueSystem {
  constructor(uiDialogueBox) {
    this.ui = uiDialogueBox;
    this.voiceSynth = new VoiceSynthesizer();
    this.currentNPC = null;
    this.currentTree = null;
    this.currentNode = null;
    this.isOpen = false;
  }

  startDialogue(npc) {
    this.currentNPC = npc;
    const personaData = LORE_DATABASE[npc.npcType];
    if (!personaData) return;

    this.currentTree = personaData.dialogueTree;
    this.isOpen = true;

    this.showNode('root');
  }

  showNode(nodeKey) {
    const node = this.currentTree[nodeKey];
    if (!node) {
      this.closeDialogue();
      return;
    }

    this.currentNode = node;
    const personaData = LORE_DATABASE[this.currentNPC.npcType];

    // Trigger NPC speech and facial mouth animations
    this.voiceSynth.speak(
      node.text,
      this.currentNPC.npcType,
      () => {
        // on speech start -> animate mouth
        this.currentNPC.model?.facialAnimator?.startSpeaking(4.0);
      },
      () => {
        // on speech end -> stop mouth
        this.currentNPC.model?.facialAnimator?.stopSpeaking();
      }
    );

    // Update UI Dialogue Box
    this.ui.renderDialogue({
      name: personaData.name,
      title: personaData.title,
      color: personaData.portraitColor,
      text: node.text,
      choices: node.choices || [],
      onChoiceSelected: (nextKey) => {
        if (nextKey) {
          this.showNode(nextKey);
        } else {
          this.closeDialogue();
        }
      },
      onClose: () => this.closeDialogue()
    });
  }

  closeDialogue() {
    this.voiceSynth.stop();
    this.currentNPC?.model?.facialAnimator?.stopSpeaking();
    this.isOpen = false;
    this.currentNPC = null;
    this.ui.hide();
  }
}
