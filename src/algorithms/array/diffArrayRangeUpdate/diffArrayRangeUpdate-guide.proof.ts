/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts diffArrayRangeUpdate-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { diffArrayRangeUpdate } from "./diffArrayRangeUpdate-guide.ref.ts";

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
 * 갱신 셋이 서로 겹치고, 더하는 값이 하나는 음수이며, 마지막 갱신의 오른쪽 끝이 `N−1` 이라
 * 여분 칸에 취소를 적는 자리가 실제로 실행된다. 어느 갱신도 덮지 않는 칸도 하나 있다.
 */
const WALK_N = 7;
const WALK_UPDATES: [number, number, number][] = [
  [1, 3, 2],
  [0, 2, -1],
  [5, 6, 3],
];

/** 갱신 하나를 `(l,r,v)` 로 적는다. 표의 첫 열에 그대로 들어간다. */
const showUpdate = ([l, r, v]: [number, number, number]): string =>
  `(${l},${r},${v})`;

/* ────────────────────────── 계측기 ────────────────────────── */

/** 두 배열이 서로 다른 칸의 개수. 「깨진다」를 값으로 적는 자리에서 쓴다. */
function mismatches(a: number[], b: number[]): number {
  let n = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) n++;
  }
  return n;
}

/**
 * 구간을 통째로 순회하는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고, 배열 접근 수를
 * 함께 센다 — 초기화 `N` 번 쓰기 + 갱신마다 덮는 칸을 읽고 쓴다.
 */
function byScanning(
  N: number,
  updates: [number, number, number][],
): { A: number[]; accesses: number; cells: number } {
  const A = new Array<number>(N).fill(0);
  let accesses = N;
  let cells = 0;
  for (const [l, r, v] of updates) {
    for (let i = l; i <= r; i++) {
      accesses += 2;
      cells++;
      A[i] = (A[i] as number) + v;
    }
  }
  return { A, accesses, cells };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 초기화 `N+1` 번 쓰기 + 갱신마다 네 번(경계 두 칸을
 * 읽고 쓴다) + 복원마다 두 번(`D[i]` 읽기 · `A[i]` 쓰기)이다.
 */
function byDifference(
  N: number,
  updates: [number, number, number][],
): { A: number[]; accesses: number; cells: number } {
  const D = new Array<number>(N + 1).fill(0);
  let accesses = N + 1;
  let cells = 0;
  for (const [l, r, v] of updates) {
    accesses += 4;
    cells += 2;
    D[l] = (D[l] as number) + v;
    D[r + 1] = (D[r + 1] as number) - v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    accesses += 2;
    running += D[i] as number;
    A[i] = running;
  }
  return { A, accesses, cells };
}

/**
 * 가장 단순한 후보 — **시작 칸에만 `+v` 를 적고 취소를 적지 않는** 절차.
 *
 * 경계를 하나만 두면 구간이 끝난 자리를 아무도 알려 주지 않아, 더한 값이 배열의 마지막
 * 칸까지 그대로 이어진다.
 */
function startOnly(N: number, updates: [number, number, number][]): number[] {
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, , v] of updates) {
    D[l] = (D[l] as number) + v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += D[i] as number;
    A[i] = running;
  }
  return A;
}

/**
 * 취소를 `r + offset` 에 적는 절차. `offset` 을 0·1·2 로 두고 어느 값이 정의와 맞는지
 * 값으로 고른다. 배열은 `r + offset` 까지 담을 수 있게 넉넉히 잡는다.
 */
function cancelAt(
  N: number,
  updates: [number, number, number][],
  offset: number,
): { A: number[]; needed: number } {
  let needed = N;
  for (const [, r] of updates) needed = Math.max(needed, r + offset + 1);
  const D = new Array<number>(needed).fill(0);
  for (const [l, r, v] of updates) {
    D[l] = (D[l] as number) + v;
    D[r + offset] = (D[r + offset] as number) - v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += D[i] as number;
    A[i] = running;
  }
  return { A, needed };
}

/**
 * 복원 루프의 두 줄 순서를 바꾼 사본. 두 줄의 자리를 맞바꾼 것이라 `loadMutant`(한 줄 치환)
 * 로는 만들 수 없어 여기 따로 적는다. 나머지는 정본과 같다.
 */
function writeBeforeAdd(
  N: number,
  updates: [number, number, number][],
): number[] {
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of updates) {
    D[l] = (D[l] as number) + v;
    D[r + 1] = (D[r + 1] as number) - v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    A[i] = running;
    running += D[i] as number;
  }
  return A;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  diffArrayRangeUpdate(
    N: number,
    updates: Array<[number, number, number]>,
  ): number[];
}

