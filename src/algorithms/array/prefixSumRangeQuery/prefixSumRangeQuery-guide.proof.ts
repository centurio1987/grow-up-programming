/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 누적합 배열의 칸과 답은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는 } from "../../../../tools/josa.ts";
import { cases as benchCases } from "./prefixSumRangeQuery-guide.alt.ts";
import {
  addEachQuery,
  allPairs,
  BUDGET,
  BYTES,
  N_MAX,
  prefixOps,
  range,
  secondsOf,
  sumOf,
  trace,
  WALK,
  WALK_Q,
  walkSteps,
} from "./prefixSumRangeQuery-guide.fig.tsx";
import { prefixSumRangeQuery } from "./prefixSumRangeQuery-guide.ref.ts";

const REF = new URL("./prefixSumRangeQuery-guide.ref.ts", import.meta.url)
  .pathname;

type Query = readonly [number, number];

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** `[3 1 4 1 5 9]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** `[1,3]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const span = ([l, r]: Query): string => `[${l},${r}]`;

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

/** 증명 표에 붙는 문장 — 표 아래 한 문단(SPEC §12 「증명 표에 붙는 문장」). 닫는 마커는 본문이 적는다. */
const withNote = (table: string, note: string): string => `${table}\n\n${note}`;

/** 「3 + 1 + 4 + 1」 꼴 — 구간의 값을 더하는 식. 음수는 괄호로 싼다. */
const plus = (A: readonly number[], l: number, r: number): string =>
  range(l, r)
    .map((i) => {
      const v = A[i] as number;
      return v < 0 ? `(${v})` : String(v);
    })
    .join(" + ");

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  prefixSumRangeQuery(A: number[], queries: Array<[number, number]>): number[];
}

/**
 * 오른쪽 끝을 한 칸 앞에서 읽는 사본. 인덱스 하나만 다르다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const readLeftOfEnd = await loadMutant<Impl>(REF, {
  swap: [/P\[r \+ 1\]/, "P[r]"],
});

/** 누적을 빼고 원소만 담는 사본. 불변식을 지키던 줄 하나가 그 대상이다. */
const noAccumulate = await loadMutant<Impl>(REF, {
  swap: [
    /P\[i \+ 1\] = \(P\[i\] as number\) \+ \(A\[i\] as number\);/,
    "P[i + 1] = A[i] as number;",
  ],
});

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다.
 *
 * 중화 실행(`check-proof` 가 변이를 끄고 한 번 더 부르는 실행)에서는 이 검사를 건너뛴다. 중화
 * 여부는 **값에서** 알아낸다 — 변이 모듈의 함수가 정본과 같은 객체면 중화된 것이다.
 */
