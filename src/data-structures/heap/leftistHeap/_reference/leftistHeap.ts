/**
 * `heap/leftistHeap` 정본(규약2).
 *
 * 계약은 `../leftistHeap.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 나무를 차수별로 세워 두고 이진수
 * 덧셈처럼 합치는 구현도(`heap/binomialHeap`) 여섯 행을 전부 지킨다. 이 파일이 정본인 것은
 * 계약이 고른 계급을 가장 단순하게 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 마디)를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost` 는 계약이
 * 아니라 정본의 의무다(불변 사실 23).
 *
 * **오른쪽 길로만 합치는 것이 이 구현의 전부다.** 두 나무의 뿌리 중 비교자가 앞세우는 쪽을
 * 위에 두고, 진 쪽을 이긴 쪽의 **오른쪽 부분나무와 다시 합친다.** 합치기가 끝난 자리마다
 * 왼쪽 길이가 오른쪽보다 짧으면 좌우를 바꾸므로, 오른쪽 길의 마디 수가 $\log_2(n+1)$ 을
 * 넘지 못한다 — 오른쪽 길에 마디가 $k$ 개면 그 나무에 적어도 $2^k - 1$ 개가 들어 있다.
 * 넣기는 마디 하나짜리 나무와 합치는 일이고, 빼기는 뿌리를 들어내고 남은 두 부분나무를
 * 합치는 일이라 **세 갱신이 모두 같은 한 함수**로 적힌다.
 *
 * **`#rank` 는 오른쪽 길의 마디 수다.** 합치기가 좌우를 바꿀지 정하는 데만 쓰이고 계약이
 * 관측하지 못한다 — 어긋나면 오른쪽 길이 길어져 상한이 무너지므로 축3이 걸음 수에서
 * 잡는다(값은 그대로 옳다. 불변 사실 109 와 같은 자리이고, 이쪽은 축3에 관측 경로가 있다).
 *
 * **합치기는 넘겨받은 큐를 비운다.** 계약이 그렇게 적었으므로 마디를 복사하지 않고 그대로
 * 가져다 쓴다 — 두 큐가 같은 마디를 함께 가리킨 채로 남으면 한쪽의 빼기가 다른 쪽 상태를
 * 바꾼다.
 */

// #region guide:core/node
/** 마디 하나. `rank` 는 오른쪽 길의 마디 수다. */
class Node<T> {
  item: T;
  rank = 1;
  left: Node<T> | null = null;
  right: Node<T> | null = null;

  constructor(item: T) {
    this.item = item;
  }
}
// #endregion

// #region guide:core/class
export class LeftistHeap<T> {
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
    this.#root = this.#union(this.#root, new Node(item));
    this.#count += 1;
  }

  dequeue(): T | null {
    this.__cost += 1;
    const root = this.#root;
    if (root === null) return null;

    this.#root = this.#union(root.left, root.right);
    this.#count -= 1;
    return root.item;
  }

  merge(other: LeftistHeap<T>): void {
    if (other === this) {
      throw new TypeError(
        "자기 자신과 합칠 수 없다 — 넘겨받은 큐를 비우는 일과 담는 일이 같은 큐에서 서로를 부정한다",
      );
    }
    this.__cost += 1;
    this.#root = this.#union(this.#root, other.#root);
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

  /**
   * 두 나무를 하나로 접는다. 세 갱신이 전부 이 함수를 부른다.
   *
   * 되돌이 호출의 깊이는 두 나무의 오른쪽 길 길이의 합이라 마디 수의 로그를 넘지 않는다.
   */
  #union(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;

    this.__cost += 1;
    // 비교자가 앞세우는 쪽이 위에 선다. 진 쪽은 이긴 쪽의 오른쪽과 다시 합친다.
    const [top, rest] = this.#compare(b.item, a.item) < 0 ? [b, a] : [a, b];
    top.right = this.#union(top.right, rest);

    // 오른쪽이 길어졌으면 좌우를 바꾼다. 이 두 줄이 오른쪽 길을 로그 안에 묶는다.
    if (rankOf(top.left) < rankOf(top.right)) {
      const swap = top.left;
      top.left = top.right;
      top.right = swap;
    }
    top.rank = rankOf(top.right) + 1;
    return top;
  }
}

/** 빈 자리의 오른쪽 길 마디 수는 0 이다. */
function rankOf<T>(node: Node<T> | null): number {
  return node === null ? 0 : node.rank;
}
// #endregion
