/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.alt.ts
 *
 * 대조 상대는 **DP 테이블 채우기**다([부분집합 합 판정](../../dp/subsetSum/subsetSum-guide.md) 편의 절차 —
 * 이름도 그 편을 따른다). 목표 합 0 부터 `target` 까지를 열로 두고 원소를 한 줄씩 더해 가며 참·거짓을 채운다. 비용이 `n · target` 에 달려 있고 원소 수의 지수와는 무관해서,
 * **원소 개수와 목표 합 중 어느 쪽이 큰가로 채택이 갈린다** — 대조가 성립하는 자리다.
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)의 반환값을 두 설계
 * 모두와 대조한다.
 *
 * **기본 연산의 자를 두 설계에 같게 둔다.** DP 테이블 쪽은 값을 정한 칸 하나마다 1(0 번째 줄 포함), 이쪽은 부분집합 합
 * 하나를 정할 때마다 1(목록마다 공집합의 합 0 을 둔 칸 하나 포함 — DP 테이블의 0 번째 줄과 같은 셈) · 정렬 비교 한 번마다 1 ·
 * 이진 탐색 한 걸음마다 1 이다. **두 설계 다 답을 찾아도 멈추지 않는다** — DP 테이블은 언제나 칸을 전부 정하므로 이쪽만
 * 일찍 끝내면 두 계수가 같은 일을 잰 값이 아니게 된다. 정본은 답을 찾은 질의에서 돌아오지만, 여기서는 질의를 전부 센다.
 *
 * **이 셈은 [부분집합 합 판정](../../dp/subsetSum/subsetSum-guide.md) 편의 같은 대조와 같다**(2026-10-01, `KAN-062` 배치 4).
 * 그전에는 공집합의 합 0 을 세지 않고 답을 찾은 질의에서 멈췄다. 맞추면서 이쪽 기본 연산이 입력 A 4,745,705 → 7,076,428,
 * 입력 B 20,852 → 20,854, 원소 20 개 20,150 → 21,559, 전개 입력 46 → 56 으로 늘었고(DP 테이블 쪽은 그대로) — DP 테이블
 * 채우기에 유리해졌다. 입력 A·B 의 우열은 그대로이고, 경계는 원소 20 · 21 사이에서 19 · 20 사이로 한 칸 당겨졌다. 입력(생성식
 * 곱수 7,919 · 시드 · 크기)은 바꾸지 않았다.
 *
 * **정렬 비교는 병합 정렬로 센다** — 정본이 부르는 `Float64Array.prototype.sort()` 는 어떤
 * 절차를 쓰는지 언어 명세가 정하지 않아 셀 수 없다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 원소 여섯에 목표 9 인데, 그 크기에서는 두 설계의
 * 기본 연산이 56 대 70 이라(잣대를 맞추기 전에는 46 대 70) 어느 쪽이 왜 적은지가 값에서 나오지 않는다. 여기서는 같은 생성식
 * 자리 `t` 의 원소가 `((t+1) × 7,919) mod M + 1` 에 매개변수만 둘로 둔다 — **입력 A 는 원소가 많고 목표
 * 합이 작은 쪽**, **입력 B 는 원소가 적고 목표 합이 큰 쪽**이다. 거기에 **경계**를 하나 더
 * 잰다 — 목표 합을 1,000 으로 고정하고 원소 수만 늘린다.
 *
 * 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */
import { meetInTheMiddleSubsetSum } from "./meetInTheMiddleSubsetSum-guide.ref.ts";

interface Input {
  nums: number[];
  target: number;
}

/** 자리 `t` 의 원소가 `((t+1) × 7,919) mod M + 1`, `t = 0 … n-1`. 원소가 전부 1 이상이다. */
export function gen(n: number, M: number): number[] {
  return Array.from({ length: n }, (_, k) => (((k + 1) * 7919) % M) + 1);
}

