/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.md
 *
 * ## 비용을 세는 기준 — 원고 전체에서 하나
 *
 * 비용은 **기본 연산**으로 센다. 간선 하나를 읽고 새 값을 지금 값과 비교한 한 번(간선 검사)과, 담는
 * 자리(큐 · 덱 · 우선순위 큐)에서 항목 하나를 넣거나 꺼내거나 옮기거나 키를 비교한 한 번을 각각 하나로
 * 센다. 메모리는 **추가 칸**(거리 배열의 칸 + 담는 자리가 가장 길었을 때의 칸)으로 센다. 경쟁 설계의
 * 계수(`.alt.ts` · `.bench.json`)가 같은 기준이라, 「아이디어를 떠올리는 과정」의 후보 비교는 그 파일의
 * 이진 힙 사본(`힙다익스트라`)을 그대로 부르고, 덱 사본(`덱`)과 이 파일의 `counted` 가 같은 수를 내는지
 * 맞댄다.
 *
 * ## 사본
 *
 * 정본은 몇 번 셌는지를 내보내지 않으므로 세는 자리만 덧붙인 사본이 여럿 있다. **답이 맞는지는 사본이
 * 아니라 정본이 진다** — 사본은 부를 때마다 자기 답을 정본과 맞대고(`checked`), 어긋나면 던진다.
 * 걸음 기록(`record`)은 전개 입력처럼 작은 입력에만 쓴다 — 걸음마다 거리 배열과 덱을 베끼므로 큰 입력에
 * 걸면 메모리가 모자란다. 큰 입력은 값만 세는 `counted` 로 잰다.
 *
 * 걸음 기록은 그림 사이드카(`-guide.fig.tsx`)가 걸음 재생 패널과 정적 그림을 만드는 데도 쓴다 — 본문의
 * 표와 그림이 한 실행에서 나온다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 같은
 * 객체인가로 값에서 알아낸다(`중화됨`).
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  덱 as altDeque,
  힙다익스트라 as altHeap,
  grid,
  lateShortcut,
} from "./zeroOneBfs-guide.alt.ts";
import benchJson from "./zeroOneBfs-guide.bench.json";
import { type Edge, zeroOneBfs } from "./zeroOneBfs-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여섯 · 정점 5 는 들어오는 간선이 없다.
 *
 * 네 갈래를 한 입력에서 전부 실행한다 — 가중치 1 간선으로 뒤에 넣기(0→1 · 2→3) · 가중치 0 간선으로 앞에
 * 넣기(0→2 · 2→1 · 3→4) · 새 값이 작지 않아 그대로 두기(1→3 을 두 번) · 도달 못 한 정점을 -1 로 적기
 * (정점 5). 정점 1 이 덱에 두 번 들어가 같은 정점을 두 번 꺼내는 자리도 나온다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 2, 0],
  [2, 1, 0],
  [2, 3, 1],
  [1, 3, 1],
  [3, 4, 0],
];
export const WALK_SRC = 0;

/** 두 번 그래프 — 가중치 1 간선으로 `a₁ … a_k` 를 먼저 1 로 적고, 가중치 0 간선으로 들른 `b` 가 전부 0 으로 고친다. */
export function twiceGraph(k: number): { n: number; edges: Edge[] } {
  const b = k + 1;
  const c = k + 2;
  const edges: Edge[] = [];
  for (let i = 1; i <= k; i++) edges.push([0, i, 1]);
  edges.push([0, b, 0]);
  for (let i = 1; i <= k; i++) edges.push([b, i, 0]);
  for (let i = 1; i <= k; i++) edges.push([i, c, 1]);
  return { n: k + 3, edges };
}

/** 두 번 그래프에 가지를 단 것 — `aᵢ` 마다 나가는 간선을 `d` 개 둔다. 간선 검사가 `2E` 에 가장 가까워진다. */
export function twiceFan(k: number, d: number): { n: number; edges: Edge[] } {
  const b = k + 1;
  const edges: Edge[] = [];
  for (let i = 1; i <= k; i++) edges.push([0, i, 1]);
  edges.push([0, b, 0]);
  for (let i = 1; i <= k; i++) edges.push([b, i, 0]);
  for (let i = 1; i <= k; i++) {
    for (let j = 1; j <= d; j++) edges.push([i, k + 1 + j, 1]);
  }
  return { n: k + d + 2, edges };
}

/** 가중치 1 사슬. 최대 거리가 가장 커지는 모양. */
function chain(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, 1]);
  return { n: v, edges };
}

/** 별 — 시작 정점에서 나머지 전부로 가중치 1 간선. */
function star(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i, 1]);
  return { n: v, edges };
}

/** 0 과 1 이 번갈아 나오는 사슬. 거리 층이 두 정점마다 하나씩 늘어난다. */
function zigzag(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, i % 2]);
  return { n: v, edges };
}

/**
 * 다이아몬드 사슬 — 다이아몬드(`a→b` · `a→c` · `b→d` · `c→d`) `k` 개를 한 줄로 잇는다. 위 갈래의 가중치가
 * 0, 아래 갈래의 가중치가 1 이다. 정점 `3k + 1` 개, 간선 `4k` 개이고 끝 정점까지의 경로가 `2^k` 개다.
 */
function diamonds(k: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    const a = 3 * i;
    edges.push(
      [a, a + 1, 0],
      [a, a + 2, 1],
      [a + 1, a + 3, 0],
      [a + 2, a + 3, 1],
    );
  }
  return { n: 3 * k + 1, edges };
}

/* ────────────────────────── 적는 법 ────────────────────────── */

/** `[0, 0, 0, 1, 1, -1]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `14,999,850,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

const INF = Number.POSITIVE_INFINITY;

/** 거리 하나 — 아직 경로를 못 찾은 칸은 `∞` 로 적는다. */
export const num = (d: number): string => (d === INF ? "∞" : String(d));

/** 반복 중의 거리 배열 — `∞` 를 살려 적는다. */
export const showDist = (xs: readonly number[]): string =>
  `[${xs.map(num).join(", ")}]`;

/** 덱 항목 하나 — 정점과 **넣을 때 적은 거리**. */
export interface Item {
  readonly v: number;
  readonly key: number;
}

/** 덱 항목 하나를 적는다 — `정점:넣을 때 거리`. */
export const item = (x: Item): string => `${x.v}:${x.key}`;

/** 덱 전체 — 앞에서 뒤로. */
export const showDeque = (xs: readonly Item[]): string =>
  xs.length === 0 ? "비었다" : xs.map(item).join(" ");

/** 마크다운 표. `right` 는 오른쪽 정렬할 열. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 한글·가나·한자 구간을 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록 — 열마다 폭을 값에서 재서 맞춘다. */
function columns(rows: string[][], indent = ""): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      `${indent}${r.map((cell, c) => pad(cell, widths[c] ?? 0)).join("   ")}`.trimEnd(),
    )
    .join("\n");
}

/** 펜스 블록의 안쪽 — 펜스 줄은 원고가 적고, 대조는 그 안쪽만 한다. 언어 태그는 원고 쪽 표기를 적어 둔 것이다. */
const fence = (_lang: "ts" | "text", body: string): string => body;

/** 걸음 이름을 이어 적는다 — `T6 · T7`. */
const tList = (ts: readonly string[]): string =>
  ts.length === 0 ? "없음" : ts.join(" · ");

const sameArr = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/* ────────────────────── 값만 세는 사본 ────────────────────── */

const answer = (dist: readonly number[]): number[] =>
  dist.map((d) => (d === INF ? -1 : d));

/** 이웃 목록 — 원소가 `[이웃, 가중치, 간선 번호]` 다. */
function adjacency(n: number, edges: Edge[]): [number, number, number][][] {
  const adj: [number, number, number][][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v, w], i) => {
    (adj[u] as [number, number, number][]).push([v, w, i]);
  });
  return adj;
}

/** 사본의 답을 정본과 맞댄다. 가중치가 0 · 1 밖인 입력은 이진 힙 사본과 맞댄다. */
function checked(n: number, edges: Edge[], src: number, got: number[]): void {
  const zeroOne = edges.every(([, , w]) => w === 0 || w === 1);
  const want = zeroOne
    ? zeroOneBfs(n, edges, src)
    : altHeap(n, edges, src).dist;
  if (!sameArr(got, want)) {
    throw new Error(
      `사본이 정본과 다른 답을 냈다 — ${show(got)} vs ${show(want)}`,
    );
  }
}

/** 넣는 자리 규칙. `deque` 가 정본과 같은 규칙이다. */
export type Rule = "deque" | "backOnly" | "frontOnly";

export interface Counts {
  readonly dist: number[];
  readonly scans: number;
  readonly pushes: number;
  readonly pops: number;
  readonly moves: number;
  /** 기본 연산 — 간선 검사 + 넣기 + 꺼내기 + 옮기기. */
  readonly ops: number;
  readonly peak: number;
  readonly per: number[];
}

/**
 * 정본의 절차에 세는 자리만 덧붙인 사본 — 덱은 정본의 `ZeroOneDeque` 처럼 배열 둘로 만든다. 넣는 자리만
 * 규칙으로 갈아 끼운다. 걸음마다 무엇을 베끼지 않으므로 큰 입력에도 건다.
 */
