import { Game, Player } from "./types";
import { startGame } from "./stateMachine";
import { nanoid } from "../utils/id";
import { broadcastGame } from "./wsManager";
import { assertGameNotStarted } from "~~/server/game/validation";
import { initPhysics } from "~~/server/game/animate";
import CANNON from "cannon-es";

const games = new Map<string, Game>();

export function createGame(playerCount: number): Game {
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

export function addPlayer(game: Game, name: string): Player {
  assertGameNotStarted(game);

  const p: Player = {
    id: nanoid(),
    name,
    ready: false,
    scorecard: {
      ones: null,
      twos: null,
      threes: null,
      fours: null,
      fives: null,
      sixes: null,
      fullHouse: null,
      street: null,
      fourKind: null,
      fiveKind: null,
    },
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
