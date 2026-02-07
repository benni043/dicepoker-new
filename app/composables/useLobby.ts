export function useLobby() {
  const games = ref<ListGames[]>([]);

  const gameId: Ref<string | null> = useState("gameId", () => null);
  const playerId: Ref<string | null> = useState("playerId", () => null);
  const name: Ref<string | null> = useState("name", () => null);

  async function loadGames() {
    games.value = await $fetch("/api/games");
  }

  async function createGame() {
    const game = await $fetch("/api/games", {
      method: "POST",
      body: { playerCount: 2, columns: 2 },
    });

    gameId.value = game.id;
  }

  async function joinGame() {
    if (!gameId.value) return;

    const stored = localStorage.getItem("playerId");

    if (stored) {
      await $fetch(`/api/games/${gameId.value}/rejoin`, {
        method: "POST",
        body: { playerId: stored },
      });

      playerId.value = stored;
      return;
    }

    const player = await $fetch(`/api/games/${gameId.value}/join`, {
      method: "POST",
      body: { name: name.value },
    });

    playerId.value = player.id;
    localStorage.setItem("playerId", player.id);
  }

  async function readyUp() {
    await $fetch(`/api/games/${gameId.value}/ready`, {
      method: "POST",
      body: { playerId: playerId.value },
    });
  }

  function clearPlayer() {
    localStorage.removeItem("playerId");
  }

  return {
    games,
    gameId,
    playerId,
    name,
    loadGames,
    createGame,
    joinGame,
    readyUp,
    clearPlayer,
  };
}
