/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/binomialModP/binomialModP-guide.md
 *
 * **세는 사본이 셋 있다**(`trace`·`noSplit`·`divideInstead`). 정본은 걸음마다의 상태도
 * 반복 횟수도 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표에서 「정본」 칸은 전부 정본이나
 * 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 경쟁 설계 대조 표는 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  cases,
  closedFormAgrees,
  valuesAgree,
} from "./binomialModP-guide.alt.ts";
import { binomialModP } from "./binomialModP-guide.ref.ts";

const REF = new URL("./binomialModP-guide.ref.ts", import.meta.url).pathname;

/** 본문 전개가 쓰는 고정 입력. */
const WN = 34n;
const WK = 20n;
const WP = 7n;

/** 제약 규모의 법. */
const BIG_P = 1_000_000_007n;

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

/* ────────────────────── 정의대로의 값과 자릿수 ────────────────────── */

/** 나머지를 한 번도 쓰지 않고 큰 정수로 그대로 계산한 이항 계수. */
function exactBinomial(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  const j = n - k < k ? n - k : k;
  let r = 1n;
  for (let i = 0n; i < j; i++) r = (r * (n - i)) / (i + 1n);
  return r;
}

/** `n!` 의 십진 자릿수. 값을 만들지 않고 로그 합으로 센다. */
function factorialDigits(n: number): number {
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log10(i);
  return Math.floor(s) + 1;
}

/** `C(n, k)` 의 십진 자릿수. */
function binomialDigits(n: number, k: number): number {
  const j = Math.min(k, n - k);
  let s = 0;
  for (let i = 0; i < j; i++) s += Math.log10(n - i) - Math.log10(i + 1);
  return Math.floor(s) + 1;
}

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

/** `p` 진 자릿수를 낮은 자리부터 담아 돌려준다. */
function digitsOf(v: bigint, p: bigint): bigint[] {
  const out: bigint[] = [];
  let x = v;
  while (x > 0n) {
    out.push(x % p);
    x /= p;
  }
  return out.length > 0 ? out : [0n];
}

/** 높은 자리부터 이어 붙인 문자열. `width` 를 주면 앞을 0 으로 채운다. */
/**
 * 자릿수를 높은 자리부터 적는다. `width` 는 **글자 수가 아니라 자리 수**다.
 *
 * **법이 10 보다 크면 자리를 빈칸으로 가른다.** 한 자리가 두 글자가 될 수 있어서
 * 그냥 이으면 자리 경계가 사라진다 — `p = 11` 에서 1,000 은 자리 셋(8 · 2 · 10)인데
 * 이어 붙이면 `8210` 이 되어 자리 넷으로 읽히고, 그 넷으로 뤼카 정리를 적용하면
 * 표에 적힌 답과 다른 값이 나온다.
 */
const digitString = (v: bigint, p: bigint, width = 0): string => {
  const ds = digitsOf(v, p).reverse();
  while (ds.length < width) ds.unshift(0n);
  return p > 10n ? ds.join(" ") : ds.join("");
};

/** 페르마 지수로 얻는 역원. */
function modInverse(a: bigint, p: bigint): bigint {
  let inv = 1n;
  let b = ((a % p) + p) % p;
  let e = p - 2n;
  while (e > 0n) {
    if ((e & 1n) === 1n) inv = (inv * b) % p;
    b = (b * b) % p;
    e >>= 1n;
  }
  return inv;
}

/** 페르마 거듭제곱이 쓰는 모듈러 곱셈 횟수 — 비트 수와 1 인 비트 수의 합이다. */
function fermatMults(p: bigint): number {
  let e = p - 2n;
  let m = 0;
  while (e > 0n) {
    if ((e & 1n) === 1n) m++;
    m++;
    e >>= 1n;
  }
  return m;
}

/** 곱셈·나눗셈에 들어간 두 피연산자의 자릿수를 곱해 더한 값. */
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
  let num = 1n;
  let den = 1n;
  for (let i = 0n; i < j; i++) {
    work += num.toString().length * (n - i).toString().length;
    num = (num * (n - i)) % p;
    work += den.toString().length * (i + 1n).toString().length;
    den = (den * (i + 1n)) % p;
  }
  return work;
}

/** 자리마다의 반복 횟수를 실제로 반복하지 않고 더한다. */
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

/* ────────────────────── 세는 사본 셋 ────────────────────── */

