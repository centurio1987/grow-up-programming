/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 후보를 몇 개 넣었는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 블록의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **비용은 후보 수 하나로 센다.** 가르는 자리 `k` 하나를 넣어 `dp[i][k] + dp[k+1][j]` 를 만들고
 * 지금까지의 최솟값과 비교한 한 번이 1 이다(행렬 체인 곱셈 · 분할 정복 최적화 편과 같은 잣대).
 *
 * **큰 입력에는 기록 없는 사본을 쓴다.** `counted` 는 칸마다 후보 목록을 남기므로 칸이 수만 개를
 * 넘는 규모에서는 부르지 않는다. 그 규모는 `countedLite` 가 값만 센다.
 *
 * **경쟁 설계의 수치는 분할 정복 최적화 편의 `.alt.ts` 에서 받는다.** 두 편이 같은 대조를 서로 다른
 * 쪽에서 적으므로, 같은 실행에서 받아야 두 편의 수가 어긋나지 않는다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as ALT_N,
  countAt,
  crossing,
  K_SHOWN,
  sweepK,
} from "../divideAndConquerDp/divideAndConquerDp-guide.alt.ts";
import { INF, knuthOptimization } from "./knuthOptimization-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 입력. 파일 넷을 여덟 걸음으로 합친다.
 *
 * 여섯 갈래 중 다섯을 한 입력에서 실행한다 — 구간 합 · 기저 · 후보 범위 · 최솟값 갱신 ·
 * 칸 채우기. 남은 하나(조기 반환)는 파일이 하나뿐인 입력이 진다. 마지막 칸에서 하한과 상한이
 * **둘 다** 좁아져 후보 셋 중 하나만 넣는 자리가 나오는 것이 이 입력을 고른 이유다.
 */
export const WALK = [1, 3, 5, 2];

/** 크기가 모두 같은 배열. 최적 가르는 자리가 고르게 퍼진다. */
export function flat(n: number): number[] {
  return new Array<number>(n).fill(1);
}

/** `freq[i] = (i * 7 % 5) + 1` — 크기가 1 부터 5 사이를 되풀이하는 배열. */
export function line(n: number): number[] {
  return Array.from({ length: n }, (_, i) => ((i * 7) % 5) + 1);
}

/** 첫 파일만 크고 나머지가 1 인 배열. 최적 가르는 자리가 앞에 몰린다. */
export function head(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === 0 ? 1000 : 1));
}

/** 뒤로 갈수록 커지는 배열. */
export function up(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** 마지막 파일만 크고 나머지가 1 인 배열. 최적 가르는 자리가 뒤에 몰린다. */
export function tail(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 1000 : 1));
}

/**
 * **크기가 음수인 파일을 허용하면 단조성이 깨진다.** 구간 합은 사각 부등식을 언제나
 * 등호로 만족하지만 `S(b, c) ≤ S(a, d)` 는 `freq[i] ≥ 0` 이 있어야 성립한다. 이 배열에서
 * 최적 가르는 자리가 `opt[0][2] = 1` 에서 `opt[0][3] = 0` 으로 되돌아간다.
 */
export const NEG = [1, 1, 2, -2];

/** 과제 규모의 상한. DP 테이블 두 벌이 흔한 예산 256 MB 안에 드는 규모다(「아이디어를 떠올리는 과정」). */
export const N_MAX = 2_000;

/** 「아이디어를 떠올리는 과정」과 「아이디어 상세」가 끝까지 쓰는 파일 여덟 개. */
export const SMALL = line(8);

/** 후보 하나를 1 억 분의 1 초로 어림한다. */
export const PER_SEC = 100_000_000;

/** DP 테이블 칸 하나를 8 바이트로 어림한다. */
const BYTES = 8;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** `1961241` → `1,961,241`. */
export const num = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
export const cell = (v: number): string => (v === INF ? "INF" : num(v));

/** 값 나열 `0 4 13 22` — 구간 표기 `[a,b]` 와 갈라 적는다(`L25`). */
export const show = (xs: readonly (number | null)[]): string =>
  xs.map((v) => (v === null ? "·" : cell(v))).join(" ");

/** 배열 표기 `[1, 3, 5, 2]`. */
export const arr = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** 「이고 / 고」 — 값 뒤의 계사. */
const 이고 = (v: string): string => josa(v, "이고", "고");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
export function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string {
  const align = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  const row = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  return [row(head), row(align), ...rows.map(row)].join("\n");
}

/** 초 — 후보 하나를 1 억 분의 1 초로. */
export const seconds = (count: number): string => {
  const s = count / PER_SEC;
  return `${s < 1 ? s.toFixed(2) : num(Math.round(s))} 초`;
};

/** 후보를 전부 넣을 때의 후보 수 — `n(n²−1)/6`. 입력의 값과 무관하다. */
export const fullBound = (n: number): number => (n * (n * n - 1)) / 6;

/** 이웃 두 칸 사이로 가뒀을 때의 후보 수 상한 — `n(n−1)/2 + (n−1)(n−2)`. */
export const narrowBound = (n: number): number =>
  (n * (n - 1)) / 2 + (n - 1) * (n - 2);

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 칸 하나를 채운 기록. */
export interface Cell {
  len: number;
  i: number;
  j: number;
  /** 구간 합 `S(i, j)`. */
  sum: number;
  lo: number;
  /** `j - 1` 로 자르기 전의 상한 — 아래 이웃 칸의 최적 가르는 자리. */
  raw: number;
  hi: number;
  /** 넣은 후보마다의 값과, 넣기 직전의 최솟값. */
  cands: { k: number; val: number; before: number; better: boolean }[];
  best: number;
  bestK: number;
  /** `val < best` 가 참이 되어 값을 고친 횟수. */
  updates: number;
}

export interface Counted {
  answer: number;
  dp: number[][];
  opt: number[][];
  cells: Cell[];
  /** 후보 수 합계. */
  checks: number;
}

/** 구간 합의 앞 누적 — `prefix[j+1] - prefix[i]` 가 `S(i, j)` 다. */
export function prefixOf(freq: readonly number[]): number[] {
  const prefix = new Array<number>(freq.length + 1).fill(0);
  for (let i = 0; i < freq.length; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  return prefix;
}

/** 후보 범위를 정하는 방식 — 정본은 `both` 다. */
export type Bounds = "both" | "lower" | "upper" | "full";

/**
 * 정본과 같은 절차에 세는 자리만 덧붙인 사본. `bounds` 로 하한 · 상한 가운데 무엇을 이웃 칸에서
 * 받을지 바꿀 수 있다 — `both` 가 정본, `full` 이 가르는 자리를 전부 넣는 구간 DP 다. `base` 가
 * 거짓이면 길이 1 구간의 최적 가르는 자리를 세우지 않는다(짚고 가기의 변이와 같은 절차). 칸마다의
 * 기록을 남기므로 작은 입력에서만 부른다.
 */
export function counted(
  freq: number[],
  bounds: Bounds = "both",
  base = true,
): Counted {
  const n = freq.length;
  const prefix = prefixOf(freq);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  if (base) for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;
  const cells: Cell[] = [];
  let checks = 0;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const raw = (opt[i + 1] as number[])[j] as number;
      const lo =
        bounds === "both" || bounds === "lower"
          ? ((opt[i] as number[])[j - 1] as number)
          : i;
      const hi =
        bounds === "both" || bounds === "upper" ? Math.min(raw, j - 1) : j - 1;
      let best = INF;
      let bestK = i;
      let updates = 0;
      const cands: Cell["cands"] = [];
      for (let k = lo; k <= hi; k++) {
        checks++;
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        const better = val < best;
        cands.push({ k, val, before: best, better });
        if (better) {
          best = val;
          bestK = k;
          updates++;
        }
      }
      const sum = (prefix[j + 1] as number) - (prefix[i] as number);
      (dp[i] as number[])[j] = best + sum;
      (opt[i] as number[])[j] = bestK;
      cells.push({ len, i, j, sum, lo, raw, hi, cands, best, bestK, updates });
    }
  }
  return {
    answer: n <= 1 ? 0 : ((dp[0] as number[])[n - 1] as number),
    dp,
    opt,
    cells,
    checks,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(
  freq: number[],
  bounds: Bounds = "both",
): { answer: number; checks: number } {
  const n = freq.length;
  if (n <= 1) return { answer: 0, checks: 0 };
  const prefix = prefixOf(freq);
  const dp: Float64Array[] = Array.from(
    { length: n },
    () => new Float64Array(n),
  );
  const opt: Int32Array[] = Array.from({ length: n }, () => new Int32Array(n));
  for (let i = 0; i < n; i++) (opt[i] as Int32Array)[i] = i;
  let checks = 0;
  const useLo = bounds === "both" || bounds === "lower";
  const useHi = bounds === "both" || bounds === "upper";
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const row = dp[i] as Float64Array;
      const lo = useLo ? ((opt[i] as Int32Array)[j - 1] as number) : i;
      const hi = useHi
        ? Math.min((opt[i + 1] as Int32Array)[j] as number, j - 1)
        : j - 1;
      let best = INF;
      let bestK = i;
      for (let k = lo; k <= hi; k++) {
        checks++;
        const val =
          (row[k] as number) + ((dp[k + 1] as Float64Array)[j] as number);
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      row[j] = best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as Int32Array)[j] = bestK;
    }
  }
  return { answer: (dp[0] as Float64Array)[n - 1] as number, checks };
}

