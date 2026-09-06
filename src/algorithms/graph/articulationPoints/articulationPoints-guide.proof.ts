/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/articulationPoints/articulationPoints-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「단절점」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { articulationPoints } from "./articulationPoints-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 다섯 · 무향 간선 다섯.
 *
 * 아홉 갈래를 한 입력에서 전부 실행한다. `2−0` 이 되돌아가는 간선 갈래를 내고, 뿌리 0 이 나무
 * 자식 둘(1 과 3)을 가져 뿌리 전용 판정이 참으로 실행된다. 정점 4 는 자식이 없는 잎이라
 * `low` 가 자기 진입 시각에 그대로 남는다.
 */
export const WALK_N = 5;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 4],
];

/** 사이클 하나. 단절점이 하나도 없다. */
export const RING_N = 4;
export const RING_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

/** 삼각형에 정점 하나가 매달린 그래프. 판정의 등호가 갈리는 자리다. */
export const TAIL_N = 4;
export const TAIL_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
];

/** 삼각형 둘이 정점 하나를 함께 쓰는 그래프. */
export const SHARE_N = 5;
export const SHARE_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [1, 3],
  [3, 4],
  [4, 1],
];

/** 삼각형 둘을 간선 하나가 잇는 그래프. 그 간선의 두 끝이 단절점이다. */
export const BRIDGE_N = 6;
export const BRIDGE_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** 떨어진 두 성분. 바깥 반복이 두 번 탐색을 시작한다. */
export const SPLIT_N = 7;
export const SPLIT_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
];

/* ── 두 끝이 같은 간선이 든 입력 — 그 간선을 거르는 줄이 실제로 실행되는 자리다 ── */

/** 삼각형에 두 끝이 같은 간선 하나. */
export const LOOP_A_N = 3;
export const LOOP_A_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 2],
  [2, 0],
];

/** 전개 입력에 두 끝이 같은 간선 둘을 더한 것. */
export const LOOP_B_N = 5;
export const LOOP_B_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 4],
  [4, 4],
];

/** 꼬리가 붙은 삼각형에 두 끝이 같은 간선 하나. */
export const LOOP_C_N = 4;
export const LOOP_C_EDGES: Edge[] = [
  [1, 1],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
];

/** 두 끝이 같은 간선만 있는 그래프. */
export const LOOP_D_N = 3;
export const LOOP_D_EDGES: Edge[] = [
  [0, 0],
  [1, 1],
  [2, 2],
];

/* ────────────────────────── 그래프 생성 ────────────────────────── */

/** 사슬 `0−1− … −(v−1)`. 양 끝을 뺀 정점 전부가 단절점이다. */
export function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1]);
  return edges;
}

/** 사이클 `0−1− … −(v−1)−0`. 단절점이 없다. */
export function ring(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) edges.push([i, (i + 1) % v]);
  return edges;
}

/** 별 — 정점 0 에서 나머지 전부로. 정점 0 하나만 단절점이다. */
export function star(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i]);
  return edges;
}

/** 완전 그래프 — 정점 쌍마다 간선 하나. 단절점이 없다. */
export function complete(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < v; u++) {
    for (let x = u + 1; x < v; x++) edges.push([u, x]);
  }
  return edges;
}

/** 크기 `m` 인 삼각형 `k` 개를 한 줄로 이은 그래프. */
export function beads(k: number, m: number): { n: number; e: Edge[] } {
  const e: Edge[] = [];
  for (let c = 0; c < k; c++) {
    const base = c * m;
    for (let i = 0; i < m; i++) e.push([base + i, base + ((i + 1) % m)]);
    if (c + 1 < k) e.push([base + m - 1, base + m]);
  }
  return { n: k * m, e };
}

/**
 * 무작위 그래프. 생성식을 시드로 고정한다.
 *
 * **곱셈 하나짜리 생성식을 쓰지 않는다.** `seed = (seed * a + c) & 0x7fffffff` 는 아래 비트의
 * 주기가 짧아서, 정점 수처럼 2 의 거듭제곱으로 나눈 나머지를 뽑으면 몇십 걸음 만에 같은 간선이
 * 되풀이된다. 그래서 비트를 섞는 생성식으로 둔다.
 */
export function scatter(v: number, m: number, seed0: number): Edge[] {
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

/** `[0, 3]` 꼴 — 본문 표기와 같다. */
const show = (a: number[]): string => `[${a.join(", ")}]`;

/** `[[0, 1, 2], [0, 3]]` 꼴. */
const show2 = (gs: number[][]): string =>
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

/** 캡션 줄 여럿을 이름 칸에 맞춰 낸다. 값 칸은 왼쪽으로 맞춘다. */
function captions(rows: [string, string][], indent = "  "): string[] {
  const w = Math.max(...rows.map(([k]) => width(k)));
  return rows.map(([k, v]) =>
    `${indent}${pad(k, w)}  ${v}`.replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 걸음 하나의 기록. `label` 이 이 걸음이 실행한 갈래의 원문자다. */
export interface Step {
  kind: string;
  label: string;
  v: number;
  w: number | null;
  disc: number[];
  low: number[];
  call: number[];
  cut: number[];
  note: string;
  reads: number;
}

export interface Counts {
  cut: number[];
  disc: number[];
  low: number[];
  /** 정점의 부모. 뿌리는 `-1`. */
  parent: number[];
  steps: Step[];
  /** 간선 목록을 읽은 횟수 — 이웃 목록을 만들며 한 번씩. */
  builds: number;
  /** 두 끝이 같아서 이웃 목록에 안 담은 간선의 수. */
  loops: number;
  /** 순회하며 읽은 이웃 자리. */
  reads: number;
  /** 정점에 처음 들어간 횟수. */
  enters: number;
  /** 호출 스택에서 정점을 뺀 횟수. */
  pops: number;
  /** 바깥 반복이 탐색을 시작한 횟수 — 연결 성분의 개수다. */
  roots: number;
  /** 갈래별 실행 횟수 — 나무 간선 · 되돌아가는 간선 · 부모 방향. */
  tree: number;
  back: number;
  same: number;
  /** 뿌리가 아닌 정점을 단절점으로 적은 횟수. */
  marks: number;
  /** 뿌리를 단절점으로 적은 횟수. */
  rootMarks: number;
  /** 호출 스택이 가장 깊었을 때의 항목 수. */
  peakCall: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: number, edges: Edge[], record = true): Counts {
  const adj: number[][] = Array.from({ length: n }, () => []);
  let builds = 0;
  let loops = 0;
  for (const [u, v] of edges) {
    builds++;
    if (u === v) {
      loops++;
      continue;
    }
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const cut: boolean[] = Array.from({ length: n }, () => false);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const steps: Step[] = [];
  let timer = 0;
  let reads = 0;
  let enters = 0;
  let pops = 0;
  let roots = 0;
  let tree = 0;
  let back = 0;
  let same = 0;
  let marks = 0;
  let rootMarks = 0;
  let peakCall = 0;

  const callV: number[] = [];
  const callI: number[] = [];
  const callP: number[] = [];
  const marked = (): number[] => {
    const out: number[] = [];
    for (let v = 0; v < n; v++) if (cut[v] === true) out.push(v);
    return out;
  };
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
      call: callV.slice(),
      cut: marked(),
      note,
      reads,
    });
  };
  const enter = (v: number, from: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callP.push(from);
    parent[v] = from;
    enters++;
    peakCall = Math.max(peakCall, callV.length);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    roots++;
    let rootKids = 0;
    enter(root, -1);
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
          if (v === root) rootKids++;
          enter(w, v);
          snap("진입", "④③", w, v, `disc[${w}] = low[${w}] = ${disc[w]}`);
        } else if (w !== (callP[callP.length - 1] as number)) {
          back++;
          low[v] = Math.min(low[v] as number, disc[w] as number);
          snap("되돌아감", "⑤", v, w, `low[${v}] = ${low[v]}`);
        } else {
          same++;
          snap("부모 방향", "⑥", v, w, `low[${v}] 그대로 ${low[v]}`);
        }
        continue;
      }

      callV.pop();
      callI.pop();
      pops++;
      const from = callP.pop() as number;
      if (from === -1) {
        snap("복귀", "⑦", v, null, `호출 스택이 비었다`);
      } else {
        low[from] = Math.min(low[from] as number, low[v] as number);
        if (from !== root && (low[v] as number) >= (disc[from] as number)) {
          cut[from] = true;
          marks++;
          snap(
            "판정",
            "⑦⑧",
            v,
            null,
            `low[${v}] = ${low[v]} >= disc[${from}] = ${disc[from]} 이라 ${from} 은 단절점`,
          );
        } else {
          snap("복귀", "⑦", v, null, `low[${from}] = ${low[from]}`);
        }
      }
    }

    if (rootKids >= 2) {
      cut[root] = true;
      rootMarks++;
    }
    snap(
      "뿌리 판정",
      "⑨",
      root,
      null,
      `뿌리 ${root} 의 나무 자식 ${rootKids} 개 — ${rootKids >= 2 ? "단절점이다" : "단절점이 아니다"}`,
    );
  }

  return {
    cut: marked(),
    disc,
    low,
    parent,
    steps,
    builds,
    loops,
    reads,
    enters,
    pops,
    roots,
    tree,
    back,
    same,
    marks,
    rootMarks,
    peakCall,
  };
}

