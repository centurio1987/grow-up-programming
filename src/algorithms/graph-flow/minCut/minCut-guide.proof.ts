/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/minCut/minCut-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 걸음마다의 상태나 계수를 내보내지 않으므로, 세는
 * 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 아래 표의 「컷」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은
 * 계수와 걸음별 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을
 * 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { minCut } from "./minCut-guide.ref.ts";

export type Edge = [number, number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 네트워크. 정점 일곱 · 방향 간선 아홉이고 소스는 0, 싱크는 6 이다.
 *
 * 이 입력 하나로 컷 판정의 네 갈래가 전부 나온다 — 경계를 건너는 간선(`2 → 5` · `4 → 5`) ·
 * 소스 쪽 안에서만 오가는 간선(`0 → 1` 등 다섯) · 싱크 쪽에서 소스 쪽으로 들어오는 간선
 * (`5 → 3`) · 싱크 쪽 안에서만 오가는 간선(`5 → 6`). 게다가 `0 → 1` 은 포화인데 컷이 아니고
 * `5 → 6` 은 용량이 가장 큰데 컷이 아니라, 흔한 오해 둘이 같은 입력에서 반박된다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edge[] = [
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
export const WALK_SRC = 0;
export const WALK_SINK = 6;

/** 문제 지문의 예시. 소스에서 나가는 두 간선이 그대로 컷이 되는 모양이다. */
export const DOC_N = 4;
export const DOC_EDGES: Edge[] = [
  [0, 1, 3],
  [0, 2, 2],
  [1, 2, 1],
  [1, 3, 2],
  [2, 3, 3],
];

/** 병목이 싱크 바로 앞에 있는 직렬 네트워크. 소스 쪽 무리가 정점 셋이다. */
export const TAIL_N = 4;
export const TAIL_EDGES: Edge[] = [
  [0, 1, 100],
  [1, 2, 100],
  [2, 3, 1],
];

/** 되돌릴 자리가 없으면 답이 갈리는 다리 그래프. 용량이 전부 1 이다. */
export const BRIDGE_N = 4;
export const BRIDGE_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 2, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 3, 1],
];

/** 소스에서 싱크로 가는 경로가 없다. */
export const CUTOFF_N = 3;
export const CUTOFF_EDGES: Edge[] = [[0, 1, 10]];

const V_LIMIT = 500;
const E_LIMIT = 10_000;
const C_LIMIT = 1_000_000;

/**
 * 경로 길이가 1, 2, …, `m` 으로 서로 다른 계단 네트워크.
 *
 * 싱크로 들어가는 간선은 용량 1 이고 사슬은 다 지날 만큼 크다. 짧은 경로부터 한 라운드에
 * 하나씩만 소진되므로 라운드 수가 `m` 을 그대로 채운다.
 */
export function stair(m: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [
    [0, m, 1],
    [0, 1, m],
  ];
  for (let i = 1; i <= m - 2; i++) edges.push([i, i + 1, m]);
  for (let i = 1; i <= m - 1; i++) edges.push([i, m, 1]);
  return { n: m + 1, edges };
}

/** 계단에 「번호가 큰 정점에서 작은 쪽으로」 가는 간선을 덧붙인다. 라운드 수는 안 바뀐다. */
export function stairPlus(
  m: number,
  extra: number,
): { n: number; edges: Edge[] } {
  const { n, edges } = stair(m);
  const out = [...edges];
  let added = 0;
  for (let gap = 2; gap < m && added < extra; gap++) {
    for (let i = gap; i < m && added < extra; i++) {
      out.push([i, i - gap, 1]);
      added++;
    }
  }
  return { n, edges: out };
}

/** 격자 네트워크. 왼쪽 열이 소스에, 오른쪽 열이 싱크에 붙는다. */
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[0, 1, 2, 1, 2, 3, 4]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `{0, 1, 2, 3, 4}` 꼴 — 본문 표기와 같다. */
const set = (xs: number[]): string => `{${xs.join(", ")}}`;

/** `10,000` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 낸다. 첫 행이 머리줄이다. */
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
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

interface ResidualEdge {
  to: number;
  cap: number;
  rev: number;
}

/** 원문자 갈래가 몇 번 실행됐는가. 자리는 ①②③④⑤⑥⑦ 순이다. */
export type BranchHits = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface Step {
  /** `T1` 부터의 걸음 이름. */
  label: string;
  /** 이 걸음이 실행한 원문자 갈래. 실행에서 센 것이지 손으로 적은 것이 아니다. */
  branches: string;
  /** 갈래별 실행 횟수. */
  hits: BranchHits;
  /** 걸음이 끝난 시점의 `level`. */
  level: number[];
  /** 원래 간선 아홉 개의 잔여 용량. */
  caps: number[];
  /** 지금까지 보낸 양. 정본은 이 값을 안 세지만 걸음을 읽는 데 쓴다. */
  sent: number;
  /** 이 걸음이 한 일. */
  note: string;
}

