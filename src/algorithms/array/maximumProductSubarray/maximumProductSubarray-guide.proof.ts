/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as BENCH_N,
  U as BENCH_U,
  cases as benchCases,
} from "./maximumProductSubarray-guide.alt.ts";
import {
  byAllPairs,
  byCarrying,
  CANDIDATE_END,
  endingProducts,
  fromName,
  MAX_ONLY_BREAK,
  maxOnly,
  maxOnlyTrace,
  N_MAX,
  num,
  paren,
  productOf,
  type Round,
  secondsOf,
  span,
  trace,
  V_MAX,
  WALK,
} from "./maximumProductSubarray-guide.fig.tsx";
import { maximumProductSubarray } from "./maximumProductSubarray-guide.ref.ts";

const REF = new URL("./maximumProductSubarray-guide.ref.ts", import.meta.url)
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

/** `[3 -4 7]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

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

/** 곱을 적은 식 — `2 × (-3) × (-2)`. */
const times = (xs: readonly number[]): string => xs.map(paren).join(" × ");

/** `-0` 을 `0` 으로 — `0 × (-1)` 이 `-0` 이다. */
const zz = (v: number): number => (Object.is(v, -0) ? 0 : v);

/* ────────────────────────── 후보와 변이 ────────────────────────── */

/** 상태를 하나도 안 이어받는 후보 — 가장 큰 원소 하나를 답으로 낸다. */
function biggestElement(A: readonly number[]): number {
  let best = A[0] as number;
  for (const x of A) best = Math.max(best, x);
  return best;
}

/** 칸 `N` 개짜리 배열 둘을 그대로 잡는 후보 — mx 와 mn 을 다 만든 뒤 최댓값을 고른다. */
function dpArrays(A: readonly number[]): number {
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
  return zz(best);
}

/**
 * 칸 0 부터 칸 `r` 까지의 모든 구간 가운데 곱이 가장 작은 것 — 「먼저 알아 둘 개념」 (e) 가 대조하는
 * 헷갈리기 쉬운 모양이다. 곱이 같으면 먼저 찾은 구간을 둔다.
 */
function minUpTo(
  A: readonly number[],
  r: number,
): { value: number; range: [number, number] } {
  let value = A[0] as number;
  let range: [number, number] = [0, 0];
  for (let rr = 0; rr <= r; rr++) {
    for (let l = 0; l <= rr; l++) {
      const p = productOf(A, l, rr);
      if (p < value) {
        value = p;
        range = [l, rr];
      }
    }
  }
  return { value, range };
}

interface PairState {
  readonly curMax: number;
  readonly curMin: number;
  readonly best: number;
}

/**
 * 칸마다 끝나는 두 값을 규칙대로 굴린 기록 — 변이가 칸마다 어떻게 갈리는지 펼칠 때 쓴다. 규칙을 넘기지
 * 않으면 정본과 같은 규칙이고, 그때의 답은 정본과 대조한다.
 */
function pairRounds(
  A: readonly number[],
  rules: {
    max?: (x: number, grown: number, flipped: number) => number;
    min?: (x: number, grown: number, flipped: number, max: number) => number;
  } = {},
): PairState[] {
  const maxRule = rules.max ?? ((x, g, f) => Math.max(x, g, f));
  const minRule = rules.min ?? ((x, g, f) => Math.min(x, g, f));
  let curMax = A[0] as number;
  let curMin = A[0] as number;
  let best = A[0] as number;
  const out: PairState[] = [{ curMax, curMin, best }];
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    const grown = curMax * x;
    const flipped = curMin * x;
    curMax = maxRule(x, grown, flipped);
    curMin = minRule(x, grown, flipped, curMax);
    best = Math.max(best, curMax);
    out.push({ curMax: zz(curMax), curMin: zz(curMin), best: zz(best) });
  }
  if (
    rules.max === undefined &&
    rules.min === undefined &&
    best !== maximumProductSubarray([...A])
  ) {
    throw new Error("규칙대로 굴린 기록이 정본과 다른 답을 냈다");
  }
  return out;
}

interface Impl {
  maximumProductSubarray(A: number[]): number;
}

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

/** 최솟값이 직전 최솟값을 이어받는 후보를 잃은 사본. 불변식의 최솟값 절반을 지키던 바로 그 줄이다. */
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
const WALK_CASE: Case = { name: `전개 입력 ${show(WALK)}`, A: [...WALK] };

const CARRY_CASES: Case[] = [
  WALK_CASE,
  NAMED([...MAX_ONLY_BREAK]),
  NAMED([-2, 3, -4]),
  NAMED([2, 3, 4]),
  NAMED([1, 2, 3]),
];

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

const MIN_CARRY_CASES: Case[] = [
  WALK_CASE,
  NAMED([-3, 2, 5, -4]),
  NAMED([-2, 3, 3, -3]),
  NAMED([2, 3, 4]),
  NAMED([-10, -10]),
];

const STATE_CASES: number[][] = [
  [...WALK],
  [...MAX_ONLY_BREAK],
  [2, 0, 3],
  [-4, -3, -2],
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 6, 64, 1000];

/**
 * 규칙으로 만든 입력 — `((k · 37) mod 3) − 1`. 값이 −1 · 0 · 1 이라 긴 배열에서도 곱이 표현 범위 안에 남아
 * 두 방식의 답을 정확히 대조할 수 있다. 두 방식 다 값을 보지 않고 정해진 수의 연산을 하므로 값의 범위는
 * 계수를 바꾸지 않는다. 난수가 없어 시드가 없다.
 */
const ruled = (n: number): number[] =>
  Array.from({ length: n }, (_, k) => ((k * 37) % 3) - 1);

/**
 * 변이가 답을 바꾼 자리가 하나라도 있는지 본다. 하나도 안 바뀌면 「깨진다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다**(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화하면 변이 모듈이
 * 정본 모듈 그 자체라 함수가 같은 객체다 — 그때 던지면 그 블록의 갈림 대조가 한 번도 안 돈다.
 */
