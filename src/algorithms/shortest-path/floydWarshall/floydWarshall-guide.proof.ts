/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.md
 *
 * **비용은 한 기준으로 센다 — 기본 연산.** 거리 행렬의 칸 하나를 채운 것 · 간선 하나를 읽은 것 ·
 * 행을 건너뛸지 판정한 것 · 경유 후보 하나를 비교한 것을 각각 한 번으로 센다. 다른 방법(출발점마다
 * 벨만-포드 · 경유 횟수를 배로 늘리기 · 존슨 알고리즘)도 같은 네 갈래와 그 방법에만 있는 비교(힙의 두
 * 항목 비교)를 한 번씩 센다. 메모리는 **추가 칸**(거리 행렬이 잡는 칸 수)으로 센다.
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 연산을 몇 번 했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래
 * 블록의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와 중간 상태만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **큰 입력에는 기록 없이 세기만 하는 사본(`countedLite`)을 쓴다.** 기록하는 사본(`counted`)은
 * 라운드마다 거리 행렬 전체를 베껴 두므로, 정점 수백 개에서 부르면 메모리가 모자라 출력 없이 죽는다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  V as ALT_V,
  cases as altCases,
  graph as altGraph,
  crossing,
} from "./floydWarshall-guide.alt.ts";
import { floydWarshall, INF } from "./floydWarshall-guide.ref.ts";

export type Edge = [number, number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프의 정점 수. */
export const WALK_N = 5;

/**
 * 본문 전개가 쓰는 간선 목록.
 *
 * 다섯 갈래를 한 입력에서 전부 실행한다 — 같은 방향 간선 둘(`0 → 1`), 음수 간선(`1 → 2`), 아무도
 * 도달하지 못하는 정점(`4`), 그리고 라운드마다 값이 고쳐지는 칸이다. 마지막 라운드가 아무것도 안
 * 고치는 자리까지 한 그래프에 들어 있다.
 */
export const WALK_EDGES: Edge[] = [
  [0, 1, 3],
  [0, 1, 4],
  [1, 2, -2],
  [2, 0, 5],
  [2, 3, 3],
  [3, 1, 1],
  [4, 3, 2],
];

/**
 * 과제의 규모 — 이 글이 정한 값이다. 뒤에서 만들 절차의 기본 연산이 `V³` 에 달려 있어서, 그 값이
 * 흔한 채점 환경의 예산인 1 초(단순 연산 1 억 번 기준) 언저리에 머무는 정점 수를 골랐다.
 */
export const V_LIMIT = 500;
/** 가중치 절댓값의 상한 — 이 글이 정한 값이다. */
export const W_LIMIT = 1_000_000;
/** 간선을 가장 많이 둔 그래프 — 순서쌍마다 하나. */
export const E_LIMIT = V_LIMIT * (V_LIMIT - 1);

/** 음수 사이클 `0 → 1 → 2 → 0`(가중치 합 −1). `bellmanFord` 편과 같은 입력이다. */
export const NEG_N = 3;
export const NEG_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];

/** 정점 `n` 개를 한 줄로 잇는다. 간선 `n-1` 개이고 뒤로만 갈 수 있다. */
export function line(n: number): Edge[] {
  return Array.from(
    { length: Math.max(0, n - 1) },
    (_, i) => [i, i + 1, (i % 9) + 1] as Edge,
  );
}

/** 정점 `n` 개를 하나의 방향 사이클로 잇는다. 간선 `n` 개이고 모든 쌍이 서로 도달한다. */
export function cycle(n: number): Edge[] {
  return Array.from(
    { length: n },
    (_, i) => [i, (i + 1) % n, (i % 9) + 1] as Edge,
  );
}

/**
 * 정점 `n` 개의 순서쌍을 `t -> (t × 7919) mod n(n-1)` 순서로 `e` 개 고른다.
 *
 * 7919 는 소수이고 `n(n-1)` 과 서로소인 `n` 만 쓴다. 가중치는 `pot` 을 써서 어떤 사이클의 합도 1
 * 이상이 되게 만든다 — 음수 간선은 있고 음수 사이클은 없다.
 */
export function scatter(n: number, e: number): Edge[] {
  const m = n * (n - 1);
  const pot = (v: number): number => (v * 13) % 50;
  const out: Edge[] = [];
  for (let i = 0; i < e; i++) {
    const s = (i * 7919) % m;
    const u = Math.floor(s / (n - 1));
    let v = s % (n - 1);
    if (v >= u) v += 1;
    out.push([u, v, ((i * 37) % 100) + 1 + pot(u) - pot(v)]);
  }
  return out;
}

/**
 * 정점 `0` 과 나머지 전부를 양방향으로 잇는다. 간선 `2(n-1)` 개다.
 *
 * 어느 정점에서든 `0` 을 한 번 거쳐 아무 정점에나 갈 수 있으므로 **모든 쌍이 서로 도달**하고, 게다가
 * 첫 라운드(`k = 0`)부터 건너뛰는 행이 없다. 간선이 가장 적으면서 기본 연산을 최대로 만드는 모양이다.
 */
export function star(n: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < n; i++) {
    out.push([0, i, (i % 9) + 1]);
    out.push([i, 0, (i % 7) + 1]);
  }
  return out;
}

/** 모든 순서쌍에 간선을 둔다. 간선 `n(n-1)` 개다. */
export function dense(n: number): Edge[] {
  return scatter(n, n * (n - 1));
}

/* ────────────────────────── 적는 법 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록 한 벌 — 칸마다 폭을 값에서 재서 맞춘다. */
function fence(rows: string[][]): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((x, c) => pad(x, widths[c] ?? 0))
      .join("  ")
      .trimEnd(),
  );
}

/** 마크다운 표 — 머리줄 · 구분줄 · 몸통. `right` 열은 오른쪽 맞춤이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const lineOf = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [lineOf(head), lineOf(rule), ...rows.map(lineOf)].join("\n");
}

/** `12,345` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
export const cell = (v: number): string => (v === INF ? "INF" : String(v));

/** 행 하나를 `0 3 1 4 INF` 꼴로 적는다. */
export const rowText = (row: readonly number[]): string =>
  row.map(cell).join(" ");

/** 더하는 수가 음수면 괄호를 친다 — `1 + (-2)`. */
export const plus = (v: number): string => (v < 0 ? `(${v})` : cell(v));

/** 칸 이름 — `(3, 0)`. */
export const at = (u: number, v: number): string => `(${u}, ${v})`;

/** 간선 하나를 `0 → 1 (3)` 꼴로. */
export const arrow = ([u, v, w]: Edge): string => `${u} → ${v} (${w})`;

/** 두 거리 행렬이 칸마다 같은가. */
export function 같은가(a: number[][], b: number[][]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) =>
      row.every((v, j) => v === ((b[i] as number[])[j] as number)),
    )
  );
}

/** 두 거리 행렬이 다른 칸의 수. */
export function 다른칸(a: number[][], b: number[][]): number {
  let wrong = 0;
  for (let u = 0; u < a.length; u++) {
    for (let v = 0; v < (a[u] as number[]).length; v++) {
      if ((a[u] as number[])[v] !== (b[u] as number[])[v]) wrong++;
    }
  }
  return wrong;
}

/** 시작 거리 행렬 — 대각선 0, 간선 칸에는 같은 방향 간선 중 가장 작은 가중치, 나머지 `INF`. */
export function startMatrix(n: number, edges: Edge[]): number[][] {
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, w] of edges) {
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  return dist;
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 라운드 하나가 고친 칸 — 고치기 전 값과 두 토막. */
export interface Fix {
  u: number;
  v: number;
  /** `dist[u][k]` */
  a: number;
  /** `dist[k][v]` */
  b: number;
  before: number;
  value: number;
}

/** 라운드 하나(경유 정점 `k` 하나)의 기록. */
export interface Round {
  k: number;
  /** 이 라운드에 고친 칸. */
  changed: Fix[];
  /** `u` 에서 `k` 로 가는 길이 없어 건너뛴 행. */
  skipped: number[];
  /** 이 라운드가 비교한 경유 후보의 수. */
  checks: number;
  /** 이 라운드의 기본 연산 — 행 판정 `V` 번 + 후보 비교. */
  ops: number;
  /** 이 라운드가 끝난 시점의 거리 행렬. */
  snapshot: number[][];
}

export interface Counted {
  dist: number[][];
  start: number[][];
  rounds: Round[];
  /** 거리 행렬 칸을 채운 횟수. */
  cells: number;
  /** 간선을 읽어 옮겨 적은 횟수. */
  copies: number;
  /** 행을 건너뛸지 판정한 횟수. */
  skipChecks: number;
  /** 경유 후보 하나를 비교한 총 횟수. */
  checks: number;
  /** 위 넷을 더한 기본 연산. */
  ops: number;
}

/** 정본과 같은 절차에 세는 자리와 기록만 덧붙인 사본. **작은 입력에만** 부른다. */
export function counted(n: number, edges: Edge[]): Counted {
  let cells = 0;
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      cells++;
      return u === v ? 0 : INF;
    }),
  );
  let copies = 0;
  for (const [u, v, w] of edges) {
    copies++;
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  const start = dist.map((r) => r.slice());
  const rounds: Round[] = [];
  let skipChecks = 0;
  let checks = 0;
  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    const changed: Fix[] = [];
    const skipped: number[] = [];
    const before = checks;
    for (let u = 0; u < n; u++) {
      skipChecks++;
      const row = dist[u] as number[];
      const toK = row[k] as number;
      if (toK === INF) {
        skipped.push(u);
        continue;
      }
      for (let v = 0; v < n; v++) {
        checks++;
        const through = toK + (viaK[v] as number);
        if (through < (row[v] as number)) {
          changed.push({
            u,
            v,
            a: toK,
            b: viaK[v] as number,
            before: row[v] as number,
            value: through,
          });
          row[v] = through;
        }
      }
    }
    rounds.push({
      k,
      changed,
      skipped,
      checks: checks - before,
      ops: n + checks - before,
      snapshot: dist.map((r) => r.slice()),
    });
  }
  return {
    dist,
    start,
    rounds,
    cells,
    copies,
    skipChecks,
    checks,
    ops: cells + copies + skipChecks + checks,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(
  n: number,
  edges: Edge[],
): { ops: number; checks: number } {
  let cells = 0;
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      cells++;
      return u === v ? 0 : INF;
    }),
  );
  let copies = 0;
  for (const [u, v, w] of edges) {
    copies++;
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  let skipChecks = 0;
  let checks = 0;
  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    for (let u = 0; u < n; u++) {
      skipChecks++;
      const row = dist[u] as number[];
      const toK = row[k] as number;
      if (toK === INF) continue;
      for (let v = 0; v < n; v++) {
        checks++;
        const through = toK + (viaK[v] as number);
        if (through < (row[v] as number)) row[v] = through;
      }
    }
  }
  return { ops: cells + copies + skipChecks + checks, checks };
}