export function counted(
  n: number,
  edges: Edge[],
  src: number,
  rule: Rule = "deque",
): Counts {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let front: number[] = [];
  let back: number[] = [src];
  const per = Array.from({ length: n }, () => 0);
  per[src] = 1;
  let pushes = 1;
  let pops = 0;
  let moves = 0;
  let scans = 0;
  let peak = 1;
  while (front.length + back.length > 0) {
    if (front.length === 0) {
      moves += back.length;
      front = back.reverse();
      back = [];
    }
    const u = front.pop() as number;
    pops++;
    for (const [v, w] of adj[u] as [number, number, number][]) {
      scans++;
      const nd = (dist[u] as number) + w;
      if (nd >= (dist[v] as number)) continue;
      dist[v] = nd;
      pushes++;
      per[v] = (per[v] as number) + 1;
      if (rule === "frontOnly" || (rule === "deque" && w === 0)) {
        front.push(v);
      } else back.push(v);
      peak = Math.max(peak, front.length + back.length);
    }
  }
  const out = answer(dist);
  checked(n, edges, src, out);
  return {
    dist: out,
    scans,
    pushes,
    pops,
    moves,
    ops: scans + pushes + pops + moves,
    peak,
    per,
  };
}

// 경쟁 설계의 덱 사본과 이 파일의 사본이 같은 기준으로 세는지 — 전개 입력과 격자 · 늦은 지름길에서 맞댄다.
for (const g of [{ n: WALK_N, edges: WALK_EDGES }, grid(8), lateShortcut(64)]) {
  const a = counted(g.n, g.edges, 0);
  const b = altDeque(g.n, g.edges, 0);
  if (a.ops !== b.ops || a.pushes !== b.pushes) {
    throw new Error(
      `두 덱 사본이 다르게 센다 — ${a.ops}/${a.pushes} vs ${b.ops}/${b.pushes}`,
    );
  }
}

/** 가장 단순한 방법의 읽기 하나. */
interface Sweep {
  readonly level: number;
  /** `zero` 는 가중치 0 간선으로 같은 층을 채우는 읽기, `one` 은 가중치 1 간선으로 다음 층을 여는 읽기. */
  readonly kind: "zero" | "one";
  readonly writes: [number, number][];
}

/** 가장 단순한 방법 — 거리 층 `level` 을 0 부터 하나씩 만들며 간선 목록을 되풀이해 읽는다. */
function levelSweep(n: number, edges: Edge[], src: number, trace = false) {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let scans = 0;
  let level = 0;
  let sweeps = 0;
  const log: Sweep[] = [];
  for (;;) {
    for (;;) {
      sweeps++;
      const writes: [number, number][] = [];
      for (const [u, v, w] of edges) {
        scans++;
        if (w === 0 && dist[u] === level && (dist[v] as number) > level) {
          dist[v] = level;
          writes.push([v, level]);
        }
      }
      if (trace) log.push({ level, kind: "zero", writes });
      if (writes.length === 0) break;
    }
    sweeps++;
    const writes: [number, number][] = [];
    for (const [u, v, w] of edges) {
      scans++;
      if (w === 1 && dist[u] === level && (dist[v] as number) > level + 1) {
        dist[v] = level + 1;
        writes.push([v, level + 1]);
      }
    }
    if (trace) log.push({ level, kind: "one", writes });
    if (writes.length === 0) break;
    level++;
  }
  const out = answer(dist);
  checked(n, edges, src, out);
  return { dist: out, scans, sweeps, levels: level + 1, log };
}

/* ────────────────────────── 걸음 기록 ────────────────────────── */

export interface EdgeRead {
  readonly u: number;
  readonly v: number;
  readonly w: number;
  /** 간선 목록에서 몇 번째 간선인가. */
  readonly index: number;
  /** 읽을 때의 `dist[u]`. */
  readonly du: number;
  readonly before: number;
  readonly nd: number;
  readonly improved: boolean;
  readonly side: "front" | "back" | null;
}

/** 걸음 하나 — 간선 하나를 읽는 것이 한 걸음이고, 꺼낸 정점에 나가는 간선이 없으면 꺼낸 것만으로 한 걸음이다. */
export interface Step {
  readonly t: string;
  readonly kind: "start" | "edge" | "none" | "end";
  /** 이 걸음이 속한 꺼냄의 항목. */
  readonly popped: Item | null;
  /** 몇 번째 꺼냄인가(1 부터). */
  readonly popNo: number;
  /** 이 걸음이 꺼냄의 첫 걸음인가 — 덱에서 항목이 빠진 걸음. */
  readonly firstOfPop: boolean;
  readonly read: EdgeRead | null;
  /** 걸음이 끝난 뒤의 거리 배열(`∞` 그대로, 마지막 걸음만 `-1` 로 바꾼 값). */
  readonly dist: number[];
  /** 걸음이 끝난 뒤의 덱 — 앞에서 뒤로. */
  readonly dq: Item[];
  /** 이번 걸음에 넣은 항목이 덱의 몇 번째 칸인가. */
  readonly pushedAt: number | null;
  /** 정점마다 지금 거리를 낸 간선의 번호. 없으면 -1. */
  readonly pred: number[];
  /** 이 걸음까지의 간선 검사. */
  readonly scans: number;
  /** 정점마다 덱에 들어간 횟수(이 걸음까지). */
  readonly pushes: number[];
}

/**
 * 정본과 같은 절차를 걸음마다 기록한다. 덱은 앞에서 뒤로 놓인 논리적 차례 하나로 들고 — 정본의
 * `ZeroOneDeque` 가 배열 둘로 만드는 차례와 같다 — 항목마다 넣을 때 적은 거리를 붙인다. `override` 는
 * 넣는 자리를 바꿀 간선 번호(스스로 점검하기의 물음이 쓴다). 바꾸지 않았으면 답을 정본과 맞댄다.
 */
export function record(
  n: number,
  edges: Edge[],
  src: number,
  override: { edgeIndex: number; side: "front" | "back" } | null = null,
): Step[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => INF);
  const pred = Array.from({ length: n }, () => -1);
  const pushes = Array.from({ length: n }, () => 0);
  dist[src] = 0;
  pushes[src] = 1;
  const dq: Item[] = [{ v: src, key: 0 }];
  let scans = 0;
  const steps: Step[] = [
    {
      t: "T1",
      kind: "start",
      popped: null,
      popNo: 0,
      firstOfPop: false,
      read: null,
      dist: [...dist],
      dq: [...dq],
      pushedAt: 0,
      pred: [...pred],
      scans,
      pushes: [...pushes],
    },
  ];
  let popNo = 0;
  while (dq.length > 0) {
    const popped = dq.shift() as Item;
    popNo++;
    const list = adj[popped.v] as [number, number, number][];
    if (list.length === 0) {
      steps.push({
        t: `T${steps.length + 1}`,
        kind: "none",
        popped,
        popNo,
        firstOfPop: true,
        read: null,
        dist: [...dist],
        dq: [...dq],
        pushedAt: null,
        pred: [...pred],
        scans,
        pushes: [...pushes],
      });
      continue;
    }
    list.forEach(([v, w, index], k) => {
      scans++;
      const u = popped.v;
      const du = dist[u] as number;
      const before = dist[v] as number;
      const nd = du + w;
      let side: "front" | "back" | null = null;
      let pushedAt: number | null = null;
      if (nd < before) {
        dist[v] = nd;
        pred[v] = index;
        pushes[v] = (pushes[v] as number) + 1;
        if (override?.edgeIndex === index) side = override.side;
        else side = w === 0 ? "front" : "back";
        if (side === "front") {
          dq.unshift({ v, key: nd });
          pushedAt = 0;
        } else {
          dq.push({ v, key: nd });
          pushedAt = dq.length - 1;
        }
      }
      steps.push({
        t: `T${steps.length + 1}`,
        kind: "edge",
        popped,
        popNo,
        firstOfPop: k === 0,
        read: { u, v, w, index, du, before, nd, improved: nd < before, side },
        dist: [...dist],
        dq: [...dq],
        pushedAt,
        pred: [...pred],
        scans,
        pushes: [...pushes],
      });
    });
  }
  const out = answer(dist);
  steps.push({
    t: `T${steps.length + 1}`,
    kind: "end",
    popped: null,
    popNo,
    firstOfPop: false,
    read: null,
    dist: out,
    dq: [],
    pushedAt: null,
    pred: [...pred],
    scans,
    pushes: [...pushes],
  });
  if (override === null) checked(n, edges, src, out);
  return steps;
}

/** 전개 입력의 걸음 전부. */
export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC);

/** 뒤처진 항목인가 — 넣을 때 적은 거리가 그 걸음이 끝난 뒤 적힌 거리보다 크다. */
export const isStale = (s: Step, x: Item): boolean =>
  x.key > (s.dist[x.v] as number);

/** 걸음 바로 앞의 걸음. */
export const prevOf = (steps: readonly Step[], s: Step): Step =>
  steps[steps.indexOf(s) - 1] as Step;

/** 꺼냄마다 첫 걸음 — 꺼낸 항목의 차례. */
export const POPS: Step[] = WALK.filter((s) => s.firstOfPop);

/* ────────────────────────── 덱 사본 ────────────────────────── */

