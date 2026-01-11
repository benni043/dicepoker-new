import { listGames } from "../../game/gameManager";

export default defineEventHandler(() => {
  return listGames();
});
