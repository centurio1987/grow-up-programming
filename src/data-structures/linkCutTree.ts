/**
 * Link-Cut Tree (Sleator–Tarjan)
 *
 * 동적 포레스트(forest)에서 다음 연산을 모두 분할 상환 $O(\log n)$에 처리한다:
 *
 * 1. $\mathrm{link}(u, v)$: 두 트리를 간선 $(u, v)$로 연결
 * 2. $\mathrm{cut}(u, v)$: 간선 $(u, v)$를 제거
 * 3. $\mathrm{connected}(u, v)$: $u$와 $v$가 같은 트리에 속하는지 확인
 *
 * 내부 구조는 트리의 선호 경로(preferred path)들을 Splay Tree로 표현한
 * "preferred path decomposition" 이다. 핵심 보조 연산:
 *
 * $$\mathrm{access}(v) : v\text{를 자신이 속한 트리의 루트와 같은 splay 트리에 포함시킴}$$
 *
 * - $1 \leq n \leq 10^4$
 * - 질의 수 $q \leq 10^4$
 * - 노드는 $0$-기반 정수: $0 \leq v < n$
 */
export class LinkCutTree {
  /**
   * 크기 $n$의 Link-Cut Tree를 생성한다. 초기엔 모든 노드가 독립된 트리이다.
   *
   * @param n - 노드의 개수 ($1 \leq n \leq 10^4$)
   */
  constructor(n: number) {
    throw new Error("Not implemented");
  }

  /**
   * 노드 $u$와 $v$를 간선으로 연결한다. 두 노드는 서로 다른 트리에 있어야 한다.
   *
   * @param u - 노드 ($0 \leq u < n$)
   * @param v - 노드 ($0 \leq v < n$)
   */
  link(u: number, v: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 노드 $u$와 $v$ 사이의 간선을 제거한다. 간선이 실제 존재해야 한다.
   *
   * @param u - 노드 ($0 \leq u < n$)
   * @param v - 노드 ($0 \leq v < n$)
   */
  cut(u: number, v: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 노드 $u$와 $v$가 같은 트리(연결 컴포넌트)에 속하는지 확인한다.
   *
   * @param u - 노드
   * @param v - 노드
   * @returns 같은 트리이면 `true`
   */
  connected(u: number, v: number): boolean {
    throw new Error("Not implemented");
  }
}
