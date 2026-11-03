import React from 'react';
import { Settings, X, Volume2, VolumeX, Monitor, Zap, ShieldAlert } from 'lucide-react';
import { GameSettings } from '../game/types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-arcade tracking-wider text-cyan-400">
              SETTINGS · 설정
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>효과음 (SFX)</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1 font-arcade text-[10px] rounded transition-colors ${
                settings.soundEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* BGM Ambience */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>우주 배경음 (BGM)</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ bgmEnabled: !settings.bgmEnabled })}
              className={`px-3 py-1 font-arcade text-[10px] rounded transition-colors ${
                settings.bgmEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.bgmEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* CRT Scanlines */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Monitor className="w-4 h-4 text-yellow-400" />
              <span>CRT 스캔라인 필터</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ scanlines: !settings.scanlines })}
              className={`px-3 py-1 font-arcade text-[10px] rounded transition-colors ${
                settings.scanlines ? 'bg-yellow-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.scanlines ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Auto Fire */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>자동 연사 (AUTO-FIRE)</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-3 py-1 font-arcade text-[10px] rounded transition-colors ${
                settings.autoFire ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoFire ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Difficulty */}
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>난이도 (DIFFICULTY)</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['EASY', 'NORMAL', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => onUpdateSettings({ difficulty: diff })}
                  className={`py-1.5 font-arcade text-[9px] rounded text-center transition-colors ${
                    settings.difficulty === diff
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-arcade bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
