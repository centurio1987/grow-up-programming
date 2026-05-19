/**
 * 접미사 LCP (Kasai's Algorithm)
 *
 * 문자열 $s$와 그 접미사 배열 $\text{SA}$가 주어질 때, 인접한 정렬된 접미사들의
 * 최장 공통 접두사(LCP, Longest Common Prefix) 길이를 담은 배열 $\text{LCP}$를 반환한다.
 *
 * 정의 (Kasai 표준 표기, 길이 $n$ 배열로 마지막 원소는 0):
 *
 * $$\text{LCP}[i] = \mathrm{lcp}\bigl(s[\text{SA}[i] \ldots],\; s[\text{SA}[i+1] \ldots]\bigr)
 *   \quad (0 \leq i < n - 1),\;\; \text{LCP}[n - 1] = 0$$
 *
 * 여기서 $\mathrm{lcp}(x, y)$는 두 문자열의 가장 긴 공통 접두사의 길이.
 *
 * Kasai 알고리즘은 역배열(rank)을 이용해 전체를 $O(n)$ 시간에 계산한다.
 *
 * 예: `s = "banana"`, `sa = [5,3,1,0,4,2]`,
 *     `kasaiLcp("banana", sa) = [1, 3, 0, 0, 2, 0]`
 *  - lcp("a", "ana") = 1
 *  - lcp("ana", "anana") = 3
 *  - lcp("anana", "banana") = 0
 *  - lcp("banana", "na") = 0
 *  - lcp("na", "nana") = 2
 *  - 마지막: 0
 *
 * @param s - 입력 문자열 ($1 \leq |s| \leq 10^{5}$)
 * @param sa - $s$의 접미사 배열 (길이 $n$)
 * @returns 길이 $n$의 LCP 배열 (마지막 원소는 0)
 */
export function kasaiLcp(_s: string, _sa: number[]): number[] {
  throw new Error("Not implemented");
}
