export function binaryGap(n: number): number {
  let max = 0;
  let count = -1; // -1 means we haven't seen the first 1 yet
  let x = n;

  while (x > 0) {
    const bit = x % 2;
    if (bit === 1) {
      if (count >= 0 && count > max) {
        max = count;
      }
      count = 0;
    } else {
      if (count >= 0) {
        count++;
      }
    }
    x = Math.floor(x / 2);
  }

  return max;
}
