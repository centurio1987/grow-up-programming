/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts subarraySumEqualsK-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { subarraySumEqualsK } from "./subarraySumEqualsK-guide.ref.ts";

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

/** `[3 4 7]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
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
 * 음수가 하나 들어 있고, 접두 합 14 가 두 번 나오며, 조회가 0 을 내는 걸음과 1 을 내는
 * 걸음이 둘 다 나온다.
 */
const WALK: number[] = [3, 4, 7, 2, -3, 1, 4, 2];
const WALK_K = 7;

/* ────────────────────────── 계측기 ────────────────────────── */

/** 접두 합 배열. `P[j]` 는 앞 `j` 개 원소의 합이고 칸이 `n+1` 개다. */
function prefixes(nums: number[]): number[] {
  const P: number[] = [0];
  let running = 0;
  for (const v of nums) {
    running += v;
    P.push(running);
  }
  return P;
}

/**
 * 방식 A — 모든 구간을 왼쪽부터 직접 더한다. 세는 것은 **덧셈 수**다.
 *
 * 오른쪽 끝이 `r` 인 구간이 `r+1` 개이고 그 길이의 합이 `(r+1)(r+2)/2` 라, 오른쪽 끝을
 * 한 칸 옮길 때마다 덧셈이 그만큼 늘어난다.
 */
function addEveryRange(
  nums: number[],
  k: number,
): { answer: number; perRight: number[]; adds: number } {
  const n = nums.length;
  let answer = 0;
  let adds = 0;
  const perRight: number[] = [];
  for (let r = 0; r < n; r++) {
    let here = 0;
    for (let l = 0; l <= r; l++) {
      let s = 0;
      for (let t = l; t <= r; t++) {
        s += nums[t] as number;
        adds++;
        here++;
      }
      if (s === k) answer++;
    }
    perRight.push(here);
  }
  return { answer, perRight, adds };
}

/**
 * 방식 B — 접두 합 표를 한 번 만들고 모든 `(l, r)` 쌍을 뺄셈 하나로 구한다. 세는 것은
 * **뺄셈 수**이고, 그것이 곧 구간의 개수 `n(n+1)/2` 다.
 */
function subtractEveryPair(
  nums: number[],
  k: number,
): { answer: number; perRight: number[]; adds: number; subs: number } {
  const P = prefixes(nums);
  const n = nums.length;
  let answer = 0;
  let subs = 0;
  const perRight: number[] = [];
  for (let r = 0; r < n; r++) {
    let here = 0;
    for (let l = 0; l <= r; l++) {
      const sum = (P[r + 1] as number) - (P[l] as number);
      subs++;
      here++;
      if (sum === k) answer++;
    }
    perRight.push(here);
  }
  return { answer, perRight, adds: n, subs };
}

/**
 * 방식 C — 접두 합의 **개수 표**를 조회한다. 정본과 같은 절차이고, 여기서는 맵 연산을 센다.
 *
 * 세는 것은 `get` 과 `set` 의 호출 수다 — 걸음마다 조회 하나·읽기 하나·쓰기 하나이고,
 * 시작할 때 빈 접두를 세어 두는 쓰기가 하나 더 붙어 `3n + 1` 이다.
 */
function countWithTable(
  nums: number[],
  k: number,
): {
  answer: number;
  perRight: number[];
  adds: number;
  lookups: number;
  mapOps: number;
  cells: number;
} {
  const seen = new Map<number, number>();
  seen.set(0, 1);
  let mapOps = 1;
  let prefix = 0;
  let answer = 0;
  let lookups = 0;
  const perRight: number[] = [];
  for (const value of nums) {
    prefix += value;
    answer += seen.get(prefix - k) ?? 0;
    mapOps++;
    lookups++;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
    mapOps += 2;
    perRight.push(1);
  }
  return {
    answer,
    perRight,
    adds: nums.length,
    lookups,
    mapOps,
    cells: seen.size,
  };
}

/**
 * 순서를 무시하고 세는 후보 — 접두 합을 정렬해 같은 차이를 갖는 짝을 전부 센다.
 *
 * 어느 쪽이 앞이었는지가 사라지므로 `P[i] − P[j] = k` 인 짝도 함께 세어진다. 그 짝은
 * 구간이 아니다.
 */
function countIgnoringOrder(nums: number[], k: number): number {
  const P = prefixes(nums);
  let count = 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const a = P[i] as number;
      const b = P[j] as number;
      if (b - a === k || a - b === k) count++;
    }
  }
  return count;
}

/**
 * 표에 **직전 `W` 개의 접두 합만** 남기는 절차. 조회 수는 그대로이고 답만 달라진다.
 *
 * 표가 `P[j−W] … P[j−1]` 만 담으므로 길이가 `W` 를 넘는 구간은 조회에 걸리지 않는다.
 */
