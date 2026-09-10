/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 검사했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **큰 규모에는 기록 없는 사본을 쓴다.** `counted` 는 호출마다 계층 배열을 통째로 복사하므로
 * 거점이 수백 개인 입력에서 그 복사가 실행의 대부분이 된다. 계수만 필요한 자리는
 * `countedLite` 쪽이다 — 절차는 같고 기록만 뺐다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { divideAndConquerDp, INF } from "./divideAndConquerDp-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** `cost[i][j] = (a[i] + … + a[j])^2`. 하삼각 칸은 문제가 정의하지 않아 0 으로 둔다. */
export function buildCost(a: number[]): number[][] {
  const n = a.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (a[i] as number);
  const cost: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) {
    const row = cost[i] as number[];
    for (let j = i; j < n; j++) {
      const s = (prefix[j + 1] as number) - (prefix[i] as number);
      row[j] = s * s;
    }
  }
  return cost;
}

/**
 * 본문 전개가 쓰는 입력. 거점 넷을 세 구역으로 나눈다.
 *
 * 일곱 갈래를 한 입력에서 전부 실행한다 — 기저 계층 · 계층 배열 · 빈 범위 · 후보 상한 ·
 * 최솟값 갱신 · 좌우 재귀 · 계층 교체. `k = 3` 이라 계층 교체가 실제로 두 번 일어나고,
 * `mid = 0` 인 호출이 나와 「후보가 하나도 없는 칸」 갈래가 나온다.
 */
export const WALK_A = [1, 2, 3, 4];
export const WALK_K = 3;

/** 값이 모두 같은 배열. 최적 분할점이 고르게 퍼진다. */
export function flat(n: number): number[] {
  return new Array<number>(n).fill(1);
}

/** `a[i] = (i * 7 % 5) + 1` — `.alt.ts` 와 같은 생성식이다. */
export function line(n: number): number[] {
  return Array.from({ length: n }, (_, i) => ((i * 7) % 5) + 1);
}

/** 첫 칸만 크고 나머지가 1 인 배열. 최적 분할점이 앞에 몰린다. */
export function head(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === 0 ? 1000 : 1));
}

/**
 * **사각 부등식이 깨지는 비용 행렬.** 위반하는 지표 넷이 `(1, 2, 2, 3)` 하나뿐인데도 최적
 * 분할점의 단조성이 무너지고, 그래서 범위를 좁힌 절차가 최솟값을 놓친다.
 */
export const QI_BREAK: number[][] = [
  [5, 4, 1, 7],
  [0, 4, 0, 1],
  [0, 0, 0, 4],
  [0, 0, 0, 7],
];

/**
 * **사각 부등식은 만족하지만 후보 상한을 안 자르면 답이 갈리는 비용 행렬.**
 *
 * 하삼각 칸이 0 이라 `j ≥ mid` 인 후보가 「없는 분할을 0 원에 묶는다」로 읽히고, 그 후보가
 * `bestOpt` 를 뒤로 밀어 오른쪽 재귀의 하한을 잘못 올린다.
 */
export const CAP_BREAK: number[][] = [
  [5, 3, 1, 8],
  [0, 9, 6, 8],
  [0, 0, 9, 0],
  [0, 0, 0, 11],
];

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

/**
 * 계층 하나의 후보 검사에 대한 상한.
 *
 * 깊이 `d` 의 호출들이 넘겨받는 범위는 끝점만 겹치므로 그 길이의 합이 `n + 2^d` 를 넘지
 * 않고, 깊이는 `ceil(log2(n+1))` 을 넘지 않는다. 두 값을 곱하고 `2^d` 의 합을 `2n` 으로
 * 덮으면 아래 식이 된다.
 */
export const layerBound = (n: number): number =>
  n * Math.ceil(Math.log2(n + 1)) + 2 * n;

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
const cell = (v: number): string => (v === INF ? "INF" : comma(v));

/** `[1, 9, 36, 100]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.map(cell).join(", ")}]`;

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** `solve` 한 번의 기록. `empty` 면 빈 범위로 곧장 반환한 호출이다. */
export interface Call {
  layer: number;
  lo: number;
  hi: number;
  optLo: number;
  optHi: number;
  mid: number;
  upper: number;
  cands: { j: number; val: number }[];
  best: number;
  bestOpt: number;
  /** `val < bestCost` 가 참이 되어 값을 고친 횟수. */
  updates: number;
  /** 재귀의 깊이. 계층마다의 첫 호출이 0 이다. */
  depth: number;
  /** 이 호출이 끝난 시점의 계층 표. 행이 계층 1..k 다. */
  snapshot: number[][];
}

