import * as THREE from "three";

export function useDiceRenderer() {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  const diceMeshes: THREE.Mesh[] = [];

  const numDice = 5;
  const fieldRadius = 2.5;
  const diceSize = 0.5;

  /**
   * Creates an array of MeshStandardMaterial, one for each face of a die (1-6).
   * Each material has a CanvasTexture with the appropriate number of dots.
   */
  function createDiceMaterial(): THREE.MeshStandardMaterial[] {
    const materials = [];
    const size = 512; // DiceCanvas resolution for the dot textures
    const radius = 40; // Radius of each dot on the die face

    // Pre-calculated pixel positions for dots on the DiceCanvas
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

    // Generate a DiceCanvas texture for each of the six faces
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

      // Create a Three.js texture from the DiceCanvas and set filtering
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
  function init(canvas: HTMLCanvasElement) {
    // --- Three.js Setup ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x228b22); // Green table background

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 3); // Position camera above the field
    camera.lookAt(0, 0, 0); // Point camera towards the center of the field

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    renderer.setSize(500, 500); // Fixed size for the display DiceCanvas
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

    const geometry = new THREE.BoxGeometry(
      wallLength,
      wallHeight,
      wallThickness,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0x654321 }); // Brown color
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY; // Rotate to align with the physics walls

    scene.add(mesh);
  }

  function animate() {
    requestAnimationFrame(animate); // Request the next frame for continuous animation
    renderer.render(scene, camera); // Render the current state of the scene
  }

  function dispose() {
    renderer.dispose();
  }

  function updateDiceStates(states: any[]) {
    diceMeshes.forEach((mesh, i) => {
      mesh.visible = i < states.length;
    });

    states.forEach((state, i) => {
      const mesh = diceMeshes[i];
      mesh!.position.set(state.position.x, state.position.y, state.position.z);
      mesh!.quaternion.set(
        state.quaternion.x,
        state.quaternion.y,
        state.quaternion.z,
        state.quaternion.w,
      );
    });
  }

  return {
    init,
    updateDiceStates,
    dispose,
  };
}
