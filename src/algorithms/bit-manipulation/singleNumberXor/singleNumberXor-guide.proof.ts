/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md
 *
 * **걸음을 세는 사본이 있다.** 정본은 중간 상태를 내보내지 않으므로, 기록하는 자리만 덧붙인
 * 사본(`traceFold`)이 아니면 걸음 값을 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { singleNumberXor } from "./singleNumberXor-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 초당 단순 연산 수의 어림값. */
const OPS_PER_SEC = 100_000_000;

/** 연산 횟수를 초로. 0.01 초보다 작으면 자릿수가 다 0 이 되므로 그렇게 적는다. */
const seconds = (ops: number): string => {
  const s = ops / OPS_PER_SEC;
  return s < 0.01 ? "0.01 초 미만" : `${fixed2(s)} 초`;
};

/** 전개 입력을 그리는 비트 폭. 최댓값 4 가 자리 2 를 쓰므로 3 이다. */
const WALK_BITS = 3;

/** 고정 폭 이진 표기. 아래 첨자 ₂ 를 붙인다. 음수는 쓰지 않는다. */
const bin = (v: number, w = WALK_BITS): string => {
  if (v < 0) throw new Error("음수의 이진 표기는 쓰지 않는다");
  return `${v.toString(2).padStart(w, "0")}₂`;
};

/** `4 (100₂)` 꼴 — 십진과 이진을 한 칸에. */
const both = (v: number, w = WALK_BITS): string => `${v} (${bin(v, w)})`;

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/** 배열 표기. */
const show = (nums: readonly number[]): string => `[${nums.join(", ")}]`;

/** 수 목록. 비면 「없음」. */
const list = (xs: readonly (number | string)[]): string =>
  xs.length === 0 ? "없음" : xs.join(" · ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 「수행으로 알아보는 알고리즘」과 「아이디어 상세」가 쓰는 입력. 짝을 이루는 1 과 2 가 엇갈려 놓여
 * 떨어진 짝이 지워지는 것이 걸음으로 보이고, 답 4 가 맨 앞이라 「마지막에 겹친 값이 답」으로 읽힐
 * 자리가 없으며, 세 값이 서로 다른 자리를 쓴다(4 는 자리 2, 2 는 자리 1, 1 은 자리 0).
 */
export const WALK = [4, 1, 2, 1, 2];

/**
 * 「아이디어를 떠올리는 과정」이 쓰는 입력. 답 7 이 **맨 뒤**라 값마다 다시 세는 방법이 가장 오래
 * 걸리고, 짝이 떨어져 있어 홀짝만 남기는 집합이 두 칸까지 커진다.
 */
export const ORIGIN = [1, 2, 1, 2, 7];

/** 과제 규모에 가장 가까운 홀수 길이. 짝 499,999 쌍과 답 하나다. */
export const BIG_N = 999_999;

/** 짝이 붙어 있는 배열 — `[1, 1, 2, 2, …, h, h, n]`. 답 `n` 이 맨 뒤이고 짝의 값과 겹치지 않는다. */
export function adjacent(n: number): number[] {
  const out: number[] = [];
  for (let v = 1; v <= (n - 1) / 2; v++) out.push(v, v);
  out.push(n);
  return out;
}

/** 짝을 반씩 떨어뜨린 배열 — `[1, 2, …, h, 1, 2, …, h, n]`. 답 `n` 이 맨 뒤다. */
export function spread(n: number): number[] {
  const h = (n - 1) / 2;
  const half = Array.from({ length: h }, (_, k) => k + 1);
  return [...half, ...half, n];
}

/* ────────────────────────── 정의와 세는 사본 ────────────────────────── */

/** **정의를 그대로 옮긴 답.** 값마다 등장 횟수를 세어 홀수인 것. 비트 연산을 쓰지 않는다. */
function byDefinition(nums: readonly number[]): number | null {
  const odd = oddValues(nums);
  return odd.length === 1 ? (odd[0] as number) : null;
}

/** 등장 횟수가 홀수인 값 전부 — 넣은 순서대로. */
function oddValues(nums: readonly number[]): number[] {
  const count = new Map<number, number>();
  for (const v of nums) count.set(v, (count.get(v) ?? 0) + 1);
  return [...count].filter(([, c]) => c % 2 === 1).map(([v]) => v);
}

/** 값 `v` 의 자리 `j` 비트 — 나눗셈으로 읽어 32 비트 자르기와 무관하다(0 이상만). */
const bitAt = (v: number, j: number): number => Math.floor(v / 2 ** j) % 2;

interface Fold {
  /** 이 걸음에서 읽은 칸. */
  i: number;
  v: number;
  before: number;
  after: number;
}

/** 정본과 같은 절차에 기록하는 자리만 덧붙인 사본. */
function traceFold(nums: readonly number[]): {
  folds: Fold[];
  answer: number;
} {
  let acc = 0;
  const folds: Fold[] = [];
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i] as number;
    const before = acc;
    acc ^= v;
    folds.push({ i, v, before, after: acc });
  }
  return { folds, answer: acc };
}

interface RescanRow {
  i: number;
  target: number;
  c: number;
  reads: number;
}

