/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/tspBitmask/tspBitmask-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 몇 번 전이했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 본다.
 *
 * **큰 수는 `bigint` 로 센다.** 순열 나열의 노드 수는 도시 20 개에서 18 자리를 넘어 배정밀도
 * 정수 표현 범위를 벗어난다 — 그 자리에서 `number` 로 세면 값이 조용히 반올림된다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { INF, tspBitmask } from "./tspBitmask-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 거리 행렬. 도시 넷이고 답이 80 이다.
 *
 * 일곱 갈래를 한 입력에서 전부 실행한다 — 상태 표 · 출발 상태 · 방문 집합 밖의 위치 ·
 * 도달하지 못한 상태 · 이미 방문한 도시 · 방문 집합 확장 · 값 갱신 · 복귀 비용. 그리고
 * 도시가 넷이라야 **순서가 다른 두 접두 경로가 같은 상태로 모이는 자리**가 나온다.
 */
export const WALK: number[][] = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

/** 비대칭 거리 행렬. `dist[i][j] !== dist[j][i]` 인 자리를 담는다. */
export const ASYM3: number[][] = [
  [0, 1, 10],
  [10, 0, 1],
  [1, 10, 0],
];

/**
 * 이미 방문한 도시를 걸러 내지 않으면 **없는 지름길**이 생기는 거리 행렬.
 *
 * 도시 넷이고 답이 10 인데, 그 검사를 빼면 도시 2 를 두 번 지나는 경로가 후보가 되어 9 가
 * 나온다. 전개 입력에서는 같은 검사를 빼도 답이 안 바뀌므로 이 행렬이 따로 필요하다.
 */
export const SHORTCUT4: number[][] = [
  [0, 4, 1, 6],
  [3, 0, 1, 3],
  [4, 2, 0, 1],
  [4, 6, 2, 0],
];

/** 접두 경로 둘이 같은 상태로 모이는 자리를 보이는 도시 다섯짜리 행렬. */
export const MERGE5: number[][] = [
  [0, 4, 9, 7, 3],
  [6, 0, 2, 8, 5],
  [3, 7, 0, 1, 9],
  [8, 2, 6, 0, 4],
  [5, 9, 3, 2, 0],
];

/** 대각선만 0 이고 나머지가 전부 같은 행렬. */
export function flat(n: number, w = 1): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : w)),
  );
}

/** `dist[i][j] = ((i·7 + j·13) mod 90) + 1` — 규모를 늘릴 때 쓰는 생성식. */
export function line(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : ((i * 7 + j * 13) % 90) + 1,
    ),
  );
}

/** 비용 0 짜리 순환이 하나 들어 있는 도시 다섯짜리 행렬. 답이 0 이다. */
export function zeroCycle(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      if ((i + 1) % n === j || (j + 1) % n === i) return 0;
      return 100;
    }),
  );
}

/** 제약 상한 — 도시 수와 거리의 상한. */
export const N_LIMIT = 20;
export const D_LIMIT = 1000000;
/** 메모리 제한 — 문제가 준 256 MB 를 바이트로 적은 값. */
export const MEM_LIMIT = 256000000;

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
      .map((cell_, c) =>
        alignRight.includes(c)
          ? padLeft(cell_, widths[c] ?? 0)
          : pad(cell_, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** `12,345` 꼴 — 본문 표기와 같다. */
const comma = (n: number | bigint): string =>
  typeof n === "bigint" ? n.toLocaleString("en-US") : n.toLocaleString("en-US");

/** 바이트 수를 사람이 읽는 단위로. 1 MiB 미만은 바이트 그대로 적는다. */
const size = (bytes: number): string =>
  Math.abs(bytes) < 1048576
    ? `${comma(bytes)} 바이트`
    : `${comma(Math.round(bytes / 1048576))} MiB`;

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
const cell = (v: number): string => (v === INF ? "INF" : comma(v));

/** 방문 집합을 `n` 자리 이진수로 적는다. 자리 `i` 가 도시 `i` 다. */
export function bits(mask: number, n: number): string {
  return mask.toString(2).padStart(n, "0");
}

/**
 * 수를 한국어로 읽었을 때 마지막 음절의 받침 종류.
 *
 * 조사가 받침에 따라 갈리므로 **값에서 골라야 한다** — 「9 으로」·「65 이」처럼 손으로 적으면
 * 값이 바뀌는 순간 틀린 문장이 남는다. `로/으로` 는 ㄹ 받침을 받침 없음과 같이 다루므로
 * 세 갈래로 나눈다.
 */
type Tail = "none" | "rieul" | "other";

/** 한 자리 수의 읽기 — 영(ㅇ) 일(ㄹ) 이 삼(ㅁ) 사 오 육(ㄱ) 칠(ㄹ) 팔(ㄹ) 구. */
const DIGIT_TAIL: Tail[] = [
  "other",
  "rieul",
  "none",
  "other",
  "none",
  "none",
  "other",
  "rieul",
  "rieul",
  "none",
];

/** 자리 이름의 읽기 — 십(ㅂ) 백(ㄱ) 천(ㄴ) 만(ㄴ) 억(ㄱ) 조. */
function unitTail(place: number): Tail {
  if (place >= 12) return "none";
  if (place >= 8) return "other";
  if (place >= 4) return "other";
  return "other";
}

/** 수를 읽었을 때의 마지막 받침. 0 이 아닌 가장 낮은 자리가 마지막 음절을 정한다. */
export function tailOf(value: number): Tail {
  const digits = Math.trunc(Math.abs(value)).toString();
  if (Math.trunc(Math.abs(value)) === 0) return "other";
  let place = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] !== "0") break;
    place++;
  }
  if (place === 0) {
    return DIGIT_TAIL[Number(digits[digits.length - 1])] as Tail;
  }
  return unitTail(place);
}

