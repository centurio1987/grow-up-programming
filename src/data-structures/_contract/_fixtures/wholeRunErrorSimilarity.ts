/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/minHash` 계약의 확률 문장을 지키면서 **한 실행의 답을 전부 함께 틀리는**
 * 구현. 통계 판정이 이 구현을 부당하게 떨어뜨리지 않는지 보는 자리다(원칙 B 의 B5 — 부당 탈락 검사).
 *
 * 들어온 원소를 언어 `Set` 에 빠짐없이 담는다. **이 모듈이 처음 읽힐 때 동전 u 를 한 번** 뽑고, (ε, δ) 로 세운 인스턴스의 닮음은
 * 두 집합이 같으면 1, 다르면 u < δ 일 때 참 닮음에서 ε 를 딱 넘게 벗어난 값(참 닮음 + ε + 10^−6, 1 을 넘으면 참 닮음 − ε − 10^−6),
 * 아니면 정확한 자카드 닮음이다.
 *
 * - **확률 문장을 지킨다.** 어느 짝이든 벗어날 확률이 P(u < δ) = δ 이하다(같은 집합의 짝은 벗어나지 않는다).
 * - **결정적인 쪽을 지킨다.** 같은 실행 · 같은 매개변수에서 닮음은 두 집합의 짝만의 함수이고 방향과 무관하며 같은 집합이면 1 이다.
 * - **몰린다.** 같은 실행의 짝이 u 를 함께 쓰므로 확률 δ 로 **전부** 틀린다. 시행마다 새 실행을 쓰는 통계 판정에서는 Z_t 가
 *   베르누이(δ) 이하라 Hoeffding 상한의 최악 경우에 붙는다.
 *
 * 축1 전용이라 계측기를 두지 않는다. 결과 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」.
 */

const COIN = Math.random();

/** 벗어난 값이 판정의 ε 비교(10^−9 여유)를 확실히 넘도록 더하는 몫. */
const OVERSHOOT = 1e-6;

export class WholeRunErrorSimilarity {
  readonly #items = new Set<string>();
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
  }

  add(item: string): void {
    this.#items.add(item);
  }

  similarity(other: WholeRunErrorSimilarity): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const [small, large] =
      this.#items.size <= other.#items.size
        ? [this.#items, other.#items]
        : [other.#items, this.#items];
    let common = 0;
    for (const item of small) if (large.has(item)) common++;
    const union = this.#items.size + other.#items.size - common;
    if (common === union) return 1;
    const truth = common / union;
    if (!(COIN < this.#delta)) return truth;
    const bump = this.#epsilon + OVERSHOOT;
    if (truth + bump <= 1) return truth + bump;
    if (truth - bump >= 0) return truth - bump;
    return truth;
  }
}
