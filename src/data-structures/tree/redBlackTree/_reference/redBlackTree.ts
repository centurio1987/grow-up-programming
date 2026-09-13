/**
 * `tree/redBlackTree` 정본(규약2).
 *
 * 계약은 `../redBlackTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 높이 차를 1 로 묶는 구현도,
 * 노드마다 원소를 둘까지 담는 구현도, 갈래를 넓게 두는 구현도 같은 계약을 지킨다 —
 * **여덟 행이 전부 `worst O(log n)` 이라는 것 말고 계약이 요구하는 것이 없다.**
 * 색칠은 이 구현이 고른 방법이지 계약의 문장이 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 색을 바꾸는 일과 자리를 도는 일도 지나간 노드로 센다. 축3은
 * 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **감시 노드(sentinel)를 인스턴스마다 하나씩 둔다.** 잎 바깥을 `null` 로 두면 지우기
 * 뒤처리에서 부모를 거슬러 올라갈 자리가 없어져 분기가 배로 늘어난다. 이것은 구현의
 * 선택이고 계약과 무관하다.
 *
 * 감시 노드에 대해 셋을 못 박아 둔다. 외부 검토가 두 번 다 이 자리를 지적했는데 셋 다
 * 의도한 것이다.
 * 1. **`#nil.parent` 가 지우기 도중에 바뀐다.** 뒤처리가 "빈 자리의 부모"를 물어야 하므로
 *    그 자리에 값을 넣어 주는 것이 이 설계의 요점이다. 다음 지우기가 다시 덮고, 뒤처리
 *    밖에서는 아무도 읽지 않는다. 트리마다 감시 노드가 따로이므로 다른 인스턴스로
 *    새지도 않는다.
 * 2. **감시 노드인지는 값이 아니라 참조로 가른다**(`at !== this.#nil`). 그래서 `value` 에
 *    무엇이 들어 있든 판정에 들어오지 않고, 호출자가 `undefined` 를 원소로 넣어도
 *    헷갈리지 않는다.
 * 3. **`#nil.color` 를 검게 다시 칠하는 줄이 있다.** 이미 검으므로 값이 바뀌지 않고,
 *    분기를 하나 줄이려고 그대로 둔다.
 */

// #region guide:core/types
type Color = "red" | "black";

/**
 * 트리의 자리 하나.
 *
 * 잎 바깥에도 노드가 있다 — 색이 검고 값이 없는 감시 노드 하나가 그 모든 자리를 겸한다.
 * 그래서 `left`·`right`·`parent` 가 `null` 이 되지 않고, 지우기 뒤처리가 "빈 자리의
 * 부모"를 물을 수 있다.
 */
interface Node<T> {
  value: T;
  color: Color;
  left: Node<T>;
  right: Node<T>;
  parent: Node<T>;
}
// #endregion

