export function binaryGap(n: number): number {
  let max = 0;
  let count = 0;
  let x_ = n;

  while (x_ > 0) {
    const moded = x_ % 2;
    if (moded === 1) {
      if (count > max) {
        max = count;
      }
      count = 0;
    } else {
      count++;
    }
    x_ = Math.floor(x_ / 2);
  }

  return max;
}
