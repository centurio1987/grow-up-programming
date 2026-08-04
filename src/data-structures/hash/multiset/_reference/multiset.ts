/**
 * `hash/multiset` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../multiset.ts` 헤더 한 곳이다(규약1). 이 파일이
 * 지는 의무는 그 계약을 실제로 지키는 것과 축3이 읽을 `__cost` 를 노출하는 것이다.
 *
 * `__cost` 가 세는 것: **노드 방문 1회당 1, 비교자 호출 1회당 1.** 이 구조는 비교자를
 * 주입받으므로 하네스가 비교자 호출 횟수를 **밖에서** 셀 수 있다. §규약2는 자기 보고가
 * 그 외부 계수보다 작으면 실패시킨다 — 이 파일이 비교를 빠뜨리고 세면 거기서 걸린다.
 *
 * 이 구현이 무엇인지는 계약의 일부가 아니다. 계약이 `expected O(log n)` 을 요구하므로
 * 그것을 만족하는 아무 구현이나 여기 올 수 있고, 바뀌어도 `../multiset.ts` 는 그대로다.
 */

type Comparator<T> = (a: T, b: T) => number;

interface Node<T> {
  key: T;
  prio: number;
  /** 부분 트리의 원소 수(중복 포함). `count` 를 다중도에 무관한 비용으로 답하는 근거다. */
  size: number;
  left: Node<T> | null;
  right: Node<T> | null;
}

function sizeOf<T>(node: Node<T> | null): number {
  return node === null ? 0 : node.size;
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export class Multiset<T> {
  #root: Node<T> | null = null;
  #compareWith: Comparator<T>;
  #seq = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compareWith = comparator ?? defaultComparator;
  }

  add(item: T): void {
    const [left, right] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) <= 0,
    );
    const node: Node<T> = {
      key: item,
      prio: this.#nextPrio(),
      size: 1,
      left: null,
      right: null,
    };
    this.#root = this.#merge(this.#merge(left, node), right);
  }

  delete(item: T): boolean {
    const [left, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, right] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );
    if (equal === null) {
      this.#root = this.#merge(left, right);
      return false;
    }
    const remainder = this.#merge(equal.left, equal.right);
    this.#root = this.#merge(this.#merge(left, remainder), right);
    return true;
  }

  deleteAll(item: T): number {
    const [left, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, right] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );
    const removed = sizeOf(equal);
    this.#root = this.#merge(left, right);
    return removed;
  }

  has(item: T): boolean {
    return this.count(item) > 0;
  }

  count(item: T): number {
    const upto = this.#rank((key) => this.#compare(key, item) <= 0);
    const before = this.#rank((key) => this.#compare(key, item) < 0);
    return upto - before;
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
        pending.push(node);
        node = node.left;
      }
      const top = pending.pop() as Node<T>;
      this.__cost += 1;
      out.push(top.key);
      node = top.right;
    }
    return out;
  }

  #compare(a: T, b: T): number {
    this.__cost += 1;
    return this.#compareWith(a, b);
  }

  /**
   * `goLeft` 가 참인 키 전부를 왼쪽으로 가른다. `goLeft` 는 정렬 순서에 대해 단조여야 한다
   * — 앞쪽 구간에서만 참이어야 갈라진 두 조각이 각각 정렬 상태를 유지한다.
   */
  #split(
    node: Node<T> | null,
    goLeft: (key: T) => boolean,
  ): [Node<T> | null, Node<T> | null] {
    if (node === null) return [null, null];
    this.__cost += 1;
    if (goLeft(node.key)) {
      const [inner, right] = this.#split(node.right, goLeft);
      node.right = inner;
      this.#pull(node);
      return [node, right];
    }
    const [left, inner] = this.#split(node.left, goLeft);
    node.left = inner;
    this.#pull(node);
    return [left, node];
  }

  /** `a` 의 모든 키가 `b` 의 모든 키보다 앞선다는 전제에서 둘을 잇는다. */
  #merge(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;
    this.__cost += 1;
    if (a.prio > b.prio) {
      a.right = this.#merge(a.right, b);
      this.#pull(a);
      return a;
    }
    b.left = this.#merge(a, b.left);
    this.#pull(b);
    return b;
  }

  /** `goLeft` 를 만족하는 키의 개수. 부분 트리 크기를 더해 가므로 다중도에 비례하지 않는다. */
  #rank(goLeft: (key: T) => boolean): number {
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

  #pull(node: Node<T>): void {
    node.size = 1 + sizeOf(node.left) + sizeOf(node.right);
  }

  /**
   * 삽입 순서 카운터를 섞어 우선순위를 만든다.
   *
   * 난수원을 쓰지 않는 이유는 재현성이다 — 축3이 seed 를 고정해 실패를 재현하는데,
   * 구현이 따로 난수를 쓰면 그 재현이 깨진다. 섞기(murmur3 finalizer)는 삽입 순서와
   * 키 순서 사이의 상관을 없애므로 정렬된 입력에도 기대 높이가 유지된다.
   */
  #nextPrio(): number {
    this.#seq = (this.#seq + 1) >>> 0;
    let x = this.#seq;
    x ^= x >>> 16;
    x = Math.imul(x, 0x85ebca6b) >>> 0;
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
  }
}
