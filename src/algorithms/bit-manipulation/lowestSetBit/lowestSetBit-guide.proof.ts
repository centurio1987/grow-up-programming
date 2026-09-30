/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.md
 *
 * **자리마다 더하는 사본이 있다.** 정본은 `x & -x` 한 줄이라 뒤집은 값과 자리올림을 내보내지 않는다.
 * 그래서 `~x` 에 1 을 자리 단위로 더하는 사본(`addOne`)이 걸음 값을 내고, 그 결과가 정본이 쓰는 `-x`
 * 와 같은지, 마지막 AND 가 정본의 답과 같은지를 부를 때마다 확인한다. **답이 맞는지는 사본이 아니라
 * 정본이 진다.**
 *
 * **비용을 세는 기준은 하나다.** 기본 연산은 부호 뒤집기 · 비트 AND · 비트 뒤집기 · 오른쪽 밀기 ·
 * 왼쪽 밀기 · 비교 · 대입 · 증가 한 번씩이다. 입력 밖에 잡는 칸은 함수 본문이 새로 두는 이름(반복 번호
 * 포함)의 수다. 정본의 연산 수와 칸 수도 손으로 적지 않고 정본 소스에서 센다(`refShape`).
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 가 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 알아낸다.
 *
 * **큰 입력은 값만 센다.** `1 … N` 을 도는 블록은 걸음 기록을 남기지 않는 `scanOps` 를 쓴다 — 기록을
 * 호출마다 남기면 `N = 10^7` 에서 메모리가 모자란다.
 */
import { readFileSync } from "node:fs";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { lowestSetBit } from "./lowestSetBit-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 소수 한 자리. */
const fixed1 = (x: number): string =>
  (Math.round(x * 10) / 10).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 초당 단순 연산 수의 어림값. */
const OPS_PER_SEC = 100_000_000;

/** 연산 횟수를 초로. 0.01 초보다 작으면 자릿수가 다 0 이 되므로 그렇게 적는다. */
export const seconds = (ops: number): string => {
  const s = ops / OPS_PER_SEC;
  return s < 0.01 ? "0.01 초 미만" : `${fixed2(s)} 초`;
};

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/** 그림에 쓰는 자리 폭. 32 비트 중 아래 여덟 자리만 그린다. */
export const W = 8;

/** 자리 폭. */
export const WIDTH = 32;

/** 값 `v` 의 자리 `j` 비트. 32 비트 부호 없는 값으로 읽는다. */
export const bitAt = (v: number, j: number): number =>
  Math.floor((v >>> 0) / 2 ** j) % 2;

/** 아래 `w` 자리만 적은 고정 폭 이진 표기. 음수는 32 비트 2 의 보수로 읽는다. */
export function bits(v: number, w: number = W): string {
  let out = "";
  for (let j = w - 1; j >= 0; j--) out += String(bitAt(v, j));
  return out;
}

/** `00101000₂` 꼴. */
export const bin = (v: number, w: number = W): string => `${bits(v, w)}₂`;

/** 32 비트 부호 있는 정수의 끝. */
export const INT32_MIN = -(2 ** 31);
export const INT32_MAX = 2 ** 31 - 1;

/** 한국어 수 이름 — 표 아래 문장에서 줄 수를 적는다. */
const KOR = [
  "영",
  "한",
  "두",
  "세",
  "네",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];
export const kor = (n: number): string => KOR[n] ?? String(n);

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 「수행으로 알아보는 알고리즘」과 「아이디어 상세」가 쓰는 입력. 최하위 1 비트가 자리 3 이라 자리올림이
 * 자리 0 · 1 · 2 를 지나 자리 3 에서 멈추는 것이 세 걸음으로 보이고, 자리 3 위에 1 비트가 하나 더
 * 있어(자리 5) 위 구간이 뒤집힌 채로 남는 것이 함께 보이며, 값과 답이 아래 여덟 자리 안에 들어온다.
 */
export const WALK = 40;

/** 호출 횟수의 규모. 이 연산은 반복문 안에서 불리므로 규모를 호출 수로 적는다. */
export const CALLS = 10_000_000;

/** 자리와 부호가 서로 다른 사례. */
const SAMPLES: number[] = [WALK, 12, 8, 1, 0, -12];

/** 후보 식을 시험하는 입력. */
const PROBE: number[] = [WALK, 12, 1, 0, -12];

/** 전수 대조 범위. `0 ≤ x < 2^16` 이다. */
const SWEEP = 2 ** 16;

/** 32 비트 경계에 놓인 사례. */
const EDGES: [string, number][] = [
  ["값이 0", 0],
  ["1 비트가 자리 0 하나", 1],
  ["1 비트가 전부 켜짐", -1],
  ["전개 입력", WALK],
  ["음수", -12],
  ["범위의 위쪽 끝", INT32_MAX],
  ["범위의 아래쪽 끝", INT32_MIN],
  ["자리 30 하나", 2 ** 30],
];

/* ────────────────────────── 정의와 세는 사본 ────────────────────────── */

/**
 * `x` 를 2 로 나눌 수 있는 최대 횟수 — 곧 최하위 1 비트의 자리 `p` 다. 비트 연산을 안 쓰므로 32 비트
 * 자르기와 무관하다. `x = 0` 이면 정해지지 않아 `null` 이다.
 */
export function nu(x: number): number | null {
  if (x === 0) return null;
  let n = 0;
  for (let t = Math.abs(x); t % 2 === 0; t /= 2) n++;
  return n;
}

/** 정의를 그대로 옮긴 답 — `2^p` 를 32 비트 부호 있는 정수로 적은 값. `x = 0` 이면 0. */
function byDefinition(x: number): number {
  const p = nu(x);
  return p === null ? 0 : (2 ** p) | 0;
}

/** 정의를 32 비트로 자르지 않고 적은 답 — 32 비트 밖의 값에서 쓴다. */
function byDefinitionExact(x: number): number {
  const p = nu(x);
  return p === null ? 0 : 2 ** p;
}

/** 1 비트의 개수(32 비트). */
const popcount = (v: number): number => {
  let c = 0;
  for (let j = 0; j < WIDTH; j++) c += bitAt(v, j);
  return c;
};

/** `n` 의 이진 표기에 있는 1 의 개수. */
function s2(n: number): number {
  let c = 0;
  for (let t = n; t > 0; t = Math.floor(t / 2)) c += t % 2;
  return c;
}

/** 자리마다 검사 한 번의 기록. */
interface Check {
  readonly j: number;
  readonly shifted: number;
  readonly bit: number;
  readonly opsSoFar: number;
}

/**
 * **가장 단순한 방법** — 자리 0 부터 차례로 1 인지 검사한다. 보조 자료구조가 하나도 없어서 이보다
 * 단순한 절차를 세울 수 없다. 본문의 `scanEachBit` 와 같은 절차에 기본 연산을 세는 자리만 덧붙였다.
 */
function scanEachBit(x: number): {
  answer: number;
  ops: number;
  checks: Check[];
} {
  let ops = 1; // j = 0 대입
  const checks: Check[] = [];
  for (let j = 0; j < WIDTH; j++) {
    ops += 4; // j < 32 비교 · 오른쪽 밀기 · AND · === 1 비교
    const shifted = x >>> j;
    const bit = shifted & 1;
    if (bit === 1) {
      ops += 1; // 1 << j
      checks.push({ j, shifted, bit, opsSoFar: ops });
      return { answer: 1 << j, ops, checks };
    }
    checks.push({ j, shifted, bit, opsSoFar: ops });
    ops += 1; // j++
  }
  return { answer: 0, ops: ops + 1, checks }; // 마지막 j < 32 비교
}

