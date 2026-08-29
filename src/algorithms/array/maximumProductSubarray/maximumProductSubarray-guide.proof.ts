/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts maximumProductSubarray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { maximumProductSubarray } from "./maximumProductSubarray-guide.ref.ts";

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

/** 천 단위 구분. 본문 표기와 같다. 표현 범위를 넘은 값은 그대로 적는다. */
const num = (n: number): string =>
  Number.isFinite(n) ? n.toLocaleString("en-US") : String(n);

/** `[3 -4 7]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
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
 * 후보 셋이 최댓값 쪽에서도 최솟값 쪽에서도 각각 한 번 이상 골라져야 하고(칸 1·2·3), 음수 둘이
 * 곱해져 양수가 되는 자리가 있어야 하고(칸 2), 0 을 지나는 자리가 있어야 하고(칸 4),
 * **답이 마지막 칸이 아니라 칸 3 에서 만들어져야** 한다 — 마지막 값을 답으로 착각하는 자리가
 * 실제로 확인되는 입력이다.
 */
const WALK: number[] = [2, -3, -2, 4, 0, -1];

/** 제약의 최댓값. */
const LIMIT = 100_000;

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/** 가장 단순한 방법의 규모를 실제로 잴 수 있는 지점들. */
const NAIVE_SCALE = [6, 100, 1000];

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  muls: number;
  cmps: number;
}

/**
 * 모든 `(l, r)` 쌍의 곱을 다 만드는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고,
 * 곱셈과 비교를 함께 센다 — 쌍 하나마다 곱셈 한 번과 비교 한 번이다.
 */
function byAllPairs(A: number[]): Counted {
  let best = A[0] as number;
  let muls = 0;
  let cmps = 0;
  for (let l = 0; l < A.length; l++) {
    let p = 1;
    for (let r = l; r < A.length; r++) {
      muls++;
      p *= A[r] as number;
      cmps++;
      best = Math.max(best, p);
    }
  }
  return { answer: best, muls, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 칸 하나마다 곱셈 두 번(이어 붙이기 둘)과 비교 다섯
 * 번(최댓값 셋 중 둘 · 최솟값 셋 중 둘 · 전체 최댓값 갱신 하나)이다.
 */
function byCarrying(A: number[]): Counted {
  let curMax = A[0] as number;
  let curMin = A[0] as number;
  let best = A[0] as number;
  let muls = 0;
  let cmps = 0;
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    muls += 2;
    const grown = curMax * x;
    const flipped = curMin * x;
    cmps += 2;
    curMax = Math.max(x, grown, flipped);
    cmps += 2;
    curMin = Math.min(x, grown, flipped);
    cmps += 1;
    best = Math.max(best, curMax);
  }
  return { answer: best, muls, cmps };
}

/** 상태를 하나도 안 이어받는 후보 — 가장 큰 원소 하나를 답으로 낸다. */
function biggestElement(A: number[]): number {
  let best = A[0] as number;
  for (const x of A) best = Math.max(best, x);
  return best;
}

/** 최댓값 하나만 이어받는 후보 — 합의 절차를 곱에 그대로 옮긴 것이다. */
function maxOnly(A: number[]): number {
  let cur = A[0] as number;
  let best = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    cur = Math.max(x, cur * x);
    best = Math.max(best, cur);
  }
  return best;
}

/** 칸 `N` 개짜리 배열 둘을 그대로 잡는 후보 — mx 와 mn 을 다 만든 뒤 최댓값을 고른다. */
function dpArrays(A: number[]): number {
  const n = A.length;
  const mx = new Array<number>(n);
  const mn = new Array<number>(n);
  mx[0] = A[0] as number;
  mn[0] = A[0] as number;
  for (let i = 1; i < n; i++) {
    const x = A[i] as number;
    const grown = (mx[i - 1] as number) * x;
    const flipped = (mn[i - 1] as number) * x;
    mx[i] = Math.max(x, grown, flipped);
    mn[i] = Math.min(x, grown, flipped);
  }
  let best = mx[0] as number;
  for (const v of mx) best = Math.max(best, v);
  return best;
}

