import { getGame, readyPlayer } from "../../../game/gameManager";

export default defineEventHandler(async (event) => {
  const { playerId } = await readBody(event);
  const game = getGame(event.context.params!.id);
  readyPlayer(game, playerId);
  return { ok: true };
});
