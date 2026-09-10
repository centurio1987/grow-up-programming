/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

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

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `1.91 × 10^2090` 꼴. */
const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  const head = `${s[0]}.${s.slice(1, 3)}`;
  return `${head} × 10^${s.length - 1}`;
};

/** 반환값을 본문 표기로 적는다. 못 만들면 `-1` 그대로다. */
const show = (v: number): string => comma(v);

/* ────────────────────────── 계측판 ────────────────────────── */

/** 전개가 쓰는 입력. 본문의 다른 자리도 같은 배열을 가리킨다. */
const WALK = [3, 4, 1];

/** 액면가를 그대로 적는다 — `[3, 4, 1] / 6` 꼴. */
const label = (coins: number[], amount: number): string =>
  `[${coins.join(", ")}] / ${amount}`;

/** 아무것도 기억하지 않는 재귀. 호출 하나마다 1 을 센다. */
function naiveCalls(coins: number[], amount: number): number {
  let calls = 0;
  const solve = (rest: number): number => {
    calls++;
    if (rest === 0) return 0;
    if (rest < 0) return Number.POSITIVE_INFINITY;
    let best = Number.POSITIVE_INFINITY;
    for (const c of coins) {
      const sub = solve(rest - c);
      if (sub + 1 < best) best = sub + 1;
    }
    return best;
  };
  solve(amount);
  return calls;
}

/**
 * 위 재귀의 호출 수를 세는 점화식 — `C(a) = 1 + Σ_c C(a − c)`, `a ≤ 0` 이면 `C = 1`.
 * 실제로 못 돌릴 크기에서도 정확한 값을 낸다. 작은 값에서 `naiveCalls` 와 같은지 아래에서 확인한다.
 */
function callsByRecurrence(coins: number[], amount: number): bigint {
  const c = new Array<bigint>(amount + 1).fill(0n);
  c[0] = 1n;
  for (let a = 1; a <= amount; a++) {
    let sum = 1n;
    for (const coin of coins)
      sum += a - coin >= 0 ? (c[a - coin] as bigint) : 1n;
    c[a] = sum;
  }
  return c[amount] as bigint;
}

// 점화식이 실제 호출 수와 어긋나면 아래 표의 큰 값이 아무것도 뜻하지 않는다.
for (const a of [6, 10, 15, 20]) {
  if (BigInt(naiveCalls(WALK, a)) !== callsByRecurrence(WALK, a)) {
    throw new Error(`점화식이 실제 호출 수와 어긋난다 — 금액 ${a}`);
  }
}

/** 금액마다 재귀가 그 금액을 몇 번 다시 푸는가. */
function solvedPerAmount(coins: number[], amount: number): number[] {
  const hit = new Array<number>(amount + 1).fill(0);
  const solve = (rest: number): number => {
    if (rest >= 0) hit[rest] = (hit[rest] as number) + 1;
    if (rest === 0) return 0;
    if (rest < 0) return Number.POSITIVE_INFINITY;
    let best = Number.POSITIVE_INFINITY;
    for (const c of coins) {
      const sub = solve(rest - c);
      if (sub + 1 < best) best = sub + 1;
    }
    return best;
  };
  solve(amount);
  return hit;
}

/** 층 없이 금액 한 줄만 두고 채운다. `ascending` 이 거짓이면 금액을 큰 쪽부터 정한다. */
function oneRow(coins: number[], amount: number, ascending: boolean): number {
  const dp = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  dp[0] = 0;
  const step = (a: number): void => {
    for (const c of coins) {
      if (a < c) continue;
      const take = (dp[a - c] as number) + 1;
      if (take < (dp[a] as number)) dp[a] = take;
    }
  };
  if (ascending) for (let a = 1; a <= amount; a++) step(a);
  else for (let a = amount; a >= 1; a--) step(a);
  const best = dp[amount] as number;
  return Number.isFinite(best) ? best : -1;
}

/** 층을 두고 `a - c` 를 이번 줄에서(정본) 또는 윗 줄에서 읽는다. */
function layered(coins: number[], amount: number, sameRow: boolean): number {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY),
  );
  (dp[0] as number[])[0] = 0;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let a = 0; a <= amount; a++) {
      if (a < c) cur[a] = prev[a] as number;
      else {
        const skip = prev[a] as number;
        const take = ((sameRow ? cur[a - c] : prev[a - c]) as number) + 1;
        cur[a] = skip <= take ? skip : take;
      }
    }
  }
  const best = (dp[n] as number[])[amount] as number;
  return Number.isFinite(best) ? best : -1;
}

