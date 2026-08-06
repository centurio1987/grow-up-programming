/**
 * 결함 fixture — 조회할 때마다 찾은 자리를 뿌리로 끌어올리는 탐색 트리(스플레이).
 *
 * `tree/redBlackTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(log n)`)에 대한 결함이다.
 * **동작은 옳다** — 축1·축2는 전부 통과하고 축3만이 잡는다.
 *
 * **이 fixture 가 있는 이유는 다른 둘과 다르다.** 앞의 둘(균형 없는 트리·정렬 배열)은
 * 계약의 **상한**을 어긴다. 이쪽은 상한을 어기지 않는다 — 이 구현은 로그를 지킨다.
 * 어기는 것은 **한정자**다. 호출을 모아 평균 내면 로그인데, 호출 하나하나가 로그 안에
 * 든다는 것은 약속하지 못한다.
 *
 * 그래서 이 fixture 는 **`worst` 통계로 재는 시나리오에서만** 걸린다. 무작위 조회로
 * 재면 통과한다 — 그 자리에서는 단일 호출도 로그 근처에 머물기 때문이다. 걸리려면
 * **트리가 사슬인 채로 맞는 첫 조회**가 있어야 한다 — 오름차순으로 채운 뒤 순차 조회가
 * 그 입력이고, 사슬의 맨 끝을 찾는 그 한 번이 $\Theta(n)$ 이다. 끌어올리기가 트리를
 * 곧바로 납작하게 만들므로 뒤 걸음은 급격히 싸지고(n=1024 에서 1540 → 776 → 397 → 203),
 * **`worst` 가 보고하는 최댓값은 첫 걸음의 것**이다. 상각으로 보면 그 하나가 평균에
 * 묻히는 것이 이 갈림의 전부다(불변 사실 63, §규약1 「한정자가 계약을 가른다」).
 *
 * 이 구현이 실제로 만족하는 계약은 `tree/splayTree` 의 것이고, 그것은 다른 구조다.
 */
type Node<T> = {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
  parent: Node<T> | null;
};

export class SplayingSearchTree<T> {
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
      this.#root = { value: item, left: null, right: null, parent: null };
      this.#count += 1;
      return;
    }
    let at: Node<T> = this.#root;
    for (;;) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) {
        this.#splay(at);
        return;
      }
      const next = cmp < 0 ? at.left : at.right;
      if (next === null) {
        const fresh: Node<T> = {
          value: item,
          left: null,
          right: null,
          parent: at,
        };
        if (cmp < 0) at.left = fresh;
        else at.right = fresh;
        this.#count += 1;
        this.#splay(fresh);
        return;
      }
      at = next;
    }
  }

  delete(item: T): boolean {
    const found = this.#locate(item);
    if (found === null) return false;
    this.#splay(found);

    const left = found.left;
    const right = found.right;
    if (left !== null) left.parent = null;
    if (right !== null) right.parent = null;

    if (left === null) {
      this.#root = right;
    } else {
      this.#root = left;
      let rightmost = left;
      while (rightmost.right !== null) {
        this.__cost += 1;
        rightmost = rightmost.right;
      }
      this.#splay(rightmost);
      rightmost.right = right;
      if (right !== null) right.parent = rightmost;
    }
    this.#count -= 1;
    return true;
  }

  has(item: T): boolean {
    const found = this.#locate(item);
    if (found === null) return false;
    this.#splay(found);
    return true;
  }

  min(): T | null {
    if (this.#root === null) return null;
    let at = this.#root;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    this.#splay(at);
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
    this.#splay(at);
    return at.value;
  }

  /**
   * 구간 훑기는 **가지치기해서** 내려간다.
   *
   * 앞에서부터 전부 훑고 걸러 내면 이 fixture 가 `range` 시나리오에서도 걸리는데, 그것은
   * 한정자와 무관한 다른 결함이다. 이 fixture 가 보이려는 것은 **한정자 하나**이므로
   * 나머지 행은 계약 안에 두었다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    const pending: Node<T>[] = [];
    let at = this.#root;
    while (at !== null || pending.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        // 지금 값이 구간 아래면 왼쪽에 담을 것이 없다.
        if (this.#compare(at.value, low) < 0) {
          at = at.right;
          continue;
        }
        pending.push(at);
        at = at.left;
      }
      // 가지치기로 오른쪽만 타고 내려가다 끝나면 쌓아 둔 자리가 없다.
      if (pending.length === 0) break;
      const node = pending.pop() as Node<T>;
      if (this.#compare(node.value, high) > 0) break;
      out.push(node.value);
      at = node.right;
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    return [...this.#walk()];
  }

  /** 사슬이 길어질 수 있으므로 되돌이 호출 대신 자리 무더기로 훑는다. */
  *#walk(): Generator<T> {
    const pending: Node<T>[] = [];
    let at = this.#root;
    while (at !== null || pending.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        pending.push(at);
        at = at.left;
      }
      const node = pending.pop() as Node<T>;
      yield node.value;
      at = node.right;
    }
  }

  #locate(item: T): Node<T> | null {
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return at;
      at = cmp < 0 ? at.left : at.right;
    }
    return null;
  }

  #splay(node: Node<T>): void {
    while (node.parent !== null) {
      this.__cost += 1;
      const parent = node.parent;
      const grand = parent.parent;
      if (grand === null) {
        this.#rotate(node);
      } else if ((node === parent.left) === (parent === grand.left)) {
        this.#rotate(parent);
        this.#rotate(node);
      } else {
        this.#rotate(node);
        this.#rotate(node);
      }
    }
    this.#root = node;
  }

  /** `node` 를 부모 위로 올린다. */
  #rotate(node: Node<T>): void {
    const parent = node.parent;
    if (parent === null) return;
    const grand = parent.parent;

    if (node === parent.left) {
      parent.left = node.right;
      if (node.right !== null) node.right.parent = parent;
      node.right = parent;
    } else {
      parent.right = node.left;
      if (node.left !== null) node.left.parent = parent;
      node.left = parent;
    }
    parent.parent = node;
    node.parent = grand;
    if (grand !== null) {
      if (grand.left === parent) grand.left = node;
      else grand.right = node;
    } else {
      this.#root = node;
    }
  }
}
