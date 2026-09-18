/**
 * `tree/cartesianTree` 정본(규약2).
 *
 * 계약은 `../cartesianTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"마디 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않고** 런타임의 재할당도 세지 않는다. 축3은 절대 카운트가 아니라 성장률을 보므로
 * 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위). `__cost` 는 계약이 아니라
 * 정본의 의무다(불변 사실 23) — 계약 헤더에 적지 않고 학습자 스텁에 요구하지 않는다.
 *
 * **부분트리 객체가 뿌리의 계측을 올린다.** `left()`·`right()` 가 돌려주는 것도 같은
 * `CartesianTree` 이고, 그 객체에서 쓴 비용이 뿌리의 `__cost` 에 안 잡히면 훑기 시나리오가
 * 아무것도 재지 않는다. 그래서 부분트리는 자기 칸이 아니라 **뿌리의 칸**을 올린다.
 *
 * 구성은 **오른쪽 경계를 자리로 드는 한 번 훑기**다. 지금까지 만든 트리에서 뿌리부터
 * 오른쪽으로만 내려간 길(rightmost path)이 자리에 담겨 있고, 새 값은 그 길 위에서 자기보다
 * 값이 비교자 기준 자기보다 뒤선 마디들을 걷어내며 들어간다. 걷어낸 마지막 마디가 새 마디의 왼쪽 자식이 된다.
 * 마디 하나는 자리에 한 번 들어가고 많아야 한 번 나오므로 걷어내기의 총합이 n 을 넘지
 * 않는다 — 계약이 적은 $O(n)$ 이 이 총합에서 나온다.
 *
 * **되돌이 호출을 쓰지 않는다.** 오름차순 수열의 트리는 깊이가 마디 수와 같은 사슬이고,
 * 사다리 맨 위($2^{14}$)에서 `inOrder()` 가 그 깊이만큼 내려간다. 한계가
 * 원소 수에 직접 걸리는 것 자체가 반복문으로 지을 이유다(T1-04 가 같은 자리에서 근거를
 * 다시 세웠다 — 「사다리에서 죽는다」가 아니라 「한계가 원소 수에 직접 걸린다」).
 */

// #region guide:core/types
interface Node<T> {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
// #endregion

// #region guide:core/class
export class CartesianTree<T> {
  #compare: (a: T, b: T) => number;
  #node: Node<T> | null;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  /** 계측을 모을 뿌리 객체. 부분트리는 자기 것이 아니라 이 자리를 올린다. */
  #__costOwner: CartesianTree<T> = this;

  constructor(seq: readonly T[], comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? defaultCompare;
    this.#node = this.#build(seq);
  }

  value(): T | null {
    this.#__costOwner.__cost += 1;
    return this.#node === null ? null : this.#node.value;
  }

  left(): CartesianTree<T> | null {
    this.#__costOwner.__cost += 1;
    return this.#view(this.#node?.left ?? null);
  }

  right(): CartesianTree<T> | null {
    this.#__costOwner.__cost += 1;
    return this.#view(this.#node?.right ?? null);
  }

  /**
   * 담긴 값을 수열 순서로 담은 사본.
   *
   * 자리를 손으로 들고 내려간다. 되돌이 호출로 적으면 사슬에서 깊이가 마디 수와 같아진다.
   */
  inOrder(): T[] {
    const out: T[] = [];
    const stack: Node<T>[] = [];
    let at = this.#node;
    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.#__costOwner.__cost += 1;
        stack.push(at);
        at = at.left;
      }
      const node = stack.pop() as Node<T>;
      this.#__costOwner.__cost += 1;
      out.push(node.value);
      at = node.right;
    }
    return out;
  }

  /** 같은 비교자를 든 부분트리 객체. 비면 `null` 이다. */
  #view(node: Node<T> | null): CartesianTree<T> | null {
    if (node === null) return null;
    const sub = new CartesianTree<T>([], this.#compare);
    sub.#node = node;
    sub.#__costOwner = this.#__costOwner;
    return sub;
  }

  /**
   * 오른쪽 경계를 자리로 들고 수열을 한 번 훑는다.
   *
   * 값이 새 값보다 **비교자 기준 뒤선** 마디만 걷어낸다. 동등한 마디를 걷어내지 않는 것이 계약이 적은
   * 「동등하면 수열에서 먼저 온 자리가 조상」이다 — 걷어내면 나중에 온 쪽이 조상이 된다.
   */
  #build(seq: readonly T[]): Node<T> | null {
    const n = seq.length;
    if (n === 0) return null;

    const nodes: Node<T>[] = [];
    const rightSpine: number[] = [];

    for (let i = 0; i < n; i++) {
      nodes.push({ value: seq[i] as T, left: null, right: null });
      let detached = -1;
      while (rightSpine.length > 0) {
        const top = rightSpine[rightSpine.length - 1] as number;
        this.#__costOwner.__cost += 1;
        if (this.#compare((nodes[top] as Node<T>).value, seq[i] as T) <= 0)
          break;
        detached = rightSpine.pop() as number;
      }
      if (detached >= 0)
        (nodes[i] as Node<T>).left = nodes[detached] as Node<T>;
      if (rightSpine.length > 0) {
        const parent = rightSpine[rightSpine.length - 1] as number;
        (nodes[parent] as Node<T>).right = nodes[i] as Node<T>;
      }
      rightSpine.push(i);
      this.#__costOwner.__cost += 1;
    }

    return nodes[rightSpine[0] as number] as Node<T>;
  }
}
// #endregion
