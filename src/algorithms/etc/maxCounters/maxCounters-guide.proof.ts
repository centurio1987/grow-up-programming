/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 연산 하나하나의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/etc/maxCounters/maxCounters-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  eager,
  eagerWorst,
  N_MAX,
  num,
  type OpRecord,
  realOf,
  secondsOf,
  show,
  skipAll,
  staleOf,
  trace,
  WALK,
  WALK_N,
  walkSteps,
} from "./maxCounters-guide.fig.tsx";
import { maxCounters } from "./maxCounters-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 텍스트 펜스의 열을 값에서 맞출 때 쓴다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 열 폭을 값에서 계산한 텍스트 펜스. 폭을 리터럴로 박으면 값이 바뀌어도 줄이 그대로다. */
function cols(rows: string[][]): string {
  const n = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: n }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, w[c] ?? 0)))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** `0 0 1 2 0` 꼴 — 표 칸 안에서 쓴다. */
const cells = (xs: readonly number[]): string => xs.join(" ");

/** 카운터 번호(1 부터) 목록 — 「2 번 · 3 번 · 5 번」. */
const numbered = (idx: readonly number[]): string =>
  idx.map((i) => `${i + 1} 번`).join(" · ");

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

/** 최대 맞추기가 여러 번 오는 입력. 전개용 입력은 그것이 한 번뿐이라 계수가 안 갈린다. */
const REPEAT_N = 5;
const REPEAT: number[] = [1, 6, 1, 6, 1, 6, 1];

/** 최대 맞추기만 오는 입력. 즉시 채우기의 비용이 어디서 오는지를 가른다. */
const ONLY_MAX: number[] = [6, 6, 6, 6, 6, 6, 6];

