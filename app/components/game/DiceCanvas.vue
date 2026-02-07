<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDiceRenderer } from "~/composables/useRenderer";

const canvas = ref<HTMLCanvasElement | null>(null);

const { gameId, playerId } = useLobby();
const { renderSeed, game, roll } = useGame(gameId, playerId);

const diceCount = computed(() => {
  return game.value?.roundState?.dice?.length ?? 5;
});

const { initScene, throwDice } = useDiceRenderer(diceCount);

watch(renderSeed, () => {
  console.log(renderSeed);

  // throwDice(renderSeed.value!);
});

function throwDiceClick() {
  roll();
}

onMounted(() => {
  initScene(canvas.value!);
});
</script>

<template>
  <canvas ref="canvas" />

  <UButton @click="throwDiceClick">throw</UButton>
</template>
