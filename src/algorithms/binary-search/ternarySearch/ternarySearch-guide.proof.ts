/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/ternarySearch/ternarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  argminByGrid,
  d3,
  EPS_MIN,
  EPS_WALK,
  F,
  gridCalls,
  gridSearch,
  HI,
  L_MAX,
  LO,
  num,
  OPS_PER_SEC,
  type Round,
  STAR,
  TWO,
  trace,
  walkSteps,
} from "./ternarySearch-guide.fig.tsx";
import { ternarySearch } from "./ternarySearch-guide.ref.ts";

const REF = new URL("./ternarySearch-guide.ref.ts", import.meta.url).pathname;

type Fn = (x: number) => number;
type Search = {
  ternarySearch(f: Fn, lo: number, hi: number, e: number): number;
};

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

/** 지수 표기 — `1.05e-7`. */
const sci = (x: number): string => x.toExponential(2);

/** 허용 오차를 표에 적는 모양 — `1` 은 그대로, 나머지는 `10^-6` 꼴. */
const showEps = (eps: number): string => {
  if (eps === 0) return "0";
  const k = Math.log10(eps);
  return Number.isInteger(k) && k !== 0 ? `10^${k}` : String(eps);
};

/** `[0,9]` 꼴 구간 — 본문 표기와 같다(쉼표 뒤 공백 없음). */
const iv = (lo: number, hi: number): string => `[${d3(lo)},${d3(hi)}]`;

/** 고정폭 화면의 폭 — 한글·가나·한자는 두 칸이다. */
const width = (t: string): number =>
  [...t].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

/** 칸을 맞춘 줄들 — 열마다 가장 넓은 값에 맞춰 왼쪽 정렬하고, 열 사이는 세 칸이다. */
function align(rows: string[][], indent = ""): string[] {
  const w: number[] = [];
  for (const r of rows) {
    r.forEach((c, i) => {
      w[i] = Math.max(w[i] ?? 0, width(c));
    });
  }
  return rows.map(
    (r) =>
      indent +
      r
        .map((c, i) =>
          i === r.length - 1 ? c : c + " ".repeat((w[i] as number) - width(c)),
        )
        .join("   "),
  );
}

const 과와 = (x: string): string => josa(x, "과", "와");

const mark = { left: "①", right: "②" } as const;

const walk = () => trace(F, LO, HI, EPS_WALK);
const afterOf = (r: Round) =>
  r.branch === "left" ? { lo: r.lo, hi: r.m2 } : { lo: r.m1, hi: r.hi };

/** 걸음 번호 — T1 이 준비, 바퀴 k(0 부터)가 `T{k+2}`, 끝이 그다음. 필름·패널과 같다. */
const tOf = (k: number): string => `T${k + 2}`;
{
  const ids = walkSteps().map((s) => s.id);
  const rounds = walk().rounds.length;
  if (ids.length !== rounds + 2 || ids[1] !== tOf(0)) {
    throw new Error("걸음 번호가 필름과 어긋난다");
  }
}

/* ───────── 「아이디어를 떠올리는 과정」 ───────── */

/** 가장 단순한 방법의 호출 수를 과제 규모에서. */
function originCost(): string {
  const CASES: [number, number][] = [
    [9, 1e-6],
    [20, 1e-9],
    [L_MAX, EPS_MIN],
  ];
  const time = (calls: number): string => {
    const s = calls / OPS_PER_SEC;
    return s < 86_400
      ? `${s.toFixed(2)} 초`
      : `${num(Math.round(s))} 초 · 약 ${(s / 86_400).toFixed(0)} 일`;
  };
  const rows = CASES.map(([L, eps]) => {
    const calls = gridCalls(L, eps);
    return [num(L), showEps(eps), num(calls), time(calls)];
  });
  return [
    md(
      [
        "구간 길이 L",
        "허용 오차 ε",
        "격자 탐색의 f 호출",
        "걸리는 시간(초당 1 억 번)",
      ],
      rows,
      [0, 2, 3],
    ),
    "",
    "호출 수 ⌈L/ε⌉ + 1 은 작은 규모 두 벌에서 격자 탐색을 실제로 실행해 센 값과 같은 것을 확인했고, 표의 세 줄은 그 식으로 냈습니다.",
  ].join("\n");
}

/** 같은 입력을 두 방식으로 — 격자 탐색과 정본. */
function gridVsThirds(): string {
  const eps = 1e-6;
  const g = gridSearch(F, LO, HI, eps);
  const t = trace(F, LO, HI, eps);
  const rows = [
    ["격자 전부 재기", num(g.calls), g.x.toFixed(6), sci(Math.abs(g.x - STAR))],
    [
      "두 자리를 재고 3분의 1 빼기",
      num(t.calls),
      t.result.toFixed(6),
      sci(Math.abs(t.result - STAR)),
    ],
  ];
  return [
    md(
      ["방법", "f 호출", "반환값", `최솟점 ${STAR} 와의 거리`],
      rows,
      [1, 2, 3],
    ),
    "",
    `f(x) = (x-2)², 구간 [${LO},${HI}], ε = ${showEps(eps)} 로 두 방법을 실행했습니다. 둘 다 오차 ε 안의 답을 냈고, f 호출은 ${num(g.calls)} 번과 ${num(t.calls)} 번입니다.`,
  ].join("\n");
}

/* ───────── 「먼저 알아 둘 개념 — 단봉 함수」 ───────── */

/** 두 자리의 값 한 쌍이 최솟점에 대해 말해 주는 것. */
function readPair(): string {
  const PAIRS: [number, number][] = [
    [0, 1],
    [1, 3],
    [3, 6],
  ];
  const rows = PAIRS.map(([a, b]) => {
    const fa = F(a);
    const fb = F(b);
    const [cmp, says, ok] =
      fa > fb
        ? [">", `x* > ${a}`, STAR > a]
        : fa < fb
          ? ["<", `x* < ${b}`, STAR < b]
          : ["=", `${a} < x* < ${b}`, STAR > a && STAR < b];
    if (!ok) throw new Error(`쌍 (${a}, ${b}) 이 말한 것이 최솟점과 어긋난다`);
    return [`${a} · ${b}`, String(fa), String(fb), `f(a) ${cmp} f(b)`, says];
  });
  return [
    md(
      [
        "두 자리 a · b",
        "f(a)",
        "f(b)",
        "비교",
        "최솟점 x* 에 대해 알 수 있는 것",
      ],
      rows,
      [1, 2],
    ),
    "",
    `세 쌍 모두 알 수 있는 것이 실제 최솟점 ${STAR} 와 맞습니다.`,
  ].join("\n");
}

