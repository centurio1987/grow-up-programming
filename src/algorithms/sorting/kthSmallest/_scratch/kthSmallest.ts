// 가이드 자기검증용 스크래치. 가이드 본문 코드를 그대로 옮겨 실행/검증한다.
// sibling kthSmallest.ts(학습자 실습 스텁)와는 무관하다.

// ---------- 0. naive (원형): k번 반복 최솟값 탐색 ----------
function kthSmallestNaive(input: number[], k: number): number {
  const A = [...input];
  let result = -Infinity;
  for (let step = 0; step < k; step++) {
    let minVal = Infinity;
    let minIdx = -1;
    for (let j = 0; j < A.length; j++) {
      if (A[j] < minVal) {
        minVal = A[j];
        minIdx = j;
      }
    }
    result = minVal;
    A[minIdx] = Infinity; // 뽑은 원소를 무한대로 표시해 다음 탐색에서 제외
  }
  return result;
}

// ---------- 1. 기본 구현: 결정적 피벗(pivot = A[hi]) Quickselect ----------
function kthSmallestBasic(input: number[], k: number): number {
  const A = [...input];
  const target = k - 1;

  function partition(lo: number, hi: number): number {
    const pivot = A[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (A[j] <= pivot) {
        i++;
        [A[i], A[j]] = [A[j], A[i]];
      }
    }
    [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
    return i + 1;
  }

  function quickselect(lo: number, hi: number): number {
    if (lo === hi) return A[lo];
    const p = partition(lo, hi);
    if (p === target) return A[p];
    if (p > target) return quickselect(lo, p - 1);
    return quickselect(p + 1, hi);
  }

  return quickselect(0, A.length - 1);
}

// 결정적 버전의 트레이스 출력(시뮬레이션 프레임 검증용)
function traceBasic(input: number[], k: number) {
  const A = [...input];
  const target = k - 1;
  console.log(`초기화: A=${JSON.stringify(A)}, target=${target}`);

  function partition(lo: number, hi: number): number {
    const pivot = A[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (A[j] <= pivot) {
        i++;
        [A[i], A[j]] = [A[j], A[i]];
      }
    }
    [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
    return i + 1;
  }

  function quickselect(lo: number, hi: number): number {
    if (lo === hi) return A[lo];
    const pivotVal = A[hi];
    console.log(`  Partition 구간[${lo},${hi}]: pivot=A[${hi}]=${pivotVal}`);
    const p = partition(lo, hi);
    console.log(`    → 결과 A=${JSON.stringify(A)}, p=${p}`);
    if (p === target) {
      console.log(`    p=${p} == target=${target} → 반환 A[${p}]=${A[p]}`);
      return A[p];
    }
    if (p > target) {
      console.log(`    p=${p} > target=${target} → 왼쪽 [${lo},${p - 1}] 재귀`);
      return quickselect(lo, p - 1);
    }
    console.log(`    p=${p} < target=${target} → 오른쪽 [${p + 1},${hi}] 재귀`);
    return quickselect(p + 1, hi);
  }

  const ans = quickselect(0, A.length - 1);
  console.log(`최종 반환값: ${ans}`);
  return ans;
}

// ---------- 2. 최적화: 무작위 피벗 Quickselect ----------
function kthSmallest(input: number[], k: number): number {
  const A = [...input];
  const target = k - 1;

  function partition(lo: number, hi: number): number {
    const pivot = A[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (A[j] <= pivot) {
        i++;
        [A[i], A[j]] = [A[j], A[i]];
      }
    }
    [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
    return i + 1;
  }

  let lo = 0;
  let hi = A.length - 1;
  while (lo < hi) {
    const pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
    [A[pivotIdx], A[hi]] = [A[hi], A[pivotIdx]];
    const p = partition(lo, hi);
    if (p === target) return A[p];
    if (p > target) hi = p - 1;
    else lo = p + 1;
  }
  return A[lo];
}

// ================= 실행/검증 =================

console.log("=== 1) 고정 예시 트레이스: A=[3,1,4,1,5,9,2,6], k=3 ===");
traceBasic([3, 1, 4, 1, 5, 9, 2, 6], 3);

console.log("\n=== 2) naive vs basic vs optimized 교차 검증 ===");
const cases: Array<[number[], number]> = [
  [[3, 1, 4, 1, 5, 9, 2, 6], 3],
  [[3, 1, 4, 1, 5], 1],
  [[3, 1, 4, 1, 5], 5],
  [[7], 1],
  [[3, 1, 4, 1, 5, 9, 2, 6], 4],
  [[2, 2, 2], 2],
  [[-5, 0, 5, -10, 10], 1],
  [[1_000_000_000, -1_000_000_000, 0], 2],
];

for (const [arr, k] of cases) {
  const expected = [...arr].sort((a, b) => a - b)[k - 1];
  const naive = kthSmallestNaive(arr, k);
  const basic = kthSmallestBasic(arr, k);
  const opt = kthSmallest(arr, k);
  const ok = naive === expected && basic === expected && opt === expected;
  console.log(
    `A=${JSON.stringify(arr)} k=${k} → expected=${expected} naive=${naive} basic=${basic} opt=${opt} ${ok ? "OK" : "MISMATCH!!"}`
  );
}

console.log("\n=== 3) 무작위 대량 교차 검증 (100회) ===");
let fail = 0;
for (let t = 0; t < 100; t++) {
  const n = 1 + Math.floor(Math.random() * 30);
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 41) - 20);
  const k = 1 + Math.floor(Math.random() * n);
  const expected = [...arr].sort((a, b) => a - b)[k - 1];
  const basic = kthSmallestBasic(arr, k);
  const opt = kthSmallest(arr, k);
  if (basic !== expected || opt !== expected) {
    fail++;
    console.log(`MISMATCH: A=${JSON.stringify(arr)} k=${k} expected=${expected} basic=${basic} opt=${opt}`);
  }
}
console.log(`무작위 검증 실패 건수: ${fail} / 100`);

console.log("\n=== 4) 결정적 피벗의 최악 케이스 관찰 (이미 정렬된 배열) ===");
function partitionSizesOnSorted(n: number): number[] {
  const A = Array.from({ length: n }, (_, i) => i); // 이미 오름차순 정렬
  const sizes: number[] = [];
  function partition(lo: number, hi: number): number {
    const pivot = A[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (A[j] <= pivot) {
        i++;
        [A[i], A[j]] = [A[j], A[i]];
      }
    }
    [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
    return i + 1;
  }
  function qs(lo: number, hi: number, target: number) {
    if (lo === hi) return;
    sizes.push(hi - lo + 1);
    const p = partition(lo, hi);
    if (p === target) return;
    if (p > target) qs(lo, p - 1, target);
    else qs(p + 1, hi, target);
  }
  qs(0, n - 1, 0); // target = 0(최솟값) → pivot(=최댓값)이 매번 p=hi가 되어 왼쪽으로만 1칸씩 축소
  return sizes;
}
console.log("n=8 정렬된 배열에서 target=최솟값일 때 구간 크기 추이:", partitionSizesOnSorted(8));
console.log("n=2000 정렬된 배열에서 총 partition 비교 횟수(대략 N+(N-1)+...): ", partitionSizesOnSorted(2000).reduce((a, b) => a + b, 0));

console.log("\n=== 5) 함정 시나리오 실측 ===");

// 함정 A: k를 그대로 target으로 써서 -1 변환을 빠뜨린 경우
function buggyForgotMinusOne(input: number[], k: number): number {
  const A = [...input];
  const target = k; // 버그: k - 1이어야 함
  function partition(lo: number, hi: number): number {
    const pivot = A[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (A[j] <= pivot) { i++; [A[i], A[j]] = [A[j], A[i]]; }
    }
    [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
    return i + 1;
  }
  function quickselect(lo: number, hi: number): number {
    if (lo === hi) return A[lo];
    const p = partition(lo, hi);
    if (p === target) return A[p];
    if (p > target) return quickselect(lo, p - 1);
    return quickselect(p + 1, hi);
  }
  return quickselect(0, A.length - 1);
}
{
  const arr = [3, 1, 4, 1, 5, 9, 2, 6];
  const k = 3;
  const correct = kthSmallestBasic(arr, k);
  const buggy = buggyForgotMinusOne(arr, k);
  console.log(`target=k-1 변환 누락: A=${JSON.stringify(arr)} k=${k} → 정상=${correct}, 버그(target=k)=${buggy}`);
}

// 함정 B: partition 루프를 j <= hi 로 잘못 써서 pivot이 자기 자신과도 비교되는 경우
// (전체 quickselect를 재귀 호출하면 p가 배열 범위를 벗어나 무한 재귀에 빠지므로,
//  1회 partition 호출의 결과만 정상 버전과 비교해 손상을 보인다.)
function partitionCorrect(A: number[], lo: number, hi: number): number {
  const pivot = A[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (A[j] <= pivot) { i++; [A[i], A[j]] = [A[j], A[i]]; }
  }
  [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
  return i + 1;
}
function partitionBuggy(A: number[], lo: number, hi: number): number {
  const pivot = A[hi];
  let i = lo - 1;
  for (let j = lo; j <= hi; j++) { // 버그: hi까지 포함(원래는 hi-1까지)
    if (A[j] <= pivot) { i++; [A[i], A[j]] = [A[j], A[i]]; }
  }
  [A[i + 1], A[hi]] = [A[hi], A[i + 1]];
  return i + 1;
}
{
  const arrCorrect = [3, 1, 4, 1, 5, 9, 2, 6];
  const arrBuggy = [3, 1, 4, 1, 5, 9, 2, 6];
  const pCorrect = partitionCorrect(arrCorrect, 0, 7);
  const pBuggy = partitionBuggy(arrBuggy, 0, 7);
  console.log(
    `partition 루프 j<=hi 오류: 정상 p=${pCorrect}(배열 범위 내), 버그 p=${pBuggy}(배열 길이=${arrBuggy.length}를 벗어난 인덱스 발생 가능)`
  );
  console.log(`  정상 결과 배열=${JSON.stringify(arrCorrect)}`);
  console.log(`  버그 결과 배열=${JSON.stringify(arrBuggy)} (길이 ${arrBuggy.length})`);
}

console.log("DONE_MARKER");
