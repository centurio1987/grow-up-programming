/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 나눗셈마다의 `r0` · `r1` · `s0` · `s1` · `t0` · `t1` · `q` 는 그림 사이드카의 `trace`(정본 소스에서 기계로
 * 만든 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다. 경쟁 설계 대조 표는 `.alt.ts` 의 `cases` 를
 * **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 *
 * **큰 입력에는 값만 세는 판을 쓴다.** 대입 탐색은 `x` 의 절댓값만큼 후보를 보므로 큰 입력에서 끝까지
 * 대입하면 끝나지 않는다. 그래서 작은 입력에서는 실제로 대입하는 `searchRun` 을, 큰 입력에서는 몇 번째
 * 후보에서 멈추는지를 셈으로 내는 `searchCount` 를 쓰고, 두 판이 같은지는 `searchWalk` 블록이 대조한다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases, coefficientsAgree } from "./extendedEuclidean-guide.alt.ts";
import {
  abs,
  backSubstitute,
  divisionCount,
  fib,
  LIMIT,
  num,
  PELL_K,
  PER_SECOND,
  pell,
  rName,
  searchCount,
  searchRun,
  trace,
  WALK_A,
  WALK_B,
  WORST_K,
  walk,
} from "./extendedEuclidean-guide.fig.tsx";
import { extendedEuclidean } from "./extendedEuclidean-guide.ref.ts";

const REF = new URL("./extendedEuclidean-guide.ref.ts", import.meta.url)
  .pathname;

type Result = { g: bigint; x: bigint; y: bigint };
type Ref = { extendedEuclidean: (a: bigint, b: bigint) => Result };

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  // 칸 안의 `|`(절댓값 기호)는 표의 칸 경계로 읽히지 않게 막는다.
  const line = (cells: string[]) =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 등폭 글자 폭 — 한글은 두 칸으로 센다(P15 와 같은 셈). */
const widthOf = (t: string): number =>
  [...t].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const padW = (t: string, to: number): string =>
  t + " ".repeat(Math.max(0, to - widthOf(t)));

/** 이름과 값 두 열을 이름 폭에 맞춰 적는다. */
const pairLines = (rows: [string, string][], indent = "  "): string[] => {
  const w = Math.max(...rows.map(([k]) => widthOf(k)));
  return rows.map(([k, v]) => `${indent}${padW(k, w)}   ${v}`);
};

/** 여러 열을 열마다 가장 넓은 칸에 맞춰 세 칸 띄워 적는다. 빈 칸 뒤의 공백은 지운다. */
const columns = (rows: string[][], indent = ""): string[] => {
  const n = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: n }, (_, c) =>
    Math.max(...rows.map((r) => widthOf(r[c] ?? ""))),
  );
  return rows.map((r) =>
    `${indent}${r.map((cell, c) => (c === r.length - 1 ? cell : padW(cell, w[c] ?? 0))).join("   ")}`.trimEnd(),
  );
};

const digits = (v: bigint): number => abs(v).toString().length;

/** 음수는 괄호로 싼다 — `183 × (-2)`. */
const par = (v: bigint): string => (v < 0n ? `(${num(v)})` : num(v));

const triple = (r: Result): string => `(${num(r.g)}, ${num(r.x)}, ${num(r.y)})`;

const same = (p: Result, q: Result): boolean =>
  p.g === q.g && p.x === q.x && p.y === q.y;

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

/** 라메 상한 `4.785 d + 1` 의 계수 — `1 / log10 φ`. 앞 편 `gcd` 가 유도했다. */
const LAME = 1 / Math.log10((1 + Math.sqrt(5)) / 2);
const one = (v: number): string =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 정의대로의 최대공약수 — 경계 표의 대조에 쓴다(정본과 따로 구한다). */
function naiveGcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** 규모 안의 최악 — 과제 상한 아래에서 가장 큰 이웃 피보나치 쌍. */
const WORST_A = fib(WORST_K);
const WORST_B = fib(WORST_K - 1);
const PELL_A = pell(PELL_K);
const PELL_B = pell(PELL_K - 1);

/** 몫의 모양이 다른 네 입력 — 「아이디어를 떠올리는 과정」 ④ · ⑤ 가 쓴다. */
const SPREAD: [string, bigint, bigint][] = [
  [`전개 입력 ${WALK_A} 과 ${WALK_B}`, WALK_A, WALK_B],
  [`몫이 거의 다 1 — F(${WORST_K}) · F(${WORST_K - 1})`, WORST_A, WORST_B],
  [`몫이 전부 2 — P(${PELL_K}) · P(${PELL_K - 1})`, PELL_A, PELL_B],
  ["몫 하나가 아주 큼 — 10^18 · 10^18 - 1", LIMIT, LIMIT - 1n],
];

/* ────────────────────────── 변이 ────────────────────────── */

/** 계수 한 쌍을 두 문장으로 나눠 대입한 판. 옛 `s0` 이 덮어써진다. **정본 소스에서 기계로 만든다.** */
const aliased = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}\[s0, s1\] = \[s1, s0 - q \* s1\];$/,
    "    s0 = s1;\n    s1 = s0 - q * s1;",
  ],
});

/** `t` 갱신의 뺄셈을 덧셈으로 바꾼 판 — 불변식의 `B·t` 쪽을 지키던 그 줄이다. */
const tPlus = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}\[t0, t1\] = \[t1, t0 - q \* t1\];$/,
    "    [t0, t1] = [t1, t0 + q * t1];",
  ],
});

/** 네 입력 — 두 변이 표와 「y 를 나중에 구하는 판」이 같은 입력을 쓴다. */
const FOUR: [string, bigint, bigint][] = [
  [`전개 입력 ${WALK_A} 과 ${WALK_B}`, WALK_A, WALK_B],
  ["서로소인 17 과 5", 17n, 5n],
  ["한쪽이 0 인 7 과 0", 7n, 0n],
  ["둘 다 0", 0n, 0n],
];

