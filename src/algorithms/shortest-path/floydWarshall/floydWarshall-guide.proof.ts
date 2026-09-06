/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 연산을 몇 번 했는지를 내보내지 않으므로, 세는
 * 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 아래 블록의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고,
 * 사본은 계수와 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이
 * 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { floydWarshall, INF } from "./floydWarshall-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프의 정점 수. */
export const WALK_N = 5;

/**
 * 본문 전개가 쓰는 간선 목록.
 *
 * 다섯 갈래를 한 입력에서 전부 실행한다 — 같은 방향 간선 둘(`0 → 1`), 음수 간선(`1 → 2`),
 * 아무도 도달하지 못하는 정점(`4`), 그리고 바퀴마다 값이 고쳐지는 칸이다. 마지막 바퀴가
 * 아무것도 안 고치는 자리까지 한 그래프에 들어 있다.
 */
export const WALK_EDGES: [number, number, number][] = [
  [0, 1, 3],
  [0, 1, 4],
  [1, 2, -2],
  [2, 0, 5],
  [2, 3, 3],
  [3, 1, 1],
  [4, 3, 2],
];

/** 제약 상한. `floydWarshall-problem.md` 의 「제약 조건」과 같다. */
const V_LIMIT = 500;

/** 정점 `n` 개를 한 줄로 잇는다. 간선 `n-1` 개이고 뒤로만 갈 수 있다. */
export function line(n: number): [number, number, number][] {
  return Array.from(
    { length: Math.max(0, n - 1) },
    (_, i) => [i, i + 1, (i % 9) + 1] as [number, number, number],
  );
}

/** 정점 `n` 개를 하나의 방향 사이클로 잇는다. 간선 `n` 개이고 모든 쌍이 서로 도달한다. */
export function cycle(n: number): [number, number, number][] {
  return Array.from(
    { length: n },
    (_, i) => [i, (i + 1) % n, (i % 9) + 1] as [number, number, number],
  );
}

/**
 * 정점 `n` 개의 순서쌍을 `t -> (t × 7919) mod n(n-1)` 순서로 `e` 개 고른다.
 *
 * 7919 는 소수이고 `n(n-1)` 과 서로소인 `n` 만 쓴다. 가중치는 `pot` 을 써서 어떤 사이클의
 * 합도 1 이상이 되게 만든다 — 음수 간선은 있고 음수 사이클은 없다.
 */
export function scatter(n: number, e: number): [number, number, number][] {
  const m = n * (n - 1);
  const pot = (v: number): number => (v * 13) % 50;
  const out: [number, number, number][] = [];
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
 * 어느 정점에서든 `0` 을 한 번 거쳐 아무 정점에나 갈 수 있으므로 **모든 쌍이 서로 도달**하고,
 * 게다가 첫 바퀴(`k = 0`)부터 건너뛰는 행이 없다. 간선이 가장 적으면서 견주기를 최대로
 * 만드는 모양이다.
 */
export function star(n: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 1; i < n; i++) {
    out.push([0, i, (i % 9) + 1]);
    out.push([i, 0, (i % 7) + 1]);
  }
  return out;
}

