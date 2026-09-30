/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 한 호출의 걸음(아기 걸음 · 반복 제곱 · 큰 걸음)은 그림 사이드카의 `trace`(정본 소스에서 기계로
 * 만든 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  BIG_A,
  BIG_M,
  countedPower,
  DUP,
  type Giant,
  linearLog,
  linearMulByShape,
  num,
  scale,
  secondsOf,
  sqrtPath,
  trace,
  WALK,
  walkSteps,
  withN,
} from "./babyStepGiantStep-guide.fig.tsx";
import {
  babyStepGiantStep,
  ceilSqrt,
  power,
} from "./babyStepGiantStep-guide.ref.ts";

const REF = new URL("./babyStepGiantStep-guide.ref.ts", import.meta.url)
  .pathname;

type Impl = { babyStepGiantStep(a: bigint, b: bigint, m: bigint): bigint };

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

/** 한글을 두 칸으로 세는 폭. 등폭 펜스의 열을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));
/** 줄마다 열을 맞춘다 — 열마다 가장 넓은 칸에 두 칸을 더한다. */
function columns(rows: string[][]): string[] {
  const widths: number[] = [];
  for (const r of rows) {
    r.forEach((c, i) => {
      widths[i] = Math.max(widths[i] ?? 0, width(c));
    });
  }
  return rows.map((r) =>
    r
      .map((c, i) => (i === r.length - 1 ? c : pad(c, (widths[i] ?? 0) + 2)))
      .join("")
      .trimEnd(),
  );
}

const call = (a: bigint, b: bigint, m: bigint): string =>
  `babyStepGiantStep(${a}n, ${b}n, ${m}n)`;
const input = (a: bigint, b: bigint, m: bigint): string =>
  `a = ${num(a)}, b = ${num(b)}, m = ${num(m)}`;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

function conceptTask(): string {
  const { a, b, m } = WALK;
  const x = babyStepGiantStep(a, b, m);
  return columns([
    [call(a, b, m), `→ ${x}n`, ""],
    ["검산", `${a}^${x} mod ${m} = ${power(a, x, m)}`, "← b 와 같다"],
  ]).join("\n");
}

function conceptCost(): string {
  const w = trace(WALK.a, WALK.b, WALK.m);
  const s = scale();
  const rows = [
    [
      num(WALK.m),
      `a = ${WALK.a}, b = ${WALK.b}`,
      num(w.answer),
      num(linearMulByShape(WALK.a, WALK.b, WALK.m)),
      num(w.mul.total),
      num(w.cells),
    ],
    [
      num(BIG_M),
      `a = ${BIG_A}, b = ${num(s.b)}`,
      num(s.x),
      num(s.linear),
      num(s.bsgs),
      num(s.cells),
    ],
  ];
  return [
    md(
      [
        "법 m",
        "입력",
        "답 x",
        "선형 탐색의 곱셈",
        "Baby-step Giant-step 의 곱셈",
        "아기 걸음 표 칸",
      ],
      rows,
      [0, 2, 3, 4, 5],
    ),
    "",
    `Baby-step Giant-step 의 두 줄은 정본을 실제로 실행해 센 값입니다. 선형 탐색은 m = ${num(WALK.m)} 에서 실제로 실행했고, m = ${num(BIG_M)} 에서는 x 번째 바퀴에서 멈추는 반복 구조에서 ${num(s.linear)} 번으로 셌습니다.`,
  ].join("\n");
}

/* ───────── 「아이디어를 떠올리는 과정」 ───────── */

function originNaive(): string {
  const s = scale();
  const cases: [bigint, bigint, bigint, string][] = [
    [WALK.a, WALK.b, WALK.m, "실제로 실행"],
    [WALK.a, 2n, WALK.m, "실제로 실행"],
    [BIG_A, s.b, BIG_M, "반복 구조에서 셈"],
  ];
  const rows = cases.map(([a, b, m, how]) => {
    const x = babyStepGiantStep(a, b, m);
    const mul = linearMulByShape(a, b, m);
    return [input(a, b, m), num(x), num(mul), secondsOf(mul), how];
  });
  return [
    md(
      ["입력", "답 x", "곱셈", "시간(초당 1 억 번)", "센 방법"],
      rows,
      [1, 2, 3],
    ),
    "",
    `해가 없는 둘째 줄은 x < m 인 ${num(WALK.m)} 바퀴를 다 실행했습니다. 셋째 줄은 반복이 x = ${num(s.x)} 번째 바퀴에서 멈추므로 곱셈도 ${num(s.x)} 번입니다.`,
  ].join("\n");
}

function originPowers(): string {
  const { a, b, m } = WALK;
  const x = babyStepGiantStep(a, b, m);
  const xs: string[] = ["x"];
  const vs: string[] = ["a^x mod m"];
  let v = 1n;
  for (let k = 0n; k <= x; k++) {
    xs.push(String(k));
    vs.push(String(v));
    v = (v * a) % m;
  }
  const lines = columns([xs, vs]);
  const run = linearLog(a, b, m);
  if (run.x !== x) throw new Error("선형 탐색이 정본과 다르다");
  return [
    ...lines,
    `${" ".repeat(width(lines[0] as string) - 2)}↑ ${b}${을를(String(b))} 찾았다`,
    `앞의 ${x} 개 값은 b 가 아니라고 확인하고 버렸다. 곱셈은 ${run.mul} 번`,
  ].join("\n");
}

