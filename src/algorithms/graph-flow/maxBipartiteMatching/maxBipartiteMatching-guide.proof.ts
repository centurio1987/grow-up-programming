/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 읽었는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「매칭 크기」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은
 * 계수만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { maxBipartiteMatching } from "./maxBipartiteMatching-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 왼쪽 셋 · 오른쪽 셋 · 간선 넷.
 *
 * 아홉 갈래를 한 입력에서 전부 실행한다. `L1` 이 `R0` 을 볼 때 재배정 갈래가 실행되고,
 * `L0` 이 `R0` 을 다시 볼 때 이미 본 자리 갈래가 실행되며, `L2` 는 어느 이웃으로도 도달하지
 * 못해 실패 갈래가 실행된다. 답이 `min(L, R)` 보다 작은 입력이기도 하다.
 */
export const WALK_L = 3;
export const WALK_R = 3;
export const WALK_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
];

/** 완전 매칭이 있는 3 × 3. 기존 테스트의 첫 케이스다. */
export const FULL_L = 3;
export const FULL_R = 3;
export const FULL_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 2],
];

/** 재배정 사슬이 두 칸 필요한 3 × 3. */
export const RECHAIN_L = 3;
export const RECHAIN_R = 3;
export const RECHAIN_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 1],
  [2, 2],
];

/** 오른쪽이 하나뿐이다. 왼쪽이 넷이어도 답은 1 이다. */
export const ONER_L = 4;
export const ONER_R = 1;
export const ONER_EDGES: Edge[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
];

/** 홀의 결혼 정리 예시 — 완전 매칭이 있다. */
export const HALL_L = 4;
export const HALL_R = 4;
export const HALL_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 3],
  [3, 2],
  [3, 3],
];

/** 왼쪽 셋이 오른쪽 하나만 본다. */
export const NARROW_L = 3;
export const NARROW_R = 3;
export const NARROW_EDGES: Edge[] = [
  [0, 0],
  [1, 0],
  [2, 0],
];

/** 간선이 없다. */
export const NONE_L = 5;
export const NONE_R = 5;
export const NONE_EDGES: Edge[] = [];

/** 같은 간선이 두 번 들어온 입력. */
export const DUP_L = 2;
export const DUP_R = 2;
export const DUP_EDGES: Edge[] = [
  [0, 0],
  [0, 0],
  [1, 1],
];

/* ────────────────────────── 그래프 생성 ────────────────────────── */

/** 완전 이분 그래프 — 왼쪽 `n` 개가 오른쪽 `n` 개 전부와 이어진다. */
export function complete(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) e.push([u, v]);
  return e;
}

/** 계단 — 왼쪽 `u` 가 오른쪽 `0` 부터 `u` 까지와 이어진다. */
export function stair(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v <= u; v++) e.push([u, v]);
  return e;
}

/** 계단을 뒤집은 것 — 왼쪽 `u` 가 오른쪽 `u` 부터 끝까지와 이어진다. */
export function stairUp(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = u; v < n; v++) e.push([u, v]);
  return e;
}

/** 사슬 — 왼쪽 `u` 가 오른쪽 `u` 하나와만 이어진다. */
export function line(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) e.push([u, u]);
  return e;
}

/** 별 — 왼쪽 전부가 오른쪽 0 하나만 본다. */
export function star(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) e.push([u, 0]);
  return e;
}

/**
 * 블록 가족 — 앞쪽 `k` 개가 `k × k` 완전 이분 블록을 이루고, 나머지 왼쪽 정점은 오른쪽
 * 전부를 본다. `k = 0` 이면 완전 이분 그래프와 같다.
 */
export function block(n: number, k: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < k; u++) for (let v = 0; v < k; v++) e.push([u, v]);
  for (let u = k; u < n; u++) for (let v = 0; v < n; v++) e.push([u, v]);
  return e;
}

/**
 * 생성식으로 고정한 성긴 그래프. 왼쪽 정점마다 `deg` 개의 오른쪽 정점을 뽑는다.
 *
 * **곱셈 하나짜리 생성식을 쓰지 않는다** — 아래 비트의 주기가 짧아 정점 수로 나눈 나머지가
 * 몇 걸음 만에 되풀이된다.
 */
