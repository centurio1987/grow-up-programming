/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.md
 *
 * **걸음을 기록하는 사본이 하나 있다**(`traced`). 정본은 간선 하나를 볼 때 무엇을 읽고 썼는지 내보내지
 * 않으므로, 정본과 같은 절차에 기록만 덧붙인 사본이 아니면 걸음별 상태를 낼 방법이 없다. 그 사본이
 * 정본과 같은 답을 내는지는 이 파일이 읽힐 때 스스로 확인한다. 계수만 세는 사본 셋(`byScan`·
 * `byLabel`·`byDsu`)도 답을 정본과 맞댄 뒤에만 표에 오른다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 표의 「반환값」·「합계」 칸 중 옳은 쪽은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 걸음 재생 패널(`.sim.ts`)과 그림(`.fig.tsx`)도 `traced` 의 기록에서 만든다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import benchJson from "./kruskalMst-guide.bench.json";
import { kruskalMst } from "./kruskalMst-guide.ref.ts";

export type Edge = [number, number, number];

const REF = new URL("./kruskalMst-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 정렬 전 순서가 가중치 순과 어긋나 있고(첫 간선이 둘째로 무겁다),
 * 사이클을 만드는 간선이 하나 있으며, 마지막 간선을 보기 전에 `n-1` 개가 차서 조기 종료가
 * 실행된다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [3, 4, 6],
  [0, 1, 1],
  [0, 3, 4],
  [4, 5, 5],
  [2, 3, 2],
  [0, 5, 7],
  [1, 2, 3],
];

/** 삼각형. 가장 무거운 간선 하나가 빠지는 최소 사례다. */
const TRI_N = 3;
const TRI_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 2],
  [0, 2, 3],
];

/** 같은 삼각형을 무거운 간선부터 적었다. 정렬을 빼면 이 순서 그대로 본다. */
const TRI_REV: Edge[] = [...TRI_EDGES].reverse();

/** 정점 넷이 사각형을 이루고 가중치가 전부 같다. 어느 셋을 골라도 합계가 같다. */
const SQUARE_N = 4;
const SQUARE_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
  [0, 3, 1],
];

/** 정점 셋인데 간선이 하나뿐이다. 정점 2 가 어디에도 안 이어져 신장 트리가 없다. */
const SPLIT_N = 3;
const SPLIT_EDGES: Edge[] = [[0, 1, 5]];

/** 정점 넷이 둘씩만 이어져 있다. 간선을 다 봐도 고른 간선이 `n-1` 에 못 미친다. */
export const PAIRS_N = 4;
export const PAIRS_EDGES: Edge[] = [
  [0, 1, 3],
  [2, 3, 4],
];

/** 최소 신장 트리와 최단 경로가 갈리는 가장 작은 그래프. */
const SPLITPATH_N = 3;
const SPLITPATH_EDGES: Edge[] = [
  [0, 1, 2],
  [1, 2, 2],
  [0, 2, 3],
];

/** 정점 `v` 개를 한 줄로 이은 무방향 그래프 — `0—1—…—(v-1)`, 가중치는 자리 번호 + 1. */
function path(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 그래프. 가중치는 상대 정점 번호다. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, i]);
  return out;
}

/**
 * 정점 `v` 개에 **가장 무거운 간선만** 한 벌 얹는다. 가중치가 이 과제의 상한이라 정렬하면 전부
 * 뒤로 가고, 앞에서 이미 `n-1` 개가 찼으면 한 개도 안 본다.
 */
function heavy(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v; i++) out.push([i, (i + 7) % v, 1_000_000_000]);
  return out;
}

/**
 * 정점 `v` 개(2 의 거듭제곱)를 **둘씩 짝지어 올리는** 순서로 잇는 간선 목록. 가중치를 단계
 * 번호로 두어 정렬하면 같은 크기의 덩어리끼리만 만난다 — rank 가 실제로 자라는 모양이다.
 */
function tournament(v: number): Edge[] {
  const out: Edge[] = [];
  for (let span = 1; span < v; span *= 2) {
    for (let i = 0; i + span < v; i += span * 2) {
      out.push([i, i + span, Math.log2(span) + 1]);
    }
  }
  return out;
}

/**
 * 정점 `v` 개짜리 완전 그래프. 가중치는 `(i × 31 + j × 17) mod 997 + 1` 로 정한다 —
 * 난수가 아니라 식이라 같은 값이 몇 번을 실행해도 나온다.
 */
function complete(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++)
      out.push([i, j, ((i * 31 + j * 17) % 997) + 1]);
  }
  return out;
}

/**
 * 한 줄로 이은 뒤 선형 합동 생성기로 간선을 더 뿌린 그래프. 시드가 상수라 같은 그래프가 나온다.
 * 한 줄 간선의 가중치는 `(i × 7,919) mod 1,000 + 1` 이고 뿌린 간선은 생성기의 다음 값에서 받는다.
 */
function scattered(v: number, e: number): Edge[] {
  let seed = 7;
  const next = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, ((i * 7919) % 1000) + 1]);
  while (out.length < e) {
    const a = next() % v;
    const b = next() % v;
    const w = (next() % 1000) + 1;
    if (a !== b) out.push([a, b, w]);
  }
  return out;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `1,299,994` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 간선 이름 `(0,1)` — 본문 표기와 같다. 뒤 조사는 끝 정점 번호에서 고른다. */
export const edgeName = (u: number, v: number): string => `(${u},${v})`;

const list = (xs: readonly (number | string)[]): string => `[${xs.join(", ")}]`;
export const setName = (xs: readonly number[]): string => `{${xs.join(",")}}`;

