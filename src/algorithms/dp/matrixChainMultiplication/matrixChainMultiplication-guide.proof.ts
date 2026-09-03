/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { matrixChainMultiplication } from "./matrixChainMultiplication-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `1.71 × 10^47` 꼴. */
const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/** 차원 배열을 본문 표기 그대로 적는다 — `[10, 30, 5, 60, 10]` 꼴. */
const label = (p: number[]): string => `[${p.join(", ")}]`;

/* ────────────────────────── 계측판 ────────────────────────── */

/** 전개가 쓰는 입력. 본문의 다른 자리도 같은 배열을 가리킨다. */
const WALK = [10, 30, 5, 60, 10];

/** 본문이 여러 자리에서 함께 거는 입력 묶음. */
const SAMPLES: number[][] = [
  WALK,
  [10, 30, 5, 60],
  [10, 20, 30, 40, 30],
  [40, 20, 30, 10, 30],
  [2, 3, 4, 2, 5],
  [1, 2, 3, 4],
  [5, 5, 5, 5],
];

/** 아무것도 기억하지 않는 재귀. 호출 하나마다 1 을 센다. */
function naiveCalls(p: number[]): number {
  const n = p.length - 1;
  let calls = 0;
  const solve = (i: number, j: number): number => {
    calls++;
    if (i >= j) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      const c =
        solve(i, k) +
        solve(k + 1, j) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    return best;
  };
  solve(1, n);
  return calls;
}

/**
 * 위 재귀의 호출 수를 세는 점화식 — `R(1) = 1`, `R(m) = 1 + Σ_{k=1..m-1} (R(k) + R(m−k))`.
 * 실제로 못 실행할 크기에서도 정확한 값을 낸다. 작은 값에서 `naiveCalls` 와 같은지 아래에서 본다.
 */
function callsByRecurrence(n: number): bigint {
  const r = new Array<bigint>(n + 1).fill(0n);
  r[1] = 1n;
  for (let m = 2; m <= n; m++) {
    let sum = 1n;
    for (let k = 1; k < m; k++) sum += (r[k] as bigint) + (r[m - k] as bigint);
    r[m] = sum;
  }
  return r[n] as bigint;
}

// 점화식이 실제 호출 수와 어긋나면 아래 표의 큰 값이 아무것도 뜻하지 않는다.
for (const n of [2, 3, 4, 5, 6, 8]) {
  const p = Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1);
  if (BigInt(naiveCalls(p)) !== callsByRecurrence(n)) {
    throw new Error(`점화식이 실제 호출 수와 어긋난다 — 행렬 ${n} 개`);
  }
}

/** 재귀가 각 구간을 몇 번 다시 푸는가. `hit[i][j]` 에 센다. */
function solvedPerInterval(n: number): number[][] {
  const p = Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1);
  const hit = Array.from({ length: n + 2 }, () =>
    new Array<number>(n + 2).fill(0),
  );
  const solve = (i: number, j: number): number => {
    (hit[i] as number[])[j] = ((hit[i] as number[])[j] as number) + 1;
    if (i >= j) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      const c =
        solve(i, k) +
        solve(k + 1, j) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    return best;
  };
  solve(1, n);
  return hit;
}

/** 구간 하나를 정할 때 `k` 를 어느 자리 하나로 고정한 판. */
function fixedSplit(p: number[], rule: "left" | "right" | "mid"): number {
  const n = p.length - 1;
  if (n <= 1) return 0;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      const k =
        rule === "left"
          ? i
          : rule === "right"
            ? j - 1
            : Math.floor((i + j) / 2);
      (dp[i] as number[])[j] =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
    }
  }
  return (dp[1] as number[])[n] as number;
}

/** 가운데에서 가르는 판이 정한 표 한 칸. 본문이 `dp[2][4]` 를 짚는다. */
function fixedSplitCell(p: number[], i0: number, j0: number): number {
  const n = p.length - 1;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      const k = Math.floor((i + j) / 2);
      (dp[i] as number[])[j] =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
    }
  }
  return (dp[i0] as number[])[j0] as number;
}

/** 정본이 정한 표 한 칸. */
function optimalCell(p: number[], i0: number, j0: number): number {
  const { dp } = fillTable(p);
  return (dp[i0] as number[])[j0] as number;
}