interface Step {
  place: string;
  branch: string;
  j: string;
  num: string;
  den: string;
  inv: string;
  answer: string;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function trace(n: bigint, k: bigint, p: bigint): Step[] {
  const steps: Step[] = [];
  const blank = { j: "—", num: "—", den: "—", inv: "—" };
  const rec = (a: bigint, b: bigint): bigint => {
    const place = `n = ${a}, k = ${b}`;
    if (b < 0n || b > a) {
      steps.push({ place, branch: "①", ...blank, answer: "0" });
      return 0n;
    }
    if (b === 0n || b === a) {
      steps.push({ place, branch: "①", ...blank, answer: "1" });
      return 1n;
    }
    if (a >= p) {
      steps.push({ place, branch: "②", ...blank, answer: "나중에" });
      const lo = rec(a % p, b % p);
      const hi = rec(a / p, b / p);
      const v = (lo * hi) % p;
      steps.push({
        place,
        branch: "②",
        ...blank,
        answer: `${lo} × ${hi} → ${v}`,
      });
      return v;
    }
    const j = a - b < b ? a - b : b;
    let num = 1n;
    let den = 1n;
    steps.push({
      place,
      branch: "③",
      j: `${j}`,
      num: "1",
      den: "1",
      inv: "—",
      answer: "아직",
    });
    for (let i = 0n; i < j; i++) {
      num = (num * (a - i)) % p;
      den = (den * (i + 1n)) % p;
      steps.push({
        place,
        branch: "④",
        j: `${j}`,
        num: `${num}`,
        den: `${den}`,
        inv: "—",
        answer: "아직",
      });
    }
    const inv = modInverse(den, p);
    const v = (num * inv) % p;
    steps.push({
      place,
      branch: "⑤",
      j: `${j}`,
      num: `${num}`,
      den: `${den}`,
      inv: `${inv}`,
      answer: `${v}`,
    });
    return v;
  };
  rec(n, k);
  return steps;
}

/** 자릿수를 안 떼고 곱셈 꼴로만 계산하는 사본. */
function noSplit(n: bigint, k: bigint, p: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  if (k === 0n || k === n) return 1n;
  const j = n - k < k ? n - k : k;
  let num = 1n;
  let den = 1n;
  for (let i = 0n; i < j; i++) {
    num = (num * (n - i)) % p;
    den = (den * (i + 1n)) % p;
  }
  return (num * modInverse(den, p)) % p;
}

/** 역원 대신 정수 나눗셈을 쓰는 사본. */
function divideInstead(
  n: bigint,
  k: bigint,
  p: bigint,
): { num: bigint; den: bigint; value: bigint } {
  const j = n - k < k ? n - k : k;
  let num = 1n;
  let den = 1n;
  for (let i = 0n; i < j; i++) {
    num = (num * (n - i)) % p;
    den = (den * (i + 1n)) % p;
  }
  return { num, den, value: den === 0n ? -1n : (num / den) % p };
}

/* ────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────── */

type Ref = { binomialModP: (n: bigint, k: bigint, p: bigint) => bigint };

/**
 * 자릿수를 떼어 낼지 판정하는 줄의 오른쪽을 `p` 에서 `p * p` 로 키운 판. 불변식
 * 「④ 의 반복에 들어가는 호출은 언제나 작은 쪽이 법보다 아래다」를 지키던 바로 그 줄이다.
 */
const NO_SPLIT_TABLE = await (async (): Promise<string> => {
  const mut = await loadMutant<Ref>(REF, {
    swap: [/^ {2}if \(n >= p\) \{$/, "  if (n >= p * p) {"],
  });
  const rows: string[][] = [["입력", "정본", "판정을 넓힌 판", "정의대로"]];
  for (const [n, k, p] of [
    [34n, 20n, 7n],
    [15n, 7n, 7n],
    [10n, 3n, 7n],
    [6n, 3n, 7n],
  ] as [bigint, bigint, bigint][]) {
    rows.push([
      `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
      comma(binomialModP(n, k, p)),
      comma(mut.binomialModP(n, k, p)),
      comma(exactBinomial(n, k) % p),
    ]);
  }
  return `${table(rows, [1, 2, 3]).join("\n")}
        └ 아래 두 줄은 두 판이 같다. 분자에도 분모에도 7 의 배수가 안 들어가
          불변식이 안 깨진 입력이다`;
})();

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 정의대로 큰 정수로 계산하면 자릿수가 얼마나 되는가. */
  "naive-scale": () => {
    const cap = bigintBitCap();
    const rows: string[][] = [
      ["n", "C(n, n/2) 자릿수", "n! 자릿수", "법 10^9+7 로 줄이면"],
    ];
    for (const n of [10, 100, 1_000, 10_000, 100_000]) {
      rows.push([
        comma(n),
        comma(binomialDigits(n, n / 2)),
        comma(factorialDigits(n)),
        "10",
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 이 런타임이 만들 수 있는 정수는 ${comma(cap.bits)} 비트, 십진 ${comma(cap.digits)} 자리까지다.
          100,000! 은 ${comma(factorialDigits(100_000))} 자리라 그 상한 밖이고 값을 만들지도 못한다`;
  },

  /** 곱셈에 들어간 자릿수의 합 — 큰 정수 그대로 대 법으로 줄임. */
  "mod-cost": () => {
    const rows: string[][] = [
      ["n (k = n/2)", "큰 정수 그대로", "법으로 줄이며", "중간값 최대 자릿수"],
    ];
    for (const n of [10n, 100n, 1_000n, 2_000n]) {
      const k = n / 2n;
      rows.push([
        comma(n),
        comma(digitWork(n, k, null)),
        comma(digitWork(n, k, BIG_P)),
        `${comma(binomialDigits(Number(n), Number(k)))} 대 10`,
      ]);
    }
    return `${table(rows, [0, 1, 2]).join("\n")}
        └ 재는 것은 곱셈·나눗셈마다 두 피연산자의 자릿수를 곱해 더한 값이다.
          연산 횟수는 두 방식이 같고 갈리는 것은 피연산자의 크기 하나다`;
  },

  /** 역원을 1 부터 훑는 방법과 페르마 거듭제곱. */
  "inverse-cost": () => {
    const rows: string[][] = [
      [
        "법 p",
        "2 의 역원",
        "1 부터 차례로 넣으면 시도",
        "페르마 거듭제곱 곱셈",
      ],
    ];
    for (const p of [7n, 101n, 1_000_003n, BIG_P]) {
      const inv = modInverse(2n, p);
      rows.push([comma(p), comma(inv), comma(inv), comma(fermatMults(p))]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 차례로 넣는 방법은 x = 1, 2, 3, … 을 순서대로 시험하므로 시도 횟수가 곧 역원 자신이다.
          페르마 쪽은 지수 p - 2 의 비트 수와 1 인 비트 수의 합이다`;
  },

  /** 자릿수를 안 떼면 어디서 틀리는가. */
  "lucas-need": () => {
    const rows: string[][] = [
      ["입력", "정의대로", "정본", "자리를 안 가른 판"],
    ];
    for (const [n, k, p] of [
      [10n, 3n, 7n],
      [6n, 3n, 7n],
      [15n, 7n, 7n],
      [34n, 20n, 7n],
      [100n, 50n, BIG_P],
    ] as [bigint, bigint, bigint][]) {
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        comma(exactBinomial(n, k) % p),
        comma(binomialModP(n, k, p)),
        comma(noSplit(n, k, p)),
      ]);
    }
    return `${table(rows, [1, 2, 3]).join("\n")}
        └ 위 둘과 맨 아래는 두 판이 같은 값을 낸다 — 분자에도 분모에도 p 의 배수가
          안 들어간 입력이다. 가운데 둘에서만 갈린다`;
  },

  /** 전개 입력을 처음부터 끝까지 실행한 걸음별 상태. */
  "walk-trace": () => {
    const steps = trace(WN, WK, WP);
    const rows: string[][] = [
      [
        "걸음",
        "지금 푸는 자리",
        "갈래",
        "j",
        "num",
        "den",
        "inv",
        "이 자리의 답",
      ],
    ];
    for (const [index, s] of steps.entries()) {
      rows.push([
        `T${index + 1}`,
        s.place,
        s.branch,
        s.j,
        s.num,
        s.den,
        s.inv,
        s.answer,
      ]);
    }
    return `${table(rows, [3, 4, 5, 6]).join("\n")}
        └ 갈래 다섯이 전부 실행됐다. 반복은 두 번이고 나머지 갈래는 자리마다 한 번이다`;
  },

  /** 전체 코드를 네 입력에 실행한 결과. */
  "walk-result": () => {
    const rows: string[][] = [
      ["입력", "정의대로", "정본", "7 진 자릿수 (n · k)"],
    ];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [6n, 6n, 7n],
      [4n, 2n, 7n],
    ] as [bigint, bigint, bigint][]) {
      const w = digitsOf(n, p).length;
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        comma(exactBinomial(n, k) % p),
        comma(binomialModP(n, k, p)),
        `${digitString(n, p)} · ${digitString(k, p, w)}`,
      ]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 대칭성 줄을 빼면 답은 같고 반복 횟수만 갈린다. */
  "symmetry-cost": () => {
    const rows: string[][] = [
      ["입력", "정본 반복", "대칭성 줄을 뺀 판 반복", "두 판의 답"],
    ];
    for (const [n, k, p] of [
      [4n, 2n, 7n],
      [100_000n, 50_000n, BIG_P],
      [100_000n, 90_000n, BIG_P],
      [100_000n, 99_999n, BIG_P],
    ] as [bigint, bigint, bigint][]) {
      const same = binomialModP(n, k, p) === binomialModP(n, n - k, p);
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        comma(n - k < k ? n - k : k),
        comma(k),
        same ? "같다" : "다르다",
      ]);
    }
    return `${table(rows, [1, 2]).join("\n")}
        └ 첫 줄은 전개가 자릿수를 뗀 뒤 실제로 푸는 자리다.
          맨 아래가 1 번과 99,999 번으로 99,998 번 차이다`;
  },

  /** 역원 대신 정수 나눗셈을 쓰면. */
  "divide-instead": () => {
    const rows: string[][] = [
      ["입력", "num", "den", "정수 나눗셈 판", "정본", "정의대로"],
    ];
    for (const [n, k, p] of [
      [4n, 2n, 7n],
      [5n, 2n, 7n],
      [6n, 3n, 7n],
      [20n, 10n, BIG_P],
    ] as [bigint, bigint, bigint][]) {
      const d = divideInstead(n, k, p);
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        comma(d.num),
        comma(d.den),
        comma(d.value),
        comma(binomialModP(n, k, p)),
        comma(exactBinomial(n, k) % p),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5]).join("\n")}
        └ 둘째 줄만 두 판이 같은 값을 낸다 — num 이 den 으로 나누어떨어진 자리다`;
  },

  /** 자릿수를 떼는 판정을 넓힌 변이. */
  "mutant-no-split": () => NO_SPLIT_TABLE,

  /** 경계 입력들. */
  "edge-values": () => {
    const rows: string[][] = [["입력", "정본", "정의대로"]];
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
        `${name} — C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        comma(binomialModP(n, k, p)),
        comma(exactBinomial(n, k) % p),
      ]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 자릿수 분해 검산 — 자리별 곱이 정의대로의 값과 같은가. */
  "math-check": () => {
    const rows: string[][] = [
      ["입력", "n 의 자릿수", "k 의 자릿수", "자리별 곱", "정의대로"],
    ];
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
      const w = digitsOf(n, p).length;
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        digitString(n, p),
        digitString(k, p, w),
        comma(prod),
        comma(exactBinomial(n, k) % p),
      ]);
    }
    return `${table(rows, [3, 4]).join("\n")}
        └ 자릿수는 높은 자리부터 적고 짧은 쪽은 앞을 0 으로 채웠다.
          법이 10 보다 크면 한 자리가 두 글자일 수 있어 자리를 빈칸으로 갈랐다.
          넷째 칸과 다섯째 칸이 다섯 줄 내내 같다`;
  },

  /** 0 이 아닌 k 의 개수 — 자릿수 표현이 정하는 닫힌 형태. */
  "nonzero-count": () => {
    const rows: string[][] = [
      [
        "n",
        "법 p",
        "p 진 자릿수",
        "(n_i + 1) 의 곱",
        "실제로 0 이 아닌 k 의 수",
      ],
    ];
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
      rows.push([
        comma(n),
        comma(p),
        digitString(n, p),
        comma(closed),
        comma(counted),
      ]);
    }
    return `${table(rows, [0, 1, 3, 4]).join("\n")}
        └ 넷째 칸은 자릿수만 보고 낸 값이고 다섯째 칸은 k 를 0 부터 n 까지 전부 넣어 센 값이다`;
  },

  /** 자리올림과 0 — 쿠머 정리가 말하는 대응. */
  kummer: () => {
    const rows: string[][] = [
      [
        "입력",
        "k 의 자릿수",
        "n-k 의 자릿수",
        "n 의 자릿수",
        "자리올림",
        "정본",
      ],
    ];
    for (const [n, k, p] of [
      [34n, 20n, 7n],
      [15n, 7n, 7n],
      [7n, 3n, 5n],
      [6n, 2n, 5n],
      [10n, 3n, 3n],
    ] as [bigint, bigint, bigint][]) {
      const kd = digitsOf(k, p);
      const md = digitsOf(n - k, p);
      let carry = 0n;
      let carries = 0;
      for (let i = 0; i < Math.max(kd.length, md.length); i++) {
        const s = (kd[i] ?? 0n) + (md[i] ?? 0n) + carry;
        carry = s >= p ? 1n : 0n;
        if (carry === 1n) carries++;
      }
      const w = digitsOf(n, p).length;
      rows.push([
        `C(${comma(n)}, ${comma(k)}) mod ${comma(p)}`,
        digitString(k, p, w),
        digitString(n - k, p, w),
        digitString(n, p),
        `${carries} 번`,
        comma(binomialModP(n, k, p)),
      ]);
    }
    return `${table(rows, [5]).join("\n")}
        └ 둘째 칸과 셋째 칸을 p 진법으로 더하면 넷째 칸이 된다.
          자리올림이 0 번인 줄에서만 답이 0 이 아니다`;
  },

  /** 두 설계의 기본 연산 수와 저장 칸. */
  "alt-counts": () => {
    const mine: Record<string, number> = cases["자릿수 분해와 페르마 역원"]();
    const rival: Record<string, number> = cases["파스칼 삼각형"]();
    const rows: string[][] = [
      ["입력", "이 글의 절차", "파스칼 삼각형", "적은 쪽"],
    ];
    for (const key of [
      "전개 입력 기본 연산",
      "n=12 기본 연산",
      "n=13 기본 연산",
      "n=100,000 기본 연산",
      "법 101 n=7 기본 연산",
      "법 101 n=8 기본 연산",
      "n=100,000 저장 칸",
    ]) {
      const a = mine[key] ?? 0;
      const b = rival[key] ?? 0;
      rows.push([
        key,
        comma(a),
        comma(b),
        a === b ? "같다" : a < b ? "이 글의 절차" : "파스칼 삼각형",
      ]);
    }
    const flipBig = mine["뒤집히는 첫 n (법 10^9+7)"] ?? 0;
    const flipSmall = mine["뒤집히는 첫 n (법 101)"] ?? 0;
    return `${table(rows, [1, 2]).join("\n")}
        └ 파스칼이 더는 적지 않은 첫 n 은 법 10^9+7 에서 ${comma(flipBig)}, 법 101 에서 ${comma(flipSmall)} 이다.
          두 설계가 같은 답을 내는가: ${valuesAgree() ? "그렇다" : "아니다"}.
          파스칼 계수의 닫힌 형태가 실행과 같은가: ${closedFormAgrees() ? "그렇다" : "아니다"}`;
  },

  /** 같은 n 에서 법만 바꿔 자릿수 개수와 반복 총 횟수를 잰다. */
  "concept-gain": () => {
    const n = 100_000n;
    const k = 50_000n;
    const rows: string[][] = [
      ["법 p", "자릿수 개수", "자리마다의 반복", "반복 총 횟수"],
    ];
    for (const p of [BIG_P, 100_003n, 101n, 11n, 2n]) {
      const per: string[] = [];
      const walk = (a: bigint, b: bigint): void => {
        if (b < 0n || b > a || b === 0n || b === a) {
          per.push("0");
          return;
        }
        if (a >= p) {
          walk(a % p, b % p);
          walk(a / p, b / p);
          return;
        }
        per.push(comma(a - b < b ? a - b : b));
      };
      walk(n, k);
      rows.push([
        comma(p),
        comma(digitsOf(n, p).length),
        per.reverse().join(" "),
        comma(loopTotal(n, k, p)),
      ]);
    }
    return `${table(rows, [0, 1, 3]).join("\n")}
        └ n 은 100,000, k 는 50,000 으로 고정하고 법만 바꿨다.
          셋째 칸은 높은 자리부터 적은 자리별 반복 횟수다`;
  },

  /** 최악을 만드는 입력 — 자릿수 개수와 자리마다의 반복 횟수. */
  "shape-values": () => {
    const rows: string[][] = [
      ["입력 모양", "n", "k", "법 p", "자릿수 개수", "반복 총 횟수"],
    ];
    for (const [name, n, k, p] of [
      ["법이 커서 자리 하나 · k 가 가운데", 100_000n, 50_000n, BIG_P],
      ["법이 커서 자리 하나 · k 가 끝", 100_000n, 1n, BIG_P],
      ["법이 작아 자리 다섯", 100_000n, 50_000n, 11n],
      ["법이 작아 자리 열일곱", 100_000n, 50_000n, 2n],
      ["n 을 법 바로 아래까지 키운 최악", BIG_P - 1n, (BIG_P - 1n) / 2n, BIG_P],
    ] as [string, bigint, bigint, bigint][]) {
      rows.push([
        name,
        comma(n),
        comma(k),
        comma(p),
        comma(digitsOf(n, p).length),
        comma(loopTotal(n, k, p)),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5]).join("\n")}
        └ 자릿수가 늘면 자리 하나가 담는 값이 법 아래로 줄어 반복도 함께 줄어든다.
          최악은 자리가 하나이면서 그 자리의 k 가 가운데인 입력이고, 그 반복 횟수는 법이 정한다`;
  },
};
