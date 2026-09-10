/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 덧셈을 몇 번 했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 본다.
 *
 * **정렬 견주기는 병합 정렬로 센다.** 정본이 부르는 `Float64Array.prototype.sort()` 는 어떤
 * 절차를 쓰는지 언어 명세가 정하지 않아 견주기 횟수를 셀 수 없다. 같은 차수의 절차 하나를
 * 골라 그것으로 세고, 그 사실을 본문에도 적는다.
 *
 * **큰 수는 `bigint` 로 센다.** 순진한 판의 연산 수는 원소 40 개에서 14 자리를 넘어 배정밀도
 * 정수 표현이 정확한 범위를 벗어난다 — 그 자리에서 `number` 로 세면 값이 조용히 반올림된다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  meetInTheMiddleSubsetSum,
  subsetSums,
} from "./meetInTheMiddleSubsetSum-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 입력. 원소 여섯이고 답이 `true` 다.
 *
 * 여덟 갈래를 한 입력에서 전부 실행한다 — 합 목록 두 벌 · 새 칸 채우기 · 가운데 칸 적중 ·
 * 오른쪽 절반 남기기 · 왼쪽 절반 남기기 · 앞 무리 크기 정하기 · 정렬 · 질의. 그리고 원소가
 * 여섯이라야 앞 무리와 뒤 무리가 셋씩으로 갈려 목록 여덟 칸이 나온다.
 */
export const WALK: number[] = [3, 34, 4, 12, 5, 2];
export const WALK_TARGET = 9;

/** 아이디어 절이 손으로 전부 나열하는 작은 입력. 부분집합이 열여섯 개다. */
export const SMALL: number[] = [3, 5, 1, 2];
export const SMALL_TARGET = 8;

/** 음수가 섞인 원소 넷. 정렬을 빼면 답이 갈리는 자리를 담는다. */
export const NEG4: number[] = [1, 2, 5, -3];
export const NEG4_TARGET = -3;

/** `a_k = 2(k+1)` — 원소가 전부 짝수라 목표 1 은 만들 수 없다. 규모를 늘릴 때 쓴다. */
export function even(n: number): number[] {
  return Array.from({ length: n }, (_, k) => 2 * (k + 1));
}

/** 제약 상한 — 원소 수 · 원소 절댓값 · 목표 절댓값. */
export const N_LIMIT = 40;
export const V_LIMIT = 1000000000;
export const T_LIMIT = 1000000000000000000;
/** 메모리 제한 — 문제가 준 256 MB 를 바이트로 적은 값. */
export const MEM_LIMIT = 256000000;
/** 배정밀도가 정수를 정확히 담는 상한. */
export const SAFE_LIMIT = Number.MAX_SAFE_INTEGER;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 표 한 벌을 칸에 맞춰 낸다. 첫 행이 머리줄이다. */
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
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** `12,345` 꼴 — 본문 표기와 같다. */
const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** 바이트 수를 사람이 읽는 단위로. 1 MiB 미만은 바이트 그대로 적는다. */
const size = (bytes: number): string =>
  Math.abs(bytes) < 1048576
    ? `${comma(bytes)} 바이트`
    : `${comma(Math.round(bytes / 1048576))} MiB`;

/** 1 부터 열까지의 우리말 수관형사. 개수를 산문으로 적을 때 값에서 고른다. */
const COUNT_WORDS = [
  "영",
  "하나",
  "둘",
  "셋",
  "넷",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];

export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? comma(n);
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 병합 정렬 — 견주기 횟수를 결정론적으로 센다. */
export function mergeSortCount(a: number[]): { sorted: number[]; cmp: number } {
  let cmp = 0;
  const go = (xs: number[]): number[] => {
    if (xs.length <= 1) return xs;
    const h = xs.length >> 1;
    const l = go(xs.slice(0, h));
    const r = go(xs.slice(h));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < l.length && j < r.length) {
      cmp++;
      if ((l[i] as number) <= (r[j] as number)) out.push(l[i++] as number);
      else out.push(r[j++] as number);
    }
    while (i < l.length) out.push(l[i++] as number);
    while (j < r.length) out.push(r[j++] as number);
    return out;
  };
  return { sorted: go(a), cmp };
}

