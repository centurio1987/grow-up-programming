/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.md
 *
 * **세는 사본이 둘 있다**(`trace`·`bySearch`). 정본은 걸음마다의 상태도 대입 횟수도
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표의 `g`·`x`·`y` 칸 중 옳은 쪽은 전부 정본이나 정본에서
 * 기계로 만든 변이가 낸 값이다.
 *
 * 경쟁 설계 대조의 왼쪽 칸은 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에
 * 적으면 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { cases, coefficientsAgree } from "./extendedEuclidean-guide.alt.ts";
import { extendedEuclidean } from "./extendedEuclidean-guide.ref.ts";

const REF = new URL("./extendedEuclidean-guide.ref.ts", import.meta.url)
  .pathname;

const abs = (v: bigint): bigint => (v < 0n ? -v : v);

/**
 * 본문 전개가 쓰는 고정 입력. 첫 인자가 **음수**라 부호를 되돌리는 자리가 실행되고, 몫이
 * `2 1 3 1 2 4` 로 섞여 있어 한쪽으로 치우치지 않은 걸음이 여섯 번 이어진다.
 */
const WALK_A = -510n;
const WALK_B = 183n;

/** 표에 나란히 놓는 네 입력. */
const FOUR: [string, bigint, bigint][] = [
  ["전개가 쓰는 -510 과 183", WALK_A, WALK_B],
  ["서로소인 17 과 5", 17n, 5n],
  ["한쪽이 0 인 7 과 0", 7n, 0n],
  ["둘 다 0", 0n, 0n],
];

/** 피보나치 수 — 마지막 몫만 2 이고 나머지가 전부 1 이라 걸음이 가장 많다. */
function fib(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

/** 펠 수 — 몫이 전부 2 인 입력을 만든다. `P(0)=1`, `P(1)=2`. */
function pell(k: number): bigint {
  let a = 1n;
  let b = 2n;
  for (let i = 0; i < k; i++) {
    const next = 2n * b + a;
    a = b;
    b = next;
  }
  return b;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number | bigint): string => n.toLocaleString("en-US");

function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/** `697년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}

/* ────────────────────── 세는 사본 ────────────────────── */

interface Step {
  r0: bigint;
  r1: bigint;
  q: bigint;
  nr: bigint;
  ns: bigint;
  nt: bigint;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function trace(
  a: bigint,
  b: bigint,
): {
  steps: Step[];
  /** `i` 번째 항 `(r_i, s_i, t_i)`. 걸음 수보다 하나 더 길다. */
  terms: { r: bigint; s: bigint; t: bigint }[];
} {
  let r0 = abs(a);
  let r1 = abs(b);
  let s0 = 1n;
  let s1 = 0n;
  let t0 = 0n;
  let t1 = 1n;
  const steps: Step[] = [];
  const terms = [{ r: r0, s: s0, t: t0 }];
  while (r1 !== 0n) {
    const q = r0 / r1;
    const nr = r0 - q * r1;
    const ns = s0 - q * s1;
    const nt = t0 - q * t1;
    steps.push({ r0, r1, q, nr, ns, nt });
    terms.push({ r: r1, s: s1, t: t1 });
    r0 = r1;
    r1 = nr;
    s0 = s1;
    s1 = ns;
    t0 = t1;
    t1 = nt;
  }
  terms.push({ r: r1, s: s1, t: t1 });
  return { steps, terms };
}

/** 걸음 수 하나만 필요할 때. */
const stepCount = (a: bigint, b: bigint): number => trace(a, b).steps.length;

/**
 * 가장 단순한 방법 — `g` 를 구해 두고 `x` 를 `0, ±1, ±2, …` 로 대입해 본다.
 *
 * 실제로 끝까지 대입하면 큰 입력에서 안 끝나므로, **대입해야 하는 후보의 개수**를 정본이 낸
 * `x` 로 센다. `0` 부터 `±|x|` 까지 전부 대입하면 `2|x| + 1` 개다.
 */
function bySearch(a: bigint, b: bigint): { x: bigint; tries: bigint } {
  const { x } = extendedEuclidean(a, b);
  return { x, tries: 2n * abs(x) + 1n };
}

/** `y` 를 마지막에 나눗셈으로 되찾는 판. `b` 가 0 이면 0 으로 나눈다. */
function halfTrack(
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint; y: bigint } | "0 으로 나눈다" {
  let r0 = abs(a);
  let r1 = abs(b);
  let s0 = 1n;
  let s1 = 0n;
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 === 0n) return { g: 0n, x: 0n, y: 0n };
  const g = r0;
  const x = (a < 0n ? -1n : 1n) * s0;
  if (b === 0n) return "0 으로 나눈다";
  return { g, x, y: (g - a * x) / b };
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = {
  extendedEuclidean: (
    a: bigint,
    b: bigint,
  ) => { g: bigint; x: bigint; y: bigint };
};

/** 계수 한 벌을 두 문장으로 나눠 대입한 판. 옛 `s0` 이 덮어써진다. */
const aliased = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /^ {4}\[s0, s1\] = \[s1, s0 - q \* s1\];$/,
      "    s0 = s1;\n    s1 = s0 - q * s1;",
    ],
  });

