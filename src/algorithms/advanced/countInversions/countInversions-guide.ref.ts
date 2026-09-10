/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/advanced/countInversions/countInversions.ts` 는 학습자 스텁이라 본문에
 * 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 —
 * 조각을 반으로 갈라 각각 정렬하며 세고, 합치는 자리에서 오른쪽 값을 꺼낼 때마다 왼쪽에
 * 아직 안 옮긴 개수를 더한다.
 *
 * **반환값은 배정밀도 정수다.** 역순쌍은 많아야 `N(N-1)/2` 이고 제약 상한 `N = 10^5` 에서
 * 4,999,950,000 이라 `2^53` 안쪽이다. 그 한계가 어디인지는 본문 「수식 정의와 유도」가
 * 닫힌 형태로 내고 실측과 대조한다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 같은 값을 왼쪽으로 보내는 판정을 오른쪽으로 바꾸면 같은 값끼리를 역순쌍으로 센다.
 * - 합친 결과를 제자리에 옮겨 적는 줄을 지우면 위 자리의 전제가 깨진다.
 * - 더하는 개수를 하나 줄이면 오른쪽 값을 꺼낼 때마다 한 쌍씩 빠진다.
 */

/**
 * `arr` 에서 `p < q` 이고 `arr[p] > arr[q]` 인 자리 쌍 `(p, q)` 의 개수를 낸다.
 * 입력 배열은 바꾸지 않는다.
 */
export function countInversions(arr: number[]): number {
  const N = arr.length;
  if (N <= 1) return 0;

  const a = arr.slice();
  const buffer = new Array<number>(N);

  function merge(lo: number, mid: number, hi: number): number {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) <= (a[j] as number)) {
        // ② 왼쪽이 작거나 같으면 그대로 옮긴다. 같은 값은 역순쌍이 아니라 여기로 온다.
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        // ③ 오른쪽을 꺼내는 순간, 왼쪽에 아직 안 옮긴 mid - i + 1 개가 전부 이 값보다 크다.
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
    }
    // ④ 한쪽이 비면 남은 쪽을 그대로 옮긴다. 여기서는 더 셀 것이 없다.
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    // ⑤ 합친 결과를 제자리에 옮겨 적는다. 위 자리가 기대는 전제를 여기서 세운다.
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    return count;
  }

  function sortAndCount(lo: number, hi: number): number {
    // ① 칸이 하나뿐인 조각에는 쌍이 없다.
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let count = sortAndCount(lo, mid);
    count += sortAndCount(mid + 1, hi);
    count += merge(lo, mid, hi);
    return count;
  }

  return sortAndCount(0, N - 1);
}
