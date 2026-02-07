import { Game } from "./types";

export function assertCurrentPlayer(game: Game, playerId: string) {
  const p = game.players[game.currentPlayerIndex];
  if (!p || p.id !== playerId) throw new Error("not-your-turn");
}

export function assertCurrentTurn(game: Game) {
  if (game.roundState?.rollsLeft === 3) throw new Error("must-throw-once");
}

export function assertGameNotStarted(game: Game) {
  if (game.status !== "lobby") throw new Error("game-already-started");
}

export function assertGameNotFinished(game: Game) {
  if (game.status === "finished") throw new Error("game-already-finished");
}

export function assertRolesLeft(game: Game) {
  if (game.roundState?.rollsLeft === 0) throw new Error("no-roles-left");
}
