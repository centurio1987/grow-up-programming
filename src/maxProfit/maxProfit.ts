export function maxProfit(A: number[]): number {
  // if (A.length === 0) {
  //   return 0;
  // }

  // let maxDiff = 0;

  // for (let l = A.length; l > 1; l = Math.floor(l / 2)) {
  //   for (let i = 0; i < A.length; i = i + l) {
  //     const mid = Math.floor(l / 2) + i;
  //     let leftMin = Number.MAX_SAFE_INTEGER;
  //     let rightMax = 0;
  //     for (let leftIdx = i; leftIdx < mid; leftIdx++) {
  //       if (leftMin > A[leftIdx]!) {
  //         leftMin = A[leftIdx]!;
  //       }
  //     }
  //     for (let rightIdx = mid; rightIdx < i + l; rightIdx++) {
  //       if (rightMax < A[rightIdx]!) {
  //         rightMax = A[rightIdx]!;
  //       }
  //     }
  //     maxDiff = Math.max(maxDiff, rightMax - leftMin);
  //   }
  // }

  // if (maxDiff > 0) {
  //   return maxDiff;
  // }

  // return 0;

  if (A.length === 0) {
    return 0;
  }

  let minSoFar = A[0]!;
  let maxProfit = 0;

  for (let i = 1; i < A.length; i++) {
    const price = A[i]!;
    if (price < minSoFar) {
      minSoFar = price;
    } else if (price - minSoFar > maxProfit) {
      maxProfit = price - minSoFar;
    }
  }

  return maxProfit;
}
