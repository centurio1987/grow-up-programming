/**
 * 결함 fixture — 키와 값을 **차례로 담고 훑는** 사전.
 *
 * 대상 계약: `hash/hashMapChaining`(= `hash/hashMapOpenAddressing`).
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 어기는 것은 상한이다 — 네 연산이 담긴 수에
 * 비례한다. 계약을 모르는 사람이 사전을 지으라는 요구를 받았을 때 가장 먼저 떠올리는
 * 설계이고, 이 계약이 무엇을 배제하려 하는지를 가장 단순하게 보인다.
 *
 * **주입된 펴기를 한 번도 부르지 않는다.** 자리를 정하지 않으니 부를 데가 없다. 계약의
 * 주입 정책이 「무엇을 주입받는가」뿐 아니라 「그것이 없으면 무엇이 성립하지 않는가」를
 * 적어야 하는 이유가 여기 있다 — 펴기를 안 쓰는 구현도 계약의 **의미** 행은 전부 지킨다.
 *
 * 걸리는 자리와 통과하는 자리가 갈린다. `set`·`get`·`has`·`delete` 는 무작위 키와 적대적
 * 키 양쪽에서 걸리고, `size`·`keys`·`values` 는 **통과한다** — 그 세 행은 이 설계가 오히려
 * 자연스럽게 지킨다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위).
 */

export class ScanningDictionary<K, V> {
  #keys: K[] = [];
  #values: V[] = [];

  __cost = 0;

  constructor(_spread: (key: K) => number) {}

  set(key: K, value: V): void {
    const at = this.#seek(key);
    if (at >= 0) {
      this.#values[at] = value;
      return;
    }
    this.#keys.push(key);
    this.#values.push(value);
    this.__cost += 1;
  }

  get(key: K): V | null {
    const at = this.#seek(key);
    return at < 0 ? null : (this.#values[at] as V);
  }

  has(key: K): boolean {
    return this.#seek(key) >= 0;
  }

  delete(key: K): boolean {
    const at = this.#seek(key);
    if (at < 0) return false;
    // 뒤엣것을 끌어와 덮는다. 순서는 계약이 정하지 않으므로 앞으로 당길 이유가 없다.
    this.#keys[at] = this.#keys[this.#keys.length - 1] as K;
    this.#values[at] = this.#values[this.#values.length - 1] as V;
    this.#keys.pop();
    this.#values.pop();
    this.__cost += 1;
    return true;
  }

  size(): number {
    this.__cost += 1;
    return this.#keys.length;
  }

  keys(): K[] {
    this.__cost += this.#keys.length;
    return [...this.#keys];
  }

  values(): V[] {
    this.__cost += this.#values.length;
    return [...this.#values];
  }

  /** 결함의 전부. 담긴 것을 앞에서부터 견준다. */
  #seek(key: K): number {
    const at = this.#keys.indexOf(key);
    this.__cost += at < 0 ? this.#keys.length : at + 1;
    return at;
  }
}
