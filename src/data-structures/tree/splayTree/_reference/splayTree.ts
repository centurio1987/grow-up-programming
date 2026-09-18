/**
 * `tree/splayTree` 정본(규약2).
 *
 * 계약은 `../splayTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — `tree/redBlackTree` 정본도,
 * `tree/treap` 정본도 이 계약을 지킨다. 여덟 행이 전부 `amortized O(log n)` 이라는
 * 것이 계약의 전부이고, **최악까지 로그인 구현은 그 조건을 이미 넘겨 만족한다.**
 * 이 파일이 정본인 것은 계약이 배제하지 **않기로** 한 계열을 대표하기 때문이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 자리를 도는 일도 지나간 노드로 센다. 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위).
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **못 찾은 걸음도 끌어올린다.** 담기지 않은 값을 찾은 뒤 마지막으로 밟은 자리를
 * 뿌리로 올리는 줄이 `has`·`delete`·`range` 에 다 있다. 빼도 답은 같지만 **계약을
 * 어긴다** — 사슬인 트리에 없는 값을 되풀이해 물으면 매번 끝까지 내려가고, 그 시퀀스의
 * 평균이 원소 수에 비례한다. 상각 보장은 「접근한 자리는 반드시 끌어올린다」에서 나온다.
 *
 * **`range` 가 훑지 않고 잘라 낸다.** 구간의 두 끝을 각각 끌어올려 구간을 **뿌리 하나와
 * 부분트리 하나**로 모은 뒤 그 부분트리만 훑는다. 구간 전체가 한 부분트리에 담기는 것이
 * 아니다 — 하한 이상 가장 작은 자리가 뿌리가 되어 구간의 첫 원소를 겸하고, 나머지가 그
 * 오른쪽 아래의 한 부분트리에 모인다.
 *
 * 앞에서부터 훑으며 거르는 구현은 트리가 사슬일 때 담긴 원소 수에 비례하고, 그 상태로
 * 되풀이하면 상각도 로그를 넘는다 — 훑기만 하는 `range` 는 트리를 고쳐 쓰지 않으므로
 * 사슬이 사슬로 남는다.
 */

// #region guide:core/types
/**
 * 트리의 자리 하나.
 *
 * 부모 자리를 들고 있는 것은 끌어올리기 때문이다. 찾은 자리에서 뿌리까지 거슬러
 * 올라가며 회전하므로, 내려온 길을 따로 쌓아 두지 않으려면 자리마다 부모가 있어야 한다.
 */
interface Node<T> {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
  parent: Node<T> | null;
}
// #endregion

