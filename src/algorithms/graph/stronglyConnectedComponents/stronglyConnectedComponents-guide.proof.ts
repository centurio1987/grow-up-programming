/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 몇 번 셌는지와 걸음마다의 상태를 내보내지 않으므로, 세는
 * 자리만 덧붙인 사본(`counted`)이 아니면 걸음 표를 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 * 사본에는 변이 셋을 켜는 스위치도 있다(짚고 가기 · 불변식 절의 걸음 표). 그 스위치가 낸 답이
 * `loadMutant` 가 정본 소스에서 만든 변이의 답과 같은지도 같은 자리에서 확인한다.
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
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { stronglyConnectedComponents } from "./stronglyConnectedComponents-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 일곱.
 *
 * 여덟 갈래를 한 입력에서 전부 실행한다. `2 → 0` 이 「스택에 남아 있는 정점으로 가는」 갈래를
 * 내고, `5 → 3` 이 「이미 끊겨 나간 정점이라 무시하는」 갈래를 낸다. 바깥 반복이 두 번 실행되도록
 * 정점 5 를 어디서도 가리키지 않는 자리에 두었다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 3],
  [5, 3],
];

/** 강한 연결 요소 하나가 먼저 끊긴 뒤 그 안으로 들어가는 간선이 있는 그래프. */
export const CROSS_N = 4;
export const CROSS_EDGES: Edge[] = [
  [0, 1],
  [1, 0],
  [2, 3],
  [3, 0],
];

/** 되돌아가는 간선이 하나도 없는 그래프. 모든 정점이 혼자 강한 연결 요소다. */
export const LINE_N = 4;
export const LINE_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
];

/** 사이클 하나에 가지가 둘 붙은 그래프. */
export const BRANCH_N = 5;
export const BRANCH_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 2],
  [3, 4],
];

/** 되돌아가는 간선이 하나 있지만 그 위 정점은 같은 강한 연결 요소가 아닌 그래프. */
export const TRAP_N = 3;
export const TRAP_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 1],
];

/** 완전 방향 그래프 — 정점 쌍마다 양쪽으로 간선이 있다. */
export function complete(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < v; u++) {
    for (let x = 0; x < v; x++) if (u !== x) edges.push([u, x]);
  }
  return edges;
}

/** 사슬 `0 → 1 → … → v−1`. 되돌아가는 간선이 없어 강한 연결 요소가 `v` 개다. */
export function line(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1]);
  return edges;
}

/** 사이클 `0 → 1 → … → v−1 → 0`. 전체가 강한 연결 요소 하나다. */
export function cycle(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) edges.push([i, (i + 1) % v]);
  return edges;
}

/** 크기 `m` 인 사이클 `k` 개를 한 줄로 이은 그래프. 강한 연결 요소가 `k` 개다. */
export function chainOfCycles(k: number, m: number): { n: number; e: Edge[] } {
  const e: Edge[] = [];
  for (let c = 0; c < k; c++) {
    const base = c * m;
    if (m === 1) e.push([base, base]);
    else for (let i = 0; i < m; i++) e.push([base + i, base + ((i + 1) % m)]);
    if (c + 1 < k) e.push([base + m - 1, base + m]);
  }
  return { n: k * m, e };
}

/**
 * 무작위 희소 그래프. 생성식을 시드로 고정한다.
 *
 * **곱셈 하나짜리 생성식을 쓰지 않는다.** `seed = (seed * a + c) & 0x7fffffff` 는 아래
 * 비트의 주기가 짧아서, 정점 수처럼 2 의 거듭제곱으로 나눈 나머지를 뽑으면 몇십 걸음 만에
 * 같은 간선이 되풀이된다. 그래서 비트를 섞는 생성식으로 둔다.
 */