/** 가장 단순한 방법 — 원소마다 배열 전체를 다시 세어 등장 횟수가 홀수인 것을 찾는다. */
function byRescan(nums: readonly number[]): {
  answer: number | null;
  reads: number;
  rows: RescanRow[];
} {
  let reads = 0;
  const rows: RescanRow[] = [];
  for (let i = 0; i < nums.length; i++) {
    reads++;
    const target = nums[i] as number;
    let c = 0;
    let here = 1;
    for (let k = 0; k < nums.length; k++) {
      reads++;
      here++;
      if (nums[k] === target) c++;
    }
    rows.push({ i, target, c, reads: here });
    if (c % 2 === 1) return { answer: target, reads, rows };
  }
  return { answer: null, reads, rows };
}

/** 답이 맨 뒤에 있을 때 `byRescan` 이 읽는 칸 수 — `N(N + 1)`. */
export const rescanWorst = (n: number): number => n * (n + 1);

/**
 * 맵으로 등장 횟수 세기. 칸 접근은 원소마다 배열 읽기 · 맵 읽기 · 맵 쓰기 셋이고, 끝에 맵을 차례로
 * 읽어 횟수가 홀수인 키를 찾는다.
 */
function byCountMap(nums: readonly number[]): {
  answer: number | null;
  access: number;
  keys: number;
} {
  let access = 0;
  const count = new Map<number, number>();
  for (const v of nums) {
    access += 3;
    count.set(v, (count.get(v) ?? 0) + 1);
  }
  for (const [v, c] of count) {
    access++;
    if (c % 2 === 1) return { answer: v, access, keys: count.size };
  }
  return { answer: null, access, keys: count.size };
}

interface ToggleRow {
  v: number;
  had: boolean;
  after: number[];
}

/** 홀짝만 남기는 집합 — 처음 보면 넣고 다시 보면 뺀다. 가장 컸을 때의 크기를 센다. */
function byToggle(
  nums: readonly number[],
  record = false,
): {
  answer: number | null;
  access: number;
  peak: number;
  rows: ToggleRow[];
} {
  let access = 0;
  let peak = 0;
  const set = new Set<number>();
  const rows: ToggleRow[] = [];
  for (const v of nums) {
    access += 3;
    const had = set.has(v);
    if (had) set.delete(v);
    else set.add(v);
    peak = Math.max(peak, set.size);
    if (record) rows.push({ v, had, after: [...set] });
  }
  access++;
  const left = [...set];
  return {
    answer: left.length === 1 ? (left[0] as number) : null,
    access,
    peak,
    rows,
  };
}

/** 정본이 실행하는 **기본 연산** — 비교 · 배열 읽기 · XOR · 대입 · 증가를 하나씩 센다. */
interface OpCount {
  compare: number;
  read: number;
  xor: number;
  assign: number;
  increment: number;
}

/** 반복문의 모양만 따라가며 센다. 갈래가 하나뿐이라 값이 무엇이든 실행하는 연산이 같다. */
function countOps(n: number): OpCount {
  const out: OpCount = {
    compare: 0,
    read: 0,
    xor: 0,
    assign: 1,
    increment: 0,
  };
  for (let i = 0; ; i++) {
    out.compare++;
    if (i >= n) break;
    out.read++;
    out.xor++;
    out.assign++;
    out.increment++;
  }
  return out;
}

const totalOps = (o: OpCount): number =>
  o.compare + o.read + o.xor + o.assign + o.increment;

/** 「같은 값은 한 번만 겹치면 된다」는 오해대로 적은 절차. */
function skipDuplicates(nums: readonly number[]): number {
  const seen = new Set<number>();
  let acc = 0;
  for (const v of nums) {
    if (seen.has(v)) continue;
    seen.add(v);
    acc ^= v;
  }
  return acc;
}

/** 누적기를 `nums[0]` 으로 두고 칸 1 부터 겹치는 판 — 항등원에서 출발하는 까닭의 비교 상대. */
function startFromFirst(nums: readonly number[]): number | undefined {
  let acc = nums[0];
  for (let i = 1; i < nums.length; i++) {
    acc = (acc as number) ^ (nums[i] as number);
  }
  return acc;
}

/** 누적 연산 후보. 각 연산의 항등원에서 출발한다. */
const FOLDS: {
  name: string;
  unit: number;
  op: (a: number, b: number) => number;
}[] = [
  { name: "더하기 +", unit: 0, op: (a, b) => a + b },
  { name: "빼기 -", unit: 0, op: (a, b) => a - b },
  { name: "비트 OR |", unit: 0, op: (a, b) => a | b },
  { name: "비트 AND &", unit: -1, op: (a, b) => a & b },
  { name: "비트 XOR ^", unit: 0, op: (a, b) => a ^ b },
];

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 비교 사례. 답의 자리와 등장 횟수가 서로 다르다. */
const SAMPLES: number[][] = [
  WALK,
  [2, 2, 1],
  [0, 1, 1, 2, 2],
  [4, 4, 4, 2, 2],
  [1, 1, 2, 2, 7],
  [7],
];

