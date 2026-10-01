/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/isBipartite/isBipartite-guide.md
 *
 * **기록하는 사본 하나와 다른 판 여럿이 있다.** 정본은 쪽 배열도 걸음도 내보내지 않는다. 그래서
 * 정본과 같은 순서로 같은 일을 하면서 걸음마다 상태를 적는 사본(`traced`)을 두고, 그 사본은 부를
 * 때마다 자기 답을 정본과 맞댄다. 칸 접근 수를 세는 사본(`countCells`)과, 본문이 반박하려고 세우는
 * 판(`enumerateSplits` · `visitedOnly` · `markWidth` · `skipParent` · `orderSwapped` · `queueOrder` ·
 * `oneList` · `writeAtPop`)도 여기 있다. **답이 옳은지는 사본이 아니라 정본이 진다** — 표의 「정본」
 * 열은 전부 정본이 낸 값이다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면
 * 둘이 갈라진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as ALT_CASES, bipartite } from "./isBipartite-guide.alt.ts";
import { isBipartite } from "./isBipartite-guide.ref.ts";

export type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0·1·2·3 은 길이 4 짜리 고리이고 4·5·6 은 삼각형이라,
 * 세 갈래와 바깥 반복의 다시 시작하기가 한 입력에서 모두 실행된다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 4],
];

/** `0-1-…-(v-1)` 한 줄. 간선 `v-1` 개이고 이분 그래프다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 한 줄의 양 끝을 이어 붙인 고리. 길이가 홀수면 이분 그래프가 아니다. */
export function ring(v: number): Edge[] {
  return [...chain(v), [v - 1, 0]];
}

/** 왼쪽 `a` 개와 오른쪽 `b` 개를 모두 이은 완전 이분 그래프. 간선 `a×b` 개다. */
function complete(a: number, b: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) out.push([i, a + j]);
  return out;
}

/** 정점 `v` 개를 크기 `size` 짜리 한 줄 여럿으로 가른 숲. */
function forest(v: number, size: number): Edge[] {
  const out: Edge[] = [];
  for (let base = 0; base < v; base += size) {
    for (let i = base; i + 1 < Math.min(base + size, v); i++)
      out.push([i, i + 1]);
  }
  return out;
}

const adjacency = (n: number, edges: Edge[]): number[][] => {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  return nbr;
};

/* ────────────────────────── 적는 모양 ────────────────────────── */

/** `2,800,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** `true` · `false` — 둘 다 「를」·「는」을 받는다(트루 · 폴스). */
const yn = (b: boolean): string => (b ? "true" : "false");

/** 쪽 배열 표기 — 아직 안 정한 칸은 `·`. 본문 전체가 이 한 표기를 쓴다. */
export const showSide = (side: readonly number[]): string =>
  side.map((s, v) => `${v}:${s === -1 ? "·" : s}`).join(" ");

export const showList = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** 마크다운 표. 첫 행이 머리줄이고 `right` 에 든 열은 오른쪽 정렬이다. */
function md(rows: string[][], right: number[] = []): string {
  const [head, ...body] = rows;
  const cols = (head as string[]).length;
  const sep = Array.from({ length: cols }, (_, c) =>
    right.includes(c) ? "---:" : "---",
  );
  return [head as string[], sep, ...body]
    .map((r) => `| ${r.join(" | ")} |`)
    .join("\n");
}

/** 표 + 그 아래 문장 — 닫는 마커까지가 블록이다. */
const withNote = (table: string, note: string): string => `${table}\n\n${note}`;

/** 한국어 수 읽기 — 본문 문장 속 개수(「여덟 줄」). 열 넘는 수는 숫자로 쓴다. */
const KO = [
  "0",
  "한",
  "두",
  "세",
  "네",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];
const ko = (n: number): string => KO[n] ?? comma(n);

/* ─────────────────── 기록하는 사본 — 정본과 같은 순서 ─────────────────── */

/** 걸음 하나. 원고의 `T#` 와 같은 단위 — 시작 정점에 쪽을 적는 일 하나, 이웃 항목 확인 하나. */
export interface Step {
  readonly id: string;
  readonly kind: "start" | "check";
  /** 시작 걸음이면 시작 정점, 확인 걸음이면 꺼낸 정점. */
  readonly u: number;
  /** 확인 걸음에서 본 이웃. 시작 걸음이면 `null`. */
  readonly v: number | null;
  /** 꺼낸 정점의 쪽. 시작 걸음이면 적은 쪽. */
  readonly su: number;
  /** ① 쪽이 같다 · ② 이미 반대쪽 · ③ 쪽이 없다. 시작 걸음이면 `null`. */
  readonly branch: 1 | 2 | 3 | null;
  /** 이 걸음이 확인하기 직전의 `side[v]`(시작 걸음이면 `side[u]`). */
  readonly before: number;
  /** 이 걸음이 이 정점의 첫 이웃 확인인가 — 곧 이 걸음 바로 앞에서 스택에서 꺼냈는가. */
  readonly popped: boolean;
  /** 걸음이 끝난 뒤의 쪽 배열과 스택. */
  readonly side: readonly number[];
  readonly stack: readonly number[];
  /** 걸음이 끝난 뒤 쪽이 적힌 정점의, 그 성분 시작 정점에서의 나무 경로 걸음 수. */
  readonly depth: readonly number[];
}

export interface Trace {
  readonly steps: Step[];
  /** 바깥 반복이 본 시작 후보 — 쪽이 있어 넘어간 것과 시작한 것 모두. */
  readonly outer: { s: number; had: number; started: boolean }[];
  /** 꺼낸 차례대로의 정점. */
  readonly pops: number[];
  /** 스택에 넣은 횟수. */
  readonly pushes: number;
  readonly answer: boolean;
  /** 멈춘 시점(또는 끝)의 쪽 배열. */
  readonly side: readonly number[];
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 부를 때마다 자기 답을 정본(`isBipartite`)과 맞댄다 —
 * 갈리면 이 파일의 표는 정본의 표가 아니므로 던진다.
 */
export function traced(n: number, edges: Edge[]): Trace {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  const steps: Step[] = [];
  const outer: Trace["outer"] = [];
  const pops: number[] = [];
  let pushes = 0;
  const record = (s: Omit<Step, "id" | "side" | "stack" | "depth">): void => {
    steps.push({
      id: `T${steps.length + 1}`,
      ...s,
      side: [...side],
      stack: [...stack],
      depth: [...depth],
    });
  };
  const finish = (answer: boolean): Trace => {
    if (answer !== isBipartite(n, edges)) {
      throw new Error("기록하는 사본의 답이 정본과 다르다");
    }
    return { steps, outer, pops, pushes, answer, side };
  };
  for (let s = 0; s < n; s++) {
    outer.push({ s, had: side[s] as number, started: side[s] === -1 });
    if (side[s] !== -1) continue;
    side[s] = 0;
    depth[s] = 0;
    stack.push(s);
    pushes++;
    record({
      kind: "start",
      u: s,
      v: null,
      su: 0,
      branch: null,
      before: -1,
      popped: false,
    });
    while (stack.length > 0) {
      const u = stack.pop() as number;
      pops.push(u);
      const su = side[u] as number;
      let first = true;
      for (const v of nbr[u] as number[]) {
        const before = side[v] as number;
        if (before === su) {
          record({ kind: "check", u, v, su, branch: 1, before, popped: first });
          return finish(false);
        }
        if (before !== -1) {
          record({ kind: "check", u, v, su, branch: 2, before, popped: first });
          first = false;
          continue;
        }
        side[v] = 1 - su;
        depth[v] = (depth[u] as number) + 1;
        stack.push(v);
        pushes++;
        record({ kind: "check", u, v, su, branch: 3, before, popped: first });
        first = false;
      }
    }
  }
  return finish(true);
}

export const WALK = traced(WALK_N, WALK_EDGES);

/* ────────────────────── 세는 사본과 다른 판 ────────────────────── */

/**
 * 가장 단순한 방법 — **모든 쪽 나눔을 하나씩 시험한다.** 정점 `n` 개를 두 쪽으로 나누는
 * 방법은 `2^n` 가지이고, 그 하나마다 간선을 차례로 확인해 두 끝의 쪽이 같은 것이 나오면
 * 그 나눔을 버린다. 답은 맞는다. 세는 것은 **확인한 간선 수**다.
 */
function enumerateSplits(
  n: number,
  edges: Edge[],
): { combos: number; checks: number; valid: number[]; answer: boolean } {
  const combos = 2 ** n;
  let checks = 0;
  const valid: number[] = [];
  for (let mask = 0; mask < combos; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      checks++;
      if (((mask >> u) & 1) === ((mask >> v) & 1)) {
        ok = false;
        break;
      }
    }
    if (ok) valid.push(mask);
  }
  return { combos, checks, valid, answer: valid.length > 0 };
}

/**
 * 이 가이드의 절차에 **읽고 쓴 배열 칸 수**를 덧붙여 센 사본. 칸을 한 번 읽으면 1, 한 번
 * 쓰면 1이다. `.alt.ts` 의 세는 사본과 같은 규칙을 쓴다.
 */