/** 큰 액면가부터 최대한 많이 집는다. */
function greedy(coins: number[], amount: number): number {
  const sorted = [...coins].sort((a, b) => b - a);
  let rest = amount;
  let count = 0;
  for (const c of sorted) {
    const k = Math.floor(rest / c);
    count += k;
    rest -= k * c;
  }
  return rest === 0 ? count : -1;
}

/** 못 만드는 칸을 `Infinity` 대신 `-1` 로 두고 같은 절차를 돌린 판. */
function minusOneCell(coins: number[], amount: number): number {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(-1),
  );
  (dp[0] as number[])[0] = 0;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let a = 0; a <= amount; a++) {
      if (a < c) cur[a] = prev[a] as number;
      else {
        const skip = prev[a] as number;
        const take = (cur[a - c] as number) + 1;
        cur[a] = skip <= take ? skip : take;
      }
    }
  }
  return (dp[n] as number[])[amount] as number;
}

/** 액면가 둘로 못 만드는 금액을 `upTo` 까지 모은다. */
function unmakeable(p: number, q: number, upTo: number): number[] {
  const out: number[] = [];
  for (let a = 1; a <= upTo; a++) {
    if (unboundedKnapsack([p, q], a) === -1) out.push(a);
  }
  return out;
}

/** 값을 정한 칸 수. `skipSmall` 이면 `a < c` 인 칸을 아예 건너뛴다. */
function decidedCells(
  coins: number[],
  amount: number,
  skipSmall: boolean,
): number {
  let cells = amount + 1;
  const dp = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  dp[0] = 0;
  for (const c of coins) {
    for (let a = skipSmall ? c : 0; a <= amount; a++) {
      cells++;
      if (a < c) continue;
      const take = (dp[a - c] as number) + 1;
      if (take < (dp[a] as number)) dp[a] = take;
    }
  }
  return cells;
}

const repeat = (v: number, n: number): number[] => new Array(n).fill(v);

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「최소 **동전 개수**」를 지키던 줄 — 읽어 온 값에 1 을 더하는 자리 — 에서 그
 * `+ 1` 을 지운 사본. 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면
 * `loadMutant` 가 던진다.
 */
const 개수를안더하기 = await loadMutant<{
  unboundedKnapsack(coins: number[], amount: number): number;
}>(new URL("./unboundedKnapsack-guide.ref.ts", import.meta.url).pathname, {
  swap: [/\(cur\[a - c\] as number\) \+ 1/, "(cur[a - c] as number)"],
});

