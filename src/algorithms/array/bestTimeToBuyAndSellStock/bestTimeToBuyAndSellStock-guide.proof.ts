/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as BENCH_N,
  U as BENCH_U,
  cases as benchCases,
} from "./bestTimeToBuyAndSellStock-guide.alt.ts";
import {
  bestUpTo,
  byAllPairs,
  byCarrying,
  FALLING,
  globalGap,
  MAX_PRICE,
  N_MAX,
  num,
  type Round,
  secondsOf,
  trace,
  WALK,
} from "./bestTimeToBuyAndSellStock-guide.fig.tsx";
import { bestTimeToBuyAndSellStock } from "./bestTimeToBuyAndSellStock-guide.ref.ts";

const REF = new URL("./bestTimeToBuyAndSellStock-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 줄만 어긋난다.
 * 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `[7 2 5]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 날 번호 목록 — `1 · 3`. */
const dots = (xs: readonly (number | string)[]): string => xs.join(" · ");

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

/* ────────────────────────── 후보와 변이 ────────────────────────── */

/** 최저가 하나만 들고 가는 후보 — 마지막 날에 파는 이익을 답으로 낸다. */
function lastDayOnly(P: readonly number[]): number {
  let minP = P[0] as number;
  for (const p of P) minP = Math.min(minP, p);
  return Math.max(0, (P[P.length - 1] as number) - minP);
}

/** 날마다의 최저가를 배열로 다 잡는 후보 — 칸 `N` 개를 쓴다. */
function prefixMinArray(P: readonly number[]): number {
  const m = new Array<number>(P.length);
  m[0] = P[0] as number;
  for (let i = 1; i < P.length; i++) {
    m[i] = Math.min(m[i - 1] as number, P[i] as number);
  }
  let best = 0;
  for (let j = 0; j < P.length; j++) {
    best = Math.max(best, (P[j] as number) - (m[j] as number));
  }
  return best;
}

/**
 * 「전체 최저가인 날에 사고 그 뒤의 최고가에 판다」 — 사는 날을 먼저 정하고 파는 날을 나중에
 * 고르는 후보. 최저가가 배열의 끝 가까이 있으면 팔 날이 남지 않는다.
 */
function buyAtGlobalMin(P: readonly number[]): { answer: number; at: number } {
  let at = 0;
  for (let i = 1; i < P.length; i++) {
    if ((P[i] as number) < (P[at] as number)) at = i;
  }
  let best = 0;
  for (let j = at; j < P.length; j++) {
    best = Math.max(best, (P[j] as number) - (P[at] as number));
  }
  return { answer: best, at };
}

/**
 * 두 줄의 순서를 맞바꾼 사본 — 최저가를 먼저 갱신하고 그다음에 오늘 파는 이익을 잰다. 두 줄의
 * 자리를 바꾼 것이라 `loadMutant`(한 줄 치환)로는 만들 수 없어 여기 따로 적는다. `start` 가 이익의
 * 시작값이다.
 */
function minFirst(P: readonly number[], start = 0): number {
  let minP = P[0] as number;
  let best = start;
  for (let i = 1; i < P.length; i++) {
    const price = P[i] as number;
    minP = Math.min(minP, price);
    best = Math.max(best, price - minP);
  }
  return best;
}

/**
 * **하루 이상 들고 있다가 반드시 한 번 판다**로 바뀐 과제의 정답 — 정의를 그대로 센다. 손해가 나도
 * 팔아야 하므로 답이 음수가 될 수 있고, 그래서 「거래 안 함」인 0 이 후보에서 빠진다.
 */
function mustTrade(P: readonly number[]): number {
  let best = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      best = Math.max(best, (P[j] as number) - (P[i] as number));
    }
  }
  return best;
}

/** 두 줄의 순서를 지킨 채 이익의 시작값만 가장 작은 값으로 둔 절차 — 바뀐 과제의 풀이다. */
function mustTradeScan(P: readonly number[]): number {
  let minP = P[0] as number;
  let best = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < P.length; i++) {
    const price = P[i] as number;
    best = Math.max(best, price - minP);
    minP = Math.min(minP, price);
  }
  return best;
}

/** 날 `j` 까지의 최저가 목록. */
function prefixMins(P: readonly number[]): number[] {
  const m: number[] = [];
  let cur = Number.POSITIVE_INFINITY;
  for (const p of P) {
    cur = Math.min(cur, p);
    m.push(cur);
  }
  return m;
}

interface Impl {
  bestTimeToBuyAndSellStock(prices: number[]): number;
}

/**
 * 최저가를 **오늘 가격으로 덮어쓰는** 사본. 「날 j 까지의 최저가」를 지키던 바로 그 줄이다.
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
  P: number[];
}

const NAMED = (P: number[]): Case => ({ name: show(P), P });
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, P: [...WALK] };

const GAP_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([...FALLING]),
  NAMED([10, 1, 9, 0, 3]),
];

/** 사는 날을 먼저 정하는 후보가 갈리는 자리를 담은 목록. */
const BUY_FIRST_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([10, 1, 9, 0, 3]),
  NAMED([10, 1, 8, 0]),
  NAMED([...FALLING]),
];

/** 「이익이 0 아래로 내려가는가」를 가르는 목록. */
const NEGATIVE_CASES: Case[] = [
  WALK_CASE,
  NAMED([5, 5, 5, 5]),
  NAMED([...FALLING]),
  NAMED([2, 1]),
  NAMED([5]),
];

/** 두 줄의 순서를 가르는 목록. 이 과제와 바뀐 과제에 같은 목록을 건다. */
const ORDER_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([...FALLING]),
  NAMED([5, 5, 5, 5]),
  NAMED([2, 1]),
];

/** 최저가를 오늘 가격으로 덮어쓰는 변이가 갈리는 자리를 담은 목록. */
const LATEST_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([3, 1, 2, 8]),
  NAMED([2, 1, 4, 3, 9]),
  NAMED([...FALLING]),
];

const STATE_CASES: number[][] = [
  [...WALK],
  [1, 2, 3, 4, 5],
  [...FALLING],
  [10, 1, 9, 0, 3],
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 6, 64, 1000];

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/** 규칙으로 만든 가격 — `37k mod 10,001`. 난수가 없어 시드가 없다. */
const ruled = (n: number): number[] =>
  Array.from({ length: n }, (_, k) => (k * 37) % (MAX_PRICE + 1));

/**
 * 변이가 답을 바꾼 자리가 하나라도 있는지 본다. 하나도 안 바뀌면 「깨진다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다**(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화하면 변이 모듈이
 * 정본 모듈 그 자체라 함수가 같은 객체다 — 그때 던지면 그 블록의 갈림 대조가 한 번도 안 돈다.
 * 손으로 만든 사본은 중화되지 않으므로 `null` 을 넘기고 늘 잰다.
 */
function assertBreaks(mutant: Impl | null, gaps: number[]): void {
  if (
    mutant !== null &&
    mutant.bestTimeToBuyAndSellStock === bestTimeToBuyAndSellStock
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

/** 두 방식을 나란히 실행해 사례 표를 만든다. `right` 가 기준 답이다(기본은 정본). */
function contrast(
  cases: Case[],
  other: (P: number[]) => number,
  right: (P: number[]) => number = bestTimeToBuyAndSellStock,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = right([...c.P]);
    const got = other([...c.P]);
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

const CONTRAST_HEAD = (
  otherHead: string,
  rightHead = "정본이 낸 답",
): string[] => ["입력", rightHead, otherHead, "판정"];

/** 반복 한 바퀴가 무엇을 바꿨는가. */
const grew = (rounds: readonly Round[], r: Round): boolean =>
  r.i > 0 && r.best > (rounds[r.i - 1] as Round).best;
const fell = (r: Round): boolean =>
  r.minBefore !== null && r.minP < r.minBefore;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 후보의 개수. 작은 입력은 실제로 세고 과제 규모는 식으로 낸다. */
  "concept-count": () => {
    const n = WALK.length;
    let pairs = 0;
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) pairs++;
    if (pairs !== (n * (n + 1)) / 2) throw new Error("쌍의 개수가 식과 다르다");
    return [
      md(
        ["날 수 N", "후보의 개수", "구한 방법"],
        [
          [num(n), num(pairs), "(i, j) 쌍을 실행해서 셌다"],
          [num(N_MAX), num((N_MAX * (N_MAX + 1)) / 2), "N(N+1)/2 로 냈다"],
        ],
        [0, 1],
      ),
      "",
      `N = ${n} 에서 센 ${pairs}${이가(pairs)} N(N+1)/2 와 같았습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 모든 쌍을 만드는 방법의 기본 연산 수. */
  "origin-cost": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const c = byAllPairs(ruled(n));
      if (c.subs + c.cmps !== n * (n + 1)) {
        throw new Error(`N = ${n} 에서 센 연산이 N(N+1) 과 다르다`);
      }
      rows.push([
        num(n),
        num(c.subs),
        num(c.subs + c.cmps),
        secondsOf(c.subs + c.cmps),
        "실행해서 셌다",
      ]);
    }
    const big = N_MAX * (N_MAX + 1);
    rows.push([
      num(N_MAX),
      num(big / 2),
      num(big),
      secondsOf(big),
      "N(N+1) 로 냈다",
    ]);
    return [
      md(
        ["N", "쌍의 개수", "기본 연산", "초당 1 억 번 기준", "구한 방법"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      "쌍 하나마다 뺄셈 1 번과 비교 1 번입니다. 실행해서 센 두 규모에서 기본 연산이 N(N+1) 과 정확히 같았습니다.",
    ].join("\n");
  },

  /** `deep.origin` ③ — 작은 입력에서 파는 날마다 다시 읽는 앞쪽. */
  "origin-repeat": () => {
    const P = WALK.slice(0, 3);
    const rows: string[][] = [];
    let reads = 0;
    for (let j = 0; j < P.length; j++) {
      const days: number[] = [];
      const gains: string[] = [];
      for (let i = 0; i <= j; i++) {
        days.push(i);
        gains.push(
          `${P[j]} − ${P[i]} = ${(P[j] as number) - (P[i] as number)}`,
        );
        reads++;
      }
      rows.push([
        String(j),
        dots(days),
        dots(gains),
        String(Math.min(...P.slice(0, j + 1))),
        String(days.length),
      ]);
    }
    const last = P.length - 1;
    const gains = P.map((p) => (P[last] as number) - p);
    const top = Math.max(...gains);
    const yesterday = Math.min(...P.slice(0, last));
    return [
      md(
        [
          "파는 날 j",
          "다시 읽은 사는 날",
          "만든 이익",
          "그중 최저가",
          "읽은 칸",
        ],
        rows,
        [0, 3, 4],
      ),
      "",
      `P = ${show(P)} 에서 읽기는 모두 ${reads} 번이고, 날 0 은 ${P.length} 줄이 저마다 다시 읽었습니다. 날 ${last} 에 파는 이익 ${dots(gains)} 중 가장 큰 ${top}${은는(top)} 어제까지의 최저가 ${yesterday}${으로(yesterday)} 산 이익입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 뺄셈·비교 횟수. */
  "cost-two-ways": () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    if (pairs.answer !== carry.answer) throw new Error("두 방식의 답이 다르다");
    const n = WALK.length;
    return [
      md(
        [
          "방식",
          `뺄셈 (N = ${n})`,
          `비교 (N = ${n})`,
          `기본 연산 (N = ${n})`,
          `기본 연산 (N = ${num(N_MAX)})`,
        ],
        [
          [
            "모든 (i, j) 쌍의 이익을 각각 만든다",
            num(pairs.subs),
            num(pairs.cmps),
            num(pairs.subs + pairs.cmps),
            num(N_MAX * (N_MAX + 1)),
          ],
          [
            "날마다 직전 결과를 이어받는다",
            num(carry.subs),
            num(carry.cmps),
            num(carry.subs + carry.cmps),
            num(3 * (N_MAX - 1)),
          ],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `두 방식 모두 답은 ${carry.answer} 입니다. 아래 방식은 날 하나에 뺄셈 ${carry.subs / (n - 1)} 번과 비교 ${carry.cmps / (n - 1)} 번을 씁니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 날짜 순서를 안 보는 후보가 어디서 어긋나는가. */
  "cost-global-gap": () => {
    const { rows } = contrast(GAP_CASES, (P) => globalGap(P));
    return [
      md(CONTRAST_HEAD("최고가 − 최저가"), rows, [1, 2]),
      "",
      "틀린 줄은 모두 최저가가 최고가보다 뒤에 있는 입력입니다. 사는 날이 파는 날보다 뒤가 되므로 그 둘은 짝지을 수 없습니다.",
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — `m_3` 하나를 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const j = 3;
    const r = trace(WALK)[j] as Round;
    const head = WALK.slice(0, j + 1);
    return [
      `m_${j}  →  날 0 부터 날 ${j} 까지  →  가격 ${head.join(" ")}`,
      `     →  가장 낮은 값 ${r.minP}, 날 ${r.minDay}`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 이웃한 두 날의 접두사 최솟값. */
  "build-neighbors": () => {
    const rounds = trace(WALK);
    const rows = rounds.slice(1).map((r) => {
      const b = r.minBefore as number;
      if (r.minP !== Math.min(b, r.price)) {
        throw new Error(`날 ${r.i} 의 m 이 두 값 중 작은 쪽이 아니다`);
      }
      return [
        String(r.i),
        String(b),
        String(r.price),
        String(r.minP),
        r.minP < b ? "P[j] 로 내려감" : "m_{j−1} 그대로",
      ];
    });
    const down = rounds.filter(fell).map((r) => r.i);
    const up = rounds.slice(1).filter((r) => r.minP > (r.minBefore as number));
    return [
      md(["j", "m_{j−1}", "P[j]", "m_j", "두 값의 관계"], rows, [0, 1, 2, 3]),
      "",
      `${rows.length} 쌍 모두 m_j 가 m_{j−1} 과 P[j] 가운데 작은 쪽입니다. 내려간 날은 ${dots(down)} 이고, 올라간 날은 ${up.length} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 전체 최저가와 어제까지의 최저가. */
  "build-confuse": () => {
    const rounds = trace(WALK);
    const low = Math.min(...WALK);
    const lowDay = WALK.indexOf(low);
    const blocked: number[] = [];
    const rows = rounds.slice(1).map((r) => {
      const ok = lowDay <= r.i;
      if (!ok) blocked.push(r.i);
      return [
        String(r.i),
        String(r.price),
        `${r.minBefore} (날 ${r.minBeforeDay})`,
        String(r.gain),
        `${low} (날 ${lowDay})`,
        String(r.price - low),
        ok ? "된다" : "안 된다",
      ];
    });
    return [
      md(
        [
          "파는 날 j",
          "P[j]",
          "어제까지의 최저가",
          "그 값으로 산 이익",
          "전체 최저가",
          "전체 최저가로 산 이익",
          "그 날에 사기",
        ],
        rows,
        [0, 1, 3, 5],
      ),
      "",
      `전체 최저가 ${low}${은는(low)} 날 ${lowDay} 의 가격이라, 파는 날 ${dots(blocked)} 에서는 그 날에 살 수 없습니다. 그 날들의 여섯째 열은 할 수 없는 거래의 이익입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 첫날의 두 상태. */
  "build-first": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "후보", "값"],
      [
        ["날 0 까지의 최저가 m_0", "날 0 의 가격 하나", String(r.minP)],
        [
          "날 0 까지의 최대 이익 best",
          "날 0 에 사서 날 0 에 팔기 하나",
          String(r.best),
        ],
      ],
      [2],
    );
  },

  /** `deep.build` 2단계 — 오늘 파는 이익이 best 를 바꾸는 경우와 안 바꾸는 경우. */
  "build-cases": () => {
    const rounds = trace(WALK);
    const kinds: [string, (r: Round) => boolean][] = [
      ["오늘 가격이 어제까지의 최저가보다 낮다", (r) => (r.gain as number) < 0],
      [
        "이익이 0 이상이고 best 보다 크다",
        (r) => (r.gain as number) >= 0 && grew(rounds, r),
      ],
      [
        "이익이 0 이상이지만 best 이하다",
        (r) => (r.gain as number) >= 0 && !grew(rounds, r),
      ],
    ];
    const rows: string[][] = [];
    let covered = 0;
    for (const [name, pick] of kinds) {
      for (const r of rounds.slice(1).filter(pick)) {
        const b = rounds[r.i - 1] as Round;
        covered++;
        rows.push([
          name,
          String(r.i),
          String(r.minBefore),
          String(r.price),
          `${r.price} − ${r.minBefore} = ${r.gain}`,
          `${b.best} → ${r.best}`,
        ]);
      }
    }
    if (covered !== WALK.length - 1) {
      throw new Error("경우가 날을 다 덮지 않는다");
    }
    const negative = rounds.filter((r) => r.gain !== null && r.gain < 0);
    if (negative.some((r) => grew(rounds, r))) {
      throw new Error("이익이 음수인 날에 best 가 커졌다");
    }
    return [
      md(
        ["경우", "j", "m_{j−1}", "P[j]", "오늘 파는 이익", "best"],
        rows,
        [1, 2, 3],
      ),
      "",
      `반복의 ${covered} 날이 세 경우에 빠짐없이 들어갑니다. 이익이 음수인 날은 ${dots(negative.map((r) => r.i))} 이고, 그 날들에서 best 는 그대로였습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 두 값이 날마다 어떻게 바뀌는가. */
  "build-carry": () => {
    const rounds = trace(WALK);
    const up = rounds.filter((r) => grew(rounds, r)).map((r) => r.i);
    const down = rounds.filter(fell).map((r) => r.i);
    const both = rounds.filter((r) => grew(rounds, r) && fell(r));
    const last = up[up.length - 1] as number;
    const r = rounds[last] as Round;
    return [
      md(
        ["줄", `날 0 부터 날 ${WALK.length - 1} 까지`],
        [
          ["P", show(WALK)],
          ["m", show(rounds.map((x) => x.minP))],
          ["best", show(rounds.map((x) => x.best))],
          ["best 가 커진 날", dots(up)],
          ["m 이 내려간 날", dots(down)],
        ],
      ),
      "",
      `두 값이 한 날에 함께 바뀐 날은 ${both.length} 개입니다. 날 ${r.minBeforeDay} 에 내려간 최저가 ${r.minBefore}${이가(r.minBefore as number)} 날 ${r.i} 에서 쓰여, best 가 ${r.price} − ${r.minBefore} = ${r.gain}${으로(r.gain as number)} 커졌습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 무엇을 들고 가는지를 네 가지로 두고 답을 대조한다. */
  "state-size": () => {
    const heads = [
      "최고가와 최저가",
      "최저가만",
      "최저가와 최대 이익",
      "날마다의 최저가",
    ];
    const impls: ((P: readonly number[]) => number)[] = [
      globalGap,
      lastDayOnly,
      (P) => bestTimeToBuyAndSellStock([...P]),
      prefixMinArray,
    ];
    const wrong = [0, 0, 0, 0];
    const rows = STATE_CASES.map((P) => {
      const bare = bestTimeToBuyAndSellStock([...P]);
      const cells = impls.map((f, k) => {
        const got = f([...P]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [show(P), String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(N_MAX)} 에서 쓰는 칸`,
      "",
      "2",
      "1",
      "2",
      num(N_MAX),
    ]);
    const zero = heads.filter((_, k) => wrong[k] === 0);
    return [
      md(["입력", "정답", ...heads], rows, [1, 2, 3, 4, 5]),
      "",
      `어긋난 입력이 0 개인 것은 ${zero.map((h) => `「${h}」`).join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () => {
    const want = bestTimeToBuyAndSellStock([...WALK]);
    return [
      `const prices = [${WALK.join(", ")}];`,
      `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 두 줄만 실행했을 때의 두 상태. */
  "walk-init": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "값", "뜻"],
      [
        ["minP", String(r.minP), "날 0 까지의 최저가"],
        ["best", String(r.best), "거래를 안 했을 때의 이익"],
      ],
      [1],
    );
  },

  /** `deep.walk.pause` — 사는 날을 먼저 정하면 무엇이 달라지는가. */
  "pause-buy-at-global-min": () => {
    const { rows, gaps } = contrast(
      BUY_FIRST_CASES,
      (P) => buyAtGlobalMin(P).answer,
    );
    assertBreaks(null, gaps);
    return [
      md(CONTRAST_HEAD("최저가인 날에 산 답"), rows, [1, 2]),
      "",
      "틀린 줄은 전체 최저가가 배열의 끝 가까이 있는 입력입니다. 그 날 뒤로 가격이 오를 날이 남지 않습니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — `[10 1 8 0]` 에서 두 순서로 고른 거래. */
  "pause-buy-first-trace": () => {
    const P = [10, 1, 8, 0];
    const first = buyAtGlobalMin(P);
    const rounds = trace(P);
    const last = rounds[rounds.length - 1] as Round;
    const t = last.trade as readonly [number, number];
    return md(
      ["먼저 정하는 날", "정한 날", "그 날에 맞춰 고른 짝", "이익"],
      [
        [
          "사는 날",
          `날 ${first.at} (가격 ${P[first.at]})`,
          `날 ${first.at} 뒤에 남은 날 ${P.length - 1 - first.at} 개`,
          String(first.answer),
        ],
        [
          "파는 날",
          `날 ${t[1]} (가격 ${P[t[1]]})`,
          `날 ${t[1]} 앞의 최저가 ${P[t[0]]} (날 ${t[0]})`,
          `${P[t[1]]} − ${P[t[0]]} = ${last.best}`,
        ],
      ],
      [3],
    );
  },

  /** `deep.walk` 2 — 반복 앞 세 바퀴의 상태. */
  "walk-first-three": () => {
    const rounds = trace(WALK);
    const rows = rounds
      .slice(1, 4)
      .map((r) => [
        `T${r.i + 1}`,
        String(r.i),
        String(r.price),
        `${r.price} − ${r.minBefore} = ${r.gain}`,
        String(r.best),
        String(r.minP),
      ]);
    const t2 = rounds[1] as Round;
    const t3 = rounds[2] as Round;
    const t4 = rounds[3] as Round;
    return [
      md(
        ["걸음", "i", "P[i]", "오늘 파는 이익", "best", "minP"],
        rows,
        [1, 2, 4, 5],
      ),
      "",
      `T3 에서 best 가 ${t2.best} 에서 ${t3.best}${으로(t3.best)} 커지고, T4 에서 minP 가 ${t4.minP}${으로(t4.minP)} 내려가도 best 는 ${t4.best} 그대로입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 이익의 시작값을 「가장 작은 값」으로 두면 무엇이 달라지는가. */
  "pause-negative-profit": () => {
    const { rows, gaps } = contrast(NEGATIVE_CASES, (P) =>
      bestFromNegative.bestTimeToBuyAndSellStock(P),
    );
    assertBreaks(bestFromNegative, gaps);
    return [
      md(CONTRAST_HEAD("가장 작은 값에서 시작한 답"), rows, [1, 2]),
      "",
      "이익이 나는 날이 하루라도 있는 입력에서는 답이 그대로이고, 하루도 없는 입력에서만 음수가 나옵니다.",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 순회한 걸음별 상태값과 조건 판정. */
  "walk-trace": () => {
    const rounds = trace(WALK);
    const n = WALK.length;
    const first = rounds[0] as Round;
    const rows: string[][] = [
      [
        "T1",
        "0",
        "—",
        String(first.price),
        "—",
        String(first.best),
        String(first.minP),
        "둘 다 시작값",
      ],
    ];
    for (const r of rounds.slice(1)) {
      const g = grew(rounds, r);
      const f = fell(r);
      rows.push([
        `T${r.i + 1}`,
        String(r.i),
        `\`${r.i} < ${n}\` 참`,
        String(r.price),
        String(r.gain),
        g ? `**${r.best}**` : String(r.best),
        f ? `**${r.minP}**` : String(r.minP),
        g ? "best" : f ? "minP" : "없음",
      ]);
    }
    const last = rounds[rounds.length - 1] as Round;
    rows.push([
      `T${n + 1}`,
      String(n),
      `\`${n} < ${n}\` 거짓`,
      "—",
      "—",
      String(last.best),
      String(last.minP),
      "없음",
    ]);
    const lastGrow = rounds.reduce((at, r) => (grew(rounds, r) ? r.i : at), 0);
    return [
      md(
        [
          "걸음",
          "i",
          "반복 조건",
          "P[i]",
          "오늘 파는 이익",
          "best",
          "minP",
          "바뀐 값",
        ],
        rows,
        [1, 3, 4, 5, 6],
      ),
      "",
      `굵게 적은 값이 그 걸음에서 바뀐 값입니다. best 가 마지막으로 커진 걸음은 T${lastGrow + 1} 이고, T${n + 1} 에서 ${last.best}${을를(last.best)} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` — 네 갈래가 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const rounds = trace(WALK);
    const n = WALK.length;
    const loop = rounds.slice(1);
    const T = (r: Round) => `T${r.i + 1}`;
    const up = loop.filter((r) => grew(rounds, r)).map(T);
    const kept = loop.filter((r) => !grew(rounds, r)).map(T);
    const down = loop.filter(fell).map(T);
    const stay = loop.filter((r) => !fell(r)).map(T);
    return md(
      ["갈래", "실행된 걸음"],
      [
        ["① 두 상태의 시작값", "T1"],
        [`② 반복 조건 i < ${n}`, `T2~T${n} 에서 참 · T${n + 1} 에서 거짓`],
        [
          "③ 최대 이익 갱신",
          `값이 커진 걸음 ${up.join(" ")} · 그대로인 걸음 ${kept.join(" ")}`,
        ],
        [
          "④ 최저가 갱신",
          `값이 내려간 걸음 ${down.join(" ")} · 그대로인 걸음 ${stay.join(" ")}`,
        ],
      ],
    );
  },

  /** `deep.walk.step` — 돌려준 값이 정말 그 두 날의 차인가. */
  "walk-check-trade": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const t = last.trade as readonly [number, number];
    const buy = WALK[t[0]] as number;
    const sell = WALK[t[1]] as number;
    if (sell - buy !== last.best)
      throw new Error("두 날의 차가 best 와 다르다");
    return md(
      [
        "best 를 만든 거래",
        "두 날의 가격",
        "직접 뺀 값",
        `T${WALK.length + 1} 이 돌려준 값`,
      ],
      [
        [
          `날 ${t[0]} 에 사서 날 ${t[1]} 에 판다`,
          `${buy} · ${sell}`,
          `${sell} − ${buy} = ${sell - buy}`,
          String(bestTimeToBuyAndSellStock([...WALK])),
        ],
      ],
      [3],
    );
  },

  /** `deep.walk.pause` — 두 줄의 순서를 바꾸면 이 과제와 바뀐 과제가 어떻게 갈리는가. */
  "pause-swap-order": () => {
    const { rows, gaps } = contrast(ORDER_CASES, (P) => minFirst(P));
    assertNeverBreaks(gaps);
    for (const c of ORDER_CASES) {
      if (mustTradeScan(c.P) !== mustTrade(c.P)) {
        throw new Error("바뀐 과제의 풀이가 정의와 다르다");
      }
    }
    const other = contrast(
      ORDER_CASES,
      (P) => minFirst(P, Number.NEGATIVE_INFINITY),
      mustTrade,
    );
    assertBreaks(null, other.gaps);
    return [
      "이 과제에서는 거래를 안 해도 되고 같은 날 사고팔 수 있습니다.",
      "",
      md(CONTRAST_HEAD("최저가를 먼저 갱신한 답"), rows, [1, 2]),
      "",
      "바뀐 과제에서는 하루 이상 들고 있다가 반드시 한 번 팝니다.",
      "",
      md(
        CONTRAST_HEAD("최저가를 먼저 갱신한 답", "바뀐 과제의 답"),
        other.rows,
        [1, 2],
      ),
      "",
      `위 표는 ${rows.length} 줄 모두 답이 그대로이고, 아래 표는 ${other.gaps.filter((g) => g !== 0).length} 줄에서 답이 바뀝니다. 정본의 순서에서 이익의 시작값만 가장 작은 값으로 바꾸면 아래 표의 ${ORDER_CASES.length} 입력 모두 바뀐 과제의 답이 나옵니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 순서가 날마다 만드는 오늘 파는 이익. */
  "pause-swap-gain": () => {
    const rounds = trace(WALK);
    const differ: number[] = [];
    const rows = rounds.slice(1).map((r) => {
      const before = r.gain as number;
      const after = r.price - r.minP;
      if (before !== after) differ.push(r.i);
      return [
        String(r.i),
        String(r.price),
        String(r.minBefore),
        String(r.minP),
        `${r.price} − ${r.minBefore} = ${before}`,
        `${r.price} − ${r.minP} = ${after}`,
      ];
    });
    for (const j of differ) {
      const r = rounds[j] as Round;
      if (r.price - r.minP !== 0 || (r.gain as number) >= 0) {
        throw new Error("두 순서가 갈리는 날의 이익이 0 과 음수가 아니다");
      }
    }
    return [
      md(
        ["j", "P[j]", "m_{j−1}", "m_j", "원래 순서의 이익", "바꾼 순서의 이익"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `두 순서의 이익이 서로 다른 날은 ${dots(differ)} 이고, 그 날들에서 원래 순서의 이익은 음수, 바꾼 순서의 이익은 0 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  "final-calls": () => {
    const calls = [
      [...WALK],
      [1, 2, 3, 4, 5],
      [...FALLING],
      [0, MAX_PRICE],
      [5],
    ];
    const heads = calls.map(
      (P) => `bestTimeToBuyAndSellStock([${P.join(", ")}])`,
    );
    const w = Math.max(...heads.map(width));
    return calls
      .map(
        (P, k) =>
          `${padRight(heads[k] as string, w)}   →  ${bestTimeToBuyAndSellStock([...P])}`,
      )
      .join("\n");
  },

  /** `related` — 걸음마다 그때까지 받은 가격만으로 답이 이미 나와 있는가. */
  "related-online": () => {
    const rounds = trace(WALK);
    const rows = rounds.map((r) => {
      const seen = WALK.slice(0, r.i + 1);
      const direct = byAllPairs(seen).answer;
      if (direct !== r.best) throw new Error("앞부분의 답이 best 와 다르다");
      return [`T${r.i + 1}`, seen.join(" "), String(r.best), String(direct)];
    });
    return [
      md(
        [
          "걸음",
          "그때까지 받은 가격",
          "그 걸음의 best",
          "받은 가격만으로 모든 쌍을 센 답",
        ],
        rows,
        [2, 3],
      ),
      "",
      `${rows.length} 걸음 모두 오른쪽 두 열의 값이 같습니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — `bench-alt` 가 낸 계수를 표로. */
  "alt-table": () => {
    const at = (design: string, p: number) =>
      benchCases[`${design} · 질의 ${num(p)} 회`]?.()["기본 연산"] as number;
    const rows = [0, 17, 18, 1024].map((p) => {
      const a = at("날마다 이어받기", p);
      const b = at("세그먼트 트리", p);
      const note =
        a < b
          ? b / a >= 2
            ? `이어받기가 ${Math.round(b / a)} 배 적음`
            : "이어받기가 근소하게 적음"
          : a / b >= 2
            ? `세그먼트 트리가 ${Math.round(a / b)} 배 적음`
            : "세그먼트 트리가 근소하게 적음";
      return [
        `${num(p)} 회`,
        a < b ? `**${num(a)}**` : num(a),
        b < a ? `**${num(b)}**` : num(b),
        note,
      ];
    });
    const mine = benchCases["날마다 이어받기"]?.()["저장 칸"] as number;
    const other = benchCases["세그먼트 트리"]?.()["저장 칸"] as number;
    return [
      md(
        ["섞인 질의", "날마다 이어받기", "세그먼트 트리", "적은 쪽"],
        rows,
        [1, 2],
      ),
      "",
      `저장 칸은 ${num(mine)} 개 대 ${num(other)} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 뒤집히는 자리를 계수에서 낸다. */
  "alt-boundary": () => {
    const at = (design: string, p: number) =>
      benchCases[`${design} · 질의 ${num(p)} 회`]?.()["기본 연산"] as number;
    const perQuery = at("날마다 이어받기", 0);
    const fixed = at("세그먼트 트리", 0);
    const build = 5 * (BENCH_N - 1);
    const updates = 5 * BENCH_U * Math.log2(BENCH_N);
    if (build + updates !== fixed) {
      throw new Error("세그먼트 트리의 계수가 세우기와 갱신으로 나뉘지 않는다");
    }
    if (at("날마다 이어받기", 17) !== 18 * perQuery) {
      throw new Error("이어받기의 질의당 연산이 일정하지 않다");
    }
    return md(
      ["무엇", "값"],
      [
        ["질의 하나에 드는 이어받기의 연산", num(perQuery)],
        ["질의 하나에 드는 세그먼트 트리의 연산", "0"],
        [
          "세그먼트 트리가 먼저 쓰는 연산",
          `${num(fixed)} = 트리 세우기 ${num(build)} + 갱신 ${num(updates)}`,
        ],
        [
          "두 값의 비",
          `${num(fixed)} ÷ ${num(perQuery)} ≈ ${(fixed / perQuery).toFixed(2)}`,
        ],
      ],
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 본다. */
  "math-check": () => {
    const P = WALK;
    const m = prefixMins(P);
    const profit = (i: number, j: number) => [
      `profit(${i}, ${j})`,
      `${P[j]} − ${P[i]}`,
      String((P[j] as number) - (P[i] as number)),
    ];
    const min = (j: number) => [
      `m_${j}`,
      `min{${P.slice(0, j + 1).join(", ")}}`,
      String(m[j]),
    ];
    return md(
      ["정의", "값에 넣은 식", "값"],
      [profit(3, 4), profit(0, 5), profit(2, 2), min(0), min(3), min(5)],
      [2],
    );
  },

  /** `deep.math` ② — 접두사 최솟값으로 세운 식을 날마다 넣어 본다. */
  "math-prefix-min": () => {
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
        before === null ? "—" : String(before),
        gain === null ? "—" : String(gain),
        String(running),
      ]);
    }
    if (running !== bestTimeToBuyAndSellStock([...WALK])) {
      throw new Error("식으로 낸 답이 정본과 다르다");
    }
    return [
      md(
        ["j", "P[j]", "m_{j−1}", "P[j] − m_{j−1}", "0 과 그때까지의 최댓값"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `넷째 열은 최저가가 내려간 날(날 ${dots(negatives)})에 음수입니다. 다섯째 열은 0 에서 시작해 한 번도 줄지 않고, 마지막 값 ${running}${이가(running)} 답입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 점화식으로 낸 값과 집합으로 편 값의 대조. */
  "math-recurrence": () => {
    const m = prefixMins(WALK);
    const rows: string[][] = [
      ["0", `P[0] = ${WALK[0]}`, String(m[0]), String(trace(WALK)[0]?.minP)],
    ];
    const rounds = trace(WALK);
    let prev = WALK[0] as number;
    for (let j = 1; j < WALK.length; j++) {
      const next = Math.min(prev, WALK[j] as number);
      if (next !== m[j] || next !== rounds[j]?.minP) {
        throw new Error("점화식과 정의가 다르다");
      }
      rows.push([
        String(j),
        `min(${prev}, ${WALK[j]}) = ${next}`,
        String(m[j]),
        String(rounds[j]?.minP),
      ]);
      prev = next;
    }
    return [
      md(["j", "점화식", "집합으로 편 min", "정본이 든 minP"], rows, [0, 2, 3]),
      "",
      `${rows.length} 날 모두 세 값이 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const P = Array.from({ length: n }, (_, k) => (k * 37) % 101);
      const pairs = byAllPairs(P);
      const carry = byCarrying(P);
      if (pairs.answer !== carry.answer) {
        throw new Error("두 방식의 답이 다르다");
      }
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
    const n = N_MAX;
    return [
      md(
        [
          "N",
          "(i, j) 쌍의 수(실측)",
          "모든 쌍(실측)",
          "N(N+1)",
          "이어받기(실측)",
          "3N − 3",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `과제 규모 N = ${num(n)} 을 두 식에 넣으면 N(N+1) = ${num(n * (n + 1))}, 3N − 3 = ${num(3 * n - 3)} 이고, 두 값의 비는 ${num(Math.round((n * (n + 1)) / (3 * n - 3)))} 배입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 두 문장을 정의로 센 값과 대조한다. */
  "invariant-hold": () => {
    const rounds = trace(WALK);
    const rows = rounds.map((r) => [
      `T${r.i + 1}`,
      String(r.i),
      String(r.minP),
      String(Math.min(...WALK.slice(0, r.i + 1))),
      String(r.best),
      String(bestUpTo(WALK, r.i)),
    ]);
    return [
      md(
        [
          "걸음",
          "날 j",
          "minP",
          "정의로 센 m_j",
          "best",
          "날 j 까지 모든 쌍을 센 답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 걸음 모두 minP 가 정의로 센 m_j 와, best 가 모든 쌍을 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const inputs: [string, number[]][] = [
      ["날이 하나", [5]],
      ["날이 둘", [3, 8]],
      ["가격이 계속 내려간다", [9, 7, 5, 3, 1]],
      ["가격이 계속 올라간다", [1, 2, 3, 4, 5]],
      ["가격이 전부 같다", [5, 5, 5, 5]],
      [`0 다음에 ${num(MAX_PRICE)}`, [0, MAX_PRICE]],
    ];
    const rows = inputs.map(([name, P]) => {
      const rounds = trace(P);
      const up = rounds.filter((r) => grew(rounds, r)).length;
      const down = rounds.filter(fell).length;
      return [
        `${name} ${show(P)}`,
        String(P.length - 1),
        String(up),
        String(down),
        num(bestTimeToBuyAndSellStock([...P])),
        num(byAllPairs(P).answer),
      ];
    });
    return [
      md(
        [
          "입력",
          "반복 횟수",
          "best 가 커진 횟수",
          "minP 가 내려간 횟수",
          "정본의 답",
          "모든 쌍을 센 답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 입력 모두 정본의 답이 모든 쌍을 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 최저가를 오늘 가격으로 덮어쓰면 무엇이 나오는가. */
  "mutant-latest-price": () => {
    const { rows, gaps } = contrast(LATEST_CASES, (P) =>
      latestPrice.bestTimeToBuyAndSellStock(P),
    );
    assertBreaks(latestPrice, gaps);
    return [
      md(CONTRAST_HEAD("어제 가격으로 산 답"), rows, [1, 2]),
      "",
      "minP 가 「날 j 까지의 최저가」가 아니라 「어제 가격」이 되면, 답이 하루 사이 상승폭의 최댓값이 됩니다.",
    ].join("\n");
  },

  /** `invariant` ③ — 변이가 든 minP 와 그 답이 무엇인가. */
  "mutant-latest-gap": () => {
    const P = [1, 2, 3, 4, 5];
    const right = prefixMins(P);
    const rises = P.slice(1).map((p, k) => p - (P[k] as number));
    const mutated = latestPrice.bestTimeToBuyAndSellStock([...P]);
    const neutral =
      latestPrice.bestTimeToBuyAndSellStock === bestTimeToBuyAndSellStock;
    if (!neutral && mutated !== Math.max(0, ...rises)) {
      throw new Error("변이의 답이 하루 사이 상승폭의 최댓값이 아니다");
    }
    const t = trace(P).at(-1)?.trade as readonly [number, number];
    return md(
      ["값", "크기", "출처"],
      [
        ["정본의 minP", show(right), "날 j 까지의 최저가"],
        ["변이의 minP", show(P), "날마다 그 날의 가격으로 덮어쓴 값"],
        [
          "변이의 답",
          String(mutated),
          `하루 사이 상승폭 ${dots(rises)} 의 최댓값`,
        ],
        [
          "정본의 답",
          String(bestTimeToBuyAndSellStock([...P])),
          `날 ${t[0]} 에 사서 날 ${t[1]} 에 판 이익`,
        ],
      ],
    );
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 뺄셈과 비교가 드는가. */
  "perf-count": () => {
    const carry = byCarrying(WALK);
    const n = WALK.length;
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 뺄셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        [
          ["초기화", "T1", "1", "0", "0", "0"],
          ["순회", `T2~T${n}`, String(n - 1), "1", "2", String(3 * (n - 1))],
          ["반환", `T${n + 1}`, "1", "0", "0", "0"],
          ["합계", "", "", "", "", String(carry.subs + carry.cmps)],
        ],
        [2, 3, 4, 5],
      ),
      "",
      `뺄셈 ${carry.subs} 번과 비교 ${carry.cmps} 번이고, 둘 다 날 수 ${n} 에서만 나온 수입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 두 규모에서 센 값과 총식의 대조. */
  "perf-total": () => {
    const rows = [WALK.length, N_MAX].map((n) => {
      const P = n === WALK.length ? [...WALK] : ruled(n);
      const c = byCarrying(P);
      if (c.subs + c.cmps !== 3 * (n - 1)) {
        throw new Error("센 값이 총식과 다르다");
      }
      return [num(n), num(c.subs + c.cmps), num(3 * (n - 1))];
    });
    return [
      md(["N", "센 기본 연산", "3(N − 1)"], rows, [0, 1, 2]),
      "",
      "두 규모 모두 센 값이 3(N − 1) 과 같습니다.",
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["가격이 하루도 안 바뀐다", Array.from({ length: n }, () => 5_000)],
      [
        "가격이 날마다 1 씩 내려간다",
        Array.from({ length: n }, (_, k) => MAX_PRICE - k),
      ],
      ["가격이 날마다 1 씩 올라간다", Array.from({ length: n }, (_, k) => k)],
      [
        `0 과 ${num(MAX_PRICE)} 이 번갈아 나온다`,
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 0 : MAX_PRICE)),
      ],
    ];
    const rows = shapes.map(([name, P]) => {
      const c = byCarrying(P);
      return [
        name,
        num(c.subs),
        num(c.cmps),
        num(c.subs + c.cmps),
        num(c.answer),
      ];
    });
    return [
      md(
        [`입력의 모양 (N = ${num(n)})`, "뺄셈", "비교", "기본 연산", "답"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      "가운데 세 열은 네 줄 모두 값이 같고, 오른쪽 열만 다릅니다.",
    ].join("\n");
  },

  /** `perf.worst` — 무엇을 최악으로 만드느냐에 따라 다른 입력. */
  "worst-axes": () => {
    const big = [0, ...Array.from({ length: N_MAX - 1 }, () => MAX_PRICE)];
    const c = byCarrying(big);
    return md(
      ["최악으로 만들 것", "입력", "값"],
      [
        [
          "기본 연산 수",
          `N = ${num(N_MAX)}, 가격은 무엇이든`,
          num(c.subs + c.cmps),
        ],
        ["잡는 칸", "어떤 입력이든", "2"],
        ["답의 크기", `첫날 0, 그 뒤 날마다 ${num(MAX_PRICE)}`, num(c.answer)],
      ],
      [2],
    );
  },

  /** `selfcheck` — 전개의 T4. */
  "selfcheck-t4": () => {
    const r = trace(WALK)[3] as Round;
    return `T4   P[3] = ${r.price}   오늘 파는 이익 ${r.price} − ${r.minBefore} = ${r.gain}   best = ${r.best} 그대로   minP = ${r.minBefore} → ${r.minP}`;
  },
};