function countCells(
  n: number,
  edges: Edge[],
): { cells: number; entries: number; answer: boolean } {
  let cells = 0;
  let entries = 0;
  const nbr: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 4;
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  const side: number[] = Array.from({ length: n }, () => -1);
  cells += n;
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    cells++;
    if (side[s] !== -1) continue;
    cells += 2;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      cells += 3;
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        entries++;
        cells += 2;
        if (side[v] === su) return { cells, entries, answer: false };
        cells++;
        if (side[v] !== -1) continue;
        cells += 2;
        side[v] = other;
        stack.push(v);
      }
    }
  }
  return { cells, entries, answer: true };
}

/**
 * 성분마다 `start` 쪽에서 시작해 **쪽 배열 전체와 나무 경로 걸음 수**를 함께 돌려주는 사본.
 * 답이 갈리는 자리를 만나도 끝까지 채워서 배열을 낸다.
 */
export function sidesFrom(
  n: number,
  edges: Edge[],
  start: 0 | 1,
): { side: number[]; depth: number[]; root: number[]; parent: number[] } {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => -1);
  const root: number[] = Array.from({ length: n }, () => -1);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = start;
    depth[s] = 0;
    root[s] = s;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      for (const v of nbr[u] as number[]) {
        if (side[v] !== -1) continue;
        side[v] = 1 - su;
        depth[v] = (depth[u] as number) + 1;
        root[v] = root[u] as number;
        parent[v] = u;
        stack.push(v);
      }
    }
  }
  return { side, depth, root, parent };
}

/**
 * 정본과 같은 순서로 돌며 셋만 센다 — 시작 횟수 · 첫 이웃 확인의 갈래 · 가장 긴 스택. 걸음마다
 * 배열을 베끼지 않으므로 큰 입력에도 쓴다. 답은 정본과 맞댄다.
 */
function lightRun(
  n: number,
  edges: Edge[],
): { starts: number; first: 1 | 2 | 3 | null; peak: number } {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  let starts = 0;
  let first: 1 | 2 | 3 | null = null;
  let peak = 0;
  let answer = true;
  outer: for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    starts++;
    side[s] = 0;
    stack.push(s);
    peak = Math.max(peak, stack.length);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      for (const v of nbr[u] as number[]) {
        if (side[v] === su) {
          first ??= 1;
          answer = false;
          break outer;
        }
        if (side[v] !== -1) {
          first ??= 2;
          continue;
        }
        first ??= 3;
        side[v] = 1 - su;
        stack.push(v);
        peak = Math.max(peak, stack.length);
      }
    }
  }
  if (answer !== isBipartite(n, edges)) {
    throw new Error("가벼운 셈의 답이 정본과 다르다");
  }
  return { starts, first, peak };
}

/** 연결 성분 수 — 끝까지 채우는 판(`sidesFrom`)의 시작 정점 수로 센다. */
function componentsOf(n: number, edges: Edge[]): number {
  return new Set(sidesFrom(n, edges, 0).root).size;
}

/**
 * 표시를 **`q` 값**으로 두는 판. 정점에 `0 … q-1` 중 하나를 적고 이웃에는 `(내 값 + 1) mod q`
 * 를 적는다. 이웃의 값이 내 값과 같으면 `false` 다. `stop` 이 거짓이면 어긋나도 끝까지 채운다.
 */
function markArray(
  n: number,
  edges: Edge[],
  q: number,
  stop: boolean,
): { mark: number[]; answer: boolean } {
  const nbr = adjacency(n, edges);
  const mark: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  let answer = true;
  for (let s = 0; s < n; s++) {
    if (mark[s] !== -1) continue;
    mark[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const mu = mark[u] as number;
      const next = (mu + 1) % q;
      for (const v of nbr[u] as number[]) {
        if (mark[v] === mu) {
          answer = false;
          if (stop) return { mark, answer };
        }
        if (mark[v] !== -1) continue;
        mark[v] = next;
        stack.push(v);
      }
    }
  }
  return { mark, answer };
}

const markWidth = (n: number, edges: Edge[], q: number): boolean =>
  markArray(n, edges, q, true).answer;

/**
 * 방문 여부만 적는 판. 이미 방문한 이웃을 만나면 `onSeen` 이 정한 대로 한다 — `false` 를
 * 내거나, 넘어가거나. 어느 쪽도 그 이웃이 어느 쪽인지는 모른다.
 */
function visitedOnly(
  n: number,
  edges: Edge[],
  onSeen: "false" | "skip",
): boolean {
  const nbr = adjacency(n, edges);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const v of nbr[u] as number[]) {
        if (seen[v]) {
          if (onSeen === "false") return false;
          continue;
        }
        seen[v] = true;
        stack.push(v);
      }
    }
  }
  return true;
}

/**
 * 정본에 **지나온 이웃 건너뛰기**를 더한 판. 무향 사이클 탐지가 쓰는 배열 하나(`from`)를
 * 그대로 들여온 것이다. 답이 갈리는지는 값이 답한다.
 */
function skipParent(n: number, edges: Edge[]): boolean {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  const from: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    stack.push(s);
    from.push(-1);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        if (v === parent) continue;
        if (side[v] === su) return false;
        if (side[v] !== -1) continue;
        side[v] = other;
        stack.push(v);
        from.push(u);
      }
    }
  }
  return true;
}

/**
 * 두 갈래의 **순서를 바꾼** 판. 「쪽이 적혀 있으면 넘어간다」를 「쪽이 같으면 `false`」보다
 * 먼저 둔다. 이웃 확인마다 그때의 값을 함께 적는다.
 */
function orderSwapped(
  n: number,
  edges: Edge[],
): {
  answer: boolean;
  log: { u: number; v: number; had: number; su: number; side: string }[];
} {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  const log: {
    u: number;
    v: number;
    had: number;
    su: number;
    side: string;
  }[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        const had = side[v] as number;
        if (side[v] !== -1) {
          log.push({ u, v, had, su, side: showSide(side) });
          continue;
        }
        if (side[v] === su) return { answer: false, log };
        side[v] = other;
        stack.push(v);
        log.push({ u, v, had, su, side: showSide(side) });
      }
    }
  }
  return { answer: true, log };
}

/**
 * 스택 대신 **큐**로 드는 판. 먼저 넣은 정점을 먼저 꺼낸다. 이웃에 적는 값과 비교하는 자리는
 * 정본과 같다. 확인한 이웃 항목 수와 쪽 배열을 함께 낸다.
 */
function queueOrder(
  n: number,
  edges: Edge[],
): { answer: boolean; entries: number; side: number[] } {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const queue: number[] = [];
  let head = 0;
  let entries = 0;
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    queue.push(s);
    while (head < queue.length) {
      const u = queue[head++] as number;
      const su = side[u] as number;
      for (const v of nbr[u] as number[]) {
        entries++;
        if (side[v] === su) return { answer: false, entries, side };
        if (side[v] !== -1) continue;
        side[v] = 1 - su;
        queue.push(v);
      }
    }
  }
  return { answer: true, entries, side };
}

/** 간선을 **앞 끝의 목록에만** 넣는 판. 나머지는 정본과 같다. */
function oneList(n: number, edges: Edge[]): boolean {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (nbr[u] as number[]).push(v);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      for (const v of nbr[u] as number[]) {
        if (side[v] === su) return false;
        if (side[v] !== -1) continue;
        side[v] = 1 - su;
        stack.push(v);
      }
    }
  }
  return true;
}

/**
 * 쪽을 **꺼낼 때** 적는 판. 스택에는 「정점과 그 정점에 적을 쪽」의 짝을 넣고, 꺼냈을 때 이미 쪽이
 * 있으면 적으려던 쪽과 같은지만 보고 넘어간다. 넣은 횟수를 센다.
 */
function writeAtPop(
  n: number,
  edges: Edge[],
): { answer: boolean; pushes: number } {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: [number, number][] = [];
  let pushes = 0;
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    stack.push([s, 0]);
    pushes++;
    while (stack.length > 0) {
      const [u, want] = stack.pop() as [number, number];
      if (side[u] !== -1) {
        if (side[u] !== want) return { answer: false, pushes };
        continue;
      }
      side[u] = want;
      for (const v of nbr[u] as number[]) {
        if (side[v] === want) return { answer: false, pushes };
        if (side[v] !== -1) continue;
        stack.push([v, 1 - want]);
        pushes++;
      }
    }
  }
  return { answer: true, pushes };
}

/**
 * 정점 집합을 `k` 가지 값으로 나누되 이웃끼리 값이 다르게 할 수 있는가 — 전수로 시험한다.
 * `related`(그래프 채색)가 쓰는 「필요한 값의 가짓수」를 세는 자리다.
 */
