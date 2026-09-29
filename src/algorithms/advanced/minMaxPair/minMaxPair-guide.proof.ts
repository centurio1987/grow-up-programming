/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 비교 횟수와 비교 하나하나는 그림 사이드카의 `measure`(정본을 고치지 않고 원소 쪽에서 비교를 적는
 * 계측)와 `decode`(그 목록을 정본의 갈래 순서로 읽기)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/minMaxPair/minMaxPair-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 이가 } from "../../../../tools/josa.ts";
import {
  A8,
  approachCounts,
  B6,
  BIG,
  type Cmp,
  countOf,
  decode,
  type Event,
  formula,
  halves,
  halvesTree,
  measure,
  num,
  oneLoop,
  type Piece,
  show,
  sum,
  tournament,
  twoLoops,
  walkRun,
  walkSteps,
} from "./minMaxPair-guide.fig.tsx";
import { minMaxPair } from "./minMaxPair-guide.ref.ts";

const REF = new URL("./minMaxPair-guide.ref.ts", import.meta.url).pathname;

type MinMax = { min: number; max: number };
type Fn = (arr: number[]) => MinMax;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

const block = (...parts: string[]): string => parts.join("\n\n");
const answer = (r: MinMax): string => `{ min: ${r.min}, max: ${r.max} }`;
const tf = (b: boolean): string => (b ? "참" : "거짓");

/* ───────────────────────── 배열 읽기 계측 ───────────────────────── */

/** 인덱스로 칸을 읽은 횟수. 비교 횟수와 다른 값이라는 것을 보이려고 따로 센다. */
function readsOf(values: readonly number[], fn: Fn): number {
  let reads = 0;
  const arr = new Proxy([...values], {
    get(t, k, r) {
      if (typeof k === "string" && /^\d+$/.test(k)) reads++;
      return Reflect.get(t, k, r);
    },
  });
  fn(arr);
  return reads;
}

/* ───────────────────────── 원소마다 두 번 비교 — 한 번 지나가는 쪽 ───────────────────────── */

interface NaiveRow {
  readonly k: number;
  readonly x: number;
  readonly minBefore: number;
  readonly lower: boolean;
  readonly maxBefore: number;
  readonly higher: boolean;
  readonly min: number;
  readonly max: number;
}

/**
 * `oneLoop` 을 계측해 원소마다 두 비교를 읽는다. 목록이 `[k, min 자리]` · `[k, max 자리]` 순서가
 * 아니면 던진다. 후보는 정본과 같은 규칙으로 뺀다 — `x < min` 이 참이면 옛 min 이, 거짓이면 x 가
 * 최솟값 후보에서 빠지고, `x > max` 도 같은 꼴이다.
 */
function naiveTrace(values: readonly number[]) {
  const { cmps } = measure(values, oneLoop);
  const v = (at: number) => values[at] as number;
  const rows: NaiveRow[] = [];
  const minCand = values.map(() => true);
  const maxCand = values.map(() => true);
  const removed: number[] = [];
  let minAt = 0;
  let maxAt = 0;
  let c = 0;
  const drop = (cand: boolean[], at: number) => {
    const fresh = cand[at] === true;
    cand[at] = false;
    return fresh ? 1 : 0;
  };
  for (let k = 1; k < values.length; k++) {
    const a = cmps[c++] as Cmp;
    if (a[0] !== k || a[1] !== minAt) {
      throw new Error(`k = ${k} 의 첫 비교가 x < min 이 아니다`);
    }
    const lower = v(k) < v(minAt);
    const minBefore = v(minAt);
    removed.push(drop(minCand, lower ? minAt : k));
    if (lower) minAt = k;
    const b = cmps[c++] as Cmp;
    if (b[0] !== k || b[1] !== maxAt) {
      throw new Error(`k = ${k} 의 둘째 비교가 x > max 가 아니다`);
    }
    const higher = v(k) > v(maxAt);
    const maxBefore = v(maxAt);
    removed.push(drop(maxCand, higher ? maxAt : k));
    if (higher) maxAt = k;
    rows.push({
      k,
      x: v(k),
      minBefore,
      lower,
      maxBefore,
      higher,
      min: v(minAt),
      max: v(maxAt),
    });
  }
  if (c !== cmps.length) throw new Error("원소마다 두 번 비교의 목록이 남았다");
  return { rows, removed, cmps: cmps.length };
}

const truesOf = (rows: readonly NaiveRow[]): number =>
  rows.reduce((s, r) => s + (r.lower ? 1 : 0) + (r.higher ? 1 : 0), 0);

/* ───────────────────────── 비교하려고 세운 방법 둘 더 ───────────────────────── */

/** 쌍 안에서 비교는 하되 결과를 쓰지 않고, 두 원소를 각각 min 과 max 양쪽과 비교한다. */
function pairUnused(arr: number[]): MinMax {
  const n = arr.length;
  let min = arr[0] as number;
  let max = arr[0] as number;
  let i = 1;
  if (n % 2 === 0) {
    const b = arr[1] as number;
    if (b < min) min = b;
    if (b > max) max = b;
    i = 2;
  }
  for (; i < n; i += 2) {
    const a = arr[i] as number;
    const b = arr[i + 1] as number;
    // 결과를 버리는 비교 — 순서만 정하고 아래 네 비교에 쓰지 않는다.
    void (a < b);
    if (a < min) min = a;
    if (a > max) max = a;
    if (b < min) min = b;
    if (b > max) max = b;
  }
  return { min, max };
}

/**
 * 원소를 `k` 개씩 묶고, 묶음 안에서 짝지어 비교하기로 두 극값을 먼저 구한 뒤 그 둘만 전역 min·max 와
 * 비교한다. `k = 1` 이면 원소마다 두 번 비교하는 방법과 같고, `k = 2` 면 정본과 같은 횟수여야 한다.
 */
function groupK(k: number): Fn {
  return (arr) => {
    const n = arr.length;
    const inner = (s: number, e: number): MinMax => minMaxPair(arr.slice(s, e));
    const first = inner(0, Math.min(k, n));
    let min = first.min;
    let max = first.max;
    for (let s = k; s < n; s += k) {
      const g = inner(s, Math.min(s + k, n));
      if (g.min < min) min = g.min;
      if (g.max > max) max = g.max;
    }
    return { min, max };
  };
}

/* ───────────────────────── 변이 ───────────────────────── */

/**
 * 길이의 홀짝을 안 가르는 사본. 홀수 길이에서 마지막 원소가 짝을 못 찾아 `arr[n]`, 곧 `undefined` 와
 * 비교된다. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noParity = await loadMutant<{ minMaxPair: Fn }>(REF, {
  swap: [/if \(n % 2 === 1\) \{/, "if (false) {"],
});

/**
 * 불변식을 지키던 줄(`if (lo < min) min = lo;`)에서 비교 대상만 큰 쪽으로 바꾼 사본. 쌍의 작은 쪽이
 * 지금까지의 최솟값보다 작아도 그 자리에서 잡히지 않는다.
 */
