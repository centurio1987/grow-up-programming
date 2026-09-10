/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「무리」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { stronglyConnectedComponents } from "./stronglyConnectedComponents-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 일곱.
 *
 * 여덟 갈래를 한 입력에서 전부 실행한다. `2 → 0` 이 「스택에 남아 있는 정점으로 되돌아가는」
 * 갈래를 내고, `5 → 3` 이 「무리가 이미 정해진 정점이라 무시하는」 갈래를 낸다. 바깥 반복이
 * 두 번 돌도록 정점 5 를 어디서도 가리키지 않는 자리에 두었다.
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

/** 무리 하나가 먼저 확정된 뒤 그 안으로 들어가는 간선이 있는 그래프. */
export const CROSS_N = 4;
export const CROSS_EDGES: Edge[] = [
  [0, 1],
  [1, 0],
  [2, 3],
  [3, 0],
];

/** 되돌아가는 간선이 하나도 없는 그래프. 모든 정점이 혼자 무리다. */
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

/** 되돌아가는 간선이 하나 있지만 그 위 정점은 같은 무리가 아닌 그래프. */
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

/** 사슬 `0 → 1 → … → v−1`. 되돌아가는 간선이 없어 무리가 `v` 개다. */
export function line(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1]);
  return edges;
}

/** 사이클 `0 → 1 → … → v−1 → 0`. 전체가 한 무리다. */
export function cycle(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) edges.push([i, (i + 1) % v]);
  return edges;
}

/** 크기 `m` 인 사이클 `k` 개를 한 줄로 이은 그래프. 무리가 `k` 개다. */
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
 * 방향 간선을 몇 개 가리키지 않고 이은 그래프. 모든 간선이 `i → j` 이고 `i < j` 다.
 * 되돌아가는 간선이 하나도 없어 무리가 `v` 개이고, 간선은 정점 쌍 전부에 있다.
 */
export function completeDag(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < v; u++) {
    for (let x = u + 1; x < v; x++) edges.push([u, x]);
  }
  return edges;
}

/**
 * 무작위 희소 그래프. 생성식을 시드로 고정한다.
 *
 * **곱셈 하나짜리 생성식을 쓰지 않는다.** `seed = (seed * a + c) & 0x7fffffff` 는 아래
 * 비트의 주기가 짧아서, 정점 수처럼 2 의 거듭제곱으로 나눈 나머지를 뽑으면 몇십 걸음 만에
 * 같은 간선이 되풀이된다 — 정점 64 개짜리 그래프에서 간선 96 개를 뽑았더니 서로 다른 것이
 * 64 개뿐이었다. 그래서 비트를 섞는 생성식으로 둔다.
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[[0, 1, 2], [3, 4], [5]]` 꼴 — 본문 표기와 같다. */
const show = (gs: number[][]): string =>
  `[${gs.map((g) => `[${g.join(", ")}]`).join(", ")}]`;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
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

/** 걸음 하나의 기록. `kind` 가 이 걸음이 실행한 갈래다. */
export interface Step {
  kind: string;
  label: string;
  v: number;
  w: number | null;
  disc: number[];
  low: number[];
  stack: number[];
  call: number[];
  groups: number[][];
  note: string;
}