export function randomSparse(v: number, m: number, seed0: number): Edge[] {
  let seed = seed0 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return (seed >>> 0) % v;
  };
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++) edges.push([next(), next()]);
  return edges;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[[0, 1, 2], [3, 4], [5]]` 꼴 — 본문 표기와 같다. */
export const show = (gs: number[][]): string =>
  `[${gs.map((g) => `[${g.join(", ")}]`).join(", ")}]`;

/** `[0, 1, 2]` 꼴. */
export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

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
  const w = Math.max(
    ...rows.filter(([, b]) => b !== "").map(([a]) => width(a)),
  );
  return rows.map(([a, b]) => (b === "" ? a : `${pad(a, w)}  ${b}`));
}

/** 발견 순서 목록 — 아직 안 본 정점은 `-`. */
const dl = (xs: readonly number[]): string =>
  list(xs.map((d) => (d < 0 ? "-" : String(d))));

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 사본에 켤 수 있는 변이 — 짚고 가기 · 불변식 절이 걸음 표를 낼 때 쓴다. */
export type Variant = "noOnStack" | "parentDisc" | "noFlagDown" | "backLow";

export type StepKind = "진입" | "줄임" | "무시" | "복귀" | "뿌리";

/** 간선 종류 — 깊이 우선 탐색이 간선을 가르는 넷. */
export type EdgeKindKo = "나무" | "되돌아감" | "앞으로 감" | "가로지름";

/** 걸음 하나의 기록. `kind` 가 이 걸음이 실행한 갈래다. */
export interface Step {
  kind: StepKind;
  label: string;
  /** 진입이면 들어간 정점, 간선을 읽었으면 꼬리, 끝냈으면 끝낸 정점. */
  v: number;
  /** 진입이면 부모(바깥 반복이면 `null`), 간선을 읽었으면 머리. */
  w: number | null;
  /** 이 걸음이 읽은 간선의 번호(`edges` 의 자리). 없으면 `null`. */
  edge: number | null;
  /** 끝낸 걸음이면 부모. */
  parent: number | null;
  /** 이 걸음에서 값이 바뀐 정점과 바뀌기 전 `low`. */
  lowFrom: { vertex: number; before: number } | null;
  /** 뿌리 걸음에서 끊은 정점(끊은 차례). */
  cut: number[];
  disc: number[];
  low: number[];
  onStack: boolean[];
  stack: number[];
  call: number[];
  groups: number[][];
  timer: number;
  reads: number;
  /** 지금까지 가른 간선 종류(간선 번호 → 종류). */
  kinds: (EdgeKindKo | null)[];
}

export interface Counts {
  groups: number[][];
  disc: number[];
  low: number[];
  steps: Step[];
  parent: (number | null)[];
  children: number[][];
  roots: number[];
  depth: number[];
  kinds: (EdgeKindKo | null)[];
  /** 이웃 목록을 만들며 읽은 간선. */
  builds: number;
  /** 순회하며 읽은 간선. */
  reads: number;
  enters: number;
  pops: number;
  passes: number;
  lifts: number;
  tree: number;
  back: number;
  skip: number;
  cuts: number;
  peakStack: number;
  peakCall: number;
  /** 정렬이 두 값을 비교한 횟수 — 강한 연결 요소 안 정렬과 사이 정렬을 더한 것. */
  compares: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. `variant` 를 주면 그 변이를 켠 판이다. */
export function counted(
  n: number,
  edges: Edge[],
  record = true,
  variant: Variant | null = null,
): Counts {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const adjE: number[][] = Array.from({ length: n }, () => []);
  let builds = 0;
  edges.forEach(([u, v], k) => {
    builds++;
    (adj[u] as number[]).push(v);
    (adjE[u] as number[]).push(k);
  });
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const onStack: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  const steps: Step[] = [];
  const parent: (number | null)[] = Array.from({ length: n }, () => null);
  const children: number[][] = Array.from({ length: n }, () => []);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const roots: number[] = [];
  const kinds: (EdgeKindKo | null)[] = edges.map(() => null);
  let timer = 0;
  let reads = 0;
  let enters = 0;
  let pops = 0;
  let passes = 0;
  let lifts = 0;
  let tree = 0;
  let back = 0;
  let skip = 0;
  let cuts = 0;
  let peakStack = 0;
  let peakCall = 0;
  let compares = 0;

  const callV: number[] = [];
  const callI: number[] = [];
  const snap = (
    s: Pick<Step, "kind" | "label" | "v" | "w" | "edge" | "parent"> &
      Partial<Pick<Step, "lowFrom" | "cut">>,
  ): void => {
    if (!record) return;
    steps.push({
      lowFrom: null,
      cut: [],
      ...s,
      disc: disc.slice(),
      low: low.slice(),
      onStack: onStack.slice(),
      stack: stack.slice(),
      call: callV.slice(),
      groups: sccs.map((g) => g.slice()),
      timer,
      reads,
      kinds: kinds.slice(),
    });
  };
  const enter = (v: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stack.push(v);
    onStack[v] = true;
    callV.push(v);
    callI.push(0);
    enters++;
    peakStack = Math.max(peakStack, stack.length);
    peakCall = Math.max(peakCall, callV.length);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    roots.push(root);
    enter(root);
    snap({
      kind: "진입",
      label: "③",
      v: root,
      w: null,
      edge: null,
      parent: null,
    });
    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];
      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const k = (adjE[v] as number[])[i] as number;
        reads++;
        if (disc[w] === -1) {
          tree++;
          kinds[k] = "나무";
          parent[w] = v;
          depth[w] = (depth[v] as number) + 1;
          (children[v] as number[]).push(w);
          enter(w);
          snap({ kind: "진입", label: "④③", v: w, w: v, edge: k, parent: v });
        } else if (variant === "noOnStack" || onStack[w]) {
          back++;
          kinds[k] = callV.includes(w)
            ? "되돌아감"
            : (disc[w] as number) > (disc[v] as number)
              ? "앞으로 감"
              : "가로지름";
          const before = low[v] as number;
          const take = variant === "backLow" ? low[w] : disc[w];
          low[v] = Math.min(low[v] as number, take as number);
          snap({
            kind: "줄임",
            label: "⑤",
            v,
            w,
            edge: k,
            parent: null,
            lowFrom: { vertex: v, before },
          });
        } else {
          skip++;
          kinds[k] =
            (disc[w] as number) > (disc[v] as number)
              ? "앞으로 감"
              : "가로지름";
          snap({ kind: "무시", label: "⑥", v, w, edge: k, parent: null });
        }
        continue;
      }
      callV.pop();
      callI.pop();
      pops++;
      const par = callV[callV.length - 1];
      let lowFrom: Step["lowFrom"] = null;
      if (par !== undefined) {
        passes++;
        const before = low[par] as number;
        const give = variant === "parentDisc" ? disc[v] : low[v];
        low[par] = Math.min(low[par] as number, give as number);
        lowFrom = { vertex: par, before };
      }
      if (low[v] === disc[v]) {
        cuts++;
        const group: number[] = [];
        while (true) {
          const w = stack.pop() as number;
          if (variant !== "noFlagDown") onStack[w] = false;
          group.push(w);
          lifts++;
          if (w === v) break;
        }
        const cut = group.slice();
        group.sort((a, b) => {
          compares++;
          return a - b;
        });
        sccs.push(group);
        snap({
          kind: "뿌리",
          label: "⑦⑧",
          v,
          w: null,
          edge: null,
          parent: par ?? null,
          lowFrom,
          cut,
        });
      } else {
        snap({
          kind: "복귀",
          label: "⑦",
          v,
          w: null,
          edge: null,
          parent: par ?? null,
          lowFrom,
        });
      }
    }
  }
  const groups = sccs.sort((a, b) => {
    compares++;
    return (a[0] as number) - (b[0] as number);
  });
  return {
    groups,
    disc,
    low,
    steps,
    parent,
    children,
    roots,
    depth,
    kinds,
    builds,
    reads,
    enters,
    pops,
    passes,
    lifts,
    tree,
    back,
    skip,
    cuts,
    peakStack,
    peakCall,
    compares,
  };
}

/** 재귀로 적은 판. 절차는 정본과 같고 호출 스택만 자바스크립트에 맡긴다. */
export function recursive(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const onStack: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  let timer = 0;
  const dfs = (v: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stack.push(v);
    onStack[v] = true;
    for (const w of adj[v] as number[]) {
      if (disc[w] === -1) {
        dfs(w);
        low[v] = Math.min(low[v] as number, low[w] as number);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v] as number, disc[w] as number);
      }
    }
    if (low[v] === disc[v]) {
      const group: number[] = [];
      while (true) {
        const w = stack.pop() as number;
        onStack[w] = false;
        group.push(w);
        if (w === v) break;
      }
      group.sort((a, b) => a - b);
      sccs.push(group);
    }
  };
  for (let v = 0; v < n; v++) if (disc[v] === -1) dfs(v);
  return sccs.sort((a, b) => (a[0] as number) - (b[0] as number));
}

/** 한 정점에서 간선을 따라 이를 수 있는 정점 전부. `back` 이 참이면 간선을 거꾸로 따라간다. */
export function reachable(
  n: number,
  edges: Edge[],
  src: number,
  back: boolean,
): { set: number[]; reads: number } {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (back) (adj[v] as number[]).push(u);
    else (adj[u] as number[]).push(v);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  seen[src] = true;
  const queue = [src];
  let head = 0;
  let reads = 0;
  while (head < queue.length) {
    const v = queue[head++] as number;
    for (const w of adj[v] as number[]) {
      reads++;
      if (!seen[w]) {
        seen[w] = true;
        queue.push(w);
      }
    }
  }
  const set: number[] = [];
  for (let v = 0; v < n; v++) if (seen[v]) set.push(v);
  return { set, reads };
}

/** 정점 쌍마다 양쪽 도달 가능성을 새로 재는 방법. 간선 읽기를 센다. */
export function pairwise(
  n: number,
  edges: Edge[],
): { groups: number[][]; reads: number; searches: number } {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  let reads = 0;
  let searches = 0;
  const canReach = (src: number, dst: number): boolean => {
    searches++;
    const seen: boolean[] = Array.from({ length: n }, () => false);
    seen[src] = true;
    const queue = [src];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head++] as number;
      if (v === dst) return true;
      for (const w of adj[v] as number[]) {
        reads++;
        if (!seen[w]) {
          seen[w] = true;
          queue.push(w);
        }
      }
    }
    return src === dst;
  };
  const groupOf: number[] = Array.from({ length: n }, () => -1);
  const groups: number[][] = [];
  for (let u = 0; u < n; u++) {
    if (groupOf[u] !== -1) continue;
    const group = [u];
    groupOf[u] = groups.length;
    for (let v = u + 1; v < n; v++) {
      if (groupOf[v] !== -1) continue;
      if (canReach(u, v) && canReach(v, u)) {
        group.push(v);
        groupOf[v] = groups.length;
      }
    }
    groups.push(group);
  }
  return { groups, reads, searches };
}

/** 정점마다 앞뒤 도달 집합을 한 벌씩 재는 방법. 간선 읽기를 센다. */
export function perVertex(
  n: number,
  edges: Edge[],
): { groups: number[][]; reads: number; searches: number } {
  let reads = 0;
  let searches = 0;
  const key: string[] = [];
  for (let v = 0; v < n; v++) {
    const f = reachable(n, edges, v, false);
    const b = reachable(n, edges, v, true);
    searches += 2;
    reads += f.reads + b.reads;
    const both = f.set.filter((x) => b.set.includes(x));
    key[v] = both.join(",");
  }
  const seen = new Map<string, number[]>();
  for (let v = 0; v < n; v++) {
    const k = key[v] as string;
    const got = seen.get(k);
    if (got === undefined) seen.set(k, [v]);
    else got.push(v);
  }
  const groups = [...seen.values()].map((g) => g.slice().sort((a, b) => a - b));
  return {
    groups: groups.sort((a, b) => (a[0] as number) - (b[0] as number)),
    reads,
    searches,
  };
}

/** 정점 `v` 의 깊이 우선 탐색 트리 아래 정점 전부(자기 포함, 발견 차례). */
export function subtree(c: Counts, v: number): number[] {
  const out: number[] = [];
  const walk = (x: number): void => {
    out.push(x);
    for (const y of c.children[x] as number[]) walk(y);
  };
  walk(v);
  return out;
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [CROSS_N, CROSS_EDGES],
    [LINE_N, LINE_EDGES],
    [BRANCH_N, BRANCH_EDGES],
    [TRAP_N, TRAP_EDGES],
    [12, complete(12)],
    [32, cycle(32)],
    [64, randomSparse(64, 96, 20260905)],
  ];
  for (const [n, edges] of inputs) {
    const ref = show(stronglyConnectedComponents(n, edges));
    if (show(counted(n, edges).groups) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
    if (show(pairwise(n, edges).groups) !== ref) {
      throw new Error("쌍마다 재는 사본이 정본과 다른 답을 낸다");
    }
    if (show(perVertex(n, edges).groups) !== ref) {
      throw new Error("정점마다 재는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL(
  "./stronglyConnectedComponents-guide.ref.ts",
  import.meta.url,
).pathname;

interface Impl {
  stronglyConnectedComponents(n: number, edges: Edge[]): number[][];
}

/** 스택에 남아 있는지를 안 보고 이미 방문한 정점이면 전부 되돌아갈 수 있다고 둔 사본. */
const noOnStack = await loadMutant<Impl>(REF, {
  swap: [/\} else if \(onStack\[w\]\) \{/, "} else if (true) {"],
});

/** 자식에게서도 low-link 값 대신 발견 순서를 받는 사본. */
const parentDisc = await loadMutant<Impl>(REF, {
  swap: [
    /low\[parent\] = Math\.min\(low\[parent\] as number, low\[v\] as number\);/,
    "low[parent] = Math.min(low[parent] as number, disc[v] as number);",
  ],
});

/** **불변식을 지키던 줄** 하나 — 끊어 낸 정점의 표시를 내리는 줄을 뺀 사본. */
const noFlagDown = await loadMutant<Impl>(REF, {
  drop: /onStack\[w\] = false;/,
});

/**
 * 스택 위 정점으로 가는 간선에서 발견 순서 대신 그 정점의 low-link 값을 받는 사본.
 *
 * **이 변이는 답을 안 바꾼다.** 그래서 아래 자기검사 목록에 넣지 않는다 — 넣으면 「어느
 * 입력에서도 답을 못 바꿨다」로 던진다. 안 바뀐다는 사실 자체가 본문이 내미는 값이다.
 */
const backLow = await loadMutant<Impl>(REF, {
  swap: [
    /low\[v\] = Math\.min\(low\[v\] as number, disc\[w\] as number\);/,
    "low[v] = Math.min(low[v] as number, low[w] as number);",
  ],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  {
    label: "강한 연결 요소 하나가 먼저 끊기는 입력",
    n: CROSS_N,
    edges: CROSS_EDGES,
  },
  { label: "가지가 둘인 사이클", n: BRANCH_N, edges: BRANCH_EDGES },
  { label: "되돌아가는 간선이 없는 입력", n: LINE_N, edges: LINE_EDGES },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 =
  noOnStack.stronglyConnectedComponents === stronglyConnectedComponents;

const WIDE_CASES: { label: string; n: number; edges: Edge[] }[] = [
  ...MUTANT_CASES,
  { label: "되돌아가는 간선이 하나", n: TRAP_N, edges: TRAP_EDGES },
  { label: "사이클 하나 (V = 32)", n: 32, edges: cycle(32) },
  { label: "완전 그래프 (V = 16)", n: 16, edges: complete(16) },
  {
    label: "사이클 넷을 이은 그래프 (V = 32)",
    n: 32,
    edges: chainOfCycles(4, 8).e,
  },
  {
    label: "무작위 희소 (V = 64, E = 96)",
    n: 64,
    edges: randomSparse(64, 96, 20260905),
  },
  {
    label: "무작위 희소 (V = 128, E = 256)",
    n: 128,
    edges: randomSparse(128, 256, 424242),
  },
];

if (!중화됨) {
  // 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  for (const [label, impl] of [
    ["스택 검사를 뺀 판", noOnStack],
    ["자식에게서 발견 순서를 받는 판", parentDisc],
    ["표시를 안 내리는 판", noFlagDown],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          show(stronglyConnectedComponents(c.n, c.edges)) ===
          show(impl.stronglyConnectedComponents(c.n, c.edges)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 사본의 변이 스위치가 정본 소스에서 만든 변이와 같은 답을 내는가 — 걸음 표가 그 사본에서 나온다.
  for (const [variant, impl] of [
    ["noOnStack", noOnStack],
    ["parentDisc", parentDisc],
    ["noFlagDown", noFlagDown],
    ["backLow", backLow],
  ] as [Variant, Impl][]) {
    for (const c of WIDE_CASES) {
      if (
        show(counted(c.n, c.edges, false, variant).groups) !==
        show(impl.stronglyConnectedComponents(c.n, c.edges))
      ) {
        throw new Error(`사본의 ${variant} 스위치가 변이와 다른 답을 낸다`);
      }
    }
  }
}

/** 변이 하나를 고정 입력 넷에 걸어 정본과 나란히 놓는다. */
function mutantTable(impl: Impl, name: string): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(stronglyConnectedComponents(c.n, c.edges));
    const b = show(impl.stronglyConnectedComponents(c.n, c.edges));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return md(["입력", "정본", name, "판정"], rows);
}

/* ────────────────────────── 수치 ────────────────────────── */

/** $\log_2 (m!)$ — 항목 `m` 개를 **비교만으로** 정렬할 때 필요한 비교 횟수의 최악 하한. */
function log2Factorial(m: number): number {
  let sum = 0;
  for (let k = 2; k <= m; k++) sum += Math.log2(k);
  return sum;
}

const V_LIMIT = 100_000;
const E_LIMIT = 100_000;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
const OPS_PER_SEC = 1e8;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "정점마다의 칸을 만든다"],
  ["③", "정점에 처음 들어간다"],
  ["④", "처음 보는 이웃으로 내려간다"],
  ["⑤", "스택에 있는 정점으로 가는 간선에서 low 를 줄인다"],
  ["⑥", "이미 끊겨 나간 정점이라 무시한다"],
  ["⑦", "이웃을 다 본 정점을 빼고 low 를 넘긴다"],
  ["⑧", "뿌리에서 스택을 끊는다"],
];

function branchCounts(n: number, edges: Edge[]): number[] {
  const c = counted(n, edges, false);
  return [1, 1, c.enters, c.tree, c.back, c.skip, c.pops, c.cuts];
}

/**
 * 걸음 하나가 다루는 자리 — 간선을 읽은 걸음이면 `u→v`, 아니면 정점 번호 하나.
 * 진입은 부모에서 자식으로 내려간 것이라 `w→v` 이고, 간선 읽기는 지금 정점에서 이웃을 본 것이라 `v→w` 다.
 */
export function site(s: Step): string {
  if (s.w === null) return String(s.v);
  return s.kind === "진입" ? `${s.w}→${s.v}` : `${s.v}→${s.w}`;
}

/** 걸음이 한 일 한 줄 — 걸음 표와 걸음 재생 패널이 같은 말을 쓴다. */
export function stepNote(s: Step): string {
  switch (s.kind) {
    case "진입":
      return `disc[${s.v}] = low[${s.v}] = ${s.disc[s.v]}`;
    case "줄임":
      return `low[${s.v}] = min(${s.lowFrom?.before}, disc[${s.w}] = ${s.disc[s.w as number]}) = ${s.low[s.v]}`;
    case "무시":
      return `onStack[${s.w}]${이가(String(s.w))} 거짓이라 low[${s.v}]${은는(String(s.v))} ${s.low[s.v]} 그대로`;
    case "복귀":
      return s.parent === null
        ? `정점 ${s.v}${을를(String(s.v))} 끝낸다`
        : `low[${s.parent}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[s.parent]}`;
    default:
      return `low[${s.v}] = disc[${s.v}] = ${s.disc[s.v]}${josa(String(s.disc[s.v]), "이라", "라")} 정점 ${s.cut
        .slice()
        .sort((a, b) => a - b)
        .join(" · ")}${을를(String(Math.max(...s.cut)))} 끊는다`;
  }
}

/** `T#` 라벨을 붙인 전개 걸음. 첫 걸음(T1)이 준비이고 마지막 걸음이 반환이다. */
export function walkSteps(): { steps: Step[]; counts: Counts } {
  const c = counted(WALK_N, WALK_EDGES);
  return { steps: c.steps, counts: c };
}

