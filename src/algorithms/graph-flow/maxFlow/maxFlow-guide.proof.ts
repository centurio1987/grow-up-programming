/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/maxFlow/maxFlow-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이
 * 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 사본 둘(`trace` ·
 * `countedDinic`)은 정본과 같은 절차이고, 이 파일이 읽힐 때 정본과 같은 답을 내는지 스스로 확인한다.
 *
 * - `trace` — 걸음마다 레벨 · `iter` · 항목 14 개의 잔여 용량을 통째로 적는다. 작은 입력에만 쓴다.
 *   걸음마다 전체를 베끼므로 큰 입력에 걸면 메모리가 모자란다.
 * - `countedDinic` — 항목 검사 횟수와 라운드별 요약만 센다. 큰 입력(계단 · 격자)은 이쪽이다.
 *
 * 나머지 사본(`countedFf` · `countedEk`)은 **다른 절차**다(아무 경로 · 경로마다 BFS). 정본을 흉내 내는
 * 사본이 아니라 비교 상대다.
 *
 * **변이는 둘이다**(`noBackflow` · `looseLevel`). `check-proof` 는 이 파일을 한 번 더 부르면서 변이를
 * 만들되 적용하지 않은 중화 상태로 둔다. 중화 여부는 변이 모듈의 함수가 정본과 **같은 객체인가**로
 * 알아내고, 「변이가 답을 바꿨는가」를 스스로 확인하는 검사는 중화 상태에서 건너뛴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { maxFlow } from "./maxFlow-guide.ref.ts";

export type Edge = [number, number, number];

/* ────────────────────────── 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. 정점 6 · 간선 7 · 소스 0 · 싱크 5. */
export const WALK_N = 6;
export const WALK_SOURCE = 0;
export const WALK_SINK = 5;
export const WALK: Edge[] = [
  [0, 1, 4],
  [1, 2, 2],
  [2, 5, 2],
  [0, 3, 3],
  [3, 2, 4],
  [1, 4, 5],
  [4, 5, 3],
];

/** 정점 넷짜리 다리 그래프. 되돌리지 못하면 답이 갈리는 가장 작은 입력이다. 용량은 전부 1. */
export const BRIDGE_N = 4;
export const BRIDGE: Edge[] = [
  [0, 1, 1],
  [0, 2, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 3, 1],
];

/** 같은 다리 그래프 모양에 용량만 다르게 준 입력. 되돌리지 않아도 답이 같은 입력이다. */
export const VARIED_N = 4;
export const VARIED: Edge[] = [
  [0, 1, 3],
  [0, 2, 2],
  [1, 2, 1],
  [1, 3, 2],
  [2, 3, 3],
];

/** 본문이 입력에 붙이는 이름. 표의 행 이름과 그림 제목이 같은 이름을 쓴다. */
export const NAME = {
  walk: "전개 입력",
  bridge: "다리 그래프",
  varied: "용량이 다른 다리 그래프",
} as const;

/* ────────────────────────── 표기 ────────────────────────── */

/** `1,867,256` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** `[0, 1, 2]` 꼴. */
export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `{0, 1, 2}` 꼴 — 정점 집합. */
export const set = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** `0 → 1 → 2` 꼴 — 경로. */
export const route = (xs: readonly number[]): string => xs.join(" → ");

/** 레벨 목록 — 도달 못 한 정점은 `-1` 그대로 적는다(코드의 표기와 같다). */
export const levels = (xs: readonly number[]): string => list(xs);

/** 마크다운 표 한 벌. `right` 는 오른쪽 정렬할 열 번호. */
export function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string {
  const sep = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  return [head, sep, ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다(코드 옆 짧은 결과 블록의 칸 맞춤). */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 열 맞춤 — 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function columns(rows: readonly (readonly string[])[]): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const ws: number[] = [];
  for (let c = 0; c < cols; c++)
    ws.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  return rows.map((r) =>
    r
      .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, ws[c] ?? 0)))
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 걸음을 통째로 적는 사본 ────────────────────── */

/** 정본 주석의 갈래 라벨. */
export type Label = "①" | "②" | "③" | "④" | "⑤" | "⑥";
export const LABELS: readonly Label[] = ["①", "②", "③", "④", "⑤", "⑥"];

/** 갈래마다 하는 일 — 정본 주석을 줄인 말. 표와 걸음 재생 패널이 같은 말을 쓴다. */
export const LABEL_TEXT: Record<Label, string> = {
  "①": "잔여가 있고 레벨이 없는 정점에 레벨을 적는다",
  "②": "잔여가 있고 레벨이 한 칸 큰 항목으로 내려간다",
  "③": "싱크에 도착해 병목을 올려보낸다",
  "④": "짝지은 두 잔여 용량을 고친다",
  "⑤": "iter 를 한 칸 옮겨 다음 항목을 본다",
  "⑥": "싱크에 레벨이 없어 반복을 끝낸다",
};

export type StepKind = "build" | "bfs" | "path" | "exhaust" | "end";

/**
 * 걸음 하나가 끝난 뒤의 상태. 항목 번호(`id`)는 원래 간선 `k` 의 정방향이 `k`, 역방향이 `E + k` 다.
 */
export interface Step {
  readonly kind: StepKind;
  readonly round: number;
  readonly level: number[];
  readonly iter: number[];
  /** 항목 번호마다의 잔여 용량. */
  readonly res: number[];
  /** 원래 간선마다 지금 실린 유량 — 용량에서 정방향 잔여를 뺀 값. */
  readonly flow: number[];
  readonly total: number;
  /** BFS 가 큐에 넣은 차례. */
  readonly queue: number[];
  /** BFS 에서 레벨을 적게 한 항목(그 항목의 머리에 레벨이 적혔다). */
  readonly found: number[];
  /** 이 걸음에 유량을 보낸 경로의 정점과 항목. */
  readonly path: number[];
  readonly arcs: number[];
  readonly add: number;
  /** DFS 가 읽었지만 경로에 안 든 항목. */
  readonly read: number[];
  /** DFS 가 들어간 정점의 차례. */
  readonly entered: number[];
  readonly hits: Record<Label, number>;
  readonly looks: number;
}

export interface Trace {
  readonly steps: Step[];
  readonly flow: number;
  readonly E: number;
  /** 정점마다의 목록 — 항목 번호를 목록 차례대로. */
  readonly lists: number[][];
  /** 항목 번호마다 짝이 상대 목록에서 놓인 자리. */
  readonly revAt: number[];
}

const zeroHits = (): Record<Label, number> => ({
  "①": 0,
  "②": 0,
  "③": 0,
  "④": 0,
  "⑤": 0,
  "⑥": 0,
});

/** 항목의 꼬리와 머리. */
export const tailOf = (edges: readonly Edge[], id: number): number => {
  const E = edges.length;
  const e = edges[id < E ? id : id - E] as Edge;
  return id < E ? e[0] : e[1];
};
export const headOf = (edges: readonly Edge[], id: number): number => {
  const E = edges.length;
  const e = edges[id < E ? id : id - E] as Edge;
  return id < E ? e[1] : e[0];
};
/** 항목 이름 — `1→2`. 역방향이면 뒤집힌 방향으로 적는다. */
export const arcName = (edges: readonly Edge[], id: number): string =>
  `${tailOf(edges, id)}→${headOf(edges, id)}`;
export const isBack = (edges: readonly Edge[], id: number): boolean =>
  id >= edges.length;

/**
 * 정본과 같은 절차에 **걸음마다 상태를 적는 자리만** 덧붙인 사본. `noBack` 은 불변식 절의 「역방향을
 * 안 늘린다」를 사본으로 재현할 때만 쓴다 — 그 답이 기계로 만든 변이의 답과 같은지 아래에서 확인한다.
 */
export function trace(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
  opt: { noBack?: boolean } = {},
): Trace {
  interface TArc {
    to: number;
    cap: number;
    rev: number;
    id: number;
  }
  const E = edges.length;
  const g: TArc[][] = Array.from({ length: n }, () => []);
  const byId: TArc[] = [];
  edges.forEach(([u, v, c], k) => {
    const out = g[u] as TArc[];
    const back = g[v] as TArc[];
    const iOut = out.length;
    const f: TArc = { to: v, cap: c, rev: 0, id: k };
    out.push(f);
    const iBack = back.length;
    const b: TArc = { to: u, cap: 0, rev: iOut, id: E + k };
    back.push(b);
    f.rev = iBack;
    byId[k] = f;
    byId[E + k] = b;
  });
  const lists = g.map((l) => l.map((a) => a.id));
  const revAt = byId.map((a) => a.rev);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  const steps: Step[] = [];
  let total = 0;
  let round = 0;

  const snap = (kind: StepKind, extra: Partial<Step> = {}): void => {
    steps.push({
      kind,
      round,
      level: level.slice(),
      iter: iter.slice(),
      res: byId.map((a) => a.cap),
      flow: edges.map(([, , c], k) => c - (byId[k] as TArc).cap),
      total,
      queue: [],
      found: [],
      path: [],
      arcs: [],
      add: 0,
      read: [],
      entered: [],
      hits: zeroHits(),
      looks: 0,
      ...extra,
    });
  };

  const bfs = () => {
    const hits = zeroHits();
    let looks = 0;
    const found: number[] = [];
    level.fill(-1);
    level[source] = 0;
    const queue = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of g[u] as TArc[]) {
        looks++;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
          found.push(e.id);
          hits["①"]++;
        }
      }
    }
    return { hits, looks, queue, found };
  };

  const dfsCall = () => {
    const hits = zeroHits();
    let looks = 0;
    const read: number[] = [];
    const entered: number[] = [];
    const arcs: number[] = [];
    const pathV: number[] = [];
    const dfs = (u: number, pushed: number): number => {
      entered.push(u);
      if (u === sink) {
        hits["③"]++;
        return pushed;
      }
      const list = g[u] as TArc[];
      for (
        ;
        (iter[u] as number) < list.length;
        iter[u] = (iter[u] as number) + 1
      ) {
        const e = list[iter[u] as number] as TArc;
        looks++;
        if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
          hits["②"]++;
          const d = dfs(e.to, Math.min(pushed, e.cap));
          if (d > 0) {
            const back = (g[e.to] as TArc[])[e.rev] as TArc;
            e.cap -= d;
            if (opt.noBack !== true) back.cap += d;
            hits["④"]++;
            arcs.unshift(e.id);
            pathV.unshift(e.to);
            return d;
          }
        }
        read.push(e.id);
        hits["⑤"]++;
      }
      return 0;
    };
    const f = dfs(source, Number.POSITIVE_INFINITY);
    return {
      f,
      hits,
      looks,
      read: [...new Set(read)],
      entered,
      arcs,
      path: f > 0 ? [source, ...pathV] : [],
    };
  };

  snap("build");
  if (source !== sink) {
    for (;;) {
      round++;
      const b = bfs();
      if ((level[sink] as number) === -1) {
        const hits = b.hits;
        hits["⑥"] = 1;
        snap("end", {
          queue: b.queue,
          found: b.found,
          hits,
          looks: b.looks,
        });
        break;
      }
      iter.fill(0);
      snap("bfs", {
        queue: b.queue,
        found: b.found,
        hits: b.hits,
        looks: b.looks,
      });
      for (;;) {
        const d = dfsCall();
        if (d.f === 0) {
          snap("exhaust", {
            read: d.read,
            entered: d.entered,
            hits: d.hits,
            looks: d.looks,
          });
          break;
        }
        total += d.f;
        snap("path", {
          path: d.path,
          arcs: d.arcs,
          add: d.f,
          read: d.read.filter((id) => !d.arcs.includes(id)),
          entered: d.entered,
          hits: d.hits,
          looks: d.looks,
        });
      }
    }
  }
  return { steps, flow: total, E, lists, revAt };
}

