/**
 * 결함 fixture — 위치를 세는 값은 제대로 드는데 담는 모양을 스스로 고치지 않는 다중집합.
 *
 * 자리마다 부분트리의 원소 수를 들고 `rankOf`·`at` 이 그것을 읽는다. **돌려주는 값은 전부
 * 옳다** — 갈리는 것은 비용뿐이고, 담는 모양이 입력 순서를 그대로 따르기 때문이다. 무작위
 * 순서로 넣으면 기대 높이가 로그이고 오름차순으로 넣으면 사슬이 된다.
 *
 * **이 fixture 가 있는 이유는 시나리오 하나를 정당화하기 위해서다.** 위치 연산을 겨눈
 * 시나리오가 둘인데 `keyCountingMultiset` 은 둘 다에서 걸리므로, 그것만 보면 적대적인 쪽이
 * 무엇을 더 잡는지 알 수 없다. 이 구현은 **무작위로 채우는 쪽을 통과하고 오름차순으로
 * 채우는 쪽에서만 걸린다** — 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것의 실물이다
 * (불변 사실 57). 오름차순으로 채우는 갱신 행에서도 걸리는데, 그것은 균형 장치가 없는
 * 구현이 원래 그 행을 못 지키기 때문이지 이 fixture 가 겨눈 자리가 아니다.
 *
 * **되돌이 호출을 쓰지 않는다.** 사슬이 된 트리를 되돌이로 훑으면 원소 16,384 개에서 스택이
 * 먼저 죽어 판정이 나오지 않는다(실제로 그렇게 지었다가 되돌렸다). 결함은 비용이지 스택이
 * 아니므로, 재려면 깊이가 성장률로 나와야 한다.
 */

interface Node<T> {
  key: T;
  /** 이 자리를 뿌리로 하는 부분트리의 원소 수(중복 포함). */
  size: number;
  left: Node<T> | null;
  right: Node<T> | null;
}

function sizeOf<T>(node: Node<T> | null): number {
  return node === null ? 0 : node.size;
}

export class UnbalancedRankedMultiset<T> {
  #root: Node<T> | null = null;
  readonly #compareWith: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compareWith = comparator ?? defaultComparator;
  }

  add(item: T): void {
    const fresh: Node<T> = { key: item, size: 1, left: null, right: null };
    if (this.#root === null) {
      this.#root = fresh;
      return;
    }
    let node = this.#root;
    for (;;) {
      this.__cost += 1;
      node.size += 1;
      if (this.#compare(item, node.key) < 0) {
        if (node.left === null) {
          node.left = fresh;
          return;
        }
        node = node.left;
      } else {
        if (node.right === null) {
          node.right = fresh;
          return;
        }
        node = node.right;
      }
    }
  }

  delete(item: T): boolean {
    // 자리를 찾는 걸음과 크기를 깎는 걸음을 나눈다. 없는 원소를 지우려 했을 때 상태가
    // 바뀌지 않아야 하므로 찾기 전에는 아무것도 고치지 않는다.
    const path: Node<T>[] = [];
    let node = this.#root;
    while (node !== null) {
      this.__cost += 1;
      path.push(node);
      const cmp = this.#compare(item, node.key);
      if (cmp === 0) break;
      node = cmp < 0 ? node.left : node.right;
    }
    if (node === null) return false;

    // 두 자식이 다 있으면 뒤따르는 자리의 키를 옮겨 오고, 실제로 빼는 것은 그 자리다.
    if (node.left !== null && node.right !== null) {
      let successor = node.right;
      path.push(successor);
      while (successor.left !== null) {
        this.__cost += 1;
        successor = successor.left;
        path.push(successor);
      }
      node.key = successor.key;
      node = successor;
    }

    const orphan = node.left ?? node.right;
    const parent = path[path.length - 2] ?? null;
    if (parent === null) this.#root = orphan;
    else if (parent.left === node) parent.left = orphan;
    else parent.right = orphan;

    for (let i = 0; i < path.length - 1; i++) {
      (path[i] as Node<T>).size -= 1;
    }
    return true;
  }

  deleteAll(item: T): number {
    let removed = 0;
    while (this.delete(item)) removed += 1;
    return removed;
  }

  has(item: T): boolean {
    return this.count(item) > 0;
  }

  count(item: T): number {
    const upto = this.#rankBy((key) => this.#compare(key, item) <= 0);
    const before = this.#rankBy((key) => this.#compare(key, item) < 0);
    return upto - before;
  }

  rankOf(item: T): number {
    return this.#rankBy((key) => this.#compare(key, item) < 0);
  }

  at(index: number): T | null {
    if (!Number.isInteger(index)) return null;
    if (index < 0 || index >= sizeOf(this.#root)) return null;

    let node = this.#root;
    let remaining = index;
    while (node !== null) {
      this.__cost += 1;
      const leftSize = sizeOf(node.left);
      if (remaining < leftSize) {
        node = node.left;
        continue;
      }
      if (remaining === leftSize) return node.key;
      remaining -= leftSize + 1;
      node = node.right;
    }
    return null;
  }

  min(): T | null {
    let node = this.#root;
    if (node === null) return null;
    while (node.left !== null) {
      this.__cost += 1;
      node = node.left;
    }
    this.__cost += 1;
    return node.key;
  }

  max(): T | null {
    let node = this.#root;
    if (node === null) return null;
    while (node.right !== null) {
      this.__cost += 1;
      node = node.right;
    }
    this.__cost += 1;
    return node.key;
  }

  size(): number {
    this.__cost += 1;
    return sizeOf(this.#root);
  }

  toArray(): T[] {
    const out: T[] = [];
    const pending: Node<T>[] = [];
    let node = this.#root;
    while (node !== null || pending.length > 0) {
      while (node !== null) {
        this.__cost += 1;
        pending.push(node);
        node = node.left;
      }
      const top = pending.pop() as Node<T>;
      out.push(top.key);
      node = top.right;
    }
    return out;
  }

  #compare(a: T, b: T): number {
    this.__cost += 1;
    return this.#compareWith(a, b);
  }

  #rankBy(goLeft: (key: T) => boolean): number {
    let node = this.#root;
    let acc = 0;
    while (node !== null) {
      this.__cost += 1;
      if (goLeft(node.key)) {
        acc += sizeOf(node.left) + 1;
        node = node.right;
      } else {
        node = node.left;
      }
    }
    return acc;
  }
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