function assertBreaks(mutant: Impl, gaps: number[]): void {
  if (mutant.maximumProductSubarray === maximumProductSubarray) return;
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

/** 값이 전부 `V_MAX` 인 배열의 답. */
const allMax = (len: number): number =>
  maximumProductSubarray(new Array<number>(len).fill(V_MAX));

/** 값이 전부 `V_MAX` 인 배열의 답이 정확한 정수와 어긋나는 첫 칸 수. */
function firstInexact(): number {
  for (let k = 1; k <= 400; k++) {
    const got = allMax(k);
    if (!Number.isFinite(got)) return k;
    if (BigInt(got) !== BigInt(V_MAX) ** BigInt(k)) return k;
  }
  throw new Error("400 칸까지 값이 정확했다 — 전제가 바뀌었다");
}

/** 값이 전부 `V_MAX` 인 배열이 표현 범위를 넘는 첫 칸 수. */
function firstOverflow(): number {
  for (let k = 1; k <= 400; k++) {
    if (!Number.isFinite(allMax(k))) return k;
  }
  throw new Error("400 칸까지 표현 범위를 넘지 않았다 — 전제가 바뀌었다");
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

  /** `concept` — 칸 2 에서 음수를 곱하면 작던 쪽이 커진다. */
  "concept-flip": () => {
    const rounds = trace(WALK);
    const before = rounds[1] as Round;
    const r = rounds[2] as Round;
    if (r.maxFrom !== "flipped") {
      throw new Error("칸 2 가 보이려는 모양이 아니다");
    }
    return [
      md(
        [
          "이어 붙이는 쪽",
          "칸 1 에서 끝나는 곱",
          `A[2] = ${r.x}${을를(r.x)} 곱한 값`,
        ],
        [
          [
            "가장 큰 곱 mx[1]",
            String(before.curMax),
            `${paren(before.curMax)} × ${paren(r.x)} = ${r.grown}`,
          ],
          [
            "가장 작은 곱 mn[1]",
            String(before.curMin),
            `${paren(before.curMin)} × ${paren(r.x)} = ${r.flipped}`,
          ],
        ],
        [1],
      ),
      "",
      `작았던 ${before.curMin} 쪽이 ${r.flipped}${으로(r.flipped as number)} 바뀌어 더 큰 곱이 됩니다. 칸 2 에서 끝나는 곱의 최댓값 mx[2] 는 ${r.curMax} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 모든 쌍을 곱하는 방법의 기본 연산 수. */
  "origin-cost": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const A = ruled(n);
      const c = byAllPairs(A);
      if (c.muls + c.cmps !== n * (n + 1)) {
        throw new Error(`N = ${n} 에서 센 연산이 N(N+1) 과 다르다`);
      }
      if (c.answer !== maximumProductSubarray(A)) {
        throw new Error("모든 쌍의 답이 정본과 다르다");
      }
      rows.push([
        num(n),
        num(c.muls),
        num(c.muls + c.cmps),
        secondsOf(c.muls + c.cmps),
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
      "쌍 하나마다 곱셈 1 번과 비교 1 번입니다. 실행해서 센 두 규모에서 기본 연산이 N(N+1) 과 정확히 같았습니다.",
    ].join("\n");
  },

  /** `deep.origin` ③ — 작은 입력에서 쌍마다 만든 곱과 되풀이되는 곱셈. */
  "origin-repeat": () => {
    const A = WALK.slice(0, 3);
    const rows: string[][] = [];
    let muls = 0;
    for (let l = 0; l < A.length; l++) {
      const prods: string[] = [];
      for (let r = l; r < A.length; r++) {
        prods.push(`[${l},${r}] = ${productOf(A, l, r)}`);
        muls++;
      }
      rows.push([String(l), dots(prods), String(prods.length)]);
    }
    const last = A.length - 1;
    const ending = endingProducts(A, last);
    return [
      md(["왼쪽 끝 l", "만든 곱", "곱셈"], rows, [0, 2]),
      "",
      `A = ${show(A)} 에서 곱셈은 모두 ${muls} 번이고, 칸 ${last}${은는(last)} ${A.length} 줄이 저마다 다시 곱했습니다. 칸 ${last} 에서 끝나는 곱 ${dots(ending)} 가운데 가장 큰 것은 ${Math.max(...ending)}, 가장 작은 것은 ${Math.min(...ending)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 최댓값 하나만 이어받는 후보가 어디서 어긋나는가. */
  "carry-max-only": () => {
    const { rows } = contrast(CARRY_CASES, (A) => maxOnly(A));
    return [
      md(CONTRAST_HEAD("최댓값만 이어받은 답"), rows, [1, 2]),
      "",
      "틀린 세 줄은 음수 두 개를 함께 고른 구간이 답인 입력입니다. 값이 전부 양수면 답이 같습니다.",
    ].join("\n");
  },

  /** `deep.origin` ⑤ — `[3 -2 -5]` 에서 최댓값만 이어받으면 무엇을 버리는가. */
  "carry-max-only-trace": () => {
    const A = [...MAX_ONLY_BREAK];
    const t = maxOnlyTrace(A);
    const rows = t.map((c, k) => {
      if (k === 0) return [String(c.i), String(c.x), "—", String(c.kept), "—"];
      const prev = t[k - 1] as (typeof t)[number];
      return [
        String(c.i),
        String(c.x),
        `${c.x} · ${paren(prev.kept)} × ${paren(c.x)} = ${zz(prev.kept * c.x)}`,
        String(c.kept),
        String(c.dropped),
      ];
    });
    const lost = (t[1] as (typeof t)[number]).dropped as number;
    const x2 = A[2] as number;
    const truth = maximumProductSubarray([...A]);
    if (lost * x2 !== truth) throw new Error("버린 값이 답의 재료가 아니다");
    return [
      md(
        ["칸 i", "A[i]", "두 후보", "이어받은 최댓값", "버린 값"],
        rows,
        [0, 1, 3, 4],
      ),
      "",
      `칸 1 에서 버린 ${lost} 에 A[2] = ${x2}${을를(x2)} 곱하면 ${truth} 이고, 그것이 이 입력의 답입니다. 최댓값만 이어받은 답은 ${maxOnly(A)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 곱셈·비교 횟수. */
  "cost-two-ways": () => {
    const pairs = byAllPairs(WALK);
    const carry = byCarrying(WALK);
    if (pairs.answer !== carry.answer) throw new Error("두 방식의 답이 다르다");
    const n = WALK.length;
    return [
      md(
        [
          "방식",
          `곱셈 (N = ${n})`,
          `비교 (N = ${n})`,
          `기본 연산 (N = ${n})`,
          `기본 연산 (N = ${num(N_MAX)})`,
        ],
        [
          [
            "모든 (l, r) 쌍의 곱을 각각 만든다",
            num(pairs.muls),
            num(pairs.cmps),
            num(pairs.muls + pairs.cmps),
            num(N_MAX * (N_MAX + 1)),
          ],
          [
            "최댓값과 최솟값을 함께 이어받는다",
            num(carry.muls),
            num(carry.cmps),
            num(carry.muls + carry.cmps),
            num(7 * (N_MAX - 1)),
          ],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `두 방식 모두 답은 ${carry.answer} 입니다. 아래 방식은 칸 하나에 곱셈 ${carry.muls / (n - 1)} 번과 비교 ${carry.cmps / (n - 1)} 번을 씁니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — `mn[3]` 과 `mx[3]` 을 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const r = CANDIDATE_END;
    const prods = endingProducts(WALK, r);
    const low = Math.min(...prods);
    const top = Math.max(...prods);
    return [
      `mn[${r}]  →  오른쪽 끝이 칸 ${r}  →  후보 [0,${r}] … [${r},${r}] ${prods.length} 개`,
      `       →  곱 ${prods.join(" ")}  →  가장 작은 곱 ${low}, 구간 [${prods.indexOf(low)},${r}]`,
      `mx[${r}]  →  ${padRight(`같은 후보 ${prods.length} 개`, width(`오른쪽 끝이 칸 ${r}`))}  →  가장 큰 곱 ${top}, 구간 [${prods.indexOf(top)},${r}]`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 이웃한 두 칸의 구간이 어떻게 이어지는가. */
  "build-neighbors": () => {
    const rounds = trace(WALK);
    const rows: string[][] = [];
    const fromMin: number[] = [];
    const keep: number[] = [];
    for (const r of rounds.slice(1)) {
      const b = rounds[r.i - 1] as Round;
      if (r.maxFrom === "flipped" && r.grown !== r.flipped) {
        if (r.x >= 0) throw new Error("양수를 곱했는데 mx 가 mn 에서 왔다");
        fromMin.push(r.i);
      }
      if (r.x > 0 && r.maxFrom === "grown" && r.minFrom === "flipped") {
        keep.push(r.i);
      }
      rows.push([
        String(r.i),
        String(r.x),
        `${span([b.maxStart, r.i - 1])} = ${b.curMax}`,
        `${span([b.minStart, r.i - 1])} = ${b.curMin}`,
        `${span([r.maxStart, r.i])} = ${r.curMax} (${fromName(r, "max")})`,
        `${span([r.minStart, r.i])} = ${r.curMin} (${fromName(r, "min")})`,
      ]);
    }
    return [
      md(
        [
          "i",
          "A[i]",
          "mx[i−1] 의 구간",
          "mn[i−1] 의 구간",
          "mx[i] 의 구간",
          "mn[i] 의 구간",
        ],
        rows,
        [0, 1],
      ),
      "",
      `mx[i] 가 직전 최솟값의 구간에 칸 i 를 붙여 만들어진 칸은 ${dots(fromMin)} 이고, 그 칸의 A[i] 는 음수입니다. 양수를 곱한 칸 ${dots(keep)} 에서는 mx 가 mx 에서, mn 이 mn 에서 왔습니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 「칸 i 까지의 최소곱」은 칸 i+1 을 붙일 수 없다. */
  "build-confuse": () => {
    const A = [-5, 0, -3];
    const rounds = trace(A);
    const upTo = minUpTo(A, 1);
    const r1 = rounds[1] as Round;
    const x = A[2] as number;
    const real = endingProducts(A, 2);
    const fake = zz(upTo.value * x);
    const joined = zz(r1.curMin * x);
    if (upTo.range[1] === 1) {
      throw new Error("칸 1 까지의 최소곱이 칸 1 에서 끝난다");
    }
    if (real.includes(fake))
      throw new Error("이어 붙인 값이 실제 구간의 곱이다");
    if (!real.includes(joined)) {
      throw new Error("mn 에 붙인 값이 구간의 곱이 아니다");
    }
    const answer = maximumProductSubarray([...A]);
    return [
      md(
        [
          "줄",
          "칸 1 의 값",
          "그 값의 구간",
          `A[2] = ${x}${을를(x)} 곱한 값`,
          "이어진 구간의 곱",
        ],
        [
          [
            "칸 1 까지의 최소곱",
            String(upTo.value),
            span(upTo.range),
            String(fake),
            "아니다 — 칸 1 을 건너뛴다",
          ],
          [
            "칸 1 에서 끝나는 최소곱 mn[1]",
            String(r1.curMin),
            span([r1.minStart, 1]),
            String(joined),
            `맞다 — ${span([r1.minStart, 2])} 의 곱`,
          ],
        ],
        [1, 3],
      ),
      "",
      `입력 ${show(A)} 에서 칸 2 에서 끝나는 곱은 ${dots(real)} 뿐이고, 이 입력의 답은 ${answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (f) — 곱하는 수의 부호에 따라 곱들의 순서가 통째로 지켜지거나 뒤집힌다. */
  "build-order": () => {
    const rows: string[][] = [];
    for (const i of [2, 3, 4]) {
      const x = WALK[i] as number;
      const before = [...endingProducts(WALK, i - 1)].sort((a, b) => a - b);
      const after = before.map((v) => zz(v * x));
      const top = Math.max(...after);
      const from = before[after.indexOf(top)] as number;
      const where =
        x === 0
          ? "모두 0 으로 같다"
          : from === before[before.length - 1]
            ? `가장 크던 ${from}`
            : `가장 작던 ${from}`;
      rows.push([String(i), String(x), show(before), show(after), where]);
    }
    return md(
      [
        "i",
        "A[i]",
        "칸 i−1 에서 끝나는 곱(작은 순)",
        "A[i] 를 곱한 값(같은 순서)",
        "가장 큰 곱이 온 값",
      ],
      rows,
      [0, 1],
    );
  },

  /** `deep.build` 1단계 — 첫 칸에서 세 상태가 무엇인가. */
  "build-first": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "후보", "값"],
      [
        ["칸 0 에서 끝나는 최대곱 mx[0]", "[0,0] 하나", String(r.curMax)],
        ["칸 0 에서 끝나는 최소곱 mn[0]", "[0,0] 하나", String(r.curMin)],
        ["칸 0 까지의 최댓값 best", "[0,0] 하나", String(r.best)],
      ],
      [2],
    );
  },

  /** `deep.build` 2단계 — A[i] 의 부호로 나눈 세 경우를 값으로. */
  "build-cases": () => {
    const rounds = trace(WALK);
    const groups: [string, (r: Round) => boolean][] = [
      ["A[i] 가 양수", (r) => r.x > 0],
      ["A[i] 가 음수", (r) => r.x < 0],
      ["A[i] 가 0", (r) => r.x === 0],
    ];
    const rows: string[][] = [];
    const hits: number[][] = [];
    for (const [name, pick] of groups) {
      const hit: number[] = [];
      for (const r of rounds.slice(1)) {
        if (!pick(r)) continue;
        const b = rounds[r.i - 1] as Round;
        hit.push(r.i);
        rows.push([
          name,
          String(r.i),
          String(b.curMax),
          String(b.curMin),
          String(r.x),
          String(r.grown),
          String(r.flipped),
          `${r.curMax} (${fromName(r, "max")})`,
          `${r.curMin} (${fromName(r, "min")})`,
        ]);
      }
      hits.push(hit);
    }
    const covered = hits.flat().length;
    if (covered !== WALK.length - 1) {
      throw new Error("세 경우가 반복의 칸을 빠짐없이 덮지 않는다");
    }
    const zero = hits[2] as number[];
    return [
      md(
        [
          "경우",
          "i",
          "mx[i−1]",
          "mn[i−1]",
          "새로 시작 A[i]",
          "최댓값에 잇기",
          "최솟값에 잇기",
          "mx[i]",
          "mn[i]",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `반복의 ${covered} 칸이 세 경우에 빠짐없이 들어갑니다. A[i] 가 0 인 칸 ${dots(zero)} 에서는 후보 셋이 모두 0 이라 두 값이 함께 0 이 됩니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — mx · mn 줄과 best 줄, best 가 커진 칸. */
  "build-best": () => {
    const rounds = trace(WALK);
    const grew = rounds
      .filter((r, k) => k === 0 || r.best > (rounds[k - 1] as Round).best)
      .map((r) => r.i);
    const last = rounds[rounds.length - 1] as Round;
    const top = Math.max(...rounds.map((r) => r.curMax));
    if (top !== last.best) throw new Error("mx 의 최댓값이 best 와 다르다");
    return [
      md(
        ["줄", `칸 0 부터 칸 ${WALK.length - 1} 까지`],
        [
          ["mx", show(rounds.map((r) => r.curMax))],
          ["mn", show(rounds.map((r) => r.curMin))],
          ["best", show(rounds.map((r) => r.best))],
          ["best 가 커진 칸", dots(grew)],
        ],
      ),
      "",
      `마지막 칸의 mx 는 ${last.curMax} 이고 best 는 ${last.best} 입니다. mx ${rounds.length} 칸의 최댓값 ${top}${이가(top)} best 의 마지막 값입니다.`,
    ].join("\n");
  },

  /** `deep.build` 전제 — 곱이 `number` 에 정확히 담긴다는 전제가 어디서 깨지는가. */
  "premise-range": () => {
    const inexact = firstInexact();
    const overflow = firstOverflow();
    const exact = (len: number) => BigInt(V_MAX) ** BigInt(len);
    const exactRows = [inexact - 1, inexact].map((len) => {
      const got = allMax(len);
      return [
        num(len),
        BigInt(got).toString(),
        exact(len).toString(),
        BigInt(got) === exact(len) ? "같다" : "다르다",
      ];
    });
    const rangeRows = [overflow - 1, overflow].map((len) => {
      const got = allMax(len);
      return [
        num(len),
        String(got),
        num(exact(len).toString().length),
        Number.isFinite(got) ? "표현된다" : "표현되지 않는다",
      ];
    });
    return [
      md(["칸 수", "정본이 낸 답", "정확한 답", "판정"], exactRows, [0, 1, 2]),
      "",
      "같은 배열을 더 길게 하면 표현할 수 있는 범위를 넘습니다.",
      "",
      md(
        ["칸 수", "정본이 낸 답", "정확한 답의 자릿수", "판정"],
        rangeRows,
        [0, 1, 2],
      ),
      "",
      `값이 전부 ${V_MAX} 인 배열에서 답이 정확한 정수로 남는 것은 ${num(inexact - 1)} 칸까지이고, ${num(overflow - 1)} 칸을 넘으면 Infinity 가 나옵니다. double 의 상한은 ${Number.MAX_VALUE} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 이어받는 값의 개수를 네 가지로 두고 답을 대조한다. */
  "state-size": () => {
    const impls: [string, (A: readonly number[]) => number, number][] = [
      ["값 0 개", biggestElement, 1],
      ["값 1 개", maxOnly, 2],
      ["값 2 개", (A) => maximumProductSubarray([...A]), 3],
      ["값 2N 개", dpArrays, 2 * N_MAX + 1],
    ];
    const wrong = impls.map(() => 0);
    const rows = STATE_CASES.map((A) => {
      const bare = maximumProductSubarray([...A]);
      const cells = impls.map(([, f], k) => {
        const got = f([...A]);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [show(A), String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `N = ${num(N_MAX)} 에서 잡는 칸(best 포함)`,
      "",
      ...impls.map(([, , cells]) => num(cells)),
    ]);
    const ok = impls.filter((_, k) => wrong[k] === 0).map(([h]) => h);
    return [
      md(["입력", "정답", ...impls.map(([h]) => h)], rows, [1, 2, 3, 4, 5]),
      "",
      `이어받는 값이 하나 이하인 두 후보는 어긋나는 입력이 남고, 어긋난 입력이 0 개인 것은 ${ok.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () => {
    const answer = maximumProductSubarray([...WALK]);
    return [
      `const A = [${WALK.join(", ")}];`,
      `// 이 절이 끝나면 ${answer}${이가(answer)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 세 줄만 실행했을 때의 세 상태. */
  "walk-init": () => {
    const r = trace(WALK)[0] as Round;
    return md(
      ["상태", "값", "뜻"],
      [
        ["curMax", String(r.curMax), "칸 0 에서 끝나는 최대곱"],
        ["curMin", String(r.curMin), "칸 0 에서 끝나는 최소곱"],
        ["best", String(r.best), "칸 0 까지의 답"],
      ],
      [1],
    );
  },

  /** `deep.walk` 2 — 반복 앞 두 바퀴의 상태. */
  "walk-first-two": () => {
    const rounds = trace(WALK);
    const rows = rounds
      .slice(1, 3)
      .map((r) => [
        `T${r.i + 1}`,
        String(r.i),
        String(r.x),
        String(r.x),
        String(r.grown),
        String(r.flipped),
        String(r.curMax),
        String(r.curMin),
      ]);
    const t2 = rounds[1] as Round;
    const t3 = rounds[2] as Round;
    return [
      md(
        [
          "걸음",
          "i",
          "A[i]",
          "새로 시작",
          "최댓값에 잇기",
          "최솟값에 잇기",
          "curMax",
          "curMin",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `T3 에서 curMax 는 ${t3.curMax}${이가(t3.curMax)} 됩니다. 그 재료는 직전 최댓값 ${t2.curMax}${이가(t2.curMax)} 아니라 직전 최솟값 ${t2.curMin} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 최댓값의 후보에서 「새로 시작」을 빼면 무엇이 달라지는가. */
  "pause-drop-fresh": () => {
    const { rows, gaps } = contrast(FRESH_CASES, (A) =>
      dropFresh.maximumProductSubarray(A),
    );
    assertBreaks(dropFresh, gaps);
    return [
      md(CONTRAST_HEAD("새로 시작을 뺀 답"), rows, [1, 2]),
      "",
      "전개 입력에서는 답이 그대로입니다. 0 을 지난 뒤에 답이 만들어지는 입력에서 값이 바뀝니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — `[2 0 3]` 에서 두 코드의 칸마다 curMax. */
  "pause-drop-fresh-trace": () => {
    const A = [2, 0, 3];
    const right = pairRounds(A);
    const wrong = pairRounds(A, { max: (_x, g, f) => Math.max(g, f) });
    const rows = A.map((x, i) => [
      String(i),
      String(x),
      String((right[i] as PairState).curMax),
      String((wrong[i] as PairState).curMax),
    ]);
    const last = A.length - 1;
    const kept = (wrong[last] as PairState).curMax;
    return [
      md(
        ["칸 i", "A[i]", "정본 curMax", "새로 시작을 뺀 curMax"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `칸 1 의 0 을 지나면 이어 붙이는 후보 둘이 모두 0 입니다. 칸 ${last} 에서 정본은 새로 시작한 ${A[last]}${을를(A[last] as number)} 고르고, 새로 시작을 뺀 코드는 ${kept} 에 머뭅니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 최솟값이 이미 갱신된 최댓값을 쓰면 무엇이 달라지는가. */
  "pause-stale-max": () => {
    const { rows, gaps } = contrast(STALE_CASES, (A) =>
      staleMax.maximumProductSubarray(A),
    );
    assertBreaks(staleMax, gaps);
    return [
      md(CONTRAST_HEAD("갱신된 값을 쓴 답"), rows, [1, 2]),
      "",
      "전개 입력에서는 답이 그대로입니다. 음수가 셋 이상 섞인 입력에서 값이 바뀝니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — `[-7 2 -1 -8]` 에서 두 코드의 칸마다 상태. */
  "pause-stale-trace": () => {
    const A = [-7, 2, -1, -8];
    const right = pairRounds(A);
    const wrong = pairRounds(A, {
      min: (x, _g, f, max) => Math.min(x, max * x, f),
    });
    const rows = A.map((x, i) => {
      const a = right[i] as PairState;
      const b = wrong[i] as PairState;
      return [
        String(i),
        String(x),
        String(a.curMax),
        String(a.curMin),
        String(b.curMax),
        String(b.curMin),
      ];
    });
    const split = right.findIndex(
      (a, i) => a.curMin !== (wrong[i] as PairState).curMin,
    );
    const endRight = right[right.length - 1] as PairState;
    const endWrong = wrong[wrong.length - 1] as PairState;
    const truthMin = Math.min(...endingProducts(A, split));
    const wrongMin = (wrong[split] as PairState).curMin;
    if (endingProducts(A, split).includes(wrongMin)) {
      throw new Error("갱신된 값을 쓴 최솟값이 실제 구간의 곱이다");
    }
    return [
      md(
        [
          "칸 i",
          "A[i]",
          "정본 curMax",
          "정본 curMin",
          "갱신된 값을 쓴 curMax",
          "갱신된 값을 쓴 curMin",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `칸 ${split} 에서 처음 갈립니다. 칸 ${split} 에서 끝나는 곱의 최솟값은 ${truthMin} 인데, 갱신된 값을 쓴 코드는 어느 구간의 곱도 아닌 ${wrongMin}${을를(wrongMin)} 적었습니다. 그 값이 다음 칸의 음수를 만나 답이 ${endRight.best} 대신 ${endWrong.best}${이가(endWrong.best)} 됩니다.`,
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
        String(first.x),
        "—",
        "—",
        "—",
        String(first.curMax),
        String(first.curMin),
        String(first.best),
      ],
    ];
    for (const r of rounds.slice(1)) {
      const b = rounds[r.i - 1] as Round;
      rows.push([
        `T${r.i + 1}`,
        String(r.i),
        `\`${r.i} < ${n}\` 참`,
        String(r.x),
        String(r.x),
        String(r.grown),
        String(r.flipped),
        String(r.curMax),
        String(r.curMin),
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
      String(last.curMax),
      String(last.curMin),
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
          "최댓값에 잇기",
          "최솟값에 잇기",
          "curMax",
          "curMin",
          "best",
        ],
        rows,
        [1, 3, 4, 5, 6, 7, 8, 9],
      ),
      "",
      `굵게 적은 값이 best 가 커진 걸음입니다. 마지막으로 커진 걸음은 T${lastGrow + 1} 이고, T${n + 1} 에서 ${last.best}${을를(last.best)} 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` — 다섯 갈래가 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const rounds = trace(WALK);
    const n = WALK.length;
    const loop = rounds.slice(1);
    const T = (r: Round) => `T${r.i + 1}`;
    const names = ["새로 시작", "최댓값에 잇기", "최솟값에 잇기"];
    const by = (pick: "max" | "min") =>
      names
        .map((name, k) => {
          const at = loop
            .filter((r) => {
              const v = pick === "max" ? r.curMax : r.curMin;
              return [r.x, r.grown, r.flipped][k] === v;
            })
            .map(T);
          return `${name} ${at.join(" ")}`;
        })
        .join(" · ");
    const grew = loop
      .filter((r) => r.best > (rounds[r.i - 1] as Round).best)
      .map(T);
    const kept = loop
      .filter((r) => r.best === (rounds[r.i - 1] as Round).best)
      .map(T);
    return [
      md(
        ["갈래", "실행된 걸음"],
        [
          ["① 세 값을 첫 칸의 값으로", "T1"],
          [`② 반복 조건 i < ${n}`, `T2~T${n} 에서 참 · T${n + 1} 에서 거짓`],
          ["③ 후보 만들기", `T2~T${n}`],
          ["④ curMax 가 고른 후보", by("max")],
          ["④ curMin 이 고른 후보", by("min")],
          [
            "⑤ 최댓값 갱신",
            `값이 커진 걸음 ${grew.join(" ")} · 그대로인 걸음 ${kept.join(" ")}`,
          ],
        ],
      ),
      "",
      "값이 같은 후보가 여럿인 걸음은 그 후보 모두에 적었습니다.",
    ].join("\n");
  },

  /** `deep.walk.step` — 돌려준 값이 정말 그 구간의 곱인가. */
  "walk-check-product": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [from, to] = last.bestRange;
    const vals = WALK.slice(from, to + 1);
    const prod = productOf(WALK, from, to);
    if (prod !== last.best) throw new Error("구간의 곱이 best 와 다르다");
    return md(
      [
        "best 를 만든 구간",
        "그 칸들의 값",
        "직접 곱한 값",
        `T${WALK.length + 1} 이 돌려준 값`,
      ],
      [
        [
          span(last.bestRange),
          dots(vals),
          `${times(vals)} = ${prod}`,
          String(maximumProductSubarray([...WALK])),
        ],
      ],
      [3],
    );
  },

  /** `deep.walk.pause` — 마지막 칸의 최댓값을 답으로 내면 무엇이 달라지는가. */
  "pause-answer-last": () => {
    const { rows, gaps } = contrast(LAST_CASES, (A) =>
      returnsLast.maximumProductSubarray(A),
    );
    assertBreaks(returnsLast, gaps);
    return [
      md(CONTRAST_HEAD("마지막 칸의 최댓값"), rows, [1, 2]),
      "",
      "답이 마지막 칸에서 끝나는 입력에서는 답이 그대로이고, 답이 배열 가운데에서 끝나면 값이 바뀝니다.",
    ].join("\n");
  },

  /** `deep.walk.pause` — 전개 입력의 칸마다 끝나는 최대곱. */
  "pause-last-cells": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    return [
      md(
        ["칸 i", "A[i]", "mx[i]", "mx[i] 의 구간"],
        rounds.map((r) => [
          String(r.i),
          String(r.x),
          String(r.curMax),
          span([r.maxStart, r.i]),
        ]),
        [0, 1, 2],
      ),
      "",
      `답 ${last.best}${은는(last.best)} 구간 ${span(last.bestRange)} 에서 나오고, 마지막 칸의 mx 는 ${last.curMax} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  "final-calls": () => {
    const calls = [[...WALK], [2, 3, -2, 4], [-2, 3, -4], [-2, 0, -1], [-2]];
    const heads = calls.map((A) => `maximumProductSubarray([${A.join(", ")}])`);
    const w = Math.max(...heads.map(width));
    return calls
      .map(
        (A, k) =>
          `${padRight(heads[k] as string, w)}   →  ${maximumProductSubarray([...A])}`,
      )
      .join("\n");
  },

  /** `related` — 걸음마다 두 값을 구간 하나로 읽고 구간 산술로 다음 구간을 낸다. */
  "related-interval": () => {
    const rounds = trace(WALK);
    const rows: string[][] = [];
    for (const r of rounds.slice(1)) {
      const b = rounds[r.i - 1] as Round;
      const ends = [b.curMin * r.x, b.curMax * r.x].map(zz);
      const lo = Math.min(...ends);
      const hi = Math.max(...ends);
      const hullLo = Math.min(lo, r.x);
      const hullHi = Math.max(hi, r.x);
      if (hullLo !== r.curMin || hullHi !== r.curMax) {
        throw new Error("구간 산술이 낸 구간이 두 값과 다르다");
      }
      rows.push([
        `T${r.i + 1}`,
        `[${b.curMin}, ${b.curMax}]`,
        String(r.x),
        `[${lo}, ${hi}]`,
        `[${hullLo}, ${hullHi}]`,
        `[${r.curMin}, ${r.curMax}]`,
      ]);
    }
    return [
      md(
        [
          "걸음",
          "직전 구간 [mn, mx]",
          "곱하는 수 A[i]",
          "구간에 A[i] 를 곱한 구간",
          "A[i] 까지 담은 가장 작은 구간",
          "이번 [curMin, curMax]",
        ],
        rows,
        [2],
      ),
      "",
      `${rows.length} 걸음 모두 구간 산술로 낸 구간이 이번 걸음의 두 값과 같습니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — `bench-alt` 가 낸 계수를 표로. */
  "alt-table": () => {
    const mine = benchCases["칸마다 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const points = [0, 33, 34, 1024];
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
      `저장 칸은 ${num(mine["저장 칸"] as number)} 개 대 ${num(other["저장 칸"] as number)} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 뒤집히는 자리를 계수에서 낸다. */
  "alt-boundary": () => {
    const mine = benchCases["칸마다 이어받기"]();
    const other = benchCases["세그먼트 트리"]();
    const perQuery = mine["질의 0 회 기본 연산"] as number;
    const fixed = other["질의 0 회 기본 연산"] as number;
    const perMerge = 9 + 13;
    const build = perMerge * (BENCH_N - 1);
    const updates = perMerge * BENCH_U * Math.log2(BENCH_N);
    if (build + updates !== fixed) {
      throw new Error("세그먼트 트리의 계수가 세우기와 갱신으로 나뉘지 않는다");
    }
    if ((mine["질의 33 회 기본 연산"] as number) !== 34 * perQuery) {
      throw new Error("이어받기의 질의당 연산이 일정하지 않다");
    }
    return md(
      ["항목", "값"],
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

  /** `deep.math` ② — 곱의 정의를 작은 값에 넣는다. */
  "math-check": () =>
    md(
      ["정의", "값에 넣은 식", "값"],
      (
        [
          [0, 3],
          [1, 2],
          [4, 5],
        ] as const
      ).map(([l, r]) => [
        `P(${l}, ${r})`,
        times(WALK.slice(l, r + 1)),
        String(productOf(WALK, l, r)),
      ]),
      [2],
    ),

  /** `deep.math` ② — 정의로 센 mx · mn 과 점화식이 낸 값을 여섯 칸에서 맞춘다. */
  "math-ending": () => {
    const rounds = trace(WALK);
    const rows = rounds.map((r) => {
      const all = endingProducts(WALK, r.i);
      return [
        String(r.i),
        dots(all),
        String(Math.max(...all)),
        String(r.curMax),
        String(Math.min(...all)),
        String(r.curMin),
      ];
    });
    return [
      md(
        [
          "i",
          "P(0, i) … P(i, i)",
          "정의로 센 mx[i]",
          "점화식의 curMax",
          "정의로 센 mn[i]",
          "점화식의 curMin",
        ],
        rows,
        [0, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 칸 모두 정의로 센 값과 점화식이 낸 값이 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ③ — 집합 S_i 를 값으로 만든다. */
  "math-sets": () => {
    const rows: string[][] = [];
    for (let i = 0; i < 3; i++) {
      const set = [...endingProducts(WALK, i)].sort((a, b) => a - b);
      const from =
        i === 0
          ? `{${WALK[0]}}`
          : `{${WALK[i]}} ∪ S_${i - 1} × ${paren(WALK[i] as number)}`;
      rows.push([
        `S_${i}`,
        from,
        `{${set.join(", ")}}`,
        String(Math.min(...set)),
        String(Math.max(...set)),
      ]);
    }
    return md(
      ["집합", "만드는 식", "원소", "가장 작은 것", "가장 큰 것"],
      rows,
      [3, 4],
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조, 그리고 답의 크기. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const A = n === WALK.length ? [...WALK] : ruled(n);
      const pairs = byAllPairs(A);
      const carry = byCarrying(A);
      if (pairs.answer !== carry.answer) {
        throw new Error("두 방식의 답이 다르다");
      }
      return [
        num(n),
        num(pairs.muls + pairs.cmps),
        num(n * (n + 1)),
        num(carry.muls + carry.cmps),
        num(7 * n - 7),
      ];
    });
    const n = N_MAX;
    const digits = (BigInt(V_MAX) ** BigInt(n)).toString().length;
    return [
      md(
        ["N", "모든 쌍(실측)", "N(N+1)", "이어받기(실측)", "7N − 7"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `과제 규모 N = ${num(n)} 을 두 식에 넣으면 N(N+1) = ${num(n * (n + 1))}, 7N − 7 = ${num(7 * n - 7)} 이고, 두 값의 비는 ${num(Math.round((n * (n + 1)) / (7 * n - 7)))} 배입니다. 같은 규모에서 답의 절댓값은 ${V_MAX}^${num(n)} 까지 커질 수 있고, 그 수는 ${num(digits)} 자리입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 세 문장이 정의로 센 값과 같은가. */
  "invariant-hold": () => {
    const rounds = trace(WALK);
    const rows = rounds.map((r) => {
      const all = endingProducts(WALK, r.i);
      const answer = byAllPairs(WALK.slice(0, r.i + 1)).answer;
      return [
        `T${r.i + 1}`,
        String(r.i),
        String(r.curMax),
        String(Math.max(...all)),
        String(r.curMin),
        String(Math.min(...all)),
        String(r.best),
        String(answer),
      ];
    });
    return [
      md(
        [
          "걸음",
          "칸 i",
          "curMax",
          "정의로 센 mx[i]",
          "curMin",
          "정의로 센 mn[i]",
          "best",
          "칸 i 까지 모든 쌍을 센 답",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `${rows.length} 걸음 모두 curMax · curMin 이 정의로 센 값과, best 가 모든 쌍을 센 답과 값이 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력에서 세 값이 어떻게 정해지는가. */
  "invariant-edges": () => {
    const inputs: [string, number[]][] = [
      ["칸이 하나 · 양수", [7]],
      ["칸이 하나 · 음수", [-7]],
      ["칸이 하나 · 0", [0]],
      ["칸이 둘", [-10, -10]],
      ["값이 전부 음수", [-4, -3, -2]],
      ["값이 전부 양수", [2, 3, 4]],
      ["값이 전부 0", [0, 0, 0]],
      ["0 이 가운데를 끊는다", [-2, 0, -1]],
      ["값이 전부 10", [10, 10, 10]],
    ];
    const rows = inputs.map(([name, A]) => {
      const rounds = trace(A);
      const last = rounds[rounds.length - 1] as Round;
      return [
        `${name} ${show(A)}`,
        num(rounds.length - 1),
        num(last.curMax),
        num(last.curMin),
        num(maximumProductSubarray([...A])),
        num(byAllPairs(A).answer),
      ];
    });
    return [
      md(
        [
          "입력",
          "반복 횟수",
          "끝난 뒤 curMax",
          "끝난 뒤 curMin",
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

  /** `invariant` ③ — 최솟값이 직전 최솟값을 못 이어받으면 무엇이 나오는가. */
  "mutant-min-no-carry": () => {
    const { rows, gaps } = contrast(MIN_CARRY_CASES, (A) =>
      minNoCarry.maximumProductSubarray(A),
    );
    assertBreaks(minNoCarry, gaps);
    return [
      md(CONTRAST_HEAD("이어받기를 뺀 답"), rows, [1, 2]),
      "",
      "전개 입력에서는 답이 그대로입니다. 음수 둘 사이에 양수가 끼어, 음수 하나를 담은 곱을 최솟값으로 들고 가야 하는 입력에서 값이 바뀝니다.",
    ].join("\n");
  },

  /** `invariant` ③ — `[-3 2 5 -4]` 에서 칸마다의 최솟값. */
  "mutant-min-trace": () => {
    const A = [-3, 2, 5, -4];
    const right = pairRounds(A);
    const wrong = pairRounds(A, { min: (x, g) => Math.min(x, g) });
    const rows = A.map((x, i) => [
      String(i),
      String(x),
      String((right[i] as PairState).curMin),
      String((wrong[i] as PairState).curMin),
    ]);
    const split = right.findIndex(
      (a, i) => a.curMin !== (wrong[i] as PairState).curMin,
    );
    const endRight = right[right.length - 1] as PairState;
    const endWrong = wrong[wrong.length - 1] as PairState;
    const lastX = A[A.length - 1] as number;
    return [
      md(
        ["칸 i", "A[i]", "정본 curMin", "이어받기를 뺀 curMin"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `칸 ${split} 에서 처음 갈립니다. 칸 ${A.length - 1} 의 ${lastX}${이가(lastX)} 그 최솟값을 뒤집어 쓰는 순간 답이 ${endRight.best} 대신 ${endWrong.best}${이가(endWrong.best)} 됩니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 곱셈과 비교가 드는가. */
  "perf-count": () => {
    const carry = byCarrying(WALK);
    const n = WALK.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "순회",
        `T2~T${n}`,
        String(n - 1),
        String(carry.muls / (n - 1)),
        String(carry.cmps / (n - 1)),
        String(carry.muls + carry.cmps),
      ],
      ["반환", `T${n + 1}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(carry.muls + carry.cmps)],
    ];
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 곱셈",
          "걸음마다 비교",
          "이 입력에서",
        ],
        rows,
        [2, 3, 4, 5],
      ),
      "",
      `곱셈 ${carry.muls} 번과 비교 ${carry.cmps} 번이고, 둘 다 칸 수 ${n} 에서만 나온 수입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 총식을 두 규모에서 실행과 대조한다. */
  "perf-total": () => {
    const rows = [WALK.length, N_MAX].map((n) => {
      const A = n === WALK.length ? [...WALK] : ruled(n);
      const c = byCarrying(A);
      if (c.muls + c.cmps !== 7 * (n - 1)) {
        throw new Error("총식이 실측과 다르다");
      }
      return [num(n), num(c.muls + c.cmps), num(7 * (n - 1))];
    });
    return [
      md(["N", "센 기본 연산", "7(N − 1)"], rows, [0, 1, 2]),
      "",
      "두 규모 모두 센 값이 7(N − 1) 과 같습니다.",
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1000;
    const shapes: [string, number[]][] = [
      ["전부 1", Array.from({ length: n }, () => 1)],
      ["전부 -1", Array.from({ length: n }, () => -1)],
      [
        "1 과 -1 이 번갈아",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? 1 : -1)),
      ],
      [
        "마지막 한 칸만 10 · 나머지는 0",
        Array.from({ length: n }, (_, k) => (k === n - 1 ? 10 : 0)),
      ],
      ["전부 10", Array.from({ length: n }, () => 10)],
    ];
    const rows = shapes.map(([name, A]) => {
      const carry = byCarrying(A);
      return [
        name,
        num(carry.muls),
        num(carry.cmps),
        num(carry.muls + carry.cmps),
        num(carry.answer),
      ];
    });
    return [
      md(
        [`입력의 모양 (N = ${num(n)})`, "곱셈", "비교", "기본 연산", "답"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `가운데 세 열은 ${rows.length} 줄 모두 값이 같고, 오른쪽 열만 다릅니다. 마지막 줄의 답은 double 의 표현 범위를 넘은 값입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 재는 것마다 최악을 만드는 입력과 그 값. */
  "worst-axes": () => {
    const ops = byCarrying(new Array<number>(N_MAX).fill(-1));
    return md(
      ["최악으로 만들 것", "입력", "값"],
      [
        [
          "기본 연산 수",
          `N = ${num(N_MAX)}, 값은 무엇이든`,
          num(ops.muls + ops.cmps),
        ],
        ["잡는 칸", "어떤 입력이든", "3"],
        [
          "답의 크기",
          `${V_MAX} 이 ${num(N_MAX)} 칸`,
          `${V_MAX}^${num(N_MAX)} — 코드는 ${num(allMax(N_MAX))} 를 낸다`,
        ],
      ],
      [2],
    );
  },

  /** `selfcheck` — 전개의 T5. */
  "selfcheck-t5": () => {
    const rounds = trace(WALK);
    const r = rounds[4] as Round;
    return `T5   A[4] = ${r.x}   후보 ${dots([r.x, r.grown as number, r.flipped as number])}   curMax = ${r.curMax} · curMin = ${r.curMin}   best = ${r.best} 그대로`;
  },
};
