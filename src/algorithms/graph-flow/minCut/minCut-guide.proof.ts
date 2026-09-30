/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/minCut/minCut-guide.md
 *
 * **최대 유량은 `maxFlow` 편의 정본이 낸다.** 이 편의 정본은 `maxFlow` 정본의 디닉 절차를 그대로 옮기고
 * 끝만 바꾼 것이라(유량을 돌려주는 대신 반복을 끝내고 컷을 더한다), 「컷 용량 = 최대 유량」을 보이는 자리의
 * 유량 칸은 그 정본에 직접 묻는다. 두 정본이 어느 줄에서 갈리는지도 소스를 읽어 기계로 낸다(`walkDiff`).
 *
 * **계수를 세는 사본이 둘 있다.** 정본은 걸음마다의 상태나 계수를 내보내지 않는다.
 *
 * - `trace` — 걸음마다 레벨 · `iter` · 항목 18 개의 잔여 용량을 통째로 적는다. 작은 입력에만 쓴다.
 *   걸음마다 전체를 베끼므로 큰 입력에 쓰면 메모리가 모자란다.
 * - `countedLite` — 간선 검사 횟수와 라운드 수만 센다. 큰 입력(계단 · 격자)은 이쪽이다.
 *
 * 두 사본이 정본과 같은 답을 내는지는 이 파일이 읽힐 때 스스로 확인한다.
 *
 * **변이는 둘이다**(`noPush` · `noTargetCheck`). `check-proof` 는 이 파일을 한 번 더 부르면서 변이를 만들되
 * 적용하지 않은 중화 상태로 둔다. 중화 여부는 변이 모듈의 함수가 정본과 **같은 객체인가**로 알아내고,
 * 「변이가 답을 바꿨는가」를 스스로 확인하는 검사는 중화 상태에서 건너뛴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 이가 } from "../../../../tools/josa.ts";
import { maxFlow } from "../maxFlow/maxFlow-guide.ref.ts";
import { minCut } from "./minCut-guide.ref.ts";

export type Edge = [number, number, number];

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 네트워크. 정점 일곱 · 방향 간선 아홉이고 소스는 0, 싱크는 6 이다.
 *
 * 이 입력 하나로 컷 판정의 네 갈래가 전부 나온다 — 경계를 건너는 간선(`2 → 5` · `4 → 5`) ·
 * 소스 쪽 안에서만 오가는 간선(`0 → 1` 등 다섯) · 싱크 쪽에서 소스 쪽으로 들어오는 간선
 * (`5 → 3`) · 싱크 쪽 안에서만 오가는 간선(`5 → 6`).
 */
export const WALK_N = 7;
export const WALK_SOURCE = 0;
export const WALK_SINK = 6;
export const WALK: Edge[] = [
  [0, 1, 5],
  [1, 2, 3],
  [2, 5, 3],
  [0, 3, 4],
  [3, 2, 5],
  [1, 4, 6],
  [4, 5, 4],
  [5, 6, 12],
  [5, 3, 2],
];

/** `maxFlow` 편의 전개 입력 — 두 편의 수치가 맞는지 보는 데 쓴다. */
export const MF_N = 6;
export const MF: Edge[] = [
  [0, 1, 4],
  [1, 2, 2],
  [2, 5, 2],
  [0, 3, 3],
  [3, 2, 4],
  [1, 4, 5],
  [4, 5, 3],
];

/** 용량이 다른 다리 그래프(`maxFlow` 편과 같은 입력). 소스에서 나가는 두 간선이 그대로 컷이 된다. */
export const VARIED_N = 4;
export const VARIED: Edge[] = [
  [0, 1, 3],
  [0, 2, 2],
  [1, 2, 1],
  [1, 3, 2],
  [2, 3, 3],
];

/** 병목이 싱크 바로 앞에 있는 직렬 네트워크. */
export const TAIL_N = 4;
export const TAIL: Edge[] = [
  [0, 1, 100],
  [1, 2, 100],
  [2, 3, 1],
];

/** 다리 그래프(`maxFlow` 편과 같은 입력). 용량이 전부 1 이다. */
export const BRIDGE_N = 4;
export const BRIDGE: Edge[] = [
  [0, 1, 1],
  [0, 2, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 3, 1],
];

/** 소스에서 싱크로 가는 경로가 없다. */
export const CUTOFF_N = 3;
export const CUTOFF: Edge[] = [[0, 1, 10]];

/** 본문이 입력에 붙이는 이름. 표의 행 이름과 그림 제목이 같은 이름을 쓴다. */
export const NAME = {
  walk: "전개 입력",
  varied: "용량이 다른 다리 그래프",
  tail: "병목이 싱크 앞",
  bridge: "다리 그래프",
  cutoff: "경로 없음",
  empty: "간선 없음",
} as const;

export const V_MAX = 500;
export const E_MAX = 10_000;
export const C_MAX = 1_000_000;

interface Case {
  label: string;
  n: number;
  edges: Edge[];
  source: number;
  sink: number;
}

const WALK_CASE: Case = {
  label: NAME.walk,
  n: WALK_N,
  edges: WALK,
  source: WALK_SOURCE,
  sink: WALK_SINK,
};
const VARIED_CASE: Case = {
  label: NAME.varied,
  n: VARIED_N,
  edges: VARIED,
  source: 0,
  sink: 3,
};
const TAIL_CASE: Case = {
  label: NAME.tail,
  n: TAIL_N,
  edges: TAIL,
  source: 0,
  sink: 3,
};
const BRIDGE_CASE: Case = {
  label: NAME.bridge,
  n: BRIDGE_N,
  edges: BRIDGE,
  source: 0,
  sink: 3,
};
const CUTOFF_CASE: Case = {
  label: NAME.cutoff,
  n: CUTOFF_N,
  edges: CUTOFF,
  source: 0,
  sink: 2,
};
const EMPTY_CASE: Case = {
  label: NAME.empty,
  n: 2,
  edges: [],
  source: 0,
  sink: 1,
};

/**
 * 경로 길이가 1, 2, …, `m` 으로 서로 다른 계단 네트워크(`maxFlow` 편과 같은 생성식).
 *
 * 싱크로 들어가는 간선은 용량 1 이고 사슬은 다 지날 만큼 크다. 짧은 경로부터 한 라운드에
 * 하나씩만 소진되므로 라운드 수가 `m` 을 그대로 채운다.
 */
export function stair(m: number): { n: number; edges: Edge[]; sink: number } {
  const edges: Edge[] = [
    [0, m, 1],
    [0, 1, m],
  ];
  for (let i = 1; i <= m - 2; i++) edges.push([i, i + 1, m]);
  for (let i = 1; i <= m - 1; i++) edges.push([i, m, 1]);
  return { n: m + 1, edges, sink: m };
}

/** 계단에 「번호가 큰 정점에서 작은 쪽으로」 가는 간선을 덧붙인다. 라운드 수는 안 바뀐다. */
export function stairPlus(
  m: number,
  extra: number,
): { n: number; edges: Edge[]; sink: number } {
  const s = stair(m);
  const out = [...s.edges];
  let added = 0;
  for (let gap = 2; gap < m && added < extra; gap++) {
    for (let i = gap; i < m && added < extra; i++) {
      out.push([i, i - gap, 1]);
      added++;
    }
  }
  return { n: s.n, edges: out, sink: s.sink };
}

/** 격자 네트워크. 왼쪽 열이 소스 0 에, 오른쪽 열이 싱크 1 에 붙는다(`maxFlow` 편과 같은 생성식). */
export function grid(w: number, h: number): { n: number; edges: Edge[] } {
  const at = (r: number, c: number): number => r * w + c + 2;
  const edges: Edge[] = [];
  for (let r = 0; r < h; r++) {
    edges.push([0, at(r, 0), 100]);
    edges.push([at(r, w - 1), 1, 100]);
  }
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w - 1; c++) edges.push([at(r, c), at(r, c + 1), 10]);
  }
  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w; c++) {
      edges.push([at(r, c), at(r + 1, c), 5]);
      edges.push([at(r + 1, c), at(r, c), 5]);
    }
  }
  return { n: h * w + 2, edges };
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `1,868,253` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** `[0, 1, 2]` 꼴. */
export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `{0, 1, 2}` 꼴 — 정점 집합. */
export const set = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** `0 → 1 → 2` 꼴 — 경로. */
export const route = (xs: readonly number[]): string => xs.join(" → ");

