/**
 * 판정 도구 fixture — **계약을 어기는데 통계 판정을 통과하는** 하이퍼로그로그. 정본과 자리 수 · 자리 고르는 법 · 추정식이 같고,
 * 다른 것은 **해시의 시작값과 곱수가 상수**라는 것 하나다(`fixedSeedBloomFilter.ts` 와 같은 자리).
 *
 * `probabilistic/hyperLogLog` 헤더는 확률의 출처를 「구현이 뽑는 무작위」로 정했고 해시를 고정한 구현은 계약을 어긴다고 적었다 —
 * 그 해시에 대해 한 자리로 몰리는 원소 집합이 실재하기 때문이다. 통계 판정은 시행마다 새 워커를 띄워 구현 무작위를 새로 뽑게
 * 하지만, **이 구현에는 뽑을 무작위가 없다.** 시행끼리 달라지는 것은 입력(시행 번호가 꼬리표에 든다)뿐이라 판정은 이 해시가
 * 그 입력들에서 흩는 몫을 보고 정본과 같은 모양으로 통과한다. 몰리는 집합은 구현의 상수를 읽어야 지어진다(불변 사실 44).
 *
 * 추정식의 상수와 설명은 정본 머리말(`../../probabilistic/hyperLogLog/_reference/hyperLogLog.ts`)과 같다. 계측 단위도 같다.
 */

const INVERSE_POWERS = Float64Array.from({ length: 34 }, (_, r) => 2 ** -r);
const STARTS = Uint32Array.of(0x9e3779b9, 0x7f4a7c15);
const MULTS = Uint32Array.of(0xbf58476d | 1, 0x94d049bb | 1);

export class FixedHashSketch {
  readonly #registers: Uint8Array;
  readonly #bits: number;
  readonly #epsilon: number;
  readonly #delta: number;

  __cost = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    const wanted = Math.ceil(Math.log2(2 / (epsilon * epsilon * delta)));
    this.#bits = Math.min(30, Math.max(4, wanted));
    this.#registers = new Uint8Array(2 ** this.#bits);
    this.__cost += this.#registers.length + 1;
  }

  add(item: string): void {
    const slot = fold(0, item) >>> (32 - this.#bits);
    const rank = Math.clz32(fold(1, item)) + 1;
    this.__cost += item.length * 2 + 1;
    if (rank > (this.#registers[slot] as number)) this.#registers[slot] = rank;
  }

  count(): number {
    const m = this.#registers.length;
    let sum = 0;
    let empty = 0;
    for (let j = 0; j < m; j++) {
      const rank = this.#registers[j] as number;
      sum += INVERSE_POWERS[rank] as number;
      if (rank === 0) empty++;
    }
    this.__cost += m;
    const raw = (alpha(m) * m * m) / sum;
    if (raw <= 2.5 * m && empty > 0) return m * Math.log(m / empty);
    return raw;
  }

  merge(other: FixedHashSketch): FixedHashSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const merged = new FixedHashSketch(this.#epsilon, this.#delta);
    for (let j = 0; j < merged.#registers.length; j++) {
      const a = this.#registers[j] as number;
      const b = other.#registers[j] as number;
      merged.#registers[j] = a > b ? a : b;
    }
    this.__cost += merged.#registers.length;
    return merged;
  }
}

function alpha(m: number): number {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

function fold(line: number, item: string): number {
  const mult = MULTS[line] as number;
  let h = STARTS[line] as number;
  for (let i = 0; i < item.length; i++)
    h = Math.imul(h ^ item.charCodeAt(i), mult);
  return finish(h ^ item.length);
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
