/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts prefixSumRangeQuery-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { prefixSumRangeQuery } from "./prefixSumRangeQuery-guide.ref.ts";

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

/** `[3 1 4 1 5 9]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** `[1,3]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const range = ([l, r]: [number, number]): string => `[${l},${r}]`;

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

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [3, 1, 4, 1, 5, 9];

/** 그 입력에 거는 질의 다섯. 양끝이 안쪽인 것 · 배열 전체 · 한 칸 · 왼쪽 끝 0 · 오른쪽 끝 마지막. */
const WALK_Q: [number, number][] = [
  [1, 3],
  [0, 5],
  [4, 4],
  [0, 2],
  [2, 5],
];

/* ────────────────────────── 계측기 ────────────────────────── */

/**
 * 방식 A — 질의마다 구간을 직접 더한다.
 *
 * 세는 것은 **덧셈 수**다. 합을 0 에서 시작해 구간의 값을 하나씩 더하므로 질의 하나가
 * `r − l + 1` 번이다.
 */
function addEachQuery(
  A: number[],
  queries: [number, number][],
): { answers: number[]; perQuery: number[]; adds: number } {
  const answers: number[] = [];
  const perQuery: number[] = [];
  let adds = 0;
  for (const [l, r] of queries) {
    let s = 0;
    let count = 0;
    for (let k = l; k <= r; k++) {
      s += A[k] as number;
      adds++;
      count++;
    }
    answers.push(s);
    perQuery.push(count);
  }
  return { answers, perQuery, adds };
}

/**
 * 방식 B — `B` 칸마다 하나씩만 저장하는 절차. `B = 1` 이면 정본과 같은 누적합 표다.
 *
 * 앞 `k` 개의 합은 저장해 둔 `S[⌊k/B⌋]` 에서 시작해 `k mod B` 개를 더해 만든다. 그래서
 * 질의 하나의 덧셈이 `(l mod B) + ((r+1) mod B)` 이고, `B = 1` 에서 0 이 된다.
 */
