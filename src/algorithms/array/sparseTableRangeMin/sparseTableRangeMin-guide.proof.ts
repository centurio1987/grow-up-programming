/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 견주기 횟수를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만 낸다.
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와 } from "../../../../tools/josa.ts";
import { segmentRun, sparseRun } from "./sparseTableRangeMin-guide.alt.ts";
import { sparseTableRangeMin } from "./sparseTableRangeMin-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. 나눗셈으로 나온 값에만 쓴다. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 초 단위. 0.01 초보다 작으면 자릿수가 다 0 이 되므로 그렇게 적는다. */
const seconds = (x: number): string =>
  x < 0.01 ? "0.01 초 미만" : `${fixed2(x)} 초`;

/** `[0,4]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const range = ([l, r]: [number, number]): string => `[${l},${r}]`;

/** `[5 2 7 4 6 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
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

/** 「자리 셋」 처럼 앞 공백을 달고 돌아오는 수사. */
const 수사 = (n: number): string => {
  const 말 = [
    "영",
    "하나",
    "둘",
    "셋",
    "넷",
    "다섯",
    "여섯",
    "일곱",
    "여덟",
    "아홉",
    "열",
  ];
  return ` ${말[n] ?? num(n)}`;
};

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 배열. 여섯 칸이라 층이 셋이고, 최솟값이 왼쪽 절반에 있다. */
export const WALK: number[] = [5, 2, 7, 4, 6, 3];

/**
 * 그 배열에 거는 질의 다섯.
 *
 * 길이가 2 의 거듭제곱이 아닌 것 둘(겹치는 칸이 생긴다) · 거듭제곱인 것 둘(두 조각이 같은
 * 칸을 가리킨다) · 한 칸짜리 하나로, 이 절차가 답하는 구간의 모양이 다 나온다.
 */
export const WALK_Q: [number, number][] = [
  [0, 4],
  [1, 2],
  [3, 3],
  [0, 5],
  [2, 5],
];

/** 문제가 정한 상한. */
const CONSTRAINT_N = 100_000;

/** 변이 표가 쓰는 작은 입력 열. 뒤쪽은 기존 시험이 쓰던 케이스다. */
const SMALL: [number[], [number, number][]][] = [
  [WALK, WALK_Q],
  [[42], [[0, 0]]],
  [[3, 1], [[0, 1]]],
  [
    [3, 1, 4],
    [
      [0, 2],
      [1, 2],
    ],
  ],
  [
    [3, 1, 4, 1, 5, 9, 2, 6],
    [
      [0, 3],
      [2, 5],
      [4, 7],
    ],
  ],
  [
    [1, 2, 3, 4, 5],
    [
      [0, 4],
      [3, 4],
    ],
  ],
  [[-3, -1, -5, 2], [[0, 3]]],
  [[5, 5, 5, 5], [[1, 2]]],
];

/* ────────────────────────── 계수를 세는 사본 ────────────────────────── */

/** 칸 수 `m` 짜리 구간이 쓰는 층 번호를 정수 연산만으로 적은 표. */
function logTableOf(n: number): number[] {
  const t = new Array<number>(n + 1).fill(0);
  for (let m = 2; m <= n; m++) t[m] = (t[m >> 1] as number) + 1;
  return t;
}

/** 층을 다 쌓은 표. 층 `k` 의 칸 `i` 는 인덱스 구간 `[i, i+2^k−1]` 의 최솟값이다. */
function levelsOf(A: number[]): number[][] {
  const n = A.length;
  const log = logTableOf(n);
  const st: number[][] = [A.slice()];
  for (let k = 1; k <= (log[n] as number); k++) {
    const below = st[k - 1] as number[];
    const w = 1 << k;
    const half = w >> 1;
    const row = new Array<number>(n - w + 1);
    for (let i = 0; i + w <= n; i++) {
      row[i] = Math.min(below[i] as number, below[i + half] as number);
    }
    st.push(row);
  }
  return st;
}

/** 질의마다 구간을 왼쪽부터 차례로 읽는 방식. 세는 것은 **견주기 수**다. */
function scanEachQuery(
  A: number[],
  queries: [number, number][],
): { answers: number[]; perQuery: number[]; compares: number } {
  const answers: number[] = [];
  const perQuery: number[] = [];
  let compares = 0;
  for (const [l, r] of queries) {
    let best = A[l] as number;
    let c = 0;
    for (let i = l + 1; i <= r; i++) {
      c++;
      if ((A[i] as number) < best) best = A[i] as number;
    }
    answers.push(best);
    perQuery.push(c);
    compares += c;
  }
  return { answers, perQuery, compares };
}

