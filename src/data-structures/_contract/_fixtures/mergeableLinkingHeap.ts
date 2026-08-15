/**
 * 결함 fixture — 넣기와 합치기를 **뿌리 둘을 잇는 일 하나**로 끝내고, 밀린 일을 빼기 때
 * 한꺼번에 짝지어 접는 우선순위 큐.
 *
 * 자명한 구현이 아니다 — 미뤄 두기와 한꺼번에 갚기라는 상각 설계가 들어가 있고, **답은 전부
 * 옳다**(축1 통과). 그리고 이 계열은 `heap/priorityQueue` 계약(갱신 둘이 `amortized`)을
 * 지킨다. 걸리는 것은 **한정자 하나**다.
 *
 * 걸리는 자리와 통과하는 자리가 이 fixture 의 요점이다.
 *
 * - **`dequeue` 시나리오.** 넣기 n 번 뒤의 첫 빼기가 뿌리에 매달린 자식 n-1 개를 전부
 *   짝지어야 하므로 담긴 수에 비례한다. `worst` 통계가 최댓값이라 그 한 번이 그대로
 *   보고된다 — 시퀀스 평균으로 재면 묻힌다(불변 사실 63).
 * - **`enqueue`·`merge` 시나리오는 통과한다. 그 통과에는 계약 위반이 없다** — 둘 다 실제로
 *   상수이고, 상수는 `O(log n)` 허용 구간 안이다(축3은 상한이 아니라 성장 계급을 본다.
 *   §규약2 「축3은 상한이 아니라 성장 계급을 판정한다」).
 *
 * **이 계열을 배제하는 것이 갱신 셋을 `worst` 로 적은 이유다.** 상수 시간 넣기·합치기를
 * 약속하는 계약은 따로 있고(`heap/pairingHeap`), 그 계약은 대신 빼기를 상각으로 내린다.
 */

/** 마디 하나. 자식은 이어 붙인 순서대로 쌓인다. */
class LinkedNode<T> {
  item: T;
  children: LinkedNode<T>[] = [];

  constructor(item: T) {
    this.item = item;
  }
}

export class MergeableLinkingHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #root: LinkedNode<T> | null = null;
  #count = 0;

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.__cost += 1;
    this.#root = this.#link(this.#root, new LinkedNode(item));
    this.#count += 1;
  }

  /** 밀린 일을 여기서 갚는다. 뿌리에 매달린 자식이 많을수록 이 한 호출이 비싸다. */
  dequeue(): T | null {
    this.__cost += 1;
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#twoPass(root.children);
    this.#count -= 1;
    return root.item;
  }

  merge(other: MergeableLinkingHeap<T>): void {
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

  /** 뿌리 둘을 잇는다. 진 쪽이 이긴 쪽의 자식이 된다. 호출 하나가 상수다. */
  #link(
    a: LinkedNode<T> | null,
    b: LinkedNode<T> | null,
  ): LinkedNode<T> | null {
    if (a === null) return b;
    if (b === null) return a;
    this.__cost += 1;
    const [top, under] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    top.children.push(under);
    return top;
  }

  /** 왼쪽에서 짝지어 잇고, 오른쪽에서 되감아 하나로 만든다. */
  #twoPass(children: readonly LinkedNode<T>[]): LinkedNode<T> | null {
    const paired: LinkedNode<T>[] = [];
    for (let at = 0; at < children.length; at += 2) {
      const left = children[at] as LinkedNode<T>;
      const right =
        at + 1 < children.length ? (children[at + 1] ?? null) : null;
      paired.push(this.#link(left, right) as LinkedNode<T>);
    }

    let merged: LinkedNode<T> | null = null;
    for (let at = paired.length - 1; at >= 0; at--) {
      merged = this.#link(paired[at] as LinkedNode<T>, merged);
    }
    return merged;
  }
}
