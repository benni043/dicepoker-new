<script setup lang="ts">
import { ref, computed } from "vue";
import * as THREE from "three";
import ScoreTable from "~/components/ScoreTable.vue";
import type { ScoreKey } from "#shared/utils/types";

// --- Reactive State ---
const canvas = ref(null);
const diceResults = ref([]);

// --- Three.js Variables ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
const diceMeshes: THREE.Mesh[] = []; // Array to hold Three.js meshes (visual dice)

// --- DICE DATA ---
const numDice = 5;
const fieldRadius = 2.5;
const diceSize = 0.5;

const gameId = ref<string | null>(null);
const playerId = ref<string | null>(null);
const name = ref("player");

// -- start three js functions ---

/**
 * Creates an array of MeshStandardMaterial, one for each face of a die (1-6).
 * Each material has a CanvasTexture with the appropriate number of dots.
 */
function createDiceMaterial(): THREE.MeshStandardMaterial[] {
  const materials = [];
  const size = 512; // Canvas resolution for the dot textures
  const radius = 40; // Radius of each dot on the die face

  // Pre-calculated pixel positions for dots on the canvas
  const positions = {
    center: [size / 2, size / 2],
    topLeft: [size / 4, size / 4],
    topRight: [(3 * size) / 4, size / 4],
    middleLeft: [size / 4, size / 2],
    middleRight: [(3 * size) / 4, size / 2],
    bottomLeft: [size / 4, (3 * size) / 4],
    bottomRight: [(3 * size) / 4, (3 * size) / 4],
  };

  // Maps the index of the materials array (which corresponds to a specific face of
  // THREE.BoxGeometry: +X, -X, +Y, -Y, +Z, -Z) to the dot pattern for the
  // correct die face number.
  // The order is:
  // 0: +X (Right) -> Should show Face 3
  // 1: -X (Left)  -> Should show Face 4
  // 2: +Y (Top)   -> Should show Face 1
  // 3: -Y (Bottom)-> Should show Face 6
  // 4: +Z (Front) -> Should show Face 2
  // 5: -Z (Back)  -> Should show Face 5
  const dotsMap = [
    // Face 3 (+X)
    [positions.topLeft, positions.center, positions.bottomRight],
    // Face 4 (-X)
    [
      positions.topLeft,
      positions.topRight,
      positions.bottomLeft,
      positions.bottomRight,
    ],
    // Face 1 (+Y)
    [positions.center],
    // Face 6 (-Y)
    [
      positions.topLeft,
      positions.topRight,
      positions.middleLeft,
      positions.middleRight,
      positions.bottomLeft,
      positions.bottomRight,
    ],
    // Face 2 (+Z)
    [positions.topLeft, positions.bottomRight],
    // Face 5 (-Z)
    [
      positions.topLeft,
      positions.topRight,
      positions.center,
      positions.bottomLeft,
      positions.bottomRight,
    ],
  ];

  // Generate a canvas texture for each of the six faces
  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Fill the background of the face with white
    ctx!.fillStyle = "white";
    ctx!.fillRect(0, 0, size, size);

    // Draw black dots according to the current face's pattern
    ctx!.fillStyle = "black";
    const dots = dotsMap[i];

    dots!.forEach(([x, y]) => {
      ctx!.beginPath();
      ctx!.arc(x!, y!, radius, 0, 2 * Math.PI);
      ctx!.fill();
    });

    // Create a Three.js texture from the canvas and set filtering
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Create and store the material for this face
    materials.push(new THREE.MeshStandardMaterial({ map: texture }));
  }

  return materials;
}

/**
 * Initializes the Three.js scene, camera, renderer, and visual elements.
 * No Cannon.js physics here as it's handled by the backend.
 */
function init() {
  // --- Three.js Setup ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x228b22); // Green table background

  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 5, 3); // Position camera above the field
  camera.lookAt(0, 0, 0); // Point camera towards the center of the field

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value!,
    antialias: true,
  });
  renderer.setSize(500, 500); // Fixed size for the display canvas
  renderer.setPixelRatio(window.devicePixelRatio); // For better quality on high-res screens

  // --- Lighting ---
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5).normalize(); // Light from top-right-front
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
  scene.add(ambientLight);

  // --- Create Dice (Visual Only) ---
  const diceMaterials = createDiceMaterial(); // Get the pre-generated face materials

  for (let i = 0; i < numDice; i++) {
    // Create Three.js mesh for visual representation
    const geometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize); // Size of the die
    const mesh = new THREE.Mesh(geometry, diceMaterials);
    // Set initial position - these will be updated by server data
    mesh.position.set(
      (i - (numDice - 1) / 2) * diceSize * 1.5,
      diceSize / 2,
      fieldRadius - diceSize * 1.5,
    );
    scene.add(mesh);
    diceMeshes.push(mesh);
  }

  // --- Add Visual Walls (to match backend's physics boundaries) ---
  addVisualWall(0, 0.5, -fieldRadius, 0); // Back visual wall
  addVisualWall(0, 0.5, fieldRadius, Math.PI); // Front visual wall
  addVisualWall(-fieldRadius, 0.5, 0, Math.PI / 2); // Left visual wall
  addVisualWall(fieldRadius, 0.5, 0, -Math.PI / 2); // Right visual wall

  animate(); // Start the rendering loop
}

