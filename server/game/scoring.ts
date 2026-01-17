import type { RoundState } from "~~/server/game/types";

export const SCORERS: Record<
  string,
  (dice: number[], roundState: RoundState) => number
> = {
  ones: () => {
    return 0;
  },
  twos: () => {
    return 0;
  },
  threes: () => {
    return 0;
  },
  fours: () => {
    return 0;
  },
  fives: () => {
    return 0;
  },
  sixes: () => {
    return 0;
  },
  fullHouse: () => {
    return 0;
  },
  street: () => {
    return 0;
  },
  fourKind: scoreFourOfKind,
  fiveKind: () => {
    return 0;
  },
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

function scoreFourOfKind(dice: number[], roundState: RoundState): number {
  const counts = Object.values(countDice(dice));
  const hasFourOfKind = counts.some((c) => c >= 4);

  if (!hasFourOfKind) return 0;

  const allDiceRolled = roundState.held.every((h) => !h);

  return allDiceRolled ? 45 : 40;
}
