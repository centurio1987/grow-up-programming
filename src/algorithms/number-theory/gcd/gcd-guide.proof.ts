/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/gcd/gcd-guide.md
 *
 * **세는 사본이 셋 있다**(`bruteForce`·`bySubtraction`·`byRemainder`). 손익분기 표의 왼쪽
 * 네 칸은 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만
 * 고쳐질 때 표가 조용히 거짓이 된다. 정본은 나눗셈을 몇 번
 * 했는지를 내보내지 않으므로 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이
 * 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「gcd」 칸 중 옳은 쪽은 전부 정본이나
 * 정본에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { cases } from "./gcd-guide.alt.ts";
import { gcd } from "./gcd-guide.ref.ts";

const REF = new URL("./gcd-guide.ref.ts", import.meta.url).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. 첫 인자가 **음수이면서 절댓값이 더 작아** 부호를 떼는 갈래와
 * 첫 걸음이 두 값을 뒤바꾸는 자리가 함께 실행된다.
 */
const WALK_A = -273n;
const WALK_B = 441n;

/** 표에 나란히 놓는 네 입력. */
const FOUR: [string, bigint, bigint][] = [
  ["전개가 쓰는 -273 과 441", WALK_A, WALK_B],
  ["둘 다 음수인 -12 와 -18", -12n, -18n],
  ["한쪽이 0 인 7 과 0", 7n, 0n],
  ["둘 다 0", 0n, 0n],
];

/** 피보나치 수 — 나눗셈이 가장 많이 필요한 입력이다. */
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

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

/** 가장 단순한 방법 — 1 부터 작은 수까지 전부 나눠 보고 둘 다 나누는 가장 큰 것을 남긴다. */
function bruteForce(
  a: bigint,
  b: bigint,
): { answer: bigint; divisions: number } {
  const x = a < 0n ? -a : a;
  const y = b < 0n ? -b : b;
  if (x === 0n || y === 0n) return { answer: x === 0n ? y : x, divisions: 0 };
  const limit = x < y ? x : y;
  let best = 1n;
  let divisions = 0;
  for (let d = 1n; d <= limit; d++) {
    divisions += 2;
    if (x % d === 0n && y % d === 0n) best = d;
  }
  return { answer: best, divisions };
}

/** 나머지 대신 뺄셈만 쓰는 판. 나눗셈이 없는 대신 뺄셈이 몫만큼 반복된다. */
function bySubtraction(
  a: bigint,
  b: bigint,
): { answer: bigint; steps: number } {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  let steps = 0;
  while (x !== 0n && y !== 0n) {
    steps += 1;
    if (x > y) x -= y;
    else y -= x;
  }
  return { answer: x === 0n ? y : x, steps };
}

/** 이 가이드가 가르치는 절차. 나눗셈 횟수와 걸음마다의 값도 함께 낸다. */
function byRemainder(
  a: bigint,
  b: bigint,
): {
  answer: bigint;
  divisions: number;
  steps: { x: bigint; y: bigint; q: bigint; r: bigint }[];
} {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  let divisions = 0;
  const steps: { x: bigint; y: bigint; q: bigint; r: bigint }[] = [];
  while (y !== 0n) {
    const q = x / y;
    const r = x % y;
    divisions += 1;
    steps.push({ x, y, q, r });
    x = y;
    y = r;
  }
  return { answer: x, divisions, steps };
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { gcd: (a: bigint, b: bigint) => bigint };

/** 둘째 인자의 절댓값 처리를 지운 판. */
const noAbs = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/let y = b < 0n \? -b : b;/, "let y = b;"],
  });

/** 다음 걸음의 첫 값을 나머지로 바꾼 판. 두 값이 같아져 첫 나머지가 그대로 답이 된다. */
const keepRemainder = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { swap: [/^ {4}x = y;$/, "    x = r;"] });

/* ────────────────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────────────────── */

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
  inputs: [string, bigint, bigint][],
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, a, b] of inputs) {
    rows.push([name, comma(gcd(a, b)), comma(mod.gcd(a, b))]);
  }
  return table(rows, [1, 2]).join("\n");
};

