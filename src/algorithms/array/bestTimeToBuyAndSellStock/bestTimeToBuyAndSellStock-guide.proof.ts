/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts bestTimeToBuyAndSellStock-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { bestTimeToBuyAndSellStock } from "./bestTimeToBuyAndSellStock-guide.ref.ts";

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

/** `[7 2 5]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
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
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 최저가가 두 번 갱신되고(날 1·날 3), 최대 이익도 두 번 갱신되며(날 2·날 4), **답이 마지막
 * 날에서 만들어지지 않는다.** 전체 최고가에서 전체 최저가를 뺀 값(6)이 답(5)과 다른 것도
 * 이 입력에서 확인된다.
 */
const WALK: number[] = [7, 2, 5, 1, 6, 3];

/** 제약의 최댓값. */
const LIMIT = 100_000;

/** 제약이 정한 가격의 최댓값. */
const MAX_PRICE = 10_000;

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  subs: number;
  cmps: number;
}

/**
 * 모든 `(i, j)` 쌍의 이익을 각각 만드는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고,
 * 뺄셈과 비교를 함께 센다 — 쌍 하나마다 뺄셈 한 번과 비교 한 번이다.
 */
function byAllPairs(prices: number[]): Counted {
  let best = 0;
  let subs = 0;
  let cmps = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i; j < prices.length; j++) {
      subs++;
      const gain = (prices[j] as number) - (prices[i] as number);
      cmps++;
      best = Math.max(best, gain);
    }
  }
  return { answer: best, subs, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 날 하나마다 뺄셈 한 번(오늘 파는 이익)과 비교 두
 * 번(최대 이익 갱신 · 최저가 갱신)이다.
 */
function byCarrying(prices: number[]): Counted {
  let minP = prices[0] as number;
  let best = 0;
  let subs = 0;
  let cmps = 0;
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i] as number;
    subs++;
    const gain = price - minP;
    cmps++;
    best = Math.max(best, gain);
    cmps++;
    minP = Math.min(minP, price);
  }
  return { answer: best, subs, cmps };
}

/**
 * 가장 단순한 후보 — **배열 전체의 최고가에서 전체의 최저가를 뺀다.** 날짜 순서를 안 보므로
 * 최저가가 최고가보다 뒤에 있어도 그 둘을 짝지어 버린다.
 */
function globalGap(prices: number[]): number {
  let low = prices[0] as number;
  let high = prices[0] as number;
  for (const p of prices) {
    low = Math.min(low, p);
    high = Math.max(high, p);
  }
  return Math.max(0, high - low);
}

/** 최저가 하나만 들고 가는 후보 — 마지막 날에 파는 이익을 답으로 낸다. */
function lastDayOnly(prices: number[]): number {
  let minP = prices[0] as number;
  for (const p of prices) minP = Math.min(minP, p);
  return Math.max(0, (prices[prices.length - 1] as number) - minP);
}

/** 날마다의 최저가를 배열로 다 잡는 후보 — 칸 `N` 개를 쓴다. */
function prefixMinArray(prices: number[]): number {
  const m = new Array<number>(prices.length);
  m[0] = prices[0] as number;
  for (let i = 1; i < prices.length; i++) {
    m[i] = Math.min(m[i - 1] as number, prices[i] as number);
  }
  let best = 0;
  for (let j = 0; j < prices.length; j++) {
    best = Math.max(best, (prices[j] as number) - (m[j] as number));
  }
  return best;
}

/**
 * 「전체 최저가인 날에 사고 그 뒤의 최고가에 판다」 — 매수일을 먼저 정하고 매도일을 나중에
 * 고르는 후보. 최저가가 배열의 끝 가까이 있으면 팔 날이 남지 않는다.
 */
function buyAtGlobalMin(prices: number[]): number {
  let at = 0;
  for (let i = 1; i < prices.length; i++) {
    if ((prices[i] as number) < (prices[at] as number)) at = i;
  }
  let best = 0;
  for (let j = at; j < prices.length; j++) {
    best = Math.max(best, (prices[j] as number) - (prices[at] as number));
  }
  return best;
}

