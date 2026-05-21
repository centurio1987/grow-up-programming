/**
 * Meet in the Middle — Subset Sum
 *
 * 길이 $n$인 정수 배열 $\text{nums}$와 목표값 $\text{target}$이 주어진다.
 * 어떤 부분집합 $S \subseteq \text{nums}$에 대해
 *
 * $$\sum_{x \in S} x = \text{target}$$
 *
 * 을 만족하는 $S$가 존재하는지 판정한다 (공집합 포함, 합 = 0인 경우도 허용).
 *
 * 전수 탐색은 $O(2^n)$이라 $n = 40$에서 $2^{40} \approx 10^{12}$로 불가능하다.
 * Meet in the Middle 기법은 배열을 두 그룹 $L$, $R$ ($|L| \approx |R| \approx n/2$)
 * 으로 나누고, 각각의 모든 부분집합 합 $S_L$, $S_R$을 생성한 뒤
 *
 * $$\exists\, s_L \in S_L,\; s_R \in S_R \;:\; s_L + s_R = \text{target}$$
 *
 * 인지 확인한다. $S_R$을 정렬·이진 탐색하거나 해시셋에 담으면
 * 전체 시간 복잡도는 $O(2^{n/2} \cdot n/2)$로 감소한다.
 *
 * @param nums - 정수 배열 ($1 \leq n \leq 40$, $-10^9 \leq \text{nums}[i] \leq 10^9$)
 * @param target - 목표 합 ($-10^{18} \leq \text{target} \leq 10^{18}$)
 * @returns 합이 target인 부분집합이 존재하면 `true`, 아니면 `false`
 */
export function meetInTheMiddleSubsetSum(nums: number[], target: number): boolean {
  throw new Error("Not implemented");
}
