import { Game, type Player } from "./types";
import { rollDice } from "./dice";
import { SCORERS } from "./scoring";
import {
  assertCurrentPlayer,
  assertCurrentTurn,
  assertGameNotFinished,
} from "./validation";
import { broadcastGame } from "./wsManager";
import { removeGame } from "~~/server/game/gameManager";
import { throwDice } from "~~/server/game/animate";

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
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);

  const rs = game.roundState!;

  if (rs.rollsLeft <= 0) throw new Error("no-rolls-left");

  // rs.dice = rollDice(rs.dice, rs.held);

  //todo holding dice
  //todo instant update
  //todo roll multiple
  throwDice(game);

  rs.rollsLeft--;
}

export function onDiceFinished(game: Game, dice: number[]) {
  assertGameNotFinished(game);

  const rs = game.roundState!;
  if (rs.rollsLeft <= 0) throw new Error("no-rolls-left");

  rs.dice = dice;
}

export function hold(game: Game, playerId: string, held: boolean[]) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertCurrentTurn(game);

  if (held.length !== 5) throw new Error("invalid-held");
  game.roundState!.held = held;
}

export function score(game: Game, playerId: string, category: string) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertCurrentTurn(game);

  const scorer = SCORERS[category];
  if (!scorer) throw new Error("invalid-category");

  const player = game.players[game.currentPlayerIndex];
  if (player.scorecard[category] !== null) throw new Error("already-used");

  player.scorecard[category] = scorer(game.roundState!.dice, game.roundState!);
  player.sum = getTotalScore(player);

  if (checkGameOver(game)) {
    game.status = "finished";
    game.winner = calculateWinner(game);

    broadcastGame(game);
    removeGame(game);

    return;
  }

  nextPlayer(game);
}

function nextPlayer(game: Game) {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  startTurn(game);
}

function checkGameOver(game: Game) {
  const allFilled = game.players.every((p) =>
    Object.values(p.scorecard).every((v) => v !== null),
  );

  if (allFilled) game.status = "finished";
  return allFilled;
}

export function getTotalScore(player: Player): number {
  return Object.values(player.scorecard).reduce(
    (sum, v) => (sum === null ? 0 : sum + (v ?? 0)),
    0,
  )!;
}

export function calculateWinner(game: Game): Player | null {
  if (!game.players.length) return null;

  return game.players.reduce((best, p) => {
    return getTotalScore(p) > getTotalScore(best) ? p : best;
  }, game.players[0]);
}
