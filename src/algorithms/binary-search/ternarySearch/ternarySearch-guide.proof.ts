/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/ternarySearch/ternarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { ternarySearch } from "./ternarySearch-guide.ref.ts";

const REF = new URL("./ternarySearch-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 칸 맞춤 ───────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/**
 * 칸을 맞춰 표를 그린다. 첫 열은 왼쪽 정렬, 나머지는 오른쪽 정렬이고 칸 사이는 세 칸이다.
 * 붙임말(`note`)은 마지막 열의 왼쪽 끝에 맞춰 단다.
 */
function table(head: string[], rows: string[][], note: string): string {
  const cols = head.length;
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(width(head[c] as string), ...rows.map((r) => width(r[c] ?? ""))),
    );
  }
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        c === 0 ? pad(cell, w[c] as number) : padLeft(cell, w[c] as number),
      )
      .join("   ")
      .replace(/\s+$/, "");
  const lead = w.slice(0, cols - 1).reduce((a, b) => a + b + 3, 0);
  return [line(head), ...rows.map(line), " ".repeat(lead) + note].join("\n");
}

/** 지수 표기를 본문과 같은 모양으로 — `1.05e-7`. */
const sci = (x: number): string => x.toExponential(2);

/** 허용 오차를 표에 적는 모양. `1` 만 그대로 두고 나머지는 지수 표기로 맞춘다. */
const showEps = (eps: number): string =>
  eps === 1 ? "1" : eps.toExponential(0);

/* ─────────────────── 정본을 부르는 계측 ─────────────────── */

/** 정본을 한 번 실행하고 `f` 호출 수를 함께 돌려준다. 정본을 고치지 않는다. */
function callsOf(
  f: (x: number) => number,
  lo: number,
  hi: number,
  eps: number,
): { x: number; calls: number } {
  let calls = 0;
  const counted = (x: number): number => {
    calls++;
    return f(x);
  };
  return { x: ternarySearch(counted, lo, hi, eps), calls };
}

/**
 * 두 내부점을 구간의 `t` 지점과 `1 - t` 지점에 두는 일반형. 정본은 `t = 1/3` 인 한 벌이고,
 * 아래에서 그 한 줄이 정본과 같은 값을 내는지 확인한다.
 */
function runWithT(
  f: (x: number) => number,
  lo: number,
  hi: number,
  eps: number,
  t: number,
): { x: number; steps: number; calls: number } {
  let calls = 0;
  let steps = 0;
  while (hi - lo > eps) {
    steps++;
    if (steps > 200_000) break;
    const span = hi - lo;
    const m1 = lo + t * span;
    const m2 = hi - t * span;
    calls += 2;
    if (f(m1) < f(m2)) hi = m2;
    else lo = m1;
  }
  return { x: (lo + hi) / 2, steps, calls };
}

/* ─────────────────── 전개가 쓰는 고정 입력 ─────────────────── */

/** 전개·아이디어 상세가 함께 쓰는 함수. 최솟점은 `x = 2` 다. */
const F = (x: number): number => (x - 2) ** 2;
const LO = 0;
const HI = 9;

// `t = 1/3` 줄이 정본과 다른 절차를 재고 있으면 아래 표들이 전부 헛돈다. 반환값은 마지막
// 자리까지 같지는 않다 — 정본이 `(hi - lo) / 3` 으로 적는 것을 여기서는 `t * (hi - lo)` 로
// 적어서 부동소수점 반올림이 한 번 더 들어간다. 호출 수는 정확히 같아야 한다.
for (const eps of [1, 1e-6, 1e-9]) {
  const byRule = runWithT(F, LO, HI, eps, 1 / 3);
  const byRef = callsOf(F, LO, HI, eps);
  if (byRule.calls !== byRef.calls || Math.abs(byRule.x - byRef.x) > 1e-9) {
    throw new Error(
      `t = 1/3 규칙이 정본과 어긋난다 — eps=${eps}: ${byRule.x}/${byRule.calls} ≠ ${byRef.x}/${byRef.calls}`,
    );
  }
}

/* ───────── ① 두 점을 두 자리에 두고 같은 입력을 처리한다 ───────── */

