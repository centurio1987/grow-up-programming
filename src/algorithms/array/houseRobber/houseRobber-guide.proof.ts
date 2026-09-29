/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/houseRobber/houseRobber-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as BENCH_N,
  U as BENCH_U,
  cases as benchCases,
} from "./houseRobber-guide.alt.ts";
import {
  ALTERNATING_BREAK,
  admissible,
  byAllSubsets,
  byAlternating,
  byCarrying,
  byGreedy,
  CANDIDATE_END,
  CASH_MAX,
  defined,
  digits,
  GREEDY_BREAK,
  N_MAX,
  num,
  type Round,
  setText,
  show,
  sumOf,
  trace,
  WALK,
} from "./houseRobber-guide.fig.tsx";
import { houseRobber } from "./houseRobber-guide.ref.ts";

const REF = new URL("./houseRobber-guide.ref.ts", import.meta.url).pathname;

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

/** 첨자 — 음수는 유니코드 빼기 표로 적는다(`dp[−1]`). */
const idx = (i: number): string => (i < 0 ? `−${-i}` : String(i));

/** 칸 번호 목록 — `1 · 3`. */
const dots = (xs: readonly (number | string)[]): string => xs.join(" · ");

/* ────────────────────────── 규모 ────────────────────────── */

/** 부분집합을 다 만드는 방법의 규모를 실제로 잴 수 있는 지점들. */
const NAIVE_SCALE = [6, 12, 18];

/** 메모 없는 재귀의 호출 수를 실제로 잴 수 있는 지점들. */
const RECURSION_SCALE = [6, 12, 18, 24];

/** 재귀 깊이를 시험하는 두 규모. 가운데 크기는 넣지 않는다 — 임계값이 실행 환경에 달렸다. */
const DEPTH_SCALE = [1000, N_MAX];

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/** 규칙으로 만든 배열 — 규모 실측에 쓴다. */
const ruled = (n: number): number[] =>
  Array.from({ length: n }, (_, k) => ((k * 37) % 97) + 1);

/* ────────────────────────── 계측기와 후보 ────────────────────────── */

/** 부분집합을 다 만들 때 **칸 하나를 검사한 횟수**만 센다 — 닫힌 형태가 `N·2^N` 이다. */
function subsetChecks(n: number): number {
  let checks = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    for (let i = 0; i < n; i++) {
      checks++;
      void (mask & (1 << i));
    }
  }
  return checks;
}

/** 칸 `i` 를 반드시 고른 최대 합 `g[i]` — 정의를 그대로 센다(헷갈리기 쉬운 모양). */
function mustTake(A: readonly number[], i: number): number {
  let best = Number.NEGATIVE_INFINITY;
  for (const s of admissible(i)) {
    if (s.includes(i)) best = Math.max(best, sumOf(A, s));
  }
  return best;
}

/**
 * `k` 칸 앞의 답을 이어받는 방식. `k = 2` 가 정본이고, 나머지는 이어받는 칸 수를 바꿔 본 것이다.
 * `dp` 를 칸마다 실제로 저장해 앞쪽 값을 읽는다.
 */
function carrySpan(A: readonly number[], k: number): number {
  const n = A.length;
  if (n === 0) return 0;
  const dp = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const skip = i >= 1 ? (dp[i - 1] as number) : 0;
    const from = i - k >= 0 ? (dp[i - k] as number) : 0;
    dp[i] = Math.max(skip, from + (A[i] as number));
  }
  return dp[n - 1] as number;
}

/**
 * 메모 없는 재귀에서 물음 하나가 몇 번 불렸는가. 갈래를 다 펴지 않고 위에서 아래로 배수를 더해
 * 센다.
 */
function callMultiplicity(n: number): { at: number[]; empty: number } {
  const mult = new Array<number>(n).fill(0);
  mult[n - 1] = 1;
  let empty = 0;
  for (let i = n - 1; i >= 0; i--) {
    const m = mult[i] as number;
    for (const j of [i - 1, i - 2]) {
      if (j >= 0) mult[j] = (mult[j] as number) + m;
      else empty += m;
    }
  }
  return { at: mult, empty };
}

/** 메모를 안 붙인 재귀가 자기 자신을 몇 번 부르는가. */
function recursionCalls(n: number): number {
  const seen = new Map<number, number>();
  const count = (i: number): number => {
    if (i < 0) return 1;
    const hit = seen.get(i);
    if (hit !== undefined) return hit;
    const v = 1 + count(i - 1) + count(i - 2);
    seen.set(i, v);
    return v;
  };
  return count(n - 1);
}

/** 메모를 붙인 재귀. 깊이가 칸 수만큼이라 큰 입력에서 실행되지 않는다. */
function byMemoRecursion(A: readonly number[]): number {
  const memo = new Array<number>(A.length).fill(-1);
  const rec = (i: number): number => {
    if (i < 0) return 0;
    const hit = memo[i] as number;
    if (hit !== -1) return hit;
    const v = Math.max(rec(i - 1), rec(i - 2) + (A[i] as number));
    memo[i] = v;
    return v;
  };
  return rec(A.length - 1);
}

/** 빈 선택까지 후보로 센 정의의 답 — 음수가 섞인 입력의 기준이다. */
const byDefinition = (A: readonly number[]): number =>
  A.length === 0 ? 0 : defined(A, A.length - 1);

/** 피보나치 수 — `F(0) = 0`, `F(1) = 1`. 과제 규모에서 자릿수가 2 만을 넘어 배가 공식으로 낸다. */
function fibPair(n: number): [bigint, bigint] {
  if (n === 0) return [0n, 1n];
  const [a, b] = fibPair(Math.floor(n / 2));
  const c = a * (2n * b - a);
  const d = a * a + b * b;
  return n % 2 === 0 ? [c, d] : [d, c + d];
}

const fib = (n: number): bigint => fibPair(n)[0];

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  houseRobber(nums: number[]): number;
}

