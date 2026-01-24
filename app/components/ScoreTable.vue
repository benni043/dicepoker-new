<script setup lang="ts">
import { SCORE_KEYS } from "#shared/utils/scoring";

const props = defineProps<{
  players: Player[];
  roundState: RoundState;
  activePlayerId: string;
}>();

const emit = defineEmits<{
  (
    e: "select",
    payload: {
      playerId: string;
      columnIndex: number;
      key: ScoreKey;
    },
  ): void;
}>();

function isActivePlayer(player: Player): boolean {
  return player.id === props.activePlayerId;
}

function getCell(
  player: Player,
  columnIndex: number,
  key: ScoreKey,
): Scorecell | undefined {
  return player.scorecard[columnIndex]?.find((c) => c.key === key);
}

function getDisplayValue(
  player: Player,
  columnIndex: number,
  key: ScoreKey,
): number | "" {
  const cell = getCell(player, columnIndex, key);
  if (!cell) return "";

  if (cell.value !== null) return cell.value;

  if (!isActivePlayer(player)) return "";

  const scorer = SCORERS[key];
  return scorer ? scorer(props.roundState.dice, props.roundState) : "";
}

function isClickable(
  player: Player,
  columnIndex: number,
  key: ScoreKey,
): boolean {
  const cell = getCell(player, columnIndex, key);
  if (!cell) return false;
  if (cell.value !== null) return false;
  if (!isActivePlayer(player)) return false;
  return props.roundState.rollsLeft !== 3;
}

function onClickCell(player: Player, columnIndex: number, key: ScoreKey) {
  if (!isClickable(player, columnIndex, key)) return;

  emit("select", {
    playerId: player.id,
    columnIndex,
    key,
  });
}
</script>

<template>
  <table class="score-table">
    <thead>
      <tr>
        <th>Kategorie</th>
        <th
          v-for="player in players"
          :key="player.id"
          :colspan="player.scorecard.length"
        >
          {{ player.name }}
        </th>
      </tr>
      <tr>
        <th></th>
        <template v-for="player in players" :key="player.id">
          <th v-for="(_, colIndex) in player.scorecard" :key="colIndex">
            {{ colIndex + 1 }}
          </th>
        </template>
      </tr>
    </thead>

    <tbody>
      <tr v-for="key in SCORE_KEYS" :key="key">
        <td>{{ key }}</td>

        <template v-for="player in players" :key="player.id">
          <td
            v-for="(_, colIndex) in player.scorecard"
            :key="colIndex"
            @click="onClickCell(player, colIndex, key)"
            class="px-3 py-2 text-center border transition"
            :class="{
              'bg-gray-100 text-gray-400 cursor-not-allowed':
                !isClickable(player, colIndex, key) &&
                getCell(player, colIndex, key)?.value === null,

              'bg-white text-black font-semibold':
                getCell(player, colIndex, key)?.value !== null,

              'bg-gray-50 text-gray-600 hover:bg-gray-200 cursor-pointer':
                isClickable(player, colIndex, key),
            }"
          >
            {{ getDisplayValue(player, colIndex, key) }}
          </td>
        </template>
      </tr>
    </tbody>

    <tfoot>
      <tr>
        <td>Summe</td>
        <template v-for="player in players" :key="player.id">
          <td v-for="(_, colIndex) in player.scorecard" :key="colIndex">
            {{
              player.scorecard[colIndex]!.reduce(
                (s, c) => s + (c.value ?? 0),
                0,
              )
            }}
          </td>
        </template>
      </tr>
    </tfoot>
  </table>
</template>
