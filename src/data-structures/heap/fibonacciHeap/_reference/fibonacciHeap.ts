/**
 * `heap/fibonacciHeap` 정본(규약2).
 *
 * 계약은 `../fibonacciHeap.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 이 파일이 정본인 것은 계약이 고른
 * 계급을 짧은 코드로 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 마디)를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost` 는 계약이
 * 아니라 정본의 의무다(불변 사실 23). 공개 연산 한 번에 1, 뿌리 둘을 잇는 일 한 번에 1,
 * 빼기가 지나가는 뿌리·자식 마디와 차수 자리 하나에 1, 마디 하나를 부모에게서 떼는 일에 1 이다.
 *
 * **핸들은 마디 그 자체다.** 넣기가 만든 마디를 그대로 돌려주고 합치기가 마디를 복사하지
 * 않으므로, 합치기로 옮겨 온 원소의 핸들이 받은 큐에서도 같은 원소를 가리킨다. 이 모듈이
 * 마디 클래스를 내보내지 않아 호출자는 그 안을 읽을 수 없다. 빠진 마디에는 `alive` 를 내려
 * 두어 키 낮추기가 호출 하나로 거절한다.
 *
 * **이 구현이 하는 일은 셋이다.**
 * - **넣기·합치기는 뿌리 목록에 잇기만 한다.** 목록이 원형 이중 연결이라 두 목록을 잇는 일이
 *   상수이고, 최우선 뿌리를 따로 들어 보기가 상수다.
 * - **빼기가 밀린 일을 갚는다.** 최우선 뿌리를 들어내 그 자식들을 뿌리 목록에 올린 뒤, 차수가
 *   같은 뿌리 둘을 이어 **차수가 모두 다른 뿌리들만** 남긴다.
 * - **키 낮추기는 부모보다 앞서게 된 마디를 떼어 뿌리로 올린다.** 그리고 **부모가 자식을 이미
 *   하나 잃었던 마디면 그 부모도 떼어 올리기를 위로 이어 간다**(`#cascade`). 이 이어 떼기가
 *   「차수 k 인 마디가 거느린 마디가 자신 포함 적어도 피보나치 수 $F_{k+2}$ 개」를 지켜 차수를
 *   $O(\log n)$ 에 묶고, 그래서 빼기가 남기는 뿌리 수가 로그다. 상각 상한은 문헌의 결과다
 *   (Fredman & Tarjan, JACM 1987) — **계약은 이 결과에 기대지 않는다.** 헤더의 상한은 하한과
 *   「그 값을 내는 구현이 있다」에서 서고, 이 파일이 그 구현 자리를 축3에서 짚는다.
 */

// #region guide:core/node
/**
 * 마디 하나. 형제는 `left`·`right` 로 원형 이중 연결이고 `child` 는 그 목록의 아무 한 마디다.
 * `marked` 는 뿌리가 아닌 채로 자식을 하나 잃었다는 표시, `alive` 는 아직 큐에 담겨 있다는 표시다.
 */
class Node<T> {
  item: T;
  parent: Node<T> | null = null;
  child: Node<T> | null = null;
  left: Node<T> = this;
  right: Node<T> = this;
  degree = 0;
  marked = false;
  alive = true;

  constructor(item: T) {
    this.item = item;
  }
}
// #endregion

