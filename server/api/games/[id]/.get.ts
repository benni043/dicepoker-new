import { getGame } from "../../../game/gameManager";

export default defineEventHandler((event) => {
  return getGame(event.context.params!.id!);
});
