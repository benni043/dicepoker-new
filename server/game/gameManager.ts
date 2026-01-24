import { Game } from "./types";
import { startGame } from "./stateMachine";
import { nanoid } from "../utils/id";
import { broadcastGame } from "./wsManager";
import { assertGameNotStarted } from "~~/server/game/validation";
import { initPhysics } from "~~/server/game/animate";
import type { Player, ScoreColumn, ScoreKey } from "#shared/utils/types";
import { SCORE_KEYS } from "#shared/utils/scoring";

const games = new Map<string, Game>();

export function createGame(playerCount: number, columns: number): Game {
  const game: Game = {
    id: nanoid(),
    status: "lobby",
    players: [],
    playerCount: playerCount,
    currentPlayerIndex: 0,
    round: 0,
    roundState: null,
    winner: null,
    dicePhysics: {
      world: null,
      diceBodies: [],
      rolling: false,
      lastTime: Date.now(),
      intervalId: null,
    },
    columns: columns,
  };

  initPhysics(game);

  games.set(game.id, game);
  return game;
}

export function removeGame(game: Game) {
  games.delete(game.id);
}

export function getGame(id: string): Game {
  const g = games.get(id);

  if (!g) throw new Error("game-not-found");
  return g;
}

function createEmptyColumn(): ScoreColumn {
  return SCORE_KEYS.map((k) => ({ key: k, value: null }));
}

function createEmptyColumnList(columns: number) {
  const list = [];

  for (let i = 0; i < columns; i++) {
    list.push(createEmptyColumn());
  }

  return list;
}

export function addPlayer(game: Game, name: string): Player {
  assertGameNotStarted(game);

  const p: Player = {
    id: nanoid(),
    name,
    ready: false,
    scorecard: createEmptyColumnList(game.columns),
    sum: 0,
  };

  game.players.push(p);
  return p;
}

export function readyPlayer(game: Game, playerId: string) {
  const p = game.players.find((p) => p.id === playerId);

  if (!p) throw new Error("player-not-found");
  p.ready = true;

  if (
    game.players.length === game.playerCount &&
    game.players.every((p) => p.ready)
  ) {
    startGame(game);
    broadcastGame(game);
  }
}

export function listGames() {
  return [...games.values()].map((g) => ({
    id: g.id,
    status: g.status,
    players: g.players.map((p) => p.name),
  }));
}
