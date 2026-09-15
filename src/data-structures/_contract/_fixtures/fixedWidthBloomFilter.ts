/**
 * 결함 fixture — `probabilistic/bloomFilter` 계약의 **목표 오차를 읽지 않는** 비트 배열 필터.
 *
 * 용량 하나에 자리 8 개 · 원소마다 자리 3 개로 크기를 정한다 — 목표 오차 ε 가 무엇이든 같다. 용량을 채우면 거짓 양성의
 * 몫이 근사로 (1 − e^{−3/8})³ ≈ 3.06% 다. 해시는 정본처럼 생성 때 무작위를 뽑으므로 확률의 출처는 계약과 맞고, 틀린
 * 것은 **몫이 ε 를 따라가지 않는다**는 것 하나다. 그래서 오차 판정이 목표 오차에 따라 갈린다 — ε = 0.1 에서는 한계
 * (2 · ε = 20%) 안이라 통과하고, ε = 0.01 · 0.001 에서 한계(2% · 0.2%)를 넘어 걸린다. 스위트가 판정 모양을 셋 둔 이유가
 * 이것이다. 축3은 통과한다(호출마다 상수).
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 글자 하나 · 자리 하나를 지나갈 때마다 1.
 */

const SLOTS_PER_ITEM = 8;
const PROBES = 3;

export class FixedWidthBloomFilter {
  readonly #words: Uint32Array;
  readonly #slots: number;
  readonly #startA = randomWord();
  readonly #startB = randomWord();
  readonly #multA = randomWord() | 1;
  readonly #multB = randomWord() | 1;

  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#words = new Uint32Array(
      Math.ceil((SLOTS_PER_ITEM * Math.max(capacity, 1)) / 32),
    );
    this.#slots = this.#words.length * 32;
    this.__cost += this.#words.length + 1;
  }

  add(item: string): void {
    const [a, b] = this.#fold(item);
    for (let i = 0; i < PROBES; i++) {
      const slot = finish((a + Math.imul(i, b)) | 0) % this.#slots;
      this.__cost += 1;
      this.#words[slot >>> 5] =
        (this.#words[slot >>> 5] as number) | (1 << (slot & 31));
    }
  }

  has(item: string): boolean {
    const [a, b] = this.#fold(item);
    for (let i = 0; i < PROBES; i++) {
      const slot = finish((a + Math.imul(i, b)) | 0) % this.#slots;
      this.__cost += 1;
      if (((this.#words[slot >>> 5] as number) & (1 << (slot & 31))) === 0)
        return false;
    }
    return true;
  }

  #fold(item: string): [number, number] {
    let a = this.#startA;
    let b = this.#startB;
    for (let i = 0; i < item.length; i++) {
      const code = item.charCodeAt(i);
      a = Math.imul(a ^ code, this.#multA);
      b = Math.imul(b ^ code, this.#multB);
    }
    this.__cost += item.length;
    return [finish(a ^ item.length), finish(b ^ item.length)];
  }
}

function randomWord(): number {
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