function twoSpots(): string {
  const eps = 1e-6;
  const rows = (
    [
      ["구간의 1/4 · 3/4", 1 / 4],
      ["구간의 1/3 · 2/3", 1 / 3],
    ] as [string, number][]
  ).map(([name, t]) => {
    const r = runWithT(F, LO, HI, eps, t);
    return [name, String(r.calls), r.x.toFixed(9), sci(Math.abs(r.x - 2))];
  });
  const gap =
    (rows[0]?.[1] === undefined ? 0 : Number(rows[0][1])) -
    (rows[1]?.[1] === undefined ? 0 : Number(rows[1][1]));
  return table(
    ["두 점을 어디에 두는가", "f 호출", "반환값", "최솟점 2 와의 거리"],
    rows,
    `└ 같은 입력에서 호출이 ${gap} 번 적다`,
  );
}

/* ───────── ② 두 점의 자리를 여러 값으로 실제 시험한다 ───────── */

/** 계측기가 소수 여섯째 자리까지만 재는 경우. 반올림이라 실행마다 값이 같다. */
const coarse = (x: number): number => Math.round(F(x) * 1e6) / 1e6;

function spotRatio(): string {
  const eps = 1e-6;
  const SPOTS: [string, number][] = [
    ["1/6 · 5/6", 1 / 6],
    ["1/4 · 3/4", 1 / 4],
    ["1/3 · 2/3", 1 / 3],
    ["2/5 · 3/5", 2 / 5],
    ["0.49 · 0.51", 0.49],
    ["0.4999 · 0.5001", 0.4999],
    ["1/2 · 1/2", 1 / 2],
  ];
  const rows = SPOTS.map(([name, t]) => {
    const exact = runWithT(F, LO, HI, eps, t);
    const rough = runWithT(coarse, LO, HI, eps, t);
    return [
      name,
      (1 - t).toFixed(4),
      String(exact.steps),
      String(exact.calls),
      sci(Math.abs(exact.x - 2)),
      sci(Math.abs(rough.x - 2)),
    ];
  });
  return table(
    [
      "두 점의 자리",
      "축소율",
      "반복",
      "f 호출",
      "정확히 잰 f 의 오차",
      "여섯째 자리까지 잰 f 의 오차",
    ],
    rows,
    "└ 두 점이 겹치는 마지막 줄에서 답이 어긋난다",
  );
}

/* ───────── ③ 고정 입력의 자취 ───────── */

/**
 * 매 바퀴의 `lo`·`hi` 를 기록하는 사본. **정본 소스에서 기계로 만든다** — `third` 를 정하는
 * 그 한 줄에만 맞아야 하고, 아니면 `loadMutant` 이 던진다. 자취를 손으로 세면 「이 코드가
 * 그렇게 좁힌다」가 검사되지 않는다.
 */
const traced = await loadMutant<{
  ternarySearch(
    f: (x: number) => number,
    lo: number,
    hi: number,
    epsilon: number,
  ): number;
}>(REF, {
  swap: [
    /^(\s*)const third = \(hi - lo\) \/ 3;$/,
    '$1(globalThis as { __span?: [number, number][] }).__span?.push([lo, hi]);\n$1if (((globalThis as { __span?: [number, number][] }).__span?.length ?? 0) > 4000) throw new Error("STOP");\n$1const third = (hi - lo) / 3;',
  ],
});

/** 그 한 번의 호출이 지나온 `[lo, hi]` 들. 길이가 곧 반복 횟수다. */
function spans(
  f: (x: number) => number,
  lo: number,
  hi: number,
  eps: number,
): { rows: [number, number][]; x: number; stopped: boolean } {
  const g = globalThis as { __span?: [number, number][] };
  g.__span = [];
  let x = Number.NaN;
  let stopped = false;
  try {
    x = traced.ternarySearch(f, lo, hi, eps);
  } catch {
    stopped = true;
  }
  const rows = g.__span;
  if (!stopped) {
    const want = ternarySearch(f, lo, hi, eps);
    if (x !== want) {
      throw new Error(`계측한 사본이 정본과 다른 답을 냈다 — ${x} ≠ ${want}`);
    }
  }
  return { rows, x, stopped };
}

