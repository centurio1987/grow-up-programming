/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/kadane/kadane-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as BENCH_N,
  U as BENCH_U,
  cases as benchCases,
} from "./kadane-guide.alt.ts";
import {
  ALL_NEGATIVE,
  byAllPairs,
  byCarrying,
  CANDIDATE_END,
  endingSums,
  N_MAX,
  num,
  type Round,
  resetAtZero,
  secondsOf,
  span,
  trace,
  WALK,
} from "./kadane-guide.fig.tsx";
import { kadane } from "./kadane-guide.ref.ts";

const REF = new URL("./kadane-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `[3 4 7]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 음수를 괄호로 싼다 — `4 + (-1)`. */
const paren = (x: number): string => (x < 0 ? `(${x})` : String(x));

/** 칸 번호 목록 — `1 · 3`. */
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

/** 상태를 하나도 안 들고 가는 후보 — 가장 큰 원소 하나를 답으로 낸다. */
function biggestElement(A: readonly number[]): number {
  let best = A[0] as number;
  for (const x of A) best = Math.max(best, x);
  return best;
}

/** 직전 최대합만 들고 가는 후보 — 마지막 칸의 값을 답으로 낸다. */
function lastCellOnly(A: readonly number[]): number {
  let prev = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    prev = Math.max(A[i] as number, prev + (A[i] as number));
  }
  return prev;
}

/** 칸 `N` 개를 그대로 잡는 후보 — dp 배열을 다 만든 뒤 최댓값을 고른다. */
function dpArray(A: readonly number[]): number {
  const dp = new Array<number>(A.length);
  dp[0] = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    dp[i] = Math.max(A[i] as number, (dp[i - 1] as number) + (A[i] as number));
  }
  let best = dp[0] as number;
  for (const v of dp) best = Math.max(best, v);
  return best;
}

/**
 * 두 줄의 순서를 맞바꾼 사본. 두 줄의 자리를 바꾼 것이라 `loadMutant`(한 줄 치환)로는 만들
 * 수 없어 여기 따로 적는다. 나머지는 정본과 같다. 바퀴마다의 상태도 함께 돌려준다.
 */
function bestBeforePrev(A: readonly number[]): {
  answer: number;
  rounds: { prev: number; best: number }[];
} {
  let prev = A[0] as number;
  let best = A[0] as number;
  const rounds = [{ prev, best }];
  for (let i = 1; i < A.length; i++) {
    best = Math.max(best, prev);
    prev = Math.max(A[i] as number, prev + (A[i] as number));
    rounds.push({ prev, best });
  }
  return { answer: best, rounds };
}

/** 누적합 `P[0] = 0`, `P[j] = A[0] + … + A[j−1]`. `deep.math` 의 검산이 쓴다. */
function prefixSums(A: readonly number[]): number[] {
  const P = [0];
  for (const x of A) P.push((P[P.length - 1] as number) + x);
  return P;
}

/** 구간 곱의 최댓값과 그 구간 — 정의를 그대로 센다. */
function bestProduct(A: readonly number[]): {
  value: number;
  range: [number, number];
} {
  let value = A[0] as number;
  let range: [number, number] = [0, 0];
  for (let l = 0; l < A.length; l++) {
    let p = 1;
    for (let r = l; r < A.length; r++) {
      p *= A[r] as number;
      if (p > value) {
        value = p;
        range = [l, r];
      }
    }
  }
  return { value, range };
}

interface Impl {
  kadane(A: number[]): number;
}

/**
 * 두 갈래 중 큰 쪽을 고르는 자리를 **이어 붙이기 하나로** 바꾼 사본. 불변식을 지키던 바로
 * 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const alwaysJoin = await loadMutant<Impl>(REF, {
  swap: [
    /prev = Math\.max\(A\[i\] as number, prev \+ \(A\[i\] as number\)\);/,
    "prev = prev + (A[i] as number);",
  ],
});

/** 두 번째 상태를 `0` 에서 시작하는 사본. */
const bestFromZero = await loadMutant<Impl>(REF, {
  swap: [/let best = A\[0\] as number;/, "let best = 0;"],
});

/** 마지막 칸의 값을 그대로 답으로 내는 사본. */
const returnsLast = await loadMutant<Impl>(REF, {
  swap: [/return best;/, "return prev;"],
});

/** 이어 붙이는 갈래의 덧셈을 곱셈으로 바꾼 사본 — 같은 규칙을 구간 곱에 쓰면 무엇이 나오는가. */
const sameRuleOnProduct = await loadMutant<Impl>(REF, {
  swap: [
    /prev = Math\.max\(A\[i\] as number, prev \+ \(A\[i\] as number\)\);/,
    "prev = Math.max(A[i] as number, prev * (A[i] as number));",
  ],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  A: number[];
}

const NAMED = (A: number[]): Case => ({ name: show(A), A });
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, A: [...WALK] };

/** 「0 을 답으로 채택하는가」를 가르는 목록. 두 후보가 같은 자리에서 갈리므로 함께 쓴다. */
const ZERO_CASES: Case[] = [
  WALK_CASE,
  NAMED([...ALL_NEGATIVE]),
  NAMED([-7]),
  NAMED([-1, 0, -2]),
];

