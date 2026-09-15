/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/hyperLogLog` 계약의 확률 문장을 지키면서 **한 실행의 답을 전부 함께
 * 틀리는** 구현. 통계 판정이 이 구현을 부당하게 떨어뜨리지 않는지 보는 자리다(원칙 B 의 B5 — 부당 탈락 검사).
 *
 * 들어온 원소를 언어 `Set` 에 빠짐없이 담는다. **이 모듈이 처음 읽힐 때 동전 u 를 한 번** 뽑고, (ε, δ) 로 세운 인스턴스는
 * u < δ 이면 추정을 n + ⌊ε·n⌋ + 1(상대 오차 한계를 딱 넘는다), 아니면 정확한 n 으로 낸다.
 *
 * - **확률 문장을 지킨다.** 어느 인스턴스에서든 벗어날 확률이 P(u < δ) = δ 다.
 * - **결정적인 쪽을 지킨다.** 같은 실행 · 같은 매개변수에서 추정은 들어온 원소 집합의 크기만의 함수다 — 중복 무감 · 순서
 *   무관 · 합친 결과가 한 곳에 넣은 것과 같다.
 * - **몰린다.** 같은 실행의 인스턴스는 u 를 함께 쓰므로 확률 δ 로 **전부** 틀린다. 한 실행에서 인스턴스를 여럿 모아 세는 판정은
 *   이 구현을 확률 δ 로 떨어뜨린다. 시행마다 새 실행을 쓰는 통계 판정에서는 시행의 몫 Z_t 가 베르누이(δ)라 Hoeffding 상한의
 *   최악 경우 그 자체다 — 상한이 보장하는 값보다 더 떨어지지 않아야 한다.
 *
 * 축1 전용이라 계측기를 두지 않는다. 결과 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」.
 */

const COIN = Math.random();

export class WholeRunErrorSketch {
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

  count(): number {
    const n = this.#items.size;
    return COIN < this.#delta ? n + Math.floor(this.#epsilon * n) + 1 : n;
  }

  merge(other: WholeRunErrorSketch): WholeRunErrorSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const merged = new WholeRunErrorSketch(this.#epsilon, this.#delta);
    for (const item of this.#items) merged.add(item);
    for (const item of other.#items) merged.add(item);
    return merged;
  }
}