export interface Counts {
  groups: number[][];
  disc: number[];
  low: number[];
  steps: Step[];
  /** 이웃 목록을 만들며 읽은 간선. */
  builds: number;
  /** 순회하며 읽은 간선. */
  reads: number;
  /** 정점에 처음 들어간 횟수. */
  enters: number;
  /** 호출 스택에서 정점을 뺀 횟수. */
  pops: number;
  /** 되돌아가는 값을 부모에게 전달한 횟수. */
  passes: number;
  /** 스택에서 걷어낸 정점 수. */
  lifts: number;
  /** 갈래별 실행 횟수 — 처음 보는 이웃 · 스택에 있는 정점 · 무리가 정해진 정점. */
  tree: number;
  back: number;
  skip: number;
  /** 무리의 개수. */
  roots: number;
  /** 스택이 가장 길었을 때의 항목 수. */
  peakStack: number;
  /** 호출 스택이 가장 깊었을 때의 항목 수. */
  peakCall: number;
  /** 정렬이 두 값을 견준 횟수 — 무리 안 정렬과 무리 사이 정렬을 더한 것. */
  compares: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: number, edges: Edge[], record = true): Counts {
  const adj: number[][] = Array.from({ length: n }, () => []);
  let builds = 0;
  for (const [u, v] of edges) {
    builds++;
    (adj[u] as number[]).push(v);
  }
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const onStack: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  const steps: Step[] = [];
  let timer = 0;
  let reads = 0;
  let enters = 0;
  let pops = 0;
  let passes = 0;
  let lifts = 0;
  let tree = 0;
  let back = 0;
  let skip = 0;
  let roots = 0;
  let peakStack = 0;
  let peakCall = 0;
  let compares = 0;

  const callV: number[] = [];
  const callI: number[] = [];
  const snap = (
    kind: string,
    label: string,
    v: number,
    w: number | null,
    note: string,
  ): void => {
    if (!record) return;
    steps.push({
      kind,
      label,
      v,
      w,
      disc: disc.slice(),
      low: low.slice(),
      stack: stack.slice(),
      call: callV.slice(),
      groups: sccs.map((g) => g.slice()),
      note,
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
    enter(root);
    snap(
      "진입",
      "③",
      root,
      null,
      `disc[${root}] = low[${root}] = ${disc[root]}`,
    );
    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];
      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        reads++;
        if (disc[w] === -1) {
          tree++;
          enter(w);
          snap("진입", "④③", w, v, `disc[${w}] = low[${w}] = ${disc[w]}`);
        } else if (onStack[w]) {
          back++;
          low[v] = Math.min(low[v] as number, disc[w] as number);
          snap("되돌아감", "⑤", v, w, `low[${v}] = ${low[v]}`);
        } else {
          skip++;
          snap("무시", "⑥", v, w, `low[${v}] 그대로 ${low[v]}`);
        }
        continue;
      }
      callV.pop();
      callI.pop();
      pops++;
      const parent = callV[callV.length - 1];
      if (parent !== undefined) {
        passes++;
        low[parent] = Math.min(low[parent] as number, low[v] as number);
      }
      if (low[v] === disc[v]) {
        roots++;
        const group: number[] = [];
        while (true) {
          const w = stack.pop() as number;
          onStack[w] = false;
          group.push(w);
          lifts++;
          if (w === v) break;
        }
        group.sort((a, b) => {
          compares++;
          return a - b;
        });
        sccs.push(group);
        snap("뿌리", "⑦⑧", v, null, `무리 [${group.join(", ")}] 을 걷어낸다`);
      } else {
        snap(
          "복귀",
          "⑦",
          v,
          null,
          parent === undefined
            ? `low[${v}] = ${low[v]}`
            : `low[${parent}] = ${low[parent]}`,
        );
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
    builds,
    reads,
    enters,
    pops,
    passes,
    lifts,
    tree,
    back,
    skip,
    roots,
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

/** 자식에게서도 되돌아가는 값 대신 발견 시각을 받는 사본. */
const parentDisc = await loadMutant<Impl>(REF, {
  swap: [
    /low\[parent\] = Math\.min\(low\[parent\] as number, low\[v\] as number\);/,
    "low[parent] = Math.min(low[parent] as number, disc[v] as number);",
  ],
});

/** **불변식을 지키던 줄** 하나 — 걷어낸 정점의 표시를 내리는 줄을 뺀 사본. */
const noFlagDown = await loadMutant<Impl>(REF, {
  drop: /onStack\[w\] = false;/,
});

/**
 * 되돌아가는 간선에서 발견 시각 대신 그 정점의 되돌아가는 값을 받는 사본.
 *
 * **이 변이는 답을 안 바꾼다.** 그래서 아래 자기검사 목록에 넣지 않는다 — 넣으면 「어느
 * 입력에서도 답을 못 바꿨다」로 던진다. 안 바뀐다는 사실 자체가 본문이 내미는 값이고,
 * 그것이 `⑤` 와 `⑦` 이 대칭이 아니라는 근거다.
 */
const backLow = await loadMutant<Impl>(REF, {
  swap: [
    /low\[v\] = Math\.min\(low\[v\] as number, disc\[w\] as number\);/,
    "low[v] = Math.min(low[v] as number, low[w] as number);",
  ],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "무리 하나가 먼저 확정되는 입력", n: CROSS_N, edges: CROSS_EDGES },
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

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["스택 검사를 뺀 판", noOnStack],
    ["자식에게서 발견 시각을 받는 판", parentDisc],
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
}

/** 변이 하나를 고정 입력 넷에 걸어 정본과 나란히 놓는다. */
function mutantTable(impl: Impl, name: string): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(stronglyConnectedComponents(c.n, c.edges));
    const b = show(impl.stronglyConnectedComponents(c.n, c.edges));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", name, "판정"], ...rows]).join("\n");
}

/** 답이 안 갈리는 변이를 넓은 입력 무리에 걸어 「몇 벌에서 안 갈리는가」를 센다. */
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

/* ────────────────────────── 수치 ────────────────────────── */

/**
 * $\log_2 (m!)$ — 항목 `m` 개를 **비교만으로** 정렬할 때 필요한 비교 횟수의 최악 하한.
 *
 * **이 하한은 입력 전체에 대한 최악의 하한이지 특정 입력 하나의 하한이 아니다.** 이미
 * 정렬돼 있거나 거꾸로 정렬된 입력 하나만 놓고 보면 그보다 적은 비교로 끝날 수 있다.
 */
function log2Factorial(m: number): number {
  let sum = 0;
  for (let k = 2; k <= m; k++) sum += Math.log2(k);
  return sum;
}

const V_LIMIT = 100_000;
const E_LIMIT = 100_000;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "정점마다의 칸을 만든다"],
  ["③", "정점에 처음 들어간다"],
  ["④", "처음 보는 이웃으로 내려간다"],
  ["⑤", "스택에 있는 정점으로 되돌아간다"],
  ["⑥", "무리가 정해진 정점이라 무시한다"],
  ["⑦", "이웃을 다 본 정점을 뺀다"],
  ["⑧", "무리의 뿌리에서 걷어낸다"],
];

