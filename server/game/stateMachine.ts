import { Game } from "./types";
import { rollDice } from "./dice";
import { SCORERS } from "./scoring";
import { assertCurrentPlayer } from "./validation";

export function startGame(game: Game) {
  game.status = "running";
  game.round = 1;
  game.currentPlayerIndex = 0;
  startTurn(game);
}

export function startTurn(game: Game) {
  game.roundState = {
    rollsLeft: 3,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
  };
}

export function roll(game: Game, playerId: string) {
  assertCurrentPlayer(game, playerId);
  const rs = game.roundState!;
  if (rs.rollsLeft <= 0) throw new Error("no-rolls-left");
  rs.dice = rollDice(rs.dice, rs.held);
  rs.rollsLeft--;
}

export function hold(game: Game, playerId: string, held: boolean[]) {
  assertCurrentPlayer(game, playerId);
  if (held.length !== 5) throw new Error("invalid-held");
  game.roundState!.held = held;
}

export function score(game: Game, playerId: string, category: string) {
  assertCurrentPlayer(game, playerId);
  const scorer = SCORERS[category];
  if (!scorer) throw new Error("invalid-category");

  const player = game.players[game.currentPlayerIndex];
  if (player.scorecard[category] !== null) throw new Error("already-used");

  player.scorecard[category] = scorer(game.roundState!.dice);
  nextPlayer(game);
}

function nextPlayer(game: Game) {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  startTurn(game);
}
