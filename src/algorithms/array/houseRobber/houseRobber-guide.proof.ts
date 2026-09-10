/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts houseRobber-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { houseRobber } from "./houseRobber-guide.ref.ts";

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
const num = (n: number): string =>
  Number.isFinite(n) ? n.toLocaleString("en-US") : String(n);

/** `[3 4 7]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
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
 * 두 갈래가 각각 한 번 이상 골라져야 하고(고르는 쪽 T2·T3·T5·T6, 건너뛰는 쪽 T4), 답이 되는
 * 집이 이어지지 않은 셋이어야 하며(집 0·2·5), 건너뛰는 걸음에서 `cur` 는 그대로인데 `prev` 는
 * 바뀌는 장면이 나와야 한다 — 그 자리가 이 절차에서 가장 헷갈리는 곳이다.
 */
const WALK: number[] = [2, 7, 9, 3, 1, 5];

/** 제약의 최댓값. */
const LIMIT = 100_000;

/** 집 값의 상한. */
const CASH_MAX = 10_000;

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/** 부분집합을 다 만드는 방법의 규모를 실제로 잴 수 있는 지점들. */
const NAIVE_SCALE = [6, 12, 18];

/** 메모 없는 재귀의 호출 수를 실제로 잴 수 있는 지점들. */
const RECURSION_SCALE = [6, 12, 18, 24];

/** 재귀 깊이를 시험하는 두 규모. 가운데 크기는 넣지 않는다 — 임계값이 실행 환경에 달렸다. */
const DEPTH_SCALE = [1000, LIMIT];

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  adds: number;
  cmps: number;
}

/**
 * 인접하지 않은 부분집합을 전부 만들어 합을 견주는 방식. 정의를 그대로 옮긴 것이라 답의
 * 기준이 되고, 덧셈과 비교를 함께 센다.
 */
function byAllSubsets(nums: number[]): Counted {
  const n = nums.length;
  let best = 0;
  let adds = 0;
  let cmps = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let sum = 0;
    let ok = true;
    for (let i = 0; i < n; i++) {
      cmps++; // 이 집을 골랐는가
      if ((mask & (1 << i)) === 0) continue;
      if (i > 0) {
        cmps++; // 옆집도 골랐는가
        if ((mask & (1 << (i - 1))) !== 0) ok = false;
      }
      adds++;
      sum += nums[i] as number;
    }
    cmps++; // 지금까지의 최댓값과 견주기
    if (ok) best = Math.max(best, sum);
  }
  return { answer: best, adds, cmps };
}

/** 부분집합을 다 만들 때 **집 하나를 검사한 횟수**만 센다 — 닫힌 형태가 `N·2^N` 이다. */
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

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 집 하나마다 덧셈 한 번(고른 답 만들기)과 비교 한
 * 번(두 답 중 큰 쪽 고르기)이다.
 */
function byCarrying(nums: number[]): Counted {
  let adds = 0;
  let cmps = 0;
  if (nums.length === 0) return { answer: 0, adds, cmps };
  let prev = 0;
  let cur = nums[0] as number;
  for (let i = 1; i < nums.length; i++) {
    const skip = cur;
    adds++;
    const take = prev + (nums[i] as number);
    prev = cur;
    cmps++;
    cur = Math.max(skip, take);
  }
  return { answer: cur, adds, cmps };
}

/** 짝수 번째 집만 고른 합과 홀수 번째 집만 고른 합 중 큰 쪽. */
function byAlternating(nums: number[]): number {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i % 2 === 0) even += nums[i] as number;
    else odd += nums[i] as number;
  }
  return Math.max(even, odd);
}

/** 값이 큰 집부터 고르되 옆집이 이미 골라졌으면 건너뛰는 방식. */
function byGreedy(nums: number[]): number {
  const order = nums
    .map((v, i) => [v, i] as [number, number])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const taken = new Array<boolean>(nums.length).fill(false);
  let sum = 0;
  for (const [v, i] of order) {
    if (taken[i - 1] === true || taken[i + 1] === true) continue;
    taken[i] = true;
    sum += v;
  }
  return sum;
}

/**
 * `k` 칸 앞의 답을 이어받는 방식. `k = 2` 가 정본이고, 나머지는 이어받는 칸 수를 바꿔 본
 * 것이다. 표를 실제로 만들어 앞쪽 값을 읽는다.
 */
