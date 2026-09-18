/**
 * `tree/bTree` 정본(규약2).
 *
 * 계약은 `../bTree.ts` 헤더 한 곳이고, **그 계약은 `tree/redBlackTree` 의 계약과 같다.**
 * 이 파일은 같은 계약을 지키는 **네 번째 구현**이고, 네 정본이 같은 스위트를 통과한다는
 * 사실이 「이 계약은 자리 하나의 크기를 처방하지 않는다」의 실증이다.
 *
 * **자리 하나에 원소를 여럿 담는다.** 담는 개수의 하한을 `MIN_DEGREE` 로 두고 상한을 그
 * 두 배 언저리로 두면, 자리를 나누고 합치는 것만으로 모든 잎이 같은 깊이에 남는다. 높이는
 * $\log_{\text{MIN\_DEGREE}} n$ 언저리이고 밑이 상수이므로 $O(\log n)$ 과 같은 계급이다
 * (불변 사실 6).
 *
 * **내려가면서 미리 고친다.** 앞선 세 정본은 자리를 찾아 내려갔다가 **되돌아오는 길에서**
 * 모양을 고쳤다. 이쪽은 내려가기 전에 고친다 — 넣기는 가득 찬 자식을 만나면 지나가기 전에
 * 나누고, 지우기는 여유 없는 자식을 만나면 내려가기 전에 채운다. 그래서 되돌아오는 길이
 * 필요 없고, 고치는 일이 내려간 길 위에서만 일어난다.
 *
 * **최소 차수를 부르는 쪽이 정하지 않는다.** 물려받은 표면은 생성자가 `t` 를 받았는데
 * 담는 개수는 내부 표현이라 계약 표면에 두지 않는다(`../bTree.ts` 헤더). 이 파일은 그 값을
 * 모듈 안에 고정해 갖는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 나누는 일과 합치는 일도 지나간 자리로 센다. 한 자리에 담긴
 * 원소가 몇이든 1 로 세는데, 그 수가 `MAX_VALUES` 로 유계라 상수 배수 안에 들기 때문이다.
 * 축3은 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않는다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core/types
/**
 * 자리 하나가 담는 원소 수의 하한.
 *
 * 뿌리가 아닌 자리는 `MIN_DEGREE - 1` 개 이상 `MAX_VALUES` 개 이하를 담는다. 이 값이
 * 커지면 트리가 낮아지고 자리 수가 줄지만 **계약은 어느 값에서도 같다** — 밑이 바뀌는
 * 로그는 상수 배수 차이다.
 */
const MIN_DEGREE = 3;

/** 자리 하나가 담는 원소 수의 상한. 이 수를 넘으면 나눈다. */
const MAX_VALUES = 2 * MIN_DEGREE - 1;

/**
 * 트리의 자리 하나.
 *
 * `children` 은 잎이면 비어 있고, 아니면 `values.length + 1` 개다. i 번째 자식이 담는 값은
 * `values[i - 1]` 보다 크고 `values[i]` 보다 작다.
 */
interface Node<T> {
  values: T[];
  children: Node<T>[];
}

/**
 * 모양 불변식이 보장하는 자리를 꺼낸다.
 *
 * `values`·`children` 의 길이는 이 구현이 스스로 유지하므로 여기서 `undefined` 가 나오면
 * 그 유지가 깨진 것이다. 조용히 넘기지 않고 그 자리에서 멈춘다.
 */
function must<V>(value: V | undefined): V {
  if (value === undefined)
    throw new Error("B 트리의 자리가 비었다 — 모양 불변식이 깨졌다");
  return value;
}
// #endregion

// #region guide:core/class
export class BTree<T> {
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
   * 뿌리가 가득 찼으면 **먼저 나누고 트리를 한 층 높인 다음** 내려간다. 트리가 자라는 곳이
   * 뿌리뿐이라 잎의 깊이가 고르게 유지된다.
   *
   * 이미 있는 값을 다시 넣는 호출이 내려가는 길의 자리를 나눠 놓고 끝날 수 있다. 담긴
   * 원소의 모음은 그대로이므로 계약을 어긴 것이 아니고, 담는 모양을 볼 연산도 계약에 없다
   * (`../bTree.ts` 헤더 「상태가 바뀌지 않는다」).
   */
  insert(item: T): void {
    const root = this.#root;
    if (root === null) {
      this.#root = { values: [item], children: [] };
      return;
    }

    let target = root;
    if (root.values.length === MAX_VALUES) {
      const grown: Node<T> = { values: [], children: [root] };
      this.#splitChild(grown, 0);
      this.#root = grown;
      target = grown;
    }

    this.#insertInto(target, item);
  }