/** 입력 A — 원소 36 개, 목표 합 1,000. */
export const A: Input = { nums: gen(36, 97), target: 1000 };
/** 입력 B — 원소 20 개, 목표 합 500,000. */
export const B: Input = { nums: gen(20, 99991), target: 500000 };
/** 경계 — 목표 합 1,000 을 고정하고 원소 수만 늘린다. */
export const EDGE_TARGET = 1000;
export const EDGE_M = 97;

export interface Run {
  ops: number;
  cells: number;
  answer: boolean;
}

/** 병합 정렬 — 비교 횟수를 결정론적으로 센다. */
function mergeSortCount(a: number[]): { sorted: number[]; cmp: number } {
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

/**
 * 이 가이드의 절차. 정본(`meetInTheMiddleSubsetSum-guide.ref.ts`)과 같고 세는 자리만 덧붙였다. 다른 곳은 하나 —
 * 답을 찾아도 질의를 멈추지 않는다(위 머리 주석).
 *
 * `추가 칸` 은 두 합 목록이 잡는 `2^k + 2^(n-k)` 칸이다 — 입력 밖에 동시에 들고 있는 칸이다. 정본은
 * 목록 B 를 제자리에서 정렬하므로, 여기서 비교를 세려고 쓴 병합 정렬의 임시 배열은 넣지 않는다.
 */
function 두무리설계(input: Input): Run {
  const { nums, target } = input;
  const n = nums.length;
  const mid = n >> 1;
  let ops = 0;
  const build = (from: number, to: number): number[] => {
    const out = new Array<number>(1 << (to - from)).fill(0);
    ops++; // 칸 0 — 공집합의 합 0
    let size = 1;
    for (let i = from; i < to; i++) {
      const a = nums[i] as number;
      for (let k = 0; k < size; k++) {
        ops++;
        out[size + k] = (out[k] as number) + a;
      }
      size <<= 1;
    }
    return out;
  };
  const sumsA = build(0, mid);
  const sumsB = build(mid, n);
  const { sorted, cmp } = mergeSortCount(sumsB);
  ops += cmp;
  let answer = false;
  for (const sA of sumsA) {
    const need = target - sA;
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo <= hi) {
      ops++;
      const m = (lo + hi) >> 1;
      const v = sorted[m] as number;
      if (v === need) {
        answer = true; // 답을 찾아도 다음 질의로 간다 — 머리 주석
        break;
      }
      if (v < need) lo = m + 1;
      else hi = m - 1;
    }
  }
  return { ops, cells: sumsA.length + sumsB.length, answer };
}

/**
 * 경쟁 설계 — **DP 테이블 채우기**. 목표 합 0 부터 `target` 까지를 열로 두고 원소를 한 줄씩
 * 더해 가며 참·거짓을 채운다.
 *
 * `기본 연산` 은 값을 정한 칸 하나마다 1 이고 `추가 칸` 은 `(n+1)(target+1)` 이다 — 부분집합 합 판정
 * 편의 정본이 표 전체를 한 번에 잡으므로 그 크기를 식으로 적는다. 여기 셈 판은 두 줄만 굴리지만
 * 세는 것은 그 정본의 칸이다. 칸 하나에 참·거짓만 담으므로 `Uint8Array` 로 잡았다.
 *
 * **원소가 음수이거나 목표 합이 클 때는 세울 수 없는 설계다.** 열의 개수가 목표 합에 그대로
 * 붙고, 음수 원소는 열의 자리를 음수로 만든다. 이 대조의 입력을 비음의 정수로 둔 이유가
 * 그것이고, 그 사실이 본문이 적는 「내주는 축」이다.
 */
