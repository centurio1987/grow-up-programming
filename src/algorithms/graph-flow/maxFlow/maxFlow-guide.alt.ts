/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts maxFlow-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check maxFlow-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력으로 안 쓰는가
 *
 * 두 설계가 갈리는 축은 **한 라운드가 담는 증가 경로 수**다. 에드먼즈–카프는 경로 하나마다
 * BFS 를 다시 하고 디닉은 라운드마다 한 번만 하므로, 한 라운드에 경로가 여럿이면 그만큼
 * BFS 를 아끼고 하나뿐이면 아무것도 못 아낀다. 전개 입력은 정점 6 · 간선 7 이라 그 수를
 * 1 에서 수십까지 바꿀 자리가 없다.
 *
 * 그래서 **그 수를 그대로 매개변수로 갖는 그래프**를 쓴다. 소스에서 싱크까지의 경로 길이가
 * 1, 2, …, 20 으로 정확히 스무 가지인 계단을 세우고(정점 21 개), 길이가 같은 경로를 `w` 개씩
 * 둔다 — 길이가 짧은 것부터 하나씩 소진되므로 라운드는 언제나 20 이고, 한 라운드가 담는
 * 경로는 정확히 `w` 다. 난수가 없어 같은 `w` 면 언제나 같은 그래프다.
 *
 * ## 무엇을 세는가
 *
 * **배열·객체 칸을 읽거나 쓴 한 번, 그리고 비교 한 번**을 각각 기본 연산 하나로 센다.
 * 두 설계가 같은 자리에서 같은 규칙으로 센다.
 *
 * | 자리 | 센 값 |
 * | --- | --- |
 * | 배열 하나를 초기값으로 채운다 | 칸 수만큼 |
 * | 큐에 넣기 · 큐에서 꺼내기 | 각각 1 |
 * | 간선 하나를 본다 | 목록에서 꺼내기 1 + 잔여 용량 비교 1 + 레벨(방문) 읽기 1 = 3 |
 * | 레벨·방문·직전 간선을 적는다 | 칸마다 1 |
 * | 병목을 갱신한다 | 비교 1 |
 * | 유량을 흘린다 | 정방향 쓰기 1 + 짝 찾기 1 + 짝 쓰기 1 = 3 |
 *
 * 저장 칸은 두 설계가 각각 들고 있는 수의 개수다 — 잔여 그래프는 두 설계가 같은 것을 쓰므로
 * 간선 항목 `3 × 2E` 가 공통이고, 그 위에 디닉은 배열 둘(`level`·`iter`)로 `2V`,
 * 에드먼즈–카프는 방문 배열 `V` 와 직전 간선 배열 `2V` 로 `3V` 를 더 쓴다.
 */

import { maxFlow } from "./maxFlow-guide.ref.ts";

type Edge = [number, number, number];
interface Arc {
  to: number;
  cap: number;
  rev: number;
}

/** 계단의 층수. 이 값이 라운드 수를 그대로 정한다. */
const STEPS = 20;

/** 본문 표가 싣는 라운드당 경로 수 다섯. 첫째와 둘째 사이에서 기본 연산의 순서가 뒤집힌다. */
const WIDTHS = [1, 2, 3, 10, 40] as const;

/**
 * 계단 그래프. 정점 0 이 소스, 정점 `STEPS` 가 싱크, 그 사이가 한 줄로 이어진 중간 정점이다.
 * 소스에서 싱크로 가는 경로의 길이가 1, 2, …, `STEPS` 로 서로 다르고, 길이가 같은 경로는
 * 용량 1 짜리 평행 간선 `w` 개로 만든다.
 */
function graph(w: number): { n: number; edges: Edge[]; sink: number } {
  const edges: Edge[] = [];
  const wide = STEPS * w + 5;
  for (let j = 0; j < w; j++) edges.push([0, STEPS, 1]);
  edges.push([0, 1, wide]);
  for (let i = 1; i <= STEPS - 2; i++) edges.push([i, i + 1, wide]);
  for (let i = 1; i <= STEPS - 1; i++) {
    for (let j = 0; j < w; j++) edges.push([i, STEPS, 1]);
  }
  return { n: STEPS + 1, edges, sink: STEPS };
}

function build(n: number, edges: Edge[]): Arc[][] {
  const g: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, c] of edges) {
    const out = g[u] as Arc[];
    const back = g[v] as Arc[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as Arc).rev = iBack;
  }
  return g;
}

interface Counted {
  answer: number;
  ops: number;
  cells: number;
}

