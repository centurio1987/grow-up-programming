/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 나눗셈마다의 `x` · `y` · `r` 은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다. 손익분기 표의 왼쪽 세 칸은 `.alt.ts` 의 `cases` 를 **불러서**
 * 얻는다 — 같은 값을 두 파일에 적으면 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/gcd/gcd-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases } from "./gcd-guide.alt.ts";
import {
  bruteCount,
  commonDivisors,
  fib,
  LIMIT,
  num,
  PER_SECOND,
  rName,
  setText,
  subtractCount,
  subtractLoop,
  trace,
  WALK_A,
  WALK_B,
  WORST_K,
  walk,
} from "./gcd-guide.fig.tsx";
import { gcd } from "./gcd-guide.ref.ts";

const REF = new URL("./gcd-guide.ref.ts", import.meta.url).pathname;

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

/** 등폭 글자 폭 — 한글은 두 칸으로 센다(P15 와 같은 셈). */
const widthOf = (t: string): number =>
  [...t].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const padW = (t: string, to: number): string =>
  t + " ".repeat(Math.max(0, to - widthOf(t)));

const digits = (v: bigint): number => (v < 0n ? -v : v).toString().length;

/** 초를 사람이 읽는 단위로. */
function duration(seconds: number): string {
  if (seconds < 0.001) return "0.001 초 미만";
  if (seconds < 1) return `${seconds.toFixed(3)} 초`;
  if (seconds < 60) return `${seconds.toFixed(1)} 초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)} 분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)} 시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)} 일`;
  return `약 ${num(Math.round(seconds / (86_400 * 365)))} 년`;
}

const verdict = (a: bigint, b: bigint): string => (a === b ? "같다" : "틀리다");

/** 규모 안의 최악 — 과제 상한 아래에서 가장 큰 이웃 피보나치 쌍. */
const WORST_A = fib(WORST_K);
const WORST_B = fib(WORST_K - 1);

/** 라메 상한 `4.785 d + 1` 의 계수 — `1 / log10 φ`. */
const PHI = (1 + Math.sqrt(5)) / 2;
const LAME = 1 / Math.log10(PHI);
const lame = (d: number): number => LAME * d + 1;
const one = (v: number): string =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { gcd: (a: bigint, b: bigint) => bigint };

/** 둘째 인자의 절댓값 처리를 지운 판. **정본 소스에서 기계로 만든다.** */
const noAbs = await loadMutant<Ref>(REF, {
  swap: [/let y = b < 0n \? -b : b;/, "let y = b;"],
});

/**
 * 다음 바퀴의 첫 값을 나머지로 바꾼 판 — 불변식 「쌍의 공약수 집합이 처음과 같다」를 지키던 바로 그
 * 줄이다. 두 값이 같아져 다음 바퀴에 둘 다 0 이 된다.
 */
const keepRemainder = await loadMutant<Ref>(REF, {
  swap: [/^ {4}x = y;$/, "    x = r;"],
});

/** 네 입력 — 두 변이 표가 같은 입력을 쓴다. */
const FOUR: [string, bigint, bigint][] = [
  [`전개 입력 ${WALK_A} 과 ${WALK_B}`, WALK_A, WALK_B],
  ["둘 다 음수인 -12 와 -18", -12n, -18n],
  ["둘째만 음수인 12 와 -18", 12n, -18n],
  ["한쪽이 0 인 7 과 0", 7n, 0n],
];

const mutantTable = (mod: Ref, head: string): string =>
  md(
    ["입력", "정본의 답", head, "판정"],
    FOUR.map(([name, a, b]) => {
      const right = gcd(a, b);
      const got = mod.gcd(a, b);
      return [name, String(right), String(got), verdict(right, got)];
    }),
    [1, 2],
  );

/** 변이와 같은 절차를 걸음마다 기록하는 판. 부르는 쪽이 끝의 값을 변이의 실제 답과 대조한다. */
function recordRun(
  x0: bigint,
  y0: bigint,
  step: (x: bigint, y: bigint, r: bigint) => [bigint, bigint],
): { lines: string[]; x: bigint } {
  let x = x0;
  let y = y0;
  const rows: string[][] = [];
  while (y !== 0n) {
    const r = x % y;
    const [nx, ny] = step(x, y, r);
    rows.push([`x = ${x}, y = ${y}`, `${x} % ${y} = ${r}`, `→ (${nx}, ${ny})`]);
    x = nx;
    y = ny;
  }
  const w = [0, 1].map((c) =>
    Math.max(...rows.map((row) => (row[c] ?? "").length)),
  );
  const lines = rows.map(
    (row) =>
      `  ${(row[0] ?? "").padEnd(w[0] ?? 0)}   ${(row[1] ?? "").padEnd(w[1] ?? 0)}   ${row[2]}`,
  );
  return { lines, x };
}

