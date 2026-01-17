
import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration } from '@google/genai';

export type Character = '孔子' | '子路' | '顏回' | '子貢';

export type GameMode = 'quick' | 'normal' | 'advanced';

export interface Player {
  id: number;
  name: string;
  character: Character;
  avatar: string; 
  position: number;
  meat: number;
  isPaused: boolean;
  wasPaused: boolean; // 新增：用於標記是否剛從暫停中恢復
  turnsToSkip: number; 
  color: string;
  hasProtection: boolean;
  isAI: boolean; 
}

export enum TileType {
  STATE = 'STATE',
  CHANCE = 'CHANCE',
  FATE = 'FATE',
  EVENT = 'EVENT',
  START = 'START'
}

export interface BoardTile {
  id: number;
  name: string;
  type: TileType;
  description?: string;
  state?: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  action: (player: Player, gameState: any) => Partial<Player> | void;
  quote?: string;
  source?: string;
  narrative?: string;
}

export interface TrialCard {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  analysis: string;
  quote: string;
  isAiGenerated?: boolean;
}

export interface FateCard {
  id: number;
  title: string;
  description: string;
  effect: {
    meat?: number;
    isPaused?: boolean;
    position?: number;
    special?: string; 
  };
  narrative?: string; 
}

export interface ChanceCard {
  id: number;
  title: string;
  narrative: string; 
  challenge: string; 
  effect?: {
    meat?: number;
    isPaused?: boolean;
    position?: number;
    special?: 'ROLL_DICE_ODD_EVEN' | 'SHARE_EXAMPLE_MEAT_OR_PAUSE' | 'SHARE_ZILU_SPECIALTY' | 'ROLL_DICE_1_3_LOSE_4_6_GAIN' | 'ROLL_DICE_5_6_MOVE_START_GAIN_2' | 'KONGZI_LOSE_MEAT_OR_PAUSE' | 'SWAP_ZILU_OR_KONGZI_DICE_BATTLE' | 'ROLL_DICE_COMPARE_NEAREST_GAIN_MEAT_OR_PAUSE' | 'ROLL_DICE_6_GAIN_2' | 'SHARE_EXAMPLE_MEAT_OR_LOSE_MEAT' | 'SHARE_EXPERIENCE_MEAT' | 'EVEN_MOVE_FURTHEST_GIVE_MEAT_NEAREST_GAIN_MEAT';
    targetPlayerId?: number; 
  };
  outcomeDescription?: string; 
}
