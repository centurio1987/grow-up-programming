/**
 * `heap/daryHeap` 정본(규약2).
 *
 * 계약은 `../daryHeap.ts` 헤더 한 곳이고, 그 계약은 `heap/priorityQueue` 의 계약과 **같다.**
 * 스위트도 저쪽 것을 그대로 돌린다(`../daryHeap.contract.ts`).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 그 자리의
 * 원소를 견주거나 옮기면 지나간 것이고, **읽기와 쓰기를 따로 세지 않는다**
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **갈래 수가 생성자에서 빠졌다.** 물려받은 표면은 `constructor(d, compare)` 였는데, 갈래
 * 수는 담는 모양의 성질이지 계약이 관측하는 값이 아니다 — 표면에 두면 「이 구조는 자리마다
 * 자식이 여럿인 나무다」가 계약의 문장이 되고, 그 순간 배열 이진 힙도 마디를 잇는 구현도
 * 계약 위반이 된다(§규약1 「힙 여덟의 판정」 1단계, 불변 사실 47). 그래서 갈래 수는 이
 * 파일 안의 상수 하나로 내려왔다.
 *
 * **그 상수가 눈금이다(불변 사실 80).** `D` 를 2·4·8·16 으로 바꿔 네 벌을 돌리면 넣기와
 * 빼기의 절대 걸음이 서로 반대로 움직이는데(넣기가 싸지고 빼기가 비싸진다) **네 벌이 전부
 * 같은 스위트를 통과한다.** 그 교환이 상수 배수라 계약의 문장이 되지 못한다는 것의 실물이고,
 * 정본 둘을 견주는 것보다 오해할 자리가 적다 — 바뀐 것이 상수 하나뿐이기 때문이다.
 * 실측은 `daryHeap-guide.mdx` 3단계에 있다.
 */

// #region guide:core/class
/**
 * 자리 하나가 거느리는 자식 수.
 *
 * **계약에 없는 값이다.** 2 로 두면 `heap/priorityQueue` 정본과 같은 모양이 되고, 키우면
 * 나무가 얕고 넓어진다. 어느 값으로 두든 다섯 행이 전부 성립한다.
 */
const D = 4;

export class DaryHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #items: T[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    if (typeof compare !== "function") {
      throw new TypeError(
        "비교자를 주입해야 한다 — 우선순위를 정할 방법이 없다",
      );
    }
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.#items.push(item);
    this.__cost += 1;
    this.#siftUp(this.#items.length - 1);
  }

  dequeue(): T | null {
    const items = this.#items;
    this.__cost += 1;
    if (items.length === 0) return null;

    const top = items[0] as T;
    const last = items.pop() as T;
    if (items.length > 0) {
      items[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  /**
   * 위로 올린다. 층 하나를 오를 때 견주는 자리가 **부모 하나**뿐이라, 갈래를 늘릴수록
   * 층이 줄어드는 만큼 그대로 싸진다.
   */
  #siftUp(at: number): void {
    const items = this.#items;
    const moving = items[at] as T;
    while (at > 0) {
      const parent = ((at - 1) / D) | 0;
      this.__cost += 1;
      if (this.#compare(moving, items[parent] as T) >= 0) break;
      items[at] = items[parent] as T;
      at = parent;
    }
    items[at] = moving;
  }

  /**
   * 아래로 내린다. 층 하나를 내려갈 때 자식 **D 개를 전부** 견줘야 하므로, 갈래를 늘리면
   * 층이 줄어드는 이득을 자식 수가 그대로 상쇄한다. 이것이 갈래 수의 교환이다.
   */
  #siftDown(at: number): void {
    const items = this.#items;
    const size = items.length;
    const moving = items[at] as T;
    for (;;) {
      const first = at * D + 1;
      if (first >= size) break;

      const last = Math.min(first + D, size);
      let best = first;
      this.__cost += last - first;
      for (let child = first + 1; child < last; child++) {
        if (this.#compare(items[child] as T, items[best] as T) < 0)
          best = child;
      }

      if (this.#compare(items[best] as T, moving) >= 0) break;
      items[at] = items[best] as T;
      at = best;
    }
    items[at] = moving;
  }
}
// #endregion
