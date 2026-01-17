export type GameStatus = "lobby" | "running" | "finished";
export type StraightType = "small" | "big" | "both";

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  ready: boolean;
  scorecard: Record<string, number | null>;
  sum: number;
}

export interface RoundState {
  rollsLeft: number;
  dice: number[];
  held: boolean[];
}

export interface Game {
  id: string;
  status: GameStatus;
  players: Player[];
  playerCount: number;
  currentPlayerIndex: number;
  round: number;
  roundState: RoundState | null;
  winner: Player | null;
}