/** 층으로 쌓은 표를 쓰는 방식의 견주기 수. 정본과 같은 절차다. */
function tableCompares(
  A: number[],
  queries: [number, number][],
): { build: number; query: number; cells: number } {
  const n = A.length;
  const log = logTableOf(n);
  let build = 0;
  let cells = n;
  for (let k = 1; k <= (log[n] as number); k++) {
    const w = 1 << k;
    build += n - w + 1;
    cells += n - w + 1;
  }
  return { build, query: queries.length, cells };
}

/**
 * 저장하는 길이의 **밑**을 `b` 로 둔 표. `b = 2` 가 이 글의 절차다.
 *
 * 층 `k` 의 칸 하나가 칸 수 `b^k` 짜리 구간을 덮고, 위층 한 칸은 아래층 `b` 칸을 합쳐
 * 만든다. 질의는 `b^k ≤ 길이` 인 가장 큰 `k` 를 골라 조각 `⌈길이 / b^k⌉` 개로 덮는다.
 */
function basePowerTable(
  A: number[],
  queries: [number, number][],
  b: number,
): {
  answers: number[];
  levels: number;
  cells: number;
  build: number;
  maxPieces: number;
} {
  const n = A.length;
  const st: number[][] = [A.slice()];
  let cells = n;
  let build = 0;
  let w = 1;
  while (w * b <= n) {
    const below = st.at(-1) as number[];
    const nextW = w * b;
    const row = new Array<number>(n - nextW + 1);
    for (let i = 0; i + nextW <= n; i++) {
      let best = below[i] as number;
      for (let j = 1; j < b; j++) {
        build++;
        best = Math.min(best, below[i + j * w] as number);
      }
      row[i] = best;
    }
    st.push(row);
    cells += row.length;
    w = nextW;
  }

  const answers: number[] = [];
  let maxPieces = 0;
  for (const [l, r] of queries) {
    const len = r - l + 1;
    let k = 0;
    let size = 1;
    while (size * b <= len) {
      size *= b;
      k++;
    }
    const pieces = Math.ceil(len / size);
    maxPieces = Math.max(maxPieces, pieces);
    const row = st[k] as number[];
    let best = row[l] as number;
    for (let j = 1; j < pieces; j++) {
      const start = j === pieces - 1 ? r - size + 1 : l + j * size;
      best = Math.min(best, row[start] as number);
    }
    answers.push(best);
  }
  return { answers, levels: st.length, cells, build, maxPieces };
}

/** 접두 최솟값 표 — 왼쪽 끝을 0 으로 고정한 최솟값. */
function prefixMin(A: number[]): number[] {
  const out: number[] = [];
  let best = Number.POSITIVE_INFINITY;
  for (const v of A) {
    best = Math.min(best, v);
    out.push(best);
  }
  return out;
}

/** 구간의 값을 정의대로 직접 계산한다. `op` 가 최솟값이면 정답, 합이면 구간 합이다. */
function direct(
  A: number[],
  [l, r]: [number, number],
  op: (a: number, b: number) => number,
): number {
  let acc = A[l] as number;
  for (let i = l + 1; i <= r; i++) acc = op(acc, A[i] as number);
  return acc;
}

/** 같은 표를 `op` 로 만들어 두 조각으로 덮은 값. `op` 가 최솟값이면 정본과 같은 절차다. */
function coverWithTwo(
  A: number[],
  [l, r]: [number, number],
  op: (a: number, b: number) => number,
): { value: number; k: number; left: number; right: number; overlap: number } {
  const n = A.length;
  const log = logTableOf(n);
  const st: number[][] = [A.slice()];
  for (let k = 1; k <= (log[n] as number); k++) {
    const below = st[k - 1] as number[];
    const w = 1 << k;
    const half = w >> 1;
    const row = new Array<number>(n - w + 1);
    for (let i = 0; i + w <= n; i++) {
      row[i] = op(below[i] as number, below[i + half] as number);
    }
    st.push(row);
  }
  const len = r - l + 1;
  const k = log[len] as number;
  const row = st[k] as number[];
  const right = r - (1 << k) + 1;
  return {
    value: op(row[l] as number, row[right] as number),
    k,
    left: l,
    right,
    overlap: 2 * (1 << k) - len,
  };
}

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 층마다 반복하는 범위를 안 줄인 표. 아래층에 없는 칸을 읽어 값이 아닌 것이 들어간다. */
function unguardedLevels(A: number[]): number[][] {
  const n = A.length;
  const log = logTableOf(n);
  const st: number[][] = [A.slice()];
  for (let k = 1; k <= (log[n] as number); k++) {
    const below = st[k - 1] as number[];
    const half = 1 << (k - 1);
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      row.push(Math.min(below[i] as number, below[i + half] as number));
    }
    st.push(row);
  }
  return st;
}

