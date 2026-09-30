/**
 * `purpose.alt` 의 수치 — L13. 같은 판정을 **전혀 다른 축에서** 하는 두 설계를 같은 입력에
 * 걸고 계수를 센다.
 *
 * 대조 상대는 **중간에서 만나기(meet in the middle)** 다. 원소를 절반으로 갈라 양쪽의 부분합을
 * 전부 만들고, 한쪽을 정렬해 둔 뒤 다른 쪽 값마다 `target - s` 를 이진 탐색한다. 비용이
 * `2^(n/2)` 에 달려 있고 목표 합의 크기와는 무관해서, **원소 개수와 목표 합 중 어느 쪽이
 * 큰가로 채택이 갈린다** — 대조가 성립하는 자리다.
 *
 * 계수 둘. **기본 연산**은 DP 테이블 쪽에서 값을 정한 칸 하나당 1, 중간에서 만나기 쪽에서 부분합
 * 하나를 만들 때마다 1 · 정렬 비교 한 번마다 1 · 이진 탐색 한 걸음마다 1 이다.
 * **추가 칸**은 입력 밖에 새로 잡아 동시에 들고 있는 칸의 최댓값이다. DP 테이블 쪽은 정본이 표
 * `(n+1)(target+1)` 칸을 한 번에 잡으므로 그 크기를 식으로 적는다 — 여기 셈 판은 두 줄만 굴리지만
 * 세는 것은 정본의 칸이다. 중간에서 만나기 쪽은 양쪽 부분합 배열 둘의 길이 합이고, 만드는 도중의
 * 임시 배열 · 병합 정렬의 임시 배열 · 정렬된 사본은 넣지 않았다. 둘 다 실행마다 같은 값이다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `nums = [3, 34, 4, 12, 5, 2]` · `target = 9` 인데,
 * 그 크기에서는 두 계수가 거의 같아(값은 증명 블록 `alt-walk-input` 이 낸다) 어느 쪽이 왜 적은지가
 * 값에서 나오지 않는다. 여기서는 같은 생성식 `a_k = (k × P mod M) + 1` 에 매개변수만 둘로 둔다 —
 * **입력 A 는 원소가 많고 목표 합이 작은 쪽**, **입력 B 는 원소가 적고 목표 합이 큰 쪽**이다.
 * 거기에 **경계**를 하나 더 잰다 — 목표 합을 1,000 으로 고정하고 원소 수만 19 와 20 으로 둔다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";
import { subsetSum } from "./subsetSum-guide.ref.ts";

export interface Input {
  nums: number[];
  target: number;
}

/** `a_k = (k × P mod M) + 1`, `k = 1 … n`. */
export function gen(n: number, P: number, M: number): number[] {
  return Array.from({ length: n }, (_, k) => (((k + 1) * P) % M) + 1);
}

/** 입력 A — 원소 36 개, 목표 합 1,000. */
export const A: Input = { nums: gen(36, 37, 97), target: 1_000 };
/** 입력 B — 원소 20 개, 목표 합 500,000. */
export const B: Input = { nums: gen(20, 37_003, 99_991), target: 500_000 };
/** 경계 — 목표 합 1,000 을 고정하고 원소 수만 19 와 20 으로 둔다. */
export const E19: Input = { nums: gen(19, 37, 97), target: 1_000 };
export const E20: Input = { nums: gen(20, 37, 97), target: 1_000 };

/** DP 테이블 채우기 — 이 가이드의 절차. `(n+1)(target+1)` 칸을 언제나 전부 정한다. */
export function fillTable(input: Input): Record<string, number> {
  const { nums, target } = input;
  const n = nums.length;
  let ops = 0;
  let prev = new Array<boolean>(target + 1).fill(false);
  prev[0] = true;
  ops += target + 1; // 0 번째 줄
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const cur = new Array<boolean>(target + 1).fill(false);
    for (let t = 0; t <= target; t++) {
      ops++;
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
    prev = cur;
  }
  return { "기본 연산": ops, "추가 칸": (n + 1) * (target + 1) };
}