/** `t` 갱신의 뺄셈을 덧셈으로 바꾼 판. 항등식을 지키던 그 줄이다. */
const tPlus = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /^ {4}\[t0, t1\] = \[t1, t0 - q \* t1\];$/,
      "    [t0, t1] = [t1, t0 + q * t1];",
    ],
  });

/* ────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────── */

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [
    ["입력", "정본 (g, x, y)", `${label} (g, x, y)`, "a·x + b·y"],
  ];
  for (const [name, a, b] of FOUR) {
    const ok = extendedEuclidean(a, b);
    const bad = mod.extendedEuclidean(a, b);
    rows.push([
      name,
      `(${comma(ok.g)}, ${comma(ok.x)}, ${comma(ok.y)})`,
      `(${comma(bad.g)}, ${comma(bad.x)}, ${comma(bad.y)})`,
      comma(a * bad.x + b * bad.y),
    ]);
  }
  return table(rows, [3]).join("\n");
};

const ALIASED = await mutantTable("한 줄씩 대입한 판", aliased);
const T_PLUS = await mutantTable("뺄셈을 덧셈으로 바꾼 판", tPlus);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 대입 탐색의 후보 수가 자릿수마다 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      [
        "작은 쪽 자릿수",
        "입력 (피보나치 이웃)",
        "|x|",
        "대입 후보 수",
        "초당 1억 번 기준",
      ],
    ];
    for (const k of [8, 16, 20, 30, 45, 91]) {
      const a = fib(k);
      const b = fib(k - 1);
      const { x, tries } = bySearch(a, b);
      rows.push([
        comma(b.toString().length),
        `${comma(a)} 과 ${comma(b)}`,
        comma(abs(x)),
        comma(tries),
        duration(Number(tries) / 1e8),
      ]);
    }
    return `${table(rows, [0, 2, 3, 4]).join("\n")}
        └ 계약이 bigint 라 자릿수에 상한이 없다. 자릿수가 하나 늘면 후보 수가 열 배씩 는다`;
  },

  /** 나머지 수열의 각 항이 처음 두 수의 정수 조합으로 적힌다. */
  "combo-walk": () => {
    const A = abs(WALK_A);
    const { terms } = trace(WALK_A, WALK_B);
    const rows: string[][] = [
      ["항", "나머지", `${comma(A)} · s + ${comma(WALK_B)} · t`, "계산하면"],
    ];
    for (const [i, term] of terms.entries()) {
      rows.push([
        `r${i}`,
        comma(term.r),
        `${comma(A)} × (${comma(term.s)}) + ${comma(WALK_B)} × (${comma(term.t)})`,
        comma(A * term.s + WALK_B * term.t),
      ]);
    }
    return table(rows, [1, 3]).join("\n");
  },

  /** 자릿수가 같아도 대입 후보 수와 걸음 수가 갈린다. */
  "search-split": () => {
    const rows: string[][] = [
      ["입력", "작은 쪽 자릿수", "|x|", "대입 후보 수", "걸음 수"],
    ];
    for (const [name, a, b] of [
      ["몫이 거의 다 1 — F(91) 과 F(90)", fib(91), fib(90)],
      ["몫이 전부 2 — P(48) 과 P(47)", pell(48), pell(47)],
      ["몫 하나가 아주 큼 — 10^19 과 10^19 - 1", 10n ** 19n, 10n ** 19n - 1n],
    ] as [string, bigint, bigint][]) {
      const small = a < b ? a : b;
      const { x, tries } = bySearch(a, b);
      rows.push([
        name,
        comma(small.toString().length),
        comma(abs(x)),
        comma(tries),
        comma(stepCount(a, b)),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 몫을 다 적어 두는 판과 걸음마다 갱신하는 판의 저장 칸. */
  "keep-quotients": () => {
    const rows: string[][] = [
      ["입력", "걸음 수", "몫을 적어 두면 칸", "걸음마다 갱신하면 칸"],
    ];
    for (const [name, a, b] of [
      ["전개 입력 -510 과 183", WALK_A, WALK_B],
      ["F(91) 과 F(90)", fib(91), fib(90)],
      ["P(48) 과 P(47)", pell(48), pell(47)],
    ] as [string, bigint, bigint][]) {
      const n = stepCount(a, b);
      rows.push([name, comma(n), comma(n), comma(6)]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 대입 탐색과 계수 갱신을 같은 입력에서 나란히 놓는다. */
  "concept-gain": () => {
    const rows: string[][] = [["입력", "대입 후보 수", "걸음 수"]];
    for (const [name, a, b] of [
      ["전개 입력 -510 과 183", WALK_A, WALK_B],
      ["큰 소수 쌍 1,000,000,007 과 998,244,353", 1_000_000_007n, 998_244_353n],
      ["P(48) 과 P(47)", pell(48), pell(47)],
      ["F(91) 과 F(90)", fib(91), fib(90)],
    ] as [string, bigint, bigint][]) {
      rows.push([name, comma(bySearch(a, b).tries), comma(stepCount(a, b))]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 전개 입력의 걸음마다 값. */
  "walk-trace": () => {
    const { steps } = trace(WALK_A, WALK_B);
    const rows: string[][] = [
      ["걸음", "r0", "r1", "q", "새 나머지", "새 s", "새 t"],
    ];
    for (const [i, s] of steps.entries()) {
      rows.push([
        `T${i + 2}`,
        comma(s.r0),
        comma(s.r1),
        comma(s.q),
        comma(s.nr),
        comma(s.ns),
        comma(s.nt),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5, 6]).join("\n")}
        └ 나눗셈 ${comma(steps.length)} 번으로 끝난다`;
  },

  /** 계수 대입을 한 줄씩 나누면 무엇이 나오는가. */
  "mutant-alias": () => ALIASED,

  /** y 를 마지막에 나눗셈으로 되찾으면 무엇이 나오는가. */
  "half-track": () => {
    const rows: string[][] = [
      ["입력", "정본 (g, x, y)", "y 를 나중에 구하는 판"],
    ];
    for (const [name, a, b] of FOUR) {
      const ok = extendedEuclidean(a, b);
      const got = halfTrack(a, b);
      rows.push([
        name,
        `(${comma(ok.g)}, ${comma(ok.x)}, ${comma(ok.y)})`,
        typeof got === "string"
          ? got
          : `(${comma(got.g)}, ${comma(got.x)}, ${comma(got.y)})`,
      ]);
    }
    return table(rows).join("\n");
  },

  /** 전체 코드를 네 입력에 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "g", "x", "y", "a·x + b·y"]];
    for (const [name, a, b] of FOUR) {
      const r = extendedEuclidean(a, b);
      rows.push([
        name,
        comma(r.g),
        comma(r.x),
        comma(r.y),
        comma(a * r.x + b * r.y),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 계수 쌍이 하나가 아니다 — k 를 옮기면 다른 해가 나온다. */
  "general-solution": () => {
    const r = extendedEuclidean(WALK_A, WALK_B);
    const stepB = WALK_B / r.g;
    const stepA = WALK_A / r.g;
    const { terms } = trace(WALK_A, WALK_B);
    const last = terms[terms.length - 1] ?? { r: 0n, s: 0n, t: 0n };
    const rows: string[][] = [
      [
        "k",
        `x = ${comma(r.x)} + ${comma(stepB)}k`,
        `y = ${comma(r.y)} + ${comma(-stepA)}k`,
        "a·x + b·y",
      ],
    ];
    for (const k of [-1n, 0n, 1n, 2n]) {
      const x = r.x + stepB * k;
      const y = r.y - stepA * k;
      rows.push([comma(k), comma(x), comma(y), comma(WALK_A * x + WALK_B * y)]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 마지막 항의 계수 두 개가 (${comma(last.s)}, ${comma(last.t)}) 이고, 그 절댓값이 B / g = ${comma(abs(WALK_B) / r.g)} 과 A / g = ${comma(abs(WALK_A) / r.g)} 다`;
  },

  /** 항마다 항등식과 행렬식이 무엇이 되는가. */
  "math-check": () => {
    const A = abs(WALK_A);
    const { terms } = trace(WALK_A, WALK_B);
    const rows: string[][] = [
      ["i", "r_i", "s_i", "t_i", "A·s_i + B·t_i", "s_i·t_{i+1} - s_{i+1}·t_i"],
    ];
    for (const [i, term] of terms.entries()) {
      const next = terms[i + 1];
      rows.push([
        comma(i),
        comma(term.r),
        comma(term.s),
        comma(term.t),
        comma(A * term.s + WALK_B * term.t),
        next === undefined ? "—" : comma(term.s * next.t - next.s * term.t),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5]).join("\n")}
        └ A = ${comma(A)}, B = ${comma(WALK_B)} 다. 다섯째 칸이 둘째 칸과 언제나 같고
          여섯째 칸이 +1 과 -1 을 번갈아 낸다`;
  },

  /** 계수 상한이 실제로 지켜지는가 — 제약 규모까지. */
  "coef-bound": () => {
    const rows: string[][] = [
      ["A 와 B", "A 자릿수", "g", "|x|", "B / (2g)", "|y|", "A / (2g)"],
    ];
    const big = (() => {
      let k = 1;
      while (fib(k).toString().length < 617) k += 1;
      return k;
    })();
    for (const [a, b] of [
      [510n, 183n],
      [fib(20), fib(19)],
      [1_000_000_007n, 998_244_353n],
      [fib(91), fib(90)],
      [fib(big + 1), fib(big)],
    ] as [bigint, bigint][]) {
      const r = extendedEuclidean(a, b);
      const bx = b / (2n * r.g);
      const by = a / (2n * r.g);
      const short = (v: bigint): string =>
        v.toString().length > 12 ? `${v.toString().length} 자리` : comma(v);
      rows.push([
        a.toString().length > 12
          ? `${a.toString().length} 자리 두 수`
          : `${comma(a)} 과 ${comma(b)}`,
        comma(a.toString().length),
        comma(r.g),
        short(abs(r.x)),
        short(bx),
        short(abs(r.y)),
        short(by),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5, 6]).join("\n")}
        └ 다섯 줄 다 |x| 가 B / (2g) 이하이고 |y| 가 A / (2g) 이하다`;
  },

  /** 경계에 있는 입력들. */
  "edge-values": () => {
    const rows: string[][] = [["입력", "g", "x", "y", "a·x + b·y"]];
    for (const [name, a, b] of [
      ["둘 다 0", 0n, 0n],
      ["뒤가 0 인 7 과 0", 7n, 0n],
      ["앞이 0 인 0 과 9", 0n, 9n],
      ["같은 값 13 과 13", 13n, 13n],
      ["앞이 더 작은 5 와 17", 5n, 17n],
      ["둘 다 음수인 -510 과 -183", -510n, -183n],
      ["뒤만 음수인 510 과 -183", 510n, -183n],
    ] as [string, bigint, bigint][]) {
      const r = extendedEuclidean(a, b);
      rows.push([
        name,
        comma(r.g),
        comma(r.x),
        comma(r.y),
        comma(a * r.x + b * r.y),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** t 갱신의 뺄셈을 덧셈으로 바꾸면 무엇이 나오는가. */
  "mutant-t-plus": () => T_PLUS,

  /** 두 설계의 걸음 수와 기본 연산 수. */
  "alt-counts": () => {
    const mine = cases["나머지를 0 이상으로 잡는 판"]();
    const rival = cases["최소 절댓값 나머지로 잡는 판"]();
    const rows: string[][] = [
      [
        "입력",
        "나머지 판 걸음",
        "중심 판 걸음",
        "나머지 판 기본 연산",
        "중심 판 기본 연산",
        "적은 쪽",
      ],
    ];
    for (const name of [
      "전개 입력",
      "피보나치 이웃",
      "펠 수열 이웃",
      "큰 소수 쌍",
    ]) {
      const mineOps = mine[`${name} 기본 연산`] as number;
      const rivalOps = rival[`${name} 기본 연산`] as number;
      rows.push([
        name,
        comma(mine[`${name} 걸음`] as number),
        comma(rival[`${name} 걸음`] as number),
        comma(mineOps),
        comma(rivalOps),
        mineOps < rivalOps ? "나머지 판" : "중심 판",
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 계수의 절댓값이 네 입력에서 두 설계 모두 같은가: ${coefficientsAgree() ? "그렇다" : "아니다"}`;
  },

  /** 최악을 만드는 입력 — 자릿수를 맞추고 모양만 바꾼다. */
  "shape-values": () => {
    const rows: string[][] = [
      ["입력 모양", "작은 쪽 자릿수", "걸음 수", "|x|", "g"],
    ];
    for (const [name, a, b] of [
      ["몫이 거의 다 1 (피보나치 이웃)", fib(91), fib(90)],
      ["몫이 전부 2 (펠 수열 이웃)", pell(48), pell(47)],
      ["몫 하나가 아주 큼", 10n ** 18n + 1n, 10n ** 18n],
      ["한쪽이 다른 쪽의 배수", 3n * 10n ** 18n, 10n ** 18n],
      ["둘 다 같은 값", 10n ** 18n, 10n ** 18n],
    ] as [string, bigint, bigint][]) {
      const small = a < b ? a : b;
      const r = extendedEuclidean(a, b);
      rows.push([
        name,
        comma(small.toString().length),
        comma(stepCount(a, b)),
        comma(abs(r.x)),
        comma(r.g),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },
};
