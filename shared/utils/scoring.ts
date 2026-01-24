import type { StraightType } from "~~/server/game/types";
import type { RoundState, ScoreKey } from "#shared/utils/types";

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
  threes: scoreThrees,
  fours: scoreFours,
  fives: scoreFives,
  sixes: scoreSixes,
  fullHouse: scoreFullHouse,
  street: scoreStraightBoth,
  fourKind: scoreFourOfKind,
  fiveKind: scoreFiveOfKind,
};

export const SCORE_KEYS: ScoreKey[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "fullHouse",
  "street",
  "fourKind",
  "fiveKind",
];

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

function scoreFullHouse(dice: number[], roundState: RoundState): number {
  const counts = Object.values(countDice(dice));
  const hasThree = counts.some((c) => c === 3);
  const hasTwo = counts.some((c) => c === 2);

  const allDiceRolled = roundState.held.every((h) => !h);

  if (hasThree && hasTwo && allDiceRolled) return 25;
  else if (hasThree && hasTwo && !allDiceRolled) return 20;
  else return 0;
}

function scoreStraight(
  dice: number[],
  roundState: RoundState,
  type: StraightType,
): number {
  const allDiceRolled = roundState.held.every((h) => !h);

  const unique = Array.from(new Set(dice)).sort((a, b) => a - b);

  let straights: number[][];

  switch (type) {
    case "small": {
      straights = [[1, 2, 3, 4, 5]];
      break;
    }
    case "big": {
      straights = [[2, 3, 4, 5, 6]];
      break;
    }
    default: {
      straights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
      ];
    }
  }

  for (const straight of straights) {
    if (straight.every((n) => unique.includes(n)) && allDiceRolled) return 35;
    else if (straight.every((n) => unique.includes(n)) && !allDiceRolled)
      return 30;
  }

  return 0;
}

function scoreStraightBoth(dice: number[], roundState: RoundState): number {
  return scoreStraight(dice, roundState, "both");
}

function scoreFourOfKind(dice: number[], roundState: RoundState): number {
  const counts = Object.values(countDice(dice));
  const hasFourOfKind = counts.some((c) => c >= 4);

  if (!hasFourOfKind) return 0;

  const allDiceRolled = roundState.held.every((h) => !h);

  return allDiceRolled ? 45 : 40;
}

function scoreFiveOfKind(dice: number[], roundState: RoundState): number {
  const counts = Object.values(countDice(dice));
  const hasFiveOfKind = counts.some((c) => c === 5);

  if (!hasFiveOfKind) return 0;

  const allDiceRolled = roundState.held.every((h) => !h);

  return allDiceRolled ? 50 : 55;
}
