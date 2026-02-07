<script setup lang="ts">
import ScoreTable from "~/components/game/ScoreTable.vue";
import type { ScoreKey } from "#shared/utils/types";
import DiceCanvas from "~/components/game/DiceCanvas.vue";

const {
  games,
  gameId,
  playerId,
  name,
  loadGames,
  createGame,
  joinGame,
  readyUp,
  clearPlayer,
} = useLobby();

const { game, connectWS, hold, score } = useGame(gameId, playerId);

function onSelectScore(payload: {
  playerId: string;
  columnIndex: number;
  key: ScoreKey;
}) {
  if (payload.playerId !== playerId.value) return;
  score(payload.key, payload.columnIndex);
}

function ready() {
  readyUp();
  connectWS();
}

onMounted(() => {
  loadGames();
});
</script>

<template>
  <div>
    <h1>Würfelpoker Test</h1>

    <UButton @click="clearPlayer()">remove id from storage</UButton>

    <div>
      <UButton @click="loadGames">Spiele laden</UButton>

      <div v-for="g in games" :key="g.id">
        <span>{{ g.id }} ({{ g.players.length }} Spieler)</span>
        <UButton @click="gameId = g.id">Beitreten</UButton>
      </div>
    </div>

    {{ gameId }}
    {{ playerId }}

    <div v-if="!gameId">
      <UButton @click="createGame">Game erstellen</UButton>
    </div>

    <div v-else-if="!playerId">
      <input v-model="name" />
      <UButton @click="joinGame">Beitreten</UButton>
    </div>

    <div v-else-if="!game || game.status === 'lobby'">
      <UButton @click="ready()">Ready</UButton>
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
