/**
 * High-fidelity Retro Procedural Sprite Rendering for Galaxy Arcade
 * Pixel-precise vector and sprite drawings with authentic arcade styling.
 */

import { Enemy, EnemyType, Player, BossMothership, PowerUp } from './types.ts';

export class SpriteRenderer {
  /**
   * Draw the Player Fighter
   */
  public static drawPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number) {
    // If invulnerable, flicker
    if (player.invulnerableTime > 0 && Math.floor(time * 15) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(player.x, player.y);

    // If being captured by tractor beam, spin and scale
    if (player.isCaptured) {
      const rot = time * 8;
      const scale = Math.max(0.2, 1 - player.captureProgress * 0.4);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
    }

    if (player.isDualFighter) {
      // Draw left ship
      ctx.save();
      ctx.translate(-player.width / 4, 0);
      this.drawSingleShip(ctx, time, player.hasShield);
      ctx.restore();

      // Connecting energy beam / brace
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-player.width / 4, 8);
      ctx.lineTo(player.width / 4, 8);
      ctx.stroke();

      // Energy pulse on connector
      ctx.fillStyle = '#fde047';
      const sparkX = Math.sin(time * 10) * (player.width / 4);
      ctx.fillRect(sparkX - 2, 6, 4, 4);

      // Draw right ship
      ctx.save();
      ctx.translate(player.width / 4, 0);
      this.drawSingleShip(ctx, time, player.hasShield);
      ctx.restore();
    } else {
      this.drawSingleShip(ctx, time, player.hasShield);
    }

    ctx.restore();
  }

  private static drawSingleShip(ctx: CanvasRenderingContext2D, time: number, hasShield: boolean) {
    // Animated thruster flame
    const flameHeight = 8 + Math.sin(time * 25) * 4;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-4, 14);
    ctx.lineTo(0, 14 + flameHeight);
    ctx.lineTo(4, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-2, 14);
    ctx.lineTo(0, 14 + flameHeight * 0.6);
    ctx.lineTo(2, 14);
    ctx.fill();

    // Ship Fuselage - Galaxian White & Red Body
    // Wings (Red with white trim)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(16, 12);
    ctx.lineTo(12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();

    // Wingtips (Yellow accents)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-16, 8, 4, 6);
    ctx.fillRect(12, 8, 4, 6);

    // Center Nose / Cockpit (White body)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(6, 4);
    ctx.lineTo(4, 12);
    ctx.lineTo(-4, 12);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    // Cockpit Window (Cyan glass)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 3);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();

    // Laser cannons tips
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-15, 4, 2, 5);
    ctx.fillRect(13, 4, 2, 5);

    // Shield bubble if active
    if (hasShield) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draw Enemy
   */
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);

    const flutter = Math.sin(time * 12 + enemy.id) * 3;

    switch (enemy.type) {
      case 'DRONE':
        this.drawGreenDrone(ctx, flutter);
        break;
      case 'BEE':
        this.drawYellowBee(ctx, flutter);
        break;
      case 'ESCORT':
        this.drawRedEscort(ctx, flutter);
        break;
      case 'CRUISER':
        this.drawBlueCruiser(ctx, flutter);
        break;
      case 'BOSS':
        this.drawBossCommander(ctx, enemy, flutter, time);
        break;
      default:
        this.drawGreenDrone(ctx, flutter);
        break;
    }

    ctx.restore();
  }

  /**
   * Green Drone (Bottom 2 rows)
   */
  private static drawGreenDrone(ctx: CanvasRenderingContext2D, flutter: number) {
    // Wings
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(12 + flutter, 6);
    ctx.lineTo(8, 10);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-12 - flutter, 6);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-4, -10, 8, 16);

    // Eyes
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-3, -6, 2, 3);
    ctx.fillRect(1, -6, 2, 3);

    // Antennae
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-2, -12, 1, 3);
    ctx.fillRect(1, -12, 1, 3);
  }

  /**
   * Yellow Bee / Stinger
   */
  private static drawYellowBee(ctx: CanvasRenderingContext2D, flutter: number) {
    // Fluttering wings
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(9 + flutter, 0, 5, 8, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(-9 - flutter, 0, 5, 8, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Main yellow body
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(7, -2);
    ctx.lineTo(5, 8);
    ctx.lineTo(0, 12); // stinger
    ctx.lineTo(-5, 8);
    ctx.lineTo(-7, -2);
    ctx.closePath();
    ctx.fill();

    // Black stripes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, 0, 10, 3);
    ctx.fillRect(-4, 5, 8, 2);

    // Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-4, -7, 2, 3);
    ctx.fillRect(2, -7, 2, 3);
  }

  /**
   * Red Escort
   */
  private static drawRedEscort(ctx: CanvasRenderingContext2D, flutter: number) {
    // Swept back red wings
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(14, 2 + flutter);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-14, 2 + flutter);
    ctx.closePath();
    ctx.fill();

    // Yellow wing markings
    ctx.fillStyle = '#fde047';
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillRect(-10, 2, 4, 4);

    // Cockpit / Center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -6, 6, 12);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-2, -8, 4, 4);
  }

  /**
   * Blue Cruiser
   */
  private static drawBlueCruiser(ctx: CanvasRenderingContext2D, flutter: number) {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(13, 6);
    ctx.lineTo(8, 11 + flutter);
    ctx.lineTo(0, 5);
    ctx.lineTo(-8, 11 + flutter);
    ctx.lineTo(-13, 6);
    ctx.closePath();
    ctx.fill();

    // Cyan energy conduits
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(-2, -4, 4, 10);
    ctx.fillRect(-9, 4, 3, 4);
    ctx.fillRect(6, 4, 3, 4);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-2, -9, 4, 3);
  }

  /**
   * Boss Commander (Galaga Boss)
   * Green armor initially, turns Blue/Purple after taking 1 hit!
   */
  private static drawBossCommander(ctx: CanvasRenderingContext2D, enemy: Enemy, flutter: number, time: number) {
    const isDamaged = enemy.health < enemy.maxHealth;
    const bodyColor = isDamaged ? '#3b82f6' : '#22c55e';
    const accentColor = isDamaged ? '#818cf8' : '#eab308';

    // Outer wings / pinchers
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(16 + flutter, -2);
    ctx.lineTo(14, 12);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, 12);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-16 - flutter, -2);
    ctx.closePath();
    ctx.fill();

    // Horns / Spikes on top
    ctx.fillStyle = accentColor;
    ctx.fillRect(-10, -14, 3, 6);
    ctx.fillRect(7, -14, 3, 6);

    // Center Core (Pulsing eye)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, -6, 10, 10);

    const eyeColor = Math.floor(time * 8) % 2 === 0 ? '#ef4444' : '#f97316';
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-3, -4, 6, 6);

    // If holding a captured player ship on top
    if (enemy.capturedFighterId) {
      ctx.save();
      ctx.translate(0, -22);
      ctx.scale(0.85, 0.85);
      this.drawSingleShip(ctx, time, false);
      ctx.restore();
    }
  }

  /**
   * Tractor Beam Visual Cone
   */
  public static drawTractorBeam(ctx: CanvasRenderingContext2D, startX: number, startY: number, screenHeight: number, time: number) {
    const endY = screenHeight - 60;
    const beamSpread = 44;

    ctx.save();

    // Shimmering outer cone gradient
    const grad = ctx.createLinearGradient(startX, startY, startX, endY);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    grad.addColorStop(0.3, 'rgba(234, 179, 8, 0.45)');
    grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.15)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + beamSpread, endY);
    ctx.lineTo(startX - beamSpread, endY);
    ctx.closePath();
    ctx.fill();

    // Oscillating interior rings
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    const ringOffset = (time * 120) % 30;
    for (let y = startY + 15 + ringOffset; y < endY; y += 30) {
      const progress = (y - startY) / (endY - startY);
      const ringWidth = beamSpread * progress;
      ctx.beginPath();
      ctx.ellipse(startX, y, ringWidth, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Giant Stage Mothership
   */
  public static drawMothership(ctx: CanvasRenderingContext2D, boss: BossMothership, time: number) {
    if (!boss.active) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Main hull (Heavy Battleship gray & cyan)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-boss.width / 2, -10);
    ctx.lineTo(boss.width / 2, -10);
    ctx.lineTo(boss.width / 2 - 20, boss.height / 2);
    ctx.lineTo(0, boss.height / 2 + 15);
    ctx.lineTo(-boss.width / 2 + 20, boss.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armor plating lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-boss.width / 4, -10);
    ctx.lineTo(-boss.width / 4 + 10, boss.height / 2 - 5);
    ctx.moveTo(boss.width / 4, -10);
    ctx.lineTo(boss.width / 4 - 10, boss.height / 2 - 5);
    ctx.stroke();

    // Left Cannon
    if (boss.leftCannonAlive) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-boss.width / 2 + 5, boss.height / 2 - 12, 16, 20);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-boss.width / 2 + 10, boss.height / 2 + 8, 6, 8);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-boss.width / 2 + 5, boss.height / 2 - 6, 14, 10);
    }

    // Right Cannon
    if (boss.rightCannonAlive) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(boss.width / 2 - 21, boss.height / 2 - 12, 16, 20);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(boss.width / 2 - 16, boss.height / 2 + 8, 6, 8);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(boss.width / 2 - 19, boss.height / 2 - 6, 14, 10);
    }

    // Glowing Central Reactor Core
    const corePulsing = 12 + Math.sin(time * 6) * 3;
    const coreGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, corePulsing);
    coreGrad.addColorStop(0, '#fde047');
    coreGrad.addColorStop(0.6, '#ef4444');
    coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 4, corePulsing, 0, Math.PI * 2);
    ctx.fill();

    // Energy Shield ripple if active
    if (boss.shieldActive) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 8, boss.width / 2 + 8, boss.height / 2 + 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.restore();
    }

    // Health Bar overhead
    const barWidth = 140;
    const barHeight = 6;
    const hpPct = Math.max(0, boss.health / boss.maxHealth);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barWidth / 2, -26, barWidth, barHeight);
    ctx.fillStyle = hpPct > 0.4 ? '#ef4444' : '#eab308';
    ctx.fillRect(-barWidth / 2, -26, barWidth * hpPct, barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, -26, barWidth, barHeight);

    ctx.restore();
  }

  /**
   * Powerup badge
   */
  public static drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, time: number) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const bounce = Math.sin(time * 8) * 3;
    ctx.translate(0, bounce);

    // Glowing border badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (p.type === 'DOUBLE_SHOT') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('2X', 0, 1);
    } else if (p.type === 'SHIELD') {
      ctx.fillStyle = '#4ade80';
      ctx.fillText('S', 0, 1);
    } else if (p.type === 'BOMB') {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('B', 0, 1);
    } else if (p.type === 'SPREAD') {
      ctx.fillStyle = '#fde047';
      ctx.fillText('W', 0, 1);
    } else {
      ctx.fillStyle = '#a855f7';
      ctx.fillText('⚡', 0, 1);
    }

    ctx.restore();
  }
}
