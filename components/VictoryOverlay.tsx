
import React from 'react';
import { Player } from '../types';

interface VictoryOverlayProps {
  winner: Player;
  allPlayers: Player[];
  onRestart: () => void;
}

const VictoryOverlay: React.FC<VictoryOverlayProps> = ({ winner, allPlayers, onRestart }) => {
  // 根據祭肉數量進行降序排列
  const sortedPlayers = [...allPlayers].sort((a, b) => b.meat - a.meat);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto overflow-hidden">
      {/* 背景光暈 */}
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md animate-fade-in"></div>
      <div className="absolute inset-0 bg-radial-gold opacity-30 animate-pulse"></div>

      {/* 飄落的花瓣與粒子 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-red-800 opacity-0 animate-petal-fall"
            style={{
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`
            }}
          >
            🌸
          </div>
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`gold-${i}`}
            className="absolute w-1 h-1 bg-amber-400 rounded-full opacity-0 animate-gold-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* 中央主體 */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-4 overflow-y-auto max-h-screen py-10">
        <div className="animate-victory-seal mb-6">
          <div className={`w-40 h-40 md:w-56 md:h-56 rounded-xl border-8 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)] ${winner.color} p-2 bg-stone-50 overflow-hidden`}>
            <img src={winner.avatar} alt={winner.character} className="w-full h-full" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-5xl md:text-7xl font-black text-amber-500 tracking-[0.4em] drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-victory-text mb-4">
            德配天下
          </h2>
          <p className="text-xl md:text-2xl font-bold text-white tracking-widest bg-amber-900/40 px-8 py-2 rounded-full border border-amber-500/30">
            恭喜 {winner.character} 教化大成
          </p>
        </div>

        {/* 成績結算單 */}
        <div className="w-full max-w-2xl bg-[#f4eee0] p-6 md:p-10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-x-[16px] border-stone-800/20 relative animate-paper-unroll">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-stone-800/10 to-transparent"></div>
          <h3 className="text-2xl font-black text-stone-800 text-center mb-8 border-b-2 border-stone-300 pb-4 flex items-center justify-center gap-3">
             <span className="text-amber-700">📜</span> 聖賢周遊功德榜
          </h3>
          
          <div className="space-y-4">
            {sortedPlayers.map((p, idx) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all 
                  ${p.id === winner.id 
                    ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-400/20' 
                    : 'bg-white/60 border-stone-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white 
                    ${idx === 0 ? 'bg-amber-600 scale-110 shadow-lg' : idx === 1 ? 'bg-stone-400' : 'bg-stone-300'}`}>
                    {idx + 1}
                  </div>
                  <div className={`w-12 h-12 rounded border-2 ${p.color} bg-white p-0.5 shadow-sm`}>
                    <img src={p.avatar} alt={p.character} className="w-full h-full" />
                  </div>
                  <div>
                    <div className="font-black text-stone-800">{p.character}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{p.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-stone-400">最終祭肉：</span>
                   <span className={`text-2xl font-black ${p.id === winner.id ? 'text-amber-700' : 'text-stone-600'}`}>
                    {p.meat}
                   </span>
                   <span className="text-lg">🍖</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-stone-500 italic text-sm mb-6">「夫子之道，至大無外，百世之師。」</p>
            <button 
                onClick={onRestart} 
                className="px-12 py-4 bg-stone-900 text-white rounded-full font-black text-xl hover:bg-black shadow-xl transition-all active:scale-95 border-b-4 border-stone-700"
            >
                重啟教化旅程
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-stone-800/10 to-transparent"></div>
        </div>
      </div>

      <style>{`
        .bg-radial-gold {
          background: radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%);
        }

        @keyframes petal-fall {
          0% { transform: translateY(-50px) rotate(0deg) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) translateX(100px); opacity: 0; }
        }

        @keyframes gold-drift {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }

        @keyframes victory-seal {
          0% { transform: scale(0.5) rotate(-20deg); opacity: 0; filter: blur(20px); }
          50% { transform: scale(1.1) rotate(5deg); opacity: 1; filter: blur(0); }
          70% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        @keyframes victory-text {
          0% { transform: scale(0.8); opacity: 0; letter-spacing: 0; }
          100% { transform: scale(1); opacity: 1; letter-spacing: 0.4em; }
        }

        @keyframes paper-unroll {
          0% { transform: scaleY(0.5); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }

        .animate-petal-fall { animation: petal-fall linear infinite; }
        .animate-gold-drift { animation: gold-drift ease-in-out infinite; }
        .animate-victory-seal { animation: victory-seal 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-victory-text { animation: victory-text 1.5s ease-out forwards; }
        .animate-paper-unroll { animation: paper-unroll 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: top; }
      `}</style>
    </div>
  );
};

export default VictoryOverlay;