/** 값 뒤에 붙일 조사를 값에서 고른다. */
export function josa(
  value: number,
  kind: "은는" | "이가" | "을를" | "으로" | "과와",
): string {
  const t = tailOf(value);
  switch (kind) {
    case "은는":
      return t === "none" ? "는" : "은";
    case "이가":
      return t === "none" ? "가" : "이";
    case "을를":
      return t === "none" ? "를" : "을";
    case "으로":
      return t === "other" ? "으로" : "로";
    default:
      return t === "none" ? "와" : "과";
  }
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

export interface Counts {
  answer: number;
  /** ① — 상태 표를 잡은 횟수. */
  allocs: number;
  /** ② — 출발 상태를 놓은 횟수. */
  seeds: number;
  /** `(mask, v)` 쌍을 하나 살펴본 횟수. */
  visits: number;
  /** ③ — 위치가 방문 집합 밖이라 건너뛴 횟수. */
  outside: number;
  /** ④ — 아직 도달하지 못한 상태라 건너뛴 횟수. */
  unreached: number;
  /** ③④ 를 지나 전이를 만든 상태의 수. */
  live: number;
  /** ⑤ — 이미 방문한 도시라 건너뛴 횟수. */
  revisit: number;
  /** ⑥ 에 이른 횟수 — 전이 후보 하나를 실제로 만든 수. */
  transitions: number;
  /** 값을 실제로 더 작은 것으로 바꾼 횟수. */
  updates: number;
  /** ⑦ — 복귀 비용을 더해 본 횟수. */
  returns: number;
  /** 잡은 칸 수. */
  cells: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(dist: number[][]): Counts {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array((FULL + 1) * n).fill(INF);
  const allocs = 1;
  dp[1 * n + 0] = 0;
  const seeds = 1;
  let visits = 0;
  let outside = 0;
  let unreached = 0;
  let live = 0;
  let revisit = 0;
  let transitions = 0;
  let updates = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      visits++;
      if ((mask & (1 << v)) === 0) {
        outside++;
        continue;
      }
      const cur = dp[mask * n + v] as number;
      if (cur === INF) {
        unreached++;
        continue;
      }
      live++;
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        if ((mask & (1 << u)) !== 0) {
          revisit++;
          continue;
        }
        transitions++;
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        if (cand < (dp[at] as number)) {
          dp[at] = cand;
          updates++;
        }
      }
    }
  }
  let answer = INF;
  let returns = 0;
  for (let last = 0; last < n; last++) {
    returns++;
    const back = dist[last] as number[];
    const cand = (dp[FULL * n + last] as number) + (back[0] as number);
    if (cand < answer) answer = cand;
  }
  return {
    answer,
    allocs,
    seeds,
    visits,
    outside,
    unreached,
    live,
    revisit,
    transitions,
    updates,
    returns,
    cells: (FULL + 1) * n,
  };
}

/** 한 걸음 — 마스크 하나를 처리한 기록. */
export interface Step {
  mask: number;
  /** 이 마스크에서 만든 전이. */
  writes: {
    from: number;
    to: number;
    u: number;
    value: number;
    kept: boolean;
  }[];
  /** 이 마스크에서 전이를 만든 상태의 수. */
  live: number;
  /** 이 걸음이 끝난 시점의 상태 표. 행이 마스크 1..FULL 이다. */
  snapshot: number[][];
  /** 이 걸음이 끝난 시점에 값이 유한한 상태의 수. */
  finite: number;
}

/** 걸음마다의 상태 표를 남기는 사본. 도시가 적은 입력에만 쓴다. */
export function walkRecord(dist: number[][]): {
  answer: number;
  steps: Step[];
  init: number[][];
  returns: { last: number; stored: number; back: number; total: number }[];
} {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array((FULL + 1) * n).fill(INF);
  dp[1 * n + 0] = 0;
  const snap = (): number[][] =>
    Array.from({ length: FULL }, (_, r) =>
      Array.from({ length: n }, (_, c) => dp[(r + 1) * n + c] as number),
    );
  const countFinite = (): number => {
    let k = 0;
    for (let m = 1; m <= FULL; m++)
      for (let v = 0; v < n; v++) if ((dp[m * n + v] as number) !== INF) k++;
    return k;
  };
  const init = snap();
  const steps: Step[] = [];
  for (let mask = 1; mask <= FULL; mask++) {
    const writes: Step["writes"] = [];
    let live = 0;
    for (let v = 0; v < n; v++) {
      if ((mask & (1 << v)) === 0) continue;
      const cur = dp[mask * n + v] as number;
      if (cur === INF) continue;
      live++;
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        if ((mask & (1 << u)) !== 0) continue;
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        const kept = cand < (dp[at] as number);
        if (kept) dp[at] = cand;
        writes.push({ from: v, to: next, u, value: cand, kept });
      }
    }
    steps.push({ mask, writes, live, snapshot: snap(), finite: countFinite() });
  }
  const returns: {
    last: number;
    stored: number;
    back: number;
    total: number;
  }[] = [];
  let answer = INF;
  for (let last = 0; last < n; last++) {
    const stored = dp[FULL * n + last] as number;
    const back = (dist[last] as number[])[0] as number;
    const total = stored + back;
    returns.push({ last, stored, back, total });
    if (total < answer) answer = total;
  }
  return { answer, steps, init, returns };
}

/** 순열을 전부 만들어 보는 설계. 노드·덧셈을 센다. */
export function enumerate(dist: number[][]): {
  answer: number;
  tours: number;
  nodes: number;
  adds: number;
  /** 도시가 적을 때만 채운다 — 순열 하나마다 경로와 비용. */
  detail: { order: number[]; legs: number[]; total: number }[];
} {
  const n = dist.length;
  let tours = 0;
  let nodes = 0;
  let adds = 0;
  let best = INF;
  const detail: { order: number[]; legs: number[]; total: number }[] = [];
  const used = new Array<boolean>(n).fill(false);
  used[0] = true;
  const path = [0];
  const legs: number[] = [];
  const go = (at: number, depth: number, cost: number): void => {
    nodes++;
    if (depth === n) {
      tours++;
      adds++;
      const back = (dist[at] as number[])[0] as number;
      const total = cost + back;
      if (n <= 5) {
        detail.push({
          order: [...path, 0],
          legs: [...legs, back],
          total,
        });
      }
      if (total < best) best = total;
      return;
    }
    const row = dist[at] as number[];
    for (let u = 1; u < n; u++) {
      if (used[u] === true) continue;
      used[u] = true;
      adds++;
      path.push(u);
      legs.push(row[u] as number);
      go(u, depth + 1, cost + (row[u] as number));
      legs.pop();
      path.pop();
      used[u] = false;
    }
  };
  go(0, 1, 0);
  return { answer: best, tours, nodes, adds, detail };
}