/** 재귀로 적은 판. 절차는 정본과 같고 호출 스택만 자바스크립트에 맡긴다. */
export function recursive(n: number, edges: Edge[]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const cut: boolean[] = Array.from({ length: n }, () => false);
  let timer = 0;
  let root = 0;
  const dfs = (v: number, parent: number): number => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    let kids = 0;
    for (const w of adj[v] as number[]) {
      if (disc[w] === -1) {
        kids++;
        dfs(w, v);
        low[v] = Math.min(low[v] as number, low[w] as number);
        if (v !== root && (low[w] as number) >= (disc[v] as number)) {
          cut[v] = true;
        }
      } else if (w !== parent) {
        low[v] = Math.min(low[v] as number, disc[w] as number);
      }
    }
    return kids;
  };
  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    root = s;
    if (dfs(s, -1) >= 2) cut[s] = true;
  }
  const out: number[] = [];
  for (let v = 0; v < n; v++) if (cut[v] === true) out.push(v);
  return out;
}

/** 정점을 하나씩 지우고 연결 성분 수를 다시 세는 방법. 배열 접근을 센다. */
export function byDeletion(
  n: number,
  edges: Edge[],
): { cut: number[]; reads: number; visits: number; scans: number } {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  let reads = 0;
  let visits = 0;
  let scans = 0;
  const components = (skip: number): number => {
    scans++;
    const seen: boolean[] = Array.from({ length: n }, () => false);
    let count = 0;
    for (let s = 0; s < n; s++) {
      if (s === skip || seen[s] === true) continue;
      count++;
      seen[s] = true;
      visits++;
      const stack = [s];
      while (stack.length > 0) {
        const v = stack.pop() as number;
        for (const w of adj[v] as number[]) {
          reads++;
          if (w !== skip && seen[w] !== true) {
            seen[w] = true;
            visits++;
            stack.push(w);
          }
        }
      }
    }
    return count;
  };
  const base = components(-1);
  const cut: number[] = [];
  for (let v = 0; v < n; v++) if (components(v) > base) cut.push(v);
  return { cut, reads, visits, scans };
}

/** 정점 하나를 지운 뒤의 연결 성분 개수. `skip` 이 `-1` 이면 아무것도 안 지운다. */
export function componentCount(n: number, edges: Edge[], skip: number): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (s === skip || seen[s] === true) continue;
    count++;
    seen[s] = true;
    const stack = [s];
    while (stack.length > 0) {
      const v = stack.pop() as number;
      for (const w of adj[v] as number[]) {
        if (w !== skip && seen[w] !== true) {
          seen[w] = true;
          stack.push(w);
        }
      }
    }
  }
  return count;
}

/**
 * 깊이 우선 탐색이 만든 나무. 나무 간선과 되돌아가는 간선을 갈라 돌려준다.
 *
 * `subtree(v)` 는 `v` 의 나무 아래에 있는 정점 전부(자기 포함)다.
 */
