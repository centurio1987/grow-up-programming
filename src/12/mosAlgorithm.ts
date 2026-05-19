/**
 * Mo's Algorithm — 오프라인 구간 질의의 제곱근 분해
 *
 * 길이 $n$의 배열 $A$와 $q$개의 구간 질의 $[l_i, r_i]$가 주어진다.
 * 각 구간에 대해 서로 다른 원소의 개수(distinct count)를 반환한다:
 *
 * $$\mathrm{answer}(l, r) = |\{ A[k] \mid l \leq k \leq r \}|$$
 *
 * 질의들을 $\bigl(\lfloor l / \sqrt{n} \rfloor,\; r\bigr)$ 기준으로 정렬한 뒤,
 * 두 포인터를 이동시키며 답을 누적하면 전체 시간복잡도는 $O\bigl((n + q) \sqrt{n}\bigr)$ 이다.
 *
 * - $1 \leq n \leq 10^4$
 * - 질의 수 $q \leq 10^4$
 * - $A[i] \in \mathbb{Z}$
 * - 구간은 $0$-기반 폐구간: $0 \leq l \leq r < n$
 */

/**
 * 각 질의에 대해 구간 내 서로 다른 원소의 개수를 반환한다.
 *
 * 반환 배열은 입력 `queries`의 원래 순서를 따른다:
 *
 * $$\mathrm{result}[i] = |\{ A[k] \mid l_i \leq k \leq r_i \}|$$
 *
 * @param arr - 정수 배열 ($1 \leq n \leq 10^4$)
 * @param queries - $[l, r]$ 구간 질의 배열 ($q \leq 10^4$)
 * @returns 각 질의의 distinct 원소 개수 (입력 순서)
 */
export function mosAlgorithm(
  _arr: number[],
  _queries: [number, number][],
): number[] {
  throw new Error("Not implemented");
}
