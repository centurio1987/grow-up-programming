/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 계수 규칙**으로 두 설계를 재고 **결정론적 계수**만 낸다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.alt.ts
 *
 * **계수 규칙을 두 설계에 똑같이 건다.**
 *
 * | 무엇 | 어떻게 세는가 |
 * | --- | --- |
 * | 기본 연산 | 간선 하나를 읽고 값을 견준 한 번 + 담는 자리에서 항목 하나를 넣거나 꺼내거나 옮기거나 견준 한 번 |
 * | 저장 칸 | 거리 배열 `V` 칸 + 담는 자리가 가장 커졌을 때의 칸 수. 덱 항목은 정점 번호 한 칸이고 힙 항목은 정점 번호와 키 두 칸이다 |
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 여섯 · 간선 여섯이라 저장
 * 칸이 9 대 12 로 갈리는데, 그래프를 키울 자리가 없어 우열이 뒤집히는 자리를 만들 수 없다.
 * 전개 입력의 값도 함께 내고(`전개 입력 · 기본 연산`), 뒤집히는 자리를 보이는 데는 아래
 * `lateShortcut` 을 쓴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지
 * 않는다(L20).
 *
 * **두 설계가 매 실행마다 정본과 같은 답을 내는지 먼저 본다**(`확인()`). 답이 다른 구현으로
 * 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 */

import { type Edge, zeroOneBfs } from "./zeroOneBfs-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여섯. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 2, 0],
  [2, 1, 0],
  [2, 3, 1],
  [1, 3, 1],
  [3, 4, 0],
];

/** 격자 한 변의 칸 수. 정점 `K²` 개, 간선 `2K(K−1)` 개다. */
export const K = 32;

export function grid(k: number): { n: number; edges: Edge[] } {
  const id = (i: number, j: number): number => i * k + j;
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (j + 1 < k) {
        edges.push([id(i, j), id(i, j + 1), (i + j) % 3 === 0 ? 0 : 1]);
      }
      if (i + 1 < k) {
        edges.push([id(i, j), id(i + 1, j), (i * 2 + j) % 3 === 0 ? 0 : 1]);
      }
    }
  }
  return { n: k * k, edges };
}

/**
 * 늦은 지름길 — 가중치 1 사슬 `a₁ … a_m` 과 가중치 0 사슬 `b₁ … b_m` 을 나란히 두고
 * `bᵢ → aᵢ` 를 가중치 0 으로 잇는다. `aᵢ` 는 1 로 적혔다가 0 으로 고쳐지므로 덱에 두 번
 * 들어가고, 그 옛 항목이 덱 뒤에 쌓인다. 정점 `2m + 1` 개, 간선 `3m` 개.
 */
export function lateShortcut(m: number): { n: number; edges: Edge[] } {
  const a = (i: number): number => i;
  const b = (i: number): number => m + i;
  const edges: Edge[] = [[0, a(1), 1]];
  for (let i = 1; i < m; i++) edges.push([a(i), a(i + 1), 1]);
  edges.push([0, b(1), 0]);
  for (let i = 1; i < m; i++) edges.push([b(i), b(i + 1), 0]);
  for (let i = 1; i <= m; i++) edges.push([b(i), a(i), 0]);
  return { n: 2 * m + 1, edges };
}

/* ────────────────────────── 두 설계 ────────────────────────── */

interface Counted {
  dist: number[];
  ops: number;
  cells: number;
  /** 담는 자리(덱 또는 힙)에 항목을 넣은 횟수. 저장 칸이 갈리는 까닭을 이 값이 짚는다. */
  pushes: number;
}

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

const answer = (dist: number[]): number[] =>
  dist.map((d) => (d === Number.POSITIVE_INFINITY ? -1 : d));

/**
 * 이 가이드의 절차 — 덱. 정본(`zeroOneBfs-guide.ref.ts`)과 같은 절차이고 세는 자리만 덧붙였다.
 * 덱은 배열 두 개로 만들었으므로 원소를 옮기는 자리가 `front` 가 비었을 때의 뒤집기뿐이다.
 */
function 덱(n: number, edges: Edge[], source: number): Counted {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  const front: number[] = [];
  const back: number[] = [source];
  let ops = 1;
  let peak = 1;
  let pushes = 1;
  while (front.length + back.length > 0) {
    if (front.length === 0) {
      while (back.length > 0) {
        front.push(back.pop() as number);
        ops++;
      }
    }
    const u = front.pop() as number;
    ops++;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops++;
      const nd = (dist[u] as number) + w;
      if (nd >= (dist[v] as number)) continue;
      dist[v] = nd;
      ops++;
      pushes++;
      if (w === 0) front.push(v);
      else back.push(v);
      peak = Math.max(peak, front.length + back.length);
    }
  }
  return { dist: answer(dist), ops, cells: n + peak, pushes };
}