/**
 * 두 줄의 순서를 맞바꾼 사본 — 최저가를 먼저 갱신하고 그다음에 오늘 파는 이익을 잰다.
 * 두 줄의 자리를 바꾼 것이라 `loadMutant`(한 줄 치환)로는 만들 수 없어 여기 따로 적는다.
 */
function minFirst(prices: number[]): number {
  let minP = prices[0] as number;
  let best = 0;
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i] as number;
    minP = Math.min(minP, price);
    best = Math.max(best, price - minP);
  }
  return best;
}

/**
 * **하루 이상 보유해야 하고 거래를 반드시 한 번 한다**로 바뀐 문제의 정답. 손해가 나도 팔아야
 * 하므로 답이 음수가 될 수 있고, 그래서 「거래 안 함」인 0 이 후보에서 빠진다.
 */
function mustTrade(prices: number[]): number {
  let minP = prices[0] as number;
  let best = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i] as number;
    best = Math.max(best, price - minP);
    minP = Math.min(minP, price);
  }
  return best;
}

/** 그 바뀐 문제에서 두 줄의 순서를 맞바꾼 사본. */
function mustTradeMinFirst(prices: number[]): number {
  let minP = prices[0] as number;
  let best = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i] as number;
    minP = Math.min(minP, price);
    best = Math.max(best, price - minP);
  }
  return best;
}

/** 날 `j` 까지의 최저가 목록. `deep.math` 의 검산이 쓴다. */
function prefixMins(prices: number[]): number[] {
  const m: number[] = [];
  let cur = Number.POSITIVE_INFINITY;
  for (const p of prices) {
    cur = Math.min(cur, p);
    m.push(cur);
  }
  return m;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  bestTimeToBuyAndSellStock(prices: number[]): number;
}

const REF = new URL("./bestTimeToBuyAndSellStock-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 최저가를 **오늘 가격으로 덮어쓰는** 사본. 「지금까지의 최저가」를 지키던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const latestPrice = await loadMutant<Impl>(REF, {
  swap: [/minP = Math\.min\(minP, price\);/, "minP = price;"],
});

/** 최대 이익의 시작값을 「가장 작은 값」으로 둔 사본 — 이익이 음수여도 답으로 낸다. */
const bestFromNegative = await loadMutant<Impl>(REF, {
  swap: [/let best = 0;/, "let best = Number.NEGATIVE_INFINITY;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  prices: number[];
}

const NAMED = (prices: number[]): Case => ({ name: show(prices), prices });

const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, prices: WALK };

/** 매수일을 먼저 정하는 후보가 갈리는 자리를 담은 목록. */
const BUY_FIRST_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([10, 1, 9, 0, 3]),
  NAMED([10, 1, 8, 0]),
  NAMED([7, 6, 4, 3, 1]),
];

/** 「이익이 0 아래로 내려가는가」를 가르는 목록. */
const NEGATIVE_CASES: Case[] = [
  WALK_CASE,
  NAMED([5, 5, 5, 5]),
  NAMED([7, 6, 4, 3, 1]),
  NAMED([2, 1]),
  NAMED([5]),
];

/** 두 줄의 순서를 가르는 목록. 이 문제와 바뀐 문제에 같은 목록을 건다. */
const ORDER_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([7, 6, 4, 3, 1]),
  NAMED([5, 5, 5, 5]),
  NAMED([2, 1]),
];

/** 최저가를 오늘 가격으로 덮어쓰는 변이가 갈리는 자리를 담은 목록. */
const LATEST_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([3, 1, 2, 8]),
  NAMED([2, 1, 4, 3, 9]),
  NAMED([7, 6, 4, 3, 1]),
];

