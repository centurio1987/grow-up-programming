/**
 * `heap/minHeap` 정본(규약2).
 *
 * 계약은 `../minHeap.ts` 헤더 한 곳이고, 그 계약은 `heap/priorityQueue` 의 계약과 **같다.**
 * 스위트도 저쪽 것을 그대로 돌린다(`../minHeap.contract.ts`). 이 파일이 따로 있는 이유는
 * 계약이 갈려서가 아니라 **같은 계약을 다른 기법으로 지을 수 있다는 것을 보이기 위해서**다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 그 자리의
 * 원소를 견주거나 옮기면 지나간 것이고, **읽기와 쓰기를 따로 세지 않는다**
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **정본과 갈리는 자리 둘.**
 *
 * 1. **자리 번호를 1부터 쓴다.** 배열 0 번 칸을 비워 두면 부모가 `i >> 1`, 자식이 `2i`·`2i+1`
 *    이 되어 뺄셈이 사라진다. 0 번부터 쓰면 `(i-1) >> 1` 과 `2i+1`·`2i+2` 다. **둘 중 어느
 *    쪽도 계약의 문장이 아니다** — 계약은 자리 번호를 관측하지 못한다.
 * 2. **빼기가 빈자리를 잎까지 내렸다가 되올린다.** 정본은 내려가는 층마다 「자식 둘 중 나은
 *    쪽」과 「손에 든 원소」를 함께 견주고 제자리를 찾으면 멈춘다. 여기서는 **자식끼리만**
 *    견주며 잎까지 내려간 뒤, 마지막 원소를 그 자리에 놓고 위로 되올린다. 견주는 횟수는
 *    층당 둘에서 하나로 줄고 **지나가는 자리는 늘어난다.** 그 교환이 상수 배수라 축3은
 *    둘을 가르지 않는다(불변 사실 6).
 *
 * **「최소」는 이 파일의 성질이 아니다.** 어느 원소가 먼저 나오는지는 생성자가 받은 비교자가
 * 정하고, 뒤집어 주입하면 같은 코드가 최대를 먼저 내놓는다. 이름이 계약을 정하지 않는다는
 * 것의 가장 짧은 실물이 `heap/maxHeap` 과의 관계다.
 */

// #region guide:core/class
export class MinHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 자리 번호를 1 부터 쓴다. 0 번 칸은 자리표시자이고 원소가 아니다. */
  #items: (T | undefined)[] = [undefined];

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
    this.#raise(this.#items.length - 1, item);
  }

  dequeue(): T | null {
    const items = this.#items;
    this.__cost += 1;
    if (items.length <= 1) return null;

    const top = items[1] as T;
    const last = items.pop() as T;
    if (items.length > 1) this.#refill(last);
    return top;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#items.length <= 1 ? null : (this.#items[1] as T);
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length - 1;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length <= 1;
  }

  /** `at` 의 빈자리에 `moving` 을 넣을 수 있을 때까지 부모를 끌어내린다. */
  #raise(at: number, moving: T): void {
    const items = this.#items;
    while (at > 1) {
      const parent = at >> 1;
      this.__cost += 1;
      if (this.#compare(moving, items[parent] as T) >= 0) break;
      items[at] = items[parent] as T;
      at = parent;
    }
    items[at] = moving;
  }

  /**
   * 뿌리에 생긴 빈자리를 **잎까지** 내린 뒤 `last` 를 놓고 되올린다.
   *
   * 내려가는 동안은 자식끼리만 견준다 — 손에 든 원소와 견주지 않으므로 층마다 비교가
   * 하나다. 잎에 닿은 뒤 `#raise` 가 제자리를 찾아 주는데, 마지막 원소는 대개 큰 쪽이라
   * 그 되올리기가 몇 층 안에 끝난다.
   */
  #refill(last: T): void {
    const items = this.#items;
    const size = items.length;
    let hole = 1;

    for (;;) {
      let child = hole * 2;
      if (child >= size) break;
      const right = child + 1;
      this.__cost += right < size ? 2 : 1;
      if (
        right < size &&
        this.#compare(items[right] as T, items[child] as T) < 0
      ) {
        child = right;
      }
      items[hole] = items[child] as T;
      hole = child;
    }

    this.#raise(hole, last);
  }
}
// #endregion
