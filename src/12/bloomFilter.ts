/**
 * Bloom Filter — 메모리 절약형 집합 멤버십 자료구조
 *
 * 크기 $m$의 비트 배열 $B$와 $k$개의 독립 해시 함수
 * $h_1, h_2, \ldots, h_k$ 를 사용해 집합 멤버십을 확률적으로 판단한다.
 *
 * 추가:
 *
 * $$\forall\, j \in [1, k],\; B[\, h_j(x) \bmod m\,] \leftarrow 1$$
 *
 * 존재 여부 질의:
 *
 * $$\mathrm{has}(x) \;=\; \bigwedge_{j=1}^{k} B[\, h_j(x) \bmod m\,]$$
 *
 * 거짓 음성(false negative)이 없다: 추가된 원소는 반드시 `true`를 반환한다.
 * 거짓 양성(false positive) 확률은 $n$개 원소 추가 후 다음에 근사한다:
 *
 * $$p \approx \left(1 - e^{-kn/m}\right)^{k}$$
 *
 * - 비트 배열 크기 $m \leq 10^6$
 * - 해시 함수 개수 $k \leq 16$
 * - 원소 수 $n \leq 10^5$
 */
export class BloomFilter {
  /**
   * 크기 $m$ 비트 배열과 $k$개의 해시 함수를 갖는 Bloom Filter를 생성한다.
   *
   * @param size - 비트 배열 크기 $m$ ($1 \leq m \leq 10^6$)
   * @param hashCount - 해시 함수 개수 $k$ ($1 \leq k \leq 16$)
   */
  constructor(size: number, hashCount: number) {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$를 집합에 추가한다.
   *
   * @param item - 원소 (문자열)
   */
  add(item: string): void {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$가 집합에 속하는지 추정한다.
   *
   * - 추가된 원소에 대해서는 반드시 `true` (no false negative)
   * - 추가되지 않은 원소에 대해서도 `true`가 될 수 있음 (false positive 가능)
   *
   * @param item - 원소 (문자열)
   * @returns 가능한 멤버십 여부
   */
  has(item: string): boolean {
    throw new Error("Not implemented");
  }
}