// #region guide:core/class
export class FibonacciHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 뿌리 목록의 최우선 뿌리. 뿌리 목록 전체는 이 마디에서 시작하는 원형 목록이다. */
  #top: Node<T> | null = null;
  #count = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    if (typeof compare !== "function") {
      throw new TypeError(
        "비교자를 주입해야 한다 — 우선순위를 정할 방법이 없다",
      );
    }
    this.#compare = compare;
  }

  enqueue(item: T): Node<T> {
    this.__cost += 1;
    const node = new Node(item);
    this.#addRoot(node);
    this.#count += 1;
    return node;
  }

  dequeue(): T | null {
    this.__cost += 1;
    const top = this.#top;
    if (top === null) return null;

    // 자식들을 뿌리 목록에 올린다. 목록을 먼저 떼어 두고 하나씩 옮긴다.
    const children = this.#detachList(top.child);
    top.child = null;
    for (const child of children) {
      this.__cost += 1;
      child.parent = null;
      child.marked = false;
      this.#splice(top, child);
    }

    top.alive = false;
    this.#count -= 1;
    if (top.right === top) {
      this.#top = null;
    } else {
      this.#top = top.right;
      this.#unlink(top);
      this.#consolidate();
    }
    return top.item;
  }

  decreaseKey(handle: Node<T>, item: T): boolean {
    this.__cost += 1;
    if (!handle.alive || this.#compare(item, handle.item) > 0) return false;

    handle.item = item;
    const parent = handle.parent;
    if (parent !== null && this.#compare(item, parent.item) < 0) {
      this.#cut(handle, parent);
      this.#cascade(parent);
    }
    if (this.#top !== null && this.#compare(item, this.#top.item) < 0) {
      this.#top = handle;
    }
    return true;
  }

  merge(other: FibonacciHeap<T>): void {
    if (other === this) {
      throw new TypeError(
        "자기 자신과 합칠 수 없다 — 넘겨받은 큐를 비우는 일과 담는 일이 같은 큐에서 서로를 부정한다",
      );
    }
    this.__cost += 1;
    const theirs = other.#top;
    if (theirs !== null) {
      const mine = this.#top;
      if (mine === null) {
        this.#top = theirs;
      } else {
        // 원형 목록 둘을 한 번에 잇는다. 두 마디 사이를 가르고 엇갈려 붙이는 일이라 상수다.
        const mineRight = mine.right;
        const theirsLeft = theirs.left;
        mine.right = theirs;
        theirs.left = mine;
        theirsLeft.right = mineRight;
        mineRight.left = theirsLeft;
        if (this.#compare(theirs.item, mine.item) < 0) this.#top = theirs;
      }
    }
    this.#count += other.#count;
    other.#top = null;
    other.#count = 0;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#top === null ? null : this.#top.item;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#count === 0;
  }

  /** 마디 하나를 뿌리 목록에 올리고 최우선 뿌리를 고친다. */
  #addRoot(node: Node<T>): void {
    node.left = node;
    node.right = node;
    const top = this.#top;
    if (top === null) {
      this.#top = node;
      return;
    }
    this.#splice(top, node);
    if (this.#compare(node.item, top.item) < 0) this.#top = node;
  }

  /** `node`(홀로 선 마디)를 `anchor` 오른쪽에 끼운다. */
  #splice(anchor: Node<T>, node: Node<T>): void {
    node.left = anchor;
    node.right = anchor.right;
    anchor.right.left = node;
    anchor.right = node;
  }

  /** `node` 를 제 원형 목록에서 뗀다. 목록의 다른 마디는 서로 이어진 채로 남는다. */
  #unlink(node: Node<T>): void {
    node.left.right = node.right;
    node.right.left = node.left;
    node.left = node;
    node.right = node;
  }

  /** 원형 목록 하나를 배열로 풀어 마디마다 홀로 서게 한다. 걸음은 부르는 쪽이 센다. */
  #detachList(start: Node<T> | null): Node<T>[] {
    const nodes: Node<T>[] = [];
    if (start === null) return nodes;
    let at = start;
    do {
      nodes.push(at);
      at = at.right;
    } while (at !== start);
    for (const node of nodes) {
      node.left = node;
      node.right = node;
    }
    return nodes;
  }

  /** 차수가 같은 뿌리 둘을 이어 차수가 모두 다른 뿌리만 남기고 최우선 뿌리를 다시 찾는다. */
  #consolidate(): void {
    const roots = this.#detachList(this.#top);
    const byDegree: (Node<T> | undefined)[] = [];

    for (let root of roots) {
      this.__cost += 1;
      let degree = root.degree;
      for (;;) {
        this.__cost += 1;
        const same = byDegree[degree];
        if (same === undefined) break;
        byDegree[degree] = undefined;
        root = this.#link(root, same);
        degree += 1;
      }
      byDegree[degree] = root;
    }

    this.#top = null;
    for (const root of byDegree) {
      this.__cost += 1;
      if (root !== undefined) this.#addRoot(root);
    }
  }

  /** 뿌리 둘을 잇는다. 진 쪽이 이긴 쪽의 자식이 된다. 호출 하나가 상수다. */
  #link(a: Node<T>, b: Node<T>): Node<T> {
    this.__cost += 1;
    const [top, under] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    under.parent = top;
    under.marked = false;
    if (top.child === null) {
      top.child = under;
    } else {
      this.#splice(top.child, under);
    }
    top.degree += 1;
    return top;
  }

  /** `node` 를 부모 `parent` 에게서 떼어 뿌리 목록에 올린다. */
  #cut(node: Node<T>, parent: Node<T>): void {
    this.__cost += 1;
    if (node.right === node) {
      parent.child = null;
    } else {
      if (parent.child === node) parent.child = node.right;
      this.#unlink(node);
    }
    parent.degree -= 1;
    node.parent = null;
    node.marked = false;
    this.#addRoot(node);
  }

  /** 자식을 잃은 마디를 표시하고, 이미 표시돼 있었으면 떼어 올리기를 위로 이어 간다. */
  #cascade(node: Node<T>): void {
    let at = node;
    for (;;) {
      const parent = at.parent;
      if (parent === null) return;
      if (!at.marked) {
        at.marked = true;
        return;
      }
      this.#cut(at, parent);
      at = parent;
    }
  }
}
// #endregion
