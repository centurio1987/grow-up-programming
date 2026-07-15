// E3 자기검증용 스크래치. 가이드 본문에 싣는 두 함수(naive/최종)를 그대로 옮겨
// 실행 결과를 실측한다. 가이드 서사·시뮬 프레임은 이 실행 결과에 맞춘다.

function diffArrayRangeUpdateNaive(
  N: number,
  updates: Array<[number, number, number]>,
): number[] {
  const A = new Array<number>(N).fill(0);
  for (const [l, r, v] of updates) {
    for (let i = l; i <= r; i++) A[i] += v; // 구간을 매번 통째로 순회
  }
  return A;
}

function diffArrayRangeUpdate(
  N: number,
  updates: Array<[number, number, number]>,
): number[] {
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of updates) {
    D[l] += v;
    D[r + 1] -= v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += D[i];
    A[i] = running;
  }
  return A;
}

// 결함 재현용: D[r+1] -= v 를 "첫 번째 갱신에서만" 빠뜨렸을 때 어떻게 틀리는지 확인
function diffArrayRangeUpdateBuggy(
  N: number,
  updates: Array<[number, number, number]>,
): number[] {
  const D = new Array<number>(N + 1).fill(0);
  updates.forEach(([l, r, v], idx) => {
    D[l] += v;
    if (idx !== 0) D[r + 1] -= v; // 첫 갱신만 경계 이벤트 누락
  });
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += D[i];
    A[i] = running;
  }
  return A;
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  console.log(`${a === e ? "OK  " : "FAIL"} ${label}: got=${a} expected=${e}`);
}

console.log("=== 대표 트레이스: N=5, updates=[[1,3,2],[0,2,-1]] ===");
{
  const N = 5;
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [0, 2, -1],
  ];
  // 갱신 1개씩 적용하며 D 스냅샷
  const D = new Array<number>(N + 1).fill(0);
  console.log("초기 D:", D.slice());
  D[1] += 2;
  D[4] -= 2;
  console.log("갱신 (1,3,2) 후 D:", D.slice());
  D[0] += -1;
  D[3] -= -1;
  console.log("갱신 (0,2,-1) 후 D:", D.slice());

  const A: number[] = [];
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += D[i];
    A.push(running);
    console.log(`복원 i=${i}: running=${running}, A=[${A.join(", ")}]`);
  }

  const result = diffArrayRangeUpdate(N, updates);
  assertEqual("최종 함수 결과", result, A);
  assertEqual("대표 트레이스 최종값", result, [-1, 1, 1, 2, 0]);
}

console.log("\n=== naive vs 최적화 동치성 (대표 입력) ===");
{
  const N = 5;
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [0, 2, -1],
  ];
  assertEqual(
    "naive == diff array",
    diffArrayRangeUpdateNaive(N, updates),
    diffArrayRangeUpdate(N, updates),
  );
}

console.log("\n=== 엣지 케이스 ===");
assertEqual("N=5, updates=[] → 전부 0", diffArrayRangeUpdate(5, []), [0, 0, 0, 0, 0]);
assertEqual(
  "N=3, updates=[[1,1,5]] → 단일 원소",
  diffArrayRangeUpdate(3, [[1, 1, 5]]),
  [0, 5, 0],
);
assertEqual(
  "N=1, updates=[[0,0,10000]] → 경계 최대값, 크기 1",
  diffArrayRangeUpdate(1, [[0, 0, 10000]]),
  [10000],
);
assertEqual(
  "N=4, updates=[[0,3,5]] → 전체 구간(r=N-1)",
  diffArrayRangeUpdate(4, [[0, 3, 5]]),
  [5, 5, 5, 5],
);
assertEqual(
  "N=3, updates=[[0,2,3],[0,1,-1]] → 겹치는 구간",
  diffArrayRangeUpdate(3, [
    [0, 2, 3],
    [0, 1, -1],
  ]),
  [2, 2, 3],
);