/** 모든 순서쌍에 간선을 둔다. 간선 `n(n-1)` 개다. */
export function dense(n: number): [number, number, number][] {
  return scatter(n, n * (n - 1));
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

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

/** `12,345` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
const cell = (v: number): string => (v === INF ? "INF" : comma(v));

/** 숫자 뒤에 붙는 목적격 조사. 0·1·3·6·7·8 은 받침이 있고 2·4·5·9 는 없다. */
const 목적격 = (n: number): string =>
  [true, true, false, true, false, false, true, true, true, false][n % 10]
    ? "을"
    : "를";

/** 행렬 한 줄을 `0 3 1 4 INF` 꼴로 적는다. */
const rowText = (row: number[]): string =>
  row.map((v) => (v === INF ? "INF" : String(v))).join(" ");

/**
 * 모든 순서쌍에 간선이 있는 정점 `n` 개짜리 그래프의 **단순 경로 수**를 자릿수로 낸다.
 *
 * 정점 쌍 하나의 단순 경로 수는 `Σ_{t=0..n-2} (n-2)!/(n-2-t)!` 이고 그 합이 `⌊e·(n-2)!⌋` 다.
 * 쌍이 `n(n-1)` 개이므로 전체는 그것의 `n(n-1)` 배다. 배열에 안 들어가는 규모라 로그로 센다.
 */
function pathDigits(n: number): number {
  let log10 = Math.log10(Math.E) + Math.log10(n) + Math.log10(n - 1);
  for (let i = 2; i <= n - 2; i++) log10 += Math.log10(i);
  return Math.floor(log10) + 1;
}

/** 같은 그래프의 단순 경로 수를 정확히 센다. 작은 `n` 에서만 부른다. */
function pathCount(n: number): number {
  let total = 0;
  let term = 1;
  for (let t = 0; t <= n - 2; t++) {
    total += term;
    term *= n - 2 - t;
  }
  return total * n * (n - 1);
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 한 바퀴(경유 정점 `k` 하나)의 기록. */
export interface Round {
  k: number;
  /** 이 바퀴에 고친 칸과 그 새 값. */
  changed: { u: number; v: number; value: number }[];
  /** `u` 에서 `k` 로 가는 길이 없어 건너뛴 행. */
  skipped: number[];
  /** 이 바퀴가 견준 경유 후보의 수. */
  checks: number;
  /** 이 바퀴가 끝난 시점의 거리 행렬. */
  snapshot: number[][];
}

export interface Counted {
  dist: number[][];
  rounds: Round[];
  /** 간선을 옮겨 적으며 견준 횟수. */
  copies: number;
  /** 행을 건너뛸지 판정한 횟수. */
  skipChecks: number;
  /** 경유 후보 하나를 견준 총 횟수. */
  checks: number;
  /** 위 셋과 행렬 칸을 채운 횟수를 더한 값. */
  ops: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: number, edges: [number, number, number][]): Counted {
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
  const rounds: Round[] = [];
  let skipChecks = 0;
  let checks = 0;
  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    const changed: { u: number; v: number; value: number }[] = [];
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
          row[v] = through;
          changed.push({ u, v, value: through });
        }
      }
    }
    rounds.push({
      k,
      changed,
      skipped,
      checks: checks - before,
      snapshot: dist.map((r) => r.slice()),
    });
  }
  return {
    dist,
    rounds,
    copies,
    skipChecks,
    checks,
    ops: cells + copies + skipChecks + checks,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(
  n: number,
  edges: [number, number, number][],
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

/** ③ 을 뺀 판의 계수. 답은 정본과 같고 견주는 횟수만 늘어난다. */
export function countedNoSkip(
  n: number,
  edges: [number, number, number][],
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
 * 출발점마다 벨만-포드를 한 번씩 실행하는 방법.
 *
 * `ops` 는 간선 하나를 견준 한 번과 거리 배열 한 칸을 채운 한 번을 각각 하나로 센다 —
 * 위 사본의 계수와 같은 기준이다.
 */
export function bellmanPerSource(
  n: number,
  edges: [number, number, number][],
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
 * 경유를 **한 번만** 허용하는 방법 — 간선 두 개짜리 길까지만 본다.
 *
 * 「경유 정점을 넓힌다」의 가장 단순한 후보다. 답이 어디서 틀리는지를 값으로 보이려고 둔다.
 */
export function oneRound(
  n: number,
  edges: [number, number, number][],
): number[][] {
  const base: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, w] of edges) {
    const row = base[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
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
 * 경유 **횟수**를 배로 늘려 가는 방법 — min-plus 행렬 곱을 되풀이 제곱한다.
 *
 * 「경유해도 되는 것을 넓힌다」의 다른 축이다. 정점 번호가 아니라 경로의 간선 수를 넓힌다.
 */
export function doubling(
  n: number,
  edges: [number, number, number][],
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
 * 반복문 순서를 바꾼 판 — 경유 정점 `k` 를 **가장 안쪽**에 둔다.
 *
 * 이 편이 다루는 가장 흔한 오해다. 한 줄 변이로는 못 만드는 모양이라 사본으로 둔다.
 */
export function kInnermost(
  n: number,
  edges: [number, number, number][],
): number[][] {
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, w] of edges) {
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  for (let u = 0; u < n; u++) {
    const row = dist[u] as number[];
    for (let v = 0; v < n; v++) {
      for (let k = 0; k < n; k++) {
        const through =
          (row[k] as number) + ((dist[k] as number[])[v] as number);
        if (through < (row[v] as number)) row[v] = through;
      }
    }
  }
  return dist;
}

/**
 * 정의대로 계산한 `D_k(u, v)` — 번호가 `k` 이하인 정점만 중간에 쓰는 최단 거리.
 *
 * 절차를 쓰지 않고 **단순 경로를 전부 만들어** 최솟값을 고른다. 불변식 대조의 기준이라
 * 절차와 다른 길로 얻어야 뜻이 있다. `k = -1` 이면 중간 정점이 하나도 없는 경우다.
 */
export function byDefinition(
  n: number,
  edges: [number, number, number][],
  k: number,
): number[][] {
  const w: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, c] of edges) {
    const row = w[u] as number[];
    if (c < (row[v] as number)) row[v] = c;
  }
  const out: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (let s = 0; s < n; s++) {
    const seen = new Array<boolean>(n).fill(false);
    seen[s] = true;
    const walk = (at: number, cost: number): void => {
      if (cost < ((out[s] as number[])[at] as number)) {
        (out[s] as number[])[at] = cost;
      }
      for (let nx = 0; nx < n; nx++) {
        if (seen[nx]) continue;
        const e = (w[at] as number[])[nx] as number;
        if (e === INF) continue;
        // `nx` 가 끝점이 아니면 중간 정점이 된다 — 번호가 `k` 이하여야 쓸 수 있다.
        seen[nx] = true;
        walk(nx, cost + e);
        seen[nx] = false;
      }
    };
    const walkBounded = (at: number, cost: number): void => {
      if (cost < ((out[s] as number[])[at] as number)) {
        (out[s] as number[])[at] = cost;
      }
      for (let nx = 0; nx < n; nx++) {
        if (seen[nx]) continue;
        const e = (w[at] as number[])[nx] as number;
        if (e === INF) continue;
        const asEnd = cost + e;
        if (asEnd < ((out[s] as number[])[nx] as number)) {
          (out[s] as number[])[nx] = asEnd;
        }
        if (nx > k) continue;
        seen[nx] = true;
        walkBounded(nx, cost + e);
        seen[nx] = false;
      }
    };
    if (k >= n - 1) walk(s, 0);
    else walkBounded(s, 0);
  }
  return out;
}

/* ────────────────────── 사본이 정본과 같은가 ────────────────────── */

function 같은가(a: number[][], b: number[][]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) =>
      row.every((v, j) => v === ((b[i] as number[])[j] as number)),
    )
  );
}

