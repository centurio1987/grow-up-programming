/**
 * 결함 fixture — 크기를 세어 두지 않고 물어볼 때마다 훑어 세는 집합.
 *
 * `tree/binarySearchTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(n)`)에 대한 결함이다.
 * **동작은 옳다** — 축1·축2는 전부 통과하고 **축3의 `size` 행 하나만이 잡는다.**
 *
 * 그 계약에서 `size` 는 여덟 행 중 유일하게 O(1) 이다. 나머지 일곱은 상한이 이미 선형이라
 * 훑어도 계약 안이지만 이 행만은 아니고, 그래서 **이 fixture 가 걸리는 자리가 정확히
 * 한 곳이다.** 나란한 넷의 계약에서라면 담기·지우기·찾기가 먼저 걸려 이 자리가 묻힌다.
 *
 * **담는 모양은 그 계약의 정본과 같다.** 세는 방식만 결함이라는 것을 축3의 나머지 행이
 * 정본과 같은 값을 내는 것으로 보인다.
 */
type Node<T> = {
  key: T;
  left: Node<T> | null;
  right: Node<T> | null;
};

export class RecountingSizeSet<T> {
  #root: Node<T> | null = null;
  readonly #compare: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    if (this.#root === null) {
      this.__cost += 1;
      this.#root = { key: item, left: null, right: null };
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
          return;
        }
        at = at.left;
      } else {
        if (at.right === null) {
          at.right = { key: item, left: null, right: null };
          return;
        }
        at = at.right;
      }
    }
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
    let at = this.#root;
    if (at === null) return null;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at.key;
  }

  max(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.right !== null) {
      this.__cost += 1;
      at = at.right;
    }
    this.__cost += 1;
    return at.key;
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

  /** 여기가 결함이다 — 세어 둔 수가 없어 매번 트리를 훑는다. */
  size(): number {
    let counted = 0;
    const stack: Node<T>[] = [];
    let at: Node<T> | null = this.#root;

    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        stack.push(at);
        at = at.left;
      }
      const node = stack.pop() as Node<T>;
      counted += 1;
      at = node.right;
    }

    return counted;
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