console.log("\n=== problem.md 예시 교차검증 ===");
assertEqual(
  "diffArrayRangeUpdate(5, [[0,2,3]])",
  diffArrayRangeUpdate(5, [[0, 2, 3]]),
  [3, 3, 3, 0, 0],
);
assertEqual(
  "diffArrayRangeUpdate(5, [[0,2,3],[1,4,2],[2,2,-10]])",
  diffArrayRangeUpdate(5, [
    [0, 2, 3],
    [1, 4, 2],
    [2, 2, -10],
  ]),
  [3, 5, -5, 2, 2],
);
assertEqual("diffArrayRangeUpdate(3, [])", diffArrayRangeUpdate(3, []), [0, 0, 0]);
assertEqual(
  "diffArrayRangeUpdate(1, [[0,0,5]])",
  diffArrayRangeUpdate(1, [[0, 0, 5]]),
  [5],
);
assertEqual(
  "diffArrayRangeUpdate(4, [[0,3,5]])",
  diffArrayRangeUpdate(4, [[0, 3, 5]]),
  [5, 5, 5, 5],
);

console.log("\n=== 결함 시나리오: D[r+1] -= v 누락 (첫 갱신만) ===");
{
  const N = 5;
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [0, 2, -1],
  ];
  const buggy = diffArrayRangeUpdateBuggy(N, updates);
  const correct = diffArrayRangeUpdate(N, updates);
  console.log("올바른 결과:", correct);
  console.log("결함 결과  :", buggy);
  assertEqual("A[4] 결함값", buggy[4], 2);
  assertEqual("A[4] 올바른값", correct[4], 0);
}

console.log("\n=== 무작위 교차검증 (naive vs 최적화, 50회) ===");
{
  let allOk = true;
  for (let t = 0; t < 50; t++) {
    const N = 1 + Math.floor(Math.random() * 20);
    const Q = Math.floor(Math.random() * 10);
    const updates: Array<[number, number, number]> = [];
    for (let i = 0; i < Q; i++) {
      const l = Math.floor(Math.random() * N);
      const r = l + Math.floor(Math.random() * (N - l));
      const v = Math.floor(Math.random() * 21) - 10;
      updates.push([l, r, v]);
    }
    const a = diffArrayRangeUpdateNaive(N, updates);
    const b = diffArrayRangeUpdate(N, updates);
    const ok = JSON.stringify(a) === JSON.stringify(b);
    if (!ok) {
      allOk = false;
      console.log("MISMATCH", { N, updates, a, b });
    }
  }
  console.log(allOk ? "OK  무작위 50회 전부 일치" : "FAIL 무작위 검증 실패");
}

console.log("\n=== 대안 정의 대비: D[r] -= v (off-by-one) vs D[r+1] -= v ===");
{
  // 단일 갱신 (1,3,2)만 적용, N=5. 올바른 버전과 D[r]에 빼는 잘못된 버전을 비교.
  const N = 5;
  const correctD = new Array<number>(N + 1).fill(0);
  correctD[1] += 2;
  correctD[3 + 1] -= 2; // D[r+1]
  const wrongD = new Array<number>(N + 1).fill(0);
  wrongD[1] += 2;
  wrongD[3] -= 2; // D[r] (off-by-one 오답)

  function restore(D: number[], N: number): number[] {
    const A: number[] = [];
    let running = 0;
    for (let i = 0; i < N; i++) {
      running += D[i];
      A.push(running);
    }
    return A;
  }

  const correctA = restore(correctD, N);
  const wrongA = restore(wrongD, N);
  console.log("D[r+1] 버전 D:", correctD, "→ A:", correctA);
  console.log("D[r]   버전 D:", wrongD, "→ A:", wrongA);
  assertEqual("올바른 A (구간 끝 r=3 포함)", correctA, [0, 2, 2, 2, 0]);
  assertEqual("off-by-one A (r=3에서 값이 0으로 잘림)", wrongA, [0, 2, 2, 0, 0]);
}

console.log("\n=== 스스로 점검하기 문제1 검산: N=4, updates=[[0,1,3],[1,3,-2]] ===");
assertEqual(
  "손 계산 문제 정답",
  diffArrayRangeUpdate(4, [
    [0, 1, 3],
    [1, 3, -2],
  ]),
  [3, 1, -2, -2],
);

console.log("\n=== naive 비용 ascii art용 실측: 작은 예시 방문 횟수 ===");
{
  const N = 5;
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [0, 2, -1],
  ];
  let visits = 0;
  for (const [l, r] of updates) visits += r - l + 1;
  console.log(`총 naive 방문 칸 수 = ${visits} (업데이트별: ${updates.map(([l, r]) => r - l + 1).join(" + ")})`);
}