/** 이름과 값 두 열을 이름 폭에 맞춰 적는다. */
const pairLines = (rows: [string, string][]): string[] => {
  const w = Math.max(...rows.map(([k]) => widthOf(k)));
  return rows.map(([k, v]) => `  ${padW(k, w)}   ${v}`);
};

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 과제 하나를 값으로. */
  conceptTask: () => {
    const t = walk();
    const common = commonDivisors(t.init.x, t.init.y);
    const top = common.at(-1) as bigint;
    if (top !== gcd(WALK_A, WALK_B)) throw new Error("정의와 정본이 다르다");
    return [
      `gcd(${WALK_A}n, ${WALK_B}n)`,
      `  부호를 뗀 두 수   ${t.init.x} · ${t.init.y}`,
      `  공약수 집합       ${setText(common)}`,
      `  가장 큰 것        ${gcd(WALK_A, WALK_B)}`,
    ].join("\n");
  },

  /** `concept` — 바꿈 한 번이 공약수 집합을 그대로 둔다. */
  conceptStep: () => {
    const d = walk().divisions[1];
    if (d === undefined) throw new Error("둘째 바퀴가 없다");
    const before = setText(commonDivisors(d.x, d.y));
    const after = setText(commonDivisors(d.y, d.r));
    return [
      `${d.x} = ${d.q} × ${d.y} + ${d.r}`,
      ...pairLines([
        [`(${d.x}, ${d.y}) 의 공약수`, before],
        [`(${d.y}, ${d.r}) 의 공약수`, after],
      ]),
    ].join("\n");
  },

  /** `concept` — 나머지 수열의 칸 하나를 읽는 법. */
  conceptRead: () => {
    const t = walk();
    const k = 4;
    const a = t.chain[k - 2] as bigint;
    const b = t.chain[k - 1] as bigint;
    const v = t.chain[k] as bigint;
    if (a % b !== v) throw new Error("칸이 앞 두 칸의 나머지가 아니다");
    return [
      `${rName(k)} = ${rName(k - 2)} mod ${rName(k - 1)} = ${a} mod ${b} = ${v}`,
      `정본 기록   바퀴 ${k - 2} 에서 x = ${t.divisions[k - 2]?.x}, y = ${t.divisions[k - 2]?.y}, r = ${t.divisions[k - 2]?.r}`,
    ].join("\n");
  },

  /** `concept` — 두 방법의 비용을 결과만. */
  conceptCost: () => {
    const walkT = walk();
    const worstT = trace(WORST_A, WORST_B);
    const rows = [
      [
        `전개 입력 ${WALK_A} · ${WALK_B}`,
        num(bruteCount(WALK_A, WALK_B)),
        String(walkT.divisions.length),
      ],
      [
        `이웃 피보나치 F(${WORST_K}) · F(${WORST_K - 1})`,
        num(bruteCount(WORST_A, WORST_B)),
        String(worstT.divisions.length),
      ],
    ];
    return [
      md(
        ["입력", "1 부터 전부 나눠 보기의 나눗셈", "유클리드 호제법의 나눗셈"],
        rows,
        [1, 2],
      ),
      "",
      `둘째 줄의 작은 쪽은 ${digits(WORST_B)} 자리 수이고, 유클리드 호제법은 그 쌍에서 나눗셈 ${worstT.divisions.length} 번으로 끝났습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 전부 나눠 보는 방법을 전개 입력에 실행한다. */
  bruteWalk: () => {
    const t = walk();
    const x = t.init.x;
    const y = t.init.y;
    const small = x < y ? x : y;
    let best = 0n;
    let ops = 0n;
    for (let d = 1n; d <= small; d++) {
      ops += 2n;
      if (x % d === 0n && y % d === 0n) best = d;
    }
    if (best !== gcd(WALK_A, WALK_B)) throw new Error("정본과 답이 다르다");
    if (ops !== bruteCount(WALK_A, WALK_B)) throw new Error("세는 식이 다르다");
    return pairLines([
      ["나눠 본 후보", `1 부터 ${small} 까지 ${small} 개`],
      ["나눗셈", `${ops} 번`],
      ["둘 다 나누는 가장 큰 수", String(best)],
    ])
      .map((l) => l.slice(2))
      .join("\n");
  },

  /** `deep.origin` ② — 과제 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [3, 6, 9, 12, 18].map((d) => {
      const small = 10n ** BigInt(d) - 1n;
      const ops = bruteCount(small + 1n, small);
      return [
        String(d),
        num(small),
        num(ops),
        duration(Number(ops) / Number(PER_SECOND)),
      ];
    });
    return [
      md(
        [
          "작은 쪽의 자릿수",
          "작은 쪽의 값",
          "나눗셈",
          "초당 1 억 번일 때 시간",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      "자릿수마다 그 자릿수의 가장 큰 값을 작은 쪽으로 두고 셌습니다. 후보 하나에 나눗셈이 두 번입니다.",
    ].join("\n");
  },

  /** `deep.origin` ③ — 큰 쪽에서 작은 쪽을 빼 나가도 공약수 집합이 그대로다. */
  subtractChain: () => {
    const t = walk();
    const run = subtractLoop(t.init.x, t.init.y);
    const rows = run.pairs.map(([x, y], i) => {
      const prev = run.pairs[i - 1];
      const how =
        prev === undefined
          ? "—"
          : prev[0] > prev[1]
            ? `x 에서 ${prev[1]}${을를(prev[1])} 뺐다`
            : `y 에서 ${prev[0]}${을를(prev[0])} 뺐다`;
      return [String(i), `(${x}, ${y})`, how, setText(commonDivisors(x, y))];
    });
    const sets = new Set(rows.map((r) => r[3]));
    if (run.answer !== gcd(WALK_A, WALK_B)) throw new Error("답이 다르다");
    return [
      md(["뺄셈 횟수", "두 수", "한 일", "공약수 집합"], rows, [0]),
      "",
      `뺄셈 ${run.steps} 번 뒤에 한쪽이 0 이 됐고, 남은 수 ${run.answer}${이가(run.answer)} 정본의 답과 같습니다. 공약수 집합은 ${rows.length} 줄 모두 ${[...sets][0]} 하나입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 뺄셈과 나머지로 처리한 횟수. */
  subtractVsRemainder: () => {
    const small: [string, bigint, bigint][] = [
      [`전개 입력 ${WALK_A} 과 ${WALK_B}`, WALK_A, WALK_B],
      ["1 과 1,000,000", 1n, 1_000_000n],
      ["이웃 피보나치 F(31) · F(30)", fib(31), fib(30)],
      ["1,000,000 과 999,999", 1_000_000n, 999_999n],
    ];
    const rows = small.map(([name, a, b]) => {
      const loop = subtractLoop(a, b);
      const t = trace(a, b);
      if (loop.answer !== t.answer) throw new Error(`${name} 에서 답이 다르다`);
      if (BigInt(loop.steps) !== subtractCount(a, b)) {
        throw new Error(`${name} 에서 몫의 합이 뺄셈 횟수와 다르다`);
      }
      return [
        name,
        num(loop.steps),
        String(t.divisions.length),
        String(t.answer),
      ];
    });
    return [
      md(
        ["입력", "뺄셈만 쓸 때의 연산", "나머지를 쓸 때의 연산", "gcd"],
        rows,
        [1, 2, 3],
      ),
      "",
      "네 줄 모두 두 방법의 답이 같습니다. 뺄셈 횟수는 나머지를 쓸 때 나온 몫을 다 더한 값과도 같습니다.",
    ].join("\n");
  },

  /** `deep.origin` ④ — 1,000,000 과 1 에서 뺄셈 여러 번이 나머지 한 번과 같은 자리에 이른다. */
  subtractRepeat: () => {
    const run = subtractLoop(1_000_000n, 1n);
    const t = trace(1_000_000n, 1n);
    const d = t.divisions[0];
    if (d === undefined) throw new Error("나눗셈이 없다");
    const head = run.pairs
      .slice(0, 3)
      .map(([x, y]) => `(${num(x)}, ${y})`)
      .join(" → ");
    const tail = run.pairs.at(-1) as [bigint, bigint];
    return [
      `뺄셈     ${head} → … → (${num(tail[0])}, ${tail[1]})   ${num(run.steps)} 번`,
      `나머지   ${num(d.x)} mod ${d.y} = ${d.r}  → (${d.y}, ${d.r})   ${t.divisions.length} 번`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 뺄셈만 쓰는 후보를 과제 규모에서 센다. */
  subtractScale: () => {
    const rows: [string, bigint, bigint][] = [
      ["1 과 10^9", 1n, 10n ** 9n],
      ["1 과 10^18", 1n, LIMIT],
      [`이웃 피보나치 F(${WORST_K}) · F(${WORST_K - 1})`, WORST_A, WORST_B],
    ];
    const out = rows.map(([name, a, b]) => {
      const s = subtractCount(a, b);
      return [
        name,
        num(s),
        String(trace(a, b).divisions.length),
        duration(Number(s) / Number(PER_SECOND)),
      ];
    });
    return [
      md(
        ["입력", "뺄셈", "나눗셈", "뺄셈의 시간(초당 1 억 번)"],
        out,
        [1, 2, 3],
      ),
      "",
      "뺄셈 횟수는 되풀이하지 않고 나눗셈마다의 몫을 더해 셌습니다. 앞 표의 네 줄에서 실제로 되풀이한 횟수와 같았던 셈법입니다.",
    ].join("\n");
  },

  /** `deep.build` 1단계 — 공약수인 수와 아닌 수가 한 바퀴를 지나며 어떻게 되는가. */
  stage1Both: () => {
    const d = walk().divisions[1];
    if (d === undefined) throw new Error("둘째 바퀴가 없다");
    const cell = (v: bigint, k: bigint) => (v % k === 0n ? "나눈다" : "—");
    const rows = [7n, 21n, 13n, 8n].map((k) => [
      String(k),
      cell(d.x, k),
      cell(d.y, k),
      cell(d.r, k),
    ]);
    return md(["d", `x = ${d.x}`, `y = ${d.y}`, `r = ${d.r}`], rows, [0]);
  },

  /** `deep.build` 1단계 — 걸음마다 (x, y) 와 (y, r) 의 공약수 집합. */
  stage1Keep: () => {
    const t = walk();
    const rows = t.divisions.map((d) => {
      const before = setText(commonDivisors(d.x, d.y));
      const after = setText(commonDivisors(d.y, d.r));
      return [
        String(d.k),
        `(${d.x}, ${d.y})`,
        String(d.r),
        before,
        after,
        before === after ? "예" : "아니요",
      ];
    });
    const same = rows.filter((r) => r[5] === "예").length;
    return [
      md(
        [
          "바퀴",
          "(x, y)",
          "r = x mod y",
          "(x, y) 의 공약수",
          "(y, r) 의 공약수",
          "두 집합의 일치",
        ],
        rows,
        [0, 2],
      ),
      "",
      `${rows.length} 바퀴 가운데 두 집합이 같은 바퀴가 ${same} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 두 바퀴마다 나머지가 절반 아래로 준다. */
  stage2Halve: () => {
    const t = walk();
    const c = t.chain;
    const rows: string[][] = [];
    for (let k = 0; k + 2 < c.length; k++) {
      const a = c[k] as bigint;
      const b = c[k + 2] as bigint;
      rows.push([
        String(k),
        String(a),
        String(b),
        (Number(a) / 2).toString(),
        2n * b < a ? "예" : "아니요",
      ]);
    }
    const yes = rows.filter((r) => r[4] === "예").length;
    return [
      md(
        ["k", "r_k", "r_(k+2)", "r_k / 2", "r_(k+2) < r_k / 2"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `${rows.length} 줄 가운데 ${yes} 줄에서 두 칸 뒤의 값이 절반 아래이고, 아닌 줄은 k = 0 하나입니다. 그 줄의 첫 나눗셈은 몫이 0 이라 두 값을 뒤바꾸기만 했습니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 절반 아래로 주는 까닭을 두 경우로. */
  stage2Why: () => {
    const t = walk();
    const big = t.divisions.find((d) => 2n * d.y > d.x && d.y < d.x);
    const half = t.divisions.find((d) => 2n * d.y <= d.x);
    if (big === undefined || half === undefined) {
      throw new Error("두 경우가 다 없다");
    }
    const row = (name: string, d: NonNullable<typeof big>) => [
      name,
      `(${d.x}, ${d.y})`,
      String(d.q),
      String(d.r),
      (Number(d.x) / 2).toString(),
      2n * d.r < d.x ? "예" : "아니요",
    ];
    return md(
      ["경우", "(x, y)", "몫", "나머지 r", "x / 2", "r < x / 2"],
      [row("y 가 x 의 절반보다 크다", big), row("y 가 x 의 절반 이하다", half)],
      [2, 3, 4],
    );
  },

  /** `deep.build` 3단계 — 멈추는 자리와 0 이 든 입력. */
  stage3Stop: () => {
    const rows: [bigint, bigint][] = [
      [WALK_A, WALK_B],
      [21n, 0n],
      [7n, 0n],
      [0n, 9n],
      [0n, 0n],
    ];
    return md(
      ["입력", "나눗셈", "마지막 쌍", "반환값"],
      rows.map(([a, b]) => {
        const t = trace(a, b);
        const n = t.chain.length;
        return [
          `gcd(${a}n, ${b}n)`,
          String(t.divisions.length),
          `(${t.chain[n - 2]}, ${t.chain[n - 1]})`,
          String(gcd(a, b)),
        ];
      }),
      [1, 3],
    );
  },

  /** `deep.build` 전제 — bigint 의 `%` 는 나누어지는 수의 부호를 따른다. */
  premiseSign: () => {
    const rows: [bigint, bigint][] = [
      [12n, 18n],
      [-12n, 18n],
      [12n, -18n],
      [-18n, 12n],
    ];
    return md(
      ["x", "y", "x % y", "0 이상이고 y 의 절댓값 미만"],
      rows.map(([x, y]) => {
        const r = x % y;
        const ay = y < 0n ? -y : y;
        return [
          String(x),
          String(y),
          String(r),
          r >= 0n && r < ay ? "예" : "아니요",
        ];
      }),
      [0, 1, 2],
    );
  },

  /** `deep.walk` — 전개 입력. */
  walkInput: () =>
    [
      `const a = ${WALK_A}n;`,
      `const b = ${WALK_B}n;`,
      `// 이 절이 끝나면 ${gcd(WALK_A, WALK_B)}n 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 부호를 뗀 뒤의 두 값. */
  walkInit: () => {
    const t = walk();
    return [
      `T1 이 끝난 시점 — a = ${WALK_A}, b = ${WALK_B}`,
      `  x = ${t.init.x}`,
      `  y = ${t.init.y}`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 절댓값을 안 씌우면 무엇이 나오는가. */
  "mutant-no-abs": () => mutantTable(noAbs, "절댓값을 안 씌운 답"),

  /** `deep.walk.pause` — 둘째 인자가 음수일 때 변이가 지나는 쌍. */
  pauseNoAbsTrace: () => {
    const a = -12n;
    const b = -18n;
    const run = recordRun(-a, b, (_x, y, r) => [y, r]);
    // 중화 실행에서는 변이가 정본과 같은 함수라 대조할 것이 없다 — 그때만 건너뛴다.
    if (noAbs.gcd !== gcd && noAbs.gcd(a, b) !== run.x) {
      throw new Error("기록 판이 변이와 다르다");
    }
    return [
      `gcd(${a}n, ${b}n) 에서 y 의 절댓값을 안 씌우면`,
      ...run.lines,
      `  y 가 0 이라 x = ${run.x}${을를(String(run.x))} 돌려준다`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 앞 세 바퀴. */
  walkLoopHead: () => {
    const t = walk();
    const rows = t.divisions
      .slice(0, 3)
      .map((d) => [
        `T${d.k + 2}`,
        String(d.x),
        String(d.y),
        String(d.r),
        `(${d.y}, ${d.r})`,
      ]);
    return md(
      ["걸음", "x", "y", "r = x % y", "바퀴 끝 (x, y)"],
      rows,
      [1, 2, 3],
    );
  },

  /** `deep.walk.pause` — 큰 쪽을 먼저 앞에 두어야 할 것 같다. */
  orderFirst: () => {
    // 나누기 전에 두 값의 크기를 비교해 큰 쪽을 x 로 두는 판. 비교 한 번이 늘고 나눗셈이 준다.
    const sortFirst = (a: bigint, b: bigint) => {
      let x = a < 0n ? -a : a;
      let y = b < 0n ? -b : b;
      if (x < y) [x, y] = [y, x];
      let divisions = 0;
      while (y !== 0n) {
        const r = x % y;
        divisions++;
        x = y;
        y = r;
      }
      return { answer: x, divisions };
    };
    const inputs: [bigint, bigint][] = [
      [WALK_A, WALK_B],
      [WALK_B, WALK_A],
      [1n, 1_000_000n],
      [0n, 9n],
    ];
    const rows = inputs.map(([a, b]) => {
      const s = sortFirst(a, b);
      const t = trace(a, b);
      return [
        `gcd(${a}n, ${b}n)`,
        String(t.answer),
        String(s.answer),
        String(t.divisions.length),
        String(s.divisions),
      ];
    });
    const most = Math.max(...rows.map((r) => Number(r[3]) - Number(r[4])));
    return [
      md(
        [
          "입력",
          "정본의 답",
          "먼저 정렬한 답",
          "정본의 나눗셈",
          "먼저 정렬한 판의 나눗셈",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `네 줄 모두 두 판의 답이 같고, 나눗셈의 차이는 많아야 ${most} 번입니다. 먼저 정렬한 판은 입력마다 비교를 한 번 더 합니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 아홉 걸음 전부. */
  walkTrace: () => {
    const t = walk();
    const rows: string[][] = [
      ["T1", "—", "—", String(t.init.x), String(t.init.y), "—"],
    ];
    for (const d of t.divisions) {
      rows.push([
        `T${d.k + 2}`,
        `${d.y} ≠ 0 **참**`,
        `${d.x} = ${d.q} × ${d.y} + ${d.r}`,
        String(d.y),
        String(d.r),
        `(${d.y}, ${d.r})`,
      ]);
    }
    rows.push([
      `T${t.divisions.length + 2}`,
      "0 ≠ 0 **거짓**",
      "—",
      String(t.answer),
      "0",
      "—",
    ]);
    return [
      md(
        ["걸음", "② y ≠ 0", "x = q·y + r", "걸음 끝 x", "걸음 끝 y", "다음 쌍"],
        rows,
        [3, 4],
      ),
      "",
      `나눗셈은 모두 ${t.divisions.length} 번이고, 돌려주는 값은 ${t.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 갈래마다 실행된 걸음. */
  walkBranches: () => {
    const t = walk();
    const loop = t.divisions.map((d) => `T${d.k + 2}`);
    const end = `T${t.divisions.length + 2}`;
    return md(
      ["라벨", "하는 일", "전개에서"],
      [
        ["①", "부호를 뗀다", "T1 에서 한 번"],
        [
          "②",
          "나머지로 옮긴다",
          `${loop.join(" · ")} 에서 ${loop.length} 번 · ${end} 에서 조건이 거짓`,
        ],
        ["③", "y 가 0 이 된 순간의 x 를 돌려준다", `${end} 에서 한 번`],
      ],
    );
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 값. */
  finalCalls: () => {
    const calls: [bigint, bigint][] = [
      [WALK_A, WALK_B],
      [12n, 18n],
      [-12n, -18n],
      [17n, 5n],
      [0n, 9n],
      [0n, 0n],
    ];
    const text = calls.map(([a, b]) => `gcd(${a}n, ${b}n)`);
    const w = Math.max(...text.map((s) => s.length));
    return calls
      .map(([a, b], i) => `${(text[i] as string).padEnd(w)}   → ${gcd(a, b)}n`)
      .join("\n");
  },

  /** `related` — 몫을 차례로 모으면 연분수가 된다. */
  continuedFraction: () => {
    const pairs: [bigint, bigint][] = [
      [273n, 441n],
      [441n, 273n],
      [355n, 113n],
    ];
    const rows = pairs.map(([a, b]) => {
      const qs = trace(a, b).divisions.map((d) => d.q);
      const head = qs[0] ?? 0n;
      return [
        `${a} / ${b}`,
        qs.join(" "),
        `[${head}; ${qs.slice(1).join(", ")}]`,
        (Number(a) / Number(b)).toFixed(6),
      ];
    });
    return md(
      ["분수", "차례로 나온 몫", "연분수 표기", "분수의 값"],
      rows,
      [3],
    );
  },

  /** `related` — 연분수를 안쪽부터 되돌려 계산한다. */
  continuedFractionBack: () => {
    const qs = trace(355n, 113n).divisions.map((d) => Number(d.q));
    const lines: string[] = [];
    let v = qs.at(-1) as number;
    const cell = (s: string) => s.padEnd(16);
    lines.push(`  ${cell(String(v))} = ${v}`);
    for (let i = qs.length - 2; i >= 0; i--) {
      const shown = Number.isInteger(v) ? String(v) : v.toFixed(4);
      const text = `${qs[i]} + 1/${shown}`;
      v = (qs[i] as number) + 1 / v;
      lines.push(`  ${cell(text)} = ${v.toFixed(6)}`);
    }
    return [
      `[${qs[0]}; ${qs.slice(1).join(", ")}] 을 안쪽부터 되돌려 계산하면`,
      ...lines,
      `  ${cell("355 / 113")} = ${(355 / 113).toFixed(6)}`,
    ].join("\n");
  },

  /** `purpose.alt` — 나눗셈 한 번을 기본 연산 몇 번으로 쳐야 두 설계가 같아지는가. */
  breakeven: () => {
    const euclid = cases["나머지로 줄이는 유클리드 호제법"]();
    const binary = cases["시프트와 뺄셈만 쓰는 이진 GCD"]();
    const names = [
      "전개 입력",
      "피보나치 이웃",
      "2 의 거듭제곱",
      "공통 인수가 2 의 거듭제곱",
    ];
    const rows = names.map((name) => {
      const euclidOps = euclid[`${name} 기본 연산`] as number;
      const divisions = euclid[`${name} 나눗셈`] as number;
      const binaryOps = binary[`${name} 기본 연산`] as number;
      const binaryDivisions = binary[`${name} 나눗셈`] as number;
      const breakEven = (binaryOps - (euclidOps - divisions)) / divisions;
      return {
        name,
        euclidOps,
        divisions,
        binaryOps,
        binaryDivisions,
        breakEven,
      };
    });
    const sorted = [...rows].sort((p, q) => p.breakEven - q.breakEven);
    const lo = sorted[0] as (typeof rows)[number];
    const hi = sorted.at(-1) as (typeof rows)[number];
    return [
      md(
        [
          "입력",
          "호제법 기본 연산",
          "그중 나눗셈",
          "이진 기본 연산",
          "이진 나눗셈",
          "손익분기 배수",
        ],
        rows.map((r) => [
          r.name,
          num(r.euclidOps),
          num(r.divisions),
          num(r.binaryOps),
          num(r.binaryDivisions),
          r.breakEven.toFixed(2),
        ]),
        [1, 2, 3, 4, 5],
      ),
      "",
      `손익분기 배수는 나눗셈 한 번을 기본 연산 몇 번으로 칠 때 두 설계의 합이 같아지는가이고, 호제법의 두 칸과 이진 기본 연산 한 칸으로 계산했습니다. 가장 작은 줄은 「${lo.name}」의 ${lo.breakEven.toFixed(2)} 배, 가장 큰 줄은 「${hi.name}」의 ${hi.breakEven.toFixed(2)} 배입니다.`,
    ].join("\n");
  },

  /** `deep.math` ① — 마지막 쌍이 가장 작을 때 앞의 값들. 본문의 조각과 같은 절차다. */
  mathMinChain: () => {
    const N = 6;
    let next = 1n; // x_{N+1}
    let cur = 2n; // x_N
    const vals: bigint[] = [0n, next, cur];
    for (let i = 0; i < N - 1; i++) {
      const before = cur + next;
      next = cur;
      cur = before;
      vals.push(cur);
    }
    if (cur !== fib(N + 2) || next !== fib(N + 1)) {
      throw new Error("피보나치와 다르다");
    }
    const run = trace(cur, next).divisions.length;
    const names = vals.map((_, i) => `x_${N + 2 - i}`);
    const w = Math.max(
      ...names.map((s) => s.length),
      ...vals.map((v) => String(v).length),
    );
    const pad = (s: string) => s.padStart(w);
    return [
      `N = ${N} 일 때 뒤에서부터 채운 최솟값`,
      `  자리     ${names.map(pad).join("  ")}`,
      `  최솟값   ${vals.map((v) => pad(String(v))).join("  ")}`,
      `  x_2 = ${next} = F(${N + 1}),  x_1 = ${cur} = F(${N + 2})`,
      `  gcd(${cur}n, ${next}n) 의 나눗셈   ${run} 번`,
    ].join("\n");
  },

  /** `deep.math` ② — 이웃 피보나치 쌍의 나눗셈 횟수와 상한. */
  fibBound: () => {
    const ks = [8, 12, 20, 40, WORST_K];
    const rows = ks.map((k) => {
      const a = fib(k);
      const b = fib(k - 1);
      const d = digits(b);
      return [
        String(k),
        num(a),
        num(b),
        String(trace(a, b).divisions.length),
        String(d),
        one(lame(d)),
      ];
    });
    const always = ks.every(
      (k) => trace(fib(k), fib(k - 1)).divisions.length === k - 2,
    );
    const under = rows.every((r) => Number(r[3]) <= Number(r[5]));
    return [
      md(
        ["k", "F(k)", "F(k−1)", "나눗셈 N", "작은 쪽 자릿수 d", "4.785d + 1"],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 줄에서 나눗셈 횟수가 k − 2 인가: ${always ? "예" : "아니요"}. 4.785d + 1 을 넘는 줄이 있는가: ${under ? "없습니다" : "있습니다"}.`,
    ].join("\n");
  },

  /** `deep.math` ② — 전개 입력에서 부등식을 확인한다. */
  mathWalkCheck: () => {
    const t = walk();
    const swapped = trace(t.init.y, t.init.x);
    const n = swapped.divisions.length;
    const small = t.init.x < t.init.y ? t.init.x : t.init.y;
    const notOne = swapped.divisions.filter((d) => d.q !== 1n).length;
    const g = t.answer;
    const big = t.init.y / g;
    const little = t.init.x / g;
    let kBig = 1;
    while (fib(kBig) < big) kBig++;
    if (fib(kBig) !== big || fib(kBig - 1) !== little) {
      throw new Error("전개 입력이 이웃 피보나치 쌍의 배수가 아니다");
    }
    return [
      `전개 입력의 나눗셈   ${t.divisions.length} 번 — 첫 번은 몫이 0 이라 두 값을 뒤바꾸기만 한다`,
      `뒤바꾼 (${t.init.y}, ${t.init.x})   N = ${n}   F(N + 1) = F(${n + 1}) = ${fib(n + 1)}`,
      `작은 쪽 ${small} ≥ ${fib(n + 1)} 인가: ${small >= fib(n + 1) ? "예" : "아니요"}`,
      `몫 ${swapped.divisions.map((d) => d.q).join(" ")} 가운데 1 이 아닌 몫 ${notOne} 개`,
      `(${t.init.y}, ${t.init.x}) = ${g} × (${big}, ${little}) — (${big}, ${little}) 은 이웃 피보나치 쌍 F(${kBig}) · F(${kBig - 1})`,
    ].join("\n");
  },

  /** `deep.math` ② — 귀납의 기저 둘. */
  phiBase: () =>
    [2, 3]
      .map((k) => {
        const f = fib(k);
        const p = PHI ** (k - 2);
        return `k = ${k}   F(${k}) = ${f}   φ^${k - 2} = ${p.toFixed(3)}   ${f} ≥ ${p.toFixed(3)} 인가: ${Number(f) >= p ? "예" : "아니요"}`;
      })
      .join("\n"),

  /** `deep.math` ② — 피보나치 수의 아래쪽 경계. */
  phiBound: () => {
    const ks = [2, 5, 10, 20, 40, WORST_K];
    const rows = ks.map((k) => {
      const f = fib(k);
      const p = PHI ** (k - 2);
      return [
        String(k),
        num(f),
        p > 1e15 ? p.toExponential(3) : num(Math.round(p)),
        Number(f) >= p ? "예" : "아니요",
      ];
    });
    const yes = rows.filter((r) => r[3] === "예").length;
    return [
      md(["k", "F(k)", "φ^(k−2)", "F(k) ≥ φ^(k−2)"], rows, [0, 1, 2]),
      "",
      `${rows.length} 줄 가운데 ${yes} 줄에서 부등식이 참입니다. φ^(k−2) 는 반올림한 값입니다.`,
    ].join("\n");
  },

  /** `deep.math` ③ — 상수 4.785 의 출처. */
  mathConst: () =>
    [
      `log10 φ = log10 ${PHI.toFixed(6)} = ${Math.log10(PHI).toFixed(6)}`,
      `1 / ${Math.log10(PHI).toFixed(6)} = ${LAME.toFixed(4)}`,
    ].join("\n"),

  /** `deep.math` ④ — 과제 규모에 넣는다. */
  mathScale: () => {
    const worst = trace(WORST_A, WORST_B).divisions.length;
    const d = digits(WORST_B);
    return md(
      ["작은 쪽 자릿수 d", "상한 4.785d + 1", "실측", "1 부터 전부 나눠 보기"],
      [
        [
          String(d),
          one(lame(d)),
          `${worst} (F(${WORST_K}) · F(${WORST_K - 1}))`,
          `2 × 10^${d} 번 안팎`,
        ],
        ["100", one(lame(100)), "—", "2 × 10^100 번 안팎"],
        ["1,000", one(lame(1000)), "—", "2 × 10^1000 번 안팎"],
      ],
      [0, 1],
    );
  },

  /** `invariant` ② — 걸음마다 쌍과 공약수 집합. */
  invariantPairs: () => {
    const t = walk();
    const pairs: [string, bigint, bigint][] = [
      ["T1 이 끝난 뒤", t.init.x, t.init.y],
      ...t.divisions.map(
        (d) =>
          [`T${d.k + 2}${이가(`T${d.k + 2}`)} 끝난 뒤`, d.y, d.r] as [
            string,
            bigint,
            bigint,
          ],
      ),
    ];
    const first = setText(commonDivisors(t.init.x, t.init.y));
    const rows = pairs.map(([when, x, y]) => {
      const s = setText(commonDivisors(x, y));
      return [when, `(${x}, ${y})`, s, s === first ? "예" : "아니요"];
    });
    const yes = rows.filter((r) => r[3] === "예").length;
    return [
      md(["시점", "(x, y)", "공약수 집합", "처음 집합과 일치"], rows),
      "",
      `${rows.length} 시점 가운데 ${yes} 시점에서 공약수 집합이 ${first} 입니다. y 는 ${pairs.map((p) => p[2]).join(" → ")}${으로(String(pairs.at(-1)?.[2]))} 시점마다 줄었습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  invariantEdges: () => {
    const edges: [string, bigint, bigint][] = [
      ["둘 다 0", 0n, 0n],
      ["한쪽이 0", 7n, 0n],
      ["앞이 0", 0n, 9n],
      ["같은 값", 7n, 7n],
      ["둘 다 음수", -12n, -18n],
      ["둘째만 음수", 12n, -18n],
      ["한쪽이 1", 1n, 1_000_000n],
      ["작은 쪽이 앞", 273n, 441n],
    ];
    const rows = edges.map(([name, a, b]) => {
      const t = trace(a, b);
      const x = a < 0n ? -a : a;
      const y = b < 0n ? -b : b;
      const byDef =
        x === 0n && y === 0n ? 0n : (commonDivisors(x, y).at(-1) ?? 0n);
      return [
        `${name} gcd(${a}n, ${b}n)`,
        String(t.divisions.length),
        String(gcd(a, b)),
        String(byDef),
      ];
    });
    const agree = rows.filter((r) => r[2] === r[3]).length;
    return [
      md(["입력", "나눗셈", "정본의 답", "정의로 구한 값"], rows, [1, 2, 3]),
      "",
      `${rows.length} 입력 가운데 ${agree} 입력에서 정본의 답이 정의로 구한 값과 일치합니다. 정의로 구할 때 둘 다 0 이면 0 으로 둡니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 나머지를 두 자리에 다 넣으면 무엇이 나오는가. */
  "mutant-keep-remainder": () => mutantTable(keepRemainder, "나머지를 남긴 답"),

  /** `invariant` ③ — 전개 입력에서 변이가 지나는 쌍. */
  mutantKeepTrace: () => {
    const t = walk();
    const run = recordRun(t.init.x, t.init.y, (_x, _y, r) => [r, r]);
    // 중화 실행에서는 변이가 정본과 같은 함수라 대조할 것이 없다 — 그때만 건너뛴다.
    if (
      keepRemainder.gcd !== gcd &&
      keepRemainder.gcd(WALK_A, WALK_B) !== run.x
    ) {
      throw new Error("기록 판이 변이와 다르다");
    }
    const first = t.init.x % t.init.y;
    return [
      `gcd(${WALK_A}n, ${WALK_B}n) 에서 x 에 y 대신 r 을 넣으면`,
      ...run.lines,
      `  y 가 0 이라 x = ${run.x}${을를(String(run.x))} 돌려준다`,
      ...pairLines([
        [
          `첫 바퀴 뒤의 쌍 (${first}, ${first}) 의 공약수`,
          setText(commonDivisors(first, first)),
        ],
        ["처음 쌍의 공약수", setText(commonDivisors(t.init.x, t.init.y))],
      ]),
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력에서 실제로 한 일. */
  perfCount: () => {
    const t = walk();
    const n = t.divisions.length;
    return [
      md(
        ["일", "걸음", "횟수"],
        [
          ["부호 판정과 절댓값", "T1", "2"],
          ["나눗셈", `T2 ~ T${n + 1}`, String(n)],
          ["두 값 옮기기", `T2 ~ T${n + 1}`, String(2 * n)],
          ["반복 조건 판정", `T2 ~ T${n + 2}`, String(n + 1)],
        ],
        [2],
      ),
      "",
      `나눗셈 ${n} 번에 옮기기가 ${2 * n} 번, 반복 조건 판정이 ${n + 1} 번 따라붙었습니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 과제 규모의 총식. */
  perfTotal: () => {
    const worst = trace(WORST_A, WORST_B).divisions.length;
    const d = digits(WORST_B);
    return [
      "두 수가 10^18 이하일 때",
      ...pairLines([
        ["작은 쪽 자릿수 d", `${d} 이하`],
        ["나눗셈 N ≤ 4.785d + 1", one(lame(d))],
        ["규모 안의 최악", `${worst}   (F(${WORST_K}), F(${WORST_K - 1}))`],
        ["저장 칸", "x · y · r 셋"],
      ]),
    ].join("\n");
  },

  /** `perf.worst` — 모양을 바꿔 가며 실제로 재 본다. */
  shapeValues: () => {
    const shapes: [string, bigint, bigint][] = [
      [`이웃 피보나치 F(${WORST_K}) · F(${WORST_K - 1})`, WORST_A, WORST_B],
      ["서로소인 큰 두 수", 999_999_999_999_999_989n, 999_999_999_999_999_961n],
      ["한쪽이 다른 쪽의 배수", LIMIT, 10n ** 9n],
      ["둘 다 같은 값", LIMIT, LIMIT],
      ["한쪽이 1", LIMIT, 1n],
    ];
    const rows = shapes.map(([name, a, b]) => {
      const small = a < b ? a : b;
      const t = trace(a, b);
      return [
        name,
        String(digits(small)),
        String(t.divisions.length),
        num(t.answer),
      ];
    });
    const f = rows[0] as string[];
    const s = rows[1] as string[];
    return [
      md(["입력 모양", "작은 쪽 자릿수", "나눗셈", "gcd"], rows, [1, 2, 3]),
      "",
      `첫 줄과 둘째 줄은 작은 쪽이 ${f[1]} 자리와 ${s[1]} 자리인데 나눗셈이 ${f[2]} 번과 ${s[2]} 번입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 두 수에 21 을 곱하면 나눗셈 횟수가 어떻게 되는가. */
  selfcheckScaled: () => {
    const k = 12;
    const base = trace(fib(k), fib(k - 1));
    const a = 21n * fib(k);
    const b = 21n * fib(k - 1);
    const scaled = trace(a, b);
    const qs = (t: typeof base) => t.divisions.map((d) => d.q).join(" ");
    return md(
      ["입력", "나눗셈", "몫", "gcd"],
      [
        [
          `gcd(${fib(k)}n, ${fib(k - 1)}n)`,
          String(base.divisions.length),
          qs(base),
          String(base.answer),
        ],
        [
          `gcd(${a}n, ${b}n)`,
          String(scaled.divisions.length),
          qs(scaled),
          String(gcd(a, b)),
        ],
      ],
      [1, 3],
    );
  },
};
