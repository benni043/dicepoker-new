import type { Game } from "./types";
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

    peer.send(JSON.stringify({ type: "state", game }));
  }
}
