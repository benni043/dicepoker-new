<script setup lang="ts">
import { ref, computed } from "vue";
import ScoreTable from "~/components/game/ScoreTable.vue";
import type { RoundState, ScoreKey } from "#shared/utils/types";
import DiceCanvas from "~/components/game/DiceCanvas.vue";

const { status, data, send, open, close } = useWebSocket(`/ws/game`);

const gameId = ref<string | null>(null);
const playerId = ref<string | null>(null);
const name = ref("player");

const game = ref<GameDTO | null>(null);
const games = ref<{ id: string; status: string; players: string[] }[]>([]);

const isMyTurn = computed(() => {
  if (!game.value || !playerId.value) return false;
  return (
    game.value.players[game.value.currentPlayerIndex]?.id === playerId.value
  );
});

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

      connectWS();

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

async function loadGames() {
  games.value =
    await $fetch<{ id: string; status: string; players: string[] }[]>(
      "/api/games",
    );
}

async function readyUp() {
  try {
    await $fetch(`/api/games/${gameId.value}/ready`, {
      method: "POST",
      body: { playerId: playerId.value },
    });

    connectWS();
  } catch (e: any) {
    alert(e.data?.message ?? "Unbekannter Fehler");
  }
}

const diceCanvas = ref<InstanceType<typeof DiceCanvas> | null>(null);

function connectWS() {
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "init",
    }),
  );

  watch(data, (newValue) => {
    const msg = JSON.parse(newValue);

    if (msg.type === "state") {
      game.value = msg.gameDTO;

      if (game.value!.status === "finished") {
        removeIdFromLocalStorage();
      }

      console.log(game.value);
    }

    if (msg.type === "renderInformation") {
      const rs: RoundState = msg.renderInformation;

      diceCanvas.value?.throwDice(rs.seed);
    }

    if (msg.type === "error") alert(msg.message);
  });
}

function hold(index: number) {
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "hold",
      payload: { index: index },
    }),
  );
}

function score(type: string, column: number) {
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "score",
      payload: { category: type, column: column },
    }),
  );
}

function roll() {
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "roll",
    }),
  );
}

function onSelectScore(payload: {
  playerId: string;
  columnIndex: number;
  key: ScoreKey;
}) {
  if (payload.playerId !== playerId.value) return;
  score(payload.key, payload.columnIndex);
}

function removeIdFromLocalStorage() {
  localStorage.removeItem("playerId");
}
</script>

<template>
  <div>
    <h1>Würfelpoker Test</h1>

    <button @click="removeIdFromLocalStorage()">remove id from storage</button>

    <div>
      <button @click="loadGames">Spiele laden</button>

      <div v-for="g in games" :key="g.id">
        <span>{{ g.id }} ({{ g.players.length }} Spieler)</span>
        <button @click="gameId = g.id">Beitreten</button>
      </div>
    </div>

    <div v-if="!gameId">
      <button @click="createGame">Game erstellen</button>
    </div>

    <div v-else-if="!playerId">
      <input v-model="name" />
      <button @click="joinGame">Beitreten</button>
    </div>

    <div v-else-if="!game || game.status === 'lobby'">
      <button @click="readyUp">Ready</button>
    </div>

    <div v-else>
      <h3>Spiel {{ game.id }}</h3>
      <p>Am Zug: {{ game!.players[game!.currentPlayerIndex!]!.name }}</p>

      <div v-if="game.roundState">
        <div>
          <span
            v-for="(d, i) in game.roundState.dice"
            :key="i"
            style="cursor: pointer; margin: 5px"
            @click="hold(i)"
          >
            {{ d }}
            <span v-if="game.roundState.held.includes(i)">[H]</span>
          </span>
        </div>

        <p>Würfe übrig: {{ game.roundState.rollsLeft }}</p>

        <button @click="roll" :disabled="!isMyTurn">Roll</button>

        <ScoreTable
          :players="game.players"
          :round-state="game.roundState"
          :active-player-id="game.players[game.currentPlayerIndex]!.id"
          @select="onSelectScore"
        />
      </div>
    </div>

    <DiceCanvas ref="diceCanvas" />
  </div>
</template>
