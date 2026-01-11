import { randomInt } from "crypto";

export function rollDice(dice: number[], held: boolean[]): number[] {
  return dice.map((d, i) => (held[i] ? d : randomInt(1, 7)));
}
