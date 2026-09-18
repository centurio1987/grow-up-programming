/**
 * `heap/priorityQueue` 정본(규약2).
 *
 * 계약은 `../priorityQueue.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 같은 계약을 마디로 이어 담는
 * 구현도(`heap/maxHeap`), 갈래를 넷으로 늘린 구현도(`heap/daryHeap`), 빈자리를 잎까지
 * 내렸다 되올리는 구현도(`heap/minHeap`) 다섯 행을 전부 지킨다. 이 파일이 정본인 것은
 * 계약이 고른 계급을 가장 단순하게 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 그 자리의
 * 원소를 견주거나 옮기면 지나간 것이고, **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대
 * 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **완전 이진 트리를 배열 한 줄에 접어 담는 것이 이 구현의 전부다.** 자리 `i` 의 부모가
 * `(i-1)>>1`, 자식이 `2i+1`·`2i+2` 이므로 참조를 하나도 두지 않고 트리를 항해한다. 넣기는
 * 끝에 붙였다가 부모보다 앞서는 동안 올리고, 빼기는 뿌리를 들어내고 마지막 원소를 그 자리에
 * 놓았다가 자식보다 뒤서는 동안 내린다.
 *
 * **값을 바꿔 넣지 않고 자리를 밀어 옮긴다.** `#siftUp`·`#siftDown` 은 옮길 원소를 손에
 * 들고 빈자리만 이동시킨 뒤 마지막에 한 번 놓는다. 서로 바꾸기를 되풀이하면 같은 원소를
 * 층마다 두 번씩 쓰게 되는데, 결과가 같으므로 계약이 둘을 가르지 않는다 — 갈리는 것은
 * 상수 배수뿐이고 축3은 그것을 보지 않는다(불변 사실 6).
 *
 * **이 정본이 드는 내부 불변량은 계약에 없다.** 「부모가 자식보다 비교자 앞선다」와 「원소가
 * 배열 앞쪽 `size` 칸에 빈틈없이 들어찬다」 둘인데, 계약은 담는 모양을 관측하지 못하므로
 * 네 축 중 어느 것도 이 둘을 이름으로 검사하지 않는다(불변 사실 109). 어긋나면 답이
 * 틀리므로 축1이 값에서 잡는다.
 */

// #region guide:core/class
export class PriorityQueue<T> {
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

  /** 빈자리를 위로 옮기며 `at` 에 있던 원소가 설 자리를 찾는다. */
  #siftUp(at: number): void {
    const items = this.#items;
    const moving = items[at] as T;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      this.__cost += 1;
      if (this.#compare(moving, items[parent] as T) >= 0) break;
      items[at] = items[parent] as T;
      at = parent;
    }
    items[at] = moving;
  }

  /** 빈자리를 아래로 옮기며 `at` 에 있던 원소가 설 자리를 찾는다. */
  #siftDown(at: number): void {
    const items = this.#items;
    const size = items.length;
    const moving = items[at] as T;
    for (;;) {
      let child = at * 2 + 1;
      if (child >= size) break;

      // 두 자식 중 비교자가 앞세우는 쪽을 고른다. 오른쪽이 없으면 왼쪽뿐이다.
      const right = child + 1;
      this.__cost += right < size ? 2 : 1;
      if (
        right < size &&
        this.#compare(items[right] as T, items[child] as T) < 0
      ) {
        child = right;
      }

      if (this.#compare(items[child] as T, moving) >= 0) break;
      items[at] = items[child] as T;
      at = child;
    }
    items[at] = moving;
  }
}
// #endregion
