/**
 * 소수 판정 (시행 나눗셈, Trial Division)
 *
 * 작은 수 $n$이 소수인지 판별한다. $n$이 합성수라면 $\sqrt{n}$ 이하의 약수를 반드시 갖는다는 사실을 이용한다:
 *
 * $$n \text{ is composite} \implies \exists\, d : 2 \leq d \leq \lfloor \sqrt{n} \rfloor,\ d \mid n$$
 *
 * 따라서 $2$부터 $\lfloor \sqrt{n} \rfloor$까지 모든 정수로 나누어 떨어지는지 확인하면 충분하다.
 *
 * 정의에 따라 $n < 2$ 인 경우는 소수가 아니다.
 *
 * 시간 복잡도: $O(\sqrt{n})$.
 *
 * @param n - 판별할 정수 ($n \leq 10^{12}$ 범위에서 권장)
 * @returns $n$이 소수이면 `true`, 아니면 `false`
 */
export function isPrimeTrial(_n: number): boolean {
  throw new Error("Not implemented");
}