/** 표 하나에 질의를 걸어 답을 낸다. 정본의 질의 절차와 같다. */
function answerFrom(
  st: number[][],
  n: number,
  queries: [number, number][],
): number[] {
  const log = logTableOf(n);
  return queries.map(([l, r]) => {
    const k = log[r - l + 1] as number;
    const row = st[k] as number[];
    return Math.min(row[l] as number, row[r - (1 << k) + 1] as number);
  });
}

/** 세는 사본과 일반화한 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 확인한다. */
function 자기대조(): void {
  const min = (a: number, b: number): number => Math.min(a, b);
  for (const [A, queries] of SMALL) {
    const want = sparseTableRangeMin(
      [...A],
      queries.map((q) => [...q] as [number, number]),
    );
    if (
      JSON.stringify(scanEachQuery(A, queries).answers) !== JSON.stringify(want)
    ) {
      throw new Error("구간을 차례로 읽는 사본이 정본과 다른 답을 낸다");
    }
    if (
      JSON.stringify(answerFrom(levelsOf(A), A.length, queries)) !==
      JSON.stringify(want)
    ) {
      throw new Error("층을 쌓는 사본이 정본과 다른 답을 낸다");
    }
    for (const b of [2, 3, 4, 6]) {
      const got = basePowerTable(A, queries, b).answers;
      if (JSON.stringify(got) !== JSON.stringify(want)) {
        throw new Error(`밑 ${b} 사본이 정본과 다른 답을 낸다`);
      }
    }
    for (const [i, q] of queries.entries()) {
      if (coverWithTwo(A, q, min).value !== want[i]) {
        throw new Error("두 조각으로 덮는 사본이 정본과 다른 답을 낸다");
      }
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./sparseTableRangeMin-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  sparseTableRangeMin(A: number[], queries: Array<[number, number]>): number[];
}

/** 층마다 반복하는 범위를 안 줄이는 사본 — 아래층에 없는 칸을 읽는다. */
const noGuard = await loadMutant<Impl>(REF, {
  swap: [/i \+ width <= n/, "i < n"],
});

/** **불변식을 지키던 줄** 하나 — 오른쪽 조각의 자리를 절반이 아니라 한 칸 옆으로 둔 사본. */
const nextCell = await loadMutant<Impl>(REF, {
  swap: [/below\[i \+ half\] as number/, "below[i + 1] as number"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noGuard.sparseTableRangeMin === sparseTableRangeMin;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
//
// **`noGuard` 는 여기 넣지 않는다** — 답이 어느 입력에서도 안 바뀌는 것이 그 변이의 결론이고,
// 멈춤 하나가 그 사실 자체를 값으로 보인다(`SPEC.md` §3 `deep.walk.pause`).
if (!중화됨) {
  const same = SMALL.every(([A, queries]) => {
    const qs = () => queries.map((q) => [...q] as [number, number]);
    return (
      JSON.stringify(sparseTableRangeMin([...A], qs())) ===
      JSON.stringify(nextCell.sparseTableRangeMin([...A], qs()))
    );
  });
  if (same) {
    throw new Error(
      "한 칸 옆을 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
  // 값을 내는 사본이 변이와 같은 답을 내는지도 확인한다 — 표를 그리는 자리가 그 사본이다.
  for (const [A, queries] of SMALL) {
    const qs = () => queries.map((q) => [...q] as [number, number]);
    const viaCopy = answerFrom(unguardedLevels(A), A.length, queries);
    const viaMutant = noGuard.sparseTableRangeMin([...A], qs());
    if (JSON.stringify(viaCopy) !== JSON.stringify(viaMutant)) {
      throw new Error("범위를 안 줄인 사본이 같은 변이와 다른 답을 낸다");
    }
  }
}

/**
 * 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다.
 *
 * **「지나간 횟수」 열이 있어야 「같다」 가 뜻을 갖는다.** 그 값이 0 이면 변이가 바꾼 자리를
 * 그 입력이 한 번도 지나가지 않은 것이고, 그때의 「같다」 는 변이가 무해하다는 뜻이 아니다.
 */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (A: number[], queries: [number, number][]) => number,
): string {
  const rows = SMALL.map(([A, queries]) => {
    const qs = () => queries.map((q) => [...q] as [number, number]);
    const bare = sparseTableRangeMin([...A], qs());
    const mutated = impl.sparseTableRangeMin([...A], qs());
    const label = A === WALK ? `전개 입력 ${show(A)}` : show(A);
    const same = JSON.stringify(bare) === JSON.stringify(mutated);
    return [
      label,
      num(passes(A, queries)),
      show(bare),
      `[${mutated.join(" ")}]`,
      same ? "같다" : "어긋난다",
    ];
  });
  return table(["입력", passHead, "정본", head, "판정"], rows, [
    "l",
    "r",
    "l",
    "l",
    "l",
  ]);
}

/** 층마다 범위를 줄이는 줄이 실제로 걸러 낸 칸 수 — 그 줄이 값을 한 횟수다. */
function guardedCells(A: number[]): number {
  const n = A.length;
  const log = logTableOf(n);
  let blocked = 0;
  for (let k = 1; k <= (log[n] as number); k++) blocked += (1 << k) - 1;
  return blocked;
}

/** 오른쪽 조각의 자리가 실제로 달라지는 칸 수 — 절반이 한 칸이 아닌 층의 칸 수다. */
function halfNotOneCells(A: number[]): number {
  const n = A.length;
  const log = logTableOf(n);
  let cells = 0;
  for (let k = 2; k <= (log[n] as number); k++) cells += n - (1 << k) + 1;
  return cells;
}

/* ────────────────────────── 블록 ────────────────────────── */

const SCALE = [6, 100, 1_000];

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 질의마다 구간을 차례로 읽으면 제약 규모에서 몇 번인가. */
  "cost-scan": () => {
    const rows = SCALE.map((n) => {
      const A = Array.from({ length: n }, (_, i) => (i * 37) % 101);
      const queries: [number, number][] = Array.from(
        { length: n },
        () => [0, n - 1] as [number, number],
      );
      const measured = scanEachQuery(A, queries).compares;
      return [num(n), num(measured), num(n * (n - 1)), seconds(measured / 1e8)];
    });
    const big = CONSTRAINT_N;
    rows.push([
      num(big),
      "(실행하지 않음)",
      num(big * (big - 1)),
      seconds((big * (big - 1)) / 1e8),
    ]);
    return [
      table(["n = q", "견주기(실측)", "q(n−1)", "초당 1억 번 기준"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 모든 질의가 배열 전체를 묻는 입력이다. 제약 규모에서 1 초 제한을 크게 넘는다",
    ].join("\n");
  },

  /** `deep.build` ③ — 접두 최솟값 두 칸으로는 구간이 정해지지 않는다. */
  "prefix-min-fails": () => {
    const A = WALK;
    const B = [5, 2, 7, 4, 6, 9];
    const q: [number, number] = [2, 5];
    const mA = prefixMin(A);
    const mB = prefixMin(B);
    const min = (x: number, y: number): number => Math.min(x, y);
    const rows = [
      [
        show(A),
        show(mA),
        String(mA[q[0] - 1]),
        String(mA[q[1]]),
        String(direct(A, q, min)),
      ],
      [
        show(B),
        show(mB),
        String(mB[q[0] - 1]),
        String(mB[q[1]]),
        String(direct(B, q, min)),
      ],
    ];
    const sameKeys = mA[q[0] - 1] === mB[q[0] - 1] && mA[q[1]] === mB[q[1]];
    return [
      table(
        ["배열", "접두 최솟값 m", "m[1]", "m[5]", `${range(q)} 의 답`],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      `└ 두 배열이 접두 최솟값 표에서 ${sameKeys ? "같은 값을 갖는데" : "다른 값을 갖는데"} 답은 ${direct(A, q, min)}${과와(String(direct(A, q, min)))} ${direct(B, q, min)} 로 다르다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 계수. */
  "cost-two-ways": () => {
    const a = scanEachQuery(WALK, WALK_Q);
    const t = tableCompares(WALK, WALK_Q);
    const rows = WALK_Q.map((q, i) => [
      range(q),
      String(q[1] - q[0] + 1),
      String(a.perQuery[i] ?? 0),
      "1",
    ]);
    return [
      table(["질의", "구간의 칸 수", "차례로 읽기", "층으로 쌓은 표"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      table(
        ["방식", "무엇을 하는가", "견주기"],
        [
          [
            "방식 A",
            "질의마다 구간을 차례로 읽는다",
            `전처리 0 번 · 질의 ${a.compares} 번`,
          ],
          [
            "방식 B",
            "칸 수 2^k 짜리 조각을 미리 저장한다",
            `전처리 ${t.build} 번 · 질의 ${t.query} 번`,
          ],
        ],
        ["l", "l", "l"],
      ),
      "",
      `└ 답은 ${show(a.answers)} 로 같고, 오른쪽 열이 전부 1 이다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 모든 `(l, r)` 짝의 답을 담으면 칸이 몇 개인가. */
  "cost-precompute-all": () => {
    const sizes = [6, 100, 1_000, CONSTRAINT_N];
    const rows = sizes.map((n) => {
      const K = logTableOf(n)[n] as number;
      let cells = 0;
      for (let k = 0; k <= K; k++) cells += n - (1 << k) + 1;
      return [num(n), num((n * (n + 1)) / 2), num(cells)];
    });
    return [
      table(["n", "모든 짝을 담는 표", "층으로 쌓은 표"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 왼쪽은 n 이 열 배가 되면 백 배가 되고, 오른쪽은 열 배를 조금 넘는다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 저장하는 길이의 밑을 넷으로 두고 잰 값. */
  "cost-base": () => {
    const parts: string[] = [];
    for (const [n, label] of [
      [WALK.length, `n = ${WALK.length} · 질의${수사(WALK_Q.length)} 개`],
      [1_000, "n = 1,000 · 질의 1,000 개"],
    ] as [number, string][]) {
      const A =
        n === WALK.length
          ? WALK
          : Array.from({ length: n }, (_, i) => (i * 37) % 101);
      const queries: [number, number][] =
        n === WALK.length
          ? WALK_Q
          : Array.from({ length: n }, (_, i) => {
              const a = (i * 37) % n;
              const b = (i * 91) % n;
              return (a <= b ? [a, b] : [b, a]) as [number, number];
            });
      const rows = [2, 3, 4, 6].map((b) => {
        const r = basePowerTable(A, queries, b);
        return [
          `b=${b}`,
          String(r.levels),
          num(r.cells),
          num(r.build),
          String(r.maxPieces),
        ];
      });
      parts.push(label);
      parts.push(
        table(
          ["밑", "층 수", "표 칸 수", "표 만들기 견주기", "질의당 조각 수"],
          rows,
          ["l", "r", "r", "r", "r"],
        ),
      );
      parts.push("");
    }
    parts.push(
      "└ 밑을 키우면 표 칸이 줄고 표 만들기 견주기와 조각 수가 는다. 답은 넷 다 같다",
    );
    return parts.join("\n");
  },

  /** `deep.walk.pause` — `Math.log2` 를 내림한 값이 정수 표와 어긋나는 칸 수가 있는가. */
  "pause-log-float": () => {
    const good = logTableOf(CONSTRAINT_N);
    let floatMismatch = 0;
    let defBroken = 0;
    for (let m = 1; m <= CONSTRAINT_N; m++) {
      const k = good[m] as number;
      if (Math.floor(Math.log2(m)) !== k) floatMismatch++;
      if (!(2 ** k <= m && m < 2 ** (k + 1))) defBroken++;
    }
    const sample = [1, 2, 3, 4, 7, 8, 1023, 1024, 65_535, 65_536, CONSTRAINT_N];
    const rows = sample.map((m) => {
      const k = good[m] as number;
      const f = Math.floor(Math.log2(m));
      const ok = 2 ** k <= m && m < 2 ** (k + 1);
      return [
        num(m),
        String(k),
        String(f),
        num(2 ** k),
        num(2 ** (k + 1)),
        k === f && ok ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        ["칸 수 m", "정수 표 k", "log2 를 내림", "2^k", "2^(k+1)", "판정"],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ m 을 1 부터 ${num(CONSTRAINT_N)} 까지 전수로 대조했다 — 두 방식이 어긋난 자리 ${num(floatMismatch)} 개 · 2^k ≤ m < 2^(k+1) 이 깨진 자리 ${num(defBroken)} 개`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 층마다 반복하는 범위를 안 줄이면 표가 어떻게 되는가. */
  "pause-no-guard-levels": () => {
    const good = levelsOf(WALK);
    const bad = unguardedLevels(WALK);
    const rows = good.map((row, k) => [
      `${k} 층`,
      String(row.length),
      show(row),
      String((bad[k] as number[]).length),
      `[${(bad[k] as number[]).join(" ")}]`,
      row.join(" ") === (bad[k] as number[]).join(" ") ? "같다" : "어긋난다",
    ]);
    return [
      table(
        ["층", "칸 수", "범위를 줄인 표", "칸 수", "안 줄인 표", "판정"],
        rows,
        ["l", "r", "l", "r", "l", "l"],
      ),
      "",
      "└ 아래층에 없는 칸을 읽은 자리에 값이 아닌 것이 들어가고, 그것이 위층으로 옮겨 간다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 그런데 그 변이가 질의의 답은 안 바꾼다. */
  "pause-no-guard-answers": () =>
    mutantTable("범위를 안 줄인 판", noGuard, "가드가 막은 칸", (A) =>
      guardedCells(A),
    ),

  /** `deep.walk.pause` — 그 대신 표가 얼마나 커지는가. */
  "pause-no-guard-cells": () => {
    const rows = [6, 1_000, CONSTRAINT_N].map((n) => {
      const K = logTableOf(n)[n] as number;
      let guarded = 0;
      for (let k = 0; k <= K; k++) guarded += n - (1 << k) + 1;
      const unguarded = n * (K + 1);
      return [
        num(n),
        String(K + 1),
        num(guarded),
        num(unguarded),
        num(unguarded - guarded),
        `${fixed2(((unguarded - guarded) * 8) / 1024 / 1024)} MiB`,
      ];
    });
    return [
      table(
        [
          "n",
          "층 수",
          "범위를 줄인 칸",
          "안 줄인 칸",
          "값이 아닌 칸",
          "그만큼의 메모리",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 답은 그대로인데 표에 값이 아닌 칸이 그만큼 쌓인다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 겹친 칸을 두 번 세도 최솟값은 안 바뀐다. */
  "pause-overlap": () => {
    const min = (a: number, b: number): number => Math.min(a, b);
    const add = (a: number, b: number): number => a + b;
    const minRows = WALK_Q.map((q) => {
      const c = coverWithTwo(WALK, q, min);
      const truth = direct(WALK, q, min);
      return [
        range(q),
        String(c.k),
        `${range([c.left, c.left + (1 << c.k) - 1])} ${range([c.right, c.right + (1 << c.k) - 1])}`,
        String(c.overlap),
        String(truth),
        String(c.value),
        truth === c.value ? "같다" : "어긋난다",
      ];
    });
    const sumRows = WALK_Q.map((q) => {
      const c = coverWithTwo(WALK, q, add);
      const truth = direct(WALK, q, add);
      return [
        range(q),
        String(c.overlap),
        String(truth),
        String(c.value),
        truth === c.value ? "같다" : "어긋난다",
      ];
    });
    const overlaps = WALK_Q.map((q) => coverWithTwo(WALK, q, min).overlap);
    return [
      "같은 표를 최솟값으로 만들었을 때",
      table(
        [
          "질의",
          "층 k",
          "두 조각",
          "겹친 칸",
          "구간의 최솟값",
          "두 조각의 최솟값",
          "판정",
        ],
        minRows,
        ["l", "r", "l", "r", "r", "r", "l"],
      ),
      "",
      "같은 표를 합으로 만들었을 때",
      table(["질의", "겹친 칸", "구간의 합", "두 조각의 합", "판정"], sumRows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 겹친 칸이 가장 적은 질의에서도 ${Math.min(...overlaps)} 칸이라, 합으로 만든 표는 다섯 질의가 전부 어긋난다`,
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 오른쪽 조각의 자리를 한 칸 옆으로 두면. */
  "mutant-next-cell": () =>
    mutantTable("한 칸 옆을 읽은 판", nextCell, "절반이 1 이 아닌 칸", (A) =>
      halfNotOneCells(A),
    ),

  /** `invariant` ② — 층마다 칸이 실제로 그 구간의 최솟값인가. */
  "invariant-levels": () => {
    const st = levelsOf(WALK);
    const rows: string[][] = [];
    let checked = 0;
    let wrong = 0;
    const min = (a: number, b: number): number => Math.min(a, b);
    for (const [k, row] of st.entries()) {
      let bad = 0;
      for (const [i, v] of row.entries()) {
        const truth = direct(WALK, [i, i + (1 << k) - 1], min);
        checked++;
        if (truth !== v) {
          wrong++;
          bad++;
        }
      }
      rows.push([
        `${k} 층`,
        String(row.length),
        show(row),
        String(1 << k),
        String(row.length),
        String(bad),
      ]);
    }
    return [
      table(
        ["층", "칸 수", "칸의 값", "덮는 칸 수", "확인한 칸", "어긋난 칸"],
        rows,
        ["l", "r", "l", "r", "r", "r"],
      ),
      "",
      `└ 정의를 직접 계산한 값과 표의 값을 ${num(checked)} 칸에서 대조했고 어긋난 칸이 ${num(wrong)} 개다`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  "invariant-edges": () => {
    const cases: [string, number[], [number, number][]][] = [
      ["질의 목록이 빔", [1, 2, 3], []],
      ["원소 하나", [42], [[0, 0]]],
      ["한 칸짜리 질의", WALK, [[3, 3]]],
      ["배열 전체", WALK, [[0, 5]]],
      ["값이 전부 같음", [5, 5, 5, 5], [[1, 2]]],
      ["음수가 섞임", [-3, -1, -5, 2], [[0, 3]]],
      [
        "같은 질의를 두 번",
        WALK,
        [
          [0, 4],
          [0, 4],
        ],
      ],
    ];
    const rows = cases.map(([name, A, queries]) => {
      const got = sparseTableRangeMin(
        [...A],
        queries.map((q) => [...q] as [number, number]),
      );
      const want = queries.map((q) => direct(A, q, (x, y) => Math.min(x, y)));
      return [
        name,
        show(A),
        queries.length === 0 ? "없음" : queries.map(range).join(" "),
        show(got),
        JSON.stringify(got) === JSON.stringify(want) ? "같다" : "어긋난다",
      ];
    });
    return [
      table(["경계", "배열", "질의", "답", "정의를 직접 계산한 값과"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `└${수사(rows.length)} 줄 다 정의를 직접 계산한 값과 같다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 칸 수의 닫힌 형태에 제약 규모를 넣은 값과 실측의 대조. */
  "math-cells": () => {
    const rows = [6, 1_000, CONSTRAINT_N].map((n) => {
      const K = logTableOf(n)[n] as number;
      let measured = 0;
      for (let k = 0; k <= K; k++) measured += n - (1 << k) + 1;
      const closed = (K + 1) * (n + 1) - (2 ** (K + 1) - 1);
      const bytes = measured * 8;
      return [
        num(n),
        String(K + 1),
        num(closed),
        num(measured),
        `${fixed2(bytes / 1024 / 1024)} MiB`,
        num(n * (K + 1)),
      ];
    });
    return [
      table(
        [
          "n",
          "층 수",
          "닫힌 형태",
          "실측 칸 수",
          "8 바이트 기준",
          "n(⌊log₂n⌋+1)",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 닫힌 형태와 실측이 세 규모에서 같다. 오른쪽 끝은 층마다 칸을 안 줄였을 때의 값이다",
    ].join("\n");
  },

  /** `perf.derive` — 제약 규모에서 견주기가 몇 번인가. 닫힌 형태와 실측을 나란히 둔다. */
  "perf-scale": () => {
    const rows = [6, 1_000, 100_000].map((n) => {
      const K = logTableOf(n)[n] as number;
      let build = 0;
      for (let k = 1; k <= K; k++) build += n - (1 << k) + 1;
      const closed = K * (n + 1) - (2 ** (K + 1) - 2);
      return [
        num(n),
        num(build),
        num(closed),
        num(n),
        num(build + n),
        num(n * (n - 1)),
      ];
    });
    return [
      table(
        [
          "n = q",
          "표 만들기(실측)",
          "K(n+1) − (2^(K+1) − 2)",
          "질의",
          "견주기 합",
          "차례로 읽기 최악",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 닫힌 형태와 실측이 세 규모에서 같다. 오른쪽 끝은 같은 규모에서 질의마다 구간을 차례로 읽었을 때의 값이다",
    ].join("\n");
  },

  /** `perf.worst` — 배열의 모양을 바꿔도 견주기 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1_000;
    const queries: [number, number][] = Array.from({ length: n }, (_, i) => {
      const a = (i * 37) % n;
      const b = (i * 91) % n;
      return (a <= b ? [a, b] : [b, a]) as [number, number];
    });
    const shapes: [string, number[]][] = [
      ["값이 전부 같음", new Array<number>(n).fill(7)],
      ["오름차순", Array.from({ length: n }, (_, i) => i)],
      ["내림차순", Array.from({ length: n }, (_, i) => n - i)],
      [
        "최솟값이 맨 앞",
        Array.from({ length: n }, (_, i) => (i === 0 ? -1 : i)),
      ],
      [
        "최솟값이 맨 뒤",
        Array.from({ length: n }, (_, i) => (i === n - 1 ? -1 : i)),
      ],
      [
        "생성식 (37i) mod 101",
        Array.from({ length: n }, (_, i) => (i * 37) % 101),
      ],
    ];
    const rows = shapes.map(([name, A]) => {
      const t = tableCompares(A, queries);
      return [
        name,
        num(scanEachQuery(A, queries).compares),
        num(t.build),
        num(t.query),
        num(t.build + t.query),
      ];
    });
    const base = Array.from({ length: n }, (_, i) => (i * 37) % 101);
    const shapesQ: [string, [number, number][]][] = [
      [
        "전부 배열 전체",
        Array.from({ length: n }, () => [0, n - 1] as [number, number]),
      ],
      [
        "전부 한 칸짜리",
        Array.from({ length: n }, (_, i) => [i, i] as [number, number]),
      ],
      [
        "길이가 하나씩 늘어남",
        Array.from({ length: n }, (_, i) => [0, i] as [number, number]),
      ],
    ];
    const rowsQ = shapesQ.map(([name, qs]) => {
      const t = tableCompares(base, qs);
      return [
        name,
        num(scanEachQuery(base, qs).compares),
        num(t.build),
        num(t.query),
        num(t.build + t.query),
      ];
    });
    return [
      `배열의 모양을 바꾼다 (n=${num(n)} · q=${num(n)} · 질의는 생성식으로 고정)`,
      table(
        ["배열의 모양", "차례로 읽기", "표 만들기", "질의", "표 방식 합"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `질의의 모양을 바꾼다 (n=${num(n)} · q=${num(n)} · 배열은 생성식으로 고정)`,
      table(
        ["질의의 모양", "차례로 읽기", "표 만들기", "질의", "표 방식 합"],
        rowsQ,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `└ 표 방식의 세 열은${수사(rows.length + rowsQ.length)} 줄이 전부 같다. 차례로 읽기만 ${num(Math.min(...rowsQ.map((r) => Number((r[1] ?? "0").replaceAll(",", "")))))} 에서 ${num(Math.max(...rowsQ.map((r) => Number((r[1] ?? "0").replaceAll(",", "")))))} 까지 갈린다`,
    ].join("\n");
  },

  /** `perf.worst` — n 을 키우면 메모리가 먼저 막히는가. */
  "worst-memory": () => {
    const rows = [CONSTRAINT_N, 1_000_000, 10_000_000].map((n) => {
      const K = Math.floor(Math.log2(n));
      let cells = 0;
      for (let k = 0; k <= K; k++) cells += n - 2 ** k + 1;
      const mib = (cells * 8) / 1024 / 1024;
      return [
        num(n),
        String(K + 1),
        num(cells),
        mib >= 1024 ? `${fixed2(mib / 1024)} GiB` : `${fixed2(mib)} MiB`,
        mib * 1024 * 1024 <= 256 * 1000 * 1000 ? "제한 안이다" : "제한 밖이다",
      ];
    });
    return [
      table(["n", "층 수", "표 칸 수", "8 바이트 기준", "256 MB 제한"], rows, [
        "r",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 이 문제의 제약은 첫 줄이라 걱정할 자리가 아니다",
    ].join("\n");
  },

  /** `purpose.alt` — 경계가 그 자리인 이유. */
  "alt-boundary": () => {
    const q = 8_192;
    const s0 = sparseRun(0, 0).accesses;
    const g0 = segmentRun(0, 0).accesses;
    const s = sparseRun(q, 0).accesses;
    const g = segmentRun(q, 0).accesses;
    const s1 = sparseRun(q, 1).accesses;
    const g1 = segmentRun(q, 1).accesses;
    const perS = (s - s0) / q;
    const perG = (g - g0) / q;
    const rows = [
      ["표 만들기", num(s0), num(g0), num(s0 - g0)],
      ["질의 하나 평균", fixed2(perS), fixed2(perG), fixed2(perS - perG)],
      ["갱신 하나", num(s1 - s), num(g1 - g), num(s1 - s - (g1 - g))],
    ];
    return [
      table(
        ["무엇", "스파스 테이블", "세그먼트 트리", "스파스 − 세그먼트"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `└ 표 만들기에서 ${num(s0 - g0)} 번을 더 쓰고 질의 하나에서 ${fixed2(perG - perS)} 번을 덜 쓴다. ${num(s0 - g0)} ÷ ${fixed2(perG - perS)} = ${fixed2((s0 - g0) / (perG - perS))} 이고 실측 경계는 ${num(6995)} 이다`,
    ].join("\n");
  },
};