export interface Counts {
  answer: boolean;
  /** ① — 합 목록을 잡은 횟수. */
  allocs: number;
  /** ② — 새 칸에 값을 적은 횟수. 곧 덧셈 횟수다. */
  writes: number;
  /** 정렬 견주기 횟수. */
  cmp: number;
  /** ③ — 가운데 칸이 찾는 값이었던 횟수. */
  hits: number;
  /** ④ — 오른쪽 절반만 남긴 횟수. */
  right: number;
  /** ⑤ — 왼쪽 절반만 남긴 횟수. */
  left: number;
  /** ⑥ — 앞 무리의 크기를 정한 횟수. */
  splits: number;
  /** ⑦ — 뒤 무리를 정렬한 횟수. */
  sorts: number;
  /** ⑧ — 앞 무리의 합 하나로 질의를 낸 횟수. */
  queries: number;
  /** 이분 탐색이 가운데 칸을 본 총 횟수. */
  steps: number;
  /** 기본 연산 — 덧셈 + 정렬 견주기 + 이분 탐색 걸음. */
  ops: number;
  /** 두 합 목록이 잡는 칸의 합. */
  cells: number;
  sumsA: number[];
  sorted: number[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(
  nums: number[],
  target: number,
  midOverride?: number,
): Counts {
  const n = nums.length;
  const mid = midOverride ?? n >> 1;
  let allocs = 0;
  let writes = 0;
  const build = (from: number, to: number): number[] => {
    allocs++;
    const out = new Array<number>(1 << (to - from)).fill(0);
    let size = 1;
    for (let i = from; i < to; i++) {
      const a = nums[i] as number;
      for (let k = 0; k < size; k++) {
        writes++;
        out[size + k] = (out[k] as number) + a;
      }
      size <<= 1;
    }
    return out;
  };
  const sumsA = build(0, mid);
  const sumsB = build(mid, n);
  const { sorted, cmp } = mergeSortCount(sumsB);
  let hits = 0;
  let right = 0;
  let left = 0;
  let queries = 0;
  let steps = 0;
  let answer = false;
  for (const sA of sumsA) {
    queries++;
    const need = target - sA;
    let lo = 0;
    let hi = sorted.length - 1;
    let found = false;
    while (lo <= hi) {
      steps++;
      const m = (lo + hi) >> 1;
      const v = sorted[m] as number;
      if (v === need) {
        hits++;
        found = true;
        break;
      }
      if (v < need) {
        right++;
        lo = m + 1;
      } else {
        left++;
        hi = m - 1;
      }
    }
    if (found) {
      answer = true;
      break;
    }
  }
  return {
    answer,
    allocs,
    writes,
    cmp,
    hits,
    right,
    left,
    splits: 1,
    sorts: 1,
    queries,
    steps,
    ops: writes + cmp + steps,
    cells: sumsA.length + sumsB.length,
    sumsA,
    sorted,
  };
}

/** 이분 탐색 한 번을 걸음마다 기록한 것. */
export interface Probe {
  lo: number;
  hi: number;
  mid: number;
  value: number;
  /** 이 걸음이 한 일 — 적중 · 오른쪽 절반 · 왼쪽 절반. */
  move: "적중" | "오른쪽" | "왼쪽";
  /**
   * 좁힌 구간 `[lo, hi]` 밖의 칸에 찾는 값이 없는가.
   *
   * **실행이 판정한다** — 구간 밖의 칸을 하나씩 읽어 찾는 값과 같은 것이 있는지 실제로 센다.
   * 표에 손으로 적으면 세운 문장이 틀려도 표가 맞아 보인다.
   */
  outsideClean: boolean;
}

/** 질의 하나의 기록. */
export interface Query {
  sA: number;
  need: number;
  probes: Probe[];
  found: boolean;
}

/** 좁힌 구간 밖에 찾는 값이 남아 있지 않은지 실제로 견준다. */
function outsideClean(
  sorted: number[],
  lo: number,
  hi: number,
  need: number,
): boolean {
  for (const [j, v] of sorted.entries()) {
    if (j >= lo && j <= hi) continue;
    if (v === need) return false;
  }
  return true;
}

/**
 * 걸음마다의 구간을 남기는 사본. 불변식 대조가 쓴다.
 *
 * `flip` 이 참이면 버릴 절반을 반대로 고른다 — 불변식을 지키던 줄을 바꾼 판이다. 이 사본이
 * 같은 이름의 변이와 같은 답을 내는지는 아래 자기검사가 본다.
 */
export function queryRecord(
  nums: number[],
  target: number,
  flip = false,
): { queries: Query[]; sorted: number[]; answer: boolean } {
  const c = counted(nums, target);
  const sorted = c.sorted;
  const queries: Query[] = [];
  let answer = false;
  for (const sA of c.sumsA) {
    const need = target - sA;
    const probes: Probe[] = [];
    let lo = 0;
    let hi = sorted.length - 1;
    let found = false;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = sorted[mid] as number;
      if (v === need) {
        probes.push({
          lo,
          hi,
          mid,
          value: v,
          move: "적중",
          outsideClean: outsideClean(sorted, lo, hi, need),
        });
        found = true;
        break;
      }
      const goRight = flip ? v > need : v < need;
      if (goRight) lo = mid + 1;
      else hi = mid - 1;
      probes.push({
        lo,
        hi,
        mid,
        value: v,
        move: goRight ? "오른쪽" : "왼쪽",
        outsideClean: outsideClean(sorted, lo, hi, need),
      });
    }
    queries.push({ sA, need, probes, found });
    if (found) {
      answer = true;
      break;
    }
  }
  return { queries, sorted, answer };
}

/**
 * 답을 낸 앞 무리의 합이 무엇인가. `strict` 면 후보 구간이 한 칸 남은 자리를 안 본다.
 *
 * 「한 칸 구간을 안 보는 판」이 어떤 입력에서 답을 그대로 내는 이유가 **다른 앞 무리 합이
 * 대신 찾아 주기 때문**인지를 값으로 보이는 자리다. 사본이 같은 이름의 변이와 같은 답을
 * 내는지는 아래 자기검사가 본다.
 */
export function firstHit(
  nums: number[],
  target: number,
  strict = false,
): { sA: number; need: number; order: number } | null {
  const c = counted(nums, target);
  for (const [i, sA] of c.sumsA.entries()) {
    const need = target - sA;
    let lo = 0;
    let hi = c.sorted.length - 1;
    while (strict ? lo < hi : lo <= hi) {
      const m = (lo + hi) >> 1;
      const v = c.sorted[m] as number;
      if (v === need) return { sA, need, order: i + 1 };
      if (v < need) lo = m + 1;
      else hi = m - 1;
    }
  }
  return null;
}

/** 걸음 전체에서 문장이 깨진 걸음의 수. */
export function brokenSteps(
  nums: number[],
  target: number,
  flip = false,
): { steps: number; broken: number } {
  const probes = queryRecord(nums, target, flip).queries.flatMap(
    (q) => q.probes,
  );
  return {
    steps: probes.length,
    broken: probes.filter((p) => !p.outsideClean).length,
  };
}

/**
 * 모든 부분집합을 하나씩 만들어 합을 재는 순진한 판.
 *
 * 마스크 하나마다 원소 `n` 개의 자리를 검사하고, 켜진 자리마다 더하고, 만든 합을 목표와
 * 한 번 견준다. 답을 찾으면 거기서 멈춘다.
 */
export function naiveRun(
  nums: number[],
  target: number,
): { ops: number; masks: number; answer: boolean } {
  const n = nums.length;
  let ops = 0;
  let masks = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    masks++;
    let s = 0;
    for (let i = 0; i < n; i++) {
      ops++;
      if ((mask >> i) & 1) {
        ops++;
        s += nums[i] as number;
      }
    }
    ops++;
    if (s === target) return { ops, masks, answer: true };
  }
  return { ops, masks, answer: false };
}

/** 순진한 판이 끝까지 하는 기본 연산의 닫힌 형태 — `2^n(n+1) + n·2^(n-1)`. */
export function naiveOps(n: number): bigint {
  const two = (e: number): bigint => 1n << BigInt(e);
  return two(n) * BigInt(n + 1) + BigInt(n) * two(n - 1);
}

/** 두 무리로 나눴을 때 덧셈의 정확한 횟수 — `(2^k - 1) + (2^(n-k) - 1)`. */
export function addBound(n: number, k: number): number {
  return 2 ** k - 1 + 2 ** (n - k) - 1;
}

/** 길이 `2^b` 목록을 병합 정렬할 때 견주기의 상한 — `b·2^b - 2^b + 1`. */
export function sortBound(b: number): number {
  return b * 2 ** b - 2 ** b + 1;
}

/** 길이 `2^b` 목록에서 이분 탐색 한 번의 걸음 상한 — `b + 1`. */
export function searchBound(b: number): number {
  return b + 1;
}

/** 기본 연산의 상한 — 덧셈 + 정렬 견주기 상한 + 질의마다의 걸음 상한. */
export function opsBound(n: number, k: number): number {
  return addBound(n, k) + sortBound(n - k) + 2 ** k * searchBound(n - k);
}

/** 두 합 목록이 잡는 칸 — `2^k + 2^(n-k)`. */
export function cellCount(n: number, k: number): number {
  return 2 ** k + 2 ** (n - k);
}

/* ────────────────────────── 자기대조 ────────────────────────── */

