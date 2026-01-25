<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useDiceRenderer } from "~/composables/useRenderer";

const canvas = ref<HTMLCanvasElement | null>(null);
const renderer = useDiceRenderer();

defineExpose({
  updateDiceStates: renderer.updateDiceStates,
});

onMounted(() => {
  renderer.init(canvas.value!);
});

onBeforeUnmount(() => {
  renderer.dispose();
});
</script>

<template>
  <canvas ref="canvas" />
</template>
