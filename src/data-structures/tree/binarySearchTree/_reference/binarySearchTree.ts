/**
 * `tree/binarySearchTree` 정본(규약2).
 *
 * 계약은 `../binarySearchTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — **나란한 넷의 정본 전부와 정렬
 * 배열까지 이 계약을 지킨다.** 계약이 요구하는 것은 여덟 행이 원소 수에 비례하는 비용
 * 안에 든다는 것뿐이고, 로그 안에 드는 구현은 선형 안에도 들기 때문이다.
 *
 * **그래서 이 파일이 고른 것은 「계약을 지키는 방법」이 아니라 「계약이 로그를 약속하지
 * 않아서 담기는 것」이다.** 높이를 스스로 묶지 않는다 — 넣는 값이 늘 앞선 값보다 크면
 * 오른쪽으로만 자라 사슬이 되고, 그 상태에서 찾기 하나가 원소 수에 비례한다. 나란한 넷의
 * 정본은 어느 것도 그렇게 되지 않고, **그 차이가 곧 계약의 차이다.**
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — 나란한 넷과
 * 같은 단위를 쓴다. 읽기와 쓰기를 따로 세지 않는다(§규약2 계측 단위). `__cost` 는 계약이
 * 아니라 정본의 의무다(불변 사실 23).
 *
 * **되돌이 호출을 쓰지 않는다.** 세 연산(`delete`·`range`·`toArray`)이 전부 반복문이고,
 * 그 이유가 이 구조에만 있다 — 나란한 넷은 높이가 로그에 묶여 있어 되돌이 깊이가 스무
 * 단을 넘지 않지만, **이 구현은 사슬이 될 수 있으므로 깊이가 원소 수와 같아진다.**
 *
 * **축3 사다리에서 실제로 죽지는 않는다.** 같은 모양의 되돌이 중위 순회를 사슬 위에서
 * 돌려 확인했다 — 이 계약의 사다리 두 점($2^{10}$·$2^{12}$)은 물론이고 나란한 넷과
 * 교차할 때 쓰는 $2^{14}$ 와 그 두 배($32{,}768$)까지 살아남는다. 그런데도 반복문으로
 * 짓는 이유는 **한계가 원소 수에 직접 걸린다**는 것 자체다. 나란한 넷에서 이 한계는 원소
 * 수와 무관하고(깊이가 로그라 $2^{20}$ 개를 담아도 스무 단), 여기서는 담는 수가 곧 깊이라
 * 계약이 정하지 않은 실행 환경 상수가 담을 수 있는 원소 수의 상한이 된다. 답을 하나도
 * 바꾸지 않으면서 그 의존을 없애는 자리다(불변 사실 101 과 같은 모양이고, 그쪽은 비용이
 * 이유였고 이쪽은 실행 환경이 이유다).
 *
 * **세어 두는 값이 없다.** 계약이 O(1) 로 적은 행이 하나도 없기 때문이다 — 일곱 행의 상한이
 * 전부 선형이라 훑어도 계약 안이다. 담긴 수를 세어 두던 자리는 `size` 행과 함께 없앴다
 * (`KAN-040` `S4`).
 */

// #region guide:core/types
type Comparator<T> = (a: T, b: T) => number;

/**
 * 트리의 자리 하나.
 *
 * 부분트리 크기도 색도 들고 있지 않다. **나란한 넷은 그 값들로 균형을 판정하는데 이 구현은
 * 판정하지 않으므로** 들 이유가 없다. 계약이 그 판정을 요구하지 않는 것이 이 계약의 내용
 * 전부이고, 그것이 이 자리의 필드 수에 그대로 나타난다.
 */
interface Node<T> {
  key: T;
  left: Node<T> | null;
  right: Node<T> | null;
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
// #endregion

// #region guide:core/class
export class BinarySearchTree<T> {
  #root: Node<T> | null = null;
  readonly #compare: Comparator<T>;