export function tree(
  n: number,
  edges: Edge[],
): {
  disc: number[];
  parent: number[];
  treeEdges: Edge[];
  backEdges: Edge[];
  subtree: number[][];
} {
  const c = counted(n, edges, false);
  const treeEdges: Edge[] = [];
  const backEdges: Edge[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  for (let v = 0; v < n; v++) {
    const p = c.parent[v] as number;
    if (p !== -1) treeEdges.push([p, v]);
  }
  for (const [u, v] of edges) {
    if (u === v) continue;
    if ((c.parent[v] as number) === u || (c.parent[u] as number) === v)
      continue;
    const a = (c.disc[u] as number) < (c.disc[v] as number) ? u : v;
    const b = a === u ? v : u;
    backEdges.push([b, a]);
  }
  const subtree: number[][] = Array.from({ length: n }, () => []);
  const order = Array.from({ length: n }, (_, v) => v).sort(
    (a, b) => (c.disc[b] as number) - (c.disc[a] as number),
  );
  for (const v of order) {
    (subtree[v] as number[]).push(v);
    const p = c.parent[v] as number;
    if (p !== -1) (subtree[p] as number[]).push(...(subtree[v] as number[]));
  }
  for (const s of subtree) s.sort((a, b) => a - b);
  return { disc: c.disc, parent: c.parent, treeEdges, backEdges, subtree };
}

/**
 * 정의에서 「부모 방향을 뺀다」를 지웠을 때의 값.
 *
 * 되돌아가는 간선의 집합에 **부모로 가는 간선까지** 넣고 같은 최솟값을 계산한다. 변이가 아니라
 * **다른 정의를 계산한 것**이다 — 그 정의가 답을 바꾸는지는 기계로 만든 변이가 따로 판정한다.
 */
export function lowWithParent(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const out = t.disc.slice();
  const order = Array.from({ length: n }, (_, v) => v).sort(
    (a, b) => (t.disc[b] as number) - (t.disc[a] as number),
  );
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  for (const v of order) {
    for (const w of adj[v] as number[]) {
      if ((t.disc[w] as number) < (t.disc[v] as number)) {
        out[v] = Math.min(out[v] as number, t.disc[w] as number);
      }
    }
    const p = t.parent[v] as number;
    if (p !== -1) out[p] = Math.min(out[p] as number, out[v] as number);
  }
  return out;
}

/**
 * 정의를 그대로 계산한 `low` — `v` 의 나무 아래에서 되돌아가는 간선 하나로 이르는 정점의 진입
 * 시각과 `disc(v)` 를 통틀어 가장 작은 값.
 *
 * 절차가 낸 값과 이것을 맞대는 것이 `invariant` 절의 뒤 문장을 재는 자리다. 절차의 순서를 안
 * 쓰고 나무와 간선 분류에서 바로 계산하므로, 두 값이 같다는 것이 그 문장의 근거가 된다.
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

/**
 * 이중 연결 성분(블록) — 간선 스택을 들어 간선을 무리로 가른다.
 *
 * `related` 절이 쓰는 값이다. 단절점은 이 무리 둘 이상에 함께 나오는 정점이고, 그것이 정본이
 * 낸 답과 같은지를 `자기대조()` 가 확인한다.
 */
export function blocks(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  let timer = 0;
  const stack: Edge[] = [];
  const out: number[][] = [];
  const callV: number[] = [];
  const callI: number[] = [];
  const callP: number[] = [];
  const enter = (v: number, from: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callP.push(from);
  };
  const lift = (v: number, parent: number): void => {
    const seen = new Set<number>();
    while (stack.length > 0) {
      const e = stack[stack.length - 1] as Edge;
      if ((disc[e[0]] as number) < (disc[v] as number)) break;
      stack.pop();
      seen.add(e[0]);
      seen.add(e[1]);
    }
    const top = stack.pop();
    if (top !== undefined) {
      seen.add(top[0]);
      seen.add(top[1]);
    }
    if (seen.size > 0) out.push([...seen].sort((a, b) => a - b));
    void parent;
  };
  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    enter(root, -1);
    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];
      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        if (disc[w] === -1) {
          stack.push([v, w]);
          enter(w, v);
        } else if (
          w !== (callP[callP.length - 1] as number) &&
          (disc[w] as number) < (disc[v] as number)
        ) {
          stack.push([v, w]);
          low[v] = Math.min(low[v] as number, disc[w] as number);
        }
        continue;
      }
      callV.pop();
      callI.pop();
      const from = callP.pop() as number;
      if (from !== -1) {
        low[from] = Math.min(low[from] as number, low[v] as number);
        if ((low[v] as number) >= (disc[from] as number)) lift(v, from);
      }
    }
  }
  return out.sort((a, b) => (a[0] as number) - (b[0] as number));
}

/** 블록 둘 이상에 함께 나오는 정점 — 블록-컷 나무에서 갈림 자리가 되는 정점이다. */
export function sharedByBlocks(n: number, edges: Edge[]): number[] {
  const seen: number[] = Array.from({ length: n }, () => 0);
  for (const b of blocks(n, edges))
    for (const v of b) seen[v] = (seen[v] as number) + 1;
  const out: number[] = [];
  for (let v = 0; v < n; v++) if ((seen[v] as number) >= 2) out.push(v);
  return out;
}

/* ────────────────────── 사본 자기대조 ────────────────────── */

