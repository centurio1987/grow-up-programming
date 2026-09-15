/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/countMinSketch` 계약의 확률 문장을 지키면서 **한 실행의 답을 전부 함께
 * 틀리는** 구현. 통계 판정이 이 구현을 부당하게 떨어뜨리지 않는지 보는 자리다(원칙 B 의 B5 — 부당 탈락 검사).
 *
 * 원소마다 받은 증분을 언어 `Map` 에 빠짐없이 센다. **이 모듈이 처음 읽힐 때 동전 u 를 한 번** 뽑고, 실패 확률 δ 로 세운 추정기는
 * u < δ 이면 **모든** 원소의 추정을 실제 빈도 + ⌊ε·N⌋ + 1(N 은 지금의 총증분 — 한계를 딱 넘는다)로, 아니면 실제 빈도로 낸다.
 *
 * - **확률 문장을 지킨다.** 어느 원소든 추정이 f + ε·N 을 넘을 확률이 P(u < δ) = δ 다. 과소 추정은 없다.
 * - **몰린다.** 한 실행의 추정기 · 원소가 u 를 함께 쓰므로 확률 δ 로 전부 틀린다. 추정기 하나에서 원소를 모아 세는 판정은 이
 *   구현을 확률 δ 로 떨어뜨린다. 시행마다 새 실행을 쓰는 통계 판정에서는 Z_t 가 베르누이(δ)라 Hoeffding 상한의 최악 경우다.
 *
 * 축1 전용이라 계측기를 두지 않는다. 결과 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」.
 */

const COIN = Math.random();

export class WholeRunOvercountSketch {
  readonly #counts = new Map<string, number>();
  readonly #epsilon: number;
  readonly #wrong: boolean;
  #total = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#wrong = COIN < delta;
  }

  update(item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(`증분 ${count}`);
    if (count > Number.MAX_SAFE_INTEGER - this.#total)
      throw new RangeError(`총증분 ${this.#total} + ${count}`);
    this.#total += count;
    this.#counts.set(item, (this.#counts.get(item) ?? 0) + count);
  }

  estimate(item: string): number {
    const frequency = this.#counts.get(item) ?? 0;
    return this.#wrong
      ? frequency + Math.floor(this.#epsilon * this.#total) + 1
      : frequency;
  }
}