/** 바닥값 하나로 적어 두는 절차 — `.ref.ts` 와 같은 것에 계수만 붙였다. */
function lazy(N: number, A: readonly number[]): Counted {
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
function agree(N: number, A: readonly number[], got: number[]): number[] {
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
function flushEvery(N: number, A: readonly number[], G: number): Counted {
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
function rescan(N: number, A: readonly number[]): Counted {
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

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다.
 *
 * **중화 실행에서는 건너뛴다**(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」). 중화 여부는 값에서
 * 알아낸다 — 변이 모듈의 함수가 정본과 같은 객체이면 변이가 적용되지 않은 것이다.
 */
function assertBreaks(
  mutant: Impl,
  rows: { bare: number[]; mutated: number[] }[],
): void {
  if (mutant.maxCounters === maxCounters) return;
  if (rows.every((r) => same(r.bare, r.mutated))) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 전개 기록 ────────────────────────── */

const T = trace(WALK_N, WALK);
const MAX_OP = T.ops.find((r) => r.kind === "max") as OpRecord;
/** 저장값이 바닥값보다 작은 칸을 증가시키는 연산(전개의 불안한 경우). */
const RAISE_OP = T.ops.find(
  (r) => r.kind === "inc" && (r.stored as number) < r.before.base,
) as OpRecord;
/** 바닥값이 0 보다 클 때 저장값이 바닥값 이상인 칸을 증가시키는 연산(쉬운 경우). */
const KEEP_OP = T.ops.find(
  (r) =>
    r.kind === "inc" &&
    r.before.base > 0 &&
    (r.stored as number) >= r.before.base,
) as OpRecord;
const WANT = maxCounters(WALK_N, [...WALK]);
const STEPS = walkSteps();
/** 연산 기록 `n` 번째가 전개의 몇 번째 걸음인가 — 시작이 `T1` 이라 한 칸 밀린다. */
const stepOf = (r: OpRecord): string =>
  STEPS[T.ops.indexOf(r) + 1]?.id as string;

const kindWord = (r: OpRecord): string =>
  r.kind === "max" ? "최대 맞추기" : `${r.op} 번 증가`;

const toNumber = (s: string): number => Number(s.replace(/,/g, ""));

/* ────────────────────────── 블록 ────────────────────────── */

/** `concept` — 정의대로 처리했을 때 연산마다 카운터 값이 어떻게 되는가. */
function conceptRun(): string {
  const e = eager(WALK_N, WALK);
  agree(WALK_N, WALK, e.out);
  const rows = [
    ["시작", "—", "—", cells(new Array<number>(WALK_N).fill(0))],
    ...WALK.map((op, k) => [
      `k=${k}`,
      String(op),
      op === WALK_N + 1 ? "최대 맞추기" : `${op} 번 증가`,
      cells(e.snapshots[k] as number[]),
    ]),
  ];
  return [
    md(["연산", "A[k]", "하는 일", "카운터 1~5 의 값"], rows),
    "",
    `마지막 줄 ${show(e.out)} 가 돌려줄 배열이고, 정본이 낸 답 ${show(WANT)} 와 같습니다. 최대 맞추기 한 번이 카운터 ${WALK_N} 칸에 모두 값을 적었습니다.`,
  ].join("\n");
}

/** `concept` — 규모의 끝에서 두 방식의 최악 칸 쓰기. */
function conceptScale(): string {
  // 아래 문장이 「실행한 값과 같다」고 말하는 두 규모 — 실제로 실행해 N × M 과 대조한다.
  for (const n of [1_000, 10_000]) {
    if (eager(n, eagerWorst(n)).writes !== n * n) {
      throw new Error(`규모 ${n} 에서 즉시 채우기의 최악이 N × M 과 다르다`);
    }
  }
  const eagerClosed = N_MAX * N_MAX;
  const b = lazy(N_MAX, lazyWorst(N_MAX));
  agree(N_MAX, lazyWorst(N_MAX), b.out);
  return [
    md(
      ["방법", `N = M = ${num(N_MAX)} 에서 최악 칸 쓰기`, "초당 1 억 번 기준"],
      [
        [
          "최대 맞추기마다 N 칸을 적는다",
          num(eagerClosed),
          secondsOf(eagerClosed),
        ],
        ["바닥값 하나로 미룬다", num(b.writes), secondsOf(b.writes)],
      ],
      [1, 2],
    ),
    "",
    "위 줄은 N × M 으로 낸 값이고(규모 1,000 · 10,000 에서는 실행한 값과 같습니다), 아래 줄은 최악 입력을 실제로 실행해 센 값입니다.",
  ].join("\n");
}

/** `deep.origin` ② — 즉시 채우기의 최악을 규모별로. */
function originCost(): string {
  const rows = [1_000, 10_000].map((n) => {
    const a = eager(n, eagerWorst(n));
    if (a.writes !== n * n) throw new Error(`규모 ${n} 에서 N × M 과 다르다`);
    return [num(n), num(a.writes), secondsOf(a.writes), "실행해서 셌다"];
  });
  rows.push([
    num(N_MAX),
    num(N_MAX * N_MAX),
    secondsOf(N_MAX * N_MAX),
    "N × M 으로 냈다",
  ]);
  return [
    md(["N = M", "칸 쓰기", "초당 1 억 번 기준", "구한 방법"], rows, [0, 1, 2]),
    "",
    "연산이 전부 최대 맞추기인 입력입니다. 실행한 두 규모에서 칸 쓰기가 N × M 과 정확히 같습니다.",
  ].join("\n");
}

/** `deep.origin` ③ — 최대 맞추기 한 번이 실제로 적는 것. */
function originOneMax(): string {
  const e = eager(WALK_N, WALK);
  const k = MAX_OP.k;
  const before = e.snapshots[k - 1] as number[];
  const after = e.snapshots[k] as number[];
  const moved = after.flatMap((v, i) => (v !== before[i] ? [i] : []));
  const head = ["시점", ...before.map((_, i) => `카운터 ${i + 1}`)];
  return [
    md(
      head,
      [
        [`A[${k}] = ${MAX_OP.op} 직전`, ...before.map(String)],
        [`A[${k}] = ${MAX_OP.op} 직후`, ...after.map(String)],
      ],
      before.map((_, i) => i + 1),
    ),
    "",
    `${WALK_N} 칸에 모두 ${after[0]}${을를(after[0] as number)} 적었고, 그중 값이 실제로 바뀐 칸은 ${moved.length} 개(${numbered(moved)})입니다.`,
  ].join("\n");
}

const WRITE_CASES: [string, number, number[]][] = [
  [`N=${WALK_N}, A=${show(WALK)}`, WALK_N, [...WALK]],
  [`N=${REPEAT_N}, A=${show(ONLY_MAX)}`, REPEAT_N, ONLY_MAX],
  [`N=${REPEAT_N}, A=${show(REPEAT)}`, REPEAT_N, REPEAT],
];

/** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 칸 쓰기. */
function writeTwoWays(): string {
  const rows = WRITE_CASES.map(([name, N, A]) => {
    const a = eager(N, A);
    const b = lazy(N, A);
    agree(N, A, a.out);
    agree(N, A, b.out);
    return [name, num(a.writes), num(b.writes), show(b.out)];
  });
  return [
    md(
      ["입력", "즉시 채우기의 칸 쓰기", "바닥값 하나의 칸 쓰기", "답"],
      rows,
      [1, 2],
    ),
    "",
    `${rows.length} 줄 모두 두 방식의 답이 정본의 답과 같습니다.`,
  ].join("\n");
}

/** `deep.origin` ⑤ — 가장 단순한 후보: 최대 맞추기를 건너뛰고 끝에 최댓값으로 채운다. */
function originSkipAll(): string {
  const incOnly = new Array<number>(WALK_N).fill(0);
  for (const op of WALK) {
    if (op === WALK_N + 1) continue;
    incOnly[op - 1] = (incOnly[op - 1] as number) + 1;
  }
  const top = Math.max(...incOnly);
  const skip = skipAll(WALK_N, WALK);
  const wrong = skip.flatMap((v, i) => (v !== WANT[i] ? [i] : []));
  return [
    md(
      ["단계", "카운터 1~5 의 값"],
      [
        ["증가만 처리한 결과", cells(incOnly)],
        [`마지막에 최댓값 ${top}${으로(top)} 채운 결과`, cells(skip)],
        ["정답", cells(WANT)],
      ],
    ),
    "",
    `${WALK_N} 칸 중 ${wrong.length} 칸(${numbered(wrong)} 카운터)이 정답과 다릅니다.`,
  ].join("\n");
}

/** `deep.build` 개념 (c) — 칸 하나를 읽는 법. */
function buildReadOne(): string {
  const s = T.end;
  const stale = staleOf(s);
  const fresh = s.counter.flatMap((v, i) => (v >= s.base ? [i] : []));
  const pick = [stale[0] as number, fresh.at(-1) as number];
  return [
    cols(
      pick.map((i) => {
        const v = s.counter[i] as number;
        const real = v < s.base ? s.base : v;
        return [
          `counter[${i}] = ${v},  base = ${s.base}`,
          `→  max(${v}, ${s.base}) = ${real}`,
          `→  ${i + 1} 번 카운터의 참값은 ${real}`,
        ];
      }),
    ),
  ].join("\n");
}

/** `deep.build` 개념 (d) — 연산마다 옛 값인 칸이 어떻게 바뀌는가. */
function buildStaleByOp(): string {
  const rows = T.ops.map((r) => {
    const s = r.after;
    const stale = staleOf(s);
    return [
      `k=${r.k}`,
      kindWord(r),
      String(s.base),
      cells(s.counter),
      stale.length === 0 ? "없음" : numbered(stale),
    ];
  });
  const most = Math.max(...T.ops.map((r) => staleOf(r.after).length));
  return [
    md(["연산", "하는 일", "base", "저장값", "옛 값인 카운터"], rows, [2]),
    "",
    `옛 값인 칸은 최대 맞추기 한 번이 ${most} 칸까지 만들고, 증가 한 번이 많아야 한 칸을 지웁니다.`,
  ].join("\n");
}

/** `deep.build` 개념 (e) — 바닥값을 더하는 값으로 읽으면. */
function buildVsOffset(): string {
  const s = T.end;
  const offset = s.counter.map((v) => v + s.base);
  const byMax = realOf(s);
  const wrong = offset.flatMap((v, i) => (v !== WANT[i] ? [i] : []));
  if (!same(byMax, WANT)) throw new Error("큰 쪽으로 읽은 값이 정답과 다르다");
  return [
    md(
      ["읽는 규칙", "카운터 1~5 의 값"],
      [
        ["저장값 그대로", cells(s.counter)],
        [`저장값과 base = ${s.base} 중 큰 쪽`, cells(byMax)],
        ["저장값 + base", cells(offset)],
        ["정답", cells(WANT)],
      ],
    ),
    "",
    `연산 ${T.ops.length} 개를 처리한 뒤의 같은 저장값을 읽었습니다. 큰 쪽으로 읽으면 ${WALK_N} 칸이 모두 정답이고, 더해서 읽으면 ${wrong.length} 칸이 틀립니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 최대 맞추기 앞뒤의 상태. */
function buildMaxOp(): string {
  const b = MAX_OP.before;
  const a = MAX_OP.after;
  const realMoved = realOf(a).flatMap((v, i) =>
    v !== realOf(b)[i] ? [i] : [],
  );
  return [
    md(
      ["상태", `A[${MAX_OP.k}] = ${MAX_OP.op} 직전`, "직후"],
      [
        ["저장값", cells(b.counter), cells(a.counter)],
        ["base", String(b.base), String(a.base)],
        ["high", String(b.high), String(a.high)],
        ["참값", cells(realOf(b)), cells(realOf(a))],
      ],
    ),
    "",
    `저장값은 한 칸도 안 바뀌었고, base 한 자리가 ${b.base} 에서 ${a.base}${으로(a.base)} 바뀌어 참값 ${realMoved.length} 칸이 바뀌었습니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 증가의 두 경우. */
function buildIncCases(): string {
  const row = (r: OpRecord) => {
    const stored = r.stored as number;
    const cond = stored < r.before.base;
    return [
      `k=${r.k}`,
      `i = ${r.i}`,
      String(stored),
      String(r.before.base),
      `${stored} < ${r.before.base} ${cond ? "참" : "거짓"}`,
      String(r.from),
      String((r.from as number) + 1),
    ];
  };
  const wrote = (KEEP_OP.from as number) + 1;
  return [
    md(
      ["연산", "칸", "저장값", "base", "조건", "출발값", "적은 값"],
      [row(KEEP_OP), row(RAISE_OP)],
      [2, 3, 5, 6],
    ),
    "",
    `두 줄 다 ${wrote}${을를(wrote)} 적었는데, 위 줄은 저장값에서 · 아래 줄은 base 에서 출발했습니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — 마지막 채우기. */
function buildFinalFill(): string {
  const s = T.end;
  const rows = s.counter.map((v, i) => [
    String(i),
    String(v),
    `${v} ${v < s.base ? "<" : "≥"} ${s.base}`,
    v < s.base ? `${s.base}${을를(s.base)} 적는다` : "그대로 둔다",
    String(T.result[i]),
  ]);
  return [
    md(["i", "저장값", "base 와 비교", "하는 일", "적은 뒤"], rows, [0, 1, 4]),
    "",
    `${T.filled.length} 칸에 값을 적었고, 적은 뒤의 배열 ${show(T.result)} 가 정본의 답입니다.`,
  ].join("\n");
}

/** `deep.build` 설계 선택 — 바닥값을 배열에 적는 시점을 넷으로. */
function deferWhen(): string {
  const rows = [1, 2, 3].map((G) => {
    const r = flushEvery(REPEAT_N, REPEAT, G);
    agree(REPEAT_N, REPEAT, r.out);
    return [
      G === 1 ? "최대 맞추기마다 (G=1)" : `최대 맞추기 ${G} 번마다 (G=${G})`,
      num(r.writes),
      show(r.out),
    ];
  });
  const last = lazy(REPEAT_N, REPEAT);
  agree(REPEAT_N, REPEAT, last.out);
  rows.push(["연산이 끝난 뒤 한 번", num(last.writes), show(last.out)]);
  const least = rows.reduce((m, r) =>
    toNumber(r[1] as string) < toNumber(m[1] as string) ? r : m,
  );
  return [
    md(["배열에 적는 시점", "칸 쓰기", "답"], rows, [1]),
    "",
    `입력은 N=${REPEAT_N}, A=${show(REPEAT)} 입니다. ${rows.length} 줄의 답이 모두 같고, 칸 쓰기가 가장 적은 줄은 「${least[0]}」입니다.`,
  ].join("\n");
}

/** `deep.walk` 도입부 — 끝까지 쓸 입력. */
function walkInput(): string {
  return [
    `const N = ${WALK_N};`,
    `const A = [${WALK.join(", ")}];`,
    `// 이 절이 끝나면 [${WANT.join(", ")}] 가 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 1 — 세 값을 준비한 상태. */
function walkInit(): string {
  const s = (T.ops[0] as OpRecord).before;
  return [
    cols([
      [
        `counter = ${show(s.counter)}`,
        `base = ${s.base}`,
        `high = ${s.high}`,
        `참값도 ${show(realOf(s))}`,
      ],
    ]),
  ].join("\n");
}

/** `deep.walk` 2 — 증가만 처리하는 조각을 실행한 결과(최대 맞추기는 건너뛴다). */
function walkIncOnly(): string {
  const c = new Array<number>(WALK_N).fill(0);
  let high = 0;
  const rows: string[][] = [["k", "A[k]", "i", "counter", "high"]];
  WALK.forEach((op, k) => {
    if (op === WALK_N + 1) return;
    const i = op - 1;
    c[i] = (c[i] as number) + 1;
    if ((c[i] as number) > high) high = c[i] as number;
    rows.push([String(k), String(op), String(i), cells(c), String(high)]);
  });
  const miss = c.flatMap((v, i) => (v !== WANT[i] ? [i] : []));
  return [
    cols(rows),
    `    └ 끝난 배열 ${show(c)} 은 정답 ${show(WANT)} 과 ${miss.length} 칸이 다르다`,
  ].join("\n");
}

/** `deep.walk` 3 — 최대 맞추기 조각을 실행한 결과. */
function walkMaxOp(): string {
  const b = MAX_OP.before;
  const a = MAX_OP.after;
  const stale = staleOf(a);
  return [
    cols([
      [
        "들어올 때",
        `base=${b.base}  high=${b.high}`,
        `counter ${cells(b.counter)}`,
      ],
      [
        "② 실행 후",
        `base=${a.base}  high=${a.high}`,
        `counter ${cells(a.counter)}`,
      ],
      ["참값", "", cells(realOf(a))],
    ]),
    `    └ 배열은 한 칸도 안 바뀌었다. 저장값이 base 보다 작은 ${stale.length} 칸의 참값이 ${a.base}${으로(a.base)} 올라갔다`,
  ].join("\n");
}

/** `deep.walk` 4 — 출발값을 고르는 조각의 두 갈래. */
function walkFrom(): string {
  const line = (r: OpRecord) => {
    const stored = r.stored as number;
    const cond = stored < r.before.base;
    return [
      `k=${r.k}`,
      `A[k]=${r.op} → i=${r.i}`,
      `저장값 ${stored}, base ${r.before.base}`,
      `${stored} < ${r.before.base}${이가(r.before.base)} ${cond ? "참" : "거짓"}`,
      `from = ${r.from} → counter[${r.i}] = ${(r.from as number) + 1}`,
    ];
  };
  return cols([line(RAISE_OP), line(KEEP_OP)]);
}

/** `deep.walk` 5 — 마지막 채우기 조각을 실행한 결과. */
function walkFill(): string {
  const s = T.end;
  return [
    cols([
      ["i", ...s.counter.map((_, i) => String(i)), ""],
      ["저장값", ...s.counter.map(String), `base = ${s.base}`],
      ["비교", ...s.counter.map((v) => (v < s.base ? "<" : "≥")), ""],
      ["적은 뒤", ...T.result.map(String), `칸 쓰기 ${T.filled.length} 번`],
    ]),
  ].join("\n");
}

const FILL_CASES: [number, number[]][] = [
  [WALK_N, [...WALK]],
  [3, [1, 4, 2, 4, 3]],
  [3, [4, 4, 4]],
  [3, [1, 2, 3, 4]],
];

/** `deep.walk.pause` — 마지막 채우기가 바닥값 대신 끝까지의 최댓값을 적으면. */
function pauseFillHigh(): string {
  const rows = FILL_CASES.map(([N, A]) => ({
    N,
    A,
    bare: maxCounters(N, [...A]),
    mutated: fillHigh.maxCounters(N, [...A]),
  }));
  assertBreaks(fillHigh, rows);
  const diff = rows.filter((r) => !same(r.bare, r.mutated)).length;
  return [
    md(
      ["N", "A", "바닥값으로 채운 답", "최댓값으로 채운 답", "비교"],
      rows.map((r) => [
        String(r.N),
        show(r.A),
        show(r.bare),
        show(r.mutated),
        same(r.bare, r.mutated) ? "답이 같다" : "답이 다르다",
      ]),
      [0],
    ),
    "",
    `${rows.length} 입력 중 ${diff} 입력에서 답이 갈립니다.`,
  ].join("\n");
}

/** `deep.walk` 6 — 고정 입력의 걸음 전부와 분기 판정. */
function walkTrace(): string {
  const N1 = WALK_N + 1;
  const first = (T.ops[0] as OpRecord).before;
  const rows: string[][] = [
    [
      STEPS[0]?.id as string,
      "—",
      "—",
      "연산을 처리하기 전",
      "—",
      "—",
      "—",
      String(first.base),
      String(first.high),
    ],
  ];
  for (const r of T.ops) {
    const eq = r.op === N1;
    rows.push([
      stepOf(r),
      String(r.k),
      String(r.op),
      `\`${r.op} = ${N1}\` **${eq ? "참" : "거짓"}** → ${eq ? "②" : "①"}`,
      eq ? "—" : String(r.i),
      eq ? "—" : String(r.from),
      eq ? "—" : String((r.from as number) + 1),
      String(r.after.base),
      String(r.after.high),
    ]);
  }
  rows.push([
    STEPS.at(-1)?.id as string,
    "—",
    "—",
    "연산이 끝났다 → ③",
    "—",
    "—",
    `${T.filled.length} 칸에 ${T.end.base}`,
    String(T.end.base),
    String(T.end.high),
  ]);
  const incIds = T.ops.filter((r) => r.kind === "inc").map(stepOf);
  const maxIds = T.ops.filter((r) => r.kind === "max").map(stepOf);
  const writes = incIds.length + T.filled.length;
  if (writes !== lazy(WALK_N, WALK).writes) {
    throw new Error("걸음에서 센 칸 쓰기가 계측기와 다르다");
  }
  return [
    md(
      [
        "단계",
        "k",
        "A[k]",
        "조건 판정",
        "i",
        "출발값",
        "적은 값",
        "base",
        "high",
      ],
      rows,
      [1, 2, 4, 5, 7, 8],
    ),
    "",
    `① 은 ${incIds.join(" · ")} 에서 ${incIds.length} 번, ② 는 ${maxIds.join(" · ")} 에서 ${maxIds.length} 번, ③ 은 ${STEPS.at(-1)?.id} 에서 한 번 실행됐습니다. 칸 쓰기는 ${incIds.length} + 0 + ${T.filled.length} = ${writes} 번이고, 반환값은 ${show(T.result)} 입니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 최댓값을 그때그때 다시 읽어도 답은 같고 칸 읽기만 는다. */
function pauseRescan(): string {
  const cases: [number, number[]][] = [
    [WALK_N, [...WALK]],
    [1_000, mixed(1_000, 1_000, 10)],
    [1_000, mixed(1_000, 1_000, 2)],
  ];
  const rows = cases.map(([N, A]) => {
    const maxes = A.filter((op) => op === N + 1).length;
    const name =
      N === WALK_N
        ? `N=${N}, A=${show(A)}`
        : `N=${num(N)} · 증가 ${num(A.length - maxes)} · 최대 맞추기 ${num(maxes)}`;
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
  const last = rows.at(-1) as string[];
  return [
    md(
      ["입력", "답", "바닥값만 옮길 때 칸 읽기", "다시 읽을 때 칸 읽기"],
      rows,
      [2, 3],
    ),
    "",
    `마지막 줄에서 칸 읽기가 ${last[2]} 번에서 ${last[3]} 번으로 늡니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
function finalCalls(): string {
  const calls: [number, number[]][] = [
    [WALK_N, [...WALK]],
    [3, [4, 4, 4]],
    [3, [1, 1, 1, 4, 1]],
    [1, [2]],
  ];
  return [
    cols(
      calls.map(([N, A]) => [
        `maxCounters(${N}, [${A.join(", ")}])`,
        `→  [${maxCounters(N, [...A]).join(", ")}]`,
      ]),
    ),
  ].join("\n");
}

/** `deep.math` ① — base_k 가 정해지는 자리. */
function mathBaseK(): string {
  const rows = T.ops.map((r) => {
    const k = r.k + 1;
    return r.kind === "max"
      ? [
          `k = ${k}`,
          `A[${r.k}] = ${r.op} = N + 1`,
          `base_${k} = high_${r.k} = ${r.after.base}`,
        ]
      : [
          `k = ${k}`,
          `A[${r.k}] = ${r.op} ≠ N + 1`,
          `base_${k} = base_${r.k} = ${r.after.base}`,
        ];
  });
  return cols(rows);
}

/** `deep.math` ② — real_k 정의를 값에 넣은 자리. */
function mathReal(): string {
  const k = MAX_OP.k + 1;
  const s = MAX_OP.after;
  const rows = s.counter.map((v, i) => [
    `real_${k}(${i}) = max(${v}, ${s.base}) = ${v < s.base ? s.base : v}`,
    v < s.base
      ? "저장값이 바닥값보다 작은 칸"
      : v === s.base
        ? "저장값과 바닥값이 같은 칸"
        : "저장값이 바닥값보다 큰 칸",
  ]);
  return [
    `counter_${k} = ${cells(s.counter)},  base_${k} = ${s.base},  high_${k} = ${s.high}`,
    "",
    cols(rows),
  ].join("\n");
}

const SCALE_N = [10, 100, 1_000, 10_000];

/** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣은 값과 실측값의 대조. */
function costScale(): string {
  const rows = SCALE_N.map((n) => {
    const a = eager(n, eagerWorst(n));
    const b = lazy(n, lazyWorst(n));
    agree(n, lazyWorst(n), b.out);
    return [num(n), num(a.writes), num(n * n), num(b.writes), num(2 * n - 2)];
  });
  const b = lazy(N_MAX, lazyWorst(N_MAX));
  rows.push([
    num(N_MAX),
    "실행하지 않음",
    num(N_MAX * N_MAX),
    num(b.writes),
    num(2 * N_MAX - 2),
  ]);
  const hits = rows.filter((r) => r[1] === r[2] && r[3] === r[4]).length;
  return [
    md(
      ["N = M", "즉시 채우기 최악(실측)", "N·M", "미루기 최악(실측)", "M+N−2"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `두 방식을 모두 실행한 ${hits} 규모에서 실측값이 닫힌 형태와 정확히 같습니다.`,
  ].join("\n");
}

/** `invariant` ② — 전개의 걸음마다 불변식의 세 문장을 값으로 대조한다. */
function invariantHold(): string {
  const e = eager(WALK_N, WALK);
  let lastMax = 0;
  const rows = T.ops.map((r, n) => {
    const byDef = e.snapshots[n] as number[];
    const real = realOf(r.after);
    if (r.kind === "max") lastMax = r.before.high;
    const verdict = (ok: boolean) => (ok ? "참" : "거짓");
    return [
      stepOf(r),
      cells(byDef),
      cells(real),
      verdict(same(byDef, real)),
      verdict(r.after.base === lastMax),
      verdict(r.after.high === Math.max(...real)),
    ];
  });
  const bad = rows.filter((r) => r.slice(3).some((c) => c !== "참")).length;
  return [
    md(
      [
        "단계",
        "정의대로 처리한 값",
        "저장값과 base 중 큰 쪽",
        "앞 문장",
        "가운데 문장",
        "뒤 문장",
      ],
      rows,
    ),
    "",
    `${rows.length} 걸음 중 세 문장 가운데 하나라도 거짓인 걸음은 ${bad} 개입니다.`,
  ].join("\n");
}

/** `invariant` ② — 경계에 있는 입력. */
function invariantEdges(): string {
  const cases: [number, number[], string][] = [
    [1, [1], "최대 맞추기가 없어 base 가 0 그대로다"],
    [1, [2], "증가가 없어 high 도 base 도 0 이다"],
    [3, [4, 4, 4], "최대 맞추기만 셋이라 base 가 0 에서 안 움직인다"],
    [
      3,
      [1, 2, 3, 4],
      "마지막 최대 맞추기가 base 를 올리지만 못 미치는 칸이 없다",
    ],
    [2, [3, 1, 2], "최대 맞추기가 맨 앞이라 base 가 0 인 채로 지나간다"],
  ];
  const rows = cases.map(([N, A, where]) => {
    const t = trace(N, A);
    return [
      `N=${N}, A=${show(A)}`,
      where,
      `base = ${t.end.base} · 채운 칸 ${t.filled.length}`,
      show(t.result),
    ];
  });
  return md(["입력", "처리되는 자리", "끝난 상태", "결과"], rows);
}

const BREAK_CASES: [number, number[]][] = [
  [WALK_N, [...WALK]],
  [3, [2, 2, 1, 4, 1]],
  [3, [1, 1, 1, 4, 1]],
  [1, [1]],
];

/** `invariant` ③ — 불변식을 지키던 줄에서 바닥값을 빼면 무엇이 나오는가. */
function mutantSkipRaise(): string {
  const rows = BREAK_CASES.map(([N, A]) => ({
    N,
    A,
    bare: maxCounters(N, [...A]),
    mutated: noRaise.maxCounters(N, [...A]),
  }));
  assertBreaks(noRaise, rows);
  const diff = rows.filter((r) => !same(r.bare, r.mutated)).length;
  return [
    md(
      ["N", "A", "바른 코드", "출발점을 뺀 코드", "비교"],
      rows.map((r) => [
        String(r.N),
        show(r.A),
        show(r.bare),
        show(r.mutated),
        same(r.bare, r.mutated) ? "답이 같다" : "답이 다르다",
      ]),
      [0],
    ),
    "",
    `${rows.length} 입력 중 ${diff} 입력에서 답이 갈립니다.`,
  ].join("\n");
}

/** `invariant` ③ — 바뀐 줄이 전개 입력의 불안한 칸에서 무엇을 했는가. */
function invariantMutantTrace(): string {
  const r = RAISE_OP;
  const stored = r.stored as number;
  const base = r.before.base;
  const good = (r.from as number) + 1;
  const bad = stored + 1;
  const i = r.i as number;
  const shown = noRaise.maxCounters(WALK_N, [...WALK])[i] as number;
  return [
    cols([
      [
        "바른 코드",
        `저장값 ${stored},  base ${base}`,
        `→  ${base} 에서 출발  →  ${good}`,
        "최대 맞추기와 증가가 함께 반영된다",
      ],
      [
        "바뀐 코드",
        `저장값 ${stored},  base ${base}`,
        `→  ${stored} 에서 출발  →  ${bad}`,
        "증가만 반영된다",
      ],
    ]),
    `    └ 마지막 채우기가 ${bad}${을를(bad)} ${shown}${으로(shown)} 올린다. ${i + 1} 번 카운터의 답이 ${good} 대신 ${shown} 이다`,
  ].join("\n");
}

/** `perf.derive` — 전개의 걸음에서 센 칸 쓰기. */
function perfDerive(): string {
  const incIds = T.ops.filter((r) => r.kind === "inc").map(stepOf);
  const maxIds = T.ops.filter((r) => r.kind === "max").map(stepOf);
  const total = incIds.length + T.filled.length;
  return [
    cols([
      [
        "증가",
        incIds.join(" "),
        "연산마다 정확히 한 칸",
        `→  ${incIds.length} 번`,
      ],
      ["최대 맞추기", maxIds.join(" "), "base 한 자리만 바뀐다", "→  0 번"],
      [
        "마지막 채우기",
        STEPS.at(-1)?.id as string,
        "못 미치는 칸만",
        `→  ${T.filled.length} 번`,
      ],
    ]),
    `    └ 합 ${total} 번`,
  ].join("\n");
}

/** `perf.bounds` — 칸 쓰기만 따로 본 최선과 최악. */
function perfBoundsWrites(): string {
  const best = lazy(N_MAX, eagerWorst(N_MAX));
  const worst = lazy(N_MAX, lazyWorst(N_MAX));
  agree(N_MAX, lazyWorst(N_MAX), worst.out);
  return [
    `N = M = ${num(N_MAX)} 에서 칸 쓰기만 따로 세면`,
    cols([
      [
        "  최선",
        `${num(best.writes)} 번`,
        "연산이 전부 최대 맞추기라 적을 칸이 없다",
      ],
      [
        "  최악",
        `${num(worst.writes)} 번`,
        "증가가 칸 하나에 몰리고 마지막 연산이 최대 맞추기다",
      ],
    ]),
  ].join("\n");
}

/** `perf.worst` — 칸 쓰기를 최대로 만드는 입력을 실제로 구성해 잰 값. */
function worstWrites(): string {
  const n = 1_000;
  const cases: [string, number[]][] = [
    ["연산이 전부 최대 맞추기", eagerWorst(n)],
    ["서로 다른 칸을 한 번씩 증가", Array.from({ length: n }, (_, k) => k + 1)],
    [`카운터 1 을 ${num(n - 1)} 번 증가한 뒤 최대 맞추기`, lazyWorst(n)],
  ];
  const rows = cases.map(([name, A]) => {
    const r = lazy(n, A);
    agree(n, A, r.out);
    return [
      name,
      num(r.writes),
      num(r.reads),
      `첫 칸 ${num(r.out[0] as number)} · 끝 칸 ${num(r.out[n - 1] as number)}`,
    ];
  });
  const top = rows.reduce((m, r) =>
    toNumber(r[1] as string) > toNumber(m[1] as string) ? r : m,
  );
  return [
    md(
      [`입력 (N=${num(n)}, M=${num(n)})`, "칸 쓰기", "칸 읽기", "답"],
      rows,
      [1, 2],
    ),
    "",
    `칸 쓰기가 가장 많은 것은 「${top[0]}」의 ${top[1]} 번이고, M + N − 2 = ${num(2 * n - 2)} 과 같습니다.`,
  ].join("\n");
}

/** `selfcheck` — 최대 맞추기 걸음과 그다음 걸음의 상태. */
function selfcheckT5T6(): string {
  const n = T.ops.indexOf(MAX_OP);
  const next = T.ops[n + 1] as OpRecord;
  const at = (r: OpRecord) => [
    stepOf(r),
    `base=${r.after.base}  high=${r.after.high}`,
    `counter ${cells(r.after.counter)}`,
  ];
  const wrote = (next.from as number) + 1;
  return [
    cols([
      [...at(MAX_OP), "배열이 그대로다"],
      [...at(next), `${next.op} 번 카운터가 ${wrote}${이가(wrote)} 됐다`],
    ]),
  ].join("\n");
}

/** `selfcheck` 답 — 불안한 칸을 증가시키는 걸음이 보는 것. */
function selfcheckFrom(): string {
  const r = RAISE_OP;
  const stored = r.stored as number;
  return [
    cols([
      [
        `${stepOf(r)} 이 보는 것`,
        `저장값 counter[${r.i}] = ${stored},  base = ${r.before.base}`,
      ],
      ["", `${stored} < ${r.before.base} 가 참이므로 출발값은 ${r.from}`],
      ["", `counter[${r.i}] = ${r.from} + 1 = ${(r.from as number) + 1}`],
    ]),
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  "concept-run": conceptRun,
  "concept-scale": conceptScale,
  "origin-cost": originCost,
  "origin-one-max": originOneMax,
  "write-two-ways": writeTwoWays,
  "origin-skip-all": originSkipAll,
  "build-read-one": buildReadOne,
  "build-stale-by-op": buildStaleByOp,
  "build-vs-offset": buildVsOffset,
  "build-max-op": buildMaxOp,
  "build-inc-cases": buildIncCases,
  "build-final-fill": buildFinalFill,
  "defer-when": deferWhen,
  "walk-input": walkInput,
  "walk-init": walkInit,
  "walk-inc-only": walkIncOnly,
  "walk-max-op": walkMaxOp,
  "walk-from": walkFrom,
  "walk-fill": walkFill,
  "pause-fill-high": pauseFillHigh,
  "walk-trace": walkTrace,
  "pause-rescan": pauseRescan,
  "final-calls": finalCalls,
  "math-base-k": mathBaseK,
  "math-real": mathReal,
  "cost-scale": costScale,
  "invariant-hold": invariantHold,
  "invariant-edges": invariantEdges,
  "mutant-skip-raise": mutantSkipRaise,
  "invariant-mutant-trace": invariantMutantTrace,
  "perf-derive": perfDerive,
  "perf-bounds-writes": perfBoundsWrites,
  "worst-writes": worstWrites,
  "selfcheck-t5t6": selfcheckT5T6,
  "selfcheck-from": selfcheckFrom,
};
