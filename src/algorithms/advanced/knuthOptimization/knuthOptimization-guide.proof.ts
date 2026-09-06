/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 검사했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 블록의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { INF, knuthOptimization } from "./knuthOptimization-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 입력. 파일 넷을 여덟 걸음으로 합친다.
 *
 * 여섯 갈래 중 다섯을 한 입력에서 실행한다 — 구간 합 · 기저 · 후보 범위 · 최솟값 갱신 ·
 * 칸 확정. 남은 하나(조기 반환)는 파일이 하나뿐인 입력이 진다. 마지막 칸에서 하한과 상한이
 * **둘 다** 좁아져 후보 셋 중 하나만 검사하는 자리가 나오는 것이 이 입력을 고른 이유다.
 */
export const WALK = [1, 3, 5, 2];

/** 크기가 모두 같은 배열. 최적 분할점이 고르게 퍼진다. */
export function flat(n: number): number[] {
  return new Array<number>(n).fill(1);
}

/** `freq[i] = (i * 7 % 5) + 1` — 크기가 1 부터 5 사이를 되풀이하는 배열. */
export function line(n: number): number[] {
  return Array.from({ length: n }, (_, i) => ((i * 7) % 5) + 1);
}

/** 첫 파일만 크고 나머지가 1 인 배열. 최적 분할점이 앞에 몰린다. */
export function head(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === 0 ? 1000 : 1));
}

/** 뒤로 갈수록 커지는 배열. */
export function up(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** 마지막 파일만 크고 나머지가 1 인 배열. 최적 분할점이 뒤에 몰린다. */
export function tail(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 1000 : 1));
}

/**
 * **크기가 음수인 파일을 허용하면 단조성이 깨진다.** 구간 합은 사각 부등식을 언제나
 * 등호로 만족하지만 `S(b, c) ≤ S(a, d)` 는 `freq[i] ≥ 0` 이 있어야 성립한다. 이 배열에서
 * 최적 분할점이 `opt(0, 2) = 1` 에서 `opt(0, 3) = 0` 으로 되돌아간다.
 */
export const NEG = [1, 1, 2, -2];

/** 제약 상한. `knuthOptimization-problem.md` 의 「제약 조건」과 같다. */
const N_LIMIT = 5000;

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

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 칸 하나를 확정한 기록. */
export interface Cell {
  len: number;
  i: number;
  j: number;
  /** 구간 합 `S(i, j)`. */
  sum: number;
  lo: number;
  /** `j - 1` 로 자르기 전의 상한. */
  raw: number;
  hi: number;
  cands: { k: number; val: number }[];
  best: number;
  bestK: number;
  /** `val < best` 가 참이 되어 값을 고친 횟수. */
  updates: number;
  /** 이 칸을 확정한 직후의 `dp` 표. */
  snapshot: number[][];
}