export interface Counts {
  cut: number;
  /** 마지막 BFS 가 레벨을 적어 둔 정점 — 소스 쪽 무리다. */
  side: number[];
  /** 컷에 드는 원래 간선. */
  cutEdges: Edge[];
  /** 소스 쪽 안에서만 오가는 원래 간선. */
  insideEdges: Edge[];
  /** 싱크 쪽에서 소스 쪽으로 들어오는 원래 간선. */
  backEdges: Edge[];
  /** 싱크 쪽 안에서만 오가는 원래 간선. */
  outsideEdges: Edge[];
  /** 흘린 총량. */
  sent: number;
  /** BFS 를 실행한 횟수. */
  bfsRuns: number;
  /** 유량을 실제로 보낸 라운드 수. */
  flowRounds: number;
  /** 잔여 간선 항목을 한 번 본 총 횟수. */
  reads: number;
  /** 그중 BFS 가 본 것. */
  bfsReads: number;
  /** 그중 DFS 가 본 것. */
  dfsReads: number;
  /** 컷을 더할 때 원래 간선을 본 횟수. */
  cutReads: number;
  /** 걸음별 기록. */
  steps: Step[];
  /** 라운드별 `level` 과 흘린 경로. */
  rounds: { level: number[]; paths: { path: number[]; sent: number }[] }[];
  /** BFS 가 끝난 시점마다의 분할 상태. */
  snapshots: Snapshot[];
  /** 원래 간선의 마지막 잔여 용량. */
  finalCaps: number[];
}

/** BFS 하나가 끝난 시점의 분할 상태. */
export interface Snapshot {
  /** 레벨이 적힌 정점. */
  side: number[];
  /** 싱크가 그 안에 드는가. 들면 아직 분할이 아니다. */
  sinkInside: boolean;
  /** 경계를 건너는 **잔여 용량**의 합. */
  crossing: number;
  /** 경계를 건너는 **원래 간선** 용량의 합. */
  capacity: number;
  /** 그때까지 보낸 양. */
  sent: number;
}

/** 정본과 같은 절차에 세는 자리와 걸음 기록만 덧붙인 사본. */
export function counted(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): Counts {
  const graph: ResidualEdge[][] = Array.from({ length: n }, () => []);
  /** 원래 간선 `i` 의 정방향 항목이 놓인 자리. */
  const site: [number, number][] = [];
  const link = (u: number, v: number, c: number): void => {
    const out = graph[u] as ResidualEdge[];
    const back = graph[v] as ResidualEdge[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as ResidualEdge).rev = iBack;
    site.push([u, iOut]);
  };
  for (const [u, v, c] of edges) link(u, v, c);

  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  const caps = (): number[] =>
    site.map(([u, k]) => ((graph[u] as ResidualEdge[])[k] as ResidualEdge).cap);

  let bfsReads = 0;
  let dfsReads = 0;
  let bfsRuns = 0;
  let sent = 0;
  const steps: Step[] = [];
  const rounds: {
    level: number[];
    paths: { path: number[]; sent: number }[];
  }[] = [];
  const snapshots: Snapshot[] = [];

  /** 갈래별 실행 횟수 — 걸음이 끝날 때마다 걷어 낸다. */
  let hits: BranchHits = [0, 0, 0, 0, 0, 0, 0];
  const takeHits = (): BranchHits => {
    const out = hits;
    hits = [0, 0, 0, 0, 0, 0, 0];
    return out;
  };
  const marks = (h: BranchHits): string => {
    const names = "①②③④⑤⑥⑦";
    const out = [...names].filter((_, i) => (h[i] as number) > 0).join("");
    return out === "" ? "-" : out;
  };

  /**
   * 이 시점의 잔여 그래프에서 레벨이 적힌 정점 무리를 잘라 본다.
   *
   * `crossing` 은 경계를 건너는 **잔여 용량**의 합이고, `capacity` 는 경계를 건너는 **원래
   * 간선**의 용량 합이다. 앞엣것이 0 인 것이 BFS 가 끝난 시점의 보장이다.
   */
  const snapshot = (): void => {
    const inS = (v: number): boolean => (level[v] as number) !== -1;
    let crossing = 0;
    for (let u = 0; u < n; u++) {
      if (!inS(u)) continue;
      for (const e of graph[u] as ResidualEdge[]) {
        if (!inS(e.to)) crossing += e.cap;
      }
    }
    let capacity = 0;
    for (const [u, v, c] of edges) {
      if (inS(u) && !inS(v)) capacity += c;
    }
    const side: number[] = [];
    for (let v = 0; v < n; v++) if (inS(v)) side.push(v);
    snapshots.push({
      side,
      sinkInside: inS(sink),
      crossing,
      capacity,
      sent,
    });
  };

  function bfs(): void {
    bfsRuns++;
    level.fill(-1);
    level[source] = 0;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as ResidualEdge[]) {
        bfsReads++;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          hits[0]++;
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  }

  let path: number[] = [];
  function dfs(u: number, pushed: number): number {
    if (u === sink) {
      hits[2]++;
      return pushed;
    }
    const list = graph[u] as ResidualEdge[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as ResidualEdge;
      dfsReads++;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        hits[1]++;
        path.push(e.to);
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          hits[3]++;
          const back = (graph[e.to] as ResidualEdge[])[e.rev] as ResidualEdge;
          e.cap -= d;
          back.cap += d;
          return d;
        }
        path.pop();
      }
      hits[4]++;
    }
    return 0;
  }

  steps.push({
    label: "T1",
    branches: "-",
    hits: takeHits(),
    level: level.slice(),
    caps: caps(),
    sent: 0,
    note: `잔여 그래프에 항목 ${edges.length * 2} 개를 만든다`,
  });

  let flowRounds = 0;
  for (;;) {
    bfs();
    const roundIndex = rounds.length + 1;
    rounds.push({ level: level.slice(), paths: [] });
    snapshot();
    if ((level[sink] as number) === -1) {
      hits[5]++;
      const h = takeHits();
      steps.push({
        label: `T${steps.length + 1}`,
        branches: marks(h),
        hits: h,
        level: level.slice(),
        caps: caps(),
        sent,
        note: `라운드 ${roundIndex} BFS — 싱크에 레벨을 못 적어 반복을 끝낸다`,
      });
      break;
    }
    const head = takeHits();
    steps.push({
      label: `T${steps.length + 1}`,
      branches: marks(head),
      hits: head,
      level: level.slice(),
      caps: caps(),
      sent,
      note: `라운드 ${roundIndex} BFS — 싱크의 레벨이 ${level[sink]} 이다`,
    });
    flowRounds++;
    iter.fill(0);
    for (;;) {
      path = [source];
      const f = dfs(source, Number.POSITIVE_INFINITY);
      if (f === 0) {
        const tail = takeHits();
        steps.push({
          label: `T${steps.length + 1}`,
          branches: marks(tail),
          hits: tail,
          level: level.slice(),
          caps: caps(),
          sent,
          note: `라운드 ${roundIndex} 의 경로가 소진돼 0 이 올라온다`,
        });
        break;
      }
      sent += f;
      (
        rounds[roundIndex - 1] as { paths: { path: number[]; sent: number }[] }
      ).paths.push({ path: [...path], sent: f });
      const step = takeHits();
      steps.push({
        label: `T${steps.length + 1}`,
        branches: marks(step),
        hits: step,
        level: level.slice(),
        caps: caps(),
        sent,
        note: `${path.join(" → ")} 로 ${f} 만큼 보낸다`,
      });
    }
  }

  let cut = 0;
  let cutReads = 0;
  const cutEdges: Edge[] = [];
  const insideEdges: Edge[] = [];
  const backEdges: Edge[] = [];
  const outsideEdges: Edge[] = [];
  for (const [u, v, c] of edges) {
    cutReads++;
    const inU = (level[u] as number) !== -1;
    const inV = (level[v] as number) !== -1;
    if (inU && !inV) {
      hits[6]++;
      cut += c;
      cutEdges.push([u, v, c]);
    } else if (inU && inV) insideEdges.push([u, v, c]);
    else if (!inU && inV) backEdges.push([u, v, c]);
    else outsideEdges.push([u, v, c]);
  }
  const last = takeHits();
  steps.push({
    label: `T${steps.length + 1}`,
    branches: marks(last),
    hits: last,
    level: level.slice(),
    caps: caps(),
    sent,
    note: `원래 간선 ${edges.length} 개를 판정해 컷 용량 ${cut} 을 낸다`,
  });

  const side: number[] = [];
  for (let v = 0; v < n; v++) if ((level[v] as number) !== -1) side.push(v);

  return {
    cut,
    side,
    cutEdges,
    insideEdges,
    backEdges,
    outsideEdges,
    sent,
    bfsRuns,
    flowRounds,
    reads: bfsReads + dfsReads,
    bfsReads,
    dfsReads,
    cutReads,
    steps,
    rounds,
    snapshots,
    finalCaps: caps(),
  };
}

