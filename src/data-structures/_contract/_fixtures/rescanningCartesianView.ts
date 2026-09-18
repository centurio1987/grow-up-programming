/**
 * 결함 fixture — 트리를 세우지 않고 수열 조각만 들고 있다가 물을 때마다 최솟값을 다시 찾는
 * 카르테시안 트리.
 *
 * `tree/cartesianTree` 계약의 필요충분조건 비용 조건 뒷문장을 겨눈다 — *"마디 훑기가
 * 상수를 넘으면 남는 것은 수열 그대로다"*. 이 구현은 수열과 구간 두 끝만 들고, 부분트리에
 * 담긴 값이 수열에서 붙어 있다는 사실을 그대로 쓴다. **값은 전부 옳다** — 축1을 통과하고,
 * 구성도 사본 하나라 선형이라 구성 시나리오 둘을 **통과한다.**
 *
 * 위 fixture(`scanningCartesianTree.ts`)와 **반대쪽에서 걸린다.** 저쪽은 구성만 어기고
 * 훑기는 상수이며, 이쪽은 구성을 지키고 훑기만 어긴다. 두 fixture 가 계약의 두 자리를 각각
 * 하나씩 짚어야 「어느 시나리오가 무엇을 혼자 잡는가」를 말할 수 있다(불변 사실 118).
 *
 * 걸리는 것은 `value()`·`left()`·`right()` 셋이고, 셋이 한 시나리오에 묶여 있으므로 판정은
 * 그 시나리오 하나로 난다.
 */

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class RescanningCartesianView<T> {
  #seq: readonly T[];
  #lo: number;
  #hi: number;
  #compare: (a: T, b: T) => number;
  #meter: { cost: number };

  constructor(seq: readonly T[], comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? defaultCompare;
    this.#meter = { cost: 0 };
    // 사본을 뜨는 것이 구성의 전부다. 계약이 요구하는 「호출자가 고쳐도 안 바뀐다」는
    // 지키면서 상한도 선형이라, 이 fixture 는 구성 쪽에서 아무 결함이 없다.
    this.#seq = [...seq];
    this.#meter.cost += seq.length;
    this.#lo = 0;
    this.#hi = this.#seq.length;
  }

  get __cost(): number {
    return this.#meter.cost;
  }

  value(): T | null {
    if (this.#hi <= this.#lo) {
      this.#meter.cost += 1;
      return null;
    }
    return this.#seq[this.#argmin()] as T;
  }

  left(): RescanningCartesianView<T> | null {
    if (this.#hi <= this.#lo) {
      this.#meter.cost += 1;
      return null;
    }
    const at = this.#argmin();
    if (at === this.#lo) return null;
    return this.#view(this.#lo, at);
  }

  right(): RescanningCartesianView<T> | null {
    if (this.#hi <= this.#lo) {
      this.#meter.cost += 1;
      return null;
    }
    const at = this.#argmin();
    if (at + 1 === this.#hi) return null;
    return this.#view(at + 1, this.#hi);
  }

  inOrder(): T[] {
    this.#meter.cost += this.#hi - this.#lo + 1;
    return this.#seq.slice(this.#lo, this.#hi);
  }

  /** 구간을 통째로 훑는다. 이 한 줄이 이 fixture 의 전부다. */
  #argmin(): number {
    let best = this.#lo;
    this.#meter.cost += 1;
    for (let i = this.#lo + 1; i < this.#hi; i++) {
      this.#meter.cost += 1;
      if (this.#compare(this.#seq[i] as T, this.#seq[best] as T) < 0) best = i;
    }
    return best;
  }

  #view(lo: number, hi: number): RescanningCartesianView<T> {
    const sub = new RescanningCartesianView<T>([], this.#compare);
    sub.#seq = this.#seq;
    sub.#lo = lo;
    sub.#hi = hi;
    sub.#meter = this.#meter;
    return sub;
  }
}