const mutantTable = (mod: Ref, head: string): string =>
  md(
    ["입력", "정본 (g, x, y)", head, "a·x + b·y", "판정"],
    FOUR.map(([name, a, b]) => {
      const right = extendedEuclidean(a, b);
      const got = mod.extendedEuclidean(a, b);
      return [
        name,
        triple(right),
        triple(got),
        num(a * got.x + b * got.y),
        same(right, got) ? "같다" : "틀리다",
      ];
    }),
    [3],
  );

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 과제 하나를 값으로. */
  conceptTask: () => {
    const { g, x, y } = extendedEuclidean(WALK_A, WALK_B);
    const left = WALK_A * x;
    const right = WALK_B * y;
    return [
      `extendedEuclidean(${WALK_A}n, ${WALK_B}n)`,
      ...pairLines([
        [
          "g",
          `${g}   ${abs(WALK_A)}${과와(abs(WALK_A))} ${abs(WALK_B)} 의 최대공약수`,
        ],
        ["(x, y)", `(${x}, ${y})`],
        [
          "a·x + b·y",
          `${WALK_A} × ${par(x)} + ${WALK_B} × ${par(y)} = ${num(left)} ${right < 0n ? "-" : "+"} ${num(abs(right))} = ${left + right}`,
        ],
      ]),
    ].join("\n");
  },

  /** `concept` — 두 방법의 비용을 결과만. */
  conceptCost: () => {
    const rows = [
      [`전개 입력 ${WALK_A} · ${WALK_B}`, WALK_A, WALK_B],
      [`이웃 피보나치 F(${WORST_K}) · F(${WORST_K - 1})`, WORST_A, WORST_B],
    ] as [string, bigint, bigint][];
    const out = rows.map(([name, a, b]) => {
      const n = divisionCount(a, b);
      return [name, num(searchCount(a, b).tries + BigInt(n)), String(n)];
    });
    return [
      md(
        ["입력", "x 를 대입해 찾기의 나눗셈", "확장 유클리드 호제법의 나눗셈"],
        out,
        [1, 2],
      ),
      "",
      `둘째 줄의 작은 쪽은 ${digits(WORST_B)} 자리 수이고, 확장 유클리드 호제법은 그 쌍에서 나눗셈 ${divisionCount(WORST_A, WORST_B)} 번으로 g 와 계수 둘을 함께 냈습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 대입 탐색을 전개 입력에 실제로 실행한다. */
  searchWalk: () => {
    const run = searchRun(WALK_A, WALK_B);
    const count = searchCount(WALK_A, WALK_B);
    const { g, x, y } = extendedEuclidean(WALK_A, WALK_B);
    if (run.x !== count.x || BigInt(run.tries) !== count.tries) {
      throw new Error("실제로 대입한 판과 세기만 하는 판이 다르다");
    }
    if (run.x !== x) throw new Error("대입 탐색이 정본과 다른 x 에서 멈췄다");
    const found = (g - WALK_A * run.x) / WALK_B;
    if (found !== y) throw new Error("대입 탐색의 y 가 정본과 다르다");
    const n = divisionCount(WALK_A, WALK_B);
    return pairLines(
      [
        ["g 를 구하는 나눗셈", `${n} 번`],
        [
          "대입한 후보",
          `0, 1, -1, 2, -2, …, ${abs(run.x)}, ${run.x} 까지 ${run.tries} 개`,
        ],
        [
          "멈춘 자리",
          `x = ${run.x}   (${g} - (${WALK_A}) × (${run.x})) / ${WALK_B} = ${num(found)}`,
        ],
        ["나눗셈 합", `${n} + ${run.tries} = ${n + run.tries} 번`],
        [
          "세기만 하는 판",
          `멈출 후보의 순번 ${count.tries} — 실제로 대입한 개수와 같다`,
        ],
      ],
      "",
    ).join("\n");
  },

  /** `deep.origin` ② — 과제 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [3, 6, 9, 12, 18].map((d) => {
      let k = 2;
      while (fib(k + 1) <= 10n ** BigInt(d)) k++;
      const a = fib(k);
      const b = fib(k - 1);
      const { x, tries } = searchCount(a, b);
      const total = tries + BigInt(divisionCount(a, b));
      return [
        `10^${d}`,
        `F(${k}) · F(${k - 1})`,
        num(abs(x)),
        num(total),
        duration(Number(total) / Number(PER_SECOND)),
      ];
    });
    return [
      md(
        [
          "두 수의 상한",
          "그 아래 가장 큰 이웃 피보나치 쌍",
          "|x|",
          "나눗셈",
          "초당 1 억 번일 때 시간",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      "나눗셈은 g 를 구하는 몫과 후보마다의 나머지를 더해 셌습니다. 후보 수는 끝까지 대입하지 않고 멈출 후보의 순번으로 셌습니다.",
    ].join("\n");
  },

  /** `deep.origin` ③ — 몫을 적어 두고 끝에서부터 거슬러 대입한다. */
  backHand: () => {
    const tr = walk();
    const { rows, result } = backSubstitute(WALK_A, WALK_B);
    const g = tr.result.g;
    const lines: string[][] = [];
    for (const row of rows) {
      const rk = tr.chain[row.k] as bigint;
      const rk1 = tr.chain[row.k + 1] as bigint;
      if (row.u * rk + row.v * rk1 !== g) {
        throw new Error("거슬러 대입한 식이 g 를 안 만든다");
      }
      const d = tr.divisions[row.k];
      const how =
        d === undefined
          ? `${rName(row.k + 1)} = 0 에서 출발`
          : `${d.nr} = ${rk} - ${d.q} × ${rk1}${을를(rk1)} 넣었다`;
      lines.push([
        `${g} = ${par(row.u)} × ${rk} + ${par(row.v)} × ${rk1}`,
        how,
      ]);
    }
    if (!same(result, tr.result)) {
      throw new Error("거슬러 대입한 답이 정본과 다르다");
    }
    return [
      ...columns(lines),
      `부호를 붙이면 x = ${result.x}, y = ${result.y} — 정본의 답과 같다`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 몫의 모양이 다른 입력에서 대입 탐색과 거슬러 대입의 나눗셈. */
  searchVsBack: () => {
    const rows = SPREAD.map(([name, a, b]) => {
      const n = divisionCount(a, b);
      const s = searchCount(a, b);
      const small = abs(a) < abs(b) ? abs(a) : abs(b);
      const back = backSubstitute(a, b).result;
      if (!same(back, extendedEuclidean(a, b))) {
        throw new Error(`${name} 에서 답이 다르다`);
      }
      return [
        name,
        String(digits(small)),
        num(abs(s.x)),
        num(s.tries + BigInt(n)),
        String(n),
      ];
    });
    const big = rows.filter((r) => r[1] === "18").map((r) => r[3] as string);
    const asNum = (t: string) => BigInt(t.replaceAll(",", ""));
    big.sort((p, q) => (asNum(p) < asNum(q) ? -1 : 1));
    const spread = [big[0], big.at(-1)];
    return [
      md(
        [
          "입력",
          "작은 쪽 자릿수",
          "|x|",
          "대입 탐색의 나눗셈",
          "거슬러 대입의 나눗셈",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `거슬러 대입의 나눗셈은 나머지 수열을 만드는 몫 N 번이 전부입니다. 네 줄 모두 거슬러 대입한 (g, x, y) 가 정본의 답과 같습니다. 작은 쪽이 18 자리인 세 줄에서 대입 탐색의 나눗셈은 ${spread[0]} 번부터 ${spread[1]} 번까지 갈립니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 거슬러 대입이 적어 두는 몫. */
  backMemory: () => {
    const rows = SPREAD.map(([name, a, b]) => {
      const { quotients } = backSubstitute(a, b);
      return [name, String(divisionCount(a, b)), String(quotients.length)];
    });
    const most = Math.max(...rows.map((r) => Number(r[2])));
    return [
      md(["입력", "나눗셈 N", "적어 두는 몫"], rows, [1, 2]),
      "",
      `몫은 네 줄 모두 나눗셈 수만큼 적어 둡니다. 가장 많은 줄도 ${most} 칸이라 메모리가 모자라지는 않습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 앞에서 뒤로 대입해도 같은 모양의 식이 나온다. */
  forwardTwo: () => {
    const tr = walk();
    const [d0, d1] = tr.divisions;
    if (d0 === undefined || d1 === undefined) {
      throw new Error("바퀴가 둘보다 적다");
    }
    const A = tr.A;
    const B = tr.B;
    if (A * d1.ns + B * d1.nt !== d1.nr) {
      throw new Error("둘째 조합이 나머지를 안 만든다");
    }
    return [
      ...columns([
        [`${d0.nr}`, `= ${A} - ${d0.q} × ${B}`, "나머지를 만든 등식"],
        [
          `${d0.nr}`,
          `= ${A} × ${par(d0.ns)} + ${B} × ${par(d0.nt)}`,
          `계수 (${d0.ns}, ${d0.nt})`,
        ],
        [`${d1.nr}`, `= ${B} - ${d1.q} × ${d0.nr}`, "나머지를 만든 등식"],
        [
          `${d1.nr}`,
          `= ${B} - ${d1.q} × (${A} - ${d0.q} × ${B})`,
          `${d0.nr} 자리에 위 식을 넣었다`,
        ],
        [
          `${d1.nr}`,
          `= ${A} × ${par(d1.ns)} + ${B} × ${par(d1.nt)}`,
          `계수 (${d1.ns}, ${d1.nt})`,
        ],
        [
          "계수만",
          `(${d1.s0}, ${d1.t0}) - ${d1.q} × (${d1.s1}, ${d1.t1}) = (${d1.ns}, ${d1.nt})`,
          "앞 두 칸의 계수에 나머지와 같은 식",
        ],
      ]),
    ].join("\n");
  },

  /** `deep.build` 개념 (b) — 전개 입력의 칸 전부. */
  buildRows: () => {
    const tr = walk();
    let ok = 0;
    const rows = tr.chain.map((r, k) => {
      const s = tr.s[k] as bigint;
      const t = tr.t[k] as bigint;
      const v = tr.A * s + tr.B * t;
      if (v === r) ok += 1;
      return [
        rName(k),
        num(r),
        num(s),
        num(t),
        `${tr.A} × ${par(s)} + ${tr.B} × ${par(t)} = ${num(v)}`,
      ];
    });
    return [
      md(["칸", "나머지 수열", "s 줄", "t 줄", "A·s + B·t"], rows, [1, 2, 3]),
      "",
      `${rows.length} 칸 가운데 A·s + B·t 가 그 칸의 나머지 수열 값과 같은 칸이 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 칸 하나를 읽는 법. */
  buildRead: () => {
    const tr = walk();
    const k = 4;
    const r = tr.chain[k] as bigint;
    const s = tr.s[k] as bigint;
    const t = tr.t[k] as bigint;
    const d = tr.divisions[k - 2];
    if (d === undefined || d.nr !== r) {
      throw new Error("칸이 바퀴 기록과 다르다");
    }
    return pairLines(
      [
        ["칸", `${rName(k)} — 나머지 수열 값 ${r}`],
        ["계수", `s = ${s}, t = ${t}`],
        [
          "읽으면",
          `${tr.A} × ${par(s)} + ${tr.B} × ${par(t)} = ${num(tr.A * s)} - ${num(abs(tr.B * t))} = ${tr.A * s + tr.B * t}`,
        ],
        [
          "정본 기록",
          `바퀴 ${d.k}${이가(d.k)} (${d.r0}, ${d.r1})${을를(d.r1)} 몫 ${d.q}${으로(d.q)} 나눠 채운 칸`,
        ],
      ],
      "",
    ).join("\n");
  },

  /** `deep.build` 개념 (d) — 새 칸의 세 값을 앞 두 칸에서. */
  buildNeighbor: () => {
    const d = walk().divisions[2];
    if (d === undefined) throw new Error("셋째 바퀴가 없다");
    return pairLines(
      [
        ["몫", `q = ⌊${d.r0} / ${d.r1}⌋ = ${d.q}`],
        ["나머지 수열", `${d.r0} - ${d.q} × ${par(d.r1)} = ${d.nr}`],
        ["s 줄", `${d.s0} - ${d.q} × ${par(d.s1)} = ${d.ns}`],
        ["t 줄", `${d.t0} - ${d.q} × ${par(d.t1)} = ${d.nt}`],
      ],
      "",
    ).join("\n");
  },

  /** `deep.build` 개념 (e) — 입력 그대로의 a 로 읽으면 칸이 안 맞는다. */
  buildSigned: () => {
    const tr = walk();
    let hit = 0;
    let zeroS = 0;
    const hits: string[] = [];
    const rows = tr.chain.map((r, k) => {
      const s = tr.s[k] as bigint;
      const t = tr.t[k] as bigint;
      const signed = WALK_A * s + WALK_B * t;
      const absed = tr.A * s + tr.B * t;
      if (signed === r) {
        hit += 1;
        hits.push(rName(k));
        if (s === 0n) zeroS += 1;
      }
      return [
        rName(k),
        num(r),
        num(absed),
        num(signed),
        signed === r ? "예" : "아니요",
      ];
    });
    return [
      md(
        [
          "칸",
          "나머지 수열",
          `${tr.A}·s + ${tr.B}·t`,
          `${WALK_A}·s + ${WALK_B}·t`,
          "입력 그대로 읽은 값의 일치",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `입력 그대로 읽어도 맞는 칸은 ${rows.length} 칸 가운데 ${hits.join(" · ")} 의 ${hit} 칸이고, ${hit === zeroS ? "모두 s 가 0 이라 a 의 부호가 곱해질 자리가 없는 칸입니다" : "그 가운데 s 가 0 이 아닌 칸도 있습니다"}.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 첫 두 칸의 계수. */
  stage1Init: () => {
    const tr = walk();
    const rows = [0, 1].map((k) => {
      const s = tr.s[k] as bigint;
      const t = tr.t[k] as bigint;
      return [
        rName(k),
        num(tr.chain[k] as bigint),
        `(${s}, ${t})`,
        `${tr.A} × ${s} + ${tr.B} × ${t} = ${tr.A * s + tr.B * t}`,
      ];
    });
    return md(["칸", "나머지 수열", "계수 (s, t)", "A·s + B·t"], rows, [1]);
  },

  /** `deep.build` 2단계 — 바퀴마다 새 칸의 세 값과 그 대조. */
  stage2Keep: () => {
    const tr = walk();
    let ok = 0;
    const rows = tr.divisions.map((d) => {
      const back = tr.A * d.ns + tr.B * d.nt;
      if (back === d.nr) ok += 1;
      return [
        String(d.k),
        `(${d.r0}, ${d.r1})`,
        String(d.q),
        num(d.nr),
        `(${d.ns}, ${d.nt})`,
        num(back),
      ];
    });
    return [
      md(
        [
          "바퀴",
          "읽은 두 칸 (r0, r1)",
          "몫 q",
          "새 칸 r",
          "새 칸 (s, t)",
          "새 칸의 A·s + B·t",
        ],
        rows,
        [0, 2, 3, 5],
      ),
      "",
      `${rows.length} 바퀴 가운데 새 칸의 A·s + B·t 가 새 나머지와 같은 바퀴가 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 세 줄이 어디까지 움직이는가. */
  stage2Size: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const g = tr.result.g;
    const rows = tr.chain.map((r, k) => [
      rName(k),
      num(r),
      num(abs(tr.s[k] as bigint)),
      num(abs(tr.t[k] as bigint)),
    ]);
    const sN = abs(tr.s[n] as bigint);
    const tN = abs(tr.t[n] as bigint);
    let grows = true;
    for (let k = 2; k < tr.chain.length; k++) {
      if (abs(tr.s[k] as bigint) < abs(tr.s[k - 1] as bigint)) grows = false;
      if (abs(tr.t[k] as bigint) < abs(tr.t[k - 1] as bigint)) grows = false;
    }
    const half = (v: bigint) => (Number(v) / Number(2n * g)).toString();
    return [
      md(["칸", "나머지 수열", "|s|", "|t|"], rows, [1, 2, 3]),
      "",
      `나머지 수열은 칸마다 줄어 0 에서 끝났고, |s| 와 |t| 는 ${rName(2)} 부터 ${grows ? "한 번도 줄지 않았습니다" : "줄어든 칸이 있습니다"}. 답으로 읽는 ${rName(n)} 의 |s| = ${sN}${은는(sN)} B / (2g) = ${tr.B} / ${2n * g} = ${half(tr.B)} 이하이고, |t| = ${tN}${은는(tN)} A / (2g) = ${tr.A} / ${2n * g} = ${half(tr.A)} 이하입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 멈추는 자리와 답을 읽는 자리. 한쪽이나 둘 다 0 인 입력을 포함한다. */
  stage3Stop: () => {
    const inputs: [bigint, bigint][] = [
      [WALK_A, WALK_B],
      [7n, 0n],
      [-7n, 0n],
      [0n, 9n],
      [0n, -9n],
      [0n, 0n],
    ];
    const rows = inputs.map(([a, b]) => {
      const tr = trace(a, b);
      const n = tr.divisions.length;
      return [
        `extendedEuclidean(${a}n, ${b}n)`,
        String(n),
        `${rName(n)} = ${tr.chain[n]}`,
        `(${tr.s[n]}, ${tr.t[n]})`,
        triple(tr.result),
      ];
    });
    return md(
      ["입력", "나눗셈", "0 앞 칸", "그 칸의 (s, t)", "반환 (g, x, y)"],
      rows,
      [1],
    );
  },

  /** `deep.build` 전제 — `bigint` 의 `/` 와 `%` 는 0 쪽으로 자른다. */
  premiseDiv: () => {
    const inputs: [bigint, bigint][] = [
      [12n, 5n],
      [-12n, 5n],
      [12n, -5n],
      [-12n, -5n],
    ];
    const rows = inputs.map(([x, y]) => {
      const q = x / y;
      const r = x % y;
      return [
        String(x),
        String(y),
        String(q),
        String(r),
        r >= 0n && r < abs(y) ? "예" : "아니요",
      ];
    });
    return md(
      ["x", "y", "x / y", "x % y", "0 ≤ x % y < |y|"],
      rows,
      [0, 1, 2, 3],
    );
  },

  /** `deep.walk` 도입 — 고정 입력. */
  walkInput: () => {
    const { g, x, y } = extendedEuclidean(WALK_A, WALK_B);
    return [
      `const a = ${WALK_A}n;`,
      `const b = ${WALK_B}n;`,
      `// 이 절이 끝나면 { g: ${g}n, x: ${x}n, y: ${y}n } 이 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 반복 앞의 여덟 값. */
  walkInit: () => {
    const tr = walk();
    return [
      `T1 이 끝난 시점 — a = ${WALK_A}, b = ${WALK_B}`,
      ...pairLines([
        ["signA · signB", `${WALK_A < 0n ? -1 : 1} · ${WALK_B < 0n ? -1 : 1}`],
        ["(r0, r1)", `(${tr.chain[0]}, ${tr.chain[1]})`],
        ["(s0, s1)", `(${tr.s[0]}, ${tr.s[1]})`],
        ["(t0, t1)", `(${tr.t[0]}, ${tr.t[1]})`],
      ]),
    ].join("\n");
  },

  /** `deep.walk` 2 — 앞 두 바퀴. */
  walkLoopHead: () => {
    const tr = walk();
    const rows = tr.divisions
      .slice(0, 2)
      .map((d) => [
        `T${d.k + 2}`,
        String(d.q),
        `${d.r0} = ${d.q} × ${d.r1} + ${d.nr}`,
        `(${d.r1}, ${d.nr})`,
        `(${d.s1}, ${d.ns})`,
        `(${d.t1}, ${d.nt})`,
        `${tr.A} × ${par(d.ns)} + ${tr.B} × ${par(d.nt)} = ${tr.A * d.ns + tr.B * d.nt}`,
      ]);
    return md(
      [
        "걸음",
        "q",
        "r0 = q·r1 + 나머지",
        "바퀴 끝 (r0, r1)",
        "바퀴 끝 (s0, s1)",
        "바퀴 끝 (t0, t1)",
        "새 칸의 A·s + B·t",
      ],
      rows,
      [1],
    );
  },

  /** 짚고 가기 — 계수를 한 줄씩 대입하면. */
  "mutant-alias": () =>
    [
      mutantTable(aliased, "한 줄씩 대입한 판 (g, x, y)"),
      "",
      "g 는 네 줄 모두 두 판에서 값이 하나입니다. 나머지 수열을 만드는 줄은 손대지 않았기 때문입니다.",
    ].join("\n"),

  /** 짚고 가기 — 한 줄씩 대입한 판에서 s 가 어떻게 되는가. 변이와 같은 두 문장을 따라 적는다. */
  aliasTrace: () => {
    const tr = walk();
    let s0 = 1n;
    let s1 = 0n;
    const lines: string[] = [];
    for (const d of tr.divisions.slice(0, 2)) {
      const before = `(${s0}, ${s1})`;
      s0 = s1;
      const old = s1;
      s1 = s0 - d.q * s1;
      lines.push(
        `  q = ${d.q}   s0 ← s1 = ${old}   s1 ← s0 - ${d.q} × s1 = ${s0} - ${d.q} × ${par(old)} = ${s1}   ${before} → (${s0}, ${s1})`,
      );
    }
    return [
      `extendedEuclidean(${WALK_A}n, ${WALK_B}n) 에서 s 를 한 줄씩 대입하면`,
      ...lines,
      "  둘째 문장의 s0 는 이미 옛 s1 이라, 두 값이 0 에 머문다",
    ].join("\n");
  },

  /**
   * 짚고 가기 — y 를 마지막에 나눗셈으로 되찾으면. 그 판은 `t` 두 줄만 지운 것이라 `g` 와 `x` 는 정본과
   * 같은 줄에서 나오고, 둘 다 0 이면 정본과 같은 `r0 === 0n` 갈래에서 먼저 돌아간다. 다른 것은 마지막
   * `y = (g - a·x) / b` 한 줄뿐이다.
   */
  halfTrack: () => {
    const rows = FOUR.map(([name, a, b]) => {
      const right = extendedEuclidean(a, b);
      let got: string;
      if (right.g === 0n) {
        got = triple({ g: 0n, x: 0n, y: 0n });
      } else {
        try {
          const y = (right.g - a * right.x) / b;
          got = triple({ g: right.g, x: right.x, y });
        } catch (e) {
          got = e instanceof RangeError ? "0 으로 나눈다는 예외" : "다른 예외";
        }
      }
      return [name, triple(right), got];
    });
    return md(["입력", "정본 (g, x, y)", "y 를 나중에 구하는 판"], rows);
  },

  /** `deep.walk` 4 — 여덟 걸음 전부. */
  walkTrace: () => {
    const tr = walk();
    const rows: string[][] = [
      [
        "T1",
        "—",
        "—",
        `(${tr.chain[0]}, ${tr.chain[1]})`,
        `(${tr.s[0]}, ${tr.s[1]})`,
        `(${tr.t[0]}, ${tr.t[1]})`,
      ],
    ];
    for (const d of tr.divisions) {
      rows.push([
        `T${d.k + 2}`,
        `${d.r1} ≠ 0 **참**`,
        `${d.r0} = ${d.q} × ${d.r1} + ${d.nr}`,
        `(${d.r1}, ${d.nr})`,
        `(${d.s1}, ${d.ns})`,
        `(${d.t1}, ${d.nt})`,
      ]);
    }
    const n = tr.divisions.length;
    rows.push([
      `T${n + 2}`,
      `${tr.chain[n + 1]} ≠ 0 **거짓**`,
      "—",
      `(${tr.chain[n]}, ${tr.chain[n + 1]})`,
      `(${tr.s[n]}, ${tr.s[n + 1]})`,
      `(${tr.t[n]}, ${tr.t[n + 1]})`,
    ]);
    const { g, x, y } = tr.result;
    return [
      md(
        [
          "걸음",
          "② r1 ≠ 0",
          "r0 = q·r1 + 나머지",
          "걸음 끝 (r0, r1)",
          "걸음 끝 (s0, s1)",
          "걸음 끝 (t0, t1)",
        ],
        rows,
      ),
      "",
      `나눗셈은 모두 ${n} 번이고, 돌려주는 값은 g = ${g}, x = ${x}, y = ${y} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 갈래마다 실행된 걸음. */
  walkBranches: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const loops = tr.divisions.map((d) => `T${d.k + 2}`).join(" · ");
    return md(
      ["라벨", "하는 일", "전개에서"],
      [
        ["①", "부호를 따로 적고 첫 두 칸을 정한다", "T1 에서 한 번"],
        [
          "②",
          "몫 하나로 세 줄을 갱신한다",
          `${loops} 에서 ${n} 번 · T${n + 2} 에서 조건이 거짓`,
        ],
        ["③", "부호를 다시 붙여 셋을 낸다", `T${n + 2} 에서 한 번`],
      ],
    );
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한다. */
  finalCalls: () => {
    const calls: [bigint, bigint][] = [
      [WALK_A, WALK_B],
      [30n, 18n],
      [17n, 5n],
      [3n, 11n],
      [0n, 9n],
      [0n, 0n],
    ];
    return columns(
      calls.map(([a, b]) => {
        const r = extendedEuclidean(a, b);
        return [
          `extendedEuclidean(${a}n, ${b}n)`,
          `→ { g: ${r.g}n, x: ${r.x}n, y: ${r.y}n }`,
          `a·x + b·y = ${a * r.x + b * r.y}`,
        ];
      }),
    ).join("\n");
  },

  /** `related` — 버린 한 쌍이 무엇인가. */
  relatedLast: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const s = tr.s[n + 1] as bigint;
    const t = tr.t[n + 1] as bigint;
    const g = tr.result.g;
    return pairLines(
      [
        [`${rName(n + 1)} 의 계수`, `s = ${s}, t = ${t}`],
        ["|s|", `${abs(s)} = ${tr.B} / ${g} = B / g`],
        ["|t|", `${abs(t)} = ${tr.A} / ${g} = A / g`],
        [
          "A·s + B·t",
          `${tr.A} × ${par(s)} + ${tr.B} × ${par(t)} = ${tr.A * s + tr.B * t}`,
        ],
      ],
      "",
    ).join("\n");
  },

  /** `related` — 한 쌍에 버린 쌍을 몇 번 더해도 식이 그대로다. */
  generalSolution: () => {
    const r = extendedEuclidean(WALK_A, WALK_B);
    const stepX = WALK_B / r.g;
    const stepY = WALK_A / r.g;
    const rows = [-1n, 0n, 1n, 2n].map((k) => {
      const x = r.x + stepX * k;
      const y = r.y - stepY * k;
      return [String(k), num(x), num(y), num(WALK_A * x + WALK_B * y)];
    });
    return [
      md(
        ["k", `x = ${r.x} + ${stepX}k`, `y = ${r.y} + ${-stepY}k`, "a·x + b·y"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `네 줄 모두 a·x + b·y 가 ${r.g} 입니다. x 는 ${abs(stepX)} 씩, y 는 ${abs(stepY)} 씩 옮겨 갑니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 두 설계의 걸음 수와 기본 연산 수. */
  "alt-counts": () => {
    const mine = cases["나머지를 0 이상으로 잡는 판"]();
    const rival = cases["최소 절댓값 나머지로 잡는 판"]();
    const names = ["전개 입력", "피보나치 이웃", "펠 수열 이웃", "큰 소수 쌍"];
    const rows = names.map((name) => {
      const mineOps = mine[`${name} 기본 연산`] as number;
      const rivalOps = rival[`${name} 기본 연산`] as number;
      return [
        name,
        num(mine[`${name} 걸음`] as number),
        num(rival[`${name} 걸음`] as number),
        num(mineOps),
        num(rivalOps),
        mineOps < rivalOps ? "나머지 판" : "중심 판",
      ];
    });
    return [
      md(
        [
          "입력",
          "나머지 판 걸음",
          "중심 판 걸음",
          "나머지 판 기본 연산",
          "중심 판 기본 연산",
          "기본 연산이 적은 쪽",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `계수의 절댓값은 네 입력 모두 두 판에서 ${coefficientsAgree() ? "하나로 나왔습니다" : "둘로 갈렸습니다"}.`,
    ].join("\n");
  },

  /** `purpose.alt` — 기본 연산을 걸음 수로 풀어 적는다. */
  altFormula: () => {
    const mine = cases["나머지를 0 이상으로 잡는 판"]();
    const rival = cases["최소 절댓값 나머지로 잡는 판"]();
    const names = ["전개 입력", "피보나치 이웃", "펠 수열 이웃", "큰 소수 쌍"];
    const rows = names.map((name) => {
      const n = mine[`${name} 걸음`] as number;
      const m = rival[`${name} 걸음`] as number;
      const mineOps = mine[`${name} 기본 연산`] as number;
      const rivalOps = rival[`${name} 기본 연산`] as number;
      if (mineOps !== 14 * n + 1) {
        throw new Error(`${name} — 나머지 판이 14N + 1 이 아니다`);
      }
      const j = (rivalOps - 17 * m - 2) / 4;
      if (!Number.isInteger(j) || j < 0 || j > m) {
        throw new Error(`${name} — 옮긴 걸음이 0 이상 M 이하의 정수가 아니다`);
      }
      return [
        name,
        String(n),
        String(m),
        (m / n).toFixed(2),
        String(j),
        num(14 * n + 1),
        num(17 * m + 4 * j + 2),
      ];
    });
    const ratio = (pick: (row: string[]) => boolean) =>
      rows
        .filter(pick)
        .map((row) => row[3])
        .join(" · ");
    const rivalWins = (row: string[]) =>
      Number((row[6] as string).replaceAll(",", "")) <
      Number((row[5] as string).replaceAll(",", ""));
    const table = md(
      [
        "입력",
        "나머지 판 걸음 N",
        "중심 판 걸음 M",
        "M / N",
        "몫을 옮긴 걸음 J",
        "14N + 1",
        "17M + 4J + 2",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    );
    return [
      table,
      "",
      `네 줄 모두 두 식이 벤치의 기본 연산과 같습니다. 중심 판이 적은 줄의 M / N 은 ${ratio(rivalWins)} 이고, 나머지 판이 적은 줄의 M / N 은 ${ratio((row) => !rivalWins(row))} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` 정의 — i = 1 에 넣는다. */
  mathQ1: () => {
    const d = walk().divisions[0];
    if (d === undefined) throw new Error("첫 바퀴가 없다");
    return [
      `q_1 = ⌊${d.r0} / ${d.r1}⌋ = ${d.q}`,
      `r_2 = r_0 - q_1 · r_1 = ${d.r0} - ${d.q} × ${d.r1} = ${d.nr}`,
    ].join("\n");
  },

  /** `deep.math` 검산 — 칸마다 두 식. */
  mathCheck: () => {
    const tr = walk();
    let idOk = true;
    let alt = true;
    const rows = tr.chain.map((r, i) => {
      const s = tr.s[i] as bigint;
      const t = tr.t[i] as bigint;
      const v = tr.A * s + tr.B * t;
      if (v !== r) idOk = false;
      let D: string = "—";
      if (i + 1 < tr.chain.length) {
        const d = s * (tr.t[i + 1] as bigint) - (tr.s[i + 1] as bigint) * t;
        if (d !== (i % 2 === 0 ? 1n : -1n)) alt = false;
        D = num(d);
      }
      return [String(i), num(r), num(s), num(t), num(v), D];
    });
    return [
      md(
        ["i", "r_i", "s_i", "t_i", "A·s_i + B·t_i", "D_i"],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `A = ${tr.A}, B = ${tr.B} 입니다. ${rows.length} 줄 모두 A·s_i + B·t_i 가 r_i 와 같은가: ${idOk ? "예" : "아니요"}. D_i 가 i 가 짝수면 1, 홀수면 -1 인가: ${alt ? "예" : "아니요"}.`,
    ].join("\n");
  },

  /** `deep.math` 귀납의 기저 둘. */
  mathBase: () => {
    const tr = walk();
    return [0, 1]
      .map((i) => {
        const v = tr.A * (tr.s[i] as bigint) + tr.B * (tr.t[i] as bigint);
        return `i = ${i}   ${tr.A} × ${tr.s[i]} + ${tr.B} × ${tr.t[i]} = ${v} = r_${i} 인가: ${v === tr.chain[i] ? "예" : "아니요"}`;
      })
      .join("\n");
  },

  /** `deep.math` 귀납의 단계를 i = 1 에서 값으로. */
  mathStep: () => {
    const tr = walk();
    const d = tr.divisions[0];
    if (d === undefined) throw new Error("첫 바퀴가 없다");
    const v = tr.A * d.ns + tr.B * d.nt;
    return [
      "A·s_2 + B·t_2 = (A·s_0 + B·t_0) - q_1 × (A·s_1 + B·t_1)",
      `              = ${tr.chain[0]} - ${d.q} × ${tr.chain[1]}`,
      `              = ${v} = r_2 인가: ${v === d.nr ? "예" : "아니요"}`,
    ].join("\n");
  },

  /** `deep.math` 마지막 칸의 계수. */
  mathLast: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const g = tr.result.g;
    const s = abs(tr.s[n + 1] as bigint);
    const t = abs(tr.t[n + 1] as bigint);
    return columns([
      [
        `|s_${n + 1}| = ${s}`,
        `B / g = ${tr.B} / ${g} = ${tr.B / g}`,
        `같은가: ${s === tr.B / g ? "예" : "아니요"}`,
      ],
      [
        `|t_${n + 1}| = ${t}`,
        `A / g = ${tr.A} / ${g} = ${tr.A / g}`,
        `같은가: ${t === tr.A / g ? "예" : "아니요"}`,
      ],
    ]).join("\n");
  },

  /** `deep.math` 상한을 마지막 바퀴에서. */
  mathLastStep: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const d = tr.divisions[n - 1];
    if (d === undefined) throw new Error("마지막 바퀴가 없다");
    const sPrev = abs(tr.s[n - 1] as bigint);
    const sN = abs(tr.s[n] as bigint);
    const sNext = abs(tr.s[n + 1] as bigint);
    const half = Number(sNext) / 2;
    return pairLines(
      [
        [`q_${n}`, `${d.q} ≥ 2 인가: ${d.q >= 2n ? "예" : "아니요"}`],
        [
          `|s_${n + 1}|`,
          `${sNext} = |s_${n - 1}| + q_${n} × |s_${n}| = ${sPrev} + ${d.q} × ${sN} 인가: ${sNext === sPrev + d.q * sN ? "예" : "아니요"}`,
        ],
        [
          `|s_${n}|`,
          `${sN} ≤ |s_${n + 1}| / 2 = ${half} 인가: ${Number(sN) <= half ? "예" : "아니요"}`,
        ],
      ],
      "",
    ).join("\n");
  },

  /** `deep.math` 계수 — 과제 규모와 그보다 큰 입력에서 계수의 크기. */
  coefBound: () => {
    let big = 1;
    while (fib(big).toString().length < 617) big += 1;
    const inputs: [bigint, bigint][] = [
      [abs(WALK_A), abs(WALK_B)],
      [fib(20), fib(19)],
      [1_000_000_007n, 998_244_353n],
      [WORST_A, WORST_B],
      [fib(big + 1), fib(big)],
    ];
    const short = (v: bigint): string =>
      v.toString().length > 12 ? `${v.toString().length} 자리` : num(v);
    let all = true;
    const rows = inputs.map(([a, b]) => {
      const r = extendedEuclidean(a, b);
      if (2n * abs(r.x) * r.g > b || 2n * abs(r.y) * r.g > a) all = false;
      return [
        a.toString().length > 12
          ? `${a.toString().length} 자리 이웃 피보나치 쌍`
          : `${num(a)} 과 ${num(b)}`,
        String(a.toString().length),
        num(r.g),
        short(abs(r.x)),
        short(b / (2n * r.g)),
        short(abs(r.y)),
        short(a / (2n * r.g)),
      ];
    });
    const eq = extendedEuclidean(13n, 13n);
    return [
      md(
        ["A 와 B", "A 자릿수", "g", "|x|", "⌊B / (2g)⌋", "|y|", "⌊A / (2g)⌋"],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `${rows.length} 줄 모두 |x| ≤ B / (2g) 이고 |y| ≤ A / (2g) 인가: ${all ? "예" : "아니요"}. A = B 인 13 과 13 은 (g, x, y) = ${triple(eq)} 이라 |y| = ${abs(eq.y)}${이가(abs(eq.y))} A / (2g) = ${Number(13n) / Number(2n * eq.g)} 보다 큽니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음이 끝날 때마다 두 식. */
  invariantPairs: () => {
    const tr = walk();
    const n = tr.divisions.length;
    const rows: string[][] = [];
    let ok = 0;
    for (let k = 0; k <= n; k++) {
      const s0 = tr.s[k] as bigint;
      const t0 = tr.t[k] as bigint;
      const s1 = tr.s[k + 1] as bigint;
      const t1 = tr.t[k + 1] as bigint;
      const first = tr.A * s0 + tr.B * t0;
      const second = tr.A * s1 + tr.B * t1;
      const both = first === tr.chain[k] && second === tr.chain[k + 1];
      if (both) ok += 1;
      rows.push([
        `T${k + 1}${이가(`T${k + 1}`)} 끝난 뒤`,
        `(${tr.chain[k]}, ${tr.chain[k + 1]})`,
        `${tr.A}·${par(s0)} + ${tr.B}·${par(t0)} = ${first}`,
        `${tr.A}·${par(s1)} + ${tr.B}·${par(t1)} = ${second}`,
        both ? "예" : "아니요",
      ]);
    }
    return [
      md(
        ["시점", "(r0, r1)", "A·s0 + B·t0", "A·s1 + B·t1", "두 식의 성립"],
        rows,
      ),
      "",
      `${rows.length} 시점 가운데 두 식이 모두 성립한 시점이 ${ok} 개입니다. r1 은 ${tr.chain.slice(1).join(" → ")} 으로 시점마다 줄었습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "edge-values": () => {
    const inputs: [string, bigint, bigint][] = [
      ["둘 다 0", 0n, 0n],
      ["뒤가 0 인 7 과 0", 7n, 0n],
      ["앞이 0 인 0 과 9", 0n, 9n],
      ["같은 값 13 과 13", 13n, 13n],
      ["앞이 더 작은 5 와 17", 5n, 17n],
      ["둘 다 음수인 -510 과 -183", -510n, -183n],
      ["뒤만 음수인 510 과 -183", 510n, -183n],
      ["한쪽이 1 인 1 과 10^18", 1n, LIMIT],
    ];
    let ok = 0;
    const rows = inputs.map(([name, a, b]) => {
      const r = extendedEuclidean(a, b);
      if (r.g === naiveGcd(a, b) && a * r.x + b * r.y === r.g) ok += 1;
      return [
        name,
        String(divisionCount(a, b)),
        num(r.g),
        num(r.x),
        num(r.y),
        num(a * r.x + b * r.y),
      ];
    });
    return [
      md(["입력", "나눗셈", "g", "x", "y", "a·x + b·y"], rows, [1, 2, 3, 4, 5]),
      "",
      `${rows.length} 입력 가운데 g 가 정의로 구한 최대공약수와 같고 a·x + b·y = g 인 입력이 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — t 갱신의 뺄셈을 덧셈으로 바꾸면. */
  "mutant-t-plus": () =>
    [
      mutantTable(tPlus, "뺄셈을 덧셈으로 바꾼 판 (g, x, y)"),
      "",
      `나눗셈 횟수는 전개 입력이 ${divisionCount(WALK_A, WALK_B)} 번, 17 과 5 가 ${divisionCount(17n, 5n)} 번입니다.`,
    ].join("\n"),

  /** `perf.derive` — 전개 입력에서 한 일. */
  perfCount: () => {
    const n = walk().divisions.length;
    const mine = cases["나머지를 0 이상으로 잡는 판"]()[
      "전개 입력 기본 연산"
    ] as number;
    const rows = [
      ["부호 판정과 절댓값", "T1", "4"],
      ["나눗셈", `T2 ~ T${n + 1}`, String(n)],
      ["곱셈", `T2 ~ T${n + 1}`, String(3 * n)],
      ["뺄셈", `T2 ~ T${n + 1}`, String(3 * n)],
      ["대입", `T2 ~ T${n + 1}`, String(6 * n)],
      ["반복 조건 판정", `T2 ~ T${n + 2}`, String(n + 1)],
    ];
    const loopTotal = n + 3 * n + 3 * n + 6 * n + (n + 1);
    if (loopTotal !== mine) {
      throw new Error("걸음 안의 일의 합이 벤치의 기본 연산과 다르다");
    }
    return [
      md(["일", "걸음", "횟수"], rows, [2]),
      "",
      `첫 줄을 뺀 다섯 줄의 합이 ${loopTotal} 이고, 경쟁 설계 대조 표에서 나머지 판의 전개 입력 기본 연산과 같습니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 과제 규모에 넣은 총식. */
  perfTotal: () => {
    const d = digits(WORST_B);
    const n = divisionCount(WORST_A, WORST_B);
    const r = extendedEuclidean(WORST_A, WORST_B);
    return [
      "두 수가 10^18 이하일 때",
      ...pairLines([
        ["작은 쪽 자릿수 d", `${d} 이하`],
        ["나눗셈 N ≤ 4.785d + 1", one(LAME * d + 1)],
        ["규모 안의 최악", `${n}   (F(${WORST_K}), F(${WORST_K - 1}))`],
        [
          "그때 계수의 자릿수",
          `|x| ${digits(r.x)} 자리 · |y| ${digits(r.y)} 자리`,
        ],
        ["저장 칸", "r0 · r1 · s0 · s1 · t0 · t1 여섯과 몫 q"],
      ]),
    ].join("\n");
  },

  /** `perf.worst` — 규모 안의 다섯 모양. */
  "shape-values": () => {
    const inputs: [string, bigint, bigint][] = [
      [`몫이 거의 다 1 — F(${WORST_K}) · F(${WORST_K - 1})`, WORST_A, WORST_B],
      [`몫이 전부 2 — P(${PELL_K}) · P(${PELL_K - 1})`, PELL_A, PELL_B],
      ["몫 하나가 아주 큼 — 10^18 · 10^18 - 1", LIMIT, LIMIT - 1n],
      ["한쪽이 다른 쪽의 배수 — 10^18 · 10^9", LIMIT, 10n ** 9n],
      ["둘 다 같은 값 — 10^18 · 10^18", LIMIT, LIMIT],
    ];
    const rows = inputs.map(([name, a, b]) => {
      const small = a < b ? a : b;
      const r = extendedEuclidean(a, b);
      return [
        name,
        String(digits(small)),
        String(divisionCount(a, b)),
        num(abs(r.x)),
        num(r.g),
      ];
    });
    return [
      md(
        ["입력 모양", "작은 쪽 자릿수", "나눗셈", "|x|", "g"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `첫 줄과 셋째 줄은 작은 쪽이 ${rows[0]?.[1]} 자리와 ${rows[2]?.[1]} 자리인데 나눗셈이 ${rows[0]?.[2]} 번과 ${rows[2]?.[2]} 번입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 버린 쌍으로 다른 해를 만든다. */
  selfcheckPair: () => {
    const r = extendedEuclidean(WALK_A, WALK_B);
    const tr = walk();
    const n = tr.divisions.length;
    // 버린 쌍은 A·s + B·t = 0 이다. 입력의 부호를 붙이면 a·(부호·s) + b·(부호·t) = 0 이 된다.
    const dx = (WALK_A < 0n ? -1n : 1n) * (tr.s[n + 1] as bigint);
    const dy = (WALK_B < 0n ? -1n : 1n) * (tr.t[n + 1] as bigint);
    if (WALK_A * dx + WALK_B * dy !== 0n) {
      throw new Error("버린 쌍이 0 을 만들지 않는다");
    }
    return columns(
      [0n, 1n, 2n].map((k) => {
        const x = r.x + k * dx;
        const y = r.y + k * dy;
        return [
          `k = ${k}`,
          `x = ${x}`,
          `y = ${y}`,
          `${WALK_A} × ${par(x)} + ${WALK_B} × ${par(y)} = ${WALK_A * x + WALK_B * y}`,
        ];
      }),
    ).join("\n");
  },
};