/**
 * 위치를 빼고 방문 집합만 상태로 삼은 판.
 *
 * 다음 이동 비용 `dist[v][u]` 의 `v` 가 없으므로, 집합 안의 도시 중 가장 작은 값을 쓴다.
 * 그것이 「위치를 빼면 무엇을 잃는가」를 값으로 보이는 자리다.
 */
export function maskOnly(dist: number[][]): number {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array(FULL + 1).fill(INF);
  dp[1] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    const cur = dp[mask] as number;
    if (cur === INF) continue;
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) !== 0) continue;
      let cheapest = INF;
      for (let v = 0; v < n; v++) {
        if ((mask & (1 << v)) === 0) continue;
        const e = (dist[v] as number[])[u] as number;
        if (e < cheapest) cheapest = e;
      }
      const next = mask | (1 << u);
      const cand = cur + cheapest;
      if (cand < (dp[next] as number)) dp[next] = cand;
    }
  }
  let back = INF;
  for (let v = 1; v < n; v++) {
    const e = (dist[v] as number[])[0] as number;
    if (e < back) back = e;
  }
  return (dp[FULL] as number) + back;
}

/**
 * 상태 하나의 **진짜** 값 — 접두 경로를 전부 만들어 최솟값을 따로 구한다.
 *
 * `dp` 가 낸 값과 견주는 기준이라 정본과 다른 방법으로 구해야 한다. 도시가 적은 입력에만
 * 쓴다.
 */
export function truePrefix(dist: number[][]): Map<string, number> {
  const n = dist.length;
  const out = new Map<string, number>();
  const put = (mask: number, v: number, cost: number): void => {
    const key = `${mask},${v}`;
    const prev = out.get(key);
    if (prev === undefined || cost < prev) out.set(key, cost);
  };
  const go = (mask: number, v: number, cost: number): void => {
    put(mask, v, cost);
    const row = dist[v] as number[];
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) !== 0) continue;
      go(mask | (1 << u), u, cost + (row[u] as number));
    }
  };
  go(1, 0, 0);
  return out;
}

/** 상태 `(mask, v)` 에서 남은 도시를 전부 들르고 도시 0 으로 돌아오는 최소 비용. */
export function trueRemaining(
  dist: number[][],
  mask: number,
  v: number,
): number {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const go = (m: number, at: number): number => {
    if (m === FULL) return (dist[at] as number[])[0] as number;
    let best = INF;
    const row = dist[at] as number[];
    for (let u = 0; u < n; u++) {
      if ((m & (1 << u)) !== 0) continue;
      const cand = (row[u] as number) + go(m | (1 << u), u);
      if (cand < best) best = cand;
    }
    return best;
  };
  return go(mask, v);
}

/* ────────────────────────── 닫힌 형태 ────────────────────────── */

/**
 * 값이 들어가는 상태의 수 — `1 + (n-1)·2^(n-2)`.
 *
 * 출발 상태 하나에, 도시 0 을 담은 방문 집합마다 도시 0 이 아닌 위치 하나씩이다.
 */
export const liveStates = (n: number): number =>
  n === 1 ? 1 : 1 + (n - 1) * 2 ** (n - 2);

/** 전이의 수 — `(n-1) + (n-1)(n-2)·2^(n-3)`. */
export const transitionCount = (n: number): number => {
  const m = n - 1;
  return m < 1 ? 0 : m + m * (m - 1) * 2 ** (m - 2);
};

/** 잡는 칸의 수 — `2^n · n`. */
export const cellCount = (n: number): number => 2 ** n * n;

/** 순열 나열이 진입하는 노드의 수 — `Σ_{d=0}^{n-1} (n-1)!/(n-1-d)!`. */
export function enumerateNodes(n: number): bigint {
  const m = BigInt(n - 1);
  let term = 1n;
  let sum = 1n;
  for (let d = 1n; d <= m; d++) {
    term *= m - d + 1n;
    sum += term;
  }
  return sum;
}

/** 순열의 개수 — `(n-1)!`. */
export function tourCount(n: number): bigint {
  let out = 1n;
  for (let i = 2n; i <= BigInt(n - 1); i++) out *= i;
  return out;
}