export function scatter(n: number, deg: number, seed: number): Edge[] {
  let s = seed | 0;
  const next = (): number => {
    s ^= s << 13;
    s |= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s |= 0;
    return s >>> 0;
  };
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let k = 0; k < deg; k++) e.push([u, next() % n]);
  }
  return e;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[1, 0, -1]` 꼴 — 본문 표기와 같다. */
const show = (a: number[]): string => `[${a.join(", ")}]`;

/** `[1, 0, -]` 꼴 — `-1` 을 빈자리 표시로 바꾼다. */
const dash = (a: number[]): string =>
  `[${a.map((x) => (x < 0 ? "-" : String(x))).join(", ")}]`;

/** `20,000,000` 꼴 — 본문 표기와 같다. */
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
  u: number;
  v: number | null;
  matchR: number[];
  seen: boolean[];
  depth: number;
  size: number;
  note: string;
  reads: number;
}

export interface Counted {
  size: number;
  matchR: number[];
  steps: Step[];
  reads: number;
  fills: number;
  slots: number;
  maxDepth: number;
  starts: number;
  skips: number;
  frees: number;
  moves: number;
  fails: number;
}

/**
 * 정본과 같은 절차이고 세는 자리와 걸음 기록만 덧붙였다.
 *
 * `reads` 는 이웃 목록의 자리를 하나 읽은 횟수, `fills` 는 방문 표에 쓴 칸 수,
 * `slots` 는 이웃 목록의 자리 총수(= 간선 수)다.
 */
export function counted(left: number, right: number, edges: Edge[]): Counted {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);

  const steps: Step[] = [];
  let reads = 0;
  let fills = 0;
  let size = 0;
  let maxDepth = 0;
  let starts = 0;
  let skips = 0;
  let frees = 0;
  let moves = 0;
  let fails = 0;

  const augment = (u: number, depth: number): boolean => {
    if (depth > maxDepth) maxDepth = depth;
    for (const v of adj[u] as number[]) {
      reads++;
      if (seen[v] === true) {
        skips++;
        steps.push({
          kind: "넘어간다",
          label: "④",
          u,
          v,
          matchR: [...matchR],
          seen: [...seen],
          depth,
          size,
          note: `R${v} 를 이미 봤다`,
          reads,
        });
        continue;
      }
      seen[v] = true;
      if ((matchR[v] as number) === -1) {
        frees++;
        matchR[v] = u;
        steps.push({
          kind: "잇는다",
          label: "⑤⑦",
          u,
          v,
          matchR: [...matchR],
          seen: [...seen],
          depth,
          size,
          note: `R${v} 가 빈자리라 matchR[${v}] = ${u}`,
          reads,
        });
        return true;
      }
      const owner = matchR[v] as number;
      steps.push({
        kind: "내려간다",
        label: "⑥",
        u,
        v,
        matchR: [...matchR],
        seen: [...seen],
        depth,
        size,
        note: `R${v} 의 짝 L${owner} 을 다른 자리로 옮길 수 있는가`,
        reads,
      });
      if (augment(owner, depth + 1)) {
        moves++;
        matchR[v] = u;
        steps.push({
          kind: "옮긴다",
          label: "⑦",
          u,
          v,
          matchR: [...matchR],
          seen: [...seen],
          depth,
          size,
          note: `L${owner} 이 옮겨 가서 matchR[${v}] = ${u}`,
          reads,
        });
        return true;
      }
    }
    fails++;
    steps.push({
      kind: "실패",
      label: "⑧",
      u,
      v: null,
      matchR: [...matchR],
      seen: [...seen],
      depth,
      size,
      note: `L${u} 의 이웃을 다 봤지만 증대 경로가 없다`,
      reads,
    });
    return false;
  };

  for (let u = 0; u < left; u++) {
    seen.fill(false);
    fills += right;
    starts++;
    steps.push({
      kind: "시작",
      label: "⑨",
      u,
      v: null,
      matchR: [...matchR],
      seen: [...seen],
      depth: 0,
      size,
      note: `방문 표를 비우고 L${u} 에서 탐색을 시작한다`,
      reads,
    });
    if (augment(u, 1)) size++;
  }

  return {
    size,
    matchR,
    steps,
    reads,
    fills,
    slots: adj.reduce((n, a) => n + a.length, 0),
    maxDepth,
    starts,
    skips,
    frees,
    moves,
    fails,
  };
}

/**
 * 이웃 자리 읽기만 세는 가벼운 사본 — 걸음을 기록하지 않는다.
 *
 * 그래프 수만 개를 한 번에 재는 표가 있어서, 걸음마다 배열을 복사하는 `counted` 로는 감당이
 * 안 된다. 두 사본이 같은 수를 내는지는 `자기대조()` 가 확인한다.
 */
export function readsFast(left: number, right: number, edges: Edge[]): number {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);
  let reads = 0;
  const augment = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      reads++;
      if (seen[v] === true) continue;
      seen[v] = true;
      if ((matchR[v] as number) === -1 || augment(matchR[v] as number)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  };
  for (let u = 0; u < left; u++) {
    seen.fill(false);
    augment(u);
  }
  return reads;
}

/** 바깥 반복 한 바퀴가 읽은 이웃 자리 수를 왼쪽 정점 순서대로 낸다. */
export function perSearchReads(
  left: number,
  right: number,
  edges: Edge[],
): number[] {
  const steps = counted(left, right, edges).steps;
  const marks: number[] = [];
  steps.forEach((s, i) => {
    if (s.kind === "시작") marks.push(i);
  });
  return marks.map((at, j) => {
    const next = marks[j + 1] ?? steps.length;
    const from = (steps[at] as Step).reads;
    const to = (steps[next - 1] as Step).reads;
    return to - from;
  });
}

/** 재배정을 안 하는 그리디 — 빈 오른쪽 정점을 만나면 거기서 멈춘다. */
export function greedy(
  left: number,
  right: number,
  edges: Edge[],
): { size: number; matchR: number[]; reads: number } {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  let size = 0;
  let reads = 0;
  for (let u = 0; u < left; u++) {
    for (const v of adj[u] as number[]) {
      reads++;
      if ((matchR[v] as number) === -1) {
        matchR[v] = u;
        size++;
        break;
      }
    }
  }
  return { size, matchR, reads };
}

/**
 * 정의를 그대로 옮긴 방법 — 간선의 부분집합을 전부 만들어 매칭인 것 중 가장 큰 것을 고른다.
 *
 * `subsets` 는 만든 부분집합 수, `checks` 는 간선 하나가 끝점을 공유하는지 본 횟수다.
 */
export function bruteForce(
  left: number,
  right: number,
  edges: Edge[],
): { size: number; subsets: number; checks: number } {
  const E = edges.length;
  let size = 0;
  let subsets = 0;
  let checks = 0;
  for (let mask = 0; mask < 1 << E; mask++) {
    subsets++;
    const usedL: boolean[] = Array.from({ length: left }, () => false);
    const usedR: boolean[] = Array.from({ length: right }, () => false);
    let ok = true;
    let n = 0;
    for (let i = 0; i < E; i++) {
      if ((mask & (1 << i)) === 0) continue;
      checks++;
      const [u, v] = edges[i] as Edge;
      if (usedL[u] === true || usedR[v] === true) {
        ok = false;
        break;
      }
      usedL[u] = true;
      usedR[v] = true;
      n++;
    }
    if (ok && n > size) size = n;
  }
  return { size, subsets, checks };
}

/**
 * 짝이 없는 왼쪽 정점에서 교대 경로로 도달하는 정점 무리와, 거기서 나오는 최소 정점 덮개.
 *
 * 덮개를 만드는 규칙은 `(왼쪽 전부 − 무리) ∪ (오른쪽 ∩ 무리)` 다.
 */
export function reachAndCover(
  left: number,
  right: number,
  edges: Edge[],
): {
  size: number;
  zl: number[];
  zr: number[];
  coverL: number[];
  coverR: number[];
  uncovered: number;
} {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR = counted(left, right, edges).matchR;
  const matchL: number[] = Array.from({ length: left }, () => -1);
  for (let v = 0; v < right; v++) {
    const u = matchR[v] as number;
    if (u !== -1) matchL[u] = v;
  }
  const inZL: boolean[] = Array.from({ length: left }, () => false);
  const inZR: boolean[] = Array.from({ length: right }, () => false);
  const stack: number[] = [];
  for (let u = 0; u < left; u++) {
    if (matchL[u] === -1) {
      inZL[u] = true;
      stack.push(u);
    }
  }
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const v of adj[u] as number[]) {
      if (inZR[v] === true || matchL[u] === v) continue;
      inZR[v] = true;
      const w = matchR[v] as number;
      if (w !== -1 && inZL[w] !== true) {
        inZL[w] = true;
        stack.push(w);
      }
    }
  }
  const zl: number[] = [];
  const zr: number[] = [];
  const coverL: number[] = [];
  const coverR: number[] = [];
  for (let u = 0; u < left; u++) {
    if (inZL[u] === true) zl.push(u);
    else coverL.push(u);
  }
  for (let v = 0; v < right; v++) {
    if (inZR[v] === true) {
      zr.push(v);
      coverR.push(v);
    }
  }
  const inL = new Set(coverL);
  const inR = new Set(coverR);
  const uncovered = edges.filter(([u, v]) => !inL.has(u) && !inR.has(v)).length;
  return {
    size: matchR.filter((u) => u !== -1).length,
    zl,
    zr,
    coverL,
    coverR,
    uncovered,
  };
}

/** 정점 부분집합을 전부 만들어 최소 정점 덮개의 크기를 구한다. */
export function coverBrute(left: number, right: number, edges: Edge[]): number {
  let best = left + right;
  for (let m = 0; m < 1 << (left + right); m++) {
    let n = 0;
    for (let i = 0; i < left + right; i++) if ((m >> i) & 1) n++;
    if (n >= best) continue;
    let ok = true;
    for (const [u, v] of edges) {
      if (((m >> u) & 1) === 0 && ((m >> (left + v)) & 1) === 0) {
        ok = false;
        break;
      }
    }
    if (ok) best = n;
  }
  return best;
}

/** `matchR` 이 매칭인가 — 오른쪽마다 최대 하나, 왼쪽마다 최대 하나. */
export function isMatching(matchR: number[]): boolean {
  const seenLeft = new Set<number>();
  for (const u of matchR) {
    if (u === -1) continue;
    if (seenLeft.has(u)) return false;
    seenLeft.add(u);
  }
  return true;
}

/** `matchR` 이 나타내는 간선 수. */
export function pairCount(matchR: number[]): number {
  return matchR.filter((u) => u !== -1).length;
}

/* ────────────────────── 사본 자기대조 ────────────────────── */

const 자기대조_입력: [number, number, Edge[]][] = [
  [WALK_L, WALK_R, WALK_EDGES],
  [FULL_L, FULL_R, FULL_EDGES],
  [RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
  [ONER_L, ONER_R, ONER_EDGES],
  [HALL_L, HALL_R, HALL_EDGES],
  [NARROW_L, NARROW_R, NARROW_EDGES],
  [NONE_L, NONE_R, NONE_EDGES],
  [DUP_L, DUP_R, DUP_EDGES],
  [8, 8, complete(8)],
  [8, 8, stair(8)],
  [8, 8, stairUp(8)],
  [8, 8, line(8)],
  [8, 8, star(8)],
  [12, 12, block(12, 8)],
  [40, 40, scatter(40, 3, 20260907)],
  [64, 64, scatter(64, 6, 424242)],
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [l, r, edges] of 자기대조_입력) {
    const ref = maxBipartiteMatching(l, r, edges);
    if (counted(l, r, edges).size !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (reachAndCover(l, r, edges).size !== ref) {
      throw new Error("도달 무리를 세는 사본이 정본과 다른 답을 낸다");
    }
    if (!isMatching(counted(l, r, edges).matchR)) {
      throw new Error("정본이 낸 짝 표가 매칭이 아니다");
    }
    if (readsFast(l, r, edges) !== counted(l, r, edges).reads) {
      throw new Error("가벼운 사본이 세는 사본과 다른 수를 낸다");
    }
    if (
      perSearchReads(l, r, edges).reduce((a, b) => a + b, 0) !==
      counted(l, r, edges).reads
    ) {
      throw new Error("탐색별 읽기의 합이 전체 읽기와 다르다");
    }
  }
  for (const [l, r, edges] of 자기대조_입력.slice(0, 8)) {
    if (bruteForce(l, r, edges).size !== maxBipartiteMatching(l, r, edges)) {
      throw new Error("전수 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./maxBipartiteMatching-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  maxBipartiteMatching(left: number, right: number, edges: Edge[]): number;
}

/** 방문 표를 왼쪽 정점마다 새로 채우는 줄을 뺀 사본. */
const sharedSeen = await loadMutant<Impl>(REF, {
  drop: /seen\.fill\(false\);/,
});

/** 자리를 적을 때마다 매칭 크기를 세게 둔 사본. */
const countInside = await loadMutant<Impl>(REF, {
  swap: [/matchR\[v\] = u;/, "matchR[v] = u;\n        size++;"],
});

/** **불변식을 지키던 줄** — 빈자리인지도 옮길 수 있는지도 안 보고 자리를 가져가는 사본. */
const takeAnyway = await loadMutant<Impl>(REF, {
  swap: [
    /if \(\(matchR\[v\] as number\) === -1 \|\| augment\(matchR\[v\] as number\)\) \{/,
    "if (true) {",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof`
 * 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = takeAnyway.maxBipartiteMatching === maxBipartiteMatching;

