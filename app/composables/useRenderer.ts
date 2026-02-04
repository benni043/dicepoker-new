import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Mulberry32 } from "#shared/utils/render";

export function useDiceRenderer() {
  let scene!: THREE.Scene;
  let camera!: THREE.PerspectiveCamera;
  let renderer!: THREE.WebGLRenderer;
  let physicsWorld!: CANNON.World;
  let diceMesh!: THREE.Group;

  const params = {
    width: 600,
    height: 400,
    numberOfDice: 5,
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const topLight = new THREE.PointLight(0xffffff, 0.5);
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
    group.add(new THREE.Mesh(createInnerGeometry(), innerMat));
    group.add(new THREE.Mesh(createBoxGeometry(), outerMat));

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

    const posAttr = boxGeometry.attributes.position as THREE.BufferAttribute;
    const subCubeHalf = params.diceSize / 2 - params.edgeRadius;

    const notchWave = (v: number) => {
      v = (1 / params.notchRadius) * v;
      v = Math.PI * Math.max(-1, Math.min(1, v));
      return params.notchDepth * (Math.cos(v) + 1);
    };

    const notch = (pos: number[]) => notchWave(pos[0]!) * notchWave(pos[1]!);

    const offset = 0.23 * params.diceSize;

    for (let i = 0; i < posAttr.count; i++) {
      let position = new THREE.Vector3().fromBufferAttribute(posAttr, i);

      const subCube = new THREE.Vector3(
        Math.sign(position.x),
        Math.sign(position.y),
        Math.sign(position.z),
      ).multiplyScalar(subCubeHalf);

      const addition = new THREE.Vector3().subVectors(position, subCube);

      if (
        Math.abs(position.x) > subCubeHalf &&
        Math.abs(position.y) > subCubeHalf &&
        Math.abs(position.z) > subCubeHalf
      ) {
        addition.normalize().multiplyScalar(params.edgeRadius);
        position = subCube.add(addition);
      }

      // Notches
      const half = params.diceSize / 2;

      if (position.y === half) {
        position.y -= notch([position.x, position.z]);
      } else if (position.x === half) {
        position.x -= notch([position.y + offset, position.z + offset]);
      } else if (position.z === half) {
        position.z -= notch([position.x, position.y]);
      }

      posAttr.setXYZ(i, position.x, position.y, position.z);
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

    const geometries = [
      base.clone().translate(0, 0, offset),
      base.clone().translate(0, 0, -offset),
      base
        .clone()
        .rotateX(Math.PI / 2)
        .translate(0, offset, 0),
      base
        .clone()
        .rotateX(Math.PI / 2)
        .translate(0, -offset, 0),
      base
        .clone()
        .rotateY(Math.PI / 2)
        .translate(offset, 0, 0),
      base
        .clone()
        .rotateY(Math.PI / 2)
        .translate(-offset, 0, 0),
    ];

    return BufferGeometryUtils.mergeGeometries(geometries, false)!;
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