/** 가르는 자리를 전부 넣는 구간 DP. 답과 진짜 최적 가르는 자리의 기준이다. */
export const fullScan = (freq: number[]): Counted => counted(freq, "full");

/** 후보를 딱 하나만 넣어 보는 설계. `pick` 이 그 하나를 고른다. */
function onePick(
  freq: number[],
  pick: (i: number, j: number, opt: number[][]) => number,
): number {
  const n = freq.length;
  if (n <= 1) return 0;
  const prefix = prefixOf(freq);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const k = Math.min(Math.max(pick(i, j, opt), i), j - 1);
      (dp[i] as number[])[j] =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = k;
    }
  }
  return (dp[0] as number[])[n - 1] as number;
}

/** 「구간의 가운데 하나」 — 후보를 `⌊(i+j)/2⌋` 하나로 둔다. */
export const middlePick = (freq: number[]): number =>
  onePick(freq, (i, j) => (i + j) >> 1);

/** 「왼쪽 이웃의 자리 하나」 — 후보를 `opt[i][j-1]` 하나로 둔다. */
export const prevPick = (freq: number[]): number =>
  onePick(freq, (i, j, opt) => (opt[i] as number[])[j - 1] as number);

/** 두 조건을 지표 넷의 모든 조합에서 확인한다. */
export function conditions(freq: number[]): {
  tested: number;
  quad: number;
  mono: number;
  firstMono: string;
} {
  const n = freq.length;
  const prefix = prefixOf(freq);
  const S = (i: number, j: number): number =>
    (prefix[j + 1] as number) - (prefix[i] as number);
  let tested = 0;
  let quad = 0;
  let mono = 0;
  let firstMono = "—";
  for (let a = 0; a < n; a++)
    for (let b = a; b < n; b++)
      for (let c = b; c < n; c++)
        for (let d = c; d < n; d++) {
          tested++;
          if (S(a, c) + S(b, d) > S(a, d) + S(b, c)) quad++;
          if (S(b, c) > S(a, d)) {
            mono++;
            if (firstMono === "—") firstMono = `${a}, ${b}, ${c}, ${d}`;
          }
        }
  return { tested, quad, mono, firstMono };
}

/** 최적 가르는 자리의 이웃 관계가 칸마다 성립하는가. 진짜 `opt` 는 전부 넣어서 얻는다. */
export function monotone(freq: number[]): {
  tested: number;
  broken: number;
  first: string;
} {
  const n = freq.length;
  const { opt } = fullScan(freq);
  let tested = 0;
  let broken = 0;
  let first = "—";
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      tested++;
      const mid = (opt[i] as number[])[j] as number;
      const left = (opt[i] as number[])[j - 1] as number;
      const right = (opt[i + 1] as number[])[j] as number;
      if (left <= mid && mid <= Math.min(right, j - 1)) continue;
      broken++;
      if (first === "—") first = `[${i},${j}]`;
    }
  }
  return { tested, broken, first };
}

/* ─────────────────────── 병합 순서 전부 ─────────────────────── */

/** 구간 `[i, j]` 를 합치는 순서 하나 — 식과 합칠 때마다의 비용. */
interface Order {
  expr: string;
  costs: number[];
}

/** 병합 순서를 전부 만든다. 순서의 수가 카탈란 수라 작은 입력에서만 부른다. */
export function orders(freq: readonly number[]): Order[] {
  const prefix = prefixOf(freq);
  const memo = new Map<string, Order[]>();
  const go = (i: number, j: number): Order[] => {
    const key = `${i},${j}`;
    const hit = memo.get(key);
    if (hit) return hit;
    let out: Order[];
    if (i === j) out = [{ expr: String(freq[i]), costs: [] }];
    else {
      out = [];
      const s = (prefix[j + 1] as number) - (prefix[i] as number);
      for (let k = i; k < j; k++)
        for (const a of go(i, k))
          for (const b of go(k + 1, j))
            out.push({
              expr: `(${a.expr}+${b.expr})`,
              costs: [...a.costs, ...b.costs, s],
            });
    }
    memo.set(key, out);
    return out;
  };
  return freq.length === 0 ? [] : go(0, freq.length - 1);
}

/** 병합 순서의 수만 센다 — 순서를 만들지 않고 같은 점화식으로. */
function orderCount(n: number): bigint {
  const c: bigint[] = [1n];
  for (let m = 1; m < n; m++) {
    let s = 0n;
    for (let t = 0; t < m; t++)
      s += (c[t] as bigint) * (c[m - 1 - t] as bigint);
    c.push(s);
  }
  return c[n - 1] as bigint;
}

/* ────────────────────── 사본이 정본과 같은가 ────────────────────── */

function 자기대조(): void {
  const inputs: number[][] = [
    WALK,
    SMALL,
    flat(8),
    line(16),
    head(9),
    up(7),
    tail(9),
    [100],
    [0, 5, 0],
    [10, 20, 30],
  ];
  for (const freq of inputs) {
    const want = knuthOptimization(freq);
    for (const b of ["both", "lower", "upper", "full"] as Bounds[]) {
      if (counted(freq, b).answer !== want)
        throw new Error(`기록하는 사본(${b})이 정본과 다른 답을 낸다`);
      if (countedLite(freq, b).answer !== want)
        throw new Error(`기록 없는 사본(${b})이 정본과 다른 답을 낸다`);
    }
    if (freq.length > 1 && fullScan(freq).checks !== fullBound(freq.length))
      throw new Error("전부 넣는 후보 수의 닫힌 형태가 실측과 다르다");
    if (freq.length <= 9) {
      const all = orders(freq);
      if (BigInt(all.length) !== orderCount(freq.length))
        throw new Error("병합 순서의 수가 점화식과 다르다");
      const min = Math.min(
        ...all.map((o) => o.costs.reduce((s, v) => s + v, 0)),
      );
      if (min !== want)
        throw new Error("병합 순서 전부의 최솟값이 정본과 다르다");
    }
  }
}
자기대조();

/* ────────────────────────── 전개의 걸음 ────────────────────────── */

export type Branch = "①" | "②" | "③" | "④" | "⑤" | "⑥";

/** 전개의 걸음 하나. `T1` 부터 `T8` 까지. */
export interface WalkStep {
  id: string;
  kind: "prep" | "cell" | "return";
  cell: Cell | null;
  /** 걸음이 끝난 뒤의 DP 테이블 — 아직 안 쓴 칸과 구간이 아닌 칸은 `null`. */
  dp: (number | null)[][];
  opt: (number | null)[][];
  branches: Branch[];
}

/** 정본과 같은 절차를 걸음으로 나눈다. 반환값이 정본과 같은지 스스로 확인한다. */
export function walkSteps(freq: number[] = WALK): WalkStep[] {
  const c = counted(freq);
  const n = freq.length;
  if (c.answer !== knuthOptimization(freq))
    throw new Error("걸음 기록이 정본과 다른 답을 낸다");
  const dp: (number | null)[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : null)),
  );
  const opt: (number | null)[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? i : null)),
  );
  const snap = (t: (number | null)[][]) => t.map((r) => r.slice());
  const out: WalkStep[] = [
    {
      id: "T1",
      kind: "prep",
      cell: null,
      dp: snap(dp),
      opt: snap(opt),
      branches: ["②", "③"],
    },
  ];
  let t = 2;
  for (const x of c.cells) {
    (dp[x.i] as (number | null)[])[x.j] = x.best + x.sum;
    (opt[x.i] as (number | null)[])[x.j] = x.bestK;
    const branches: Branch[] = ["④"];
    if (x.updates > 0) branches.push("⑤");
    branches.push("⑥");
    out.push({
      id: `T${t++}`,
      kind: "cell",
      cell: x,
      dp: snap(dp),
      opt: snap(opt),
      branches,
    });
  }
  out.push({
    id: `T${t}`,
    kind: "return",
    cell: null,
    dp: snap(dp),
    opt: snap(opt),
    branches: [],
  });
  return out;
}

