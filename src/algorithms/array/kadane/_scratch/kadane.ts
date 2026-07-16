// E3 자기 검증용 스크래치: 가이드 본문 코드(naive / dp 배열 / 롤링 최적화)를 그대로 추출해 실행 확인한다.
// 가이드: kadane-guide.new.mdx 의 "출발점"(naive) / "아이디어를 코드로 옮기기"(dp 배열) /
// "최적화 코드"(롤링 변수) 절과 1:1 대응.

// ---- 출발점: naive (모든 시작점 i, 끝점 j) ----
function kadaneNaive(A: number[]): number {
  let best = A[0]!;
  for (let i = 0; i < A.length; i++) {
    let s = 0;
    for (let j = i; j < A.length; j++) {
      s += A[j]!;
      best = Math.max(best, s);
    }
  }
  return best;
}

// ---- 아이디어를 코드로 옮기기: dp 배열 버전 (O(N) 시간, O(N) 공간) ----
function kadaneDpArray(A: number[]): number {
  const n = A.length;
  const dp = new Array<number>(n);
  dp[0] = A[0]!;
  for (let i = 1; i < n; i++) {
    dp[i] = Math.max(A[i]!, dp[i - 1]! + A[i]!);
  }
  let best = dp[0]!;
  for (let i = 1; i < n; i++) {
    best = Math.max(best, dp[i]!);
  }
  return best;
}

// ---- 최적화 코드: 롤링 변수 버전 (O(N) 시간, O(1) 공간) ----
function kadane(A: number[]): number {
  let prev = A[0]!;
  let best = A[0]!;
  for (let i = 1; i < A.length; i++) {
    prev = Math.max(A[i]!, prev + A[i]!);
    best = Math.max(best, prev);
  }
  return best;
}

// ---- 검증 ----
function assertEqual(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: got ${actual}, expected ${expected}`);
  }
  console.log(`OK ${label}: ${actual}`);
}

// 대표 예시 (가이드 시뮬레이션·본문 트레이스에 쓰는 고정 입력)
const A_MAIN = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
assertEqual("main naive", kadaneNaive(A_MAIN), 6);
assertEqual("main dpArray", kadaneDpArray(A_MAIN), 6);
assertEqual("main rolling", kadane(A_MAIN), 6);

// dp 배열 전체 트레이스 출력 (본문 수치와 대조)
{
  const n = A_MAIN.length;
  const dp = new Array<number>(n);
  dp[0] = A_MAIN[0]!;
  for (let i = 1; i < n; i++) dp[i] = Math.max(A_MAIN[i]!, dp[i - 1]! + A_MAIN[i]!);
  console.log("dp array trace:", dp);
}

// 롤링 변수 프레임별 (prev, best) 트레이스 — 시뮬 steps와 대조
{
  let prev = A_MAIN[0]!;
  let best = A_MAIN[0]!;
  const frames: Array<{ i: number; prev: number; best: number }> = [
    { i: 0, prev, best },
  ];
  for (let i = 1; i < A_MAIN.length; i++) {
    prev = Math.max(A_MAIN[i]!, prev + A_MAIN[i]!);
    best = Math.max(best, prev);
    frames.push({ i, prev, best });
  }
  console.log("rolling frames:", frames);
}

// 엣지케이스
assertEqual("all negative naive", kadaneNaive([-3, -1, -2]), -1);
assertEqual("all negative dpArray", kadaneDpArray([-3, -1, -2]), -1);
assertEqual("all negative rolling", kadane([-3, -1, -2]), -1);

assertEqual("single element naive", kadaneNaive([1]), 1);
assertEqual("single element rolling", kadane([1]), 1);
assertEqual("single negative rolling", kadane([-7]), -7);

assertEqual("zeros naive", kadaneNaive([0, 0, 0]), 0);
assertEqual("zeros rolling", kadane([0, 0, 0]), 0);

assertEqual("boundary rolling", kadane([-10000, 10000, -10000]), 10000);

assertEqual("all positive rolling", kadane([1, 2, 3, 4, 5]), 15);
assertEqual("mixed rolling", kadane([5, -3, 5]), 7);
assertEqual("zero best rolling", kadane([-1, 0, -2]), 0);

// 함정 시나리오 실측: best를 prev보다 먼저 갱신하면 어떻게 틀리는가
function kadaneBuggyOrder(A: number[]): number {
  let prev = A[0]!;
  let best = A[0]!;
  for (let i = 1; i < A.length; i++) {
    best = Math.max(best, prev); // 버그: prev 갱신 전에 best부터 갱신
    prev = Math.max(A[i]!, prev + A[i]!);
  }
  return best;
}
{
  // 최댓값이 "마지막 인덱스"에서만 만들어지는 배열을 골라야 버그가 드러난다.
  // (중간에서 이미 최댓값이 나오면 순서를 바꿔도 우연히 같은 답이 나올 수 있다.)
  const A_TRAP = [-1, -1, 5];
  const correct = kadane(A_TRAP);
  const buggy = kadaneBuggyOrder(A_TRAP);
  console.log(`trap array ${JSON.stringify(A_TRAP)} — 정상 순서: ${correct}, best-먼저 순서(버그): ${buggy}`);
  assertEqual("trap array correct order", correct, 5);
  if (buggy === correct) throw new Error("버그 시나리오가 우연히 정답과 같습니다 - 다른 예시 필요");
  assertEqual("trap array buggy order", buggy, -1);
}

// 함정 시나리오 실측: best를 0으로 초기화하면 모두 음수 배열에서 오답
function kadaneBuggyInit(A: number[]): number {
  let prev = A[0]!;
  let best = 0; // 버그: 0으로 초기화
  for (let i = 1; i < A.length; i++) {
    prev = Math.max(A[i]!, prev + A[i]!);
    best = Math.max(best, prev);
  }
  return best;
}
{
  const buggy = kadaneBuggyInit([-3, -1, -2]);
  console.log("buggy init on all-negative (기대 -1, 실제):", buggy);
  if (buggy === -1) throw new Error("버그 시나리오가 우연히 정답과 같습니다");
}

// 무작위 교차검증: naive vs dpArray vs rolling
{
  function randArr(n: number): number[] {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
  }
  for (let t = 0; t < 200; t++) {
    const n = 1 + Math.floor(Math.random() * 12);
    const arr = randArr(n);
    const r1 = kadaneNaive(arr);
    const r2 = kadaneDpArray(arr);
    const r3 = kadane(arr);
    if (r1 !== r2 || r2 !== r3) {
      throw new Error(
        `MISMATCH on ${JSON.stringify(arr)}: naive=${r1} dpArray=${r2} rolling=${r3}`,
      );
    }
  }
  console.log("OK random cross-check (200 cases, naive == dpArray == rolling)");
}

console.log("ALL CHECKS PASSED");
