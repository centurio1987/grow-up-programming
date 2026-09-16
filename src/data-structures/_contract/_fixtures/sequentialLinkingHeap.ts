/**
 * 결함 fixture — 넣기와 합치기를 뿌리 둘을 잇는 일 하나로 끝내고, 빼기 때 남은 자식들을
 * **왼쪽부터 한 줄로 차례차례** 이어 나무 하나로 만드는 우선순위 큐.
 *
 * `heap/pairingHeap` 정본(`../../heap/pairingHeap/_reference/pairingHeap.ts`)에서 **한 곳만**
 * 바꿨다 — 형제 목록을 두 번(둘씩 잇고, 오른쪽 끝에서부터 잇기) 훑던 것을 한 번 훑으며
 * 쌓아 가는 것으로. 자명한 구현이 아니고(미뤄 두기와 한꺼번에 갚기가 들어가 있다) **답은
 * 전부 옳다**(축1 통과). 넣기·합치기·조회 셋도 정본과 같이 실제로 상수다.
 *
 * 걸리는 것은 `dequeue` 한 행이고, 그 행을 겨눈 시나리오 둘에서 함께 걸린다.
 *
 * - **비싼 빼기가 이따금이 아니라 흔하다.** 크기 유지 교대에서 호출 평균이 491.75 · 1,961.19 ·
 *   7,865.25 로 담긴 수를 따라가고, n = 1,024 에서 호출 비용의 중앙값이 322 다(정본은 20).
 *   정본도 넣기 n 번 뒤 처음 몇 호출은 비싸지만(1,445) 곧 로그 언저리로 내려오는데 이 계열은
 *   내려오지 않는다 — 그래서 한정자를 `amortized` 로 내린 계약에서도 걸린다.
 * - 이 계열이 보여 주는 것은 **빼기를 상각으로 내렸다고 접는 방법이 아무것이나 되는 것이
 *   아니다**라는 것이다. `heap/pairingHeap` 계약의 빼기 행은 한정자만 약할 뿐 상한은
 *   로그이고, 그 상한을 내는 것이 두 번 훑기다.
 *
 * **입력 방향에 따라 이 계열이 걸리지 않는 자리가 있다.** 오름차순이나 내림차순으로 넣은 뒤
 * 빼면 뿌리 아래가 한 줄(길)로 서서 빼기마다 상수다 — 계약 스위트의 빼기 시나리오 둘이
 * 무작위 값으로 채우는 이유다(불변 사실 57: 적대성은 (계약, 구현) 쌍에 대해 정의된다).
 */

/** 마디 하나. 자식은 `child` 에서 시작해 `sibling` 으로 이어지는 목록이다. */
class Node<T> {
  item: T;
  child: Node<T> | null = null;
  sibling: Node<T> | null = null;

  constructor(item: T) {
    this.item = item;
  }
}

export class SequentialLinkingHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #root: Node<T> | null = null;
  #count = 0;

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.__cost += 1;
    this.#root = this.#link(this.#root, new Node(item));
    this.#count += 1;
  }

  dequeue(): T | null {
    this.__cost += 1;
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#fold(root.child);
    this.#count -= 1;
    return root.item;
  }

  merge(other: SequentialLinkingHeap<T>): void {
    if (other === this) throw new TypeError("자기 자신과 합칠 수 없다");
    this.__cost += 1;
    this.#root = this.#link(this.#root, other.#root);
    this.#count += other.#count;
    other.#root = null;
    other.#count = 0;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#root === null ? null : this.#root.item;
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
    const [top, under] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    under.sibling = top.child;
    top.child = under;
    return top;
  }

  /** 정본과 갈리는 유일한 자리 — 형제 목록을 왼쪽부터 한 번 훑으며 차례로 잇는다. */
  #fold(first: Node<T> | null): Node<T> | null {
    let merged: Node<T> | null = null;
    let at = first;
    while (at !== null) {
      this.__cost += 1;
      const next = at.sibling;
      at.sibling = null;
      merged = this.#link(merged, at);
      at = next;
    }
    return merged;
  }
}