/** 이 가이드가 가르치는 절차 — 라운드마다 레벨을 매기고 차단 유량을 소진한다. */
function byDinic(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): Counted {
  const g = build(n, edges);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  let ops = 0;

  const bfs = (): void => {
    level.fill(-1);
    ops += n;
    level[source] = 0;
    ops += 1;
    const queue = [source];
    ops += 1;
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      ops += 1;
      for (const e of g[u] as Arc[]) {
        ops += 3;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
          ops += 2;
        }
      }
    }
  };

  const dfs = (u: number, pushed: number): number => {
    if (u === sink) return pushed;
    const list = g[u] as Arc[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as Arc;
      ops += 3;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        ops += 1;
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (g[e.to] as Arc[])[e.rev] as Arc;
          e.cap -= d;
          back.cap += d;
          ops += 3;
          return d;
        }
      }
    }
    return 0;
  };

  let total = 0;
  for (;;) {
    bfs();
    if ((level[sink] as number) === -1) break;
    iter.fill(0);
    ops += n;
    for (;;) {
      const f = dfs(source, Number.POSITIVE_INFINITY);
      if (f === 0) break;
      total += f;
    }
  }
  return { answer: total, ops, cells: 6 * edges.length + 2 * n };
}

/**
 * 경쟁 설계 — 에드먼즈–카프(Edmonds–Karp). 같은 잔여 그래프를 쓰되 **증가 경로 하나마다**
 * BFS 를 다시 해서 최단 경로를 찾고, 그 경로 하나에만 유량을 흘린다. 레벨을 재사용하지
 * 않으므로 라운드라는 것이 없고, 대신 BFS 횟수가 경로 수와 같다.
 */
function byEdmondsKarp(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): Counted {
  const g = build(n, edges);
  let ops = 0;
  let total = 0;

  for (;;) {
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const fromNode: number[] = Array.from({ length: n }, () => -1);
    const fromArc: number[] = Array.from({ length: n }, () => -1);
    ops += 3 * n;
    seen[source] = true;
    ops += 1;
    const queue = [source];
    ops += 1;
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      ops += 1;
      const list = g[u] as Arc[];
      for (let i = 0; i < list.length; i++) {
        const e = list[i] as Arc;
        ops += 3;
        if (e.cap > 0 && seen[e.to] !== true) {
          seen[e.to] = true;
          fromNode[e.to] = u;
          fromArc[e.to] = i;
          queue.push(e.to);
          ops += 4;
        }
      }
    }
    if (seen[sink] !== true) break;

    let bottleneck = Number.POSITIVE_INFINITY;
    for (let v = sink; v !== source; ) {
      const u = fromNode[v] as number;
      const e = (g[u] as Arc[])[fromArc[v] as number] as Arc;
      ops += 2;
      bottleneck = Math.min(bottleneck, e.cap);
      v = u;
    }
    for (let v = sink; v !== source; ) {
      const u = fromNode[v] as number;
      const e = (g[u] as Arc[])[fromArc[v] as number] as Arc;
      const back = (g[e.to] as Arc[])[e.rev] as Arc;
      e.cap -= bottleneck;
      back.cap += bottleneck;
      ops += 3;
      v = u;
    }
    total += bottleneck;
  }
  return { answer: total, ops, cells: 6 * edges.length + 3 * n };
}

/** 두 설계가 정본과 같은 답을 내는지 매번 확인한다. 안 같으면 대조가 아니라 다른 것을 잰 것이다. */
function measure(w: number): { dinic: Counted; ek: Counted } {
  const { n, edges, sink } = graph(w);
  const dinicCount = byDinic(n, edges, 0, sink);
  const ekCount = byEdmondsKarp(n, edges, 0, sink);
  const want = maxFlow(n, edges, 0, sink).flow;
  if (dinicCount.answer !== want || ekCount.answer !== want) {
    throw new Error(
      `두 설계의 답이 갈린다 — 디닉 ${dinicCount.answer} · 에드먼즈–카프 ${ekCount.answer} · 정본 ${want}`,
    );
  }
  return { dinic: dinicCount, ek: ekCount };
}

export const cases = {
  "라운드마다 레벨을 매기고 차단 유량을 소진한다": () => {
    const out: Record<string, number> = {};
    for (const w of WIDTHS)
      out[`라운드당 경로 ${w} 기본 연산`] = measure(w).dinic.ops;
    out["라운드당 경로 1 저장 칸"] = measure(1).dinic.cells;
    out["라운드당 경로 40 저장 칸"] = measure(40).dinic.cells;
    return out;
  },
  "증가 경로 하나마다 최단 경로를 다시 찾는다": () => {
    const out: Record<string, number> = {};
    for (const w of WIDTHS)
      out[`라운드당 경로 ${w} 기본 연산`] = measure(w).ek.ops;
    out["라운드당 경로 1 저장 칸"] = measure(1).ek.cells;
    out["라운드당 경로 40 저장 칸"] = measure(40).ek.cells;
    return out;
  },
};
