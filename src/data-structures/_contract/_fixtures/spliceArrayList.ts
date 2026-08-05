/**
 * 결함 fixture — `linear/unrolledLinkedList` 계약을 배열 하나로 만족시키려는 구현.
 *
 * 이 fixture 가 있는 이유는 위 `fixedChunkList` 와 **반대쪽에서 걸리기 때문이다.**
 * 위치 읽기는 상수라 오히려 정본보다 빠르고, 무너지는 자리는 위치 삽입·제거 하나뿐이다 —
 * 끼우거나 뺀 자리 뒤가 전부 밀린다.
 *
 * 이 구현이 계약의 **연산 집합을 가르는 자리**다. 뒤 끝의 넣고 빼기와 위치 읽기만 있는
 * 계약이었다면 이 배열이 전 행을 통과하고 그것도 더 빠르게 통과한다. 위치 삽입·제거가
 * 계약에 있어야만 배제된다.
 */
export class SpliceArrayList<T> {
  #items: T[] = [];

  __cost = 0;

  push(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  pop(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items.pop() as T;
  }

  get(index: number): T | null {
    this.__cost += 1;
    if (index < 0 || index >= this.#items.length) return null;
    return this.#items[index] as T;
  }

  insert(index: number, item: T): void {
    if (index < 0 || index > this.#items.length) return;
    this.__cost += this.#items.length - index + 1;
    this.#items.splice(index, 0, item);
  }

  remove(index: number): T | null {
    if (index < 0 || index >= this.#items.length) return null;
    this.__cost += this.#items.length - index;
    return this.#items.splice(index, 1)[0] as T;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  toArray(): T[] {
    this.__cost += this.#items.length;
    return [...this.#items];
  }
}