function 표설계(input: Input): Run {
  const { nums, target } = input;
  const n = nums.length;
  let ops = 0;
  let prev = new Uint8Array(target + 1);
  prev[0] = 1;
  ops += target + 1;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const cur = new Uint8Array(target + 1);
    for (let t = 0; t <= target; t++) {
      ops++;
      cur[t] =
        t < a
          ? (prev[t] as number)
          : (prev[t] as number) | (prev[t - a] as number);
    }
    prev = cur;
  }
  return {
    ops,
    cells: (n + 1) * (target + 1),
    answer: (prev[target] as number) === 1,
  };
}

/* ────────────────────────── 대조 ────────────────────────── */

const 입력: [string, Input][] = [
  ["입력 A", A],
  ["입력 B", B],
];

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const 대상: [string, Input][] = [
    ...입력,
    ["경계 원소 19 개", { nums: gen(19, EDGE_M), target: EDGE_TARGET }],
    ["경계 원소 20 개", { nums: gen(20, EDGE_M), target: EDGE_TARGET }],
  ];
  for (const [label, input] of 대상) {
    const want = meetInTheMiddleSubsetSum(input.nums, input.target);
    if (두무리설계(input).answer !== want) {
      throw new Error(`${label} — 세는 사본이 정본과 다른 답을 낸다`);
    }
    if (표설계(input).answer !== want) {
      throw new Error(`${label} — 경쟁 설계가 정본과 다른 답을 낸다`);
    }
  }
}
확인();

/**
 * 목표 합을 고정하고 원소 수를 늘려 가며 순서가 뒤집히는 자리를 찾는다.
 *
 * `last` 는 이 절차의 계수가 아직 적은 마지막 원소 수이고, `first` 는 DP 테이블 쪽이 처음으로
 * 적어지는 원소 수다. 둘이 이어져 있지 않으면 경계를 한 자리로 말할 수 없으므로 그때는 던진다.
 */
export function crossing(): {
  last: number;
  first: number;
  lastOurs: number;
  lastTheirs: number;
  firstOurs: number;
  firstTheirs: number;
} {
  let last = -1;
  let lastOurs = 0;
  let lastTheirs = 0;
  for (let n = 12; n <= 26; n++) {
    const input: Input = { nums: gen(n, EDGE_M), target: EDGE_TARGET };
    const ours = 두무리설계(input).ops;
    const theirs = 표설계(input).ops;
    if (ours > theirs) {
      if (last < 0) {
        throw new Error(
          `원소 ${n} 개부터 이미 DP 테이블 쪽이 적다 — 경계가 없다`,
        );
      }
      if (n !== last + 1) {
        throw new Error(
          `경계가 이어져 있지 않다 — ${last} 다음이 ${n} 이 아니다`,
        );
      }
      return {
        last,
        first: n,
        lastOurs,
        lastTheirs,
        firstOurs: ours,
        firstTheirs: theirs,
      };
    }
    last = n;
    lastOurs = ours;
    lastTheirs = theirs;
  }
  throw new Error(
    "원소 26 개까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다",
  );
}

const CROSS = crossing();

function 재기(run: (input: Input) => Run): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [label, input] of 입력) {
    const r = run(input);
    out[`${label} · 기본 연산`] = r.ops;
    out[`${label} · 추가 칸`] = r.cells;
  }
  return out;
}

export const cases = {
  "중간에서 만나기 (이 가이드)": () => 재기(두무리설계),
  "DP 테이블 채우기": () => 재기(표설계),
  경계: () => ({
    "중간에서 만나기가 앞서는 마지막 원소 수": CROSS.last,
    "마지막으로 앞선 자리의 중간에서 만나기 기본 연산": CROSS.lastOurs,
    "마지막으로 앞선 자리의 DP 테이블 채우기 기본 연산": CROSS.lastTheirs,
    "DP 테이블 채우기가 앞서는 첫 원소 수": CROSS.first,
    "처음 뒤집힌 자리의 중간에서 만나기 기본 연산": CROSS.firstOurs,
    "처음 뒤집힌 자리의 DP 테이블 채우기 기본 연산": CROSS.firstTheirs,
  }),
};
