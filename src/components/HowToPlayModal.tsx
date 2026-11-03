import React from 'react';
import { HelpCircle, X, Shield, Bomb, Zap, Crosshair } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-arcade tracking-wider text-cyan-400">
              HOW TO PLAY · 게임 방법
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5 text-xs text-slate-300">
          {/* Controls */}
          <section>
            <h3 className="font-arcade text-xs text-yellow-400 mb-2 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" /> 조작 방법 (CONTROLS)
            </h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-cyan-400 font-bold">좌우 이동:</span> 방향키 (← / →) 또는 A / D
              </div>
              <div>
                <span className="text-cyan-400 font-bold">레이저 발사:</span> 스페이스바, ↑, W, J, Z
              </div>
              <div>
                <span className="text-cyan-400 font-bold">EMP 폭탄:</span> X, K, B 키
              </div>
              <div>
                <span className="text-cyan-400 font-bold">모바일:</span> 화면 하단 터치 버튼 제공
              </div>
            </div>
          </section>

          {/* Iconic Dual Fighter System */}
          <section className="bg-cyan-950/40 p-3 rounded border border-cyan-500/40">
            <h3 className="font-arcade text-xs text-cyan-300 mb-1.5 flex items-center gap-1">
              <Zap className="w-4 h-4 text-cyan-400" /> 듀얼 파이터 (DUAL FIGHTER) 핵심 전략!
            </h3>
            <p className="leading-relaxed text-slate-300 mb-2">
              최상단의 <strong>보스 커맨더</strong>가 급강하하며 <strong>트랙터 빔</strong>을 발사할 때 기체가 빨려 들어가 포획될 수 있습니다.
            </p>
            <p className="leading-relaxed text-slate-300">
              다음 기체로 플레이 중, <strong>포획된 내 전투기를 달고 급강하 공격해오는 보스를 격추</strong>하면 아군 기체가 구출되어 
              <span className="text-yellow-400 font-bold"> 2단 합체 듀얼 파이터</span>가 완성됩니다! 4연장 미사일로 2배의 화력을 발휘하세요.
            </p>
          </section>

          {/* Enemy Roster & Points */}
          <section>
            <h3 className="font-arcade text-xs text-yellow-400 mb-2">
              적 편대 격추 점수 (POINT VALUES)
            </h3>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded border border-slate-800">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-emerald-400 font-bold">드론 (초록색)</span>
                <span>편대: 30점 · 급강하: 60점</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-yellow-400 font-bold">스팅어 비 (노란벌)</span>
                <span>편대: 50점 · 급강하: 100점</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-rose-400 font-bold">에스코트 (빨간 호위기)</span>
                <span>편대: 80점 · 급강하: 160점</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-blue-400 font-bold">크루저 (파란 순양기)</span>
                <span>편대: 100점 · 급강하: 200점</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-purple-400 font-bold">보스 커맨더 (체력 2)</span>
                <span>편대: 150점 · 단독급강하: 400점 · 호위급강하: 800점</span>
              </div>
            </div>
          </section>

          {/* Special Stages */}
          <section>
            <h3 className="font-arcade text-xs text-yellow-400 mb-2">
              특수 스테이지 (SPECIAL STAGES)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="font-arcade text-[10px] text-cyan-300 mb-1">챌린징 보너스 스테이지</div>
                <p className="text-[11px] text-slate-400">
                  매 3스테이지마다 등장! 적이 총알을 쏘지 않고 화려한 아크로바틱 편대로 날아옵니다. 40기 전원 격추 시 <strong>10,000점 퍼펙트 보너스</strong>!
                </p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="font-arcade text-[10px] text-rose-400 mb-1">거대 모선 보스전</div>
                <p className="text-[11px] text-slate-400">
                  매 5스테이지마다 출현! 좌우 캐논 포탑과 에너지 코어를 파괴해야 클리어됩니다. 격파 시 <strong>5,000점 보너스</strong>!
                </p>
              </div>
            </div>
          </section>

          {/* Powerups */}
          <section>
            <h3 className="font-arcade text-xs text-yellow-400 mb-2">
              아이템 드랍 (POWER-UPS)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>[S] 쉴드:</strong> 1회 피격 방어 보호막</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Bomb className="w-4 h-4 text-rose-400 shrink-0" />
                <span><strong>[B] 폭탄:</strong> 적 탄환 소멸 및 광역 피해</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>[2X] 고속 연사:</strong> 발사 딜레이 대폭 감소</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                <span><strong>[W] 3방향 확산탄:</strong> 부채꼴 레이저 발사</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-arcade bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            CONFIRM · 확인
          </button>
        </div>
      </div>
    </div>
  );
};
