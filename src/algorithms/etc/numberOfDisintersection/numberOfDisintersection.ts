export function solution(A: number[]): number {
  // TODO: implement
  // let count = 0;
  // const aRange: number[][] = [];
  // for (let i = 0; i < A.length; i++) {
  //   aRange.push([i - A[i]!, i + A[i]!]);
  // }

  // for (let i = 0; i < aRange.length - 1; i++) {
  //   for (let j = i + 1; j < aRange.length; j++) {
  //     if (aRange[i]![1]! >= aRange[j]![0]!) {
  //       count++;
  //     }
  //   }
  // }

  // return count;

  //Optimized

  const lefts = A.map((r, i) => i - r).sort((a, b) => a - b);
  const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

  let counts = 0;

  let rightIdx = 0;
  for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
    while (rightIdx < rights.length) {
      if (lefts[leftIdx]! <= rights[rightIdx]!) {
        counts = counts + rights.length - rightIdx - 1 - leftIdx;
        break;
      } else {
        rightIdx++;
      }
    }
  }

  if (counts > 10_000_000) return -1;
  return counts;
}