/** 정의 그대로 — 오른쪽 끝이 칸 `i` 인 후보들의 곱을 왼쪽 끝별로 전부 만든다. */
function endingAt(A: number[], i: number): { l: number; p: number }[] {
  const out: { l: number; p: number }[] = [];
  for (let l = 0; l <= i; l++) {
    let p = 1;
    for (let k = l; k <= i; k++) p *= A[k] as number;
    out.push({ l, p });
  }
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  maximumProductSubarray(A: number[]): number;
}

const REF = new URL("./maximumProductSubarray-guide.ref.ts", import.meta.url)
  .pathname;

/** 최댓값의 후보에서 「칸 i 하나로 새로 시작」을 뺀 사본. */
const dropFresh = await loadMutant<Impl>(REF, {
  swap: [
    /curMax = Math\.max\(x, grown, flipped\);/,
    "curMax = Math.max(grown, flipped);",
  ],
});

/** 최솟값을 정할 때 **이미 갱신된** curMax 를 쓰는 사본. */
const staleMax = await loadMutant<Impl>(REF, {
  swap: [
    /curMin = Math\.min\(x, grown, flipped\);/,
    "curMin = Math.min(x, curMax * x, flipped);",
  ],
});

/**
 * 최솟값이 직전 최솟값을 이어받는 후보를 잃은 사본. 불변식의 최솟값 절반을 지키던 바로
 * 그 줄이다.
 */
const minNoCarry = await loadMutant<Impl>(REF, {
  swap: [
    /curMin = Math\.min\(x, grown, flipped\);/,
    "curMin = Math.min(x, grown);",
  ],
});