function walkTrace(): string {
  const { rows, x } = spans(F, LO, HI, 1);
  const body = rows.map(([lo, hi], i) => {
    const third = (hi - lo) / 3;
    const m1 = lo + third;
    const m2 = hi - third;
    const left = F(m1) < F(m2);
    return [
      `T${i + 2}`,
      lo.toFixed(4),
      hi.toFixed(4),
      m1.toFixed(4),
      m2.toFixed(4),
      F(m1).toFixed(4),
      F(m2).toFixed(4),
      left ? "① hi ← m2" : "② lo ← m1",
    ];
  });
  const last = rows[rows.length - 1] as [number, number];
  const thirdLast = (last[1] - last[0]) / 3;
  const endLo =
    F(last[0] + thirdLast) < F(last[1] - thirdLast)
      ? last[0]
      : last[0] + thirdLast;
  const endHi =
    F(last[0] + thirdLast) < F(last[1] - thirdLast)
      ? last[1] - thirdLast
      : last[1];
  return [
    table(
      ["단계", "lo", "hi", "m1", "m2", "f(m1)", "f(m2)", "갈래"],
      body,
      "└ 갈래 ① 과 ② 가 둘 다 실행됐다",
    ),
    "",
    `T${rows.length + 2}  lo = ${endLo.toFixed(4)}, hi = ${endHi.toFixed(4)}, 길이 ${(endHi - endLo).toFixed(4)} ≤ 1 이라 반복이 끝난다`,
    `      (lo + hi) / 2 = ${x.toFixed(4)} 를 돌려준다. 최솟점 2 와의 거리는 ${Math.abs(x - 2).toFixed(4)} 로 ε/2 = 0.5 안이다`,
  ].join("\n");
}

/* ───────── ④ third 를 반복 밖에서 한 번만 계산하면 ───────── */

/**
 * `third` 를 첫 바퀴 값에 묶어 두는 사본. **정본 소스에서 기계로 만든다.** 구간이 줄어도
 * 3분의 1 이 그대로라 두 내부점이 뒤집힌다.
 */
const frozen = await loadMutant<{
  ternarySearch(
    f: (x: number) => number,
    lo: number,
    hi: number,
    epsilon: number,
  ): number;
}>(REF, {
  swap: [
    /^(\s*)const third = \(hi - lo\) \/ 3;$/,
    "$1const box = globalThis as { __third?: number };\n$1box.__third ??= (hi - lo) / 3;\n$1const third = box.__third;",
  ],
});

function frozenOnce(
  f: (x: number) => number,
  lo: number,
  hi: number,
  eps: number,
): number {
  (globalThis as { __third?: number }).__third = undefined;
  return frozen.ternarySearch(f, lo, hi, eps);
}

const FROZEN_CASES: [string, (x: number) => number, number, number, number][] =
  [
    ["(x-2)²", F, 0, 9, 1],
    ["(x-2)²", F, 0, 9, 1e-9],
    ["(x-3)²+5", (x) => (x - 3) ** 2 + 5, -10, 10, 1e-9],
    ["|x-2|", (x) => Math.abs(x - 2), -10, 10, 1e-9],
  ];

const frozenRows = FROZEN_CASES.map(([name, f, lo, hi, eps]) => ({
  name,
  lo,
  hi,
  eps,
  right: ternarySearch(f, lo, hi, eps),
  wrong: frozenOnce(f, lo, hi, eps),
}));

// 하나도 안 어긋나면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (frozenRows.every((r) => r.right === r.wrong)) {
  throw new Error(
    "third 를 묶어 둔 사본이 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
  );
}

