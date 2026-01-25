import type { ListGames } from "~/utils/types";

export function useGame() {
  const gameId = ref<string | null>(null);
  const playerId = ref<string | null>(null);
  const name = ref("player");

  const game = ref<GameDTO | null>(null);
  const games = ref<ListGames[]>([]);

  const connectWS = ref(false);

  async function createGame() {
    const game = await $fetch("/api/games", {
      method: "POST",
      body: { playerCount: 2, columns: 2 },
    });

    gameId.value = game.id;
  }

  async function joinGame() {
    if (!gameId.value) return;

    try {
      const localStorageId = localStorage.getItem("playerId");

      if (localStorageId) {
        await $fetch(`/api/games/${gameId.value}/rejoin`, {
          method: "POST",
          body: { playerId: localStorageId },
        });

        playerId.value = localStorageId;

        connectWS.value = true;

        return;
      }

      const player = await $fetch(`/api/games/${gameId.value}/join`, {
        method: "POST",
        body: { name: name.value },
      });

      playerId.value = player.id;
      localStorage.setItem("playerId", player.id);
    } catch (e: any) {
      alert(e.data?.message ?? "Unbekannter Fehler");
    }
  }

  async function readyUp() {
    try {
      await $fetch(`/api/games/${gameId.value}/ready`, {
        method: "POST",
        body: { playerId: playerId.value },
      });

      connectWS.value = true;
    } catch (e: any) {
      alert(e.data?.message ?? "Unbekannter Fehler");
    }
  }

  async function loadGames() {
    games.value = await $fetch<ListGames[]>("/api/games");
  }

  function clearPlayer() {
    localStorage.removeItem("playerId");
    playerId.value = null;
  }

  return {
    gameId,
    playerId,
    name,
    game,
    games,
    createGame,
    joinGame,
    readyUp,
    loadGames,
    clearPlayer,
  };
}