export interface Counted {
  answer: number;
  /** 계층 1..k 의 최종 값. */
  rows: number[][];
  /** 비지 않은 `solve` 호출을 부른 순서대로. */
  calls: Call[];
  /** 빈 범위로 곧장 반환한 호출 수. */
  emptyCalls: number;
  /** 분할점 후보 하나를 넣어 값을 만들고 견준 총 횟수. */
  checks: number;
  /** 계층마다의 후보 검사 수. 첫 원소가 계층 2 다. */
  perLayer: number[];
  /** 값을 실제로 고친 총 횟수. */
  updates: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(cost: number[][], k: number): Counted {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;

  const rows: number[][] = [prev.slice()];
  const calls: Call[] = [];
  let emptyCalls = 0;
  let checks = 0;
  let updates = 0;
  const perLayer: number[] = [];

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    rows.push(cur);
    let layerChecks = 0;

    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): void => {
      if (lo > hi) {
        emptyCalls++;
        return;
      }
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      let wrote = 0;
      const upper = Math.min(optHi, mid - 1);
      const cands: { j: number; val: number }[] = [];
      for (let j = optLo; j <= upper; j++) {
        checks++;
        layerChecks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        cands.push({ j, val });
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
          wrote++;
          updates++;
        }
      }
      cur[mid] = bestCost;
      calls.push({
        layer: g,
        lo,
        hi,
        optLo,
        optHi,
        mid,
        upper,
        cands,
        best: bestCost,
        bestOpt,
        updates: wrote,
        depth,
        snapshot: rows.map((r) => r.slice()),
      });
      solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      solve(mid + 1, hi, bestOpt, optHi, depth + 1);
    };

    solve(0, n - 1, 0, n - 2, 0);
    perLayer.push(layerChecks);
    prev = cur;
  }

  return {
    answer: prev[n - 1] as number,
    rows,
    calls,
    emptyCalls,
    checks,
    perLayer,
    updates,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(
  cost: number[][],
  k: number,
): { answer: number; checks: number; calls: number; perLayer: number[] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  let checks = 0;
  let calls = 0;
  const perLayer: number[] = [];

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const before = checks;
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
    ): void => {
      calls++;
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };
    solve(0, n - 1, 0, n - 2);
    perLayer.push(checks - before);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, calls, perLayer };
}

/** 후보 범위를 안 좁히고 분할점을 전부 검사하는 설계. 단조성을 쓰지 않는다. */
export function fullScan(
  cost: number[][],
  k: number,
): { answer: number; checks: number; rows: number[][]; opts: number[][] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const rows: number[][] = [prev.slice()];
  const opts: number[][] = [];
  let checks = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const opt: number[] = new Array<number>(n).fill(-1);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) {
          cur[i] = val;
          opt[i] = j;
        }
      }
    }
    rows.push(cur.slice());
    opts.push(opt);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, rows, opts };
}

/**
 * 하한만 옮기는 후보 설계 — `i` 를 왼쪽에서 오른쪽으로 훑되 `j` 를 직전 칸의 최적
 * 분할점에서 시작한다. 단조성의 절반(하한)만 쓰고 상한은 그대로 `i - 1` 이다.
 */
export function sweep(
  cost: number[][],
  k: number,
): { answer: number; checks: number } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  let checks = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    let low = 0;
    for (let i = 0; i < n; i++) {
      let bestOpt = low;
      for (let j = low; j <= i - 1; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) {
          cur[i] = val;
          bestOpt = j;
        }
      }
      low = bestOpt;
    }
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks };
}

