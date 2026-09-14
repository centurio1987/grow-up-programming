/**
 * 결함 fixture — `heap/pairingHeap` 정본에 **핸들과 키 낮추기를 더한** 우선순위 큐. 키 낮추기는
 * 낮춘 원소를 부모와 자리를 바꿔 가며 **부모보다 뒤서지 않을 때까지 위로 올린다.**
 *
 * 넣기·빼기·합치기·조회 셋은 정본(`../../heap/pairingHeap/_reference/pairingHeap.ts`)과 같다 —
 * 마디마다 부모를 하나 더 들고, 원소를 마디가 아니라 따로 둔 칸에 담아 핸들이 그 칸을 가리키게
 * 한 것만 다르다. 자리를 바꿀 때 칸을 바꾸므로 핸들은 제 원소를 따라간다. 자명한 구현이 아니고
 * **답은 전부 옳다**(축1 통과).
 *
 * **이 fixture 는 두 계약 사이의 포섭이 진부분이라는 것을 재려고 지었다**(§규약1 「연산 집합이
 * 갈린 계약의 포섭은 정본 교차로 못 잰다」 — 담기는 쪽만 만족하는 구현이 두 계약에서 어떻게
 * 갈리는가). 키 낮추기를 뺀 여섯 행은 계약 C 의 정본 그대로이므로 C 를 지키고, 그 위에 더한
 * 한 행에서만 계약 D 를 어긴다.
 *
 * - **`decreaseKey` 의 적대적 시나리오에서 걸린다**(호출 평균 1,024 · 4,096 · 16,384). 내림차순으로
 *   넣으면 새 원소가 늘 뿌리가 되어 원소들이 **한 줄로 선다.** 먼저 넣은 원소일수록 깊고, 그것을
 *   최우선보다 앞서게 낮추면 줄의 길이만큼 자리를 바꾼다. 올라간 원소 대신 나머지가 한 칸씩
 *   내려가므로 다음 원소도 같은 깊이다.
 * - **`decreaseKey` 의 무작위 시나리오는 통과한다**(3.16 · 3.36 · 2.49). 빼기가 한 번 돈 뒤에는
 *   뿌리 아래가 얕아서 올리는 길이 짧다 — 이 계열의 위반은 줄로 선 상태에서만 보인다.
 * - 나머지 다섯 시나리오도 통과한다. **`heap/pairingHeap` 계약의 다섯 시나리오도 전부 통과한다** —
 *   키 낮추기를 뺀 여섯 행이 그쪽 정본 그대로이기 때문이다. 하네스 자기시험이 두 계약에서의 결과를
 *   나란히 고정한다.
 */

/** 원소 하나를 담는 칸. 핸들이 이것을 가리키고, 자리를 바꿀 때 마디 사이를 옮겨 다닌다. */
class Slot<T> {
  item: T;
  node: Node<T>;
  alive = true;

  constructor(item: T, node: Node<T>) {
    this.item = item;
    this.node = node;
  }
}

/** 마디 하나. 자식은 `child` 에서 시작해 `sibling` 으로 이어지는 목록이다. */
class Node<T> {
  slot: Slot<T>;
  parent: Node<T> | null = null;
  child: Node<T> | null = null;
  sibling: Node<T> | null = null;

  constructor(item: T) {
    this.slot = new Slot(item, this);
  }
}

export class SiftingLinkingHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #root: Node<T> | null = null;
  #count = 0;

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): Slot<T> {
    this.__cost += 1;
    const node = new Node(item);
    this.#root = this.#link(this.#root, node);
    this.#count += 1;
    return node.slot;
  }

  dequeue(): T | null {
    this.__cost += 1;
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#combine(root.child);
    this.#count -= 1;
    root.slot.alive = false;
    return root.slot.item;
  }

  decreaseKey(handle: Slot<T>, item: T): boolean {
    this.__cost += 1;
    if (!handle.alive || this.#compare(item, handle.item) > 0) return false;

    handle.item = item;
    let node = handle.node;
    let parent = node.parent;
    while (parent !== null && this.#compare(item, parent.slot.item) < 0) {
      this.__cost += 1;
      const above = parent.slot;
      parent.slot = node.slot;
      parent.slot.node = parent;
      node.slot = above;
      above.node = node;
      node = parent;
      parent = node.parent;
    }
    return true;
  }

  merge(other: SiftingLinkingHeap<T>): void {
    if (other === this) {
      throw new TypeError("자기 자신과 합칠 수 없다");
    }
    this.__cost += 1;
    this.#root = this.#link(this.#root, other.#root);
    this.#count += other.#count;
    other.#root = null;
    other.#count = 0;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#root === null ? null : this.#root.slot.item;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#count === 0;
  }

  #link(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;

    this.__cost += 1;
    const [top, under] =
      this.#compare(b.slot.item, a.slot.item) < 0 ? [b, a] : [a, b];
    under.sibling = top.child;
    under.parent = top;
    top.child = under;
    top.parent = null;
    return top;
  }

  #combine(first: Node<T> | null): Node<T> | null {
    const paired: Node<T>[] = [];
    let at = first;
    while (at !== null) {
      this.__cost += 1;
      const second = at.sibling;
      at.sibling = null;
      at.parent = null;
      if (second === null) {
        paired.push(at);
        break;
      }
      const next = second.sibling;
      second.sibling = null;
      second.parent = null;
      paired.push(this.#link(at, second) as Node<T>);
      at = next;
    }

    let merged: Node<T> | null = null;
    for (let index = paired.length - 1; index >= 0; index--) {
      merged = this.#link(paired[index] as Node<T>, merged);
    }
    return merged;
  }
}
