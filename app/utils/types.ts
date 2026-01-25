import type { GameStatus } from "~~/server/game/types";

export interface ListGames {
  id: string;
  status: GameStatus;
  players: string[];
}
