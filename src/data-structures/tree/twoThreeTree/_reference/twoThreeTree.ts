/**
 * `tree/twoThreeTree` 정본(규약2).
 *
 * 계약은 `../twoThreeTree.ts` 헤더 한 곳이고, **그 계약은 `tree/redBlackTree` 의 계약과
 * 같다.** 이 파일은 같은 계약을 지키는 **세 번째 구현**이고, 세 정본이 같은 스위트를
 * 통과한다는 사실이 「이 계약은 노드 모양을 처방하지 않는다」의 실증이다.
 *
 * **자리 하나에 원소를 둘까지 담는다.** 넘치면 가운데를 위로 올리며 나누고, 지우다
 * 비면 형제에서 빌리거나 형제와 합친다. 트리가 자라고 줄어드는 곳이 뿌리뿐이라 **모든
 * 잎이 같은 깊이에** 놓인다 — 회전이 한 번도 나오지 않는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 나누는 일과 합치는 일도 지나간 자리로 센다. 한 자리에 담긴
 * 원소가 하나든 둘이든 1 로 세는데, 그 수가 2 로 유계라 상수 배수 안에 들기 때문이다.
 * 축3은 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않는다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core/types
/**
 * 트리의 자리 하나.
 *
 * `values` 는 하나 또는 둘이고, `children` 은 잎이면 없고 아니면 `values.length + 1` 개다.
 * 넣는 도중 잠깐 셋이 되며, 그 상태를 그대로 두지 않고 곧바로 나눈다.
 */
interface Node<T> {
  values: T[];
  children: Node<T>[];
}

/** 자리가 넘쳐 나뉜 결과. 가운데 하나가 위로 올라가고 좌우가 남는다. */
interface Split<T> {
  promoted: T;
  left: Node<T>;
  right: Node<T>;
}

/**
 * 모양 불변식이 보장하는 자리를 꺼낸다.
 *
 * `values`·`children` 의 길이는 이 구현이 스스로 유지하므로 여기서 `undefined` 가 나오면
 * 그 유지가 깨진 것이다. 조용히 넘기지 않고 그 자리에서 멈춘다.
 */
function must<V>(value: V | undefined): V {
  if (value === undefined)
    throw new Error("2-3 트리의 자리가 비었다 — 모양 불변식이 깨졌다");
  return value;
}
// #endregion

