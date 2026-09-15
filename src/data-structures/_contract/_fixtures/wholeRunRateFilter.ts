/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/bloomFilter` 계약의 확률 문장을 지키면서 **한 실행의 답을 전부 함께
 * 틀리는** 구현. 통계 판정이 이 구현을 부당하게 떨어뜨리지 않는지 보는 자리다(원칙 B 의 B5 — 부당 탈락 검사).
 *
 * 넣은 원소는 언어 `Set` 에 빠짐없이 담아 참으로 답한다. **이 모듈이 처음 읽힐 때 동전 u 를 한 번** 뽑고, 목표 ε 로 세운 필터는
 * u < ε 이면 넣지 않은 원소에도 **전부** 참을, 아니면 전부 거짓을 낸다.
 *
 * - **확률 문장을 지킨다.** 넣지 않은 어느 원소든 참일 확률이 P(u < ε) = ε 다. 넣은 원소는 늘 참이다.
 * - **몰린다.** 한 실행의 필터 · 원소가 u 를 함께 쓰므로 확률 ε 로 전부 틀린다. 필터 하나에서 원소를 모아 세는 판정은 이 구현을
 *   확률 ε 로 떨어뜨린다. 시행마다 새 실행을 쓰는 통계 판정에서는 Z_t 가 베르누이(ε)라 Hoeffding 상한의 최악 경우 그 자체다.
 *
 * 축1 전용이라 계측기를 두지 않는다. 결과 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」.
 */

const COIN = Math.random();

export class WholeRunRateFilter {
  readonly #items = new Set<string>();
  readonly #wrong: boolean;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#wrong = COIN < falsePositiveRate;
  }

  add(item: string): void {
    this.#items.add(item);
  }

  has(item: string): boolean {
    return this.#wrong || this.#items.has(item);
  }
}
