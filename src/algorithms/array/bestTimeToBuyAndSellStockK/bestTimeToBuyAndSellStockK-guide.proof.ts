/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts bestTimeToBuyAndSellStockK-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 도달할 수 없는 상태를 본문·시뮬과 같은 글자로 적는다. */
const cell = (n: number): string => (Number.isFinite(n) ? num(n) : "-∞");

/** `[2 6 3]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        align[i] === "r" ? padLeft(c, w[i] ?? 0) : padRight(c, w[i] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 이익이 나는 상승 구간이 셋인데 거래는 둘까지라 **`k` 가 실제로 답을 제한하고**, 답
 * 10 이 한 거래로는 안 나오며(한 번이면 7), 가장 큰 단일 거래를 먼저 확정하는 방법이
 * 어긋나는 자리도 이 입력에서 확인된다.
 */
const WALK: number[] = [2, 6, 3, 9, 5, 7];

/** 전개가 쓰는 거래 횟수 상한. */
const WALK_K = 2;

/** 제약이 정한 날짜 수의 최댓값. */
const LIMIT_N = 1_000;

/** 제약이 정한 거래 횟수의 최댓값. */
const LIMIT_K = 100;

/** 제약이 정한 가격의 최댓값. */
const MAX_PRICE = 10_000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  /** 덧셈·뺄셈 횟수. */
  adds: number;
  /** 비교 횟수. */
  cmps: number;
  /** 만들어 본 거래 집합의 수(열거 방식에만 있다). */
  sets: number;
}

/**
 * 거래 집합을 전부 만들어 보는 방식. 매수일과 매도일을 `i < j` 로 고르고 다음 매수일을
 * `j` 보다 뒤에서 고르므로, 만들어지는 집합이 정확히 `Σ_{t≤k} C(N, 2t)` 개다.
 *
 * 정의를 그대로 옮긴 것이라 답의 기준이 된다.
 */
function byEnumerating(k: number, prices: number[]): Counted {
  const n = prices.length;
  let best = 0;
  let adds = 0;
  let cmps = 0;
  let sets = 0;
  const walk = (start: number, left: number, acc: number): void => {
    sets++;
    cmps++;
    best = Math.max(best, acc);
    if (left === 0) return;
    for (let i = start; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        adds += 2; // 이익 뺄셈 하나와 누적 덧셈 하나
        walk(
          j + 1,
          left - 1,
          acc + (prices[j] as number) - (prices[i] as number),
        );
      }
    }
  };
  walk(0, k, 0);
  return { answer: best, adds, cmps, sets };
}

/** 정본과 같은 절차에 계수만 덧붙인 것. (날, 거래 번호) 하나마다 덧셈·뺄셈 둘과 비교 둘이다. */
function byTable(k: number, prices: number[]): Counted {
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);
  let adds = 0;
  let cmps = 0;
  for (const price of prices) {
    for (let t = 1; t <= k; t++) {
      adds++;
      cmps++;
      hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
      adds++;
      cmps++;
      free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
    }
  }
  return { answer: free[k] as number, adds, cmps, sets: 0 };
}

/**
 * 갱신 자리 `2Nk` 개 중 **값이 실제로 바뀐 자리**를 센다. 기본 연산 수와 달리 이 수는 입력의
 * 모양을 따라 갈리므로, 「가격이 자주 오르내리면 느리다」는 통념을 값으로 반박하는 데 쓴다.
 */
function movedCells(k: number, prices: number[]): number {
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);
  let moved = 0;
  for (const price of prices) {
    for (let t = 1; t <= k; t++) {
      const beforeHold = hold[t] as number;
      const beforeFree = free[t] as number;
      hold[t] = Math.max(beforeHold, (free[t - 1] as number) - price);
      free[t] = Math.max(beforeFree, (hold[t] as number) + price);
      if (hold[t] !== beforeHold) moved++;
      if (free[t] !== beforeFree) moved++;
    }
  }
  return moved;
}

/** 한 번 실행한 뒤의 `free` 배열 전체. 거래 번호마다 하나씩 들어 있다. */
function freeRow(k: number, prices: number[]): number[] {
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);
  for (const price of prices) {
    for (let t = 1; t <= k; t++) {
      hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
      free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
    }
  }
  return free;
}

