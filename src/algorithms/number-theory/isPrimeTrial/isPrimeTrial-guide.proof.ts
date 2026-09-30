/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 세는 사본과 걸음 기록은 그림 사이드카(`-guide.fig.tsx`)의 것을 쓴다 — 그림과 표가 같은 기록을 쓰고,
 * 그 기록의 답은 거기서 정본과 대조한다. 큰 입력은 나눗셈 횟수만 세는 가벼운 판(`countRun`)으로 잰다.
 *
 * 경쟁 설계 대조 표는 `.alt.ts` 의 `cases` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다. 체와 비교하는 표는 체 편의 그림 사이드카가 센 값을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { counted as sieveCounted } from "../sieveOfEratosthenes/sieveOfEratosthenes-guide.fig.tsx";
import {
  basesFor,
  cases,
  lastAhead,
  millerOps,
  nextPrime,
  SWEEP_LIMIT,
  verdictsAgree,
} from "./isPrimeTrial-guide.alt.ts";
import {
  byDefinition,
  candidateCount,
  candidatesUpTo,
  countRun,
  LARGEST_PRIME_AT,
  naiveDivisions,
  naiveMismatches,
  num,
  once,
  seconds,
  smallestFactor,
  traceRun,
  WALK,
  WORST,
  wheelPrimes,
  wheelResidues,
  wheelRun,
  yn,
} from "./isPrimeTrial-guide.fig.tsx";
import { isPrimeTrial } from "./isPrimeTrial-guide.ref.ts";

const REF = new URL("./isPrimeTrial-guide.ref.ts", import.meta.url).pathname;

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

const block = (...parts: string[]): string => parts.join("\n\n");

/** 수의 나열. 비면 「없음」 이다. */
const list = (xs: readonly number[]): string =>
  xs.length === 0 ? "없음" : xs.map(num).join(" ");

/** 규모별 가장 큰 소수 다섯 — 작은 규모부터. */
const SCALES = ["10^3", "10^4", "10^6", "10^9", "10^12"].map(
  (k) => LARGEST_PRIME_AT[k] as number,
);

const countOf = (n: number) => once(`count-${n}`, () => countRun(n));

/** 기약분수 문자열. 후보 밀도를 약분해서 적는다. */
function reduce(a: number, b: number): string {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  const d = g(a, b);
  return `${a / d}/${b / d}`;
}

/* ───────────────────────── 변이 ────────────────────────── */

type Impl = { isPrimeTrial: (n: number) => boolean };

/** 사전 판정에서 2 와 3 의 배수를 거르는 줄을 지운 판. */
const NO_PRESKIP = await loadMutant<Impl>(REF, {
  drop: /^ {2}if \(n % 2 === 0 \|\| n % 3 === 0\) return false;$/,
});