function originTwoN(): string {
  const { a, b, m } = WALK;
  const n0 = ceilSqrt(m);
  const rows = [1n, n0, m].map((n) => {
    const r = withN(a, b, m, n);
    return [
      `n = ${n}`,
      String(n),
      String(r.baby),
      String(r.power),
      String(r.giant),
      String(r.total),
    ];
  });
  return [
    md(
      [
        "조각 크기",
        "아기 걸음 표 칸",
        "아기 걸음 곱셈",
        "보폭 곱셈",
        "큰 걸음 곱셈",
        "합",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `세 줄 모두 답은 ${babyStepGiantStep(a, b, m)} 입니다. n = 1 은 아기 걸음 표가 한 칸이라 큰 걸음이 선형 탐색처럼 한 칸씩 가고, n = ${m} 은 큰 걸음이 한 번으로 끝나는 대신 아기 걸음이 ${m} 번입니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 ───────── */

function buildReadOne(): string {
  const { a, b, m } = WALK;
  const t = trace(a, b, m);
  const hit = t.giant.find((g) => g.j !== null) as Giant;
  const j = hit.j as bigint;
  const n = t.n as bigint;
  const x = hit.i * n - j;
  return columns([
    ["아기 걸음 표", `키 ${hit.giant} → 값 j = ${j}`, ""],
    [
      "그 키의 뜻",
      `b·a^${j} = ${b} · ${a}^${j} mod ${m} = ${(b * power(a, j, m)) % m}`,
      "",
    ],
    [
      `큰 걸음 i = ${hit.i}`,
      `a^(${hit.i}·${n}) = ${a}^${hit.i * n} mod ${m} = ${power(a, hit.i * n, m)}`,
      "",
    ],
    ["두 값이 같으므로", `x = ${hit.i}·${n} − ${j} = ${x}`, ""],
    ["검산", `${a}^${x} mod ${m} = ${power(a, x, m)}`, "← b 와 같다"],
  ]).join("\n");
}

function buildNeighbors(): string {
  const { a, m } = WALK;
  const t = trace(WALK.a, WALK.b, m);
  const rows = t.baby.slice(0, -1).map(([v, j], i) => {
    const next = t.baby[i + 1] as readonly [bigint, bigint];
    if ((v * a) % m !== next[0]) throw new Error("이웃 칸의 관계가 깨졌다");
    return [
      String(j),
      String(v),
      `${v} · ${a} = ${v * a}`,
      String((v * a) % m),
      String(next[1]),
    ];
  });
  return [
    md(
      ["j", "b·a^j", "a 를 곱한 값", "mod m", "다음 칸의 j"],
      rows,
      [0, 1, 3, 4],
    ),
    "",
    `${rows.length} 쌍 모두에서 앞 칸의 키에 ${a}${을를(String(a))} 곱해 ${m} 으로 나눈 나머지가 다음 칸의 키입니다.`,
  ].join("\n");
}

function buildArrayVsMap(): string {
  const { a, b, m } = WALK;
  const t = trace(a, b, m);
  const babies = t.baby.map(([v]) => v);
  let scanTotal = 0;
  const rows = t.giant.map((g) => {
    // j 로 늘어놓은 배열에서 값을 찾으려면 앞에서부터 비교한다. 찾으면 그 자리까지다.
    const at = babies.indexOf(g.giant);
    const scan = at === -1 ? babies.length : at + 1;
    scanTotal += scan;
    return [
      `i = ${g.i}`,
      String(g.giant),
      g.j === null ? "없음" : `j = ${g.j}`,
      String(scan),
      "1",
    ];
  });
  return [
    md(
      [
        "큰 걸음",
        "찾는 값",
        "결과",
        "j 로 늘어놓은 배열의 비교",
        "아기 걸음 표 찾기",
      ],
      rows,
      [1, 3, 4],
    ),
    "",
    `큰 걸음 ${t.giant.length} 번에 배열은 비교 ${scanTotal} 번, 아기 걸음 표는 찾기 ${t.giant.length} 번입니다.`,
  ].join("\n");
}

function buildN(): string {
  const rows = [WALK.m, 64n, 65n, BIG_M].map((m) => {
    const n = ceilSqrt(m);
    return [
      num(m),
      num(n),
      num(n * n),
      n * n >= m ? "예" : "아니오",
      (n - 1n) * (n - 1n) < m ? "예" : "아니오",
    ];
  });
  return [
    md(["m", "n = ⌈√m⌉", "n²", "n² ≥ m", "(n − 1)² < m"], rows, [0, 1, 2]),
    "",
    "네 줄 모두 n² 가 m 이상이고, n 을 하나 줄이면 m 에 못 미칩니다.",
  ].join("\n");
}

function buildDupAnswer(): string {
  const { a, b, m } = DUP;
  const x = babyStepGiantStep(a, b, m);
  const run = linearLog(a, b, m);
  return [
    `${call(a, b, m)}   →   ${x}n`,
    `검산   ${a}^${x} mod ${m} = ${power(a, x, m)}      선형 탐색의 답   ${run.x}`,
  ].join("\n");
}

function buildStride(): string {
  const { a, m } = WALK;
  const t = trace(a, WALK.b, m);
  const n = t.n as bigint;
  const stride = t.stride as bigint;
  const rows: string[][] = [["i", "giant", "a^(i·n) mod m"]];
  let g = 1n;
  for (let i = 1n; i <= n; i++) {
    g = (g * stride) % m;
    const direct = power(a, i * n, m);
    if (g !== direct) throw new Error("보폭을 곱한 값이 거듭제곱과 다르다");
    rows.push([String(i), String(g), `${a}^${i * n} mod ${m} = ${direct}`]);
  }
  return [`stride = ${a}^${n} mod ${m} = ${stride}`, ...columns(rows)].join(
    "\n",
  );
}

function buildGiant(): string {
  const { a, b, m } = WALK;
  const t = trace(a, b, m);
  const n = t.n as bigint;
  const rows = t.giant.map((g) => [
    String(g.i),
    String(g.giant),
    g.j === null ? "없음" : `j = ${g.j}`,
    `${(g.i - 1n) * n + 1n} … ${g.i * n}`,
    g.j === null ? "해 없음" : `x = ${g.i}·${n} − ${g.j} = ${g.i * n - g.j}`,
  ]);
  return [
    md(
      ["i", "a^(i·n) mod m", "아기 걸음 표에서", "확인한 x", "결론"],
      rows,
      [0, 1],
    ),
    "",
    `i = ${t.giant.at(-1)?.i} 에서 멈추고 ${t.answer}${을를(String(t.answer))} 돌려줍니다.`,
  ].join("\n");
}

const PREMISE_CASES: [bigint, bigint, bigint][] = [
  [2n, 0n, 8n],
  [2n, 4n, 8n],
  [2n, 5n, 6n],
];
const PREMISE_MAX_M = 60n;

function premiseCoprime(): string {
  const rows = PREMISE_CASES.map(([a, b, m]) => {
    const x = babyStepGiantStep(a, b, m);
    return [
      input(a, b, m),
      String(gcd(a, m)),
      String(x),
      `${a}^${x} mod ${m} = ${power(a, x, m)}`,
      String(linearLog(a, b, m).x),
    ];
  });
  let cop = 0;
  let copWrong = 0;
  let non = 0;
  let nonWrong = 0;
  for (let m = 2n; m <= PREMISE_MAX_M; m++) {
    for (let a = 0n; a < m; a++) {
      const coprime = gcd(a, m) === 1n;
      for (let b = 0n; b < m; b++) {
        const wrong = babyStepGiantStep(a, b, m) !== linearLog(a, b, m).x;
        if (coprime) {
          cop++;
          if (wrong) copWrong++;
        } else {
          non++;
          if (wrong) nonWrong++;
        }
      }
    }
  }
  return [
    md(
      ["입력", "gcd(a, m)", "정본의 답", "검산", "선형 탐색의 답"],
      rows,
      [1, 2, 4],
    ),
    "",
    `m 을 2 부터 ${PREMISE_MAX_M} 까지 두고 a · b 를 0 부터 m − 1 까지 전부 넣었습니다. a 와 m 이 서로소인 입력 ${num(cop)} 개에서 정본의 답이 선형 탐색과 다른 것은 ${num(copWrong)} 개이고, 서로소가 아닌 입력 ${num(non)} 개에서는 ${num(nonWrong)} 개입니다.`,
  ].join("\n");
}

/** 전제가 깨진 첫 줄을 한 걸음씩 — 아기 걸음 표에서 찾았는데 해가 아닌 자리. */
function premiseTrace(): string {
  const [a, b, m] = PREMISE_CASES[0] as [bigint, bigint, bigint];
  const t = trace(a, b, m);
  const n = t.n as bigint;
  const hit = t.giant.find((g) => g.j !== null) as Giant;
  const j = hit.j as bigint;
  const x = hit.i * n - j;
  return [
    `${call(a, b, m)} — n = ${n}`,
    ...columns([
      [
        "아기 걸음",
        `${t.baby.map(([v, k]) => `j=${k}: ${v}`).join(" · ")} → 아기 걸음 표 ${t.cells} 칸`,
      ],
      ["보폭", `stride = ${a}^${n} mod ${m} = ${t.stride}`],
      [
        `큰 걸음 i=${hit.i}`,
        `giant = ${hit.giant}, 아기 걸음 표에 j = ${j} → x = ${hit.i}·${n} − ${j} = ${x}`,
      ],
      [
        "a^(i·n) ≡ b·a^j",
        `${a}^${hit.i * n} mod ${m} = ${power(a, hit.i * n, m)}, ${b}·${a}^${j} mod ${m} = ${(b * power(a, j, m)) % m}`,
      ],
      ["a^x ≡ b", `${a}^${x} mod ${m} = ${power(a, x, m)}, b = ${b}`],
    ]).map((l) => `  ${l}`),
  ].join("\n");
}

function choiceN(): string {
  const { a, m } = WALK;
  const ns = [1n, 2n, 4n, 8n, 16n, 29n, 58n];
  let best = { n: 0n, worst: Number.POSITIVE_INFINITY };
  const rows = ns.map((n) => {
    let worst = 0;
    for (let b = 0n; b < m; b++)
      worst = Math.max(worst, withN(a, b, m, n).total);
    if (worst < best.worst) best = { n, worst };
    return [String(n), String(n), String((m + n - 1n) / n), String(worst)];
  });
  return [
    md(
      ["n", "아기 걸음 표 칸", "큰 걸음 최대 ⌈m/n⌉", "최악 곱셈"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `a = ${a}, m = ${m} 에 b 를 0 부터 ${m - 1n} 까지 전부 넣어 가장 많은 곱셈을 셌습니다. 가장 적은 것은 n = ${best.n} 의 ${best.worst} 번이고, ⌈√${m}⌉ = ${ceilSqrt(m)} 입니다.`,
  ].join("\n");
}

/** 확장 유클리드 — `u·a + v·m = gcd` 인 `u`. */
function inverse(a: bigint, m: bigint): bigint | null {
  let [r0, r1] = [a % m, m];
  let [s0, s1] = [1n, 0n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1n) return null;
  return ((s0 % m) + m) % m;
}

/** 지수를 `i·n + j` 로 가르는 판 — 아기 걸음 표에 `a^j`, 큰 걸음은 `b` 에 `a^(−n)` 을 곱한다. */
function plusSplit(a: bigint, b: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  const A = ((a % m) + m) % m;
  const B = ((b % m) + m) % m;
  const n = ceilSqrt(m);
  const table = new Map<bigint, bigint>();
  let v = 1n % m;
  for (let j = 0n; j < n; j++) {
    if (!table.has(v)) table.set(v, j);
    v = (v * A) % m;
  }
  const back = inverse(power(A, n, m), m);
  if (back === null) throw new Error("a^n 의 역원이 없다");
  let cur = B;
  for (let i = 0n; i < n; i++) {
    const j = table.get(cur);
    if (j !== undefined) return i * n + j;
    cur = (cur * back) % m;
  }
  return -1n;
}

function choiceMinus(): string {
  const { a, m } = WALK;
  const n = ceilSqrt(m);
  const an = power(a, n, m);
  const back = inverse(an, m) as bigint;
  let total = 0;
  let same = 0;
  for (let mm = 2n; mm <= PREMISE_MAX_M; mm++) {
    for (let aa = 0n; aa < mm; aa++) {
      if (gcd(aa, mm) !== 1n) continue;
      for (let bb = 0n; bb < mm; bb++) {
        total++;
        if (plusSplit(aa, bb, mm) === babyStepGiantStep(aa, bb, mm)) same++;
      }
    }
  }
  const [na, , nm] = PREMISE_CASES[0] as [bigint, bigint, bigint];
  const nn = ceilSqrt(nm);
  const noInverse = inverse(power(na, nn, nm), nm) === null;
  return [
    md(
      [
        "가르는 식",
        "아기 걸음 표의 키",
        "큰 걸음이 곱하는 값",
        `m = ${m} 에서 그 값`,
      ],
      [
        ["x = i·n − j", "b·a^j", "a^n", `${a}^${n} mod ${m} = ${an}`],
        [
          "x = i·n + j",
          "a^j",
          "a^n 의 역원",
          `${an} 의 역원 = ${back} (${an} · ${back} mod ${m} = ${(an * back) % m})`,
        ],
      ],
    ),
    "",
    `a 와 m 이 서로소인 입력 ${num(total)} 개(m ≤ ${PREMISE_MAX_M})에서 두 판의 답이 같은 것은 ${num(same)} 개입니다. a = ${na}, m = ${nm} 처럼 서로소가 아니면 a^${nn} = ${power(na, nn, nm)} 의 역원이 ${noInverse ? "없어" : "있어"} 둘째 판은 시작하지 못합니다.`,
  ].join("\n");
}

/* ───────── 수행으로 알아보는 알고리즘 ───────── */

function walkInput(): string {
  const { a, b, m } = WALK;
  return [
    `const a = ${a}n;`,
    `const b = ${b}n;`,
    `const m = ${m}n;`,
    `// 이 절이 끝나면 ${babyStepGiantStep(a, b, m)}n 이 나와야 한다`,
  ].join("\n");
}

function walkCeilSqrt(): string {
  const rows = [WALK.m, 64n, 65n].map((m) => {
    const { path, result } = sqrtPath(m);
    const last = path.at(-1) as bigint;
    const verdict =
      last * last === m
        ? `${last}·${last} = ${m} 이라 ${last}${을를(String(last))} 그대로`
        : `${last}·${last} = ${last * last} ≠ ${m} 이라 ${result}`;
    return [`ceilSqrt(${m}n)`, `x: ${path.join(" → ")}`, verdict];
  });
  return columns(rows).join("\n");
}

function walkNormalize(): string {
  const [a, b, m] = [63n, -25n, WALK.m];
  const t = trace(a, b, m);
  if (t.A !== WALK.a || t.B !== WALK.b)
    throw new Error("정규화 입력이 전개 입력과 다르다");
  return [
    `${call(a, b, m)}`,
    `  A = ((${a} % ${m}) + ${m}) % ${m} = ${t.A}`,
    `  B = ((${b} % ${m}) + ${m}) % ${m} = ${t.B}`,
    `  답 ${t.answer}n   ← ${call(WALK.a, WALK.b, WALK.m)} 과 같은 문제가 된다`,
  ].join("\n");
}

/** `b ≡ 1` 을 먼저 보는 줄을 지운 사본. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다. */
const noEarly = await loadMutant<Impl>(REF, {
  drop: /^\s*if \(B === 1n\) return 0n;/,
});

function pauseBOne(): string {
  const cases: [bigint, bigint, bigint][] = [
    [2n, 1n, 7n],
    [7n, 1n, 13n],
    [WALK.a, 1n, WALK.m],
  ];
  const rows = cases.map(([a, b, m]) => {
    const good = babyStepGiantStep(a, b, m);
    const bad = noEarly.babyStepGiantStep(a, b, m);
    return { a, b, m, good, bad };
  });
  const neutral = noEarly.babyStepGiantStep === babyStepGiantStep;
  if (!neutral && rows.every((r) => r.good === r.bad)) {
    throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  const pass = rows.filter((r) => power(r.a, r.bad, r.m) === r.b % r.m).length;
  return [
    md(
      ["입력", "바른 코드", "b ≡ 1 확인 줄을 지운 코드", "지운 코드의 답 검산"],
      rows.map((r) => [
        input(r.a, r.b, r.m),
        String(r.good),
        String(r.bad),
        `${r.a}^${r.bad} mod ${r.m} = ${power(r.a, r.bad, r.m)}`,
      ]),
      [1, 2],
    ),
    "",
    `세 벌 중 ${pass} 벌에서 지운 코드의 답이 검산을 통과합니다.`,
  ].join("\n");
}

function walkBaby(): string {
  const { a, m } = WALK;
  const t = trace(a, WALK.b, m);
  const rows = t.baby.map(([v, j]) => [
    `j=${j}`,
    `table.set(${v}, ${j})`,
    `다음 baby = ${v} · ${a} mod ${m} = ${(v * a) % m}`,
  ]);
  return [
    ...columns(rows),
    `아기 걸음 표 ${t.cells} 칸, 곱셈 ${t.mul.baby} 번`,
  ].join("\n");
}

/** `number` 로 옮긴 판 — 정본과 한 줄씩 같은 절차를 배정밀도 수로 한다. */
function numberPort(a: number, b: number, m: number): number {
  const A = ((a % m) + m) % m;
  const B = ((b % m) + m) % m;
  if (B === 1) return 0;
  const n = Number(ceilSqrt(BigInt(m)));
  const table = new Map<number, number>();
  let baby = B;
  for (let j = 0; j < n; j++) {
    table.set(baby, j);
    baby = (baby * A) % m;
  }
  let stride = 1;
  let base = A;
  let e = n;
  while (e > 0) {
    if (e % 2 === 1) stride = (stride * base) % m;
    base = (base * base) % m;
    e = Math.floor(e / 2);
  }
  let giant = 1;
  for (let i = 1; i <= n; i++) {
    giant = (giant * stride) % m;
    const j = table.get(giant);
    if (j !== undefined) return i * n - j;
  }
  return -1;
}

function pauseNumber(): string {
  const big = power(BIG_A, 12_345n, BIG_M);
  const cases: [bigint, bigint, bigint][] = [
    [WALK.a, WALK.b, WALK.m],
    [BIG_A, big, BIG_M],
  ];
  const rows = cases.map(([a, b, m]) => {
    const got = numberPort(Number(a), Number(b), Number(m));
    const want = babyStepGiantStep(a, b, m);
    return [
      input(a, b, m),
      String(want),
      String(got),
      `${a}^${got} mod ${num(m)} = ${num(power(a, BigInt(got), m))}`,
    ];
  });
  const top = (BIG_M - 1n) * (BIG_M - 1n);
  const safe = 2n ** 53n;
  return [
    md(
      ["입력", "bigint 정본", "number 판", "number 판의 답 검산"],
      rows,
      [1, 2],
    ),
    "",
    `m = ${num(BIG_M)} 에서 곱하기 전의 두 수는 ${num(BIG_M - 1n)} 까지라 곱이 ${num(top)} 까지 커지는데, number 가 정수를 정확히 담는 한계 2^53 은 ${num(safe)} 입니다.`,
  ].join("\n");
}

function walkPower(): string {
  const { a, m } = WALK;
  const t = trace(a, WALK.b, m);
  const rows = t.power.map((r) => [
    `e=${r.e}`,
    r.e % 2n === 1n ? "홀수" : "짝수",
    r.e % 2n === 1n ? `result = ${r.result}` : `result = ${r.result} 그대로`,
    `b = ${r.b}`,
    `곱셈 ${r.mul} 번`,
  ]);
  const total = t.power.reduce((s, r) => s + r.mul, 0);
  return [
    `power(${a}n, ${t.n}n, ${m}n)`,
    ...columns(rows),
    `stride = ${t.stride}, 곱셈 ${total} 번`,
  ].join("\n");
}

function walkTrace(): string {
  const steps = walkSteps();
  const t = trace(WALK.a, WALK.b, WALK.m);
  const n = t.n as bigint;
  let mul = 0;
  const rows = steps.map((s, k) => {
    let does = "";
    let cond = "";
    if (k === 0) {
      does = "조각 크기를 정한다";
      cond = `B = ${t.B}, B === 1n 이 **거짓** → n = ${n}`;
    } else if (k <= t.baby.length) {
      const [v, j] = t.baby[k - 1] as readonly [bigint, bigint];
      mul++;
      does = `아기 걸음 j = ${j}`;
      cond = `${j} < ${n} 이 **참** → table.set(${v}, ${j})`;
    } else if (k === t.baby.length + 1) {
      mul += t.mul.power;
      does = "보폭을 구한다";
      cond = `stride = ${t.stride}, giant = 1`;
    } else {
      const g = t.giant[k - t.baby.length - 2] as Giant;
      mul++;
      does = `큰 걸음 i = ${g.i}`;
      cond =
        g.j === null
          ? `table.get(${g.giant}) 이 undefined → ②`
          : `table.get(${g.giant}) = ${g.j} → ① x = ${g.i * n - g.j}`;
    }
    return [s.id, does, cond, String(mul)];
  });
  return [
    md(["단계", "하는 일", "조건 판정", "곱셈 누계"], rows, [3]),
    "",
    `갈래 ② 가 한 번, 갈래 ① 이 한 번 나왔고 답은 ${t.answer} 입니다.`,
  ].join("\n");
}

const FINAL_CASES: [bigint, bigint, bigint][] = [
  [WALK.a, WALK.b, WALK.m],
  [2n, 1n, 7n],
  [DUP.a, DUP.b, DUP.m],
  [WALK.a, 2n, WALK.m],
  [63n, -25n, WALK.m],
];

function finalCalls(): string {
  const rows = FINAL_CASES.map(([a, b, m]) => [
    call(a, b, m),
    `→  ${babyStepGiantStep(a, b, m)}n`,
  ]);
  return columns(rows).join("\n");
}

/* ───────── 파트 2 ───────── */

function mathCheck(): string {
  const m = WALK.m;
  const lines = [7n, 8n, 9n].map((n) => {
    const f = Number(n) + Number(m) / Number(n);
    return `n = ${n}   →   ${n} + ${m}/${n} = ${n} + ${(Number(m) / Number(n)).toFixed(2)} = ${f.toFixed(2)}`;
  });
  return [
    `m = ${m} 에 n 을 셋 넣는다`,
    ...lines,
    `√${m} = ${Math.sqrt(Number(m)).toFixed(4)}, ⌈√${m}⌉ = ${ceilSqrt(m)}`,
  ].join("\n");
}

function mathCode(): string {
  const f = (n: number, m: number) => n + m / n;
  const m = Number(BIG_M);
  const n = Number(ceilSqrt(BIG_M));
  return [
    "const cost = (n: number, m: number): number => n + m / n;",
    "",
    `cost(8, 58); // → ${f(8, 58).toFixed(2)}`,
    `cost(${n}, ${m}); // → ${f(n, m).toFixed(2)}`,
  ].join("\n");
}

function mathClosed(): string {
  const s = scale();
  const worstOver = (a: bigint, m: bigint): number => {
    let w = 0;
    for (let b = 0n; b < m; b++)
      w = Math.max(w, trace(a, b, m, true).mul.total);
    return w;
  };
  const rows: string[][] = [];
  for (const [a, m] of [
    [WALK.a, WALK.m],
    [3n, 10_007n],
  ] as const) {
    const n = ceilSqrt(m);
    rows.push([
      num(m),
      num(n),
      num(2n * n),
      num(countedPower(a, n, m).mul),
      num(worstOver(a, m)),
      "b 전부",
    ]);
  }
  rows.push([
    num(BIG_M),
    num(s.n),
    num(2n * s.n),
    num(countedPower(BIG_A, s.n, BIG_M).mul),
    num(s.bsgs),
    "해가 구간 끝인 b 하나",
  ]);
  return [
    md(
      ["m", "n = ⌈√m⌉", "2n", "보폭 곱셈", "정본의 최악 곱셈", "넣은 b"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    "세 줄 모두 정본의 최악 곱셈이 2n 과 보폭 곱셈의 합을 넘지 않습니다.",
  ].join("\n");
}

function invariantStates(): string {
  const { a, b, m } = WALK;
  const t = trace(a, b, m);
  const n = t.n as bigint;
  const rows = t.giant.map((g) => {
    const lo = (g.i - 1n) * n + 1n;
    const hi = g.i * n;
    const sols: bigint[] = [];
    for (let x = lo; x <= hi; x++) if (power(a, x, m) === b) sols.push(x);
    return [
      String(g.i),
      `${lo} … ${hi}`,
      sols.length === 0 ? "없음" : sols.join(" · "),
      g.j === null ? "없음" : `j = ${g.j}`,
      g.j === null ? "i 를 늘린다" : `${g.i * n - g.j} 를 돌려준다`,
    ];
  });
  return [
    md(
      [
        "i",
        "이 큰 걸음이 맡는 x",
        "그 안의 해(직접 계산)",
        "아기 걸음 표에서",
        "하는 일",
      ],
      rows,
      [0],
    ),
    "",
    `i = 1 을 마친 시점에 1 … ${n} 에는 해가 없고, 반환한 ${t.answer} 는 i = 2 가 맡는 칸의 가장 작은 해입니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const s = scale();
  const cases: [string, bigint, bigint, bigint, string][] = [
    ["m = 1", 5n, 3n, 1n, "함수 첫 줄"],
    ["b ≡ 1", 2n, 1n, 7n, "B === 1n 확인 줄"],
    ["해가 없다", WALK.a, 2n, WALK.m, "큰 걸음 n 번을 다 실행한다"],
    ["같은 값이 다시 나온다", DUP.a, DUP.b, DUP.m, "덮어써서 큰 j 가 남는다"],
    ["음수 · m 이상의 입력", 63n, -25n, WALK.m, "((a % m) + m) % m"],
    ["해가 구간 끝", BIG_A, s.b, BIG_M, "큰 걸음이 n 번째 가까이 간다"],
  ];
  const rows = cases.map(([what, a, b, m, where]) => {
    const x = babyStepGiantStep(a, b, m);
    const want = m === 1n ? 0n : m <= 100_000n ? linearLog(a, b, m).x : s.x;
    if (x !== want) throw new Error(`경계 입력 ${what} 의 답이 어긋난다`);
    return [what, `(${a}, ${num(b)}, ${num(m)})`, where, num(x)];
  });
  return md(["경계", "입력 (a, b, m)", "처리되는 자리", "답"], rows, [3]);
}

/** 불변식을 지키던 줄 — 같은 값이면 덮어쓰는 `table.set` — 을 처음 값만 남기게 바꾼 사본. */
const keepFirst = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)table\.set\(baby, j\);$/,
    "$1if (!table.has(baby)) table.set(baby, j);",
  ],
});

const MUTANT_CASES: [bigint, bigint, bigint][] = [
  [DUP.a, DUP.b, DUP.m],
  [9n, 9n, 13n],
  [4n, 4n, 5n],
  [WALK.a, WALK.b, WALK.m],
];

function mutantKeepFirst(): string {
  const rows = MUTANT_CASES.map(([a, b, m]) => ({
    a,
    b,
    m,
    good: babyStepGiantStep(a, b, m),
    bad: keepFirst.babyStepGiantStep(a, b, m),
  }));
  const neutral = keepFirst.babyStepGiantStep === babyStepGiantStep;
  if (!neutral && rows.every((r) => r.good === r.bad)) {
    throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  const differ = rows.filter((r) => r.good !== r.bad).length;
  const pass = rows.filter((r) => power(r.a, r.bad, r.m) === r.b % r.m).length;
  return [
    md(
      ["입력", "바른 코드", "처음 j 를 남기는 코드", "그 답의 검산"],
      rows.map((r) => [
        input(r.a, r.b, r.m),
        String(r.good),
        String(r.bad),
        `${r.a}^${r.bad} mod ${r.m} = ${power(r.a, r.bad, r.m)}`,
      ]),
      [1, 2],
    ),
    "",
    `${rows.length} 벌 중 ${differ} 벌에서 답이 바른 코드와 다르고, 바꾼 코드의 답은 ${pass === rows.length ? `${rows.length} 벌 모두` : `${pass} 벌이`} 검산을 통과합니다.`,
  ].join("\n");
}

function invariantMutantBlock(): string {
  const { a, b, m } = DUP;
  const t = trace(a, b, m);
  const n = t.n as bigint;
  const g = t.giant[0] as Giant;
  const xs: string[] = ["x"];
  const js: string[] = ["j = i·n − x"];
  const hits: string[] = ["a^x ≡ b"];
  for (let x = (g.i - 1n) * n + 1n; x <= g.i * n; x++) {
    xs.push(String(x));
    js.push(String(g.i * n - x));
    hits.push(power(a, x, m) === b % m ? "예" : "아니오");
  }
  const occ = t.baby.filter(([v]) => v === g.giant).map(([, j]) => j);
  return [
    `큰 걸음 i = ${g.i} 이 내민 값 ${g.giant}${이가(String(g.giant))} 아기 걸음 표에서 j = ${occ.join(" · ")} 두 자리에 나온다`,
    ...columns([xs, js, hits]),
    `  j = ${occ.at(-1)} 을 남기면 x = ${g.i * n - (occ.at(-1) as bigint)},  j = ${occ[0]} 을 남기면 x = ${g.i * n - (occ[0] as bigint)}`,
  ].join("\n");
}

function perfWalk(): string {
  const t = trace(WALK.a, WALK.b, WALK.m);
  const last = 1 + t.baby.length;
  return columns([
    [`T2~T${last}`, "아기 걸음", `곱셈 ${t.mul.baby} 번`],
    [`T${last + 1}`, "보폭(반복 제곱)", `곱셈 ${t.mul.power} 번`],
    [
      `T${last + 2}~T${last + 1 + t.giant.length}`,
      "큰 걸음",
      `곱셈 ${t.mul.giant} 번`,
    ],
    ["", "합", `곱셈 ${t.mul.total} 번`],
  ]).join("\n");
}

function worstInputs(): string {
  const s = scale();
  const cases: [bigint, bigint, bigint][] = [
    [WALK.a, 2n, WALK.m],
    [BIG_A, 0n, BIG_M],
    [BIG_A, s.b, BIG_M],
  ];
  const rows = cases.map(([a, b, m]) => {
    const t = trace(a, b, m, true);
    return [
      input(a, b, m),
      num(t.answer),
      num(t.mul.giant),
      num(t.n as bigint),
      num(t.mul.total),
      num(t.cells),
    ];
  });
  return [
    md(
      ["입력", "답", "큰 걸음 수", "n", "곱셈", "아기 걸음 표 칸"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    "세 줄 모두 큰 걸음이 n 번을 다 실행했습니다.",
  ].join("\n");
}

function checkStride(): string {
  const t = trace(WALK.a, WALK.b, WALK.m);
  const n = Number(t.n);
  return columns([
    [
      "반복 제곱",
      `${t.mul.baby} + ${t.mul.power} + ${t.mul.giant} = ${t.mul.total} 번`,
    ],
    [
      "n 번 곱하기",
      `${t.mul.baby} + ${n} + ${t.mul.giant} = ${t.mul.baby + n + t.mul.giant} 번`,
    ],
  ]).join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 전개 입력의 답과 검산. */
  "concept-task": conceptTask,
  /** `concept` — 두 규모에서 선형 탐색과 Baby-step Giant-step 의 곱셈. */
  "concept-cost": conceptCost,
  /** `deep.origin` ② — 선형 탐색을 과제 규모에서 수치로 반박한다. */
  "origin-naive": originNaive,
  /** `deep.origin` ③ — 선형 탐색이 버린 값. */
  "origin-powers": originPowers,
  /** `deep.origin` ④ — 같은 입력을 조각 크기 셋으로. */
  "origin-two-n": originTwoN,
  /** `deep.build` 개념 — 아기 걸음 표의 칸 하나를 읽는다. */
  "build-read-one": buildReadOne,
  /** `deep.build` 개념 — 이웃 칸의 관계. */
  "build-neighbors": buildNeighbors,
  /** `deep.build` 개념 — j 로 늘어놓은 배열과의 비교. */
  "build-array-vs-map": buildArrayVsMap,
  /** `deep.build` 1단계 — 조각 크기와 n². */
  "build-n": buildN,
  /** `deep.build` 2단계 — 같은 값이 다시 나오는 입력의 답. */
  "build-dup-answer": buildDupAnswer,
  /** `deep.build` 3단계 — 보폭을 곱해 가는 값이 a^(i·n) 과 같다. */
  "build-stride": buildStride,
  /** `deep.build` 4단계 — 큰 걸음마다 맡는 x. */
  "build-giant": buildGiant,
  /** `deep.build` 전제 — 서로소가 아닐 때의 답. */
  "premise-coprime": premiseCoprime,
  /** `deep.build` 전제 — 첫 줄을 한 걸음씩. */
  "premise-trace": premiseTrace,
  /** `deep.build` 설계 선택 — 조각 크기별 최악 곱셈. */
  "choice-n": choiceN,
  /** `deep.build` 설계 선택 — i·n − j 와 i·n + j. */
  "choice-minus": choiceMinus,
  /** `deep.walk` 도입 — 전개 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 뉴턴법의 자취. */
  "walk-ceilsqrt": walkCeilSqrt,
  /** `deep.walk` 2 — 입력을 법 안으로. */
  "walk-normalize": walkNormalize,
  /** `deep.walk.pause` — b ≡ 1 확인 줄을 지우면. */
  "pause-b-one": pauseBOne,
  /** `deep.walk` 3 — 아기 걸음 한 바퀴씩. */
  "walk-baby": walkBaby,
  /** `deep.walk.pause` — number 로 곱하면. */
  "pause-number": pauseNumber,
  /** `deep.walk` 4 — 반복 제곱 한 바퀴씩. */
  "walk-power": walkPower,
  /** `deep.walk` 5 — T1~T12 의 조건 판정. */
  "walk-trace": walkTrace,
  /** `deep.walk.final` — 전체 코드에 다섯 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `deep.math` ② — n 셋의 두 항 합. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드. */
  "math-code": mathCode,
  /** `deep.math` ④ — 규모 셋에서 2n 과 실제 최악. */
  "math-closed": mathClosed,
  /** `invariant` ② — 큰 걸음마다 맡는 칸과 그 안의 해. */
  "invariant-states": invariantStates,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 덮어쓰지 않게 바꾸면. */
  "mutant-keep-first": mutantKeepFirst,
  /** `invariant` ③ — 바꾼 코드가 같은 칸에서 큰 x 를 고르는 자리. */
  "invariant-mutant-block": invariantMutantBlock,
  /** `perf.derive` — 전개의 곱셈. */
  "perf-walk": perfWalk,
  /** `perf.worst` — 큰 걸음을 다 도는 입력. */
  "worst-inputs": worstInputs,
  /** `selfcheck` 답 — 보폭을 n 번 곱해 구하면. */
  "check-stride": checkStride,
};
