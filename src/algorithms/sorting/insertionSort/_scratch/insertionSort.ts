// ---- naive (출발점) ----
function insertionSortNaive(A: number[]): number[] {
  const B = [...A];
  for (let i = 0; i < B.length; i++) {
    for (let j = i + 1; j < B.length; j++) {
      if (B[i] > B[j]) {
        const tmp = B[i];
        B[i] = B[j];
        B[j] = tmp;
      }
    }
  }
  return B;
}

// ---- base (아이디어를 코드로 옮기기) ----
function insertionSortBase(A: number[]): number[] {
  const B = [...A];
  for (let i = 1; i < B.length; i++) {
    const key = B[i];
    let j = i - 1;
    while (j >= 0 && B[j] > key) {
      B[j + 1] = B[j];
      j--;
    }
    B[j + 1] = key;
  }
  return B;
}

// ---- optimized (이진 탐색 삽입) ----
function insertionSortOptimized(A: number[]): number[] {
  const B = [...A];
  for (let i = 1; i < B.length; i++) {
    const key = B[i];
    let lo = 0;
    let hi = i;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (B[mid] <= key) lo = mid + 1;
      else hi = mid;
    }
    for (let k = i; k > lo; k--) {
      B[k] = B[k - 1];
    }
    B[lo] = key;
  }
  return B;
}

// ---- bug demonstrations ----
function bugSwapDirection(A: number[]): number[] {
  const B = [...A];
  for (let i = 1; i < B.length; i++) {
    const key = B[i];
    let j = i - 1;
    while (j >= 0 && B[j] > key) {
      B[j] = B[j + 1]; // WRONG direction
      j--;
    }
    B[j + 1] = key;
  }
  return B;
}

function bugNoCopy(A: number[]): number[] {
  const B = A; // no copy
  for (let i = 1; i < B.length; i++) {
    const key = B[i];
    let j = i - 1;
    while (j >= 0 && B[j] > key) {
      B[j + 1] = B[j];
      j--;
    }
    B[j + 1] = key;
  }
  return B;
}

