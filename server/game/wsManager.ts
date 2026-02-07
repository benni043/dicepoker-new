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

export function broadcastAnimation(
  game: Game,
  // diceStates: {
  // position: { x: number; y: number; z: number };
  // quaternion: { x: number; y: number; z: number; w: number };
  // }[],
) {
  for (const player of game.players) {
    const peer = peers.get(player.id);
    if (!peer) continue;

    // const renderInformation = { renderInformation: 12344 };

    const renderInformation = game.roundState;

    peer.send(JSON.stringify({ type: "renderInformation", renderInformation }));
  }
}
