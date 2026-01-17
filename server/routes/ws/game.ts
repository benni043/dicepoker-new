import type { Peer } from "crossws";
import { getGame } from "../../game/gameManager";
import * as SM from "../../game/stateMachine";
import {
  broadcastGame,
  registerPeer,
  unregisterPeer,
} from "~~/server/game/wsManager";

export default defineWebSocketHandler({
  open(peer: Peer) {
    // peer.subscribe('visitors')
    // // We publish the number of connected users to the 'visitors' channel
    // peer.publish('visitors', peer.peers.size)
    // // We send the number of connected users to the client
    // peer.send(peer.peers.size)
  },

  close(peer: Peer) {
    // peer.unsubscribe('visitors')
    // // Wait 500ms before sending the updated locations to the server
    // setTimeout(() => {
    //     peer.publish('visitors', peer.peers.size)
    // }, 500)
  },

  message(peer: Peer, message) {
    const data = JSON.parse(message.text());
    const { gameId, playerId, action, payload } = data;

    registerPeer(playerId, peer);

    try {
      const game = getGame(gameId);

      switch (action) {
        case "roll":
          SM.roll(game, playerId);
          break;
        case "hold":
          SM.hold(game, playerId, payload.held);
          break;
        case "score":
          SM.score(game, playerId, payload.category);
          break;
      }

      broadcastGame(game);
    } catch (e: any) {
      peer.send(
        JSON.stringify({
          type: "error",
          message: e.message,
          ts: Date.now(),
        }),
      );
    }
  },
});
