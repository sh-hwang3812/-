/**
 * Core Game Engine for Galaxy Arcade (갤럭시 아케이드)
 * Handles physics, collision, formation breathing, flight curves,
 * tractor beam capture, dual fighter rescue, boss battles, and audio triggers.
 */

import { sound } from './audio.ts';
import { SpriteRenderer } from './sprites.ts';
import {
  Enemy,
  EnemyType,
  Bullet,
  Particle,
  FloatingText,
  PowerUp,
  Player,
  BossMothership,
  Star,
  GameStats,
  GameState,
  GameSettings,
  BezierPoint,
} from './types.ts';

export class GalaxyEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public width = 480;
  public height = 640;

  // Game Loop
  private animId = 0;
  private lastTime = 0;
  private isRunning = false;

  // State
  public state: GameState = 'MENU';
  public stage = 1;
  public score = 0;
  public highScore = 10000;
  public lives = 3;
  public bombs = 2;

  // Stats
  public stats: GameStats = {
    score: 0,
    highScore: 10000,
    stage: 1,
    shotsFired: 0,
    shotsHit: 0,
    enemiesKilled: 0,
    challengingHits: 0,
    challengingTotal: 40,
    maxCombo: 0,
    currentCombo: 0,
  };

  // Settings
  public settings: GameSettings = {
    soundEnabled: true,
    bgmEnabled: true,
    scanlines: true,
    crtCurvature: true,
    autoFire: false,
    difficulty: 'NORMAL',
  };

  // Entities
  public player: Player;
  public enemies: Enemy[] = [];
  public playerBullets: Bullet[] = [];
  public enemyBullets: Bullet[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public powerUps: PowerUp[] = [];
  public stars: Star[] = [];
  public boss: BossMothership;

  // Formation & Dive Timers
  private formationOffsetX = 0;
  private formationDirection = 1;
  private formationTime = 0;
  private diveTimer = 0;
  private nextDiveInterval = 2.0;
  private capturedFighterActive = false;

  // Challenging Stage Wave Timers
  private challengeWave = 0;
  private challengeWaveTimer = 0;
  private challengeTotalEnemies = 0;

  // Input states
  public keys: { [key: string]: boolean } = {};
  public fireCooldown = 0;
  private autoFireTimer = 0;

  // Visual effects
  public screenShake = 0;
  public warpEffect = false;
  private stageIntroTimer = 0;
  private stageClearTimer = 0;

  // Callback to inform React
  public onStateChange?: (state: GameState, stats: GameStats, lives: number, bombs: number) => void;
  public onGameOver?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.player = this.createDefaultPlayer();
    this.boss = this.createDefaultBoss();
    this.initStars();

    // Load High score from localStorage if available
    try {
      const savedHigh = localStorage.getItem('galaxy_arcade_highscore');
      if (savedHigh) {
        this.highScore = parseInt(savedHigh, 10) || 10000;
        this.stats.highScore = this.highScore;
      }
    } catch {
      // ignore
    }
  }

  private createDefaultPlayer(): Player {
    return {
      x: this.width / 2,
      y: this.height - 48,
      width: 32,
      height: 32,
      speed: 260,
      lives: 3,
      bombs: 2,
      invulnerableTime: 0,
      isDualFighter: false,
      hasShield: false,
      spreadShot: false,
      rapidFire: false,
      isCaptured: false,
      captureProgress: 0,
    };
  }

  private createDefaultBoss(): BossMothership {
    return {
      active: false,
      x: this.width / 2,
      y: 90,
      vx: 60,
      width: 140,
      height: 50,
      health: 80,
      maxHealth: 80,
      leftCannonAlive: true,
      leftCannonHealth: 25,
      rightCannonAlive: true,
      rightCannonHealth: 25,
      shieldActive: true,
      attackPattern: 0,
      attackTimer: 0,
    };
  }

  private initStars() {
    this.stars = [];
    const colors = ['#ffffff', '#67e8f9', '#fde047', '#f472b6', '#cbd5e1'];
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 15 + Math.random() * 55,
        size: Math.random() < 0.25 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Start or Restart New Game
   */
  public startNewGame(difficulty = 'NORMAL') {
    this.stage = 1;
    this.score = 0;
    this.lives = 3;
    this.bombs = 2;
    this.settings.difficulty = difficulty as 'EASY' | 'NORMAL' | 'HARD';

    this.stats = {
      score: 0,
      highScore: this.highScore,
      stage: 1,
      shotsFired: 0,
      shotsHit: 0,
      enemiesKilled: 0,
      challengingHits: 0,
      challengingTotal: 40,
      maxCombo: 0,
      currentCombo: 0,
    };

    this.player = this.createDefaultPlayer();
    this.startStage(1);
    this.startLoop();
  }

  /**
   * Start a specific stage
   */
  public startStage(stageNum: number) {
    this.stage = stageNum;
    this.stats.stage = stageNum;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.powerUps = [];
    this.player.isCaptured = false;
    this.player.captureProgress = 0;
    this.player.invulnerableTime = 2.5;

    // Reset player position
    this.player.x = this.width / 2;
    this.player.y = this.height - 48;

    // Stage 3, 6, 9... is Challenging Stage!
    if (stageNum % 3 === 0 && stageNum % 5 !== 0) {
      this.state = 'CHALLENGING_STAGE';
      this.initChallengingStage();
      sound.playStageStart();
      this.notifyState();
      return;
    }

    // Stage 5, 10, 15... is Giant Mothership Boss!
    if (stageNum % 5 === 0) {
      this.state = 'BOSS_BATTLE';
      this.initBossStage();
      sound.playStageStart();
      this.notifyState();
      return;
    }

    // Regular Formation Stage
    this.state = 'READY';
    this.stageIntroTimer = 2.0;
    this.initFormationEnemies();
    sound.playStageStart();
    this.notifyState();
  }

  /**
   * Create standard Galaga / Galaxian formation
   */
  private initFormationEnemies() {
    this.enemies = [];
    let idCounter = 1;

    // Row definitions:
    // Row 0: 4 Boss Commanders
    // Row 1: 8 Red Escorts
    // Row 2: 10 Blue Cruisers
    // Row 3: 10 Yellow Bees
    // Row 4: 10 Green Drones
    const rows = [
      { type: 'BOSS' as EnemyType, count: 4, y: 70, score: 150, hp: 2 },
      { type: 'ESCORT' as EnemyType, count: 8, y: 105, score: 80, hp: 1 },
      { type: 'CRUISER' as EnemyType, count: 10, y: 135, score: 100, hp: 1 },
      { type: 'BEE' as EnemyType, count: 10, y: 165, score: 50, hp: 1 },
      { type: 'DRONE' as EnemyType, count: 10, y: 195, score: 30, hp: 1 },
    ];

    rows.forEach((rowDef, rowIndex) => {
      const spacingX = this.width / (rowDef.count + 1);
      for (let col = 0; col < rowDef.count; col++) {
        const formationX = spacingX * (col + 1);
        const formationY = rowDef.y;

        // Entry loop path from offscreen
        const startFromLeft = (col + rowIndex) % 2 === 0;
        const startX = startFromLeft ? -30 : this.width + 30;
        const startY = 40 + rowIndex * 20;

        const path: BezierPoint[] = [
          { x: startX, y: startY },
          { x: startFromLeft ? this.width * 0.75 : this.width * 0.25, y: 240 },
          { x: startFromLeft ? this.width * 0.2 : this.width * 0.8, y: 320 },
          { x: formationX, y: formationY },
        ];

        this.enemies.push({
          id: idCounter++,
          type: rowDef.type,
          x: startX,
          y: startY,
          width: 24,
          height: 24,
          row: rowIndex,
          col,
          formationX,
          formationY,
          state: 'ENTERING',
          health: rowDef.hp,
          maxHealth: rowDef.hp,
          scoreValue: rowDef.score,
          angle: Math.PI,
          animFrame: 0,
          path,
          pathProgress: 0,
          pathSpeed: 0.65 + Math.random() * 0.25,
          shootCooldown: 3 + Math.random() * 4,
          hasTractorBeam: rowDef.type === 'BOSS',
          tractorTimer: 0,
        });
      }
    });

    this.diveTimer = 2.0;
  }

  /**
   * Challenging Stage (보너스 스테이지)
   */
  private initChallengingStage() {
    this.enemies = [];
    this.challengeWave = 0;
    this.challengeWaveTimer = 0.5;
    this.challengeTotalEnemies = 40;
    this.stats.challengingHits = 0;
    this.stats.challengingTotal = 40;
  }

  private spawnChallengeWave(waveIndex: number) {
    let idCounter = 1000 + waveIndex * 20;
    const count = 8;
    const types: EnemyType[] = ['BEE', 'DRONE', 'ESCORT', 'CRUISER', 'BOSS'];
    const waveType = types[waveIndex % types.length];

    for (let i = 0; i < count; i++) {
      const delay = i * 0.16;
      let path: BezierPoint[] = [];

      if (waveIndex % 2 === 0) {
        // Curve from top left down, loop around right, exit top
        path = [
          { x: 30, y: -20 },
          { x: 100, y: 260 },
          { x: 380, y: 320 },
          { x: 420, y: 160 },
          { x: 200, y: -40 },
        ];
      } else {
        // Curve from top right, double figure-8 loop, exit bottom
        path = [
          { x: this.width - 30, y: -20 },
          { x: this.width - 120, y: 280 },
          { x: 80, y: 220 },
          { x: 260, y: 440 },
          { x: 240, y: this.height + 40 },
        ];
      }

      this.enemies.push({
        id: idCounter++,
        type: waveType,
        x: path[0].x,
        y: path[0].y,
        width: 24,
        height: 24,
        row: 0,
        col: i,
        formationX: 0,
        formationY: 0,
        state: 'CHALLENGE_SWOOP',
        health: 1,
        maxHealth: 1,
        scoreValue: 100,
        angle: 0,
        animFrame: 0,
        path,
        pathProgress: -delay, // delay entry
        pathSpeed: 0.45,
        shootCooldown: 9999, // no shooting in challenging stage
      });
    }
  }

  /**
   * Giant Mothership Boss Stage
   */
  private initBossStage() {
    this.enemies = [];
    this.boss = {
      active: true,
      x: this.width / 2,
      y: 95,
      vx: 75,
      width: 140,
      height: 55,
      health: 90 + this.stage * 15,
      maxHealth: 90 + this.stage * 15,
      leftCannonAlive: true,
      leftCannonHealth: 30,
      rightCannonAlive: true,
      rightCannonHealth: 30,
      shieldActive: true,
      attackPattern: 0,
      attackTimer: 1.5,
    };
  }

  /**
   * Main Loop
   */
  public startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      if (this.isRunning) {
        this.animId = requestAnimationFrame(loop);
      }
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  /**
   * Update Engine State
   */
  private update(dt: number) {
    const time = performance.now() / 1000;

    // Update Stars
    const starSpeedMult = this.warpEffect ? 6.5 : 1.0;
    this.stars.forEach((star) => {
      star.y += star.speed * dt * starSpeedMult;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      star.twinkle += dt * 3;
    });

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 18);
    }

    // State specific updates
    if (this.state === 'READY') {
      this.stageIntroTimer -= dt;
      if (this.stageIntroTimer <= 0) {
        this.state = 'PLAYING';
        this.notifyState();
      }
    } else if (this.state === 'STAGE_CLEAR') {
      this.stageClearTimer -= dt;
      if (this.stageClearTimer <= 0) {
        this.warpEffect = false;
        this.startStage(this.stage + 1);
      }
      return;
    }

    // Update Player & Controls
    this.updatePlayer(dt);

    // Update Bullets
    this.updateBullets(dt);

    // Update PowerUps
    this.updatePowerUps(dt);

    // Update Particles & Floating Text
    this.updateEffects(dt);

    // Update Enemies & Formations
    if (this.state === 'PLAYING') {
      this.updateFormation(dt);
      this.updateEnemies(dt);
      this.checkStageClearCondition();
    } else if (this.state === 'CHALLENGING_STAGE') {
      this.updateChallengingStage(dt);
    } else if (this.state === 'BOSS_BATTLE') {
      this.updateBossBattle(dt);
    }

    // Collision Detections
    this.checkCollisions();
  }

  /**
   * Player Movement and Fire
   */
  private updatePlayer(dt: number) {
    if (this.player.isCaptured) {
      // Sucking into tractor beam
      if (this.player.tractorTargetX !== undefined && this.player.tractorTargetY !== undefined) {
        const dx = this.player.tractorTargetX - this.player.x;
        const dy = this.player.tractorTargetY - this.player.y;
        this.player.x += dx * dt * 2.5;
        this.player.y += dy * dt * 2.5;
        this.player.captureProgress += dt * 0.8;

        if (this.player.captureProgress >= 1.0) {
          // Completed capture
          this.handlePlayerCaptured();
        }
      }
      return;
    }

    // Invulnerability decay
    if (this.player.invulnerableTime > 0) {
      this.player.invulnerableTime = Math.max(0, this.player.invulnerableTime - dt);
    }

    // Movement
    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      moveDir -= 1;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      moveDir += 1;
    }

    const shipHalfWidth = this.player.isDualFighter ? 28 : 16;
    this.player.x += moveDir * this.player.speed * dt;
    this.player.x = Math.max(shipHalfWidth, Math.min(this.width - shipHalfWidth, this.player.x));

    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    }

    // Auto fire or manual fire
    const wantFire = this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['j'] || this.keys['z'] || this.settings.autoFire;
    const cooldownRate = this.player.rapidFire ? 0.12 : 0.22;

    if (wantFire && this.fireCooldown <= 0) {
      this.fireLaser();
      this.fireCooldown = cooldownRate;
    }
  }

  /**
   * Fire Player Laser
   */
  public fireLaser() {
    if (this.player.isCaptured || this.state === 'READY' || this.state === 'STAGE_CLEAR' || this.state === 'GAME_OVER') return;

    this.stats.shotsFired++;
    sound.playLaser(this.player.isDualFighter);

    const bulletSpeed = -480;

    if (this.player.isDualFighter) {
      // 4 lasers from dual mounts!
      const leftX = this.player.x - 18;
      const rightX = this.player.x + 18;

      this.playerBullets.push(
        { id: Math.random(), x: leftX - 4, y: this.player.y - 12, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#38bdf8', damage: 1 },
        { id: Math.random(), x: leftX + 4, y: this.player.y - 12, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#38bdf8', damage: 1 },
        { id: Math.random(), x: rightX - 4, y: this.player.y - 12, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#38bdf8', damage: 1 },
        { id: Math.random(), x: rightX + 4, y: this.player.y - 12, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#38bdf8', damage: 1 }
      );
    } else if (this.player.spreadShot) {
      // 3-way spread
      this.playerBullets.push(
        { id: Math.random(), x: this.player.x, y: this.player.y - 14, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#fde047', damage: 1 },
        { id: Math.random(), x: this.player.x, y: this.player.y - 14, vx: -120, vy: bulletSpeed * 0.95, width: 3, height: 10, isPlayer: true, color: '#fde047', damage: 1 },
        { id: Math.random(), x: this.player.x, y: this.player.y - 14, vx: 120, vy: bulletSpeed * 0.95, width: 3, height: 10, isPlayer: true, color: '#fde047', damage: 1 }
      );
    } else {
      // Standard twin lasers
      this.playerBullets.push(
        { id: Math.random(), x: this.player.x - 6, y: this.player.y - 14, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#ef4444', damage: 1 },
        { id: Math.random(), x: this.player.x + 6, y: this.player.y - 14, vx: 0, vy: bulletSpeed, width: 3, height: 12, isPlayer: true, color: '#ef4444', damage: 1 }
      );
    }
  }

  /**
   * Use EMP Smart Bomb
   */
  public triggerBomb() {
    if (this.bombs <= 0 || this.player.isCaptured || this.state === 'GAME_OVER') return;

    this.bombs--;
    sound.playBomb();
    this.screenShake = 16;

    // Clear all enemy bullets
    this.enemyBullets = [];

    // Deal massive damage to diving enemies or boss
    this.enemies.forEach((enemy) => {
      if (enemy.state === 'DIVING' || enemy.state === 'TRACTOR_BEAM' || enemy.state === 'CHALLENGE_SWOOP') {
        enemy.health -= 2;
        this.createExplosion(enemy.x, enemy.y, '#fde047', 15);
      }
    });

    if (this.boss.active) {
      this.boss.health -= 15;
      this.createExplosion(this.boss.x, this.boss.y, '#38bdf8', 25);
    }

    this.floatingTexts.push({
      id: Math.random(),
      text: 'EMP BLAST!',
      x: this.width / 2,
      y: this.height / 2,
      color: '#38bdf8',
      alpha: 1.0,
      vy: -30,
      size: 16,
    });

    this.notifyState();
  }

  /**
   * Formation Movement & Breathing
   */
  private updateFormation(dt: number) {
    this.formationTime += dt;
    this.formationOffsetX += this.formationDirection * 35 * dt;

    if (Math.abs(this.formationOffsetX) > 28) {
      this.formationDirection *= -1;
    }

    // Formation breath amplitude
    const breath = Math.sin(this.formationTime * 2) * 4;

    this.enemies.forEach((enemy) => {
      if (enemy.state === 'FORMATION') {
        enemy.x = enemy.formationX + this.formationOffsetX;
        enemy.y = enemy.formationY + breath;
        enemy.angle = Math.PI; // Face downward
      }
    });

    // Dive trigger schedule
    this.diveTimer -= dt;
    if (this.diveTimer <= 0) {
      this.triggerEnemyDive();
      // Speed up dives as stage increases
      const baseInterval = Math.max(0.8, 2.2 - this.stage * 0.15);
      this.diveTimer = baseInterval + Math.random() * 0.8;
    }
  }

  /**
   * Pick enemies to dive-bomb
   */
  private triggerEnemyDive() {
    const formationEnemies = this.enemies.filter((e) => e.state === 'FORMATION');
    if (formationEnemies.length === 0) return;

    // Favor picking a Boss or Bee
    const boss = formationEnemies.find((e) => e.type === 'BOSS');
    const pickBoss = boss && Math.random() < 0.35;

    if (pickBoss && boss) {
      // Boss swoops with 1 or 2 Red Escorts!
      sound.playDiveSound(true);
      this.startDivePath(boss, true);

      // Grab up to 2 escorts
      const escorts = formationEnemies.filter((e) => e.type === 'ESCORT').slice(0, 2);
      escorts.forEach((escort, i) => {
        const offsetSign = i === 0 ? -1 : 1;
        this.startDivePath(escort, false, offsetSign * 24);
      });
    } else {
      // Pick 1 to 2 random regular enemies
      const count = Math.min(formationEnemies.length, Math.random() < 0.4 ? 2 : 1);
      for (let i = 0; i < count; i++) {
        const target = formationEnemies[Math.floor(Math.random() * formationEnemies.length)];
        sound.playDiveSound(false);
        this.startDivePath(target, false);
      }
    }
  }

  /**
   * Generate Bézier curve dive path towards player
   */
  private startDivePath(enemy: Enemy, canTractor = false, xOffset = 0) {
    enemy.state = 'DIVING';
    enemy.pathProgress = 0;
    enemy.pathSpeed = (0.35 + Math.random() * 0.2) * (1 + this.stage * 0.05);

    const startX = enemy.x;
    const startY = enemy.y;
    const pX = this.player.x + xOffset;

    // Check if boss should trigger tractor beam
    const shouldTractor = canTractor && !this.player.isCaptured && !this.capturedFighterActive && Math.random() < 0.4;
    enemy.isCapturing = shouldTractor;

    if (shouldTractor) {
      // Stop mid screen at y=230 to cast tractor beam
      enemy.path = [
        { x: startX, y: startY },
        { x: startX + (pX > startX ? 40 : -40), y: 140 },
        { x: pX, y: 220 },
      ];
    } else {
      // Full swooping loop down through player and loop around
      const loopSide = Math.random() < 0.5 ? -1 : 1;
      enemy.path = [
        { x: startX, y: startY },
        { x: startX + loopSide * 100, y: 180 },
        { x: pX, y: 380 },
        { x: pX - loopSide * 80, y: this.height + 40 },
      ];
    }
  }

  /**
   * Update Enemy Movement along Bézier curves
   */
  private updateEnemies(dt: number) {
    this.enemies.forEach((enemy) => {
      // Entering stage wave
      if (enemy.state === 'ENTERING') {
        enemy.pathProgress += enemy.pathSpeed * dt;
        if (enemy.pathProgress >= 1.0) {
          enemy.state = 'FORMATION';
          enemy.x = enemy.formationX;
          enemy.y = enemy.formationY;
          enemy.angle = Math.PI;
        } else {
          this.calculateBezierPoint(enemy);
        }
      } else if (enemy.state === 'DIVING') {
        enemy.pathProgress += enemy.pathSpeed * dt;

        // Shoot bullets while diving
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0 && enemy.y < this.height - 120) {
          this.enemyShoot(enemy);
          enemy.shootCooldown = 1.8 + Math.random() * 1.5;
        }

        if (enemy.pathProgress >= 1.0) {
          if (enemy.isCapturing) {
            // Activate tractor beam
            enemy.state = 'TRACTOR_BEAM';
            enemy.tractorTimer = 4.0;
            sound.playTractorBeam();
          } else {
            // Loop back to top of screen
            enemy.state = 'RETURNING';
            enemy.y = -20;
            enemy.x = enemy.formationX;
            enemy.angle = Math.PI;
          }
        } else {
          this.calculateBezierPoint(enemy);
        }
      } else if (enemy.state === 'TRACTOR_BEAM') {
        // Tractor beam active
        if (enemy.tractorTimer !== undefined) {
          enemy.tractorTimer -= dt;

          // Check if player is caught in cone
          const beamWidth = 44;
          const inBeamX = Math.abs(this.player.x - enemy.x) < beamWidth;
          const belowBoss = this.player.y > enemy.y;

          if (inBeamX && belowBoss && !this.player.isCaptured && this.player.invulnerableTime <= 0) {
            // Player caught!
            this.player.isCaptured = true;
            this.player.captureProgress = 0;
            this.player.tractorTargetX = enemy.x;
            this.player.tractorTargetY = enemy.y - 18;
            enemy.capturedFighterId = 999;
          }

          if (enemy.tractorTimer <= 0 || this.player.isCaptured) {
            // Return to top
            enemy.state = 'RETURNING';
            enemy.y = -20;
            enemy.x = enemy.formationX;
          }
        }
      } else if (enemy.state === 'RETURNING') {
        // Fly straight down into formation
        enemy.y += 180 * dt;
        if (enemy.y >= enemy.formationY) {
          enemy.state = 'FORMATION';
          enemy.y = enemy.formationY;
        }
      }
    });
  }

  /**
   * Calculate point and heading on Bézier curve
   */
  private calculateBezierPoint(enemy: Enemy) {
    const t = Math.max(0, Math.min(1, enemy.pathProgress));
    const p = enemy.path;
    if (p.length < 2) return;

    let currX = 0;
    let currY = 0;

    if (p.length === 3) {
      // Quadratic
      const u = 1 - t;
      currX = u * u * p[0].x + 2 * u * t * p[1].x + t * t * p[2].x;
      currY = u * u * p[0].y + 2 * u * t * p[1].y + t * t * p[2].y;
    } else if (p.length >= 4) {
      // Cubic
      const u = 1 - t;
      currX = u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x;
      currY = u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y;
    }

    // Set heading angle
    const dx = currX - enemy.x;
    const dy = currY - enemy.y;
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      enemy.angle = Math.atan2(dy, dx) - Math.PI / 2;
    }

    enemy.x = currX;
    enemy.y = currY;
  }

  /**
   * Enemy Shoot
   */
  private enemyShoot(enemy: Enemy) {
    if (this.state === 'CHALLENGING_STAGE') return;
    sound.playEnemyLaser();

    // Aimed bullet towards player
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    const speed = 210 + this.stage * 12;

    this.enemyBullets.push({
      id: Math.random(),
      x: enemy.x,
      y: enemy.y + 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      width: 4,
      height: 8,
      isPlayer: false,
      color: '#f97316',
      damage: 1,
    });
  }

  /**
   * Challenging Stage Wave Management
   */
  private updateChallengingStage(dt: number) {
    this.challengeWaveTimer -= dt;
    if (this.challengeWaveTimer <= 0 && this.challengeWave < 5) {
      this.spawnChallengeWave(this.challengeWave);
      this.challengeWave++;
      this.challengeWaveTimer = 3.2;
    }

    // Update swoop flight
    this.enemies.forEach((enemy) => {
      enemy.pathProgress += enemy.pathSpeed * dt;
      if (enemy.pathProgress > 0) {
        this.calculateBezierPoint(enemy);
      }
    });

    // Remove enemies that completed flight
    this.enemies = this.enemies.filter((e) => e.pathProgress < 1.05);

    // If all waves finished and no enemies remain
    if (this.challengeWave >= 5 && this.enemies.length === 0) {
      this.finishChallengingStage();
    }
  }

  private finishChallengingStage() {
    const hits = this.stats.challengingHits;
    const isPerfect = hits >= 40;
    const bonus = isPerfect ? 10000 : hits * 100;

    this.score += bonus;
    this.stats.score = this.score;

    if (isPerfect) {
      sound.playPerfect();
      this.floatingTexts.push({
        id: Math.random(),
        text: 'PERFECT 10,000 PTS!',
        x: this.width / 2,
        y: this.height / 2 - 20,
        color: '#fde047',
        alpha: 1.0,
        vy: -20,
        size: 18,
      });
    } else {
      this.floatingTexts.push({
        id: Math.random(),
        text: `BONUS +${bonus}`,
        x: this.width / 2,
        y: this.height / 2,
        color: '#38bdf8',
        alpha: 1.0,
        vy: -20,
        size: 16,
      });
    }

    this.warpEffect = true;
    this.state = 'STAGE_CLEAR';
    this.stageClearTimer = 3.0;
    this.notifyState();
  }

  /**
   * Boss Battle Updates
   */
  private updateBossBattle(dt: number) {
    if (!this.boss.active) return;

    // Sway horizontally
    this.boss.x += this.boss.vx * dt;
    if (this.boss.x > this.width - this.boss.width / 2 - 10) {
      this.boss.x = this.width - this.boss.width / 2 - 10;
      this.boss.vx = -Math.abs(this.boss.vx);
    } else if (this.boss.x < this.boss.width / 2 + 10) {
      this.boss.x = this.boss.width / 2 + 10;
      this.boss.vx = Math.abs(this.boss.vx);
    }

    // Attack cooldown
    this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      this.bossAttackPattern();
      this.boss.attackTimer = 1.6 + Math.random() * 0.8;
    }
  }

  private bossAttackPattern() {
    sound.playEnemyLaser();
    const pattern = Math.floor(Math.random() * 3);

    if (pattern === 0 && (this.boss.leftCannonAlive || this.boss.rightCannonAlive)) {
      // Twin barrage from alive cannons
      if (this.boss.leftCannonAlive) {
        this.enemyBullets.push({
          id: Math.random(),
          x: this.boss.x - this.boss.width / 2 + 12,
          y: this.boss.y + 25,
          vx: -40,
          vy: 240,
          width: 5,
          height: 12,
          isPlayer: false,
          color: '#ef4444',
          damage: 1,
        });
      }
      if (this.boss.rightCannonAlive) {
        this.enemyBullets.push({
          id: Math.random(),
          x: this.boss.x + this.boss.width / 2 - 12,
          y: this.boss.y + 25,
          vx: 40,
          vy: 240,
          width: 5,
          height: 12,
          isPlayer: false,
          color: '#ef4444',
          damage: 1,
        });
      }
    } else if (pattern === 1) {
      // 5-way spread fan from reactor core
      for (let angle = -0.5; angle <= 0.5; angle += 0.25) {
        this.enemyBullets.push({
          id: Math.random(),
          x: this.boss.x,
          y: this.boss.y + 20,
          vx: Math.sin(angle) * 220,
          vy: Math.cos(angle) * 220,
          width: 4,
          height: 10,
          isPlayer: false,
          color: '#f59e0b',
          damage: 1,
        });
      }
    } else {
      // Spawn two defensive escort bees
      if (this.enemies.length < 6) {
        this.enemies.push({
          id: Math.random(),
          type: 'BEE',
          x: this.boss.x,
          y: this.boss.y + 30,
          width: 24,
          height: 24,
          row: 0,
          col: 0,
          formationX: this.boss.x,
          formationY: this.boss.y,
          state: 'DIVING',
          health: 1,
          maxHealth: 1,
          scoreValue: 100,
          angle: Math.PI,
          animFrame: 0,
          path: [
            { x: this.boss.x, y: this.boss.y + 30 },
            { x: this.player.x, y: 360 },
            { x: Math.random() * this.width, y: this.height + 20 },
          ],
          pathProgress: 0,
          pathSpeed: 0.5,
          shootCooldown: 1.5,
        });
      }
    }
  }

  /**
   * Update Bullets
   */
  private updateBullets(dt: number) {
    // Player bullets
    this.playerBullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    this.playerBullets = this.playerBullets.filter((b) => b.y > -20 && b.y < this.height + 20);

    // Enemy bullets
    this.enemyBullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    this.enemyBullets = this.enemyBullets.filter((b) => b.y > -20 && b.y < this.height + 20);
  }

  /**
   * Update Powerups
   */
  private updatePowerUps(dt: number) {
    this.powerUps.forEach((p) => {
      p.y += p.vy * dt;
    });
    this.powerUps = this.powerUps.filter((p) => p.y < this.height + 30);
  }

  /**
   * Update Visual Particles & Floating Text
   */
  private updateEffects(dt: number) {
    // Particles
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
    });
    this.particles = this.particles.filter((p) => p.alpha > 0);

    // Floating text
    this.floatingTexts.forEach((ft) => {
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.7;
    });
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.alpha > 0);
  }

  /**
   * Check Collisions
   */
  private checkCollisions() {
    // 1. Player Bullets vs Enemies
    this.playerBullets.forEach((bullet) => {
      // Regular enemies
      this.enemies.forEach((enemy) => {
        if (enemy.health <= 0) return;
        const hitDist = (enemy.width + bullet.width) / 2;
        if (Math.abs(bullet.x - enemy.x) < hitDist && Math.abs(bullet.y - enemy.y) < hitDist) {
          bullet.y = -999; // destroy bullet
          this.stats.shotsHit++;
          enemy.health -= bullet.damage;

          if (enemy.health <= 0) {
            this.handleEnemyDestroyed(enemy);
          } else {
            // Damaged boss color change
            sound.playHit();
            this.createExplosion(enemy.x, enemy.y, '#38bdf8', 6);
          }
        }
      });

      // Boss Mothership
      if (this.boss.active && this.boss.health > 0) {
        // Core hit
        const coreHit = Math.abs(bullet.x - this.boss.x) < 32 && Math.abs(bullet.y - this.boss.y) < 25;
        if (coreHit) {
          bullet.y = -999;
          this.stats.shotsHit++;
          this.boss.health -= bullet.damage;
          sound.playHit();
          this.createExplosion(bullet.x, bullet.y, '#fde047', 4);

          if (this.boss.health <= 0) {
            this.handleBossDestroyed();
          }
        }
      }
    });

    // 2. Enemy Bullets vs Player
    if (!this.player.isCaptured && this.player.invulnerableTime <= 0) {
      const hitRadius = this.player.isDualFighter ? 24 : 14;

      this.enemyBullets.forEach((bullet) => {
        if (Math.abs(bullet.x - this.player.x) < hitRadius && Math.abs(bullet.y - this.player.y) < 14) {
          bullet.y = 9999; // destroy bullet
          this.handlePlayerHit();
        }
      });

      // Enemy ships vs Player collision
      this.enemies.forEach((enemy) => {
        if (enemy.health <= 0) return;
        if (Math.abs(enemy.x - this.player.x) < hitRadius + 10 && Math.abs(enemy.y - this.player.y) < 20) {
          this.handleEnemyDestroyed(enemy);
          this.handlePlayerHit();
        }
      });
    }

    // 3. Player vs PowerUps
    this.powerUps.forEach((p) => {
      if (Math.abs(p.x - this.player.x) < 24 && Math.abs(p.y - this.player.y) < 24) {
        p.y = 9999; // collected
        this.applyPowerUp(p.type);
      }
    });
  }

  /**
   * Handle Enemy Destroyed
   */
  private handleEnemyDestroyed(enemy: Enemy) {
    this.stats.enemiesKilled++;
    this.stats.currentCombo++;
    if (this.stats.currentCombo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.currentCombo;
    }

    // Challenging Stage hit tracking
    if (this.state === 'CHALLENGING_STAGE') {
      this.stats.challengingHits++;
    }

    // Score calculation
    let pts = enemy.scoreValue;
    if (enemy.state === 'DIVING' || enemy.state === 'TRACTOR_BEAM') {
      pts = enemy.type === 'BOSS' ? 400 : enemy.scoreValue * 2;
    }

    this.addScore(pts);
    sound.playExplosion(enemy.type === 'BOSS' ? 'med' : 'small');
    this.createExplosion(enemy.x, enemy.y, enemy.type === 'BOSS' ? '#38bdf8' : '#ef4444', 18);

    // Floating score popup
    this.floatingTexts.push({
      id: Math.random(),
      text: `+${pts}`,
      x: enemy.x,
      y: enemy.y,
      color: pts >= 400 ? '#fde047' : '#ffffff',
      alpha: 1.0,
      vy: -25,
      size: 11,
    });

    // Check if liberated captured player fighter!
    if (enemy.capturedFighterId && enemy.state === 'DIVING') {
      this.liberateCapturedFighter(enemy.x, enemy.y);
    }

    // Occasional Powerup drop (8% chance)
    if (Math.random() < 0.08 && this.state !== 'CHALLENGING_STAGE') {
      const types: PowerUp['type'][] = ['DOUBLE_SHOT', 'SHIELD', 'BOMB', 'SPREAD', 'SPEED'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.powerUps.push({
        id: Math.random(),
        x: enemy.x,
        y: enemy.y,
        vy: 110,
        type: chosen,
        duration: 12,
      });
    }

    // Remove from array
    this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
  }

  /**
   * Liberate Captured Fighter -> DUAL FIGHTER!
   */
  private liberateCapturedFighter(x: number, y: number) {
    sound.playDualFighterConnected();
    this.player.isDualFighter = true;
    this.capturedFighterActive = false;
    this.addScore(1000);

    this.floatingTexts.push({
      id: Math.random(),
      text: 'DUAL FIGHTER RESCUED!',
      x: this.width / 2,
      y: this.height / 2 - 40,
      color: '#38bdf8',
      alpha: 1.0,
      vy: -20,
      size: 14,
    });
  }

  /**
   * Handle Player Captured by Boss Tractor Beam
   */
  private handlePlayerCaptured() {
    this.capturedFighterActive = true;
    this.player.isCaptured = false;
    this.player.captureProgress = 0;
    this.player.isDualFighter = false;
    this.lives--;

    this.floatingTexts.push({
      id: Math.random(),
      text: 'FIGHTER CAPTURED!',
      x: this.width / 2,
      y: this.height / 2,
      color: '#ef4444',
      alpha: 1.0,
      vy: -20,
      size: 14,
    });

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Spawn new player ship
      this.player.x = this.width / 2;
      this.player.y = this.height - 48;
      this.player.invulnerableTime = 3.0;
    }

    this.notifyState();
  }

  /**
   * Handle Boss Mothership Destroyed
   */
  private handleBossDestroyed() {
    this.boss.active = false;
    this.screenShake = 22;
    sound.playExplosion('boss');
    this.addScore(5000);

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.createExplosion(this.boss.x + (Math.random() * 80 - 40), this.boss.y + (Math.random() * 40 - 20), '#fde047', 25);
        sound.playExplosion('med');
      }, i * 150);
    }

    this.floatingTexts.push({
      id: Math.random(),
      text: 'MOTHERSHIP ANNIHILATED!',
      x: this.width / 2,
      y: this.height / 2 - 30,
      color: '#fde047',
      alpha: 1.0,
      vy: -20,
      size: 16,
    });

    this.warpEffect = true;
    this.state = 'STAGE_CLEAR';
    this.stageClearTimer = 3.0;
    this.notifyState();
  }

  /**
   * Handle Player Hit
   */
  private handlePlayerHit() {
    // If shield active, shield absorbs hit!
    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.player.invulnerableTime = 1.5;
      sound.playExplosion('small');
      this.createExplosion(this.player.x, this.player.y, '#38bdf8', 12);
      return;
    }

    // If dual fighter, lose one ship!
    if (this.player.isDualFighter) {
      this.player.isDualFighter = false;
      this.player.invulnerableTime = 2.0;
      sound.playExplosion('med');
      this.createExplosion(this.player.x + 16, this.player.y, '#ef4444', 16);
      return;
    }

    // Single fighter destroyed
    this.lives--;
    this.screenShake = 14;
    sound.playExplosion('med');
    this.createExplosion(this.player.x, this.player.y, '#ef4444', 25);

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Respawn
      this.player.x = this.width / 2;
      this.player.y = this.height - 48;
      this.player.invulnerableTime = 3.0;
      this.player.spreadShot = false;
      this.player.rapidFire = false;
    }

    this.notifyState();
  }

  /**
   * Power-up application
   */
  private applyPowerUp(type: PowerUp['type']) {
    sound.playPowerup();
    if (type === 'DOUBLE_SHOT') {
      this.player.rapidFire = true;
      this.addScore(200);
    } else if (type === 'SHIELD') {
      this.player.hasShield = true;
      this.addScore(200);
    } else if (type === 'BOMB') {
      this.bombs = Math.min(5, this.bombs + 1);
      this.addScore(300);
    } else if (type === 'SPREAD') {
      this.player.spreadShot = true;
      this.addScore(200);
    } else if (type === 'SPEED') {
      this.player.speed = 320;
      this.addScore(150);
    }

    this.floatingTexts.push({
      id: Math.random(),
      text: type.replace('_', ' '),
      x: this.player.x,
      y: this.player.y - 20,
      color: '#4ade80',
      alpha: 1.0,
      vy: -20,
      size: 11,
    });

    this.notifyState();
  }

  /**
   * Score and Milestone check
   */
  private addScore(pts: number) {
    const prevScore = this.score;
    this.score += pts;
    this.stats.score = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.stats.highScore = this.highScore;
      try {
        localStorage.setItem('galaxy_arcade_highscore', this.highScore.toString());
      } catch {
        // ignore
      }
    }

    // Milestone extra life at 20,000 pts
    if (prevScore < 20000 && this.score >= 20000) {
      this.lives++;
      sound.playPerfect();
      this.floatingTexts.push({
        id: Math.random(),
        text: '1UP EXTRA LIFE!',
        x: this.width / 2,
        y: this.height / 2,
        color: '#fde047',
        alpha: 1.0,
        vy: -20,
        size: 15,
      });
      this.notifyState();
    }
  }

  /**
   * Stage Clear Condition Check
   */
  private checkStageClearCondition() {
    if (this.enemies.length === 0 && this.state === 'PLAYING') {
      this.warpEffect = true;
      this.state = 'STAGE_CLEAR';
      this.stageClearTimer = 2.5;
      sound.playStageStart();

      this.floatingTexts.push({
        id: Math.random(),
        text: `STAGE ${this.stage} CLEAR!`,
        x: this.width / 2,
        y: this.height / 2 - 20,
        color: '#38bdf8',
        alpha: 1.0,
        vy: -15,
        size: 16,
      });

      this.notifyState();
    }
  }

  /**
   * Game Over
   */
  private triggerGameOver() {
    this.state = 'GAME_OVER';
    sound.playGameOver();
    this.notifyState();
    if (this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }

  /**
   * Create Particle Explosion
   */
  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      this.particles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 1.2 + Math.random() * 1.5,
        shape: Math.random() < 0.3 ? 'spark' : 'pixel',
      });
    }
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange(this.state, this.stats, this.lives, this.bombs);
    }
  }

  /**
   * Render Master Frame
   */
  public render() {
    const time = performance.now() / 1000;
    const ctx = this.ctx;

    ctx.save();

    // Screen shake translate
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Clear Canvas with deep space black
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Starfield
    this.stars.forEach((star) => {
      ctx.fillStyle = star.color;
      const alpha = 0.5 + Math.sin(star.twinkle) * 0.45;
      ctx.globalAlpha = alpha;

      if (this.warpEffect) {
        // Hyperspace warp stretch lines
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y + star.speed * 0.4);
        ctx.stroke();
      } else {
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    });
    ctx.globalAlpha = 1.0;

    // 3. Tractor Beams
    this.enemies.forEach((enemy) => {
      if (enemy.state === 'TRACTOR_BEAM') {
        SpriteRenderer.drawTractorBeam(ctx, enemy.x, enemy.y + 12, this.height, time);
      }
    });

    // 4. PowerUps
    this.powerUps.forEach((p) => {
      SpriteRenderer.drawPowerUp(ctx, p, time);
    });

    // 5. Enemies
    this.enemies.forEach((enemy) => {
      SpriteRenderer.drawEnemy(ctx, enemy, time);
    });

    // 6. Boss Mothership
    if (this.boss.active) {
      SpriteRenderer.drawMothership(ctx, this.boss, time);
    }

    // 7. Player Bullets
    this.playerBullets.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
      // Glow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - 1, b.y - b.height / 2 + 2, 2, b.height - 4);
    });

    // 8. Enemy Bullets
    this.enemyBullets.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(b.x - 1, b.y - b.height / 2 + 1, 2, b.height - 2);
    });

    // 9. Player
    if (this.lives > 0) {
      SpriteRenderer.drawPlayer(ctx, this.player, time);
    }

    // 10. Particles
    this.particles.forEach((p) => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1.0;

    // 11. Floating Text Popups
    this.floatingTexts.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `${ft.size}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;

    // 12. State Overlays
    if (this.state === 'READY') {
      ctx.fillStyle = '#ef4444';
      ctx.font = '18px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('READY!', this.width / 2, this.height / 2);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`STAGE ${this.stage}`, this.width / 2, this.height / 2 + 30);
    } else if (this.state === 'CHALLENGING_STAGE' && this.challengeWaveTimer > 0 && this.challengeWave === 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHALLENGING STAGE', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#fde047';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText('BONUS ROUND', this.width / 2, this.height / 2 + 18);
    } else if (this.state === 'GAME_OVER') {
      ctx.fillStyle = '#ef4444';
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS START TO RETRY', this.width / 2, this.height / 2 + 25);
    }

    ctx.restore();
  }
}