function blockTable(
  A: number[],
  queries: [number, number][],
  B: number,
): { answers: number[]; cells: number; adds: number; subs: number } {
  const n = A.length;
  const S: number[] = [0];
  let running = 0;
  let adds = 0;
  for (let i = 0; i < n; i++) {
    running += A[i] as number;
    adds++;
    if ((i + 1) % B === 0) S.push(running);
  }
  const cells = Math.floor(n / B) + 1;

  const upTo = (k: number): number => {
    let s = S[Math.floor(k / B)] as number;
    for (let t = Math.floor(k / B) * B; t < k; t++) {
      s += A[t] as number;
      adds++;
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
  return { answers, cells, adds, subs };
}

/** 누적합 표를 쓰는 절차의 덧셈·뺄셈 수. 질의의 모양과 무관하게 `n + q` 다. */
function prefixOps(A: number[], queries: [number, number][]): number {
  const r = blockTable(A, queries, 1);
  return r.adds + r.subs;
}

/**
 * 표를 **원래 배열과 같은 길이**로 잡는 정의. `T[i]` 가 `A[0..i]` 의 합이라 왼쪽 끝이 0 인
 * 질의가 `T[-1]` 을 읽는다 — 그 칸이 없어서 값이 아닌 것이 나온다.
 */
function sameLengthTable(A: number[], queries: [number, number][]): number[] {
  const n = A.length;
  const T = new Array<number>(n);
  T[0] = A[0] as number;
  for (let i = 1; i < n; i++) T[i] = (T[i - 1] as number) + (A[i] as number);
  return queries.map(([l, r]) => (T[r] as number) - (T[l - 1] as number));
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  prefixSumRangeQuery(A: number[], queries: Array<[number, number]>): number[];
}

const REF = new URL("./prefixSumRangeQuery-guide.ref.ts", import.meta.url)
  .pathname;

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

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: string; mutated: string }[]): void {
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

const SCALE_N = [6, 100, 1_000];

/** 오른쪽 끝을 한 칸 앞에서 읽는 변이를 시험할 입력. 뒤 둘은 오른쪽 끝의 값이 0 이다. */
const END_CASES: [number[], [number, number]][] = [
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

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 계수. */
  "cost-two-ways": () => {
    const a = addEachQuery(WALK, WALK_Q);
    const b = blockTable(WALK, WALK_Q, 1);
    const rows = WALK_Q.map((q, i) => [
      range(q),
      String(a.perQuery[i] ?? 0),
      "1",
    ]);
    return [
      table(["질의", "직접 더하기", "누적합"], rows, ["l", "r", "r"]),
      "",
      `방식 A  질의마다 구간을 직접 더한다      덧셈 ${a.adds} 번 · 전처리 0 번`,
      `방식 B  왼쪽 끝을 0 으로 고정한 합을 저장한다  덧셈 ${b.adds} 번 · 뺄셈 ${b.subs} 번`,
      `        └ 답은 ${JSON.stringify(a.answers)} 로 같고, 질의 하나의 비용이 구간 길이를 따라 늘지 않는다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 모든 질의의 답을 미리 담는 표가 몇 칸인가. */
  "cost-precompute-all": () => {
    const sizes = [6, 100, 1_000, 100_000];
    const rows = sizes.map((n) => [num(n), num((n * (n + 1)) / 2), num(n + 1)]);
    return [
      table(["n", "모든 답을 담는 표", "누적합 표"], rows, ["r", "r", "r"]),
      "",
      "└ 왼쪽은 n 이 열 배가 되면 백 배가 되고, 오른쪽은 열 배가 된다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 저장 단위 `B` 를 넷으로 두고 같은 질의 목록에서 잰 값. */
  "cost-block": () => {
    const rows = [1, 2, 3, 6].map((B) => {
      const r = blockTable(WALK, WALK_Q, B);
      return [
        `B=${B}`,
        String(r.cells),
        String(r.adds - WALK.length),
        String(r.adds + r.subs),
      ];
    });
    return [
      table(["저장 단위", "저장 칸", "질의 덧셈", "덧셈·뺄셈 합"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ B 를 키우면 저장 칸이 줄고 연산이 는다. 답은 넷 다 같다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 표를 배열과 같은 길이로 잡으면 어느 질의가 깨지는가. */
  "pause-same-length": () => {
    const bare = prefixSumRangeQuery(WALK, WALK_Q);
    const same = sameLengthTable(WALK, WALK_Q);
    const rows = WALK_Q.map((q, i) => [
      range(q),
      String(bare[i]),
      String(same[i]),
      bare[i] === same[i] ? "답이 같다" : "값이 아니다",
    ]);
    return [
      table(["질의", "정본", "같은 길이 표", ""], rows, ["l", "r", "r", "l"]),
      "",
      "└ 왼쪽 끝이 0 인 질의 둘만 깨진다. 나머지 셋은 답이 같아서 알아채지 못한다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 오른쪽 끝을 한 칸 앞에서 읽으면 어떻게 되는가. */
  "pause-right-end": () => {
    const rows = END_CASES.map(([A, q]) => {
      const bare = String(prefixSumRangeQuery([...A], [[...q]])[0]);
      const mutated = String(
        readLeftOfEnd.prefixSumRangeQuery([...A], [[...q]])[0],
      );
      return { A, q, bare, mutated };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "질의", "바른 코드", "한 칸 앞을 읽은 코드", ""],
        rows.map((r) => [
          show(r.A),
          range(r.q),
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "l", "r", "r", "l"],
      ),
      "",
      "└ 아래 둘은 오른쪽 끝의 값이 0 이라 답이 같다. 그래서 이 변경이 그대로 남는다",
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 누적을 빼면 무엇이 나오는가. */
  "mutant-no-accumulate": () => {
    const bare = prefixSumRangeQuery(WALK, WALK_Q);
    const broken = noAccumulate.prefixSumRangeQuery(WALK, WALK_Q);
    const rows = WALK_Q.map((q, i) => ({
      q,
      bare: String(bare[i]),
      mutated: String(broken[i]),
    }));
    assertBreaks(rows);
    return [
      table(
        ["질의", "바른 코드", "누적을 뺀 코드", "차이"],
        rows.map((r) => [
          range(r.q),
          r.bare,
          r.mutated,
          String(Number(r.mutated) - Number(r.bare)),
        ]),
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 다섯 질의가 전부 다른 답을 낸다. 표의 칸이 합이 아니라 원소 하나가 됐다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣은 값과 실측값의 대조. */
  "cost-scale": () => {
    const rows = SCALE_N.map((n) => {
      const A = new Array<number>(n).fill(1);
      const queries: [number, number][] = Array.from(
        { length: n },
        () => [0, n - 1] as [number, number],
      );
      const direct = addEachQuery(A, queries).adds;
      const prefix = prefixOps(A, queries);
      return [num(n), num(direct), num(n * n), num(prefix), num(2 * n)];
    });
    const big = 100_000;
    rows.push([
      num(big),
      "(실행하지 않음)",
      num(big * big),
      num(2 * big),
      num(2 * big),
    ]);
    return table(
      ["n = q", "직접 더하기(실측)", "q·n", "누적합(실측)", "n + q"],
      rows,
      ["r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 질의의 모양을 바꿔도 누적합의 연산 수가 그대로인가. */
  "worst-shape": () => {
    const n = 1_000;
    const A = new Array<number>(n).fill(1);
    const shapes: [string, [number, number][]][] = [
      [
        "전부 배열 전체 — 가장 긴 구간",
        Array.from({ length: n }, () => [0, n - 1] as [number, number]),
      ],
      [
        "전부 한 칸짜리",
        Array.from({ length: n }, (_, i) => [i, i] as [number, number]),
      ],
      [
        "길이가 하나씩 늘어나는 구간",
        Array.from({ length: n }, (_, i) => [0, i] as [number, number]),
      ],
    ];
    const rows = shapes.map(([name, queries]) => [
      name,
      num(addEachQuery(A, queries).adds),
      num(prefixOps(A, queries)),
    ]);
    return [
      table(
        [`질의의 모양 (n=${num(n)} · q=${num(n)})`, "직접 더하기", "누적합"],
        rows,
        ["l", "r", "r"],
      ),
      "",
      "└ 오른쪽 열이 세 줄 다 같다. 질의의 모양이 비용을 바꾸지 못한다",
    ].join("\n");
  },
};