/** 비교 횟수를 세는 병합 정렬. `Array.prototype.sort` 는 구현마다 비교 수가 달라진다. */
function mergeSort(a: number[], count: { n: number }): number[] {
  if (a.length <= 1) return a;
  const mid = a.length >> 1;
  const left = mergeSort(a.slice(0, mid), count);
  const right = mergeSort(a.slice(mid), count);
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    count.n++;
    if ((left[i] as number) <= (right[j] as number))
      out.push(left[i++] as number);
    else out.push(right[j++] as number);
  }
  while (i < left.length) out.push(left[i++] as number);
  while (j < right.length) out.push(right[j++] as number);
  return out;
}

/**
 * 중간에서 만나기 — 원소를 절반으로 갈라 양쪽 부분합을 전부 만들고, 한쪽을 정렬한 뒤
 * 다른 쪽 값마다 `target - s` 를 이진 탐색한다.
 */
export function meetInTheMiddle(input: Input): Record<string, number> {
  const { nums, target } = input;
  const half = nums.length >> 1;
  let ops = 0;

  const sumsOf = (part: number[]): number[] => {
    let acc: number[] = [0];
    ops++;
    for (const a of part) {
      const next: number[] = [];
      for (const s of acc) {
        next.push(s);
        next.push(s + a);
        ops++;
      }
      acc = next;
    }
    return acc;
  };

  const left = sumsOf(nums.slice(0, half));
  const right = sumsOf(nums.slice(half));

  const counter = { n: 0 };
  const sorted = mergeSort(right, counter);
  ops += counter.n;

  // **답을 찾아도 멈추지 않는다.** 이 가이드의 DP 테이블도 안 멈추므로, 한쪽만 일찍 끝내면 두 계수가
  // 같은 일을 잰 값이 아니게 된다. 두 설계 다 조기 종료를 붙일 수 있고 최악은 그대로다.
  for (const s of left) {
    const want = target - s;
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo <= hi) {
      ops++;
      const mid = (lo + hi) >> 1;
      const v = sorted[mid] as number;
      if (v === want) break;
      if (v < want) lo = mid + 1;
      else hi = mid - 1;
    }
  }

  return {
    "기본 연산": ops,
    "추가 칸": left.length + right.length,
  };
}

// 두 설계가 같은 답을 내야 대조가 대조다. 다르면 여기서 실패한다.
for (const [name, input] of [
  ["A", A],
  ["B", B],
] as [string, Input][]) {
  const half = input.nums.length >> 1;
  const sums = (part: number[]): number[] => {
    let acc = [0];
    for (const a of part) acc = acc.flatMap((s) => [s, s + a]);
    return acc;
  };
  const set = new Set(sums(input.nums.slice(half)));
  const mitm = sums(input.nums.slice(0, half)).some((s) =>
    set.has(input.target - s),
  );
  if (mitm !== subsetSum(input.nums, input.target)) {
    throw new Error(
      `입력 ${name} 에서 두 설계의 답이 다르다 — 대조가 성립하지 않는다`,
    );
  }
}

/** 경계 행은 기본 연산 하나만 낸다 — 잡는 칸까지 실으면 본문 표가 재는 것을 덮는다. */
const opsOnly = (r: Record<string, number>): Record<string, number> => ({
  "기본 연산": r["기본 연산"] as number,
});

export const cases: Record<string, BenchCase> = {
  "DP 테이블 채우기 (이 가이드) · 입력 A": () => fillTable(A),
  "중간에서 만나기 · 입력 A": () => meetInTheMiddle(A),
  "DP 테이블 채우기 (이 가이드) · 입력 B": () => fillTable(B),
  "중간에서 만나기 · 입력 B": () => meetInTheMiddle(B),
  "DP 테이블 채우기 (이 가이드) · 경계 원소 19 개": () =>
    opsOnly(fillTable(E19)),
  "중간에서 만나기 · 경계 원소 19 개": () => opsOnly(meetInTheMiddle(E19)),
  "DP 테이블 채우기 (이 가이드) · 경계 원소 20 개": () =>
    opsOnly(fillTable(E20)),
  "중간에서 만나기 · 경계 원소 20 개": () => opsOnly(meetInTheMiddle(E20)),
};
