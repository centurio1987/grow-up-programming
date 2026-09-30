/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 호출마다의 `n` · `k`, 반복마다의 `num` · `den`, 역원 거듭제곱의 바퀴는 그림 사이드카의 `trace`(정본
 * 소스에서 기계로 만든 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/binomialModP/binomialModP-guide.md
 *
 * 경쟁 설계 대조 표는 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 *
 * **판정 열이 있는 변이 표의 변이는 이 파일 최상위에서 만든다.** `check-proof` 가 변이를 끈 채 이
 * 파일을 한 번 더 불러 갈리는 줄을 실행에서 얻는데, 그림 사이드카는 캐시에서 돌아오므로 거기서 만든
 * 변이는 꺼지지 않는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases,
  closedFormAgrees,
  valuesAgree,
} from "./binomialModP-guide.alt.ts";
import {
  BIG_P,
  binomialDigits,
  type Call,
  digitsOf,
  divideInstead,
  exactBinomial,
  fermatMults,
  inverseBySearch,
  LIMIT_N,
  multsOf,
  num,
  type Trace,
  trace,
  WALK_K,
  WALK_N,
  WALK_P,
  walk,
  walkSteps,
} from "./binomialModP-guide.fig.tsx";
import { binomialModP } from "./binomialModP-guide.ref.ts";

const REF = new URL("./binomialModP-guide.ref.ts", import.meta.url).pathname;

type Ref = { binomialModP: (n: bigint, k: bigint, p: bigint) => bigint };

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

/** 글자 폭 — 한글은 두 칸으로 센다. 펜스 안 열을 값에서 맞추는 데 쓴다. */
const width = (s: string): number =>
  [...s].reduce((w, c) => w + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

/** 펜스 안의 여러 줄을 열마다 폭을 재서 맞춘다. 각 줄 앞에 `indent` 를 붙인다. */
function aligned(rows: string[][], indent = "  "): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map(
    (r) =>
      indent +
      r
        .map((cell, c) =>
          c === r.length - 1
            ? cell
            : cell + " ".repeat(Math.max(0, (w[c] ?? 0) - width(cell))),
        )
        .join("   ")
        .replace(/\s+$/, ""),
  );
}

const C = (n: bigint, k: bigint, p: bigint): string =>
  `C(${num(n)}, ${num(k)}) mod ${num(p)}`;

/**
 * `p` 진 자릿수를 높은 자리부터 적는다. `width` 는 **글자 수가 아니라 자리 수**다.
 *
 * **법이 10 보다 크면 자리를 빈칸으로 가른다.** 한 자리가 두 글자가 될 수 있어서 그냥 이으면 자리 경계가
 * 사라진다 — `p = 11` 에서 1,000 은 자리 셋(8 · 2 · 10)인데 이어 붙이면 `8210` 이 되어 자리 넷으로 읽힌다.
 */
const digitString = (v: bigint, p: bigint, width = 0): string => {
  const ds = digitsOf(v, p).reverse();
  while (ds.length < width) ds.unshift(0n);
  return p > 10n ? ds.join(" ") : ds.join("");
};

/** 이 런타임이 만들 수 있는 정수의 비트 상한 — 이분으로 실제 자리를 찾는다. */
function bigintBitCap(): { bits: number; digits: number } {
  const ok = (bits: number): boolean => {
    try {
      return 1n << BigInt(bits) > 0n;
    } catch {
      return false;
    }
  };
  let lo = 1;
  let hi = 1 << 22;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return { bits: lo + 1, digits: (1n << BigInt(lo)).toString().length };
}

/** `n!` 의 십진 자릿수. 값을 만들지 않고 로그 합으로 센다. */
function factorialDigits(n: number): number {
  let acc = 0;
  for (let i = 2; i <= n; i++) acc += Math.log10(i);
  return Math.floor(acc) + 1;
}

/** 곱셈·나눗셈에 들어간 두 피연산자의 자릿수를 곱해 더한 값. `p` 가 없으면 큰 정수 그대로다. */
function digitWork(n: bigint, k: bigint, p: bigint | null): number {
  const j = n - k < k ? n - k : k;
  let work = 0;
  if (p === null) {
    let r = 1n;
    for (let i = 0n; i < j; i++) {
      const a = n - i;
      work += r.toString().length * a.toString().length;
      r *= a;
      const b = i + 1n;
      work += r.toString().length * b.toString().length;
      r /= b;
    }
    return work;
  }
  let nm = 1n;
  let dn = 1n;
  for (let i = 0n; i < j; i++) {
    work += nm.toString().length * (n - i).toString().length;
    nm = (nm * (n - i)) % p;
    work += dn.toString().length * (i + 1n).toString().length;
    dn = (dn * (i + 1n)) % p;
  }
  return work;
}

/**
 * 자리마다의 반복 횟수를 실제로 반복하지 않고 더한다 — 정본의 재귀와 같은 모양으로 걷는다. 법 바로 아래까지
 * 키운 `n`(반복 5 억 번)은 계측 사본으로 실행할 수 없어서 이 셈을 쓴다.
 */
function loopTotal(n: bigint, k: bigint, p: bigint): bigint {
  let loops = 0n;
  const rec = (a: bigint, b: bigint): void => {
    if (b < 0n || b > a || b === 0n || b === a) return;
    if (a >= p) {
      rec(a % p, b % p);
      rec(a / p, b / p);
      return;
    }
    loops += a - b < b ? a - b : b;
  };
  rec(n, k);
  return loops;
}

/** 작은 수의 소수 판정 — 나누어 본다. */
const isPrime = (p: bigint): boolean => {
  if (p < 2n) return false;
  for (let d = 2n; d * d <= p; d++) if (p % d === 0n) return false;
  return true;
};

/** 정수 `x` 의 이진 자릿수. */
const bitLength = (x: bigint): number => (x === 0n ? 0 : x.toString(2).length);
const oneBits = (x: bigint): number =>
  [...x.toString(2)].filter((c) => c === "1").length;

/** 반복하는 자리 — 전개 입력에서는 자리 1 하나다. */
const loopDigit = (t: Trace): Extract<Call, { kind: "loop" }> => {
  const c = t.digits.find((x) => x.kind === "loop");
  if (c?.kind !== "loop") throw new Error("반복하는 자리가 없다");
  return c;
};

