/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md
 *
 * **세는 사본이 둘 있다**(`trace`·`countDivs`). 정본은 걸음마다의 상태도 나눗셈 횟수도
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **판정이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표에서 「정본」 칸은 전부 정본이나 정본에서 기계로 만든
 * 변이가 낸 값이다.
 *
 * 경쟁 설계 대조 표는 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  cases,
  LARGEST_PRIME_AT,
  lastAhead,
  nextPrime,
  SWEEP_LIMIT,
  verdictsAgree,
} from "./isPrimeTrial-guide.alt.ts";
import { isPrimeTrial } from "./isPrimeTrial-guide.ref.ts";

const REF = new URL("./isPrimeTrial-guide.ref.ts", import.meta.url).pathname;

/** 본문 전개가 쓰는 고정 입력. */
const WALK = 187;

/** 계약이 권장하는 상한 `10^12` 아래의 가장 큰 소수 — 이 절차의 최악 입력이다. */
const WORST = LARGEST_PRIME_AT["10^12"] as number;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number): string => n.toLocaleString("en-US");

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

/* ────────────────────── 세는 자리 ────────────────────── */

/** 2 이상인 가장 작은 약수. 소수이거나 2 보다 작으면 `-1`. */
function smallestFactor(n: number): number {
  if (n < 4) return -1;
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
  return -1;
}

/** `M` 과 서로소인 나머지에서 만든 후보 간격. `M = 1` 이면 1 씩 는다. */
function wheelSteps(M: number): number[] {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const res: number[] = [];
  for (let r = 1; r <= M; r++) if (gcd(r, M) === 1) res.push(r);
  return res.map(
    (r, i) =>
      (res[(i + 1) % res.length] as number) +
      (i + 1 === res.length ? M : 0) -
      r,
  );
}

/** 기약분수 문자열. 후보 밀도를 약분해서 적는다. */
function reduce(a: number, b: number): string {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(a, b);
  return `${a / g}/${b / g}`;
}

/** `M` 을 나누는 소수들 — 사전 판정에서 한 번씩 나눠 본다. */
function wheelPrimes(M: number): number[] {
  const out: number[] = [];
  let x = M;
  for (let p = 2; p <= x; p++) {
    if (x % p !== 0) continue;
    out.push(p);
    while (x % p === 0) x /= p;
  }
  return out;
}

/**
 * 바퀴 `M` 으로 만든 후보를 `√n` 까지 시도할 때의 **나눗셈 횟수**.
 *
 * 사전 판정의 나눗셈도 함께 센다 — 두 판이 같은 단위를 써야 표가 뜻을 갖는다.
 * `M = 6` 이 정본과 같은 절차다.
 */
function countDivs(n: number, M: number): number {
  const primes = wheelPrimes(M);
  if (n < 2) return 0;
  if (primes.includes(n)) return 0;
  let divs = 0;
  for (const p of primes) {
    divs++;
    if (n % p === 0) return divs;
  }
  const steps = wheelSteps(M);
  let d = M === 1 ? 2 : (primes[primes.length - 1] as number) + 2;
  // 첫 후보는 M 과 서로소인 수 중 M 보다 큰 첫째다. M = 6 이면 5, M = 30 이면 7 이다.
  if (M > 1) {
    d = 1;
    let i = 0;
    while (d <= (primes[primes.length - 1] as number)) {
      d += steps[i % steps.length] as number;
      i++;
    }
    let idx = i;
    while (d * d <= n) {
      divs++;
      if (n % d === 0) return divs;
      d += steps[idx % steps.length] as number;
      idx++;
    }
    return divs;
  }
  while (d * d <= n) {
    divs++;
    if (n % d === 0) return divs;
    d += 1;
  }
  return divs;
}

/**
 * 2 부터 `n - 1` 까지 전부 나눌 때의 나눗셈 횟수. **실행하지 않고 센다** — 제약 상한에서
 * 10^12 번이라 재는 데만 몇 분이 걸린다.
 */
function naiveDivs(n: number): number {
  const f = smallestFactor(n);
  return f === -1 ? n - 2 : f - 1;
}

/**
 * `naiveDivs` 가 실제 실행과 같은 값을 내는가 — `n` = 4…3,000 전수 대조. 같은 바퀴에서
 * 세는 판정이 정본과 어긋나지 않는지도 함께 본다.
 */
