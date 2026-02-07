import CANNON from "cannon-es";
import type { GameDTO, Player, RoundState } from "#shared/utils/types";

export type GameStatus = "lobby" | "running" | "finished";
export type StraightType = "small" | "big" | "both";

export interface Game {
  id: string;
  status: GameStatus;
  players: Player[];
  playerCount: number;
  currentPlayerIndex: number;
  round: number;
  roundState: RoundState | null;
  winner: Player | null;
  // dicePhysics: DicePhysicsState;
  columns: number;
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

// export interface DicePhysicsState {
//   world: CANNON.World | null;
//   diceBodies: CANNON.Body[];
//   rolling: boolean;
//   lastTime: number;
//   intervalId: NodeJS.Timeout | null;
// }

export interface DiceResult {
  dice: number[];
  seed: number;
}