export interface Counted {
  answer: number;
  dp: number[][];
  opt: number[][];
  cells: Cell[];
  /** 분할점 후보 하나를 넣어 값을 만들고 견준 총 횟수. */
  checks: number;
  /** 구간 길이마다의 후보 검사 수. 첫 원소가 길이 2 다. */
  perLen: number[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(freq: number[]): Counted {
  const n = freq.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;

  const cells: Cell[] = [];
  const perLen: number[] = [];
  let checks = 0;

  for (let len = 2; len <= n; len++) {
    let layer = 0;
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      let updates = 0;
      const lo = (opt[i] as number[])[j - 1] as number;
      const raw = (opt[i + 1] as number[])[j] as number;
      const hi = Math.min(raw, j - 1);
      const cands: { k: number; val: number }[] = [];
      for (let k = lo; k <= hi; k++) {
        checks++;
        layer++;
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        cands.push({ k, val });
        if (val < best) {
          best = val;
          bestK = k;
          updates++;
        }
      }
      const sum = (prefix[j + 1] as number) - (prefix[i] as number);
      (dp[i] as number[])[j] = best + sum;
      (opt[i] as number[])[j] = bestK;
      cells.push({
        len,
        i,
        j,
        sum,
        lo,
        raw,
        hi,
        cands,
        best,
        bestK,
        updates,
        snapshot: dp.map((r) => r.slice()),
      });
    }
    perLen.push(layer);
  }
  return {
    answer: n <= 1 ? 0 : ((dp[0] as number[])[n - 1] as number),
    dp,
    opt,
    cells,
    checks,
    perLen,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(freq: number[]): {
  answer: number;
  checks: number;
  perLen: number[];
} {
  const n = freq.length;
  if (n <= 1) return { answer: 0, checks: 0, perLen: [] };
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;
  let checks = 0;
  const perLen: number[] = [];
  for (let len = 2; len <= n; len++) {
    const before = checks;
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      const lo = (opt[i] as number[])[j - 1] as number;
      const hi = Math.min((opt[i + 1] as number[])[j] as number, j - 1);
      for (let k = lo; k <= hi; k++) {
        checks++;
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = bestK;
    }
    perLen.push(checks - before);
  }
  return { answer: (dp[0] as number[])[n - 1] as number, checks, perLen };
}

/** 후보 범위를 안 좁히고 분할점을 전부 검사하는 구간 DP. 답과 계수의 기준이다. */
export function fullScan(freq: number[]): {
  answer: number;
  checks: number;
  dp: number[][];
  opt: number[][];
} {
  const n = freq.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;
  let checks = 0;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      for (let k = i; k < j; k++) {
        checks++;
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = bestK;
    }
  }
  return {
    answer: n <= 1 ? 0 : ((dp[0] as number[])[n - 1] as number),
    checks,
    dp,
    opt,
  };
}

/** 후보를 딱 하나만 넣어 보는 설계. `pick` 이 그 하나를 고른다. */
function onePick(
  freq: number[],
  pick: (i: number, j: number, opt: number[][]) => number,
): number {
  const n = freq.length;
  if (n <= 1) return 0;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
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

/** 「가운데를 찍는다」 — 후보를 `⌊(i+j)/2⌋` 하나로 둔다. */
export const middlePick = (freq: number[]): number =>
  onePick(freq, (i, j) => (i + j) >> 1);

/** 「왼쪽 이웃의 최적 분할점 하나만 쓴다」 — 후보를 `opt(i, j-1)` 하나로 둔다. */
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
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const S = (i: number, j: number): number =>
    (prefix[j + 1] as number) - (prefix[i] as number);
  let tested = 0;
  let quad = 0;
  let mono = 0;
  let firstMono = "-";
  for (let a = 0; a < n; a++)
    for (let b = a; b < n; b++)
      for (let c = b; c < n; c++)
        for (let d = c; d < n; d++) {
          tested++;
          if (S(a, c) + S(b, d) > S(a, d) + S(b, c)) quad++;
          if (S(b, c) > S(a, d)) {
            mono++;
            if (firstMono === "-") firstMono = `${a}, ${b}, ${c}, ${d}`;
          }
        }
  return { tested, quad, mono, firstMono };
}

/** 최적 분할점의 이웃 관계가 칸마다 성립하는가. 진짜 `opt` 는 전부 검사해서 얻는다. */
export function monotone(freq: number[]): {
  tested: number;
  broken: number;
  first: string;
} {
  const n = freq.length;
  const { opt } = fullScan(freq);
  let tested = 0;
  let broken = 0;
  let first = "-";
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      tested++;
      const mid = (opt[i] as number[])[j] as number;
      const left = (opt[i] as number[])[j - 1] as number;
      const right = (opt[i + 1] as number[])[j] as number;
      if (left <= mid && mid <= Math.min(right, j - 1)) continue;
      broken++;
      if (first === "-") first = `[${i}, ${j}]`;
    }
  }
  return { tested, broken, first };
}

/** 자릿수만 낸다. 배열에 안 들어가는 규모에서 쓴다. */
function catalanDigits(m: number): number {
  let log10 = 0;
  for (let i = 1; i <= m; i++) log10 += Math.log10(m + i) - Math.log10(i);
  log10 -= Math.log10(m + 1);
  return Math.floor(log10) + 1;
}

/** 카탈란 수 `C(m)` — 작은 값에서만 부른다. */
function catalan(m: number): number {
  let out = 1;
  for (let i = 1; i <= m; i++) out = (out * (m + i)) / i;
  return Math.round(out / (m + 1));
}

/** 후보를 전부 검사할 때의 총 검사 수 — `n(n²−1)/6`. */
const fullBound = (n: number): number => (n * (n * n - 1)) / 6;

/** 범위를 좁혔을 때의 총 검사 수 상한 — `n(n−1)/2 + (n−1)(n−2)`. */
const narrowBound = (n: number): number =>
  (n * (n - 1)) / 2 + (n - 1) * (n - 2);

/* ────────────────────── 사본이 정본과 같은가 ────────────────────── */

