/**
 * Count-Min Sketch — 스트리밍 빈도 추정
 *
 * 폭 $w$ × 깊이 $d$의 카운터 행렬 $C$와 $d$개의 독립 해시 함수
 * $h_1, h_2, \ldots, h_d$ 를 사용해 다중 집합의 원소 빈도를 추정하는
 * 확률적 자료구조이다.
 *
 * 갱신 (count 횟수만큼 등장):
 *
 * $$\forall\, j \in [1, d],\; C[j][\, h_j(x) \bmod w\,] \mathrel{+}= \mathrm{count}$$
 *
 * 추정:
 *
 * $$\hat{f}(x) = \min_{1 \leq j \leq d} C[j][\, h_j(x) \bmod w\,]$$
 *
 * 정확도 보장: 실제 빈도 $f(x)$에 대해 다음을 만족 (확률 $\geq 1 - \delta$):
 *
 * $$f(x) \leq \hat{f}(x) \leq f(x) + \varepsilon \cdot N$$
 *
 * 여기서 $N = \sum_y f(y)$ 이고, $w = \lceil e / \varepsilon \rceil$,
 * $d = \lceil \ln(1 / \delta) \rceil$ 로 잡는다. 추정값은 절대 실제 빈도보다
 * 작지 않다 (no underestimate).
 *
 * - 폭 $w \leq 10^4$
 * - 깊이 $d \leq 16$
 * - 스트림 길이 $n \leq 10^5$
 */
export class CountMinSketch {
  /**
   * 폭 $w$ × 깊이 $d$의 Count-Min Sketch를 생성한다.
   *
   * @param width - 카운터 배열의 폭 $w$ ($1 \leq w \leq 10^4$)
   * @param depth - 해시 함수 개수 $d$ ($1 \leq d \leq 16$)
   */
  constructor(width: number, depth: number) {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$의 빈도를 $\mathrm{count}$ 만큼 증가시킨다.
   *
   * @param item - 원소 (문자열)
   * @param count - 추가할 빈도 ($\geq 1$)
   */
  update(item: string, count: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$의 빈도 추정값을 반환한다:
   *
   * $$\hat{f}(x) = \min_{1 \leq j \leq d} C[j][\, h_j(x) \bmod w\,]$$
   *
   * @param item - 원소 (문자열)
   * @returns 빈도 추정값 (실제 빈도의 상한)
   */
  estimate(item: string): number {
    throw new Error("Not implemented");
  }
}
