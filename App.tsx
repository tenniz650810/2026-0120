
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, TileType, TrialCard, FateCard, ChanceCard, Character, GameMode } from './types';
import { BOARD_TILES, TRIAL_CARDS, FATE_CARDS, CHANCE_CARDS } from './constants';
import Board from './components/Board';
import PlayerInfo from './components/PlayerInfo';
import { CardModal } from './components/CardModal';
import AudioSettings from './components/AudioSettings';
import StartScreen from './components/StartScreen';
import MeatEffect from './components/MeatEffect';
import VictoryOverlay from './components/VictoryOverlay';
import RecoveryEffect from './components/RecoveryEffect';
import PauseEffect from './components/PauseEffect';
import { GoogleGenAI, Type } from "@google/genai";

const audioSources = {
  bgm: '/audio/bgm.mp3',
  diceRoll: '/audio/dice_roll.mp3',
  move: '/audio/move.mp3',
  getMeat: '/audio/get_meat.mp3',
  cardFlip: '/audio/card_flip.mp3',
  correctAnswer: '/audio/correct_answer.mp3',
  incorrectAnswer: '/audio/incorrect_answer.mp3',
  winGame: '/audio/win_game.mp3',
  click: '/audio/click.mp3',
  turnStart: '/audio/turn_start.mp3',
};

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [players, setPlayers] = useState<Player[]>([]);
  const [winCondition, setWinCondition] = useState(10);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceRolls, setDiceRolls] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [activeModal, setActiveModal] = useState<'TRIAL' | 'FATE' | 'CHANCE' | 'WIN' | 'EVENT_DETAIL' | null>(null);
  const [activeTrial, setActiveTrial] = useState<TrialCard | null>(null);
  const [activeFate, setActiveFate] = useState<FateCard | null>(null);
  const [activeChance, setActiveChance] = useState<ChanceCard | null>(null);
  const [activeEventData, setActiveEventData] = useState<{title: string, content: string, effectLabel: string, effectType?: 'PAUSE' | 'LOSE_MEAT' | 'GAIN_MEAT'} | null>(null);
  const [gameLog, setGameLog] = useState<string[]>(['【公告】歡迎來到孔子周遊列國遊戲！請各位賢士各就各位。']);

  const [isAiGeneratingTrial, setIsAiGeneratingTrial] = useState(false);
  const [showBigIcon, setShowBigIcon] = useState<'CHANCE' | 'FATE' | null>(null);
  const [trialSelection, setTrialSelection] = useState<{ selected: number | null, isRevealed: boolean }>({ selected: null, isRevealed: false });
  const [showRecovery, setShowRecovery] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [waitingForHumanConfirmation, setWaitingForHumanConfirmation] = useState(false);
  const [aiDecisionMadeInModal, setAiDecisionMadeInModal] = useState<any>(null);

  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const [sfxVolume, setSfxVolume] = useState(0.7);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  
  const [meatAnimationTarget, setMeatAnimationTarget] = useState<number | null>(null);
  const [meatAnimationAmount, setMeatAnimationAmount] = useState(0);
  const [meatAnimationTitle, setMeatAnimationTitle] = useState<string | null>(null);
  const [meatAnimationCallback, setMeatAnimationCallback] = useState<(() => void) | null>(null);
  const [isBoardCelebrating, setIsBoardCelebrating] = useState(false);

  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const rollTimeoutRef = useRef<number | null>(null); 
  const aiRollTimeoutRef = useRef<number | null>(null); 
  const aiModalDecisionTimeoutRef = useRef<number | null>(null);

  const handleTileActionRef = useRef<((tileIndex: number) => Promise<void>) | null>(null);
  const movePlayerRef = useRef<((steps: number, targetPlayerId?: number) => Promise<void>) | null>(null);
  const resolveTrialRef = useRef<((correct: boolean, aiChosenIndex?: number) => void) | null>(null);
  const onFateResolveRef = useRef<(() => void) | null>(null);
  const onChanceResolveRef = useRef<(() => void) | null>(null);
  const onEventResolveRef = useRef<(() => void) | null>(null);
  
  const log = useCallback((msg: string) => {
    setGameLog(prev => [msg, ...prev].slice(0, 15));
  }, []);

  useEffect(() => {
    bgmAudioRef.current = new Audio(audioSources.bgm);
    bgmAudioRef.current.loop = true;
    bgmAudioRef.current.volume = bgmVolume;
    return () => {
      bgmAudioRef.current?.pause();
      bgmAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = bgmVolume;
      if (isBgmPlaying) {
        bgmAudioRef.current.play().catch(() => {});
      } else {
        bgmAudioRef.current.pause();
      }
    }
  }, [isBgmPlaying, bgmVolume]);

  const playSfx = useCallback((soundName: keyof typeof audioSources) => {
    const sfx = new Audio(audioSources[soundName]);
    sfx.volume = sfxVolume;
    sfx.play().catch(() => {});
  }, [sfxVolume]);

  const currentPlayer = players[currentPlayerIndex];

  const checkWin = useCallback((updatedPlayers: Player[]) => {
    const winner = updatedPlayers.find(p => p.meat >= winCondition);
    if (winner) {
      log(`【終局】${winner.character} 率先獲得 ${winner.meat} 塊祭肉，完成教化旅程！`);
      playSfx('winGame');
      setActiveModal('WIN');
      if (rollTimeoutRef.current) window.clearTimeout(rollTimeoutRef.current);
      if (aiRollTimeoutRef.current) window.clearTimeout(aiRollTimeoutRef.current);
      if (aiModalDecisionTimeoutRef.current) window.clearTimeout(aiModalDecisionTimeoutRef.current);
      return true;
    }
    return false;
  }, [playSfx, winCondition, log, setActiveModal]);

  const handleCentralMeatAnimationComplete = useCallback(() => {
    setIsBoardCelebrating(false);
  }, []);

  const showVictoryEffect = useCallback((playerIndex: number, amount: number, callback: () => void, customTitle?: string) => {
    if (activeModal === 'WIN') return;
    setMeatAnimationTarget(playerIndex);
    setMeatAnimationAmount(amount);
    setMeatAnimationTitle(customTitle || null);
    setMeatAnimationCallback(() => callback);
    if (amount > 0) setIsBoardCelebrating(true);
  }, [activeModal]);

  const nextTurn = useCallback(() => {
    if (activeModal === 'WIN') return;

    if (rollTimeoutRef.current) window.clearTimeout(rollTimeoutRef.current);
    if (aiRollTimeoutRef.current) window.clearTimeout(aiRollTimeoutRef.current);
    if (aiModalDecisionTimeoutRef.current) window.clearTimeout(aiModalDecisionTimeoutRef.current);
    rollTimeoutRef.current = null;
    aiRollTimeoutRef.current = null;
    aiModalDecisionTimeoutRef.current = null;

    setIsRolling(false);
    setIsPlayerMoving(false);
    setActiveModal(null);
    setShowBigIcon(null);
    setShowPause(false);
    setShowRecovery(false);
    setTrialSelection({ selected: null, isRevealed: false });
    setWaitingForHumanConfirmation(false);
    setAiDecisionMadeInModal(null);
    setIsAiGeneratingTrial(false);

    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    playSfx('turnStart');
    
    const nextP = players[nextIndex];

    const startActualTurn = () => {
        log(`【輪值】${nextP.isAI ? '[電腦] ' : ''}${nextP.character} 開始回合。`);
    };

    if (nextP.isPaused && nextP.turnsToSkip > 0) {
      log(`【暫停】${nextP.isAI ? '[電腦] ' : ''}${nextP.character} 正在暫停中，本回合需暫停行動，尚餘 ${nextP.turnsToSkip} 回合。`);
      setShowPause(true);
      
      if (gameMode === 'quick' && nextP.isAI) {
        window.setTimeout(() => {
            handlePauseConfirm();
        }, 1000); 
      }
    } else if (nextP.wasPaused) {
      log(`【恢復】${nextP.character} 修身養性已畢，重返周遊列國。`);
      setShowRecovery(true);
      setTimeout(() => {
        setShowRecovery(false);
        setPlayers(prev => prev.map((p, i) => i === nextIndex ? { ...p, wasPaused: false } : p));
        startActualTurn();
      }, 1000);
    } else {
      startActualTurn();
    }
  }, [players, currentPlayerIndex, playSfx, activeModal, log, setCurrentPlayerIndex, setShowPause, setShowRecovery, setTrialSelection, setIsRolling, setIsPlayerMoving, setShowBigIcon, setActiveModal, setWaitingForHumanConfirmation, setAiDecisionMadeInModal, setPlayers, gameMode]);

  const handlePauseConfirm = useCallback(() => {
    if (!showPause) return;
    playSfx('click');
    setShowPause(false);
    
    setPlayers(prev => prev.map((p, i) => {
        if (i === currentPlayerIndex) {
            const newTurns = p.turnsToSkip - 1;
            const isNowFree = newTurns === 0;
            return { 
                ...p, 
                turnsToSkip: newTurns, 
                isPaused: newTurns > 0,
                wasPaused: isNowFree
            };
        }
        return p;
    }));

    setTimeout(nextTurn, 300);
  }, [showPause, playSfx, nextTurn, currentPlayerIndex, setPlayers]);

  const onEventResolve = useCallback(() => {
    const effect = activeEventData?.effectType;

    if (effect === 'GAIN_MEAT' || effect === 'LOSE_MEAT') {
        const amount = effect === 'GAIN_MEAT' ? 1 : -1;
        setActiveModal(null);
        log(`【事件】${currentPlayer?.character} 在 ${activeEventData?.title} 中${amount > 0 ? '獲贈' : '失去'}祭肉一份。`);
        showVictoryEffect(currentPlayerIndex, amount, () => {
            setPlayers(prev => {
                const updated = prev.map((p, i) => i === currentPlayerIndex ? { ...p, meat: Math.max(0, p.meat + amount) } : p);
                if (!checkWin(updated)) nextTurn();
                return updated;
            });
        });
        return;
    }
    
    setActiveModal(null);
    if (effect === 'PAUSE') {
        log(`【事件】${currentPlayer?.character} 在 ${activeEventData?.title} 中暫停一回合。`);
        setPlayers(prev => prev.map((p, i) => {
            if (i !== currentPlayerIndex) return p;
            return { ...p, isPaused: true, turnsToSkip: p.turnsToSkip + 1 };
        }));
        setTimeout(nextTurn, 500);
    } else {
        setTimeout(nextTurn, 500);
    }
  }, [currentPlayerIndex, activeEventData, nextTurn, playSfx, showVictoryEffect, checkWin, currentPlayer, log, setActiveModal, setPlayers]);
  onEventResolveRef.current = onEventResolve;

  const resolveTrial = useCallback((correct: boolean, aiChosenIndex?: number) => {
    if (activeModal === 'WIN') return;
    const chosenIndex = aiChosenIndex !== undefined ? aiChosenIndex : trialSelection.selected;
    const choiceLetter = chosenIndex !== null ? String.fromCharCode(65 + chosenIndex) : '未選擇';
    if (correct) {
      log(`【試煉】${currentPlayer?.character} 選擇 ${choiceLetter}，回答正確！獲贈祭肉一份。`);
      setActiveModal(null); 
      setTimeout(() => { 
        showVictoryEffect(currentPlayerIndex, 1, () => {
          setPlayers(prev => {
            const updated = prev.map((p, i) => i === currentPlayerIndex ? { ...p, meat: p.meat + 1 } : p);
            if (!checkWin(updated)) {
                playSfx('correctAnswer');
                setTimeout(nextTurn, 500);
            }
            return updated;
          });
        });
      }, 400);
    } else {
      log(`【試煉】${currentPlayer?.character} 選擇 ${choiceLetter}，可惜回答錯誤，需多加鑽研。`);
      playSfx('incorrectAnswer');
      setActiveModal(null);
      setTimeout(nextTurn, 500);
    }
  }, [trialSelection.selected, currentPlayerIndex, checkWin, playSfx, nextTurn, currentPlayer, activeModal, showVictoryEffect, log, setActiveModal, setPlayers]);
  resolveTrialRef.current = resolveTrial;

  const onFateResolve = useCallback(() => {
    if (activeModal === 'WIN') return;
    playSfx('click');
    const fate = activeFate;
    if (!fate) { setActiveModal(null); nextTurn(); return; }
    
    log(`【命運】${currentPlayer?.character} 遭遇「${fate.title}」：${fate.description}`);

    const meatChange = fate.effect.meat || 0;
    const isPausedEffect = fate.effect.isPaused || false;
    const positionEffect = fate.effect.position;
    const specialEffect = fate.effect.special;
    let shouldCallNextTurn = true;

    const finalizeFateEffects = (actualMeatChange: number = 0) => {
        setPlayers(prevPlayers => {
            let currentPlayersCopy = [...prevPlayers];
            let newCurrentPlayer = { ...currentPlayersCopy[currentPlayerIndex] };
            newCurrentPlayer.meat = Math.max(0, newCurrentPlayer.meat + actualMeatChange);
            if (isPausedEffect) {
                newCurrentPlayer.isPaused = true;
                newCurrentPlayer.turnsToSkip = newCurrentPlayer.turnsToSkip + 1;
            }
            if (specialEffect === 'HAS_PROTECTION') newCurrentPlayer.hasProtection = true;
            currentPlayersCopy[currentPlayerIndex] = newCurrentPlayer;
            
            if (specialEffect === 'SWAP_ZILU_OR_START') {
                const zilouIdx = currentPlayersCopy.findIndex(p => p.character === '子路');
                if (zilouIdx !== -1) {
                    const zilouPos = currentPlayersCopy[zilouIdx].position;
                    const myPos = newCurrentPlayer.position;
                    currentPlayersCopy[currentPlayerIndex].position = zilouPos;
                    currentPlayersCopy[zilouIdx].position = myPos;
                } else {
                    currentPlayersCopy[currentPlayerIndex].position = 0;
                    setTimeout(() => handleTileActionRef.current?.(0), 100);
                    shouldCallNextTurn = false;
                }
            } else if (positionEffect !== undefined) {
                currentPlayersCopy[currentPlayerIndex].position = positionEffect;
                setTimeout(() => handleTileActionRef.current?.(positionEffect), 100);
                shouldCallNextTurn = false;
            }
            if (!checkWin(currentPlayersCopy)) {
                if (shouldCallNextTurn) {
                    nextTurn();
                }
            }
            return currentPlayersCopy;
        });
    };

    setActiveModal(null);
    if (meatChange !== 0) {
        showVictoryEffect(currentPlayerIndex, meatChange, () => finalizeFateEffects(meatChange));
    } else {
        finalizeFateEffects(0);
    }
  }, [activeFate, currentPlayerIndex, checkWin, nextTurn, showVictoryEffect, playSfx, currentPlayer, activeModal, log, handleTileActionRef, setActiveModal, setPlayers]);
  onFateResolveRef.current = onFateResolve;

  const onChanceResolve = useCallback(() => {
    if (activeModal === 'WIN') return;
    playSfx('click');
    const chance = activeChance;
    if (!chance) { setActiveModal(null); nextTurn(); return; }

    log(`【機緣】${currentPlayer?.character} 遇見「${chance.title}」：${chance.challenge}`);

    const { effect } = chance;
    let meatChange = effect?.meat || 0;
    let positionChange = effect?.position;
    let isPausedEffect = effect?.isPaused || false;
    setActiveModal(null);

    const finalizeChanceEffects = (finalMeat: number = 0, finalPos?: number) => {
      let actualPaused = isPausedEffect;
      setPlayers(prev => {
        let copy = [...prev];
        let me = { ...copy[currentPlayerIndex] };
        me.meat = Math.max(0, me.meat + finalMeat);
        if (actualPaused) {
            me.isPaused = true;
            me.turnsToSkip = me.turnsToSkip + 1;
        }
        if (finalPos !== undefined) {
          me.position = finalPos;
          copy[currentPlayerIndex] = me;
          setTimeout(() => handleTileActionRef.current?.(finalPos), 100);
          return copy;
        }
        copy[currentPlayerIndex] = me;
        if (!checkWin(copy)) {
            if (positionChange === undefined) {
                nextTurn();
            }
        }
        return copy;
      });
    };

    if (effect?.special === 'ROLL_DICE_ODD_EVEN') {
        const roll = Math.floor(Math.random() * 6) + 1;
        log(`【機緣決策】擲出 ${roll}，${roll % 2 !== 0 ? '不幸遭遇刁難。' : '順利把握機緣！'}`);
        if (roll % 2 !== 0) { isPausedEffect = true; meatChange = -1; }
        else { 
          meatChange = 1; 
          showVictoryEffect(currentPlayerIndex, 1, () => {
             finalizeChanceEffects(1); 
             setTimeout(() => movePlayerRef.current?.(3), 600);
          });
          return; 
        }
    }
    
    if (meatChange !== 0) {
        showVictoryEffect(currentPlayerIndex, meatChange, () => finalizeChanceEffects(meatChange, positionChange));
    } else {
        finalizeChanceEffects(0, positionChange);
    }
  }, [activeChance, currentPlayer, currentPlayerIndex, nextTurn, checkWin, showVictoryEffect, playSfx, activeModal, log, handleTileActionRef, movePlayerRef, setActiveModal, setPlayers]);
  onChanceResolveRef.current = onChanceResolve;

  const movePlayer = useCallback(async (steps: number, targetPlayerId?: number) => {
    setIsPlayerMoving(true);
    const actualTargetPlayerId = targetPlayerId ?? currentPlayerIndex;
    let tempPos = players[actualTargetPlayerId].position;
    let passCount = 0;

    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, 500));
      const nextPos = (tempPos + 1) % BOARD_TILES.length;
      if (tempPos !== 0 && nextPos === 0) passCount++;
      tempPos = nextPos;
      playSfx('move'); 
      setPlayers(prev => prev.map((p, idx) => idx === actualTargetPlayerId ? { ...p, position: nextPos } : p));
    }

    const finishMove = () => {
      setIsPlayerMoving(false);
      if (actualTargetPlayerId === currentPlayerIndex) {
        handleTileActionRef.current?.(tempPos);
      } else {
        nextTurn(); 
      }
    };

    if (passCount > 0 && actualTargetPlayerId === currentPlayerIndex) {
      log(`【福報】${players[currentPlayerIndex].character} 經過魯國起點，領取家鄉祭肉 ${passCount} 塊。`);
      showVictoryEffect(currentPlayerIndex, passCount, () => {
        setPlayers(prev => {
          const updated = prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, meat: p.meat + passCount } : p);
          if (!checkWin(updated)) finishMove();
          else setIsPlayerMoving(false);
          return updated;
        });
      }, "經過魯國");
    } else {
      setTimeout(finishMove, 500);
    }
  }, [players, currentPlayerIndex, showVictoryEffect, checkWin, nextTurn, playSfx, log, handleTileActionRef, setIsPlayerMoving, setPlayers]);
  movePlayerRef.current = movePlayer;

  const generateAiTrial = async (stateName: string): Promise<TrialCard | null> => {
    try {
      setIsAiGeneratingTrial(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位資深的儒學與歷史大師。請根據孔子周遊列國的歷史背景，特別是關於「${stateName}」的典故，以及儒家思想（論語、史記內容），隨機生成一則單選試煉題。
        要求：
        1. 包含一段經典文獻原文 (quote)。
        2. 根據這段文字提出一個具有深度思考價值的問題 (question)。
        3. 提供 4 個選項 (options)，開頭分別為 A. B. C. D.。
        4. 標明正確答案的索引 (answerIndex, 從 0 開始)。
        5. 提供一段詳細的解析 (analysis)，解釋為何該選項正確。
        6. 確保題目是關於《孔子周遊列國》的歷史背景或儒家思想。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answerIndex: { type: Type.INTEGER },
              analysis: { type: Type.STRING },
              quote: { type: Type.STRING }
            },
            required: ["question", "options", "answerIndex", "analysis", "quote"]
          }
        }
      });
      
      const trial = JSON.parse(response.text.trim()) as TrialCard;
      trial.id = Date.now();
      trial.isAiGenerated = true;
      return trial;
    } catch (error) {
      console.error("AI Generation Failed:", error);
      return null;
    } finally {
      setIsAiGeneratingTrial(false);
    }
  };

  const handleTileAction = useCallback(async (tileIndex: number) => {
    const tile = BOARD_TILES[tileIndex];
    if (!currentPlayer) return;
    
    playSfx('cardFlip');
    setActiveTrial(null);
    setActiveFate(null);
    setActiveChance(null);
    setActiveEventData(null);
    setTrialSelection({ selected: null, isRevealed: false });

    log(`【停留】${currentPlayer.character} 抵達了 ${tile.name}。`);

    switch (tile.type) {
      case TileType.STATE:
        setActiveModal('TRIAL');
        let selectedTrial: TrialCard | null = null;
        if (gameMode === 'advanced') {
            log(`【智慧啟示】正透過 AI 為 ${tile.name} 即時撰寫試煉題目...`);
            selectedTrial = await generateAiTrial(tile.state || tile.name);
            if (!selectedTrial) {
                log(`【警示】聖賢感應暫時中斷，調用歷史題庫。`);
                selectedTrial = TRIAL_CARDS[Math.floor(Math.random() * TRIAL_CARDS.length)];
            } else {
                log(`【智慧啟示】AI 命題完成，請賢士解惑。`);
            }
        } else {
            selectedTrial = TRIAL_CARDS[Math.floor(Math.random() * TRIAL_CARDS.length)];
        }
        setActiveTrial(selectedTrial);
        break;

      case TileType.FATE:
        setShowBigIcon('FATE');
        setTimeout(() => {
          if (activeModal === 'WIN') return;
          setShowBigIcon(null);
          setActiveModal('FATE');
          const randomFate = FATE_CARDS[Math.floor(Math.random() * FATE_CARDS.length)];
          setActiveFate(randomFate);
        }, 1200);
        break;

      case TileType.CHANCE:
        setShowBigIcon('CHANCE');
        setTimeout(() => {
          if (activeModal === 'WIN') return;
          setShowBigIcon(null);
          setActiveModal('CHANCE');
          const randomChance = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
          setActiveChance(randomChance);
        }, 1200);
        break;

      case TileType.EVENT:
        if (tile.name === '受困匡地') {
            setActiveEventData({
                title: "史料解讀：受困於匡",
                content: "發生於西元前495年，孔子57歲時。因孔子長相酷似曾粗暴對待當地的陽虎，引發圍圍困。孔子於危難中坦言：『天之未喪斯文也，匡人其如予何！』展現無畏天命的精神。",
                effectLabel: "誤解圍困中，暫停一回合",
                effectType: 'PAUSE'
            });
            setActiveModal('EVENT_DETAIL');
        } else if (tile.name === '鄭國城門') {
            setActiveEventData({
                title: "史料解讀：喪家之犬",
                content: "出自《史記》，描述孔子在鄭國與弟子失散，獨自站在東門等候。鄭人形容孔子『累累若喪家之狗』。孔子欣然自嘲：『然哉！內。』，體現了身處困厄中的豁達。",
                effectLabel: "失魂落魄，扣除祭肉一份",
                effectType: 'LOSE_MEAT'
            });
            setActiveModal('EVENT_DETAIL');
        } else if (tile.name === '陳蔡之間') {
            setActiveEventData({
                title: "史料解讀：陳蔡絕糧",
                content: "孔子師徒在陳、蔡之間遭遇斷糧，從者病倒。孔子即便在絕境中依然講誦弦歌不衰，教導弟子『君子固窮』，展現了高尚意志。",
                effectLabel: "絕糧受困，暫停一回合",
                effectType: 'PAUSE'
            });
            setActiveModal('EVENT_DETAIL');
        } else if (tile.name === '葉公問政') {
            setActiveEventData({
                title: "史料解讀：葉公問政",
                content: "出自《論語·子路》。楚國大夫葉公詢問為政之道，孔子答：『近者說，遠者來。』強調治國應以仁德為本，吸引遠方人民歸附。",
                effectLabel: "仁政感召，獲得祭肉一份",
                effectType: 'GAIN_MEAT'
            });
            setActiveModal('EVENT_DETAIL');
        } else {
            setTimeout(nextTurn, 1200);
        }
        break;

      default:
        setTimeout(nextTurn, 1000);
    }
  }, [currentPlayer, playSfx, nextTurn, activeModal, log, setActiveTrial, setActiveFate, setActiveChance, setActiveEventData, setTrialSelection, setShowBigIcon, gameMode]);
  handleTileActionRef.current = handleTileAction;

  const handleRestartGame = useCallback(() => {
    if (rollTimeoutRef.current) window.clearTimeout(rollTimeoutRef.current);
    if (aiRollTimeoutRef.current) window.clearTimeout(aiRollTimeoutRef.current);
    if (aiModalDecisionTimeoutRef.current) window.clearTimeout(aiModalDecisionTimeoutRef.current);
    rollTimeoutRef.current = null;
    aiRollTimeoutRef.current = null;
    aiModalDecisionTimeoutRef.current = null;
    
    setGameStarted(false); 
    setPlayers([]); 
    setCurrentPlayerIndex(0); 
    setDiceRolls([1, 1]);
    setIsRolling(false); 
    setIsPlayerMoving(false); 
    setActiveModal(null);
    setTrialSelection({ selected: null, isRevealed: false });
    setShowRecovery(false);
    setShowPause(false);
    setWaitingForHumanConfirmation(false);
    setAiDecisionMadeInModal(null);
    setIsAiGeneratingTrial(false);
    log('【公告】遊戲已重新開始。');
  }, [log]);

  const handleRoll = useCallback(() => {
    // 增加守衛：若祭肉動畫還在播放，禁止擲骰（包括 AI）
    if (isRolling || isPlayerMoving || activeModal || showBigIcon || showRecovery || showPause || waitingForHumanConfirmation || isAiGeneratingTrial || meatAnimationTarget !== null) return;
    
    const playerAttemptingRoll = players[currentPlayerIndex];
    if (!playerAttemptingRoll) return;

    if (playerAttemptingRoll.isPaused && playerAttemptingRoll.turnsToSkip > 0) {
        log(`【提示】${playerAttemptingRoll.character} 正在暫停中，本回合無法擲骰。`);
        return;
    }

    playSfx('diceRoll');
    setIsRolling(true);
    rollTimeoutRef.current = window.setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDiceRolls([d1, d2]);
      setIsRolling(false);
      rollTimeoutRef.current = null;
      log(`【擲骰】${playerAttemptingRoll.character} 擲出了 ${d1}+${d2}=${d1 + d2} 點，啟程出發。`);
      movePlayerRef.current?.(d1 + d2);
    }, 600);
  }, [isRolling, isPlayerMoving, activeModal, showBigIcon, showRecovery, showPause, waitingForHumanConfirmation, playSfx, currentPlayerIndex, players, log, isAiGeneratingTrial, meatAnimationTarget]);

  useEffect(() => {
    if (aiRollTimeoutRef.current) {
        window.clearTimeout(aiRollTimeoutRef.current);
        aiRollTimeoutRef.current = null;
    }

    // AI 自動擲骰守衛：增加 meatAnimationTarget === null 檢查
    // 確保在 AI 互动結束、動畫結算完畢、並真正切換到下一位玩家（且該玩家是 AI）後，才啟動自動計時器
    if (gameStarted && players[currentPlayerIndex] && !isRolling && !isPlayerMoving && !activeModal && !showBigIcon && !showRecovery && !showPause && !players[currentPlayerIndex].isPaused && !waitingForHumanConfirmation && !isAiGeneratingTrial && !players[currentPlayerIndex].wasPaused && meatAnimationTarget === null) {
        const currentActivePlayer = players[currentPlayerIndex];
        if (currentActivePlayer.isAI) {
            aiRollTimeoutRef.current = window.setTimeout(() => {
                if (players[currentPlayerIndex]?.id === currentActivePlayer.id && !activeModal && meatAnimationTarget === null) {
                    handleRoll();
                }
            }, gameMode === 'quick' ? 1000 : 2500); 
        }
    }

    return () => {
        if (aiRollTimeoutRef.current) {
            window.clearTimeout(aiRollTimeoutRef.current);
        }
    };
  }, [gameStarted, currentPlayerIndex, isRolling, isPlayerMoving, activeModal, showBigIcon, showRecovery, showPause, players, handleRoll, waitingForHumanConfirmation, isAiGeneratingTrial, gameMode, meatAnimationTarget]);

  useEffect(() => {
    if (aiModalDecisionTimeoutRef.current) {
        window.clearTimeout(aiModalDecisionTimeoutRef.current);
        aiModalDecisionTimeoutRef.current = null;
    }

    if (gameStarted && players[currentPlayerIndex]?.isAI && activeModal && activeModal !== 'WIN' && !showRecovery && !showPause && !trialSelection.isRevealed && !waitingForHumanConfirmation && !isAiGeneratingTrial) {
        const currentActivePlayer = players[currentPlayerIndex];
        
        aiModalDecisionTimeoutRef.current = window.setTimeout(() => {
            if (players[currentPlayerIndex]?.id !== currentActivePlayer.id || !activeModal) return; 

            switch (activeModal) {
                case 'TRIAL':
                    if (activeTrial) {
                        const aiChoice = Math.floor(Math.random() * 4);
                        log(`【AI 決策】${currentActivePlayer.character} 正在審視選項，選中了 ${String.fromCharCode(65 + aiChoice)}。`);
                        setTrialSelection({ selected: aiChoice, isRevealed: true });
                        setAiDecisionMadeInModal({ type: 'TRIAL', choice: aiChoice });
                        
                        if (gameMode === 'quick') {
                            window.setTimeout(() => {
                                resolveTrialRef.current?.(aiChoice === activeTrial.answerIndex, aiChoice);
                            }, 1200); 
                        } else {
                            setWaitingForHumanConfirmation(true);
                        }
                    }
                    break;
                case 'FATE':
                    log(`【AI 決策】${currentActivePlayer.character} 接受了命運之輪的安排。`);
                    setAiDecisionMadeInModal({ type: 'FATE' });
                    if (gameMode === 'quick') {
                        window.setTimeout(() => {
                            onFateResolveRef.current?.();
                        }, 800);
                    } else {
                        setWaitingForHumanConfirmation(true);
                    }
                    break;
                case 'CHANCE':
                    log(`【AI 決策】${currentActivePlayer.character} 決定把握眼前的機緣。`);
                    setAiDecisionMadeInModal({ type: 'CHANCE' });
                    if (gameMode === 'quick') {
                        window.setTimeout(() => {
                            onChanceResolveRef.current?.();
                        }, 800);
                    } else {
                        setWaitingForHumanConfirmation(true);
                    }
                    break;
                case 'EVENT_DETAIL':
                    log(`【AI 決策】${currentActivePlayer.character} 領悟史實事件。`);
                    setAiDecisionMadeInModal({ type: 'EVENT_DETAIL' });
                    if (gameMode === 'quick') {
                        window.setTimeout(() => {
                            onEventResolveRef.current?.();
                        }, 800);
                    } else {
                        setWaitingForHumanConfirmation(true);
                    }
                    break;
            }
        }, 1500); 
    }

    return () => {
        if (aiModalDecisionTimeoutRef.current) {
            window.clearTimeout(aiModalDecisionTimeoutRef.current);
        }
    };
  }, [activeModal, gameStarted, trialSelection.isRevealed, showRecovery, showPause, activeTrial, currentPlayerIndex, players, log, gameMode, waitingForHumanConfirmation, isAiGeneratingTrial]);

  const handleHumanConfirmation = useCallback(() => {
    playSfx('click');
    if (!waitingForHumanConfirmation || !currentPlayer?.isAI) return;

    setWaitingForHumanConfirmation(false);
    
    switch (activeModal) {
        case 'TRIAL':
            if (activeTrial && aiDecisionMadeInModal?.type === 'TRIAL') {
                resolveTrialRef.current?.(aiDecisionMadeInModal.choice === activeTrial.answerIndex, aiDecisionMadeInModal.choice);
            }
            break;
        case 'FATE':
            if (aiDecisionMadeInModal?.type === 'FATE') {
                onFateResolveRef.current?.();
            }
            break;
        case 'CHANCE':
            if (aiDecisionMadeInModal?.type === 'CHANCE') {
                onChanceResolveRef.current?.();
            }
            break;
        case 'EVENT_DETAIL':
            if (aiDecisionMadeInModal?.type === 'EVENT_DETAIL') {
                onEventResolveRef.current?.();
            }
            break;
    }
    setAiDecisionMadeInModal(null);
  }, [waitingForHumanConfirmation, currentPlayer, activeModal, activeTrial, aiDecisionMadeInModal, playSfx]);

  const handleStartGame = (configuredPlayers: Player[], goal: number, mode: GameMode) => {
    playSfx('click');
    setWinCondition(goal);
    setPlayers(configuredPlayers);
    setGameStarted(true);
    setGameMode(mode);
    if (bgmAudioRef.current) { bgmAudioRef.current.play().catch(() => {}); setIsBgmPlaying(true); }
    log(`【啟程】遊戲開始！模式：${mode === 'quick' ? '快速遊戲' : mode === 'advanced' ? '進階模式 (AI 命題)' : '一般遊戲'}。目標：${goal} 塊祭肉。`);
  };

  const winner = players.find(p => p.meat >= winCondition);
  if (!gameStarted) return <StartScreen onStartGame={handleStartGame} playSfx={playSfx} />;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-start bg-stone-100 overflow-x-hidden relative font-serif">
      <MeatEffect 
        targetIndex={meatAnimationTarget} amount={meatAnimationAmount} customTitle={meatAnimationTitle} playSfx={playSfx}
        onComplete={() => { if (meatAnimationCallback) meatAnimationCallback(); setMeatAnimationTarget(null); setMeatAnimationAmount(0); setMeatAnimationTitle(null); setMeatAnimationCallback(null); }} 
        onCentralAnimationComplete={handleCentralMeatAnimationComplete}
      />
      {showRecovery && players[currentPlayerIndex] && <RecoveryEffect character={players[currentPlayerIndex].character} />}
      {showPause && players[currentPlayerIndex] && (
        <PauseEffect 
            character={players[currentPlayerIndex].character} 
            showConfirmButton={gameMode !== 'quick' || !players[currentPlayerIndex].isAI}
            onConfirm={handlePauseConfirm}
        />
      )}
      {activeModal === 'WIN' && winner && <VictoryOverlay winner={winner} allPlayers={players} onRestart={handleRestartGame} />}
      <header className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black text-stone-800 tracking-widest mb-2 border-b-4 border-stone-800 inline-block px-6 animate-title-glow">孔子周遊列國</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-stone-600 italic">聖賢之路 · 祭肉爭奪戰</p>
            {gameMode === 'advanced' && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">AI 進階模式</span>}
        </div>
      </header>
      <button onClick={() => { playSfx('click'); setShowAudioSettings(true); }} className="absolute top-4 right-4 p-3 bg-white shadow-lg rounded-full z-40 transition-transform active:scale-90 hover:bg-stone-50">⚙️</button>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
          <PlayerInfo players={players} currentIndex={currentPlayerIndex} winCondition={winCondition} />
          <div className="bg-white p-4 rounded-xl shadow-md border border-stone-200">
            <h3 className="font-bold mb-2 border-b pb-1 text-stone-800 flex items-center gap-2">
                <span className="w-4 h-4 bg-stone-800 rounded-full flex items-center justify-center text-[8px] text-white">L</span>
                📜 遊記紀錄
            </h3>
            <div className="text-sm space-y-2 h-64 overflow-y-auto pr-2 scrollbar-thin">
              {gameLog.map((m, i) => ( <div key={i} className={`p-2 rounded-lg leading-relaxed shadow-sm border-l-2 ${i === 0 ? "text-stone-900 font-bold bg-amber-50 border-amber-500 animate-fade-in" : "text-stone-500 bg-stone-50 border-stone-200 opacity-80"}`}>{m}</div> ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col items-center">
          <Board 
            tiles={BOARD_TILES} players={players} diceRolls={diceRolls} isRolling={isRolling} 
            handleRoll={handleRoll} isModalActive={!!activeModal} 
            isPlayerMoving={isPlayerMoving} currentPlayerIndex={currentPlayerIndex} 
            isBoardCelebrating={isBoardCelebrating} showBigIcon={showBigIcon} playSfx={playSfx} 
            isWaitingForHumanConfirmation={waitingForHumanConfirmation}
            handleHumanConfirmation={handleHumanConfirmation}
            gameMode={gameMode}
            meatAnimationTarget={meatAnimationTarget}
          />
        </div>
        <div className="lg:col-span-1 order-3 space-y-4 text-xs bg-white p-6 rounded-xl shadow-md border border-stone-200 overflow-y-auto max-h-[80vh] scrollbar-thin">
          <h3 className="font-black mb-4 flex items-center text-lg border-b-2 border-amber-600 pb-2">
            <span className="w-4 h-4 bg-amber-600 mr-2 rounded-sm shadow-sm"></span> 📖 遊戲玩法說明
          </h3>
          
          <section className="mb-4">
            <h4 className="font-bold text-stone-800 mb-2 bg-stone-100 px-2 py-1 rounded flex items-center gap-1">📋 基本資訊</h4>
            <div className="space-y-1 text-stone-700">
                <p>👥 遊戲人數：2~4人</p>
                <p>📦 內容物：地圖、骰子、命運、機會、AI 即時試煉</p>
            </div>
          </section>

          <section className="mb-4">
            <h4 className="font-bold text-stone-800 mb-2 bg-stone-100 px-2 py-1 rounded flex items-center gap-1">🕹️ 核心玩法</h4>
            <ul className="space-y-2 text-stone-700 list-none pl-1">
              <li className="flex gap-2"><span>1.</span><span>按骰子點數前進，執行格內事項。</span></li>
              <li className="flex gap-2"><span>2.</span><span>經過起點<span className="font-bold text-red-800">魯國</span>時，可領取 🍖 祭肉一塊。</span></li>
              {gameMode === 'advanced' && <li className="flex gap-2 text-amber-700 font-bold"><span>3.</span><span>進階模式：停留國家格時由 AI 即時針對經典文獻命題！</span></li>}
            </ul>
          </section>

          <section className="mb-4">
            <h4 className="font-bold text-stone-800 mb-2 bg-stone-100 px-2 py-1 rounded flex items-center gap-1">🏛️ 試煉規則</h4>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
              🧠 停留各國領土即進行試煉答題。
              <div className="mt-2 text-xs">
                ✅ 正確：獲得 🍖 祭肉一塊。<br/>
                ❌ 錯誤：無法領取。
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-stone-800 mb-2 bg-stone-100 px-2 py-1 rounded flex items-center gap-1">👑 勝負關鍵</h4>
            <div className="p-4 bg-stone-900 text-white rounded-xl shadow-lg border-2 border-amber-500 animate-pulse-slow">
              <p className="text-sm font-bold leading-relaxed text-center">
                首位累積達 <span className="text-amber-400 text-xl font-black">{winCondition}</span> 塊 🍖 祭肉即獲勝！
              </p>
            </div>
          </section>
        </div>
      </div>
      
      {isAiGeneratingTrial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center border-4 border-amber-500">
                <div className="text-6xl mb-4 animate-bounce">📜</div>
                <h3 className="text-xl font-black text-stone-800 mb-2 tracking-widest">聖賢啟示生成中</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6">Gemini 正在鑽研儒家經典，為您量身打造試煉挑戰...</p>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 animate-progress-indefinite"></div>
                </div>
            </div>
        </div>
      )}

      <CardModal 
        type={activeModal} 
        trial={activeTrial} 
        fate={activeFate} 
        chance={activeChance} 
        eventData={activeEventData} 
        winner={winner}
        currentPlayerName={currentPlayer?.character}
        onTrialResolve={(idx) => {
            setTrialSelection({ selected: idx, isRevealed: true });
        }} 
        onTrialConfirm={() => {
            if (currentPlayer?.isAI && waitingForHumanConfirmation) {
                handleHumanConfirmation();
            } else if (trialSelection.selected !== null && activeTrial) {
                resolveTrialRef.current?.(trialSelection.selected === activeTrial.answerIndex);
            }
        }}
        onFateResolve={() => {
            if (currentPlayer?.isAI && waitingForHumanConfirmation) {
                handleHumanConfirmation();
            } else {
                onFateResolveRef.current?.();
            }
        }} 
        onChanceResolve={() => {
            if (currentPlayer?.isAI && waitingForHumanConfirmation) {
                handleHumanConfirmation();
            } else {
                onChanceResolveRef.current?.();
            }
        }} 
        onEventResolve={() => {
            if (currentPlayer?.isAI && waitingForHumanConfirmation) {
                handleHumanConfirmation();
            } else {
                onEventResolveRef.current?.();
            }
        }} 
        onRestart={handleRestartGame} onClose={() => setActiveModal(null)} playSfx={playSfx} isAI={currentPlayer?.isAI || false} trialSelection={trialSelection} 
        gameMode={gameMode} 
        waitingForHumanConfirmation={waitingForHumanConfirmation} 
        aiDecisionMadeInModal={aiDecisionMadeInModal} 
        handleHumanConfirmation={handleHumanConfirmation}
      />
      <AudioSettings 
        show={showAudioSettings} 
        onClose={() => setShowAudioSettings(false)} 
        isBgmPlaying={isBgmPlaying} 
        toggleBgm={() => setIsBgmPlaying(!isBgmPlaying)} 
        bgmVolume={bgmVolume} 
        setBgmVolume={setBgmVolume} 
        sfxVolume={sfxVolume} 
        setSfxVolume={setSfxVolume} 
      />
      <style>{`
        @keyframes progress-indefinite { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-progress-indefinite { animation: progress-indefinite 2s linear infinite; }
        @keyframes bounce-short {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -10px); }
        }
        .animate-bounce-short { animation: bounce-short 2s ease-in-out infinite; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.02); } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
