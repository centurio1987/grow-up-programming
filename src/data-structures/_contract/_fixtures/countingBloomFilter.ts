/**
 * 판정 도구 fixture — **결함이 아니다.** 칸마다 수를 세는 블룸 필터. `probabilistic/cuckooFilter` 헤더의 검증 등급이 든
 * **자명한 구현**이고, `probabilistic/bloomFilter` 와 두 계약이 **서로 담지 않는다**는 판정(불변 사실 54)의 셋째 줄 — 두
 * 계약을 다 지키는 구현 — 이다.
 *
 * 원소마다 칸 k = ⌈log₂(1/ε)⌉ 개(원소 안에서 겹친 칸은 한 번)의 수를 올리고, 지울 때 그 칸이 전부 1 이상이면 내리고 참이다.
 * `has` 는 칸이 전부 1 이상인가다. 넣기를 거절하지 않으므로 용량 미만의 새 원소 문장을 공짜로 지키고, 호출마다 L 과 k 에
 * 비례해 끝나며 **그 시간에 확률 논증이 들지 않는다.** 헷갈린 지우기는 칸이 전부 1 이상일 때만 내리므로 수가 음이 되지
 * 않는다(원소 안에서 겹친 칸을 한 번만 세는 이유다). 칸 수는 블룸 필터 정본과 같은 식으로 고른다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 글자 하나 · 칸 하나를 지날 때마다 1.
 */

const FILL_SLACK = 0.9;

export class CountingBloomFilter {
  readonly #counts: Uint32Array;
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
    this.#counts = new Uint32Array(
      Math.ceil(
        (this.#probes * Math.max(capacity, 1)) / (Math.LN2 * FILL_SLACK),
      ),
    );
    this.__cost += this.#counts.length + 1;
  }

  add(item: string): boolean {
    for (const slot of this.#slots(item)) {
      this.__cost += 1;
      this.#counts[slot] = (this.#counts[slot] as number) + 1;
    }
    return true;
  }

  has(item: string): boolean {
    for (const slot of this.#slots(item)) {
      this.__cost += 1;
      if (this.#counts[slot] === 0) return false;
    }
    return true;
  }

  delete(item: string): boolean {
    const slots = this.#slots(item);
    for (const slot of slots) {
      this.__cost += 1;
      if (this.#counts[slot] === 0) return false;
    }
    for (const slot of slots)
      this.#counts[slot] = (this.#counts[slot] as number) - 1;
    return true;
  }

  /** 원소의 칸 k 개. 겹친 칸은 한 번만 낸다. */
  #slots(item: string): Set<number> {
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
    const out = new Set<number>();
    for (let i = 0; i < this.#probes; i++)
      out.add(finish((a + Math.imul(i, b)) ^ c) % this.#counts.length);
    return out;
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
