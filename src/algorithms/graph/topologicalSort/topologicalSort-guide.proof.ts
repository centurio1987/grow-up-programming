/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/topologicalSort/topologicalSort-guide.md
 *
 * **세는 자리를 덧붙인 사본이 몇 있다**(`traced` · `light` · `bruteForce` · `scanEdges` ·
 * `scanArray` · `withContainer` · `cellParts` · `earlyTrace`). 정본은 몇 칸을 읽었는지를 내보내지
 * 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본은 부를 때마다 자기 답을 정본(또는 정본에서 기계로 만든 변이)의 답과 맞대고,
 * 다르면 던진다. 그림 사이드카(`-guide.fig.tsx`)와 걸음 재생 패널도 여기의 `traced` 가 낸 기록을 쓴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { topologicalSort } from "./topologicalSort-guide.ref.ts";

export type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 처음 후보가 둘(4 · 5)이고, 정점 0 과 1 은 진입 차수가 2 라
 * 「줄였는데 아직 0 이 아니다」 갈래가 실제로 실행된다. 정점 0 과 1 은 나가는 간선이 없다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [5, 2],
  [5, 0],
  [4, 0],
  [4, 1],
  [2, 3],
  [3, 1],
];

/** 마름모 그래프. 유효한 순서가 둘이라 「답이 하나가 아니다」를 보이는 자리다. */
const DIAMOND_N = 4;
const DIAMOND_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/** 사이클만 있는 그래프 `0 → 1 → 2 → 0`. */
const CYCLE3: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

/** 사이클 앞에 정점 하나를 붙인 그래프 `3 → 0`, `0 → 1 → 2 → 0`. */
const TAILED: Edge[] = [[3, 0], ...CYCLE3];

/** 정점 `v` 개를 한 줄로 이은 유향 그래프 — `0 → 1 → … → v-1`. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부를 가리키는 그래프. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 정점 `v` 개가 고리를 이룬 그래프 — `0 → 1 → … → v-1 → 0`. */
function ring(v: number): Edge[] {
  return [...chain(v), [v - 1, 0] as Edge];
}