function colorsNeeded(n: number, edges: Edge[]): number {
  for (let k = 1; k <= n; k++) {
    const assign: number[] = Array.from({ length: n }, () => 0);
    const ok = (at: number): boolean => {
      if (at === n) return true;
      for (let c = 0; c < k; c++) {
        assign[at] = c;
        const clash = edges.some(
          ([u, v]) =>
            u <= at &&
            v <= at &&
            (assign[u] as number) === (assign[v] as number),
        );
        if (!clash && ok(at + 1)) return true;
      }
      return false;
    };
    if (ok(0)) return k;
  }
  return n;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  isBipartite(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL("./isBipartite-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 이웃에게 **반대쪽이 아니라 자기와 같은 쪽**을 적는 사본. 쪽을 가르는 일을 하지 않으므로
 * 간선 하나짜리 그래프도 `false` 가 된다.
 */
const sameSideMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^(\s+)const other = 1 - su;$/, "$1const other = su;"],
});

/**
 * 성분의 첫 정점에 **반대쪽**을 적는 사본. 쪽 배열이 통째로 뒤집히는데 반환값은 그대로다.
 */
const flippedStartMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^(\s+)side\[s\] = FIRST_SIDE;$/, "$1side[s] = 1 - FIRST_SIDE;"],
});

/* ────────────────────────── 입력 묶음 ────────────────────────── */

interface Case {
  readonly label: string;
  readonly n: number;
  readonly edges: Edge[];
}

const SMALL: Case[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "길이 4 짜리 고리", n: 4, edges: ring(4) },
  { label: "삼각형", n: 3, edges: ring(3) },
  { label: "길이 5 짜리 고리", n: 5, edges: ring(5) },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  {
    label: "완전 이분 그래프 (왼쪽 둘 · 오른쪽 셋)",
    n: 5,
    edges: complete(2, 3),
  },
  { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
  { label: "자기 자신을 잇는 간선", n: 2, edges: [[0, 0]] },
];

export const WALK_MINUS: Case = {
  label: "전개 입력에서 간선 [6,4] 를 뺀 것",
  n: WALK_N,
  edges: WALK_EDGES.slice(0, 6),
};

/** 마지막 간선 [6,4] 의 한쪽 끝을 3 으로 옮긴 입력 — 스스로 점검하기의 답. */
const RETARGET: Edge[] = [...WALK_EDGES.slice(0, 6), [6, 3]];

const edgeName = ([a, b]: Edge): string => `[${a},${b}]`;

/** 걸음 설명에서 쓰는 갈래 이름. */
export const BRANCH: Record<1 | 2 | 3, string> = {
  1: "① 쪽이 같다",
  2: "② 이미 반대쪽",
  3: "③ 쪽이 없다",
};

/** 걸음 한 줄의 조건 판정 — 실제 값으로. */
export function stepCondition(s: Step): string {
  if (s.kind === "start") return `side[${s.u}]${이가(s.u)} -1 이라 시작한다`;
  const v = s.v as number;
  const b = s.before;
  const same = `side[${v}] === ${s.su}${이가(s.su)} ${b === s.su ? "참" : "거짓"}`;
  if (s.branch === 1) return same;
  return `${same}, side[${v}] !== -1 이 ${b !== -1 ? "참" : "거짓"}`;
}

const STEP_HEAD = ["걸음", "꺼낸 정점", "이웃", "갈래", "side", "stack"];

/** 걸음 목록을 표 행으로 — 단계 표 둘이 같은 모양을 쓴다. */
function stepRows(steps: readonly Step[]): string[][] {
  return steps.map((s) => [
    s.id,
    s.kind === "start" ? "—" : String(s.u),
    s.kind === "start" ? "—" : String(s.v),
    s.branch === null ? "시작" : BRANCH[s.branch],
    showSide(s.side),
    showList(s.stack),
  ]);
}

const countBranch = (steps: readonly Step[], b: 1 | 2 | 3): number =>
  steps.filter((s) => s.branch === b).length;

const idsOf = (steps: readonly Step[]): string =>
  steps.map((s) => s.id).join(" · ");

/** 전개에서 두 번째 성분을 시작하는 걸음의 자리 — 앞은 길이 4 짜리 고리, 뒤는 삼각형이다. */
export const SPLIT = WALK.steps.findIndex(
  (s) => s.kind === "start" && s.u !== 0,
);

/* ────────────────────── 시도 사다리가 쓰는 수 ────────────────────── */

export const BIG_V = 100_000;
export const BIG_E = 200_000;

/** `2^100,000` 의 자릿수. */
export const bigDigits = (): number => Math.floor(BIG_V * Math.log10(2)) + 1;

