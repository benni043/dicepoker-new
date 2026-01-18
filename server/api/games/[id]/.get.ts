import { getGame } from "../../../game/gameManager";
import { toGameDTO } from "~~/server/game/types";

export default defineEventHandler((event) => {
  return toGameDTO(getGame(event.context.params!.id!));
});
