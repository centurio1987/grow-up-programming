/**
 * 결함 fixture — 구간의 최솟값을 훑어 찾아 좌우로 나누기를 되풀이하는 카르테시안 트리.
 *
 * `tree/cartesianTree` 계약이 「자명한 구현으로 상한이 달성되지 않는다」의 반례로 든 바로
 * 그 구현이다. 트리는 정본과 **같은 것**을 짓는다 — 값이 옳으므로 축1을 전부 통과하고,
 * 마디를 실제로 세워 두므로 훑기 세 행도 상수다. 갈리는 것은 구성 하나뿐이다.
 *
 * **무작위 입력에서는 이 결함이 안 보인다.** 나눔이 대체로 반씩 갈려 $\Theta(n\log n)$ 이
 * 되고, 로그 인수 하나는 축3의 해상도 아래다(불변 사실 53). 오름차순에서는 나눔이 한쪽으로만
 * 몰려 $\Theta(n^2)$ 이 되고 거기서 걸린다 — 같은 결함이 입력에 따라 보이고 안 보이는
 * 자리다(불변 사실 24).
 *
 * **되돌이 호출로 적지 않았다.** 오름차순 입력의 나눔이 깊이 n 으로 내려가므로 사다리 맨
 * 위에서 스택이 먼저 죽는다. 재려는 것은 비용이지 스택이 아니다(T1-05 가 같은 이유로
 * 되돌이 호출을 걷어냈다).
 */

interface Node<T> {
  value: T;
  left: Node<T> | null;
  right: Node<T> | null;
}

interface Frame<T> {
  lo: number;
  hi: number;
  parent: Node<T> | null;
  /** 부모에 붙는 쪽. 0 이면 왼쪽이다. */
  side: 0 | 1;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class ScanningCartesianTree<T> {
  #compare: (a: T, b: T) => number;
  #node: Node<T> | null;
  #meter: { cost: number };

  constructor(seq: readonly T[], comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? defaultCompare;
    this.#meter = { cost: 0 };
    this.#node = this.#build(seq);
  }

  get __cost(): number {
    return this.#meter.cost;
  }

  value(): T | null {
    this.#meter.cost += 1;
    return this.#node === null ? null : this.#node.value;
  }

  left(): ScanningCartesianTree<T> | null {
    this.#meter.cost += 1;
    return this.#view(this.#node?.left ?? null);
  }

  right(): ScanningCartesianTree<T> | null {
    this.#meter.cost += 1;
    return this.#view(this.#node?.right ?? null);
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

  #view(node: Node<T> | null): ScanningCartesianTree<T> | null {
    if (node === null) return null;
    const sub = new ScanningCartesianTree<T>([], this.#compare);
    sub.#node = node;
    sub.#meter = this.#meter;
    return sub;
  }

  /**
   * 구간마다 최솟값을 훑어 찾고 좌우로 나눈다.
   *
   * 이 fixture 가 어기는 것은 구성 한 행뿐이다 — 마디를 실제로 세워 두므로 훑기는 상수다.
   */
  #build(seq: readonly T[]): Node<T> | null {
    if (seq.length === 0) return null;
    let root: Node<T> | null = null;
    const frames: Frame<T>[] = [
      { lo: 0, hi: seq.length, parent: null, side: 0 },
    ];

    while (frames.length > 0) {
      const frame = frames.pop() as Frame<T>;
      if (frame.lo >= frame.hi) continue;

      let best = frame.lo;
      this.#meter.cost += 1;
      for (let i = frame.lo + 1; i < frame.hi; i++) {
        this.#meter.cost += 1;
        if (this.#compare(seq[i] as T, seq[best] as T) < 0) best = i;
      }

      const node: Node<T> = {
        value: seq[best] as T,
        left: null,
        right: null,
      };
      if (frame.parent === null) root = node;
      else if (frame.side === 0) frame.parent.left = node;
      else frame.parent.right = node;

      frames.push({ lo: frame.lo, hi: best, parent: node, side: 0 });
      frames.push({ lo: best + 1, hi: frame.hi, parent: node, side: 1 });
    }
    return root;
  }
}