/**
 * 걸음 기록을 남기지 않는 계수 사본.
 *
 * `counted` 는 걸음마다 `level` 과 잔여 용량을 통째로 복사하므로 정점이 수백 개인 입력에서
 * 그 복사가 실행의 대부분이 된다. 큰 규모에서 **계수만** 필요한 자리는 이쪽을 쓴다 — 절차는
 * 같고 기록만 뺐다.
 */
export function countedLite(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): { cut: number; reads: number; bfsRuns: number; flowRounds: number } {
  const graph: ResidualEdge[][] = Array.from({ length: n }, () => []);
  const link = (u: number, v: number, c: number): void => {
    const out = graph[u] as ResidualEdge[];
    const back = graph[v] as ResidualEdge[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as ResidualEdge).rev = iBack;
  };
  for (const [u, v, c] of edges) link(u, v, c);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  let bfsRuns = 0;
  let flowRounds = 0;

  function bfs(): void {
    bfsRuns++;
    level.fill(-1);
    level[source] = 0;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as ResidualEdge[]) {
        reads++;
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  }
  function dfs(u: number, pushed: number): number {
    if (u === sink) return pushed;
    const list = graph[u] as ResidualEdge[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as ResidualEdge;
      reads++;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (graph[e.to] as ResidualEdge[])[e.rev] as ResidualEdge;
          e.cap -= d;
          back.cap += d;
          return d;
        }
      }
    }
    return 0;
  }
  for (;;) {
    bfs();
    if ((level[sink] as number) === -1) break;
    flowRounds++;
    iter.fill(0);
    for (;;) {
      if (dfs(source, Number.POSITIVE_INFINITY) === 0) break;
    }
  }
  let cut = 0;
  for (const [u, v, c] of edges) {
    reads++;
    if ((level[u] as number) !== -1 && (level[v] as number) === -1) cut += c;
  }
  return { cut, reads, bfsRuns, flowRounds };
}

/**
 * 정점 분할을 전수로 나열해 최소 컷을 낸다. 소스와 싱크의 소속은 고정이므로 나머지 `n − 2`
 * 개 정점만 두 무리에 배정한다.
 */
export function bruteForce(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): { best: number; tried: number; reads: number; values: Map<number, number> } {
  const free: number[] = [];
  for (let v = 0; v < n; v++) if (v !== source && v !== sink) free.push(v);
  const values = new Map<number, number>();
  let best = Number.POSITIVE_INFINITY;
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
    values.set(value, (values.get(value) ?? 0) + 1);
    best = Math.min(best, value);
  }
  return { best, tried: total, reads, values };
}

/** 분할 하나의 컷 용량. `S` 에 드는 정점을 그대로 받는다. */
export function cutOf(edges: Edge[], inS: Set<number>): number {
  let value = 0;
  for (const [u, v, c] of edges) {
    if (inS.has(u) && !inS.has(v)) value += c;
  }
  return value;
}

/** 소스에서 싱크로 흘릴 수 있는 최대 유량. 컷과 같은 값이 나오는지 견주는 데 쓴다. */
export function maxFlowValue(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): number {
  return counted(n, edges, source, sink).sent;
}