/** 봉우리가 하나인 함수와 둘인 함수를 같은 절차에 넣으면. */
function twoValleys(): string {
  const r0 = walk().rounds[0] as Round;
  const [m1, m2] = [r0.m1, r0.m2];
  const signs = (f: Fn): number => {
    let n = 0;
    let prev = 0;
    for (let x = LO; x < HI; x++) {
      const s = Math.sign(f(x + 1) - f(x));
      if (prev !== 0 && s !== prev) n++;
      prev = s;
    }
    return n;
  };
  const row = (name: string, f: Fn) => {
    const cut =
      f(m1) < f(m2) ? `(${m2},${HI}] 을 뺀다` : `[${LO},${m1}) 를 뺀다`;
    const got = ternarySearch(f, LO, HI, 1e-9);
    const low = argminByGrid(f, LO, HI, 1e-3);
    return [name, String(signs(f)), cut, got.toFixed(3), low.toFixed(3)];
  };
  const rows = [row("(x-2)²", F), row("g(x)", TWO)];
  const gGot = ternarySearch(TWO, LO, HI, 1e-9);
  const gLow = argminByGrid(TWO, LO, HI, 1e-3);
  if (Math.abs(gGot - gLow) < 0.5) {
    throw new Error(
      "봉우리가 둘인 함수에서 답이 어긋나지 않았다 — 대조가 서지 않는다",
    );
  }
  return [
    md(
      [
        "함수",
        "차이의 부호가 바뀐 횟수",
        `첫 바퀴(m1 = ${m1}, m2 = ${m2})`,
        "정본의 반환값",
        "가장 낮은 자리",
      ],
      rows,
      [1, 3, 4],
    ),
    "",
    `g(x) = min((x-1)², (x-7)² + 1) 이고, 가장 낮은 자리는 간격 0.001 로 전부 재서 찾았습니다. 정본은 ${gGot.toFixed(3)}${을를(gGot.toFixed(3))} 돌려주지만 g 가 가장 낮은 자리는 ${gLow.toFixed(3)} 입니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 단계들 ───────── */

function buildPoints(): string {
  const rs = walk().rounds;
  for (const r of rs) {
    if (!(r.lo < r.m1 && r.m1 < r.m2 && r.m2 < r.hi)) {
      throw new Error("두 내부점이 후보 안에서 순서대로 서지 않는다");
    }
  }
  const rows = rs.map((r, k) => [
    tOf(k),
    iv(r.lo, r.hi),
    d3(r.hi - r.lo),
    d3(r.third),
    d3(r.m1),
    d3(r.m2),
  ]);
  return [
    md(["바퀴", "후보", "길이", "third", "m1", "m2"], rows, [2, 3, 4, 5]),
    "",
    `${rs.length} 바퀴 모두 lo < m1 < m2 < hi 이고, third 는 그 바퀴 길이의 3분의 1 입니다.`,
  ].join("\n");
}

function buildCases(): string {
  const rs = walk().rounds;
  const less = rs.find((r) => r.branch === "left" && r.f1 !== r.f2) as Round;
  const lessK = rs.indexOf(less);
  const more = rs.find((r) => r.branch === "right") as Round;
  const moreK = rs.indexOf(more);
  const SQ: Fn = (x) => x * x;
  const tie = trace(SQ, -3, 3, 1e-9).rounds[0] as Round;
  if (tie.f1 !== tie.f2) throw new Error("동률 줄의 두 함숫값이 같지 않다");
  const row = (
    cmp: string,
    where: string,
    r: Round,
    star: number,
  ): string[] => {
    const a = afterOf(r);
    if (!(a.lo <= star && star <= a.hi)) {
      throw new Error(`${where} 에서 최솟점이 새 후보 밖으로 나갔다`);
    }
    return [
      cmp,
      where,
      `${d3(r.f1)} · ${d3(r.f2)}`,
      r.branch === "left" ? "hi = m2" : "lo = m1",
      iv(a.lo, a.hi),
      String(star),
    ];
  };
  return [
    md(
      ["비교 결과", "어디서", "f(m1) · f(m2)", "하는 일", "새 후보", "최솟점"],
      [
        row("f(m1) < f(m2)", `(x-2)² 의 ${tOf(lessK)}`, less, STAR),
        row("f(m1) > f(m2)", `(x-2)² 의 ${tOf(moreK)}`, more, STAR),
        row("f(m1) = f(m2)", "x² 를 [-3,3] 에서, 첫 바퀴", tie, 0),
      ],
      [5],
    ),
    "",
    "세 줄 모두 최솟점이 새 후보 안에 남습니다.",
  ].join("\n");
}

function buildShrink(): string {
  const rs = walk().rounds;
  const rows = rs.map((r, k) => {
    const a = afterOf(r);
    const before = r.hi - r.lo;
    const after = a.hi - a.lo;
    return [tOf(k), mark[r.branch], d3(before), d3(after), d3(after / before)];
  });
  const ratios = new Set(rows.map((r) => r[4]));
  if (ratios.size !== 1) throw new Error("바퀴마다 줄어드는 비율이 다르다");
  return [
    md(
      ["바퀴", "갈래", "바퀴 전 길이", "바퀴 뒤 길이", "뒤 ÷ 전"],
      rows,
      [2, 3, 4],
    ),
    "",
    `갈래 ① 과 ② 가 섞여 있어도 뒤 ÷ 전은 ${rows.length} 바퀴 모두 ${[...ratios][0]} 입니다.`,
  ].join("\n");
}

function buildStop(): string {
  const t = walk();
  const L = t.end.hi - t.end.lo;
  const dist = Math.abs(t.result - STAR);
  if (!(L <= EPS_WALK && dist <= EPS_WALK / 2)) {
    throw new Error("멈춘 자리의 길이나 오차가 약속과 다르다");
  }
  return [
    md(
      [
        "마지막 후보",
        "길이",
        "ε",
        "돌려준 중점",
        `최솟점 ${STAR} 와의 거리`,
        "ε/2",
      ],
      [
        [
          iv(t.end.lo, t.end.hi),
          d3(L),
          String(EPS_WALK),
          d3(t.result),
          d3(dist),
          String(EPS_WALK / 2),
        ],
      ],
      [1, 2, 3, 4, 5],
    ),
    "",
    `길이가 ε 이하가 된 뒤 중점을 돌려주었고, 최솟점과의 거리 ${d3(dist)}${이가(d3(dist))} ε/2 를 넘지 않습니다.`,
  ].join("\n");
}

/* ───────── 설계 선택 — 두 점의 자리 ───────── */

/** 두 내부점을 구간의 `t` 지점과 `1 - t` 지점에 두는 일반형. `t = 1/3` 줄은 정본과 대조한다. */
function runWithT(
  f: Fn,
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

// `t = 1/3` 줄이 정본과 다른 절차를 재고 있으면 아래 표가 헛돈다. 반환값은 마지막 자리까지 같지는
// 않다 — 정본이 `(hi - lo) / 3` 으로 적는 것을 여기서는 `t * (hi - lo)` 로 적어 반올림이 한 번 더
// 들어간다. 호출 수는 정확히 같아야 한다.
for (const eps of [1, 1e-6, 1e-9]) {
  const byRule = runWithT(F, LO, HI, eps, 1 / 3);
  const byRef = trace(F, LO, HI, eps);
  if (
    byRule.calls !== byRef.calls ||
    Math.abs(byRule.x - byRef.result) > 1e-9
  ) {
    throw new Error(`t = 1/3 규칙이 정본과 어긋난다 — eps=${eps}`);
  }
}

/** 계측기가 소수 여섯째 자리까지만 재는 경우. 반올림이라 실행마다 값이 같다. */
const coarse: Fn = (x) => Math.round(F(x) * 1e6) / 1e6;

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
      sci(Math.abs(exact.x - STAR)),
      sci(Math.abs(rough.x - STAR)),
    ];
  });
  return [
    md(
      [
        "두 점의 자리",
        "축소율",
        "반복",
        "f 호출",
        "정확히 잰 f 의 오차",
        "여섯째 자리까지 잰 f 의 오차",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `f(x) = (x-2)², 구간 [${LO},${HI}], ε = ${showEps(eps)} 에서 두 점의 자리만 바꿨습니다. 3분의 1 자리 줄의 호출 수는 정본을 실행한 값과 같습니다.`,
  ].join("\n");
}

/* ───────── 「수행으로 알아보는 알고리즘」 ───────── */

function walkInput(): string {
  const x = ternarySearch(F, LO, HI, EPS_WALK);
  return [
    "const f = (x: number) => (x - 2) ** 2;",
    `const lo = ${LO};`,
    `const hi = ${HI};`,
    `const epsilon = ${EPS_WALK};`,
    `// 이 절이 끝나면 약 ${d3(x)}${이가(d3(x))} 나와야 한다`,
  ].join("\n");
}

