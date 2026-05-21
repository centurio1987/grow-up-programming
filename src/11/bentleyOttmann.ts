export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 여러 선분의 교차 — Bentley-Ottmann (스위프 라인)
 *
 * $n$개의 선분 $S = \{s_1, s_2, \ldots, s_n\}$ 가 주어질 때, 서로 다른 선분 쌍의
 * 교차 횟수를 반환한다. 같은 점에서 여러 선분이 동시에 만나더라도 쌍 단위로 센다:
 *
 * $$\text{count}(S) = \left| \{ (i, j) \mid i < j,\; s_i \cap s_j \neq \emptyset \} \right|$$
 *
 * 알고리즘 개요:
 *  - 이벤트 큐(우선순위 큐)에 각 선분의 양 끝점을 시작/끝 이벤트로 넣는다.
 *  - 수직 스위프 라인을 $x$ 증가 방향으로 이동시키며, 현재 라인과 교차하는
 *    선분들을 $y$ 좌표 순으로 정렬한 균형 BST(또는 Order-Statistic Tree)로 관리한다.
 *  - 시작 이벤트에서 새 선분을 삽입하고 위·아래 이웃과의 교차를 확인,
 *    끝 이벤트에서 선분을 제거하면서 사라진 자리에서 새 이웃 쌍의 교차를 확인,
 *    교차 이벤트에서는 두 선분의 BST 상 순서를 교환한다.
 *  - 새로 발견된 교차점은 다시 이벤트 큐에 넣어 진행한다.
 *
 * 교차 개수를 $k$라 할 때 시간 복잡도는 $O((n + k) \log n)$ 이다.
 * 끝점에서 닿는 경우(공유 끝점)도 교차로 셈한다.
 *
 * @param segments - 선분 배열 ($1 \leq n \leq 10^5$, $-10^9 \leq x, y \leq 10^9$)
 * @returns 교차하는 선분 쌍의 개수 ($\geq 0$)
 */
export function bentleyOttmann(segments: Segment[]): number {
  throw new Error("Not implemented");
}
