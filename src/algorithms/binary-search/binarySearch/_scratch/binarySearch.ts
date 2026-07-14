// E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 추출한 것.

export function binarySearch(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);

    if (A[mid] === target) return mid;
    if (A[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }

  return -1;
}

export function linearSearchNaive(A: number[], target: number): number {
  for (let i = 0; i < A.length; i += 1) {
    if (A[i] === target) return i;
  }
  return -1;
}

// ---- 트레이스 재현: A = [1, 3, 5, 7, 9], target = 8 ----
function tracedBinarySearch(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let step = 0;
  console.log(`[trace] 시작: lo=${lo}, hi=${hi}`);
  while (lo <= hi) {
    step++;
    const mid = lo + Math.floor((hi - lo) / 2);
    console.log(`[trace] step ${step}: mid=${mid}, A[mid]=${A[mid]}`);
    if (A[mid] === target) {
      console.log(`[trace] found at ${mid}`);
      return mid;
    }
    if (A[mid] < target) {
      lo = mid + 1;
      console.log(`[trace] A[mid] < target → lo=${lo}, hi=${hi}`);
    } else {
      hi = mid - 1;
      console.log(`[trace] A[mid] > target → lo=${lo}, hi=${hi}`);
    }
  }
  console.log(`[trace] 종료: lo=${lo}, hi=${hi} → -1 반환`);
  return -1;
}

console.log("=== 시뮬 트레이스 재현: A=[1,3,5,7,9], target=8 ===");
const r1 = tracedBinarySearch([1, 3, 5, 7, 9], 8);
console.log("반환값:", r1);

console.log("\n=== 문제 예시 검증 ===");
console.log(binarySearch([1, 3, 5, 7, 9], 5), "expect 2");
console.log(binarySearch([1, 3, 5, 7, 9], 1), "expect 0");
console.log(binarySearch([1, 3, 5, 7, 9], 9), "expect 4");
console.log(binarySearch([1, 3, 5, 7, 9], 4), "expect -1");
console.log(binarySearch([], 1), "expect -1");
console.log(binarySearch([42], 42), "expect 0");
console.log(binarySearch([42], 7), "expect -1");

console.log("\n=== 중복값 ===");
console.log(binarySearch([2, 2, 2, 2], 2), "expect any valid index (0..3)");

console.log("\n=== 랜덤 대조: 선형 vs 이진 ===");
let mismatches = 0;
for (let t = 0; t < 20000; t++) {
  const n = Math.floor(Math.random() * 50);
  const arr: number[] = [];
  let cur = Math.floor(Math.random() * 5) - 2;
  for (let i = 0; i < n; i++) {
    cur += Math.floor(Math.random() * 3); // 0,1,2 증가 → 중복 포함, 오름차순 유지
    arr.push(cur);
  }
  const target = arr.length > 0 && Math.random() < 0.7
    ? arr[Math.floor(Math.random() * arr.length)]!
    : Math.floor(Math.random() * 10) - 5;

  const linIdx = linearSearchNaive(arr, target);
  const binIdx = binarySearch(arr, target);

  const linFound = linIdx !== -1;
  const binFound = binIdx !== -1;

  if (linFound !== binFound) {
    mismatches++;
    console.log("MISMATCH(존재여부)", { arr, target, linIdx, binIdx });
    continue;
  }
  if (linFound && arr[binIdx] !== target) {
    mismatches++;
    console.log("MISMATCH(값 불일치)", { arr, target, linIdx, binIdx });
  }
}
console.log(`랜덤 대조 20000회 완료. mismatches=${mismatches}`);
