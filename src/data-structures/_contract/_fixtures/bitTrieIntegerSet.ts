/**
 * 결함 fixture — 키를 이진수로 펴 **윗자리 비트부터 한 비트씩** 내려가는 트라이에 담는 정수 집합.
 *
 * `heap/vanEmdeBoasTree` 계약(`../../heap/vanEmdeBoasTree/vanEmdeBoasTree.ts`)을 **로그 인수만큼**
 * 어긴다. 모든 연산이 우주의 비트 수 $b = \lceil\log_2 u\rceil$ 만큼 내려가므로 $O(\log u)$ 이고,
 * 계약은 $O(\log\log u)$ 를 적었다. u 가 커지면 두 값의 비가 끝없이 벌어지므로 **계약 위반이 맞다.**
 * **답은 전부 옳다**(축1 통과).
 *
 * **그런데 계약 스위트의 다섯 시나리오를 전부 통과한다.** 우주를 키우는 시나리오에서 u =
 * $2^{10}$ · $2^{12}$ · $2^{14}$ 의 비트 수가 10 · 12 · 14 라 비율이 1.20 · 1.17 이고, 판정 구간
 * `O(1)`(0.70~1.30) 안이다. 계약의 상한과 이 계열의 차이가 로그 인수 하나이고, 축3이 판정하는 것은
 * 다항 계급이다(불변 사실 53·62 · §규약2 「로그 인수는 축3의 해상도 아래에 있다」). **이 fixture 가
 * 통과하는 것을 「계약을 지킨다」로 읽지 않는다** — 하네스 자기시험이 통과를 고정하면서 그 사실을
 * 함께 적는다.
 *
 * 이 fixture 가 저장소에 있는 이유는 §규약2 「상한이 우주의 로그 로그인 계약은 Bound 를 늘리지
 * 않는다」의 판정 근거이기 때문이다 — `O(log log u)` 라는 Bound 를 새로 그어도 이 계열(비율 1.2)은
 * 그 구간(±30%, 0.75~1.40) 안이라 여전히 통과한다.
 *
 * 계측 단위는 §규약2 그대로 — 공개 연산 한 번에 1, 내려가거나 올라오며 지나간 마디 하나에 1 이다.
 */

class Node {
  readonly children: [Node | null, Node | null] = [null, null];
  /** 이 마디 아래 담긴 키의 수. 0 이 되면 부모가 떼어 낸다. */
  count = 0;
}

export class BitTrieIntegerSet {
  readonly #universe: number;
  readonly #bits: number;
  readonly #root = new Node();

  __cost = 0;

  constructor(universe: number) {
    if (!Number.isSafeInteger(universe) || universe < 1) {
      throw new RangeError(`우주 크기가 잘못됐다 — ${universe}`);
    }
    this.#universe = universe;
    let bits = 1;
    while (2 ** bits < universe) bits += 1;
    this.#bits = bits;
  }

  insert(x: number): void {
    this.#check(x);
    this.__cost += 1;
    if (this.#contains(x)) return;
    let node = this.#root;
    node.count += 1;
    for (let level = this.#bits - 1; level >= 0; level--) {
      this.__cost += 1;
      const bit = this.#bit(x, level);
      let child = node.children[bit];
      if (child === null) {
        child = new Node();
        node.children[bit] = child;
      }
      child.count += 1;
      node = child;
    }
  }

  delete(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    if (!this.#contains(x)) return false;
    let node = this.#root;
    node.count -= 1;
    for (let level = this.#bits - 1; level >= 0; level--) {
      this.__cost += 1;
      const bit = this.#bit(x, level);
      const child = node.children[bit] as Node;
      child.count -= 1;
      if (child.count === 0) {
        node.children[bit] = null;
        return true;
      }
      node = child;
    }
    return true;
  }

  has(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    return this.#contains(x);
  }

  min(): number | null {
    this.__cost += 1;
    return this.#root.count === 0 ? null : this.#extreme(this.#root, 0, 0);
  }

  max(): number | null {
    this.__cost += 1;
    return this.#root.count === 0 ? null : this.#extreme(this.#root, 0, 1);
  }

  successor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    return this.#neighbor(x, 1);
  }

  predecessor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    return this.#neighbor(x, 0);
  }

  #check(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.#universe) {
      throw new RangeError(`우주 밖 키 — ${x}`);
    }
  }

  #bit(x: number, level: number): 0 | 1 {
    return Math.floor(x / 2 ** level) % 2 === 1 ? 1 : 0;
  }

  #contains(x: number): boolean {
    let node: Node | null = this.#root;
    for (let level = this.#bits - 1; level >= 0 && node !== null; level--) {
      this.__cost += 1;
      node = node.children[this.#bit(x, level)];
    }
    return node !== null && node.count > 0;
  }

  /**
   * `node`(윗자리가 `prefix`, 남은 비트가 `levelsLeft` 개 아래)에서 `side` 쪽 끝 키를 찾는다.
   * `side` 가 0 이면 가장 작은 키, 1 이면 가장 큰 키다.
   */
  #extreme(node: Node, depth: number, side: 0 | 1): number {
    let at = node;
    let value = 0;
    for (let level = this.#bits - 1 - depth; level >= 0; level--) {
      this.__cost += 1;
      const preferred = at.children[side];
      const bit = preferred !== null ? side : side === 0 ? 1 : 0;
      at = at.children[bit] as Node;
      value += bit * 2 ** level;
    }
    return value;
  }

  /** `side` 가 1 이면 `x` 보다 큰 가장 작은 키, 0 이면 `x` 보다 작은 가장 큰 키. */
  #neighbor(x: number, side: 0 | 1): number | null {
    // 내려가며 `x` 의 비트와 반대쪽(`side`) 자식이 비어 있지 않은 가장 깊은 자리를 기억한다.
    let node: Node | null = this.#root;
    let branch: { node: Node; level: number; prefix: number } | null = null;
    let prefix = 0;
    for (let level = this.#bits - 1; level >= 0 && node !== null; level--) {
      this.__cost += 1;
      const bit = this.#bit(x, level);
      const other = node.children[side];
      if (bit !== side && other !== null) {
        branch = { node: other, level, prefix: prefix + side * 2 ** level };
      }
      prefix += bit * 2 ** level;
      node = node.children[bit];
    }
    if (branch === null) return null;
    // 갈라진 자리 아래에서는 반대쪽 끝(`side` 가 1 이면 가장 작은 쪽)으로 내려간다.
    const toward: 0 | 1 = side === 1 ? 0 : 1;
    const depth = this.#bits - branch.level;
    return branch.prefix + this.#extreme(branch.node, depth, toward);
  }
}