const SELF_CASES: [number[], number][] = [
  [WALK, WALK_TARGET],
  [WALK, 30],
  [SMALL, SMALL_TARGET],
  [NEG4, NEG4_TARGET],
  [[7], 7],
  [[7], 5],
  [[], 0],
  [[], 5],
  [[0, 0, 0], 0],
  [[1, 2, 3, 4, 5], 9],
  [even(12), 1],
  [even(13), 26],
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [nums, target] of SELF_CASES) {
    const want = meetInTheMiddleSubsetSum(nums, target);
    if (counted(nums, target).answer !== want) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (queryRecord(nums, target).answer !== want) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (nums.length <= 20 && naiveRun(nums, target).answer !== want) {
      throw new Error("순진한 판이 정본과 다른 답을 낸다");
    }
  }
  for (let n = 2; n <= 14; n++) {
    const nums = even(n);
    if (BigInt(naiveRun(nums, 1).ops) !== naiveOps(n)) {
      throw new Error(`순진한 판의 닫힌 형태가 실측과 다르다 — n = ${n}`);
    }
    const k = n >> 1;
    const c = counted(nums, 1);
    if (c.writes !== addBound(n, k)) {
      throw new Error(`덧셈 횟수가 닫힌 형태와 다르다 — n = ${n}`);
    }
    if (c.cells !== cellCount(n, k)) {
      throw new Error(`칸 수가 닫힌 형태와 다르다 — n = ${n}`);
    }
    if (c.cmp > sortBound(n - k)) {
      throw new Error(`정렬 견주기가 상한을 넘었다 — n = ${n}`);
    }
    if (c.ops > opsBound(n, k)) {
      throw new Error(`기본 연산이 상한을 넘었다 — n = ${n}`);
    }
  }
  // 정본이 만드는 합 목록과 세는 사본이 만드는 목록이 같은 값인지 본다.
  const ref = [...subsetSums(WALK, 0, 3)];
  const mine = counted(WALK, WALK_TARGET).sumsA;
  if (ref.join(",") !== mine.join(",")) {
    throw new Error("세는 사본의 합 목록이 정본의 것과 다르다");
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./meetInTheMiddleSubsetSum-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  meetInTheMiddleSubsetSum(nums: number[], target: number): boolean;
}

/** 뒤 무리를 정렬하는 줄을 뺀 사본. */
const noSort = await loadMutant<Impl>(REF, { drop: /sumsB\.sort\(\);/ });

/** 나누는 자리를 반이 아니라 1/4 지점에 둔 사본. */
const quarter = await loadMutant<Impl>(REF, {
  swap: [/const mid = n >> 1;/, "const mid = n >> 2;"],
});

