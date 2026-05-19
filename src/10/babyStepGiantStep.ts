/**
 * 이산 로그 (Baby-step Giant-step)
 *
 * 모듈러 $m$ 위에서 다음을 만족하는 가장 작은 음이 아닌 정수 $x$를 구한다:
 *
 * $$a^x \equiv b \pmod{m}$$
 *
 * Baby-step Giant-step (BSGS) 알고리즘은 다음을 이용한다.
 * $x = i \cdot N - j$ ($N = \lceil \sqrt{m} \rceil$, $0 \leq j < N$, $1 \leq i \leq N$)로 표현하면:
 *
 * $$a^{i N} \equiv b \cdot a^{j} \pmod{m}$$
 *
 * Baby-step에서 $b \cdot a^j \bmod m$ ($0 \leq j < N$) 을 해시에 저장하고,
 * Giant-step에서 $a^{iN} \bmod m$ ($i = 1, \ldots, N$) 의 매칭을 검색한다.
 *
 * 해가 존재하지 않으면 $-1$을 반환한다.
 *
 * 시간/공간 복잡도: $O(\sqrt{m})$.
 *
 * @param a - 밑 (bigint)
 * @param b - 우변 (bigint)
 * @param m - 모듈러 ($m \geq 2$, bigint)
 * @returns $a^x \equiv b \pmod m$ 을 만족하는 가장 작은 $x \geq 0$. 해가 없으면 `-1n`.
 */
export function babyStepGiantStep(_a: bigint, _b: bigint, _m: bigint): bigint {
  throw new Error("Not implemented");
}
