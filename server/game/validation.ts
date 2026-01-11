import { Game } from "./types";

export function assertCurrentPlayer(game: Game, playerId: string) {
  const p = game.players[game.currentPlayerIndex];
  if (!p || p.id !== playerId) throw new Error("not-your-turn");
}
