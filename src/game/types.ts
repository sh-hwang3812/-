/**
 * Types & Enums for Galaxy Arcade (갤럭시 아케이드)
 */

export type GameState = 
  | 'MENU'
  | 'READY'
  | 'PLAYING'
  | 'CHALLENGING_STAGE'
  | 'BOSS_BATTLE'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'NAME_ENTRY';

export type EnemyType = 
  | 'DRONE'      // Green drone - 30 pts (60 diving)
  | 'BEE'        // Yellow bee - 50 pts (100 diving)
  | 'ESCORT'     // Red escort - 80 pts (160 diving)
  | 'CRUISER'    // Blue cruiser - 100 pts (200 diving)
  | 'BOSS'       // Boss commander - 150 pts (400 diving alone, 800 with escorts)
  | 'MOTHERSHIP'; // Stage 5/10 Giant Flagship

export type EnemyFlightState = 
  | 'ENTERING'
  | 'FORMATION'
  | 'DIVING'
  | 'TRACTOR_BEAM'
  | 'RETURNING'
  | 'CHALLENGE_SWOOP';

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  twinkle: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isPlayer: boolean;
  color: string;
  damage: number;
  penetrating?: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'pixel' | 'ring' | 'spark';
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  size: number;
}

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: 'DOUBLE_SHOT' | 'SHIELD' | 'BOMB' | 'SPEED' | 'SPREAD';
  duration: number;
}

export interface BezierPoint {
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  formationX: number;
  formationY: number;
  state: EnemyFlightState;
  health: number;
  maxHealth: number;
  scoreValue: number;
  angle: number; // in radians
  animFrame: number;
  
  // Dive path tracking
  path: BezierPoint[];
  pathProgress: number; // 0 to 1
  pathSpeed: number;
  shootCooldown: number;
  
  // Escorts tracking
  escortIds?: number[];
  capturedFighterId?: number;
  isCapturing?: boolean;
  hasTractorBeam?: boolean;
  tractorTimer?: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  bombs: number;
  invulnerableTime: number; // in seconds
  isDualFighter: boolean;
  hasShield: boolean;
  spreadShot: boolean;
  rapidFire: boolean;
  isCaptured: boolean;
  captureProgress: number; // for being sucked into tractor beam
  tractorTargetX?: number;
  tractorTargetY?: number;
}

export interface BossMothership {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  leftCannonAlive: boolean;
  leftCannonHealth: number;
  rightCannonAlive: boolean;
  rightCannonHealth: number;
  shieldActive: boolean;
  attackPattern: number;
  attackTimer: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  stage: number;
  shotsFired: number;
  shotsHit: number;
  enemiesKilled: number;
  challengingHits: number;
  challengingTotal: number;
  maxCombo: number;
  currentCombo: number;
}

export interface HighScoreRecord {
  id: string;
  name: string;
  score: number;
  stage: number;
  accuracy: number;
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  scanlines: boolean;
  crtCurvature: boolean;
  autoFire: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
}