const REF = new URL("./diffArrayRangeUpdate-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 취소를 구간의 오른쪽 끝 그 칸에 적는 사본.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const cancelOnR = await loadMutant<Impl>(REF, {
  swap: [
    /D\[r \+ 1\] = \(D\[r \+ 1\] as number\) - v;/,
    "D[r] = (D[r] as number) - v;",
  ],
});

/** 누적하지 않고 그 칸의 값만 그대로 옮기는 사본. 불변식을 지키던 줄 하나가 그 대상이다. */
const noAccumulate = await loadMutant<Impl>(REF, {
  swap: [/running \+= D\[i\] as number;/, "running = D[i] as number;"],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { gap: number }[]): void {
  if (rows.every((r) => r.gap === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(
  N: number,
  updates: [number, number, number][],
  got: number[],
): number[] {
  const want = diffArrayRangeUpdate(N, [...updates]);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(
      `계측기와 정본의 답이 다르다 — 계측 ${show(got)} ≠ 정본 ${show(want)}`,
    );
  }
  return got;
}

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  N: number;
  updates: [number, number, number][];
}

/** 전개 입력과, 답이 안 바뀌는 자리를 함께 담은 목록. */
const START_ONLY_CASES: Case[] = [
  { name: "N=7 · 전개 입력", N: WALK_N, updates: WALK_UPDATES },
  { name: "N=5 · (0,2,3)", N: 5, updates: [[0, 2, 3]] },
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  {
    name: "N=6 · (1,2,4)(4,5,1)",
    N: 6,
    updates: [
      [1, 2, 4],
      [4, 5, 1],
    ],
  },
];

const CANCEL_R_CASES: Case[] = [
  { name: "N=7 · 전개 입력", N: WALK_N, updates: WALK_UPDATES },
  { name: "N=5 · (2,2,7)", N: 5, updates: [[2, 2, 7]] },
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
  { name: "N=3 · (0,2,0)", N: 3, updates: [[0, 2, 0]] },
];

const WRITE_FIRST_CASES: Case[] = [
  { name: "N=7 · 전개 입력", N: WALK_N, updates: WALK_UPDATES },
  { name: "N=1 · (0,0,5)", N: 1, updates: [[0, 0, 5]] },
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
];

const ACCUMULATE_CASES: Case[] = [
  { name: "N=7 · 전개 입력", N: WALK_N, updates: WALK_UPDATES },
  { name: "N=5 · (2,2,7)", N: 5, updates: [[2, 2, 7]] },
  { name: "N=1 · (0,0,5)", N: 1, updates: [[0, 0, 5]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 64, 1000, 4000];

/** 제약의 최댓값. 여기서는 구간 순회를 실행하지 않고 닫힌 형태에 값만 넣는다. */
const LIMIT = 100_000;

/** 최악을 만드는 입력을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

function fullRange(N: number, Q: number): [number, number, number][] {
  return Array.from(
    { length: Q },
    (_, k) => [0, N - 1, (k % 7) + 1] as [number, number, number],
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 갱신 목록을 두 방식으로 처리했을 때 건드린 칸 수. */
  "cost-two-ways": () => {
    const scan = byScanning(WALK_N, WALK_UPDATES);
    const diff = byDifference(WALK_N, WALK_UPDATES);
    assertSame(WALK_N, WALK_UPDATES, scan.A);
    assertSame(WALK_N, WALK_UPDATES, diff.A);
    const rows = WALK_UPDATES.map((u) => {
      const [l, r] = u;
      return [
        showUpdate(u),
        String(r - l + 1),
        String(r - l + 1),
        String(diff.cells / WALK_UPDATES.length),
      ];
    });
    rows.push([
      "합계",
      String(scan.cells),
      String(scan.cells),
      String(diff.cells),
    ]);
    const big = fullRange(LIMIT, LIMIT);
    const bigScan = big.reduce((s, [l, r]) => s + (r - l + 1), 0);
    return [
      table(
        [
          "갱신",
          "덮는 칸 수",
          "구간 순회가 건드린 칸",
          "경계만 적을 때 건드린 칸",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `제약 규모 N = Q = ${num(LIMIT)} 이고 모든 갱신이 배열 전체를 덮으면`,
      `  구간 순회      ${num(bigScan)} 칸`,
      `  경계만 적기    ${num(2 * big.length)} 칸`,
      "  └ 왼쪽은 구간 길이를 따라 늘고, 오른쪽은 갱신 개수만 따라 늘어난다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 경계를 하나만 두는 후보가 어디서 어긋나는가. */
  "cost-start-only": () => {
    const rows = START_ONLY_CASES.map((c) => {
      const bare = diffArrayRangeUpdate(c.N, [...c.updates]);
      const only = startOnly(c.N, c.updates);
      return [c.name, show(bare), show(only), String(mismatches(bare, only))];
    });
    return [
      table(
        ["입력", "정본이 낸 배열", "시작 칸에만 적은 배열", "어긋난 칸"],
        rows,
        ["l", "l", "l", "r"],
      ),
      "",
      "└ 셋째 줄은 구간이 배열의 마지막 칸까지 덮어서 어긋날 자리가 없다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 취소를 적는 자리를 세 값으로 두고 결과를 대조한다. */
  "cost-cancel-offset": () => {
    const bare = diffArrayRangeUpdate(WALK_N, [...WALK_UPDATES]);
    const rows = [0, 1, 2].map((offset) => {
      const got = cancelAt(WALK_N, WALK_UPDATES, offset);
      return [
        `r + ${offset}`,
        String(got.needed),
        show(got.A),
        String(mismatches(bare, got.A)),
      ];
    });
    return [
      table(
        ["취소를 적는 칸", "필요한 D 칸 수", "낸 배열", "어긋난 칸"],
        rows,
        ["l", "r", "l", "r"],
      ),
      "",
      `정본이 낸 배열   ${show(bare)}`,
      "└ 어긋난 칸이 0 인 것은 r + 1 하나다. r + 0 은 오른쪽 끝 칸을 빼먹고, r + 2 는 한 칸을 더 덮는다",
    ].join("\n");
  },

  /** `deep.walk.step` — 갱신 셋을 경계 칸에 적는 동안의 D 상태값. */
  "walk-record": () => {
    const D = new Array<number>(WALK_N + 1).fill(0);
    const rows: string[][] = [];
    for (const [index, u] of WALK_UPDATES.entries()) {
      const [l, r, v] = u;
      D[l] = (D[l] as number) + v;
      D[r + 1] = (D[r + 1] as number) - v;
      rows.push([
        `T${index + 2}`,
        showUpdate(u),
        `D[${l}] += ${v}`,
        `D[${r + 1}] -= ${v}`,
        show(D),
      ]);
    }
    return [
      table(
        ["걸음", "갱신", "시작 이벤트", "취소 이벤트", "기록 뒤의 D"],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      `└ 갱신 ${WALK_UPDATES.length} 개가 경계 ${2 * WALK_UPDATES.length} 칸으로 압축됐고, 결과 배열은 아직 한 칸도 만들지 않았다`,
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 복원한 걸음별 상태값. */
  "walk-trace": () => {
    const D = new Array<number>(WALK_N + 1).fill(0);
    for (const [l, r, v] of WALK_UPDATES) {
      D[l] = (D[l] as number) + v;
      D[r + 1] = (D[r + 1] as number) - v;
    }
    const A: number[] = [];
    let running = 0;
    const rows: string[][] = [];
    for (let i = 0; i < WALK_N; i++) {
      running += D[i] as number;
      A.push(running);
      rows.push([
        `T${i + 6}`,
        String(i),
        String(D[i] ?? 0),
        String(running),
        show(A),
      ]);
    }
    assertSame(WALK_N, WALK_UPDATES, A);
    return [
      table(["걸음", "i", "D[i]", "running", "A 지금까지"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ running 이 그대로 A[i] 이고, 마지막 줄 ${show(A)} 가 반환값이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 취소를 구간의 오른쪽 끝 그 칸에 적으면 무엇이 달라지는가. */
  "pause-cancel-at-r": () => {
    const rows = CANCEL_R_CASES.map((c) => {
      const bare = diffArrayRangeUpdate(c.N, [...c.updates]);
      const mutated = cancelOnR.diffArrayRangeUpdate(c.N, [...c.updates]);
      return { c, bare, mutated, gap: mismatches(bare, mutated) };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "정본이 낸 배열", "취소를 r 에 적은 배열", "어긋난 칸"],
        rows.map((r) => [
          r.c.name,
          show(r.bare),
          show(r.mutated),
          String(r.gap),
        ]),
        ["l", "l", "l", "r"],
      ),
      "",
      "└ 아래 두 줄은 더한 값이 없어서 어긋날 자리도 없다. 값을 더하는 갱신이 하나라도 있으면 오른쪽 끝 칸이 어긋난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 복원 루프의 두 줄 순서를 바꾸면 무엇이 달라지는가. */
  "pause-write-first": () => {
    const rows = WRITE_FIRST_CASES.map((c) => {
      const bare = diffArrayRangeUpdate(c.N, [...c.updates]);
      const mutated = writeBeforeAdd(c.N, c.updates);
      return { c, bare, mutated, gap: mismatches(bare, mutated) };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "길이", "정본이 낸 배열", "순서를 바꾼 배열", "어긋난 칸"],
        rows.map((r) => [
          r.c.name,
          `${r.bare.length} 대 ${r.mutated.length}`,
          show(r.bare),
          show(r.mutated),
          String(r.gap),
        ]),
        ["l", "l", "l", "l", "r"],
      ),
      "",
      "└ 길이는 네 줄 다 같다. 값이 한 칸씩 뒤로 옮겨지고 앞에 0 이 하나 들어간다",
    ].join("\n");
  },

  /** `invariant` ③ — 누적하던 줄에서 그 칸의 값만 옮기면 무엇이 나오는가. */
  "mutant-no-accumulate": () => {
    const rows = ACCUMULATE_CASES.map((c) => {
      const bare = diffArrayRangeUpdate(c.N, [...c.updates]);
      const mutated = noAccumulate.diffArrayRangeUpdate(c.N, [...c.updates]);
      return { c, bare, mutated, gap: mismatches(bare, mutated) };
    });
    assertBreaks(rows);
    return [
      table(
        ["입력", "정본이 낸 배열", "누적하지 않은 배열", "어긋난 칸"],
        rows.map((r) => [
          r.c.name,
          show(r.bare),
          show(r.mutated),
          String(r.gap),
        ]),
        ["l", "l", "l", "r"],
      ),
      "",
      "└ 칸이 하나뿐이거나 갱신이 없으면 누적할 것이 없어서 답이 같다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const updates = fullRange(n, n);
      const scan = byScanning(n, updates);
      const diff = byDifference(n, updates);
      assertSame(n, updates, diff.A);
      return [
        num(n),
        num(scan.accesses),
        num(n + 2 * n * n),
        num(diff.accesses),
        num(3 * n + 4 * n + 1),
      ];
    });
    // 앞 칸 폭을 값에서 재서 맞춘다. 구분 공백을 고정으로 박으면 뒤 칸이 계단으로 밀린다.
    const atLimit: [string, string][] = [
      ["N + 2NQ", num(LIMIT + 2 * LIMIT * LIMIT)],
      ["3N + 4Q + 1", num(7 * LIMIT + 1)],
      [
        "두 값의 비",
        `${num(Math.round((LIMIT + 2 * LIMIT * LIMIT) / (7 * LIMIT + 1)))} 배`,
      ],
    ];
    const atLimitWidth = Math.max(...atLimit.map(([label]) => width(label)));
    return [
      table(
        [
          "N = Q",
          "구간 순회(실측)",
          "N + 2NQ",
          "차분 배열(실측)",
          "3N + 4Q + 1",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모(N = Q = ${num(LIMIT)})를 두 식에 넣으면`,
      ...atLimit.map(
        ([label, value]) => `  ${padRight(label, atLimitWidth)}  ${value}`,
      ),
    ].join("\n");
  },

  /** `perf.worst` — 갱신 구간의 길이를 바꿔도 차분 배열의 접근 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, [number, number, number][]][] = [
      ["갱신이 전부 배열 전체를 덮는다", fullRange(n, n)],
      [
        "갱신이 전부 칸 하나짜리다",
        Array.from(
          { length: n },
          (_, k) => [k % n, k % n, (k % 7) + 1] as [number, number, number],
        ),
      ],
      [
        "구간 길이가 1 부터 64 까지 섞인다",
        Array.from({ length: n }, (_, k) => {
          const l = (k * 37) % n;
          return [l, Math.min(n - 1, l + (k % 64)), (k % 7) + 1] as [
            number,
            number,
            number,
          ];
        }),
      ],
    ];
    const rows = shapes.map(([name, updates]) => {
      const scan = byScanning(n, updates);
      const diff = byDifference(n, updates);
      assertSame(n, updates, diff.A);
      return [name, num(scan.cells), num(scan.accesses), num(diff.accesses)];
    });
    return [
      table(
        [
          `입력의 모양 (N = Q = ${num(n)})`,
          "덮는 칸의 합",
          "구간 순회 접근 수",
          "차분 배열 접근 수",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 왼쪽 두 열은 세 줄이 다 다르고, 오른쪽 열은 세 줄이 같다",
    ].join("\n");
  },
};
