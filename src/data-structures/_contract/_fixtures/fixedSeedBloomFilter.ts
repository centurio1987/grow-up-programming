/**
 * 판정 도구 fixture — **계약을 어기는데 스위트를 통과하는** 비트 배열 필터. 정본과 크기 · 자리 수 · 자리 고르는 법이 같고,
 * 다른 것은 **해시의 시작값과 곱수가 상수**라는 것 하나다.
 *
 * `probabilistic/bloomFilter` 헤더는 확률의 출처를 「구현이 뽑는 무작위」로 정했다. 원소를 자리로 보내는 함수가 고정이면 그
 * 함수에 대해 헷갈리는 원소가 실재하고, 그 원소를 **필터를 세우기 전에** 골라 둔 호출자에게 거짓 양성의 확률은 1 이다 —
 * 계약 위반이다. 그런데 스위트의 원소 묶음은 이 구현의 상수를 읽지 않고 정해지므로 오차 판정이 정본과 같은 몫으로
 * 통과한다(불변 사실 44 — 구현을 읽어 지은 입력은 시나리오가 아니다). 이름을 적어 두는 이유가 그것이다(불변 사실 62).
 *
 * 자기시험이 위반을 실행으로 보인다 — 필터 하나에서 거짓 양성 원소를 찾아 모은 뒤, **같은 원소를 넣은 새 필터**에 그
 * 원소를 묻는다. 이 구현은 전부 참이고(상수가 같으므로 같은 자리로 간다) 정본은 새로 뽑은 무작위 때문에 몫이 ε 근처로
 * 돌아간다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위).
 */

const WORD_BITS = 32;
const FILL_SLACK = 0.9;
const STARTS = [0x9e3779b9, 0x7f4a7c15, 0x94d049bb] as const;
const MULTS = [0xbf58476d, 0x1ce4e5b9, 0x2545f491] as const;

export class FixedSeedBloomFilter {
  readonly #words: Uint32Array;
  readonly #slots: number;
  readonly #probes: number;
  readonly #folded = new Uint32Array(3);

  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#probes = Math.max(1, Math.ceil(Math.log2(1 / falsePositiveRate)));
    const wanted =
      (this.#probes * Math.max(capacity, 1)) / (Math.LN2 * FILL_SLACK);
    this.#words = new Uint32Array(Math.ceil(wanted / WORD_BITS));
    this.#slots = this.#words.length * WORD_BITS;
    this.__cost += this.#words.length + 1;
  }

  add(item: string): void {
    this.#fold(item);
    for (let i = 0; i < this.#probes; i++) {
      const slot = this.#slotOf(i);
      this.__cost += 1;
      this.#words[slot >>> 5] =
        (this.#words[slot >>> 5] as number) | (1 << (slot & 31));
    }
  }

  has(item: string): boolean {
    this.#fold(item);
    for (let i = 0; i < this.#probes; i++) {
      const slot = this.#slotOf(i);
      this.__cost += 1;
      if (((this.#words[slot >>> 5] as number) & (1 << (slot & 31))) === 0)
        return false;
    }
    return true;
  }

  #fold(item: string): void {
    for (let j = 0; j < 3; j++) {
      let h: number = STARTS[j] as number;
      for (let i = 0; i < item.length; i++)
        h = Math.imul(h ^ item.charCodeAt(i), MULTS[j] as number);
      this.#folded[j] = finish(h ^ item.length);
    }
    this.__cost += item.length * 3;
  }

  #slotOf(i: number): number {
    const f = this.#folded;
    const mixed =
      ((f[0] as number) + Math.imul(i, f[1] as number)) ^ (f[2] as number);
    return finish(mixed) % this.#slots;
  }
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
