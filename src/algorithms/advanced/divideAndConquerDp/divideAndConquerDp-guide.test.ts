/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`divideAndConquerDp-guide.ref.ts`)에 다시 건다. 벽시계를 재는 케이스(`n = 200` 을 500ms
 * 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 규모를 **후보 검사
 * 횟수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { divideAndConquerDp, INF } from "./divideAndConquerDp-guide.ref.ts";

/** `cost[i][j] = (a[i] + … + a[j])^2` — 사각 부등식을 만족하는 전형 예시. */
function buildCost(a: number[]): number[][] {
  const n = a.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (a[i] as number);
  const cost: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) {
    const row = cost[i] as number[];
    for (let j = i; j < n; j++) {
      const s = (prefix[j + 1] as number) - (prefix[i] as number);
      row[j] = s * s;
    }
  }
  return cost;
}

/** 후보 범위를 안 좁히고 전부 검사하는 설계. 답의 기준으로만 쓴다. */
function fullScan(cost: number[][], k: number): number {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) cur[i] = val;
      }
    }
    prev = cur;
  }
  return prev[n - 1] as number;
}

const CASES: [string, number[], number, number][] = [
  ["k=1 — 전체 한 구간으로 묶는다", [1, 2, 3, 4], 1, 100],
  ["k=n — 각 원소가 한 구간이면 합이 sum(a[i]^2)", [1, 2, 3, 4], 4, 30],
  ["k=2 분할 — [1,2,3] + [4] 가 최적이다", [1, 2, 3, 4], 2, 52],
  ["n=1, k=1 → cost[0][0]", [7], 1, 49],
  ["균등 분할이 최적인 경우", [2, 2, 2, 2], 2, 32],
  ["k=2, n=2 강제 분할", [3, 5], 2, 34],
  ["k=3, 값이 모두 같은 배열 다섯 칸", [1, 1, 1, 1, 1], 3, 9],
  ["n=3, k=3 — 모두 단일 구간", [5, 10, 15], 3, 350],
  ["n=3, k=1 — 한 구간", [5, 10, 15], 1, 900],
  ["본문 전개가 쓰는 고정 입력", [1, 2, 3, 4], 3, 34],
];

for (const [name, a, k, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(divideAndConquerDp(buildCost(a), k)).toBe(want);
  });
}

test("거점 하나짜리 비용 행렬을 그대로 돌려준다", () => {
  expect(divideAndConquerDp([[7]], 1)).toBe(7);
});

test("문제 설명의 예시 행렬", () => {
  const c = [
    [0, 2, 5],
    [0, 0, 3],
    [0, 0, 0],
  ];
  expect(divideAndConquerDp(c, 1)).toBe(5);
  expect(divideAndConquerDp(c, 3)).toBe(0);
  expect(divideAndConquerDp(c, 2)).toBe(2);
});

test("비용이 전부 0 이면 답도 0 이다", () => {
  const c = Array.from({ length: 5 }, () => new Array<number>(5).fill(0));
  expect(divideAndConquerDp(c, 3)).toBe(0);
});

test("구역 수보다 거점이 적으면 만들 수 없는 칸이 INF 로 남는다", () => {
  // 거점 둘을 세 구역으로 나눌 수 없다.
  expect(divideAndConquerDp(buildCost([1, 2]), 2)).toBe(5);
  expect(divideAndConquerDp(buildCost([1, 2, 3]), 3)).toBe(14);
});

test("거점 200 개 · 구역 20 개에서 전부 검사한 답과 같다", () => {
  const a = Array.from({ length: 200 }, (_, i) => ((i * 13) % 7) + 1);
  const cost = buildCost(a);
  expect(divideAndConquerDp(cost, 20)).toBe(fullScan(cost, 20));
});

test("값이 모두 같은 배열 · 앞이 큰 배열에서도 전부 검사한 답과 같다", () => {
  const flat = new Array<number>(120).fill(1);
  const head = Array.from({ length: 120 }, (_, i) => (i === 0 ? 1000 : 1));
  for (const a of [flat, head]) {
    const cost = buildCost(a);
    for (const k of [1, 2, 5, 17]) {
      expect(divideAndConquerDp(cost, k)).toBe(fullScan(cost, k));
    }
  }
});
