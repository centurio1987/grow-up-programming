/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 날마다의 거래 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as benchCases } from "./bestTimeToBuyAndSellStockK-guide.alt.ts";
import {
  bestSet,
  byEnumerating,
  byStates,
  cell,
  type Day,
  freeDef,
  holdBest,
  holdDef,
  LIMIT_K,
  LIMIT_N,
  lowestOnly,
  MAX_PRICE,
  type Move,
  num,
  RELATION_DAY,
  setCount,
  show,
  span,
  stateNames,
  stateValue,
  type Trade,
  trace,
  WALK,
  WALK_K,
  WITNESS_DAY,
} from "./bestTimeToBuyAndSellStockK-guide.fig.tsx";
import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK-guide.ref.ts";

const REF = new URL(
  "./bestTimeToBuyAndSellStockK-guide.ref.ts",
  import.meta.url,
).pathname;

interface Impl {
  bestTimeToBuyAndSellStockK(k: number, prices: number[]): number;
}

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 글자 그림의 칸 맞춤에 쓴다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 날 번호 목록 — `0 · 2 · 4`. */
const dots = (xs: readonly (number | string)[]): string => xs.join(" · ");

/** 거래 목록 — `[0,1] · [2,3]`. 없으면 「거래 없음」. */
const trades = (ts: readonly Trade[]): string =>
  ts.length === 0 ? "거래 없음" : ts.map(span).join(" · ");

const gainOf = (P: readonly number[], t: Trade): number =>
  (P[t.sell] as number) - (P[t.buy] as number);

/** 가격이 오르는 구간(연달아 오르는 날의 묶음)의 수. */
function risingRuns(P: readonly number[]): number {
  let runs = 0;
  for (let j = 1; j < P.length; j++) {
    const up = (P[j] as number) > (P[j - 1] as number);
    const wasUp = j >= 2 && (P[j - 1] as number) > (P[j - 2] as number);
    if (up && !wasUp) runs++;
  }
  return runs;
}

/** 규칙으로 만든 가격 — `P[j] = (j × 37) mod 23`. 난수가 없어 시드가 없다. */
const ruled = (n: number): number[] =>
  Array.from({ length: n }, (_, j) => (j * 37) % 23);

/** 조합 열거와 거래 상태를 나란히 재는 날 수. 네 자리 모두 두 방식을 **실제로 실행해** 센다. */
const SCALE_N = [6, 12, 18, 24];

/** 거래 상한을 몇 가지로 시험하는 자리. */
const BUDGETS = [1, 2, 3, 4, 5];

/* ────────────────────────── 후보와 변이 ────────────────────────── */

/** 보유 여부만 상태로 두는 후보 — 거래 번호가 없어 몇 번 거래했는지 세지 않는다. */
function holdOnly(P: readonly number[]): number {
  let hold = Number.NEGATIVE_INFINITY;
  let free = 0;
  for (const price of P) {
    hold = Math.max(hold, free - price);
    free = Math.max(free, hold + price);
  }
  return free;
}

/**
 * 가장 큰 거래를 먼저 확정하고 그 두 날을 배열에서 지운 뒤 같은 일을 `k` 번 되풀이하는 후보. 확정한
 * 거래를 **원래 날 번호**로 함께 돌려준다 — 지운 배열에서는 날 번호가 당겨지기 때문이다.
 */
function biggestFirst(
  k: number,
  P: readonly number[],
): {
  answer: number;
  rounds: { trade: Trade; gain: number; left: number[] }[];
} {
  let days = P.map((price, day) => ({ price, day }));
  let total = 0;
  const rounds: { trade: Trade; gain: number; left: number[] }[] = [];
  for (let round = 0; round < k; round++) {
    let buyAt = -1;
    let sellAt = -1;
    let gain = 0;
    for (let b = 0; b < days.length; b++) {
      for (let s = b + 1; s < days.length; s++) {
        const g = (days[s]?.price as number) - (days[b]?.price as number);
        if (g > gain) {
          gain = g;
          buyAt = b;
          sellAt = s;
        }
      }
    }
    if (gain === 0) break;
    total += gain;
    const trade = {
      buy: days[buyAt]?.day as number,
      sell: days[sellAt]?.day as number,
    };
    days = days.filter((_, idx) => idx !== buyAt && idx !== sellAt);
    rounds.push({ trade, gain, left: days.map((d) => d.day) });
  }
  return { answer: total, rounds };
}

/** 한 번 실행한 뒤의 `free` 배열 전체 — 거래 번호마다 하나씩. */
function freeRow(k: number, P: readonly number[]): number[] {
  const tr = trace(k, P);
  const last = tr.days.at(-1);
  return [...(last?.after.free ?? tr.init.free)];
}

/** 날마다 거래 상태의 열을 다 남기는 2 차원 표 — 칸 `2(k + 1) × N` 개를 잡는다. */
function fullTable(
  k: number,
  P: readonly number[],
): { answer: number; cells: number } {
  const n = P.length;
  const hold: number[][] = Array.from({ length: k + 1 }, () =>
    new Array<number>(n).fill(Number.NEGATIVE_INFINITY),
  );
  const free: number[][] = Array.from({ length: k + 1 }, () =>
    new Array<number>(n).fill(0),
  );
  for (let j = 0; j < n; j++) {
    const price = P[j] as number;
    for (let t = 1; t <= k; t++) {
      const holdY =
        j === 0 ? Number.NEGATIVE_INFINITY : (hold[t]?.[j - 1] as number);
      const freeY = j === 0 ? 0 : (free[t]?.[j - 1] as number);
      const h = Math.max(holdY, (free[t - 1]?.[j] as number) - price);
      (hold[t] as number[])[j] = h;
      (free[t] as number[])[j] = Math.max(freeY, h + price);
    }
  }
  const answer = n === 0 ? 0 : (free[k]?.[n - 1] as number);
  return { answer, cells: 2 * (k + 1) * n };
}

/** 매수 갱신이 **거래 번호가 같은 매도 상태**를 읽는 사본 — 상한이 통째로 사라진다. */
const sameIndex = await loadMutant<Impl>(REF, {
  swap: [/\(free\[t - 1\] as number\)/, "(free[t] as number)"],
});

/** 보유 상태의 시작값을 0 으로 둔 사본 — 사지 않고도 들고 있는 상태에 설 수 있게 된다. */
const holdFromZero = await loadMutant<Impl>(REF, {
  swap: [/Number\.NEGATIVE_INFINITY/, "0"],
});

/**
 * 거래 번호를 **큰 쪽부터** 올리는 사본 — 매수 갱신이 읽는 `free[t − 1]` 이 오늘 값이 아니라 어제 값이
 * 된다. 답은 안 갈린다(수식 절이 까닭을 적는다).
 */
const descending = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let t = 1; t <= k; t\+\+\) \{/,
    "for (let t = k; t >= 1; t--) {",
  ],
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
  prices: [...WALK],
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

/** `free` 배열 전체의 최댓값을 답으로 내는 코드를 거는 목록. */
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

/**
 * 변이가 답을 바꾼 자리가 하나라도 있는지 본다. 하나도 안 바뀌면 「깨진다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다**(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화하면 변이 모듈이
 * 정본 모듈 그 자체라 함수가 같은 객체다 — 그때 던지면 그 블록의 갈림 대조가 한 번도 안 돈다.
 * 손으로 만든 후보는 중화되지 않으므로 `null` 을 넘기고 늘 잰다.
 */
