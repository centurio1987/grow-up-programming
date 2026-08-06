/**
 * `tree/bPlusTree` 정본(규약2).
 *
 * 계약은 `../bPlusTree.ts` 헤더 한 곳이고, **그 계약은 `tree/redBlackTree` 의 계약과
 * 같다.** 이 파일은 같은 계약을 지키는 **다섯 번째 구현**이고, 다섯 정본이 같은 스위트를
 * 통과한다는 사실이 「이 계약은 원소를 어디에 담을지 처방하지 않는다」의 실증이다.
 *
 * **원소는 잎에만 담고, 잎끼리 사슬로 잇는다.** 내부 자리는 값을 담지 않고 길잡이만 든다 —
 * 길잡이는 **태어날 때** 오른쪽 부분트리의 최솟값을 베낀 것이라 같은 값이 두 자리에 있다.
 * 그래서 조회가 중간에서 끝나는 일이 없고 **늘 잎까지 내려간다.**
 *
 * **다만 「오른쪽의 최솟값」은 유지되는 성질이 아니다.** 잎에서 값 하나가 빠져도 길잡이를
 * 고치지 않기 때문이다(`delete` 참고). 이 구현이 실제로 지키는 것은 그보다 약한 조건 하나다
 * — **`children[i]` 의 모든 값 < `keys[i]` ≤ `children[i+1]` 의 모든 값.** 길잡이가 값이
 * 아니라 경계이므로 그 조건만으로 길찾기가 옳고, 나누기·빌리기·합치기가 그 조건을 유지한다.
 *
 * **사슬이 있어서 싼 연산과, 싸도 계약이 못 보는 것.** 구간 읽기는 잎 하나를 찾은 뒤
 * 옆으로 따라가면 되므로 위로 되짚는 걸음이 없다. 그런데 사슬이 없는 구현도 같은 일을
 * $O(\log n + k)$ 안에 하므로(다른 네 정본이 그렇게 한다) **갈리는 것은 상수 배수뿐이고**,
 * 축3은 상수 배수를 판정에 넣지 않는다(불변 사실 6·76).
 *
 * **최소 차수를 부르는 쪽이 정하지 않는다.** 물려받은 표면은 생성자가 `t` 를 받았는데
 * 담는 개수는 내부 표현이라 계약 표면에 두지 않는다(`../bPlusTree.ts` 헤더). 이 파일은
 * 그 값을 모듈 안에 고정해 갖는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 나누는 일과 합치는 일도 지나간 자리로 센다. 사슬을 한 칸 타는
 * 것도 자리 하나를 지난 것으로 센다. 한 자리에 담긴 원소가 몇이든 1 로 세는데, 그 수가
 * `MAX_ENTRIES` 로 유계라 상수 배수 안에 들기 때문이다. 축3은 절대 카운트가 아니라
 * 성장률을 보므로 상수 배수가 판정에 들어오지 않는다(§규약2 계측 단위). `__cost` 는
 * 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core/types
/** 자리 하나가 담는 원소·길잡이 수의 하한을 정하는 값. `MIN_DEGREE - 1` 개 밑으로 안 간다. */
const MIN_DEGREE = 3;

/** 자리 하나가 담는 원소·길잡이 수의 상한. 이 수를 넘으면 나눈다. */
const MAX_ENTRIES = 2 * MIN_DEGREE - 1;

/** 원소를 담는 자리. `next` 가 오른쪽 이웃을 가리켜 잎 전체가 한 줄로 이어진다. */
interface Leaf<T> {
  readonly leaf: true;
  values: T[];
  next: Leaf<T> | null;
}

/**
 * 길잡이만 담는 자리.
 *
 * `children` 은 `keys.length + 1` 개다. i 번째 자식이 담는 값은 `keys[i - 1]` 이상이고
 * `keys[i]` 미만이다 — **경계가 한쪽으로만 열려 있는 것**이 값을 담는 자리와 다른 점이다.
 */
interface Internal<T> {
  readonly leaf: false;
  keys: T[];
  children: Node<T>[];
}

type Node<T> = Leaf<T> | Internal<T>;

/**
 * 모양 불변식이 보장하는 자리를 꺼낸다.
 *
 * 배열의 길이는 이 구현이 스스로 유지하므로 여기서 `undefined` 가 나오면 그 유지가 깨진
 * 것이다. 조용히 넘기지 않고 그 자리에서 멈춘다.
 */
