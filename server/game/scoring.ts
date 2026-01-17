import type { RoundState } from "~~/server/game/types";

const scoreOnes = (d: number[]) => scoreNumber(d, 1);
const scoreTwos = (d: number[]) => scoreNumber(d, 2);
const scoreThrees = (d: number[]) => scoreNumber(d, 3);
const scoreFours = (d: number[]) => scoreNumber(d, 4);
const scoreFives = (d: number[]) => scoreNumber(d, 5);
const scoreSixes = (d: number[]) => scoreNumber(d, 6);

export const SCORERS: Record<
  string,
  (dice: number[], roundState: RoundState) => number
> = {
  ones: scoreOnes,
  twos: scoreTwos,
  // threes: scoreThrees,
  // fours: scoreFours,
  // fives: scoreFives,
  // sixes: scoreSixes,
  // fullHouse: () => {
  //   return 0;
  // },
  // street: () => {
  //   return 0;
  // },
  // fourKind: scoreFourOfKind,
  // fiveKind: () => {
  //   return 0;
  // },
};

function countDice(dice: number[]): Record<number, number> {
  return dice.reduce(
    (acc, d) => {
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
}

function scoreNumber(dice: number[], value: 1 | 2 | 3 | 4 | 5 | 6): number {
  return dice.reduce((sum, d) => (d === value ? sum + value : sum), 0);
}

function scoreFourOfKind(dice: number[], roundState: RoundState): number {
  const counts = Object.values(countDice(dice));
  const hasFourOfKind = counts.some((c) => c >= 4);

  if (!hasFourOfKind) return 0;

  const allDiceRolled = roundState.held.every((h) => !h);

  return allDiceRolled ? 45 : 40;
}