/** 전개 입력의 기록 — 그림 사이드카와 이 파일의 블록이 같은 기록을 쓴다. */
export const WALK_TRACE = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK);

// 사본이 정본과 같은 답을 내는가 — 안 같으면 아래 모든 걸음 값이 다른 절차의 값이다.
for (const [n, edges, t] of [
  [WALK_N, WALK, WALK_SINK],
  [BRIDGE_N, BRIDGE, 3],
  [VARIED_N, VARIED, 3],
] as [number, Edge[], number][]) {
  const got = trace(n, edges, 0, t).flow;
  const want = maxFlow(n, edges, 0, t).flow;
  if (got !== want)
    throw new Error(`기록 사본이 정본과 다른 답을 낸다 — ${got} · ${want}`);
}

/** 걸음 번호 `T#` — 첫 걸음이 T1 이다. */
export const tOf = (i: number): string => `T${i + 1}`;

/** 라운드마다 그 라운드의 걸음 번호. */
function roundSteps(tr: Trace, round: number): number[] {
  return tr.steps.flatMap((s, i) => (s.round === round ? [i] : []));
}

/* ────────────────────── 계수만 세는 사본 ────────────────────── */

interface Arc {
  to: number;
  cap: number;
  rev: number;
  back: boolean;
}

function build(n: number, edges: readonly Edge[]): Arc[][] {
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

interface RoundSummary {
  level: number[];
  paths: number;
  looks: number;
  bfsLooks: number;
}

/**
 * 정본과 같은 절차. **세는 것과 `iter` 를 언제 초기화하는지만** 다르다. 라운드마다 레벨과 경로 수만
 * 남기므로 정점 500 · 간선 만 개 입력에서도 가볍다.
 *
 * `iterMode` 는 짚고 가기가 쓰는 세 갈래다 — `round` 가 정본, `call` 은 DFS 호출마다 0 으로 두는 것,
 * `never` 는 한 번도 안 두는 것이다. `never` 는 반복이 끝나지 않으므로 `roundCap` 으로 자른다.
 */
function countedDinic(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
  opt: { iterMode?: "round" | "call" | "never"; roundCap?: number } = {},
): {
  flow: number;
  looks: number;
  bfsLooks: number;
  rounds: RoundSummary[];
  capped: boolean;
} {
  const iterMode = opt.iterMode ?? "round";
  const roundCap = opt.roundCap ?? 1_000_000;
  const g = build(n, edges);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  const rounds: RoundSummary[] = [];
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
        paths: 0,
        looks: looks - before,
        bfsLooks: bfsHere,
      });
      break;
    }
    if (iterMode !== "never") iter.fill(0);
    let paths = 0;
    for (;;) {
      const f = dfs(source, Number.POSITIVE_INFINITY);
      if (f === 0) break;
      flow += f;
      paths++;
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

interface FfPath {
  path: number[];
  add: number;
  /** 반대 방향 항목을 지난 자리 — 그 항목의 꼬리 정점. */
  back: number[];
  /** 이 경로를 보내서 잔여가 0 이 된 항목. */
  zeroed: string[];
}

/**
 * 경로를 **아무거나** 고르는 방식(포드–풀커슨). 방문 표시를 두고 깊이 우선으로 처음 찾은 경로에 병목만큼
 * 보낸다. `cancel` 이 거짓이면 역방향 잔여 용량을 안 늘린다 — 한 번 보낸 유량을 되돌릴 수 없는 방식이다.
 */
function countedFf(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
  opt: { cancel?: boolean } = {},
): { flow: number; looks: number; paths: FfPath[] } {
  const cancel = opt.cancel ?? true;
  const g = build(n, edges);
  let looks = 0;
  const paths: FfPath[] = [];
  let cur: number[] = [];
  let backs: number[] = [];
  let zeroed: string[] = [];
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
          cur.unshift(e.to);
          if (e.back) backs.unshift(u);
          if (e.cap === 0) zeroed.unshift(`${u}→${e.to}`);
          return d;
        }
      }
    }
    return 0;
  };
  let flow = 0;
  for (;;) {
    cur = [];
    backs = [];
    zeroed = [];
    const f = dfs(
      source,
      Number.POSITIVE_INFINITY,
      Array.from({ length: n }, () => false),
    );
    if (f === 0) break;
    flow += f;
    paths.push({ path: [source, ...cur], add: f, back: backs, zeroed });
  }
  return { flow, looks, paths };
}

