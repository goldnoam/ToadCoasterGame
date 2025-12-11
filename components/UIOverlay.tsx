import React from 'react';
import { GameState } from '../types';
import { Play, Trophy, Heart, Shield, RefreshCw, Pause, Home } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  lives: number;
  level: number;
  highScore: number;
  onStart: () => void;
  onShare: () => void;
  onTogglePause: () => void;
  onQuit: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  score, 
  lives, 
  level, 
  highScore, 
  onStart,
  onShare,
  onTogglePause,
  onQuit
}) => {
  
  // HUD (Heads Up Display) - Always visible during gameplay and pause
  if (gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE || gameState === GameState.PAUSED) {
    return (
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col gap-1">
             <div className="text-2xl font-black text-yellow-400 drop-shadow-md">
              {score}m
             </div>
             <div className="text-xs text-slate-400 font-bold">LEVEL {level}</div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Lives */}
            <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                <Heart 
                    key={i} 
                    className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-700'}`} 
                />
                ))}
            </div>
            
            {/* Pause Button */}
            {gameState === GameState.PLAYING && (
                <button 
                    onClick={onTogglePause}
                    className="p-2 bg-slate-800/80 rounded-full text-slate-200 hover:bg-slate-700 transition-colors shadow-lg active:scale-95 border border-slate-700"
                    aria-label="Pause"
                >
                    <Pause size={20} className="fill-slate-200" />
                </button>
            )}
          </div>
        </div>

        {gameState === GameState.LEVEL_COMPLETE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 pointer-events-auto">
            <h2 className="text-4xl font-bold text-green-400 mb-2">שלב הושלם!</h2>
            <p className="text-white text-lg">מתכונן לרכבת הבאה...</p>
          </div>
        )}

        {gameState === GameState.PAUSED && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto z-50">
                <h2 className="text-4xl font-bold text-white mb-8 tracking-wider drop-shadow-lg">PAUSED</h2>
                
                <div className="flex flex-col gap-4 w-full max-w-xs px-8">
                    <button 
                        onClick={onTogglePause}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
                    >
                        <Play size={20} className="fill-white"/> המשך
                    </button>
                    
                    <button 
                        onClick={onQuit}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
                    >
                        <Home size={20} /> תפריט ראשי
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Menu Screen
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 text-center">
        <div className="mb-6 animate-bounce">
          <span className="text-6xl">🐸🎢</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
          Toad Coaster
        </h1>
        <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
          קפוץ בין רכבות, אסוף זבובים והיזהר ממסילות שבורות!
          <br/>
          <span className="text-xs text-slate-500">(השתמש בחצים או הקש בצדדים כדי לזוז)</span>
        </p>
        
        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-xl text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-2">
            <Play className="fill-white" /> התחל משחק
          </span>
        </button>

        <div className="mt-8 flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg">
          <Trophy size={16} />
          <span className="font-mono font-bold">High Score: {highScore}</span>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md p-6 text-center animate-in zoom-in duration-300">
        <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg">GAME OVER</h2>
        <p className="text-red-200 mb-6 text-xl">נפלת מהרכבת...</p>
        
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8 w-full max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">ניקוד:</span>
            <span className="text-2xl font-bold text-white">{score}m</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-slate-400">שיא:</span>
             <span className="text-xl font-bold text-yellow-500">{Math.max(score, highScore)}m</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
          >
            <RefreshCw size={20} /> נסה שוב
          </button>
          
          <button 
            onClick={onShare}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
          >
            שתף תוצאה
          </button>

          <button 
            onClick={onQuit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-lg text-slate-300 shadow-lg transition-all active:scale-95 mt-2"
          >
            <Home size={20} /> תפריט ראשי
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default UIOverlay;