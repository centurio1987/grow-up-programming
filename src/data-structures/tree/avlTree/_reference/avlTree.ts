/**
 * `tree/avlTree` 정본(규약2).
 *
 * 계약은 `../avlTree.ts` 헤더 한 곳이고, **그 계약은 `tree/redBlackTree` 의 계약과 같다.**
 * 이 파일은 같은 계약을 지키는 **두 번째 구현**이고, 두 정본이 같은 스위트를 통과한다는
 * 사실이 「이 계약은 재균형 기법을 처방하지 않는다」의 실증이다. 색칠도 높이 차도 계약의
 * 문장이 아니다.
 *
 * **높이 차로 묶는다.** 어느 자리에서든 두 부분트리의 높이 차가 1 을 넘지 않게 유지하면
 * 높이가 $\log_\phi n$ 에 묶인다($\phi$ 는 황금비). 색으로 묶는 쪽의 $2\log_2 n$ 과는
 * 상수 배수 차이이므로 축3은 둘을 가르지 않는다(불변 사실 6).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 높이를 고쳐 적는 일과 자리를 도는 일도 지나간 노드로 센다.
 * 축3은 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **감시 노드를 두지 않고 `null` 로 빈 자리를 나타낸다.** 색으로 묶는 정본은 지우기
 * 뒤처리가 "빈 자리의 부모"를 물어야 해서 감시 노드를 뒀는데, 이쪽은 되돌아오는 길에서
 * 고치므로 부모를 따로 들고 다닐 필요가 없다. 같은 계약 아래에서 표현이 이만큼 갈릴 수
 * 있다는 것이 이 파일이 보이는 것이다.
 */

// #region guide:core/types
/**
 * 트리의 자리 하나.
 *
 * `height` 는 이 자리를 뿌리로 하는 부분트리의 높이이고, 빈 자리는 0 으로 센다. 균형을
 * 볼 때마다 아래를 다시 훑지 않으려고 들고 다니는 값이다 — **계약에는 없는 값이고**,
 * 그래서 `height()` 라는 연산도 없다.
 */
interface Node<T> {
  value: T;
  height: number;
  left: Node<T> | null;
  right: Node<T> | null;
}
// #endregion