function branchCounts(n: number, edges: Edge[]): number[] {
  const c = counted(n, edges, false);
  return [1, 1, c.enters, c.tree, c.back, c.skip, c.pops, c.roots];
}

/**
 * 걸음 하나가 다루는 자리 — 간선을 읽은 걸음이면 `u→v`, 아니면 정점 번호 하나.
 *
 * **방향을 걸음의 종류가 정한다.** 진입은 부모에서 자식으로 내려간 것이라 `w→v` 이고,
 * 되돌아감과 무시는 지금 정점에서 이웃을 본 것이라 `v→w` 다.
 */
function site(s: Step): string {
  if (s.w === null) return String(s.v);
  return s.kind === "진입" ? `${s.w}→${s.v}` : `${s.v}→${s.w}`;
}

/** `T#` 라벨을 붙인 걸음 표. 첫 걸음이 준비이고 마지막 걸음이 반환이다. */
function walkRows(): string[][] {
  const c = counted(WALK_N, WALK_EDGES);
  const rows: string[][] = [
    [
      "T1",
      "준비",
      "-",
      "①②",
      `[${c.steps[0]?.disc.map(() => "-").join(", ")}]`,
      `[${c.steps[0]?.disc.map(() => "-").join(", ")}]`,
      "[]",
      "[]",
      "이웃 목록과 정점마다의 칸을 만든다",
    ],
  ];
  c.steps.forEach((s, i) => {
    rows.push([
      `T${i + 2}`,
      s.kind,
      site(s),
      s.label,
      `[${s.disc.map((d) => (d < 0 ? "-" : d)).join(", ")}]`,
      `[${s.low.map((d) => (d < 0 ? "-" : d)).join(", ")}]`,
      `[${s.stack.join(", ")}]`,
      `[${s.call.join(", ")}]`,
      s.note,
    ]);
  });
  const last = c.steps[c.steps.length - 1] as Step;
  rows.push([
    `T${c.steps.length + 2}`,
    "반환",
    "-",
    "-",
    `[${last.disc.join(", ")}]`,
    `[${last.low.join(", ")}]`,
    "[]",
    "[]",
    `첫 원소 기준으로 정렬해 ${show(c.groups)} 를 돌려준다`,
  ]);
  return rows;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 쌍마다 두 번 재는 방법이 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [4, 8, 16, 32].map((v) => {
      const edges = completeDag(v);
      const p = pairwise(v, edges);
      const c = counted(v, edges, false);
      return [
        String(v),
        comma(edges.length),
        comma((v * (v - 1)) / 2),
        comma(p.searches),
        comma(p.reads),
        comma(c.reads),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 V",
            "간선 E",
            "정점 쌍",
            "탐색 횟수",
            "쌍마다 재는 간선 읽기",
            "이 글이 만들 절차의 간선 읽기",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 이면`,
      `  정점 쌍       ${comma((V_LIMIT * (V_LIMIT - 1)) / 2)} 개`,
      `  탐색 횟수     쌍마다 두 번이라 ${comma(V_LIMIT * (V_LIMIT - 1))} 번`,
      `  간선 읽기     탐색 하나가 많아야 E 번이므로 ${comma(V_LIMIT * (V_LIMIT - 1) * E_LIMIT)} 번`,
    ].join("\n");
  },

  /** deep.build ③ — 무리의 정의를 도달 집합의 교집합으로 값에 넣어 본다. */
  reachIntersect: () => {
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const f = reachable(WALK_N, WALK_EDGES, v, false);
      const b = reachable(WALK_N, WALK_EDGES, v, true);
      const both = f.set.filter((x) => b.set.includes(x));
      return [
        String(v),
        `{${f.set.join(", ")}}`,
        `{${b.set.join(", ")}}`,
        `{${both.join(", ")}}`,
      ];
    });
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      ...table(
        [
          ["정점 v", "v 에서 갈 수 있는 곳", "v 로 올 수 있는 곳", "교집합"],
          ...rows,
        ],
        [0],
      ),
      "",
      `교집합을 모으면 ${show(c.groups)} 이고 정본이 낸 답과 일치한다`,
      `정점 여섯에 앞뒤 탐색 열둘 · 간선 읽기 ${perVertex(WALK_N, WALK_EDGES).reads} 번`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 세 방식으로 처리하고 실제 계수를 나란히 놓는다. */
  threeWays: () => {
    const p = pairwise(WALK_N, WALK_EDGES);
    const q = perVertex(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      ...table(
        [
          ["처리 방식", "탐색 횟수", "간선 읽기", "결과"],
          [
            "정점 쌍마다 앞뒤로",
            comma(p.searches),
            comma(p.reads),
            show(p.groups),
          ],
          [
            "정점마다 앞뒤로",
            comma(q.searches),
            comma(q.reads),
            show(q.groups),
          ],
          ["깊이 우선 탐색 한 번", "1", comma(c.reads), show(c.groups)],
        ],
        [1, 2],
      ),
      "",
      `세 방식의 결과가 서로 일치하는가  ${
        show(p.groups) === show(q.groups) && show(q.groups) === show(c.groups)
          ? "예"
          : "아니오"
      }`,
      `간선 읽기가 ${p.reads} · ${q.reads} · ${c.reads} 로 갈린다`,
    ].join("\n");
  },

  /** deep.build ⑤ — 「되돌아가는 간선이 있으면 스택 전부가 한 무리」 후보를 반박한다. */
  stackAllCandidate: () => {
    const c = counted(TRAP_N, TRAP_EDGES);
    const rows = c.steps.map((s, i) => [
      `걸음 ${i + 1}`,
      s.kind,
      site(s),
      `[${s.stack.join(", ")}]`,
      `[${s.disc.map((d) => (d < 0 ? "-" : d)).join(", ")}]`,
      `[${s.low.map((d) => (d < 0 ? "-" : d)).join(", ")}]`,
    ]);
    return [
      ...table(
        [["", "무엇", "정점 또는 간선", "스택", "disc", "low"], ...rows],
        [],
      ),
      "",
      `되돌아가는 간선 2→1 을 만난 시점의 스택  [0, 1, 2]`,
      `그 셋을 한 무리로 묶으면                 [[0, 1, 2]]`,
      `정본이 낸 답                             ${show(c.groups)}`,
    ].join("\n");
  },

  /** deep.build ⑤ — 전개 입력의 발견 시각과 되돌아가는 값. */
  discLowFinal: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      c.low[v] === c.disc[v] ? "예" : "아니오",
      `[${(c.groups.find((g) => g.includes(v)) ?? []).join(", ")}]`,
    ]);
    return [
      ...table(
        [
          ["정점 v", "disc(v)", "low(v)", "low = disc 인가", "속한 무리"],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      `low = disc 인 정점  ${Array.from({ length: WALK_N }, (_, v) => v)
        .filter((v) => c.low[v] === c.disc[v])
        .join(" · ")}`,
      `무리의 개수         ${c.groups.length}`,
    ].join("\n");
  },

  /** deep.build ⑥ — low = disc 판정이 실제 무리의 뿌리와 맞는가. */
  rootCriterion: () => {
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["되돌아가는 간선이 없는 입력", LINE_N, LINE_EDGES],
      ["되돌아가는 간선이 하나", TRAP_N, TRAP_EDGES],
      ["무리 하나가 먼저 확정되는 입력", CROSS_N, CROSS_EDGES],
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
        `{${roots.join(", ")}}`,
        String(roots.length),
        String(c.groups.length),
        show(c.groups),
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "V",
            "E",
            "low = disc 인 정점",
            "그 개수",
            "무리 수",
            "무리",
          ],
          ...rows,
        ],
        [1, 2, 4, 5],
      ),
      "",
      `일곱 줄 모두 「그 개수」 와 「무리 수」 가 ${
        rows.every((r) => r[4] === r[5]) ? "일치한다" : "어긋난다"
      }`,
    ].join("\n");
  },

  /** deep.walk — 열일곱 걸음을 값과 함께 편다. */
  walkTrace: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      ...table(
        [
          [
            "걸음",
            "무엇",
            "정점 또는 간선",
            "라벨",
            "disc",
            "low",
            "스택",
            "호출 스택",
            "이 걸음이 한 일",
          ],
          ...walkRows(),
        ],
        [],
      ),
      "",
      `간선 읽기 ${c.reads} · 진입 ${c.enters} · 호출 스택에서 빼기 ${c.pops} · 걷어낸 정점 ${c.lifts} · 무리 ${c.roots}`,
      `스택이 가장 길었을 때 ${c.peakStack} · 호출 스택이 가장 깊었을 때 ${c.peakCall}`,
    ].join("\n");
  },

  /** deep.walk — 여덟 갈래가 전개 입력에서 전부 실행되는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES);
    const b = branchCounts(BRANCH_N, BRANCH_EDGES);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      String(a[i]),
      String(b[i]),
    ]);
    return table(
      [["라벨", "무엇", "전개 입력", "가지가 둘인 사이클"], ...rows],
      [2, 3],
    ).join("\n");
  },

  /** 멈춤 1 — 재귀로 적으면 답은 같은데 깊은 그래프에서 실행이 멈춘다. */
  pauseRecursion: () => {
    const rows = [100, 1_000, 10_000, V_LIMIT].map((v) => {
      const edges = line(v);
      const want = stronglyConnectedComponents(v, edges);
      let got: string;
      try {
        got = `무리 ${comma(recursive(v, edges).length)} 개`;
      } catch {
        got = "호출 스택이 한계를 넘어 실행이 멈춘다";
      }
      const ok = got === `무리 ${comma(want.length)} 개`;
      return [
        comma(v),
        `무리 ${comma(want.length)} 개`,
        got,
        ok ? "같다" : "답이 안 나온다",
      ];
    });
    return [
      ...table(
        [["사슬의 정점 수", "정본", "재귀로 적은 판", "판정"], ...rows],
        [0],
      ),
      "",
      "정확히 어느 정점 수에서 넘치는지는 런타임이 정하는 값이다",
      `제약 상한이 V = ${comma(V_LIMIT)} 이므로 그 값이 어디든 제약 안쪽에 들어온다`,
    ].join("\n");
  },

  /** 멈춤 2 — 스택에 남아 있는지를 안 보면 정점이 통째로 사라진다. */
  pauseOnStack: () => mutantTable(noOnStack, "스택 검사를 뺀 판"),

  /** 멈춤 3 — 자식에게서도 발견 시각을 받으면 무리가 잘게 쪼개진다. */
  pauseParentDisc: () =>
    mutantTable(parentDisc, "자식에게서 발견 시각을 받는 판"),

  /** 멈춤 3 — 반대 방향으로 바꾸면(⑤ 가 disc 대신 low 를 받으면) 어떻게 되는가. */
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
    const same = WIDE_CASES.filter(
      (c) =>
        show(stronglyConnectedComponents(c.n, c.edges)) ===
        show(backLow.stronglyConnectedComponents(c.n, c.edges)),
    ).length;
    return [
      ...table([["입력", "V", "E", "정본과 답이 일치하는가"], ...rows], [1, 2]),
      "",
      `열 벌 중 답이 일치한 것 ${same} 벌`,
      "여기서 잰 것은 이 열 벌뿐이다 — 모든 입력에서 일치한다는 뜻이 아니다",
    ].join("\n");
  },

  /** perf.worst — 간선 목록의 순서가 무엇을 바꾸고 무엇을 안 바꾸는가. */
  orderMatters: () => {
    const inputs: [string, number, Edge[]][] = [
      ["되돌아가는 간선이 없는 사슬 (V = 512)", 512, line(512)],
      ["사이클 하나 (V = 512)", 512, cycle(512)],
      ["가지가 둘인 사이클 (V = 5)", BRANCH_N, BRANCH_EDGES],
      ["사이클 넷을 이은 그래프 (V = 32)", 32, chainOfCycles(4, 8).e],
      ["무작위 희소 (V = 128, E = 256)", 128, randomSparse(128, 256, 424242)],
      ["무작위 희소 (V = 512, E = 1,024)", 512, randomSparse(512, 1_024, 7777)],
    ];
    const rows = inputs.map(([label, n, edges]) => {
      const a = counted(n, edges, false);
      const b = counted(n, edges.slice().reverse(), false);
      return [
        label,
        comma(edges.length),
        `${comma(a.reads)} / ${comma(b.reads)}`,
        `${comma(a.enters + a.pops + a.lifts)} / ${comma(b.enters + b.pops + b.lifts)}`,
        `${comma(a.peakStack)} / ${comma(b.peakStack)}`,
        `${comma(a.compares)} / ${comma(b.compares)}`,
        show(a.groups) === show(b.groups) ? "예" : "아니오",
      ];
    });
    const stackSame = inputs.filter(([, n, e]) => {
      const a = counted(n, e, false);
      const b = counted(n, e.slice().reverse(), false);
      return a.peakStack === b.peakStack;
    }).length;
    return [
      ...table(
        [
          [
            "입력",
            "간선 E",
            "간선 읽기 원래 / 뒤집음",
            "정점 만짐 원래 / 뒤집음",
            "스택 최대 원래 / 뒤집음",
            "정렬 비교 원래 / 뒤집음",
            "무리가 같은가",
          ],
          ...rows,
        ],
        [1],
      ),
      "",
      `여섯 모양 중 스택 최대가 두 순서에서 같은 것 ${stackSame} 모양`,
      "간선 읽기와 정점 만짐은 여섯 모양 모두 두 순서에서 같다",
    ].join("\n");
  },

  /** related — 무리를 점으로 접은 그래프에 사이클이 없는가. */
  condensation: () => {
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["무리 하나가 먼저 확정되는 입력", CROSS_N, CROSS_EDGES],
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
      // 무리를 **찾은 순서**로 번호를 매긴다. 반환값은 첫 원소 기준으로 다시 정렬되므로
      // 찾은 순서는 걸음 기록에서만 나온다.
      const found = counted(n, edges)
        .steps.filter((s) => s.kind === "뿌리")
        .map((s) => s.groups[s.groups.length - 1] as number[]);
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
        backward === 0 ? "예" : "아니오",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "무리 수",
            "무리 안 간선",
            "먼저 찾은 무리로 가는 간선",
            "나중에 찾은 무리로 가는 간선",
            "찾은 순서가 위상 역순인가",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      "무리 사이 간선이 전부 「먼저 찾은 쪽」을 가리키면 접은 그래프에 사이클이 없다",
    ].join("\n");
  },

  /** deep.math ② — 정의 세 항을 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const adj: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const [u, v] of WALK_EDGES) (adj[u] as number[]).push(v);
    const children: number[][] = Array.from({ length: WALK_N }, () => []);
    const backTo: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const s of c.steps) {
      if (s.kind === "진입" && s.w !== null)
        (children[s.w] as number[]).push(s.v);
      if (s.kind === "되돌아감" && s.w !== null)
        (backTo[s.v] as number[]).push(s.w);
    }
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const a = c.disc[v] as number;
      const bs = (backTo[v] as number[]).map((w) => c.disc[w] as number);
      const cs = (children[v] as number[]).map((x) => c.low[x] as number);
      const min = Math.min(a, ...bs, ...cs);
      return [
        String(v),
        String(a),
        bs.length === 0 ? "없다" : bs.join(", "),
        cs.length === 0 ? "없다" : cs.join(", "),
        String(min),
        String(c.low[v]),
        min === c.low[v] ? "일치" : "불일치",
      ];
    });
    return [
      ...table(
        [
          [
            "정점 v",
            "disc(v)",
            "되돌아가는 간선의 disc(w)",
            "자식의 low(c)",
            "셋의 최솟값",
            "실행이 낸 low(v)",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 4, 5],
      ),
      "",
      `간선 읽기 ${c.reads} · 간선 수 ${WALK_EDGES.length} · 두 값이 ${
        c.reads === WALK_EDGES.length ? "일치한다" : "어긋난다"
      }`,
      `정점을 만진 횟수 ${c.enters + c.pops + c.lifts} · 3V = ${3 * WALK_N}`,
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 식에 여러 규모를 넣어 수치를 낸다. */
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
      ...table(
        [
          [
            "정점 V",
            "간선 E",
            "간선 읽기",
            "정점 만짐 3V",
            "합 3V + E",
            "정렬 비교의 상한 2V log2 V",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `V = ${comma(V_LIMIT)} 짜리 사이클 하나를 실제로 실행하면`,
      `  간선 읽기 ${comma(big.reads)} · 정점 만짐 ${comma(big.enters + big.pops + big.lifts)} · 정렬 비교 ${comma(big.compares)}`,
    ].join("\n");
  },

  /** invariant ② — 걸음마다 스택 내용과 두 문장을 대조한다. */
  invariantWatch: () => {
    const c = counted(WALK_N, WALK_EDGES);
    /** 걷어낸 무리가 뿌리와 실제로 서로 오갈 수 있는가 — 도달 집합으로 다시 확인한다. */
    const mutual = (group: number[]): boolean => {
      const r = group[0] as number;
      const f = reachable(WALK_N, WALK_EDGES, r, false).set;
      const b = reachable(WALK_N, WALK_EDGES, r, true).set;
      return group.every((v) => f.includes(v) && b.includes(v));
    };
    const rows = c.steps.map((s, i) => {
      const sorted = s.stack.every(
        (v, k) =>
          k === 0 ||
          (s.disc[s.stack[k - 1] as number] as number) < (s.disc[v] as number),
      );
      const settled = s.groups.flat();
      const clean = s.stack.every((v) => !settled.includes(v));
      const lifted =
        s.kind === "뿌리" ? (s.groups[s.groups.length - 1] as number[]) : null;
      return [
        `T${i + 2}`,
        `[${s.stack.join(", ")}]`,
        `[${s.groups.map((g) => `[${g.join(", ")}]`).join(", ")}]`,
        sorted && clean ? "지킨다" : "깨진다",
        lifted === null ? "-" : mutual(lifted) ? "예" : "아니오",
      ];
    });
    return table(
      [
        [
          "걸음",
          "스택",
          "확정된 무리",
          "두 문장",
          "걷어낸 것이 서로 오갈 수 있는가",
        ],
        ...rows,
      ],
      [],
    ).join("\n");
  },

  /** invariant ② — 경계 입력에서도 같은 문장이 유지되는가. */
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
        "떨어진 두 무리",
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
    return table(
      [["입력", "V", "E", "무리", "간선 읽기", "스택 최대"], ...rows],
      [1, 2, 4, 5],
    ).join("\n");
  },

  /** invariant ③ — 걷어낸 정점의 표시를 안 내리면 무엇이 나오는가. */
  mutantFlagDown: () => mutantTable(noFlagDown, "표시를 안 내리는 판"),

  /** perf.derive — 걸음마다 읽은 간선과 누적. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES);
    let acc = 0;
    const rows = c.steps.map((s, i) => {
      const read = s.w === null ? 0 : 1;
      acc += read;
      return [`T${i + 2}`, s.kind, site(s), String(read), String(acc)];
    });
    return [
      ...table(
        [
          [
            "걸음",
            "무엇",
            "정점 또는 간선",
            "이 걸음이 읽은 간선",
            "여기까지 누적",
          ],
          ...rows,
        ],
        [3, 4],
      ),
      "",
      `이웃 목록을 만드는 데 간선 ${c.builds} 개를 한 번씩 읽는다`,
      `순회하며 읽은 간선 ${c.reads} · 간선 수 ${WALK_EDGES.length}`,
      `진입 ${c.enters} · 호출 스택에서 빼기 ${c.pops} · 걷어내기 ${c.lifts} · 합 ${c.enters + c.pops + c.lifts} = 3V`,
    ].join("\n");
  },

  /** perf.bounds — 모양을 바꿔 가며 계수가 무엇에 달렸는지 잰다. */
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
      comma(c.roots),
      comma(c.compares),
      comma(c.peakStack),
    ]);
    const readsHold = runs.every(([, , edges, c]) => c.reads === edges.length);
    const touchHold = runs.every(
      ([, n, , c]) => c.enters + c.pops + c.lifts === 3 * n,
    );
    return [
      ...table(
        [
          [
            "입력",
            "간선 E",
            "간선 읽기",
            "정점 만짐",
            "무리 수",
            "정렬 비교",
            "스택 최대",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `모든 줄에서 간선 읽기 = E 인가  ${readsHold ? "예" : "아니오"}`,
      `모든 줄에서 정점 만짐 = 3V 인가  ${touchHold ? "예" : "아니오"}`,
      "갈리는 것은 정렬 비교와 스택 최대 둘뿐이다",
      "",
      `V = 1,024 짜리 입력의 정렬 비교는 ${comma(
        Math.min(
          ...runs.filter(([, n]) => n === 1_024).map(([, , , c]) => c.compares),
        ),
      )} 에서 ${comma(
        Math.max(
          ...runs.filter(([, n]) => n === 1_024).map(([, , , c]) => c.compares),
        ),
      )} 사이다`,
      `견줄 값 — 항목 1,024 개를 비교로 정렬할 때의 최악 하한 log2(1024!) = ${comma(
        Math.round(log2Factorial(1_024)),
      )}`,
    ].join("\n");
  },

  /** perf.worst — 모양을 바꿔도 간선 읽기가 안 갈리는지 실행으로 확인한다. */
  worstShape: () => {
    const V = 512;
    const inputs: [string, number, Edge[]][] = [
      ["간선 없음", V, []],
      ["되돌아가는 간선이 없는 사슬", V, line(V)],
      ["사슬을 간선 목록에 거꾸로 적은 것", V, line(V).slice().reverse()],
      ["사이클 하나", V, cycle(V)],
      ["사이클 256 개", V, chainOfCycles(256, 2).e],
      [
        "별 모양 — 한 정점에서 나머지 전부로",
        V,
        Array.from({ length: V - 1 }, (_, i) => [0, i + 1] as Edge),
      ],
    ];
    const runs = inputs.map(
      ([label, n, edges]) => [label, edges, counted(n, edges, false)] as const,
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
      ...table(
        [
          [
            "모양 (V = 512)",
            "간선 E",
            "간선 읽기",
            "정점 만짐",
            "스택 최대",
            "호출 스택 최대",
            "정렬 비교",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `여섯 모양 모두 간선 읽기 = E 인가  ${readsHold ? "예" : "아니오"}`,
      `여섯 모양 모두 정점 만짐 = 3V = ${comma(3 * V)} 인가  ${touchHold ? "예" : "아니오"}`,
      "스택 최대와 정렬 비교만 모양을 따라 갈린다",
    ].join("\n");
  },

  /** perf.worst — 규모를 늘려 가며 최악 모양의 계수가 어떻게 자라는가. */
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
    return [
      ...table(
        [
          [
            "정점 V",
            "읽기 + 만짐",
            "직전 줄의 몇 배",
            "정렬 비교",
            "직전 줄의 몇 배",
            "스택 최대",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "정점 수를 4 배로 늘렸을 때 두 「몇 배」 열이 어떻게 갈리는지가 이 표의 값이다",
      `스택 최대는 줄마다 V 와 ${runs.every(([v, a]) => a.peakStack === v) ? "같다" : "다르다"}`,
    ].join("\n");
  },
};