/** 마지막 칸의 최댓값을 그대로 답으로 내는 사본. */
const returnsLast = await loadMutant<Impl>(REF, {
  swap: [/return best;/, "return curMax;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  A: number[];
}

const NAMED = (A: number[]): Case => ({ name: show(A), A });
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, A: WALK };

const FRESH_CASES: Case[] = [
  WALK_CASE,
  NAMED([2, 0, 3]),
  NAMED([0, 5]),
  NAMED([1, -2, 3]),
  NAMED([-10, -10]),
];

const STALE_CASES: Case[] = [
  WALK_CASE,
  NAMED([-7, 2, -1, -8]),
  NAMED([1, -2, -3, -4]),
  NAMED([2, 3, 4]),
  NAMED([-10, -10]),
];

const LAST_CASES: Case[] = [
  WALK_CASE,
  NAMED([2, 3, -2, 4]),
  NAMED([1, 2, 3]),
  NAMED([-10, -10]),
  NAMED([-2]),
];

const CARRY_CASES: Case[] = [
  WALK_CASE,
  NAMED([3, -2, -5]),
  NAMED([-2, 3, -4]),
  NAMED([2, 3, 4]),
  NAMED([1, 2, 3]),
];

const MIN_CARRY_CASES: Case[] = [
  WALK_CASE,
  NAMED([-3, 2, 5, -4]),
  NAMED([-2, 3, 3, -3]),
  NAMED([2, 3, 4]),
  NAMED([-10, -10]),
];

const STATE_CASES: number[][] = [WALK, [3, -2, -5], [2, 0, 3], [-4, -3, -2]];

/** 불변식이 경계에서도 유지되는지 값으로 본다. */
const EDGE_CASES: [string, number[]][] = [
  ["칸이 하나이고 값이 양수다", [7]],
  ["칸이 하나이고 값이 음수다", [-7]],
  ["칸이 하나이고 값이 0 이다", [0]],
  ["칸이 둘이다", [-10, -10]],
  ["값이 전부 음수다", [-4, -3, -2]],
  ["값이 전부 양수다", [2, 3, 4]],
  ["값이 전부 0 이다", [0, 0, 0]],
  ["0 이 가운데를 끊는다", [-2, 0, -1]],
  ["값이 전부 최댓값 10 이다", [10, 10, 10]],
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
function assertSame(A: number[], got: number): number {
  const want = maximumProductSubarray([...A]);
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
    const bare = maximumProductSubarray([...c.A]);
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

/** 전부 10 인 배열의 답이 정확한 정수와 어긋나는 첫 칸 수. */
function firstInexact(): number {
  for (let k = 1; k <= 400; k++) {
    const got = maximumProductSubarray(new Array<number>(k).fill(10));
    if (!Number.isFinite(got)) return k;
    if (BigInt(got) !== 10n ** BigInt(k)) return k;
  }
  throw new Error("400 칸까지 값이 정확했다 — 전제가 바뀌었다");
}

/** 전부 10 인 배열이 표현 범위를 넘는 첫 칸 수. */
function firstOverflow(): number {
  for (let k = 1; k <= 400; k++) {
    if (
      !Number.isFinite(maximumProductSubarray(new Array<number>(k).fill(10)))
    ) {
      return k;
    }
  }
  throw new Error("400 칸까지 표현 범위를 넘지 않았다 — 전제가 바뀌었다");
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 모든 쌍을 만드는 방식이 규모마다 몇 번의 연산을 하는가. */
  "naive-cost": () => {
    const rows = NAIVE_SCALE.map((n) => {
      const A = Array.from({ length: n }, (_, k) => ((k * 37) % 21) - 10);
      const pairs = byAllPairs(A);
      assertSame(A, pairs.answer);
      return [
        num(n),
        num((n * (n + 1)) / 2),
        num(pairs.muls + pairs.cmps),
        num(n * (n + 1)),
      ];
    });
    const n = LIMIT;
    return [
      table(["N", "쌍의 개수", "기본 연산(실측)", "N(N+1)"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `제약 규모 N = ${num(n)} 을 닫힌 형태에 넣으면`,
      table(
        ["  쌍의 개수", num((n * (n + 1)) / 2)],
        [
          ["  기본 연산", num(n * (n + 1))],
          ["  초당 1 억 번 기준", `${num(Math.round((n * (n + 1)) / 1e8))} 초`],
        ],
        ["l", "r"],
      ),
      "  └ 세 규모에서 실측이 N(N+1) 과 같으므로 마지막 줄도 그 식으로 낸 값이다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 곱셈·비교 횟수. */
  "cost-two-ways": () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    assertSame(WALK, pairs.answer);
    assertSame(WALK, carry.answer);
    const rows = [
      [
        "모든 (l, r) 쌍의 곱을 각각 만든다",
        num(pairs.muls),
        num(pairs.cmps),
        num(pairs.muls + pairs.cmps),
      ],
      [
        "칸마다 직전 결과를 이어받는다",
        num(carry.muls),
        num(carry.cmps),
        num(carry.muls + carry.cmps),
      ],
    ];
    const n = LIMIT;
    return [
      table(
        [`방식 (N = ${WALK.length})`, "곱셈", "비교", "기본 연산 합"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = ${num(n)} 이면`,
      table(
        ["  모든 쌍의 곱", num(n * (n + 1))],
        [["  직전 결과 이어받기", num(7 * (n - 1))]],
        ["l", "r"],
      ),
      "  └ 위는 쌍의 개수를 따라 늘고, 아래는 칸 수만 따라 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 최댓값 하나만 이어받는 후보가 어디서 어긋나는가. */
  "carry-max-only": () => {
    const { rows, gaps } = contrast(CARRY_CASES, maxOnly);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("최댓값만 이어받은 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 음수가 짝수 개 들어간 구간이 답인 입력에서 어긋난다. 값이 전부 양수면 답이 같다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 직전 칸에서 이어받는 값의 개수를 네 가지로 두고 답을 대조한다. */
  "state-size": () => {
    const heads = ["값 0 개", "값 1 개", "값 2 개", "값 2N 개"];
    const impls = [biggestElement, maxOnly, maximumProductSubarray, dpArrays];
    const wrong = [0, 0, 0, 0];
    const rows = STATE_CASES.map((A) => {
      const bare = maximumProductSubarray([...A]);
      const cells = impls.map((f, k) => {
        const got = f([...A]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return num(got);
      });
      return [show(A), num(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(LIMIT)} 에서 쓰는 칸`,
      "",
      "1",
      "1",
      "2",
      num(2 * LIMIT),
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r", "r"]),
      "",
      "└ 값 하나짜리 후보 둘은 어긋나는 입력이 남는다. 어긋나지 않는 가장 작은 상태가 값 둘이다",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 순회한 걸음별 상태값. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let curMax = WALK[0] as number;
    let curMin = WALK[0] as number;
    let best = WALK[0] as number;
    rows.push([
      "T1",
      "0",
      String(WALK[0]),
      "—",
      "—",
      "—",
      String(curMax),
      String(curMin),
      String(best),
    ]);
    for (let i = 1; i < WALK.length; i++) {
      const x = WALK[i] as number;
      const grown = curMax * x;
      const flipped = curMin * x;
      curMax = Math.max(x, grown, flipped);
      curMin = Math.min(x, grown, flipped);
      best = Math.max(best, curMax);
      rows.push([
        `T${i + 1}`,
        String(i),
        String(x),
        String(x),
        String(grown),
        String(flipped),
        String(curMax),
        String(curMin),
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
          "최댓값에 잇기",
          "최솟값에 잇기",
          "curMax",
          "curMin",
          "best",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ best 가 마지막으로 커지는 곳은 칸 3 이고, 그 뒤 두 걸음은 curMax 만 바뀐다. 답은 ${best} 이다`,
    ].join("\n");
  },

  /** `deep.walk.step` — 후보 셋이 각각 어느 걸음에서 골라졌는가. */
  "walk-branches": () => {
    const names = ["새로 시작", "최댓값에 잇기", "최솟값에 잇기"];
    const maxAt: string[][] = [[], [], []];
    const minAt: string[][] = [[], [], []];
    const ties: string[] = [];
    let curMax = WALK[0] as number;
    let curMin = WALK[0] as number;
    for (let i = 1; i < WALK.length; i++) {
      const step = `T${i + 1}`;
      const x = WALK[i] as number;
      const cand = [x, curMax * x, curMin * x];
      const hi = Math.max(...cand);
      const lo = Math.min(...cand);
      let shared = false;
      cand.forEach((v, k) => {
        if (v === hi) (maxAt[k] as string[]).push(step);
        if (v === lo) (minAt[k] as string[]).push(step);
      });
      if (cand.filter((v) => v === hi).length > 1) shared = true;
      if (cand.filter((v) => v === lo).length > 1) shared = true;
      if (shared) ties.push(step);
      curMax = hi;
      curMin = lo;
    }
    const rows = names.map((name, k) => [
      name,
      (maxAt[k] as string[]).join(" "),
      (minAt[k] as string[]).join(" "),
    ]);
    return [
      table(["후보", "curMax 가 고른 걸음", "curMin 이 고른 걸음"], rows, [
        "l",
        "l",
        "l",
      ]),
      "",
      "└ 후보 셋이 최댓값 쪽에서도 최솟값 쪽에서도 각각 한 번 이상 골라졌다",
      `  값이 같아 후보 여럿이 함께 적힌 걸음은 ${ties.join(" · ")} 이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 최댓값의 후보에서 「새로 시작」을 빼면 무엇이 달라지는가. */
  "pause-drop-fresh": () => {
    const { rows, gaps } = contrast(FRESH_CASES, (A) =>
      dropFresh.maximumProductSubarray(A),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("새로 시작을 뺀 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 전개 입력에서는 답이 같다. 0 뒤에서 답이 만들어지는 입력에서만 어긋난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 최솟값이 이미 갱신된 최댓값을 쓰면 무엇이 달라지는가. */
  "pause-stale-max": () => {
    const { rows, gaps } = contrast(STALE_CASES, (A) =>
      staleMax.maximumProductSubarray(A),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("갱신된 값을 쓴 답"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 전개 입력에서는 답이 같다. 음수가 셋 이상 이어지는 입력에서 어긋난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 마지막 칸의 최댓값을 답으로 내면 무엇이 달라지는가. */
  "pause-answer-last": () => {
    const { rows, gaps } = contrast(LAST_CASES, (A) =>
      returnsLast.maximumProductSubarray(A),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("마지막 칸의 최댓값"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 답이 마지막 칸에서 끝나는 입력에서는 같다. 답이 배열 가운데에서 끝나면 어긋난다",
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력에서 세 값이 어떻게 정해지는가. */
  "invariant-edges": () => {
    const rows = EDGE_CASES.map(([name, A]) => {
      let curMax = A[0] as number;
      let curMin = A[0] as number;
      for (let i = 1; i < A.length; i++) {
        const x = A[i] as number;
        const grown = curMax * x;
        const flipped = curMin * x;
        curMax = Math.max(x, grown, flipped);
        curMin = Math.min(x, grown, flipped);
      }
      const answer = maximumProductSubarray([...A]);
      return [name, show(A), num(curMax), num(curMin), num(answer)];
    });
    return [
      table(["경계", "입력", "끝난 뒤 curMax", "끝난 뒤 curMin", "답"], rows, [
        "l",
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 칸이 하나면 루프가 한 번도 실행되지 않아 세 값이 A[0] 그대로 남는다",
    ].join("\n");
  },

  /** `invariant` ③ — 최솟값이 직전 최솟값을 못 이어받으면 무엇이 나오는가. */
  "mutant-min-no-carry": () => {
    const { rows, gaps } = contrast(MIN_CARRY_CASES, (A) =>
      minNoCarry.maximumProductSubarray(A),
    );
    assertBreaks(gaps);
    const A = [-3, 2, 5, -4];
    const good: number[] = [];
    const bad: number[] = [];
    let gMax = A[0] as number;
    let gMin = A[0] as number;
    let bMax = A[0] as number;
    let bMin = A[0] as number;
    good.push(gMin);
    bad.push(bMin);
    for (let i = 1; i < A.length; i++) {
      const x = A[i] as number;
      const gg = gMax * x;
      const gf = gMin * x;
      gMax = Math.max(x, gg, gf);
      gMin = Math.min(x, gg, gf);
      const bg = bMax * x;
      const bf = bMin * x;
      bMax = Math.max(x, bg, bf);
      bMin = Math.min(x, bg);
      good.push(gMin);
      bad.push(bMin);
    }
    return [
      table(CONTRAST_HEAD("이어받기를 뺀 답"), rows, ["l", "r", "r", "l"]),
      "",
      `${show(A)} 에서 칸마다의 최솟값`,
      table(
        ["  칸 번호", ...A.map((_, i) => String(i))],
        [
          ["  정본의 curMin", ...good.map(num)],
          ["  이어받기를 뺀 curMin", ...bad.map(num)],
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "  └ 칸 2 에서 갈리고, 칸 3 의 부호 뒤집기가 그 값을 쓰는 순간 답이 어긋난다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의로 센 값과 점화식이 낸 값을 맞춘다. */
  "math-check": () => {
    const lines: string[] = [];
    const target = 3;
    lines.push(
      `오른쪽 끝이 칸 ${target} 인 후보 ${target + 1} 개를 정의대로 만든다`,
    );
    lines.push("");
    for (const { l, p } of endingAt(WALK, target)) {
      const factors = WALK.slice(l, target + 1)
        .map((v) => (v < 0 ? `(${v})` : String(v)))
        .join(" × ");
      lines.push(`  P(${l}, ${target}) = ${padRight(factors, 24)} = ${p}`);
    }
    const rows: string[][] = [];
    let curMax = WALK[0] as number;
    let curMin = WALK[0] as number;
    for (let i = 0; i < WALK.length; i++) {
      if (i > 0) {
        const x = WALK[i] as number;
        const grown = curMax * x;
        const flipped = curMin * x;
        curMax = Math.max(x, grown, flipped);
        curMin = Math.min(x, grown, flipped);
      }
      const all = endingAt(WALK, i).map((e) => e.p);
      rows.push([
        String(i),
        String(Math.max(...all)),
        String(curMax),
        String(Math.min(...all)),
        String(curMin),
      ]);
    }
    return [
      ...lines,
      "",
      table(
        [
          "i",
          "정의로 센 mx[i]",
          "점화식의 curMax",
          "정의로 센 mn[i]",
          "점화식의 curMin",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "└ 두 쌍이 여섯 칸에서 모두 같다. 정의를 다 펴서 센 값과 후보 셋만 본 값이 어긋나지 않는다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣으면 답이 표현 범위를 넘는다. */
  "math-limits": () => {
    const inexact = firstInexact();
    const overflow = firstOverflow();
    const exactRows = [inexact - 1, inexact].map((len) => {
      const got = maximumProductSubarray(new Array<number>(len).fill(10));
      const exact = 10n ** BigInt(len);
      return [
        num(len),
        BigInt(got).toString(),
        exact.toString(),
        BigInt(got) === exact ? "같다" : "다르다",
      ];
    });
    const rangeRows = [overflow - 1, overflow].map((len) => {
      const got = maximumProductSubarray(new Array<number>(len).fill(10));
      return [
        num(len),
        String(got),
        num((10n ** BigInt(len)).toString().length),
        Number.isFinite(got) ? "표현된다" : "표현되지 않는다",
      ];
    });
    return [
      "정확한 정수로 남는 한계 — 전부 10 인 배열",
      table(["  칸 수", "정본이 낸 답", "정확한 답", "판정"], exactRows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "표현 범위의 한계 — 같은 배열",
      table(
        ["  칸 수", "정본이 낸 답", "정확한 답의 자릿수", "판정"],
        rangeRows,
        ["r", "r", "r", "l"],
      ),
      "",
      `제약 규모 N = ${num(LIMIT)} 에서`,
      table(
        ["  가장 큰 답", `10^${num(LIMIT)}`],
        [
          ["  그 답의 자릿수", num(LIMIT + 1)],
          ["  double 의 상한", String(Number.MAX_VALUE)],
          ["  값이 정확한 가장 긴 10 의 연속", `${num(inexact - 1)} 칸`],
          ["  표현되는 가장 긴 10 의 연속", `${num(overflow - 1)} 칸`],
        ],
        ["l", "r"],
      ),
      `  └ 절차의 연산 수는 ${num(LIMIT)} 칸에서도 ${num(7 * (LIMIT - 1))} 번이고, 먼저 걸리는 것은 답을 담는 그릇이다`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 곱셈과 비교가 드는가. */
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
        "2",
        "5",
        String(7 * (n - 1)),
      ],
      ["반환", `T${n + 1}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(carry.muls + carry.cmps)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "걸음마다 곱셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 곱셈 ${carry.muls} 번과 비교 ${carry.cmps} 번이고, 둘 다 칸 수 ${n} 에서만 나온 수다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, number[]][] = [
      ["전부 1 이다", Array.from({ length: n }, () => 1)],
      ["전부 -1 이다", Array.from({ length: n }, () => -1)],
      [
        "1 과 -1 이 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 1 : -1)),
      ],
      [
        "한 칸만 10 이고 나머지는 0 이다",
        Array.from({ length: n }, (_, k) => (k === n - 1 ? 10 : 0)),
      ],
      ["전부 10 이다", Array.from({ length: n }, () => 10)],
    ];
    const rows = shapes.map(([name, A]) => {
      const carry = byCarrying(A);
      assertSame(A, carry.answer);
      return [
        name,
        num(carry.muls),
        num(carry.cmps),
        num(carry.muls + carry.cmps),
        num(carry.answer),
      ];
    });
    return [
      table(
        [`입력의 모양 (N = ${num(n)})`, "곱셈", "비교", "기본 연산", "답"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "가운데 세 열이 다섯 줄 다 같고 오른쪽 열만 다르다",
      "마지막 줄은 답이 double 의 표현 범위를 넘은 자리이고, 연산 수는 그때도 같다",
    ].join("\n");
  },
};