/** 표 전체와 고른 `k` 를 함께 돌려준다. 전개 절의 그림이 이것을 그대로 쓴다. */
function fillTable(p: number[]): { dp: number[][]; split: number[][] } {
  const n = p.length - 1;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  const split = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      let best = Number.POSITIVE_INFINITY;
      for (let k = i; k < j; k++) {
        const c =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number) +
          (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
        if (c < best) {
          best = c;
          (split[i] as number[])[j] = k;
        }
      }
      (dp[i] as number[])[j] = best;
    }
  }
  return { dp, split };
}

/** 채우는 순서를 바꾼 판. `len` 이 정본이다. */
function fillOrder(p: number[], order: "len" | "rowAsc" | "rowDesc"): number {
  const n = p.length - 1;
  if (n <= 1) return 0;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  const one = (i: number, j: number): void => {
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      const c =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    (dp[i] as number[])[j] = best;
  };
  if (order === "len") {
    for (let L = 2; L <= n; L++)
      for (let i = 1; i + L - 1 <= n; i++) one(i, i + L - 1);
  } else if (order === "rowAsc") {
    for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) one(i, j);
  } else {
    for (let i = n; i >= 1; i--) for (let j = i + 1; j <= n; j++) one(i, j);
  }
  return (dp[1] as number[])[n] as number;
}

/** 이웃한 두 행렬 중 곱셈 비용이 가장 작은 쌍부터 없앤다. 같은 값이면 왼쪽 쌍이다. */
function cheapestPairFirst(p: number[]): number {
  const d = [...p];
  let total = 0;
  while (d.length > 2) {
    let at = 1;
    let low = Number.POSITIVE_INFINITY;
    for (let t = 1; t < d.length - 1; t++) {
      const c = (d[t - 1] as number) * (d[t] as number) * (d[t + 1] as number);
      if (c < low) {
        low = c;
        at = t;
      }
    }
    total += low;
    d.splice(at, 1);
  }
  return total;
}

/** 표가 견주는 후보의 총수와 잡는 칸 수. */
const candidates = (n: number): number => (n * n * n - n) / 6;
const cells = (n: number): number => (n + 1) * (n + 1);

/** 표를 채우면서 후보를 견준 횟수를 실제로 센다. */
function countedCandidates(p: number[]): number {
  const n = p.length - 1;
  if (n <= 1) return 0;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  let ops = 0;
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      let best = Number.POSITIVE_INFINITY;
      for (let k = i; k < j; k++) {
        ops++;
        const c =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number) +
          (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
        if (c < best) best = c;
      }
      (dp[i] as number[])[j] = best;
    }
  }
  return ops;
}

/**
 * 괄호 배치를 전수로 만들어 센다. 작은 `n` 에서만 실행한다.
 * 배치 문자열도 함께 만든다 — 본문 표의 왼쪽 열을 손으로 적지 않으려는 것이다.
 */
function enumerateParen(
  p: number[],
  i: number,
  j: number,
): { expr: string; cost: number }[] {
  if (i === j) return [{ expr: `A${i}`, cost: 0 }];
  const out: { expr: string; cost: number }[] = [];
  for (let k = i; k < j; k++) {
    for (const l of enumerateParen(p, i, k)) {
      for (const r of enumerateParen(p, k + 1, j)) {
        out.push({
          expr: `(${l.expr}${r.expr})`,
          cost:
            l.cost +
            r.cost +
            (p[i - 1] as number) * (p[k] as number) * (p[j] as number),
        });
      }
    }
  }
  return out;
}

/** 괄호 배치 수의 점화식 — `P(1) = 1`, `P(m) = Σ_{k=1..m-1} P(k)·P(m−k)`. */
function parenByRecurrence(n: number): bigint {
  const f = new Array<bigint>(n + 1).fill(0n);
  f[1] = 1n;
  for (let m = 2; m <= n; m++) {
    let s = 0n;
    for (let k = 1; k < m; k++) s += (f[k] as bigint) * (f[m - k] as bigint);
    f[m] = s;
  }
  return f[n] as bigint;
}

/** 닫힌 형태 — `C(2n−2, n−1) / n`. */
function parenClosed(n: number): bigint {
  const m = BigInt(n - 1);
  let binom = 1n;
  for (let t = 0n; t < m; t++) binom = (binom * (2n * m - t)) / (t + 1n);
  return binom / BigInt(n);
}