/** 강한 연결 요소를 끊은 차례 — 반환값은 첫 원소 기준으로 다시 정렬되므로 걸음 기록에서만 나온다. */
function foundOrder(c: Counts): number[][] {
  return c.steps
    .filter((s) => s.kind === "뿌리")
    .map((s) => s.groups[s.groups.length - 1] as number[]);
}

const groupOf = (groups: number[][], v: number): number[] =>
  groups.find((g) => g.includes(v)) ?? [];

/** 「예」·「아니오」. */
const yn = (b: boolean): string => (b ? "예" : "아니오");

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── deep.origin ─────────────── */

  /** 가장 단순한 방법 — 정점 쌍마다 왕복 탐색을 사슬에서 센다. */
  naiveScale: () => {
    const sizes = [6, 50, 100, 200];
    const rows = sizes.map((v) => {
      const edges = line(v);
      const p = pairwise(v, edges);
      const c = counted(v, edges, false);
      return [
        comma(v),
        comma(edges.length),
        comma((v * (v - 1)) / 2),
        comma(p.searches),
        comma(p.reads),
        comma(c.reads),
      ];
    });
    const allDouble = sizes.every(
      (v) => pairwise(v, line(v)).searches === v * (v - 1),
    );
    const bigSearches = V_LIMIT * (V_LIMIT - 1);
    rows.push([
      comma(V_LIMIT),
      comma(V_LIMIT - 1),
      comma((V_LIMIT * (V_LIMIT - 1)) / 2),
      comma(bigSearches),
      "(실행하지 않음)",
      comma(V_LIMIT - 1),
    ]);
    return [
      md(
        [
          "정점 V",
          "간선 E",
          "정점 쌍",
          "탐색 횟수",
          "간선 읽기",
          "깊이 우선 탐색 한 번의 간선 읽기",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `실행한 네 줄에서 탐색 횟수는 ${allDouble ? "모두" : "모두는 아니게"} 정점 쌍의 두 배입니다. 마지막 줄은 같은 식으로 센 값이고, 탐색 한 번이 간선을 하나만 읽는다고 쳐도 ${comma(bigSearches)} 번이라 초당 1 억 번 기준 ${(bigSearches / OPS_PER_SEC).toFixed(0)} 초가 걸립니다.`,
    ].join("\n");
  },

  /** 정점마다 앞뒤 도달 집합의 교집합. */
  reachIntersect: () => {
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const f = reachable(WALK_N, WALK_EDGES, v, false);
      const b = reachable(WALK_N, WALK_EDGES, v, true);
      const both = f.set.filter((x) => b.set.includes(x));
      return [String(v), list(f.set), list(b.set), list(both)];
    });
    const q = perVertex(WALK_N, WALK_EDGES);
    const ref = show(stronglyConnectedComponents(WALK_N, WALK_EDGES));
    return [
      md(
        [
          "정점 v",
          "v 에서 갈 수 있는 정점",
          "v 로 올 수 있는 정점",
          "둘 다인 정점",
        ],
        rows,
        [0],
      ),
      "",
      `둘 다인 정점을 모으면 ${show(q.groups)} 이고, 정본이 낸 답도 ${ref} 입니다. 탐색은 ${q.searches} 번, 간선 읽기는 ${q.reads} 번입니다.`,
    ].join("\n");
  },

  /** 같은 입력을 세 방식으로 처리하고 실제 계수를 나란히 놓는다. */
  threeWays: () => {
    const p = pairwise(WALK_N, WALK_EDGES);
    const q = perVertex(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      md(
        ["방법", "탐색 횟수", "간선 읽기", "결과"],
        [
          [
            "정점 쌍마다 왕복 탐색",
            comma(p.searches),
            comma(p.reads),
            show(p.groups),
          ],
          [
            "정점마다 앞뒤 도달 집합",
            comma(q.searches),
            comma(q.reads),
            show(q.groups),
          ],
          ["깊이 우선 탐색 한 번", "1", comma(c.reads), show(c.groups)],
        ],
        [1, 2],
      ),
      "",
      `세 방법의 결과가 ${show(p.groups) === show(q.groups) && show(q.groups) === show(c.groups) ? "모두 일치하고" : "서로 어긋나고"}, 간선 읽기는 ${p.reads} · ${q.reads} · ${c.reads} 번입니다. 간선은 ${WALK_EDGES.length} 개입니다.`,
    ].join("\n");
  },

  /** 「되돌아가는 간선을 만나면 스택 전부가 한 강한 연결 요소」 후보를 반박한다. */
  stackAllCandidate: () => {
    const c = counted(TRAP_N, TRAP_EDGES);
    const rows = c.steps.map((s, i) => [
      `걸음 ${i + 1}`,
      s.kind,
      site(s),
      list(s.stack),
      dl(s.disc),
      dl(s.low),
    ]);
    const at = c.steps.findIndex((s) => s.kind === "줄임");
    const hit = c.steps[at] as Step;
    const guess = [hit.stack.slice().sort((a, b) => a - b)];
    return [
      md(["걸음", "하는 일", "정점 또는 간선", "스택", "disc", "low"], rows),
      "",
      `되돌아가는 간선 ${site(hit)}${을를(site(hit))} 읽은 걸음 ${at + 1} 에서 스택은 ${list(hit.stack)} 입니다. 이 셋을 한 묶음으로 두면 ${show(guess)} 이고, 정본이 낸 답은 ${show(c.groups)} 입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 먼저 알아 둘 개념: 깊이 우선 탐색 트리 ─────────────── */

  /** 정점마다 부모 · 깊이 · 아래 정점 · 들어갈 때의 호출 스택. */
  treeVertices: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const byDisc = Array.from({ length: WALK_N }, (_, v) => v).sort(
      (a, b) => (c.disc[a] as number) - (c.disc[b] as number),
    );
    const rows = byDisc.map((v) => {
      const entry = c.steps.find((s) => s.kind === "진입" && s.v === v) as Step;
      const p = c.parent[v];
      return [
        String(v),
        String(c.disc[v]),
        p === null || p === undefined ? "없음 (뿌리)" : String(p),
        String(c.depth[v]),
        list(subtree(c, v)),
        list(entry.call),
      ];
    });
    return md(
      ["정점", "disc", "부모", "깊이", "아래 정점", "들어간 직후의 호출 스택"],
      rows,
      [1, 3],
    );
  },

  /** 간선 일곱의 종류 — 머리가 꼬리의 조상인가 · 먼저 발견됐는가. */
  treeEdges: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = WALK_EDGES.map(([u, w], k) => {
      const anc = subtree(c, w).includes(u) && u !== w;
      return [
        `${u}→${w}`,
        String(c.disc[u]),
        String(c.disc[w]),
        yn(anc),
        String(c.kinds[k]),
      ];
    });
    return md(
      ["간선", "꼬리의 disc", "머리의 disc", "조상인 머리", "종류"],
      rows,
      [1, 2],
    );
  },

  /** 「먼저 발견됐다」와 「조상이다」가 갈리는 자리. */
  treeEarlier: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const picked = WALK_EDGES.filter(
      ([u, w]) => (c.disc[w] as number) < (c.disc[u] as number),
    );
    const rows = picked.map(([u, w]) => {
      const anc = subtree(c, w).includes(u);
      const backPath = reachable(WALK_N, WALK_EDGES, w, false).set.includes(u);
      return [`${u}→${w}`, yn(true), yn(anc), yn(backPath)];
    });
    const ancestors = picked.filter(([u, w]) => subtree(c, w).includes(u));
    const odd = picked.find(([u, w]) => !subtree(c, w).includes(u)) as Edge;
    return [
      md(
        ["간선", "먼저 발견한 머리", "조상인 머리", "머리에서 꼬리로 오는 길"],
        rows,
      ),
      "",
      `머리를 먼저 발견한 간선 ${picked.length} 개 가운데 머리가 조상인 것은 ${ancestors.length} 개입니다. ${odd[0]}→${odd[1]} 의 머리 ${odd[1]}${은는(odd[1])} ${odd[0]} 보다 먼저 발견됐지만 ${odd[0]} 의 조상이 아니고, ${odd[1]} 에서 ${odd[0]}${으로(String(odd[0]))} 돌아오는 길도 없습니다.`,
    ].join("\n");
  },

  /** 강한 연결 요소마다 가장 먼저 발견된 정점과 그 아래. */
  sccInTree: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = c.groups.map((g) => {
      const top = g.reduce((a, b) =>
        (c.disc[a] as number) <= (c.disc[b] as number) ? a : b,
      );
      const below = subtree(c, top);
      return [
        list(g),
        String(top),
        list(below),
        yn(g.every((x) => below.includes(x))),
      ];
    });
    return md(
      [
        "강한 연결 요소",
        "가장 먼저 발견한 정점",
        "그 정점의 아래 정점",
        "그 아래에 다 듦",
      ],
      rows,
    );
  },

  /* ─────────────── deep.build — 먼저 알아 둘 개념: low-link 값 ─────────────── */

  /** 정점 하나(1)의 low-link 값을 정의에서 읽는다. */
  lowReadOne: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const v = 1;
    const below = subtree(c, v);
    const hits = c.steps.filter(
      (s) => s.kind === "줄임" && below.includes(s.v),
    );
    const min = Math.min(
      c.disc[v] as number,
      ...hits.map((s) => s.disc[s.w as number] as number),
    );
    return [
      md(
        ["항", "보는 것", "값"],
        [
          ["자기 발견 순서", `disc[${v}]`, String(c.disc[v])],
          ["아래 정점", `정점 ${v} 의 아래`, list(below)],
          [
            "스택 위 정점으로 가는 간선",
            "아래 정점에서 나가는 간선 중 읽을 때 머리가 스택에 있던 것",
            hits
              .map((s) => `${site(s)} (disc ${s.disc[s.w as number]})`)
              .join(" · "),
          ],
          ["가장 작은 값", "위 발견 순서 중 가장 작은 것", String(min)],
        ],
      ),
      "",
      `정의에서 읽은 값은 ${min}${josa(String(min), "이고", "고")}, 정본과 같은 절차를 실행해 얻은 low[${v}] 도 ${c.low[v]} 입니다.`,
    ].join("\n");
  },

  /** 정점마다 disc · low · 부모의 low. */
  lowTable: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const p = c.parent[v];
      return [
        String(v),
        String(c.disc[v]),
        String(c.low[v]),
        p === null || p === undefined ? "없음" : String(p),
        p === null || p === undefined ? "-" : String(c.low[p]),
        yn((c.low[v] as number) <= (c.disc[v] as number)),
        yn(c.low[v] === c.disc[v]),
        list(groupOf(c.groups, v)),
      ];
    });
    return md(
      [
        "정점",
        "disc",
        "low",
        "부모",
        "부모의 low",
        "low ≤ disc",
        "low = disc",
        "속한 강한 연결 요소",
      ],
      rows,
      [1, 2, 4],
    );
  },

  /** low-link 값과 「갈 수 있는 정점 중 가장 이른 발견 순서」를 나란히. */
  lowVsReach: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const reachMin = (v: number) =>
      Math.min(
        ...reachable(WALK_N, WALK_EDGES, v, false).set.map(
          (x) => c.disc[x] as number,
        ),
      );
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      String(reachMin(v)),
      yn(c.low[v] === c.disc[v]),
      yn(reachMin(v) === c.disc[v]),
    ]);
    const differ = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => reachMin(v) !== c.low[v],
    );
    const lowRoots = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => c.low[v] === c.disc[v],
    );
    const reachRoots = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => reachMin(v) === c.disc[v],
    );
    return [
      md(
        [
          "정점",
          "disc",
          "low",
          "갈 수 있는 정점 중 가장 이른 disc",
          "low 로 본 뿌리",
          "도달로 본 뿌리",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `두 값이 갈리는 정점은 ${differ.join(" · ")} 입니다. low 로 보면 뿌리가 ${lowRoots.join(" · ")}${으로(String(lowRoots.at(-1)))} ${lowRoots.length} 개이고, 도달로 보면 ${reachRoots.join(" · ")}${으로(String(reachRoots.at(-1)))} ${reachRoots.length} 개입니다. 강한 연결 요소는 ${c.groups.length} 개입니다.`,
    ].join("\n");
  },

  /** low = disc 판정이 실제 강한 연결 요소의 수와 맞는가 — 모양이 다른 일곱 그래프. */
  rootCriterion: () => {
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["되돌아가는 간선이 없는 입력", LINE_N, LINE_EDGES],
      ["되돌아가는 간선이 하나", TRAP_N, TRAP_EDGES],
      ["강한 연결 요소 하나가 먼저 끊기는 입력", CROSS_N, CROSS_EDGES],
      ["가지가 둘인 사이클", BRANCH_N, BRANCH_EDGES],
      ["사이클 하나 (V = 8)", 8, cycle(8)],
      ["완전 그래프 (V = 8)", 8, complete(8)],
    ];
    const rows = inputs.map(([label, n, edges]) => {
      const c = counted(n, edges, false);
      const roots = Array.from({ length: n }, (_, v) => v).filter(
        (v) => c.low[v] === c.disc[v],
      );
      return [
        label,
        String(n),
        String(edges.length),
        list(roots),
        String(roots.length),
        String(c.groups.length),
      ];
    });
    return md(
      ["입력", "V", "E", "low = disc 인 정점", "그 개수", "강한 연결 요소 수"],
      rows,
      [1, 2, 4, 5],
    );
  },

  /* ─────────────── deep.build — 실현 단계 ─────────────── */

  /** 1단계 — 정점에 들어가는 걸음. */
  stageEnter: () => {
    const { steps } = walkSteps();
    const rows = steps
      .map((s, i) => ({ s, t: i + 2 }))
      .filter(({ s }) => s.kind === "진입")
      .map(({ s, t }) => [
        `T${t}`,
        String(s.v),
        s.w === null ? "바깥 반복" : `간선 ${s.w}→${s.v}`,
        String(s.disc[s.v]),
        list(s.stack),
        list(s.call),
      ]);
    return md(
      [
        "걸음",
        "들어간 정점",
        "들어온 자리",
        "disc = low",
        "들어간 뒤 스택",
        "들어간 뒤 호출 스택",
      ],
      rows,
      [3],
    );
  },

  /** 2단계 — 간선 일곱을 읽는 걸음. */
  stageEdges: () => {
    const { steps, counts } = walkSteps();
    const reads = steps
      .map((s, i) => ({ s, t: i + 2 }))
      .filter(({ s }) => s.edge !== null);
    const rows = reads.map(({ s, t }) => {
      const w = s.kind === "진입" ? s.v : (s.w as number);
      const u = s.kind === "진입" ? (s.w as number) : s.v;
      const branch =
        s.kind === "진입"
          ? "처음 보는 정점 — 내려간다"
          : s.kind === "줄임"
            ? "스택에 있다 — low 를 줄인다"
            : "끊겨 나갔다 — 무시한다";
      const lowCol =
        s.kind === "진입"
          ? `${s.low[u]} 그대로`
          : s.kind === "줄임"
            ? `${s.lowFrom?.before} → ${s.low[u]}`
            : `${s.low[u]} 그대로`;
      const before = s.kind === "진입" ? "-" : String(s.disc[w]);
      const onStackBefore =
        s.kind === "진입" ? "아니오 (처음 봄)" : yn(s.onStack[w] === true);
      return [`T${t}`, `${u}→${w}`, before, onStackBefore, branch, lowCol];
    });
    return [
      md(
        ["걸음", "간선", "머리의 disc", "머리의 onStack", "갈래", "꼬리의 low"],
        rows,
        [2],
      ),
      "",
      `간선 ${WALK_EDGES.length} 개가 ${reads.length} 걸음에서 한 번씩 읽혔습니다. 내려간 간선이 ${counts.tree} 개, low 를 줄인 간선이 ${counts.back} 개, 무시한 간선이 ${counts.skip} 개입니다.`,
    ].join("\n");
  },

  /** 3단계 — 이웃을 다 본 정점이 부모에게 low 를 넘기는 걸음. */
  stagePass: () => {
    const { steps } = walkSteps();
    const rows = steps
      .map((s, i) => ({ s, t: i + 2 }))
      .filter(({ s }) => s.kind === "복귀" || s.kind === "뿌리")
      .map(({ s, t }) => [
        `T${t}`,
        String(s.v),
        String(s.low[s.v]),
        s.parent === null ? "없음" : String(s.parent),
        s.parent === null ? "-" : `${s.lowFrom?.before} → ${s.low[s.parent]}`,
      ]);
    return md(
      ["걸음", "끝낸 정점", "그 정점의 low", "부모", "부모의 low"],
      rows,
      [2],
    );
  },

  /** 4단계 — 끝낸 정점마다 뿌리인지 보고, 뿌리면 스택을 끊는다. */
  stageCut: () => {
    const { steps } = walkSteps();
    const done = steps
      .map((s, i) => ({ s, t: i + 2, prev: steps[i - 1] }))
      .filter(({ s }) => s.kind === "복귀" || s.kind === "뿌리");
    const rows = done.map(({ s, t, prev }) => [
      `T${t}`,
      String(s.v),
      String(s.low[s.v]),
      String(s.disc[s.v]),
      yn(s.kind === "뿌리"),
      list(prev?.stack ?? []),
      s.kind === "뿌리" ? list(s.cut) : "-",
      list(s.stack),
    ]);
    const cut = done.flatMap(({ s }) => s.cut);
    return [
      md(
        [
          "걸음",
          "끝낸 정점",
          "low",
          "disc",
          "뿌리인가",
          "끝내기 전 스택",
          "끊은 정점",
          "끝낸 뒤 스택",
        ],
        rows,
        [2, 3],
      ),
      "",
      `뿌리 ${done.filter(({ s }) => s.kind === "뿌리").length} 곳에서 끊은 정점을 합치면 ${cut.length} 개이고, 정점 ${WALK_N} 개가 ${new Set(cut).size === WALK_N ? "한 번씩 끊겼습니다" : "한 번씩 끊기지 않았습니다"}.`,
    ].join("\n");
  },

  /** 4단계 핵심 성질 — 끊은 정점끼리 서로 오갈 수 있는가, 갈래마다. */
  cutCases: () => {
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["되돌아가는 간선이 하나", TRAP_N, TRAP_EDGES],
      ["강한 연결 요소 하나가 먼저 끊기는 입력", CROSS_N, CROSS_EDGES],
      ["가지가 둘인 사이클", BRANCH_N, BRANCH_EDGES],
    ];
    const rows: string[][] = [];
    let all = 0;
    let ok = 0;
    for (const [label, n, edges] of inputs) {
      const c = counted(n, edges);
      for (const s of c.steps.filter((x) => x.kind === "뿌리")) {
        const below = subtree(c, s.v);
        const earlier = below.filter((x) => !s.cut.includes(x));
        const r = s.v;
        const f = reachable(n, edges, r, false).set;
        const b = reachable(n, edges, r, true).set;
        const mutual = s.cut.every((x) => f.includes(x) && b.includes(x));
        const outside = Array.from({ length: n }, (_, x) => x).filter(
          (x) => !s.cut.includes(x) && f.includes(x) && b.includes(x),
        );
        all++;
        if (mutual && outside.length === 0) ok++;
        rows.push([
          label,
          String(r),
          list(s.cut.slice().sort((x, y) => x - y)),
          earlier.length === 0 ? "없음" : list(earlier),
          yn(mutual),
          outside.length === 0 ? "없음" : list(outside),
        ]);
      }
    }
    return [
      md(
        [
          "입력",
          "뿌리",
          "끊은 정점",
          "뿌리 아래에서 먼저 끊긴 정점",
          "뿌리와 서로 오감",
          "뿌리와 서로 오가는데 안 끊긴 정점",
        ],
        rows,
        [1],
      ),
      "",
      `뿌리 ${all} 곳 모두에서 끊은 정점은 뿌리와 서로 오갈 수 있고, 뿌리와 서로 오가는데 빠진 정점은 ${all === ok ? "없습니다" : "있습니다"}.`,
    ].join("\n");
  },

  /** 설계 선택 — 재귀로 적으면 답은 같은데 깊은 그래프에서 실행이 멈춘다. */
  designRecursion: () => {
    const rows = [100, 1_000, 10_000, V_LIMIT].map((v) => {
      const edges = line(v);
      const want = stronglyConnectedComponents(v, edges);
      let got: string;
      try {
        got = `${comma(recursive(v, edges).length)} 개`;
      } catch {
        got = "호출 스택이 한계를 넘어 실행이 멈춘다";
      }
      return [comma(v), `${comma(want.length)} 개`, got];
    });
    return [
      md(
        [
          "사슬의 정점 수",
          "배열로 든 판의 강한 연결 요소",
          "재귀로 적은 판의 강한 연결 요소",
        ],
        rows,
        [0],
      ),
      "",
      `사슬에서는 호출 깊이가 정점 수와 같습니다. 정확히 몇 개에서 멈추는지는 런타임이 정하는 값이고, 제약 상한 V = ${comma(V_LIMIT)}${은는(comma(V_LIMIT))} 이 실행에서 멈춘 쪽에 있습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** 1. 준비 조각을 실행한 결과(T1). */
  walkT1: () => {
    const adj: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const [u, v] of WALK_EDGES) (adj[u] as number[]).push(v);
    return pairs([
      ["T1 이 끝난 시점", ""],
      ["  adj", adj.map((a, v) => `${v}:${list(a)}`).join("  ")],
      ["  disc", list(Array.from({ length: WALK_N }, () => -1))],
      ["  low", list(Array.from({ length: WALK_N }, () => -1))],
      ["  onStack", list(Array.from({ length: WALK_N }, () => "false"))],
      ["  stack", "[]"],
      ["  sccs", "[]"],
      ["  timer", "0"],
    ]).join("\n");
  },

  /** 2. 진입 조각을 실행한 결과(T2 · T3). */
  walkT2T3: () => {
    const { steps } = walkSteps();
    const out: [string, string][] = [];
    for (const t of [2, 3]) {
      const s = steps[t - 2] as Step;
      out.push([
        `T${t} — ${s.w === null ? `바깥 반복이 정점 ${s.v} 에 들어간다` : `간선 ${site(s)}${을를(site(s))} 읽고 정점 ${s.v}${으로(String(s.v))} 내려간다`}`,
        "",
      ]);
      out.push(["  disc", dl(s.disc)]);
      out.push(["  low", dl(s.low)]);
      out.push(["  stack", list(s.stack)]);
      out.push(["  callV", list(s.call)]);
      out.push(["  timer", String(s.timer)]);
    }
    return pairs(out).join("\n");
  },

  /** 3. 간선 조각을 실행한 결과(스택 위 정점으로 가는 간선 두 번). */
  walkT5T8: () => {
    const { steps } = walkSteps();
    const out: [string, string][] = [];
    steps.forEach((s, i) => {
      if (s.kind !== "줄임") return;
      out.push([`T${i + 2} — 간선 ${site(s)}${을를(site(s))} 읽는다`, ""]);
      out.push([
        "  판정",
        `disc[${s.w}] = ${s.disc[s.w as number]}${josa(String(s.disc[s.w as number]), "이라", "라")} -1 이 아니고, onStack[${s.w}]${이가(String(s.w))} 참이다`,
      ]);
      out.push(["  계산", stepNote(s)]);
      out.push(["  low", dl(s.low)]);
      out.push(["  stack", list(s.stack)]);
    });
    return pairs(out).join("\n");
  },

  /** 4. 끝내는 조각을 실행한 결과(T9 · T10 · T13). */
  walkT9T13: () => {
    const { steps } = walkSteps();
    const out: [string, string][] = [];
    for (const t of [9, 10, 13]) {
      const s = steps[t - 2] as Step;
      const prev = steps[t - 3] as Step;
      out.push([`T${t} — 정점 ${s.v}${을를(String(s.v))} 끝낸다`, ""]);
      if (s.parent !== null) {
        out.push([
          "  넘기기",
          `low[${s.parent}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[s.parent]}`,
        ]);
      } else {
        out.push(["  넘기기", "부모가 없어 넘기지 않는다"]);
      }
      out.push([
        "  뿌리 판정",
        `low[${s.v}] = ${s.low[s.v]} · disc[${s.v}] = ${s.disc[s.v]} → ${s.kind === "뿌리" ? "뿌리다" : "뿌리가 아니다"}`,
      ]);
      if (s.kind === "뿌리") {
        out.push([
          "  끊기",
          `스택 ${list(prev.stack)} 에서 ${s.v}${이가(String(s.v))} 나올 때까지 ${s.cut.join(", ")}${을를(String(s.cut.at(-1)))} 뺀다 → ${list(s.groups.at(-1) ?? [])}`,
        ]);
      }
      out.push(["  stack", list(s.stack)]);
    }
    return pairs(out).join("\n");
  },

  /** 짚고 가기 — 스택 검사를 빼면 정점이 통째로 사라진다. */
  pauseOnStack: () => mutantTable(noOnStack, "스택 검사를 뺀 판"),

  /** 짚고 가기 — 간선 5→3 을 읽는 걸음에서 두 판이 갈리는 자리. */
  pauseOnStackTrace: () => {
    const a = counted(WALK_N, WALK_EDGES);
    const b = counted(WALK_N, WALK_EDGES, true, "noOnStack");
    const at = (c: Counts) =>
      c.steps.find(
        (s) => s.edge !== null && WALK_EDGES[s.edge]?.[0] === 5,
      ) as Step;
    const fin = (c: Counts) =>
      c.steps
        .filter((s) => (s.kind === "뿌리" || s.kind === "복귀") && s.v === 5)
        .at(-1) as Step;
    const row = (name: string, c: Counts) => {
      const s = at(c);
      const f = fin(c);
      return [
        name,
        s.kind === "무시" ? "무시한다" : "low 를 줄인다",
        `${s.low[5]}`,
        `${f.low[5]} · ${f.disc[5]}`,
        f.kind === "뿌리" ? `끊는다 → ${list(f.cut)}` : "뿌리가 아니다",
        list(f.stack),
      ];
    };
    return [
      md(
        [
          "판",
          "간선 5→3 에서",
          "그 뒤 low[5]",
          "끝낼 때 low[5] · disc[5]",
          "정점 5 에서",
          "반복이 끝난 뒤 스택",
        ],
        [row("정본", a), row("스택 검사를 뺀 판", b)],
        [2],
      ),
      "",
      `스택 검사를 뺀 판은 반복이 끝났을 때 스택에 정점 ${fin(b).stack.join(" · ")}${을를(String(fin(b).stack.at(-1)))} 남기고, 답에 정점 5 가 없습니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 자식에게서도 발견 순서를 받으면 강한 연결 요소가 쪼개진다. */
  pauseParentDisc: () =>
    mutantTable(parentDisc, "자식에게서 발견 순서를 받는 판"),

  /** 짚고 가기 — 정점 2 · 1 을 끝내는 걸음에서 두 판이 갈리는 자리. */
  pauseParentDiscTrace: () => {
    const a = counted(WALK_N, WALK_EDGES);
    const b = counted(WALK_N, WALK_EDGES, true, "parentDisc");
    const pick = (c: Counts, v: number) =>
      c.steps.find(
        (s) => (s.kind === "복귀" || s.kind === "뿌리") && s.v === v,
      ) as Step;
    const rows: string[][] = [];
    for (const v of [2, 1, 0]) {
      const x = pick(a, v);
      const y = pick(b, v);
      const cell = (s: Step, give: "low" | "disc") =>
        s.parent === null
          ? "넘기지 않는다"
          : `low[${s.parent}] = min(${s.lowFrom?.before}, ${give}[${s.v}] = ${give === "low" ? s.low[s.v] : s.disc[s.v]}) = ${s.low[s.parent]}`;
      const verdict = (s: Step) =>
        s.kind === "뿌리"
          ? `뿌리 · ${list(s.cut.slice().sort((p, q) => p - q))}`
          : "뿌리 아님";
      rows.push([
        `정점 ${v}`,
        cell(x, "low"),
        verdict(x),
        cell(y, "disc"),
        verdict(y),
      ]);
    }
    return md(
      [
        "끝내는 정점",
        "정본이 넘기는 값",
        "정본의 판정",
        "변이가 넘기는 값",
        "변이의 판정",
      ],
      rows,
    );
  },

  /** 짚고 가기 — 반대 방향(⑤ 가 disc 대신 low 를 받으면)은 어떻게 되는가. */
  pauseSymmetry: () => {
    const rows = WIDE_CASES.map((c) => {
      const a = show(stronglyConnectedComponents(c.n, c.edges));
      const b = show(backLow.stronglyConnectedComponents(c.n, c.edges));
      return [
        c.label,
        String(c.n),
        String(c.edges.length),
        a === b ? "일치" : "불일치",
      ];
    });
    const same = rows.filter((r) => r[3] === "일치").length;
    return [
      md(["입력", "V", "E", "정본과의 답 대조"], rows, [1, 2]),
      "",
      `${rows.length} 벌 중 답이 일치한 것은 ${same} 벌입니다. 여기서 잰 것은 이 ${rows.length} 벌뿐이고, 모든 입력에서 일치한다는 뜻은 아닙니다.`,
    ].join("\n");
  },

  /** 5. 열일곱 걸음을 값과 함께 편다. */
  walkTrace: () => {
    const { steps, counts: c } = walkSteps();
    const rows: string[][] = [
      [
        "T1",
        "준비",
        "-",
        "①②",
        dl(Array(WALK_N).fill(-1)),
        dl(Array(WALK_N).fill(-1)),
        "[]",
        "[]",
        "이웃 목록과 정점마다의 칸을 만든다",
      ],
    ];
    steps.forEach((s, i) => {
      rows.push([
        `T${i + 2}`,
        s.kind,
        site(s),
        s.label,
        dl(s.disc),
        dl(s.low),
        list(s.stack),
        list(s.call),
        stepNote(s),
      ]);
    });
    const last = steps.at(-1) as Step;
    rows.push([
      `T${steps.length + 2}`,
      "반환",
      "-",
      "-",
      dl(last.disc),
      dl(last.low),
      "[]",
      "[]",
      `첫 원소 기준으로 정렬한 반환값 ${show(c.groups)}`,
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
          "스택",
          "호출 스택",
          "이 걸음이 한 일",
        ],
        rows,
      ),
      "",
      `간선 읽기 ${c.reads} 번 · 진입 ${c.enters} 번 · 호출 스택에서 빼기 ${c.pops} 번 · 끊은 정점 ${c.lifts} 개 · 강한 연결 요소 ${c.cuts} 개입니다. 스택은 가장 길 때 ${c.peakStack} 칸, 호출 스택은 가장 깊을 때 ${c.peakCall} 칸이었습니다.`,
    ].join("\n");
  },

  /** 5. 여덟 갈래가 전개 입력에서 전부 실행되는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES);
    const b = branchCounts(BRANCH_N, BRANCH_EDGES);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      String(a[i]),
      String(b[i]),
    ]);
    return md(
      ["라벨", "하는 일", "전개 입력", "가지가 둘인 사이클"],
      rows,
      [2, 3],
    );
  },

  /* ─────────────── related ─────────────── */

  /** 강한 연결 요소를 점으로 접은 그래프에 사이클이 없는가. */
  condensation: () => {
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["강한 연결 요소 하나가 먼저 끊기는 입력", CROSS_N, CROSS_EDGES],
      ["가지가 둘인 사이클", BRANCH_N, BRANCH_EDGES],
      ["사이클 넷을 이은 그래프 (V = 16)", 16, chainOfCycles(4, 4).e],
      [
        "무작위 희소 그래프 (V = 64, E = 96)",
        64,
        randomSparse(64, 96, 20260905),
      ],
    ];
    const rows = inputs.map(([label, n, edges]) => {
      const id: number[] = Array.from({ length: n }, () => -1);
      const found = foundOrder(counted(n, edges));
      found.forEach((g, k) => {
        for (const v of g) id[v] = k;
      });
      let forward = 0;
      let backward = 0;
      let inside = 0;
      for (const [u, v] of edges) {
        const a = id[u] as number;
        const b = id[v] as number;
        if (a === b) inside++;
        else if (b < a) forward++;
        else backward++;
      }
      return [
        label,
        String(found.length),
        String(inside),
        String(forward),
        String(backward),
        yn(backward === 0),
      ];
    });
    return md(
      [
        "입력",
        "강한 연결 요소 수",
        "안쪽 간선",
        "먼저 끊은 쪽으로 가는 간선",
        "나중에 끊은 쪽으로 가는 간선",
        "위상 역순",
      ],
      rows,
      [1, 2, 3, 4],
    );
  },

  /* ─────────────── deep.math ─────────────── */

  /** 정의 세 항을 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const backTo: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const s of c.steps) {
      if (s.kind === "줄임" && s.w !== null)
        (backTo[s.v] as number[]).push(s.w);
    }
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const a = c.disc[v] as number;
      const bs = (backTo[v] as number[]).map((w) => c.disc[w] as number);
      const cs = (c.children[v] as number[]).map((x) => c.low[x] as number);
      const min = Math.min(a, ...bs, ...cs);
      return [
        String(v),
        String(a),
        bs.length === 0 ? "없음" : bs.join(", "),
        cs.length === 0 ? "없음" : cs.join(", "),
        String(min),
        String(c.low[v]),
        min === c.low[v] ? "일치" : "불일치",
      ];
    });
    return [
      md(
        [
          "정점 v",
          "첫째 항 disc[v]",
          "둘째 항 disc[w]",
          "셋째 항 low[c]",
          "세 항의 최솟값",
          "실행이 낸 low[v]",
          "대조",
        ],
        rows,
        [0, 1, 4, 5],
      ),
      "",
      `여섯 정점 모두 ${rows.every((r) => r[6] === "일치") ? "일치합니다" : "일치하지는 않습니다"}. 같은 실행에서 간선 읽기는 ${c.reads} 번, 간선 수는 ${WALK_EDGES.length} 개이고, 정점을 만진 횟수는 ${c.enters + c.pops + c.lifts} 번, 3V 는 ${3 * WALK_N} 입니다.`,
    ].join("\n");
  },

  /** 닫힌 식에 여러 규모를 넣어 수치를 낸다. */
  mathScale: () => {
    const rows = [
      [1_000, 2_000],
      [10_000, 20_000],
      [V_LIMIT, E_LIMIT],
    ].map(([v, e]) => {
      const V = v as number;
      const E = e as number;
      return [
        comma(V),
        comma(E),
        comma(E),
        comma(3 * V),
        comma(3 * V + E),
        comma(Math.ceil(2 * V * Math.log2(V))),
      ];
    });
    const big = counted(V_LIMIT, cycle(V_LIMIT), false);
    return [
      md(
        [
          "정점 V",
          "간선 E",
          "간선 읽기 E",
          "정점 만짐 3V",
          "합 3V + E",
          "정렬 비교의 상한 2V log₂ V",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `V = ${comma(V_LIMIT)} 짜리 사이클 하나를 실제로 실행하면 간선 읽기 ${comma(big.reads)} 번, 정점 만짐 ${comma(big.enters + big.pops + big.lifts)} 번, 정렬 비교 ${comma(big.compares)} 번입니다.`,
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** 걸음마다 스택 내용과 두 문장을 대조한다. */
  invariantWatch: () => {
    const { steps } = walkSteps();
    const mutual = (group: number[]): boolean => {
      const r = group[0] as number;
      const f = reachable(WALK_N, WALK_EDGES, r, false).set;
      const b = reachable(WALK_N, WALK_EDGES, r, true).set;
      return group.every((v) => f.includes(v) && b.includes(v));
    };
    const rows = steps.map((s, i) => {
      const sorted = s.stack.every(
        (v, k) =>
          k === 0 ||
          (s.disc[s.stack[k - 1] as number] as number) < (s.disc[v] as number),
      );
      const settled = s.groups.flat();
      const clean = s.stack.every((v) => !settled.includes(v));
      const flags = s.onStack.every((f, v) => f === s.stack.includes(v));
      const lifted =
        s.kind === "뿌리" ? (s.groups[s.groups.length - 1] as number[]) : null;
      return [
        `T${i + 2}`,
        list(s.stack),
        show(s.groups),
        clean && flags ? "지킨다" : "깨진다",
        sorted ? "지킨다" : "깨진다",
        lifted === null ? "-" : yn(mutual(lifted)),
      ];
    });
    return md(
      [
        "걸음",
        "스택",
        "끊어 낸 강한 연결 요소",
        "앞 문장",
        "뒤 문장",
        "끊은 정점끼리 서로 오감",
      ],
      rows,
    );
  },

  /** 경계 입력에서도 같은 문장이 유지되는가. */
  invariantEdges: () => {
    const inputs: [string, number, Edge[]][] = [
      ["정점 하나, 간선 없음", 1, []],
      ["정점 하나, 자기 자신을 가리키는 간선", 1, [[0, 0]]],
      ["정점 넷, 간선 없음", 4, []],
      [
        "자기 자신을 가리키는 간선만",
        3,
        [
          [0, 0],
          [1, 1],
        ],
      ],
      [
        "같은 두 정점 사이의 겹친 간선",
        2,
        [
          [0, 1],
          [0, 1],
          [1, 0],
        ],
      ],
      [
        "떨어진 두 강한 연결 요소",
        4,
        [
          [0, 1],
          [1, 0],
          [2, 3],
          [3, 2],
        ],
      ],
      ["되돌아가는 간선이 없는 사슬", LINE_N, LINE_EDGES],
      ["사이클 하나 (V = 8)", 8, cycle(8)],
    ];
    const rows = inputs.map(([label, n, edges]) => {
      const c = counted(n, edges, false);
      return [
        label,
        String(n),
        String(edges.length),
        show(c.groups),
        String(c.reads),
        String(c.peakStack),
      ];
    });
    return md(
      ["입력", "V", "E", "강한 연결 요소", "간선 읽기", "스택 최대"],
      rows,
      [1, 2, 4, 5],
    );
  },

  /** 불변식 깨뜨리기 — 끊어 낸 정점의 표시를 안 내리면 무엇이 나오는가. */
  mutantFlagDown: () => mutantTable(noFlagDown, "표시를 안 내리는 판"),

  /** 불변식 깨뜨리기 — 앞 문장이 깨지는 걸음과 그 뒤. */
  mutantFlagDownTrace: () => {
    const a = counted(WALK_N, WALK_EDGES);
    const b = counted(WALK_N, WALK_EDGES, true, "noFlagDown");
    const t13 = (c: Counts) =>
      c.steps.find((s) => s.kind === "뿌리" && s.v === 0) as Step;
    const t15 = (c: Counts) =>
      c.steps.find(
        (s) => s.edge !== null && WALK_EDGES[s.edge]?.[0] === 5,
      ) as Step;
    const row = (name: string, c: Counts) => {
      const x = t13(c);
      const y = t15(c);
      return [
        name,
        list(x.stack),
        list(x.onStack.map((f) => (f ? "참" : "거짓"))),
        y.kind === "무시"
          ? "무시한다"
          : `low[5] 를 ${y.low[5]}${으로(String(y.low[5]))} 줄인다`,
        show(c.groups),
      ];
    };
    return md(
      ["판", "T13 뒤 스택", "T13 뒤 onStack", "T15 간선 5→3 에서", "답"],
      [row("정본", a), row("표시를 안 내리는 판", b)],
    );
  },

  /* ─────────────── perf ─────────────── */

  /** 걸음마다 읽은 간선과 누적. */
  perfCount: () => {
    const { steps, counts: c } = walkSteps();
    let acc = 0;
    const rows = steps.map((s, i) => {
      const read = s.edge === null ? 0 : 1;
      acc += read;
      return [`T${i + 2}`, s.kind, site(s), String(read), String(acc)];
    });
    return [
      md(
        [
          "걸음",
          "하는 일",
          "정점 또는 간선",
          "이 걸음이 읽은 간선",
          "여기까지 누적",
        ],
        rows,
        [3, 4],
      ),
      "",
      `이웃 목록을 만들 때 간선 ${c.builds} 개를 한 번씩 읽고, 순회하며 읽은 간선은 ${c.reads} 번입니다. 진입 ${c.enters} 번 · 호출 스택에서 빼기 ${c.pops} 번 · 끊기 ${c.lifts} 번을 더하면 ${c.enters + c.pops + c.lifts} 번이고 3V 는 ${3 * WALK_N} 입니다.`,
    ].join("\n");
  },

  /** 총식에 두 규모를 넣는다. */
  perfTotal: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const V = WALK_N;
    const E = WALK_EDGES.length;
    const big = counted(V_LIMIT, cycle(V_LIMIT), false);
    const row = (
      name: string,
      formula: string,
      small: number,
      large: string,
    ) => [name, formula, comma(small), large];
    return md(
      ["항목", "식", `V = ${V}, E = ${E}`, `V = E = ${comma(V_LIMIT)}`],
      [
        row("이웃 목록 만들기", "E", c.builds, comma(E_LIMIT)),
        row("정점마다의 배열 셋", "3V", 3 * V, comma(3 * V_LIMIT)),
        row("간선 읽기", "E", c.reads, comma(E_LIMIT)),
        row("정점 만짐", "3V", c.enters + c.pops + c.lifts, comma(3 * V_LIMIT)),
        row(
          "앞 넷의 합",
          "6V + 2E",
          6 * V + 2 * E,
          comma(6 * V_LIMIT + 2 * E_LIMIT),
        ),
        row(
          "정렬 비교",
          "모양을 탄다",
          c.compares,
          `사이클 하나에서 ${comma(big.compares)}`,
        ),
      ],
      [2],
    );
  },

  /** 모양을 바꿔 가며 계수가 무엇에 달렸는지 잰다. */
  perfObserved: () => {
    const inputs: [string, number, Edge[]][] = [
      ["되돌아가는 간선이 없는 사슬 (V = 1,024)", 1_024, line(1_024)],
      ["사이클 하나 (V = 1,024)", 1_024, cycle(1_024)],
      ["사이클 32 개 (V = 1,024)", 1_024, chainOfCycles(32, 32).e],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      [
        "무작위 희소 (V = 1,024, E = 2,048)",
        1_024,
        randomSparse(1_024, 2_048, 987654321),
      ],
    ];
    const runs = inputs.map(
      ([label, n, edges]) =>
        [label, n, edges, counted(n, edges, false)] as const,
    );
    const rows = runs.map(([label, , edges, c]) => [
      label,
      comma(edges.length),
      comma(c.reads),
      comma(c.enters + c.pops + c.lifts),
      comma(c.cuts),
      comma(c.compares),
      comma(c.peakStack),
    ]);
    const readsHold = runs.every(([, , edges, c]) => c.reads === edges.length);
    const touchHold = runs.every(
      ([, n, , c]) => c.enters + c.pops + c.lifts === 3 * n,
    );
    const k1024 = runs
      .filter(([, n]) => n === 1_024)
      .map(([, , , c]) => c.compares);
    return [
      md(
        [
          "입력",
          "간선 E",
          "간선 읽기",
          "정점 만짐",
          "강한 연결 요소 수",
          "정렬 비교",
          "스택 최대",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `다섯 줄 ${readsHold ? "모두" : "모두는 아니게"} 간선 읽기가 E 와 같고, ${touchHold ? "모두" : "모두는 아니게"} 정점 만짐이 3V 와 같습니다. V = 1,024 인 네 입력의 정렬 비교는 ${comma(Math.min(...k1024))} 에서 ${comma(Math.max(...k1024))} 사이이고, 항목 1,024 개를 비교로 정렬할 때의 최악 하한 log₂(1024!) 은 ${comma(Math.round(log2Factorial(1_024)))} 입니다.`,
    ].join("\n");
  },

  /** 모양을 바꿔도 간선 읽기가 안 갈리는지 실행으로 확인한다. */
  worstShape: () => {
    const V = 512;
    const inputs: [string, Edge[]][] = [
      ["간선 없음", []],
      ["되돌아가는 간선이 없는 사슬", line(V)],
      ["사슬을 간선 목록에 거꾸로 적은 것", line(V).slice().reverse()],
      ["사이클 하나", cycle(V)],
      ["사이클 256 개", chainOfCycles(256, 2).e],
      [
        "별 모양 — 한 정점에서 나머지 전부로",
        Array.from({ length: V - 1 }, (_, i) => [0, i + 1] as Edge),
      ],
    ];
    const runs = inputs.map(
      ([label, edges]) => [label, edges, counted(V, edges, false)] as const,
    );
    const rows = runs.map(([label, edges, c]) => [
      label,
      comma(edges.length),
      comma(c.reads),
      comma(c.enters + c.pops + c.lifts),
      comma(c.peakStack),
      comma(c.peakCall),
      comma(c.compares),
    ]);
    const readsHold = runs.every(([, edges, c]) => c.reads === edges.length);
    const touchHold = runs.every(
      ([, , c]) => c.enters + c.pops + c.lifts === 3 * V,
    );
    return [
      md(
        [
          `모양 (V = ${V})`,
          "간선 E",
          "간선 읽기",
          "정점 만짐",
          "스택 최대",
          "호출 스택 최대",
          "정렬 비교",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `여섯 모양 ${readsHold ? "모두" : "모두는 아니게"} 간선 읽기가 E 와 같고, ${touchHold ? "모두" : "모두는 아니게"} 정점 만짐이 3V = ${comma(3 * V)} 입니다.`,
    ].join("\n");
  },

  /** 간선 목록의 순서가 무엇을 바꾸고 무엇을 안 바꾸는가. */
  orderMatters: () => {
    const inputs: [string, number, Edge[]][] = [
      ["되돌아가는 간선이 없는 사슬 (V = 512)", 512, line(512)],
      ["사이클 하나 (V = 512)", 512, cycle(512)],
      ["가지가 둘인 사이클 (V = 5)", BRANCH_N, BRANCH_EDGES],
      ["사이클 넷을 이은 그래프 (V = 32)", 32, chainOfCycles(4, 8).e],
      ["무작위 희소 (V = 128, E = 256)", 128, randomSparse(128, 256, 424242)],
      ["무작위 희소 (V = 512, E = 1,024)", 512, randomSparse(512, 1_024, 7777)],
    ];
    const pairsOf = inputs.map(([label, n, edges]) => {
      const a = counted(n, edges, false);
      const b = counted(n, edges.slice().reverse(), false);
      return { label, edges, a, b };
    });
    const rows = pairsOf.map(({ label, edges, a, b }) => [
      label,
      comma(edges.length),
      `${comma(a.reads)} / ${comma(b.reads)}`,
      `${comma(a.enters + a.pops + a.lifts)} / ${comma(b.enters + b.pops + b.lifts)}`,
      `${comma(a.peakStack)} / ${comma(b.peakStack)}`,
      `${comma(a.compares)} / ${comma(b.compares)}`,
      yn(show(a.groups) === show(b.groups)),
    ]);
    const stackDiff = pairsOf.filter(
      ({ a, b }) => a.peakStack !== b.peakStack,
    ).length;
    const sortDiff = pairsOf.filter(
      ({ a, b }) => a.compares !== b.compares,
    ).length;
    return [
      md(
        [
          "입력",
          "간선 E",
          "간선 읽기 원래 / 뒤집음",
          "정점 만짐 원래 / 뒤집음",
          "스택 최대 원래 / 뒤집음",
          "정렬 비교 원래 / 뒤집음",
          "강한 연결 요소 대조",
        ],
        rows,
        [1],
      ),
      "",
      `여섯 입력 중 스택 최대가 두 순서에서 갈리는 것은 ${stackDiff} 개, 정렬 비교가 갈리는 것은 ${sortDiff} 개입니다. 간선 읽기와 정점 만짐은 여섯 입력 모두 두 순서에서 값이 같습니다.`,
    ].join("\n");
  },

  /** 규모를 늘려 가며 최악 모양의 계수가 어떻게 자라는가. */
  worstGrowth: () => {
    const sizes = [64, 256, 1_024, 4_096];
    const runs = sizes.map((v) => [v, counted(v, cycle(v), false)] as const);
    const rows = runs.map(([v, a], i) => {
      const prev = runs[i - 1]?.[1];
      const work = a.reads + a.enters + a.pops + a.lifts;
      const prevWork =
        prev === undefined
          ? 0
          : prev.reads + prev.enters + prev.pops + prev.lifts;
      return [
        comma(v),
        comma(work),
        prev === undefined ? "-" : (work / prevWork).toFixed(2),
        comma(a.compares),
        prev === undefined ? "-" : (a.compares / prev.compares).toFixed(2),
        comma(a.peakStack),
      ];
    });
    return md(
      [
        "정점 V (사이클 하나)",
        "읽기 + 만짐",
        "직전 줄의 몇 배",
        "정렬 비교",
        "직전 줄의 몇 배",
        "스택 최대",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    );
  },

  /* ─────────────── selfcheck ─────────────── */

  /** T10 앞뒤의 스택. */
  selfcheckT10: () => {
    const { steps } = walkSteps();
    const t10 = steps[10 - 2] as Step;
    const t9 = steps[9 - 2] as Step;
    return md(
      ["시점", "스택", "호출 스택", "끊어 낸 강한 연결 요소"],
      [
        ["T10 직전", list(t9.stack), list(t9.call), show(t9.groups)],
        ["T10 직후", list(t10.stack), list(t10.call), show(t10.groups)],
      ],
    );
  },
};
