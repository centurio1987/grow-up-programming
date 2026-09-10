/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts kadane-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { kadane } from "./kadane-guide.ref.ts";

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
 * 두 갈래가 다 실행되고(칸 1·3 에서 새로 시작, 나머지에서 이어 붙이기), 음수가 셋 섞여 있고,
 * **답이 마지막 칸이 아니라 칸 6 에서 만들어진다** — 마지막 값을 답으로 착각하는 자리가
 * 실제로 드러나는 입력이다.
 */
const WALK: number[] = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

/** 제약의 최댓값. */
const LIMIT = 100_000;

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  adds: number;
  cmps: number;
}

/**
 * 모든 `(l, r)` 쌍을 다 더하는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고, 덧셈과
 * 비교를 함께 센다 — 쌍 하나마다 덧셈 한 번과 비교 한 번이다.
 */
function byAllPairs(A: number[]): Counted {
  let best = A[0] as number;
  let adds = 0;
  let cmps = 0;
  for (let l = 0; l < A.length; l++) {
    let s = 0;
    for (let r = l; r < A.length; r++) {
      adds++;
      s += A[r] as number;
      cmps++;
      best = Math.max(best, s);
    }
  }
  return { answer: best, adds, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 칸 하나마다 덧셈 한 번(이어 붙이기)과 비교 두
 * 번(갈래 고르기 · 최댓값 갱신)이다.
 */
function byCarrying(A: number[]): Counted {
  let prev = A[0] as number;
  let best = A[0] as number;
  let adds = 0;
  let cmps = 0;
  for (let i = 1; i < A.length; i++) {
    adds++;
    const joined = prev + (A[i] as number);
    cmps++;
    prev = Math.max(A[i] as number, joined);
    cmps++;
    best = Math.max(best, prev);
  }
  return { answer: best, adds, cmps };
}

/**
 * 가장 단순한 후보 — **누적이 음수가 되면 0 으로 끊고 다시 시작하는** 절차.
 *
 * 0 에서 출발하므로 「아무 칸도 안 고른다」가 후보에 들어가고, 그것이 이 문제에서는 금지된
 * 빈 부분 배열이다.
 */
function resetAtZero(A: number[]): number {
  let s = 0;
  let best = 0;
  for (const x of A) {
    s = Math.max(0, s + x);
    best = Math.max(best, s);
  }
  return best;
}

/** 상태를 하나도 안 들고 가는 후보 — 가장 큰 원소 하나를 답으로 낸다. */
function biggestElement(A: number[]): number {
  let best = A[0] as number;
  for (const x of A) best = Math.max(best, x);
  return best;
}

/** 직전 최대합만 들고 가는 후보 — 마지막 칸의 값을 답으로 낸다. */
function lastCellOnly(A: number[]): number {
  let prev = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    prev = Math.max(A[i] as number, prev + (A[i] as number));
  }
  return prev;
}

/** 칸 `N` 개를 그대로 잡는 후보 — dp 배열을 다 만든 뒤 최댓값을 고른다. */
function dpArray(A: number[]): number {
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
 * 수 없어 여기 따로 적는다. 나머지는 정본과 같다.
 */
function bestBeforePrev(A: number[]): number {
  let prev = A[0] as number;
  let best = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    best = Math.max(best, prev);
    prev = Math.max(A[i] as number, prev + (A[i] as number));
  }
  return best;
}

/** 접두사 합 `P[0] = 0`, `P[j] = A[0] + … + A[j−1]`. `deep.math` 의 검산이 쓴다. */
function prefixSums(A: number[]): number[] {
  const P = [0];
  for (const x of A) P.push((P[P.length - 1] as number) + x);
  return P;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  kadane(A: number[]): number;
}

const REF = new URL("./kadane-guide.ref.ts", import.meta.url).pathname;

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

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  A: number[];
}

const NAMED = (A: number[]): Case => ({ name: show(A), A });

/** 「0 을 답으로 채택하는가」를 가르는 목록. 두 후보가 같은 자리에서 갈리므로 함께 쓴다. */
const ZERO_CASES: Case[] = [
  { name: `전개 입력 ${show(WALK)}`, A: WALK },
  NAMED([-3, -1, -4, -2]),
  NAMED([-7]),
  NAMED([-1, 0, -2]),
];

const LAST_CASES: Case[] = [
  { name: `전개 입력 ${show(WALK)}`, A: WALK },
  NAMED([1, 2, 3, 4, 5]),
  NAMED([10, -1, -1, -100]),
  NAMED([-3, -1, -4, -2]),
  NAMED([7]),
];