export function ladderNumbers(): {
  walkChecks: number;
  walkEntries: number;
  ringF: boolean;
  triS: boolean;
  bigCells: number;
} {
  return {
    walkChecks: enumerateSplits(WALK_N, WALK_EDGES).checks,
    walkEntries: countCells(WALK_N, WALK_EDGES).entries,
    ringF: visitedOnly(4, ring(4), "false"),
    triS: visitedOnly(3, ring(3), "skip"),
    bigCells: countCells(BIG_V, bipartite(BIG_V, BIG_E)).cells,
  };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 전개 입력의 간선마다 두 끝에 적힌 쪽. 절차가 멈춘 시점의 쪽 배열이다. */
  "concept-edges": () => {
    const side = WALK.side;
    const root = sidesFrom(WALK_N, WALK_EDGES, 0).root;
    const rows = WALK_EDGES.map((e) => {
      const [a, b] = e;
      const sa = side[a] as number;
      const sb = side[b] as number;
      return [
        edgeName(e),
        `시작 정점 ${root[a]} 의 성분`,
        `${sa} · ${sb}`,
        sa === sb ? "같다" : "다르다",
      ];
    });
    const clash = WALK_EDGES.filter(([a, b]) => side[a] === side[b]);
    return withNote(
      md([["간선", "연결 성분", "두 끝의 쪽", "두 끝의 비교"], ...rows]),
      `절차가 멈춘 시점의 쪽 배열은 ${showSide(side)} 입니다. 간선 ${WALK_EDGES.length} 개 가운데 두 끝의 쪽이 같은 간선은 ${clash.map(edgeName).join(" · ")} ${ko(clash.length)} 개이고, 정본의 답은 ${yn(isBipartite(WALK_N, WALK_EDGES))} 입니다.`,
    );
  },

  /** 가장 단순한 방법 — 모든 쪽 나눔을 시험하는 방법이 규모에 따라 얼마가 되는가. */
  "naive-scale": () => {
    const cases: Case[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "한 줄로 이은 15 정점", n: 15, edges: chain(15) },
      { label: "한 줄로 이은 20 정점", n: 20, edges: chain(20) },
      { label: "한 줄로 이은 22 정점", n: 22, edges: chain(22) },
    ];
    const runs = cases.map((c) => enumerateSplits(c.n, c.edges));
    const rows = cases.map((c, i) => {
      const r = runs[i] as ReturnType<typeof enumerateSplits>;
      return [
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(r.combos),
        comma(r.checks),
      ];
    });
    rows.push([
      `한 줄로 이은 ${comma(BIG_V)} 정점`,
      comma(BIG_V),
      comma(BIG_V - 1),
      `${comma(bigDigits())} 자리 수`,
      "(실행하지 않음)",
    ]);
    const ratios = runs.map((r) => r.checks / r.combos);
    const lo = Math.min(...ratios).toFixed(1);
    const hi = Math.max(...ratios).toFixed(1);
    return withNote(
      md(
        [["입력", "정점 V", "간선 E", "쪽 나눔 후보", "확인한 간선"], ...rows],
        [1, 2, 3, 4],
      ),
      `실행한 ${ko(cases.length)} 줄에서 확인한 간선 수는 후보 수의 ${lo} 배에서 ${hi} 배 사이입니다. 마지막 줄의 후보 수 2^${comma(BIG_V)}${josa(BIG_V, "은", "는")} ${comma(bigDigits())} 자리 수라 실행하지 않았습니다.`,
    );
  },

  /** 한 줄로 이은 네 정점에서 정점 0 의 쪽만 정하면 나머지가 따라 정해진다. */
  "forced-chain": () => {
    const t = traced(4, chain(4));
    const rows = t.steps.map((s) => [
      s.id,
      s.kind === "start" ? "—" : `[${s.u},${s.v}]`,
      s.branch === null
        ? `정점 ${s.u} 의 쪽을 0 으로 고른다`
        : s.branch === 3
          ? `정점 ${s.v} 에 ${1 - s.su}${을를(1 - s.su)} 적는다`
          : `정점 ${s.v} 에 이미 ${s.before}${josa(s.before, "이", "가")} 있어 넘어간다`,
      showSide(s.side),
    ]);
    const chosen = t.steps.filter((s) => s.kind === "start").length;
    const forced = countBranch(t.steps, 3);
    return withNote(
      md([["걸음", "보는 간선", "이 걸음이 한 일", "side"], ...rows]),
      `고른 것은 ${ko(chosen)} 번이고, 나머지 ${ko(forced)} 정점의 쪽은 간선이 정했습니다. 정본의 답은 ${yn(t.answer)} 입니다.`,
    );
  },

  /** 쪽 나눔 후보 중 실제로 모든 간선을 가르는 것은 몇 개인가. */
  "valid-splits": () => {
    const cases: Case[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      WALK_MINUS,
      { label: "길이 4 짜리 고리", n: 4, edges: ring(4) },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "삼각형", n: 3, edges: ring(3) },
    ];
    const rows = cases.map((c) => {
      const r = enumerateSplits(c.n, c.edges);
      const k = componentsOf(c.n, c.edges);
      return [
        c.label,
        comma(r.combos),
        comma(k),
        comma(r.valid.length),
        r.answer ? comma(2 ** k) : "—",
        yn(isBipartite(c.n, c.edges)),
      ];
    });
    const trues = cases.filter((c) => isBipartite(c.n, c.edges));
    const match = trues.filter(
      (c) =>
        enumerateSplits(c.n, c.edges).valid.length ===
        2 ** componentsOf(c.n, c.edges),
    ).length;
    return withNote(
      md(
        [
          [
            "입력",
            "후보 2^V",
            "연결 성분 k",
            "모든 간선을 가르는 나눔",
            "2^k",
            "정본",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      `정본이 true 인 ${ko(trues.length)} 줄 가운데 모든 간선을 가르는 나눔의 수가 2^k 와 같은 줄은 ${ko(match)} 줄입니다.`,
    );
  },

  /** 전수 시험과 전파를 같은 입력에서 나란히 센다. */
  "two-ways": () => {
    const cases: Case[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "한 줄로 이은 15 정점", n: 15, edges: chain(15) },
      { label: "길이 20 짜리 고리", n: 20, edges: ring(20) },
      {
        label: "완전 이분 그래프 (왼쪽 10 · 오른쪽 10)",
        n: 20,
        edges: complete(10, 10),
      },
    ];
    const rows = cases.map((c) => {
      const a = enumerateSplits(c.n, c.edges);
      const b = countCells(c.n, c.edges);
      if (a.answer !== b.answer) throw new Error("두 방식의 답이 갈렸다");
      return [
        c.label,
        comma(c.edges.length),
        comma(a.checks),
        comma(b.entries),
        comma(2 * c.edges.length),
        yn(isBipartite(c.n, c.edges)),
      ];
    });
    const over = cases.filter(
      (c) => countCells(c.n, c.edges).entries > 2 * c.edges.length,
    ).length;
    return withNote(
      md(
        [
          [
            "입력",
            "E",
            "전수 시험의 간선 확인",
            "전파의 이웃 항목 확인",
            "2E",
            "정본",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      `${ko(cases.length)} 줄 모두 두 방식의 답이 같고, 전파의 이웃 항목 확인이 2E 를 넘은 줄은 ${ko(over)} 줄입니다.`,
    );
  },

  /** 후보 — 방문 여부만 적으면 이미 본 이웃을 만났을 때 무엇을 해야 할지 모른다. */
  "one-mark": () => {
    const cases = SMALL.filter((c) => c.edges.length > 0);
    const rows = cases.map((c) => [
      c.label,
      yn(visitedOnly(c.n, c.edges, "false")),
      yn(visitedOnly(c.n, c.edges, "skip")),
      yn(isBipartite(c.n, c.edges)),
    ]);
    const wrongF = cases.filter(
      (c) => visitedOnly(c.n, c.edges, "false") !== isBipartite(c.n, c.edges),
    ).length;
    const wrongS = cases.filter(
      (c) => visitedOnly(c.n, c.edges, "skip") !== isBipartite(c.n, c.edges),
    ).length;
    return withNote(
      md([
        [
          "입력",
          "본 이웃에서 false 를 내는 판",
          "본 이웃을 넘어가는 판",
          "정본",
        ],
        ...rows,
      ]),
      `간선이 있는 입력 ${ko(cases.length)} 개에서 앞 판은 ${ko(wrongF)} 개, 뒤 판은 ${ko(wrongS)} 개의 답이 정본과 다릅니다.`,
    );
  },

  /** 먼저 알아 둘 개념 — 길이 4 짜리 고리에서 정점 2 하나를 읽는다. */
  "concept-read": () => {
    const side = sidesFrom(4, ring(4), 0).side;
    const nbr = adjacency(4, ring(4));
    const v = 2;
    const ns = nbr[v] as number[];
    const their = ns.map((w) => side[w] as number);
    const allDiff = their.every((s) => s !== side[v]);
    return withNote(
      md([
        ["읽는 것", "보는 칸", "값"],
        ["정점 2 의 쪽", `side[${v}]`, String(side[v])],
        ["정점 2 의 이웃", `nbr[${v}]`, showList(ns)],
        [
          "이웃의 쪽",
          ns.map((w) => `side[${w}]`).join(" · "),
          their.join(" · "),
        ],
        [
          "간선마다 두 끝의 비교",
          ns.map((w) => `[${v},${w}]`).join(" · "),
          ns.map((w) => (side[w] === side[v] ? "같다" : "다르다")).join(" · "),
        ],
      ]),
      `정점 ${v} 에 이어진 간선 ${ko(ns.length)} 개가 ${allDiff ? "모두 두 끝의 쪽이 다릅니다" : "모두 두 끝의 쪽이 다르지는 않습니다"}. 길이 4 짜리 고리의 쪽 배열은 ${showSide(side)} 입니다.`,
    );
  },

  /** 먼저 알아 둘 개념 — 간선 [6,4] 를 뺀 그래프에서 모든 간선을 가르는 나눔을 전부 나열한다. */
  "concept-splits": () => {
    const c = WALK_MINUS;
    const r = enumerateSplits(c.n, c.edges);
    const root = sidesFrom(c.n, c.edges, 0).root;
    const starts = [...new Set(root)];
    const rows = r.valid.map((mask, i) => {
      const s = Array.from({ length: c.n }, (_, v) => (mask >> v) & 1);
      const zero = s.flatMap((x, v) => (x === 0 ? [v] : []));
      const one = s.flatMap((x, v) => (x === 1 ? [v] : []));
      return [
        `나눔 ${i + 1}`,
        showList(zero),
        showList(one),
        ...starts.map((st) => `쪽 ${s[st]}`),
      ];
    });
    return withNote(
      md([
        ["나눔", "쪽 0", "쪽 1", ...starts.map((st) => `정점 ${st} 의 쪽`)],
        ...rows,
      ]),
      `후보 ${comma(r.combos)} 가지 가운데 모든 간선을 가르는 나눔은 ${ko(r.valid.length)} 가지입니다. 연결 성분이 ${ko(starts.length)} 개이고, 정점 ${starts.join(" · ")} 의 쪽이 두 가지씩이라 ${Array.from(starts, () => "2").join(" × ")} = ${2 ** starts.length} 입니다.`,
    );
  },

  /** 먼저 알아 둘 개념 — 두 쪽과 연결 성분을 헷갈리지 않는다. */
  "concept-vs-components": () => {
    const run = sidesFrom(WALK_N, WALK_MINUS.edges, 0);
    const inside = (members: number[]): number =>
      WALK_MINUS.edges.filter(
        ([a, b]) => members.includes(a) && members.includes(b),
      ).length;
    const bySide = [0, 1].map((x) =>
      run.side.flatMap((s, v) => (s === x ? [v] : [])),
    );
    const byComp = [...new Set(run.root)].map((r) =>
      run.root.flatMap((x, v) => (x === r ? [v] : [])),
    );
    const rows = [
      ...bySide.map((m, i) => [
        "쪽",
        `쪽 ${i}`,
        showList(m),
        String(inside(m)),
      ]),
      ...byComp.map((m) => [
        "연결 성분",
        `정점 ${m[0]} 의 성분`,
        showList(m),
        String(inside(m)),
      ]),
    ];
    return withNote(
      md([["묶는 기준", "묶음", "정점", "묶음 안을 잇는 간선"], ...rows], [3]),
      `쪽 묶음 안을 잇는 간선은 ${bySide.map(inside).join(" · ")} 개이고, 연결 성분 안을 잇는 간선은 ${byComp.map(inside).join(" · ")} 개입니다. 간선은 모두 ${WALK_MINUS.edges.length} 개입니다.`,
    );
  },

  /** 1단계 — 이웃 목록. */
  "build-lists": () => {
    const nbr = adjacency(WALK_N, WALK_EDGES);
    const total = nbr.reduce((n, list) => n + list.length, 0);
    return withNote(
      md(
        [
          ["정점 v", "nbr[v]", "길이"],
          ...nbr.map((list, v) => [
            String(v),
            showList(list),
            String(list.length),
          ]),
        ],
        [0, 2],
      ),
      `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
    );
  },

  /** 1단계 — 구조마다의 크기. 스택 길이는 걸음마다 잰 것의 최댓값이다. */
  "build-sizes": () => {
    const nbr = adjacency(WALK_N, WALK_EDGES);
    const cells = nbr.reduce((n, l) => n + l.length, 0);
    const peak = Math.max(...WALK.steps.map((s) => s.stack.length));
    return md([
      ["구조", "크기", "전개 입력에서"],
      [
        "`nbr`",
        "목록 `V` 개, 칸 `2E` 개",
        `목록 ${nbr.length} 개, 칸 ${cells} 개`,
      ],
      ["`side`", "`V` 칸", `${WALK_N} 칸`],
      ["`stack`", "많아야 `V` 칸", `가장 길 때 ${peak} 칸`],
    ]);
  },

  /** 2단계 — 바깥 반복이 본 시작 후보. */
  "stage-starts": () => {
    const rows = WALK.outer.map((o) => {
      const st = WALK.steps.find((s) => s.kind === "start" && s.u === o.s);
      return [
        String(o.s),
        String(o.had),
        o.started ? "쪽 0 을 적고 스택에 넣는다" : "넘어간다",
        st ? st.id : "—",
      ];
    });
    const seen = WALK.outer.length;
    const started = WALK.outer.filter((o) => o.started).length;
    return withNote(
      md([["시작 후보 s", "그때의 side[s]", "한 일", "걸음"], ...rows], [0, 1]),
      `바깥 반복은 정점 ${ko(seen)} 개를 본 뒤 멈췄고, 그중 시작한 것은 ${ko(started)} 번입니다. 정점 ${seen} 부터 ${WALK_N - 1} 까지는 그 전에 답이 나와 보지 않았습니다.`,
    );
  },

  /** 3단계 — 길이 4 짜리 고리 부분의 걸음 전부. */
  "stage-spread": () => {
    const part = WALK.steps.slice(0, SPLIT);
    const last = part.at(-1) as Step;
    return withNote(
      md([STEP_HEAD, ...stepRows(part)]),
      `${part[0]?.id} 부터 ${last.id} 까지 ③ 이 ${countBranch(part, 3)} 번(${idsOf(part.filter((s) => s.branch === 3))}), ② 가 ${countBranch(part, 2)} 번(${idsOf(part.filter((s) => s.branch === 2))}) 실행됐고 ① 은 ${countBranch(part, 1)} 번입니다. ${last.id} 가 끝났을 때 스택은 ${showList(last.stack)} 입니다.`,
    );
  },

  /** 4단계 — 삼각형 부분의 걸음. */
  "stage-clash": () => {
    const part = WALK.steps.slice(SPLIT);
    const last = part.at(-1) as Step;
    const left = last.stack.at(-1) as number;
    return withNote(
      md([STEP_HEAD, ...stepRows(part)]),
      `${last.id} 에서 꺼낸 정점 ${last.u} 의 쪽 ${last.su}${과와(last.su)} 이웃 ${last.v} 의 쪽 ${last.before}${이가(last.before)} 같아 false 를 반환합니다. 그때 스택에는 ${showList(last.stack)}${이가(left)} 남아 있고, 정본의 답도 ${yn(isBipartite(WALK_N, WALK_EDGES))} 입니다.`,
    );
  },

  /** 전제 — 간선을 두 목록에 넣지 않으면 답이 갈린다. */
  "premise-one-list": () => {
    const cases: Case[] = [
      {
        label: "[[0,1],[1,2]]",
        n: 3,
        edges: [
          [0, 1],
          [1, 2],
        ],
      },
      {
        label: "[[1,0],[2,1]]",
        n: 3,
        edges: [
          [1, 0],
          [2, 1],
        ],
      },
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "길이 4 짜리 고리", n: 4, edges: ring(4) },
    ];
    const rows = cases.map((c) => [
      c.label,
      yn(isBipartite(c.n, c.edges)),
      yn(oneList(c.n, c.edges)),
    ]);
    const differ = cases.filter(
      (c) => isBipartite(c.n, c.edges) !== oneList(c.n, c.edges),
    );
    return withNote(
      md([
        ["입력", "두 목록에 넣는 판 (정본)", "앞 끝의 목록에만 넣는 판"],
        ...rows,
      ]),
      `답이 갈린 입력은 ${differ.map((c) => c.label).join(" · ")} ${ko(differ.length)} 개입니다. 첫 두 줄은 같은 경로 0 - 1 - 2 를 간선을 적는 방향만 바꿔 넣은 것입니다.`,
    );
  },

  /** 설계 선택 — 표시를 몇 값으로 둘 것인가. */
  "mark-width": () => {
    const widths = [1, 2, 3, 4];
    const agree = widths.map(
      (q) =>
        SMALL.filter(
          (c) => markWidth(c.n, c.edges, q) === isBipartite(c.n, c.edges),
        ).length,
    );
    const best = widths.filter((_, i) => agree[i] === SMALL.length);
    return withNote(
      md([
        ["입력", "1 값", "2 값", "3 값", "4 값", "정본"],
        ...SMALL.map((c) => [
          c.label,
          ...widths.map((q) => yn(markWidth(c.n, c.edges, q))),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ]),
      `${ko(SMALL.length)} 줄이 모두 정본과 같은 가짓수는 ${best.join(" · ")} ${best.length === 1 ? "하나" : `${ko(best.length)} 개`}입니다. 가짓수마다 정본과 같은 줄 수는 ${widths.map((q, i) => `${q} 값 ${agree[i]}`).join(" · ")} 입니다.`,
    );
  },

  /** 세 값 판이 길이 5 짜리 고리에 실제로 적는 값. */
  "mark-three-values": () => {
    const five = ring(5);
    const two = markArray(5, five, 2, false);
    const three = markArray(5, five, 3, false);
    const rows = five.map((e) => {
      const [a, b] = e;
      const t2 = [two.mark[a] as number, two.mark[b] as number];
      const t3 = [three.mark[a] as number, three.mark[b] as number];
      return [
        edgeName(e),
        `${t2[0]} · ${t2[1]}`,
        t2[0] === t2[1] ? "같다" : "다르다",
        `${t3[0]} · ${t3[1]}`,
        t3[0] === t3[1] ? "같다" : "다르다",
      ];
    });
    const clash2 = five.filter(([a, b]) => two.mark[a] === two.mark[b]).length;
    const clash3 = five.filter(
      ([a, b]) => three.mark[a] === three.mark[b],
    ).length;
    return withNote(
      md([
        [
          "간선",
          "두 값 판의 두 끝",
          "두 값 판",
          "세 값 판의 두 끝",
          "세 값 판",
        ],
        ...rows,
      ]),
      `끝까지 채우면 두 값 판은 ${showSide(two.mark)}${을를(two.mark.at(-1) as number)}, 세 값 판은 ${showSide(three.mark)}${을를(three.mark.at(-1) as number)} 적습니다. 두 끝의 값이 같은 간선은 두 값 판에 ${clash2} 개, 세 값 판에 ${clash3} 개입니다.`,
    );
  },

  /** 설계 선택 — 쪽을 넣을 때 적는가, 꺼낼 때 적는가. */
  "write-when": () => {
    const rows = SMALL.map((c) => {
      const a = traced(c.n, c.edges);
      const b = writeAtPop(c.n, c.edges);
      return [
        c.label,
        comma(c.n),
        comma(a.pushes),
        comma(b.pushes),
        yn(a.answer),
        yn(b.answer),
      ];
    });
    const trues = SMALL.filter((c) => isBipartite(c.n, c.edges));
    const exact = trues.filter(
      (c) => traced(c.n, c.edges).pushes === c.n,
    ).length;
    const more = trues.filter(
      (c) => writeAtPop(c.n, c.edges).pushes > c.n,
    ).length;
    const differ = SMALL.filter(
      (c) => traced(c.n, c.edges).answer !== writeAtPop(c.n, c.edges).answer,
    ).length;
    return withNote(
      md(
        [
          [
            "입력",
            "V",
            "넣을 때 적는 판의 넣기",
            "꺼낼 때 적는 판의 넣기",
            "넣을 때 적는 판의 답",
            "꺼낼 때 적는 판의 답",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      `답이 갈린 입력은 ${ko(differ)} 개입니다. 답이 true 인 ${ko(trues.length)} 입력에서 넣을 때 적는 판의 넣기 횟수가 V 와 같은 것은 ${ko(exact)} 개이고, 꺼낼 때 적는 판이 V 보다 많이 넣은 것은 ${ko(more)} 개입니다.`,
    );
  },

  /** 수행 1 — 이웃 목록과 쪽 배열을 만든 직후. */
  "walk-open": () => {
    const nbr = adjacency(WALK_N, WALK_EDGES);
    const lines = nbr.map((l, v) => `  nbr[${v}]  ${showList(l)}`);
    return [
      "이웃 목록과 쪽 배열을 만든 직후",
      ...lines,
      `  side    ${showList(Array.from({ length: WALK_N }, () => -1))}`,
      "  stack   []",
    ].join("\n");
  },

  /** 수행 2 — 바깥 반복의 첫 바퀴. */
  "walk-start": () => {
    const t1 = WALK.steps[0] as Step;
    return [
      `${t1.id} — 바깥 반복이 s = ${t1.u}${을를(t1.u)} 본다`,
      `  판정   ${stepCondition(t1)}`,
      `  side   ${showList(t1.side)}`,
      `  stack  ${showList(t1.stack)}`,
    ].join("\n");
  },

  /** 수행 3 — 정점 4 를 꺼내 이웃 둘을 본다. */
  "walk-pop4": () => {
    const part = WALK.steps.filter((s) => s.kind === "check" && s.u === 4);
    const lines: string[] = [];
    for (const s of part) {
      lines.push(`${s.id} — 정점 ${s.u} 의 이웃 ${s.v}`);
      lines.push(
        `  판정   ${stepCondition(s)} → ${BRANCH[s.branch as 1 | 2 | 3]}`,
      );
      if (s.branch === 3) {
        lines.push(`  계산   side[${s.v}] = 1 - ${s.su} = ${1 - s.su}`);
      }
      lines.push(`  side   ${showList(s.side)}`);
      lines.push(`  stack  ${showList(s.stack)}`);
    }
    return lines.join("\n");
  },

  /** 짚고 가기 — 지나온 이웃을 따로 건너뛰면 답이 갈리는가. */
  "skip-parent": () => {
    // 정점 넷 · 간선 넷 이하인 다중그래프를 전부 만들어 둘을 대조한다.
    const pairs: Edge[] = [];
    for (let u = 0; u < 4; u++) for (let v = u; v < 4; v++) pairs.push([u, v]);
    let checked = 0;
    let differ = 0;
    const walk = (depth: number, acc: Edge[]): void => {
      if (depth === 0) {
        checked++;
        if (isBipartite(4, acc) !== skipParent(4, acc)) differ++;
        return;
      }
      for (const p of pairs) {
        acc.push(p);
        walk(depth - 1, acc);
        acc.pop();
      }
    };
    for (let m = 0; m <= 4; m++) walk(m, []);
    return withNote(
      md([
        [
          "입력",
          "지나온 이웃을 그냥 두는 판 (정본)",
          "지나온 이웃을 건너뛰는 판",
        ],
        ...SMALL.map((c) => [
          c.label,
          yn(isBipartite(c.n, c.edges)),
          yn(skipParent(c.n, c.edges)),
        ]),
      ]),
      `정점이 넷이고 간선이 넷 이하인 그래프 ${comma(checked)} 개(같은 쌍을 여러 번 잇는 것과 자기 자신을 잇는 것을 포함한다)를 전부 만들어 두 판을 대조했고, 반환값이 다른 그래프는 ${comma(differ)} 개입니다.`,
    );
  },

  /** 짚고 가기 — 두 갈래의 순서를 바꾸면 답이 갈리는가. */
  "order-swapped": () => {
    const rows = SMALL.map((c) => [
      c.label,
      yn(isBipartite(c.n, c.edges)),
      yn(orderSwapped(c.n, c.edges).answer),
    ]);
    const differ = SMALL.filter(
      (c) => isBipartite(c.n, c.edges) !== orderSwapped(c.n, c.edges).answer,
    );
    const falses = differ.filter((c) => !isBipartite(c.n, c.edges)).length;
    return withNote(
      md([
        [
          "입력",
          "쪽이 같은지를 먼저 보는 판 (정본)",
          "쪽이 있는지를 먼저 보는 판",
        ],
        ...rows,
      ]),
      `답이 갈린 입력은 ${ko(differ.length)} 개이고, 그중 정본이 false 인 입력이 ${ko(falses)} 개입니다.`,
    );
  },

  /** 짚고 가기 — 순서를 바꾼 판이 삼각형에서 하는 일. */
  "order-swapped-trace": () => {
    const r = orderSwapped(3, ring(3));
    const rows = r.log.map((e) => [
      String(e.u),
      String(e.su),
      String(e.v),
      e.had === -1 ? "·" : String(e.had),
      e.had !== -1 ? "넘어간다" : `쪽 ${1 - e.su}${을를(1 - e.su)} 적는다`,
      e.side,
    ]);
    const skipped = r.log.filter((e) => e.had !== -1);
    const same = skipped.filter((e) => e.had === e.su).length;
    return withNote(
      md([
        [
          "꺼낸 정점",
          "자기 쪽",
          "이웃",
          "그때 이웃의 쪽",
          "순서를 바꾼 판이 한 일",
          "side",
        ],
        ...rows,
      ]),
      `넘어간 이웃 ${ko(skipped.length)} 개 가운데 쪽이 꺼낸 정점과 같았던 것이 ${ko(same)} 개인데, 순서를 바꾼 판은 ${yn(r.answer)} 를 냅니다.`,
    );
  },

  /** 짚고 가기 — 스택 대신 큐로 들어도 답과 쪽 배열이 같은가. */
  "queue-same": () => {
    const rows = SMALL.map((c) => {
      const a = countCells(c.n, c.edges);
      const b = queueOrder(c.n, c.edges);
      const sameSide =
        a.answer && b.answer
          ? showSide(sidesFrom(c.n, c.edges, 0).side) === showSide(b.side)
            ? "같다"
            : "다르다"
          : "—";
      return [
        c.label,
        yn(a.answer),
        yn(b.answer),
        comma(a.entries),
        comma(b.entries),
        sameSide,
      ];
    });
    const answerDiff = SMALL.filter(
      (c) => isBipartite(c.n, c.edges) !== queueOrder(c.n, c.edges).answer,
    ).length;
    const entryDiff = SMALL.filter(
      (c) =>
        countCells(c.n, c.edges).entries !== queueOrder(c.n, c.edges).entries,
    );
    return withNote(
      md(
        [
          [
            "입력",
            "스택 (정본)",
            "큐",
            "스택의 이웃 항목 확인",
            "큐의 이웃 항목 확인",
            "끝난 뒤 쪽 배열",
          ],
          ...rows,
        ],
        [3, 4],
      ),
      `답이 갈린 입력은 ${ko(answerDiff)} 개이고, 이웃 항목 확인 수가 갈린 입력은 ${ko(entryDiff.length)} 개(${entryDiff.map((c) => c.label).join(" · ")})입니다.`,
    );
  },

  /** 수행 4 — 열세 걸음을 끝까지. 걸음마다 조건 판정을 실제 값으로. */
  "walk-trace": () => {
    const rows = WALK.steps.map((s) => [
      s.id,
      s.kind === "start" ? "—" : String(s.u),
      s.kind === "start" ? "—" : String(s.su),
      s.kind === "start" ? "—" : String(s.v),
      stepCondition(s),
      s.branch === null ? "시작" : `${"①②③"[s.branch - 1]}`,
      showSide(s.side),
      showList(s.stack),
    ]);
    const skipped = WALK.outer.filter((o) => !o.started).map((o) => o.s);
    return withNote(
      md([
        [
          "걸음",
          "꺼낸 정점",
          "자기 쪽",
          "이웃",
          "조건 판정",
          "갈래",
          "side",
          "stack",
        ],
        ...rows,
      ]),
      `① 은 ${idsOf(WALK.steps.filter((s) => s.branch === 1))} 에서 ${countBranch(WALK.steps, 1)} 번, ② 는 ${idsOf(WALK.steps.filter((s) => s.branch === 2))} 에서 ${countBranch(WALK.steps, 2)} 번, ③ 은 ${idsOf(WALK.steps.filter((s) => s.branch === 3))} 에서 ${countBranch(WALK.steps, 3)} 번 실행됐습니다. 바깥 반복은 시작 후보 ${skipped.join(" · ")}${을를(skipped.at(-1) as number)} 쪽이 있어 넘어갔고, 반환값은 ${yn(WALK.answer)} 입니다.`,
    );
  },

  /** 수행 4 — 확인한 이웃 항목 수와 쪽을 적은 횟수. */
  "walk-count": () => {
    const checks = WALK.steps.filter((s) => s.kind === "check").length;
    const starts = WALK.steps.filter((s) => s.kind === "start").length;
    const writes = countBranch(WALK.steps, 3);
    const written = WALK.side.filter((s) => s !== -1).length;
    return withNote(
      md([
        ["센 것", "값", "기준"],
        ["확인한 이웃 항목", String(checks), `2E = ${2 * WALK_EDGES.length}`],
        [
          "쪽을 적은 횟수",
          `③ ${writes} + 시작 ${starts} = ${writes + starts}`,
          `V = ${WALK_N}`,
        ],
        ["꺼낸 정점", showList(WALK.pops), `${WALK.pops.length} 개`],
      ]),
      `확인하지 않고 남은 이웃 항목은 ${2 * WALK_EDGES.length - checks} 개입니다. 쪽이 적힌 정점은 ${written} 개인데 꺼낸 정점은 ${WALK.pops.length} 개라, 쪽만 받고 꺼내지 않은 정점이 ${written - WALK.pops.length} 개 있습니다.`,
    );
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { n: number; edges: Edge[] }[] = [
      { n: WALK_N, edges: WALK_EDGES },
      { n: 4, edges: ring(4) },
      { n: 3, edges: ring(3) },
      { n: 5, edges: complete(2, 3) },
      {
        n: 6,
        edges: [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
        ],
      },
      {
        n: 5,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      { n: 1, edges: [] },
      { n: 1, edges: [[0, 0]] },
    ];
    const calls = cases.map(
      (c) => `isBipartite(${c.n}, ${JSON.stringify(c.edges)})`,
    );
    const w = Math.max(...calls.map((s) => s.length));
    return cases
      .map(
        (c, i) =>
          `${(calls[i] as string).padEnd(w)}  ->  ${yn(isBipartite(c.n, c.edges))}`,
      )
      .join("\n");
  },

  /** 알아 두면 좋은 개념 — 이웃끼리 값이 다르게 하려면 값이 몇 가지 필요한가. */
  "colors-needed": () => {
    const cases: Case[] = [
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
      { label: "길이 4 짜리 고리", n: 4, edges: ring(4) },
      {
        label: "완전 이분 그래프 (왼쪽 둘 · 오른쪽 셋)",
        n: 5,
        edges: complete(2, 3),
      },
      { label: "삼각형", n: 3, edges: ring(3) },
      { label: "길이 5 짜리 고리", n: 5, edges: ring(5) },
      {
        label: "정점 넷을 모두 이은 것",
        n: 4,
        edges: complete(1, 3).concat([
          [1, 2],
          [1, 3],
          [2, 3],
        ]),
      },
    ];
    const need = cases.map((c) => colorsNeeded(c.n, c.edges));
    const match = cases.filter(
      (c, i) => (need[i] as number) <= 2 === isBipartite(c.n, c.edges),
    ).length;
    return withNote(
      md(
        [
          ["입력", "V", "E", "필요한 값의 가짓수", "정본"],
          ...cases.map((c, i) => [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(need[i] as number),
            yn(isBipartite(c.n, c.edges)),
          ]),
        ],
        [1, 2, 3],
      ),
      `${ko(cases.length)} 줄 가운데 「가짓수가 2 이하」와 「정본이 true」가 함께 참이거나 함께 거짓인 줄은 ${ko(match)} 줄입니다.`,
    );
  },

  /** 경쟁 설계와의 대조 — 계수는 `.alt.ts` 가 낸 것을 그대로 쓴다. */
  "alt-flip": () => {
    const mine: Record<string, number> = ALT_CASES["쪽 배열 탐색"]();
    const other: Record<string, number> = ALT_CASES["쪽 관계 서로소 집합"]();
    const keys = Object.keys(mine);
    return md(
      [
        ["재는 것", "쪽 배열 탐색", "쪽 관계 서로소 집합", "적은 쪽"],
        ...keys.map((k) => {
          const a = mine[k] as number;
          const b = other[k] as number;
          return [
            k,
            comma(a),
            comma(b),
            a === b ? "같다" : a < b ? "쪽 배열 탐색" : "쪽 관계 서로소 집합",
          ];
        }),
      ],
      [1, 2],
    );
  },

  /** 쪽이 나무 경로 걸음 수의 홀짝과 같은가 — 전개 입력에서 검산한다. */
  "depth-parity": () => {
    const r = sidesFrom(WALK_N, WALK_EDGES, 0);
    const rows: string[][] = [];
    let ok = 0;
    for (let v = 0; v < WALK_N; v++) {
      const d = r.depth[v] as number;
      if (d % 2 === r.side[v]) ok++;
      rows.push([
        String(v),
        String(r.root[v]),
        String(d),
        String(d % 2),
        String(r.side[v]),
      ]);
    }
    return withNote(
      md(
        [["정점 v", "성분 시작 정점", "d(v)", "d(v) mod 2", "c(v)"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      `${ko(WALK_N)} 정점 가운데 d(v) mod 2 와 c(v) 가 같은 정점은 ${ko(ok)} 개입니다. 이 표는 어긋나는 간선을 만나도 멈추지 않고 끝까지 채우는 판으로 적었습니다.`,
    );
  },

  /** 수식 — 고리 하나만 있는 그래프를 길이별로. */
  "cycle-lengths": () => {
    const ls = [3, 4, 5, 6];
    const rows = ls.map((L) => [
      `길이 ${L} 짜리 고리`,
      String(L),
      L % 2 === 1 ? "홀수" : "짝수",
      yn(isBipartite(L, ring(L))),
    ]);
    const match = ls.filter(
      (L) => (L % 2 === 0) === isBipartite(L, ring(L)),
    ).length;
    return withNote(
      md([["입력", "L", "L 의 홀짝", "정본"], ...rows], [1]),
      `${ko(ls.length)} 줄 가운데 「L 이 짝수」와 「정본이 true」가 함께 참이거나 함께 거짓인 줄은 ${ko(match)} 줄입니다.`,
    );
  },

  /** 수식 — 고리를 따라 적힌 값이 c(v_0) ⊕ (i mod 2) 와 같은가. */
  "cycle-walk": () => {
    const L = 4;
    const side = sidesFrom(L, ring(L), 0).side;
    const c0 = side[0] as number;
    const rows = Array.from({ length: L }, (_, i) => [
      String(i),
      String(i % 2),
      String(c0 ^ (i % 2)),
      String(side[i]),
    ]);
    const ok = rows.filter((r) => r[2] === r[3]).length;
    const last = side[L - 1] as number;
    return withNote(
      md(
        [["i", "i mod 2", "c(v_0) ⊕ (i mod 2)", "side[v_i]"], ...rows],
        [0, 1, 2, 3],
      ),
      `${ko(L)} 줄 가운데 두 값이 같은 줄은 ${ko(ok)} 줄입니다. 닫는 간선 [${L - 1},0] 의 두 끝은 ${last} · ${c0} 이라 ${last === c0 ? "같습니다" : "다릅니다"}.`,
    );
  },

  /** 수식 — 칸 접근 수의 닫힌 형태가 실측과 맞는가. */
  "cost-closed-form": () => {
    // **답이 true 인 입력만 담는다.** false 면 그 자리에서 반환하므로 아래 식이 서지 않는다.
    const cases: Case[] = [
      WALK_MINUS,
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "1,000 정점을 넷씩 가른 숲", n: 1_000, edges: forest(1_000, 4) },
      {
        label: "완전 이분 그래프 (왼쪽 100 · 오른쪽 100)",
        n: 200,
        edges: complete(100, 100),
      },
      {
        label: `정점 ${comma(BIG_V)} · 간선 ${comma(BIG_E)}`,
        n: BIG_V,
        edges: bipartite(BIG_V, BIG_E),
      },
    ];
    const rows = cases.map((c) => [
      c.label,
      comma(c.n),
      comma(c.edges.length),
      comma(componentsOf(c.n, c.edges)),
      comma(countCells(c.n, c.edges).cells),
      comma(8 * c.n + 10 * c.edges.length),
    ]);
    const hit = cases.filter(
      (c) => countCells(c.n, c.edges).cells === 8 * c.n + 10 * c.edges.length,
    ).length;
    return withNote(
      md(
        [["입력", "V", "E", "k", "실제 칸 접근", "8V + 10E"], ...rows],
        [1, 2, 3, 4, 5],
      ),
      `${ko(cases.length)} 줄 가운데 실제 칸 접근이 8V + 10E 와 같은 줄은 ${ko(hit)} 줄입니다.`,
    );
  },

  /** 불변식 — 걸음마다 두 성질을 잰다. */
  "invariant-steps": () => {
    const rows = WALK.steps.map((s, i) => {
      const written = s.side.flatMap((x, v) => (x === -1 ? [] : [v]));
      const bad = written.filter(
        (v) => (s.depth[v] as number) % 2 !== s.side[v],
      ).length;
      const done = WALK.steps
        .slice(0, i + 1)
        .filter((t) => t.kind === "check" && t.branch !== 1);
      const doneBad = done.filter(
        (t) => s.side[t.u] === s.side[t.v as number],
      ).length;
      return [
        s.id,
        String(written.length),
        String(bad),
        String(done.length),
        String(doneBad),
      ];
    });
    const allOk = rows.every((r) => r[2] === "0" && r[4] === "0");
    return withNote(
      md(
        [
          [
            "걸음",
            "쪽이 적힌 정점",
            "홀짝과 쪽이 어긋난 정점",
            "확인을 마친 이웃 항목",
            "그중 두 끝의 쪽이 같은 항목",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      `${ko(WALK.steps.length)} 걸음 ${allOk ? "모두" : "가운데 일부만"} 뒤의 두 셈이 0 입니다. ${WALK.steps.at(-1)?.id} 에서 만난 쪽이 같은 이웃은 확인을 마친 항목으로 세지 않았습니다.`,
    );
  },

  /** 불변식 — T3 과 T4 에서 걸음 수와 쪽이 함께 바뀐다. */
  "invariant-t3t4": () => {
    const rows = WALK.steps
      .filter((s) => s.id === "T3" || s.id === "T4")
      .map((s) => {
        const v = s.v as number;
        const d = s.depth[v] as number;
        return [
          s.id,
          String(v),
          String(s.u),
          `${s.depth[s.u]} + 1 = ${d}`,
          String(d % 2),
          `1 - ${s.su} = ${s.side[v]}`,
        ];
      });
    return md(
      [
        [
          "걸음",
          "쪽을 받은 정점 v",
          "꺼낸 정점 u",
          "d(v)",
          "d(v) mod 2",
          "side[v]",
        ],
        ...rows,
      ],
      [1, 2, 4],
    );
  },

  /** 불변식 — 시작 쪽을 뒤집으면 무엇이 바뀌고 무엇이 그대로인가. */
  "flip-start": () => {
    const a = sidesFrom(WALK_N, WALK_EDGES, 0);
    const b = sidesFrom(WALK_N, WALK_EDGES, 1);
    const flipped = a.side.every((s, v) => s !== b.side[v]);
    const differ = SMALL.filter(
      (c) =>
        isBipartite(c.n, c.edges) !==
        flippedStartMutant.isBipartite(c.n, c.edges),
    ).length;
    return withNote(
      `${md([
        ["시작 쪽", "쪽 배열 (끝까지 채운 판)"],
        ["0", showSide(a.side)],
        ["1", showSide(b.side)],
      ])}

정점마다 값이 ${flipped ? "모두 뒤집혔습니다" : "뒤집히지 않은 정점이 있습니다"}. 같은 변경을 정본의 한 줄에 적용해 ${ko(SMALL.length)} 입력에 실행하면 이렇습니다.

${md([
  ["입력", "쪽 0 에서 시작하는 판 (정본)", "쪽 1 에서 시작하는 판"],
  ...SMALL.map((c) => [
    c.label,
    yn(isBipartite(c.n, c.edges)),
    yn(flippedStartMutant.isBipartite(c.n, c.edges)),
  ]),
])}`,
      `반환값이 갈린 입력은 ${ko(differ)} 개입니다.`,
    );
  },

  /** 불변식 — 경계에 있는 입력. */
  "edge-cases": () => {
    const cases: { label: string; call: string; n: number; edges: Edge[] }[] = [
      { label: "정점 하나", call: "isBipartite(1, [])", n: 1, edges: [] },
      { label: "간선 없음", call: "isBipartite(10, [])", n: 10, edges: [] },
      {
        label: "자기 자신을 잇는 간선",
        call: "isBipartite(1, [[0,0]])",
        n: 1,
        edges: [[0, 0]],
      },
      {
        label: "같은 쌍 두 번",
        call: "isBipartite(3, [[0,1],[0,1],[1,2]])",
        n: 3,
        edges: [
          [0, 1],
          [0, 1],
          [1, 2],
        ],
      },
      {
        label: "나뉜 성분",
        call: "isBipartite(5, [[0,1],[2,3]])",
        n: 5,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      {
        label: `한 줄 ${comma(BIG_V)} 정점`,
        call: `isBipartite(${BIG_V}, 한 줄)`,
        n: BIG_V,
        edges: chain(BIG_V),
      },
    ];
    const rows = cases.map((c) => {
      // 걸음마다 배열을 베끼는 `traced` 는 정점 10 만 개에서 메모리를 다 쓴다 — 가벼운 셈으로 잰다.
      const t = lightRun(c.n, c.edges);
      const nbr0 = adjacency(c.n, c.edges)[0] as number[];
      return [
        c.label,
        `\`${c.call}\``,
        comma(t.starts),
        c.n <= 10 ? showList(nbr0) : `길이 ${nbr0.length}`,
        t.first === null ? "없음" : BRANCH[t.first].slice(2),
        comma(t.peak),
        yn(isBipartite(c.n, c.edges)),
      ];
    });
    return md(
      [
        [
          "경계",
          "호출",
          "시작 횟수",
          "nbr[0]",
          "첫 이웃 확인의 갈래",
          "가장 긴 스택",
          "정본",
        ],
        ...rows,
      ],
      [2, 5],
    );
  },

  /** 불변식 — 이웃에게 같은 쪽을 적으면 어느 입력에서 답이 갈리는가. */
  "mutant-same-side": () => {
    const differ = SMALL.filter(
      (c) =>
        isBipartite(c.n, c.edges) !== sameSideMutant.isBipartite(c.n, c.edges),
    );
    return withNote(
      md([
        ["입력", "이웃에 반대쪽을 적는 판 (정본)", "이웃에 같은 쪽을 적는 판"],
        ...SMALL.map((c) => [
          c.label,
          yn(isBipartite(c.n, c.edges)),
          yn(sameSideMutant.isBipartite(c.n, c.edges)),
        ]),
      ]),
      `반환값이 갈린 입력은 ${ko(differ.length)} 개입니다.`,
    );
  },

  /** 비용을 세는 과정 — 전개에서 꺼낸 정점과 본 이웃. 정점은 한 번씩만 꺼내진다. */
  "derive-pops": () => {
    const rows = WALK.pops.map((u, i) => {
      const mine = WALK.steps.filter((s) => s.kind === "check" && s.u === u);
      return [
        String(i + 1),
        String(u),
        mine.map((s) => String(s.v)).join(" · "),
        idsOf(mine),
      ];
    });
    const entries = WALK.steps.filter((s) => s.kind === "check").length;
    const twice = WALK.pops.length - new Set(WALK.pops).size;
    return withNote(
      md([["바퀴", "꺼낸 정점", "본 이웃", "걸음"], ...rows], [0, 1]),
      `꺼낸 정점은 ${WALK.pops.length} 개이고 두 번 꺼낸 정점은 ${twice} 개, 본 이웃 항목은 ${entries} 개입니다.`,
    );
  },

  /** 최악을 만드는 입력 — 간선 200,000 개짜리 이분 그래프를 어떻게 만드는가. */
  "worst-build": () => {
    const edges = bipartite(BIG_V, BIG_E);
    const byGap = new Map<number, number>();
    for (const [a, b] of edges) byGap.set(b - a, (byGap.get(b - a) ?? 0) + 1);
    const rows = [...byGap.entries()].map(([gap, cnt]) => [
      `[i, i+${gap}]`,
      String(gap),
      comma(cnt),
    ]);
    const crossing = edges.filter(([a, b]) => a % 2 !== b % 2).length;
    return withNote(
      md([["간선 모양", "번호 차", "간선 수"], ...rows], [1, 2]),
      `모두 합쳐 간선 ${comma(edges.length)} 개이고, 두 끝의 번호 홀짝이 다른 간선은 ${comma(crossing)} 개입니다. 정본의 답은 ${yn(isBipartite(BIG_V, edges))} 입니다.`,
    );
  },

  /** 최악을 만드는 입력 — 모양을 바꾸면 최악이 어디인가. */
  "shape-values": () => {
    const V = BIG_V;
    const cases: Case[] = [
      {
        label: `간선 ${comma(BIG_E)} 개짜리 이분 그래프`,
        n: V,
        edges: bipartite(V, BIG_E),
      },
      {
        label: "완전 이분 그래프 (왼쪽 632 · 오른쪽 316)",
        n: V,
        edges: complete(632, 316),
      },
      { label: `한 줄로 이은 ${comma(V)} 정점`, n: V, edges: chain(V) },
      { label: `간선이 없는 ${comma(V)} 정점`, n: V, edges: [] },
      {
        label: "삼각형을 정점 0·1·2 에 두고 나머지를 이분으로 채운 것",
        n: V,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
          ...bipartite(V - 3, BIG_E - 3).map(
            ([a, b]) => [a + 3, b + 3] as Edge,
          ),
        ],
      },
      {
        label: "같은 삼각형을 정점 번호 맨 뒤에 옮긴 것",
        n: V,
        edges: [
          ...bipartite(V - 3, BIG_E - 3),
          [V - 3, V - 2],
          [V - 2, V - 1],
          [V - 1, V - 3],
        ],
      },
    ];
    const vals = cases.map((c) => countCells(c.n, c.edges));
    const top = Math.max(...vals.map((r) => r.cells));
    const topAt = vals.findIndex((r) => r.cells === top);
    return withNote(
      md(
        [
          ["입력 모양", "V", "E", "칸 접근", "반환값"],
          ...cases.map((c, i) => [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma((vals[i] as { cells: number }).cells),
            yn((vals[i] as { answer: boolean }).answer),
          ]),
        ],
        [1, 2, 3],
      ),
      `가장 큰 값은 ${ORDINAL[topAt] ?? `${topAt + 1} 번째`} 줄의 ${comma(top)} 이고, 8·${comma(V)} + 10·${comma(BIG_E)} = ${comma(8 * V + 10 * BIG_E)} 입니다.`,
    );
  },

  /** 스스로 점검하기 — 마지막 간선의 한쪽 끝만 옮기면 무엇이 달라지는가. */
  "edge-retarget": () => {
    const a = countCells(WALK_N, WALK_EDGES);
    const b = countCells(WALK_N, RETARGET);
    const sides = sidesFrom(WALK_N, RETARGET, 0).side;
    return withNote(
      md(
        [
          ["입력", "연결 성분 k", "확인한 이웃 항목", "2E", "정본"],
          [
            "전개 입력 — 마지막 간선이 [6,4]",
            String(componentsOf(WALK_N, WALK_EDGES)),
            comma(a.entries),
            comma(2 * WALK_EDGES.length),
            yn(isBipartite(WALK_N, WALK_EDGES)),
          ],
          [
            "마지막 간선을 [6,3] 으로 옮긴 것",
            String(componentsOf(WALK_N, RETARGET)),
            comma(b.entries),
            comma(2 * RETARGET.length),
            yn(isBipartite(WALK_N, RETARGET)),
          ],
        ],
        [1, 2, 3],
      ),
      `옮긴 뒤의 쪽 배열은 ${showSide(sides)} 입니다.`,
    );
  },
};

/** 「첫째」·「둘째」 — 표의 줄을 가리킨다. */
const ORDINAL = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
