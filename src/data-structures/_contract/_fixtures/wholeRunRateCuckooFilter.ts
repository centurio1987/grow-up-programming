/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/cuckooFilter` 계약의 확률 문장 둘을 지키면서 **한 실행의 답을 전부 함께
 * 틀리는** 구현. 통계 판정이 이 구현을 부당하게 떨어뜨리지 않는지 보는 자리다(원칙 B 의 B5 — 부당 탈락 검사).
 *
 * 사본을 언어 `Map` 에 원소마다 센다(넣기는 거절하지 않는다). **이 모듈이 처음 읽힐 때 동전 u 를 한 번** 뽑고, 목표 ε 로 세운 필터는
 * u < ε 이면 사본이 없는 원소의 `has` 를 **전부** 참으로, 지우기를 **전부** 참으로(담긴 사본 중 가장 먼저 들어온 원소의 사본 하나를
 * 뺀다 — 헤더의 「어느 원소의 것인지 정하지 않은 사본」) 낸다. 아니면 정확한 다중집합이다.
 *
 * - **확률 문장 둘을 지킨다.** 사본이 없는 원소의 `has` · `delete` 가 참일 확률이 P(u < ε) = ε 다(지우기는 담긴 사본이 있을 때).
 * - **결정적 문장을 지킨다.** 사본이 있는 원소는 `has` 참 · `delete` 참(자기 사본을 뺀다)이고, 넣기를 거절하지 않는다.
 * - **몰린다.** 한 실행의 필터 · 원소가 u 를 함께 쓰므로 확률 ε 로 전부 틀린다. 시행마다 새 실행을 쓰는 통계 판정에서는 판정 셋의
 *   몫이 함께 베르누이(ε)라 Hoeffding 상한의 최악 경우 그 자체다.
 *
 * 축1 전용이라 계측기를 두지 않는다. 결과 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」.
 */

const COIN = Math.random();

export class WholeRunRateCuckooFilter {
  readonly #copies = new Map<string, number>();
  readonly #wrong: boolean;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#wrong = COIN < falsePositiveRate;
  }

  add(item: string): boolean {
    this.#copies.set(item, (this.#copies.get(item) ?? 0) + 1);
    return true;
  }

  has(item: string): boolean {
    return this.#wrong || (this.#copies.get(item) ?? 0) > 0;
  }

  delete(item: string): boolean {
    const held = this.#copies.get(item) ?? 0;
    if (held > 0) {
      this.#take(item, held);
      return true;
    }
    if (!this.#wrong) return false;
    for (const [other, count] of this.#copies) {
      this.#take(other, count);
      return true;
    }
    return false;
  }

  #take(item: string, held: number): void {
    if (held === 1) this.#copies.delete(item);
    else this.#copies.set(item, held - 1);
  }
}
