export type GameStatus = "lobby" | "running" | "finished";

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  ready: boolean;
  scorecard: Record<string, number | null>;
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
  currentPlayerIndex: number;
  round: number;
  roundState: RoundState | null;
}
