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
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 걸음만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **큰 입력에는 가벼운 사본을 쓴다.** 걸음을 기록하는 `counted` 는 걸음마다 배열을 복사하므로
 * 이웃 자리 읽기가 수백만 번인 입력에서는 메모리가 모자란다. 그런 표는 값만 세는 `fast` 로 잰다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * 증명 표의 문장과 판정 열 밖의 칸에는 판정 낱말(같다 · 다르다 · 갈린다)을 쓰지 않는다 —
 * `check-proof` 가 그 낱말이 든 줄을 판정 줄로 읽는다. 판정 열 밖에서는 「일치 · 불일치」를 쓴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { maxFlow } from "../maxFlow/maxFlow-guide.ref.ts";
import {
  N as ALT_N,
  증가경로설계,
  홉크로프트카프설계,
} from "./maxBipartiteMatching-guide.alt.ts";
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

/** 왼쪽 다섯이 오른쪽 둘 전부와 이어진다. */
export const WIDE_L = 5;
export const WIDE_R = 2;
export const WIDE_EDGES: Edge[] = [
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
 * 재배정 사슬이 가장 깊어지는 입력 — 왼쪽 `n` 개 · 오른쪽 `n` 개.
 *
 * 앞의 `n − 1` 개는 이웃 목록 `[R_u, R_{u+1}]` 이라 첫 이웃을 곧바로 받는다. 마지막 왼쪽 정점은
 * `R0` 하나만 보므로, 그 탐색이 `L0 → L1 → …` 을 한 칸씩 옮기며 끝의 `R_{n−1}` 까지 간다.
 */
export function deepChain(n: number): Edge[] {
  const e: Edge[] = [];
  for (let u = 0; u < n - 1; u++) {
    e.push([u, u]);
    e.push([u, u + 1]);
  }
  e.push([n - 1, 0]);
  return e;
}

/** xorshift — 곱셈 하나짜리 생성식은 아래 비트의 주기가 짧아 정점 수로 나눈 나머지가 되풀이된다. */
function xorshift(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s ^= s << 13;
    s |= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s |= 0;
    return s >>> 0;
  };
}

/** 생성식으로 고정한 성긴 그래프. 왼쪽 정점마다 `deg` 개의 오른쪽 정점을 뽑는다. */
export function scatter(n: number, deg: number, seed: number): Edge[] {
  const next = xorshift(seed);
  const e: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let k = 0; k < deg; k++) e.push([u, next() % n]);
  }
  return e;
}

