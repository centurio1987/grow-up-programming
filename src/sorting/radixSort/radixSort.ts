export function radixSort(A: number[]): number[] {
  /**
   * 자료구조: 10 크기의 큐
   * mask
   */
  //초기화
  const sorted = [...A];
  const RADIX = 10;
  let round = 0;
  const queue: number[][] = Array.from({ length: RADIX }, (v, k) => []);
  let mask = Math.pow(RADIX, round);
  const maximumRound = Math.floor(Math.log10(Math.max(...A)));

  //핵심 로직
  for (let i = 0; i <= maximumRound; i++) {
    while (sorted.length !== 0) {
      const poped = sorted.shift()!;
      const divided = Math.floor(poped / mask);
      const found = divided % RADIX;
      queue[found]!.push(poped);
    }
    for (let j = 0; j < RADIX; j++) {
      sorted.push(...queue[j]!);
      queue[j] = [];
    }

    round++;
    mask = Math.pow(RADIX, round);
  }
  //리턴

  return sorted;
}