// #region guide:core/class
export class SplayTree<T> {
  #root: Node<T> | null = null;
  readonly #compare: (a: T, b: T) => number;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    if (this.#root === null) {
      this.__cost += 1;
      this.#root = { value: item, left: null, right: null, parent: null };
      return;
    }

    let at: Node<T> = this.#root;
    for (;;) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.value);
      // 동등한 원소가 이미 있으면 상태를 바꾸지 않는다. 그래도 끌어올린다 —
      // 방금 물은 자리를 위로 올려 두는 것이 다음 호출의 값을 정한다.
      if (cmp === 0) {
        this.#splayTo(at, null);
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
        this.#splayTo(fresh, null);
        return;
      }
      at = next;
    }
  }

  delete(item: T): boolean {
    const found = this.#locate(item);
    if (found === null) return false;
    this.#splayTo(found, null);

    const left = found.left;
    const right = found.right;
    if (left !== null) left.parent = null;
    if (right !== null) right.parent = null;

    if (left === null) {
      this.#root = right;
    } else {
      // 왼쪽의 가장 오른쪽을 그 안에서 뿌리로 올리면 오른쪽 자리가 비고,
      // 거기에 오른쪽 부분트리를 그대로 건다.
      this.#root = left;
      const last = this.#rightmostFrom(left);
      this.#splayTo(last, null);
      last.right = right;
      if (right !== null) right.parent = last;
    }
    return true;
  }

  has(item: T): boolean {
    const found = this.#locate(item);
    if (found === null) return false;
    this.#splayTo(found, null);
    return true;
  }

  min(): T | null {
    if (this.#root === null) return null;
    const first = this.#leftmostFrom(this.#root);
    this.#splayTo(first, null);
    return first.value;
  }

  max(): T | null {
    if (this.#root === null) return null;
    const last = this.#rightmostFrom(this.#root);
    this.#splayTo(last, null);
    return last.value;
  }

  /**
   * 구간에 드는 원소만 모은다.
   *
   * 훑으면서 거르지 않는다 — 끌어올리기 두 번으로 구간을 **뿌리 하나 + 부분트리 하나**로
   * 모은 뒤 그 부분트리만 훑는다. 걸음 수가 끌어올리기 둘과 담은 원소 수의 합에 묶이는
   * 자리가 여기다.
   *
   * 훑는 부분트리가 구간 밖을 담지 않는 근거는 두 걸음이 각각 한쪽을 잘라 내기 때문이다.
   * ① 뒤에 뿌리가 되는 자리는 하한 이상 가장 작은 값이므로 **그 왼쪽은 전부 하한 미만**
   * 이고, 뿌리 자신이 구간의 첫 원소다. ② 그 오른쪽은 전부 뿌리보다 크므로 이미 하한
   * 이상이고, 거기서 상한을 넘는 가장 작은 자리를 다시 올리면 **그 자리의 왼쪽이 상한
   * 이하**다. 두 조건이 겹치는 것이 정확히 구간이다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#root === null) return out;
    if (this.#compare(low, high) > 0) return out;

    // ① `low` 이상 가장 작은 자리를 뿌리로 올린다. 그러면 뿌리의 왼쪽은 전부 구간 아래다.
    const first = this.#boundFrom(this.#root, low, false);
    if (first === null) {
      // 트리 전체가 구간 아래다. 헛걸음도 끌어올려 두어야 다음 호출이 싸진다.
      this.#splayTo(this.#rightmostFrom(this.#root), null);
      return out;
    }
    this.#splayTo(first, null);
    if (this.#compare(first.value, high) > 0) return out;
    out.push(first.value);

    const right = first.right;
    if (right === null) return out;

    // ② 오른쪽에서 `high` 를 **넘는** 가장 작은 자리를 그 부분트리의 뿌리로 올린다.
    //    올린 자리의 왼쪽이 정확히 남은 구간이다.
    const above = this.#boundFrom(right, high, true);
    if (above === null) {
      // 넘는 것이 없으면 오른쪽 전부가 구간이다.
      this.#splayTo(this.#rightmostFrom(right), first);
      this.#collect(first.right, out);
      return out;
    }
    this.#splayTo(above, first);
    this.#collect(above.left, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#collect(this.#root, out);
    return out;
  }

  /** 값이 있는 자리를 찾는다. 없으면 마지막으로 밟은 자리를 끌어올리고 `null`. */
  #locate(item: T): Node<T> | null {
    let at = this.#root;
    let last: Node<T> | null = null;
    while (at !== null) {
      this.__cost += 1;
      last = at;
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return at;
      at = cmp < 0 ? at.left : at.right;
    }
    if (last !== null) this.#splayTo(last, null);
    return null;
  }

  /**
   * `from` 부분트리에서 `key` 보다 크거나 같은(`strict` 면 큰) 값 중 가장 작은 자리.
   *
   * 내려가면서 후보를 갱신한다 — 왼쪽으로 꺾을 때의 자리가 그때까지의 답이고, 오른쪽으로
   * 꺾으면 답이 될 수 없다.
   */
  #boundFrom(from: Node<T>, key: T, strict: boolean): Node<T> | null {
    let at: Node<T> | null = from;
    let best: Node<T> | null = null;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(at.value, key);
      if (cmp > 0 || (!strict && cmp === 0)) {
        best = at;
        at = at.left;
      } else {
        at = at.right;
      }
    }
    return best;
  }

  #leftmostFrom(from: Node<T>): Node<T> {
    let at = from;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at;
  }

  #rightmostFrom(from: Node<T>): Node<T> {
    let at = from;
    while (at.right !== null) {
      this.__cost += 1;
      at = at.right;
    }
    this.__cost += 1;
    return at;
  }

  /** 부분트리를 왼쪽부터 훑어 담는다. 사슬이 깊을 수 있어 되돌이 호출을 쓰지 않는다. */
  #collect(from: Node<T> | null, out: T[]): void {
    const pending: Node<T>[] = [];
    let at = from;
    while (at !== null || pending.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        pending.push(at);
        at = at.left;
      }
      const node = pending.pop() as Node<T>;
      out.push(node.value);
      at = node.right;
    }
  }

  /**
   * `node` 를 `stop` 의 바로 아래까지 끌어올린다. `stop` 이 `null` 이면 뿌리로 올린다.
   *
   * 한 걸음이 셋 중 하나다 — 부모가 목적지 바로 아래면 한 번 돌리고(zig), 자신과 부모가
   * **같은 쪽** 자식이면 **부모를 먼저** 돌리고(zig-zig), 다른 쪽 자식이면 자신을 두 번
   * 돌린다(zig-zag).
   *
   * **회전 대상이 갈리는 것은 zig-zig 자리뿐이고, 거기서 부모를 먼저 돌리는 것이 이
   * 구조의 값을 만든다.** zig-zag 자리에서 자신을 두 번 돌리는 것은 정식 걸음이고 위
   * 코드가 하는 일이다. 두 걸음이 겉보기에 「자신을 두 번」으로 같아 보이지만 자리가
   * 다르다 — 헷갈리기 쉬운 자리라 갈라 적는다. **zig-zig 자리에서** 부모 대신 자신을
   * 두 번 돌리면 사슬이 거의 그대로 남는다: 원소 1,024 개 사슬을 순차 조회할 때 정본은
   * 걸음이 1,536 → 769 → 387 로 반씩 줄지만, 그 두 줄만 뒤집은 변종은
   * 1,536 → 1,536 → 1,534 로 붙어 있고 연산당 평균이 $r = 4.00$ 으로 자란다.
   */
  #splayTo(node: Node<T>, stop: Node<T> | null): void {
    while (node.parent !== stop) {
      this.__cost += 1;
      const parent = node.parent as Node<T>;
      const grand = parent.parent;
      if (grand === stop) {
        this.#rotate(node);
      } else if (
        (node === parent.left) ===
        (parent === (grand as Node<T>).left)
      ) {
        this.#rotate(parent);
        this.#rotate(node);
      } else {
        this.#rotate(node);
        this.#rotate(node);
      }
    }
    if (stop === null) this.#root = node;
  }

  /** `node` 를 부모 위로 올린다. 부모의 자리를 이어받고 부모를 자기 자식으로 내린다. */
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
// #endregion
