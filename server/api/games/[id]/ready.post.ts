import { getGame, readyPlayer } from "../../../game/gameManager";

export default defineEventHandler(async (event) => {
  const { playerId } = await readBody(event);
  const game = getGame(event.context.params!.id);

  try {
    readyPlayer(game, playerId);

    return { ok: true };
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message });
  }
});
