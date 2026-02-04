<script setup lang="ts">
import { ref, computed } from "vue";
import ScoreTable from "~/components/game/ScoreTable.vue";
import type { ScoreKey } from "#shared/utils/types";
import DiceCanvas from "~/components/game/DiceCanvas.vue";

const { status, data, send, open, close } = useWebSocket(`/ws/game`);
const gameComposable = useGame();

const isMyTurn = computed(() => {
  if (!gameComposable.game || !gameComposable.playerId.value) return false;
  return (
    gameComposable.game.value!.players[
      gameComposable.game.value!.currentPlayerIndex
    ]?.id === gameComposable.playerId.value
  );
});

const diceCanvas = ref<InstanceType<typeof DiceCanvas> | null>(null);

function connectWS() {
  send(
    JSON.stringify({
      gameId: gameComposable.gameId.value,
      playerId: gameComposable.playerId.value,
      action: "init",
    }),
  );

  watch(data, (newValue) => {
    const msg = JSON.parse(newValue);

    if (msg.type === "state") {
      gameComposable.game.value = msg.gameDTO;

      if (gameComposable.game.value!.status === "finished") {
        gameComposable.clearPlayer();
      }

      console.log(gameComposable.game.value);
    }

    if (msg.type === "renderInformation") {
      diceCanvas.value?.throwDice(msg.renderInformation);
    }

    if (msg.type === "error") alert(msg.message);
  });
}

function hold(i: number) {
  const held = [...gameComposable.game.value!.roundState!.held];
  held[i] = !held[i];
  send(
    JSON.stringify({
      gameId: gameComposable.gameId.value,
      playerId: gameComposable.playerId.value,
      action: "hold",
      payload: { held },
    }),
  );
}

function score(type: string, column: number) {
  send(
    JSON.stringify({
      gameId: gameComposable.gameId.value,
      playerId: gameComposable.playerId.value,
      action: "score",
      payload: { category: type, column: column },
    }),
  );
}

function roll() {
  send(
    JSON.stringify({
      gameId: gameComposable.gameId.value,
      playerId: gameComposable.playerId.value,
      action: "roll",
    }),
  );
}

function onSelectScore(payload: {
  playerId: string;
  columnIndex: number;
  key: ScoreKey;
}) {
  if (payload.playerId !== gameComposable.playerId.value) return;
  score(payload.key, payload.columnIndex);
}
</script>

<template>
  <div>
    <h1>Würfelpoker Test</h1>

    <button @click="gameComposable.clearPlayer()">
      remove id from storage
    </button>

    <div>
      <button @click="gameComposable.loadGames">Spiele laden</button>

      <div v-for="g in gameComposable.games.value" :key="g.id">
        <span>{{ g.id }} ({{ g.players.length }} Spieler)</span>
        <button @click="gameComposable.gameId.value = g.id">Beitreten</button>
      </div>
    </div>

    <div v-if="!gameComposable.gameId">
      <button @click="gameComposable.createGame">Game erstellen</button>
    </div>

    <div v-else-if="!gameComposable.playerId">
      <input v-model="gameComposable.name" />
      <button @click="gameComposable.joinGame">Beitreten</button>
    </div>

    <div
      v-else-if="
        !gameComposable.game || gameComposable.game.value!.status === 'lobby'
      "
    >
      <button @click="gameComposable.readyUp">Ready</button>
    </div>

    <div v-else>
      <h3>Spiel {{ gameComposable.game.value!.id }}</h3>
      <p>
        Am Zug:
        {{
          gameComposable.game.value!.players[
            gameComposable.game.value!.currentPlayerIndex
          ]!.name
        }}
      </p>

      <div v-if="gameComposable.game.value!.roundState">
        <div>
          <span
            v-for="(d, i) in gameComposable.game.value!.roundState.dice"
            :key="i"
            style="cursor: pointer; margin: 5px"
            @click="isMyTurn && hold(i)"
          >
            {{ d }}
            <span v-if="gameComposable.game.value!.roundState.held[i]"
              >[H]</span
            >
          </span>
        </div>

        <p>
          Würfe übrig: {{ gameComposable.game.value!.roundState.rollsLeft }}
        </p>

        <button @click="roll" :disabled="!isMyTurn">Roll</button>

        <ScoreTable
          :players="gameComposable.game.value!.players"
          :round-state="gameComposable.game.value!.roundState"
          :active-player-id="
            gameComposable.game.value!.players[
              gameComposable.game.value!.currentPlayerIndex
            ]!.id
          "
          @select="onSelectScore"
        />
      </div>
    </div>

    <DiceCanvas ref="diceCanvas" />
  </div>
</template>
