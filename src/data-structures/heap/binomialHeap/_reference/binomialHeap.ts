/**
 * `heap/binomialHeap` 정본(규약2).
 *
 * 계약은 `../binomialHeap.ts` 헤더 한 곳이고, 그 계약은 `heap/leftistHeap` 의 계약과
 * **같다.** 이 파일은 같은 계약을 다른 기법으로 지키는 구현이다 — 성격 전환의 산출물 넷 중
 * 하나이고(§규약1 「성격 전환은 이렇게 적는다」), 넷을 남겨 둔 이유가 바로 이 파일이
 * 저쪽과 다르다는 것이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 나무 자리 하나·마디 하나)를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.**
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **자리를 차수로 세우고 이진수 덧셈처럼 합치는 것이 이 구현의 전부다.** 차수 $d$ 의 나무는
 * 마디를 정확히 $2^d$ 개 담으므로 한 차수에 나무가 둘이면 하나로 이어 붙여 차수 $d+1$ 로
 * 올린다 — 이진수의 올림과 같은 모양이고, 그래서 합치기가 두 수를 더하는 일이 된다.
 * 넣기는 차수 0 짜리 하나를 더하는 일이고, 빼기는 앞선 뿌리를 들어낸 뒤 그 자식들
 * (차수 0..k-1 이 하나씩)을 다시 더하는 일이다. 셋 다 자릿수 = $\lfloor\log_2 n\rfloor + 1$
 * 를 넘지 않는다.
 *
 * **최우선 원소를 따로 든다.** 뿌리 목록을 훑어 답하면 자리 수만큼 걸리므로 `peek` 이
 * $O(\log n)$ 이 되고, 계약은 그것을 `worst O(1)` 로 적었다. 이어 붙이기는 진 쪽을 이긴 쪽의
 * 자식으로 내리므로 **뿌리 전체의 최소가 이어 붙이기로 바뀌지 않는다** — 넣기와 합치기는
 * 견주기 한 번으로 갱신되고, 앞선 원소를 실제로 들어내는 빼기만 다시 훑는다.
 *
 * **`children[i]` 의 차수가 `i` 인 것은 이어 붙이기가 유지한다.** 계약이 관측하지 못하는
 * 내부 성질이고(불변 사실 36), 어긋나면 빼기가 자리를 잘못 더해 답이 틀리므로 축1이 잡는다.
 */

// #region guide:core/node
/** 마디 하나. `children[i]` 는 차수 `i` 짜리 부분나무다(차수 오름차순). */
class BinomialNode<T> {
  item: T;
  children: BinomialNode<T>[] = [];

  constructor(item: T) {
    this.item = item;
  }
}
// #endregion

// #region guide:core/class
export class BinomialHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 자리 `d` 에 차수 `d` 짜리 나무 하나 또는 빈자리. 이진수의 자릿수와 같은 모양이다. */
  #trees: (BinomialNode<T> | null)[] = [];
  #count = 0;
  /** 최우선 원소. 뿌리 목록을 훑지 않고 답하기 위해 따로 든다. */
  #top: T | null = null;

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
    this.#add([new BinomialNode(item)]);
    this.#count += 1;
    if (this.#top === null || this.#compare(item, this.#top) < 0) {
      this.#top = item;
    }
  }

  dequeue(): T | null {
    this.__cost += 1;
    const at = this.#topSlot();
    if (at < 0) return null;

    const taken = this.#trees[at] as BinomialNode<T>;
    this.#trees[at] = null;
    this.#count -= 1;
    // 들어낸 뿌리의 자식들은 차수 0..at-1 짜리 나무 하나씩이라 그대로 더할 수 있다.
    this.#add(taken.children);
    this.#top = this.#scanTop();
    return taken.item;
  }

  merge(other: BinomialHeap<T>): void {
    if (other === this) {
      throw new TypeError(
        "자기 자신과 합칠 수 없다 — 넘겨받은 큐를 비우는 일과 담는 일이 같은 큐에서 서로를 부정한다",
      );
    }
    this.__cost += 1;
    this.#add(other.#trees);
    this.#count += other.#count;
    if (
      other.#top !== null &&
      (this.#top === null || this.#compare(other.#top, this.#top) < 0)
    ) {
      this.#top = other.#top;
    }
    other.#trees = [];
    other.#count = 0;
    other.#top = null;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#top;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#count === 0;
  }

  /**
   * 나무 목록을 자리별로 더한다. 자리마다 셋(내 나무·더할 나무·올림) 중 둘이 차면 하나로
   * 이어 붙여 다음 자리로 올린다 — 이진수 덧셈 그대로다.
   *
   * 더할 나무가 남지 않고 올림도 끝나면 멈춘다. 내 자리가 그보다 높이 남아 있어도 훑지
   * 않으므로 **넣기 한 번의 비용이 올림이 이어진 길이**이고, 그 길이가 자릿수를 넘지 못한다.
   */
  #add(incoming: readonly (BinomialNode<T> | null)[]): void {
    let carry: BinomialNode<T> | null = null;

    for (let at = 0; at < incoming.length || carry !== null; at++) {
      const adding = incoming[at] ?? null;

      this.__cost += 1;
      while (this.#trees.length <= at) this.#trees.push(null);
      const mine = this.#trees[at] ?? null;
      const present = [mine, adding, carry].filter(
        (tree): tree is BinomialNode<T> => tree !== null,
      );

      if (present.length === 3) {
        // 셋이면 하나를 자리에 두고 나머지 둘을 올린다.
        this.#trees[at] = present[0] as BinomialNode<T>;
        carry = this.#link(
          present[1] as BinomialNode<T>,
          present[2] as BinomialNode<T>,
        );
        continue;
      }
      if (present.length === 2) {
        this.#trees[at] = null;
        carry = this.#link(
          present[0] as BinomialNode<T>,
          present[1] as BinomialNode<T>,
        );
        continue;
      }
      this.#trees[at] = present[0] ?? null;
      carry = null;
    }
  }

  /** 같은 차수 둘을 하나로 잇는다. 비교자가 앞세우는 쪽이 위에 서고 진 쪽이 자식이 된다. */
  #link(a: BinomialNode<T>, b: BinomialNode<T>): BinomialNode<T> {
    this.__cost += 1;
    const [top, under] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    top.children.push(under);
    return top;
  }

  /** 최우선 원소가 뿌리로 선 자리. 비어 있으면 -1 이다. */
  #topSlot(): number {
    let found = -1;
    let best: BinomialNode<T> | null = null;
    for (let at = 0; at < this.#trees.length; at++) {
      const tree = this.#trees[at] ?? null;
      if (tree === null) continue;
      this.__cost += 1;
      if (best === null || this.#compare(tree.item, best.item) < 0) {
        found = at;
        best = tree;
      }
    }
    return found;
  }

  #scanTop(): T | null {
    const at = this.#topSlot();
    return at < 0 ? null : (this.#trees[at] as BinomialNode<T>).item;
  }
}
// #endregion
