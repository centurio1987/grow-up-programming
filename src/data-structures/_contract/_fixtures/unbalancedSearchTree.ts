/**
 * 결함 fixture — 균형을 스스로 잡지 않는 이진 탐색 트리.
 *
 * `tree/redBlackTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(log n)`)에 대한 결함이다.
 * **동작은 옳다** — 축1·축2는 전부 통과하고 축3만이 잡는다.
 *
 * 걸리는 자리는 **오름차순 넣기** 하나다. 넣는 값이 늘 앞선 값보다 크면 트리가 오른쪽
 * 사슬이 되어 넣기 하나가 원소 수에 비례한다. 같은 구현이 무작위 넣기에서는 기대 깊이가
 * 로그라 통과한다 — 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것의 사례다.
 */
type Node<T> = {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
};

export class UnbalancedSearchTree<T> {
  #root: Node<T> | null = null;
  #count = 0;
  readonly #compare: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    if (this.#root === null) {
      this.__cost += 1;
      this.#root = { value: item, left: null, right: null };
      this.#count += 1;
      return;
    }
    let at = this.#root;
    for (;;) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return;
      if (cmp < 0) {
        if (at.left === null) {
          at.left = { value: item, left: null, right: null };
          this.#count += 1;
          return;
        }
        at = at.left;
      } else {
        if (at.right === null) {
          at.right = { value: item, left: null, right: null };
          this.#count += 1;
          return;
        }
        at = at.right;
      }
    }
  }

  delete(item: T): boolean {
    const before = this.#count;
    this.#root = this.#remove(this.#root, item);
    return this.#count < before;
  }

  has(item: T): boolean {
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return true;
      at = cmp < 0 ? at.left : at.right;
    }
    return false;
  }

  min(): T | null {
    if (this.#root === null) return null;
    let at = this.#root;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at.value;
  }

  max(): T | null {
    if (this.#root === null) return null;
    let at = this.#root;
    while (at.right !== null) {
      this.__cost += 1;
      at = at.right;
    }
    this.__cost += 1;
    return at.value;
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#collect(this.#root, low, high, out);
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#inOrder(this.#root, out);
    return out;
  }

  #remove(node: Node<T> | null, item: T): Node<T> | null {
    if (node === null) return null;
    this.__cost += 1;
    const cmp = this.#compare(item, node.value);
    if (cmp < 0) {
      node.left = this.#remove(node.left, item);
      return node;
    }
    if (cmp > 0) {
      node.right = this.#remove(node.right, item);
      return node;
    }
    this.#count -= 1;
    if (node.left === null) return node.right;
    if (node.right === null) return node.left;
    let successor = node.right;
    while (successor.left !== null) {
      this.__cost += 1;
      successor = successor.left;
    }
    node.value = successor.value;
    this.#count += 1; // 아래 재귀가 다시 하나 뺀다.
    node.right = this.#remove(node.right, successor.value);
    return node;
  }

  #collect(node: Node<T> | null, low: T, high: T, out: T[]): void {
    if (node === null) return;
    this.__cost += 1;
    const vsLow = this.#compare(node.value, low);
    const vsHigh = this.#compare(node.value, high);
    if (vsLow > 0) this.#collect(node.left, low, high, out);
    if (vsLow >= 0 && vsHigh <= 0) out.push(node.value);
    if (vsHigh < 0) this.#collect(node.right, low, high, out);
  }

  #inOrder(node: Node<T> | null, out: T[]): void {
    if (node === null) return;
    this.__cost += 1;
    this.#inOrder(node.left, out);
    out.push(node.value);
    this.#inOrder(node.right, out);
  }
}
