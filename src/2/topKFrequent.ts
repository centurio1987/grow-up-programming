/**
 * Top K Frequent Elements (상위 K개 빈도)
 *
 * 정수 배열 $A$와 정수 $k$가 주어질 때, $A$에 나타나는 원소들 중
 * 빈도수가 가장 큰 상위 $k$개의 원소를 반환한다.
 *
 * 각 원소 $v$의 빈도를 $f(v) = |\{ i \mid A[i] = v \}|$라 하면 결과는 다음을 만족한다:
 *
 * $$R \subseteq \{ v \mid v \in A \},\ |R| = k,\ \forall u \notin R,\ \forall v \in R: f(v) \geq f(u)$$
 *
 * 대표 접근:
 *
 * - Min-Heap: 빈도 기준 크기 $k$ 힙 유지, 전체 $O(n \log k)$
 * - Bucket Sort: 빈도값을 인덱스로 사용, $O(n)$
 *
 * 출력 순서는 빈도 내림차순으로 가정한다(동률 시 임의).
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$, $-10^9 \leq A[i] \leq 10^9$)
 * @param k - 반환할 상위 빈도 원소 개수 ($1 \leq k \leq$ 고유값 개수)
 * @returns 빈도 상위 $k$개 원소 (빈도 내림차순)
 */
export function topKFrequent(A: number[], k: number): number[] {
  throw new Error("Not implemented");
}