/**
 * 경쟁 설계 — **이진 힙 다익스트라**. 정점과 그때 적힌 거리를 짝으로 담고 키가 가장 작은
 * 항목부터 꺼낸다. 가중치가 0 이거나 1 이라는 것을 쓰지 않으므로 **임의의 음이 아닌
 * 가중치**에 그대로 걸리고, 그 대신 항목을 꺼낼 때마다 힙 높이만큼 키를 견준다.
 */
function 힙다익스트라(n: number, edges: Edge[], source: number): Counted {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  const items: [number, number][] = [[source, 0]];
  let ops = 1;
  let peak = 1;
  let pushes = 1;
  const key = (i: number): number => (items[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number];
    items[a] = items[b] as [number, number];
    items[b] = t;
    ops++;
  };
  while (items.length > 0) {
    peak = Math.max(peak, items.length);
    const top = items[0] as [number, number];
    const last = items.pop() as [number, number];
    ops++;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < items.length) {
          ops++;
          if (key(left) < key(small)) small = left;
        }
        if (right < items.length) {
          ops++;
          if (key(right) < key(small)) small = right;
        }
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    const [u, d] = top;
    if (d > (dist[u] as number)) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops++;
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        items.push([v, nd]);
        ops++;
        pushes++;
        let i = items.length - 1;
        while (i > 0) {
          const parent = (i - 1) >> 1;
          ops++;
          if (key(i) >= key(parent)) break;
          swap(i, parent);
          i = parent;
        }
      }
    }
  }
  // 힙 항목 하나가 정점 번호와 키 두 칸이다.
  return { dist: answer(dist), ops, cells: n + 2 * peak, pushes };
}

/* ────────────────────────── 계수 ────────────────────────── */

/**
 * 늦은 지름길의 `m` 을 늘려 가며 **저장 칸의 순서가 처음 뒤집히는 자리**를 찾는다.
 * 덱은 옛 항목을 뒤에 쌓는 만큼 `m` 에 비례해 커지고, 힙은 같은 그래프에서 그 옛 항목을
 * 거의 만들지 않아 크기가 멈춘다.
 */
export function flipPoint(): number {
  for (let m = 1; m <= 4096; m++) {
    const g = lateShortcut(m);
    if (덱(g.n, g.edges, 0).cells > 힙다익스트라(g.n, g.edges, 0).cells) {
      return m;
    }
  }
  return -1;
}

const FLIP = flipPoint();
if (FLIP < 2) {
  throw new Error(
    "늦은 지름길을 4,096 까지 늘려도 저장 칸의 순서가 안 뒤집힌다 — 대조가 성립하지 않는다",
  );
}

const SHAPES: [string, { n: number; edges: Edge[] }][] = [
  ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
  [`격자 ${K}×${K}`, grid(K)],
  [`늦은 지름길 m=${FLIP - 1}`, lateShortcut(FLIP - 1)],
  [`늦은 지름길 m=${FLIP}`, lateShortcut(FLIP)],
  ["늦은 지름길 m=64", lateShortcut(64)],
];

/** 두 설계가 **정본과 같은 답**을 내는지부터 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  for (const [label, g] of SHAPES) {
    const want = JSON.stringify(zeroOneBfs(g.n, g.edges, 0));
    for (const [name, run] of [
      ["덱", 덱],
      ["힙 다익스트라", 힙다익스트라],
    ] as [string, (n: number, e: Edge[], s: number) => Counted][]) {
      const got = JSON.stringify(run(g.n, g.edges, 0).dist);
      if (got !== want) {
        throw new Error(
          `${name} 이 ${label} 에서 정본과 다른 답을 냈다 — ${got} vs ${want}`,
        );
      }
    }
  }
}
확인();

function 재기(
  run: (n: number, e: Edge[], s: number) => Counted,
): Record<string, number> {
  const at = (index: number): Counted => {
    const g = (SHAPES[index] as [string, { n: number; edges: Edge[] }])[1];
    return run(g.n, g.edges, 0);
  };
  return {
    "전개 입력 · 기본 연산": at(0).ops,
    "전개 입력 · 저장 칸": at(0).cells,
    [`격자 ${K}×${K} · 기본 연산`]: at(1).ops,
    [`격자 ${K}×${K} · 저장 칸`]: at(1).cells,
    [`늦은 지름길 m=${FLIP - 1} · 저장 칸`]: at(2).cells,
    [`늦은 지름길 m=${FLIP} · 저장 칸`]: at(3).cells,
    "늦은 지름길 m=64 · 기본 연산": at(4).ops,
    "늦은 지름길 m=64 · 저장 칸": at(4).cells,
    "늦은 지름길 m=64 · 담는 자리에 넣은 항목": at(4).pushes,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(덱),
  "힙 다익스트라": () => 재기(힙다익스트라),
  경계: () => ({ "저장 칸의 순서가 뒤집히는 m": FLIP }),
};