const ignoreLo = await loadMutant<{ minMaxPair: Fn }>(REF, {
  swap: [/if \(lo < min\) min = lo;/, "if (hi < min) min = hi;"],
});

/**
 * 둘째 짚고 가기의 오해 — 쌍의 **큰 쪽도** `min` 과, **작은 쪽도** `max` 와 비교한다. 작은 쪽을 `min` 과
 * 비교하는 한 줄 자리에 비교 셋을 둔다(넷째인 `hi > max` 는 원래 줄이 그대로 한다).
 */
const bothSides = await loadMutant<{ minMaxPair: Fn }>(REF, {
  swap: [
    /^(\s*)if \(lo < min\) min = lo;$/,
    "$1if (lo < min) min = lo;\n$1if (hi < min) min = hi;\n$1if (lo > max) max = lo;",
  ],
});

/** 중화 실행이면 변이 모듈이 정본 그대로다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). */
const neutral = (m: { minMaxPair: Fn }): boolean => m.minMaxPair === minMaxPair;

/** 변이가 쓰는 입력들. */
const MUTANT_INPUTS: number[][] = [
  [7],
  [7, 3, 1],
  [2, 9, 5],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [3, 1, 4, 1, 5, 9, 2, 6],
  [-3, -1, -4, -1, -5],
  [100, 50, 70, -10],
];

const sameAnswer = (a: MinMax, b: MinMax): boolean =>
  Object.is(a.min, b.min) && Object.is(a.max, b.max);

