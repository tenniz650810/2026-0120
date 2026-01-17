
import React, { useEffect } from 'react';
import { TrialCard, FateCard, ChanceCard, Player, GameMode } from '../types';

interface CardModalProps {
  type: 'TRIAL' | 'FATE' | 'CHANCE' | 'WIN' | 'EVENT_DETAIL' | null;
  trial: TrialCard | null;
  fate: FateCard | null;
  chance: ChanceCard | null;
  eventData?: { title: string, content: string, effectLabel: string } | null;
  winner?: Player;
  allPlayers?: Player[]; 
  currentPlayerName?: string;
  onTrialResolve: (selectedIdx: number) => void;
  onTrialConfirm?: () => void;
  onFateResolve: () => void;
  onChanceResolve: () => void;
  onEventResolve?: () => void;
  onRestart?: () => void;
  onClose: () => void;
  playSfx: (soundName: string) => void;
  isAI?: boolean;
  trialSelection?: { selected: number | null, isRevealed: boolean };
  gameMode: GameMode;
  waitingForHumanConfirmation: boolean;
  aiDecisionMadeInModal: any;
  handleHumanConfirmation: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ 
  type, trial, fate, chance, eventData, winner, currentPlayerName,
  onTrialResolve, onTrialConfirm, onFateResolve, onChanceResolve, onEventResolve, onRestart, onClose, playSfx, isAI, trialSelection,
  gameMode, waitingForHumanConfirmation, aiDecisionMadeInModal, handleHumanConfirmation
}) => {

  useEffect(() => {
    if (type && type !== 'WIN') playSfx('cardFlip');
  }, [type, playSfx]);

  if (!type) return null;

  const handleOptionClick = (i: number) => {
    if (isAI || trialSelection?.isRevealed || waitingForHumanConfirmation) return;
    playSfx('click');
    onTrialResolve(i);
  };

  const currentSelected = trialSelection?.selected ?? null;
  const isRevealed = trialSelection?.isRevealed ?? false;

  const getHighlightColor = (text: string) => {
    if (text.includes('失去') || text.includes('扣除') || text.includes('暫停') || text.includes('絕糧')) return 'text-red-700';
    if (text.includes('獲得') || text.includes('獲贈') || text.includes('領取')) return 'text-amber-600';
    return 'text-stone-800';
  };

  const isButtonDisabled = (isAIPlayer: boolean) => {
    if (isAIPlayer) {
      if (waitingForHumanConfirmation) return false;
      return true;
    }
    return false;
  };

  const AiIndicator = () => (
    <div className="absolute top-0 left-0 right-0 z-50 animate-fade-in">
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-center gap-3 shadow-lg border-b border-amber-600">
            <span className="text-xl animate-pulse">🤖</span>
            <span className="font-black tracking-widest text-sm md:text-base animate-pulse">
                電腦 AI [{currentPlayerName}] {gameMode === 'quick' ? '正在自動執行行動...' : '正在思考中...'}
            </span>
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
        </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 ${type === 'WIN' ? 'bg-transparent pointer-events-none' : 'bg-black/80 backdrop-blur-md'} animate-fade-in font-serif`}>
      <div className={`rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-4 md:border-8 border-double border-stone-200 transition-all pointer-events-auto relative flex flex-col max-h-[96vh] ${type === 'WIN' ? 'mt-80 scale-110 border-amber-500 bg-stone-900 text-white' : 'bg-white'}`}>
        
        {isAI && type !== 'WIN' && <AiIndicator />}
        {isAI && waitingForHumanConfirmation && type !== 'WIN' && (
             <div className="absolute top-0 left-0 right-0 z-50 bg-red-800 text-white px-4 py-2 text-center text-sm md:text-base font-black tracking-widest animate-pulse border-b-2 border-red-900 shadow-lg">
                AI 行動已準備就緒，請點擊下方按鈕確認
             </div>
        )}

        <div className={`flex-1 overflow-y-auto ${isAI && type !== 'WIN' ? 'pt-12' : ''}`}>
            {type === 'TRIAL' && (trial && (
              <div className="p-4 md:p-8 flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4 text-stone-800 border-b pb-2 flex items-center justify-between flex-shrink-0">
                    <span className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-stone-800 text-white flex items-center justify-center rounded-sm text-sm">試</span>
                        文化試煉
                        {trial.isAiGenerated && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-600 border border-amber-300 px-2 py-0.5 rounded-full font-black animate-pulse">
                                ✨ AI 即時啟示
                            </span>
                        )}
                    </span>
                    {(isRevealed || (isAI && aiDecisionMadeInModal?.type === 'TRIAL' && (waitingForHumanConfirmation || gameMode === 'quick'))) && (
                        <span className={`text-sm font-black px-3 py-1 rounded-full animate-bounce ${
                            (aiDecisionMadeInModal?.choice ?? currentSelected) === trial.answerIndex ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                            {(aiDecisionMadeInModal?.choice ?? currentSelected) === trial.answerIndex ? '✓ 答對了' : '✗ 答錯了'}
                        </span>
                    )}
                </h2>

                <div className="bg-stone-50 p-4 rounded-lg mb-4 italic text-sm md:text-base text-stone-700 border-l-4 border-stone-800 shadow-inner leading-relaxed flex-shrink-0">
                    「{trial.quote}」
                </div>
                
                {!(isRevealed || (isAI && aiDecisionMadeInModal?.type === 'TRIAL' && (waitingForHumanConfirmation || gameMode === 'quick'))) ? (
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-base md:text-lg font-bold mb-4 text-stone-900 leading-tight">{trial.question}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {trial.options.map((opt, i) => {
                                const isCurrentSelected = currentSelected === i;
                                return (
                                    <button
                                        key={i}
                                        disabled={isRevealed || isAI || waitingForHumanConfirmation}
                                        onClick={() => handleOptionClick(i)}
                                        className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all duration-300 relative group
                                            ${isCurrentSelected 
                                                ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-400/30 scale-[1.02] shadow-lg animate-pulse' 
                                                : 'border-stone-100 hover:border-stone-300 hover:bg-stone-50'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${isCurrentSelected ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                                                {opt[0]}
                                            </span>
                                            <span className="text-sm md:text-base leading-tight font-medium text-stone-800">{opt.substring(2)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-4 pb-4">
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm">
                            <h4 className="font-black text-green-900 mb-2 flex items-center text-sm md:text-base">
                                <span className="mr-2">💡</span> 正確答案：{trial.options[trial.answerIndex]}
                            </h4>
                            <p className="text-green-800 text-xs md:text-sm leading-relaxed indent-4">{trial.analysis}</p>
                        </div>
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                            <h4 className="font-bold text-stone-500 mb-1 text-[10px] uppercase tracking-widest">【 出典與章句原文 】</h4>
                            <p className="text-stone-600 text-[11px] md:text-xs italic leading-relaxed">{trial.quote}</p>
                        </div>
                        {(!isAI || waitingForHumanConfirmation) && (
                            <button 
                                disabled={isButtonDisabled(isAI || false)}
                                onClick={() => { 
                                    playSfx('click'); 
                                    if (isAI && waitingForHumanConfirmation) {
                                        handleHumanConfirmation();
                                    } else {
                                        onTrialConfirm?.(); 
                                    }
                                }}
                                className={`w-full py-4 rounded-xl font-black tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:bg-stone-400 disabled:cursor-not-allowed
                                    ${isAI && waitingForHumanConfirmation ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' : 'bg-stone-900 hover:bg-black text-white'}`}
                            >
                                {isAI && waitingForHumanConfirmation ? '確認 AI 行動並繼續' : '繼續遊歷'}
                            </button>
                        )}
                        {isAI && gameMode === 'quick' && (
                            <div className="w-full py-4 text-center font-bold text-amber-600 animate-pulse">
                                ⚡ 快速模式：AI 行動即將自動繼續...
                            </div>
                        )}
                    </div>
                )}
              </div>
            ))}

            {type === 'FATE' && (fate && (
              <div className="p-4 md:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-stone-900 text-[#FFD700] flex items-center justify-center rounded-full text-4xl md:text-6xl font-black mb-6 shadow-2xl border-4 border-[#FFD700]/30 animate-fate-card-reveal">
                    ！
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 mb-2 tracking-widest">命運降臨</h2>
                <h3 className="text-lg md:text-xl font-bold text-red-900 mb-6 border-b border-red-100 pb-2">{fate.title}</h3>
                <div className="bg-stone-50 p-6 rounded-2xl border-2 border-stone-100 mb-8 shadow-inner w-full">
                    <p className="text-base md:text-lg text-stone-700 leading-relaxed font-medium">
                        {fate.narrative || fate.description}
                    </p>
                </div>
                {(!isAI || waitingForHumanConfirmation) && (
                    <button 
                    disabled={isButtonDisabled(isAI || false)}
                    onClick={() => { 
                        playSfx('click'); 
                        if (isAI && waitingForHumanConfirmation) {
                            handleHumanConfirmation();
                        } else {
                            onFateResolve(); 
                        }
                    }}
                    className={`w-full py-4 rounded-xl font-black tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:bg-stone-400 disabled:cursor-not-allowed
                        ${isAI && waitingForHumanConfirmation ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' : 'bg-stone-900 hover:bg-black text-white'}`}
                    >
                        {isAI && waitingForHumanConfirmation ? '確認 AI 行動並繼續' : '接受命運'}
                    </button>
                )}
                {isAI && gameMode === 'quick' && (
                    <div className="w-full py-4 text-center font-bold text-amber-600 animate-pulse">
                        ⚡ 快速模式：AI 即將自動接受命運...
                    </div>
                )}
              </div>
            ))}

            {type === 'CHANCE' && (chance && (
              <div className="p-4 md:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-500 text-black flex items-center justify-center rounded-full text-4xl md:text-6xl font-black mb-6 shadow-2xl border-4 border-amber-600/30 animate-chance-card-reveal">
                    ？
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 mb-2 tracking-widest">機緣已至</h2>
                <h3 className="text-lg md:text-xl font-bold text-amber-700 mb-6 border-b border-amber-100 pb-2">{chance.title}</h3>
                
                <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 mb-6 shadow-inner w-full text-left">
                    <p className="text-sm md:text-base text-amber-900 italic mb-4 leading-relaxed border-l-4 border-amber-300 pl-4">
                        「{chance.narrative}」
                    </p>
                    <div className="bg-white/80 p-4 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">當前挑戰</span>
                        <p className="text-base md:text-lg font-black text-stone-800">{chance.challenge}</p>
                    </div>
                </div>

                {(!isAI || waitingForHumanConfirmation) && (
                    <button 
                    disabled={isButtonDisabled(isAI || false)}
                    onClick={() => { 
                        playSfx('click'); 
                        if (isAI && waitingForHumanConfirmation) {
                            handleHumanConfirmation();
                        } else {
                            onChanceResolve(); 
                        }
                    }}
                    className={`w-full py-4 rounded-xl font-black tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:bg-stone-400 disabled:cursor-not-allowed
                        ${isAI && waitingForHumanConfirmation ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                    >
                        {isAI && waitingForHumanConfirmation ? '確認 AI 行動並繼續' : '把握機緣'}
                    </button>
                )}
                {isAI && gameMode === 'quick' && (
                    <div className="w-full py-4 text-center font-bold text-amber-600 animate-pulse">
                        ⚡ 快速模式：AI 即將自動把握機緣...
                    </div>
                )}
              </div>
            ))}

            {type === 'EVENT_DETAIL' && (eventData && (
               <div className="p-4 md:p-8 flex flex-col">
                  <h2 className="text-2xl md:text-3xl font-black text-stone-900 mb-6 border-b-4 border-stone-800 pb-2 flex items-center gap-3">
                    <span className="w-8 h-8 bg-stone-800 text-white flex items-center justify-center rounded-sm text-sm">史</span>
                    {eventData.title}
                  </h2>
                  
                  <div className="bg-stone-50 p-6 rounded-2xl border-2 border-stone-100 mb-8 shadow-inner">
                    <p className="text-base md:text-lg text-stone-700 leading-relaxed font-medium indent-8">
                        {eventData.content}
                    </p>
                  </div>

                  <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200 mb-8 text-center shadow-md animate-pulse">
                     <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.3em] block mb-1">事件後果</span>
                     <p className={`text-xl md:text-2xl font-black ${getHighlightColor(eventData.effectLabel)}`}>
                        {eventData.effectLabel}
                     </p>
                  </div>

                  {(!isAI || waitingForHumanConfirmation) && (
                    <button 
                        disabled={isButtonDisabled(isAI || false)}
                        onClick={() => { 
                            playSfx('click'); 
                            if (isAI && waitingForHumanConfirmation) {
                                handleHumanConfirmation();
                            } else {
                                onEventResolve?.(); 
                            }
                        }}
                        className={`w-full py-4 rounded-xl font-black tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:bg-stone-400 disabled:cursor-not-allowed
                            ${isAI && waitingForHumanConfirmation ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' : 'bg-stone-900 hover:bg-black text-white'}`}
                    >
                        {isAI && waitingForHumanConfirmation ? '確認 AI 行動並繼續' : '領悟教誨'}
                    </button>
                  )}
                  {isAI && gameMode === 'quick' && (
                    <div className="w-full py-4 text-center font-bold text-amber-600 animate-pulse">
                        ⚡ 快速模式：AI 即將自動領悟史實...
                    </div>
                  )}
               </div>
            ))}
        </div>

        {type !== 'WIN' && !isAI && (
            <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end flex-shrink-0">
                <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold text-sm tracking-widest transition-colors">暫時關閉</button>
            </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