/**
 * 컷을 뽑을 때 **BFS 를 한 번 더 실행하는** 사본. 답은 정본과 같고 간선 검사만 늘어난다.
 *
 * 정본은 반복을 끝낸 BFS 가 적어 둔 `level` 을 그대로 읽는다. 이 사본은 그 배열을 버리고
 * 도달 집합을 새로 만든다 — 멈춤 절이 「답이 안 틀린다」를 값으로 보이는 자리다.
 */
export function extraBfsCopy(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): { cut: number; reads: number } {
  const base = countedLite(n, edges, source, sink);
  // 정본이 이미 다 흘린 뒤의 잔여 그래프를 다시 만들어 도달 집합만 새로 구한다.
  const graph: ResidualEdge[][] = Array.from({ length: n }, () => []);
  const link = (u: number, v: number, c: number): void => {
    const out = graph[u] as ResidualEdge[];
    const back = graph[v] as ResidualEdge[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as ResidualEdge).rev = iBack;
  };
  for (const [u, v, c] of edges) link(u, v, c);
  const level: number[] = Array.from({ length: n }, () => -1);
  const iter: number[] = Array.from({ length: n }, () => 0);
  function bfs(): void {
    level.fill(-1);
    level[source] = 0;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as ResidualEdge[]) {
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  }
  function dfs(u: number, pushed: number): number {
    if (u === sink) return pushed;
    const list = graph[u] as ResidualEdge[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as ResidualEdge;
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          const back = (graph[e.to] as ResidualEdge[])[e.rev] as ResidualEdge;
          e.cap -= d;
          back.cap += d;
          return d;
        }
      }
    }
    return 0;
  }
  for (;;) {
    bfs();
    if ((level[sink] as number) === -1) break;
    iter.fill(0);
    for (;;) {
      if (dfs(source, Number.POSITIVE_INFINITY) === 0) break;
    }
  }
  // 여기서부터가 더 실행하는 몫이다 — 방문 배열을 새로 잡고 잔여 그래프를 다시 지난다.
  const seen: boolean[] = Array.from({ length: n }, () => false);
  seen[source] = true;
  const queue: number[] = [source];
  let head = 0;
  let extra = 0;
  while (head < queue.length) {
    const u = queue[head++] as number;
    for (const e of graph[u] as ResidualEdge[]) {
      extra++;
      if (e.cap > 0 && seen[e.to] === false) {
        seen[e.to] = true;
        queue.push(e.to);
      }
    }
  }
  // 합산 걸음은 정본도 한 번 하므로 세지 않는다 — 두 판의 차이는 이 탐색 하나뿐이다.
  let cut = 0;
  for (const [u, v, c] of edges) {
    if (seen[u] === true && seen[v] === false) cut += c;
  }
  return { cut, reads: base.reads + extra };
}

/** 포화된 원래 간선의 용량을 전부 더한다 — 「포화 = 컷」 이라는 오해가 내는 값. */
export function saturatedSum(
  n: number,
  edges: Edge[],
  source: number,
  sink: number,
): { value: number; saturated: Edge[] } {
  const c = counted(n, edges, source, sink);
  let value = 0;
  const saturated: Edge[] = [];
  for (const [index, [u, v, cap]] of edges.entries()) {
    if (cap > 0 && (c.finalCaps[index] as number) === 0) {
      value += cap;
      saturated.push([u, v, cap]);
    }
  }
  return { value, saturated };
}

/** 격자·계단처럼 생성식으로 만든 입력의 이름표. 규모를 손으로 안 적는다. */
const label = (name: string, n: number, edges: Edge[]): string =>
  `${name} (V=${comma(n)} · E=${comma(edges.length)})`;

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./minCut-guide.ref.ts", import.meta.url).pathname;

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