/** 걸음 하나가 한 일 한 줄. */
export function stepTitle(s: WalkStep): string {
  if (s.kind === "prep") return "구간 합과 기저를 준비한다";
  if (s.kind === "return") return "맨 위 오른쪽 칸을 돌려준다";
  const x = s.cell as Cell;
  return `칸 [${x.i},${x.j}]${을를(x.j)} 채운다`;
}

/** 칸 하나의 후보 범위 식 — `[opt[0][2], min(opt[1][3], 2)] = [1, min(1, 2)] = [1,1]`. */
export function rangeText(x: Cell): string {
  return `[opt[${x.i}][${x.j - 1}], min(opt[${x.i + 1}][${x.j}], ${x.j - 1})] = [${x.lo}, min(${x.raw}, ${x.j - 1})] = [${x.lo},${x.hi}]`;
}

/** 걸음 하나의 조건 판정 — 분기 조건의 참 · 거짓을 실제 값으로. */
export function stepConditions(s: WalkStep, freq: number[] = WALK): string {
  const n = freq.length;
  if (s.kind === "prep")
    return `\`n <= 1\` 거짓 (n = ${n}) · prefix = ${show(prefixOf(freq))} · opt[i][i] = i`;
  if (s.kind === "return") {
    const v = cell((s.dp[0] as number[])[n - 1] as number);
    return `dp[0][${n - 1}] = ${v}${을를(v)} 돌려준다`;
  }
  const x = s.cell as Cell;
  const parts = [
    `범위 [${x.lo}, min(${x.raw}, ${x.j - 1})] = [${x.lo},${x.hi}]`,
  ];
  for (const c of x.cands)
    parts.push(
      `k=${c.k}: \`${cell(c.val)} < ${cell(c.before)}\` ${c.better ? "참" : "거짓"}`,
    );
  parts.push(
    `dp = ${cell(x.best)} + S(${x.i}, ${x.j}) = ${cell(x.best + x.sum)}`,
  );
  return parts.join(" · ");
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./knuthOptimization-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  knuthOptimization(freq: number[]): number;
}

/** 길이 1 구간의 최적 가르는 자리를 세우는 줄을 뺀 사본. */
const noBase = await loadMutant<Impl>(REF, {
  drop: /for \(let i = 0; i < n; i\+\+\) \(opt\[i\] as number\[\]\)\[i\] = i;/,
});

