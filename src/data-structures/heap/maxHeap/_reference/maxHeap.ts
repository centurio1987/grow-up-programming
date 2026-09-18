/**
 * `heap/maxHeap` 정본(규약2).
 *
 * 계약은 `../maxHeap.ts` 헤더 한 곳이고, 그 계약은 `heap/priorityQueue` 의 계약과 **같다.**
 * 스위트도 저쪽 것을 그대로 돌린다(`../maxHeap.contract.ts`).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 그 자리의
 * 원소를 견주거나 옮기면 지나간 것이고, **읽기와 쓰기를 따로 세지 않는다**
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **「최대」는 이 파일의 성질이 아니다.** 최우선 원소가 무엇인지는 생성자가 받은 비교자가
 * 정한다. 계약 스위트는 오름차순 비교자를 주입하므로 이 클래스는 **최솟값부터 내놓는다** —
 * 그리고 그것이 계약 위반이 아니다. 「최소 힙」과 「최대 힙」은 비교자를 뒤집은 같은 문장이고
 * (§규약1 「힙 여덟의 판정」 1단계), 그 사실이 이 디렉터리가 남아 있는 이유다.
 *
 * **자리를 이어 붙이지 않고 마디를 잇는다.** 배열 한 줄에 접어 담는 나머지 셋과 갈리는
 * 자리다. 마디마다 자식 참조 둘을 두고, **넣기·빼기를 합치기 하나로** 처리한다.
 * - 넣기 = 마디 하나짜리 힙과 합치기
 * - 빼기 = 뿌리를 걷어내고 남은 두 자식을 합치기
 *
 * **합치기는 오른쪽 길만 타고 내려가면서 좌우를 맞바꾼다.** 맞바꾸기가 없으면 오른쪽 길이
 * 계속 길어져 한쪽으로 늘어선 사슬이 되고, 그때 합치기 하나가 담긴 원소 수에 비례한다.
 * 맞바꾸면 길게 걸어 내려간 그 길이 통째로 왼쪽으로 옮겨져 다음 합치기가 짧아진다.
 *
 * **이 정본이 드는 논증은 상각뿐이다.** 오른쪽 길의 길이를 묶어 주는 것이 아무것도 없고,
 * 서 있는 것은 「길게 내려간 길을 왼쪽으로 치워 두므로 다음 합치기가 짧아진다」 하나다.
 * 계약이 갱신 둘을 `amortized` 로 적었기 때문에 이 구현이 들어온다. **다만 단일 호출을
 * 원소 수에 비례하게 만드는 입력은 못 찾았다** — 일곱 형태를 시도했고 전부 로그였다
 * (`../maxHeap.ts` 헤더의 세 번째 갈림 시도에 수치가 있다).
 *
 * **높이를 들고 다니지 않는 것도 계약에 없다.** 마디마다 오른쪽 길의 길이를 적어 두고
 * 짧은 쪽을 오른쪽에 두면 합치기의 단일 호출이 로그로 묶인다(그 계약이
 * `heap/leftistHeap` 이다 — 그쪽은 합치기를 표면에 내놓으므로 계약 자체가 다르다).
 * 여기서는 그 정수 하나를 두지 않는 대신 그 논증을 놓았고, **이 계약은 둘을 가르지
 * 않는다.**
 */

// #region guide:core/types
/**
 * 마디 하나. 부모 참조가 없다 — 넣기도 빼기도 위로 거슬러 올라가지 않는다.
 *
 * 배열에 접어 담는 나머지 셋에서는 이 자리가 색인 계산으로 대신되고, 참조 둘이 사라진다.
 * **둘 중 어느 쪽도 계약의 문장이 아니다.**
 */
interface Node<T> {
  item: T;
  left: Node<T> | null;
  right: Node<T> | null;
}
// #endregion

// #region guide:core/class
export class MaxHeap<T> {
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
    this.#root = this.#merge(this.#root, { item, left: null, right: null });
    this.#count += 1;
  }

  dequeue(): T | null {
    const root = this.#root;
    this.__cost += 1;
    if (root === null) return null;

    this.#root = this.#merge(root.left, root.right);
    this.#count -= 1;
    return root.item;
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#root === null ? null : this.#root.item;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  /**
   * 두 힙을 하나로 합친다.
   *
   * 비교자가 앞세우는 쪽이 뿌리가 되고, 그 뿌리의 **오른쪽**에 나머지를 합쳐 넣는다.
   * 그리고 좌우를 맞바꾼다 — 방금 길게 걸어 내려간 길을 왼쪽으로 치워 두는 일이다.
   */
  #merge(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    let first = a;
    let second = b;
    if (first === null) return second;
    if (second === null) return first;

    this.__cost += 1;
    if (this.#compare(second.item, first.item) < 0) {
      const swapped = first;
      first = second;
      second = swapped;
    }

    first.right = this.#merge(first.right, second);

    // **이 세 줄이 이 구현의 전부다.** 빼면 오른쪽 길이 자라기만 해서 사슬이 된다.
    const moved = first.left;
    first.left = first.right;
    first.right = moved;
    return first;
  }
}
// #endregion