function carrySpan(nums: number[], k: number): number {
  const n = nums.length;
  if (n === 0) return 0;
  const dp = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const skip = i >= 1 ? (dp[i - 1] as number) : 0;
    const from = i - k >= 0 ? (dp[i - k] as number) : 0;
    dp[i] = Math.max(skip, from + (nums[i] as number));
  }
  return dp[n - 1] as number;
}

/** 칸 `N` 개짜리 표를 그대로 잡는 방식 — 답은 정본과 같고 쓰는 칸만 다르다. */
function byTable(nums: number[]): number {
  return carrySpan(nums, 2);
}

/**
 * 메모 없는 재귀에서 물음 하나가 몇 번 불렸는가. 갈래를 다 펴지 않고 위에서 아래로 배수를
 * 더해 센다 — 다 펴면 `N = 18` 에서 만 번을 넘는다.
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

/** 메모를 붙인 재귀. 깊이가 집의 수만큼이라 큰 입력에서 실행되지 않는다. */
function byMemoRecursion(nums: number[]): number {
  const memo = new Array<number>(nums.length).fill(-1);
  const rec = (i: number): number => {
    if (i < 0) return 0;
    const hit = memo[i] as number;
    if (hit !== -1) return hit;
    const v = Math.max(rec(i - 1), rec(i - 2) + (nums[i] as number));
    memo[i] = v;
    return v;
  };
  return rec(nums.length - 1);
}

/** 정의 그대로 — 집 `0` 부터 `i` 까지에서 인접 쌍을 안 담는 부분집합을 전부 만든다. */
function admissible(i: number): number[][] {
  if (i < 0) return [[]];
  return [...admissible(i - 1), ...admissible(i - 2).map((s) => [...s, i])];
}

/** 그 부분집합들의 합 중 최댓값 — 정의로 센 `f(i)` 다. */
function defined(nums: number[], i: number): number {
  let best = 0;
  for (const s of admissible(i)) {
    let sum = 0;
    for (const k of s) sum += nums[k] as number;
    best = Math.max(best, sum);
  }
  return best;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  houseRobber(nums: number[]): number;
}

const REF = new URL("./houseRobber-guide.ref.ts", import.meta.url).pathname;

/** 집 `i` 를 고른 답을 **옆집까지 담은 답**에서 이어받는 사본. */
const adjacentAllowed = await loadMutant<Impl>(REF, {
  swap: [
    /const take = prev \+ \(nums\[i\] as number\);/,
    "const take = cur + (nums[i] as number);",
  ],
});

/**
 * 두 값을 옮기는 줄을 잃은 사본. 불변식의 `prev` 절반을 지키던 바로 그 줄이다.
 */
const prevFrozen = await loadMutant<Impl>(REF, {
  drop: /^\s*prev = cur;$/,
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  nums: number[];
}

const NAMED = (nums: number[]): Case => ({ name: show(nums), nums });
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, nums: WALK };

const ALTERNATING_CASES: Case[] = [
  WALK_CASE,
  NAMED([2, 1, 1, 2]),
  NAMED([1, 3, 1, 3, 1, 3]),
  NAMED([1, 2, 3, 1]),
  NAMED([2, 7]),
];

const GREEDY_CASES: Case[] = [
  WALK_CASE,
  NAMED([4, 5, 4]),
  NAMED([5, 6, 5, 6, 5]),
  NAMED([1, 2, 3, 1]),
  NAMED([2, 1, 1, 2]),
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
  WALK,
  [1, 2, 3, 1],
  [2, 1, 1, 2],
  [5, 5, 5, 5, 5],
];

const RECURSION_SAME: Case[] = [
  WALK_CASE,
  NAMED([1, 2, 3, 1]),
  NAMED([5, 5, 5, 5, 5]),
];

/** 불변식이 경계에서도 유지되는지 값으로 본다. */
const EDGE_CASES: [string, number[]][] = [
  ["집이 하나도 없다", []],
  ["집이 하나다", [7]],
  ["집이 둘이다", [2, 7]],
  ["값이 전부 0 이다", [0, 0, 0]],
  ["값이 전부 같다", [5, 5, 5, 5, 5]],
  ["가운데 하나만 크다", [1, 3, 1]],
  ["최댓값 둘이 이어져 있다", [CASH_MAX, CASH_MAX]],
  ["최댓값 둘이 떨어져 있다", [CASH_MAX, 1, CASH_MAX]],
  ["답이 마지막 집을 안 고른다", [1, 10, 1, 1]],
];

