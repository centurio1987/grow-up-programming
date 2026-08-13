/**
 * 결함 fixture — 양 끝을 필드에 캐시해 두고 지울 때 갱신하지 않는 집합.
 *
 * `tree/binarySearchTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(n)`)에 대한 결함이다.
 * **축2 하나만이 잡는다** — 축1도 축3도 통과시킨다.
 *
 * 이 fixture 가 있는 이유는 그 계약의 등급이 `invariant` 이기 때문이다. 상한이 선형이라
 * 축3이 걸러 낼 것이 거의 없고, 계약이 실제로 배제하는 것은 **두 관측 경로가 갈리는
 * 구현**이다. 여기서 갈리는 것은 셋째 불변식이다 — `min()`·`max()` 는 캐시를 읽고
 * `toArray()` 는 트리를 훑으므로, 캐시가 낡으면 같은 상태를 다르게 읽는다.
 *
 * **각 연산은 자기 자리에서 옳다.** `insert` 는 캐시를 제대로 넓히고, `delete` 는 담긴
 * 원소를 정확히 지운다. 지운 값이 하필 양 끝이었을 때만 캐시가 뒤처지고, 그 순간을 보는
 * 것은 어느 한 연산의 반환값이 아니라 **두 연산의 대조**뿐이다(§규약1 「불변식 판별 절차」).
 *
 * **담는 모양은 그 계약의 정본과 같다.** 축3이 정본과 같은 값을 내야 「잡은 것이 축2」라고
 * 말할 수 있기 때문이다 — 정렬 배열로 지으면 성장 계급이 갈려서 축3이 먼저 걸리고, 그것은
 * 이 결함과 아무 상관이 없다.
 */
type Node<T> = {
  key: T;
  left: Node<T> | null;
  right: Node<T> | null;
};

export class StaleEndCacheSet<T> {
  #root: Node<T> | null = null;
  #count = 0;
  #min: T | null = null;
  #max: T | null = null;
  readonly #compare: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    if (this.#root === null) {
      this.__cost += 1;
      this.#root = { key: item, left: null, right: null };
      this.#count += 1;
      this.#min = item;
      this.#max = item;
      return;
    }

    let at = this.#root;
    for (;;) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) return;

      if (cmp < 0) {
        if (at.left === null) {
          at.left = { key: item, left: null, right: null };
          this.#count += 1;
          break;
        }
        at = at.left;
      } else {
        if (at.right === null) {
          at.right = { key: item, left: null, right: null };
          this.#count += 1;
          break;
        }
        at = at.right;
      }
    }

    if (this.#min === null || this.#compare(item, this.#min) < 0)
      this.#min = item;
    if (this.#max === null || this.#compare(item, this.#max) > 0)
      this.#max = item;
  }

  delete(item: T): boolean {
    let parent: Node<T> | null = null;
    let at = this.#root;

    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) break;
      parent = at;
      at = cmp < 0 ? at.left : at.right;
    }
    if (at === null) return false;

    if (at.left !== null && at.right !== null) {
      let successorParent = at;
      let successor = at.right;
      while (successor.left !== null) {
        this.__cost += 1;
        successorParent = successor;
        successor = successor.left;
      }
      at.key = successor.key;
      parent = successorParent;
      at = successor;
    }

    const child = at.left ?? at.right;
    if (parent === null) this.#root = child;
    else if (parent.left === at) parent.left = child;
    else parent.right = child;

    this.#count -= 1;
    // 여기가 결함이다 — 지운 값이 양 끝이었으면 캐시가 낡는다.
    if (this.#count === 0) {
      this.#min = null;
      this.#max = null;
    }
    return true;
  }

  has(item: T): boolean {
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) return true;
      at = cmp < 0 ? at.left : at.right;
    }
    return false;
  }

  min(): T | null {
    this.__cost += 1;
    return this.#min;
  }

  max(): T | null {
    this.__cost += 1;
    return this.#max;
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;

    const stack: Node<T>[] = [];
    let at: Node<T> | null = this.#root;

    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        if (this.#compare(at.key, low) < 0) {
          at = at.right;
          continue;
        }
        stack.push(at);
        at = at.left;
      }
      if (stack.length === 0) break;
      const node = stack.pop() as Node<T>;
      if (this.#compare(node.key, high) > 0) break;
      out.push(node.key);
      at = node.right;
    }

    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    const out: T[] = [];
    const stack: Node<T>[] = [];
    let at: Node<T> | null = this.#root;

    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        stack.push(at);
        at = at.left;
      }
      const node = stack.pop() as Node<T>;
      out.push(node.key);
      at = node.right;
    }

    return out;
  }
}