// 점화식과 닫힌 형태가 어긋나면 「닫았다」가 거짓이다. 실행이 그것을 판정한다.
for (let n = 2; n <= 40; n++) {
  if (parenByRecurrence(n) !== parenClosed(n)) {
    throw new Error(`괄호 배치 수의 닫힌 형태가 점화식과 어긋난다 — n = ${n}`);
  }
}

// 후보 총수의 닫힌 형태도 실측과 맞춰 둔다.
for (let n = 2; n <= 30; n++) {
  const p = Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1);
  if (countedCandidates(p) !== candidates(n)) {
    throw new Error(`후보 총수의 닫힌 형태가 실측과 어긋난다 — n = ${n}`);
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「두 조각이 **만나는 자리**의 차원」을 지키던 줄 — 합치는 비용의 가운데 항 —
 * 에서 `dims[k]` 를 `dims[k + 1]` 로 바꾼 사본. 정본 소스에서 기계로 만든다.
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 만나는차원을옆칸에서 = await loadMutant<{
  matrixChainMultiplication(dims: number[]): number;
}>(
  new URL("./matrixChainMultiplication-guide.ref.ts", import.meta.url).pathname,
  { swap: [/\(dims\[k\] as number\)/, "(dims[k + 1] as number)"] },
);

const 변이표: number[][] = [
  WALK,
  [10, 30, 5, 60],
  [10, 20, 30, 40, 30],
  [2, 3, 4, 2, 5],
  [5, 5, 5, 5],
  [10, 20],
];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  변이표.every(
    (p) =>
      matrixChainMultiplication(p) ===
      만나는차원을옆칸에서.matrixChainMultiplication(p),
  )
) {
  throw new Error(
    "만나는 차원을 옆 칸에서 읽은 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

// 변이가 답을 그대로 두는 입력이 실제로 있다는 것도 본문의 주장이다.
if (
  변이표.every(
    (p) =>
      matrixChainMultiplication(p) !==
      만나는차원을옆칸에서.matrixChainMultiplication(p),
  )
) {
  throw new Error(
    "변이가 모든 입력에서 답을 바꿨다 — 「안 갈린다」가 거짓이다",
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 아무것도 기억하지 않는 재귀가 어디서 실행 불가가 되는가. */
  naiveCalls: () => {
    const rows = [2, 3, 4, 6, 8, 10, 12].map((n) => {
      const p = Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1);
      return [
        comma(n),
        comma(naiveCalls(p)),
        big(callsByRecurrence(n)),
        comma((n * (n + 1)) / 2),
      ];
    });
    rows.push([
      "100",
      "세지 못했다",
      big(callsByRecurrence(100)),
      comma((100 * 101) / 2),
    ]);
    return table(
      ["행렬 수", "실제로 세어 본 호출", "점화식이 내는 호출 수", "구간 수"],
      rows,
    );
  },

  /** `deep.build` ④ — 같은 구간을 몇 번씩 다시 푸는가. */
  sameInterval: () => {
    const n = 5;
    const hit = solvedPerInterval(n);
    const rows: string[][] = [];
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      for (let j = i; j <= n; j++) {
        const c = (hit[i] as number[])[j] as number;
        sum += c;
        rows.push([`A${i} … A${j}`, comma(c), "1"]);
      }
    }
    rows.push(["합계", comma(sum), comma(rows.length)]);
    return table(
      ["구간", "재귀가 그 구간을 푼 횟수", "구간마다 한 번만 정하면"],
      rows,
    );
  },

  /** `deep.build` ⑤ — `k` 를 한 자리로 고정하면 무엇을 놓치는가. */
  splitRule: () =>
    table(
      ["차원 배열", "k = i 로 고정", "k = j−1 로 고정", "k 를 전부 시험"],
      SAMPLES.map((p) => [
        label(p),
        comma(fixedSplit(p, "left")),
        comma(fixedSplit(p, "right")),
        comma(matrixChainMultiplication(p)),
      ]),
    ),

  /** `deep.build` ⑥ — 채우는 순서가 읽는 칸을 준비해 두는가. */
  fillOrder: () =>
    table(
      [
        "채우는 순서",
        "[10, 30, 5, 60, 10]",
        "[10, 20, 30, 40, 30]",
        "[2, 3, 4, 2, 5]",
      ],
      (
        [
          ["길이가 짧은 구간부터", "len"],
          ["i 를 1 부터 · j 를 i 부터", "rowAsc"],
          ["i 를 n 부터 · j 를 i 부터", "rowDesc"],
        ] as [string, "len" | "rowAsc" | "rowDesc"][]
      ).map(([name, order]) => [
        name,
        comma(fillOrder(WALK, order)),
        comma(fillOrder([10, 20, 30, 40, 30], order)),
        comma(fillOrder([2, 3, 4, 2, 5], order)),
      ]),
    ),

  /** `deep.walk.pause` — 비용이 가장 작은 이웃 쌍부터 곱하면 언제 최소를 놓치는가. */
  greedyPairs: () =>
    table(
      ["차원 배열", "비용이 작은 이웃 쌍부터", "최소"],
      SAMPLES.map((p) => [
        label(p),
        comma(cheapestPairFirst(p)),
        comma(matrixChainMultiplication(p)),
      ]),
    ),

  /** `deep.walk.pause` — 가운데에서 가르는 규칙은 표 안에서 먼저 갈린다. */
  midSplit: () => {
    const rows: string[][] = [
      [
        "전개 입력의 dp[2][4]",
        comma(fixedSplitCell(WALK, 2, 4)),
        comma(optimalCell(WALK, 2, 4)),
      ],
      [
        "전개 입력의 답 dp[1][4]",
        comma(fixedSplit(WALK, "mid")),
        comma(matrixChainMultiplication(WALK)),
      ],
    ];
    for (const p of SAMPLES.slice(2)) {
      rows.push([
        `${label(p)} 의 답`,
        comma(fixedSplit(p, "mid")),
        comma(matrixChainMultiplication(p)),
      ]);
    }
    return table(["무엇", "가운데에서 가른다", "전부 시험한다"], rows);
  },

  /** `deep.walk.step` — 표 열 칸과 각 칸이 고른 `k`. */
  walkTable: () => {
    const n = WALK.length - 1;
    const { dp, split } = fillTable(WALK);
    const head = [
      "",
      ...Array.from({ length: n }, (_, t) => `j=${t + 1}`),
      "고른 k",
    ];
    const rows = Array.from({ length: n }, (_, r) => {
      const i = r + 1;
      const line = [`i=${i}  A${i}`];
      for (let j = 1; j <= n; j++) {
        line.push(j < i ? "-" : comma((dp[i] as number[])[j] as number));
      }
      const ks: string[] = [];
      for (let j = 1; j <= n; j++) {
        ks.push(j <= i ? "-" : String((split[i] as number[])[j]));
      }
      line.push(ks.join(" "));
      return line;
    });
    return `${table(head, rows)}\n\n답 = dp[1][${n}] = ${comma(matrixChainMultiplication(WALK))}`;
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  finalRun: () => {
    const 목록: number[][] = [
      WALK,
      [10, 30, 5, 60],
      [10, 20, 30, 40, 30],
      [40, 20, 30, 10, 30],
      [2, 3, 4, 2, 5],
      [5, 5, 5, 5],
      [1, 1, 1, 1, 1],
      [5, 10, 3],
      [10, 20],
      [10],
      [500, 500, 500],
    ];
    const 이름 = 목록.map((p) => `matrixChainMultiplication(${label(p)})`);
    const 폭 = Math.max(...이름.map((s) => s.length));
    return 목록
      .map(
        (p, t) =>
          `${pad(이름[t] as string, 폭)}  →  ${comma(matrixChainMultiplication(p))}`,
      )
      .join("\n");
  },

  /** `purpose.real` — 인용한 문서의 예시와 행렬 셋에서의 갈림. */
  multiDot: () => {
    const three = [10, 100, 5, 50];
    const [a0, a1b0, b1c0, c1] = [10, 100, 5, 50];
    return table(
      ["무엇", "값"],
      [
        [
          "인용한 예시 ((AB)C) 의 비용",
          comma(a0 * a1b0 * b1c0 + a0 * b1c0 * c1),
        ],
        [
          "인용한 예시 (A(BC)) 의 비용",
          comma(a1b0 * b1c0 * c1 + a0 * a1b0 * c1),
        ],
        [
          "이 글의 코드가 [10, 100, 5, 50] 에서 내는 답",
          comma(matrixChainMultiplication(three)),
        ],
        ["행렬 셋에서 표가 견주는 후보 수", comma(candidates(3))],
        ["행렬 셋에서 표가 잡는 칸 수", comma(cells(3))],
        ["인용한 닫힌 비교가 계산하는 값의 수", "2"],
        ["행렬 100 개에서 표가 견주는 후보 수", comma(candidates(100))],
      ],
    );
  },

  /** `deep.math` ②·③ — 괄호 배치 수를 전수·점화식·닫힌 형태로 맞춘다. */
  parenCount: () =>
    table(
      [
        "행렬 수 n",
        "전수로 세어 본 배치",
        "점화식 P(n)",
        "닫힌 형태 C(2n−2, n−1)/n",
        "후보 총수 (n³−n)/6",
      ],
      [2, 3, 4, 5, 6, 8, 10].map((n) => {
        const p = Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1);
        return [
          comma(n),
          comma(enumerateParen(p, 1, n).length),
          comma(parenByRecurrence(n)),
          comma(parenClosed(n)),
          comma(candidates(n)),
        ];
      }),
    ),

  /** `deep.math` ② — 전개 입력의 다섯 배치를 정의에서 직접 센다. */
  parenWalk: () => {
    const n = WALK.length - 1;
    const list = enumerateParen(WALK, 1, n).sort((a, b) => a.cost - b.cost);
    const body = table(
      ["전개 입력의 괄호 배치", "곱셈 횟수"],
      list.map((x) => [x.expr, comma(x.cost)]),
    );
    return `${body}\n\n배치 수 = ${comma(list.length)} · 최솟값 = ${comma(matrixChainMultiplication(WALK))}`;
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣는다. */
  parenScale: () => {
    const n = 100;
    return table(
      ["무엇", "값"],
      [
        ["행렬 100 개의 괄호 배치 수", big(parenClosed(n))],
        ["그 값의 자릿수", comma(String(parenClosed(n)).length)],
        ["표가 견주는 후보 총수 (n³−n)/6", comma(candidates(n))],
        ["표가 잡는 칸 수 (n+1)²", comma(cells(n))],
        [
          "배치 수가 후보 총수의 몇 배인가 — 그 배수의 자릿수",
          comma(String(parenClosed(n) / BigInt(candidates(n))).length),
        ],
      ],
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  mutantJoinDim: () =>
    table(
      ["차원 배열", "바른 코드", "만나는 차원을 옆 칸에서 읽은 코드"],
      변이표.map((p) => [
        label(p),
        comma(matrixChainMultiplication(p)),
        comma(만나는차원을옆칸에서.matrixChainMultiplication(p)),
      ]),
    ),

  /** `perf.worst` — 입력의 내용이 견주기 횟수를 가르는가. */
  worstFill: () => {
    const n = 100;
    const 입력: [string, number[]][] = [
      ["차원이 전부 1", new Array<number>(n + 1).fill(1)],
      ["차원이 전부 500", new Array<number>(n + 1).fill(500)],
      [
        "1 과 500 이 번갈아",
        Array.from({ length: n + 1 }, (_, t) => (t % 2 === 0 ? 1 : 500)),
      ],
      [
        "(13t mod 50) + 1",
        Array.from({ length: n + 1 }, (_, t) => ((t * 13) % 50) + 1),
      ],
      [
        "1 부터 101 까지 오름차순",
        Array.from({ length: n + 1 }, (_, t) => t + 1),
      ],
    ];
    return table(
      ["입력 (행렬 100 개)", "답", "견주기 횟수"],
      입력.map(([이름, p]) => [
        이름,
        comma(matrixChainMultiplication(p)),
        comma(countedCandidates(p)),
      ]),
    );
  },

  /** `perf.worst` — 시간이 아니라 **답의 크기**를 최악으로 만드는 입력. */
  answerScale: () => {
    const p = new Array<number>(101).fill(500);
    const answer = matrixChainMultiplication(p);
    return table(
      ["무엇", "값"],
      [
        ["차원이 전부 500 · 행렬 100 개일 때의 답", comma(answer)],
        ["배정밀도 정수가 정확한 상한", comma(Number.MAX_SAFE_INTEGER)],
        [
          "상한이 그 답의 몇 배인가",
          comma(Math.floor(Number.MAX_SAFE_INTEGER / answer)),
        ],
      ],
    );
  },
};
