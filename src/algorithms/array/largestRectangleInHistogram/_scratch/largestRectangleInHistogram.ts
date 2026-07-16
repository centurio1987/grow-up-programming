// E3 자기검증: 가이드 본문에 실린 코드를 그대로 추출해 실행한다.

function largestRectangleInHistogramNaive(heights: number[]): number {
  const n = heights.length;
  let best = 0;
  for (let i = 0; i < n; i++) {
    const h = heights[i]!;
    let left = i;
    let right = i;
    while (left > 0 && heights[left - 1]! >= h) left--;   // h 이상인 동안 왼쪽으로 확장
    while (right < n - 1 && heights[right + 1]! >= h) right++; // h 이상인 동안 오른쪽으로 확장
    best = Math.max(best, h * (right - left + 1));
  }
  return best;
}

function largestRectangleInHistogramBase(heights: number[]): number {
  const n = heights.length;
  const stack: number[] = []; // 인덱스 저장, 높이 단조 비감소 유지
  let maxArea = 0;

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! > heights[i]!) {
      const j = stack.pop()!;
      const R = i;
      const L = stack.length > 0 ? stack[stack.length - 1]! : -1;
      maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
    }
    stack.push(i);
  }

  // 메인 루프가 끝나도 스택에 남은 막대들 — 오른쪽 경계가 없으므로 n으로 간주해 따로 flush
  while (stack.length > 0) {
    const j = stack.pop()!;
    const R = n;
    const L = stack.length > 0 ? stack[stack.length - 1]! : -1;
    maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
  }

  return maxArea;
}

// "flush 누락" 버그 데모용 (본문에서 언급하는 버그 코드)
function largestRectangleInHistogramNoFlush(heights: number[]): number {
  const n = heights.length;
  const stack: number[] = [];
  let maxArea = 0;
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! > heights[i]!) {
      const j = stack.pop()!;
      const R = i;
      const L = stack.length > 0 ? stack[stack.length - 1]! : -1;
      maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
    }
    stack.push(i);
  }
  return maxArea; // flush 누락
}

// "L=0 버그" 데모용 (본문에서 언급하는 버그 코드)
function largestRectangleInHistogramLZeroBug(heights: number[]): number {
  const n = heights.length;
  const stack: number[] = [];
  let maxArea = 0;
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! > heights[i]!) {
      const j = stack.pop()!;
      const R = i;
      const L = stack.length > 0 ? stack[stack.length - 1]! : 0; // BUG: -1 대신 0
      maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
    }
    stack.push(i);
  }
  while (stack.length > 0) {
    const j = stack.pop()!;
    const R = n;
    const L = stack.length > 0 ? stack[stack.length - 1]! : 0; // BUG
    maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
  }
  return maxArea;
}

function largestRectangleInHistogram(heights: number[]): number {
  const n = heights.length;
  const stack: number[] = [];
  let maxArea = 0;

  for (let i = 0; i <= n; i++) {                 // n 포함: 가상의 높이 0 막대
    const h = i === n ? 0 : heights[i]!;
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! > h) {
      const j = stack.pop()!;
      const R = i;
      const L = stack.length > 0 ? stack[stack.length - 1]! : -1;
      maxArea = Math.max(maxArea, heights[j]! * (R - L - 1));
    }
    stack.push(i);
  }

  return maxArea;
}

function bruteForceOracle(heights: number[]): number {
  const n = heights.length;
  let best = 0;
  for (let l = 0; l < n; l++) {
    let min = Infinity;
    for (let r = l; r < n; r++) {
      min = Math.min(min, heights[r]!);
      best = Math.max(best, min * (r - l + 1));
    }
  }
  return best;
}

function computeLR(heights: number[]) {
  const n = heights.length;
  const L: number[] = new Array(n).fill(-1);
  const R: number[] = new Array(n).fill(n);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! >= heights[i]!) stack.pop();
    L[i] = stack.length > 0 ? stack[stack.length - 1]! : -1;
    stack.push(i);
  }
  stack.length = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! >= heights[i]!) stack.pop();
    R[i] = stack.length > 0 ? stack[stack.length - 1]! : n;
    stack.push(i);
  }
  return { L, R };
}