function walkInit(): string {
  const t = walk();
  const tiny = trace(F, 1, 1 + 1e-7, 1e-6);
  if (tiny.calls !== 0 || tiny.rounds.length !== 0) {
    throw new Error("처음부터 짧은 구간에서 반복에 들어갔다");
  }
  return [
    `lo = ${LO}, hi = ${HI}, ε = ${EPS_WALK}              →  ${HI} - ${LO} > ${EPS_WALK}${이가(EPS_WALK)} 참이라 반복에 들어간다  (바퀴 ${t.rounds.length} 번)`,
    "lo = 1, hi = 1.0000001, ε = 1e-6  →  길이 1e-7 > 1e-6 이 거짓이라 들어가지 않는다",
    `                                     f 호출 ${tiny.calls} 번, 중점 ${tiny.result.toFixed(8)}${을를(tiny.result.toFixed(8))} 그대로 돌려준다`,
  ].join("\n");
}

function walkPoints(): string {
  const [a, b] = walk().rounds as [Round, Round];
  return [
    `T1 의 상태 [${a.lo},${a.hi}] 에서    third = (${a.hi} - ${a.lo}) / 3 = ${a.third}    m1 = ${a.lo} + ${a.third} = ${a.m1}    m2 = ${a.hi} - ${a.third} = ${a.m2}`,
    `한 바퀴 뒤 [${b.lo},${b.hi}] 에서    third = (${b.hi} - ${b.lo}) / 3 = ${b.third}    m1 = ${b.lo} + ${b.third} = ${b.m1}    m2 = ${b.hi} - ${b.third} = ${b.m2}`,
    "                          └ 두 점이 새 구간 안으로 따라 들어온다",
  ].join("\n");
}

/* ───────── 짚고 가기 — third 를 반복 밖에서 한 번만 ───────── */

/**
 * `third` 를 첫 바퀴 값에 묶어 두는 사본. **정본 소스에서 기계로 만든다.** 구간이 줄어도 3분의 1 이
 * 그대로라 두 내부점이 뒤집힌다.
 */
const frozen = await loadMutant<Search>(REF, {
  swap: [
    /^(\s*)const third = \(hi - lo\) \/ 3;$/,
    "$1const box = globalThis as { __third?: number };\n$1box.__third ??= (hi - lo) / 3;\n$1const third = box.__third;",
  ],
});
/** 중화 실행에서는 변이가 정본 그대로다 — 그때 「어긋난다」 자기검사를 건너뛴다. */
const frozenLive = frozen.ternarySearch !== ternarySearch;

function frozenOnce(f: Fn, lo: number, hi: number, eps: number): number {
  (globalThis as { __third?: number }).__third = undefined;
  return frozen.ternarySearch(f, lo, hi, eps);
}

/** 묶어 둔 third 로 도는 바퀴를 셋까지. 끝값은 변이 사본의 답과 대조한다. */
function frozenTrace(): string {
  const third = (HI - LO) / 3;
  let lo = LO;
  let hi = HI;
  const rows: string[][] = [];
  for (let k = 1; k <= 3 && hi - lo > EPS_WALK; k++) {
    const m1 = lo + third;
    const m2 = hi - third;
    const [a, b] = [F(m1), F(m2)];
    const left = a < b;
    const cmp = a < b ? "<" : a === b ? "=" : ">";
    const next = left ? `hi = ${m2}` : `lo = ${m1}`;
    rows.push([
      `${k} 바퀴`,
      `lo = ${lo}, hi = ${hi}`,
      `m1 = ${m1}, m2 = ${m2}`,
      `f ${a} ${cmp} ${b}`,
      `→ ${mark[left ? "left" : "right"]} ${next}`,
    ]);
    if (left) hi = m2;
    else lo = m1;
  }
  if (frozenLive && (lo + hi) / 2 !== frozenOnce(F, LO, HI, EPS_WALK)) {
    throw new Error("다시 짚은 자취가 변이 사본의 답과 다르다");
  }
  return [
    `f(x) = (x-2)², 구간 [${LO},${HI}], third = ${third}${으로(third)} 고정했을 때`,
    "",
    ...align(rows, "  "),
    `  └ 세 바퀴째에 m1 이 m2 를 앞질렀다. lo 가 hi 와 만나 길이가 ${hi - lo} 이 된다`,
  ].join("\n");
}

const FROZEN_CASES: [string, Fn, number, number, number][] = [
  ["(x-2)²", F, 0, 9, 1],
  ["(x-2)²", F, 0, 9, 1e-9],
  ["(x-3)²+5", (x) => (x - 3) ** 2 + 5, -10, 10, 1e-9],
  ["\\|x-2\\|", (x) => Math.abs(x - 2), -10, 10, 1e-9],
];

function thirdFrozen(): string {
  const rows = FROZEN_CASES.map(([name, f, lo, hi, eps]) => ({
    name,
    lo,
    hi,
    eps,
    right: ternarySearch(f, lo, hi, eps),
    wrong: frozenOnce(f, lo, hi, eps),
  }));
  const bad = rows.filter((r) => Math.abs(r.right - r.wrong) > 1e-6).length;
  if (frozenLive && bad === 0) {
    throw new Error("third 를 묶은 사본이 어느 입력에서도 답을 바꾸지 못했다");
  }
  return [
    md(
      ["f", "구간", "ε", "바른 코드", "third 를 한 번만 계산한 코드"],
      rows.map((r) => [
        r.name,
        `[${r.lo},${r.hi}]`,
        showEps(r.eps),
        r.right.toFixed(6),
        r.wrong.toFixed(6),
      ]),
      [3, 4],
    ),
    "",
    `네 벌 중 ${bad} 벌에서 두 코드의 답이 소수 여섯째 자리 안에서 다릅니다.`,
  ].join("\n");
}

