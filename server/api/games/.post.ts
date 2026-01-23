import { createGame } from "../../game/gameManager";
import { toGameDTO } from "~~/server/game/types";

export default defineEventHandler(async (event) => {
  const { playerCount, columns } = await readBody(event);

  return toGameDTO(createGame(playerCount, columns));
});
