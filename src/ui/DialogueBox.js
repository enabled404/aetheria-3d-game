export class DialogueBox {
  constructor() {
    this.modal = document.getElementById('dialogue-modal');
    this.nameElem = document.getElementById('dialogue-name');
    this.titleElem = document.getElementById('dialogue-title');
    this.textElem = document.getElementById('dialogue-text');
    this.choicesElem = document.getElementById('dialogue-choices');
    this.avatarElem = document.getElementById('dialogue-avatar');
  }

  renderDialogue({ name, title, color, text, choices, onChoiceSelected, onClose }) {
    if (!this.modal) return;
    this.modal.style.display = 'flex';

    this.nameElem.textContent = name;
    this.nameElem.style.color = color;
    this.titleElem.textContent = title;
    this.textElem.textContent = text;
    this.avatarElem.style.borderColor = color;

    this.choicesElem.innerHTML = '';
    for (const c of choices) {
      const btn = document.createElement('button');
      btn.className = 'dialogue-btn';
      btn.textContent = `▶ ${c.text}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onChoiceSelected(c.next);
      });
      this.choicesElem.appendChild(btn);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dialogue-btn close-btn';
    closeBtn.textContent = '✖ Close Conversation';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClose();
    });
    this.choicesElem.appendChild(closeBtn);
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}
