/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 몇 번 셌는지와 걸음마다의 상태를 내보내지 않으므로, 세는
 * 자리만 덧붙인 사본(`counted`)이 아니면 걸음 표를 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 * 사본에는 변이 다섯을 켜는 스위치도 있다(설계 선택 · 짚고 가기 · 불변식 절의 걸음 표). 그 스위치가 낸
 * 답이 `loadMutant` 가 정본 소스에서 만든 변이의 답과 같은지도 같은 자리에서 확인한다.
 *
 * **큰 입력에는 기록을 끈다.** `counted(n, edges, false)` 는 걸음마다의 사본을 안 만들고 값만 센다.
 * 정점 10 만 개짜리 입력에서 걸음마다 배열 전체를 베끼면 메모리가 모자라 출력 없이 죽는다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * 블록은 마크다운 표로 낸다(SPEC §12 `L46`). 표 아래 문장의 수도 실행이 낸 값이면 그 문장까지
 * 여기서 만들고 본문은 `<!--/proof-->` 로 닫는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import { bridgesInGraph } from "./bridgesInGraph-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 무향 간선 여섯. 삼각형 `1−2−3` 에 꼬리 `3−4` 가 붙고,
 * 그 삼각형이 간선 `0−1` 로 정점 0 에 매달리며, 정점 0 에 다시 `0−5` 가 붙는다.
 *
 * 아홉 갈래를 한 입력에서 전부 실행한다. `3−1` 이 되돌아가는 간선이라 줄이는 갈래를 두 끝에서 한
 * 번씩 내고, 뿌리 0 이 나무 자식 둘(1 과 5)을 가져 뿌리의 나무 간선 둘이 같은 규칙으로 판정된다.
 * 나무 간선 `1−2` 에서 `low[2] = disc[1]` 이 되어 등호가 판정을 가르는 자리도 이 입력에 있다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
  [3, 4],
  [0, 5],
];

/** 사이클 하나. 다리가 없다. */
export const RING_N = 4;
export const RING_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

/** 삼각형에 꼬리 하나. 꼬리 간선만 다리다. */
export const TAIL_N = 4;
export const TAIL_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
];

/** 삼각형 둘을 간선 하나가 잇는 그래프. 그 간선만 다리다. */
export const LINK_N = 6;
export const LINK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** 떨어진 두 나무. 바깥 반복이 탐색을 두 번 시작한다. */
export const SPLIT_N = 5;
export const SPLIT_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
];

/** 같은 두 정점 사이에 간선 둘 — 어느 한쪽을 지워도 나머지가 남는다. */
export const TWIN_N = 2;
export const TWIN_EDGES: Edge[] = [
  [0, 1],
  [0, 1],
];

/** 겹친 간선 한 쌍에 꼬리. 꼬리만 다리다. */
export const TWIN_TAIL_N = 3;
export const TWIN_TAIL_EDGES: Edge[] = [
  [0, 1],
  [0, 1],
  [1, 2],
];

/** 겹친 간선 둘을 간선 하나가 잇는 사슬. */
export const TWIN_CHAIN_N = 4;
export const TWIN_CHAIN_EDGES: Edge[] = [
  [0, 1],
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 3],
];

/* ────────────────────────── 그래프 생성 ────────────────────────── */

/** 사슬 `0−1− … −(v−1)`. 간선 전부가 다리다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 사이클 `0−1− … −(v−1)−0`. 다리가 없다. */
export function ring(v: number): Edge[] {
  const out = chain(v);
  out.push([v - 1, 0]);
  return out;
}

/** 별 — 정점 0 에서 나머지 전부로. 간선 전부가 다리다. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 완전 그래프 — 정점 쌍마다 간선 하나. */
export function complete(v: number): Edge[] {
  const out: Edge[] = [];
  for (let a = 0; a < v; a++) for (let b = a + 1; b < v; b++) out.push([a, b]);
  return out;
}

/** 삼각형 `units` 개를 간선 하나씩으로 이은 사슬. */
export function triangles(units: number): { n: number; e: Edge[] } {
  const e: Edge[] = [];
  for (let k = 0; k < units; k++) {
    const b = 3 * k;
    e.push([b, b + 1], [b + 1, b + 2], [b + 2, b]);
    if (k > 0) e.push([b - 1, b]);
  }
  return { n: 3 * units, e };
}

/** 격자 `side × side`. */
export function grid(side: number): { n: number; e: Edge[] } {
  const at = (r: number, c: number): number => r * side + c;
  const e: Edge[] = [];
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      if (r + 1 < side) e.push([at(r, c), at(r + 1, c)]);
      if (c + 1 < side) e.push([at(r, c), at(r, c + 1)]);
    }
  }
  return { n: side * side, e };
}

/**
 * 시드를 고정한 무작위 그래프 — 두 끝이 같은 간선과 겹친 간선이 저절로 섞인다. 비트를 섞는
 * 생성식을 쓴다(곱셈 하나짜리 생성식은 아래 비트의 주기가 짧다).
 */