function countWithWindow(
  nums: number[],
  k: number,
  W: number,
): { answer: number; lookups: number; cells: number } {
  const seen = new Map<number, number>();
  const order: number[] = [];
  const push = (v: number): void => {
    seen.set(v, (seen.get(v) ?? 0) + 1);
    order.push(v);
    if (order.length > W) {
      const gone = order.shift() as number;
      const left = (seen.get(gone) ?? 0) - 1;
      if (left === 0) seen.delete(gone);
      else seen.set(gone, left);
    }
  };
  push(0);
  let prefix = 0;
  let answer = 0;
  let lookups = 0;
  let cells = order.length;
  for (const value of nums) {
    prefix += value;
    answer += seen.get(prefix - k) ?? 0;
    lookups++;
    cells = Math.max(cells, order.length);
    push(prefix);
  }
  return { answer, lookups, cells };
}

/**
 * 조회보다 기록을 먼저 하는 사본. 두 줄의 순서를 바꾼 것이라 `loadMutant`(한 줄 치환)로는
 * 만들 수 없어 여기 따로 적는다. 나머지는 정본과 같다.
 */
function recordBeforeLookup(nums: number[], k: number): number {
  const seen = new Map<number, number>();
  seen.set(0, 1);
  let prefix = 0;
  let answer = 0;
  for (const value of nums) {
    prefix += value;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
    answer += seen.get(prefix - k) ?? 0;
  }
  return answer;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  subarraySumEqualsK(nums: number[], k: number): number;
}

const REF = new URL("./subarraySumEqualsK-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 빈 접두를 미리 세어 두는 줄을 지운 사본.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noSeed = await loadMutant<Impl>(REF, {
  drop: /seen\.set\(0, 1\);/,
});

