/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.alt.ts
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)의 반환값을 두 설계
 * 모두와 대조한다.
 *
 * **전개 입력도 함께 낸다**(L20). 전개는 `n = 4` · `k = 3` 이라 두 계수의 순서가 갈리는
 * 자리를 보이기에는 너무 작다. 그래서 같은 생성식으로 `n` 만 늘린 가족을 함께 쓰고, 전개
 * 입력의 값도 표에 남긴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 배열은 `a[i] = (i * 7 % 5) + 1`, 비용은 구간 합의 제곱,
 * 계층 수는 `k = 3` 이다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

import { divideAndConquerDp, INF } from "./divideAndConquerDp-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 배열과 계층 수. */
export const WALK_A = [1, 2, 3, 4];
export const WALK_K = 3;

/** 계층 수. `n` 하나만 바꾸려고 고정한다. */
export const K = 3;

/** `a[i] = (i * 7 % 5) + 1` — 값이 1 부터 5 사이를 되풀이하는 배열. */
export function line(n: number): number[] {
  return Array.from({ length: n }, (_, i) => ((i * 7) % 5) + 1);
}

/** `cost[i][j] = (a[i] + … + a[j])^2`. 사각 부등식을 만족하는 전형 예시다. */
export function buildCost(a: number[]): number[][] {
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

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  ops: number;
  cells: number;
  answer: number;
}

/**
 * 이 가이드의 절차. 정본(`divideAndConquerDp-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 분할점 후보 하나를 넣어 값을 만들고 견준 한 번과 `solve` 를 한 번 부른 것을
 * 각각 하나로 센다(빈 범위로 곧장 반환하는 호출도 센다). `저장 칸` 은 이전 계층 배열과 이번
 * 계층 배열, 그리고 재귀가 가장 깊었을 때의 호출 틀 수를 더한 것이다.
 */
function 분할정복설계(cost: number[][], k: number): Run {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;

  let ops = 0;
  let peak = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);

    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): void => {
      ops++;
      peak = Math.max(peak, depth);
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        ops++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      solve(mid + 1, hi, bestOpt, optHi, depth + 1);
    };

    solve(0, n - 1, 0, n - 2, 1);
    prev = cur;
  }

  return { ops, cells: 2 * n + peak, answer: prev[n - 1] as number };
}

/**
 * 경쟁 설계 — **후보 범위를 안 좁히고 분할점을 전부 검사한다.** 단조성을 쓰지 않으므로
 * 사각 부등식이 성립하지 않는 비용 행렬에서도 최솟값을 놓치지 않는다.
 *
 * `기본 연산` 은 후보 하나를 검사한 한 번과 칸 하나를 처리하려고 바깥 반복에 들어간 한 번을
 * 각각 하나로 센다. `저장 칸` 은 두 계층 배열이고 재귀가 없어 호출 틀이 없다.
 */
function 완전탐색설계(cost: number[][], k: number): Run {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;

  let ops = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    for (let i = 0; i < n; i++) {
      ops++;
      for (let j = 0; j < i; j++) {
        ops++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) cur[i] = val;
      }
    }
    prev = cur;
  }

  return { ops, cells: 2 * n, answer: prev[n - 1] as number };
}

/* ────────────────────────── 대조 ────────────────────────── */

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number[], number][] = [
    [WALK_A, WALK_K],
    [line(4), K],
    [line(8), K],
    [line(9), K],
    [line(16), K],
    [line(500), K],
  ];
  for (const [a, k] of inputs) {
    const cost = buildCost(a);
    const want = divideAndConquerDp(cost, k);
    const x = 분할정복설계(cost, k);
    const y = 완전탐색설계(cost, k);
    if (x.answer !== want) {
      throw new Error(
        `세는 사본이 정본과 다른 답을 낸다 — ${x.answer} vs ${want}`,
      );
    }
    if (y.answer !== want) {
      throw new Error(
        `경쟁 설계가 정본과 다른 답을 낸다 — ${y.answer} vs ${want}`,
      );
    }
  }
}
확인();

/**
 * `n` 을 늘려 가며 순서가 뒤집히는 자리를 찾는다.
 *
 * `last` 는 완전 탐색 쪽 계수가 아직 적은 마지막 거점 수이고, `first` 는 분할 정복 쪽이
 * 처음으로 적어지는 거점 수다. 둘이 이어져 있지 않으면 경계를 한 자리로 말할 수 없으므로
 * 그때는 던진다.
 */
export function crossing(): { last: number; first: number } {
  let last = -1;
  for (let n = K; n <= 400; n++) {
    const cost = buildCost(line(n));
    const a = 분할정복설계(cost, K).ops;
    const b = 완전탐색설계(cost, K).ops;
    if (a < b) {
      if (last < 0) {
        throw new Error(`n = ${n} 부터 이미 분할 정복이 앞선다 — 경계가 없다`);
      }
      if (n !== last + 1) {
        throw new Error(
          `경계가 이어져 있지 않다 — ${last} 다음이 ${n} 이 아니다`,
        );
      }
      return { last, first: n };
    }
    last = n;
  }
  throw new Error(
    "n 을 400 까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다",
  );
}

const CROSS = crossing();

function 재기(
  run: (cost: number[][], k: number) => Run,
): Record<string, number> {
  const walk = run(buildCost(WALK_A), WALK_K);
  const before = run(buildCost(line(CROSS.last)), K);
  const after = run(buildCost(line(CROSS.first)), K);
  const big = run(buildCost(line(500)), K);
  return {
    "전개 입력 · 기본 연산": walk.ops,
    [`거점 ${CROSS.last} 개 · 기본 연산`]: before.ops,
    [`거점 ${CROSS.first} 개 · 기본 연산`]: after.ops,
    "거점 500 개 · 기본 연산": big.ops,
    "거점 500 개 · 저장 칸": big.cells,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(분할정복설계),
  "후보 범위를 안 좁히는 설계": () => 재기(완전탐색설계),
  경계: () => ({
    "완전 탐색이 앞서는 마지막 거점 수": CROSS.last,
    "분할 정복이 앞서는 첫 거점 수": CROSS.first,
  }),
};