/**
 * 정본의 `ZeroOneDeque` 와 같은 규칙의 사본 — 정본은 그 클래스를 내보내지 않는다. 옮긴 원소 수를 함께
 * 세고, 논리적 차례를 배열 하나로 따로 들고 가며 꺼낸 값이 그 차례와 같은지 맞댄다.
 */
class DequeCopy {
  front: number[] = [];
  back: number[] = [];
  moved = 0;
  private logical: number[] = [];

  pushFront(x: number): void {
    this.front.push(x);
    this.logical.unshift(x);
  }

  pushBack(x: number): void {
    this.back.push(x);
    this.logical.push(x);
  }

  popFront(): number | undefined {
    if (this.front.length === 0) {
      this.moved += this.back.length;
      this.front = this.back.reverse();
      this.back = [];
    }
    const got = this.front.pop();
    const want = this.logical.shift();
    if (got !== want) {
      throw new Error(`덱 사본이 ${want} 대신 ${got} 을 꺼냈다`);
    }
    return got;
  }

  order(): number[] {
    return [...this.logical];
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = {
  zeroOneBfs(n: number, edges: Edge[], source: number): number[];
};
const REF = new URL("./zeroOneBfs-guide.ref.ts", import.meta.url).pathname;

/** `deque.pushFront(v);` **한 줄만** 지운 사본. 불변식을 지키던 줄이 그것이다. */
const noFront = await loadMutant<Impl>(REF, { drop: /deque\.pushFront\(v\)/ });

/** 시작값을 `Infinity` 대신 `-1` 로 둔 사본. 한 줄의 값 하나만 바뀐다. */
const initMinusOne = await loadMutant<Impl>(REF, {
  swap: [/\(\) => Number\.POSITIVE_INFINITY/, "() => -1"],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이를 적용하지 않은 것이다. */
const 중화됨 = noFront.zeroOneBfs === zeroOneBfs;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  {
    label: "0 사슬 0→1→2 (가중치 전부 0)",
    n: 3,
    edges: [
      [0, 1, 0],
      [1, 2, 0],
    ],
  },
  {
    label: "1 사슬 0→1→2→3 (가중치 전부 1)",
    n: 4,
    edges: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },
];

if (!중화됨) {
  for (const [name, mod] of [
    ["pushFront 줄 삭제", noFront],
    ["시작값 -1", initMinusOne],
  ] as [string, Impl][]) {
    const changed = MUTANT_CASES.some(
      (c) =>
        show(zeroOneBfs(c.n, c.edges, 0)) !==
        show(mod.zeroOneBfs(c.n, c.edges, 0)),
    );
    if (!changed) {
      throw new Error(`${name} 변이가 어느 입력에서도 결과를 안 바꿨다`);
    }
  }
}

/* ─────────────────── 난수 그래프 — 전제가 깨지는 자리 ─────────────────── */

/** 결정론적 난수 — 선형 합동. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

/** 정점 `n` 개 · 간선 `3n` 개 · 양 끝과 값을 고르게 고른다. 값은 `0` 부터 `top` 까지. */
function randomGraph(seed: number, n: number, top: number): Edge[] {
  const r = rng(seed);
  const edges: Edge[] = [];
  for (let i = 0; i < 3 * n; i++) {
    edges.push([
      Math.floor(r() * n),
      Math.floor(r() * n),
      Math.floor(r() * (top + 1)),
    ]);
  }
  return edges;
}

/** 난수 그래프 여러 벌에서 정점 하나가 덱에 들어간 가장 큰 횟수와, 답이 이진 힙과 다른 그래프 수. */
function randomPushes(top: number, n: number, graphs: number) {
  let worst = 0;
  let wrong = 0;
  for (let seed = 1; seed <= graphs; seed++) {
    const edges = randomGraph(seed * 7 + n, n, top);
    const got = counted(n, edges, 0, "deque");
    worst = Math.max(worst, ...got.per);
    if (!sameArr(got.dist, altHeap(n, edges, 0).dist)) wrong++;
  }
  return { worst, wrong };
}

/** 전제가 깨지는 작은 입력 — 가중치 2 간선이 하나 섞였다. */
export const PREMISE_N = 4;
export const PREMISE_EDGES: Edge[] = [
  [0, 1, 2],
  [0, 2, 1],
  [2, 1, 0],
  [1, 3, 0],
];

/* ────────────────────────── 경로 ────────────────────────── */

/** `src` 에서 `to` 로 가는 단순 경로 전부와 그 비용. */
function simplePathsTo(
  n: number,
  edges: Edge[],
  src: number,
  to: number,
): { path: number[]; cost: number }[] {
  const adj = adjacency(n, edges);
  const out: { path: number[]; cost: number }[] = [];
  const on = Array.from({ length: n }, () => false);
  const walk = (u: number, path: number[], cost: number): void => {
    if (u === to) {
      out.push({ path: [...path], cost });
      return;
    }
    on[u] = true;
    for (const [v, w] of adj[u] as [number, number, number][]) {
      if (on[v]) continue;
      path.push(v);
      walk(v, path, cost + w);
      path.pop();
    }
    on[u] = false;
  };
  walk(src, [src], 0);
  return out;
}

const arrow = (p: readonly number[]): string => p.join("→");

/* ────────────────────────── 블록 ────────────────────────── */

const END = WALK.at(-1) as Step;

function conceptPaths(): string {
  const want = zeroOneBfs(WALK_N, WALK_EDGES, WALK_SRC);
  const rows: string[][] = [];
  for (const to of [1, 4]) {
    for (const p of simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, to)) {
      rows.push([
        String(to),
        arrow(p.path),
        String(p.path.length - 1),
        String(p.cost),
        p.cost === want[to] ? "최소" : "",
      ]);
    }
  }
  const direct = simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, 1).find(
    (p) => p.path.length === 2,
  ) as { cost: number };
  return [
    md(["도착 정점", "경로", "간선 수", "비용", "최소 여부"], rows, [2, 3]),
    "",
    `정점 1 까지 간선 하나짜리 경로의 비용은 ${direct.cost}${josa(direct.cost, "이고", "고")} 가장 작은 비용은 ${want[1]} 입니다. 정본이 낸 거리는 dist[1] = ${want[1]} · dist[4] = ${want[4]} 입니다.`,
  ].join("\n");
}

function conceptOrder(): string {
  const rows = POPS.map((s, i) => {
    const p = s.popped as Item;
    return [
      String(i + 1),
      String(p.v),
      String(p.key),
      num(prevOf(WALK, s).dist[p.v] as number),
    ];
  });
  const keys = POPS.map((s) => (s.popped as Item).key);
  const drops = keys.filter(
    (k, i) => i > 0 && k < (keys[i - 1] as number),
  ).length;
  return [
    md(
      ["꺼낸 차례", "정점", "넣을 때 거리", "꺼낼 때 dist"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `꺼낸 항목은 ${POPS.length} 개이고, 넣을 때 거리는 차례로 ${keys.join(" ")} 입니다. 앞 항목보다 작아진 자리는 ${drops} 곳입니다.`,
  ].join("\n");
}

function pathScale(): string {
  const rows: string[][] = [];
  for (const k of [2, 4, 8, 12]) {
    const g = diamonds(k);
    const got = simplePathsTo(g.n, g.edges, 0, g.n - 1).length;
    if (got !== 2 ** k) {
      throw new Error(`다이아몬드 ${k} 개의 경로가 ${got} 개 — 2^k 와 다르다`);
    }
    rows.push([
      comma(k),
      comma(g.n),
      comma(g.edges.length),
      comma(got),
      "실행",
    ]);
  }
  const bigK = Math.floor((100_000 - 1) / 3);
  const big = diamonds(bigK);
  const digits = Math.floor(bigK * Math.log10(2)) + 1;
  rows.push([
    comma(bigK),
    comma(big.n),
    comma(big.edges.length),
    `2^${bigK} — ${comma(digits)} 자리 수`,
    "식",
  ]);
  return [
    md(
      ["다이아몬드 수 k", "정점 V", "간선 E", "끝 정점까지 경로 수", "센 방법"],
      rows,
      [0, 1, 2],
    ),
    "",
    `실행한 네 줄은 경로 수가 모두 2^k 와 일치했고, 마지막 줄은 정점 ${comma(big.n)} 개로 만드는 다이아몬드 사슬을 그 식에 넣은 값입니다.`,
  ].join("\n");
}

function naiveScale(): string {
  const levelsOf = (v: number): number => Math.floor((v - 1) / 2) + 1;
  const sweepsOf = (v: number): number => 3 * levelsOf(v);
  const scansOf = (v: number): number => sweepsOf(v) * (v - 1);
  const sec = (x: number): string => `${(x / 1e8).toFixed(3)} 초`;
  const rows: string[][] = [];
  for (const v of [10, 100, 1_000, 2_000]) {
    const g = zigzag(v);
    const got = levelSweep(g.n, g.edges, 0);
    if (
      got.levels !== levelsOf(v) ||
      got.sweeps !== sweepsOf(v) ||
      got.scans !== scansOf(v)
    ) {
      throw new Error(`0/1 사슬의 식이 실측과 다르다(V=${v})`);
    }
    rows.push([
      comma(v),
      comma(g.edges.length),
      comma(got.levels),
      comma(got.sweeps),
      comma(got.scans),
      sec(got.scans),
      "실행",
    ]);
  }
  for (const v of [10_000, 100_000]) {
    rows.push([
      comma(v),
      comma(v - 1),
      comma(levelsOf(v)),
      comma(sweepsOf(v)),
      comma(scansOf(v)),
      sec(scansOf(v)),
      "식",
    ]);
  }
  return [
    md(
      [
        "정점 V",
        "간선 E",
        "거리 층",
        "간선 목록 읽기",
        "기본 연산",
        "1 초에 1 억 번 기준",
        "센 방법",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    `실행한 네 줄은 거리 층이 ⌊(V−1)/2⌋ + 1 개, 간선 목록 읽기가 층마다 3 번, 기본 연산이 읽기마다 V − 1 번인 식과 모두 일치했고, 마지막 두 줄은 그 식으로 낸 값입니다. 정점 100,000 개에서 기본 연산은 ${comma(scansOf(100_000))} 번입니다.`,
  ].join("\n");
}

function sweepTrace(): string {
  const got = levelSweep(WALK_N, WALK_EDGES, WALK_SRC, true);
  const rows = got.log.map((s, i) => [
    String(i + 1),
    `층 ${s.level}`,
    s.kind === "zero"
      ? "가중치 0 간선으로 같은 층 채우기"
      : "가중치 1 간선으로 다음 층 열기",
    s.writes.length === 0
      ? "없음"
      : s.writes.map(([v, d]) => `dist[${v}] = ${d}`).join(" · "),
    String(WALK_EDGES.length),
  ]);
  const idle = got.log.filter((s) => s.writes.length === 0).length;
  return [
    md(["읽기", "층", "하는 일", "새로 적은 값", "기본 연산"], rows, [0, 4]),
    "",
    `간선 목록을 ${got.sweeps} 번 읽어 기본 연산이 ${got.scans} 번이고, 그중 새로 적은 값이 하나도 없는 읽기가 ${idle} 번입니다. 결과는 ${show(got.dist)} 입니다.`,
  ].join("\n");
}

function sweepVsDeque(): string {
  const s = levelSweep(WALK_N, WALK_EDGES, WALK_SRC);
  const d = counted(WALK_N, WALK_EDGES, WALK_SRC, "deque");
  return [
    md(
      ["방식", "간선 검사", "기본 연산", "되풀이한 단위", "결과"],
      [
        [
          "거리 층마다 간선 목록을 다시 읽는다",
          comma(s.scans),
          comma(s.scans),
          `간선 목록 읽기 ${s.sweeps} 번`,
          show(s.dist),
        ],
        [
          "거리가 막 바뀐 정점을 덱에 넣고 하나씩 꺼낸다",
          comma(d.scans),
          comma(d.ops),
          `꺼낸 항목 ${d.pops} 개`,
          show(d.dist),
        ],
      ],
      [1, 2],
    ),
    "",
    `두 결과가 같고, 간선 검사는 ${s.scans} 번과 ${d.scans} 번입니다. 덱 쪽의 기본 연산 ${d.ops} 번은 간선 검사 ${d.scans} 번에 넣기 ${d.pushes} 번 · 꺼내기 ${d.pops} 번 · 옮기기 ${d.moves} 번을 더한 값입니다.`,
  ].join("\n");
}

const CANDIDATE_INPUTS: [string, { n: number; edges: Edge[] }][] = [
  ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
  ["격자 8×8", grid(8)],
  ["늦은 지름길 m=64", lateShortcut(64)],
];

/** 후보 넷 — 짧은 이름 · 하는 일 · 사본. */
const CANDIDATES: [
  string,
  string,
  (n: number, e: Edge[]) => { ops: number; dist: number[] },
][] = [
  [
    "큐",
    "전부 뒤에 넣고 앞에서 꺼낸다",
    (n, e) => counted(n, e, 0, "backOnly"),
  ],
  [
    "앞에만 넣는 덱",
    "전부 앞에 넣고 앞에서 꺼낸다",
    (n, e) => counted(n, e, 0, "frontOnly"),
  ],
  [
    "우선순위 큐",
    "이진 힙에서 키가 가장 작은 항목을 꺼낸다",
    (n, e) => altHeap(n, e, 0),
  ],
  [
    "덱",
    "가중치 0 간선은 앞, 가중치 1 간선은 뒤에 넣고 앞에서 꺼낸다",
    (n, e) => counted(n, e, 0, "deque"),
  ],
];

/** 후보 넷의 기본 연산 — 「아이디어를 떠올리는 과정」과 그림 사이드카가 같이 쓴다. */
export function candidateOps(): {
  name: string;
  rule: string;
  ops: number[];
}[] {
  return CANDIDATES.map(([name, rule, run]) => ({
    name,
    rule,
    ops: CANDIDATE_INPUTS.map(([, g]) => {
      const got = run(g.n, g.edges);
      checked(g.n, g.edges, 0, got.dist);
      return got.ops;
    }),
  }));
}

export const CANDIDATE_LABELS = CANDIDATE_INPUTS.map(([l]) => l);

function orderCandidates(): string {
  const all = candidateOps();
  const rows = all.map((c) => [`${c.name} — ${c.rule}`, ...c.ops.map(comma)]);
  rows.push([
    "정점 V / 간선 E",
    ...CANDIDATE_INPUTS.map(
      ([, g]) => `${comma(g.n)} / ${comma(g.edges.length)}`,
    ),
  ]);
  const least = (i: number): string => {
    const min = Math.min(...all.map((c) => c.ops[i] as number));
    return all
      .filter((c) => c.ops[i] === min)
      .map((c) => `「${c.name}」`)
      .join(" · ");
  };
  return [
    md(["담는 자리와 규칙", ...CANDIDATE_LABELS], rows, [1, 2, 3]),
    "",
    `네 규칙 모두 세 입력에서 정본과 같은 답을 냈습니다. 기본 연산이 가장 적은 규칙은 전개 입력에서 ${least(0)}, 격자 8×8 에서 ${least(1)}, 늦은 지름길 m=64 에서 ${least(2)} 입니다.`,
  ].join("\n");
}

function orderBreakdown(): string {
  const g = lateShortcut(64);
  const rows = (
    [
      ["큐", "backOnly"],
      ["앞에만 넣는 덱", "frontOnly"],
      ["덱", "deque"],
    ] as [string, Rule][]
  ).map(([label, rule]) => {
    const c = counted(g.n, g.edges, 0, rule);
    return [
      label,
      comma(c.scans),
      comma(c.pushes),
      comma(c.pops),
      comma(c.moves),
      comma(c.ops),
    ];
  });
  return [
    md(
      ["규칙", "간선 검사", "넣기", "꺼내기", "옮기기", "기본 연산"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `늦은 지름길 m=64 는 정점 ${comma(g.n)} 개 · 간선 ${comma(g.edges.length)} 개입니다.`,
  ].join("\n");
}

function stageAdj(): string {
  const adj = adjacency(WALK_N, WALK_EDGES);
  const first = WALK[0] as Step;
  const rows = adj.map((list, v) => [
    String(v),
    list.length === 0
      ? "없음"
      : list.map(([to, w]) => `(${to}, ${w})`).join(" "),
    num(first.dist[v] as number),
  ]);
  const cells = adj.reduce((a, l) => a + l.length, 0);
  return [
    md(["정점", "adj — (이웃, 가중치)", "시작 dist"], rows),
    "",
    `이웃 목록의 칸은 모두 ${cells} 개로 간선 수와 같고, 덱에는 항목 ${showDeque(first.dq)} 하나가 들어 있습니다.`,
  ].join("\n");
}

/** 「덱의 두 무리」 그림과 읽는 법이 고르는 걸음 — 덱에 두 무리가 함께 있고 뒤처진 항목도 있는 첫 걸음. */
export const GROUP_STEP: Step = WALK.find((s) => {
  const keys = s.dq.map((x) => x.key);
  return (
    keys.length >= 3 &&
    new Set(keys).size === 2 &&
    s.dq.some((x) => isStale(s, x))
  );
}) as Step;

function groupsRead(): string {
  const s = GROUP_STEP;
  const at = s.dq.length - 1;
  const x = s.dq[at] as Item;
  const pushedBy = WALK.find(
    (t) => t.read?.improved === true && t.read.v === x.v && t.read.nd === x.key,
  ) as Step;
  const r = pushedBy.read as EdgeRead;
  const min = Math.min(...s.dq.map((y) => y.key));
  const deque = showDeque(s.dq);
  return [
    md(
      ["항", "보는 것", "읽은 결과"],
      [
        ["덱의 자리", "앞에서 센 칸", `${at + 1} 번째 칸 — 뒤 끝`],
        ["정점", "칸의 윗줄", String(x.v)],
        ["넣은 걸음", "그 항목을 넣은 걸음", pushedBy.t],
        ["넣은 간선", "간선 u→v 와 그 가중치 w", `${r.u}→${r.v} · 가중치 ${r.w}`],
        ["넣을 때 거리", "dist[u] + w", `${r.du} + ${r.w} = ${r.nd}`],
        [
          "속한 무리",
          "덱에서 가장 작은 넣을 때 거리와의 차",
          `${x.key} − ${min} = ${x.key - min} — ${x.key === min ? "앞 무리" : "뒤 무리"}`,
        ],
      ],
    ),
    "",
    `${s.t}${이가(s.t)} 끝난 뒤 덱은 앞에서 뒤로 ${deque}${josa(deque, "이고", "고")}, 넣을 때 거리는 ${s.dq.map((y) => y.key).join(" ")} 입니다.`,
  ].join("\n");
}

function groupsAll(): string {
  let unordered = 0;
  let wide = 0;
  const rows = WALK.map((s) => {
    const keys = s.dq.map((x) => x.key);
    if (keys.some((k, i) => i > 0 && k < (keys[i - 1] as number))) unordered++;
    if (keys.length > 0 && Math.max(...keys) - Math.min(...keys) > 1) wide++;
    const min = keys.length === 0 ? 0 : Math.min(...keys);
    const front = s.dq.filter((x) => x.key === min);
    const back = s.dq.filter((x) => x.key !== min);
    const stale = s.dq.filter((x) => isStale(s, x));
    return [
      s.t,
      showDeque(s.dq),
      front.length === 0 ? "—" : `거리 ${min} · ${front.length} 개`,
      back.length === 0 ? "—" : `거리 ${min + 1} · ${back.length} 개`,
      stale.length === 0 ? "없음" : stale.map(item).join(" "),
    ];
  });
  return [
    md(
      [
        "걸음",
        "덱 (앞 → 뒤, 정점:넣을 때 거리)",
        "앞 무리",
        "뒤 무리",
        "뒤처진 항목",
      ],
      rows,
    ),
    "",
    `${WALK.length} 걸음 가운데 넣을 때 거리가 앞에서 뒤로 작아진 자리가 있는 걸음은 ${unordered} 번이고, 가장 큰 것과 가장 작은 것의 차가 1 을 넘은 걸음은 ${wide} 번입니다.`,
  ].join("\n");
}

/** 꺼낸 항목의 차례 — 정점과 넣을 때 거리. 넣는 자리 규칙마다 따로 센다. */
export function popKeys(n: number, edges: Edge[], rule: Rule): Item[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => INF);
  dist[0] = 0;
  const dq: Item[] = [{ v: 0, key: 0 }];
  const out: Item[] = [];
  while (dq.length > 0) {
    const x = dq.shift() as Item;
    out.push(x);
    for (const [v, w] of adj[x.v] as [number, number, number][]) {
      const nd = (dist[x.v] as number) + w;
      if (nd >= (dist[v] as number)) continue;
      dist[v] = nd;
      if (rule === "frontOnly" || (rule === "deque" && w === 0)) {
        dq.unshift({ v, key: nd });
      } else dq.push({ v, key: nd });
    }
  }
  checked(n, edges, 0, answer(dist));
  return out;
}

function groupsQueue(): string {
  const d = popKeys(WALK_N, WALK_EDGES, "deque");
  const q = popKeys(WALK_N, WALK_EDGES, "backOnly");
  const rows = Array.from({ length: Math.max(d.length, q.length) }, (_, i) => [
    String(i + 1),
    d[i] ? item(d[i] as Item) : "—",
    q[i] ? item(q[i] as Item) : "—",
  ]);
  const drops = (xs: Item[]): number =>
    xs.filter((x, i) => i > 0 && x.key < (xs[i - 1] as Item).key).length;
  return [
    md(["꺼낸 차례", "덱 — 가중치로 가르기", "큐 — 전부 뒤에 넣기"], rows, [0]),
    "",
    `넣을 때 거리가 바로 앞에 꺼낸 항목보다 작은 항목을 꺼낸 자리는 덱이 ${drops(d)} 곳, 큐가 ${drops(q)} 곳입니다. 꺼낸 항목은 덱이 ${d.length} 개, 큐가 ${q.length} 개입니다.`,
  ].join("\n");
}

function stagePop(): string {
  const rows = POPS.map((s, i) => {
    const p = s.popped as Item;
    const mine = WALK.filter((t) => t.popNo === s.popNo && t.kind === "edge");
    const fixed = mine.filter((t) => t.read?.improved === true);
    return [
      String(i + 1),
      item(p),
      num(prevOf(WALK, s).dist[p.v] as number),
      String(mine.length),
      fixed.length === 0
        ? "없음"
        : fixed.map((t) => `${t.read?.u}→${t.read?.v}`).join(" · "),
    ];
  });
  const stalePops = POPS.filter((s) => {
    const p = s.popped as Item;
    return p.key > (prevOf(WALK, s).dist[p.v] as number);
  });
  const staleFixed = WALK.filter(
    (t) =>
      stalePops.some((s) => s.popNo === t.popNo) && t.read?.improved === true,
  ).length;
  return [
    md(
      [
        "꺼낸 차례",
        "꺼낸 항목",
        "꺼낼 때 dist[u]",
        "읽은 간선",
        "값을 고친 간선",
      ],
      rows,
      [0, 3],
    ),
    "",
    `꺼낸 항목 ${POPS.length} 개 가운데 넣을 때 거리가 꺼낼 때 dist[u] 보다 큰 뒤처진 항목이 ${stalePops.length} 개이고, 그 항목을 꺼낸 자리에서 값을 고친 간선은 ${staleFixed} 개입니다.`,
  ].join("\n");
}

function stagePush(): string {
  const fixed = WALK.filter((t) => t.read?.improved === true);
  const rows = fixed.map((t) => {
    const r = t.read as EdgeRead;
    return [
      t.t,
      `${r.u}→${r.v}`,
      String(r.w),
      `${r.du} + ${r.w} = ${r.nd}`,
      r.side === "front" ? "앞" : "뒤",
      showDeque(t.dq),
    ];
  });
  const front = fixed.filter((t) => t.read?.side === "front");
  const frontSame = front.every(
    (t) => (t.read as EdgeRead).nd === (t.popped as Item).key,
  );
  const backPlusOne = fixed
    .filter((t) => t.read?.side === "back")
    .every((t) => (t.read as EdgeRead).nd === (t.popped as Item).key + 1);
  return [
    md(
      ["걸음", "간선", "가중치 w", "새 거리", "넣은 자리", "넣은 뒤 덱 (앞 → 뒤)"],
      rows,
    ),
    "",
    `값을 고친 간선 ${fixed.length} 개 가운데 앞에 넣은 것이 ${front.length} 개, 뒤에 넣은 것이 ${fixed.length - front.length} 개입니다. 앞에 넣은 항목의 넣을 때 거리가 그 걸음에 꺼낸 항목의 거리와 ${frontSame ? "모두 같고" : "다른 것이 있고"}, 뒤에 넣은 항목은 ${backPlusOne ? "모두 그보다 1 큽니다" : "그보다 1 크지 않은 것이 있습니다"}.`,
  ].join("\n");
}

function stageEnd(): string {
  const last = WALK.at(-2) as Step;
  const rows = last.dist.map((d, v) => [
    String(v),
    num(d),
    String(END.dist[v]),
  ]);
  const unreached = END.dist.filter((d) => d === -1).length;
  return [
    md(["정점", "덱이 빈 뒤 dist", "돌려주는 값"], rows, [0]),
    "",
    `∞ 로 남은 칸 ${unreached} 개가 -1 로 바뀌고 나머지 칸은 그대로입니다.`,
  ].join("\n");
}

function premiseSmall(): string {
  const steps = record(PREMISE_N, PREMISE_EDGES, 0);
  const pops = steps.filter((s) => s.firstOfPop);
  const rows = pops.map((s, i) => {
    const p = s.popped as Item;
    return [String(i + 1), item(p), num(prevOf(steps, s).dist[p.v] as number)];
  });
  const keys = pops.map((s) => (s.popped as Item).key);
  const drops = keys.filter(
    (k, i) => i > 0 && k < (keys[i - 1] as number),
  ).length;
  const end = steps.at(-1) as Step;
  const heap = altHeap(PREMISE_N, PREMISE_EDGES, 0).dist;
  const twice = end.pushes.filter((c) => c >= 2).length;
  const seq = keys.join(" ");
  return [
    md(
      ["꺼낸 차례", "꺼낸 항목 (정점:넣을 때 거리)", "꺼낼 때 dist[u]"],
      rows,
      [0],
    ),
    "",
    `넣을 때 거리가 차례로 ${seq}${으로(seq)} 앞 항목보다 작아진 자리가 ${drops} 곳이고, 덱에 두 번 들어간 정점이 ${twice} 개입니다. 반환값은 ${show(end.dist)} 이고, 이진 힙 다익스트라의 반환값도 ${show(heap)} 입니다.`,
  ].join("\n");
}

function premiseRandom(): string {
  const rows: string[][] = [];
  for (const [label, top] of [
    ["0 · 1", 1],
    ["0 · 1 · 2", 2],
  ] as [string, number][]) {
    for (const n of [10, 100]) {
      const got = randomPushes(top, n, 200);
      rows.push([
        label,
        comma(n),
        comma(3 * n),
        "200",
        String(got.worst),
        String(got.wrong),
      ]);
    }
  }
  return [
    md(
      [
        "간선 가중치",
        "정점 V",
        "간선 E",
        "그래프 수",
        "정점 하나가 덱에 들어간 최대 횟수",
        "답이 이진 힙과 다른 그래프",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    "그래프는 선형 합동 난수로 만들었고(시드는 7 × 번호 + V, 번호 1 부터 200), 간선마다 양 끝과 값을 고르게 골랐습니다.",
  ].join("\n");
}

function designDeque(): string {
  const shapes: [string, { n: number; edges: Edge[] }][] = [
    ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
    ["격자 8×8", grid(8)],
    ["격자 32×32", grid(32)],
    ["별 V=1,000", star(1000)],
  ];
  const rows = shapes.map(([label, g]) => {
    const two = counted(g.n, g.edges, 0, "deque");
    // 배열 하나 — 앞에 넣을 때마다 들어 있던 원소를 한 칸씩 뒤로, 앞에서 꺼낼 때마다 남은 원소를 한 칸씩 당긴다.
    const adj = adjacency(g.n, g.edges);
    const dist = Array.from({ length: g.n }, () => INF);
    dist[0] = 0;
    const one: number[] = [0];
    let moved = 0;
    while (one.length > 0) {
      moved += one.length - 1;
      const u = one.shift() as number;
      for (const [v, w] of adj[u] as [number, number, number][]) {
        const nd = (dist[u] as number) + w;
        if (nd >= (dist[v] as number)) continue;
        dist[v] = nd;
        if (w === 0) {
          moved += one.length;
          one.unshift(v);
        } else one.push(v);
      }
    }
    checked(g.n, g.edges, 0, answer(dist));
    const oneOps = two.scans + two.pushes + two.pops + moved;
    return [
      label,
      comma(g.n),
      comma(g.edges.length),
      comma(moved),
      comma(two.moves),
      comma(oneOps),
      comma(two.ops),
    ];
  });
  return [
    md(
      [
        "모양",
        "정점 V",
        "간선 E",
        "옮긴 원소 — 배열 하나",
        "옮긴 원소 — 배열 둘",
        "기본 연산 — 배열 하나",
        "기본 연산 — 배열 둘",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    "네 모양 모두 두 판의 답이 정본과 같고, 간선 검사 · 넣기 · 꺼내기 횟수도 두 판이 같습니다. 갈리는 것은 옮긴 원소뿐입니다.",
  ].join("\n");
}

function walkInput(): string {
  const want = zeroOneBfs(WALK_N, WALK_EDGES, WALK_SRC);
  const edges = WALK_EDGES.map((e) => `[${e.join(", ")}]`).join(", ");
  return fence(
    "ts",
    [
      `const n = ${WALK_N};`,
      "const edges: [number, number, number][] = [",
      `  ${edges},`,
      "];",
      `const source = ${WALK_SRC};`,
      `// 이 절이 끝나면 나와야 하는 값: ${show(want)}`,
    ].join("\n"),
  );
}

function walkAdj(): string {
  const adj = adjacency(WALK_N, WALK_EDGES);
  const lines = adj.map((list, v) => [
    `adj[${v}]`,
    `= [${list.map(([to, w]) => `[${to}, ${w}]`).join(", ")}]`,
  ]);
  const total = adj.reduce((a, l) => a + l.length, 0);
  return fence("text", `${columns(lines)}\n\n칸 수를 다 더하면 ${total} = E`);
}

function walkDeque(): string {
  const dq = new DequeCopy();
  const rows: string[][] = [];
  const snap = (op: string): void => {
    rows.push([
      op,
      `[${dq.order().join(", ")}]`,
      `[${dq.front.join(", ")}]`,
      `[${dq.back.join(", ")}]`,
      String(dq.moved),
    ]);
  };
  for (const x of [1, 2, 3]) {
    dq.pushBack(x);
    snap(`pushBack(${x})`);
  }
  dq.pushFront(9);
  snap("pushFront(9)");
  while (dq.order().length > 0) {
    const got = dq.popFront() as number;
    snap(`popFront() → ${got}`);
  }
  return [
    md(
      ["연산", "논리적 차례 (앞 → 뒤)", "front", "back", "옮긴 원소 누계"],
      rows,
      [4],
    ),
    "",
    `원소 네 개를 넣고 다 꺼내는 동안 옮긴 원소는 ${dq.moved} 개입니다.`,
  ].join("\n");
}

function walkFirstPops(): string {
  const picked = WALK.filter((s) => s.kind === "edge" && s.popNo <= 2);
  const edgeRows = picked.map((s) => {
    const r = s.read as EdgeRead;
    const verdict = r.improved
      ? `${r.nd} < ${num(r.before)} · dist[${r.v}] = ${r.nd} · ${r.side === "front" ? "앞" : "뒤"}에 넣는다`
      : `${r.nd} ≥ ${num(r.before)} · 그대로 둔다`;
    return [
      s.t,
      `${r.u}→${r.v} 가중치 ${r.w}`,
      `새 값 ${r.du} + ${r.w} = ${r.nd}`,
      verdict,
      `덱 ${showDeque(s.dq)}`,
    ];
  });
  const aligned = columns(edgeRows, "  ").split("\n");
  const out: string[] = [];
  picked.forEach((s, i) => {
    if (s.firstOfPop) {
      const r = s.read as EdgeRead;
      if (out.length > 0) out.push("");
      out.push(
        `정점 ${r.u}${을를(r.u)} 꺼낸다 — 꺼낼 때 dist[${r.u}] = ${r.du}`,
      );
    }
    out.push(aligned[i] as string);
  });
  const last = picked.at(-1) as Step;
  const dup = last.dq.filter((x) => x.v === 1).map((x) => x.key);
  const first = String(dup[0]);
  const second = String(dup[1]);
  out.push("");
  out.push(
    `덱의 칸은 정점:넣을 때 거리다. 정점 1 이 덱에 ${dup.length} 벌이고 넣을 때 거리가 ${first}${과와(first)} ${second}${josa(second, "이다", "다")}`,
  );
  return fence("text", out.join("\n"));
}

function pauseInitMinusOne(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = zeroOneBfs(c.n, c.edges, 0);
    const b = initMinusOne.zeroOneBfs(c.n, c.edges, 0);
    return [c.label, show(a), show(b), sameArr(a, b) ? "같다" : "어긋난다"];
  });
  const stuck = MUTANT_CASES.filter((c) =>
    initMinusOne
      .zeroOneBfs(c.n, c.edges, 0)
      .slice(1)
      .every((d) => d === -1),
  ).length;
  return [
    md(["입력", "시작값이 Infinity", "시작값이 -1", "두 답"], rows),
    "",
    `시작값을 -1 로 둔 판에서 출발 정점 밖의 칸이 전부 -1 로 남은 입력이 ${stuck} 개입니다.`,
  ].join("\n");
}

/** 걸음 한 줄의 조건 판정과 갈래. */
export function stepBranch(s: Step): { cond: string; branch: string } {
  if (s.kind === "start") {
    return { cond: `dist[${WALK_SRC}] = 0`, branch: "시작값" };
  }
  if (s.kind === "none") {
    const p = s.popped as Item;
    return { cond: `adj[${p.v}] 의 간선이 0 개`, branch: "볼 간선이 없다" };
  }
  if (s.kind === "end") {
    return {
      cond: "deque.size() > 0 이 거짓 (0 > 0)",
      branch: "④ ∞ 칸을 -1 로 적는다",
    };
  }
  const r = s.read as EdgeRead;
  if (!r.improved) {
    return {
      cond: `nd >= dist[${r.v}] 이 참 (${r.nd} >= ${num(r.before)})`,
      branch: "① 그대로 둔다",
    };
  }
  return {
    cond: `nd >= dist[${r.v}] 이 거짓 (${r.nd} >= ${num(r.before)}) · w === 0 이 ${r.w === 0 ? "참" : "거짓"}`,
    branch: r.w === 0 ? "② 앞에 넣는다" : "③ 뒤에 넣는다",
  };
}

function walkTrace(): string {
  const rows = WALK.map((s) => {
    const b = stepBranch(s);
    const r = s.read;
    return [
      s.t,
      s.popped ? item(s.popped) : "—",
      r ? `${r.u}→${r.v} (가중치 ${r.w})` : s.kind === "none" ? "없음" : "—",
      b.cond,
      b.branch,
      s.kind === "end" ? show(s.dist) : showDist(s.dist),
      showDeque(s.dq),
    ];
  });
  const at = (mark: string): string[] =>
    WALK.filter((s) => stepBranch(s).branch.startsWith(mark)).map((s) => s.t);
  return [
    md(
      [
        "걸음",
        "꺼낸 항목",
        "보는 간선",
        "조건 판정",
        "갈래",
        "dist",
        "덱 (앞 → 뒤)",
      ],
      rows,
    ),
    "",
    `① 은 ${tList(at("①"))}, ② 는 ${tList(at("②"))}, ③ 은 ${tList(at("③"))}, ④ 는 ${tList(at("④"))} 에서 실행됐습니다. 볼 간선이 없는 꺼냄은 ${tList(at("볼"))} 입니다. 반환값은 ${show(END.dist)} 입니다.`,
  ].join("\n");
}

function pauseTwice(): string {
  const adj = adjacency(WALK_N, WALK_EDGES);
  const per = END.pushes;
  const head = ["정점", ...per.map((_, v) => String(v)), "합"];
  const table1 = md(
    head,
    [
      [
        "덱에 들어간 횟수",
        ...per.map(String),
        String(per.reduce((a, b) => a + b, 0)),
      ],
      [
        "이웃 목록 길이",
        ...adj.map((l) => String(l.length)),
        String(adj.reduce((a, l) => a + l.length, 0)),
      ],
    ],
    head.map((_, i) => i).slice(1),
  );
  const ofOne = WALK.filter(
    (s) => s.kind === "edge" && (s.popped as Item).v === 1,
  );
  const table2 = md(
    [
      "걸음",
      "꺼낸 항목",
      "꺼낼 때 dist[1]",
      "간선 1→3 의 새 값",
      "그때 dist[3]",
      "한 일",
    ],
    ofOne.map((s) => {
      const r = s.read as EdgeRead;
      return [
        s.t,
        item(s.popped as Item),
        num(r.du),
        `${r.du} + ${r.w} = ${r.nd}`,
        num(r.before),
        r.improved ? "고친다" : "그대로 둔다",
      ];
    }),
  );
  const d = counted(WALK_N, WALK_EDGES, WALK_SRC);
  const lastPop = (ofOne.at(-1) as Step).popNo;
  const fixedBySecond = ofOne.filter(
    (s) => s.popNo === lastPop && s.read?.improved === true,
  ).length;
  return [
    table1,
    "",
    "정점 1 을 꺼낸 두 걸음에서 한 일입니다.",
    "",
    table2,
    "",
    `꺼낸 항목 ${d.pops} 개 · 간선 검사 ${d.scans} 번 · 정점 ${WALK_N} 개입니다. 정점 1 의 두 번째 꺼냄이 고친 값은 ${fixedBySecond} 개입니다.`,
  ].join("\n");
}

function finalCases(): string {
  const cases: [string, number, Edge[], number][] = [
    [
      "zeroOneBfs(6, [[0,1,1],[0,2,0],[2,1,0],[2,3,1],[1,3,1],[3,4,0]], 0)",
      WALK_N,
      WALK_EDGES,
      0,
    ],
    [
      "zeroOneBfs(4, [[0,1,1],[1,2,1],[2,3,1]], 0)",
      4,
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ],
      0,
    ],
    [
      "zeroOneBfs(4, [[0,1,0],[1,2,0],[2,3,0]], 0)",
      4,
      [
        [0, 1, 0],
        [1, 2, 0],
        [2, 3, 0],
      ],
      0,
    ],
    [
      "zeroOneBfs(4, [[0,1,1],[2,3,0]], 0)",
      4,
      [
        [0, 1, 1],
        [2, 3, 0],
      ],
      0,
    ],
    [
      "zeroOneBfs(3, [[0,1,0],[1,2,0],[2,0,0]], 0)",
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
        [2, 0, 0],
      ],
      0,
    ],
    ["zeroOneBfs(3, [], 1)", 3, [], 1],
    ["zeroOneBfs(1, [], 0)", 1, [], 0],
  ];
  return fence(
    "text",
    columns(
      cases.map(([call, n, edges, s]) => [
        call,
        "→",
        show(zeroOneBfs(n, edges, s)),
      ]),
    ),
  );
}

function relatedHistory(): string {
  const v = 1;
  const rows = WALK.filter((s) => s.read?.v === v).map((s) => {
    const r = s.read as EdgeRead;
    return [
      s.t,
      `${r.u}→${r.v} (가중치 ${r.w})`,
      `${r.du} + ${r.w} = ${r.nd}`,
      num(r.before),
      num(s.dist[v] as number),
    ];
  });
  const values = [
    INF,
    ...WALK.filter((s) => s.read?.v === v && s.read.improved).map(
      (s) => s.dist[v] as number,
    ),
  ];
  const seq = values.map(num).join(" → ");
  return [
    md(["걸음", "간선", "후보", "그때 dist[1]", "걸음 뒤 dist[1]"], rows),
    "",
    `dist[1] 에 적힌 값의 차례는 ${seq}${josa(seq, "이고", "고")}, 적힌 값이 바뀐 횟수는 ${values.length - 1} 번입니다.`,
  ].join("\n");
}

type Bench = Record<string, number>;
const bench = benchJson as Bench;
const B = (k: string): number => {
  const v = bench[k];
  if (v === undefined) throw new Error(`bench 에 ${k} 가 없다`);
  return v;
};

function altTable(): string {
  const flip = B("경계 · 추가 칸의 순서가 뒤집히는 m");
  const keys = [
    "전개 입력 · 기본 연산",
    "격자 32×32 · 기본 연산",
    "늦은 지름길 m=64 · 기본 연산",
    "전개 입력 · 추가 칸",
    "격자 32×32 · 추가 칸",
    `늦은 지름길 m=${flip - 1} · 추가 칸`,
    `늦은 지름길 m=${flip} · 추가 칸`,
    "늦은 지름길 m=64 · 추가 칸",
  ];
  const rows = keys.map((key) => {
    const a = B(`이 가이드의 절차 · ${key}`);
    const b = B(`힙 다익스트라 · ${key}`);
    const who = a === b ? "같다" : a < b ? "덱" : "이진 힙";
    const ratio =
      a === b ? "—" : `${(Math.max(a, b) / Math.min(a, b)).toFixed(2)} 배`;
    return [key, comma(a), comma(b), who, ratio];
  });
  const late = lateShortcut(64);
  const dp = B("이 가이드의 절차 · 늦은 지름길 m=64 · 넣은 항목");
  const hp = B("힙 다익스트라 · 늦은 지름길 m=64 · 넣은 항목");
  return [
    md(
      [
        "입력 · 축",
        "덱 — 이 가이드의 절차",
        "이진 힙 — 힙 다익스트라",
        "적은 쪽",
        "차이",
      ],
      rows,
      [1, 2],
    ),
    "",
    `추가 칸의 순서는 늦은 지름길 m=${flip - 1} 에서 같고 m=${flip} 에서 처음 뒤집힙니다. 늦은 지름길 m=64 는 정점 ${comma(late.n)} 개이고, 넣은 항목은 덱이 ${comma(dp)} 개, 이진 힙이 ${comma(hp)} 개입니다.`,
  ].join("\n");
}

function mathKeys(): string {
  const made = WALK.filter((s) => s.pushedAt !== null);
  const at = (s: Step): Item => s.dq[s.pushedAt as number] as Item;
  const rows = made.map((s) => [s.t, String(at(s).v), String(at(s).key)]);
  const keys = POPS.map((s) => (s.popped as Item).key);
  const ones = made
    .filter((s) => at(s).v === 1)
    .map((s) => String(at(s).key))
    .join(" · ");
  return [
    md(["항목을 만든 걸음", "정점", "키 κ — 넣을 때 dist"], rows, [1, 2]),
    "",
    `항목은 ${made.length} 개이고, 꺼낸 차례로 키를 늘어놓으면 ${keys.join(" ")} 입니다. 정점 1 은 키가 ${ones} 인 항목 둘로 들어갔습니다.`,
  ].join("\n");
}

function mathScale(): string {
  const rows: string[][] = [];
  let exact = 0;
  const ks = [2, 5, 50, 500, 33_333];
  for (const k of ks) {
    const g = twiceGraph(k);
    const got = counted(g.n, g.edges, 0);
    if (got.pushes === 2 * g.n - 3) exact++;
    rows.push([
      comma(k),
      comma(g.n),
      comma(g.edges.length),
      comma(got.pushes),
      comma(2 * g.n - 3),
      comma(2 * g.n),
    ]);
  }
  return [
    md(
      ["두 번 그래프 k", "정점 V", "간선 E", "덱에 넣은 항목", "2V − 3", "2V"],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    `${ks.length} 벌 가운데 덱에 넣은 항목이 2V − 3 과 같은 것이 ${exact} 벌입니다.`,
  ].join("\n");
}

function mathTerms(): string {
  const V = 100_000;
  const E = 100_000;
  const rows = [
    ["거리 배열 채우기", "V", comma(V)],
    ["이웃 목록 만들기", "V + E", comma(V + E)],
    ["덱에 넣기", "2V 이하", comma(2 * V)],
    ["덱에서 꺼내기", "2V 이하", comma(2 * V)],
    ["뒤집어 옮기기", "2V 이하", comma(2 * V)],
    ["간선 검사", "2E 이하", comma(2 * E)],
    ["합", "8V + 3E", comma(8 * V + 3 * E)],
  ];
  const sweep = 3 * (Math.floor((V - 1) / 2) + 1) * (V - 1);
  const gap =
    Math.floor(Math.log10(sweep)) - Math.floor(Math.log10(8 * V + 3 * E));
  return [
    md(["항", "식", "V = E = 100,000"], rows, [2]),
    "",
    `합 ${comma(8 * V + 3 * E)} 번은 거리 층마다 간선 목록을 다시 읽는 방법의 기본 연산 ${comma(sweep)} 번보다 자릿수가 ${gap} 개 적습니다.`,
  ].join("\n");
}

function invariantVertex1(): string {
  const v = 1;
  const rows: string[][] = [];
  let changes = 0;
  for (const s of WALK) {
    const r = s.read;
    if (r?.v === v && r.improved) {
      changes++;
      rows.push([
        s.t,
        `dist[1] 이 ${num(r.before)} 에서 ${r.nd}${으로(r.nd)} 바뀐다`,
        r.side === "front" ? "덱 앞에 넣는다" : "덱 뒤에 넣는다",
        showDeque(s.dq),
      ]);
    }
    if (s.firstOfPop && (s.popped as Item).v === v) {
      const du = (s.read as EdgeRead).du;
      rows.push([
        s.t,
        `정점 1 을 꺼낸다 · 꺼낼 때 dist[1] = ${du}`,
        "간선 1→3 을 그 값으로 확인한다",
        showDeque(s.dq),
      ]);
    }
  }
  return [
    md(["걸음", "일", "덱에 한 일", "걸음 뒤 덱"], rows),
    "",
    `dist[1] 이 바뀐 ${changes} 번 모두 같은 걸음에 정점 1 이 덱에 들어갔습니다.`,
  ].join("\n");
}

function edgeCases(): string {
  const cases: [string, string, number, Edge[], number][] = [
    ["정점 하나", "zeroOneBfs(1, [], 0)", 1, [], 0],
    ["간선 없음", "zeroOneBfs(3, [], 1)", 3, [], 1],
    [
      "도달 못 하는 정점",
      "zeroOneBfs(4, [[0,1,1],[2,3,0]], 0)",
      4,
      [
        [0, 1, 1],
        [2, 3, 0],
      ],
      0,
    ],
    [
      "가중치 0 사이클",
      "zeroOneBfs(3, [[0,1,0],[1,2,0],[2,0,0]], 0)",
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
        [2, 0, 0],
      ],
      0,
    ],
    [
      "자기 자신으로 가는 간선",
      "zeroOneBfs(2, [[0,0,0],[0,0,1],[0,1,1]], 0)",
      2,
      [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 1],
      ],
      0,
    ],
    [
      "같은 두 정점에 간선이 둘",
      "zeroOneBfs(2, [[0,1,1],[0,1,0]], 0)",
      2,
      [
        [0, 1, 1],
        [0, 1, 0],
      ],
      0,
    ],
    [
      "역방향으로는 못 간다",
      "zeroOneBfs(2, [[1,0,1],[0,1,0]], 1)",
      2,
      [
        [1, 0, 1],
        [0, 1, 0],
      ],
      1,
    ],
  ];
  const got = cases.map(([label, call, n, edges, s]) => ({
    label,
    call,
    n,
    ans: zeroOneBfs(n, edges, s),
    c: counted(n, edges, s),
  }));
  const rows = got.map((g) => [
    g.label,
    `\`${g.call}\``,
    show(g.ans),
    String(g.c.pushes),
    String(g.c.scans),
  ]);
  const over = got.filter((g) => g.c.pushes > 2 * g.n).length;
  return [
    md(
      ["경계 입력", "호출", "결과", "덱에 넣은 항목", "간선 검사"],
      rows,
      [3, 4],
    ),
    "",
    `일곱 입력 모두 반복이 끝났고, 덱에 넣은 항목이 정점 수의 두 배를 넘은 입력은 ${over} 개입니다.`,
  ].join("\n");
}

function mutantNoFront(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = zeroOneBfs(c.n, c.edges, 0);
    const b = noFront.zeroOneBfs(c.n, c.edges, 0);
    return [c.label, show(a), show(b), sameArr(a, b) ? "같다" : "어긋난다"];
  });
  const a = zeroOneBfs(WALK_N, WALK_EDGES, 0);
  const b = noFront.zeroOneBfs(WALK_N, WALK_EDGES, 0);
  const off = a
    .map((x, v) => ({ x, y: b[v] as number, v }))
    .filter((p) => p.x !== p.y)
    .map((p) => `dist[${p.v}] ${p.x} → ${p.y}`);
  return [
    md(["입력", "정본", "앞에 넣는 줄을 지운 판", "두 답"], rows),
    "",
    `전개 입력에서 어긋난 칸은 ${off.length === 0 ? "없음" : off.join(" · ")} 입니다.`,
  ].join("\n");
}

function perfCount(): string {
  const d = counted(WALK_N, WALK_EDGES, WALK_SRC);
  const readSteps = WALK.filter((s) => s.kind === "edge").map((s) => s.t);
  const popSteps = POPS.map((s) => s.t);
  const pushSteps = WALK.filter((s) => s.pushedAt !== null).map((s) => s.t);
  const rows = [
    ["거리 배열 채우기", "T1", comma(WALK_N)],
    ["이웃 목록 만들기", "T1", comma(WALK_N + WALK_EDGES.length)],
    ["덱에 넣기", tList(pushSteps), comma(d.pushes)],
    ["덱에서 꺼내기", tList(popSteps), comma(d.pops)],
    ["뒤집어 옮기기", "꺼낼 때 front 가 비었으면", comma(d.moves)],
    ["간선 검사", tList(readSteps), comma(d.scans)],
  ];
  const total = WALK_N + WALK_N + WALK_EDGES.length + d.ops;
  const bound = 8 * WALK_N + 3 * WALK_EDGES.length;
  return [
    md(["항", "걸음", "기본 연산"], rows, [2]),
    "",
    `정점 V = ${WALK_N} · 간선 E = ${WALK_EDGES.length} 인 입력입니다. 기본 연산을 모두 더하면 ${total} 번이고, 상한 8V + 3E = ${bound} 번 안에 듭니다. 간선 검사 ${d.scans} 번은 간선 수 ${WALK_EDGES.length} 보다 ${d.scans - WALK_EDGES.length} 번 많습니다.`,
  ].join("\n");
}

function worstShapes(): string {
  const shapes: [string, { n: number; edges: Edge[] }][] = [
    ["가중치 1 사슬 V=1,000", chain(1000)],
    ["별 V=1,000", star(1000)],
    ["가지 달린 두 번 그래프 k=20 d=48", twiceFan(20, 48)],
    ["두 번 그래프 k=332", twiceGraph(332)],
  ];
  const got = shapes.map(([label, g]) => ({
    label,
    g,
    c: counted(g.n, g.edges, 0),
  }));
  const rows = got.map(({ label, g, c }) => [
    label,
    comma(g.n),
    comma(g.edges.length),
    comma(c.scans),
    comma(2 * g.edges.length),
    comma(c.peak),
    comma(2 * g.n),
    comma(Math.max(...c.dist)),
  ]);
  const fan = got[2] as (typeof got)[number];
  const tw = got[3] as (typeof got)[number];
  const pct = (a: number, b: number): string => `${Math.round((100 * a) / b)}%`;
  const fanRatio = `${comma(fan.c.scans)} / ${comma(2 * fan.g.edges.length)}`;
  const twRatio = `${comma(tw.c.peak)} / ${comma(2 * tw.g.n)}`;
  return [
    md(
      [
        "모양",
        "정점 V",
        "간선 E",
        "간선 검사",
        "2E",
        "덱 최대 길이",
        "2V",
        "최대 거리",
      ],
      rows,
      [1, 2, 3, 4, 5, 6, 7],
    ),
    "",
    `간선 검사는 가지 달린 두 번 그래프가 ${fanRatio}${으로(fanRatio)} 2E 의 ${pct(fan.c.scans, 2 * fan.g.edges.length)} 까지 가고, 덱 최대 길이는 두 번 그래프가 ${twRatio}${으로(twRatio)} 2V 의 ${pct(tw.c.peak, 2 * tw.g.n)} 까지 갑니다.`,
  ].join("\n");
}

function selfcheckBackT3(): string {
  const index = WALK_EDGES.findIndex(([u, v]) => u === 0 && v === 2);
  const steps = record(WALK_N, WALK_EDGES, WALK_SRC, {
    edgeIndex: index,
    side: "back",
  });
  const pops = steps.filter((s) => s.firstOfPop);
  const rows = pops.map((s, i) => {
    const p = s.popped as Item;
    const mine = steps.filter(
      (t) => t.popNo === s.popNo && t.read?.improved === true,
    );
    return [
      String(i + 1),
      item(p),
      mine.length === 0
        ? "없음"
        : mine.map((t) => `dist[${t.read?.v}] = ${t.read?.nd}`).join(" · "),
    ];
  });
  const end = steps.at(-1) as Step;
  const same = sameArr(end.dist, zeroOneBfs(WALK_N, WALK_EDGES, WALK_SRC));
  const base = counted(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    md(["꺼낸 차례", "꺼낸 항목", "그 꺼냄이 적은 값"], rows, [0]),
    "",
    `반환값은 ${show(end.dist)} 입니다. 정본의 반환값과 ${same ? "같고" : "다르고"}, 꺼낸 항목은 ${base.pops} 개에서 ${pops.length} 개로, 간선 검사는 ${base.scans} 번에서 ${end.scans} 번으로 늘었습니다.`,
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  conceptPaths,
  conceptOrder,
  pathScale,
  naiveScale,
  sweepTrace,
  sweepVsDeque,
  orderCandidates,
  orderBreakdown,
  stageAdj,
  groupsRead,
  groupsAll,
  groupsQueue,
  stagePop,
  stagePush,
  stageEnd,
  premiseSmall,
  premiseRandom,
  designDeque,
  walkInput,
  walkAdj,
  walkDeque,
  walkFirstPops,
  pauseInitMinusOne,
  walkTrace,
  pauseTwice,
  finalCases,
  relatedHistory,
  altTable,
  mathKeys,
  mathScale,
  mathTerms,
  invariantVertex1,
  edgeCases,
  mutantNoFront,
  perfCount,
  worstShapes,
  selfcheckBackT3,
};