function walkKeepM2(): string {
  const r = walk().rounds[0] as Round;
  const a = afterOf(r);
  return [
    `T2 에서 f(${r.m1}) = ${r.f1} < f(${r.m2}) = ${r.f2}${이가(r.f2)} 참이라 갈래 ① 을 실행하면`,
    "",
    `  hi = m2 = ${a.hi}    후보 [${a.lo},${a.hi}]    길이 ${r.hi - r.lo} → ${a.hi - a.lo}.   m2 = ${r.m2}${은는(r.m2)} 후보에 남는다`,
  ].join("\n");
}

/* ───────── 짚고 가기 — 두 함숫값이 같을 때 ───────── */

function tieValues(): string {
  const SQ: Fn = (x) => x * x;
  const lo = -3;
  const hi = 3;
  const eps = 0.5;
  const r = trace(SQ, lo, hi, eps).rounds[0] as Round;
  if (r.f1 !== r.f2) {
    throw new Error("동률을 보이려던 자리에서 두 함숫값이 같지 않다");
  }
  const rows = (
    [
      ["오른쪽 3분의 1 을 뺀다 (hi = m2)", lo, r.m2],
      ["왼쪽 3분의 1 을 뺀다 (lo = m1)", r.m1, hi],
    ] as [string, number, number][]
  ).map(([name, a, b]) => {
    const x = ternarySearch(SQ, a, b, eps);
    if (Math.abs(x) > eps / 2) throw new Error("동률 갈래가 오차를 넘었다");
    return [name, `[${a},${b}]`, x.toFixed(6), Math.abs(x).toFixed(6)];
  });
  return [
    `f(x) = x², 구간 [${lo},${hi}], ε = ${eps} 의 첫 바퀴에서 m1 = ${r.m1}, m2 = ${r.m2} 이고 f(m1) = ${r.f1}, f(m2) = ${r.f2} 로 정확히 같습니다.`,
    "",
    md(
      ["뺀 쪽", "남은 구간", "끝까지 실행한 반환값", "최솟점 0 과의 거리"],
      rows,
      [2, 3],
    ),
    "",
    `두 갈래 모두 최솟점과의 거리가 ε/2 = ${eps / 2} 안입니다.`,
  ].join("\n");
}

function nearTie(): string {
  const rs = walk().rounds;
  const k = rs.findIndex((r) => d3(r.f1) === d3(r.f2));
  const r = rs[k] as Round;
  if (!(r.f1 < r.f2)) throw new Error("근소한 동률 바퀴가 갈래 ① 이 아니다");
  return [
    `${tOf(k)} — 후보 [${d3(r.lo)},${d3(r.hi)}]`,
    "",
    ...align(
      [
        [`m1 = ${r.m1}`, `f(m1) = ${r.f1}`],
        [`m2 = ${r.m2}`, `f(m2) = ${r.f2}`],
      ],
      "  ",
    ),
    `  └ 두 값의 차이 ${sci(r.f2 - r.f1)}.  수학적으로는 같고 부동소수점에서는 다르다`,
  ].join("\n");
}

/* ───────── 여섯 바퀴를 끝까지 ───────── */

function walkTrace(): string {
  const t = walk();
  const rows: string[][] = [
    [
      "T1",
      "후보를 입력 구간 그대로",
      `\`${HI} - ${LO} > ${EPS_WALK}\`${이가(EPS_WALK)} **참**`,
      String(LO),
      String(HI),
      String(HI - LO),
    ],
  ];
  t.rounds.forEach((r, k) => {
    const a = afterOf(r);
    const same = d3(r.f1) === d3(r.f2);
    const judge =
      r.branch === "left"
        ? same
          ? "셋째 자리까지 같고 마지막 자리에서 **참** → ①"
          : `\`${d3(r.f1)} < ${d3(r.f2)}\` **참** → ①`
        : `\`${d3(r.f1)} < ${d3(r.f2)}\` **거짓** → ②`;
    rows.push([
      tOf(k),
      `f(${d3(r.m1)}) = ${d3(r.f1)}, f(${d3(r.m2)}) = ${d3(r.f2)}`,
      judge,
      d3(a.lo),
      d3(a.hi),
      d3(a.hi - a.lo),
    ]);
  });
  const L = t.end.hi - t.end.lo;
  rows.push([
    tOf(t.rounds.length),
    "반복 조건을 본다",
    `\`${d3(L)} > ${EPS_WALK}\`${이가(EPS_WALK)} **거짓** → 중점 ${d3(t.result)}`,
    d3(t.end.lo),
    d3(t.end.hi),
    d3(L),
  ]);
  const left = t.rounds.filter((r) => r.branch === "left").length;
  const right = t.rounds.length - left;
  if (left === 0 || right === 0) throw new Error("두 갈래가 다 나오지 않았다");
  return [
    md(["단계", "하는 일", "조건 판정", "lo", "hi", "길이"], rows, [3, 4, 5]),
    "",
    `갈래 ① 이 ${left} 번, ② 가 ${right} 번 나왔고 f 는 ${t.calls} 번 불렸습니다. 돌려준 ${d3(t.result)}${과와(d3(t.result))} 최솟점 ${STAR} 의 거리는 ${d3(Math.abs(t.result - STAR))} 입니다.`,
  ].join("\n");
}