/** 작은 무작위 그래프 여러 벌 — 왼쪽 · 오른쪽 1~5 개, 간선은 그 곱 이하. 시드로 고정한다. */
export function smallRandom(
  count: number,
  seed: number,
): [number, number, Edge[]][] {
  const next = xorshift(seed);
  const out: [number, number, Edge[]][] = [];
  for (let round = 0; round < count; round++) {
    const l = (next() % 5) + 1;
    const r = (next() % 5) + 1;
    const m = next() % (l * r + 1);
    const e: Edge[] = [];
    for (let i = 0; i < m; i++) e.push([next() % l, next() % r]);
    out.push([l, r, e]);
  }
  return out;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `20,000,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 짝 배열 표기 — `[0, -, -]`. `-` 가 `-1`, 곧 짝이 없는 칸이다. */
export const dash = (a: readonly number[]): string =>
  `[${a.map((x) => (x < 0 ? "-" : String(x))).join(", ")}]`;

/** 방문 배열 표기 — `[T, F, F]`. */
export const tf = (a: readonly boolean[]): string =>
  `[${a.map((b) => (b ? "T" : "F")).join(", ")}]`;

/** 간선 이름 — `L0R1`. */
export const en = ([u, v]: readonly [number, number]): string => `L${u}R${v}`;

/** 정점 · 간선 집합 표기 — `{L0, R0}`. */
export const set = (xs: readonly string[]): string => `{${xs.join(", ")}}`;

/** 마크다운 표 한 벌. 첫 행이 머리줄이고 `right` 열은 오른쪽으로 맞춘다. */
export function md(
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string[] {
  const head = rows[0] ?? [];
  const lines = [`| ${head.join(" | ")} |`];
  lines.push(
    `| ${head.map((_, i) => (right.includes(i) ? "---:" : "---")).join(" | ")} |`,
  );
  for (const r of rows.slice(1)) lines.push(`| ${r.join(" | ")} |`);
  return lines;
}

/** 표 한 벌과 그 아래 문장 — 닫는 마커까지 대조하는 블록의 몸통. */
const withText = (
  rows: readonly (readonly string[])[],
  right: readonly number[],
  text: string,
): string => [...md(rows, right), "", text].join("\n");

/** 텍스트 블록의 이름 칸을 맞춘다 — 한글은 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, ch) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(ch) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));
function kv(rows: [string, string][], indent = "  "): string[] {
  const w = Math.max(...rows.map(([k]) => width(k)));
  return rows.map(([k, v]) =>
    `${indent}${pad(k, w)}  ${v}`.replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 걸음 하나의 기록. `label` 이 이 걸음이 실행한 갈래의 원문자다. */
export interface Step {
  kind: "시작" | "잇는다" | "내려간다" | "넘어간다" | "옮긴다" | "실패";
  label: string;
  u: number;
  v: number | null;
  /** 내려간 걸음이면 `v` 의 옛 짝, 옮긴 걸음이면 옮겨 간 옛 짝. */
  owner: number | null;
  matchR: number[];
  seen: boolean[];
  /** 호출 스택 — 지금 실행 중인 탐색이 들어간 왼쪽 정점을 바깥부터. */
  call: number[];
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
  /** 탐색마다 성공했는가 — 왼쪽 정점 순서대로. */
  results: boolean[];
}

/**
 * 정본과 같은 절차이고 세는 자리와 걸음 기록만 덧붙였다.
 *
 * `reads` 는 이웃 목록의 자리를 하나 읽은 횟수, `fills` 는 방문 배열에 쓴 칸 수,
 * `slots` 는 이웃 목록의 자리 총수(= 간선 수)다.
 */
export function counted(left: number, right: number, edges: Edge[]): Counted {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);

  const steps: Step[] = [];
  const call: number[] = [];
  const results: boolean[] = [];
  let reads = 0;
  let fills = 0;
  let size = 0;
  let maxDepth = 0;
  let starts = 0;
  let skips = 0;
  let frees = 0;
  let moves = 0;
  let fails = 0;

  const push = (
    kind: Step["kind"],
    label: string,
    u: number,
    v: number | null,
    owner: number | null,
    depth: number,
    note: string,
  ): void => {
    steps.push({
      kind,
      label,
      u,
      v,
      owner,
      matchR: [...matchR],
      seen: [...seen],
      call: [...call],
      depth,
      size,
      note,
      reads,
    });
  };

  const augment = (u: number, depth: number): boolean => {
    if (depth > maxDepth) maxDepth = depth;
    call.push(u);
    for (const v of adj[u] as number[]) {
      reads++;
      if (seen[v] === true) {
        skips++;
        push(
          "넘어간다",
          "④",
          u,
          v,
          null,
          depth,
          `R${v}${을를(`R${v}`)} 이미 봤다`,
        );
        continue;
      }
      seen[v] = true;
      if ((matchR[v] as number) === -1) {
        frees++;
        matchR[v] = u;
        push(
          "잇는다",
          "⑤⑦",
          u,
          v,
          null,
          depth,
          `R${v}${이가(`R${v}`)} 빈자리라 matchR[${v}] = ${u}`,
        );
        call.pop();
        return true;
      }
      const owner = matchR[v] as number;
      push(
        "내려간다",
        "⑥",
        u,
        v,
        owner,
        depth,
        `R${v} 의 짝 L${owner}${을를(`L${owner}`)} 다른 자리로 옮길 수 있는가`,
      );
      if (augment(owner, depth + 1)) {
        moves++;
        matchR[v] = u;
        push(
          "옮긴다",
          "⑦",
          u,
          v,
          owner,
          depth,
          `L${owner}${이가(`L${owner}`)} 옮겨 가서 matchR[${v}] = ${u}`,
        );
        call.pop();
        return true;
      }
    }
    fails++;
    push(
      "실패",
      "⑧",
      u,
      null,
      null,
      depth,
      `L${u} 의 이웃을 다 봤지만 증가 경로가 없다`,
    );
    call.pop();
    return false;
  };

  for (let u = 0; u < left; u++) {
    seen.fill(false);
    fills += right;
    starts++;
    push(
      "시작",
      "⑨",
      u,
      null,
      null,
      0,
      `방문 배열을 비우고 L${u} 에서 탐색을 시작한다`,
    );
    const ok = augment(u, 1);
    results.push(ok);
    if (ok) size++;
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
    results,
  };
}

/**
 * 이웃 자리 읽기와 가장 깊은 재귀만 세는 가벼운 사본 — 걸음을 기록하지 않는다.
 *
 * 이웃 자리 읽기가 수백만 번인 입력이 있어서, 걸음마다 배열을 복사하는 `counted` 로는 감당이
 * 안 된다. 두 사본이 같은 수를 내는지는 `자기대조()` 가 확인한다.
 */
export function fast(
  left: number,
  right: number,
  edges: Edge[],
): { size: number; reads: number; maxDepth: number } {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);
  let reads = 0;
  let maxDepth = 0;
  const augment = (u: number, depth: number): boolean => {
    if (depth > maxDepth) maxDepth = depth;
    for (const v of adj[u] as number[]) {
      reads++;
      if (seen[v] === true) continue;
      seen[v] = true;
      if (
        (matchR[v] as number) === -1 ||
        augment(matchR[v] as number, depth + 1)
      ) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  };
  let size = 0;
  for (let u = 0; u < left; u++) {
    seen.fill(false);
    if (augment(u, 1)) size++;
  }
  return { size, reads, maxDepth };
}

/** 이웃 자리 읽기만. */
export const readsFast = (left: number, right: number, edges: Edge[]): number =>
  fast(left, right, edges).reads;

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
): {
  size: number;
  matchR: number[];
  reads: number;
  rows: { u: number; read: number[]; took: number | null }[];
} {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const rows: { u: number; read: number[]; took: number | null }[] = [];
  let size = 0;
  let reads = 0;
  for (let u = 0; u < left; u++) {
    const read: number[] = [];
    let took: number | null = null;
    for (const v of adj[u] as number[]) {
      reads++;
      read.push(v);
      if ((matchR[v] as number) === -1) {
        matchR[v] = u;
        size++;
        took = v;
        break;
      }
    }
    rows.push({ u, read, took });
  }
  return { size, matchR, reads, rows };
}

/**
 * 정의를 그대로 옮긴 방법 — 간선의 부분집합을 전부 만들어 매칭인 것 중 가장 큰 것을 고른다.
 *
 * `subsets` 는 만든 부분집합 수, `checks` 는 간선 하나가 끝점을 함께 쓰는지 본 횟수다.
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
  matchR: number[];
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
    matchR,
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

/** `matchR` 이 매칭인가 — 오른쪽마다 칸 하나라 저절로 하나이고, 왼쪽이 두 칸에 적히면 아니다. */
export function isMatching(matchR: readonly number[]): boolean {
  const seenLeft = new Set<number>();
  for (const u of matchR) {
    if (u === -1) continue;
    if (seenLeft.has(u)) return false;
    seenLeft.add(u);
  }
  return true;
}

/** `matchR` 이 나타내는 간선 수. */
export function pairCount(matchR: readonly number[]): number {
  return matchR.filter((u) => u !== -1).length;
}

/** `matchR` 이 나타내는 간선 목록 — 오른쪽 번호 순서. */
export function pairsOf(matchR: readonly number[]): Edge[] {
  return matchR.map((u, v) => [u, v] as Edge).filter(([u]) => u !== -1);
}

/** 간선 집합이 매칭인가 — 양쪽 모두 끝점이 겹치지 않는다. */
function edgesMatching(es: readonly Edge[]): boolean {
  const a = new Set<number>();
  const b = new Set<number>();
  for (const [u, v] of es) {
    if (a.has(u) || b.has(v)) return false;
    a.add(u);
    b.add(v);
  }
  return true;
}

/**
 * 탐색 하나가 뒤집은 경로 — 그 탐색이 적은 칸을 안쪽부터 적었으므로 거꾸로 읽으면 바깥부터다.
 * 돌려주는 것은 정점 이름의 줄(`L1 R0 L0 R1`)과 경로의 간선, 뒤집기 전 · 뒤집은 뒤의 짝 배열이다.
 */
export function flippedPath(
  c: Counted,
  u: number,
): { names: string[]; edges: Edge[]; before: number[]; after: number[] } {
  const at = c.steps.findIndex((s) => s.kind === "시작" && s.u === u);
  const end = c.steps.findIndex((s, i) => i > at && s.kind === "시작");
  const part = c.steps.slice(at, end < 0 ? c.steps.length : end);
  const writes = part
    .filter((s) => s.kind === "잇는다" || s.kind === "옮긴다")
    .reverse();
  const names: string[] = [];
  const edges: Edge[] = [];
  writes.forEach((s, i) => {
    names.push(`L${s.u}`, `R${s.v}`);
    edges.push([s.u, s.v as number]);
    const nextW = writes[i + 1];
    if (nextW !== undefined) edges.push([nextW.u, s.v as number]);
  });
  const before = (part[0] as Step).matchR;
  const after = (part.at(-1) as Step).matchR;
  return { names, edges, before, after };
}

/**
 * 탐색마다, 들어가기 전의 매칭에서 **교대 경로로 도달하는 빈 오른쪽 정점이 있는가**를 너비 우선
 * 탐색으로 따로 잰다. 정본의 깊이 우선 탐색이 낸 성공 · 실패와 맞대는 데 쓴다.
 */
export function searchAudit(
  left: number,
  right: number,
  edges: Edge[],
): { searches: number; fails: number; wrong: number } {
  const c = counted(left, right, edges);
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  let fails = 0;
  let wrong = 0;
  const starts = c.steps.filter((s) => s.kind === "시작");
  starts.forEach((s, i) => {
    const matchR = s.matchR;
    const seenR = new Set<number>();
    const queue = [s.u];
    let reach = false;
    while (queue.length > 0 && !reach) {
      const x = queue.shift() as number;
      for (const v of adj[x] as number[]) {
        if (seenR.has(v)) continue;
        seenR.add(v);
        const w = matchR[v] as number;
        if (w === -1) {
          reach = true;
          break;
        }
        queue.push(w);
      }
    }
    const ok = c.results[i] as boolean;
    if (!ok) fails++;
    if (ok !== reach) wrong++;
  });
  return { searches: starts.length, fails, wrong };
}

/** 한 바퀴를 끝낸 뒤 실패했던 왼쪽 정점마다 한 번 더 탐색해, 짝이 몇 개 느는지 센다. */
export function retryGain(
  left: number,
  right: number,
  edges: Edge[],
): { size: number; failed: number[]; gain: number } {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);
  const augment = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      if (seen[v] === true) continue;
      seen[v] = true;
      if ((matchR[v] as number) === -1 || augment(matchR[v] as number)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  };
  let size = 0;
  const failed: number[] = [];
  for (let u = 0; u < left; u++) {
    seen.fill(false);
    if (augment(u)) size++;
    else failed.push(u);
  }
  let gain = 0;
  for (const u of failed) {
    seen.fill(false);
    if (augment(u)) gain++;
  }
  return { size, failed, gain };
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
  [12, 12, deepChain(12)],
  [40, 40, scatter(40, 3, 20260907)],
  [64, 64, scatter(64, 6, 424242)],
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [l, r, edges] of 자기대조_입력) {
    const ref = maxBipartiteMatching(l, r, edges);
    const c = counted(l, r, edges);
    const f = fast(l, r, edges);
    if (c.size !== ref) throw new Error("세는 사본이 정본과 다른 답을 낸다");
    if (reachAndCover(l, r, edges).size !== ref) {
      throw new Error("도달 무리를 세는 사본이 정본과 다른 답을 낸다");
    }
    if (retryGain(l, r, edges).size !== ref) {
      throw new Error("다시 시도하는 사본이 정본과 다른 답을 낸다");
    }
    if (!isMatching(c.matchR)) {
      throw new Error("정본과 같은 절차가 낸 짝 배열이 매칭이 아니다");
    }
    if (f.size !== ref || f.reads !== c.reads || f.maxDepth !== c.maxDepth) {
      throw new Error("가벼운 사본이 세는 사본과 다른 수를 낸다");
    }
    if (perSearchReads(l, r, edges).reduce((a, b) => a + b, 0) !== c.reads) {
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

/** 방문 배열을 왼쪽 정점마다 새로 채우는 줄을 뺀 사본. */
const sharedSeen = await loadMutant<Impl>(REF, {
  drop: /seen\.fill\(false\);/,
});

/** 이미 본 오른쪽 정점을 넘기는 줄을 뺀 사본. */
const noSeenCheck = await loadMutant<Impl>(REF, {
  drop: /if \(seen\[v\] === true\) continue;/,
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

/** 호출 스택이 한계를 넘으면 답 대신 그 사실을 낸다. */
const OVERFLOW = "호출 스택이 한계를 넘어 멈춘다";
function runOrOverflow(impl: Impl, l: number, r: number, e: Edge[]): string {
  try {
    return String(impl.maxBipartiteMatching(l, r, e));
  } catch (err) {
    if (err instanceof RangeError) return OVERFLOW;
    throw err;
  }
}

const 갈리는_변이: {
  label: string;
  impl: Impl;
  cases: [number, number, Edge[]][];
}[] = [
  {
    label: "방문 배열을 나눠 쓰는 판",
    impl: sharedSeen,
    cases: [
      [WALK_L, WALK_R, WALK_EDGES],
      [FULL_L, FULL_R, FULL_EDGES],
    ],
  },
  {
    label: "이미 본 자리를 넘기지 않는 판",
    impl: noSeenCheck,
    cases: [[WALK_L, WALK_R, WALK_EDGES]],
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
          String(maxBipartiteMatching(l, r, e)) ===
          runOrOverflow(impl, l, r, e),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
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

export const L_LIMIT = 1000;
export const R_LIMIT = 1000;
export const E_LIMIT = L_LIMIT * R_LIMIT;

/** 기본 연산 — 간선 목록 읽기 + 이웃 자리 읽기 + 방문 배열 쓰기. 원고 전체가 이 기준 하나로 센다. */
export const opsOf = (left: number, right: number, edges: Edge[]): number =>
  edges.length + readsFast(left, right, edges) + left * right;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "짝 배열과 방문 배열을 만든다"],
  ["③", "증가 경로 탐색에 들어간다"],
  ["④", "이미 본 오른쪽 정점이라 넘어간다"],
  ["⑤", "빈자리를 만나 잇는다"],
  ["⑥", "짝이 있는 자리라 그 짝으로 내려간다"],
  ["⑦", "경로를 뒤집어 자리를 적는다"],
  ["⑧", "증가 경로가 없어 실패를 돌려준다"],
  ["⑨", "왼쪽 정점 하나마다 방문 배열을 새로 채운다"],
];

/** 전개 입력의 실행 — 본문 · 그림 · 패널이 모두 이 한 벌을 읽는다. */
export const WALK = counted(WALK_L, WALK_R, WALK_EDGES);

/** 걸음 번호로 걸음을 찾는다 — `T2` 가 `WALK.steps[0]` 이다(T1 은 준비). */
export const walkStep = (t: number): Step => WALK.steps[t - 2] as Step;

/** 전개 입력의 이웃 목록 표기 — `L0:[0, 1]  L1:[0]  L2:[0]`. */
export function adjText(): string {
  const adj: number[][] = Array.from({ length: WALK_L }, () => []);
  for (const [u, v] of WALK_EDGES) (adj[u] as number[]).push(v);
  return adj.map((a, u) => `L${u}:[${a.join(", ")}]`).join("  ");
}

/** 걸음 표의 행. 첫 걸음이 준비이고 마지막 걸음이 반환이다. */
function walkRows(): string[][] {
  const c = WALK;
  const rows: string[][] = [
    [
      "걸음",
      "갈래",
      "자리",
      "라벨",
      "matchR",
      "seen",
      "깊이",
      "size",
      "이 걸음이 한 일",
    ],
    [
      "T1",
      "준비",
      "-",
      "①②",
      dash(Array(WALK_R).fill(-1)),
      tf(Array(WALK_R).fill(false)),
      "0",
      "0",
      "이웃 목록과 두 배열을 만든다",
    ],
  ];
  c.steps.forEach((s, i) => {
    rows.push([
      `T${i + 2}`,
      s.kind,
      s.v === null ? `L${s.u}` : `L${s.u}−R${s.v}`,
      s.label,
      dash(s.matchR),
      tf(s.seen),
      String(s.depth),
      String(s.size),
      s.note,
    ]);
  });
  const last = c.steps.at(-1) as Step;
  rows.push([
    `T${c.steps.length + 2}`,
    "반환",
    "-",
    "-",
    dash(last.matchR),
    tf(last.seen),
    "0",
    String(c.size),
    `${c.size}${을를(String(c.size))} 돌려준다`,
  ]);
  return rows;
}

/** 가장 많이 읽는 그래프를 전수로 찾는다 — 그 읽기와 간선. */
export function worstGraph(n: number): { best: number; edges: Edge[] } {
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
  return { best, edges: bestEdges };
}

/** 가장 많이 읽는 4 × 4 그래프 — 그림 사이드카가 같은 값을 쓴다. */
export const WORST_4 = worstGraph(4);

/** 경로 셋 — 증가 경로와 헷갈리기 쉬운 두 경로. 모두 T3 직후의 매칭 위에 놓는다. */
export const CONTRAST_PATHS: [string, string[], Edge[]][] = [
  [
    "증가 경로",
    ["L1", "R0", "L0", "R1"],
    [
      [1, 0],
      [0, 0],
      [0, 1],
    ],
  ],
  [
    "끝에 짝이 있는 교대 경로",
    ["L1", "R0", "L0"],
    [
      [1, 0],
      [0, 0],
    ],
  ],
  [
    "번갈지 않는 경로",
    ["L1", "R0", "L2"],
    [
      [1, 0],
      [2, 0],
    ],
  ],
];

export const PROOFS: Record<string, () => string> = {
  /**
   * prereq — 이웃 편 `maxFlow` 와의 다리. 소스에서 왼쪽 정점마다, 오른쪽 정점마다 싱크로, 간선마다
   * 왼쪽에서 오른쪽으로 용량 1 을 둔 네트워크의 최대 유량을 `maxFlow` 의 정본으로 잰다.
   */
  flowBridge: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["재배정이 두 칸 필요한 3 × 3", RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      ["홀의 예시 4 × 4", HALL_L, HALL_R, HALL_EDGES],
      ["성긴 무작위 (n = 40)", 40, 40, scatter(40, 3, 20260907)],
    ];
    const rows: string[][] = [
      [
        "입력",
        "정점 수 (소스 · 싱크 포함)",
        "용량 1 간선 수",
        "최대 유량",
        "매칭 크기",
        "대조",
      ],
    ];
    let same = 0;
    for (const [name, l, r, e] of cases) {
      const s = l + r;
      const t = l + r + 1;
      const net: [number, number, number][] = [
        ...Array.from(
          { length: l },
          (_, u) => [s, u, 1] as [number, number, number],
        ),
        ...e.map(([u, v]) => [u, l + v, 1] as [number, number, number]),
        ...Array.from(
          { length: r },
          (_, v) => [l + v, t, 1] as [number, number, number],
        ),
      ];
      const f = maxFlow(l + r + 2, net, s, t).flow;
      const m = maxBipartiteMatching(l, r, e);
      if (f === m) same++;
      rows.push([
        name,
        String(l + r + 2),
        comma(net.length),
        String(f),
        String(m),
        f === m ? "일치" : "불일치",
      ]);
    }
    return withText(
      rows,
      [1, 2, 3, 4],
      `${cases.length} 입력 중 최대 유량과 매칭 크기가 일치한 것은 ${same} 개입니다. 최대 유량은 이웃 편 maxFlow 의 정본이 낸 값입니다.`,
    );
  },

  /** deep.origin ② — 정의를 그대로 옮긴 방법을 전개 입력에 실행한다. */
  bruteScan: () => {
    const b = bruteForce(WALK_L, WALK_R, WALK_EDGES);
    const rows: string[][] = [
      ["부분집합 번호", "고른 간선", "끝점 공유", "매칭 여부", "크기"],
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
        ok ? "없음" : "있음",
        ok ? "매칭" : "매칭 아님",
        ok ? String(n) : "-",
      ]);
    }
    return withText(
      rows,
      [0, 4],
      `간선을 둘 이상 고른 부분집합 ${rows.length - 1} 개를 적었습니다. 부분집합은 모두 ${b.subsets} 개(간선 ${E} 개라 2^${E})이고, 끝점을 ${b.checks} 번 검사했으며, 가장 큰 매칭의 크기는 ${b.size} 입니다.`,
    );
  },

  /** deep.origin ② — 그 방법이 규모에서 몇 번이 되는가. */
  bruteScale: () => {
    const rows: string[][] = [
      ["입력", "간선 E", "부분집합 2^E", "끝점 검사", "전수의 답", "정본의 답"],
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
    return withText(
      rows,
      [1, 2, 3, 4, 5],
      `실행한 네 줄에서 부분집합 수는 모두 2^E 입니다. 같은 식으로 세면 간선 20 개는 ${comma(2 ** 20)} 개, 30 개는 ${comma(2 ** 30)} 개이고, 규모의 상한인 간선 ${comma(E_LIMIT)} 개에서는 2^${comma(E_LIMIT)} 개입니다.`,
    );
  },

  /** deep.origin ③ — 가장 단순한 후보, 빈자리만 잡는 그리디를 전개 입력에 실행한다. */
  greedyWalk: () => {
    const g = greedy(WALK_L, WALK_R, WALK_EDGES);
    const adj: number[][] = Array.from({ length: WALK_L }, () => []);
    for (const [u, v] of WALK_EDGES) (adj[u] as number[]).push(v);
    const rows: string[][] = [
      ["왼쪽 정점", "이웃 목록", "읽은 오른쪽 정점", "받은 자리"],
    ];
    for (const r of g.rows) {
      rows.push([
        `L${r.u}`,
        `[${(adj[r.u] as number[]).map((v) => `R${v}`).join(", ")}]`,
        r.read.map((v) => `R${v}`).join(" · "),
        r.took === null ? "없음" : `R${r.took}`,
      ]);
    }
    return withText(
      rows,
      [],
      `빈자리만 잡으면 짝 ${g.size} 개로 끝나고, 짝 배열은 ${dash(g.matchR)} 입니다. 정본이 낸 답은 ${maxBipartiteMatching(WALK_L, WALK_R, WALK_EDGES)} 입니다.`,
    );
  },

  /** deep.origin ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  greedyVsAugment: () => {
    const rows: string[][] = [
      [
        "입력",
        "L",
        "R",
        "E",
        "그리디의 답",
        "그리디의 기본 연산",
        "증가 경로 뒤집기의 답",
        "증가 경로 뒤집기의 기본 연산",
        "두 답",
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
      const a = maxBipartiteMatching(l, r, e);
      if (g.size === a) same++;
      rows.push([
        name,
        String(l),
        String(r),
        String(e.length),
        String(g.size),
        comma(e.length + g.reads),
        String(a),
        comma(opsOf(l, r, e)),
        g.size === a ? "일치" : "불일치",
      ]);
    }
    return withText(
      rows,
      [1, 2, 3, 4, 5, 6, 7],
      `${cases.length} 입력 중 두 답이 일치한 것은 ${same} 개입니다. 그리디에는 방문 배열이 없어 기본 연산이 간선 목록 읽기와 이웃 자리 읽기의 합입니다.`,
    );
  },

  /** deep.build (c) — 증가 경로 하나를 정점 차례로 읽는다. */
  pathRead: () => {
    const p = flippedPath(WALK, 1);
    const inM = new Set(pairsOf(p.before).map(en));
    const rows: string[][] = [
      ["차례", "정점", "뒤집기 전 짝", "다음 간선", "그 간선의 매칭 여부"],
    ];
    const mateOf = (name: string): string => {
      const id = Number(name.slice(1));
      if (name.startsWith("R")) {
        const u = p.before[id] as number;
        return u === -1 ? "없음" : `L${u}`;
      }
      const v = p.before.indexOf(id);
      return v === -1 ? "없음" : `R${v}`;
    };
    p.names.forEach((name, i) => {
      const e = p.edges[i];
      rows.push([
        `x${i}`,
        name,
        mateOf(name),
        e === undefined ? "-" : en(e),
        e === undefined ? "-" : inM.has(en(e)) ? "매칭 안" : "매칭 밖",
      ]);
    });
    const first = p.names[0] as string;
    const last = p.names.at(-1) as string;
    return withText(
      rows,
      [],
      `경로는 ${p.names.join(" — ")} 이고 간선이 ${p.edges.length} 개입니다. 양 끝 ${first}${과와(first)} ${last}${은는(last)} 뒤집기 전에 짝이 없습니다.`,
    );
  },

  /** deep.build (d) — 경로 위 간선끼리의 관계. 뒤집기 전후를 간선마다. */
  pathFlip: () => {
    const p = flippedPath(WALK, 1);
    const inB = new Set(pairsOf(p.before).map(en));
    const inA = new Set(pairsOf(p.after).map(en));
    const rows: string[][] = [["간선", "뒤집기 전", "뒤집은 뒤"]];
    for (const e of p.edges) {
      rows.push([
        en(e),
        inB.has(en(e)) ? "매칭 안" : "매칭 밖",
        inA.has(en(e)) ? "매칭 안" : "매칭 밖",
      ]);
    }
    const outs = p.edges.filter((e) => !inB.has(en(e))).length;
    const ins = p.edges.length - outs;
    const a = pairCount(p.after);
    return withText(
      rows,
      [],
      `경로의 간선 ${p.edges.length} 개 중 뒤집기 전에 매칭 밖이 ${outs} 개, 매칭 안이 ${ins} 개입니다. 뒤집으면 매칭의 크기가 ${pairCount(p.before)} 에서 ${a}${으로(String(a))} 바뀌고, 짝 배열은 뒤집기 전 ${dash(p.before)} · 뒤집은 뒤 ${dash(p.after)} 입니다.`,
    );
  },

  /** deep.build (e) — 증가 경로와 헷갈리기 쉬운 두 경로를 같은 매칭에서 뒤집어 본다. */
  pathContrast: () => {
    const M = pairsOf(walkStep(3).matchR); // L0 이 R0 을 받은 직후
    const key = new Set(M.map(en));
    const rows: string[][] = [
      [
        "경로",
        "정점",
        "간선마다 매칭 안 · 밖",
        "뒤집은 뒤 간선",
        "뒤집은 뒤 크기",
        "뒤집은 뒤 매칭 여부",
      ],
    ];
    for (const [name, names, es] of CONTRAST_PATHS) {
      const flip = new Set(key);
      for (const e of es) {
        if (flip.has(en(e))) flip.delete(en(e));
        else flip.add(en(e));
      }
      const after = [...flip].map((k) => {
        const m = /L(\d+)R(\d+)/.exec(k) as RegExpExecArray;
        return [Number(m[1]), Number(m[2])] as Edge;
      });
      rows.push([
        name,
        names.join(" — "),
        es.map((e) => (key.has(en(e)) ? "안" : "밖")).join(" · "),
        set(after.map(en)),
        String(after.length),
        edgesMatching(after) ? "매칭" : "매칭 아님",
      ]);
    }
    return withText(
      rows,
      [4],
      `세 경로 모두 매칭 ${set(M.map(en))}(크기 ${M.length})에서 뒤집었습니다. 크기가 늘고 매칭으로 남은 것은 증가 경로 하나입니다.`,
    );
  },

  /** deep.build 1단계 — 두 배열이 매칭을 어떻게 적는가. */
  stageArrays: () => {
    const last = WALK.steps.at(-1) as Step;
    const rows: string[][] = [
      ["배열", "칸 수", "칸 하나의 뜻", "처음 값", "전개 입력의 마지막 값"],
      [
        "이웃 목록 adj",
        "L 줄 · 자리 E 개",
        "왼쪽 정점 하나가 이을 수 있는 오른쪽 정점",
        "간선 목록 그대로",
        adjText(),
      ],
      [
        "짝 배열 matchR",
        "R",
        "오른쪽 정점의 짝인 왼쪽 정점 번호",
        dash(Array(WALK_R).fill(-1)),
        dash(last.matchR),
      ],
      [
        "방문 배열 seen",
        "R",
        "지금 탐색이 그 오른쪽 정점을 봤는지",
        tf(Array(WALK_R).fill(false)),
        tf(last.seen),
      ],
    ];
    const pairs = pairsOf(last.matchR);
    return withText(
      rows,
      [],
      `마지막 짝 배열 ${dash(last.matchR)} 이 나타내는 매칭은 ${set(pairs.map(en))} 이고 크기는 ${pairs.length} 입니다.`,
    );
  },

  /** deep.build 2단계 — 탐색 셋이 무엇을 보고 어디에 도달했는가. */
  stageSearch: () => {
    const rows: string[][] = [
      [
        "탐색",
        "들어간 왼쪽 정점",
        "처음 본 오른쪽 정점",
        "도달한 빈 오른쪽 정점",
        "결과",
        "이웃 자리 읽기",
      ],
    ];
    const starts = WALK.steps
      .map((s, i) => [s, i] as const)
      .filter(([s]) => s.kind === "시작");
    starts.forEach(([s, i], j) => {
      const end = starts[j + 1]?.[1] ?? WALK.steps.length;
      const part = WALK.steps.slice(i, end);
      const entered = [
        s.u,
        ...part
          .filter((x) => x.kind === "내려간다")
          .map((x) => x.owner as number),
      ];
      const looked = part
        .filter((x) => x.kind === "내려간다" || x.kind === "잇는다")
        .map((x) => x.v as number);
      const free = part.find((x) => x.kind === "잇는다");
      const before = i === 0 ? 0 : (WALK.steps[i - 1] as Step).reads;
      rows.push([
        `L${s.u} 의 탐색`,
        entered.map((u) => `L${u}`).join(" → "),
        looked.map((v) => `R${v}`).join(" · "),
        free === undefined ? "없음" : `R${free.v}`,
        WALK.results[j] ? "성공" : "실패",
        String((part.at(-1) as Step).reads - before),
      ]);
    });
    const inputs: [number, number, Edge[]][] = [
      [WALK_L, WALK_R, WALK_EDGES],
      [FULL_L, FULL_R, FULL_EDGES],
      [RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      [HALL_L, HALL_R, HALL_EDGES],
      [NARROW_L, NARROW_R, NARROW_EDGES],
      ...smallRandom(300, 20260930),
    ];
    let searches = 0;
    let fails = 0;
    let wrong = 0;
    for (const [l, r, e] of inputs) {
      const a = searchAudit(l, r, e);
      searches += a.searches;
      fails += a.fails;
      wrong += a.wrong;
    }
    return withText(
      rows,
      [5],
      `입력 ${inputs.length} 벌에서 탐색 ${comma(searches)} 번을 실행했고 그중 ${comma(fails)} 번이 실패했습니다. 탐색마다 교대 경로로 도달하는 빈 오른쪽 정점이 있는지를 너비 우선 탐색으로 따로 재어 탐색의 성공 · 실패와 맞대 보았고, 어긋난 탐색은 ${wrong} 번입니다.`,
    );
  },

  /** deep.build 3단계 — 돌아오며 적는 두 칸. 안쪽부터 적는다. */
  stageFlip: () => {
    const rows: string[][] = [
      [
        "걸음",
        "적은 칸",
        "적기 전 짝 배열",
        "적은 뒤 짝 배열",
        "적은 뒤 매칭 여부",
        "깊이",
      ],
    ];
    let prev = walkStep(6).matchR;
    for (const t of [7, 8]) {
      const s = walkStep(t);
      rows.push([
        `T${t}`,
        `matchR[${s.v}] = ${s.u}`,
        dash(prev),
        dash(s.matchR),
        isMatching(s.matchR) ? "매칭" : "매칭 아님",
        String(s.depth),
      ]);
      prev = s.matchR;
    }
    const a = pairCount(walkStep(6).matchR);
    const b = pairCount(walkStep(8).matchR);
    return withText(
      rows,
      [5],
      `L1 의 탐색 하나가 칸 둘을 적었고, 그 탐색 전후의 매칭 크기는 ${a} 에서 ${b}${으로(String(b))} 바뀝니다.`,
    );
  },

  /** deep.build 4단계 — 실패한 왼쪽 정점을 끝에 다시 시도하면 짝이 느는가. */
  stageRetry: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["오른쪽이 하나뿐", ONER_L, ONER_R, ONER_EDGES],
      ["왼쪽 셋이 오른쪽 하나만", NARROW_L, NARROW_R, NARROW_EDGES],
      ["왼쪽 5 · 오른쪽 2 완전", WIDE_L, WIDE_R, WIDE_EDGES],
      ["성긴 무작위 (n = 40)", 40, 40, scatter(40, 3, 20260907)],
      ["성긴 무작위 (n = 64, 한 정점당 2)", 64, 64, scatter(64, 2, 424242)],
    ];
    const rows: string[][] = [
      [
        "입력",
        "한 바퀴의 답",
        "실패한 왼쪽 정점 수",
        "다시 시도해 늘어난 짝",
        "정본의 답",
      ],
    ];
    for (const [name, l, r, e] of cases) {
      const g = retryGain(l, r, e);
      rows.push([
        name,
        String(g.size),
        String(g.failed.length),
        String(g.gain),
        String(maxBipartiteMatching(l, r, e)),
      ]);
    }
    const many = smallRandom(500, 424242);
    let failed = 0;
    let gain = 0;
    for (const [l, r, e] of many) {
      const g = retryGain(l, r, e);
      failed += g.failed.length;
      gain += g.gain;
    }
    return withText(
      rows,
      [1, 2, 3, 4],
      `작은 무작위 그래프 ${many.length} 벌에서도 실패한 왼쪽 정점 ${comma(failed)} 개를 끝에 다시 시도했고, 그래서 늘어난 짝은 ${gain} 개입니다.`,
    );
  },

  /** deep.build 설계 선택 — 재귀가 얼마나 깊어지는가. */
  designRecursion: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["사슬 (n = 1,000)", 1000, 1000, line(1000)],
      ["완전 이분 (n = 300)", 300, 300, complete(300)],
      [
        "성긴 무작위 (n = 1,000, 한 정점당 4)",
        1000,
        1000,
        scatter(1000, 4, 20260930),
      ],
      [
        "재배정이 끝까지 이어지는 사슬 (n = 1,000)",
        1000,
        1000,
        deepChain(1000),
      ],
    ];
    const rows: string[][] = [
      ["입력", "왼쪽 정점 L", "간선 E", "가장 깊은 재귀", "답"],
    ];
    let under = 0;
    for (const [name, l, r, e] of cases) {
      const f = fast(l, r, e);
      if (f.maxDepth <= l) under++;
      rows.push([
        name,
        comma(l),
        comma(e.length),
        comma(f.maxDepth),
        comma(maxBipartiteMatching(l, r, e)),
      ]);
    }
    return withText(
      rows,
      [1, 2, 3, 4],
      `${cases.length} 입력 모두 실행이 끝났고, 가장 깊은 재귀가 왼쪽 정점 수 이하인 입력은 ${under} 개입니다.`,
    );
  },

  /** 짚고 가기 — 같은 간선이 두 번 들어와도 답이 그대로다. */
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
    for (const [name, l, r, one, two] of cases) {
      const a = maxBipartiteMatching(l, r, one);
      const b = maxBipartiteMatching(l, r, two);
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        comma(readsFast(l, r, one)),
        comma(readsFast(l, r, two)),
      ]);
    }
    return md(rows, [1, 2, 4, 5]).join("\n");
  },

  /** 짚고 가기 — 이미 본 오른쪽 정점을 넘기지 않으면 탐색이 끝나지 않는다. */
  pauseNoSeen: () => {
    const cases: [string, number, number, Edge[]][] = [
      ["전개 입력", WALK_L, WALK_R, WALK_EDGES],
      ["완전 매칭이 있는 3 × 3", FULL_L, FULL_R, FULL_EDGES],
      ["사슬 (n = 4)", 4, 4, line(4)],
      ["간선이 없다", NONE_L, NONE_R, NONE_EDGES],
    ];
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "이미 본 자리를 넘기지 않는 판",
        "판정",
        "정본이 내려간 횟수",
      ],
    ];
    for (const [name, l, r, e] of cases) {
      const a = String(maxBipartiteMatching(l, r, e));
      const b = runOrOverflow(noSeenCheck, l, r, e);
      rows.push([
        name,
        a,
        b,
        a === b ? "같다" : "다르다",
        String(
          counted(l, r, e).steps.filter((x) => x.kind === "내려간다").length,
        ),
      ]);
    }
    return md(rows, [1, 4]).join("\n");
  },

  /** 짚고 가기 — 방문 배열을 나눠 쓰면 재배정 갈래가 한 번도 실행되지 않는다. */
  pauseSeenReset: () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "방문 배열을 나눠 쓰는 판",
        "판정",
        "그리디의 답",
        "바꾼 판과 그리디",
        "정본이 내려간 횟수",
      ],
    ];
    for (const [name, l, r, e] of 변이_입력) {
      const a = maxBipartiteMatching(l, r, e);
      const b = sharedSeen.maxBipartiteMatching(l, r, e);
      const g = greedy(l, r, e).size;
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        String(g),
        b === g ? "일치" : "불일치",
        String(
          counted(l, r, e).steps.filter((x) => x.kind === "내려간다").length,
        ),
      ]);
    }
    return md(rows, [1, 2, 4, 6]).join("\n");
  },

  /** 짚고 가기 — 자리를 적을 때마다 세면 답이 커진다. */
  pauseCountInside: () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "자리를 적을 때마다 세는 판",
        "판정",
        "정본이 자리를 적은 횟수",
        "그중 옮긴 횟수",
      ],
    ];
    for (const [name, l, r, e] of 변이_입력) {
      const a = maxBipartiteMatching(l, r, e);
      const b = countInside.maxBipartiteMatching(l, r, e);
      const c = counted(l, r, e);
      rows.push([
        name,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        String(c.frees + c.moves),
        String(c.moves),
      ]);
    }
    return md(rows, [1, 2, 4, 5]).join("\n");
  },

  /** 짚고 가기 — 왼쪽 정점을 보는 순서를 바꿔도 크기는 안 바뀐다. */
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
        "짝 배열 대조",
      ],
    ];
    let sameSize = 0;
    let sameTable = 0;
    for (const [name, l, r, e] of cases) {
      const a = counted(l, r, e);
      // 왼쪽 번호를 뒤집어 같은 그래프를 다른 순서로 준다.
      const flipped = e.map(([u, v]) => [l - 1 - u, v] as Edge);
      const b = counted(l, r, flipped);
      const bBack = dash(b.matchR.map((u) => (u === -1 ? -1 : l - 1 - u)));
      if (a.size === b.size) sameSize++;
      if (dash(a.matchR) === bBack) sameTable++;
      rows.push([
        name,
        String(a.size),
        String(b.size),
        a.size === b.size ? "같다" : "다르다",
        dash(a.matchR) === bBack ? "일치" : "불일치",
      ]);
    }
    const walkBack = counted(
      WALK_L,
      WALK_R,
      WALK_EDGES.map(([u, v]) => [WALK_L - 1 - u, v] as Edge),
    ).matchR.map((u) => (u === -1 ? -1 : WALK_L - 1 - u));
    return withText(
      rows,
      [1, 2],
      `크기가 일치한 입력은 ${sameSize} / ${cases.length}, 짝 배열까지 일치한 입력은 ${sameTable} / ${cases.length} 입니다. 전개 입력에서 그대로 본 매칭은 ${set(pairsOf(WALK.matchR).map(en))}, 거꾸로 본 매칭은 원래 번호로 ${set(pairsOf(walkBack).map(en))} 입니다.`,
    );
  },

  /** deep.walk 1 — 준비 조각만 실행한 결과. */
  walkT1: () =>
    [
      "T1 이 끝난 시점",
      ...kv([
        ["adj", adjText()],
        ["matchR", dash(Array(WALK_R).fill(-1))],
        ["seen", tf(Array(WALK_R).fill(false))],
      ]),
    ].join("\n"),

  /** deep.walk 2 — L0 의 탐색 두 걸음. */
  walkT2T3: () => {
    const a = walkStep(2);
    const b = walkStep(3);
    return [
      `T2 — L${a.u} 에서 탐색을 시작한다`,
      ...kv([
        ["seen", tf(a.seen)],
        ["matchR", dash(a.matchR)],
      ]),
      `T3 — L${b.u}${이가(`L${b.u}`)} R${b.v}${을를(`R${b.v}`)} 본다`,
      ...kv([
        ["판정", `seen[${b.v}] 이 거짓이라 넘어가지 않고 참으로 적는다`],
        ["seen", tf(b.seen)],
        ["matchR", `${dash(b.matchR)} — matchR[${b.v}] 이 -1 이었다`],
      ]),
    ].join("\n");
  },

  /** deep.walk 3 — 재귀 안쪽과 바깥쪽에서 한 칸씩 적는다. */
  walkT5T8: () => {
    const s5 = walkStep(5);
    const s6 = walkStep(6);
    const s7 = walkStep(7);
    const s8 = walkStep(8);
    const sees = (s: Step): string =>
      `L${s.u}${이가(`L${s.u}`)} R${s.v}${을를(`R${s.v}`)} 본다 (깊이 ${s.depth})`;
    return [
      `T5 — ${sees(s5)}`,
      ...kv([
        [
          "판정",
          `matchR[${s5.v}] = ${s5.owner} 이라 앞의 조건이 거짓 → augment(${s5.owner}) 을 부른다`,
        ],
        ["seen", tf(s5.seen)],
      ]),
      `T6 — ${sees(s6)}`,
      ...kv([["판정", `seen[${s6.v}] 이 참이라 넘어간다`]]),
      `T7 — ${sees(s7)}`,
      ...kv([
        [
          "판정",
          `matchR[${s7.v}] = -1 이라 앞의 조건이 참 → 뒤의 조건은 실행되지 않는다`,
        ],
        [
          "matchR",
          `${dash(s7.matchR)} — 이 순간 R0 과 R1 이 둘 다 L0 을 가리킨다`,
        ],
      ]),
      `T8 — 되돌아온 자리에서 L${s8.u}${이가(`L${s8.u}`)} R${s8.v}${을를(`R${s8.v}`)} 받는다 (깊이 ${s8.depth})`,
      ...kv([
        ["판정", `augment(${s8.owner}) 이 참을 돌려줬다`],
        ["matchR", dash(s8.matchR)],
      ]),
    ].join("\n");
  },

  /** deep.walk 4 — L2 의 탐색이 실패로 끝나고 반환한다. */
  walkT9T13: () => {
    const rows: string[][] = [
      ["걸음", "갈래", "깊이", "seen", "호출 스택", "이 걸음이 한 일"],
    ];
    for (const t of [9, 10, 11, 12, 13]) {
      const s = walkStep(t);
      rows.push([
        `T${t}`,
        s.kind,
        String(s.depth),
        tf(s.seen),
        s.call.length === 0 ? "비었다" : s.call.map((u) => `L${u}`).join(" → "),
        s.note,
      ]);
    }
    return withText(
      rows,
      [2],
      `T14 에서 바깥 반복이 끝나고 size = ${WALK.size}${을를(String(WALK.size))} 돌려줍니다.`,
    );
  },

  /** deep.walk 5 — 열네 걸음을 값까지 펼쳐 적는다. */
  walkTrace: () =>
    withText(
      walkRows(),
      [6, 7],
      `탐색 ${WALK.starts} 번 중 성공이 ${WALK.results.filter((x) => x).length} 번, 실패가 ${WALK.results.filter((x) => !x).length} 번이고, 이웃 자리를 ${WALK.reads} 번 읽었습니다.`,
    ),

  /** deep.walk 5 — 아홉 갈래가 전부 실행됐는가. */
  branchCoverage: () => {
    const a = WALK;
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
      ["라벨", "하는 일", "전개 입력", "오른쪽이 하나뿐인 4 × 1"],
    ];
    LABELS.forEach(([mark, what], i) => {
      rows.push([mark, what, String(x[i] ?? 0), String(y[i] ?? 0)]);
    });
    const zero = x.filter((n) => n === 0).length;
    return withText(
      rows,
      [2, 3],
      `전개 입력 열에서 0 인 칸은 ${zero} 개입니다.`,
    );
  },

  /** deep.walk.final — 완성 코드를 여러 입력에 실행한다. */
  walkCalls: () => {
    const calls: [number, number, Edge[]][] = [
      [WALK_L, WALK_R, WALK_EDGES],
      [RECHAIN_L, RECHAIN_R, RECHAIN_EDGES],
      [ONER_L, ONER_R, ONER_EDGES],
      [NONE_L, NONE_R, NONE_EDGES],
      [0, 0, []],
    ];
    const heads = calls.map(
      ([l, r, e]) =>
        `maxBipartiteMatching(${l}, ${r}, [${e.map(([u, v]) => `[${u},${v}]`).join(",")}])`,
    );
    const w = Math.max(...heads.map((h) => h.length));
    return calls
      .map(
        ([l, r, e], i) =>
          `${(heads[i] as string).padEnd(w)}  -> ${maxBipartiteMatching(l, r, e)}`,
      )
      .join("\n");
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
        "도달한 왼쪽",
        "도달한 오른쪽",
        "덮개",
        "덮개 크기",
        "전수로 구한 최소 덮개",
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
        set(c.zl.map((u) => `L${u}`)),
        set(c.zr.map((v) => `R${v}`)),
        set(c.coverL.map((u) => `L${u}`).concat(c.coverR.map((v) => `R${v}`))),
        String(c.coverL.length + c.coverR.length),
        String(brute),
        String(c.uncovered),
      ]);
    }
    return withText(
      rows,
      [1, 5, 6, 7],
      `매칭 크기 · 덮개 크기 · 전수로 구한 최소 덮개의 세 수가 모두 일치한 줄은 ${same} / ${cases.length} 입니다.`,
    );
  },

  /** deep.math — 대칭차를 전개 입력에 넣어 검산한다. */
  mathSymDiff: () => {
    const M = pairsOf(walkStep(3).matchR);
    const N = pairsOf(walkStep(8).matchR);
    const inM = new Set(M.map(en));
    const inN = new Set(N.map(en));
    const rows: string[][] = [["간선", "M 에", "N 에", "M ⊕ N 에"]];
    const all: Edge[] = [];
    for (const e of [...M, ...N]) {
      if (!all.some((x) => en(x) === en(e))) all.push(e);
    }
    for (const e of all) {
      const a = inM.has(en(e));
      const b = inN.has(en(e));
      rows.push([
        en(e),
        a ? "있음" : "없음",
        b ? "있음" : "없음",
        a !== b ? "있음" : "없음",
      ]);
    }
    const sym = all.filter((e) => inM.has(en(e)) !== inN.has(en(e)));
    return withText(
      rows,
      [],
      `M = ${set(M.map(en))} 은 크기 ${M.length}, N = ${set(N.map(en))} 은 크기 ${N.length} 이고, M ⊕ N 은 간선 ${sym.length} 개입니다. N 쪽 간선이 M 쪽보다 ${N.length - M.length} 개 많습니다.`,
    );
  },

  /** deep.math — 계단에서 탐색별 읽기와 닫힌 형태. */
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
    const n = L_LIMIT;
    return [
      ...md(rows, [0, 1, 3, 4, 5]),
      "",
      "규모를 키운 세 줄입니다.",
      "",
      ...md(big, [0, 1, 2, 3]),
      "",
      `세 줄 중 세 값이 모두 일치한 줄은 ${match} 개입니다. 식에 n = ${comma(n)} 을 넣으면 ${comma((n * (n + 1) * (n + 2)) / 6)} 번이고, 같은 규모의 L·E 상한은 ${comma(L_LIMIT * E_LIMIT)} 번입니다.`,
    ].join("\n");
  },

  /** invariant ② — 검사 시점마다 두 문장이 참인가. */
  invariantWatch: () => {
    const rows: string[][] = [
      [
        "걸음",
        "갈래",
        "matchR",
        "깊이",
        "검사 시점",
        "매칭 여부",
        "짝의 수",
        "size",
        "두 문장",
      ],
    ];
    let checks = 0;
    let held = 0;
    WALK.steps.forEach((s, i) => {
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
        m ? "매칭" : "매칭 아님",
        String(n),
        String(s.size),
        at ? (m && n === s.size ? "지킨다" : "깨진다") : "-",
      ]);
    });
    const broken = WALK.steps.filter(
      (s) => s.depth > 0 && !isMatching(s.matchR),
    ).length;
    return withText(
      rows,
      [3, 6, 7],
      `검사 시점인 걸음은 ${checks} 개이고 그중 두 문장이 다 참인 것은 ${held} 개입니다. 탐색 도중에 matchR 이 매칭이 아닌 걸음은 ${broken} 개입니다.`,
    );
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
      ["왼쪽 5 · 오른쪽 2 완전", WIDE_L, WIDE_R, WIDE_EDGES],
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
        "매칭 여부",
        "짝의 수와 답",
        "이웃 자리 읽기",
        "방문 배열 쓰기",
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
        isMatching(c.matchR) ? "매칭" : "매칭 아님",
        pairCount(c.matchR) === ref ? "일치" : "불일치",
        String(c.reads),
        String(c.fills),
      ]);
    }
    return withText(
      rows,
      [1, 2, 3, 4, 8, 9],
      `두 문장이 다 참인 줄은 ${ok} / ${cases.length} 입니다.`,
    );
  },

  /** invariant ③ — 불변식을 지키던 줄을 바꾸면 답이 어떻게 되는가. */
  mutantSteal: () => {
    const rows: string[][] = [
      ["입력", "정본", "자리를 그냥 가져가는 판", "판정"],
    ];
    for (const [name, l, r, e] of 변이_입력) {
      const a = maxBipartiteMatching(l, r, e);
      const b = takeAnyway.maxBipartiteMatching(l, r, e);
      rows.push([name, String(a), String(b), a === b ? "같다" : "다르다"]);
    }
    return md(rows, [1, 2]).join("\n");
  },

  /** perf.derive — 걸음마다 읽은 자리와 누적. */
  perfCount: () => {
    const rows: string[][] = [
      ["걸음", "갈래", "자리", "이 걸음이 읽은 이웃 자리", "누적"],
    ];
    let prev = 0;
    WALK.steps.forEach((s, i) => {
      rows.push([
        `T${i + 2}`,
        s.kind,
        s.v === null ? `L${s.u}` : `L${s.u}−R${s.v}`,
        String(s.reads - prev),
        String(s.reads),
      ]);
      prev = s.reads;
    });
    return withText(
      rows,
      [3, 4],
      `이웃 자리 읽기는 ${WALK.reads} 번이고 이웃 목록의 자리 총수는 ${WALK.slots} 개입니다. 방문 배열 쓰기는 ${WALK.fills} 번으로 L·R = ${WALK_L * WALK_R}${과와(String(WALK_L * WALK_R))} 일치하고, 간선 목록 읽기는 E = ${WALK_EDGES.length} 번입니다. 셋을 더한 기본 연산은 ${WALK_EDGES.length + WALK.reads + WALK.fills} 번입니다.`,
    );
  },

  /** perf.bounds — 모양을 바꿔 가며 계수를 잰다. */
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
        "방문 배열 쓰기",
        "L·R",
        "답",
        "가장 깊은 재귀",
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
    return withText(
      rows,
      [1, 2, 3, 4, 5, 6],
      `방문 배열 쓰기가 L·R 과 일치한 줄은 ${fixed} / ${cases.length} 입니다.`,
    );
  },

  /** perf.worst — 정점 수를 못 박고 간선 부분집합을 전부 만들어 가장 많이 읽는 입력을 찾는다. */
  worstExhaustive: () => {
    const rows: string[][] = [
      [
        "L = R",
        "그래프 수 2^(n²)",
        "읽기의 최댓값",
        "최댓값을 내는 그래프 (줄이 왼쪽 정점)",
        "블록 가족의 k",
        "완전 이분의 읽기",
      ],
    ];
    let inFamily = 0;
    let completeIsMax = 0;
    for (const n of [2, 3, 4]) {
      const w = n === 4 ? WORST_4 : worstGraph(n);
      let hitK = -1;
      for (let k = 0; k <= n; k++) {
        if (readsFast(n, n, block(n, k)) === w.best) {
          hitK = k;
          break;
        }
      }
      if (hitK >= 0) inFamily++;
      const full = readsFast(n, n, complete(n));
      if (full === w.best) completeIsMax++;
      const grid = Array.from({ length: n }, (_, u) =>
        Array.from({ length: n }, (_, v) =>
          w.edges.some(([a, b]) => a === u && b === v) ? "1" : "0",
        ).join(""),
      ).join(" ");
      rows.push([
        String(n),
        comma(1 << (n * n)),
        String(w.best),
        grid,
        hitK < 0 ? "없음" : String(hitK),
        String(full),
      ]);
    }
    return withText(
      rows,
      [0, 1, 2, 4, 5],
      `세 줄 중 최댓값을 내는 그래프가 블록 가족 안에 있는 줄은 ${inFamily} 개이고, 완전 이분이 최댓값인 줄은 ${completeIsMax} 개입니다.`,
    );
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
      const f = fast(n, n, e);
      rows.push([String(k), comma(e.length), comma(f.reads), String(f.size)]);
    }
    const formula = (n * (n + 1) * (n + 2)) / 6;
    return withText(
      rows,
      [0, 1, 2, 3],
      `읽기가 가장 큰 k 는 ${bestK} 이고 그때 ${comma(best)} 번입니다. k = 0 인 완전 이분은 ${comma(readsFast(n, n, block(n, 0)))} 번으로 n(n+1)(n+2)/6 = ${comma(formula)}${과와(comma(formula))} 일치하고, 가장 큰 값은 그 식의 ${(best / formula).toFixed(3)} 배입니다.`,
    );
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
    let lastRatio = 0;
    for (const n of [32, 64, 128, 256]) {
      const k = Math.floor((2 * n) / 3);
      const e = block(n, k);
      const r = readsFast(n, n, e);
      lastRatio = r / n ** 3;
      rows.push([
        String(n),
        String(k),
        comma(e.length),
        comma(r),
        prev === 0 ? "-" : (r / prev).toFixed(2),
        lastRatio.toFixed(4),
        comma(n * e.length),
      ]);
      prev = r;
    }
    const n = L_LIMIT;
    const guess = Math.round(Number(lastRatio.toFixed(4)) * n ** 3);
    return withText(
      rows,
      [0, 1, 2, 3, 4, 5, 6],
      `n³ 에 대한 비를 마지막 줄의 ${lastRatio.toFixed(4)}${으로(lastRatio.toFixed(4))} 두고 n = ${comma(n)} 을 넣으면 이웃 자리 읽기가 ${comma(guess)} 번 언저리입니다. 이 값은 실행한 값이 아니라 식으로 늘린 어림입니다.`,
    );
  },

  /** selfcheck — T5 와 T10 은 같은 갈래를 실행하는데 결과가 갈린다. */
  selfcheckSplit: () => {
    const rows: string[][] = [
      [
        "걸음",
        "왼쪽 정점",
        "읽은 오른쪽 정점",
        "그 짝",
        "그 짝의 이웃 목록",
        "그 짝이 아직 안 본 이웃",
        "탐색의 결과",
      ],
    ];
    const adj: number[][] = Array.from({ length: WALK_L }, () => []);
    for (const [u, v] of WALK_EDGES) (adj[u] as number[]).push(v);
    for (const t of [5, 10]) {
      const s = walkStep(t);
      const owner = s.owner as number;
      const nb = adj[owner] as number[];
      const unseen = nb.filter((v) => !(s.seen[v] as boolean));
      const j =
        WALK.steps.filter((x, i) => x.kind === "시작" && i <= t - 2).length - 1;
      rows.push([
        `T${t}`,
        `L${s.u}`,
        `R${s.v}`,
        `L${owner}`,
        `[${nb.map((v) => `R${v}`).join(", ")}]`,
        unseen.length === 0 ? "없음" : unseen.map((v) => `R${v}`).join(" · "),
        WALK.results[j] ? "성공" : "실패",
      ]);
    }
    return md(rows).join("\n");
  },
  /**
   * purpose.alt — 계단 모양에서 두 설계의 기본 연산 비. `.alt.ts` 의 두 설계를 같은 입력에 걸어
   * 비를 계산한다(SPEC §14 `L51`).
   */
  stairRatio: () => {
    const e = stair(ALT_N);
    const a = 증가경로설계(ALT_N, ALT_N, e).ops;
    const b = 홉크로프트카프설계(ALT_N, ALT_N, e).ops;
    return `계단 모양에서는 증가 경로 뒤집기가 훨씬 많이 셉니다 — ${comma(a)} 대 ${comma(b)}${으로(comma(b))} ${Math.round(a / b)} 배예요.`;
  },
};