/** 사각 부등식을 지표 넷의 모든 조합에서 확인한다. */
export function quadrangle(cost: number[][]): {
  tested: number;
  broken: [number, number, number, number][];
} {
  const n = cost.length;
  let tested = 0;
  const broken: [number, number, number, number][] = [];
  for (let a = 0; a < n; a++)
    for (let b = a; b < n; b++)
      for (let c = b; c < n; c++)
        for (let d = c; d < n; d++) {
          tested++;
          const lhs =
            ((cost[a] as number[])[c] as number) +
            ((cost[b] as number[])[d] as number);
          const rhs =
            ((cost[a] as number[])[d] as number) +
            ((cost[b] as number[])[c] as number);
          if (lhs > rhs) broken.push([a, b, c, d]);
        }
  return { tested, broken };
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number[][], number][] = [
    [buildCost(WALK_A), WALK_K],
    [buildCost(flat(8)), 3],
    [buildCost(line(16)), 4],
    [buildCost(head(9)), 2],
    [CAP_BREAK, 2],
  ];
  for (const [cost, k] of inputs) {
    const want = divideAndConquerDp(cost, k);
    if (counted(cost, k).answer !== want) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (countedLite(cost, k).answer !== want) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (fullScan(cost, k).answer !== want) {
      throw new Error("완전 탐색 사본이 정본과 다른 답을 낸다");
    }
    if (sweep(cost, k).answer !== want) {
      throw new Error("하한만 옮기는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./divideAndConquerDp-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  divideAndConquerDp(cost: number[][], k: number): number;
}

/** 후보 상한을 `mid - 1` 로 자르는 줄을 `optHi` 로 바꾼 사본. */
const noCap = await loadMutant<Impl>(REF, {
  swap: [/const upper = Math\.min\(optHi, mid - 1\);/, "const upper = optHi;"],
});

/** 계층마다 새 배열을 만드는 줄을 이전 계층 배열로 바꾼 사본. */
const sharedRow = await loadMutant<Impl>(REF, {
  swap: [
    /const cur: number\[\] = new Array<number>\(n\)\.fill\(INF\);/,
    "const cur: number[] = prev;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 계층을 교체하는 줄을 뺀 사본. */
const noRoll = await loadMutant<Impl>(REF, { drop: /prev = cur;/ });

const MUTANT_CASES: { label: string; cost: number[][]; k: number }[] = [
  { label: "전개 입력", cost: buildCost(WALK_A), k: WALK_K },
  { label: "값이 모두 같은 배열", cost: buildCost(flat(5)), k: 3 },
  { label: "다른 비용 행렬", cost: CAP_BREAK, k: 2 },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noCap.divideAndConquerDp === divideAndConquerDp;

// 하나도 갈리지 않으면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["상한을 안 자른 판", noCap],
    ["계층 배열을 함께 쓴 판", sharedRow],
    ["계층을 안 바꾼 판", noRoll],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          divideAndConquerDp(c.cost, c.k) ===
          impl.divideAndConquerDp(c.cost, c.k),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 상한을 안 자른 판의 계층 표. 정본과 같은 절차에서 그 한 줄만 바꾼 사본이다.
 *
 * 변이 모듈은 반환값 하나만 내므로 계층 표를 볼 수 없다. 이 사본이 변이 모듈과 같은 답을
 * 내는지는 아래에서 확인한다.
 */
export function countedNoCap(
  cost: number[][],
  k: number,
): { answer: number; rows: number[][]; calls: Call[] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const rows: number[][] = [prev.slice()];
  const calls: Call[] = [];

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): void => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      let wrote = 0;
      const upper = optHi;
      const cands: { j: number; val: number }[] = [];
      for (let j = optLo; j <= upper; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        cands.push({ j, val });
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
          wrote++;
        }
      }
      cur[mid] = bestCost;
      calls.push({
        layer: g,
        lo,
        hi,
        optLo,
        optHi,
        mid,
        upper,
        cands,
        best: bestCost,
        bestOpt,
        updates: wrote,
        depth,
        snapshot: [cur.slice()],
      });
      solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      solve(mid + 1, hi, bestOpt, optHi, depth + 1);
    };
    solve(0, n - 1, 0, n - 2, 0);
    rows.push(cur.slice());
    prev = cur;
  }
  return { answer: prev[n - 1] as number, rows, calls };
}

/**
 * 계층 배열을 새로 만들지 않고 이전 계층 배열을 그대로 쓰는 판. 걸음마다의 배열을 남긴다.
 *
 * 변이 모듈은 반환값 하나만 내므로 중간 상태를 볼 수 없다. 이 사본이 그 변이와 같은 답을
 * 내는지는 아래에서 확인한다.
 */
export function countedSharedRow(
  cost: number[][],
  k: number,
): { answer: number; steps: { label: string; row: number[] }[] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const steps: { label: string; row: number[] }[] = [
    { label: "T1 기저 계층을 채운다", row: prev.slice() },
  ];
  let t = 2;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = prev;
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
    ): void => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      steps.push({
        label: `T${t++} 계층 ${g} · 칸 ${mid} 확정`,
        row: cur.slice(),
      });
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };
    solve(0, n - 1, 0, n - 2);
    steps.push({
      label: `T${t++} 계층 ${g} 을 이전 계층으로`,
      row: cur.slice(),
    });
    prev = cur;
  }
  return { answer: prev[n - 1] as number, steps };
}