const LAST_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([10, -1, -1, -100]),
  NAMED([...ALL_NEGATIVE]),
  NAMED([7]),
];

const ORDER_CASES: Case[] = [
  WALK_CASE,
  NAMED([-1, -1, 5]),
  NAMED([1, 2, 3]),
  NAMED([7]),
];

const JOIN_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 4, 5]),
  NAMED([...ALL_NEGATIVE]),
  NAMED([10, -1, -1, -100]),
  NAMED([5, -3, 5]),
];

const STATE_CASES: number[][] = [
  [...WALK],
  [1, 2, 3, 4, 5],
  [...ALL_NEGATIVE],
  [10, -1, -1, -100],
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 9, 64, 1000];

/** 규칙으로 만든 입력 — `((k · 37) mod 21) − 10`. 난수가 없어 시드가 없다. */
const ruled = (n: number): number[] =>
  Array.from({ length: n }, (_, k) => ((k * 37) % 21) - 10);

/**
 * 변이가 답을 바꾼 자리가 하나라도 있는지 본다. 하나도 안 바뀌면 「깨진다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다**(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화하면 변이 모듈이
 * 정본 모듈 그 자체라 함수가 같은 객체다 — 그때 던지면 그 블록의 갈림 대조가 한 번도 안 돈다.
 * 손으로 만든 사본(`bestBeforePrev`)은 중화되지 않으므로 `null` 을 넘기고 늘 잰다.
 */
