/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/maxFlow/maxFlow-guide.md
 *
 * **계수를 세는 사본이 넷 있다**(`countedDinic`·`countedFf`·`countedEk`·`countedNoCancel`).
 * 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이
 * 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「유량」 칸은 전부 정본이나
 * 정본에서 기계로 만든 변이가 낸 값이고, 사본은 횟수만 낸다.
 *
 * `countedDinic` 만 정본과 같은 절차이고 나머지 셋은 **다른 절차**다(임의 경로 · 경로마다
 * 최단 경로 · 취소 없이). 그 셋은 정본을 흉내 내는 사본이 아니라 견주는 상대다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { maxFlow } from "./maxFlow-guide.ref.ts";

type Edge = [number, number, number];
interface Arc {
  to: number;
  cap: number;
  rev: number;
  back: boolean;
}

/* ────────────────────────── 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. 정점 6 · 간선 7 · 소스 0 · 싱크 5. */
const WALK_N = 6;
const WALK: Edge[] = [
  [0, 1, 4],
  [1, 2, 2],
  [2, 5, 2],
  [0, 3, 3],
  [3, 2, 4],
  [1, 4, 5],
  [4, 5, 3],
];

/** 정점 넷짜리 다리 그래프. 취소를 못 하면 답이 갈리는 가장 작은 입력이다. */
const BRIDGE_N = 4;
const BRIDGE: Edge[] = [
  [0, 1, 1],
  [0, 2, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 3, 1],
];

