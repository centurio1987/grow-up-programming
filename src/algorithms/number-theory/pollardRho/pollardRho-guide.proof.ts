/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/pollardRho/pollardRho-guide.md
 *
 * 걸음 기록과 연산 수는 그림 사이드카(`-guide.fig.tsx`)의 `run` 을 쓴다 — 그림 · 표 · 패널이 같은 기록을
 * 쓰고, 그 기록의 답은 거기서 정본과 대조한다. 걸음이 수만 번인 큰 입력은 셈만 하는 가벼운 판 `count` 를
 * 쓰고, 두 판이 같은 셈을 내는지는 아래 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * 소수 판정이 쓴 몫은 소수 판정 편의 기록 사본이 센 값이고(그림 사이드카가 부른다), 시행 나눗셈 쪽 값은
 * 그 편의 닫힌 형태와 세는 판에서 받는다. 경쟁 설계 대조 표는 이 편의 `.alt.ts` 를 부른다 — 같은 값을 두
 * 파일에 적으면 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 *
 * **한도를 둔 사본이 하나 있다.** 소수 판정을 뺀 판은 소수 입력에서 `c` 를 끝없이 올리며
 * 멈추지 않는다 — `loadMutant` 이 만든 변이 모듈을 그대로 부르면 검사가 끝나지 않으므로,
 * `c` 라운드 수에 한도를 둔 사본으로 그 자리를 보인다. 합성수에서 그 사본이 정본과 같은
 * 답을 내는지도 `자기대조()` 가 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  BOUND,
  bestBound,
  cases,
  countRho,
  countTwoStage,
  SAFE_N,
  SAFE_P,
  SMOOTH_N,
  SMOOTH_P,
} from "./pollardRho-guide.alt.ts";
import {
  balanced,
  C0,
  count,
  type Exit,
  factorize,
  factorize2,
  factorText,
  gcd,
  isPrime,
  isqrt,
  LIMIT,
  meetStep,
  nextPrime,
  num,
  P,
  pairsRun,
  Q,
  run,
  seconds,
  sequence,
  shape,
  squareBelow,
  sub,
  trialDivision,
  trialOps,
  WALK,
  walkSteps,
  X0,
} from "./pollardRho-guide.fig.tsx";
import { pollardRho } from "./pollardRho-guide.ref.ts";

/* ───────────────────────── 고정 입력 ───────────────────────── */

/** 첫 상수로 답을 못 내는 가장 작은 홀 합성수 둘. */
const RETRY_SMALL = 21n;
const RETRY_SECOND = 25n;

/** 반환값이 합성수가 되는 입력. `63 = 3 × 3 × 7` 이다. */
const COMPOSITE_D = 63n;

/** 두 소인수가 비슷한 크기인 작은 입력. `10,403 = 101 × 103` 이다. */
const TWIN = 10_403n;

