import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Mulberry32 } from "#shared/utils/render";

export function useDiceRenderer(diceCount: Ref<number>) {
  let scene!: THREE.Scene;
  let camera!: THREE.PerspectiveCamera;
  let renderer!: THREE.WebGLRenderer;
  let physicsWorld!: CANNON.World;
  let diceMesh!: THREE.Group;

  const params = {
    width: 600,
    height: 400,
    numberOfDice: diceCount.value,
    diceSize: 2,
    segments: 40,
    edgeRadius: 0.14,
    notchRadius: 0.18,
    notchDepth: 0.2,
  };

  const diceArray: {
    mesh: THREE.Group;
    body: CANNON.Body;
  }[] = [];

  function initScene(canvas: HTMLCanvasElement) {
    initPhysics();

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
    });

    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      45,
      params.width / params.height,
      0.1,
      500,
    );

    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    updateSceneSize();

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const topLight = new THREE.PointLight(0xffffff, 1800);
    topLight.position.set(-20, 30, 0);
    topLight.castShadow = true;
    topLight.shadow.mapSize.set(2048, 2048);
    scene.add(topLight);

    createFloor();
    diceMesh = createDiceMesh();

    for (let i = 0; i < params.numberOfDice; i++) {
      diceArray.push(createDice());
    }

    render();
  }

  function updateSceneSize() {
    camera.aspect = params.width / params.height;
    camera.updateProjectionMatrix();
    renderer.setSize(params.width, params.height);
  }

  function initPhysics() {
    physicsWorld = new CANNON.World({
      allowSleep: true,
      gravity: new CANNON.Vec3(0, -65, 0),
    });

    physicsWorld.defaultContactMaterial.restitution = 0.3;
  }

  function createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.ShadowMaterial({ opacity: 0.1 }),
    );

    floor.receiveShadow = true;
    floor.position.y = -7;
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });

    floorBody.position.copy(floor.position as unknown as CANNON.Vec3);
    floorBody.quaternion.copy(floor.quaternion as unknown as CANNON.Quaternion);

    physicsWorld.addBody(floorBody);
  }

  function createDiceMesh() {
    const outerMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0,
      metalness: 1,
      side: THREE.DoubleSide,
    });

    const group = new THREE.Group();

    const innerMesh = new THREE.Mesh(createInnerGeometry(), innerMat);
    const outerMesh = new THREE.Mesh(createBoxGeometry(), outerMat);

    outerMesh.castShadow = true;

    group.add(innerMesh, outerMesh);

    return group;
  }

  function createDice() {
    const mesh = diceMesh.clone();
    scene.add(mesh);

    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          params.diceSize / 2,
          params.diceSize / 2,
          params.diceSize / 2,
        ),
      ),
      sleepTimeLimit: 0.1,
    });

    physicsWorld.addBody(body);

    return { mesh, body };
  }

  function createBoxGeometry() {
    let boxGeometry: THREE.BufferGeometry = new THREE.BoxGeometry(
      params.diceSize,
      params.diceSize,
      params.diceSize,
      params.segments,
      params.segments,
      params.segments,
    );

    const positionAttr = boxGeometry.attributes.position!;
    const subCubeHalfSize = params.diceSize / 2 - params.edgeRadius;

    for (let i = 0; i < positionAttr.count; i++) {
      let position = new THREE.Vector3().fromBufferAttribute(positionAttr, i);

      const subCube = new THREE.Vector3(
        Math.sign(position.x),
        Math.sign(position.y),
        Math.sign(position.z),
      ).multiplyScalar(subCubeHalfSize);
      const addition = new THREE.Vector3().subVectors(position, subCube);

      if (
        Math.abs(position.x) > subCubeHalfSize &&
        Math.abs(position.y) > subCubeHalfSize &&
        Math.abs(position.z) > subCubeHalfSize
      ) {
        addition.normalize().multiplyScalar(params.edgeRadius);
        position = subCube.add(addition);
      } else if (
        Math.abs(position.x) > subCubeHalfSize &&
        Math.abs(position.y) > subCubeHalfSize
      ) {
        addition.z = 0;
        addition.normalize().multiplyScalar(params.edgeRadius);
        position.x = subCube.x + addition.x;
        position.y = subCube.y + addition.y;
      } else if (
        Math.abs(position.x) > subCubeHalfSize &&
        Math.abs(position.z) > subCubeHalfSize
      ) {
        addition.y = 0;
        addition.normalize().multiplyScalar(params.edgeRadius);
        position.x = subCube.x + addition.x;
        position.z = subCube.z + addition.z;
      } else if (
        Math.abs(position.y) > subCubeHalfSize &&
        Math.abs(position.z) > subCubeHalfSize
      ) {
        addition.x = 0;
        addition.normalize().multiplyScalar(params.edgeRadius);
        position.y = subCube.y + addition.y;
        position.z = subCube.z + addition.z;
      }

      const notchWave = (v: number) => {
        v = (1 / params.notchRadius) * v;
        v = Math.PI * Math.max(-1, Math.min(1, v));
        return params.notchDepth * (Math.cos(v) + 1);
      };

      const notch = (pos: number[]) => notchWave(pos[0]!) * notchWave(pos[1]!);

      const offset = 0.23 * params.diceSize;

      if (position.y === params.diceSize / 2) {
        position.y -= notch([position.x, position.z]);
      } else if (position.x === params.diceSize / 2) {
        position.x -= notch([position.y + offset, position.z + offset]);
        position.x -= notch([position.y - offset, position.z - offset]);
      } else if (position.z === params.diceSize / 2) {
        position.z -= notch([position.x - offset, position.y + offset]);
        position.z -= notch([position.x, position.y]);
        position.z -= notch([position.x + offset, position.y - offset]);
      } else if (position.z === -(params.diceSize / 2)) {
        position.z += notch([position.x + offset, position.y + offset]);
        position.z += notch([position.x + offset, position.y - offset]);
        position.z += notch([position.x - offset, position.y + offset]);
        position.z += notch([position.x - offset, position.y - offset]);
      } else if (position.x === -(params.diceSize / 2)) {
        position.x += notch([position.y + offset, position.z + offset]);
        position.x += notch([position.y + offset, position.z - offset]);
        position.x += notch([position.y, position.z]);
        position.x += notch([position.y - offset, position.z + offset]);
        position.x += notch([position.y - offset, position.z - offset]);
      } else if (position.y === -(params.diceSize / 2)) {
        position.y += notch([position.x + offset, position.z + offset]);
        position.y += notch([position.x + offset, position.z]);
        position.y += notch([position.x + offset, position.z - offset]);
        position.y += notch([position.x - offset, position.z + offset]);
        position.y += notch([position.x - offset, position.z]);
        position.y += notch([position.x - offset, position.z - offset]);
      }

      positionAttr.setXYZ(i, position.x, position.y, position.z);
    }

    boxGeometry.deleteAttribute("normal");
    boxGeometry.deleteAttribute("uv");
    boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

    boxGeometry.computeVertexNormals();

    return boxGeometry;
  }

  function createInnerGeometry() {
    const base = new THREE.PlaneGeometry(
      params.diceSize - 2 * params.edgeRadius,
      params.diceSize - 2 * params.edgeRadius,
    );

    const offset = params.diceSize / 2 - 0.02;

    return BufferGeometryUtils.mergeGeometries(
      [
        base.clone().translate(0, 0, offset),
        base.clone().translate(0, 0, -offset),
        base
          .clone()
          .rotateX(Math.PI / 2)
          .translate(0, -offset, 0),
        base
          .clone()
          .rotateX(Math.PI / 2)
          .translate(0, offset, 0),
        base
          .clone()
          .rotateY(Math.PI / 2)
          .translate(-offset, 0, 0),
        base
          .clone()
          .rotateY(Math.PI / 2)
          .translate(offset, 0, 0),
      ],
      false,
    );
  }

  function render() {
    physicsWorld.step(1 / 60);

    for (const dice of diceArray) {
      dice.mesh.position.copy(dice.body.position as unknown as THREE.Vector3);
      dice.mesh.quaternion.copy(
        dice.body.quaternion as unknown as THREE.Quaternion,
      );
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  function throwDice(seed: number) {
    const rng = Mulberry32(seed);

    diceArray.forEach((d, i) => {
      d.body.velocity.setZero();
      d.body.angularVelocity.setZero();

      d.body.position.set(6, i * (params.diceSize * 1.5), 0);

      d.mesh.rotation.set(2 * Math.PI * rng(), 0, 2 * Math.PI * rng());

      d.body.quaternion.copy(d.mesh.quaternion as unknown as CANNON.Quaternion);

      const force = 3 + 5 * rng();
      d.body.applyImpulse(
        new CANNON.Vec3(-force, force, 0),
        new CANNON.Vec3(0, 0, 0.2),
      );

      d.body.allowSleep = true;
    });
  }

  return { initScene, throwDice };
}