/** ③ 을 뺀 판의 계수. 답은 정본과 같고 기본 연산만 늘어난다. */
export function countedNoSkip(
  n: number,
  edges: Edge[],
): { ops: number; checks: number } {
  let cells = 0;
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      cells++;
      return u === v ? 0 : INF;
    }),
  );
  let copies = 0;
  for (const [u, v, w] of edges) {
    copies++;
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  let skipChecks = 0;
  let checks = 0;
  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    for (let u = 0; u < n; u++) {
      skipChecks++;
      const row = dist[u] as number[];
      const toK = row[k] as number;
      for (let v = 0; v < n; v++) {
        checks++;
        const through = toK + (viaK[v] as number);
        if (through < (row[v] as number)) row[v] = through;
      }
    }
  }
  return { ops: cells + copies + skipChecks + checks, checks };
}

/**
 * 출발점마다 벨만-포드를 한 번씩 실행하는 방법. 라운드가 한 칸도 못 고치면 그 출발점을 끝낸다.
 *
 * 기본 연산은 거리 배열 한 칸을 채운 한 번과 간선 하나를 읽은 한 번을 각각 하나로 센다 — 위 사본과
 * 같은 기준이다.
 */
export function bellmanPerSource(
  n: number,
  edges: Edge[],
): { dist: number[][]; ops: number } {
  let ops = 0;
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    const d = new Array<number>(n).fill(INF);
    ops += n;
    d[s] = 0;
    for (let round = 0; round < n - 1; round++) {
      let changed = false;
      for (const [u, v, w] of edges) {
        ops++;
        if ((d[u] as number) + w < (d[v] as number)) {
          d[v] = (d[u] as number) + w;
          changed = true;
        }
      }
      if (!changed) break;
    }
    out.push(d);
  }
  return { dist: out, ops };
}

/**
 * 모든 쌍을 거리 행렬 하나에 담고 경유를 **한 번만** 허용하는 방법 — 간선 두 개짜리 길까지만 본다.
 * 「경유를 허용한다」의 가장 단순한 후보다.
 */
export function oneRound(n: number, edges: Edge[]): number[][] {
  const base = startMatrix(n, edges);
  return base.map((row, u) =>
    row.map((cur, v) => {
      let best = cur;
      for (let k = 0; k < n; k++) {
        const t =
          ((base[u] as number[])[k] as number) +
          ((base[k] as number[])[v] as number);
        if (t < best) best = t;
      }
      return best;
    }),
  );
}

/**
 * 경유 **횟수**를 배로 늘려 가는 방법 — 거리 행렬끼리의 (min, +) 곱을 되풀이 제곱한다. 곱 한 번이
 * 「간선 `m` 개 이하 경로」를 「간선 `2m` 개 이하 경로」로 넓힌다.
 */
export function doubling(
  n: number,
  edges: Edge[],
): { dist: number[][]; ops: number; products: number } {
  let ops = 0;
  let cur: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      ops++;
      return u === v ? 0 : INF;
    }),
  );
  for (const [u, v, w] of edges) {
    ops++;
    const row = cur[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  let products = 0;
  for (let reach = 1; reach < Math.max(1, n - 1); reach *= 2) {
    products++;
    const next: number[][] = Array.from({ length: n }, () =>
      new Array<number>(n).fill(INF),
    );
    for (let u = 0; u < n; u++) {
      const src = cur[u] as number[];
      const dst = next[u] as number[];
      for (let k = 0; k < n; k++) {
        ops++;
        const via = src[k] as number;
        if (via === INF) continue;
        const mid = cur[k] as number[];
        for (let v = 0; v < n; v++) {
          ops++;
          const t = via + (mid[v] as number);
          if (t < (dst[v] as number)) dst[v] = t;
        }
      }
    }
    cur = next;
  }
  return { dist: cur, ops, products };
}

/**
 * 반복문 순서를 바꾼 판 — 경유 정점 `k` 를 **가장 안쪽**에 둔다. 한 줄 변이로는 못 만드는 모양이라
 * 사본으로 둔다. 행 `u` 하나를 끝낼 때마다 거리 행렬과 그 행에서 고친 칸을 남긴다.
 */
export function kInnermost(
  n: number,
  edges: Edge[],
): {
  dist: number[][];
  rows: { u: number; fixed: number[]; snapshot: number[][] }[];
} {
  const dist = startMatrix(n, edges);
  const rows: { u: number; fixed: number[]; snapshot: number[][] }[] = [];
  for (let u = 0; u < n; u++) {
    const row = dist[u] as number[];
    const fixed: number[] = [];
    for (let v = 0; v < n; v++) {
      for (let k = 0; k < n; k++) {
        const through =
          (row[k] as number) + ((dist[k] as number[])[v] as number);
        if (through < (row[v] as number)) {
          row[v] = through;
          if (!fixed.includes(v)) fixed.push(v);
        }
      }
    }
    rows.push({ u, fixed, snapshot: dist.map((r) => r.slice()) });
  }
  return { dist, rows };
}

/**
 * 거리 행렬을 둘 두고 번갈아 쓰는 판 — 라운드 `k` 는 앞 라운드의 행렬만 읽고 새 행렬에 적는다. 식을
 * 그대로 옮긴 모양이라, 제자리에서 고치는 정본과 답이 같은지 대조하는 데 쓴다.
 */
export function twoMatrix(
  n: number,
  edges: Edge[],
): { dist: number[][]; cells: number } {
  let cur = startMatrix(n, edges);
  for (let k = 0; k < n; k++) {
    const next = cur.map((r) => r.slice());
    for (let u = 0; u < n; u++) {
      const toK = (cur[u] as number[])[k] as number;
      if (toK === INF) continue;
      for (let v = 0; v < n; v++) {
        const t = toK + ((cur[k] as number[])[v] as number);
        if (t < ((next[u] as number[])[v] as number)) {
          (next[u] as number[])[v] = t;
        }
      }
    }
    cur = next;
  }
  return { dist: cur, cells: 2 * n * n };
}

/**
 * 정의대로 계산한 `opt_k(u, v)` — 번호가 `k` 이하인 정점만 중간에 쓰는 최단 비용.
 *
 * 절차를 쓰지 않고 **단순 경로를 전부 만들어** 최솟값을 고른다. 층과 불변식 대조의 기준이라 절차와
 * 다른 길로 얻어야 뜻이 있다. `k = -1` 이면 중간 정점을 하나도 쓰지 않는다.
 */
export function byDefinition(n: number, edges: Edge[], k: number): number[][] {
  const w = startMatrix(n, edges);
  const out: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (let s = 0; s < n; s++) {
    const seen = new Array<boolean>(n).fill(false);
    seen[s] = true;
    const walk = (at0: number, cost: number): void => {
      for (let nx = 0; nx < n; nx++) {
        if (seen[nx]) continue;
        const e = (w[at0] as number[])[nx] as number;
        if (e === INF) continue;
        const asEnd = cost + e;
        if (asEnd < ((out[s] as number[])[nx] as number)) {
          (out[s] as number[])[nx] = asEnd;
        }
        // `nx` 가 끝점이 아니면 중간 정점이 된다 — 번호가 `k` 이하여야 쓸 수 있다.
        if (nx > k) continue;
        seen[nx] = true;
        walk(nx, asEnd);
        seen[nx] = false;
      }
    };
    walk(s, 0);
  }
  return out;
}

/** `s` 에서 `t` 로 가는 단순 경로 전부 — 정점 차례와 비용. 같은 방향 간선은 작은 가중치를 쓴다. */
export function simplePaths(
  n: number,
  edges: Edge[],
  s: number,
  t: number,
): { path: number[]; cost: number }[] {
  const w = startMatrix(n, edges);
  const out: { path: number[]; cost: number }[] = [];
  const seen = new Array<boolean>(n).fill(false);
  const path = [s];
  seen[s] = true;
  const go = (x: number, cost: number): void => {
    if (x === t && path.length > 1) {
      out.push({ path: path.slice(), cost });
      return;
    }
    for (let nx = 0; nx < n; nx++) {
      if (seen[nx]) continue;
      const e = (w[x] as number[])[nx] as number;
      if (e === INF) continue;
      seen[nx] = true;
      path.push(nx);
      go(nx, cost + e);
      path.pop();
      seen[nx] = false;
    }
  };
  go(s, 0);
  return out;
}

/** 간선을 `m` 개 이하로 쓰는 경로의 최단 비용 — 모든 쌍. 벨만-포드의 층을 출발점마다 쌓은 것이다. */
export function edgeLimited(n: number, edges: Edge[], m: number): number[][] {
  let cur: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (let step = 0; step < m; step++) {
    const next = cur.map((r) => r.slice());
    for (let s = 0; s < n; s++) {
      for (const [u, v, w] of edges) {
        const d = (cur[s] as number[])[u] as number;
        if (d === INF) continue;
        if (d + w < ((next[s] as number[])[v] as number)) {
          (next[s] as number[])[v] = d + w;
        }
      }
    }
    cur = next;
  }
  return cur;
}

/** 단순 경로의 수를 정확히 센다 — 모든 순서쌍에 간선이 있는 그래프를 실제로 따라간다. */
function countPathsByWalk(n: number): number {
  let total = 0;
  const seen = new Array<boolean>(n).fill(false);
  // 모든 순서쌍에 간선이 있으니 아직 안 지난 정점이면 어디로든 한 걸음 더 갈 수 있다.
  const go = (): void => {
    for (let nx = 0; nx < n; nx++) {
      if (seen[nx]) continue;
      total++;
      seen[nx] = true;
      go();
      seen[nx] = false;
    }
  };
  for (let s = 0; s < n; s++) {
    seen[s] = true;
    go();
    seen[s] = false;
  }
  return total;
}

/**
 * 같은 그래프의 단순 경로 수를 식으로 낸다. 정점 쌍 하나의 단순 경로 수는
 * `Σ_{t=0..n-2} (n-2)!/(n-2-t)!` 이고, 쌍이 `n(n-1)` 개다. 배열에 안 들어가는 규모라 자릿수로 센다.
 */
export function pathDigits(n: number): number {
  let log10 = Math.log10(Math.E) + Math.log10(n) + Math.log10(n - 1);
  for (let i = 2; i <= n - 2; i++) log10 += Math.log10(i);
  return Math.floor(log10) + 1;
}

/** 위 식 그대로 — 작은 `n` 에서 실행한 수와 맞대어 식을 확인한다. */
export function pathCount(n: number): number {
  let total = 0;
  let term = 1;
  for (let t = 0; t <= n - 2; t++) {
    total += term;
    term *= n - 2 - t;
  }
  return total * n * (n - 1);
}

/**
 * 같은 세 겹 반복을 두 연산만 갈아 끼워 실행한다 — 잇기(`join`)와 고르기(`better`).
 * `(min, +)` 면 정본과 같은 최단 거리가 나온다.
 */
export function closure<T>(
  n: number,
  edges: Edge[],
  none: T,
  self: T,
  edgeValue: (w: number) => T,
  join: (a: T, b: T) => T,
  better: (cand: T, cur: T) => boolean,
): T[][] {
  const d: T[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? self : none)),
  );
  for (const [u, v, w] of edges) {
    const e = edgeValue(w);
    if (better(e, (d[u] as T[])[v] as T)) (d[u] as T[])[v] = e;
  }
  for (let k = 0; k < n; k++) {
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        const c = join((d[u] as T[])[k] as T, (d[k] as T[])[v] as T);
        if (better(c, (d[u] as T[])[v] as T)) (d[u] as T[])[v] = c;
      }
    }
  }
  return d;
}

