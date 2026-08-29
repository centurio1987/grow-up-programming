/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts maxCounters-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { maxCounters } from "./maxCounters-guide.ref.ts";

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

/** `[3 2 2 4 2]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

const same = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

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

/* ────────────────────────── 계측기 ────────────────────────── */

/**
 * 세는 것을 한 자리에서 정한다.
 *
 * - **칸 쓰기** — 카운터 배열의 한 칸에 값을 적은 횟수. 증가 연산은 어느 경우에도 칸 하나다.
 * - **칸 읽기** — 카운터 배열의 한 칸을 읽은 횟수. 증가 연산은 칸 하나를 읽고, 마지막
 *   채우기는 `N` 칸을 전부 읽는다.
 */
interface Counted {
  out: number[];
  writes: number;
  reads: number;
}

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK_N = 5;
const WALK: number[] = [3, 4, 4, 6, 1, 4, 4];

/** 최대 맞추기가 여러 번 오는 입력. 전개용 입력은 그것이 한 번뿐이라 계수가 안 갈린다. */
const REPEAT_N = 5;
const REPEAT: number[] = [1, 6, 1, 6, 1, 6, 1];

/** 최대 맞추기만 오는 입력. 즉시 채우기의 비용이 어디서 오는지를 가른다. */
const ONLY_MAX: number[] = [6, 6, 6, 6, 6, 6, 6];

/**
 * 즉시 채우기 — 최대 맞추기를 만날 때마다 카운터 `N` 칸을 그 자리에서 전부 적는다.
 *
 * 문제 서술을 그대로 옮긴 절차다. 답은 언제나 맞고, 세는 것은 칸 쓰기다.
 */
function eager(N: number, A: number[]): Counted {
  const c = new Array<number>(N).fill(0);
  let max = 0;
  let writes = 0;
  let reads = 0;
  for (const op of A) {
    if (op === N + 1) {
      for (let i = 0; i < N; i++) {
        c[i] = max;
        writes++;
      }
      continue;
    }
    const i = op - 1;
    reads++;
    c[i] = (c[i] as number) + 1;
    writes++;
    if ((c[i] as number) > max) max = c[i] as number;
  }
  return { out: c, writes, reads };
}

/** 바닥값 하나로 적어 두는 절차 — `.ref.ts` 와 같은 것에 계수만 붙였다. */
function lazy(N: number, A: number[]): Counted {
  const c = new Array<number>(N).fill(0);
  let base = 0;
  let high = 0;
  let writes = 0;
  let reads = 0;
  for (const op of A) {
    if (op === N + 1) {
      base = high;
      continue;
    }
    const i = op - 1;
    reads++;
    const stored = c[i] as number;
    const from = stored < base ? base : stored;
    c[i] = from + 1;
    writes++;
    if (from + 1 > high) high = from + 1;
  }
  for (let i = 0; i < N; i++) {
    reads++;
    if ((c[i] as number) >= base) continue;
    c[i] = base;
    writes++;
  }
  return { out: c, writes, reads };
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 다르면 계수가 다른 절차의 것이 된다. */
function agree(N: number, A: number[], got: number[]): number[] {
  const want = maxCounters(N, [...A]);
  if (!same(want, got)) {
    throw new Error(
      `계측기의 답이 정본과 다르다 — 정본 ${show(want)} vs 계측기 ${show(got)}`,
    );
  }
  return got;
}

/**
 * 바닥값을 **최대 맞추기 `G` 번마다 한 번씩** 배열에 적는 절차.
 *
 * `G = 1` 이면 즉시 채우기와 같고, `G` 를 키울수록 적는 자리가 준다. 미룬 사이에 들어온
 * 증가 연산은 바닥값을 출발점으로 삼으므로 어느 `G` 에서도 답이 같다 — 그것이 이 대조군의
 * 요점이다(답이 갈리면 비용 비교가 성립하지 않는다).
 */
function flushEvery(N: number, A: number[], G: number): Counted {
  const c = new Array<number>(N).fill(0);
  let base = 0;
  let high = 0;
  let pending = 0;
  let writes = 0;
  let reads = 0;
  for (const op of A) {
    if (op === N + 1) {
      base = high;
      pending++;
      if (pending >= G) {
        for (let i = 0; i < N; i++) {
          c[i] = base;
          writes++;
        }
        pending = 0;
      }
      continue;
    }
    const i = op - 1;
    reads++;
    const stored = c[i] as number;
    const from = stored < base ? base : stored;
    c[i] = from + 1;
    writes++;
    if (from + 1 > high) high = from + 1;
  }
  for (let i = 0; i < N; i++) {
    reads++;
    if ((c[i] as number) >= base) continue;
    c[i] = base;
    writes++;
  }
  return { out: c, writes, reads };
}

/** 최대 맞추기마다 카운터 배열을 다시 읽어 최댓값을 구하는 절차. 답은 같고 읽기만 는다. */
function rescan(N: number, A: number[]): Counted {
  const c = new Array<number>(N).fill(0);
  let base = 0;
  let writes = 0;
  let reads = 0;
  for (const op of A) {
    if (op === N + 1) {
      let m = 0;
      for (let i = 0; i < N; i++) {
        reads++;
        if ((c[i] as number) > m) m = c[i] as number;
      }
      base = m;
      continue;
    }
    const i = op - 1;
    reads++;
    const stored = c[i] as number;
    const from = stored < base ? base : stored;
    c[i] = from + 1;
    writes++;
  }
  for (let i = 0; i < N; i++) {
    reads++;
    if ((c[i] as number) >= base) continue;
    c[i] = base;
    writes++;
  }
  return { out: c, writes, reads };
}

/** 규모 `n` 에서 즉시 채우기를 가장 나쁘게 만드는 입력 — 연산이 전부 최대 맞추기다. */
const eagerWorst = (n: number): number[] => new Array<number>(n).fill(n + 1);

/**
 * 규모 `n` 에서 미루기를 가장 나쁘게 만드는 입력.
 *
 * 증가를 카운터 하나에 몰아 마지막 채우기가 손댈 칸을 최대로 남기고, 마지막 연산 하나를
 * 최대 맞추기로 두어 바닥값을 `0` 보다 크게 만든다.
 */
const lazyWorst = (n: number): number[] => [
  ...new Array<number>(n - 1).fill(1),
  n + 1,
];

/** 증가와 최대 맞추기를 정해진 비율로 섞은 입력. 시드 없이 `k` 만으로 정해진다. */
const mixed = (n: number, m: number, every: number): number[] =>
  Array.from({ length: m }, (_, k) =>
    k % every === every - 1 ? n + 1 : (k % n) + 1,
  );

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  maxCounters(N: number, A: number[]): number[];
}