const 자기대조_입력: [number, Edge[]][] = [
  [WALK_N, WALK_EDGES],
  [RING_N, RING_EDGES],
  [TAIL_N, TAIL_EDGES],
  [SHARE_N, SHARE_EDGES],
  [BRIDGE_N, BRIDGE_EDGES],
  [SPLIT_N, SPLIT_EDGES],
  [LOOP_A_N, LOOP_A_EDGES],
  [LOOP_B_N, LOOP_B_EDGES],
  [LOOP_C_N, LOOP_C_EDGES],
  [LOOP_D_N, LOOP_D_EDGES],
  [16, chain(16)],
  [16, ring(16)],
  [16, star(16)],
  [12, complete(12)],
  [12, beads(4, 3).e],
  [64, scatter(64, 96, 20260906)],
  [128, scatter(128, 256, 424242)],
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [n, edges] of 자기대조_입력) {
    const ref = show(articulationPoints(n, edges));
    if (show(counted(n, edges, false).cut) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
    if (show(byDeletion(n, edges).cut) !== ref) {
      throw new Error("정점을 지워 보는 사본이 정본과 다른 답을 낸다");
    }
    if (show(sharedByBlocks(n, edges)) !== ref) {
      throw new Error("블록으로 가르는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./articulationPoints-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  articulationPoints(n: number, edges: Edge[]): number[];
}

/** 두 끝이 같은 간선을 거르는 줄을 뺀 사본. */
const keepLoops = await loadMutant<Impl>(REF, {
  drop: /if \(u === v\) continue;/,
});

/** 부모 방향인지를 안 보고 이미 들어갔던 정점이면 전부 되돌아가는 간선으로 둔 사본. */
const noParent = await loadMutant<Impl>(REF, {
  swap: [
    /\} else if \(w !== \(callP\[callP\.length - 1\] as number\)\) \{/,
    "} else if (true) {",
  ],
});

/** 판정의 등호를 뺀 사본. */
const strictly = await loadMutant<Impl>(REF, {
  swap: [
    /if \(parent !== root && \(low\[v\] as number\) >= \(disc\[parent\] as number\)\) \{/,
    "if (parent !== root && (low[v] as number) > (disc[parent] as number)) {",
  ],
});

/** 뿌리를 빼 두는 조건을 뺀 사본 — 뿌리에도 같은 규칙을 적용한다. */
const rootToo = await loadMutant<Impl>(REF, {
  swap: [
    /if \(parent !== root && \(low\[v\] as number\) >= \(disc\[parent\] as number\)\) \{/,
    "if ((low[v] as number) >= (disc[parent] as number)) {",
  ],
});

/** **불변식을 지키던 줄** 하나 — 자식의 `low` 를 부모에게 전달하는 줄을 뺀 사본. */
const noPass = await loadMutant<Impl>(REF, {
  drop: /low\[parent\] = Math\.min\(low\[parent\] as number, low\[v\] as number\);/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof`
 * 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = strictly.articulationPoints === articulationPoints;

const 갈리는_변이: { label: string; impl: Impl; cases: [number, Edge[]][] }[] =
  [
    {
      label: "등호를 뺀 판",
      impl: strictly,
      cases: [
        [TAIL_N, TAIL_EDGES],
        [SHARE_N, SHARE_EDGES],
        [BRIDGE_N, BRIDGE_EDGES],
      ],
    },
    {
      label: "뿌리에도 같은 규칙을 적용한 판",
      impl: rootToo,
      cases: [
        [WALK_N, WALK_EDGES],
        [RING_N, RING_EDGES],
        [TAIL_N, TAIL_EDGES],
      ],
    },
    {
      label: "자식의 low 를 안 전달하는 판",
      impl: noPass,
      cases: [
        [RING_N, RING_EDGES],
        [SHARE_N, SHARE_EDGES],
        [BRIDGE_N, BRIDGE_EDGES],
      ],
    },
  ];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(
        ([n, e]) =>
          show(articulationPoints(n, e)) ===
          show(impl.articulationPoints(n, e)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  impl: Impl,
  name: string,
  cases: [string, number, Edge[]][],
): string {
  const rows = cases.map(([label, n, e]) => {
    const a = show(articulationPoints(n, e));
    const b = show(impl.articulationPoints(n, e));
    return [label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", name, "판정"], ...rows]).join("\n");
}

const 변이_입력: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["사이클 하나", RING_N, RING_EDGES],
  ["꼬리가 붙은 삼각형", TAIL_N, TAIL_EDGES],
  ["삼각형 둘이 정점 하나를 공유", SHARE_N, SHARE_EDGES],
  ["삼각형 둘을 간선 하나가 잇는다", BRIDGE_N, BRIDGE_EDGES],
  ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
];

const 자기간선_입력: [string, number, Edge[]][] = [
  ["삼각형 + 두 끝이 같은 간선 하나", LOOP_A_N, LOOP_A_EDGES],
  ["전개 입력 + 두 끝이 같은 간선 둘", LOOP_B_N, LOOP_B_EDGES],
  ["꼬리가 붙은 삼각형 + 그 간선 하나", LOOP_C_N, LOOP_C_EDGES],
  ["두 끝이 같은 간선만", LOOP_D_N, LOOP_D_EDGES],
];

/* ────────────────────────── 수치 ────────────────────────── */

const V_LIMIT = 100_000;
const E_LIMIT = 100_000;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "정점마다의 칸을 만든다"],
  ["③", "정점에 처음 들어간다"],
  ["④", "처음 보는 이웃으로 내려간다"],
  ["⑤", "되돌아가는 간선에서 값을 내린다"],
  ["⑥", "부모 방향이라 아무것도 안 한다"],
  ["⑦", "이웃을 다 본 정점을 뺀다"],
  ["⑧", "뿌리가 아닌 부모를 단절점으로 적는다"],
  ["⑨", "뿌리를 자식 수로 판정한다"],
];

function branchCounts(n: number, edges: Edge[]): number[] {
  const c = counted(n, edges, false);
  return [1, 1, c.enters, c.tree, c.back, c.same, c.pops, c.marks, c.roots];
}

/**
 * 걸음 하나가 다루는 자리 — 간선을 읽은 걸음이면 `u−v`, 아니면 정점 번호 하나.
 *
 * **방향을 걸음의 종류가 정한다.** 진입은 부모에서 자식으로 내려간 것이라 `w−v` 이고,
 * 되돌아감과 부모 방향은 지금 정점에서 이웃을 본 것이라 `v−w` 다.
 */
function site(s: Step): string {
  if (s.w === null) return String(s.v);
  return s.kind === "진입" ? `${s.w}−${s.v}` : `${s.v}−${s.w}`;
}

const dash = (a: number[]): string =>
  `[${a.map((d) => (d < 0 ? "-" : d)).join(", ")}]`;

/** `T#` 라벨을 붙인 걸음 표. 첫 걸음이 준비이고 마지막 걸음이 반환이다. */
function walkRows(): string[][] {
  const c = counted(WALK_N, WALK_EDGES);
  const empty = `[${Array.from({ length: WALK_N }, () => "-").join(", ")}]`;
  const rows: string[][] = [
    [
      "T1",
      "준비",
      "-",
      "①②",
      empty,
      empty,
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
      dash(s.disc),
      dash(s.low),
      show(s.call),
      show(s.cut),
      s.note,
    ]);
  });
  const last = c.steps[c.steps.length - 1] as Step;
  rows.push([
    `T${c.steps.length + 2}`,
    "반환",
    "-",
    "-",
    dash(last.disc),
    dash(last.low),
    "[]",
    show(c.cut),
    `${show(c.cut)} 를 돌려준다`,
  ]);
  return rows;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 정의를 그대로 옮긴 방법을 전개 입력에 실행한다. */
  deleteScan: () => {
    const base = componentCount(WALK_N, WALK_EDGES, -1);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const after = componentCount(WALK_N, WALK_EDGES, v);
      return [
        String(v),
        String(base),
        String(after),
        after > base ? "늘었다" : "그대로다",
        after > base ? "단절점" : "단절점이 아니다",
      ];
    });
    const d = byDeletion(WALK_N, WALK_EDGES);
    return [
      ...table(
        [
          ["지운 정점", "지우기 전 성분 수", "지운 뒤 성분 수", "변화", "판정"],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      ...captions([
        ["단절점", show(d.cut)],
        [
          "탐색 횟수",
          `${d.scans} 번 — 아무것도 안 지운 한 번과 정점마다 한 번`,
        ],
        ["이웃 자리 읽기", `${comma(d.reads)} 번`],
      ]),
    ].join("\n");
  },

  /** deep.build ② — 그 방법이 규모에서 몇 번이 되는가. */
  deleteScale: () => {
    const rows = [4, 8, 16, 32, 64].map((v) => {
      const edges = chain(v);
      const d = byDeletion(v, edges);
      const c = counted(v, edges, false);
      return [
        String(v),
        String(edges.length),
        comma(d.scans),
        comma(d.reads),
        comma(c.reads),
        comma(Math.round((d.reads / c.reads) * 10) / 10),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 V",
            "간선 E",
            "탐색 횟수",
            "지워 보는 방법의 읽기",
            "이 글이 만들 절차의 읽기",
            "몇 배",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 인 사슬이면`,
      ...captions([
        ["탐색 횟수", `${comma(V_LIMIT + 1)} 번`],
        [
          "지워 보는 방법의 읽기",
          `한 번이 이웃 자리를 많아야 ${comma(2 * E_LIMIT)} 개 읽으므로 ${comma((V_LIMIT + 1) * 2 * E_LIMIT)} 번`,
        ],
        ["이 글이 만들 절차의 읽기", `${comma(2 * (V_LIMIT - 1))} 번`],
      ]),
    ].join("\n");
  },

  /** deep.build ③ — 깊이 우선 탐색이 만든 나무와 간선 두 갈래. */
  treeSplit: () => {
    const t = tree(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(t.disc[v]),
      (t.parent[v] as number) === -1 ? "없다" : String(t.parent[v]),
      `{${(t.subtree[v] as number[]).join(", ")}}`,
    ]);
    return [
      ...table(
        [["정점 v", "disc(v)", "부모", "v 의 나무 아래"], ...rows],
        [0, 1, 2],
      ),
      "",
      ...captions([
        ["나무 간선", t.treeEdges.map(([a, b]) => `${a}−${b}`).join(" · ")],
        [
          "되돌아가는 간선",
          t.backEdges.map(([a, b]) => `${a}−${b}`).join(" · "),
        ],
        [
          "간선 수",
          `나무 간선 ${t.treeEdges.length} + 되돌아가는 간선 ${t.backEdges.length} = ${WALK_EDGES.length}`,
        ],
      ]),
    ].join("\n");
  },

  /**
   * deep.build ⑤ — 「자식의 나무 아래에 되돌아가는 간선이 있으면 그 부모는 단절점이 아니다」
   * 후보를 반박한다. 나무 간선마다 그 판정과 실제를 나란히 놓는다.
   */
  firstCandidate: () => {
    const t = tree(BRIDGE_N, BRIDGE_EDGES);
    const truth = articulationPoints(BRIDGE_N, BRIDGE_EDGES);
    const rows = t.treeEdges.map(([p, c]) => {
      const inside = t.backEdges.filter(([b]) =>
        (t.subtree[c] as number[]).includes(b),
      );
      const guess = inside.length > 0 ? "단절점이 아니다" : "단절점";
      const real =
        (t.parent[p] as number) === -1
          ? "뿌리라 이 규칙을 안 쓴다"
          : truth.includes(p)
            ? "단절점"
            : "단절점이 아니다";
      return [
        `${p}−${c}`,
        `{${(t.subtree[c] as number[]).join(", ")}}`,
        inside.length === 0
          ? "없다"
          : inside.map(([b, a]) => `${b}−${a}`).join(" · "),
        guess,
        real,
        real.startsWith("뿌리") ? "-" : guess === real ? "맞다" : "틀리다",
      ];
    });
    const wrong = rows.filter((r) => r[5] === "틀리다").map((r) => r[0]);
    return [
      ...table([
        [
          "나무 간선 부모−자식",
          "자식의 나무 아래",
          "그 안에서 나가는 되돌아가는 간선",
          "후보의 판정",
          "실제",
          "대조",
        ],
        ...rows,
      ]),
      "",
      ...captions([
        [
          "되돌아가는 간선",
          t.backEdges.map(([b, a]) => `${b}−${a}`).join(" · "),
        ],
        ["후보가 틀린 나무 간선", `${wrong.join(" · ")} — ${wrong.length} 개`],
        ["후보가 낸 답", "[]"],
        ["실제 단절점", show(truth)],
      ]),
    ].join("\n");
  },

  /** deep.build ⑤ — 전개 입력의 진입 시각과 거슬러 도달하는 최소 진입 시각. */
  discLowFinal: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const t = tree(WALK_N, WALK_EDGES);
    const kids: number[][] = Array.from({ length: WALK_N }, () => []);
    for (let v = 0; v < WALK_N; v++) {
      const p = c.parent[v] as number;
      if (p !== -1) (kids[p] as number[]).push(v);
    }
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const list = kids[v] as number[];
      const hit = list.filter(
        (x) => (c.low[x] as number) >= (c.disc[v] as number),
      );
      return [
        String(v),
        String(c.disc[v]),
        String(c.low[v]),
        list.length === 0 ? "없다" : list.join(", "),
        list.length === 0
          ? "-"
          : list.map((x) => `low(${x}) = ${c.low[x]}`).join(" · "),
        (c.parent[v] as number) === -1
          ? `뿌리 — 자식 ${list.length} 개`
          : hit.length > 0
            ? "단절점"
            : "단절점이 아니다",
      ];
    });
    void t;
    return [
      ...table(
        [
          [
            "정점 v",
            "disc(v)",
            "low(v)",
            "v 의 나무 자식",
            "자식의 low",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      ...captions([
        ["단절점", show(c.cut)],
        [
          "뿌리",
          `0 — 나무 자식 ${(kids[0] as number[]).length} 개라 뿌리 규칙으로 단절점`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ⑥ — 판정이 여러 모양에서 실제 단절점과 맞는가. */
  criterionCheck: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["꼬리가 붙은 삼각형", TAIL_N, TAIL_EDGES],
      ["삼각형 둘이 정점 하나를 공유", SHARE_N, SHARE_EDGES],
      ["삼각형 둘을 간선 하나가 잇는다", BRIDGE_N, BRIDGE_EDGES],
      ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
      ["사슬 (V = 8)", 8, chain(8)],
      ["별 (V = 8)", 8, star(8)],
      ["완전 그래프 (V = 8)", 8, complete(8)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      const d = byDeletion(n, e);
      return [
        label,
        String(n),
        String(e.length),
        show(c.cut),
        show(d.cut),
        show(c.cut) === show(d.cut) ? "예" : "아니오",
      ];
    });
    const agree = rows.filter((r) => r[5] === "예").length;
    return [
      ...table(
        [
          [
            "입력",
            "V",
            "E",
            "두 수로 낸 답",
            "정점을 지워 본 답",
            "두 답이 같은가",
          ],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      `아홉 줄 모두 두 열이 같은가  ${agree === rows.length ? "예" : "아니오"}`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음 표. */
  walkTrace: () => {
    return table([
      [
        "걸음",
        "무엇",
        "정점 또는 간선",
        "라벨",
        "disc",
        "low",
        "호출 스택",
        "단절점",
        "이 걸음이 한 일",
      ],
      ...walkRows(),
    ]).join("\n");
  },

  /** deep.walk — 아홉 갈래가 두 입력에서 각각 몇 번 실행됐는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES);
    const b = branchCounts(BRIDGE_N, BRIDGE_EDGES);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      String(a[i]),
      String(b[i]),
    ]);
    return table(
      [
        ["라벨", "무엇", "전개 입력", "삼각형 둘을 간선 하나가 잇는다"],
        ...rows,
      ],
      [2, 3],
    ).join("\n");
  },

  /** 멈춤 — 두 끝이 같은 간선을 거르는 줄을 뺐을 때. */
  pauseSelfLoop: () => {
    const rows = 자기간선_입력.map(([label, n, e]) => {
      const c = counted(n, e, false);
      const a = show(articulationPoints(n, e));
      const b = show(keepLoops.articulationPoints(n, e));
      return [
        label,
        String(c.loops),
        a,
        b,
        a === b ? "같다" : "다르다",
        String(c.reads),
        String(c.reads + 2 * c.loops),
      ];
    });
    const same = rows.filter((r) => r[4] === "같다").length;
    return [
      ...table(
        [
          [
            "입력",
            "두 끝이 같은 간선",
            "정본",
            "그 줄을 뺀 판",
            "판정",
            "정본 읽기",
            "뺀 판의 읽기",
          ],
          ...rows,
        ],
        [1, 5, 6],
      ),
      "",
      `네 입력 중 답이 같은 것 ${same} 개`,
      "답은 그대로이고 이웃 자리 읽기만 간선 하나당 두 자리씩 늘어난다",
    ].join("\n");
  },

  /** 멈춤 — 재귀로 적으면 어느 규모에서 실행이 멈추는가. */
  pauseRecursion: () => {
    const rows = [100, 1_000, 10_000].map((v) => {
      const e = chain(v);
      const a = articulationPoints(v, e);
      const b = recursive(v, e);
      return [
        comma(v),
        `단절점 ${comma(a.length)} 개`,
        `단절점 ${comma(b.length)} 개`,
        show(a) === show(b) ? "같다" : "다르다",
      ];
    });
    const big = 100_000;
    const bigEdges = chain(big);
    const a = articulationPoints(big, bigEdges);
    let deep = "";
    try {
      const b = recursive(big, bigEdges);
      deep = `단절점 ${comma(b.length)} 개`;
    } catch (err) {
      deep =
        err instanceof RangeError
          ? "호출 스택이 한계를 넘어 실행이 멈춘다"
          : "실행이 멈춘다";
    }
    rows.push([
      comma(big),
      `단절점 ${comma(a.length)} 개`,
      deep,
      "답이 안 나온다",
    ]);
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

  /** 멈춤 — 부모 방향을 안 거르면 low 의 뜻이 바뀌지만 답은 그대로다. */
  pauseParentSkip: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const alt = lowWithParent(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      String(alt[v]),
      c.low[v] === alt[v] ? "같다" : "다르다",
    ]);
    const gap = rows.filter((r) => r[4] === "다르다").map((r) => r[0]);
    const answers = 변이_입력.map(([label, n, e]) => {
      const a = show(articulationPoints(n, e));
      const b = show(noParent.articulationPoints(n, e));
      return [label, a, b, a === b ? "같다" : "다르다"];
    });
    const same = answers.filter((r) => r[3] === "같다").length;
    return [
      ...table(
        [
          [
            "정점 v",
            "disc(v)",
            "low(v) 정의대로",
            "부모 방향까지 넣으면",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `두 값이 갈리는 정점  ${gap.join(" · ")}`,
      "",
      ...table([
        ["입력", "정본", "부모 방향을 안 거른 판", "판정"],
        ...answers,
      ]),
      "",
      `여섯 입력 중 답이 같은 것 ${same} 개`,
    ].join("\n");
  },

  /** 멈춤 — 판정의 등호를 뺐을 때. */
  pauseEquality: () => {
    const c = counted(TAIL_N, TAIL_EDGES, false);
    const t = tree(TAIL_N, TAIL_EDGES);
    const truth = articulationPoints(TAIL_N, TAIL_EDGES);
    const rows = t.treeEdges.map(([p, k]) => {
      const lowK = c.low[k] as number;
      const discP = c.disc[p] as number;
      return [
        `${p}−${k}`,
        String(discP),
        String(lowK),
        lowK >= discP ? "참" : "거짓",
        lowK > discP ? "참" : "거짓",
        (c.parent[p] as number) === -1
          ? "뿌리라 이 규칙을 안 쓴다"
          : truth.includes(p)
            ? "단절점"
            : "단절점이 아니다",
      ];
    });
    return [
      ...table(
        [
          [
            "나무 간선 부모−자식",
            "disc(부모)",
            "low(자식)",
            "low >= disc",
            "low > disc",
            "실제",
          ],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      mutantTable(strictly, "등호를 뺀 판", 변이_입력),
    ].join("\n");
  },

  /** 멈춤 — 뿌리를 빼 두는 조건을 뺐을 때. */
  pauseRootRule: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const kids: number[] = [];
    for (let v = 0; v < WALK_N; v++)
      if ((c.parent[v] as number) === 0) kids.push(v);
    const ringC = counted(RING_N, RING_EDGES, false);
    const ringKids: number[] = [];
    for (let v = 0; v < RING_N; v++)
      if ((ringC.parent[v] as number) === 0) ringKids.push(v);
    return [
      ...captions(
        [
          [
            "전개 입력의 뿌리 0",
            `나무 자식 ${kids.join(" · ")} — ${kids.length} 개라 뿌리 규칙으로 단절점`,
          ],
          [
            "사이클 하나의 뿌리 0",
            `나무 자식 ${ringKids.join(" · ")} — ${ringKids.length} 개라 뿌리 규칙으로 단절점이 아니다`,
          ],
          [
            "그런데 자식의 low",
            `사이클에서 low(${ringKids[0]}) = ${ringC.low[ringKids[0] as number]} 이고 disc(0) = ${ringC.disc[0]} 이라 일반 규칙만 보면 판정이 참이 된다`,
          ],
        ],
        "",
      ),
      "",
      mutantTable(rootToo, "뿌리에도 같은 규칙을 적용한 판", 변이_입력),
    ].join("\n");
  },

  /** related — 블록과 블록-컷 나무. */
  blockCutTree: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["삼각형 둘을 간선 하나가 잇는다", BRIDGE_N, BRIDGE_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["사슬 (V = 5)", 5, chain(5)],
      ["별 (V = 5)", 5, star(5)],
      ["삼각형 넷을 이은 그래프", beads(4, 3).n, beads(4, 3).e],
    ];
    const rows = cases.map(([label, n, e]) => {
      const bs = blocks(n, e);
      return [
        label,
        String(bs.length),
        show2(bs),
        show(sharedByBlocks(n, e)),
        show(articulationPoints(n, e)),
        show(sharedByBlocks(n, e)) === show(articulationPoints(n, e))
          ? "예"
          : "아니오",
      ];
    });
    const agree = rows.filter((r) => r[5] === "예").length;
    return [
      ...table(
        [
          [
            "입력",
            "블록 수",
            "블록",
            "블록 둘 이상에 든 정점",
            "정본이 낸 단절점",
            "두 열이 같은가",
          ],
          ...rows,
        ],
        [1],
      ),
      "",
      `여섯 줄 모두 두 열이 같은가  ${agree === rows.length ? "예" : "아니오"}`,
    ].join("\n");
  },

  /** deep.math ② — 정의를 전개 입력에 넣어 세 항의 최솟값을 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const t = tree(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const back = t.backEdges
        .filter(([b]) => b === v)
        .map(([, a]) => c.disc[a] as number);
      const kids: number[] = [];
      for (let x = 0; x < WALK_N; x++)
        if ((c.parent[x] as number) === v) kids.push(x);
      const kidLow = kids.map((x) => c.low[x] as number);
      const all = [c.disc[v] as number, ...back, ...kidLow];
      const min = Math.min(...all);
      return [
        String(v),
        String(c.disc[v]),
        back.length === 0 ? "없다" : back.join(", "),
        kidLow.length === 0 ? "없다" : kidLow.join(", "),
        String(min),
        String(c.low[v]),
        min === c.low[v] ? "일치" : "어긋난다",
      ];
    });
    const ok = rows.every((r) => r[6] === "일치");
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
      `다섯 줄 모두 셋의 최솟값이 실행이 낸 값과 같은가  ${ok ? "예" : "아니오"}`,
      `이웃 자리 읽기 ${c.reads} · 2(E − L) = ${2 * (WALK_EDGES.length - c.loops)}`,
    ].join("\n");
  },

  /** deep.math ③ — 단절점 개수의 상한을 모양마다 잰다. */
  mathBound: () => {
    const cases: [string, number, Edge[]][] = [
      ["사슬 (V = 8)", 8, chain(8)],
      ["사슬 (V = 64)", 64, chain(64)],
      ["사이클 (V = 64)", 64, ring(64)],
      ["별 (V = 64)", 64, star(64)],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["삼각형 16 개를 이은 그래프", beads(16, 3).n, beads(16, 3).e],
      ["무작위 (V = 64, E = 96)", 64, scatter(64, 96, 20260906)],
      ["간선이 없는 그래프 (V = 64)", 64, []],
    ];
    const rows = cases.map(([label, n, e]) => {
      const a = articulationPoints(n, e);
      return [
        label,
        String(n),
        String(e.length),
        String(a.length),
        String(Math.max(0, n - 2)),
        a.length <= Math.max(0, n - 2) ? "지킨다" : "넘는다",
        a.length === Math.max(0, n - 2) ? "예" : "아니오",
      ];
    });
    const held = rows.filter((r) => r[5] === "지킨다").length;
    const tight = rows.filter((r) => r[6] === "예").map((r) => r[0]);
    return [
      ...table(
        [
          [
            "입력",
            "V",
            "E",
            "단절점 개수",
            "상한 V − 2",
            "상한을 지키는가",
            "상한과 같은가",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      ...captions([
        [
          "여덟 줄 모두 상한을 지키는가",
          held === rows.length ? "예" : "아니오",
        ],
        ["상한과 같은 값이 나온 모양", tight.join(" · ")],
      ]),
    ].join("\n");
  },

  /** deep.math ④ — 닫은 식에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [1_000, 10_000, 100_000].map((v) => {
      const e = chain(v);
      const c = counted(v, e, false);
      return [
        comma(v),
        comma(e.length),
        comma(c.reads),
        comma(2 * (e.length - c.loops)),
        comma(c.enters + c.pops),
        comma(2 * v),
        comma(articulationPoints(v, e).length),
        comma(v - 2),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 V",
            "간선 E",
            "이웃 자리 읽기",
            "2(E − L)",
            "정점 만짐",
            "2V",
            "단절점 개수",
            "V − 2",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      "세 줄 모두 실측 열과 그 오른쪽 식이 같은 값이다",
      `제약 상한 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 이면 읽기 ${comma(2 * E_LIMIT)} · 정점 만짐 ${comma(2 * V_LIMIT)}`,
    ].join("\n");
  },

  /**
   * invariant ② — 걸음마다 두 문장이 유지되는가.
   *
   * **원문자 라벨을 이 블록에 넣지 않는다** — `invariant` 절 전체가 원문자 금지 구역이라
   * (`SPEC.md:566` · `P14`) 생성 블록도 그 규칙 안에 있다. 갈래는 이름으로 적는다.
   */
  invariantWatch: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const want = lowByDefinition(WALK_N, WALK_EDGES);
    const rows = c.steps.map((s, i) => {
      const asc = s.call.every(
        (v, k) =>
          k === 0 ||
          (c.disc[s.call[k - 1] as number] as number) < (c.disc[v] as number),
      );
      const bounded = s.call.every(
        (v) => (s.low[v] as number) <= (s.disc[v] as number),
      );
      const popped = s.kind === "복귀" || s.kind === "판정";
      return [
        `T${i + 2}`,
        s.kind,
        show(s.call),
        s.call.map((v) => `${s.disc[v]}`).join(" < ") || "-",
        asc ? "지킨다" : "깨진다",
        bounded ? "지킨다" : "깨진다",
        popped
          ? `${s.low[s.v]} = ${want[s.v]} 이라 ${(s.low[s.v] as number) === (want[s.v] as number) ? "같다" : "다르다"}`
          : "-",
      ];
    });
    const kept = rows.filter(
      (r) => r[4] === "지킨다" && r[5] === "지킨다",
    ).length;
    const pops = rows.filter((r) => r[6] !== "-");
    const popsOk = pops.filter((r) => (r[6] as string).endsWith("같다")).length;
    return [
      ...table(
        [
          [
            "걸음",
            "갈래",
            "호출 스택",
            "그 정점들의 disc",
            "앞 문장",
            "뒤 문장",
            "뺀 정점의 low 와 정의값",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      ...captions([
        [
          `${rows.length} 시점 모두 두 문장이 유지되는가`,
          kept === rows.length ? "예" : "아니오",
        ],
        [
          `뺀 걸음 ${pops.length} 개 중 low 가 정의값과 같은 것`,
          `${popsOk} 개`,
        ],
      ]),
    ].join("\n");
  },

  /** invariant ② — 경계 입력에서도 같은 문장이 서는가. */
  invariantEdges: () => {
    const cases: [string, number, Edge[]][] = [
      ["정점 하나, 간선 없음", 1, []],
      ["정점 둘, 간선 하나", 2, [[0, 1]]],
      ["정점 넷, 간선 없음", 4, []],
      ["두 끝이 같은 간선만", LOOP_D_N, LOOP_D_EDGES],
      [
        "같은 두 정점 사이의 겹친 간선",
        3,
        [
          [0, 1],
          [0, 1],
          [1, 2],
        ],
      ],
      ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
      ["사슬 (V = 4)", 4, chain(4)],
      ["사이클 (V = 8)", 8, ring(8)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      return [
        label,
        String(n),
        String(e.length),
        show(c.cut),
        String(c.reads),
        String(c.enters + c.pops),
        String(c.peakCall),
        String(c.roots),
      ];
    });
    return table(
      [
        [
          "입력",
          "V",
          "E",
          "단절점",
          "이웃 자리 읽기",
          "정점 만짐",
          "호출 스택 최대",
          "탐색 시작 횟수",
        ],
        ...rows,
      ],
      [1, 2, 4, 5, 6, 7],
    ).join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 뺐을 때. */
  mutantNoPass: () => {
    const cases: [string, number, Edge[]][] = [
      ...변이_입력,
      ["사이클 (V = 6)", 6, ring(6)],
      ["삼각형 넷을 이은 그래프", beads(4, 3).n, beads(4, 3).e],
      ["무작위 (V = 32, E = 48)", 32, scatter(32, 48, 20260906)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const a = show(articulationPoints(n, e));
      const b = show(noPass.articulationPoints(n, e));
      return [label, a, b, a === b ? "같다" : "다르다"];
    });
    const off = rows.filter((r) => r[3] === "다르다").map((r) => r[0]);
    return [
      ...table([
        ["입력", "정본", "자식의 low 를 안 전달하는 판", "판정"],
        ...rows,
      ]),
      "",
      `아홉 입력 중 답이 갈린 것 ${off.length} 개`,
    ].join("\n");
  },

  /** perf.derive — 걸음마다 읽은 이웃 자리와 누적. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES);
    let prev = 0;
    const rows = c.steps.map((s, i) => {
      const step = s.reads - prev;
      prev = s.reads;
      return [`T${i + 2}`, s.kind, site(s), String(step), String(s.reads)];
    });
    return [
      ...table(
        [
          ["걸음", "무엇", "정점 또는 간선", "이 걸음이 읽은 자리", "누적"],
          ...rows,
        ],
        [3, 4],
      ),
      "",
      ...captions([
        [
          "이웃 자리 읽기",
          `${c.reads} 이고 2(E − L) = ${2 * (WALK_EDGES.length - c.loops)}`,
        ],
        [
          "정점 만짐",
          `진입 ${c.enters} + 빼기 ${c.pops} = ${c.enters + c.pops} 이고 2V = ${2 * WALK_N}`,
        ],
        ["간선 목록 읽기", `${c.builds} 이고 E = ${WALK_EDGES.length}`],
      ]),
    ].join("\n");
  },

  /** perf.bounds — 모양이 달라도 두 등식이 그대로인가. */
  perfObserved: () => {
    const cases: [string, number, Edge[]][] = [
      ["사슬 (V = 1,024)", 1024, chain(1024)],
      ["사이클 (V = 1,024)", 1024, ring(1024)],
      ["별 (V = 1,024)", 1024, star(1024)],
      ["삼각형 341 개를 이은 그래프", beads(341, 3).n, beads(341, 3).e],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["무작위 (V = 1,024, E = 2,048)", 1024, scatter(1024, 2048, 20260906)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      return [
        label,
        comma(n),
        comma(e.length),
        comma(c.reads),
        comma(2 * (e.length - c.loops)),
        comma(c.enters + c.pops),
        comma(2 * n),
        comma(c.peakCall),
        comma(articulationPoints(n, e).length),
      ];
    });
    const readsOk = rows.every((r) => r[3] === r[4]);
    const touchOk = rows.every((r) => r[5] === r[6]);
    return [
      ...table(
        [
          [
            "입력",
            "V",
            "E",
            "이웃 자리 읽기",
            "2(E − L)",
            "정점 만짐",
            "2V",
            "호출 스택 최대",
            "단절점 개수",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "",
      ...captions([
        ["모든 줄에서 읽기 = 2(E − L) 인가", readsOk ? "예" : "아니오"],
        ["모든 줄에서 정점 만짐 = 2V 인가", touchOk ? "예" : "아니오"],
      ]),
      "",
      "갈리는 것은 호출 스택 최대와 단절점 개수 둘뿐이다",
    ].join("\n");
  },

  /** perf.worst — 무엇이 최악을 만드는가. 정점 수를 512 로 고정하고 모양만 바꾼다. */
  worstShape: () => {
    const V = 512;
    const cases: [string, Edge[]][] = [
      ["간선 없음", []],
      ["사슬", chain(V)],
      ["사슬을 간선 목록에 거꾸로 적은 것", chain(V).slice().reverse()],
      ["사이클", ring(V)],
      ["별 — 정점 하나에서 나머지 전부로", star(V)],
      ["삼각형 170 개를 이은 것 + 홀로 있는 정점 둘", beads(170, 3).e],
      ["완전 그래프", complete(V)],
    ];
    const rows = cases.map(([label, e]) => {
      const c = counted(V, e, false);
      return [
        label,
        comma(e.length),
        comma(c.reads),
        comma(c.enters + c.pops),
        comma(c.peakCall),
        comma(articulationPoints(V, e).length),
      ];
    });
    const touch = new Set(rows.map((r) => r[3]));
    return [
      ...table(
        [
          [
            "모양 (V = 512)",
            "간선 E",
            "이웃 자리 읽기",
            "정점 만짐",
            "호출 스택 최대",
            "단절점 개수",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      `일곱 모양의 정점 만짐이 서로 다른 값을 낸 가짓수  ${touch.size}`,
      "호출 스택 최대와 단절점 개수만 모양을 따라 갈린다",
    ].join("\n");
  },

  /** perf.worst — 규모를 네 배로 늘리면 무엇이 몇 배가 되는가. */
  worstGrowth: () => {
    let prevSum = 0;
    let prevPeak = 0;
    let sumEq = 0;
    let peakEq = 0;
    let cutEq = 0;
    const rows = [64, 256, 1024, 4096].map((v) => {
      const e = chain(v);
      const c = counted(v, e, false);
      const sum = c.reads + c.enters + c.pops;
      const cuts = articulationPoints(v, e).length;
      if (sum === 4 * v - 2) sumEq++;
      if (c.peakCall === v) peakEq++;
      if (cuts === v - 2) cutEq++;
      const row = [
        comma(v),
        comma(sum),
        prevSum === 0
          ? "-"
          : (Math.round((sum / prevSum) * 100) / 100).toFixed(2),
        comma(c.peakCall),
        prevPeak === 0
          ? "-"
          : (Math.round((c.peakCall / prevPeak) * 100) / 100).toFixed(2),
        comma(cuts),
      ];
      prevSum = sum;
      prevPeak = c.peakCall;
      return row;
    });
    return [
      ...table(
        [
          [
            "정점 V",
            "읽기 + 만짐",
            "직전 줄의 몇 배",
            "호출 스택 최대",
            "직전 줄의 몇 배",
            "단절점 개수",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      ...captions([
        ["읽기 + 만짐이 4V − 2 와 같은 줄", `${sumEq} 개`],
        ["호출 스택 최대가 V 와 같은 줄", `${peakEq} 개`],
        ["단절점 개수가 V − 2 와 같은 줄", `${cutEq} 개`],
      ]),
    ].join("\n");
  },
};
