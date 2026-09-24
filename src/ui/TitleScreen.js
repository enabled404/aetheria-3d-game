export class TitleScreen {
  constructor(onEnterCallback = null, onOpenSettings = null, onOpenControls = null) {
    this.onEnterCallback = onEnterCallback;
    this.onOpenSettings = onOpenSettings;
    this.onOpenControls = onOpenControls;
    this.visible = true;

    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'title-screen';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, rgba(6, 14, 28, 0.45) 0%, rgba(2, 6, 14, 0.90) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s;
      font-family: 'Segoe UI', -apple-system, Roboto, sans-serif;
      user-select: none;
    `;

    this.overlay.innerHTML = `
      <div style="
        max-width: 640px;
        width: 90%;
        padding: 40px 36px;
        background: rgba(10, 18, 32, 0.82);
        border: 1px solid rgba(0, 229, 255, 0.35);
        border-radius: 20px;
        box-shadow: 0 16px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 229, 255, 0.2);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        animation: titleFloat 6s ease-in-out infinite alternate;
      ">
        <div style="
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #00ffff;
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.4);
          padding: 5px 16px;
          border-radius: 20px;
          text-transform: uppercase;
        ">✦ NEXT-GEN OPEN WORLD & FLIGHT SIMULATION ✦</div>

        <h1 style="
          font-size: clamp(38px, 6vw, 62px);
          font-weight: 900;
          letter-spacing: 12px;
          color: #ffffff;
          text-shadow: 0 0 25px rgba(0, 229, 255, 0.8), 0 0 60px rgba(0, 229, 255, 0.35);
          margin: 0;
          line-height: 1.1;
        ">AETHERIA</h1>

        <div style="
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #7fd0ff;
          text-transform: uppercase;
        ">CHRONO REALMS • HIGH-VELOCITY FLIGHT</div>

        <p style="
          font-size: 13px;
          line-height: 1.6;
          color: #cbd5e1;
          max-width: 500px;
          margin: 0;
        ">
          Explore a persistent living archipelago with GPU Gerstner waves, dynamic Aurora Borealis, flying celestial leviathans, and supersonic fighter jets.
        </p>

        <!-- Feature Badges Strip -->
        <div style="
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 4px 0 10px;
        ">
          <span style="font-size: 11px; color: #7ad7ff; background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.25); padding: 4px 10px; border-radius: 12px;">🌊 GPU Gerstner Ocean</span>
          <span style="font-size: 11px; color: #00ffaa; background: rgba(0, 255, 170, 0.1); border: 1px solid rgba(0, 255, 170, 0.25); padding: 4px 10px; border-radius: 12px;">✈️ Supersonic Jets & Missiles</span>
          <span style="font-size: 11px; color: #ffbb00; background: rgba(255, 187, 0, 0.1); border: 1px solid rgba(255, 187, 0, 0.25); padding: 4px 10px; border-radius: 12px;">🏝️ Floating Sky Sanctuary</span>
          <span style="font-size: 11px; color: #ff77ee; background: rgba(255, 119, 238, 0.1); border: 1px solid rgba(255, 119, 238, 0.25); padding: 4px 10px; border-radius: 12px;">🐉 Celestial Leviathan</span>
        </div>

        <!-- Primary Action Buttons -->
        <div style="
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
        ">
          <button id="title-btn-enter" style="
            background: linear-gradient(135deg, #00e5ff 0%, #0077ff 100%);
            border: none;
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 2px;
            padding: 14px 28px;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 0 25px rgba(0, 229, 255, 0.55);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          ">
            <span>▶</span> ENTER EXPEDITION
          </button>

          <button id="title-btn-scramble" style="
            background: rgba(14, 24, 44, 0.85);
            border: 1px solid rgba(0, 229, 255, 0.45);
            color: #7ad7ff;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 11px 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          ">
            <span>✈️</span> SCRAMBLE FIGHTER JET (RUNWAY)
          </button>

          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="title-btn-controls" style="
              flex: 1;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.12);
              color: #94a3b8;
              font-size: 12px;
              font-weight: 600;
              padding: 9px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            ">⌨️ Controls</button>

            <button id="title-btn-settings" style="
              flex: 1;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.12);
              color: #94a3b8;
              font-size: 12px;
              font-weight: 600;
              padding: 9px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            ">⚙️ Settings</button>
          </div>
        </div>

        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          Tip: Press <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #fff;">Esc</kbd> anytime during gameplay to pause
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes titleFloat {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
      }
      #title-btn-enter:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 0 35px rgba(0, 229, 255, 0.85);
      }
      #title-btn-scramble:hover {
        background: rgba(0, 229, 255, 0.2);
        border-color: #00ffff;
        color: #ffffff;
      }
      #title-btn-controls:hover, #title-btn-settings:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.12);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    // Event listeners
    document.getElementById('title-btn-enter')?.addEventListener('click', () => {
      this.hide();
      this.onEnterCallback?.({ mode: 'foot' });
    });

    document.getElementById('title-btn-scramble')?.addEventListener('click', () => {
      this.hide();
      this.onEnterCallback?.({ mode: 'runway' });
    });

    document.getElementById('title-btn-controls')?.addEventListener('click', () => {
      this.onOpenControls?.();
    });

    document.getElementById('title-btn-settings')?.addEventListener('click', () => {
      this.onOpenSettings?.();
    });
  }

  show() {
    this.visible = true;
    this.overlay.style.opacity = '1';
    this.overlay.style.visibility = 'visible';
    this.overlay.style.pointerEvents = 'auto';
  }

  hide() {
    this.visible = false;
    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      if (!this.visible) {
        this.overlay.style.visibility = 'hidden';
      }
    }, 500);
  }

  isOpen() {
    return this.visible;
  }
}