function assertBreaks(mutant: Impl | null, gaps: number[]): void {
  if (
    mutant !== null &&
    mutant.bestTimeToBuyAndSellStockK === bestTimeToBuyAndSellStockK
  ) {
    return;
  }
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 어느 입력에서도 답이 안 바뀐 것을 확인한다. 하나라도 바뀌면 「한 번도 안 갈린다」가 거짓이다. */
function assertNeverBreaks(gaps: number[]): void {
  if (gaps.some((g) => g !== 0)) {
    throw new Error(
      "답이 갈리는 입력이 있다 — 「한 번도 안 갈린다」가 거짓이다",
    );
  }
}

/** 정본과 다른 방식을 나란히 실행해 판정이 붙은 표의 줄을 만든다. */
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
    rows.push([c.name, num(bare), num(got), bare === got ? "같다" : "틀리다"]);
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
  /** `concept` — 거래 상한마다의 답과, 그 답을 만드는 가장 적은 거래 수. */
  "concept-budget": () => {
    const answers = BUDGETS.map((k) =>
      bestTimeToBuyAndSellStockK(k, [...WALK]),
    );
    const fewest = answers.map((a) => {
      let t = 0;
      while (bestTimeToBuyAndSellStockK(t, [...WALK]) !== a) t++;
      return t;
    });
    const top = answers.at(-1) as number;
    const sat = BUDGETS[answers.indexOf(top)] as number;
    const runs = risingRuns(WALK);
    if (fewest.at(-1) !== runs) {
      throw new Error("답을 만드는 거래 수가 오르는 구간의 수와 다르다");
    }
    return [
      md(
        ["거래 상한 k", ...BUDGETS.map(String)],
        [
          ["답", ...answers.map(num)],
          ["답을 만드는 가장 적은 거래 수", ...fewest.map(String)],
        ],
        BUDGETS.map((_, i) => i + 1),
      ),
      "",
      `답은 k = ${sat} 에서 ${num(top)}${으로(num(top))} 멈춥니다. 가격이 오르는 구간이 ${runs} 개라 거래를 ${runs + 1} 번 이상 허용해도 더 쓸 거래가 없습니다.`,
    ].join("\n");
  },

  /** `concept` — 거래 조합의 수. 작은 규모는 만들어 세고, 과제 규모는 닫힌 식으로 낸다. */
  "concept-count": () => {
    const e = byEnumerating(WALK_K, WALK);
    const closed = setCount(WALK.length, WALK_K);
    if (BigInt(e.sets) !== closed) {
      throw new Error("만든 조합의 수가 닫힌 식과 다르다");
    }
    const big = setCount(LIMIT_N, LIMIT_K).toString();
    return [
      md(
        ["날 수 N", "거래 상한 k", "거래 조합의 수", "구한 방법"],
        [
          [num(WALK.length), num(WALK_K), num(e.sets), "조합을 만들어 셌다"],
          [
            num(LIMIT_N),
            num(LIMIT_K),
            `${num(big.length)} 자리 수`,
            "Σ C(N, 2t) 로 냈다",
          ],
        ],
        [0, 1, 2],
      ),
      "",
      `N = ${WALK.length} 에서 만들어 센 ${num(e.sets)} 개가 Σ C(N, 2t) 와 같았습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 모든 거래 조합을 만드는 방식이 만드는 조합의 수. */
  "origin-enumerate": () => {
    const rows = SCALE_N.map((n) => {
      const e = byEnumerating(WALK_K, ruled(n));
      const closed = setCount(n, WALK_K);
      if (BigInt(e.sets) !== closed) {
        throw new Error(`N=${n} 에서 만든 조합의 수가 닫힌 식과 다르다`);
      }
      return [num(n), num(e.sets), closed.toLocaleString("en-US")];
    });
    const digits = setCount(LIMIT_N, LIMIT_K).toString().length;
    return [
      md([`N (k = ${WALK_K})`, "만든 조합", "Σ C(N, 2t)"], rows, [0, 1, 2]),
      "",
      `${SCALE_N.length} 규모 모두 만든 조합의 수가 Σ C(N, 2t) 와 같았습니다. 과제 규모 N = ${num(LIMIT_N)} · k = ${num(LIMIT_K)} 에서는 그 합이 ${num(digits)} 자리 수입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 첫 거래가 같은 조합들이 그 이익을 매번 다시 센다. */
  "origin-repeat": () => {
    const first = (bestSet(WALK_K, WALK, WALK.length - 1)
      .trades[0] as Trade) ?? {
      buy: 0,
      sell: 1,
    };
    const rows: string[][] = [];
    for (let b = first.sell + 1; b < WALK.length; b++) {
      for (let s = b + 1; s < WALK.length; s++) {
        const second = { buy: b, sell: s };
        const g1 = gainOf(WALK, first);
        const g2 = gainOf(WALK, second);
        rows.push([
          `{${span(first)}, ${span(second)}}`,
          num(g1),
          num(g2),
          num(g1 + g2),
        ]);
      }
    }
    const g = gainOf(WALK, first);
    return [
      md(["조합", "첫 거래의 이익", "둘째 거래의 이익", "합"], rows, [1, 2, 3]),
      "",
      `첫 거래가 ${span(first)} 인 조합이 ${rows.length} 개이고, ${rows.length} 개 모두 첫 거래의 이익 ${g}${을를(g)} 따로 다시 셉니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 날 4 에 두 번째로 살 때 앞쪽에서 알아야 할 것은 이익 하나다. */
  "origin-need": () => {
    const day = 4;
    const rows: string[][] = [];
    let best: { t: Trade; g: number } | null = null;
    for (let b = 0; b <= day; b++) {
      for (let s = b + 1; s <= day; s++) {
        const t = { buy: b, sell: s };
        const g = gainOf(WALK, t);
        rows.push([span(t), num(g)]);
        if (best === null || g > best.g) best = { t, g };
      }
    }
    if (best === null) throw new Error("첫 거래 후보가 없다");
    if (best.g !== freeDef(1, WALK, day)) {
      throw new Error("가장 큰 첫 거래가 free[1] 의 정의와 다르다");
    }
    return [
      md(["날 4 까지 판 첫 거래", "이익"], rows, [1]),
      "",
      `첫 거래가 될 수 있는 ${rows.length} 가지 가운데 이익이 가장 큰 것은 ${span(best.t)} 의 ${best.g} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 덧셈·뺄셈·비교 횟수. */
  "origin-two-ways": () => {
    const e = byEnumerating(WALK_K, WALK);
    const s = byStates(WALK_K, WALK);
    const scale = SCALE_N.map((n) => {
      const P = ruled(n);
      const ee = byEnumerating(WALK_K, P);
      const ss = byStates(WALK_K, P);
      if (ee.adds + ee.cmps !== 3 * ee.sets - 2) {
        throw new Error("조합 열거의 연산이 3 × (조합 수) − 2 와 다르다");
      }
      if (ss.adds + ss.cmps !== 4 * n * WALK_K) {
        throw new Error("거래 상태의 연산이 4Nk 와 다르다");
      }
      return [num(n), num(ee.adds + ee.cmps), num(ss.adds + ss.cmps)];
    });
    return [
      md(
        [
          `방식 (N = ${WALK.length} · k = ${WALK_K})`,
          "덧셈·뺄셈",
          "비교",
          "기본 연산",
        ],
        [
          [
            "모든 거래 조합 만들기",
            num(e.adds),
            num(e.cmps),
            num(e.adds + e.cmps),
          ],
          [
            "거래 상태 이어받기",
            num(s.adds),
            num(s.cmps),
            num(s.adds + s.cmps),
          ],
        ],
        [1, 2, 3],
      ),
      "",
      `같은 k = ${WALK_K} 에서 날 수만 늘리면 이렇습니다.`,
      "",
      md(
        ["N", "모든 거래 조합 만들기", "거래 상태 이어받기"],
        scale,
        [0, 1, 2],
      ),
      "",
      `${SCALE_N.length} 규모 모두 위 방식은 3 × (조합 수) − 2 와 같았고, 아래 방식은 4Nk 와 같았습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 거래 한 번일 때의 상태 하나로는 어디서 모자라는가. */
  "origin-lowest": () => {
    const { rows, gaps } = contrast(STATE_CASES, (_k, P) => lowestOnly(P));
    assertBreaks(null, gaps);
    const wrong = STATE_CASES.filter((_, i) => gaps[i] === 1);
    if (wrong.some((c) => risingRuns(c.prices) < 2)) {
      throw new Error("오르는 구간이 하나뿐인 입력에서 어긋났다");
    }
    return [
      md(CONTRAST_HEAD("최저가 하나만"), rows, [1, 2]),
      "",
      `틀린 줄은 ${wrong.length} 줄이고, 모두 가격이 오르는 구간이 둘 이상인 입력입니다.`,
    ].join("\n");
  },

  /** `deep.build` 「하나를 읽는 법」 — `hold[2]` 하나를 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const day = WITNESS_DAY - 1;
    const tr = trace(WALK_K, WALK);
    const got = (tr.days[day] as Day).after.hold[WALK_K] as number;
    const h = holdBest(WALK_K, WALK, day);
    if (h.value !== got)
      throw new Error("정의로 찾은 값이 정본의 hold 와 다르다");
    const sold = h.trades.reduce((a, t) => a + gainOf(WALK, t), 0);
    const head = `hold[${WALK_K}] (날 ${day} 까지)`;
    const pad = " ".repeat(width(head));
    return [
      `${head}  →  ${WALK_K} 번째로 사서 들고 있는 방법 가운데 가장 큰 값`,
      `${pad}  →  판 거래 ${trades(h.trades)} · 이익 ${sold}`,
      `${pad}  →  날 ${h.buy} 에 가격 ${WALK[h.buy]} 에 산다`,
      `${pad}  →  ${sold} − ${WALK[h.buy]} = ${cell(h.value)}`,
    ].join("\n");
  },

  /** `deep.build` 「이웃한 상태끼리의 관계」 — 한 날에 상태마다 두 후보 중 큰 쪽을 고른다. */
  "build-neighbors": () => {
    const tr = trace(WALK_K, WALK);
    const day = tr.days[RELATION_DAY] as Day;
    const p = day.price;
    const rows: string[][] = [];
    const moved: string[] = [];
    for (const s of stateNames(WALK_K)) {
      if (s.t === 0) continue;
      const m = day.moves[s.t - 1] as Move;
      const stay = s.kind === "hold" ? m.holdStay : m.freeStay;
      const now = s.kind === "hold" ? m.hold : m.free;
      const come =
        s.kind === "hold"
          ? `free[${s.t - 1}] − ${p} = ${cell(m.freePrev)} − ${p} = ${cell(m.buy)}`
          : `hold[${s.t}] + ${p} = ${cell(m.hold)} + ${p} = ${cell(m.sell)}`;
      const took =
        now === stay
          ? "어제 값"
          : s.kind === "hold"
            ? "오늘 산다"
            : "오늘 판다";
      if (now !== stay) moved.push(s.name);
      rows.push([s.name, cell(stay), come, cell(now), took]);
    }
    return [
      md(
        ["상태", "어제 값", "앞 상태에서 오는 값", "오늘 값", "고른 쪽"],
        rows,
        [1, 3],
      ),
      "",
      `날 ${RELATION_DAY} 에 값이 바뀐 상태는 ${dots(moved)} 이고, 나머지 ${rows.length - moved.length} 상태는 어제 값이 더 컸습니다.`,
    ].join("\n");
  },

  /** `deep.build` 「헷갈리기 쉬운 모양」 — 날마다 열을 다 남기는 2 차원 표와 거래 상태. */
  "build-confuse": () => {
    const small = fullTable(WALK_K, WALK);
    const mine = bestTimeToBuyAndSellStockK(WALK_K, [...WALK]);
    if (small.answer !== mine)
      throw new Error("2 차원 표의 답이 정본과 다르다");
    const bigTable = 2 * (LIMIT_K + 1) * LIMIT_N;
    const bigStates = 2 * (LIMIT_K + 1);
    return [
      md(
        [
          "모양",
          `잡는 칸 (N = ${WALK.length} · k = ${WALK_K})`,
          `잡는 칸 (N = ${num(LIMIT_N)} · k = ${num(LIMIT_K)})`,
          "낸 답",
        ],
        [
          [
            "날마다 열을 다 남기는 2 차원 표",
            num(small.cells),
            num(bigTable),
            num(small.answer),
          ],
          ["거래 상태", num(2 * (WALK_K + 1)), num(bigStates), num(mine)],
        ],
        [1, 2, 3],
      ),
      "",
      `두 모양이 낸 답이 같고, 과제 규모에서 잡는 칸은 ${num(bigTable)} 개 대 ${num(bigStates)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 거래 상태의 시작값. */
  "build-init": () => {
    const tr = trace(WALK_K, WALK);
    const mean = (kind: "hold" | "free", t: number) =>
      t === 0
        ? "거래를 하나도 안 마쳤다 — 이 뒤로 바뀌지 않는다"
        : kind === "hold"
          ? "아직 아무 날도 안 읽어 살 방법이 없다"
          : "거래를 안 한 이익이다";
    return md(
      ["상태", "시작값", "뜻"],
      stateNames(WALK_K).map((s) => [
        s.name,
        cell(stateValue(tr.init, s)),
        mean(s.kind, s.t),
      ]),
      [1],
    );
  },

  /** `deep.build` 2단계 — 쉬운 경우: 거래 번호 1 의 매수는 지금까지의 최저가다. */
  "build-hold-one": () => {
    const tr = trace(WALK_K, WALK);
    let low = Number.POSITIVE_INFINITY;
    const rows = tr.days.map((d) => {
      const m = d.moves[0] as Move;
      low = Math.min(low, d.price);
      if (m.hold !== -low)
        throw new Error(`날 ${d.j} 의 hold[1] 이 최저가의 음수가 아니다`);
      return [
        String(d.j),
        String(d.price),
        cell(m.holdStay),
        `0 − ${d.price} = ${cell(m.buy)}`,
        cell(m.hold),
        String(low),
      ];
    });
    return [
      md(
        [
          "날 j",
          "P[j]",
          "어제의 hold[1]",
          "오늘 사는 쪽",
          "오늘의 hold[1]",
          "접두사 최솟값",
        ],
        rows,
        [0, 1, 2, 4, 5],
      ),
      "",
      `${rows.length} 날 모두 오늘의 hold[1] 이 그날까지의 접두사 최솟값에 마이너스를 붙인 값입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 불안한 경우: 거래 번호 2 의 매수는 free[1] 이 커질 때마다 다시 좋아진다. */
  "build-hold-two": () => {
    const tr = trace(WALK_K, WALK);
    const up: number[] = [];
    const rows = tr.days.map((d) => {
      const m = d.moves[1] as Move;
      if (m.hold !== m.holdStay) up.push(d.j);
      return [
        String(d.j),
        String(d.price),
        cell(m.freePrev),
        `${cell(m.freePrev)} − ${d.price} = ${cell(m.buy)}`,
        cell(m.holdStay),
        cell(m.hold),
      ];
    });
    return [
      md(
        [
          "날 j",
          "P[j]",
          "오늘의 free[1]",
          "오늘 사는 쪽",
          "어제의 hold[2]",
          "오늘의 hold[2]",
        ],
        rows,
        [0, 1, 2, 4, 5],
      ),
      "",
      `hold[2] 가 올라간 날은 ${dots(up)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — hold 가 오른 날에도 free 는 파는 쪽이 커야만 오른다. */
  "build-free-day": () => {
    const tr = trace(WALK_K, WALK);
    const day = tr.days.find(
      (d) =>
        d.j > 0 &&
        d.moves.some((m) => m.hold !== m.holdStay) &&
        d.moves.every((m) => m.sell < m.freeStay),
    ) as Day;
    const rows = day.moves.map((m) => [
      String(m.t),
      cell(m.hold),
      `${cell(m.hold)} + ${day.price} = ${cell(m.sell)}`,
      cell(m.freeStay),
      cell(m.free),
    ]);
    const m = day.moves[WALK_K - 1] as Move;
    return [
      md(
        [
          "t",
          "오늘의 hold[t]",
          "오늘 파는 쪽",
          "어제의 free[t]",
          "오늘의 free[t]",
        ],
        rows,
        [0, 1, 3, 4],
      ),
      "",
      `날 ${day.j} 에 hold[${WALK_K}] 는 ${cell(m.holdStay)} 에서 ${cell(m.hold)}${으로(cell(m.hold))} 올랐지만, 오늘 파는 쪽 ${cell(m.sell)}${이가(cell(m.sell))} 어제의 free[${WALK_K}] ${cell(m.freeStay)} 보다 작아 free[${WALK_K}] 는 그대로입니다.`,
    ].join("\n");
  },

  /** `deep.build` 「거래 번호를 상태에 넣는 까닭」 — 상태를 무엇으로 두는가를 셋으로 시험한다. */
  "state-choice": () => {
    const rows: string[][] = [];
    const miss = [0, 0, 0];
    for (const c of STATE_CASES) {
      const want = freeDef(c.k, c.prices, c.prices.length - 1);
      const got = [
        lowestOnly(c.prices),
        holdOnly(c.prices),
        bestTimeToBuyAndSellStockK(c.k, [...c.prices]),
      ];
      got.forEach((g, i) => {
        if (g !== want) miss[i] = (miss[i] as number) + 1;
      });
      rows.push([c.name, num(want), ...got.map(num)]);
    }
    if (miss[2] !== 0) throw new Error("정본이 정의와 다른 답을 냈다");
    rows.push(["어긋난 입력 수", "", ...miss.map(String)]);
    rows.push([`잡는 칸 (k = ${WALK_K})`, "", "2", "2", num(2 * (WALK_K + 1))]);
    return [
      md(
        ["입력", "정답", "최저가 하나", "보유 여부만", "거래 번호와 보유 여부"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `어긋난 입력이 0 개인 것은 「거래 번호와 보유 여부」 하나입니다.`,
    ].join("\n");
  },

  /** `deep.build` 「거래 번호를 상태에 넣는 까닭」 — 거래 상한을 몇 가지로 두고 답과 비용을 함께 잰다. */
  "trade-budget": () => {
    const rows = BUDGETS.map((k) => {
      const s = byStates(k, WALK);
      const e = byEnumerating(k, WALK);
      return {
        k,
        answer: s.answer,
        states: s.adds + s.cmps,
        sets: e.sets,
        enumOps: e.adds + e.cmps,
      };
    });
    const top = rows.at(-1)?.answer as number;
    const sat = rows.find((r) => r.answer === top)?.k as number;
    const flat = rows.at(-1)?.enumOps as number;
    const enumSat = rows.find((r) => r.enumOps === flat)?.k as number;
    return [
      md(
        [
          "거래 상한 k",
          "답",
          "거래 상태의 기본 연산",
          "거래 조합 수",
          "조합 열거의 기본 연산",
        ],
        rows.map((r) => [
          String(r.k),
          num(r.answer),
          num(r.states),
          num(r.sets),
          num(r.enumOps),
        ]),
        [0, 1, 2, 3, 4],
      ),
      "",
      `답은 k = ${sat} 부터 ${num(top)} 에서 멈추는데 거래 상태의 기본 연산은 k 에 비례해 늘어납니다. 조합 열거는 k = ${enumSat} 부터 새로 만들 조합이 없어 ${num(flat)} 에서 멈춥니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입부 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const k = ${WALK_K};`,
      `const prices = [${WALK.join(", ")}];`,
      `// 이 절이 끝나면 ${bestTimeToBuyAndSellStockK(WALK_K, [...WALK])} 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 두 줄만 실행한 뒤의 거래 상태. */
  "walk-init": () => {
    const tr = trace(WALK_K, WALK);
    const cols = Array.from({ length: WALK_K + 1 }, (_, t) => `칸 ${t}`);
    return md(
      ["배열", ...cols],
      [
        ["hold", ...tr.init.hold.map(cell)],
        ["free", ...tr.init.free.map(cell)],
      ],
      cols.map((_, i) => i + 1),
    );
  },

  /** `deep.walk.pause` — 가장 큰 거래를 먼저 확정하면 무엇이 달라지는가. */
  "pause-biggest": () => {
    const { rows, gaps } = contrast(
      BIGGEST_CASES,
      (k, P) => biggestFirst(k, P).answer,
    );
    assertBreaks(null, gaps);
    const over = rows.filter((r) => Number(r[2]) > Number(r[1])).length;
    const under = rows.filter((r) => Number(r[2]) < Number(r[1])).length;
    return [
      md(CONTRAST_HEAD("가장 큰 거래를 먼저 확정한 답"), rows, [1, 2]),
      "",
      `${over} 줄은 정본보다 크고 ${under} 줄은 작습니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 어긋나는 두 방향을 바퀴마다 펼친다. */
  "pause-biggest-trace": () => {
    const inputs: Case[] = [WALK_CASE, NAMED(2, [1, 5, 3, 6])];
    const rows: string[][] = [];
    const sums: number[] = [];
    for (const c of inputs) {
      const r = biggestFirst(c.k, c.prices);
      sums.push(r.answer);
      r.rounds.forEach((x, i) => {
        rows.push([
          i === 0 ? show(c.prices) : "",
          `${i + 1} 바퀴`,
          span(x.trade),
          num(x.gain),
          x.left.length === 0 ? "없음" : dots(x.left),
        ]);
      });
      rows.push(["", "합", "", num(r.answer), ""]);
    }
    const a = biggestFirst(WALK_K, WALK).rounds;
    const t0 = a[0]?.trade as Trade;
    const t1 = a[1]?.trade as Trade;
    const overlap: number[] = [];
    for (let d = Math.max(t0.buy, t1.buy); d <= Math.min(t0.sell, t1.sell); d++)
      overlap.push(d);
    if (overlap.length === 0) throw new Error("두 거래가 겹치지 않는다");
    const right = bestTimeToBuyAndSellStockK(2, [1, 5, 3, 6]);
    return [
      md(["입력", "바퀴", "확정한 거래", "이익", "지운 뒤 남은 날"], rows, [3]),
      "",
      `위 입력의 합 ${num(sums[0] as number)}${은는(num(sums[0] as number))} 두 거래 ${span(t0)} · ${span(t1)}${이가(t1.sell)} 날 ${dots(overlap)} 에서 겹친 값이고, 아래 입력의 합 ${num(sums[1] as number)}${은는(num(sums[1] as number))} 정본의 ${num(right)} 보다 작습니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 앞 세 날만 실행한 거래 상태. */
  "walk-first-three": () => {
    const tr = trace(WALK_K, WALK);
    const rows = tr.days.slice(0, 3).map((d) => [
      `T${d.j + 2}`,
      String(d.j),
      String(d.price),
      ...stateNames(WALK_K)
        .filter((s) => s.t > 0)
        .map((s) => cell(stateValue(d.after, s))),
    ]);
    return md(
      ["걸음", "j", "P[j]", "hold[1]", "free[1]", "hold[2]", "free[2]"],
      rows,
      [1, 2, 3, 4, 5, 6],
    );
  },

  /** `deep.walk.step` 2 — T4 한 걸음 안에서 두 거래 번호가 한 일. */
  "walk-t4": () => {
    const tr = trace(WALK_K, WALK);
    const d = tr.days[2] as Day;
    const rows = d.moves.map((m) => [
      String(m.t),
      `max(${cell(m.holdStay)}, ${cell(m.freePrev)} − ${d.price}) = ${cell(m.hold)}`,
      `max(${cell(m.freeStay)}, ${cell(m.hold)} + ${d.price}) = ${cell(m.free)}`,
    ]);
    const second = d.moves[1] as Move;
    return [
      md(["t", "hold[t]", "free[t]"], rows, [0]),
      "",
      `t = 2 가 읽은 free[1] = ${cell(second.freePrev)}${은는(cell(second.freePrev))} 같은 날 t = 1 이 방금 정한 값입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — free 배열 전체의 최댓값을 답으로 내면 무엇이 달라지는가. */
  "pause-row-max": () => {
    const { rows, gaps } = contrast(ROW_CASES, (k, P) =>
      Math.max(...freeRow(k, P)),
    );
    assertNeverBreaks(gaps);
    const row = freeRow(WALK.length, WALK);
    for (let t = 1; t < row.length; t++) {
      if ((row[t] as number) < (row[t - 1] as number)) {
        throw new Error("free 가 칸 번호를 따라 줄었다");
      }
    }
    return [
      md(CONTRAST_HEAD("free 배열의 최댓값"), rows, [1, 2]),
      "",
      `전개 입력을 k = ${WALK.length} 로 한 번 실행한 뒤의 free 배열은 이렇습니다.`,
      "",
      md(
        ["t", ...row.map((_, t) => String(t))],
        [["free[t]", ...row.map(num)]],
        row.map((_, t) => t + 1),
      ),
      "",
      `${row.length} 칸이 한 번도 안 줄어들고, 마지막 칸이 곧 그 줄의 최댓값입니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 고정 입력을 끝까지 읽은 걸음별 상태값. */
  "walk-trace": () => {
    const tr = trace(WALK_K, WALK);
    const names = stateNames(WALK_K).filter((s) => s.t > 0);
    const n = WALK.length;
    const rows: string[][] = [
      [
        "T1",
        "—",
        "—",
        "—",
        ...names.map((s) => cell(stateValue(tr.init, s))),
        "넷 다 시작값",
      ],
    ];
    let lastUp = "";
    for (const d of tr.days) {
      const id = `T${d.j + 2}`;
      const moved = names.filter(
        (s) => stateValue(d.before, s) !== stateValue(d.after, s),
      );
      if (moved.some((s) => s.name === `free[${WALK_K}]`)) lastUp = id;
      rows.push([
        id,
        String(d.j),
        `\`${d.j} < ${n}\` 참`,
        String(d.price),
        ...names.map((s) => {
          const v = cell(stateValue(d.after, s));
          return moved.includes(s) ? `**${v}**` : v;
        }),
        moved.length === 0 ? "없음" : dots(moved.map((s) => s.name)),
      ]);
    }
    rows.push([
      `T${n + 2}`,
      String(n),
      `\`${n} < ${n}\` 거짓`,
      "—",
      ...names.map((s) => cell(stateValue((tr.days.at(-1) as Day).after, s))),
      "없음",
    ]);
    return [
      md(
        [
          "걸음",
          "j",
          "읽을 날",
          "P[j]",
          ...names.map((s) => s.name),
          "바뀐 상태",
        ],
        rows,
        [1, 3, 4, 5, 6, 7],
      ),
      "",
      `굵게 적은 값이 그 걸음에서 바뀐 값입니다. free[${WALK_K}] 가 마지막으로 커진 걸음은 ${lastUp} 이고, T${n + 2} 에서 ${num(tr.answer)}${을를(num(tr.answer))} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const tr = trace(WALK_K, WALK);
    const n = WALK.length;
    const id = (d: Day) => `T${d.j + 2}`;
    const holdUp = tr.days.filter((d) =>
      d.moves.some((m) => m.hold !== m.holdStay),
    );
    const freeUp = tr.days.filter((d) =>
      d.moves.some((m) => m.free !== m.freeStay),
    );
    const rest = (xs: Day[]) => tr.days.filter((d) => !xs.includes(d));
    return md(
      ["갈래", "실행된 걸음"],
      [
        ["① 거래 상태의 시작값", "T1"],
        ["② 읽을 날이 남았는가", `T2~T${n + 1} 에서 참 · T${n + 2} 에서 거짓`],
        [
          "③ 거래 번호가 k 를 넘지 않았는가",
          `T2~T${n + 1} 마다 ${Array.from({ length: WALK_K }, (_, t) => `t = ${t + 1}`).join(" · ")} 에서 참 · t = ${WALK_K + 1} 에서 거짓`,
        ],
        [
          "④ 매수 갱신",
          `값이 오른 걸음 ${holdUp.map(id).join(" ")} · 그대로인 걸음 ${rest(holdUp).map(id).join(" ")}`,
        ],
        [
          "⑤ 매도 갱신",
          `값이 오른 걸음 ${freeUp.map(id).join(" ")} · 그대로인 걸음 ${rest(freeUp).map(id).join(" ")}`,
        ],
      ],
    );
  },

  /** `deep.walk.step` 3 — 답이 정말 두 거래의 이익 합인지 가격으로 다시 센다. */
  "walk-check-trade": () => {
    const b = bestSet(WALK_K, WALK, WALK.length - 1);
    const answer = bestTimeToBuyAndSellStockK(WALK_K, [...WALK]);
    if (b.profit !== answer)
      throw new Error("정의로 찾은 조합의 이익이 답과 다르다");
    const prices = b.trades.flatMap((t) => [WALK[t.buy], WALK[t.sell]]);
    const sum = b.trades
      .map((t) => `(${WALK[t.sell]} − ${WALK[t.buy]})`)
      .join(" + ");
    return md(
      [
        `free[${WALK_K}] 를 만든 거래`,
        "네 날의 가격",
        "직접 더한 값",
        `T${WALK.length + 2} 이 돌려준 값`,
      ],
      [
        [
          trades(b.trades),
          dots(prices as number[]),
          `${sum} = ${b.profit}`,
          num(answer),
        ],
      ],
      [3],
    );
  },

  /** `deep.walk.pause` — 매수 갱신이 거래 번호가 같은 자리를 읽으면 무엇이 달라지는가. */
  "pause-same-index": () => {
    const { rows, gaps } = contrast(INDEX_CASES, (k, P) =>
      sameIndex.bestTimeToBuyAndSellStockK(k, P),
    );
    assertBreaks(sameIndex, gaps);
    const unlimited = holdOnly(WALK);
    const neutral =
      sameIndex.bestTimeToBuyAndSellStockK === bestTimeToBuyAndSellStockK;
    if (
      !neutral &&
      sameIndex.bestTimeToBuyAndSellStockK(WALK_K, [...WALK]) !== unlimited
    ) {
      throw new Error("변이의 답이 상한이 없을 때의 답과 다르다");
    }
    return [
      md(CONTRAST_HEAD("같은 거래 번호를 읽은 답"), rows, [1, 2]),
      "",
      `거래 횟수에 상한이 없을 때 전개 입력의 답은 ${num(unlimited)} 이고, 변이가 전개 입력에서 낸 답이 그것과 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드의 호출 몇 개. */
  "final-calls": () => {
    const calls: [number, number[]][] = [
      [WALK_K, [...WALK]],
      [1, [...WALK]],
      [2, [2, 4, 1, 5]],
      [0, [1, 5, 3, 8]],
      [100, [0, 10_000]],
    ];
    const heads = calls.map(
      ([k, P]) => `bestTimeToBuyAndSellStockK(${k}, [${P.join(", ")}])`,
    );
    const w = Math.max(...heads.map(width));
    const outs = calls.map(([k, P]) =>
      String(bestTimeToBuyAndSellStockK(k, P)),
    );
    const ow = Math.max(...outs.map((o) => o.length));
    return heads
      .map(
        (h, i) =>
          `${padRight(h, w)}   → ${" ".repeat(ow - (outs[i] as string).length)}${outs[i]}`,
      )
      .join("\n");
  },

  /** `purpose.alt` — 같은 입력에서 두 설계의 기본 연산과 저장 칸. */
  "alt-table": () => {
    const mine = benchCases["거래 상태 이어받기"]?.() ?? {};
    const other =
      benchCases["거래마다 벌금을 매기고 벌금을 이분 탐색"]?.() ?? {};
    const rows = [1, 17, 18, 100].map((k) => {
      const a = mine[`k=${k} 기본 연산`] as number;
      const b = other[`k=${k} 기본 연산`] as number;
      const note =
        a < b
          ? b / a >= 2
            ? `거래 상태가 ${Math.floor(b / a)} 배 넘게 적음`
            : "거래 상태가 근소하게 적음"
          : a / b >= 2
            ? `벌금 쪽이 ${Math.floor(a / b)} 배 넘게 적음`
            : "벌금 쪽이 근소하게 적음";
      return [
        num(k),
        a < b ? `**${num(a)}**` : num(a),
        b < a ? `**${num(b)}**` : num(b),
        note,
      ];
    });
    return [
      md(
        ["거래 상한 k", "거래 상태 이어받기", "거래마다 벌금", "적은 쪽"],
        rows,
        [0, 1, 2],
      ),
      "",
      `저장 칸은 k = 1 에서 ${num(mine["k=1 저장 칸"] as number)} 개 대 ${num(other["k=1 저장 칸"] as number)} 개, k = 100 에서 ${num(mine["k=100 저장 칸"] as number)} 개 대 ${num(other["k=100 저장 칸"] as number)} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 뒤집히는 자리를 계수에서 낸다. */
  "alt-boundary": () => {
    const mine = benchCases["거래 상태 이어받기"]?.() ?? {};
    const other =
      benchCases["거래마다 벌금을 매기고 벌금을 이분 탐색"]?.() ?? {};
    const perK = (mine["k=1 기본 연산"] as number) / 1;
    for (const k of [17, 18, 100]) {
      if (mine[`k=${k} 기본 연산`] !== perK * k) {
        throw new Error("거래 상태의 연산이 k 에 비례하지 않는다");
      }
    }
    const fixed = other["k=1 기본 연산"] as number;
    for (const k of [17, 18, 100]) {
      if (other[`k=${k} 기본 연산`] !== fixed) {
        throw new Error("벌금 쪽의 연산이 상한에 따라 달라졌다");
      }
    }
    const perRound = 5 * LIMIT_N + 1;
    if (fixed % perRound !== 0)
      throw new Error("벌금 쪽 연산이 바퀴 수로 안 나뉜다");
    const ratio = fixed / perK;
    const flip = Math.ceil(ratio);
    if (!((mine[`k=${flip} 기본 연산`] as number) > fixed)) {
      throw new Error("비에서 낸 자리에서 순서가 안 뒤집힌다");
    }
    return [
      md(
        ["항목", "기본 연산"],
        [
          [
            "거래 상한 하나마다 거래 상태가 더 쓰는 연산",
            `4 × ${num(LIMIT_N)} = ${num(perK)}`,
          ],
          [
            "벌금 쪽이 상한과 상관없이 쓰는 연산",
            `한 바퀴 ${num(perRound)} × ${fixed / perRound} 바퀴 = ${num(fixed)}`,
          ],
          ["두 값의 비", `${num(fixed)} ÷ ${num(perK)} = ${ratio}`],
        ],
        [1],
      ),
      "",
      `비가 ${Math.floor(ratio)} 과 ${flip} 사이라, 거래 상한 ${flip} 에서 순서가 뒤집힙니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 거래 조합과 이익의 정의를 값에 넣는다. */
  "math-define": () => {
    const sets: Trade[][] = [
      bestSet(WALK_K, WALK, WALK.length - 1).trades as Trade[],
      bestSet(1, WALK, WALK.length - 1).trades as Trade[],
      [],
      [
        { buy: 0, sell: 3 },
        { buy: 2, sell: 5 },
      ],
    ];
    const valid = (ts: Trade[]) =>
      ts.every(
        (t, i) =>
          t.buy <= t.sell && (i === 0 || (ts[i - 1] as Trade).sell <= t.buy),
      );
    const rows = sets.map((ts) => {
      const name = ts.length === 0 ? "{}" : `{${ts.map(span).join(", ")}}`;
      if (!valid(ts)) {
        const bad = ts.findIndex(
          (t, i) => i > 0 && (ts[i - 1] as Trade).sell > t.buy,
        );
        const prev = ts[bad - 1] as Trade;
        const cur = ts[bad] as Trade;
        return [
          name,
          `둘째 사는 날 ${cur.buy}${이가(cur.buy)} 첫 파는 날 ${prev.sell} 보다 앞이다`,
          "조합이 아니다",
        ];
      }
      const sum = ts.reduce((a, t) => a + gainOf(WALK, t), 0);
      return [
        name,
        ts.length === 0
          ? "빈 합"
          : ts.map((t) => `(${WALK[t.sell]} − ${WALK[t.buy]})`).join(" + "),
        num(sum),
      ];
    });
    return md(["거래 조합 S", "이익 계산", "profit(S)"], rows, [2]);
  },

  /** `deep.math` ② — 상태의 정의를 집합으로 펴서 값에 넣는다. */
  "math-states": () => {
    const tr = trace(WALK_K, WALK);
    const at = (j: number) => (tr.days[j] as Day).after;
    const f1 = bestSet(1, WALK, 3);
    const f2 = bestSet(2, WALK, 3);
    const h2 = holdBest(2, WALK, 2);
    if (
      f1.profit !== at(3).free[1] ||
      f2.profit !== at(3).free[2] ||
      h2.value !== at(2).hold[2]
    ) {
      throw new Error("정의로 센 값이 정본의 거래 상태와 다르다");
    }
    const sold = h2.trades.reduce((a, t) => a + gainOf(WALK, t), 0);
    return md(
      ["정의", "범위", "최선", "값"],
      [
        [
          "free_1(3)",
          "날 3 까지 · 거래 1 번까지",
          trades(f1.trades),
          `${f1.trades.map((t) => `${WALK[t.sell]} − ${WALK[t.buy]}`).join(" + ")} = ${f1.profit}`,
        ],
        [
          "free_2(3)",
          "날 3 까지 · 거래 2 번까지",
          trades(f2.trades),
          `${f2.trades.map((t) => gainOf(WALK, t)).join(" + ")} = ${f2.profit}`,
        ],
        [
          "hold_2(2)",
          "날 2 까지 · 2 번째로 사서 들고 있다",
          `${trades(h2.trades)} 뒤 날 ${h2.buy} 에 산다`,
          `${sold} − ${WALK[h2.buy]} = ${cell(h2.value)}`,
        ],
      ],
    );
  },

  /**
   * `deep.math` ② — 상태 정의를 전개 입력에 넣어 확인한다. 정의는 「날 0 부터 날 j 까지만 쓴다」이므로,
   * 날 `j` 까지만 잘라 낸 배열에 **정본을 그대로 걸어** 나온 값이 곧 `free_t(j)` 다.
   */
  "math-check": () => {
    const rows: string[][] = [];
    const f1: number[] = [];
    const f2: number[] = [];
    for (let j = 0; j < WALK.length; j++) {
      const prefix = WALK.slice(0, j + 1);
      const a = bestTimeToBuyAndSellStockK(1, [...prefix]);
      const b = bestTimeToBuyAndSellStockK(2, [...prefix]);
      if (a !== freeDef(1, WALK, j) || b !== freeDef(2, WALK, j)) {
        throw new Error(`날 ${j} 까지 자른 답이 정의와 다르다`);
      }
      f1.push(a);
      f2.push(b);
      rows.push([String(j), show(prefix), num(a), num(b)]);
    }
    const up = (xs: number[]) =>
      xs.every((x, i) => i === 0 || x >= (xs[i - 1] as number));
    if (!up(f1) || !up(f2)) throw new Error("j 가 늘 때 값이 줄었다");
    const last = WALK.length - 1;
    return [
      md(
        ["j", "날 0 부터 날 j 까지의 가격", "free_1(j)", "free_2(j)"],
        rows,
        [0, 2, 3],
      ),
      "",
      `마지막 줄의 free_2(${last}) = ${num(f2.at(-1) as number)}${이가(num(f2.at(-1) as number))} 전개 입력의 답입니다. 두 열 모두 j 가 늘어도 줄지 않습니다.`,
    ].join("\n");
  },

  /** `deep.math` ③ — 매수 갱신이 오늘의 free[t−1] 을 읽든 어제 값을 읽든 답이 같다. */
  "math-same-day": () => {
    const tr = trace(WALK_K, WALK);
    const d = tr.days[2] as Day;
    const m = d.moves[1] as Move;
    const yesterday = (tr.days[1] as Day).after.free[1] as number;
    let n = 0;
    let differ = 0;
    for (let len = 1; len <= 7; len++) {
      for (let seed = 0; seed < 60; seed++) {
        const P = Array.from(
          { length: len },
          (_, j) => ((seed + 1) * (j + 3) * 37) % 12,
        );
        for (let k = 0; k <= 3; k++) {
          n++;
          if (
            descending.bestTimeToBuyAndSellStockK(k, [...P]) !==
            bestTimeToBuyAndSellStockK(k, [...P])
          ) {
            differ++;
          }
        }
      }
    }
    assertNeverBreaks([differ]);
    return [
      md(
        ["hold_2(2) 가 읽는 값", "값", "오늘 사는 쪽"],
        [
          [
            "오늘의 free_1(2)",
            cell(m.freePrev),
            `${cell(m.freePrev)} − ${d.price} = ${cell(m.freePrev - d.price)}`,
          ],
          [
            "어제의 free_1(1)",
            cell(yesterday),
            `${cell(yesterday)} − ${d.price} = ${cell(yesterday - d.price)}`,
          ],
        ],
        [1],
      ),
      "",
      `거래 번호를 큰 쪽부터 올려 어제 값을 읽는 사본을 규칙으로 만든 입력 ${num(n)} 개에 걸었고, 정본과 답이 갈린 입력은 ${differ} 개입니다.`,
    ].join("\n");
  },

  /**
   * `deep.math` ④ — 거래 상한이 실제로 값을 바꾸는 한계 `⌊N/2⌋` 를 값으로 확인한다. 상한을 `⌊N/2⌋` 로 둔
   * 답과 `N` 으로 둔 답이 같은지 보고, 등호가 서는 입력(가격이 두 값 사이를 번갈아 오가는 것)에서 실제로
   * `⌊N/2⌋` 번을 다 쓰는지 본다.
   */
  "math-cap": () => {
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
      rows.push([num(n), num(half), num(below), num(atHalf), num(atN)]);
      if (!(below < atHalf))
        throw new Error(`N=${n} 에서 ⌊N/2⌋ 번을 다 쓰지 않는다`);
    }
    const half = Math.floor(LIMIT_N / 2);
    return [
      md(
        ["N", "⌊N/2⌋", "상한 ⌊N/2⌋ − 1", "상한 ⌊N/2⌋", "상한 N"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `가격이 0 과 ${num(MAX_PRICE)} 사이를 번갈아 오가는 입력입니다. 넷째 열과 다섯째 열이 같고 셋째 열은 그보다 작습니다. 과제 규모 N = ${num(LIMIT_N)} 에서는 ⌊N/2⌋ = ${num(half)} 이라, k 의 최댓값 ${num(LIMIT_K)}${은는(num(LIMIT_K))} 이 한계보다 작습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 거래 상태를 정의로 센 값과 대조한다. */
  "invariant-hold": () => {
    const tr = trace(WALK_K, WALK);
    const names = stateNames(WALK_K).filter((s) => s.t > 0);
    const rows = tr.days.map((d) => {
      const got = names.map((s) => stateValue(d.after, s));
      const def = names.map((s) =>
        s.kind === "hold" ? holdDef(s.t, WALK, d.j) : freeDef(s.t, WALK, d.j),
      );
      const same = got.every((g, i) => g === def[i]);
      return [
        `T${d.j + 2}`,
        String(d.j),
        show(got.map(cell)),
        show(def.map(cell)),
        same ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "걸음",
          "날 j",
          names.map((s) => s.name).join(" · "),
          "정의로 센 값",
          "대조",
        ],
        rows,
        [1],
      ),
      "",
      `${rows.length} 걸음 모두 거래 상태의 ${names.length} 칸이 정의로 센 값과 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, number, number[]][] = [
      ["거래 상한이 0 이다", 0, [1, 5, 3, 8]],
      ["날이 하나뿐이다", 2, [5]],
      ["날이 둘이다", 2, [3, 8]],
      ["가격이 계속 내려간다", 2, [9, 7, 5, 3, 1]],
      ["가격이 계속 올라간다", 2, [1, 2, 3, 4, 5]],
      ["가격이 전부 같다", 2, [5, 5, 5, 5]],
      ["0 다음에 10,000 이 온다", 100, [0, MAX_PRICE]],
    ];
    const rows = cases.map(([name, k, P]) => {
      const got = bestTimeToBuyAndSellStockK(k, [...P]);
      const want = freeDef(k, P, P.length - 1);
      if (got !== want) throw new Error(`${name} 에서 정본이 정의와 다르다`);
      return [name, `k=${k} ${show(P)}`, num(got), num(want)];
    });
    return [
      md(["경우", "입력", "정본의 답", "조합을 전부 센 답"], rows, [2, 3]),
      "",
      `${rows.length} 입력 모두 정본의 답이 조합을 전부 센 답과 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 보유 상태의 시작값을 0 으로 두면 무엇이 나오는가. */
  "mutant-hold-zero": () => {
    const { rows, gaps } = contrast(HOLD_CASES, (k, P) =>
      holdFromZero.bestTimeToBuyAndSellStockK(k, P),
    );
    assertBreaks(holdFromZero, gaps);
    if (rows.some((r) => r[3] === "틀리다" && Number(r[2]) < Number(r[1]))) {
      throw new Error(
        "변이가 정본보다 작은 답을 냈다 — 「모두 정본보다 크다」가 거짓이다",
      );
    }
    return [
      md(CONTRAST_HEAD("보유 시작값을 0 으로 둔 답"), rows, [1, 2]),
      "",
      "틀린 줄은 모두 정본보다 큽니다. 사지 않은 주식을 판 이익이 후보로 들어왔습니다.",
    ].join("\n");
  },

  /** `invariant` ③ — 두 값이 처음 갈리는 자리. */
  "mutant-hold-zero-gap": () => {
    const first = [WALK[0] as number];
    const row = (label: string, k: number, P: number[]) => [
      label,
      num(bestTimeToBuyAndSellStockK(k, [...P])),
      num(holdFromZero.bestTimeToBuyAndSellStockK(k, [...P])),
    ];
    return md(
      ["실행", "정본", "보유 시작값을 0 으로 둔 사본"],
      [
        row(`날 0 만 읽은 free[1] — k = 1 · ${show(first)}`, 1, first),
        row(`전개 입력의 답 — k = ${WALK_K} · ${show(WALK)}`, WALK_K, [
          ...WALK,
        ]),
      ],
      [1, 2],
    );
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 덧셈·뺄셈과 비교가 드는가. */
  "perf-count": () => {
    const s = byStates(WALK_K, WALK);
    const n = WALK.length;
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 덧셈·뺄셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        [
          ["초기화", "T1", "1", "0", "0", "0"],
          [
            "순회",
            `T2~T${n + 1}`,
            String(n),
            String(2 * WALK_K),
            String(2 * WALK_K),
            num(4 * n * WALK_K),
          ],
          ["반환", `T${n + 2}`, "1", "0", "0", "0"],
          ["합계", "", "", "", "", num(s.adds + s.cmps)],
        ],
        [2, 3, 4, 5],
      ),
      "",
      `덧셈·뺄셈 ${s.adds} 번과 비교 ${s.cmps} 번이고, 둘 다 날 수 ${n}${과와(n)} 거래 상한 ${WALK_K} 에서만 나온 수입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 두 규모에서 센 값과 총식. */
  "perf-total": () => {
    const rows = [
      [WALK.length, WALK_K],
      [LIMIT_N, LIMIT_K],
    ].map(([n, k]) => {
      const P =
        n === WALK.length
          ? [...WALK]
          : Array.from({ length: n as number }, (_, j) => (j * 617) % 1_001);
      const s = byStates(k as number, P);
      const f = 4 * (n as number) * (k as number);
      if (s.adds + s.cmps !== f) throw new Error("센 연산이 4Nk 와 다르다");
      return [
        num(n as number),
        num(k as number),
        num(s.adds + s.cmps),
        num(f),
        num(2 * ((k as number) + 1)),
      ];
    });
    return [
      md(
        ["N", "k", "센 기본 연산", "4Nk", "잡는 칸 2(k + 1)"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      "두 규모 모두 센 값이 4Nk 와 같습니다.",
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
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
    const moved = (P: number[]): number => {
      const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
      const free = new Array<number>(k + 1).fill(0);
      let c = 0;
      for (const price of P) {
        for (let t = 1; t <= k; t++) {
          const h0 = hold[t] as number;
          const f0 = free[t] as number;
          hold[t] = Math.max(h0, (free[t - 1] as number) - price);
          free[t] = Math.max(f0, (hold[t] as number) + price);
          if (hold[t] !== h0) c++;
          if (free[t] !== f0) c++;
        }
      }
      if (free[k] !== bestTimeToBuyAndSellStockK(k, [...P])) {
        throw new Error("값이 바뀐 자리를 센 사본이 정본과 다른 답을 냈다");
      }
      return c;
    };
    const rows = shapes.map(([name, P]) => {
      const s = byStates(k, P);
      return [
        name,
        num(s.adds),
        num(s.cmps),
        num(s.adds + s.cmps),
        num(moved(P)),
        num(s.answer),
      ];
    });
    return [
      md(
        [
          `입력의 모양 (N = ${num(n)} · k = ${num(k)})`,
          "덧셈·뺄셈",
          "비교",
          "기본 연산",
          "값이 바뀐 자리",
          "답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `가운데 세 열은 네 줄 모두 같고 오른쪽 두 열만 다릅니다. 갱신 자리는 네 줄 모두 2Nk = ${num(2 * n * k)} 개입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 축마다 최악을 만드는 입력. */
  "worst-axes": () => {
    const n = LIMIT_N;
    const k = LIMIT_K;
    const alt = Array.from({ length: n }, (_, j) =>
      j % 2 === 0 ? 0 : MAX_PRICE,
    );
    const answer = bestTimeToBuyAndSellStockK(k, [...alt]);
    if (answer !== Math.min(k, Math.floor(n / 2)) * MAX_PRICE) {
      throw new Error("답의 최악이 min(k, ⌊N/2⌋) × 가격 상한과 다르다");
    }
    return md(
      ["최악으로 만들 것", "입력", "크기"],
      [
        [
          "기본 연산 수",
          `N = ${num(n)} · k = ${num(k)}, 가격은 무엇이든`,
          num(4 * n * k),
        ],
        ["잡는 칸", `k = ${num(k)}, 가격은 무엇이든`, num(2 * (k + 1))],
        [
          "답의 크기",
          `N = ${num(n)} · k = ${num(k)}, 0 과 ${num(MAX_PRICE)} 이 번갈아 나온다`,
          num(answer),
        ],
      ],
      [2],
    );
  },

  /** `selfcheck` — 예측 문제가 가리키는 걸음 T4. */
  "selfcheck-t4": () => {
    const tr = trace(WALK_K, WALK);
    const d = tr.days[2] as Day;
    const m = d.moves[1] as Move;
    return `T4   P[${d.j}] = ${d.price}   hold[2] = max(${cell(m.holdStay)}, ${cell(m.freePrev)} − ${d.price}) = ${cell(m.hold)}   free[2] = max(${cell(m.freeStay)}, ${cell(m.hold)} + ${d.price}) = ${cell(m.free)}`;
  },
};