// #region guide:core/class
export class TwoThreeTree<T> {
  #root: Node<T> | null = null;
  readonly #compare: (a: T, b: T) => number;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * 넣기.
   *
   * 잎까지 내려가 끼우고, 넘친 자리를 **되돌아오면서** 나눈다. 나뉜 것이 뿌리까지 올라오면
   * 그때만 트리가 한 층 높아진다 — 위에서 자라므로 잎의 깊이가 고르게 유지된다.
   */
  insert(item: T): void {
    const root = this.#root;
    if (root === null) {
      this.#root = { values: [item], children: [] };
      return;
    }

    const split = this.#insertInto(root, item);
    if (split === null) return;
    this.#root = {
      values: [split.promoted],
      children: [split.left, split.right],
    };
  }

  /**
   * 지우기.
   *
   * 잎이 아닌 자리의 원소는 **오른쪽 부분트리의 최솟값이 이어받고**, 실제로 빠지는 것은
   * 늘 잎의 원소다. 빈 잎이 생기면 되돌아오는 길에서 메운다.
   */
  delete(item: T): boolean {
    const root = this.#root;
    if (root === null) return false;

    const removed = this.#removeFrom(root, item);
    if (!removed) return false;

    // 뿌리가 비면 트리가 한 층 낮아진다. 아래에서 줄지 않는 것이 이 설계의 대칭점이다.
    if (root.values.length === 0) {
      this.#root = root.children.length === 0 ? null : must(root.children[0]);
    }
    return true;
  }

  has(item: T): boolean {
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const seek = this.#seek(at, item);
      if (seek.hit) return true;
      if (at.children.length === 0) return false;
      at = must(at.children[seek.at]);
    }
    return false;
  }

  min(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.children.length > 0) {
      this.__cost += 1;
      at = must(at.children[0]);
    }
    this.__cost += 1;
    return must(at.values[0]);
  }

  max(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.children.length > 0) {
      this.__cost += 1;
      at = must(at.children[at.children.length - 1]);
    }
    this.__cost += 1;
    return must(at.values[at.values.length - 1]);
  }

  /**
   * 구간에 드는 원소만 모은다.
   *
   * 자식마다 담을 수 있는 값의 범위가 양옆 원소로 정해져 있으므로, 그 범위가 구간과
   * 겹치지 않으면 내려가지 않는다. 그래서 걸음 수가 **내려간 길 둘과 담은 원소 수**의
   * 합에 묶인다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    if (this.#root !== null) this.#collect(this.#root, low, high, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    if (this.#root !== null) this.#walk(this.#root, out);
    return out;
  }

  /**
   * 이 자리에서 `item` 이 어디로 가는지 본다.
   *
   * `hit` 이면 그 자리에 있고, 아니면 `at` 번째 자식으로 내려간다. 담긴 원소가 둘까지라
   * 이 훑기는 상수 걸음이다.
   */
  #seek(node: Node<T>, item: T): { hit: boolean; at: number } {
    for (let i = 0; i < node.values.length; i++) {
      const cmp = this.#compare(item, must(node.values[i]));
      if (cmp === 0) return { hit: true, at: i };
      if (cmp < 0) return { hit: false, at: i };
    }
    return { hit: false, at: node.values.length };
  }

  #insertInto(node: Node<T>, item: T): Split<T> | null {
    this.__cost += 1;
    const seek = this.#seek(node, item);
    // 동등한 원소가 이미 있으면 상태를 바꾸지 않는다. 집합이므로 두 벌 담지 않는다.
    if (seek.hit) return null;

    if (node.children.length === 0) {
      node.values.splice(seek.at, 0, item);
    } else {
      const split = this.#insertInto(must(node.children[seek.at]), item);
      if (split === null) return null;
      // 아래에서 올라온 하나를 이 자리에 끼우고, 자식 하나를 둘로 갈아 끼운다.
      // 두 배열이 서로 독립이고 `seek.at` 이 이미 정해진 수라 **순서는 무관하다.**
      // 값과 자식의 대응은 두 줄이 다 끝난 뒤에만 뜻이 있다.
      node.values.splice(seek.at, 0, split.promoted);
      node.children.splice(seek.at, 1, split.left, split.right);
    }

    if (node.values.length <= 2) return null;
    return this.#split(node);
  }

  /** 셋이 된 자리를 가운데 하나를 위로 올리며 둘로 나눈다. */
  #split(node: Node<T>): Split<T> {
    this.__cost += 1;
    return {
      promoted: must(node.values[1]),
      left: {
        values: [must(node.values[0])],
        children: node.children.slice(0, 2),
      },
      right: {
        values: [must(node.values[2])],
        children: node.children.slice(2, 4),
      },
    };
  }

  #removeFrom(node: Node<T>, item: T): boolean {
    this.__cost += 1;
    const seek = this.#seek(node, item);

    if (node.children.length === 0) {
      if (!seek.hit) return false;
      node.values.splice(seek.at, 1);
      return true;
    }

    if (seek.hit) {
      const heir = this.#leftmostValue(must(node.children[seek.at + 1]));
      node.values[seek.at] = heir;
      this.#removeFrom(must(node.children[seek.at + 1]), heir);
      this.#fixChild(node, seek.at + 1);
      return true;
    }

    const removed = this.#removeFrom(must(node.children[seek.at]), item);
    if (removed) this.#fixChild(node, seek.at);
    return removed;
  }

  #leftmostValue(from: Node<T>): T {
    let at = from;
    while (at.children.length > 0) {
      this.__cost += 1;
      at = must(at.children[0]);
    }
    this.__cost += 1;
    return must(at.values[0]);
  }

  /**
   * 비어 버린 자식을 메운다.
   *
   * 여유 있는 형제(원소가 둘)가 있으면 **부모를 거쳐** 하나를 넘겨받는다 — 형제에게서
   * 곧장 가져오면 순서가 어긋난다. 양쪽 다 여유가 없으면 부모의 원소 하나를 끌어내려
   * 형제와 합치고, 그러면 이번에는 부모가 빌 수 있다. 그 물음은 한 층 위에서 다시 묻는다.
   *
   * **이 파일에서 순서가 실제로 생명인 두 줄이 아래 빌려 오기에 있다.** 부모의 원소를
   * 먼저 아래로 내리고 나서 형제의 원소를 부모로 올려야 한다. 뒤집으면 형제의 값이
   * 부모와 자식 양쪽에 들어가 순서가 깨진다(무작위 3000 연산에서 171 번째에 `35` 자리에
   * `29` 가 남는 것으로 확인했다).
   */
  #fixChild(parent: Node<T>, at: number): void {
    const child = must(parent.children[at]);
    if (child.values.length > 0) return;
    this.__cost += 1;

    const leftAt = at - 1;
    const rightAt = at + 1;
    const left = leftAt >= 0 ? must(parent.children[leftAt]) : null;
    const right =
      rightAt < parent.children.length ? must(parent.children[rightAt]) : null;

    if (left !== null && left.values.length > 1) {
      child.values.unshift(must(parent.values[leftAt]));
      parent.values[leftAt] = must(left.values.pop());
      const moved = left.children.pop();
      if (moved !== undefined) child.children.unshift(moved);
      return;
    }

    if (right !== null && right.values.length > 1) {
      child.values.push(must(parent.values[at]));
      parent.values[at] = must(right.values.shift());
      const moved = right.children.shift();
      if (moved !== undefined) child.children.push(moved);
      return;
    }

    if (left !== null) {
      left.values.push(must(parent.values[leftAt]));
      left.children.push(...child.children);
      parent.values.splice(leftAt, 1);
      parent.children.splice(at, 1);
      return;
    }

    if (right !== null) {
      child.values.push(must(parent.values[at]), ...right.values);
      child.children.push(...right.children);
      parent.values.splice(at, 1);
      parent.children.splice(rightAt, 1);
    }
  }

  #collect(node: Node<T>, low: T, high: T, out: T[]): void {
    this.__cost += 1;
    const count = node.values.length;
    const leaf = node.children.length === 0;

    for (let i = 0; i <= count; i++) {
      if (!leaf) {
        // i 번째 자식이 담는 값은 왼쪽 원소보다 크고 오른쪽 원소보다 작다.
        const overLow =
          i === 0 || this.#compare(high, must(node.values[i - 1])) > 0;
        const underHigh =
          i === count || this.#compare(low, must(node.values[i])) < 0;
        if (overLow && underHigh)
          this.#collect(must(node.children[i]), low, high, out);
      }
      if (i === count) break;
      const value = must(node.values[i]);
      if (this.#compare(value, low) >= 0 && this.#compare(value, high) <= 0)
        out.push(value);
    }
  }

  #walk(node: Node<T>, out: T[]): void {
    this.__cost += 1;
    const count = node.values.length;
    const leaf = node.children.length === 0;

    for (let i = 0; i <= count; i++) {
      if (!leaf) this.#walk(must(node.children[i]), out);
      if (i === count) break;
      out.push(must(node.values[i]));
    }
  }
}
// #endregion
