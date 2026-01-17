import { getGame, addPlayer } from "../../../game/gameManager";

export default defineEventHandler(async (event) => {
  try {
    const { name } = await readBody(event);
    const game = getGame(event.context.params!.id);

    return addPlayer(game, name);
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message });
  }
});
