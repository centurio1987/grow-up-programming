/**
 * 결함 fixture — `heap/fibonacciHeap` 정본에서 **키 낮추기가 최우선 뿌리를 고치지 않는** 우선순위 큐.
 * 낮춘 뒤에는 표시만 세우고, 최우선 원소를 읽는 다음 호출(`peek`·`dequeue`·`merge`)이 뿌리
 * 목록을 한 바퀴 훑어 다시 찾는다.
 *
 * 정본(`../../heap/fibonacciHeap/_reference/fibonacciHeap.ts`)에서 두 곳만 바꿨다 — 키 낮추기
 * 끝의 최우선 뿌리 비교와, 뗀 마디를 뿌리 목록에 올릴 때의 비교를 걷어 내고 그 자리에 표시를
 * 세웠다. 자명한 구현이 아니고 **답은 전부 옳다**(축1 통과).
 *
 * **이 fixture 는 조회 셋의 시나리오를 왜 따로 적었는지를 재려고 지었다.** 계약 C
 * (`heap/pairingHeap`)의 조회 시나리오는 넣기와 합치기로만 채우는데, 이 계열은 거기서 표시가
 * 한 번도 서지 않아 상수로 통과한다. 최우선 자리를 바꾸는 연산이 이 계약에 하나 더 있으므로
 * 채우기에 그 연산을 넣어야 드러난다(`heap/leftistHeap` 의 경계 케이스 「합치기로 들어온 원소가
 * 최우선이면 보기가 따라 바뀐다」와 같은 물음이다).
 *
 * - **`peek`·`size`·`isEmpty` 의 적대적 시나리오에서 걸린다**(1,027 · 4,099 · 16,387). 보기마다
 *   바로 앞에 키 낮추기가 있어 호출마다 뿌리 목록을 훑고, 빼기가 없는 채우기라 원소가 전부
 *   뿌리다. 같은 입력을 `amortized` 로 다시 재도 같은 값으로 걸린다 — 훑기가 이따금이 아니라
 *   **호출마다**라서, 이 fixture 는 조회 셋의 한정자가 아니라 **채우기에 무엇이 들어가야
 *   하는가**를 잰다.
 * - 나머지 여섯 시나리오는 통과한다. 빼기는 원래 뿌리 목록 전체를 지나가므로 훑기 한 번이 더해져도
 *   계급이 같고, `heap/pairingHeap` 에서 가져온 넷에는 키 낮추기가 없어 표시가 서지 않는다.
 * - **`heap/pairingHeap` 의 조회 시나리오에서는 통과한다**(3.00 고정) — 넣기와 합치기로만 채워서다.
 */

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

export class RescanningTopHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 뿌리 목록의 최우선 뿌리. 뿌리 목록 전체는 이 마디에서 시작하는 원형 목록이다. */
  #top: Node<T> | null = null;
  #count = 0;
  /** 키 낮추기가 최우선 뿌리를 바꿨을 수 있다는 표시. */
  #stale = false;

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
    this.#refreshTop();
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
    // 최우선 뿌리를 여기서 고치지 않고, 다음에 그 자리를 읽는 호출이 뿌리 목록을 다시 훑게 한다.
    this.#stale = true;
    return true;
  }

  merge(other: RescanningTopHeap<T>): void {
    if (other === this) {
      throw new TypeError(
        "자기 자신과 합칠 수 없다 — 넘겨받은 큐를 비우는 일과 담는 일이 같은 큐에서 서로를 부정한다",
      );
    }
    this.__cost += 1;
    this.#refreshTop();
    other.#refreshTop();
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
    this.#refreshTop();
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

  /** 표시가 서 있으면 뿌리 목록을 한 바퀴 훑어 최우선 뿌리를 다시 찾는다. */
  #refreshTop(): void {
    if (!this.#stale) return;
    this.#stale = false;
    const start = this.#top;
    if (start === null) return;
    let at = start;
    do {
      this.__cost += 1;
      if (this.#compare(at.item, (this.#top as Node<T>).item) < 0)
        this.#top = at;
      at = at.right;
    } while (at !== start);
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
    this.#splice(this.#top as Node<T>, node);
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