function must<V>(value: V | undefined): V {
  if (value === undefined)
    throw new Error("B+ 트리의 자리가 비었다 — 모양 불변식이 깨졌다");
  return value;
}
// #endregion

// #region guide:core/class
export class BPlusTree<T> {
  #root: Node<T> | null = null;
  #count = 0;
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
   */
  insert(item: T): void {
    const root = this.#root;
    if (root === null) {
      this.#root = { leaf: true, values: [item], next: null };
      this.#count = 1;
      return;
    }

    let target: Node<T> = root;
    if (this.#entriesOf(root) === MAX_ENTRIES) {
      const grown: Internal<T> = { leaf: false, keys: [], children: [root] };
      this.#splitChild(grown, 0);
      this.#root = grown;
      target = grown;
    }

    this.#insertInto(target, item);
  }

  /**
   * 지우기.
   *
   * 원소가 잎에만 있으므로 **빠지는 자리는 늘 잎이다.** 내부 자리의 길잡이는 지운 값과
   * 같아도 그대로 둔다 — 길잡이는 값이 아니라 경계이고, 값이 하나 빠져도 그 경계가 여전히
   * 좌우를 옳게 가른다.
   */
  delete(item: T): boolean {
    const root = this.#root;
    if (root === null) return false;

    const removed = this.#removeFrom(root, item);
    if (!removed) return false;
    this.#count -= 1;

    // 뿌리가 비면 트리가 한 층 낮아진다. 아래에서 줄지 않는 것이 이 설계의 대칭점이다.
    if (root.leaf) {
      if (root.values.length === 0) this.#root = null;
    } else if (root.keys.length === 0) {
      this.#root = must(root.children[0]);
    }
    return true;
  }

  /** 값이 잎에만 있으므로 **중간에서 끝나지 않는다.** 늘 높이만큼 내려간다. */
  has(item: T): boolean {
    let at = this.#root;
    while (at !== null && !at.leaf) {
      this.__cost += 1;
      at = must(at.children[this.#route(at, item)]);
    }
    if (at === null) return false;
    this.__cost += 1;
    return this.#seek(at, item).hit;
  }

  min(): T | null {
    const leaf = this.#edgeLeaf("left");
    if (leaf === null) return null;
    this.__cost += 1;
    return must(leaf.values[0]);
  }

  max(): T | null {
    const leaf = this.#edgeLeaf("right");
    if (leaf === null) return null;
    this.__cost += 1;
    return must(leaf.values[leaf.values.length - 1]);
  }

  /**
   * 구간에 드는 원소만 모은다.
   *
   * 왼쪽 끝이 드는 잎을 한 번 찾고 **거기서부터 사슬을 탄다.** 위로 되짚는 걸음이 없으므로
   * 걸음 수가 내려간 길 하나와 지나간 잎 수의 합이고, 잎 하나가 원소를 여럿 담으므로
   * 지나간 잎 수는 담은 원소 수에 묶인다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;

    let at = this.#root;
    while (at !== null && !at.leaf) {
      this.__cost += 1;
      at = must(at.children[this.#route(at, low)]);
    }

    let leaf = at;
    while (leaf !== null) {
      this.__cost += 1;
      for (const value of leaf.values) {
        if (this.#compare(value, low) < 0) continue;
        if (this.#compare(value, high) > 0) return out;
        out.push(value);
      }
      leaf = leaf.next;
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  /** 왼쪽 끝 잎을 찾은 뒤 사슬을 끝까지 탄다. 내려가는 일이 한 번뿐이다. */
  toArray(): T[] {
    const out: T[] = [];
    let leaf = this.#edgeLeaf("left");
    while (leaf !== null) {
      this.__cost += 1;
      for (const value of leaf.values) out.push(value);
      leaf = leaf.next;
    }
    return out;
  }

  /** 값을 담는 자리는 원소 수를, 길잡이만 담는 자리는 길잡이 수를 센다. */
  #entriesOf(node: Node<T>): number {
    return node.leaf ? node.values.length : node.keys.length;
  }

  /**
   * 이 길잡이 자리에서 `item` 이 몇 번째 자식으로 가는지 본다.
   *
   * 길잡이와 **같은 값은 오른쪽으로** 간다. 이 자리가 지키는 조건이
   * `children[i]` 의 모든 값 < `keys[i]` ≤ `children[i+1]` 의 모든 값이라
   * 같은 값은 오른쪽에만 있을 수 있기 때문이고, 이 한 줄이 어긋나면 잎에 있는 값을 못 찾는다.
   */
  #route(node: Internal<T>, item: T): number {
    for (let i = 0; i < node.keys.length; i++) {
      if (this.#compare(item, must(node.keys[i])) < 0) return i;
    }
    return node.keys.length;
  }

  /** 잎 안에서 `item` 의 자리를 찾는다. 담긴 원소가 상수 개라 훑기가 상수 걸음이다. */
  #seek(leaf: Leaf<T>, item: T): { hit: boolean; at: number } {
    for (let i = 0; i < leaf.values.length; i++) {
      const cmp = this.#compare(item, must(leaf.values[i]));
      if (cmp === 0) return { hit: true, at: i };
      if (cmp < 0) return { hit: false, at: i };
    }
    return { hit: false, at: leaf.values.length };
  }