/* ────────────────────── 사본이 정본과 같은가 ────────────────────── */

const 대조입력: { n: number; edges: Edge[] }[] = [
  { n: WALK_N, edges: WALK_EDGES },
  { n: 1, edges: [] },
  { n: 4, edges: [] },
  { n: 6, edges: line(6) },
  { n: 6, edges: cycle(6) },
  { n: 9, edges: scatter(9, 20) },
  { n: 12, edges: dense(12) },
];

function 자기대조(): void {
  for (const { n, edges } of 대조입력) {
    const want = floydWarshall(n, edges);
    if (!같은가(counted(n, edges).dist, want)) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (!같은가(bellmanPerSource(n, edges).dist, want)) {
      throw new Error("출발점마다 벨만-포드를 실행한 사본이 다른 답을 낸다");
    }
    if (!같은가(doubling(n, edges).dist, want)) {
      throw new Error("경유 횟수를 배로 늘리는 사본이 다른 답을 낸다");
    }
    if (!같은가(twoMatrix(n, edges).dist, want)) {
      throw new Error("거리 행렬 둘을 번갈아 쓰는 사본이 다른 답을 낸다");
    }
    // 정의대로 계산하는 쪽은 단순 경로를 전부 만든다 — 모든 순서쌍에 간선이 있는 정점 12 개면 경로가
    // 억 단위라 그 입력만 뺀다(`naiveScale` 이 그 수를 보인다).
    if (
      edges.length < n * (n - 1) &&
      !같은가(byDefinition(n, edges, n - 1), want)
    ) {
      throw new Error("정의대로 계산한 값이 정본과 다르다");
    }
    const minPlus = closure<number>(
      n,
      edges,
      INF,
      0,
      (w) => w,
      (a, b) => a + b,
      (c, cur) => c < cur,
    );
    if (!같은가(minPlus, want)) {
      throw new Error("(min, +) 로 부른 세 겹 반복이 정본과 다르다");
    }
    // 음수 사이클이 없다는 것을 대각선으로 확인한다.
    for (let v = 0; v < n; v++) {
      if ((want[v] as number[])[v] !== 0) {
        throw new Error(`음수 사이클이 있는 입력이다 — dist[${v}][${v}] < 0`);
      }
    }
  }
  for (const n of [3, 4, 5]) {
    if (countPathsByWalk(n) !== pathCount(n)) {
      throw new Error(`정점 ${n} 에서 단순 경로 수의 식이 실행과 다르다`);
    }
  }
  const c = counted(WALK_N, WALK_EDGES);
  if (c.checks !== c.rounds.reduce((t, r) => t + r.checks, 0)) {
    throw new Error("라운드별 후보 비교의 합이 총 후보 비교와 다르다");
  }
  if (countedNoSkip(WALK_N, WALK_EDGES).checks !== WALK_N ** 3) {
    throw new Error("③ 을 뺀 판의 후보 비교가 V^3 이 아니다");
  }
  if (countedLite(WALK_N, WALK_EDGES).ops !== c.ops) {
    throw new Error("기록 없이 세는 사본이 기록하는 사본과 다른 수를 낸다");
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./floydWarshall-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  floydWarshall(n: number, edges: Edge[]): number[][];
}

/** ③ — `u` 에서 `k` 로 못 가는 행을 건너뛰는 줄을 뺀 사본. */
const noSkip = await loadMutant<Impl>(REF, {
  drop: /if \(toK === INF\) continue;/,
});

/** **불변식을 지키던 줄** — 마지막 정점을 경유 후보에서 뺀 사본. */
const shortK = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let k = 0; k < n; k\+\+\) \{/,
    "for (let k = 0; k < n - 1; k++) {",
  ],
});