function assertBreaks(mutant: Impl | null, gaps: number[]): void {
  if (mutant !== null && mutant.kadane === kadane) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (A: number[]) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = kadane([...c.A]);
    const got = other([...c.A]);
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

/** 반복 한 바퀴가 고른 갈래. 두 갈래가 같으면 따로 센다. */
function branchOf(r: Round): string | null {
  if (r.joined === null) return null;
  if (r.fresh === r.joined) return "두 갈래가 같음";
  return r.fresh > r.joined ? "새로 시작" : "이어 붙이기";
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 후보의 개수. 작은 입력은 실제로 세고 과제 규모는 식으로 낸다. */
  "concept-count": () => {
    const n = WALK.length;
    let pairs = 0;
    for (let l = 0; l < n; l++) for (let r = l; r < n; r++) pairs++;
    if (pairs !== (n * (n + 1)) / 2) throw new Error("쌍의 개수가 식과 다르다");
    return [
      md(
        ["배열 길이 N", "후보의 개수", "구한 방법"],
        [
          [num(n), num(pairs), "(l, r) 쌍을 실행해서 셌다"],
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
      if (c.adds + c.cmps !== n * (n + 1)) {
        throw new Error(`N = ${n} 에서 센 연산이 N(N+1) 과 다르다`);
      }
      rows.push([
        num(n),
        num(c.adds),
        num(c.adds + c.cmps),
        secondsOf(c.adds + c.cmps),
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
      "쌍 하나마다 덧셈 1 번과 비교 1 번입니다. 실행해서 센 두 규모에서 기본 연산이 N(N+1) 과 정확히 같았습니다.",
    ].join("\n");
  },

  /** `deep.origin` ③ — 작은 입력에서 쌍마다 만든 합과 되풀이되는 덧셈. */
  "origin-repeat": () => {
    const A = WALK.slice(0, 3);
    const rows: string[][] = [];
    let adds = 0;
    for (let l = 0; l < A.length; l++) {
      const sums: string[] = [];
      let s = 0;
      for (let r = l; r < A.length; r++) {
        s += A[r] as number;
        sums.push(`[${l},${r}] = ${s}`);
        adds++;
      }
      rows.push([String(l), dots(sums), String(sums.length)]);
    }
    const last = A.length - 1;
    const ending = endingSums(A, last);
    return [
      md(["왼쪽 끝 l", "만든 합", "덧셈"], rows, [0, 2]),
      "",
      `A = ${show(A)} 에서 덧셈은 모두 ${adds} 번이고, 칸 ${last}${은는(last)} ${A.length} 줄이 저마다 다시 더했습니다. 칸 ${last} 에서 끝나는 합 ${dots(ending)} 중 가장 큰 것은 ${Math.max(...ending)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때 센 덧셈·비교. */
  "cost-two-ways": () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    if (pairs.answer !== carry.answer) throw new Error("두 방식의 답이 다르다");
    const n = WALK.length;
    return [
      md(
        [
          "방식",
          `덧셈 (N = ${n})`,
          `비교 (N = ${n})`,
          `기본 연산 (N = ${n})`,
          `기본 연산 (N = ${num(N_MAX)})`,
        ],
        [
          [
            "모든 (l, r) 쌍의 합을 각각 만든다",
            num(pairs.adds),
            num(pairs.cmps),
            num(pairs.adds + pairs.cmps),
            num(N_MAX * (N_MAX + 1)),
          ],
          [
            "칸마다 직전 결과를 이어받는다",
            num(carry.adds),
            num(carry.cmps),
            num(carry.adds + carry.cmps),
            num(3 * (N_MAX - 1)),
          ],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `두 방식 모두 답은 ${carry.answer} 입니다. 아래 방식은 칸 하나에 덧셈 ${carry.adds / (n - 1)} 번과 비교 ${carry.cmps / (n - 1)} 번을 씁니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 누적이 음수면 0 으로 끊는 후보가 어디서 어긋나는가. */
  "cost-reset-zero": () => {
    const { rows } = contrast(ZERO_CASES, (A) => resetAtZero(A));
    const head = CONTRAST_HEAD("0 으로 끊은 답");
    return [
      md(head, rows, [1, 2]),
      "",
      "틀린 두 줄은 값이 전부 음수인 입력입니다. 0 은 아무 칸도 안 고른 합이라 후보가 아닙니다.",
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — `dp[6]` 하나를 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const r = CANDIDATE_END;
    const sums = endingSums(WALK, r);
    const top = Math.max(...sums);
    const at = sums.indexOf(top);
    return [
      `dp[${r}]  →  오른쪽 끝이 칸 ${r}  →  후보 [0,${r}] … [${r},${r}] ${sums.length} 개`,
      `       →  합 ${sums.join(" ")}  →  가장 큰 합 ${top}, 구간 [${at},${r}]`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 이웃한 두 칸의 최대합 구간이 어떻게 이어지는가. */
  "build-neighbors": () => {
    const rounds = trace(WALK);
    const rows: string[][] = [];
    const restarts: number[] = [];
    for (const r of rounds.slice(1)) {
      const before = rounds[r.i - 1] as Round;
      const restart = r.start === r.i;
      if (restart) restarts.push(r.i);
      else if (r.start !== before.start) {
        throw new Error(`칸 ${r.i} 의 구간이 앞 칸의 구간을 잇지 않는다`);
      }
      rows.push([
        String(r.i),
        `${span([before.start, r.i - 1])} = ${before.prev}`,
        `${span([r.start, r.i])} = ${r.prev}`,
        restart ? `칸 ${r.i} 하나로 새로 시작` : `칸 ${r.i}${을를(r.i)} 붙임`,
      ]);
    }
    return [
      md(
        ["i", "dp[i−1] 의 구간", "dp[i] 의 구간", "두 구간의 관계"],
        rows,
        [0],
      ),
      "",
      `${rows.length} 쌍 모두 dp[i] 의 구간이 dp[i−1] 의 구간에 칸 i 를 붙인 것이거나 칸 i 하나입니다. 새로 시작한 칸은 ${dots(restarts)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 「칸 i 까지의 최댓값」은 직전 값만으로 이어지지 않는다. */
  "build-confuse": () => {
    const pair = [
      [5, -1, 3],
      [5, -9, 3],
    ];
    const rows = pair.map((A) => {
      const rounds = trace(A);
      const r1 = rounds[1] as Round;
      const r2 = rounds[2] as Round;
      return [
        show(A),
        String(r1.best),
        String(A[2]),
        String(r2.best),
        span(r2.bestRange),
        String(r2.prev),
      ];
    });
    const [a, b] = rows as [string[], string[]];
    if (a[1] !== b[1] || a[2] !== b[2] || a[3] === b[3]) {
      throw new Error("두 입력이 보이려는 모양이 아니다");
    }
    const [, best1, a2, x, , dx] = a as string[];
    const [, , , y, , dy] = b as string[];
    return [
      md(
        ["입력", "best[1]", "A[2]", "best[2]", "best[2] 의 구간", "dp[2]"],
        rows,
        [1, 2, 3, 5],
      ),
      "",
      `두 입력은 best[1] = ${best1}${과와(best1 as string)} A[2] = ${a2}${이가(a2 as string)} 같은데 best[2] 는 ${x}${과와(x as string)} ${y}${으로(y as string)} 나뉩니다. 칸 2 에서 끝나는 최대합 dp[2] 는 ${dx}${과와(dx as string)} ${dy} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 첫 칸에서 두 상태가 무엇인가. */
  "build-first": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "후보", "값"],
      [
        ["칸 0 에서 끝나는 최대합 dp[0]", "[0,0] 하나", String(r.prev)],
        ["칸 0 까지의 최댓값 best", "[0,0] 하나", String(r.best)],
      ],
      [2],
    );
  },

  /** `deep.build` 2단계 — 쉬운 경우와 불안한 경우를 갈래마다 값으로. */
  "build-cases": () => {
    const rounds = trace(WALK);
    const groups: [string, (b: Round, r: Round) => boolean][] = [
      ["dp[i−1] 이 음수", (b) => b.prev < 0],
      [
        "dp[i−1] 이 양수 · A[i] 가 0 이상",
        (b, r) => b.prev > 0 && r.fresh >= 0,
      ],
      ["dp[i−1] 이 양수 · A[i] 가 음수", (b, r) => b.prev > 0 && r.fresh < 0],
    ];
    const rows: string[][] = [];
    const cells: number[][] = [];
    for (const [name, pick] of groups) {
      const hit: number[] = [];
      for (const r of rounds.slice(1)) {
        const b = rounds[r.i - 1] as Round;
        if (!pick(b, r)) continue;
        hit.push(r.i);
        rows.push([
          name,
          String(r.i),
          String(b.prev),
          String(r.fresh),
          String(r.fresh),
          `${paren(b.prev)} + ${paren(r.fresh)} = ${r.joined}`,
          branchOf(r) ?? "—",
        ]);
      }
      cells.push(hit);
    }
    const covered = cells.flat().length;
    if (covered !== WALK.length - 1) {
      throw new Error("세 경우가 반복의 칸을 빠짐없이 덮지 않는다");
    }
    const [neg, , negA] = cells as [number[], number[], number[]];
    return [
      md(
        ["경우", "i", "dp[i−1]", "A[i]", "새로 시작", "이어 붙이기", "큰 쪽"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `반복의 ${covered} 칸이 세 경우에 빠짐없이 들어갑니다. 새로 시작한 칸은 dp[i−1] 이 음수인 ${dots(neg)} 뿐이고, A[i] 가 음수인 ${dots(negA)} 에서도 이어 붙였습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — dp 줄과 best 줄, best 가 커진 칸. */
  "build-best": () => {
    const rounds = trace(WALK);
    const grew = rounds
      .filter((r, k) => k === 0 || r.best > (rounds[k - 1] as Round).best)
      .map((r) => r.i);
    const last = rounds[rounds.length - 1] as Round;
    const top = Math.max(...rounds.map((r) => r.prev));
    if (top !== last.best) throw new Error("dp 의 최댓값이 best 와 다르다");
    return [
      md(
        ["줄", `칸 0 부터 칸 ${WALK.length - 1} 까지`],
        [
          ["dp", show(rounds.map((r) => r.prev))],
          ["best", show(rounds.map((r) => r.best))],
          ["best 가 커진 칸", dots(grew)],
        ],
      ),
      "",
      `마지막 칸의 dp 는 ${last.prev} 이고 best 는 ${last.best} 입니다. dp ${rounds.length} 칸의 최댓값 ${top}${이가(top)} best 의 마지막 값입니다.`,
    ].join("\n");
  },

  /** `deep.build` 전제 — 같은 규칙을 구간 곱에 쓰면 곱의 최댓값을 놓친다. */
  "premise-product": () => {
    const inputs = [
      [2, 3, 4],
      [-2, 3, -4],
      [-1, -2, -3],
    ];
    const rows = inputs.map((A) => {
      const truth = bestProduct(A);
      return [
        show(A),
        span(truth.range),
        String(truth.value),
        String(sameRuleOnProduct.kadane([...A])),
      ];
    });
    return [
      md(
        ["입력", "곱이 가장 큰 구간", "그 곱", "같은 규칙으로 곱한 값"],
        rows,
        [2, 3],
      ),
      "",
      "음수가 섞인 아래 두 입력에서, 같은 규칙으로 곱한 값이 곱의 최댓값보다 작습니다.",
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 들고 가는 상태의 칸 수를 네 값으로 두고 답을 대조한다. */
  "state-size": () => {
    const heads = ["칸 0 개", "칸 1 개", "칸 2 개", "칸 N 개"];
    const impls = [biggestElement, lastCellOnly, kadane, dpArray];
    const wrong = [0, 0, 0, 0];
    const rows = STATE_CASES.map((A) => {
      const bare = kadane([...A]);
      const cells = impls.map((f, k) => {
        const got = f([...A]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [show(A), String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(N_MAX)} 에서 쓰는 칸`,
      "",
      "1",
      "1",
      "2",
      num(N_MAX),
    ]);
    const ok = wrong
      .map((w, k) => (w === 0 ? (heads[k] as string) : null))
      .filter((h) => h !== null);
    return [
      md(["입력", "정답", ...heads], rows, [1, 2, 3, 4, 5]),
      "",
      `칸 하나 이하인 두 후보는 어긋나는 입력이 남고, 어긋난 입력이 0 개인 것은 ${ok.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const A = [${WALK.join(", ")}];`,
      `// 이 절이 끝나면 ${kadane([...WALK])}${이가(kadane([...WALK]))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 두 줄만 실행했을 때의 두 상태. */
  "walk-init": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "값", "뜻"],
      [
        ["prev", String(r.prev), "칸 0 에서 끝나는 최대합"],
        ["best", String(r.best), "칸 0 까지의 답"],
      ],
      [1],
    );
  },

  /** `deep.walk.pause` — 두 번째 상태를 0 에서 시작하면 무엇이 달라지는가. */
  "pause-best-zero": () => {
    const { rows, gaps } = contrast(ZERO_CASES, (A) => bestFromZero.kadane(A));
    assertBreaks(bestFromZero, gaps);
    return [
      md(CONTRAST_HEAD("0 에서 시작한 답"), rows, [1, 2]),
      "",
      "양수가 하나라도 있는 입력에서는 답이 그대로이고, 전부 음수인 입력에서만 0 이 나옵니다.",
    ].join("\n");
  },

  /** `deep.walk` 2 — 반복 앞 세 바퀴의 상태. */
  "walk-first-three": () => {
    const rounds = trace(WALK);
    const rows = rounds.slice(1, 4).map((r) => {
      const b = rounds[r.i - 1] as Round;
      return [
        `T${r.i + 1}`,
        String(r.i),
        String(r.fresh),
        String(r.fresh),
        `${paren(b.prev)} + ${paren(r.fresh)} = ${r.joined}`,
        String(r.prev),
        String(r.best),
      ];
    });
    const t3 = rounds[2] as Round;
    return [
      md(
        ["걸음", "i", "A[i]", "새로 시작", "이어 붙이기", "prev", "best"],
        rows,
        [1, 2, 3, 5, 6],
      ),
      "",
      `T3 에서 prev 는 ${t3.prev}${으로(t3.prev)} 내려갔지만 best 는 ${t3.best} 그대로입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 마지막 칸의 값을 답으로 내면 무엇이 달라지는가. */
  "pause-answer-last": () => {
    const { rows, gaps } = contrast(LAST_CASES, (A) => returnsLast.kadane(A));
    assertBreaks(returnsLast, gaps);
    return [
      md(CONTRAST_HEAD("마지막 칸의 값"), rows, [1, 2]),
      "",
      "답이 마지막 칸에서 끝나는 입력에서는 답이 그대로이고, 답이 배열 가운데에서 끝나면 값이 바뀝니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — 답이 앞에서 끝나는 입력의 칸마다 끝나는 최대합. */
  "pause-last-cells": () => {
    const A = [10, -1, -1, -100];
    const rounds = trace(A);
    const last = rounds[rounds.length - 1] as Round;
    return [
      md(
        ["칸 i", "A[i]", "dp[i]", "dp[i] 의 구간"],
        rounds.map((r) => [
          String(r.i),
          String(r.fresh),
          String(r.prev),
          span([r.start, r.i]),
        ]),
        [0, 1, 2],
      ),
      "",
      `답 ${last.best}${은는(last.best)} 구간 ${span(last.bestRange)} 에서 나오고, 마지막 칸의 dp 는 ${last.prev} 입니다.`,
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
        String(first.fresh),
        "—",
        "—",
        "—",
        String(first.prev),
        String(first.best),
      ],
    ];
    for (const r of rounds.slice(1)) {
      const b = rounds[r.i - 1] as Round;
      rows.push([
        `T${r.i + 1}`,
        String(r.i),
        `\`${r.i} < ${n}\` 참`,
        String(r.fresh),
        String(r.fresh),
        String(r.joined),
        branchOf(r) ?? "—",
        String(r.prev),
        r.best > b.best ? `**${r.best}**` : String(r.best),
      ]);
    }
    const last = rounds[rounds.length - 1] as Round;
    rows.push([
      `T${n + 1}`,
      String(n),
      `\`${n} < ${n}\` 거짓`,
      "—",
      "—",
      "—",
      "—",
      String(last.prev),
      String(last.best),
    ]);
    const lastGrow = rounds.reduce(
      (at, r, k) => (k > 0 && r.best > (rounds[k - 1] as Round).best ? k : at),
      0,
    );
    return [
      md(
        [
          "걸음",
          "i",
          "반복 조건",
          "A[i]",
          "새로 시작",
          "이어 붙이기",
          "고른 갈래",
          "prev",
          "best",
        ],
        rows,
        [1, 3, 4, 5, 7, 8],
      ),
      "",
      `굵게 적은 값이 best 가 커진 걸음입니다. 마지막으로 커진 걸음은 T${lastGrow + 1} 이고, T${n + 1} 에서 ${last.best}${을를(last.best)} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` — 네 갈래가 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const rounds = trace(WALK);
    const n = WALK.length;
    const loop = rounds.slice(1);
    const T = (r: Round) => `T${r.i + 1}`;
    const fresh = loop.filter((r) => branchOf(r) === "새로 시작").map(T);
    const join = loop.filter((r) => branchOf(r) === "이어 붙이기").map(T);
    const grew = loop
      .filter((r) => r.best > (rounds[r.i - 1] as Round).best)
      .map(T);
    const kept = loop
      .filter((r) => r.best === (rounds[r.i - 1] as Round).best)
      .map(T);
    return md(
      ["갈래", "실행된 걸음"],
      [
        ["① 두 상태를 첫 칸의 값으로", "T1"],
        [`② 반복 조건 i < ${n}`, `T2~T${n} 에서 참 · T${n + 1} 에서 거짓`],
        [
          "③ 갈래 고르기",
          `새로 시작 ${fresh.join(" ")} · 이어 붙이기 ${join.join(" ")}`,
        ],
        [
          "④ 최댓값 갱신",
          `값이 커진 걸음 ${grew.join(" ")} · 그대로인 걸음 ${kept.join(" ")}`,
        ],
      ],
    );
  },

  /** `deep.walk.step` — 돌려준 값이 정말 그 구간의 합인가. */
  "walk-check-sum": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [from, to] = last.bestRange;
    const vals = WALK.slice(from, to + 1);
    const sum = vals.reduce((s, x) => s + x, 0);
    if (sum !== last.best) throw new Error("구간의 합이 best 와 다르다");
    return md(
      [
        "best 를 만든 구간",
        "그 칸들의 값",
        "직접 더한 합",
        `T${WALK.length + 1} 이 돌려준 값`,
      ],
      [
        [
          span(last.bestRange),
          dots(vals),
          `${vals.map(paren).join(" + ")} = ${sum}`,
          String(kadane([...WALK])),
        ],
      ],
      [3],
    );
  },

  /** `deep.walk.pause` — 두 줄의 순서를 맞바꾸면 무엇이 달라지는가. */
  "pause-swap-order": () => {
    const { rows, gaps } = contrast(
      ORDER_CASES,
      (A) => bestBeforePrev(A).answer,
    );
    assertBreaks(null, gaps);
    return [
      md(CONTRAST_HEAD("순서를 바꾼 답"), rows, [1, 2]),
      "",
      "전개 입력은 답이 그대로입니다. 최댓값이 칸 6 에서 만들어져서, 마지막 한 걸음의 차례가 바뀌어도 그 값이 남습니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — `[-1 -1 5]` 에서 두 순서의 바퀴별 상태. */
  "pause-swap-trace": () => {
    const A = [-1, -1, 5];
    const right = trace(A);
    const swapped = bestBeforePrev(A);
    const rows = right.map((r, k) => {
      const s = swapped.rounds[k] as { prev: number; best: number };
      return [
        String(r.i),
        String(r.prev),
        String(r.best),
        String(s.prev),
        String(s.best),
      ];
    });
    const lastRight = right[right.length - 1] as Round;
    return [
      md(
        [
          "칸 i",
          "정본 prev",
          "정본 best",
          "순서를 바꾼 prev",
          "순서를 바꾼 best",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `마지막 칸에서 두 코드 모두 prev 가 ${lastRight.prev}${이가(lastRight.prev)} 됩니다. 정본은 그 값을 best 에 넣어 ${lastRight.best}${을를(lastRight.best)} 돌려주고, 순서를 바꾼 코드는 그 값을 보기 전에 반복이 끝나 ${swapped.answer}${을를(swapped.answer)} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  "final-calls": () => {
    const calls = [
      [...WALK],
      [1, 2, 3, 4, 5],
      [...ALL_NEGATIVE],
      [10, -1, -1, -100],
      [-7],
    ];
    const heads = calls.map((A) => `kadane([${A.join(", ")}])`);
    const w = Math.max(...heads.map(width));
    return calls
      .map(
        (A, k) => `${padRight(heads[k] as string, w)}   →  ${kadane([...A])}`,
      )
      .join("\n");
  },

  /** `related` — 걸음마다 그때까지 받은 값만으로 답이 이미 나와 있는가. */
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
          "그때까지 받은 값",
          "그 걸음의 best",
          "받은 값만으로 모든 쌍을 센 답",
        ],
        rows,
        [2, 3],
      ),
      "",
      `${rows.length} 걸음 모두 오른쪽 두 열의 값이 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의 셋을 작은 값에 넣는다. */
  "math-check": () => {
    const S = (l: number, r: number) => WALK.slice(l, r + 1);
    const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);
    const r = CANDIDATE_END;
    const ending = endingSums(WALK, r);
    const terms = (xs: readonly number[]) => xs.map(paren).join(" + ");
    return md(
      ["정의", "값에 넣은 식", "값"],
      [
        ["S(3, 6)", terms(S(3, 6)), String(sum(S(3, 6)))],
        ["S(0, 2)", terms(S(0, 2)), String(sum(S(0, 2)))],
        [
          `dp[${r}]`,
          `max(S(0,${r}), …, S(${r},${r})) = max(${ending.join(", ")})`,
          String(Math.max(...ending)),
        ],
      ],
      [2],
    );
  },
  /** `deep.math` ② — 누적합으로 세운 정의를 작은 값에 넣어 확인한다. */
  "math-prefix": () => {
    const P = prefixSums(WALK);
    const rows: string[][] = [];
    for (const i of [0, 3, 6, 8]) {
      const lo = Math.min(...P.slice(0, i + 1));
      const at = P.indexOf(lo);
      rows.push([
        String(i),
        String(P[i + 1]),
        String(lo),
        String(at),
        String((P[i + 1] as number) - lo),
      ]);
    }
    return [
      md(
        ["칸 번호 j", ...P.map((_, j) => String(j))],
        [["P[j]", ...P.map(String)]],
        P.map((_, j) => j + 1),
      ),
      "",
      "그 누적합으로 네 칸의 dp[i] 를 구하면 이렇습니다.",
      "",
      md(
        ["i", "P[i+1]", "앞쪽 최솟값", "그 최솟값의 j", "P[i+1] − 앞쪽 최솟값"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `P[4] = ${WALK.slice(0, 4).map(paren).join(" + ")} = ${P[4]} 은 칸 3 까지만 더한 값입니다. 칸 3 부터는 앞쪽 최솟값이 P[3] = ${Math.min(...P.slice(0, 9))} 하나로 고정되고, 가장 큰 차이는 칸 6 의 ${kadane([...WALK])} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const A = ruled(n);
      const pairs = byAllPairs(A);
      const carry = byCarrying(A);
      if (pairs.answer !== carry.answer)
        throw new Error("두 방식의 답이 다르다");
      let spans = 0;
      for (let l = 0; l < n; l++) for (let r = l; r < n; r++) spans++;
      return [
        num(n),
        num(spans),
        num(pairs.adds + pairs.cmps),
        num(n * (n + 1)),
        num(carry.adds + carry.cmps),
        num(3 * n - 3),
      ];
    });
    const n = N_MAX;
    return [
      md(
        [
          "N",
          "부분 배열 수(실측)",
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

  /** `invariant` ② — 걸음마다 두 문장이 정의로 센 값과 같은가. */
  "invariant-hold": () => {
    const rounds = trace(WALK);
    const rows = rounds.map((r) => {
      const byDef = Math.max(...endingSums(WALK, r.i));
      const answer = byAllPairs(WALK.slice(0, r.i + 1)).answer;
      return [
        `T${r.i + 1}`,
        String(r.i),
        String(r.prev),
        String(byDef),
        String(r.best),
        String(answer),
      ];
    });
    return [
      md(
        [
          "걸음",
          "칸 i",
          "prev",
          "정의로 센 dp[i]",
          "best",
          "칸 i 까지 모든 쌍을 센 답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 걸음 모두 prev 가 정의로 센 dp[i] 와, best 가 모든 쌍을 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. 반복 횟수와 고른 갈래를 실행에서 센다. */
  "invariant-edges": () => {
    const inputs: [string, number[]][] = [
      ["칸이 하나", [7]],
      ["칸이 둘", [3, -5]],
      ["값이 전부 음수", [-9, -3, -7, -1, -5]],
      ["값이 전부 양수", [1, 2, 3, 4, 5]],
      ["값이 전부 0", [0, 0, 0]],
      ["값이 전부 10,000 인 1,000 칸", new Array<number>(1000).fill(10_000)],
    ];
    const rows = inputs.map(([name, A]) => {
      const loop = trace(A).slice(1);
      const parts = ["새로 시작", "이어 붙이기", "두 갈래가 같음"]
        .map((b) => [b, loop.filter((r) => branchOf(r) === b).length] as const)
        .filter(([, c]) => c > 0)
        .map(([b, c]) => `${b} ${num(c)}`);
      const shown = A.length > 8 ? name : `${name} ${show(A)}`;
      return [
        shown,
        num(loop.length),
        parts.length === 0 ? "—" : dots(parts),
        num(kadane([...A])),
        num(byAllPairs(A).answer),
      ];
    });
    return [
      md(
        ["입력", "반복 횟수", "고른 갈래", "정본의 답", "모든 쌍을 센 답"],
        rows,
        [1, 3, 4],
      ),
      "",
      `${rows.length} 입력 모두 정본의 답이 모든 쌍을 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 갈래를 고르지 않고 이어 붙이기만 하면 무엇이 나오는가. */
  "mutant-always-join": () => {
    const { rows, gaps } = contrast(JOIN_CASES, (A) => alwaysJoin.kadane(A));
    assertBreaks(alwaysJoin, gaps);
    return [
      md(CONTRAST_HEAD("이어 붙이기만 한 답"), rows, [1, 2]),
      "",
      "갈래를 안 고르면 prev 가 「칸 i 에서 끝나는 최대합」이 아니라 「칸 0 부터 칸 i 까지의 합」이 됩니다.",
    ].join("\n");
  },

  /** `invariant` ③ — 전개 입력에서 이어 붙이기만 한 답이 어디서 왔는가. */
  "mutant-join-gap": () => {
    const P = prefixSums(WALK).slice(1);
    const top = Math.max(...P);
    const at = P.indexOf(top);
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [from, to] = last.bestRange;
    const head = WALK.slice(0, from).reduce((s, x) => s + x, 0);
    // 이어 붙이기만 하면 prev 가 누적합이 된다는 말을 변이의 답으로 확인한다(중화 실행에서는 건너뛴다).
    if (alwaysJoin.kadane !== kadane && alwaysJoin.kadane([...WALK]) !== top) {
      throw new Error("이어 붙이기만 한 답이 누적합의 최댓값과 다르다");
    }
    return md(
      ["값", "크기", "출처"],
      [
        ["칸마다의 prev", show(P), "칸 0 부터 칸 i 까지의 합"],
        ["그 최댓값", String(top), `구간 ${span([0, at])} 의 합`],
        ["정본의 답", String(last.best), `구간 ${span([from, to])} 의 합`],
        [
          "두 값의 차이",
          String(last.best - top),
          `앞부분 ${span([0, from - 1])} 의 합 ${head}${을를(head)} 버리지 못한 만큼`,
        ],
      ],
      [1],
    );
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 덧셈과 비교가 드는가. */
  "perf-count": () => {
    const carry = byCarrying(WALK);
    const n = WALK.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "순회",
        `T2~T${n}`,
        String(n - 1),
        String(carry.adds / (n - 1)),
        String(carry.cmps / (n - 1)),
        String(carry.adds + carry.cmps),
      ],
      ["반환", `T${n + 1}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(carry.adds + carry.cmps)],
    ];
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 덧셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        [2, 3, 4, 5],
      ),
      "",
      `덧셈 ${carry.adds} 번과 비교 ${carry.cmps} 번이고, 둘 다 칸 수 ${n} 에서만 나온 수입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 총식을 두 규모에서 실행과 대조한다. */
  "perf-total": () => {
    const rows = [WALK.length, N_MAX].map((n) => {
      const A = n === WALK.length ? [...WALK] : ruled(n);
      const c = byCarrying(A);
      if (c.adds + c.cmps !== 3 * (n - 1))
        throw new Error("총식이 실측과 다르다");
      return [num(n), num(c.adds + c.cmps), num(3 * (n - 1))];
    });
    return [
      md(["N", "센 기본 연산", "3(N − 1)"], rows, [0, 1, 2]),
      "",
      "두 규모 모두 센 값이 3(N − 1) 과 같습니다.",
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1000;
    const shapes: [string, number[]][] = [
      ["전부 10,000", Array.from({ length: n }, () => 10_000)],
      ["전부 -10,000", Array.from({ length: n }, () => -10_000)],
      [
        "10,000 과 -10,000 이 번갈아",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 10_000 : -10_000)),
      ],
      [
        "마지막 한 칸만 10,000 · 나머지는 0",
        Array.from({ length: n }, (_, k) => (k === n - 1 ? 10_000 : 0)),
      ],
    ];
    const rows = shapes.map(([name, A]) => {
      const carry = byCarrying(A);
      return [
        name,
        num(carry.adds),
        num(carry.cmps),
        num(carry.adds + carry.cmps),
        num(carry.answer),
      ];
    });
    return [
      md(
        [`입력의 모양 (N = ${num(n)})`, "덧셈", "비교", "기본 연산", "답"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      "가운데 세 열은 네 줄 모두 값이 같고, 오른쪽 열만 다릅니다.",
    ].join("\n");
  },

  /** `perf.worst` — 재는 것마다 최악을 만드는 입력과 그 값. */
  "worst-axes": () => {
    const ops = byCarrying(new Array<number>(N_MAX).fill(-10_000));
    const big = new Array<number>(N_MAX).fill(10_000);
    return md(
      ["최악으로 만들 것", "입력", "값"],
      [
        [
          "기본 연산 수",
          `N = ${num(N_MAX)}, 값은 무엇이든`,
          num(ops.adds + ops.cmps),
        ],
        ["추가 칸", "어떤 입력이든", "2"],
        ["답의 크기", `10,000 이 ${num(N_MAX)} 칸`, num(kadane(big))],
      ],
      [2],
    );
  },

  /** `selfcheck` — 전개의 T8. */
  "selfcheck-t8": () => {
    const rounds = trace(WALK);
    const r = rounds[7] as Round;
    const b = rounds[6] as Round;
    return `T8   A[7] = ${r.fresh}   두 갈래 ${r.fresh}${과와(r.fresh)} ${r.joined}   prev = ${b.prev} → ${r.prev}   best = ${r.best} 그대로`;
  },

  /** `purpose.alt` — `bench-alt` 가 낸 계수를 표로. */
  "alt-table": () => {
    const mine = benchCases["칸마다 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const points = [0, 28, 29, 1024];
    const rows = points.map((p) => {
      const key = `질의 ${num(p)} 회 기본 연산`;
      const a = mine[key] as number;
      const b = other[key] as number;
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
    return [
      md(
        ["섞인 질의", "칸마다 이어받기", "세그먼트 트리", "적은 쪽"],
        rows,
        [1, 2],
      ),
      "",
      `추가 칸은 ${num(mine["추가 칸"] as number)} 개 대 ${num(other["추가 칸"] as number)} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 뒤집히는 자리를 계수에서 낸다. */
  "alt-boundary": () => {
    const mine = benchCases["칸마다 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const perQuery = mine["질의 0 회 기본 연산"] as number;
    const fixed = other["질의 0 회 기본 연산"] as number;
    const build = 8 * (BENCH_N - 1);
    const updates = 8 * BENCH_U * Math.log2(BENCH_N);
    if (build + updates !== fixed) {
      throw new Error("세그먼트 트리의 계수가 세우기와 갱신으로 나뉘지 않는다");
    }
    if ((mine["질의 28 회 기본 연산"] as number) !== 29 * perQuery) {
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
          `${num(fixed)} ÷ ${num(perQuery)} ≈ ${(fixed / perQuery).toFixed(1)}`,
        ],
      ],
    );
  },
};