// ---- 대표 예시: heights = [2,1,5,6,2,3], 기대 반환값 10 ----
const H = [2, 1, 5, 6, 2, 3];
console.log("[대표 예시] naive:", largestRectangleInHistogramNaive(H));
console.log("[대표 예시] base:", largestRectangleInHistogramBase(H));
console.log("[대표 예시] optimized:", largestRectangleInHistogram(H));
console.log("[대표 예시] bruteForceOracle:", bruteForceOracle(H));

// ---- 3.1절 표 검증 ----
{
  const { L, R } = computeLR(H);
  console.log("\n[3.1절 표] j, h, L, R, width, area");
  for (let j = 0; j < H.length; j++) {
    const width = R[j]! - L[j]! - 1;
    console.log(j, H[j], L[j], R[j], width, H[j]! * width);
  }
}

// ---- problem.md 예시 전량 교차검증 ----
const cases: [number[], number][] = [
  [[2, 1, 5, 6, 2, 3], 10],
  [[1, 2, 3, 4, 5], 9],
  [[5, 4, 3, 2, 1], 9],
  [[2, 0, 2], 2],
  [[0, 0, 0], 0],
  [[1, 1, 1, 1], 4],
  [[7], 7],
  [[2, 4], 4],
];
console.log("\n[problem.md 예시 교차검증]");
let allExamplesOk = true;
for (const [arr, expected] of cases) {
  const o = largestRectangleInHistogram(arr);
  const b = largestRectangleInHistogramBase(arr);
  const brute = bruteForceOracle(arr);
  const ok = o === expected && b === expected && brute === expected;
  allExamplesOk &&= ok;
  console.log(JSON.stringify(arr), "expected:", expected, "optimized:", o, "base:", b, "brute:", brute, ok ? "OK" : "MISMATCH");
}
console.log("전체 예시 일치:", allExamplesOk);

// ---- 랜덤 교차검증 ----
function randHeights(n: number, maxH: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * (maxH + 1)));
}
let randomOk = true;
for (let t = 0; t < 3000; t++) {
  const n = 1 + Math.floor(Math.random() * 15);
  const arr = randHeights(n, 6);
  const brute = bruteForceOracle(arr);
  const opt = largestRectangleInHistogram(arr);
  const base = largestRectangleInHistogramBase(arr);
  if (brute !== opt || brute !== base) {
    randomOk = false;
    console.log("MISMATCH", arr, { brute, opt, base });
  }
}
console.log("\n[랜덤 3000회 교차검증] 전부 일치:", randomOk);

// ---- 함정 데모 1: flush 누락 (heights=[1,2,3,4,5]) ----
console.log("\n[함정 데모: flush 누락] heights=[1,2,3,4,5]");
console.log("정상(optimized):", largestRectangleInHistogram([1, 2, 3, 4, 5]));
console.log("정상(base, flush 있음):", largestRectangleInHistogramBase([1, 2, 3, 4, 5]));
console.log("버그(flush 없음):", largestRectangleInHistogramNoFlush([1, 2, 3, 4, 5]));

// ---- 함정 데모 2: L=-1 대신 0 (heights=[5]) ----
console.log("\n[함정 데모: L=0 버그] heights=[5]");
console.log("정상(optimized):", largestRectangleInHistogram([5]));
console.log("버그(L=0):", largestRectangleInHistogramLZeroBug([5]));

// ---- 자가점검 문제1: heights=[3,1,3,2,2] ----
console.log("\n[자가점검 문제1] heights=[3,1,3,2,2]");
console.log("optimized:", largestRectangleInHistogram([3, 1, 3, 2, 2]));
console.log("bruteForceOracle:", bruteForceOracle([3, 1, 3, 2, 2]));
{
  const arr = [3, 1, 3, 2, 2];
  const { L, R } = computeLR(arr);
  for (let j = 0; j < arr.length; j++) {
    const width = R[j]! - L[j]! - 1;
    console.log(j, arr[j], L[j], R[j], width, arr[j]! * width);
  }
}

// ---- 자가점검 문제2: heights=[4,4,4,4] ----
console.log("\n[자가점검 문제2] heights=[4,4,4,4]");
console.log("optimized:", largestRectangleInHistogram([4, 4, 4, 4]));
console.log("버그(flush 없음):", largestRectangleInHistogramNoFlush([4, 4, 4, 4]));