/** 마크다운 표 한 벌. `right` 는 오른쪽 정렬할 열 번호. */
function md(
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

/** 등폭 두 열 — 이름과 값. 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function pairs(rows: readonly [string, string][]): string[] {
  const w = Math.max(...rows.map(([a]) => width(a)));
  return rows.map(([a, b]) => `${pad(a, w)}  ${b}`.replace(/\s+$/, ""));
}

/* ────────────────────── 걸음을 기록하는 사본 ────────────────────── */

/** 간선 하나를 볼 때 어느 갈래로 갔는가. `cycle` 은 건너뛰기를 지운 변이에서만 나온다. */
export type Branch = "skip" | "gt" | "eq" | "lt" | "cycle";

/** 간선 하나를 본 걸음의 기록. `parent`·`rank` 는 그 걸음이 끝난 뒤의 배열이다. */
export interface Look {
  /** 본문의 걸음 번호. 정렬이 T1 이라 첫 간선이 T2 다. */
  readonly t: number;
  /** 정렬한 목록에서 몇 번째 간선인가(0 부터). */
  readonly k: number;
  readonly u: number;
  readonly v: number;
  readonly w: number;
  /** `find(u)` 가 첫 바퀴에 따라간 정점 — `u` 부터 대표까지. */
  readonly pathU: readonly number[];
  /** `find(v)` 가 첫 바퀴에 따라간 정점. `find(u)` 가 압축을 마친 뒤에 따라간 길이다. */
  readonly pathV: readonly number[];
  readonly ru: number;
  readonly rv: number;
  /** 합치기 직전 두 대표의 rank. */
  readonly rankRu: number;
  readonly rankRv: number;
  /** 둘째 바퀴가 고쳐 쓴 칸 — `parent[x]` 를 `from` 에서 `to` 로. */
  readonly compressed: readonly { x: number; from: number; to: number }[];
  readonly branch: Branch;
  /** 다른 대표 밑에 붙은 대표. 건너뛴 걸음이면 `null`. */
  readonly child: number | null;
  /** 남은 대표. */
  readonly root: number | null;
  readonly rankUp: boolean;
  readonly parent: readonly number[];
  readonly rank: readonly number[];
  readonly total: number;
  readonly picked: number;
  /** 이 걸음 뒤 `picked === n - 1` 이라 반복을 끝냈는가. */
  readonly stop: boolean;
  /** 이 걸음이 `parent`·`rank` 를 읽고 쓴 칸 수 — `byDsu` 와 같은 정의. */
  readonly cells: number;
}

export interface Run {
  readonly n: number;
  readonly sorted: readonly Edge[];
  readonly looks: readonly Look[];
  /** 반복을 끝낸 뒤 보지 않고 남은 간선. */
  readonly unseen: readonly Edge[];
  readonly answer: number;
}

interface TraceOptions {
  /** 정렬 호출을 뺀 판. */
  readonly sort?: boolean;
  /** 대표가 같을 때 건너뛰는 줄을 지운 판. */
  readonly keepCycle?: boolean;
  /** 걸음 `t` 를 시작하기 직전에 `rank[vertex]` 를 `value` 로 바꿔 둔다(스스로 점검하기의 가정). */
  readonly rankOverride?: {
    readonly t: number;
    readonly vertex: number;
    readonly value: number;
  };
}

/** 정본과 같은 절차에 기록만 덧붙인 사본. 옵션을 안 주면 정본과 같은 답을 내야 한다. */
export function traced(n: number, edges: Edge[], opts: TraceOptions = {}): Run {
  const sorted =
    opts.sort === false ? [...edges] : [...edges].sort((a, b) => a[2] - b[2]);
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  const rank: number[] = Array.from({ length: n }, () => 0);
  let total = 0;
  let picked = 0;
  const looks: Look[] = [];
  let cells = 0;

  const find = (
    x: number,
    writes: { x: number; from: number; to: number }[],
  ): { root: number; walked: number[] } => {
    const walked: number[] = [x];
    let root = x;
    while (true) {
      cells += 1;
      if (parent[root] === root) break;
      root = parent[root] as number;
      walked.push(root);
    }
    let cur = x;
    while (parent[cur] !== root) {
      cells += 2;
      const next = parent[cur] as number;
      writes.push({ x: cur, from: next, to: root });
      parent[cur] = root;
      cur = next;
    }
    cells += 1;
    return { root, walked };
  };

  for (const [k, [u, v, w]] of sorted.entries()) {
    const t = k + 2;
    if (opts.rankOverride?.t === t) {
      rank[opts.rankOverride.vertex] = opts.rankOverride.value;
    }
    cells = 0;
    const writes: { x: number; from: number; to: number }[] = [];
    const fu = find(u, writes);
    const fv = find(v, writes);
    const ru = fu.root;
    const rv = fv.root;
    const rankRu = rank[ru] as number;
    const rankRv = rank[rv] as number;
    let branch: Branch;
    let child: number | null = null;
    let root: number | null = null;
    let rankUp = false;
    if (ru === rv && opts.keepCycle !== true) {
      branch = "skip";
    } else {
      cells += 2;
      if (rankRu > rankRv) {
        parent[rv] = ru;
        cells += 1;
        branch = "gt";
        child = rv;
        root = ru;
      } else {
        parent[ru] = rv;
        cells += 1;
        child = ru;
        root = rv;
        branch = ru === rv ? "cycle" : rankRu === rankRv ? "eq" : "lt";
        if (rank[ru] === rank[rv]) {
          rank[rv] = (rank[rv] as number) + 1;
          cells += 2;
          rankUp = true;
        }
      }
      total += w;
      picked++;
    }
    const stop = branch !== "skip" && picked === n - 1;
    looks.push({
      t,
      k,
      u,
      v,
      w,
      pathU: fu.walked,
      pathV: fv.walked,
      ru,
      rv,
      rankRu,
      rankRv,
      compressed: writes,
      branch,
      child,
      root,
      rankUp,
      parent: [...parent],
      rank: [...rank],
      total,
      picked,
      stop,
      cells,
    });
    if (stop) {
      return { n, sorted, looks, unseen: sorted.slice(k + 1), answer: total };
    }
  }
  return {
    n,
    sorted,
    looks,
    unseen: [],
    answer: picked === n - 1 ? total : -1,
  };
}

/** 대표 배열에서 정점마다의 대표를 읽는다. 배열을 고치지 않는다. */
export function rootsOf(parent: readonly number[]): number[] {
  return parent.map((_, x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as number;
    return r;
  });
}

/** 정점마다 대표까지 따라가는 칸 수. */
export function depthsOf(parent: readonly number[]): number[] {
  return parent.map((_, x) => {
    let d = 0;
    let r = x;
    while (parent[r] !== r) {
      r = parent[r] as number;
      d++;
    }
    return d;
  });
}

/** 대표가 같은 정점끼리 묶는다. 묶음은 가장 작은 정점 번호 순, 묶음 안도 오름차순이다. */
export function setsOf(parent: readonly number[]): number[][] {
  const roots = rootsOf(parent);
  const by = new Map<number, number[]>();
  for (const [x, r] of roots.entries()) {
    const g = by.get(r) ?? [];
    g.push(x);
    by.set(r, g);
  }
  return [...by.values()].sort((a, b) => (a[0] as number) - (b[0] as number));
}

/** 고른 간선만으로 이어진 정점 묶음 — 유니온 파인드를 안 쓰고 너비 우선 탐색으로 낸다. */
function componentsOf(n: number, chosen: readonly Edge[]): number[][] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of chosen) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    const group: number[] = [];
    const queue = [s];
    seen[s] = true;
    while (queue.length > 0) {
      const x = queue.shift() as number;
      group.push(x);
      for (const y of near[x] as number[]) {
        if (seen[y]) continue;
        seen[y] = true;
        queue.push(y);
      }
    }
    out.push(group.sort((a, b) => a - b));
  }
  return out;
}

/** 기록에서 고른 간선만. */
export const chosenOf = (looks: readonly Look[]): Edge[] =>
  looks.filter((l) => l.branch !== "skip").map((l) => [l.u, l.v, l.w] as Edge);

/** 전개 입력의 기록 — 모듈을 읽을 때 한 번 만들고 정본의 답과 맞댄다. */
export const WALK: Run = traced(WALK_N, WALK_EDGES);
if (WALK.answer !== kruskalMst(WALK_N, WALK_EDGES)) {
  throw new Error(
    `기록 사본의 답 ${WALK.answer} 이 정본의 답과 다르다 — 사본을 정본에 맞춘다`,
  );
}
/** 둘씩 이어진 정점 넷의 기록 — 간선을 다 보고도 못 채우는 갈래(⑥)가 실행된다. */
export const PAIRS: Run = traced(PAIRS_N, PAIRS_EDGES);
if (PAIRS.answer !== kruskalMst(PAIRS_N, PAIRS_EDGES)) {
  throw new Error("둘씩 이어진 정점 넷에서 기록 사본이 정본과 다르다");
}

/** 걸음 `t` 의 기록. */
export const lookAt = (t: number): Look => {
  const l = WALK.looks.find((x) => x.t === t);
  if (l === undefined) throw new Error(`T${t} 가 전개 기록에 없다`);
  return l;
};

/** 걸음 `t` 가 끝난 뒤의 parent. T1(정렬) 뒤는 모두 자기 자신이다. */
export const parentAfter = (t: number): readonly number[] =>
  t <= 1 ? Array.from({ length: WALK_N }, (_, i) => i) : lookAt(t).parent;
export const rankAfter = (t: number): readonly number[] =>
  t <= 1 ? Array.from({ length: WALK_N }, () => 0) : lookAt(t).rank;

/** 마지막 걸음 번호 — 조기 종료로 반환하는 걸음이다. */
export const LAST_T = (WALK.looks.at(-1) as Look).t + 1;

/** 갈래의 원문자 라벨. 라벨은 본문 코드의 주석과 같다. */
export const branchLabel = (b: Branch): string =>
  b === "skip" ? "②" : b === "gt" ? "①③" : b === "eq" ? "①④" : "①";

/* ────────────────────── 계수만 세는 사본과 다른 절차 ────────────────────── */

/**
 * 가장 단순한 방법 — 간선 목록에서 **크기 `n-1` 인 부분집합을 전부** 만들어, 그것이 모든
 * 정점을 잇는지 검사하고 가중치 합이 가장 작은 것을 남긴다. 기법이 하나도 안 들어간 풀이다.
 * `must` 를 주면 그 간선을 모두 담은 부분집합만 본다(불변식 확인에 쓴다).
 */
function bruteForce(
  n: number,
  edges: Edge[],
  must: readonly Edge[] = [],
): { best: number; tried: number; spanning: number; reads: number } {
  const pickCount = n - 1;
  const chosen: number[] = [];
  let best = Number.POSITIVE_INFINITY;
  let tried = 0;
  let spanning = 0;
  let reads = 0;
  const mustIdx = must.map((m) => edges.indexOf(m));

  /** 고른 간선만으로 정점 전부가 이어지는가. 읽은 간선 끝점 수도 함께 센다. */
  function connects(): boolean {
    const seen: number[] = Array.from({ length: n }, (_, i) => i);
    const root = (x: number): number => {
      let r = x;
      while (seen[r] !== r) r = seen[r] as number;
      return r;
    };
    let joined = 0;
    for (const idx of chosen) {
      const [u, v] = edges[idx] as Edge;
      reads += 2;
      const ru = root(u);
      const rv = root(v);
      if (ru === rv) return false;
      seen[ru] = rv;
      joined++;
    }
    return joined === pickCount;
  }

  function walk(from: number): void {
    if (chosen.length === pickCount) {
      if (!mustIdx.every((i) => chosen.includes(i))) return;
      tried++;
      if (connects()) {
        spanning++;
        let sum = 0;
        for (const idx of chosen) sum += (edges[idx] as Edge)[2];
        if (sum < best) best = sum;
      }
      return;
    }
    for (let i = from; i < edges.length; i++) {
      chosen.push(i);
      walk(i + 1);
      chosen.pop();
    }
  }

  if (pickCount === 0) return { best: 0, tried: 1, spanning: 1, reads: 0 };
  walk(0);
  return { best, tried, spanning, reads };
}