/** 후보 구간이 한 칸 남았을 때를 안 보는 사본. */
const strictWhile = await loadMutant<Impl>(REF, {
  swap: [/while \(lo <= hi\) \{/, "while (lo < hi) {"],
});

/** **불변식을 지키던 줄** 하나 — 버리는 절반을 반대로 고르는 사본. */
const flipped = await loadMutant<Impl>(REF, {
  swap: [/if \(v < value\) \{/, "if (v > value) {"],
});

/** 변이 대조가 쓰는 입력 다섯. 모든 변이 표가 같은 다섯을 쓴다. */
export const MUTANT_CASES: { label: string; nums: number[]; target: number }[] =
  [
    { label: "전개 입력", nums: WALK, target: WALK_TARGET },
    { label: "같은 입력 · 목표 30", nums: WALK, target: 30 },
    { label: "음수가 섞인 넷", nums: NEG4, target: NEG4_TARGET },
    { label: "원소 하나", nums: [7], target: 7 },
    { label: "빈 배열", nums: [], target: 0 },
  ];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noSort.meetInTheMiddleSubsetSum === meetInTheMiddleSubsetSum;

if (!중화됨) {
  // 답을 바꾸어야 하는 변이 셋. 하나도 안 갈리면 그 절의 주장이 성립하지 않는다.
  for (const [label, impl] of [
    ["정렬을 뺀 판", noSort],
    ["한 칸 남은 구간을 안 보는 판", strictWhile],
    ["버릴 절반을 반대로 고른 판", flipped],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          meetInTheMiddleSubsetSum(c.nums, c.target) ===
          impl.meetInTheMiddleSubsetSum(c.nums, c.target),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 1/4 지점 변이는 **답을 바꾸지 않는 것**이 주장이다. 대신 연산 수가 갈려야 한다.
  for (const c of MUTANT_CASES) {
    if (
      meetInTheMiddleSubsetSum(c.nums, c.target) !==
      quarter.meetInTheMiddleSubsetSum(c.nums, c.target)
    ) {
      throw new Error("1/4 지점 변이가 답을 바꿨다 — 본문의 주장과 어긋난다");
    }
  }
  const a = counted(WALK, WALK_TARGET).ops;
  const b = counted(WALK, WALK_TARGET, WALK.length >> 2).ops;
  if (a === b) {
    throw new Error("1/4 지점 변이가 연산 수도 안 바꿨다 — 대조할 것이 없다");
  }
  // 한 칸 구간을 안 보는 사본이 같은 이름의 변이와 같은 답을 내는지 본다.
  for (const c of MUTANT_CASES) {
    if (
      (firstHit(c.nums, c.target, true) !== null) !==
      strictWhile.meetInTheMiddleSubsetSum(c.nums, c.target)
    ) {
      throw new Error(
        "한 칸 구간을 안 보는 사본이 같은 이름의 변이와 다른 답을 낸다",
      );
    }
  }
  // 버릴 절반을 반대로 고르는 사본이 같은 이름의 변이와 같은 답을 내는지 본다.
  for (const c of MUTANT_CASES) {
    if (
      queryRecord(c.nums, c.target, true).answer !==
      flipped.meetInTheMiddleSubsetSum(c.nums, c.target)
    ) {
      throw new Error("뒤집은 사본이 같은 이름의 변이와 다른 답을 낸다");
    }
  }
}

/* ────────────────────── 비트 · 메모리 한계 ────────────────────── */

/** 원소 `n` 개에서 두 합 목록의 길이 표기가 성립하는지 실제 연산으로 본다. */
export function limitProbe(n: number): {
  k: number;
  shiftA: number;
  shiftB: number;
  cells: number;
  bytes: number;
  note: string;
} {
  const k = n >> 1;
  const shiftA = 1 << k;
  const shiftB = 1 << (n - k);
  const cells = shiftA + shiftB;
  const bytes = cells * 8;
  let note: string;
  if (shiftA < 0 || shiftB < 0) note = "길이가 음수라 목록을 잡지 못한다";
  else if (shiftA !== 2 ** k || shiftB !== 2 ** (n - k))
    note = "1 << m 이 2^m 이 아니다";
  else if (bytes > MEM_LIMIT) note = "표기는 성립하지만 메모리 제한을 넘는다";
  else note = "표기가 성립하고 메모리 제한 안에 든다";
  return { k, shiftA, shiftB, cells, bytes, note };
}

/** 실제로 불러 본다. 던지면 그 예외를, 아니면 반환값을 낸다. */
export function callProbe(n: number, target: number): string {
  const nums = new Array<number>(n).fill(1);
  try {
    return `${meetInTheMiddleSubsetSum(nums, target)} 를 돌려준다`;
  } catch (e) {
    return `${(e as Error).constructor.name} 를 던진다`;
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

const REC = queryRecord(WALK, WALK_TARGET);
const WALK_MID = WALK.length >> 1;
const WALK_B = [...subsetSums(WALK, WALK_MID, WALK.length)];
const WALK_SORTED = REC.sorted;
const WALK_COUNTS = counted(WALK, WALK_TARGET);
/** 전개 입력에서 답을 찾은 질의. 마지막 질의가 그 자리다. */
const LAST = REC.queries[REC.queries.length - 1] as Query;
/** 전개 입력에서 정본과 「한 칸 구간을 안 보는 판」이 각각 답을 낸 자리. */
const WALK_GOOD = firstHit(WALK, WALK_TARGET);
const WALK_STRICT = firstHit(WALK, WALK_TARGET, true);

/** 걸음 이름 — T1 이 나누기, T2~T4 가 앞 무리, T5 가 뒤 무리, T6 이 정렬, T7~T11 이 질의. */
function stepName(index: number): string {
  return `T${index}`;
}

/** 목록 하나를 공백으로 이어 적는다. */
const listing = (xs: number[]): string => xs.join(" ");

/**
 * `<!--viz:mitmWalk-->` 아래 ascii 펜스의 내용 — `.sim.ts` 의 프레임과 **같은 걸음**을 같은
 * 순서로 보인다.
 *
 * `PROOFS` 에 넣지 않는다 — `check-proof` 는 `<!--proof:-->` 만 대조하고, viz 펜스는
 * 대화형 패널의 md 대체물이라 판정 대상이 아니다. 값은 여기서 만들어 원고에 옮기고,
 * `.sim.ts` 의 프레임과 필드 단위로 맞는지는 별도 대조가 본다.
 */
export function walkViz(): string {
  const rows: string[][] = [
    [
      stepName(1),
      "나누기",
      `앞 ${WALK_MID} 개 · 뒤 ${WALK.length - WALK_MID} 개`,
      "",
    ],
  ];
  for (let i = 1; i <= WALK_MID; i++) {
    rows.push([
      stepName(1 + i),
      "앞 무리",
      `원소 ${WALK[i - 1]} 까지의 합 목록`,
      listing([...subsetSums(WALK, 0, i)]),
    ]);
  }
  rows.push([
    stepName(2 + WALK_MID),
    "뒤 무리",
    "합 목록을 만든다",
    listing(WALK_B),
  ]);
  rows.push([
    stepName(3 + WALK_MID),
    "정렬",
    "뒤 무리만 오름차순으로",
    listing(WALK_SORTED),
  ]);
  for (const [i, q] of REC.queries.entries()) {
    rows.push([
      stepName(4 + WALK_MID + i),
      "질의",
      `앞 무리의 합 ${q.sA} 에 모자란 값 ${q.need}`,
      q.found
        ? `걸음 ${q.probes.length} · 찾았다`
        : `걸음 ${q.probes.length} · 없다`,
    ]);
  }
  rows.push([
    stepName(4 + WALK_MID + REC.queries.length),
    "반환",
    `${REC.answer} 를 돌려준다`,
    "",
  ]);
  return [
    ...table([["걸음", "무엇", "이 걸음이 한 일", "그 시점의 값"], ...rows]),
    "",
    "한 걸음이 원소 하나 또는 질의 하나다. 대화형 패널은 같은 걸음을 이름 붙인 값 목록으로 그린다",
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 순진한 판의 규모. */
  naiveScale: () => {
    const rows = [6, 10, 14, 18, 20].map((n) => {
      const nums = even(n);
      const a = naiveRun(nums, 1);
      const b = counted(nums, 1);
      return [
        comma(n),
        comma(2 ** n),
        comma(a.ops),
        comma(b.ops),
        `${comma(Math.round(a.ops / b.ops))} 배`,
      ];
    });
    const big = naiveOps(N_LIMIT);
    const small = opsBound(N_LIMIT, N_LIMIT >> 1);
    return [
      ...table(
        [
          [
            "원소 n",
            "부분집합 2^n",
            "순진한 판의 기본 연산",
            "두 무리로 나눈 판",
            "비",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 상한 n = ${comma(N_LIMIT)} 에서`,
      ...table([
        ["  부분집합 2^n", comma(2n ** BigInt(N_LIMIT))],
        [
          "  순진한 판의 기본 연산",
          `${comma(big)} (${String(big).length} 자리)`,
        ],
        ["  두 무리로 나눈 판의 상한", comma(small)],
        [
          "  순진한 판을 1 초에 10 억 번 한다면",
          `${(Number(big) / 1e9 / 3600).toFixed(1)} 시간`,
        ],
        [
          "  나눈 판을 1 초에 10 억 번 한다면",
          `${(small / 1e9).toFixed(3)} 초`,
        ],
      ]),
    ].join("\n");
  },

  /** deep.build ③ — 작은 입력의 부분집합 열여섯 개를 전부 나열한다. */
  smallEnumerate: () => {
    const n = SMALL.length;
    const rows: string[][] = [];
    for (let mask = 0; mask < 1 << n; mask++) {
      const picked: number[] = [];
      let s = 0;
      for (let i = 0; i < n; i++) {
        if ((mask >> i) & 1) {
          picked.push(SMALL[i] as number);
          s += SMALL[i] as number;
        }
      }
      rows.push([
        mask.toString(2).padStart(n, "0"),
        picked.length === 0 ? "{}" : `{${picked.join(", ")}}`,
        comma(s),
      ]);
    }
    const hit = rows.filter((r) => Number(r[2]) === SMALL_TARGET);
    return [
      ...table([["자리 3210", "고른 원소", "합"], ...rows], [2]),
      "",
      `부분집합 ${comma(rows.length)} 개 중 합이 ${SMALL_TARGET} 인 것은 ${comma(hit.length)} 개다`,
      ...hit.map((r) => `  ${r[1]}`),
    ].join("\n");
  },

  /** deep.build ③ — 같은 입력을 앞 무리와 뒤 무리로 나눠 각각 만든다. */
  smallSplit: () => {
    const mid = SMALL.length >> 1;
    const a = [...subsetSums(SMALL, 0, mid)];
    const b = [...subsetSums(SMALL, mid, SMALL.length)];
    const pairs: string[][] = [];
    for (const [i, x] of a.entries()) {
      for (const [j, y] of b.entries()) {
        if (x + y !== SMALL_TARGET) continue;
        pairs.push([
          `앞 무리 자리 ${i}`,
          comma(x),
          `뒤 무리 자리 ${j}`,
          comma(y),
          comma(x + y),
        ]);
      }
    }
    return [
      ...table([
        ["무리", "원소", "부분집합 합 목록", "개수"],
        [
          "앞 무리 A",
          `{${SMALL.slice(0, mid).join(", ")}}`,
          listing(a),
          comma(a.length),
        ],
        [
          "뒤 무리 B",
          `{${SMALL.slice(mid).join(", ")}}`,
          listing(b),
          comma(b.length),
        ],
      ]),
      "",
      `목록 두 벌의 칸을 합치면 ${comma(a.length + b.length)} 이고 그 곱은 ${comma(a.length * b.length)} 이다`,
      `합이 ${SMALL_TARGET} 인 짝`,
      ...table(
        pairs.map((p) => [
          `  ${p[0]}`,
          p[1] as string,
          p[2] as string,
          p[3] as string,
          `합 ${p[4]}`,
        ]),
      ),
    ].join("\n");
  },

  /** deep.build ⑤ — 두 목록의 짝을 전부 보는 판은 아무것도 줄이지 못한다. */
  pairScan: () => {
    const rows = [6, 10, 14, 18, 20].map((n) => {
      const k = n >> 1;
      return [
        comma(n),
        comma(2 ** k),
        comma(2 ** (n - k)),
        comma(2 ** k * 2 ** (n - k)),
        comma(2 ** n),
      ];
    });
    return [
      ...table(
        [["원소 n", "앞 목록", "뒤 목록", "짝의 수", "부분집합 2^n"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "짝의 수가 부분집합의 수와 글자 그대로 같다 — 나누기만 해서는 세는 대상이 줄지 않는다",
    ].join("\n");
  },

  /** deep.build ⑥ — 자르는 자리를 바꿔 가며 기본 연산을 센다 (원소 여섯). */
  splitSweepSmall: () => {
    const rows: string[][] = [];
    let best = { k: -1, ops: Number.POSITIVE_INFINITY };
    for (let k = 0; k <= WALK.length; k++) {
      const c = counted(WALK, 30, k);
      if (c.ops < best.ops) best = { k, ops: c.ops };
      rows.push([
        comma(k),
        comma(2 ** k),
        comma(2 ** (WALK.length - k)),
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
      ]);
    }
    return [
      ...table(
        [
          [
            "앞 무리 크기 k",
            "앞 목록",
            "뒤 목록",
            "덧셈",
            "정렬 견주기",
            "탐색 걸음",
            "기본 연산",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `가장 적은 자리는 k = ${best.k} 이고 그때 기본 연산이 ${comma(best.ops)} 번이다`,
      `원소가 ${WALK.length} 개이므로 그 자리가 곧 내림한 n / 2 다`,
    ].join("\n");
  },

  /** deep.build ⑥ — 같은 스윕을 원소 열여섯에서. */
  splitSweepBig: () => {
    const n = 16;
    const nums = even(n);
    const rows: string[][] = [];
    let best = { k: -1, ops: Number.POSITIVE_INFINITY };
    for (let k = 0; k <= n; k++) {
      const c = counted(nums, 1, k);
      if (c.ops < best.ops) best = { k, ops: c.ops };
      rows.push([
        comma(k),
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
        comma(c.cells),
      ]);
    }
    return [
      ...table(
        [
          [
            "앞 무리 크기 k",
            "덧셈",
            "정렬 견주기",
            "탐색 걸음",
            "기본 연산",
            "칸",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `가장 적은 자리는 k = ${best.k} 이고 그때 기본 연산이 ${comma(best.ops)} 번이다`,
      `한 자리 앞인 k = ${best.k - 1}${은는(best.k - 1)} ${comma(counted(nums, 1, best.k - 1).ops)} 번 · 한 자리 뒤인 k = ${best.k + 1}${은는(best.k + 1)} ${comma(counted(nums, 1, best.k + 1).ops)} 번이다`,
    ].join("\n");
  },

  /** deep.walk — 전개 입력의 두 합 목록. */
  walkLists: () => {
    const rows: string[][] = [];
    for (let i = 1; i <= WALK_MID; i++) {
      const a = WALK[i - 1] as number;
      rows.push([
        stepName(1 + i),
        `앞 무리에 ${a}${을를(a)} 더한 뒤`,
        listing([...subsetSums(WALK, 0, i)]),
        comma(2 ** i),
      ]);
    }
    rows.push([
      stepName(2 + WALK_MID),
      "뒤 무리를 세 걸음에 만든 뒤",
      listing(WALK_B),
      comma(WALK_B.length),
    ]);
    rows.push([
      stepName(3 + WALK_MID),
      "뒤 무리를 정렬한 뒤",
      listing(WALK_SORTED),
      comma(WALK_SORTED.length),
    ]);
    return [
      ...table([["걸음", "무엇을 한 시점인가", "목록", "칸"], ...rows], [3]),
      "",
      `덧셈은 두 목록을 합쳐 ${comma(WALK_COUNTS.writes)} 번이고 정렬 견주기는 ${comma(WALK_COUNTS.cmp)} 번이다`,
    ].join("\n");
  },

  /** deep.walk — 다섯 질의의 이분 탐색 걸음. */
  walkQueries: () => {
    const rows: string[][] = [];
    for (const [i, q] of REC.queries.entries()) {
      for (const [j, p] of q.probes.entries()) {
        rows.push([
          j === 0 ? stepName(4 + WALK_MID + i) : "",
          j === 0 ? comma(q.sA) : "",
          j === 0 ? comma(q.need) : "",
          comma(p.mid),
          comma(p.value),
          p.move,
        ]);
      }
    }
    return [
      ...table(
        [
          [
            "걸음",
            "앞 무리의 합",
            "모자란 값",
            "가운데 자리",
            "그 칸의 값",
            "무엇을 했나",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `질의 ${comma(REC.queries.length)} 번에 가운데 칸을 ${comma(WALK_COUNTS.steps)} 번 본다`,
      `찾은 자리는 앞 무리의 합 ${LAST.sA}${이가(LAST.sA)}고 모자란 값이 ${LAST.need}${이가(LAST.need)}다`,
    ].join("\n");
  },

  /** deep.walk — 여덟 갈래가 입력마다 몇 번 실행되는가. */
  branchCoverage: () => {
    const cs = MUTANT_CASES.map((c) => counted(c.nums, c.target));
    const label = [
      ["①", "합 목록을 잡는다", (c: Counts) => c.allocs],
      ["②", "새 칸에 값을 적는다", (c: Counts) => c.writes],
      ["③", "가운데 칸이 찾는 값이다", (c: Counts) => c.hits],
      ["④", "오른쪽 절반만 남긴다", (c: Counts) => c.right],
      ["⑤", "왼쪽 절반만 남긴다", (c: Counts) => c.left],
      ["⑥", "앞 무리의 크기를 정한다", (c: Counts) => c.splits],
      ["⑦", "뒤 무리를 정렬한다", (c: Counts) => c.sorts],
      ["⑧", "모자란 값을 뒤 무리에 묻는다", (c: Counts) => c.queries],
    ] as [string, string, (c: Counts) => number][];
    const head = ["라벨", "무엇", ...MUTANT_CASES.map((c) => c.label)];
    const rows = label.map(([tag, what, get]) => [
      tag,
      what,
      ...cs.map((c) => comma(get(c))),
    ]);
    return [
      ...table([head, ...rows], [2, 3, 4, 5, 6]),
      "",
      `전개 입력은 여덟 갈래를 모두 실행한다`,
      `빈 배열이 한 번도 실행하지 않는 갈래는 ${label
        .filter(([, , g]) => g(cs[4] as Counts) === 0)
        .map(([t]) => t)
        .join("")} ${comma(
        label.filter(([, , g]) => g(cs[4] as Counts) === 0).length,
      )} 개다`,
    ].join("\n");
  },

  /** 멈춤 1 — 정렬을 빼면 답이 갈리는 입력과 안 갈리는 입력. */
  pauseNoSort: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = noSort.meetInTheMiddleSubsetSum(c.nums, c.target);
      const mid = c.nums.length >> 1;
      const raw = [...subsetSums(c.nums, mid, c.nums.length)];
      const sortedList = [...raw].sort((x, y) => x - y);
      return [
        c.label,
        `[${c.nums.join(", ")}]`,
        comma(c.target),
        raw.join(" ") === sortedList.join(" ") ? "안 바꾼다" : "바꾼다",
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "원소",
            "목표",
            "정렬이 순서를",
            "정본",
            "정렬을 뺀 판",
            "판정",
          ],
          ...rows,
        ],
        [2],
      ),
      "",
      "넷째 열이 「그 줄을 지나갔는데 답이 그대로」와 「지나가도 바꿀 것이 없다」를 가른다",
      "목표 30 인 줄은 순서를 실제로 바꾸는데도 답이 그대로이고, 아래 두 줄은 바꿀 것이 없다",
    ].join("\n");
  },

  /** 멈춤 1 — 정렬을 뺀 판이 전개 입력에서 어느 칸을 보는가. */
  pauseNoSortWalk: () => {
    const need = LAST.need;
    const unsorted = WALK_B;
    const rows: string[][] = [];
    let lo = 0;
    let hi = unsorted.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = unsorted[mid] as number;
      if (v === need) {
        rows.push([comma(lo), comma(hi), comma(mid), comma(v), "적중"]);
        break;
      }
      if (v < need) {
        rows.push([comma(lo), comma(hi), comma(mid), comma(v), "오른쪽"]);
        lo = mid + 1;
      } else {
        rows.push([comma(lo), comma(hi), comma(mid), comma(v), "왼쪽"]);
        hi = mid - 1;
      }
    }
    const at = unsorted.indexOf(need);
    return [
      `정렬하지 않은 목록  ${listing(unsorted)}`,
      `앞 무리의 합 ${LAST.sA} 에 모자란 값 ${need}${은는(need)} 자리 ${at} 에 실제로 있다`,
      "",
      ...table(
        [["lo", "hi", "가운데 자리", "그 칸의 값", "무엇을 했나"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `마지막 구간이 자리 ${at}${을를(at)} 담지 않은 채로 끝난다`,
    ].join("\n");
  },

  /** 멈춤 2 — 나누는 자리를 1/4 지점에 두면 답이 아니라 연산 수가 갈린다. */
  pauseQuarter: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = quarter.meetInTheMiddleSubsetSum(c.nums, c.target);
      const x = counted(c.nums, c.target);
      const y = counted(c.nums, c.target, c.nums.length >> 2);
      return [
        c.label,
        `${c.nums.length >> 1} 대 ${c.nums.length >> 2}`,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        comma(x.ops),
        comma(y.ops),
        comma(x.cells),
        comma(y.cells),
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "앞 무리 크기 정본 대 변이",
            "정본",
            "1/4 지점에서 나눈 판",
            "판정",
            "정본의 기본 연산",
            "1/4 지점의 기본 연산",
            "정본의 칸",
            "1/4 지점의 칸",
          ],
          ...rows,
        ],
        [5, 6, 7, 8],
      ),
      "",
      "둘째 열이 정본과 변이에서 같은 두 줄은 그 줄을 지나가도 값이 안 바뀌어 계수까지 그대로다",
      "판정 열은 반환값 하나만 말한다. 뒤의 네 열이 이 변이가 실제로 바꾼 것이다",
    ].join("\n");
  },

  /** 멈춤 3 — 한 칸 남은 구간을 안 보면 어떤 입력이 실패하는가. */
  pauseStrictWhile: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = strictWhile.meetInTheMiddleSubsetSum(c.nums, c.target);
      const cnt = counted(c.nums, c.target);
      // 정본이 `lo === hi` 인 구간을 실제로 본 횟수. 그 자리가 곧 변이가 건너뛰는 자리다.
      const one = queryRecord(c.nums, c.target)
        .queries.flatMap((q) => q.probes)
        .filter((pr) => pr.mid === pr.lo && pr.mid === pr.hi).length;
      return [
        c.label,
        comma(cnt.cells),
        comma(cnt.steps),
        comma(one),
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "두 목록의 칸",
            "걸음",
            "한 칸 구간을 본 걸음",
            "정본",
            "한 칸 남은 구간을 안 보는 판",
            "판정",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      "넷째 열이 0 이 아닌 줄만 이 변이가 실제로 건너뛰는 자리를 갖는다",
      "빈 배열은 뒤 무리의 목록이 한 칸뿐이라 첫 걸음이 곧 한 칸 구간이다",
      "",
      "전개 입력에서 답을 낸 앞 무리의 합",
      ...table([
        [
          "  정본",
          `앞 무리의 합 ${WALK_GOOD?.sA} · 모자란 값 ${WALK_GOOD?.need}`,
          `${WALK_GOOD?.order} 번째 질의`,
        ],
        [
          "  한 칸 구간을 안 보는 판",
          `앞 무리의 합 ${WALK_STRICT?.sA} · 모자란 값 ${WALK_STRICT?.need}`,
          `${WALK_STRICT?.order} 번째 질의`,
        ],
      ]),
      "",
      "전개 입력의 반환값이 살아남은 것은 다른 앞 무리 합이 대신 찾아 주기 때문이다",
    ].join("\n");
  },

  /** related — 잡는 칸을 늘려 연산 수를 줄이는 맞바꿈. */
  tradeCells: () => {
    const ns = [10, 20, 30, 40];
    const rows = ns.map((n) => {
      const k = n >> 1;
      return [
        comma(n),
        comma(1),
        comma(naiveOps(n)),
        comma(cellCount(n, k)),
        comma(opsBound(n, k)),
        `${comma(Math.round(Number(naiveOps(n)) / opsBound(n, k)))} 배`,
      ];
    });
    const cellRatio = cellCount(40, 20) / cellCount(30, 15);
    const opsRatio = opsBound(40, 20) / opsBound(30, 15);
    const naiveRatio = Number(naiveOps(40)) / Number(naiveOps(30));
    return [
      ...table(
        [
          [
            "원소 n",
            "순진한 판의 칸",
            "순진한 판의 연산",
            "나눈 판의 칸",
            "나눈 판의 연산",
            "연산이 줄어든 배수",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "원소가 10 개 늘 때 각 값이 몇 배가 되는가",
      ...table([
        ["  나눈 판의 칸", `${cellRatio.toFixed(1)} 배`],
        ["  나눈 판의 연산", `${opsRatio.toFixed(1)} 배`],
        ["  순진한 판의 연산", `${comma(Math.round(naiveRatio))} 배`],
      ]),
      "",
      `칸을 ${cellRatio.toFixed(0)} 배로 늘리면 연산이 ${(1 / opsRatio).toFixed(3)} 배로 줄어든다`,
      `칸을 하나도 안 늘리는 판은 같은 자리에서 연산이 ${comma(Math.round(naiveRatio))} 배가 된다`,
    ].join("\n");
  },

  /** deep.math ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const n = WALK.length;
    const k = n >> 1;
    const c = counted(WALK, 30, k);
    return [
      ...table(
        [
          ["항", "정의가 내는 값", "실측", "판정"],
          [
            "덧셈 E(k)+E(n-k)",
            comma(addBound(n, k)),
            comma(c.writes),
            "정확히 같다",
          ],
          [
            "정렬 견주기 C(2^(n-k))",
            comma(sortBound(n - k)),
            comma(c.cmp),
            "상한 안이다",
          ],
          [
            "탐색 걸음 2^k·Q(n-k)",
            comma(2 ** k * searchBound(n - k)),
            comma(c.steps),
            "상한 안이다",
          ],
          ["합 T(k)", comma(opsBound(n, k)), comma(c.ops), "상한 안이다"],
        ],
        [1, 2],
      ),
      "",
      `원소 ${n} 개를 ${k} 대 ${n - k}${으로(n - k)} 나눈 자리이고 목표는 30 이라 답이 없다`,
      `덧셈만 등호이고 나머지 둘은 상한이다 — 정렬은 값의 배치에, 탐색은 어느 칸에서 끝나는가에 달려 있다`,
    ].join("\n");
  },

  /** deep.math ③ — 닫힌 형태가 내는 최솟값 자리. */
  mathOptimum: () => {
    const rows: string[][] = [];
    for (const n of [6, 20, 40]) {
      let best = { k: -1, v: Number.POSITIVE_INFINITY };
      for (let k = 0; k <= n; k++) {
        const v = opsBound(n, k);
        if (v < best.v) best = { k, v };
      }
      rows.push([
        comma(n),
        comma(best.k),
        comma(n >> 1),
        comma(best.v),
        comma(opsBound(n, 0)),
        comma(opsBound(n, n)),
      ]);
    }
    return [
      ...table(
        [
          [
            "원소 n",
            "T(k) 가 가장 작은 k",
            "내림한 n/2",
            "그때의 T",
            "k = 0 일 때",
            "k = n 일 때",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "세 규모 모두 최솟값 자리가 내림한 n / 2 와 맞는다",
    ].join("\n");
  },

  /** deep.math ④ — 제약 상한에 넣은 수치. */
  mathScale: () => {
    const n = N_LIMIT;
    const k = n >> 1;
    const big = naiveOps(n);
    return [
      ...table([
        ["앞 무리 크기 k", comma(k)],
        ["앞 목록 2^k", comma(2 ** k)],
        ["뒤 목록 2^(n-k)", comma(2 ** (n - k))],
        ["덧셈 E(k)+E(n-k)", comma(addBound(n, k))],
        ["정렬 견주기 상한 C(2^(n-k))", comma(sortBound(n - k))],
        ["탐색 걸음 상한 2^k·Q(n-k)", comma(2 ** k * searchBound(n - k))],
        ["기본 연산 상한 T(k)", comma(opsBound(n, k))],
        ["순진한 판의 기본 연산", comma(big)],
        ["두 값의 비", `${comma(Math.round(Number(big) / opsBound(n, k)))} 배`],
      ]),
      "",
      `원소 ${comma(n)} 개는 실행해 보지 않고도 이 식으로 값이 나온다`,
      `부분집합 합의 절댓값 상한은 ${comma(n)} × ${comma(V_LIMIT)} = ${comma(n * V_LIMIT)} 이고`,
      `배정밀도가 정수를 정확히 담는 상한 ${comma(SAFE_LIMIT)} 의 ${comma(Math.round(SAFE_LIMIT / (n * V_LIMIT)))} 분의 1 이다`,
    ].join("\n");
  },

  /** invariant ② — 걸음마다 구간 밖에 찾는 값이 없는지를 실행이 판정한다. */
  invariantWatch: () => {
    const rows: string[][] = [];
    for (const [i, q] of REC.queries.entries()) {
      for (const p of q.probes) {
        rows.push([
          stepName(4 + WALK_MID + i),
          comma(q.need),
          `${p.lo} ~ ${p.hi}`,
          p.move,
          p.outsideClean ? "밖에 없다" : "밖에 있다",
        ]);
      }
    }
    const b = brokenSteps(WALK, WALK_TARGET);
    return [
      ...table(
        [
          ["걸음", "찾는 값", "좁힌 구간 lo ~ hi", "무엇을 했나", "판정"],
          ...rows,
        ],
        [1],
      ),
      "",
      `걸음 ${comma(b.steps)} 개를 전부 견주었고 문장이 깨진 걸음이 ${comma(b.broken)} 개다`,
      "구간 밖의 칸을 매 걸음 하나씩 읽어 찾는 값과 같은 것이 있는지 실제로 센 결과다",
    ].join("\n");
  },

  /** invariant ② — 경계 입력에서도 같은 문장이 유지되는가. */
  invariantEdges: () => {
    const cases: [string, number[], number][] = [
      ["빈 배열", [], 0],
      ["빈 배열 · 목표 5", [], 5],
      ["원소 하나", [7], 7],
      ["원소 둘", [1, 2], 3],
      ["원소가 전부 0", [0, 0, 0], 0],
      ["음수만", [-5, -3, -1], -8],
      ["원소 다섯 · 홀수 개", [1, 2, 3, 4, 5], 9],
      ["원소 열셋 · 홀수 개", even(13), 26],
    ];
    const rows = cases.map(([label, nums, t]) => {
      const c = counted(nums, t);
      const b = brokenSteps(nums, t);
      const k = nums.length >> 1;
      return [
        label,
        comma(nums.length),
        `${comma(2 ** k)} · ${comma(2 ** (nums.length - k))}`,
        String(c.answer),
        comma(b.steps),
        comma(b.broken),
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "원소 수",
            "두 목록의 칸",
            "반환값",
            "걸음",
            "문장이 깨진 걸음",
          ],
          ...rows,
        ],
        [1, 4, 5],
      ),
      "",
      "원소 수가 홀수인 두 줄에서 뒤 목록이 앞 목록의 두 배다 — 앞 무리의 크기가 내림이기 때문이다",
    ].join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 바꾼다. */
  mutantFlipped: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = flipped.meetInTheMiddleSubsetSum(c.nums, c.target);
      const cnt = counted(c.nums, c.target);
      return [
        c.label,
        comma(cnt.sorted.length),
        comma(cnt.right + cnt.left),
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "뒤 목록의 칸",
            "그 줄을 지나간 횟수",
            "정본",
            "버릴 절반을 반대로 고른 판",
            "판정",
          ],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      "셋째 열이 0 인 줄은 그 줄까지 가지도 않는다 — 빈 배열은 첫 걸음이 곧 적중이다",
      "목표 30 인 줄은 그 줄을 여러 번 지나가는데도 반환값이 그대로다",
    ].join("\n");
  },

  /** invariant ③ — 그 줄을 바꾼 판에서 문장이 어느 걸음부터 깨지는가. */
  invariantBroken: () => {
    const flipRec = queryRecord(WALK, WALK_TARGET, true);
    const rows: string[][] = [];
    for (const [i, q] of flipRec.queries.entries()) {
      for (const p of q.probes) {
        rows.push([
          `질의 ${i + 1}`,
          comma(q.need),
          `${p.lo} ~ ${p.hi}`,
          p.move,
          p.outsideClean ? "밖에 없다" : "밖에 있다",
        ]);
      }
    }
    const good = brokenSteps(WALK, WALK_TARGET);
    const bad = brokenSteps(WALK, WALK_TARGET, true);
    const firstBroken = rows.findIndex((r) => r[4] === "밖에 있다");
    return [
      ...table(
        [
          ["질의", "찾는 값", "좁힌 구간 lo ~ hi", "무엇을 했나", "판정"],
          ...rows,
        ],
        [1],
      ),
      "",
      ...table([
        [
          "  정본",
          `걸음 ${comma(good.steps)} · 문장이 깨진 걸음 ${comma(good.broken)}`,
        ],
        [
          "  뒤집은 판",
          `걸음 ${comma(bad.steps)} · 문장이 깨진 걸음 ${comma(bad.broken)}`,
        ],
      ]),
      "",
      `처음 깨지는 자리는 위에서 ${comma(firstBroken + 1)} 번째 걸음이고, 그 뒤로 찾는 값이 구간 밖에 남는다`,
    ].join("\n");
  },

  /** perf.derive — 전개 입력의 기본 연산을 걸음별로 센다. */
  perfCount: () => {
    const rows: string[][] = [];
    for (let i = 1; i <= WALK_MID; i++) {
      rows.push([
        stepName(1 + i),
        "앞 무리에 원소 하나를 더한다",
        comma(2 ** (i - 1)),
        "0",
        "0",
      ]);
    }
    rows.push([
      stepName(2 + WALK_MID),
      "뒤 무리를 만든다",
      comma(WALK_B.length - 1),
      "0",
      "0",
    ]);
    rows.push([
      stepName(3 + WALK_MID),
      "뒤 무리를 정렬한다",
      "0",
      comma(WALK_COUNTS.cmp),
      "0",
    ]);
    for (const [i, q] of REC.queries.entries()) {
      rows.push([
        stepName(4 + WALK_MID + i),
        `모자란 값 ${q.need}${을를(q.need)} 묻는다`,
        "0",
        "0",
        comma(q.probes.length),
      ]);
    }
    const totals = [
      comma(WALK_COUNTS.writes),
      comma(WALK_COUNTS.cmp),
      comma(WALK_COUNTS.steps),
    ];
    return [
      ...table(
        [
          ["걸음", "이 걸음이 한 일", "덧셈", "정렬 견주기", "탐색 걸음"],
          ...rows,
          [
            "합계",
            "",
            totals[0] as string,
            totals[1] as string,
            totals[2] as string,
          ],
        ],
        [2, 3, 4],
      ),
      "",
      `기본 연산이 ${comma(WALK_COUNTS.ops)} 번이고 잡는 칸이 ${comma(WALK_COUNTS.cells)} 개다`,
      `순진한 판은 같은 입력에서 ${comma(naiveRun(WALK, WALK_TARGET).ops)} 번을 쓴다`,
    ].join("\n");
  },

  /** perf.bounds — 실측과 상한의 비. */
  perfObserved: () => {
    const rows = [8, 12, 16, 20, 24].map((n) => {
      const nums = even(n);
      const k = n >> 1;
      const c = counted(nums, 1);
      return [
        comma(n),
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
        comma(opsBound(n, k)),
        (c.ops / opsBound(n, k)).toFixed(3),
      ];
    });
    return [
      ...table(
        [
          [
            "원소 n",
            "덧셈",
            "정렬 견주기",
            "탐색 걸음",
            "기본 연산",
            "상한 T(n/2)",
            "실측 / 상한",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `마지막 열이 ${(counted(even(8), 1).ops / opsBound(8, 4)).toFixed(3)} 에서 ${(counted(even(24), 1).ops / opsBound(24, 12)).toFixed(3)} 로 늘어난다 — 상한이 실측을 늘 위에서 감싼다`,
    ].join("\n");
  },

  /** perf.worst — 입력 모양을 바꿔도 계수가 어떻게 움직이는가. */
  worstShape: () => {
    const n = 16;
    const shapes: [string, number[], number][] = [
      ["원소가 전부 짝수 · 목표 1", even(n), 1],
      ["원소가 전부 1 · 목표 0", new Array<number>(n).fill(1), 0],
      [`원소가 전부 1 · 목표 ${n + 1}`, new Array<number>(n).fill(1), n + 1],
      [
        "2 의 거듭제곱 · 답 없음",
        Array.from({ length: n }, (_, i) => 2 ** i),
        -1,
      ],
      [
        "2 의 거듭제곱 · 마지막 합",
        Array.from({ length: n }, (_, i) => 2 ** i),
        2 ** n - 1,
      ],
    ];
    const rows = shapes.map(([label, nums, t]) => {
      const c = counted(nums, t);
      return [
        label,
        comma(c.writes),
        comma(c.cmp),
        comma(c.queries),
        comma(c.steps),
        comma(c.ops),
        String(c.answer),
      ];
    });
    return [
      ...table(
        [
          [
            "입력 모양",
            "덧셈",
            "정렬 견주기",
            "질의",
            "탐색 걸음",
            "기본 연산",
            "반환값",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      `원소는 다섯 줄 모두 ${comma(n)} 개다. 덧셈만 다섯 줄에서 한 자리도 움직이지 않는다`,
      "질의 수가 갈리는 것은 답을 찾은 자리에서 멈추기 때문이다",
    ].join("\n");
  },

  /** perf.worst — 목표 합이 정수로 정확한 한계. */
  targetPrecision: () => {
    const probes: [string, bigint][] = [
      ["배정밀도가 정수를 정확히 담는 상한", BigInt(SAFE_LIMIT)],
      ["그 위의 첫 홀수", BigInt(SAFE_LIMIT) + 2n],
      ["제약 상한 10^18", 10n ** 18n],
      ["제약 상한에서 1 을 뺀 값", 10n ** 18n - 1n],
      ["부분집합 합의 절댓값 상한", BigInt(N_LIMIT) * BigInt(V_LIMIT)],
    ];
    const rows = probes.map(([label, v]) => [
      label,
      comma(v),
      comma(BigInt(Number(v))),
      BigInt(Number(v)) === v ? "그대로 담긴다" : "다른 수로 담긴다",
    ]);
    const nums = new Array<number>(20).fill(V_LIMIT);
    const asked: [string, number][] = [
      [`목표 ${comma(10n ** 18n)}`, Number(10n ** 18n)],
      [`목표 ${comma(10n ** 18n - 1n)}`, Number(10n ** 18n - 1n)],
      [`목표 ${comma(20 * V_LIMIT)}`, 20 * V_LIMIT],
    ];
    return [
      ...table(
        [["무엇", "적으려는 값", "실제로 담기는 값", "판정"], ...rows],
        [1, 2],
      ),
      "",
      `원소 20 개가 모두 ${comma(V_LIMIT)} 인 배열에 물어보면`,
      ...table(
        asked.map(([label, t]) => [
          `  ${label}`,
          `${meetInTheMiddleSubsetSum(nums, t)} 를 돌려준다`,
        ]),
      ),
      "",
      "목표가 다른 수로 담겨도 답이 뒤집히지 않는다 — 만들 수 있는 합의 상한이 그보다 훨씬 아래이기 때문이다",
    ].join("\n");
  },

  /** perf.worst — 원소 수가 어디서 막히는가. */
  limitProbe: () => {
    const rows = [40, 47, 48, 60, 62, 64].map((n) => {
      const p = limitProbe(n);
      return [
        comma(n),
        comma(p.shiftA),
        comma(p.shiftB),
        comma(p.cells),
        size(p.bytes),
        p.note,
      ];
    });
    const overflow = 2 ** 32 - 1;
    return [
      ...table(
        [["원소 n", "1 << k", "1 << (n-k)", "칸", "그 크기", "판정"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "실제로 불러 보면",
      ...table([
        ["  원소 60 개", callProbe(60, 1)],
        ["  원소 62 개", callProbe(62, 1)],
      ]),
      "",
      `메모리 제한 ${comma(MEM_LIMIT)} 바이트는 칸 ${comma(MEM_LIMIT / 8)} 개다`,
      `제약 상한 ${comma(N_LIMIT)} 은 그 안에 들고 48 은 넘는다`,
      `원소 64 개는 목록이 한 칸인데 안쪽 반복이 ${comma(overflow)} 번 실행된다 — 예외 없이 틀린 답으로 간다`,
    ].join("\n");
  },
};
