import React, { useState, useRef, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import Footer from './components/Footer';
import { GameState } from './types';
import { Share2, RefreshCw, Play, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('toad_coaster_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('toad_coaster_highscore', score.toString());
    }
  }, [score, highScore]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
  };

  const handleLevelComplete = () => {
    setGameState(GameState.LEVEL_COMPLETE);
    setTimeout(() => {
      setLevel(prev => prev + 1);
      setGameState(GameState.PLAYING);
    }, 3000);
  };

  const handleTogglePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  };

  const handleQuit = () => {
    setGameState(GameState.MENU);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Toad Coaster Climb',
      text: `הצלחתי להגיע לגובה של ${score} מטרים במשחק Toad Coaster Climb! נסו לנצח אותי! 🐸🎢`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('הקישור הועתק ללוח!');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black z-0 pointer-events-none"></div>
      
      {/* Decorative stars/lights */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0" 
           style={{backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px'}}>
      </div>

      {/* Main Game Area */}
      <main className="flex-grow relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto w-full h-full border-x border-slate-800 shadow-2xl bg-slate-900/50 backdrop-blur-sm">
        
        {/* Game Canvas */}
        <div className="w-full h-full relative">
          <GameCanvas 
            gameState={gameState} 
            setGameState={setGameState}
            score={score}
            setScore={setScore}
            lives={lives}
            setLives={setLives}
            level={level}
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
          />
          
          {/* UI Overlay (HUD, Menus) */}
          <UIOverlay 
            gameState={gameState}
            score={score}
            lives={lives}
            level={level}
            highScore={highScore}
            onStart={startGame}
            onShare={handleShare}
            onTogglePause={handleTogglePause}
            onQuit={handleQuit}
          />
        </div>

      </main>

      {/* Footer */}
      <Footer onShare={handleShare} />
    </div>
  );
};

export default App;