function thirdFrozen(): string {
  const wrong = frozenRows.filter((r) => r.right !== r.wrong).length;
  return table(
    ["f", "구간", "ε", "바른 코드", "third 를 한 번만 계산한 코드"],
    frozenRows.map((r) => [
      r.name,
      `[${r.lo}, ${r.hi}]`,
      showEps(r.eps),
      r.right.toFixed(6),
      r.wrong.toFixed(6),
    ]),
    wrong === frozenRows.length
      ? "└ 네 벌 다 답이 어긋난다"
      : `└ 네 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── ⑤ 두 함숫값이 정확히 같은 자리 ───────── */

const SQ = (x: number): number => x * x;

function tieValues(): string {
  const lo = -3;
  const hi = 3;
  const third = (hi - lo) / 3;
  const m1 = lo + third;
  const m2 = hi - third;
  if (SQ(m1) !== SQ(m2)) {
    throw new Error("동률을 보이려던 자리에서 두 함숫값이 같지 않다");
  }
  const eps = 0.5;
  const rows = [
    ["오른쪽 3분의 1 을 뺀다 (hi ← m2)", lo, m2],
    ["왼쪽 3분의 1 을 뺀다 (lo ← m1)", m1, hi],
  ] as [string, number, number][];
  return [
    `f(x) = x², 구간 [${lo}, ${hi}], ε = ${eps}`,
    `첫 바퀴에서 m1 = ${m1}, m2 = ${m2} 이고 f(m1) = ${SQ(m1)}, f(m2) = ${SQ(m2)} 로 정확히 같다`,
    "",
    table(
      [
        "어느 쪽을 뺐는가",
        "남은 구간",
        "끝까지 실행한 반환값",
        "최솟점 0 과의 거리",
      ],
      rows.map(([name, a, b]) => {
        const x = ternarySearch(SQ, a, b, eps);
        return [
          name,
          `[${a.toFixed(4)}, ${b.toFixed(4)}]`,
          x.toFixed(6),
          Math.abs(x).toFixed(6),
        ];
      }),
      "└ 둘 다 ε/2 = 0.25 안이다",
    ),
  ].join("\n");
}

/* ───────── ⑥ ε 를 줄이면 답이 그만큼 정확해지는가 ───────── */

function epsilonFloor(): string {
  const withConst = (x: number): number => (x - 3) ** 2 + 5;
  const bare = (x: number): number => (x - 3) ** 2;
  const rows = [1e-3, 1e-6, 1e-9, 1e-12, 1e-15].map((eps) => [
    showEps(eps),
    Math.abs(ternarySearch(withConst, -10, 10, eps) - 3).toExponential(2),
    Math.abs(ternarySearch(bare, -10, 10, eps) - 3).toExponential(2),
  ]);
  const stuck = spans(bare, -10, 10, 0);
  const last = stuck.rows[stuck.rows.length - 1] as [number, number];
  let repeat = stuck.rows.length;
  for (let i = 1; i < stuck.rows.length; i++) {
    const a = stuck.rows[i - 1] as [number, number];
    const b = stuck.rows[i] as [number, number];
    if (b[1] - b[0] === a[1] - a[0]) {
      repeat = i + 1;
      break;
    }
  }
  return [
    table(
      ["ε", "(x-3)²+5 의 오차", "(x-3)² 의 오차"],
      rows,
      "└ 상수 5 를 더한 쪽은 어느 지점부터 더 좋아지지 않는다",
    ),
    "",
    `ε = 0 으로 두면 (x-3)² 에서도 ${repeat} 바퀴째에 구간 길이가 ${(last[1] - last[0]).toExponential(2)} 에서 더 줄지 않는다`,
    `  lo = ${last[0]}, hi = ${last[1]} — 반복 조건 hi - lo > 0 이 계속 참이라 끝나지 않는다`,
  ].join("\n");
}

/* ───────── ⑦ 불변식을 지키던 줄을 한 칸 더 버리게 바꾸면 ───────── */

/**
 * `hi = m2` 를 `hi = m1` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히
 * 하나가 아니면 `loadMutant` 이 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const broken = await loadMutant<{
  ternarySearch(
    f: (x: number) => number,
    lo: number,
    hi: number,
    epsilon: number,
  ): number;
}>(REF, { swap: [/^(\s*)hi = m2;$/, "$1hi = m1;"] });

const MUTANT_CASES: [string, (x: number) => number, number, number, number][] =
  [
    ["(x-3)²+5", (x) => (x - 3) ** 2 + 5, -10, 10, 3],
    ["(x+7)²", (x) => (x + 7) ** 2, -20, 20, -7],
    ["(x-1.5)²+2", (x) => (x - 1.5) ** 2 + 2, 0, 10, 1.5],
    ["|x-2|", (x) => Math.abs(x - 2), -10, 10, 2],
  ];

const mutantRows = MUTANT_CASES.map(([name, f, lo, hi, star]) => ({
  name,
  lo,
  hi,
  star,
  right: ternarySearch(f, lo, hi, 1e-9),
  wrong: broken.ternarySearch(f, lo, hi, 1e-9),
}));

if (mutantRows.every((r) => r.right === r.wrong)) {
  throw new Error(
    "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
  );
}

function mutantHiM1(): string {
  const wrong = mutantRows.filter(
    (r) => Math.abs(r.right - r.wrong) > 1e-6,
  ).length;
  return table(
    ["f", "구간", "최솟점", "바른 코드", "hi = m1 로 적은 코드"],
    mutantRows.map((r) => [
      r.name,
      `[${r.lo}, ${r.hi}]`,
      String(r.star),
      r.right.toFixed(6),
      r.wrong.toFixed(6),
    ]),
    wrong === mutantRows.length
      ? "└ 네 벌 다 답이 어긋난다"
      : `└ 네 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── ⑧ 같은 입력에 ε 만 바꿔 보면 ───────── */

function epsSweep(): string {
  const rows = [1, 1e-3, 1e-6, 1e-9].map((eps) => {
    const r = callsOf(F, LO, HI, eps);
    const s = spans(F, LO, HI, eps);
    return [
      showEps(eps),
      String(s.rows.length),
      String(r.calls),
      r.x.toFixed(9),
      sci(Math.abs(r.x - 2)),
    ];
  });
  return table(
    ["ε", "바퀴", "f 호출", "반환값", "최솟점 2 와의 거리"],
    rows,
    "└ ε 을 10^9 배 조여도 바퀴 수는 열 배가 안 된다",
  );
}

/* ───────── ⑨ 반복 횟수를 정하는 것이 무엇인가 ───────── */

function shapeCalls(): string {
  const SHAPES: [string, (x: number) => number, number, number, number][] = [
    ["(x-2)²", F, 0, 9, 1e-6],
    ["|x-2|", (x) => Math.abs(x - 2), 0, 9, 1e-6],
    ["(x-2)⁴", (x) => (x - 2) ** 4, 0, 9, 1e-6],
    ["e^(x-2) + e^(2-x)", (x) => Math.exp(x - 2) + Math.exp(2 - x), 0, 9, 1e-6],
    ["(x-8)²", (x) => (x - 8) ** 2, 0, 9, 1e-6],
    ["(x-2)²", F, 0, 90, 1e-6],
    ["(x-2)²", F, 0, 9, 1e-9],
    ["(x-2)²", F, -1_000_000, 1_000_000, 1e-9],
  ];
  const rows = SHAPES.map(([name, f, lo, hi, eps]) => {
    const r = callsOf(f, lo, hi, eps);
    const s = spans(f, lo, hi, eps);
    return [
      name,
      `[${lo}, ${hi}]`,
      showEps(eps),
      String(s.rows.length),
      String(r.calls),
      String(Math.ceil(Math.log((hi - lo) / eps) / Math.log(1.5))),
    ];
  });
  return table(
    ["f 의 모양", "구간", "ε", "반복", "f 호출", "⌈log₁.₅(L/ε)⌉"],
    rows,
    "└ 반복 횟수는 f 가 아니라 L 과 ε 만 따라간다",
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 두 점을 두 자리에 두고 같은 입력을 처리했을 때의 계수. */
  "two-spots": twoSpots,
  /** `deep.build` ⑥ — 두 점의 자리를 일곱 가지로 두고 실제로 셌을 때 무엇이 갈리는가. */
  "spot-ratio": spotRatio,
  /** `deep.walk.step` — 고정 입력이 여섯 바퀴 동안 지나온 자취. */
  "walk-trace": walkTrace,
  /** `deep.walk.pause` — `third` 를 반복 밖으로 옮기면 무엇이 나오는가. */
  "third-frozen": thirdFrozen,
  /** `deep.walk.pause` — 두 함숫값이 정확히 같을 때 두 갈래가 각각 무엇을 내는가. */
  "tie-values": tieValues,
  /** `deep.walk.step` — 같은 입력에 ε 만 바꾸면 바퀴 수와 오차가 어떻게 움직이는가. */
  "eps-sweep": epsSweep,
  /** `deep.walk.pause` — ε 를 줄이면 답이 그만큼 정확해지는가. */
  "epsilon-floor": epsilonFloor,
  /**
   * `invariant` ③ — 「어긋난다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-hi-m1": mutantHiM1,
  /** `perf.worst` — 반복 횟수를 정하는 것이 f 의 모양인가 L 과 ε 인가. */
  "shape-calls": shapeCalls,
};
