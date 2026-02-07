import type { GameStatus } from "~~/server/game/types";

export interface GameDTO {
  id: string;
  status: GameStatus;
  players: Player[];
  playerCount: number;
  currentPlayerIndex: number;
  round: number;
  roundState: RoundState | null;
  winner: Player | null;
}

export type ScoreKey =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "fullHouse"
  | "street"
  | "fourKind"
  | "fiveKind";

export interface Scorecell {
  key: ScoreKey;
  value: number | null;
}

export type ScoreColumn = Scorecell[];

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  ready: boolean;
  scorecard: ScoreColumn[];
  sum: number;
}

export interface RoundState {
  rollsLeft: number;
  dice: number[];
  held: number[];
  seed: number;
}