/** 사슬의 마지막 간선을 빼고 `2 → 0` 을 넣은 그래프 — 간선 수는 사슬과 같고 사이클이 앞을 막는다. */
function blockedChain(v: number): Edge[] {
  return [...chain(v).slice(0, v - 2), [2, 0] as Edge];
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[4, 5, 2, 0, 3, 1]` 꼴 — 본문 표기와 같다. `null` 은 그대로 적는다. */
export const show = (xs: readonly number[] | null): string =>
  xs === null ? "null" : `[${xs.join(", ")}]`;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 걸음 번호. T1 이 준비, 꺼내기 한 번이 걸음 하나, 마지막 걸음이 끝이다. */
export const stepOf = (k: number): string => `T${k + 2}`;

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 등폭 블록의 칸 맞춤. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록의 줄들 — 칸마다 가장 넓은 값에 맞춘다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, widths[c] ?? 0))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

const same = (a: readonly number[] | null, b: readonly number[] | null) =>
  a === null || b === null
    ? a === b
    : a.length === b.length && a.every((x, i) => x === b[i]);

/** 순열 하나가 모든 간선의 방향을 지키는가. 읽은 간선 끝점 수도 함께 돌려준다. */
function isValid(
  order: readonly number[],
  edges: readonly Edge[],
): { ok: boolean; reads: number } {
  const at: number[] = Array.from({ length: order.length }, () => -1);
  for (const [i, v] of order.entries()) at[v] = i;
  let reads = 0;
  for (const [u, v] of edges) {
    reads += 2;
    if ((at[u] as number) >= (at[v] as number)) return { ok: false, reads };
  }
  return { ok: true, reads };
}

/** 나가는 목록. */
function nextOf(n: number, edges: readonly Edge[]): number[][] {
  const next: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (next[u] as number[]).push(v);
  return next;
}

/* ───────────────────── 정본과 같은 절차의 기록 ───────────────────── */

/** 진입 차수 하나를 줄인 기록. */
export interface Dec {
  readonly v: number;
  readonly before: number;
  readonly after: number;
  /** ① 0 이 되어 큐에 담았는가. 거짓이면 ② 아직 남았다. */
  readonly pushed: boolean;
}

/** 꺼내기 한 번 — 그 꺼내기가 끝난 뒤의 상태. */
export interface Pop {
  readonly u: number;
  readonly decs: readonly Dec[];
  readonly indegree: readonly number[];
  /** 큐 배열 전체(이미 꺼낸 칸 포함). */
  readonly queue: readonly number[];
  /** 꺼낸 뒤의 `head` — 꺼낸 정점 바로 다음 자리다. */
  readonly head: number;
  readonly order: readonly number[];
}

export interface Run {
  readonly next: readonly (readonly number[])[];
  /** 간선을 다 읽은 직후의 진입 차수 — `deg⁻(v)`. */
  readonly start: readonly number[];
  /** 처음 후보 — 진입 차수가 0 이라 반복 전에 담은 정점. */
  readonly seeds: readonly number[];
  readonly pops: readonly Pop[];
  readonly queue: readonly number[];
  readonly order: readonly number[];
  readonly indegree: readonly number[];
  readonly result: number[] | null;
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 걸음마다 배열을 베껴 두므로 작은 입력에만 쓴다. 부를
 * 때마다 답을 정본과 맞댄다 — 다르면 이 기록은 다른 절차의 것이다.
 */
export function traced(n: number, edges: readonly Edge[]): Run {
  const next = nextOf(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const start = [...indegree];
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  const seeds = [...queue];
  const order: number[] = [];
  const pops: Pop[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    head++;
    order.push(u);
    const decs: Dec[] = [];
    for (const v of next[u] as number[]) {
      const before = indegree[v] as number;
      indegree[v] = before - 1;
      const pushed = indegree[v] === 0;
      if (pushed) queue.push(v);
      decs.push({ v, before, after: before - 1, pushed });
    }
    pops.push({
      u,
      decs,
      indegree: [...indegree],
      queue: [...queue],
      head,
      order: [...order],
    });
  }
  const result = order.length === n ? order : null;
  const ref = topologicalSort(
    n,
    edges.map((e) => [...e] as Edge),
  );
  if (!same(result, ref)) {
    throw new Error(
      `기록 사본의 답 ${show(result)} 이 정본 ${show(ref)} 과 다르다`,
    );
  }
  return { next, start, seeds, pops, queue, order, indegree, result };
}

/** 큰 입력용 — 걸음을 베끼지 않고 큐에서 안 꺼낸 부분의 최대 길이만 센다. */
function light(n: number, edges: readonly Edge[]) {
  const next = nextOf(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  let widest = queue.length;
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    head++;
    for (const v of next[u] as number[]) {
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) queue.push(v);
    }
    widest = Math.max(widest, queue.length - head);
  }
  const result = queue.length === n ? queue : null;
  if (!same(result, topologicalSort(n, [...edges]))) {
    throw new Error("큰 입력 사본의 답이 정본과 다르다");
  }
  return { next, widest, order: queue };
}

/** 전개 입력의 기록 — 본문 · 그림 · 걸음 재생 패널이 함께 쓴다. */
export const WALK = traced(WALK_N, WALK_EDGES);

/** 끝 걸음의 번호. */
export const END_STEP = stepOf(WALK.pops.length);

/* ────────────────────── 다른 절차 — 비교 대상 ────────────────────── */

/**
 * 가장 단순한 방법 — 정점의 **모든 순열**을 사전순으로 만들어 하나씩 검사하고, 처음으로
 * 모든 간선을 지키는 것이 나오면 멈춘다. 기법이 하나도 안 들어간 풀이다.
 */
function bruteForce(n: number, edges: readonly Edge[]) {
  const perm: number[] = [];
  const used: boolean[] = Array.from({ length: n }, () => false);
  let tried = 0;
  let reads = 0;
  let answer: number[] | null = null;
  const walk = (): void => {
    if (answer !== null) return;
    if (perm.length === n) {
      tried++;
      const r = isValid(perm, edges);
      reads += r.reads;
      if (r.ok) answer = [...perm];
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      perm.push(v);
      walk();
      perm.pop();
      used[v] = false;
      if (answer !== null) return;
    }
  };
  walk();
  return { answer: answer as number[] | null, tried, reads };
}

/** 유효한 순열 전부. 정점 수가 작을 때만 쓴다. */
function allValid(n: number, edges: readonly Edge[]): number[][] {
  const perm: number[] = [];
  const used: boolean[] = Array.from({ length: n }, () => false);
  const found: number[][] = [];
  const walk = (): void => {
    if (perm.length === n) {
      if (isValid(perm, edges).ok) found.push([...perm]);
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      perm.push(v);
      walk();
      perm.pop();
      used[v] = false;
    }
  };
  walk();
  return found;
}

const factorial = (v: number): number => {
  let f = 1;
  for (let k = 2; k <= v; k++) f *= k;
  return f;
};

/**
 * 진입 차수를 세어 두지 않고, 한 자리를 정할 때마다 **간선 목록 전체**를 다시 읽어 「아직 안 뺀
 * 정점 중 아직 안 뺀 정점에서 오는 간선이 없는 것」을 찾는다.
 */
function scanEdges(n: number, edges: readonly Edge[]) {
  const done: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  let reads = 0;
  for (let round = 0; round < n; round++) {
    const blocked: boolean[] = Array.from({ length: n }, () => false);
    for (const [u, v] of edges) {
      reads += 2;
      if (done[u] === false) blocked[v] = true;
    }
    let pick = -1;
    for (let v = 0; v < n; v++) {
      reads++;
      if (done[v] === false && blocked[v] === false) {
        pick = v;
        break;
      }
    }
    if (pick < 0) return { order: null, reads };
    done[pick] = true;
    order.push(pick);
  }
  return { order: order as number[] | null, reads };
}

/**
 * 진입 차수를 배열에 세어 두되, 0 인 정점을 찾을 때마다 **배열 전체를 앞에서부터** 다시 읽는다.
 * 「아이디어를 떠올리는 과정」이 먼저 시험하는 후보다.
 */
function scanArray(n: number, edges: readonly Edge[]) {
  const next = nextOf(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  for (const [, v] of edges) {
    reads += 2;
    indegree[v] = (indegree[v] as number) + 1;
  }
  const done: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  for (let round = 0; round < n; round++) {
    let pick = -1;
    for (let v = 0; v < n; v++) {
      reads++;
      if (done[v] === false && indegree[v] === 0) {
        pick = v;
        break;
      }
    }
    if (pick < 0) return { order: null, reads };
    done[pick] = true;
    order.push(pick);
    for (const v of next[pick] as number[]) {
      reads++;
      indegree[v] = (indegree[v] as number) - 1;
    }
  }
  return { order: order as number[] | null, reads };
}

type Container = "큐" | "스택" | "번호가 가장 작은 것";

/**
 * 진입 차수가 0 이 **되는 그 자리**에서 후보 목록에 담는다. 꺼내는 규칙을 셋 중 하나로 갈아 끼워
 * 결과와 계수가 어떻게 갈리는지 본다. `큐` 가 정본과 같은 조합이다. 「번호가 가장 작은 것」은 남은
 * 후보를 전부 읽어 최솟값을 고른다 — 힙을 쓰지 않은 판이다.
 */
function withContainer(n: number, edges: readonly Edge[], kind: Container) {
  const next = nextOf(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  for (const [, v] of edges) {
    reads += 2;
    indegree[v] = (indegree[v] as number) + 1;
  }
  const pool: number[] = [];
  for (let v = 0; v < n; v++) {
    reads++;
    if (indegree[v] === 0) pool.push(v);
  }
  let head = 0;
  const take = (): number => {
    if (kind === "큐") return pool[head++] as number;
    if (kind === "스택") return pool.pop() as number;
    let best = head;
    for (let i = head + 1; i < pool.length; i++) {
      reads++;
      if ((pool[i] as number) < (pool[best] as number)) best = i;
    }
    return pool.splice(best, 1)[0] as number;
  };
  const order: number[] = [];
  while (pool.length > head) {
    const u = take();
    order.push(u);
    for (const v of next[u] as number[]) {
      reads++;
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) pool.push(v);
    }
  }
  const result = order.length === n ? order : null;
  if (kind === "큐" && !same(result, topologicalSort(n, [...edges]))) {
    throw new Error("큐 판의 답이 정본과 다르다");
  }
  return { order: result, reads };
}

/**
 * 정본과 같은 절차. 읽고 쓴 배열 칸만 덧붙여 센다 — `deep.math` 의 닫힌 형태와 맞춘다. 세 몫으로
 * 갈라 돌려준다 — 두 자료 만들기 · 처음 후보 찾기 · 주 반복.
 */
function cellParts(n: number, edges: readonly Edge[]) {
  let build = 0;
  let seed = 0;
  let loop = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  build += n;
  const indegree: number[] = Array.from({ length: n }, () => 0);
  build += n;
  for (const [u, v] of edges) {
    build += 4;
    (next[u] as number[]).push(v);
    indegree[v] = (indegree[v] as number) + 1;
  }
  const queue: number[] = [];
  for (let v = 0; v < n; v++) {
    seed++;
    if (indegree[v] === 0) {
      queue.push(v);
      seed++;
    }
  }
  const order: number[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    loop += 3;
    head++;
    order.push(u);
    for (const v of next[u] as number[]) {
      loop += 2;
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) {
        queue.push(v);
        loop++;
      }
    }
  }
  const result = order.length === n ? order : null;
  if (!same(result, topologicalSort(n, [...edges]))) {
    throw new Error("세는 사본의 답이 정본과 다르다");
  }
  return { build, seed, loop, total: build + seed + loop, taken: order.length };
}

/** 정점마다 가장 긴 선행 경로의 간선 수 — 「가장 이른 차례」. 위상 순서대로 한 번 훑는다. */
function levels(n: number, edges: readonly Edge[]): number[] {
  const order = topologicalSort(n, [...edges]);
  if (order === null) throw new Error("사이클이 있어 차례를 정할 수 없다");
  const next = nextOf(n, edges);
  const level: number[] = Array.from({ length: n }, () => 0);
  for (const u of order) {
    for (const v of next[u] as number[]) {
      level[v] = Math.max(level[v] as number, (level[u] as number) + 1);
    }
  }
  return level;
}

/** `from` 에서 간선을 따라 `to` 에 갈 수 있는가. */
function reaches(n: number, edges: readonly Edge[], from: number, to: number) {
  const next = nextOf(n, edges);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack = [from];
  seen[from] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    if (u === to) return true;
    for (const v of next[u] as number[]) {
      if (!seen[v]) {
        seen[v] = true;
        stack.push(v);
      }
    }
  }
  return false;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  topologicalSort(n: number, edges: Edge[]): number[] | null;
}

const REF_PATH = new URL("./topologicalSort-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 큐에 담는 조건 `indegree[v] === 0` 을 `<= 1` 로 바꾼 사본. 진입 차수가 아직 1 남은 정점이 큐에
 * 들어간다. 처음 후보를 담는 줄은 `for` 로 시작해서 이 정규식에 안 걸린다.
 */
const earlyPush = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(indegree\[v\] === 0\) queue\.push\(v\);/,
    "      if ((indegree[v] as number) <= 1) queue.push(v);",
  ],
});

/** 들어오는 간선 대신 **나가는 간선**을 센 사본. `indegree[v]` 한 자리를 `indegree[u]` 로 바꿨다. */
const outDegree = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /indegree\[v\] = \(indegree\[v\] as number\) \+ 1;/,
    "indegree[u] = (indegree[u] as number) + 1;",
  ],
});

/** 변이를 걸지 않은 채 불린 판인가 — `check-proof` 가 중화 대조를 할 때 그렇다. */
const neutral = (m: Ref): boolean => m.topologicalSort === topologicalSort;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "간선이 없는 네 정점", n: 4, edges: [] },
];

function mutantRows(m: Ref) {
  return MUTANT_CASES.map((c) => {
    const correct = topologicalSort(c.n, c.edges);
    const broken = m.topologicalSort(c.n, c.edges);
    return {
      label: c.label,
      correct,
      broken,
      verdict: same(correct, broken) ? "같다" : "다르다",
    };
  });
}

// 변이가 걸린 판에서 하나도 안 갈리면 절의 주장이 성립하지 않는다. 중화 판에서는 건너뛴다.
for (const m of [earlyPush, outDegree]) {
  if (!neutral(m) && mutantRows(m).every((r) => r.verdict === "같다")) {
    throw new Error("변이가 어느 입력에서도 결과를 바꾸지 못했다");
  }
}

/**
 * 「1 이 남아도 담는다」 판을 한 걸음씩 기록한 사본. 변이 모듈은 반환값만 내므로 걸음은 이 사본이
 * 내고, 반환값은 변이 모듈과 맞댄다(중화 판에서는 맞댈 변이가 없으므로 건너뛴다).
 */
function earlyTrace(n: number, edges: readonly Edge[]) {
  const next = nextOf(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  const order: number[] = [];
  const rows: { u: number; decs: Dec[]; queue: number[]; order: number[] }[] =
    [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    head++;
    order.push(u);
    const decs: Dec[] = [];
    for (const v of next[u] as number[]) {
      const before = indegree[v] as number;
      indegree[v] = before - 1;
      const pushed = (indegree[v] as number) <= 1;
      if (pushed) queue.push(v);
      decs.push({ v, before, after: before - 1, pushed });
    }
    rows.push({ u, decs, queue: queue.slice(head), order: [...order] });
  }
  const result = order.length === n ? order : null;
  if (!neutral(earlyPush)) {
    const want = earlyPush.topologicalSort(n, [...edges]);
    if (!same(result, want))
      throw new Error("걸음 사본이 변이와 다른 답을 낸다");
  }
  return { rows, result };
}

/* ─────────────────── 「아이디어를 떠올리는 과정」의 식 ─────────────────── */

/** 사슬 `V` 에서 세 방법이 읽는 원소 수 — 실행과 맞대어 확인한 식. */
const FORMULA = {
  scanEdges: (v: number) => 2 * v * (v - 1) + (v * (v + 1)) / 2,
  scanArray: (v: number) => 3 * (v - 1) + (v * (v + 1)) / 2,
  queue: (v: number) => 3 * (v - 1) + v,
};

/** `V!` 의 자릿수. 로그를 더해서 낸다 — 큰 정수를 실제로 곱하지 않는다. */
function factorialDigits(v: number): number {
  let logSum = 0;
  for (let k = 2; k <= v; k++) logSum += Math.log10(k);
  return Math.floor(logSum) + 1;
}

/** 초를 사람이 읽는 단위로. 값은 전부 계산해서 나온 것이다. */
function duration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(3)} 초`;
  if (seconds < 86_400) return `${comma(Math.round(seconds))} 초`;
  const days = seconds / 86_400;
  if (days < 365) return `${days.toFixed(1)} 일`;
  return `${comma(Math.round(days / 365))} 년`;
}