/** 간선 이름 — `1→2`. */
export const edgeName = (e: readonly number[]): string => `${e[0]}→${e[1]}`;

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

/** 계사 「이며/며」. */
const 이며 = (n: number): string => josa(String(n), "이며", "며");

/* ────────────────────── 걸음을 통째로 적는 사본 ────────────────────── */

/** 정본 주석의 갈래 라벨. */
export type Label = "①" | "②" | "③" | "④" | "⑤" | "⑥" | "⑦";
export const LABELS: readonly Label[] = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

/** 갈래마다 하는 일 — 정본 주석을 줄인 말. 표와 걸음 재생 패널이 같은 말을 쓴다. */
export const LABEL_TEXT: Record<Label, string> = {
  "①": "잔여가 있고 레벨이 없는 정점에 레벨을 적는다",
  "②": "잔여가 있고 레벨이 한 칸 큰 항목으로 내려간다",
  "③": "싱크에 도착해 병목을 올려보낸다",
  "④": "짝지은 두 잔여 용량을 고친다",
  "⑤": "iter 를 한 칸 옮겨 다음 항목을 본다",
  "⑥": "싱크에 레벨이 없어 반복을 끝낸다",
  "⑦": "소스 쪽에서 싱크 쪽으로 건너가는 원래 간선의 용량을 더한다",
};

export type StepKind = "build" | "bfs" | "path" | "exhaust" | "end" | "cut";

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
  /** BFS 에서 레벨을 적게 한 항목. */
  readonly found: number[];
  /** 이 걸음에 유량을 보낸 경로의 정점과 항목. */
  readonly path: number[];
  readonly arcs: number[];
  readonly add: number;
  /** DFS 가 읽었지만 경로에 안 든 항목. */
  readonly read: number[];
  /** DFS 가 들어간 정점의 차례. */
  readonly entered: number[];
  /** 컷을 더한 걸음에서 더한 원래 간선 번호. */
  readonly crossed: number[];
  /** 컷을 더한 걸음의 컷 용량. */
  readonly cut: number;
  readonly hits: Record<Label, number>;
  /** 이 걸음의 간선 검사 — 잔여 그래프 항목을 읽은 것과 원래 간선을 읽은 것을 하나씩 센다. */
  readonly looks: number;
}

export interface Trace {
  readonly steps: Step[];
  readonly flow: number;
  readonly cut: number;
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
  "⑦": 0,
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
 * 정본과 같은 절차에 **걸음마다 상태를 적는 자리만** 덧붙인 사본. `noPush` 는 불변식 절의 「큐에 안
 * 넣는다」를 사본으로 재현할 때만 쓴다 — 그 답이 기계로 만든 변이의 답과 같은지 아래에서 확인한다.
 */
export function trace(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
  opt: { noPush?: boolean } = {},
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
      crossed: [],
      cut: 0,
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
          if (opt.noPush !== true) queue.push(e.to);
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
            back.cap += d;
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
  let cut = 0;
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
    const hits = zeroHits();
    const crossed: number[] = [];
    edges.forEach(([u, v, c], k) => {
      if ((level[u] as number) !== -1 && (level[v] as number) === -1) {
        cut += c;
        crossed.push(k);
        hits["⑦"]++;
      }
    });
    snap("cut", { crossed, cut, hits, looks: E });
  }
  return { steps, flow: total, cut, E, lists, revAt };
}

/** 전개 입력의 기록 — 그림 사이드카와 이 파일의 블록이 같은 기록을 쓴다. */
export const WALK_TRACE = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK);

/** 걸음 번호 `T#` — 첫 걸음이 T1 이다. */
export const tOf = (i: number): string => `T${i + 1}`;

/** 레벨이 적힌 정점 — 마지막 BFS 에서는 소스 쪽 무리. */
export const sideOf = (s: Step): number[] =>
  s.level.flatMap((l, v) => (l >= 0 ? [v] : []));

/* ────────────────────── 계수만 세는 사본 ────────────────────── */

/**
 * 걸음 기록을 남기지 않는 계수 사본 — 큰 입력은 이쪽이다. 간선 검사는 BFS · DFS 가 잔여 그래프 항목을
 * 읽은 횟수와 컷 합산이 원래 간선을 읽은 횟수의 합이다(잔여 그래프를 만드는 일은 판정 없이 넣기만 해서
 * 세지 않는다). `extraBfs` 는 짚고 가기의 「BFS 를 한 번 더 하는 판」이다.
 */
export function countedLite(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
  opt: { extraBfs?: boolean } = {},
): {
  cut: number;
  flow: number;
  reads: number;
  bfsRuns: number;
  flowRounds: number;
  side: number[];
} {
  interface A {
    to: number;
    cap: number;
    rev: number;
  }
  const graph: A[][] = Array.from({ length: n }, () => []);
  for (const [u, v, c] of edges) {
    const out = graph[u] as A[];
    const back = graph[v] as A[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as A).rev = iBack;
  }
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  let bfsRuns = 0;
  let flowRounds = 0;
  let flow = 0;
  const bfs = (): void => {
    bfsRuns++;
    level.fill(-1);
    level[source] = 0;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as A[]) {
        reads++;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  };
  const dfs = (u: number, pushed: number): number => {
    if (u === sink) return pushed;
    const list = graph[u] as A[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as A;
      reads++;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (graph[e.to] as A[])[e.rev] as A;
          e.cap -= d;
          back.cap += d;
          return d;
        }
      }
    }
    return 0;
  };
  if (source !== sink) {
    for (;;) {
      bfs();
      if ((level[sink] as number) === -1) break;
      flowRounds++;
      iter.fill(0);
      for (;;) {
        const f = dfs(source, Number.POSITIVE_INFINITY);
        if (f === 0) break;
        flow += f;
      }
    }
  }
  let inS = (v: number): boolean => (level[v] as number) !== -1;
  if (opt.extraBfs === true) {
    const seen: boolean[] = Array.from({ length: n }, () => false);
    seen[source] = true;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as A[]) {
        reads++;
        if (e.cap > 0 && seen[e.to] === false) {
          seen[e.to] = true;
          queue.push(e.to);
        }
      }
    }
    inS = (v) => seen[v] === true;
  }
  let cut = 0;
  for (const [u, v, c] of edges) {
    reads++;
    if (inS(u) && !inS(v)) cut += c;
  }
  const side: number[] = [];
  for (let v = 0; v < n; v++) if (inS(v)) side.push(v);
  return { cut, flow, reads, bfsRuns, flowRounds, side };
}

/**
 * 정점 분할을 전수로 나열해 최소 컷을 낸다. 소스와 싱크의 소속은 고정이므로 나머지 `n − 2`
 * 개 정점만 두 무리에 배정한다. 간선 검사는 분할마다 원래 간선을 한 번씩 읽은 횟수다.
 */
export function bruteForce(
  n: number,
  edges: readonly Edge[],
  source: number,
  sink: number,
): {
  best: number;
  worst: number;
  tried: number;
  reads: number;
  values: number[];
} {
  const free: number[] = [];
  for (let v = 0; v < n; v++) if (v !== source && v !== sink) free.push(v);
  const values: number[] = [];
  let reads = 0;
  const total = 2 ** free.length;
  for (let mask = 0; mask < total; mask++) {
    const inS: boolean[] = Array.from({ length: n }, () => false);
    inS[source] = true;
    for (const [k, v] of free.entries()) {
      if (((mask >> k) & 1) === 1) inS[v] = true;
    }
    let value = 0;
    for (const [u, v, c] of edges) {
      reads++;
      if (inS[u] === true && inS[v] === false) value += c;
    }
    values.push(value);
  }
  return {
    best: Math.min(...values),
    worst: Math.max(...values),
    tried: total,
    reads,
    values,
  };
}