/** 같은 절차의 기본 연산만 세는 가벼운 판 — 큰 입력에서 쓴다. 기록을 남기지 않는다. */
export function scanOps(x: number): number {
  let ops = 1;
  for (let j = 0; j < WIDTH; j++) {
    ops += 4;
    if (((x >>> j) & 1) === 1) return ops + 1;
    ops += 1;
  }
  return ops + 1;
}

/** 닫힌 형태. `x ≠ 0` 이면 `5p + 6` 이다. */
const scanClosed = (p: number): number => 5 * p + 6;

/* ───────────── 정본의 모양 — 연산 수와 칸 수를 소스에서 센다 ───────────── */

const REF = new URL("./lowestSetBit-guide.ref.ts", import.meta.url).pathname;

/** 식의 연산 수 — 연산자 글자(`& | ^ ~ + -`)를 센다. 괄호와 피연산자는 세지 않는다. */
export const opsOf = (expr: string): number =>
  [...expr].filter((c) => "&|^~+-".includes(c)).length;

/**
 * 정본 함수 본문에서 센 모양 — 반환식의 연산자 · 새로 두는 이름 · 반복문과 조건문의 수. 정본이 바뀌면
 * 이 값도 따라 바뀐다. 본문이 「연산 2 번」을 손으로 적지 않게 하는 자리다.
 */
export function refShape(): {
  expr: string;
  ops: number;
  negations: number;
  ands: number;
  names: number;
  branches: number;
} {
  const src = readFileSync(REF, "utf8");
  const body = src.slice(src.indexOf("export function lowestSetBit"));
  const code = body
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l))
    .join("\n");
  const ret = [...code.matchAll(/return (.+);/g)];
  if (ret.length !== 1) throw new Error("정본의 반환문이 하나가 아니다");
  const expr = (ret[0] as RegExpMatchArray)[1] as string;
  return {
    expr,
    ops: opsOf(expr),
    negations: [...expr].filter((c) => c === "-").length,
    ands: [...expr].filter((c) => c === "&").length,
    names: [...code.matchAll(/\b(let|const|var)\b/g)].length,
    branches: [...code.matchAll(/\b(for|while|if|switch)\b|\?/g)].length,
  };
}

/** 정본이 호출 한 번에 쓰는 기본 연산 수. */
export const REF_OPS = refShape().ops;

/* ────────────────── 자리마다 더하기 — `~x + 1` 을 펼친다 ────────────────── */

/** `~x` 에 1 을 더하는 덧셈의 자리 하나. */
export interface CarryRec {
  readonly j: number;
  readonly flipBit: number;
  readonly carryIn: number;
  readonly out: number;
  readonly carryOut: number;
}

/**
 * `~x` 에 1 을 자리 0 부터 31 까지 더한다. 결과를 32 비트 정수로 모아 정본이 쓰는 `-x` 와 대조한다 —
 * 어긋나면 던진다. `stop` 은 자리올림이 처음 0 이 된 자리다(`x = 0` 이면 없다).
 */
export function addOne(x: number): {
  flipped: number;
  recs: CarryRec[];
  negated: number;
  carryOut32: number;
  stop: number | null;
} {
  const flipped = ~x;
  const recs: CarryRec[] = [];
  let carry = 1;
  let assembled = 0;
  let stop: number | null = null;
  for (let j = 0; j < WIDTH; j++) {
    const flipBit = bitAt(flipped, j);
    const sum = flipBit + carry;
    const out = sum % 2;
    const carryOut = sum >= 2 ? 1 : 0;
    recs.push({ j, flipBit, carryIn: carry, out, carryOut });
    if (carry === 1 && carryOut === 0) stop = j;
    assembled += out * 2 ** j;
    carry = carryOut;
  }
  const negated = assembled | 0;
  if (negated !== (-x | 0))
    throw new Error(`자리마다 더한 값이 -x 와 다르다 — x=${x}`);
  return { flipped, recs, negated, carryOut32: carry, stop };
}

/* ────────────────────────── 걸음 ────────────────────────── */

/** 전개의 걸음 하나. 그림 사이드카와 이 파일이 같은 걸음을 쓴다. */
export interface WalkStep {
  readonly id: string;
  readonly kind: "input" | "flip" | "carry" | "rest" | "and" | "return";
  /** 갈래 라벨 — 전체 코드 주석의 ①②③. 입력 걸음은 「—」. */
  readonly branch: "—" | "①" | "②" | "③";
  /** `carry` 는 더하는 자리, `rest` 는 자리올림이 0 이 된 뒤의 첫 자리. */
  readonly j?: number;
  readonly rec?: CarryRec;
}