export const BIG = 100_000;

let ladderCache: ReturnType<typeof computeLadder> | null = null;

function computeLadder() {
  for (const v of [10, 100, 1_000]) {
    const e = chain(v);
    if (scanEdges(v, e).reads !== FORMULA.scanEdges(v))
      throw new Error("간선 목록 다시 읽기 식이 실행과 다르다");
    if (scanArray(v, e).reads !== FORMULA.scanArray(v))
      throw new Error("배열 다시 읽기 식이 실행과 다르다");
    if (withContainer(v, e, "큐").reads !== FORMULA.queue(v))
      throw new Error("큐 식이 실행과 다르다");
  }
  return {
    big: BIG,
    digits: factorialDigits(BIG),
    walkCount: allValid(WALK_N, WALK_EDGES).length,
    walkPerms: factorial(WALK_N),
    scanEdges: FORMULA.scanEdges(BIG),
    scanArray: FORMULA.scanArray(BIG),
    queue: FORMULA.queue(BIG),
    seconds: (ops: number) => duration(ops / 1e8),
  };
}

/** 시도 사다리(그림)와 본문이 함께 쓰는 수 — 식은 작은 규모의 실행과 맞대어 확인한다. */
export function ladderNumbers() {
  ladderCache ??= computeLadder();
  return ladderCache;
}

/* ────────────────────────── 블록 ────────────────────────── */

const indegreeCells = (xs: readonly number[], gone: readonly number[] = []) =>
  xs.map((d, v) => (gone.includes(v) ? "-" : String(d))).join(" ");

/** `T3 · T3 · T4` 를 `T3 에 두 번, T4` 로 — 같은 걸음이 되풀이되면 횟수를 붙인다. */
function grouped(steps: readonly string[]): string {
  const names = ["", "", "두 번", "세 번", "네 번"];
  const seen = [...new Set(steps)];
  return seen
    .map((t) => {
      const k = steps.filter((x) => x === t).length;
      return k === 1 ? t : `${t} 에 ${names[k] ?? `${k} 번`}`;
    })
    .join(", ");
}

const decText = (d: Dec): string => `${d.v}${이가(d.v)} ${d.before}→${d.after}`;

