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
 * 걸음 재생 패널의 걸음은 그림 사이드카가 정본 소스에서 기계로 만든 계측 사본으로 다시 만들고,
 * 그 기록이 여기의 `queryRecord` 와 같은지도 그쪽이 잰다.
 *
 * **세는 기준은 원고 전체에서 하나다.** 기본 연산은 덧셈 한 번 · 정렬 비교 한 번 · 이진 탐색이
 * 가운데 칸을 읽어 비교한 한 번(탐색 비교)을 각각 1 로 센다. 완전 탐색은 자리 검사 한 번 · 덧셈
 * 한 번 · 목표와의 비교 한 번을 각각 1 로 센다. 메모리는 부분집합 합 목록의 칸(배정밀도 수 하나,
 * 8 바이트) 수로 센다. 시간은 **어림**이다 — 기본 연산 1 초에 1 억 번(`OPS_PER_SEC`)으로 나눈 값이다.
 *
 * **정렬 비교는 병합 정렬로 센다.** 정본이 부르는 `Float64Array.prototype.sort()` 는 어떤
 * 절차를 쓰는지 언어 명세가 정하지 않아 비교 횟수를 셀 수 없다. 같은 차수의 절차 하나를
 * 골라 그것으로 세고, 그 사실을 본문에도 적는다.
 *
 * **큰 수는 `bigint` 로 센다.** 완전 탐색의 연산 수는 원소 40 개에서 14 자리를 넘어 배정밀도
 * 정수 표현이 정확한 범위를 벗어난다 — 그 자리에서 `number` 로 세면 값이 조용히 반올림된다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를 } from "../../../../tools/josa.ts";
import {
  binarySearchExists,
  meetInTheMiddleSubsetSum,
  subsetSums,
} from "./meetInTheMiddleSubsetSum-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 입력. 원소 여섯이고 답이 `true` 다.
 *
 * 여덟 갈래를 한 입력에서 전부 실행한다 — 부분집합 합 목록 두 벌 · 새 칸 채우기 · 가운데 칸
 * 적중 · 오른쪽 절반 남기기 · 왼쪽 절반 남기기 · 앞 무리 크기 정하기 · 정렬 · 질의.
 */
export const WALK: number[] = [3, 34, 4, 12, 5, 2];
export const WALK_TARGET = 9;
/** 같은 입력에 답이 없는 목표 — 질의가 끝까지 간다. */
export const WALK_MISS = 30;

/** 아이디어 절이 부분집합을 전부 나열하는 작은 입력. 부분집합이 열여섯 개다. */
export const SMALL: number[] = [3, 5, 1, 2];
export const SMALL_TARGET = 8;

/** 음수가 섞인 원소 넷. 정렬을 빼면 답이 갈리는 자리를 담는다. */
export const NEG4: number[] = [1, 2, 5, -3];
export const NEG4_TARGET = -3;

/** `a_k = 2(k+1)` — 원소가 전부 짝수라 목표 1 은 만들 수 없다. 규모를 늘릴 때 쓴다. */
export function even(n: number): number[] {
  return Array.from({ length: n }, (_, k) => 2 * (k + 1));
}

/** 과제 규모 — 원소 수 · 원소 절댓값 · 목표 절댓값. */
export const N_LIMIT = 40;
export const V_LIMIT = 1000000000;
export const T_LIMIT = 1000000000000000000;
/** 메모리 예산 — 256 MB 를 바이트로 적은 값. */
export const MEM_LIMIT = 256000000;
/** 시간 어림 — 기본 연산 1 초에 1 억 번. */
export const OPS_PER_SEC = 100000000;
/** 배정밀도가 정수를 정확히 담는 상한. */
export const SAFE_LIMIT = Number.MAX_SAFE_INTEGER;

/* ────────────────────────── 적는 법 ────────────────────────── */

/** `12,345` 꼴 — 본문 표기와 같다. */
export const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** 바이트 수를 사람이 읽는 단위로. 1 MiB 미만은 바이트 그대로 적는다. */
const size = (bytes: number): string =>
  Math.abs(bytes) < 1048576
    ? `${comma(bytes)} 바이트`
    : `${comma(Math.round(bytes / 1048576))} MiB`;

/** 기본 연산 수를 어림 시간으로. */
export const seconds = (ops: number | bigint): string => {
  const s = Number(ops) / OPS_PER_SEC;
  if (s >= 3600) return `${comma(Math.round(s / 3600))} 시간`;
  return `${s.toFixed(2)} 초`;
};