function epsSweep(): string {
  const rows = [1, 1e-3, 1e-6, 1e-9].map((eps) => {
    const t = trace(F, LO, HI, eps);
    return [
      showEps(eps),
      String(t.rounds.length),
      String(t.calls),
      t.result.toFixed(9),
      sci(Math.abs(t.result - STAR)),
    ];
  });
  return [
    md(
      ["ε", "바퀴", "f 호출", "반환값", `최솟점 ${STAR} 와의 거리`],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `ε 을 1 에서 10^-9 로 조였을 때 바퀴는 ${rows[0]?.[1]} 번에서 ${rows[3]?.[1]} 번이 됐습니다.`,
  ].join("\n");
}

/* ───────── 짚고 가기 — ε 를 작게 줄수록 ───────── */

const WITH_C: Fn = (x) => (x - 3) ** 2 + 5;
const BARE: Fn = (x) => (x - 3) ** 2;

/** ε = 0 으로 돌린 자취 — 구간이 처음으로 앞 바퀴와 같아지는 바퀴와 그 상태. */
function stuck() {
  const t = trace(BARE, -10, 10, 0);
  if (!t.stopped) throw new Error("ε = 0 인데 반복이 끝났다");
  for (let i = 1; i < t.rounds.length; i++) {
    const a = t.rounds[i - 1] as Round;
    const b = t.rounds[i] as Round;
    if (a.lo === b.lo && a.hi === b.hi) return { round: i + 1, r: b };
  }
  throw new Error("ε = 0 에서 상태가 멈춘 바퀴가 없다");
}

function epsilonFloor(): string {
  const rows = [1e-3, 1e-6, 1e-9, 1e-12, 1e-15].map((eps) => [
    showEps(eps),
    sci(Math.abs(ternarySearch(WITH_C, -10, 10, eps) - 3)),
    sci(Math.abs(ternarySearch(BARE, -10, 10, eps) - 3)),
  ]);
  const s = stuck();
  return [
    md(["ε", "(x-3)²+5 의 오차", "(x-3)² 의 오차"], rows, [1, 2]),
    "",
    `두 함수 모두 구간 [-10,10] 에서 찾았고 최솟점은 3 입니다. ε = 0 으로 두면 (x-3)² 에서도 ${s.round} 바퀴째의 구간이 앞 바퀴와 같습니다 — lo = ${s.r.lo}, hi = ${s.r.hi}, 길이 ${sci(s.r.hi - s.r.lo)} 에서 반복 조건 hi - lo > 0 이 계속 참이라 끝나지 않습니다.`,
  ].join("\n");
}

function epsilonDelta(): string {
  const rows = [1e-4, 1e-7, 1e-8].map((d) => {
    const gap = WITH_C(3 + d) - 5;
    const tail =
      gap === 0 ? "5 와 같은 값이 된다 → 비교가 뜻을 잃는다" : "5 와 구별된다";
    return [`δ = ${sci(d)}`, `f(3 + δ) - 5 = ${sci(gap)}`, tail];
  });
  return [
    "f(x) = (x-3)² + 5 에서 최솟점 3 으로부터 δ 떨어진 자리의 값",
    "",
    ...align(rows, "  "),
    "  └ 상수항이 없는 (x-3)² 는 이 자리가 없어서 계속 좋아진다",
  ].join("\n");
}

function epsilonStuck(): string {
  const { r } = stuck();
  return [
    `lo = ${r.lo}, hi = ${r.hi} 에서`,
    "",
    ...align(
      [
        ["third = (hi - lo) / 3", `→ ${sci(r.third)}`, ""],
        [
          "m1 = lo + third",
          `→ ${r.m1}`,
          r.m1 === r.lo ? "lo 로 반올림된다" : "",
        ],
        [
          "m2 = hi - third",
          `→ ${r.m2}`,
          r.m2 === r.hi ? "hi 로 반올림된다" : "",
        ],
      ],
      "  ",
    ).map((l) => l.trimEnd()),
    "  └ 어느 갈래로 가도 lo 와 hi 가 그대로다. 상태가 안 변해 반복이 끝나지 않는다",
  ].join("\n");
}

function finalCalls(): string {
  const CALLS: [string, Fn, number, number, number][] = [
    ["(x) => (x - 2) ** 2, 0, 9, 1", F, 0, 9, 1],
    ["(x) => (x - 3) ** 2 + 5, -10, 10, 1e-9", WITH_C, -10, 10, 1e-9],
    [
      "(x) => Math.abs(x - 2), -10, 10, 1e-9",
      (x) => Math.abs(x - 2),
      -10,
      10,
      1e-9,
    ],
    ["(x) => (x - 2) ** 2, 1, 1.0000001, 1e-6", F, 1, 1.0000001, 1e-6],
  ];
  const lines = CALLS.map(([args, f, lo, hi, eps]) => {
    const t = trace(f, lo, hi, eps);
    return [
      `ternarySearch(${args})`,
      `→   ${t.result.toFixed(6)}  (f 호출 ${t.calls} 번)`,
    ] as const;
  });
  const w = Math.max(...lines.map(([a]) => a.length));
  return [...lines.map(([a, b]) => `${a.padEnd(w)}   ${b}`)].join("\n");
}

/* ───────── 알아 두면 좋은 개념 — 선형 수렴 ───────── */

function relatedLengths(): string {
  const t = walk();
  const ls = [HI - LO, ...t.rounds.map((r) => afterOf(r).hi - afterOf(r).lo)];
  const ratios = ls.slice(1).map((l, i) => l / (ls[i] as number));
  return [
    `길이   ${ls.map(d3).join("  →  ")}`,
    `비율   ${ratios.map(d3).join("  ·  ")}`,
    "       └ 어느 바퀴에서나 다음 길이가 앞 길이의 같은 비율이다",
  ].join("\n");
}

function relatedRates(): string {
  const ratio = 1e9;
  const K = (r: number): number => Math.ceil(Math.log(ratio) / Math.log(1 / r));
  const byRef = trace(F, 0, 1, 1 / ratio).rounds.length;
  if (byRef !== K(2 / 3)) {
    throw new Error(`삼진 탐색 줄이 정본 실행 ${byRef} 과 다르다`);
  }
  const golden = (Math.sqrt(5) - 1) / 2;
  const rows = [
    ["이분법 (부호가 바뀌는 자리 찾기)", "1", "0.5", String(K(0.5))],
    ["삼진 탐색 (이 가이드)", "2", d3(2 / 3), String(K(2 / 3))],
    ["황금 분할 탐색", "1", d3(golden), String(K(golden))],
  ];
  return [
    md(
      [
        "같은 이름이 나오는 자리",
        "한 반복에 재는 횟수",
        "축소율 r",
        "L/ε = 10^9 일 때 반복",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `반복 수는 ⌈ln(10^9) / ln(1/r)⌉ 로 냈고, 삼진 탐색 줄은 정본을 L = 1, ε = 10^-9 로 실행해 센 ${byRef} 번과 같습니다.`,
  ].join("\n");
}

/* ───────── 수식 정의와 유도 ───────── */

const Kof = (L: number, eps: number, t: number): number =>
  Math.ceil(Math.log(L / eps) / Math.log(1 / (1 - t)));

function mathCheck(): string {
  const t = walk();
  const L0 = HI - LO;
  const lens = t.rounds.map((r) => afterOf(r).hi - afterOf(r).lo);
  const show = [1, 2, 3, t.rounds.length];
  const lines = show.map((k) => {
    const byRule = (2 / 3) ** k * L0;
    const real = lens[k - 1] as number;
    if (Math.abs(byRule - real) > 1e-12) {
      throw new Error(`L_${k} 이 실행과 다르다`);
    }
    return `L_${k} = (2/3)^${k} · ${L0}   = ${d3(byRule)}`;
  });
  return [
    ...lines,
    `                     └ 파트 1 의 ${tOf(t.rounds.length - 1)} 이 남긴 길이 ${d3(lens.at(-1) as number)}${과와(d3(lens.at(-1) as number))} 같은 값이다`,
  ].join("\n");
}

function mathCode(): string {
  const CASES: [string, number, number][] = [
    ["9, 1e-6", 9, 1e-6],
    ["9, 1e-9", 9, 1e-9],
    ["2e6, 1e-9", 2e6, 1e-9],
  ];
  return [
    "const K = (L: number, eps: number, t: number): number =>",
    "  Math.ceil(Math.log(L / eps) / Math.log(1 / (1 - t)));",
    "",
    ...CASES.map(
      ([args, L, e]) => `K(${args}, 1 / 3); // → ${Kof(L, e, 1 / 3)}`,
    ),
  ].join("\n");
}

function mathSqrt(): string {
  const golden = (Math.sqrt(5) - 1) / 2;
  return [
    `t = 1/3     r = ${(2 / 3).toFixed(4)}   √r = ${Math.sqrt(2 / 3).toFixed(4)}`,
    `t = 0.49    r = ${(0.51).toFixed(4)}   √r = ${Math.sqrt(0.51).toFixed(4)}`,
    `황금 분할   r = ${golden.toFixed(4)}   한 번 재고 r 배 → ${golden.toFixed(4)}`,
    "            └ 반복당 축소율은 삼진 탐색이 더 작은데, 호출당으로 보면 황금 분할이 더 작다",
  ].join("\n");
}

function mathClosed(): string {
  const CASES: [number, number, number, number][] = [
    [9, 1e-6, 0, 9],
    [20, 1e-9, -10, 10],
    [L_MAX, EPS_MIN, -L_MAX / 2, L_MAX / 2],
  ];
  const rows = CASES.map(([L, eps, lo, hi]) => {
    const K = Kof(L, eps, 1 / 3);
    const real = trace(F, lo, hi, eps).rounds.length;
    if (real !== K) {
      throw new Error(`K(${L}, ${eps}) = ${K} 이 실행 ${real} 과 다르다`);
    }
    return [
      num(L),
      showEps(eps),
      Math.log(L / eps).toFixed(2),
      String(K),
      String(2 * K),
      num(gridCalls(L, eps)),
    ];
  });
  return [
    md(
      ["L", "ε", "ln(L/ε)", "K", "f 호출 2K", "격자 탐색의 f 호출"],
      rows,
      [0, 2, 3, 4, 5],
    ),
    "",
    "K 는 닫힌 형태로 냈고, 세 줄 모두 정본을 그 구간과 ε 로 실행해 센 바퀴 수와 같습니다.",
  ].join("\n");
}

/* ───────── 불변식 ───────── */

function invariantShrink(): string {
  const t = walk();
  const lines = t.rounds.map((r, k) => {
    const a = afterOf(r);
    const L = d3(r.hi - r.lo);
    return `  L = ${L.padEnd(6)} →  (2/3) · ${L.padEnd(6)} = ${d3(a.hi - a.lo).padEnd(6)}  ${tOf(k)}`;
  });
  const lastL = t.end.hi - t.end.lo;
  return [
    "구간 길이가 매 바퀴 주는 것을 값으로",
    "",
    ...lines,
    `  L = ${d3(lastL)} ≤ ε = ${EPS_WALK}  →  반복 조건 hi - lo > ε 가 거짓이 된다  ${tOf(t.rounds.length)}`,
  ].join("\n");
}

function invariantEdges(): string {
  const branches = (tr: ReturnType<typeof trace>) => {
    const l = tr.rounds.filter((r) => r.branch === "left").length;
    return { l, r: tr.rounds.length - l };
  };
  const nearL = trace((x) => (x - 0.5) ** 2, 0, 100, 1e-9);
  const nearR = trace((x) => (x - 99.5) ** 2, 0, 100, 1e-9);
  const neg = trace((x) => (x + 50) ** 2, -100, -1, 1e-9);
  const narrow = trace(WITH_C, 2.999, 3.001, 1e-12);
  const wide = trace(WITH_C, -1_000_000, 1_000_000, 1e-9);
  const kink = trace((x) => Math.abs(x - 2), -10, 10, 1e-9);
  const tiny = trace(F, 1, 1 + 1e-7, 1e-6);
  const bL = branches(nearL);
  const bR = branches(nearR);
  const r6 = (x: number): string => String(Math.round(x * 1e6) / 1e6);
  const rows = [
    [
      "시작할 때 이미 `hi - lo <= ε`",
      "반복 조건이 처음부터 거짓",
      `f 호출 ${tiny.calls} 번, 중점 그대로`,
    ],
    [
      "최솟점이 왼쪽 끝 근처 — `(x-0.5)²` 를 `[0,100]` 에서",
      `\`hi = m2\` ${bL.l} 번 · \`lo = m1\` ${bL.r} 번`,
      r6(nearL.result),
    ],
    [
      "최솟점이 오른쪽 끝 근처 — `(x-99.5)²` 를 `[0,100]` 에서",
      `\`hi = m2\` ${bR.l} 번 · \`lo = m1\` ${bR.r} 번`,
      r6(nearR.result),
    ],
    [
      "음수 구간만 — `(x+50)²` 를 `[-100,-1]` 에서",
      "비교 연산자만 쓰므로 부호와 무관",
      r6(neg.result),
    ],
    [
      "아주 좁은 구간 — `(x-3)²+5` 를 `[2.999,3.001]`, `ε = 10^-12` 에서",
      `첫 길이가 0.002 라 바퀴 ${narrow.rounds.length} 번`,
      r6(narrow.result),
    ],
    [
      "아주 넓은 구간 — `(x-3)²+5` 를 `[-10^6,10^6]`, `ε = 10^-9` 에서",
      `바퀴 ${wide.rounds.length} 번, 호출 ${wide.calls} 번`,
      r6(wide.result),
    ],
    [
      "미분 불가능한 자리 — `\\|x-2\\|` 를 `[-10,10]` 에서",
      "도함수를 쓰지 않으므로 그대로 성립",
      r6(kink.result),
    ],
  ];
  return [
    md(["입력", "처리되는 자리", "결과"], rows),
    "",
    "결과 열은 정본의 반환값을 소수 여섯째 자리에서 반올림한 것입니다.",
  ].join("\n");
}

/**
 * `hi = m2` 를 `hi = m1` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가
 * 아니면 `loadMutant` 이 던진다.
 */
const broken = await loadMutant<Search>(REF, {
  swap: [/^(\s*)hi = m2;$/, "$1hi = m1;"],
});
const brokenLive = broken.ternarySearch !== ternarySearch;

const MUTANT_CASES: [string, Fn, number, number, number][] = [
  ["(x-3)²+5", WITH_C, -10, 10, 3],
  ["(x+7)²", (x) => (x + 7) ** 2, -20, 20, -7],
  ["(x-1.5)²+2", (x) => (x - 1.5) ** 2 + 2, 0, 10, 1.5],
  ["\\|x-2\\|", (x) => Math.abs(x - 2), -10, 10, 2],
];

function mutantHiM1(): string {
  const rows = MUTANT_CASES.map(([name, f, lo, hi, star]) => ({
    name,
    lo,
    hi,
    star,
    right: ternarySearch(f, lo, hi, 1e-9),
    wrong: broken.ternarySearch(f, lo, hi, 1e-9),
  }));
  const bad = rows.filter((r) => Math.abs(r.right - r.wrong) > 1e-6).length;
  if (brokenLive && bad === 0) {
    throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  return [
    md(
      ["f", "구간", "최솟점", "바른 코드", "hi = m1 로 적은 코드"],
      rows.map((r) => [
        r.name,
        `[${r.lo},${r.hi}]`,
        String(r.star),
        r.right.toFixed(6),
        r.wrong.toFixed(6),
      ]),
      [2, 3, 4],
    ),
    "",
    `네 벌 중 ${bad} 벌에서 두 코드의 답이 소수 여섯째 자리 안에서 다릅니다.`,
  ].join("\n");
}

function invariantMutantTrace(): string {
  const t = trace(WITH_C, -10, 10, 1e-9);
  const k = t.rounds.findIndex((r) => r.branch === "left");
  const r = t.rounds[k] as Round;
  if (!(r.m1 < 3 && 3 <= r.m2)) {
    throw new Error("변이가 최솟점을 빼는 바퀴가 아니다");
  }
  return [
    `(x-3)²+5 를 [-10,10] 에서 — 처음으로 hi = m2 를 실행하는 ${k + 1} 번째 바퀴`,
    `후보 [${d3(r.lo)},${d3(r.hi)}]   m1 = ${d3(r.m1)}, m2 = ${d3(r.m2)}   f(m1) = ${d3(r.f1)} < f(m2) = ${d3(r.f2)}`,
    "",
    `  hi = m2 = ${d3(r.m2)}   후보 [${d3(r.lo)},${d3(r.m2)}]   최솟점 3 이 후보에 남는다`,
    `  hi = m1 = ${d3(r.m1)}   후보 [${d3(r.lo)},${d3(r.m1)}]   최솟점 3 이 빠졌다`,
    "                          └ 「x* 는 m2 이하다」가 「x* 는 m1 이하다」로 강해졌다. 근거가 없다",
  ].join("\n");
}

/* ───────── 비용 계산 ───────── */

function perfDerive(): string {
  const t = walk();
  const lines = t.rounds.map((r, k) => {
    const a = afterOf(r);
    const head = `${tOf(k)}  m1 = ${d3(r.m1)} · m2 = ${d3(r.m2)} 에서 잰다`;
    return `${head.padEnd(36)}재기 2 번    길이 ${d3(r.hi - r.lo)} → ${d3(a.hi - a.lo)}`;
  });
  return [
    ...lines,
    `                                    └ 합 ${t.calls} 번.  ${tOf(t.rounds.length)} 은 조건만 보고 끝난다`,
  ].join("\n");
}

function shapeCalls(): string {
  const SHAPES: [string, Fn, number, number, number][] = [
    ["(x-2)²", F, 0, 9, 1e-6],
    ["\\|x-2\\|", (x) => Math.abs(x - 2), 0, 9, 1e-6],
    ["(x-2)⁴", (x) => (x - 2) ** 4, 0, 9, 1e-6],
    ["e^(x-2) + e^(2-x)", (x) => Math.exp(x - 2) + Math.exp(2 - x), 0, 9, 1e-6],
    ["(x-8)²", (x) => (x - 8) ** 2, 0, 9, 1e-6],
    ["(x-2)²", F, 0, 90, 1e-6],
    ["(x-2)²", F, 0, 9, 1e-9],
    ["(x-2)²", F, -1_000_000, 1_000_000, 1e-9],
  ];
  const rows = SHAPES.map(([name, f, lo, hi, eps]) => {
    const t = trace(f, lo, hi, eps);
    const K = Kof(hi - lo, eps, 1 / 3);
    if (K !== t.rounds.length) {
      throw new Error(`${name} 의 바퀴 수가 닫힌 형태와 다르다`);
    }
    return [
      name,
      `[${num(lo)},${num(hi)}]`,
      showEps(eps),
      String(t.rounds.length),
      String(t.calls),
      String(K),
    ];
  });
  return [
    md(
      ["f 의 모양", "구간", "ε", "바퀴", "f 호출", "⌈ln(L/ε) / ln 1.5⌉"],
      rows,
      [3, 4, 5],
    ),
    "",
    `바퀴와 f 호출은 정본을 실행해 셌고, 마지막 열은 닫힌 형태입니다. ${rows.length} 줄 모두 바퀴와 닫힌 형태가 같습니다.`,
  ].join("\n");
}

function perfRatio(): string {
  const ln15 = Math.log(1.5);
  const ln10 = Math.log(10);
  const ln1000 = Math.log(1000);
  return [
    "바퀴 수를 정하는 것 하나 — 비율 L/ε",
    "",
    ...align(
      [
        [
          "L 을 10 배로",
          `ln(L/ε) 가 ln 10 = ${ln10.toFixed(2)} 만큼 는다`,
          `→ 바퀴가 ${ln10.toFixed(2)} / ${ln15.toFixed(4)} ≈ ${(ln10 / ln15).toFixed(1)} 번 는다`,
        ],
        [
          "ε 을 1/1000 로",
          `ln(L/ε) 가 ln 1000 = ${ln1000.toFixed(2)} 만큼 는다`,
          `→ 바퀴가 ${ln1000.toFixed(2)} / ${ln15.toFixed(4)} ≈ ${(ln1000 / ln15).toFixed(1)} 번 는다`,
        ],
        ["f 를 바꾸면", "ln(L/ε) 가 그대로다", "→ 바퀴가 그대로다"],
      ],
      "  ",
    ),
  ].join("\n");
}

function perfNonstop(): string {
  const worst = trace(F, -L_MAX / 2, L_MAX / 2, EPS_MIN);
  const s = stuck();
  return [
    "비용의 최악과 끝나지 않는 입력은 다르다",
    "",
    ...align(
      [
        [
          "비용의 최악",
          `L = ${num(L_MAX)}, ε = 10^-9`,
          `→ ${worst.rounds.length} 바퀴, f 호출 ${worst.calls} 번으로 끝난다`,
        ],
        [
          "끝나지 않음",
          "ε = 0",
          `→ ${s.round} 바퀴째에 길이가 ${sci(s.r.hi - s.r.lo)} 에서 안 줄고 반복이 남는다`,
        ],
      ],
      "  ",
    ),
    "  └ 비용이 큰 것이 아니라 안 끝난다. ε > 0 이어야 하는 이유가 이것이다",
  ].join("\n");
}

/* ───────── 스스로 점검하기 ───────── */

function selfcheckT5(): string {
  const rs = walk().rounds;
  const k = rs.findIndex((r) => r.branch === "right");
  const r = rs[k] as Round;
  return [
    `${tOf(k)}  후보 [${d3(r.lo)},${d3(r.hi)}]  m1 = ${d3(r.m1)}, m2 = ${d3(r.m2)}   →  ②  lo = m1 = ${d3(r.m1)}   후보 [${d3(r.m1)},${d3(r.hi)}]`,
    `                                                   lo = m2 = ${d3(r.m2)} ← 이렇게 적었다면?`,
  ].join("\n");
}

/** `lo = m1` 을 `lo = m2` 로 바꾼 사본. 정본 소스에서 기계로 만든다. */
const overcut = await loadMutant<Search>(REF, {
  swap: [/^(\s*)lo = m1;$/, "$1lo = m2;"],
});

function selfcheckLoM2(): string {
  const rs = walk().rounds;
  const k = rs.findIndex((r) => r.branch === "right");
  const r = rs[k] as Round;
  const walkWrong = overcut.ternarySearch(F, LO, HI, EPS_WALK);
  const walkRight = ternarySearch(F, LO, HI, EPS_WALK);
  const F5: Fn = (x) => (x - 5) ** 2;
  const r5 = trace(F5, 0, 9, 1e-9).rounds[0] as Round;
  const right5 = ternarySearch(F5, 0, 9, 1e-9);
  const wrong5 = overcut.ternarySearch(F5, 0, 9, 1e-9);
  return [
    `전개 입력 — ${tOf(k)} 에서 lo = m2 = ${d3(r.m2)} 로 적으면 후보 [${d3(r.m2)},${d3(r.hi)}], 길이 ${d3(r.hi - r.m2)}`,
    `  바른 코드 ${d3(walkRight)}    lo = m2 로 적은 코드 ${d3(walkWrong)}    최솟점 ${STAR}`,
    "",
    `f(x) = (x-5)², 구간 [0,9], ε = 10^-9 — 첫 바퀴 m1 = ${r5.m1}, m2 = ${r5.m2}, f(${r5.m1}) = ${r5.f1} > f(${r5.m2}) = ${r5.f2}`,
    `  lo = m1 = ${r5.m1}   후보 [${r5.m1},9]   최솟점 5 가 남는다   →  반환 ${right5.toFixed(6)}`,
    `  lo = m2 = ${r5.m2}   후보 [${r5.m2},9]   최솟점 5 가 빠진다   →  반환 ${wrong5.toFixed(6)}`,
    "                              └ 이후 어느 바퀴도 5 를 다시 후보에 넣지 못한다",
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에서 수치로 반박한다. */
  "origin-cost": originCost,
  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리하고 f 호출을 나란히 센다. */
  "origin-grid-vs-thirds": gridVsThirds,
  /** `deep.build` 개념 (c) — 두 자리의 값 한 쌍이 말해 주는 것. */
  "build-read-pair": readPair,
  /** `deep.build` 개념 (e) — 봉우리가 둘인 함수에서 같은 절차가 내는 답. */
  "build-two-valleys": twoValleys,
  /** `deep.build` 2단계 — 바퀴마다 third 와 두 내부점. */
  "build-points": buildPoints,
  /** `deep.build` 3단계 — 비교 결과 세 갈래와 새 후보. */
  "build-cases": buildCases,
  /** `deep.build` 3단계 — 어느 갈래든 길이가 같은 비율로 준다. */
  "build-shrink": buildShrink,
  /** `deep.build` 4단계 — 멈춘 자리와 돌려준 중점. */
  "build-stop": buildStop,
  /** `deep.build` 설계 선택 — 두 점의 자리를 일곱 가지로 두고 실제로 센다. */
  "spot-ratio": spotRatio,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 반복에 들어가는 입력과 안 들어가는 입력. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 두 바퀴의 third 와 두 내부점. */
  "walk-points": walkPoints,
  /** `deep.walk.pause` — third 를 묶은 사본이 도는 바퀴. */
  "third-frozen-trace": frozenTrace,
  /** `deep.walk.pause` — third 를 묶은 사본의 답. */
  "third-frozen": thirdFrozen,
  /** `deep.walk` 3 — 갈래 ① 을 한 번 실행한 상태. */
  "walk-keep-m2": walkKeepM2,
  /** `deep.walk.pause` — 두 함숫값이 정확히 같을 때 두 갈래의 답. */
  "tie-values": tieValues,
  /** `deep.walk.pause` — 전개 입력에서 두 함숫값이 마지막 자리만 다른 바퀴. */
  "near-tie": nearTie,
  /** `deep.walk` 4 — T1~T8 의 상태와 분기 판정. */
  "walk-trace": walkTrace,
  /** `deep.walk` 4 — 같은 입력에 ε 만 바꾼 바퀴 수와 오차. */
  "eps-sweep": epsSweep,
  /** `deep.walk.pause` — ε 를 줄여도 오차가 멈추는 함수와 ε = 0. */
  "epsilon-floor": epsilonFloor,
  /** `deep.walk.pause` — 최솟점 근처의 함숫값이 5 와 구별되지 않는 자리. */
  "epsilon-delta": epsilonDelta,
  /** `deep.walk.pause` — ε = 0 에서 상태가 멈춘 바퀴. */
  "epsilon-stuck": epsilonStuck,
  /** `deep.walk.final` — 전체 코드에 네 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `related` — 전개의 길이가 같은 비율로 준다. */
  "related-lengths": relatedLengths,
  /** `related` — 같은 이름이 나오는 세 절차의 반복 수. */
  "related-rates": relatedRates,
  /** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` — 호출 하나당 축소율. */
  "math-sqrt": mathSqrt,
  /** `deep.math` ④ — 닫힌 형태와 실제로 센 바퀴. */
  "math-closed": mathClosed,
  /** `invariant` ② — 바퀴마다 길이. */
  "invariant-shrink": invariantShrink,
  /** `invariant` ② — 경계에 있는 입력 일곱. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 불변식을 지키던 줄을 바꾼 사본의 답. */
  "mutant-hi-m1": mutantHiM1,
  /** `invariant` ③ — 변이가 최솟점을 빼는 바퀴. */
  "invariant-mutant-trace": invariantMutantTrace,
  /** `perf.derive` — T2~T7 의 재기. */
  "perf-derive": perfDerive,
  /** `perf.worst` — 바퀴 수가 f 의 모양이 아니라 L 과 ε 를 따른다. */
  "shape-calls": shapeCalls,
  /** `perf.worst` — 비율 L/ε 이 바뀔 때 바퀴가 느는 몫. */
  "perf-ratio": perfRatio,
  /** `perf.worst` — 비용의 최악과 끝나지 않는 입력. */
  "perf-nonstop": perfNonstop,
  /** `selfcheck` — T5 자리의 두 규칙. */
  "selfcheck-t5": selfcheckT5,
  /** `selfcheck` 답 — lo = m2 로 적은 사본의 답. */
  "selfcheck-lo-m2": selfcheckLoM2,
};
