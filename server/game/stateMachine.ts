import { Game } from "./types";
import { SCORERS } from "#shared/utils/scoring";
import {
  assertCurrentPlayer,
  assertCurrentTurn,
  assertGameNotFinished,
  assertRolesLeft,
} from "./validation";
import { broadcastAnimation, broadcastGame } from "./wsManager";
import { removeGame } from "~~/server/game/gameManager";
import type { Player, Scorecell, ScoreKey } from "#shared/utils/types";
import { simulateDiceRoll } from "./animate";

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
    held: [],
    seed: 0,
  };
}

export function roll(game: Game, playerId: string) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertRolesLeft(game);

  const rs = game.roundState!;

  const result = simulateDiceRoll(2, rs.dice.length - rs.held.length);

  rs.dice = [];

  for (let elem in rs.held) {
    for (let res in result.dice) {
      if (res === elem) {
        rs.dice.push(elem);
      }
    }
  }

  rs.dice.push(...result.dice);
  rs.seed = result.seed;
  rs.rollsLeft--;

  broadcastAnimation(game);
}

export function hold(game: Game, playerId: string, held: number[]) {
  assertGameNotFinished(game);
  assertCurrentPlayer(game, playerId);
  assertCurrentTurn(game);
  assertRolesLeft(game);

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
