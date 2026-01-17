
import React, { useState, useEffect, useCallback } from 'react';
import { Player, Character, GameMode } from '../types';
import { AVAILABLE_CHARACTERS } from '../constants';

interface StartScreenProps {
  onStartGame: (players: Player[], winCondition: number, gameMode: GameMode) => void;
  playSfx: (sound: any) => void;
}

interface SetupPlayer {
  id: number;
  name: string;
  character: Character | '';
  avatar: string;
  color: string;
  isAI: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, playSfx }) => {
  const [numPlayers, setNumPlayers] = useState(2);
  const [winGoal, setWinGoal] = useState(10);
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [setupPlayers, setSetupPlayers] = useState<SetupPlayer[]>([]);

  // Effect to initialize or adjust players when numPlayers changes
  useEffect(() => {
    setSetupPlayers(prevPlayers => {
      const newPlayers: SetupPlayer[] = [];
      const usedCharacters = new Set<Character>();

      // Keep existing players and characters if possible
      for (let i = 0; i < numPlayers; i++) {
        let existingPlayer = prevPlayers.find(p => p.id === i);
        if (existingPlayer && existingPlayer.character && AVAILABLE_CHARACTERS.some(c => c.name === existingPlayer?.character && !usedCharacters.has(c.name))) {
            newPlayers.push(existingPlayer);
            usedCharacters.add(existingPlayer.character);
        } else {
            // Assign new defaults if player doesn't exist or character is taken
            const defaultCharacter = AVAILABLE_CHARACTERS.find(c => !usedCharacters.has(c.name));
            if (defaultCharacter) {
                newPlayers.push({
                    id: i,
                    name: i === 0 ? `賢士 ${i + 1}` : `電腦 ${i + 1}`,
                    character: defaultCharacter.name,
                    avatar: defaultCharacter.avatar,
                    color: defaultCharacter.color,
                    isAI: i > 0, // First player is human by default
                });
                usedCharacters.add(defaultCharacter.name);
            }
        }
      }
      return newPlayers;
    });
  }, [numPlayers]);

  const handleNumPlayersChange = (n: number) => {
    playSfx('click');
    setNumPlayers(n);
  };

  const handleGameModeChange = (mode: GameMode) => {
    playSfx('click');
    setGameMode(mode);
  };

  const handlePlayerNameChange = (id: number, name: string) => {
    setSetupPlayers(prev => prev.map(p => p.id === id ? { ...p, name: name.slice(0, 8) } : p));
  };

  const handleToggleAI = (id: number) => {
    playSfx('click');
    setSetupPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newIsAI = !p.isAI;
      return { 
        ...p, 
        isAI: newIsAI,
        name: newIsAI ? `電腦 ${p.id + 1}` : `賢士 ${p.id + 1}` 
      };
    }));
  };

  const handlePlayerCharacterChange = useCallback((id: number, characterName: Character) => {
    const char = AVAILABLE_CHARACTERS.find(c => c.name === characterName);
    if (!char) return;
    
    const isTakenByOther = setupPlayers.some(p => p.id !== id && p.character === characterName);
    if (isTakenByOther) return;

    playSfx('click');
    setSetupPlayers(prev => prev.map(p => p.id === id ? { 
      ...p, 
      character: characterName, 
      color: char.color,
      avatar: char.avatar,
    } : p));
  }, [setupPlayers, playSfx]);

  const isFormValid = useCallback(() => {
    const selectedCharacters = new Set(setupPlayers.map(p => p.character));
    return selectedCharacters.size === numPlayers && setupPlayers.every(p => p.name.trim() !== '');
  }, [setupPlayers, numPlayers]);

  const startGame = () => {
    playSfx('click');
    if (!isFormValid()) return;

    const playersToStart: Player[] = setupPlayers.map(sp => ({
      id: sp.id,
      name: sp.name,
      character: sp.character as Character,
      avatar: sp.avatar,
      position: 0,
      meat: 0,
      isPaused: false,
      wasPaused: false, // 初始化標記
      turnsToSkip: 0,
      color: sp.color,
      hasProtection: false,
      isAI: sp.isAI,
    }));
    onStartGame(playersToStart, winGoal, gameMode);
  };

  const getTakenCharacters = useCallback((currentPlayerId: number) => {
    return new Set(setupPlayers.filter(p => p.id !== currentPlayerId).map(p => p.character));
  }, [setupPlayers]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fdfaf5] relative overflow-hidden font-serif">
      <div className="absolute inset-0 z-0">
        <div className="ink-blob w-[800px] h-[800px] -top-40 -left-40 opacity-5 blur-[100px]"></div>
        <div className="ink-blob w-[600px] h-[600px] bottom-0 right-0 opacity-5 blur-[80px]" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-10 right-10 text-[12rem] font-black text-stone-200/20 select-none writing-vertical pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
          仁義禮智信
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center py-8">
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black text-stone-900 tracking-tighter drop-shadow-sm mb-4">
            孔子<span className="text-red-900">周遊</span>列國
          </h1>
          <p className="text-stone-500 italic text-lg tracking-widest">聖賢之路，從選擇你的名諱開始</p>
        </div>

        <div className="w-full bg-[#f9f4ea] rounded-xl shadow-2xl p-6 md:p-12 border-x-[12px] border-stone-800/10 animate-paper-unroll min-h-[500px] flex flex-col space-y-8">
          {/* 遊戲模式選擇 */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-stone-800 tracking-widest mb-6">選擇遊戲模式</h2>
            <div className="flex justify-center flex-wrap gap-4 md:gap-8">
              <button
                onClick={() => handleGameModeChange('quick')}
                className={`group w-36 h-28 bg-white border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center relative overflow-hidden
                  ${gameMode === 'quick' ? 'border-red-900 ring-4 ring-red-300' : 'border-stone-200'}`}
              >
                <span className="text-2xl mb-1">⚡</span>
                <span className="text-stone-800 font-bold tracking-widest text-sm">快速遊戲</span>
                <p className="text-stone-500 text-[9px] mt-1">AI自動</p>
              </button>
              <button
                onClick={() => handleGameModeChange('normal')}
                className={`group w-36 h-28 bg-white border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center relative overflow-hidden
                  ${gameMode === 'normal' ? 'border-red-900 ring-4 ring-red-300' : 'border-stone-200'}`}
              >
                <span className="text-2xl mb-1">📚</span>
                <span className="text-stone-800 font-bold tracking-widest text-sm">一般遊戲</span>
                <p className="text-stone-500 text-[9px] mt-1">手動確認</p>
              </button>
              <button
                onClick={() => handleGameModeChange('advanced')}
                className={`group w-36 h-28 bg-white border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center relative overflow-hidden
                  ${gameMode === 'advanced' ? 'border-amber-600 ring-4 ring-amber-300' : 'border-stone-200'}`}
              >
                <div className="absolute top-1 right-1">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                </div>
                <span className="text-2xl mb-1">✨</span>
                <span className="text-stone-800 font-bold tracking-widest text-sm">進階遊戲</span>
                <p className="text-amber-700 text-[9px] mt-1 font-bold">AI 即時命題</p>
              </button>
            </div>
          </div>

          {/* 玩家人數選擇 */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-stone-800 tracking-widest mb-6">選擇賢士人數</h2>
            <div className="flex justify-center gap-6 md:gap-12">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => handleNumPlayersChange(n)}
                  className={`group w-24 h-24 bg-white border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center relative overflow-hidden
                    ${numPlayers === n ? 'border-red-900 ring-4 ring-red-300' : 'border-stone-200'}`}
                >
                  <span className="text-4xl font-black text-stone-800 group-hover:text-red-900 transition-colors z-10">{n}</span>
                  <span className="text-stone-600 font-bold tracking-widest text-sm z-10 mt-1">人同行</span>
                </button>
              ))}
            </div>
          </div>

          {/* 勝利條件調整區 */}
          <div className="bg-white/40 p-6 rounded-xl border border-stone-200 shadow-inner flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 text-center md:text-left">
              <h3 className="text-lg font-black text-stone-800">勝利條件：教化大成</h3>
              <p className="text-xs text-stone-500 font-serif italic">獲取足夠的祭肉以結束旅程</p>
            </div>
            <div className="flex-grow w-full flex items-center gap-4">
              <span className="text-sm font-bold text-stone-400">5</span>
              <input 
                type="range" 
                min="5" 
                max="20" 
                value={winGoal} 
                onChange={(e) => setWinGoal(parseInt(e.target.value))}
                className="flex-grow h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-red-900"
              />
              <span className="text-sm font-bold text-stone-400">20</span>
            </div>
            <div className="flex-shrink-0 bg-red-900 text-white px-6 py-2 rounded-lg shadow-lg">
              <span className="text-2xl font-black">{winGoal}</span>
              <span className="text-xs ml-1 font-bold">塊祭肉</span>
            </div>
          </div>

          {/* 賢士登錄 */}
          <div>
            <h2 className="text-3xl font-black text-stone-800 tracking-widest text-center mb-6">賢士登錄</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {setupPlayers.map((p, idx) => {
                const taken = getTakenCharacters(p.id);
                return (
                  <div key={p.id} className="bg-white/70 p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-6 group hover:bg-white transition-all relative">
                    <div className="relative flex-shrink-0">
                      <div className={`w-24 h-24 rounded-lg border-2 ${p.character ? 'border-red-900 shadow-lg' : 'border-stone-200'} bg-stone-50 overflow-hidden`}>
                        <img src={p.avatar} alt={p.character} className="w-full h-full p-1" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-stone-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {p.isAI ? '電腦' : `玩家 ${idx + 1}`}
                      </div>
                    </div>
                    <div className="flex-grow space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handlePlayerNameChange(p.id, e.target.value)}
                          className="bg-transparent border-b-2 border-stone-200 focus:border-red-900 outline-none text-xl font-black py-1 text-stone-800 placeholder:text-stone-300 transition-colors w-32"
                          placeholder="輸入名諱"
                        />
                        <button 
                          onClick={() => handleToggleAI(p.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all border ${p.isAI ? 'bg-amber-600 text-white border-amber-700' : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'}`}
                        >
                          {p.isAI ? '🤖 電腦控管' : '👤 親自操作'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {AVAILABLE_CHARACTERS.map(char => {
                          const isTaken = taken.has(char.name);
                          const isSelected = p.character === char.name;
                          return (
                            <button
                              key={char.name}
                              onClick={() => handlePlayerCharacterChange(p.id, char.name)}
                              disabled={isTaken && !isSelected}
                              className={`w-10 h-10 rounded-md border-2 transition-all flex items-center justify-center
                                ${isSelected ? 'border-red-900 bg-red-50 ring-2 ring-red-900/10 scale-110' : 'border-stone-100 opacity-40 hover:opacity-100'}
                                ${isTaken && !isSelected ? 'hidden' : ''}`}
                              title={char.name}
                            >
                              <img src={char.avatar} alt={char.name} className="w-full h-full p-0.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button
              onClick={startGame}
              disabled={!isFormValid()}
              className={`px-20 py-5 rounded-full font-black text-2xl tracking-[0.5em] transition-all shadow-xl
                ${isFormValid() 
                  ? 'bg-red-900 text-white hover:bg-red-950 hover:scale-105 active:scale-95' 
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'}`}
            >
              啟程周遊
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .writing-vertical { writing-mode: vertical-rl; text-orientation: upright; }
        @keyframes paper-unroll {
          0% { transform: scaleY(0.8); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        .animate-paper-unroll {
          animation: paper-unroll 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
        }
      `}</style>
    </div>
  );
};

export default StartScreen;