/** 전개의 걸음 — 입력 · 뒤집기 · 자리올림이 멈출 때까지의 자리마다 · 나머지 자리 · AND · 반환. */
export function walkPlan(x: number = WALK): {
  steps: WalkStep[];
  flipped: number;
  negated: number;
  answer: number;
  p: number | null;
} {
  const add = addOne(x);
  const answer = lowestSetBit(x);
  if ((x & add.negated) !== answer)
    throw new Error("자리마다 더한 -x 로 AND 한 값이 정본의 답과 다르다");
  const steps: WalkStep[] = [
    { id: "T1", kind: "input", branch: "—" },
    { id: "T2", kind: "flip", branch: "①" },
  ];
  let t = 3;
  for (const rec of add.recs) {
    if (rec.carryIn === 0) break;
    steps.push({ id: `T${t++}`, kind: "carry", branch: "②", j: rec.j, rec });
  }
  if (add.stop !== null && add.stop < WIDTH - 1)
    steps.push({ id: `T${t++}`, kind: "rest", branch: "②", j: add.stop + 1 });
  steps.push({ id: `T${t++}`, kind: "and", branch: "③" });
  steps.push({ id: `T${t++}`, kind: "return", branch: "③" });
  return {
    steps,
    flipped: add.flipped,
    negated: add.negated,
    answer,
    p: nu(x),
  };
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { lowestSetBit: (x: number) => number };

/**
 * **1 을 더하지 않은 사본.** 불변식 「`-x` 는 자리 `p` 와 그 아래가 `x` 와 같다」를 지키던 자리다.
 * 1 을 안 더하면 뒤집은 값이 그대로 남고, 뒤집은 값은 모든 자리에서 `x` 의 반대라 AND 가 어느 자리도
 * 못 남긴다. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noCarry = await loadMutant<Impl>(REF, {
  swap: [/return x & -x;/, "return x & ~x;"],
});

/** 중화 실행이면 변이 모듈의 함수가 정본과 같은 객체다. */
const 중화됨 = noCarry.lowestSetBit === lowestSetBit;

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 사본과 정의가 정본과 같은 답을 내는지 — 이 파일을 읽을 때마다 확인한다. */
function 자기대조(): void {
  for (let x = 0; x < SWEEP; x++) {
    if (lowestSetBit(x) !== byDefinition(x))
      throw new Error(`정본과 정의가 다르다 — x=${x}`);
    const s = scanEachBit(x);
    if (s.answer !== lowestSetBit(x))
      throw new Error(`자리마다 검사와 정본이 다르다 — x=${x}`);
    if (s.ops !== scanOps(x))
      throw new Error(`두 세는 판의 기본 연산이 다르다 — x=${x}`);
  }
  for (const [, x] of EDGES) {
    addOne(x);
    if (lowestSetBit(x) !== byDefinition(x))
      throw new Error(`정본과 정의가 다르다 — x=${x}`);
  }
}
자기대조();

/* ────────────────────────── 사례 이름 ────────────────────────── */

const label = (x: number): string => (x === WALK ? `전개 입력 ${x}` : num(x));

const same = (a: number, b: number): string => (a === b ? "같다" : "어긋난다");

const pOf = (x: number): string => {
  const p = nu(x);
  return p === null ? "없음" : String(p);
};

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — `x & -x` 의 1 비트가 하나이고 그 자리가 `p` 다. */
  "concept-samples": () => {
    let nonzero = 0;
    const rows = SAMPLES.map((x) => {
      const r = lowestSetBit(x);
      const p = nu(x);
      if (p !== null) {
        nonzero++;
        if (popcount(r) !== 1 || bitAt(r, p) !== 1)
          throw new Error(`x & -x 의 1 비트가 자리 p 하나가 아니다 — x=${x}`);
      } else if (r !== 0) throw new Error("x = 0 인데 답이 0 이 아니다");
      return [String(x), bin(x), bin(-x), bin(r), String(r), pOf(x)];
    });
    return [
      table(
        [
          "x",
          "x 의 아래 여덟 자리",
          "-x 의 아래 여덟 자리",
          "x & -x 의 아래 여덟 자리",
          "x & -x",
          "최하위 1 비트의 자리 p",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `x 가 0 이 아닌 ${kor(nonzero)} 줄에서 x & -x 에는 1 비트가 하나씩 있고, 그 자리가 p 와 일치합니다. x 가 0 인 줄은 -x 도 0 이라 답이 0 입니다.`,
    ].join("\n");
  },

  /** `concept` — 정본이 쓰는 연산과 칸을 정본 소스에서 센다. */
  "concept-cost": () => {
    const s = refShape();
    return [
      table(
        ["정본이 쓰는 것", "수"],
        [
          ["부호 뒤집기 `-`", `${s.negations} 번`],
          ["비트 AND `&`", `${s.ands} 번`],
          ["반복문 · 조건문", `${s.branches} 개`],
          ["입력 밖에 새로 잡는 칸", `${s.names} 칸`],
        ],
        ["l", "r"],
      ),
      "",
      `정본 소스의 반환식 \`${s.expr}\` 에서 센 값입니다. 기본 연산은 모두 ${s.ops} 번이고, 어떤 입력이 들어와도 같은 연산을 실행합니다.`,
    ].join("\n");
  },

  /** `prereq` — 이 글이 쓰는 연산 몇 개를 실제로 계산한다. */
  "prereq-ops": () => {
    const flip = ~WALK;
    const neg = -WALK;
    if (flip + 1 !== neg) throw new Error("~x + 1 이 -x 가 아니다");
    const carry = 7 + 1;
    const rows: string[][] = [
      [
        "`40 & 12`",
        `${bin(40, 6)} 과 ${bin(12, 6)} 에서 둘 다 1 인 자리만 1`,
        `${40 & 12} (${bin(40 & 12, 6)})`,
      ],
      ["`~40`", "모든 자리를 뒤집는다", String(flip)],
      ["`~40 + 1`", "뒤집은 값에 1 을 더한다", String(flip + 1)],
      ["`-40`", "부호를 뒤집는다", String(neg)],
      [
        "`7 + 1`",
        `${bin(7, 4)} 에서 자리올림이 세 자리를 넘어간다`,
        `${carry} (${bin(carry, 4)})`,
      ],
      [
        "`(2 ** 31) | 0`",
        "자리 31 이 부호 자리로 읽힌다",
        String((2 ** 31) | 0),
      ],
      ["`(2 ** 32 + 8) | 0`", "자리 32 위가 잘린다", String((2 ** 32 + 8) | 0)],
    ];
    return [
      table(["식", "계산", "결과"], rows, ["l", "l", "r"]),
      "",
      `\`~40 + 1\` 과 \`-40\` 이 둘 다 ${neg} 입니다. 아래 두 줄은 비트 연산이 값을 먼저 32 비트 정수로 바꾼 뒤 계산한다는 것을 보입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 자리마다 검사하는 방법의 비용이 자리 번호를 따라간다. */
  "origin-scan-cost": () => {
    const rows = [0, 1, 2, 3, 15, 30, 31].map((p) => {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      const got = scanEachBit(x);
      if (got.answer !== lowestSetBit(x))
        throw new Error(`자리 ${p} 에서 두 방법의 답이 다르다`);
      if (got.ops !== scanClosed(p))
        throw new Error(`자리 ${p} 에서 센 값이 5p + 6 과 다르다`);
      return [
        String(p),
        num(x),
        num(got.ops),
        num(scanClosed(p)),
        num(got.ops * CALLS),
        seconds(got.ops * CALLS),
      ];
    });
    const zero = scanEachBit(0);
    rows.push([
      "없음",
      "0",
      num(zero.ops),
      "—",
      num(zero.ops * CALLS),
      seconds(zero.ops * CALLS),
    ]);
    return [
      table(
        [
          "자리 p",
          "x",
          "호출 한 번의 기본 연산",
          "5p + 6",
          `N = ${num(CALLS)} 번의 기본 연산`,
          "초당 1 억 번 기준",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `1 비트가 있는 ${kor(rows.length - 1)} 줄 모두 센 값과 5p + 6 이 일치합니다. x = 0 은 1 비트가 없어 자리 31 까지 다 검사하므로 ${num(zero.ops)} 번입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 전개 입력에서 자리마다 검사가 실제로 무엇을 되풀이하는가. */
  "origin-scan-walk": () => {
    const got = scanEachBit(WALK);
    const p = nu(WALK) as number;
    const rows = got.checks.map((c) => [
      String(c.j),
      `${c.shifted} (${bin(c.shifted)})`,
      String(c.bit),
      c.bit === 1
        ? `1 — \`1 << ${c.j}\`${을를(c.j)} 돌려준다`
        : "0 — 다음 자리로",
      String(c.opsSoFar),
    ]);
    return [
      table(["j", "x >>> j", "(x >>> j) & 1", "판정", "누적 기본 연산"], rows, [
        "r",
        "r",
        "r",
        "l",
        "r",
      ]),
      "",
      `j = ${p} 에서 1 을 만나 ${got.answer}${을를(got.answer)} 돌려줍니다. 기본 연산은 ${got.ops} 번이고, 그 앞의 검사 ${kor(p)} 번은 자리 ${p} 아래가 0 이라는 것을 한 자리씩 확인한 것입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 호출 수를 두 입력 모양으로 재서 계수를 나란히 놓는다. */
  "origin-two-shapes": () => {
    let sequential = 0;
    let sumNu = 0;
    for (let x = 1; x <= CALLS; x++) {
      sequential += scanOps(x);
      sumNu += nu(x) as number;
    }
    if (sequential !== 5 * sumNu + 6 * CALLS)
      throw new Error("1 부터 N 까지의 합이 5Σp + 6N 과 다르다");
    const worst = scanOps(INT32_MIN) * CALLS;
    const ref = REF_OPS * CALLS;
    const rows = [
      [
        `1 부터 ${num(CALLS)} 까지 한 번씩`,
        num(sequential),
        seconds(sequential),
        num(ref),
        seconds(ref),
      ],
      [
        `${num(INT32_MIN)} 만 ${num(CALLS)} 번`,
        num(worst),
        seconds(worst),
        num(ref),
        seconds(ref),
      ],
    ];
    return [
      table(
        [
          "넣는 값",
          "자리마다 검사의 기본 연산",
          "초당 1 억 번 기준",
          "x & -x 의 기본 연산",
          "초당 1 억 번 기준",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `호출 수가 같은데 자리마다 검사는 두 모양 사이에서 ${fixed1(worst / sequential)} 배 차이가 나고, x & -x 는 두 줄이 같은 값입니다. 1 부터 N 까지 넣었을 때 자리 p 를 모두 더하면 ${num(sumNu)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 후보 여섯 식을 같은 입력에 실행해 거른다. */
  "origin-candidates": () => {
    const exprs: [string, (x: number) => number][] = [
      ["x & ~x", (x) => x & ~x],
      ["x & (x - 1)", (x) => x & (x - 1)],
      ["x & (x + 1)", (x) => x & (x + 1)],
      ["x & ~(x - 1)", (x) => x & ~(x - 1)],
      ["x ^ (x & (x - 1))", (x) => x ^ (x & (x - 1))],
      ["x & -x", (x) => x & -x],
    ];
    const good: { name: string; ops: number }[] = [];
    const rows = exprs.map(([name, f]) => {
      let all = true;
      for (let x = 0; x < SWEEP; x++)
        if (f(x) !== lowestSetBit(x)) {
          all = false;
          break;
        }
      for (const [, x] of EDGES) if (f(x) !== lowestSetBit(x)) all = false;
      if (all) good.push({ name, ops: opsOf(name) });
      return [
        `\`${name}\``,
        String(opsOf(name)),
        ...PROBE.map((x) => String(f(x))),
        all ? "전부 맞음" : "틀림",
      ];
    });
    rows.push([
      "정의가 낸 답",
      "—",
      ...PROBE.map((x) => String(byDefinition(x))),
      "—",
    ]);
    const best = [...good].sort((a, b) => a.ops - b.ops)[0] as {
      name: string;
      ops: number;
    };
    return [
      table(
        [
          "식",
          "연산 수",
          ...PROBE.map((x) => `x = ${x}`),
          "0 이상 65,536 미만과 경계 여덟",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `마지막 열이 「전부 맞음」인 식은 ${kor(good.length)} 개이고, 그중 연산 수가 가장 적은 것은 \`${best.name}\` 로 ${best.ops} 번입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 자리 하나를 골라 이름에서 값까지 따라간다. */
  "build-read-one": () => {
    const x = WALK;
    const p = nu(x) as number;
    const j = 5;
    const xb = bitAt(x, j);
    const nb = bitAt(-x, j);
    if (!(j > p) || nb !== 1 - xb)
      throw new Error("자리 5 가 위 구간의 규칙을 따르지 않는다");
    const r = bitAt(lowestSetBit(x), j);
    return [
      table(
        ["읽는 순서", "값"],
        [
          ["고른 자리", `j = ${j}`],
          ["x 의 최하위 1 비트", `p = ${p}`],
          ["어느 구간인가", `j = ${j} > p = ${p} — 자리 p 위`],
          [`x 의 자리 ${j}`, String(xb)],
          ["위 구간의 규칙", "-x 의 비트는 x 의 비트의 반대"],
          [`-x 의 자리 ${j}`, `${nb} (-${x} = ${bin(-x)})`],
          [`x & -x 의 자리 ${j}`, String(r)],
        ],
        ["l", "l"],
      ),
      "",
      `자리 ${j}${은는(j)} p 보다 위라서 -x 의 비트가 x 의 비트 ${xb} 의 반대인 ${nb} 이고, 두 비트가 함께 1 이 아니라 x & -x 의 자리 ${j}${은는(j)} ${r} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 이웃한 자리끼리, 그리고 ~x 와의 관계. */
  "build-neighbors": () => {
    const x = WALK;
    const p = nu(x) as number;
    const diff: number[] = [];
    let above = 0;
    const rows: string[][] = [];
    for (let j = W - 1; j >= 0; j--) {
      const region = j < p ? "자리 p 아래" : j === p ? "자리 p" : "자리 p 위";
      const f = bitAt(~x, j);
      const n = bitAt(-x, j);
      if (f !== n) diff.push(j);
      else if (j > p) above++;
      rows.push([
        region,
        `자리 ${j}`,
        String(bitAt(x, j)),
        String(f),
        String(n),
        f === n ? "같음" : "다름",
      ]);
    }
    if (diff.some((j) => j > p))
      throw new Error("위 구간에서 ~x 와 -x 가 다르다");
    if (diff.length !== p + 1)
      throw new Error("자리 p 와 그 아래 중에 ~x 와 -x 가 같은 자리가 있다");
    return [
      table(["구간", "자리", "x", "~x", "-x", "~x 와 -x"], rows, [
        "l",
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `~x 와 -x 가 다른 자리는 자리 ${diff.join(" · ")}${으로(diff.at(-1) as number)}, 자리 p 와 그 아래뿐입니다. 자리 p 위의 ${kor(above)} 자리는 두 값이 일치합니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (e) — 먼저 떠올릴 법한 `x - 1` 의 모양과 같은 입력에서 비교한다. */
  "build-vs-minus-one": () => {
    const x = WALK;
    const p = nu(x) as number;
    const seg = (v: number, from: number, to: number): string => {
      let s = "";
      for (let j = from; j >= to; j--) s += String(bitAt(v, j));
      return s;
    };
    // 규칙 확인 — x - 1 은 자리 p 와 그 아래를 뒤집고 위를 둔다. -x 는 그 반대다.
    for (let j = 0; j < WIDTH; j++) {
      const xb = bitAt(x, j);
      const m = bitAt(x - 1, j);
      const n = bitAt(-x, j);
      if (j <= p ? m !== 1 - xb || n !== xb : m !== xb || n !== 1 - xb)
        throw new Error(`자리 ${j} 에서 두 값의 규칙이 어긋난다`);
    }
    const row = (name: string, v: number, and: string): string[] => [
      name,
      seg(v, W - 1, p + 1),
      seg(v, p, p),
      seg(v, p - 1, 0),
      and,
    ];
    const a = x & (x - 1);
    const b = x & -x;
    return [
      table(
        [
          "값",
          `자리 p 위 (${W - 1} ~ ${p + 1})`,
          `자리 p (${p})`,
          `자리 p 아래 (${p - 1} ~ 0)`,
          "x 와 AND 한 값",
        ],
        [
          row("`x`", x, "—"),
          row("`x - 1`", x - 1, String(a)),
          row("`-x`", -x, String(b)),
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `\`x - 1\` 은 자리 p 와 그 아래를 뒤집고 위를 그대로 두어서, x 와 AND 하면 자리 p 가 지워진 ${a}${이가(a)} 남습니다. \`-x\` 는 거꾸로 자리 p 와 그 아래를 x 와 같게 두고 위를 뒤집어서, AND 하면 자리 p 하나인 ${b}${이가(b)} 남습니다. 32 자리 전부에서 이 규칙을 확인했습니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 뒤집으면 자리 p 아래가 전부 1, 자리 p 가 0 이 된다. */
  "build-flip": () => {
    const xs = [WALK, 12, 1, -12, 0];
    let ok = 0;
    const rows = xs.map((x) => {
      const p = nu(x);
      const f = ~x;
      let below = "없음";
      let at = "—";
      if (p !== null) {
        let allOne = true;
        for (let j = 0; j < p; j++) if (bitAt(f, j) !== 1) allOne = false;
        if (!allOne || bitAt(f, p) !== 0)
          throw new Error(`뒤집은 값의 모양이 어긋난다 — x=${x}`);
        ok++;
        below = p === 0 ? "없음 (p = 0)" : `전부 1 (${p} 자리)`;
        at = "0";
      } else if (popcount(f) !== WIDTH)
        throw new Error("0 을 뒤집은 값이 32 자리 전부 1 이 아니다");
      return [String(x), pOf(x), bin(f), String(f), below, at];
    });
    return [
      table(
        [
          "x",
          "p",
          "~x 의 아래 여덟 자리",
          "~x",
          "~x 의 자리 p 아래",
          "~x 의 자리 p",
        ],
        rows,
        ["r", "r", "r", "r", "l", "r"],
      ),
      "",
      `x 가 0 이 아닌 ${kor(ok)} 줄 모두 ~x 의 자리 p 아래가 전부 1 이고 자리 p 가 0 입니다. x = 0 은 뒤집으면 32 자리 전부 1 인 ${~0} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 자리올림이 어디서 멈추는가를 경우마다. */
  "build-carry-cases": () => {
    const xs: [string, number][] = [
      ["쉬운 경우 — p = 0", 41],
      ["전개 입력", WALK],
      ["p = 30", 2 ** 30],
      ["가장 긴 경우 — p = 31", INT32_MIN],
      ["1 비트가 없다", 0],
    ];
    let withBit = 0;
    const rows = xs.map(([name, x]) => {
      const a = addOne(x);
      const passed = a.recs.filter(
        (r) => r.carryIn === 1 && r.carryOut === 1,
      ).length;
      if (a.stop !== nu(x)) throw new Error(`멈춘 자리가 p 와 다르다 — x=${x}`);
      if (a.stop !== null) withBit++;
      else if (a.carryOut32 !== 1 || a.negated !== 0)
        throw new Error("x = 0 의 자리올림이 밖으로 나가지 않았다");
      return [
        name,
        num(x),
        pOf(x),
        `${passed} 자리`,
        a.stop === null ? "없음" : `자리 ${a.stop}`,
        num(a.negated),
        String(a.carryOut32),
      ];
    });
    return [
      table(
        [
          "경우",
          "x",
          "p",
          "자리올림이 넘어간 자리",
          "자리올림이 멈춘 자리",
          "자리마다 더한 결과",
          "자리 31 밖으로 나간 자리올림",
        ],
        rows,
        ["l", "r", "r", "r", "l", "r", "r"],
      ),
      "",
      `1 비트가 있는 ${kor(withBit)} 줄 모두 자리올림이 멈춘 자리가 p 와 일치하고, ${kor(xs.length)} 줄 모두 자리마다 더한 결과가 -x 와 일치합니다. x = 0 만 자리올림이 32 자리를 다 넘어가 밖으로 나가고, 남은 32 자리가 전부 0 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 가장 긴 두 경우를 자리마다 적는다(같은 모양이 이어지는 자리는 묶는다). */
  "build-carry-long": () => {
    const rows: string[][] = [];
    const min = addOne(INT32_MIN);
    const zero = addOne(0);
    if (min.stop !== WIDTH - 1 || zero.stop !== null || zero.carryOut32 !== 1)
      throw new Error("가장 긴 두 경우의 모양이 어긋난다");
    for (const [x, a] of [
      [INT32_MIN, min],
      [0, zero],
    ] as const) {
      let start = 0;
      for (let k = 1; k <= a.recs.length; k++) {
        const prev = a.recs[k - 1] as CarryRec;
        const cur = a.recs[k];
        const sameShape =
          cur !== undefined &&
          cur.flipBit === prev.flipBit &&
          cur.carryIn === prev.carryIn &&
          cur.carryOut === prev.carryOut;
        if (sameShape) continue;
        const s = a.recs[start] as CarryRec;
        rows.push([
          num(x),
          start === k - 1 ? `자리 ${start}` : `자리 ${start} ~ ${k - 1}`,
          String(s.flipBit),
          String(s.carryIn),
          String(s.out),
          String(s.carryOut),
        ]);
        start = k;
      }
      rows.push([
        num(x),
        "자리 31 밖",
        "—",
        String(a.carryOut32),
        a.carryOut32 === 1 ? "버린다" : "—",
        "—",
      ]);
    }
    return [
      table(
        [
          "x",
          "자리",
          "~x 의 비트",
          "들어온 자리올림",
          "그 자리의 결과",
          "넘긴 자리올림",
        ],
        rows,
        ["r", "l", "r", "r", "l", "r"],
      ),
      "",
      `x = ${num(INT32_MIN)} 은 자리 0 부터 ${WIDTH - 2} 까지 자리올림이 넘어가고 자리 ${min.stop} 에서 멈춥니다. x = 0 은 32 자리 모두 1 + 1 이라 자리올림이 자리 31 밖으로 나가고, 32 비트 정수에는 그 자리가 없어 버려집니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — AND 가 경우마다 자리 p 하나를 남기는가. */
  "build-and-cases": () => {
    const xs: [string, number][] = [
      ["p = 0", 41],
      ["전개 입력", WALK],
      ["1 비트가 전부 켜짐", -1],
      ["p = 30", 2 ** 30],
      ["p = 31", INT32_MIN],
      ["1 비트가 없다", 0],
    ];
    const rows = xs.map(([name, x]) => {
      const r = lowestSetBit(x);
      const d = byDefinition(x);
      if (r !== d) throw new Error(`정본과 정의가 다르다 — x=${x}`);
      if (r < 0 && nu(x) !== 31)
        throw new Error("p = 31 이 아닌데 답이 음수다");
      return [name, num(x), pOf(x), num(r), num(d), same(r, d)];
    });
    let sweep = 0;
    for (let x = 0; x < SWEEP; x++)
      if (lowestSetBit(x) === byDefinition(x)) sweep++;
    let single = 0;
    for (let p = 0; p < WIDTH; p++) {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      if (lowestSetBit(x) === byDefinition(x)) single++;
      if (lowestSetBit(-x) === byDefinition(-x)) single++;
    }
    let big = 0;
    for (let x = 1; x <= CALLS; x++)
      if (lowestSetBit(x) === byDefinition(x)) big++;
    return [
      table(
        ["경우", "x", "p", "x & -x", "2^p 를 32 비트로 적은 값", "판정"],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      "입력을 빠짐없이 넣어 대조하면 이렇습니다.",
      "",
      table(
        ["대조한 입력", "맞은 값", "전체"],
        [
          ["0 이상 65,536 미만", num(sweep), num(SWEEP)],
          [
            "1 비트가 자리 p 하나뿐인 값과 그 부호를 뒤집은 값",
            num(single),
            num(2 * WIDTH),
          ],
          [`1 부터 ${num(CALLS)} 까지`, num(big), num(CALLS)],
        ],
        ["l", "r", "r"],
      ),
      "",
      "모든 줄에서 x & -x 가 정의대로 적은 2^p 와 일치합니다. p = 31 인 줄만 값이 음수인데, 자리 31 이 32 비트 정수의 부호 자리이기 때문입니다.",
    ].join("\n");
  },

  /** `deep.build` 전제 — 값이 32 비트 밖이면 자리가 잘린다. */
  "build-premise": () => {
    const xs: [string, number][] = [
      ["2^31 - 1 (범위의 끝)", INT32_MAX],
      ["2^32", 2 ** 32],
      ["2^32 + 8", 2 ** 32 + 8],
      ["2^33", 2 ** 33],
      ["2^40 + 2^35", 2 ** 40 + 2 ** 35],
    ];
    let bad = 0;
    const rows = xs.map(([name, x]) => {
      const d = byDefinitionExact(x);
      const r = lowestSetBit(x);
      if (r !== d) {
        bad++;
        if (r !== 0) throw new Error("잘린 값이 0 이 아니다");
      }
      return [name, num(x), num(d), num(r), same(r, d)];
    });
    if (lowestSetBit(2 ** 32 + 8) !== 8)
      throw new Error("2^32 + 8 의 답이 8 이 아니다");
    return [
      table(["x", "십진", "정의가 낸 답", "x & -x", "판정"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${kor(xs.length)} 줄 중 ${kor(bad)} 줄이 어긋납니다. 2^32 + 8 은 자리 32 가 잘려도 최하위 1 비트가 자리 3 에 남아서 답이 맞았고, 어긋난 ${kor(bad)} 줄은 1 비트가 모두 자리 32 위에 있어 잘린 뒤 0 이 남았습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 자리 p 만 남기는 세 식을 비교한다. */
  "build-choice": () => {
    const exprs: [string, (x: number) => number][] = [
      ["x & -x", (x) => x & -x],
      ["x & ~(x - 1)", (x) => x & ~(x - 1)],
      ["x ^ (x & (x - 1))", (x) => x ^ (x & (x - 1))],
    ];
    const rows = exprs.map(([name, f]) => {
      let sweep = 0;
      for (let x = 0; x < SWEEP; x++) if (f(x) === lowestSetBit(x)) sweep++;
      let edge = 0;
      for (const [, x] of EDGES) if (f(x) === byDefinition(x)) edge++;
      if (sweep !== SWEEP || edge !== EDGES.length)
        throw new Error(`${name} 이 틀린 답을 냈다`);
      return [
        `\`${name}\``,
        String(opsOf(name)),
        `${num(sweep)} / ${num(SWEEP)}`,
        `${edge} / ${EDGES.length}`,
      ];
    });
    let eq = 0;
    for (let x = 0; x < SWEEP; x++) if (-x === ~(x - 1)) eq++;
    for (const [, x] of EDGES) if ((-x | 0) === ~(x - 1)) eq++;
    return [
      table(
        [
          "식",
          "연산 수",
          "0 이상 65,536 미만에서 맞은 값",
          "경계 여덟에서 맞은 값",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `${kor(exprs.length)} 식 모두 모든 입력에서 답이 맞고, 연산 수만 차이가 납니다. \`-x\` 와 \`~(x - 1)\` 은 대조한 ${num(eq)} 개 값에서 모두 같은 값이었습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const x = ${WALK};`,
      `// 이 절이 끝나면 ${lowestSetBit(WALK)}${이가(lowestSetBit(WALK))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 뒤집기만 실행한 결과. */
  "walk-flip": () => {
    const f = ~WALK;
    return [
      `x   = ${bin(WALK)} = ${WALK}`,
      `~x  = ${bin(f)} = ${f}    (위 24 자리는 전부 ${bitAt(f, WIDTH - 1)})`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 지우는 식을 남기는 식 자리에 쓰면. */
  "pause-clear": () => {
    let bad = 0;
    const rows = SAMPLES.map((x) => {
      const r = lowestSetBit(x);
      const c = x & (x - 1);
      if (r !== c) bad++;
      return [label(x), bin(x), String(r), String(c), same(r, c)];
    });
    return [
      table(
        ["입력", "x 의 아래 여덟 자리", "정본", "x & (x - 1)", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `${kor(SAMPLES.length)} 줄 중 ${kor(bad)} 줄에서 답이 어긋나고, x 가 0 인 줄에서만 두 값이 일치합니다. 그때 \`x - 1\` 은 모든 자리가 1 인 -1 이지만, 0 과 AND 하면 어느 식이든 0 이 나옵니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 지운 값에서 남기는 값을 얻으려면 연산이 하나 더 든다. */
  "pause-clear-fix": () => {
    let ok = 0;
    const rows = SAMPLES.map((x) => {
      const c = x & (x - 1);
      const fixed = x ^ c;
      const r = lowestSetBit(x);
      if (fixed === r) ok++;
      return [label(x), String(c), String(fixed), String(r), same(fixed, r)];
    });
    return [
      table(
        ["입력", "x & (x - 1)", "x ^ (x & (x - 1))", "정본", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `${kor(ok)} 줄 모두 지운 값을 x 에서 덜어 낸 값이 정본의 답과 일치합니다. 지우는 식과 남기는 식은 x 의 1 비트를 나눠 가진 짝이라, 한쪽에서 다른 쪽을 얻으려면 XOR 이 하나 더 듭니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 1 을 자리마다 더한다. 자리올림이 0 이 된 뒤는 묶는다. */
  "walk-carry": () => {
    const a = addOne(WALK);
    const stop = a.stop as number;
    const rows = a.recs
      .slice(0, stop + 1)
      .map((r) => [
        `자리 ${r.j}`,
        String(r.flipBit),
        String(r.carryIn),
        `${r.flipBit} + ${r.carryIn} = ${r.flipBit + r.carryIn}`,
        String(r.out),
        r.carryOut === 1 ? "1 — 위로 넘긴다" : "0 — 여기서 멈춘다",
      ]);
    const rest = a.recs.slice(stop + 1);
    if (rest.some((r) => r.carryIn !== 0 || r.out !== r.flipBit))
      throw new Error("자리올림이 멈춘 뒤 자리가 바뀌었다");
    rows.push([
      `자리 ${stop + 1} ~ ${WIDTH - 1}`,
      "~x 그대로",
      "0",
      "더할 것이 없다",
      "~x 그대로",
      "0",
    ]);
    return [
      table(
        [
          "자리",
          "~x 의 비트",
          "들어온 자리올림",
          "더하기",
          "결과 비트",
          "넘긴 자리올림",
        ],
        rows,
        ["l", "r", "r", "l", "r", "l"],
      ),
      "",
      `자리 ${stop} 에서 자리올림이 멈춥니다. 자리마다 모은 32 자리는 ${a.negated} 이고, \`-x\` 와 일치합니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 「답은 언제나 0 이상」으로 부호를 고친 판. */
  "pause-negative": () => {
    let bad = 0;
    const rows = EDGES.map(([name, x]) => {
      const r = lowestSetBit(x);
      const f = r < 0 ? -r : r;
      if (r !== f) bad++;
      return [name, num(x), num(r), num(f), same(r, f)];
    });
    let negatives = 0;
    for (let p = 0; p < WIDTH; p++) {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      if (lowestSetBit(x) < 0) negatives++;
    }
    return [
      table(["경계", "x", "정본", "부호를 뒤집어 낸 값", "판정"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${kor(EDGES.length)} 줄 중 ${kor(EDGES.length - bad)} 줄은 두 값이 일치하고, 어긋나는 줄은 ${kor(bad)} 줄입니다. 1 비트가 자리 p 하나뿐인 값 ${WIDTH} 개 가운데 답이 음수인 것은 ${negatives} 개이고, 그 자리는 31 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 고정 입력을 끝까지. 걸음마다 상태값을 적는다. */
  "walk-trace": () => {
    const plan = walkPlan(WALK);
    const add = addOne(WALK);
    let settled = "?".repeat(W);
    const passed: number[] = [];
    const rows = plan.steps.map((s) => {
      let digit = "—";
      let carry = "—";
      let neg = "—";
      let res = "—";
      if (s.kind === "carry" && s.rec) {
        const j = s.rec.j;
        if (j < W)
          settled =
            settled.slice(0, W - 1 - j) +
            String(s.rec.out) +
            settled.slice(W - j);
        if (s.rec.carryOut === 1) passed.push(j);
        digit = `자리 ${j}`;
        carry = s.rec.carryOut === 1 ? "1 — 위로 넘긴다" : "0 — 여기서 멈춘다";
      }
      if (s.kind === "rest") {
        settled = bits(add.negated);
        digit = `자리 ${s.j} 부터 위`;
        carry = "0 — 더할 것이 없다";
        neg = `${add.negated}`;
      }
      if (s.kind === "and" || s.kind === "return") {
        neg = `${add.negated}`;
        res = `${plan.answer} (${bin(plan.answer)})`;
      }
      const branchName =
        s.kind === "input"
          ? "— 입력"
          : s.kind === "flip"
            ? "① 뒤집기"
            : s.kind === "and"
              ? "③ AND"
              : s.kind === "return"
                ? "③ 반환"
                : "② 1 더하기";
      return [s.id, branchName, digit, carry, settled, neg, res];
    });
    return [
      table(
        [
          "걸음",
          "갈래",
          "더하는 자리",
          "자리올림",
          "-x 의 정해진 아래 자리",
          "-x",
          "x & -x",
        ],
        rows,
        ["l", "l", "l", "l", "r", "r", "r"],
      ),
      "",
      `답은 ${plan.answer} 입니다. 자리올림이 자리 ${passed.join(" · ")} 를 넘어가 자리 ${plan.p} 에서 멈추고, 그 위 자리는 뒤집은 값 그대로 남습니다. 「?」는 아직 정해지지 않은 자리입니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const plan = walkPlan(WALK);
    const of = (b: WalkStep["branch"]) =>
      plan.steps.filter((s) => s.branch === b);
    const groups: [WalkStep["branch"], string][] = [
      ["①", "모든 자리를 뒤집는다"],
      ["②", "1 을 더해 -x 를 만든다"],
      ["③", "두 값을 AND 해 돌려준다"],
    ];
    const rows = groups.map(([b, what]) => {
      const list = of(b);
      if (list.length === 0) throw new Error(`갈래 ${b} 가 한 번도 안 나왔다`);
      return [b, what, list.map((s) => s.id).join(" "), `${list.length} 걸음`];
    });
    return [
      table(["갈래", "하는 일", "걸음", "걸음 수"], rows, ["l", "l", "l", "r"]),
      "",
      `세 갈래가 모두 한 번 이상 실행됐습니다. 그중 기계가 실행하는 기본 연산은 부호 뒤집기와 AND 를 합쳐 ${REF_OPS} 번입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 여러 입력에 실행한다. */
  "walk-final": () => {
    const xs = [WALK, 12, 1, 0, -12, INT32_MAX, INT32_MIN];
    const call = xs.map((x) => `lowestSetBit(${x})`);
    const w = Math.max(...call.map((c) => c.length));
    return [
      ...xs.map(
        (x, k) => `${(call[k] as string).padEnd(w)}   →   ${lowestSetBit(x)}`,
      ),
    ].join("\n");
  },

  /** `related` — -x 는 2^32 로 나눈 나머지에서의 덧셈 역원이다. */
  "related-modulo": () => {
    let ok = 0;
    const rows = SAMPLES.map((x) => {
      const u = x >>> 0;
      const n32 = -x >>> 0;
      const inv = (2 ** 32 - u) % 2 ** 32;
      const sum = (u + n32) % 2 ** 32;
      if (n32 === inv && sum === 0) ok++;
      return [String(x), num(u), num(n32), num(inv), num(sum), same(n32, inv)];
    });
    return [
      table(
        [
          "x",
          "x 를 부호 없이 읽은 값 u",
          "-x 를 부호 없이 읽은 값",
          "(2^32 - u) 를 2^32 로 나눈 나머지",
          "두 값의 합을 2^32 로 나눈 나머지",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `${kor(ok)} 줄 모두 -x 가 2^32 - u 와 일치하고, x 와 더해 2^32 로 나눈 나머지가 0 입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 정의를 값에 넣어 검산하고, ν 의 합을 닫힌 형태와 대조한다. */
  "math-check": () => {
    const xs = [40, 12, 1, 1024, 0];
    const rows = xs.map((x) => {
      const p = nu(x);
      const d = p === null ? 0 : 2 ** p;
      if (d !== lowestSetBit(x))
        throw new Error(`2^ν 가 정본과 다르다 — x=${x}`);
      return [
        num(x),
        p === null ? "없음" : String(p),
        num(d),
        num(lowestSetBit(x)),
      ];
    });
    const ns = [8, 10, 100, 1000];
    const sums = ns.map((n) => {
      let total = 0;
      for (let x = 1; x <= n; x++) total += nu(x) as number;
      if (total !== n - s2(n))
        throw new Error(`N=${n} 에서 닫힌 형태와 다르다`);
      return [num(n), num(total), String(s2(n)), num(n - s2(n))];
    });
    return [
      table(["x", "ν(x)", "2^ν(x)", "정본"], rows, ["r", "r", "r", "r"]),
      "",
      "1 부터 N 까지의 ν 를 실제로 더하면 이렇습니다.",
      "",
      table(["N", "Σ ν(x)", "s₂(N)", "N - s₂(N)"], sums, ["r", "r", "r", "r"]),
      "",
      `위 표의 셋째 열과 넷째 열이 ${kor(xs.length)} 줄 모두 일치하고, 아래 표의 둘째 열과 넷째 열이 ${kor(ns.length)} 줄 모두 일치합니다.`,
    ].join("\n");
  },

  /** `deep.math` — 합의 순서를 바꿔 세어도 같은 값이 나온다. */
  "math-regroup": () => {
    const n = 8;
    const byX: number[] = [];
    for (let x = 1; x <= n; x++) byX.push(nu(x) as number);
    const byJ: number[] = [];
    for (let j = 1; 2 ** j <= n; j++) byJ.push(Math.floor(n / 2 ** j));
    const a = byX.reduce((t, v) => t + v, 0);
    const b = byJ.reduce((t, v) => t + v, 0);
    if (a !== b) throw new Error("두 방향의 합이 다르다");
    return [
      table(
        ["세는 방향", "항", "항 수", "합"],
        [
          ["x 마다 ν(x)", byX.join(" + "), String(byX.length), String(a)],
          ["j 마다 ⌊N / 2^j⌋", byJ.join(" + "), String(byJ.length), String(b)],
        ],
        ["l", "l", "r", "r"],
      ),
      "",
      `N = ${n} 에서 두 방향의 합이 둘 다 ${a} 입니다. 같은 것을 x 마다 세느냐 j 마다 세느냐의 차이라 합이 안 바뀝니다.`,
    ].join("\n");
  },

  /** `deep.math` — 닫힌 형태에 규모를 넣는다. */
  "math-scale": () => {
    const n = CALLS;
    const sumNu = n - s2(n);
    const seq = 5 * sumNu + 6 * n;
    const worst = scanClosed(31) * n;
    const ref = REF_OPS * n;
    return [
      table(
        ["무엇", "식", "값"],
        [
          ["자리 p 의 합", `N - s₂(N) = ${num(n)} - ${s2(n)}`, num(sumNu)],
          ["자리 p 의 평균", "(N - s₂(N)) / N", String(sumNu / n)],
          ["자리마다 검사, 1 부터 N 까지", "5(N - s₂(N)) + 6N", num(seq)],
          ["자리마다 검사, p = 31 만 N 번", "(5·31 + 6) N", num(worst)],
          ["x & -x", `${REF_OPS}N`, num(ref)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `N = ${num(n)} 에서 자리마다 검사는 1 부터 N 까지 넣으면 x & -x 의 ${fixed1(seq / ref)} 배이고, p = 31 만 넣으면 ${fixed1(worst / ref)} 배입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 전개 입력에서 세 구간을 자리마다 대조한다. */
  "invariant-ranges": () => {
    const x = WALK;
    const p = nu(x) as number;
    let ok = 0;
    const rows: string[][] = [];
    const want = (j: number): number =>
      j < p ? 0 : j === p ? 1 : 1 - bitAt(x, j);
    for (let j = W - 1; j >= 0; j--) {
      const region = j < p ? "아래" : j === p ? "자리 p" : "위";
      const got = bitAt(-x, j);
      if (want(j) === got) ok++;
      rows.push([
        `자리 ${j}`,
        region,
        String(bitAt(x, j)),
        String(got),
        String(want(j)),
        same(got, want(j)),
      ]);
    }
    let all = 0;
    for (let j = 0; j < WIDTH; j++) if (bitAt(-x, j) === want(j)) all++;
    return [
      table(
        [
          "자리",
          "구간",
          "x 의 비트",
          "-x 의 비트",
          "불변식이 말하는 값",
          "판정",
        ],
        rows,
        ["l", "l", "r", "r", "r", "l"],
      ),
      "",
      `그린 ${kor(ok)} 자리를 포함해 32 자리 중 ${all} 자리에서 -x 의 비트가 불변식이 말하는 값과 일치합니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에서 정의가 낸 답과 대조한다. */
  "invariant-edges": () => {
    let ok = 0;
    const rows = EDGES.map(([name, x]) => {
      const d = byDefinition(x);
      const r = lowestSetBit(x);
      if (r === d) ok++;
      return [name, num(x), pOf(x), num(d), num(r), same(r, d)];
    });
    return [
      table(["경계", "x", "p", "정의가 낸 답", "정본", "판정"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${kor(ok)} 줄 모두 일치합니다. 값이 0 인 줄은 1 비트가 없어 p 가 정해지지 않는데, 그 자리에서 정본은 따로 막는 줄 없이 0 을 냅니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 1 을 더하지 않은 변이. */
  "mutant-no-carry": () => {
    let bad = 0;
    const rows = EDGES.map(([name, x]) => {
      const r = lowestSetBit(x);
      const m = noCarry.lowestSetBit(x);
      if (r !== m) bad++;
      return [name, num(x), num(r), num(m), same(r, m)];
    });
    if (!중화됨 && bad === 0) throw new Error("변이가 답을 하나도 안 바꿨다");
    return [
      table(["경계", "x", "정본", "1 을 안 더한 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${kor(EDGES.length)} 줄 중 ${kor(bad)} 줄에서 답이 어긋납니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 전개 입력에서 자리 p 가 어떻게 갈리는가. */
  "mutant-no-carry-bits": () => {
    const x = WALK;
    const p = nu(x) as number;
    const top = 5;
    const row = (name: string, v: number): string[] => {
      const out = [name];
      for (let j = top; j >= 0; j--) out.push(String(bitAt(v, j)));
      return out;
    };
    const m = noCarry.lowestSetBit(x);
    const r = lowestSetBit(x);
    const head = ["값"];
    for (let j = top; j >= 0; j--) head.push(`자리 ${j}`);
    return [
      table(
        head,
        [
          row("`x`", x),
          row("`~x`", ~x),
          row("`-x`", -x),
          row("1 을 안 더한 판이 낸 값", m),
          row("정본이 낸 값", r),
        ],
        ["l", ...Array.from({ length: top + 1 }, () => "r" as const)],
      ),
      "",
      `~x 의 자리 ${p}${은는(p)} ${bitAt(~x, p)} 이고 -x 의 자리 ${p}${은는(p)} ${bitAt(-x, p)} 입니다. 1 을 안 더한 판은 ${m}${을를(m)} 내고, 정본은 자리 ${p} 하나가 남아 ${r}${을를(r)} 냅니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음을 무리로 묶어 기본 연산을 센다. */
  "perf-count": () => {
    const plan = walkPlan(WALK);
    const s = refShape();
    const ids = (kinds: WalkStep["kind"][]) =>
      plan.steps.filter((t) => kinds.includes(t.kind)).map((t) => t.id);
    const span = (xs: string[]) =>
      xs.length === 1 ? (xs[0] as string) : `${xs[0]} ~ ${xs.at(-1)}`;
    const groups: [string, string[], number, number][] = [
      ["입력을 읽는다", ids(["input"]), 0, 0],
      ["-x 를 만든다", ids(["flip", "carry", "rest"]), s.negations, 0],
      ["두 값을 AND 한다", ids(["and"]), 0, s.ands],
      ["값을 돌려준다", ids(["return"]), 0, 0],
    ];
    const rows = groups.map(([name, xs, n, a]) => [
      name,
      span(xs),
      String(xs.length),
      String(n),
      String(a),
      String(n + a),
    ]);
    const steps = groups.reduce((t, g) => t + g[1].length, 0);
    if (steps !== plan.steps.length) throw new Error("무리가 걸음을 빠뜨렸다");
    rows.push([
      "합계",
      "",
      String(steps),
      String(s.negations),
      String(s.ands),
      String(s.ops),
    ]);
    return [
      table(
        ["무리", "걸음", "걸음 수", "부호 뒤집기", "비트 AND", "기본 연산"],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `걸음은 ${steps} 개인데 기본 연산은 ${s.ops} 개입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔 두 방법의 기본 연산을 센다. */
  "perf-worst": () => {
    const xs: [string, number][] = [
      ["값이 0 이다", 0],
      ["1 비트가 자리 0 에 있다", 1],
      ["1 비트가 자리 31 에 있다", INT32_MIN],
      ["1 비트가 서른두 자리에 다 있다", -1],
      ["범위의 위쪽 끝이다", INT32_MAX],
      ["자리 30 하나뿐이다", 2 ** 30],
      ["전개 입력이다", WALK],
    ];
    const rows = xs.map(([name, x]) => [
      name,
      num(x),
      pOf(x),
      String(popcount(x)),
      String(REF_OPS),
      String(scanOps(x)),
      num(lowestSetBit(x)),
    ]);
    const scans = xs.map(([, x]) => scanOps(x));
    return [
      table(
        [
          "입력의 모양",
          "x",
          "p",
          "1 비트 수",
          "x & -x 의 기본 연산",
          "자리마다 검사의 기본 연산",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `x & -x 의 기본 연산은 ${kor(xs.length)} 줄 모두 ${REF_OPS} 번입니다. 자리마다 검사는 ${Math.min(...scans)} 번에서 ${Math.max(...scans)} 번까지 차이가 납니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 자리올림이 멈춘 뒤의 자리를 따로 본다. */
  "check-above": () => {
    const x = WALK;
    const p = nu(x) as number;
    const rows: string[][] = [];
    for (let j = W - 1; j > p; j--) {
      const f = bitAt(~x, j);
      const n = bitAt(-x, j);
      if (f !== n || f === bitAt(x, j))
        throw new Error("위 구간의 규칙이 어긋난다");
      rows.push([
        `자리 ${j}`,
        String(bitAt(x, j)),
        String(f),
        String(n),
        String(bitAt(x & -x, j)),
      ]);
    }
    return [
      table(["자리", "x 의 비트", "~x 의 비트", "-x 의 비트", "AND"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `${kor(rows.length)} 자리 모두 ~x 의 비트와 -x 의 비트가 일치하고, x 의 비트와는 반대라 마지막 열이 전부 0 입니다.`,
    ].join("\n");
  },
};
