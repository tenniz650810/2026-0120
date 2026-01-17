
import React from 'react';

interface PauseEffectProps {
  character: string;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
}

const PauseEffect: React.FC<PauseEffectProps> = ({ character, showConfirmButton, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto overflow-hidden font-serif">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[4px] animate-fade-in"></div>
      
      <div className="relative flex flex-col items-center animate-pause-pop w-full max-w-lg px-6">
        <div className="text-9xl mb-6 filter drop-shadow-[0_0_20px_rgba(139,0,0,0.6)] animate-bounce-slow">🧘</div>
        <div className="bg-stone-800 text-white px-12 py-6 rounded-2xl border-4 border-stone-400 shadow-[0_0_50px_rgba(0,0,0,0.6)] text-center w-full">
          <span className="text-3xl md:text-4xl font-black tracking-[0.3em] block mb-2">{character} 暫停行動</span>
          <div className="text-stone-300 font-bold text-lg md:text-xl italic tracking-widest bg-black/20 px-4 py-2 rounded-lg">
            「窮則獨善其身，靜待時機」
          </div>
        </div>

        {showConfirmButton && onConfirm && (
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className="mt-10 px-16 py-4 bg-amber-600 text-white rounded-full font-black text-2xl tracking-[0.4em] shadow-2xl hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all border-b-4 border-amber-800 animate-pulse"
          >
            確認跳過
          </button>
        )}
      </div>

      <style>{`
        @keyframes pause-pop {
          0% { transform: scale(0.5) translateY(50px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-pause-pop {
          animation: pause-pop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PauseEffect;