/**
 * 가벼운 간선부터 보는 것은 같고, **사이클 판정만 탐색으로** 한다 — 이미 고른 간선들로
 * 이웃 목록을 만들고 `u` 에서 너비 우선 탐색을 시작해 `v` 에 이르는지 본다.
 *
 * 배열 칸 접근은 이웃 목록·방문 표시·큐를 읽고 쓴 횟수다. `byDsu` 와 같은 정의라 두 값을
 * 나란히 놓을 수 있다. `visitAt` 을 주면 그 간선을 볼 때 탐색이 꺼낸 정점의 차례를 돌려준다.
 */
function byScan(
  n: number,
  edges: Edge[],
  visitAt?: Edge,
): { total: number; cells: number; visited: number[]; reached: boolean } {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const near: number[][] = Array.from({ length: n }, () => []);
  let cells = 0;
  let total = 0;
  let picked = 0;
  let visited: number[] = [];
  let reachedAt = false;

  for (const edge of sorted) {
    const [u, v, w] = edge;
    // u 에서 출발해 v 에 이르는 길이 이미 있는가.
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const queue: number[] = [u];
    const order: number[] = [];
    cells += 2;
    seen[u] = true;
    let head = 0;
    let reached = false;
    while (head < queue.length) {
      const x = queue[head] as number;
      head++;
      cells += 1;
      order.push(x);
      if (x === v) {
        reached = true;
        break;
      }
      for (const y of near[x] as number[]) {
        cells += 1;
        if (seen[y] === true) continue;
        seen[y] = true;
        queue.push(y);
        cells += 2;
      }
    }
    if (edge === visitAt) {
      visited = order;
      reachedAt = reached;
    }
    if (reached) continue;

    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    cells += 2;
    total += w;
    picked++;
    if (picked === n - 1) return { total, cells, visited, reached: reachedAt };
  }
  return {
    total: picked === n - 1 ? total : -1,
    cells,
    visited,
    reached: reachedAt,
  };
}

/**
 * 이름표 배열 판 — 정점마다 자기 덩어리의 이름표를 **그대로** 적어 두고, 두 덩어리를 합칠 때
 * `u` 쪽 덩어리의 정점을 전부 `v` 쪽 이름표로 고쳐 쓴다. 배열 칸 접근은 이름표 둘을 읽는
 * 비교와 고쳐 쓴 칸이다. `relabels` 는 합친 걸음마다 고쳐 쓴 칸 수, `labelsAfter` 는 본 간선마다의
 * 이름표 배열이다.
 */
function byLabel(
  n: number,
  edges: Edge[],
): {
  total: number;
  cells: number;
  relabels: number[];
  labelsAfter: number[][];
} {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const label: number[] = Array.from({ length: n }, (_, i) => i);
  const members: number[][] = Array.from({ length: n }, (_, i) => [i]);
  let cells = 0;
  let total = 0;
  let picked = 0;
  const relabels: number[] = [];
  const labelsAfter: number[][] = [];
  for (const [u, v, w] of sorted) {
    cells += 2;
    const lu = label[u] as number;
    const lv = label[v] as number;
    if (lu === lv) {
      labelsAfter.push([...label]);
      continue;
    }
    const moving = members[lu] as number[];
    for (const x of moving) {
      label[x] = lv;
      cells += 1;
    }
    relabels.push(moving.length);
    (members[lv] as number[]).push(...moving);
    members[lu] = [];
    labelsAfter.push([...label]);
    total += w;
    picked++;
    if (picked === n - 1) break;
  }
  return { total: picked === n - 1 ? total : -1, cells, relabels, labelsAfter };
}

/**
 * 유니온 파인드 판. `useRank` 와 `compress` 를 꺼 두면 이 가이드가 세우기 **전 단계**의 절차가
 * 되고, 둘 다 켜면 정본과 같은 절차다. 배열 칸 접근은 `parent`·`rank` 를 읽고 쓴 횟수다.
 */
function byDsu(
  n: number,
  edges: Edge[],
  opts: { useRank: boolean; compress: boolean },
): { total: number; cells: number; height: number } {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  const rank: number[] = Array.from({ length: n }, () => 0);
  let cells = 0;
  let total = 0;
  let picked = 0;

  const find = (x: number): number => {
    let root = x;
    while (true) {
      cells += 1;
      if (parent[root] === root) break;
      root = parent[root] as number;
    }
    if (opts.compress) {
      let cur = x;
      while (parent[cur] !== root) {
        cells += 2;
        const next = parent[cur] as number;
        parent[cur] = root;
        cur = next;
      }
      cells += 1;
    }
    return root;
  };

  for (const [u, v, w] of sorted) {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) continue;
    if (opts.useRank) {
      cells += 2;
      if ((rank[ru] as number) > (rank[rv] as number)) {
        parent[rv] = ru;
        cells += 1;
      } else {
        parent[ru] = rv;
        cells += 1;
        if (rank[ru] === rank[rv]) {
          rank[rv] = (rank[rv] as number) + 1;
          cells += 2;
        }
      }
    } else {
      parent[ru] = rv;
      cells += 1;
    }
    total += w;
    picked++;
    if (picked === n - 1) break;
  }

  // 남은 대표 트리의 가장 큰 높이. 「붙이는 방향」이 실제로 무엇을 막았는지 재는 값이다.
  const height = Math.max(0, ...depthsOf(parent));
  return { total: picked === n - 1 ? total : -1, cells, height };
}

/** 유니온 파인드의 정본 절차가 배열 칸을 몇 번 읽고 쓰는가 — `perf` 절과 같은 정의다. */
const refCells = (n: number, edges: Edge[]): number =>
  byDsu(n, edges, { useRank: true, compress: true }).cells;

if (
  WALK.looks.reduce((s, l) => s + l.cells, 0) !== refCells(WALK_N, WALK_EDGES)
) {
  throw new Error("기록 사본과 계수 사본이 전개 입력의 칸 접근을 다르게 센다");
}

/**
 * 붙이는 방향만 정하고 경로 압축은 하지 않는 판을 돌려, 끝난 뒤 **가장 큰 rank**와 그 대표가
 * 이끄는 정점 수를 돌려준다. 압축을 켜면 rank 는 그대로지만 트리 모양이 바뀌어 크기를 세는
 * 자리가 흐려지므로 여기서는 끈다.
 */
function rankRun(v: number, edges: Edge[]): { rank: number; size: number } {
  const parent: number[] = Array.from({ length: v }, (_, i) => i);
  const rank: number[] = Array.from({ length: v }, () => 0);
  const size: number[] = Array.from({ length: v }, () => 1);
  const root = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as number;
    return r;
  };
  for (const [a, b] of [...edges].sort((p, q) => p[2] - q[2])) {
    const ra = root(a);
    const rb = root(b);
    if (ra === rb) continue;
    if ((rank[ra] as number) > (rank[rb] as number)) {
      parent[rb] = ra;
      size[ra] = (size[ra] as number) + (size[rb] as number);
    } else {
      parent[ra] = rb;
      size[rb] = (size[rb] as number) + (size[ra] as number);
      if (rank[ra] === rank[rb]) rank[rb] = (rank[rb] as number) + 1;
    }
  }
  let top = 0;
  let at = 0;
  for (let x = 0; x < v; x++) {
    if (parent[x] === x && (rank[x] as number) >= top) {
      top = rank[x] as number;
      at = x;
    }
  }
  return { rank: top, size: size[at] as number };
}