const 변이표: [number[], number][] = [
  [WALK, 6],
  [WALK, 5],
  [[1, 2, 5], 11],
  [[3], 9],
  [WALK, 0],
  [[5, 10], 3],
];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  변이표.every(
    ([coins, amount]) =>
      unboundedKnapsack(coins, amount) ===
      개수를안더하기.unboundedKnapsack(coins, amount),
  )
) {
  throw new Error(
    "1 을 안 더하는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

// 이 변이가 「만들 수 있는가」는 그대로 답한다는 것이 본문의 주장이다. 실행이 그것을 잰다.
for (const [coins, amount] of [
  [WALK, 6],
  [WALK, 0],
  [[1, 2, 5], 11],
  [[3], 9],
  [[3], 10],
  [[5, 10], 3],
  [[2], 3],
] as [number[], number][]) {
  const 정본 = unboundedKnapsack(coins, amount) >= 0;
  const 변이 = 개수를안더하기.unboundedKnapsack(coins, amount) >= 0;
  if (정본 !== 변이) {
    throw new Error(
      `1 을 안 더하는 변이가 도달 가능성까지 바꿨다 — [${coins}] / ${amount}`,
    );
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 아무것도 기억하지 않는 재귀가 어디서 끊기는가. */
  naiveCalls: () => {
    const rows = [6, 10, 15, 20, 25, 30].map((a) => [
      comma(a),
      comma(naiveCalls(WALK, a)),
      big(callsByRecurrence(WALK, a)),
      comma((WALK.length + 1) * (a + 1)),
    ]);
    rows.push([
      "10,000",
      "세지 못했다",
      big(callsByRecurrence(WALK, 10_000)),
      comma((WALK.length + 1) * 10_001),
    ]);
    return table(
      ["금액", "실제로 세어 본 호출", "점화식이 내는 호출 수", "표 칸 수"],
      rows,
    );
  },

  /** `deep.build` ④ — 같은 금액을 몇 번씩 다시 푸는가. */
  solvedAgain: () => {
    const hit = solvedPerAmount(WALK, 12);
    const rows = hit.map((n, a) => [comma(a), comma(n), "1"]).reverse();
    rows.push([
      "합계",
      comma(hit.reduce((s, v) => s + v, 0)),
      comma(hit.length),
    ]);
    return table(
      ["금액", "재귀가 그 금액을 푼 횟수", "금액마다 한 번만 정하면"],
      rows,
    );
  },

  /** `deep.build` ⑤ — 금액을 큰 쪽부터 정하면 읽는 칸이 아직 안 정해져 있다. */
  fillOrder: () =>
    table(
      ["입력", "정본", "금액 작은 쪽부터", "금액 큰 쪽부터"],
      (
        [
          [WALK, 6],
          [WALK, 11],
          [[1, 2, 5], 11],
          [[2], 6],
          [[1], 5],
          [[3, 4], 5],
        ] as [number[], number][]
      ).map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(oneRow(coins, amount, true)),
        show(oneRow(coins, amount, false)),
      ]),
    ),

  /** `deep.build` ⑥ — 층을 둘 것인가, `a - c` 를 어느 줄에서 읽을 것인가. */
  rowChoice: () => {
    const n = 100;
    const A = 10_000;
    return table(
      [
        "상태",
        "[3, 4, 1] / 6 의 답",
        "[1, 2, 5] / 11 의 답",
        "제약 최대의 칸 수",
      ],
      [
        [
          "금액 하나 (층 없음)",
          show(oneRow(WALK, 6, true)),
          show(oneRow([1, 2, 5], 11, true)),
          comma(A + 1),
        ],
        [
          "(i, a) · a-c 를 이번 줄에서",
          show(layered(WALK, 6, true)),
          show(layered([1, 2, 5], 11, true)),
          comma((n + 1) * (A + 1)),
        ],
        [
          "(i, a) · a-c 를 윗 줄에서",
          show(layered(WALK, 6, false)),
          show(layered([1, 2, 5], 11, false)),
          comma((n + 1) * (A + 1)),
        ],
      ],
    );
  },

  /** `deep.walk.pause` — 큰 액면가부터 집는 방법이 언제 최소를 놓치는가. */
  greedySystems: () =>
    table(
      ["액면가", "0…200 에서 최소와 갈리는 금액", "가장 작은 자리"],
      (
        [
          [1, 5, 10, 25],
          [1, 10, 50, 100, 500],
          [3, 4, 1],
          [1, 4, 5],
        ] as number[][]
      ).map((coins) => {
        const gaps: number[] = [];
        for (let a = 0; a <= 200; a++) {
          if (greedy(coins, a) !== unboundedKnapsack(coins, a)) gaps.push(a);
        }
        return [
          `[${coins.join(", ")}]`,
          `${comma(gaps.length)} 개`,
          gaps.length === 0 ? "없다" : comma(gaps[0] as number),
        ];
      }),
    ),

  /** `deep.walk.pause` — 전개 입력에서 두 방법이 실제로 낸 개수. */
  greedyWalk: () =>
    table(
      ["금액", "큰 액면가부터 집는다", "최소"],
      [6, 7, 8, 9, 10, 11, 12].map((a) => [
        comma(a),
        show(greedy(WALK, a)),
        show(unboundedKnapsack(WALK, a)),
      ]),
    ),

  /** `deep.walk.pause` — 못 만드는 칸에 `-1` 을 적으면. */
  minusOne: () =>
    table(
      ["입력", "정본", "칸에 -1 을 적은 판"],
      (
        [
          [WALK, 6],
          [WALK, 3],
          [[1, 2, 5], 11],
          [[1], 5],
          [[2], 3],
          [[5, 10], 3],
        ] as [number[], number][]
      ).map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(minusOneCell(coins, amount)),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  finalRun: () => {
    const 목록: [number[], number][] = [
      [WALK, 6],
      [[1, 2, 5], 11],
      [[1, 3, 4], 6],
      [[2], 3],
      [[1], 0],
      [[], 0],
      [[], 5],
      [[7, 7, 7], 7],
      [[5, 10], 3],
      [[10_000], 10_000],
    ];
    const 이름 = 목록.map(
      ([coins, amount]) =>
        `unboundedKnapsack([${coins.join(", ")}], ${amount})`,
    );
    const 폭 = Math.max(...이름.map((s) => s.length));
    return 목록
      .map(
        ([coins, amount], i) =>
          `${pad(이름[i] as string, 폭)}  →  ${show(unboundedKnapsack(coins, amount))}`,
      )
      .join("\n");
  },

  /** `purpose.real` — 인용한 변환 규칙(`round(mass / precision)`)을 넣으면 열이 몇 개가 되는가. */
  massColumns: () => {
    const col = (mass: number, precision: number): number =>
      Math.round(mass / precision) + 1;
    return table(
      ["무엇", "값"],
      [
        ["이 글의 표 — 열 수 (금액 0 … 10,000)", comma(10_001)],
        ["이 글의 표 — 칸 수 (액면가 100 종)", comma(101 * 10_001)],
        ["질량 1,000 Da 를 0.0001 Da 로 끊은 열 수", comma(col(1_000, 0.0001))],
        ["질량 5,000 Da 를 0.0001 Da 로 끊은 열 수", comma(col(5_000, 0.0001))],
        [
          "알파벳 20 종일 때 5,000 Da 짜리 표의 칸 수",
          comma(21 * col(5_000, 0.0001)),
        ],
      ],
    );
  },

  /** `deep.math` ② — 두 액면가로 못 만드는 금액을 전수로 세어 식과 맞춘다. */
  frobeniusCheck: () =>
    table(
      [
        "p, q",
        "못 만드는 금액",
        "가장 큰 것",
        "g(p, q)",
        "개수",
        "(p−1)(q−1)/2",
      ],
      (
        [
          [2, 3],
          [3, 4],
          [3, 5],
          [4, 7],
          [5, 6],
        ] as [number, number][]
      ).map(([p, q]) => {
        const u = unmakeable(p, q, 200);
        return [
          `${p}, ${q}`,
          u.join(" "),
          comma(Math.max(...u)),
          comma(p * q - p - q),
          comma(u.length),
          comma(((p - 1) * (q - 1)) / 2),
        ];
      }),
    ),

  /** `deep.math` ④ — 그 식에 제약 규모를 넣는다. */
  frobeniusScale: () => {
    const p = 9_999;
    const q = 10_000;
    return table(
      ["무엇", "값"],
      [
        ["못 만드는 가장 큰 금액 g(p, q)", comma(p * q - p - q)],
        ["못 만드는 금액의 개수 (p−1)(q−1)/2", comma(((p - 1) * (q - 1)) / 2)],
        ["이 문제의 금액 상한", comma(10_000)],
        ["표 칸 수 (n+1)(A+1), n = 100", comma(101 * 10_001)],
        ["답의 상한 ⌊A / 가장 작은 액면가⌋, 액면가 1", comma(10_000)],
      ],
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  mutantNoCount: () =>
    table(
      ["입력", "바른 코드", "1 을 안 더한 코드"],
      변이표.map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(개수를안더하기.unboundedKnapsack(coins, amount)),
      ]),
    ),

  /** `perf.worst` — 못 쓰는 칸을 건너뛰어도 최악은 그대로인가. */
  worstFill: () => {
    const A = 10_000;
    const 입력: [string, number[]][] = [
      ["액면가 100 종이 전부 1", repeat(1, 100)],
      ["액면가 100 종이 1 … 100", Array.from({ length: 100 }, (_, i) => i + 1)],
      ["액면가 100 종이 전부 5,000", repeat(5_000, 100)],
      ["액면가 100 종이 전부 10,000", repeat(10_000, 100)],
    ];
    return table(
      ["입력 (금액 = 10,000)", "답", "정본이 정한 칸", "건너뛰기판이 정한 칸"],
      입력.map(([이름, coins]) => [
        이름,
        show(unboundedKnapsack(coins, A)),
        comma(decidedCells(coins, A, false)),
        comma(decidedCells(coins, A, true)),
      ]),
    );
  },
};