if (!중화됨) {
  for (const c of MUTANT_CASES) {
    if (
      countedNoCap(c.cost, c.k).answer !== noCap.divideAndConquerDp(c.cost, c.k)
    ) {
      throw new Error(
        "상한을 안 자른 사본이 같은 이름의 변이와 다른 답을 낸다",
      );
    }
    if (
      countedSharedRow(c.cost, c.k).answer !==
      sharedRow.divideAndConquerDp(c.cost, c.k)
    ) {
      throw new Error(
        "계층 배열을 함께 쓴 사본이 같은 이름의 변이와 다른 답을 낸다",
      );
    }
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

const N_LIMIT = 500;
const K_LIMIT = 500;

const LABELS: [string, string][] = [
  ["①", "기저 계층을 채운다"],
  ["②", "이번 계층의 배열을 만든다"],
  ["③", "빈 범위에서 곧장 반환한다"],
  ["④", "후보 상한을 mid - 1 로 자른다"],
  ["⑤", "최솟값과 그 분할점을 고친다"],
  ["⑥", "좌우로 재귀한다"],
  ["⑦", "계층을 교체한다"],
];

/** 전개의 T# 이름. 걸음 하나가 표의 한 줄이다. */
function walkSteps(): { name: string; text: string; rows: number[][] }[] {
  const c = counted(buildCost(WALK_A), WALK_K);
  const out: { name: string; text: string; rows: number[][] }[] = [];
  const base = c.rows[0] as number[];
  out.push({
    name: "T1",
    text: "기저 계층을 채운다",
    rows: [base.slice()],
  });
  let t = 2;
  let layer = 2;
  for (const call of c.calls) {
    if (call.layer !== layer) {
      out.push({
        name: `T${t++}`,
        text: `계층 ${layer} 을 이전 계층으로 삼는다`,
        rows: (out[out.length - 1] as { rows: number[][] }).rows,
      });
      layer = call.layer;
    }
    out.push({
      name: `T${t++}`,
      text: `계층 ${call.layer} · solve(${call.lo}, ${call.hi}, ${call.optLo}, ${call.optHi})`,
      rows: call.snapshot,
    });
  }
  out.push({
    name: `T${t++}`,
    text: `계층 ${layer} 을 이전 계층으로 삼는다`,
    rows: (out[out.length - 1] as { rows: number[][] }).rows,
  });
  out.push({
    name: `T${t}`,
    text: "마지막 칸을 반환한다",
    rows: c.rows.map((r) => r.slice()),
  });
  return out;
}

/**
 * 한 칸만 큰 배열 `n` 벌을 전부 재서 계층 하나의 검사가 어느 폭 안에 있는지 본다.
 *
 * 큰 값의 자리를 옮기면 최적 분할점의 배치가 통째로 바뀐다. 그런데도 검사 수의 폭이
 * 좁으면, 이 절차의 비용이 입력의 값이 아니라 `n` 에만 달렸다는 뜻이다.
 */
function spikeRange(n: number): string {
  let lo = Number.POSITIVE_INFINITY;
  let hi = 0;
  for (let at = 0; at < n; at++) {
    const a = Array.from({ length: n }, (_, i) => (i === at ? 1000 : 1));
    const first = countedLite(buildCost(a), 3).perLayer[0] as number;
    lo = Math.min(lo, first);
    hi = Math.max(hi, first);
  }
  return `거점 ${comma(n)} · 한 칸만 큰 배열 ${comma(n)} 벌에서 계층 하나의 검사가 최소 ${comma(lo)} · 최대 ${comma(hi)} · 상한 ${comma(layerBound(n))}`;
}

/** `C(a, b)` — 분할의 개수를 세는 데 쓴다. 작은 값에서만 부른다. */
function choose(a: number, b: number): number {
  if (b < 0 || b > a) return 0;
  let out = 1;
  for (let i = 1; i <= b; i++) out = (out * (a - b + i)) / i;
  return Math.round(out);
}

/** `C(a, b)` 의 자릿수. 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
function chooseDigits(a: number, b: number): number {
  let log10 = 0;
  for (let i = 1; i <= b; i++) log10 += Math.log10(a - b + i) - Math.log10(i);
  return Math.floor(log10) + 1;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 후보를 전부 검사하는 방법이 제약 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [6, 50, 200, 500].map((n) => {
      const k = Math.min(n, 3);
      const cost = buildCost(line(n));
      return [
        comma(n),
        comma(k),
        comma(choose(n - 1, k - 1)),
        comma(fullScan(cost, k).checks),
        comma(countedLite(cost, k).checks),
      ];
    });
    const worst = buildCost(line(N_LIMIT));
    return [
      ...table(
        [
          [
            "거점 n",
            "구역 k",
            "분할의 개수",
            "후보 검사 (전부)",
            "후보 검사 (범위를 좁히면)",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 상한 n = ${comma(N_LIMIT)} 에서`,
      ...table([
        [
          `  분할의 개수 (k = ${comma(Math.floor(K_LIMIT / 2))})`,
          `${comma(chooseDigits(N_LIMIT - 1, Math.floor(K_LIMIT / 2) - 1))} 자리 수`,
        ],
        [
          `  분할의 개수 (k = ${comma(K_LIMIT)})`,
          "1 개 — 거점마다 구역이 하나다",
        ],
        [
          `  후보 검사 (전부, k = ${comma(K_LIMIT)})`,
          `${comma(fullScan(worst, K_LIMIT).checks)} 번`,
        ],
        [
          `  후보 검사 (범위를 좁히면, k = ${comma(K_LIMIT)})`,
          `${comma(countedLite(worst, K_LIMIT).checks)} 번`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ③ — 최적 분할점을 실제로 계산해 나열한다. */
  optMonotone: () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const f = fullScan(buildCost(a), 3);
    const opt2 = f.opts[0] as number[];
    const opt3 = f.opts[1] as number[];
    const fmt = (xs: number[]): string[] =>
      xs.map((v) => (v < 0 ? "없음" : String(v)));
    return [
      ...table(
        [
          ["구간 끝 i", ...a.map((_, i) => String(i))],
          ["opt(2, i)", ...fmt(opt2)],
          ["opt(3, i)", ...fmt(opt3)],
        ],
        a.map((_, i) => i + 1),
      ),
      "",
      `배열 [${a.join(", ")}] · 비용은 구간 합의 제곱`,
      "「없음」 은 구역 수보다 거점이 적어 만들 수 없는 칸이다",
    ].join("\n");
  },

  /** deep.build ③ — 전개 입력의 비용 행렬이 사각 부등식을 실제로 만족하는가. */
  quadrangleCheck: () => {
    const rows = [
      ["전개 입력 (거점 4)", buildCost(WALK_A)] as [string, number[][]],
      ["값이 모두 같은 배열 (거점 8)", buildCost(flat(8))] as [
        string,
        number[][],
      ],
      ["생성식 배열 (거점 16)", buildCost(line(16))] as [string, number[][]],
      ["앞이 큰 배열 (거점 9)", buildCost(head(9))] as [string, number[][]],
      ["사각 부등식이 깨지는 행렬 (거점 4)", QI_BREAK] as [string, number[][]],
    ].map(([label, cost]) => {
      const q = quadrangle(cost);
      return [
        label,
        comma(q.tested),
        comma(q.broken.length),
        q.broken.length === 0
          ? "-"
          : (q.broken[0] as number[]).map((v) => String(v)).join(", "),
      ];
    });
    return table(
      [
        ["비용 행렬", "검사한 지표 조합", "위반", "첫 위반 (a, b, c, d)"],
        ...rows,
      ],
      [1, 2],
    ).join("\n");
  },

  /** deep.build ⑤ — 하한만 옮기는 단순 후보를 재서 반박한다. */
  sweepCandidate: () => {
    const rows = [
      ["값이 모두 같은 배열", flat] as [string, (n: number) => number[]],
      ["앞이 큰 배열", head] as [string, (n: number) => number[]],
    ].flatMap(([label, gen]) =>
      [64, 256].map((n) => {
        const cost = buildCost(gen(n));
        return [
          label,
          comma(n),
          comma(fullScan(cost, 3).checks),
          comma(sweep(cost, 3).checks),
          comma(countedLite(cost, 3).checks),
        ];
      }),
    );
    return table(
      [["배열", "거점 n", "전부 검사", "하한만 옮김", "분할 정복"], ...rows],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.build ⑥ — 계층 하나에서 범위가 어떻게 접히는가. */
  rangeSplit: () => {
    const c = counted(buildCost(flat(16)), 2);
    const rows = c.calls.map((call) => [
      String(call.depth),
      `solve(${call.lo}, ${call.hi}, ${call.optLo}, ${call.optHi})`,
      String(call.mid),
      `[${call.optLo}, ${call.upper}]`,
      String(call.cands.length),
      String(call.bestOpt),
    ]);
    return [
      ...table(
        [["깊이", "호출", "mid", "후보 범위", "검사", "bestOpt"], ...rows],
        [0, 2, 4, 5],
      ),
      "",
      `거점 16 · 계층 2 · 후보 검사 합계 ${c.checks} · 빈 호출 ${c.emptyCalls} 번`,
      `같은 입력을 전부 검사하면 ${fullScan(buildCost(flat(16)), 2).checks} 번`,
    ].join("\n");
  },

  /** deep.build ⑥ — 깊이마다의 검사 합이 n + 2^d 를 넘지 않는가. */
  depthSums: () => {
    const rows = [16, 64, 256].flatMap((n) => {
      const c = counted(buildCost(flat(n)), 2);
      const sums = new Map<number, number>();
      for (const call of c.calls) {
        sums.set(call.depth, (sums.get(call.depth) ?? 0) + call.cands.length);
      }
      return [...sums.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([d, sum]) => [
          comma(n),
          String(d),
          comma(sum),
          comma(n + 2 ** d),
          sum <= n + 2 ** d ? "넘지 않는다" : "넘는다",
        ]);
    });
    return [
      ...table(
        [["거점 n", "깊이 d", "그 깊이의 검사 합", "n + 2^d", "판정"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `계층 하나의 상한 n ceil(log2(n+1)) + 2n 은 거점 16 에서 ${comma(layerBound(16))} · 64 에서 ${comma(layerBound(64))} · 256 에서 ${comma(layerBound(256))} 이다`,
    ].join("\n");
  },

  /** deep.walk — 열한 걸음의 계층 표. */
  walkTrace: () => {
    const steps = walkSteps();
    const c = counted(buildCost(WALK_A), WALK_K);
    const rows = steps.map((s) => [
      s.name,
      s.text,
      s.rows.map((r) => show(r)).join(" "),
    ]);
    return [
      ...table([["걸음", "이 걸음이 한 일", "계층 표 (계층 1 부터)"], ...rows]),
      "",
      `후보 검사 ${c.checks} 번 · 비지 않은 호출 ${c.calls.length} 번 · 빈 호출 ${c.emptyCalls} 번`,
      `반환값 ${cell(c.answer)}`,
    ].join("\n");
  },

  /** deep.walk — 계층 2 의 후보 검사를 값까지 펼친다. */
  walkCandidates: () => {
    const c = counted(buildCost(WALK_A), WALK_K);
    const rows = c.calls.map((call) => [
      String(call.layer),
      String(call.mid),
      `[${call.optLo}, ${call.upper}]`,
      call.cands.length === 0
        ? "없음"
        : call.cands.map((x) => `j=${x.j}: ${cell(x.val)}`).join(" · "),
      cell(call.best),
      call.cands.length === 0 ? "-" : String(call.bestOpt),
    ]);
    return table(
      [
        ["계층", "mid", "후보 범위", "후보 값", "확정한 값", "bestOpt"],
        ...rows,
      ],
      [0, 1],
    ).join("\n");
  },

  /** deep.walk — 일곱 갈래가 전개 입력에서 몇 번 실행됐는가. */
  branchCoverage: () => {
    const c = counted(buildCost(WALK_A), WALK_K);
    const other = counted(buildCost(flat(5)), 3);
    const at = (x: Counted): number[] => [
      1,
      x.rows.length - 1,
      x.emptyCalls,
      x.calls.length,
      x.updates,
      x.calls.length,
      x.rows.length - 1,
    ];
    const a = at(c);
    const b = at(other);
    const rows = LABELS.map(([mark, text], i) => [
      mark,
      text,
      comma(a[i] as number),
      comma(b[i] as number),
    ]);
    return table(
      [["라벨", "무엇", "전개 입력", "값이 모두 같은 배열"], ...rows],
      [2, 3],
    ).join("\n");
  },

  /** deep.walk.pause — 후보 상한을 안 자르면. */
  pauseNoCap: () => {
    const rows = MUTANT_CASES.map((c) => {
      const want = divideAndConquerDp(c.cost, c.k);
      const got = noCap.divideAndConquerDp(c.cost, c.k);
      return [
        c.label,
        String(c.k),
        cell(want),
        cell(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return table(
      [["입력", "k", "정본", "상한을 안 자른 판", "판정"], ...rows],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.walk.pause — 답이 같은 입력에서도 계층 표는 갈린다. */
  pauseNoCapRows: () => {
    const cost = buildCost(WALK_A);
    const a = counted(cost, WALK_K).rows;
    const b = countedNoCap(cost, WALK_K).rows;
    const rows = a.map((r, g) => [
      `계층 ${g + 1}`,
      show(r),
      show(b[g] as number[]),
    ]);
    return [
      ...table([["", "정본", "상한을 안 자른 판"], ...rows]),
      "",
      "정본의 INF 칸은 「거점 수보다 구역이 많아 만들 수 없다」 를 뜻한다",
      "상한을 안 자른 판은 그 칸에 하삼각 값 0 을 더한 수를 적는다",
    ].join("\n");
  },

  /** deep.walk.pause — 상한을 안 자른 판이 답까지 갈리는 입력에서 무엇을 다르게 하는가. */
  pauseNoCapTrace: () => {
    const a = counted(CAP_BREAK, 2).calls;
    const b = countedNoCap(CAP_BREAK, 2).calls;
    const line = (c: Call): string[] => [
      `solve(${c.lo}, ${c.hi}, ${c.optLo}, ${c.optHi})`,
      String(c.mid),
      `[${c.optLo}, ${c.upper}]`,
      c.cands.length === 0
        ? "없음"
        : c.cands.map((x) => `j=${x.j}: ${cell(x.val)}`).join(" · "),
      cell(c.best),
      c.cands.length === 0 ? "-" : String(c.bestOpt),
    ];
    return [
      "정본",
      ...table(
        [
          ["호출", "mid", "후보 범위", "후보 값", "확정한 값", "bestOpt"],
          ...a.map(line),
        ],
        [1],
      ),
      "",
      "상한을 안 자른 판",
      ...table(
        [
          ["호출", "mid", "후보 범위", "후보 값", "확정한 값", "bestOpt"],
          ...b.map(line),
        ],
        [1],
      ),
    ].join("\n");
  },

  /** deep.walk.pause — 계층 배열을 함께 쓰면 걸음마다 배열이 어떻게 되는가. */
  pauseSharedRowTrace: () => {
    const shared = countedSharedRow(buildCost(WALK_A), WALK_K);
    const good = walkSteps();
    const rows = shared.steps.map((st, i) => [
      st.label,
      show(st.row),
      show((good[i]?.rows ?? []).at(-1) ?? []),
    ]);
    return [
      ...table([["걸음", "한 배열을 함께 쓴 판", "정본의 이번 계층"], ...rows]),
      "",
      `한 배열을 함께 쓴 판의 반환값 ${cell(shared.answer)} · 정본 ${cell(divideAndConquerDp(buildCost(WALK_A), WALK_K))}`,
    ].join("\n");
  },

  /** deep.walk.pause — 계층 배열을 함께 쓰면. */
  pauseSharedRow: () => {
    const rows = MUTANT_CASES.map((c) => {
      const want = divideAndConquerDp(c.cost, c.k);
      const got = sharedRow.divideAndConquerDp(c.cost, c.k);
      return [
        c.label,
        String(c.k),
        cell(want),
        cell(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return table(
      [["입력", "k", "정본", "계층 배열을 함께 쓴 판", "판정"], ...rows],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.walk.pause — 사각 부등식이 깨지면. */
  pauseQuadrangle: () => {
    const q = quadrangle(QI_BREAK);
    const f = fullScan(QI_BREAK, 2);
    const opt2 = f.opts[0] as number[];
    const dc = divideAndConquerDp(QI_BREAK, 2);
    const rows = [
      ["구간 끝 i", ...opt2.map((_, i) => String(i))],
      ["opt(2, i)", ...opt2.map((v) => (v < 0 ? "없음" : String(v)))],
    ];
    return [
      ...table(
        rows,
        opt2.map((_, i) => i + 1),
      ),
      "",
      `사각 부등식 검사 ${comma(q.tested)} 조합 중 위반 ${q.broken.length} 개 — (a, b, c, d) = ${(q.broken[0] as number[]).join(", ")}`,
      `  cost[1][2] + cost[2][3] = ${(QI_BREAK[1] as number[])[2]} + ${(QI_BREAK[2] as number[])[3]} = ${((QI_BREAK[1] as number[])[2] as number) + ((QI_BREAK[2] as number[])[3] as number)}`,
      `  cost[1][3] + cost[2][2] = ${(QI_BREAK[1] as number[])[3]} + ${(QI_BREAK[2] as number[])[2]} = ${((QI_BREAK[1] as number[])[3] as number) + ((QI_BREAK[2] as number[])[2] as number)}`,
      "",
      "칸 3 의 후보를 전부 넣어 보면",
      ...table(
        [3, 2, 1, 0].slice(0, 3).map((_, j) => {
          const base = (QI_BREAK[0] as number[])[j] as number;
          const add = (QI_BREAK[j + 1] as number[])[3] as number;
          return [
            `  j = ${j}`,
            `dp[1][${j}] + cost[${j + 1}][3]`,
            `= ${base} + ${add} = ${base + add}`,
            j === (opt2[3] as number) ? "진짜 최솟값" : "",
          ];
        }),
      ),
      "",
      `분할 정복이 낸 값 ${cell(dc)} · 후보를 전부 검사한 값 ${cell(f.answer)}`,
    ].join("\n");
  },

  /** deep.math — 정의를 전개 입력의 값에 넣어 확인한다. */
  mathCheck: () => {
    const c = counted(buildCost(WALK_A), WALK_K);
    const f = fullScan(buildCost(WALK_A), WALK_K);
    const rows = c.rows.map((r, g) => [
      `dp[${g + 1}]`,
      show(r),
      show(f.rows[g] as number[]),
      r.every((v, i) => v === ((f.rows[g] as number[])[i] as number))
        ? "같다"
        : "다르다",
    ]);
    const perLayer = c.perLayer
      .map((v, i) => `계층 ${i + 2}: ${v}`)
      .join(" · ");
    return [
      ...table([["", "분할 정복", "후보를 전부 검사", "판정"], ...rows]),
      "",
      `계층마다의 후보 검사  ${perLayer}`,
      `합계 ${c.checks} · 전부 검사하면 ${f.checks}`,
    ].join("\n");
  },

  /** deep.math — 닫힌 형태에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [50, 100, 200, 500].map((n) => {
      const first = countedLite(buildCost(flat(n)), 3).perLayer[0] as number;
      const bound = layerBound(n);
      return [comma(n), comma(first), comma(bound), (first / bound).toFixed(3)];
    });
    const layers = K_LIMIT - 1;
    return [
      ...table(
        [
          [
            "거점 n",
            "계층 하나의 후보 검사",
            "n ceil(log2(n+1)) + 2n",
            "그 비",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      "제약 상한에서",
      `  후보 검사의 상한  (k-1) [n ceil(log2(n+1)) + 2n] = ${comma(layers * layerBound(N_LIMIT))} 번`,
      `  전부 검사하면     (k-1) n (n-1) / 2 = ${comma((layers * N_LIMIT * (N_LIMIT - 1)) / 2)} 번`,
    ].join("\n");
  },

  /** invariant — 호출마다 진짜 최적 분할점이 넘긴 범위 안에 있는가. */
  invariantWatch: () => {
    const cost = buildCost(WALK_A);
    const c = counted(cost, WALK_K);
    const f = fullScan(cost, WALK_K);
    const rows = c.calls.map((call) => {
      const opt = (f.opts[call.layer - 2] as number[])[call.mid] as number;
      const inside = opt < 0 || (opt >= call.optLo && opt <= call.optHi);
      return [
        `solve(${call.lo}, ${call.hi}, ${call.optLo}, ${call.optHi})`,
        String(call.layer),
        String(call.mid),
        opt < 0 ? "없음" : String(opt),
        `[${call.optLo}, ${call.optHi}]`,
        inside ? "지킨다" : "깨진다",
      ];
    });
    return table(
      [["호출", "계층", "mid", "진짜 opt", "넘긴 범위", "불변식"], ...rows],
      [1, 2, 3],
    ).join("\n");
  },

  /** invariant — 경계 입력. */
  invariantEdges: () => {
    const cases: [string, number[][], number][] = [
      ["거점 하나, 구역 하나", buildCost([7]), 1],
      ["구역이 하나", buildCost(WALK_A), 1],
      ["구역이 거점 수와 같다", buildCost(WALK_A), 4],
      ["값이 모두 같은 배열", buildCost(flat(5)), 3],
      ["앞이 큰 배열", buildCost(head(5)), 2],
      ["비용이 전부 0", buildCost([0, 0, 0, 0]), 2],
    ];
    const rows = cases.map(([label, cost, k]) => {
      const c = counted(cost, k);
      return [
        label,
        String(cost.length),
        String(k),
        cell(divideAndConquerDp(cost, k)),
        comma(c.checks),
        comma(c.calls.length + c.emptyCalls),
      ];
    });
    return table(
      [["입력", "n", "k", "반환값", "후보 검사", "호출"], ...rows],
      [1, 2, 3, 4, 5],
    ).join("\n");
  },

  /** invariant ③ — 계층 교체를 빼면. */
  mutantNoRoll: () => {
    const rows = MUTANT_CASES.map((c) => {
      const want = divideAndConquerDp(c.cost, c.k);
      const got = noRoll.divideAndConquerDp(c.cost, c.k);
      return [
        c.label,
        String(c.k),
        cell(want),
        cell(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return table(
      [["입력", "k", "정본", "계층을 안 바꾼 판", "판정"], ...rows],
      [1, 2, 3],
    ).join("\n");
  },

  /** perf.derive — 걸음마다의 후보 검사와 누적. */
  perfCount: () => {
    const steps = walkSteps();
    const c = counted(buildCost(WALK_A), WALK_K);
    let acc = 0;
    const rows: string[][] = [];
    let ci = 0;
    for (const s of steps) {
      const isCall = s.text.includes("solve(");
      const call = isCall ? (c.calls[ci++] as Call) : null;
      const here = call === null ? 0 : call.cands.length;
      acc += here;
      rows.push([
        s.name,
        call === null ? "-" : `mid = ${call.mid}`,
        call === null ? "-" : `[${call.optLo}, ${call.upper}]`,
        String(here),
        String(acc),
      ]);
    }
    return [
      ...table(
        [["걸음", "확정한 칸", "후보 범위", "이 걸음의 검사", "누적"], ...rows],
        [3, 4],
      ),
      "",
      `비지 않은 호출 ${c.calls.length} 번 · 빈 호출 ${c.emptyCalls} 번 · 후보 검사 ${c.checks} 번`,
    ].join("\n");
  },

  /** perf.bounds — 배열 모양별 관측. */
  perfObserved: () => {
    const rows = [
      ["값이 모두 같은 배열", flat] as [string, (n: number) => number[]],
      ["생성식 배열", line] as [string, (n: number) => number[]],
      ["앞이 큰 배열", head] as [string, (n: number) => number[]],
    ].flatMap(([label, gen]) =>
      [128, 512].map((n) => {
        const lite = countedLite(buildCost(gen(n)), 3);
        const first = lite.perLayer[0] as number;
        return [
          label,
          comma(n),
          comma(lite.checks),
          (first / n).toFixed(2),
          comma(fullScan(buildCost(gen(n)), 3).checks),
        ];
      }),
    );
    return table(
      [
        ["배열", "거점 n", "후보 검사", "계층 하나 / n", "전부 검사하면"],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** perf.worst — 어느 모양이 검사를 가장 많이 만드는가. */
  worstShape: () => {
    const n = 256;
    const shapes: [string, number[]][] = [
      ["값이 모두 같은 배열", flat(n)],
      ["생성식 배열", line(n)],
      ["앞이 큰 배열", head(n)],
      ["뒤가 큰 배열", head(n).slice().reverse()],
    ];
    const rows = shapes.map(([label, a]) => {
      const cost = buildCost(a);
      const l3 = countedLite(cost, 3);
      const l8 = countedLite(cost, 8);
      return [
        label,
        comma(Math.max(...l3.perLayer)),
        comma(Math.max(...l8.perLayer)),
        comma(l8.checks),
        comma(fullScan(cost, 8).checks),
      ];
    });
    return [
      ...table(
        [
          [
            "배열 (거점 256)",
            "계층 하나의 최대 (k = 3)",
            "계층 하나의 최대 (k = 8)",
            "k = 8 합계",
            "k = 8 · 전부 검사",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `계층 하나의 상한 n ceil(log2(n+1)) + 2n = ${comma(layerBound(n))} 번`,
      "",
      spikeRange(64),
      spikeRange(256),
    ].join("\n");
  },

  /** perf.worst — 규모를 4 배씩 늘려 비를 잰다. */
  worstGrowth: () => {
    const rows = [32, 128, 512, 2048].map((n) => {
      const checks = countedLite(buildCost(flat(n)), 3).perLayer[0] as number;
      const bound = layerBound(n);
      return [
        comma(n),
        comma(checks),
        comma(bound),
        (checks / bound).toFixed(3),
        comma((n * (n - 1)) / 2),
      ];
    });
    return table(
      [
        [
          "거점 n",
          "계층 하나의 검사",
          "n ceil(log2(n+1)) + 2n",
          "그 비",
          "전부 검사하면",
        ],
        ...rows,
      ],
      [0, 1, 2, 3, 4],
    ).join("\n");
  },
};