/* ────────── 판정 열이 있는 변이 표의 변이 (모듈 최상위에서 만든다) ────────── */

/** 자릿수를 떼는 분기를 걷어 낸 판 — 역원 곱셈만 하고 자리를 안 가른다. */
const NO_SPLIT = await loadMutant<Ref>(REF, {
  swap: [/^ {2}if \(n >= p\) \{$/, "  if (false) {"],
});

/** 반복 횟수를 작은 쪽으로 옮기는 줄을 `k` 그대로로 바꾼 판. */
const NO_SYMMETRY = await loadMutant<Ref>(REF, {
  swap: [/^ {2}const j = n - k < k \? n - k : k;$/, "  const j = k;"],
});

/**
 * 자릿수를 떼어 낼지 판정하는 줄의 오른쪽을 `p` 에서 `p * p` 로 키운 판. 불변식 「반복문에 들어가는
 * 호출은 언제나 `n < p`」를 지키던 바로 그 줄이다.
 */
const WIDE_SPLIT = await loadMutant<Ref>(REF, {
  swap: [/^ {2}if \(n >= p\) \{$/, "  if (n >= p * p) {"],
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ── 전체 컨셉 ── */

  conceptTask: () => {
    const exact = exactBinomial(WALK_N, WALK_K);
    return [
      `binomialModP(${WALK_N}n, ${WALK_K}n, ${WALK_P}n)`,
      `  이항 계수   C(${WALK_N}, ${WALK_K}) = ${num(exact)}`,
      `  나머지      ${num(exact)} mod ${WALK_P} = ${binomialModP(WALK_N, WALK_K, WALK_P)}`,
    ].join("\n");
  },

  /* ── 아이디어를 떠올리는 과정 ── */

  naiveScale: () => {
    const cap = bigintBitCap();
    const rows = [10, 100, 1_000, 10_000, 100_000].map((n) => [
      num(n),
      num(binomialDigits(n, n / 2)),
      num(factorialDigits(n)),
    ]);
    const big = factorialDigits(Number(LIMIT_N));
    return `${md(["n", "C(n, n/2) 의 자릿수", "n! 의 자릿수"], rows, [0, 1, 2])}

이 런타임이 만들 수 있는 정수는 ${num(cap.bits)} 비트, 십진 ${num(cap.digits)} 자리까지입니다. ${num(LIMIT_N)}! 은 ${num(big)} 자리라 ${big > cap.digits ? "그 상한 밖입니다" : "그 상한 안입니다"}.`;
  },

  modCost: () => {
    const rows = [10n, 100n, 1_000n, 2_000n].map((n) => {
      const k = n / 2n;
      return [
        num(n),
        num(digitWork(n, k, null)),
        num(digitWork(n, k, BIG_P)),
        num(binomialDigits(Number(n), Number(k))),
        String(String(BIG_P - 1n).length),
      ];
    });
    const last = rows.at(-1) as string[];
    return `${md(
      [
        "n (k = n/2)",
        "큰 정수 판",
        "법으로 줄인 판",
        "큰 정수의 최대 자릿수",
        "줄인 값의 최대 자릿수",
      ],
      rows,
      [0, 1, 2, 3, 4],
    )}

재는 것은 곱셈 · 나눗셈마다 두 피연산자의 자릿수를 곱해 더한 값입니다. 곱하는 횟수는 두 방식이 같고, n = ${last[0]} 에서 ${last[1]}${과와(last[1] as string)} ${last[2]}${으로(last[2] as string)} 갈립니다.`;
  },

  originDivision: () => {
    const t = walk();
    const c = loopDigit(t);
    const rows = [
      ["시작", "—", "—", "1", "1"],
      ...c.rounds.map((r) => [
        `i = ${r.i}`,
        String(c.n - r.i),
        String(r.i + 1n),
        String(r.num),
        String(r.den),
      ]),
    ];
    const exact = exactBinomial(c.n, c.k);
    return `${md(["반복", "num 에 곱하는 수", "den 에 곱하는 수", "num", "den"], rows, [1, 2, 3, 4])}

C(${c.n}, ${c.k}) mod ${t.p} 의 반복이 끝나면 num = ${c.num}, den = ${c.den} 입니다. 참값은 C(${c.n}, ${c.k}) = ${exact} 이고 ${t.p}${으로(String(t.p))} 나눈 나머지는 ${exact % t.p} 인데, ${c.num}${이가(String(c.num))} ${c.den}${으로(String(c.den))} 나누어떨어지지 않습니다.`;
  },

  divideInstead: () => {
    const inputs: [bigint, bigint, bigint][] = [
      [4n, 2n, 7n],
      [5n, 2n, 7n],
      [6n, 3n, 7n],
      [20n, 10n, BIG_P],
    ];
    let same = 0;
    const rows = inputs.map(([n, k, p]) => {
      const d = divideInstead(n, k, p);
      const truth = binomialModP(n, k, p);
      if (d.value === truth) same++;
      return [
        C(n, k, p),
        num(d.num),
        num(d.den),
        d.value === null ? "나눌 수 없다" : num(d.value),
        num(truth),
        d.value === truth ? "같다" : "틀리다",
      ];
    });
    return `${md(
      ["입력", "num", "den", "num / den 의 몫", "정본의 답", "판정"],
      rows,
      [1, 2, 3, 4],
    )}

${inputs.length} 입력 가운데 몫이 답과 같은 것은 ${same} 개입니다.`;
  },

  originInverse: () => {
    const t = walk();
    const c = loopDigit(t);
    const inv = inverseBySearch(c.den, t.p) as bigint;
    const exact = exactBinomial(c.n, c.k);
    return [
      `C(${c.n}, ${c.k}) mod ${t.p}${을를(String(t.p))} 역원으로`,
      ...aligned([
        [
          `den = ${c.den} 의 역원`,
          String(inv),
          `${c.den} · ${inv} = ${c.den * inv}`,
          `${c.den * inv} mod ${t.p} = ${(c.den * inv) % t.p}`,
        ],
        [
          "num · 역원",
          "",
          `${c.num} · ${inv} = ${c.num * inv}`,
          `${c.num * inv} mod ${t.p} = ${(c.num * inv) % t.p}`,
        ],
        [
          "참값",
          "",
          `C(${c.n}, ${c.k}) = ${exact}`,
          `${exact} mod ${t.p} = ${exact % t.p}`,
        ],
      ]),
    ].join("\n");
  },

  lucasNeed: () => {
    const inputs: [bigint, bigint, bigint][] = [
      [4n, 2n, 7n],
      [6n, 3n, 7n],
      [10n, 3n, 7n],
      [15n, 7n, 7n],
      [34n, 20n, 7n],
      [100n, 50n, BIG_P],
    ];
    const rows = inputs.map(([n, k, p]) => {
      const a = binomialModP(n, k, p);
      const b = NO_SPLIT.binomialModP(n, k, p);
      return [
        C(n, k, p),
        n >= p ? "예" : "아니요",
        num(exactBinomial(n, k) % p),
        num(b),
        a === b ? "같다" : "틀리다",
      ];
    });
    return md(
      ["입력", "n ≥ p", "정의대로", "역원만 곱한 판", "판정"],
      rows,
      [2, 3],
    );
  },

  originLucas: () => {
    const t = walk();
    const [d0, d1] = t.digits as [Call, Call];
    return [
      ...aligned(
        [
          ["n", `${t.n} = ${t.n / t.p} · ${t.p} + ${t.n % t.p}`, ""],
          ["k", `${t.k} = ${t.k / t.p} · ${t.p} + ${t.k % t.p}`, ""],
          ["낮은 자리", `C(${d0.n}, ${d0.k}) mod ${t.p} = ${d0.value}`, ""],
          ["높은 자리", `C(${d1.n}, ${d1.k}) mod ${t.p} = ${d1.value}`, ""],
          [
            "곱",
            `${d0.value} · ${d1.value} mod ${t.p} = ${t.answer}`,
            `정의대로 ${exactBinomial(t.n, t.k) % t.p}`,
          ],
        ],
        "",
      ),
    ].join("\n");
  },

  /* ── 아이디어 상세 — 모듈러 역원 ── */

  inverseRead: () => {
    const p = WALK_P;
    const a = 2n;
    const lines: string[] = [];
    for (let x = 1n; x < p; x++) {
      const v = (a * x) % p;
      lines.push(
        `  x = ${x}   ${a} · ${x} = ${a * x}   mod ${p} = ${v}${v === 1n ? "   ← 1 이다" : ""}`,
      );
      if (v === 1n) break;
    }
    return [`법 ${p} 에서 ${a} 의 역원 찾기`, ...lines].join("\n");
  },

  inverseVsNegation: () => {
    const p = WALK_P;
    const rows: string[][] = [];
    let ones = 0;
    for (let a = 1n; a < p; a++) {
      const neg = p - a;
      const inv = inverseBySearch(a, p) as bigint;
      if ((a * neg) % p === 1n) ones++;
      rows.push([
        String(a),
        String(neg),
        String((a * neg) % p),
        String(inv),
        String((a * inv) % p),
      ]);
    }
    return `${md(
      ["a", "p − a", "a · (p − a) mod p", "a 의 역원", "a · 역원 mod p"],
      rows,
      [0, 1, 2, 3, 4],
    )}

p − a 를 곱해 1 이 나온 줄은 ${rows.length} 줄 가운데 ${ones} 줄이고, 역원을 곱하면 ${rows.length} 줄 모두 1 입니다.`;
  },

  inverseZero: () => {
    const rows: string[][] = [];
    for (const [a, p] of [
      [0n, 7n],
      [7n, 7n],
      [2n, 6n],
      [3n, 6n],
      [5n, 6n],
    ] as [bigint, bigint][]) {
      const seen = new Set<bigint>();
      for (let x = 1n; x < p; x++) seen.add((a * x) % p);
      const inv = inverseBySearch(a, p);
      rows.push([
        `a = ${a}, p = ${p}`,
        [...seen].sort((x, y) => Number(x - y)).join(" "),
        inv === null ? "없다" : String(inv),
      ]);
    }
    return md(
      ["a 와 법", "a · x mod p 가 내는 값 (x = 1 … p − 1)", "역원"],
      rows,
    );
  },

  /* ── 아이디어 상세 — p 진 자릿수 ── */

  digitsRead: () => {
    const t = walk();
    const q = t.n / t.p;
    return [
      `n = ${t.n} 의 자리 1`,
      ...aligned([
        [`${t.n} / ${t.p} = ${q}`, "자리 0 을 떼어 낸 몫"],
        [`${q} % ${t.p} = ${q % t.p}`, "그 몫의 가장 낮은 자리가 자리 1 이다"],
        [
          `${q % t.p} · ${t.p} = ${(q % t.p) * t.p}`,
          `자리 1 이 ${t.n} 에서 맡는 몫`,
        ],
      ]),
    ].join("\n");
  },

  digitsChain: () => {
    const rows: string[][] = [];
    for (const [n, p] of [
      [WALK_N, WALK_P],
      [LIMIT_N, 11n],
    ] as [bigint, bigint][]) {
      let x = n;
      let i = 0;
      while (x > 0n) {
        rows.push([
          `n = ${num(n)}, p = ${p}`,
          String(i),
          num(x),
          num(x % p),
          num(x / p),
        ]);
        x /= p;
        i++;
      }
    }
    const d = digitsOf(LIMIT_N, 11n).length;
    return `${md(["입력", "자리 i", "x", "x % p (자리 i 의 값)", "x / p (다음 x)"], rows, [1, 2, 3, 4])}

n = ${num(LIMIT_N)} 을 11 로 나누어 가면 ${d} 번째에 몫이 0 이 되어 자리가 ${d} 개입니다.`;
  },

  digitsWrongBase: () => {
    const [n, k, p] = [WALK_N, WALK_K, WALK_P];
    const truth = exactBinomial(n, k) % p;
    const rows: string[][] = [];
    for (const base of [10n, 5n, 3n, 7n]) {
      const nd = digitsOf(n, base);
      const kd = digitsOf(k, base);
      let prod = 1n;
      for (let i = 0; i < nd.length; i++) {
        prod = (prod * exactBinomial(nd[i] ?? 0n, kd[i] ?? 0n)) % p;
      }
      rows.push([
        `${base} 진`,
        digitString(n, base),
        digitString(k, base, nd.length),
        String(prod),
        String(truth),
        prod === truth ? "같다" : "틀리다",
      ]);
    }
    return md(
      [
        "가르는 밑",
        "n 의 자리",
        "k 의 자리",
        `자리별 곱 mod ${p}`,
        `정의대로 mod ${p}`,
        "판정",
      ],
      rows,
      [3, 4],
    );
  },

  /* ── 아이디어 상세 — 단계 ── */

  stage1Split: () => {
    const t = trace(1_000n, 500n, 11n);
    const rows: string[][] = [];
    for (const [idx, c] of t.order.entries()) {
      const what =
        c.kind === "split"
          ? `자리 ${c.place}${을를(String(c.place))} 뗀다 → 낮은 자리 (${c.low.n}, ${c.low.k}) · 남은 자리 (${c.high.n}, ${c.high.k})`
          : c.kind === "edge"
            ? `자리 ${c.place} · 경계 → ${c.value}`
            : `자리 ${c.place}${을를(String(c.place))} 푼다 → ${c.value}`;
      rows.push([String(idx + 1), `(${num(c.n)}, ${num(c.k)})`, what]);
    }
    const loops = t.digits.filter((c) => c.kind === "loop").length;
    return `${md(["들어간 순서", "호출 (n, k)", "하는 일"], rows, [0])}

C(1,000, 500) mod 11 의 호출은 ${t.order.length} 번이고, 자리를 푸는 호출 ${loops} 번이 자리 ${t.digits.length} 개를 하나씩 맡습니다. 세 자리의 답을 곱하면 ${t.answer} 이고, 정의대로 계산한 값도 ${exactBinomial(1_000n, 500n) % 11n} 입니다.`;
  },

  conceptGain: () => {
    const n = LIMIT_N;
    const k = n / 2n;
    const rows: string[][] = [];
    for (const p of [BIG_P, 100_003n, 101n, 11n, 2n]) {
      const t = trace(n, k, p);
      const per = [...t.digits]
        .reverse()
        .map((c) => num(c.kind === "loop" ? c.rounds.length : 0));
      const total = t.digits.reduce(
        (m, c) => m + (c.kind === "loop" ? c.rounds.length : 0),
        0,
      );
      rows.push([num(p), num(t.digits.length), per.join(" "), num(total)]);
    }
    return `${md(["법 p", "자릿수 개수 d", "자리마다의 반복(높은 자리부터)", "반복 총 횟수"], rows, [0, 1, 3])}

n = ${num(n)}, k = ${num(k)} 로 고정하고 법만 바꿨습니다.`;
  },

  stage2Rounds: () => {
    const t = walk();
    const c = loopDigit(t);
    let fall = 1n;
    let fact = 1n;
    const rows = c.rounds.map((r) => {
      fall *= c.n - r.i;
      fact *= r.i + 1n;
      return [
        String(r.i),
        String(c.n - r.i),
        String(r.i + 1n),
        String(r.num),
        `${fall} mod ${t.p} = ${fall % t.p}`,
        String(r.den),
        `${fact} mod ${t.p} = ${fact % t.p}`,
      ];
    });
    return `${md(
      ["반복 i", "n_i − i", "i + 1", "num", "내림차순 곱", "den", "(i + 1)!"],
      rows,
      [0, 1, 2, 3, 5],
    )}

자리 ${c.place} 의 (n_i, k_i) = (${c.n}, ${c.k}) 에서 j = ${c.j} 번 반복했고, 반복마다 num 이 내림차순 곱을, den 이 (i + 1)! 을 법 ${t.p} 로 줄인 값과 같습니다.`;
  },

  stage2Edges: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [WALK_N, WALK_K, WALK_P],
      [7n, 3n, 5n],
    ] as [bigint, bigint, bigint][]) {
      const t = trace(n, k, p);
      for (const c of t.digits) {
        const how =
          c.kind === "loop"
            ? `반복 ${c.rounds.length} 번`
            : c.kind === "edge" && c.edge === "out"
              ? "k_i > n_i · 반복 없이 0"
              : c.kind === "edge" && c.edge === "zero"
                ? "k_i = 0 · 반복 없이 1"
                : "k_i = n_i · 반복 없이 1";
        rows.push([
          C(n, k, p),
          String(c.place),
          `(${c.n}, ${c.k})`,
          how,
          String(c.value),
        ]);
      }
      rows.push([C(n, k, p), "—", "자리의 곱", "—", String(t.answer)]);
    }
    return md(
      ["입력", "자리", "(n_i, k_i)", "갈래", "자리의 답"],
      rows,
      [1, 4],
    );
  },

  stage3Fermat: () => {
    const t = walk();
    const c = loopDigit(t);
    const rows = c.invRounds.map((r, i) => [
      String(i),
      String(r.e),
      String(r.bit),
      String(r.bIn),
      String(r.inv),
      String(r.bOut),
    ]);
    const mults = c.invRounds.reduce((m, r) => m + 1 + r.bit, 0);
    return `${md(["바퀴", "e", "비트", "바퀴 시작 b", "누적 뒤 inv", "제곱 뒤 b"], rows, [0, 1, 2, 3, 4, 5])}

밑 ${c.den}, 지수 ${t.p - 2n}, 법 ${t.p} 의 이진 거듭제곱이 모듈러 곱셈 ${mults} 번으로 inv = ${c.inv} 를 냈습니다. ${c.den} · ${c.inv} mod ${t.p} = ${(c.den * c.inv) % t.p} 이고, 1 부터 차례로 찾은 역원도 ${inverseBySearch(c.den, t.p)} 입니다. 이 자리의 답은 ${c.num} · ${c.inv} mod ${t.p} = ${c.value} 입니다.`;
  },

  stage4Combine: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [WALK_N, WALK_K, WALK_P],
      [15n, 7n, 7n],
      [1_000n, 500n, 11n],
    ] as [bigint, bigint, bigint][]) {
      const t = trace(n, k, p);
      const ds = [...t.digits].reverse();
      rows.push([
        C(n, k, p),
        ds.map((c) => `(${c.n}, ${c.k})`).join(" "),
        ds.map((c) => String(c.value)).join(" · "),
        String(t.answer),
        String(exactBinomial(n, k) % p),
      ]);
    }
    return md(
      [
        "입력",
        "자리마다 (n_i, k_i) (높은 자리부터)",
        "자리의 답",
        "곱 mod p",
        "정의대로",
      ],
      rows,
      [3, 4],
    );
  },

  premiseComposite: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [5n, 2n, 6n],
      [6n, 3n, 4n],
      [4n, 2n, 9n],
      [5n, 2n, 7n],
    ] as [bigint, bigint, bigint][]) {
      const a = binomialModP(n, k, p);
      const b = exactBinomial(n, k) % p;
      rows.push([
        C(n, k, p),
        isPrime(p) ? "소수" : "합성수",
        num(a),
        num(b),
        a === b ? "같다" : "틀리다",
      ]);
    }
    return md(["입력", "법", "정본의 답", "정의대로", "판정"], rows, [2, 3]);
  },

  inverseCost: () => {
    const rows: string[][] = [];
    for (const p of [7n, 101n, 1_000_003n, BIG_P]) {
      // C(4, 2) 의 den 이 2 라, 정본이 그 자리에서 구한 역원이 곧 2 의 역원이다.
      const t = trace(4n, 2n, p);
      const c = t.root;
      if (c.kind !== "loop" || c.den !== 2n)
        throw new Error("den 이 2 가 아니다");
      rows.push([
        num(p),
        num(c.inv),
        num(c.inv),
        num(fermatMults(p)),
        num(p - 1n),
      ]);
    }
    return `${md(
      [
        "법 p",
        "2 의 역원",
        "1 부터 차례로 넣으면 시도",
        "이진 거듭제곱의 모듈러 곱셈",
        "차례로 넣을 때의 최악",
      ],
      rows,
      [0, 1, 2, 3, 4],
    )}

차례로 넣는 방법은 x = 1, 2, 3, … 을 순서대로 시험하므로 시도 횟수가 곧 역원의 값이고, 이진 거듭제곱의 곱셈 수는 지수 p − 2 의 비트 수와 1 인 비트 수의 합입니다.`;
  },

  /* ── 수행으로 알아보는 알고리즘 ── */

  walkInput: () =>
    [
      `const [n, k, p] = [${WALK_N}n, ${WALK_K}n, ${WALK_P}n];`,
      `// 이 절이 끝나면 ${binomialModP(WALK_N, WALK_K, WALK_P)}n 이 나와야 한다`,
    ].join("\n"),

  walkSplit: () => {
    const t = walk();
    const root = t.root;
    if (root.kind !== "split")
      throw new Error("전개 입력은 자리를 떼는 호출로 시작한다");
    const lo = root.low;
    const steps = walkSteps();
    if (steps[0]?.id !== "T1" || steps[1]?.id !== "T2")
      throw new Error("걸음 번호가 어긋난다");
    return md(
      ["걸음", "호출 (n, k)", "조건", "결과"],
      [
        [
          "T1",
          `(${root.n}, ${root.k})`,
          `① 의 네 조건이 모두 거짓 · ② 의 ${root.n} >= ${t.p}${이가(String(t.p))} 참`,
          `낮은 자리 (${lo.n}, ${lo.k}) · 남은 자리 (${root.high.n}, ${root.high.k})`,
        ],
        [
          "T2",
          `(${lo.n}, ${lo.k})`,
          lo.kind === "edge" && lo.edge === "full"
            ? `① 의 k === n 이 참(${lo.k} === ${lo.n})`
            : "—",
          `${lo.value}${을를(String(lo.value))} 돌려준다`,
        ],
      ],
    );
  },

  edgeValues: () => {
    const rows: string[][] = [];
    for (const [name, n, k, p] of [
      ["k 가 음수", 5n, -1n, 7n],
      ["k 가 n 보다 큼", 5n, 10n, 7n],
      ["k 가 0", 100n, 0n, 7n],
      ["k 가 n", 100n, 100n, 7n],
      ["n 과 k 가 둘 다 0", 0n, 0n, 7n],
      ["법이 2", 5n, 2n, 2n],
      ["법이 2 이고 n 이 큼", 10_000n, 5_000n, 2n],
      ["n 이 법과 같음", 7n, 3n, 7n],
    ] as [string, bigint, bigint, bigint][]) {
      rows.push([
        `${name} — ${C(n, k, p)}`,
        num(binomialModP(n, k, p)),
        num(exactBinomial(n, k) % p),
      ]);
    }
    return md(["입력", "정본의 답", "정의대로"], rows, [1, 2]);
  },

  walkLoop: () => {
    const steps = walkSteps();
    const t = walk();
    const c = loopDigit(t);
    const at = steps.findIndex((s) => s.title.includes("j 를"));
    const rows = [
      [
        steps[at]?.id ?? "?",
        `(${c.n}, ${c.k})`,
        `② 의 ${c.n} >= ${t.p}${이가(String(t.p))} 거짓 · ③ j = min(${c.n} − ${c.k}, ${c.k}) = ${c.j}`,
        "1",
        "1",
      ],
      ...c.rounds.map((r, i) => [
        steps[at + 1 + i]?.id ?? "?",
        `(${c.n}, ${c.k})`,
        `④ i = ${r.i} — num 에 ${c.n - r.i}, den 에 ${r.i + 1n}${을를(String(r.i + 1n))} 곱한다`,
        String(r.num),
        String(r.den),
      ]),
    ];
    return md(["걸음", "호출 (n, k)", "한 일", "num", "den"], rows, [3, 4]);
  },

  symmetryCost: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [4n, 2n, 7n],
      [100_000n, 50_000n, BIG_P],
      [100_000n, 90_000n, BIG_P],
      [100_000n, 99_999n, BIG_P],
    ] as [bigint, bigint, bigint][]) {
      const a = binomialModP(n, k, p);
      const b = NO_SYMMETRY.binomialModP(n, k, p);
      rows.push([
        C(n, k, p),
        num(n - k < k ? n - k : k),
        num(k),
        a === b ? "같다" : "틀리다",
      ]);
    }
    return md(
      [
        "입력",
        "정본의 반복 min(k, n − k)",
        "줄을 바꾼 판의 반복 k",
        "두 판의 답",
      ],
      rows,
      [1, 2],
    );
  },

  walkInverse: () => {
    const t = walk();
    const c = loopDigit(t);
    const e = t.p - 2n;
    return [
      `T6  den = ${c.den}    지수 p − 2 = ${e} = ${e.toString(2)}₂`,
      ...c.invRounds.map(
        (r) =>
          `    e = ${r.e}  비트 ${r.bit}   누적 뒤 inv = ${r.inv}   제곱 뒤 b = ${r.bOut}`,
      ),
      `    inv = ${c.inv}    num · inv = ${c.num} · ${c.inv} mod ${t.p} = ${c.value}`,
    ].join("\n");
  },

  walkTrace: () => {
    const steps = walkSteps();
    const rows = steps.map((s) => [
      s.id,
      s.title,
      `${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      s.stage.vars ?? "",
    ]);
    const t = walk();
    return `${md(["걸음", "하는 일", "계산", "누적"], rows)}

${steps.length} 걸음에서 모듈러 곱셈은 ${multsOf(t)} 번이고, 돌려주는 값은 ${t.answer} 입니다.`;
  },

  walkBranches: () => {
    const steps = walkSteps();
    const ids = (pred: (title: string) => boolean) =>
      steps
        .filter((s) => pred(s.title))
        .map((s) => s.id)
        .join(" · ");
    const split = ids((x) => x.includes("떼어 낸다"));
    const join = ids((x) => x === "두 자리의 답을 곱한다");
    const edge = ids((x) => x.includes("경계"));
    const pick = ids((x) => x.includes("j 를"));
    return md(
      ["라벨", "하는 일", "전개에서"],
      [
        [
          "①",
          "경계를 거른다",
          `${split} · ${pick} 에서 거짓 · ${edge} 에서 참`,
        ],
        ["②", "자리를 떼어 낸다", `${split} 에서 가르고 ${join} 에서 곱한다`],
        ["③", "반복 횟수를 정한다", pick],
        ["④", "분자와 분모를 모은다", ids((x) => x.includes("반복 i"))],
        ["⑤", "역원을 곱한다", ids((x) => x.includes("역원"))],
      ],
    );
  },

  walkResult: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [6n, 6n, 7n],
      [4n, 2n, 7n],
    ] as [bigint, bigint, bigint][]) {
      const w = digitsOf(n, p).length;
      rows.push([
        C(n, k, p),
        num(exactBinomial(n, k) % p),
        num(binomialModP(n, k, p)),
        `${digitString(n, p)} · ${digitString(k, p, w)}`,
      ]);
    }
    return md(
      ["입력", "정의대로", "정본의 답", "7 진 자릿수 (n · k)"],
      rows,
      [1, 2],
    );
  },

  /* ── 알아 두면 좋은 개념 ── */

  kummerCarry: () => {
    const [n, k, p] = [7n, 3n, 5n];
    const kd = digitsOf(k, p);
    const rd = digitsOf(n - k, p);
    const w = digitsOf(n, p).length;
    const s0 = (kd[0] ?? 0n) + (rd[0] ?? 0n);
    return [
      `C(${n}, ${k}) mod ${p} — k 와 n − k 를 ${p} 진법으로 더한다`,
      ...aligned([
        ["k", `= ${k}`, digitString(k, p, w)],
        ["n − k", `= ${n - k}`, digitString(n - k, p, w)],
        [
          "자리 0",
          `${kd[0]} + ${rd[0]} = ${s0}`,
          s0 >= p ? `${p} 이상이라 자리올림` : "자리올림 없음",
        ],
        ["합", `= ${n}`, digitString(n, p)],
        ["정본의 답", String(binomialModP(n, k, p)), ""],
      ]),
    ].join("\n");
  },

  kummer: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [7n, 3n, 5n],
      [6n, 2n, 5n],
      [10n, 3n, 3n],
    ] as [bigint, bigint, bigint][]) {
      const kd = digitsOf(k, p);
      const rd = digitsOf(n - k, p);
      let carry = 0n;
      let carries = 0;
      for (let i = 0; i < Math.max(kd.length, rd.length); i++) {
        const sum = (kd[i] ?? 0n) + (rd[i] ?? 0n) + carry;
        carry = sum >= p ? 1n : 0n;
        if (carry === 1n) carries++;
      }
      const w = digitsOf(n, p).length;
      rows.push([
        C(n, k, p),
        digitString(k, p, w),
        digitString(n - k, p, w),
        digitString(n, p),
        String(carries),
        num(binomialModP(n, k, p)),
      ]);
    }
    return `${md(["입력", "k 의 자리", "n − k 의 자리", "n 의 자리", "자리올림 수", "정본의 답"], rows, [4, 5])}

자리올림이 0 번인 줄에서만 답이 0 이 아닙니다.`;
  },

  /* ── 경쟁 설계와의 대조 ── */

  altCounts: () => {
    const mine: Record<string, number> = cases["뤼카 정리와 페르마 역원"]();
    const rival: Record<string, number> = cases["파스칼 삼각형"]();
    const rows: string[][] = [];
    for (const key of [
      "전개 입력 모듈러 연산",
      "n=12 모듈러 연산",
      "n=13 모듈러 연산",
      "n=100,000 모듈러 연산",
      "법 101 n=7 모듈러 연산",
      "법 101 n=8 모듈러 연산",
      "n=100,000 추가 칸",
    ]) {
      const a = mine[key] ?? 0;
      const b = rival[key] ?? 0;
      rows.push([
        key,
        num(a),
        num(b),
        a === b ? "둘이 같다" : a < b ? "뤼카 정리" : "파스칼 삼각형",
      ]);
    }
    const flipBig = mine["뒤집히는 첫 n (법 10^9+7)"] ?? 0;
    const flipSmall = mine["뒤집히는 첫 n (법 101)"] ?? 0;
    return `${md(["입력", "뤼카 정리와 페르마 역원", "파스칼 삼각형", "적은 쪽"], rows, [1, 2])}

파스칼 삼각형이 더는 적지 않은 첫 n 은 법 10^9+7 에서 ${flipBig}, 법 101 에서 ${flipSmall} 입니다. 두 설계가 낸 답은 ${valuesAgree() ? "대조한 입력 모두에서 일치하고" : "대조한 입력 가운데 어긋난 것이 있고"}, 파스칼 삼각형 계수의 닫힌 형태는 ${closedFormAgrees() ? "실행한 계수와 일치합니다" : "실행한 계수와 어긋납니다"}.`;
  },

  altFormula: () => {
    const mine: Record<string, number> = cases["뤼카 정리와 페르마 역원"]();
    const rows: string[][] = [];
    for (const [p, key] of [
      [BIG_P, "뒤집히는 첫 n (법 10^9+7)"],
      [101n, "뒤집히는 첫 n (법 101)"],
    ] as [bigint, string][]) {
      const e = p - 2n;
      rows.push([
        num(p),
        String(bitLength(e)),
        String(oneBits(e)),
        String(fermatMults(p) + 1),
        String(mine[key] ?? 0),
      ]);
    }
    return md(
      [
        "법 p",
        "p − 2 의 비트 수",
        "1 인 비트 수",
        "상수 항(역원 + 마무리)",
        "뒤집히는 첫 n",
      ],
      rows,
      [1, 2, 3, 4],
    );
  },

  /* ── 수식 정의와 유도 ── */

  mathCheck: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [7n, 3n, 5n],
      [100n, 50n, 3n],
      [1_000n, 500n, 11n],
    ] as [bigint, bigint, bigint][]) {
      const nd = digitsOf(n, p);
      const kd = digitsOf(k, p);
      let prod = 1n;
      for (let i = 0; i < nd.length; i++) {
        prod = (prod * (exactBinomial(nd[i] ?? 0n, kd[i] ?? 0n) % p)) % p;
      }
      rows.push([
        C(n, k, p),
        digitString(n, p),
        digitString(k, p, nd.length),
        num(prod),
        num(exactBinomial(n, k) % p),
      ]);
    }
    return `${md(["입력", "n 의 자리", "k 의 자리", "자리별 곱", "정의대로"], rows, [3, 4])}

자릿수는 높은 자리부터 적고 짧은 쪽은 앞을 0 으로 채웠습니다. 법이 10 보다 크면 한 자리가 두 글자일 수 있어 자리를 빈칸으로 갈랐습니다.`;
  },

  mathPrime: () => {
    const p = 5n;
    const rows: string[][] = [];
    for (let i = 1n; i < p; i++) {
      rows.push([
        String(i),
        String(exactBinomial(p, i)),
        String(i * exactBinomial(p, i)),
        String(p * exactBinomial(p - 1n, i - 1n)),
        String(exactBinomial(p, i) % p),
      ]);
    }
    return md(
      ["i", "C(5, i)", "i · C(5, i)", "5 · C(4, i − 1)", "C(5, i) mod 5"],
      rows,
      [0, 1, 2, 3, 4],
    );
  },

  mathPoly: () => {
    // (1 + x)^7 의 계수와, 자리로 가른 (1 + x)^2 (1 + x^5) 의 계수를 차수마다 나란히 둔다.
    const p = 5n;
    const n = 7n;
    const nd = digitsOf(n, p);
    const n0 = nd[0] ?? 0n;
    const n1 = nd[1] ?? 0n;
    const split = new Map<bigint, bigint>();
    for (let a = 0n; a <= n0; a++) {
      for (let b = 0n; b <= n1; b++) {
        const deg = a + b * p;
        split.set(
          deg,
          (split.get(deg) ?? 0n) + exactBinomial(n0, a) * exactBinomial(n1, b),
        );
      }
    }
    const rows: string[][] = [];
    for (let d = 0n; d <= n; d++) {
      rows.push([
        String(d),
        String(exactBinomial(n, d)),
        String(exactBinomial(n, d) % p),
        String(split.get(d) ?? 0n),
      ]);
    }
    return md(
      [
        "x 의 차수",
        "(1 + x)^7 의 계수",
        "그 계수 mod 5",
        "(1 + x)^2 (1 + x^5) 의 계수",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },

  nonzeroCount: () => {
    const rows: string[][] = [];
    for (const [n, p] of [
      [34n, 7n],
      [100n, 3n],
      [1_000n, 11n],
      [4_095n, 2n],
      [100_000n, 2n],
    ] as [bigint, bigint][]) {
      let closed = 1n;
      for (const d of digitsOf(n, p)) closed *= d + 1n;
      let counted = 0n;
      for (let k = 0n; k <= n; k++) {
        if (binomialModP(n, k, p) !== 0n) counted++;
      }
      rows.push([num(n), num(p), digitString(n, p), num(closed), num(counted)]);
    }
    return `${md(["n", "법 p", "p 진 자릿수", "(n_i + 1) 의 곱", "실제로 0 이 아닌 k 의 수"], rows, [0, 1, 3, 4])}

넷째 칸은 자릿수만 보고 낸 값이고 다섯째 칸은 k 를 0 부터 n 까지 전부 넣어 센 값입니다.`;
  },

  /* ── 불변식 ── */

  invariantStates: () => {
    const t = walk();
    const c = loopDigit(t);
    const steps = walkSteps();
    const at = steps.findIndex((s) => s.title.includes("j 를"));
    const rows: string[][] = [
      [steps[at]?.id ?? "?", "반복 직전", "1", "1", "1", "1", "없다"],
    ];
    let fall = 1n;
    let fact = 1n;
    for (const [i, r] of c.rounds.entries()) {
      fall *= c.n - r.i;
      fact *= r.i + 1n;
      rows.push([
        steps[at + 1 + i]?.id ?? "?",
        `i = ${r.i} 까지`,
        String(r.num),
        String(fall % t.p),
        String(r.den),
        String(fact % t.p),
        r.num === 0n || r.den === 0n ? "있다" : "없다",
      ]);
    }
    return `${md(
      [
        "걸음",
        "마친 반복",
        "num",
        "내림차순 곱 mod p",
        "den",
        "i! mod p",
        "0 인 값",
      ],
      rows,
      [2, 3, 4, 5],
    )}

${rows.length} 시점 모두 호출의 n = ${c.n}${이가(String(c.n))} p = ${t.p} 보다 작고, num 과 den 이 정의대로의 값과 같으며 0 이 아닙니다.`;
  },

  mutantNoSplit: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [10n, 3n, 7n],
      [6n, 3n, 7n],
    ] as [bigint, bigint, bigint][]) {
      const a = binomialModP(n, k, p);
      const b = WIDE_SPLIT.binomialModP(n, k, p);
      rows.push([
        C(n, k, p),
        num(a),
        num(b),
        num(exactBinomial(n, k) % p),
        a === b ? "같다" : "틀리다",
      ]);
    }
    return md(
      ["입력", "정본의 답", "판정을 넓힌 판", "정의대로", "판정"],
      rows,
      [1, 2, 3],
    );
  },

  /* ── 비용 계산 ── */

  perfCount: () => {
    const t = walk();
    const steps = walkSteps();
    const c = loopDigit(t);
    const inv = c.invRounds.reduce((m, r) => m + 1 + r.bit, 0);
    const byTitle = (f: (x: string) => boolean) =>
      steps.filter((s) => f(s.title)).map((s) => s.id);
    const loops = byTitle((x) => x.includes("반복 i"));
    const rows = [
      ["자리를 뗀다", byTitle((x) => x.includes("떼어 낸다")).join(" · "), "0"],
      ["경계로 끝난 자리", byTitle((x) => x.includes("경계")).join(" · "), "0"],
      ["j 를 정한다", byTitle((x) => x.includes("j 를")).join(" · "), "0"],
      ["반복", loops.join(" · "), String(2 * loops.length)],
      [
        "역원과 마무리 곱셈",
        byTitle((x) => x.includes("역원")).join(" · "),
        `${inv} + 1`,
      ],
      [
        "두 자리를 잇는다",
        byTitle((x) => x === "두 자리의 답을 곱한다").join(" · "),
        "1",
      ],
    ];
    return `${md(["무리", "걸음", "모듈러 곱셈"], rows)}

합하면 ${multsOf(t)} 번이고, 경쟁 설계 대조 표의 전개 입력 칸과 같은 값입니다.`;
  },

  perfTotal: () => {
    const rows: string[][] = [];
    for (const [n, k, p] of [
      [WALK_N, WALK_K, WALK_P],
      [LIMIT_N, LIMIT_N / 2n, BIG_P],
      [LIMIT_N, LIMIT_N / 2n, 11n],
    ] as [bigint, bigint, bigint][]) {
      const t = trace(n, k, p);
      const loops = t.digits.filter((c) => c.kind === "loop").length;
      const j = t.digits.reduce(
        (m, c) => m + (c.kind === "loop" ? c.rounds.length : 0),
        0,
      );
      const formula =
        2 * j + loops * (fermatMults(p) + 1) + (t.digits.length - 1);
      rows.push([
        C(n, k, p),
        String(t.digits.length),
        String(loops),
        num(j),
        String(fermatMults(p)),
        num(formula),
        num(multsOf(t)),
      ]);
    }
    const top = (BIG_P - 1n) * (BIG_P - 1n);
    return `${md(
      ["입력", "d", "반복한 자리", "Σ j", "역원 한 번", "총식", "실측"],
      rows,
      [1, 2, 3, 4, 5, 6],
    )}

법이 ${num(BIG_P)} 일 때 가장 큰 중간 곱 (p − 1)² 은 ${num(top)} 이고 ${bitLength(top)} 비트라 64 비트 정수 하나에 들어갑니다.`;
  },

  perfBound: () => {
    const rows: string[][] = [];
    let ok = 0;
    const inputs: [bigint, bigint, bigint][] = [
      [WALK_N, WALK_K, WALK_P],
      [LIMIT_N, LIMIT_N / 2n, BIG_P],
      [LIMIT_N, 1n, BIG_P],
      [LIMIT_N, LIMIT_N / 2n, 11n],
      [LIMIT_N, LIMIT_N / 2n, 2n],
      [1_000n, 500n, 101n],
    ];
    for (const [n, k, p] of inputs) {
      const t = trace(n, k, p);
      const d = BigInt(t.digits.length);
      const lg = BigInt(bitLength(p));
      const bound = n + d * (2n * lg + 2n);
      const got = BigInt(multsOf(t));
      if (got <= bound) ok++;
      rows.push([C(n, k, p), num(d), num(got), num(bound)]);
    }
    return `${md(["입력", "d", "실측 모듈러 곱셈", "상한 n + d(2 · (p 의 비트 수) + 2)"], rows, [1, 2, 3])}

${inputs.length} 입력 가운데 실측이 상한 안에 든 것은 ${ok} 개입니다.`;
  },

  shapeValues: () => {
    const rows: string[][] = [];
    for (const [name, n, k, p] of [
      ["법이 커서 자리 하나 · k 가 가운데", LIMIT_N, LIMIT_N / 2n, BIG_P],
      ["법이 커서 자리 하나 · k 가 끝", LIMIT_N, 1n, BIG_P],
      ["법이 작아 자리 다섯", LIMIT_N, LIMIT_N / 2n, 11n],
      ["법이 2 라 자리 열일곱", LIMIT_N, LIMIT_N / 2n, 2n],
      ["n 을 법 바로 아래까지 키운 모양", BIG_P - 1n, (BIG_P - 1n) / 2n, BIG_P],
    ] as [string, bigint, bigint, bigint][]) {
      rows.push([
        name,
        num(n),
        num(k),
        num(p),
        num(digitsOf(n, p).length),
        num(loopTotal(n, k, p)),
      ]);
    }
    return `${md(["입력 모양", "n", "k", "법 p", "자릿수 개수", "반복 총 횟수"], rows, [1, 2, 3, 4, 5])}

같은 n = ${num(LIMIT_N)} 에서 반복 총 횟수가 ${rows[0]?.[5]} 번부터 ${rows[3]?.[5]} 번까지 갈립니다.`;
  },

  /* ── 스스로 점검하기 ── */

  selfcheckMod11: () => {
    const p = 11n;
    const other = trace(4n, 2n, p).root;
    if (other.kind !== "loop")
      throw new Error("C(4, 2) mod 11 은 자리 하나에서 반복한다");
    const mine = loopDigit(walk());
    const row = (q: bigint, c: typeof mine) => [
      String(q),
      String(c.num),
      String(c.den),
      String(c.inv),
      String((c.den * c.inv) % q),
      String(c.value),
    ];
    const exact = exactBinomial(4n, 2n);
    return `${md(
      ["법", "num", "den", "inv", "den · inv mod p", "자리의 답"],
      [row(WALK_P, mine), row(p, other)],
      [0, 1, 2, 3, 4, 5],
    )}

법 ${p} 에서 inv 는 ${other.den}^${p - 2n} mod ${p} = ${other.inv} 이고 자리의 답은 ${other.num} · ${other.inv} mod ${p} = ${other.value} 입니다. C(4, 2) = ${exact}${이가(String(exact))} 두 법보다 작아서 두 법의 답이 같습니다.`;
  },
};