/** 분할 하나의 컷 용량. `S` 에 드는 정점을 그대로 받는다. */
export function cutOf(edges: readonly Edge[], inS: readonly number[]): number {
  let value = 0;
  for (const [u, v, c] of edges) {
    if (inS.includes(u) && !inS.includes(v)) value += c;
  }
  return value;
}

/** 분할 하나의 경계를 방향을 가리지 않고 센 값 — 헷갈리기 쉬운 모양. */
function undirectedOf(edges: readonly Edge[], inS: readonly number[]): number {
  let value = 0;
  for (const [u, v, c] of edges) {
    if (inS.includes(u) !== inS.includes(v)) value += c;
  }
  return value;
}

/** 유량을 다 보낸 뒤 포화된(잔여 0) 원래 간선. 용량 0 인 간선은 뺀다. */
function saturated(c: Case): Edge[] {
  const tr = trace(c.n, c.edges, c.source, c.sink);
  const last = tr.steps.at(-1) as Step;
  return c.edges.filter(([, , cap], k) => cap > 0 && last.res[k] === 0);
}

/** 유량을 다 보낸 잔여 그래프에서 **정방향 항목만** 지나 소스가 도달하는 정점 — 역방향을 빼고 읽은 오해. */
function forwardOnlyReach(tr: Trace, edges: readonly Edge[], s: number) {
  const last = tr.steps.at(-1) as Step;
  const seen = new Set([s]);
  const queue = [s];
  while (queue.length > 0) {
    const u = queue.shift() as number;
    edges.forEach(([a, b], k) => {
      if (a === u && (last.res[k] as number) > 0 && !seen.has(b)) {
        seen.add(b);
        queue.push(b);
      }
    });
  }
  return [...seen].sort((a, b) => a - b);
}

/** 소스에서 싱크로 가는 단순 경로 전부(작은 입력 전용). */
function simplePaths(edges: readonly Edge[], s: number, t: number): number[][] {
  const out: number[][] = [];
  const go = (u: number, path: number[]): void => {
    if (u === t) {
      out.push(path);
      return;
    }
    for (const [a, b, c] of edges) {
      if (a === u && c > 0 && !path.includes(b)) go(b, [...path, b]);
    }
  };
  go(s, [s]);
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./minCut-guide.ref.ts", import.meta.url).pathname;
const MF_REF = new URL("../maxFlow/maxFlow-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  minCut(
    n: number,
    edges: Edge[],
    source: number,
    sink: number,
  ): { cut: number };
}

/** **불변식을 지키던 줄** 하나 — 레벨을 적은 정점을 큐에 넣는 줄을 뺀 사본. */
const noPush = await loadMutant<Impl>(REF, {
  drop: /queue\.push\(e\.to\);/,
});

/** 컷을 더할 때 **도착점 검사**를 뺀 사본. 소스 쪽 안에서만 오가는 간선까지 더한다. */
const noTargetCheck = await loadMutant<Impl>(REF, {
  swap: [
    /if \(\(level\[u\] as number\) !== -1 && \(level\[v\] as number\) === -1\) cut \+= c;/,
    "if ((level[u] as number) !== -1) cut += c;",
  ],
});

const MUTANT_CASES: Case[] = [
  WALK_CASE,
  VARIED_CASE,
  TAIL_CASE,
  CUTOFF_CASE,
  EMPTY_CASE,
];

/** 중화 실행인가 — 변이를 적용하지 않은 모듈이면 함수가 정본과 같은 객체다. */
const 중화됨 = noPush.minCut === minCut;

if (!중화됨) {
  for (const [label, impl] of [
    ["큐에 안 넣는 판", noPush],
    ["도착점 검사를 뺀 판", noTargetCheck],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          minCut(c.n, c.edges, c.source, c.sink).cut ===
          impl.minCut(c.n, c.edges, c.source, c.sink).cut,
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 사본으로 재현한 「큐에 안 넣는 판」이 기계로 만든 변이와 같은 답을 내는가.
  const want = noPush.minCut(WALK_N, WALK, WALK_SOURCE, WALK_SINK).cut;
  const got = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
    noPush: true,
  }).cut;
  if (want !== got)
    throw new Error(`큐에 안 넣는 사본이 변이와 다르다 — ${got} · ${want}`);
}

/* ────────────────────── 사본의 자기 대조 ────────────────────── */

for (const c of [
  WALK_CASE,
  VARIED_CASE,
  TAIL_CASE,
  BRIDGE_CASE,
  CUTOFF_CASE,
  EMPTY_CASE,
  { label: "maxFlow 편의 전개 입력", n: MF_N, edges: MF, source: 0, sink: 5 },
  { label: "계단", ...stair(12), source: 0 },
  { label: "격자", ...grid(6, 4), source: 0, sink: 1 },
]) {
  const want = minCut(c.n, c.edges, c.source, c.sink).cut;
  const flow = maxFlow(c.n, c.edges, c.source, c.sink).flow;
  const tr = trace(c.n, c.edges, c.source, c.sink);
  const lite = countedLite(c.n, c.edges, c.source, c.sink);
  const extra = countedLite(c.n, c.edges, c.source, c.sink, {
    extraBfs: true,
  });
  if (tr.cut !== want || lite.cut !== want || extra.cut !== want)
    throw new Error(`세는 사본이 정본과 다른 컷을 낸다 — ${c.label}`);
  if (tr.flow !== flow || lite.flow !== flow)
    throw new Error(`세는 사본이 maxFlow 정본과 다른 유량을 낸다 — ${c.label}`);
}

/* ────────────────────── 두 정본이 갈리는 줄 ────────────────────── */

/** 함수 본문의 코드 줄 — 주석과 빈 줄을 걷고, 간선 항목 타입 이름을 하나로 맞춘다. */
async function bodyLines(path: string, fn: string): Promise<string[]> {
  const src = await Bun.file(path).text();
  const lines = src.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`export function ${fn}(`));
  return lines
    .slice(start)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("//"))
    .map((l) => l.replace(/\bResidualEdge\b/g, "Edge"));
}

/** 두 줄 목록의 최장 공통 부분 수열로 한쪽에만 있는 줄을 낸다. */
function lineDiff(
  a: readonly string[],
  b: readonly string[],
): { onlyA: string[]; onlyB: string[]; same: number } {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );
  const at = (i: number, j: number): number => (dp[i] as number[])[j] as number;
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      (dp[i] as number[])[j] =
        a[i] === b[j]
          ? at(i + 1, j + 1) + 1
          : Math.max(at(i + 1, j), at(i, j + 1));
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (at(i + 1, j) >= at(i, j + 1)) onlyA.push(a[i++] as string);
    else onlyB.push(b[j++] as string);
  }
  onlyA.push(...a.slice(i));
  onlyB.push(...b.slice(j));
  return { onlyA, onlyB, same: at(0, 0) };
}

const DIFF = lineDiff(
  await bodyLines(MF_REF, "maxFlow"),
  await bodyLines(REF, "minCut"),
);

/* ────────────────────────── 블록 ────────────────────────── */

const W = WALK_TRACE;
const S = W.steps;
const LAST = S.at(-1) as Step;
const END = S.find((s) => s.kind === "end") as Step;
/** 소스 쪽 무리 — 마지막 BFS 가 레벨을 적은 정점. */
export const SIDE = sideOf(END);
const WALK_FLOW = maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow;
const WALK_CUT = minCut(WALK_N, WALK, WALK_SOURCE, WALK_SINK).cut;
const BRUTE = bruteForce(WALK_N, WALK, WALK_SOURCE, WALK_SINK);

/** 네 갈래 — 원래 간선 번호를 갈래마다. */
export function kindsOf(edges: readonly Edge[], inS: readonly number[]) {
  const pick = (f: (a: boolean, b: boolean) => boolean) =>
    edges.flatMap((e, k) =>
      f(inS.includes(e[0]), inS.includes(e[1])) ? [k] : [],
    );
  return {
    cross: pick((a, b) => a && !b),
    inside: pick((a, b) => a && b),
    back: pick((a, b) => !a && b),
    outside: pick((a, b) => !a && !b),
  };
}

