/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 걸음마다의 누적합 · 찾은 개수 · 개수 맵은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측
 * 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  answerRanges,
  CONCEPT_R,
  countIgnoringOrder,
  foundRanges,
  mapOps,
  N_MAX,
  NEG_CASE,
  num,
  ORDER_CASE,
  prefixes,
  rangeCount,
  type Scan,
  secondsOf,
  showMap,
  trace,
  WALK,
  WALK_K,
  windowCount,
} from "./subarraySumEqualsK-guide.fig.tsx";
import { subarraySumEqualsK } from "./subarraySumEqualsK-guide.ref.ts";

const REF = new URL("./subarraySumEqualsK-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** `[3 4 7]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** `[2,5]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const span = ([l, r]: readonly [number, number]): string => `[${l},${r}]`;

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 텍스트 펜스의 칸 맞춤을 값에서 잰다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 텍스트 펜스의 열 맞춤 — 열 폭을 값에서 계산한다. 마지막 열은 채우지 않는다. */
function columns(rows: string[][]): string[] {
  const w = rows.reduce<number[]>(
    (acc, r) => r.map((c, i) => Math.max(acc[i] ?? 0, width(c))),
    [],
  );
  return rows.map((r) =>
    r
      .map((c, i) => (i === r.length - 1 ? c : pad(c, w[i] ?? 0)))
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 펜스 안의 줄 — 펜스 줄(```)은 본문이 적는다. */
const block = (body: string[]): string => body.join("\n");

/** 증명 표에 붙는 문장 — 표 아래 한 문단(SPEC §12). 닫는 마커는 본문이 적는다. */
const withNote = (table: string, note: string): string => `${table}\n\n${note}`;

/** 「3 + 4 + (-3)」 꼴 — 구간의 값을 더하는 식. 음수는 괄호로 싼다. */
const plus = (xs: readonly number[]): string =>
  xs.map((v) => (v < 0 ? `(${v})` : String(v))).join(" + ");

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

/* ────────────────────────── 계측기 ────────────────────────── */

/**
 * 모든 구간을 왼쪽부터 직접 더한다. 세는 것은 **덧셈 수**다 — 구간마다 처음부터 다시 더한다.
 * 오른쪽 끝이 `r` 인 구간들의 덧셈을 모아 둔다.
 */
function addEveryRange(
  nums: readonly number[],
  k: number,
): { answer: number; perRight: number[]; adds: number } {
  let answer = 0;
  let adds = 0;
  const perRight: number[] = [];
  for (let r = 0; r < nums.length; r++) {
    let here = 0;
    for (let l = 0; l <= r; l++) {
      let s = 0;
      for (let t = l; t <= r; t++) {
        s += nums[t] as number;
        here++;
      }
      if (s === k) answer++;
    }
    adds += here;
    perRight.push(here);
  }
  return { answer, perRight, adds };
}

/** 누적합을 한 번 만들고, 오른쪽 끝마다 앞 칸 전부와 한 번씩 뺀다. 세는 것은 **뺄셈 수**다. */
function subtractEveryPair(
  nums: readonly number[],
  k: number,
): { answer: number; perRight: number[]; subs: number } {
  const P = prefixes(nums);
  let answer = 0;
  let subs = 0;
  const perRight: number[] = [];
  for (let r = 0; r < nums.length; r++) {
    let here = 0;
    for (let l = 0; l <= r; l++) {
      if ((P[r + 1] as number) - (P[l] as number) === k) answer++;
      here++;
    }
    subs += here;
    perRight.push(here);
  }
  return { answer, perRight, subs };
}

/**
 * 정본과 같은 절차에 맵 연산 셈을 붙인 사본. 세는 것은 `get`·`set` 의 호출 수 — 걸음마다 조회
 * 하나 · 읽기 하나 · 쓰기 하나, 시작할 때 쓰기 하나다. 답은 부르는 쪽이 정본과 대조한다(`assertSame`).
 */
function countWithMap(
  nums: readonly number[],
  k: number,
): { answer: number; lookups: number; mapOps: number; keys: number } {
  const seen = new Map<number, number>();
  seen.set(0, 1);
  let ops = 1;
  let prefix = 0;
  let answer = 0;
  let lookups = 0;
  for (const value of nums) {
    prefix += value;
    answer += seen.get(prefix - k) ?? 0;
    lookups++;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
    ops += 3;
  }
  return { answer, lookups, mapOps: ops, keys: seen.size };
}

/**
 * 개수 맵에 **직전 `W` 개의 누적합만** 남기는 절차. 조회 수는 그대로이고 답만 달라진다.
 * 개수 맵이 `P[j−W] … P[j−1]` 만 담으므로 길이가 `W` 를 넘는 구간은 조회에 걸리지 않는다.
 */
function countWithWindow(
  nums: readonly number[],
  k: number,
  W: number,
): { answer: number; lookups: number; kept: number } {
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
  let kept = order.length;
  for (const value of nums) {
    prefix += value;
    answer += seen.get(prefix - k) ?? 0;
    lookups++;
    kept = Math.max(kept, order.length);
    push(prefix);
  }
  return { answer, lookups, kept };
}

/**
 * 조회보다 기록을 먼저 하는 사본. 두 줄의 순서를 바꾼 것이라 `loadMutant`(한 줄 치환)로는
 * 만들 수 없어 여기 따로 적는다. 나머지는 정본과 같다.
 */
function recordBeforeLookup(nums: readonly number[], k: number): number {
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

/** 합이 `k` **이하**인 구간의 수 — 모든 구간을 직접 더해 센다(정의). */
function countAtMost(nums: readonly number[], k: number): number {
  let count = 0;
  for (let l = 0; l < nums.length; l++) {
    let s = 0;
    for (let r = l; r < nums.length; r++) {
      s += nums[r] as number;
      if (s <= k) count++;
    }
  }
  return count;
}

/** 합이 `k` 이하인 가장 긴 구간의 길이 — 모든 구간을 직접 더해 찾는다(정의). */
function longestAtMost(nums: readonly number[], k: number): number {
  let best = 0;
  for (let l = 0; l < nums.length; l++) {
    let s = 0;
    for (let r = l; r < nums.length; r++) {
      s += nums[r] as number;
      if (s <= k) best = Math.max(best, r - l + 1);
    }
  }
  return best;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  subarraySumEqualsK(nums: number[], k: number): number;
}

/**
 * 빈 누적합을 미리 세어 두는 줄을 지운 사본.
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

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다.
 *
 * 중화 실행(`check-proof` 가 변이를 끄고 한 번 더 부르는 실행)에서는 이 검사를 건너뛴다. 중화
 * 여부는 **값에서** 알아낸다 — 변이 모듈의 함수가 정본과 같은 객체면 중화된 것이다. 손으로 적은
 * 사본(`recordBeforeLookup`)은 중화되지 않으므로 `null` 로 부른다.
 */
function assertBreaks(
  mutant: Impl | null,
  rows: { bare: number; mutated: number }[],
): void {
  if (mutant !== null && mutant.subarraySumEqualsK === subarraySumEqualsK)
    return;
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(nums: readonly number[], k: number, got: number): number {
  const want = subarraySumEqualsK([...nums], k);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

const walk = () => trace(WALK, WALK_K);
const scanAt = (r: number): Scan => walk().scans[r] as Scan;
/** 같은 누적합이 처음 나온 걸음 — `CONCEPT_R` 에서 두 번째로 나오는 값의 첫 자리. */
const firstOf = (s: Scan): Scan =>
  walk().scans.find((x) => x.prefix === s.prefix) as Scan;

/* ────────────────────────── 입력 목록 ────────────────────────── */

/** 빈 누적합을 안 센 코드를 시험하는 입력들. 마지막 둘은 답이 안 바뀌는 자리다. */
const SEED_CASES: [number[], number][] = [
  [[...WALK], WALK_K],
  [[1, 1, 1], 2],
  [[1, 2, 3], 5],
  [[1, 2, 3], 100],
];

const ORDER_CASES: [number[], number][] = [
  [[...WALK], WALK_K],
  [[1, 2, 3], 3],
  [[1, -1, 1, -1], 0],
  [[0, 0, 0], 0],
  [[5], 0],
];

const COUNT_CASES: [number[], number][] = [
  [[...WALK], WALK_K],
  [[1, -1, 1, -1], 0],
  [[0, 0, 0], 0],
  [[1, 1, 1], 2],
];

const IGNORE_CASES: [number[], number][] = [
  [[...WALK], WALK_K],
  [[...ORDER_CASE[0]], ORDER_CASE[1]],
  [[2, -2, 2, -2], 2],
  [[1, -1, 1, -1], 0],
  [[1, 2, 3], 3],
];

const WINDOW_CASES: [number[], number][] = [
  [[...NEG_CASE[0]], NEG_CASE[1]],
  [[...ORDER_CASE[0]], ORDER_CASE[1]],
  [[1, 2, 3], 3],
  [[1, 1, 1], 2],
];

const EDGE_CASES: [string, number[], number][] = [
  ["배열이 빔", [], WALK_K],
  ["원소 하나가 k 와 같음", [5], 5],
  ["원소 하나가 k 와 다름", [5], 1],
  ["k 가 0 이고 원소도 0", [0], 0],
  ["원소가 전부 0 · k = 0", [0, 0, 0, 0], 0],
  ["k 가 음수", [-1, -1, 1], -2],
  ["답이 하나도 없음", [1, 2, 3], 100],
];

const SCALE_N = [3, 8, 1_000, 100_000];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 합이 k 인 구간과, 각 구간이 누적합 두 칸의 차라는 것. */
  "concept-ranges": () => {
    const P = prefixes(WALK);
    const ranges = answerRanges(WALK, WALK_K);
    assertSame(WALK, WALK_K, ranges.length);
    const rows = ranges.map(([l, r]) => {
      const xs = WALK.slice(l, r + 1);
      return [
        span([l, r]),
        `${plus(xs)} = ${sum(xs)}`,
        `P[${r + 1}] − P[${l}] = ${P[r + 1]} − ${P[l]} = ${(P[r + 1] as number) - (P[l] as number)}`,
      ];
    });
    return withNote(
      md(["구간", "더한 값", "누적합 두 칸의 차"], rows),
      `구간 ${num(rangeCount(WALK.length))} 개를 모두 직접 더해 보면 합이 ${WALK_K} 인 것이 ${ranges.length} 개이고, ${ranges.length} 개 모두 두 칸의 차가 더한 값과 같습니다.`,
    );
  },

  /** `concept` — 규모의 끝에서 구간 수와 개수 맵의 기본 연산. */
  "concept-scale": () =>
    block(
      columns([
        [
          `n = ${num(N_MAX)}`,
          `구간 ${num(rangeCount(N_MAX))} 개`,
          "구간을 하나씩 재면 이만큼 본다",
        ],
        [
          "",
          `맵 연산 ${num(mapOps(N_MAX))} 번`,
          "원소마다 개수 맵에 묻고 적는다",
        ],
      ]),
    ),

  /** `concept` — 음수가 섞이면 누적합이 줄었다 늘었다 한다. */
  "concept-negative": () => {
    const P = prefixes(WALK);
    const down = P.flatMap((v, j) =>
      j > 0 && v < (P[j - 1] as number) ? [j] : [],
    );
    const at = (down[0] as number) - 1;
    const v = WALK[at] as number;
    return block([
      `누적합  ${P.join(" → ")}`,
      `    └ 칸 ${down.join(" · ")} 에서 값이 줄었다. nums[${at}] = ${v}${을를(v)} 더한 칸이다`,
    ]);
  },

  /** `prereq` — 합이 k 인 구간 세기와 합이 k 이하인 가장 긴 구간은 다른 과제다. */
  "prereq-two-tasks": () => {
    const count = subarraySumEqualsK([...WALK], WALK_K);
    const longest = longestAtMost(WALK, WALK_K);
    return md(
      ["과제", "답의 모양", `${show(WALK)} 에서의 답`],
      [
        [
          `합이 ${WALK_K} 인 구간 세기 — 이 글이 하는 것`,
          "개수",
          String(count),
        ],
        [`합이 ${WALK_K} 이하인 가장 긴 구간`, "길이", String(longest)],
      ],
    );
  },

  /** `deep.origin` ② — 가장 단순한 방법의 비용. */
  "origin-cost": () => {
    const measured = [1_000, 10_000];
    const rows = [...measured, N_MAX].map((n) => {
      const closed = rangeCount(n);
      if (measured.includes(n)) {
        // 오른쪽 끝을 한 칸 넓힐 때마다 덧셈 하나 — 구간 하나에 덧셈 하나다.
        let adds = 0;
        for (let l = 0; l < n; l++) {
          for (let r = l; r < n; r++) adds++;
        }
        if (adds !== closed) {
          throw new Error(`n = ${n} 에서 실측 ${adds} ≠ n(n+1)/2 = ${closed}`);
        }
      }
      return [
        num(n),
        num(closed),
        secondsOf(closed),
        measured.includes(n) ? "실행해서 셌다" : "n(n+1)/2 로 냈다",
      ];
    });
    return withNote(
      md(["n", "구간의 수", "초당 1 억 번 기준", "구한 방법"], rows, [0, 1, 2]),
      `실행해서 센 n = ${measured.map(num).join(" · ")} 에서 덧셈 수가 n(n+1)/2 와 정확히 같았습니다.`,
    );
  },

  /** `deep.origin` ③ — 왼쪽 끝마다 같은 뒷부분을 다시 더한다. */
  "origin-repeat": () => {
    const rows = [0, 1, 2].map((l) => {
      let s = 0;
      const run = WALK.slice(l).map((v) => {
        s += v;
        return s;
      });
      return [`l = ${l} 이 더한 합`, run.join(" → ")];
    });
    return block([
      ...columns([["nums 의 값", WALK.join(" ")], ...rows]),
      "    └ 세 줄이 인덱스 2 부터 뒤쪽을 모두 다시 더했다",
    ]);
  },

  /** `deep.origin` ③ — 앞에서부터의 합 둘을 빼면 구간 하나가 나온다. */
  "origin-reuse": () => {
    const P = prefixes(WALK);
    const [l, r] = [2, CONCEPT_R];
    return block(
      columns([
        [
          `앞 ${r + 1} 개의 합`,
          `${plus(WALK.slice(0, r + 1))} = ${P[r + 1]}`,
          `P[${r + 1}]`,
        ],
        [`앞 ${l} 개의 합`, `${plus(WALK.slice(0, l))} = ${P[l]}`, `P[${l}]`],
        [
          "두 합의 차",
          `${P[r + 1]} − ${P[l]} = ${(P[r + 1] as number) - (P[l] as number)}`,
          `구간 ${span([l, r])} 의 합이 뺄셈 하나로 나온다`,
        ],
      ]),
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한 실제 계수. */
  "origin-two-ways": () => {
    const a = addEveryRange(WALK, WALK_K);
    const b = subtractEveryPair(WALK, WALK_K);
    assertSame(WALK, WALK_K, a.answer);
    assertSame(WALK, WALK_K, b.answer);
    const rows = WALK.map((_, r) => [
      String(r),
      String(a.perRight[r]),
      String(b.perRight[r]),
    ]);
    return withNote(
      md(
        ["오른쪽 끝 r", "구간마다 직접 더하기의 덧셈", "누적합 두 칸의 뺄셈"],
        rows,
        [0, 1, 2],
      ),
      `직접 더하기는 덧셈 ${a.adds} 번이고, 누적합은 만드는 덧셈 ${WALK.length} 번과 뺄셈 ${b.subs} 번입니다. 답은 둘 다 ${a.answer} 입니다.`,
    );
  },

  /** `deep.origin` ⑤ — 창의 두 끝을 오른쪽으로만 옮기는 후보. */
  "origin-window": () => {
    const rows = WINDOW_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const win = windowCount(nums, k);
      return [
        show(nums),
        String(k),
        nums.some((v) => v < 0) ? "있다" : "없다",
        String(bare),
        String(win),
        bare === win ? "같다" : "다르다",
      ];
    });
    return md(
      ["입력", "k", "음수", "정답", "창으로 센 값", "판정"],
      rows,
      [1, 3, 4],
    );
  },

  /** `deep.origin` ⑤ — 누적합을 정렬해 순서 없이 세는 후보. */
  "origin-ignore-order": () => {
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
    return md(
      ["입력", "k", "정답", "순서 없이 센 값", "판정"],
      rows,
      [1, 2, 3],
    );
  },

  /** `deep.origin` ⑤ — 순서 없이 센 짝 가운데 구간이 아닌 것. */
  "origin-ignore-pairs": () => {
    const [nums, k] = ORDER_CASE;
    const P = prefixes(nums);
    const rows: string[][] = [];
    for (let i = 0; i < P.length; i++) {
      for (let j = i + 1; j < P.length; j++) {
        const a = P[i] as number;
        const b = P[j] as number;
        if (Math.abs(b - a) !== k) continue;
        rows.push([
          `(칸 ${i}, 칸 ${j})`,
          `${a} → ${b}`,
          String(b - a),
          b - a === k ? `구간 ${span([i, j - 1])}` : "구간이 아니다",
        ]);
      }
    }
    const good = rows.filter((r) => r[3] !== "구간이 아니다").length;
    return withNote(
      md(["누적합의 짝", "앞 칸 → 뒤 칸", "뒤 − 앞", "뜻"], rows, [2]),
      `차이가 ${k} 인 짝 ${rows.length} 개 중 ${good} 개만 구간입니다. 나머지는 뒤 칸의 누적합이 더 작아서, 그 사이 구간의 합이 ${-k} 입니다.`,
    );
  },

  /** `deep.build` (c) — 키 하나를 이름에서 칸까지 따라간다. */
  "build-read-one": () => {
    const last = walk().scans.at(-1) as Scan;
    const [key, count] = [...last.after].sort((a, b) => b[1] - a[1])[0] as [
      number,
      number,
    ];
    const P = prefixes(WALK);
    const cells = P.flatMap((v, j) => (v === key ? [j] : []));
    return block([
      `seen.get(${key}) = ${count}`,
      `  → 누적합이 ${key} 인 칸이 ${cells.map((j) => `P[${j}]`).join(" · ")} 로 ${cells.length} 개`,
      `  → 그 칸을 왼쪽 칸으로 쓰는 구간은 왼쪽 끝이 ${cells.join(" 또는 ")}`,
    ]);
  },

  /** `deep.build` (d) — 키마다 개수의 합이 누적합의 칸 수다. */
  "build-map-partition": () => {
    const last = walk().scans.at(-1) as Scan;
    const P = prefixes(WALK);
    const rows = last.after.map(([key, count]) => {
      const cells = P.flatMap((v, j) => (v === key ? [j] : []));
      if (cells.length !== count) throw new Error("개수가 칸 수와 다르다");
      return [String(key), String(count), cells.join(" · ")];
    });
    const total = sum(last.after.map(([, c]) => c));
    return withNote(
      md(["키", "개수", "누적합이 그 값인 칸"], rows, [0, 1]),
      `키 ${last.after.length} 개의 개수를 더하면 ${total} 이고, 누적합의 칸 수 n + 1 = ${P.length} 와 같습니다. 칸 하나는 키 하나에만 들어갑니다.`,
    );
  },

  /** `deep.build` (e) — 누적합 배열로 찾을 때와 개수 맵으로 찾을 때. */
  "build-array-vs-map": () => {
    const t = walk();
    const P = prefixes(WALK);
    let arrayReads = 0;
    const rows = t.scans.map((s) => {
      const j = s.r + 1;
      const byArray = P.slice(0, j).filter((v) => v === s.target).length;
      if (byArray !== s.found) throw new Error("두 방법의 개수가 다르다");
      arrayReads += j;
      return [
        String(j),
        String(s.prefix),
        String(s.target),
        String(j),
        "1",
        String(s.found),
      ];
    });
    return withNote(
      md(
        [
          "칸 j",
          "P[j]",
          "찾는 값",
          "누적합 배열에서 읽은 칸",
          "개수 맵 조회",
          "찾은 개수",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      `찾은 개수는 모든 줄에서 두 방법이 같습니다. 누적합 배열은 모두 ${arrayReads} 칸을 읽었고, 개수 맵은 ${t.scans.length} 번 조회했습니다.`,
    );
  },

  /** `deep.build` 1단계 — 왼쪽 끝이 0 인 구간은 P[0] 을 왼쪽 칸으로 쓴다. */
  "build-seed": () => {
    const P = prefixes(WALK);
    const rows = answerRanges(WALK, WALK_K).map(([l, r]) => [
      span([l, r]),
      `P[${l}] = ${P[l]}`,
      `P[${r + 1}] = ${P[r + 1]}`,
      l === 0 ? "빈 누적합" : "앞 칸의 누적합",
    ]);
    return md(["구간", "왼쪽 칸", "오른쪽 칸", "왼쪽 칸의 정체"], rows);
  },

  /** `deep.build` 1단계 — 상태의 크기와 범위. */
  "build-size": () => {
    const t = walk();
    const keys = (t.scans.at(-1) as Scan).after.length;
    const most = rangeCount(N_MAX);
    const INT32 = 2 ** 31 - 1;
    if (keys > WALK.length + 1) throw new Error("키가 n + 1 개를 넘었다");
    return block(
      columns([
        [
          "개수 맵의 키",
          "많아야 n + 1 개",
          `전개 입력 n = ${WALK.length} 에서 ${keys} 개 · n = ${num(N_MAX)} 이면 많아야 ${num(N_MAX + 1)} 개`,
        ],
        [
          "prefix",
          "|prefix| ≤ n × 10,000",
          `n = ${num(N_MAX)} 이면 ${num(N_MAX * 10_000)} 이하 — 2^31 − 1 = ${num(INT32)} 보다 작다`,
        ],
        [
          "answer",
          "많아야 n(n+1)/2",
          `n = ${num(N_MAX)} 이면 ${num(most)} — 2^31 − 1 = ${num(INT32)} 보다 크다`,
        ],
      ]),
    );
  },

  /** `deep.build` 2단계 — 찾는 키가 없을 때 · 빈 누적합일 때 · 앞 칸의 누적합일 때. */
  "build-lookup-cases": () => {
    const cases: [string, Scan][] = [
      ["찾는 키가 없다", scanAt(0)],
      ["빈 누적합을 찾는다", scanAt(1)],
      ["앞 칸의 누적합을 찾는다", scanAt(CONCEPT_R)],
    ];
    const rows = cases.map(([name, s]) => [
      name,
      String(s.r),
      String(s.prefix),
      `${s.prefix} − ${WALK_K} = ${s.target}`,
      showMap(s.before),
      s.found > 0 ? String(s.found) : "없음 → 0",
    ]);
    return md(
      ["경우", "r", "누적합", "찾는 키", "조회할 때의 개수 맵", "찾은 개수"],
      rows,
      [1, 2],
    );
  },

  /** `deep.build` 3단계 — 처음 나온 누적합과 두 번째로 나온 누적합의 기록. */
  "build-record": () => {
    const again = scanAt(CONCEPT_R);
    const rows = [firstOf(again), again].map((s) => {
      const old = s.before.find(([key]) => key === s.prefix)?.[1] ?? 0;
      return [
        String(s.r),
        String(s.prefix),
        old === 0 ? "처음" : `${old + 1} 번째`,
        showMap(s.before),
        showMap(s.after),
      ];
    });
    return md(
      ["r", "누적합", "나온 차례", "기록 전 개수 맵", "기록 뒤 개수 맵"],
      rows,
      [0, 1],
    );
  },

  /** `deep.build` 전제 — 조건이 값 하나가 아니면 개수 맵으로 셀 수 없다. */
  "premise-at-most": () => {
    const exact = answerRanges(WALK, WALK_K).length;
    const atMost = countAtMost(WALK, WALK_K);
    const byMap = subarraySumEqualsK([...WALK], WALK_K);
    return withNote(
      md(
        ["세는 것", "모든 구간을 직접 더해 센 값", "개수 맵으로 센 값"],
        [
          [`합이 ${WALK_K} 인 구간`, String(exact), String(byMap)],
          [`합이 ${WALK_K} 이하인 구간`, String(atMost), String(byMap)],
        ],
        [1, 2],
      ),
      `개수 맵은 키 P[j] − ${WALK_K} 하나만 찾으므로 두 줄에서 같은 ${byMap}${을를(byMap)} 냅니다. 합이 ${WALK_K} 이하인 구간은 ${atMost} 개입니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 개수 맵에 남기는 누적합의 개수. */
  "cost-window": () => {
    const full = countWithMap(WALK, WALK_K);
    assertSame(WALK, WALK_K, full.answer);
    const longest = Math.max(
      ...answerRanges(WALK, WALK_K).map(([l, r]) => r - l + 1),
    );
    const Ws = [1, 2, 3, 4, WALK.length + 1];
    const rows = Ws.map((W) => {
      const r = countWithWindow(WALK, WALK_K, W);
      return [
        W === WALK.length + 1 ? `${W} (전부)` : String(W),
        String(r.lookups),
        String(r.answer),
        String(full.answer - r.answer),
      ];
    });
    const enough = Ws.find(
      (W) => countWithWindow(WALK, WALK_K, W).answer === full.answer,
    );
    return withNote(
      md(["남기는 누적합 W", "조회 수", "답", "놓친 답"], rows, [1, 2, 3]),
      `W 를 줄여도 조회 수는 ${full.lookups} 번 그대로이고 답만 줄어듭니다. 놓친 답이 0 이 되는 것은 W 가 ${enough} 이상일 때이고, 전개 입력에서 가장 긴 답 구간이 ${longest} 칸입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () => {
    const want = subarraySumEqualsK([...WALK], WALK_K);
    return block([
      `const nums = [${WALK.join(", ")}];`,
      `const k = ${WALK_K};`,
      `// 이 절이 끝나면 ${want}${josa(want, "이", "가")} 나와야 한다`,
    ]);
  },

  /** `deep.walk.step` 1 — 준비 조각만 실행한 상태. */
  "walk-init": () => {
    const t = walk();
    return block([
      `seen = ${showMap(t.seed)}   prefix = 0   answer = 0`,
      "    └ 원소를 하나도 더하지 않은 누적합 P[0] = 0 이 한 번 들어 있다",
    ]);
  },

  /** `deep.walk.step` 2 — 조회 조각을 두 걸음 실행한 결과. */
  "walk-lookup-two": () => {
    const rows = [scanAt(0), scanAt(1)].map((s) => [
      `T${s.r + 2}`,
      String(s.value),
      String(s.prefix),
      String(s.target),
      showMap(s.before),
      s.found > 0 ? String(s.found) : "없음 → 0",
      String(s.answer),
    ]);
    return md(
      ["걸음", "값", "prefix", "찾는 키", "개수 맵", "찾은 개수", "answer"],
      rows,
      [1, 2, 3, 6],
    );
  },

  /** `deep.walk.pause` — 빈 누적합을 미리 세어 두지 않으면 어느 답이 빠지는가. */
  "pause-no-seed": () => {
    const rows = SEED_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = noSeed.subarraySumEqualsK([...nums], k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(noSeed, rows);
    return md(
      ["입력", "k", "정본", "빈 누적합을 안 센 코드", "판정"],
      rows.map((r) => [
        show(r.nums),
        String(r.k),
        String(r.bare),
        String(r.mutated),
        r.bare === r.mutated ? "같다" : "다르다",
      ]),
      [1, 2, 3],
    );
  },

  /** `deep.walk.pause` — 입력마다 답 구간과, 그중 왼쪽 끝이 0 인 것. */
  "pause-no-seed-left": () => {
    const rows = SEED_CASES.map(([nums, k]) => {
      const ranges = answerRanges(nums, k);
      const zero = ranges.filter(([l]) => l === 0);
      return [
        show(nums),
        String(k),
        ranges.length > 0 ? ranges.map(span).join(" · ") : "없음",
        zero.length > 0 ? zero.map(span).join(" · ") : "없음",
      ];
    });
    return md(["입력", "k", "답 구간", "왼쪽 끝이 0 인 구간"], rows, [1]);
  },

  /** `deep.walk.step` 3 — 새 키를 넣는 걸음과 개수를 늘리는 걸음. */
  "walk-record": () => {
    const again = scanAt(CONCEPT_R);
    const rows = [firstOf(again), again].map((s) => [
      `T${s.r + 2}`,
      String(s.prefix),
      showMap(s.before),
      showMap(s.after),
      `${s.before.length} 개 → ${s.after.length} 개`,
    ]);
    return md(
      ["걸음", "prefix", "기록 전 개수 맵", "기록 뒤 개수 맵", "키의 수"],
      rows,
      [1],
    );
  },

  /** `deep.walk.pause` — 기록을 조회보다 먼저 하면 어떻게 되는가. */
  "pause-record-first": () => {
    const rows = ORDER_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = recordBeforeLookup(nums, k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(null, rows);
    return md(
      ["입력", "k", "n", "정본", "기록을 먼저 한 코드", "늘어난 수"],
      rows.map((r) => [
        show(r.nums),
        String(r.k),
        String(r.nums.length),
        String(r.bare),
        String(r.mutated),
        String(r.mutated - r.bare),
      ]),
      [1, 2, 3, 4, 5],
    );
  },

  /** `deep.walk.step` 4 — 고정 입력을 끝까지 처리한 걸음별 상태값과 분기 판정. */
  "walk-trace": () => {
    const t = walk();
    const rows: string[][] = [
      ["T1", "—", "—", "0", "—", "루프 전", `seen.set(0, 1)`, "0"],
    ];
    for (const s of t.scans) {
      const old = s.before.find(([key]) => key === s.prefix)?.[1] ?? 0;
      rows.push([
        `T${s.r + 2}`,
        String(s.r),
        String(s.value),
        String(s.prefix),
        String(s.target),
        s.found > 0
          ? `seen.get(${s.target}) = ${s.found} — 있다`
          : `seen.get(${s.target}) 이 undefined — ?? 0 으로 0`,
        old === 0
          ? `키 ${s.prefix}${이가(s.prefix)} 처음 — 1 로 넣는다`
          : `키 ${s.prefix}${이가(s.prefix)} 이미 ${old} — ${old + 1}${으로(old + 1)} 늘린다`,
        String(s.answer),
      ]);
    }
    return md(
      ["걸음", "r", "값", "prefix", "찾는 키", "① 조회", "② 기록", "answer"],
      rows,
      [1, 2, 3, 4, 7],
    );
  },

  /** `deep.walk.step` 4 — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const t = walk();
    const T = (s: Scan) => `T${s.r + 2}`;
    const hit = t.scans.filter((s) => s.found > 0);
    const miss = t.scans.filter((s) => s.found === 0);
    const fresh = t.scans.filter(
      (s) => !s.before.some(([key]) => key === s.prefix),
    );
    const again = t.scans.filter((s) =>
      s.before.some(([key]) => key === s.prefix),
    );
    return block([
      ...columns([
        ["① 조회 · 키가 있다", hit.map(T).join(" "), `${hit.length} 번`],
        ["① 조회 · 키가 없다", miss.map(T).join(" "), `${miss.length} 번`],
        ["② 기록 · 새 키", fresh.map(T).join(" "), `${fresh.length} 번`],
        ["② 기록 · 개수 +1", again.map(T).join(" "), `${again.length} 번`],
      ]),
      `    └ 조회와 기록이 각각 ${t.scans.length} 번 = n. 키가 있던 ${hit.length} 걸음이 답 ${t.answer}${을를(t.answer)} 만든다`,
    ]);
  },

  /** `deep.walk.step` 4 — 조회가 찾은 누적합이 가리키는 구간. */
  "walk-found-ranges": () => {
    const t = walk();
    const P = prefixes(WALK);
    const rows = t.scans
      .filter((s) => s.found > 0)
      .flatMap((s) =>
        foundRanges(WALK, s).map(([l, r]) => {
          const xs = WALK.slice(l, r + 1);
          return [
            `T${s.r + 2}`,
            `P[${l}] = ${P[l]}`,
            `P[${r + 1}] = ${P[r + 1]}`,
            span([l, r]),
            `${plus(xs)} = ${sum(xs)}`,
          ];
        }),
      );
    return md(["걸음", "왼쪽 칸", "오른쪽 칸", "구간", "구간의 합"], rows);
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 부른 결과. */
  "final-calls": () => {
    const calls: [number[], number][] = [
      [[...WALK], WALK_K],
      [[1, 1, 1], 2],
      [[1, -1, 1, -1], 0],
      [[1, 2, 3], 100],
      [[], WALK_K],
    ];
    return block(
      columns(
        calls.map(([nums, k]) => [
          `subarraySumEqualsK([${nums.join(", ")}], ${k})`,
          `→  ${subarraySumEqualsK([...nums], k)}`,
        ]),
      ),
    );
  },

  /** `related` — 찾은 걸음마다 「필요한 나머지」. */
  "related-lookups": () => {
    const rows = walk()
      .scans.filter((s) => s.found > 0)
      .map((s) => [
        `T${s.r + 2}`,
        String(s.prefix),
        String(WALK_K),
        `${s.prefix} − ${WALK_K} = ${s.target}`,
        String(s.found),
      ]);
    return md(
      ["걸음", "지금 가진 값 prefix", "목표 k", "필요한 나머지", "받은 개수"],
      rows,
      [1, 2, 4],
    );
  },

  /** `deep.math` ② — 정의를 값에 넣어 본다. */
  "math-check": () => {
    const P = prefixes(WALK);
    return block([
      `nums 의 값 ${WALK.join(" ")}`,
      "",
      "  P[0] = 0",
      ...[1, 2, 3].map(
        (j) =>
          `  P[${j}] = P[${j - 1}] + nums[${j - 1}] = ${P[j - 1]} + ${WALK[j - 1]} = ${P[j]}`,
      ),
    ]);
  },

  /** `deep.math` ② — 구간 합이 두 누적합의 차라는 것을 값으로. */
  "math-split": () => {
    const P = prefixes(WALK);
    const [l, r] = [2, CONCEPT_R];
    const inner = WALK.slice(l, r + 1);
    return block([
      `l = ${l}, r = ${r}`,
      "",
      ...columns([
        [
          `  t = 0 … ${r} 의 합`,
          `${plus(WALK.slice(0, r + 1))} = ${P[r + 1]}`,
          `P[${r + 1}]`,
        ],
        [
          `  t = 0 … ${l - 1} 의 합`,
          `${plus(WALK.slice(0, l))} = ${P[l]}`,
          `P[${l}]`,
        ],
        [`  t = ${l} … ${r} 의 합`, `${plus(inner)} = ${sum(inner)}`, ""],
      ]),
      `    └ 앞의 둘이 겹치는 항이 없고 ${P[r + 1]} = ${P[l]} + ${sum(inner)} 이다`,
    ]);
  },

  /** `deep.math` ② — 집합 A 를 값으로 편다. */
  "math-set": () => {
    const P = prefixes(WALK);
    const ranges = answerRanges(WALK, WALK_K);
    const want = subarraySumEqualsK([...WALK], WALK_K);
    return block([
      ...columns(
        ranges.map(([l, r]) => [
          `  (${l}, ${r})`,
          `P[${r + 1}] − P[${l}] = ${P[r + 1]} − ${P[l]} = ${(P[r + 1] as number) - (P[l] as number)}`,
        ]),
      ),
      `    └ |A| = ${ranges.length} 이고, 정본의 답 ${want}${과와(want)} 같다`,
    ]);
  },

  /** `deep.math` ② — 합을 오른쪽 칸 j 로 갈라 값으로 편다. */
  "math-by-j": () => {
    const t = walk();
    const P = prefixes(WALK);
    const rows = t.scans.map((s) => {
      const j = s.r + 1;
      return [
        String(j),
        String(P[j]),
        String(s.target),
        String(P.slice(0, j).filter((v) => v === s.target).length),
      ];
    });
    const total = sum(rows.map((r) => Number(r[3])));
    return withNote(
      md(["j", "P[j]", "P[j] − k", "앞 칸 중 그 값인 칸"], rows, [0, 1, 2, 3]),
      `넷째 열을 더하면 ${total} 이고, |A| 와 같습니다.`,
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE_N.map((n) => {
      const zeros = new Array<number>(n).fill(0);
      const run = countWithMap(zeros, 0);
      assertSame(zeros, 0, run.answer);
      if (run.answer !== rangeCount(n) || run.mapOps !== mapOps(n)) {
        throw new Error(`n = ${n} 에서 실측이 닫힌 형태와 다르다`);
      }
      return [
        num(n),
        num(run.answer),
        num(rangeCount(n)),
        num(run.mapOps),
        num(mapOps(n)),
      ];
    });
    return withNote(
      md(
        ["n", "답(실측)", "n(n+1)/2", "맵 연산(실측)", "3n + 1"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `원소가 전부 0 이고 k = 0 인 입력입니다. 실측값이 닫힌 형태와 ${SCALE_N.length} 규모에서 모두 같습니다.`,
    );
  },

  /** `deep.math` ④ — 규모의 끝에서 답의 최댓값과 기본 연산의 비. */
  "math-max": () => {
    const most = rangeCount(N_MAX);
    const ops = mapOps(N_MAX);
    return block([
      `n = ${num(N_MAX)} 에서`,
      ...columns([
        [
          "  답의 최댓값",
          `n(n+1)/2 = ${num(most)}`,
          "32 비트 정수의 범위를 넘는다",
        ],
        ["  맵 연산", `3n + 1 = ${num(ops)}`, ""],
        [
          "  둘의 비",
          `${num(most)} ÷ ${num(ops)} ≈ ${num(Math.round(most / ops))}`,
          "",
        ],
      ]),
    ]);
  },

  /** `invariant` ① — 한 걸음 직후를 불변식의 두 문장에 대어 본다. */
  "invariant-at-t4": () => {
    const s = scanAt(2);
    const P = prefixes(WALK);
    const cells = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => `P[${from + i}]`).join(
        " ",
      );
    const upTo = answerRanges(WALK, WALK_K).filter(([, r]) => r <= s.r);
    if (upTo.length !== s.answer) throw new Error("answer 가 정의와 다르다");
    return block(
      columns([
        [
          `T${s.r + 2} 직후`,
          "개수 맵에 든 칸",
          cells(0, s.r + 1),
          showMap(s.after),
        ],
        ["", "아직 안 든 칸", cells(s.r + 2, P.length - 1), ""],
        [
          "",
          `answer = ${s.answer}`,
          `오른쪽 끝이 ${s.r} 이하인 답`,
          upTo.map(span).join(" · "),
        ],
      ]),
    );
  },

  /** `invariant` ② — 걸음마다 개수 맵과 answer 를 정의와 대조한다. */
  "invariant-hold": () => {
    const t = walk();
    const P = prefixes(WALK);
    const ranges = answerRanges(WALK, WALK_K);
    let checked = 0;
    const rows = t.scans.map((s) => {
      const j = s.r + 1;
      const byDef = new Map<number, number>();
      for (const v of P.slice(0, j + 1)) byDef.set(v, (byDef.get(v) ?? 0) + 1);
      const same = JSON.stringify([...byDef]) === JSON.stringify(s.after);
      const upTo = ranges.filter(([, r]) => r <= s.r).length;
      if (!same || upTo !== s.answer) throw new Error("불변식이 깨졌다");
      checked += byDef.size;
      return [
        `T${s.r + 2}`,
        `P[0] … P[${j}]`,
        String(s.after.length),
        String(s.answer),
        String(upTo),
      ];
    });
    return withNote(
      md(
        [
          "걸음",
          "지나온 누적합",
          "개수 맵의 키",
          "answer",
          "오른쪽 끝이 r 이하인 답",
        ],
        rows,
        [2, 3, 4],
      ),
      `걸음마다 개수 맵을 지나온 누적합을 직접 센 값과 대조했습니다. 키 ${checked} 개를 대조했고 어긋난 키는 0 개이며, answer 는 ${rows.length} 걸음 모두 오른쪽 끝이 r 이하인 답의 수와 같습니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  "invariant-edges": () =>
    md(
      ["경우", "입력", "k", "결과"],
      EDGE_CASES.map(([name, nums, k]) => [
        name,
        show(nums),
        String(k),
        String(subarraySumEqualsK([...nums], k)),
      ]),
      [2, 3],
    ),

  /** `invariant` ③ — 개수를 더하던 줄에서 1 만 적으면 무엇이 나오는가. */
  "mutant-count-once": () => {
    const rows = COUNT_CASES.map(([nums, k]) => {
      const bare = subarraySumEqualsK([...nums], k);
      const mutated = countOnce.subarraySumEqualsK([...nums], k);
      return { nums, k, bare, mutated };
    });
    assertBreaks(countOnce, rows);
    return md(
      ["입력", "k", "정본", "개수 대신 1 을 적은 코드", "판정"],
      rows.map((r) => [
        show(r.nums),
        String(r.k),
        String(r.bare),
        String(r.mutated),
        r.bare === r.mutated ? "같다" : "다르다",
      ]),
      [1, 2, 3],
    );
  },

  /** `invariant` ③ — [0 0 0] 의 앞부분마다 두 코드의 answer. 늘어난 수가 그 걸음의 조회 결과다. */
  "mutant-growth": () => {
    const zeros = [0, 0, 0];
    let lastBare = 0;
    let lastMut = 0;
    const rows = zeros.map((_, i) => {
      const part = zeros.slice(0, i + 1);
      const bare = subarraySumEqualsK([...part], 0);
      const mutated = countOnce.subarraySumEqualsK([...part], 0);
      const row = [
        show(part),
        String(bare),
        `+${bare - lastBare}`,
        String(mutated),
        `+${mutated - lastMut}`,
      ];
      lastBare = bare;
      lastMut = mutated;
      return row;
    });
    return md(
      [
        "앞부분",
        "정본 answer",
        "정본이 늘어난 수",
        "깨진 코드 answer",
        "깨진 코드가 늘어난 수",
      ],
      rows,
      [1, 3],
    );
  },

  /** `perf.derive` — 전개 걸음에서 세 연산을 센다. */
  "perf-derive": () => {
    const t = walk();
    const Ts = t.scans.map((s) => `T${s.r + 2}`).join(" ");
    const n = t.scans.length;
    return block([
      ...columns([
        ["더하기", Ts, `걸음마다 한 번 → 정확히 ${n} 번 = n`],
        ["조회", Ts, `걸음마다 한 번 → 정확히 ${n} 번 = n`],
        ["기록", Ts, `걸음마다 한 번 → 정확히 ${n} 번 = n`],
      ]),
      "    └ T1 은 루프 밖이고 개수 맵에 한 번 적는 것이 전부다",
    ]);
  },

  /** `perf.bounds` — 전개 입력의 실측과 규모의 끝. */
  "perf-total": () => {
    const small = countWithMap(WALK, WALK_K);
    assertSame(WALK, WALK_K, small.answer);
    if (small.mapOps !== mapOps(WALK.length)) {
      throw new Error("전개 입력의 맵 연산이 3n + 1 과 다르다");
    }
    return block(
      columns([
        [
          `n = ${WALK.length}`,
          `맵 연산 ${small.mapOps} 번`,
          `실측 — 3 × ${WALK.length} + 1 과 같다`,
        ],
        [
          `n = ${num(N_MAX)}`,
          `맵 연산 ${num(mapOps(N_MAX))} 번`,
          `개수 맵의 키는 많아야 ${num(N_MAX + 1)} 개`,
        ],
      ]),
    );
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 조회 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1_000;
    const shapes: [string, number[], number][] = [
      ["전부 0 · k = 0", new Array<number>(n).fill(0), 0],
      ["전부 1 · k = 5", new Array<number>(n).fill(1), 5],
      ["1 2 3 … n · k = 0", Array.from({ length: n }, (_, i) => i + 1), 0],
    ];
    const rows = shapes.map(([name, nums, k]) => {
      const r = countWithMap(nums, k);
      assertSame(nums, k, r.answer);
      return [name, num(r.lookups), num(r.keys), num(r.answer)];
    });
    const same = new Set(rows.map((r) => r[1])).size === 1;
    return withNote(
      md(
        [`입력의 모양 (n = ${num(n)})`, "조회 수", "개수 맵의 키", "답"],
        rows,
        [1, 2, 3],
      ),
      `조회 수는 세 줄이 ${same ? "모두 같습니다" : "서로 다릅니다"}. 답이 가장 많은 첫 줄은 키가 가장 적고, 답이 없는 셋째 줄은 키가 가장 많습니다.`,
    );
  },

  /** `selfcheck` — T7 에서 찾은 개수. */
  "selfcheck-t7": () => {
    const s = scanAt(CONCEPT_R);
    return block([
      `T${s.r + 2}  prefix = ${s.prefix}  찾는 키 ${s.target}  찾은 개수 ${s.found}  answer ${s.answer}`,
      `    └ 개수 맵에 키 ${s.target}${이가(s.target)} ${s.found} 번 들어 있었다`,
    ]);
  },
};
