export function useGame(
  gameId: Ref<string | null>,
  playerId: Ref<string | null>,
) {
  const game: Ref<GameDTO | null> = useState("game", () => null);

  const { data, send } = useWebSocket(`/ws/game`);

  const renderSeed: Ref<number | null> = useState("renderSeed", () => null);

  const isMyTurn = computed(() => {
    if (!game.value || !playerId.value) return false;
    return (
      game.value.players[game.value.currentPlayerIndex]?.id === playerId.value
    );
  });

  function connectWS() {
    watch(data, (raw) => {
      const msg = JSON.parse(raw);

      if (msg.type === "state") {
        game.value = msg.gameDTO;

        if (game.value!.status === "finished") {
          localStorage.removeItem("playerId");
        }

        console.log(game.value);
      }

      //kommt ned an kb mehr
      if (msg.type === "renderInformation") {
        console.log("render");
        console.log(msg.renderInformation.seed);
        renderSeed.value = msg.renderInformation.seed;
      }

      if (msg.type === "error") {
        alert(msg.message);
      }
    });

    send(
      JSON.stringify({
        gameId: gameId.value,
        playerId: playerId.value,
        action: "init",
      }),
    );
  }

  function sendAction(action: string, payload?: any) {
    console.log(action, payload);

    console.log(gameId.value);
    console.log(playerId.value);

    send(
      JSON.stringify({
        gameId: gameId.value,
        playerId: playerId.value,
        action,
        payload,
      }),
    );
  }

  const roll = () => sendAction("roll");
  const hold = (index: number) => sendAction("hold", { index });
  const score = (key: ScoreKey, column: number) =>
    sendAction("score", { category: key, column });

  return {
    game,
    isMyTurn,
    renderSeed,
    connectWS,
    roll,
    hold,
    score,
  };
}
