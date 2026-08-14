/**
 * 결함 fixture — 서로 다른 키만 담고 키마다 다중도를 정수로 든 다중집합.
 *
 * **이 구현은 `tree/multiset` 계약을 전부 만족하고 `tree/orderStatisticTree` 계약의 두 행만
 * 어긴다.** 두 계약의 포섭이 진짜 포섭이라는 것(담기는 쪽을 만족하면서 담는 쪽을 못
 * 만족하는 구현이 실재한다는 것)의 실물이고, 그 판정이 논증으로만 있던 자리에 붙는 수치가
 * 이 파일이다(§처분 결정 「`tree/multiset` 과 `tree/orderStatisticTree` — 합치지 않는다」의
 * 근거 둘).
 *
 * 담는 모양은 무작위 우선순위를 쓰는 이진 탐색 트리이고 자리마다 같은 키의 벌 수를 든다.
 * 그래서 담기·지우기·다중도 조회·양 끝은 **서로 다른 키의 수**의 로그에 끝나고, 서로 다른
 * 키의 수는 원소 수 이하이므로 `tree/multiset` 의 아홉 행을 전부 지킨다.
 *
 * **위치 연산 둘만 다르다.** 자리마다 부분트리의 원소 수를 들지 않으므로 순위를 물으면 앞선
 * 키를 차례로 훑어 벌 수를 더해야 하고, 위치를 물으면 같은 훑기를 반대 방향으로 해야 한다.
 * 비용이 서로 다른 키의 수에 비례한다 — 그 수가 원소 수에 비례하는 입력에서 두 행이 걸린다.
 *
 * **결함은 다중도를 정수로 든 것이 아니다.** 다중도를 그렇게 들면서 **위치를 세는 값을 함께
 * 드는** 구현도 있고 그것은 두 계약을 다 지킨다. 결함은 위치를 세는 값을 안 든 것이다.
 *
 * 우선순위를 `Math.random()` 으로 뽑는 것은 정본과 같다. 결정론적 함수로 만들면 그 함수를
 * 역산한 입력에서 사슬이 되어(불변 사실 104) **담기는 쪽 계약도 어기게 되고**, 그러면 이
 * fixture 가 보이려는 「한쪽만 어긴다」가 흐려진다.
 */

interface Node<T> {
  key: T;
  prio: number;
  /** 이 키와 동등한 원소의 벌 수. */
  count: number;
  left: Node<T> | null;
  right: Node<T> | null;
}

export class KeyCountingMultiset<T> {
  #root: Node<T> | null = null;
  readonly #compareWith: (a: T, b: T) => number;
  /** 중복을 포함한 총 원소 수. `size` 를 O(1) 로 답하는 근거다. */
  #total = 0;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compareWith = comparator ?? defaultComparator;
  }

  add(item: T): void {
    const found = this.#find(item);
    if (found !== null) {
      found.count += 1;
      this.#total += 1;
      return;
    }
    const [below, above] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const fresh: Node<T> = {
      key: item,
      prio: Math.random(),
      count: 1,
      left: null,
      right: null,
    };
    this.#root = this.#merge(this.#merge(below, fresh), above);
    this.#total += 1;
  }

  delete(item: T): boolean {
    const found = this.#find(item);
    if (found === null) return false;
    this.#total -= 1;
    if (found.count > 1) {
      found.count -= 1;
      return true;
    }
    this.#dropKey(item);
    return true;
  }

  deleteAll(item: T): number {
    const found = this.#find(item);
    if (found === null) return 0;
    const removed = found.count;
    this.#total -= removed;
    this.#dropKey(item);
    return removed;
  }

  has(item: T): boolean {
    return this.#find(item) !== null;
  }

  count(item: T): number {
    return this.#find(item)?.count ?? 0;
  }

  /** **결함 자리 ①.** 앞선 키를 하나씩 훑어 벌 수를 더한다. */
  rankOf(item: T): number {
    let acc = 0;
    const pending: Node<T>[] = [];
    let node = this.#root;
    while (node !== null || pending.length > 0) {
      while (node !== null) {
        this.__cost += 1;
        pending.push(node);
        node = node.left;
      }
      const top = pending.pop() as Node<T>;
      if (this.#compare(top.key, item) >= 0) return acc;
      acc += top.count;
      node = top.right;
    }
    return acc;
  }

  /** **결함 자리 ②.** 같은 훑기를 벌 수만큼 빼 가며 한다. */
  at(index: number): T | null {
    if (!Number.isInteger(index)) return null;
    if (index < 0 || index >= this.#total) return null;

    let remaining = index;
    const pending: Node<T>[] = [];
    let node = this.#root;
    while (node !== null || pending.length > 0) {
      while (node !== null) {
        this.__cost += 1;
        pending.push(node);
        node = node.left;
      }
      const top = pending.pop() as Node<T>;
      if (remaining < top.count) return top.key;
      remaining -= top.count;
      node = top.right;
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
    return this.#total;
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
      for (let i = 0; i < top.count; i++) out.push(top.key);
      node = top.right;
    }
    return out;
  }

  #compare(a: T, b: T): number {
    this.__cost += 1;
    return this.#compareWith(a, b);
  }

  #find(item: T): Node<T> | null {
    let node = this.#root;
    while (node !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, node.key);
      if (cmp === 0) return node;
      node = cmp < 0 ? node.left : node.right;
    }
    return null;
  }

  /** 키 하나를 통째로 뺀다. 갈랐다 잇는 것으로 자리 하나가 사라진다. */
  #dropKey(item: T): void {
    const [below, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [, above] = this.#split(rest, (key) => this.#compare(key, item) <= 0);
    this.#root = this.#merge(below, above);
  }

  #split(
    node: Node<T> | null,
    goLeft: (key: T) => boolean,
  ): [Node<T> | null, Node<T> | null] {
    if (node === null) return [null, null];
    this.__cost += 1;
    if (goLeft(node.key)) {
      const [inner, right] = this.#split(node.right, goLeft);
      node.right = inner;
      return [node, right];
    }
    const [left, inner] = this.#split(node.left, goLeft);
    node.left = inner;
    return [left, node];
  }

  #merge(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;
    this.__cost += 1;
    if (a.prio > b.prio) {
      a.right = this.#merge(a.right, b);
      return a;
    }
    b.left = this.#merge(a, b.left);
    return b;
  }
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
