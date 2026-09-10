/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.alt.ts
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)이 낸 매칭 크기를 두
 * 설계 모두와 대조한다.
 *
 * **전개 입력도 함께 낸다**(L20). 전개는 왼쪽 셋 · 오른쪽 셋 · 간선 넷이라 두 계수의 순서가
 * 갈리는 자리를 보이기에는 너무 작다. 그래서 왼쪽과 오른쪽을 200 개씩으로 못 박고 **간선
 * 수만** 바꾼 가족을 함께 쓰고, 전개 입력의 값도 표에 남긴다. 그 사실을 본문 대조 문단에도
 * 적는다.
 *
 * **입력은 생성식으로 고정한다.** 왼쪽·오른쪽 순서쌍을 `t -> (t × 7919) mod 40,000` 순서로
 * `E` 개 고른다. `7919` 와 `40,000` 이 서로소라 같은 순서쌍이 두 번 나오지 않는다. 한 번 정한
 * 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

import { maxBipartiteMatching } from "./maxBipartiteMatching-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. */
export const WALK_L = 3;
export const WALK_R = 3;
export const WALK_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
];

/** 대조에 쓰는 한쪽 정점 수. 간선 수만 바꾸려고 못 박는다. */
export const N = 200;

/** 간선을 가장 많이 둘 수 있는 수 — 순서쌍의 개수다. */
export const E_MAX = N * N;

/** 순서쌍 `t` 번째. `t -> (t × 7919) mod E_MAX` 가 자리 바꿈이라 겹치는 간선이 없다. */
function pairAt(t: number): Edge {
  const s = (t * 7919) % E_MAX;
  return [Math.floor(s / N), s % N];
}

/** 간선 `e` 개짜리 그래프. */
export function graph(e: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < e; i++) out.push(pairAt(i));
  return out;
}

/** 계단 — 왼쪽 `u` 가 오른쪽 `0` 부터 `u` 까지와 이어진다. */
export function stair(n: number): Edge[] {
  const out: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v <= u; v++) out.push([u, v]);
  return out;
}

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  size: number;
  ops: number;
  cells: number;
  /** 라운드 수 — 이 가이드의 절차에는 라운드가 없으므로 언제나 0 이다. */
  rounds: number;
}

/**
 * 이 가이드의 절차. 정본(`maxBipartiteMatching-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 **이웃 목록의 자리를 하나 읽은 것 · 방문 표에 한 칸 쓴 것 · 간선 목록에서
 * 간선 하나를 읽은 것**을 각각 하나로 센다. `저장 칸` 은 정점 수만큼 잡는 배열의 칸 수다 —
 * 이쪽은 짝 표와 방문 표 둘이라 `2R` 이다.
 */
export function 증대경로설계(left: number, right: number, edges: Edge[]): Run {
  let ops = 0;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) {
    ops++;
    (adj[u] as number[]).push(v);
  }
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);

  const augment = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      ops++;
      if (seen[v] === true) continue;
      seen[v] = true;
      if ((matchR[v] as number) === -1 || augment(matchR[v] as number)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  };

  let size = 0;
  for (let u = 0; u < left; u++) {
    seen.fill(false);
    ops += right;
    if (augment(u)) size++;
  }
  return { size, ops, cells: right * 2, rounds: 0 };
}

/**
 * 홉크로프트-카프. 라운드마다 너비 우선 탐색으로 층을 매기고, 그 층을 지키는 깊이 우선
 * 탐색으로 **길이가 가장 짧은 증대 경로를 한꺼번에** 뒤집는다.
 *
 * 같은 잣대로 센다 — 이웃 자리 읽기 · 층 표에 한 칸 쓰기 · 간선 목록 읽기. 층 표는 라운드
 * 마다 왼쪽 정점 수만큼 채우므로 `라운드 수 × L` 이 된다. `저장 칸` 은 짝 표 둘과 층 표
 * 하나라 `2L + R` 이다.
 */
