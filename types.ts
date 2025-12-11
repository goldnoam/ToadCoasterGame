export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  PAUSED = 'PAUSED'
}

export enum EntityType {
  FLY = 'FLY', // Score + Life sometimes
  OBSTACLE = 'OBSTACLE', // Broken track (Snake) - Fall down
  BOOST = 'BOOST', // Speed up (Ladder)
  POWERUP_SHIELD = 'POWERUP_SHIELD', // Protect once
  NORMAL_TRACK = 'NORMAL_TRACK'
}

export interface Position {
  x: number;
  y: number;
}

export interface GameEntity {
  id: number;
  type: EntityType;
  lane: number; // 0, 1, 2
  y: number; // Vertical position
  active: boolean;
}

export interface PlayerState {
  lane: number;
  y: number; // Visual Y on screen (mostly fixed, world moves)
  worldY: number; // Distance climbed
  lives: number;
  score: number;
  shield: boolean;
  isFalling: boolean;
}