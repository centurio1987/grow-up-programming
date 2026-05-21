export function missingInteger(_A: number[]): number {
  const pool = new Set(_A);
  for (let i = 1; i <= 1_000_000; i++) {
    if (pool.has(i) == false) {
      return i;
    }
  }

  return 1000000;
}
