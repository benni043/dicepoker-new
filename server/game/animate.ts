import * as CANNON from "cannon-es";
import { Mulberry32 } from "#shared/utils/render";
import crypto from "crypto";
import { DiceResult } from "./types";

export function simulateDiceRoll(diceSize = 2, diceCount: number) {
  const serverSeed = crypto.getRandomValues(new Uint32Array(1))[0];

  const physicsWorld = new CANNON.World({
    allowSleep: true,
    gravity: new CANNON.Vec3(0, -65, 0),
  });

  physicsWorld.defaultContactMaterial.restitution = 0.3;

  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });

  floorBody.position.y = -7;
  floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5,
  );

  physicsWorld.addBody(floorBody);

  const diceBodies = [];
  const rng = Mulberry32(serverSeed);

  for (let i = 0; i < diceCount; i++) {
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(
        new CANNON.Vec3(diceSize / 2, diceSize / 2, diceSize / 2),
      ),
      sleepTimeLimit: 0.1,
    });

    body.velocity.setZero();
    body.angularVelocity.setZero();

    body.position = new CANNON.Vec3(6, i * (diceSize * 1.5), 0);
    const rx = 2 * Math.PI * rng();
    const rz = 2 * Math.PI * rng();

    const q = new CANNON.Quaternion();
    q.setFromEuler(rx, 0, rz, "XYZ");

    body.quaternion.copy(q);

    const force = 3 + 5 * rng();
    body.applyImpulse(
      new CANNON.Vec3(-force, force, 0),
      new CANNON.Vec3(0, 0, 0.2),
    );

    physicsWorld.addBody(body);
    diceBodies.push(body);
  }

  while (true) {
    physicsWorld.step(1 / 60);

    let allStable = true;

    for (const body of diceBodies) {
      if (body.sleepState !== CANNON.Body.SLEEPING) {
        allStable = false;
      }
    }

    if (allStable) break;
  }

  return {
    dice: diceBodies.map((body) => getDiceResult(body)),
    seed: serverSeed,
  } as DiceResult;
}

function getDiceResult(body: CANNON.Body) {
  const euler = new CANNON.Vec3();
  body.quaternion.toEuler(euler);

  const eps = 0.1;

  const isZero = (angle: number) => Math.abs(angle) < eps;
  const isHalfPi = (angle: number) => Math.abs(angle - 0.5 * Math.PI) < eps;
  const isMinusHalfPi = (angle: number) =>
    Math.abs(0.5 * Math.PI + angle) < eps;
  const isPiOrMinusPi = (angle: number) =>
    Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps;

  if (isZero(euler.z)) {
    if (isZero(euler.x)) return 1;
    if (isHalfPi(euler.x)) return 4;
    if (isMinusHalfPi(euler.x)) return 3;
    if (isPiOrMinusPi(euler.x)) return 6;
  } else if (isHalfPi(euler.z)) {
    return 2;
  } else if (isMinusHalfPi(euler.z)) {
    return 5;
  }

  return 0;
}