/** 증가 경로 **하나마다** BFS 로 최단 경로를 다시 찾는 방식(에드먼즈–카프). */
function countedEk(
  n: number,
  edges: readonly Edge[],
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

/**
 * 레벨 조건을 느슨하게 바꾼 사본 — **재귀가 지나는 정점 자취를 뽑으려고** 둔다. 기계로 만든 변이
 * (`looseLevel`)는 값을 안 돌려주고 `RangeError` 로 끝나므로, 어느 정점을 되풀이하는지는 그 변이에서 못
 * 꺼낸다. 같은 조건으로 바꾼 사본에 깊이 상한과 자취 기록만 덧붙였다. **「끝나지 않는다」를 판정하는
 * 것은 이 사본이 아니라 변이다.**
 */
function looseTrace(
  n: number,
  edges: readonly Edge[],
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
export function stair(
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

/** 격자 네트워크 — 가로 `W` · 세로 `H` 칸에 소스와 싱크 둘을 더한다. */
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

type Mod = {
  maxFlow(n: number, edges: Edge[], s: number, t: number): { flow: number };
};

/**
 * 짝지은 역방향 잔여 용량을 **안 늘리는** 판. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가
 * 아니면 `loadMutant` 가 던진다.
 */
const noBackflow = await loadMutant<Mod>(
  new URL("./maxFlow-guide.ref.ts", import.meta.url).pathname,
  { drop: /back\.cap \+= d/ },
);

/** DFS 의 레벨 조건을 「레벨이 있기만 하면」으로 느슨하게 바꾼 판. */
const looseLevel = await loadMutant<Mod>(
  new URL("./maxFlow-guide.ref.ts", import.meta.url).pathname,
  {
    swap: [
      /\(level\[e\.to\] as number\) === \(level\[u\] as number\) \+ 1/,
      "(level[e.to] as number) !== -1",
    ],
  },
);

/** 중화 상태인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이를 적용하지 않은 것이다. */
const NEUTRAL_BACK = noBackflow.maxFlow === maxFlow;

const BACK_CASES: { label: string; n: number; edges: Edge[]; sink: number }[] =
  [
    { label: NAME.walk, n: WALK_N, edges: WALK, sink: WALK_SINK },
    { label: NAME.bridge, n: BRIDGE_N, edges: BRIDGE, sink: 3 },
    { label: NAME.varied, n: VARIED_N, edges: VARIED, sink: 3 },
    { label: "격자 20 × 10", ...grid(20, 10) },
  ];

const backRows = BACK_CASES.map((c) => ({
  label: c.label,
  ok: maxFlow(c.n, c.edges, 0, c.sink).flow,
  ng: noBackflow.maxFlow(c.n, c.edges, 0, c.sink).flow,
}));

// 하나도 안 갈리면 이 절의 주장이 성립하지 않는다. 중화 상태에서는 건너뛴다.
if (!NEUTRAL_BACK && backRows.every((r) => r.ok === r.ng)) {
  throw new Error(
    "변이가 어느 입력에서도 유량을 바꾸지 못했다 — 「역방향을 안 늘리면 답이 작아진다」가 거짓이다",
  );
}

/** 불변식 절의 걸음 표 — 변이가 걸렸으면 사본도 역방향을 안 늘린다. 두 답이 같은지 확인한다. */
const BACK_TRACE = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
  noBack: !NEUTRAL_BACK,
});
if (
  BACK_TRACE.flow !==
  noBackflow.maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow
) {
  throw new Error("걸음 표 사본과 기계로 만든 변이가 다른 답을 낸다");
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

/** 같은 답이면 「같다」, 아니면 「다르다」. */
const verdict = (a: string, b: string): string => (a === b ? "같다" : "다르다");

/* ────────────────────────── 작은 계산 ────────────────────────── */

/** 잔여가 양수인 항목만 따라 소스에서 갈 수 있는 정점과, 싱크까지의 BFS 경로. */
function reach(
  n: number,
  edges: readonly Edge[],
  res: readonly number[],
  source: number,
  sink: number,
  withBack: boolean,
): { seen: number[]; path: number[] } {
  const E = edges.length;
  const from: number[] = Array.from({ length: n }, () => -2);
  from[source] = -1;
  const queue = [source];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    for (let id = 0; id < 2 * E; id++) {
      if (!withBack && id >= E) continue;
      if (tailOf(edges, id) !== u || (res[id] as number) <= 0) continue;
      const v = headOf(edges, id);
      if (from[v] !== -2) continue;
      from[v] = u;
      queue.push(v);
    }
  }
  const seen = queue.slice().sort((a, b) => a - b);
  if (from[sink] === -2) return { seen, path: [] };
  const path: number[] = [];
  for (let v = sink; v !== -1; v = from[v] as number) path.unshift(v);
  return { seen, path };
}

/** 레벨 그래프의 항목 — 잔여가 양수이고 레벨이 정확히 한 칸 오르는 항목. */
export function levelArcs(edges: readonly Edge[], s: Step): number[] {
  const out: number[] = [];
  for (let id = 0; id < 2 * edges.length; id++) {
    const u = tailOf(edges, id);
    const v = headOf(edges, id);
    if (
      (s.res[id] as number) > 0 &&
      (s.level[u] as number) >= 0 &&
      (s.level[v] as number) === (s.level[u] as number) + 1
    )
      out.push(id);
  }
  return out;
}

/** 항목 목록 위의 소스→싱크 경로를 전부 센다(작은 그래프 전용). */
function allPaths(
  edges: readonly Edge[],
  arcs: readonly number[],
  source: number,
  sink: number,
): number[][] {
  const out: number[][] = [];
  const walk = (u: number, acc: number[]): void => {
    if (u === sink) {
      out.push(acc.slice());
      return;
    }
    for (const id of arcs) {
      if (tailOf(edges, id) !== u) continue;
      const v = headOf(edges, id);
      if (acc.includes(v)) continue;
      acc.push(v);
      walk(v, acc);
      acc.pop();
    }
  };
  walk(source, [source]);
  return out;
}

/** 원래 간선마다 유량 — 정점마다 들어온 양과 나간 양. */
function inOut(
  n: number,
  edges: readonly Edge[],
  flow: readonly number[],
): { inn: number[]; out: number[] } {
  const inn: number[] = Array.from({ length: n }, () => 0);
  const out: number[] = Array.from({ length: n }, () => 0);
  edges.forEach(([u, v], k) => {
    if (u === v) return;
    out[u] = (out[u] as number) + (flow[k] as number);
    inn[v] = (inn[v] as number) + (flow[k] as number);
  });
  return { inn, out };
}

/** 병목 계산 한 줄 — `min(4, 2, 2) = 2`. */
export function bottleneckExpr(tr: Trace, i: number): string {
  const s = tr.steps[i] as Step;
  const before = tr.steps[i - 1] as Step;
  const caps = s.arcs.map((id) => before.res[id] as number);
  return `min(${caps.join(", ")}) = ${s.add}`;
}

export interface RoundInfo {
  round: number;
  sinkLevel: number;
  paths: number[][];
  sent: number;
  total: number;
  usedBack: number;
}

/** 라운드 요약 — 라운드마다 싱크의 레벨 · 보낸 경로 · 보낸 양. */
export function roundsOf(tr: Trace, sink: number = WALK_SINK): RoundInfo[] {
  const out: RoundInfo[] = [];
  const end = tr.steps.at(-1) as Step;
  for (let r = 1; r <= end.round; r++) {
    const idx = roundSteps(tr, r);
    const head = tr.steps[idx[0] as number] as Step;
    const ps = idx
      .map((i) => tr.steps[i] as Step)
      .filter((s) => s.kind === "path");
    out.push({
      round: r,
      sinkLevel: head.level[sink] as number,
      paths: ps.map((s) => s.path),
      sent: ps.reduce((a, s) => a + s.add, 0),
      total: (tr.steps[idx.at(-1) as number] as Step).total,
      usedBack: ps.filter((s) => s.arcs.some((id) => id >= tr.E)).length,
    });
  }
  return out;
}

/* ────────────────────────── 블록 ────────────────────────── */

const W = WALK_TRACE;
const S = W.steps;
const last = S.at(-1) as Step;
/** 라운드 1 이 끝난 걸음(차단 유량이 된 걸음). */
export const R1_END = S.findIndex((s) => s.kind === "exhaust");
const R1 = S[R1_END] as Step;
/** 라운드 2 의 BFS 걸음. */
const R2_BFS = S.findIndex((s) => s.kind === "bfs" && s.round === 2);
/** 역방향 항목을 지난 경로 걸음. */
export const BACK_PATH = S.findIndex(
  (s) => s.kind === "path" && s.arcs.some((id) => id >= W.E),
);

/** 규모의 상한 — 본문 ① 이 정한 과제의 규모. */
export const V_MAX = 500;
export const E_MAX = 10_000;
export const C_MAX = 1_000_000;

/** 「아이디어를 떠올리는 과정」 사다리가 쓰는 수 — 본문 표와 같은 실행에서. */
export function ladderNumbers(): {
  bruteDigits: number;
  greedy: number;
  bridgeAnswer: number;
  fanFf: number;
  fanEk: number;
  fanDn: number;
  fanEkBfs: number;
  fanDnBfs: number;
  fanK: [number, number];
} {
  const a = branch(4);
  const b = branch(128);
  return {
    bruteDigits: ((BigInt(C_MAX) + 1n) ** BigInt(E_MAX)).toString().length,
    greedy: countedFf(BRIDGE_N, BRIDGE, 0, 3, { cancel: false }).flow,
    bridgeAnswer: maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow,
    fanFf: Math.round(
      countedFf(b.n, b.edges, 0, b.sink).looks /
        countedFf(a.n, a.edges, 0, a.sink).looks,
    ),
    fanEk: Math.round(
      countedEk(b.n, b.edges, 0, b.sink).looks /
        countedEk(a.n, a.edges, 0, a.sink).looks,
    ),
    fanDn: Math.round(
      countedDinic(b.n, b.edges, 0, b.sink).looks /
        countedDinic(a.n, a.edges, 0, a.sink).looks,
    ),
    fanEkBfs: countedEk(b.n, b.edges, 0, b.sink).bfsCount,
    fanDnBfs: countedDinic(b.n, b.edges, 0, b.sink).rounds.length,
    fanK: [4, 128],
  };
}

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  /** 최대 유량 한 벌 — 정점마다 들어온 양과 나간 양, 간선마다 용량을 넘었는가. */
  conceptFlow: () => {
    const { inn, out } = inOut(WALK_N, WALK, last.flow);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      v === WALK_SOURCE
        ? `${v} (소스)`
        : v === WALK_SINK
          ? `${v} (싱크)`
          : String(v),
      String(inn[v]),
      String(out[v]),
      String((inn[v] as number) - (out[v] as number)),
    ]);
    const over = WALK.filter(
      ([, , c], k) => (last.flow[k] as number) > c,
    ).length;
    const mids = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => v !== WALK_SOURCE && v !== WALK_SINK,
    );
    const kept = mids.every((v) => inn[v] === out[v]);
    return [
      md(
        ["정점", "들어온 유량", "나간 유량", "들어온 것 − 나간 것"],
        rows,
        [1, 2, 3],
      ),
      "",
      `소스가 내보낸 양은 ${out[WALK_SOURCE]} 이고 싱크가 받은 양은 ${inn[WALK_SINK]} 입니다. 중간 정점 ${mids.length} 개는 ${kept ? "모두" : "모두는 아니게"} 들어온 양과 나간 양이 같고, 용량을 넘은 간선은 ${over} 개입니다. 정본이 낸 최대 유량은 ${maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow} 입니다.`,
    ].join("\n");
  },

  /** 라운드마다 싱크의 레벨과 보낸 양. */
  conceptRounds: () => {
    const rs = roundsOf(W);
    const rows = rs.map((r) => [
      `라운드 ${r.round}`,
      r.sinkLevel < 0 ? "없음" : String(r.sinkLevel),
      r.paths.length === 0 ? "없음" : r.paths.map(route).join(" · "),
      String(r.sent),
      String(r.total),
    ]);
    const lv = rs.filter((r) => r.sinkLevel >= 0).map((r) => r.sinkLevel);
    return [
      md(
        [
          "라운드",
          "싱크의 레벨",
          "보낸 증가 경로 목록",
          "보낸 양",
          "누적 유량",
        ],
        rows,
        [1, 3, 4],
      ),
      "",
      `싱크의 레벨이 라운드마다 ${lv.join(" → ")}${으로(String(lv.at(-1)))} 커지고, 라운드 ${rs.length} 에서 싱크에 레벨이 붙지 않아 끝납니다. 최대 유량은 ${last.total} 입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.origin ─────────────── */

  /** 유량을 전수로 배정해 보는 방법의 가짓수 — 수치 반박의 근거. */
  bruteScale: () => {
    const cases: [number, number][] = [
      [2, 3],
      [5, 10],
      [100, 1_000],
      [E_MAX, C_MAX],
    ];
    let digits = 0;
    const rows = cases.map(([e, c]) => {
      const total = (BigInt(c) + 1n) ** BigInt(e);
      const text = total.toString();
      digits = text.length;
      return [
        comma(e),
        comma(c),
        text.length <= 12
          ? comma(Number(total))
          : `${comma(c + 1)}^${comma(e)}`,
        comma(text.length),
      ];
    });
    return [
      md(
        ["간선 E", "용량 상한 c", "유량 배정의 가짓수 (c+1)^E", "자릿수"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `규모의 상한에서 배정의 가짓수가 ${comma(digits)} 자리입니다. 1 초에 10 억 개씩 본다고 해도 자릿수가 아홉만 줄어 ${comma(digits - 9)} 자리 초가 걸립니다.`,
    ].join("\n");
  },

  /** 한 길씩 보내고 되돌리지 않는 방법을 다리 그래프에 건다. */
  greedyBridge: () => {
    const run = countedFf(BRIDGE_N, BRIDGE, 0, 3, { cancel: false });
    const rows = run.paths.map((p, i) => [
      `경로 ${i + 1}`,
      route(p.path),
      String(p.add),
      String(run.paths.slice(0, i + 1).reduce((a, x) => a + x.add, 0)),
      p.zeroed.join(" · "),
    ]);
    rows.push([
      `경로 ${run.paths.length + 1}`,
      "찾지 못한다",
      "-",
      String(run.flow),
      "-",
    ]);
    return [
      md(
        ["차례", "찾은 경로", "병목", "누적 유량", "잔여가 0 이 된 간선"],
        rows,
        [2, 3],
      ),
      "",
      `되돌리지 않으면 경로 ${run.paths.length} 개를 보내고 멈춰 유량이 ${run.flow} 입니다. 정본이 낸 답은 ${maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow} 입니다.`,
    ].join("\n");
  },

  /** 같은 다리 그래프에서 보낸 만큼 반대 방향 잔여를 늘리면. */
  cancelBridge: () => {
    const run = countedFf(BRIDGE_N, BRIDGE, 0, 3, { cancel: true });
    const backName = (p: FfPath): string[] =>
      p.back.map((u) => `${u}→${p.path[p.path.indexOf(u) + 1]}`);
    const rows = run.paths.map((p, i) => [
      `경로 ${i + 1}`,
      route(p.path),
      String(p.add),
      p.back.length === 0 ? "안 지난다" : backName(p).join(" · "),
      String(run.paths.slice(0, i + 1).reduce((a, x) => a + x.add, 0)),
    ]);
    const second = run.paths[1];
    const name = second ? (backName(second)[0] ?? "없음") : "없음";
    const ref = maxFlow(BRIDGE_N, BRIDGE, 0, 3).flow;
    return [
      md(
        ["차례", "찾은 경로", "병목", "지난 반대 방향 항목", "누적 유량"],
        rows,
        [2, 4],
      ),
      "",
      `두 번째 경로가 반대 방향 항목 ${name}${을를(name.slice(-1))} 지나고, 유량 ${run.flow}${이가(String(run.flow))} 정본의 답 ${ref}${과와(String(ref))} 같습니다.`,
    ].join("\n");
  },

  /** 한 번 보낸 유량을 되돌릴 수 있는가로 답이 갈린다. */
  cancelValues: () => {
    const cases = [
      { label: NAME.bridge, n: BRIDGE_N, edges: BRIDGE, sink: 3 },
      { label: NAME.walk, n: WALK_N, edges: WALK, sink: WALK_SINK },
      { label: NAME.varied, n: VARIED_N, edges: VARIED, sink: 3 },
    ];
    let split = 0;
    const rows = cases.map((c) => {
      const no = countedFf(c.n, c.edges, 0, c.sink, { cancel: false }).flow;
      const yes = countedFf(c.n, c.edges, 0, c.sink).flow;
      const ref = maxFlow(c.n, c.edges, 0, c.sink).flow;
      if (no !== ref) split++;
      return [c.label, String(no), String(yes), String(ref)];
    });
    return [
      md(["입력", "되돌리지 않는 쪽", "되돌리는 쪽", "정본"], rows, [1, 2, 3]),
      "",
      `세 입력 중 ${split} 개에서 되돌리지 않는 쪽의 답이 정본보다 작고, ${cases.length - split} 개에서는 답이 같습니다.`,
    ].join("\n");
  },

  /** 같은 그래프에서 간선 순서와 용량을 각각 바꿔 경로 수를 센다. */
  edgeOrder: () => {
    const caps = [1, 4, 100, C_MAX];
    const runs = caps.map((c) => ({
      c,
      late: countedFf(4, bridgeLate(c), 0, 3),
      early: countedFf(4, bridgeEarly(c), 0, 3),
      flow: maxFlow(4, bridgeEarly(c), 0, 3).flow,
    }));
    const rows = runs.map((r) => [
      comma(r.c),
      String(r.late.paths.length),
      comma(r.late.looks),
      String(r.early.paths.length),
      comma(r.early.looks),
      comma(r.flow),
    ]);
    const from4 = runs.filter((r) => r.c >= 4);
    const a = from4[0] as (typeof runs)[number];
    const stable = from4.every(
      (r) =>
        r.late.paths.length === a.late.paths.length &&
        r.early.paths.length === a.early.paths.length,
    );
    return [
      md(
        [
          "용량 c",
          "다리를 나중에 본다 · 경로 수",
          "간선 검사",
          "다리를 먼저 본다 · 경로 수",
          "간선 검사",
          "유량",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `용량 ${comma(a.c)} 에서 순서만 바꾸면 경로 수가 ${a.late.paths.length} 개에서 ${a.early.paths.length} 개로 늘고, 용량을 ${comma(C_MAX)}${으로(comma(C_MAX))} 키워도 두 순서의 경로 수가 ${stable ? "그대로" : "바뀝니다"}입니다.`,
    ].join("\n");
  },

  /** 경로를 고르는 규칙 셋을 같은 입력들에 걸어 간선 검사 횟수를 나란히 센다. */
  threeRules: () => {
    const cases: { label: string; n: number; edges: Edge[]; sink: number }[] = [
      {
        label: `${NAME.walk} (V=6 · E=7)`,
        n: WALK_N,
        edges: WALK,
        sink: WALK_SINK,
      },
      { label: "격자 (V=202 · E=570)", ...grid(20, 10) },
      { label: "계단 (V=51 · E=99)", ...stair(50) },
      { label: "부채꼴 128 (V=131 · E=257)", ...branch(128) },
    ];
    const wins = [0, 0, 0];
    const rows = cases.map((c) => {
      const ff = countedFf(c.n, c.edges, 0, c.sink).looks;
      const ek = countedEk(c.n, c.edges, 0, c.sink).looks;
      const dn = countedDinic(c.n, c.edges, 0, c.sink).looks;
      const min = Math.min(ff, ek, dn);
      [ff, ek, dn].forEach((x, i) => {
        if (x === min) wins[i] = (wins[i] as number) + 1;
      });
      return [
        c.label,
        comma(ff),
        comma(ek),
        comma(dn),
        comma(maxFlow(c.n, c.edges, 0, c.sink).flow),
      ];
    });
    return [
      md(
        ["입력", "아무 경로", "경로마다 BFS", "레벨 그래프", "유량"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `간선 검사가 가장 적은 규칙은 네 입력 중 아무 경로가 ${wins[0]} 개, 경로마다 BFS 가 ${wins[1]} 개, 레벨 그래프가 ${wins[2]} 개입니다.`,
    ].join("\n");
  },

  /** 같은 모양에서 가닥만 늘렸을 때 세 규칙이 각각 몇 배가 되는가. */
  branchScale: () => {
    const ks = [4, 16, 64, 128];
    const runs = ks.map((k) => {
      const c = branch(k);
      return {
        k,
        c,
        ff: countedFf(c.n, c.edges, 0, c.sink).looks,
        ek: countedEk(c.n, c.edges, 0, c.sink).looks,
        dn: countedDinic(c.n, c.edges, 0, c.sink).looks,
      };
    });
    const rows = runs.map((r) => [
      comma(r.k),
      comma(r.c.n),
      comma(r.c.edges.length),
      comma(r.ff),
      comma(r.ek),
      comma(r.dn),
    ]);
    const a = runs[0] as (typeof runs)[number];
    const b = runs.at(-1) as (typeof runs)[number];
    const x = (p: number, q: number) => Math.round(q / p);
    return [
      md(
        [
          "부채꼴 가닥",
          "정점 V",
          "간선 E",
          "아무 경로",
          "경로마다 BFS",
          "레벨 그래프",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `가닥을 ${a.k} 에서 ${b.k}${으로(String(b.k))} ${b.k / a.k} 배 늘렸을 때 간선 검사가 아무 경로는 ${x(a.ff, b.ff)} 배, 경로마다 BFS 는 ${x(a.ek, b.ek)} 배, 레벨 그래프는 ${x(a.dn, b.dn)} 배가 됩니다.`,
    ].join("\n");
  },

  /** BFS 를 몇 번 하는가 — 위 표의 차이가 어디서 오는지. */
  bfsCounts: () => {
    const cases: { label: string; n: number; edges: Edge[]; sink: number }[] = [
      { label: NAME.walk, n: WALK_N, edges: WALK, sink: WALK_SINK },
      { label: "격자", ...grid(20, 10) },
      { label: "계단", ...stair(50) },
      { label: "부채꼴 128", ...branch(128) },
    ];
    let plusOne = true;
    const runs = cases.map((c) => {
      const ek = countedEk(c.n, c.edges, 0, c.sink);
      const dn = countedDinic(c.n, c.edges, 0, c.sink);
      if (ek.bfsCount !== ek.paths + 1) plusOne = false;
      return { label: c.label, ek, dn };
    });
    const rows = runs.map((r) => [
      r.label,
      comma(r.ek.paths),
      comma(r.ek.bfsCount),
      comma(r.dn.rounds.length),
    ]);
    const fan = runs.at(-1) as (typeof runs)[number];
    return [
      md(
        [
          "입력",
          "증가 경로 수",
          "경로마다 BFS 의 BFS 횟수",
          "레벨 그래프의 BFS 횟수",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `네 입력 ${plusOne ? "모두" : "중 일부만"} 경로마다 BFS 의 BFS 횟수가 증가 경로 수보다 1 많습니다. ${fan.label} 에서는 BFS 가 ${comma(fan.ek.bfsCount)} 번 대 ${comma(fan.dn.rounds.length)} 번입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 잔여 그래프 ─────────────── */

  /** 간선 1→2 의 두 항목을 라운드 1 이 끝난 뒤에 읽는다. */
  residualReadOne: () => {
    const k = WALK.findIndex(([u, v]) => u === 1 && v === 2);
    const [u, v, c] = WALK[k] as Edge;
    const f = R1.flow[k] as number;
    const fwd = R1.res[k] as number;
    const bwd = R1.res[W.E + k] as number;
    return [
      md(
        ["읽는 것", "자리", "그 자리의 수"],
        [
          ["용량", `c(${u},${v})`, String(c)],
          ["지금 실린 유량", "용량 − 정방향 잔여", String(f)],
          ["정방향 항목의 잔여", `${u}→${v}`, String(fwd)],
          ["역방향 항목의 잔여", `${v}→${u}`, String(bwd)],
        ],
        [2],
      ),
      "",
      `${u} 에서 ${v}${으로(String(v))} 더 보낼 수 있는 양이 ${fwd} 이고, 앞서 보낸 ${f} 가운데 ${v} 쪽에서 ${u} 쪽으로 되돌릴 수 있는 양이 ${bwd} 입니다.`,
    ].join("\n");
  },

  /** 일곱 간선의 두 항목 — 두 잔여의 합이 용량과 같은가. */
  residualPairs: () => {
    let ok = 0;
    const rows = WALK.map(([u, v, c], k) => {
      const fwd = R1.res[k] as number;
      const bwd = R1.res[W.E + k] as number;
      if (fwd + bwd === c) ok++;
      return [
        `${u}→${v}`,
        String(c),
        String(R1.flow[k]),
        String(fwd),
        String(bwd),
        String(fwd + bwd),
      ];
    });
    const positive = R1.res.filter((x) => x > 0).length;
    return [
      md(
        ["간선", "용량", "유량", "정방향 잔여", "역방향 잔여", "두 잔여의 합"],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${WALK.length} 쌍 중 ${ok} 쌍에서 두 잔여의 합이 용량과 같습니다. 항목 ${R1.res.length} 개 중 잔여가 양수인 항목은 ${positive} 개입니다.`,
    ].join("\n");
  },

  /** 라운드 1 이 끝난 뒤 — 역방향 항목까지 보는 그래프와 용량만 줄인 그래프. */
  residualVsShrunk: () => {
    const withBack = reach(WALK_N, WALK, R1.res, WALK_SOURCE, WALK_SINK, true);
    const noBack = reach(WALK_N, WALK, R1.res, WALK_SOURCE, WALK_SINK, false);
    const shrunkFinal = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
      noBack: true,
    }).flow;
    return [
      md(
        [
          "그래프",
          "소스에서 갈 수 있는 정점",
          "싱크까지 가는 길",
          "끝까지 보냈을 때의 유량",
        ],
        [
          [
            "잔여 그래프 (역방향 항목 포함)",
            set(withBack.seen),
            withBack.path.length ? route(withBack.path) : "없음",
            String(W.flow),
          ],
          [
            "용량만 줄인 그래프",
            set(noBack.seen),
            noBack.path.length ? route(noBack.path) : "없음",
            String(shrunkFinal),
          ],
        ],
        [3],
      ),
      "",
      `같은 상태에서 역방향 항목을 빼면 소스에서 정점 ${noBack.seen.length} 개까지만 가고 싱크에 못 갑니다. 역방향 항목을 넣으면 정점 ${withBack.seen.length} 개에 모두 가고, 싱크까지 경로가 남아 있습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 레벨 그래프 ─────────────── */

  /** 라운드 2 에서 정점 1 의 레벨을 읽는다. */
  levelReadOne: () => {
    const s = S[R2_BFS] as Step;
    const byHead = new Map<number, number>();
    for (const id of s.found) byHead.set(headOf(WALK, id), id);
    const chain: number[] = [];
    for (let v = 1; v !== WALK_SOURCE; ) {
      const id = byHead.get(v) as number;
      chain.unshift(id);
      v = tailOf(WALK, id);
    }
    const rows: string[][] = [[String(WALK_SOURCE), "0", "시작", "-", "-"]];
    const before = S[R2_BFS - 1] as Step;
    for (const id of chain) {
      rows.push([
        String(headOf(WALK, id)),
        String(s.level[headOf(WALK, id)]),
        arcName(WALK, id),
        isBack(WALK, id) ? "역방향" : "정방향",
        String(before.res[id]),
      ]);
    }
    const r1 = S.find((x) => x.kind === "bfs" && x.round === 1) as Step;
    return [
      md(
        [
          "정점",
          "레벨",
          "레벨을 적게 한 항목",
          "항목의 방향",
          "그 항목의 잔여",
        ],
        rows,
        [1, 4],
      ),
      "",
      `라운드 2 에서 정점 1 의 레벨은 ${s.level[1]} 이고, 마지막에 지난 항목이 역방향 항목입니다. 라운드 1 에서 정점 1 의 레벨은 ${r1.level[1]} 이었습니다.`,
    ].join("\n");
  },

  /** 라운드마다 레벨 그래프에 남긴 항목과 뺀 항목. */
  levelEdges: () => {
    const bfsSteps = S.filter((s) => s.kind === "bfs");
    const rows = bfsSteps.map((s) => {
      const positive = s.res.flatMap((x, id) => (x > 0 ? [id] : []));
      const kept = levelArcs(WALK, s);
      const paths = allPaths(WALK, kept, WALK_SOURCE, WALK_SINK);
      return {
        s,
        row: [
          `라운드 ${s.round}`,
          String(s.level[WALK_SINK]),
          String(positive.length),
          kept.map((id) => arcName(WALK, id)).join(" · "),
          String(positive.length - kept.length),
          String(paths.length),
        ],
        paths,
      };
    });
    const allLen = rows.every((r) =>
      r.paths.every((p) => p.length - 1 === r.s.level[WALK_SINK]),
    );
    return [
      md(
        [
          "라운드",
          "싱크의 레벨",
          "잔여가 양수인 항목",
          "레벨 그래프에 남긴 항목",
          "뺀 항목",
          "소스→싱크 경로 수",
        ],
        rows.map((r) => r.row),
        [1, 2, 4, 5],
      ),
      "",
      `두 라운드 ${allLen ? "모두" : "중 일부만"} 레벨 그래프의 소스→싱크 경로가 전부 싱크의 레벨만큼 간선을 지납니다.`,
    ].join("\n");
  },

  /** 라운드 1 의 BFS 트리와 레벨 그래프. */
  levelVsTree: () => {
    const s = S.find((x) => x.kind === "bfs" && x.round === 1) as Step;
    const tree = s.found;
    const kept = levelArcs(WALK, s);
    const tp = allPaths(WALK, tree, WALK_SOURCE, WALK_SINK);
    const lp = allPaths(WALK, kept, WALK_SOURCE, WALK_SINK);
    return [
      md(
        ["모양", "항목 수", "소스→싱크 경로 목록", "경로 수"],
        [
          [
            "BFS 트리",
            String(tree.length),
            tp.map(route).join(" · "),
            String(tp.length),
          ],
          [
            "레벨 그래프",
            String(kept.length),
            lp.map(route).join(" · "),
            String(lp.length),
          ],
        ],
        [1, 3],
      ),
      "",
      `BFS 트리에는 소스→싱크 경로가 ${tp.length} 개이고 레벨 그래프에는 ${lp.length} 개입니다. 레벨 그래프의 경로는 모두 간선 ${s.level[WALK_SINK]} 개를 지납니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 단계 ─────────────── */

  /** 1단계 — 정점마다의 목록. */
  stageBuild: () => {
    const s0 = S[0] as Step;
    const entry = (id: number) => `${arcName(WALK, id)} 잔여 ${s0.res[id]}`;
    const rows = W.lists.map((ids, v) => [
      String(v),
      ids
        .filter((id) => !isBack(WALK, id))
        .map(entry)
        .join(" · ") || "없음",
      ids
        .filter((id) => isBack(WALK, id))
        .map(entry)
        .join(" · ") || "없음",
      String(ids.length),
    ]);
    const total = W.lists.reduce((a, l) => a + l.length, 0);
    return [
      md(["정점", "정방향 항목", "역방향 항목", "목록 길이"], rows, [3]),
      "",
      `목록 길이의 합은 ${total} 이고 간선 ${WALK.length} 개의 두 배입니다. 역방향 항목 ${WALK.length} 개는 모두 잔여 0 으로 시작합니다.`,
    ].join("\n");
  },

  /** 2단계 — 라운드 1 · 2 의 BFS. */
  stageBfs: () => {
    const rows: string[][] = [];
    const used: number[] = [];
    for (const s of S.filter((x) => x.kind === "bfs")) {
      let n = 0;
      for (const [i, u] of s.queue.entries()) {
        const got = s.found.filter((id) => tailOf(WALK, id) === u);
        n += got.filter((id) => isBack(WALK, id)).length;
        rows.push([
          i === 0 ? `라운드 ${s.round}` : "",
          String(u),
          got.length === 0
            ? "없음"
            : got
                .map(
                  (id) =>
                    `${headOf(WALK, id)} 에 ${s.level[headOf(WALK, id)]} (${arcName(WALK, id)}${isBack(WALK, id) ? " 역방향" : ""})`,
                )
                .join(" · "),
          list(s.queue.slice(i + 1)),
        ]);
      }
      used.push(n);
    }
    return [
      md(
        ["라운드", "꺼낸 정점", "레벨을 적은 정점 (지난 항목)", "꺼낸 뒤 큐"],
        rows,
      ),
      "",
      `레벨을 적으며 지난 역방향 항목은 라운드 1 에서 ${used[0]} 개, 라운드 2 에서 ${used[1]} 개입니다.`,
    ].join("\n");
  },

  /** 3단계 — 첫 증가 경로의 항목마다 잔여가 어떻게 바뀌는가. */
  stagePath: () => {
    const i = S.findIndex((s) => s.kind === "path");
    const s = S[i] as Step;
    const b = S[i - 1] as Step;
    const pair = (id: number) => (id < W.E ? id + W.E : id - W.E);
    const rows = s.arcs.map((id) => [
      arcName(WALK, id),
      `${s.level[tailOf(WALK, id)]} → ${s.level[headOf(WALK, id)]}`,
      `${b.res[id]} → ${s.res[id]}`,
      `${arcName(WALK, pair(id))} ${b.res[pair(id)]} → ${s.res[pair(id)]}`,
    ]);
    return [
      md(["지난 항목", "레벨", "그 항목의 잔여", "짝 항목의 잔여"], rows),
      "",
      `병목은 ${bottleneckExpr(W, i)} 이고, 경로의 항목 ${s.arcs.length} 개가 모두 잔여가 ${s.add} 줄고 짝의 잔여가 ${s.add} 늘었습니다.`,
    ].join("\n");
  },

  /** 4단계 — 라운드마다 경로를 보내다 0 이 올라올 때까지. */
  stageBlock: () => {
    const rows: string[][] = [];
    for (const [i, s] of S.entries()) {
      if (s.kind !== "path" && s.kind !== "exhaust") continue;
      const b = S[i - 1] as Step;
      const sat = s.arcs.filter(
        (id) => (s.res[id] as number) === 0 && (b.res[id] as number) > 0,
      );
      rows.push([
        tOf(i),
        `라운드 ${s.round}`,
        s.kind === "path"
          ? route(s.path)
          : `0 이 올라온다 (들어간 정점 ${route(s.entered)})`,
        s.kind === "path" ? bottleneckExpr(W, i) : "-",
        s.kind === "path"
          ? sat.map((id) => arcName(WALK, id)).join(" · ")
          : "-",
        String(s.total),
      ]);
    }
    const rs = roundsOf(W).filter((r) => r.paths.length > 0);
    return [
      md(
        [
          "걸음",
          "라운드",
          "증가 경로",
          "병목",
          "잔여가 0 이 된 항목",
          "누적 유량",
        ],
        rows,
        [5],
      ),
      "",
      `라운드 1 은 경로 ${rs[0]?.paths.length} 개, 라운드 2 는 경로 ${rs[1]?.paths.length} 개를 보낸 뒤 0 이 올라와 끝납니다. 역방향 항목을 지난 경로는 라운드 2 의 ${rs[1]?.usedBack} 개입니다.`,
    ].join("\n");
  },

  /** 4단계 — 라운드 1 동안 iter 가 지나온 자리. */
  stageIter: () => {
    const idx = roundSteps(W, 1);
    let backward = 0;
    const rows = W.lists.map((ids, v) => {
      const seq = idx.map((i) => (S[i] as Step).iter[v] as number);
      for (let j = 1; j < seq.length; j++)
        if ((seq[j] as number) < (seq[j - 1] as number)) backward++;
      const uniq = seq.filter((x, j) => j === 0 || x !== seq[j - 1]);
      return [String(v), String(ids.length), route(uniq), String(seq.at(-1))];
    });
    const sum = R1.iter.reduce((a, x) => a + x, 0);
    const lens = W.lists.reduce((a, l) => a + l.length, 0);
    return [
      md(
        ["정점", "목록 길이", "라운드 1 동안 iter", "라운드 1 이 끝날 때"],
        rows,
        [1, 3],
      ),
      "",
      `라운드 1 이 끝날 때 iter 의 합은 ${sum} 이고 목록 길이의 합 ${lens}${을를(String(lens))} 넘지 않습니다. 자리를 앞으로 되돌린 정점은 ${backward} 개입니다.`,
    ].join("\n");
  },

  /** 5단계 — 라운드마다 레벨이 붙은 정점. */
  stageStop: () => {
    const heads = S.filter((s) => s.kind === "bfs" || s.kind === "end");
    const rows = heads.map((s) => [
      `라운드 ${s.round}`,
      levels(s.level),
      set(s.level.flatMap((l, v) => (l >= 0 ? [v] : []))),
      s.kind === "end" ? "반복을 끝낸다" : "증가 경로를 찾는다",
    ]);
    return [
      md(["라운드", "level", "레벨이 붙은 정점", "다음 일"], rows),
      "",
      `라운드 ${last.round} 에서 싱크 ${WALK_SINK} 에 레벨이 붙지 않아 반복이 끝납니다. 라운드 수 ${last.round}${은는(String(last.round))} 정점 수 ${WALK_N} 보다 작습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** 1. 간선 하나를 두 항목으로 — 목록을 그대로 찍는다. */
  walkGraph: () => {
    const s0 = S[0] as Step;
    const lines = W.lists.map(
      (ids, v) =>
        `graph[${v}] = [ ${ids.map((id) => `{to:${headOf(WALK, id)}, cap:${s0.res[id]}, rev:${W.revAt[id]}}`).join(", ")} ]`,
    );
    const total = W.lists.reduce((a, l) => a + l.length, 0);
    return [...lines, `항목 ${total} 개 = 간선 ${WALK.length} 개 × 2`].join(
      "\n",
    );
  },

  /** 2. BFS — 큐에서 꺼낸 차례와 적은 레벨. */
  walkBfs: () => {
    const s = S[1] as Step;
    const s0 = S[0] as Step;
    const rows: string[][] = [];
    const seen = new Set<number>([WALK_SOURCE]);
    for (const [i, u] of s.queue.entries()) {
      const got = s.found.filter((id) => tailOf(WALK, id) === u);
      const skip = (W.lists[u] ?? [])
        .filter((id) => (s0.res[id] as number) > 0 && !got.includes(id))
        .map((id) => headOf(WALK, id))
        .filter((v) => seen.has(v));
      for (const id of got) seen.add(headOf(WALK, id));
      const wrote = got.map(
        (id) => `${headOf(WALK, id)} 에 ${s.level[headOf(WALK, id)]}`,
      );
      const had = skip.map((v) => `${v}${은는(String(v))} 이미 ${s.level[v]}`);
      rows.push([
        `${u}${을를(String(u))} 꺼낸다`,
        [...wrote, ...had].join(" · ") || "잔여가 있는 항목이 없다",
        `큐 ${list(s.queue.slice(i + 1))}`,
      ]);
    }
    return [...columns(rows), `level = ${levels(s.level)}`].join("\n");
  },

  /** 3. DFS — 라운드 1 에서 조각만 두 번 부른 결과. */
  walkDfs: () => {
    const rows: string[][] = [];
    for (const [i, s] of S.entries()) {
      if (s.kind !== "path" || s.round !== 1) continue;
      const b = S[i - 1] as Step;
      const hops = s.arcs.map((id, j) =>
        j === 0
          ? `${s.path[0]} →(${b.res[id]})→ ${headOf(WALK, id)}`
          : `→(${b.res[id]})→ ${headOf(WALK, id)}`,
      );
      rows.push([
        `${rows.length + 1} 번째`,
        hops.join(" "),
        `병목 ${s.add}`,
        s.arcs.map((id) => `${arcName(WALK, id)} ${s.res[id]}`).join(" · "),
      ]);
    }
    return [...columns(rows), `누적 유량 ${R1.total}`].join("\n");
  },

  /** 짚고 가기 — 레벨 조건을 느슨하게 바꾼 변이. */
  looseLevel: () => {
    const cases = [
      { label: NAME.varied, n: VARIED_N, edges: VARIED, sink: 3 },
      { label: NAME.bridge, n: BRIDGE_N, edges: BRIDGE, sink: 3 },
      { label: NAME.walk, n: WALK_N, edges: WALK, sink: WALK_SINK },
    ];
    return md(
      ["입력", "정본", "레벨이 있기만 하면 내려가는 판", "판정"],
      cases.map((c) => {
        const ok = String(maxFlow(c.n, c.edges, 0, c.sink).flow);
        const ng = runOrFail(
          () => looseLevel.maxFlow(c.n, c.edges, 0, c.sink).flow,
        );
        return [c.label, ok, ng, verdict(ok, ng)];
      }),
      [1],
    );
  },

  /** 레벨 조건을 뺐을 때 재귀가 되풀이하는 정점 자취. */
  looseCycle: () => {
    const tail = looseTrace(WALK_N, WALK, WALK_SOURCE, WALK_SINK, 400);
    if (tail.length === 0)
      throw new Error("깊이 상한에 안 걸렸다 — 「끝나지 않는다」가 거짓이다");
    return [
      md(
        ["자취", "정점"],
        [
          ["재귀가 마지막으로 들어간 정점 열두 개", route(tail)],
          ["되풀이하는 마디", route([...tail.slice(0, 4), tail[0] as number])],
        ],
      ),
      "",
      "재귀 깊이를 400 에서 잘랐고, 그때까지 같은 마디가 되풀이됐습니다.",
    ].join("\n");
  },

  /** 4. iter — 라운드 1 에서 정점마다 지나온 자리(목록의 몇 번째 항목인가). */
  walkIter: () => {
    const idx = roundSteps(W, 1);
    const rows = W.lists.map((ids, v) => {
      const seq = idx.map((i) => (S[i] as Step).iter[v] as number);
      const uniq = seq.filter((x, j) => j === 0 || x !== seq[j - 1]);
      return [
        `iter[${v}]`,
        route(uniq),
        `목록 ${ids.map((id) => `${arcName(WALK, id)}${isBack(WALK, id) ? "(역)" : ""}`).join(" · ")}`,
      ];
    });
    return [...columns(rows)].join("\n");
  },

  /** 짚고 가기 — `iter` 를 언제 0 으로 초기화하는가로 갈리는 것. */
  iterThree: () => {
    const round = countedDinic(WALK_N, WALK, 0, WALK_SINK, {
      iterMode: "round",
    });
    const call = countedDinic(WALK_N, WALK, 0, WALK_SINK, {
      iterMode: "call",
    });
    const never = countedDinic(WALK_N, WALK, 0, WALK_SINK, {
      iterMode: "never",
      roundCap: 20,
    });
    return [
      md(
        ["iter 를 0 으로 두는 때", "유량", "항목 검사", "BFS 횟수"],
        [
          [
            "라운드가 바뀔 때만 (정본)",
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
            "한 번도 안 둔다",
            String(never.flow),
            comma(never.looks),
            never.capped ? "20 에서 잘랐다" : String(never.rounds.length),
          ],
        ],
        [1, 2],
      ),
      "",
      `DFS 를 부를 때마다 0 으로 두면 유량은 ${call.flow}${으로(String(call.flow))} 정본과 같고 항목 검사만 ${comma(round.looks)} 에서 ${comma(call.looks)}${으로(comma(call.looks))} 늘어납니다. 한 번도 안 두면 유량이 ${never.flow} 에서 멈춘 채 반복이 끝나지 않습니다.`,
    ].join("\n");
  },

  /** 5. 라운드마다 레벨과 보낸 경로. */
  walkRounds: () => {
    const rows: string[][] = [];
    for (const r of roundsOf(W)) {
      const head = S.find((s) => s.round === r.round) as Step;
      if (r.paths.length === 0) {
        rows.push([String(r.round), levels(head.level), "없음", "-", "-"]);
        continue;
      }
      const ps = S.filter((s) => s.kind === "path" && s.round === r.round);
      for (const [j, p] of ps.entries()) {
        const nb = p.arcs.filter((id) => id >= W.E).length;
        rows.push([
          j === 0 ? String(r.round) : "",
          j === 0 ? levels(head.level) : "",
          route(p.path),
          String(p.add),
          nb === 0 ? "안 지난다" : `${nb} 개 지난다`,
        ]);
      }
    }
    return md(
      ["라운드", "level", "보낸 경로", "병목", "역방향 항목"],
      rows,
      [0, 3],
    );
  },

  /** 5. 아홉 걸음 전부 — 실행한 갈래 · 레벨 · 정방향 잔여 · 양수인 역방향 잔여 · 누적. */
  walkTrace: () => {
    const what: Record<StepKind, string> = {
      build: "잔여 그래프를 만든다",
      bfs: "BFS 로 레벨을 적는다",
      path: "증가 경로에 보낸다",
      exhaust: "0 이 올라온다",
      end: "싱크에 레벨이 없다",
    };
    const rows = S.map((s, i) => [
      tOf(i),
      s.kind === "build"
        ? what.build
        : s.kind === "path"
          ? `라운드 ${s.round} · ${route(s.path)}`
          : `라운드 ${s.round} · ${what[s.kind]}`,
      LABELS.filter((l) => s.hits[l] > 0)
        .map((l) => `${l} ${s.hits[l]}`)
        .join(" · ") || "-",
      levels(s.level),
      s.res.slice(0, W.E).join(", "),
      s.res
        .slice(W.E)
        .flatMap((x, k) => (x > 0 ? [`${arcName(WALK, W.E + k)} ${x}`] : []))
        .join(" · ") || "없음",
      String(s.total),
    ]);
    const looks = S.reduce((a, s) => a + s.looks, 0);
    return [
      md(
        [
          "걸음",
          "하는 일",
          "실행한 갈래와 횟수",
          "level",
          `정방향 잔여 (${WALK.map(([u, v]) => `${u}→${v}`).join(", ")})`,
          "양수인 역방향 잔여",
          "누적 유량",
        ],
        rows,
        [6],
      ),
      "",
      `걸음 ${S.length} 개에서 항목을 읽은 횟수는 모두 ${looks} 번이고, 반환값은 { flow: ${last.total} } 입니다.`,
    ].join("\n");
  },

  /** 5. 갈래마다 실행 횟수와 걸음. */
  branchCoverage: () => {
    const rows = LABELS.map((l) => {
      const at = S.flatMap((s, i) => (s.hits[l] > 0 ? [tOf(i)] : []));
      const n = S.reduce((a, s) => a + s.hits[l], 0);
      return [l, LABEL_TEXT[l], String(n), at.join(" · ")];
    });
    const all = LABELS.every((l) => S.some((s) => s.hits[l] > 0));
    return [
      md(["라벨", "하는 일", "실행 횟수", "실행한 걸음"], rows, [2]),
      "",
      `여섯 갈래가 ${all ? "모두" : "모두는 아니게"} 한 번 이상 실행됐습니다. 역방향 항목으로 유량을 보낸 걸음은 ${tOf(BACK_PATH)} 하나입니다.`,
    ].join("\n");
  },

  /** 6. 전체 코드를 여러 입력에 실행한 결과. */
  walkResult: () => {
    const cases: { call: string; run: () => number }[] = [
      {
        call: "maxFlow(6, [[0,1,4],[1,2,2],[2,5,2],[0,3,3],[3,2,4],[1,4,5],[4,5,3]], 0, 5)",
        run: () => maxFlow(WALK_N, WALK, 0, WALK_SINK).flow,
      },
      {
        call: "maxFlow(4, [[0,1,3],[0,2,2],[1,2,1],[1,3,2],[2,3,3]], 0, 3)",
        run: () => maxFlow(VARIED_N, VARIED, 0, 3).flow,
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
    return [
      ...columns(
        cases.map((c) => [c.call, "→", `{ flow: ${comma(c.run())} }`]),
      ),
    ].join("\n");
  },

  /* ─────────────── related ─────────────── */

  /** 마지막 BFS 가 도달한 정점 집합과 그 경계 간선. */
  minCut: () => {
    const inS = new Set(last.level.flatMap((l, v) => (l >= 0 ? [v] : [])));
    const sSide = [...inS].sort((a, b) => a - b);
    const tSide = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => !inS.has(v),
    );
    const cross = WALK.flatMap(([u, v, c], k) =>
      inS.has(u) && !inS.has(v) ? [{ u, v, c, f: last.flow[k] as number }] : [],
    );
    const backCross = WALK.filter(([u, v]) => !inS.has(u) && inS.has(v));
    const cap = cross.reduce((a, e) => a + e.c, 0);
    const rows = [
      ["소스 쪽 정점 (마지막 BFS 가 도달한 정점)", set(sSide)],
      ["싱크 쪽 정점", set(tSide)],
      ...cross.map((e) => [
        `경계 간선 ${e.u}→${e.v}`,
        `용량 ${e.c} · 유량 ${e.f}`,
      ]),
      ["경계 간선 용량의 합 (컷의 용량)", String(cap)],
      ["최대 유량", String(maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow)],
    ];
    const saturated = cross.every((e) => e.f === e.c);
    return [
      md(["컷의 구성", "전개 입력의 마지막 BFS 에서"], rows),
      "",
      `컷의 용량 ${cap}${과와(String(cap))} 최대 유량 ${last.total}${이가(String(last.total))} 같습니다. 경계 간선 ${cross.length} 개가 ${saturated ? "모두" : "모두는 아니게"} 용량만큼 차 있고, 싱크 쪽에서 소스 쪽으로 가는 원래 간선은 ${backCross.length} 개입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** f = 0 에서 정의대로 센 거리와 코드의 level. */
  mathCheck: () => {
    const s0 = S[0] as Step;
    const r1 = S[1] as Step;
    // 정의대로 — 잔여가 양수인 항목을 길이 1 로 두고 모든 쌍 최단 거리(플로이드–워셜)를 구한다.
    const INF = Number.POSITIVE_INFINITY;
    const d: number[][] = Array.from({ length: WALK_N }, (_, i) =>
      Array.from({ length: WALK_N }, (_, j) => (i === j ? 0 : INF)),
    );
    for (let id = 0; id < 2 * W.E; id++) {
      if ((s0.res[id] as number) > 0)
        (d[tailOf(WALK, id)] as number[])[headOf(WALK, id)] = 1;
    }
    for (let k = 0; k < WALK_N; k++)
      for (let i = 0; i < WALK_N; i++)
        for (let j = 0; j < WALK_N; j++) {
          const via = (d[i]?.[k] as number) + (d[k]?.[j] as number);
          if (via < (d[i]?.[j] as number)) (d[i] as number[])[j] = via;
        }
    let same = 0;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const df = d[WALK_SOURCE]?.[v] as number;
      const code = r1.level[v] as number;
      const shown = df === INF ? "∞" : String(df);
      const ok = (df === INF && code === -1) || df === code;
      if (ok) same++;
      return [String(v), shown, String(code), ok ? "일치" : "불일치"];
    });
    const lf = levelArcs(WALK, r1).length;
    return [
      md(
        ["정점 v", "정의대로 센 d_f(v)", "코드의 level[v]", "대조"],
        rows,
        [1, 2],
      ),
      "",
      `여섯 정점 중 ${same} 개가 일치합니다. f = 0 이면 원래 간선의 c_f 는 용량 그대로이고 역방향은 0 이라, L_f 에 드는 항목은 원래 간선 ${lf} 개입니다.`,
    ].join("\n");
  },

  /** 규모의 상한을 식에 넣는다. */
  mathScale: () => {
    const rounds = V_MAX - 1;
    const perRound = V_MAX * E_MAX + (V_MAX + E_MAX);
    const dinic = rounds * perRound;
    const ek = V_MAX * E_MAX * E_MAX;
    return [
      md(
        ["식", "V = 500 · E = 10,000 에서"],
        [
          ["라운드 수의 상한 V − 1", comma(rounds)],
          ["라운드 하나의 상한 V · E + (V + E)", comma(perRound)],
          ["곱 (V − 1) · (V · E + V + E)", comma(dinic)],
          ["경로마다 BFS 를 다시 하는 절차의 상한 V · E²", comma(ek)],
        ],
        [1],
      ),
      "",
      `디닉의 상한은 ${comma(dinic)} 이고, 경로마다 BFS 를 다시 하는 절차의 상한은 ${comma(ek)} 이라 자릿수가 ${String(ek).length - String(dinic).length} 개 더 붙습니다.`,
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** 간선 1→2 의 두 잔여 — 걸음마다. 그리고 일곱 쌍 × 아홉 걸음 전부. */
  invariantPair: () => {
    const k = WALK.findIndex(([u, v]) => u === 1 && v === 2);
    const c = (WALK[k] as Edge)[2];
    const rows = S.map((s, i) => [
      tOf(i),
      String(s.res[k]),
      String(s.res[W.E + k]),
      String((s.res[k] as number) + (s.res[W.E + k] as number)),
    ]);
    let checked = 0;
    let bad = 0;
    for (const s of S)
      WALK.forEach(([, , cap], j) => {
        checked++;
        if ((s.res[j] as number) + (s.res[W.E + j] as number) !== cap) bad++;
      });
    return [
      md(["걸음", "cap(1,2)", "cap(2,1)", "합"], rows, [1, 2, 3]),
      "",
      `간선 1→2 의 두 잔여는 걸음 ${S.length} 개 모두에서 합이 처음 용량 ${c}${과와(String(c))} 같습니다. 간선 ${WALK.length} 개 × 걸음 ${S.length} 개 = ${checked} 곳을 모두 재면 합이 처음 용량과 어긋난 곳은 ${bad} 곳입니다.`,
    ].join("\n");
  },

  /** 역방향 항목을 지난 걸음 앞뒤로 정점마다 들어온 양과 나간 양. */
  invariantConserve: () => {
    const a = S[BACK_PATH - 1] as Step;
    const b = S[BACK_PATH] as Step;
    const x = inOut(WALK_N, WALK, a.flow);
    const y = inOut(WALK_N, WALK, b.flow);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      v === WALK_SOURCE
        ? `${v} (소스)`
        : v === WALK_SINK
          ? `${v} (싱크)`
          : String(v),
      `${x.inn[v]} → ${y.inn[v]}`,
      `${x.out[v]} → ${y.out[v]}`,
    ]);
    const mids = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => v !== WALK_SOURCE && v !== WALK_SINK,
    );
    const kept = mids.every(
      (v) => x.inn[v] === x.out[v] && y.inn[v] === y.out[v],
    );
    const from = x.out[WALK_SOURCE] as number;
    const to = y.inn[WALK_SINK] as number;
    return [
      md(
        [
          "정점",
          `들어온 유량 (${tOf(BACK_PATH - 1)} → ${tOf(BACK_PATH)})`,
          `나간 유량 (${tOf(BACK_PATH - 1)} → ${tOf(BACK_PATH)})`,
        ],
        rows,
      ),
      "",
      `중간 정점 ${mids.length} 개는 ${tOf(BACK_PATH)} 앞뒤 ${kept ? "모두" : "모두는 아니게"} 들어온 양과 나간 양이 같고, 소스가 내보낸 양과 싱크가 받은 양은 ${from} 에서 ${to}${으로(String(to))} 늘었습니다.`,
    ].join("\n");
  },

  /** 경계에 있는 입력들. */
  invariantEdges: () => {
    const cases: { input: string; where: string; run: () => number }[] = [
      {
        input: "간선 없음 `maxFlow(2, [], 0, 1)`",
        where: "첫 BFS 가 소스만 보고 끝난다",
        run: () => maxFlow(2, [], 0, 1).flow,
      },
      {
        input: "경로 없음 `maxFlow(3, [[0,1,5]], 0, 2)`",
        where: "`level[2]` 가 `-1` 이라 첫 라운드에서 끝난다",
        run: () => maxFlow(3, [[0, 1, 5]], 0, 2).flow,
      },
      {
        input: "정점 둘 `maxFlow(2, [[0,1,1]], 0, 1)`",
        where: "라운드 하나에 경로 하나",
        run: () => maxFlow(2, [[0, 1, 1]], 0, 1).flow,
      },
      {
        input: "용량 0 인 간선 `[[0,1,0],[0,2,5],[2,1,5]]`",
        where: "`cap > 0` 이 거짓이라 BFS 가 그 항목을 안 지난다",
        run: () =>
          maxFlow(
            3,
            [
              [0, 1, 0],
              [0, 2, 5],
              [2, 1, 5],
            ],
            0,
            1,
          ).flow,
      },
      {
        input: "평행 간선 `[[0,1,5],[0,1,7]]`",
        where: "항목 쌍이 둘이라 각각 따로 찬다",
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
        input: "자기 루프 `[[0,0,100],[0,1,5]]`",
        where:
          "`level[0]` 이 이미 0 이라 BFS 가 안 지나고, DFS 도 레벨 조건에서 거른다",
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
        input: "용량 상한 `[[0,1,1e6],[1,2,1e6]]`",
        where: "병목이 한 번에 다 보내진다",
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
      {
        input: "소스와 싱크가 같다 `maxFlow(2, [[0,1,5]], 0, 0)`",
        where: "첫 줄이 0 을 돌려준다",
        run: () => maxFlow(2, [[0, 1, 5]], 0, 0).flow,
      },
    ];
    return md(
      ["입력", "처리되는 자리", "정본의 결과"],
      cases.map((c) => [c.input, c.where, `\`{ flow: ${c.run()} }\``]),
    );
  },

  /** 역방향 잔여 용량을 안 늘리는 변이. */
  mutantBackflow: () =>
    md(
      ["입력", "정본", "역방향을 안 늘리는 판", "판정"],
      backRows.map((r) => [
        r.label,
        comma(r.ok),
        comma(r.ng),
        verdict(String(r.ok), String(r.ng)),
      ]),
      [1, 2],
    ),

  /** 변이가 걸린 판에서 간선 1→2 의 두 잔여와 라운드 2. */
  mutantPair: () => {
    const k = WALK.findIndex(([u, v]) => u === 1 && v === 2);
    const bs = BACK_TRACE.steps;
    const r1 = bs.find((s) => s.kind === "exhaust") as Step;
    const r2 = bs.find((s) => s.round === 2) as Step;
    const fwd = r1.res[k] as number;
    const bwd = r1.res[BACK_TRACE.E + k] as number;
    return md(
      [
        "시점",
        "cap(1,2)",
        "cap(2,1)",
        "두 잔여의 합",
        "라운드 2 의 level",
        "최종 유량",
      ],
      [
        [
          "라운드 1 이 끝난 뒤",
          String(fwd),
          String(bwd),
          String(fwd + bwd),
          levels(r2.level),
          String(BACK_TRACE.flow),
        ],
      ],
      [1, 2, 3, 5],
    );
  },

  /* ─────────────── perf ─────────────── */

  /** 전개 입력의 라운드별 항목 검사 횟수. */
  walkCost: () => {
    const rows: string[][] = [];
    for (let r = 1; r <= last.round; r++) {
      const idx = roundSteps(W, r);
      const steps = idx.map((i) => S[i] as Step);
      const bfs = steps
        .filter((s) => s.kind === "bfs" || s.kind === "end")
        .reduce((a, s) => a + s.looks, 0);
      const dfs = steps
        .filter((s) => s.kind === "path" || s.kind === "exhaust")
        .reduce((a, s) => a + s.looks, 0);
      rows.push([
        String(r),
        idx.map(tOf).join(" · "),
        String(bfs + dfs),
        String(bfs),
        String(dfs),
        String(steps.filter((s) => s.kind === "path").length),
      ]);
    }
    const sums = [2, 3, 4, 5].map((c) =>
      rows.reduce((a, r) => a + Number(r[c]), 0),
    );
    const sum = (c: number) => sums[c - 2] as number;
    rows.push(["합", "", ...sums.map(String)]);
    const check = countedDinic(WALK_N, WALK, 0, WALK_SINK).looks;
    const entries = W.lists.reduce((a, l) => a + l.length, 0);
    return [
      md(
        ["라운드", "걸음", "항목 검사", "그중 BFS", "그중 DFS", "보낸 경로 수"],
        rows,
        [2, 3, 4, 5],
      ),
      "",
      `합 ${sum(2)}${은는(String(sum(2)))} 계수만 세는 사본이 낸 값 ${check}${과와(String(check))} 같습니다. 라운드 1 · 2 의 BFS 는 항목 ${entries} 개를 한 번씩 읽었고, 라운드 ${last.round} 의 BFS 는 싱크의 목록을 안 읽어 ${last.looks} 번입니다.`,
    ].join("\n");
  },

  /** 라운드를 가장 많이 만드는 입력 — 계단 그래프. */
  worstRounds: () => {
    const rows = [3, 5, 50, 200, V_MAX - 1].map((m) => {
      const s = stair(m);
      const run = countedDinic(s.n, s.edges, 0, s.sink);
      return [
        comma(m),
        comma(s.n),
        comma(s.edges.length),
        comma(run.rounds.filter((r) => r.paths > 0).length),
        comma(s.n - 1),
        comma(run.looks),
      ];
    });
    const full = rows.every((r) => r[3] === r[4]);
    return [
      md(
        [
          "계단 층수 m",
          "정점 V",
          "간선 E",
          "유량을 보낸 라운드",
          "상한 V − 1",
          "항목 검사",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `다섯 줄 ${full ? "모두" : "중 일부만"} 유량을 보낸 라운드가 상한 V − 1 과 같습니다.`,
    ].join("\n");
  },

  /** 규모의 상한에서 두 축을 함께 키운 입력. */
  worstScale: () => {
    const runs = [0, 1_000, 5_000, 9_000].map((extra) => {
      const s = stair(V_MAX - 1, extra);
      return { extra, s, run: countedDinic(s.n, s.edges, 0, s.sink) };
    });
    const g = grid(20, 10);
    const gr = countedDinic(g.n, g.edges, 0, g.sink);
    const rows = runs.map((r) => [
      r.extra === 0 ? "계단만" : `계단 + 뒤로 가는 간선 ${comma(r.extra)} 개`,
      comma(r.s.n),
      comma(r.s.edges.length),
      comma(r.run.rounds.length),
      comma(r.run.looks),
    ]);
    rows.push([
      "격자 20 × 10",
      comma(g.n),
      comma(g.edges.length),
      comma(gr.rounds.length),
      comma(gr.looks),
    ]);
    const big = runs.at(-1) as (typeof runs)[number];
    const bound = (V_MAX - 1) * (V_MAX * E_MAX + V_MAX + E_MAX);
    const pct = ((big.run.looks / bound) * 100).toFixed(1);
    return [
      md(
        ["입력", "정점 V", "간선 E", "BFS 횟수", "항목 검사"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `가장 큰 계단의 항목 검사는 ${comma(big.run.looks)} 번이고 격자의 ${comma(Math.round(big.run.looks / gr.looks))} 배입니다. 정점은 ${(big.s.n / g.n).toFixed(1)} 배, 간선은 ${(big.s.edges.length / g.edges.length).toFixed(1)} 배이고 BFS 횟수는 ${comma(big.run.rounds.length)} 번 대 ${comma(gr.rounds.length)} 번입니다. 이 값은 상한 ${comma(bound)} 의 ${pct} % 입니다.`,
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 간선 4→5 의 용량이 5 라면. */
  selfcheckCap45: () => {
    const edges: Edge[] = WALK.map(
      ([u, v, c]) => [u, v, u === 4 && v === 5 ? 5 : c] as Edge,
    );
    const tr = trace(WALK_N, edges, WALK_SOURCE, WALK_SINK);
    const rows: string[][] = [];
    for (const [i, s] of tr.steps.entries()) {
      if (s.kind !== "path") continue;
      rows.push([
        `라운드 ${s.round}`,
        route(s.path),
        bottleneckExpr(tr, i),
        String(s.total),
      ]);
    }
    const ref = maxFlow(WALK_N, edges, WALK_SOURCE, WALK_SINK).flow;
    return [
      md(["라운드", "보낸 경로", "병목", "누적 유량"], rows, [3]),
      "",
      `최종 유량은 ${tr.flow} 이고 정본이 같은 입력에 낸 값도 ${ref} 입니다.`,
    ].join("\n");
  },
};