/**
 * Adds a visible wall mesh to the Three.js scene.
 * @param {number} x X position of the visual wall.
 * @param {number} y Y position of the visual wall.
 * @param {number} z Z position of the visual wall.
 * @param {number} rotY Y rotation (Euler angle) of the visual wall.
 */
function addVisualWall(x: number, y: number, z: number, rotY: number) {
  const wallLength = fieldRadius * 2; // Length of the wall
  const wallHeight = 1; // Height of the wall
  const wallThickness = 0.1; // Thickness of the wall

  const geometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
  const material = new THREE.MeshStandardMaterial({ color: 0x654321 }); // Brown color
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY; // Rotate to align with the physics walls

  scene.add(mesh);
}

/**
 * Initiates the dice throw by emitting a socket event to the backend.
 */
function roll() {
  diceResults.value = []; // Clear previous results display

  // Only emit the event to the server; the server handles the physics.
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "roll",
    }),
  );
}

/**
 * The main animation loop. Only renders the scene based on received data.
 * No physics simulation or settling checks here.
 */
function animate() {
  requestAnimationFrame(animate); // Request the next frame for continuous animation
  renderer.render(scene, camera); // Render the current state of the scene
}

onMounted(() => {
  init();
});

// --- three js end ---

const { status, data, send, open, close } = useWebSocket(`/ws/game`);
const game = ref<any>(null);

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

      if (game.value.status === "finished") {
        removeIdFromLocalStorage();
      }

      console.log(game.value);
    }

    if (msg.type === "diceStateUpdate") {
      const states = msg.diceStates; // z. B. length = 3 oder 5
      const numVisible = states.length;

      // Alle Meshes zuerst unsichtbar machen
      diceMeshes.forEach((mesh, i) => {
        mesh.visible = i < numVisible;
      });

      // Dann nur die sichtbaren updaten
      states.forEach((state: any, index: number) => {
        const mesh = diceMeshes[index];
        if (mesh) {
          mesh.position.set(
            state.position.x,
            state.position.y,
            state.position.z,
          );
          mesh.quaternion.set(
            state.quaternion.x,
            state.quaternion.y,
            state.quaternion.z,
            state.quaternion.w,
          );
        }
      });
    }

    if (msg.type === "error") alert(msg.message);
  });
}

function hold(i: number) {
  const held = [...game.value.roundState.held];
  held[i] = !held[i];
  send(
    JSON.stringify({
      gameId: gameId.value,
      playerId: playerId.value,
      action: "hold",
      payload: { held },
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

function removeIdFromLocalStorage() {
  localStorage.removeItem("playerId");
}

function onSelectScore(payload: {
  playerId: string;
  columnIndex: number;
  key: ScoreKey;
}) {
  if (payload.playerId !== playerId.value) return;
  score(payload.key, payload.columnIndex);
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
      <p>Am Zug: {{ game.players[game.currentPlayerIndex].name }}</p>

      <div v-if="game.roundState">
        <div>
          <span
            v-for="(d, i) in game.roundState.dice"
            :key="i"
            style="cursor: pointer; margin: 5px"
            @click="isMyTurn && hold(i)"
          >
            {{ d }}
            <span v-if="game.roundState.held[i]">[H]</span>
          </span>
        </div>

        <p>Würfe übrig: {{ game.roundState.rollsLeft }}</p>

        <button @click="roll" :disabled="!isMyTurn">Roll</button>

        <ScoreTable
          :players="game.players"
          :round-state="game.roundState"
          :active-player-id="game.players[game.currentPlayerIndex].id"
          @select="onSelectScore"
        />

        <!--        <button @click="score('ones', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (ones)-->
        <!--        </button>-->
        <!--        <button @click="score('ones', 1)" :disabled="!isMyTurn">-->
        <!--          Score (col1) (ones)-->
        <!--        </button>-->
        <!--        <button @click="score('twos', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (twos)-->
        <!--        </button>-->
        <!--        <button @click="score('threes', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (threes)-->
        <!--        </button>-->
        <!--        <button @click="score('fours', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (fours)-->
        <!--        </button>-->
        <!--        <button @click="score('fives', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (fives)-->
        <!--        </button>-->
        <!--        <button @click="score('sixes', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (sixes)-->
        <!--        </button>-->
        <!--        <button @click="score('fullHouse', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (fullHouse)-->
        <!--        </button>-->
        <!--        <button @click="score('street', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (street)-->
        <!--        </button>-->
        <!--        <button @click="score('fourKind', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (fourKind)-->
        <!--        </button>-->
        <!--        <button @click="score('fiveKind', 0)" :disabled="!isMyTurn">-->
        <!--          Score (col0) (fiveKind)-->
        <!--        </button>-->
      </div>
    </div>

    <canvas ref="canvas" />
  </div>
</template>