function 자기대조(): void {
  const inputs: number[][] = [
    WALK,
    flat(8),
    line(16),
    head(9),
    up(7),
    [100],
    [0, 5, 0],
  ];
  for (const freq of inputs) {
    const want = knuthOptimization(freq);
    if (counted(freq).answer !== want) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (countedLite(freq).answer !== want) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (freq.length > 1 && fullScan(freq).answer !== want) {
      throw new Error("전부 검사하는 사본이 정본과 다른 답을 낸다");
    }
    if (fullScan(freq).checks !== fullBound(freq.length)) {
      throw new Error("전부 검사의 닫힌 형태가 실측과 다르다");
    }
  }
  for (const n of [17, 33, 64, 129]) {
    if (fullScan(line(n)).checks !== fullBound(n)) {
      throw new Error("전부 검사의 닫힌 형태가 실측과 다르다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./knuthOptimization-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  knuthOptimization(freq: number[]): number;
}

/** 길이 1 구간의 최적 분할점을 세우는 줄을 뺀 사본. */
const noBase = await loadMutant<Impl>(REF, {
  drop: /for \(let i = 0; i < n; i\+\+\) \(opt\[i\] as number\[\]\)\[i\] = i;/,
});

/** 상한을 이웃 칸으로 안 좁히고 정의역 끝 `j - 1` 로만 두는 사본. */
const lowerOnly = await loadMutant<Impl>(REF, {
  swap: [
    /const hi = Math\.min\(\(opt\[i \+ 1\] as number\[\]\)\[j\] as number, j - 1\);/,
    "const hi = j - 1;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 최적 분할점을 기록하는 줄을 뺀 사본. */
const noOptWrite = await loadMutant<Impl>(REF, {
  drop: /\(opt\[i\] as number\[\]\)\[j\] = bestK;/,
});

const MUTANT_CASES: { label: string; freq: number[] }[] = [
  { label: "전개 입력", freq: WALK },
  { label: "크기가 모두 같은 입력", freq: flat(5) },
  { label: "문제 예시 [10, 20, 30]", freq: [10, 20, 30] },
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
    ["최적 분할점을 기록하지 않는 판", noOptWrite],
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
}

/** 기저를 뺀 판의 `dp` 표. 변이 모듈은 반환값 하나만 내므로 중간 표를 볼 수 없다. */
export function countedNoBase(freq: number[]): {
  answer: number;
  dp: number[][];
  opt: number[][];
} {
  const n = freq.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      const lo = (opt[i] as number[])[j - 1] as number;
      const hi = Math.min((opt[i + 1] as number[])[j] as number, j - 1);
      for (let k = lo; k <= hi; k++) {
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = bestK;
    }
  }
  return { answer: (dp[0] as number[])[n - 1] as number, dp, opt };
}

/** 상한을 `j - 1` 로만 둔 판의 검사 수. 답은 정본과 같고 검사만 늘어난다. */
export function countedLowerOnly(freq: number[]): {
  answer: number;
  checks: number;
} {
  const n = freq.length;
  if (n <= 1) return { answer: 0, checks: 0 };
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;
  let checks = 0;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      const lo = (opt[i] as number[])[j - 1] as number;
      const hi = j - 1;
      for (let k = lo; k <= hi; k++) {
        checks++;
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = bestK;
    }
  }
  return { answer: (dp[0] as number[])[n - 1] as number, checks };
}

if (!중화됨) {
  for (const c of MUTANT_CASES) {
    if (countedNoBase(c.freq).answer !== noBase.knuthOptimization(c.freq)) {
      throw new Error("기저를 뺀 사본이 같은 이름의 변이와 다른 답을 낸다");
    }
    if (
      countedLowerOnly(c.freq).answer !== lowerOnly.knuthOptimization(c.freq)
    ) {
      throw new Error("상한만 넓힌 사본이 같은 이름의 변이와 다른 답을 낸다");
    }
  }
}

/* ────────────────────────── 걸음 이름 ────────────────────────── */

/** 전개의 `T#`. 걸음 하나가 표의 한 줄이다. */
function walkSteps(): { name: string; text: string; dp: number[][] }[] {
  const c = counted(WALK);
  const zero: number[][] = WALK.map(() => WALK.map(() => 0));
  const out: { name: string; text: string; dp: number[][] }[] = [
    { name: "T1", text: "구간 합과 기저를 준비한다", dp: zero },
  ];
  let t = 2;
  for (const x of c.cells) {
    out.push({
      name: `T${t++}`,
      text: `[${x.i}, ${x.j}] 칸을 확정한다`,
      dp: x.snapshot,
    });
  }
  out.push({
    name: `T${t}`,
    text: "맨 위 오른쪽 칸을 반환한다",
    dp: c.dp.map((r) => r.slice()),
  });
  return out;
}

/** `dp` 표 한 줄을 본문 표기로 적는다. 하삼각 칸은 쓰지 않으므로 `.` 로 둔다. */
function dpRow(
  dp: number[][],
  i: number,
  done: (j: number) => boolean,
): string {
  const row = dp[i] as number[];
  return (row as number[])
    .map((v, j) => (j < i ? "." : done(j) ? cell(v) : "-"))
    .join(" ");
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 순서를 전부 만드는 방법과 구간 DP 가 제약 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [4, 8, 50, 200, 500].map((n) => {
      const freq = line(n);
      return [
        comma(n),
        n <= 8
          ? comma(catalan(n - 1))
          : `${comma(catalanDigits(n - 1))} 자리 수`,
        comma(fullBound(n)),
        comma(countedLite(freq).checks),
      ];
    });
    return [
      ...table(
        [
          [
            "파일 n",
            "병합 순서의 수",
            "후보 검사 (전부)",
            "후보 검사 (범위를 좁히면)",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `크기는 freq[i] = (i × 7 mod 5) + 1 로 만든 배열이다`,
      "",
      ...table([
        [`제약 상한 n = ${comma(N_LIMIT)} 에서`, ""],
        ["  병합 순서의 수", `${comma(catalanDigits(N_LIMIT - 1))} 자리 수`],
        ["  후보 검사 (전부)", `${comma(fullBound(N_LIMIT))} 번`],
        [
          "  후보 검사 (범위를 좁히면)",
          `${comma(countedLite(line(N_LIMIT)).checks)} 번`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ③ — 최적 분할점을 실제로 계산해 이웃 관계를 확인한다. */
  optTable: () => {
    const freq = line(8);
    const { opt } = fullScan(freq);
    const n = freq.length;
    const rows = opt.map((row, i) => [
      `i=${i}`,
      ...row.map((v, j) => (j < i ? "." : String(v))),
    ]);
    const checked = [line(8), flat(8), head(9), up(7), WALK, NEG].map((f) => {
      const m = monotone(f);
      return [`[${f.join(", ")}]`, comma(m.tested), comma(m.broken), m.first];
    });
    return [
      `배열 [${freq.join(", ")}] 의 opt(i, j) — 후보를 전부 검사해서 얻은 값이다`,
      "",
      ...table(
        [["", ...Array.from({ length: n }, (_, j) => `j=${j}`)], ...rows],
        Array.from({ length: n }, (_, j) => j + 1),
      ),
      "",
      "가로로 읽으면 왼쪽에서 오른쪽으로, 세로로 읽으면 위에서 아래로 안 줄어든다",
      "",
      ...table(
        [["배열", "확인한 칸", "이웃 관계 위반", "첫 위반 칸"], ...checked],
        [1, 2],
      ),
    ].join("\n");
  },

  /** deep.build ⑤ — 두 조건을 지표 넷의 모든 조합에서 확인한다. */
  conditionCheck: () => {
    const rows: [string, number[]][] = [
      ["전개 입력 (파일 4)", WALK],
      ["크기가 모두 같은 배열 (파일 8)", flat(8)],
      ["생성식 배열 (파일 16)", line(16)],
      ["앞이 큰 배열 (파일 9)", head(9)],
      ["음수가 섞인 배열 (파일 4)", NEG],
    ];
    return table(
      [
        [
          "배열",
          "검사한 지표 조합",
          "사각 부등식 위반",
          "단조성 위반",
          "첫 단조성 위반 (a, b, c, d)",
        ],
        ...rows.map(([label, f]) => {
          const q = conditions(f);
          return [
            label,
            comma(q.tested),
            comma(q.quad),
            comma(q.mono),
            q.firstMono,
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.build ⑤ — 후보를 하나로 줄이는 단순한 두 방법을 재서 반박한다. */
  onePickCheck: () => {
    const inputs: [string, number[]][] = [
      ["전개 입력 [1, 3, 5, 2]", WALK],
      ["문제 예시 [10, 20, 30]", [10, 20, 30]],
      ["크기가 모두 같은 배열 (파일 8)", flat(8)],
      ["생성식 배열 (파일 16)", line(16)],
      ["앞이 큰 배열 (파일 9)", head(9)],
    ];
    return table(
      [
        [
          "배열",
          "진짜 답",
          "가운데를 찍는다",
          "왼쪽 이웃의 최적 분할점 하나",
          "이웃 두 칸으로 범위를 잡는다",
        ],
        ...inputs.map(([label, f]) => [
          label,
          comma(fullScan(f).answer),
          comma(middlePick(f)),
          comma(prevPick(f)),
          comma(knuthOptimization(f)),
        ]),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.build ⑥ — 대각선 하나의 검사 합이 「칸 수 + opt 양 끝의 차」에 갇힌다. */
  diagonalSums: () => {
    const freq = line(16);
    const n = freq.length;
    const c = counted(freq);
    const byLen = new Map<number, Cell[]>();
    for (const x of c.cells) byLen.set(x.len, [...(byLen.get(x.len) ?? []), x]);
    const rows = [...byLen.entries()].map(([len, xs]) => {
      const first = xs[0] as Cell;
      const last = xs[xs.length - 1] as Cell;
      const gap = last.raw - first.lo;
      const checks = xs.reduce((t, x) => t + x.cands.length, 0);
      return [
        comma(len),
        comma(xs.length),
        comma(checks),
        `${first.lo} → ${last.raw}`,
        comma(gap),
        comma(xs.length + gap),
      ];
    });
    return [
      ...table(
        [
          [
            "길이",
            "칸 수",
            "검사 합",
            "그 대각선이 읽은 opt 의 양 끝",
            "그 차",
            "칸 수 + 그 차",
          ],
          ...rows,
        ],
        [0, 1, 2, 4, 5],
      ),
      "",
      `생성식 배열 (파일 ${n}) · 검사 합계 ${comma(c.checks)} · 전부 검사하면 ${comma(fullBound(n))}`,
    ].join("\n");
  },

  /** deep.walk 도입 — 파일 몇 개부터 범위가 좁아지는가. 크기 0~9 를 전수로 만든다. */
  walkInputChoice: () => {
    const rows = [2, 3, 4].map((n) => {
      let total = 0;
      let narrowed = 0;
      let both = 0;
      const full = (n * (n * n - 1)) / 6;
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
      return [comma(n), comma(total), comma(narrowed), comma(both)];
    });
    return [
      ...table(
        [
          [
            "파일 수",
            "크기 0~9 를 전수로 만든 배열",
            "검사가 줄어든 벌",
            "하한과 상한이 함께 좁아진 칸이 있는 벌",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `전개 입력 [${WALK.join(", ")}] 에서 그런 칸은 ${counted(WALK)
        .cells.filter((x) => x.lo > x.i && x.hi < x.j - 1)
        .map((x) => `[${x.i}, ${x.j}]`)
        .join(" · ")} 하나다`,
    ].join("\n");
  },

  /** deep.walk — 걸음마다 dp 표가 어떻게 채워지는가. */
  walkTrace: () => {
    const steps = walkSteps();
    const c = counted(WALK);
    const doneAt = new Map<string, number>();
    for (const [index, x] of c.cells.entries()) {
      doneAt.set(`${x.i},${x.j}`, index + 2);
    }
    const rows = steps.map((s, t) => {
      const done = (i: number, j: number): boolean =>
        i === j || (doneAt.get(`${i},${j}`) ?? 99) <= t + 1;
      return [
        s.name,
        s.text,
        ...WALK.map((_, i) => dpRow(s.dp, i, (j) => done(i, j))),
      ];
    });
    return [
      ...table(
        [
          ["걸음", "이 걸음이 한 일", "dp[0]", "dp[1]", "dp[2]", "dp[3]"],
          ...rows,
        ],
        [],
      ),
      "",
      "행이 구간의 시작 i · 열이 구간의 끝 j 다. `-` 는 아직 확정하지 않은 칸이고",
      "`.` 는 i > j 라 문제가 정의하지 않는 자리다",
      "",
      `후보 검사 ${comma(c.checks)} 번 · 반환값 ${comma(c.answer)}`,
    ].join("\n");
  },

  /** deep.walk — 칸마다 후보 범위를 무엇으로 잡았고 무엇을 검사했는가. */
  walkCandidates: () => {
    const c = counted(WALK);
    const rows = c.cells.map((x) => [
      `T${c.cells.indexOf(x) + 2}`,
      `[${x.i}, ${x.j}]`,
      comma(x.sum),
      String(x.lo),
      x.raw === x.hi ? String(x.raw) : `${x.raw} → ${x.hi}`,
      x.cands.map((v) => `k=${v.k}: ${comma(v.val)}`).join(" · "),
      comma(x.best + x.sum),
      String(x.bestK),
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "구간",
            "S(i, j)",
            "하한",
            "상한",
            "후보 값",
            "확정한 값",
            "opt",
          ],
          ...rows,
        ],
        [2, 3, 6, 7],
      ),
      "",
      "상한 열의 `a → b` 는 이웃 칸의 값 a 를 정의역 끝 j-1 로 b 까지 자른 것이다",
      `후보 검사 ${comma(c.checks)} 번 · 전부 검사하면 ${comma(fullBound(WALK.length))} 번`,
    ].join("\n");
  },

  /** deep.walk.pause — 기저의 최적 분할점을 안 세우면. */
  pauseNoBase: () => {
    return table(
      [
        ["입력", "정본", "기저를 뺀 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = knuthOptimization(c.freq);
          const b = noBase.knuthOptimization(c.freq);
          return [c.label, comma(a), comma(b), a === b ? "같다" : "다르다"];
        }),
      ],
      [1, 2],
    ).join("\n");
  },

  /** deep.walk.pause — 기저를 뺀 판의 dp 표를 정본과 나란히 놓는다. */
  pauseNoBaseRows: () => {
    const a = counted(WALK);
    const b = countedNoBase(WALK);
    const rows = WALK.map((_, i) => [
      `i=${i}`,
      dpRow(a.dp, i, () => true),
      dpRow(b.dp, i, () => true),
      dpRow(a.opt, i, () => true),
      dpRow(b.opt, i, () => true),
    ]);
    return [
      ...table(
        [
          ["", "정본 dp", "기저를 뺀 판 dp", "정본 opt", "기저를 뺀 판 opt"],
          ...rows,
        ],
        [],
      ),
      "",
      "길이 2 구간(대각선 바로 위)의 dp 는 두 판이 같고 opt 만 갈린다",
      `반환값이 ${comma(a.answer)} 에서 ${comma(b.answer)} 로 갈린다`,
    ].join("\n");
  },

  /** deep.walk.pause — 상한을 이웃 칸으로 안 좁혀도 답은 안 바뀐다. */
  pauseLowerOnly: () => {
    return table(
      [
        ["입력", "정본", "상한을 안 좁힌 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = knuthOptimization(c.freq);
          const b = lowerOnly.knuthOptimization(c.freq);
          return [c.label, comma(a), comma(b), a === b ? "같다" : "다르다"];
        }),
      ],
      [1, 2],
    ).join("\n");
  },

  /** deep.walk.pause — 답이 같은 대신 검사가 몇 배로 늘어나는가. */
  pauseLowerOnlyScale: () => {
    const rows = [4, 16, 64, 200, 500].map((n) => {
      const freq = line(n);
      const a = countedLite(freq);
      const b = countedLowerOnly(freq);
      return [
        comma(n),
        comma(a.checks),
        comma(b.checks),
        (b.checks / a.checks).toFixed(1),
        comma(fullBound(n)),
      ];
    });
    return [
      ...table(
        [
          [
            "파일 n",
            "정본",
            "상한을 안 좁힌 판",
            "그 배",
            "후보를 전부 검사하면",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "세 열의 답은 전부 같다. 갈리는 것은 검사 횟수뿐이다",
    ].join("\n");
  },

  /** deep.walk — 여섯 갈래가 어느 입력에서 몇 번 실행되는가. */
  branchCoverage: () => {
    const labels: [string, string][] = [
      ["①", "파일이 하나 이하면 곧장 0 을 반환한다"],
      ["②", "구간 합을 미리 더해 둔다"],
      ["③", "길이 1 구간의 최적 분할점을 세운다"],
      ["④", "후보 범위를 이웃 두 칸으로 잡는다"],
      ["⑤", "최솟값과 그 분할점을 고친다"],
      ["⑥", "칸을 확정한다"],
    ];
    const inputs: [string, number[]][] = [
      ["전개 입력", WALK],
      ["파일 하나 [100]", [100]],
      ["크기가 모두 같은 배열 (파일 5)", flat(5)],
    ];
    const count = (freq: number[]): number[] => {
      const n = freq.length;
      if (n <= 1) return [1, 0, 0, 0, 0, 0];
      const c = counted(freq);
      return [
        0,
        n + 1,
        n,
        c.cells.length,
        c.cells.reduce((t, x) => t + x.updates, 0),
        c.cells.length,
      ];
    };
    const counts = inputs.map(([, f]) => count(f));
    return table(
      [
        ["라벨", "무엇", ...inputs.map(([label]) => label)],
        ...labels.map(([mark, text], r) => [
          mark,
          text,
          ...counts.map((c) => comma(c[r] as number)),
        ]),
      ],
      [2, 3, 4],
    ).join("\n");
  },

  /** deep.math ② — 정의를 전개 입력의 칸 하나에 넣어 검산한다. */
  mathCheck: () => {
    const f = fullScan(WALK);
    const n = WALK.length;
    const prefix = [0];
    for (const x of WALK)
      prefix.push((prefix[prefix.length - 1] as number) + x);
    const target = 3;
    const rows = [];
    for (let k = 0; k < target; k++) {
      rows.push([
        `k = ${k}`,
        `dp(0, ${k}) + dp(${k + 1}, ${target})`,
        `${comma((f.dp[0] as number[])[k] as number)} + ${comma((f.dp[k + 1] as number[])[target] as number)}`,
        comma(
          ((f.dp[0] as number[])[k] as number) +
            ((f.dp[k + 1] as number[])[target] as number),
        ),
      ]);
    }
    return [
      `S(0, ${target}) = prefix[${target + 1}] - prefix[0] = ${comma(prefix[target + 1] as number)} - 0 = ${comma(prefix[target + 1] as number)}`,
      "",
      ...table([["후보", "무엇을 더하는가", "값", "합"], ...rows], [2, 3]),
      "",
      `최솟값 ${comma(f.dp[0]?.[target] === undefined ? 0 : (f.dp[0][target] as number) - (prefix[target + 1] as number))} 에 S(0, ${target}) 을 더해 dp(0, ${target}) = ${comma((f.dp[0] as number[])[target] as number)} 이고 opt(0, ${target}) = ${(f.opt[0] as number[])[target]} 이다`,
      `파일 ${n} 개짜리 이 배열의 답이 그 값이다`,
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 형태를 실측과 대조하고 제약 규모의 수치를 낸다. */
  mathBound: () => {
    const rows = [16, 64, 256, 1024].map((n) => {
      const freq = line(n);
      const checks = countedLite(freq).checks;
      return [
        comma(n),
        comma(checks),
        comma(narrowBound(n)),
        (checks / narrowBound(n)).toFixed(3),
        comma(fullBound(n)),
      ];
    });
    return [
      ...table(
        [
          [
            "파일 n",
            "실측 검사",
            "n(n−1)/2 + (n−1)(n−2)",
            "그 비",
            "전부 검사하면",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      ...table([
        [`제약 상한 n = ${comma(N_LIMIT)} 에서`, ""],
        ["  후보 검사의 상한", `${comma(narrowBound(N_LIMIT))} 번`],
        ["  후보를 전부 검사하면", `${comma(fullBound(N_LIMIT))} 번`],
        [
          "  그 비",
          `${(fullBound(N_LIMIT) / narrowBound(N_LIMIT)).toFixed(1)} 배`,
        ],
      ]),
    ].join("\n");
  },

  /** invariant ② — 칸마다 진짜 최적 분할점이 넘긴 범위 안에 있는가. */
  invariantWatch: () => {
    const c = counted(WALK);
    const f = fullScan(WALK);
    const rows = c.cells.map((x) => {
      const real = (f.opt[x.i] as number[])[x.j] as number;
      return [
        `[${x.i}, ${x.j}]`,
        `[${x.lo}, ${x.hi}]`,
        String(real),
        real >= x.lo && real <= x.hi ? "지킨다" : "깨진다",
      ];
    });
    return table(
      [["구간", "검사한 범위", "진짜 최적 분할점", "불변식"], ...rows],
      [2],
    ).join("\n");
  },

  /** invariant ② — 경계 입력에서도 같은 문장이 유지되는가. */
  invariantEdges: () => {
    const inputs: [string, number[]][] = [
      ["파일 하나", [100]],
      ["파일 둘", [5, 7]],
      ["크기가 전부 0", [0, 0, 0, 0]],
      ["0 이 섞인 입력", [0, 5, 0]],
      ["크기가 모두 같은 입력", [10, 10, 10, 10]],
      ["앞이 큰 입력 (파일 5)", head(5)],
    ];
    return [
      ...table(
        [
          ["입력", "파일 수", "반환값", "후보 검사", "이웃 관계 위반"],
          ...inputs.map(([label, f]) => [
            label,
            comma(f.length),
            comma(knuthOptimization(f)),
            comma(countedLite(f).checks),
            f.length <= 1 ? "-" : comma(monotone(f).broken),
          ]),
        ],
        [1, 2, 3, 4],
      ),
      "",
      "파일이 하나면 반복에 한 번도 들어가지 않아 검사가 0 번이다",
    ].join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 빼면 어떤 값이 나오는가. */
  mutantNoOptWrite: () => {
    return [
      ...table(
        [
          ["입력", "정본", "분할점을 기록하지 않는 판", "판정"],
          ...MUTANT_CASES.map((c) => {
            const a = knuthOptimization(c.freq);
            const b = noOptWrite.knuthOptimization(c.freq);
            return [c.label, comma(a), comma(b), a === b ? "같다" : "다르다"];
          }),
        ],
        [1, 2],
      ),
      "",
      `전개 입력의 ${comma(noOptWrite.knuthOptimization(WALK))} 은 어떤 병합 순서로도 못 만드는 값이다 — 진짜 최솟값이 ${comma(knuthOptimization(WALK))} 이라 그보다 작다`,
    ].join("\n");
  },

  /** perf.derive — 걸음마다의 검사 수와 누적. */
  perfCount: () => {
    const c = counted(WALK);
    let acc = 0;
    const rows = [["T1", "-", "-", "0", "0"]];
    for (const [index, x] of c.cells.entries()) {
      acc += x.cands.length;
      rows.push([
        `T${index + 2}`,
        `[${x.i}, ${x.j}]`,
        `[${x.lo}, ${x.hi}]`,
        comma(x.cands.length),
        comma(acc),
      ]);
    }
    rows.push([`T${c.cells.length + 2}`, "-", "-", "0", comma(acc)]);
    return [
      ...table(
        [["걸음", "구간", "후보 범위", "이 걸음의 검사", "누적"], ...rows],
        [3, 4],
      ),
      "",
      `칸 ${comma(c.cells.length)} 개 · 후보 검사 ${comma(c.checks)} 번 · 전부 검사하면 ${comma(fullBound(WALK.length))} 번`,
    ].join("\n");
  },

  /** perf.bounds — 규모별 검사 수와 칸 수에 대한 비. */
  perfObserved: () => {
    const shapes: [string, (n: number) => number[]][] = [
      ["크기가 모두 같은 배열", flat],
      ["생성식 배열", line],
      ["앞이 큰 배열", head],
    ];
    const rows = shapes.flatMap(([label, gen]) =>
      [128, 512].map((n) => {
        const freq = gen(n);
        const checks = countedLite(freq).checks;
        const cellCount = (n * (n - 1)) / 2;
        return [
          label,
          comma(n),
          comma(checks),
          (checks / cellCount).toFixed(2),
          comma(fullBound(n)),
        ];
      }),
    );
    return table(
      [["배열", "파일 n", "후보 검사", "칸 하나당", "전부 검사하면"], ...rows],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** perf.worst — 어느 모양이 검사를 가장 많이 만드는가. */
  worstShape: () => {
    const n = 256;
    const shapes: [string, number[]][] = [
      ["크기가 모두 같은 배열", flat(n)],
      ["생성식 배열", line(n)],
      ["뒤로 갈수록 커지는 배열", up(n)],
      ["앞이 큰 배열", head(n)],
      ["뒤가 큰 배열", tail(n)],
    ];
    const rows = shapes.map(([label, freq]) => [
      label,
      comma(countedLite(freq).checks),
      (countedLite(freq).checks / narrowBound(n)).toFixed(3),
    ]);
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    let at = -1;
    for (let s = 0; s < n; s++) {
      const freq = Array.from({ length: n }, (_, i) => (i === s ? 1000 : 1));
      const checks = countedLite(freq).checks;
      if (checks > hi) {
        hi = checks;
        at = s;
      }
      lo = Math.min(lo, checks);
    }
    return [
      ...table(
        [["배열 (파일 256)", "후보 검사", "상한에 대한 비"], ...rows],
        [1, 2],
      ),
      "",
      `상한 n(n−1)/2 + (n−1)(n−2) = ${comma(narrowBound(n))} 번`,
      "",
      `한 칸만 큰 배열 ${comma(n)} 벌을 전부 재면 최소 ${comma(lo)} · 최대 ${comma(hi)} 이고`,
      `최대를 만드는 자리는 ${comma(at)} 번 파일이다`,
    ].join("\n");
  },

  /** perf.worst — 규모를 4 배씩 늘려 상한에 대한 비를 잰다. */
  worstGrowth: () => {
    const rows = [32, 128, 512, 2048].map((n) => {
      const freq = tail(n);
      const checks = countedLite(freq).checks;
      return [
        comma(n),
        comma(checks),
        comma(narrowBound(n)),
        (checks / narrowBound(n)).toFixed(3),
        comma(fullBound(n)),
      ];
    });
    return table(
      [
        [
          "파일 n",
          "뒤가 큰 배열의 검사",
          "n(n−1)/2 + (n−1)(n−2)",
          "그 비",
          "전부 검사하면",
        ],
        ...rows,
      ],
      [0, 1, 2, 3, 4],
    ).join("\n");
  },
};
