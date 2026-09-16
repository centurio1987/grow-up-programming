/**
 * 결함 fixture — 넣은 원소를 줄에 쌓아 두다가 **쌓인 수가 이미 이어 둔 수를 넘으면 한꺼번에
 * 이어 붙이는** 우선순위 큐. 빼기는 `heap/pairingHeap` 정본과 같다(두 번 훑기).
 *
 * 자명한 구현이 아니고(미뤄 두기와 한꺼번에 갚기가 들어가 있다) **답은 전부 옳다**(축1
 * 통과). 쌓인 줄의 최우선 원소를 넣을 때마다 따로 들고 있으므로 조회 셋도 상수다.
 *
 * **이 fixture 는 넣기 행의 한정자가 무엇을 사는지를 재려고 지었다.** 현실의 흔한 실수가
 * 아니라 「넣기를 `amortized O(1)` 로 적으면 무엇이 들어오는가」에 답하는 판정 도구다
 * (불변 사실 196 의 두 갈래 중 뒤쪽).
 *
 * - **`enqueue` 시나리오는 걸린다.** 이어 둔 수가 $2^k-1$ 이 되는 자리마다 쌓인 줄 전부를
 *   잇는 호출이 하나 있고, 그 한 호출이 담긴 수의 절반에 비례한다. `worst` 통계가 최댓값이라
 *   그 한 번이 그대로 보고된다.
 * - **같은 입력을 `amortized` 로 다시 재면 통과한다.** 한꺼번에 잇는 일이 크기가 두 배가 될
 *   때마다 한 번이라 원소 하나가 이어지는 일은 평생 한 번이다 — 호출 평균이 상수로 남는다.
 *   **이 계약이 넣기를 `worst` 로 적어 추가로 배제하는 계열이 이것이다**(§규약1 「강한
 *   한정자의 근거는 추가로 배제되는 계열을 수치로 낸다」).
 * - **`merge` 시나리오도 걸린다 — 채우는 수가 2의 거듭제곱이 아닐 때만.** 합치기가 양쪽의
 *   쌓인 줄을 먼저 이어 붙이므로 쌓인 수만큼 든다. 넘겨받는 큐를 $3n/4$ 개로 채우면 쌓인 줄이
 *   $n/4$ 를 넘어 520 · 2,056 · 8,200 이다. **양쪽을 $n/2$ 개씩 채우면 통과한다**(8.00 고정) —
 *   문턱이 두 배씩 오르는 이 설계의 한꺼번에 잇기가 2의 거듭제곱 크기에서 막 끝나 있기
 *   때문이고, 그 통과에는 계약 위반이 숨어 있다(불변 사실 62). 계약 스위트가 채우는 수를
 *   고른 이유가 이것이다.
 * - 합치기 쪽은 `amortized` 로 다시 재는 비교를 할 수 없다. 합치기 시나리오가 호출 셋만 재고
 *   상각은 n 회 측정을 요구한다(§규약2 시나리오 규칙 4).
 * - `dequeue`·`peek`·`size`·`isEmpty` 는 통과하고 거기에는 위반이 없다. 빼기가 쌓인 줄을
 *   먼저 이어도 그 몫은 원소마다 한 번이라 상각 평균에 상수만 더한다.
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

export class BufferedLinkingHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #root: Node<T> | null = null;
  /** 나무에 이어 둔 원소 수. */
  #linked = 0;
  /** 아직 잇지 않은 원소들. */
  #pending: T[] = [];
  /** `#pending` 의 최우선 원소. 넣을 때마다 고친다. */
  #pendingTop: T | null = null;

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.__cost += 1;
    this.#pending.push(item);
    if (
      this.#pendingTop === null ||
      this.#compare(item, this.#pendingTop) < 0
    ) {
      this.#pendingTop = item;
    }
    if (this.#pending.length > this.#linked) this.#flush();
  }

  dequeue(): T | null {
    this.__cost += 1;
    this.#flush();
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#combine(root.child);
    this.#linked -= 1;
    return root.item;
  }

  merge(other: BufferedLinkingHeap<T>): void {
    if (other === this) throw new TypeError("자기 자신과 합칠 수 없다");
    this.__cost += 1;
    this.#flush();
    other.#flush();
    this.#root = this.#link(this.#root, other.#root);
    this.#linked += other.#linked;
    other.#root = null;
    other.#linked = 0;
  }

  peek(): T | null {
    this.__cost += 1;
    const top = this.#root === null ? null : this.#root.item;
    if (this.#pendingTop === null) return top;
    if (top === null) return this.#pendingTop;
    return this.#compare(this.#pendingTop, top) < 0 ? this.#pendingTop : top;
  }

  size(): number {
    this.__cost += 1;
    return this.#linked + this.#pending.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#linked + this.#pending.length === 0;
  }

  /** 쌓인 줄을 전부 나무에 잇는다. 쌓인 수에 비례한다. */
  #flush(): void {
    for (const item of this.#pending) {
      this.__cost += 1;
      this.#root = this.#link(this.#root, new Node(item));
    }
    this.#linked += this.#pending.length;
    this.#pending = [];
    this.#pendingTop = null;
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

  #combine(first: Node<T> | null): Node<T> | null {
    const paired: Node<T>[] = [];
    let at = first;
    while (at !== null) {
      this.__cost += 1;
      const second = at.sibling;
      at.sibling = null;
      if (second === null) {
        paired.push(at);
        break;
      }
      const next = second.sibling;
      second.sibling = null;
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