// #region guide:core/class
export class AVLTree<T> {
  #root: Node<T> | null = null;
  #count = 0;
  readonly #compare: (a: T, b: T) => number;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    this.#root = this.#insertInto(this.#root, item);
  }

  delete(item: T): boolean {
    const before = this.#count;
    this.#root = this.#deleteFrom(this.#root, item);
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
    let at = this.#root;
    if (at === null) return null;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at.value;
  }

  max(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.right !== null) {
      this.__cost += 1;
      at = at.right;
    }
    this.__cost += 1;
    return at.value;
  }

  /**
   * 구간에 드는 원소만 모은다.
   *
   * 양쪽으로 다 내려가지 않는 것이 상한을 지키는 자리다 — 지금 값이 `low` 이하면 왼쪽에
   * 구간에 드는 것이 없고, `high` 이상이면 오른쪽에 없다. 그래서 걸음 수가 **내려간 길
   * 둘과 담은 원소 수**의 합에 묶인다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#collect(this.#root, low, high, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#inOrder(this.#root, out);
    return out;
  }

  /**
   * 넣기.
   *
   * 내려가면서 자리를 찾고 **되돌아오면서 고친다.** 되돌아오는 길이 곧 뿌리까지의 경로이므로
   * 균형을 볼 자리가 그 경로 위에만 있다. 동등한 원소를 만나면 그 자리에서 끝낸다 — 집합이라
   * 두 벌 담지 않고, 상태를 바꾸지 않았으므로 위쪽에서 고칠 것도 없다.
   */
  #insertInto(node: Node<T> | null, item: T): Node<T> {
    if (node === null) {
      this.#count += 1;
      return { value: item, height: 1, left: null, right: null };
    }
    this.__cost += 1;
    const cmp = this.#compare(item, node.value);
    if (cmp === 0) return node;
    if (cmp < 0) node.left = this.#insertInto(node.left, item);
    else node.right = this.#insertInto(node.right, item);
    return this.#rebalance(node);
  }

  /**
   * 지우기.
   *
   * 자식이 둘 다 있는 자리는 **오른쪽 부분트리의 최솟값이 이 자리를 이어받는다.** 값만
   * 옮겨 오고 노드를 옮기지 않으므로, 실제로 트리에서 빠지는 것은 자식이 하나 이하인
   * 자리뿐이다.
   */
  #deleteFrom(node: Node<T> | null, item: T): Node<T> | null {
    if (node === null) return null;
    this.__cost += 1;
    const cmp = this.#compare(item, node.value);
    if (cmp < 0) {
      node.left = this.#deleteFrom(node.left, item);
    } else if (cmp > 0) {
      node.right = this.#deleteFrom(node.right, item);
    } else {
      this.#count -= 1;
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;
      const taken = this.#detachMin(node.right);
      node.value = taken.min;
      node.right = taken.rest;
    }
    return this.#rebalance(node);
  }

  /** 부분트리에서 최솟값을 떼어 내고, 남은 부분트리를 고쳐서 함께 돌려준다. */
  #detachMin(node: Node<T>): { min: T; rest: Node<T> | null } {
    this.__cost += 1;
    if (node.left === null) return { min: node.value, rest: node.right };
    const taken = this.#detachMin(node.left);
    node.left = taken.rest;
    return { min: taken.min, rest: this.#rebalance(node) };
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

  #heightOf(node: Node<T> | null): number {
    return node === null ? 0 : node.height;
  }

  /** 왼쪽이 얼마나 더 높은가. 양수면 왼쪽, 음수면 오른쪽으로 기울었다. */
  #slant(node: Node<T>): number {
    return this.#heightOf(node.left) - this.#heightOf(node.right);
  }

  #refreshHeight(node: Node<T>): void {
    node.height =
      1 + Math.max(this.#heightOf(node.left), this.#heightOf(node.right));
  }

  /**
   * 이 자리의 균형을 되돌린다.
   *
   * 기운 쪽 자식이 **반대로** 기울어 있으면 한 번 돌려서 같은 쪽으로 맞춘 다음에야 이
   * 자리를 돌릴 수 있다. 순서가 생명인 두 줄이 그 자리다 — 먼저 자식을 돌리고, 그다음
   * 이 자리를 돌린다. 바꿔 하면 기울기가 그대로 남는다.
   */
  #rebalance(node: Node<T>): Node<T> {
    this.#refreshHeight(node);
    const slant = this.#slant(node);

    if (slant > 1 && node.left !== null) {
      if (this.#slant(node.left) < 0) node.left = this.#rotateLeft(node.left);
      return this.#rotateRight(node);
    }
    if (slant < -1 && node.right !== null) {
      if (this.#slant(node.right) > 0)
        node.right = this.#rotateRight(node.right);
      return this.#rotateLeft(node);
    }
    return node;
  }

  /** 오른쪽 자식을 끌어올린다. 새 부분트리 뿌리를 돌려준다. */
  #rotateLeft(pivot: Node<T>): Node<T> {
    this.__cost += 1;
    const risen = pivot.right;
    if (risen === null) return pivot;
    pivot.right = risen.left;
    risen.left = pivot;
    this.#refreshHeight(pivot);
    this.#refreshHeight(risen);
    return risen;
  }

  /** 왼쪽 자식을 끌어올린다. 새 부분트리 뿌리를 돌려준다. */
  #rotateRight(pivot: Node<T>): Node<T> {
    this.__cost += 1;
    const risen = pivot.left;
    if (risen === null) return pivot;
    pivot.left = risen.right;
    risen.right = pivot;
    this.#refreshHeight(pivot);
    this.#refreshHeight(risen);
    return risen;
  }
}
// #endregion
