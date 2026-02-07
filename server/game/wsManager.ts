import { type Game, toGameDTO } from "./types";
import type { Peer } from "crossws";

const peers = new Map<string, Peer>();

export function registerPeer(playerId: string, peer: Peer) {
  peers.set(playerId, peer);
}

export function unregisterPeer(playerId: string) {
  peers.delete(playerId);
}

export function broadcastGame(game: Game) {
  for (const player of game.players) {
    const peer = peers.get(player.id);
    if (!peer) continue;

    const gameDTO = toGameDTO(game);

    peer.send(JSON.stringify({ type: "state", gameDTO }));
  }
}

export function broadcastAnimation(game: Game) {
  console.log("roll2");
  for (const player of game.players) {
    const peer = peers.get(player.id);
    if (!peer) continue;

    const renderInformation = game.roundState;

    peer.send(JSON.stringify({ type: "renderInformation", renderInformation }));
  }
}