const 대조입력: { n: number; edges: [number, number, number][] }[] = [
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
    if (!같은가(byDefinition(n, edges, n - 1), want)) {
      throw new Error("정의대로 계산한 값이 정본과 다르다");
    }
    // 음수 사이클이 없다는 것을 대각선으로 확인한다.
    for (let v = 0; v < n; v++) {
      if ((want[v] as number[])[v] !== 0) {
        throw new Error(`음수 사이클이 있는 입력이다 — dist[${v}][${v}] < 0`);
      }
    }
  }
  // 계수를 세는 두 사본의 견준 횟수가 정의와 맞는가.
  const c = counted(WALK_N, WALK_EDGES);
  if (c.checks !== c.rounds.reduce((t, r) => t + r.checks, 0)) {
    throw new Error("바퀴별 검사 수의 합이 총 검사 수와 다르다");
  }
  if (countedNoSkip(WALK_N, WALK_EDGES).checks !== WALK_N ** 3) {
    throw new Error("③ 을 뺀 판의 검사 수가 V^3 이 아니다");
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./floydWarshall-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  floydWarshall(n: number, edges: [number, number, number][]): number[][];
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

const 변이입력: {
  label: string;
  n: number;
  edges: [number, number, number][];
}[] = [
  { label: "전개 그래프 (정점 5)", n: WALK_N, edges: WALK_EDGES },
  { label: "한 줄 그래프 (정점 6)", n: 6, edges: line(6) },
  { label: "사이클 그래프 (정점 6)", n: 6, edges: cycle(6) },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
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

/* ────────────────────────── 걸음 이름 ────────────────────────── */

/** 전개의 `T#`. 걸음 하나가 바퀴 하나다. */
function walkSteps(): { name: string; text: string; dist: number[][] }[] {
  const c = counted(WALK_N, WALK_EDGES);
  const init: number[][] = Array.from({ length: WALK_N }, (_, u) =>
    Array.from({ length: WALK_N }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, w] of WALK_EDGES) {
    const row = init[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  const out = [{ name: "T1", text: "거리 행렬을 간선으로 채운다", dist: init }];
  let t = 2;
  for (const r of c.rounds) {
    out.push({
      name: `T${t++}`,
      text: `경유 정점 ${r.k} ${목적격(r.k)} 허용한다`,
      dist: r.snapshot,
    });
  }
  out.push({
    name: `T${t}`,
    text: "행렬을 그대로 반환한다",
    dist: c.dist.map((r) => r.slice()),
  });
  return out;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 단순한 두 방법이 제약 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [5, 10, 50, 200].map((n) => {
      const edges = dense(n);
      return [
        comma(n),
        n <= 10 ? comma(pathCount(n)) : `${comma(pathDigits(n))} 자리 수`,
        comma(bellmanPerSource(n, edges).ops),
        comma(countedLite(n, edges).ops),
      ];
    });
    const big = dense(V_LIMIT);
    return [
      ...table(
        [
          [
            "정점 V",
            "단순 경로의 수 (모든 쌍)",
            "출발점마다 벨만-포드",
            "경유 집합을 넓히면",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      "간선은 모든 순서쌍에 하나씩 둔 그래프다 — E = V(V-1)",
      "",
      ...table([
        [
          `제약 상한 V = ${comma(V_LIMIT)} · E = ${comma(V_LIMIT * (V_LIMIT - 1))} 에서`,
          "",
        ],
        ["  단순 경로의 수", `${comma(pathDigits(V_LIMIT))} 자리 수`],
        [
          "  출발점마다 벨만-포드",
          `${comma(bellmanPerSource(V_LIMIT, big).ops)} 번`,
        ],
        [
          "  출발점마다 벨만-포드의 상한 V(V-1)E",
          `${comma(V_LIMIT * (V_LIMIT - 1) * V_LIMIT * (V_LIMIT - 1))} 번`,
        ],
        ["  경유 집합을 넓히면", `${comma(countedLite(V_LIMIT, big).ops)} 번`],
      ]),
    ].join("\n");
  },

  /** deep.build ③ — 출발점마다 다시 계산하면 같은 간선을 몇 번 다시 견주는가. */
  repeatObserved: () => {
    const n = WALK_N;
    const per = new Map<string, number>();
    const win = new Map<string, number>();
    for (let s = 0; s < n; s++) {
      const d = new Array<number>(n).fill(INF);
      d[s] = 0;
      for (let round = 0; round < n - 1; round++) {
        let changed = false;
        for (const [u, v, w] of WALK_EDGES) {
          const key = `${u} → ${v} (${w})`;
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
      ...table(
        [["간선", "견준 횟수", "값을 고친 횟수", "헛본 횟수"], ...rows],
        [1, 2, 3],
      ),
      "",
      `출발점 다섯을 각각 계산하면 간선을 ${comma(seenAll)} 번 견주고 그중 ${comma(winAll)} 번만 값을 고친다`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 두 방식으로 처리했을 때의 계수. */
  twoWays: () => {
    const cases: [string, number, [number, number, number][]][] = [
      ["전개 그래프", WALK_N, WALK_EDGES],
      ["사이클 그래프", 20, cycle(20)],
      ["성긴 그래프", 60, scatter(60, 180)],
      ["촘촘한 그래프", 60, dense(60)],
    ];
    return [
      ...table(
        [
          [
            "입력",
            "정점",
            "간선",
            "출발점마다 벨만-포드",
            "경유 집합을 넓히면",
            "그 비",
          ],
          ...cases.map(([label, n, edges]) => {
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
              `${(per.ops / b).toFixed(2)} 배`,
            ];
          }),
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      `${cases.length} 개 입력이 내는 행렬은 두 방식에서 같다. 갈리는 것은 견준 횟수뿐이다`,
    ].join("\n");
  },

  /** deep.build ⑤ — 경유를 한 번만 허용하면 어디서 틀리는가. */
  oneRoundCheck: () => {
    const want = floydWarshall(WALK_N, WALK_EDGES);
    const got = oneRound(WALK_N, WALK_EDGES);
    const rows: string[][] = [];
    for (let u = 0; u < WALK_N; u++) {
      rows.push([
        `u=${u}`,
        rowText(got[u] as number[]),
        rowText(want[u] as number[]),
        같은가([got[u] as number[]], [want[u] as number[]])
          ? "같다"
          : "어긋난다",
      ]);
    }
    const wrong: string[] = [];
    for (let u = 0; u < WALK_N; u++) {
      for (let v = 0; v < WALK_N; v++) {
        if (
          ((got[u] as number[])[v] as number) !==
          ((want[u] as number[])[v] as number)
        ) {
          wrong.push(
            `(${u}, ${v}): ${cell((got[u] as number[])[v] as number)} 대신 ${cell((want[u] as number[])[v] as number)}`,
          );
        }
      }
    }
    return [
      ...table([["행", "한 번만 경유 허용", "진짜 답", "판정"], ...rows], []),
      "",
      `어긋난 칸 ${wrong.length} 개 — ${wrong.join(" · ")}`,
    ].join("\n");
  },

  /** deep.build ⑥ — 넓히는 축 둘을 같은 입력에서 잰다. */
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
      ...table(
        [
          [
            "정점 V",
            "행렬 곱 횟수",
            "경유 횟수를 배로",
            "경유 정점 번호를 하나씩",
            "그 비",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `두 축이 내는 행렬은 ${sizes.length} 개 규모 모두에서 같다`,
    ].join("\n");
  },

  /** deep.walk 도입 — 이 그래프를 고른 이유를 값으로. */
  walkChoice: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = c.rounds.map((r) => [
      `k=${r.k}`,
      comma(r.changed.length),
      r.skipped.length === 0 ? "-" : r.skipped.map((u) => `u=${u}`).join(" "),
      comma(r.checks),
    ]);
    return [
      ...table(
        [["바퀴", "고친 칸", "건너뛴 행", "견준 후보"], ...rows],
        [1, 3],
      ),
      "",
      `바퀴 ${c.rounds.length} 개 중 ${c.rounds.filter((r) => r.changed.length > 0).length} 개가 값을 고치고 ${c.rounds.filter((r) => r.changed.length === 0).length} 개는 아무것도 안 고친다`,
      `건너뛴 행이 있는 바퀴가 ${c.rounds.filter((r) => r.skipped.length > 0).length} 개라 ③ 갈래도 이 한 입력에서 실행된다`,
    ].join("\n");
  },

  /** T1 — 간선을 옮겨 적은 직후의 행렬. */
  walkInit: () => {
    const step = walkSteps()[0] as { dist: number[][] };
    const rows = step.dist.map((row, u) => [
      `u=${u}`,
      ...row.map((v) => (v === INF ? "INF" : String(v))),
    ]);
    return [
      ...table(
        [["", ...Array.from({ length: WALK_N }, (_, v) => `v=${v}`)], ...rows],
        Array.from({ length: WALK_N }, (_, v) => v + 1),
      ),
      "",
      "대각선은 0 이고 간선이 있는 칸에는 그 가중치가 적혔다",
      (() => {
        const dup = WALK_EDGES.filter(([u, v]) => u === 0 && v === 1);
        const kept = Math.min(...dup.map(([, , w]) => w));
        return `0 → 1 은 가중치가 ${dup.map(([, , w]) => w).join(" 과 ")} 로 ${dup.length} 개인데 작은 ${kept} 만 남았다`;
      })(),
    ].join("\n");
  },

  /** T2 — 경유 정점 0 을 허용한 바퀴. */
  walkK0: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const r = c.rounds[0] as Round;
    const rows = r.snapshot.map((row, u) => [
      `u=${u}`,
      ...row.map((v) => (v === INF ? "INF" : String(v))),
    ]);
    return [
      ...table(
        [["", ...Array.from({ length: WALK_N }, (_, v) => `v=${v}`)], ...rows],
        Array.from({ length: WALK_N }, (_, v) => v + 1),
      ),
      "",
      ...table([
        ["건너뛴 행", r.skipped.map((u) => `u=${u}`).join(" ")],
        [
          "고친 칸",
          r.changed.map((x) => `(${x.u}, ${x.v}) = ${x.value}`).join(" · "),
        ],
        ["견준 후보", comma(r.checks)],
      ]),
    ].join("\n");
  },

  /** T3~T6 — 남은 네 바퀴가 고친 칸. */
  walkRounds: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = c.rounds
      .slice(1)
      .map((r, i) => [
        `T${i + 3}`,
        `k=${r.k}`,
        r.changed.length === 0
          ? "없다"
          : r.changed.map((x) => `(${x.u}, ${x.v}) = ${x.value}`).join(" · "),
        comma(r.checks),
      ]);
    return [
      ...table([["걸음", "경유 허용", "고친 칸", "견준 후보"], ...rows], [3]),
      "",
      ...table(
        [
          ["", ...Array.from({ length: WALK_N }, (_, v) => `v=${v}`)],
          ...c.dist.map((row, u) => [
            `u=${u}`,
            ...row.map((v) => (v === INF ? "INF" : String(v))),
          ]),
        ],
        Array.from({ length: WALK_N }, (_, v) => v + 1),
      ),
    ].join("\n");
  },

  /** 전개 전체를 한 표로 — 걸음마다 행렬 다섯 줄. */
  walkTrace: () => {
    const steps = walkSteps();
    const rows = steps.map((s) => [
      s.name,
      s.text,
      ...s.dist.map((row) => rowText(row)),
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "이 걸음이 한 일",
            ...Array.from({ length: WALK_N }, (_, u) => `dist[${u}]`),
          ],
          ...rows,
        ],
        [],
      ),
      "",
      "행이 출발 정점 u · 열이 도착 정점 v 다. INF 는 아직 이어지는 길을 못 찾은 칸이다",
      "",
      `견준 후보 ${comma(counted(WALK_N, WALK_EDGES).checks)} 번 · 정점 다섯이면 전부 견주는 판이 ${comma(WALK_N ** 3)} 번이다`,
    ].join("\n");
  },

  /** 분기 피복 — 다섯 갈래가 세 입력에서 몇 번 실행됐는가. */
  branchCoverage: () => {
    const cases: [string, number, [number, number, number][]][] = [
      ["전개 그래프", WALK_N, WALK_EDGES],
      ["정점 하나 · 간선 없음", 1, []],
      ["사이클 그래프 (정점 4)", 4, cycle(4)],
    ];
    const measure = (
      n: number,
      edges: [number, number, number][],
    ): number[] => {
      const c = counted(n, edges);
      const skipped = c.rounds.reduce((t, r) => t + r.skipped.length, 0);
      const changed = c.rounds.reduce((t, r) => t + r.changed.length, 0);
      return [n * n, c.copies, skipped, c.checks, changed];
    };
    const labels = [
      ["①", "거리 행렬의 칸을 하나 채운다"],
      ["②", "간선 하나를 행렬에 옮겨 적는다"],
      ["③", "k 로 가는 길이 없는 행을 건너뛴다"],
      ["④", "k 를 경유하는 길의 길이를 만든다"],
      ["⑤", "더 짧으면 그 값으로 고친다"],
    ];
    const measured = cases.map(([, n, edges]) => measure(n, edges));
    return table(
      [
        ["라벨", "무엇", ...cases.map(([label]) => label)],
        ...labels.map(([mark, what], i) => [
          mark as string,
          what as string,
          ...measured.map((m) => comma(m[i] as number)),
        ]),
      ],
      [2, 3, 4],
    ).join("\n");
  },

  /** 멈춤 1 — 경유 정점을 가장 안쪽에 두면. */
  pauseLoopOrder: () => {
    const cases: [string, number, [number, number, number][]][] = [
      ["전개 그래프 (정점 5)", WALK_N, WALK_EDGES],
      ["한 줄 그래프 (정점 6)", 6, line(6)],
      ["사이클 그래프 (정점 6)", 6, cycle(6)],
      ["성긴 그래프 (정점 9 · 간선 20)", 9, scatter(9, 20)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const want = floydWarshall(n, edges);
      const got = kInnermost(n, edges);
      let wrong = 0;
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          if (
            ((want[u] as number[])[v] as number) !==
            ((got[u] as number[])[v] as number)
          ) {
            wrong++;
          }
        }
      }
      return [
        label,
        comma(n * n),
        comma(wrong),
        wrong === 0 ? "같다" : "어긋난다",
      ];
    });
    return table(
      [["입력", "칸 수", "어긋난 칸", "판정"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** 멈춤 1 — 어느 칸이 어떻게 어긋나는가. */
  pauseLoopOrderCells: () => {
    const n = 6;
    const edges = cycle(6);
    const want = floydWarshall(n, edges);
    const got = kInnermost(n, edges);
    const rows: string[][] = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        const a = (want[u] as number[])[v] as number;
        const b = (got[u] as number[])[v] as number;
        if (a !== b) rows.push([`(${u}, ${v})`, cell(a), cell(b)]);
      }
    }
    return [
      ...table([["칸", "진짜 답", "k 를 안쪽에 둔 판"], ...rows], [1, 2]),
      "",
      `사이클 그래프의 간선은 ${cycle(6)
        .map(([u, v, w]) => `${u}→${v}(${w})`)
        .join(" ")} 이다`,
    ].join("\n");
  },

  /** 멈춤 2 — ③ 을 빼도 답이 안 바뀐다. */
  pauseSkipRow: () => {
    const rows = 변이입력.map(({ label, n, edges }) => {
      const want = floydWarshall(n, edges);
      const got = noSkip.floydWarshall(n, edges);
      return [
        label,
        rowText(want[0] as number[]),
        rowText(got[0] as number[]),
        같은가(want, got) ? "같다" : "어긋난다",
      ];
    });
    return table(
      [["입력", "정본의 dist[0]", "③ 을 뺀 판의 dist[0]", "판정"], ...rows],
      [],
    ).join("\n");
  },

  /** 멈춤 2 — 답은 같은데 견준 횟수가 갈린다. */
  pauseSkipRowScale: () => {
    const cases: [string, number, [number, number, number][]][] = [
      ["전개 그래프", WALK_N, WALK_EDGES],
      ["한 줄 그래프", 60, line(60)],
      ["성긴 그래프", 60, scatter(60, 180)],
      ["사이클 그래프", 60, cycle(60)],
      ["별 모양", 60, star(60)],
      ["촘촘한 그래프", 60, dense(60)],
    ];
    return [
      ...table(
        [
          ["입력", "정점", "간선", "정본", "③ 을 뺀 판", "그 배"],
          ...cases.map(([label, n, edges]) => {
            if (
              !중화됨 &&
              !같은가(floydWarshall(n, edges), noSkip.floydWarshall(n, edges))
            ) {
              throw new Error(`${label} 에서 ③ 을 뺀 판의 답이 갈렸다`);
            }
            const a = countedLite(n, edges).checks;
            const b = countedNoSkip(n, edges).checks;
            return [
              label,
              comma(n),
              comma(edges.length),
              comma(a),
              comma(b),
              `${(b / a).toFixed(1)}`,
            ];
          }),
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      `${cases.length} 개 입력의 답은 전부 정본과 같다. 갈리는 것은 견준 횟수뿐이다`,
    ].join("\n");
  },

  /** deep.math ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows: string[][] = [];
    for (let k = -1; k < WALK_N; k++) {
      const d = byDefinition(WALK_N, WALK_EDGES, k);
      rows.push([
        k < 0 ? "없음" : `0..${k}`,
        cell((d[2] as number[])[1] as number),
        cell((d[4] as number[])[0] as number),
        cell((d[3] as number[])[2] as number),
      ]);
    }
    return [
      ...table(
        [["중간에 쓸 수 있는 정점", "D(2, 1)", "D(4, 0)", "D(3, 2)"], ...rows],
        [1, 2, 3],
      ),
      "",
      "단순 경로를 전부 만들어 고른 값이다 — 절차를 쓰지 않았다",
      `2 → 1 은 중간이 {0} 이면 ${cell((byDefinition(WALK_N, WALK_EDGES, 0)[2] as number[])[1] as number)} 이고 {0,1,2,3} 이면 ${cell((byDefinition(WALK_N, WALK_EDGES, 3)[2] as number[])[1] as number)} 다`,
    ].join("\n");
  },

  /** deep.math ③ — k 행과 k 열이 그 바퀴에 안 바뀐다. */
  mathRowCol: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = c.rounds.map((r) => {
      const touchedRow = r.changed.filter((x) => x.u === r.k).length;
      const touchedCol = r.changed.filter((x) => x.v === r.k).length;
      return [
        `k=${r.k}`,
        comma(r.changed.length),
        comma(touchedRow),
        comma(touchedCol),
      ];
    });
    return [
      ...table(
        [["바퀴", "고친 칸", "그중 k 행", "그중 k 열"], ...rows],
        [1, 2, 3],
      ),
      "",
      `${c.rounds.length} 개 바퀴 전부에서 k 행과 k 열은 한 칸도 안 고쳐진다`,
      "그래서 새 행렬을 따로 두지 않고 제자리에서 고쳐도 값이 같다",
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 형태에 제약 규모를 넣는다. */
  mathBound: () => {
    const rows = [8, 32, 128, 200].map((n) => {
      const edges = star(n);
      const c = countedLite(n, edges);
      return [
        comma(n),
        comma(c.checks),
        comma(n ** 3),
        (c.checks / n ** 3).toFixed(3),
        comma(c.ops),
        comma(n ** 3 + 2 * n ** 2 + edges.length),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 V",
            "실측 견주기",
            "V^3",
            "그 비",
            "실측 총 연산",
            "V^3 + 2V^2 + E",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "정점 0 과 나머지가 양방향으로 이어진 별 모양이다 — 건너뛰는 행이 하나도 없다",
      "",
      ...table([
        [`제약 상한 V = ${comma(V_LIMIT)} 에서`, ""],
        ["  견주기", `${comma(V_LIMIT ** 3)} 번`],
        [
          "  총 연산 상한 V^3 + 2V^2 + E",
          `${comma(V_LIMIT ** 3 + 2 * V_LIMIT ** 2 + V_LIMIT * (V_LIMIT - 1))} 번`,
        ],
        [
          "  출발점마다 벨만-포드",
          `${comma(bellmanPerSource(V_LIMIT, dense(V_LIMIT)).ops)} 번`,
        ],
      ]),
    ].join("\n");
  },

  /** 불변식 — 바퀴가 끝날 때마다 정의대로 계산한 행렬과 대조한다. */
  invariantWatch: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = c.rounds.map((r) => {
      const want = byDefinition(WALK_N, WALK_EDGES, r.k);
      let wrong = 0;
      for (let u = 0; u < WALK_N; u++) {
        for (let v = 0; v < WALK_N; v++) {
          if (
            ((want[u] as number[])[v] as number) !==
            ((r.snapshot[u] as number[])[v] as number)
          ) {
            wrong++;
          }
        }
      }
      return [
        `k=${r.k}`,
        `0..${r.k}`,
        comma(WALK_N * WALK_N),
        comma(wrong),
        wrong === 0 ? "지킨다" : "깨진다",
      ];
    });
    return [
      ...table(
        [
          [
            "바퀴가 끝난 시점",
            "중간에 쓸 수 있는 정점",
            "확인한 칸",
            "어긋난 칸",
            "불변식",
          ],
          ...rows,
        ],
        [2, 3],
      ),
      "",
      "「정의대로 계산한 값」은 단순 경로를 전부 만들어 고른 것이라 절차와 다른 길로 얻었다",
    ].join("\n");
  },

  /** 불변식 — 경계 입력에서도 같은 문장이 유지되는가. */
  invariantEdges: () => {
    const cases: [string, number, [number, number, number][]][] = [
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
      const want = byDefinition(n, edges, n - 1);
      const got = floydWarshall(n, edges);
      let wrong = 0;
      let unreachable = 0;
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          const a = (want[u] as number[])[v] as number;
          const b = (got[u] as number[])[v] as number;
          if (a !== b) wrong++;
          if (b === INF) unreachable++;
        }
      }
      return [
        label,
        comma(n),
        comma(edges.length),
        comma(unreachable),
        comma(wrong),
        wrong === 0 ? "지킨다" : "깨진다",
      ];
    });
    return [
      ...table(
        [["입력", "정점", "간선", "INF 칸", "어긋난 칸", "불변식"], ...rows],
        [1, 2, 3, 4],
      ),
      "",
      `정점이 하나면 바퀴가 ${counted(1, []).rounds.length} 개이고 견주는 후보가 ${counted(1, []).checks} 개다`,
    ].join("\n");
  },

  /** 불변식 ③ — 마지막 경유 정점을 빼면 어떤 값이 나오는가. */
  mutantShortK: () => {
    const rows = 변이입력.map(({ label, n, edges }) => {
      const want = floydWarshall(n, edges);
      const got = shortK.floydWarshall(n, edges);
      let wrong = 0;
      let first = "-";
      let a = "-";
      let b = "-";
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          const x = (want[u] as number[])[v] as number;
          const y = (got[u] as number[])[v] as number;
          if (x === y) continue;
          wrong++;
          if (first === "-") {
            first = `(${u}, ${v})`;
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
    return table(
      [
        [
          "입력",
          "어긋난 칸",
          "처음 어긋난 자리",
          "정본",
          "마지막 정점을 뺀 판",
          "판정",
        ],
        ...rows,
      ],
      [1, 3, 4],
    ).join("\n");
  },

  /** perf.derive — 걸음마다 몇 번 견줬는가. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES);
    let acc = 0;
    const rows = [
      ["T1", "-", "-", "-", comma(0), comma(0)],
      ...c.rounds.map((r, i) => {
        acc += r.checks;
        return [
          `T${i + 2}`,
          `k=${r.k}`,
          comma(WALK_N - r.skipped.length),
          comma(r.skipped.length),
          comma(r.checks),
          comma(acc),
        ];
      }),
      ["T7", "-", "-", "-", comma(0), comma(acc)],
    ];
    return [
      ...table(
        [
          [
            "걸음",
            "경유 허용",
            "들어간 행",
            "건너뛴 행",
            "이 걸음의 견주기",
            "누적",
          ],
          ...rows,
        ],
        [2, 3, 4, 5],
      ),
      "",
      ...table([
        ["행렬 칸 채우기", `${comma(WALK_N * WALK_N)} 번`],
        ["간선 옮겨 적기", `${comma(c.copies)} 번`],
        ["행 건너뛰기 판정", `${comma(c.skipChecks)} 번`],
        ["경유 후보 견주기", `${comma(c.checks)} 번`],
        ["합", `${comma(c.ops)} 번`],
      ]),
    ].join("\n");
  },

  /** perf.bounds — 그래프 모양마다 견주기가 V^3 의 몇 배인가. */
  perfObserved: () => {
    const n = 60;
    const cases: [string, [number, number, number][]][] = [
      ["간선이 없다", []],
      ["한 줄 그래프", line(n)],
      ["성긴 그래프", scatter(n, 180)],
      ["사이클 그래프", cycle(n)],
      ["별 모양", star(n)],
      ["촘촘한 그래프", dense(n)],
    ];
    return [
      ...table(
        [
          ["그래프 (정점 60)", "간선", "견주기", "V^3", "그 비", "V^2"],
          ...cases.map(([label, edges]) => {
            const c = countedLite(n, edges);
            return [
              label,
              comma(edges.length),
              comma(c.checks),
              comma(n ** 3),
              (c.checks / n ** 3).toFixed(3),
              comma(n * n),
            ];
          }),
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      `간선이 없으면 견주기가 ${comma(countedLite(n, []).checks)} 이고 그것이 V^2 과 같다 — 자기 행 말고는 전부 건너뛴다`,
    ].join("\n");
  },

  /** perf.worst — 무엇이 최악을 만드는가. */
  worstShape: () => {
    const n = 60;
    const cases: [string, [number, number, number][]][] = [
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
      let reach = 0;
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          if (((d[u] as number[])[v] as number) !== INF) reach++;
        }
      }
      return { label, edges: edges.length, reach, checks: c.checks };
    });
    const top = measured.reduce((a, b) => (b.checks > a.checks ? b : a));
    const cheapest = measured
      .filter((m) => m.checks === top.checks)
      .reduce((a, b) => (b.edges < a.edges ? b : a));
    const dearest = measured
      .filter((m) => m.checks === top.checks)
      .reduce((a, b) => (b.edges > a.edges ? b : a));
    return [
      ...table(
        [
          [
            "그래프 (정점 60)",
            "간선",
            "서로 도달하는 쌍",
            "견주기",
            "V^3 에 대한 비",
          ],
          ...measured.map((m) => [
            m.label,
            comma(m.edges),
            comma(m.reach),
            comma(m.checks),
            (m.checks / n ** 3).toFixed(3),
          ]),
        ],
        [1, 2, 3, 4],
      ),
      "",
      `견주기가 가장 많은 것은 ${comma(top.checks)} 번이고 그 값을 내는 모양이 ${measured.filter((m) => m.checks === top.checks).length} 가지다`,
      `가장 적은 간선으로 그 값을 만든 모양 — ${cheapest.label} · 간선 ${comma(cheapest.edges)} 개`,
      `가장 많은 간선을 쓴 모양 — ${dearest.label} · 간선 ${comma(dearest.edges)} 개`,
      `정하는 것은 간선 수가 아니라 「바퀴마다 건너뛰는 행이 있는가」다`,
    ].join("\n");
  },

  /** perf.worst — 규모를 키워도 그 비가 유지되는가. */
  worstGrowth: () => {
    const rows = [16, 64, 256, 500].map((n) => {
      const c = countedLite(n, star(n));
      return [
        comma(n),
        comma(c.checks),
        comma(n ** 3),
        (c.checks / n ** 3).toFixed(3),
        comma(2 * (n - 1)),
        comma(c.ops),
      ];
    });
    return [
      ...table(
        [
          ["정점 V", "별 모양의 견주기", "V^3", "그 비", "간선", "총 연산"],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `제약 상한 V = ${comma(V_LIMIT)} 에서 간선 ${comma(2 * (V_LIMIT - 1))} 개짜리 별 모양이 이미 견주기 ${comma(V_LIMIT ** 3)} 번을 만든다`,
    ].join("\n");
  },

  /** selfcheck — T4 가 고친 칸을 다시 값으로 확인한다. */
  checkT4: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const r = c.rounds[2] as Round;
    const before = (c.rounds[1] as Round).snapshot;
    const rows = r.changed.map((x) => [
      `(${x.u}, ${x.v})`,
      cell((before[x.u] as number[])[x.v] as number),
      `${cell((before[x.u] as number[])[2] as number)} + ${cell((before[2] as number[])[x.v] as number)}`,
      String(x.value),
    ]);
    return table(
      [["칸", "바퀴 앞의 값", "2 를 경유하는 길", "바퀴 뒤의 값"], ...rows],
      [1, 3],
    ).join("\n");
  },
};
