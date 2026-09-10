/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/dp/tspBitmask/tspBitmask-guide.alt.ts
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)의 반환값을 두 설계
 * 모두와 대조한다.
 *
 * **입력은 생성식으로 고정한다.** 전개 입력(도시 넷)과, 격자 위의 점을 잇는 행렬, 그리고
 * 모든 거리가 같은 행렬 셋이다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지
 * 않는다(L20).
 *
 * **전개 입력만으로는 대조가 안 된다**(L20). 도시가 넷이면 두 설계의 계수가 100 언저리라
 * 순서가 갈리는 자리를 보일 수 없다. 그래서 같은 생성식으로 도시 수만 늘린 가족을 함께
 * 쓰고, 전개 입력의 값도 표 첫 줄에 남긴다. 그 사실을 본문 대조 문단에도 적는다.
 */

import { INF, tspBitmask } from "./tspBitmask-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 거리 행렬. */
export const WALK: number[][] = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

/**
 * 격자 위의 점 `n` 개를 잇는 행렬.
 *
 * 점 `i` 의 좌표는 `(i mod w, ⌊i / w⌋)` 이고 `w = ⌈√n⌉` 이다. 거리는 두 점 사이의 직선
 * 거리를 100 배 해서 반올림한 값이다.
 */
export function grid(n: number): number[][] {
  const w = Math.ceil(Math.sqrt(n));
  const pts = Array.from({ length: n }, (_, i) => [i % w, Math.floor(i / w)]);
  return pts.map((p) =>
    pts.map((q) =>
      Math.round(
        100 *
          Math.hypot(
            (p[0] as number) - (q[0] as number),
            (p[1] as number) - (q[1] as number),
          ),
      ),
    ),
  );
}

/** 대각선만 0 이고 나머지가 전부 1 인 행렬. 어떤 투어든 값이 `n` 이다. */
export function flat(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 1)),
  );
}

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  ops: number;
  cells: number;
  answer: number;
}

/**
 * 이 가이드의 절차. 정본(`tspBitmask-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 상태 `(mask, v)` 하나를 살펴본 한 번과 다음 도시 후보 `u` 하나를 살펴본
 * 한 번, 그리고 마지막에 복귀 비용을 더해 본 한 번을 각각 하나로 센다. `저장 칸` 은 상태
 * 표가 잡는 `2^n · n` 칸이다.
 */
function 상태표설계(dist: number[][]): Run {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array((FULL + 1) * n).fill(INF);
  dp[1 * n + 0] = 0;
  let ops = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      ops++;
      if ((mask & (1 << v)) === 0) continue;
      const cur = dp[mask * n + v] as number;
      if (cur === INF) continue;
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        ops++;
        if ((mask & (1 << u)) !== 0) continue;
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        if (cand < (dp[at] as number)) dp[at] = cand;
      }
    }
  }
  let answer = INF;
  for (let last = 0; last < n; last++) {
    ops++;
    const back = dist[last] as number[];
    const cand = (dp[FULL * n + last] as number) + (back[0] as number);
    if (cand < answer) answer = cand;
  }
  return { ops, cells: (FULL + 1) * n, answer };
}

/**
 * 경쟁 설계 — **분기 한정**. 순열을 깊이 우선으로 만들되 하한으로 가지를 자른다.
 *
 * 하한은 「지금까지 쌓은 비용 + 아직 안 간 도시마다 가장 작은 출발 간선」이고, 그 값이 이미
 * 찾아 둔 최선보다 작지 않으면 그 가지를 버린다. 첫 최선은 가까운 도시부터 고르는 탐욕
 * 투어에서 얻는다 — 난수를 쓰지 않으므로 계수가 실행마다 같다.
 *
 * `기본 연산` 은 다음 도시 후보 하나를 살펴본 한 번을 센다. 하한을 만드는 준비(도시마다
 * 가장 작은 출발 간선 찾기)와 첫 최선을 얻는 탐욕 투어도 같은 자로 센다. `저장 칸` 은
 * 방문 표 · 최소 간선 표 · 가장 깊을 때의 호출 틀 셋이라 `3n` 이다.
 */
