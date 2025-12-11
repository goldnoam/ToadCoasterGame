import React, { useRef, useEffect } from 'react';
import { GameState, EntityType, GameEntity } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  setScore: (score: React.SetStateAction<number>) => void;
  lives: number;
  setLives: (lives: React.SetStateAction<number>) => void;
  level: number;
  onGameOver: (score: number) => void;
  onLevelComplete: () => void;
}

const LANES = 3;
const LANE_WIDTH_PCT = 1 / LANES;
const PLAYER_SIZE = 40;
const ENTITY_SIZE = 30;

// Level configuration helper
const getLevelConfig = (level: number) => {
  const effectiveLevel = Math.min(level, 10);
  
  // Cycle through 3 themes
  const themeIndex = (level - 1) % 3;
  let colors = {
    rail: '#64748b', // Default Slate
    tie: '#334155',
    neon: 'rgba(56, 189, 248, 0.3)', // Blue
    particle: '#38bdf8'
  };

  if (themeIndex === 1) { // Magma Theme
    colors = {
      rail: '#7f1d1d',
      tie: '#450a0a',
      neon: 'rgba(239, 68, 68, 0.4)', // Red
      particle: '#ef4444'
    };
  } else if (themeIndex === 2) { // Toxic Theme
    colors = {
      rail: '#14532d',
      tie: '#052e16',
      neon: 'rgba(34, 197, 94, 0.4)', // Green
      particle: '#22c55e'
    };
  }

  return {
    speed: 4 + (effectiveLevel * 0.8), // Speed increases with level
    target: 1000 + (effectiveLevel * 250), // Longer levels
    obstacleChance: 0.15 + (effectiveLevel * 0.02), // More snakes
    colors
  };
};

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  score,
  setScore,
  lives,
  setLives,
  level,
  onGameOver,
  onLevelComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use Refs for mutable game state to avoid closure staleness in animation loop
  const stateRef = useRef({
    playerLane: 1, // 0, 1, 2
    playerY: 0, // Set in init
    playerVelY: 0,
    playerWorldY: 0, // Distance traveled
    isJumping: false,
    jumpTargetLane: 1,
    jumpProgress: 0,
    entities: [] as GameEntity[],
    speed: 5,
    lastSpawnY: 0,
    gameTime: 0,
    invincible: false,
    invincibleTimer: 0,
    shakeTimer: 0, // Screen shake duration
    powerupGlowTimer: 0, // New: Glow duration
    powerupGlowColor: '#ffffff', // New: Glow color
    bgOffset: 0,
    levelTarget: 1000,
    particles: [] as {x: number, y: number, vx: number, vy: number, life: number, color: string}[],
    currentConfig: getLevelConfig(1)
  });

  const requestRef = useRef<number>();

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      const s = stateRef.current;
      
      if (s.isJumping) return; // Lock movement while jumping

      if (e.key === 'ArrowLeft' && s.playerLane > 0) {
        initiateJump(s.playerLane - 1);
      } else if (e.key === 'ArrowRight' && s.playerLane < LANES - 1) {
        initiateJump(s.playerLane + 1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING) return;
      const s = stateRef.current;
      if (s.isJumping) return;

      const touchX = e.touches[0].clientX;
      const screenWidth = window.innerWidth;
      
      // Simple logic: tap left side = left, right side = right
      if (touchX < screenWidth / 2 && s.playerLane > 0) {
        initiateJump(s.playerLane - 1);
      } else if (touchX > screenWidth / 2 && s.playerLane < LANES - 1) {
        initiateJump(s.playerLane + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameState]);

  const initiateJump = (targetLane: number) => {
    const s = stateRef.current;
    s.isJumping = true;
    s.jumpTargetLane = targetLane;
    s.jumpProgress = 0;
  };

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Reset player Y position based on new height
        if (gameState === GameState.MENU) {
            stateRef.current.playerY = canvas.height - 150;
        }
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Reset gameTime flag when states change to allow resetGame to run
    if (gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER || gameState === GameState.MENU) {
        stateRef.current.gameTime = 0;
    }

    // Initialization logic when game starts or restarts
    if (gameState === GameState.PLAYING && stateRef.current.gameTime === 0) {
        resetGame(canvas.height);
    } 

    const loop = (time: number) => {
      if (gameState === GameState.PLAYING) {
        update(canvas.width, canvas.height);
      }
      draw(ctx, canvas.width, canvas.height);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameState, score, lives, level]); 

  const resetGame = (height: number) => {
    const config = getLevelConfig(level);
    
    stateRef.current = {
        playerLane: 1,
        playerY: height - 150,
        playerVelY: 0,
        playerWorldY: 0,
        isJumping: false,
        jumpTargetLane: 1,
        jumpProgress: 0,
        entities: [],
        speed: config.speed, 
        lastSpawnY: 0,
        gameTime: 1, // mark as started
        invincible: false,
        invincibleTimer: 0,
        shakeTimer: 0,
        powerupGlowTimer: 0,
        powerupGlowColor: '#ffffff',
        bgOffset: 0,
        levelTarget: config.target,
        particles: [],
        currentConfig: config
    };
  };

  const spawnEntity = (canvasWidth: number) => {
    const s = stateRef.current;
    // Spawn chance
    if (Math.random() < 0.05) {
        const lane = Math.floor(Math.random() * LANES);
        const typeRoll = Math.random();
        
        let type = EntityType.NORMAL_TRACK;
        const config = s.currentConfig;
        
        const obsChance = config.obstacleChance;
        
        // Probability distribution
        let cumulative = obsChance;
        if (typeRoll < cumulative) type = EntityType.OBSTACLE;
        else if (typeRoll < (cumulative += 0.10)) type = EntityType.BOOST;
        else if (typeRoll < (cumulative += 0.15)) type = EntityType.FLY;
        else if (typeRoll < (cumulative += 0.05)) type = EntityType.POWERUP_SHIELD;
        else return; 

        // Don't spawn obstacle if player is invincible recently or level start
        if (type === EntityType.OBSTACLE && s.playerWorldY < 100) return;

        // Ensure we don't overlap too much
        const tooClose = s.entities.some(e => e.lane === lane && e.y < -50);
        if (tooClose) return;

        s.entities.push({
            id: Math.random(),
            type,
            lane,
            y: -100, // Spawn above screen
            active: true
        });
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
        stateRef.current.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0 + Math.random() * 0.5,
            color
        });
    }
  };

  const update = (width: number, height: number) => {
    const s = stateRef.current;
    
    // Move World
    const currentSpeed = s.speed;
    
    s.playerWorldY += currentSpeed / 10; // Meters approximation
    setScore(Math.floor(s.playerWorldY));
    s.bgOffset += currentSpeed * 0.5;

    // Check Level Complete
    if (s.playerWorldY >= s.levelTarget) {
        onLevelComplete();
        return;
    }

    // Move Entities
    s.entities.forEach(e => {
        e.y += currentSpeed;
    });

    // Cleanup off-screen entities
    s.entities = s.entities.filter(e => e.y < height + 100);

    // Spawn new ones
    spawnEntity(width);

    // Jump Logic
    if (s.isJumping) {
        s.jumpProgress += 0.08; // Jump speed
        if (s.jumpProgress >= 1) {
            s.playerLane = s.jumpTargetLane;
            s.isJumping = false;
            s.jumpProgress = 0;
        }
    }

    // Invincibility
    if (s.invincible) {
        s.invincibleTimer--;
        if (s.invincibleTimer <= 0) s.invincible = false;
    }

    // Particles
    s.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
    });
    s.particles = s.particles.filter(p => p.life > 0);

    // Collision Detection
    const laneWidth = width / LANES;
    
    // Calculate visual X based on jump
    let playerVisualX = (s.playerLane * laneWidth) + (laneWidth / 2);
    if (s.isJumping) {
        const startX = (s.playerLane * laneWidth) + (laneWidth / 2);
        const targetX = (s.jumpTargetLane * laneWidth) + (laneWidth / 2);
        const t = s.jumpProgress;
        const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        playerVisualX = startX + (targetX - startX) * ease;
    }

    const playerHitbox = {
        x: playerVisualX - PLAYER_SIZE/2,
        y: s.playerY - PLAYER_SIZE/2,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE
    };

    s.entities.forEach(e => {
        if (!e.active) return;
        
        // Entity X position
        const entX = (e.lane * laneWidth) + (laneWidth / 2);
        const entHitbox = {
            x: entX - ENTITY_SIZE/2,
            y: e.y - ENTITY_SIZE/2,
            w: ENTITY_SIZE,
            h: ENTITY_SIZE
        };

        const dist = Math.hypot(playerHitbox.x - entHitbox.x, playerHitbox.y - entHitbox.y);
        
        if (dist < (PLAYER_SIZE/2 + ENTITY_SIZE/2)) {
            handleCollision(e);
        }
    });
  };

  const handleCollision = (e: GameEntity) => {
    const s = stateRef.current;

    switch (e.type) {
        case EntityType.FLY:
            setScore(prev => prev + 50); // Bonus score
            s.powerupGlowTimer = 30; // Trigger glow
            s.powerupGlowColor = '#a3e635';
            createParticles(
                (e.lane * (canvasRef.current?.width || 0)/LANES) + (canvasRef.current?.width || 0)/LANES/2, 
                e.y, 
                '#a3e635', 
                8
            );
            e.active = false;
            break;
            
        case EntityType.POWERUP_SHIELD:
            s.invincible = true;
            s.invincibleTimer = 400; // Increased duration
            createParticles(
                (e.lane * (canvasRef.current?.width || 0)/LANES) + (canvasRef.current?.width || 0)/LANES/2, 
                e.y, 
                '#38bdf8', 
                15
            );
            e.active = false;
            break;

        case EntityType.BOOST:
            s.playerWorldY += 200; // Skip 200 meters
            s.powerupGlowTimer = 30; // Trigger glow
            s.powerupGlowColor = '#facc15';
            createParticles(
                (e.lane * (canvasRef.current?.width || 0)/LANES) + (canvasRef.current?.width || 0)/LANES/2, 
                e.y, 
                '#facc15', 
                15
            );
            e.active = false; 
            break;

        case EntityType.OBSTACLE:
            if (s.invincible) {
                e.active = false; // Destroy obstacle
                createParticles(
                    (e.lane * (canvasRef.current?.width || 0)/LANES) + (canvasRef.current?.width || 0)/LANES/2, 
                    e.y, 
                    '#ef4444', 
                    10
                );
                return;
            }
            
            // Screen Shake Effect
            s.shakeTimer = 25; // Duration

            // Massive particle explosion
            createParticles(
                (e.lane * (canvasRef.current?.width || 0)/LANES) + (canvasRef.current?.width || 0)/LANES/2, 
                e.y, 
                '#ef4444', 
                50 // Visually impactful count
            );

            // Penalty
            s.playerWorldY = Math.max(0, s.playerWorldY - 100); 
            e.active = false; 
            
            const newLives = lives - 1;
            setLives(newLives);
            
            if (newLives <= 0) {
                onGameOver(Math.floor(s.playerWorldY));
            } else {
                s.invincible = true;
                s.invincibleTimer = 120; // 2 seconds safety
            }
            break;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear
    ctx.clearRect(0, 0, width, height);
    const s = stateRef.current;
    
    // Apply Shake with decay
    ctx.save();
    if (s.shakeTimer > 0) {
        const decay = s.shakeTimer / 25; // Normalize 0-1
        s.shakeTimer--;
        const intensity = 12 * decay; // Fade out shake intensity
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        ctx.translate(dx, dy);
    }

    const laneWidth = width / LANES;
    const { colors } = s.currentConfig;

    // 1. Draw Tracks (Coasters)
    for (let i = 0; i < LANES; i++) {
        const centerX = (i * laneWidth) + (laneWidth / 2);
        
        // Track Ties
        ctx.strokeStyle = colors.tie;
        ctx.lineWidth = 4;
        const tieSpacing = 40;
        const offset = s.bgOffset % tieSpacing;
        
        ctx.beginPath();
        for (let y = -offset; y < height; y += tieSpacing) {
            ctx.moveTo(centerX - 20, y);
            ctx.lineTo(centerX + 20, y);
        }
        ctx.stroke();

        // Rails
        ctx.strokeStyle = colors.rail;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, 0);
        ctx.lineTo(centerX - 15, height);
        ctx.moveTo(centerX + 15, 0);
        ctx.lineTo(centerX + 15, height);
        ctx.stroke();

        // Highlight/Neon effect
        const isTargetLane = i === s.jumpTargetLane || i === s.playerLane;
        ctx.strokeStyle = isTargetLane ? colors.neon.replace('0.3', '0.6') : colors.neon;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, 0);
        ctx.lineTo(centerX - 15, height);
        ctx.moveTo(centerX + 15, 0);
        ctx.lineTo(centerX + 15, height);
        ctx.stroke();
    }

    // 2. Draw Entities
    s.entities.forEach(e => {
        if (!e.active) return;
        const x = (e.lane * laneWidth) + (laneWidth / 2);
        
        ctx.save();
        ctx.translate(x, e.y);

        if (e.type === EntityType.FLY) {
            ctx.font = '30px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪰', 0, 0);
            ctx.shadowColor = '#a3e635';
            ctx.shadowBlur = 10;
        } else if (e.type === EntityType.OBSTACLE) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-20, -10, 40, 20);
            ctx.fillStyle = '#7f1d1d';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', 0, 5);
        } else if (e.type === EntityType.BOOST) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(15, 10);
            ctx.lineTo(-15, 10);
            ctx.fill();
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#fff';
            ctx.fillText('⚡', -7, 5);
        } else if (e.type === EntityType.POWERUP_SHIELD) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('S', 0, 5);
        }
        
        ctx.restore();
    });

    // 3. Draw Particles
    s.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // 4. Draw Player (Toad)
    if (gameState === GameState.PLAYING) {
        let x = (s.playerLane * laneWidth) + (laneWidth / 2);
        let y = s.playerY;

        // Interpolate X if jumping
        if (s.isJumping) {
            const startX = (s.playerLane * laneWidth) + (laneWidth / 2);
            const targetX = (s.jumpTargetLane * laneWidth) + (laneWidth / 2);
            const t = s.jumpProgress;
            // Easing function for X movement
            const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            x = startX + (targetX - startX) * ease;

            // Parabolic Jump Arc (Y-axis)
            const jumpHeight = 60;
            y -= Math.sin(t * Math.PI) * jumpHeight;
        }

        ctx.save();
        ctx.translate(x, y);

        // Jump Animation: Squash and Stretch + Lift
        if (s.isJumping) {
            const t = s.jumpProgress;
            // Easing for jump height/scale (Sine wave 0->1->0)
            const jumpPhase = Math.sin(t * Math.PI);
            
            // Stretch: Thinner width, Taller height at peak
            // Lift: Overall larger at peak (closer to camera)
            const stretch = jumpPhase * 0.25; 
            const lift = 1 + (jumpPhase * 0.15); 
            
            // X scale: thinner when jumping
            // Y scale: taller when jumping
            ctx.scale(lift - stretch, lift + stretch);
        }

        // Draw Glow if active
        if (s.powerupGlowTimer > 0) {
            s.powerupGlowTimer--;
            ctx.save();
            ctx.globalAlpha = Math.min(1, s.powerupGlowTimer / 10); // Fade out
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.fillStyle = s.powerupGlowColor;
            ctx.shadowColor = s.powerupGlowColor;
            ctx.shadowBlur = 25;
            ctx.fill();
            ctx.restore();
        }

        // Shield Active Visual Effect
        if (s.invincible) {
            const time = Date.now() / 200;
            ctx.beginPath();
            const pulseSize = 35 + Math.sin(time) * 5;
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 - Math.sin(time)*0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, 0.2)`;
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Toad Emoji 🐸
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐸', 0, 0);

        ctx.restore();
    }
    
    // Restore from Shake
    ctx.restore();
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full bg-slate-900 touch-none"
    />
  );
};

export default GameCanvas;