/** 개수를 더하지 않고 1 만 적는 사본. 불변식을 지키던 줄 하나가 그 대상이다. */
const countOnce = await loadMutant<Impl>(REF, {
  swap: [
    /seen\.set\(prefix, \(seen\.get\(prefix\) \?\? 0\) \+ 1\);/,
    "seen.set(prefix, 1);",
  ],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: number; mutated: number }[]): void {
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(nums: number[], k: number, got: number): number {
  const want = subarraySumEqualsK([...nums], k);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/* ────────────────────────── 블록 ────────────────────────── */

/** 오해를 시험하는 입력들. 마지막 둘은 답이 안 바뀌는 자리다. */
const SEED_CASES: [number[], number][] = [
  [WALK, WALK_K],
  [[1, 1, 1], 2],
  [[1, 2, 3], 5],
  [[1, 2, 3], 100],
];

const ORDER_CASES: [number[], number][] = [
  [WALK, WALK_K],
  [[1, 2, 3], 3],
  [[1, -1, 1, -1], 0],
  [[0, 0, 0], 0],
  [[5], 0],
];

const COUNT_CASES: [number[], number][] = [
  [WALK, WALK_K],
  [[1, -1, 1, -1], 0],
  [[0, 0, 0], 0],
  [[1, 1, 1], 2],
];

const IGNORE_CASES: [number[], number][] = [
  [WALK, WALK_K],
  [[5, -5, 5], 5],
  [[2, -2, 2, -2], 2],
  [[1, -1, 1, -1], 0],
  [[1, 2, 3], 3],
];

const SCALE_N = [3, 8, 1_000, 100_000];

export const PROOFS: Record<string, () => string> = {
  /** `deep.walk.step` — 고정 입력을 끝까지 처리한 걸음별 상태값. */
  "walk-trace": () => {
    const seen = new Map<number, number>();
    seen.set(0, 1);
    let prefix = 0;
    let answer = 0;
    const rows: string[][] = [];
    for (const [r, value] of WALK.entries()) {
      prefix += value;
      const want = prefix - WALK_K;
      const found = seen.get(want) ?? 0;
      answer += found;
      seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
      rows.push([
        `T${r + 2}`,
        String(r),
        String(value),
        String(prefix),
        String(want),
        String(found),
        String(answer),
        String(seen.size),
      ]);
    }
    assertSame(WALK, WALK_K, answer);
    return [
      table(
        [
          "걸음",
          "r",
          "값",
          "접두 합",
          "찾는 값",
          "표에서 찾은 개수",
          "답 누적",
          "표 칸 수",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 조회가 1 을 낸 걸음이 넷이고, 그 넷이 답 ${answer} 를 만든다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 세 방식으로 처리했을 때의 실제 계수. */
  "cost-three-ways": () => {
    const a = addEveryRange(WALK, WALK_K);
    const b = subtractEveryPair(WALK, WALK_K);
    const c = countWithTable(WALK, WALK_K);
    assertSame(WALK, WALK_K, a.answer);
    assertSame(WALK, WALK_K, b.answer);
    assertSame(WALK, WALK_K, c.answer);
    const rows = WALK.map((_, r) => [
      String(r),
      String(a.perRight[r] ?? 0),
      String(b.perRight[r] ?? 0),
      String(c.perRight[r] ?? 0),
    ]);
    return [
      table(
        ["오른쪽 끝 r", "직접 더하기", "접두 합의 차이", "개수 표"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `방식 A  모든 구간을 직접 더한다            덧셈 ${a.adds} 번`,
      `방식 B  접두 합 표를 만들고 쌍마다 뺀다    덧셈 ${b.adds} 번 · 뺄셈 ${b.subs} 번`,
      `방식 C  접두 합의 개수 표를 조회한다       덧셈 ${c.adds} 번 · 조회 ${c.lookups} 번`,
      `        └ 답은 셋 다 ${a.answer} 로 같고, 오른쪽 열만 r 을 따라 늘지 않는다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 순서를 무시하고 세는 후보가 어디서 어긋나는가. */
  "cost-ignore-order": () => {
    const rows = IGNORE_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const loose = countIgnoringOrder(nums, k);
      return [
        show(nums),
        String(k),
        String(bare),
        String(loose),
        bare === loose ? "같다" : "다르다",
      ];
    });
    return [
      table(
        ["입력", "k", "정본", "순서를 무시하고 센 값", ""],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 뒤에 나온 접두 합이 더 작은 짝까지 세는 줄에서만 값이 커진다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 표에 남기는 접두 합의 개수를 다섯으로 두고 잰 값. */
  "cost-window": () => {
    const full = countWithTable(WALK, WALK_K);
    const rows = [1, 2, 3, 4, WALK.length].map((W) => {
      const r = countWithWindow(WALK, WALK_K, W);
      return [
        `W=${W}`,
        String(r.cells),
        String(r.lookups),
        String(r.answer),
        String(full.answer - r.answer),
      ];
    });
    const big = 100_000;
    return [
      table(
        ["표에 남기는 개수", "표 칸 수", "조회 수", "답", "놓친 답"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 표를 줄여도 조회 수는 그대로이고 답만 줄어든다",
      `  제약 규모 n = ${num(big)} 에서 표는 많아야 ${num(big + 1)} 칸이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 빈 접두를 미리 세어 두지 않으면 어느 답이 빠지는가. */
  "pause-no-seed": () => {
    const rows = SEED_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = noSeed.subarraySumEqualsK([...nums], k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "k", "정본", "빈 접두를 안 센 코드", ""],
        rows.map((r) => [
          show(r.nums),
          String(r.k),
          String(r.bare),
          String(r.mutated),
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 아래 둘은 왼쪽 끝이 0 인 답이 없어서 그대로다. 그래서 이 변경이 남는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 기록을 조회보다 먼저 하면 어떻게 되는가. */
  "pause-record-first": () => {
    const rows = ORDER_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = recordBeforeLookup(nums, k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "k", "n", "정본", "기록을 먼저 한 코드", "차이"],
        rows.map((r) => [
          show(r.nums),
          String(r.k),
          String(r.nums.length),
          String(r.bare),
          String(r.mutated),
          String(r.mutated - r.bare),
        ]),
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ k 가 0 인 줄에서만 답이 늘고, 늘어난 양이 정확히 n 이다",
    ].join("\n");
  },

  /** `invariant` ③ — 개수를 더하던 줄에서 1 만 적으면 무엇이 나오는가. */
  "mutant-count-once": () => {
    const rows = COUNT_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = countOnce.subarraySumEqualsK([...nums], k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "k", "정본", "개수 대신 1 을 적은 코드", "차이"],
        rows.map((r) => [
          show(r.nums),
          String(r.k),
          String(r.bare),
          String(r.mutated),
          String(r.mutated - r.bare),
        ]),
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 같은 접두 합이 두 번 이상 나오는 입력에서만 답이 줄어든다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE_N.map((n) => {
      const zeros = new Array<number>(n).fill(0);
      const run = countWithTable(zeros, 0);
      assertSame(zeros, 0, run.answer);
      return [
        num(n),
        num(run.answer),
        num((n * (n + 1)) / 2),
        num(run.mapOps),
        num(3 * n + 1),
      ];
    });
    return table(
      ["n", "구간의 개수(실측)", "n(n+1)/2", "맵 연산(실측)", "3n + 1"],
      rows,
      ["r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 조회 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1_000;
    const shapes: [string, number[], number][] = [
      ["전부 0 · k=0 — 답이 가장 많다", new Array<number>(n).fill(0), 0],
      ["전부 1 · k=5", new Array<number>(n).fill(1), 5],
      [
        "1 2 3 … n · k=0 — 답이 없다",
        Array.from({ length: n }, (_, i) => i + 1),
        0,
      ],
    ];
    const rows = shapes.map(([name, nums, k]) => {
      const r = countWithTable(nums, k);
      assertSame(nums, k, r.answer);
      return [name, num(r.lookups), num(r.cells), num(r.answer)];
    });
    return [
      table(
        [`입력의 모양 (n=${num(n)})`, "조회 수", "표 칸 수", "답"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 조회 수가 세 줄 다 같다. 답이 몇 개든 걸음 수는 n 이다",
    ].join("\n");
  },
};
