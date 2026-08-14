/**
 * `tree/orderStatisticTree` 정본(규약2).
 *
 * 계약은 `../orderStatisticTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1, 비교자 호출 1회당 1"*
 * 이다. 읽기와 쓰기를 따로 세지 않는다(§규약2 계측 단위). 비교자를 주입받는 구조라 하네스가
 * 비교 횟수를 **밖에서** 셀 수 있고, 자기 보고가 그 외부 계수보다 작으면 하네스가
 * 실패시킨다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **우선순위를 난수로 뽑는다.** 결정론적 함수로 만들면 — 삽입 순서를 아무리 잘 섞어도 —
 * 그 함수를 역산해 사슬을 만드는 입력이 실재한다(불변 사실 104). 그러면 「호출자가 어떤
 * 입력을 주든」이 거짓이 되고, 이 계약의 `expected` 는 입력이 아니라 **구현이 만드는
 * 무작위성**에 대한 값이므로 그 순간 계약을 어긴다. 같은 판단이 `tree/treap` 정본에 먼저
 * 있고 `tree/multiset` 정본에는 아직 없다(§규약2 「무작위를 쓰는 정본과 재현성」의 미결).
 *
 * **부분트리 크기가 이 정본이 계약에 더 내는 값이다.** `rankOf` 와 `at` 은 그 값을 더해
 * 가거나 빼 가며 내려가므로 지나가는 자리 수가 높이에 묶인다. 나란한 정렬 집합 다섯의
 * 정본에서는 같은 값이 **어느 공개 연산으로도 관측되지 않아** 어긋나도 네 축이 통과시켰는데
 * (불변 사실 109), 이 계약에는 그것을 읽는 공개 연산이 있다.
 *
 * **다만 「그 연산」이 둘이라고 적으면 이 파일에 대해 거짓이다.** 계약이 요구하는 것은
 * `rankOf`·`at` 둘이지만, 이 정본은 `size` 도 뿌리의 같은 필드를 읽고 `count` 도 `#rankBy`
 * 를 거쳐 같은 값을 읽는다. 그래서 이 필드가 어긋나면 불변식 **1·2·4·5 가 함께** 걸린다.
 * 크기를 따로 센 카운터로 답하는 정본이라면 4·5 만 걸리고, 둘 다 계약을 지킨다 — **어느
 * 불변식이 걸리는지는 계약이 아니라 이 파일이 정한다.** 계약 수준에서 참인 것은
 * 「위치를 세는 값을 안 드는 구현이 이 계약에서 걸러진다」 하나뿐이다.
 *
 * **동등한 원소를 자리 하나씩 담는다.** 계약은 담는 모양을 처방하지 않으므로 키마다 다중도를
 * 정수로 드는 구현도 정당하지만, 그렇게 지으면 `rankOf`·`at` 이 **서로 다른 키의 수**에
 * 비례해 이 계약을 어긴다 — 그 구현이 결함 fixture 로 실재한다
 * (`_contract/_fixtures/keyCountingMultiset.ts`). 그것이 계약을 어기는 이유는 다중도를 든
 * 것 자체가 아니라 **위치를 세는 값을 함께 들지 않은 것**이다.
 */

// #region guide:core/types
type Comparator<T> = (a: T, b: T) => number;

/**
 * 트리의 자리 하나.
 *
 * 키는 이진 탐색 트리의 순서를, 우선순위는 힙의 순서를 지킨다. `size` 는 이 자리를 뿌리로
 * 하는 부분트리의 원소 수(중복 포함)이고, 위치 연산 둘이 읽는 값이 그것이다.
 */
interface Node<T> {
  key: T;
  prio: number;
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
// #endregion

// #region guide:core/class
export class OrderStatisticTree<T> {
  #root: Node<T> | null = null;
  readonly #compareWith: Comparator<T>;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compareWith = comparator ?? defaultComparator;
  }

  add(item: T): void {
    const [below, above] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) <= 0,
    );
    const fresh: Node<T> = {
      key: item,
      prio: Math.random(),
      size: 1,
      left: null,
      right: null,
    };
    this.#root = this.#merge(this.#merge(below, fresh), above);
  }

  delete(item: T): boolean {
    const [below, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, above] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );
    if (equal === null) {
      this.#root = this.#merge(below, above);
      return false;
    }
    // 동등한 자리 무리에서 하나만 뺀다. 무리의 뿌리를 빼고 그 두 자식을 잇는 것으로 족하다 —
    // 무리 안의 키가 전부 동등하므로 어느 벌을 빼는지는 계약이 약속하지 않는다.
    const remainder = this.#merge(equal.left, equal.right);
    this.#root = this.#merge(this.#merge(below, remainder), above);
    return true;
  }

  deleteAll(item: T): number {
    const [below, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, above] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );
    const removed = sizeOf(equal);
    this.#root = this.#merge(below, above);
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

  /**
   * 앞에서 `index` 번째 원소.
   *
   * 비교자를 한 번도 부르지 않는 것이 이 연산의 성격이다 — 찾는 것이 값이 아니라 **자리**라
   * 왼쪽 부분트리의 크기만으로 어느 쪽으로 내려갈지가 정해진다.
   */
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

  /**
   * `goLeft` 가 참인 키 전부를 왼쪽 조각으로 가른다.
   *
   * `goLeft` 는 정렬 순서에 대해 **단조**여야 한다 — 앞쪽 구간에서만 참이어야 갈라진 두
   * 조각이 각각 정렬 상태를 지킨다. 갈라진 자리마다 크기를 다시 세우는 것이 `#pull` 이고,
   * 그 한 줄이 빠지면 **부분트리 크기를 읽는 연산이 전부** 틀린다 — 위치 둘만이 아니라
   * `size` 와 `count` 도 그 필드를 읽는다(파일 헤더).
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

  /**
   * `a` 의 모든 키가 `b` 의 모든 키보다 앞선다는 전제에서 둘을 잇는다.
   *
   * 우선순위가 큰 쪽이 위로 간다. 그래야 이은 결과도 힙 순서를 지키고, 가르기와 잇기가
   * 서로의 역이 된다.
   */
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

  /**
   * `goLeft` 를 만족하는 키의 개수.
   *
   * 왼쪽으로 가는 자리에서 그 부분트리의 크기를 통째로 더하므로 **다중도에 비례하지 않는다.**
   * 동등한 원소를 하나씩 세는 구현과 갈리는 자리가 이 한 줄이다.
   */
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

  #pull(node: Node<T>): void {
    node.size = 1 + sizeOf(node.left) + sizeOf(node.right);
  }
}
// #endregion