/** 순열 나열의 덧셈 횟수 — 노드 하나마다 자식 수만큼, 잎마다 복귀 한 번. */
export function enumerateAdds(n: number): bigint {
  return enumerateNodes(n) - 1n + tourCount(n);
}

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: number[][][] = [
    WALK,
    ASYM3,
    MERGE5,
    [[0]],
    flat(2, 5),
    flat(4, 7),
    zeroCycle(5),
    line(9),
  ];
  for (const dist of inputs) {
    const want = tspBitmask(dist);
    if (counted(dist).answer !== want) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (walkRecord(dist).answer !== want) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (dist.length >= 2 && enumerate(dist).answer !== want) {
      throw new Error("순열 나열이 정본과 다른 답을 낸다");
    }
  }
  for (let n = 2; n <= 10; n++) {
    const c = counted(line(n));
    if (c.live !== liveStates(n)) {
      throw new Error(`상태 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
    if (c.transitions !== transitionCount(n)) {
      throw new Error(`전이 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
    if (c.cells !== cellCount(n)) {
      throw new Error(`칸 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
    const e = enumerate(line(n));
    if (BigInt(e.nodes) !== enumerateNodes(n)) {
      throw new Error(`노드 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
    if (BigInt(e.adds) !== enumerateAdds(n)) {
      throw new Error(`덧셈 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./tspBitmask-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  tspBitmask(dist: number[][]): number;
}

/** 상태 표를 「아직 도달하지 못함」이 아니라 0 으로 채운 사본. */
const zeroFill = await loadMutant<Impl>(REF, {
  swap: [/\.fill\(INF\)/, ".fill(0)"],
});

/** 이미 방문한 도시를 걸러 내는 줄을 뺀 사본. */
const revisit = await loadMutant<Impl>(REF, {
  drop: /if \(\(mask & \(1 << u\)\) !== 0\) continue;/,
});

/** 복귀 비용을 도시 1 부터만 더해 보는 사본. */
const skipZero = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let last = 0; last < n; last\+\+\) \{/,
    "for (let last = 1; last < n; last++) {",
  ],
});

/** **불변식을 지키던 줄** 하나 — 방문 집합을 오름차순이 아니라 내림차순으로 도는 사본. */
const descending = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let mask = 1; mask <= FULL; mask\+\+\) \{/,
    "for (let mask = FULL; mask >= 1; mask--) {",
  ],
});

const MUTANT_CASES: { label: string; dist: number[][] }[] = [
  { label: "전개 입력", dist: WALK },
  { label: "비대칭 도시 셋", dist: ASYM3 },
  { label: "도시 다섯", dist: MERGE5 },
  { label: "지름길이 생기는 도시 넷", dist: SHORTCUT4 },
  { label: "도시 하나", dist: [[0]] },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = zeroFill.tspBitmask === tspBitmask;

// 하나도 갈리지 않으면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["0 으로 채운 판", zeroFill],
    ["검사를 뺀 판", revisit],
    ["도시 1 부터 더한 판", skipZero],
    ["내림차순으로 돈 판", descending],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every((c) => tspBitmask(c.dist) === impl.tspBitmask(c.dist))
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 상태 표를 0 으로 채운 판. 변이 모듈은 반환값 하나만 내므로 중간 상태를 볼 수 없다.
 *
 * 이 사본이 같은 이름의 변이와 같은 답을 내는지는 아래에서 확인한다.
 */
export function countedZeroFill(dist: number[][]): {
  answer: number;
  unreached: number;
  atZero: number;
} {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array((FULL + 1) * n).fill(0);
  dp[1 * n + 0] = 0;
  let unreached = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      if ((mask & (1 << v)) === 0) continue;
      const cur = dp[mask * n + v] as number;
      if (cur === INF) {
        unreached++;
        continue;
      }
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        if ((mask & (1 << u)) !== 0) continue;
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        if (cand < (dp[at] as number)) dp[at] = cand;
      }
    }
  }
  let answer = INF;
  for (let last = 0; last < n; last++) {
    const back = dist[last] as number[];
    const cand = (dp[FULL * n + last] as number) + (back[0] as number);
    if (cand < answer) answer = cand;
  }
  return { answer, unreached, atZero: dp[FULL * n + 0] as number };
}

/** 이미 방문한 도시를 걸러 내지 않는 판의 상태 표. 변이 모듈은 반환값 하나만 낸다. */
export function countedRevisit(dist: number[][]): {
  answer: number;
  rows: number[][];
} {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array((FULL + 1) * n).fill(INF);
  dp[1 * n + 0] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      if ((mask & (1 << v)) === 0) continue;
      const cur = dp[mask * n + v] as number;
      if (cur === INF) continue;
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        if (cand < (dp[at] as number)) dp[at] = cand;
      }
    }
  }
  let answer = INF;
  for (let last = 0; last < n; last++) {
    const back = dist[last] as number[];
    const cand = (dp[FULL * n + last] as number) + (back[0] as number);
    if (cand < answer) answer = cand;
  }
  const rows = Array.from({ length: FULL }, (_, r) =>
    Array.from({ length: n }, (_, c) => dp[(r + 1) * n + c] as number),
  );
  return { answer, rows };
}

if (!중화됨) {
  for (const c of MUTANT_CASES) {
    if (countedRevisit(c.dist).answer !== revisit.tspBitmask(c.dist)) {
      throw new Error("검사를 뺀 사본이 같은 이름의 변이와 다른 답을 낸다");
    }
    if (countedZeroFill(c.dist).answer !== zeroFill.tspBitmask(c.dist)) {
      throw new Error("0 으로 채운 사본이 같은 이름의 변이와 다른 답을 낸다");
    }
  }
}

/* ────────────────────────── 비트·메모리 한계 ────────────────────────── */

/** 도시 수 `n` 에서 방문 집합 표기가 성립하는지 실제 연산으로 본다. */
export function bitProbe(n: number): {
  shift: number;
  full: number;
  cells: number;
  bytes: number;
  note: string;
} {
  const shift = 1 << n;
  const full = shift - 1;
  const cells = (full + 1) * n;
  let note: string;
  if (full < 0) note = "FULL 이 음수라 반복이 한 번도 실행되지 않는다";
  else if (full + 1 !== 2 ** n) note = "1 << n 이 2^n 이 아니다";
  else if (cells * 8 > MEM_LIMIT)
    note = "표기는 성립하지만 메모리 제한을 넘는다";
  else note = "표기가 성립하고 메모리 제한 안에 든다";
  return { shift, full, cells, bytes: cells * 8, note };
}

/** 실제로 불러 본다. 던지면 그 예외를, 아니면 반환값을 낸다. */
export function callProbe(n: number): string {
  const dist = flat(n);
  try {
    const r = tspBitmask(dist);
    return r === INF ? "INF 를 반환한다" : `${comma(r)} 을 반환한다`;
  } catch (e) {
    return `${(e as Error).constructor.name} 를 던진다`;
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

const REC = walkRecord(WALK);
const WALK_N = WALK.length;
const WALK_FULL = (1 << WALK_N) - 1;

/** 걸음 이름 — T1 이 초기화, T2~T16 이 마스크 1..15, T17 이 복귀다. */
function stepName(index: number): string {
  return `T${index}`;
}

/** 이 마스크가 한 일을 한 구절로. */
function stepWhat(step: Step): string {
  if ((step.mask & 1) === 0) return "도시 0 이 없는 방문 집합이라 건너뛴다";
  if (step.live === 0) return "값이 들어간 위치가 없어 건너뛴다";
  if (step.writes.length === 0) return "갈 수 있는 도시가 없다";
  return `위치 ${step.live} 곳에서 전이 ${step.writes.length} 개를 만든다`;
}

/**
 * `<!--viz:tspWalk-->` 아래 ascii 펜스의 내용 — `.sim.ts` 의 프레임과 **같은 걸음**을 같은
 * 순서로 보인다. 프레임 수와 이 표의 행 수가 어긋나면 md 와 web 이 다른 것을 보이게 된다.
 *
 * `PROOFS` 에 넣지 않는다 — `check-proof` 는 `<!--proof:-->` 만 대조하고, viz 펜스는
 * 대화형 패널의 md 대체물이라 판정 대상이 아니다. 값은 여기서 만들어 원고에 옮긴다.
 */
export function walkViz(): string {
  const rows: string[][] = [[stepName(1), "-", "출발 상태를 놓는다", comma(1)]];
  for (const [i, step] of REC.steps.entries()) {
    rows.push([
      stepName(i + 2),
      bits(step.mask, WALK_N),
      stepWhat(step),
      comma(step.finite),
    ]);
  }
  rows.push([
    stepName(REC.steps.length + 2),
    "-",
    "복귀 비용을 더해 가장 작은 것을 고른다",
    comma((REC.steps[REC.steps.length - 1] as Step).finite),
  ]);
  return [
    ...table(
      [["걸음", "방문 집합", "이 걸음이 한 일", "값이 든 상태"], ...rows],
      [0, 3],
    ),
    "",
    "한 걸음이 방문 집합 하나다. 대화형 패널은 같은 걸음을 상태 표와 상태 목록 두 조각으로 그린다",
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ③ — 도시 넷의 순열을 전부 만들어 비용을 잰다. */
  naivePerms: () => {
    const e = enumerate(WALK);
    const rows = e.detail.map((d) => [
      d.order.join(" → "),
      d.legs.join(" + "),
      comma(d.total),
    ]);
    return [
      ...table([["방문 순서", "구간 비용", "합계"], ...rows], [2]),
      "",
      `순열 ${comma(e.tours)} 개 · 덧셈 ${comma(e.adds)} 번 · 진입한 노드 ${comma(e.nodes)} 개`,
      `가장 작은 합계 ${comma(e.answer)}`,
    ].join("\n");
  },

  /** deep.build ②④ — 순열 나열의 규모와 상태 표의 규모를 나란히 센다. */
  naiveScale: () => {
    const rows = [4, 6, 8, 10].map((n) => {
      const e = enumerate(line(n));
      const c = counted(line(n));
      return [
        comma(n),
        comma(e.tours),
        comma(e.adds),
        comma(c.transitions),
        `${Math.round(e.adds / c.transitions).toLocaleString("en-US")} 배`,
      ];
    });
    return [
      ...table(
        [
          ["도시 n", "순열 (n-1)!", "순열 나열의 덧셈", "상태 표의 전이", "비"],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 상한 n = ${comma(N_LIMIT)} 에서`,
      ...table([
        [
          `  순열 (n-1)!`,
          `${comma(tourCount(N_LIMIT))} (${String(tourCount(N_LIMIT)).length} 자리)`,
        ],
        [
          "  순열 나열의 덧셈",
          `${comma(enumerateAdds(N_LIMIT))} (${String(enumerateAdds(N_LIMIT)).length} 자리)`,
        ],
        [
          "  상태 표의 전이",
          `${comma(transitionCount(N_LIMIT))} (${String(transitionCount(N_LIMIT)).length} 자리)`,
        ],
        [
          "  덧셈을 1 초에 10 억 번 한다면",
          `${(Number(enumerateAdds(N_LIMIT)) / 1e9 / 31557600).toFixed(1)} 년`,
        ],
        [
          "  전이를 1 초에 10 억 번 한다면",
          `${(transitionCount(N_LIMIT) / 1e9).toFixed(3)} 초`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ⑤ — 순서가 다른 두 접두 경로가 같은 상태로 모인다. */
  orderFree: () => {
    const n = MERGE5.length;
    const mask = 0b01111;
    const v = 3;
    const paths: [number[], number][] = [
      [
        [0, 1, 2, 3],
        ((MERGE5[0] as number[])[1] as number) +
          ((MERGE5[1] as number[])[2] as number) +
          ((MERGE5[2] as number[])[3] as number),
      ],
      [
        [0, 2, 1, 3],
        ((MERGE5[0] as number[])[2] as number) +
          ((MERGE5[2] as number[])[1] as number) +
          ((MERGE5[1] as number[])[3] as number),
      ],
    ];
    const remaining = trueRemaining(MERGE5, mask, v);
    const rows = paths.map(([order, cost]) => [
      order.join(" → "),
      bits(mask, n),
      String(v),
      comma(cost),
      comma(remaining),
      comma(cost + remaining),
    ]);
    const kept = Math.min(...paths.map(([, c]) => c));
    const c12 = counted(line(12));
    return [
      ...table(
        [
          [
            "접두 경로",
            "방문 집합",
            "위치",
            "접두 비용",
            "남은 최소 비용",
            "전체",
          ],
          ...rows,
        ],
        [3, 4, 5],
      ),
      "",
      `남은 최소 비용이 ${comma(remaining)}${josa(remaining, "으로")} 같으므로 접두 비용이 큰 쪽은 답이 될 수 없다`,
      `상태 (${bits(mask, n)}, 위치 ${v}) 에 남기는 값은 ${comma(kept)} 하나다`,
      "",
      `도시 12 개에서 순열 나열이 진입하는 노드 ${comma(enumerateNodes(12))} 개가`,
      `값이 들어가는 상태 ${comma(c12.live)} 개로 모인다 — ${comma(Math.round(Number(enumerateNodes(12)) / c12.live))} 배다`,
    ].join("\n");
  },

  /** deep.build ⑤ — 위치를 빼고 방문 집합만 상태로 삼으면 어떻게 되는가. */
  maskOnlyGap: () => {
    const rows: [string, number[][]][] = [
      ["전개 입력 (도시 넷)", WALK],
      ["지름길이 생기는 도시 넷", SHORTCUT4],
      ["생성식 도시 여섯", line(6)],
      ["생성식 도시 여덟", line(8)],
      ["비대칭 도시 셋", ASYM3],
    ];
    return [
      ...table(
        [
          ["입력", "정본", "위치를 뺀 판", "차이"],
          ...rows.map(([label, dist]) => {
            const a = tspBitmask(dist);
            const b = maskOnly(dist);
            return [label, comma(a), comma(b), comma(a - b)];
          }),
        ],
        [1, 2, 3],
      ),
      "",
      "위치를 뺀 판은 집합 안의 어느 도시에서 출발해도 되는 것처럼 세므로",
      "실제로 이어 붙일 수 없는 구간을 골라 답보다 작은 값을 낸다",
    ].join("\n");
  },

  /** deep.build ⑥ — 상태 수·전이 수·칸 수가 닫힌 형태와 맞는가. */
  stateCount: () => {
    const rows = [4, 8, 12, 16, 18].map((n) => {
      const c = counted(line(n));
      return [
        comma(n),
        comma(c.cells),
        comma(c.live),
        comma(liveStates(n)),
        comma(c.transitions),
        comma(transitionCount(n)),
      ];
    });
    return [
      ...table(
        [
          [
            "도시 n",
            "잡는 칸 2^n·n",
            "값이 드는 상태",
            "1+(n-1)2^(n-2)",
            "전이",
            "(n-1)+(n-1)(n-2)2^(n-3)",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `제약 상한 n = ${comma(N_LIMIT)} 에서 닫힌 형태가 내는 값`,
      ...table([
        ["  잡는 칸", `${comma(cellCount(N_LIMIT))} 개`],
        [
          "  값이 드는 상태",
          `${comma(liveStates(N_LIMIT))} 개 — 잡는 칸의 ${((liveStates(N_LIMIT) / cellCount(N_LIMIT)) * 100).toFixed(1)} %`,
        ],
        ["  전이", `${comma(transitionCount(N_LIMIT))} 개`],
      ]),
    ].join("\n");
  },

  /** deep.walk — 걸음마다 어떤 값을 어디에 적었는가. */
  walkWrites: () => {
    const rows: string[][] = [];
    for (const [i, step] of REC.steps.entries()) {
      for (const w of step.writes) {
        rows.push([
          stepName(i + 2),
          `${bits(step.mask, WALK_N)}, ${w.from}`,
          String(w.u),
          `${bits(w.to, WALK_N)}, ${w.u}`,
          comma(w.value),
          w.kept ? "적는다" : "이미 있는 값보다 작지 않다",
        ]);
      }
    }
    return [
      ...table(
        [
          ["걸음", "출발 상태", "다음 도시", "도착 상태", "값", "판정"],
          ...rows,
        ],
        [2, 4],
      ),
    ].join("\n");
  },

  /** deep.walk — 마지막 걸음의 복귀 비용. */
  walkReturn: () => {
    const rows = REC.returns.map((r) => [
      String(r.last),
      `dp[${bits(WALK_FULL, WALK_N)}][${r.last}]`,
      cell(r.stored),
      comma(r.back),
      cell(r.total),
    ]);
    return [
      ...table(
        [["마지막 도시", "상태", "쌓인 비용", "복귀 비용", "투어 값"], ...rows],
        [2, 3, 4],
      ),
      "",
      `가장 작은 투어 값 ${comma(REC.answer)}`,
    ].join("\n");
  },

  /** deep.walk — 일곱 갈래가 전개 입력에서 몇 번씩 실행되는가. */
  branchCoverage: () => {
    const w = counted(WALK);
    const one = counted([[0]]);
    const rows: string[][] = [
      ["①", "상태 표를 잡는다", comma(w.allocs), comma(one.allocs)],
      ["②", "출발 상태를 놓는다", comma(w.seeds), comma(one.seeds)],
      ["③", "위치가 방문 집합 밖이다", comma(w.outside), comma(one.outside)],
      [
        "④",
        "아직 도달하지 못한 상태다",
        comma(w.unreached),
        comma(one.unreached),
      ],
      ["⑤", "이미 방문한 도시다", comma(w.revisit), comma(one.revisit)],
      ["⑥", "값을 더 작은 것으로 바꾼다", comma(w.updates), comma(one.updates)],
      ["⑦", "복귀 비용을 더한다", comma(w.returns), comma(one.returns)],
    ];
    return [
      ...table([["라벨", "무엇", "전개 입력", "도시 하나"], ...rows], [2, 3]),
      "",
      `전개 입력에서 (mask, v) 를 ${comma(w.visits)} 번 살펴보고 전이 ${comma(w.transitions)} 개를 만든다`,
    ].join("\n");
  },

  /** 멈춤 — 상태 표를 0 으로 채우면. */
  pauseZeroFill: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = tspBitmask(c.dist);
      const b = zeroFill.tspBitmask(c.dist);
      return [c.label, cell(a), cell(b), a === b ? "같다" : "다르다"];
    });
    return table(
      [["입력", "정본", "0 으로 채운 판", "판정"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** 멈춤 — 0 으로 채운 판에서 ④ 가 무엇을 못 하게 되는가. */
  pauseZeroFillState: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = counted(c.dist);
      const b = countedZeroFill(c.dist);
      const rec = walkRecord(c.dist);
      return [
        c.label,
        comma(a.unreached),
        comma(b.unreached),
        cell((rec.returns[0] as { stored: number }).stored),
        cell(b.atZero),
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "④ 가 참이 된 횟수 (정본)",
            "④ (0 으로 채운 판)",
            "정본의 dp[FULL][0]",
            "0 으로 채운 판의 dp[FULL][0]",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      "0 으로 채운 판에서는 ④ 가 한 번도 참이 되지 않는다 — 모든 상태가 비용 0 으로 도달한 것이 된다",
      "그래서 마지막 반복이 도시 0 자리의 0 을 그대로 골라 온다",
    ].join("\n");
  },

  /** 멈춤 — 이미 방문한 도시 검사를 빼면. */
  pauseRevisit: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = tspBitmask(c.dist);
      const b = revisit.tspBitmask(c.dist);
      const passes = counted(c.dist).revisit;
      const mine = countedRevisit(c.dist);
      const rec = walkRecord(c.dist);
      const last = rec.steps[rec.steps.length - 1] as Step;
      let moved = 0;
      for (const [r, row] of last.snapshot.entries()) {
        for (const [k, x] of row.entries()) {
          if (x !== ((mine.rows[r] as number[])[k] as number)) moved++;
        }
      }
      return [
        c.label,
        cell(a),
        cell(b),
        comma(passes),
        comma(moved),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "정본",
            "검사를 뺀 판",
            "⑤ 가 참이 된 횟수",
            "값이 갈린 칸",
            "판정",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      "입력 다섯이 모두 그 줄을 여러 번 지나가고, 상태 표에 값이 어긋난 칸이 남는다",
      "판정 열이 말하는 것은 반환값 하나뿐이다",
    ].join("\n");
  },

  /** 멈춤 — 검사를 뺀 판의 상태 표가 어디서 갈리는가. */
  pauseRevisitRows: () => {
    const mine = countedRevisit(SHORTCUT4);
    const rec = walkRecord(SHORTCUT4);
    const last = rec.steps[rec.steps.length - 1] as Step;
    const n = SHORTCUT4.length;
    const full = (1 << n) - 1;
    const rows: string[][] = [];
    for (let m = 1; m <= full; m++) {
      const a = last.snapshot[m - 1] as number[];
      const b = mine.rows[m - 1] as number[];
      const same = a.every((x, i) => x === b[i]);
      rows.push([
        bits(m, n),
        a.map((x) => cell(x)).join(" "),
        b.map((x) => cell(x)).join(" "),
        same ? "같다" : "다르다",
      ]);
    }
    return [
      ...table([["방문 집합", "정본", "검사를 뺀 판", "판정"], ...rows]),
      "",
      `정본 ${comma(rec.answer)} · 검사를 뺀 판 ${comma(mine.answer)}`,
      "칸 안의 값은 위치 v = 0 · 1 · 2 · 3 순서다",
    ].join("\n");
  },

  /** 멈춤 — 복귀 반복을 도시 1 부터 돌면. */
  pauseSkipZero: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = tspBitmask(c.dist);
      const b = skipZero.tspBitmask(c.dist);
      return [
        c.label,
        comma(c.dist.length),
        cell(a),
        cell(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [["입력", "도시 수", "정본", "도시 1 부터 더한 판", "판정"], ...rows],
        [1, 2, 3],
      ),
      "",
      "정본에서는 입력 다섯이 모두 이 반복에 들어간다",
      "도시 1 부터 더한 판은 도시 하나짜리 입력에서 그 반복에 한 번도 들어가지 않는다",
    ].join("\n");
  },

  /** 멈춤 — 마지막 방문 집합에서 도시 0 자리의 값. */
  pauseSkipZeroRows: () => {
    const rows: string[][] = [];
    for (const [label, dist] of [
      ["전개 입력", WALK],
      ["비대칭 도시 셋", ASYM3],
      ["도시 하나", [[0]]],
    ] as [string, number[][]][]) {
      const n = dist.length;
      const full = (1 << n) - 1;
      const rec = walkRecord(dist);
      const stored = (rec.returns[0] as { stored: number }).stored;
      rows.push([
        label,
        comma(n),
        `dp[${bits(full, n)}][0]`,
        cell(stored),
        stored === INF ? "답에 못 든다" : "이 값이 곧 답이다",
      ]);
    }
    return [
      ...table(
        [["입력", "도시 수", "상태", "쌓인 비용", "무엇을 하는가"], ...rows],
        [1, 3],
      ),
      "",
      "도시가 둘 이상이면 도시 0 으로 들어오는 전이가 ⑤ 에서 전부 걸러지므로",
      "그 자리는 끝까지 INF 로 남고, 도시가 하나면 출발 상태가 곧 마지막 상태다",
    ].join("\n");
  },

  /** 불변식 ② — 상태마다 dp 값과 따로 구한 진짜 최솟값. */
  invariantWatch: () => {
    const truth = truePrefix(WALK);
    const rec = REC.steps[REC.steps.length - 1] as Step;
    const rows: string[][] = [];
    for (let m = 1; m <= WALK_FULL; m++) {
      for (let v = 0; v < WALK_N; v++) {
        const got = (rec.snapshot[m - 1] as number[])[v] as number;
        const want = truth.get(`${m},${v}`);
        if (got === INF && want === undefined) continue;
        rows.push([
          bits(m, WALK_N),
          String(v),
          cell(got),
          want === undefined ? "없음" : comma(want),
          got === want ? "같다" : "다르다",
        ]);
      }
    }
    return [
      ...table(
        [["방문 집합", "위치", "dp 값", "따로 구한 최솟값", "판정"], ...rows],
        [1, 2, 3],
      ),
      "",
      `값이 든 상태 ${comma(rows.length)} 개가 전부 맞는다`,
      `나머지 ${comma(WALK_FULL * WALK_N - rows.length)} 칸은 만들어질 수 없는 상태라 INF 로 남는다`,
    ].join("\n");
  },

  /** 불변식 ② — 경계 입력. */
  invariantEdges: () => {
    const rows: [string, number[][]][] = [
      ["도시 하나", [[0]]],
      ["왕복 하나 (도시 둘)", flat(2, 5)],
      ["모든 거리가 7 인 도시 넷", flat(4, 7)],
      ["비대칭 도시 셋", ASYM3],
      ["비용 0 짜리 순환 (도시 다섯)", zeroCycle(5)],
      [`거리가 전부 ${comma(D_LIMIT)} 인 도시 넷`, flat(4, D_LIMIT)],
    ];
    return [
      ...table(
        [
          ["입력", "도시 수", "반환값", "값이 든 상태", "전이"],
          ...rows.map(([label, dist]) => {
            const c = counted(dist);
            return [
              label,
              comma(dist.length),
              cell(c.answer),
              comma(c.live),
              comma(c.transitions),
            ];
          }),
        ],
        [1, 2, 3, 4],
      ),
    ].join("\n");
  },

  /** 불변식 ③ — 방문 집합을 내림차순으로 돌면. */
  mutantDescending: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = tspBitmask(c.dist);
      const b = descending.tspBitmask(c.dist);
      return [
        c.label,
        comma(c.dist.length),
        cell(a),
        cell(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [["입력", "도시 수", "정본", "내림차순으로 돈 판", "판정"], ...rows],
        [1, 2, 3],
      ),
    ].join("\n");
  },

  /** deep.math ② — 정의를 전개 입력의 상태 하나에 넣어 검산한다. */
  mathCheck: () => {
    const mask = 0b1111;
    const v = 2;
    const prev = mask ^ (1 << v);
    const rec = REC.steps[REC.steps.length - 1] as Step;
    const before = (REC.steps[prev - 1] as Step).snapshot;
    const rows: string[][] = [];
    const sums: number[] = [];
    for (let w = 0; w < WALK_N; w++) {
      if (w === v) continue;
      if ((prev & (1 << w)) === 0) continue;
      const stored = (before[prev - 1] as number[])[w] as number;
      const edge = (WALK[w] as number[])[v] as number;
      sums.push(stored + edge);
      rows.push([
        String(w),
        `dp[${bits(prev, WALK_N)}][${w}]`,
        cell(stored),
        comma(edge),
        cell(stored + edge),
      ]);
    }
    const got = (rec.snapshot[mask - 1] as number[])[v] as number;
    const best = Math.min(...sums);
    return [
      `dp[${bits(mask, WALK_N)}][${v}] 를 정의대로 계산한다`,
      "",
      ...table(
        [["직전 위치 w", "직전 상태", "그 값", `dist[w][${v}]`, "합"], ...rows],
        [0, 2, 3, 4],
      ),
      "",
      `정의가 낸 가장 작은 합 ${cell(best)}${josa(best, "이가")} 상태 표에 담긴 값 ${cell(got)}${josa(got, "과와")} 맞는다`,
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 형태에 제약 규모를 넣어 수치를 낸다. */
  mathScale: () => {
    const rows = [10, 15, 18, 20].map((n) => [
      comma(n),
      comma(transitionCount(n)),
      comma(enumerateAdds(n)),
      `${String(enumerateAdds(n)).length} 자리`,
    ]);
    return [
      ...table(
        [["도시 n", "전이", "순열 나열의 덧셈", "그 자릿수"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `제약 상한 n = ${comma(N_LIMIT)} 에서 두 값의 비는 ${comma(
        Number(enumerateAdds(N_LIMIT) / BigInt(transitionCount(N_LIMIT))),
      )} 배다`,
      `거리의 상한이 ${comma(D_LIMIT)} 이므로 투어 하나의 비용은 최대 ${comma(N_LIMIT * D_LIMIT)} 이고`,
      `배정밀도 정수 표현의 상한 ${comma(Number.MAX_SAFE_INTEGER)} 의 ${comma(
        Math.round(Number.MAX_SAFE_INTEGER / (N_LIMIT * D_LIMIT)),
      )} 분의 1 이다`,
    ].join("\n");
  },

  /** perf.derive — 전개의 걸음마다 무엇을 몇 번 했는가. */
  perfCount: () => {
    const rows: string[][] = [[stepName(1), "-", comma(0), comma(0), comma(0)]];
    let accT = 0;
    for (const [i, step] of REC.steps.entries()) {
      const kept = step.writes.filter((w) => w.kept).length;
      accT += step.writes.length;
      rows.push([
        stepName(i + 2),
        bits(step.mask, WALK_N),
        comma(step.writes.length),
        comma(kept),
        comma(accT),
      ]);
    }
    rows.push([
      stepName(REC.steps.length + 2),
      "-",
      comma(0),
      comma(0),
      comma(accT),
    ]);
    const c = counted(WALK);
    return [
      ...table(
        [
          [
            "걸음",
            "방문 집합",
            "이 걸음의 전이",
            "값을 바꾼 횟수",
            "누적 전이",
          ],
          ...rows,
        ],
        [0, 2, 3, 4],
      ),
      "",
      `(mask, v) 를 살펴본 횟수 ${comma(c.visits)} · 전이 ${comma(c.transitions)} · 값을 바꾼 횟수 ${comma(c.updates)}`,
      `③ 이 ${comma(c.outside)} 번 · ④ 가 ${comma(c.unreached)} 번 · ⑤ 가 ${comma(c.revisit)} 번 걸러 낸다`,
    ].join("\n");
  },

  /** perf.bounds — 규모를 늘리며 실측과 닫힌 형태를 견준다. */
  perfObserved: () => {
    const rows = [6, 10, 14, 18].map((n) => {
      const c = counted(line(n));
      return [
        comma(n),
        comma(c.visits + c.revisit + c.transitions + c.returns),
        comma(c.transitions),
        comma(transitionCount(n)),
        (c.transitions / (2 ** n * n * n)).toFixed(4),
      ];
    });
    return [
      ...table(
        [
          [
            "도시 n",
            "살펴본 후보 전부",
            "전이",
            "닫힌 형태",
            "전이 / (2^n·n²)",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "마지막 열이 1/8 = 0.125 로 다가간다 — 전이 수가 2^n·n² 의 상수배다",
    ].join("\n");
  },

  /** perf.worst — 거리 행렬을 바꿔도 계수가 같은가. */
  worstShape: () => {
    const n = 12;
    const rows: [string, number[][]][] = [
      ["모든 거리가 1", flat(n, 1)],
      [`모든 거리가 ${comma(D_LIMIT)}`, flat(n, D_LIMIT)],
      ["생성식", line(n)],
      ["비용 0 짜리 순환", zeroCycle(n)],
      [
        "도시 0 에서 나가는 길의 비용만 큰 값",
        Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) =>
            i === j ? 0 : i === 0 ? D_LIMIT : 1,
          ),
        ),
      ],
    ];
    return [
      ...table(
        [
          [
            "거리 행렬 (도시 12)",
            "살펴본 (mask, v)",
            "전이",
            "값을 바꾼 횟수",
            "반환값",
          ],
          ...rows.map(([label, dist]) => {
            const c = counted(dist);
            return [
              label,
              comma(c.visits),
              comma(c.transitions),
              comma(c.updates),
              comma(c.answer),
            ];
          }),
        ],
        [1, 2, 3, 4],
      ),
      "",
      "행렬 다섯에서 앞의 두 계수가 한 자리도 움직이지 않는다 — 값을 바꾼 횟수만 행렬을 탄다",
    ].join("\n");
  },

  /** perf.worst — 도시 수를 올리면 무엇이 먼저 막는가. */
  bitLimit: () => {
    const rows = [20, 21, 30, 31, 32].map((n) => {
      const p = bitProbe(n);
      return [
        comma(n),
        comma(p.shift),
        comma(p.full),
        comma(p.cells),
        size(p.bytes),
        p.note,
      ];
    });
    const budget = Math.floor(MEM_LIMIT / 8);
    let fits = 1;
    while (cellCount(fits + 1) <= budget) fits++;
    return [
      ...table(
        [["도시 n", "1 << n", "FULL", "잡는 칸", "그 크기", "판정"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "실제로 불러 보면",
      ...table([
        [`  도시 ${comma(31)}`, callProbe(31)],
        [`  도시 ${comma(32)}`, callProbe(32)],
      ]),
      "",
      `메모리 제한 ${comma(MEM_LIMIT / 1000000)} MB 는 ${comma(budget)} 칸이다`,
      `도시 ${comma(fits)}${josa(fits, "은는")} 그 안에 들고 ${comma(fits + 1)}${josa(fits + 1, "은는")} 넘는다`,
    ].join("\n");
  },
};