/** 상한을 이웃 칸으로 안 좁히고 `j - 1` 로만 두는 사본. */
const lowerOnly = await loadMutant<Impl>(REF, {
  swap: [
    /const hi = Math\.min\(\(opt\[i \+ 1\] as number\[\]\)\[j\] as number, j - 1\);/,
    "const hi = j - 1;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 최적 가르는 자리를 적는 줄을 뺀 사본. */
const noOptWrite = await loadMutant<Impl>(REF, {
  drop: /\(opt\[i\] as number\[\]\)\[j\] = bestK;/,
});

const MUTANT_CASES: { label: string; freq: number[] }[] = [
  { label: "전개 입력", freq: WALK },
  { label: "크기가 모두 같은 입력", freq: flat(5) },
  { label: "[10, 20, 30]", freq: [10, 20, 30] },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noBase.knuthOptimization === knuthOptimization;

// 답을 바꾸는 변이 둘은 실제로 바뀌는지, 안 바꾸는 변이 하나는 실제로 안 바뀌는지 실행이 본다.
if (!중화됨) {
  for (const [label, impl] of [
    ["기저를 뺀 판", noBase],
    ["최적 가르는 자리를 적지 않는 판", noOptWrite],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) => knuthOptimization(c.freq) === impl.knuthOptimization(c.freq),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  for (const c of MUTANT_CASES) {
    if (knuthOptimization(c.freq) !== lowerOnly.knuthOptimization(c.freq)) {
      throw new Error("상한만 넓힌 변이가 답을 바꿨다 — 그 절의 주장과 다르다");
    }
  }
  for (const c of MUTANT_CASES) {
    if (
      counted(c.freq, "both", false).answer !== noBase.knuthOptimization(c.freq)
    )
      throw new Error("기저를 뺀 사본이 같은 이름의 변이와 다른 답을 낸다");
    if (counted(c.freq, "lower").answer !== lowerOnly.knuthOptimization(c.freq))
      throw new Error("상한만 넓힌 사본이 같은 이름의 변이와 다른 답을 낸다");
  }
}

/** 변이 하나를 입력 셋에 돌려 정본과 나란히 놓는다. */
function mutantTable(impl: Impl, name: string): string {
  const rows = MUTANT_CASES.map((c) => {
    const want = knuthOptimization(c.freq);
    const got = impl.knuthOptimization(c.freq);
    return [c.label, num(want), num(got), want === got ? "같다" : "다르다"];
  });
  return md(["입력", "정본", name, "판정"], rows, [1, 2]);
}

/* ────────────────────────── 큰 규모 — 한 번만 잰다 ────────────────────────── */

let scaleCache: number | null = null;
/** 과제 규모 `n = 2,000` 의 생성식 배열에서 크누스 최적화의 후보 수. */
export function atScale(): number {
  if (scaleCache === null) scaleCache = countedLite(line(N_MAX)).checks;
  return scaleCache;
}

/** 병합 순서 수의 자릿수 — `n = 2,000` 처럼 수를 만들 수 없는 규모에서도 bigint 로 센다. */
export const orderDigits = (n: number): number => String(orderCount(n)).length;

/* ────────────────────────── 증명 블록 ────────────────────────── */

/** DP 테이블 한 벌을 행 `i` · 열 `j` 표로. 구간이 아닌 칸은 「·」. */
function triTable(t: readonly (readonly number[])[], name: string): string {
  const n = t.length;
  return md(
    [name, ...Array.from({ length: n }, (_, j) => `j = ${j}`)],
    t.map((row, i) => [
      `i = ${i}`,
      ...Array.from({ length: n }, (_, j) =>
        j < i ? "·" : String(row[j] as number),
      ),
    ]),
    Array.from({ length: n }, (_, j) => j + 1),
  );
}

/** 칸 `[i, j]` 의 후보 전부 — 짧은 칸은 전부 넣어 구한 DP 테이블에서. */
export function candidatesOf(
  freq: number[],
  i: number,
  j: number,
): { k: number; left: number; right: number; val: number }[] {
  const { dp } = fullScan(freq);
  const out: { k: number; left: number; right: number; val: number }[] = [];
  for (let k = i; k < j; k++) {
    const left = (dp[i] as number[])[k] as number;
    const right = (dp[k + 1] as number[])[j] as number;
    out.push({ k, left, right, val: left + right });
  }
  return out;
}

/** 「아이디어 상세」가 끝까지 들고 가는 칸. 두 이웃은 `[2,5]` 와 `[3,6]` 이다. */
export const FOCUS = { i: 2, j: 6 };

/** 구간 합 `S(i, j)`. */
const sumOf = (freq: number[], i: number, j: number): number => {
  const p = prefixOf(freq);
  return (p[j + 1] as number) - (p[i] as number);
};

/** 구간 길이마다의 칸 기록. */
export const byLen = (c: Counted): Map<number, Cell[]> => {
  const m = new Map<number, Cell[]>();
  for (const x of c.cells) m.set(x.len, [...(m.get(x.len) ?? []), x]);
  return m;
};

export const PROOFS: Record<string, () => string> = {
  /** 「전체 컨셉」 — 파일 넷을 합치는 순서 전부. */
  "concept-orders": () => {
    const all = orders(WALK)
      .map((o) => ({ ...o, total: o.costs.reduce((s, v) => s + v, 0) }))
      .sort((a, b) => a.total - b.total);
    const rows = all.map((o) => [
      o.expr,
      o.costs.map(num).join(" + "),
      num(o.total),
    ]);
    const best = all[0]?.total as number;
    const want = knuthOptimization(WALK);
    return `${md(["합치는 순서", "합칠 때마다의 비용", "합"], rows, [2])}

순서 ${all.length} 가지 가운데 가장 작은 합은 ${num(best)}${이고(num(best))}, 정본 knuthOptimization 도 ${num(want)}${을를(num(want))} 돌려줍니다.`;
  },

  /** 「전체 컨셉」 — 칸 dp[0][3] 을 가르는 자리마다 계산한다. */
  "concept-cell": () => {
    const n = WALK.length;
    const cands = candidatesOf(WALK, 0, n - 1);
    const best = Math.min(...cands.map((c) => c.val));
    const opt = cands.find((c) => c.val === best)?.k as number;
    const s = sumOf(WALK, 0, n - 1);
    const rows = cands.map((c) => [
      `k = ${c.k}`,
      `왼쪽 [0,${c.k}] · 오른쪽 [${c.k + 1},${n - 1}]`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
    ]);
    return `${md(["가르는 자리", "나뉜 모양", `dp[0][k] + dp[k+1][${n - 1}]`, "값"], rows, [3])}

가장 작은 값은 k = ${opt} 의 ${num(best)}${이고(num(best))}, 마지막 합치기의 비용 S(0, ${n - 1}) = ${num(s)}${을를(num(s))} 더해 dp[0][${n - 1}] = ${num(best + s)} 입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 규모에 맞춘 메모리. */
  "origin-budget": () => {
    const rows = [500, 1_000, N_MAX, 5_000].map((n) => [
      num(n),
      num(2 * n * n),
      `${num((2 * n * n * BYTES) / 1_000_000)} MB`,
    ]);
    return md(
      ["n", "dp 와 opt 의 칸 2n²", "칸마다 8 바이트(어림)"],
      rows,
      [0, 1, 2],
    );
  },

  /** 「아이디어를 떠올리는 과정」 — 병합 순서를 전부 만드는 방법. */
  "origin-orders": () => {
    const rows: string[][] = [];
    for (const n of [4, 8, 9]) {
      const all = orders(line(n));
      rows.push([num(n), num(all.length), "만들어서 센 값"]);
    }
    rows.push([
      num(N_MAX),
      `${num(orderDigits(N_MAX))} 자리 수`,
      "점화식으로 센 수의 자릿수",
    ]);
    return `${md(["n", "병합 순서의 수", "출처"], rows, [0, 1])}

만들어서 센 세 줄은 크기가 freq[i] = (i × 7 mod 5) + 1 인 배열이고, 세 줄 모두 가장 작은 합이 정본의 답과 같습니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 가르는 자리를 전부 넣는 구간 DP. */
  "origin-full": () => {
    const rows = [8, 64, 256].map((n) => {
      const c = countedLite(line(n), "full").checks;
      if (c !== fullBound(n))
        throw new Error("전부 넣는 후보 수가 식과 다르다");
      return [num(n), num(c), "센 값", seconds(c)];
    });
    rows.push([
      num(N_MAX),
      num(fullBound(N_MAX)),
      "식 — n(n²−1)/6",
      seconds(fullBound(N_MAX)),
    ]);
    return `${md(["n", "후보 수", "출처", "시간(초당 1 억 개 · 어림)"], rows, [0, 1, 3])}

센 값 세 줄은 식 n(n²−1)/6 과 같습니다. 이 방법은 칸마다 가르는 자리를 전부 넣으므로 후보 수가 입력의 값과 무관합니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 최적 가르는 자리를 전부 구해 본다. */
  "origin-opt": () => {
    const { opt } = fullScan(SMALL);
    return `${triTable(opt, "opt[i][j]")}

freq = ${arr(SMALL)} 에서 가르는 자리를 전부 넣어 구한 값입니다. 「·」 는 i > j 라 구간이 아닌 칸입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 후보를 하나로 줄이는 단순한 두 방법. */
  "origin-one-pick": () => {
    const inputs: [string, number[]][] = [
      ["전개 입력 [1, 3, 5, 2]", WALK],
      ["[10, 20, 30]", [10, 20, 30]],
      ["크기가 모두 같은 배열 (n = 8)", flat(8)],
      ["생성식 배열 (n = 16)", line(16)],
      ["첫 파일만 큰 배열 (n = 9)", head(9)],
    ];
    let wrongMid = 0;
    let wrongPrev = 0;
    const rows = inputs.map(([label, f]) => {
      const want = knuthOptimization(f);
      const m = middlePick(f);
      const p = prevPick(f);
      if (m !== want) wrongMid++;
      if (p !== want) wrongPrev++;
      return [label, num(want), num(m), num(p)];
    });
    return `${md(["입력", "가장 작은 합", "구간의 가운데 하나", "왼쪽 이웃의 자리 하나"], rows, [1, 2, 3])}

입력 ${inputs.length} 개 가운데 「구간의 가운데 하나」는 ${wrongMid} 개, 「왼쪽 이웃의 자리 하나」는 ${wrongPrev} 개에서 가장 작은 합과 다른 값을 냅니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 같은 입력의 첫 줄을 두 방식으로 채운다. */
  "origin-two": () => {
    const full = fullScan(SMALL);
    const both = counted(SMALL);
    const rows: string[][] = [];
    for (let j = 1; j < SMALL.length; j++) {
      const a = full.cells.find((x) => x.i === 0 && x.j === j) as Cell;
      const b = both.cells.find((x) => x.i === 0 && x.j === j) as Cell;
      rows.push([
        `[0,${j}]`,
        `[${a.lo},${a.hi}] · ${a.cands.length} 개`,
        `[${b.lo},${b.hi}] · ${b.cands.length} 개`,
        String(b.bestK),
      ]);
    }
    const rowFull = full.cells
      .filter((x) => x.i === 0)
      .reduce((s, x) => s + x.cands.length, 0);
    const rowBoth = both.cells
      .filter((x) => x.i === 0)
      .reduce((s, x) => s + x.cands.length, 0);
    return `${md(["칸", "전부 넣는 후보", "이웃 두 칸 사이의 후보", "opt[0][j]"], rows)}

줄 i = 0 에서 전부 넣으면 후보 ${num(rowFull)} 개, 이웃 두 칸 사이만 넣으면 ${num(rowBoth)} 개입니다. 칸 ${both.cells.length} 개를 모두 더하면 ${num(full.checks)} 개와 ${num(both.checks)} 개이고, 두 방식의 답은 ${num(both.answer)}${으로(num(both.answer))} 같습니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 규모를 키워 두 방식을 잰다. */
  "origin-sweep": () => {
    const rows: string[][] = [];
    for (const [label, gen] of [
      ["생성식 배열", line],
      ["첫 파일만 큰 배열", head],
    ] as [string, (n: number) => number[]][]) {
      for (const n of [64, 256]) {
        const a = fullBound(n);
        const b = countedLite(gen(n)).checks;
        rows.push([
          label,
          num(n),
          num(a),
          num(b),
          `${((b / a) * 100).toFixed(1)} %`,
        ]);
      }
    }
    return md(
      ["입력", "n", "전부 넣기", "이웃 두 칸 사이", "전부 넣기에 대한 비"],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** 「아이디어를 떠올리는 과정」 — 과제 규모에서 두 방식. */
  "origin-scale": () => {
    const a = fullBound(N_MAX);
    const b = atScale();
    return `${md(
      ["방법", "후보 수", "출처", "시간(초당 1 억 개 · 어림)"],
      [
        ["가르는 자리 전부 넣기", num(a), "식 — n(n²−1)/6", seconds(a)],
        ["이웃 두 칸 사이만 넣기", num(b), "센 값", seconds(b)],
      ],
      [1, 3],
    )}

생성식 배열 freq[i] = (i × 7 mod 5) + 1 을 n = ${num(N_MAX)}${으로(num(N_MAX))} 만든 값입니다. 두 수의 비는 ${num(Math.round(a / b))} 배입니다.`;
  },

  /** 「아이디어 상세」 (c) — 칸 하나를 가르는 자리마다 읽는다. */
  "build-read": () => {
    const { i, j } = FOCUS;
    const cands = candidatesOf(SMALL, i, j);
    const best = Math.min(...cands.map((c) => c.val));
    const opt = cands.find((c) => c.val === best)?.k as number;
    const s = sumOf(SMALL, i, j);
    const rows = cands.map((c) => [
      `k = ${c.k}`,
      `[${i},${c.k}] · [${c.k + 1},${j}]`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
      c.k === opt ? "가장 작다" : "",
    ]);
    return `${md(["가르는 자리", "왼쪽 · 오른쪽 조각", `dp[${i}][k] + dp[k+1][${j}]`, "값", "비교"], rows, [3])}

가장 작은 값은 ${num(best)}${이고(num(best))} opt[${i}][${j}] = ${opt} 입니다. S(${i}, ${j}) = ${num(s)}${을를(num(s))} 더해 dp[${i}][${j}] = ${num(best + s)} 입니다.`;
  },

  /** 「아이디어 상세」 (d) — 이웃 관계가 칸마다 성립하는가. */
  "build-neighbors": () => {
    const inputs: [string, number[]][] = [
      [`${arr(SMALL)}`, SMALL],
      ["크기가 모두 같은 배열 (n = 8)", flat(8)],
      ["첫 파일만 큰 배열 (n = 9)", head(9)],
      ["뒤로 갈수록 커지는 배열 (n = 7)", up(7)],
      ["전개 입력 [1, 3, 5, 2]", WALK],
      [`음수가 섞인 배열 ${arr(NEG)}`, NEG],
    ];
    const rows = inputs.map(([label, f]) => {
      const m = monotone(f);
      return [label, num(m.tested), num(m.broken), m.first];
    });
    return md(
      ["입력", "확인한 칸", "이웃 관계를 어긴 칸", "처음 어긴 칸"],
      rows,
      [1, 2],
    );
  },

  /** 「아이디어 상세」 (e) — 구간의 가운데와 최적 가르는 자리. */
  "build-contrast": () => {
    const f = head(9);
    const { opt } = fullScan(f);
    const rows: string[][] = [];
    for (const j of [2, 4, 6, 8]) {
      rows.push([
        `[0,${j}]`,
        String((0 + j) >> 1),
        String((opt[0] as number[])[j]),
      ]);
    }
    const m = middlePick(f);
    return `${md(["칸", "구간의 가운데 ⌊(i+j)/2⌋", "opt[0][j]"], rows, [1, 2])}

첫 파일만 큰 배열 (n = ${f.length}) 입니다. 이 입력에서 「구간의 가운데 하나」만 넣으면 ${num(m)}${이가(num(m))} 나오고, 가장 작은 합은 ${num(knuthOptimization(f))} 입니다.`;
  },

  /** 「아이디어 상세」 1단계 — 기저가 길이 2 칸의 후보 범위를 정한다. */
  "build-base": () => {
    const c = counted(WALK);
    const rows = c.cells
      .filter((x) => x.len === 2)
      .map((x) => [
        `[${x.i},${x.j}]`,
        `opt[${x.i}][${x.i}] = ${x.lo}`,
        `opt[${x.j}][${x.j}] = ${x.raw}`,
        `min(${x.raw}, ${x.j - 1}) = ${x.hi}`,
        `[${x.lo},${x.hi}]`,
      ]);
    return md(
      ["칸", "하한", "아래 이웃의 자리", "j − 1 로 자른 상한", "후보 범위"],
      rows,
    );
  },

  /** 「아이디어 상세」 2단계 — 범위를 네 가지로 잡아 같은 칸을 채운다. */
  "build-range": () => {
    const { i, j } = FOCUS;
    const rows = (
      [
        ["전부", "full"],
        [`opt[${i}][${j - 1}] 부터`, "lower"],
        [`opt[${i + 1}][${j}] 까지`, "upper"],
        ["두 이웃 사이", "both"],
      ] as [string, Bounds][]
    ).map(([label, b]) => {
      const x = counted(SMALL, b).cells.find(
        (c) => c.i === i && c.j === j,
      ) as Cell;
      return [
        label,
        `[${x.lo},${x.hi}]`,
        num(x.cands.length),
        num(x.best + x.sum),
        String(x.bestK),
      ];
    });
    return md(
      ["후보 범위", "가르는 자리", "후보 수", "칸의 값", "찾은 자리"],
      rows,
      [2, 3, 4],
    );
  },

  /** 「아이디어 상세」 3단계 — 범위 안에서 칸 하나를 채운다. */
  "build-fill": () => {
    const { i, j } = FOCUS;
    const x = counted(SMALL).cells.find((c) => c.i === i && c.j === j) as Cell;
    const rows = x.cands.map((c) => [
      `k = ${c.k}`,
      num(c.val),
      `${num(c.val)} < ${cell(c.before)} ${c.better ? "참" : "거짓"}`,
      c.better ? `best = ${num(c.val)} · bestK = ${c.k}` : "그대로",
    ]);
    const v = num(x.best + x.sum);
    return `${md(["가르는 자리", "dp[i][k] + dp[k+1][j]", "최솟값과의 비교", "고친 것"], rows, [1])}

칸 [${i},${j}] 의 후보 범위는 [${x.lo},${x.hi}] 입니다. 가장 작은 값 ${num(x.best)} 에 S(${i}, ${j}) = ${num(x.sum)}${을를(num(x.sum))} 한 번 더해 dp[${i}][${j}] = ${v}${을를(v)}, opt[${i}][${j}] 에는 ${x.bestK}${을를(x.bestK)} 적습니다.`;
  },

  /** 「아이디어 상세」 4단계 — 대각선 하나의 후보 수가 「칸 수 + 양 끝의 차」에 갇힌다. */
  "build-diagonal": () => {
    const c = counted(SMALL);
    const rows = [...byLen(c).entries()].map(([len, xs]) => {
      const first = xs[0] as Cell;
      const last = xs[xs.length - 1] as Cell;
      const gap = last.raw - first.lo;
      const checks = xs.reduce((t, x) => t + x.cands.length, 0);
      return [
        num(len),
        num(xs.length),
        num(checks),
        `${first.lo} → ${last.raw}`,
        num(gap),
        num(xs.length + gap),
      ];
    });
    return `${md(
      [
        "구간 길이",
        "칸 수",
        "후보 수 합",
        "처음 하한 → 마지막 상한",
        "그 차",
        "칸 수 + 그 차",
      ],
      rows,
      [0, 1, 2, 4, 5],
    )}

freq = ${arr(SMALL)} 입니다. 후보 수는 모두 ${num(c.checks)}${이고(num(c.checks))}, 가르는 자리를 전부 넣으면 ${num(fullBound(SMALL.length))} 입니다.`;
  },

  /** 「이 방법이 기대는 전제」 — 두 조건을 지표 넷의 모든 조합에서 확인한다. */
  "build-premise-quad": () => {
    const rows: [string, number[]][] = [
      ["전개 입력 (n = 4)", WALK],
      [`${arr(SMALL)} (n = 8)`, SMALL],
      ["생성식 배열 (n = 16)", line(16)],
      ["첫 파일만 큰 배열 (n = 9)", head(9)],
      [`음수가 섞인 배열 ${arr(NEG)}`, NEG],
    ];
    return md(
      [
        "입력",
        "확인한 지표 조합",
        "사각 부등식을 어긴 조합",
        "단조성을 어긴 조합",
        "처음 어긴 단조성 (a, b, c, d)",
      ],
      rows.map(([label, f]) => {
        const q = conditions(f);
        return [label, num(q.tested), num(q.quad), num(q.mono), q.firstMono];
      }),
      [1, 2, 3],
    );
  },

  /** 「이 방법이 기대는 전제」 — 단조성이 깨진 입력에 크누스 최적화를 실행한다. */
  "build-premise-break": () => {
    const f = NEG;
    const full = fullScan(f);
    const both = counted(f);
    const n = f.length;
    const x = both.cells.find((c) => c.i === 0 && c.j === n - 1) as Cell;
    const rows = candidatesOf(f, 0, n - 1).map((c) => [
      `k = ${c.k}`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
      c.k >= x.lo && c.k <= x.hi ? "넣는다" : "범위 밖",
    ]);
    const real = (full.opt[0] as number[])[n - 1] as number;
    const left = String(x.lo);
    const got = num(knuthOptimization(f));
    return `opt[0][${n - 2}] = ${left}${josa(left, "이라", "라")} 칸 [0,${n - 1}] 의 하한이 ${left}${이고(left)}, 후보 범위는 [${x.lo},${x.hi}] 입니다.

${md(["가르는 자리", `dp[0][k] + dp[k+1][${n - 1}]`, "값", "크누스 최적화"], rows, [2])}

진짜 최적 가르는 자리는 ${real} 인데 범위 밖이라, 크누스 최적화는 ${got}${을를(got)} 돌려주고 가장 작은 합은 ${num(full.answer)} 입니다.`;
  },

  /** 「수행으로 알아보는 알고리즘」 도입 — 고정 입력. */
  "walk-input": () => {
    const v = String(knuthOptimization(WALK));
    return [
      `const freq = ${arr(WALK)};`,
      `// 이 절이 끝나면 ${v}${이가(v)} 나와야 한다`,
    ].join("\n");
  },

  /** 「수행으로 알아보는 알고리즘」 도입 — 파일 몇 개부터 범위가 좁아지는가. */
  "walk-input-choice": () => {
    const rows = [2, 3, 4].map((n) => {
      let total = 0;
      let narrowed = 0;
      let both = 0;
      const full = fullBound(n);
      const walk = (a: number[]): void => {
        if (a.length === n) {
          total++;
          const c = counted(a);
          if (c.checks < full) narrowed++;
          if (c.cells.some((x) => x.lo > x.i && x.hi < x.j - 1)) both++;
          return;
        }
        for (let v = 0; v <= 9; v++) walk([...a, v]);
      };
      walk([]);
      return [num(n), num(total), num(narrowed), num(both)];
    });
    const cells = counted(WALK)
      .cells.filter((x) => x.lo > x.i && x.hi < x.j - 1)
      .map((x) => `[${x.i},${x.j}]`);
    return `${md(
      [
        "파일 수",
        "크기 0~9 로 만든 배열 전부",
        "후보가 줄어든 배열",
        "하한과 상한이 함께 좁아진 칸이 있는 배열",
      ],
      rows,
      [0, 1, 2, 3],
    )}

전개 입력 ${arr(WALK)} 에서 그런 칸은 ${cells.join(" · ")} ${cells.length === 1 ? "하나" : `${cells.length} 개`}입니다.`;
  },

  /** 전개 1 — 구간 합과 기저를 준비한 뒤의 상태. */
  "walk-prep": () => {
    const s = walkSteps()[0] as WalkStep;
    const p = prefixOf(WALK);
    const a = p[4] as number;
    const b = p[1] as number;
    return md(
      ["배열", "T1 뒤의 값", "적은 까닭"],
      [
        [
          "prefix",
          show(p),
          `S(1, 3) = prefix[4] − prefix[1] = ${a} − ${b} = ${a - b}`,
        ],
        [
          "dp[i][i]",
          show(s.dp.map((r, i) => r[i] as number)),
          "파일 하나짜리 구간은 합칠 것이 없다",
        ],
        [
          "opt[i][i]",
          show(s.opt.map((r, i) => r[i] as number)),
          "가르는 자리를 자기 번호로 둔다",
        ],
      ],
    );
  },

  /** 전개 2 — 길이 2 대각선의 칸 셋. */
  "walk-len2": () => {
    const steps = walkSteps().filter(
      (s) => s.kind === "cell" && s.cell?.len === 2,
    );
    const lines: string[] = [];
    for (const s of steps) {
      const x = s.cell as Cell;
      lines.push(`${s.id} — 칸 [${x.i},${x.j}]`);
      lines.push(`  후보 범위  ${rangeText(x)}`);
      for (const c of x.cands)
        lines.push(
          `  k = ${c.k}      dp[${x.i}][${c.k}] + dp[${c.k + 1}][${x.j}] = ${cell(c.val)}`,
        );
      lines.push(
        `  채움       dp[${x.i}][${x.j}] = ${cell(x.best)} + S(${x.i}, ${x.j}) = ${cell(x.best + x.sum)} · opt[${x.i}][${x.j}] = ${x.bestK}`,
      );
      lines.push("");
    }
    lines.pop();
    return lines.join("\n");
  },

  /** 짚고 가기 — 기저의 최적 가르는 자리를 안 세우면. */
  "pause-no-base": () => mutantTable(noBase, "기저를 뺀 판"),

  /** 짚고 가기 — 기저를 뺀 판의 DP 테이블을 정본과 나란히 놓는다. */
  "pause-no-base-rows": () => {
    const a = counted(WALK);
    const b = counted(WALK, "both", false);
    const row = (t: number[][], i: number) =>
      (t[i] as number[]).map((v, j) => (j < i ? "·" : cell(v))).join(" ");
    const rows = WALK.map((_, i) => [
      `i = ${i}`,
      row(a.dp, i),
      row(b.dp, i),
      row(a.opt, i),
      row(b.opt, i),
    ]);
    const len2Same = a.cells
      .filter((x) => x.len === 2)
      .every(
        (x) => (b.dp[x.i] as number[])[x.j] === (a.dp[x.i] as number[])[x.j],
      );
    const va = num(a.answer);
    return `${md(["줄", "정본 dp", "기저를 뺀 판 dp", "정본 opt", "기저를 뺀 판 opt"], rows)}

길이 2 칸의 dp 는 두 판이 ${len2Same ? "같고" : "다르고"}, 반환값은 ${va}${과와(va)} ${num(b.answer)} 입니다.`;
  },

  /** 짚고 가기 — 기저를 뺀 판에서 첫 줄의 긴 칸 둘이 어떻게 채워지는가. */
  "pause-no-base-why": () => {
    const b = counted(WALK, "both", false);
    const lines: string[] = [];
    for (const x of b.cells.filter((c) => c.len >= 3 && c.i === 0)) {
      lines.push(`기저를 뺀 판의 칸 [${x.i},${x.j}]`);
      lines.push(`  후보 범위  ${rangeText(x)}`);
      for (const c of x.cands)
        lines.push(
          `  k = ${c.k}      dp[${x.i}][${c.k}] + dp[${c.k + 1}][${x.j}] = ${cell(c.val)}`,
        );
      lines.push(
        `  채움       ${cell(x.best)} + S(${x.i}, ${x.j}) = ${cell(x.best)} + ${cell(x.sum)} = ${cell(x.best + x.sum)}`,
      );
      lines.push("");
    }
    lines.pop();
    return lines.join("\n");
  },

  /** 전개 3 — 길이 3 대각선의 칸 둘. */
  "walk-len3": () => {
    const steps = walkSteps().filter(
      (s) => s.kind === "cell" && s.cell?.len === 3,
    );
    const lines: string[] = [];
    for (const s of steps) {
      const x = s.cell as Cell;
      lines.push(`${s.id} — 칸 [${x.i},${x.j}]`);
      lines.push(`  후보 범위  ${rangeText(x)}`);
      for (const c of x.cands)
        lines.push(
          `  k = ${c.k}      dp[${x.i}][${c.k}] + dp[${c.k + 1}][${x.j}] = ${cell(c.val)}${c.k === x.bestK ? "   ← 최솟값" : ""}`,
        );
      lines.push(
        `  채움       dp[${x.i}][${x.j}] = ${cell(x.best)} + S(${x.i}, ${x.j}) = ${cell(x.best + x.sum)} · opt[${x.i}][${x.j}] = ${x.bestK}`,
      );
      lines.push("");
    }
    lines.pop();
    return lines.join("\n");
  },

  /** 짚고 가기 — 상한을 이웃 칸으로 안 좁혀도 답은 안 바뀐다. */
  "pause-lower": () => mutantTable(lowerOnly, "상한을 안 좁힌 판"),

  /** 짚고 가기 — 답이 같은 대신 후보가 몇 배로 늘어나는가. */
  "pause-lower-scale": () => {
    const rows = [4, 16, 64, 200, 500].map((n) => {
      const f = line(n);
      const a = countedLite(f);
      const b = countedLite(f, "lower");
      if (a.answer !== b.answer)
        throw new Error("상한만 넓힌 사본이 답을 바꿨다");
      return [
        num(n),
        num(a.checks),
        num(b.checks),
        (b.checks / a.checks).toFixed(1),
        num(fullBound(n)),
      ];
    });
    return `${md(["n", "정본", "상한을 안 좁힌 판", "그 배", "전부 넣은 후보 수"], rows, [0, 1, 2, 3, 4])}

생성식 배열에서 센 후보 수입니다. 정본과 상한을 안 좁힌 판의 답은 모든 줄에서 같습니다.`;
  },

  /** 전개 4 — 걸음마다 조건 판정. */
  "walk-trace": () => {
    const steps = walkSteps();
    const rows = steps.map((s) => {
      const x = s.cell;
      const filled =
        x === null
          ? s.kind === "prep"
            ? "대각선 넷"
            : "—"
          : `dp[${x.i}][${x.j}] = ${cell(x.best + x.sum)} · opt[${x.i}][${x.j}] = ${x.bestK}`;
      return [
        s.id,
        stepTitle(s),
        s.branches.join(""),
        stepConditions(s),
        filled,
      ];
    });
    const c = counted(WALK);
    return `${md(["걸음", "한 일", "갈래", "조건 판정", "채운 칸"], rows)}

후보 수 ${num(c.checks)} · 채운 칸 ${c.cells.length} 개 · 반환값 ${num(c.answer)} 입니다.`;
  },

  /** 전개 4 — 칸마다 넣은 후보와 채운 값. */
  "walk-candidates": () => {
    const steps = walkSteps().filter((s) => s.kind === "cell");
    const rows = steps.map((s) => {
      const x = s.cell as Cell;
      return [
        s.id,
        `[${x.i},${x.j}]`,
        num(x.sum),
        String(x.lo),
        x.raw === x.hi ? String(x.raw) : `${x.raw} → ${x.hi}`,
        x.cands.map((v) => `k=${v.k}: ${cell(v.val)}`).join(" · "),
        cell(x.best + x.sum),
        String(x.bestK),
      ];
    });
    return `${md(["걸음", "칸", "S(i, j)", "하한", "상한", "후보 값", "채운 값", "opt"], rows, [2, 3, 6, 7])}

상한 열의 「a → b」 는 아래 이웃 칸의 자리 a 를 j − 1 로 자른 값 b 입니다. 후보 수는 ${num(counted(WALK).checks)}, 가르는 자리를 전부 넣으면 ${num(fullBound(WALK.length))} 입니다.`;
  },

  /** 전개 4 — 여섯 갈래가 어느 입력에서 몇 번 실행되는가. */
  "walk-branches": () => {
    const labels: [string, string][] = [
      ["①", "파일이 하나 이하면 곧장 0 을 돌려준다"],
      ["②", "구간 합을 미리 더해 둔다"],
      ["③", "길이 1 구간의 최적 가르는 자리를 세운다"],
      ["④", "후보 범위를 이웃 두 칸으로 잡는다"],
      ["⑤", "최솟값과 그 가르는 자리를 고친다"],
      ["⑥", "칸을 채운다"],
    ];
    const inputs: [string, number[]][] = [
      ["전개 입력", WALK],
      ["파일 하나 [100]", [100]],
      ["크기가 모두 같은 배열 (n = 5)", flat(5)],
    ];
    const count = (freq: number[]): number[] => {
      const n = freq.length;
      if (n <= 1) return [1, 0, 0, 0, 0, 0];
      const c = counted(freq);
      return [
        0,
        n,
        n,
        c.cells.length,
        c.cells.reduce((t, x) => t + x.updates, 0),
        c.cells.length,
      ];
    };
    const counts = inputs.map(([, f]) => count(f));
    return md(
      ["라벨", "갈래", ...inputs.map(([label]) => label)],
      labels.map(([mark, text], r) => [
        mark,
        text,
        ...counts.map((c) => num(c[r] as number)),
      ]),
      [2, 3, 4],
    );
  },

  /** 전체 코드 — 여러 입력에서 가르는 자리를 전부 넣은 답과 대조한다. */
  "final-calls": () => {
    const inputs: number[][] = [
      WALK,
      [10, 20, 30],
      [40, 30, 30, 20],
      [100],
      [0, 0, 0, 0],
      SMALL,
    ];
    return md(
      ["입력", "knuthOptimization", "가르는 자리 전부 넣기"],
      inputs.map((f) => [
        arr(f),
        num(knuthOptimization(f)),
        num(f.length <= 1 ? 0 : fullScan(f).answer),
      ]),
      [1, 2],
    );
  },

  /** 알아 두면 좋은 개념 — 대각선 하나에서 항이 지워지는 모양. */
  "related-telescope": () => {
    const c = counted(SMALL);
    const len = 4;
    const xs = byLen(c).get(len) as Cell[];
    const rows = xs.map((x) => [
      `[${x.i},${x.j}]`,
      `opt[${x.i}][${x.j - 1}] = ${x.lo}`,
      `opt[${x.i + 1}][${x.j}] = ${x.raw}`,
      `${x.raw} − ${x.lo} + 1 = ${x.raw - x.lo + 1}`,
      num(x.cands.length),
    ]);
    const first = xs[0] as Cell;
    const last = xs[xs.length - 1] as Cell;
    const total = xs.reduce((s, x) => s + x.cands.length, 0);
    const lastHi = String(last.raw);
    const sum = num(xs.length + last.raw - first.lo);
    return `${md(["칸", "하한", "상한", "상한 − 하한 + 1", "실제 후보 수"], rows, [4])}

freq = ${arr(SMALL)} 의 구간 길이 ${len} 대각선입니다. 칸마다의 상한이 다음 칸의 하한과 같아서, 합은 칸 수 ${xs.length} 에 마지막 상한 ${lastHi}${과와(lastHi)} 처음 하한 ${first.lo} 의 차를 더한 ${sum}${이고(sum)}, 실제 후보 수 합도 ${num(total)} 입니다.`;
  },

  /** 경쟁 설계와의 대조 — 분할 정복 최적화 편의 `.alt.ts` 가 잰 값. */
  "alt-table": () => {
    const s = sweepK();
    const rows: string[][] = [
      [
        "크누스 최적화 (이 가이드)",
        ...K_SHOWN.map((k) => num(countAt(s.kn, k))),
        num(s.knCells),
      ],
      [
        "분할 정복 최적화",
        ...K_SHOWN.map((k) => num(countAt(s.dc, k))),
        num(s.dcCells),
      ],
    ];
    return md(
      ["설계", ...K_SHOWN.map((k) => `k = ${num(k)} · 후보 수`), "추가 칸"],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** 경쟁 설계와의 대조 — 순서가 뒤집히는 자리. */
  "alt-flip": () => {
    const s = sweepK();
    const c = crossing();
    const ks = [2, 10, 50, 100, c.last, c.first, 500, 1_000, ALT_N];
    const rows = ks.map((k) => {
      const kn = countAt(s.kn, k);
      const dc = countAt(s.dc, k);
      return [
        num(k),
        num(kn),
        num(dc),
        kn < dc ? "크누스 최적화" : "분할 정복 최적화",
      ];
    });
    const last = String(c.last);
    const first = String(c.first);
    return `${md(["구역 수 k", "크누스 최적화 · 후보 수", "분할 정복 최적화 · 후보 수", "적은 쪽"], rows, [0, 1, 2])}

a = [1, 2, …, ${num(ALT_N)}] 입니다. k = 2 부터 ${num(ALT_N)} 까지 모두 재면 분할 정복 최적화가 적은 마지막 k 가 ${last}, 크누스 최적화가 적은 첫 k 가 ${first}${이고(first)}, 그 뒤로 다시 뒤집히지 않습니다.`;
  },

  /** 수식 정의와 유도 — 정의를 전개 입력의 마지막 칸에 넣어 검산한다. */
  "math-check": () => {
    const f = fullScan(WALK);
    const n = WALK.length;
    const t = n - 1;
    const p = prefixOf(WALK);
    const rows: string[][] = [];
    let best = INF;
    for (let k = 0; k < t; k++) {
      const a = (f.dp[0] as number[])[k] as number;
      const b = (f.dp[k + 1] as number[])[t] as number;
      best = Math.min(best, a + b);
      rows.push([
        `k = ${k}`,
        `dp[0][${k}] + dp[${k + 1}][${t}]`,
        `${num(a)} + ${num(b)}`,
        num(a + b),
      ]);
    }
    const s = (p[t + 1] as number) - (p[0] as number);
    const v = num(best + s);
    const want = num(knuthOptimization(WALK));
    return `S(0, ${t}) = prefix[${t + 1}] − prefix[0] = ${num(p[t + 1] as number)} − 0 = ${num(s)} 입니다.

${md(["가르는 자리", "더하는 칸", "값", "합"], rows, [3])}

가장 작은 합 ${num(best)} 에 S(0, ${t})${을를(t)} 더해 dp[0][${t}] = ${v}${이고(v)} opt[0][${t}] = ${(f.opt[0] as number[])[t]} 입니다. 정본 knuthOptimization 도 ${want}${을를(want)} 돌려줍니다.`;
  },

  /** 수식 정의와 유도 — DP 테이블 `dp` 가 사각 부등식을 만족하는지 지표 넷 전부로 본다. */
  "math-dp-quad": () => {
    const inputs: [string, number[]][] = [
      ["전개 입력 [1, 3, 5, 2]", WALK],
      [`${arr(SMALL)}`, SMALL],
      ["크기가 모두 같은 배열 (n = 8)", flat(8)],
      ["첫 파일만 큰 배열 (n = 9)", head(9)],
      [`음수가 섞인 배열 ${arr(NEG)}`, NEG],
    ];
    const rows = inputs.map(([label, f]) => {
      const { dp } = fullScan(f);
      const n = f.length;
      const at = (a: number, b: number) => (dp[a] as number[])[b] as number;
      let tested = 0;
      let broken = 0;
      let first = "—";
      for (let i = 0; i < n; i++)
        for (let i2 = i; i2 < n; i2++)
          for (let j = i2; j < n; j++)
            for (let j2 = j; j2 < n; j2++) {
              tested++;
              if (at(i, j) + at(i2, j2) > at(i, j2) + at(i2, j)) {
                broken++;
                if (first === "—") first = `${i}, ${i2}, ${j}, ${j2}`;
              }
            }
      return [label, num(tested), num(broken), first];
    });
    return md(
      [
        "입력",
        "확인한 지표 조합",
        "어긴 조합",
        "처음 어긴 조합 (i, i′, j, j′)",
      ],
      rows,
      [1, 2],
    );
  },

  /** 수식 정의와 유도 — 닫힌 형태를 실측과 대조하고 과제 규모의 수치를 낸다. */
  "math-bound": () => {
    const rows = [16, 64, 256, 1024].map((n) => {
      const checks = countedLite(line(n)).checks;
      if (checks > narrowBound(n)) throw new Error("실측이 상한을 넘는다");
      return [
        num(n),
        num(checks),
        num(narrowBound(n)),
        (checks / narrowBound(n)).toFixed(3),
        num(fullBound(n)),
      ];
    });
    const b = narrowBound(N_MAX);
    const a = num(fullBound(N_MAX));
    return `${md(["n", "센 후보 수", "n(n−1)/2 + (n−1)(n−2)", "그 비", "전부 넣은 후보 수"], rows, [0, 1, 2, 3, 4])}

생성식 배열에서 센 값입니다. 과제 규모 n = ${num(N_MAX)} 에서 상한은 ${num(b)}, 전부 넣으면 ${a}${josa(a, "이라", "라")} ${(fullBound(N_MAX) / b).toFixed(1)} 배이고, 같은 규모에서 실제로 센 후보 수는 ${num(atScale())} 입니다.`;
  },

  /** 불변식 — 칸마다 진짜 최적 가르는 자리가 넘긴 범위 안에 있는가. */
  "invariant-watch": () => {
    const steps = walkSteps().filter((s) => s.kind === "cell");
    const f = fullScan(WALK);
    const rows = steps.map((s) => {
      const x = s.cell as Cell;
      const real = (f.opt[x.i] as number[])[x.j] as number;
      return [
        s.id,
        `[${x.i},${x.j}]`,
        `[${x.lo},${x.hi}]`,
        String(real),
        real >= x.lo && real <= x.hi ? "지킨다" : "깨진다",
      ];
    });
    return md(["걸음", "칸", "넣은 범위", "진짜 opt", "불변식"], rows, [3]);
  },

  /** 불변식 — 경계 입력에서도 같은 문장이 유지되는가. */
  "invariant-edges": () => {
    const inputs: [string, number[]][] = [
      ["파일 하나", [100]],
      ["파일 둘", [5, 7]],
      ["크기가 전부 0", [0, 0, 0, 0]],
      ["0 이 섞인 입력", [0, 5, 0]],
      ["크기가 모두 같은 입력", [10, 10, 10, 10]],
      ["첫 파일만 큰 입력 (n = 5)", head(5)],
    ];
    return md(
      ["입력", "n", "반환값", "전부 넣은 답", "후보 수", "이웃 관계를 어긴 칸"],
      inputs.map(([label, f]) => [
        label,
        num(f.length),
        num(knuthOptimization(f)),
        num(f.length <= 1 ? 0 : fullScan(f).answer),
        num(countedLite(f).checks),
        f.length <= 1 ? "—" : num(monotone(f).broken),
      ]),
      [1, 2, 3, 4, 5],
    );
  },

  /** 불변식 ③ — 불변식을 지키던 줄을 빼면 어떤 값이 나오는가. */
  "mutant-no-opt-write": () => mutantTable(noOptWrite, "자리를 안 적는 판"),

  /** 비용을 세는 과정 — 걸음마다의 후보 수와 누적. */
  "perf-walk": () => {
    const steps = walkSteps();
    let acc = 0;
    const rows = steps.map((s) => {
      const x = s.cell;
      const here = x?.cands.length ?? 0;
      acc += here;
      return [
        s.id,
        x ? `[${x.i},${x.j}]` : "—",
        x ? `[${x.lo},${x.hi}]` : "—",
        num(here),
        num(acc),
      ];
    });
    const total = num(acc);
    return `${md(["걸음", "칸", "후보 범위", "이 걸음의 후보 수", "누적"], rows, [3, 4])}

채운 칸 ${counted(WALK).cells.length} 개 · 후보 수 ${total}${이고(total)}, 가르는 자리를 전부 넣으면 ${num(fullBound(WALK.length))} 입니다.`;
  },

  /** 케이스별 비용 — 규모별 후보 수와 칸 수에 대한 비. */
  "perf-observed": () => {
    const shapes: [string, (n: number) => number[]][] = [
      ["크기가 모두 같은 배열", flat],
      ["생성식 배열", line],
      ["첫 파일만 큰 배열", head],
    ];
    const rows = shapes.flatMap(([label, gen]) =>
      [128, 512].map((n) => {
        const checks = countedLite(gen(n)).checks;
        const cellCount = (n * (n - 1)) / 2;
        return [
          label,
          num(n),
          num(checks),
          (checks / cellCount).toFixed(2),
          num(fullBound(n)),
        ];
      }),
    );
    return md(
      ["배열", "n", "후보 수", "칸 하나당", "전부 넣은 후보 수"],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** 최악을 만드는 입력 — 어느 모양이 후보를 가장 많이 만드는가. */
  "perf-worst-shape": () => {
    const n = 256;
    const shapes: [string, number[]][] = [
      ["크기가 모두 같은 배열", flat(n)],
      ["생성식 배열", line(n)],
      ["뒤로 갈수록 커지는 배열", up(n)],
      ["첫 파일만 큰 배열", head(n)],
      ["마지막 파일만 큰 배열", tail(n)],
    ];
    const rows = shapes.map(([label, f]) => {
      const c = countedLite(f).checks;
      return [label, num(c), (c / narrowBound(n)).toFixed(3)];
    });
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    let at = -1;
    for (let s = 0; s < n; s++) {
      const f = Array.from({ length: n }, (_, i) => (i === s ? 1000 : 1));
      const checks = countedLite(f).checks;
      if (checks > hi) {
        hi = checks;
        at = s;
      }
      lo = Math.min(lo, checks);
    }
    const top = num(hi);
    return `${md([`배열 (n = ${n})`, "후보 수", "상한에 대한 비"], rows, [1, 2])}

상한 n(n−1)/2 + (n−1)(n−2) 는 ${num(narrowBound(n))} 입니다. 한 파일만 큰 배열을 큰 파일의 자리마다 ${num(n)} 벌 만들어 재면 후보 수가 최소 ${num(lo)} · 최대 ${top}${이고(top)}, 최대를 만드는 자리는 ${num(at)} 번 파일입니다.`;
  },

  /** 최악을 만드는 입력 — 규모를 4 배씩 늘려 상한에 대한 비를 잰다. */
  "perf-worst-growth": () => {
    const rows = [32, 128, 512, 2048].map((n) => {
      const checks = countedLite(tail(n)).checks;
      return [
        num(n),
        num(checks),
        num(narrowBound(n)),
        (checks / narrowBound(n)).toFixed(3),
        num(fullBound(n)),
      ];
    });
    return md(
      [
        "n",
        "마지막 파일만 큰 배열의 후보 수",
        "n(n−1)/2 + (n−1)(n−2)",
        "그 비",
        "전부 넣은 후보 수",
      ],
      rows,
      [0, 1, 2, 3, 4],
    );
  },

  /** 스스로 점검하기 — 칸 [0,3] 에서 건너뛴 후보를 실제로 넣어 본다. */
  "check-range": () => {
    const n = WALK.length;
    const x = counted(WALK).cells.find(
      (c) => c.i === 0 && c.j === n - 1,
    ) as Cell;
    const lines = ["k = 0 과 k = 2 를 실제로 넣어 보면", ""];
    for (const c of candidatesOf(WALK, 0, n - 1))
      lines.push(
        `  k = ${c.k}   dp[0][${c.k}] + dp[${c.k + 1}][${n - 1}] = ${num(c.left)} + ${num(c.right)} = ${num(c.val)}${c.k === x.bestK ? "   ← 채운 값" : ""}`,
      );
    return lines.join("\n");
  },
};