const REF = new URL("./maxCounters-guide.ref.ts", import.meta.url).pathname;

/**
 * 증가 연산이 **바닥값을 출발점으로 삼는 것**을 지운 사본. 저장값에서 그냥 1 을 더한다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 * 손으로 베낀 사본이면 「한 곳만 바꿨다」가 검사되지 않는다.
 */
const noRaise = await loadMutant<Impl>(REF, {
  swap: [/const from = .*$/, "const from = counter[i] as number;"],
});

/** 마지막 채우기가 바닥값 대신 **끝까지의 최댓값**을 적는 사본. */
const fillHigh = await loadMutant<Impl>(REF, {
  swap: [/^ {4}counter\[i\] = base;$/, "    counter[i] = high;"],
});

/** 최대 맞추기가 저장된 값들을 **다시 읽어** 최댓값을 구하는 사본. 답은 갈리지 않는다. */
const rescanMax = await loadMutant<Impl>(REF, {
  swap: [
    /base = high;/,
    "base = counter.reduce((m, v) => (v > m ? v : m), 0);",
  ],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: number[]; mutated: number[] }[]): void {
  if (rows.every((r) => same(r.bare, r.mutated))) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

const WRITE_CASES: [string, number, number[]][] = [
  [`N=${WALK_N}, A=${show(WALK)}`, WALK_N, WALK],
  [`N=${REPEAT_N}, A=${show(ONLY_MAX)}`, REPEAT_N, ONLY_MAX],
  [`N=${REPEAT_N}, A=${show(REPEAT)}`, REPEAT_N, REPEAT],
];

const BREAK_CASES: [number, number[]][] = [
  [WALK_N, WALK],
  [3, [2, 2, 1, 4, 1]],
  [3, [1, 1, 1, 4, 1]],
  [1, [1]],
];

const FILL_CASES: [number, number[]][] = [
  [WALK_N, WALK],
  [3, [1, 4, 2, 4, 3]],
  [3, [4, 4, 4]],
  [3, [1, 2, 3, 4]],
];

const SCALE_N = [10, 100, 1_000, 10_000];

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 칸 쓰기. */
  "write-two-ways": () => {
    const rows = WRITE_CASES.map(([name, N, A]) => {
      const a = eager(N, A);
      const b = lazy(N, A);
      agree(N, A, a.out);
      agree(N, A, b.out);
      return [name, num(a.writes), num(b.writes), show(b.out)];
    });
    return [
      table(["입력", "즉시 채우기", "바닥값 하나", "답"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 세 줄 다 두 방식의 답이 같다. 최대 맞추기가 잦을수록 칸 쓰기가 벌어진다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 바닥값을 배열에 적는 시점을 넷으로 두고 같은 입력에서 잰 값. */
  "defer-when": () => {
    const rows = [1, 2, 3].map((G) => {
      const r = flushEvery(REPEAT_N, REPEAT, G);
      agree(REPEAT_N, REPEAT, r.out);
      return [
        G === 1 ? "최대 맞추기마다 (G=1)" : `${G} 번마다 (G=${G})`,
        num(r.writes),
        show(r.out),
      ];
    });
    const last = lazy(REPEAT_N, REPEAT);
    agree(REPEAT_N, REPEAT, last.out);
    rows.push(["마지막에 한 번", num(last.writes), show(last.out)]);
    return [
      table(["바닥값을 배열에 적는 시점", "칸 쓰기", "답"], rows, [
        "l",
        "r",
        "l",
      ]),
      "",
      "└ 답은 넷 다 같고 칸 쓰기만 다르다. 가장 적은 것은 끝까지 미루는 마지막 줄이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 마지막 채우기가 바닥값 대신 끝까지의 최댓값을 적으면. */
  "pause-fill-high": () => {
    const rows = FILL_CASES.map(([N, A]) => ({
      N,
      A,
      bare: maxCounters(N, [...A]),
      mutated: fillHigh.maxCounters(N, [...A]),
    }));
    assertBreaks(rows);
    return [
      table(
        ["N", "A", "바닥값으로 채운다", "최댓값으로 채운다", ""],
        rows.map((r) => [
          String(r.N),
          show(r.A),
          show(r.bare),
          show(r.mutated),
          same(r.bare, r.mutated) ? "답이 같다" : "답이 다르다",
        ]),
        ["r", "l", "l", "l", "l"],
      ),
      "",
      "└ 아래 둘은 채울 칸이 없어 답이 같다. 이 변경을 넣어도 그 입력만 보면 알아채지 못한다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 최댓값을 그때그때 다시 읽어도 답은 같고 칸 읽기만 는다. */
  "pause-rescan": () => {
    const cases: [string, number, number[]][] = [
      [`N=${WALK_N}, A=${show(WALK)}`, WALK_N, WALK],
      ["N=1,000 · 증가 900 · 최대 맞추기 100", 1_000, mixed(1_000, 1_000, 10)],
      ["N=1,000 · 증가 500 · 최대 맞추기 500", 1_000, mixed(1_000, 1_000, 2)],
    ];
    const rows = cases.map(([name, N, A]) => {
      const bare = maxCounters(N, [...A]);
      const mutated = rescanMax.maxCounters(N, [...A]);
      const a = lazy(N, A);
      const b = rescan(N, A);
      agree(N, A, b.out);
      return [
        name,
        same(bare, mutated) ? "같다" : "다르다",
        num(a.reads),
        num(b.reads),
      ];
    });
    return [
      table(["입력", "답", "바닥값만 옮긴다", "다시 읽는다"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      "└ 답은 세 줄 다 같다. 갈리는 것은 카운터 배열을 몇 칸이나 읽는가 하나다",
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 바닥값을 빼면 무엇이 나오는가. */
  "mutant-skip-raise": () => {
    const rows = BREAK_CASES.map(([N, A]) => ({
      N,
      A,
      bare: maxCounters(N, [...A]),
      mutated: noRaise.maxCounters(N, [...A]),
    }));
    assertBreaks(rows);
    return [
      table(
        ["N", "A", "바른 코드", "출발점을 뺀 코드", ""],
        rows.map((r) => [
          String(r.N),
          show(r.A),
          show(r.bare),
          show(r.mutated),
          same(r.bare, r.mutated) ? "답이 같다" : "답이 다르다",
        ]),
        ["r", "l", "l", "l", "l"],
      ),
      "",
      "└ 아래 둘은 저장값이 바닥값보다 작은 칸을 증가시키는 자리가 없어 답이 같다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣은 값과 실측값의 대조. */
  "cost-scale": () => {
    const rows = SCALE_N.map((n) => {
      const a = eager(n, eagerWorst(n));
      const b = lazy(n, lazyWorst(n));
      agree(n, lazyWorst(n), b.out);
      return [num(n), num(a.writes), num(n * n), num(b.writes), num(2 * n - 2)];
    });
    const big = 100_000;
    const b = lazy(big, lazyWorst(big));
    rows.push([
      num(big),
      "(실행하지 않음)",
      num(big * big),
      num(b.writes),
      num(2 * big - 2),
    ]);
    return table(
      ["N = M", "즉시 채우기 최악(실측)", "N·M", "미루기 최악(실측)", "M+N−2"],
      rows,
      ["r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 칸 쓰기를 최대로 만드는 입력을 실제로 구성해 잰 값. */
  "worst-writes": () => {
    const n = 1_000;
    const cases: [string, number[]][] = [
      ["연산이 전부 최대 맞추기", new Array<number>(n).fill(n + 1)],
      [
        "서로 다른 칸을 한 번씩 증가",
        Array.from({ length: n }, (_, k) => k + 1),
      ],
      ["카운터 1 을 999 번 증가한 뒤 최대 맞추기", lazyWorst(n)],
    ];
    const rows = cases.map(([name, A]) => {
      const r = lazy(n, A);
      agree(n, A, r.out);
      const first = r.out[0] as number;
      return [
        name,
        num(r.writes),
        num(r.reads),
        `첫 칸 ${num(first)} · 끝 칸 ${num(r.out[n - 1] as number)}`,
      ];
    });
    return [
      table(
        [`입력 (N=${num(n)}, M=${num(n)})`, "칸 쓰기", "칸 읽기", "답"],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 마지막 줄이 최대다. 증가가 칸 하나에 몰려 마지막 채우기가 나머지 999 칸을 적는다",
    ].join("\n");
  },
};