export function randomGraphs(
  count: number,
  maxV: number,
  seed0: number,
): { n: number; e: Edge[] }[] {
  let seed = seed0 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  const out: { n: number; e: Edge[] }[] = [];
  for (let i = 0; i < count; i++) {
    const n = (next() % maxV) + 1;
    const m = next() % (2 * n + 1);
    const e: Edge[] = [];
    for (let k = 0; k < m; k++) e.push([next() % n, next() % n]);
    out.push({ n, e });
  }
  return out;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 3]` 꼴 — 본문 표기와 같다. */
export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 무향 간선 한 줄 표기 — `0−1`. */
export const ed = (a: number, b: number): string => `${a}−${b}`;

/** 다리 목록을 함수가 돌려주는 모양 그대로 — `[[0, 1], [0, 5]]`. */
export const arr = (es: readonly Edge[]): string =>
  `[${es.map(([a, b]) => `[${a}, ${b}]`).join(", ")}]`;

/** 간선 목록을 표 한 칸에 — `0−1 · 0−5`. 없으면 `없음`. */
export const dots = (es: readonly Edge[]): string =>
  es.length === 0 ? "없음" : es.map(([a, b]) => ed(a, b)).join(" · ");

/** `{0, 1, 2}` 꼴 — 정점 집합. */
export const set = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** 발견 순서 목록 — 아직 안 본 정점은 `-`. */
export const dl = (xs: readonly number[]): string =>
  list(xs.map((d) => (d < 0 ? "-" : String(d))));

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

/** 등폭 두 열 — 이름과 값. 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function pairs(rows: readonly [string, string][]): string[] {
  const w = Math.max(...rows.map(([a]) => width(a)));
  return rows.map(([a, b]) => `${pad(a, w)}  ${b}`);
}

const yes = (b: boolean): string => (b ? "예" : "아니오");
const same = (a: string, b: string): string => (a === b ? "같다" : "다르다");

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 사본에 켤 수 있는 변이 — 설계 선택 · 짚고 가기 · 불변식 절이 걸음 표를 낼 때 쓴다. */
export type Variant =
  | "noSkip"
  | "byVertex"
  | "withEqual"
  | "readLow"
  | "passDisc";

export type StepKind = "진입" | "건너뜀" | "줄임" | "복귀" | "판정";

/** 간선 종류 — 무향 그래프의 깊이 우선 탐색이 간선을 가르는 둘. */
export type EdgeKindKo = "나무" | "되돌아감";

/** 뺀 걸음의 판정 — 자식 `low` 와 부모 `disc` 를 맞댄 것. */
export interface Judge {
  lowC: number;
  discP: number;
  hit: boolean;
}

/** 걸음 하나의 기록. `kind` 가 이 걸음이 실행한 갈래다. */
export interface Step {
  kind: StepKind;
  label: string;
  /** 진입이면 들어간 정점, 이웃을 읽었으면 지금 정점, 뺐으면 뺀 정점. */
  v: number;
  /** 진입이면 부모(바깥 반복이면 `null`), 이웃을 읽었으면 그 이웃. */
  w: number | null;
  /** 이 걸음이 읽거나 타고 내려온 간선의 번호(`edges` 의 자리). 없으면 `null`. */
  edge: number | null;
  /** 이웃을 읽은 걸음이면 그때 호출 스택 맨 위의 내려온 간선 번호. */
  came: number | null;
  /** 뺀 걸음이면 부모(뿌리를 뺐으면 `null`). */
  parent: number | null;
  /** 이 걸음에서 `low` 를 고친 정점과 고치기 전 값. */
  lowFrom: { vertex: number; before: number } | null;
  judge: Judge | null;
  disc: number[];
  low: number[];
  call: number[];
  callI: number[];
  callE: number[];
  found: Edge[];
  kinds: (EdgeKindKo | null)[];
  timer: number;
  reads: number;
}

type StepHead = Pick<
  Step,
  | "kind"
  | "label"
  | "v"
  | "w"
  | "edge"
  | "came"
  | "parent"
  | "lowFrom"
  | "judge"
>;

/** 판정 한 번 — 부모 · 자식 · 탄 간선 번호와 두 값. */
export interface Judged {
  p: number;
  c: number;
  edge: number;
  lowC: number;
  discP: number;
  hit: boolean;
}

export interface Counts {
  found: Edge[];
  disc: number[];
  low: number[];
  to: number[][];
  via: number[][];
  /** 정점의 부모. 뿌리는 `-1`. */
  parent: number[];
  /** 정점으로 내려올 때 탄 간선 번호. 뿌리는 `-1`. */
  parentEdge: number[];
  /** 나무 자식 — 방문한 차례대로. */
  children: number[][];
  /** 바깥 반복이 탐색을 시작한 정점. */
  roots: number[];
  depth: number[];
  kinds: (EdgeKindKo | null)[];
  steps: Step[];
  judged: Judged[];
  /** 간선 목록을 읽은 횟수 — 이웃 목록을 만들며 한 번씩. */
  builds: number;
  /** 순회하며 읽은 이웃 자리. */
  reads: number;
  enters: number;
  pops: number;
  /** 갈래별 실행 횟수 — 내려온 간선 건너뛰기 · 나무 간선 · 이미 들어갔던 정점 읽기. */
  skip: number;
  tree: number;
  back: number;
  /** 줄이는 갈래에서 값이 실제로 줄어든 횟수. */
  lowered: number;
  /** 다리로 적은 횟수. */
  marks: number;
  peakCall: number;
}

const byEdge = (a: Edge, b: Edge): number => a[0] - b[0] || a[1] - b[1];

/**
 * 정본과 같은 절차에 세는 자리만 덧붙인 사본. `variant` 를 주면 그 변이를 켠 판이다.
 * `record` 가 거짓이면 걸음 기록을 안 만든다(큰 입력용).
 */
export function counted(
  n: number,
  edges: Edge[],
  record = true,
  variant?: Variant,
): Counts {
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  let builds = 0;
  edges.forEach(([u, v], k) => {
    builds++;
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(k);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(k);
  });
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const parentEdge: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const children: number[][] = Array.from({ length: n }, () => []);
  const kinds: (EdgeKindKo | null)[] = edges.map(() => null);
  const roots: number[] = [];
  const steps: Step[] = [];
  const judged: Judged[] = [];
  const found: Edge[] = [];
  let timer = 0;
  let reads = 0;
  let enters = 0;
  let pops = 0;
  let skip = 0;
  let tree = 0;
  let back = 0;
  let lowered = 0;
  let marks = 0;
  let peakCall = 0;

  const callV: number[] = [];
  const callI: number[] = [];
  const callE: number[] = [];
  const snap = (s: StepHead): void => {
    if (!record) return;
    steps.push({
      ...s,
      disc: disc.slice(),
      low: low.slice(),
      call: callV.slice(),
      callI: callI.slice(),
      callE: callE.slice(),
      found: found.slice().sort(byEdge),
      kinds: kinds.slice(),
      timer,
      reads,
    });
  };
  const blank = {
    edge: null,
    came: null,
    parent: null,
    lowFrom: null,
    judge: null,
  };
  const enter = (v: number, from: number, edge: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callE.push(edge);
    parent[v] = from;
    parentEdge[v] = edge;
    if (from !== -1) {
      depth[v] = (depth[from] as number) + 1;
      (children[from] as number[]).push(v);
    }
    enters++;
    peakCall = Math.max(peakCall, callV.length);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    roots.push(root);
    enter(root, -1, -1);
    snap({ ...blank, kind: "진입", label: "③", v: root, w: null });

    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = to[v] as number[];

      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const e = (via[v] as number[])[i] as number;
        const came = callE[callE.length - 1] as number;
        reads++;
        const skipped =
          variant === "noSkip"
            ? false
            : variant === "byVertex"
              ? w === callV[callV.length - 2]
              : e === came;
        if (skipped) {
          skip++;
          snap({ ...blank, kind: "건너뜀", label: "④", v, w, edge: e, came });
          continue;
        }
        if (disc[w] === -1) {
          tree++;
          kinds[e] = "나무";
          enter(w, v, e);
          snap({
            ...blank,
            kind: "진입",
            label: "⑤③",
            v: w,
            w: v,
            edge: e,
            came,
          });
          continue;
        }
        back++;
        const before = low[v] as number;
        const seen =
          variant === "readLow" ? (low[w] as number) : (disc[w] as number);
        low[v] = Math.min(before, seen);
        if ((low[v] as number) < before) lowered++;
        if (kinds[e] === null) kinds[e] = "되돌아감";
        snap({
          ...blank,
          kind: "줄임",
          label: "⑥",
          v,
          w,
          edge: e,
          came,
          lowFrom: { vertex: v, before },
        });
        continue;
      }

      callV.pop();
      callI.pop();
      pops++;
      const edge = callE.pop() as number;
      if (edge === -1) {
        snap({ ...blank, kind: "복귀", label: "⑦", v, w: null });
        continue;
      }
      const p = callV[callV.length - 1] as number;
      const before = low[p] as number;
      const passed =
        variant === "passDisc" ? (disc[v] as number) : (low[v] as number);
      low[p] = Math.min(before, passed);
      const lowC = low[v] as number;
      const discP = disc[p] as number;
      const hit = variant === "withEqual" ? lowC >= discP : lowC > discP;
      judged.push({ p, c: v, edge, lowC, discP, hit });
      if (hit) {
        found.push(p < v ? [p, v] : [v, p]);
        marks++;
      }
      snap({
        ...blank,
        kind: hit ? "판정" : "복귀",
        label: hit ? "⑦⑧" : "⑦",
        v,
        w: null,
        edge,
        parent: p,
        lowFrom: { vertex: p, before },
        judge: { lowC, discP, hit },
      });
    }
  }

  found.sort(byEdge);
  return {
    found,
    disc,
    low,
    to,
    via,
    parent,
    parentEdge,
    children,
    roots,
    depth,
    kinds,
    steps,
    judged,
    builds,
    reads,
    enters,
    pops,
    skip,
    tree,
    back,
    lowered,
    marks,
    peakCall,
  };
}

/** 재귀로 적은 판. 절차는 정본과 같고 호출 스택만 자바스크립트에 맡긴다. */
export function recursive(n: number, edges: Edge[]): Edge[] {
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], k) => {
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(k);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(k);
  });
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const found: Edge[] = [];
  let timer = 0;
  const dfs = (v: number, came: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    const nbrs = to[v] as number[];
    for (let i = 0; i < nbrs.length; i++) {
      const w = nbrs[i] as number;
      const e = (via[v] as number[])[i] as number;
      if (e === came) continue;
      if (disc[w] === -1) {
        dfs(w, e);
        low[v] = Math.min(low[v] as number, low[w] as number);
        if ((low[w] as number) > (disc[v] as number)) {
          found.push(v < w ? [v, w] : [w, v]);
        }
      } else {
        low[v] = Math.min(low[v] as number, disc[w] as number);
      }
    }
  };
  for (let v = 0; v < n; v++) if (disc[v] === -1) dfs(v, -1);
  return found.sort(byEdge);
}

/** 연결 성분 개수 — `skip` 번째 간선을 뺀 그래프에서 센다. 읽은 이웃 자리도 센다. */
function componentsWithout(
  n: number,
  edges: Edge[],
  skip: number,
): { parts: number; reads: number } {
  const adj: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], k) => {
    if (k === skip) return;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  });
  const seen: boolean[] = Array.from({ length: n }, () => false);
  let parts = 0;
  let reads = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s] === true) continue;
    parts++;
    seen[s] = true;
    const stack = [s];
    while (stack.length > 0) {
      const v = stack.pop() as number;
      for (const w of adj[v] as number[]) {
        reads++;
        if (seen[w] !== true) {
          seen[w] = true;
          stack.push(w);
        }
      }
    }
  }
  return { parts, reads };
}

/** 연결 성분 개수. */
export function components(n: number, edges: Edge[]): number {
  return componentsWithout(n, edges, -1).parts;
}

/** 간선을 하나씩 지우고 연결 성분 수를 다시 세는 방법. 탐색 횟수와 이웃 자리 읽기를 센다. */
export function byDeletion(
  n: number,
  edges: Edge[],
): { found: Edge[]; reads: number; scans: number; after: number[] } {
  const base = componentsWithout(n, edges, -1);
  let reads = base.reads;
  let scans = 1;
  const found: Edge[] = [];
  const after: number[] = [];
  edges.forEach(([u, v], k) => {
    const c = componentsWithout(n, edges, k);
    scans++;
    reads += c.reads;
    after.push(c.parts);
    if (c.parts > base.parts) found.push(u < v ? [u, v] : [v, u]);
  });
  return { found: found.sort(byEdge), reads, scans, after };
}

export interface Tree {
  disc: number[];
  parent: number[];
  children: number[][];
  roots: number[];
  /** `[부모, 자식, 간선 번호]` — 내려간 차례대로. */
  treeEdges: [number, number, number][];
  /** `[아래 끝, 위 끝, 간선 번호]` — 나무에 안 든 간선. 두 끝이 같은 간선도 여기 든다. */
  backEdges: [number, number, number][];
  /** `subtree[v]` — `v` 의 서브트리(자기 포함), 오름차순. */
  subtree: number[][];
}

/** 깊이 우선 탐색이 만든 나무. 나무 간선과 되돌아가는 간선을 간선 번호로 갈라 돌려준다. */
export function tree(n: number, edges: Edge[]): Tree {
  const c = counted(n, edges, false);
  const treeEdges: [number, number, number][] = [];
  const backEdges: [number, number, number][] = [];
  const order = Array.from({ length: n }, (_, v) => v).sort(
    (a, b) => (c.disc[a] as number) - (c.disc[b] as number),
  );
  for (const v of order) {
    const p = c.parent[v] as number;
    if (p !== -1) treeEdges.push([p, v, c.parentEdge[v] as number]);
  }
  edges.forEach(([u, v], k) => {
    if (c.kinds[k] === "나무") return;
    const top = (c.disc[u] as number) <= (c.disc[v] as number) ? u : v;
    const bottom = top === u ? v : u;
    backEdges.push([bottom, top, k]);
  });
  const subtree: number[][] = Array.from({ length: n }, () => []);
  for (const v of order.slice().reverse()) {
    (subtree[v] as number[]).push(v);
    const p = c.parent[v] as number;
    if (p !== -1) (subtree[p] as number[]).push(...(subtree[v] as number[]));
  }
  for (const s of subtree) s.sort((a, b) => a - b);
  return {
    disc: c.disc,
    parent: c.parent,
    children: c.children,
    roots: c.roots,
    treeEdges,
    backEdges,
    subtree,
  };
}

/**
 * 정의를 그대로 계산한 `low` — `v` 의 서브트리에서 되돌아가는 간선 하나로 이르는 정점의 발견 순서와
 * `disc[v]` 를 통틀어 가장 작은 값. 절차의 순서를 안 쓰고 나무와 간선 분류에서 바로 계산한다.
 */
export function lowByDefinition(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const out = t.disc.slice();
  for (const [b, a] of t.backEdges) {
    for (let v = 0; v < n; v++) {
      if ((t.subtree[v] as number[]).includes(b)) {
        out[v] = Math.min(out[v] as number, t.disc[a] as number);
      }
    }
  }
  return out;
}

/** 주어진 `low` 로 판정 규칙을 적용한 답 — 나무는 정본의 깊이 우선 탐색 트리다. */
export function ruleWith(n: number, edges: Edge[], low: number[]): Edge[] {
  const t = tree(n, edges);
  const out: Edge[] = [];
  for (const [p, c] of t.treeEdges) {
    if ((low[c] as number) > (t.disc[p] as number)) {
      out.push(p < c ? [p, c] : [c, p]);
    }
  }
  return out.sort(byEdge);
}

/** 정점 집합과 나머지를 잇는 간선 — 간선 번호 목록. */
function crossing(edges: Edge[], inside: readonly number[]): number[] {
  const s = new Set(inside);
  const out: number[] = [];
  edges.forEach(([u, v], k) => {
    if (s.has(u) !== s.has(v)) out.push(k);
  });
  return out;
}

/**
 * 간선 연결도 — 지워서 성분 개수를 늘리는 간선 집합 중 **가장 작은 것의 크기**. 크기 `1` 부터 차례로
 * 전수 검사한다. 이미 갈라진 그래프는 `0` 이다.
 */
export function edgeConnectivity(
  n: number,
  edges: Edge[],
  cap: number,
): number {
  const base = components(n, edges);
  if (base > 1) return 0;
  for (let k = 1; k <= Math.min(cap, edges.length); k++) {
    const pick: number[] = [];
    const search = (start: number): boolean => {
      if (pick.length === k) {
        const rest = edges.filter((_, i) => !pick.includes(i));
        return components(n, rest) > base;
      }
      for (let i = start; i < edges.length; i++) {
        pick.push(i);
        if (search(i + 1)) return true;
        pick.pop();
      }
      return false;
    };
    if (search(0)) return k;
  }
  return cap + 1;
}

/** 다리를 전부 지운 뒤 남는 조각의 개수. */
export function piecesWithoutBridges(n: number, edges: Edge[]): number {
  const bridges = new Set(bridgesInGraph(n, edges).map(([u, v]) => ed(u, v)));
  const rest = edges.filter(
    ([u, v]) => !bridges.has(u < v ? ed(u, v) : ed(v, u)),
  );
  return components(n, rest);
}

/* ────────────────────── 사본 자기대조 ────────────────────── */

const TRI4 = triangles(4);
const GRID3 = grid(3);

const 자기대조_입력: [number, Edge[]][] = [
  [WALK_N, WALK_EDGES],
  [RING_N, RING_EDGES],
  [TAIL_N, TAIL_EDGES],
  [LINK_N, LINK_EDGES],
  [SPLIT_N, SPLIT_EDGES],
  [TWIN_N, TWIN_EDGES],
  [TWIN_TAIL_N, TWIN_TAIL_EDGES],
  [TWIN_CHAIN_N, TWIN_CHAIN_EDGES],
  [
    3,
    [
      [0, 0],
      [0, 1],
      [1, 2],
    ],
  ],
  [16, chain(16)],
  [16, ring(16)],
  [16, star(16)],
  [8, complete(8)],
  [TRI4.n, TRI4.e],
  [GRID3.n, GRID3.e],
  ...randomGraphs(40, 24, 20260930).map((g) => [g.n, g.e] as [number, Edge[]]),
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [n, edges] of 자기대조_입력) {
    const ref = arr(bridgesInGraph(n, edges));
    if (arr(counted(n, edges, false).found) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (arr(counted(n, edges, true).found) !== ref) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (arr(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
    if (arr(byDeletion(n, edges).found) !== ref) {
      throw new Error("간선을 지워 보는 사본이 정본과 다른 답을 낸다");
    }
    if (arr(ruleWith(n, edges, lowByDefinition(n, edges))) !== ref) {
      throw new Error("정의로 계산한 low 가 정본과 다른 답을 낸다");
    }
    if (
      list(counted(n, edges, false).low) !== list(lowByDefinition(n, edges))
    ) {
      throw new Error("사본의 low 가 정의로 계산한 low 와 다르다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./bridgesInGraph-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  bridgesInGraph(n: number, edges: Edge[]): Edge[];
}

const PARENT_LINE =
  /^ {8}if \(e === \(stackE\[stackE\.length - 1\] as number\)\) \{$/;

/** 내려온 간선을 건너뛰지 않는 사본 — 그 검사를 늘 거짓으로 둔다. */
const noSkip = await loadMutant<Impl>(REF, {
  swap: [PARENT_LINE, "        if (false) {"],
});

/** 내려온 간선을 간선 번호가 아니라 **정점 번호**로 건너뛰는 사본. */
const byVertex = await loadMutant<Impl>(REF, {
  swap: [
    PARENT_LINE,
    "        if (w === (stackV[stackV.length - 2] as number)) {",
  ],
});

/** 판정에 **등호를 넣은** 사본 — 단절점 규칙의 부등호를 그대로 옮긴 모양이다. */
const withEqual = await loadMutant<Impl>(REF, {
  swap: [
    /^ {8}if \(\(low\[v\] as number\) > \(disc\[p\] as number\)\) \{$/,
    "        if ((low[v] as number) >= (disc[p] as number)) {",
  ],
});

/** 되돌아가는 간선에서 `disc[w]` 대신 **`low[w]`** 를 읽는 사본. */
const readLow = await loadMutant<Impl>(REF, {
  swap: [
    /^ {10}low\[v\] = Math\.min\(low\[v\] as number, disc\[w\] as number\);$/,
    "          low[v] = Math.min(low[v] as number, low[w] as number);",
  ],
});

/** **불변식을 지키던 줄** — 부모에게 자식의 `low` 대신 자식의 `disc` 를 넘기는 사본. */
const passDisc = await loadMutant<Impl>(REF, {
  swap: [
    /^ {8}low\[p\] = Math\.min\(low\[p\] as number, low\[v\] as number\);$/,
    "        low[p] = Math.min(low[p] as number, disc[v] as number);",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof`
 * 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = withEqual.bridgesInGraph === bridgesInGraph;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