const ORDER_CASES: Case[] = [
  { name: `전개 입력 ${show(WALK)}`, A: WALK },
  NAMED([-1, -1, 5]),
  NAMED([1, 2, 3]),
  NAMED([7]),
];

const JOIN_CASES: Case[] = [
  { name: `전개 입력 ${show(WALK)}`, A: WALK },
  NAMED([1, 2, 3, 4, 5]),
  NAMED([-3, -1, -4, -2]),
  NAMED([10, -1, -1, -100]),
  NAMED([5, -3, 5]),
];

const STATE_CASES: number[][] = [
  WALK,
  [1, 2, 3, 4, 5],
  [-3, -1, -4, -2],
  [10, -1, -1, -100],
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 9, 64, 1000];

/** 답이 안 바뀐 자리와 바뀐 자리를 함께 보인다. 하나도 안 바뀌면 「깨진다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(A: number[], got: number): number {
  const want = kadane([...A]);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
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

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 덧셈·비교 횟수. */
  "cost-two-ways": () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    assertSame(WALK, pairs.answer);
    assertSame(WALK, carry.answer);
    const rows = [
      [
        "모든 (l, r) 쌍의 합을 각각 만든다",
        num(pairs.adds),
        num(pairs.cmps),
        num(pairs.adds + pairs.cmps),
      ],
      [
        "칸마다 직전 결과를 이어받는다",
        num(carry.adds),
        num(carry.cmps),
        num(carry.adds + carry.cmps),
      ],
    ];
    const n = LIMIT;
    return [
      table(
        [`방식 (N = ${WALK.length})`, "덧셈", "비교", "기본 연산 합"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(n)} 이면`,
      table(
        ["  모든 쌍의 합", num(n * (n + 1))],
        [["  직전 결과 이어받기", num(3 * (n - 1))]],
        ["l", "r"],
      ),
      "  └ 위는 쌍의 개수를 따라 늘고, 아래는 칸 수만 따라 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 누적이 음수면 0 으로 끊는 후보가 어디서 어긋나는가. */
  "cost-reset-zero": () => {
    const rows = ZERO_CASES.map((c) => {
      const bare = kadane([...c.A]);
      const got = resetAtZero([...c.A]);
      return [
        c.name,
        String(bare),
        String(got),
        bare === got ? "같다" : "틀리다",
      ];
    });
    return [
      table(["입력", "정본이 낸 답", "0 으로 끊은 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 아래 두 줄에서 0 이 나온다. 0 은 아무 칸도 안 고른 답이라 이 문제에서는 후보가 아니다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 들고 가는 상태의 칸 수를 네 값으로 두고 답을 대조한다. */
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
      `N = ${num(LIMIT)} 에서 쓰는 칸`,
      "",
      "1",
      "1",
      "2",
      num(LIMIT),
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r", "r"]),
      "",
      "└ 칸 하나짜리 후보 둘은 어긋나는 입력이 남는다. 어긋나지 않는 가장 작은 상태가 칸 둘이다",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 순회한 걸음별 상태값. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let prev = WALK[0] as number;
    let best = WALK[0] as number;
    rows.push([
      "T1",
      "0",
      String(WALK[0]),
      "—",
      "—",
      "—",
      String(prev),
      String(best),
    ]);
    for (let i = 1; i < WALK.length; i++) {
      const fresh = WALK[i] as number;
      const joined = prev + fresh;
      prev = Math.max(fresh, joined);
      best = Math.max(best, prev);
      rows.push([
        `T${i + 1}`,
        String(i),
        String(fresh),
        String(fresh),
        String(joined),
        fresh >= joined ? "새로 시작" : "이어 붙이기",
        String(prev),
        String(best),
      ]);
    }
    assertSame(WALK, best);
    return [
      table(
        [
          "걸음",
          "i",
          "A[i]",
          "새로 시작",
          "이어 붙이기",
          "고른 갈래",
          "prev",
          "best",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l", "r", "r"],
      ),
      "",
      `└ best 가 마지막으로 커지는 곳은 칸 6 이고, 그 뒤 두 걸음은 prev 만 바뀐다. 답은 ${best} 이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 번째 상태를 0 에서 시작하면 무엇이 달라지는가. */
  "pause-best-zero": () => {
    const { rows, gaps } = contrast(ZERO_CASES, (A) => bestFromZero.kadane(A));
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("0 에서 시작한 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 양수가 하나라도 있으면 답이 같다. 전부 음수인 입력에서만 0 이 나온다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 마지막 칸의 값을 답으로 내면 무엇이 달라지는가. */
  "pause-answer-last": () => {
    const { rows, gaps } = contrast(LAST_CASES, (A) => returnsLast.kadane(A));
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("마지막 칸의 값"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 답이 마지막 칸에서 끝나는 입력에서는 같다. 답이 배열 가운데에서 끝나면 어긋난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 줄의 순서를 맞바꾸면 무엇이 달라지는가. */
  "pause-swap-order": () => {
    const { rows, gaps } = contrast(ORDER_CASES, (A) => bestBeforePrev(A));
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("순서를 바꾼 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 첫 줄은 답이 같다 — 최댓값이 칸 6 에서 만들어져 마지막 한 걸음의 차례가 바뀌어도 살아남는다",
    ].join("\n");
  },

  /** `invariant` ③ — 갈래를 고르지 않고 이어 붙이기만 하면 무엇이 나오는가. */
  "mutant-always-join": () => {
    const { rows, gaps } = contrast(JOIN_CASES, (A) => alwaysJoin.kadane(A));
    assertBreaks(gaps);
    const P = prefixSums(WALK);
    return [
      table(CONTRAST_HEAD("이어 붙이기만 한 답"), rows, ["l", "r", "r", "l"]),
      "",
      `첫 줄에서 나온 값들 ${show(P.slice(1))} 은 A[0] 부터 각 칸까지의 합이다`,
      `└ 갈래를 안 고르면 prev 가 「칸 i 에서 끝나는 최대합」이 아니라 「칸 0 에서 시작한 합」이 된다`,
    ].join("\n");
  },

  /** `deep.math` ② — 접두사 합으로 세운 정의를 작은 값에 넣어 확인한다. */
  "math-prefix": () => {
    const P = prefixSums(WALK);
    const cells = P.map((v, j) => {
      const w = Math.max(String(j).length, String(v).length);
      return [padLeft(String(j), w), padLeft(String(v), w)] as const;
    });
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
      `칸 번호 j   ${cells.map((c) => c[0]).join("  ")}`,
      `P[j]        ${cells.map((c) => c[1]).join("  ")}`,
      "",
      table(["i", "P[i+1]", "앞쪽 최솟값", "그 최솟값의 j", "그 차이"], rows, [
        "r",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `└ 칸 3 부터는 앞쪽 최솟값이 P[3] = ${Math.min(...P.slice(0, 9))} 하나로 고정되고, 가장 큰 차이는 칸 6 의 ${kadane([...WALK])} 이다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const A = Array.from({ length: n }, (_, k) => ((k * 37) % 21) - 10);
      const pairs = byAllPairs(A);
      const carry = byCarrying(A);
      assertSame(A, pairs.answer);
      assertSame(A, carry.answer);
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
    const n = LIMIT;
    return [
      table(
        [
          "N",
          "부분 배열 수(실측)",
          "모든 쌍(실측)",
          "N(N+1)",
          "이어받기(실측)",
          "3N − 3",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(n)} 을 두 식에 넣으면`,
      table(
        ["  N(N+1)", num(n * (n + 1))],
        [
          ["  3N − 3", num(3 * n - 3)],
          [
            "  두 값의 비",
            `${num(Math.round((n * (n + 1)) / (3 * n - 3)))} 배`,
          ],
        ],
        ["l", "r"],
      ),
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
        "2",
        String(3 * (n - 1)),
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
      `└ 덧셈 ${carry.adds} 번과 비교 ${carry.cmps} 번이고, 둘 다 칸 수 ${n} 에서만 나온 수다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["전부 10,000 이다", Array.from({ length: n }, () => 10_000)],
      ["전부 -10,000 이다", Array.from({ length: n }, () => -10_000)],
      [
        "10,000 과 -10,000 이 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 10_000 : -10_000)),
      ],
      [
        "한 칸만 10,000 이고 나머지는 0 이다",
        Array.from({ length: n }, (_, k) => (k === n - 1 ? 10_000 : 0)),
      ],
    ];
    const rows = shapes.map(([name, A]) => {
      const carry = byCarrying(A);
      assertSame(A, carry.answer);
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
      "가운데 세 열이 네 줄 다 같고 오른쪽 열만 다르다",
      `제약 최댓값에서 답이 가장 커지는 입력은 ${num(LIMIT)} 칸이 전부 10,000 인 것이고, 그때 답은 ${num(LIMIT * 10_000)} 이다`,
    ].join("\n");
  },
};