function countsAgree(): boolean {
  for (let n = 4; n <= 3_000; n++) {
    let real = 0;
    let composite = false;
    for (let d = 2; d < n; d++) {
      real++;
      if (n % d === 0) {
        composite = true;
        break;
      }
    }
    if (real !== naiveDivs(n)) return false;
    if (composite === isPrimeTrial(n)) return false;
    // 바퀴 넷이 다 같은 판정을 내는가 — 약수를 찾고 멈췄으면 합성수다.
    for (const M of [1, 2, 6, 30]) {
      const stopped = n % 2 === 0 || n % 3 === 0 ? composite : false;
      if (stopped && countDivs(n, M) === 0) return false;
    }
  }
  return true;
}

/** 후보 개수의 닫힌 형태 — `x` 이하의 `6k±1` 후보 수(5 부터 센다). */
function candidateCount(x: number): number {
  return Math.floor((x + 1) / 6) + Math.floor((x - 1) / 6);
}

/** 그 값을 실제로 세어 본 것. */
function candidateCountByLoop(x: number): number {
  let c = 0;
  let d = 5;
  let step = 2;
  while (d <= x) {
    c++;
    d += step;
    step = 6 - step;
  }
  return c;
}

/** 총식 — 소수면 `2C + 3`, 합성수면 가장 작은 약수에서 멈춘다. */
function opsByFormula(n: number): number {
  const root = Math.floor(Math.sqrt(n));
  const f = smallestFactor(n);
  if (f === -1) return 2 * candidateCount(root) + 3;
  return 2 + 2 * candidateCount(f);
}

/** 정본과 같은 절차에 기본 연산 계수만 덧붙인 사본. */
function opsByRun(n: number): number {
  let ops = 0;
  if (n < 2) return ops;
  if (n === 2 || n === 3) return ops;
  ops += 1;
  if (n % 2 === 0) return ops;
  ops += 1;
  if (n % 3 === 0) return ops;
  let d = 5;
  let step = 2;
  for (;;) {
    ops += 1;
    if (d * d > n) return ops;
    ops += 1;
    if (n % d === 0) return ops;
    d += step;
    step = 6 - step;
  }
}

/* ────────────────────── 세는 사본 — 걸음마다의 상태 ────────────────────── */