const 갈리는_변이: {
  label: string;
  impl: Impl;
  cases: [number, number, Edge[]][];
}[] = [
  {
    label: "방문 표를 나눠 쓰는 판",
    impl: sharedSeen,
    cases: [
      [WALK_L, WALK_R, WALK_EDGES],
      [FULL_L, FULL_R, FULL_EDGES],
    ],
  },
  {
    label: "자리를 적을 때마다 세는 판",
    impl: countInside,
    cases: [
      [WALK_L, WALK_R, WALK_EDGES],
      [RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
    ],
  },
  {
    label: "자리를 그냥 가져가는 판",
    impl: takeAnyway,
    cases: [
      [WALK_L, WALK_R, WALK_EDGES],
      [NARROW_L, NARROW_R, NARROW_EDGES],
    ],
  },
];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(
        ([l, r, e]) =>
          maxBipartiteMatching(l, r, e) === impl.maxBipartiteMatching(l, r, e),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 변이 하나를 입력 여럿에 놓고 정본과 나란히 적는다. */
function mutantTable(
  impl: Impl,
  name: string,
  cases: [string, number, number, Edge[]][],
): string[] {
  const rows = cases.map(([label, l, r, e]) => {
    const a = maxBipartiteMatching(l, r, e);
    const b = impl.maxBipartiteMatching(l, r, e);
    return [label, String(a), String(b), a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", name, "판정"], ...rows], [1, 2]);
}

const 변이_입력: [string, number, number, Edge[]][] = [
  ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
  ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
  ["재배정이 두 칸 필요한 3 × 3", RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
  ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
  ["홀의 예시 4 × 4", HALL_L, HALL_R, HALL_EDGES],
  ["왼쪽 셋이 오른쪽 하나만", NARROW_L, NARROW_R, NARROW_EDGES],
];

/* ────────────────────────── 수치 ────────────────────────── */

const L_LIMIT = 1000;
const R_LIMIT = 1000;
const E_LIMIT = L_LIMIT * R_LIMIT;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "짝 표와 방문 표를 만든다"],
  ["③", "증대 경로 탐색에 들어간다"],
  ["④", "이미 본 오른쪽 정점이라 넘어간다"],
  ["⑤", "빈자리를 만나 잇는다"],
  ["⑥", "짝이 있는 자리라 그 짝으로 내려간다"],
  ["⑦", "경로를 뒤집어 자리를 적는다"],
  ["⑧", "증대 경로가 없어 실패를 돌려준다"],
  ["⑨", "왼쪽 정점 하나마다 방문 표를 새로 채운다"],
];

/** 걸음 표의 행. 첫 걸음이 준비이고 마지막 걸음이 반환이다. */
function walkRows(): string[][] {
  const c = counted(WALK_L, WALK_R, WALK_EDGES);
  const emptyR = `[${Array.from({ length: WALK_R }, () => "-").join(", ")}]`;
  const noSeen = `[${Array.from({ length: WALK_R }, () => "F").join(", ")}]`;
  const rows: string[][] = [
    [
      "걸음",
      "무엇",
      "자리",
      "라벨",
      "matchR",
      "seen",
      "깊이",
      "크기",
      "이 걸음이 한 일",
    ],
    [
      "T1",
      "준비",
      "-",
      "①②",
      emptyR,
      noSeen,
      "0",
      "0",
      "이웃 목록과 두 표를 만든다",
    ],
  ];
  c.steps.forEach((s, i) => {
    rows.push([
      `T${i + 2}`,
      s.kind,
      s.v === null ? `L${s.u}` : `L${s.u}−R${s.v}`,
      s.label,
      dash(s.matchR),
      `[${s.seen.map((b) => (b ? "T" : "F")).join(", ")}]`,
      String(s.depth),
      String(s.size),
      s.note,
    ]);
  });
  const last = c.steps[c.steps.length - 1] as Step;
  rows.push([
    `T${c.steps.length + 2}`,
    "반환",
    "-",
    "-",
    dash(last.matchR),
    `[${last.seen.map((b) => (b ? "T" : "F")).join(", ")}]`,
    "0",
    String(c.size),
    `${c.size} 를 돌려준다`,
  ]);
  return rows;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 정의를 그대로 옮긴 방법을 전개 입력에 실행한다. */
  bruteScan: () => {
    const b = bruteForce(WALK_L, WALK_R, WALK_EDGES);
    const c = counted(WALK_L, WALK_R, WALK_EDGES);
    const rows: string[][] = [
      ["부분집합", "고른 간선", "끝점을 공유하는가", "매칭인가", "크기"],
    ];
    const E = WALK_EDGES.length;
    for (let mask = 0; mask < 1 << E; mask++) {
      const picked: string[] = [];
      const usedL = new Set<number>();
      const usedR = new Set<number>();
      let ok = true;
      let n = 0;
      for (let i = 0; i < E; i++) {
        if ((mask & (1 << i)) === 0) continue;
        const [u, v] = WALK_EDGES[i] as Edge;
        picked.push(`L${u}R${v}`);
        if (usedL.has(u) || usedR.has(v)) ok = false;
        usedL.add(u);
        usedR.add(v);
        n++;
      }
      if (n < 2) continue;
      rows.push([
        String(mask),
        picked.join(" "),
        ok ? "아니다" : "공유한다",
        ok ? "매칭" : "매칭이 아니다",
        ok ? String(n) : "-",
      ]);
    }
    return [
      ...table(rows, [0, 4]),
      "",
      ...captions([
        ["부분집합 수", `${b.subsets} 개 — 간선 ${E} 개라 2^${E} 이다`],
        ["끝점 검사", `${b.checks} 번`],
        ["가장 큰 매칭", `${b.size}`],
        ["이 글이 만들 절차의 답", `${c.size}`],
        ["이 글이 만들 절차의 이웃 자리 읽기", `${c.reads} 번`],
      ]),
    ].join("\n");
  },

  /** deep.build ② — 그 방법이 규모에서 몇 번이 되는가. */
  bruteScale: () => {
    const rows: string[][] = [
      [
        "입력",
        "간선 E",
        "부분집합 2^E",
        "끝점 검사",
        "전수의 답",
        "이 글의 절차의 답",
      ],
    ];
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 이분 2 × 2", 2, 2, complete(2)],
      ["완전 이분 3 × 3", 3, 3, complete(3)],
      ["완전 이분 4 × 4", 4, 4, complete(4)],
    ];
    for (const [name, l, r, e] of cases) {
      const b = bruteForce(l, r, e);
      rows.push([
        name,
        comma(e.length),
        comma(b.subsets),
        comma(b.checks),
        String(b.size),
        String(maxBipartiteMatching(l, r, e)),
      ]);
    }
    return [
      ...table(rows, [1, 2, 3, 4, 5]),
      "",
      ...captions([
        ["간선을 하나 더하면", "부분집합 수가 두 배가 된다"],
        [
          `제약 상한 L = R = ${comma(L_LIMIT)} 이면`,
          `간선이 많아야 ${comma(E_LIMIT)} 개이고 부분집합은 2^${comma(E_LIMIT)} 개다`,
        ],
        ["간선 20 개짜리 입력이면", `${comma(2 ** 20)} 개`],
        ["간선 30 개짜리 입력이면", `${comma(2 ** 30)} 개`],
      ]),
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  greedyVsAugment: () => {
    const rows: string[][] = [
      [
        "입력",
        "L",
        "R",
        "E",
        "그리디의 답",
        "그리디의 읽기",
        "재배정을 허용한 답",
        "그쪽의 읽기",
        "두 답이 같은가",
      ],
    ];
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
      ["재배정이 두 칸 필요한 3 × 3", RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      ["홀의 예시 4 × 4", HALL_L, HALL_R, HALL_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      ["계단 (n = 8)", 8, 8, stair(8)],
    ];
    let same = 0;
    for (const [name, l, r, e] of cases) {
      const g = greedy(l, r, e);
      const c = counted(l, r, e);
      if (g.size === c.size) same++;
      rows.push([
        name,
        String(l),
        String(r),
        String(e.length),
        String(g.size),
        comma(g.reads),
        String(c.size),
        comma(c.reads),
        g.size === c.size ? "같다" : "다르다",
      ]);
    }
    return [
      ...table(rows, [1, 2, 3, 4, 5, 6, 7]),
      "",
      ...captions([
        ["답이 같은 입력", `${same} / ${rows.length - 1}`],
        [
          "그리디가 적게 읽는 이유",
          "빈자리를 만나면 거기서 멈추고 짝이 있는 자리는 지나쳐 버린다",
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ⑤ — 증대 경로 하나를 찾아 뒤집는 과정을 값으로 낸다. */
  augmentTrace: () => {
    const c = counted(WALK_L, WALK_R, WALK_EDGES);
    const rows: string[][] = [
      ["걸음", "지금 보는 자리", "무엇", "뒤집기 뒤의 matchR"],
    ];
    for (const s of c.steps.slice(2, 7)) {
      rows.push([
        s.kind,
        s.v === null ? `L${s.u}` : `L${s.u}−R${s.v}`,
        s.note,
        dash(s.matchR),
      ]);
    }
    const before = c.steps[1] as Step;
    const after = c.steps[6] as Step;
    return [
      ...table(rows),
      "",
      ...captions([
        ["뒤집기 전의 matchR", dash(before.matchR)],
        ["뒤집기 전의 매칭 크기", String(pairCount(before.matchR))],
        ["뒤집기 뒤의 matchR", dash(after.matchR)],
        ["뒤집기 뒤의 매칭 크기", String(pairCount(after.matchR))],
        ["경로", "R1 — L0 — R0 — L1"],
        ["경로 위의 간선 수", "3 — 매칭 밖 둘과 매칭 안 하나"],
      ]),
    ].join("\n");
  },

  /** deep.build ⑥ — 증대 경로 기준이 정의와 같은 답을 내는가. */
  criterionCheck: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
      ["재배정이 두 칸 필요한 3 × 3", RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      ["왼쪽 셋이 오른쪽 하나만", NARROW_L, NARROW_R, NARROW_EDGES],
      ["같은 간선이 두 번", DUP_L, DUP_R, DUP_EDGES],
      ["간선이 없다", NONE_L, NONE_R, NONE_EDGES],
      ["완전 이분 3 × 3", 3, 3, complete(3)],
      ["계단 (n = 4)", 4, 4, stair(4)],
      [
        "왼쪽 5 · 오른쪽 2 완전",
        5,
        2,
        complete(2).concat([
          [2, 0],
          [2, 1],
          [3, 0],
          [3, 1],
          [4, 0],
          [4, 1],
        ] as Edge[]),
      ],
    ];
    const rows: string[][] = [
      [
        "입력",
        "L",
        "R",
        "E",
        "증대 경로가 낸 답",
        "간선 부분집합 전수의 답",
        "두 답이 같은가",
      ],
    ];
    let same = 0;
    for (const [name, l, r, e] of cases) {
      const a = maxBipartiteMatching(l, r, e);
      const b = bruteForce(l, r, e).size;
      if (a === b) same++;
      rows.push([
        name,
        String(l),
        String(r),
        String(e.length),
        String(a),
        String(b),
        a === b ? "예" : "아니오",
      ]);
    }
    return [
      ...table(rows, [1, 2, 3, 4, 5]),
      "",
      ...captions([
        [
          "열 줄 모두 두 답이 같은가",
          same === rows.length - 1 ? "예" : "아니오",
        ],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 같은 간선이 두 번 들어와도 답이 그대로다. */
  pauseDupEdges: () => {
    const cases: [string, number, number, Edge[], Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES, WALK_EDGES.concat(WALK_EDGES)],
      [
        "완전 매칭이 있는 3 × 3",
        FULL_L,
        FULL_R,
        FULL_EDGES,
        FULL_EDGES.concat(FULL_EDGES),
      ],
      [
        "오른쪽이 하나뿐",
        ONER_L,
        ONER_R,
        ONER_EDGES,
        ONER_EDGES.concat(ONER_EDGES),
      ],
      ["계단 (n = 6)", 6, 6, stair(6), stair(6).concat(stair(6))],
    ];
    const rows: string[][] = [
      [
        "입력",
        "한 벌의 답",
        "두 벌의 답",
        "판정",
        "한 벌의 읽기",
        "두 벌의 읽기",
      ],
    ];
    let same = 0;
    for (const [name, l, r, one, two] of cases) {
      const a = maxBipartiteMatching(l, r, one);
      const b = maxBipartiteMatching(l, r, two);
      if (a === b) same++;
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        comma(counted(l, r, one).reads),
        comma(counted(l, r, two).reads),
      ]);
    }
    return [
      ...table(rows, [1, 2, 4, 5]),
      "",
      ...captions([
        ["답이 같은 입력", `${same} / ${rows.length - 1}`],
        ["갈리는 것", "이웃 목록의 자리 수와 그것을 읽는 횟수뿐이다"],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 방문 표를 나눠 쓰면 재배정 갈래가 한 번도 실행되지 않는다. */
  pauseSeenReset: () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "방문 표를 나눠 쓰는 판",
        "판정",
        "그리디의 답",
        "바꾼 판이 그리디와 같은가",
        "정본이 내려간 횟수",
      ],
    ];
    let diff = 0;
    let asGreedy = 0;
    for (const [name, l, r, e] of 변이_입력) {
      const a = maxBipartiteMatching(l, r, e);
      const b = sharedSeen.maxBipartiteMatching(l, r, e);
      const g = greedy(l, r, e).size;
      if (a !== b) diff++;
      if (b === g) asGreedy++;
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        String(g),
        b === g ? "같다" : "다르다",
        String(
          counted(l, r, e).steps.filter((x) => x.kind === "내려간다").length,
        ),
      ]);
    }
    return [
      ...table(rows, [1, 2, 4, 6]),
      "",
      ...captions([
        ["답이 갈린 입력", `${diff} / ${변이_입력.length}`],
        [
          "바꾼 판이 그리디와 같은 답을 낸 입력",
          `${asGreedy} / ${변이_입력.length}`,
        ],
        [
          "전개 입력에서 무슨 일이 나는가",
          중화됨
            ? "-"
            : `L1 의 탐색이 R0 을 이미 본 자리로 읽어 그대로 실패한다 — 답이 ${maxBipartiteMatching(WALK_L, WALK_R, WALK_EDGES)} 에서 ${sharedSeen.maxBipartiteMatching(WALK_L, WALK_R, WALK_EDGES)} 로 준다`,
        ],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 자리를 적을 때마다 세면 답이 커진다. */
  pauseCountInside: () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "자리를 적을 때마다 세는 판",
        "판정",
        "정본이 자리를 적은 횟수",
        "그중 재배정",
      ],
    ];
    let diff = 0;
    for (const [name, l, r, e] of 변이_입력) {
      const a = maxBipartiteMatching(l, r, e);
      const b = countInside.maxBipartiteMatching(l, r, e);
      const c = counted(l, r, e);
      if (a !== b) diff++;
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        String(c.frees + c.moves),
        String(c.moves),
      ]);
    }
    return [
      ...table(rows, [1, 2, 4, 5]),
      "",
      ...captions([
        ["답이 갈린 입력", `${diff} / ${변이_입력.length}`],
        [
          "바뀐 답이 어떻게 나오는가",
          "정본의 답에 자리를 적은 횟수를 더한 값이다",
        ],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 왼쪽 정점을 보는 순서를 바꿔도 크기는 안 갈린다. */
  pauseOrder: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
      ["재배정이 두 칸 필요한 3 × 3", RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      ["홀의 예시 4 × 4", HALL_L, HALL_R, HALL_EDGES],
      ["계단 (n = 6)", 6, 6, stair(6)],
      ["성긴 무작위 (n = 40)", 40, 40, scatter(40, 3, 20260907)],
    ];
    const rows: string[][] = [
      [
        "입력",
        "그대로의 크기",
        "왼쪽을 거꾸로 본 크기",
        "크기 판정",
        "짝 표가 같은가",
      ],
    ];
    let sameSize = 0;
    let sameTable = 0;
    for (const [name, l, r, e] of cases) {
      const a = counted(l, r, e);
      // 왼쪽 번호를 뒤집어 같은 그래프를 다른 순서로 준다.
      const flipped = e.map(([u, v]) => [l - 1 - u, v] as Edge);
      const b = counted(l, r, flipped);
      const back = show(b.matchR.map((u) => (u === -1 ? -1 : l - 1 - u)));
      if (a.size === b.size) sameSize++;
      if (show(a.matchR) === back) sameTable++;
      rows.push([
        name,
        String(a.size),
        String(b.size),
        a.size === b.size ? "같다" : "다르다",
        show(a.matchR) === back ? "같다" : "다르다",
      ]);
    }
    return [
      ...table(rows, [1, 2]),
      "",
      ...captions([
        ["크기가 같은 입력", `${sameSize} / ${rows.length - 1}`],
        ["짝 표까지 같은 입력", `${sameTable} / ${rows.length - 1}`],
      ]),
    ].join("\n");
  },

  /** deep.walk — 열네 걸음을 값까지 펼쳐 적는다. */
  walkTrace: () => table(walkRows(), [6, 7]).join("\n"),

  /** deep.walk — 아홉 갈래가 전부 실행됐는가. */
  branchCoverage: () => {
    const a = counted(WALK_L, WALK_R, WALK_EDGES);
    const b = counted(ONER_L, ONER_R, ONER_EDGES);
    const at = (c: Counted, kind: string): number =>
      c.steps.filter((s) => s.kind === kind).length;
    const col = (c: Counted): number[] => [
      1,
      1,
      c.starts + at(c, "내려간다"),
      c.skips,
      c.frees,
      at(c, "내려간다"),
      c.frees + c.moves,
      c.fails,
      c.starts,
    ];
    const x = col(a);
    const y = col(b);
    const rows: string[][] = [
      ["라벨", "무엇", "전개 입력", "오른쪽이 하나뿐인 4 × 1"],
    ];
    LABELS.forEach(([mark, what], i) => {
      rows.push([mark, what, String(x[i] ?? 0), String(y[i] ?? 0)]);
    });
    const zero =
      x.filter((n) => n === 0).length + y.filter((n) => n === 0).length;
    return [
      ...table(rows, [2, 3]),
      "",
      ...captions([["0 인 칸의 수", String(zero)]]),
    ].join("\n");
  },

  /** related — 쾨니그 정리. 매칭 크기와 최소 정점 덮개 크기가 같은가. */
  konigCover: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      ["왼쪽 셋이 오른쪽 하나만", NARROW_L, NARROW_R, NARROW_EDGES],
      ["간선이 없다", NONE_L, NONE_R, NONE_EDGES],
      ["계단 (n = 4)", 4, 4, stair(4)],
      ["홀의 예시 4 × 4", HALL_L, HALL_R, HALL_EDGES],
    ];
    const rows: string[][] = [
      [
        "입력",
        "매칭 크기",
        "탐색이 도달한 왼쪽",
        "탐색이 본 오른쪽",
        "덮개",
        "덮개 크기",
        "정점 부분집합 전수의 최소 덮개",
        "안 덮인 간선",
      ],
    ];
    let same = 0;
    for (const [name, l, r, e] of cases) {
      const c = reachAndCover(l, r, e);
      const brute = coverBrute(l, r, e);
      if (c.coverL.length + c.coverR.length === brute && brute === c.size) {
        same++;
      }
      rows.push([
        name,
        String(c.size),
        `{${c.zl.map((u) => `L${u}`).join(", ")}}`,
        `{${c.zr.map((v) => `R${v}`).join(", ")}}`,
        `{${c.coverL
          .map((u) => `L${u}`)
          .concat(c.coverR.map((v) => `R${v}`))
          .join(", ")}}`,
        String(c.coverL.length + c.coverR.length),
        String(brute),
        String(c.uncovered),
      ]);
    }
    return [
      ...table(rows, [1, 5, 6, 7]),
      "",
      ...captions([["세 수가 모두 같은 줄", `${same} / ${rows.length - 1}`]]),
    ].join("\n");
  },

  /** deep.math ② — 대칭차를 전개 입력에 넣어 검산한다. */
  mathSymDiff: () => {
    const c = counted(WALK_L, WALK_R, WALK_EDGES);
    const small = c.steps[1] as Step; // T3 직후 — 매칭 하나
    const big = c.steps[6] as Step; // T8 직후 — 매칭 둘
    const asEdges = (m: number[]): [number, number][] =>
      m.map((u, v) => [u, v] as [number, number]).filter(([u]) => u !== -1);
    const key = ([u, v]: [number, number]): string => `L${u}R${v}`;
    const M = asEdges(small.matchR);
    const N = asEdges(big.matchR);
    const inM = new Set(M.map(key));
    const inN = new Set(N.map(key));
    const rows: string[][] = [
      ["간선", "M 에 있는가", "M* 에 있는가", "대칭차에 있는가"],
    ];
    for (const e of [...M, ...N]) {
      const k = key(e);
      if (rows.some((r) => r[0] === k)) continue;
      const a = inM.has(k);
      const b = inN.has(k);
      rows.push([
        k,
        a ? "예" : "아니오",
        b ? "예" : "아니오",
        a !== b ? "예" : "아니오",
      ]);
    }
    const sym = [...M, ...N].filter((e) => inM.has(key(e)) !== inN.has(key(e)));
    return [
      ...table(rows),
      "",
      ...captions([
        ["M", `{${M.map(key).join(", ")}} — 크기 ${M.length}`],
        ["M*", `{${N.map(key).join(", ")}} — 크기 ${N.length}`],
        ["대칭차", `{${sym.map(key).join(", ")}} — 간선 ${sym.length} 개`],
        ["대칭차가 이루는 것", "R1 — L0 — R0 — L1 경로 하나"],
        ["양 끝", "R1 과 L1 — 둘 다 M 에서 짝이 없다"],
        ["M* 간선에서 M 간선을 뺀 수", `${N.length - M.length}`],
      ]),
    ].join("\n");
  },

  /** deep.math ④ — 계단에서 탐색별 읽기와 닫힌 형태. */
  mathStairCount: () => {
    const rows: string[][] = [
      ["n", "간선 E", "탐색별 읽기", "합", "n(n+1)(n+2)/6", "완전 이분의 읽기"],
    ];
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const per = perSearchReads(n, n, stair(n));
      rows.push([
        String(n),
        String(stair(n).length),
        per.join(" "),
        String(per.reduce((a, b) => a + b, 0)),
        String((n * (n + 1) * (n + 2)) / 6),
        String(readsFast(n, n, complete(n))),
      ]);
    }
    const big: string[][] = [
      ["n", "계단의 읽기", "n(n+1)(n+2)/6", "완전 이분의 읽기"],
    ];
    let match = 0;
    for (const n of [16, 64, 200]) {
      const a = readsFast(n, n, stair(n));
      const f = (n * (n + 1) * (n + 2)) / 6;
      const k = readsFast(n, n, complete(n));
      if (a === f && k === f) match++;
      big.push([String(n), comma(a), comma(f), comma(k)]);
    }
    return [
      ...table(rows, [0, 1, 3, 4, 5]),
      "",
      ...table(big, [0, 1, 2, 3]),
      "",
      ...captions([
        ["세 줄 모두 셋이 같은 값인가", match === 3 ? "예" : "아니오"],
        [
          `제약 상한 L = R = ${comma(L_LIMIT)} 이면`,
          `${comma((L_LIMIT * (L_LIMIT + 1) * (L_LIMIT + 2)) / 6)} 번`,
        ],
        ["같은 규모의 L·E 상한", `${comma(L_LIMIT * E_LIMIT)} 번`],
      ]),
    ].join("\n");
  },

  /** invariant ② — 검사 시점마다 두 문장이 참인가. */
  invariantWatch: () => {
    const c = counted(WALK_L, WALK_R, WALK_EDGES);
    const rows: string[][] = [
      [
        "걸음",
        "무엇",
        "matchR",
        "깊이",
        "검사 시점인가",
        "matchR 이 매칭인가",
        "짝의 수",
        "size",
        "판정",
      ],
    ];
    let checks = 0;
    let held = 0;
    c.steps.forEach((s, i) => {
      const m = isMatching(s.matchR);
      const n = pairCount(s.matchR);
      const at = s.depth === 0;
      if (at) {
        checks++;
        if (m && n === s.size) held++;
      }
      rows.push([
        `T${i + 2}`,
        s.kind,
        dash(s.matchR),
        String(s.depth),
        at ? "예" : "아니오",
        m ? "예" : "아니오",
        String(n),
        String(s.size),
        at ? (m && n === s.size ? "지킨다" : "깨진다") : "-",
      ]);
    });
    return [
      ...table(rows, [3, 6, 7]),
      "",
      ...captions([
        ["검사 시점인 걸음", `${checks} 개`],
        ["그중 두 문장이 다 참인 것", `${held} 개`],
        [
          "탐색 도중에 matchR 이 매칭이 아닌 걸음",
          `${c.steps.filter((s) => s.depth > 0 && !isMatching(s.matchR)).length} 개`,
        ],
      ]),
    ].join("\n");
  },

  /** invariant ② — 경계에 놓인 입력에서도 같은 문장이 성립하는가. */
  invariantEdges: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["왼쪽 1 · 오른쪽 1 · 간선 없음", 1, 1, []],
      ["왼쪽 1 · 오른쪽 1 · 간선 하나", 1, 1, [[0, 0]]],
      ["왼쪽 0 · 오른쪽 0", 0, 0, []],
      ["간선이 없다", NONE_L, NONE_R, NONE_EDGES],
      ["같은 간선이 두 번", DUP_L, DUP_R, DUP_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      [
        "왼쪽 5 · 오른쪽 2 완전",
        5,
        2,
        [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
          [2, 0],
          [2, 1],
          [3, 0],
          [3, 1],
          [4, 0],
          [4, 1],
        ] as Edge[],
      ],
      ["계단 (n = 8)", 8, 8, stair(8)],
    ];
    const rows: string[][] = [
      [
        "입력",
        "L",
        "R",
        "E",
        "답",
        "matchR",
        "매칭인가",
        "짝의 수 = 답",
        "읽기",
        "방문 표 쓰기",
      ],
    ];
    let ok = 0;
    for (const [name, l, r, e] of cases) {
      const c = counted(l, r, e);
      const ref = maxBipartiteMatching(l, r, e);
      const good = isMatching(c.matchR) && pairCount(c.matchR) === ref;
      if (good) ok++;
      rows.push([
        name,
        String(l),
        String(r),
        String(e.length),
        String(ref),
        dash(c.matchR),
        isMatching(c.matchR) ? "예" : "아니오",
        pairCount(c.matchR) === ref ? "예" : "아니오",
        String(c.reads),
        String(c.fills),
      ]);
    }
    return [
      ...table(rows, [1, 2, 3, 4, 8, 9]),
      "",
      ...captions([["두 문장이 다 참인 줄", `${ok} / ${rows.length - 1}`]]),
    ].join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 바꾸면 답이 어떻게 되는가. */
  mutantSteal: () => {
    const lines = mutantTable(takeAnyway, "자리를 그냥 가져가는 판", 변이_입력);
    const diff = 변이_입력.filter(
      ([, l, r, e]) =>
        maxBipartiteMatching(l, r, e) !==
        takeAnyway.maxBipartiteMatching(l, r, e),
    ).length;
    const bigger = 변이_입력.filter(
      ([, l, r, e]) =>
        takeAnyway.maxBipartiteMatching(l, r, e) >
        maxBipartiteMatching(l, r, e),
    ).length;
    return [
      ...lines,
      "",
      ...captions([
        ["답이 갈린 입력", `${diff} / ${변이_입력.length}`],
        ["바뀐 답이 정본보다 큰 입력", `${bigger} / ${변이_입력.length}`],
        [
          "왼쪽 셋이 오른쪽 하나만 보는 입력에서",
          중화됨
            ? "-"
            : `정본은 ${maxBipartiteMatching(NARROW_L, NARROW_R, NARROW_EDGES)} · 바꾼 판은 ${takeAnyway.maxBipartiteMatching(NARROW_L, NARROW_R, NARROW_EDGES)} — 오른쪽 정점이 하나뿐인데 셋이라고 답한다`,
        ],
      ]),
    ].join("\n");
  },

  /** perf.derive — 걸음마다 읽은 자리와 누적. */
  perfCount: () => {
    const c = counted(WALK_L, WALK_R, WALK_EDGES);
    const rows: string[][] = [
      ["걸음", "갈래", "자리", "이 걸음이 읽은 자리", "누적"],
    ];
    let prev = 0;
    c.steps.forEach((s, i) => {
      rows.push([
        `T${i + 2}`,
        s.kind,
        s.v === null ? `L${s.u}` : `L${s.u}−R${s.v}`,
        String(s.reads - prev),
        String(s.reads),
      ]);
      prev = s.reads;
    });
    return [
      ...table(rows, [3, 4]),
      "",
      ...captions([
        [
          "이웃 자리 읽기",
          `${c.reads} 이고 이웃 목록의 자리 총수는 ${c.slots}`,
        ],
        ["방문 표 쓰기", `${c.fills} 이고 L·R = ${WALK_L * WALK_R}`],
        [
          "간선 목록 읽기",
          `${WALK_EDGES.length} 이고 E = ${WALK_EDGES.length}`,
        ],
        ["탐색 시작", `${c.starts} 이고 L = ${WALK_L}`],
      ]),
    ].join("\n");
  },

  /** perf.bounds — 모양을 바꿔 가며 세 계수를 잰다. */
  perfObserved: () => {
    const n = 64;
    const cases: [string, Edge[]][] = [
      ["사슬", line(n)],
      ["별", star(n)],
      ["계단을 뒤집은 것", stairUp(n)],
      ["성긴 무작위 (한 정점당 4)", scatter(n, 4, 20260907)],
      ["계단", stair(n)],
      ["완전 이분", complete(n)],
      ["블록 가족 (k = 42)", block(n, 42)],
    ];
    const rows: string[][] = [
      [
        "모양 (L = R = 64)",
        "간선 E",
        "이웃 자리 읽기",
        "방문 표 쓰기",
        "L·R",
        "답",
        "재귀 깊이",
      ],
    ];
    let fixed = 0;
    for (const [name, e] of cases) {
      const c = counted(n, n, e);
      if (c.fills === n * n) fixed++;
      rows.push([
        name,
        comma(e.length),
        comma(c.reads),
        comma(c.fills),
        comma(n * n),
        String(c.size),
        String(c.maxDepth),
      ]);
    }
    return [
      ...table(rows, [1, 2, 3, 4, 5, 6]),
      "",
      ...captions([
        ["방문 표 쓰기가 L·R 과 같은 줄", `${fixed} / ${rows.length - 1}`],
        ["모양을 따라 갈리는 것", "이웃 자리 읽기 · 답 · 재귀 깊이 셋뿐이다"],
      ]),
    ].join("\n");
  },

  /** perf.worst — 정점 수를 못 박고 간선 부분집합을 전부 만들어 가장 많이 읽는 입력을 찾는다. */
  worstExhaustive: () => {
    const rows: string[][] = [
      [
        "L = R",
        "그래프 수 2^(n²)",
        "읽기의 최댓값",
        "그 최댓값을 내는 그래프 (줄이 왼쪽 정점)",
        "블록 가족의 k",
        "완전 이분의 읽기",
      ],
    ];
    for (const n of [2, 3, 4]) {
      const all: Edge[] = [];
      for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) all.push([u, v]);
      let best = -1;
      let bestEdges: Edge[] = [];
      for (let mask = 0; mask < 1 << all.length; mask++) {
        const e: Edge[] = [];
        for (let i = 0; i < all.length; i++) {
          if ((mask >> i) & 1) e.push(all[i] as Edge);
        }
        const r = readsFast(n, n, e);
        if (r > best) {
          best = r;
          bestEdges = e;
        }
      }
      let hitK = -1;
      for (let k = 0; k <= n; k++) {
        if (readsFast(n, n, block(n, k)) === best) {
          hitK = k;
          break;
        }
      }
      const grid = Array.from({ length: n }, (_, u) =>
        Array.from({ length: n }, (_, v) =>
          bestEdges.some(([a, b]) => a === u && b === v) ? "1" : "0",
        ).join(""),
      ).join(" ");
      rows.push([
        String(n),
        comma(1 << all.length),
        String(best),
        grid,
        hitK < 0 ? "없다" : String(hitK),
        String(readsFast(n, n, complete(n))),
      ]);
    }
    return [
      ...table(rows, [0, 1, 2, 4, 5]),
      "",
      ...captions([
        [
          "세 줄 모두 최댓값을 내는 그래프가 블록 가족 안에 있는가",
          rows.slice(1).every((r) => r[4] !== "없다") ? "예" : "아니오",
        ],
        [
          "완전 이분이 최댓값인가",
          rows.slice(1).every((r) => r[2] === r[5]) ? "예" : "아니오",
        ],
      ]),
    ].join("\n");
  },

  /** perf.worst — 블록 크기를 바꿔 가며 읽기가 가장 커지는 자리를 찾는다. */
  worstFamily: () => {
    const n = 32;
    const rows: string[][] = [
      ["블록 크기 k", "간선 E", "이웃 자리 읽기", "답"],
    ];
    let best = -1;
    let bestK = -1;
    for (let k = 0; k <= n; k++) {
      const r = readsFast(n, n, block(n, k));
      if (r > best) {
        best = r;
        bestK = k;
      }
    }
    const ks = [...new Set([0, 8, 16, 20, bestK, 24, 28, 31, 32])].sort(
      (a, b) => a - b,
    );
    for (const k of ks) {
      const e = block(n, k);
      const c = counted(n, n, e);
      rows.push([String(k), comma(e.length), comma(c.reads), String(c.size)]);
    }
    return [
      ...table(rows, [0, 1, 2, 3]),
      "",
      ...captions([
        ["읽기가 가장 큰 k", `${bestK} — ${comma(best)} 번`],
        ["k = 0 (완전 이분)", `${comma(readsFast(n, n, block(n, 0)))} 번`],
        ["n(n+1)(n+2)/6", comma((n * (n + 1) * (n + 2)) / 6)],
        [
          "가장 큰 값이 그 식의 몇 배인가",
          (best / ((n * (n + 1) * (n + 2)) / 6)).toFixed(3),
        ],
      ]),
    ].join("\n");
  },

  /** perf.worst — 그 모양에서 규모를 키우면 읽기가 어떻게 자라는가. */
  worstGrowth: () => {
    const rows: string[][] = [
      [
        "L = R",
        "블록 크기 k",
        "간선 E",
        "이웃 자리 읽기",
        "직전 줄의 몇 배",
        "n³ 에 대한 비",
        "L·E",
      ],
    ];
    let prev = 0;
    for (const n of [32, 64, 128, 256]) {
      const k = Math.floor((2 * n) / 3);
      const e = block(n, k);
      const r = readsFast(n, n, e);
      rows.push([
        String(n),
        String(k),
        comma(e.length),
        comma(r),
        prev === 0 ? "-" : (r / prev).toFixed(2),
        (r / n ** 3).toFixed(4),
        comma(n * e.length),
      ]);
      prev = r;
    }
    return [
      ...table(rows, [0, 1, 2, 3, 4, 5, 6]),
      "",
      ...captions([
        ["정점 수를 두 배로 하면", "읽기가 여덟 배 언저리가 된다"],
        ["L·E 상한에 대한 비", "규모를 키워도 상한에는 한참 못 미친다"],
      ]),
    ].join("\n");
  },
};