/** 고른 간선이 몇 개에서 멈췄는가 — `-1` 이 나온 입력에서 그 수를 보이는 자리다. */
function countPicked(n: number, edges: Edge[]): number {
  const run = traced(n, edges);
  return (run.looks.at(-1) as Look | undefined)?.picked ?? 0;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { kruskalMst: (n: number, edges: Edge[]) => number };

/** 정렬 호출만 지운 판. 입력에 적힌 순서 그대로 본다. */
const NO_SORT = await loadMutant<Ref>(REF, {
  swap: [/\.sort\(\(a, b\) => a\[2\] - b\[2\]\)/, ""],
});

/** 대표가 같을 때 건너뛰는 줄을 지운 판. 사이클을 만드는 간선까지 고른다. */
const KEEP_CYCLE = await loadMutant<Ref>(REF, {
  drop: /^\s*if \(ru === rv\) continue;$/,
});

/** 마지막 줄의 삼항식을 합계로 바꾼 판. 못 이은 정점이 있어도 그냥 더한 값을 답한다. */
const NO_CHECK = await loadMutant<Ref>(REF, {
  swap: [/return picked === n - 1 \? total : -1;/, "return total;"],
});

/**
 * 변이가 걸린 판인가 — `check-proof` 가 변이를 만들되 적용하지 않고 정본을 돌려주는 중화 실행에서는
 * 변이 모듈의 함수가 정본과 **같은 답**을 낸다. 기록 사본과 변이의 답을 맞대는 자기검사는 변이가
 * 실제로 걸렸을 때만 한다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
const applied = (mod: Ref): boolean =>
  mod.kruskalMst(WALK_N, WALK_EDGES) !== kruskalMst(WALK_N, WALK_EDGES) ||
  mod.kruskalMst(PAIRS_N, PAIRS_EDGES) !== kruskalMst(PAIRS_N, PAIRS_EDGES);

/** 표에 나란히 놓는 네 입력. 이름은 본문 표기와 같다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["삼각형", TRI_N, TRI_EDGES],
  ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
];

function mutantTable(
  label: string,
  mod: Ref,
  inputs: [string, number, Edge[]][],
): string {
  return md(
    ["입력", "정본", label],
    inputs.map(([name, v, e]) => [
      name,
      comma(kruskalMst(v, e)),
      comma(mod.kruskalMst(v, e)),
    ]),
    [1, 2],
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

export const MST: Edge[] = chosenOf(WALK.looks);

function conceptCount(): string {
  const sum = MST.reduce((s, e) => s + e[2], 0);
  if (sum !== WALK.answer) throw new Error("고른 간선의 합이 답과 다르다");
  const answer = kruskalMst(WALK_N, WALK_EDGES);
  return [
    md(
      ["센 것", "전개 입력"],
      [
        ["정점", comma(WALK_N)],
        ["간선", comma(WALK_EDGES.length)],
        ["최소 신장 트리의 간선", comma(MST.length)],
        ["최소 신장 트리의 가중치 합", comma(sum)],
      ],
      [1],
    ),
    "",
    `고른 간선은 ${MST.map(([u, v, w]) => `${edgeName(u, v)} 가중치 ${w}`).join(" · ")} 이고, 전체 코드가 낸 답도 ${comma(answer)} 입니다.`,
  ].join("\n");
}

function bruteWalk(): string {
  const b = bruteForce(WALK_N, WALK_EDGES);
  const answer = kruskalMst(WALK_N, WALK_EDGES);
  return [
    md(
      ["센 것", "전개 입력"],
      [
        [`크기 ${WALK_N - 1} 인 간선 부분집합`, comma(b.tried)],
        ["그중 모든 정점을 잇는 것", comma(b.spanning)],
        ["검사하며 읽은 간선 끝점", comma(b.reads)],
        ["가장 작은 가중치 합", comma(b.best)],
      ],
      [1],
    ),
    "",
    `가장 작은 합 ${comma(b.best)}${이가(comma(b.best))} 전체 코드가 낸 답 ${comma(answer)}${과와(comma(answer))} 같습니다.`,
  ].join("\n");
}

/** 초를 사람이 읽는 단위로. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)} 초`;
  if (seconds < 60) return `${seconds.toFixed(1)} 초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)} 분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)} 시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)} 일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))} 년`;
}

/** 정점 100,000 · 간선 200,000 에서 `C(E, V−1)` 의 자릿수. 부동소수 범위를 넘어 로그로 센다. */
export function limitDigits(): number {
  let digits = 0;
  for (let k = 0; k < 99_999; k++) {
    digits += Math.log10(200_000 - k) - Math.log10(k + 1);
  }
  return Math.floor(digits) + 1;
}

function naiveScale(): string {
  const rows: string[][] = [];
  for (const [v, e] of [
    [6, 7],
    [10, 20],
    [20, 40],
    [40, 80],
  ] as [number, number][]) {
    let c = 1;
    for (let k = 0; k < v - 1; k++) c = (c * (e - k)) / (k + 1);
    rows.push([
      comma(v),
      comma(e),
      c > 1e15 ? c.toExponential(3) : comma(Math.round(c)),
      duration(c / 1e8),
    ]);
  }
  return [
    md(
      ["정점 V", "간선 E", "부분집합 수 C(E, V−1)", "초당 1 억 개를 검사할 때"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `정점 ${comma(100_000)} · 간선 ${comma(200_000)} 이면 부분집합 수를 적는 데만 ${comma(limitDigits())} 자리가 듭니다.`,
  ].join("\n");
}

function greedyWalk(): string {
  const rows = WALK.looks.map((l) => [
    `${l.k + 1}`,
    edgeName(l.u, l.v),
    comma(l.w),
    l.branch === "skip" ? "이미 이어져 있다" : "아직 안 이어졌다",
    l.branch === "skip" ? "건너뛴다" : "고른다",
    setsOf(l.parent)
      .filter((g) => g.length > 1)
      .map(setName)
      .join(" "),
  ]);
  const skipped = WALK.looks.filter((l) => l.branch === "skip");
  const [lu, lv] = WALK.unseen[0] as Edge;
  return [
    md(
      [
        "차례",
        "간선",
        "가중치",
        "두 끝점",
        "결정",
        "그 뒤 둘 이상 묶인 덩어리",
      ],
      rows,
      [0, 2],
    ),
    "",
    `간선 ${WALK.looks.length} 개를 보고 ${MST.length} 개를 골랐으며, 건너뛴 것은 ${skipped.map((l) => edgeName(l.u, l.v)).join(" · ")} 하나입니다. 고른 간선이 ${MST.length} 개가 되어 ${edgeName(lu, lv)}${을를(lv)} 보지 않았고, 합은 ${comma(WALK.answer)} 입니다.`,
  ].join("\n");
}

function scanTrace(): string {
  const skip = WALK.looks.find((l) => l.branch === "skip") as Look;
  const target = WALK.sorted[skip.k] as Edge;
  const scan = byScan(WALK_N, WALK_EDGES, target);
  const before = chosenOf(WALK.looks.filter((l) => l.t < skip.t));
  return pairs([
    ["이미 고른 간선", before.map(([u, v]) => edgeName(u, v)).join(" ")],
    [`${skip.u} 에서 출발한 탐색이 꺼낸 차례`, scan.visited.join(" → ")],
    [
      "판정",
      scan.reached
        ? `${skip.v} 에 이르렀다 — 이미 이어져 있으니 건너뛴다`
        : `${skip.v} 에 못 이르렀다`,
    ],
  ]).join("\n");
}

function cycleCheckCost(): string {
  const rows: string[][] = [];
  for (const [name, v, e] of [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["한 줄로 이은 100 정점", 100, path(100)],
    ["별 모양 100 정점", 100, star(100)],
    ["완전 그래프 40 정점", 40, complete(40)],
  ] as [string, number, Edge[]][]) {
    const scan = byScan(v, e);
    const label = byLabel(v, e);
    const dsu = byDsu(v, e, { useRank: true, compress: true });
    const want = kruskalMst(v, e);
    if (scan.total !== want || label.total !== want || dsu.total !== want) {
      throw new Error(`${name} 에서 세 판정이 다른 답을 낸다`);
    }
    rows.push([
      name,
      comma(v),
      comma(e.length),
      comma(scan.cells),
      comma(label.cells),
      comma(dsu.cells),
      comma(want),
    ]);
  }
  return md(
    [
      "입력",
      "V",
      "E",
      "탐색으로 판정",
      "이름표 배열로 판정",
      "유니온 파인드로 판정",
      "합계",
    ],
    rows,
    [1, 2, 3, 4, 5, 6],
  );
}

/** 「아이디어를 떠올리는 과정」 그림과 본문이 함께 쓰는 수. */
export function originNumbers(): {
  digits: number;
  scan100: number;
  label100: number;
  dsu100: number;
} {
  return {
    digits: limitDigits(),
    scan100: byScan(100, path(100)).cells,
    label100: byLabel(100, path(100)).cells,
    dsu100: byDsu(100, path(100), { useRank: true, compress: true }).cells,
  };
}

/* ── 유니온 파인드 개념 ── */

/** 개념 절이 멈춰 세우는 걸음 — 대표까지 두 칸을 따라가야 하는 정점이 처음 생긴 걸음. */
export const FOCUS_T: number = (() => {
  const l = WALK.looks.find((x) => depthsOf(x.parent).some((d) => d >= 2));
  if (l === undefined)
    throw new Error("두 칸을 따라가는 정점이 한 번도 안 생긴다");
  return l.t;
})();

function ufRead(): string {
  const parent = parentAfter(FOCUS_T);
  const deep = depthsOf(parent).findIndex((d) => d >= 2);
  const rows: string[][] = [];
  let cur = deep;
  while (true) {
    const p = parent[cur] as number;
    rows.push([
      `${rows.length + 1}`,
      `parent[${cur}]`,
      `${p}`,
      p === cur ? "예 — 대표다" : "아니오 — 따라간다",
    ]);
    if (p === cur) break;
    cur = p;
  }
  return [
    md(["읽은 차례", "읽은 칸", "그 칸의 값", "대표 여부"], rows, [0, 2]),
    "",
    `T${FOCUS_T}${이가(FOCUS_T)} 끝난 뒤 정점 ${deep} 에서 출발해 칸 ${rows.length} 개를 읽었고, 대표는 ${cur} 입니다.`,
  ].join("\n");
}

function ufRelation(): string {
  const parent = parentAfter(FOCUS_T);
  const roots = rootsOf(parent);
  const rows = parent.map((p, v) => {
    const walked = [v];
    let c = v;
    while (parent[c] !== c) {
      c = parent[c] as number;
      walked.push(c);
    }
    return [
      `${v}`,
      `${p}`,
      walked.join(" → "),
      `${roots[v]}`,
      roots
        .map((r, x) => (r === roots[v] ? x : -1))
        .filter((x) => x >= 0)
        .join(" · "),
    ];
  });
  const sets = setsOf(parent);
  const comps = componentsOf(
    WALK_N,
    chosenOf(WALK.looks.filter((l) => l.t <= FOCUS_T)),
  );
  const same = JSON.stringify(sets) === JSON.stringify(comps);
  return [
    md(
      ["정점", "parent", "대표까지 따라간 길", "대표", "대표가 같은 정점"],
      rows,
      [0, 1, 3],
    ),
    "",
    `대표로 가른 덩어리는 ${sets.map(setName).join(" ")} 이고, T${FOCUS_T} 까지 고른 간선만으로 이어진 정점 묶음은 ${comps.map(setName).join(" ")} 입니다. 두 묶음이 ${same ? "같습니다" : "다릅니다"}.`,
  ].join("\n");
}

function ufVsLabel(): string {
  const label = byLabel(WALK_N, WALK_EDGES);
  const chosen = WALK.looks.filter((l) => l.branch !== "skip");
  const rows = chosen.map((l, i) => [
    `T${l.t}`,
    edgeName(l.u, l.v),
    comma(label.relabels[i] as number),
    "1",
  ]);
  const focusIdx = WALK.looks.findIndex((l) => l.t === FOCUS_T);
  const labelsAtFocus = label.labelsAfter[focusIdx] as number[];
  const star1000 = byLabel(1_000, star(1_000));
  const relabelTotal = label.relabels.reduce((s, x) => s + x, 0);
  return [
    md(
      [
        "걸음",
        "고른 간선",
        "이름표 배열이 고쳐 쓴 칸",
        "유니온 파인드가 고쳐 쓴 parent 칸",
      ],
      rows,
      [2, 3],
    ),
    "",
    `T${FOCUS_T}${이가(FOCUS_T)} 끝난 뒤 이름표 배열은 ${list(labelsAtFocus)} 이고 parent 는 ${list(parentAfter(FOCUS_T))} 입니다. 전개 입력에서 이름표 배열은 칸 ${relabelTotal} 개를, 유니온 파인드는 parent 칸 ${chosen.length} 개를 고쳐 썼습니다. 별 모양 정점 ${comma(1_000)} 개에서는 이름표 배열이 칸 ${comma(star1000.relabels.reduce((s, x) => s + x, 0))} 개를 고쳐 씁니다.`,
  ].join("\n");
}

/* ── 실현 단계 ── */

function stageSort(): string {
  const rows = WALK.sorted.map(([u, v, w], i) => [
    `${i + 1}`,
    edgeName(u, v),
    comma(w),
    `${WALK_EDGES.findIndex((e) => e[0] === u && e[1] === v) + 1} 번째`,
  ]);
  return md(
    ["정렬한 차례", "간선", "가중치", "입력에 적힌 자리"],
    rows,
    [0, 2],
  );
}

function stageFind(): string {
  const rows = WALK.looks.map((l) => [
    `T${l.t}`,
    edgeName(l.u, l.v),
    l.pathU.join(" → "),
    l.pathV.join(" → "),
    `${l.ru} · ${l.rv}`,
    l.ru === l.rv ? "같다 — 건너뛴다" : "다르다 — 합친다",
    l.compressed.length === 0
      ? "-"
      : l.compressed
          .map((c) => `parent[${c.x}] ${c.from} → ${c.to}`)
          .join(" · "),
  ]);
  const longest = Math.max(
    ...WALK.looks.flatMap((l) => [l.pathU.length, l.pathV.length]),
  );
  const compressedAt = WALK.looks.filter((l) => l.compressed.length > 0);
  return [
    md(
      [
        "걸음",
        "간선",
        "u 에서 대표까지",
        "v 에서 대표까지",
        "대표 둘",
        "판정",
        "둘째 바퀴가 고쳐 쓴 칸",
      ],
      rows,
    ),
    "",
    `따라간 길은 가장 길 때 정점 ${longest} 개였고, 둘째 바퀴가 칸을 고쳐 쓴 걸음은 ${compressedAt.map((l) => `T${l.t}`).join(" · ")} 하나입니다.`,
  ].join("\n");
}

function stageUnion(): string {
  const rows = WALK.looks
    .filter((l) => l.branch !== "skip")
    .map((l) => [
      `T${l.t}`,
      edgeName(l.u, l.v),
      `${l.rankRu} · ${l.rankRv}`,
      l.branch === "eq"
        ? `같다 — ${l.child}${을를(String(l.child))} ${l.root} 밑에`
        : `다르다 — ${l.child}${을를(String(l.child))} ${l.root} 밑에`,
      l.rankUp
        ? `rank[${l.root}] ${(l.rank[l.root as number] as number) - 1} → ${l.rank[l.root as number]}`
        : "그대로",
      branchLabel(l.branch),
      comma(l.total),
    ]);
  const up = WALK.looks.filter((l) => l.rankUp).length;
  const keep = WALK.looks.filter(
    (l) => l.branch === "gt" || l.branch === "lt",
  ).length;
  return [
    md(
      [
        "걸음",
        "간선",
        "rank[ru] · rank[rv]",
        "rank 비교와 붙인 방향",
        "rank",
        "갈래",
        "그 뒤 total",
      ],
      rows,
      [6],
    ),
    "",
    `rank 가 같아 하나 올린 걸음이 ${up} 번, 달라서 그대로 둔 걸음이 ${keep} 번입니다.`,
  ].join("\n");
}

function stageStop(): string {
  const row = (run: Run, name: string): string[][] =>
    run.looks.map((l) => {
      const groups = setsOf(l.parent).length;
      return [
        name,
        `T${l.t}`,
        comma(l.picked),
        comma(groups),
        comma(l.picked + groups),
        l.stop ? "끝낸다 ⑤" : "다음 간선",
      ];
    });
  const rows = [
    ...row(WALK, "전개 입력"),
    ...row(PAIRS, "둘씩 이어진 정점 넷"),
  ];
  const pairsLast = PAIRS.looks.at(-1) as Look;
  const walkLast = WALK.looks.at(-1) as Look;
  return [
    md(
      ["입력", "걸음", "picked", "덩어리 수", "picked + 덩어리 수", "그 뒤"],
      rows,
      [2, 3, 4],
    ),
    "",
    `전개 입력은 picked 가 ${walkLast.picked}${이가(walkLast.picked)} 된 T${walkLast.t} 에서 끝나 ${comma(WALK.answer)}${을를(comma(WALK.answer))} 돌려주고, 둘씩 이어진 정점 넷은 간선을 다 보고도 picked 가 ${pairsLast.picked}${josa(pairsLast.picked, "이라서", "라서")} ${comma(PAIRS.answer)}${을를(comma(PAIRS.answer))} 돌려줍니다.`,
  ].join("\n");
}

function designVariants(): string {
  const inputs: [string, number, Edge[]][] = [
    [`별 모양 ${comma(1_000)} 정점`, 1_000, star(1_000)],
    [
      `흩뿌린 ${comma(1_000)} 정점 · ${comma(4_000)} 간선`,
      1_000,
      scattered(1_000, 4_000),
    ],
  ];
  const variants: [string, { useRank: boolean; compress: boolean }][] = [
    ["둘 다 없다", { useRank: false, compress: false }],
    ["붙이는 방향만 정한다", { useRank: true, compress: false }],
    ["경로 압축만 한다", { useRank: false, compress: true }],
    ["둘 다 한다", { useRank: true, compress: true }],
  ];
  const results = inputs.map(([, v, e]) =>
    variants.map(([, o]) => {
      const r = byDsu(v, e, o);
      if (r.total !== kruskalMst(v, e)) throw new Error("판마다 답이 다르다");
      return r;
    }),
  );
  const rows = variants.map(([name], i) => [
    name,
    ...results.flatMap((r) => {
      const x = r[i] as { cells: number; height: number };
      return [comma(x.cells), comma(x.height)];
    }),
  ]);
  const best = results.map((r, j) => {
    const min = r.reduce((a, b) => (b.cells < a.cells ? b : a));
    const low = r.reduce((a, b) => (b.height < a.height ? b : a));
    const [name] = inputs[j] as [string, number, Edge[]];
    return `${name}에서 칸 접근이 가장 적은 판은 「${(variants[r.indexOf(min)] as [string, unknown])[0]}」, 높이가 가장 낮은 판은 「${(variants[r.indexOf(low)] as [string, unknown])[0]}」`;
  });
  return [
    md(
      [
        "판",
        `${(inputs[0] as [string, number, Edge[]])[0]} 칸 접근`,
        "그 높이",
        `${(inputs[1] as [string, number, Edge[]])[0]} 칸 접근`,
        "그 높이",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `${best.join("이고, ")}입니다. 네 판 모두 답이 같습니다.`,
  ].join("\n");
}

/* ── 수행 ── */

function walkSort(): string {
  const show = (es: readonly Edge[]) =>
    es.map(([u, v, w]) => `${edgeName(u, v)}=${w}`).join("  ");
  return pairs([
    ["입력에 적힌 순서", show(WALK_EDGES)],
    ["정렬한 뒤", show(WALK.sorted)],
  ]).join("\n");
}

/** 걸음 하나를 코드 옆 짧은 결과로 — 찾기 · 판정 · 배열 둘 · 합계. */
function lookLines(l: Look): string[] {
  const find = `find(${l.u}) = ${l.ru}  (${l.pathU.join(" → ")}) · find(${l.v}) = ${l.rv}  (${l.pathV.join(" → ")})`;
  const judge =
    l.branch === "skip"
      ? "대표가 같다 → 건너뛴다  ②"
      : l.branch === "gt"
        ? `rank ${l.rankRu} > ${l.rankRv}${이가(l.rankRv)} 참 → parent[${l.child}] = ${l.root}, rank 그대로  ①③`
        : `rank ${l.rankRu} > ${l.rankRv}${이가(l.rankRv)} 거짓 → parent[${l.child}] = ${l.root}, 같아서 rank[${l.root}] = ${l.rank[l.root as number]}  ①④`;
  const rows: [string, string][] = [
    ["  찾기", find],
    ["  판정", judge],
  ];
  if (l.compressed.length > 0) {
    rows.push([
      "  둘째 바퀴",
      l.compressed.map((c) => `parent[${c.x}] ${c.from} → ${c.to}`).join(" · "),
    ]);
  }
  rows.push(
    ["  parent", list(l.parent)],
    ["  rank", list(l.rank)],
    ["  total · picked", `${l.total} · ${l.picked}`],
  );
  return [`T${l.t} — 간선 ${edgeName(l.u, l.v)} 가중치 ${l.w}`, ...pairs(rows)];
}

const walkLooks = (ts: readonly number[]): string =>
  ts.flatMap((t) => lookLines(lookAt(t))).join("\n");

function noSortTrace(): string {
  const rows: string[][] = [];
  for (const [name, v, e] of [
    ["거꾸로 적은 삼각형", TRI_N, TRI_REV],
    ["전개 입력", WALK_N, WALK_EDGES],
  ] as [string, number, Edge[]][]) {
    for (const [how, run] of [
      ["정본", traced(v, e)],
      ["정렬하지 않은 판", traced(v, e, { sort: false })],
    ] as [string, Run][]) {
      rows.push([
        name,
        how,
        run.looks
          .map(
            (l) =>
              `${edgeName(l.u, l.v)}=${l.w}${l.branch === "skip" ? " 건너뜀" : ""}`,
          )
          .join(" · "),
        comma(run.answer),
      ]);
    }
  }
  const walkNoSort = traced(WALK_N, WALK_EDGES, { sort: false });
  if (
    applied(NO_SORT) &&
    walkNoSort.answer !== NO_SORT.kruskalMst(WALK_N, WALK_EDGES)
  ) {
    throw new Error("정렬을 뺀 기록이 정렬을 뺀 변이와 다른 답을 낸다");
  }
  return [
    md(["입력", "판", "본 간선의 차례", "답"], rows, [3]),
    "",
    `정렬을 뺀 변이를 전개 입력에 실제로 실행한 답은 ${comma(NO_SORT.kruskalMst(WALK_N, WALK_EDGES))} 입니다.`,
  ].join("\n");
}

function walkTrace(): string {
  const rows: string[][] = [
    [
      "T1",
      "정렬",
      "-",
      "-",
      "-",
      list(parentAfter(1)),
      list(rankAfter(1)),
      "0 · 0",
      "-",
    ],
  ];
  for (const l of WALK.looks) {
    rows.push([
      `T${l.t}`,
      `${edgeName(l.u, l.v)}=${l.w}`,
      `${l.ru} · ${l.rv}`,
      l.ru === l.rv ? "참" : "거짓",
      l.branch === "skip" ? "-" : l.rankRu > l.rankRv ? "참" : "거짓",
      list(l.parent),
      list(l.rank),
      `${l.total} · ${l.picked}`,
      branchLabel(l.branch),
    ]);
  }
  const last = WALK.looks.at(-1) as Look;
  rows.push([
    `T${LAST_T}`,
    "반환",
    "-",
    "-",
    "-",
    list(last.parent),
    list(last.rank),
    `${last.total} · ${last.picked}`,
    "⑤",
  ]);
  const groups = [WALK_N, ...WALK.looks.map((l) => setsOf(l.parent).length)];
  const [lu, lv, lw] = WALK.unseen.at(-1) as Edge;
  return [
    md(
      [
        "걸음",
        "간선",
        "대표 둘",
        "ru === rv",
        "rank[ru] > rank[rv]",
        "parent",
        "rank",
        "total · picked",
        "갈래",
      ],
      rows,
    ),
    "",
    `덩어리 수는 ${groups.map((g, i) => `T${i + 1} ${g}`).join(" · ")} 개였습니다. 남은 간선 ${edgeName(lu, lv)}=${lw}${은는(lw)} 보지 않았습니다.`,
  ].join("\n");
}

function branchCoverage(): string {
  const count = (run: Run, b: string): number => {
    const looks = run.looks;
    switch (b) {
      case "①":
        return looks.filter((l) => l.branch !== "skip").length;
      case "②":
        return looks.filter((l) => l.branch === "skip").length;
      case "③":
        return looks.filter((l) => l.branch === "gt").length;
      case "④":
        return looks.filter((l) => l.rankUp).length;
      case "⑤":
        return looks.some((l) => l.stop) ? 1 : 0;
      default:
        return looks.some((l) => l.stop) ? 0 : 1;
    }
  };
  const names: [string, string][] = [
    ["①", "대표가 달라 합친다"],
    ["②", "대표가 같아 건너뛴다"],
    ["③", "rank 가 큰 쪽 밑에 붙이고 rank 는 그대로 둔다"],
    ["④", "rank 가 같아 붙인 뒤 남은 쪽을 하나 올린다"],
    ["⑤", "고른 간선이 n − 1 개라 끝낸다"],
    ["⑥", "간선을 다 보고도 못 채워 -1 을 돌려준다"],
  ];
  const rows = names.map(([k, what]) => [
    k,
    what,
    comma(count(WALK, k)),
    comma(count(PAIRS, k)),
  ]);
  return md(
    ["라벨", "하는 일", "전개 입력", "둘씩 이어진 정점 넷"],
    rows,
    [2, 3],
  );
}

function noCheckTrace(): string {
  const rows = PAIRS.looks.map((l) => [
    `${edgeName(l.u, l.v)}=${l.w}`,
    l.branch === "skip" ? "건너뛴다" : "고른다",
    comma(l.picked),
    comma(l.total),
    setsOf(l.parent).map(setName).join(" "),
  ]);
  const last = PAIRS.looks.at(-1) as Look;
  if (
    applied(NO_CHECK) &&
    NO_CHECK.kruskalMst(PAIRS_N, PAIRS_EDGES) !== last.total
  ) {
    throw new Error("개수를 안 보는 변이가 기록의 합계와 다른 값을 낸다");
  }
  const ref = kruskalMst(PAIRS_N, PAIRS_EDGES);
  const bad = NO_CHECK.kruskalMst(PAIRS_N, PAIRS_EDGES);
  return [
    md(["본 간선", "결정", "picked", "total", "그 뒤 덩어리"], rows, [2, 3]),
    "",
    `간선을 다 본 뒤 picked 는 ${last.picked}, n − 1 은 ${PAIRS_N - 1} 입니다. 정본은 ${comma(ref)}${을를(comma(ref))}, 개수를 안 보는 판은 ${comma(bad)}${을를(comma(bad))} 돌려줍니다.`,
  ].join("\n");
}

function walkResult(): string {
  const call = (n: number, e: Edge[]): string =>
    `kruskalMst(${n}, [${e.map((x) => `[${x.join(",")}]`).join(",")}])`;
  const rows: [string, string][] = [
    [call(WALK_N, WALK_EDGES), `-> ${kruskalMst(WALK_N, WALK_EDGES)}`],
    [call(TRI_N, TRI_EDGES), `-> ${kruskalMst(TRI_N, TRI_EDGES)}`],
    [call(SQUARE_N, SQUARE_EDGES), `-> ${kruskalMst(SQUARE_N, SQUARE_EDGES)}`],
    [call(SPLIT_N, SPLIT_EDGES), `-> ${kruskalMst(SPLIT_N, SPLIT_EDGES)}`],
    [call(1, []), `-> ${kruskalMst(1, [])}`],
  ];
  return pairs(rows).join("\n");
}

/* ── 파트 2 ── */

function mstVsPath(): string {
  const run = traced(SPLITPATH_N, SPLITPATH_EDGES);
  const tree = chosenOf(run.looks);
  // 두 정점 사이 거리 — 정점이 셋뿐이라 간선을 정점 수만큼 되풀이해 완화하면 충분하다.
  const dist = (es: readonly Edge[], from: number, to: number): number => {
    const d: number[] = Array.from(
      { length: SPLITPATH_N },
      () => Number.POSITIVE_INFINITY,
    );
    d[from] = 0;
    for (let round = 0; round < SPLITPATH_N; round++) {
      for (const [a, b, w] of es) {
        if ((d[a] as number) + w < (d[b] as number))
          d[b] = (d[a] as number) + w;
        if ((d[b] as number) + w < (d[a] as number))
          d[a] = (d[b] as number) + w;
      }
    }
    return d[to] as number;
  };
  return md(
    ["구조", "담은 간선", "가중치 합", "0 에서 2 까지의 길이"],
    [
      [
        "최소 신장 트리",
        tree.map(([u, v, w]) => `${edgeName(u, v)}=${w}`).join(" · "),
        comma(kruskalMst(SPLITPATH_N, SPLITPATH_EDGES)),
        comma(dist(tree, 0, 2)),
      ],
      [
        "그래프 전체의 최단 경로",
        SPLITPATH_EDGES.filter(
          ([a, b, w]) =>
            a === 0 && b === 2 && w === dist(SPLITPATH_EDGES, 0, 2),
        )
          .map(([u, v, w]) => `${edgeName(u, v)}=${w}`)
          .join(" · "),
        "-",
        comma(dist(SPLITPATH_EDGES, 0, 2)),
      ],
    ],
    [2, 3],
  );
}

const BENCH = benchJson as Record<string, number>;
const bench = (key: string): number => {
  const v = BENCH[key];
  if (v === undefined) throw new Error(`bench 에 ${key} 가 없다`);
  return v;
};
const KRUSKAL = "간선을 정렬하고 유니온 파인드로 판정";
const PRIM = "가장 가까운 정점을 하나씩 붙인다";

function altOps(): string {
  const flip = bench("경계 · 기본 연산이 뒤집히는 간선 수");
  const rows = [199, 5_000, flip - 1, flip, 19_900].map((e) => {
    const k = bench(`${KRUSKAL} · E=${e} 기본 연산`);
    const p = bench(`${PRIM} · E=${e} 기본 연산`);
    return [
      `E = ${comma(e)}`,
      comma(k),
      comma(p),
      k < p ? "크러스컬" : "프림",
      `${(Math.max(k, p) / Math.min(k, p)).toFixed(2)} 배`,
    ];
  });
  return [
    md(
      [
        "정점 200 · 간선 수",
        "크러스컬 기본 연산",
        "프림 기본 연산",
        "적은 쪽",
        "차이",
      ],
      rows,
      [1, 2, 4],
    ),
    "",
    `간선 수를 199 부터 100 개씩 올려 처음 뒤집힌 구간을 찾고 그 구간을 하나씩 다시 재면, 간선 ${comma(flip - 1)} 개까지는 크러스컬이 적고 ${comma(flip)} 개에서 프림이 적어집니다.`,
  ].join("\n");
}

function altCells(): string {
  const flip = bench("경계 · 저장 칸이 뒤집히는 간선 수");
  const rows = [199, 19_900].map((e) => {
    const k = bench(`${KRUSKAL} · E=${e} 저장 칸`);
    const p = bench(`${PRIM} · E=${e} 저장 칸`);
    return [`E = ${comma(e)}`, comma(k), comma(p), k < p ? "크러스컬" : "프림"];
  });
  return [
    md(
      ["정점 200 · 간선 수", "크러스컬 저장 칸", "프림 저장 칸", "적은 쪽"],
      rows,
      [1, 2],
    ),
    "",
    `크러스컬의 저장 칸 3E + 2V 가 프림의 V² + 2V 를 처음 넘는 간선 수는 ${comma(flip)} 개입니다.`,
  ].join("\n");
}

function rankSize(): string {
  const rows: string[][] = [];
  for (const v of [2, 4, 8, 16, 1_024, 65_536]) {
    const got = rankRun(v, tournament(v));
    rows.push([
      "둘씩 짝지어 올린다",
      comma(v),
      comma(got.rank),
      comma(got.size),
      comma(2 ** got.rank),
      String(Math.floor(Math.log2(v))),
    ]);
  }
  for (const v of [1_024, 65_536]) {
    const got = rankRun(v, star(v));
    rows.push([
      "별 모양이다",
      comma(v),
      comma(got.rank),
      comma(got.size),
      comma(2 ** got.rank),
      String(Math.floor(Math.log2(v))),
    ]);
  }
  return md(
    [
      "입력",
      "정점 수 V",
      "가장 큰 rank r",
      "그 대표가 이끄는 정점 수",
      "하한 2^r",
      "상한 ⌊log₂ V⌋",
    ],
    rows,
    [1, 2, 3, 4, 5],
  );
}

function rankBoundScale(): string {
  const rows: string[][] = [];
  for (const [v, e] of [
    [6, 7],
    [1_000, 2_000],
    [100_000, 200_000],
  ] as [number, number][]) {
    const r = Math.floor(Math.log2(v));
    rows.push([
      comma(v),
      comma(r),
      comma(r + 1),
      comma(e),
      comma(e * Math.ceil(Math.log2(e))),
      comma(2 * e * (r + 1)),
    ]);
  }
  return md(
    [
      "정점 V",
      "rank 상한 ⌊log₂ V⌋",
      "찾기 한 번이 읽는 칸의 상한",
      "간선 E",
      "정렬 비교 E⌈log₂ E⌉",
      "찾기 전체의 상한 2E(r+1)",
    ],
    rows,
    [0, 1, 2, 3, 4, 5],
  );
}

/** 불변식 — 걸음마다 F 를 품은 최소 신장 트리가 있는지를 부분집합 전수 검사로 다시 잰다. */
function invariantWatch(): string {
  const best = kruskalMst(WALK_N, WALK_EDGES);
  const rows: string[][] = [];
  for (const l of WALK.looks) {
    const f = chosenOf(WALK.looks.filter((x) => x.t <= l.t));
    const must = f.map(
      (e) =>
        WALK_EDGES.find(
          (x) => x[0] === e[0] && x[1] === e[1] && x[2] === e[2],
        ) as Edge,
    );
    const b = bruteForce(WALK_N, WALK_EDGES, must);
    const sets = setsOf(l.parent);
    const comps = componentsOf(WALK_N, f);
    rows.push([
      `T${l.t}`,
      f.map(([u, v]) => edgeName(u, v)).join(" "),
      comma(b.best),
      b.best === best ? "있다" : "없다",
      sets.map(setName).join(" "),
      JSON.stringify(sets) === JSON.stringify(comps) ? "같다" : "다르다",
    ]);
  }
  return [
    md(
      [
        "걸음",
        "고른 간선 F",
        "F 를 품은 신장 트리의 최소 합",
        "F 를 품은 최소 신장 트리",
        "parent 로 가른 덩어리",
        "F 의 연결 성분과 비교",
      ],
      rows,
      [2],
    ),
    "",
    `최소 신장 트리의 합은 ${comma(best)}${josa(comma(best), "이고", "고")} 셋째 열은 걸음마다 F 를 모두 담는 크기 ${WALK_N - 1} 간선 부분집합을 전부 검사해 낸 값입니다.`,
  ].join("\n");
}

/** 불변식 논증이 쓰는 걸음 — 서로 다른 두 덩어리를 마지막으로 잇는 걸음. */
export const CUT_T = LAST_T - 1;

/** `CUT_T` 에서 두 쪽으로 가른 정점과 두 쪽을 잇는 간선. */
export function cutAt(): {
  look: Look;
  side: number[];
  other: number[];
  crossing: Edge[];
} {
  const look = lookAt(CUT_T);
  const side = setsOf(parentAfter(CUT_T - 1)).find((g) =>
    g.includes(look.u),
  ) as number[];
  const other = Array.from({ length: WALK_N }, (_, i) => i).filter(
    (x) => !side.includes(x),
  );
  const crossing = WALK.sorted.filter(
    (e) => side.includes(e[0]) !== side.includes(e[1]),
  );
  return { look, side, other, crossing };
}

function invariantCut(): string {
  const { look, side, other, crossing } = cutAt();
  const seenCross = WALK.sorted
    .slice(0, look.k)
    .filter((e) => side.includes(e[0]) !== side.includes(e[1]));
  const lightest = crossing[0] as Edge;
  return [
    md(
      [
        "걸음",
        "한쪽",
        "다른 쪽",
        "두 쪽을 잇는 간선",
        "이미 본 간선 중 두 쪽을 잇는 것",
      ],
      [
        [
          `T${look.t}`,
          setName(side),
          setName(other),
          crossing.map(([u, v, w]) => `${edgeName(u, v)}=${w}`).join(" · "),
          seenCross.length === 0 ? "없다" : `${seenCross.length} 개`,
        ],
      ],
    ),
    "",
    `두 쪽을 잇는 간선 중 가장 가벼운 것은 ${edgeName(lightest[0], lightest[1])} 가중치 ${lightest[2]}${josa(lightest[2], "이고", "고")} T${look.t}${이가(look.t)} 보는 간선도 ${edgeName(look.u, look.v)} 입니다.`,
  ].join("\n");
}

function invariantSwap(): string {
  const { look, crossing } = cutAt();
  const other = crossing.find(
    (e) => !(e[0] === look.u && e[1] === look.v),
  ) as Edge;
  const alt = [
    ...MST.filter((e) => !(e[0] === look.u && e[1] === look.v)),
    other,
  ];
  const isSpanning = (es: Edge[]) => componentsOf(WALK_N, es).length === 1;
  const sum = (es: Edge[]) => es.reduce((s, e) => s + e[2], 0);
  return [
    md(
      ["트리", "간선", "가중치 합", "신장 트리 여부"],
      [
        [
          `${edgeName(look.u, look.v)} 대신 ${edgeName(other[0], other[1])}${을를(other[1])} 가진 트리`,
          alt.map(([u, v]) => edgeName(u, v)).join(" "),
          comma(sum(alt)),
          isSpanning(alt) ? "예" : "아니오",
        ],
        [
          `${edgeName(other[0], other[1])}${을를(other[1])} 빼고 ${edgeName(look.u, look.v)}${을를(look.v)} 넣은 트리`,
          MST.map(([u, v]) => edgeName(u, v)).join(" "),
          comma(sum(MST)),
          isSpanning(MST) ? "예" : "아니오",
        ],
      ],
      [2],
    ),
    "",
    `바꿔 넣으면 합이 ${sum(alt) - sum(MST)} 줄어듭니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cases: [string, number, Edge[]][] = [
    ["정점 하나 · 간선 없음", 1, []],
    ["정점 넷 · 간선 없음", 4, []],
    ["정점 하나 · 자기 자신을 잇는 간선", 1, [[0, 0, 5]]],
    [
      "정점 둘 · 평행 간선 100 과 1",
      2,
      [
        [0, 1, 100],
        [0, 1, 1],
      ],
    ],
    [
      "가중치 0 이 섞인 정점 셋",
      3,
      [
        [0, 1, 0],
        [1, 2, 5],
      ],
    ],
    ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ];
  const rows = cases.map(([name, n, e]) => {
    const run = traced(n, e);
    const skipped = run.looks.filter((l) => l.branch === "skip").length;
    return [
      name,
      comma(run.looks.length),
      comma(skipped),
      comma(run.looks.at(-1)?.picked ?? 0),
      comma(n - 1),
      comma(kruskalMst(n, e)),
    ];
  });
  return md(
    ["입력", "본 간선", "건너뛴 간선", "picked", "n − 1", "반환값"],
    rows,
    [1, 2, 3, 4, 5],
  );
}

function keepCycleTrace(): string {
  const run = traced(WALK_N, WALK_EDGES, { keepCycle: true });
  const bad = KEEP_CYCLE.kruskalMst(WALK_N, WALK_EDGES);
  if (applied(KEEP_CYCLE) && run.answer !== bad) {
    throw new Error("건너뛰기를 지운 기록이 변이와 다른 답을 낸다");
  }
  const rows = run.looks.map((l) => [
    `${edgeName(l.u, l.v)}=${l.w}`,
    `${l.ru} · ${l.rv}`,
    l.branch === "cycle" ? "대표가 같은데 고른다" : "고른다",
    comma(l.picked),
    comma(l.total),
  ]);
  const comps = componentsOf(WALK_N, chosenOf(run.looks));
  return [
    md(["본 간선", "대표 둘", "결정", "picked", "total"], rows, [3, 4]),
    "",
    `고른 간선 ${run.looks.length} 개가 잇는 정점 묶음은 ${comps.map(setName).join(" ")} 이라 모든 정점이 이어지지 않았는데, 이 판은 ${comma(bad)}${을를(comma(bad))} 돌려줍니다.`,
  ].join("\n");
}

function perfCount(): string {
  let acc = 0;
  const rows = WALK.looks.map((l) => {
    acc += l.cells;
    return [
      `T${l.t}`,
      `${edgeName(l.u, l.v)}=${l.w}`,
      "2",
      l.branch === "skip" ? "0" : "1",
      comma(l.cells),
      comma(acc),
    ];
  });
  const finds = WALK.looks.length * 2;
  const unions = WALK.looks.filter((l) => l.branch !== "skip").length;
  return [
    md(
      [
        "걸음",
        "본 간선",
        "대표 찾기",
        "붙이기",
        "이 걸음의 칸 접근",
        "칸 접근 누적",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `정렬한 간선 ${WALK_EDGES.length} 개 중 ${WALK.looks.length} 개를 보며 대표 찾기 ${finds} 번, 붙이기 ${unions} 번을 했고 parent · rank 칸 접근은 모두 ${acc} 번입니다.`,
  ].join("\n");
}

function shapeValues(): string {
  const v = 20_000;
  const rows: string[][] = [];
  for (const [name, edges] of [
    ["한 줄로 이었다", path(v)],
    ["별 모양이다", star(v)],
    ["한 줄에 같은 간선을 한 벌 더", [...path(v), ...path(v)]],
    ["한 줄에 가장 무거운 간선을 한 벌 더", [...path(v), ...heavy(v)]],
    ["앞의 절반만 잇는다", path(v / 2)],
  ] as [string, Edge[]][]) {
    const answer = kruskalMst(v, edges);
    rows.push([
      name,
      comma(v),
      comma(edges.length),
      comma(refCells(v, edges)),
      comma(countPicked(v, edges)),
      answer === -1 ? "-1" : comma(answer),
    ]);
  }
  return md(
    ["입력 모양", "V", "E", "parent · rank 칸 접근", "고른 간선", "반환값"],
    rows,
    [1, 2, 3, 4, 5],
  );
}

function selfcheckRankTie(): string {
  const l = lookAt(CUT_T);
  const loser = l.child as number;
  const winner = l.root as number;
  const what = traced(WALK_N, WALK_EDGES, {
    rankOverride: { t: CUT_T, vertex: loser, value: l.rankRu },
  });
  const w = what.looks.find((x) => x.t === CUT_T) as Look;
  return md(
    [
      "경우",
      `rank[${winner}] · rank[${loser}]`,
      "붙인 방향",
      `T${CUT_T} 뒤 parent`,
      `T${CUT_T} 뒤 rank`,
      "반환값",
    ],
    [
      [
        "실제 실행",
        `${l.rankRu} · ${l.rankRv}`,
        `${l.child}${을를(String(l.child))} ${l.root} 밑에`,
        list(l.parent),
        list(l.rank),
        comma(WALK.answer),
      ],
      [
        `rank[${loser}]${이가(loser)} ${l.rankRu}${josa(l.rankRu, "이었다면", "였다면")}`,
        `${w.rankRu} · ${w.rankRv}`,
        `${w.child}${을를(String(w.child))} ${w.root} 밑에`,
        list(w.parent),
        list(w.rank),
        comma(what.answer),
      ],
    ],
    [5],
  );
}

export const PROOFS: Record<string, () => string> = {
  conceptCount,
  bruteWalk,
  naiveScale,
  greedyWalk,
  scanTrace,
  cycleCheckCost,
  ufRead,
  ufRelation,
  ufVsLabel,
  stageSort,
  stageFind,
  stageUnion,
  stageStop,
  designVariants,
  walkSort,
  mutantNoSort: () => mutantTable("정렬하지 않은 판", NO_SORT, FOUR),
  noSortTrace,
  walkT2T3: () => walkLooks([2, 3]),
  walkT4T5T7: () => walkLooks([4, 5, 7]),
  walkTrace,
  branchCoverage,
  mutantNoCheck: () =>
    mutantTable("개수를 안 보는 판", NO_CHECK, [
      ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
      ["정점 넷 · 간선 없음", 4, []],
      ["둘씩 이어진 정점 넷", PAIRS_N, PAIRS_EDGES],
      ["전개 입력", WALK_N, WALK_EDGES],
    ]),
  noCheckTrace,
  walkResult,
  mstVsPath,
  altOps,
  altCells,
  rankSize,
  rankBoundScale,
  invariantWatch,
  invariantCut,
  invariantSwap,
  invariantEdges,
  mutantKeepCycle: () => mutantTable("건너뛰지 않는 판", KEEP_CYCLE, FOUR),
  keepCycleTrace,
  perfCount,
  shapeValues,
  selfcheckRankTie,
};
