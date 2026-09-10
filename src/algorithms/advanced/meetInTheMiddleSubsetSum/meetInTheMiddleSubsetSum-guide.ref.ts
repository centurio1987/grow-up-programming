/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `meetInTheMiddleSubsetSum.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가
 * 싣는 코드와 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑧ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **합은 배정밀도 칸에 담는다.** 원소의 절댓값 상한이 `10^9` 이고 원소가 40 개이므로 부분집합
 * 합의 절댓값 상한이 `4 x 10^10` 이고, 그것은 정수가 정확한 상한 `9,007,199,254,740,991` 안이다.
 * 목표 합은 그 상한 밖까지 올 수 있는데 그때 무슨 일이 일어나는지는 본문 「최악을 만드는
 * 입력」이 실측으로 낸다.
 *
 * **뒤 무리의 원소가 한 칸 더 많다.** 앞 무리의 크기가 내림이라 `n` 이 홀수면 앞이 `(n-1)/2`
 * 개, 뒤가 `(n+1)/2` 개다. 정렬하는 쪽이 그 큰 쪽이라는 사실이 비용에서 갖는 뜻은 본문
 * 「비용 계산」이 값으로 본다.
 */

/**
 * `nums[from .. to-1]` 의 모든 부분집합 합을 담은 길이 `2^(to-from)` 짜리 목록.
 *
 * 원소를 하나 더할 때마다 목록 길이가 두 배가 된다 — 앞에서 만든 합 전부와, 그 각각에 새
 * 원소를 더한 것 전부다. 자리 0 은 공집합의 합 0 이고, 새 칸에만 값을 적으므로 덧셈 횟수가
 * 목록 길이보다 하나 적다.
 */
export function subsetSums(
  nums: number[],
  from: number,
  to: number,
): Float64Array {
  // ① 합 목록 — 길이가 2^(to-from) 이고 자리 0 은 공집합의 합 0 이다.
  const out = new Float64Array(1 << (to - from));
  let size = 1;
  for (let i = from; i < to; i++) {
    const a = nums[i] as number;
    for (let j = 0; j < size; j++) {
      // ② 앞에서 만든 합 하나에 원소 하나를 더해 뒤쪽 칸을 채운다.
      out[size + j] = (out[j] as number) + a;
    }
    size <<= 1;
  }
  return out;
}

/**
 * 오름차순으로 정렬된 `sorted` 안에 값 `value` 가 있는가.
 *
 * 후보 구간을 `[lo, hi]` 로 두고 가운데 칸과 견주어 절반을 버린다. 정렬돼 있다는 것이
 * 「버려도 된다」의 근거이고, 정렬을 빼면 그 근거가 사라진다.
 */
export function binarySearchExists(
  sorted: Float64Array,
  value: number,
): boolean {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = sorted[mid] as number;
    // ③ 가운데 칸이 찾는 값이면 거기서 끝난다.
    if (v === value) return true;
    if (v < value) {
      // ④ 가운데 칸이 더 작으면 찾는 값은 오른쪽 절반에만 있을 수 있다.
      lo = mid + 1;
    } else {
      // ⑤ 가운데 칸이 더 크면 찾는 값은 왼쪽 절반에만 있을 수 있다.
      hi = mid - 1;
    }
  }
  return false;
}

export function meetInTheMiddleSubsetSum(
  nums: number[],
  target: number,
): boolean {
  const n = nums.length;
  // ⑥ 앞 무리의 원소 개수. 내림이라 n 이 홀수면 뒤 무리가 한 칸 더 많다.
  const mid = n >> 1;
  const sumsA = subsetSums(nums, 0, mid);
  const sumsB = subsetSums(nums, mid, n);
  // ⑦ 뒤 무리의 합 목록만 오름차순으로 정렬한다. 이분 탐색의 전제 조건이다.
  sumsB.sort();

  for (const sA of sumsA) {
    const need = target - sA;
    // ⑧ 앞 무리의 합 하나마다 모자란 값이 뒤 무리에 있는지 묻는다.
    if (binarySearchExists(sumsB, need)) return true;
  }
  return false;
}
