import { getGame, addPlayer } from "../../../game/gameManager";

export default defineEventHandler(async (event) => {
  try {
    const { playerId } = await readBody(event);
    const game = getGame(event.context.params!.id);

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      throw createError({ statusCode: 400, message: "player-not-found" });
    }

    return { ok: true };
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message });
  }
});
