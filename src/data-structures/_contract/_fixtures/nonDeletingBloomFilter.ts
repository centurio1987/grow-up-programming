/**
 * 결함 fixture 둘 — **지우지 못하는 비트 배열 필터**를 `probabilistic/cuckooFilter` 계약에 넣은 것. 「A군 17종 판정」 ② 의
 * 반례 첫 줄(칸을 함께 쓰는 표현은 블룸 계약을 지키고 지우기를 못 한다)을 실행하는 자리다.
 *
 * - `PretendDeletingBloomFilter` — `delete` 가 비트를 건드리지 않고 `has` 의 답을 돌려준다. 사본이 있는 원소의 지우기가
 *   참이라 결정적인 경계 케이스를 전부 통과하고(사본이 없어진 원소의 `has` 는 관측값에서 빠진다), **오차 판정의 「다 지운
 *   필터」에서 걸린다** — 지운 원소가 전부 참이다.
 * - `ClearingBloomFilter` — `delete` 가 그 원소의 비트를 끈다. 비트를 함께 쓰던 다른 원소가 거짓 음성이 되어 **오차 판정의
 *   지우기 단계에서 걸린다**(사본이 남은 원소의 지우기가 거짓). 결정적 경계 케이스에서도 용량 2 인 작은 필터(「지우면 용량이
 *   다시 난다」)에서 두 원소의 비트가 거의 늘 겹쳐 걸린다(탐침 200/200). 겹치지 않을 확률이 0 은 아니라 자기시험은 오차
 *   판정만 단정한다.
 *
 * 둘 다 크기는 블룸 필터 정본과 같은 식으로 고르고 넣기를 거절하지 않는다. 계측 단위는 정본과 같다(§규약2 계측 단위).
 */

const FILL_SLACK = 0.9;

class BitFilter {
  protected readonly words: Uint32Array;
  readonly #slotCount: number;
  readonly #probes: number;
  readonly #startA = randomWord();
  readonly #startB = randomWord();
  readonly #startC = randomWord();
  readonly #multA = randomWord() | 1;
  readonly #multB = randomWord() | 1;
  readonly #multC = randomWord() | 1;

  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#probes = Math.max(1, Math.ceil(Math.log2(1 / falsePositiveRate)));
    const wanted =
      (this.#probes * Math.max(capacity, 1)) / (Math.LN2 * FILL_SLACK);
    this.words = new Uint32Array(Math.ceil(wanted / 32));
    this.#slotCount = this.words.length * 32;
    this.__cost += this.words.length + 1;
  }

  add(item: string): boolean {
    for (const slot of this.slots(item)) {
      this.__cost += 1;
      this.words[slot >>> 5] =
        (this.words[slot >>> 5] as number) | (1 << (slot & 31));
    }
    return true;
  }

  has(item: string): boolean {
    for (const slot of this.slots(item)) {
      this.__cost += 1;
      if (((this.words[slot >>> 5] as number) & (1 << (slot & 31))) === 0)
        return false;
    }
    return true;
  }

  protected slots(item: string): number[] {
    let a = this.#startA;
    let b = this.#startB;
    let c = this.#startC;
    for (let i = 0; i < item.length; i++) {
      const code = item.charCodeAt(i);
      a = Math.imul(a ^ code, this.#multA);
      b = Math.imul(b ^ code, this.#multB);
      c = Math.imul(c ^ code, this.#multC);
    }
    this.__cost += item.length * 3;
    a = finish(a ^ item.length);
    b = finish(b ^ item.length);
    c = finish(c ^ item.length);
    const out: number[] = [];
    for (let i = 0; i < this.#probes; i++)
      out.push(finish((a + Math.imul(i, b)) ^ c) % this.#slotCount);
    return out;
  }
}

export class PretendDeletingBloomFilter extends BitFilter {
  delete(item: string): boolean {
    return this.has(item);
  }
}

export class ClearingBloomFilter extends BitFilter {
  delete(item: string): boolean {
    if (!this.has(item)) return false;
    for (const slot of this.slots(item)) {
      this.__cost += 1;
      this.words[slot >>> 5] =
        (this.words[slot >>> 5] as number) & ~(1 << (slot & 31));
    }
    return true;
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