  /**
   * 지우기.
   *
   * 잎이 아닌 자리의 원소는 **이웃 부분트리의 끝 값이 이어받고**, 실제로 빠지는 것은 늘
   * 잎의 원소다. 내려가기 전에 여유를 만들어 두므로 되돌아오면서 메울 일이 없다.
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
   * **`at` 은 `hit` 에 따라 가리키는 대상이 다르다.** `hit` 이면 `values[at]` 이 찾던
   * 원소이고(`0 <= at < values.length`), 아니면 `children[at]` 이 내려갈 자식이다
   * (`0 <= at <= values.length`). 값 첨자와 자식 첨자를 한 필드가 겸하는 것이라 부르는
   * 쪽은 **`hit` 을 먼저 보고 `at` 을 해석해야 한다.**
   *
   * 겸할 수 있는 것은 자식이 늘 `values.length + 1` 개이기 때문이다 — 값 첨자가 쓰는
   * 범위가 자식 첨자가 쓰는 범위 안에 통째로 들어간다.
   *
   * 담긴 원소가 `MAX_VALUES` 개까지라 이 훑기는 상수 걸음이다 — 이분 탐색으로 바꿔도
   * 계급이 바뀌지 않는다.
   */
  #seek(node: Node<T>, item: T): { hit: boolean; at: number } {
    for (let i = 0; i < node.values.length; i++) {
      const cmp = this.#compare(item, must(node.values[i]));
      if (cmp === 0) return { hit: true, at: i };
      if (cmp < 0) return { hit: false, at: i };
    }
    return { hit: false, at: node.values.length };
  }

  /** 넘어온 자리는 가득 차 있지 않다. 그 조건을 아래로 이어 가는 것이 이 함수의 일이다. */
  #insertInto(node: Node<T>, item: T): void {
    this.__cost += 1;
    const seek = this.#seek(node, item);
    // 동등한 원소가 이미 있으면 담지 않는다. 집합이므로 두 벌 담지 않는다.
    if (seek.hit) return;

    if (node.children.length === 0) {
      node.values.splice(seek.at, 0, item);
      return;
    }

    let at = seek.at;
    if (must(node.children[at]).values.length === MAX_VALUES) {
      // 가득 찬 자식을 **지나가기 전에** 나눈다. 나뉜 가운데 하나가 이 자리로 올라오므로
      // 어느 쪽으로 갈지 다시 물어야 한다.
      this.#splitChild(node, at);
      const cmp = this.#compare(item, must(node.values[at]));
      if (cmp === 0) return;
      if (cmp > 0) at += 1;
    }

    this.#insertInto(must(node.children[at]), item);
  }

  /**
   * 가득 찬 자식을 둘로 나눈다.
   *
   * 가운데 하나가 부모로 올라가고 좌우가 `MIN_DEGREE - 1` 개씩 나눠 갖는다. 부모가 가득
   * 차 있지 않다는 것이 이 함수를 부르는 쪽의 약속이라, 올라온 하나를 받을 자리가 늘 있다.
   */
  #splitChild(parent: Node<T>, at: number): void {
    this.__cost += 1;
    const full = must(parent.children[at]);
    const promoted = must(full.values[MIN_DEGREE - 1]);
    const right: Node<T> = {
      values: full.values.slice(MIN_DEGREE),
      children: full.children.slice(MIN_DEGREE),
    };

    full.values.length = MIN_DEGREE - 1;
    if (full.children.length > 0) full.children.length = MIN_DEGREE;

    parent.values.splice(at, 0, promoted);
    parent.children.splice(at + 1, 0, right);
  }

  /**
   * 넘어온 자리는 뿌리이거나 `MIN_DEGREE` 개 이상을 담고 있다. 그래서 여기서 하나를 빼도
   * 하한을 깨지 않는다 — 그 조건을 아래로 이어 가는 것이 이 함수의 일이다.
   */
  #removeFrom(node: Node<T>, item: T): boolean {
    this.__cost += 1;
    const seek = this.#seek(node, item);
    const leaf = node.children.length === 0;

    if (seek.hit) {
      if (leaf) {
        node.values.splice(seek.at, 1);
        return true;
      }
      // 잎이 아닌 자리는 값을 직접 빼지 않는다. 여유 있는 이웃의 끝 값이 이어받고,
      // 실제로 빠지는 일은 그 잎에서 일어난다.
      const before = must(node.children[seek.at]);
      const after = must(node.children[seek.at + 1]);
      if (before.values.length >= MIN_DEGREE) {
        const heir = this.#rightmostValue(before);
        node.values[seek.at] = heir;
        return this.#removeFrom(before, heir);
      }
      if (after.values.length >= MIN_DEGREE) {
        const heir = this.#leftmostValue(after);
        node.values[seek.at] = heir;
        return this.#removeFrom(after, heir);
      }
      // 양쪽 다 여유가 없으면 이 원소를 끌어내려 둘을 하나로 합친다. 합친 자리는
      // `MAX_VALUES` 개를 담으므로 거기서 빼면 된다.
      this.#merge(node, seek.at);
      return this.#removeFrom(before, item);
    }

    if (leaf) return false;

    const last = seek.at === node.values.length;
    if (must(node.children[seek.at]).values.length < MIN_DEGREE) {
      this.#fill(node, seek.at);
    }
    // 마지막 자식이 앞 형제와 합쳐졌으면 내려갈 자리가 하나 앞으로 당겨진다.
    const at = last && seek.at > node.values.length ? seek.at - 1 : seek.at;
    return this.#removeFrom(must(node.children[at]), item);
  }

  /**
   * 하한에 걸린 자식에게 여유를 만들어 준다.
   *
   * 여유 있는 형제가 있으면 **부모를 거쳐** 하나를 넘겨받는다 — 형제에게서 곧장 가져오면
   * 순서가 어긋난다. 양쪽 다 여유가 없으면 부모의 원소 하나를 끌어내려 형제와 합친다.
   */
  #fill(node: Node<T>, at: number): void {
    this.__cost += 1;
    const before = at > 0 ? must(node.children[at - 1]) : null;
    if (before !== null && before.values.length >= MIN_DEGREE) {
      this.#borrowFromPrev(node, at);
      return;
    }

    const after = at < node.values.length ? must(node.children[at + 1]) : null;
    if (after !== null && after.values.length >= MIN_DEGREE) {
      this.#borrowFromNext(node, at);
      return;
    }

    this.#merge(node, at < node.values.length ? at : at - 1);
  }

  /**
   * 앞 형제에게서 하나 빌린다.
   *
   * **순서가 생명인 두 줄이 여기 있다.** 부모의 원소를 먼저 아래로 내리고 나서 형제의
   * 원소를 부모로 올려야 한다. 뒤집으면 부모의 원소가 덮여 사라지고 형제의 값이 부모와
   * 자식 양쪽에 들어간다.
   */
  #borrowFromPrev(node: Node<T>, at: number): void {
    const child = must(node.children[at]);
    const before = must(node.children[at - 1]);

    child.values.unshift(must(node.values[at - 1]));
    node.values[at - 1] = must(before.values.pop());

    const moved = before.children.pop();
    if (moved !== undefined) child.children.unshift(moved);
  }

  /** 뒤 형제에게서 하나 빌린다. 앞쪽과 좌우가 뒤집혔을 뿐 순서 조건은 같다. */
  #borrowFromNext(node: Node<T>, at: number): void {
    const child = must(node.children[at]);
    const after = must(node.children[at + 1]);

    child.values.push(must(node.values[at]));
    node.values[at] = must(after.values.shift());

    const moved = after.children.shift();
    if (moved !== undefined) child.children.push(moved);
  }

  /** 부모의 원소 하나를 끌어내려 두 자식을 하나로 합친다. */
  #merge(node: Node<T>, at: number): void {
    this.__cost += 1;
    const before = must(node.children[at]);
    const after = must(node.children[at + 1]);

    before.values.push(must(node.values[at]), ...after.values);
    before.children.push(...after.children);

    node.values.splice(at, 1);
    node.children.splice(at + 1, 1);
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

  #rightmostValue(from: Node<T>): T {
    let at = from;
    while (at.children.length > 0) {
      this.__cost += 1;
      at = must(at.children[at.children.length - 1]);
    }
    this.__cost += 1;
    return must(at.values[at.values.length - 1]);
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