export const PROOFS: Record<string, () => string> = {
  /** 답 하나를 한 줄로 놓고 간선마다 두 끝의 자리를 잰다. */
  "concept-check": () => {
    const order = WALK.result as number[];
    const at = (v: number) => order.indexOf(v);
    const rows = WALK_EDGES.map(([u, v]) => [
      `${u}→${v}`,
      String(at(u)),
      String(at(v)),
      at(u) < at(v) ? "지킨다" : "어긋난다",
    ]);
    const kept = rows.filter((r) => r[3] === "지킨다").length;
    return `${md(["간선 u→v", "u 의 자리", "v 의 자리", "방향"], rows, [1, 2])}

나열 ${show(order)} 에서 간선 ${WALK_EDGES.length} 개 가운데 ${kept} 개가 방향을 지킵니다.`;
  },

  /** 같은 그래프의 유효한 나열 — 셋을 꺼내 보이고 전부 몇 개인지 센다. */
  "concept-many": () => {
    const all = allValid(WALK_N, WALK_EDGES);
    const kinds: Container[] = ["큐", "스택", "번호가 가장 작은 것"];
    const rows = kinds.map((k) => {
      const p = withContainer(WALK_N, WALK_EDGES, k).order as number[];
      return [show(p), isValid(p, WALK_EDGES).ok ? "모두 지킨다" : "어긋난다"];
    });
    return `${md(["나열", "간선 방향"], rows)}

정점 ${WALK_N} 개를 늘어놓는 나열 ${comma(factorial(WALK_N))} 가지 가운데 모든 간선을 지키는 것은 ${all.length} 가지입니다.`;
  },

  /** 정점 하나를 결과에 넣을 때마다 진입 차수가 어떻게 줄어드는가. */
  "concept-remove": () => {
    const rows: string[][] = [
      ["처음", indegreeCells(WALK.start), show(WALK.seeds)],
    ];
    for (const p of WALK.pops.slice(0, 2)) {
      const zero = p.indegree
        .map((d, v) => ({ d, v }))
        .filter((x) => x.d === 0 && !p.order.includes(x.v))
        .map((x) => x.v);
      rows.push([
        `${p.u}${을를(p.u)} 넣은 뒤`,
        indegreeCells(p.indegree, p.order),
        show(zero),
      ]);
    }
    return `${md(
      [
        "시점",
        "정점 0 1 2 3 4 5 의 진입 차수",
        "결과에 없고 진입 차수가 0 인 정점",
      ],
      rows,
    )}

결과에 넣은 정점은 「-」 로 적었습니다.`;
  },

  /** 전개 입력에 순열 전수 검사를 실제로 실행한 값. */
  "brute-walk": () => {
    const b = bruteForce(WALK_N, WALK_EDGES);
    return `${md(
      ["센 것", "값"],
      [
        ["검사한 순열 수", comma(b.tried)],
        ["읽은 간선 끝점 수", comma(b.reads)],
        ["처음 찾은 유효한 순열", show(b.answer)],
      ],
      [1],
    )}

순열 ${comma(factorial(WALK_N))} 개 가운데 ${comma(b.tried)} 번째에서 멈췄습니다.`;
  },

  /** 답이 없는 입력에서 순열 전수 검사가 몇 개를 검사하는가 — 수치 반박의 근거. */
  "naive-scale": () => {
    const rows: string[][] = [];
    let ran = 0;
    for (const v of [6, 7, 8]) {
      const b = bruteForce(v, ring(v));
      if (b.tried !== factorial(v))
        throw new Error("사이클에서 순열을 다 검사하지 않았다");
      if (b.answer !== null) throw new Error("사이클에서 답이 나왔다");
      ran++;
      rows.push([comma(v), comma(b.tried), duration(b.tried / 1e8), "실행"]);
    }
    for (const v of [10, 15, 20]) {
      const f = factorial(v);
      rows.push([
        comma(v),
        f > 1e15 ? f.toExponential(3) : comma(f),
        duration(f / 1e8),
        "V!",
      ]);
    }
    const n = ladderNumbers();
    return `${md(
      ["정점 V", "검사한 순열", "초당 1 억 개 기준", "센 방법"],
      rows,
      [0, 1, 2],
    )}

입력은 정점 V 개가 고리를 이룬 그래프입니다. 실행한 ${ran} 줄에서 검사한 순열이 모두 V! 과 같았고, 나머지 줄은 V! 로 낸 값입니다. 정점이 ${comma(n.big)} 개면 V! 만 적어도 ${comma(n.digits)} 자리입니다.`;
  },

  /** 한 자리씩 정하며 남는 그래프 — 고르는 순서는 정본의 답을 따른다. */
  "origin-peel": () => {
    const order = WALK.result as number[];
    const rows: string[][] = [];
    const gone: number[] = [];
    let empty = 0;
    for (const [i, pick] of order.entries()) {
      const left = WALK_EDGES.filter(
        ([u, v]) => !gone.includes(u) && !gone.includes(v),
      );
      const free = [...Array(WALK_N).keys()].filter(
        (v) => !gone.includes(v) && !left.some(([, w]) => w === v),
      );
      if (free.length === 0) empty++;
      if (!free.includes(pick))
        throw new Error("정본이 고른 정점이 후보가 아니다");
      rows.push([
        String(i + 1),
        String(left.length),
        free.join(" · "),
        String(pick),
      ]);
      gone.push(pick);
    }
    return `${md(
      ["차례", "남은 간선", "들어오는 간선이 없는 정점", "고른 정점"],
      rows,
      [0, 1, 3],
    )}

${order.length} 차례 가운데 후보가 없었던 차례는 ${empty} 번이고, 고른 순서 ${show(order)} 는 정본의 답과 같습니다.`;
  },

  /** 간선 목록을 매번 읽는 방법과 진입 차수를 세어 두는 방법. */
  "scan-vs-count": () => {
    const a = scanEdges(WALK_N, WALK_EDGES);
    const b = scanArray(WALK_N, WALK_EDGES);
    const c1000 = chain(1_000);
    const rows = [
      [
        "간선 목록을 매번 다시 읽는다",
        comma(a.reads),
        show(a.order),
        comma(scanEdges(1_000, c1000).reads),
      ],
      [
        "진입 차수를 세어 둔다",
        comma(b.reads),
        show(b.order),
        comma(scanArray(1_000, c1000).reads),
      ],
    ];
    return `${md(
      ["방법", "전개 입력에서 읽은 원소", "결과", "사슬 1,000 에서 읽은 원소"],
      rows,
      [1, 3],
    )}

두 방법의 결과가 ${same(a.order, b.order) ? "같습니다" : "다릅니다"}.`;
  },

  /** 0 인 정점을 매 바퀴 다시 찾는가, 0 이 되는 자리에서 담는가. */
  "array-vs-queue": () => {
    const sizes = [1_000, 10_000];
    const inputs: [number, Edge[]][] = [
      [WALK_N, WALK_EDGES],
      ...sizes.map((v) => [v, chain(v)] as [number, Edge[]]),
    ];
    const a = inputs.map(([n, e]) => scanArray(n, e));
    const b = inputs.map(([n, e]) => withContainer(n, e, "큐"));
    const rows = [
      [
        "진입 차수 배열을 매 바퀴 앞에서부터 읽는다",
        ...a.map((x) => comma(x.reads)),
      ],
      ["0 이 되는 자리에서 큐에 담는다", ...b.map((x) => comma(x.reads))],
    ];
    const valid = inputs.filter(([, e], i) => {
      const x = a[i]?.order ?? null;
      const y = b[i]?.order ?? null;
      return x !== null && y !== null && isValid(x, e).ok && isValid(y, e).ok;
    }).length;
    return `${md(
      ["방법", "전개 입력", "사슬 1,000", "사슬 10,000"],
      rows,
      [1, 2, 3],
    )}

두 방법이 모두 유효한 나열을 낸 입력은 ${inputs.length} 개 가운데 ${valid} 개입니다.`;
  },

  /** 세 방법이 사슬에서 읽는 원소 수의 식과 규모. */
  "origin-scale": () => {
    const n = ladderNumbers();
    const rows = (
      [
        ["간선 목록을 매번 다시 읽는다", "2V(V − 1) + V(V + 1)/2", n.scanEdges],
        [
          "진입 차수 배열을 매 바퀴 읽는다",
          "3(V − 1) + V(V + 1)/2",
          n.scanArray,
        ],
        ["0 이 되는 자리에서 큐에 담는다", "3(V − 1) + V", n.queue],
      ] as [string, string, number][]
    ).map(([name, f, ops]) => [name, f, comma(ops), n.seconds(ops)]);
    return `${md(
      [
        "방법",
        "사슬 V 에서 읽는 원소",
        `V = ${comma(n.big)}`,
        "초당 1 억 번 기준",
      ],
      rows,
      [2, 3],
    )}

세 식은 사슬 10 · 100 · 1,000 을 실행한 값과 모두 일치했고, V = ${comma(n.big)} 열은 그 식으로 낸 값입니다.`;
  },

  /** 1단계 — 간선 한 번 읽기로 만든 두 자료. */
  "build-count": () => {
    const rows = WALK.start.map((d, v) => [
      String(v),
      show(WALK.next[v] as number[]),
      String(d),
      WALK_EDGES.filter(([, w]) => w === v)
        .map(([u, w]) => `${u}→${w}`)
        .join(" · ") || "없음",
    ]);
    const lens = WALK.next.reduce((s, l) => s + l.length, 0);
    const sum = WALK.start.reduce((s, d) => s + d, 0);
    return `${md(
      ["정점 v", "next[v]", "indegree[v]", "들어오는 간선"],
      rows,
      [0, 2],
    )}

next 목록 길이의 합은 ${lens} 이고 indegree 의 합은 ${sum} 입니다. 간선은 ${WALK_EDGES.length} 개입니다.`;
  },

  /** 2단계 — 진입 차수가 0 인 정점을 번호 순서로 담는다. */
  "build-seed": () => {
    const rows = WALK.start.map((d, v) => [
      String(v),
      String(d),
      d === 0 ? "담는다" : "담지 않는다",
    ]);
    return `${md(["정점 v", "indegree[v]", "처음 큐에"], rows, [0, 1])}

큐는 ${show(WALK.seeds)}${으로(WALK.seeds.at(-1) ?? 0)} 시작합니다.`;
  },

  /** 3단계 — 꺼낼 때마다 진입 차수 배열 전체와 큐. */
  "build-decrease": () => {
    const rows = WALK.pops.map((p, k) => [
      stepOf(k),
      String(p.u),
      p.decs.length === 0 ? "없음" : p.decs.map(decText).join(" · "),
      indegreeCells(p.indegree, p.order),
      p.decs.some((d) => d.pushed)
        ? p.decs
            .filter((d) => d.pushed)
            .map((d) => String(d.v))
            .join(" · ")
        : "없음",
      show(p.queue.slice(p.head)),
    ]);
    const decs = WALK.pops.reduce((s, p) => s + p.decs.length, 0);
    return `${md(
      [
        "걸음",
        "꺼낸 정점",
        "줄인 진입 차수",
        "정점 0 1 2 3 4 5 의 진입 차수",
        "새로 담은 정점",
        "큐에서 안 꺼낸 부분",
      ],
      [
        [
          "T1",
          "-",
          "없음",
          indegreeCells(WALK.start),
          WALK.seeds.join(" · "),
          show(WALK.seeds),
        ],
        ...rows,
      ],
    )}

결과에 넣은 정점은 「-」 로 적었습니다. 진입 차수를 줄인 횟수는 ${decs} 번이고 간선은 ${WALK_EDGES.length} 개입니다.`;
  },

  /** 정점마다 — 몇 번 줄었고 언제 0 이 되어 몇 번 담겼는가. */
  "build-once": () => {
    const rows = WALK.start.map((d, v) => {
      const at = WALK.pops.flatMap((p, k) =>
        p.decs.filter((x) => x.v === v).map(() => stepOf(k)),
      );
      const zero = WALK.seeds.includes(v)
        ? "T1"
        : stepOf(
            WALK.pops.findIndex((p) =>
              p.decs.some((x) => x.v === v && x.pushed),
            ),
          );
      const times = WALK.queue.filter((x) => x === v).length;
      return [
        String(v),
        String(d),
        at.length === 0 ? "없음" : at.join(" · "),
        zero,
        String(times),
      ];
    });
    const other = rows.filter((r) => r[4] !== "1").length;
    return `${md(
      [
        "정점",
        "처음 진입 차수",
        "줄어든 걸음",
        "0 이 된 걸음",
        "큐에 담긴 횟수",
      ],
      rows,
      [0, 1, 4],
    )}

큐에 담긴 횟수가 1 이 아닌 정점은 ${other} 개입니다.`;
  },

  /** 4단계 — 사이클이 있는 입력에서 큐가 담는 정점 수와 반환값. */
  "cycle-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "사이클만 있다 0→1→2→0", n: 3, edges: CYCLE3 },
      { label: "앞에 정점 하나 3→0, 사이클 0→1→2→0", n: 4, edges: TAILED },
      { label: "자기 자신을 가리키는 간선 0→0", n: 1, edges: [[0, 0]] },
      { label: "사이클이 없다 (전개 입력)", n: WALK_N, edges: WALK_EDGES },
    ];
    let full = 0;
    const rows = cases.map((c) => {
      const run = traced(c.n, c.edges);
      if ((run.queue.length === c.n) !== (run.result !== null))
        throw new Error("큐가 담은 수와 반환값이 어긋난다");
      if (run.queue.length === c.n) full++;
      return [c.label, String(run.queue.length), String(c.n), show(run.result)];
    });
    return `${md(
      ["입력", "큐가 담은 정점 수", "정점 수 n", "반환값"],
      rows,
      [1, 2],
    )}

큐가 담은 정점 수가 n 과 같은 입력은 ${rows.length} 개 가운데 ${full} 개이고, 그 입력만 null 이 아닌 답을 냈습니다.`;
  },

  /** 전제 — 간선은 앞뒤만 정하고 간격은 정하지 않는다. */
  "premise-level": () => {
    const order = WALK.result as number[];
    const level = levels(WALK_N, WALK_EDGES);
    const rows = order.map((v, i) => [String(v), String(i), String(level[v])]);
    const diff = rows.filter((r) => r[1] !== r[2]).length;
    return `${md(
      ["정점", "order 에서의 자리", "가장 이른 차례"],
      rows,
      [0, 1, 2],
    )}

「가장 이른 차례」는 선행 정점의 차례 중 가장 큰 값에 1 을 더한 것이고, 선행 정점이 없으면 0 입니다. 정점 ${WALK_N} 개 가운데 두 값이 다른 정점은 ${diff} 개입니다.`;
  },

  /** 설계 선택 — 후보를 꺼내는 규칙 셋의 결과와 계수. */
  "container-values": () => {
    const kinds: Container[] = ["큐", "스택", "번호가 가장 작은 것"];
    const rows = kinds.map((k) => {
      const w = withContainer(WALK_N, WALK_EDGES, k);
      return [
        k === "번호가 가장 작은 것"
          ? "번호가 가장 작은 것 (후보를 다 읽어 고른다)"
          : k,
        show(w.order),
        w.order !== null && isValid(w.order, WALK_EDGES).ok ? "예" : "아니오",
        comma(withContainer(1_000, star(1_000), k).reads),
      ];
    });
    const valid = rows.filter((r) => r[2] === "예").length;
    return `${md(
      [
        "꺼내는 규칙",
        "전개 입력의 결과",
        "유효한가",
        "별 모양 1,000 에서 읽은 원소",
      ],
      rows,
      [3],
    )}

세 규칙 가운데 유효한 나열을 낸 것은 ${valid} 개이고, 정본의 답은 ${show(WALK.result)} 입니다.`;
  },

  /** 전개가 끝까지 쓰는 고정 입력. */
  "walk-input": () => `const n = 6;
const edges: [number, number][] = [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]];
// 이 절이 끝나면 ${show(topologicalSort(WALK_N, WALK_EDGES))} 이 나와야 한다`,

  /** 1 번 조각만 실행한 결과. */
  "walk-build": () => {
    const rows = WALK.start.map((d, v) => [
      `next[${v}] = ${show(WALK.next[v] as number[])}`,
      `indegree[${v}] = ${d}`,
    ]);
    const lens = WALK.next.reduce((s, l) => s + l.length, 0);
    const sum = WALK.start.reduce((s, d) => s + d, 0);
    return `${columns(rows)}\n목록 길이의 합 ${lens} · indegree 의 합 ${sum} · 간선 ${WALK_EDGES.length} 개`;
  },

  /** 들어오는 간선 대신 나가는 간선을 세면 어디서 갈리는가. */
  "pause-out": () =>
    md(
      ["입력", "들어오는 간선 세기 (정본)", "나가는 간선 세기", "판정"],
      mutantRows(outDegree).map((r) => [
        r.label,
        show(r.correct),
        show(r.broken),
        r.verdict,
      ]),
    ),

  /** 사슬에서 나가는 간선을 센 판이 무엇을 하는가. */
  "pause-out-trace": () => {
    const v = 4;
    const edges = chain(v);
    const out = Array.from(
      { length: v },
      (_, x) => edges.filter(([u]) => u === x).length,
    );
    const seeds = out.flatMap((d, x) => (d === 0 ? [x] : []));
    return columns([
      ["사슬 0→1→2→3", ""],
      ["나가는 간선을 센 값", show(out)],
      ["그 값이 0 인 정점", seeds.join(" · ")],
      ["반환값", show(outDegree.topologicalSort(v, edges))],
    ]);
  },

  /** 2 번 조각만 실행한 결과. */
  "walk-seed": () =>
    columns([
      ["indegree", show(WALK.start)],
      ["queue", show(WALK.seeds)],
      ["head", "0"],
      ["order", "[]"],
    ]),

  /** 3 번 조각에서 처음 두 번 꺼낸 결과. */
  "walk-take": () => {
    const lines: string[] = [];
    for (const [k, p] of WALK.pops.slice(0, 2).entries()) {
      lines.push(
        `${stepOf(k)} — 정점 ${p.u}${을를(p.u)} 꺼내고 next[${p.u}] = ${show(WALK.next[p.u] as number[])} 의 진입 차수를 줄인다`,
      );
      for (const d of p.decs) {
        lines.push(
          `  indegree[${d.v}]  ${d.before} → ${d.after}   ${d.pushed ? "① 0 이 됐다 — 담는다" : "② 아직 0 이 아니다 — 담지 않는다"}`,
        );
      }
      lines.push(
        `  queue ${show(p.queue)} · head ${p.head} · order ${show(p.order)}`,
      );
    }
    return lines.join("\n");
  },

  /** 전개 입력의 걸음 전부 — 조건 판정을 실제 값으로. */
  "walk-trace": () => {
    const rows: string[][] = [
      [
        "T1",
        "-",
        `진입 차수가 0 인 정점 ${WALK.seeds.join(" · ")}`,
        indegreeCells(WALK.start),
        "[]",
        show(WALK.seeds),
      ],
    ];
    for (const [k, p] of WALK.pops.entries()) {
      const judge =
        p.decs.length === 0
          ? `next[${p.u}] 이 비어 갈래가 없다`
          : p.decs
              .map(
                (d) =>
                  `indegree[${d.v}] === 0 이 ${d.pushed ? "참 → ①" : "거짓 → ②"}`,
              )
              .join(" · ");
      rows.push([
        stepOf(k),
        String(p.u),
        judge,
        indegreeCells(p.indegree, p.order),
        show(p.order),
        show(p.queue.slice(p.head)),
      ]);
    }
    const last = WALK.pops.at(-1) as Pop;
    rows.push([
      END_STEP,
      "-",
      `head < queue.length 가 거짓 (${last.head} < ${last.queue.length}) · order.length === n 이 ${WALK.order.length === WALK_N ? "참 → ③" : "거짓 → ④"}`,
      indegreeCells(WALK.indegree, WALK.order),
      show(WALK.order),
      "[]",
    ]);
    const one = WALK.pops.flatMap((p, k) =>
      p.decs.filter((d) => d.pushed).map(() => stepOf(k)),
    );
    const two = WALK.pops.flatMap((p, k) =>
      p.decs.filter((d) => !d.pushed).map(() => stepOf(k)),
    );
    return `${md(
      [
        "걸음",
        "꺼낸 정점",
        "조건 판정",
        "진입 차수",
        "order",
        "큐에서 안 꺼낸 부분",
      ],
      rows,
    )}

① 은 ${one.length} 번(${grouped(one)}), ② 는 ${two.length} 번(${grouped(two)}) 실행됐습니다. 꺼내기는 ${WALK.pops.length} 번이고 반환값은 ${show(WALK.result)} 입니다.`;
  },

  /** 갈래 넷이 두 입력에서 몇 번 실행됐는가. */
  "branch-coverage": () => {
    const count = (run: Run, n: number) => ({
      one: run.pops.reduce(
        (s, p) => s + p.decs.filter((d) => d.pushed).length,
        0,
      ),
      two: run.pops.reduce(
        (s, p) => s + p.decs.filter((d) => !d.pushed).length,
        0,
      ),
      three: run.order.length === n ? 1 : 0,
      four: run.order.length === n ? 0 : 1,
    });
    const a = count(WALK, WALK_N);
    const b = count(traced(4, TAILED), 4);
    const rows = (
      [
        ["①", "0 이 된 그 순간에 담는다", a.one, b.one],
        ["②", "줄였지만 아직 0 이 아니라 담지 않는다", a.two, b.two],
        ["③", "전부 들어가 order 를 돌려준다", a.three, b.three],
        ["④", "남은 정점이 있어 null 을 돌려준다", a.four, b.four],
      ] as [string, string, number, number][]
    ).map((r) => r.map(String));
    const covered = rows.filter((r) => Number(r[2]) + Number(r[3]) > 0).length;
    return `${md(
      ["라벨", "하는 일", "전개 입력", "사이클 앞에 정점 하나"],
      rows,
      [2, 3],
    )}

두 입력을 합치면 갈래 ${rows.length} 개 가운데 ${covered} 개가 한 번 이상 실행됐습니다.`;
  },

  /** 사이클만 있는 입력을 전체 코드로 실행한 걸음. */
  "pause-cycle": () => {
    const run = traced(3, CYCLE3);
    return columns([
      ["사이클 0→1→2→0", "", ""],
      ["indegree", show(run.start), "세 정점 다 들어오는 간선이 하나씩 있다"],
      ["queue", show(run.seeds), "진입 차수가 0 인 정점이 없다"],
      [
        "반복",
        `${run.pops.length} 번`,
        "head < queue.length 가 처음부터 거짓이다",
      ],
      ["order", show(run.order), `길이 ${run.order.length} ≠ n = 3`],
      ["반환값", show(run.result), ""],
    ]);
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[] | null }[] = [
      {
        call: "topologicalSort(6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]])",
        run: () => topologicalSort(WALK_N, WALK_EDGES),
      },
      {
        call: "topologicalSort(4, [[0,1],[0,2],[1,3],[2,3]])",
        run: () => topologicalSort(DIAMOND_N, DIAMOND_EDGES),
      },
      {
        call: "topologicalSort(4, [[0,1],[1,2],[2,3]])",
        run: () => topologicalSort(4, chain(4)),
      },
      { call: "topologicalSort(4, [])", run: () => topologicalSort(4, []) },
      {
        call: "topologicalSort(3, [[0,1],[1,2],[2,0]])",
        run: () => topologicalSort(3, CYCLE3),
      },
      {
        call: "topologicalSort(1, [[0,0]])",
        run: () => topologicalSort(1, [[0, 0]]),
      },
      { call: "topologicalSort(1, [])", run: () => topologicalSort(1, []) },
    ];
    return columns(cases.map((c) => [c.call, "→", show(c.run())]));
  },

  /** 정점 쌍마다 앞뒤가 정해지는가 — 간선을 이어 가는 길이 있는가. */
  "related-pairs": () => {
    const pairs: [number, number][] = [
      [5, 2],
      [2, 3],
      [5, 3],
      [4, 5],
      [0, 2],
    ];
    const rows = pairs.map(([a, b]) => {
      const ab = reaches(WALK_N, WALK_EDGES, a, b);
      const ba = reaches(WALK_N, WALK_EDGES, b, a);
      return [
        `${a}${과와(a)} ${b}`,
        ab ? `${a} → ${b}` : ba ? `${b} → ${a}` : "없다",
        ab || ba ? "정해진다" : "정해지지 않는다",
      ];
    });
    let fixed = 0;
    let total = 0;
    for (let a = 0; a < WALK_N; a++) {
      for (let b = a + 1; b < WALK_N; b++) {
        total++;
        if (
          reaches(WALK_N, WALK_EDGES, a, b) ||
          reaches(WALK_N, WALK_EDGES, b, a)
        )
          fixed++;
      }
    }
    return `${md(["정점 쌍", "간선을 이어 가는 길", "앞뒤"], rows)}

정점 쌍 ${total} 개 가운데 앞뒤가 정해진 쌍은 ${fixed} 개이고, 정해지지 않은 쌍은 ${total - fixed} 개입니다. 유효한 나열은 ${allValid(WALK_N, WALK_EDGES).length} 가지입니다.`;
  },

  /** 진입 차수의 합이 간선 수와 같은가 — 여러 입력에서. */
  "math-deg": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "마름모", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "사이클 앞에 정점 하나", n: 4, edges: TAILED },
      { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
    ];
    const rows = cases.map((c) => {
      const deg: number[] = Array.from({ length: c.n }, () => 0);
      for (const [, v] of c.edges) deg[v] = (deg[v] as number) + 1;
      const sum = deg.reduce((s, d) => s + d, 0);
      return [c.label, comma(c.n), comma(c.edges.length), comma(sum)];
    });
    const eq = rows.filter((r) => r[2] === r[3]).length;
    return `${md(["입력", "V", "E", "모든 정점의 deg⁻ 의 합"], rows, [1, 2, 3])}

${rows.length} 입력 가운데 합이 E 와 같은 것은 ${eq} 개입니다.`;
  },

  /** 전개 입력에서 R_t 와 r_t 가 0 인 정점. */
  "math-rt": () => {
    const rows: string[][] = [];
    const all = [...Array(WALK_N).keys()];
    for (let t = 0; t < WALK_N; t++) {
      const pop = WALK.pops[t - 1];
      const gone = pop === undefined ? [] : pop.order;
      const deg = pop === undefined ? WALK.start : pop.indegree;
      const left = all.filter((v) => !gone.includes(v));
      const zero = left.filter((v) => deg[v] === 0);
      rows.push([
        String(t),
        `{${left.join(", ")}}`,
        zero.join(" · ") || "없음",
      ]);
    }
    const none = rows.filter((r) => r[2] === "없음").length;
    return `${md(["t", "R_t", "r_t(v) = 0 인 정점"], rows, [0])}

남은 정점이 있는 ${rows.length} 시점 가운데 r_t 가 0 인 정점이 없었던 시점은 ${none} 개입니다.`;
  },

  /** 모든 r_t 가 1 이상인 모임에서 거꾸로 따라가면 같은 정점이 되풀이된다. */
  "math-chase": () => {
    const run = traced(4, TAILED);
    const left = [0, 1, 2, 3].filter((v) => !run.order.includes(v));
    const inside = TAILED.filter(
      ([u, v]) => left.includes(u) && left.includes(v),
    );
    const rows: string[][] = [];
    const seen: number[] = [];
    let x = left[0] as number;
    for (let i = 0; i <= left.length; i++) {
      const edge = inside.find(([, w]) => w === x) as Edge;
      rows.push([`x_${i}`, String(x), `${edge[0]}→${edge[1]}`]);
      seen.push(x);
      x = edge[0];
    }
    const repeat = seen.find((v, i) => seen.indexOf(v) !== i) as number;
    return `${md(
      ["고른 차례", "정점", "그 정점으로 들어오는 R_t 안의 간선"],
      rows,
    )}

order 에 ${show(run.order)} 이 들어간 뒤 R_t 는 {${left.join(", ")}} 이고, 크기 ${left.length} 인 모임에서 ${left.length + 1} 개를 고르자 정점 ${repeat}${이가(repeat)} 두 번 나왔습니다.`;
  },

  /** 닫힌 형태 `7V + 6E` 가 실제 계수와 같은지 대조한다. */
  "cost-closed-form": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
      { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
      { label: "사슬 100,000", n: 100_000, edges: chain(100_000) },
    ];
    const rows = cases.map((c) => [
      c.label,
      comma(c.n),
      comma(c.edges.length),
      comma(cellParts(c.n, c.edges).total),
      comma(7 * c.n + 6 * c.edges.length),
    ]);
    const eq = rows.filter((r) => r[3] === r[4]).length;
    return `${md(
      ["입력", "V", "E", "실제 배열 칸 접근", "7V + 6E"],
      rows,
      [1, 2, 3, 4],
    )}

${rows.length} 입력 가운데 두 값이 같은 것은 ${eq} 개입니다.`;
  },

  /** 닫힌 형태에 규모를 넣는다. */
  "math-scale": () => {
    const v = BIG;
    const e = BIG;
    const n = ladderNumbers();
    return `${md(
      ["항", `V = E = ${comma(BIG)} 에서`],
      [
        ["7V", comma(7 * v)],
        ["6E", comma(6 * e)],
        ["A(V, E) = 7V + 6E", comma(7 * v + 6 * e)],
        ["순열 전수 검사의 순열 수 V!", `${comma(n.digits)} 자리 수`],
      ],
      [1],
    )}`;
  },

  /** 불변식 — 걸음마다 두 문장을 잰다. */
  "invariant-watch": () => {
    const check = (
      label: string,
      deg: readonly number[],
      order: readonly number[],
      pending: readonly number[],
    ) => {
      const left = [...Array(WALK_N).keys()].filter((v) => !order.includes(v));
      const first = left.every(
        (v) =>
          deg[v] ===
          WALK_EDGES.filter(([u, w]) => w === v && !order.includes(u)).length,
      );
      const second =
        pending.every((v) => deg[v] === 0) &&
        new Set(pending).size === pending.length;
      return [
        label,
        show(order),
        left.map((v) => `${v}:${deg[v]}`).join(" ") || "없음",
        show(pending),
        first ? "지킨다" : "어긋난다",
        second ? "지킨다" : "어긋난다",
      ];
    };
    const rows = [
      check("T1", WALK.start, [], WALK.seeds),
      ...WALK.pops.map((p, k) =>
        check(stepOf(k), p.indegree, p.order, p.queue.slice(p.head)),
      ),
    ];
    const ok = rows.filter(
      (r) => r[4] === "지킨다" && r[5] === "지킨다",
    ).length;
    return `${md(
      [
        "걸음",
        "order",
        "order 밖 정점의 진입 차수",
        "큐에서 안 꺼낸 부분",
        "앞 문장",
        "뒤 문장",
      ],
      rows,
    )}

${rows.length} 시점 가운데 두 문장이 다 지켜진 시점은 ${ok} 개입니다. 앞 문장은 order 밖 정점마다 진입 차수와 order 밖 정점에서 오는 간선 수를 맞대어 쟀습니다.`;
  },

  /** 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: { call: string; n: number; edges: Edge[] }[] = [
      { call: "topologicalSort(1, [])", n: 1, edges: [] },
      { call: "topologicalSort(4, [])", n: 4, edges: [] },
      { call: "topologicalSort(1, [[0,0]])", n: 1, edges: [[0, 0]] },
      { call: "topologicalSort(3, [[0,1],[1,2],[2,0]])", n: 3, edges: CYCLE3 },
      {
        call: "topologicalSort(4, [[0,1],[2,3]])",
        n: 4,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      {
        call: "topologicalSort(2, [[0,1],[0,1]])",
        n: 2,
        edges: [
          [0, 1],
          [0, 1],
        ],
      },
    ];
    const rows = cases.map((c) => {
      const run = traced(c.n, c.edges);
      return [
        `\`${c.call}\``,
        show(run.start),
        show(run.seeds),
        show(run.result),
      ];
    });
    return `${md(["입력", "처음 진입 차수", "처음 후보", "결과"], rows)}`;
  },

  /** 큐에 담는 조건을 「1 이하」로 바꾼 판. */
  "mutant-early-push": () =>
    md(
      ["입력", "0 일 때 담기 (정본)", "1 이하일 때 담기", "판정"],
      mutantRows(earlyPush).map((r) => [
        r.label,
        show(r.correct),
        show(r.broken),
        r.verdict,
      ]),
    ),

  /** 마름모에서 「1 이하」 판이 걷는 걸음. */
  "mutant-early-trace": () => {
    const t = earlyTrace(DIAMOND_N, DIAMOND_EDGES);
    const rows = t.rows.map((r) => [
      `${r.u}${을를(r.u)} 꺼낸다`,
      r.decs.length === 0
        ? "없음"
        : r.decs
            .map((d) => `${decText(d)}${d.pushed ? " · 담는다" : ""}`)
            .join(" · "),
      show(r.queue),
      show(r.order),
    ]);
    const len = t.rows.at(-1)?.order.length ?? 0;
    return `${md(
      ["걸음", "줄인 진입 차수", "큐에서 안 꺼낸 부분", "order"],
      rows,
    )}

order 의 길이가 ${len}${josa(len, "이라", "라")} n = ${DIAMOND_N}${과와(DIAMOND_N)} 달라 반환값은 ${show(t.result)} 입니다.`;
  },

  /** 비용을 세는 과정 — 꺼낼 때마다 읽은 목록. */
  "perf-derive": () => {
    const rows = WALK.pops.map((p, k) => [
      stepOf(k),
      String(p.u),
      String((WALK.next[p.u] as number[]).length),
      String(p.decs.filter((d) => d.pushed).length),
    ]);
    const lens = rows.reduce((s, r) => s + Number(r[2]), 0);
    const pushed = rows.reduce((s, r) => s + Number(r[3]), 0);
    return `${md(
      ["걸음", "꺼낸 정점", "나가는 목록 길이", "새로 담은 정점"],
      rows,
      [1, 2, 3],
    )}

목록 길이의 합은 ${lens} 이고 간선은 ${WALK_EDGES.length} 개입니다. 새로 담은 정점의 합은 ${pushed} 이고, 처음 후보 ${WALK.seeds.length} 개를 더하면 ${pushed + WALK.seeds.length}${으로(pushed + WALK.seeds.length)} 정점 수 ${WALK_N}${과와(WALK_N)} 같습니다.`;
  },

  /** 케이스가 갈리는 것은 규모가 아니라 상수배다. */
  "perf-cases": () => {
    const V = BIG;
    const a = cellParts(V, chain(V));
    const b = cellParts(V, blockedChain(V));
    const rows = (
      [
        ["사이클이 없다 (사슬)", a],
        ["사이클 0→1→2→0 이 앞을 막는다", b],
      ] as [string, ReturnType<typeof cellParts>][]
    ).map(([label, x]) => [
      label,
      comma(x.build),
      comma(x.seed),
      comma(x.loop),
      comma(x.total),
    ]);
    return `${md(
      [
        `입력 (V = ${comma(V)} · E = ${comma(V - 1)})`,
        "두 자료 만들기",
        "처음 후보 찾기",
        "주 반복",
        "합",
      ],
      rows,
      [1, 2, 3, 4],
    )}

두 합의 비는 ${(a.total / b.total).toFixed(2)} 배입니다.`;
  },

  /** 같은 V·E 에서 모양을 바꾸면 계수가 갈리는가. */
  "shape-values": () => {
    const V = BIG;
    const shapes: { label: string; edges: Edge[] }[] = [
      { label: "사슬 0→1→…→99,999", edges: chain(V) },
      { label: "별 모양 — 0 이 나머지 전부를 가리킨다", edges: star(V) },
      { label: "사이클 0→1→2→0 이 앞을 막는다", edges: blockedChain(V) },
    ];
    const rows = shapes.map((s) => {
      const p = cellParts(V, s.edges);
      const got = topologicalSort(V, s.edges);
      return [
        s.label,
        comma(s.edges.length),
        comma(p.total),
        comma(p.taken),
        got === null ? "null" : `길이 ${comma(got.length)} 인 순서`,
      ];
    });
    return `${md(
      [
        `입력 모양 (V = ${comma(V)})`,
        "E",
        "배열 칸 접근",
        "order 에 들어간 정점",
        "반환값",
      ],
      rows,
      [1, 2, 3],
    )}`;
  },

  /** 두 극단의 모양 — 깊이 · 큐 · 목록 길이. */
  "worst-props": () => {
    const V = BIG;
    const measure = (edges: Edge[]) => {
      const run = light(V, edges);
      const depth = Math.max(...levels(V, edges));
      const outMax = Math.max(...run.next.map((l) => l.length));
      return [comma(depth), comma(run.widest), comma(outMax)];
    };
    const rows = [
      ["사슬", ...measure(chain(V))],
      ["별 모양", ...measure(star(V))],
    ];
    return `${md(
      [
        `모양 (V = ${comma(V)})`,
        "가장 긴 경로의 간선 수",
        "큐에서 안 꺼낸 부분의 최대 길이",
        "나가는 목록의 최대 길이",
      ],
      rows,
      [1, 2, 3],
    )}`;
  },

  /** 스스로 점검하기 — `next[5]` 의 순서를 뒤집었을 때. */
  "selfcheck-push-order": () => {
    const swapped: Edge[] = [
      [5, 0],
      [5, 2],
      ...WALK_EDGES.filter(([u]) => u !== 5),
    ];
    const run = traced(WALK_N, swapped);
    const t3 = run.pops[1] as Pop;
    const lines: string[][] = run.pops
      .slice(2)
      .map((p) => [
        `${p.u}${을를(p.u)} 꺼낸다`,
        p.decs.length === 0
          ? `next[${p.u}] 이 비어 있다`
          : p.decs.map(decText).join(" · "),
        `order ${show(p.order)}`,
        `queue ${show(p.queue.slice(p.head))}`,
      ]);
    const ok = run.result !== null && isValid(run.result, WALK_EDGES).ok;
    return `next[5] = ${show(run.next[5] as number[])} 이면 T3 뒤 큐에서 안 꺼낸 부분이 ${show(t3.queue.slice(t3.head))} 이다
${columns(lines)}
결과 ${show(run.result)} — 간선 ${WALK_EDGES.length} 개를 ${ok ? "모두 지킨다" : "다 지키지 못한다"}`;
  },
};