/** 칸 `i` 를 고른 답을 **옆 칸까지 담은 답**에서 이어받는 사본. */
const adjacentAllowed = await loadMutant<Impl>(REF, {
  swap: [
    /const take = prev \+ \(nums\[i\] as number\);/,
    "const take = cur + (nums[i] as number);",
  ],
});

/** 두 값을 옮기는 줄을 잃은 사본. 불변식의 `prev` 절반을 지키던 바로 그 줄이다. */
const prevFrozen = await loadMutant<Impl>(REF, {
  drop: /^\s*prev = cur;$/,
});

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「깨진다」가 거짓이다. **중화 실행에서는 건너뛴다**(SPEC §0
 * 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화하면 변이 모듈이 정본을 그대로 돌려주므로, 변이의
 * 함수가 정본과 같은 객체인지로 알아낸다. 손으로 만든 후보는 `null` 을 넘기고 늘 잰다.
 */
function assertBreaks(mutant: Impl | null, gaps: number[]): void {
  if (mutant !== null && mutant.houseRobber === houseRobber) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  A: number[];
}

const NAMED = (A: readonly number[]): Case => ({ name: show(A), A: [...A] });
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, A: [...WALK] };

const ALTERNATING_CASES: Case[] = [
  WALK_CASE,
  NAMED(ALTERNATING_BREAK),
  NAMED([1, 3, 1, 3, 1, 3]),
  NAMED([1, 2, 3, 1]),
];

const GREEDY_CASES: Case[] = [
  WALK_CASE,
  NAMED(GREEDY_BREAK),
  NAMED([5, 6, 5, 6, 5]),
  NAMED([1, 2, 3, 1]),
];

const ADJACENT_CASES: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 1]),
  NAMED([2, 7]),
  NAMED([5]),
  NAMED([0, 0, 0]),
];

const PREV_CASES: Case[] = [
  WALK_CASE,
  NAMED([2, 1, 1, 2]),
  NAMED([5, 5, 5, 5, 5]),
  NAMED([1, 3, 1]),
  NAMED([2, 7]),
];

const SPAN_CASES: number[][] = [
  [...WALK],
  [1, 2, 3, 1],
  [2, 1, 1, 2],
  [5, 5, 5, 5, 5],
];

const RECURSION_SAME: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 1]),
  NAMED([5, 5, 5, 5, 5]),
];

const NEGATIVE_CASES: number[][] = [[-5], [-2, -1, -3], [3, -1, 4], [-4, 6]];

/** 불변식이 경계에서도 유지되는지 값으로 본다. */
const EDGE_CASES: [string, number[]][] = [
  ["칸이 하나도 없다", []],
  ["칸이 하나다", [7]],
  ["칸이 둘이다", [2, 7]],
  ["값이 전부 0 이다", [0, 0, 0]],
  ["값이 전부 같다", [5, 5, 5, 5, 5]],
  ["가운데 하나만 크다", [1, 3, 1]],
  ["최댓값 둘이 이어져 있다", [CASH_MAX, CASH_MAX]],
  ["최댓값 둘이 떨어져 있다", [CASH_MAX, 1, CASH_MAX]],
  ["답이 마지막 칸을 안 고른다", [1, 10, 1, 1]],
];

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (A: number[]) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = houseRobber([...c.A]);
    const got = other([...c.A]);
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

/** 반복 한 바퀴가 고른 갈래. */
function branchOf(r: Round): string | null {
  if (r.skip === null || r.take === null) return null;
  if (r.skip === r.take) return "두 답이 같다";
  return r.take > r.skip ? "고른다" : "건너뛴다";
}