const KIND_TEXT = {
  cross: "소스 쪽에서 싱크 쪽으로 건너간다",
  inside: "양 끝이 다 소스 쪽이다",
  back: "싱크 쪽에서 소스 쪽으로 들어온다",
  outside: "양 끝이 다 싱크 쪽이다",
} as const;

const edgesText = (ks: readonly number[]): string =>
  ks.length === 0
    ? "없음"
    : ks
        .map((k) => `${edgeName(WALK[k] as Edge)} (${(WALK[k] as Edge)[2]})`)
        .join(" · ");

const sumOf = (ks: readonly number[]): number =>
  ks.reduce((a, k) => a + (WALK[k] as Edge)[2], 0);

/** 본문에 싣는 분할 다섯 — 소스 하나부터 싱크만 뺀 것까지. */
export const PICKS: number[][] = [
  [0],
  [0, 1],
  [0, 3],
  SIDE,
  [0, 1, 2, 3, 4, 5],
];

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  /** 분할 하나의 원래 간선 아홉 개를 네 갈래로 가른다. */
  conceptCut: () => {
    const k = kindsOf(WALK, SIDE);
    const rows = (["cross", "inside", "back", "outside"] as const).map(
      (key) => [
        KIND_TEXT[key],
        edgesText(k[key]),
        key === "cross" ? "더한다" : "안 더한다",
      ],
    );
    const parts = k.cross.map((i) => String((WALK[i] as Edge)[2]));
    return [
      md(["갈래", "간선 (용량)", "컷 용량에"], rows),
      "",
      `S = ${set(SIDE)} 의 컷 용량은 ${parts.join(" + ")} = ${cutOf(WALK, SIDE)} 입니다. 용량이 가장 큰 ${edgeName(WALK[k.outside[0] as number] as Edge)} 도, 싱크 쪽에서 들어오는 ${edgeName(WALK[k.back[0] as number] as Edge)} 도 세지 않습니다.`,
    ].join("\n");
  },

  /** 유량을 다 보낸 잔여 그래프에서 소스가 도달하는 무리의 컷 용량과 최대 유량. */
  conceptMeet: () =>
    [
      md(
        ["재는 것", "전개 입력에서"],
        [
          ["최대 유량 (maxFlow 정본)", String(WALK_FLOW)],
          ["유량을 다 보낸 잔여 그래프에서 소스가 도달하는 정점", set(SIDE)],
          ["그 무리의 컷 용량 (minCut 정본)", String(WALK_CUT)],
          [
            `분할 ${BRUTE.tried} 가지를 전부 센 컷 용량의 최솟값`,
            String(BRUTE.best),
          ],
        ],
        [1],
      ),
      "",
      `세 수가 모두 ${WALK_CUT} 입니다. 분할을 하나도 나열하지 않은 정본의 답이 ${BRUTE.tried} 가지를 전부 센 최솟값과 같습니다.`,
    ].join("\n"),

  /** maxFlow 편의 전개 입력에서도 두 정본의 값이 맞는가. */
  maxFlowBridge: () => {
    const tr = trace(MF_N, MF, 0, 5);
    const end = tr.steps.find((s) => s.kind === "end") as Step;
    const f = maxFlow(MF_N, MF, 0, 5).flow;
    const c = minCut(MF_N, MF, 0, 5).cut;
    return [
      md(
        ["재는 것", "maxFlow 편의 전개 입력에서"],
        [
          ["maxFlow 정본의 최대 유량", String(f)],
          ["마지막 BFS 가 레벨을 적은 정점", set(sideOf(end))],
          ["minCut 정본의 컷 용량", String(c)],
        ],
        [1],
      ),
      "",
      `컷 용량 ${c}${이가(c)} 최대 유량 ${f}${과와(f)} 같습니다. 레벨을 적은 정점은 maxFlow 편이 끝에서 이름만 붙인 소스 쪽 무리와 같습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.origin ─────────────── */

  /** 전개 입력의 분할을 전수로 나열한다. */
  naiveWalk: () => {
    const b = BRUTE;
    const ties = b.values.filter((v) => v === b.best).length;
    return [
      md(
        [
          "자유 정점",
          "분할 가짓수",
          "간선 검사",
          "가장 작은 컷 용량",
          "그 값을 내는 분할",
          "가장 큰 컷 용량",
        ],
        [
          [
            String(WALK_N - 2),
            String(b.tried),
            comma(b.reads),
            String(b.best),
            `${ties} 가지`,
            String(b.worst),
          ],
        ],
        [0, 1, 2, 3, 5],
      ),
      "",
      `분할 ${b.tried} 가지를 모두 만들어 원래 간선 ${WALK.length} 개씩 읽었고, 가장 작은 컷 용량 ${b.best}${은는(b.best)} 정본이 낸 값 ${WALK_CUT}${과와(WALK_CUT)} 같습니다.`,
    ].join("\n");
  },

  /** 분할 가짓수가 정점 수에 따라 어떻게 커지는가. */
  naiveScale: () => {
    const digits = (free: number) => Math.floor(free * Math.log10(2)) + 1;
    const rows = [4, 7, 10, 20, 40, V_MAX].map((v) => {
      const free = v - 2;
      return [
        comma(v),
        comma(free),
        free <= 40 ? comma(2 ** free) : `2^${comma(free)}`,
        comma(digits(free)),
      ];
    });
    const d = digits(V_MAX - 2);
    return [
      md(
        ["정점 V", "자유 정점 V − 2", "분할 가짓수 2^(V−2)", "자릿수"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `규모의 상한에서 분할의 가짓수가 ${d} 자리입니다. 1 초에 10 억 개씩 본다고 해도 자릿수가 아홉만 줄어 ${d - 9} 자리 초가 걸립니다.`,
    ].join("\n");
  },

  /** 분할 다섯의 컷 용량을 최대 유량과 나란히 — 그리고 분할 전부. */
  weakDuality: () => {
    const rows = PICKS.map((sSide) => {
      const value = cutOf(WALK, sSide);
      return [
        set(sSide),
        set(
          Array.from({ length: WALK_N }, (_, v) => v).filter(
            (v) => !sSide.includes(v),
          ),
        ),
        String(value),
        String(WALK_FLOW),
        value > WALK_FLOW ? "크다" : value === WALK_FLOW ? "같다" : "작다",
      ];
    });
    const below = BRUTE.values.filter((v) => v < WALK_FLOW).length;
    const equal = BRUTE.values.filter((v) => v === WALK_FLOW).length;
    return [
      md(
        ["소스 쪽 S", "싱크 쪽 T", "컷 용량", "최대 유량", "유량과의 비교"],
        rows,
        [2, 3],
      ),
      "",
      `분할 ${BRUTE.tried} 가지를 전부 재면 컷 용량이 최대 유량 ${WALK_FLOW} 보다 작은 분할은 ${below} 가지이고, 같은 분할은 ${equal} 가지입니다.`,
    ].join("\n");
  },

  /** 분할을 곧바로 지목하는 규칙 후보 셋. */
  ruleCandidates: () => {
    const rows = [WALK_CASE, VARIED_CASE, TAIL_CASE, BRIDGE_CASE].map((c) => {
      const only = cutOf(c.edges, [c.source]);
      const sat = saturated(c).reduce((a, e) => a + e[2], 0);
      const reach = minCut(c.n, c.edges, c.source, c.sink).cut;
      const brute = bruteForce(c.n, c.edges, c.source, c.sink).best;
      return [c.label, String(only), String(sat), String(reach), String(brute)];
    });
    const misses = (col: number) => rows.filter((r) => r[col] !== r[4]).length;
    return [
      md(
        [
          "입력",
          "소스 하나만 소스 쪽",
          "포화된 간선의 용량 합",
          "잔여 그래프에서 소스가 도달하는 무리",
          "전수 조사의 최솟값",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `네 입력에서 전수 조사의 최솟값과 어긋난 입력은 「소스 하나만 소스 쪽」이 ${misses(1)} 개, 「포화된 간선의 용량 합」이 ${misses(2)} 개, 「잔여 그래프에서 소스가 도달하는 무리」가 ${misses(3)} 개입니다.`,
    ].join("\n");
  },

  /** 전수 조사와 이 절차의 간선 검사. */
  ruleCost: () => {
    const g6 = grid(6, 4);
    const g20 = grid(20, 10);
    const st = stair(12);
    const inputs: [string, number, Edge[], number, number][] = [
      [NAME.walk, WALK_N, WALK, WALK_SOURCE, WALK_SINK],
      ["계단 m = 12", st.n, st.edges, 0, st.sink],
      ["격자 6 × 4", g6.n, g6.edges, 0, 1],
      ["격자 20 × 10", g20.n, g20.edges, 0, 1],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const free = n - 2;
      const c = countedLite(n, edges, s, t);
      return [
        `${label} (V=${comma(n)} · E=${comma(edges.length)})`,
        free <= 30 ? comma(2 ** free) : `2^${comma(free)}`,
        free <= 30
          ? comma(2 ** free * edges.length)
          : `2^${comma(free)} × ${comma(edges.length)}`,
        comma(c.reads),
      ];
    });
    return md(
      ["입력", "분할 가짓수", "전수 조사의 간선 검사", "이 절차의 간선 검사"],
      rows,
      [1, 2, 3],
    );
  },

  /* ─────────────── deep.build — s-t 컷 ─────────────── */

  /** 간선 하나를 골라 컷에 드는지 읽는다. */
  cutReadOne: () => {
    const k = WALK.findIndex(([u, v]) => u === 5 && v === 3);
    const [u, v, c] = WALK[k] as Edge;
    const sideName = (x: number) => (SIDE.includes(x) ? "소스 쪽" : "싱크 쪽");
    const counted = SIDE.includes(u) && !SIDE.includes(v);
    return [
      md(
        ["읽는 것", `간선 ${u}→${v} 에서`],
        [
          ["용량", String(c)],
          [`꼬리 ${u}${이가(u)} 든 무리`, sideName(u)],
          [`머리 ${v}${이가(v)} 든 무리`, sideName(v)],
          ["컷 용량에", counted ? "더한다" : "안 더한다"],
        ],
      ),
      "",
      `간선 ${u}→${v}${은는(v)} 경계를 넘지만 ${sideName(u)}에서 ${sideName(v)}으로 들어오는 방향이라 컷 용량에 들지 않습니다.`,
    ].join("\n");
  },

  /** 네 갈래가 분할마다 몇 개씩인가. */
  cutKinds: () => {
    const rows = PICKS.map((sSide) => {
      const k = kindsOf(WALK, sSide);
      return [
        set(sSide),
        String(k.cross.length),
        String(k.inside.length),
        String(k.back.length),
        String(k.outside.length),
        String(cutOf(WALK, sSide)),
      ];
    });
    return [
      md(
        [
          "소스 쪽 S",
          "건너가는 간선",
          "소스 쪽 안의 간선",
          "들어오는 간선",
          "싱크 쪽 안의 간선",
          "컷 용량",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `다섯 분할 모두 네 갈래의 개수를 더하면 간선 ${WALK.length} 개입니다.`,
    ].join("\n");
  },

  /** 방향을 가리지 않고 경계 간선을 다 센 값과의 차이. */
  cutUndirected: () => {
    const rows = PICKS.map((sSide) => [
      set(sSide),
      String(cutOf(WALK, sSide)),
      String(undirectedOf(WALK, sSide)),
    ]);
    const unBest = Math.min(...PICKS.map((p) => undirectedOf(WALK, p)));
    return [
      md(
        ["소스 쪽 S", "방향대로 센 컷 용량", "방향을 가리지 않고 센 값"],
        rows,
        [1, 2],
      ),
      "",
      `S = ${set(SIDE)} 에서 방향대로 세면 ${cutOf(WALK, SIDE)}, 가리지 않고 세면 ${undirectedOf(WALK, SIDE)} 입니다. 방향을 가리지 않으면 다섯 분할 중 가장 작은 값이 ${unBest}${이가(unBest)} 되어 최대 유량 ${WALK_FLOW}${과와(WALK_FLOW)} 만나지 않습니다.`,
    ].join("\n");
  },

  /** 소스에서 싱크로 가는 경로마다 건너가는 간선을 몇 번 지나는가. */
  cutPaths: () => {
    const paths = simplePaths(WALK, WALK_SOURCE, WALK_SINK);
    const crossCount = (p: number[]) =>
      p
        .slice(1)
        .filter((v, i) => SIDE.includes(p[i] as number) && !SIDE.includes(v))
        .length;
    const rows = paths.map((p) => [route(p), String(crossCount(p))]);
    const min = Math.min(...paths.map(crossCount));
    return [
      md(
        ["소스에서 싱크까지의 경로 목록", "건너가는 간선을 지난 횟수"],
        rows,
        [1],
      ),
      "",
      `경로 ${paths.length} 개가 모두 건너가는 간선을 ${min} 번 이상 지납니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 단계 ─────────────── */

  /** 1단계 — 디닉으로 유량을 끝까지 보낸다. */
  stageFlow: () => {
    const rows: string[][] = [];
    for (const s of S) {
      if (s.kind === "path")
        rows.push([
          `라운드 ${s.round}`,
          String(s.level[WALK_SINK]),
          route(s.path),
          String(s.add),
          String(s.total),
        ]);
      if (s.kind === "end")
        rows.push([`라운드 ${s.round}`, "없음", "없음", "0", String(s.total)]);
    }
    return [
      md(
        ["라운드", "싱크의 레벨", "증가 경로", "보낸 양", "누적 유량"],
        rows,
        [3, 4],
      ),
      "",
      `사본이 보낸 유량 ${W.flow}${은는(W.flow)} maxFlow 정본이 같은 입력에 낸 값 ${WALK_FLOW}${과와(WALK_FLOW)} 같습니다.`,
    ].join("\n");
  },

  /** 2단계 — BFS 가 끝날 때마다 레벨이 붙은 정점. */
  stageReach: () => {
    const bfsSteps = S.filter((s) => s.kind === "bfs" || s.kind === "end");
    const rows = bfsSteps.map((s) => {
      const side = sideOf(s);
      const inside = side.includes(WALK_SINK);
      return [
        `라운드 ${s.round}`,
        list(s.level),
        set(side),
        inside ? "레벨이 붙는다" : "레벨이 없다",
        inside ? "분할이 아니다" : String(cutOf(WALK, side)),
      ];
    });
    return [
      md(
        ["BFS", "level", "레벨이 붙은 정점", "싱크", "그 무리의 컷 용량"],
        rows,
      ),
      "",
      `BFS ${bfsSteps.length} 번 중 싱크에 레벨이 없는 것은 마지막 한 번이고, 그때 레벨이 붙은 정점 ${SIDE.length} 개가 소스 쪽 무리입니다.`,
    ].join("\n");
  },

  /** 2단계 — 가장 쉬운 경우: 용량이 다른 다리 그래프. */
  stageEasy: () => {
    const tr = trace(VARIED_N, VARIED, 0, 3);
    const end = tr.steps.find((s) => s.kind === "end") as Step;
    const out = VARIED.flatMap((e, k) => (e[0] === 0 ? [k] : []));
    return [
      md(
        ["재는 것", `${NAME.varied}에서`],
        [
          [
            "소스에서 나가는 간선의 잔여",
            out
              .map((k) => `${edgeName(VARIED[k] as Edge)} ${end.res[k]}`)
              .join(" · "),
          ],
          ["소스 쪽 무리", set(sideOf(end))],
          ["컷 용량 (minCut 정본)", String(minCut(VARIED_N, VARIED, 0, 3).cut)],
          [
            "최대 유량 (maxFlow 정본)",
            String(maxFlow(VARIED_N, VARIED, 0, 3).flow),
          ],
        ],
      ),
      "",
      "소스에서 나가는 간선이 모두 잔여 0 이라 마지막 BFS 가 소스 하나에서 멈춥니다.",
    ].join("\n");
  },

  /** 2단계 — 불안한 경우: 마지막 BFS 가 역방향 항목을 지나 무리를 넓힌다. */
  stageLastBfs: () => {
    const rows = END.queue.map((u) => {
      const ids = W.lists[u] as number[];
      const got = END.found.filter((id) => tailOf(WALK, id) === u);
      const blocked = ids.filter(
        (id) => END.res[id] === 0 && !SIDE.includes(headOf(WALK, id)),
      );
      return [
        String(u),
        got.length === 0
          ? "없음"
          : got
              .map(
                (id) =>
                  `${headOf(WALK, id)} (${arcName(WALK, id)}${isBack(WALK, id) ? " 역방향" : ""} · 잔여 ${END.res[id]})`,
              )
              .join(" · "),
        blocked.length === 0
          ? "없음"
          : blocked.map((id) => arcName(WALK, id)).join(" · "),
      ];
    });
    const backs = END.found.filter((id) => isBack(WALK, id));
    const fwd = forwardOnlyReach(W, WALK, WALK_SOURCE);
    return [
      md(
        [
          "꺼낸 정점",
          "레벨을 적은 정점 (지난 항목 · 잔여)",
          "싱크 쪽으로 가는데 잔여 0 인 항목",
        ],
        rows,
      ),
      "",
      `레벨을 적으며 지난 역방향 항목은 ${backs.map((id) => arcName(WALK, id)).join(" · ")} 하나이고, 소스 쪽 무리는 ${set(SIDE)} 입니다. 정방향 항목만 따라가면 무리가 ${set(fwd)} 에서 멈추고, 그 컷 용량은 ${cutOf(WALK, fwd)}${이며(cutOf(WALK, fwd))} 최대 유량 ${WALK_FLOW}${과와(WALK_FLOW)} 어긋납니다.`,
    ].join("\n");
  },

  /** 3단계 — 경계를 넘는 원래 간선의 유량과 잔여. */
  stageBoundary: () => {
    const k = kindsOf(WALK, SIDE);
    const rows = [...k.cross, ...k.back].map((i) => {
      const [u, v, c] = WALK[i] as Edge;
      return [
        `${u}→${v}`,
        k.cross.includes(i) ? "소스 쪽 → 싱크 쪽" : "싱크 쪽 → 소스 쪽",
        String(c),
        String(LAST.flow[i]),
        String(LAST.res[i]),
      ];
    });
    const out = k.cross.reduce((a, i) => a + (LAST.flow[i] as number), 0);
    const inn = k.back.reduce((a, i) => a + (LAST.flow[i] as number), 0);
    return [
      md(["경계 간선", "방향", "용량", "유량", "정방향 잔여"], rows, [2, 3, 4]),
      "",
      `소스 쪽에서 나가는 간선 ${k.cross.length} 개는 유량이 용량과 같고, 들어오는 간선 ${k.back.length} 개는 유량이 0 입니다. 경계를 넘은 순량 ${out} − ${inn} = ${out - inn}${이가(out - inn)} 컷 용량 ${WALK_CUT}${과와(WALK_CUT)}도, 최대 유량 ${WALK_FLOW}${과와(WALK_FLOW)}도 같습니다.`,
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

  /** 2. 라운드마다 레벨과 보낸 경로. */
  walkRounds: () => {
    const rows: string[][] = [];
    for (const s of S) {
      if (s.kind === "path")
        rows.push([
          `라운드 ${s.round}`,
          list(s.level),
          route(s.path),
          `병목 ${s.add}${s.arcs.some((id) => isBack(WALK, id)) ? " · 역방향 항목을 지난다" : ""}`,
        ]);
      if (s.kind === "end")
        rows.push([`라운드 ${s.round}`, list(s.level), "보낼 경로가 없다"]);
    }
    return [...columns(rows), `누적 유량 ${W.flow}`].join("\n");
  },

  /** 짚고 가기 — 포화된 간선을 다 더하면. */
  pauseSaturated: () => {
    const rows = MUTANT_CASES.map((c) => {
      const sat = saturated(c);
      const v = sat.reduce((a, e) => a + e[2], 0);
      const ref = minCut(c.n, c.edges, c.source, c.sink).cut;
      return [
        c.label,
        String(v),
        String(ref),
        v === ref ? "같다" : "다르다",
        sat.length === 0 ? "없음" : sat.map(edgeName).join(" · "),
      ];
    });
    const inner = saturated(WALK_CASE).filter(
      ([u, v]) => SIDE.includes(u) && SIDE.includes(v),
    );
    return [
      md(
        ["입력", "포화된 간선의 용량 합", "정본", "판정", "포화된 원래 간선"],
        rows,
        [1, 2],
      ),
      "",
      `${MUTANT_CASES.length} 입력 중 ${rows.filter((r) => r[3] === "다르다").length} 개에서 값이 어긋납니다. 전개 입력에서 포화된 ${inner.map(edgeName).join(" · ")}${은는(edgeName(inner.at(-1) as Edge))} 양 끝이 다 소스 쪽이라 경계를 넘지 않습니다.`,
    ].join("\n");
  },

  /** 3. maxFlow 정본과 이 편의 정본이 갈리는 줄. */
  walkDiff: () => {
    const rows = [
      ...DIFF.onlyA.map((l) => ["maxFlow 에만", `\`${l}\``]),
      ...DIFF.onlyB.map((l) => ["minCut 에만", `\`${l}\``]),
    ];
    return [
      md(["자리", "코드 줄"], rows),
      "",
      `주석과 빈 줄을 걷고 두 함수의 코드 줄을 맞대면 ${DIFF.same} 줄이 같고, maxFlow 에만 있는 줄이 ${DIFF.onlyA.length} 줄, minCut 에만 있는 줄이 ${DIFF.onlyB.length} 줄입니다. 간선 항목 타입의 이름(Edge · ResidualEdge)은 같은 것으로 보았습니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 컷을 뽑으려고 BFS 를 한 번 더 실행하면. */
  pauseExtraBfs: () => {
    const g = grid(20, 10);
    const st = stair(200);
    const inputs: [string, number, Edge[], number, number][] = [
      [NAME.walk, WALK_N, WALK, WALK_SOURCE, WALK_SINK],
      ["격자 20 × 10", g.n, g.edges, 0, 1],
      ["계단 m = 200", st.n, st.edges, 0, st.sink],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const a = countedLite(n, edges, s, t);
      const b = countedLite(n, edges, s, t, { extraBfs: true });
      return [
        label,
        comma(a.cut),
        comma(b.cut),
        a.cut === b.cut ? "같다" : "다르다",
        comma(a.reads),
        comma(b.reads),
      ];
    });
    return md(
      [
        "입력",
        "정본",
        "BFS 를 한 번 더 하는 판",
        "판정",
        "정본의 간선 검사",
        "한 번 더 하는 판의 간선 검사",
      ],
      rows,
      [1, 2, 4, 5],
    );
  },

  /** 4. 마지막 level 로 원래 간선 아홉 개를 판정한다. */
  walkCut: () => {
    let acc = 0;
    const rows = WALK.map(([u, v, c]) => {
      const lu = LAST.level[u] as number;
      const lv = LAST.level[v] as number;
      const cross = lu !== -1 && lv === -1;
      if (cross) acc += c;
      return [
        `${u}→${v}`,
        String(c),
        String(lu),
        String(lv),
        cross ? "참" : "거짓",
        String(acc),
      ];
    });
    return [
      md(
        ["원래 간선", "용량", "level[u]", "level[v]", "⑦ 의 조건", "누적 cut"],
        rows,
        [1, 2, 3, 5],
      ),
      "",
      `조건이 참인 간선은 ${LAST.crossed.length} 개이고 cut 은 ${LAST.cut} 입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 도착점 검사를 뺀 변이. */
  pauseTargetCheck: () =>
    md(
      ["입력", "정본", "도착점 검사를 뺀 판", "판정"],
      MUTANT_CASES.map((c) => {
        const a = minCut(c.n, c.edges, c.source, c.sink).cut;
        const b = noTargetCheck.minCut(c.n, c.edges, c.source, c.sink).cut;
        return [c.label, String(a), String(b), a === b ? "같다" : "다르다"];
      }),
      [1, 2],
    ),

  /** 도착점 검사를 빼면 더해지는 간선. */
  pauseTargetWhy: () => {
    const k = kindsOf(WALK, SIDE);
    const all = sumOf(k.cross) + sumOf(k.inside);
    return [
      md(
        ["갈래", "간선 (용량)", "용량 합"],
        [
          [KIND_TEXT.cross, edgesText(k.cross), String(sumOf(k.cross))],
          [KIND_TEXT.inside, edgesText(k.inside), String(sumOf(k.inside))],
        ],
        [2],
      ),
      "",
      `도착점 검사가 거르던 것은 소스 쪽 안의 간선 ${k.inside.length} 개이고, 빼면 ${sumOf(k.cross)} + ${sumOf(k.inside)} = ${all}${이가(all)} 나옵니다.`,
    ].join("\n");
  },

  /** 5. 열 걸음 전부. */
  walkTrace: () => {
    const what: Record<StepKind, string> = {
      build: "잔여 그래프를 만든다",
      bfs: "BFS 로 레벨을 적는다",
      path: "증가 경로에 보낸다",
      exhaust: "0 이 올라온다",
      end: "싱크에 레벨이 없다",
      cut: "원래 간선을 판정해 더한다",
    };
    const rows = S.map((s, i) => [
      tOf(i),
      s.kind === "build" || s.kind === "cut"
        ? what[s.kind]
        : s.kind === "path"
          ? `라운드 ${s.round} · ${route(s.path)}`
          : `라운드 ${s.round} · ${what[s.kind]}`,
      LABELS.filter((l) => s.hits[l] > 0)
        .map((l) => `${l} ${s.hits[l]}`)
        .join(" · ") || "-",
      list(s.level),
      s.res.slice(0, W.E).join(", "),
      String(s.total),
      s.kind === "cut" ? String(s.cut) : "-",
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
          "누적 유량",
          "cut",
        ],
        rows,
        [5],
      ),
      "",
      `걸음 ${S.length} 개의 간선 검사는 모두 ${looks} 번이고, 반환값은 { cut: ${LAST.cut} } 입니다.`,
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
    const backPath = S.findIndex(
      (s) => s.kind === "path" && s.arcs.some((id) => isBack(WALK, id)),
    );
    return [
      md(["라벨", "하는 일", "실행 횟수", "실행한 걸음"], rows, [2]),
      "",
      `일곱 갈래가 ${all ? "모두" : "모두는 아니게"} 한 번 이상 실행됐습니다. 역방향 항목으로 유량을 보낸 걸음은 ${tOf(backPath)} 하나입니다.`,
    ].join("\n");
  },

  /** 6. 전체 코드를 여러 입력에 실행한 결과. */
  walkResult: () => {
    const call = (c: Case) =>
      `minCut(${c.n}, [${c.edges.map((e) => `[${e.join(",")}]`).join(",")}], ${c.source}, ${c.sink})`;
    const cases: Case[] = [
      WALK_CASE,
      { label: "", n: MF_N, edges: MF, source: 0, sink: 5 },
      VARIED_CASE,
      TAIL_CASE,
      CUTOFF_CASE,
      EMPTY_CASE,
      {
        label: "",
        n: 2,
        edges: [
          [0, 0, 100],
          [0, 1, 5],
        ],
        source: 0,
        sink: 1,
      },
    ];
    return columns(
      cases.map((c) => [
        call(c),
        "→",
        `{ cut: ${comma(minCut(c.n, c.edges, c.source, c.sink).cut)} }`,
      ]),
    ).join("\n");
  },

  /* ─────────────── related ─────────────── */

  /** 약한 쌍대성과 강한 쌍대성을 값으로. */
  duality: () => {
    const rows = [
      WALK_CASE,
      VARIED_CASE,
      TAIL_CASE,
      BRIDGE_CASE,
      CUTOFF_CASE,
    ].map((c) => {
      const f = maxFlow(c.n, c.edges, c.source, c.sink).flow;
      const b = bruteForce(c.n, c.edges, c.source, c.sink);
      return [
        c.label,
        String(f),
        String(b.best),
        String(b.worst),
        String(b.values.filter((v) => v < f).length),
      ];
    });
    return [
      md(
        [
          "입력",
          "최대 유량",
          "전수 조사의 최소 컷",
          "가장 큰 컷",
          "유량보다 작은 컷",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `${rows.length} 입력 모두 유량보다 작은 컷이 0 개이고, 최대 유량과 최소 컷이 같습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** 정의를 두 분할에 넣어 검산한다. */
  mathCheck: () => {
    const rows = [[0], SIDE].map((sSide) => {
      let fwd = 0;
      let bwd = 0;
      for (const [k, [u, v]] of WALK.entries()) {
        if (sSide.includes(u) && !sSide.includes(v))
          fwd += LAST.flow[k] as number;
        else if (!sSide.includes(u) && sSide.includes(v))
          bwd += LAST.flow[k] as number;
      }
      return [
        set(sSide),
        String(cutOf(WALK, sSide)),
        String(fwd),
        String(bwd),
        String(fwd - bwd),
        String(W.flow),
      ];
    });
    return [
      md(
        [
          "분할 S",
          "c(S,T)",
          "f(S,T)",
          "f(T,S)",
          "f(S,T) − f(T,S)",
          "보낸 총량",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      "두 분할에서 f(S,T) − f(T,S) 가 모두 |f| 와 같습니다. 컷 용량 c(S,T) 는 두 분할에서 다릅니다.",
    ].join("\n");
  },

  /** 결과식에 규모의 상한을 넣는다. */
  mathScale: () =>
    [
      md(
        [
          "식",
          `V = ${comma(V_MAX)} · E = ${comma(E_MAX)} · c ≤ ${comma(C_MAX)} 에서`,
        ],
        [
          ["간선 검사의 상한 V² · E", comma(V_MAX * V_MAX * E_MAX)],
          ["컷 용량의 상한 E · c", comma(E_MAX * C_MAX)],
          ["32 비트 부호 있는 정수의 상한", comma(2 ** 31 - 1)],
          ["배정밀도 수가 정확히 담는 정수의 상한 2^53", comma(2 ** 53)],
        ],
        [1],
      ),
      "",
      "컷 용량의 상한은 32 비트 정수의 상한을 넘고 2^53 보다는 작습니다.",
    ].join("\n"),

  /* ─────────────── invariant ─────────────── */

  /** BFS 가 끝날 때마다 경계의 잔여 용량. */
  invariantWatch: () => {
    const rows = S.filter((s) => s.kind === "bfs" || s.kind === "end").map(
      (s) => {
        const side = sideOf(s);
        let crossing = 0;
        for (const u of side)
          for (const id of W.lists[u] as number[])
            if (!side.includes(headOf(WALK, id)))
              crossing += s.res[id] as number;
        const inside = side.includes(WALK_SINK);
        return [
          `라운드 ${s.round}`,
          set(side),
          String(crossing),
          inside ? "-" : String(cutOf(WALK, side)),
          String(s.total),
        ];
      },
    );
    return [
      md(
        [
          "BFS",
          "레벨이 적힌 정점 S",
          "S 에서 밖으로 나가는 잔여 용량",
          "S 의 컷 용량",
          "그때까지 보낸 양",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `BFS ${rows.length} 번 모두 밖으로 나가는 잔여 용량이 0 입니다. 싱크가 S 안에 있는 BFS 는 분할이 아니어서 컷 용량 칸을 비웠습니다.`,
    ].join("\n");
  },

  /** 경계에 있는 입력들. */
  invariantEdges: () => {
    const cases: [string, number, Edge[], number, number][] = [
      ["간선 없음", 2, [], 0, 1],
      ["소스와 싱크가 직접 이어져 있다", 2, [[0, 1, 100]], 0, 1],
      ["소스에서 싱크로 가는 경로가 없다", CUTOFF_N, CUTOFF, 0, 2],
      ["용량 0 인 간선뿐", 2, [[0, 1, 0]], 0, 1],
      [
        "평행 간선",
        2,
        [
          [0, 1, 5],
          [0, 1, 7],
        ],
        0,
        1,
      ],
      [
        "자기 루프",
        2,
        [
          [0, 0, 100],
          [0, 1, 5],
        ],
        0,
        1,
      ],
      [
        "싱크에서 소스로 돌아오는 간선",
        3,
        [
          [0, 1, 4],
          [1, 2, 3],
          [2, 0, 9],
        ],
        0,
        2,
      ],
      [
        "용량 상한",
        3,
        [
          [0, 1, C_MAX],
          [1, 2, C_MAX],
        ],
        0,
        2,
      ],
    ];
    return md(
      ["입력", "컷", "소스 쪽 무리", "최대 유량 (maxFlow 정본)", "BFS 횟수"],
      cases.map(([name, n, edges, s, t]) => {
        const c = countedLite(n, edges, s, t);
        return [
          name,
          comma(minCut(n, edges, s, t).cut),
          set(c.side),
          comma(maxFlow(n, edges, s, t).flow),
          String(c.bfsRuns),
        ];
      }),
      [1, 3, 4],
    );
  },

  /** 큐에 넣는 줄을 뺀 변이. */
  mutantNoPush: () =>
    md(
      ["입력", "정본", "큐에 안 넣는 판", "판정"],
      MUTANT_CASES.map((c) => {
        const a = minCut(c.n, c.edges, c.source, c.sink).cut;
        const b = noPush.minCut(c.n, c.edges, c.source, c.sink).cut;
        return [c.label, String(a), String(b), a === b ? "같다" : "다르다"];
      }),
      [1, 2],
    ),

  /** 변이에서 문장이 깨진 자리 — 사본으로 재현한 상태. */
  mutantNoPushSide: () => {
    const tr = trace(WALK_N, WALK, WALK_SOURCE, WALK_SINK, { noPush: true });
    const end = tr.steps.find((s) => s.kind === "end") as Step;
    const side = sideOf(end);
    let crossing = 0;
    const open: string[] = [];
    for (const u of side)
      for (const id of tr.lists[u] as number[])
        if (!side.includes(headOf(WALK, id)) && (end.res[id] as number) > 0) {
          crossing += end.res[id] as number;
          open.push(`${arcName(WALK, id)} ${end.res[id]}`);
        }
    return [
      md(
        ["재는 것", "큐에 안 넣는 판의 첫 BFS 뒤"],
        [
          ["레벨이 적힌 정점 S", set(side)],
          ["S 밖으로 잔여가 남은 항목", open.join(" · ")],
          ["S 에서 밖으로 나가는 잔여 용량", String(crossing)],
          ["보낸 유량", String(tr.flow)],
          ["돌려준 컷", String(tr.cut)],
        ],
      ),
      "",
      `S 밖으로 잔여 ${crossing}${이가(crossing)} 남은 채 탐색이 끝났고, 유량 ${tr.flow} 대 컷 ${tr.cut}${으로(tr.cut)} 두 값이 만나지 않습니다.`,
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  /** 걸음을 몫으로 묶어 간선 검사를 센다. */
  perfCount: () => {
    const pick = (f: (s: Step) => boolean) => {
      const idx = S.flatMap((s, i) => (f(s) ? [i] : []));
      return {
        at: idx.map(tOf).join(" · "),
        n: idx.reduce((a, i) => a + (S[i] as Step).looks, 0),
      };
    };
    const bfs = pick((s) => s.kind === "bfs" || s.kind === "end");
    const dfs = pick((s) => s.kind === "path" || s.kind === "exhaust");
    const cut = pick((s) => s.kind === "cut");
    const total = bfs.n + dfs.n + cut.n;
    const lite = countedLite(WALK_N, WALK, WALK_SOURCE, WALK_SINK).reads;
    return [
      md(
        ["몫", "걸음", "간선 검사"],
        [
          ["BFS", bfs.at, String(bfs.n)],
          ["DFS", dfs.at, String(dfs.n)],
          ["컷 합산", cut.at, String(cut.n)],
          ["합", "", String(total)],
        ],
        [2],
      ),
      "",
      `합 ${total}${은는(total)} 계수만 세는 사본이 낸 값 ${lite}${과와(lite)} 같습니다. 이 편이 maxFlow 에 더한 몫은 컷 합산 ${cut.n} 번이고, 원래 간선 수와 같습니다.`,
    ].join("\n");
  },

  /** 계단 입력이 라운드 수를 V−1 까지 채운다. */
  worstRounds: () => {
    const rows = [4, 8, 50, 200, 499].map((m) => {
      const s = stair(m);
      const c = countedLite(s.n, s.edges, 0, s.sink);
      return [
        String(m),
        comma(s.n),
        comma(s.edges.length),
        comma(c.flowRounds),
        comma(s.n - 1),
        comma(c.reads),
        comma(c.cut),
      ];
    });
    return [
      md(
        [
          "계단 층수 m",
          "정점 V",
          "간선 E",
          "유량을 보낸 라운드",
          "상한 V − 1",
          "간선 검사",
          "컷",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      "다섯 줄 모두 유량을 보낸 라운드가 상한 V − 1 과 같습니다.",
    ].join("\n");
  },

  /** 라운드 수를 그대로 두고 간선만 늘린다. */
  worstScale: () => {
    const rows: string[][] = [];
    let top = 0;
    for (const extra of [0, 1_000, 5_000, 9_000]) {
      const s = stairPlus(499, extra);
      const c = countedLite(s.n, s.edges, 0, s.sink);
      top = c.reads;
      rows.push([
        extra === 0 ? "계단만" : `계단 + 뒤로 가는 간선 ${comma(extra)} 개`,
        comma(s.n),
        comma(s.edges.length),
        comma(c.bfsRuns),
        comma(c.reads),
      ]);
    }
    const g = grid(20, 10);
    const gc = countedLite(g.n, g.edges, 0, 1);
    rows.push([
      "격자 20 × 10",
      comma(g.n),
      comma(g.edges.length),
      comma(gc.bfsRuns),
      comma(gc.reads),
    ]);
    const bound = V_MAX * V_MAX * E_MAX;
    return [
      md(
        ["입력", "정점 V", "간선 E", "BFS 횟수", "간선 검사"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `가장 큰 계단의 간선 검사는 ${comma(top)} 번이고 격자의 ${comma(Math.round(top / gc.reads))} 배입니다. 이 값은 상한 ${comma(bound)} 의 ${((top / bound) * 100).toFixed(1)} % 입니다.`,
    ].join("\n");
  },

  /** 규모를 늘리며 상한에 대한 비를 잰다. */
  worstGrowth: () =>
    [
      md(
        ["정점 V", "간선 E", "간선 검사", "V² · E", "비"],
        [8, 32, 128, 499].map((m) => {
          const s = stair(m);
          const c = countedLite(s.n, s.edges, 0, s.sink);
          const b = s.n * s.n * s.edges.length;
          return [
            comma(s.n),
            comma(s.edges.length),
            comma(c.reads),
            comma(b),
            (c.reads / b).toFixed(5),
          ];
        }),
        [0, 1, 2, 3, 4],
      ),
      "",
      "정점이 늘수록 비가 0 쪽으로 작아집니다. 이 입력은 라운드 수만 채우고 라운드당 경로 수를 채우지 못합니다.",
    ].join("\n"),

  /* ─────────────── selfcheck ─────────────── */

  /** 5→6 의 용량이 5 라면. */
  selfcheckCap56: () => {
    const edges = WALK.map(
      ([u, v, c]) => [u, v, u === 5 && v === 6 ? 5 : c] as Edge,
    );
    const tr = trace(WALK_N, edges, WALK_SOURCE, WALK_SINK);
    const end = tr.steps.find((s) => s.kind === "end") as Step;
    const side = sideOf(end);
    return [
      md(
        ["재는 것", "5→6 의 용량이 5 일 때"],
        [
          ["마지막 BFS 의 level", list(end.level)],
          ["소스 쪽 무리", set(side)],
          [
            "건너가는 간선",
            kindsOf(edges, side)
              .cross.map((k) => edgeName(edges[k] as Edge))
              .join(" · "),
          ],
          ["컷 용량 (minCut 정본)", String(minCut(WALK_N, edges, 0, 6).cut)],
          [
            "최대 유량 (maxFlow 정본)",
            String(maxFlow(WALK_N, edges, 0, 6).flow),
          ],
        ],
      ),
    ].join("\n");
  },
};