const NO_ABS = await mutantTable("절댓값을 안 씌운다", noAbs, FOUR);
const KEEP_REMAINDER = await mutantTable(
  "나머지를 남긴다",
  keepRemainder,
  FOUR,
);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 1 부터 전부 나눠 보면 얼마가 되는가. */
  "brute-walk": () => {
    const b = bruteForce(WALK_A, WALK_B);
    const r = byRemainder(WALK_A, WALK_B);
    if (b.answer !== r.answer || r.answer !== gcd(WALK_A, WALK_B)) {
      throw new Error("두 방법의 답이 갈린다");
    }
    return table(
      [
        ["", "나눗셈 횟수", "gcd"],
        ["1 부터 273 까지 전부 나눠 본다", comma(b.divisions), comma(b.answer)],
        ["나머지로 줄인다", comma(r.divisions), comma(r.answer)],
      ],
      [1, 2],
    ).join("\n");
  },

  /** 전부 나눠 보는 방법이 자릿수마다 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      [
        "작은 쪽의 자릿수",
        "작은 쪽의 값",
        "전부 나눠 보기",
        "초당 1억 번 기준",
      ],
    ];
    for (const digits of [3, 6, 9, 12, 18]) {
      const value = 10n ** BigInt(digits) - 1n;
      const divisions = Number(value) * 2;
      rows.push([
        comma(digits),
        comma(value),
        divisions > 1e15 ? divisions.toExponential(3) : comma(divisions),
        duration(divisions / 1e8),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 계약이 bigint 라 자릿수에 상한이 없다. 자릿수가 늘면 이 값이 그대로 열 배씩 는다`;
  },

  /** 뺄셈만 쓰는 판과 나머지를 쓰는 판의 걸음 수. */
  "subtract-vs-remainder": () => {
    const rows: string[][] = [
      ["입력", "뺄셈만 쓰면 걸음", "나머지를 쓰면 나눗셈", "gcd"],
    ];
    for (const [name, a, b] of [
      ["전개 입력 -273 과 441", WALK_A, WALK_B],
      ["1 과 1,000,000", 1n, 1_000_000n],
      ["피보나치 이웃 F(31)·F(30)", fib(31), fib(30)],
      ["1,000,000 과 999,999", 1_000_000n, 999_999n],
    ] as [string, bigint, bigint][]) {
      const s = bySubtraction(a, b);
      const r = byRemainder(a, b);
      if (s.answer !== r.answer || r.answer !== gcd(a, b)) {
        throw new Error(`${name} 에서 답이 갈린다`);
      }
      rows.push([name, comma(s.steps), comma(r.divisions), comma(r.answer)]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 전개 입력의 걸음마다 값. */
  "walk-trace": () => {
    const r = byRemainder(WALK_A, WALK_B);
    const rows: string[][] = [
      ["걸음", "x", "y", "몫", "나머지", "다음 (x, y)"],
    ];
    for (const [i, s] of r.steps.entries()) {
      rows.push([
        `T${i + 2}`,
        comma(s.x),
        comma(s.y),
        comma(s.q),
        comma(s.r),
        `(${comma(s.y)}, ${comma(s.r)})`,
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 나눗셈 ${comma(r.divisions)} 번으로 끝나고 답이 ${comma(r.answer)} 다`;
  },

  /** 절댓값을 안 씌우면 무엇이 나오는가. */
  "mutant-no-abs": () => NO_ABS,

  /** 나머지를 남기면 무엇이 나오는가. */
  "mutant-keep-remainder": () => KEEP_REMAINDER,

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "반환값"]];
    for (const [name, a, b] of FOUR) rows.push([name, comma(gcd(a, b))]);
    return table(rows, [1]).join("\n");
  },

  /** 몫을 차례로 모으면 연분수가 된다. */
  "continued-fraction": () => {
    const rows: string[][] = [
      ["입력 a / b", "몫을 차례로", "연분수 표기", "a / b 의 값"],
    ];
    // 연분수는 부호를 안 다루므로 전개 입력의 절댓값을 쓴다.
    for (const [a, b] of [
      [273n, 441n],
      [441n, 273n],
      [355n, 113n],
    ] as [bigint, bigint][]) {
      const qs = byRemainder(a, b).steps.map((s) => s.q);
      const head = qs[0] ?? 0n;
      const tail = qs.slice(1);
      rows.push([
        `${comma(a)} / ${comma(b)}`,
        qs.map((q) => comma(q)).join(" "),
        `[${comma(head)}; ${tail.map((q) => comma(q)).join(", ")}]`,
        (Number(a) / Number(b)).toFixed(6),
      ]);
    }
    return table(rows).join("\n");
  },

  /** 피보나치 이웃 쌍에서 나눗셈 횟수가 몇 번인가 — 라메 상한과 함께. */
  "fib-bound": () => {
    const rows: string[][] = [
      [
        "k",
        "F(k)",
        "F(k-1)",
        "나눗셈 횟수",
        "작은 쪽 자릿수 d",
        "4.785d + 1",
        "5d",
      ],
    ];
    for (const k of [8, 12, 20, 40, 91]) {
      const a = fib(k);
      const b = fib(k - 1);
      const digits = b.toString().length;
      rows.push([
        comma(k),
        comma(a),
        comma(b),
        comma(byRemainder(a, b).divisions),
        comma(digits),
        (4.785 * digits + 1).toFixed(1),
        comma(5 * digits),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5, 6]).join("\n")}
        └ 나눗셈 횟수가 언제나 k-2 이고, 그 값이 두 상한을 한 번도 넘지 않는다`;
  },

  /** 피보나치 수의 아래쪽 경계와 그것이 주는 나눗셈 횟수 상한. */
  "phi-bound": () => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const rows: string[][] = [["k", "F(k)", "φ^(k-2)", "F(k) >= φ^(k-2) 인가"]];
    for (const k of [2, 5, 10, 20, 40, 91]) {
      const f = fib(k);
      const bound = phi ** (k - 2);
      rows.push([
        comma(k),
        comma(f),
        bound > 1e15 ? bound.toExponential(3) : comma(Math.round(bound)),
        Number(f) >= bound ? "그렇다" : "아니다",
      ]);
    }
    return `${table(rows, [0, 1, 2]).join("\n")}
        └ 여섯 줄 다 「그렇다」다. φ 는 (1 + √5) / 2 = 1.618… 이다`;
  },

  /** 나눗셈 한 번을 기본 연산 몇 번으로 쳐야 두 설계가 같아지는가. */
  breakeven: () => {
    const rows: string[][] = [
      [
        "입력",
        "호제법 기본 연산",
        "그중 나눗셈",
        "이진 기본 연산",
        "손익분기 ×100",
      ],
    ];
    const euclid = cases["나머지로 줄이는 유클리드 호제법"]();
    const binary = cases["시프트와 뺄셈만 쓰는 이진 GCD"]();
    for (const name of [
      "전개 입력",
      "피보나치 이웃",
      "2 의 거듭제곱",
      "공통 인수가 2 의 거듭제곱",
    ]) {
      const euclidOps = euclid[`${name} 기본 연산`] as number;
      const divisions = euclid[`${name} 나눗셈`] as number;
      const binaryOps = binary[`${name} 기본 연산`] as number;
      const breakEven = Math.round(
        ((binaryOps - (euclidOps - divisions)) / divisions) * 100,
      );
      rows.push([
        name,
        comma(euclidOps),
        comma(divisions),
        comma(binaryOps),
        comma(breakEven),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 왼쪽 넷은 .bench.json 의 실측값이고 오른쪽 한 칸만 그 넷으로 계산한 값이다.
          나눗셈 한 번의 비용이 기본 연산 그 배수보다 크면 이진 쪽이 적다`;
  },

  /** 최악을 만드는 입력 — 모양을 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const rows: string[][] = [
      ["입력 모양", "작은 쪽 자릿수", "나눗셈 횟수", "gcd"],
    ];
    for (const [name, a, b] of [
      ["피보나치 이웃 F(91)·F(90)", fib(91), fib(90)],
      ["한쪽이 다른 쪽의 배수", 10n ** 18n, 10n ** 9n],
      ["둘 다 같은 값", 10n ** 18n, 10n ** 18n],
      ["서로소인 큰 두 수", 999_999_999_999_999_989n, 999_999_999_999_999_961n],
      ["한쪽이 1", 10n ** 18n, 1n],
    ] as [string, bigint, bigint][]) {
      const small = a < b ? a : b;
      rows.push([
        name,
        comma(small.toString().length),
        comma(byRemainder(a, b).divisions),
        comma(gcd(a, b)),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },
};

/** `14,658년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}
