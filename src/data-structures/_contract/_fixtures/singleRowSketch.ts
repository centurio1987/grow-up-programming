/**
 * 결함 fixture — `probabilistic/countMinSketch` 계약에서 **실패 확률 δ 를 읽지 않는** 구현.
 *
 * 정본과 같은 방식으로 원소를 칸으로 보내 증분을 더하되 줄을 δ 와 무관하게 **하나만** 둔다(칸 수는 정본처럼 ⌈e/ε⌉).
 * 한 줄에서 원소가 가는 칸에 다른 원소가 ε·N 넘게 쌓일 확률은 δ 가 아니라 흐름의 모양이 정하므로, δ 를 낮춰도 한계를
 * 넘는 몫이 줄지 않는다. 결정적인 쪽(추정 ≥ 실제 빈도)은 지키므로 결정적 경계를 전부 통과하고, 축3도 통과한다(호출마다
 * 글자 수 + 1). 오차 판정이 목표 δ 를 읽는다는 것 — 판정 모양이 δ 를 여럿 두어야 하는 이유 — 을 보이는 자리다
 * (`fixedWidthBloomFilter.ts` 와 같은 자리). 어느 δ 부터 걸리는지는 자기시험 머리말.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위).
 */

export class SingleRowSketch {
  __cost = 0;
  readonly #cells: Float64Array;
  readonly #width: number;
  readonly #start = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  readonly #mult = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
  #total = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#width = Math.ceil(Math.E / epsilon);
    this.#cells = new Float64Array(this.#width);
    this.__cost += this.#width + 1;
  }

  update(item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(`증분 ${count}`);
    if (count > Number.MAX_SAFE_INTEGER - this.#total)
      throw new RangeError(`총증분 ${this.#total} + ${count}`);
    this.#total += count;
    const at = this.#slotOf(item);
    this.__cost += 1;
    this.#cells[at] = (this.#cells[at] as number) + count;
  }

  estimate(item: string): number {
    const at = this.#slotOf(item);
    this.__cost += 1;
    return this.#cells[at] as number;
  }

  #slotOf(item: string): number {
    let h = this.#start;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), this.#mult);
    this.__cost += item.length;
    return finish(h ^ item.length) % this.#width;
  }
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