/** 답이 안 바뀐 자리와 바뀐 자리를 함께 보인다. 하나도 안 바뀌면 「깨진다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(nums: number[], got: number): number {
  const want = houseRobber([...nums]);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (nums: number[]) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = houseRobber([...c.nums]);
    const got = other([...c.nums]);
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

/** 큰 수의 자릿수. */
const digits = (v: bigint): number => v.toString().length;

/**
 * 피보나치 수 — `F(0) = 0`, `F(1) = 1` 로 센다. 제약 규모에서 자릿수가 2 만을 넘으므로
 * 한 항씩 더하지 않고 배가 공식으로 낸다.
 */
function fibPair(n: number): [bigint, bigint] {
  if (n === 0) return [0n, 1n];
  const [a, b] = fibPair(Math.floor(n / 2));
  const c = a * (2n * b - a);
  const d = a * a + b * b;
  return n % 2 === 0 ? [c, d] : [d, c + d];
}

const fib = (n: number): bigint => fibPair(n)[0];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 부분집합을 다 만드는 방법이 규모마다 몇 번의 검사를 하는가. */
  "naive-cost": () => {
    const rows = NAIVE_SCALE.map((n) => {
      const nums = Array.from({ length: n }, (_, k) => ((k * 37) % 97) + 1);
      const all = byAllSubsets(nums);
      assertSame(nums, all.answer);
      return [num(n), num(2 ** n), num(subsetChecks(n)), num(n * 2 ** n)];
    });
    const masks = 2n ** BigInt(LIMIT);
    const checks = BigInt(LIMIT) * masks;
    return [
      table(
        ["N", "부분집합의 개수", "집을 검사한 횟수(실측)", "N × 2^N"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(LIMIT)} 을 닫힌 형태에 넣으면`,
      table(
        [
          "  부분집합의 개수",
          `2^${num(LIMIT)} — ${num(digits(masks))} 자리 수`,
        ],
        [
          [
            "  집을 검사한 횟수",
            `${num(LIMIT)} × 2^${num(LIMIT)} — ${num(digits(checks))} 자리 수`,
          ],
          [
            "  초당 1 억 번 기준",
            `${num(digits(checks / 100_000_000n))} 자리 수의 초`,
          ],
        ],
        ["l", "r"],
      ),
      "  └ 세 규모에서 실측이 N × 2^N 과 같으므로 마지막 세 줄도 그 식으로 낸 값이다",
    ].join("\n");
  },

  /** `deep.build` ③ — 갈래를 다 펴면 같은 물음이 몇 번 나오는가. */
  "subproblem-repeat": () => {
    const small = [2, 7, 9, 3];
    const { at, empty } = callMultiplicity(small.length);
    const rows = at.map((times, i) => [`  집 ${i} 까지`, num(times)]);
    rows.push(["  집이 없을 때", num(empty)]);
    const total = at.reduce((a, b) => a + b, 0) + empty;
    const scaleRows = RECURSION_SCALE.map((n) => [
      num(n),
      num(n + 1),
      num(recursionCalls(n)),
    ]);
    return [
      `${show(small)} 에서 물음이 몇 번 나오는가`,
      table(["  물음", "부른 횟수"], rows, ["l", "r"]),
      `  물음의 종류 ${at.length + 1} 개를 ${num(total)} 번 불렀다`,
      "",
      table(["N", "물음의 종류", "부른 횟수"], scaleRows, ["r", "r", "r"]),
      "",
      "└ 물음의 종류는 집의 수보다 하나 많을 뿐인데 부른 횟수는 그보다 훨씬 빨리 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 덧셈·비교 횟수. */
  "cost-two-ways": () => {
    const all = byAllSubsets(WALK);
    const carry = byCarrying(WALK);
    assertSame(WALK, all.answer);
    assertSame(WALK, carry.answer);
    const rows = [
      [
        "부분집합을 다 만들어 이웃이 섞인 것을 버린다",
        num(all.adds),
        num(all.cmps),
        num(all.adds + all.cmps),
      ],
      [
        "집마다 직전 두 답을 이어받는다",
        num(carry.adds),
        num(carry.cmps),
        num(carry.adds + carry.cmps),
      ],
    ];
    return [
      table(
        [`방식 (N = ${WALK.length})`, "덧셈", "비교", "기본 연산 합"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(LIMIT)} 이면`,
      table(
        [
          "  부분집합을 다 만들기",
          `${num(digits(BigInt(LIMIT) * 2n ** BigInt(LIMIT)))} 자리 수`,
        ],
        [["  직전 두 답 이어받기", num(2 * (LIMIT - 1))]],
        ["l", "r"],
      ),
      "  └ 위는 부분집합의 개수를 따라 늘고, 아래는 집의 수만 따라 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 짝수 번째와 홀수 번째 중 큰 쪽을 고르는 후보가 어디서 어긋나는가. */
  "carry-alternating": () => {
    const { rows, gaps } = contrast(ALTERNATING_CASES, byAlternating);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("한 칸 걸러 고른 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 전개 입력에서 이미 어긋난다. 답이 되는 집의 번호가 짝수와 홀수에 섞여 있으면 틀린다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 몇 칸 앞의 답을 이어받아야 하는가를 네 가지로 두고 대조한다. */
  "state-span": () => {
    const heads = ["1 칸 앞", "2 칸 앞", "3 칸 앞", "표 전체"];
    const impls = [
      (nums: number[]) => carrySpan(nums, 1),
      (nums: number[]) => carrySpan(nums, 2),
      (nums: number[]) => carrySpan(nums, 3),
      byTable,
    ];
    const wrong = [0, 0, 0, 0];
    const rows = SPAN_CASES.map((nums) => {
      const bare = houseRobber([...nums]);
      const cells = impls.map((f, k) => {
        const got = f([...nums]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return num(got);
      });
      return [show(nums), num(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(LIMIT)} 에서 쓰는 칸`,
      "",
      "1",
      "2",
      "3",
      num(LIMIT),
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r", "r"]),
      "",
      "└ 1 칸 앞은 옆집을 함께 고르고, 3 칸 앞은 고를 수 있는 집을 놓친다.",
      "  어긋나지 않는 가장 작은 상태가 2 칸이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 값이 큰 집부터 고르면 무엇이 달라지는가. */
  "pause-greedy": () => {
    const { rows, gaps } = contrast(GREEDY_CASES, byGreedy);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("큰 집부터 고른 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 전개 입력에서는 답이 같다. 가장 큰 집 하나가 답이 되는 집 둘 사이에 낀 입력에서 어긋난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 고른 답을 옆집까지 담은 답에서 이어받으면 무엇이 달라지는가. */
  "pause-adjacent": () => {
    const { rows, gaps } = contrast(ADJACENT_CASES, (nums) =>
      adjacentAllowed.houseRobber(nums),
    );
    assertBreaks(gaps);
    const total = WALK.reduce((a, b) => a + b, 0);
    return [
      table(CONTRAST_HEAD("옆집 답에서 이어받은 값"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 전개 입력에서 ${num(total)} 이 나오고, 그것은 여섯 집의 값을 전부 더한 수다.`,
      "  집이 하나거나 값이 전부 0 이면 더해도 달라지는 것이 없어 답이 같다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 점화식을 재귀로 그대로 옮기면 무엇이 달라지는가. */
  "pause-recursion": () => {
    const sameRows = RECURSION_SAME.map((c) => {
      const bare = houseRobber([...c.nums]);
      const got = byMemoRecursion([...c.nums]);
      return [c.name, num(bare), num(got), bare === got ? "같다" : "틀리다"];
    });
    const callRows = RECURSION_SCALE.map((n) => [
      num(n),
      num(recursionCalls(n)),
      num(2 * (n - 1)),
    ]);
    const depthRows = DEPTH_SCALE.map((n) => {
      const nums = new Array<number>(n).fill(1);
      try {
        return [num(n), `답 ${num(byMemoRecursion(nums))} 이 나온다`];
      } catch {
        return [num(n), "재귀 깊이를 넘어 답이 안 나온다"];
      }
    });
    return [
      "작은 입력에서는 답이 같다 — 메모를 붙인 재귀",
      table(CONTRAST_HEAD("재귀가 낸 답"), sameRows, ["l", "r", "r", "l"]),
      "",
      "메모를 안 붙였을 때의 호출 수",
      table(["  N", "재귀 호출(실측)", "순회의 기본 연산"], callRows, [
        "r",
        "r",
        "r",
      ]),
      "",
      "메모를 붙였을 때 제약 규모까지 실행되는가",
      table(["  N", "판정"], depthRows, ["r", "l"]),
      "",
      "└ 메모가 호출 수를 집의 수만큼으로 줄이지만 재귀 깊이는 그대로 집의 수다",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 순회한 걸음별 상태값. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let prev = 0;
    let cur = WALK[0] as number;
    rows.push([
      "T1",
      "0",
      String(WALK[0]),
      "—",
      "—",
      String(prev),
      String(cur),
    ]);
    for (let i = 1; i < WALK.length; i++) {
      const skip = cur;
      const take = prev + (WALK[i] as number);
      prev = cur;
      cur = Math.max(skip, take);
      rows.push([
        `T${i + 1}`,
        String(i),
        String(WALK[i]),
        String(skip),
        String(take),
        String(prev),
        String(cur),
      ]);
    }
    assertSame(WALK, cur);
    return [
      table(
        ["걸음", "i", "A[i]", "건너뛴 답", "고른 답", "prev", "cur"],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ cur 는 한 번도 작아지지 않는다. 마지막 걸음의 cur 가 답이고 그 값은 ${cur} 이다`,
    ].join("\n");
  },

  /** `deep.walk.step` — 두 갈래가 각각 어느 걸음에서 골라졌는가. */
  "walk-branches": () => {
    const skipAt: string[] = [];
    const takeAt: string[] = [];
    const ties: string[] = [];
    let prev = 0;
    let cur = WALK[0] as number;
    for (let i = 1; i < WALK.length; i++) {
      const step = `T${i + 1}`;
      const skip = cur;
      const take = prev + (WALK[i] as number);
      if (skip >= take) skipAt.push(step);
      if (take >= skip) takeAt.push(step);
      if (skip === take) ties.push(step);
      prev = cur;
      cur = Math.max(skip, take);
    }
    const rows = [
      ["집 i 를 건너뛴다", skipAt.join(" ") || "없다"],
      ["집 i 를 고른다", takeAt.join(" ") || "없다"],
      ["두 답이 같다", ties.join(" ") || "없다"],
    ];
    return [
      table(["고른 갈래", "그 갈래가 골라진 걸음"], rows, ["l", "l"]),
      "",
      "└ 두 갈래가 각각 한 번 이상 골라졌다.",
      `  두 답이 같아지는 걸음은 ${ties.length === 0 ? "이 입력에 없다" : `${ties.join(" ")} 이다`}`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의로 센 값과 점화식이 낸 값을 맞춘다. */
  "math-check": () => {
    const lines: string[] = [];
    const target = 2;
    lines.push(
      `집 ${target} 까지에서 인접 쌍을 안 담는 부분집합을 전부 만든다`,
    );
    lines.push("");
    for (const s of admissible(target)) {
      const label = s.length === 0 ? "{}" : `{${s.join(", ")}}`;
      let sum = 0;
      for (const k of s) sum += WALK[k] as number;
      const terms =
        s.length === 0 ? "0" : s.map((k) => String(WALK[k])).join(" + ");
      lines.push(`  ${padRight(label, 9)} 합 ${padRight(terms, 9)} = ${sum}`);
    }
    const rows: string[][] = [];
    let prev = 0;
    let cur = WALK[0] as number;
    for (let i = 0; i < WALK.length; i++) {
      if (i > 0) {
        const skip = cur;
        const take = prev + (WALK[i] as number);
        prev = cur;
        cur = Math.max(skip, take);
      }
      rows.push([
        String(i),
        num(admissible(i).length),
        String(defined(WALK, i)),
        String(cur),
      ]);
    }
    return [
      ...lines,
      "",
      table(["i", "부분집합의 개수", "정의로 센 f(i)", "점화식의 cur"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 두 열이 여섯 집에서 모두 같다. 부분집합을 다 펴서 센 값과 두 답만 본 값이 어긋나지 않는다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣으면 후보의 개수가 몇 자리가 되는가. */
  "math-count": () => {
    const rows = [0, 1, 2, 3, 4, 5].map((i) => [
      String(i),
      String(i + 1),
      num(admissible(i).length),
      `F(${i + 3}) = ${fib(i + 3)}`,
    ]);
    const n = LIMIT;
    const candidates = fib(n + 2);
    const allSubsets = 2n ** BigInt(n);
    return [
      table(["i", "집의 수", "부분집합의 개수(실측)", "피보나치"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `제약 규모 N = ${num(n)} 에서`,
      table(
        [
          "  인접 쌍을 안 담는 부분집합",
          `F(${num(n + 2)}) — ${num(digits(candidates))} 자리 수`,
        ],
        [
          [
            "  모든 부분집합",
            `2^${num(n)} — ${num(digits(allSubsets))} 자리 수`,
          ],
          ["  고를 수 있는 집의 최대 개수", num(Math.ceil(n / 2))],
          ["  답의 상한", num(Math.ceil(n / 2) * CASH_MAX)],
          ["  두 답을 이어받는 절차의 기본 연산", num(2 * (n - 1))],
        ],
        ["l", "r"],
      ),
      `  └ 인접 조건으로 후보를 걸러도 자릿수가 ${num(digits(allSubsets))} 에서 ${num(digits(candidates))} 로 줄 뿐이라 여전히 셀 수 없다`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력에서 두 값이 어떻게 정해지는가. */
  "invariant-edges": () => {
    const rows = EDGE_CASES.map(([name, nums]) => {
      if (nums.length === 0) {
        return [name, show(nums), "—", "—", num(houseRobber([...nums]))];
      }
      let prev = 0;
      let cur = nums[0] as number;
      for (let i = 1; i < nums.length; i++) {
        const skip = cur;
        const take = prev + (nums[i] as number);
        prev = cur;
        cur = Math.max(skip, take);
      }
      return [
        name,
        show(nums),
        num(prev),
        num(cur),
        num(houseRobber([...nums])),
      ];
    });
    return [
      table(["경계", "입력", "끝난 뒤 prev", "끝난 뒤 cur", "답"], rows, [
        "l",
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 집이 없으면 루프에 들어가기 전에 0 이 나가고, 집이 하나면 루프가 한 번도 실행되지 않는다",
    ].join("\n");
  },

  /** `invariant` ③ — 두 값을 옮기지 않으면 무엇이 나오는가. */
  "mutant-prev-frozen": () => {
    const { rows, gaps } = contrast(PREV_CASES, (nums) =>
      prevFrozen.houseRobber(nums),
    );
    assertBreaks(gaps);
    const good: number[] = [];
    const bad: number[] = [];
    let gPrev = 0;
    let gCur = WALK[0] as number;
    let bPrev = 0;
    let bCur = WALK[0] as number;
    good.push(gPrev);
    bad.push(bPrev);
    for (let i = 1; i < WALK.length; i++) {
      const gSkip = gCur;
      const gTake = gPrev + (WALK[i] as number);
      gPrev = gCur;
      gCur = Math.max(gSkip, gTake);
      const bSkip = bCur;
      const bTake = bPrev + (WALK[i] as number);
      bCur = Math.max(bSkip, bTake);
      good.push(gPrev);
      bad.push(bPrev);
    }
    return [
      table(CONTRAST_HEAD("옮기기를 뺀 답"), rows, ["l", "r", "r", "l"]),
      "",
      `${show(WALK)} 에서 걸음마다의 prev`,
      table(
        ["  집 번호", ...WALK.map((_, i) => String(i))],
        [
          ["  정본의 prev", ...good.map(num)],
          ["  옮기기를 뺀 prev", ...bad.map(num)],
        ],
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "  └ 아래 줄은 끝까지 0 이라 「집 i−1 까지의 답」이라는 뜻을 잃는다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 덧셈과 비교가 드는가. */
  "perf-count": () => {
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
        "1",
        String(2 * (n - 1)),
      ],
      ["반환", `T${n + 1}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(carry.adds + carry.cmps)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "걸음마다 덧셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 덧셈 ${carry.adds} 번과 비교 ${carry.cmps} 번이고, 둘 다 집의 수 ${n} 에서만 나온 수다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["값이 전부 0 이다", Array.from({ length: n }, () => 0)],
      [
        "값이 전부 최댓값 10,000 이다",
        Array.from({ length: n }, () => CASH_MAX),
      ],
      [
        "0 과 1 이 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 1 : 0)),
      ],
      [
        "한 집만 최댓값이고 나머지는 0 이다",
        Array.from({ length: n }, (_, k) => (k === n - 1 ? CASH_MAX : 0)),
      ],
      ["값이 1 부터 차례로 커진다", Array.from({ length: n }, (_, k) => k + 1)],
    ];
    const rows = shapes.map(([name, nums]) => {
      const carry = byCarrying(nums);
      assertSame(nums, carry.answer);
      return [
        name,
        num(carry.adds),
        num(carry.cmps),
        num(carry.adds + carry.cmps),
        num(carry.answer),
      ];
    });
    return [
      table(
        [`입력의 모양 (N = ${num(n)})`, "덧셈", "비교", "기본 연산", "답"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "가운데 세 열이 다섯 줄 다 같고 오른쪽 열만 다르다",
      "값이 무엇이든 집 하나마다 덧셈 한 번과 비교 한 번을 한다",
    ].join("\n");
  },
};