export function 홉크로프트카프설계(
  left: number,
  right: number,
  edges: Edge[],
): Run {
  let ops = 0;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) {
    ops++;
    (adj[u] as number[]).push(v);
  }
  const matchL: number[] = Array.from({ length: left }, () => -1);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const dist: number[] = Array.from({ length: left }, () => -1);

  const bfs = (): boolean => {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      ops++;
      if (matchL[u] === -1) {
        dist[u] = 0;
        queue.push(u);
      } else dist[u] = -1;
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++] as number;
      for (const v of adj[u] as number[]) {
        ops++;
        const w = matchR[v] as number;
        if (w === -1) found = true;
        else if (dist[w] === -1) {
          dist[w] = (dist[u] as number) + 1;
          queue.push(w);
        }
      }
    }
    return found;
  };

  const dfs = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      ops++;
      const w = matchR[v] as number;
      if (w === -1 || (dist[w] === (dist[u] as number) + 1 && dfs(w))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = -1;
    return false;
  };

  let size = 0;
  let rounds = 0;
  while (bfs()) {
    rounds++;
    for (let u = 0; u < left; u++) {
      if (matchL[u] === -1 && dfs(u)) size++;
    }
  }
  return { size, ops, cells: left * 2 + right, rounds };
}

/* ────────────────────── 답이 같은지 먼저 확인한다 ────────────────────── */

const 확인_입력: [number, number, Edge[]][] = [
  [WALK_L, WALK_R, WALK_EDGES],
  [N, N, graph(200)],
  [N, N, graph(1_600)],
  [N, N, graph(19_500)],
  [N, N, graph(19_600)],
  [N, N, graph(24_400)],
  [N, N, stair(N)],
];

function 확인(): void {
  for (const [l, r, e] of 확인_입력) {
    const want = maxBipartiteMatching(l, r, e);
    if (증대경로설계(l, r, e).size !== want) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (홉크로프트카프설계(l, r, e).size !== want) {
      throw new Error("홉크로프트-카프가 정본과 다른 답을 낸다");
    }
  }
}
확인();

/* ────────────────────── 순서가 뒤집히는 자리 ────────────────────── */

/**
 * 간선 수를 100 칸씩 늘리며 **기본 연산의 순서가 뒤집히는 자리**를 찾는다.
 *
 * 이분 탐색을 안 쓴다 — 홉크로프트-카프의 라운드 수가 간선 수를 따라 단조롭게 안 움직여서
 * 순서가 한 번만 갈리지 않는다. 실제로 두 자리에서 갈리고, 그 둘을 다 낸다.
 */
export function crossings(): { at: number; before: number }[] {
  const out: { at: number; before: number }[] = [];
  let prev: boolean | null = null;
  for (let e = 200; e <= E_MAX; e += 100) {
    const g = graph(e);
    const cur = 증대경로설계(N, N, g).ops < 홉크로프트카프설계(N, N, g).ops;
    if (prev !== null && cur !== prev) out.push({ at: e, before: e - 100 });
    prev = cur;
  }
  if (out.length === 0) {
    throw new Error("간선 수를 끝까지 늘려도 순서가 안 뒤집힌다");
  }
  return out;
}

interface Crossing {
  at: number;
  before: number;
}

const CROSS = crossings();
if (CROSS.length < 2) throw new Error("뒤집히는 자리가 둘이 안 된다");
const 첫째 = CROSS[0] as Crossing;
const 둘째 = CROSS[1] as Crossing;

function 재기(
  run: (l: number, r: number, e: Edge[]) => Run,
): Record<string, number> {
  return {
    "전개 입력 · 기본 연산": run(WALK_L, WALK_R, WALK_EDGES).ops,
    [`간선 ${첫째.before} 개 · 기본 연산`]: run(N, N, graph(첫째.before)).ops,
    [`간선 ${첫째.at} 개 · 기본 연산`]: run(N, N, graph(첫째.at)).ops,
    [`간선 ${둘째.at} 개 · 기본 연산`]: run(N, N, graph(둘째.at)).ops,
    "계단 · 기본 연산": run(N, N, stair(N)).ops,
    "저장 칸": run(N, N, graph(첫째.at)).cells,
  };
}

const 증대경로 = 재기(증대경로설계);
const 홉크로프트카프 = 재기(홉크로프트카프설계);

export const cases = {
  "이 가이드의 절차": () => 증대경로,
  "홉크로프트-카프": () => 홉크로프트카프,
  경계: () => ({
    "홉크로프트-카프가 앞서는 마지막 간선 수": 첫째.before,
    "이 절차가 앞서는 첫 간선 수": 첫째.at,
    "다시 홉크로프트-카프가 앞서는 첫 간선 수": 둘째.at,
  }),
  "홉크로프트-카프의 라운드 수": () => ({
    [`간선 ${첫째.at} 개`]: 홉크로프트카프설계(N, N, graph(첫째.at)).rounds,
    [`간선 ${둘째.before} 개`]: 홉크로프트카프설계(N, N, graph(둘째.before)).rounds,
    [`간선 ${둘째.at} 개`]: 홉크로프트카프설계(N, N, graph(둘째.at)).rounds,
  }),
};