function assertBreaks(
  mutant: Impl,
  rows: { bare: string; mutated: string }[],
): void {
  if (mutant.prefixSumRangeQuery === prefixSumRangeQuery) return;
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 계측기 ────────────────────────── */

const qs = (queries: readonly Query[]): Array<[number, number]> =>
  queries.map((q) => [q[0], q[1]]);

/** 누적합 배열 — 정본 계측 기록에서. */
const prefixOf = (A: readonly number[]): readonly number[] => trace(A, []).P;

/** 모든 질의가 배열 전체 `[0, n−1]` 을 묻는 목록. */
const fullQueries = (n: number, q: number): Query[] =>
  Array.from({ length: q }, () => [0, n - 1] as const);

/**
 * `B` 칸마다 하나씩만 저장하는 절차. `B = 1` 이면 정본과 같은 누적합 배열이다(연산 수를 정본
 * 계측과 대조한다). 앞 `k` 칸의 합은 저장해 둔 `S[⌊k/B⌋]` 에서 시작해 `k mod B` 칸을 더해 만든다.
 */
function blockSaved(
  A: readonly number[],
  queries: readonly Query[],
  B: number,
): {
  answers: number[];
  cells: number;
  fillAdds: number;
  queryAdds: number;
  subs: number;
} {
  const n = A.length;
  const S: number[] = [0];
  let running = 0;
  let fillAdds = 0;
  for (let i = 0; i < n; i++) {
    running += A[i] as number;
    fillAdds++;
    if ((i + 1) % B === 0) S.push(running);
  }
  let queryAdds = 0;
  const upTo = (k: number): number => {
    let s = S[Math.floor(k / B)] as number;
    for (let t = Math.floor(k / B) * B; t < k; t++) {
      s += A[t] as number;
      queryAdds++;
    }
    return s;
  };
  const answers: number[] = [];
  let subs = 0;
  for (const [l, r] of queries) {
    const right = upTo(r + 1);
    const left = upTo(l);
    subs++;
    answers.push(right - left);
  }
  const want = prefixSumRangeQuery([...A], qs(queries));
  if (JSON.stringify(answers) !== JSON.stringify(want)) {
    throw new Error(`저장 간격 ${B} 의 답이 정본과 다르다`);
  }
  if (B === 1) {
    const ops = prefixOps(A, queries);
    if (ops.adds !== fillAdds || ops.subs !== subs || queryAdds !== 0) {
      throw new Error("저장 간격 1 의 연산 수가 정본 계측과 다르다");
    }
  }
  return { answers, cells: S.length, fillAdds, queryAdds, subs };
}

/**
 * 누적합 배열을 **입력 배열과 같은 길이**로 잡는 정의. `T[i]` 가 `A[0..i]` 의 합이라 왼쪽 끝이
 * 0 인 질의가 `T[-1]` 을 읽는다 — 그 칸이 없어서 값이 아닌 것이 나온다.
 */
function sameLength(A: readonly number[]): number[] {
  const T = new Array<number>(A.length);
  T[0] = A[0] as number;
  for (let i = 1; i < A.length; i++)
    T[i] = (T[i - 1] as number) + (A[i] as number);
  return T;
}
const sameLengthAnswer = (T: readonly number[], [l, r]: Query): number =>
  (T[r] as number) - (T[l - 1] as number);

/** 모든 `(l, r)` 짝. */
const allQueries = (n: number): Query[] =>
  range(0, n - 1).flatMap((l) => range(l, n - 1).map((r) => [l, r] as const));

/* ────────────────────────── 입력 ────────────────────────── */

/** 전체 컨셉이 고치는 원소 — `A[1]` 을 이 값으로. */
const UPDATE_AT = 1;
const UPDATE_TO = 7;

/** 음수가 섞인 입력 — 2단계의 불안한 경우. */
const NEGATIVE: readonly number[] = [-1, 2, -3, 4];

/** 오른쪽 끝을 한 칸 앞에서 읽는 변이를 시험할 입력. 뒤 둘은 오른쪽 끝의 값이 0 이다. */
const END_CASES: [readonly number[], Query][] = [
  [WALK, [1, 3]],
  [WALK, [0, 5]],
  [WALK, [4, 4]],
  [
    [3, 1, 0, 4],
    [0, 2],
  ],
  [
    [2, 0, 0, 7],
    [1, 2],
  ],
];

/** 경계 입력 — 불변식 절. */
const EDGES: [string, readonly number[], Query[]][] = [
  ["질의 목록이 빔", [1, 2, 3], []],
  ["원소 하나", [7], [[0, 0]]],
  ["한 칸짜리 구간", WALK, [[4, 4]]],
  ["왼쪽 끝이 0", WALK, [[0, 2]]],
  ["음수가 섞임", NEGATIVE, [[0, 3]]],
  [
    "같은 질의 반복",
    [1, 2, 3],
    [
      [0, 2],
      [0, 2],
      [0, 2],
    ],
  ],
];

const walk = () => trace(WALK, WALK_Q);

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 구간 [1,3] 의 합을 두 칸의 차로. */
  "concept-query": () => {
    const t = walk();
    const [l, r] = WALK_Q[0] as Query;
    const right = t.P[r + 1] as number;
    const left = t.P[l] as number;
    return block(
      columns([
        [`P[${r + 1}] = ${plus(WALK, 0, r)} = ${right}`, `앞 ${r + 1} 칸의 합`],
        [
          l === 1
            ? `P[${l}] = ${left}`
            : `P[${l}] = ${plus(WALK, 0, l - 1)} = ${left}`,
          `앞 ${l} 칸의 합`,
        ],
        [
          `P[${r + 1}] − P[${l}] = ${right} − ${left} = ${right - left}`,
          `남은 것이 ${plus(WALK, l, r)} = ${sumOf(WALK, l, r)} 이다`,
        ],
      ]),
    );
  },

  /** `concept` — 원소 하나를 고치면 누적합 배열의 뒤쪽이 통째로 어긋난다. */
  "concept-update": () => {
    const before = prefixOf(WALK);
    const A2 = [...WALK];
    A2[UPDATE_AT] = UPDATE_TO;
    const after = prefixOf(A2);
    const changed = range(0, before.length - 1).filter(
      (i) => before[i] !== after[i],
    );
    return block([
      `A[${UPDATE_AT}] 을 ${WALK[UPDATE_AT]} 에서 ${UPDATE_TO}${으로(UPDATE_TO)} 고치면`,
      "",
      ...columns([
        ["  고치기 전 P", show(before)],
        ["  고친 뒤 P", show(after)],
      ]),
      `    └ 칸 ${changed[0]} 부터 칸 ${changed.at(-1)} 까지 ${changed.length} 칸이 달라진다. 모두 A[${UPDATE_AT}] 을 더한 칸이다`,
    ]);
  },

  /** `prereq` — 구간을 받아 합을 내는 과제와, 합을 받아 구간을 찾는 과제는 다르다. */
  "prereq-two-tasks": () => {
    const [l, r] = WALK_Q[0] as Query;
    const target = sumOf(WALK, l, r);
    const found = allQueries(WALK.length).filter(
      (q) => sumOf(WALK, q[0], q[1]) === target,
    );
    return md(
      ["과제", "주는 것", "답"],
      [
        [
          "구간 합 질의 — 이 글이 하는 것",
          `구간 ${span([l, r])}`,
          `합 ${target}`,
        ],
        [
          `합이 ${target} 인 구간 찾기`,
          `합 ${target}`,
          `구간 ${found.map(span).join(" · ")}`,
        ],
      ],
    );
  },

  /** `deep.origin` ② — 가장 단순한 방법의 비용. 모든 질의가 배열 전체를 묻는 입력. */
  "origin-cost": () => {
    const measured = [1_000, 10_000];
    const rows = [...measured, N_MAX].map((n) => {
      const closed = n * n;
      if (measured.includes(n)) {
        const A = new Array<number>(n).fill(1);
        const { adds } = addEachQuery(A, fullQueries(n, n));
        if (adds !== closed) {
          throw new Error(
            `n = ${n} 에서 실측 ${adds} 이 q·n = ${closed} 과 다르다`,
          );
        }
      }
      return [
        num(n),
        num(closed),
        secondsOf(closed),
        measured.includes(n) ? "실행해서 셌다" : "q·n 으로 냈다",
      ];
    });
    return withNote(
      md(
        ["n = q", "지나는 칸 수의 합", "초당 1 억 번 기준", "구한 방법"],
        rows,
        [0, 1, 2],
      ),
      `모든 질의가 배열 전체를 묻는 입력입니다. 실행해서 센 n = ${measured.map(num).join(" · ")} 에서 지나는 칸 수가 q·n 과 정확히 같았습니다.`,
    );
  },

  /** `deep.origin` ③ — 다섯 질의가 같은 칸을 몇 번이나 다시 더하는가. */
  "origin-overlap": () => {
    const hits = new Array<number>(WALK.length).fill(0);
    const rows = WALK_Q.map((q) => {
      for (const i of range(q[0], q[1])) hits[i] = (hits[i] ?? 0) + 1;
      return [span(q), range(q[0], q[1]).join(" "), String(q[1] - q[0] + 1)];
    });
    const total = hits.reduce((a, b) => a + b, 0);
    const most = Math.max(...hits);
    const at = hits.indexOf(most);
    return withNote(
      md(["질의", "더한 칸의 인덱스", "더한 횟수"], rows, [2]),
      `다섯 질의가 더한 칸은 모두 ${total} 개인데 서로 다른 칸은 ${WALK.length} 개뿐입니다. 칸 ${at}${은는(at)} 다섯 질의 중 ${most} 개에 들어 있어 ${most} 번 더했습니다.`,
    );
  },

  /** `deep.origin` ③ — 앞에서부터의 합 둘을 빼면 구간 하나가 나온다. */
  "origin-reuse": () => {
    const [l, r] = WALK_Q[4] as Query;
    const big = sumOf(WALK, 0, r);
    const small = sumOf(WALK, 0, l - 1);
    return block(
      columns([
        [
          `앞 ${r + 1} 칸의 합`,
          `${plus(WALK, 0, r)} = ${big}`,
          `[0,${r}] 의 답`,
        ],
        [
          `앞 ${l} 칸의 합`,
          `${plus(WALK, 0, l - 1)} = ${small}`,
          `[0,${l - 1}] 의 답`,
        ],
        [
          "두 합의 차",
          `${big} − ${small} = ${big - small}`,
          `[${l},${r}] 의 답이 뺄셈 하나로 나온다`,
        ],
      ]),
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 계수. */
  "origin-two-ways": () => {
    const a = addEachQuery(WALK, WALK_Q);
    const b = prefixOps(WALK, WALK_Q);
    const t = walk();
    if (JSON.stringify(a.answers) !== JSON.stringify(t.result)) {
      throw new Error("두 방식의 답이 다르다");
    }
    const rows = WALK_Q.map((q, i) => [
      span(q),
      String(q[1] - q[0] + 1),
      String(a.perQuery[i]),
      "1",
    ]);
    return withNote(
      md(
        ["질의", "구간 칸 수", "직접 더하기의 덧셈", "누적합 배열의 뺄셈"],
        rows,
        [1, 2, 3],
      ),
      `직접 더하기는 덧셈 ${a.adds} 번이고, 누적합 배열은 채우는 덧셈 ${b.adds} 번과 뺄셈 ${b.subs} 번으로 ${b.adds + b.subs} 번입니다. 답은 둘 다 ${t.result.join(" ")} 입니다.`,
    );
  },

  /** `deep.origin` ⑤ — 모든 짝의 답을 미리 담으면 칸이 몇 개인가. */
  "origin-precompute": () => {
    const sizes = [WALK.length, 100, 1_000, N_MAX];
    const rows = sizes.map((n) => [num(n), num(allPairs(n)), num(n + 1)]);
    const bytes = allPairs(N_MAX) * BYTES;
    return withNote(
      md(["n", "모든 짝의 답을 담는 칸", "누적합 배열의 칸"], rows, [0, 1, 2]),
      `n = ${num(N_MAX)} 이면 칸 하나를 ${BYTES} 바이트로 잡아 ${num(bytes)} 바이트, 약 ${num(Math.round(bytes / 1e9))} GB 입니다. 예산 256 MB 의 ${num(Math.floor(bytes / BUDGET))} 배가 넘습니다.`,
    );
  },

  /** `deep.build` (c) — 칸 하나를 이름에서 입력의 자리와 값까지 따라간다. */
  "build-read-one": () => {
    const P = walk().P;
    const k = 4;
    return block([
      `P[${k}]  →  앞 ${k} 칸  →  인덱스 [0,${k - 1}]  →  값 ${range(0, k - 1)
        .map((i) => WALK[i])
        .join(" ")}  →  합 ${P[k]}`,
    ]);
  },

  /** `deep.build` (d) — 이웃한 두 칸의 차가 곧 입력 원소 하나다. */
  "build-neighbors": () => {
    const P = walk().P;
    const rows = range(0, WALK.length - 1).map((i) => {
      const d = (P[i + 1] as number) - (P[i] as number);
      if (d !== WALK[i]) {
        throw new Error(`P[${i + 1}] − P[${i}] 이 A[${i}] 와 다르다`);
      }
      return [
        String(i),
        String(P[i]),
        String(P[i + 1]),
        String(d),
        String(WALK[i]),
      ];
    });
    return withNote(
      md(
        ["i", "P[i]", "P[i+1]", "P[i+1] − P[i]", "A[i]"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `${rows.length} 쌍 모두 이웃한 두 칸의 차가 A[i] 와 같습니다.`,
    );
  },

  /** `deep.build` (e) — 입력 배열과 같은 길이로 잡은 모양과의 비교. */
  "build-same-length": () => {
    const P = walk().P;
    const T = sameLength(WALK);
    const all = allQueries(WALK.length);
    const okP = all.filter(
      (q) =>
        (P[q[1] + 1] as number) - (P[q[0]] as number) ===
        sumOf(WALK, q[0], q[1]),
    ).length;
    const okT = all.filter(
      (q) => sameLengthAnswer(T, q) === sumOf(WALK, q[0], q[1]),
    ).length;
    return withNote(
      md(
        ["모양", "칸 수", "칸의 값", "구간 [l,r] 의 식", "맞게 답한 질의"],
        [
          [
            "누적합 배열 P — 칸 i 는 앞 i 칸의 합",
            String(P.length),
            show(P),
            "P[r+1] − P[l]",
            `${okP} / ${all.length}`,
          ],
          [
            "같은 길이 T — 칸 i 는 앞 i+1 칸의 합",
            String(T.length),
            show(T),
            "T[r] − T[l−1]",
            `${okT} / ${all.length}`,
          ],
        ],
        [1],
      ),
      `모든 (l, r) 짝 ${all.length} 개에 식을 실제로 적용해 직접 더한 값과 대조했습니다. T 는 왼쪽 끝이 0 인 ${all.length - okT} 개에서 T[−1] 을 읽어 값이 아닌 것을 냅니다.`,
    );
  },

  /** `deep.build` 1단계 — 칸 수와 칸 하나의 범위. */
  "build-size": () => {
    const P = walk().P;
    const maxAbs = 10_000;
    const bound = N_MAX * maxAbs;
    const bytes = (N_MAX + 1) * BYTES;
    return block(
      columns([
        [
          "칸 수",
          "n + 1",
          `전개 입력은 n = ${WALK.length}${josa(WALK.length, "이라", "라")} 칸 ${P.length} 개 · n = ${num(N_MAX)} 이면 칸 ${num(N_MAX + 1)} 개`,
        ],
        [
          "메모리",
          `(n + 1) × ${BYTES} 바이트`,
          `n = ${num(N_MAX)} 이면 ${num(bytes)} 바이트 — 256 MB 의 ${((bytes / BUDGET) * 100).toFixed(2)} %`,
        ],
        [
          "칸 하나의 범위",
          `|P[i]| ≤ i × ${num(maxAbs)}`,
          `n = ${num(N_MAX)} 이면 ${num(bound)} 이하 — 2^31 − 1 = ${num(2 ** 31 - 1)} 보다 작다`,
        ],
      ]),
    );
  },

  /** `deep.build` 2단계 — 칸마다 직전 칸 하나와 입력 원소 하나를 읽어 쓴다. */
  "build-fill": () => {
    const t = walk();
    const rows = t.fills.map((f) => [
      String(f.i),
      `P[${f.i}] = ${f.read}`,
      `A[${f.i}] = ${WALK[f.i]}`,
      `P[${f.i + 1}] = ${f.value}`,
    ]);
    return withNote(
      md(["i", "읽는 칸", "더하는 원소", "쓰는 칸"], rows, [0]),
      `i 가 0 부터 ${t.fills.length - 1} 까지 ${t.fills.length} 번 실행됐고, 칸 1 부터 칸 ${t.fills.length} 까지 한 번씩 썼습니다. 칸 0 은 반복 전에 넣은 값입니다.`,
    );
  },

  /** `deep.build` 2단계 — 음수가 섞이면 칸 값이 줄기도 한다. 규칙은 같다. */
  "build-fill-negative": () => {
    const P = prefixOf(NEGATIVE);
    const down = range(1, P.length - 1).filter(
      (i) => (P[i] as number) < (P[i - 1] as number),
    );
    return block([
      ...columns([
        ["A 의 값", NEGATIVE.join(" ")],
        ["P", show(P)],
      ]),
      `    └ 칸 ${down.join(" · ")} 의 값이 직전 칸보다 작다. 음수를 더한 칸이다. 규칙은 그대로 직전 칸에 원소 하나를 더한 것이다`,
    ]);
  },

  /** `deep.build` 3단계 — 모양이 다른 질의 다섯에 같은 식 하나. */
  "build-query-cases": () => {
    const t = walk();
    const kinds: Record<string, string> = {
      "1,3": "두 끝이 안쪽",
      "0,5": "배열 전체",
      "4,4": "한 칸짜리",
      "0,2": "왼쪽 끝이 0 — P[0] 을 읽는다",
      "2,5": "오른쪽 끝이 마지막 — P[n] 을 읽는다",
    };
    const rows = t.answers.map((a) => [
      kinds[`${a.l},${a.r}`] ?? "",
      span([a.l, a.r]),
      `P[${a.r + 1}] − P[${a.l}] = ${a.right} − ${a.left} = ${a.value}`,
      `${plus(WALK, a.l, a.r)} = ${sumOf(WALK, a.l, a.r)}`,
    ]);
    const same = t.answers.filter(
      (a) => a.value === sumOf(WALK, a.l, a.r),
    ).length;
    return withNote(
      md(["경우", "질의", "두 칸의 차", "직접 더한 값"], rows),
      `${t.answers.length} 경우 중 ${same} 경우에서 두 칸의 차가 직접 더한 값과 같습니다. 분기 없이 같은 식 하나입니다.`,
    );
  },

  /** `deep.build` 전제 — 최솟값에는 두 칸으로 구간 값을 만드는 연산이 없다. */
  "premise-min": () => {
    const M: number[] = [Number.POSITIVE_INFINITY];
    for (const [i, v] of WALK.entries()) M.push(Math.min(M[i] as number, v));
    const all = allQueries(WALK.length);
    const minOf = ([l, r]: Query) =>
      Math.min(...range(l, r).map((i) => WALK[i] as number));
    let pair: [Query, Query] | null = null;
    for (const a of all) {
      for (const b of all) {
        const sameCells = M[a[1] + 1] === M[b[1] + 1] && M[a[0]] === M[b[0]];
        if (sameCells && minOf(a) !== minOf(b)) {
          pair = [a, b];
          break;
        }
      }
      if (pair) break;
    }
    if (!pair) throw new Error("같은 두 칸을 읽고 답이 다른 질의 짝이 없다");
    const cell = (v: number) => (Number.isFinite(v) ? String(v) : "∞");
    const line = ([l, r]: Query) => [
      `질의 [${l},${r}]`,
      `M[${r + 1}] = ${cell(M[r + 1] as number)} · M[${l}] = ${cell(M[l] as number)}`,
      `실제 최솟값 ${minOf([l, r])}`,
    ];
    return block([
      `앞 i 칸의 최솟값 M = [${M.map(cell).join(" ")}]`,
      "",
      ...columns([line(pair[0]), line(pair[1])]),
      "    └ 두 질의가 같은 두 칸에서 같은 값을 읽는데 답이 다르다. 두 값만으로 답을 만드는 식은 없다",
    ]);
  },

  /** `deep.build` 설계 선택 — 저장 간격 `B` 를 넷으로 두고 같은 질의 목록에서 잰 값. */
  "cost-block": () => {
    const want = walk().result;
    const results = [1, 2, 3, 6].map((B) => ({
      B,
      ...blockSaved(WALK, WALK_Q, B),
    }));
    const total = (r: (typeof results)[number]) =>
      r.fillAdds + r.queryAdds + r.subs;
    const rows = results.map((r) => [
      `B = ${r.B}`,
      String(r.cells),
      String(r.queryAdds),
      String(total(r)),
    ]);
    const best = results.reduce((m, r) => (total(r) < total(m) ? r : m));
    return withNote(
      md(
        ["저장 간격", "추가 칸", "질의 때 더한 수", "덧셈·뺄셈 합"],
        rows,
        [1, 2, 3],
      ),
      `넷 모두 답이 ${want.join(" ")} 로 정본과 같고, 연산이 가장 적은 것은 B = ${best.B} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력과 기대하는 답. */
  "walk-input": () => {
    const q = WALK_Q.map((x) => `[${x[0]}, ${x[1]}]`).join(", ");
    return [
      `const A = [${WALK.join(", ")}];`,
      `const queries: Array<[number, number]> = [${q}];`,
      `// 이 절이 끝나면 [${walk().result.join(", ")}] 가 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 칸 수와 첫 칸. */
  "walk-init": () => {
    const s = walkSteps()[0];
    const cells = s?.P.map((v) => (v === null ? "·" : String(v))) ?? [];
    return block(
      columns([
        [
          `n = ${WALK.length}`,
          `칸 ${cells.length} 개 (0 … ${cells.length - 1})`,
        ],
        [
          `P = [${cells.join(" ")}]`,
          `P[0] = 0, 나머지 ${cells.length - 1} 칸은 아직 비어 있다`,
        ],
      ]),
    );
  },

  /** `deep.walk` 2 — 채우기 반복만 실행한 뒤의 누적합 배열. */
  "walk-fill": () => {
    const t = walk();
    return block([
      `P = ${show(t.P)}    채운 칸 ${t.P.length} / ${t.P.length} · 덧셈 ${t.fills.length} 번`,
    ]);
  },

  /** `deep.walk.pause` — 누적합 배열을 입력 배열과 같은 길이로 잡으면 어느 질의가 깨지는가. */
  "pause-same-length": () => {
    const bare = walk().result;
    const T = sameLength(WALK);
    const rows = WALK_Q.map((q, i) => {
      const got = sameLengthAnswer(T, q);
      return [
        span(q),
        String(bare[i]),
        String(got),
        bare[i] === got ? "답이 같다" : "값이 아니다",
      ];
    });
    const broken = rows.filter((r) => r[3] === "값이 아니다").length;
    return block([
      ...columns([["질의", "정본", "같은 길이 T", ""], ...rows]),
      "",
      `└ 왼쪽 끝이 0 인 질의 ${broken} 개만 깨진다. 나머지 ${rows.length - broken} 개는 답이 같아서 알아채지 못한다`,
    ]);
  },

  /** `deep.walk` 3 — 첫 질의 하나만 답한 결과. */
  "walk-query-one": () => {
    const t = walk();
    const a = t.answers[0];
    if (!a) throw new Error("질의 기록이 없다");
    return block([
      ...columns([
        [
          "들어올 때",
          `l = ${a.l}  r = ${a.r}`,
          `P 는 ${show(t.P)} 로 다 채워져 있다`,
        ],
        [
          "오른쪽 끝",
          `P[r+1] = P[${a.r + 1}] = ${a.right}`,
          `앞 ${a.r + 1} 칸의 합`,
        ],
        ["왼쪽 끝", `P[l] = P[${a.l}] = ${a.left}`, `앞 ${a.l} 칸의 합`],
        [
          "빼면",
          `${a.right} − ${a.left} = ${a.value}`,
          `답 목록이 [${a.value}] 이 된다`,
        ],
      ]),
      `            └ 구간이 ${a.r - a.l + 1} 칸인데 읽은 칸은 둘이다`,
    ]);
  },

  /** `deep.walk.pause` — 오른쪽 끝을 한 칸 앞에서 읽으면 어떻게 되는가. */
  "pause-right-end": () => {
    const rows = END_CASES.map(([A, q]) => ({
      A,
      q,
      bare: String(prefixSumRangeQuery([...A], [[q[0], q[1]]])[0]),
      mutated: String(
        readLeftOfEnd.prefixSumRangeQuery([...A], [[q[0], q[1]]])[0],
      ),
      last: A[q[1]] as number,
    }));
    assertBreaks(readLeftOfEnd, rows);
    return block([
      ...columns([
        ["입력", "질의", "A[r]", "바른 코드", "P[r] 을 읽은 코드", ""],
        ...rows.map((r) => [
          show(r.A),
          span(r.q),
          String(r.last),
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
      ]),
      "",
      "└ A[r] 이 0 인 입력에서는 P[r] 과 P[r+1] 이 같은 값이라 이 변경을 넣어도 답이 바뀌지 않는다",
    ]);
  },

  /** `deep.walk` 4 — 고정 입력의 걸음 전부. */
  "walk-trace": () => {
    const steps = walkSteps();
    const what = {
      "①": "P 를 채운다",
      "②": "질의를 답한다",
    } as const;
    const rows = steps.map((s) => {
      const readP = s.readP.map((i) => `P[${i}]=${s.P[i]}`);
      const readA = s.readA.map((i) => `A[${i}]=${WALK[i]}`);
      const wrote =
        s.writeP.length > 0
          ? s.writeP.map((i) => `P[${i}] = ${s.P[i]}`).join(", ")
          : s.writeAnswer.map((k) => `답[${k}] = ${s.answers[k]}`).join(", ");
      return [
        s.id,
        s.branch === null ? "P 를 잡고 첫 칸을 넣는다" : what[s.branch],
        s.branch === null ? "—" : (s.title.split(" · ")[0] ?? ""),
        [...readP, ...readA].join(", ") || "—",
        wrote,
        s.branch ?? "루프 진입 전",
      ];
    });
    return md(
      ["걸음", "하는 일", "i 또는 질의", "읽은 칸", "쓴 칸", "갈래"],
      rows,
    );
  },

  /** `deep.walk` 4 — 갈래마다 실행된 걸음과 연산 수. */
  "walk-branches": () => {
    const steps = walkSteps();
    const one = steps.filter((s) => s.branch === "①").map((s) => s.id);
    const two = steps.filter((s) => s.branch === "②").map((s) => s.id);
    return block([
      ...columns([
        ["①", "P 를 채운다", one.join(" "), `덧셈 ${one.length} 번 = n`],
        ["②", "질의를 답한다", two.join(" "), `뺄셈 ${two.length} 번 = q`],
      ]),
      `    └ 합 ${one.length + two.length} 번. 「아이디어를 떠올리는 과정」에서 누적합 배열로 센 값과 같다`,
    ]);
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  "final-calls": () => {
    const calls: [readonly number[], Query[]][] = [
      [WALK, [...WALK_Q]],
      [[1, 2, 3], []],
      [NEGATIVE, [[0, 3]]],
      [[7], [[0, 0]]],
    ];
    return block(
      columns(
        calls.map(([A, q]) => [
          `prefixSumRangeQuery([${A.join(", ")}], [${q.map((x) => `[${x[0]},${x[1]}]`).join(", ")}])`,
          `→  [${prefixSumRangeQuery([...A], qs(q)).join(", ")}]`,
        ]),
      ),
    );
  },

  /** `purpose.fit` — 질의가 적으면 채우는 비용이 오히려 손해다. */
  "fit-boundary": () => {
    const A = new Array<number>(N_MAX).fill(1);
    const len = 10;
    const one: Query[] = [[0, len - 1]];
    const d1 = addEachQuery(A, one).adds;
    const p1 = prefixOps(A, one);
    return withNote(
      md(
        [`질의 (n = ${num(N_MAX)})`, "직접 더하기", "누적합 배열", "구한 방법"],
        [
          [
            `1 개 · 구간 ${len} 칸`,
            num(d1),
            num(p1.adds + p1.subs),
            "실행해서 셌다",
          ],
          [
            `${num(N_MAX)} 개 · 전부 배열 전체`,
            num(N_MAX * N_MAX),
            num(2 * N_MAX),
            "q·n 과 n + q 로 냈다",
          ],
        ],
        [1, 2],
      ),
      "덧셈과 뺄셈만 셉니다. 질의가 하나이고 구간이 짧으면 직접 더하는 쪽이 적습니다.",
    );
  },

  /** `purpose.alt` — 갱신 한 번의 값과 순서가 뒤집히는 자리. */
  "alt-crossing": () => {
    const p = benchCases["누적합 배열"]();
    const f = benchCases["펜윅 트리"]();
    const u = 1024;
    const at = (c: Record<string, number>, k: number) =>
      c[`갱신 ${k} 회 칸 접근`] as number;
    const perP = (at(p, u) - at(p, 0)) / u;
    const perF = (at(f, u) - at(f, 0)) / u;
    const gap = at(f, 0) - at(p, 0);
    const cross = gap / (perP - perF);
    return block(
      columns([
        [
          "누적합 배열의 갱신 하나",
          `(${num(at(p, u))} − ${num(at(p, 0))}) ÷ ${num(u)} = ${num(perP)}`,
          "배열을 통째로 다시 채운다",
        ],
        [
          "펜윅 트리의 갱신 하나",
          `(${num(at(f, u))} − ${num(at(f, 0))}) ÷ ${num(u)} = ${num(perF)}`,
          "덮는 칸만 고친다",
        ],
        [
          "갱신 0 회의 차이",
          `${num(at(f, 0))} − ${num(at(p, 0))} = ${num(gap)}`,
          "누적합 배열이 적은 만큼",
        ],
        [
          "뒤집히는 자리",
          `${num(gap)} ÷ (${num(perP)} − ${num(perF)}) ≈ ${cross.toFixed(2)}`,
          `갱신 ${Math.floor(cross) + 1} 번째에 뒤집힌다`,
        ],
      ]),
    );
  },

  /** `deep.math` ② — 정의를 값에 넣어 본다. */
  "math-check": () => {
    const P = walk().P;
    return block([
      `A 의 값 ${WALK.join(" ")}`,
      "",
      "  P[0] = 0",
      ...range(1, 3).map(
        (i) =>
          `  P[${i}] = P[${i - 1}] + A[${i - 1}] = ${P[i - 1]} + ${WALK[i - 1]} = ${P[i]}`,
      ),
    ]);
  },

  /** `deep.math` ③ — 앞 r+1 칸의 합이 겹치지 않게 둘로 갈린다. */
  "math-split": () => {
    const [l, r] = WALK_Q[4] as Query;
    const whole = sumOf(WALK, 0, r);
    const head = sumOf(WALK, 0, l - 1);
    const tail = sumOf(WALK, l, r);
    return block([
      `l = ${l}, r = ${r}`,
      "",
      ...columns([
        [
          `  k = 0 … ${r} 의 합`,
          `${plus(WALK, 0, r)} = ${whole}`,
          `P[${r + 1}]`,
        ],
        [
          `  k = 0 … ${l - 1} 의 합`,
          `${plus(WALK, 0, l - 1)} = ${head}`,
          `P[${l}]`,
        ],
        [`  k = ${l} … ${r} 의 합`, `${plus(WALK, l, r)} = ${tail}`, ""],
      ]),
      `    └ 앞의 둘이 겹치는 항이 없고 ${whole} = ${head} + ${tail} 이다`,
    ]);
  },

  /** `deep.math` ③ — 유도한 식을 값에 다시 넣는다. */
  "math-apply": () => {
    const P = walk().P;
    const [l, r] = WALK_Q[4] as Query;
    const byFormula = (P[r + 1] as number) - (P[l] as number);
    return block([
      `P[r+1] − P[l] = P[${r + 1}] − P[${l}] = ${P[r + 1]} − ${P[l]} = ${byFormula}`,
      `직접 더한 값    ${plus(WALK, l, r)} = ${sumOf(WALK, l, r)}`,
    ]);
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "cost-scale": () => {
    const sizes = [WALK.length, 100, 1_000];
    const rows = sizes.map((n) => {
      const A = new Array<number>(n).fill(1);
      const queries = fullQueries(n, n);
      const direct = addEachQuery(A, queries).adds;
      const p = prefixOps(A, queries);
      if (direct !== n * n || p.adds + p.subs !== 2 * n) {
        throw new Error(`n = ${n} 에서 실측이 닫힌 형태와 다르다`);
      }
      return [
        num(n),
        num(direct),
        num(n * n),
        num(p.adds + p.subs),
        num(2 * n),
      ];
    });
    rows.push([
      num(N_MAX),
      "(실행하지 않음)",
      num(N_MAX * N_MAX),
      "(실행하지 않음)",
      num(2 * N_MAX),
    ]);
    const ratio = (N_MAX * N_MAX) / (2 * N_MAX);
    return withNote(
      md(
        ["n = q", "직접 더하기(실측)", "q·n", "누적합 배열(실측)", "n + q"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `실측값이 닫힌 형태와 ${sizes.length} 규모에서 정확히 같습니다. n = q = ${num(N_MAX)} 에서 ${num(N_MAX * N_MAX)} 대 ${num(2 * N_MAX)} 이니 ${num(ratio)} 배입니다.`,
    );
  },

  /** `invariant` ② — 반복마다 채운 칸이 정의와 같은가. */
  "invariant-hold": () => {
    const t = walk();
    let checked = 0;
    let bad = 0;
    const rows = t.fills.map((f) => {
      const cells = range(0, f.i + 1);
      const off = cells.filter((k) => t.P[k] !== sumOf(WALK, 0, k - 1)).length;
      checked += cells.length;
      bad += off;
      return [String(f.i), `0 … ${f.i + 1}`, String(cells.length), String(off)];
    });
    return withNote(
      md(
        ["반복 i", "채워진 칸", "정의와 대조한 칸", "어긋난 칸"],
        rows,
        [0, 2, 3],
      ),
      `반복이 끝날 때마다 채워진 칸을 앞 칸들을 직접 더한 값과 대조했습니다. 모두 ${checked} 번 대조했고 어긋난 칸은 ${bad} 개입니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  "invariant-edges": () => {
    const rows = EDGES.map(([name, A, q]) => [
      name,
      show(A),
      q.length === 0 ? "없음" : q.map(span).join(" "),
      `[${prefixSumRangeQuery([...A], qs(q)).join(", ")}]`,
    ]);
    return md(["경우", "입력", "질의", "결과"], rows);
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 누적을 빼면 무엇이 나오는가. */
  "mutant-no-accumulate": () => {
    const bare = walk().result;
    const broken = noAccumulate.prefixSumRangeQuery([...WALK], qs(WALK_Q));
    const rows = WALK_Q.map((q, i) => ({
      q,
      bare: String(bare[i]),
      mutated: String(broken[i]),
    }));
    assertBreaks(noAccumulate, rows);
    const differ = rows.filter((r) => r.bare !== r.mutated).length;
    return block([
      ...columns([
        ["질의", "바른 코드", "누적을 뺀 코드", ""],
        ...rows.map((r) => [
          span(r.q),
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
      ]),
      "",
      `└ ${rows.length} 질의 중 ${differ} 개가 다른 답을 낸다`,
    ]);
  },

  /**
   * `invariant` ③ — 깨진 코드가 채운 배열. 코드 안의 배열은 밖에서 안 보이므로, 질의 `[0, i]` 의 답이
   * `P[i+1] − P[0] = P[i+1]` 인 것을 써서 두 코드에 각각 물어 꺼낸다.
   */
  "mutant-table": () => {
    const probe: Query[] = range(0, WALK.length - 1).map(
      (i) => [0, i] as const,
    );
    const bare = [0, ...prefixSumRangeQuery([...WALK], qs(probe))];
    const broken = [
      0,
      ...noAccumulate.prefixSumRangeQuery([...WALK], qs(probe)),
    ];
    return block([
      ...columns([
        ["바른 P", show(bare), "칸이 앞 몇 칸의 합이다"],
        ["깨진 P", show(broken), "칸이 원소 하나다"],
      ]),
      `    └ 질의 [0,i] 의 답이 P[i+1] 이라, 두 코드에 질의 [0,0] 부터 [0,${WALK.length - 1}] 까지 물어 꺼냈다`,
    ]);
  },

  /** `perf.derive` — 전개의 걸음으로 연산을 센다. */
  "perf-derive": () => {
    const steps = walkSteps();
    const one = steps.filter((s) => s.branch === "①").map((s) => s.id);
    const two = steps.filter((s) => s.branch === "②").map((s) => s.id);
    return block([
      ...columns([
        [
          "덧셈",
          one.join(" "),
          `i 가 0 부터 ${one.length - 1} 까지 한 칸씩 → 정확히 ${one.length} 번 = n`,
        ],
        [
          "뺄셈",
          two.join(" "),
          `질의 하나에 한 번 → 정확히 ${two.length} 번 = q`,
        ],
      ]),
      `    └ 합 ${one.length + two.length} 번. 「아이디어를 떠올리는 과정」에서 누적합 배열로 센 값과 같다`,
    ]);
  },

  /** `perf.bounds` — 제약 규모에서의 총식. */
  "perf-total": () =>
    block([
      `n = q = ${num(N_MAX)} 이면 덧셈·뺄셈이 정확히 ${num(2 * N_MAX)} 번, 누적합 배열은 ${num(N_MAX + 1)} 칸이다`,
    ]),

  /** `perf.worst` — 질의의 모양을 바꿔도 누적합 배열의 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1_000;
    const A = new Array<number>(n).fill(1);
    const shapes: [string, Query[]][] = [
      ["전부 배열 전체", fullQueries(n, n)],
      ["전부 한 칸짜리", range(0, n - 1).map((i) => [i, i] as const)],
      ["길이가 하나씩 늘어남", range(0, n - 1).map((i) => [0, i] as const)],
    ];
    const measured = shapes.map(([name, queries]) => {
      const mean =
        queries.reduce((s, [l, r]) => s + r - l + 1, 0) / queries.length;
      const p = prefixOps(A, queries);
      return {
        name,
        mean,
        direct: addEachQuery(A, queries).adds,
        prefix: p.adds + p.subs,
      };
    });
    const rows = measured.map((m) => [
      m.name,
      num(m.mean),
      num(m.direct),
      num(m.prefix),
    ]);
    const same = new Set(measured.map((m) => m.prefix)).size === 1;
    const longest = measured[0]?.direct ?? 0;
    const shortest = measured[1]?.direct ?? 1;
    return withNote(
      md(
        [
          `질의의 모양 (n = q = ${num(n)})`,
          "평균 구간 길이",
          "직접 더하기",
          "누적합 배열",
        ],
        rows,
        [1, 2, 3],
      ),
      `${same ? "누적합 배열의 열은 세 줄이 모두 같습니다" : "누적합 배열의 열이 갈립니다"}. 직접 더하기는 가장 긴 모양과 가장 짧은 모양이 ${num(longest / shortest)} 배 차이입니다.`,
    );
  },

  /** `selfcheck` — T10 이 읽은 두 칸. */
  "selfcheck-t10": () => {
    const s = walkSteps().find((x) => x.id === "T10");
    const a = walk().answers.find(
      (x) => s?.range?.[0] === x.l && s?.range?.[1] === x.r,
    );
    if (!s || !a) throw new Error("T10 이 없다");
    return block([
      ...columns([
        [
          s.id,
          `l = ${a.l}  r = ${a.r}`,
          `P[${a.r + 1}] = ${a.right}`,
          `P[${a.l}] = ${a.left}`,
          `답 ${a.value}`,
        ],
      ]),
      `      └ 구간이 한 칸인데 읽은 칸이 둘이다. A[${a.l}] 하나를 직접 읽으면 한 칸이다`,
    ]);
  },
};
