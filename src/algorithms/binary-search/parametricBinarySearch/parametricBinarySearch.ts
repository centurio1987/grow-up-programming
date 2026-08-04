export function parametricBinarySearch(A: number[], K: number): number {
  //전제
  //초기화
  let lo = Math.max(...A);
  let hi = A.reduce((acc, cur) => acc + cur);
  let mid = lo + Math.floor((hi - lo) / 2);
  //핵심 로직
  /**
   * 파라메트릭 서치
   * lo = max(A), hi = sum(A)
   * mid = lo + (lo - hi) / 2
   * while(lo <= hi)
   *    if feasible(mid)
   *        hi = mid - 1
   *    else
   *        lo = mid + 1
   *    mid = lo + (lo - hi) / 2
   * ret lo
   */

  while (lo <= hi) {
    if (feasible(A, mid, K)) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
    mid = lo + Math.floor((hi - lo) / 2);
  }
  //리턴
  return lo;
}

function feasible(A: number[], mid: number, K: number) {
  /**
   * count <- 분할 개수
   * accSum <- 한 어레이의 누적합
   * for(item of A)
   *    if accSum + item > mid
   *        count++
   *        accSum = item
   *    accSum += item
   * ret count <= k
   */
  let count = 1;
  let accSum = 0;

  for (let item of A) {
    if (accSum + item > mid) {
      count++;
      accSum = 0;
    }
    accSum += item;
  }

  return count <= K;
}
