import React, { useState, useEffect } from 'react';
import { Trophy, X, Medal } from 'lucide-react';
import { HighScoreRecord } from '../game/types.ts';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingScore?: { score: number; stage: number; accuracy: number };
  onSaveScore?: (name: string) => void;
}

const DEFAULT_SCORES: HighScoreRecord[] = [
  { id: '1', name: 'KOR', score: 38400, stage: 8, accuracy: 88, date: '2026-11-01' },
  { id: '2', name: 'GAL', score: 29500, stage: 6, accuracy: 82, date: '2026-11-01' },
  { id: '3', name: 'ACE', score: 21800, stage: 5, accuracy: 79, date: '2026-10-30' },
  { id: '4', name: 'TOP', score: 18400, stage: 4, accuracy: 75, date: '2026-10-28' },
  { id: '5', name: 'SKY', score: 14200, stage: 3, accuracy: 71, date: '2026-10-25' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  pendingScore,
  onSaveScore,
}) => {
  const [scores, setScores] = useState<HighScoreRecord[]>([]);
  const [initials, setInitials] = useState('AAA');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('galaxy_arcade_leaderboard');
      if (stored) {
        setScores(JSON.parse(stored));
      } else {
        setScores(DEFAULT_SCORES);
        localStorage.setItem('galaxy_arcade_leaderboard', JSON.stringify(DEFAULT_SCORES));
      }
    } catch {
      setScores(DEFAULT_SCORES);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInitials = (initials.trim().toUpperCase() || 'AAA').slice(0, 3);
    if (pendingScore && onSaveScore) {
      const newRecord: HighScoreRecord = {
        id: Date.now().toString(),
        name: cleanInitials,
        score: pendingScore.score,
        stage: pendingScore.stage,
        accuracy: pendingScore.accuracy,
        date: new Date().toISOString().split('T')[0],
      };
      const updated = [...scores, newRecord].sort((a, b) => b.score - a.score).slice(0, 10);
      setScores(updated);
      try {
        localStorage.setItem('galaxy_arcade_leaderboard', JSON.stringify(updated));
      } catch {
        // ignore
      }
      onSaveScore(cleanInitials);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 shadow-2xl shadow-cyan-500/20 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-arcade tracking-wider text-yellow-400">
              HALL OF FAME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enter Name Prompt if Pending New High Score */}
        {pendingScore && (
          <form onSubmit={handleSave} className="my-4 p-3 bg-slate-800/80 border border-yellow-500/50 rounded text-center">
            <div className="text-xs font-arcade text-yellow-300 mb-2">NEW HIGH SCORE RECORD!</div>
            <div className="text-lg font-bold text-white mb-3">
              {pendingScore.score.toLocaleString()} PTS (STAGE {pendingScore.stage})
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <label htmlFor="initials" className="text-xs text-slate-300 font-arcade">INITIALS:</label>
              <input
                id="initials"
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="w-20 px-2 py-1 text-center font-arcade text-lg tracking-widest bg-black border-2 border-cyan-400 rounded text-cyan-300 uppercase focus:outline-none focus:border-yellow-400"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-arcade bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded shadow transition-colors"
            >
              RECORD SCORE
            </button>
          </form>
        )}

        {/* Scores Table */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-12 text-xs font-arcade text-slate-400 pb-2 border-b border-slate-800">
            <span className="col-span-2">RANK</span>
            <span className="col-span-3">NAME</span>
            <span className="col-span-4 text-right">SCORE</span>
            <span className="col-span-3 text-right">STG</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-tech">
            {scores.map((record, index) => {
              const isTop3 = index < 3;
              const rankColor =
                index === 0
                  ? 'text-yellow-400'
                  : index === 1
                  ? 'text-slate-300'
                  : index === 2
                  ? 'text-amber-600'
                  : 'text-slate-500';

              return (
                <div
                  key={record.id}
                  className={`grid grid-cols-12 items-center text-sm py-1 px-2 rounded ${
                    index % 2 === 0 ? 'bg-slate-800/40' : 'bg-transparent'
                  }`}
                >
                  <span className={`col-span-2 font-arcade text-xs flex items-center gap-1 ${rankColor}`}>
                    {isTop3 && <Medal className="w-3.5 h-3.5 inline" />}
                    {index + 1}
                  </span>
                  <span className="col-span-3 font-arcade text-xs tracking-wider text-cyan-300">
                    {record.name}
                  </span>
                  <span className="col-span-4 text-right font-mono font-bold text-white">
                    {record.score.toLocaleString()}
                  </span>
                  <span className="col-span-3 text-right text-xs text-slate-400 font-mono">
                    STAGE {record.stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-arcade bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
