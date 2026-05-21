/**
 * 접미사 구조 통합 (Suffix Automaton / Suffix Tree)
 *
 * 문자열 $s$의 모든 부분 문자열을 표현하는 최소 결정성 유한 오토마타.
 * 상태 수는 $\leq 2n - 1$, 전이 수는 $\leq 3n - 4$로 $O(n)$ 공간/시간에 구축 가능.
 *
 * 본 클래스가 제공하는 연산:
 *
 * 1. `countDistinctSubstrings()`:
 *    문자열 $s$의 서로 다른 비공(non-empty) 부분 문자열 개수를 반환.
 *
 *    각 상태 $v$ (초기 상태 제외)에서 표현하는 부분 문자열의 수는
 *    $\text{len}(v) - \text{len}(\text{link}(v))$이므로:
 *
 *    $$\#\{\, w \neq \varepsilon \mid w \text{ is a substring of } s \,\} = \sum_{v \neq v_0} \bigl(\text{len}(v) - \text{len}(\text{link}(v))\bigr)$$
 *
 * 2. `contains(t)`:
 *    문자열 $t$가 $s$의 부분 문자열인지 여부 ($O(|t|)$).
 *
 * @param s - 입력 문자열 ($1 \leq |s| \leq 10^{5}$)
 */
export class SuffixAutomaton {
  constructor(s: string) {
    throw new Error("Not implemented");
  }

  /**
   * $s$의 서로 다른 비공 부분 문자열 개수를 반환한다.
   *
   * @returns $\#\{\, w \neq \varepsilon \mid w \text{ is a substring of } s \,\}$
   */
  countDistinctSubstrings(): number {
    throw new Error("Not implemented");
  }

  /**
   * $t$가 $s$의 부분 문자열인지 여부를 반환한다 ($O(|t|)$).
   *
   * @param t - 검사할 문자열
   * @returns $t \in \text{Sub}(s)$ 이면 `true`, 아니면 `false`
   */
  contains(t: string): boolean {
    throw new Error("Not implemented");
  }
}