  /** 축3 계측. 지나간 자리 수를 센다 — 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compare = comparator ?? defaultComparator;
  }

  /**
   * 내려가면서 자리를 찾고, 없으면 그 자리에 매단다.
   *
   * **내려가는 길 말고는 하는 일이 없다.** 나란한 넷은 여기서 돌아 나오며 높이를 고치거나
   * 색을 맞추거나 치우침을 재는데, 이 구현은 매달고 끝낸다. 그래서 넣는 값이 정렬돼 있으면
   * 트리가 사슬로 자라고 이 호출의 비용이 원소 수에 비례한다.
   */
  insert(item: T): void {
    if (this.#root === null) {
      this.__cost += 1;
      this.#root = { key: item, left: null, right: null };
      return;
    }

    let at = this.#root;
    for (;;) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) return;

      if (cmp < 0) {
        if (at.left === null) {
          at.left = { key: item, left: null, right: null };
          return;
        }
        at = at.left;
      } else {
        if (at.right === null) {
          at.right = { key: item, left: null, right: null };
          return;
        }
        at = at.right;
      }
    }
  }

  /**
   * 자리를 찾아 떼어 낸다. 자식이 둘이면 오른쪽 부분트리의 최소를 끌어와 덮는다.
   *
   * 부모를 들고 내려가는 것이 되돌이 호출을 없앤 자리다. 떼어 낸 자리를 부모의 어느 쪽에
   * 다시 매달아야 하는지가 그 변수 하나로 정해진다.
   */
  delete(item: T): boolean {
    let parent: Node<T> | null = null;
    let at = this.#root;

    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) break;
      parent = at;
      at = cmp < 0 ? at.left : at.right;
    }
    if (at === null) return false;

    if (at.left !== null && at.right !== null) {
      // 오른쪽 부분트리의 최소를 찾아 값만 옮기고, 그 최소가 있던 자리를 대신 뗀다.
      let successorParent = at;
      let successor = at.right;
      while (successor.left !== null) {
        this.__cost += 1;
        successorParent = successor;
        successor = successor.left;
      }
      at.key = successor.key;
      parent = successorParent;
      at = successor;
    }

    const child = at.left ?? at.right;
    if (parent === null) this.#root = child;
    else if (parent.left === at) parent.left = child;
    else parent.right = child;

    return true;
  }

  has(item: T): boolean {
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) return true;
      at = cmp < 0 ? at.left : at.right;
    }
    return false;
  }

  min(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.left !== null) {
      this.__cost += 1;
      at = at.left;
    }
    this.__cost += 1;
    return at.key;
  }

  max(): T | null {
    let at = this.#root;
    if (at === null) return null;
    while (at.right !== null) {
      this.__cost += 1;
      at = at.right;
    }
    this.__cost += 1;
    return at.key;
  }

  /**
   * 구간에 드는 원소를 비내림차순으로 모은다.
   *
   * 손으로 쌓는 스택에 **구간을 벗어나는 쪽 가지를 넣지 않는다.** 그 잘라내기가 없으면
   * 답은 그대로인데 트리 전체를 훑게 되고, 답 수가 상수인 질의에서도 비용이 원소 수에
   * 비례한다. 이 계약은 그래도 상한 안이지만 — 계약이 선형을 허용하므로 — **잘라내도
   * 상한 안이므로 잘라낸다.**
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;

    const stack: Node<T>[] = [];
    let at: Node<T> | null = this.#root;

    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        if (this.#compare(at.key, low) < 0) {
          // 이 자리와 왼쪽은 전부 구간 아래다.
          at = at.right;
          continue;
        }
        stack.push(at);
        at = at.left;
      }
      // 잘라내며 내려가느라 아무것도 안 쌓였을 수 있다 — 구간이 담긴 값 전부보다 위면
      // 오른쪽으로만 내려가다 끝난다.
      if (stack.length === 0) break;

      const node = stack.pop() as Node<T>;
      if (this.#compare(node.key, high) > 0) break;
      out.push(node.key);
      at = node.right;
    }

    return out;
  }

  /** 손으로 쌓는 스택으로 중위 순회한다. 사슬이어도 실행이 죽지 않는 이유가 이것이다. */
  toArray(): T[] {
    const out: T[] = [];
    const stack: Node<T>[] = [];
    let at: Node<T> | null = this.#root;

    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        stack.push(at);
        at = at.left;
      }
      const node = stack.pop() as Node<T>;
      out.push(node.key);
      at = node.right;
    }

    return out;
  }
}
// #endregion