/** 1 회 거래 문제의 상태(지금까지의 최저가) 하나만 들고 가는 후보. */
function singleTradeOnly(_k: number, prices: number[]): number {
  if (prices.length < 2) return 0;
  let low = prices[0] as number;
  let best = 0;
  for (const p of prices) {
    best = Math.max(best, p - low);
    low = Math.min(low, p);
  }
  return best;
}

/**
 * 가장 큰 단일 거래를 확정하고 그 매수일·매도일을 배열에서 지운 뒤 같은 일을 `k` 번
 * 되풀이하는 후보. 날을 지우는 조작이 시간 순서를 지키지 않는다.
 */
function biggestFirst(k: number, prices: number[]): number {
  let days = [...prices];
  let total = 0;
  for (let round = 0; round < k; round++) {
    let buyAt = -1;
    let sellAt = -1;
    let gain = 0;
    for (let i = 0; i < days.length; i++) {
      for (let j = i + 1; j < days.length; j++) {
        const g = (days[j] as number) - (days[i] as number);
        if (g > gain) {
          gain = g;
          buyAt = i;
          sellAt = j;
        }
      }
    }
    if (gain === 0) break;
    total += gain;
    days = days.filter((_, idx) => idx !== buyAt && idx !== sellAt);
  }
  return total;
}

/** `free` 배열 전체의 최댓값을 답으로 내는 후보 — 「정확히 k 번」으로 읽었을 때의 코드다. */
function maxOverRow(k: number, prices: number[]): number {
  return Math.max(...freeRow(k, prices));
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  bestTimeToBuyAndSellStockK(k: number, prices: number[]): number;
}

