import { createGame } from "../../game/gameManager";

export default defineEventHandler(() => {
  return createGame();
});