function 분기한정설계(dist: number[][]): Run {
  const n = dist.length;
  let ops = 0;
  const minOut = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) {
    const row = dist[i] as number[];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      ops++;
      if ((row[j] as number) < (minOut[i] as number))
        minOut[i] = row[j] as number;
    }
  }
  if (n === 1) return { ops: ops + 1, cells: 3 * n, answer: 0 };

  const visited = new Array<boolean>(n).fill(false);
  let best = INF;
  {
    // 첫 상한 — 가까운 도시부터 고르는 탐욕 투어.
    let at = 0;
    let cost = 0;
    visited[0] = true;
    for (let step = 1; step < n; step++) {
      let pick = -1;
      const row = dist[at] as number[];
      for (let u = 0; u < n; u++) {
        if (visited[u] === true) continue;
        ops++;
        if (pick < 0 || (row[u] as number) < (row[pick] as number)) pick = u;
      }
      visited[pick as number] = true;
      cost += row[pick as number] as number;
      at = pick as number;
    }
    best = cost + ((dist[at] as number[])[0] as number);
    visited.fill(false);
  }

  visited[0] = true;
  let remainMin = 0;
  for (let i = 1; i < n; i++) remainMin += minOut[i] as number;

  const go = (
    at: number,
    depth: number,
    cost: number,
    remain: number,
  ): void => {
    if (depth === n) {
      const back = cost + ((dist[at] as number[])[0] as number);
      if (back < best) best = back;
      return;
    }
    const row = dist[at] as number[];
    for (let u = 1; u < n; u++) {
      ops++;
      if (visited[u] === true) continue;
      const nextCost = cost + (row[u] as number);
      const nextRemain = remain - (minOut[u] as number);
      if (nextCost + nextRemain >= best) continue;
      visited[u] = true;
      go(u, depth + 1, nextCost, nextRemain);
      visited[u] = false;
    }
  };
  go(0, 1, 0, remainMin);
  return { ops, cells: 3 * n, answer: best };
}

/* ────────────────────────── 대조 ────────────────────────── */

const 입력: [string, number[][]][] = [
  ["전개 입력", WALK],
  ["격자 좌표 도시 12", grid(12)],
  ["격자 좌표 도시 20", grid(20)],
  ["모든 거리가 같은 도시 12", flat(12)],
];

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  for (const [label, dist] of 입력) {
    const want = tspBitmask(dist);
    const a = 상태표설계(dist);
    const b = 분기한정설계(dist);
    if (a.answer !== want) {
      throw new Error(`${label} — 세는 사본이 정본과 다른 답을 낸다`);
    }
    if (b.answer !== want) {
      throw new Error(`${label} — 경쟁 설계가 정본과 다른 답을 낸다`);
    }
  }
}
확인();

/**
 * 모든 거리가 같은 행렬에서 도시 수를 늘려 가며 순서가 뒤집히는 자리를 찾는다.
 *
 * `last` 는 분기 한정 쪽 계수가 아직 적은 마지막 도시 수이고, `first` 는 상태 표 쪽이
 * 처음으로 적어지는 도시 수다. 둘이 이어져 있지 않으면 경계를 한 자리로 말할 수 없으므로
 * 그때는 던진다.
 */
export function crossing(): { last: number; first: number } {
  let last = -1;
  for (let n = 3; n <= 10; n++) {
    const dist = flat(n);
    const a = 상태표설계(dist).ops;
    const b = 분기한정설계(dist).ops;
    if (a < b) {
      if (last < 0) {
        throw new Error(`도시 ${n} 개부터 이미 상태 표가 앞선다 — 경계가 없다`);
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
    "도시 10 개까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다",
  );
}

const CROSS = crossing();

function 재기(run: (dist: number[][]) => Run): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [label, dist] of 입력) {
    out[`${label} · 기본 연산`] = run(dist).ops;
  }
  out["격자 좌표 도시 20 · 저장 칸"] = run(grid(20)).cells;
  return out;
}

export const cases = {
  "상태 표": () => 재기(상태표설계),
  "분기 한정": () => 재기(분기한정설계),
  경계: () => ({
    "모든 거리가 같은 행렬에서 분기 한정이 앞서는 마지막 도시 수": CROSS.last,
    "상태 표가 앞서는 첫 도시 수": CROSS.first,
  }),
};