// 사본의 변이 스위치가 기계로 만든 변이와 같은 답을 내는지도 여기서 본다.
if (!중화됨) {
  const breaking: [string, Impl, [number, Edge[]][]][] = [
    ["내려온 간선을 건너뛰지 않는 판", noSkip, [[WALK_N, WALK_EDGES]]],
    [
      "정점 번호로 건너뛰는 판",
      byVertex,
      [
        [TWIN_N, TWIN_EDGES],
        [TWIN_TAIL_N, TWIN_TAIL_EDGES],
      ],
    ],
    ["등호를 넣은 판", withEqual, [[WALK_N, WALK_EDGES]]],
    ["자식의 disc 를 넘기는 판", passDisc, [[RING_N, RING_EDGES]]],
  ];
  for (const [label, impl, cases] of breaking) {
    if (
      cases.every(
        ([n, e]) =>
          arr(bridgesInGraph(n, e)) === arr(impl.bridgesInGraph(n, e)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  const pairsOf: [Variant, Impl][] = [
    ["noSkip", noSkip],
    ["byVertex", byVertex],
    ["withEqual", withEqual],
    ["readLow", readLow],
    ["passDisc", passDisc],
  ];
  for (const [variant, impl] of pairsOf) {
    for (const [n, e] of 자기대조_입력) {
      if (
        arr(counted(n, e, false, variant).found) !==
        arr(impl.bridgesInGraph(n, e))
      ) {
        throw new Error(`사본의 ${variant} 스위치가 기계로 만든 변이와 다르다`);
      }
    }
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

export const V_LIMIT = 100_000;
export const E_LIMIT = 100_000;
export const OPS_PER_SEC = 1e8;

/** 여러 절이 함께 쓰는 모양 — 이름은 본문의 표기와 같다. */
const SHAPES: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["사이클 (V = 4)", RING_N, RING_EDGES],
  ["삼각형에 꼬리 하나", TAIL_N, TAIL_EDGES],
  ["삼각형 둘을 간선 하나가 이음", LINK_N, LINK_EDGES],
  ["떨어진 두 나무", SPLIT_N, SPLIT_EDGES],
  ["겹친 간선 한 쌍에 꼬리", TWIN_TAIL_N, TWIN_TAIL_EDGES],
  ["사슬 (V = 8)", 8, chain(8)],
  ["별 (V = 8)", 8, star(8)],
  ["완전 그래프 (V = 8)", 8, complete(8)],
];

const LABELS: [string, string][] = [
  ["①", "이웃 목록에 간선 번호까지 담는다"],
  ["②", "정점마다의 칸을 만든다"],
  ["③", "정점에 처음 들어간다"],
  ["④", "내려온 간선을 건너뛴다"],
  ["⑤", "처음 보는 이웃으로 내려간다"],
  ["⑥", "이미 들어갔던 정점에서 low 를 줄인다"],
  ["⑦", "이웃을 다 본 정점을 빼고 low 를 넘긴다"],
  ["⑧", "내려온 나무 간선을 다리로 적는다"],
  ["⑨", "다리 목록을 차례대로 세워 돌려준다"],
];

function branchCounts(n: number, edges: Edge[]): number[] {
  const c = counted(n, edges, false);
  return [1, 1, c.enters, c.skip, c.tree, c.back, c.pops, c.marks, 1];
}

/**
 * 걸음 하나가 다루는 자리 — 간선을 읽은 걸음이면 `u−v`, 뺀 걸음이면 내려온 나무 간선(뿌리는 정점 번호).
 * 진입은 부모에서 자식으로 내려간 것이라 `w−v` 이고, 나머지는 지금 정점에서 이웃을 본 것이라 `v−w` 다.
 */
export function site(s: Step): string {
  if (s.kind === "복귀" || s.kind === "판정") {
    return s.parent === null ? String(s.v) : ed(s.parent, s.v);
  }
  if (s.w === null) return String(s.v);
  return s.kind === "진입" ? ed(s.w, s.v) : ed(s.v, s.w);
}

/** 걸음 표의 마지막 열 — 이 걸음이 한 일. */
export function stepNote(s: Step): string {
  switch (s.kind) {
    case "진입":
      return `disc[${s.v}] = low[${s.v}] = ${s.disc[s.v]}`;
    case "건너뜀":
      return `간선 ${s.edge}${이가(String(s.edge))} 내려온 간선이라 건너뛴다`;
    case "줄임":
      return `low[${s.v}] = min(${s.lowFrom?.before}, disc[${s.w}] = ${s.disc[s.w as number]}) = ${s.low[s.v]}`;
    case "복귀":
      return s.parent === null
        ? "뿌리를 빼서 호출 스택이 비었다"
        : `low[${s.parent}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[s.parent]} · low[${s.v}] = ${s.judge?.lowC} > disc[${s.parent}] = ${s.judge?.discP}${이가(String(s.judge?.discP))} 거짓`;
    default: {
      const e = ed(s.parent as number, s.v);
      return `low[${s.v}] = ${s.judge?.lowC} > disc[${s.parent}] = ${s.judge?.discP}${josa(String(s.judge?.discP), "이라", "라")} ${e}${josa(e, "은", "는")} 다리`;
    }
  }
}

/** 전개 입력의 걸음 기록 — 정본과 같은 절차를 실행한 사본에서. */
export function walkSteps(): { steps: Step[]; counts: Counts } {
  const counts = counted(WALK_N, WALK_EDGES);
  return { steps: counts.steps, counts };
}

/** `T#` 번호로 걸음 하나를 찾는다 — T1 이 준비라 사본의 첫 걸음이 T2 다. */
export function stepAt(steps: readonly Step[], t: number): Step {
  return steps[t - 2] as Step;
}

/** 걸음의 `T#` 번호. */
export const tOf = (steps: readonly Step[], s: Step): number =>
  steps.indexOf(s) + 2;

/** 가장 단순한 후보가 내는 답 — 「나무 간선이면 다리다」. */
export function candidateAnswer(n: number, edges: Edge[]): Edge[] {
  return tree(n, edges)
    .treeEdges.map(([p, c]): Edge => (p < c ? [p, c] : [c, p]))
    .sort(byEdge);
}

/** 간선 `k` 가 다리인가 — 지워 본 답. */
function isBridgeByDeletion(n: number, edges: Edge[], k: number): boolean {
  return (
    componentsWithout(n, edges, k).parts > componentsWithout(n, edges, -1).parts
  );
}

/** 서브트리 `c` 에서 밖의 정점으로 나가는 되돌아가는 간선 — `[아래 끝, 위 끝]`. */
function leavingBack(t: Tree, c: number): [number, number][] {
  const sub = t.subtree[c] as number[];
  return t.backEdges
    .filter(([b, a]) => sub.includes(b) && !sub.includes(a))
    .map(([b, a]) => [b, a]);
}

/** 전개 입력의 걸음 기록 · 나무 · 정본의 답 — 그림 사이드카도 이 셋을 쓴다. */
export const WALK = walkSteps();
export const WALK_TREE = tree(WALK_N, WALK_EDGES);
export const WALK_ANSWER = bridgesInGraph(WALK_N, WALK_EDGES);

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. `visits` 는 바꾼 줄을 지나간 횟수. */
function mutantRows(
  impl: Impl,
  cases: readonly [string, number, Edge[]][],
  visits?: (n: number, e: Edge[]) => number,
): string[][] {
  return cases.map(([label, n, e]) => {
    const a = arr(bridgesInGraph(n, e));
    const b = arr(impl.bridgesInGraph(n, e));
    return [label, ...(visits ? [comma(visits(n, e))] : []), a, b, same(a, b)];
  });
}

const differ = (rows: string[][]): number =>
  rows.filter((r) => r.at(-1) === "다르다").length;

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  /** 정의 그대로 — 간선을 하나씩 지우고 덩어리 수를 센다. */
  conceptDelete: () => {
    const base = components(WALK_N, WALK_EDGES);
    const d = byDeletion(WALK_N, WALK_EDGES);
    const rows = WALK_EDGES.map(([u, v], k) => {
      const after = d.after[k] as number;
      return [ed(u, v), `${base} → ${after}`, after > base ? "다리" : "아니다"];
    });
    return [
      md(["지운 간선", "덩어리 수", "판정"], rows),
      "",
      `덩어리 수가 늘어나는 간선은 ${dots(d.found)} 이고, 정본이 낸 답도 ${arr(WALK_ANSWER)} 입니다.`,
    ].join("\n");
  },

  /** 판정 규칙이 전개 입력의 나무 간선마다 낸 답. */
  conceptRules: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const rows = c.judged.map((j) => [
      ed(j.p, j.c),
      String(j.discP),
      String(j.lowC),
      j.hit ? "참" : "거짓",
      j.hit ? "다리" : "아니다",
    ]);
    const del = byDeletion(WALK_N, WALK_EDGES).found;
    const back = dots(WALK_TREE.backEdges.map(([b, a]): Edge => [b, a]));
    return [
      md(
        [
          "나무 간선",
          "disc[부모]",
          "low[자식]",
          "low[자식] > disc[부모]",
          "판정",
        ],
        rows,
        [1, 2],
      ),
      "",
      `규칙이 낸 답은 ${arr(c.found)} 이고, 간선을 하나씩 지워 본 답도 ${arr(del)} 입니다. 되돌아가는 간선 ${back}${josa(back, "은", "는")} 나무 간선이 아니라 판정하지 않습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.origin ─────────────── */

  /** 간선마다 지워 보는 방법의 비용 — 사슬로 규모를 키우며. */
  naiveScale: () => {
    const rows = [4, 8, 16, 32, 64].map((v) => {
      const e = chain(v);
      const d = byDeletion(v, e);
      const once = counted(v, e, false).reads;
      if (d.reads !== 2 * e.length * e.length) {
        throw new Error("지워 보기의 읽기가 2E² 와 다르다");
      }
      return [
        String(v),
        String(e.length),
        comma(d.scans),
        comma(d.reads),
        comma(once),
        comma(d.reads / once),
      ];
    });
    const equal = rows.filter((r) => r[5] === r[1]).length;
    const scans = E_LIMIT + 1;
    const upper = 2 * E_LIMIT * E_LIMIT;
    return [
      md(
        [
          "정점 V",
          "간선 E",
          "탐색 횟수",
          "지워 보기의 이웃 자리 읽기",
          "깊이 우선 탐색 한 번의 이웃 자리 읽기",
          "몇 배",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `다섯 줄 중 ${equal} 줄에서 「몇 배」가 간선 수 E 와 같고, 지워 보기의 읽기는 다섯 줄 모두 2E² 와 같습니다. 규모의 상한 E = ${comma(E_LIMIT)} 에서는 탐색이 ${comma(scans)} 번이고 읽기가 2E² = ${comma(upper)} 번입니다. 초당 1 억 번 기준 ${comma(upper / OPS_PER_SEC)} 초입니다.`,
    ].join("\n");
  },

  /** 같은 전개 입력을 두 방식으로. */
  twoWays: () => {
    const d = byDeletion(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      md(
        ["방법", "탐색 횟수", "이웃 자리 읽기", "답"],
        [
          [
            "간선마다 지워 보기",
            String(d.scans),
            String(d.reads),
            arr(d.found),
          ],
          ["깊이 우선 탐색 한 번", "1", String(c.reads), arr(c.found)],
        ],
        [1, 2],
      ),
      "",
      `두 방법의 답이 같고, 이웃 자리 읽기는 ${d.reads} 번과 ${c.reads} 번입니다. 이웃 목록의 자리는 모두 ${2 * WALK_EDGES.length} 개입니다.`,
    ].join("\n");
  },

  /** 한 번의 탐색이 남기는 나무. */
  treeSplit: () => {
    const t = WALK_TREE;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const p = t.parent[v] as number;
      const kids = t.children[v] as number[];
      return [
        String(v),
        String(t.disc[v]),
        p === -1 ? "없음 (뿌리)" : String(p),
        kids.length === 0 ? "없음" : kids.join(" · "),
        set(t.subtree[v] as number[]),
      ];
    });
    const back = t.backEdges.map(([b, a]) => ed(b, a)).join(" · ");
    return [
      md(["정점", "disc", "부모", "나무 자식", "서브트리"], rows, [0, 1]),
      "",
      `나무 간선 ${t.treeEdges.length} 개와 되돌아가는 간선 ${t.backEdges.length} 개가 간선 ${WALK_EDGES.length} 개를 나눠 가집니다. 되돌아가는 간선은 ${back} 입니다.`,
    ].join("\n");
  },

  /** 가장 단순한 후보 — 나무 간선이면 다리다. */
  firstCandidate: () => {
    const t = WALK_TREE;
    const rows = t.treeEdges.map(([p, c, k]) => {
      const real = isBridgeByDeletion(WALK_N, WALK_EDGES, k);
      return [
        ed(p, c),
        "다리",
        real ? "다리" : "아니다",
        real ? "맞다" : "틀리다",
      ];
    });
    const wrong = rows.filter((r) => r[3] === "틀리다");
    const guess = candidateAnswer(WALK_N, WALK_EDGES);
    return [
      md(["나무 간선", "후보의 판정", "지워 본 판정", "후보"], rows),
      "",
      `나무 간선 ${rows.length} 개 가운데 후보가 틀린 것은 ${wrong.length} 개(${wrong.map((r) => r[0]).join(" · ")})입니다. 후보가 낸 답은 ${arr(guess)} 이고, 정본이 낸 답은 ${arr(WALK_ANSWER)} 입니다.`,
    ].join("\n");
  },

  /** 나무 간선마다 자식의 서브트리 밖으로 나가는 간선을 센다. */
  observeCross: () => {
    const t = WALK_TREE;
    const rows = t.treeEdges.map(([p, c, k]) => {
      const out = crossing(WALK_EDGES, t.subtree[c] as number[]);
      const real = isBridgeByDeletion(WALK_N, WALK_EDGES, k);
      return [
        ed(p, c),
        set(t.subtree[c] as number[]),
        out
          .map((x) => {
            const [a, b] = WALK_EDGES[x] as Edge;
            return ed(a, b);
          })
          .join(" · "),
        String(out.length),
        real ? "다리" : "아니다",
      ];
    });
    const one = rows.filter((r) => r[3] === "1");
    const many = rows.filter((r) => r[3] !== "1");
    return [
      md(
        [
          "나무 간선",
          "자식의 서브트리",
          "서브트리 밖으로 나가는 간선",
          "개수",
          "지워 본 판정",
        ],
        rows,
        [3],
      ),
      "",
      `나가는 간선이 1 개인 ${one.length} 줄은 ${one.every((r) => r[4] === "다리") ? "모두 다리이고" : "다리가 아닌 줄을 담고"}, 2 개 이상인 ${many.length} 줄은 ${many.every((r) => r[4] === "아니다") ? "모두 다리가 아닙니다" : "다리인 줄을 담습니다"}.`,
    ].join("\n");
  },

  /** 개수 대신 되돌아가는 간선이 어디까지 가는가를 수로. */
  candidateFix: () => {
    const t = WALK_TREE;
    const rows = t.treeEdges.map(([p, c, k]) => {
      const up = leavingBack(t, c).map(([, a]) => t.disc[a] as number);
      const top = up.length === 0 ? null : Math.min(...up);
      const reach = top !== null && top <= (t.disc[p] as number);
      const real = isBridgeByDeletion(WALK_N, WALK_EDGES, k);
      return [
        ed(p, c),
        top === null ? "없음" : String(top),
        String(t.disc[p]),
        yes(reach),
        real ? "떨어진다" : "붙어 있다",
      ];
    });
    const match = rows.filter(
      (r) => (r[3] === "예") === (r[4] === "붙어 있다"),
    ).length;
    return [
      md(
        [
          "나무 간선",
          "나가는 되돌아가는 간선이 이르는 가장 이른 disc",
          "부모의 disc",
          "부모 또는 그 위까지 감",
          "간선을 지운 실제 결과",
        ],
        rows,
        [2],
      ),
      "",
      `다섯 줄 가운데 「부모 또는 그 위까지 감」이 예인 줄은 붙어 있고 아니오인 줄은 떨어집니다 — 일치한 줄이 ${match} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build ─────────────── */

  /** 1단계 — 정점에 들어간 걸음들. */
  stageEnter: () => {
    const rows = WALK.steps
      .filter((s) => s.kind === "진입")
      .map((s) => [
        `T${tOf(WALK.steps, s)}`,
        String(s.v),
        s.w === null ? "바깥 반복" : `간선 ${s.edge} (${ed(s.w, s.v)})`,
        String(s.disc[s.v]),
        list(s.call),
        list(s.callE),
      ]);
    return md(
      [
        "걸음",
        "들어간 정점",
        "타고 온 간선",
        "disc = low",
        "들어간 뒤 호출 스택",
        "들어간 뒤 내려온 간선 칸",
      ],
      rows,
      [3],
    );
  },

  /** 2단계 — 이웃 자리 열둘이 세 갈래로 갈리는 모습. */
  stageNeighbors: () => {
    const reads = WALK.steps.filter((s) => s.came !== null);
    const rows = reads.map((s) => {
      const at = s.kind === "진입" ? (s.w as number) : s.v;
      const nb = s.kind === "진입" ? s.v : (s.w as number);
      const before =
        s.kind === "줄임"
          ? (s.lowFrom?.before as number)
          : (s.low[at] as number);
      const discCell = s.kind === "진입" ? "-" : String(s.disc[nb]);
      const branch =
        s.kind === "건너뜀"
          ? "건너뛴다"
          : s.kind === "진입"
            ? "내려간다"
            : "low 를 줄인다";
      const lowCell =
        s.kind === "줄임" && (s.low[at] as number) !== before
          ? `${before} → ${s.low[at]}`
          : `${before} 그대로`;
      return [
        `T${tOf(WALK.steps, s)}`,
        ed(at, nb),
        String(s.edge),
        String(s.came),
        discCell,
        branch,
        lowCell,
      ];
    });
    const c = WALK.counts;
    return [
      md(
        [
          "걸음",
          "이웃 자리",
          "그 자리의 간선 번호",
          "내려온 간선 번호",
          "이웃의 disc",
          "갈래",
          "지금 정점의 low",
        ],
        rows,
      ),
      "",
      `이웃 자리 ${c.reads} 개가 ${rows.length} 걸음에서 한 번씩 읽혔습니다. 내려온 간선이라 건너뛴 자리가 ${c.skip} 개, 내려간 자리가 ${c.tree} 개, low 를 줄이는 갈래로 간 자리가 ${c.back} 개이고 그중 값이 실제로 줄어든 것은 ${c.lowered} 개입니다.`,
    ].join("\n");
  },

  /** 3단계 — 뺀 정점의 low 를 부모에게 넘긴다. */
  stagePass: () => {
    const pops = WALK.steps.filter(
      (s) => s.kind === "복귀" || s.kind === "판정",
    );
    const rows = pops.map((s) => [
      `T${tOf(WALK.steps, s)}`,
      String(s.v),
      String(s.low[s.v]),
      s.parent === null ? "없음" : String(s.parent),
      s.parent === null ? "-" : `${s.lowFrom?.before} → ${s.low[s.parent]}`,
    ]);
    const changed = pops.filter(
      (s) => s.parent !== null && s.low[s.parent] !== s.lowFrom?.before,
    );
    return [
      md(["걸음", "뺀 정점", "그 정점의 low", "부모", "부모의 low"], rows, [2]),
      "",
      `값이 실제로 바뀐 걸음은 ${changed.length} 개(${changed.map((s) => `T${tOf(WALK.steps, s)}`).join(" · ")})입니다.`,
    ].join("\n");
  },

  /** 4단계 — 내려온 나무 간선을 판정한다. */
  stageJudge: () => {
    const judges = WALK.steps.filter(
      (s) => (s.kind === "복귀" || s.kind === "판정") && s.parent !== null,
    );
    const rows = judges.map((s) => [
      `T${tOf(WALK.steps, s)}`,
      ed(s.parent as number, s.v),
      String(s.judge?.lowC),
      String(s.judge?.discP),
      s.judge?.hit ? "참" : "거짓",
      s.judge?.hit ? "다리" : "-",
    ]);
    const root = WALK.counts.roots[0] as number;
    const rootEdges = WALK.counts.judged.filter((j) => j.p === root);
    return [
      md(
        [
          "걸음",
          "내려온 나무 간선",
          "low[자식]",
          "disc[부모]",
          "low[자식] > disc[부모]",
          "적은 것",
        ],
        rows,
        [2, 3],
      ),
      "",
      `나무 간선 ${rows.length} 개를 ${rows.length} 걸음에서 한 번씩 판정했고, 다리로 적은 것은 ${rows.filter((r) => r[4] === "참").length} 개입니다. 뿌리 ${root} 에서 내려간 나무 간선 ${rootEdges.length} 개(${rootEdges.map((j) => ed(j.p, j.c)).join(" · ")})도 같은 줄로 판정했습니다.`,
    ].join("\n");
  },

  /** 4단계 — 뿌리의 나무 간선도 같은 규칙으로 맞는가. */
  stageRoot: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 (V = 4)", RING_N, RING_EDGES],
      ["삼각형에 꼬리 하나", TAIL_N, TAIL_EDGES],
      ["별 (V = 4)", 4, star(4)],
      ["떨어진 두 나무", SPLIT_N, SPLIT_EDGES],
      ["겹친 간선 한 쌍", TWIN_N, TWIN_EDGES],
    ];
    const rows: string[][] = [];
    for (const [label, n, e] of cases) {
      const c = counted(n, e, false);
      for (const j of c.judged.filter((x) => c.roots.includes(x.p))) {
        const real = isBridgeByDeletion(n, e, j.edge);
        rows.push([
          label,
          ed(j.p, j.c),
          String(j.lowC),
          String(j.discP),
          j.hit ? "다리" : "아니다",
          real ? "다리" : "아니다",
        ]);
      }
    }
    const agree = rows.filter((r) => r[4] === r[5]).length;
    return [
      md(
        [
          "입력",
          "뿌리의 나무 간선",
          "low[자식]",
          "disc[뿌리]",
          "규칙의 판정",
          "지워 본 판정",
        ],
        rows,
        [2, 3],
      ),
      "",
      `뿌리에서 내려간 나무 간선 ${rows.length} 개 중 두 판정이 일치한 것은 ${agree} 개입니다.`,
    ].join("\n");
  },

  /** 4단계 — 규칙과 정의가 모양 아홉에서 같은 답을 내는가. */
  criterionCheck: () => {
    const rows = SHAPES.map(([label, n, e]) => [
      label,
      String(n),
      String(e.length),
      dots(ruleWith(n, e, lowByDefinition(n, e))),
      dots(byDeletion(n, e).found),
    ]);
    const agree = rows.filter((r) => r[3] === r[4]).length;
    return [
      md(
        ["입력", "V", "E", "규칙으로 낸 다리", "간선을 지워 본 다리"],
        rows,
        [1, 2],
      ),
      "",
      `아홉 줄 중 두 답이 일치한 줄은 ${agree} 줄입니다.`,
    ].join("\n");
  },

  /** 설계 선택 — 내려온 간선을 정점 번호로 건너뛰면. */
  designSkip: () => {
    const cases: [string, number, Edge[]][] = [
      ["겹친 간선 한 쌍", TWIN_N, TWIN_EDGES],
      ["겹친 간선 한 쌍에 꼬리", TWIN_TAIL_N, TWIN_TAIL_EDGES],
      ["겹친 간선 둘을 간선 하나가 이음", TWIN_CHAIN_N, TWIN_CHAIN_EDGES],
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 (V = 4)", RING_N, RING_EDGES],
    ];
    const twins = (e: Edge[]): number => {
      const seen = new Map<string, number>();
      for (const [u, v] of e) {
        const k = u < v ? ed(u, v) : ed(v, u);
        seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      return [...seen.values()].filter((x) => x > 1).length;
    };
    const rows = cases.map(([label, n, e]) => {
      const a = arr(bridgesInGraph(n, e));
      const b = arr(byVertex.bridgesInGraph(n, e));
      return [label, String(twins(e)), a, b, same(a, b)];
    });
    return [
      md(
        ["입력", "겹친 간선 쌍", "정본", "정점 번호로 건너뛴 판", "판정"],
        rows,
        [1],
      ),
      "",
      `다섯 입력 중 답이 갈린 것은 ${differ(rows)} 개입니다.`,
    ].join("\n");
  },

  /** 설계 선택 — 겹친 간선 한 쌍에서 두 판이 정점 1 의 두 자리를 어떻게 읽는가. */
  designSkipTrace: () => {
    const a = counted(TWIN_N, TWIN_EDGES, true);
    const b = counted(TWIN_N, TWIN_EDGES, true, "byVertex");
    const at = (c: Counts): Step[] =>
      c.steps.filter((s) => s.v === 1 && s.came !== null && s.kind !== "진입");
    const sa = at(a);
    const sb = at(b);
    const verb = (s: Step): string =>
      s.kind === "건너뜀"
        ? "건너뛴다"
        : `low[1] = min(${s.lowFrom?.before}, disc[${s.w}]) = ${s.low[1]}`;
    const rows = sa.map((s, i) => [
      `${i + 1}`,
      String(s.w),
      String(s.edge),
      verb(s),
      verb(sb[i] as Step),
    ]);
    const ja = a.judged[0] as Judged;
    const jb = b.judged[0] as Judged;
    const e01 = ed(0, 1);
    return [
      md(
        [
          "정점 1 의 이웃 자리",
          "이웃",
          "간선 번호",
          "간선 번호로 건너뛴 정본",
          "정점 번호로 건너뛴 판",
        ],
        rows,
      ),
      "",
      `정점 1 을 뺄 때 정본은 low[1] = ${ja.lowC}${과와(String(ja.lowC))} disc[0] = ${ja.discP}${을를(String(ja.discP))} 비교해 ${ja.hit ? `${e01}${을를(e01)} 다리로 적고` : "적지 않고"}, 바꾼 판은 low[1] = ${jb.lowC}${과와(String(jb.lowC))} disc[0] = ${jb.discP}${을를(String(jb.discP))} 비교해 ${jb.hit ? `${e01}${을를(e01)} 다리로 적습니다` : "적지 않습니다"}.`,
    ].join("\n");
  },

  /** 호출 스택을 배열로 드는 까닭 — 사슬에서 재귀 판과 나란히. */
  designRecursion: () => {
    const rows = [100, 1_000, 10_000].map((v) => {
      const e = chain(v);
      return [
        comma(v),
        `${comma(bridgesInGraph(v, e).length)} 개`,
        `${comma(recursive(v, e).length)} 개`,
      ];
    });
    const big = V_LIMIT;
    const bigEdges = chain(big);
    let deep: string;
    try {
      deep = `${comma(recursive(big, bigEdges).length)} 개`;
    } catch (err) {
      deep =
        err instanceof RangeError
          ? "호출 스택이 한계를 넘어 실행이 멈춘다"
          : "실행이 멈춘다";
    }
    rows.push([
      comma(big),
      `${comma(bridgesInGraph(big, bigEdges).length)} 개`,
      deep,
    ]);
    return [
      md(
        ["사슬의 정점 수", "배열로 든 판의 다리", "재귀로 적은 판의 다리"],
        rows,
        [0],
      ),
      "",
      `사슬에서는 호출 깊이가 정점 수와 같습니다. 정확히 몇 개에서 멈추는지는 런타임이 정하는 값이고, 규모의 상한 V = ${comma(V_LIMIT)} 은 이 실행에서 멈춘 쪽에 있습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** T1 — 준비 조각만 실행한 결과. */
  walkT1: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const blank = Array.from({ length: WALK_N }, () => -1);
    return [
      "T1 이 끝난 시점",
      ...pairs([
        ["to", c.to.map((a, v) => `${v}:${list(a)}`).join("  ")],
        ["via", c.via.map((a, v) => `${v}:${list(a)}`).join("  ")],
        ["disc", dl(blank)],
        ["low", dl(blank)],
        ["timer", "0"],
      ]).map((l) => `  ${l}`),
    ].join("\n");
  },

  /** T2 · T3 — 진입 조각. */
  walkT2T3: () => {
    const one = (t: number, head: string): string[] => {
      const s = stepAt(WALK.steps, t);
      return [
        `T${t} — ${head}`,
        ...pairs([
          ["disc", dl(s.disc)],
          ["low", dl(s.low)],
          ["stackV", list(s.call)],
          ["stackI", list(s.callI)],
          ["stackE", list(s.callE)],
          ["timer", String(s.timer)],
        ]).map((l) => `  ${l}`),
      ];
    };
    const s2 = stepAt(WALK.steps, 2);
    const s3 = stepAt(WALK.steps, 3);
    const e3 = ed(s3.w as number, s3.v);
    return [
      ...one(2, `바깥 반복이 정점 ${s2.v} 에 들어간다`),
      ...one(
        3,
        `간선 ${s3.edge} 인 ${e3}${을를(e3)} 읽고 정점 ${s3.v} 로 내려간다`,
      ),
    ].join("\n");
  },

  /** T4 · T9 · T15 — 세 갈래 조각. */
  walkT4T9T15: () => {
    const one = (t: number): string[] => {
      const s = stepAt(WALK.steps, t);
      const w = s.w as number;
      const rows: [string, string][] =
        s.kind === "건너뜀"
          ? [
              [
                "판정",
                `읽은 간선 ${s.edge}${이가(String(s.edge))} stackE 맨 위 ${s.came}${과와(String(s.came))} 같다`,
              ],
              ["계산", `건너뛴다 — low[${s.v}] 는 ${s.low[s.v]} 그대로`],
            ]
          : [
              [
                "판정",
                `읽은 간선 ${s.edge}${이가(String(s.edge))} stackE 맨 위 ${s.came}${과와(String(s.came))} 다르고, disc[${w}] = ${s.disc[w]}${josa(String(s.disc[w]), "이라", "라")} -1 이 아니다`,
              ],
              [
                "계산",
                `low[${s.v}] = min(${s.lowFrom?.before}, disc[${w}] = ${s.disc[w]}) = ${s.low[s.v]}`,
              ],
            ];
      return [
        `T${t} — 정점 ${s.v} 에서 이웃 ${w}${을를(String(w))} 읽는다`,
        ...pairs([...rows, ["low", dl(s.low)], ["stackV", list(s.call)]]).map(
          (l) => `  ${l}`,
        ),
      ];
    };
    return [...one(4), ...one(9), ...one(15)].join("\n");
  },

  /** 짚고 가기 — 내려온 간선을 건너뛰지 않으면. */
  pauseNoSkip: () => {
    const m = counted(WALK_N, WALK_EDGES, false, "noSkip");
    const rowsA = WALK.counts.judged.map((j) => {
      const mj = m.judged.find((x) => x.p === j.p && x.c === j.c) as Judged;
      return [
        ed(j.p, j.c),
        String(j.discP),
        String(j.lowC),
        String(mj.lowC),
        mj.hit ? "참" : "거짓",
      ];
    });
    const rowsB = mutantRows(noSkip, SHAPES);
    return [
      md(
        [
          "나무 간선",
          "disc[부모]",
          "정본의 low[자식]",
          "건너뛰기를 뺀 판의 low[자식]",
          "뺀 판의 low[자식] > disc[부모]",
        ],
        rowsA,
        [1, 2, 3],
      ),
      "",
      "건너뛰기를 뺀 판을 아홉 입력에 실행하면 이렇습니다.",
      "",
      md(["입력", "정본", "건너뛰기를 뺀 판", "판정"], rowsB),
      "",
      `아홉 입력 중 답이 갈린 것은 ${differ(rowsB)} 개이고, 뺀 판이 다리를 하나라도 낸 입력은 ${rowsB.filter((r) => r[2] !== "[]").length} 개입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 되돌아가는 간선에서 low[w] 를 읽는 판. */
  pauseReadLow: () => {
    const shapes: [string, number, Edge[]][] = [
      ...SHAPES,
      ["격자 3×3", GRID3.n, GRID3.e],
    ];
    const rows = mutantRows(
      readLow,
      shapes,
      (n, e) => counted(n, e, false).back,
    );
    const randoms = randomGraphs(500, 24, 20260907);
    let off = 0;
    let lowOff = 0;
    for (const g of randoms) {
      if (
        arr(bridgesInGraph(g.n, g.e)) !== arr(readLow.bridgesInGraph(g.n, g.e))
      ) {
        off++;
      }
      const a = counted(g.n, g.e, false);
      const b = counted(g.n, g.e, false, "readLow");
      if (list(a.low) !== list(b.low)) lowOff++;
    }
    const passed = rows.filter((r) => r[1] === "0").length;
    return [
      md(
        ["입력", "그 줄을 지나간 횟수", "정본", "low 를 읽는 판", "판정"],
        rows,
        [1],
      ),
      "",
      `모양 ${rows.length} 개 가운데 답이 갈린 것은 ${differ(rows)} 개이고, 그 줄까지 가지도 않은 입력은 ${passed} 개입니다. 정점 24 개 이하의 무작위 그래프 ${randoms.length} 개(시드 20260907)에서도 답이 갈린 것은 ${off} 개인데, 끝난 뒤의 low 배열이 정본과 다른 것은 ${lowOff} 개입니다.`,
    ].join("\n");
  },

  /** T12 · T13 · T20 — 빼면서 판정하는 조각. */
  walkT12T13T20: () => {
    const one = (t: number): string[] => {
      const s = stepAt(WALK.steps, t);
      if (s.parent === null) {
        return [
          `T${t} — 정점 ${s.v}${을를(String(s.v))} 뺀다`,
          ...pairs([
            ["넘기기", "stackE 에서 뺀 값이 -1 이라 넘기지 않는다"],
            ["found", arr(s.found)],
            ["stackV", list(s.call)],
          ]).map((l) => `  ${l}`),
        ];
      }
      const p = s.parent;
      return [
        `T${t} — 정점 ${s.v}${을를(String(s.v))} 뺀다`,
        ...pairs([
          [
            "넘기기",
            `low[${p}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[p]}`,
          ],
          [
            "판정",
            `low[${s.v}] = ${s.judge?.lowC} > disc[${p}] = ${s.judge?.discP}${이가(String(s.judge?.discP))} ${s.judge?.hit ? "참" : "거짓"}`,
          ],
          ["found", arr(s.found)],
          ["stackV", list(s.call)],
        ]).map((l) => `  ${l}`),
      ];
    };
    return [...one(12), ...one(13), ...one(20)].join("\n");
  },

  /** 짚고 가기 — 단절점의 등호를 넣으면. */
  pauseEqual: () => {
    const m = counted(WALK_N, WALK_EDGES, false, "withEqual");
    const rowsA = WALK.counts.judged.map((j) => {
      const mj = m.judged.find((x) => x.p === j.p && x.c === j.c) as Judged;
      return [
        ed(j.p, j.c),
        String(j.lowC),
        String(j.discP),
        j.hit ? "참" : "거짓",
        mj.hit ? "참" : "거짓",
        isBridgeByDeletion(WALK_N, WALK_EDGES, j.edge) ? "다리" : "아니다",
      ];
    });
    const rowsB = mutantRows(
      withEqual,
      SHAPES,
      (n, e) => counted(n, e, false).judged.length,
    );
    return [
      md(
        [
          "나무 간선",
          "low[자식]",
          "disc[부모]",
          "> 로",
          "≥ 로",
          "지워 본 판정",
        ],
        rowsA,
        [1, 2],
      ),
      "",
      "등호를 넣은 판을 아홉 입력에 실행하면 이렇습니다.",
      "",
      md(
        ["입력", "그 줄을 지나간 횟수", "정본", "등호를 넣은 판", "판정"],
        rowsB,
        [1],
      ),
      "",
      `아홉 입력 중 답이 갈린 것은 ${differ(rowsB)} 개입니다.`,
    ].join("\n");
  },

  /** deep.walk — 스물한 걸음 전부. */
  walkTrace: () => {
    const { steps, counts } = WALK;
    const blank = Array.from({ length: WALK_N }, () => -1);
    const rows: string[][] = [
      [
        "T1",
        "준비",
        "-",
        "①②",
        dl(blank),
        dl(blank),
        "[]",
        "없음",
        "이웃 목록과 정점마다의 칸을 만든다",
      ],
    ];
    for (const s of steps) {
      rows.push([
        `T${tOf(steps, s)}`,
        s.kind,
        site(s),
        s.label,
        dl(s.disc),
        dl(s.low),
        list(s.call),
        dots(s.found),
        stepNote(s),
      ]);
    }
    const last = steps.at(-1) as Step;
    rows.push([
      `T${steps.length + 2}`,
      "반환",
      "-",
      "⑨",
      dl(last.disc),
      dl(last.low),
      "[]",
      dots(counts.found),
      "다리 목록을 차례대로 세워 돌려준다",
    ]);
    return [
      md(
        [
          "걸음",
          "하는 일",
          "정점 또는 간선",
          "라벨",
          "disc",
          "low",
          "호출 스택",
          "다리",
          "이 걸음이 한 일",
        ],
        rows,
      ),
      "",
      `이웃 자리 읽기 ${counts.reads} 번 · 진입 ${counts.enters} 번 · 호출 스택에서 빼기 ${counts.pops} 번이고, 판정한 나무 간선 ${counts.judged.length} 개 중 다리는 ${counts.found.length} 개입니다. 호출 스택은 가장 깊을 때 ${counts.peakCall} 칸이었습니다.`,
    ].join("\n");
  },

  /** deep.walk — 아홉 갈래가 두 입력에서 각각 몇 번 실행됐는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES);
    const b = branchCounts(LINK_N, LINK_EDGES);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      String(a[i]),
      String(b[i]),
    ]);
    return md(
      ["라벨", "하는 일", "전개 입력", "삼각형 둘을 간선 하나가 이음"],
      rows,
      [2, 3],
    );
  },

  /** deep.walk.final — 전체 코드를 실행한 결과. */
  finalRuns: () => {
    const cases: [number, Edge[]][] = [
      [WALK_N, WALK_EDGES],
      [RING_N, RING_EDGES],
      [LINK_N, LINK_EDGES],
      [TWIN_N, TWIN_EDGES],
      [2, [[1, 0]]],
      [1, []],
    ];
    const rows = cases.map(([n, e]) => [
      `\`bridgesInGraph(${n}, ${JSON.stringify(e)})\``,
      arr(bridgesInGraph(n, e)),
    ]);
    return md(["호출", "반환값"], rows);
  },

  /* ─────────────── related ─────────────── */

  /** 간선 연결도 — 한 덩어리인 모양에서 다리가 있는가와 연결도 1 이 같은 말인가. */
  relatedLambda: () => {
    const g3 = grid(3);
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 (V = 4)", RING_N, RING_EDGES],
      ["완전 그래프 (V = 4)", 4, complete(4)],
      ["별 (V = 4)", 4, star(4)],
      ["겹친 간선 한 쌍", TWIN_N, TWIN_EDGES],
      ["격자 3×3", g3.n, g3.e],
      ["떨어진 두 나무", SPLIT_N, SPLIT_EDGES],
    ];
    const rows = cases.map(([label, n, e]) => {
      const parts = components(n, e);
      const b = bridgesInGraph(n, e).length;
      const lam = edgeConnectivity(n, e, 4);
      const verdict =
        parts > 1 ? "보지 않는다" : b > 0 === (lam === 1) ? "맞다" : "틀리다";
      return [
        label,
        String(n),
        String(e.length),
        String(parts),
        String(b),
        lam > 4 ? "5 이상" : String(lam),
        verdict,
      ];
    });
    const one = rows.filter((r) => r[6] !== "보지 않는다");
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "연결 성분",
          "다리",
          "간선 연결도",
          "「다리가 있다 ⟺ 연결도 1」",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `한 덩어리인 모양 ${one.length} 개 가운데 두 진술이 어긋난 것은 ${one.filter((r) => r[6] === "틀리다").length} 개입니다. 떨어진 두 나무는 이미 갈라져 있어 연결도가 ${rows.at(-1)?.[5]}${josa(String(rows.at(-1)?.[5]), "이라", "라")} 대조에서 뺐습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** low 정의의 세 항을 전개 입력에서 검산한다. */
  mathCheck: () => {
    const t = WALK_TREE;
    const c = WALK.counts;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const own = t.disc[v] as number;
      const up = t.backEdges
        .filter(([b]) => b === v)
        .map(([, a]) => t.disc[a] as number);
      const kids = (t.children[v] as number[]).map((x) => c.low[x] as number);
      const min = Math.min(own, ...up, ...kids);
      return [
        String(v),
        String(own),
        up.length === 0 ? "없음" : up.join(" · "),
        kids.length === 0 ? "없음" : kids.join(" · "),
        String(min),
        String(c.low[v]),
        min === c.low[v] ? "일치" : "어긋남",
      ];
    });
    const ok = rows.filter((r) => r[6] === "일치").length;
    return [
      md(
        [
          "정점 v",
          "첫째 항 disc[v]",
          "둘째 항 disc[x]",
          "셋째 항 low[c]",
          "세 항의 최솟값",
          "실행이 낸 low[v]",
          "대조",
        ],
        rows,
        [0, 1, 4, 5],
      ),
      "",
      `여섯 정점 중 ${ok} 정점에서 일치합니다.`,
    ].join("\n");
  },

  /** 항등식 B = C − k 와 상한 B ≤ V − k. */
  mathBound: () => {
    const t4 = triangles(4);
    const g4 = grid(4);
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 (V = 4)", RING_N, RING_EDGES],
      ["삼각형에 꼬리 하나", TAIL_N, TAIL_EDGES],
      ["삼각형 둘을 간선 하나가 이음", LINK_N, LINK_EDGES],
      ["떨어진 두 나무", SPLIT_N, SPLIT_EDGES],
      ["겹친 간선 한 쌍에 꼬리", TWIN_TAIL_N, TWIN_TAIL_EDGES],
      ["사슬 (V = 64)", 64, chain(64)],
      ["사이클 (V = 64)", 64, ring(64)],
      ["삼각형 넷을 이은 그래프", t4.n, t4.e],
      ["격자 4×4", g4.n, g4.e],
    ];
    const rows = cases.map(([label, n, e]) => {
      const b = bridgesInGraph(n, e).length;
      const k = components(n, e);
      const cc = piecesWithoutBridges(n, e);
      return [
        label,
        String(n),
        String(e.length),
        String(b),
        String(k),
        String(cc),
        String(cc - k),
        String(n - k),
        b === cc - k ? "성립" : "어긋남",
        b <= n - k ? "지킨다" : "넘는다",
      ];
    });
    const eq = rows.filter((r) => r[8] === "성립").length;
    const keep = rows.filter((r) => r[9] === "지킨다").length;
    const tight = rows.filter((r) => r[3] === r[7]).map((r) => r[0]);
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "다리 B",
          "성분 k",
          "조각 C",
          "C − k",
          "V − k",
          "B = C − k",
          "B ≤ V − k",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `열 줄 중 항등식이 성립한 줄이 ${eq} 줄, 상한을 지킨 줄이 ${keep} 줄이고, 상한과 같은 값이 나온 것은 ${tight.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** 비용의 두 등식을 규모에 넣어 실측과 나란히. */
  mathScale: () => {
    const rows = [1_000, 10_000, 100_000].map((v) => {
      const e = chain(v);
      const c = counted(v, e, false);
      return [
        comma(v),
        comma(e.length),
        comma(c.reads),
        comma(2 * e.length),
        comma(c.enters + c.pops),
        comma(2 * v),
        comma(c.found.length),
        comma(v - 1),
      ];
    });
    const ok = rows.filter(
      (r) => r[2] === r[3] && r[4] === r[5] && r[6] === r[7],
    ).length;
    return [
      md(
        [
          "사슬의 정점 V",
          "간선 E",
          "이웃 자리 읽기",
          "2E",
          "정점 만짐",
          "2V",
          "다리 B",
          "V − 1",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `세 줄 중 ${ok} 줄에서 실측 열이 그 오른쪽 식의 값과 같습니다.`,
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** 판정한 걸음마다 「서브트리와 나머지를 잇는 간선이 하나뿐인가」를 따로 세어 맞댄다. */
  invariantCross: () => {
    const t4 = triangles(4);
    const cases: [string, number, Edge[]][] = [
      ...SHAPES,
      ["격자 3×3", GRID3.n, GRID3.e],
      ["삼각형 넷을 이은 그래프", t4.n, t4.e],
    ];
    let all = 0;
    let bad = 0;
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      const t = tree(n, e);
      let only = 0;
      let off = 0;
      for (const j of c.judged) {
        const one = crossing(e, t.subtree[j.c] as number[]).length === 1;
        if (one) only++;
        if (one !== j.hit) off++;
      }
      all += c.judged.length;
      bad += off;
      return [
        label,
        String(c.judged.length),
        String(c.marks),
        String(only),
        String(off),
      ];
    });
    return [
      md(
        [
          "입력",
          "판정한 걸음",
          "다리로 적은 걸음",
          "잇는 간선이 하나뿐인 걸음",
          "어긋난 걸음",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `판정한 걸음 ${all} 개 가운데 어긋난 걸음은 ${bad} 개입니다.`,
    ].join("\n");
  },

  /** 경계에 놓인 입력. */
  invariantEdges: () => {
    const cases: [string, number, Edge[]][] = [
      ["정점 하나, 간선 없음", 1, []],
      ["정점 넷, 간선 없음", 4, []],
      ["간선 하나", 2, [[0, 1]]],
      [
        "두 끝이 같은 간선만",
        3,
        [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      ],
      [
        "두 끝이 같은 간선이 섞임",
        3,
        [
          [0, 0],
          [0, 1],
          [1, 2],
        ],
      ],
      ["겹친 간선 한 쌍", TWIN_N, TWIN_EDGES],
      ["떨어진 두 나무", SPLIT_N, SPLIT_EDGES],
      ["사이클 (V = 8)", 8, ring(8)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      return [
        label,
        String(n),
        String(e.length),
        dots(c.found),
        String(c.reads),
        String(c.enters + c.pops),
        String(c.peakCall),
        String(c.roots.length),
        dots(byDeletion(n, e).found),
      ];
    });
    const agree = rows.filter((r) => r[3] === r[8]).length;
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "다리",
          "이웃 자리 읽기",
          "정점 만짐",
          "호출 스택 최대",
          "탐색 시작 횟수",
          "간선을 지워 본 다리",
        ],
        rows,
        [1, 2, 4, 5, 6, 7],
      ),
      "",
      `여덟 입력 중 두 다리 열이 일치한 입력은 ${agree} 개입니다.`,
    ].join("\n");
  },

  /** 불변식을 지키던 줄 — 자식의 disc 를 넘기는 판. */
  mutantPass: () => {
    const shapes: [string, number, Edge[]][] = [
      ...SHAPES,
      ["격자 3×3", GRID3.n, GRID3.e],
    ];
    const rows = mutantRows(
      passDisc,
      shapes,
      (n, e) => counted(n, e, false).judged.length,
    );
    return [
      md(
        [
          "입력",
          "그 줄을 지나간 횟수",
          "정본",
          "자식의 disc 를 넘기는 판",
          "판정",
        ],
        rows,
        [1],
      ),
      "",
      `열 입력 중 답이 갈린 것은 ${differ(rows)} 개입니다.`,
    ].join("\n");
  },

  /** 사이클 하나에서 뒤 문장이 깨지는 걸음. */
  mutantPassTrace: () => {
    const a = counted(RING_N, RING_EDGES, true);
    const b = counted(RING_N, RING_EDGES, true, "passDisc");
    const def = lowByDefinition(RING_N, RING_EDGES);
    const pops = (c: Counts): Step[] =>
      c.steps.filter((s) => s.kind === "복귀" || s.kind === "판정");
    const pa = pops(a);
    const pb = pops(b);
    const cell = (s: Step): string =>
      s.parent === null
        ? "부모 없음"
        : `low[${s.v}] = ${s.low[s.v]} · ${s.judge?.hit ? `${ed(s.parent, s.v)} 다리` : "적지 않음"}`;
    const rows = pa.map((s, i) => [
      `정점 ${s.v}`,
      String(def[s.v]),
      cell(s),
      cell(pb[i] as Step),
    ]);
    return [
      md(
        ["뺀 정점", "정의로 계산한 low", "정본", "자식의 disc 를 넘기는 판"],
        rows,
        [1],
      ),
      "",
      `정본의 답은 ${arr(a.found)}, 바꾼 판의 답은 ${arr(b.found)} 입니다.`,
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  /** 전개 입력의 걸음마다 읽은 이웃 자리와 만진 정점. */
  perfCount: () => {
    const { steps, counts } = WALK;
    let reads = 0;
    let touch = 0;
    const rows = steps.map((s) => {
      const r = s.came !== null ? 1 : 0;
      const tch = s.kind === "건너뜀" || s.kind === "줄임" ? 0 : 1;
      reads += r;
      touch += tch;
      return [
        `T${tOf(steps, s)}`,
        s.kind,
        site(s),
        String(r),
        String(reads),
        String(tch),
        String(touch),
      ];
    });
    if (reads !== counts.reads || touch !== counts.enters + counts.pops) {
      throw new Error("걸음 표의 누적이 사본의 계수와 다르다");
    }
    return [
      md(
        [
          "걸음",
          "하는 일",
          "정점 또는 간선",
          "읽은 자리",
          "읽기 누적",
          "만진 정점",
          "만짐 누적",
        ],
        rows,
        [3, 4, 5, 6],
      ),
      "",
      `이웃 목록을 만들 때 간선 ${counts.builds} 개를 한 번씩 읽고, 순회하며 읽은 이웃 자리는 ${counts.reads} 개로 2E = ${2 * WALK_EDGES.length} 와 같습니다. 진입 ${counts.enters} 번과 빼기 ${counts.pops} 번을 더한 정점 만짐은 ${counts.enters + counts.pops} 번이고 2V 는 ${2 * WALK_N} 입니다.`,
    ].join("\n");
  },

  /** 항목마다 식과 두 규모의 값. */
  perfTotal: () => {
    const sortBound = (b: number): number =>
      b <= 1 ? 0 : b * Math.ceil(Math.log2(b));
    const col = (n: number, e: Edge[]): number[] => {
      const c = counted(n, e, false);
      return [
        c.builds,
        2 * e.length,
        2 * n,
        c.reads,
        c.enters + c.pops,
        sortBound(c.found.length),
      ];
    };
    const big = V_LIMIT;
    const a = col(WALK_N, WALK_EDGES);
    const b = col(big, chain(big));
    const names: [string, string][] = [
      ["간선 목록 읽기", "E"],
      ["이웃 자리 만들기", "2E"],
      ["disc · low 칸 만들기", "2V"],
      ["이웃 자리 읽기", "2E"],
      ["정점 만짐", "2V"],
      ["다리 정렬의 비교 (상한)", "B⌈log₂ B⌉"],
    ];
    const rows = names.map(([what, f], i) => [
      what,
      f,
      comma(a[i] as number),
      comma(b[i] as number),
    ]);
    const sa = a.reduce((x, y) => x + y, 0);
    const sb = b.reduce((x, y) => x + y, 0);
    const byFormula = (n: number, e: number, bb: number): number =>
      5 * e + 4 * n + sortBound(bb);
    const fa = byFormula(WALK_N, WALK_EDGES.length, WALK_ANSWER.length);
    const fb = byFormula(big, big - 1, big - 1);
    rows.push(["합", "5E + 4V + B⌈log₂ B⌉", comma(sa), comma(sb)]);
    const w = counted(WALK_N, WALK_EDGES, false);
    const cells = 4 * WALK_N + 4 * WALK_EDGES.length + 3 * w.peakCall;
    return [
      md(["항목", "식", "전개 입력", `사슬 (V = ${comma(big)})`], rows, [2, 3]),
      "",
      `두 열의 합은 식 5E + 4V + B⌈log₂ B⌉ 에 넣은 값 ${comma(fa)} · ${comma(fb)} 과 같습니다. 메모리를 같은 칸 단위로 세면 4V + 4E + 3D 이고, 전개 입력에서는 호출 스택 최대 D = ${w.peakCall}${josa(String(w.peakCall), "이라", "라")} ${cells} 칸입니다.`,
    ].join("\n");
  },

  /** 모양을 바꿔 가며 두 등식이 그대로인가. */
  perfObserved: () => {
    const g = grid(32);
    const t = triangles(341);
    const cases: [string, number, Edge[]][] = [
      ["사슬 (V = 1,024)", 1024, chain(1024)],
      ["사이클 (V = 1,024)", 1024, ring(1024)],
      ["별 (V = 1,024)", 1024, star(1024)],
      ["격자 32×32", g.n, g.e],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["삼각형 341 개를 이은 그래프", t.n, t.e],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      return [
        label,
        comma(n),
        comma(e.length),
        comma(c.reads),
        comma(2 * e.length),
        comma(c.enters + c.pops),
        comma(2 * n),
        comma(c.peakCall),
        comma(c.found.length),
      ];
    });
    const r1 = rows.filter((r) => r[3] === r[4]).length;
    const r2 = rows.filter((r) => r[5] === r[6]).length;
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "이웃 자리 읽기",
          "2E",
          "정점 만짐",
          "2V",
          "호출 스택 최대",
          "다리",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "",
      `여섯 줄 중 읽기가 2E 와 같은 줄이 ${r1} 줄, 정점 만짐이 2V 와 같은 줄이 ${r2} 줄입니다.`,
    ].join("\n");
  },

  /** 정점 수를 512 로 두고 모양만 바꾼다. */
  worstShape: () => {
    const V = 512;
    const rev = chain(V).reverse();
    const t = triangles(170);
    const cases: [string, number, Edge[]][] = [
      ["간선 없음", V, []],
      ["사슬", V, chain(V)],
      ["사슬을 간선 목록에 거꾸로 적은 것", V, rev],
      ["사이클", V, ring(V)],
      ["별 — 정점 하나에서 나머지 전부로", V, star(V)],
      ["삼각형 170 개를 이은 것 + 홀로 있는 정점 둘", V, t.e],
      ["완전 그래프", V, complete(V)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      return [
        label,
        comma(e.length),
        comma(c.reads),
        comma(c.enters + c.pops),
        comma(c.peakCall),
        comma(c.found.length),
      ];
    });
    const touches = new Set(rows.map((r) => r[3]));
    return [
      md(
        [
          `모양 (V = ${V})`,
          "간선 E",
          "이웃 자리 읽기",
          "정점 만짐",
          "호출 스택 최대",
          "다리",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `일곱 모양의 정점 만짐은 ${touches.size === 1 ? `모두 ${[...touches][0]} 입니다` : "서로 다릅니다"}.`,
    ].join("\n");
  },

  /** 사슬의 규모를 네 배씩 키운다. */
  worstGrowth: () => {
    const sizes = [64, 256, 1024, 4096];
    let prev: [number, number] | null = null;
    let eq = 0;
    const rows = sizes.map((v) => {
      const c = counted(v, chain(v), false);
      const cost = c.reads + c.enters + c.pops;
      if (cost === 4 * v - 2) eq++;
      const row = [
        comma(v),
        comma(cost),
        prev === null ? "-" : (cost / prev[0]).toFixed(2),
        comma(c.peakCall),
        prev === null ? "-" : (c.peakCall / prev[1]).toFixed(2),
        comma(c.found.length),
      ];
      prev = [cost, c.peakCall];
      return row;
    });
    return [
      md(
        [
          "사슬의 정점 V",
          "읽기 + 만짐",
          "직전 줄의 몇 배",
          "호출 스택 최대",
          "직전 줄의 몇 배",
          "다리",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `네 줄 중 읽기 + 만짐이 4V − 2 와 같은 줄은 ${eq} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 간선 3−1 을 빼면 두 판정이 어떻게 바뀌는가. */
  selfcheckNoBack: () => {
    const cut = WALK_EDGES.filter(([u, v]) => !(u === 3 && v === 1));
    const a = counted(WALK_N, WALK_EDGES, false);
    const b = counted(WALK_N, cut, false);
    const rows = [
      [2, 3],
      [1, 2],
    ].map(([p, c]) => {
      const ja = a.judged.find((j) => j.p === p && j.c === c) as Judged;
      const jb = b.judged.find((j) => j.p === p && j.c === c) as Judged;
      return [
        ed(p as number, c as number),
        String(ja.discP),
        `${ja.lowC} · ${ja.hit ? "참" : "거짓"}`,
        `${jb.lowC} · ${jb.hit ? "참" : "거짓"}`,
      ];
    });
    return [
      md(
        [
          "나무 간선",
          "disc[부모]",
          "간선 3−1 이 있을 때 low[자식] · 판정",
          "간선 3−1 을 뺐을 때 low[자식] · 판정",
        ],
        rows,
        [1],
      ),
      "",
      `간선 3−1 을 뺀 그래프의 답은 ${arr(b.found)} 이고, 간선 ${cut.length} 개 가운데 다리가 ${b.found.length} 개입니다.`,
    ].join("\n");
  },
};