/** 루프 조건의 등호를 뺀 판 — 불변식을 지키던 바로 그 줄이다. */
const STRICT_LESS = await loadMutant<Impl>(REF, {
  swap: [/^ {2}while \(d \* d <= n\) \{$/, "  while (d * d < n) {"],
});

/** 걸음 폭을 2 로 고정한 판 — 후보가 5 이상의 홀수 전부가 된다. */
const FIXED_STEP = await loadMutant<Impl>(REF, {
  swap: [/^ {4}step = 6 - step;$/, "    step = 2;"],
});

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. 중화 실행에서는 변이 모듈이 정본
 * 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
function assertBreaks(m: Impl, wrong: number): void {
  const neutral = m.isPrimeTrial === isPrimeTrial;
  if (!neutral && wrong === 0) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 변이의 답을 입력마다 나란히 놓은 줄. 판정 열은 두 답이 같은가다. */
function contrastRows(ns: number[], m: Impl): string[][] {
  return ns.map((n) => {
    const a = isPrimeTrial(n);
    const b = m.isPrimeTrial(n);
    return [
      num(n),
      yn(a),
      yn(b),
      yn(byDefinition(n)),
      a === b ? "같다" : "어긋난다",
    ];
  });
}

/** 걸음 폭을 고정한 판의 나눗셈 횟수 — 후보가 5 · 7 · 9 · 11 · … 가 된다. */
function fixedStepDivisions(n: number): number {
  if (n < 2 || n === 2 || n === 3) return 0;
  let divs = 1;
  if (n % 2 === 0) return divs;
  divs++;
  if (n % 3 === 0) return divs;
  let d = 5;
  while (d * d <= n) {
    divs++;
    if (n % d === 0) return divs;
    d += 2;
  }
  return divs;
}

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

function conceptDivided(): string {
  const tr = traceRun(WALK);
  const rows = tr.divided.map((d) => [num(d), num(WALK % d)]);
  const f = smallestFactor(WALK);
  const passed: number[] = [];
  for (let m = 2; m <= f; m++) if (!tr.divided.includes(m)) passed.push(m);
  if (!passed.every((m) => m % 2 === 0 || m % 3 === 0)) {
    throw new Error("건너뛴 수에 2 · 3 의 배수가 아닌 수가 있다");
  }
  const lastPassed = passed.at(-1) as number;
  return block(
    md(["나눠 본 수 d", `${WALK} mod d`], rows, [0, 1]),
    `${tr.divided.length} 번째 나눗셈에서 나머지가 0 이 나와 ${f}${이가(f)} 약수이고, 답은 ${tr.prime} 입니다. 2 부터 ${f} 사이에서 나누지 않고 넘어간 ${list(passed)}${은는(lastPassed)} 모두 2 나 3 의 배수입니다.`,
  );
}

function conceptScale(): string {
  const rows = [WALK, WORST].map((n) => [
    num(n),
    yn(isPrimeTrial(n)),
    num(naiveDivisions(n)),
    num(countOf(n).divisions),
  ]);
  const ratio = naiveDivisions(WORST) / countOf(WORST).divisions;
  return block(
    md(
      ["입력 n", "정본", "2 부터 n − 1 까지 나눠 보기", "시행 나눗셈"],
      rows,
      [0, 2, 3],
    ),
    `${num(WORST)} 에서 시행 나눗셈은 정의대로 나눠 보는 방법의 ${num(Math.round(ratio))} 분의 1 만 나눕니다.`,
  );
}

/* ───────────────────────── 아이디어를 떠올리는 과정 ───────────────────────── */

function originNaive(): string {
  const rows = SCALES.map((n) => [
    num(n),
    num(naiveDivisions(n)),
    seconds(naiveDivisions(n)),
  ]);
  const top = naiveDivisions(WORST);
  return block(
    md(["입력 n(소수)", "나눗셈", "시간(1 초에 1 억 번)"], rows, [0, 1, 2]),
    `${num(WORST)} 에서 나눗셈이 ${num(top)} 번이라, 1 초에 1 억 번으로 잡으면 ${seconds(top)}입니다. 나눗셈 횟수는 실행하지 않고 소수면 n − 2 로 셌고, 그 셈이 실제로 나눠 본 횟수와 어긋나는 입력은 n = 4 … 3,000 에서 ${num(naiveMismatches())} 개입니다.`,
  );
}

function originPairs(): string {
  const ns = [36, 91, WALK, 221, 997];
  const rows = ns.map((n) => {
    const pairs: string[] = [];
    for (let a = 2; a * a <= n; a++) {
      if (n % a === 0) pairs.push(`${a} × ${n / a}`);
    }
    const f = smallestFactor(n);
    return [
      num(n),
      pairs.length > 0 ? pairs.join(" · ") : "없음",
      f === -1 ? "없음" : num(f),
      num(Math.floor(Math.sqrt(n))),
      yn(isPrimeTrial(n)),
    ];
  });
  const over = ns.filter((n) => {
    const f = smallestFactor(n);
    return f !== -1 && f > Math.floor(Math.sqrt(n));
  });
  return block(
    md(
      ["n", "2 이상인 약수 짝", "가장 작은 약수", "⌊√n⌋", "정본"],
      rows,
      [0, 2, 3],
    ),
    `가장 작은 약수가 ⌊√n⌋ 보다 큰 줄은 ${num(over.length)} 개입니다. 997 은 약수 짝이 없어 소수입니다.`,
  );
}

function originRoot(): string {
  const rows = SCALES.map((n) => {
    const root = wheelRun(n, 1).divisions;
    return [num(n), num(naiveDivisions(n)), num(root), seconds(root)];
  });
  const root = wheelRun(WORST, 1).divisions;
  return block(
    md(
      [
        "입력 n(소수)",
        "2 부터 n − 1 까지",
        "2 부터 ⌊√n⌋ 까지",
        "⌊√n⌋ 까지의 시간",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    `${num(WORST)} 에서 나눗셈이 ${num(naiveDivisions(WORST))} 번에서 ${num(root)} 번으로 줄고, 시간은 ${seconds(root)}입니다. 다섯 입력 모두 ⌊√n⌋ 까지만 나눠도 답이 정본과 같습니다.`,
  );
}

function originWaste(): string {
  const n = WALK;
  const rows: string[][] = [];
  const decided: number[] = [];
  for (let d = 2; d * d <= n; d++) {
    let why = "—";
    if (d > 3 && d % 2 === 0 && d % 3 === 0) why = "2 와 3 이 이미 못 나눴다";
    else if (d > 3 && d % 2 === 0) why = "2 가 이미 못 나눴다";
    else if (d > 3 && d % 3 === 0) why = "3 이 이미 못 나눴다";
    if (why !== "—") decided.push(d);
    rows.push([num(d), num(n % d), why]);
    if (n % d === 0) break;
  }
  return block(
    md(["d", `${n} mod d`, "결과가 미리 정해진 까닭"], rows, [0, 1]),
    `나눗셈 ${rows.length} 번 가운데 ${decided.length} 번(${list(decided)})은 나누기 전에 결과가 정해져 있었습니다.`,
  );
}

function originThreeWays(): string {
  const ns = [WALK, SCALES[0] as number, SCALES[2] as number, WORST];
  const rows = ns.map((n) => [
    num(n),
    num(wheelRun(n, 1).divisions),
    num(wheelRun(n, 2).divisions),
    num(countOf(n).divisions),
    yn(isPrimeTrial(n)),
  ]);
  return block(
    md(
      ["입력 n", "√n 까지 전부", "√n 까지 홀수만", "√n 까지 6k±1 만", "정본"],
      rows,
      [0, 1, 2, 3],
    ),
    `세 판 모두 네 입력에서 정본과 같은 답을 냈습니다. ${num(WORST)} 에서 나눗셈이 ${num(wheelRun(WORST, 1).divisions)} 번, ${num(wheelRun(WORST, 2).divisions)} 번, ${num(countOf(WORST).divisions)} 번입니다.`,
  );
}

/* ───────────────────────── 아이디어 상세 ───────────────────────── */

const branchOf = (n: number): string => {
  if (n < 2) return "①";
  if (n === 2 || n === 3) return "②";
  if (n % 2 === 0 || n % 3 === 0) return "③";
  return "④ · ⑤";
};

function buildPre(): string {
  const inputs = [-7, 0, 1, 2, 3, 4, 9, 25, 97, 121];
  const rows = inputs.map((n) => [
    num(n),
    branchOf(n),
    num(countRun(n).divisions),
    yn(isPrimeTrial(n)),
    yn(byDefinition(n)),
  ]);
  const looped = inputs.filter((n) => branchOf(n) === "④ · ⑤");
  const same = inputs.filter((n) => isPrimeTrial(n) === byDefinition(n));
  return block(
    md(["입력 n", "답하는 갈래", "나눗셈", "정본", "정의대로"], rows, [0, 2]),
    `${num(inputs.length)} 입력 중 ${num(same.length)} 입력에서 정본과 정의대로의 답이 같습니다. 루프까지 내려간 것은 ${list(looped)} 이고, 나머지는 사전 판정이 답했습니다.`,
  );
}

function buildSteps(): string {
  const make = (start: number): number[] => {
    const out: number[] = [];
    let d = 5;
    let step = start;
    while (d <= 30) {
      out.push(d);
      d += step;
      step = 6 - step;
    }
    return out;
  };
  const two = make(2);
  const four = make(4);
  const threes = (xs: number[]) => xs.filter((x) => x % 3 === 0);
  const rows = [
    ["2", list(two), list(threes(two))],
    ["4", list(four), list(threes(four))],
  ];
  const composite = two.filter((x) => !byDefinition(x));
  return block(
    md(["첫 걸음 폭", "30 까지 만든 후보", "그중 3 의 배수"], rows, [0]),
    `첫 걸음 폭이 2 인 줄은 모두 6 으로 나눈 나머지가 1 이나 5 이고, 그 가운데 합성수는 ${list(composite)} 입니다.`,
  );
}

function buildStop(): string {
  const ns = [25, 29, 49, 97, WALK];
  const rows = ns.map((n) => {
    const tr = traceRun(n);
    const tried = tr.events.flatMap((e) => (e.kind === "divide" ? [e.d] : []));
    const last = tr.events.at(-1);
    let end = "—";
    if (last?.kind === "cond") end = `d = ${last.d} 에서 ${last.square} > ${n}`;
    if (last?.kind === "divide") end = `d = ${last.d} 에서 나머지 0`;
    return [
      num(n),
      num(Math.floor(Math.sqrt(n))),
      list(tried),
      end,
      yn(tr.prime),
    ];
  });
  const exact = ns.filter((n) => {
    const r = Math.floor(Math.sqrt(n));
    return r * r === n;
  });
  return block(
    md(["n", "⌊√n⌋", "루프에서 나눈 후보", "멈춘 자리", "답"], rows, [0, 1]),
    `${exact.map((x, k) => (k === 0 ? `${x}` : `${과와(exact[k - 1] as number).trim()} ${x}`)).join(" ")}${은는(exact.at(-1) as number)} 마지막 후보가 곧 √n 이라, d × d ≤ n 의 등호가 참인 걸음에서 약수를 찾습니다.`,
  );
}

function buildSafe(): string {
  const c = countOf(WORST);
  const rows = [
    ["`Number.MAX_SAFE_INTEGER`", num(Number.MAX_SAFE_INTEGER)],
    ["과제 규모의 최악 입력 n", num(WORST)],
    ["그 n 에서 계산한 가장 큰 d × d", num(c.maxSquare)],
  ];
  return block(
    md(["값", "크기"], rows, [1]),
    `${num(WORST)}${을를(WORST)} 판정하는 동안 계산한 수 가운데 가장 큰 ${num(c.maxSquare)}${이가(c.maxSquare)} 한계보다 ${num(Math.floor(Number.MAX_SAFE_INTEGER / c.maxSquare))} 배 넘게 작습니다.`,
  );
}

function buildWheelSweep(): string {
  let prev = 0;
  const rows = [1, 2, 6, 30, 210].map((M) => {
    const divs = wheelRun(WORST, M).divisions;
    const phi = wheelResidues(M).length;
    const row = [
      num(M),
      M === 1 ? "없음" : wheelPrimes(M).join(" · "),
      num(phi),
      M === 1 ? "1" : reduce(phi, M),
      num(divs),
      prev === 0 ? "—" : num(prev - divs),
    ];
    prev = divs;
    return row;
  });
  return block(
    md(
      [
        "바퀴 M",
        "미리 나누는 소수",
        "한 바퀴의 후보 자리",
        "후보 밀도",
        "나눗셈",
        "직전보다 준 나눗셈",
      ],
      rows,
      [0, 2, 4, 5],
    ),
    `n = ${num(WORST)} 하나에 바퀴만 바꿔 실행했고, 다섯 판 모두 정본과 같은 답을 냈습니다.`,
  );
}

/* ───────────────────────── 수행으로 알아보는 알고리즘 ───────────────────────── */

function walkInput(): string {
  return `const n = ${WALK};
// 이 절이 끝나면 ${isPrimeTrial(WALK)} 가 나와야 한다`;
}

function walkPre(): string {
  const tr = traceRun(WALK);
  const pre = tr.events.find((e) => e.kind === "pre");
  if (pre?.kind !== "pre") throw new Error("사전 판정 걸음이 없다");
  return [
    `T1  ${WALK} < 2 거짓, ${WALK} === 2 거짓, ${WALK} === 3 거짓 → ① ② 를 지난다`,
    `T2  ${WALK} mod 2 = ${pre.mod2}, ${WALK} mod 3 = ${pre.mod3} → ③ 의 조건이 거짓이다`,
    `    나눗셈 2 번. ${WALK}${을를(WALK)} 6 으로 나눈 나머지는 ${WALK % 6} 이다`,
  ].join("\n");
}

function walkLoop(): string {
  const tr = traceRun(WALK);
  const lines: string[] = [];
  tr.events.forEach((e, k) => {
    const t = k + 1;
    if (t < 3 || t > 6) return;
    if (e.kind === "cond") {
      lines.push(
        `T${t}  d = ${e.d}, step = ${e.step}: ${e.d} × ${e.d} = ${e.square} ≤ ${WALK}${이가(WALK)} ${e.holds ? "참" : "거짓"} → ④`,
      );
    } else if (e.kind === "divide") {
      lines.push(
        `T${t}  ${WALK} mod ${e.d} = ${e.mod}: 약수가 아니다 → d = ${e.next}, step = ${6 - e.step} → ⑤`,
      );
    }
  });
  return lines.join("\n");
}

function walkTrace(): string {
  const tr = traceRun(WALK);
  let divs = 0;
  const rows = tr.events.map((e, k) => {
    const t = `T${k + 1}`;
    if (e.kind === "small") {
      return [
        t,
        "① ②",
        `\`${WALK} < 2\` · \`${WALK} === 2\` · \`${WALK} === 3\` 거짓`,
        "—",
        "—",
        "—",
        num(divs),
      ];
    }
    if (e.kind === "pre") {
      divs += 2;
      return [
        t,
        "③",
        `\`${WALK} % 2 === 0\` · \`${WALK} % 3 === 0\` 거짓`,
        "2 · 3",
        "—",
        `${e.mod2} · ${e.mod3}`,
        num(divs),
      ];
    }
    if (e.kind === "cond") {
      return [
        t,
        "④",
        `\`${e.square} <= ${WALK}\` ${e.holds ? "참" : "거짓"}`,
        num(e.d),
        num(e.step),
        "—",
        num(divs),
      ];
    }
    divs++;
    return [
      t,
      "⑤",
      `\`${WALK} % ${e.d} === 0\` ${e.mod === 0 ? "참" : "거짓"}`,
      num(e.d),
      num(e.step),
      num(e.mod),
      num(divs),
    ];
  });
  const cands = tr.events.flatMap((e) => (e.kind === "divide" ? [e.d] : []));
  return block(
    md(
      ["걸음", "갈래", "조건 판정", "d", "step", "n mod d", "나눗셈 누계"],
      rows,
      [3, 4, 5, 6],
    ),
    `${num(rows.length)} 걸음에서 갈래 다섯이 모두 실행됐습니다. 루프가 나눈 후보는 ${list(cands)} 이고 9 는 만들지 않았으며, 답은 ${tr.prime} 입니다.`,
  );
}

function noPreskip(): string {
  const ns = [4, 6, 9, 15, 25, WALK];
  let wrong = 0;
  for (let n = 0; n <= 1_000; n++) {
    if (NO_PRESKIP.isPrimeTrial(n) !== isPrimeTrial(n)) wrong++;
  }
  assertBreaks(NO_PRESKIP, wrong);
  return block(
    md(
      ["입력 n", "정본", "③ 을 지운 판", "정의대로", "두 답의 판정"],
      contrastRows(ns, NO_PRESKIP),
      [0],
    ),
    `0 부터 1,000 까지 두 판의 답이 갈리는 입력은 ${num(wrong)} 개입니다.`,
  );
}

function fixedStep(): string {
  const ns = [WALK, SCALES[0] as number, SCALES[2] as number, WORST];
  const rows = ns.map((n) => [
    num(n),
    num(countOf(n).divisions),
    num(fixedStepDivisions(n)),
    yn(isPrimeTrial(n)),
    yn(FIXED_STEP.isPrimeTrial(n)),
  ]);
  let same = 0;
  let total = 0;
  for (let n = -50; n <= 20_000; n++) {
    total++;
    if (FIXED_STEP.isPrimeTrial(n) === isPrimeTrial(n)) same++;
  }
  const extra = fixedStepDivisions(WORST) - countOf(WORST).divisions;
  return block(
    md(
      ["입력 n", "정본의 나눗셈", "걸음 폭 2 고정의 나눗셈", "정본", "고정 판"],
      rows,
      [0, 1, 2],
    ),
    `-50 부터 20,000 까지 ${num(total)} 입력 중 ${num(same)} 입력에서 두 판의 답이 같습니다. ${num(WORST)} 에서 걸음 폭을 고정하면 나눗셈이 ${num(extra)} 번 늘어납니다.`,
  );
}

function finalCalls(): string {
  const ns = [WALK, 97, 2, 1, -7, 999_983 * 999_983, WORST];
  const calls = ns.map((n) => `isPrimeTrial(${String(n)})`);
  const w = Math.max(...calls.map((c) => c.length));
  return calls
    .map((c, k) => `${c.padEnd(w)}   →   ${isPrimeTrial(ns[k] as number)}`)
    .join("\n");
}

/* ───────────────────────── 알아 두면 좋은 개념 ───────────────────────── */

function relatedWheel(): string {
  const rows = [1, 2, 6, 30].map((M) => {
    const res = wheelResidues(M)
      .map((r) => (r === M ? 0 : r))
      .sort((a, b) => a - b);
    return [
      num(M),
      M === 1 ? "없음" : wheelPrimes(M).join(" · "),
      M === 1 ? "전부" : res.join(" · "),
      M === 1 ? "1" : reduce(res.length, M),
      num(wheelRun(WORST, M).divisions),
    ];
  });
  return block(
    md(
      [
        "바퀴 M",
        "미리 나눠 보는 소수",
        "후보로 남는 나머지",
        "남는 비율",
        "최악 입력의 나눗셈",
      ],
      rows,
      [0, 4],
    ),
    `최악 입력은 ${num(WORST)} 이고, 남는 비율이 작아지는 만큼 나눗셈이 줄어듭니다. 이 글의 절차는 M = 6 줄입니다.`,
  );
}

/* ───────────────────────── 파트 2 ───────────────────────── */

/** 구간 전체를 물을 때의 상한 — 체 편의 과제 규모와 같다. */
const RANGE = 10_000_000;

function fitRange(): string {
  const range = once("range", () => {
    let ops = 0;
    let primes = 0;
    for (let x = 0; x <= RANGE; x++) {
      const c = countRun(x);
      ops += c.divisions;
      if (c.prime) primes++;
    }
    const sieve = sieveCounted(RANGE);
    if (sieve.primes.length !== primes) {
      throw new Error("두 절차의 소수 개수가 다르다");
    }
    return { ops, primes, sieve: sieve.ops };
  });
  // 수 하나를 체로 물으면 체 배열 n + 1 칸을 만들고(쓰기 n + 1 번) 2 부터 n 까지 모으며 읽는다(n − 1 번).
  // 체 편의 총식 2n + ⌊√n⌋ + W(n) − 1 가운데 이 두 몫만 더한 값이라 실제 기본 연산은 이보다 많다.
  const sieveFloor = 2 * WORST;
  const ours = countOf(WORST).divisions;
  const rows = [
    [
      `${num(RANGE)} 이하의 소수 전부`,
      num(range.ops),
      num(range.sieve),
      num(RANGE + 1),
    ],
    [
      `수 ${num(WORST)} 하나`,
      num(ours),
      `${num(sieveFloor)} 넘게`,
      num(WORST + 1),
    ],
  ];
  return block(
    md(
      [
        "구하는 것",
        "시행 나눗셈의 기본 연산",
        "에라토스테네스의 체의 기본 연산",
        "체 배열 칸",
      ],
      rows,
      [1, 2, 3],
    ),
    `${num(RANGE)} 이하에서는 두 절차가 같은 소수 ${num(range.primes)} 개를 냈고, 체의 기본 연산이 시행 나눗셈의 ${(range.ops / range.sieve).toFixed(1)} 분의 1 입니다. 수 하나를 물을 때는 반대로 체가 칸을 만들고 모으는 몫만으로 시행 나눗셈의 ${num(Math.floor(sieveFloor / ours))} 배가 넘습니다.`,
  );
}

const ALT_KEYS = [
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

function altCounts(): string {
  const ours: Record<string, number> = cases["√n 까지의 시행 나눗셈"]();
  const mr: Record<string, number> = cases["결정론적 밀러-라빈"]();
  const rows = ALT_KEYS.map((key) => {
    const a = ours[key] ?? 0;
    const b = mr[key] ?? 0;
    let fewer = "같다";
    if (a < b) fewer = "시행 나눗셈";
    if (a > b) fewer = "밀러-라빈";
    return [key, num(a), num(b), fewer];
  });
  return block(
    md(["입력", "시행 나눗셈", "결정론적 밀러-라빈", "적은 쪽"], rows, [1, 2]),
    `「마지막으로 앞선 자리」는 소수 ${num(ours["마지막으로 앞선 소수"] ?? 0)} 이고 「그 다음 소수」는 ${num(ours["그 다음 소수"] ?? 0)} 입니다. 5 부터 ${num(SWEEP_LIMIT)} 까지의 소수를 전부 재서 찾았습니다. 두 설계가 0 부터 5,000 까지와 다섯 규모의 소수에서 ${verdictsAgree() ? "모두 같은 답을 냅니다" : "다른 답을 내는 입력이 있습니다"}.`,
  );
}

function altFlip(): string {
  const last = lastAhead();
  const next = nextPrime(last);
  const rows = [last, next].map((n) => {
    const root = Math.floor(Math.sqrt(n));
    const m = millerOps(n);
    return [
      num(n),
      `2 + C(${num(root)}) = 2 + ${num(candidateCount(root))} = ${num(countRun(n).divisions)}`,
      `1 + ${num(m.split)} + ${m.perBase.map(num).join(" + ")} = ${num(m.ops)}`,
    ];
  });
  return block(
    md(
      [
        "소수 n",
        "시행 나눗셈",
        "밀러-라빈의 내역(n mod 2 · n − 1 가르기 · 밑마다)",
      ],
      rows,
      [0],
    ),
    `두 소수 모두 밀러-라빈이 밑 ${basesFor(BigInt(last)).join(" · ")}${을를(String(basesFor(BigInt(last)).at(-1)))} 쓰고, 밑마다의 값은 a mod n · 밑 mod n · 모듈러 곱셈을 센 것입니다.`,
  );
}

function mathDefine(): string {
  const xs = Array.from({ length: 9 }, (_, k) => k + 5);
  const inD = new Set(candidatesUpTo(13));
  return block(
    md(
      ["d", ...xs.map(num)],
      [
        ["d mod 6", ...xs.map((d) => num(d % 6))],
        ["D(13) 에 드는가", ...xs.map((d) => (inD.has(d) ? "든다" : "—"))],
      ],
    ),
    `D(13) = {${[...inD].join(", ")}} 이고 C(13) = ${num(inD.size)} 입니다.`,
  );
}

function mathCheck(): string {
  const rows: string[][] = [];
  for (const x of [5, 7, 11, 13, 25, 31]) {
    const c = candidatesUpTo(x);
    rows.push([num(x), c.join(" "), num(c.length), num(candidateCount(x))]);
  }
  for (const x of [99, 999, 31_622, 999_999]) {
    rows.push([
      num(x),
      "…",
      num(candidatesUpTo(x).length),
      num(candidateCount(x)),
    ]);
  }
  const same = rows.every((r) => r[2] === r[3]);
  return block(
    md(["x", "후보 목록", "실제로 센 수", "닫힌 형태"], rows, [0, 2, 3]),
    `${num(rows.length)} 줄 ${same ? "모두 실제로 센 수와 닫힌 형태가 같습니다" : "가운데 어긋나는 줄이 있습니다"}.`,
  );
}

function mathParts(): string {
  const xs = [13, 25, 31];
  const rows = xs.map((x) => {
    const c = candidatesUpTo(x);
    return [
      num(x),
      list(c.filter((d) => d % 6 === 5)),
      `⌊${x + 1}/6⌋ = ${Math.floor((x + 1) / 6)}`,
      list(c.filter((d) => d % 6 === 1)),
      `⌊${x - 1}/6⌋ = ${Math.floor((x - 1) / 6)}`,
    ];
  });
  const ok = xs.every((x) => {
    const c = candidatesUpTo(x);
    return (
      c.filter((d) => d % 6 === 5).length === Math.floor((x + 1) / 6) &&
      c.filter((d) => d % 6 === 1).length === Math.floor((x - 1) / 6)
    );
  });
  return block(
    md(
      [
        "x",
        "나머지가 5 인 후보",
        "⌊(x + 1)/6⌋",
        "나머지가 1 인 후보",
        "⌊(x − 1)/6⌋",
      ],
      rows,
      [0],
    ),
    `세 x ${ok ? "모두" : "가운데 일부만"} 무리마다 후보 개수가 옆 칸의 식이 낸 값과 같습니다.`,
  );
}

function mathCode(): string {
  return `// 위 식을 그대로 옮긴 조각. 후보를 만들지 않고 개수만 센다.
const candidateCount = (x: number): number =>
  Math.floor((x + 1) / 6) + Math.floor((x - 1) / 6);

candidateCount(13); // → ${candidateCount(13)}
candidateCount(999_999); // → ${candidateCount(999_999)}`;
}

function mathScale(): string {
  const root = Math.floor(Math.sqrt(WORST));
  const gaps = new Set<number>();
  const rows = [1, 2, 6, 30, 210, 2310].map((M) => {
    const phi = wheelResidues(M).length;
    const byFormula = Math.round((phi / M) * root);
    const byRun = wheelRun(WORST, M).divisions - wheelPrimes(M).length;
    gaps.add(byFormula - byRun);
    return [
      num(M),
      num(phi),
      (phi / M).toFixed(4),
      num(byFormula),
      num(byRun),
      num(byFormula - byRun),
    ];
  });
  return block(
    md(
      [
        "바퀴 M",
        "φ(M)",
        "φ(M)/M",
        "식이 낸 후보 수",
        "실제로 나눈 후보 수",
        "차이",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    `x = ⌊√n⌋ = ${num(root)} 이고 n = ${num(WORST)} 입니다. 여섯 바퀴 모두 차이가 ${[...gaps].map(num).join(" · ")} 입니다.`,
  );
}

function mathProduct(): string {
  const primes = [2, 3, 5, 7, 11];
  let M = 1;
  let density = 1;
  const rows = primes.map((p, r) => {
    const before = density;
    M *= p;
    density *= 1 - 1 / p;
    return [
      num(r + 1),
      num(M),
      reduce(wheelResidues(M).length, M),
      density.toFixed(4),
      (before - density).toFixed(4),
    ];
  });
  return block(
    md(
      ["r", "M", "φ(M)/M", "곱으로 계산한 값", "직전보다 준 밀도"],
      rows,
      [0, 1, 3, 4],
    ),
    "소수를 하나 더 걸러 얻는 밀도 감소가 줄마다 작아집니다.",
  );
}

function mathLimit(): string {
  const root = Math.floor(Math.sqrt(WORST));
  const c = candidateCount(root);
  const rows = [
    ["2 부터 n − 1 까지 나눠 보기", num(naiveDivisions(WORST))],
    ["바퀴 M = 6 — 2 + C(x)", num(2 + c)],
    ["바퀴 M = 2,310", num(wheelRun(WORST, 2310).divisions)],
  ];
  return block(
    md(["방법", `n = ${num(WORST)} 의 나눗셈`], rows, [1]),
    `x = ${num(root)} 에서 C(x) = ${num(c)} 이고, 정의대로 나눠 보는 판의 ${num(Math.round(naiveDivisions(WORST) / (2 + c)))} 분의 1 입니다.`,
  );
}

/* ───────────────────────── 불변식 ───────────────────────── */

function invariantStates(): string {
  const tr = traceRun(WALK);
  const rows: string[][] = [];
  tr.events.forEach((e, k) => {
    if (e.kind !== "cond") return;
    const direct: number[] = [];
    const multiples: number[] = [];
    for (let m = 2; m < e.d; m++) {
      if (tr.divided.includes(m)) direct.push(m);
      else multiples.push(m);
    }
    rows.push([
      `T${k + 1}`,
      num(e.d),
      `2 … ${e.d - 1}`,
      list(direct),
      list(multiples),
    ]);
  });
  const clean = tr.events.every((e) => {
    if (e.kind !== "cond") return true;
    for (let m = 2; m < e.d; m++) if (WALK % m === 0) return false;
    return true;
  });
  return block(
    md(
      [
        "걸음",
        "d",
        "보장되는 범위",
        "직접 나눠 본 수",
        "2 나 3 의 배수라 건너뛴 수",
      ],
      rows,
      [1],
    ),
    `${num(rows.length)} 걸음 모두 보장되는 범위의 수 가운데 ${WALK}${을를(WALK)} 나누는 수가 ${clean ? "없습니다" : "있습니다"}.`,
  );
}

function invariantEdges(): string {
  const rows = [4, 25, 26, 29].map((n) => {
    const tr = traceRun(n);
    const conds = tr.events.filter((e) => e.kind === "cond");
    const last = conds.at(-1);
    return [
      num(n),
      conds.length === 0 ? "사전 판정" : "루프",
      conds.length === 0 ? "판정하지 않는다" : `${conds.length} 번 판정`,
      last?.kind === "cond"
        ? `${last.square} ${last.holds ? "≤" : ">"} ${n}`
        : "—",
      yn(tr.prime),
    ];
  });
  return md(["n", "답한 갈래", "루프 조건", "마지막 조건", "답"], rows, [0]);
}

function strictLess(): string {
  const ns = [25, 49, 121, 169, WALK, 97];
  const wrong: number[] = [];
  for (let n = 0; n <= 1_000; n++) {
    if (STRICT_LESS.isPrimeTrial(n) !== isPrimeTrial(n)) wrong.push(n);
  }
  assertBreaks(STRICT_LESS, wrong.length);
  const squares = wrong.every((n) => {
    const r = Math.round(Math.sqrt(n));
    return r * r === n && byDefinition(r);
  });
  const tail =
    wrong.length === 0
      ? "0 부터 1,000 까지 두 판의 답이 갈리는 입력은 없습니다."
      : `0 부터 1,000 까지 두 판의 답이 갈리는 입력은 ${list(wrong)} 이고, ${squares ? "모두 소수의 제곱입니다" : "소수의 제곱이 아닌 수가 섞여 있습니다"}.`;
  return block(
    md(
      ["입력 n", "정본", "등호를 뺀 판", "정의대로", "두 답의 판정"],
      contrastRows(ns, STRICT_LESS),
      [0],
    ),
    tail,
  );
}

/* ───────────────────────── 비용 계산 ───────────────────────── */

function perfCount(): string {
  const tr = traceRun(WALK);
  const conds: string[] = [];
  const divs: string[] = [];
  tr.events.forEach((e, k) => {
    if (e.kind === "cond") conds.push(`T${k + 1}`);
    if (e.kind === "divide") divs.push(`T${k + 1}`);
  });
  const f = smallestFactor(WALK);
  const total = countRun(WALK).divisions;
  const rows = [
    ["① ② 2 보다 작은가 · 2 나 3 인가", "T1", "0"],
    ["③ n mod 2 · n mod 3", "T2", "2"],
    ["④ 루프 조건 d × d ≤ n", conds.join(" · "), "0"],
    ["⑤ n mod d", divs.join(" · "), num(divs.length)],
    ["합계", "", num(total)],
  ];
  return block(
    md(["갈래", "걸음", "나눗셈"], rows, [2]),
    `합성수 항의 식 2 + C(f) 에 가장 작은 약수 f = ${f}${을를(f)} 넣으면 2 + ${num(candidateCount(f))} = ${num(2 + candidateCount(f))} 이고, 실제로 센 ${num(total)}${과와(total)} 같습니다.`,
  );
}

/** 총식 — 소수면 `2 + C(⌊√n⌋)`, 가장 작은 약수가 2 · 3 이면 1 · 2, 그 밖의 합성수면 `2 + C(f)`. */
function byFormula(n: number): number {
  const f = smallestFactor(n);
  if (f === -1) return 2 + candidateCount(Math.floor(Math.sqrt(n)));
  if (f === 2) return 1;
  if (f === 3) return 2;
  return 2 + candidateCount(f);
}

function perfFormula(): string {
  const ns = [
    WALK,
    97,
    SCALES[0] as number,
    SCALES[2] as number,
    999_983 * 999_983,
    SCALES[3] as number,
    WORST,
  ];
  const rows = ns.map((n) => {
    const f = smallestFactor(n);
    return [
      num(n),
      yn(isPrimeTrial(n)),
      f === -1 ? "없음" : num(f),
      num(byFormula(n)),
      num(countOf(n).divisions),
    ];
  });
  const same = ns.every((n) => byFormula(n) === countOf(n).divisions);
  return block(
    md(
      [
        "입력 n",
        "정본",
        "가장 작은 약수 f",
        "식이 낸 나눗셈",
        "실행이 센 나눗셈",
      ],
      rows,
      [0, 2, 3, 4],
    ),
    `${num(ns.length)} 입력 ${same ? "모두 식과 실행이 같습니다" : "가운데 식과 실행이 어긋나는 입력이 있습니다"}.`,
  );
}

function perfTotal(): string {
  const d = countOf(WORST).divisions;
  return md(
    ["입력 n", "나눗셈", "시간(1 초에 1 억 번)", "저장 칸"],
    [[num(WORST), num(d), seconds(d), "3"]],
    [0, 1, 2, 3],
  );
}

function worstShapes(): string {
  const square = 999_983 * 999_983;
  const shapes: [string, number][] = [
    ["2 보다 작다", -7],
    ["짝수", 999_999_999_988],
    ["3 의 배수", 999_999_999_987],
    ["작은 약수를 가진 합성수", 999_999_999_985],
    ["큰 소수의 제곱", square],
    ["과제 규모 아래 가장 큰 소수", WORST],
  ];
  const rows = shapes.map(([shape, n]) => {
    const f = smallestFactor(n);
    return [
      shape,
      num(n),
      yn(isPrimeTrial(n)),
      f === -1 ? "없음" : num(f),
      num(countOf(n).divisions),
    ];
  });
  const near = shapes.slice(1).map(([, n]) => countOf(n).divisions);
  const sq = countOf(square).divisions;
  return block(
    md(["입력 모양", "n", "정본", "가장 작은 약수", "나눗셈"], rows, [1, 3, 4]),
    `10^12 근처의 다섯 줄에서 나눗셈이 ${num(Math.min(...near))} 번부터 ${num(Math.max(...near))} 번까지 갈립니다. 큰 소수의 제곱은 합성수인데도 ${num(sq)} 번을 나눠, 가장 큰 소수보다 ${num(countOf(WORST).divisions - sq)} 번 적을 뿐입니다.`,
  );
}

/* ───────────────────────── 스스로 점검하기 ───────────────────────── */

function selfcheck221(): string {
  const n = 221;
  const tr = traceRun(n);
  const rows = tr.divided.map((d) => [num(d), num(n % d)]);
  const f = smallestFactor(n);
  return block(
    md(["나눠 본 수 d", `${n} mod d`], rows, [0, 1]),
    `나눗셈 ${num(tr.divided.length)} 번째인 ${f} 에서 나머지가 0 이라 답은 ${tr.prime} 이고, 식 2 + C(${f}) = 2 + ${num(candidateCount(f))} = ${num(byFormula(n))}${과와(byFormula(n))} 같습니다.`,
  );
}

/* ───────────────────────── 증명 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  "concept-divided": conceptDivided,
  "concept-scale": conceptScale,
  "origin-naive": originNaive,
  "origin-pairs": originPairs,
  "origin-root": originRoot,
  "origin-waste": originWaste,
  "origin-three-ways": originThreeWays,
  "build-pre": buildPre,
  "build-steps": buildSteps,
  "build-stop": buildStop,
  "build-safe": buildSafe,
  "build-wheel-sweep": buildWheelSweep,
  "walk-input": walkInput,
  "walk-pre": walkPre,
  "mutant-no-preskip": noPreskip,
  "walk-loop": walkLoop,
  "mutant-fixed-step": fixedStep,
  "walk-trace": walkTrace,
  "final-calls": finalCalls,
  "related-wheel": relatedWheel,
  "fit-range": fitRange,
  "alt-counts": altCounts,
  "alt-flip": altFlip,
  "math-define": mathDefine,
  "math-check": mathCheck,
  "math-parts": mathParts,
  "math-code": mathCode,
  "math-scale": mathScale,
  "math-product": mathProduct,
  "math-limit": mathLimit,
  "invariant-states": invariantStates,
  "invariant-edges": invariantEdges,
  "mutant-strict-less": strictLess,
  "perf-count": perfCount,
  "perf-formula": perfFormula,
  "perf-total": perfTotal,
  "worst-shapes": worstShapes,
  "selfcheck-221": selfcheck221,
};