/* ───────────────────────── 표 그리기 ───────────────────────── */

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. 칸 안의 `|` 는 이스케이프한다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const esc = (s: string) => s.replaceAll("|", "\\|");
  const line = (cells: string[]) => `| ${cells.map(esc).join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

const block = (...parts: string[]): string => parts.join("\n\n");

/** 등폭 펜스 안의 칸 맞춤 — 한글은 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

function columns(rows: string[][]): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map((r) =>
    r
      .map((cell, c) => pad(cell, widths[c] ?? 0))
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/** 답한 갈래의 이름. */
const EXIT_TEXT: Record<Exit, string> = {
  짝수: "① 짝수",
  소수: "② 소수",
  로: "로 루프",
};

/** 답한 갈래의 이름 — 원문자 없이. 불변식 절은 원문자 라벨을 쓰지 않는다(`P14`). */
const EXIT_PLAIN: Record<Exit, string> = {
  짝수: "짝수 검사",
  소수: "소수 판정",
  로: "로 루프",
};

const same = (a: bigint, b: bigint): string => (a === b ? "같다" : "어긋난다");

/** 몇 배인가 — 소수 첫째 자리까지. */
const times = (a: number, b: number): string =>
  (a / b).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/* ────────── 변이 (모듈 최상위에서 한 번 만든다) ────────── */

const REF = new URL("./pollardRho-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  pollardRho(n: bigint): bigint;
}

/** 소수 판정 한 줄을 통째로 뺀 사본. */
const noPrimeGuard = await loadMutant<Impl>(REF, {
  drop: /^ {2}if \(isPrime\(n\)\) return n;$/,
});

/** **불변식을 지키던 줄** 하나 — `d` 가 `n` 인지 보는 검사를 뺀 사본. */
const returnAny = await loadMutant<Impl>(REF, {
  swap: [/^ {4}if \(d !== n\) return d;$/, "    return d;"],
});

/** 차의 절댓값을 안 취하고 그대로 뺀 사본. */
const noAbs = await loadMutant<Impl>(REF, {
  swap: [
    /^ {6}d = gcd\(x > y \? x - y : y - x, n\);$/,
    "      d = gcd(x - y, n);",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = returnAny.pollardRho === pollardRho;

if (!중화됨) {
  const 갈리는가 = [RETRY_SMALL, RETRY_SECOND].some(
    (n) => returnAny.pollardRho(n) !== pollardRho(n),
  );
  if (!갈리는가) {
    throw new Error("반환 검사를 뺀 변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  const 절댓값이갈리는가 = [WALK, COMPOSITE_D].some(
    (n) => noAbs.pollardRho(n) !== pollardRho(n),
  );
  if (!절댓값이갈리는가) {
    throw new Error("절댓값을 뺀 변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
}

/* ───────────────────────── 한도를 둔 사본 · 속도 비 ───────────────────────── */

/**
 * 소수 판정을 뺀 판. `c` 라운드 수에 한도를 둔다. 소수 입력에서는 어떤 `c` 로도 비자명한 약수가
 * 나오지 않아 절차가 끝나지 않는다. 한도가 없으면 이 파일이 멈추지 않으므로 라운드를 세어 끊는다.
 */
function cappedNoPrimeGuard(
  n: bigint,
  cap: number,
): { d: bigint | null; rounds: number; iters: number } {
  if (n % 2n === 0n) return { d: 2n, rounds: 0, iters: 0 };
  let iters = 0;
  let c = C0;
  for (let r = 0; r < cap; r++, c += 1n) {
    const f = (t: bigint): bigint => (t * t + c) % n;
    let x = X0;
    let y = X0;
    let d = 1n;
    while (d === 1n) {
      iters++;
      x = f(x);
      y = f(f(y));
      d = gcd(x - y, n);
    }
    if (d !== n) return { d, rounds: r + 1, iters };
  }
  return { d: null, rounds: cap, iters };
}

/**
 * 두 자리의 속도를 1 대 `fast` 로 놓고 첫 라운드(`c = 1`)를 실행한다. 비가 같으면 두 자리가 언제나 같은
 * 값이라 차가 0 이고, 그때 `gcd(0, n)` 이 `n` 이라 이 라운드는 답을 못 낸다.
 */
function speedRatio(
  n: bigint,
  fast: number,
  cap: number,
): { found: boolean; calls: number; steps: number; gcdOps: number } {
  const f = (t: bigint): bigint => (t * t + C0) % n;
  let x = X0;
  let y = X0;
  let d = 1n;
  let calls = 0;
  let steps = 0;
  let gcdOps = 0;
  while (d === 1n && steps < cap) {
    steps++;
    x = f(x);
    calls++;
    for (let i = 0; i < fast; i++) {
      y = f(y);
      calls++;
    }
    let a = x > y ? x - y : y - x;
    let b = n;
    while (b !== 0n) {
      gcdOps++;
      const t = a % b;
      a = b;
      b = t;
    }
    d = a;
  }
  return { found: d !== 1n && d !== n, calls, steps, gcdOps };
}

interface RoundStep {
  readonly k: number;
  readonly x: bigint;
  readonly y: bigint;
  readonly diff: bigint;
  readonly d: bigint;
}

/** 상수 `c` 한 벌만 실행한 걸음들 — 4단계와 스스로 점검하기가 쓴다. */
function oneRound(n: bigint, c: bigint): RoundStep[] {
  const f = (t: bigint): bigint => (t * t + c) % n;
  let x = X0;
  let y = X0;
  let d = 1n;
  let k = 0;
  const out: RoundStep[] = [];
  while (d === 1n) {
    k++;
    x = f(x);
    y = f(f(y));
    const diff = x > y ? x - y : y - x;
    d = gcd(diff, n);
    out.push({ k, x, y, diff, d });
  }
  return out;
}

/** 두 수의 최소공배수. */
const lcm = (a: number, b: number): number => {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  return (a / g(a, b)) * b;
};

/** 법 `m` 위에서 `f(t) = t + 1` 인 수열의 모양 — 헷갈리기 쉬운 모양의 비교 상대. */
function stepShape(m: bigint): { mu: number; lambda: number } {
  const seen = new Map<bigint, number>();
  let x = X0 % m;
  for (let i = 0; ; i++) {
    const prev = seen.get(x);
    if (prev !== undefined) return { mu: prev, lambda: i - prev };
    seen.set(x, i);
    x = (x + 1n) % m;
  }
}

/** 식이 내는 첫 만남 걸음 — `max(μ, 1)` 이상인 `λ` 의 배수 가운데 가장 작은 것. */
const meetByFormula = (mu: number, lambda: number): number =>
  Math.ceil(Math.max(mu, 1) / lambda) * lambda;

/* ───────────────────────── 자기 대조 ───────────────────────── */

/** 사본이 정본과 같은 답을 내는지, 두 판이 같은 셈을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs = [
    WALK,
    RETRY_SMALL,
    RETRY_SECOND,
    COMPOSITE_D,
    9n,
    15n,
    49n,
    1_000_003n,
    2n * 1_000_003n,
    TWIN,
  ];
  for (const n of inputs) {
    const a = run(n);
    const b = count(n);
    if (a.answer !== b.answer || a.ops !== b.ops || a.iters !== b.iters) {
      throw new Error(`기록 사본과 가벼운 판이 ${n} 에서 다르다`);
    }
    if (countRho(n).ops !== a.ops) {
      throw new Error(`대조 하네스와 기록 사본의 연산 수가 ${n} 에서 다르다`);
    }
  }
  for (const n of [WALK, RETRY_SMALL, COMPOSITE_D, TWIN]) {
    if (cappedNoPrimeGuard(n, 64).d !== pollardRho(n)) {
      throw new Error(`한도 사본이 ${n} 에서 정본과 다르다`);
    }
  }
}
자기대조();

/* ───────────────────────── 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ───────── 전체 컨셉 ───────── */

  "concept-answer": () => {
    const inputs = [
      WALK,
      RETRY_SMALL,
      COMPOSITE_D,
      2n * 1_000_003n,
      1_000_003n,
    ];
    const rows = inputs.map((n) => {
      const r = count(n);
      return [
        num(n),
        factorText(n),
        num(r.answer),
        num(n / r.answer),
        EXIT_TEXT[r.exit],
      ];
    });
    const zero = inputs.filter((n) => n % pollardRho(n) === 0n).length;
    const compositeD = inputs.filter((n) => {
      const d = pollardRho(n);
      return d !== n && !isPrime(d);
    });
    return block(
      md(
        ["입력 n", "소인수", "돌려준 값 d", "n ÷ d", "답한 갈래"],
        rows,
        [0, 2, 3],
      ),
      `${inputs.length} 줄 가운데 n 을 d 로 나눈 나머지가 0 인 줄은 ${zero} 개입니다. d 가 소수가 아닌 줄은 ${compositeD.map(num).join(" · ")} 의 줄입니다.`,
    );
  },

  "concept-gcd": () => {
    const xs = sequence(WALK, 8);
    let hit: [number, number] | null = null;
    for (let j = 1; j < xs.length && hit === null; j++) {
      for (let i = 0; i < j; i++) {
        if ((xs[i] as bigint) % P === (xs[j] as bigint) % P) {
          hit = [i, j];
          break;
        }
      }
    }
    if (hit === null) throw new Error("법 97 의 겹침을 못 찾았다");
    const [i, j] = hit;
    const a = xs[i] as bigint;
    const b = xs[j] as bigint;
    const diff = b > a ? b - a : a - b;
    return columns([
      [
        `법 ${num(P)} 에서 같은 두 칸`,
        `x${sub(i)} = ${num(a)} · x${sub(j)} = ${num(b)}`,
        `둘 다 ${num(P)}${으로(num(P))} 나눈 나머지가 ${num(a % P)}`,
      ],
      [
        "두 칸의 차",
        `${num(b)} − ${num(a)} = ${num(diff)} = ${num(P)} × ${num(diff / P)}`,
        `${num(WALK)} 의 배수는 아니다`,
      ],
      [
        `${num(WALK)}${과와(num(WALK))}의 최대공약수`,
        `gcd(${num(diff)}, ${num(WALK)}) = ${num(gcd(diff, WALK))}`,
        "",
      ],
    ]).join("\n");
  },

  "concept-scale": () => {
    const inputs: [string, bigint][] = [
      ["전개 입력", WALK],
      ["두 소인수가 10^6 근방", balanced(6).n],
      ["2^64 아래에서 가장 작은 소인수가 가장 큰 모양", squareBelow(64).n],
    ];
    const rows = inputs.map(([label, n]) => [
      label,
      num(n),
      num(trialOps(n)),
      num(count(n).ops),
    ]);
    return block(
      md(["입력", "n", "시행 나눗셈", "폴라드 로"], rows, [1, 2, 3]),
      "두 열 모두 나머지 연산의 횟수입니다. 시행 나눗셈은 가장 작은 소인수까지 후보를 나눈 횟수이고, 폴라드 로는 소수 판정을 포함한 전부입니다.",
    );
  },

  /* ───────── 아이디어를 떠올리는 과정 ───────── */

  "origin-trial": () => {
    const inputs: [string, bigint][] = [
      ["10^6", balanced(3).n],
      ["10^12", balanced(6).n],
      ["10^18", balanced(9).n],
      ["2^64", squareBelow(64).n],
    ];
    let ran = 0;
    const rows = inputs.map(([label, n]) => {
      const ops = trialOps(n);
      if (n < 1n << 53n) ran += 1;
      return [label, num(n), num(factorize2(n)), num(ops), seconds(ops)];
    });
    return block(
      md(
        ["규모", "n", "가장 작은 소인수", "나눗셈", "시간(1 초에 1 억 번)"],
        rows,
        [1, 2, 3, 4],
      ),
      `나눗셈 횟수는 시행 나눗셈 편의 닫힌 형태 2 + C(p) 로 셌고, 그 편의 세는 판을 실제로 실행한 위 ${ran} 줄에서 두 값이 어긋난 줄은 0 개입니다.`,
    );
  },

  "origin-pairs-walk": () => {
    const xs = sequence(WALK, 8);
    const rows: string[][] = [];
    let done = false;
    for (let j = 1; j < xs.length && !done; j++) {
      for (let i = 0; i < j; i++) {
        const a = xs[i] as bigint;
        const b = xs[j] as bigint;
        const diff = b > a ? b - a : a - b;
        const g = gcd(diff, WALK);
        rows.push([
          `x${sub(j)} = ${num(b)}`,
          `x${sub(i)} = ${num(a)}`,
          num(diff),
          num(g),
        ]);
        if (g !== 1n && g !== WALK) {
          done = true;
          break;
        }
      }
    }
    const pr = pairsRun(WALK);
    if (pr.pairs !== rows.length) throw new Error("쌍의 수가 판과 다르다");
    return block(
      md(
        ["새 값", "앞 값", "차", `${num(WALK)}${과와(num(WALK))}의 최대공약수`],
        rows,
        [2, 3],
      ),
      `값 ${pr.values} 개를 모으는 동안 쌍 ${pr.pairs} 개를 봤고, 마지막 쌍에서 ${num(pr.d)}${이가(num(pr.d))} 나왔습니다.`,
    );
  },

  "origin-pairs": () => {
    const inputs = [WALK, TWIN, balanced(3).n, balanced(4).n, balanced(5).n];
    const rows = inputs.map((n) => {
      const pr = pairsRun(n);
      return [
        num(n),
        num(pr.values),
        num(pr.pairs),
        num(pr.ops),
        num(trialOps(n)),
      ];
    });
    const last = inputs.at(-1) as bigint;
    const pr = pairsRun(last);
    const tr = trialOps(last);
    return block(
      md(
        ["n", "모은 값", "본 쌍", "쌍마다 본 판의 나머지 연산", "시행 나눗셈"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `마지막 줄에서 쌍마다 본 판은 시행 나눗셈의 ${times(pr.ops, tr)} 배를 씁니다. 나머지 연산은 수열 한 칸에 한 번, 최대공약수의 나머지마다 한 번으로 셌습니다.`,
    );
  },

  "origin-persist": () => {
    const s = shape(P);
    const xs = sequence(WALK, s.mu + 3 * s.lambda + 1);
    const rows: string[][] = [];
    for (let i = s.mu; i < s.mu + s.lambda; i++) {
      const j = i + s.lambda;
      const a = xs[i] as bigint;
      const b = xs[j] as bigint;
      const diff = b > a ? b - a : a - b;
      rows.push([
        `x${sub(i)} · x${sub(j)}`,
        `${num(a)} · ${num(b)}`,
        `${num(a % P)} · ${num(b % P)}`,
        num(diff),
        num(gcd(diff, WALK)),
      ]);
    }
    return block(
      md(
        [
          "두 칸",
          "두 값",
          `${num(P)}${으로(num(P))} 나눈 나머지`,
          "차",
          `${num(WALK)}${과와(num(WALK))}의 최대공약수`,
        ],
        rows,
        [3, 4],
      ),
      `${rows.length} 쌍 모두 두 칸의 간격이 ${s.lambda} 칸이고, 최대공약수가 ${num(P)} 입니다.`,
    );
  },

  "origin-two-ways": () => {
    const inputs = [WALK, TWIN, balanced(3).n, balanced(4).n, balanced(5).n];
    const rows = inputs.map((n) => {
      const pr = pairsRun(n);
      const c = count(n);
      return [
        num(n),
        num(pr.pairs),
        num(pr.ops),
        num(c.iters),
        num(c.ops - 1 - c.primeOps),
      ];
    });
    const last = inputs.at(-1) as bigint;
    const c = count(last);
    const pr = pairsRun(last);
    const floyd = c.ops - 1 - c.primeOps;
    return block(
      md(
        [
          "n",
          "쌍마다 — 본 쌍",
          "쌍마다 — 나머지 연산",
          "두 걸음 차이 — 걸음",
          "두 걸음 차이 — 나머지 연산",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `두 판 모두 짝수 검사와 소수 판정을 빼고 셌습니다. 마지막 줄에서 두 걸음 차이만 보는 판의 나머지 연산은 쌍마다 보는 판의 ${times(pr.ops, floyd)} 분의 1 입니다.`,
    );
  },

  /* ───────── 먼저 알아 둘 개념 — ρ 모양 ───────── */

  "rho-read": () => {
    const s = shape(P);
    const xs = sequence(WALK, 7);
    const x3 = xs[3] as bigint;
    const x6 = xs[6] as bigint;
    const node = x3 % P;
    const next = (node * node + C0) % P;
    return columns([
      [`값이 ${num(node)} 인 정점`, `법 ${num(P)} 의 마디에 있다`],
      [`x${sub(3)} = ${num(x3)}`, `${num(x3)} mod ${num(P)} = ${num(x3 % P)}`],
      [`x${sub(6)} = ${num(x6)}`, `${num(x6)} mod ${num(P)} = ${num(x6 % P)}`],
      [
        "다음 정점",
        `(${num(node)}² + ${num(C0)}) mod ${num(P)} = ${num(next)} — 마디의 첫 칸 x${sub(s.mu)} 의 값`,
      ],
    ]).join("\n");
  },

  "rho-combine": () => {
    const pairs: [bigint, bigint][] = [[P, Q]];
    for (const e of [2, 3, 4]) {
      const b = balanced(e);
      pairs.push([b.p, b.q]);
    }
    let lamSame = 0;
    let muSame = 0;
    const rows = pairs.map(([p, q]) => {
      const a = shape(p);
      const b = shape(q);
      const n = shape(p * q);
      const l = lcm(a.lambda, b.lambda);
      const m = Math.max(a.mu, b.mu);
      if (l === n.lambda) lamSame += 1;
      if (m === n.mu) muSame += 1;
      return [
        `${num(p * q)} = ${num(p)} × ${num(q)}`,
        `${a.mu} · ${a.lambda}`,
        `${b.mu} · ${b.lambda}`,
        num(l),
        num(n.lambda),
        String(m),
        String(n.mu),
      ];
    });
    return block(
      md(
        [
          "n = p × q",
          "법 p 의 꼬리 · 마디",
          "법 q 의 꼬리 · 마디",
          "두 마디의 최소공배수",
          "법 n 의 마디",
          "두 꼬리 중 긴 쪽",
          "법 n 의 꼬리",
        ],
        rows,
        [3, 4, 5, 6],
      ),
      `${rows.length} 줄 가운데 넷째 칸과 다섯째 칸이 같은 줄은 ${lamSame} 개, 여섯째 칸과 일곱째 칸이 같은 줄은 ${muSame} 개입니다.`,
    );
  },

  "rho-vs-ring": () => {
    const mods = [P, Q, 1_009n, 10_007n, 100_003n];
    const rows = mods.map((m) => {
      const a = shape(m);
      const b = stepShape(m);
      return [num(m), String(a.mu), num(a.lambda), String(b.mu), num(b.lambda)];
    });
    const lastM = mods.at(-1) as bigint;
    const last = shape(lastM);
    const ring = mods.filter((m) => {
      const b = stepShape(m);
      return b.mu === 0 && BigInt(b.lambda) === m;
    }).length;
    return block(
      md(
        [
          "법 m",
          "t² + 1 의 꼬리",
          "t² + 1 의 마디",
          "t + 1 의 꼬리",
          "t + 1 의 마디",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `t + 1 은 ${rows.length} 줄 가운데 ${ring} 줄에서 꼬리가 0 이고 마디가 m 과 같습니다. 법 ${num(lastM)} 에서 t² + 1 의 마디는 ${num(last.lambda)} 칸입니다.`,
    );
  },

  /* ───────── 아이디어 상세의 단계 ───────── */

  "build-pre": () => {
    const inputs = [4n, 2n * 1_000_003n, 97n, 1_000_003n, RETRY_SMALL, WALK];
    const where: Record<string, string> = {
      짝수: "① 짝수",
      소수: "② 소수",
      로: "로 루프로 내려간다",
    };
    const rows = inputs.map((n) => {
      const r = count(n);
      return [
        num(n),
        where[r.exit] ?? r.exit,
        num(1 + r.primeOps),
        num(pollardRho(n)),
      ];
    });
    const down = inputs.filter((n) => count(n).exit === "로").map(num);
    return block(
      md(
        ["입력 n", "답하는 자리", "여기까지 나머지 연산", "정본"],
        rows,
        [0, 2, 3],
      ),
      `${rows.length} 입력 가운데 로 루프까지 내려간 것은 ${down.join(" · ")} 입니다. 소수 판정의 몫은 소수 판정 편의 기록 사본이 센 값입니다.`,
    );
  },

  "build-two-roads": () => {
    const xs = sequence(WALK, 7);
    const direct = sequence(P, 7);
    let agree = 0;
    const rows = xs.map((v, i) => {
      const d = direct[i] as bigint;
      if (v % P === d) agree += 1;
      return [`x${sub(i)}`, num(v), num(v % P), num(d)];
    });
    return block(
      md(
        [
          "칸",
          `법 ${num(WALK)} 에서 만든 값`,
          `그 값을 ${num(P)}${으로(num(P))} 나눈 나머지`,
          `법 ${num(P)} 에서 바로 만든 값`,
        ],
        rows,
        [1, 2, 3],
      ),
      `${rows.length} 칸 가운데 셋째 칸과 넷째 칸이 같은 칸은 ${agree} 개입니다.`,
    );
  },

  "build-meet": () => {
    const mods = [P, Q, WALK, 101n, 1_009n, 10_007n];
    let agree = 0;
    const rows = mods.map((m) => {
      const s = shape(m);
      const f = meetByFormula(s.mu, s.lambda);
      const k = meetStep(m);
      if (f === k) agree += 1;
      return [num(m), String(s.mu), num(s.lambda), num(f), num(k)];
    });
    return block(
      md(
        [
          "법 m",
          "꼬리 μ",
          "마디 λ",
          "식이 내는 첫 만남 k",
          "실제로 처음 같아진 k",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `${rows.length} 줄 가운데 넷째 칸과 다섯째 칸이 같은 줄은 ${agree} 개입니다. 식은 max(μ, 1) 이상인 λ 의 배수 가운데 가장 작은 것입니다.`,
    );
  },

  "build-size": () => {
    const rows: string[][] = [];
    const ratios: number[] = [];
    let within = 0;
    for (const e of [2, 3, 4, 5, 6, 7]) {
      const p = nextPrime(10n ** BigInt(e));
      const root = isqrt(p);
      const s = shape(p);
      const k = meetStep(p);
      if (k <= s.mu + s.lambda) within += 1;
      ratios.push(k / Number(root));
      rows.push([
        num(p),
        num(root),
        num(s.mu + s.lambda),
        num(k),
        (k / Number(root)).toFixed(2),
      ]);
    }
    const lo = Math.min(...ratios).toFixed(2);
    const hi = Math.max(...ratios).toFixed(2);
    return block(
      md(
        ["소수 p", "√p 를 내림한 값", "꼬리 + 마디", "첫 만남 k", "k / √p"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `${rows.length} 줄 가운데 넷째 칸이 셋째 칸을 넘지 않는 줄은 ${within} 개이고, 마지막 칸은 ${lo}${과와(lo)} ${hi} 사이입니다.`,
    );
  },

  "build-gcd": () => {
    const steps = oneRound(WALK, C0);
    const rows = steps.map((s) => [
      String(s.k),
      num(s.x),
      num(s.y),
      `${num(s.x % P)} · ${num(s.y % P)}`,
      `${num(s.x % Q)} · ${num(s.y % Q)}`,
      num(s.d),
    ]);
    const last = steps.at(-1) as RoundStep;
    return block(
      md(
        [
          "걸음 k",
          "x",
          "y",
          `x · y 를 ${num(P)}${으로(num(P))} 나눈 나머지`,
          `x · y 를 ${num(Q)}${으로(num(Q))} 나눈 나머지`,
          "d",
        ],
        rows,
        [0, 1, 2, 5],
      ),
      `${last.k} 걸음에서 ${num(P)}${으로(num(P))} 나눈 나머지만 같아지고, 그 걸음의 d 가 ${num(last.d)} 입니다.`,
    );
  },

  "build-gcd-n": () => {
    const n = RETRY_SECOND;
    const rows: string[][] = [];
    for (const c of [1n, 2n]) {
      for (const s of oneRound(n, c)) {
        rows.push([
          String(c),
          String(s.k),
          num(s.x),
          num(s.y),
          num(s.diff),
          num(s.d),
        ]);
      }
    }
    const first = oneRound(n, 1n).at(-1) as RoundStep;
    const answer = pollardRho(n);
    return block(
      md(
        ["상수 c", "걸음 k", "x", "y", "|x − y|", "d"],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      `n = ${num(n)} 에서 c = 1 은 ${first.k} 걸음에서 d 가 ${num(first.d)}${이가(num(first.d))} 되어 약수를 못 내고, 정본은 c 를 올려 ${num(answer)}${을를(num(answer))} 돌려줍니다.`,
    );
  },

  "premise-bigint": () => {
    const w = squareBelow(64).n;
    const walk = run(WALK);
    const steps = walk.rounds[0]?.steps ?? [];
    const biggest = steps
      .flatMap((s) => [s.x, s.y])
      .reduce((a, b) => (a > b ? a : b), X0);
    const square = (w - 1n) ** 2n;
    const rows = [
      ["number 가 정수를 오차 없이 담는 한계 2^53", num(1n << 53n)],
      ["과제의 상한 2^64", num(LIMIT)],
      ["2^64 아래에서 가장 큰 제곱 입력 n", num(w)],
      ["그 n 에서 t * t 가 될 수 있는 가장 큰 값 (n − 1)²", num(square)],
      [
        `전개 입력 ${num(WALK)} 의 걸음이 만든 가장 큰 t * t`,
        num(biggest * biggest),
      ],
    ];
    return block(
      md(["값", "크기"], rows, [1]),
      `넷째 줄은 이진수로 ${square.toString(2).length} 자리이고, 정본은 모든 값을 bigint 로 계산합니다.`,
    );
  },

  "speed-ratio": () => {
    const family = [
      WALK,
      TWIN,
      balanced(3).n,
      balanced(4).n,
      balanced(5).n,
      balanced(6).n,
    ];
    const totals: { fast: number; calls: number; ops: number }[] = [];
    const rows = [1, 2, 3, 4].map((fast) => {
      const per = family.map((n) => speedRatio(n, fast, 200_000));
      const failed = per.filter((r) => !r.found).length;
      const steps = per.reduce((a, r) => a + r.steps, 0);
      const calls = per.reduce((a, r) => a + r.calls, 0);
      const g = per.reduce((a, r) => a + r.gcdOps, 0);
      if (failed === 0) totals.push({ fast, calls, ops: calls + g });
      return [
        `1 대 ${fast}`,
        String(failed),
        num(steps),
        num(calls),
        num(g),
        num(calls + g),
      ];
    });
    const byCalls = totals.reduce((a, b) => (b.calls < a.calls ? b : a));
    const byOps = totals.reduce((a, b) => (b.ops < a.ops ? b : a));
    const two = totals.find((t) => t.fast === 2);
    if (two === undefined) throw new Error("1 대 2 가 답을 못 냈다");
    const gap = (((two.ops - byOps.ops) / two.ops) * 100).toFixed(1);
    return block(
      md(
        [
          "속도 비",
          "약수를 못 낸 입력",
          "걸음 합",
          "수열 칸 합",
          "최대공약수의 나머지 연산 합",
          "나머지 연산 합",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `입력 ${family.length} 개에 상수 c = 1 하나로 잰 값입니다. 수열 칸 합이 가장 적은 비는 1 대 ${byCalls.fast}, 나머지 연산 합이 가장 적은 비는 1 대 ${byOps.fast} 이고, 두 비의 나머지 연산 합 차이는 1 대 2 의 ${gap} % 입니다.`,
    );
  },

  /* ───────── 수행으로 알아보는 알고리즘 ───────── */

  "walk-input": () =>
    [
      `const n = ${WALK}n;`,
      `// 이 절이 끝나면 ${pollardRho(WALK)}n 이 나와야 한다`,
    ].join("\n"),

  "walk-pre": () => {
    const r = run(WALK);
    const rem = num(WALK % 2n);
    return columns([
      [
        "T1",
        `n = ${num(WALK)}`,
        `① 의 n % 2n 이 ${rem}${josa(rem, "이라", "라")} 거짓이다. 나머지 연산 1 번`,
      ],
      [
        "T2",
        `n = ${num(WALK)}`,
        `② 의 소수 판정이 합성수라고 답한다. 나머지 연산 ${num(r.primeOps)} 번`,
      ],
    ]).join("\n");
  },

  "mutant-no-prime-guard": () => {
    const inputs = [WALK, RETRY_SMALL, RETRY_SECOND, COMPOSITE_D, TWIN];
    const rows = inputs.map((n) => {
      const mine = pollardRho(n);
      const theirs = noPrimeGuard.pollardRho(n);
      return [
        num(n),
        factorText(n),
        num(mine),
        num(theirs),
        same(mine, theirs),
      ];
    });
    const diff = rows.filter((r) => r[4] === "어긋난다").length;
    return block(
      md(
        ["입력", "소인수", "정본", "소수 판정을 뺀 판", "두 답"],
        rows,
        [0, 2, 3],
      ),
      `다섯 줄 다 합성수이고, 두 답이 어긋난 줄은 ${diff} 개입니다.`,
    );
  },

  "pause-prime-loops": () => {
    const cap = 30;
    const rows = [97n, 8_053n, 1_000_003n].map((n) => {
      const capped = cappedNoPrimeGuard(n, cap);
      return [
        num(n),
        isPrime(n) ? "소수" : "합성수",
        num(pollardRho(n)),
        capped.d === null ? `c = ${cap} 까지 답이 없다` : num(capped.d),
        num(capped.iters),
      ];
    });
    return block(
      md(
        ["입력", "정의대로", "정본", "소수 판정을 뺀 판", "그때까지의 걸음"],
        rows,
        [0, 2, 4],
      ),
      `소수 판정을 뺀 판은 c 를 ${cap} 까지 올리고 멈추게 한도를 둔 사본으로 잰 값입니다.`,
    );
  },

  "walk-seq": () => {
    const r = run(WALK);
    const s = r.rounds[0]?.steps[0];
    if (s === undefined) throw new Error("첫 걸음이 없다");
    const f = (t: bigint) => (t * t + C0) % WALK;
    return columns([
      [
        "T3",
        `c = ${num(C0)}`,
        `f(t) = (t² + ${num(C0)}) mod ${num(WALK)} · x = y = ${num(X0)} · d = 1`,
      ],
      ["T4", "1 걸음", `x ← f(${num(X0)}) = ${num(s.x)}`],
      ["", "", `y ← f(f(${num(X0)})) = f(${num(f(X0))}) = ${num(s.y)}`],
      [
        "",
        "",
        `|x − y| = ${num(s.diff)} · gcd(${num(s.diff)}, ${num(WALK)}) = ${num(s.d)}`,
      ],
    ]).join("\n");
  },

  "walk-gcd": () => {
    const r = run(WALK);
    const steps = r.rounds[0]?.steps ?? [];
    const f = (t: bigint) => (t * t + C0) % WALK;
    const lines: string[][] = [];
    for (const [i, s] of steps.entries()) {
      if (i === 0) continue;
      const prev = steps[i - 1];
      if (prev === undefined) continue;
      lines.push([
        `T${3 + s.k}`,
        `${s.k} 걸음`,
        `x ← f(${num(prev.x)}) = ${num(s.x)}`,
      ]);
      lines.push([
        "",
        "",
        `y ← f(f(${num(prev.y)})) = f(${num(f(prev.y))}) = ${num(s.y)}`,
      ]);
      lines.push([
        "",
        "",
        `|x − y| = ${num(s.diff)} · gcd(${num(s.diff)}, ${num(WALK)}) = ${num(s.d)}`,
      ]);
    }
    return columns(lines).join("\n");
  },

  "mutant-no-abs": () => {
    const inputs = [9n, WALK, TWIN, COMPOSITE_D, 325n, 1_000_036_000_099n];
    const rows = inputs.map((n) => {
      const mine = pollardRho(n);
      const theirs = noAbs.pollardRho(n);
      return [
        num(n),
        num(mine),
        num(theirs),
        theirs > 1n && n % theirs === 0n ? "약수다" : "약수가 아니다",
        same(mine, theirs),
      ];
    });
    const negative = rows.filter((r) => (r[2] ?? "").startsWith("-")).length;
    return block(
      md(
        ["입력", "정본", "절댓값을 안 취한 판", "뺀 판의 값", "두 답"],
        rows,
        [0, 1, 2],
      ),
      `셋째 칸이 음수인 줄은 ${rows.length} 줄 가운데 ${negative} 개입니다.`,
    );
  },

  "pause-composite-divisor": () => {
    const inputs = [COMPOSITE_D, 105n, 325n, WALK, TWIN];
    const rows = inputs.map((n) => {
      const d = pollardRho(n);
      return [num(n), factorText(n), num(d), factorText(d), num(n / d)];
    });
    const composite = inputs.filter((n) => !isPrime(pollardRho(n)));
    return block(
      md(
        ["입력", "n 의 소인수", "돌려준 값 d", "d 의 소인수", "n ÷ d"],
        rows,
        [0, 2, 4],
      ),
      `다섯 줄 모두 n 을 d 로 나눈 나머지가 0 이고, d 가 소수가 아닌 줄은 ${composite.map(num).join(" · ")} 의 줄입니다.`,
    );
  },

  "walk-trace": () => {
    const steps = walkSteps();
    const rows = steps.map((s) => [
      s.id,
      s.branch,
      s.title,
      `${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
    ]);
    const r = run(WALK);
    return block(
      md(["걸음", "갈래", "하는 일", "계산"], rows),
      `n = ${num(WALK)} 이고 반환값은 ${num(r.answer)} 입니다. 로 루프가 ${r.iters} 걸음이고 상수는 c = ${num(C0)} 하나로 끝났습니다. 나머지 연산은 모두 ${num(r.ops)} 번이고 그중 ${num(r.primeOps)} 번이 소수 판정의 몫입니다.`,
    );
  },

  "walk-branch": () => {
    const inputs = [WALK, RETRY_SMALL, RETRY_SECOND, 4n, 1_000_003n, TWIN];
    const labels = [
      "① 짝수인가",
      "② 소수인가",
      "③ 수열을 시작한다",
      "④ d 를 1 로 둔다",
      "⑤ 두 자리를 나아가게 한다",
      "⑥ 차의 최대공약수",
      "⑦ 비자명한 약수를 돌려준다",
      "⑧ c 를 올려 다시",
    ];
    const cols = inputs.map((n) => {
      const c = count(n);
      const prime = c.exit === "짝수" ? 0 : 1;
      const back = c.exit === "로" ? 1 : 0;
      const retry = c.roundCount === 0 ? 0 : c.roundCount - 1;
      return [
        1,
        prime,
        c.roundCount,
        c.roundCount,
        c.iters,
        c.iters,
        back,
        retry,
      ];
    });
    const rows = labels.map((label, i) => [
      label,
      ...cols.map((col) => num(col[i] ?? 0)),
    ]);
    const never = labels.filter((_, i) =>
      cols.every((col) => (col[i] ?? 0) === 0),
    ).length;
    const walkZero = labels.filter((_, i) => (cols[0]?.[i] ?? 0) === 0);
    return block(
      md(
        ["갈래", ...inputs.map(num)],
        rows,
        inputs.map((_, i) => i + 1),
      ),
      `전개 입력의 열에서 0 번인 갈래는 ${walkZero.map((l) => l.slice(0, 1)).join(" ")} 입니다. 여섯 입력을 합쳐 한 번도 실행되지 않은 갈래는 ${never} 개입니다.`,
    );
  },

  "final-calls": () => {
    const inputs = [WALK, RETRY_SMALL, COMPOSITE_D, 1_000_003n, balanced(6).n];
    const where = (n: bigint) => {
      const c = count(n);
      if (c.exit === "로") {
        return `c = ${c.roundCount} 까지 · 로 루프 ${num(c.iters)} 걸음`;
      }
      return `${c.exit === "짝수" ? "①" : "②"} 에서 답했다`;
    };
    return columns(
      inputs.map((n) => [
        `pollardRho(${n}n)`,
        "→",
        `${pollardRho(n)}n`,
        where(n),
      ]),
    ).join("\n");
  },

  /* ───────── 알아 두면 좋은 개념 ───────── */

  "related-floyd": () => {
    const k = meetStep(P);
    const xs = sequence(P, 2 * k + 1);
    const rows: string[][] = [];
    for (let i = 0; i <= k; i++) {
      const a = xs[i] as bigint;
      const b = xs[2 * i] as bigint;
      rows.push([
        String(i),
        `x${sub(i)} = ${num(a)}`,
        `x${sub(2 * i)} = ${num(b)}`,
        i > 0 && a === b ? "같다" : i === 0 ? "출발" : "다르다",
      ]);
    }
    return block(
      md(["걸음 k", "느린 자리 x", "빠른 자리 y", "두 값"], rows, [0]),
      `법 ${num(P)} 위의 수열입니다. 걸음 ${k} 에서 두 값이 처음 같아지고, 그때까지 들고 있던 값은 x 와 y 둘뿐입니다.`,
    );
  },

  /* ───────── 경쟁 설계와의 대조 ───────── */

  "alt-counts": () => {
    const ours = cases["폴라드 로"]();
    const alt = cases["p-1 을 앞에 세운 두 단계 판"]();
    const keys = Object.keys(ours) as (keyof typeof ours)[];
    const rows = keys.map((k) => {
      const a = ours[k];
      const b = alt[k];
      return [
        k,
        num(a),
        num(b),
        a === b ? "같다" : a < b ? "폴라드 로" : "두 단계 판",
      ];
    });
    return block(
      md(["항목", "폴라드 로", "두 단계 판", "적은 쪽"], rows, [1, 2]),
      `매끄러운 p 는 ${num(SMOOTH_P)} 이고 안전 소수 p 는 ${num(SAFE_P)} 입니다. 두 입력은 각각 ${num(SMOOTH_N)}${과와(num(SMOOTH_N))} ${num(SAFE_N)} 이고, 한계 B = ${num(BOUND)}${으로(num(BOUND))} 잰 값입니다.`,
    );
  },

  "alt-bound": () => {
    const limits = [50, 100, 200, 400, 800, 1_600];
    const rows = limits.map((limit) => {
      const smooth = countTwoStage(SMOOTH_N, limit);
      const safe = countTwoStage(SAFE_N, limit);
      return [
        num(limit),
        smooth.bySmooth ? "p-1 단계" : "로 단계",
        num(smooth.ops),
        num(safe.ops),
        num(smooth.ops + safe.ops),
      ];
    });
    const best = bestBound(limits);
    const big = factorize(SMOOTH_P - 1n).at(-1) as bigint;
    return block(
      md(
        [
          "한계 B",
          "매끄러운 p 를 찾는 단계",
          "매끄러운 p",
          "안전 소수 p",
          "둘의 합",
        ],
        rows,
        [0, 2, 3, 4],
      ),
      `둘의 합이 가장 작은 줄은 B = ${num(best.limit)} 이고 그때 ${num(best.ops)} 입니다. 매끄러운 p 의 p − 1 에서 가장 큰 소인수는 ${num(big)} 이고, 안전 소수의 p − 1 은 ${num(SAFE_P - 1n)} = 2 × ${num((SAFE_P - 1n) / 2n)} 입니다.`,
    );
  },

  /* ───────── 수식 정의와 유도 ───────── */

  "math-define": () => {
    const k = meetStep(P);
    const xs = sequence(P, 2 * k + 1);
    const idx = Array.from({ length: k + 1 }, (_, i) => i);
    return [
      ...columns([
        ["i", ...idx.map(String)],
        ["x_i", ...idx.map((i) => num(xs[i] as bigint))],
        ["x_2i", ...idx.map((i) => num(xs[2 * i] as bigint))],
      ]),
      "",
      `i = ${k} 에서 처음 x_i ≡ x_2i 이므로 ρ(${num(P)}, ${num(C0)}) = ${k}`,
    ].join("\n");
  },

  "math-check": () => {
    const rows: string[][] = [];
    const ratios: number[] = [];
    for (const p of [97n, 1_009n, 10_007n, 100_003n]) {
      const root = isqrt(p);
      const ks = [1n, 2n, 3n, 4n].map((c) => meetStep(p, c));
      const ratio = ks.reduce((a, b) => a + b, 0) / ks.length / Number(root);
      ratios.push(ratio);
      rows.push([num(p), num(root), ...ks.map(num), ratio.toFixed(2)]);
    }
    const lo = Math.min(...ratios).toFixed(2);
    const hi = Math.max(...ratios).toFixed(2);
    return block(
      md(
        [
          "p",
          "√p 를 내림한 값",
          "c = 1",
          "c = 2",
          "c = 3",
          "c = 4",
          "네 값의 평균 / √p",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      `셋째 칸부터 여섯째 칸까지가 같은 p 를 상수 넷으로 실행해 잰 첫 만남 걸음이고, 마지막 칸은 ${lo}${과와(lo)} ${hi} 사이입니다.`,
    );
  },

  "math-scale": () => {
    const scales: [string, bigint][] = [
      ["10^4", 10n ** 4n],
      ["10^8", 10n ** 8n],
      ["10^12", 10n ** 12n],
      ["10^16", 10n ** 16n],
      ["2^64", LIMIT],
    ];
    const rows = scales.map(([label, n]) => {
      const root = isqrt(n);
      const quarter = isqrt(root);
      return [label, num(root), num(quarter), num(root / quarter)];
    });
    return block(
      md(
        [
          "규모 n",
          "√n 을 내림한 값",
          "n^(1/4) 을 내림한 값",
          "둘째를 셋째로 나눈 값",
        ],
        rows,
        [1, 2, 3],
      ),
      "둘째 칸과 셋째 칸은 실행하지 않고 제곱근을 한 번과 두 번 구한 값이라 상수 배가 담겨 있지 않습니다.",
    );
  },

  /* ───────── 불변식 ───────── */

  "invariant-walk": () => {
    const r = run(WALK);
    const steps = r.rounds[0]?.steps ?? [];
    const rows = steps.map((s) => [
      `T${3 + s.k}`,
      num(s.d),
      WALK % s.d === 0n ? "그렇다" : "아니다",
      s.d !== 1n && s.d !== WALK
        ? "그렇다 — 1 도 n 도 아니다"
        : s.d === 1n
          ? "아니다 — d = 1"
          : "아니다 — d = n",
    ]);
    const divides = steps.filter((s) => WALK % s.d === 0n).length;
    return block(
      md(["걸음", "d", "n 의 약수 여부", "반환 여부"], rows, [1]),
      `${rows.length} 걸음 가운데 d 가 ${num(WALK)} 의 약수인 걸음은 ${divides} 개입니다.`,
    );
  },

  "edge-values": () => {
    const inputs = [
      2n,
      3n,
      4n,
      9n,
      15n,
      21n,
      25n,
      49n,
      63n,
      WALK,
      1_000_003n,
      2n * 1_000_003n,
    ];
    const rows = inputs.map((n) => {
      const c = count(n);
      const t = trialDivision(n);
      return [
        num(n),
        EXIT_PLAIN[c.exit],
        num(c.answer),
        num(t),
        n % c.answer === 0n ? "약수" : "약수 아님",
        c.answer === n ? "n 자신" : "1 < d < n",
      ];
    });
    const divides = rows.filter((r) => r[4] === "약수").length;
    const differ = rows.filter((r) => r[2] !== r[3]).map((r) => r[0]);
    return block(
      md(
        ["입력 n", "답한 갈래", "정본", "시행 나눗셈", "d 는", "자리"],
        rows,
        [0, 2, 3],
      ),
      `${rows.length} 줄 가운데 다섯째 칸이 「약수」인 줄은 ${divides} 개입니다. 셋째 칸과 넷째 칸이 갈리는 줄은 ${differ.join(" · ")} 입니다.`,
    );
  },

  "mutant-return-any": () => {
    const inputs = [9n, 15n, RETRY_SMALL, RETRY_SECOND, COMPOSITE_D, WALK];
    const rows = inputs.map((n) => {
      const mine = pollardRho(n);
      const theirs = returnAny.pollardRho(n);
      return [
        num(n),
        factorText(n),
        num(mine),
        num(theirs),
        theirs === n ? "n 자신" : "1 < d < n",
        same(mine, theirs),
      ];
    });
    return block(
      md(
        [
          "입력",
          "소인수",
          "정본",
          "반환 검사를 뺀 판",
          "뺀 판이 낸 d",
          "두 답",
        ],
        rows,
        [0, 2, 3],
      ),
      "다섯째 칸이 「n 자신」인 줄은 합성수인데 입력 자신을 돌려준 줄입니다.",
    );
  },

  "why-21": () => {
    const n = RETRY_SMALL;
    const [s] = oneRound(n, 1n);
    if (s === undefined) throw new Error("걸음이 없다");
    const f = (t: bigint) => (t * t + 1n) % n;
    const second = oneRound(n, 2n);
    const end = second.at(-1) as RoundStep;
    return columns([
      [`c = 1 · f(t) = (t² + 1) mod ${num(n)}`, ""],
      [
        `x ← f(2) = ${num(s.x)}`,
        `y ← f(f(2)) = f(${num(f(2n))}) = ${num(s.y)}`,
      ],
      [
        `|x − y| = ${num(s.diff)}`,
        `gcd(${num(s.diff)}, ${num(n)}) = ${num(s.d)}`,
      ],
      [
        "정본은 c = 2 로 다시 시작해",
        `${end.k} 걸음 만에 ${num(end.d)}${을를(num(end.d))} 낸다`,
      ],
    ]).join("\n");
  },

  /* ───────── 비용 계산 ───────── */

  "perf-walk": () => {
    const steps = walkSteps();
    const r = run(WALK);
    const loop = r.rounds[0]?.steps ?? [];
    const rows: string[][] = [
      ["T1", "짝수 검사", "1"],
      ["T2", "소수 판정", num(r.primeOps)],
    ];
    for (const s of loop) {
      rows.push([
        `T${3 + s.k}`,
        "수열 칸 3 개 · 최대공약수",
        `3 + ${s.gcdOps} = ${3 + s.gcdOps}`,
      ]);
    }
    const sum = 1 + r.primeOps + loop.reduce((a, s) => a + 3 + s.gcdOps, 0);
    const zero = steps
      .filter((s) => !rows.some((row) => row[0] === s.id))
      .map((s) => s.id);
    return block(
      md(["걸음", "하는 일", "나머지 연산"], rows, [2]),
      `더하면 ${num(sum)} 이고, 기록 사본이 센 전체 ${num(r.ops)}${과와(num(r.ops))} 같습니다. ${zero.join(" · ")} 은 비교뿐이라 0 입니다.`,
    );
  },

  "perf-formula": () => {
    const inputs = [
      2n * 1_000_003n,
      1_000_003n,
      WALK,
      RETRY_SMALL,
      TWIN,
      balanced(4).n,
      balanced(6).n,
    ];
    let agree = 0;
    const rows = inputs.map((n) => {
      const c = count(n);
      const formula = 1 + c.primeOps + 3 * c.iters + c.gcdOps;
      if (formula === c.ops) agree += 1;
      return [
        num(n),
        num(c.primeOps),
        num(c.iters),
        num(c.gcdOps),
        c.iters === 0 ? "—" : (c.gcdOps / c.iters).toFixed(1),
        num(formula),
        num(c.ops),
      ];
    });
    return block(
      md(
        [
          "입력",
          "소수 판정 P",
          "걸음 합 Σk",
          "최대공약수 G",
          "걸음당 G",
          "식 1 + P + 3Σk + G",
          "실행이 센 값",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      `${rows.length} 줄 가운데 여섯째 칸과 일곱째 칸이 같은 줄은 ${agree} 개입니다.`,
    );
  },

  "worst-shapes": () => {
    const huge = nextPrime(10n ** 18n);
    const shapes: [string, bigint][] = [
      ["짝수", 2n * huge],
      ["가장 작은 소인수가 3", 3n * huge],
      [
        "가장 작은 소인수가 10^3 근방",
        nextPrime(1_000n) * nextPrime(10n ** 15n),
      ],
      [
        "가장 작은 소인수가 10^6 근방",
        nextPrime(10n ** 6n) * nextPrime(10n ** 12n),
      ],
      ["두 소인수가 모두 10^9 근방", balanced(9).n],
      ["2^64 아래에서 가장 작은 소인수가 가장 큰 모양", squareBelow(64).n],
      ["소수", huge],
    ];
    const ops: number[] = [];
    const rows = shapes.map(([label, n]) => {
      const c = count(n);
      ops.push(c.ops);
      return [label, num(n), num(factorize2(n)), num(c.iters), num(c.ops)];
    });
    return block(
      md(
        ["입력 모양", "n", "가장 작은 소인수", "로 루프 걸음", "나머지 연산"],
        rows,
        [1, 2, 3, 4],
      ),
      `일곱 줄의 n 이 전부 10^18 이상인데 마지막 칸은 ${num(Math.min(...ops))} 부터 ${num(Math.max(...ops))} 까지 갈립니다.`,
    );
  },

  "worst-construct": () => {
    const w = squareBelow(64);
    const c = count(w.n);
    return columns([
      [
        "첫째",
        "소인수를 둘로 정한다",
        "셋이면 가장 작은 것이 n^(1/3) 이하로 내려간다",
      ],
      ["둘째", "둘의 크기를 같게 한다", "p = q 이면 p 가 √n 으로 가장 크다"],
      [
        "셋째",
        "p² < 2^64 에서 p 를 가장 크게",
        `p = ${num(w.p)} · 2^32 아래에서 가장 큰 소수`,
      ],
      [
        "",
        `n = p² = ${num(w.n)}`,
        `로 루프 ${num(c.iters)} 걸음 · 나머지 연산 ${num(c.ops)} 번 · ${seconds(c.ops)}`,
      ],
    ]).join("\n");
  },

  /* ───────── 스스로 점검하기 ───────── */

  "check-retry": () => {
    const n = RETRY_SMALL;
    const rows: string[][] = [];
    for (const c of [1n, 2n]) {
      for (const s of oneRound(n, c)) {
        rows.push([
          String(c),
          String(s.k),
          num(s.x),
          num(s.y),
          num(s.diff),
          num(s.d),
        ]);
      }
    }
    const r = count(n);
    return block(
      md(
        ["상수 c", "걸음 k", "x", "y", "|x − y|", "d"],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      `정본의 반환값은 ${num(r.answer)} 이고, 나머지 연산은 모두 ${num(r.ops)} 번입니다.`,
    );
  },
};
