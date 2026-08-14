/**
 * 결함 fixture — 키를 **정렬해 두고 이분 탐색**하는 사전.
 *
 * 대상 계약: `hash/hashMapChaining`(= `hash/hashMapOpenAddressing`).
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 어기는 것은 상한이다 — 찾기가 담긴 수의 로그이고
 * 갱신 둘이 담긴 수에 비례한다. 계약이 `O(1)` 을 적은 이유가 이 설계를 배제하는 것이므로,
 * **이 fixture 는 계약이 실제로 무엇을 배제하는지의 반대편 표본**이다.
 *
 * **그런데 축3이 그 위반의 절반을 못 본다.** `get`·`has` 는 $O(\log n)$ 이라 계약의 $O(1)$ 을
 * 어기는데 실측 비율이 1.2 근처라 `O(1)` 의 허용 구간 안에 들어온다 — 사다리가 4배 간격이면
 * 로그 인수 하나가 비율을 1.2 배밖에 못 바꾸기 때문이다(불변 사실 62 · §규약2 「계약 위반을
 * 축3이 놓치는 자리가 실물로 나왔다」). 걸리는 것은 `set`·`delete` 뿐이다.
 *
 * **이 사실을 하네스 자기시험에 이름으로 적어 둔다.** 안 적으면 다음 배치가 「`get` 이
 * 통과하니 이 fixture 는 조회 계약을 지킨다」로 읽는다.
 *
 * **그리고 `set` 은 적대적 시나리오에서 통과하고 무작위 시나리오에서 걸린다.** 적대적 키
 * 묶음(`i * 65536`)이 오름차순이라 끼워 넣을 자리가 언제나 맨 뒤이고, 그러면 미는 일이 없어
 * 이분 탐색 비용만 남는다(10.0 · 12.0 · 14.0, $r$ = 1.20 · 1.17). 무작위 순서로 넣으면
 * 265.2 · 1,036.6 · 4,124.3 이다($r$ = 3.91 · 3.98). **적대적인 쪽이 늘 더 많이 잡는 것이
 * 아니다** — 두 시나리오를 둔 근거는 「적대적인 쪽이 더 잡는다」가 아니라 **둘이 다른 계열을
 * 겨눈다**이다.
 *
 * 키를 견줄 수 있어야 성립하는 설계라 `number` 키 위에서만 돈다. 계약은 그런 요구를 하지
 * 않으므로(주입 정책이 요구하는 것은 펴기 하나다) 이것도 이 설계의 한계이지 계약의 것이
 * 아니다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위).
 * 이분 탐색이 자리를 하나 들여다볼 때마다 1 이고, 끼워 넣으며 밀린 자리도 하나에 1 이다.
 */

function asNumber<K>(key: K): number {
  return key as unknown as number;
}

export class SortedKeyDictionary<K, V> {
  #keys: K[] = [];
  #values: V[] = [];

  __cost = 0;

  constructor(_spread: (key: K) => number) {}

  set(key: K, value: V): void {
    const at = this.#lowerBound(key);
    if (at < this.#keys.length && asNumber(this.#keys[at]) === asNumber(key)) {
      this.#values[at] = value;
      return;
    }
    // 끼워 넣기. 뒤가 통째로 밀리므로 담긴 수에 비례한다.
    this.__cost += this.#keys.length - at + 1;
    this.#keys.splice(at, 0, key);
    this.#values.splice(at, 0, value);
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
    this.__cost += this.#keys.length - at;
    this.#keys.splice(at, 1);
    this.#values.splice(at, 1);
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

  #seek(key: K): number {
    const at = this.#lowerBound(key);
    if (at < this.#keys.length && asNumber(this.#keys[at]) === asNumber(key)) {
      return at;
    }
    return -1;
  }

  /** 결함의 전부. 자리를 한 번에 절반씩 좁힌다 — 상수가 아니라 로그다. */
  #lowerBound(key: K): number {
    let low = 0;
    let high = this.#keys.length;
    const target = asNumber(key);
    while (low < high) {
      this.__cost += 1;
      const middle = (low + high) >>> 1;
      if (asNumber(this.#keys[middle]) < target) low = middle + 1;
      else high = middle;
    }
    this.__cost += 1;
    return low;
  }
}