const ROUNDS = trace(WALK);

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 전개 입력에서 고를 수 있는 선택 몇 가지와, 정의대로 센 답. */
  "concept-examples": () => {
    const all = admissible(WALK.length - 1);
    const best = Math.max(...all.map((s) => sumOf(WALK, s)));
    const shown: (readonly number[])[] = [[0, 2, 5], [1, 3, 5], [2, 5], []];
    const rows = shown.map((s) => {
      if (!all.some((t) => setText(t) === setText(s))) {
        throw new Error(`${setText(s)} 는 고를 수 있는 선택이 아니다`);
      }
      const sum = sumOf(WALK, s);
      return [
        setText(s),
        s.length === 0 ? "—" : dots(s.map((k) => WALK[k] as number)),
        String(sum),
        sum === best ? "가장 크다" : "",
      ];
    });
    rows.push([
      "{2, 3}",
      dots([WALK[2] as number, WALK[3] as number]),
      "—",
      "칸 2 와 칸 3 이 이웃이라 고를 수 없다",
    ]);
    return [
      md(["고른 칸", "그 칸의 값", "합", "비고"], rows, [2]),
      "",
      `이웃한 두 칸을 함께 담지 않는 선택은 빈 선택까지 ${all.length} 가지이고, 그 가운데 가장 큰 합은 ${best} 입니다. 정본 houseRobber(${show(WALK)}) 가 낸 값도 ${houseRobber([...WALK])} 입니다.`,
    ].join("\n");
  },

  /** `concept` — 칸을 고르는 방법의 개수. 작은 입력은 실제로 세고 과제 규모는 식으로 낸다. */
  "concept-count": () => {
    const n = WALK.length;
    const small = admissible(n - 1).length;
    const bigAll = digits(2n ** BigInt(N_MAX));
    const bigOk = digits(fib(N_MAX + 2));
    return [
      md(
        [
          "배열 길이 N",
          "칸을 고르는 방법",
          "이웃하지 않게 고르는 방법",
          "구한 방법",
        ],
        [
          [String(n), num(2 ** n), num(small), "선택을 모두 만들어 셌다"],
          [
            num(N_MAX),
            `${num(bigAll)} 자리 수`,
            `${num(bigOk)} 자리 수`,
            "2^N 과 F(N+2) 로 냈다",
          ],
        ],
        [1, 2],
      ),
      "",
      `N = ${n} 에서 센 ${small}${이가(small)} F(${n + 2}) = ${fib(n + 2)}${과와(String(fib(n + 2)))} 같았습니다.`,
    ].join("\n");
  },

  /** `concept` — 칸 2 를 고를 때 한 칸 앞과 두 칸 앞 중 어디서 이어받는가. */
  "concept-two-back": () => {
    const r2 = ROUNDS[2] as Round;
    const r1 = ROUNDS[1] as Round;
    const r0 = ROUNDS[0] as Round;
    const a = WALK[2] as number;
    return [
      md(
        ["이어받는 답", "그 답의 선택", "칸 2 를 더한 합", "이웃"],
        [
          [
            `dp[1] = ${r1.cur}`,
            setText(r1.set),
            `${r1.cur} + ${a} = ${r1.cur + a}`,
            "칸 1 과 칸 2 가 이웃이라 어긋난다",
          ],
          [
            `dp[0] = ${r0.cur}`,
            setText(r0.set),
            `${r0.cur} + ${a} = ${r0.cur + a}`,
            "칸 0 과 칸 2 라 지킨다",
          ],
        ],
      ),
      "",
      `정본의 dp[2] 는 ${r2.cur} 이고, 그 선택은 ${setText(r2.set)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 부분집합을 다 만드는 방법이 규모마다 몇 번의 검사를 하는가. */
  "origin-cost": () => {
    const rows = NAIVE_SCALE.map((n) => {
      byAllSubsets(ruled(n));
      return [
        num(n),
        num(2 ** n),
        num(subsetChecks(n)),
        num(n * 2 ** n),
        "실행해서 셌다",
      ];
    });
    const masks = 2n ** BigInt(N_MAX);
    const checks = BigInt(N_MAX) * masks;
    rows.push([
      num(N_MAX),
      `${num(digits(masks))} 자리 수`,
      `${num(digits(checks))} 자리 수`,
      `${num(digits(checks))} 자리 수`,
      "N × 2^N 으로 냈다",
    ]);
    return [
      md(
        ["N", "부분집합의 개수", "칸을 검사한 횟수", "N × 2^N", "구한 방법"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `실행해서 센 ${NAIVE_SCALE.length} 규모에서 검사 횟수가 N × 2^N 과 정확히 같았습니다. 초당 1 억 번으로 잡으면 N = ${num(N_MAX)} 에서 걸리는 초가 ${num(digits(checks / 100_000_000n))} 자리 수입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 마지막 칸의 결정을 가르면 더 작은 같은 물음이 나온다. */
  "origin-split": () => {
    const small = WALK.slice(0, 4);
    const rows: string[][] = [];
    for (let i = small.length - 1; i >= 0; i--) {
      const skip = i - 1 >= 0 ? `칸 ${i - 1} 까지의 답` : "칸이 없을 때의 답";
      const take =
        i - 2 >= 0
          ? `칸 ${i - 2} 까지의 답 + ${small[i]}`
          : `칸이 없을 때의 답 + ${small[i]}`;
      rows.push([`칸 ${i} 까지의 답`, skip, take]);
    }
    return md(["물음", "건너뛴 갈래", "고른 갈래"], rows);
  },

  /** `deep.origin` ③ — 갈래를 다 펴면 같은 물음이 몇 번 나오는가. */
  "origin-repeat": () => {
    const small = WALK.slice(0, 4);
    const { at, empty } = callMultiplicity(small.length);
    const rows = at.map((times, i) => [`칸 ${i} 까지의 답`, num(times)]);
    rows.push(["칸이 없을 때의 답", num(empty)]);
    const total = at.reduce((a, b) => a + b, 0) + empty;
    const scaleRows = RECURSION_SCALE.map((n) => [
      num(n),
      num(n + 1),
      num(recursionCalls(n)),
    ]);
    return [
      md(["물음", "부른 횟수"], rows, [1]),
      "",
      `${show(small)} 에서 물음의 종류 ${at.length + 1} 개를 ${num(total)} 번 불렀습니다. 규모를 키우며 같은 방식으로 세면 이렇습니다.`,
      "",
      md(["N", "물음의 종류", "부른 횟수"], scaleRows, [0, 1, 2]),
      "",
      "물음의 종류는 칸 수보다 하나 많을 뿐인데, 부른 횟수는 그보다 훨씬 빨리 늘어납니다.",
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 덧셈 · 비교 횟수. */
  "cost-two-ways": () => {
    const all = byAllSubsets(WALK);
    const carry = byCarrying(WALK);
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
            "부분집합을 다 만들어 이웃이 섞인 것을 버린다",
            num(all.adds),
            num(all.cmps),
            num(all.adds + all.cmps),
            `${num(digits(BigInt(N_MAX) * 2n ** BigInt(N_MAX)))} 자리 수`,
          ],
          [
            "칸마다 앞의 두 답을 이어받는다",
            num(carry.adds),
            num(carry.cmps),
            num(carry.adds + carry.cmps),
            num(2 * (N_MAX - 1)),
          ],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `두 방식 모두 답은 ${all.answer} 입니다. 아래 방식은 칸 하나에 덧셈 1 번과 비교 1 번을 씁니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 짝수 번째와 홀수 번째 중 큰 쪽을 고르는 후보가 어디서 어긋나는가. */
  "origin-alternating": () => {
    const { rows, gaps } = contrast(ALTERNATING_CASES, byAlternating);
    assertBreaks(null, gaps);
    return [
      md(CONTRAST_HEAD("한 칸 걸러 고른 답"), rows, [1, 2]),
      "",
      "틀린 두 줄은 답이 고른 칸의 번호가 짝수와 홀수에 섞인 입력입니다.",
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 값이 큰 칸부터 고르는 후보가 어디서 어긋나는가. */
  "origin-greedy": () => {
    const { rows, gaps } = contrast(GREEDY_CASES, byGreedy);
    assertBreaks(null, gaps);
    return [
      md(CONTRAST_HEAD("큰 값부터 고른 답"), rows, [1, 2]),
      "",
      "틀린 두 줄은 값이 가장 큰 칸 하나가 답이 고르는 칸 둘 사이에 낀 입력입니다.",
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — `dp[3]` 하나를 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const r = CANDIDATE_END;
    const sets = admissible(r);
    const sums = sets.map((s) => sumOf(WALK, s));
    const top = Math.max(...sums);
    const at = sums.indexOf(top);
    return [
      `dp[${r}]  →  칸 0 부터 칸 ${r} 까지  →  이웃하지 않는 선택 ${sets.length} 가지`,
      `       →  합 ${sums.join(" ")}  →  가장 큰 합 ${top}, 선택 ${setText(sets[at] as number[])}`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 이웃한 칸의 선택이 어떻게 이어지는가. 선택은 정의대로 센 것과 대조했다. */
  "build-neighbors": () => {
    const rows: string[][] = [];
    let fromTwo = 0;
    let fromOne = 0;
    for (const r of ROUNDS.slice(1)) {
      const b1 = ROUNDS[r.i - 1] as Round;
      const b2 = r.i >= 2 ? (ROUNDS[r.i - 2] as Round) : null;
      const took = (r.take as number) > (r.skip as number);
      if (took) fromTwo++;
      else fromOne++;
      rows.push([
        String(r.i),
        b2 === null ? "{} = 0" : `${setText(b2.set)} = ${b2.cur}`,
        `${setText(b1.set)} = ${b1.cur}`,
        `${setText(r.set)} = ${r.cur}`,
        took
          ? `dp[${idx(r.i - 2)}] 의 선택에 칸 ${r.i}${을를(r.i)} 더했다`
          : `dp[${r.i - 1}] 의 선택 그대로`,
      ]);
    }
    return [
      md(
        [
          "i",
          "dp[i−2] 의 선택",
          "dp[i−1] 의 선택",
          "dp[i] 의 선택",
          "두 선택의 관계",
        ],
        rows,
        [0],
      ),
      "",
      `${rows.length} 칸 모두 dp[i] 의 선택이 dp[i−1] 의 선택 그대로이거나 dp[i−2] 의 선택에 칸 i 를 더한 것입니다. 칸 i 를 더한 칸이 ${fromTwo} 개, 그대로 쓴 칸이 ${fromOne} 개입니다. 칸 1 의 dp[−1] 은 칸이 없을 때의 답 0 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (e) — 칸 i 를 반드시 고른 최대 합과의 대조. */
  "build-confuse": () => {
    const rows = WALK.map((a, i) => [
      String(i),
      String(a),
      String(mustTake(WALK, i)),
      String(defined(WALK, i)),
    ]);
    const other = [1, 5, 1];
    const g = other.map((_, i) => mustTake(other, i));
    const d = other.map((_, i) => defined(other, i));
    const drops = WALK.map((_, i) => i).filter(
      (i) => i > 0 && mustTake(WALK, i) < mustTake(WALK, i - 1),
    );
    return [
      md(
        ["칸 i", "A[i]", "칸 i 를 반드시 고른 최대 합", "dp[i]"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `칸 i 를 반드시 고른 최대 합은 칸 ${dots(drops)} 에서 앞 칸보다 작아지고, dp[i] 는 한 번도 작아지지 않습니다. 입력 ${show(other)} 에서는 두 줄이 각각 [${g.join(" ")}] · [${d.join(" ")}] 이고, 마지막 칸만 읽으면 칸 i 를 반드시 고른 쪽은 ${g.at(-1)} 이고 답은 ${d.at(-1)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 반복 전의 두 값. */
  "build-first": () => {
    const first = ROUNDS[0] as Round;
    return md(
      ["상태", "놓고 본 칸", "고를 수 있는 선택", "값"],
      [
        [
          "칸이 없을 때의 답 dp[−1]",
          "없다",
          dots(admissible(-1).map(setText)),
          String(first.prev),
        ],
        [
          "칸 0 까지의 최대 합 dp[0]",
          "칸 0",
          dots(admissible(0).map(setText)),
          String(first.cur),
        ],
      ],
      [3],
    );
  },

  /** `deep.build` 2단계 — 반복 다섯 칸을 두 경우로 나눈다. */
  "build-cases": () => {
    const rows: string[][] = [];
    const took: number[] = [];
    const skipped: number[] = [];
    for (const r of ROUNDS.slice(1)) {
      const b = branchOf(r);
      if (b === "고른다") took.push(r.i);
      else skipped.push(r.i);
      const b2 = r.i >= 2 ? (ROUNDS[r.i - 2] as Round).cur : 0;
      rows.push([
        b === "고른다" ? "고른 쪽이 크다" : "건너뛴 쪽이 크다",
        String(r.i),
        String(b2),
        String((ROUNDS[r.i - 1] as Round).cur),
        String(WALK[r.i]),
        String(r.skip),
        `${b2} + ${WALK[r.i]} = ${r.take}`,
        String(r.cur),
      ]);
    }
    rows.sort((a, b) =>
      a[0] === b[0] ? 0 : a[0] === "고른 쪽이 크다" ? -1 : 1,
    );
    return [
      md(
        [
          "경우",
          "i",
          "dp[i−2]",
          "dp[i−1]",
          "A[i]",
          "건너뛴 답",
          "고른 답",
          "dp[i]",
        ],
        rows,
        [1, 2, 3, 4, 5, 7],
      ),
      "",
      `반복의 ${rows.length} 칸이 두 경우에 빠짐없이 들어갑니다. 고른 쪽이 큰 칸은 ${dots(took)} 이고, 건너뛴 쪽이 큰 칸은 ${dots(skipped)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 두 값을 한 칸씩 옮긴 전후. */
  "build-shift": () => {
    const rows = ROUNDS.slice(1).map((r) => {
      const b = ROUNDS[r.i - 1] as Round;
      return [
        String(r.i),
        `${b.prev} · ${b.cur}`,
        `${r.prev} · ${r.cur}`,
        r.cur === b.cur ? "cur 는 그대로 · prev 는 바뀜" : "둘 다 바뀜",
      ];
    });
    const still = ROUNDS.slice(1).filter(
      (r) => r.cur === (ROUNDS[r.i - 1] as Round).cur,
    );
    return [
      md(
        ["i", "옮기기 전 prev · cur", "옮긴 뒤 prev · cur", "무엇이 바뀌었나"],
        rows,
        [0],
      ),
      "",
      `cur 가 그대로인 칸은 ${dots(still.map((r) => r.i))} 이고, 그 칸에서도 prev 는 ${dots(still.map((r) => `${(ROUNDS[r.i - 1] as Round).prev} 에서 ${r.prev}${으로(r.prev)}`))} 바뀌었습니다.`,
    ].join("\n");
  },

  /** `deep.build` 4단계 — 마지막 칸의 최대 합이 곧 답이다. */
  "build-last": () => {
    const dp = ROUNDS.map((r) => r.cur);
    const n = WALK.length;
    const up = dp.every((v, k) => k === 0 || v >= (dp[k - 1] as number));
    if (!up) throw new Error("dp 가 작아지는 칸이 있다");
    const best = Math.max(...admissible(n - 1).map((s) => sumOf(WALK, s)));
    return [
      md(
        ["줄", `칸 0 부터 칸 ${n - 1} 까지`],
        [
          ["dp", show(dp)],
          [
            "앞 칸보다 커진 칸",
            dots(
              dp
                .map((v, k) => (k === 0 || v > (dp[k - 1] as number) ? k : -1))
                .filter((k) => k >= 0),
            ),
          ],
        ],
      ),
      "",
      `dp 는 한 번도 작아지지 않았습니다. 마지막 칸 dp[${n - 1}] = ${dp[n - 1]} 이고, 선택 ${admissible(n - 1).length} 가지를 모두 더해 본 가장 큰 합도 ${best} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 전제 — 첫 칸의 값이 음수면 1단계의 시작값이 틀린다. */
  "premise-negative": () => {
    const wrong: number[][] = [];
    const same: number[][] = [];
    const rows = NEGATIVE_CASES.map((A) => {
      const bare = houseRobber([...A]);
      const want = byDefinition(A);
      if (bare === want) same.push(A);
      else {
        if (want !== 0) throw new Error("빈 선택이 답이 아닌 입력에서 틀렸다");
        wrong.push(A);
      }
      return [
        show(A),
        String(want),
        String(bare),
        bare === want ? "같다" : "틀리다",
      ];
    });
    return [
      md(["입력", "빈 선택까지 센 답", "정본이 낸 값", "판정"], rows, [1, 2]),
      "",
      `틀린 ${wrong.length} 줄은 빈 선택이 답인 입력이고, 정본은 빈 선택 대신 첫 칸의 음수에서 시작한 값을 냈습니다. ${dots(same.map(show))} 처럼 음수가 섞여도 답이 양수인 입력에서는 값이 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 몇 칸 앞의 답을 이어받아야 하는가를 네 가지로 두고 대조한다. */
  "state-span": () => {
    const heads = ["1 칸 앞", "2 칸 앞", "3 칸 앞", "dp 전체"];
    const impls = [
      (A: number[]) => carrySpan(A, 1),
      (A: number[]) => carrySpan(A, 2),
      (A: number[]) => carrySpan(A, 3),
      (A: number[]) => carrySpan(A, 2),
    ];
    const wrong = [0, 0, 0, 0];
    const rows = SPAN_CASES.map((A) => {
      const bare = houseRobber([...A]);
      const cells = impls.map((f, k) => {
        const got = f([...A]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return num(got);
      });
      return [show(A), num(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(N_MAX)} 에서 들고 가는 칸`,
      "",
      "1",
      "2",
      "3",
      num(N_MAX),
    ]);
    return [
      md(["입력", "정답", ...heads], rows, [1, 2, 3, 4, 5]),
      "",
      `어긋난 입력이 0 개인 것은 2 칸 앞과 dp 전체이고, 둘 중 들고 가는 칸이 적은 쪽은 2 칸 앞입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const nums = [${WALK.join(", ")}];`,
      `// 이 절이 끝나면 ${houseRobber([...WALK])}${이가(houseRobber([...WALK]))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 두 값을 시작값으로 둔 직후. */
  "walk-init": () => {
    const first = ROUNDS[0] as Round;
    return md(
      ["상태", "값", "뜻"],
      [
        ["prev", String(first.prev), "칸이 없을 때의 답 dp[−1]"],
        ["cur", String(first.cur), "칸 0 까지의 최대 합 dp[0]"],
      ],
      [1],
    );
  },

  /** `deep.walk` 2 — 앞 두 걸음만 실행한 결과. */
  "walk-first-two": () => {
    const rows = ROUNDS.slice(1, 3).map((r) => {
      const b = ROUNDS[r.i - 1] as Round;
      return [
        `T${r.i + 1}`,
        String(r.i),
        String(WALK[r.i]),
        String(r.skip),
        `${b.prev} + ${WALK[r.i]} = ${r.take}`,
        String(r.prev),
        String(r.cur),
      ];
    });
    const t3 = ROUNDS[2] as Round;
    return [
      md(
        ["걸음", "i", "A[i]", "건너뛴 답", "고른 답", "prev", "cur"],
        rows,
        [1, 2, 3, 5, 6],
      ),
      "",
      `T3 의 고른 답 ${t3.take} 은 직전 답 ${(ROUNDS[1] as Round).cur} 이 아니라 두 칸 앞의 답 ${(ROUNDS[0] as Round).cur} 에서 나왔습니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 고른 답을 옆 칸까지 담은 답에서 이어받으면 무엇이 달라지는가. */
  "pause-adjacent": () => {
    const { rows, gaps } = contrast(ADJACENT_CASES, (A) =>
      adjacentAllowed.houseRobber(A),
    );
    assertBreaks(adjacentAllowed, gaps);
    const total = WALK.reduce((a, b) => a + b, 0);
    return [
      md(CONTRAST_HEAD("cur 에서 이어받은 값"), rows, [1, 2]),
      "",
      `전개 입력의 변이 값은 여섯 칸을 전부 더한 합 ${num(total)} 과 같은 크기입니다. 칸이 하나이거나 값이 전부 0 이면 답이 그대로입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 칸짜리 입력에서 두 방식이 갈리는 자리. */
  "pause-adjacent-two": () => {
    const A = [2, 7];
    const prev = 0;
    const cur = A[0] as number;
    const a = A[1] as number;
    return md(
      ["방식", "고른 답", "그 답의 선택"],
      [
        ["정본", `prev + ${a} = ${prev} + ${a} = ${prev + a}`, "{1}"],
        [
          "cur 에서 이어받기",
          `cur + ${a} = ${cur} + ${a} = ${cur + a}`,
          "{0, 1} — 이웃",
        ],
      ],
    );
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 지나간 걸음별 상태값. */
  "walk-trace": () => {
    const n = WALK.length;
    const first = ROUNDS[0] as Round;
    const rows: string[][] = [
      [
        "T1",
        "0",
        `\`${n} === 0\` 거짓`,
        String(WALK[0]),
        "—",
        "—",
        "—",
        String(first.prev),
        String(first.cur),
      ],
    ];
    for (const r of ROUNDS.slice(1)) {
      rows.push([
        `T${r.i + 1}`,
        String(r.i),
        `\`${r.i} < ${n}\` 참`,
        String(WALK[r.i]),
        String(r.skip),
        String(r.take),
        branchOf(r) ?? "—",
        String(r.prev),
        String(r.cur),
      ]);
    }
    const last = ROUNDS[ROUNDS.length - 1] as Round;
    rows.push([
      `T${n + 1}`,
      String(n),
      `\`${n} < ${n}\` 거짓`,
      "—",
      "—",
      "—",
      "—",
      String(last.prev),
      String(last.cur),
    ]);
    return [
      md(
        [
          "걸음",
          "i",
          "조건",
          "A[i]",
          "건너뛴 답",
          "고른 답",
          "고른 갈래",
          "prev",
          "cur",
        ],
        rows,
        [1, 3, 4, 5, 7, 8],
      ),
      "",
      `cur 는 한 번도 작아지지 않았고, T${n + 1} 에서 ${last.cur}${을를(last.cur)} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` — 라벨마다 실행된 걸음. */
  "walk-branches": () => {
    const n = WALK.length;
    const took: string[] = [];
    const skipped: string[] = [];
    const ties: string[] = [];
    for (const r of ROUNDS.slice(1)) {
      const b = branchOf(r);
      const step = `T${r.i + 1}`;
      if (b === "고른다") took.push(step);
      else if (b === "건너뛴다") skipped.push(step);
      else ties.push(step);
    }
    return [
      md(
        ["갈래", "실행된 걸음"],
        [
          ["① 빈 입력 막기", "T1 에서 거짓"],
          ["② 두 값 시작", "T1"],
          [`③ 반복 조건 i < ${n}`, `T2~T${n} 에서 참 · T${n + 1} 에서 거짓`],
          ["④ 두 답 만들기", `T2~T${n}`],
          [
            "⑤ 두 값 옮기기",
            `칸을 고른 걸음 ${took.join(" ")} · 건너뛴 걸음 ${skipped.join(" ")}${ties.length > 0 ? ` · 두 답이 같은 걸음 ${ties.join(" ")}` : ""}`,
          ],
        ],
      ),
      "",
      `두 답이 같아지는 걸음은 ${ties.length === 0 ? "이 입력에 없습니다" : `${ties.join(" ")} 입니다`}.`,
    ].join("\n");
  },

  /** `deep.walk.step` — 답이 정말 그 칸들의 합인가. */
  "walk-check-sum": () => {
    const last = ROUNDS[ROUNDS.length - 1] as Round;
    const vals = last.set.map((k) => WALK[k] as number);
    const gaps = last.set.slice(1).map((k, j) => k - (last.set[j] as number));
    return md(
      [
        "cur 를 만든 선택",
        "그 칸들의 값",
        "직접 더한 합",
        "번호 차이",
        "T7 이 돌려준 값",
      ],
      [
        [
          setText(last.set),
          dots(vals),
          `${vals.join(" + ")} = ${sumOf(WALK, last.set)}`,
          dots(gaps),
          String(last.cur),
        ],
      ],
      [4],
    );
  },

  /** `deep.walk.pause` — 점화식을 재귀로 그대로 옮기면 무엇이 달라지는가. */
  "pause-recursion": () => {
    const sameRows = RECURSION_SAME.map((c) => {
      const bare = houseRobber([...c.A]);
      const got = byMemoRecursion([...c.A]);
      return [c.name, num(bare), num(got), bare === got ? "같다" : "틀리다"];
    });
    const callRows = RECURSION_SCALE.map((n) => [
      num(n),
      num(recursionCalls(n)),
      num(2 * (n - 1)),
    ]);
    const depthRows = DEPTH_SCALE.map((n) => {
      const A = new Array<number>(n).fill(1);
      try {
        return [num(n), `답 ${num(byMemoRecursion(A))} 이 나온다`];
      } catch {
        return [num(n), "재귀 깊이를 넘어 답이 안 나온다"];
      }
    });
    return [
      md(CONTRAST_HEAD("메모를 붙인 재귀의 답"), sameRows, [1, 2]),
      "",
      "메모를 안 붙이면 부르는 횟수가 이렇게 늘어납니다.",
      "",
      md(["N", "재귀 호출", "두 값 이어받기의 기본 연산"], callRows, [0, 1, 2]),
      "",
      "메모를 붙였을 때 과제 규모까지 실행되는지 보면 이렇습니다.",
      "",
      md(["N", "메모를 붙인 재귀"], depthRows, [0]),
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 부른 결과. */
  "final-calls": () => {
    const calls: number[][] = [
      [...WALK],
      [1, 2, 3, 1],
      [2, 1, 1, 2],
      [CASH_MAX, 1, CASH_MAX],
      [],
    ];
    const heads = calls.map((A) => `houseRobber([${A.join(", ")}])`);
    const w = Math.max(...heads.map((h) => h.length));
    const vals = calls.map((A) => num(houseRobber([...A])));
    const vw = Math.max(...vals.map((v) => v.length));
    return [
      ...heads.map(
        (h, k) => `${h.padEnd(w)}   →  ${(vals[k] as string).padStart(vw)}`,
      ),
    ].join("\n");
  },

  /** `purpose.alt` — 두 설계의 기본 연산 수. */
  "alt-table": () => {
    const mine = benchCases["두 값 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const points = [0, 109, 110, 1024];
    const rows = points.map((p) => {
      const key = `질의 ${num(p)} 회 기본 연산`;
      const a = mine[key] as number;
      const b = other[key] as number;
      const note =
        a < b
          ? b / a >= 2
            ? `두 값 이어받기가 ${Math.round(b / a)} 배 적음`
            : "두 값 이어받기가 근소하게 적음"
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
        ["섞인 질의", "두 값 이어받기", "세그먼트 트리", "적은 쪽"],
        rows,
        [1, 2],
      ),
      "",
      `저장 칸은 ${num(mine["저장 칸"] as number)} 개 대 ${num(other["저장 칸"] as number)} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 뒤집히는 자리를 계수에서 낸다. */
  "alt-boundary": () => {
    const mine = benchCases["두 값 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const base = mine["질의 0 회 기본 연산"] as number;
    const perQuery =
      (mine["질의 1,024 회 기본 연산"] as number) / (BENCH_U + 1);
    if (perQuery !== base) {
      throw new Error("두 값 이어받기의 질의당 연산이 일정하지 않다");
    }
    const segBase = other["질의 0 회 기본 연산"] as number;
    const segPer =
      ((other["질의 1,024 회 기본 연산"] as number) - segBase) / BENCH_U;
    const merge = 20;
    const build = merge * (BENCH_N - 1);
    const updates = merge * BENCH_U * Math.log2(BENCH_N);
    const fixed = build + updates;
    if (fixed + segPer !== segBase) {
      throw new Error(
        "세그먼트 트리의 계수가 세우기 · 갱신 · 질의로 나뉘지 않는다",
      );
    }
    return md(
      ["무엇", "값"],
      [
        ["질의 하나에 드는 두 값 이어받기의 연산", num(perQuery)],
        ["질의 하나에 드는 세그먼트 트리의 연산", num(segPer)],
        [
          "세그먼트 트리가 먼저 쓰는 연산",
          `${num(fixed)} = 트리 세우기 ${num(build)} + 갱신 ${num(updates)}`,
        ],
        [
          "뒤집히는 질의 수",
          `${num(fixed)} ÷ (${num(perQuery)} − ${num(segPer)}) ≈ ${(fixed / (perQuery - segPer)).toFixed(1)}`,
        ],
      ],
    );
  },

  /** `deep.math` ② — 정의로 센 값과 점화식이 낸 값을 맞춘다. */
  "math-check": () => {
    const target = 2;
    const setRows = admissible(target).map((s) => [
      setText(s),
      s.length === 0 ? "0" : s.map((k) => String(WALK[k])).join(" + "),
      String(sumOf(WALK, s)),
    ]);
    const rows = ROUNDS.map((r) => [
      String(r.i),
      num(admissible(r.i).length),
      String(defined(WALK, r.i)),
      String(r.cur),
    ]);
    return [
      md(["𝒮_2 의 선택", "더한 값", "합"], setRows, [2]),
      "",
      `여섯 칸 전부에서 정의로 센 값과 정본의 cur 를 나란히 놓으면 이렇습니다.`,
      "",
      md(
        ["i", "𝒮_i 의 크기", "정의로 센 dp[i]", "정본의 cur"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `두 열이 ${rows.length} 칸 모두 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 과제 규모를 넣으면 선택의 개수가 몇 자리가 되는가. */
  "math-count": () => {
    const rows = [0, 1, 2, 3, 4, 5].map((i) => [
      String(i),
      num(admissible(i).length),
      `F(${i + 3}) = ${fib(i + 3)}`,
    ]);
    const n = N_MAX;
    const candidates = fib(n + 2);
    const allSubsets = 2n ** BigInt(n);
    return [
      md(["i", "𝒮_i 의 크기(실측)", "피보나치"], rows, [0, 1]),
      "",
      `과제 규모 N = ${num(n)} 을 넣으면 이렇습니다.`,
      "",
      md(
        ["무엇", "값"],
        [
          [
            "이웃하지 않는 선택 𝒮_{N−1} 의 크기",
            `F(${num(n + 2)}) — ${num(digits(candidates))} 자리 수`,
          ],
          ["모든 부분집합", `2^${num(n)} — ${num(digits(allSubsets))} 자리 수`],
          ["고를 수 있는 칸의 최대 개수", num(Math.ceil(n / 2))],
          ["답의 상한", num(Math.ceil(n / 2) * CASH_MAX)],
          ["두 값 이어받기의 기본 연산", num(2 * (n - 1))],
        ],
      ),
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 두 문장을 정의로 센 값과 대조한다. */
  "invariant-hold": () => {
    const rows = ROUNDS.map((r) => [
      `T${r.i + 1}`,
      String(r.i),
      String(r.prev),
      String(defined(WALK, r.i - 1)),
      String(r.cur),
      String(defined(WALK, r.i)),
    ]);
    const ok = ROUNDS.every(
      (r) => r.prev === defined(WALK, r.i - 1) && r.cur === defined(WALK, r.i),
    );
    if (!ok) throw new Error("불변식이 깨진 걸음이 있다");
    return [
      md(
        ["걸음", "칸 i", "prev", "정의로 센 dp[i−1]", "cur", "정의로 센 dp[i]"],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 걸음 모두 prev 가 정의로 센 dp[i−1] 과, cur 가 정의로 센 dp[i] 와 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력에서 두 값이 어떻게 정해지는가. */
  "invariant-edges": () => {
    const rows = EDGE_CASES.map(([name, A]) => {
      const bare = houseRobber([...A]);
      const want = byDefinition(A);
      if (A.length === 0)
        return [name, show(A), "—", "—", "—", num(bare), num(want)];
      const rs = trace(A);
      const last = rs[rs.length - 1] as Round;
      return [
        name,
        show(A),
        String(A.length - 1),
        num(last.prev),
        num(last.cur),
        num(bare),
        num(want),
      ];
    });
    return [
      md(
        [
          "경계",
          "입력",
          "반복 횟수",
          "끝난 뒤 prev",
          "끝난 뒤 cur",
          "정본의 답",
          "정의로 센 답",
        ],
        rows,
        [2, 3, 4, 5, 6],
      ),
      "",
      `${rows.length} 입력 모두 정본의 답이 정의로 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 두 값을 옮기지 않으면 무엇이 나오는가. */
  "mutant-prev-frozen": () => {
    const { rows, gaps } = contrast(PREV_CASES, (A) =>
      prevFrozen.houseRobber(A),
    );
    assertBreaks(prevFrozen, gaps);
    return [
      md(CONTRAST_HEAD("옮기기를 뺀 답"), rows, [1, 2]),
      "",
      "틀린 세 줄은 답이 칸 둘 이상을 고르는 입력입니다.",
    ].join("\n");
  },

  /** `invariant` ③ — 전개 입력에서 칸마다의 prev 를 두 코드로 펼친다. */
  "mutant-prev-trace": () => {
    const good: number[] = [0];
    const bad: number[] = [0];
    let gPrev = 0;
    let gCur = WALK[0] as number;
    const bPrev = 0;
    let bCur = WALK[0] as number;
    for (let i = 1; i < WALK.length; i++) {
      const gSkip = gCur;
      const gTake = gPrev + (WALK[i] as number);
      gPrev = gCur;
      gCur = Math.max(gSkip, gTake);
      bCur = Math.max(bCur, bPrev + (WALK[i] as number));
      good.push(gPrev);
      bad.push(bPrev);
    }
    if (
      bCur !== prevFrozen.houseRobber([...WALK]) &&
      prevFrozen.houseRobber !== houseRobber
    ) {
      throw new Error("손으로 펼친 변이가 변이 모듈과 다른 답을 냈다");
    }
    return [
      md(
        ["칸 i", ...WALK.map((_, i) => String(i))],
        [
          ["정본의 prev", ...good.map(String)],
          ["옮기기를 뺀 prev", ...bad.map(String)],
        ],
        WALK.map((_, i) => i + 1),
      ),
      "",
      `옮기기를 뺀 prev 는 끝까지 0 이라, 고른 답이 A[i] 하나가 됩니다. 그래서 답이 가장 큰 칸 하나의 값 ${Math.max(...WALK)}${이가(Math.max(...WALK))} 됩니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 덧셈과 비교가 드는가. */
  "perf-count": () => {
    const carry = byCarrying(WALK);
    const n = WALK.length;
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
        [
          ["초기화", "T1", "1", "0", "0", "0"],
          ["순회", `T2~T${n}`, String(n - 1), "1", "1", String(2 * (n - 1))],
          ["반환", `T${n + 1}`, "1", "0", "0", "0"],
          ["합계", "", "", "", "", String(carry.adds + carry.cmps)],
        ],
        [2, 3, 4, 5],
      ),
      "",
      `덧셈 ${carry.adds} 번과 비교 ${carry.cmps} 번이고, 둘 다 칸 수 ${n} 에서만 나온 수입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 센 값과 닫힌 형태의 대조. */
  "perf-total": () => {
    const rows = [WALK.length, N_MAX].map((n) => {
      const A = n === WALK.length ? [...WALK] : ruled(n);
      const c = byCarrying(A);
      return [num(n), num(c.adds + c.cmps), num(2 * (n - 1))];
    });
    return [
      md(["N", "센 기본 연산", "2(N − 1)"], rows, [0, 1, 2]),
      "",
      "두 규모 모두 센 값이 2(N − 1) 과 같습니다.",
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["값이 전부 0", Array.from({ length: n }, () => 0)],
      [`값이 전부 ${num(CASH_MAX)}`, Array.from({ length: n }, () => CASH_MAX)],
      [
        "1 과 0 이 번갈아",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 1 : 0)),
      ],
      [
        `마지막 한 칸만 ${num(CASH_MAX)} · 나머지는 0`,
        Array.from({ length: n }, (_, k) => (k === n - 1 ? CASH_MAX : 0)),
      ],
      ["1 부터 차례로 커진다", Array.from({ length: n }, (_, k) => k + 1)],
    ];
    const rows = shapes.map(([name, A]) => {
      const c = byCarrying(A);
      return [
        name,
        num(c.adds),
        num(c.cmps),
        num(c.adds + c.cmps),
        num(c.answer),
      ];
    });
    return [
      md(
        [`입력의 모양 (N = ${num(n)})`, "덧셈", "비교", "기본 연산", "답"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `가운데 세 열은 ${rows.length} 줄 모두 값이 같고, 오른쪽 열만 다릅니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 무엇을 최악으로 만드는가에 따라 입력이 다르다. */
  "worst-axes": () => {
    const top = houseRobber(new Array<number>(N_MAX).fill(CASH_MAX));
    return md(
      ["최악으로 만들 것", "입력", "값"],
      [
        [
          "기본 연산 수",
          `N = ${num(N_MAX)}, 값은 무엇이든`,
          num(2 * (N_MAX - 1)),
        ],
        ["들고 가는 칸", "어떤 입력이든", "2"],
        ["답의 크기", `${num(CASH_MAX)} 이 ${num(N_MAX)} 칸`, num(top)],
      ],
      [2],
    );
  },

  /** `selfcheck` — T4 와 T5 의 두 값. */
  "selfcheck-t4": () => {
    const t4 = ROUNDS[3] as Round;
    const t5 = ROUNDS[4] as Round;
    const b4 = ROUNDS[2] as Round;
    return [
      `T4   A[3] = ${WALK[3]}   건너뛴 답 ${t4.skip} · 고른 답 ${t4.take}   cur = ${t4.cur} 그대로   prev = ${b4.prev} → ${t4.prev}`,
      `T5   A[4] = ${WALK[4]}   건너뛴 답 ${t5.skip} · 고른 답 prev + ${WALK[4]} = ${t4.prev} + ${WALK[4]} = ${t5.take}`,
    ].join("\n");
  },
};
