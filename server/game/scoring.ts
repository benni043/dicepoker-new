export function scoreChance(dice: number[]): number {
  return dice.reduce((a, b) => a + b, 0);
}

export const SCORERS: Record<string, (dice: number[]) => number> = {
  chance: scoreChance,
};
