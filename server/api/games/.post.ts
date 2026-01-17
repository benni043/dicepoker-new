import { createGame } from "../../game/gameManager";

export default defineEventHandler(async (event) => {
  const { playerCount } = await readBody(event);

  return createGame(playerCount);
});