const REF = new URL(
  "./bestTimeToBuyAndSellStockK-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 매수 갱신이 **거래 번호가 같은 매도 상태**를 읽는 사본. 거래 번호가 하나 작은 자리를
 * 읽어야 횟수가 늘어나는데, 같은 자리를 읽으면 상한이 통째로 사라진다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const sameIndex = await loadMutant<Impl>(REF, {
  swap: [/\(free\[t - 1\] as number\)/, "(free[t] as number)"],
});

/** 보유 상태의 시작값을 0 으로 둔 사본 — 사지 않고도 보유 중일 수 있게 된다. */
const holdFromZero = await loadMutant<Impl>(REF, {
  swap: [/Number\.NEGATIVE_INFINITY/, "0"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  k: number;
  prices: number[];
}

const NAMED = (k: number, prices: number[]): Case => ({
  name: `k=${k} ${show(prices)}`,
  k,
  prices,
});

const WALK_CASE: Case = {
  name: `전개 입력 k=${WALK_K} ${show(WALK)}`,
  k: WALK_K,
  prices: WALK,
};

/** 상태 하나로는 모자란 자리를 담은 목록. */
const STATE_CASES: Case[] = [
  WALK_CASE,
  NAMED(2, [1, 5, 3, 6]),
  NAMED(2, [3, 2, 6, 5, 0, 3]),
  NAMED(2, [1, 2, 3, 4, 5]),
  NAMED(2, [5, 4, 3, 2, 1]),
];

/** 가장 큰 거래를 먼저 확정하는 후보가 갈리는 자리를 담은 목록. */
const BIGGEST_CASES: Case[] = [
  WALK_CASE,
  NAMED(2, [1, 5, 3, 6]),
  NAMED(2, [1, 2, 3, 4, 5]),
  NAMED(2, [3, 2, 6, 5, 0, 3]),
  NAMED(2, [5, 4, 3, 2, 1]),
];

/** 「정확히 k 번」으로 읽었을 때의 코드를 거는 목록. */
const ROW_CASES: Case[] = [
  WALK_CASE,
  NAMED(1, [2, 6, 3, 9, 5, 7]),
  NAMED(5, [2, 6, 3, 9, 5, 7]),
  NAMED(3, [5, 4, 3, 2, 1]),
  NAMED(4, [1, 2, 3, 4, 5]),
];

/** 거래 번호를 같은 자리에서 읽는 변이가 갈리는 자리를 담은 목록. */
const INDEX_CASES: Case[] = [
  WALK_CASE,
  NAMED(1, [1, 5, 3, 6]),
  NAMED(1, [1, 2, 3, 4, 5]),
  NAMED(2, [3, 2, 6, 5, 0, 3]),
  NAMED(2, [5, 4, 3, 2, 1]),
];

/** 보유 시작값을 0 으로 둔 변이가 갈리는 자리를 담은 목록. */
const HOLD_CASES: Case[] = [
  WALK_CASE,
  NAMED(1, [2, 6, 3, 9, 5, 7]),
  NAMED(2, [1, 5, 3, 6]),
  NAMED(1, [7, 6, 5]),
  NAMED(2, [5, 4, 3, 2, 1]),
];

/** 열거와 표를 나란히 재는 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE_N = [6, 12, 18, 24];

/** 거래 상한을 몇 가지로 시험하는 자리. */
const BUDGETS = [1, 2, 3, 4, 5];

/** 답이 안 바뀐 자리와 바뀐 자리를 함께 보인다. 하나도 안 바뀌면 「깨진다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 어느 입력에서도 답이 안 바뀐 것을 확인한다. 하나라도 바뀌면 「같다」가 거짓이다. */
function assertNeverBreaks(gaps: number[]): void {
  if (gaps.some((g) => g !== 0)) {
    throw new Error(
      "답이 갈리는 입력이 있다 — 「한 번도 안 갈린다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(k: number, prices: number[], got: number): number {
  const want = bestTimeToBuyAndSellStockK(k, [...prices]);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (k: number, prices: number[]) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = bestTimeToBuyAndSellStockK(c.k, [...c.prices]);
    const got = other(c.k, [...c.prices]);
    gaps.push(bare === got ? 0 : 1);
    rows.push([
      c.name,
      String(bare),
      String(got),
      bare === got ? "같다" : "틀리다",
    ]);
  }
  return { rows, gaps };
}

const CONTRAST_HEAD = (otherHead: string): string[] => [
  "입력",
  "정본이 낸 답",
  otherHead,
  "판정",
];

/** 조합 `C(n, r)` — 자릿수가 커서 `BigInt` 로 센다. */
function choose(n: bigint, r: bigint): bigint {
  if (r < 0n || r > n) return 0n;
  let out = 1n;
  for (let i = 0n; i < r; i++) out = (out * (n - i)) / (i + 1n);
  return out;
}

/** 거래를 최대 `k` 번 하는 거래 집합의 수 — `Σ_{t=0..k} C(N, 2t)`. */
function setCount(n: number, k: number): bigint {
  let s = 0n;
  for (let t = 0; t <= k; t++) s += choose(BigInt(n), BigInt(2 * t));
  return s;
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 거래 집합을 전부 만들어 보는 방식이 만드는 집합의 수. */
  enumerateCost: () => {
    const rows = SCALE_N.map((n) => {
      const prices = Array.from({ length: n }, (_, j) => (j * 37) % 23);
      const e = byEnumerating(WALK_K, prices);
      assertSame(WALK_K, prices, e.answer);
      const closed = setCount(n, WALK_K);
      if (BigInt(e.sets) !== closed) {
        throw new Error(
          `집합 수가 닫힌 형태와 다르다 — 실측 ${e.sets} ≠ Σ C(${n}, 2t) ${closed}`,
        );
      }
      return [num(n), num(e.sets), closed.toLocaleString("en-US")];
    });
    const big = setCount(LIMIT_N, LIMIT_K).toString();
    return [
      table([`N (k = ${WALK_K})`, "실제로 만든 집합", "Σ C(N, 2t)"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      `제약 규모 N = ${num(LIMIT_N)} · k = ${num(LIMIT_K)} 에서는`,
      table(
        [
          "  거래 집합의 수",
          `${big.slice(0, 6)}...  ${num(big.length)} 자리 수`,
        ],
        [
          [
            "  거래 번호 축을 갖는 표의 기본 연산",
            `${num(4 * LIMIT_N * LIMIT_K)}  ${num(num(4 * LIMIT_N * LIMIT_K).replace(/,/g, "").length)} 자리 수`,
          ],
        ],
        ["l", "r"],
      ),
      "  └ 위는 1 초 안에 다 만들어 볼 수 없고, 아래는 여유 있게 끝난다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 덧셈·뺄셈·비교 횟수. */
  costTwoWays: () => {
    const e = byEnumerating(WALK_K, WALK);
    const t = byTable(WALK_K, WALK);
    assertSame(WALK_K, WALK, e.answer);
    assertSame(WALK_K, WALK, t.answer);
    const rows = [
      [
        "거래 집합을 전부 만들어 이익을 더한다",
        num(e.adds),
        num(e.cmps),
        num(e.adds + e.cmps),
      ],
      [
        "날마다 거래 번호별 상태를 이어받는다",
        num(t.adds),
        num(t.cmps),
        num(t.adds + t.cmps),
      ],
    ];
    return [
      table(
        [
          `방식 (N = ${WALK.length} · k = ${WALK_K})`,
          "덧셈·뺄셈",
          "비교",
          "기본 연산 합",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      "같은 k = 2 에서 날 수만 늘리면",
      table(
        ["  N", "  거래 집합을 전부 만든다", "  날마다 이어받는다"],
        SCALE_N.map((n) => {
          const prices = Array.from({ length: n }, (_, j) => (j * 37) % 23);
          const ee = byEnumerating(WALK_K, prices);
          const tt = byTable(WALK_K, prices);
          assertSame(WALK_K, prices, ee.answer);
          assertSame(WALK_K, prices, tt.answer);
          return [
            `  ${num(n)}`,
            num(ee.adds + ee.cmps),
            num(tt.adds + tt.cmps),
          ];
        }),
        ["r", "r", "r"],
      ),
      "  └ 위는 C(N, 4) 를 따라 늘고, 아래는 날 수에 그대로 비례한다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 1 회 거래 문제의 상태 하나로는 어디서 모자라는가. */
  refuteSingleState: () => {
    const { rows, gaps } = contrast(STATE_CASES, singleTradeOnly);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("지금까지의 최저가 하나만"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 이익이 나는 상승 구간이 둘 이상인 입력에서 어긋난다. 그 상태는 「몇 번째 거래인가」를 못 담는다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 거래 상한을 몇 가지로 두고 답과 비용을 함께 잰다. */
  tradeBudget: () => {
    const rows = BUDGETS.map((k) => {
      const t = byTable(k, WALK);
      const e = byEnumerating(k, WALK);
      assertSame(k, WALK, t.answer);
      assertSame(k, WALK, e.answer);
      return [
        num(k),
        num(t.answer),
        num(t.adds + t.cmps),
        num(e.sets),
        num(e.adds + e.cmps),
      ];
    });
    const saturated = BUDGETS.filter(
      (k) => byTable(k, WALK).answer === byTable(WALK.length, WALK).answer,
    );
    return [
      table(
        ["k", "답", "표의 기본 연산", "거래 집합 수", "열거의 기본 연산"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `└ 답은 k = ${saturated[0]} 부터 ${byTable(WALK.length, WALK).answer} 에서 멈추는데 표가 하는 일은 k 에 그대로 비례해 는다`,
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 읽은 걸음별 상태값. */
  walkTrace: () => {
    const k = WALK_K;
    const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
    const free = new Array<number>(k + 1).fill(0);
    const rows: string[][] = [
      [
        "T1",
        "-",
        "-",
        cell(hold[1] as number),
        cell(free[1] as number),
        cell(hold[2] as number),
        cell(free[2] as number),
        "둘 다 시작값",
      ],
    ];
    let lastGain = -1;
    for (let j = 0; j < WALK.length; j++) {
      const price = WALK[j] as number;
      const before = [hold[1], free[1], hold[2], free[2]] as number[];
      for (let t = 1; t <= k; t++) {
        hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
        free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
      }
      const after = [hold[1], free[1], hold[2], free[2]] as number[];
      const names = ["hold[1]", "free[1]", "hold[2]", "free[2]"];
      const moved = names.filter((_, idx) => before[idx] !== after[idx]);
      if (before[3] !== after[3]) lastGain = j;
      rows.push([
        `T${j + 2}`,
        String(j),
        String(price),
        cell(hold[1] as number),
        cell(free[1] as number),
        cell(hold[2] as number),
        cell(free[2] as number),
        moved.length === 0 ? "없음" : moved.join(" "),
      ]);
    }
    assertSame(k, WALK, free[k] as number);
    return [
      table(
        [
          "걸음",
          "j",
          "P[j]",
          "hold[1]",
          "free[1]",
          "hold[2]",
          "free[2]",
          "이 걸음에서 바뀐 것",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ free[2] 가 마지막으로 커지는 곳은 날 ${lastGain} 이고, 그 뒤 ${WALK.length - 1 - lastGain} 걸음은 free[2] 를 못 올린다. 마지막 칸의 값 ${free[k]} 이 답이 된다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 가장 큰 단일 거래를 먼저 확정하면 무엇이 달라지는가. */
  pauseBiggestFirst: () => {
    const { rows, gaps } = contrast(BIGGEST_CASES, biggestFirst);
    assertBreaks(gaps);
    const over = rows.filter((r) => Number(r[2]) > Number(r[1])).length;
    const under = rows.filter((r) => Number(r[2]) < Number(r[1])).length;
    return [
      table(CONTRAST_HEAD("가장 큰 거래를 먼저 확정한 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ ${over} 줄은 정본보다 크고 ${under} 줄은 작다. 날을 지우면 시간 순서가 남지 않아 겹치는 거래를 세거나 쪼갤 자리를 놓친다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — free 배열 전체의 최댓값을 답으로 내면 무엇이 달라지는가. */
  pauseRowMax: () => {
    const { rows, gaps } = contrast(ROW_CASES, maxOverRow);
    assertNeverBreaks(gaps);
    const row = freeRow(WALK.length, WALK);
    return [
      table(CONTRAST_HEAD("free 배열의 최댓값"), rows, ["l", "r", "r", "l"]),
      "",
      `전개 입력을 k = ${WALK.length} 로 한 번 실행한 뒤의 free 배열`,
      table(
        ["  t", ...row.map((_, t) => String(t))],
        [["  free[t]", ...row.map((v) => num(v))]],
        ["l", ...row.map(() => "r" as const)],
      ),
      `  └ ${row.length} 칸이 한 번도 안 줄어든다. 마지막 칸이 곧 그 줄의 최댓값이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 매수 갱신이 거래 번호가 같은 자리를 읽으면 무엇이 달라지는가. */
  pauseSameIndex: () => {
    const { rows, gaps } = contrast(INDEX_CASES, (k, prices) =>
      sameIndex.bestTimeToBuyAndSellStockK(k, prices),
    );
    assertBreaks(gaps);
    const unlimited = bestTimeToBuyAndSellStockK(WALK.length, WALK);
    return [
      table(CONTRAST_HEAD("같은 거래 번호를 읽은 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 변이가 전개 입력에서 낸 답과 거래 횟수를 세지 않았을 때의 답이 둘 다 ${unlimited} 이다 — 상한이 통째로 사라진다`,
    ].join("\n");
  },

  /** `invariant` ③ — 보유 상태의 시작값을 0 으로 두면 무엇이 나오는가. */
  mutantHoldFromZero: () => {
    const { rows, gaps } = contrast(HOLD_CASES, (k, prices) =>
      holdFromZero.bestTimeToBuyAndSellStockK(k, prices),
    );
    assertBreaks(gaps);
    const bad = holdFromZero.bestTimeToBuyAndSellStockK(WALK_K, [...WALK]);
    return [
      table(CONTRAST_HEAD("보유 시작값을 0 으로 둔 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 첫날 hold[1] 이 0 이면 free[1] 이 0 + ${WALK[0]} = ${WALK[0]} 로 커진다. 사지 않은 주식을 판 이익이라 전개 입력의 답이 ${bad} 로 커진다`,
    ].join("\n");
  },

  /**
   * `deep.math` ② — 상태 정의를 작은 값에 넣어 확인한다.
   *
   * 정의는 「날 0 부터 날 j 까지만 쓴다」이므로, 날 `j` 까지만 잘라 낸 배열에 **정본을 그대로
   * 걸어** 나온 값이 곧 `free_t(j)` 다. 표의 값과 같아야 한다.
   */
  mathCheck: () => {
    const rows: string[][] = [];
    for (let j = 0; j < WALK.length; j++) {
      const prefix = WALK.slice(0, j + 1);
      rows.push([
        String(j),
        show(prefix),
        String(bestTimeToBuyAndSellStockK(1, [...prefix])),
        String(bestTimeToBuyAndSellStockK(2, [...prefix])),
      ]);
    }
    const last = rows[rows.length - 1];
    return [
      table(
        ["j", "날 0 부터 날 j 까지의 가격", "free_1(j)", "free_2(j)"],
        rows,
        ["r", "l", "r", "r"],
      ),
      "",
      `└ 마지막 줄의 free_2(${last?.[0]}) = ${last?.[3]} 이 이 문제의 답이다. 두 열 다 j 가 늘어도 안 줄어든다`,
    ].join("\n");
  },

  /**
   * `deep.math` ④ — 거래 상한이 실제로 값을 바꾸는 한계 `⌊N/2⌋` 를 값으로 확인한다.
   *
   * 상한을 `⌊N/2⌋` 로 둔 답과 `N` 으로 둔 답이 같은지 보고, 등호가 서는 입력(가격이 두 값
   * 사이를 번갈아 오가는 것)에서 실제로 `⌊N/2⌋` 번을 다 쓰는지 본다.
   */
  mathCap: () => {
    const rows: string[][] = [];
    for (const n of [4, 6, 8, 10, 12]) {
      const alt = Array.from({ length: n }, (_, j) =>
        j % 2 === 0 ? 0 : MAX_PRICE,
      );
      const half = Math.floor(n / 2);
      const atHalf = bestTimeToBuyAndSellStockK(half, [...alt]);
      const atN = bestTimeToBuyAndSellStockK(n, [...alt]);
      if (atHalf !== atN) {
        throw new Error(
          `상한 ⌊N/2⌋ 가 모자란다 — N=${n} 에서 ${atHalf} ≠ ${atN}`,
        );
      }
      const below = bestTimeToBuyAndSellStockK(half - 1, [...alt]);
      rows.push([
        num(n),
        num(half),
        num(below),
        num(atHalf),
        num(atN),
        below < atHalf ? "예" : "아니오",
      ]);
    }
    return [
      table(
        [
          "N",
          "⌊N/2⌋",
          "상한 ⌊N/2⌋-1",
          "상한 ⌊N/2⌋",
          "상한 N",
          "⌊N/2⌋ 를 다 쓰는가",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `가격이 0 과 ${num(MAX_PRICE)} 사이를 번갈아 오가는 입력이다. 넷째 열과 다섯째 열이 같고 셋째 열은 그보다 작다`,
      `└ 상한을 ⌊N/2⌋ 보다 크게 잡아도 답이 안 커지고, ⌊N/2⌋ 보다 작게 잡으면 작아진다`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 덧셈·뺄셈과 비교가 드는가. */
  perfCount: () => {
    const t = byTable(WALK_K, WALK);
    assertSame(WALK_K, WALK, t.answer);
    const n = WALK.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "순회",
        `T2 부터 T${n + 1} 까지`,
        String(n),
        String(2 * WALK_K),
        String(2 * WALK_K),
        String(4 * n * WALK_K),
      ],
      ["반환", `T${n + 2}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(t.adds + t.cmps)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "걸음마다 덧셈·뺄셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 덧셈·뺄셈 ${t.adds} 번과 비교 ${t.cmps} 번이고, 둘 다 날 수 ${n} 과 거래 상한 ${WALK_K} 에서만 나온 수다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  worstShape: () => {
    const n = LIMIT_N;
    const k = LIMIT_K;
    const shapes: [string, number[]][] = [
      ["가격이 하루도 안 바뀐다", Array.from({ length: n }, () => 5_000)],
      [
        "가격이 날마다 1 씩 내려간다",
        Array.from({ length: n }, (_, j) => MAX_PRICE - j),
      ],
      ["가격이 날마다 1 씩 올라간다", Array.from({ length: n }, (_, j) => j)],
      [
        `0 과 ${num(MAX_PRICE)} 이 번갈아 나온다`,
        Array.from({ length: n }, (_, j) => (j % 2 === 0 ? 0 : MAX_PRICE)),
      ],
    ];
    const rows = shapes.map(([name, prices]) => {
      const t = byTable(k, prices);
      assertSame(k, prices, t.answer);
      return [
        name,
        num(t.adds),
        num(t.cmps),
        num(t.adds + t.cmps),
        num(movedCells(k, prices)),
        num(t.answer),
      ];
    });
    return [
      table(
        [
          `입력의 모양 (N = ${num(n)} · k = ${num(k)})`,
          "덧셈·뺄셈",
          "비교",
          "기본 연산",
          "값이 바뀐 자리",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `가운데 세 열이 네 줄 다 같고 오른쪽 두 열만 다르다. 갱신 자리는 네 줄 다 2Nk = ${num(2 * n * k)} 개다`,
      `답이 가장 커지는 입력은 마지막 줄이고, 그때 답은 k × ${num(MAX_PRICE)} = ${num(k * MAX_PRICE)} 이다`,
      `└ 기본 연산은 N 과 k 만 보고, 값이 바뀐 자리와 답은 가격의 모양을 본다`,
    ].join("\n");
  },
};