const STATE_CASES: number[][] = [
  WALK,
  [1, 2, 3, 4, 5],
  [7, 6, 4, 3, 1],
  [10, 1, 9, 0, 3],
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 6, 64, 1000];

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
      "답이 갈리는 입력이 있다 — 「한 번도 안 틀린다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(prices: number[], got: number): number {
  const want = bestTimeToBuyAndSellStock([...prices]);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (prices: number[]) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = bestTimeToBuyAndSellStock([...c.prices]);
    const got = other([...c.prices]);
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

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 뺄셈·비교 횟수. */
  costTwoWays: () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    assertSame(WALK, pairs.answer);
    assertSame(WALK, carry.answer);
    const rows = [
      [
        "모든 (i, j) 쌍의 이익을 각각 만든다",
        num(pairs.subs),
        num(pairs.cmps),
        num(pairs.subs + pairs.cmps),
      ],
      [
        "날마다 직전 결과를 이어받는다",
        num(carry.subs),
        num(carry.cmps),
        num(carry.subs + carry.cmps),
      ],
    ];
    const n = LIMIT;
    return [
      table(
        [`방식 (N = ${WALK.length})`, "뺄셈", "비교", "기본 연산 합"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(n)} 이면`,
      table(
        ["  모든 쌍의 이익", num(n * (n + 1))],
        [["  직전 결과 이어받기", num(3 * (n - 1))]],
        ["l", "r"],
      ),
      "  └ 위는 쌍의 개수를 따라 늘고, 아래는 날 수만 따라 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 날짜 순서를 안 보는 후보가 어디서 어긋나는가. */
  costGlobalMinMax: () => {
    const { rows, gaps } = contrast(
      [
        WALK_CASE,
        NAMED([1, 2, 3, 4, 5]),
        NAMED([7, 6, 4, 3, 1]),
        NAMED([10, 1, 9, 0, 3]),
      ],
      globalGap,
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("최고가 - 최저가"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 최저가가 최고가보다 뒤에 있는 입력에서 어긋난다. 그때는 그 둘을 짝지을 수 없다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 무엇을 들고 가는지를 네 가지로 두고 답을 대조한다. */
  stateSize: () => {
    const heads = [
      "최고가와 최저가",
      "최저가만",
      "최저가와 최대 이익",
      "날마다의 최저가",
    ];
    const impls = [
      globalGap,
      lastDayOnly,
      bestTimeToBuyAndSellStock,
      prefixMinArray,
    ];
    const wrong = [0, 0, 0, 0];
    const rows = STATE_CASES.map((prices) => {
      const bare = bestTimeToBuyAndSellStock([...prices]);
      const cells = impls.map((f, k) => {
        const got = f([...prices]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [show(prices), String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(LIMIT)} 에서 쓰는 칸`,
      "",
      "2",
      "1",
      "2",
      num(LIMIT),
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r", "r"]),
      "",
      "└ 칸 수가 같아도 무엇을 들고 가는지에 따라 갈린다. 어긋나지 않는 가장 작은 상태가 셋째 열이다",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 순회한 걸음별 상태값. */
  walkTrace: () => {
    const rows: string[][] = [];
    let minP = WALK[0] as number;
    let best = 0;
    rows.push([
      "T1",
      "0",
      String(WALK[0]),
      "-",
      String(best),
      String(minP),
      "둘 다 시작값",
    ]);
    for (let i = 1; i < WALK.length; i++) {
      const price = WALK[i] as number;
      const gain = price - minP;
      const bestChanged = gain > best;
      const minChanged = price < minP;
      best = Math.max(best, gain);
      minP = Math.min(minP, price);
      rows.push([
        `T${i + 1}`,
        String(i),
        String(price),
        String(gain),
        String(best),
        String(minP),
        bestChanged ? "best" : minChanged ? "minP" : "없음",
      ]);
    }
    assertSame(WALK, best);
    return [
      table(
        [
          "걸음",
          "i",
          "P[i]",
          "오늘 파는 이익",
          "best",
          "minP",
          "이 걸음에서 바뀐 것",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ best 가 마지막으로 커지는 곳은 날 4 이고, 그 뒤 한 걸음은 아무것도 안 바뀐다. 답은 ${best} 다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 매수일을 먼저 정하면 무엇이 달라지는가. */
  pauseBuyAtGlobalMin: () => {
    const { rows, gaps } = contrast(BUY_FIRST_CASES, buyAtGlobalMin);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("최저가인 날에 산 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 최저가가 배열의 끝 가까이 있는 입력에서 어긋난다. 그 뒤로 가격이 오를 날이 남지 않는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 이익의 시작값을 「가장 작은 값」으로 두면 무엇이 달라지는가. */
  pauseNegativeProfit: () => {
    const { rows, gaps } = contrast(NEGATIVE_CASES, (prices) =>
      bestFromNegative.bestTimeToBuyAndSellStock(prices),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("가장 작은 값에서 시작한 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 이익이 나는 날이 하루라도 있으면 답이 같다. 하루도 없는 입력에서만 음수가 나온다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 줄의 순서를 바꾸면 이 문제와 바뀐 문제가 어떻게 갈리는가. */
  pauseSwapOrder: () => {
    const { rows, gaps } = contrast(ORDER_CASES, minFirst);
    assertNeverBreaks(gaps);
    const other: string[][] = [];
    const otherGaps: number[] = [];
    for (const c of ORDER_CASES) {
      const right = mustTrade([...c.prices]);
      const got = mustTradeMinFirst([...c.prices]);
      otherGaps.push(right === got ? 0 : 1);
      other.push([
        c.name,
        String(right),
        String(got),
        right === got ? "같다" : "틀리다",
      ]);
    }
    assertBreaks(otherGaps);
    return [
      "이 문제 — 거래를 안 해도 되고 같은 날 사고팔 수 있다",
      table(CONTRAST_HEAD("최저가를 먼저 갱신한 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "바뀐 문제 — 하루 이상 보유해서 반드시 한 번 거래한다",
      table(CONTRAST_HEAD("최저가를 먼저 갱신한 답"), other, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 위 표는 ${rows.length} 줄 다 같고 아래 표는 ${otherGaps.filter((g) => g !== 0).length} 줄이 갈린다. 0 이 후보인 동안에는 순서가 답을 안 바꾼다`,
    ].join("\n");
  },

  /** `invariant` ③ — 최저가를 오늘 가격으로 덮어쓰면 무엇이 나오는가. */
  mutantLatestPrice: () => {
    const { rows, gaps } = contrast(LATEST_CASES, (prices) =>
      latestPrice.bestTimeToBuyAndSellStock(prices),
    );
    assertBreaks(gaps);
    const m = prefixMins(WALK);
    return [
      table(CONTRAST_HEAD("어제 가격으로 산 답"), rows, ["l", "r", "r", "l"]),
      "",
      `전개 입력에서 minP 가 지켜야 할 값 ${show(m)} 이 ${show(WALK)} 로 바뀐다`,
      "└ minP 가 「지금까지의 최저가」가 아니라 「어제 가격」이 되면, 답이 하루 사이 상승폭의 최댓값이 된다",
    ].join("\n");
  },

  /**
   * `deep.math` ② — 접두사 최솟값으로 세운 정의를 작은 값에 넣어 확인한다.
   *
   * **넷째 열은 `P[j] − m_{j−1}` 이다** — 어제까지의 최저가로 샀을 때의 이익이고, 코드가
   * 실제로 만드는 값이 그것이다. `m_j` 로 빼면 최저가가 갱신되는 날에 0 이 나와 코드의 값과
   * 어긋난다. 날 0 은 어제가 없어 이 열이 비고, 그 자리를 다섯째 열의 시작값 0 이 받는다.
   */
  mathPrefixMin: () => {
    const m = prefixMins(WALK);
    const rows: string[][] = [];
    let running = 0;
    const negatives: number[] = [];
    for (let j = 0; j < WALK.length; j++) {
      const before = j === 0 ? null : (m[j - 1] as number);
      const gain = before === null ? null : (WALK[j] as number) - before;
      if (gain !== null) {
        running = Math.max(running, gain);
        if (gain < 0) negatives.push(j);
      }
      rows.push([
        String(j),
        String(WALK[j]),
        before === null ? "-" : String(before),
        gain === null ? "-" : String(gain),
        String(running),
      ]);
    }
    assertSame(WALK, running);
    return [
      table(
        ["j", "P[j]", "m_{j-1}", "P[j] - m_{j-1}", "거기까지의 최대 이익"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `└ 넷째 열은 최저가가 갱신되는 날(날 ${negatives.join(" 과 날 ")})에 음수다. 다섯째 열은 0 에서 시작해 한 번도 안 줄어든다. 답은 ${running} 이다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  mathScale: () => {
    const rows = SCALE.map((n) => {
      const prices = Array.from({ length: n }, (_, k) => (k * 37) % 101);
      const pairs = byAllPairs(prices);
      const carry = byCarrying(prices);
      assertSame(prices, pairs.answer);
      assertSame(prices, carry.answer);
      let couples = 0;
      for (let i = 0; i < n; i++) for (let j = i; j < n; j++) couples++;
      return [
        num(n),
        num(couples),
        num(pairs.subs + pairs.cmps),
        num(n * (n + 1)),
        num(carry.subs + carry.cmps),
        num(3 * n - 3),
      ];
    });
    const n = LIMIT;
    return [
      table(
        [
          "N",
          "(i, j) 쌍의 수(실측)",
          "모든 쌍(실측)",
          "N(N+1)",
          "이어받기(실측)",
          "3N - 3",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(n)} 을 두 식에 넣으면`,
      table(
        ["  N(N+1)", num(n * (n + 1))],
        [
          ["  3N - 3", num(3 * n - 3)],
          [
            "  두 값의 비",
            `${num(Math.round((n * (n + 1)) / (3 * n - 3)))} 배`,
          ],
        ],
        ["l", "r"],
      ),
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 뺄셈과 비교가 드는가. */
  perfCount: () => {
    const carry = byCarrying(WALK);
    assertSame(WALK, carry.answer);
    const n = WALK.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "순회",
        `T2 부터 T${n} 까지`,
        String(n - 1),
        "1",
        "2",
        String(3 * (n - 1)),
      ],
      ["반환", `T${n + 1}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(carry.subs + carry.cmps)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "걸음마다 뺄셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 뺄셈 ${carry.subs} 번과 비교 ${carry.cmps} 번이고, 둘 다 날 수 ${n} 에서만 나온 수다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  worstShape: () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["가격이 하루도 안 바뀐다", Array.from({ length: n }, () => 5_000)],
      [
        "가격이 날마다 1 씩 내려간다",
        Array.from({ length: n }, (_, k) => MAX_PRICE - k),
      ],
      ["가격이 날마다 1 씩 올라간다", Array.from({ length: n }, (_, k) => k)],
      [
        "0 과 10,000 이 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 0 : MAX_PRICE)),
      ],
    ];
    const rows = shapes.map(([name, prices]) => {
      const carry = byCarrying(prices);
      assertSame(prices, carry.answer);
      return [
        name,
        num(carry.subs),
        num(carry.cmps),
        num(carry.subs + carry.cmps),
        num(carry.answer),
      ];
    });
    return [
      table(
        [`입력의 모양 (N = ${num(n)})`, "뺄셈", "비교", "기본 연산", "답"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "가운데 세 열이 네 줄 다 같고 오른쪽 열만 다르다",
      `답이 가장 커지는 입력은 첫날 0 이고 그 뒤 어느 날 ${num(MAX_PRICE)} 인 것이며, 그때 답은 ${num(MAX_PRICE)} 이다`,
      `└ 날 수를 ${num(LIMIT)} 까지 늘려도 답의 최댓값은 그대로다. 답을 정하는 것은 가격의 범위다`,
    ].join("\n");
  },
};
