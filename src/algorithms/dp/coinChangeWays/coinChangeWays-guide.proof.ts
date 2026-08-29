/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/coinChangeWays/coinChangeWays-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { coinChangeWays } from "./coinChangeWays-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1010101` → `1,010,101`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 2^53 을 넘는 값은 자릿수로 적는다 — `2.27e+91` → `2.27 × 10^91`. */
const big = (n: number): string => {
  if (n <= 9_007_199_254_740_991) return comma(n);
  const [m, e] = n.toExponential(2).split("e+");
  return `${m} × 10^${e}`;
};

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

/* ────────────────────────── 계측판 ────────────────────────── */

/** 동전 액면가 `1 … k`. */
const upTo = (k: number): number[] =>
  Array.from({ length: k }, (_, i) => i + 1);

/**
 * 완전 탐색 — 동전 종류를 하나씩 보면서 그 동전을 몇 개 쓸지 전부 시도한다.
 * 호출 수와 **서로 다른 `(i, a)` 짝의 수**를 함께 센다.
 */
function bruteForce(
  coins: number[],
  amount: number,
): { 호출: number; 상태: number; 답: number } {
  let 호출 = 0;
  const 본것 = new Set<number>();
  const go = (i: number, rest: number): number => {
    호출++;
    본것.add(i * (amount + 1) + rest);
    if (rest === 0) return 1;
    if (i === coins.length) return 0;
    let 합 = 0;
    const c = coins[i] as number;
    for (let k = 0; c * k <= rest; k++) 합 += go(i + 1, rest - c * k);
    return 합;
  };
  const 답 = go(0, amount);
  return { 호출, 상태: 본것.size, 답 };
}

/** 금액을 바깥 루프에 두는 방식 — 상태가 금액 하나뿐이라 **순서 있는 나열**을 센다. */
function amountOuter(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a >= c) dp[a] = (dp[a] as number) + (dp[a - c] as number);
    }
  }
  return dp[amount] as number;
}

/** 상태에 「지금까지 쓴 동전 개수 `m`」까지 넣은 표. 답은 같고 칸만 는다. */
function withCount(coins: number[], amount: number): number {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () =>
    Array.from({ length: amount + 1 }, () =>
      new Array<number>(amount + 1).fill(0),
    ),
  );
  ((dp[0] as number[][])[0] as number[])[0] = 1;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    for (let a = 0; a <= amount; a++) {
      for (let m = 0; m <= amount; m++) {
        const 윗줄 = ((dp[i - 1] as number[][])[a] as number[])[m] as number;
        const 왼쪽 =
          a >= c && m >= 1
            ? (((dp[i] as number[][])[a - c] as number[])[m - 1] as number)
            : 0;
        ((dp[i] as number[][])[a] as number[])[m] = 윗줄 + 왼쪽;
      }
    }
  }
  let 합 = 0;
  for (let m = 0; m <= amount; m++) {
    합 += ((dp[n] as number[][])[amount] as number[])[m] as number;
  }
  return 합;
}

/** 정확한 답 — 부동소수와 갈리는 자리를 보이려고 정수 산술로 따로 센다. */
function exact(coins: number[], amount: number): bigint {
  const dp = new Array<bigint>(amount + 1).fill(0n);
  dp[0] = 1n;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) {
      dp[a] = (dp[a] as bigint) + (dp[a - c] as bigint);
    }
  }
  return dp[amount] as bigint;
}

const 쉼표 = (v: bigint): string =>
  v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식을 지키던 줄 — 같은 줄의 왼쪽 칸을 읽는 자리 — 를 **윗 줄**로 바꾼 사본.
 * 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 윗줄에서읽기 = await loadMutant<{
  coinChangeWays(coins: number[], amount: number): number;
}>(new URL("./coinChangeWays-guide.ref.ts", import.meta.url).pathname, {
  swap: [/\(cur\[a - c\] as number\)/, "(prev[a - c] as number)"],
});

/** 금액 0 칸을 1 대신 0 으로 둔 사본. */
const 첫칸이0 = await loadMutant<{
  coinChangeWays(coins: number[], amount: number): number;
}>(new URL("./coinChangeWays-guide.ref.ts", import.meta.url).pathname, {
  swap: [/\(dp\[0\] as number\[\]\)\[0\] = 1;/, "(dp[0] as number[])[0] = 0;"],
});