  #edgeLeaf(side: "left" | "right"): Leaf<T> | null {
    let at = this.#root;
    while (at !== null && !at.leaf) {
      this.__cost += 1;
      at = must(
        side === "left" ? at.children[0] : at.children[at.children.length - 1],
      );
    }
    return at;
  }

  /** 넘어온 자리는 가득 차 있지 않다. 그 조건을 아래로 이어 가는 것이 이 함수의 일이다. */
  #insertInto(node: Node<T>, item: T): void {
    this.__cost += 1;
    if (node.leaf) {
      const seek = this.#seek(node, item);
      // 동등한 원소가 이미 있으면 담지 않는다. 집합이므로 두 벌 담지 않는다.
      if (seek.hit) return;
      node.values.splice(seek.at, 0, item);
      this.#count += 1;
      return;
    }

    let at = this.#route(node, item);
    if (this.#entriesOf(must(node.children[at])) === MAX_ENTRIES) {
      // 가득 찬 자식을 **지나가기 전에** 나눈다. 새 길잡이가 이 자리로 올라오므로 어느
      // 쪽으로 갈지 다시 물어야 한다.
      this.#splitChild(node, at);
      if (this.#compare(item, must(node.keys[at])) >= 0) at += 1;
    }

    this.#insertInto(must(node.children[at]), item);
  }

  /**
   * 가득 찬 자식을 둘로 나눈다.
   *
   * **잎과 길잡이 자리에서 다르게 나뉜다.** 잎은 오른쪽의 첫 값을 위로 **베껴** 올리고 그
   * 값은 잎에 그대로 남는다 — 값이 잎에만 있어야 하기 때문이다. 길잡이 자리는 가운데
   * 하나를 위로 **옮겨** 올리고 그 자리에서 뺀다.
   */
  #splitChild(parent: Internal<T>, at: number): void {
    this.__cost += 1;
    const full = must(parent.children[at]);
    let promoted: T;
    let right: Node<T>;

    if (full.leaf) {
      const moved: Leaf<T> = {
        leaf: true,
        values: full.values.slice(MIN_DEGREE),
        next: full.next,
      };
      full.values.length = MIN_DEGREE;
      full.next = moved;
      promoted = must(moved.values[0]);
      right = moved;
    } else {
      promoted = must(full.keys[MIN_DEGREE - 1]);
      right = {
        leaf: false,
        keys: full.keys.slice(MIN_DEGREE),
        children: full.children.slice(MIN_DEGREE),
      };
      full.keys.length = MIN_DEGREE - 1;
      full.children.length = MIN_DEGREE;
    }

    parent.keys.splice(at, 0, promoted);
    parent.children.splice(at + 1, 0, right);
  }

  /**
   * 넘어온 자리는 뿌리이거나 `MIN_DEGREE` 개 이상을 담고 있다. 그래서 여기서 하나를 빼도
   * 하한을 깨지 않는다 — 그 조건을 아래로 이어 가는 것이 이 함수의 일이다.
   */
  #removeFrom(node: Node<T>, item: T): boolean {
    this.__cost += 1;
    if (node.leaf) {
      const seek = this.#seek(node, item);
      if (!seek.hit) return false;
      node.values.splice(seek.at, 1);
      return true;
    }

    const wanted = this.#route(node, item);
    const last = wanted === node.keys.length;
    if (this.#entriesOf(must(node.children[wanted])) < MIN_DEGREE) {
      this.#fill(node, wanted);
    }
    // 마지막 자식이 앞 형제와 합쳐졌으면 내려갈 자리가 하나 앞으로 당겨진다.
    const at = last && wanted > node.keys.length ? wanted - 1 : wanted;
    return this.#removeFrom(must(node.children[at]), item);
  }

  /**
   * 하한에 걸린 자식에게 여유를 만들어 준다.
   *
   * 여유 있는 형제가 있으면 하나를 넘겨받고 **경계를 다시 적는다.** 양쪽 다 여유가 없으면
   * 형제와 합친다.
   */
  #fill(node: Internal<T>, at: number): void {
    this.__cost += 1;
    const before = at > 0 ? must(node.children[at - 1]) : null;
    if (before !== null && this.#entriesOf(before) >= MIN_DEGREE) {
      this.#borrowFromPrev(node, at);
      return;
    }

    const after = at < node.keys.length ? must(node.children[at + 1]) : null;
    if (after !== null && this.#entriesOf(after) >= MIN_DEGREE) {
      this.#borrowFromNext(node, at);
      return;
    }

    this.#merge(node, at < node.keys.length ? at : at - 1);
  }

  /**
   * 앞 형제에게서 하나 빌린다.
   *
   * 잎이면 값을 옮기고 **경계를 새 첫 값으로 다시 적는다.** 길잡이 자리면 부모의 길잡이가
   * 아래로 내려가고 형제의 마지막 길잡이가 부모로 올라간다 — **순서가 생명인 두 줄이 그
   * 자리다.** 부모의 것을 먼저 내리지 않고 덮어쓰면 경계 하나가 사라진다.
   */
  #borrowFromPrev(node: Internal<T>, at: number): void {
    const child = must(node.children[at]);
    const before = must(node.children[at - 1]);

    if (child.leaf && before.leaf) {
      child.values.unshift(must(before.values.pop()));
      node.keys[at - 1] = must(child.values[0]);
      return;
    }
    if (!child.leaf && !before.leaf) {
      child.keys.unshift(must(node.keys[at - 1]));
      node.keys[at - 1] = must(before.keys.pop());
      child.children.unshift(must(before.children.pop()));
      return;
    }
    throw new Error("형제의 층이 다르다 — 모양 불변식이 깨졌다");
  }

  /** 뒤 형제에게서 하나 빌린다. 앞쪽과 좌우가 뒤집혔을 뿐 순서 조건은 같다. */
  #borrowFromNext(node: Internal<T>, at: number): void {
    const child = must(node.children[at]);
    const after = must(node.children[at + 1]);

    if (child.leaf && after.leaf) {
      child.values.push(must(after.values.shift()));
      node.keys[at] = must(after.values[0]);
      return;
    }
    if (!child.leaf && !after.leaf) {
      child.keys.push(must(node.keys[at]));
      node.keys[at] = must(after.keys.shift());
      child.children.push(must(after.children.shift()));
      return;
    }
    throw new Error("형제의 층이 다르다 — 모양 불변식이 깨졌다");
  }

  /**
   * 두 자식을 하나로 합친다.
   *
   * **잎끼리 합칠 때는 부모의 길잡이를 끌어내리지 않고 버린다.** 그 길잡이는 값이 아니라
   * 경계였고, 경계가 가르던 두 무리가 한 자리에 들어왔으니 가를 것이 없다. 길잡이 자리끼리
   * 합칠 때는 반대로 끌어내려야 한다 — 그 길잡이가 좌우 부분트리 사이의 경계이기 때문이다.
   */
  #merge(node: Internal<T>, at: number): void {
    this.__cost += 1;
    const before = must(node.children[at]);
    const after = must(node.children[at + 1]);

    if (before.leaf && after.leaf) {
      for (const value of after.values) before.values.push(value);
      before.next = after.next;
    } else if (!before.leaf && !after.leaf) {
      before.keys.push(must(node.keys[at]));
      for (const key of after.keys) before.keys.push(key);
      for (const child of after.children) before.children.push(child);
    } else {
      throw new Error("형제의 층이 다르다 — 모양 불변식이 깨졌다");
    }

    node.keys.splice(at, 1);
    node.children.splice(at + 1, 1);
  }
}
// #endregion
