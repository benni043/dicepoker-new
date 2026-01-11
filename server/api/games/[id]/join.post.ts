import { getGame, addPlayer } from "../../../game/gameManager";

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event);
  const game = getGame(event.context.params!.id);
  return addPlayer(game, name);
});
