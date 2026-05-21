/**
 * N-Queens — 백트래킹 (DFS + 가지치기)
 *
 * $n \times n$ 체스판에 $n$개의 퀸을 서로 공격하지 못하도록 배치하는
 * 방법의 수를 반환한다. 두 퀸 $(r_1, c_1)$, $(r_2, c_2)$가 서로 공격하지
 * 않으려면:
 *
 * $$r_1 \neq r_2,\quad c_1 \neq c_2,\quad |r_1 - r_2| \neq |c_1 - c_2|$$
 *
 * 백트래킹으로 각 행에 차례로 퀸을 놓는다. 세 가지 비트마스크
 * — 열, 대각선 ($r + c$), 반대각선 ($r - c$) — 으로 충돌을 $O(1)$에 체크하고,
 * 모순 시 즉시 가지를 친다.
 *
 * 시간 복잡도는 최악 $O(n!)$이나 가지치기로 실제로는 훨씬 빠르다.
 *
 * @param n - 보드 크기 ($1 \leq n \leq 12$)
 * @returns 가능한 배치의 수 (예: $n=4 \Rightarrow 2$, $n=8 \Rightarrow 92$)
 */
export function nQueens(n: number): number {
  throw new Error("Not implemented");
}
