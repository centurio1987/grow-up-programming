// E3 자기검증 스크래치: 가이드 본문 코드를 그대로 옮겨 실행/검증한다.

// --- naive (가이드 "출발점" 절의 코드) ---
function prefixSumRangeQueryNaive(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  return queries.map(([l, r]) => {
    let s = 0;
    for (let i = l; i <= r; i++) s += A[i]; // 매 질의마다 구간을 처음부터 순회
    return s;
  });
}

// --- 아이디어를 코드로 옮기기 (가이드 "4단계" 코드) ---
function prefixSumRangeQuery(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const N = A.length;
  const P = new Array<number>(N + 1);
  P[0] = 0;
  for (let i = 0; i < N; i++) {
    P[i + 1] = P[i] + A[i]; // 누적합 전처리
  }

  const result: number[] = [];
  for (const [l, r] of queries) {
    result.push(P[r + 1] - P[l]); // 구간 합 O(1) 질의
  }
  return result;
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

// 1) 대표 예시 (가이드 시뮬레이션과 동일 입력)
{
  const A = [1, 3, 5, 7, 9];
  const P = [0, 1, 4, 9, 16, 25];
  const computedP = (() => {
    const N = A.length;
    const p = new Array<number>(N + 1);
    p[0] = 0;
    for (let i = 0; i < N; i++) p[i + 1] = p[i] + A[i];
    return p;
  })();
  assertEqual(computedP, P, "대표 예시 P 배열");

  const queries: Array<[number, number]> = [
    [1, 3],
    [0, 4],
  ];
  const out = prefixSumRangeQuery(A, queries);
  assertEqual(out, [15, 25], "대표 예시 result");
  assertEqual(prefixSumRangeQueryNaive(A, queries), [15, 25], "naive 대표 예시 result");
}

// 2) problem.md 예시 교차검증
{
  const out1 = prefixSumRangeQuery(
    [1, 2, 3, 4, 5],
    [
      [0, 4],
      [1, 3],
      [2, 2],
      [0, 0],
    ],
  );
  assertEqual(out1, [15, 9, 3, 1], "problem.md 예시1");

  const out2 = prefixSumRangeQuery(
    [-1, 2, -3, 4],
    [
      [0, 3],
      [1, 2],
    ],
  );
  assertEqual(out2, [2, -1], "problem.md 예시2 (음수 포함)");

  const out3 = prefixSumRangeQuery([1, 2, 3], []);
  assertEqual(out3, [], "problem.md 예시3 (질의 없음)");

  const out4 = prefixSumRangeQuery(
    [10, 20, 30],
    [
      [0, 0],
      [2, 2],
      [0, 2],
    ],
  );
  assertEqual(out4, [10, 30, 60], "problem.md 예시4");
}

// 3) 엣지 케이스
{
  assertEqual(prefixSumRangeQuery([42], [[0, 0]]), [42], "N=1 단일 원소");
  assertEqual(prefixSumRangeQuery([5, 5, 5], []), [], "질의 빈 배열");
  assertEqual(
    prefixSumRangeQuery([1, 3, 5, 7, 9], [[2, 2]]),
    [5],
    "l==r 단일 원소 구간",
  );
}

// 4) 함정 시나리오: N 크기로 P를 잘못 할당하면 r=N-1에서 범위를 벗어난다는 것을 수치로 확인
{
  const A = [1, 3, 5, 7, 9]; // N=5
  const N = A.length;
  const wrongP = new Array<number>(N); // 잘못된 크기(N), 정답은 N+1
  wrongP[0] = 0;
  for (let i = 0; i < N - 1; i++) wrongP[i + 1] = wrongP[i] + A[i]; // i+1 <= N-1까지만 채워짐
  const r = N - 1; // 마지막 질의 (0, N-1)
  const wrongAnswer = wrongP[r + 1]; // wrongP[5] → undefined (범위 밖)
  console.log(
    `FAIL 시나리오 확인: wrongP.length=${wrongP.length}, wrongP[${r + 1}]=${wrongAnswer} (기대값 25와 다름/undefined)`,
  );
}

// 5) 무작위 교차검증: naive vs 누적합
{
  let mismatches = 0;
  for (let t = 0; t < 200; t++) {
    const N = 1 + Math.floor(Math.random() * 20);
    const A = Array.from({ length: N }, () => Math.floor(Math.random() * 21) - 10);
    const Q = Math.floor(Math.random() * 10);
    const queries: Array<[number, number]> = Array.from({ length: Q }, () => {
      const l = Math.floor(Math.random() * N);
      const r = l + Math.floor(Math.random() * (N - l));
      return [l, r];
    });
    const a = prefixSumRangeQuery(A, queries);
    const b = prefixSumRangeQueryNaive(A, queries);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      mismatches++;
      console.error("MISMATCH", { A, queries, a, b });
    }
  }
  console.log(`무작위 교차검증 200회 완료, 불일치 ${mismatches}건`);
}