// ---- verification harness ----
function assertEqual(actual: number[], expected: number[], label: string) {
  const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
  console.log(`${ok ? "OK " : "FAIL"} ${label}: got=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

const cases: number[][] = [
  [],
  [7],
  [1, 2, 3, 4],
  [4, 3, 2, 1],
  [5, 5, 5],
  [-3, 1, -1, 2],
  [3, 1, 4, 1, 2],
  [5, 2, 4, 6, 1, 3],
  [2, 1],
  [-3, 0, -1, 2, 1],
  [4, 4, 4, 4],
  [42],
  [1, 2, 3, 4, 5],
];

for (const c of cases) {
  const expected = [...c].sort((a, b) => a - b);
  assertEqual(insertionSortBase([...c]), expected, `base ${JSON.stringify(c)}`);
  assertEqual(insertionSortOptimized([...c]), expected, `optimized ${JSON.stringify(c)}`);
  assertEqual(insertionSortNaive([...c]), expected, `naive ${JSON.stringify(c)}`);
}

// random cross-check
for (let t = 0; t < 200; t++) {
  const n = Math.floor(Math.random() * 30);
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
  const expected = [...arr].sort((a, b) => a - b);
  assertEqual(insertionSortBase([...arr]), expected, `random-base n=${n}`);
  assertEqual(insertionSortOptimized([...arr]), expected, `random-opt n=${n}`);
}

// original-array immutability check
{
  const A = [3, 1, 4, 1, 2];
  const copyBefore = [...A];
  insertionSortBase(A);
  console.log("immutability base:", JSON.stringify(A) === JSON.stringify(copyBefore) ? "OK (안 변함)" : "FAIL (변함)");
  insertionSortOptimized(A);
  console.log("immutability optimized:", JSON.stringify(A) === JSON.stringify(copyBefore) ? "OK (안 변함)" : "FAIL (변함)");
}

// pedagogical trace: A = [3,1,4,1,2] with base algorithm, print intermediate B after each outer i
{
  function traced(A: number[]) {
    const B = [...A];
    console.log("초기:", JSON.stringify(B));
    for (let i = 1; i < B.length; i++) {
      const key = B[i];
      let j = i - 1;
      let moves = 0;
      while (j >= 0 && B[j] > key) {
        B[j + 1] = B[j];
        j--;
        moves++;
      }
      B[j + 1] = key;
      console.log(`i=${i}: key=${key} -> B=${JSON.stringify(B)} (이동 ${moves}회)`);
    }
    return B;
  }
  traced([3, 1, 4, 1, 2]);
}

// bug demonstration outputs
console.log("bugSwapDirection([3,1,4,1,2]) =", JSON.stringify(bugSwapDirection([3, 1, 4, 1, 2])));
{
  const A = [3, 1, 2];
  const before = [...A];
  const r = bugNoCopy(A);
  console.log("bugNoCopy: result=", JSON.stringify(r), "original after call=", JSON.stringify(A), "original before=", JSON.stringify(before));
}

// naive cost count for N=5 example (no early exit) comparisons
{
  function naiveCount(A: number[]) {
    const B = [...A];
    let comparisons = 0;
    for (let i = 0; i < B.length; i++) {
      for (let j = i + 1; j < B.length; j++) {
        comparisons++;
        if (B[i] > B[j]) {
          const tmp = B[i]; B[i] = B[j]; B[j] = tmp;
        }
      }
    }
    return comparisons;
  }
  console.log("naive comparisons for N=5:", naiveCount([3, 1, 4, 1, 2]));
}

// binary search comparisons count vs linear for base vs optimized on nearly sorted large-ish input
{
  function countCompares(A: number[], mode: "linear" | "binary") {
    const B = [...A];
    let compares = 0;
    for (let i = 1; i < B.length; i++) {
      const key = B[i];
      if (mode === "linear") {
        let j = i - 1;
        while (j >= 0) {
          compares++;
          if (!(B[j] > key)) break;
          B[j + 1] = B[j];
          j--;
        }
        B[j + 1] = key;
      } else {
        let lo = 0, hi = i;
        while (lo < hi) {
          compares++;
          const mid = (lo + hi) >> 1;
          if (B[mid] <= key) lo = mid + 1; else hi = mid;
        }
        for (let k = i; k > lo; k--) B[k] = B[k - 1];
        B[lo] = key;
      }
    }
    return compares;
  }
  const N = 1000;
  const sortedArr = Array.from({ length: N }, (_, i) => i);
  // reverse sorted worst case
  const reversedArr = Array.from({ length: N }, (_, i) => N - i);
  console.log("N=1000 sorted: linear compares=", countCompares(sortedArr, "linear"), "binary compares=", countCompares(sortedArr, "binary"));
  console.log("N=1000 reversed: linear compares=", countCompares(reversedArr, "linear"), "binary compares=", countCompares(reversedArr, "binary"));
}

// shift counts identical regardless of position-finding method
{
  function shiftCount(A: number[], mode: "linear" | "binary") {
    const B = [...A];
    let shifts = 0;
    for (let i = 1; i < B.length; i++) {
      const key = B[i];
      if (mode === "linear") {
        let j = i - 1;
        while (j >= 0 && B[j] > key) { B[j + 1] = B[j]; j--; shifts++; }
        B[j + 1] = key;
      } else {
        let lo = 0, hi = i;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (B[mid] <= key) lo = mid + 1; else hi = mid; }
        for (let k = i; k > lo; k--) { B[k] = B[k - 1]; shifts++; }
        B[lo] = key;
      }
    }
    return shifts;
  }
  for (const a of [[3, 1, 4, 1, 2], [4, 3, 2, 1], [1, 2, 3, 4], [5, 2, 4, 6, 1, 3]]) {
    console.log(JSON.stringify(a), "linear shifts=", shiftCount(a, "linear"), "binary shifts=", shiftCount(a, "binary"));
  }
}

// optimized-code pitfall: hi = i - 1 instead of i (search range excludes last slot)
function bugHiOffByOne(A: number[]): number[] {
  const B = [...A];
  for (let i = 1; i < B.length; i++) {
    const key = B[i];
    let lo = 0;
    let hi = i - 1; // WRONG: should be i
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (B[mid] <= key) lo = mid + 1;
      else hi = mid;
    }
    for (let k = i; k > lo; k--) B[k] = B[k - 1];
    B[lo] = key;
  }
  return B;
}
console.log("bugHiOffByOne([3,1,4,1,2]) =", JSON.stringify(bugHiOffByOne([3, 1, 4, 1, 2])));

console.log("ALL DONE");

// self-check Q1 verification
{
  function tracedMoves(A: number[]) {
    const B = [...A];
    let total = 0;
    for (let i = 1; i < B.length; i++) {
      const key = B[i];
      let j = i - 1;
      let moves = 0;
      while (j >= 0 && B[j] > key) { B[j+1] = B[j]; j--; moves++; }
      B[j+1] = key;
      total += moves;
      console.log(`i=${i} key=${key} moves=${moves} B=${JSON.stringify(B)}`);
    }
    console.log("total moves=", total);
    return B;
  }
  tracedMoves([2,4,1,3]);
}