/** 마크다운 표 한 벌. `right` 에 든 열은 오른쪽 맞춤이다. */
function md(head: string[], rows: string[][], right: number[] = []): string {
  const sep = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  return [head, sep, ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

/** 표 아래 문장을 붙인 닫힌 블록의 내용. */
const block = (...parts: string[]): string => parts.join("\n\n");

/** 목록 하나를 공백으로 이어 적는다. */
export const listing = (xs: readonly (number | null)[]): string =>
  xs.map((x) => (x === null ? "·" : String(x))).join(" ");

/** 원소 모음 `{3, 4}` 꼴. 빈 모음은 `{}` 다. */
const setOf = (xs: number[]): string => `{${xs.join(", ")}}`;

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 병합 정렬 — 비교 횟수를 결정론적으로 센다. */
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
  /** ① — 부분집합 합 목록을 잡은 횟수. */
  allocs: number;
  /** ② — 새 칸에 값을 적은 횟수. 곧 덧셈 횟수다. */
  writes: number;
  /** 정렬 비교 횟수. */
  cmp: number;
  /** ③ — 가운데 칸이 찾는 값이었던 횟수. */
  hits: number;
  /** ④ — 오른쪽 절반만 남긴 횟수. */
  right: number;
  /** ⑤ — 왼쪽 절반만 남긴 횟수. */
  left: number;
  /** ⑥ — 앞 무리의 크기를 정한 횟수. */
  splits: number;
  /** ⑦ — 뒤 무리의 목록을 정렬한 횟수. */
  sorts: number;
  /** ⑧ — 앞 무리의 합 하나로 질의를 낸 횟수. */
  queries: number;
  /** 탐색 비교 — 이진 탐색이 가운데 칸을 읽어 비교한 총 횟수. */
  steps: number;
  /** 기본 연산 — 덧셈 + 정렬 비교 + 탐색 비교. */
  ops: number;
  /** 두 부분집합 합 목록이 잡는 칸의 합. */
  cells: number;
  sumsA: number[];
  sumsB: number[];
  sorted: number[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. `midOverride` 는 앞 무리 크기를 바꿔 잰다. */
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
    sumsB,
    sorted,
  };
}

/** 이진 탐색 한 번을 걸음마다 기록한 것. */
export interface Probe {
  /** 이 비교를 **시작할 때**의 후보 구간. */
  from: [number, number];
  /** 이 비교가 **끝난 뒤**의 후보 구간. 적중이면 시작할 때와 같다. */
  lo: number;
  hi: number;
  mid: number;
  value: number;
  /** 이 걸음이 한 일 — 적중 · 오른쪽 절반 · 왼쪽 절반. */
  move: "적중" | "오른쪽" | "왼쪽";
  /**
   * 좁힌 후보 구간 `[lo, hi]` 밖의 칸에 찾는 값이 없는가.
   *
   * **실행이 판정한다** — 구간 밖의 칸을 하나씩 읽어 찾는 값과 같은 것이 있는지 실제로 센다.
   * 표에 손으로 적으면 세운 문장이 틀려도 표가 맞아 보인다.
   */
  outsideClean: boolean;
}

/** 질의 하나의 기록. */
export interface Query {
  index: number;
  sA: number;
  need: number;
  probes: Probe[];
  found: boolean;
}

/** 좁힌 후보 구간 밖에 찾는 값이 남아 있지 않은지 실제로 비교한다. */
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
 * 걸음마다의 후보 구간을 남기는 사본. 불변식 대조와 전개의 걸음 표가 쓴다.
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
  for (const [index, sA] of c.sumsA.entries()) {
    const need = target - sA;
    const probes: Probe[] = [];
    let lo = 0;
    let hi = sorted.length - 1;
    let found = false;
    while (lo <= hi) {
      const from: [number, number] = [lo, hi];
      const mid = (lo + hi) >> 1;
      const v = sorted[mid] as number;
      if (v === need) {
        probes.push({
          from,
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
        from,
        lo,
        hi,
        mid,
        value: v,
        move: goRight ? "오른쪽" : "왼쪽",
        outsideClean: outsideClean(sorted, lo, hi, need),
      });
    }
    queries.push({ index, sA, need, probes, found });
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
 * 완전 탐색 — 모든 부분집합을 하나씩 만들어 합을 잰다.
 *
 * 마스크 하나마다 원소 `n` 개의 자리를 검사하고, 켜진 자리마다 더하고, 만든 합을 목표와
 * 한 번 비교한다. 답을 찾으면 거기서 멈춘다. 본문 「아이디어를 떠올리는 과정」의 코드와 같다.
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

/** 완전 탐색이 끝까지 하는 기본 연산의 닫힌 형태 — `2^n(n+1) + n·2^(n-1)`. */
export function naiveOps(n: number): bigint {
  const two = (e: number): bigint => 1n << BigInt(e);
  return two(n) * BigInt(n + 1) + BigInt(n) * two(n - 1);
}

/** 두 무리로 나눴을 때 덧셈의 정확한 횟수 — `(2^k - 1) + (2^(n-k) - 1)`. */
export function addBound(n: number, k: number): number {
  return 2 ** k - 1 + 2 ** (n - k) - 1;
}

/** 길이 `2^b` 목록을 병합 정렬할 때 비교의 상한 — `b·2^b - 2^b + 1`. */
export function sortBound(b: number): number {
  return b * 2 ** b - 2 ** b + 1;
}

/** 길이 `2^b` 목록에서 이진 탐색 한 번의 탐색 비교 상한 — `b + 1`. */
export function searchBound(b: number): number {
  return b + 1;
}

/** 기본 연산의 상한 — 덧셈 + 정렬 비교 상한 + 질의마다의 탐색 비교 상한. */
export function opsBound(n: number, k: number): number {
  return addBound(n, k) + sortBound(n - k) + 2 ** k * searchBound(n - k);
}

/** 두 부분집합 합 목록이 잡는 칸 — `2^k + 2^(n-k)`. */
export function cellCount(n: number, k: number): number {
  return 2 ** k + 2 ** (n - k);
}

/* ────────────────────────── 자기대조 ────────────────────────── */

const SELF_CASES: [number[], number][] = [
  [WALK, WALK_TARGET],
  [WALK, WALK_MISS],
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
      throw new Error("완전 탐색이 정본과 다른 답을 낸다");
    }
    // 세는 사본의 목록이 정본의 목록과 같은 값인지 본다.
    const mid = nums.length >> 1;
    const c = counted(nums, target);
    if (
      [...subsetSums(nums, 0, mid)].join(",") !== c.sumsA.join(",") ||
      [...subsetSums(nums, mid, nums.length)].join(",") !== c.sumsB.join(",")
    ) {
      throw new Error("세는 사본의 부분집합 합 목록이 정본의 것과 다르다");
    }
    // 정렬한 목록이 정본의 정렬과 같은지 본다.
    const refSorted = subsetSums(nums, mid, nums.length);
    refSorted.sort();
    if ([...refSorted].join(",") !== c.sorted.join(",")) {
      throw new Error("병합 정렬의 결과가 정본의 정렬과 다르다");
    }
  }
  for (let n = 2; n <= 14; n++) {
    const nums = even(n);
    if (BigInt(naiveRun(nums, 1).ops) !== naiveOps(n)) {
      throw new Error(`완전 탐색의 닫힌 형태가 실측과 다르다 — n = ${n}`);
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
      throw new Error(`정렬 비교가 상한을 넘었다 — n = ${n}`);
    }
    if (c.ops > opsBound(n, k)) {
      throw new Error(`기본 연산이 상한을 넘었다 — n = ${n}`);
    }
  }
  // 이진 탐색 조각이 기록하는 사본과 같은 답을 내는지 본다.
  const rec = queryRecord(WALK, WALK_TARGET);
  for (const q of rec.queries) {
    if (binarySearchExists(Float64Array.from(rec.sorted), q.need) !== q.found) {
      throw new Error("기록하는 사본의 질의가 정본의 이진 탐색과 다르다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./meetInTheMiddleSubsetSum-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  meetInTheMiddleSubsetSum(nums: number[], target: number): boolean;
}

/** 뒤 무리의 목록을 정렬하는 줄을 뺀 사본. */
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
    { label: `같은 입력 · 목표 ${WALK_MISS}`, nums: WALK, target: WALK_MISS },
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

/** 원소 `n` 개에서 두 목록의 길이 표기가 성립하는지 실제 연산으로 본다. */
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
  if (shiftA < 0 || shiftB < 0)
    note = "길이가 음수라 부분집합 합 목록을 잡지 못한다";
  else if (shiftA !== 2 ** k || shiftB !== 2 ** (n - k))
    note = "1 << m 이 2^m 이 아니다";
  else if (bytes > MEM_LIMIT) note = "길이는 맞지만 256 MB 를 넘는다";
  else note = "길이가 맞고 256 MB 안에 든다";
  return { k, shiftA, shiftB, cells, bytes, note };
}

/** 실제로 불러 본다. 던지면 그 예외의 이름을, 아니면 반환값을 낸다. */
export function callProbe(n: number, target: number): string {
  const nums = new Array<number>(n).fill(1);
  try {
    return `반환값이 ${meetInTheMiddleSubsetSum(nums, target)} 입니다`;
  } catch (e) {
    return `${(e as Error).constructor.name} 예외가 납니다`;
  }
}

/**
 * 원소 `m` 개짜리 무리 하나에서 정본의 안쪽 반복이 몇 번 도는가 — **값만 세는 가벼운 판.**
 *
 * `size <<= 1` 은 32 비트 정수 이동이라 `2^31` 에서 음수가 된다. 안쪽 반복 `j < size` 는 `size`
 * 가 양수일 때만 돈다. 칸을 잡지 않고 `size` 의 자취만 따라가 센다 — 원소 64 개를 실제로 부르면
 * 반복이 수십억 번이라 이 파일이 끝나지 않는다.
 */
export function innerLoops(m: number): number {
  let size = 1;
  let loops = 0;
  for (let i = 0; i < m; i++) {
    if (size > 0) loops += size;
    size <<= 1;
  }
  return loops;
}

/** 범위 밖 칸에 쓰면 무엇이 남는가 — 길이 1 짜리 배정밀도 배열에 칸 1 을 적어 본다. */
export function outOfRangeWrite(): { length: number; values: number[] } {
  const out = new Float64Array(1);
  out[1] = 5;
  return { length: out.length, values: [...out] };
}

/* ────────────────────────── 공용 값 ────────────────────────── */

const REC = queryRecord(WALK, WALK_TARGET);
const WALK_MID = WALK.length >> 1;
const WALK_A = [...subsetSums(WALK, 0, WALK_MID)];
const WALK_B = [...subsetSums(WALK, WALK_MID, WALK.length)];
const WALK_SORTED = REC.sorted;
const WALK_COUNTS = counted(WALK, WALK_TARGET);
/** 전개 입력에서 답을 찾은 질의. 마지막 질의가 그 자리다. */
const LAST = REC.queries[REC.queries.length - 1] as Query;
/** 전개 입력에서 정본과 「한 칸 구간을 안 보는 판」이 각각 답을 낸 자리. */
const WALK_GOOD = firstHit(WALK, WALK_TARGET);
const WALK_STRICT = firstHit(WALK, WALK_TARGET, true);

/** 전개의 걸음 번호 — T1 나누기 · T2~T4 앞 무리 · T5 뒤 무리 · T6 정렬 · T7~ 질의 · 끝 반환. */
export const stepOfQuery = (i: number): string => `T${4 + WALK_MID + i}`;
export const WALK_RETURN_STEP = `T${4 + WALK_MID + REC.queries.length}`;

/** 원소 `m` 개의 부분집합 칸 `j` 가 고른 원소. */
function picked(group: number[], j: number): number[] {
  return group.filter((_, i) => (j >> i) & 1);
}

/** 두 방법의 과제 규모별 기본 연산 — 완전 탐색은 닫힌 형태, 중간에서 만나기는 상한. */
function fitRange(): { naiveFirst: number; mitmLast: number; memLast: number } {
  let naiveFirst = -1;
  for (let n = 1; n <= 60 && naiveFirst < 0; n++) {
    if (naiveOps(n) > BigInt(OPS_PER_SEC)) naiveFirst = n;
  }
  let mitmLast = -1;
  for (let n = 1; n <= 60; n++) {
    if (opsBound(n, n >> 1) <= OPS_PER_SEC) mitmLast = n;
  }
  let memLast = -1;
  for (let n = 1; n <= 60; n++) {
    if (cellCount(n, n >> 1) * 8 <= MEM_LIMIT) memLast = n;
  }
  return { naiveFirst, mitmLast, memLast };
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** concept — 부분집합 수와 두 부분집합 합 목록의 칸 수. */
  conceptScale: () => {
    const hits: string[] = [];
    for (let mask = 0; mask < 1 << WALK.length; mask++) {
      const p = picked(WALK, mask);
      if (p.reduce((s, x) => s + x, 0) === WALK_TARGET) hits.push(setOf(p));
    }
    const rows = [WALK.length, N_LIMIT].map((n) => {
      const k = n >> 1;
      return [
        `${comma(n)} 개`,
        comma(2n ** BigInt(n)),
        comma(2 ** k),
        comma(2 ** (n - k)),
      ];
    });
    return block(
      md(
        [
          "원소 수",
          "부분집합",
          "앞 무리의 부분집합 합 목록",
          "뒤 무리의 부분집합 합 목록",
        ],
        rows,
        [1, 2, 3],
      ),
      `원소 [${WALK.join(", ")}] 에서 합이 ${WALK_TARGET} 인 부분집합은 ${hits.join(" · ")} ${comma(hits.length)} 개이고, meetInTheMiddleSubsetSum 의 반환값은 ${meetInTheMiddleSubsetSum(WALK, WALK_TARGET)} 입니다.`,
    );
  },

  /** deep.origin ② — 완전 탐색의 규모. */
  naiveScale: () => {
    const rows = [6, 10, 14, 18, 20].map((n) => {
      const a = naiveRun(even(n), 1);
      return [`${comma(n)} 개`, comma(a.masks), comma(a.ops), seconds(a.ops)];
    });
    const big = naiveOps(N_LIMIT);
    rows.push([
      `${comma(N_LIMIT)} 개`,
      comma(2n ** BigInt(N_LIMIT)),
      comma(big),
      seconds(big),
    ]);
    return block(
      md(
        ["원소 수", "만든 부분집합", "기본 연산", "어림 시간"],
        rows,
        [1, 2, 3],
      ),
      `원소 20 개까지는 원소가 전부 짝수인 배열 a_k = 2(k + 1) 에 목표 1 을 넣어 실제로 실행해 셌습니다. 원소 ${comma(N_LIMIT)} 개 줄은 실행하지 않고, 20 개 이하의 실측과 한 자리도 다르지 않은 닫힌 형태 2^n(n+1) + n·2^(n-1) 로 늘린 값입니다. 어림 시간은 기본 연산을 1 초에 ${comma(OPS_PER_SEC)} 번으로 나눈 값입니다.`,
    );
  },

  /** deep.origin ③ — 작은 입력의 부분집합 열여섯 개를 전부 나열한다. */
  smallEnumerate: () => {
    const n = SMALL.length;
    const rows: string[][] = [];
    const hit: string[] = [];
    for (let mask = 0; mask < 1 << n; mask++) {
      const p = picked(SMALL, mask);
      const s = p.reduce((x, y) => x + y, 0);
      if (s === SMALL_TARGET) hit.push(setOf(p));
      rows.push([
        comma(mask),
        mask.toString(2).padStart(n, "0"),
        p.length === 0 ? "{}" : setOf(p),
        comma(s),
      ]);
    }
    return block(
      md(["번호", "이진수", "고른 원소", "합"], rows, [0, 3]),
      `부분집합 ${comma(rows.length)} 개 중 합이 ${SMALL_TARGET} 인 것은 ${hit.join(" · ")} ${comma(hit.length)} 개입니다.`,
    );
  },

  /** deep.origin ③ — 같은 입력을 앞 무리와 뒤 무리로 나눠 각각 만든다. */
  smallSplit: () => {
    const mid = SMALL.length >> 1;
    const a = [...subsetSums(SMALL, 0, mid)];
    const b = [...subsetSums(SMALL, mid, SMALL.length)];
    const pairs: string[] = [];
    for (const [i, x] of a.entries()) {
      for (const [j, y] of b.entries()) {
        if (x + y !== SMALL_TARGET) continue;
        pairs.push(`앞 칸 ${i} 의 ${x}${과와(x)} 뒤 칸 ${j} 의 ${y}`);
      }
    }
    return block(
      md(
        ["무리", "원소", "부분집합 합 목록", "칸"],
        [
          ["앞 무리", setOf(SMALL.slice(0, mid)), listing(a), comma(a.length)],
          ["뒤 무리", setOf(SMALL.slice(mid)), listing(b), comma(b.length)],
        ],
        [3],
      ),
      `두 부분집합 합 목록의 칸을 합치면 ${comma(a.length + b.length)} 개이고, 앞 칸과 뒤 칸을 하나씩 고르는 짝은 ${comma(a.length * b.length)} 가지입니다. 합이 ${SMALL_TARGET} 인 짝은 ${pairs.join(" · ")} ${comma(pairs.length)} 개입니다.`,
    );
  },

  /** deep.origin ④ — 짝을 전부 보는 방법과 정렬해 두고 묻는 방법의 비교 횟수. */
  originCompare: () => {
    const rows = [SMALL.length, WALK.length, 10, 14, 20].map((n) => {
      const nums = even(n);
      const k = n >> 1;
      const a = [...subsetSums(nums, 0, k)];
      const b = [...subsetSums(nums, k, n)];
      let pairChecks = 0;
      let pairAnswer = false;
      for (const x of a) {
        for (const y of b) {
          pairChecks++;
          if (x + y === 1) pairAnswer = true;
        }
      }
      const c = counted(nums, 1);
      if (pairAnswer !== c.answer) {
        throw new Error("짝을 전부 보는 방법이 정본과 다른 답을 낸다");
      }
      return [
        `${comma(n)} 개`,
        comma(pairChecks),
        comma(c.cmp),
        comma(c.steps),
        comma(c.cmp + c.steps),
      ];
    });
    return block(
      md(
        [
          "원소 수",
          "짝 전부 보기의 비교",
          "정렬 비교",
          "탐색 비교",
          "정렬해 두고 묻기의 비교",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "입력은 원소가 전부 짝수인 배열이고 목표는 1 이라 답이 없습니다. 두 방법 모두 짝을 끝까지 찾아야 하고, 두 방법 모두 false 를 냈습니다.",
    );
  },

  /** deep.build (b) — 앞 무리 [3, 34, 4] 의 부분집합 합 목록을 칸마다 읽는다. */
  buildReadCell: () => {
    const group = WALK.slice(0, WALK_MID);
    const list = [...subsetSums(WALK, 0, WALK_MID)];
    const rows = [5, 6].map((j) => {
      const bits = j.toString(2).padStart(WALK_MID, "0");
      const on = [...bits]
        .reverse()
        .flatMap((b, i) => (b === "1" ? [String(i)] : []));
      return [
        `칸 ${j}`,
        bits,
        on.join(" · "),
        setOf(picked(group, j)),
        comma(list[j] as number),
      ];
    });
    return md(["칸", "이진수", "1 인 자리", "고른 원소", "칸의 값"], rows, [4]);
  },

  /** deep.build (d) — 마지막 원소를 더한 칸과 더하지 않은 칸의 차. */
  buildRelation: () => {
    const list = [...subsetSums(WALK, 0, WALK_MID)];
    const half = list.length >> 1;
    const last = WALK[WALK_MID - 1] as number;
    const rows: string[][] = [];
    let same = 0;
    for (let j = 0; j < half; j++) {
      const d = (list[j + half] as number) - (list[j] as number);
      if (d === last) same++;
      rows.push([
        `${j}${과와(j)} ${j + half}`,
        comma(list[j] as number),
        comma(list[j + half] as number),
        comma(d),
      ]);
    }
    return block(
      md(["칸 쌍", "앞 칸의 값", "뒤 칸의 값", "차"], rows, [1, 2, 3]),
      `네 쌍 중 차가 마지막 원소 ${last}${과와(last)} 같은 쌍이 ${comma(same)} 개입니다.`,
    );
  },

  /** deep.build (e) — 부분집합 합 목록과 만들 수 있는 합의 모음은 칸 수가 다르다. */
  buildVsSet: () => {
    const groups = [WALK.slice(0, WALK_MID), [2, 4, 6], [1, 1, 1], [0, 0, 0]];
    const rows = groups.map((g) => {
      const list = [...subsetSums(g, 0, g.length)];
      const set = [...new Set(list)].sort((x, y) => x - y);
      return [
        `[${g.join(", ")}]`,
        listing(list),
        comma(list.length),
        listing(set),
        comma(set.length),
      ];
    });
    return block(
      md(
        [
          "무리의 원소",
          "부분집합 합 목록",
          "부분집합 합 목록의 칸",
          "만들 수 있는 합",
          "합의 가짓수",
        ],
        rows,
        [2, 4],
      ),
      "부분집합 합 목록의 칸은 네 무리 모두 8 이고, 만들 수 있는 합의 가짓수는 값에 따라 8 부터 1 까지 갈립니다.",
    );
  },

  /** deep.build 1단계 — 원소 수에 따라 두 무리와 두 목록의 크기가 어떻게 갈리는가. */
  buildSplit: () => {
    const rows = [0, 1, 5, 6, N_LIMIT].map((n) => {
      const k = n >> 1;
      return [
        `${comma(n)} 개`,
        comma(k),
        comma(n - k),
        comma(2 ** k),
        comma(2 ** (n - k)),
        size(cellCount(n, k) * 8),
      ];
    });
    return md(
      [
        "원소 수",
        "앞 무리 원소",
        "뒤 무리 원소",
        "sumsA 칸",
        "sumsB 칸",
        "두 부분집합 합 목록의 크기",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** deep.build 2단계 — 앞 무리의 목록을 원소 하나씩 채운다. */
  buildFill: () => {
    const writesPerCell = new Array<number>(1 << WALK_MID).fill(0);
    const rows: string[][] = [];
    let size = 1;
    let total = 0;
    for (let i = 0; i < WALK_MID; i++) {
      const a = WALK[i] as number;
      const read = Array.from({ length: size }, (_, j) => j);
      const wrote = read.map((j) => size + j);
      for (const w of wrote) writesPerCell[w] = (writesPerCell[w] ?? 0) + 1;
      total += wrote.length;
      size <<= 1;
      const now = [...subsetSums(WALK, 0, i + 1)];
      rows.push([
        comma(a),
        read.join(" "),
        wrote.join(" "),
        comma(wrote.length),
        listing([
          ...now,
          ...new Array<null>((1 << WALK_MID) - now.length).fill(null),
        ]),
      ]);
    }
    const onceOnly = writesPerCell.slice(1).every((w) => w === 1);
    const cell0 = writesPerCell[0] as number;
    if (
      !onceOnly ||
      [...subsetSums(WALK, 0, WALK_MID)].join(" ") !== listing(WALK_A)
    ) {
      throw new Error("칸이 한 번씩 쓰이지 않았다");
    }
    return block(
      md(
        ["더한 원소", "읽은 칸", "새로 쓴 칸", "덧셈", "그 뒤의 sumsA"],
        rows,
        [0, 3],
      ),
      `덧셈은 모두 ${comma(total)} 번입니다. 칸 1 부터 ${comma((1 << WALK_MID) - 1)} 까지가 ${onceOnly ? "한 번씩" : "여러 번"} 쓰였고, 칸 0 은 ${comma(cell0)} 번 쓰였습니다.`,
    );
  },

  /** deep.build 2단계 — 원소가 없거나 하나인 무리. */
  buildEdge: () => {
    const rows: [string, number[], number, number][] = [
      ["원소가 없는 무리", [], 0, 0],
      ["원소 7 하나인 무리", [7], 0, 1],
    ];
    return md(
      ["무리", "부분집합 합 목록", "칸"],
      rows.map(([label, nums, from, to]) => {
        const list = [...subsetSums(nums, from, to)];
        return [label, listing(list), comma(list.length)];
      }),
      [2],
    );
  },

  /** deep.build 3단계 — 정렬 전 · 정렬 후 · 보통 배열의 sort(). */
  buildSort: () => {
    const typed = subsetSums(WALK, WALK_MID, WALK.length);
    typed.sort();
    const plain = [...WALK_B].sort();
    return block(
      md(
        ["sumsB", "칸 0 부터 7 까지의 값"],
        [
          ["만든 순서 그대로", listing(WALK_B)],
          ["Float64Array 의 sort()", listing([...typed])],
          ["보통 배열의 sort()", listing(plain)],
        ],
      ),
      `병합 정렬로 세면 이 정렬의 비교는 ${comma(WALK_COUNTS.cmp)} 번입니다.`,
    );
  },

  /** deep.build 4단계 — 없는 값을 묻는 질의와 있는 값을 묻는 질의. */
  buildQuery: () => {
    const pick = [REC.queries[0], LAST] as Query[];
    const rows = pick.map((q) => [
      comma(q.sA),
      `${WALK_TARGET} − ${q.sA} = ${q.need}`,
      q.probes.map((p) => `칸 ${p.mid} 의 ${p.value}`).join(" → "),
      q.found ? "있다" : "없다",
    ]);
    return md(
      ["앞 무리의 합 sA", "모자란 값 need", "읽은 칸", "sumsB 에"],
      rows,
    );
  },

  /** deep.build 설계 선택 — 자르는 자리를 바꿔 가며 기본 연산을 센다(원소 여섯). */
  splitSweepSmall: () => {
    const rows: string[][] = [];
    let best = { k: -1, ops: Number.POSITIVE_INFINITY };
    for (let k = 0; k <= WALK.length; k++) {
      const c = counted(WALK, WALK_MISS, k);
      if (c.ops < best.ops) best = { k, ops: c.ops };
      rows.push([
        `k = ${k}`,
        comma(2 ** k),
        comma(2 ** (WALK.length - k)),
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
      ]);
    }
    return block(
      md(
        [
          "앞 무리 크기",
          "sumsA 칸",
          "sumsB 칸",
          "덧셈",
          "정렬 비교",
          "탐색 비교",
          "기본 연산",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      `입력은 전개 입력에 목표를 ${WALK_MISS}${으로(WALK_MISS)} 바꾼 것이라 답이 없고 질의가 끝까지 갑니다. 기본 연산이 가장 적은 자리는 k = ${best.k} 이고 그때 ${comma(best.ops)} 번입니다. 원소가 ${WALK.length} 개라 그 자리가 곧 n 을 2 로 나눈 몫입니다.`,
    );
  },

  /** deep.build 설계 선택 — 같은 스윕을 원소 열여섯에서. */
  splitSweepBig: () => {
    const n = 16;
    const nums = even(n);
    const rows: string[][] = [];
    let best = { k: -1, ops: Number.POSITIVE_INFINITY };
    for (let k = 0; k <= n; k++) {
      const c = counted(nums, 1, k);
      if (c.ops < best.ops) best = { k, ops: c.ops };
      rows.push([
        `k = ${k}`,
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
        comma(c.cells),
      ]);
    }
    const before = counted(nums, 1, best.k - 1).ops;
    const after = counted(nums, 1, best.k + 1).ops;
    return block(
      md(
        ["앞 무리 크기", "덧셈", "정렬 비교", "탐색 비교", "기본 연산", "칸"],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `원소가 전부 짝수인 16 개에 목표 1 을 걸었습니다. 기본 연산이 가장 적은 자리는 k = ${best.k} 이고 그때 ${comma(best.ops)} 번입니다. 한 자리 앞인 k = ${best.k - 1}${은는(best.k - 1)} ${comma(before)} 번, 한 자리 뒤인 k = ${best.k + 1}${은는(best.k + 1)} ${comma(after)} 번입니다.`,
    );
  },

  /** deep.walk 도입 — 고정 입력. */
  walkInput: () =>
    [
      `const nums = [${WALK.join(", ")}];`,
      `const target = ${WALK_TARGET};`,
      `// 이 절이 끝나면 나와야 하는 반환값: ${meetInTheMiddleSubsetSum(WALK, WALK_TARGET)}`,
    ].join("\n"),

  /** deep.walk 1 — 전개 입력의 두 부분집합 합 목록. */
  walkLists: () => {
    const rows: string[][] = [];
    for (let i = 1; i <= WALK_MID; i++) {
      const a = WALK[i - 1] as number;
      const now = [...subsetSums(WALK, 0, i)];
      rows.push([
        `T${1 + i}`,
        `앞 무리에 ${a}${을를(a)} 더한 뒤`,
        listing([
          ...now,
          ...new Array<null>((1 << WALK_MID) - now.length).fill(null),
        ]),
        comma(2 ** (i - 1)),
      ]);
    }
    rows.push([
      `T${2 + WALK_MID}`,
      `뒤 무리에 ${WALK.slice(WALK_MID).join(" · ")}${을를(WALK[WALK.length - 1] as number)} 더한 뒤`,
      listing(WALK_B),
      comma(WALK_B.length - 1),
    ]);
    return block(
      md(["걸음", "시점", "부분집합 합 목록", "그 걸음의 덧셈"], rows, [3]),
      `덧셈은 두 부분집합 합 목록을 합쳐 ${comma(WALK_COUNTS.writes)} 번입니다.`,
    );
  },

  /** deep.walk 2 — 정렬 전과 정렬 후를 칸마다. */
  walkSort: () => {
    const head = ["sumsB", ...WALK_B.map((_, j) => `칸 ${j}`)];
    return block(
      md(
        head,
        [
          ["정렬 전", ...WALK_B.map((v) => comma(v))],
          ["정렬 후", ...WALK_SORTED.map((v) => comma(v))],
        ],
        WALK_B.map((_, j) => j + 1),
      ),
      `정렬 비교는 ${comma(WALK_COUNTS.cmp)} 번이고, sumsA ${listing(WALK_A)}${은는(WALK_A[WALK_A.length - 1] as number)} 그대로 둡니다.`,
    );
  },

  /** 짚고 가기 1 — 정렬을 빼면 답이 갈리는 입력과 안 갈리는 입력. */
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
        raw.join(" ") === sortedList.join(" ") ? "그대로" : "바뀐다",
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return md(
      ["입력", "원소", "목표", "정렬 뒤 순서", "정본", "정렬을 뺀 판", "판정"],
      rows,
      [2],
    );
  },

  /** 짚고 가기 1 — 정렬을 뺀 판이 전개 입력에서 어느 칸을 보는가. */
  pauseNoSortWalk: () => {
    const need = LAST.need;
    const unsorted = WALK_B;
    const rows: string[][] = [];
    let lo = 0;
    let hi = unsorted.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = unsorted[mid] as number;
      const from = `[${lo},${hi}]`;
      if (v === need) {
        rows.push([from, comma(mid), comma(v), "적중"]);
        break;
      }
      if (v < need) {
        lo = mid + 1;
        rows.push([from, comma(mid), comma(v), `오른쪽 → [${lo},${hi}]`]);
      } else {
        hi = mid - 1;
        rows.push([from, comma(mid), comma(v), `왼쪽 → [${lo},${hi}]`]);
      }
    }
    const at = unsorted.indexOf(need);
    return block(
      md(["후보 구간", "가운데 칸", "그 칸의 값", "한 일"], rows, [1, 2]),
      `정렬하지 않은 sumsB ${listing(unsorted)} 에서 모자란 값 ${need}${은는(need)} 칸 ${at} 에 있습니다. 마지막 후보 구간이 칸 ${at}${을를(at)} 담지 않은 채로 비어서 찾지 못합니다.`,
    );
  },

  /** deep.walk 3 — 다섯 질의의 이진 탐색. */
  walkQueries: () => {
    const rows: string[][] = [];
    for (const [i, q] of REC.queries.entries()) {
      for (const [j, p] of q.probes.entries()) {
        rows.push([
          j === 0 ? stepOfQuery(i) : "",
          j === 0 ? comma(q.sA) : "",
          j === 0 ? comma(q.need) : "",
          `[${p.from[0]},${p.from[1]}]`,
          comma(p.mid),
          comma(p.value),
          p.move,
        ]);
      }
    }
    return block(
      md(
        [
          "걸음",
          "앞 무리의 합",
          "모자란 값",
          "후보 구간",
          "가운데 칸",
          "그 칸의 값",
          "한 일",
        ],
        rows,
        [1, 2, 4, 5],
      ),
      `질의 ${comma(REC.queries.length)} 번에 탐색 비교가 ${comma(WALK_COUNTS.steps)} 번입니다. 짝을 찾은 것은 앞 무리의 합 ${LAST.sA}${과와(LAST.sA)} 모자란 값 ${LAST.need} 입니다.`,
    );
  },

  /** 짚고 가기 2 — 나누는 자리를 1/4 지점에 두면 답이 아니라 연산 수가 갈린다. */
  pauseQuarter: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = quarter.meetInTheMiddleSubsetSum(c.nums, c.target);
      const x = counted(c.nums, c.target);
      const y = counted(c.nums, c.target, c.nums.length >> 2);
      return [
        c.label,
        `${c.nums.length >> 1} · ${c.nums.length >> 2}`,
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
        `${comma(x.ops)} · ${comma(y.ops)}`,
        `${comma(x.cells)} · ${comma(y.cells)}`,
      ];
    });
    const q = N_LIMIT >> 2;
    return block(
      md(
        [
          "입력",
          "앞 무리 크기(정본 · 1/4)",
          "정본",
          "1/4 지점에서 나눈 판",
          "판정",
          "기본 연산(정본 · 1/4)",
          "칸(정본 · 1/4)",
        ],
        rows,
      ),
      `원소 ${comma(N_LIMIT)} 개를 1/4 지점에서 자르면 앞 무리가 ${comma(q)} 개 · 뒤 무리가 ${comma(N_LIMIT - q)} 개라 두 부분집합 합 목록의 칸이 ${comma(cellCount(N_LIMIT, q))} 개, 크기가 ${size(cellCount(N_LIMIT, q) * 8)} 입니다. 가운데에서 자르면 ${size(cellCount(N_LIMIT, N_LIMIT >> 1) * 8)} 입니다.`,
    );
  },

  /** 짚고 가기 3 — 한 칸 남은 구간을 안 보면 어떤 입력이 실패하는가. */
  pauseStrictWhile: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = meetInTheMiddleSubsetSum(c.nums, c.target);
      const b = strictWhile.meetInTheMiddleSubsetSum(c.nums, c.target);
      const cnt = counted(c.nums, c.target);
      // 정본이 `lo === hi` 인 구간을 실제로 본 횟수. 그 자리가 곧 변이가 건너뛰는 자리다.
      const one = queryRecord(c.nums, c.target)
        .queries.flatMap((q) => q.probes)
        .filter((pr) => pr.from[0] === pr.from[1]).length;
      return [
        c.label,
        comma(cnt.sorted.length),
        comma(cnt.steps),
        comma(one),
        String(a),
        String(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return md(
      [
        "입력",
        "sumsB 칸",
        "탐색 비교",
        "한 칸 구간을 본 횟수",
        "정본",
        "한 칸 구간을 안 보는 판",
        "판정",
      ],
      rows,
      [1, 2, 3],
    );
  },

  /** 짚고 가기 3 — 전개 입력에서 두 판이 답을 낸 자리. */
  pauseStrictWhere: () =>
    md(
      ["판", "답을 낸 앞 무리의 합", "모자란 값", "몇 번째 질의"],
      [
        [
          "정본",
          comma(WALK_GOOD?.sA ?? Number.NaN),
          comma(WALK_GOOD?.need ?? Number.NaN),
          comma(WALK_GOOD?.order ?? Number.NaN),
        ],
        [
          "한 칸 구간을 안 보는 판",
          comma(WALK_STRICT?.sA ?? Number.NaN),
          comma(WALK_STRICT?.need ?? Number.NaN),
          comma(WALK_STRICT?.order ?? Number.NaN),
        ],
      ],
      [1, 2, 3],
    ),

  /** deep.walk 4 — 걸음마다 조건 판정. 분기가 실제 값으로 참·거짓이 된다. */
  walkTrace: () => {
    const rows: string[][] = [];
    rows.push([
      "T1",
      "앞 무리 크기를 정한다",
      `⑥ mid = ${WALK.length} >> 1 = ${WALK_MID}`,
      `앞 무리 ${WALK.slice(0, WALK_MID).join(" · ")} / 뒤 무리 ${WALK.slice(WALK_MID).join(" · ")}`,
    ]);
    let size = 1;
    for (let i = 0; i < WALK_MID; i++) {
      const a = WALK[i] as number;
      const head = i === 0 ? `① sumsA ${1 << WALK_MID} 칸 · ` : "";
      const tail =
        i === WALK_MID - 1 ? ` · i = ${WALK_MID} < ${WALK_MID} 거짓 → 끝` : "";
      rows.push([
        `T${2 + i}`,
        `앞 무리에 ${a}${을를(a)} 더한다`,
        `${head}i = ${i} < ${WALK_MID} 참 · ② ${size} 번${tail}`,
        listing([...subsetSums(WALK, 0, i + 1)]),
      ]);
      size <<= 1;
    }
    rows.push([
      `T${2 + WALK_MID}`,
      "sumsB 를 만든다",
      `① sumsB ${WALK_B.length} 칸 · ② ${comma(WALK_B.length - 1)} 번`,
      listing(WALK_B),
    ]);
    rows.push([
      `T${3 + WALK_MID}`,
      "sumsB 를 정렬한다",
      "⑦",
      listing(WALK_SORTED),
    ]);
    const mark = { 적중: "③", 오른쪽: "④", 왼쪽: "⑤" } as const;
    for (const [i, q] of REC.queries.entries()) {
      const parts = q.probes.map((p) =>
        p.move === "적중"
          ? `${p.value} === ${q.need} 참 → ③`
          : `${p.value} < ${q.need} ${p.move === "오른쪽" ? "참" : "거짓"} → ${mark[p.move]}`,
      );
      const last = q.probes[q.probes.length - 1] as Probe;
      const end = q.found ? "있다" : `lo = ${last.lo} > hi = ${last.hi} → 없다`;
      rows.push([
        stepOfQuery(i),
        `⑧ need = ${WALK_TARGET} − ${q.sA} = ${q.need}`,
        parts.join(" · "),
        end,
      ]);
    }
    rows.push([
      WALK_RETURN_STEP,
      "true 를 돌려준다",
      `${LAST.sA} + ${LAST.need} = ${LAST.sA + LAST.need}`,
      String(REC.answer),
    ]);
    return md(["걸음", "하는 일", "조건 판정", "걸음이 끝난 뒤"], rows);
  },

  /** deep.walk 4 — 여덟 갈래가 입력마다 몇 번 실행되는가. */
  branchCoverage: () => {
    const cs = MUTANT_CASES.map((c) => counted(c.nums, c.target));
    const label = [
      ["①", "부분집합 합 목록을 잡는다", (c: Counts) => c.allocs],
      ["②", "새 칸에 값을 적는다", (c: Counts) => c.writes],
      ["③", "가운데 칸이 찾는 값이다", (c: Counts) => c.hits],
      ["④", "오른쪽 절반만 남긴다", (c: Counts) => c.right],
      ["⑤", "왼쪽 절반만 남긴다", (c: Counts) => c.left],
      ["⑥", "앞 무리의 크기를 정한다", (c: Counts) => c.splits],
      ["⑦", "sumsB 를 정렬한다", (c: Counts) => c.sorts],
      ["⑧", "모자란 값을 묻는다", (c: Counts) => c.queries],
    ] as [string, string, (c: Counts) => number][];
    const rows = label.map(([tag, what, get]) => [
      tag,
      what,
      ...cs.map((c) => comma(get(c))),
    ]);
    const zero = label.filter(([, , g]) => g(cs[4] as Counts) === 0);
    const walkAll = label.every(([, , g]) => g(cs[0] as Counts) > 0);
    return block(
      md(
        ["갈래", "하는 일", ...MUTANT_CASES.map((c) => c.label)],
        rows,
        [2, 3, 4, 5, 6],
      ),
      `전개 입력은 여덟 갈래를 ${walkAll ? "모두" : "다 못"} 실행합니다. 빈 배열이 한 번도 실행하지 않는 갈래는 ${zero.map(([t]) => t).join(" · ")} ${comma(zero.length)} 개입니다.`,
    );
  },

  /** deep.walk.final — 전체 코드를 여러 입력에 실행한 결과. */
  walkFinal: () => {
    const calls: [number[], number][] = [
      [WALK, WALK_TARGET],
      [WALK, WALK_MISS],
      [[-3, -1, 2, 5], 4],
      [[], 0],
      [[], 5],
    ];
    const lines = calls.map(
      ([nums, t]) => `meetInTheMiddleSubsetSum([${nums.join(", ")}], ${t})`,
    );
    const w = Math.max(...lines.map((l) => l.length));
    return [
      ...calls.map(
        ([nums, t], i) =>
          `${(lines[i] as string).padEnd(w)}  → ${meetInTheMiddleSubsetSum(nums, t)}`,
      ),
    ].join("\n");
  },

  /** related — 칸을 늘려 연산 수를 줄이는 맞바꿈. */
  tradeCells: () => {
    const ns = [10, 20, 30, 40];
    const rows = ns.map((n) => {
      const k = n >> 1;
      return [
        `${comma(n)} 개`,
        comma(naiveOps(n)),
        comma(cellCount(n, k)),
        comma(opsBound(n, k)),
      ];
    });
    const cellRatio = cellCount(40, 20) / cellCount(30, 15);
    const opsRatio = opsBound(40, 20) / opsBound(30, 15);
    const naiveRatio = Number(naiveOps(40)) / Number(naiveOps(30));
    return block(
      md(
        [
          "원소 수",
          "완전 탐색의 기본 연산",
          "중간에서 만나기의 칸",
          "중간에서 만나기의 기본 연산 상한",
        ],
        rows,
        [1, 2, 3],
      ),
      `완전 탐색은 칸을 따로 잡지 않습니다. 원소가 30 개에서 40 개로 늘 때 중간에서 만나기의 칸은 ${cellRatio.toFixed(1)} 배, 기본 연산 상한은 ${opsRatio.toFixed(1)} 배가 되고, 완전 탐색의 기본 연산은 ${comma(Math.round(naiveRatio))} 배가 됩니다.`,
    );
  },

  /** purpose.fit — 두 방법이 1 초 어림과 256 MB 에 드는 원소 수. */
  fitRange: () => {
    const f = fitRange();
    return block(
      md(
        ["경계", "원소 수", "그 자리의 값"],
        [
          [
            "완전 탐색이 1 초 어림을 처음 넘는 자리",
            `${comma(f.naiveFirst)} 개`,
            `기본 연산 ${comma(naiveOps(f.naiveFirst))} · ${seconds(naiveOps(f.naiveFirst))}`,
          ],
          [
            "중간에서 만나기가 1 초 어림 안에 드는 마지막 자리",
            `${comma(f.mitmLast)} 개`,
            `기본 연산 상한 ${comma(opsBound(f.mitmLast, f.mitmLast >> 1))} · ${seconds(opsBound(f.mitmLast, f.mitmLast >> 1))}`,
          ],
          [
            "두 부분집합 합 목록이 256 MB 안에 드는 마지막 자리",
            `${comma(f.memLast)} 개`,
            `칸 ${comma(cellCount(f.memLast, f.memLast >> 1))} · ${size(cellCount(f.memLast, f.memLast >> 1) * 8)}`,
          ],
        ],
        [1],
      ),
      `시간은 기본 연산 1 초에 ${comma(OPS_PER_SEC)} 번으로 나눈 어림이고, 중간에서 만나기 쪽은 실측이 아니라 상한 T(k) 로 잰 값입니다.`,
    );
  },

  /** deep.math ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const n = WALK.length;
    const k = n >> 1;
    const c = counted(WALK, WALK_MISS, k);
    const verdict = (bound: number, got: number, exact: boolean): string =>
      exact
        ? bound === got
          ? "같다"
          : "다르다"
        : got <= bound
          ? "상한 안"
          : "상한 밖";
    return block(
      md(
        ["항", "식이 내는 값", "실측", "판정"],
        [
          [
            "덧셈 E(k) + E(n−k)",
            comma(addBound(n, k)),
            comma(c.writes),
            verdict(addBound(n, k), c.writes, true),
          ],
          [
            "정렬 비교 C(2^(n−k))",
            comma(sortBound(n - k)),
            comma(c.cmp),
            verdict(sortBound(n - k), c.cmp, false),
          ],
          [
            "탐색 비교 2^k · Q(n−k)",
            comma(2 ** k * searchBound(n - k)),
            comma(c.steps),
            verdict(2 ** k * searchBound(n - k), c.steps, false),
          ],
          [
            "합 T(k)",
            comma(opsBound(n, k)),
            comma(c.ops),
            verdict(opsBound(n, k), c.ops, false),
          ],
        ],
        [1, 2],
      ),
      `원소 ${n} 개를 ${k} · ${n - k}${으로(n - k)} 나눈 자리이고, 목표가 ${WALK_MISS}${josa(WALK_MISS, "이라", "라")} 답이 없어 질의가 끝까지 갑니다.`,
    );
  },

  /** deep.math ③ — 닫힌 형태가 내는 최솟값 자리. */
  mathOptimum: () => {
    const rows: string[][] = [];
    for (const n of [WALK.length, 20, N_LIMIT]) {
      let best = { k: -1, v: Number.POSITIVE_INFINITY };
      for (let k = 0; k <= n; k++) {
        const v = opsBound(n, k);
        if (v < best.v) best = { k, v };
      }
      rows.push([
        `${comma(n)} 개`,
        comma(best.k),
        comma(n >> 1),
        comma(best.v),
        comma(opsBound(n, 0)),
        comma(opsBound(n, n)),
      ]);
    }
    return md(
      [
        "원소 수",
        "T(k) 가 가장 작은 k",
        "n 을 2 로 나눈 몫",
        "그때의 T(k)",
        "k = 0 의 T(k)",
        "k = n 의 T(k)",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** deep.math ④ — 과제 규모의 상한에 넣은 수치. */
  mathScale: () => {
    const n = N_LIMIT;
    const k = n >> 1;
    const big = naiveOps(n);
    return block(
      md(
        ["항", "원소 40 개 · k = 20 의 값"],
        [
          ["sumsA 칸 2^k", comma(2 ** k)],
          ["sumsB 칸 2^(n−k)", comma(2 ** (n - k))],
          ["덧셈 E(k) + E(n−k)", comma(addBound(n, k))],
          ["정렬 비교 상한 C(2^(n−k))", comma(sortBound(n - k))],
          ["탐색 비교 상한 2^k · Q(n−k)", comma(2 ** k * searchBound(n - k))],
          ["기본 연산 상한 T(k)", comma(opsBound(n, k))],
          ["완전 탐색의 기본 연산", comma(big)],
        ],
        [1],
      ),
      `완전 탐색의 기본 연산은 상한 T(k) 의 ${comma(Math.round(Number(big) / opsBound(n, k)))} 배입니다.`,
    );
  },

  /** invariant ② — 걸음마다 구간 밖에 찾는 값이 없는지를 실행이 판정한다. */
  invariantWatch: () => {
    const rows: string[][] = [];
    for (const [i, q] of REC.queries.entries()) {
      for (const p of q.probes) {
        rows.push([
          stepOfQuery(i),
          comma(q.need),
          p.move,
          p.lo > p.hi ? `빈 구간 [${p.lo},${p.hi}]` : `[${p.lo},${p.hi}]`,
          p.outsideClean ? "없다" : "있다",
        ]);
      }
    }
    const b = brokenSteps(WALK, WALK_TARGET);
    return block(
      md(
        ["걸음", "찾는 값", "한 일", "좁힌 후보 구간", "구간 밖의 찾는 값"],
        rows,
        [1],
      ),
      `비교 ${comma(b.steps)} 번 모두에서 좁힌 후보 구간 밖의 칸을 하나씩 읽어 찾는 값과 같은 것이 있는지 셌고, 있었던 비교는 ${comma(b.broken)} 번입니다.`,
    );
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
      ["원소 다섯", [1, 2, 3, 4, 5], 9],
      ["원소 열셋", even(13), 26],
    ];
    const rows = cases.map(([label, nums, t]) => {
      const c = counted(nums, t);
      const b = brokenSteps(nums, t);
      const k = nums.length >> 1;
      return [
        label,
        comma(nums.length),
        `${comma(2 ** k)} · ${comma(2 ** (nums.length - k))}`,
        String(meetInTheMiddleSubsetSum(nums, t)),
        comma(b.steps),
        comma(b.broken),
        String(c.answer === meetInTheMiddleSubsetSum(nums, t)),
      ];
    });
    return md(
      [
        "입력",
        "원소 수",
        "sumsA · sumsB 칸",
        "정본의 답",
        "탐색 비교",
        "문장이 깨진 비교",
        "세는 사본과 같은 답",
      ],
      rows,
      [1, 4, 5],
    );
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
    return md(
      [
        "입력",
        "sumsB 칸",
        "그 줄을 지나간 횟수",
        "정본",
        "버릴 절반을 반대로 고른 판",
        "판정",
      ],
      rows,
      [1, 2],
    );
  },

  /** invariant ③ — 그 줄을 바꾼 판에서 문장이 어느 비교부터 깨지는가. */
  invariantBroken: () => {
    const flipRec = queryRecord(WALK, WALK_TARGET, true);
    const rows: string[][] = [];
    for (const [i, q] of flipRec.queries.entries()) {
      for (const p of q.probes) {
        rows.push([
          `질의 ${i + 1}`,
          comma(q.need),
          p.move,
          p.lo > p.hi ? `빈 구간 [${p.lo},${p.hi}]` : `[${p.lo},${p.hi}]`,
          p.outsideClean ? "없다" : "있다",
        ]);
      }
    }
    const good = brokenSteps(WALK, WALK_TARGET);
    const bad = brokenSteps(WALK, WALK_TARGET, true);
    const firstBroken = rows.findIndex((r) => r[4] === "있다");
    const brokenQuery = rows[firstBroken]?.[0] ?? "";
    return block(
      md(
        ["질의", "찾는 값", "한 일", "좁힌 후보 구간", "구간 밖의 찾는 값"],
        rows,
        [1],
      ),
      `정본은 비교 ${comma(good.steps)} 번 중 문장이 깨진 비교가 ${comma(good.broken)} 번이고, 뒤집은 판은 비교 ${comma(bad.steps)} 번 중 ${comma(bad.broken)} 번입니다. 처음 깨지는 것은 위에서 ${comma(firstBroken + 1)} 번째 비교, ${brokenQuery} 의 첫 비교입니다.`,
    );
  },

  /** perf.derive — 전개 입력의 기본 연산을 걸음별로 센다. */
  perfCount: () => {
    const rows: string[][] = [];
    for (let i = 1; i <= WALK_MID; i++) {
      rows.push([
        `T${1 + i}`,
        "앞 무리에 원소 하나를 더한다",
        comma(2 ** (i - 1)),
        "0",
        "0",
      ]);
    }
    rows.push([
      `T${2 + WALK_MID}`,
      "sumsB 를 만든다",
      comma(WALK_B.length - 1),
      "0",
      "0",
    ]);
    rows.push([
      `T${3 + WALK_MID}`,
      "sumsB 를 정렬한다",
      "0",
      comma(WALK_COUNTS.cmp),
      "0",
    ]);
    for (const [i, q] of REC.queries.entries()) {
      rows.push([
        stepOfQuery(i),
        `모자란 값 ${q.need}${을를(q.need)} 묻는다`,
        "0",
        "0",
        comma(q.probes.length),
      ]);
    }
    rows.push([
      "합계",
      "",
      comma(WALK_COUNTS.writes),
      comma(WALK_COUNTS.cmp),
      comma(WALK_COUNTS.steps),
    ]);
    return block(
      md(
        ["걸음", "하는 일", "덧셈", "정렬 비교", "탐색 비교"],
        rows,
        [2, 3, 4],
      ),
      `기본 연산은 ${comma(WALK_COUNTS.ops)} 번이고 두 부분집합 합 목록의 칸은 ${comma(WALK_COUNTS.cells)} 개입니다. 같은 입력에서 완전 탐색은 기본 연산 ${comma(naiveRun(WALK, WALK_TARGET).ops)} 번을 씁니다.`,
    );
  },

  /** perf.derive — 총식의 몫마다 전개 입력의 값. */
  perfFormula: () => {
    const n = WALK.length;
    const k = n >> 1;
    const b = n - k;
    return md(
      ["몫", "세는 식", `n = ${n} · k = ${k} 의 값`],
      [
        [
          "부분집합 합 목록 만들기",
          "$(2^k - 1) + (2^{n-k} - 1)$ — 새 칸에 적는 덧셈",
          comma(addBound(n, k)),
        ],
        [
          "정렬",
          "$b \\cdot 2^b - 2^b + 1$, $b = n - k$ — 병합 정렬 비교의 상한",
          comma(sortBound(b)),
        ],
        [
          "질의",
          "$2^k \\cdot (b + 1)$ — sumsA 의 칸마다 한 번, 탐색 비교의 상한",
          comma(2 ** k * searchBound(b)),
        ],
        ["칸", "$2^k + 2^{n-k}$", comma(cellCount(n, k))],
      ],
      [2],
    );
  },

  /** perf.bounds — 실측과 상한의 비. */
  perfObserved: () => {
    const rows = [8, 12, 16, 20, 24].map((n) => {
      const c = counted(even(n), 1);
      const k = n >> 1;
      return [
        `${comma(n)} 개`,
        comma(c.writes),
        comma(c.cmp),
        comma(c.steps),
        comma(c.ops),
        comma(opsBound(n, k)),
        (c.ops / opsBound(n, k)).toFixed(3),
      ];
    });
    return block(
      md(
        [
          "원소 수",
          "덧셈",
          "정렬 비교",
          "탐색 비교",
          "기본 연산",
          "상한 T(k)",
          "실측 ÷ 상한",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      `원소가 전부 짝수이고 목표가 1 이라 답이 없는 입력입니다. 마지막 열은 ${(counted(even(8), 1).ops / opsBound(8, 4)).toFixed(3)} 에서 ${(counted(even(24), 1).ops / opsBound(24, 12)).toFixed(3)} 까지 늘고, 1 을 넘는 줄은 없습니다.`,
    );
  },

  /** perf.worst — 입력 모양을 바꿔도 계수가 어떻게 움직이는가. */
  worstShape: () => {
    const n = 16;
    const shapes: [string, number[], number][] = [
      ["원소가 전부 짝수 · 목표 1", even(n), 1],
      ["원소가 전부 1 · 목표 0", new Array<number>(n).fill(1), 0],
      [`원소가 전부 1 · 목표 ${n + 1}`, new Array<number>(n).fill(1), n + 1],
      [
        "2 의 거듭제곱 · 목표 −1",
        Array.from({ length: n }, (_, i) => 2 ** i),
        -1,
      ],
      [
        `2 의 거듭제곱 · 목표 ${comma(2 ** n - 1)}`,
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
        String(meetInTheMiddleSubsetSum(nums, t)),
      ];
    });
    return block(
      md(
        [
          "입력 모양",
          "덧셈",
          "정렬 비교",
          "질의",
          "탐색 비교",
          "기본 연산",
          "답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `원소는 다섯 줄 모두 ${comma(n)} 개입니다. 덧셈은 다섯 줄이 모두 ${comma(counted(even(n), 1).writes)} 번이고, 질의는 ${comma(2 ** (n >> 1))} 번까지 갑니다.`,
    );
  },

  /** perf.worst — 원소 수가 어디서 막히는가. */
  limitProbe: () => {
    const rows = [40, 47, 48, 60, 62, 64].map((n) => {
      const p = limitProbe(n);
      return [
        `${comma(n)} 개`,
        comma(p.shiftA),
        comma(p.shiftB),
        comma(p.cells),
        size(p.bytes),
        p.note,
      ];
    });
    const w = outOfRangeWrite();
    return block(
      md(
        [
          "원소 수",
          "1 << k",
          "1 << (n−k)",
          "두 부분집합 합 목록의 칸",
          "크기",
          "판정",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `원소 60 개를 실제로 불러 보면 ${callProbe(60, 1)}. 원소 62 개는 ${callProbe(62, 1)}. 원소 64 개는 부분집합 합 목록이 한 칸인데, 무리 하나의 안쪽 반복이 칸을 잡지 않고 자취만 센 값으로 ${comma(innerLoops(32))} 번 반복합니다. 길이 ${w.length} 짜리 배정밀도 배열의 칸 1 에 값을 적어도 배열은 [${w.values.join(", ")}] 그대로라, 그 반복이 적은 합은 하나도 남지 않습니다.`,
    );
  },

  /** perf.worst — 목표 합이 정수로 정확한 한계. */
  targetPrecision: () => {
    const probes: [string, bigint][] = [
      ["배정밀도가 정수를 정확히 담는 상한", BigInt(SAFE_LIMIT)],
      ["그 위의 첫 홀수", BigInt(SAFE_LIMIT) + 2n],
      ["목표 절댓값의 상한 10^18", 10n ** 18n],
      ["그 상한에서 1 을 뺀 값", 10n ** 18n - 1n],
      ["부분집합 합의 절댓값 상한", BigInt(N_LIMIT) * BigInt(V_LIMIT)],
    ];
    const rows = probes.map(([label, v]) => [
      label,
      comma(v),
      comma(BigInt(Number(v))),
      BigInt(Number(v)) === v ? "같다" : "다르다",
    ]);
    const nums = new Array<number>(20).fill(V_LIMIT);
    const asked: [string, number][] = [
      [comma(10n ** 18n), Number(10n ** 18n)],
      [comma(10n ** 18n - 1n), Number(10n ** 18n - 1n)],
      [comma(20 * V_LIMIT), 20 * V_LIMIT],
    ];
    return block(
      md(
        ["수의 자리", "적으려는 수", "실제로 담기는 수", "두 수"],
        rows,
        [1, 2],
      ),
      `원소 20 개가 모두 ${comma(V_LIMIT)} 인 배열에 목표 ${asked.map(([l]) => l).join(" · ")}${을를(asked[asked.length - 1]?.[0] ?? "")} 차례로 물으면 반환값이 ${asked.map(([, t]) => String(meetInTheMiddleSubsetSum(nums, t))).join(" · ")} 입니다.`,
    );
  },

  /** selfcheck — 모자란 값이 다른데 읽은 칸이 같은 두 질의. */
  checkSameSteps: () => {
    const least = WALK_SORTED[0] as number;
    const qs = REC.queries.filter((q) => q.need < least);
    return block(
      md(
        ["걸음", "모자란 값", "비교", "읽은 칸"],
        qs.map((q) => [
          stepOfQuery(REC.queries.indexOf(q)),
          comma(q.need),
          q.probes.map((p) => `${p.value} < ${q.need} 거짓 → 왼쪽`).join(" · "),
          q.probes.map((p) => String(p.mid)).join(" → "),
        ]),
      ),
      `두 모자란 값 모두 정렬한 sumsB 의 가장 작은 값 ${least} 보다 작습니다.`,
    );
  },
};