function 자기대조(): void {
  const inputs: number[][] = [
    ...SAMPLES,
    ORIGIN,
    [5, 5, 5, 1, 1],
    [-5, 1, 1],
    adjacent(1_001),
    spread(1_001),
  ];
  for (const nums of inputs) {
    const want = byDefinition(nums);
    const got = singleNumberXor(nums);
    if (got !== want) throw new Error(`정본이 정의와 다르다 — ${show(nums)}`);
    if (traceFold(nums).answer !== got)
      throw new Error(`세는 사본이 정본과 다르다 — ${show(nums)}`);
    if (byCountMap(nums).answer !== got || byToggle(nums).answer !== got)
      throw new Error(`비교 상대가 정본과 다르다 — ${show(nums)}`);
    if (byRescan(nums).answer !== got)
      throw new Error(`가장 단순한 방법이 정본과 다르다 — ${show(nums)}`);
  }
  for (const n of [5, 11, 101, 1_001]) {
    if (byRescan(spread(n)).reads !== rescanWorst(n))
      throw new Error(`다시 세기의 읽기 수가 N(N + 1) 과 다르다 — N=${n}`);
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { singleNumberXor: (nums: number[]) => number };

const REF = new URL("./singleNumberXor-guide.ref.ts", import.meta.url).pathname;

/**
 * **불변식을 지키던 줄** — XOR 을 OR 로 바꾼 사본. OR 은 한 번 1 이 된 자리를 다시 0 으로 못
 * 내린다. 정본 소스에서 기계로 만든다 — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const orMutant = await loadMutant<Impl>(REF, {
  swap: [/acc \^= nums\[i\] as number;/, "acc |= nums[i] as number;"],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이가 적용되지 않았다. */
const 중화됨 = orMutant.singleNumberXor === singleNumberXor;

if (!중화됨) {
  const same = SAMPLES.every(
    (nums) => singleNumberXor(nums) === orMutant.singleNumberXor(nums),
  );
  if (same) throw new Error("OR 변이가 어느 입력에서도 답을 바꾸지 못했다");
}

/* ────────────────────────── 문장 도움 ────────────────────────── */

const label = (nums: readonly number[]): string =>
  nums === WALK ? `전개 입력 ${show(nums)}` : show(nums);

/** 두 값 사이에 켜지거나 꺼진 자리. */
function flips(before: number, after: number): string {
  const out: string[] = [];
  for (let j = WALK_BITS - 1; j >= 0; j--) {
    const a = bitAt(before, j);
    const b = bitAt(after, j);
    if (a !== b) out.push(`자리 ${j} ${b === 1 ? "켜짐" : "꺼짐"}`);
  }
  return list(out);
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 같은 값을 두 번 겹치면 0, 0 을 겹치면 그대로. */
  "concept-cancel": () => {
    const vs = [4, 1, 2];
    const rows = vs.map((v) => [both(v), both(v ^ v), both(v ^ 0)]);
    const allZero = vs.every((v) => (v ^ v) === 0);
    const allSame = vs.every((v) => (v ^ 0) === v);
    return [
      table(["값 v", "v ^ v", "v ^ 0"], rows, ["r", "r", "r"]),
      "",
      `세 값 모두 v ^ v 가 ${allZero ? "0 이고" : "0 이 아니고"}, v ^ 0 이 ${allSame ? "원래 값 그대로입니다" : "원래 값과 다릅니다"}.`,
    ].join("\n");
  },

  /** `prereq` — 이 글이 쓰는 연산 몇 개를 실제로 계산한다. */
  "prereq-ops": () => {
    const rows = [
      ["5 ^ 3", `${bin(5)} 와 ${bin(3)} 의 자리마다 비교`, String(5 ^ 3)],
      ["6 ^ 6", "모든 자리가 같다", String(6 ^ 6)],
      ["(2 ** 31) ^ 0", "자리 31 이 부호 자리로 읽힌다", String((2 ** 31) ^ 0)],
      ["(2 ** 32 + 5) ^ 0", "자리 32 위가 잘린다", String((2 ** 32 + 5) ^ 0)],
    ];
    return table(["식", "계산", "결과"], rows, ["l", "l", "r"]);
  },

  /** `deep.origin` ② — 가장 단순한 방법을 규모에서 반박한다. */
  "origin-rescan-cost": () => {
    const rows = [5, 11, 101, 1_001].map((n) => {
      const r = byRescan(spread(n));
      return [num(n), num(r.reads), num(rescanWorst(n)), seconds(r.reads)];
    });
    const big = rescanWorst(BIG_N);
    return [
      table(
        ["배열 길이 N", "실제로 센 칸 읽기", "N(N + 1)", "초당 1 억 번 기준"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `네 길이 모두 실제로 센 값과 N(N + 1) 이 같습니다. 길이 ${num(BIG_N)} 이면 N(N + 1) = ${num(big)} 번이라 ${seconds(big)}입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 작은 입력에서 무엇을 되풀이하는지 본다. */
  "origin-rescan-walk": () => {
    const r = byRescan(ORIGIN);
    let sum = 0;
    const rows = r.rows.map((row) => {
      sum += row.reads;
      return [
        String(row.i),
        String(row.target),
        String(row.c),
        String(row.reads),
        String(sum),
        row.c % 2 === 1 ? "홀수 — 답" : "짝수 — 다음 칸으로",
      ];
    });
    const again = [...new Set(ORIGIN)]
      .map((v) => ({
        v,
        at: r.rows.filter((row) => row.target === v).map((row) => row.i),
      }))
      .filter((x) => x.at.length > 1)
      .map((x) => `값 ${x.v}${은는(x.v)} i = ${x.at.join(" · ")} 에서`);
    return [
      table(
        [
          "바깥 칸 i",
          "다시 센 값",
          "센 횟수 c",
          "이번에 읽은 칸",
          "읽은 칸 합",
          "c 의 홀짝",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `칸 ${ORIGIN.length} 개짜리 배열에서 ${r.reads} 번 읽었습니다. ${again.join(", ")} 같은 값을 처음부터 다시 세었습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 세어 나란히 놓는다. */
  "origin-two-ways": () => {
    const cases: [string, number[], boolean][] = [
      [show(ORIGIN), ORIGIN, true],
      ["짝을 반씩 떨어뜨린 길이 1,001", spread(1_001), true],
      [`짝을 반씩 떨어뜨린 길이 ${num(BIG_N)}`, spread(BIG_N), false],
    ];
    const rows = cases.map(([name, nums, measure]) => {
      const m = byCountMap(nums);
      const rescan = measure ? byRescan(nums).reads : rescanWorst(nums.length);
      return [name, num(nums.length), num(rescan), num(m.access), num(m.keys)];
    });
    const big = byCountMap(spread(BIG_N));
    return [
      table(
        [
          "입력",
          "N",
          "다시 세기의 칸 읽기",
          "맵으로 세기의 칸 접근",
          "맵의 키",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `마지막 줄의 다시 세기는 N(N + 1) 로 적었습니다. 길이 ${num(BIG_N)} 에서 맵으로 세기는 초당 1 억 번 기준 ${seconds(big.access)}이고, 맵에 키가 ${num(big.keys)} 개 들어갑니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 홀짝만 남기는 집합. 작은 입력의 걸음과 규모에서의 크기. */
  "origin-toggle": () => {
    const t = byToggle(ORIGIN, true);
    const rows = t.rows.map((r, k) => [
      String(k + 1),
      String(r.v),
      r.had ? "있다" : "없다",
      r.had ? `${r.v}${을를(r.v)} 뺀다` : `${r.v}${을를(r.v)} 넣는다`,
      r.after.length === 0 ? "비었다" : `{${r.after.join(", ")}}`,
    ]);
    const shapes: [string, number[]][] = [
      ["짝이 붙어 있다", adjacent(BIG_N)],
      ["짝을 반씩 떨어뜨렸다", spread(BIG_N)],
    ];
    const peaks = shapes.map(([name, nums]) => [
      name,
      num(nums.length),
      num(byToggle(nums).peak),
      num(byCountMap(nums).keys),
    ]);
    return [
      table(
        ["걸음", "읽은 값", "집합에 있었나", "하는 일", "걸음 뒤의 집합"],
        rows,
        ["r", "r", "l", "l", "l"],
      ),
      "",
      `끝나면 집합에 ${list(t.rows.at(-1)?.after ?? [])} 하나만 남고, 걸음 도중에는 ${t.peak} 칸까지 커졌습니다. 같은 길이의 두 배열에서 집합이 가장 컸을 때를 세면 이렇습니다.`,
      "",
      table(["배열 모양", "N", "집합이 가장 컸을 때", "맵의 키"], peaks, [
        "l",
        "r",
        "r",
        "r",
      ]),
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 어떤 누적 연산이 되는지 다섯 후보로 시험한다. */
  "origin-fold-candidates": () => {
    const answer = singleNumberXor(ORIGIN);
    const rows = FOLDS.map((f) => {
      const folded = ORIGIN.reduce(f.op, f.unit);
      const twice = f.op(f.op(f.unit, 5), 5);
      return [
        f.name,
        String(f.unit),
        String(folded),
        folded === answer ? "답과 같음" : "답과 다름",
        String(twice),
        twice === f.unit ? "돌아옴" : "안 돌아옴",
      ];
    });
    const good = FOLDS.filter((f) => {
      const folded = ORIGIN.reduce(f.op, f.unit);
      return folded === answer && f.op(f.op(f.unit, 5), 5) === f.unit;
    }).map((f) => f.name);
    return [
      table(
        [
          "연산",
          "항등원",
          `${show(ORIGIN)} 누적`,
          "답 비교",
          "항등원에 5 를 두 번",
          "항등원 복귀",
        ],
        rows,
        ["l", "r", "r", "l", "r", "l"],
      ),
      "",
      `답 ${answer}${을를(answer)} 맞히고 항등원으로도 돌아온 연산은 ${list(good)} 하나입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — 자리 하나를 골라 읽는다. */
  "build-read-one": () => {
    const j = 0;
    const ones = WALK.flatMap((v, i) => (bitAt(v, j) === 1 ? [i] : []));
    const answer = singleNumberXor(WALK);
    const rows = [
      ["고른 자리", `j = ${j}`],
      [
        `자리 ${j}${이가(j)} 1 인 칸`,
        ones.map((i) => `nums[${i}] = ${WALK[i]}`).join(" · "),
      ],
      ["1 의 개수", String(ones.length)],
      ["개수의 홀짝", ones.length % 2 === 1 ? "홀수" : "짝수"],
      [
        `정본 답 ${answer} 의 자리 ${j}`,
        `${bitAt(answer, j)} (${bin(answer)})`,
      ],
    ];
    return table(["읽는 순서", "값"], rows, ["l", "l"]);
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 자리끼리 서로를 안 건드린다. */
  "build-no-carry": () => {
    const pairs: [number, number][] = [
      [1, 1],
      [3, 1],
      [6, 3],
      [5, 2],
    ];
    const rows = pairs.map(([a, b]) => [
      both(a),
      both(b),
      both(a + b, 4),
      both(a ^ b, 4),
    ]);
    const carry = pairs.filter(([a, b]) => (a & b) !== 0).length;
    return [
      table(["a", "b", "a + b", "a ^ b"], rows, ["r", "r", "r", "r"]),
      "",
      `더하기는 네 쌍 가운데 ${carry} 쌍에서 윗자리로 올림이 생겼고, XOR 은 네 쌍 모두 자리마다 a 와 b 의 그 자리만 보고 값을 정했습니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 자리마다 개수를 세는 모양과 비교한다. */
  "build-bitcount": () => {
    const answer = singleNumberXor(WALK);
    const rows = [2, 1, 0].map((j) => {
      const c = WALK.filter((v) => bitAt(v, j) === 1).length;
      return [
        `자리 ${j}`,
        String(c),
        c % 2 === 1 ? "홀수" : "짝수",
        String(bitAt(answer, j)),
      ];
    });
    return table(
      ["자리", "자리마다 센 1 의 개수", "개수의 홀짝", "XOR 누적의 그 자리"],
      rows,
      ["l", "r", "l", "r"],
    );
  },

  /** `deep.build` 1단계 — 항등원에서 출발하는 것과 첫 칸에서 출발하는 것. */
  "build-start": () => {
    const cases: number[][] = [[], [7], WALK];
    const rows = cases.map((nums) => [
      label(nums),
      String(singleNumberXor(nums)),
      String(startFromFirst(nums)),
    ]);
    return table(
      ["입력", "acc = 0 에서 출발", "acc = nums[0] 에서 출발"],
      rows,
      ["l", "r", "r"],
    );
  },

  /** `deep.build` 2단계 — 쉬운 경우: 같은 값 둘이 이웃해 있다. */
  "build-easy": () => {
    const nums = [1, 1, 4];
    const t = traceFold(nums);
    if (t.answer !== singleNumberXor(nums)) throw new Error("사본이 다르다");
    const rows = [
      ["처음", "—", bin(0), "—"],
      ...t.folds.map((f) => [
        `i = ${f.i}`,
        both(f.v),
        bin(f.after),
        flips(f.before, f.after),
      ]),
    ];
    return table(["걸음", "겹친 값", "acc", "바뀐 자리"], rows, [
      "l",
      "r",
      "r",
      "l",
    ]);
  },

  /** `deep.build` 2단계 — 불안한 경우: 같은 값 둘 사이에 다른 값이 낀다. 자리 0 만 본다. */
  "build-apart": () => {
    const t = traceFold(WALK);
    const rows = t.folds.map((f) => [
      `i = ${f.i}`,
      both(f.v),
      String(bitAt(f.v, 0)),
      String(bitAt(f.after, 0)),
    ]);
    return table(["걸음", "겹친 값", "그 값의 자리 0", "acc 의 자리 0"], rows, [
      "l",
      "r",
      "r",
      "r",
    ]);
  },

  /** `deep.build` 3단계 — 결과를 정하는 것은 등장 횟수의 홀짝뿐이다. */
  "build-order": () => {
    const rows = Array.from({ length: 9 }, (_, c) => {
      const nums = Array.from({ length: c }, () => 5);
      return [
        String(c),
        c % 2 === 0 ? "짝수" : "홀수",
        String(singleNumberXor(nums)),
      ];
    });
    const orders: number[][] = [];
    const go = (rest: number[], acc: number[]): void => {
      if (rest.length === 0) {
        orders.push([...acc]);
        return;
      }
      for (let k = 0; k < rest.length; k++) {
        acc.push(rest[k] as number);
        go([...rest.slice(0, k), ...rest.slice(k + 1)], acc);
        acc.pop();
      }
    };
    go(WALK, []);
    const distinct = new Set(orders.map((o) => o.join(",")));
    const answers = new Set(orders.map((o) => singleNumberXor(o)));
    return [
      table(["5 를 넣은 횟수 c", "c 의 홀짝", "정본의 반환값"], rows, [
        "r",
        "l",
        "r",
      ]),
      "",
      `${show(WALK)} 의 칸 순서를 바꿔 가며 세면 이렇습니다.`,
      "",
      table(
        ["세어 본 순서", "그중 서로 다른 나열", "나온 답의 가짓수", "그 답"],
        [
          [
            num(orders.length),
            num(distinct.size),
            num(answers.size),
            list([...answers]),
          ],
        ],
        ["r", "r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `deep.build` 전제 — 홀수 번 나온 값이 하나가 아니면 무엇이 나오는가. */
  "build-premise": () => {
    const cases: number[][] = [
      [1, 1, 3, 5],
      [4, 1, 2, 1, 2, 7],
      [9, 9, 9, 6, 6, 6],
      [2, 2],
    ];
    const rows = cases.map((nums) => {
      const odd = oddValues(nums);
      return [
        show(nums),
        list(odd),
        String(singleNumberXor(nums)),
        String(odd.reduce((a, b) => a ^ b, 0)),
      ];
    });
    return table(
      [
        "입력",
        "홀수 번 나온 값",
        "정본의 반환값",
        "홀수 번 나온 값을 XOR 한 값",
      ],
      rows,
      ["l", "l", "r", "r"],
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력. */
  "walk-input": () =>
    [
      `const nums = ${show(WALK)};`,
      `// 이 절이 끝나면 ${singleNumberXor(WALK)} 가 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 누적기를 0 으로 둔 직후. */
  "walk-init": () => {
    const empty = singleNumberXor([]);
    return [
      `nums = ${show(WALK)}   →   acc = 0 (${bin(0)}),  i = 0`,
      `nums = []                →   반복에 들어가지 않고 ${empty}${을를(empty)} 돌려준다`,
    ].join("\n");
  },

  /** `deep.walk` 짚고 가기 — 같은 값은 한 번만 겹치면 된다는 오해. */
  "pause-skip-duplicates": () => {
    const cases: number[][] = [
      WALK,
      [2, 2, 1],
      [5, 5, 5, 1, 1],
      [5, 5, 5],
      [7],
    ];
    const rows = cases.map((nums) => {
      const right = singleNumberXor(nums);
      const wrong = skipDuplicates(nums);
      const evenVals = [...new Set(nums)].filter(
        (v) => nums.filter((x) => x === v).length % 2 === 0,
      );
      return [
        label(nums),
        list(evenVals),
        String(right),
        String(wrong),
        right === wrong ? "같다" : "어긋난다",
      ];
    });
    return table(
      ["입력", "짝수 번 나온 값", "정본", "한 번만 겹친 판", "판정"],
      rows,
      ["l", "l", "r", "r", "l"],
    );
  },

  /** `deep.walk` 짚고 가기 — `[2, 2, 1]` 에서 두 절차가 걸음마다 어떻게 갈리는가. */
  "pause-skip-trace": () => {
    const nums = [2, 2, 1];
    const seen = new Set<number>();
    let right = 0;
    let wrong = 0;
    const rows = nums.map((v, i) => {
      right ^= v;
      const skip = seen.has(v);
      if (!skip) {
        seen.add(v);
        wrong ^= v;
      }
      return [
        `i = ${i}`,
        both(v, 2),
        both(right, 2),
        skip ? `${both(wrong, 2)} · 건너뜀` : both(wrong, 2),
      ];
    });
    if (right !== singleNumberXor(nums) || wrong !== skipDuplicates(nums))
      throw new Error("걸음이 두 절차와 다르다");
    return table(
      ["걸음", "읽은 값", "정본의 acc", "한 번만 겹친 판의 acc"],
      rows,
      ["l", "r", "r", "r"],
    );
  },

  /** `deep.walk` 2 — 앞 두 바퀴만 실행한 값. */
  "walk-first-two": () => {
    const t = traceFold(WALK);
    const rows = [
      ["T1", "—", "—", bin(0), "0"],
      ...t.folds
        .slice(0, 2)
        .map((f, k) => [
          `T${k + 2}`,
          String(f.i),
          both(f.v),
          bin(f.after),
          String(f.after),
        ]),
    ];
    return table(["걸음", "i", "nums[i]", "acc (이진)", "acc"], rows, [
      "l",
      "r",
      "r",
      "r",
      "r",
    ]);
  },

  /** `deep.walk` 짚고 가기 — 32 비트 밖의 값. */
  "pause-int32": () => {
    const cases: number[][] = [
      [2 ** 30, 1, 1],
      [2 ** 31 - 1, 3, 3],
      [2 ** 31, 1, 1],
      [2 ** 32 + 5, 3, 3],
      [2 ** 32 + 5, 2 ** 32 + 5, 2 ** 32 + 5, 5, 5],
    ];
    const rows = cases.map((nums) => {
      const want = byDefinition(nums);
      const got = singleNumberXor(nums);
      return [
        show(nums),
        Math.max(...nums.map(Math.abs)) < 2 ** 31 ? "안" : "밖",
        want === null ? "없다" : num(want),
        num(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    return table(
      ["입력", "절댓값 2^31 기준", "정의가 낸 답", "정본이 낸 답", "판정"],
      rows,
      ["l", "l", "r", "r", "l"],
    );
  },

  /** `deep.walk` 3 — 고정 입력을 끝까지 실행한 걸음. 조건의 참·거짓을 값으로. */
  "walk-trace": () => {
    const t = traceFold(WALK);
    const n = WALK.length;
    if (t.answer !== singleNumberXor(WALK)) throw new Error("사본이 다르다");
    const rows = [
      ["T1", "—", "—", "—", bin(0), "0", "①"],
      ...t.folds.map((f, k) => [
        `T${k + 2}`,
        String(f.i),
        `${f.i} < ${n} 참`,
        both(f.v),
        bin(f.after),
        String(f.after),
        "② 참 · ③",
      ]),
      [
        `T${n + 2}`,
        String(n),
        `${n} < ${n} 거짓`,
        "—",
        bin(t.answer),
        String(t.answer),
        "② 거짓 · ④",
      ],
    ];
    return table(
      ["걸음", "i", "i < N", "nums[i]", "acc (이진)", "acc", "갈래"],
      rows,
      ["l", "r", "l", "r", "r", "r", "l"],
    );
  },

  /** `deep.walk` 3 — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const n = WALK.length;
    const loop = Array.from({ length: n }, (_, k) => `T${k + 2}`).join(" ");
    const end = `T${n + 2}`;
    const rows = [
      ["①", "acc 를 항등원 0 으로 둔다", "T1", "1 번"],
      ["② 참", "안 읽은 칸이 남았다", loop, `${n} 번`],
      ["② 거짓", "칸을 다 읽었다", end, "1 번"],
      ["③", "한 칸을 acc 에 겹친다", loop, `${n} 번`],
      ["④", "acc 를 돌려준다", end, "1 번"],
    ];
    return table(["갈래", "하는 일", "걸음", "실행 횟수"], rows, [
      "l",
      "l",
      "l",
      "r",
    ]);
  },

  /** `deep.walk.final` — 여러 입력에 실행한 결과. */
  "walk-final": () => {
    const cases: number[][] = [
      WALK,
      [2, 2, 1],
      [5, 5, 5, 1, 1],
      [-5, 1, 1],
      [0, 1, 1, 2, 2],
      [42],
    ];
    const calls = cases.map((nums) => `singleNumberXor(${show(nums)})`);
    const w = Math.max(...calls.map((c) => c.length));
    return cases
      .map(
        (nums, k) =>
          `${(calls[k] as string).padEnd(w)}   →   ${singleNumberXor(nums)}`,
      )
      .join("\n");
  },

  /** `related` — 같은 값을 거듭 겹치면 두 번마다 제자리로 온다. */
  "related-toggle": () => {
    const rows = Array.from({ length: 5 }, (_, k) => {
      const nums = Array.from({ length: k }, () => 1);
      const acc = singleNumberXor(nums);
      return [String(k), bin(acc), String(acc)];
    });
    const t = traceFold(WALK).folds.slice(1, 4);
    const walkRows = t.map((f) => [`T${f.i + 2}`, both(f.v), bin(f.after)]);
    return [
      table(["1 을 겹친 횟수", "acc (이진)", "acc"], rows, ["r", "r", "r"]),
      "",
      "전개에서 같은 자리를 보면 이렇습니다.",
      "",
      table(["걸음", "nums[i]", "acc (이진)"], walkRows, ["l", "r", "r"]),
    ].join("\n");
  },

  /** `deep.math` — XOR 과 2 로 나눈 나머지의 덧셈. */
  "math-truth": () => {
    const rows: string[][] = [];
    for (const a of [0, 1]) {
      for (const b of [0, 1]) {
        rows.push([
          String(a),
          String(b),
          String(a ^ b),
          String(a + b),
          String((a + b) % 2),
        ]);
      }
    }
    return table(
      ["a_j", "b_j", "a_j ^ b_j", "a_j + b_j", "(a_j + b_j) mod 2"],
      rows,
      ["r", "r", "r", "r", "r"],
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const answer = singleNumberXor(WALK);
    const rows = [2, 1, 0].map((j) => {
      const b = WALK.map((v) => bitAt(v, j));
      const s = b.reduce((x, y) => x + y, 0);
      return [
        String(j),
        String(2 ** j),
        b.join(" "),
        String(s),
        String(s % 2),
        String(bitAt(answer, j)),
      ];
    });
    return table(
      [
        "자리 j",
        "2^j",
        "nums 의 자리 j 비트",
        "합",
        "합 mod 2",
        "정본 답의 자리 j",
      ],
      rows,
      ["r", "r", "l", "r", "r", "r"],
    );
  },

  /** `deep.math` ③ — 자리 0 에서 칸 순서의 합과 값마다 묶은 합. */
  "math-regroup": () => {
    const j = 0;
    const terms = WALK.map((v) => bitAt(v, j));
    const count = new Map<number, number>();
    for (const v of WALK) count.set(v, (count.get(v) ?? 0) + 1);
    const grouped = [...count].map(([v, c]) => ({ v, c, b: bitAt(v, j) }));
    const s1 = terms.reduce((x, y) => x + y, 0);
    const s2 = grouped.reduce((x, g) => x + g.c * g.b, 0);
    return table(
      ["더하는 방법", "항", "합"],
      [
        ["칸 번호 순서대로", terms.join(" + "), String(s1)],
        [
          "값마다 묶어서",
          `${grouped.map((g) => `c_${g.v}·${g.b}`).join(" + ")} = ${grouped.map((g) => `${g.c}·${g.b}`).join(" + ")}`,
          String(s2),
        ],
      ],
      ["l", "l", "r"],
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣는다. */
  "math-scale": () => {
    const rows = [11, 1_001, 1_000_000].map((n) => {
      const x = 5 * n + 2;
      const r = rescanWorst(n);
      return [num(n), num(x), num(r), fixed2(r / x)];
    });
    const same = [11, 1_001].every((n) => totalOps(countOps(n)) === 5 * n + 2);
    return [
      table(["N", "XOR 누적 5N + 2", "다시 세기 N(N + 1)", "몇 배"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `N = 11 · 1,001 에서 기본 연산을 실제로 센 값이 5N + 2 와 ${same ? "하나하나 일치했습니다" : "일치하지 않았습니다"}.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 acc 를 정의로 센 값과 대조한다. */
  "invariant-steps": () => {
    const t = traceFold(WALK);
    if (t.answer !== singleNumberXor(WALK)) throw new Error("사본이 다르다");
    let bad = 0;
    const rows = t.folds.map((f, k) => {
      const prefix = WALK.slice(0, f.i + 1);
      // 정의 — 자리마다 그 자리에 1 을 가진 칸 수의 홀짝.
      let def = 0;
      for (let j = 0; j < WALK_BITS; j++) {
        const c = prefix.filter((v) => bitAt(v, j) === 1).length;
        if (c % 2 === 1) def += 2 ** j;
      }
      if (def !== f.after) bad++;
      return [
        `T${k + 2}`,
        show(prefix),
        bin(f.after),
        bin(def),
        def === f.after ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        [
          "걸음이 끝난 뒤",
          "읽은 칸",
          "acc",
          "자리마다 1 의 개수의 홀짝",
          "판정",
        ],
        rows,
        ["l", "l", "r", "r", "l"],
      ),
      "",
      `${rows.length} 걸음 모두에서 두 값을 대조했고, 어긋난 걸음은 ${bad} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const edges: [string, number[]][] = [
      ["빈 배열", []],
      ["원소 하나", [42]],
      ["0 이 답", [0, 1, 1, 2, 2]],
      ["답이 음수", [-5, 1, 1]],
      ["음수끼리 지워진다", [-1, -1, -2, 3, 3]],
      ["같은 값이 세 번", [5, 5, 5, 1, 1]],
      ["자리 30 이 1 인 값", [2 ** 30, 1, 1]],
    ];
    const rows = edges.map(([name, nums]) => {
      const want = byDefinition(nums);
      return [
        name,
        show(nums),
        want === null ? "없다" : num(want),
        num(singleNumberXor(nums)),
      ];
    });
    return table(["경계", "입력", "정의가 낸 답", "정본이 낸 답"], rows, [
      "l",
      "l",
      "r",
      "r",
    ]);
  },

  /** `invariant` ③ — XOR 을 OR 로 바꾼 변이. */
  "mutant-or": () => {
    const rows = SAMPLES.map((nums) => {
      const right = singleNumberXor(nums);
      const wrong = orMutant.singleNumberXor(nums);
      return [
        label(nums),
        String(right),
        String(wrong),
        right === wrong ? "같다" : "어긋난다",
      ];
    });
    return table(["입력", "정본", "OR 로 바꾼 판", "판정"], rows, [
      "l",
      "r",
      "r",
      "l",
    ]);
  },

  /** `invariant` ③ — `[2, 2, 1]` 의 자리 1 이 두 연산에서 어떻게 갈리는가. */
  "mutant-or-bit": () => {
    const nums = [2, 2, 1];
    const ops: [string, (a: number, b: number) => number][] = [
      ["XOR", (a, b) => a ^ b],
      ["OR", (a, b) => a | b],
    ];
    const rows = ops.map(([name, op]) => {
      let acc = 0;
      const cells = [String(bitAt(acc, 1))];
      for (const v of nums) {
        acc = op(acc, v);
        cells.push(String(bitAt(acc, 1)));
      }
      return [name, ...cells, String(acc)];
    });
    return table(
      ["연산", "처음", "2 를 겹친 뒤", "2 를 또 겹친 뒤", "1 을 겹친 뒤", "답"],
      rows,
      ["l", "r", "r", "r", "r", "r"],
    );
  },

  /** `perf.derive` — 전개의 걸음을 무리로 나눠 기본 연산을 센다. */
  "perf-count": () => {
    const n = WALK.length;
    const all = countOps(n);
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0", "1", "0"],
      [
        "바퀴",
        `T2 ~ T${n + 1}`,
        String(n),
        String(n),
        String(all.read),
        String(all.xor),
        String(all.assign - 1),
        String(all.increment),
      ],
      ["종료 검사와 반환", `T${n + 2}`, "1", "1", "0", "0", "0", "0"],
      [
        "합계",
        "",
        String(n + 2),
        String(all.compare),
        String(all.read),
        String(all.xor),
        String(all.assign),
        String(all.increment),
      ],
    ];
    const formula = 5 * n + 2;
    return [
      table(
        ["무리", "걸음", "걸음 수", "비교", "칸 읽기", "XOR", "대입", "증가"],
        rows,
        ["l", "l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `다섯 계수를 합치면 ${totalOps(all)} 이고, N = ${n}${을를(n)} 5N + 2 에 넣은 값 ${formula}${과와(formula)} 같습니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 길이만 같고 모양이 다른 입력. */
  "perf-worst": () => {
    const n = 1_001;
    const half = (n - 1) / 2;
    const pairs: number[] = [];
    for (let v = 1; v <= half; v++) pairs.push(v, v);
    const sorted = [...pairs].sort((a, b) => a - b);
    const shapes: [string, number[]][] = [
      ["값이 전부 같다", Array.from({ length: n }, () => 7)],
      ["짝이 붙어 있다", [...pairs, 12_345]],
      ["짝을 반씩 떨어뜨렸다", spread(n)],
      ["내림차순", [...sorted].reverse().concat(12_345)],
      [
        "값이 2^30 언저리",
        [...pairs.map((v) => v + 2 ** 30), 2 ** 30 + 12_345],
      ],
      [
        "음수와 양수가 섞였다",
        [
          ...pairs.map((v, k) => (Math.floor(k / 2) % 2 === 0 ? -v : v)),
          -12_345,
        ],
      ],
    ];
    const rows = shapes.map(([name, nums]) => {
      const ops = countOps(nums.length);
      return [
        name,
        num(nums.length),
        num(ops.read),
        num(totalOps(ops)),
        num(singleNumberXor(nums)),
      ];
    });
    const big = 1_000_000;
    return [
      table(["입력의 모양", "N", "칸 읽기", "기본 연산", "답"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `N = ${num(big)}${을를(num(big))} 5N + 2 에 넣으면 기본 연산은 ${num(totalOps(countOps(big)))} 번입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T4 시점의 acc 는 배열에 없는 값이다. */
  "check-midway": () => {
    const t = traceFold(WALK);
    const mid = t.folds[2] as Fold;
    const rows = [
      [
        `T${mid.i + 2} 까지`,
        show(WALK.slice(0, mid.i + 1)),
        bin(mid.after),
        String(mid.after),
      ],
      ["끝까지", show(WALK), bin(t.answer), String(t.answer)],
    ];
    return table(["어디까지", "읽은 값", "acc (이진)", "acc"], rows, [
      "l",
      "l",
      "r",
      "r",
    ]);
  },
};
