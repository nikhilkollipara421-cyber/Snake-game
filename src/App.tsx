import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Gamepad2, Volume2, Trophy, RotateCcw } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'AI-GEN: Cyber Grid Alpha', artist: 'Neon Network', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'AI-GEN: Data Stream Beta', artist: 'Neural Network', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'AI-GEN: Mainframe OMEGA', artist: 'Ghost in the Machine', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // refs for smooth input handling
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const lastDirRef = useRef<Point>({ x: 1, y: 0 });

  // Music State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    dirRef.current = { x: 1, y: 0 };
    lastDirRef.current = { x: 1, y: 0 };
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsGameRunning(true);
    
    // Auto-start music if not playing
    if (!isMusicPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      setIsMusicPlaying(true);
    }
  };

  // --- Keyboard Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !isGameRunning && !gameOver) {
        startGame();
        return;
      }

      if (e.key === ' ' && gameOver) {
        startGame();
        return;
      }

      if (!isGameRunning) return;

      const current = lastDirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (current.y !== 1) dirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (current.y !== -1) dirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (current.x !== 1) dirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (current.x !== -1) dirRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  // --- Game Loop ---
  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const dir = dirRef.current;
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };
        lastDirRef.current = dir;

        // Collisions
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE || 
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          setHighScore(h => Math.max(h, score));
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(50, s - 3)); // slightly faster
          
          let newFood;
          while (true) {
            newFood = { 
              x: Math.floor(Math.random() * GRID_SIZE), 
              y: Math.floor(Math.random() * GRID_SIZE) 
            };
            // Ensure food doesn't spawn on snake
            if (!newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
              break;
            }
          }
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const timeoutId = setTimeout(moveSnake, speed);
    return () => clearTimeout(timeoutId);
  }, [snake, isGameRunning, gameOver, speed, food]);


  // --- Music Controls ---
  const currentTrack = TRACKS[currentTrackIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isMusicPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsMusicPlaying(false));
    }
  }, [currentTrackIdx]);

  const togglePlayMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const nextTrack = () => setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-['Orbitron'] antialiased selection:bg-cyan-900 overflow-hidden radial-gradient-bg">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950 pointer-events-none -z-10" />

      <header className="mb-8 text-center mt-4">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] tracking-wider">
          NEON SNAKE
        </h1>
        <p className="font-['Share_Tech_Mono'] text-cyan-400/70 tracking-[0.3em] mt-2 text-sm md:text-base">
           // BEATS & BITES //
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start w-full max-w-5xl justify-center z-10">
        
        {/* Game Center */}
        <div className="flex flex-col items-center">
          {/* HUD Map */}
          <div className="flex justify-between w-full max-w-[400px] mb-4 text-cyan-300 font-['Share_Tech_Mono']">
            <div className="flex items-center gap-2 bg-cyan-950/50 px-4 py-2 rounded border border-cyan-800/50 shadow-[0_0_10px_rgba(8,145,178,0.2)]">
              <Gamepad2 size={18} className="text-cyan-400" />
              <span className="text-xl">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-950/50 px-4 py-2 rounded border border-purple-800/50 shadow-[0_0_10px_rgba(147,51,234,0.2)]">
              <Trophy size={18} className="text-purple-400" />
              <span className="text-xl text-purple-300">{highScore.toString().padStart(4, '0')}</span>
            </div>
          </div>

          {/* Game Board Content */}
          <div className="relative bg-black/60 backdrop-blur-sm border-2 border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] p-1 overflow-hidden scanlines">
            <div 
              className="relative bg-slate-950/80 rounded-lg w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
              style={{
                backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)',
                backgroundSize: '5% 5%' // Assuming 20x20 grid, 1/20 = 5%
              }}
            >
              
              {!isGameRunning && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 rounded-lg backdrop-blur-sm">
                  <button 
                    onClick={startGame}
                    className="group relative px-6 py-3 font-bold text-black bg-cyan-400 rounded hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]"
                  >
                    INSERT COIN <span className="text-xs font-['Share_Tech_Mono'] block opacity-70">press SPACE</span>
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 rounded-lg backdrop-blur-md border border-red-500/30">
                  <h2 className="text-4xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] mb-2">GAME OVER</h2>
                  <p className="text-cyan-300 font-['Share_Tech_Mono'] mb-6">FINAL SCORE: {score}</p>
                  <button 
                    onClick={startGame}
                    className="flex items-center gap-2 px-6 py-3 font-bold text-white bg-transparent border-2 border-cyan-500 rounded hover:bg-cyan-500/20 transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  >
                    <RotateCcw size={18} /> PLAY AGAIN
                  </button>
                </div>
              )}

              {/* Render Food */}
              <div 
                className="absolute bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.9)] animate-pulse"
                style={{
                  width: '5%', height: '5%',
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`
                }}
              />

              {/* Render Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute rounded-sm ${
                      isHead 
                        ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.8)] z-10' 
                        : 'bg-cyan-600/80 shadow-[0_0_8px_rgba(8,145,178,0.5)] border border-cyan-400/20'
                    }`}
                    style={{
                      width: '4.8%', height: '4.8%', // slightly smaller than 5% for grid gap effect
                      left: `${(segment.x / GRID_SIZE) * 100}%`,
                      top: `${(segment.y / GRID_SIZE) * 100}%`,
                      transition: 'top 50ms linear, left 50ms linear'
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 text-cyan-600/60 font-['Share_Tech_Mono'] text-sm hidden sm:block">
            USE W,A,S,D OR ARROW KEYS TO MOVE
          </div>
        </div>

        {/* Music Player Side Panel */}
        <div className="w-full max-w-[400px] lg:w-[350px] bg-slate-900/80 backdrop-blur border border-purple-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col gap-6 relative overflow-hidden group">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-purple-500/20" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />

          {/* Album Art Placeholder */}
          <div className="w-full aspect-square bg-slate-950 rounded-lg border-2 border-slate-800 relative z-10 overflow-hidden flex items-center justify-center shadow-inner">
             {/* Simple visualizer animation when playing */}
             <div className="absolute inset-0 flex items-end justify-center gap-2 pb-8 px-4 opacity-70">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-full bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t-sm origin-bottom transition-all duration-100 ease-out`}
                    style={{ 
                      height: isMusicPlaying ? `${20 + Math.random() * 80}%` : '5%',
                      transitionDelay: `${i * 20}ms`
                    }}
                  />
                ))}
             </div>
             
             <div className="z-10 bg-black/60 p-4 rounded-full backdrop-blur-md border border-white/5">
                <Volume2 size={48} className={`text-cyan-400 ${isMusicPlaying ? 'animate-pulse' : 'opacity-50'}`} />
             </div>
          </div>

          {/* Track Info */}
          <div className="text-center z-10 space-y-2">
            <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded font-['Share_Tech_Mono'] tracking-widest border border-purple-500/30 mb-2">
              NOW PLAYING
            </div>
            <h3 className="text-lg font-bold text-white truncate px-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {currentTrack.title}
            </h3>
            <p className="text-cyan-400 text-sm font-['Share_Tech_Mono'] opacity-80">
              {currentTrack.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 z-10">
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={prevTrack}
                className="p-3 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors active:scale-90"
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={togglePlayMusic}
                className="p-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 transition-all active:scale-95"
              >
                {isMusicPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-3 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors active:scale-90"
              >
                <SkipForward size={24} />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 mt-2 bg-slate-950/50 p-2 rounded-lg border border-white/5">
              <Volume2 size={16} className="text-slate-500" />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer" 
              />
            </div>
          </div>
          
          {/* Audio Element Hidden */}
          <audio 
            ref={audioRef} 
            src={currentTrack.url} 
            onEnded={nextTrack} 
            preload="metadata"
          />
        </div>

      </div>
    </div>
  );
}