// #region guide:core/class
export class RedBlackTree<T> {
  /** 잎 바깥의 모든 자리를 겸하는 검은 노드. 값은 읽지 않는다. */
  readonly #nil: Node<T>;
  #root: Node<T>;
  #count = 0;
  readonly #compare: (a: T, b: T) => number;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const nil = {
      value: undefined as unknown as T,
      color: "black",
    } as Node<T>;
    nil.left = nil;
    nil.right = nil;
    nil.parent = nil;
    this.#nil = nil;
    this.#root = nil;
  }

  insert(item: T): void {
    let parent = this.#nil;
    let at = this.#root;
    while (at !== this.#nil) {
      this.__cost += 1;
      parent = at;
      const cmp = this.#compare(item, at.value);
      // 동등한 원소가 이미 있으면 상태를 바꾸지 않는다. 집합이므로 두 벌 담지 않는다.
      if (cmp === 0) return;
      at = cmp < 0 ? at.left : at.right;
    }

    const node: Node<T> = {
      value: item,
      color: "red",
      left: this.#nil,
      right: this.#nil,
      parent,
    };
    if (parent === this.#nil) this.#root = node;
    else if (this.#compare(item, parent.value) < 0) parent.left = node;
    else parent.right = node;

    this.#count += 1;
    this.#fixInsert(node);
  }

  delete(item: T): boolean {
    const target = this.#find(item);
    if (target === this.#nil) return false;

    let removed = target;
    let removedColor = removed.color;
    let orphan: Node<T>;

    if (target.left === this.#nil) {
      orphan = target.right;
      this.#replace(target, target.right);
    } else if (target.right === this.#nil) {
      orphan = target.left;
      this.#replace(target, target.left);
    } else {
      // 두 자식이 다 있으면 오른쪽 부분트리의 최솟값이 이 자리를 이어받는다.
      removed = this.#leftmost(target.right);
      removedColor = removed.color;
      orphan = removed.right;
      if (removed.parent === target) {
        orphan.parent = removed;
      } else {
        this.#replace(removed, removed.right);
        removed.right = target.right;
        removed.right.parent = removed;
      }
      this.#replace(target, removed);
      removed.left = target.left;
      removed.left.parent = removed;
      removed.color = target.color;
    }

    this.#count -= 1;
    // 빨간 자리가 빠지면 경로마다의 검은 수가 그대로다. 검은 자리가 빠졌을 때만 고친다.
    if (removedColor === "black") this.#fixDelete(orphan);
    return true;
  }

  has(item: T): boolean {
    return this.#find(item) !== this.#nil;
  }

  min(): T | null {
    if (this.#root === this.#nil) return null;
    return this.#leftmost(this.#root).value;
  }

  max(): T | null {
    if (this.#root === this.#nil) return null;
    let at = this.#root;
    while (at.right !== this.#nil) {
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

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#inOrder(this.#root, out);
    return out;
  }

  #find(item: T): Node<T> {
    let at = this.#root;
    while (at !== this.#nil) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return at;
      at = cmp < 0 ? at.left : at.right;
    }
    return this.#nil;
  }

  #leftmost(from: Node<T>): Node<T> {
    let at = from;
    while (at.left !== this.#nil) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at;
  }

  #collect(node: Node<T>, low: T, high: T, out: T[]): void {
    if (node === this.#nil) return;
    this.__cost += 1;
    const vsLow = this.#compare(node.value, low);
    const vsHigh = this.#compare(node.value, high);
    if (vsLow > 0) this.#collect(node.left, low, high, out);
    if (vsLow >= 0 && vsHigh <= 0) out.push(node.value);
    if (vsHigh < 0) this.#collect(node.right, low, high, out);
  }

  #inOrder(node: Node<T>, out: T[]): void {
    if (node === this.#nil) return;
    this.__cost += 1;
    this.#inOrder(node.left, out);
    out.push(node.value);
    this.#inOrder(node.right, out);
  }

  /** `target` 이 있던 자리에 `replacement` 를 건다. 자식은 옮기지 않는다. */
  #replace(target: Node<T>, replacement: Node<T>): void {
    this.__cost += 1;
    if (target.parent === this.#nil) this.#root = replacement;
    else if (target === target.parent.left) target.parent.left = replacement;
    else target.parent.right = replacement;
    replacement.parent = target.parent;
  }

  #rotateLeft(pivot: Node<T>): void {
    this.__cost += 1;
    const risen = pivot.right;
    pivot.right = risen.left;
    if (risen.left !== this.#nil) risen.left.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.#nil) this.#root = risen;
    else if (pivot === pivot.parent.left) pivot.parent.left = risen;
    else pivot.parent.right = risen;
    risen.left = pivot;
    pivot.parent = risen;
  }

  #rotateRight(pivot: Node<T>): void {
    this.__cost += 1;
    const risen = pivot.left;
    pivot.left = risen.right;
    if (risen.right !== this.#nil) risen.right.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.#nil) this.#root = risen;
    else if (pivot === pivot.parent.right) pivot.parent.right = risen;
    else pivot.parent.left = risen;
    risen.right = pivot;
    pivot.parent = risen;
  }

  /**
   * 넣은 뒤 고치기.
   *
   * 새 자리는 빨갛게 넣으므로 경로마다의 검은 수는 그대로이고, 어긋날 수 있는 것은
   * 「빨강이 연달아 오지 않는다」 하나뿐이다. 삼촌이 빨가면 색만 위로 옮기고, 검으면
   * 한두 번 회전하고 끝낸다 — **색을 옮기는 쪽만 반복되고 회전하는 쪽은 반복되지 않는다.**
   */
  #fixInsert(start: Node<T>): void {
    let node = start;
    while (node.parent.color === "red") {
      this.__cost += 1;
      const parent = node.parent;
      const grand = parent.parent;
      const parentIsLeft = parent === grand.left;
      const uncle = parentIsLeft ? grand.right : grand.left;

      if (uncle.color === "red") {
        parent.color = "black";
        uncle.color = "black";
        grand.color = "red";
        node = grand;
        continue;
      }

      let at = node;
      if (parentIsLeft ? at === parent.right : at === parent.left) {
        at = parent;
        if (parentIsLeft) this.#rotateLeft(at);
        else this.#rotateRight(at);
      }
      at.parent.color = "black";
      at.parent.parent.color = "red";
      if (parentIsLeft) this.#rotateRight(at.parent.parent);
      else this.#rotateLeft(at.parent.parent);
      node = at;
    }
    this.#root.color = "black";
  }

  /**
   * 지운 뒤 고치기.
   *
   * 검은 자리가 빠졌으므로 그 아래 경로 하나가 검은 수를 한 개 덜 갖는다. 형제의 색과
   * 형제 자식들의 색을 보고 **모자란 검정을 위로 옮기거나** 한 번 회전해서 그 자리에서
   * 메운다. 메우면 끝이고, 옮기면 한 층 위에서 같은 물음을 다시 묻는다.
   */
  #fixDelete(start: Node<T>): void {
    let node = start;
    while (node !== this.#root && node.color === "black") {
      this.__cost += 1;
      const isLeft = node === node.parent.left;
      let sibling = isLeft ? node.parent.right : node.parent.left;

      if (sibling.color === "red") {
        sibling.color = "black";
        node.parent.color = "red";
        if (isLeft) this.#rotateLeft(node.parent);
        else this.#rotateRight(node.parent);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }

      const near = isLeft ? sibling.left : sibling.right;
      const far = isLeft ? sibling.right : sibling.left;

      if (near.color === "black" && far.color === "black") {
        // 형제 쪽에서도 검정을 하나 떼어 위로 올린다. 물음이 한 층 위로 간다.
        sibling.color = "red";
        node = node.parent;
        continue;
      }

      if (far.color === "black") {
        near.color = "black";
        sibling.color = "red";
        if (isLeft) this.#rotateRight(sibling);
        else this.#rotateLeft(sibling);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }

      sibling.color = node.parent.color;
      node.parent.color = "black";
      if (isLeft) {
        sibling.right.color = "black";
        this.#rotateLeft(node.parent);
      } else {
        sibling.left.color = "black";
        this.#rotateRight(node.parent);
      }
      node = this.#root;
    }
    node.color = "black";
  }
}
// #endregion