const MUTANT_CASES: {
  label: string;
  n: number;
  edges: Edge[];
  source: number;
  sink: number;
}[] = [
  {
    label: "전개 입력",
    n: WALK_N,
    edges: WALK_EDGES,
    source: WALK_SRC,
    sink: WALK_SINK,
  },
  {
    label: "문제 지문의 예시",
    n: DOC_N,
    edges: DOC_EDGES,
    source: 0,
    sink: 3,
  },
  { label: "병목이 싱크 앞", n: TAIL_N, edges: TAIL_EDGES, source: 0, sink: 3 },
  { label: "경로 없음", n: CUTOFF_N, edges: CUTOFF_EDGES, source: 0, sink: 2 },
  { label: "간선 없음", n: 2, edges: [], source: 0, sink: 1 },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noPush.minCut === minCut;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
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
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edge[], number, number][] = [
    [WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK],
    [DOC_N, DOC_EDGES, 0, 3],
    [TAIL_N, TAIL_EDGES, 0, 3],
    [BRIDGE_N, BRIDGE_EDGES, 0, 3],
    [CUTOFF_N, CUTOFF_EDGES, 0, 2],
    [stair(12).n, stair(12).edges, 0, 12],
    [grid(6, 4).n, grid(6, 4).edges, 0, 1],
  ];
  for (const [n, edges, s, t] of inputs) {
    const want = minCut(n, edges, s, t).cut;
    if (counted(n, edges, s, t).cut !== want) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (countedLite(n, edges, s, t).cut !== want) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (extraBfsCopy(n, edges, s, t).cut !== want) {
      throw new Error("BFS 를 한 번 더 도는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 블록 ────────────────────────── */

const branchNames: [string, string][] = [
  ["①", "레벨을 적고 큐 뒤에 넣는다"],
  ["②", "레벨이 한 칸 큰 간선으로 내려간다"],
  ["③", "싱크에 도착해 병목값을 올려보낸다"],
  ["④", "짝지은 두 잔여 용량을 고친다"],
  ["⑤", "다음 간선으로 옮긴다"],
  ["⑥", "싱크에 레벨이 없어 반복을 끝낸다"],
  ["⑦", "건너가는 원래 간선의 용량을 더한다"],
];

const edgeName = (e: Edge): string => `${e[0]}→${e[1]}`;

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 정점 분할을 전수로 나열하면 규모가 얼마가 되는가. */
  naiveScale: () => {
    const rows = [4, 7, 10, 20, 40].map((v) => {
      const free = v - 2;
      const count = 2 ** free;
      return [
        String(v),
        String(free),
        comma(count),
        String(Math.floor(free * Math.log10(2)) + 1),
      ];
    });
    const free = V_LIMIT - 2;
    const digits = Math.floor(free * Math.log10(2)) + 1;
    return [
      ...table(
        [
          ["정점 V", "자유 정점 V−2", "분할 가짓수 2^(V−2)", "그 수의 자릿수"],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `제약 상한 V = ${comma(V_LIMIT)} 이면`,
      `  분할 가짓수  2^${comma(free)} 이고 그것은 ${comma(digits)} 자리 수다`,
      `  1 초에 10 억 개씩 본다고 해도 자릿수가 아홉만 줄어 ${comma(digits - 9)} 자리 초가 걸린다`,
    ].join("\n");
  },

  /** deep.build ② — 전개 입력의 분할 32 가지를 전부 나열해 최솟값을 낸다. */
  naiveWalk: () => {
    const b = bruteForce(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = [...b.values.entries()]
      .sort((x, y) => x[0] - y[0])
      .map(([value, count]) => [String(value), String(count)]);
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    return [
      `자유 정점 ${WALK_N - 2} 개 · 분할 ${b.tried} 가지 · 간선 검사 ${b.reads} 번`,
      "",
      ...table([["컷 용량", "그 값을 내는 분할 수"], ...rows], [0, 1]),
      "",
      `가장 작은 컷 용량  ${b.best}`,
      `정본이 낸 값       ${c.cut}`,
      `최대 유량          ${c.sent}`,
    ].join("\n");
  },

  /** deep.build ③ — 컷 후보 넷의 용량을 최대 유량과 나란히 놓는다. */
  weakDuality: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const candidates: [string, number[]][] = [
      ["{0}", [0]],
      ["{0, 1}", [0, 1]],
      ["{0, 3}", [0, 3]],
      ["{0, 1, 2, 3, 4}", [0, 1, 2, 3, 4]],
      ["{0, 1, 2, 3, 4, 5}", [0, 1, 2, 3, 4, 5]],
    ];
    const rows = candidates.map(([label, members]) => {
      const value = cutOf(WALK_EDGES, new Set(members));
      return [
        label,
        set(
          Array.from({ length: WALK_N }, (_, v) => v).filter(
            (v) => !members.includes(v),
          ),
        ),
        String(value),
        String(c.sent),
        value >= c.sent ? "예" : "아니오",
      ];
    });
    return [
      ...table(
        [
          ["소스 쪽 S", "싱크 쪽 T", "컷 용량", "최대 유량", "유량 이상인가"],
          ...rows,
        ],
        [2, 3],
      ),
      "",
      `가장 작은 컷 용량이 최대 유량과 같은 자리  S = ${set(c.side)}`,
    ].join("\n");
  },

  /** deep.build ④ — 컷을 고르는 규칙 후보 셋을 같은 입력들에 실제로 걸어 본다. */
  ruleCandidates: () => {
    const inputs: [string, number, Edge[], number, number][] = [
      ["전개 입력", WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK],
      ["문제 지문의 예시", DOC_N, DOC_EDGES, 0, 3],
      ["병목이 싱크 앞", TAIL_N, TAIL_EDGES, 0, 3],
      ["다리 그래프", BRIDGE_N, BRIDGE_EDGES, 0, 3],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const c = counted(n, edges, s, t);
      const onlySource = cutOf(edges, new Set([s]));
      const sat = saturatedSum(n, edges, s, t).value;
      const brute = bruteForce(n, edges, s, t).best;
      return [
        label,
        String(onlySource),
        String(sat),
        String(c.cut),
        String(brute),
      ];
    });
    return table(
      [
        [
          "입력",
          "S 를 {소스} 로 둔다",
          "포화된 간선을 다 더한다",
          "잔여 도달 집합을 쓴다",
          "전수 나열의 최솟값",
        ],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.build ⑤ — 도달 집합이 라운드마다 어떻게 좁아지는가. */
  reachShrink: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = c.snapshots.map((s, index) => [
      String(index + 1),
      show(c.rounds[index]?.level ?? []),
      set(s.side),
      s.sinkInside ? "레벨을 받는다" : "레벨을 못 받는다",
      s.sinkInside ? "분할이 아니다" : String(s.capacity),
    ]);
    return [
      ...table(
        [
          [
            "BFS 회차",
            "level",
            "레벨이 적힌 정점",
            "싱크가",
            "그 분할의 컷 용량",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      `싱크가 레벨을 못 받은 그 회차의 분할이 답이다 — 컷 용량 ${c.cut} · 최대 유량 ${c.sent}`,
    ].join("\n");
  },

  /** deep.build ⑥ — 규칙 셋의 계수를 규모를 바꿔 가며 잰다. */
  ruleCost: () => {
    const small = grid(6, 4);
    const big = grid(20, 10);
    const st = stair(12);
    const inputs: [string, number, Edge[], number, number][] = [
      [
        label("전개 입력", WALK_N, WALK_EDGES),
        WALK_N,
        WALK_EDGES,
        WALK_SRC,
        WALK_SINK,
      ],
      [label("격자 6x4", small.n, small.edges), small.n, small.edges, 0, 1],
      [label("격자 20x10", big.n, big.edges), big.n, big.edges, 0, 1],
      [label("계단 m=12", st.n, st.edges), st.n, st.edges, 0, 12],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const free = n - 2;
      const brute = free <= 20 ? 2 ** free : Number.POSITIVE_INFINITY;
      const c = countedLite(n, edges, s, t);
      return [
        label,
        Number.isFinite(brute) ? comma(brute) : `2^${comma(free)}`,
        Number.isFinite(brute)
          ? comma(brute * edges.length)
          : `2^${comma(free)} × ${comma(edges.length)}`,
        comma(c.reads),
      ];
    });
    return table(
      [
        ["입력", "분할 가짓수", "전수 나열의 간선 검사", "이 절차의 간선 검사"],
        ...rows,
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.walk — 라운드마다의 레벨과 흘린 경로. */
  walkRounds: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows: string[][] = [];
    for (const [index, r] of c.rounds.entries()) {
      if (r.paths.length === 0) {
        rows.push([String(index + 1), show(r.level), "없다", "-", "-"]);
        continue;
      }
      for (const p of r.paths) {
        const usesReverse = p.path.some(
          (v, i) =>
            i > 0 &&
            !WALK_EDGES.some(([a, b]) => a === p.path[i - 1] && b === v),
        );
        rows.push([
          String(index + 1),
          show(r.level),
          p.path.join(" → "),
          String(p.sent),
          usesReverse ? "지난다" : "안 지난다",
        ]);
      }
    }
    return [
      ...table(
        [["라운드", "level", "흘린 경로", "보낸 양", "역방향 간선"], ...rows],
        [0, 3],
      ),
      "",
      `보낸 총량 ${c.sent} · BFS ${c.bfsRuns} 번 · 유량을 보낸 라운드 ${c.flowRounds} 번`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음별 상태. */
  walkTrace: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = c.steps.map((s) => [
      s.label,
      s.branches,
      show(s.level),
      s.caps.join(","),
      String(s.sent),
      s.note,
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "갈래",
            "level",
            "원래 간선 아홉 개의 잔여 용량",
            "보낸 양",
            "이 걸음이 한 일",
          ],
          ...rows,
        ],
        [4],
      ),
      "",
      "잔여 용량 칸의 순서는 입력 간선 목록의 순서다",
      `  ${WALK_EDGES.map(edgeName).join(" · ")}`,
    ].join("\n");
  },

  /** deep.walk — 일곱 갈래가 어느 걸음에서 실행됐는가. */
  branchCoverage: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = branchNames.map(([mark, what]) => {
      const at = c.steps
        .filter((s) => s.branches.includes(mark))
        .map((s) => s.label);
      return [mark, what, String(at.length), at.join(" · ")];
    });
    return table([["갈래", "무엇", "횟수", "실행된 걸음"], ...rows], [2]).join(
      "\n",
    );
  },

  /** deep.walk — 마지막 level 로 원래 간선 아홉 개를 판정한다. */
  walkCut: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const last = c.steps[c.steps.length - 1] as Step;
    let acc = 0;
    const rows = WALK_EDGES.map(([u, v, cap]) => {
      const lu = last.level[u] as number;
      const lv = last.level[v] as number;
      const isCut = lu !== -1 && lv === -1;
      if (isCut) acc += cap;
      const kind = isCut
        ? "경계를 건넌다"
        : lu !== -1 && lv !== -1
          ? "소스 쪽 안에서만 오간다"
          : lu === -1 && lv !== -1
            ? "싱크 쪽에서 소스 쪽으로 들어온다"
            : "싱크 쪽 안에서만 오간다";
      return [
        `${u}→${v}`,
        String(cap),
        String(lu),
        String(lv),
        kind,
        isCut ? String(cap) : "0",
        String(acc),
      ];
    });
    return [
      ...table(
        [
          [
            "원래 간선",
            "용량",
            "level[u]",
            "level[v]",
            "어떤 간선인가",
            "더하는 값",
            "여기까지 누적",
          ],
          ...rows,
        ],
        [1, 2, 3, 5, 6],
      ),
      "",
      `소스 쪽 무리 ${set(c.side)} · 컷 용량 ${c.cut} · 최대 유량 ${c.sent}`,
    ].join("\n");
  },

  /** 멈춤 1 — 포화된 간선을 다 더하면 몇이 나오는가. */
  pauseSaturated: () => {
    const rows = MUTANT_CASES.map((m) => {
      const s = saturatedSum(m.n, m.edges, m.source, m.sink);
      const ref = minCut(m.n, m.edges, m.source, m.sink).cut;
      return [
        m.label,
        String(s.value),
        String(ref),
        s.value === ref ? "같다" : "다르다",
        s.saturated.length === 0
          ? "없다"
          : s.saturated.map(edgeName).join(" · "),
      ];
    });
    return [
      ...table(
        [
          ["입력", "포화된 간선의 용량 합", "정본", "판정", "포화된 원래 간선"],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      "전개 입력에서 포화된 간선 중 0→1 은 양 끝이 다 소스 쪽에 있어 경계를 안 건넌다",
    ].join("\n");
  },

  /** 멈춤 2 — 도착점 검사를 뺀 변이. */
  pauseTargetCheck: () => {
    const rows = MUTANT_CASES.map((m) => {
      const a = minCut(m.n, m.edges, m.source, m.sink).cut;
      const b = noTargetCheck.minCut(m.n, m.edges, m.source, m.sink).cut;
      return [m.label, String(a), String(b), a === b ? "같다" : "다르다"];
    });
    return table(
      [["입력", "정본", "도착점 검사를 뺀 판", "판정"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** 멈춤 3 — 컷을 뽑으려고 BFS 를 한 번 더 실행하면. */
  pauseExtraBfs: () => {
    const big = grid(20, 10);
    const st = stair(200);
    const inputs: [string, number, Edge[], number, number][] = [
      [
        label("전개 입력", WALK_N, WALK_EDGES),
        WALK_N,
        WALK_EDGES,
        WALK_SRC,
        WALK_SINK,
      ],
      [label("격자 20x10", big.n, big.edges), big.n, big.edges, 0, 1],
      [label("계단 m=200", st.n, st.edges), st.n, st.edges, 0, 200],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const base = countedLite(n, edges, s, t);
      const more = extraBfsCopy(n, edges, s, t);
      return [
        label,
        String(base.cut),
        String(more.cut),
        base.cut === more.cut ? "같다" : "다르다",
        comma(base.reads),
        comma(more.reads),
        comma(more.reads - base.reads),
      ];
    });
    return table(
      [
        [
          "입력",
          "정본",
          "BFS 를 한 번 더 실행하는 판",
          "판정",
          "정본의 간선 검사",
          "한 번 더 실행하는 판의 간선 검사",
          "차이",
        ],
        ...rows,
      ],
      [1, 2, 4, 5, 6],
    ).join("\n");
  },

  /** 불변식 ② — BFS 가 끝날 때마다 두 문장을 확인한다. */
  invariantWatch: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = c.snapshots.map((s, index) => [
      String(index + 1),
      set(s.side),
      String(s.crossing),
      s.sinkInside ? "-" : String(s.capacity),
      String(s.sent),
      s.crossing === 0 && (s.sinkInside || s.capacity === s.sent)
        ? "지킨다"
        : "어긋난다",
    ]);
    return [
      ...table(
        [
          [
            "BFS 회차",
            "레벨이 적힌 정점 S",
            "경계를 건너는 잔여 용량",
            "S 의 컷 용량",
            "그때까지 보낸 양",
            "두 문장",
          ],
          ...rows,
        ],
        [0, 2, 3, 4],
      ),
      "",
      "싱크가 아직 S 안에 있는 회차는 분할이 아니라 컷 용량 칸을 비웠다",
    ].join("\n");
  },

  /** 불변식 ② — 경계 입력을 정본에 그대로 걸어 본다. */
  invariantEdges: () => {
    const cases: [string, number, Edge[], number, number][] = [
      ["간선 없음", 2, [], 0, 1],
      ["소스와 싱크가 직접 이어져 있다", 2, [[0, 1, 100]], 0, 1],
      ["소스에서 싱크로 가는 경로가 없다", CUTOFF_N, CUTOFF_EDGES, 0, 2],
      [
        "용량 0 인 간선뿐",
        2,
        [
          [0, 1, 0],
          [0, 1, 0],
        ],
        0,
        1,
      ],
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
        "자기 자신을 가리키는 간선",
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
          [0, 1, C_LIMIT],
          [1, 2, C_LIMIT],
        ],
        0,
        2,
      ],
    ];
    const rows = cases.map(([name, n, edges, s, t]) => {
      const c = counted(n, edges, s, t);
      return [
        name,
        comma(minCut(n, edges, s, t).cut),
        set(c.side),
        comma(c.sent),
        String(c.bfsRuns),
      ];
    });
    return table(
      [["입력", "컷", "소스 쪽 무리", "최대 유량", "BFS 횟수"], ...rows],
      [1, 3, 4],
    ).join("\n");
  },

  /** 불변식 ③ — 레벨을 적은 정점을 큐에 넣는 줄을 뺀 변이. */
  mutantNoPush: () => {
    const rows = MUTANT_CASES.map((m) => {
      const a = minCut(m.n, m.edges, m.source, m.sink).cut;
      const b = noPush.minCut(m.n, m.edges, m.source, m.sink).cut;
      return [m.label, String(a), String(b), a === b ? "같다" : "다르다"];
    });
    return table(
      [["입력", "정본", "큐에 안 넣는 판", "판정"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** perf.derive — 걸음마다 간선 항목을 몇 번 봤는가. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const rows = [
      [
        "잔여 그래프 만들기",
        comma(WALK_EDGES.length),
        `항목 ${WALK_EDGES.length * 2} 개를 만든다`,
      ],
      [
        `BFS ${c.bfsRuns} 번`,
        comma(c.bfsReads),
        "T2 · T6 · T9 — 라운드마다 한 번, 마지막에 한 번 더",
      ],
      ["DFS", comma(c.dfsReads), "T3 · T4 · T5 · T7 · T8"],
      ["컷 합산", comma(c.cutReads), "T10 — 원래 간선 목록을 한 번 지난다"],
    ];
    return [
      ...table([["무엇", "간선을 본 횟수", "설명"], ...rows], [1]),
      "",
      `합계 ${comma(WALK_EDGES.length + c.reads + c.cutReads)} 번`,
      `그중 컷을 뽑는 데 든 것은 ${c.cutReads} 번뿐이다 — 나머지는 유량을 흘리는 몫이다`,
    ].join("\n");
  },

  /** perf.worst — 계단 입력이 라운드 수를 V−1 까지 채운다. */
  worstRounds: () => {
    const rows = [4, 8, 50, 200, 499].map((m) => {
      const { n, edges } = stair(m);
      const c = countedLite(n, edges, 0, m);
      return [
        String(m),
        comma(n),
        comma(edges.length),
        comma(c.flowRounds),
        comma(n - 1),
        comma(c.reads),
        String(c.cut),
      ];
    });
    return [
      ...table(
        [
          [
            "계단 층수 m",
            "정점 V",
            "간선 E",
            "유량을 보낸 라운드",
            "상한 V−1",
            "간선 검사",
            "컷",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      "라운드가 상한을 그대로 채운다 — 경로 길이가 1, 2, …, m 으로 서로 달라서다",
    ].join("\n");
  },

  /** perf.worst — 라운드 수를 그대로 두고 간선만 늘린다. */
  worstScale: () => {
    const rows: string[][] = [];
    for (const extra of [0, 1_000, 5_000, 9_000]) {
      const { n, edges } = stairPlus(499, extra);
      const c = countedLite(n, edges, 0, 499);
      rows.push([
        extra === 0 ? "계단만" : `계단 + 뒤로 가는 간선 ${comma(extra)} 개`,
        comma(n),
        comma(edges.length),
        comma(c.flowRounds),
        comma(c.reads),
      ]);
    }
    const g = grid(20, 10);
    const gc = countedLite(g.n, g.edges, 0, 1);
    rows.push([
      label("격자 20x10", g.n, g.edges),
      comma(g.n),
      comma(g.edges.length),
      comma(gc.flowRounds),
      comma(gc.reads),
    ]);
    return [
      ...table(
        [["입력", "정점 V", "간선 E", "라운드", "간선 검사"], ...rows],
        [1, 2, 3, 4],
      ),
      "",
      "격자 줄과 견주면 크기가 아니라 라운드 수가 값을 정하는 것이 나온다",
    ].join("\n");
  },

  /** perf.worst — 규모를 4 배씩 늘리며 상한에 대한 비를 잰다. */
  worstGrowth: () => {
    const rows = [8, 32, 128, 499].map((m) => {
      const { n, edges } = stair(m);
      const c = countedLite(n, edges, 0, m);
      const bound = n * n * edges.length;
      return [
        comma(n),
        comma(edges.length),
        comma(c.reads),
        comma(bound),
        (c.reads / bound).toFixed(5),
      ];
    });
    return [
      ...table(
        [["정점 V", "간선 E", "간선 검사", "상한 V²E", "그 비"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "마지막 열이 0 쪽으로 작아진다 — 이 입력은 라운드 수만 채우고 라운드당 경로 수를 못 채운다",
    ].join("\n");
  },

  /** deep.math ② — 정의를 전개 입력의 두 분할에 넣어 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK);
    const parts: [string, number[]][] = [
      ["{0}", [0]],
      ["{0, 1, 2, 3, 4}", [0, 1, 2, 3, 4]],
    ];
    const rows = parts.map(([label, members]) => {
      const inS = new Set(members);
      let forward = 0;
      let backward = 0;
      let cap = 0;
      for (const [index, [u, v, capacity]] of WALK_EDGES.entries()) {
        const sent = capacity - (c.finalCaps[index] as number);
        if (inS.has(u) && !inS.has(v)) {
          cap += capacity;
          forward += sent;
        } else if (!inS.has(u) && inS.has(v)) backward += sent;
      }
      return [
        label,
        String(cap),
        String(forward),
        String(backward),
        String(forward - backward),
        String(c.sent),
      ];
    });
    return [
      ...table(
        [
          [
            "분할 S",
            "c(S,T)",
            "f(S,T)",
            "f(T,S)",
            "f(S,T) − f(T,S)",
            "보낸 총량 |f|",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      "두 분할에서 f(S,T) − f(T,S) 가 같은 값이다 — 어느 분할로 잘라도 건너간 순량은 |f| 다",
    ].join("\n");
  },

  /** deep.math ④ — 결과식에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [
      [50, 500],
      [200, 4_000],
      [V_LIMIT, E_LIMIT],
    ].map(([v, e]) => [
      comma(v as number),
      comma(e as number),
      comma((v as number) * (v as number) * (e as number)),
      comma((e as number) * C_LIMIT),
    ]);
    return [
      ...table(
        [["정점 V", "간선 E", "V²E", "컷 용량의 상한 E·c"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      "제약 상한에서",
      `  간선 검사의 상한  V²E = ${comma(V_LIMIT * V_LIMIT * E_LIMIT)} 번`,
      `  컷 용량의 상한    E·c = ${comma(E_LIMIT * C_LIMIT)} 이고 이 값은 배정밀도 정수로 정확하다`,
    ].join("\n");
  },

  /** related — 약한 쌍대성과 강한 쌍대성을 값으로 갈라 보인다. */
  duality: () => {
    const inputs: [string, number, Edge[], number, number][] = [
      ["전개 입력", WALK_N, WALK_EDGES, WALK_SRC, WALK_SINK],
      ["문제 지문의 예시", DOC_N, DOC_EDGES, 0, 3],
      ["병목이 싱크 앞", TAIL_N, TAIL_EDGES, 0, 3],
      ["다리 그래프", BRIDGE_N, BRIDGE_EDGES, 0, 3],
      ["경로 없음", CUTOFF_N, CUTOFF_EDGES, 0, 2],
    ];
    const rows = inputs.map(([label, n, edges, s, t]) => {
      const c = counted(n, edges, s, t);
      const b = bruteForce(n, edges, s, t);
      const worst = Math.max(...[...b.values.keys()].map((v) => v));
      return [
        label,
        String(c.sent),
        String(c.cut),
        String(b.best),
        String(worst),
        c.sent === b.best ? "같다" : "다르다",
      ];
    });
    return table(
      [
        [
          "입력",
          "최대 유량",
          "이 절차의 컷",
          "전수 나열의 최소 컷",
          "가장 큰 컷",
          "유량과 최소 컷",
        ],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },
};
