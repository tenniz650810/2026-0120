
import React from 'react';
import { Player } from '../types';

interface PlayerInfoProps {
  players: Player[];
  currentIndex: number;
  winCondition: number;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ players, currentIndex, winCondition }) => {
  return (
    <div className="space-y-4">
      {players.map((p, i) => (
        <div 
          key={p.id}
          id={`player-info-${i}`}
          className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col relative overflow-hidden
            ${i === currentIndex 
              ? 'bg-white border-stone-800 shadow-xl scale-105 ring-4 ring-amber-400/30' 
              : 'bg-stone-50 border-stone-200 opacity-80'}`}
        >
          {/* 背景裝飾：當前玩家會有淡色光暈 */}
          {i === currentIndex && (
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-100 rounded-full blur-2xl opacity-50"></div>
          )}

          <div className="flex items-start justify-between mb-2 z-10">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg border-2 ${p.color} overflow-hidden shadow-md bg-stone-50 flex-shrink-0 relative`}>
                <img src={p.avatar} alt={p.character} className="w-full h-full p-0.5" />
              </div>
              <div>
                <div className="font-black text-lg text-stone-800 flex items-center gap-2">
                  {p.character}
                  {p.isAI && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold">AI</span>
                  )}
                  {i === currentIndex && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                  )}
                </div>
                <div className="text-xs text-stone-500 font-medium">{p.name}</div>
              </div>
            </div>
            
            {/* 狀態標籤區 */}
            <div className="flex flex-col items-end gap-1">
              {i === currentIndex && (
                <span className="text-[10px] bg-stone-800 text-white px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                  目前回合
                </span>
              )}
              {p.isPaused && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold animate-pulse shadow-sm">
                  暫停中
                </span>
              )}
              {p.hasProtection && (
                <span className="text-[10px] bg-amber-500 text-stone-900 px-2 py-0.5 rounded font-bold shadow-sm">
                  仁德護體
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 bg-stone-100 p-3 rounded-lg border border-stone-200 shadow-inner z-10">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">祭肉數量</div>
              <div className="text-2xl font-black text-amber-700">
                {p.meat} <span className="text-sm font-normal text-stone-400">/ {winCondition}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-stone-300"></div>
            <div className="flex-1 text-center">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">遊歷狀態</div>
              <div className={`text-sm font-black transition-colors ${p.isPaused ? 'text-red-600' : 'text-green-700'}`}>
                {p.isPaused ? '暫停中' : '週遊列國'}
              </div>
            </div>
          </div>

          {/* 祭肉進度條簡易示意 */}
          <div className="w-full h-1 bg-stone-200 mt-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500" 
              style={{ width: `${Math.min(p.meat * (100 / winCondition), 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerInfo;