/** 문제 지문의 예시. 정점 4 · 간선 5 · 답 5. */
const SAMPLE_N = 4;
const SAMPLE: Edge[] = [
  [0, 1, 3],
  [0, 2, 2],
  [1, 2, 1],
  [1, 3, 2],
  [2, 3, 3],
];

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1,867,256` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

function build(n: number, edges: Edge[]): Arc[][] {
  const g: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, c] of edges) {
    const out = g[u] as Arc[];
    const back = g[v] as Arc[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0, back: false });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut, back: true });
    (out[iOut] as Arc).rev = iBack;
  }
  return g;
}

interface RoundTrace {
  level: number[];
  paths: { path: number[]; add: number; usedBack: number }[];
  looks: number;
  bfsLooks: number;
}

/**
 * 정본과 같은 절차. **세는 것과 `iter` 를 언제 초기화하는지만** 다르다.
 *
 * `iterMode` 는 「멈춤」 절이 쓰는 세 갈래다 — `round` 가 정본, `call` 은 DFS 호출마다 0 으로
 * 두는 것, `never` 는 한 번도 안 두는 것이다. `never` 는 반복이 끝나지 않으므로 `roundCap` 으로
 * 자른다.
 */
function countedDinic(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
  opt: { iterMode?: "round" | "call" | "never"; roundCap?: number } = {},
): {
  flow: number;
  looks: number;
  bfsLooks: number;
  rounds: RoundTrace[];
  capped: boolean;
} {
  const iterMode = opt.iterMode ?? "round";
  const roundCap = opt.roundCap ?? 1_000_000;
  const g = build(n, edges);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  const rounds: RoundTrace[] = [];
  let looks = 0;
  let bfsLooks = 0;
  let capped = false;

  const bfs = (): void => {
    level.fill(-1);
    level[source] = 0;
    const queue = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of g[u] as Arc[]) {
        looks++;
        bfsLooks++;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  };

  let curPath: number[] = [];
  let curBack = 0;
  const dfs = (u: number, pushed: number): number => {
    if (u === sink) return pushed;
    if (iterMode === "call") iter[u] = 0;
    const list = g[u] as Arc[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      looks++;
      const e = list[iter[u] as number] as Arc;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (g[e.to] as Arc[])[e.rev] as Arc;
          e.cap -= d;
          back.cap += d;
          curPath.unshift(e.to);
          if (e.back) curBack++;
          return d;
        }
      }
    }
    return 0;
  };

  let flow = 0;
  for (let round = 0; ; round++) {
    if (round >= roundCap) {
      capped = true;
      break;
    }
    const before = looks;
    const beforeBfs = bfsLooks;
    bfs();
    const snapshot = level.slice();
    const bfsHere = bfsLooks - beforeBfs;
    if ((level[sink] as number) === -1) {
      rounds.push({
        level: snapshot,
        paths: [],
        looks: looks - before,
        bfsLooks: bfsHere,
      });
      break;
    }
    if (iterMode !== "never") iter.fill(0);
    const paths: RoundTrace["paths"] = [];
    for (;;) {
      curPath = [];
      curBack = 0;
      const f = dfs(source, Number.POSITIVE_INFINITY);
      if (f === 0) break;
      flow += f;
      paths.push({ path: [source, ...curPath], add: f, usedBack: curBack });
    }
    rounds.push({
      level: snapshot,
      paths,
      looks: looks - before,
      bfsLooks: bfsHere,
    });
  }
  return { flow, looks, bfsLooks, rounds, capped };
}

/**
 * 경로를 **아무거나** 고르는 방식(포드–풀커슨). 방문 표시를 두고 깊이 우선으로 첫 번째로
 * 찾은 경로에 병목만큼 보낸다. `cancel` 이 거짓이면 역방향 잔여 용량을 안 늘린다 — 한 번
 * 보낸 유량을 되돌릴 수 없는 방식이다.
 */
function countedFf(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
  opt: { cancel?: boolean } = {},
): { flow: number; looks: number; paths: number } {
  const cancel = opt.cancel ?? true;
  const g = build(n, edges);
  let looks = 0;
  let paths = 0;
  const dfs = (u: number, pushed: number, seen: boolean[]): number => {
    if (u === sink) return pushed;
    seen[u] = true;
    for (const e of g[u] as Arc[]) {
      looks++;
      if (e.cap > 0 && seen[e.to] !== true) {
        const d = dfs(e.to, Math.min(pushed, e.cap), seen);
        if (d > 0) {
          e.cap -= d;
          if (cancel) ((g[e.to] as Arc[])[e.rev] as Arc).cap += d;
          return d;
        }
      }
    }
    return 0;
  };
  let flow = 0;
  for (;;) {
    const f = dfs(
      source,
      Number.POSITIVE_INFINITY,
      Array.from({ length: n }, () => false),
    );
    if (f === 0) break;
    flow += f;
    paths++;
  }
  return { flow, looks, paths };
}

/** 증가 경로 **하나마다** BFS 로 최단 경로를 다시 찾는 방식(에드먼즈–카프). */
function countedEk(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): { flow: number; looks: number; bfsCount: number; paths: number } {
  const g = build(n, edges);
  let looks = 0;
  let bfsCount = 0;
  let paths = 0;
  let flow = 0;
  for (;;) {
    bfsCount++;
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const fromNode: number[] = Array.from({ length: n }, () => -1);
    const fromArc: number[] = Array.from({ length: n }, () => -1);
    seen[source] = true;
    const queue = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      const list = g[u] as Arc[];
      for (let i = 0; i < list.length; i++) {
        looks++;
        const e = list[i] as Arc;
        if (e.cap > 0 && seen[e.to] !== true) {
          seen[e.to] = true;
          fromNode[e.to] = u;
          fromArc[e.to] = i;
          queue.push(e.to);
        }
      }
    }
    if (seen[sink] !== true) break;
    let bottleneck = Number.POSITIVE_INFINITY;
    for (let v = sink; v !== source; ) {
      const u = fromNode[v] as number;
      const e = (g[u] as Arc[])[fromArc[v] as number] as Arc;
      bottleneck = Math.min(bottleneck, e.cap);
      v = u;
    }
    for (let v = sink; v !== source; ) {
      const u = fromNode[v] as number;
      const e = (g[u] as Arc[])[fromArc[v] as number] as Arc;
      const back = (g[e.to] as Arc[])[e.rev] as Arc;
      e.cap -= bottleneck;
      back.cap += bottleneck;
      v = u;
    }
    flow += bottleneck;
    paths++;
  }
  return { flow, looks, bfsCount, paths };
}

/** 취소를 못 하는 방식 — 위 사본을 `cancel: false` 로 부른 것에 이름만 붙였다. */
const countedNoCancel = (n: number, edges: Edge[], s: number, t: number) =>
  countedFf(n, edges, s, t, { cancel: false });

/**
 * 레벨 조건을 느슨하게 바꾼 사본 — **재귀가 지나는 정점 자취를 뽑으려고** 둔다.
 *
 * 기계로 만든 변이(`looseLevel`)는 값을 안 돌려주고 `RangeError` 로 끝나므로, 어느 정점을
 * 되풀이하는지는 그 변이에서 못 꺼낸다. 그래서 같은 조건으로 바꾼 사본에 깊이 상한과 자취
 * 기록만 덧붙였다. **「끝나지 않는다」를 판정하는 것은 이 사본이 아니라 변이다.**
 */
function looseTrace(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
  depthCap: number,
): number[] {
  const g = build(n, edges);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  const stack: number[] = [];
  const bfs = (): void => {
    level.fill(-1);
    level[source] = 0;
    const queue = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of g[u] as Arc[]) {
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  };
  class TooDeep extends Error {}
  const dfs = (u: number, pushed: number): number => {
    stack.push(u);
    if (stack.length > depthCap) throw new TooDeep();
    if (u === sink) {
      stack.pop();
      return pushed;
    }
    const list = g[u] as Arc[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as Arc;
      if (e.cap > 0 && (level[e.to] as number) !== -1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (g[e.to] as Arc[])[e.rev] as Arc;
          e.cap -= d;
          back.cap += d;
          stack.pop();
          return d;
        }
      }
    }
    stack.pop();
    return 0;
  };
  try {
    for (;;) {
      bfs();
      if ((level[sink] as number) === -1) return [];
      iter.fill(0);
      for (;;) {
        const f = dfs(source, Number.POSITIVE_INFINITY);
        if (f === 0) break;
      }
    }
  } catch (error) {
    if (error instanceof TooDeep) return stack.slice(-12);
    throw error;
  }
}

/* ────────────────────────── 그래프 생성식 ────────────────────────── */

/**
 * 계단 그래프 — 소스에서 싱크로 가는 경로의 길이가 1, 2, …, `m` 으로 정확히 하나씩이다.
 * 정점 0 이 소스, 정점 `m` 이 싱크, 1…`m-1` 이 한 줄로 이어진 중간 정점이다.
 * `extraBack` 은 번호가 큰 중간 정점에서 작은 쪽으로 가는 간선이다 — 더 짧은 경로를 만들지
 * 않으므로 라운드 수를 안 바꾸고, BFS 가 매 라운드 읽기만 한다.
 */
function stair(
  m: number,
  extraBack = 0,
): { n: number; edges: Edge[]; sink: number } {
  const edges: Edge[] = [];
  edges.push([0, m, 1]);
  edges.push([0, 1, m]);
  for (let i = 1; i <= m - 2; i++) edges.push([i, i + 1, m]);
  for (let i = 1; i <= m - 1; i++) edges.push([i, m, 1]);
  let added = 0;
  outer: for (let j = m - 1; j >= 2; j--) {
    for (let i = 1; i < j; i++) {
      if (added >= extraBack) break outer;
      edges.push([j, i, 1]);
      added++;
    }
  }
  return { n: m + 1, edges, sink: m };
}

/**
 * 부채꼴 그래프 — 소스에서 정점 1 로 한 번 모였다가 `k` 가닥으로 나뉘어 각각 싱크로 간다.
 * 가닥마다 용량 1 이라 최대 유량도 `k`, 증가 경로도 `k` 개이고 전부 같은 라운드에 있다.
 */
function branch(k: number): { n: number; edges: Edge[]; sink: number } {
  const n = k + 3;
  const edges: Edge[] = [[0, 1, k]];
  for (let i = 0; i < k; i++) edges.push([1, 2 + i, 1]);
  for (let i = 0; i < k; i++) edges.push([2 + i, n - 1, 1]);
  return { n, edges, sink: n - 1 };
}

/** 격자 네트워크 — 문제의 성능 케이스와 같은 모양이다. */
function grid(
  W: number,
  H: number,
): { n: number; edges: Edge[]; sink: number } {
  const at = (r: number, c: number): number => r * W + c + 2;
  const edges: Edge[] = [];
  for (let r = 0; r < H; r++) {
    edges.push([0, at(r, 0), 100]);
    edges.push([at(r, W - 1), 1, 100]);
  }
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W - 1; c++) edges.push([at(r, c), at(r, c + 1), 10]);
  }
  for (let r = 0; r < H - 1; r++) {
    for (let c = 0; c < W; c++) {
      edges.push([at(r, c), at(r + 1, c), 5]);
      edges.push([at(r + 1, c), at(r, c), 5]);
    }
  }
  return { n: H * W + 2, edges, sink: 1 };
}

/** 다리를 사이에 둔 정점 넷 그래프. 간선 목록의 순서만 두 가지로 만든다. */
const bridgeLate = (c: number): Edge[] => [
  [0, 1, c],
  [1, 3, c],
  [0, 2, c],
  [2, 3, c],
  [1, 2, 1],
];
const bridgeEarly = (c: number): Edge[] => [
  [0, 1, c],
  [0, 2, c],
  [1, 2, 1],
  [1, 3, c],
  [2, 3, c],
];

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 짝지은 역방향 잔여 용량을 **안 늘리는** 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const noBackflow = await loadMutant<{
  maxFlow(n: number, edges: Edge[], s: number, t: number): { flow: number };
}>(new URL("./maxFlow-guide.ref.ts", import.meta.url).pathname, {
  drop: /back\.cap \+= d/,
});

/** DFS 의 레벨 조건을 「레벨이 있기만 하면」으로 느슨하게 바꾼 사본. */
const looseLevel = await loadMutant<{
  maxFlow(n: number, edges: Edge[], s: number, t: number): { flow: number };
}>(new URL("./maxFlow-guide.ref.ts", import.meta.url).pathname, {
  swap: [
    /\(level\[e\.to\] as number\) === \(level\[u\] as number\) \+ 1/,
    "(level[e.to] as number) !== -1",
  ],
});

const BACK_CASES: { label: string; n: number; edges: Edge[]; sink: number }[] =
  [
    { label: "전개 입력", n: WALK_N, edges: WALK, sink: 5 },
    { label: "다리 그래프", n: BRIDGE_N, edges: BRIDGE, sink: 3 },
    { label: "문제 지문의 예시", n: SAMPLE_N, edges: SAMPLE, sink: 3 },
    { label: "격자 20 × 10", ...grid(20, 10) },
  ];

const backRows = BACK_CASES.map((c) => ({
  label: c.label,
  ok: maxFlow(c.n, c.edges, 0, c.sink).flow,
  ng: noBackflow.maxFlow(c.n, c.edges, 0, c.sink).flow,
}));

// 하나도 안 갈리면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (backRows.every((r) => r.ok === r.ng)) {
  throw new Error(
    "변이가 어느 입력에서도 유량을 바꾸지 못했다 — 「역방향을 안 늘리면 답이 작아진다」가 거짓이다",
  );
}

/** 재귀가 끝나지 않는 것을 값 자리에 적기 위한 표기. */
function runOrFail(fn: () => number): string {
  try {
    return String(fn());
  } catch (error) {
    return error instanceof RangeError
      ? "재귀가 끝나지 않는다"
      : `예외 ${String(error)}`;
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 유량을 전수로 배정해 보는 방법의 가짓수 — 수치 반박의 근거. */
  "brute-force-scale": () =>
    table(
      [
        ["간선 E", "용량 상한 c", "유량 배정의 가짓수", "자릿수"],
        ...(
          [
            [2, 3],
            [5, 10],
            [100, 1_000],
            [10_000, 1_000_000],
          ] as [number, number][]
        ).map(([e, c]) => {
          const total = (BigInt(c) + 1n) ** BigInt(e);
          const text = total.toString();
          return [
            comma(e),
            comma(c),
            text.length <= 12
              ? comma(Number(total))
              : `${comma(c + 1)}^${comma(e)}`,
            comma(text.length),
          ];
        }),
      ],
      [0, 1, 2, 3],
    ).join("\n"),

  /** 한 번 보낸 유량을 되돌릴 수 있는가로 답이 갈린다. */
  "cancel-values": () => {
    const rows: string[][] = [
      ["입력", "취소를 못 한다", "취소를 허용한다", "정본"],
    ];
    for (const c of [
      { label: "다리 그래프", n: BRIDGE_N, edges: BRIDGE, sink: 3 },
      { label: "전개 입력", n: WALK_N, edges: WALK, sink: 5 },
      { label: "문제 지문의 예시", n: SAMPLE_N, edges: SAMPLE, sink: 3 },
    ]) {
      rows.push([
        c.label,
        String(countedNoCancel(c.n, c.edges, 0, c.sink).flow),
        String(countedFf(c.n, c.edges, 0, c.sink).flow),
        String(maxFlow(c.n, c.edges, 0, c.sink).flow),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 같은 그래프에서 간선 순서와 용량을 각각 바꿔 경로 수를 센다. */
  "edge-order-values": () => {
    const rows: string[][] = [
      [
        "용량 c",
        "다리를 나중에 본다",
        "간선 검사",
        "다리를 먼저 본다",
        "간선 검사",
        "유량",
      ],
    ];
    for (const c of [1, 4, 100, 1_000_000]) {
      const late = countedFf(4, bridgeLate(c), 0, 3);
      const early = countedFf(4, bridgeEarly(c), 0, 3);
      rows.push([
        comma(c),
        `경로 ${late.paths} 개`,
        comma(late.looks),
        `경로 ${early.paths} 개`,
        comma(early.looks),
        comma(maxFlow(4, bridgeEarly(c), 0, 3).flow),
      ]);
    }
    return table(rows, [0, 2, 4, 5]).join("\n");
  },

  /** 경로를 고르는 규칙 셋을 같은 입력들에 걸어 간선 검사 횟수를 나란히 센다. */
  "three-rules": () => {
    const cases: { label: string; n: number; edges: Edge[]; sink: number }[] = [
      { label: "전개 입력 (V=6 · E=7)", n: WALK_N, edges: WALK, sink: 5 },
      { label: "격자 (V=202 · E=570)", ...grid(20, 10) },
      { label: "계단 (V=51 · E=99)", ...stair(50) },
      { label: "부채꼴 128 (V=131 · E=257)", ...branch(128) },
    ];
    const rows: string[][] = [
      ["입력", "임의 경로", "최단 경로 하나씩", "레벨을 재사용한다", "유량"],
    ];
    for (const c of cases) {
      const ff = countedFf(c.n, c.edges, 0, c.sink);
      const ek = countedEk(c.n, c.edges, 0, c.sink);
      const dn = countedDinic(c.n, c.edges, 0, c.sink);
      rows.push([
        c.label,
        comma(ff.looks),
        comma(ek.looks),
        comma(dn.looks),
        comma(maxFlow(c.n, c.edges, 0, c.sink).flow),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 같은 모양에서 가닥만 늘렸을 때 세 규칙이 각각 몇 배가 되는가. */
  "branch-scale": () => {
    const rows: string[][] = [
      [
        "부채꼴 가닥",
        "정점 V",
        "간선 E",
        "임의 경로",
        "최단 경로 하나씩",
        "레벨을 재사용한다",
      ],
    ];
    const first: number[] = [];
    for (const k of [4, 16, 64, 128]) {
      const c = branch(k);
      const ff = countedFf(c.n, c.edges, 0, c.sink).looks;
      const ek = countedEk(c.n, c.edges, 0, c.sink).looks;
      const dn = countedDinic(c.n, c.edges, 0, c.sink).looks;
      if (first.length === 0) first.push(ff, ek, dn);
      rows.push([
        comma(k),
        comma(c.n),
        comma(c.edges.length),
        comma(ff),
        comma(ek),
        comma(dn),
      ]);
    }
    const last = rows[rows.length - 1] as string[];
    rows.push([
      "4 → 128 배수",
      "",
      "",
      ...[3, 4, 5].map((i) => {
        const now = Number((last[i] as string).replaceAll(",", ""));
        return `${Math.round(now / (first[i - 3] as number))} 배`;
      }),
    ]);
    return table(rows, [0, 1, 2, 3, 4, 5]).join("\n");
  },

  /** BFS 를 몇 번 하는가 — 위 표의 차이가 어디서 오는지. */
  "bfs-counts": () => {
    const cases: { label: string; n: number; edges: Edge[]; sink: number }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK, sink: 5 },
      { label: "격자", ...grid(20, 10) },
      { label: "계단", ...stair(50) },
      { label: "부채꼴 128", ...branch(128) },
    ];
    const rows: string[][] = [
      [
        "입력",
        "증가 경로 수",
        "최단 경로 하나씩의 BFS",
        "레벨을 재사용한 라운드",
      ],
    ];
    for (const c of cases) {
      const ek = countedEk(c.n, c.edges, 0, c.sink);
      const dn = countedDinic(c.n, c.edges, 0, c.sink);
      rows.push([
        c.label,
        comma(ek.paths),
        comma(ek.bfsCount),
        comma(dn.rounds.length),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 전개 입력의 라운드별 레벨과 경로. */
  "walk-rounds": () => {
    const run = countedDinic(WALK_N, WALK, 0, 5);
    const rows: string[][] = [
      ["라운드", "level", "흘린 경로", "병목", "역방향 간선"],
    ];
    for (const [i, r] of run.rounds.entries()) {
      if (r.paths.length === 0) {
        rows.push([String(i + 1), `[${r.level.join(", ")}]`, "없다", "—", "—"]);
        continue;
      }
      for (const [j, p] of r.paths.entries()) {
        rows.push([
          j === 0 ? String(i + 1) : "",
          j === 0 ? `[${r.level.join(", ")}]` : "",
          p.path.join(" → "),
          String(p.add),
          p.usedBack > 0 ? `${p.usedBack} 개 지난다` : "안 지난다",
        ]);
      }
    }
    return table(rows, [0, 3]).join("\n");
  },

  /** 전개 입력의 라운드별 간선 검사 횟수. */
  "walk-cost": () => {
    const run = countedDinic(WALK_N, WALK, 0, 5);
    const rows: string[][] = [
      ["라운드", "단계", "간선 검사", "그중 BFS", "그중 DFS", "흘린 경로 수"],
    ];
    const labels = ["T2 · T3 · T4 · T5", "T6 · T7 · T8", "T9"];
    for (const [i, r] of run.rounds.entries()) {
      rows.push([
        String(i + 1),
        labels[i] ?? "",
        comma(r.looks),
        comma(r.bfsLooks),
        comma(r.looks - r.bfsLooks),
        String(r.paths.length),
      ]);
    }
    rows.push([
      "합",
      "",
      comma(run.looks),
      comma(run.bfsLooks),
      comma(run.looks - run.bfsLooks),
      String(run.rounds.reduce((s, r) => s + r.paths.length, 0)),
    ]);
    return table(rows, [2, 3, 4, 5]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number }[] = [
      {
        call: "maxFlow(6, [[0,1,4],[1,2,2],[2,5,2],[0,3,3],[3,2,4],[1,4,5],[4,5,3]], 0, 5)",
        run: () => maxFlow(WALK_N, WALK, 0, 5).flow,
      },
      {
        call: "maxFlow(4, [[0,1,3],[0,2,2],[1,2,1],[1,3,2],[2,3,3]], 0, 3)",
        run: () => maxFlow(SAMPLE_N, SAMPLE, 0, 3).flow,
      },
      {
        call: "maxFlow(4, [[0,1,1],[0,2,1],[1,2,1],[1,3,1],[2,3,1]], 0, 3)",
        run: () => maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow,
      },
      { call: "maxFlow(2, [], 0, 1)", run: () => maxFlow(2, [], 0, 1).flow },
      {
        call: "maxFlow(3, [[0,1,5]], 0, 2)",
        run: () => maxFlow(3, [[0, 1, 5]], 0, 2).flow,
      },
      {
        call: "maxFlow(2, [[0,1,5],[0,1,7]], 0, 1)",
        run: () =>
          maxFlow(
            2,
            [
              [0, 1, 5],
              [0, 1, 7],
            ],
            0,
            1,
          ).flow,
      },
      {
        call: "maxFlow(2, [[0,0,100],[0,1,5]], 0, 1)",
        run: () =>
          maxFlow(
            2,
            [
              [0, 0, 100],
              [0, 1, 5],
            ],
            0,
            1,
          ).flow,
      },
      {
        call: "maxFlow(3, [[0,1,1000000],[1,2,1000000]], 0, 2)",
        run: () =>
          maxFlow(
            3,
            [
              [0, 1, 1_000_000],
              [1, 2, 1_000_000],
            ],
            0,
            2,
          ).flow,
      },
    ];
    return table(
      cases.map((c) => [c.call, "→", `{ flow: ${comma(c.run())} }`]),
    ).join("\n");
  },

  /** `iter` 를 언제 0 으로 초기화하는가로 갈리는 것. */
  "iter-three": () => {
    const round = countedDinic(WALK_N, WALK, 0, 5, { iterMode: "round" });
    const call = countedDinic(WALK_N, WALK, 0, 5, { iterMode: "call" });
    const never = countedDinic(WALK_N, WALK, 0, 5, {
      iterMode: "never",
      roundCap: 20,
    });
    return table(
      [
        ["`iter` 를 초기화하는 때", "유량", "간선 검사", "BFS 횟수"],
        [
          "라운드가 바뀔 때만",
          String(round.flow),
          comma(round.looks),
          String(round.rounds.length),
        ],
        [
          "DFS 를 부를 때마다",
          String(call.flow),
          comma(call.looks),
          String(call.rounds.length),
        ],
        [
          "한 번도 안 한다",
          String(never.flow),
          comma(never.looks),
          never.capped ? "20 에서 잘랐다" : String(never.rounds.length),
        ],
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 레벨 조건을 느슨하게 바꾼 변이. */
  "loose-level": () =>
    table(
      [
        ["입력", "정본", "레벨이 있기만 하면 내려간다"],
        [
          "문제 지문의 예시",
          String(maxFlow(SAMPLE_N, SAMPLE, 0, 3).flow),
          runOrFail(() => looseLevel.maxFlow(SAMPLE_N, SAMPLE, 0, 3).flow),
        ],
        [
          "다리 그래프",
          String(maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow),
          runOrFail(() => looseLevel.maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow),
        ],
        [
          "전개 입력",
          String(maxFlow(WALK_N, WALK, 0, 5).flow),
          runOrFail(() => looseLevel.maxFlow(WALK_N, WALK, 0, 5).flow),
        ],
      ],
      [1],
    ).join("\n"),

  /** 레벨 조건을 뺐을 때 재귀가 되풀이하는 정점 자취. */
  "loose-cycle": () => {
    const tail = looseTrace(WALK_N, WALK, 0, 5, 400);
    if (tail.length === 0)
      throw new Error("깊이 상한에 안 걸렸다 — 「끝나지 않는다」가 거짓이다");
    return table([
      ["재귀가 되풀이하는 자취", `… → ${tail.join(" → ")} → …`],
      ["되풀이하는 마디", `${tail.slice(0, 4).join(" → ")} → ${tail[0]}`],
      ["깊이 상한", "400 에서 잘랐다"],
    ]).join("\n");
  },

  /** 역방향 잔여 용량을 안 늘리는 변이. */
  "mutant-backflow": () =>
    table(
      [
        ["입력", "정본", "역방향을 안 늘린다"],
        ...backRows.map((r) => [r.label, comma(r.ok), comma(r.ng)]),
      ],
      [1, 2],
    ).join("\n"),

  /** 마지막 BFS 가 도달한 정점 집합과 그 경계 간선의 용량 합. */
  "min-cut": () => {
    const run = countedDinic(WALK_N, WALK, 0, 5);
    const last = run.rounds[run.rounds.length - 1] as RoundTrace;
    const reached: number[] = [];
    for (let v = 0; v < WALK_N; v++)
      if ((last.level[v] as number) !== -1) reached.push(v);
    const inS = new Set(reached);
    const crossing = WALK.filter(([u, v]) => inS.has(u) && !inS.has(v));
    const rows: string[][] = [["", "값"]];
    rows.push(["마지막 BFS 가 도달한 정점", `{${reached.join(", ")}}`]);
    rows.push([
      "못 도달한 정점",
      `{${[...Array(WALK_N).keys()].filter((v) => !inS.has(v)).join(", ")}}`,
    ]);
    for (const [u, v, c] of crossing)
      rows.push([`경계 간선 ${u} → ${v}`, `용량 ${c}`]);
    rows.push([
      "경계 간선 용량의 합",
      comma(crossing.reduce((s, e) => s + e[2], 0)),
    ]);
    rows.push(["최대 유량", comma(maxFlow(WALK_N, WALK, 0, 5).flow)]);
    return table(rows).join("\n");
  },

  /** 라운드를 가장 많이 만드는 입력 — 계단 그래프. */
  "worst-rounds": () => {
    const rows: string[][] = [
      [
        "계단 층수 m",
        "정점 V",
        "간선 E",
        "유량을 흘린 라운드",
        "상한 V-1",
        "간선 검사",
      ],
    ];
    for (const m of [3, 5, 50, 200, 499]) {
      const s = stair(m);
      const run = countedDinic(s.n, s.edges, 0, s.sink);
      rows.push([
        comma(m),
        comma(s.n),
        comma(s.edges.length),
        comma(run.rounds.filter((r) => r.paths.length > 0).length),
        comma(s.n - 1),
        comma(run.looks),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5]).join("\n");
  },

  /** 제약 규모에서 두 축을 함께 키운 입력. */
  "worst-scale": () => {
    const rows: string[][] = [
      ["입력", "정점 V", "간선 E", "라운드", "간선 검사"],
    ];
    for (const extra of [0, 1_000, 5_000, 9_000]) {
      const s = stair(499, extra);
      const run = countedDinic(s.n, s.edges, 0, s.sink);
      rows.push([
        extra === 0 ? "계단만" : `계단 + 뒤로 가는 간선 ${comma(extra)} 개`,
        comma(s.n),
        comma(s.edges.length),
        comma(run.rounds.length),
        comma(run.looks),
      ]);
    }
    const g = grid(20, 10);
    const gr = countedDinic(g.n, g.edges, 0, g.sink);
    rows.push([
      "격자 20 × 10",
      comma(g.n),
      comma(g.edges.length),
      comma(gr.rounds.length),
      comma(gr.looks),
    ]);
    return table(rows, [1, 2, 3, 4]).join("\n");
  },
};
