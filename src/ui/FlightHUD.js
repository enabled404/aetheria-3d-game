export class FlightHUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'flight-hud';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: none;
      font-family: 'Segoe UI', -apple-system, monospace;
      color: #00ffff;
      user-select: none;
      z-index: 15;
    `;

    this.container.innerHTML = `
      <!-- Top Heading Ribbon -->
      <div id="flight-heading-box" style="
        position: absolute;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 320px;
        height: 36px;
        background: rgba(8, 16, 28, 0.75);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 3px;
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.2);
        backdrop-filter: blur(8px);
      ">
        HDG <span id="flight-hdg-val" style="color: #ffffff; margin-left: 8px;">360° [N]</span>
      </div>

      <!-- Left Airspeed Tape -->
      <div id="flight-speed-box" style="
        position: absolute;
        left: 50px;
        top: 50%;
        transform: translateY(-50%);
        width: 100px;
        padding: 14px 10px;
        background: rgba(8, 16, 28, 0.75);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 8px;
        text-align: center;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.2);
      ">
        <div style="font-size: 11px; color: #7ad7ff; letter-spacing: 1px;">AIRSPEED</div>
        <div id="flight-speed-val" style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 4px 0;">0</div>
        <div style="font-size: 11px; color: #00e5ff;">KTS</div>
        <div id="flight-speed-bar-wrap" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 8px; overflow: hidden;">
          <div id="flight-speed-bar" style="width: 0%; height: 100%; background: #00ffff; transition: width 0.1s;"></div>
        </div>
        <div id="flight-g-val" style="font-size: 11px; color: #00ffaa; margin-top: 6px; font-weight: 700;">+1.0 G</div>
        <div id="flight-mach-val" style="font-size: 11px; color: #7ad7ff; margin-top: 3px; font-weight: 700;">M 0.00</div>
      </div>

      <!-- Center Air-to-Air Radar Target Lock Reticle -->
      <div id="flight-target-lock-box" style="
        position: absolute;
        width: 64px;
        height: 64px;
        border: 2px solid #00ffaa;
        box-shadow: 0 0 16px rgba(0, 255, 170, 0.6);
        transform: translate(-50%, -50%);
        display: none;
        pointer-events: none;
        text-align: center;
        font-size: 10px;
        font-weight: 800;
        color: #00ffaa;
        letter-spacing: 1px;
      ">
        <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); white-space: nowrap;" id="flight-target-tag">◈ LOCK ON</div>
        <div style="position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); white-space: nowrap;" id="flight-target-dist">140m</div>
      </div>

      <!-- Right Altimeter Tape -->
      <div id="flight-alt-box" style="
        position: absolute;
        right: 50px;
        top: 50%;
        transform: translateY(-50%);
        width: 100px;
        padding: 14px 10px;
        background: rgba(8, 16, 28, 0.75);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 8px;
        text-align: center;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.2);
      ">
        <div style="font-size: 11px; color: #7ad7ff; letter-spacing: 1px;">ALTITUDE</div>
        <div id="flight-alt-val" style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 4px 0;">14</div>
        <div style="font-size: 11px; color: #00e5ff;">METERS</div>
        <div id="flight-vsi-val" style="font-size: 11px; color: #00ffaa; margin-top: 6px;">VSI +0.0</div>
      </div>

      <!-- Center Artificial Horizon Canvas Overlay -->
      <canvas id="flight-horizon-canvas" width="340" height="340" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      "></canvas>

      <!-- Center Stall Warning Alert -->
      <div id="flight-stall-alert" style="
        position: absolute;
        top: 32%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(230, 20, 40, 0.85);
        border: 2px solid #ff2233;
        border-radius: 8px;
        padding: 8px 24px;
        font-size: 20px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 4px;
        box-shadow: 0 0 25px rgba(255, 30, 50, 0.8);
        display: none;
        animation: stallBlink 0.3s infinite alternate;
      ">
        ⚠ STALL WARNING
      </div>

      <!-- Bottom Left Engine & Throttle Telemetry -->
      <div id="flight-throttle-box" style="
        position: absolute;
        left: 50px;
        bottom: 80px;
        width: 146px;
        padding: 12px 14px;
        background: rgba(8, 16, 28, 0.75);
        border: 1px solid rgba(0, 229, 255, 0.35);
        border-radius: 8px;
        backdrop-filter: blur(8px);
      ">
        <div style="font-size: 11px; color: #7ad7ff; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>THROTTLE</span>
          <div>
            <span id="flight-ab-tag" style="background: rgba(255, 50, 0, 0.25); border: 1px solid #ff4400; color: #ff5522; font-weight: 800; font-size: 9px; padding: 1px 5px; border-radius: 4px; display: none; margin-right: 4px;">AB</span>
            <span id="flight-thr-pct" style="color: #fff; font-weight: 700;">0%</span>
          </div>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
          <div id="flight-thr-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ffff, #00ffaa); transition: width 0.08s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span id="flight-gear-tag" style="color: #00ff66; font-weight: 700;">GEAR DOWN</span>
          <span id="flight-brake-tag" style="color: #ffaa00; display: none;">BRAKES</span>
        </div>
        <div style="margin-top: 6px; font-size: 11px; color: #00e5ff; font-weight: 700; display: flex; justify-content: space-between;">
          <span>MISSILES:</span>
          <span id="flight-missile-count" style="color: #fff;">4 / 4</span>
        </div>
      </div>

      <!-- Bottom Flight Controls Helper Bar -->
      <div id="flight-controls-bar" style="
        position: absolute;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(8, 16, 28, 0.85);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 20px;
        padding: 8px 24px;
        font-size: 12px;
        font-weight: 600;
        color: #d8f0ff;
        display: flex;
        gap: 16px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      ">
        <span><strong style="color: #ff4455;">RMB:</strong> Missile</span>
        <span><strong style="color: #00ffff;">LMB:</strong> Cannons</span>
        <span><strong style="color: #00ffaa;">G:</strong> Gear</span>
        <span><strong style="color: #00ffff;">Mouse / W/S:</strong> Pitch</span>
        <span><strong style="color: #00ffff;">Mouse / A/D:</strong> Roll</span>
        <span><strong style="color: #00ffff;">Q/E:</strong> Rudder</span>
        <span><strong style="color: #00ffff;">Shift/Ctrl/Wheel:</strong> Throttle</span>
        <span><strong style="color: #00ffff;">Space:</strong> Brakes</span>
        <span><strong style="color: #ffaa00;">L:</strong> Livery</span>
        <span><strong style="color: #00ffff;">V:</strong> Camera</span>
        <span><strong style="color: #ff4466;">F:</strong> Exit</span>
      </div>

      <!-- High-G Blackout / Redout Vignette -->
      <div id="flight-g-vignette" style="
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.0;
        transition: opacity 0.12s ease-out;
        z-index: 10;
      "></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes stallBlink {
        from { opacity: 0.4; transform: translate(-50%, -50%) scale(0.96); }
        to { opacity: 1.0; transform: translate(-50%, -50%) scale(1.04); }
      }
      @keyframes abGlow {
        from { box-shadow: 0 0 4px #ff3300; }
        to { box-shadow: 0 0 12px #ff6600; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.container);

    this.canvas = document.getElementById('flight-horizon-canvas');
    this.ctx = this.canvas?.getContext('2d');

    this.gVignetteElem = document.getElementById('flight-g-vignette');
    this.hdgValElem = document.getElementById('flight-hdg-val');
    this.speedValElem = document.getElementById('flight-speed-val');
    this.speedBarElem = document.getElementById('flight-speed-bar');
    this.gValElem = document.getElementById('flight-g-val');
    this.machValElem = document.getElementById('flight-mach-val');
    this.altValElem = document.getElementById('flight-alt-val');
    this.vsiValElem = document.getElementById('flight-vsi-val');
    this.thrPctElem = document.getElementById('flight-thr-pct');
    this.thrFillElem = document.getElementById('flight-thr-fill');
    this.abTagElem = document.getElementById('flight-ab-tag');
    this.stallAlertElem = document.getElementById('flight-stall-alert');
    this.gearTagElem = document.getElementById('flight-gear-tag');
    this.brakeTagElem = document.getElementById('flight-brake-tag');
    this.missileCountElem = document.getElementById('flight-missile-count');
    this.targetLockBox = document.getElementById('flight-target-lock-box');
    this.targetTagElem = document.getElementById('flight-target-tag');
    this.targetDistElem = document.getElementById('flight-target-dist');
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
    if (this.gVignetteElem) {
      this.gVignetteElem.style.opacity = '0.0';
    }
  }

  update(airplane, camera = null, rogueDrones = []) {
    if (!airplane || !airplane.isPilotInside) {
      this.hide();
      return;
    }
    this.show();

    // 1. Airspeed in Knots (1 m/s = ~1.944 knots)
    const knots = Math.round(airplane.speed * 1.944);
    if (this.speedValElem) this.speedValElem.textContent = knots;

    const speedPct = Math.min(100, Math.round((airplane.speed / airplane.maxSpeed) * 100));
    if (this.speedBarElem) {
      this.speedBarElem.style.width = `${speedPct}%`;
      this.speedBarElem.style.background = (airplane.speed < airplane.stallSpeed) ? '#ff2233' : '#00ffff';
    }

    // G-Meter & High-G Blackout / Redout Visuals
    const g = airplane.gForce !== undefined ? airplane.gForce : 1.0;
    if (this.gValElem) {
      const sign = g >= 0 ? '+' : '';
      this.gValElem.textContent = `${sign}${g.toFixed(1)} G`;
      this.gValElem.style.color = (g > 3.5 || g < -0.5) ? '#ff3344' : (g > 2.5 ? '#ffaa00' : '#00ffaa');
    }

    if (this.gVignetteElem) {
      if (g > 3.6) {
        // High Positive-G Blackout
        const intensity = Math.min(0.92, (g - 3.6) / 2.8);
        this.gVignetteElem.style.background = 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.95) 90%)';
        this.gVignetteElem.style.opacity = intensity.toFixed(3);
      } else if (g < -0.6) {
        // High Negative-G Redout
        const intensity = Math.min(0.85, (-g - 0.6) / 2.2);
        this.gVignetteElem.style.background = 'radial-gradient(circle at center, rgba(255, 0, 0, 0.15) 30%, rgba(190, 0, 0, 0.88) 90%)';
        this.gVignetteElem.style.opacity = intensity.toFixed(3);
      } else {
        this.gVignetteElem.style.opacity = '0.0';
      }
    }

    // Mach Number
    if (this.machValElem) {
      const mach = airplane.mach || (airplane.speed / 42.0);
      const isSuper = mach >= 1.0;
      this.machValElem.textContent = isSuper ? `M ${mach.toFixed(2)} [SUPERSONIC]` : `M ${mach.toFixed(2)}`;
      this.machValElem.style.color = isSuper ? '#ff8800' : '#7ad7ff';
    }

    // Missiles
    if (this.missileCountElem) {
      this.missileCountElem.textContent = `${airplane.missileAmmo} / 4`;
    }

    // 2. Altitude (Meters above Sea Level)
    const altitude = Math.round(airplane.group.position.y);
    if (this.altValElem) this.altValElem.textContent = altitude;

    const vsi = airplane.velocity.y;
    if (this.vsiValElem) {
      const sign = vsi >= 0 ? '+' : '';
      this.vsiValElem.textContent = `VSI ${sign}${vsi.toFixed(1)} m/s`;
      this.vsiValElem.style.color = vsi >= 0 ? '#00ffaa' : '#ffaa00';
    }

    // 3. Heading Compass
    const fwd = airplane.getForwardVector();
    let hdgDeg = Math.round((Math.atan2(-fwd.x, -fwd.z) * 180 / Math.PI + 360) % 360);
    const cardinal = (hdgDeg >= 338 || hdgDeg < 23) ? 'N' :
                     (hdgDeg >= 23 && hdgDeg < 68) ? 'NE' :
                     (hdgDeg >= 68 && hdgDeg < 113) ? 'E' :
                     (hdgDeg >= 113 && hdgDeg < 158) ? 'SE' :
                     (hdgDeg >= 158 && hdgDeg < 203) ? 'S' :
                     (hdgDeg >= 203 && hdgDeg < 248) ? 'SW' :
                     (hdgDeg >= 248 && hdgDeg < 293) ? 'W' : 'NW';

    if (this.hdgValElem) this.hdgValElem.textContent = `${String(hdgDeg).padStart(3, '0')}° [${cardinal}]`;

    // 4. Throttle & Afterburner
    const thrPct = Math.round(airplane.throttle * 100);
    if (this.thrPctElem) this.thrPctElem.textContent = `${thrPct}%`;
    if (this.thrFillElem) {
      this.thrFillElem.style.width = `${thrPct}%`;
      this.thrFillElem.style.background = airplane.isAfterburner 
        ? 'linear-gradient(90deg, #ff9900, #ff2200)' 
        : 'linear-gradient(90deg, #00ffff, #00ffaa)';
    }
    if (this.abTagElem) {
      this.abTagElem.style.display = airplane.isAfterburner ? 'inline-block' : 'none';
      if (airplane.isAfterburner) {
        this.abTagElem.style.animation = 'abGlow 0.4s infinite alternate';
      }
    }

    // 5. Gear & Brakes
    if (this.gearTagElem) {
      if (airplane.isGrounded) {
        this.gearTagElem.textContent = 'GEAR: DOWN';
        this.gearTagElem.style.color = '#00ff66';
      } else {
        const isDown = airplane.gearPosition > 0.4;
        this.gearTagElem.textContent = isDown ? 'GEAR: DOWN' : 'GEAR: RETRACTED';
        this.gearTagElem.style.color = isDown ? '#00ff66' : '#00e5ff';
      }
    }
    if (this.brakeTagElem) {
      this.brakeTagElem.style.display = airplane.brakes ? 'inline' : 'none';
    }

    // 6. Stall Warning
    if (this.stallAlertElem) {
      this.stallAlertElem.style.display = airplane.isStalled ? 'block' : 'none';
    }

    // 7. Air-to-Air Radar Target Lock Reticle
    let lockedDrone = null;
    if (camera && rogueDrones && rogueDrones.length > 0) {
      const planePos = airplane.group.position;
      let bestDist = 360.0;

      for (const drone of rogueDrones) {
        if (!drone || drone.isDead) continue;
        const dPos = drone.group.position;
        const toDrone = dPos.clone().sub(planePos);
        const dist = toDrone.length();
        if (dist > bestDist) continue;

        toDrone.normalize();
        const dot = fwd.dot(toDrone);
        if (dot > 0.72) { // Within boresight cone
          bestDist = dist;
          lockedDrone = drone;
        }
      }
    }

    airplane.lockedTarget = lockedDrone;

    if (lockedDrone && camera && this.targetLockBox) {
      const dronePos = lockedDrone.group.position.clone();
      dronePos.project(camera);

      if (dronePos.z < 1.0) {
        const screenX = (dronePos.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(dronePos.y * 0.5) + 0.5) * window.innerHeight;

        this.targetLockBox.style.display = 'block';
        this.targetLockBox.style.left = `${screenX}px`;
        this.targetLockBox.style.top = `${screenY}px`;

        const dist = Math.round(airplane.group.position.distanceTo(lockedDrone.group.position));
        if (this.targetDistElem) this.targetDistElem.textContent = `${dist}m`;

        // Tone notification on new target acquisition
        if (airplane.lastLockedId !== lockedDrone) {
          airplane.lastLockedId = lockedDrone;
          airplane.audioEngine?.playMissileLock();
          airplane.audioEngine?.announceVoice('TARGET LOCK');
        }
      } else {
        this.targetLockBox.style.display = 'none';
      }
    } else if (this.targetLockBox) {
      this.targetLockBox.style.display = 'none';
      airplane.lastLockedId = null;
    }

    // 7. Draw Pitch Ladder & Horizon on Canvas
    this.drawHorizon(airplane);
  }

  drawHorizon(airplane) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Calculate Roll & Pitch angles
    const fwd = airplane.getForwardVector();
    const right = airplane.getRightVector();
    const pitchAngle = Math.asin(Math.max(-1, Math.min(1, fwd.y)));
    const rollAngle = Math.asin(Math.max(-1, Math.min(1, right.y)));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rollAngle);

    // Horizon line
    const pitchOffset = pitchAngle * 180;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-110, pitchOffset);
    ctx.lineTo(110, pitchOffset);
    ctx.stroke();

    // Pitch ladder rungs (+10, +20, -10, -20)
    for (let deg of [-20, -10, 10, 20]) {
      const rungY = pitchOffset - (deg * Math.PI / 180) * 180;
      const rungWidth = 45;
      ctx.strokeStyle = deg > 0 ? '#00e5ff' : '#ff8800';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-rungWidth, rungY);
      ctx.lineTo(-15, rungY);
      ctx.moveTo(15, rungY);
      ctx.lineTo(rungWidth, rungY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.abs(deg)}`, rungWidth + 4, rungY + 3);
    }

    ctx.restore();

    // Aircraft fixed crosshair boresight symbol [ ─ • ─ ]
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy);
    ctx.lineTo(cx - 10, cy);
    ctx.lineTo(cx - 10, cy + 8);

    ctx.moveTo(cx + 30, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 10, cy + 8);

    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
