/**
 * `heap/pairingHeap` 정본(규약2).
 *
 * 계약은 `../pairingHeap.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 자식을 반대 순서로 붙이는
 * `_contract/_fixtures/mergeableLinkingHeap.ts` 도 이 계약의 시나리오를 전부 통과한다(하네스
 * 자기시험이 고정한다). 이 파일이 정본인 것은 계약이 고른 계급을 짧은 코드로 대표하기
 * 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 마디)를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost` 는 계약이
 * 아니라 정본의 의무다(불변 사실 23). 공개 연산 한 번에 1, 뿌리 둘을 잇는 일 한 번에 1,
 * 빼기가 형제 목록을 훑으며 지나가는 마디 하나에 1 이다.
 *
 * **이 구현이 하는 일은 둘뿐이다 — 뿌리 둘을 잇기와, 형제 목록을 두 번 훑어 하나로 접기.**
 * 잇기는 두 뿌리 중 비교자가 앞세우는 쪽을 위에 두고 진 쪽을 그 **맨 앞 자식**으로 붙인다.
 * 넣기는 마디 하나짜리 나무와, 합치기는 상대의 뿌리와 한 번 잇는 일이라 둘 다 호출마다
 * 상수다. 모든 비용은 빼기가 치른다 — 뿌리를 들어내면 그 자식들이 형제 목록으로 남고,
 * 그것을 **왼쪽부터 둘씩 이은 뒤 오른쪽 끝에서부터 차례로 이어** 나무 하나로 만든다.
 *
 * **두 번 훑는 것이 상한을 만든다.** 형제 목록을 왼쪽부터 한 줄로 이어 버리면 답은 같고
 * 넣기·합치기도 그대로 상수인데, 빼기가 담긴 수에 비례하는 상태가 되풀이된다 —
 * `_contract/_fixtures/sequentialLinkingHeap.ts` 가 이 파일에서 그 한 곳만 바꾼 것이다.
 * 두 번 훑는 방식의 상각 상한은 문헌의 결과다 — 넣기 $O(1)$ · 합치기 0 · 빼기 $O(\log n)$
 * 상각(Iacono, SWAT 2000 · 더 짧은 증명 Sinnamon & Tarjan, arXiv:2208.11791). **계약은
 * 이 결과에 기대지 않는다** — 헤더의 상한은 하한과 「그 값을 내는 구현이 있다」에서 서고,
 * 이 파일이 그 구현 자리를 축3에서 짚는다.
 *
 * **합치기는 넘겨받은 큐를 비운다.** 계약이 그렇게 적었으므로 마디를 복사하지 않고 그대로
 * 가져다 쓴다 — 두 큐가 같은 마디를 함께 가리킨 채로 남으면 한쪽의 빼기가 다른 쪽 상태를
 * 바꾼다.
 */

// #region guide:core/node
/** 마디 하나. 자식은 `child` 에서 시작해 `sibling` 으로 이어지는 목록이다. */
class Node<T> {
  item: T;
  child: Node<T> | null = null;
  sibling: Node<T> | null = null;

  constructor(item: T) {
    this.item = item;
  }
}
// #endregion

// #region guide:core/class
export class PairingHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #root: Node<T> | null = null;
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

  enqueue(item: T): void {
    this.__cost += 1;
    this.#root = this.#link(this.#root, new Node(item));
    this.#count += 1;
  }

  dequeue(): T | null {
    this.__cost += 1;
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#combine(root.child);
    this.#count -= 1;
    return root.item;
  }

  merge(other: PairingHeap<T>): void {
    if (other === this) {
      throw new TypeError(
        "자기 자신과 합칠 수 없다 — 넘겨받은 큐를 비우는 일과 담는 일이 같은 큐에서 서로를 부정한다",
      );
    }
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

  /** 뿌리 둘을 잇는다. 진 쪽이 이긴 쪽의 맨 앞 자식이 된다. 호출 하나가 상수다. */
  #link(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;

    this.__cost += 1;
    const [top, under] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    under.sibling = top.child;
    top.child = under;
    return top;
  }

  /**
   * 형제 목록을 나무 하나로 접는다. 빼기만 이 함수를 부른다.
   *
   * 첫 번째 훑기가 왼쪽부터 둘씩 잇고, 두 번째 훑기가 그 결과를 오른쪽 끝에서부터 차례로
   * 잇는다. 형제 목록의 왼쪽이 나중에 붙은 자식이다.
   */
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
// #endregion