const 윗줄표: [string, number[], number][] = [
  ["[1, 2, 5] / 5", [1, 2, 5], 5],
  ["[1, 2, 5] / 6", [1, 2, 5], 6],
  ["[1, 2, 3] / 4", [1, 2, 3], 4],
  ["[1, 2, 5] / 100", [1, 2, 5], 100],
  ["[1] / 10000", [1], 10_000],
];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  윗줄표.every(
    ([, coins, amount]) =>
      coinChangeWays(coins, amount) ===
      윗줄에서읽기.coinChangeWays(coins, amount),
  )
) {
  throw new Error(
    "윗 줄에서 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

/* ────────────────── 바깥 자료가 적은 값 (대조용) ────────────────── */

/**
 * 인용한 문서가 적어 둔 값. **이 글의 코드가 낸 값과 다르면 여기서 실패한다** —
 * 인용이 맞는지를 사람이 다시 읽어 확인하는 자리를 없앤다.
 */
const 바깥값: [string, number[], number, number][] = [
  [
    "GAP  NrRestrictedPartitions(50, [1,2,5,10,20,50])",
    [1, 2, 5, 10, 20, 50],
    50,
    451,
  ],
  ["GAP  RestrictedPartitions(8, [1,3,5,7]) 의 개수", [1, 3, 5, 7], 8, 6],
  [
    "SICP  count-change(100), 동전 [1,5,10,25,50]",
    [1, 5, 10, 25, 50],
    100,
    292,
  ],
];
for (const [이름, coins, amount, 적힌값] of 바깥값) {
  if (coinChangeWays(coins, amount) !== 적힌값) {
    throw new Error(`${이름} 의 인용값과 실행값이 다르다`);
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 완전 탐색이 만드는 잎의 수는 답 자체다. */
  "brute-leaves": () =>
    table(
      ["동전", "금액", "조합의 수 = 완전 탐색이 만드는 잎"],
      [
        ["[1, 2, 5]", "5", big(coinChangeWays([1, 2, 5], 5))],
        ["[1, 2, 5]", "100", big(coinChangeWays([1, 2, 5], 100))],
        ["1 … 10", "1,000", big(coinChangeWays(upTo(10), 1000))],
        ["1 … 100", "10,000", big(coinChangeWays(upTo(100), 10_000))],
      ],
    ),

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 적는다. */
  "repeat-vs-state": () =>
    table(
      ["금액", "완전 탐색 호출", "서로 다른 (i, a)", "겹쳐 부른 횟수"],
      [5, 20, 40, 60, 80].map((amount) => {
        const r = bruteForce([1, 2, 5], amount);
        return [
          comma(amount),
          comma(r.호출),
          comma(r.상태),
          comma(r.호출 - r.상태),
        ];
      }),
    ),

  /** `deep.build` ⑤ — 금액 하나만 기억하면 조합이 아니라 나열이 세어진다. */
  "amount-only": () =>
    table(
      ["금액", "금액만 기억", "(i, a) 를 기억"],
      [3, 4, 5, 6, 10, 20].map((amount) => [
        comma(amount),
        comma(amountOuter([1, 2, 5], amount)),
        comma(coinChangeWays([1, 2, 5], amount)),
      ]),
    ),

  /** `deep.build` ⑥ — 상태 후보 셋을 실제로 시험한다. */
  "state-size": () => {
    const 작은 = { coins: [1, 2, 5], amount: 5 };
    const n = 100;
    const A = 10_000;
    return table(
      ["상태", "[1,2,5] / 5 의 답", "그때 칸 수", "제약 최대의 칸 수"],
      [
        [
          "금액 a 만",
          comma(amountOuter(작은.coins, 작은.amount)),
          comma(작은.amount + 1),
          comma(A + 1),
        ],
        [
          "(i, a)",
          comma(coinChangeWays(작은.coins, 작은.amount)),
          comma((작은.coins.length + 1) * (작은.amount + 1)),
          comma((n + 1) * (A + 1)),
        ],
        [
          "(i, a, 쓴 동전 개수 m)",
          comma(withCount(작은.coins, 작은.amount)),
          comma((작은.coins.length + 1) * (작은.amount + 1) ** 2),
          comma((n + 1) * (A + 1) ** 2),
        ],
      ],
    );
  },

  /** `deep.walk.pause` — 두 루프를 맞바꾸면 순서 있는 나열이 세어진다. */
  "loop-swap": () =>
    table(
      ["금액", "동전이 바깥 (이 가이드)", "금액이 바깥"],
      [3, 4, 5, 6, 10].map((amount) => [
        comma(amount),
        comma(coinChangeWays([1, 2, 5], amount)),
        comma(amountOuter([1, 2, 5], amount)),
      ]),
    ),

  /** `deep.walk.pause` — 금액 0 칸을 0 으로 두면 표 전체가 0 이 된다. */
  "zero-cell": () =>
    table(
      ["입력", "바른 코드", "첫 칸을 0 으로 둔 코드"],
      [
        ["[1, 2, 5] / 0", [1, 2, 5], 0],
        ["[1, 2, 5] / 5", [1, 2, 5], 5],
        ["[1, 2, 3] / 4", [1, 2, 3], 4],
        ["[1] / 10000", [1], 10_000],
      ].map(([이름, coins, amount]) => [
        이름 as string,
        comma(coinChangeWays(coins as number[], amount as number)),
        comma(첫칸이0.coinChangeWays(coins as number[], amount as number)),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const 목록: [string, number[], number][] = [
      ["coinChangeWays([1, 2, 5], 5)", [1, 2, 5], 5],
      ["coinChangeWays([1, 2, 3], 4)", [1, 2, 3], 4],
      ["coinChangeWays([2], 3)", [2], 3],
      ["coinChangeWays([1, 2, 5], 0)", [1, 2, 5], 0],
      ["coinChangeWays([], 5)", [], 5],
      ["coinChangeWays([5, 10], 3)", [5, 10], 3],
      ["coinChangeWays([1], 10000)", [1], 10_000],
    ];
    const 폭 = Math.max(...목록.map(([s]) => s.length));
    return 목록
      .map(
        ([s, coins, amount]) =>
          `${pad(s, 폭)}  →  ${padL(comma(coinChangeWays(coins, amount)), 3)}`,
      )
      .join("\n");
  },

  /** `purpose.real` — 인용한 두 자료의 값을 이 글의 코드로 재현한다. */
  "library-check": () =>
    table(
      ["어디서", "그 자료가 적은 값", "이 글의 코드"],
      바깥값.map(([이름, coins, amount, 적힌값]) => [
        이름,
        comma(적힌값),
        comma(coinChangeWays(coins, amount)),
      ]),
    ),

  /** `deep.math` ② — 닫힌 형태 `⌊a/c⌋ + 1` 이 표를 채운 값과 같은지 검산한다. */
  "closed-form": () =>
    table(
      ["c", "a", "표를 채운 값", "⌊a/c⌋ + 1", ""],
      [
        [2, 1],
        [2, 10],
        [2, 10_000],
        [3, 17],
        [5, 100],
      ].map(([c, a]) => {
        const 표 = coinChangeWays([1, c as number], a as number);
        const 식 = Math.floor((a as number) / (c as number)) + 1;
        return [
          String(c),
          comma(a as number),
          comma(표),
          comma(식),
          표 === 식 ? "같다" : "다르다",
        ];
      }),
    ),

  /** `deep.math` ④ — 표 칸 수와 답의 크기를 제약 규모에서 나란히 놓는다. */
  "cells-vs-answer": () =>
    table(
      ["n", "A", "표 칸 수 (n+1)(A+1)", "조합의 수"],
      [
        [3, 5],
        [3, 100],
        [3, 10_000],
        [100, 10_000],
      ].map(([n, A]) => [
        comma(n as number),
        comma(A as number),
        comma(((n as number) + 1) * ((A as number) + 1)),
        big(
          coinChangeWays(
            (n as number) === 3 ? [1, 2, 5] : upTo(100),
            A as number,
          ),
        ),
      ]),
    ),

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  "mutant-prev": () =>
    table(
      ["입력", "바른 코드", "윗 줄에서 읽은 코드"],
      윗줄표.map(([이름, coins, amount]) => [
        이름,
        comma(coinChangeWays(coins, amount)),
        comma(윗줄에서읽기.coinChangeWays(coins, amount)),
      ]),
    ),

  /** `perf.worst` — 답이 2^53 을 넘는 자리에서 반환값이 정확한 정수가 아니게 된다. */
  "float-limit": () =>
    table(
      ["동전", "금액", "정확한 답", "이 코드가 낸 값", "차이"],
      [200, 299, 300, 301].map((amount) => {
        const 정확 = exact(upTo(100), amount);
        const 낸값 = coinChangeWays(upTo(100), amount);
        return [
          "1 … 100",
          comma(amount),
          쉼표(정확),
          comma(낸값),
          쉼표(BigInt(낸값) - 정확),
        ];
      }),
    ),
};