const 변이입력: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력 (정점 5)", n: WALK_N, edges: WALK_EDGES },
  { label: "한 줄 그래프 (정점 6)", n: 6, edges: line(6) },
  { label: "사이클 그래프 (정점 6)", n: 6, edges: cycle(6) },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가 **같은
 * 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof` 의 중화 대조가
 * 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noSkip.floydWarshall === floydWarshall;

if (!중화됨) {
  // ③ 을 뺀 판은 어느 입력에서도 답을 안 바꿔야 한다 — 그 절의 주장이 그것이다.
  for (const { n, edges } of 변이입력) {
    if (!같은가(floydWarshall(n, edges), noSkip.floydWarshall(n, edges))) {
      throw new Error("③ 을 뺀 변이가 답을 바꿨다 — 그 절의 주장과 다르다");
    }
  }
  // 마지막 정점을 뺀 판은 적어도 한 입력에서 답을 바꿔야 한다.
  if (
    변이입력.every((c) =>
      같은가(floydWarshall(c.n, c.edges), shortK.floydWarshall(c.n, c.edges)),
    )
  ) {
    throw new Error(
      "마지막 경유 정점을 뺀 변이가 어느 입력에서도 답을 안 바꿨다",
    );
  }
}

/* ────────────────────────── 전개 ────────────────────────── */

/** 전개의 기록 — 한 번만 실행해 두고 블록들이 함께 읽는다. */
export const WALK = counted(WALK_N, WALK_EDGES);

/** 전개의 걸음 — T1 이 준비, 라운드 하나가 걸음 하나, 마지막이 반환. */
export const WALK_STEPS = WALK.rounds.length + 2;

/** 행렬 하나를 마크다운 표로 — 행이 출발 정점 `u`, 열이 도착 정점 `v`. */
function matrixMd(m: number[][]): string {
  return md(
    ["출발 u", ...m.map((_, v) => `v = ${v}`)],
    m.map((row, u) => [`u = ${u}`, ...row.map(cell)]),
    m.map((_, v) => v + 1),
  );
}

/** 행렬 하나를 등폭 블록으로. */
function matrixFence(m: number[][]): string[] {
  return fence([
    ["", ...m.map((_, v) => `v=${v}`)],
    ...m.map((row, u) => [`u=${u}`, ...row.map(cell)]),
  ]);
}

/** 고친 칸 하나를 `(3, 0) = -1 + 5 = 4` 꼴로. */
const fixText = (f: Fix): string =>
  `${at(f.u, f.v)} = ${cell(f.a)} + ${plus(f.b)} = ${f.value}`;

/** 음수 사이클이 있으면 대각선이 음수로 남는다 — 그 행렬의 대각선. */
const diag = (m: number[][]): number[] => m.map((r, v) => r[v] as number);

/** 순서가 뒤집히는 간선 수 — `crossing()` 은 부를 때마다 이분 탐색을 다시 하므로 한 번만 부른다. */
let crossMemo: { last: number; first: number } | null = null;
const crossOnce = (): { last: number; first: number } => {
  crossMemo ??= crossing();
  return crossMemo;
};

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** concept — 라운드마다 고친 칸. */
  conceptRounds: () => {
    const rows = WALK.rounds.map((r) => [
      String(r.k),
      Array.from({ length: r.k + 1 }, (_, i) => i).join(" · "),
      r.changed.length === 0
        ? "없음"
        : r.changed.map((f) => `${at(f.u, f.v)} → ${f.value}`).join(" · "),
    ]);
    const fixed = WALK.rounds.reduce((t, r) => t + r.changed.length, 0);
    const idle = WALK.rounds.filter((r) => r.changed.length === 0);
    return [
      md(["라운드 k", "중간에 쓸 수 있는 정점", "고친 칸"], rows, [0]),
      "",
      `라운드 ${WALK.rounds.length} 번이 고친 칸은 모두 ${fixed} 개이고, 한 칸도 못 고친 라운드는 ${idle.map((r) => r.k).join(" · ")} 입니다. 마지막 라운드가 끝난 거리 행렬은 정본이 돌려준 답과 ${같은가(WALK.dist, floydWarshall(WALK_N, WALK_EDGES)) ? "칸마다 같습니다" : "다릅니다"}.`,
    ].join("\n");
  },

  /** deep.origin ② — 경로를 전부 나열하면 몇 개인가. */
  naiveScale: () => {
    const rows = [4, 6, 8].map((n) => [
      String(n),
      comma(n * (n - 1)),
      comma(countPathsByWalk(n)),
      "실행",
    ]);
    rows.push(["10", comma(90), comma(pathCount(10)), "식"]);
    rows.push([
      comma(V_LIMIT),
      comma(E_LIMIT),
      `${comma(pathDigits(V_LIMIT))} 자리 수`,
      "식",
    ]);
    return [
      md(
        ["정점 V", "간선 E", "단순 경로 수 (모든 쌍)", "센 방법"],
        rows,
        [0, 1],
      ),
      "",
      `간선은 모든 순서쌍에 하나씩 둔 그래프입니다. 정점 4 · 6 · 8 은 경로를 실제로 따라가 셌고, 같은 수를 낸 식으로 정점 10${과와(10)} ${comma(V_LIMIT)}${을를(comma(V_LIMIT))} 셌습니다.`,
    ].join("\n");
  },

  /** deep.origin ② — 출발점마다 벨만-포드를 실행하면 기본 연산이 몇 번인가. */
  perSource: () => {
    const rows = [10, 50, 200, V_LIMIT].map((n) => {
      const e = n * (n - 1);
      const got = bellmanPerSource(n, dense(n)).ops;
      const bound = n * (n + (n - 1) * e);
      return [comma(n), comma(e), comma(got), comma(bound)];
    });
    const last = rows.at(-1) as string[];
    return [
      md(
        ["정점 V", "간선 E", "실행한 기본 연산", "라운드를 다 채운 상한"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `정점 ${comma(V_LIMIT)} 에서 실행한 기본 연산은 ${last[2]} 번이고, 출발점마다 라운드를 V − 1 번 다 채우는 입력이면 ${last[3]} 번입니다.`,
    ].join("\n");
  },

  /** deep.origin ③ — 출발점마다 다시 계산하면 같은 간선을 몇 번 다시 읽는가. */
  repeatObserved: () => {
    const n = WALK_N;
    const per = new Map<string, number>();
    const win = new Map<string, number>();
    for (let s = 0; s < n; s++) {
      const d = new Array<number>(n).fill(INF);
      d[s] = 0;
      for (let round = 0; round < n - 1; round++) {
        let changed = false;
        for (const e of WALK_EDGES) {
          const [u, v, w] = e;
          const key = arrow(e);
          per.set(key, (per.get(key) ?? 0) + 1);
          if ((d[u] as number) + w < (d[v] as number)) {
            d[v] = (d[u] as number) + w;
            win.set(key, (win.get(key) ?? 0) + 1);
            changed = true;
          }
        }
        if (!changed) break;
      }
    }
    const rows = [...per.entries()].map(([key, seen]) => [
      key,
      comma(seen),
      comma(win.get(key) ?? 0),
      comma(seen - (win.get(key) ?? 0)),
    ]);
    const seenAll = [...per.values()].reduce((a, b) => a + b, 0);
    const winAll = [...win.values()].reduce((a, b) => a + b, 0);
    return [
      md(
        ["간선", "읽은 횟수", "값을 고친 횟수", "못 고친 횟수"],
        rows,
        [1, 2, 3],
      ),
      "",
      `출발점 ${n} 개를 따로 계산하면 간선을 모두 ${comma(seenAll)} 번 읽고, 그중 값을 고친 것은 ${comma(winAll)} 번입니다.`,
    ].join("\n");
  },

  /** deep.origin ④ — 같은 입력을 두 방식으로 처리했을 때의 기본 연산. */
  twoWays: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 그래프", 20, cycle(20)],
      ["성긴 그래프", 60, scatter(60, 180)],
      ["촘촘한 그래프", 60, dense(60)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const want = floydWarshall(n, edges);
      const per = bellmanPerSource(n, edges);
      if (!같은가(per.dist, want)) {
        throw new Error(`${label} 에서 두 방식의 답이 다르다`);
      }
      const b = countedLite(n, edges).ops;
      return [
        label,
        comma(n),
        comma(edges.length),
        comma(per.ops),
        comma(b),
        per.ops < b ? "출발점마다" : "함께 채우기",
      ];
    });
    return [
      md(
        [
          "입력",
          "정점",
          "간선",
          "출발점마다 벨만-포드",
          "거리 행렬 하나를 함께 채우기",
          "적은 쪽",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `${cases.length} 개 입력 모두에서 두 방식이 낸 거리 행렬은 칸마다 같습니다.`,
    ].join("\n");
  },

  /** deep.origin ⑤ — 경유를 한 번만 허용하면 어디서 틀리는가. */
  oneRoundCheck: () => {
    const want = floydWarshall(WALK_N, WALK_EDGES);
    const got = oneRound(WALK_N, WALK_EDGES);
    const rows = got.map((row, u) => [
      String(u),
      rowText(row),
      rowText(want[u] as number[]),
      같은가([row], [want[u] as number[]]) ? "같다" : "다르다",
    ]);
    const wrong: string[] = [];
    for (let u = 0; u < WALK_N; u++) {
      for (let v = 0; v < WALK_N; v++) {
        const a = (got[u] as number[])[v] as number;
        const b = (want[u] as number[])[v] as number;
        if (a !== b) wrong.push(`${at(u, v)} ${cell(a)} → ${cell(b)}`);
      }
    }
    return [
      md(
        ["출발 u", "경유를 한 번만 허용한 행", "정본의 행", "비교"],
        rows,
        [0],
      ),
      "",
      `다른 칸은 ${wrong.length} 개이고, 칸마다 경유를 한 번만 허용한 값 → 정본의 값은 ${wrong.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** deep.origin ⑤ — 넓히는 축 둘을 같은 입력에서 잰다. */
  widenWays: () => {
    const sizes = [8, 16, 32, 64, 128];
    const rows = sizes.map((n) => {
      const edges = dense(n);
      const d = doubling(n, edges);
      if (!같은가(d.dist, floydWarshall(n, edges))) {
        throw new Error(`정점 ${n} 에서 두 축의 답이 다르다`);
      }
      const f = countedLite(n, edges);
      return [
        comma(n),
        comma(d.products),
        comma(d.ops),
        comma(f.ops),
        `${(d.ops / f.ops).toFixed(2)} 배`,
      ];
    });
    return [
      md(
        [
          "정점 V",
          "거리 행렬 곱",
          "경유 횟수를 배로 늘리기",
          "경유 정점 번호를 하나씩 넓히기",
          "앞의 것 ÷ 뒤의 것",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `간선은 모든 순서쌍에 둔 그래프이고, ${sizes.length} 개 규모 모두에서 두 방법이 낸 거리 행렬은 칸마다 같습니다.`,
    ].join("\n");
  },

  /** deep.build 낯선 개념 — 층마다 값이 있는 칸과 줄어든 칸. */
  layerChanges: () => {
    const answer = floydWarshall(WALK_N, WALK_EDGES);
    let prev: number[][] | null = null;
    const rows: string[][] = [];
    for (let k = -1; k < WALK_N; k++) {
      const cur = byDefinition(WALK_N, WALK_EDGES, k);
      let finite = 0;
      let lower = 0;
      for (let u = 0; u < WALK_N; u++) {
        for (let v = 0; v < WALK_N; v++) {
          const x = (cur[u] as number[])[v] as number;
          if (x !== INF) finite++;
          if (prev && x < ((prev[u] as number[])[v] as number)) lower++;
        }
      }
      rows.push([
        String(k),
        k < 0 ? "없음" : Array.from({ length: k + 1 }, (_, i) => i).join(" · "),
        String(finite),
        prev ? String(lower) : "—",
      ]);
      prev = cur;
    }
    const last = byDefinition(WALK_N, WALK_EDGES, WALK_N - 1);
    return [
      md(
        [
          "층 k",
          "중간에 쓸 수 있는 정점",
          "값이 있는 칸",
          "앞 층보다 줄어든 칸",
        ],
        rows,
        [0, 2, 3],
      ),
      "",
      `층 ${WALK_N - 1}${은는(WALK_N - 1)} 정본이 돌려준 답과 ${WALK_N * WALK_N} 칸 가운데 ${WALK_N * WALK_N - 다른칸(last, answer)} 칸이 같습니다.`,
    ].join("\n");
  },

  /** deep.build 낯선 개념 — 칸 (2, 1) 하나를 이름에서 경로까지 따라간다. */
  layerRead: () => {
    const [s, t] = [2, 1];
    const paths = simplePaths(WALK_N, WALK_EDGES, s, t);
    const rows = paths.map(({ path, cost }) => {
      const mids = path.slice(1, -1);
      const top = mids.length === 0 ? -1 : Math.max(...mids);
      return [
        path.join("→"),
        mids.length === 0 ? "없음" : mids.join(" · "),
        String(cost),
        `층 ${top} 부터`,
      ];
    });
    const values = Array.from({ length: WALK_N + 1 }, (_, i) => {
      const k = i - 1;
      return `층 ${k} ${cell((byDefinition(WALK_N, WALK_EDGES, k)[s] as number[])[t] as number)}`;
    });
    return [
      md(["경로", "중간 정점", "비용", "후보에 드는 층"], rows, [2]),
      "",
      `정의대로 계산한 opt_k(${s}, ${t}) 의 값은 ${values.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** deep.build 낯선 개념 — 층 k 의 칸 하나를 층 k−1 에서 만든다. */
  layerStep: () => {
    const [u, v, k] = [3, 0, 2];
    const prev = byDefinition(WALK_N, WALK_EDGES, k - 1);
    const cur = byDefinition(WALK_N, WALK_EDGES, k);
    const keep = (prev[u] as number[])[v] as number;
    const a = (prev[u] as number[])[k] as number;
    const b = (prev[k] as number[])[v] as number;
    const best = Math.min(keep, a + b);
    return [
      md(
        ["후보", "식", "값"],
        [
          [
            `정점 ${k}${을를(k)} 안 쓴다`,
            `opt_${k - 1}(${u}, ${v})`,
            cell(keep),
          ],
          [
            `정점 ${k} 에서 끊는다`,
            `opt_${k - 1}(${u}, ${k}) + opt_${k - 1}(${k}, ${v})`,
            `${cell(a)} + ${plus(b)} = ${cell(a + b)}`,
          ],
        ],
      ),
      "",
      `두 후보 가운데 작은 값이 ${cell(best)} 이고, 정의대로 계산한 opt_${k}(${u}, ${v}) 도 ${cell((cur[u] as number[])[v] as number)} 입니다.`,
    ].join("\n");
  },

  /** deep.build 낯선 개념 — 간선 수로 자른 층과의 차이. */
  layerVsEdges: () => {
    const rows: string[][] = [];
    let example = "";
    let bigger = 0;
    for (let k = 0; k < WALK_N - 1; k++) {
      const byNum = byDefinition(WALK_N, WALK_EDGES, k);
      const byCount = edgeLimited(WALK_N, WALK_EDGES, k + 2);
      let diff = 0;
      let numLower = 0;
      for (let u = 0; u < WALK_N; u++) {
        for (let v = 0; v < WALK_N; v++) {
          const x = (byNum[u] as number[])[v] as number;
          const y = (byCount[u] as number[])[v] as number;
          if (x === y) continue;
          diff++;
          if (x < y) numLower++;
          if (!example) {
            example = `층 ${k} 에서 칸 ${at(u, v)}${은는(v)} ${cell(x)} 인데 간선 ${k + 2} 개 이하로 자른 값은 ${cell(y)} 입니다`;
          }
        }
      }
      bigger += numLower;
      rows.push([String(k), String(k + 2), String(diff), String(numLower)]);
    }
    return [
      md(
        ["층 k", "간선 수 한도", "값이 다른 칸", "층 k 쪽이 더 작은 칸"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `${example}. 층 k 쪽이 더 작은 칸은 ${rows.length} 줄을 합쳐 ${bigger} 개입니다.`,
    ].join("\n");
  },

  /** 1단계 — 거리 행렬을 층 −1 로 채운다. */
  stageStart: () => {
    const start = WALK.start;
    const layer = byDefinition(WALK_N, WALK_EDGES, -1);
    const finite = start.flat().filter((x) => x !== INF).length;
    const dup = WALK_EDGES.filter(([u, v]) => u === 0 && v === 1).map(
      ([, , w]) => w,
    );
    return [
      matrixMd(start),
      "",
      `값이 있는 칸은 ${finite} 개이고 나머지 ${WALK_N * WALK_N - finite} 칸은 INF 입니다. 간선 0 → 1 은 가중치 ${dup.join(" · ")} 로 둘이라 ${Math.min(...dup)} 만 남았고, 이 거리 행렬은 층 -1 과 ${WALK_N * WALK_N - 다른칸(start, layer)} 칸이 같습니다.`,
    ].join("\n");
  },

  /** 2단계 — 라운드 하나를 행마다. */
  stageRound: () => {
    const k = 2;
    const r = WALK.rounds[k] as Round;
    const before = (WALK.rounds[k - 1] as Round).snapshot;
    const rows = before.map((row, u) => {
      const toK = row[k] as number;
      if (toK === INF) {
        return [String(u), "INF", "건너뛴다", "—"];
      }
      const fixes = r.changed.filter((f) => f.u === u);
      return [
        String(u),
        cell(toK),
        "들어간다",
        fixes.length === 0
          ? "없음"
          : fixes.map((f) => `${fixText(f)} < ${cell(f.before)}`).join(" · "),
      ];
    });
    const onCross = r.changed.filter((f) => f.u === k || f.v === k).length;
    return [
      md([`행 u`, `dist[u][${k}]`, "그 행", "고친 칸"], rows, [0, 1]),
      "",
      `라운드 ${k}${은는(k)} 후보를 ${r.checks} 개 비교해 ${r.changed.length} 칸을 고쳤고, ${k} 행과 ${k} 열에서 고친 칸은 ${onCross} 개입니다.`,
    ].join("\n");
  },

  /** 3단계 — 라운드를 끝낼 때마다 층과 맞댄다. */
  stageRounds: () => {
    const answer = floydWarshall(WALK_N, WALK_EDGES);
    const rows = WALK.rounds.map((r) => {
      const layer = byDefinition(WALK_N, WALK_EDGES, r.k);
      return [
        String(r.k),
        String(r.changed.length),
        String(다른칸(r.snapshot, layer)),
        String(WALK_N * WALK_N - 다른칸(r.snapshot, answer)),
      ];
    });
    return [
      md(
        ["끝낸 라운드 k", "고친 칸", "층 k 와 다른 칸", "답과 같은 칸"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `칸은 ${WALK_N * WALK_N} 개입니다. 라운드 ${WALK_N - 1}${을를(WALK_N - 1)} 끝낸 거리 행렬이 정본이 돌려준 답입니다.`,
    ].join("\n");
  },

  /** 전제 — 음수 사이클이 있으면 대각선과 k 행·k 열이 어떻게 되는가. */
  premiseCycle: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      [
        NEG_EDGES.map(([u, v, w]) => `${u}→${v}(${w})`).join(" "),
        NEG_N,
        NEG_EDGES,
      ],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const c = counted(n, edges);
      const cross = c.rounds.reduce(
        (t, r) =>
          t + r.changed.filter((f) => f.u === r.k || f.v === r.k).length,
        0,
      );
      const d = floydWarshall(n, edges);
      return [
        label,
        diag(d).join(" · "),
        String(cross),
        diag(d).some((x) => x < 0) ? "있다" : "없다",
      ];
    });
    const d = floydWarshall(NEG_N, NEG_EDGES);
    return [
      md(
        [
          "입력",
          "반환한 대각선 dist[v][v]",
          "라운드 k 가 k 행·k 열에서 고친 칸",
          "음수 사이클",
        ],
        rows,
        [2],
      ),
      "",
      `음수 사이클 입력에서 정본이 돌려준 거리 행렬은 ${d.map((r) => `[${r.join(", ")}]`).join(" ")} 입니다.`,
    ].join("\n");
  },

  /** 설계 선택 — 거리 행렬 하나를 제자리에서 고쳐도 되는가. */
  inPlace: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["한 줄 그래프", 6, line(6)],
      ["사이클 그래프", 6, cycle(6)],
      ["성긴 그래프", 9, scatter(9, 20)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const two = twoMatrix(n, edges);
      const one = floydWarshall(n, edges);
      const cross = counted(n, edges).rounds.reduce(
        (t, r) =>
          t + r.changed.filter((f) => f.u === r.k || f.v === r.k).length,
        0,
      );
      return [
        label,
        comma(n),
        String(다른칸(two.dist, one)),
        String(cross),
        comma(two.cells),
        comma(n * n),
      ];
    });
    return [
      md(
        [
          "입력",
          "정점",
          "두 판의 답이 다른 칸",
          "라운드 k 가 k 행·k 열에서 고친 칸",
          "추가 칸 (둘)",
          "추가 칸 (하나)",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `정점 ${comma(V_LIMIT)} 에서는 추가 칸이 ${comma(2 * V_LIMIT * V_LIMIT)} 개 대 ${comma(V_LIMIT * V_LIMIT)} 개입니다.`,
    ].join("\n");
  },

  /** deep.walk 도입 — 고정 입력. */
  walkInput: () => {
    const d = floydWarshall(WALK_N, WALK_EDGES);
    const lit = (x: number): string => (x === INF ? "Infinity" : String(x));
    const pairs = WALK_EDGES.map(([u, v, w]) => `[${u}, ${v}, ${w}]`);
    return [
      `const n = ${WALK_N};`,
      "const edges: [number, number, number][] = [",
      `  ${pairs.slice(0, 4).join(", ")},`,
      `  ${pairs.slice(4).join(", ")},`,
      "];",
      "// 이 절이 끝나면 나와야 하는 값:",
      ...d.map((r) => `//   [${r.map(lit).join(", ")}]`),
    ].join("\n");
  },

  /** deep.walk 도입 — 이 그래프를 고른 이유를 값으로. */
  walkChoice: () => {
    const rows = WALK.rounds.map((r) => [
      String(r.k),
      String(r.changed.length),
      r.skipped.length === 0 ? "없음" : r.skipped.join(" · "),
      String(r.checks),
    ]);
    const idle = WALK.rounds.filter((r) => r.changed.length === 0).length;
    const skippy = WALK.rounds.filter((r) => r.skipped.length > 0).length;
    return [
      md(["라운드 k", "고친 칸", "건너뛴 행", "비교한 후보"], rows, [0, 1, 3]),
      "",
      `라운드 ${WALK.rounds.length} 번 가운데 ${WALK.rounds.length - idle} 번이 칸을 고치고 ${idle} 번은 한 칸도 못 고칩니다. 건너뛴 행이 있는 라운드가 ${skippy} 번입니다.`,
    ].join("\n");
  },

  /** T1 — 간선을 옮겨 적은 직후. */
  walkInit: () => matrixFence(WALK.start).join("\n"),

  /** T2 — 경유 정점 0 으로 한 라운드. */
  walkK0: () => {
    const r = WALK.rounds[0] as Round;
    return [
      ...matrixFence(r.snapshot),
      "",
      ...fence([
        ["건너뛴 행", r.skipped.map((u) => `u=${u}`).join(" ")],
        ["고친 칸", r.changed.map(fixText).join(" · ")],
        ["비교한 후보", String(r.checks)],
      ]),
    ].join("\n");
  },

  /** 짚고 가기 — 경유 정점을 가장 안쪽에 두면. */
  pauseLoopOrder: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력 (정점 5)", WALK_N, WALK_EDGES],
      ["한 줄 그래프 (정점 6)", 6, line(6)],
      ["사이클 그래프 (정점 6)", 6, cycle(6)],
      ["성긴 그래프 (정점 9 · 간선 20)", 9, scatter(9, 20)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const wrong = 다른칸(floydWarshall(n, edges), kInnermost(n, edges).dist);
      return [
        label,
        comma(n * n),
        comma(wrong),
        wrong === 0 ? "같다" : "다르다",
      ];
    });
    const bad = rows.filter((r) => r[3] === "다르다").length;
    return [
      md(["입력", "칸 수", "k 를 안쪽에 둔 판과 다른 칸", "답"], rows, [1, 2]),
      "",
      `입력 ${rows.length} 개 가운데 답이 다른 것은 ${bad} 개입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 어느 칸이 어떻게 다른가. */
  pauseLoopOrderCells: () => {
    const n = 6;
    const edges = cycle(n);
    const want = floydWarshall(n, edges);
    const got = kInnermost(n, edges).dist;
    const rows: string[][] = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        const a = (want[u] as number[])[v] as number;
        const b = (got[u] as number[])[v] as number;
        if (a !== b) rows.push([at(u, v), cell(a), cell(b)]);
      }
    }
    return [
      md(["칸", "정본", "k 를 안쪽에 둔 판"], rows, [1, 2]),
      "",
      `사이클 그래프의 간선은 ${edges.map(([u, v, w]) => `${u}→${v}(${w})`).join(" ")} 입니다.`,
    ].join("\n");
  },

  /** T3~T6 — 남은 네 라운드가 고친 칸. */
  walkRounds: () => {
    const rows = WALK.rounds
      .slice(1)
      .map((r, i) => [
        `T${i + 3}`,
        String(r.k),
        r.changed.length === 0 ? "없음" : r.changed.map(fixText).join(" · "),
        String(r.checks),
      ]);
    return [
      md(["걸음", "라운드 k", "고친 칸", "비교한 후보"], rows, [1, 3]),
      "",
      `T6 이 끝난 거리 행렬은 ${WALK.dist.map((r) => `[${rowText(r)}]`).join(" ")} 입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — ③ 을 빼도 답이 안 바뀐다. */
  pauseSkipRow: () => {
    const rows = 변이입력.map(({ label, n, edges }) => {
      const want = floydWarshall(n, edges);
      const got = noSkip.floydWarshall(n, edges);
      return [
        label,
        rowText(want[0] as number[]),
        rowText(got[0] as number[]),
        같은가(want, got) ? "같다" : "다르다",
      ];
    });
    return md(
      ["입력", "정본의 dist[0]", "③ 을 뺀 판의 dist[0]", "거리 행렬 전체"],
      rows,
    );
  },

  /** 짚고 가기 — 답은 같은데 기본 연산이 갈린다. */
  pauseSkipRowScale: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["한 줄 그래프", 60, line(60)],
      ["성긴 그래프", 60, scatter(60, 180)],
      ["사이클 그래프", 60, cycle(60)],
      ["별 모양", 60, star(60)],
      ["촘촘한 그래프", 60, dense(60)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      if (
        !중화됨 &&
        !같은가(floydWarshall(n, edges), noSkip.floydWarshall(n, edges))
      ) {
        throw new Error(`${label} 에서 ③ 을 뺀 판의 답이 갈렸다`);
      }
      const a = countedLite(n, edges).ops;
      const b = countedNoSkip(n, edges).ops;
      return [
        label,
        comma(n),
        comma(edges.length),
        comma(a),
        comma(b),
        (b / a).toFixed(2),
      ];
    });
    return [
      md(
        ["입력", "정점", "간선", "정본", "③ 을 뺀 판", "뒤 ÷ 앞"],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `기본 연산을 센 값이고, ${cases.length} 개 입력의 거리 행렬은 두 판에서 칸마다 같습니다.`,
    ].join("\n");
  },

  /** T1~T7 — 걸음마다 분기의 참·거짓. */
  walkTrace: () => {
    let acc = WALK.cells + WALK.copies;
    const rows: string[][] = [
      [
        "T1",
        "—",
        `① ${WALK.cells} 칸 · ② 간선 ${WALK.copies} 개`,
        "—",
        comma(acc),
      ],
    ];
    WALK.rounds.forEach((r, i) => {
      acc += r.ops;
      rows.push([
        `T${i + 2}`,
        String(r.k),
        r.skipped.length === 0
          ? "참인 행 없음"
          : `${r.skipped.map((u) => `dist[${u}][${r.k}]`).join(" · ")}${이가(r.k)} INF → **참**`,
        r.changed.length === 0
          ? "참인 칸 없음"
          : r.changed
              .map((f) => `${fixText(f)} < ${cell(f.before)}`)
              .join(" · "),
        comma(acc),
      ]);
    });
    rows.push([`T${WALK_STEPS}`, "—", "—", "—", comma(acc)]);
    return [
      md(
        [
          "걸음",
          "라운드 k",
          "③ `toK === INF`",
          "⑤ `through < row[v]`",
          "기본 연산 누적",
        ],
        rows,
        [4],
      ),
      "",
      `반환값은 ${WALK.dist.map((r) => `[${rowText(r)}]`).join(" ")} 입니다.`,
    ].join("\n");
  },

  /** 분기 피복 — 다섯 갈래가 세 입력에서 몇 번 실행됐는가. */
  branchCoverage: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["정점 하나 · 간선 없음", 1, []],
      ["사이클 그래프 (정점 4)", 4, cycle(4)],
    ];
    const measure = (n: number, edges: Edge[]): number[] => {
      const c = counted(n, edges);
      const skipped = c.rounds.reduce((t, r) => t + r.skipped.length, 0);
      const changed = c.rounds.reduce((t, r) => t + r.changed.length, 0);
      return [c.cells, c.copies, skipped, c.checks, changed];
    };
    const labels = [
      ["①", "거리 행렬의 칸을 하나 채운다"],
      ["②", "간선 하나를 읽어 옮겨 적는다"],
      ["③", "k 로 가는 길이 없는 행을 건너뛴다"],
      ["④", "k 를 경유하는 후보를 만든다"],
      ["⑤", "후보가 더 작아 칸을 고친다"],
    ];
    const measured = cases.map(([, n, edges]) => measure(n, edges));
    const zeroOnWalk = labels.filter(
      (_, i) => (measured[0] as number[])[i] === 0,
    );
    return [
      md(
        ["라벨", "갈래", ...cases.map(([label]) => label)],
        labels.map(([mark, what], i) => [
          mark as string,
          what as string,
          ...measured.map((m) => comma(m[i] as number)),
        ]),
        [2, 3, 4],
      ),
      "",
      `전개 입력에서 0 번인 갈래는 ${zeroOnWalk.length} 개입니다.`,
    ].join("\n");
  },

  /** deep.walk.final — 전체 코드를 실행한 결과. */
  walkResult: () => {
    const calls: [string, number, Edge[]][] = [
      ["floydWarshall(1, [])", 1, []],
      ["floydWarshall(3, [])", 3, []],
      [
        "floydWarshall(2, [[0, 1, 10], [0, 1, 3], [0, 1, 7]])",
        2,
        [
          [0, 1, 10],
          [0, 1, 3],
          [0, 1, 7],
        ],
      ],
      [
        "floydWarshall(3, [[0, 1, -1], [1, 2, -2]])",
        3,
        [
          [0, 1, -1],
          [1, 2, -2],
        ],
      ],
    ];
    const lit = (x: number): string => (x === INF ? "Infinity" : String(x));
    return [
      ...fence(
        calls.map(([call, n, edges]) => [
          call,
          `-> [${floydWarshall(n, edges)
            .map((r) => `[${r.map(lit).join(", ")}]`)
            .join(", ")}]`,
        ]),
      ),
    ].join("\n");
  },

  /** related — 같은 세 겹 반복에 두 연산만 갈아 끼운다. */
  relatedAlgebra: () => {
    const u = 3;
    const shortest = closure<number>(
      WALK_N,
      WALK_EDGES,
      INF,
      0,
      (w) => w,
      (a, b) => a + b,
      (c, cur) => c < cur,
    );
    const reach = closure<boolean>(
      WALK_N,
      WALK_EDGES,
      false,
      true,
      () => true,
      (a, b) => a && b,
      (c, cur) => c && !cur,
    );
    const minimax = closure<number>(
      WALK_N,
      WALK_EDGES,
      INF,
      -INF,
      (w) => w,
      (a, b) => Math.max(a, b),
      (c, cur) => c < cur,
    );
    const show = (x: number): string =>
      x === INF ? "INF" : x === -INF ? "−" : String(x);
    return [
      md(
        ["이을 때", "고를 때", "칸 (u, v) 의 뜻", `전개 입력의 ${u} 행`],
        [
          [
            "`+`",
            "`min`",
            "최단 거리",
            (shortest[u] as number[]).map(show).join(" "),
          ],
          [
            "`and`",
            "`or`",
            "u 에서 v 로 갈 수 있는가",
            (reach[u] as boolean[]).map((b) => (b ? "참" : "거짓")).join(" "),
          ],
          [
            "`max`",
            "`min`",
            "지나는 간선 중 가장 큰 가중치가 가장 작은 길의 그 가중치",
            (minimax[u] as number[]).map(show).join(" "),
          ],
        ],
      ),
      "",
      `첫 줄은 정본이 돌려준 ${u} 행과 ${같은가([shortest[u] as number[]], [floydWarshall(WALK_N, WALK_EDGES)[u] as number[]]) ? "칸마다 같습니다" : "다릅니다"}. 셋째 줄의 − 는 출발과 도착이 같아 간선을 지나지 않는 칸입니다.`,
    ].join("\n");
  },

  /** purpose.alt — 두 설계의 기본 연산과 추가 칸. */
  altTable: () => {
    const mine = altCases["이 가이드의 절차"]();
    const john = altCases["존슨 알고리즘"]();
    const cross = crossOnce();
    const keys: [string, string][] = [
      ["전개 입력 (정점 5 · 간선 7)", "전개 그래프 · 기본 연산"],
      [`정점 ${ALT_V} · 간선 400`, "간선 400 개 · 기본 연산"],
      [
        `정점 ${ALT_V} · 간선 ${comma(cross.last)}`,
        `간선 ${cross.last} 개 · 기본 연산`,
      ],
      [
        `정점 ${ALT_V} · 간선 ${comma(cross.first)}`,
        `간선 ${cross.first} 개 · 기본 연산`,
      ],
      [
        `정점 ${ALT_V} · 간선 ${comma(ALT_V * (ALT_V - 1))}`,
        "간선을 가장 많이 둔 그래프 · 기본 연산",
      ],
    ];
    const rows = keys.map(([label, key]) => {
      const a = mine[key] as number;
      const b = john[key] as number;
      return [
        label,
        comma(a),
        comma(b),
        a < b ? "이 가이드의 절차" : a > b ? "존슨 알고리즘" : "같다",
        comma(Math.abs(a - b)),
      ];
    });
    return [
      md(
        ["입력", "이 가이드의 절차", "존슨 알고리즘", "적은 쪽", "차이"],
        rows,
        [1, 2, 4],
      ),
      "",
      `추가 칸은 간선 400 개에서 ${comma(mine["간선 400 개 · 추가 칸"] as number)} 개 대 ${comma(john["간선 400 개 · 추가 칸"] as number)} 개, 간선을 가장 많이 둔 그래프에서 ${comma(mine["간선을 가장 많이 둔 그래프 · 추가 칸"] as number)} 개 대 ${comma(john["간선을 가장 많이 둔 그래프 · 추가 칸"] as number)} 개입니다. 순서는 간선 ${comma(cross.last)} 개와 ${comma(cross.first)} 개 사이에서 뒤집힙니다.`,
    ].join("\n");
  },

  /** purpose.alt — 경계가 그 자리인 까닭. 간선 하나를 더할 때 두 계수가 늘어나는 값. */
  altBoundary: () => {
    const mine = altCases["이 가이드의 절차"]();
    const john = altCases["존슨 알고리즘"]();
    const cross = crossOnce();
    const a0 = mine[`간선 ${cross.last} 개 · 기본 연산`] as number;
    const a1 = mine[`간선 ${cross.first} 개 · 기본 연산`] as number;
    const b0 = john[`간선 ${cross.last} 개 · 기본 연산`] as number;
    const b1 = john[`간선 ${cross.first} 개 · 기본 연산`] as number;
    const g = altGraph(cross.first);
    return [
      `간선 ${comma(cross.last)} 개 -> ${comma(cross.first)} 개 (더한 간선 ${arrow(g.at(-1) as Edge)})`,
      ...fence([
        [
          "  이 가이드의 절차",
          `${comma(a0)} -> ${comma(a1)}`,
          `+${comma(a1 - a0)}`,
        ],
        [
          "  존슨 알고리즘",
          `${comma(b0)} -> ${comma(b1)}`,
          `+${comma(b1 - b0)}`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.math ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows: string[][] = [];
    for (let k = -1; k < WALK_N; k++) {
      const d = byDefinition(WALK_N, WALK_EDGES, k);
      rows.push([
        String(k),
        k < 0 ? "없음" : Array.from({ length: k + 1 }, (_, i) => i).join(" · "),
        cell((d[2] as number[])[1] as number),
        cell((d[4] as number[])[0] as number),
        cell((d[3] as number[])[2] as number),
      ]);
    }
    return [
      md(
        [
          "k",
          "중간에 쓸 수 있는 정점",
          "opt_k(2, 1)",
          "opt_k(4, 0)",
          "opt_k(3, 2)",
        ],
        rows,
        [0, 2, 3, 4],
      ),
      "",
      "세 열 모두 절차를 쓰지 않고 단순 경로를 전부 만들어 고른 값입니다.",
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 형태에 규모를 넣는다. */
  mathBound: () => {
    const rows = [8, 32, 128, 200].map((n) => {
      const edges = star(n);
      const c = countedLite(n, edges);
      const bound = n ** 3 + 2 * n ** 2 + edges.length;
      return [
        comma(n),
        comma(edges.length),
        comma(c.ops),
        comma(bound),
        (c.ops / bound).toFixed(3),
      ];
    });
    return [
      md(
        ["정점 V", "간선 E", "실행한 기본 연산", "V³ + 2V² + E", "앞 ÷ 뒤"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `그래프는 정점 0 과 나머지를 양방향으로 이은 별 모양입니다. 정점 ${comma(V_LIMIT)} · 간선 ${comma(E_LIMIT)} 을 식에 넣으면 ${comma(V_LIMIT ** 3 + 2 * V_LIMIT ** 2 + E_LIMIT)} 번이고, 거리의 절댓값은 (V − 1) × ${comma(W_LIMIT)} = ${comma((V_LIMIT - 1) * W_LIMIT)} 을 넘지 않습니다.`,
    ].join("\n");
  },

  /** 불변식 — 라운드가 끝날 때마다 정의대로 계산한 행렬과 맞댄다. */
  invariantWatch: () => {
    const rows = WALK.rounds.map((r) => {
      const wrong = 다른칸(r.snapshot, byDefinition(WALK_N, WALK_EDGES, r.k));
      return [
        String(r.k),
        Array.from({ length: r.k + 1 }, (_, i) => i).join(" · "),
        String(WALK_N * WALK_N),
        String(wrong),
      ];
    });
    return [
      md(
        ["끝낸 라운드 k", "중간에 쓸 수 있는 정점", "맞댄 칸", "다른 칸"],
        rows,
        [0, 2, 3],
      ),
      "",
      "정의대로 계산한 값은 단순 경로를 전부 만들어 고른 것이라 절차와 다른 길로 얻었습니다.",
    ].join("\n");
  },

  /** 불변식 — 경계 입력. */
  invariantEdges: () => {
    const cases: [string, number, Edge[]][] = [
      ["정점 하나 · 간선 없음", 1, []],
      ["정점 넷 · 간선 없음", 4, []],
      [
        "가중치가 전부 0",
        3,
        [
          [0, 1, 0],
          [1, 2, 0],
        ],
      ],
      [
        "같은 방향 간선 셋",
        2,
        [
          [0, 1, 10],
          [0, 1, 3],
          [0, 1, 7],
        ],
      ],
      [
        "음수 간선 둘",
        3,
        [
          [0, 1, -1],
          [1, 2, -2],
        ],
      ],
      ["아무도 못 가는 정점", 3, [[0, 1, 5]]],
      ["한 줄 그래프 (정점 6)", 6, line(6)],
      ["사이클 그래프 (정점 6)", 6, cycle(6)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const c = counted(n, edges);
      let worst = 0;
      for (const r of c.rounds) {
        worst = Math.max(
          worst,
          다른칸(r.snapshot, byDefinition(n, edges, r.k)),
        );
      }
      const got = floydWarshall(n, edges);
      return [
        label,
        comma(n),
        comma(edges.length),
        comma(got.flat().filter((x) => x === INF).length),
        String(worst),
      ];
    });
    const one = counted(1, []);
    return [
      md(
        [
          "경계 입력",
          "정점",
          "간선",
          "답의 INF 칸",
          "라운드마다 층과 다른 칸의 최댓값",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `정점이 하나면 라운드가 ${one.rounds.length} 번이고 비교하는 후보가 ${one.checks} 개입니다.`,
    ].join("\n");
  },

  /** 불변식 — 마지막 경유 정점을 빼면 어떤 값이 나오는가. */
  mutantShortK: () => {
    const rows = 변이입력.map(({ label, n, edges }) => {
      const want = floydWarshall(n, edges);
      const got = shortK.floydWarshall(n, edges);
      let wrong = 0;
      let first = "—";
      let a = "—";
      let b = "—";
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          const x = (want[u] as number[])[v] as number;
          const y = (got[u] as number[])[v] as number;
          if (x === y) continue;
          wrong++;
          if (first === "—") {
            first = at(u, v);
            a = cell(x);
            b = cell(y);
          }
        }
      }
      return [
        label,
        comma(wrong),
        first,
        a,
        b,
        wrong === 0 ? "같다" : "어긋난다",
      ];
    });
    return md(
      [
        "입력",
        "다른 칸",
        "처음 다른 칸",
        "정본",
        "마지막 정점을 뺀 판",
        "판정",
      ],
      rows,
      [1],
    );
  },

  /** perf.derive — 걸음마다 기본 연산. */
  perfCount: () => {
    let acc = WALK.cells + WALK.copies;
    const rows: string[][] = [
      [
        "T1",
        "—",
        "—",
        "—",
        `칸 채우기 ${WALK.cells} + 간선 읽기 ${WALK.copies}`,
        comma(acc),
      ],
    ];
    WALK.rounds.forEach((r, i) => {
      acc += r.ops;
      rows.push([
        `T${i + 2}`,
        String(r.k),
        String(WALK_N - r.skipped.length),
        String(r.skipped.length),
        `행 판정 ${WALK_N} + 후보 비교 ${r.checks}`,
        comma(acc),
      ]);
    });
    rows.push([`T${WALK_STEPS}`, "—", "—", "—", "0", comma(acc)]);
    return [
      md(
        [
          "걸음",
          "라운드 k",
          "들어간 행",
          "건너뛴 행",
          "이 걸음의 기본 연산",
          "누적",
        ],
        rows,
        [2, 3, 5],
      ),
      "",
      `칸 채우기 ${WALK.cells} 번 · 간선 읽기 ${WALK.copies} 번 · 행 판정 ${WALK.skipChecks} 번 · 후보 비교 ${WALK.checks} 번을 더해 ${WALK.ops} 번입니다.`,
    ].join("\n");
  },

  /** perf.derive — 추가 칸. */
  perfMemory: () => {
    const cells = V_LIMIT * V_LIMIT;
    return [
      ...fence([
        [`V = ${comma(V_LIMIT)}`, "추가 칸 V^2", `${comma(cells)} 칸`],
        ["", "Float64Array 로 잡으면", `${comma(cells * 8)} 바이트`],
        [
          "",
          "number[][] 로 잡으면",
          "칸마다 8 바이트에 행마다 배열 머리가 붙는다",
        ],
      ]),
    ].join("\n");
  },

  /** perf.bounds — 그래프 모양마다 기본 연산이 상한의 몇 배인가. */
  perfObserved: () => {
    const n = 60;
    const cases: [string, Edge[]][] = [
      ["간선이 없다", []],
      ["한 줄 그래프", line(n)],
      ["성긴 그래프", scatter(n, 180)],
      ["사이클 그래프", cycle(n)],
      ["별 모양", star(n)],
      ["촘촘한 그래프", dense(n)],
    ];
    const rows = cases.map(([label, edges]) => {
      const c = countedLite(n, edges);
      const bound = n ** 3 + 2 * n ** 2 + edges.length;
      return [
        label,
        comma(edges.length),
        comma(c.ops),
        comma(bound),
        (c.ops / bound).toFixed(3),
      ];
    });
    const empty = countedLite(n, []).ops;
    return [
      md(
        ["그래프 (정점 60)", "간선", "기본 연산", "V³ + 2V² + E", "앞 ÷ 뒤"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `간선이 없으면 기본 연산이 ${comma(empty)} 번이고, 그것은 3V² = ${comma(3 * n * n)} 과 같습니다.`,
    ].join("\n");
  },

  /** perf.worst — 무엇이 최악을 만드는가. */
  worstShape: () => {
    const n = 60;
    const cases: [string, Edge[]][] = [
      ["간선이 없다", []],
      ["한 줄 그래프", line(n)],
      ["사이클 그래프", cycle(n)],
      ["성긴 그래프", scatter(n, 600)],
      ["별 모양", star(n)],
      ["촘촘한 그래프", dense(n)],
    ];
    const measured = cases.map(([label, edges]) => {
      const c = countedLite(n, edges);
      const d = floydWarshall(n, edges);
      const reach = d.flat().filter((x) => x !== INF).length;
      return {
        label,
        edges: edges.length,
        reach,
        checks: c.checks,
        ops: c.ops,
      };
    });
    const top = Math.max(...measured.map((m) => m.checks));
    const tops = measured.filter((m) => m.checks === top);
    const cheapest = tops.reduce((a, b) => (b.edges < a.edges ? b : a));
    return [
      md(
        [
          "그래프 (정점 60)",
          "간선",
          "서로 도달하는 쌍",
          "후보 비교",
          "기본 연산",
        ],
        measured.map((m) => [
          m.label,
          comma(m.edges),
          comma(m.reach),
          comma(m.checks),
          comma(m.ops),
        ]),
        [1, 2, 3, 4],
      ),
      "",
      `후보 비교가 가장 많은 값은 ${comma(top)} 번 = V³ 이고, 그 값을 내는 모양이 ${tops.length} 가지입니다. 그중 간선이 가장 적은 것은 ${cheapest.label} · 간선 ${comma(cheapest.edges)} 개입니다.`,
    ].join("\n");
  },

  /** perf.worst — 규모를 키워도 비가 유지되는가. */
  worstGrowth: () => {
    const rows = [16, 64, 256, V_LIMIT].map((n) => {
      const edges = star(n);
      const c = countedLite(n, edges);
      const bound = n ** 3 + 2 * n ** 2 + edges.length;
      return [
        comma(n),
        comma(edges.length),
        comma(c.ops),
        comma(bound),
        (c.ops / bound).toFixed(3),
      ];
    });
    return [
      md(
        ["정점 V", "별 모양의 간선", "기본 연산", "V³ + 2V² + E", "앞 ÷ 뒤"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `정점 ${comma(V_LIMIT)} 에서 간선이 ${comma(2 * (V_LIMIT - 1))} 개뿐인 별 모양이 상한을 그대로 채웁니다.`,
    ].join("\n");
  },

  /** selfcheck — 물음에 앞서 T3 · T4 가 끝난 줄 3. */
  checkQuestion: () => {
    const u = 3;
    return md(
      ["걸음", `라운드 k`, `dist[${u}] 줄`],
      [1, 2].map((i) => [
        `T${i + 2}`,
        String(i),
        rowText((WALK.rounds[i] as Round).snapshot[u] as number[]),
      ]),
      [1],
    );
  },

  /** selfcheck — T4 가 고친 칸을 다시 값으로 확인한다. */
  checkT4: () => {
    const r = WALK.rounds[2] as Round;
    const rows = r.changed.map((f) => [
      at(f.u, f.v),
      cell(f.before),
      `${cell(f.a)} + ${plus(f.b)}`,
      String(f.value),
    ]);
    const fromT3 = r.changed.filter((f) =>
      (WALK.rounds[1] as Round).changed.some((g) => g.u === f.u && g.v === r.k),
    );
    return [
      md(
        [
          "칸",
          "라운드 앞의 값",
          `dist[u][${r.k}] + dist[${r.k}][v]`,
          "라운드 뒤의 값",
        ],
        rows,
        [1, 3],
      ),
      "",
      `고친 ${r.changed.length} 칸 가운데 라운드 앞의 값이 INF 였던 칸은 ${r.changed.filter((f) => f.before === INF).length} 개입니다. 왼쪽 항이 T3 에서 만든 값인 칸은 ${fromT3.map((f) => at(f.u, f.v)).join(" · ")} 입니다.`,
    ].join("\n");
  },
};