interface Step {
  branch: string;
  d: string;
  step: string;
  dd: string;
  mod: string;
  next: string;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function trace(n: number): Step[] {
  const steps: Step[] = [];
  const blank = { d: "—", step: "—", dd: "—", mod: "—", next: "—" };
  if (n < 2) {
    steps.push({ branch: "①", ...blank });
    return steps;
  }
  steps.push({ branch: "①", ...blank });
  if (n === 2 || n === 3) {
    steps.push({ branch: "②", ...blank });
    return steps;
  }
  steps.push({
    branch: "②③",
    d: "2 와 3",
    step: "—",
    dd: "—",
    mod: `${n % 2} 과 ${n % 3}`,
    next: "5",
  });
  if (n % 2 === 0 || n % 3 === 0) return steps;

  let d = 5;
  let step = 2;
  for (;;) {
    steps.push({
      branch: "④",
      d: `${d}`,
      step: `${step}`,
      dd: `${d * d}`,
      mod: "—",
      next: "—",
    });
    if (d * d > n) return steps;
    const nextD = d + step;
    steps.push({
      branch: "⑤",
      d: `${d}`,
      step: `${step}`,
      dd: `${d * d}`,
      mod: `${n % d}`,
      next: n % d === 0 ? "없다" : `${nextD}`,
    });
    if (n % d === 0) return steps;
    d = nextD;
    step = 6 - step;
  }
}

/* ────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────── */

type Ref = { isPrimeTrial: (n: number) => boolean };

/** 사전 판정에서 2 와 3 의 배수를 거르는 줄을 지운 판. */
const NO_PRESKIP = await loadMutant<Ref>(REF, {
  drop: /^ {2}if \(n % 2 === 0 \|\| n % 3 === 0\) return false;$/,
});

/** 루프 조건의 등호를 뺀 판 — 불변식을 지키던 바로 그 줄이다. */
const STRICT_LESS = await loadMutant<Ref>(REF, {
  swap: [/^ {2}while \(d \* d <= n\) \{$/, "  while (d * d < n) {"],
});

/** 걸음 폭을 2 로 고정한 판 — 후보가 홀수 전부가 된다. */
const FIXED_STEP = await loadMutant<Ref>(REF, {
  swap: [/^ {4}step = 6 - step;$/, "    step = 2;"],
});

/** 걸음 폭을 고정했을 때의 나눗셈 횟수 — 후보가 3, 5, 7, 9, … 가 된다. */
function fixedStepDivs(n: number): number {
  if (n < 2 || n === 2 || n === 3) return 0;
  let divs = 2;
  if (n % 2 === 0 || n % 3 === 0) return divs;
  let d = 5;
  while (d * d <= n) {
    divs++;
    if (n % d === 0) return divs;
    d += 2;
  }
  return divs;
}

const yn = (b: boolean): string => (b ? "소수" : "소수 아님");

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 정의대로 2 부터 n-1 까지 나누면 몇 번인가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["입력", "2 부터 n-1 까지", "2 부터 √n 까지", "⌊√n⌋"],
    ];
    for (const key of ["10^3", "10^4", "10^6", "10^9", "10^12"]) {
      const n = LARGEST_PRIME_AT[key] as number;
      rows.push([
        `${comma(n)} (소수)`,
        comma(naiveDivs(n)),
        comma(Math.floor(Math.sqrt(n)) - 1),
        comma(Math.floor(Math.sqrt(n))),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 둘째 칸은 실행하지 않고 센 값이고 소수는 끝까지 가므로 n - 2 다.
          세는 방법이 실제 실행과 같은지는 n = 4…3,000 전수로 확인했다: ${countsAgree() ? "같다" : "다르다"}`;
  },

  /** 합성수를 두 인수로 가르면 작은 쪽이 어디 있는가. */
  "sqrt-pairs": () => {
    const rows: string[][] = [
      ["입력", "2 이상인 인수 쌍", "작은 쪽", "⌊√n⌋", "정본"],
    ];
    for (const n of [36, 91, 187, 221, 997]) {
      const pairs: string[] = [];
      for (let a = 2; a * a <= n; a++) {
        if (n % a === 0) pairs.push(`${a}×${n / a}`);
      }
      const smallest = smallestFactor(n);
      rows.push([
        comma(n),
        pairs.length > 0 ? pairs.join(" ") : "없다",
        smallest === -1 ? "없다" : comma(smallest),
        comma(Math.floor(Math.sqrt(n))),
        yn(isPrimeTrial(n)),
      ]);
    }
    const over = [36, 91, 187, 221, 997].filter((n) => {
      const f = smallestFactor(n);
      return f !== -1 && f > Math.floor(Math.sqrt(n));
    });
    return `${table(rows, [0, 3]).join("\n")}
        └ 셋째 칸이 넷째 칸을 넘는 줄이 ${comma(over.length)} 개다.
          마지막 줄은 2 이상인 인수 쌍 자체가 없는 소수다`;
  },

  /** 후보를 만드는 세 방법의 나눗셈 횟수. */
  "wheel-candidates": () => {
    const rows: string[][] = [
      ["입력", "2 부터 전부", "홀수만", "6k±1 만", "정본"],
    ];
    for (const n of [
      WALK,
      LARGEST_PRIME_AT["10^3"] as number,
      LARGEST_PRIME_AT["10^6"] as number,
      WORST,
    ]) {
      rows.push([
        comma(n),
        comma(countDivs(n, 1)),
        comma(countDivs(n, 2)),
        comma(countDivs(n, 6)),
        yn(isPrimeTrial(n)),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 세 칸 다 √n 까지만 시도한 값이고 사전 판정의 나눗셈을 함께 센다.
          첫 줄은 합성수라 세 판 다 약수 11 에서 멈춘다`;
  },

  /** 바퀴를 키우면 후보가 얼마나 주는가. */
  "wheel-sweep": () => {
    const rows: string[][] = [
      ["바퀴 M", "미리 거르는 소수", "후보 밀도", "나눗셈 횟수", "직전 대비"],
    ];
    let prev = 0;
    for (const M of [1, 2, 6, 30, 210]) {
      const primes = wheelPrimes(M);
      const phi = wheelSteps(M).length;
      const divs = countDivs(WORST, M);
      rows.push([
        comma(M),
        primes.length > 0 ? primes.join(" ") : "없다",
        M === 1 ? "1" : reduce(phi, M),
        comma(divs),
        prev === 0 ? "—" : `${comma(prev - divs)} 감소`,
      ]);
      prev = divs;
    }
    return `${table(rows, [0, 3]).join("\n")}
        └ n = ${comma(WORST)} 하나에 바퀴만 바꿔 실제로 실행한 값이다.
          마지막 칸이 계속 작아진다 — 바퀴를 키워 얻는 몫이 줄어든다`;
  },

  /** 경계 입력이 어느 갈래에서 답하는가. */
  "edge-values": () => {
    const rows: string[][] = [["입력", "답하는 갈래", "정본", "정의대로"]];
    const byDefinition = (n: number): boolean => {
      if (n < 2) return false;
      for (let d = 2; d < n; d++) if (n % d === 0) return false;
      return true;
    };
    const branchOf = (n: number): string => {
      if (n < 2) return "①";
      if (n === 2 || n === 3) return "②";
      if (n % 2 === 0 || n % 3 === 0) return "③";
      return "④⑤";
    };
    const inputs = [-7, 0, 1, 2, 3, 4, 9, 25, 97, 121];
    for (const n of inputs) {
      rows.push([
        comma(n),
        branchOf(n),
        yn(isPrimeTrial(n)),
        yn(byDefinition(n)),
      ]);
    }
    const looped = inputs.filter((n) => branchOf(n) === "④⑤");
    return `${table(rows, [0]).join("\n")}
        └ 셋째 칸과 넷째 칸이 ${inputs.length} 줄 내내 같다.
          루프까지 내려간 것은 ${looped.join(" · ")} 이고 나머지는 사전 판정이 답한다`;
  },

  /** 사전 판정을 지우면 무엇이 틀리는가. */
  "mutant-no-preskip": () => {
    const rows: string[][] = [["입력", "정본", "③ 을 지운 판", "정의대로"]];
    const byDefinition = (n: number): boolean => {
      if (n < 2) return false;
      for (let d = 2; d < n; d++) if (n % d === 0) return false;
      return true;
    };
    for (const n of [4, 6, 9, 15, 25, 187]) {
      rows.push([
        comma(n),
        yn(isPrimeTrial(n)),
        yn(NO_PRESKIP.isPrimeTrial(n)),
        yn(byDefinition(n)),
      ]);
    }
    let wrong = 0;
    for (let n = 0; n <= 1_000; n++) {
      if (NO_PRESKIP.isPrimeTrial(n) !== isPrimeTrial(n)) wrong++;
    }
    return `${table(rows, [0]).join("\n")}
        └ 위 넷은 첫 후보 5 의 제곱 25 가 n 보다 커서 루프에 한 번도 들어가지 않는다.
          아래 둘은 두 판이 같다. 0 부터 1,000 까지 두 판이 갈리는 입력은 ${comma(wrong)} 개다`;
  },

  /** 걸음 폭을 고정하면 답이 아니라 무엇이 바뀌는가. */
  "mutant-fixed-step": () => {
    const rows: string[][] = [
      ["입력", "정본 나눗셈", "걸음 폭 2 고정", "정본", "고정 판"],
    ];
    for (const n of [
      WALK,
      LARGEST_PRIME_AT["10^3"] as number,
      LARGEST_PRIME_AT["10^6"] as number,
      WORST,
    ]) {
      rows.push([
        comma(n),
        comma(countDivs(n, 6)),
        comma(fixedStepDivs(n)),
        yn(isPrimeTrial(n)),
        yn(FIXED_STEP.isPrimeTrial(n)),
      ]);
    }
    let same = 0;
    for (let n = -50; n <= 20_000; n++) {
      if (FIXED_STEP.isPrimeTrial(n) === isPrimeTrial(n)) same++;
    }
    return `${table(rows, [0, 1, 2]).join("\n")}
        └ 넷째 칸과 다섯째 칸이 네 줄 내내 같다.
          -50 부터 20,000 까지 ${comma(same)} 개 입력에서 두 판의 답이 전부 같다`;
  },

  /** 루프 조건의 등호를 빼면 무엇이 틀리는가. */
  "mutant-strict-less": () => {
    const rows: string[][] = [["입력", "정본", "등호를 뺀 판", "정의대로"]];
    const byDefinition = (n: number): boolean => {
      if (n < 2) return false;
      for (let d = 2; d < n; d++) if (n % d === 0) return false;
      return true;
    };
    for (const n of [25, 49, 121, 169, 187, 97]) {
      rows.push([
        comma(n),
        yn(isPrimeTrial(n)),
        yn(STRICT_LESS.isPrimeTrial(n)),
        yn(byDefinition(n)),
      ]);
    }
    const wrong: number[] = [];
    for (let n = 0; n <= 1_000; n++) {
      if (STRICT_LESS.isPrimeTrial(n) !== isPrimeTrial(n)) wrong.push(n);
    }
    return `${table(rows, [0]).join("\n")}
        └ 아래 둘은 두 판이 같다 — 187 은 11 에서 먼저 멈추고 97 은 후보가 다 지나도 소수다.
          0 부터 1,000 까지 두 판이 갈리는 입력은 ${wrong.join(" · ")} 뿐이고 전부 소수의 제곱이다`;
  },

  /** 후보 개수의 닫힌 형태가 실제로 센 값과 같은가. */
  "math-check": () => {
    const rows: string[][] = [["x", "후보 목록", "실제로 센 수", "닫힌 형태"]];
    for (const x of [5, 7, 11, 13, 25, 31]) {
      const list: number[] = [];
      let d = 5;
      let step = 2;
      while (d <= x) {
        list.push(d);
        d += step;
        step = 6 - step;
      }
      rows.push([
        comma(x),
        list.join(" "),
        comma(candidateCountByLoop(x)),
        comma(candidateCount(x)),
      ]);
    }
    for (const x of [99, 999, 31_622, 999_999]) {
      rows.push([
        comma(x),
        "…",
        comma(candidateCountByLoop(x)),
        comma(candidateCount(x)),
      ]);
    }
    return `${table(rows, [0, 2, 3]).join("\n")}
        └ 셋째 칸과 넷째 칸이 열 줄 내내 같다`;
  },

  /** 바퀴를 일반화한 식에 제약 규모를 넣으면. */
  "math-scale": () => {
    const root = Math.floor(Math.sqrt(WORST));
    const rows: string[][] = [
      ["바퀴 M", "φ(M)", "φ(M)/M", "식이 내는 후보 수", "실제로 센 수", "차이"],
    ];
    const gaps = new Set<number>();
    for (const M of [1, 2, 6, 30, 210, 2310]) {
      const phi = wheelSteps(M).length;
      const byFormula = Math.round((phi / M) * root);
      const byRun = countDivs(WORST, M) - wheelPrimes(M).length;
      gaps.add(byFormula - byRun);
      rows.push([
        comma(M),
        comma(phi),
        (phi / M).toFixed(4),
        comma(byFormula),
        comma(byRun),
        comma(byFormula - byRun),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5]).join("\n")}
        └ x = ⌊√n⌋ = ${comma(root)} 이고 n = ${comma(WORST)} 이다.
          마지막 칸이 여섯 줄 내내 ${[...gaps].join(" · ")} 이다 — 식은 후보로 안 쓰는 1 을 함께 센다`;
  },

  /** 경쟁 설계와의 계수 대조 — `.alt.ts` 를 불러서 만든다. */
  "alt-counts": () => {
    const ours: Record<string, number> = cases["√n 까지의 시행 나눗셈"]();
    const mr: Record<string, number> = cases["결정론적 밀러-라빈"]();
    const keys = [
      "전개 입력 n=187 기본 연산",
      "n=997 기본 연산",
      "n=9,973 기본 연산",
      "n=999,983 기본 연산",
      "n=999,999,937 기본 연산",
      "n=999,999,999,989 기본 연산",
      "마지막으로 앞선 자리의 기본 연산",
      "그 다음 소수의 기본 연산",
      "n=999,999,999,989 저장 칸",
    ];
    const rows: string[][] = [
      ["입력", "√n 시행 나눗셈", "결정론적 밀러-라빈", "적은 쪽"],
    ];
    for (const key of keys) {
      const a = ours[key] ?? 0;
      const b = mr[key] ?? 0;
      rows.push([
        key,
        comma(a),
        comma(b),
        a === b ? "같다" : a < b ? "시행 나눗셈" : "밀러-라빈",
      ]);
    }
    return `${table(rows, [1, 2]).join("\n")}
        └ 「마지막으로 앞선 자리」는 소수 ${comma(ours["마지막으로 앞선 소수"] ?? 0)} 이고 「그 다음 소수」는 ${comma(ours["그 다음 소수"] ?? 0)} 이다.
          5 부터 ${comma(SWEEP_LIMIT)} 까지 소수를 전부 재서 찾았다.
          두 설계가 같은 답을 내는가: ${verdictsAgree() ? "그렇다" : "아니다"}`;
  },

  /** 총식이 실측과 같은가. */
  "perf-formula": () => {
    const rows: string[][] = [
      [
        "입력",
        "⌊√n⌋",
        "후보 수 C",
        "식이 내는 기본 연산",
        "실행이 센 기본 연산",
      ],
    ];
    for (const n of [
      WALK,
      97,
      LARGEST_PRIME_AT["10^3"] as number,
      LARGEST_PRIME_AT["10^6"] as number,
      LARGEST_PRIME_AT["10^9"] as number,
      WORST,
    ]) {
      const root = Math.floor(Math.sqrt(n));
      rows.push([
        `${comma(n)} (${yn(isPrimeTrial(n))})`,
        comma(root),
        comma(candidateCount(root)),
        comma(opsByFormula(n)),
        comma(opsByRun(n)),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 넷째 칸과 다섯째 칸이 여섯 줄 내내 같다.
          첫 줄은 합성수라 후보를 다 쓰지 않고 가장 작은 약수 11 에서 멈춘다`;
  },

  /** 어떤 입력이 최악인가. */
  "worst-shapes": () => {
    const rows: string[][] = [
      ["입력 모양", "n", "정본", "기본 연산", "나눗셈"],
    ];
    const shapes: [string, number][] = [
      ["2 보다 작다", -7],
      ["짝수", 999_999_999_988],
      ["3 의 배수", 999_999_999_987],
      ["작은 약수를 가진 합성수", 999_999_999_985],
      ["큰 소수의 제곱", 999_983 * 999_983],
      ["상한 아래 가장 큰 소수", WORST],
    ];
    for (const [shape, n] of shapes) {
      rows.push([
        shape,
        comma(n),
        yn(isPrimeTrial(n)),
        comma(opsByRun(n)),
        comma(countDivs(n, 6)),
      ]);
    }
    return `${table(rows, [1, 3, 4]).join("\n")}
        └ 다섯째 줄은 999,983 의 제곱이라 후보를 거의 다 쓰고 나서야 약수를 찾는다.
          제약 상한 근처의 다섯 줄에서 넷째 칸이 ${comma(opsByRun(999_999_999_988))} 과 ${comma(opsByRun(WORST))} 사이로 갈린다`;
  },

  /** 전개 입력을 처음부터 끝까지 실행한 걸음. */
  "walk-trace": () => {
    const rows: string[][] = [
      ["걸음", "갈래", "d", "step", "d × d", "n mod d", "다음 후보"],
    ];
    const steps = trace(WALK);
    steps.forEach((s, i) => {
      rows.push([`T${i + 1}`, s.branch, s.d, s.step, s.dd, s.mod, s.next]);
    });
    return `${table(rows, [4]).join("\n")}
        └ 갈래 다섯이 전부 실행됐다. 후보는 5 · 7 · 11 셋이고 9 는 만들어지지 않았다.
          n = ${comma(WALK)} 이고 반환값은 ${isPrimeTrial(WALK)} 다`;
  },
};

/** 본문이 인용하는 값 몇 개 — 사이드카 밖에서 쓰지 않지만 이름을 남겨 둔다. */
export const FACTS = {
  walk: WALK,
  worst: WORST,
  lastAhead: lastAhead(),
  nextPrime: nextPrime(lastAhead()),
};
