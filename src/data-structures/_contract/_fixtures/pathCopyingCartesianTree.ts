/**
 * 결함 fixture — 트리는 정본과 같게 짓고, 부분트리 객체가 **뿌리부터의 길을 복사해** 든다.
 *
 * `left()`·`right()` 가 부분트리를 값으로 돌려주는 계약에서 부모 포인터 없이 위로 올라갈 수
 * 있게 하려면 길을 들고 다니는 것이 한 가지 길이고, 그 길을 걸음마다 복사하면 **한 걸음의
 * 비용이 지금 깊이에 비례한다.** 값은 전부 옳고 구성도 정본과 같으므로, 이 fixture 가 어기는
 * 것은 훑기 네 행뿐이다.
 *
 * **이 fixture 가 훑기 시나리오 둘을 갈라 세운다.** 무작위 수열의 트리는 기대 깊이가 로그라
 * 걸음 비용이 로그이고, 로그 인수 하나는 축3의 해상도 아래다(불변 사실 53) — 무작위 시나리오를
 * **통과한다.** 오름차순 수열의 트리는 깊이가 마디 수와 같아 걸음 비용이 선형이 되고 거기서
 * 걸린다. 앞의 둘(`scanningCartesianTree`·`rescanningCartesianView`)은 두 시나리오에서 똑같이
 * 굴어 「사슬 시나리오가 무엇을 더 잡는가」를 말하지 못한다(불변 사실 118).
 *
 * 길을 복사하지 않고 공유하면 이 결함이 사라진다 — 그래서 이것은 「트리를 잘못 지었다」가
 * 아니라 **부분트리를 값으로 돌려주는 계약이 실제로 여는 실패 자리**다.
 */

interface Node<T> {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
  size: number;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class PathCopyingCartesianTree<T> {
  #compare: (a: T, b: T) => number;
  #node: Node<T> | null;
  #path: Node<T>[] = [];
  #meter: { cost: number };

  constructor(seq: readonly T[], comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? defaultCompare;
    this.#meter = { cost: 0 };
    this.#node = this.#build(seq);
  }

  get __cost(): number {
    return this.#meter.cost;
  }

  size(): number {
    this.#meter.cost += 1;
    return this.#node?.size ?? 0;
  }

  value(): T | null {
    this.#meter.cost += 1;
    return this.#node === null ? null : this.#node.value;
  }

  left(): PathCopyingCartesianTree<T> | null {
    this.#meter.cost += 1;
    return this.#descend(this.#node?.left ?? null);
  }

  right(): PathCopyingCartesianTree<T> | null {
    this.#meter.cost += 1;
    return this.#descend(this.#node?.right ?? null);
  }

  inOrder(): T[] {
    const out: T[] = [];
    const stack: Node<T>[] = [];
    let at = this.#node;
    while (at !== null || stack.length > 0) {
      while (at !== null) {
        this.#meter.cost += 1;
        stack.push(at);
        at = at.left;
      }
      const node = stack.pop() as Node<T>;
      this.#meter.cost += 1;
      out.push(node.value);
      at = node.right;
    }
    return out;
  }

  /** 자식으로 내려간 객체. **여기서 길을 복사한다** — 걸음 하나가 깊이에 비례하는 자리다. */
  #descend(node: Node<T> | null): PathCopyingCartesianTree<T> | null {
    if (node === null) return null;
    const sub = new PathCopyingCartesianTree<T>([], this.#compare);
    sub.#node = node;
    sub.#meter = this.#meter;
    sub.#path = [...this.#path, this.#node as Node<T>];
    this.#meter.cost += sub.#path.length;
    return sub;
  }

  /** 정본과 같은 한 번 훑기. 구성 쪽에는 결함이 없다. */
  #build(seq: readonly T[]): Node<T> | null {
    const n = seq.length;
    if (n === 0) return null;

    const nodes: Node<T>[] = [];
    const rightSpine: number[] = [];
    for (let i = 0; i < n; i++) {
      nodes.push({ value: seq[i] as T, left: null, right: null, size: 1 });
      let detached = -1;
      while (rightSpine.length > 0) {
        const top = rightSpine[rightSpine.length - 1] as number;
        this.#meter.cost += 1;
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
      this.#meter.cost += 1;
    }

    const root = nodes[rightSpine[0] as number] as Node<T>;
    const order: Node<T>[] = [];
    const stack: Node<T>[] = [root];
    while (stack.length > 0) {
      const node = stack.pop() as Node<T>;
      this.#meter.cost += 1;
      order.push(node);
      if (node.left !== null) stack.push(node.left);
      if (node.right !== null) stack.push(node.right);
    }
    for (let k = order.length - 1; k >= 0; k--) {
      const node = order[k] as Node<T>;
      this.#meter.cost += 1;
      node.size = 1 + (node.left?.size ?? 0) + (node.right?.size ?? 0);
    }
    return root;
  }
}