if (
  !neutral(noParity) &&
  MUTANT_INPUTS.every((x) => sameAnswer(minMaxPair(x), noParity.minMaxPair(x)))
) {
  throw new Error(
    "홀짝 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「조용히 틀린다」가 거짓이다",
  );
}
if (
  !neutral(ignoreLo) &&
  MUTANT_INPUTS.every((x) => sameAnswer(minMaxPair(x), ignoreLo.minMaxPair(x)))
) {
  throw new Error(
    "작은 쪽 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}
// **이쪽은 반대다.** 둘째 짚고 가기는 「답이 안 틀리고 비교만 는다」고 적으므로, 답이 하나라도
// 달라지면 그 문장이 거짓이 된다.
for (const x of [...MUTANT_INPUTS, B6, A8, BIG]) {
  if (!sameAnswer(minMaxPair(x), bothSides.minMaxPair(x))) {
    throw new Error("양쪽 비교가 답을 바꿨다 — 「답이 안 틀린다」가 거짓이다");
  }
}

/* ───────────────────────── 공용 ───────────────────────── */

const SIZES = [B6, A8, BIG] as const;
type Count = ReturnType<typeof approachCounts>[number];
const counts = approachCounts();
const [, EIGHT, BIGC] = counts as [Count, Count, Count];

/** 비교 목록을 `A[x] = v < A[y] = w 거짓` 꼴로. 연산자는 부르는 쪽이 정본의 순서대로 준다. */
const cmpText = (values: readonly number[], c: Cmp, op: string): string => {
  const [l, r] = c;
  const lv = values[l] as number;
  const rv = values[r] as number;
  const res = op === "<" ? lv < rv : lv > rv;
  return `A[${l}] = ${lv} ${op} A[${r}] = ${rv} ${tf(res)}`;
};

const kindName: Record<Event["kind"], string> = {
  start: "시작 비교",
  pair: "쌍 안 비교",
  min: "min 과의 비교",
  max: "max 와의 비교",
};

/** 하한 논증이 쓰는 원소 상태 넷. */
const STATES = [
  { name: "둘 다 후보", min: true, max: true },
  { name: "최솟값 후보만", min: true, max: false },
  { name: "최댓값 후보만", min: false, max: true },
  { name: "둘 다 빠짐", min: false, max: false },
] as const;

const extremesOf = (run: ReturnType<typeof decode>, p: Event) => ({
  lo: run.events.find((e) => e.kind === "min" && e.i === p.i) as Event,
  hi: run.events.find((e) => e.kind === "max" && e.i === p.i) as Event,
});

const changesOf = (run: ReturnType<typeof decode>): number =>
  run.events.filter((e) => (e.kind === "min" || e.kind === "max") && e.result)
    .length;

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 두 방법의 비교 횟수 결과 한 줄. */
  "concept-counts": () =>
    block(
      md(
        ["방법", `n = ${EIGHT.n}`, `n = ${num(BIGC.n)}`, "원소당"],
        [
          [
            "원소마다 두 번 비교하기",
            String(EIGHT.oneLoop),
            num(BIGC.oneLoop),
            (BIGC.oneLoop / BIGC.n).toFixed(2),
          ],
          [
            "짝지어 비교하기",
            String(EIGHT.pairs),
            num(BIGC.pairs),
            (BIGC.pairs / BIGC.n).toFixed(2),
          ],
        ],
        [1, 2, 3],
      ),
      `n = ${num(BIGC.n)} 에서 비교가 ${num(BIGC.oneLoop - BIGC.pairs)} 번 줄었습니다.`,
    ),

  /** `deep.origin` ② — 가장 단순한 방법 둘의 비교 횟수와 배열 읽기 횟수. */
  "origin-naive": () =>
    block(
      md(
        [
          "n",
          "반복 둘의 비교",
          "반복 둘의 배열 읽기",
          "반복 하나의 비교",
          "반복 하나의 배열 읽기",
          "2n − 2",
        ],
        SIZES.map((values) => [
          num(values.length),
          num(countOf(values, twoLoops)),
          num(readsOf(values, twoLoops)),
          num(countOf(values, oneLoop)),
          num(readsOf(values, oneLoop)),
          num(2 * values.length - 2),
        ]),
        [0, 1, 2, 3, 4, 5],
      ),
      "반복을 하나로 합치면 배열 읽기가 절반이 되지만, 비교 횟수는 세 줄 모두 2n − 2 그대로입니다.",
    ),

  /** `deep.origin` ③ — 작은 입력에서 원소마다 두 비교의 참·거짓을 전부 적는다. */
  "origin-truth": () => {
    const t = naiveTrace(B6);
    const both = t.rows.filter((r) => r.lower && r.higher).length;
    return block(
      md(
        [
          "k",
          "B[k]",
          "min 과의 비교",
          "결과",
          "max 와의 비교",
          "결과",
          "min",
          "max",
        ],
        t.rows.map((r) => [
          String(r.k),
          String(r.x),
          `${r.x} < ${r.minBefore}`,
          tf(r.lower),
          `${r.x} > ${r.maxBefore}`,
          tf(r.higher),
          String(r.min),
          String(r.max),
        ]),
        [0, 1, 6, 7],
      ),
      `비교 ${t.cmps} 번 중 참이 나온 것은 ${truesOf(t.rows)} 번이고, 두 비교가 함께 참인 원소는 ${both} 개입니다.`,
    );
  },

  /** `deep.origin` ③ — 같은 셈을 과제 규모까지. */
  "origin-truth-scale": () =>
    block(
      md(
        ["n", "비교", "참이 나온 비교", "두 비교가 함께 참인 원소"],
        SIZES.map((values) => {
          const t = naiveTrace(values);
          return [
            num(values.length),
            num(t.cmps),
            num(truesOf(t.rows)),
            num(t.rows.filter((r) => r.lower && r.higher).length),
          ];
        }),
        [0, 1, 2, 3],
      ),
      "세 규모 모두 두 비교가 함께 참인 원소가 하나도 없습니다.",
    ),

  /** `deep.origin` ③ — 같은 두 원소를 두 방법이 처리하는 비교. */
  "origin-pair-one": () => {
    const naive = naiveTrace(B6).rows.filter((r) => r.k === 2 || r.k === 3);
    const run = decode(B6);
    const three = run.events.filter((e) => e.i === 2);
    const naiveText = naive
      .flatMap((r) => [
        `${r.x} < ${r.minBefore} ${tf(r.lower)}`,
        `${r.x} > ${r.maxBefore} ${tf(r.higher)}`,
      ])
      .join(" · ");
    const pairText = three
      .map((e) => `${B6[e.left]} ${e.op} ${B6[e.right]} ${tf(e.result)}`)
      .join(" · ");
    return block(
      md(
        ["방법", `B[2] = ${B6[2]}, B[3] = ${B6[3]} 에 쓴 비교`, "횟수"],
        [
          ["원소마다 두 번 비교하기", naiveText, String(naive.length * 2)],
          ["짝지어 비교하기", pairText, String(three.length)],
        ],
        [2],
      ),
      `같은 두 원소에 쓴 비교가 ${naive.length * 2} 번에서 ${three.length} 번으로 줄었습니다.`,
    );
  },

  /** `deep.origin` ④ — 같은 입력에 두 방법을 걸고 비교 횟수를 나란히. */
  "origin-two-ways": () =>
    md(
      ["방법", ...counts.map((c) => `n = ${num(c.n)}`)],
      [
        ["원소마다 두 번 비교하기", ...counts.map((c) => num(c.oneLoop))],
        ["짝지어 비교하기", ...counts.map((c) => num(c.pairs))],
      ],
      [1, 2, 3],
    ),

  /** `deep.origin` ⑤ — 가장 단순한 후보 하나: 쌍 안 비교를 하고 결과를 안 쓴다. */
  "origin-unused": () =>
    block(
      md(
        ["방법", ...SIZES.map((v) => `n = ${num(v.length)}`)],
        [
          [
            "원소마다 두 번 비교하기",
            ...SIZES.map((v) => num(countOf(v, oneLoop))),
          ],
          [
            "쌍 안 비교를 하고 결과를 안 쓴다",
            ...SIZES.map((v) => num(countOf(v, pairUnused))),
          ],
          ["짝지어 비교하기", ...SIZES.map((v) => num(countOf(v, minMaxPair)))],
        ],
        [1, 2, 3],
      ),
      "결과를 안 쓰면 쌍 안 비교가 그대로 더해져, 원소마다 두 번 비교하기보다도 많아집니다.",
    ),

  /** `deep.origin` ⑤ — 반으로 갈라 합치기. 조각 크기별로 센다. */
  "origin-halves": () => {
    const pieces = (p: Piece): Piece[] => [p, ...p.kids.flatMap(pieces)];
    const extra: string[] = [];
    const rows = SIZES.map((values) => {
      const tree = halvesTree(values);
      const all = pieces(tree);
      const measured = countOf(values, halves);
      if (sum(tree) !== measured) {
        throw new Error("조각 나무의 합이 반으로 갈라 합치기의 실측과 다르다");
      }
      const threes = all.filter((p) => p.hi - p.lo === 2).length;
      const more = measured - countOf(values, minMaxPair);
      if (more * 2 !== threes) {
        throw new Error("더 든 비교가 세 칸 조각 수의 절반이 아니다");
      }
      extra.push(`n = ${num(values.length)} 에서 ${num(more)} 번`);
      return [
        num(values.length),
        num(measured),
        num(all.filter((p) => p.hi - p.lo === 1).length),
        num(all.filter((p) => p.hi - p.lo === 2).length),
        num(countOf(values, minMaxPair)),
      ];
    });
    return block(
      md(
        [
          "n",
          "반으로 갈라 합치기의 비교",
          "두 칸 조각",
          "세 칸 조각",
          "짝지어 비교하기",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `반으로 갈라 합치기가 짝지어 비교하기보다 더 쓴 비교는 ${extra.join(", ")}이고, 세 줄 모두 세 칸 조각 수의 절반입니다.`,
    );
  },

  /** `deep.build` 「먼저 알아 둘 개념」 (c) — 원소마다 어느 비교에서 어느 후보를 잃었는가. */
  "build-read": () => {
    const run = decode(B6);
    const lostAt = (row: "outOfMin" | "outOfMax", at: number): string => {
      const e = run.events.find((x) => x[row].includes(at));
      if (e === undefined) return "끝까지 남는다";
      return `${e.count} 번째 · ${B6[e.left]} ${e.op} ${B6[e.right]} ${tf(e.result)}`;
    };
    return block(
      md(
        [
          "원소",
          "값",
          "최솟값 후보에서 빠진 비교",
          "최댓값 후보에서 빠진 비교",
        ],
        B6.map((x, at) => [
          `B[${at}]`,
          String(x),
          lostAt("outOfMin", at),
          lostAt("outOfMax", at),
        ]),
        [1],
      ),
      `최솟값 후보로 끝까지 남은 원소는 B[${run.minAt}], 최댓값 후보로 끝까지 남은 원소는 B[${run.maxAt}] 이고, 정본이 돌려준 답 ${answer(minMaxPair(B6))} 의 두 값이 그 두 원소의 값입니다.`,
    );
  },

  /** `deep.build` 「먼저 알아 둘 개념」 (d) — 비교 종류마다 새로 빠진 후보 수. */
  "build-removals": () => {
    const run = decode(B6);
    const kinds: Event["kind"][] = ["start", "pair", "min", "max"];
    const rows = kinds.map((k) => {
      const es = run.events.filter((e) => e.kind === k);
      const out = es.reduce(
        (s, e) => s + e.outOfMin.length + e.outOfMax.length,
        0,
      );
      return [
        kindName[k],
        String(es.length),
        String(out),
        es.length === 0 ? "—" : String(out / es.length),
      ];
    });
    const total = run.events.reduce(
      (s, e) => s + e.outOfMin.length + e.outOfMax.length,
      0,
    );
    return block(
      md(
        ["비교 종류", "횟수", "새로 빠진 후보", "비교 한 번에"],
        rows,
        [1, 2, 3],
      ),
      `비교 ${run.events.length} 번에 빠진 후보는 모두 ${total} 개이고, 원소 ${B6.length} 개의 두 줄에서 한 칸씩 남기고 뺀 수 2 × (${B6.length} − 1) = ${2 * (B6.length - 1)}${과와(2 * (B6.length - 1))} 같습니다.`,
    );
  },

  /** `deep.build` 「먼저 알아 둘 개념」 (e) — 원소마다 두 번 비교하는 모양과 값으로 비교. */
  "build-mistaken": () => {
    const naive = naiveTrace(B6);
    const run = decode(B6);
    const pairOut = run.events.map(
      (e) => e.outOfMin.length + e.outOfMax.length,
    );
    const row = (name: string, outs: number[]) => [
      name,
      String(outs.length),
      String(outs.filter((x) => x === 2).length),
      String(outs.filter((x) => x === 1).length),
      String(outs.filter((x) => x === 0).length),
      String(outs.reduce((s, x) => s + x, 0)),
    ];
    return md(
      [
        "방법",
        "비교",
        "후보 둘을 뺀 비교",
        "후보 하나를 뺀 비교",
        "아무것도 안 뺀 비교",
        "빠진 후보 합",
      ],
      [
        row("원소마다 두 번 비교하기", naive.removed),
        row("짝지어 비교하기", pairOut),
      ],
      [1, 2, 3, 4, 5],
    );
  },

  /** `deep.build` 1단계 — 길이마다 시작 갈래와 남은 원소 수. */
  "build-start": () =>
    md(
      ["n", "갈래", "시작 비교", "시작값을 정한 뒤의 i", "남은 원소"],
      [1, 2, 3, 4, 5, 6].map((n) => {
        const run = decode(B6.slice(0, n));
        return [
          String(n),
          run.odd ? "홀수 — 첫 원소 하나" : "짝수 — 첫 두 원소",
          String(run.events.filter((e) => e.kind === "start").length),
          String(run.startI),
          String(n - run.startI),
        ];
      }),
      [0, 2, 3, 4],
    ),

  /** `deep.build` 2단계 — 작은 입력의 쌍마다 작은 쪽과 큰 쪽. */
  "build-split": () => {
    const run = decode(B6);
    return md(
      [
        "i",
        "B[i]",
        "B[i+1]",
        "B[i] < B[i+1]",
        "lo",
        "hi",
        "최솟값 후보에서 빠짐",
        "최댓값 후보에서 빠짐",
      ],
      run.events
        .filter((e) => e.kind === "pair")
        .map((e) => [
          String(e.i),
          String(B6[e.left]),
          String(B6[e.right]),
          tf(e.result),
          String(B6[e.loAt as number]),
          String(B6[e.hiAt as number]),
          e.outOfMin.map((at) => `B[${at}]`).join(" · "),
          e.outOfMax.map((at) => `B[${at}]`).join(" · "),
        ]),
      [0, 1, 2, 4, 5],
    );
  },

  /** `deep.build` 3단계 — 쌍마다 작은 쪽은 min 과, 큰 쪽은 max 와. */
  "build-extremes": () => {
    const run = decode(B6);
    return md(
      ["쌍", "lo < min", "min", "hi > max", "max"],
      run.events
        .filter((e) => e.kind === "pair")
        .map((p) => {
          const { lo, hi } = extremesOf(run, p);
          return [
            `(${B6[p.left]}, ${B6[p.right]})`,
            `${B6[lo.left]} < ${B6[lo.right]} ${tf(lo.result)}`,
            String(B6[lo.minAt]),
            `${B6[hi.left]} > ${B6[hi.right]} ${tf(hi.result)}`,
            String(B6[hi.maxAt]),
          ];
        }),
      [2, 4],
    );
  },

  /** `deep.build` 3단계 — 두 극값 사이에 드는 쌍(가장 쉬운 경우). */
  "build-easy": () => {
    const run = walkRun();
    const p = run.events.find((e) => {
      if (e.kind !== "pair") return false;
      const { lo, hi } = extremesOf(run, e);
      return !lo.result && !hi.result;
    }) as Event;
    const { lo, hi } = extremesOf(run, p);
    return md(
      ["비교", "결과", "min", "max"],
      [
        [
          `${A8[p.left]} < ${A8[p.right]}`,
          tf(p.result),
          String(A8[p.minAt]),
          String(A8[p.maxAt]),
        ],
        [
          `lo = ${A8[lo.left]} < min = ${A8[lo.right]}`,
          tf(lo.result),
          String(A8[lo.minAt]),
          String(A8[lo.maxAt]),
        ],
        [
          `hi = ${A8[hi.left]} > max = ${A8[hi.right]}`,
          tf(hi.result),
          String(A8[hi.minAt]),
          String(A8[hi.maxAt]),
        ],
      ],
      [2, 3],
    );
  },

  /** `deep.build` 3단계 — 반복이 끝나는 자리. */
  "build-end": () =>
    md(
      ["n", "시작 i", "쌍을 처리한 i", "끝난 뒤의 i", "n − i"],
      [B6, [3, 1, 4, 1, 5]].map((values) => {
        const run = decode(values);
        const is = [
          ...new Set(
            run.events.flatMap((e) =>
              e.kind === "pair" ? [e.i as number] : [],
            ),
          ),
        ];
        return [
          String(run.n),
          String(run.startI),
          is.join(" · "),
          String(run.endI),
          String(run.n - run.endI),
        ];
      }),
      [0, 1, 3, 4],
    ),

  /** `deep.build` 3단계 — 상태마다 크기와 범위를 실제 실행에서. */
  "build-sizes": () => {
    const run = decode(B6);
    const pairs = run.events.filter((e) => e.kind === "pair").length;
    const minChanges = run.events.filter(
      (e) => e.kind === "min" && e.result,
    ).length;
    const maxChanges = run.events.filter(
      (e) => e.kind === "max" && e.result,
    ).length;
    const perPair = [
      ...new Set(run.events.flatMap((e) => (e.i === undefined ? [] : [e.i]))),
    ].map((i) => run.events.filter((e) => e.i === i).length);
    return md(
      ["상태", "움직이는 범위", "B 에서 잰 값"],
      [
        [
          "i",
          "시작값에서 쌍마다 2 씩 는다",
          `${run.startI} 에서 ${run.endI} 까지 쌍 ${pairs} 개`,
        ],
        ["lo · hi", "쌍마다 새로 정한다", `쌍 ${pairs} 개에 한 벌씩`],
        [
          "min",
          "내려가기만 한다. 바뀌는 횟수는 쌍의 수 이하",
          `${minChanges} 번 바뀌었다`,
        ],
        [
          "max",
          "올라가기만 한다. 바뀌는 횟수는 쌍의 수 이하",
          `${maxChanges} 번 바뀌었다`,
        ],
        [
          "비교",
          "쌍마다 3 번 + 시작 비교 0 번 또는 1 번",
          `쌍마다 ${perPair.join(" · ")} 번 + 시작 ${run.odd ? 0 : 1} 번 = ${run.events.length} 번`,
        ],
      ],
    );
  },

  /** `deep.build` 「이 방법이 기대는 전제」 — 전순서가 깨지는 값(NaN)을 넣는다. */
  "build-premise": () => {
    const perms = [
      [3, Number.NaN, 1],
      [Number.NaN, 3, 1],
      [3, 1, Number.NaN],
    ];
    const got = perms.map((p) => answer(minMaxPair(p)));
    return block(
      md(
        ["입력", "정본의 답"],
        perms.map((p, k) => [show(p), got[k] as string]),
      ),
      `같은 세 값을 놓는 순서만 바꿨는데 답이 ${new Set(got).size} 가지로 나옵니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 묶음 크기 `k` 를 여섯 값으로 놓고 같은 입력에서 비교를 센다. */
  "group-size": () => {
    const rows = [1, 2, 3, 4, 5, 6].map((k) => {
      const small = countOf(A8, groupK(k));
      const big = countOf(BIG, groupK(k));
      if (
        k === 2 &&
        (small !== countOf(A8, minMaxPair) || big !== countOf(BIG, minMaxPair))
      ) {
        throw new Error("k = 2 가 정본과 다른 횟수를 냈다");
      }
      return [
        String(k),
        String(small),
        num(big),
        (big / BIG.length).toFixed(3),
      ];
    });
    return md(
      [
        "묶음 크기 k",
        `n = ${A8.length} 의 비교`,
        `n = ${num(BIG.length)} 의 비교`,
        "원소당",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력과 기대하는 답. */
  "walk-input": () =>
    [
      `const A = ${show(A8)};`,
      `// 이 절이 끝나면 ${answer(minMaxPair(A8))} 가 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 시작 조각만 두 입력에 실행한 결과. */
  "walk-start": () =>
    md(
      ["입력", "n", "갈래", "시작 비교", "min", "max", "다음 i", "남은 원소"],
      [A8, [3, 1, 4, 1, 5]].map((values) => {
        const run = decode(values);
        return [
          show(values),
          String(run.n),
          run.odd ? "①" : "②",
          String(run.odd ? 0 : 1),
          String(values[run.startMinAt]),
          String(values[run.startMaxAt]),
          String(run.startI),
          String(run.n - run.startI),
        ];
      }),
      [1, 3, 4, 5, 6, 7],
    ),

  /** `deep.walk.pause` 1 — 홀짝을 안 가르면 홀수 길이에서 답이 조용히 틀린다. */
  "mutant-parity": () =>
    md(
      ["입력", "길이", "바른 코드", "홀짝을 안 가른 코드"],
      MUTANT_INPUTS.map((x) => [
        show(x),
        String(x.length),
        answer(minMaxPair(x)),
        answer(noParity.minMaxPair(x)),
      ]),
      [1],
    ),

  /** `deep.walk.pause` 1 — 없는 칸과의 비교가 내는 값. */
  "parity-undefined": () => {
    const u = undefined as unknown as number;
    const lines: [string, boolean][] = [
      ["1 < undefined", 1 < u],
      ["undefined < 1", u < 1],
      ["1 > undefined", 1 > u],
    ];
    return [...lines.map(([e, r]) => `${e.padEnd(15)}→  ${r}`)].join("\n");
  },

  /** `deep.walk.pause` 1 — 틀리는 입력과 안 틀리는 입력을 가르는 것. */
  "parity-last": () => {
    const odd = MUTANT_INPUTS.filter((x) => x.length % 2 === 1 && x.length > 1);
    return block(
      md(
        [
          "입력",
          "마지막 원소",
          "최솟값",
          "마지막 원소가 최솟값",
          "홀짝을 안 가른 코드의 답",
        ],
        odd.map((x) => {
          const last = x.at(-1) as number;
          const min = minMaxPair(x).min;
          return [
            show(x),
            String(last),
            String(min),
            last === min ? "예" : "아니오",
            answer(noParity.minMaxPair(x)),
          ];
        }),
        [1, 2],
      ),
      "마지막 원소가 최솟값인 줄에서만 min 이 실제 최솟값과 어긋납니다.",
    );
  },

  /** `deep.walk.step` 2 — 쌍을 가르는 조각만 고정 입력에 실행한 결과. */
  "walk-split": () =>
    md(
      ["i", "a = A[i]", "b = A[i+1]", "a < b", "lo", "hi"],
      walkRun()
        .events.filter((e) => e.kind === "pair")
        .map((e) => [
          String(e.i),
          String(A8[e.left]),
          String(A8[e.right]),
          tf(e.result),
          String(A8[e.loAt as number]),
          String(A8[e.hiAt as number]),
        ]),
      [0, 1, 2, 4, 5],
    ),

  /** `deep.walk.step` 3 — 극값 비교 조각을 이어 실행한 결과. */
  "walk-extremes": () => {
    const run = walkRun();
    return md(
      ["쌍", "lo", "hi", "lo < min", "min", "hi > max", "max"],
      run.events
        .filter((e) => e.kind === "pair")
        .map((p) => {
          const { lo, hi } = extremesOf(run, p);
          const was = (e: Event) => A8[e.right] as number;
          return [
            `(${A8[p.left]}, ${A8[p.right]})`,
            String(A8[p.loAt as number]),
            String(A8[p.hiAt as number]),
            `${A8[lo.left]} < ${was(lo)} ${tf(lo.result)}`,
            lo.result
              ? `${was(lo)} → ${A8[lo.minAt]}`
              : `${A8[lo.minAt]} 그대로`,
            `${A8[hi.left]} > ${was(hi)} ${tf(hi.result)}`,
            hi.result
              ? `${was(hi)} → ${A8[hi.maxAt]}`
              : `${A8[hi.maxAt]} 그대로`,
          ];
        }),
      [1, 2],
    );
  },

  /** `deep.walk.step` 4 — 고정 입력을 비교 한 번씩 끊어 끝까지. */
  "walk-trace": () => {
    const run = walkRun();
    const steps = walkSteps(run);
    const rows = run.events.map((e, k) => {
      const s = steps[k];
      const mark = e.kind === "start" ? "②" : e.kind === "pair" ? "③" : "④";
      return [
        s?.id ?? "",
        mark,
        `\`${s?.stage.calc?.expr ?? ""}\``,
        tf(e.result),
        e.loAt === undefined ? "—" : String(A8[e.loAt]),
        e.hiAt === undefined ? "—" : String(A8[e.hiAt]),
        String(A8[e.minAt]),
        String(A8[e.maxAt]),
        String(e.count),
      ];
    });
    rows.push([
      steps.at(-1)?.id ?? "",
      "종료",
      `\`i = ${run.endI}\`${josa(run.endI, "이라", "라")} \`i < n\` 이 거짓`,
      "—",
      "—",
      "—",
      String(run.min),
      String(run.max),
      String(run.events.length),
    ]);
    return md(
      [
        "단계",
        "갈래",
        "이번 비교",
        "결과",
        "lo",
        "hi",
        "min",
        "max",
        "누적 비교",
      ],
      rows,
      [4, 5, 6, 7, 8],
    );
  },

  /** `deep.walk.pause` 2 — 양쪽을 다 비교해도 답은 그대로이고 비교만 는다. */
  "both-sides": () =>
    md(
      [
        "n",
        "정본의 비교",
        "양쪽 다 비교한 코드의 비교",
        "정본의 답",
        "양쪽 다 비교한 코드의 답",
      ],
      SIZES.map((x) => [
        num(x.length),
        num(countOf(x, minMaxPair)),
        num(countOf(x, bothSides.minMaxPair)),
        answer(minMaxPair(x)),
        answer(bothSides.minMaxPair(x)),
      ]),
      [0, 1, 2],
    ),

  /**
   * `deep.walk.pause` 2 — 더한 비교 둘이 실제로 참이 된 횟수. 변이의 비교 목록을 쌍마다 다섯 개씩
   * (`a < b` · `lo < min` · `hi < min` · `lo > max` · `hi > max`) 읽는다.
   */
  "both-sides-true": () => {
    if (neutral(bothSides)) return "";
    return block(
      md(
        ["n", "`hi < min` 이 참인 횟수", "`lo > max` 가 참인 횟수", "`lo > max` 가 참인 뒤 `hi > max` 도 참인 횟수"],
        SIZES.map((x) => {
          const { cmps } = measure(x, (xs) => bothSides.minMaxPair(xs));
          const start = x.length % 2 === 0 ? 1 : 0;
          let hiMin = 0;
          let loMax = 0;
          let then = 0;
          for (let k = start; k < cmps.length; k += 5) {
            const at = (j: number) => cmps[k + j] as Cmp;
            const v = (c: Cmp, side: 0 | 1) => x[c[side]] as number;
            if (v(at(2), 0) < v(at(2), 1)) hiMin++;
            const lm = v(at(3), 0) > v(at(3), 1);
            if (lm) loMax++;
            if (lm && v(at(4), 0) > v(at(4), 1)) then++;
          }
          if ((cmps.length - start) % 5 !== 0) {
            throw new Error("양쪽 비교 변이의 목록이 쌍마다 다섯 개가 아니다");
          }
          return [num(x.length), num(hiMin), num(loMax), num(then)];
        }),
        [0, 1, 2, 3],
      ),
      "`hi < min` 은 한 번도 참이 되지 않았고, `lo > max` 가 참이 된 쌍에서는 매번 바로 다음 `hi > max` 도 참이었습니다.",
    );
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const inputs: number[][] = [
      [3, 1, 4, 1, 5, 9, 2, 6],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [7],
      [5, 5, 5, 5],
      [-3, -1, -4, -1, -5],
      [-10, 0, 10],
      [100, 50, 70, -10],
    ];
    const w = Math.max(...inputs.map((v) => show(v).length));
    return [
      ...inputs.map(
        (v) => `minMaxPair(${show(v).padEnd(w)})  →  ${answer(minMaxPair(v))}`,
      ),
    ].join("\n");
  },

  /** `related` — 같은 입력으로 토너먼트를 끝까지. */
  "related-tournament": () => {
    const t = tournament([...A8]);
    const cmpsIn = (k: number) =>
      Math.floor((t.rounds[k - 1] as number[]).length / 2);
    const rows = t.rounds
      .slice(1)
      .map((alive, k) => [
        `${k + 1} 회전`,
        alive.map((at) => String(A8[at])).join(" · "),
        String(cmpsIn(k + 1)),
      ]);
    const total = countOf(A8, (xs) => tournament(xs));
    const roundCmps = t.rounds
      .slice(1)
      .reduce((s, _, k) => s + cmpsIn(k + 1), 0);
    const n = A8.length;
    const logn = Math.ceil(Math.log2(n));
    const top = A8[t.winner] as number;
    const second = A8[t.second] as number;
    return block(
      md(["회전", "다음 회전으로 올라간 값", "비교"], rows, [2]),
      `가장 큰 값 ${top}${과와(top)} 직접 비교된 원소는 ${t.beaten.map((at) => A8[at]).join(" · ")} 의 ${t.beaten.length} 개이고, 그중 가장 큰 ${second}${이가(second)} 두 번째로 큰 값입니다. 회전에 비교 ${roundCmps} 번, 그 ${t.beaten.length} 개 중 가장 큰 값을 고르는 데 ${total - roundCmps} 번으로 모두 ${total} 번이고, n + ⌈log₂ n⌉ − 2 = ${n} + ${logn} − 2 = ${n + logn - 2}${과와(n + logn - 2)} 같습니다.`,
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. `s`·`p` 는 정본 실행에서 센다. */
  "math-check": () => {
    const cells = [5, 6, 8].map((n) => {
      const run = decode(BIG.slice(0, n));
      const s = run.odd ? 0 : 1;
      const p = run.events.filter((e) => e.kind === "pair").length;
      return [
        `n = ${n} (${run.odd ? "홀수" : "짝수"})`,
        `s = ${s}, p = ${p}`,
        `C = ${s} + 3 × ${p} = ${s + 3 * p}`,
        `실측 ${run.events.length}`,
      ];
    });
    // 열 폭을 값에서 잰다 — 한글은 두 칸이다.
    const w = (t: string) =>
      [...t].reduce((a, c) => a + (/[가-힯]/.test(c) ? 2 : 1), 0);
    const widths = [0, 1, 2].map((c) =>
      Math.max(...cells.map((r) => w(r[c] as string))),
    );
    const lines = cells.map((r) =>
      r
        .map((t, c) =>
          c < 3 ? t + " ".repeat((widths[c] as number) - w(t) + 3) : t,
        )
        .join(""),
    );
    return lines.join("\n");
  },

  /** `deep.math` ② — 홀·짝 두 식과 통합식이 계측값과 같은지 검산한다. */
  "formula-check": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 10; n++) {
      const input = Array.from({ length: n }, (_, i) => (i * 7) % 13);
      const got = countOf(input, minMaxPair);
      const byParity = n % 2 === 1 ? (3 * (n - 1)) / 2 : 1 + (3 * (n - 2)) / 2;
      // C++ 표준이 `minmax_element` 의 복잡도로 적는 식. 값이 같은지도 함께 본다.
      const std = Math.max(Math.floor((3 * (n - 1)) / 2), 0);
      rows.push([
        String(n),
        n % 2 === 1 ? "홀수" : "짝수",
        String(got),
        String(byParity),
        String(formula(n)),
        String(std),
        got === byParity && got === formula(n) && got === std
          ? "같다"
          : "다르다",
      ]);
    }
    return md(
      [
        "n",
        "길이",
        "실측 비교",
        "홀·짝 식",
        "⌈3n/2⌉ − 2",
        "⌊3(n − 1)/2⌋",
        "네 값",
      ],
      rows,
      [0, 2, 3, 4, 5],
    );
  },

  /** `deep.math` 하한 — 적대자가 고르는 답과 그때 새로 빠지는 후보 수. */
  "math-adversary": () => {
    const rows: string[][] = [];
    let twos = 0;
    STATES.forEach((x, a) => {
      STATES.forEach((y, b) => {
        if (b < a) return;
        // 앞 원소가 작다고 답하면 앞 원소는 최댓값 후보에서, 뒤 원소는 최솟값 후보에서 빠진다.
        const xSmall = (x.max ? 1 : 0) + (y.min ? 1 : 0);
        const ySmall = (y.max ? 1 : 0) + (x.min ? 1 : 0);
        const pick = Math.min(xSmall, ySmall);
        if (pick === 2) twos++;
        rows.push([
          `${x.name} · ${y.name}`,
          String(xSmall),
          String(ySmall),
          !x.min && !x.max && !y.min && !y.max
            ? "지금 값대로"
            : xSmall <= ySmall
              ? "앞 원소가 작다"
              : "뒤 원소가 작다",
          String(pick),
        ]);
      });
    });
    return block(
      md(
        [
          "비교하는 두 원소",
          "앞 원소가 작다고 답할 때 빠지는 후보",
          "뒤 원소가 작다고 답할 때 빠지는 후보",
          "적대자의 답",
          "새로 빠지는 후보",
        ],
        rows,
        [1, 2, 4],
      ),
      `상태 짝 ${rows.length} 가지 중 적대자가 답을 골라도 후보가 둘 빠지는 짝은 ${twos} 가지이고, 그것은 두 원소가 모두 「둘 다 후보」인 짝입니다.`,
    );
  },

  /** `deep.math` 하한 — 하한식과 닫힌 형태, 정본의 실측을 n = 1..10 에서. */
  "math-bound-check": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 10; n++) {
      const half = Math.floor(n / 2);
      const bound = half + (2 * (n - 1) - 2 * half);
      const input = Array.from({ length: n }, (_, i) => (i * 5) % 11);
      rows.push([
        String(n),
        String(half),
        String(2 * (n - 1)),
        String(bound),
        String(formula(n)),
        String(countOf(input, minMaxPair)),
      ]);
    }
    return md(
      [
        "n",
        "⌊n/2⌋",
        "2(n − 1)",
        "⌊n/2⌋ + 2(n − 1) − 2⌊n/2⌋",
        "⌈3n/2⌉ − 2",
        "정본의 비교",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    );
  },

  /** `deep.math` ④ — 과제 규모를 식에 넣는다. */
  n1e5: () => {
    const naive = countOf(BIG, oneLoop);
    const pair = countOf(BIG, minMaxPair);
    return md(
      ["방법", "비교 횟수"],
      [
        ["원소마다 두 번 비교하기 (2n − 2)", num(naive)],
        ["짝지어 비교하기 (⌈3n/2⌉ − 2)", num(pair)],
        ["줄어든 수", num(naive - pair)],
        ["줄어든 비율", `${(((naive - pair) / naive) * 100).toFixed(1)}%`],
        ["하한과의 차이", num(pair - formula(BIG.length))],
      ],
      [1],
    );
  },

  /** `invariant` ① — 「언제」를 빠뜨리면 거짓이 되는 자리. */
  "invariant-when": () => {
    const run = walkRun();
    const steps = walkSteps(run);
    const reach = (e: Event) => Math.max(e.left, e.right) + 1;
    const rows = run.events.map((e, k) => {
      const upto = Math.max(...run.events.slice(0, k + 1).map(reach));
      const prefix = A8.slice(0, upto);
      const trueMin = Math.min(...prefix);
      const trueMax = Math.max(...prefix);
      const ok = A8[e.minAt] === trueMin && A8[e.maxAt] === trueMax;
      return { id: steps[k]?.id ?? "", e, upto, trueMin, trueMax, ok };
    });
    const bad = rows.filter((r) => !r.ok);
    const first = bad[0];
    const shown = rows.filter((r) => r.e.i === first?.e.i);
    return block(
      md(
        [
          "걸음 직후",
          "읽은 칸",
          "min",
          "읽은 칸의 최솟값",
          "max",
          "읽은 칸의 최댓값",
        ],
        shown.map((r) => [
          r.id,
          `A[0] … A[${r.upto - 1}]`,
          String(A8[r.e.minAt]),
          String(r.trueMin),
          String(A8[r.e.maxAt]),
          String(r.trueMax),
        ]),
        [2, 3, 4, 5],
      ),
      `비교 걸음 ${rows.length} 개 중 min 이나 max 가 읽은 칸의 극값과 어긋나는 걸음은 ${bad.map((r) => r.id).join(" · ")} 이고, 모두 쌍 하나를 처리하는 도중입니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const inputs: number[][] = [
      [7],
      [1, 2],
      [2, 1],
      [3, 1, 4],
      [5, 5, 5, 5],
      [-3, -1, -4, -1, -5],
    ];
    const rows = inputs.map((x) => {
      const run = decode(x);
      return [
        show(x),
        run.odd ? "홀수 갈래" : "짝수 갈래",
        String(run.events.filter((e) => e.kind === "pair").length),
        String(run.events.length),
        answer(minMaxPair(x)),
      ];
    });
    const empty = measure([], (xs) => minMaxPair(xs));
    const got = empty.out as unknown as { min: unknown; max: unknown };
    rows.push([
      "[]",
      "짝수 갈래",
      "0",
      String(empty.cmps.length),
      `{ min: ${String(got.min)}, max: ${String(got.max)} }`,
    ]);
    return md(["입력", "시작 갈래", "쌍", "비교", "결과"], rows, [2, 3]);
  },

  /** `invariant` ③ — 불변식을 지키던 줄을 바꾼 사본의 실제 값. */
  "mutant-min": () =>
    md(
      ["입력", "바른 코드", "작은 쪽을 안 보는 코드", "min"],
      MUTANT_INPUTS.map((x) => {
        const good = minMaxPair(x);
        const bad = ignoreLo.minMaxPair(x);
        return [
          show(x),
          answer(good),
          answer(bad),
          Object.is(good.min, bad.min) ? "맞다" : "틀린다",
        ];
      }),
    ),

  /** `invariant` ③ — 가장 크게 어긋난 입력을 바꾼 사본으로 따라간다. */
  "mutant-min-trace": () => {
    const x = [100, 50, 70, -10];
    const { cmps } = measure(x, (xs) => ignoreLo.minMaxPair(xs));
    const ops = ["<", "<", "<", ">"];
    const names = ["시작 비교", "쌍 안 비교", "min 과의 비교", "max 와의 비교"];
    return block(
      md(
        ["비교", "바꾼 코드가 실제로 한 비교"],
        cmps.map((c, k) => [names[k] ?? "", cmpText(x, c, ops[k] ?? "<")]),
      ),
      `바꾼 코드는 비교 ${cmps.length} 번 중 어느 것에서도 A[3] = -10 을 min 과 비교하지 않고 ${answer(ignoreLo.minMaxPair(x))} 를 돌려줍니다.`,
    );
  },

  /** `perf.derive` — 전개의 걸음을 갈래별로 모은다. */
  "derive-t": () => {
    const run = walkRun();
    const steps = walkSteps(run);
    const group = (pred: (e: Event) => boolean) =>
      run.events.flatMap((e, k) => (pred(e) ? [steps[k]?.id ?? ""] : []));
    const start = group((e) => e.kind === "start");
    const pair = group((e) => e.kind === "pair");
    const ext = group((e) => e.kind === "min" || e.kind === "max");
    return block(
      md(
        ["갈래", "걸음", "비교"],
        [
          ["② 시작 비교", start.join(" · "), String(start.length)],
          ["③ 쌍 안 비교", pair.join(" · "), String(pair.length)],
          ["④ 극값 비교", ext.join(" · "), String(ext.length)],
          ["종료", steps.at(-1)?.id ?? "", "0"],
        ],
        [2],
      ),
      `합은 ${start.length + pair.length + ext.length} 번이고, ⌈3·${A8.length}/2⌉ − 2 = ${formula(A8.length)}${과와(formula(A8.length))} 같습니다.`,
    );
  },

  /** `perf.derive` — 비교 횟수를 시작 갈래와 쌍의 수로 갈라 센다. */
  "derive-count": () =>
    md(
      [
        "n",
        "시작 비교 s",
        "쌍의 수 p",
        "쌍마다 3 번",
        "s + 3p",
        "실측 비교",
        "배열 읽기",
      ],
      [4, 8, 9, 100_000].map((n) => {
        const x = BIG.slice(0, n);
        const run = decode(x);
        const s = run.odd ? 0 : 1;
        const p = run.events.filter((e) => e.kind === "pair").length;
        return [
          num(n),
          String(s),
          num(p),
          num(3 * p),
          num(s + 3 * p),
          num(run.events.length),
          num(readsOf(x, minMaxPair)),
        ];
      }),
      [0, 1, 2, 3, 4, 5, 6],
    ),

  /** `perf.bounds` — 입력 모양을 바꿔도 비교는 그대로이고 min·max 가 바뀐 횟수만 갈린다. */
  "cost-cases": () => {
    const cases: [string, number[]][] = [
      ["오름차순 [1 … 8]", Array.from({ length: 8 }, (_, i) => i + 1)],
      ["내림차순 [8 … 1]", Array.from({ length: 8 }, (_, i) => 8 - i)],
      ["모두 같은 값 [5 × 8]", new Array<number>(8).fill(5)],
      ["바깥으로 벌어짐", [0, 0, -1, 1, -2, 2, -3, 3]],
      ["전개의 입력", A8],
    ];
    return md(
      ["입력", "비교", "min·max 가 바뀐 횟수", "min", "max"],
      cases.map(([name, x]) => {
        const run = decode(x);
        return [
          name,
          String(run.events.length),
          String(changesOf(run)),
          String(run.min),
          String(run.max),
        ];
      }),
      [1, 2, 3, 4],
    );
  },

  /** `perf.worst` — 바깥으로 벌어지는 입력을 정본으로 따라간다. */
  "worst-trace": () => {
    const x = [0, 0, -1, 1, -2, 2, -3, 3];
    const run = decode(x);
    let changes = 0;
    const rows = run.events
      .filter((e) => e.kind === "pair")
      .map((p) => {
        const { lo, hi } = extremesOf(run, p);
        changes += (lo.result ? 1 : 0) + (hi.result ? 1 : 0);
        return [
          `(${x[p.left]}, ${x[p.right]})`,
          `${x[lo.left]} < ${x[lo.right]} ${tf(lo.result)}`,
          `${x[hi.left]} > ${x[hi.right]} ${tf(hi.result)}`,
          `min = ${x[hi.minAt]}, max = ${x[hi.maxAt]}`,
          String(changes),
        ];
      });
    return block(
      md(
        ["쌍", "lo < min", "hi > max", "쌍을 끝낸 뒤", "바뀐 횟수 누적"],
        rows,
        [4],
      ),
      `${show(x)} 에서 시작 비교가 min = ${x[run.startMinAt]}, max = ${x[run.startMaxAt]} 을 정한 뒤, 쌍 ${rows.length} 개가 모두 min 과 max 를 함께 바꿔 바뀐 횟수가 ${changes} 번이 됩니다.`,
    );
  },

  /** `perf.worst` — 최악 입력을 세 규모에서 만들어 잰다. */
  "worst-input": () => {
    // 길이가 짝수면 시작 갈래가 두 원소를 쓰므로 0 을 둘, 홀수면 하나 둔다.
    const make = (n: number): number[] => {
      const v: number[] = n % 2 === 0 ? [0, 0] : [0];
      for (let k = 1; v.length < n; k++) v.push(-k, k);
      return v;
    };
    return md(
      [
        "n",
        "비교",
        "쌍의 수 p",
        "바깥으로 벌어지는 입력의 바뀐 횟수",
        "모두 같은 값의 바뀐 횟수",
        "2p",
      ],
      [8, 9, 12, 100_000].map((n) => {
        const run = decode(make(n));
        const p = run.events.filter((e) => e.kind === "pair").length;
        return [
          num(n),
          num(run.events.length),
          num(p),
          num(changesOf(run)),
          num(changesOf(decode(new Array<number>(n).fill(5)))),
          num(2 * p),
        ];
      }),
      [0, 1, 2, 3, 4, 5],
    );
  },

  /** `selfcheck` 답 — 마지막 쌍의 세 걸음이 두 후보 줄에서 뺀 칸. */
  "selfcheck-removed": () => {
    const run = walkRun();
    const steps = walkSteps(run);
    const lastI = Math.max(...run.events.map((e) => e.i ?? 0));
    const cell = (xs: readonly number[]) =>
      xs.length === 0
        ? "—"
        : xs.map((at) => `A[${at}] = ${A8[at]}`).join(" · ");
    return md(
      ["걸음", "최솟값 후보에서 빠진 원소", "최댓값 후보에서 빠진 원소"],
      run.events
        .filter((e) => e.i === lastI)
        .map((e) => [
          steps[run.events.indexOf(e)]?.id ?? "",
          cell(e.outOfMin),
          cell(e.outOfMax),
        ]),
    );
  },

  /** `selfcheck` — 답이 붙는 문제가 인용하는 세 걸음. */
  "selfcheck-pair": () => {
    const run = walkRun();
    const steps = walkSteps(run);
    const lastI = Math.max(...run.events.map((e) => e.i ?? 0));
    return md(
      ["단계", "비교", "결과", "바뀐 것"],
      run.events
        .filter((e) => e.i === lastI)
        .map((e) => {
          const s = steps[run.events.indexOf(e)];
          const changed =
            e.kind === "pair"
              ? `lo = ${A8[e.loAt as number]}, hi = ${A8[e.hiAt as number]}`
              : e.result
                ? `${e.kind} 가 바뀐다`
                : `${e.kind} = ${A8[e.kind === "min" ? e.minAt : e.maxAt]} 그대로`;
          return [
            s?.id ?? "",
            `\`${s?.stage.calc?.expr ?? ""}\``,
            tf(e.result),
            changed,
          ];
        }),
    );
  },
};
