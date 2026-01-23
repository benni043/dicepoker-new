import { Game } from "./types";
import { SCORERS } from "./scoring";
import {
  assertCurrentPlayer,
  assertCurrentTurn,
  assertGameNotFinished,
  assertRolesLeft,
  assertRolling,
} from "./validation";
import { broadcastGame } from "./wsManager";
import { removeGame } from "~~/server/game/gameManager";
import { throwDice } from "~~/server/game/animate";
import type { Player, Scorecell, ScoreKey } from "#shared/utils/types";

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
  assertRolling(game);
  assertRolesLeft(game);

  const rs = game.roundState!;

  throwDice(game);

  rs.rollsLeft--;
}

export function onDiceFinished(game: Game, physicsResults: number[]) {
  assertGameNotFinished(game);
  assertRolling(game);

  const rs = game.roundState!;
  let resultIndex = 0;

  for (let i = 0; i < rs.dice.length; i++) {
    if (!rs.held[i]) {
      rs.dice[i] = physicsResults[resultIndex];
      resultIndex++;
    }
  }

  broadcastGame(game);
}

export function hold(game: Game, playerId: string, held: boolean[]) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertCurrentTurn(game);
  assertRolling(game);
  assertRolesLeft(game);

  if (held.length !== 5) throw new Error("invalid-held");
  game.roundState!.held = held;
}

export function score(
  game: Game,
  playerId: string,
  category: ScoreKey,
  columnIndex: number,
) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertCurrentTurn(game);
  assertRolling(game);

  const scorer = SCORERS[category];
  if (!scorer) throw new Error("invalid-category");

  const player = game.players[game.currentPlayerIndex];

  const column = player.scorecard[columnIndex];
  if (!column) throw new Error("score-column-not-found");

  const cell = column.find((c) => c.key === category);
  if (!cell) throw new Error("score-key-not-found");
  if (cell.value !== null) throw new Error("score-already-set");

  cell.value = scorer(game.roundState!.dice, game.roundState!);

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
    p.scorecard.flat().every((c) => c.value !== null),
  );

  if (allFilled) game.status = "finished";
  return allFilled;
}

export function getTotalScore(player: Player): number {
  return player.scorecard
    .flat()
    .reduce((s: number, c: Scorecell) => s + (c.value ?? 0), 0);
}

export function calculateWinner(game: Game): Player | null {
  if (!game.players.length) return null;

  return game.players.reduce((best, p) => {
    return getTotalScore(p) > getTotalScore(best) ? p : best;
  }, game.players[0]);
}
