import CANNON from "cannon-es";

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
  dicePhysics: DicePhysicsState;
}

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

export function toGameDTO(game: Game): GameDTO {
  return {
    id: game.id,
    status: game.status,
    players: game.players,
    playerCount: game.playerCount,
    currentPlayerIndex: game.currentPlayerIndex,
    round: game.round,
    roundState: game.roundState,
    winner: game.winner,
  };
}

export interface DicePhysicsState {
  world: CANNON.World | null;
  diceBodies: CANNON.Body[];
  rolling: boolean;
  lastTime: number;
  intervalId: NodeJS.Timeout | null;
}
