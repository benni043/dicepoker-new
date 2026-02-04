<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useDiceRenderer } from "~/composables/useRenderer";

const canvas = ref<HTMLCanvasElement | null>(null);
const renderer = useDiceRenderer();

defineExpose({
  throwDice,
});

function throwDice(seed: number) {
  renderer.throwDice(seed);
}

onMounted(() => {
  renderer.initScene(canvas.value!);
});
</script>

<template>
  <canvas ref="canvas" />
</template>
