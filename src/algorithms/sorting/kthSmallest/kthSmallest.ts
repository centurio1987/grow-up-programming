export function kthSmallest(A: number[], k: number): number {
  //초기화
  const lo = 0;
  const hi = A.length - 1;
  const result = sort(A, lo, hi, k);

  if (result !== undefined) return result;
  else throw new Error();
}

function sort(arr: number[], lo: number, hi: number, k: number) {
  if (hi - lo < 1) return arr[lo];
  // const pivotIdx = lo + Math.floor((hi - lo) / 2);
  const pivotIdx = (Math.floor(Math.random() * 100_000) % (hi - lo)) + lo;
  const pivot = arr[pivotIdx]!;

  swap(arr, hi, pivotIdx);

  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j]! < pivot) {
      swap(arr, j, i);
      i++;
    }
  }

  swap(arr, hi, i);

  if (i === k - 1) {
    return arr[i];
  } else if (i > k - 1) {
    return sort(arr, lo, i - 1, k);
  } else {
    return sort(arr, i + 1, hi, k);
  }
}

function swap(arr: number[], a: number, b: number) {
  const swap = arr[a]!;
  arr[a] = arr[b]!;
  arr[b] = swap;
}
