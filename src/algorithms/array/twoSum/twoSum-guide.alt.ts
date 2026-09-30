/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 둘이다.
 *
 * - **기본 연산** — 구성은 해시 맵 조회·기록 한 번과 값 비교 한 번이고 각각 1 로 센다. 해시 맵 쪽은
 *   조회·기록 호출 수, 두 포인터 쪽은 값 비교 수(정렬의 비교 + 두 포인터가 합을 target 과 비교한 수)다.
 *   두 설계 모두 보수 계산의 뺄셈 · 합을 만드는 덧셈 · 포인터 이동은 세지 않는다.
 * - **추가 칸** — 입력 말고 새로 잡은 칸. 해시 맵은 돌려줄 때의 항목 수(항목 하나를 1 칸, 지우지 않으니
 *   끝의 크기가 최댓값), 두 포인터는 원래 인덱스를 기억하려고 만든 인덱스 배열의 길이다(입력이 이미
 *   정렬돼 있으면 0). 병합 정렬이 잠시 잡는 배열과 재귀 스택은 넣지 않는다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/array/twoSum/twoSum-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여섯 칸짜리 `[5 8 3 8 12 2]` 를 쓰는데, 여섯
 * 칸에서는 정렬의 비교가 열 번 남짓이라 두 설계의 차이가 상수에 가려진다. 그래서 같은 규칙으로 만든
 * 2,048 칸 입력을 쓴다. **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그
 * 식을 본문에도 적는다.
 *
 * **해시 맵 쪽은 정본을 그대로 부른다.** `Map.prototype` 의 `get`·`set` 을 잠시 감싸 호출 수만
 * 세고 되돌린다. 두 포인터 쪽은 매 실행마다 정본과 답의 합이 같은지 대조한다.
 */
import { twoSum } from "./twoSum-guide.ref.ts";

/** 배열 길이. */
export const N = 2048;

/** 정렬 안 된 입력. `v[k] = (733k) mod 4099`. 4099 가 소수라 값이 모두 다르다. */
export const UNSORTED: number[] = Array.from(
  { length: N },
  (_, k) => (k * 733) % 4099,
);

/** 같은 값을 오름차순으로 놓은 입력. */
export const SORTED: number[] = [...UNSORTED].sort((a, b) => a - b);

/** 목표 합 — 정렬 안 된 입력의 마지막 두 원소의 합. */
export const TARGET: number =
  (UNSORTED[N - 2] as number) + (UNSORTED[N - 1] as number);

/** 정본을 부르면서 해시 맵 조회·기록 호출 수와 돌려줄 때의 항목 수를 센다. */
export function counted(
  nums: number[],
  target: number,
): { answer: [number, number]; gets: number; sets: number; size: number } {
  const proto = Map.prototype as Map<unknown, unknown>;
  const get = proto.get;
  const set = proto.set;
  let gets = 0;
  let sets = 0;
  let last: Map<unknown, unknown> | null = null;
  proto.get = function (this: Map<unknown, unknown>, key: unknown) {
    gets++;
    last = this;
    return get.call(this, key);
  };
  proto.set = function (
    this: Map<unknown, unknown>,
    key: unknown,
    value: unknown,
  ) {
    sets++;
    last = this;
    return set.call(this, key, value);
  };
  try {
    const answer = twoSum([...nums], target);
    const size = (last as Map<unknown, unknown> | null)?.size ?? 0;
    return { answer, gets, sets, size };
  } finally {
    proto.get = get;
    proto.set = set;
  }
}

/** 비교를 세는 병합 정렬 — 인덱스 배열을 값 기준으로 정렬한다. */
function mergeSortIdx(
  idx: number[],
  nums: number[],
  counter: { cmp: number },
): number[] {
  if (idx.length <= 1) return idx;
  const mid = idx.length >> 1;
  const a = mergeSortIdx(idx.slice(0, mid), nums, counter);
  const b = mergeSortIdx(idx.slice(mid), nums, counter);
  const out: number[] = [];
  let p = 0;
  let q = 0;
  while (p < a.length && q < b.length) {
    counter.cmp++;
    if ((nums[a[p] as number] as number) <= (nums[b[q] as number] as number)) {
      out.push(a[p++] as number);
    } else {
      out.push(b[q++] as number);
    }
  }
  while (p < a.length) out.push(a[p++] as number);
  while (q < b.length) out.push(b[q++] as number);
  return out;
}

/** 정렬 후 두 포인터. `sorted` 면 정렬을 건너뛰고 인덱스 배열도 만들지 않는다. */
export function twoPointers(
  nums: number[],
  target: number,
  sorted: boolean,
): { answer: [number, number]; cmp: number; cells: number } {
  const counter = { cmp: 0 };
  const n = nums.length;
  const order = sorted
    ? null
    : mergeSortIdx(
        Array.from({ length: n }, (_, k) => k),
        nums,
        counter,
      );
  const at = (k: number): number => (order ? (order[k] as number) : k);
  let l = 0;
  let r = n - 1;
  while (l < r) {
    const s = (nums[at(l)] as number) + (nums[at(r)] as number);
    counter.cmp++;
    if (s === target) {
      const a = at(l);
      const b = at(r);
      return {
        answer: a < b ? [a, b] : [b, a],
        cmp: counter.cmp,
        cells: order ? n : 0,
      };
    }
    if (s < target) l++;
    else r--;
  }
  throw new Error("짝이 없다");
}

/** 두 설계가 같은 입력에서 모두 합이 target 인 짝을 냈는지 확인한다. */
function assertPair(nums: number[], [i, j]: [number, number]): void {
  if (i >= j || (nums[i] as number) + (nums[j] as number) !== TARGET) {
    throw new Error(`합이 ${TARGET} 인 짝이 아니다 — [${i}, ${j}]`);
  }
}

function hashCase(nums: number[]): Record<string, number> {
  const c = counted(nums, TARGET);
  assertPair(nums, c.answer);
  return { "기본 연산": c.gets + c.sets, "추가 칸": c.size };
}

function pointerCase(nums: number[], sorted: boolean): Record<string, number> {
  const c = twoPointers(nums, TARGET, sorted);
  assertPair(nums, c.answer);
  return { "기본 연산": c.cmp, "추가 칸": c.cells };
}

export const cases = {
  "해시 맵 · 정렬 안 된 입력": () => hashCase(UNSORTED),
  "정렬 후 두 포인터 · 정렬 안 된 입력": () => pointerCase(UNSORTED, false),
  "해시 맵 · 정렬된 입력": () => hashCase(SORTED),
  "두 포인터 · 정렬된 입력": () => pointerCase(SORTED, true),
};
