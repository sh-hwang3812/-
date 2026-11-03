import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Trophy,
  HelpCircle,
  Settings as SettingsIcon,
  RotateCcw,
  Play,
  Pause,
  Bomb,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GalaxyEngine } from '../game/engine.ts';
import { GameState, GameStats, GameSettings } from '../game/types.ts';
import { sound } from '../game/audio.ts';
import { LeaderboardModal } from './LeaderboardModal.tsx';
import { HowToPlayModal } from './HowToPlayModal.tsx';
import { SettingsModal } from './SettingsModal.tsx';

export const ArcadeCabinet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GalaxyEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({
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
  });
  const [lives, setLives] = useState(3);
  const [bombs, setBombs] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    bgmEnabled: true,
    scanlines: true,
    crtCurvature: true,
    autoFire: false,
    difficulty: 'NORMAL',
  });

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingHighScore, setPendingHighScore] = useState<{ score: number; stage: number; accuracy: number } | undefined>();

  // Initialize Game Engine on Canvas Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GalaxyEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onStateChange = (state, newStats, newLives, newBombs) => {
      setGameState(state);
      setStats({ ...newStats });
      setLives(newLives);
      setBombs(newBombs);
    };

    engine.onGameOver = (finalStats) => {
      const accuracy = finalStats.shotsFired > 0 ? Math.round((finalStats.shotsHit / finalStats.shotsFired) * 100) : 0;
      if (finalStats.score >= 5000) {
        setPendingHighScore({
          score: finalStats.score,
          stage: finalStats.stage,
          accuracy,
        });
        setShowLeaderboard(true);
      }
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      sound.resume();
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      engine.keys[e.key] = true;

      if (e.key === 'p' || e.key === 'P') {
        togglePause();
      }
      if (e.key === 'x' || e.key === 'X' || e.key === 'b' || e.key === 'B') {
        engine.triggerBomb();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initial render of empty starfield
    engine.render();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stopLoop();
    };
  }, []);

  const handleStartGame = useCallback(() => {
    sound.resume();
    if (engineRef.current) {
      engineRef.current.startNewGame(settings.difficulty);
      setIsPaused(false);
    }
  }, [settings.difficulty]);

  const togglePause = useCallback(() => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.startLoop();
      setIsPaused(false);
    } else {
      engineRef.current.stopLoop();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (engineRef.current) {
      engineRef.current.settings = updated;
      sound.setSoundEnabled(updated.soundEnabled);
      sound.setBgmEnabled(updated.bgmEnabled);
    }
  };

  // Virtual touch control handlers for mobile
  const handleTouchLeft = (active: boolean) => {
    sound.resume();
    if (engineRef.current) {
      engineRef.current.keys['ArrowLeft'] = active;
    }
  };

  const handleTouchRight = (active: boolean) => {
    sound.resume();
    if (engineRef.current) {
      engineRef.current.keys['ArrowRight'] = active;
    }
  };

  const handleTouchFire = () => {
    sound.resume();
    if (engineRef.current) {
      engineRef.current.fireLaser();
    }
  };

  const handleTouchBomb = () => {
    sound.resume();
    if (engineRef.current) {
      engineRef.current.triggerBomb();
    }
  };

  const accuracyPct = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-2 sm:px-4 bg-slate-950 text-slate-100">
      {/* Arcade Outer Bezel Housing */}
      <div className="relative w-full max-w-[540px] bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-950 rounded-2xl border-4 border-slate-800 shadow-2xl shadow-cyan-950/40 p-3 sm:p-5 flex flex-col items-center">
        
        {/* Arcade Cabinet Marquee Header */}
        <div className="w-full bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-cyan-500/80 rounded-lg p-2.5 mb-3 flex items-center justify-between shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-arcade text-xs sm:text-sm tracking-wider text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">
              GALAXY ARCADE
            </span>
            <span className="text-[10px] text-yellow-400 font-arcade hidden sm:inline">
              갤럭시
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Sound Toggle"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-1 text-slate-400 hover:text-yellow-400 transition-colors"
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Arcade LED Score Bar */}
        <div className="w-full grid grid-cols-3 gap-2 font-arcade text-center py-2 px-3 mb-2 bg-black rounded border border-slate-800">
          <div>
            <div className="text-[10px] text-rose-500 tracking-wider">1UP</div>
            <div className="text-xs sm:text-sm text-white font-bold">{stats.score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-yellow-400 tracking-wider">HIGH SCORE</div>
            <div className="text-xs sm:text-sm text-yellow-300 font-bold">{stats.highScore.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-cyan-400 tracking-wider">STAGE</div>
            <div className="text-xs sm:text-sm text-cyan-300 font-bold">{stats.stage}</div>
          </div>
        </div>

        {/* Main CRT Game Canvas Housing */}
        <div className="relative w-full aspect-[3/4] max-w-[480px] bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full h-full block object-contain"
          />

          {/* Optional CRT Scanlines and Curvature Vignette */}
          {settings.scanlines && <div className="crt-overlay" />}
          {settings.crtCurvature && <div className="crt-vignette" />}

          {/* Menu / Start Overlay */}
          {gameState === 'MENU' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-xs text-center">
              <div className="font-arcade text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-300 to-rose-400 font-bold tracking-widest mb-2 drop-shadow-md">
                GALAXY ARCADE
              </div>
              <div className="text-xs font-arcade text-cyan-300 tracking-wider mb-6">
                갤럭시 · 갤러그 스페이스 슈터
              </div>

              {/* High Score Badge */}
              <div className="bg-slate-900 border border-slate-800 rounded px-4 py-2 mb-6">
                <span className="text-xs font-arcade text-yellow-400 mr-2">TOP RECORD:</span>
                <span className="text-sm font-arcade text-white font-bold">{stats.highScore.toLocaleString()} PTS</span>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="px-6 py-3 font-arcade text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-md shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 flex items-center gap-2 mb-4 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                INSERT COIN · 게임 시작
              </button>

              <div className="flex items-center gap-4 text-xs font-arcade text-slate-400">
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="hover:text-cyan-400 underline underline-offset-4 cursor-pointer"
                >
                  HOW TO PLAY
                </button>
                <span>·</span>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="hover:text-yellow-400 underline underline-offset-4 cursor-pointer"
                >
                  LEADERBOARD
                </button>
              </div>

              <div className="mt-8 text-[10px] text-slate-500 font-tech">
                USE ARROW KEYS OR [A][D] TO MOVE · [SPACE] TO SHOOT · [X] EMP BOMB
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75">
              <div className="font-arcade text-xl text-yellow-400 mb-4 animate-pulse">PAUSED</div>
              <button
                onClick={togglePause}
                className="px-4 py-2 font-arcade text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Game Over Retry Overlay */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 text-center">
              <div className="font-arcade text-xl sm:text-2xl text-rose-500 font-bold mb-2">
                GAME OVER
              </div>
              <div className="font-tech text-sm text-slate-300 mb-1">
                최종 점수: <span className="font-bold text-white text-base">{stats.score.toLocaleString()} PTS</span>
              </div>
              <div className="font-tech text-xs text-slate-400 mb-6">
                도달 스테이지 {stats.stage} · 명중률 {accuracyPct}% · 적 격추 {stats.enemiesKilled}기
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="px-5 py-2.5 font-arcade text-xs bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded shadow transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> REPLAY · 재도전
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="px-4 py-2 font-arcade text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" /> 랭킹 등록
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cabinet Bottom Status Bar */}
        <div className="w-full flex items-center justify-between px-3 py-2 mt-2 bg-slate-900/90 rounded border border-slate-800 font-tech text-xs">
          {/* Remaining Lives Icons */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-arcade mr-1">SHIPS:</span>
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-red-600 rounded-xs border border-white flex items-center justify-center text-[8px] text-white font-bold"
                title="Ship Life"
              >
                ▲
              </div>
            ))}
          </div>

          {/* Combo / Accuracy */}
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {stats.currentCombo > 1 && (
              <div className="flex items-center gap-1 text-yellow-400 font-arcade text-[10px]">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{stats.currentCombo}x COMBO</span>
              </div>
            )}
            <span>ACCURACY: <strong className="text-white">{accuracyPct}%</strong></span>
          </div>

          {/* Remaining Bombs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-arcade mr-1">BOMBS:</span>
            {Array.from({ length: Math.max(0, bombs) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-cyan-600 rounded-full flex items-center justify-center text-[9px] text-cyan-200"
                title="EMP Bomb"
              >
                <Bomb className="w-2.5 h-2.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & Touch Controls Bar */}
        <div className="w-full mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 select-none">
          {/* D-Pad Buttons */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={() => handleTouchLeft(true)}
              onPointerUp={() => handleTouchLeft(false)}
              onPointerLeave={() => handleTouchLeft(false)}
              className="w-14 h-12 bg-slate-800 active:bg-cyan-700 border border-slate-700 active:border-cyan-400 rounded-lg flex items-center justify-center font-arcade text-base text-slate-200 active:scale-95 transition-all shadow-md touch-manipulation"
            >
              ◀
            </button>
            <button
              onPointerDown={() => handleTouchRight(true)}
              onPointerUp={() => handleTouchRight(false)}
              onPointerLeave={() => handleTouchRight(false)}
              className="w-14 h-12 bg-slate-800 active:bg-cyan-700 border border-slate-700 active:border-cyan-400 rounded-lg flex items-center justify-center font-arcade text-base text-slate-200 active:scale-95 transition-all shadow-md touch-manipulation"
            >
              ▶
            </button>
          </div>

          {/* Middle Utility Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={gameState === 'PLAYING' || gameState === 'READY' || gameState === 'CHALLENGING_STAGE' || gameState === 'BOSS_BATTLE' ? togglePause : handleStartGame}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-[10px] font-arcade text-slate-300"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : gameState === 'PLAYING' ? <Pause className="w-3.5 h-3.5" /> : 'START'}
            </button>
            <button
              onClick={() => handleUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-2 py-2 rounded border text-[10px] font-arcade transition-colors ${
                settings.autoFire
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              AUTO
            </button>
          </div>

          {/* Action Buttons: Bomb & Fire */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTouchBomb}
              disabled={bombs <= 0}
              className="w-12 h-12 bg-rose-900 active:bg-rose-700 disabled:opacity-40 border border-rose-600 rounded-full flex flex-col items-center justify-center font-arcade text-[8px] text-rose-200 active:scale-95 transition-all shadow-md touch-manipulation"
              title="EMP Bomb"
            >
              <Bomb className="w-4 h-4" />
              <span>EMP</span>
            </button>

            <button
              onPointerDown={handleTouchFire}
              className="w-16 h-12 bg-gradient-to-t from-red-700 to-red-500 active:from-red-600 active:to-red-400 border-2 border-red-400 rounded-xl flex items-center justify-center font-arcade text-xs text-white font-bold active:scale-95 transition-all shadow-lg shadow-red-600/30 touch-manipulation"
            >
              FIRE
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => {
          setShowLeaderboard(false);
          setPendingHighScore(undefined);
        }}
        pendingScore={pendingHighScore}
        onSaveScore={() => {
          setPendingHighScore(undefined);
        }}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};
