/**
 * `heap/vanEmdeBoasTree` 정본(규약2).
 *
 * 계약은 `../vanEmdeBoasTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 이 파일이 정본인 것은 계약이 고른 계급을
 * 짧은 코드로 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 마디)를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대 카운트가 아니라
 * 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23). 공개 연산 한 번에 1, 재귀가 마디 하나에 들어갈 때 1, 다른 마디의 최소·
 * 최대를 들여다볼 때 1, 생성자가 마디 하나를 세울 때 1 이다.
 *
 * **이 구현이 하는 일.** 우주 $[0, 2^b)$ 를 담는 마디가 값의 윗자리 $\lceil b/2 \rceil$ 비트로
 * 묶음을 고르고 아랫자리 $\lfloor b/2 \rfloor$ 비트를 그 묶음에 맡긴다. 어느 묶음이 비어 있지
 * 않은지는 윗자리 우주를 담는 요약 마디 하나가 든다. 마디마다 최소와 최대를 따로 들고, **최소는
 * 묶음에 내려보내지 않는다** — 그래서 빈 묶음에 넣는 일이 상수이고, 한 연산이 내려가는 길에서
 * 재귀를 두 번 부르는 자리가 없다(한쪽이 늘 상수로 끝난다). 비트 수가 마디마다 절반이 되므로
 * 내려가는 깊이가 $\lceil \log_2 b \rceil$ 이고 $b = \lceil \log_2 u \rceil$ 이다.
 *
 * **생성자가 마디를 전부 세운다.** 묶음을 처음 쓸 때 세우면 넣기 한 호출이 그 묶음의 자리 배열을
 * 잡는 일(윗자리 우주 크기에 비례한다)을 떠안아 호출마다 제 상한 안이라는 약속이 거짓이 된다.
 * 계약의 생성자 행이 `O(u)` 인 것이 이 선택을 허락한다. 그 대가로 이 파일은 우주 크기만큼 자리를
 * 쓴다 — 계약은 공간을 말하지 않는다(§규약1 「공간은 어느 계약에도 없다」). 사다리 위의 우주
 * $2^{10}$ · $2^{12}$ · $2^{14}$ · $2^{16}$ 에서 세우는 마디는 1,387 · 5,331 · 21,415 · 92,007 개다.
 *
 * **계약의 우주 u 와 이 구현의 $2^b$ 는 다르다.** u 가 2의 거듭제곱이 아니면 위로 올려 담고,
 * u 이상의 키는 공개 연산이 먼저 거절한다. 올린 우주는 u 의 두 배 미만이라 계급이 안 바뀐다.
 */

// #region guide:core/node
/** 우주 $[0, 2^{bits})$ 를 담는 마디. 비어 있으면 `min`·`max` 가 둘 다 `null` 이다. */
class Node {
  readonly bits: number;
  /** 아랫자리 비트가 담는 우주의 크기 — 묶음 하나의 크기. */
  readonly lowSize: number;
  min: number | null = null;
  max: number | null = null;
  /** 비어 있지 않은 묶음의 번호를 담는다. `bits === 1` 이면 없다. */
  readonly summary: Node | null;
  /** 윗자리 번호마다 묶음 하나. `bits === 1` 이면 없다. */
  readonly clusters: Node[] | null;

  constructor(bits: number, built: { count: number }) {
    built.count += 1;
    this.bits = bits;
    if (bits === 1) {
      this.lowSize = 1;
      this.summary = null;
      this.clusters = null;
      return;
    }
    const highBits = Math.ceil(bits / 2);
    const lowBits = bits - highBits;
    this.lowSize = 2 ** lowBits;
    this.summary = new Node(highBits, built);
    this.clusters = Array.from(
      { length: 2 ** highBits },
      () => new Node(lowBits, built),
    );
  }
}
// #endregion

// #region guide:core/class
export class VanEmdeBoasTree {
  readonly #universe: number;
  readonly #root: Node;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(universe: number) {
    if (!Number.isSafeInteger(universe) || universe < 1) {
      throw new RangeError(
        `우주 크기는 1 이상의 안전한 정수여야 한다 — 받은 값 ${universe}`,
      );
    }
    this.#universe = universe;
    let bits = 1;
    while (2 ** bits < universe) bits += 1;
    const built = { count: 0 };
    this.#root = new Node(bits, built);
    this.__cost += built.count;
  }

  insert(x: number): void {
    this.#check(x);
    this.__cost += 1;
    if (this.#has(this.#root, x)) return;
    this.#insert(this.#root, x);
  }

  delete(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    if (!this.#has(this.#root, x)) return false;
    this.#delete(this.#root, x);
    return true;
  }

  has(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    return this.#has(this.#root, x);
  }

  min(): number | null {
    this.__cost += 1;
    return this.#root.min;
  }

  max(): number | null {
    this.__cost += 1;
    return this.#root.max;
  }

  successor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    return this.#successor(this.#root, x);
  }

  predecessor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    return this.#predecessor(this.#root, x);
  }

  /** 키가 우주 안의 정수인지 본다. 아니면 상태를 건드리기 전에 던진다. */
  #check(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.#universe) {
      throw new RangeError(
        `키는 0 이상 ${this.#universe} 미만의 정수여야 한다 — 받은 값 ${x}`,
      );
    }
  }

  #cluster(node: Node, high: number): Node {
    this.__cost += 1;
    return (node.clusters as Node[])[high] as Node;
  }

  #has(node: Node, x: number): boolean {
    this.__cost += 1;
    if (x === node.min || x === node.max) return true;
    if (node.bits === 1) return false;
    const high = Math.floor(x / node.lowSize);
    return this.#has(this.#cluster(node, high), x - high * node.lowSize);
  }

  /** 없는 `x` 를 넣는다. 빈 묶음에 넣는 쪽은 최소·최대만 적고 끝나므로 재귀가 한 갈래다. */
  #insert(node: Node, value: number): void {
    this.__cost += 1;
    if (node.min === null) {
      node.min = value;
      node.max = value;
      return;
    }
    let x = value;
    if (x < node.min) {
      const previous = node.min;
      node.min = x;
      x = previous;
    }
    if (node.bits > 1) {
      const high = Math.floor(x / node.lowSize);
      const low = x - high * node.lowSize;
      const cluster = this.#cluster(node, high);
      if (cluster.min === null) {
        this.#insert(node.summary as Node, high);
        cluster.min = low;
        cluster.max = low;
      } else {
        this.#insert(cluster, low);
      }
    }
    if (node.max === null || x > node.max) node.max = x;
  }

  /** 있는 `x` 를 지운다. 묶음이 비면 요약에서 지우는 쪽만 재귀가 깊고, 그때 묶음 쪽은 상수였다. */
  #delete(node: Node, value: number): void {
    this.__cost += 1;
    if (node.min === node.max) {
      node.min = null;
      node.max = null;
      return;
    }
    if (node.bits === 1) {
      node.min = value === 0 ? 1 : 0;
      node.max = node.min;
      return;
    }
    const summary = node.summary as Node;
    let x = value;
    if (x === node.min) {
      const first = summary.min as number;
      x = first * node.lowSize + (this.#cluster(node, first).min as number);
      node.min = x;
    }
    const high = Math.floor(x / node.lowSize);
    const cluster = this.#cluster(node, high);
    this.#delete(cluster, x - high * node.lowSize);
    if (cluster.min === null) {
      this.#delete(summary, high);
      if (x === node.max) {
        const last = summary.max;
        node.max =
          last === null
            ? node.min
            : last * node.lowSize + (this.#cluster(node, last).max as number);
      }
    } else if (x === node.max) {
      node.max = high * node.lowSize + (cluster.max as number);
    }
  }

  #successor(node: Node, x: number): number | null {
    this.__cost += 1;
    if (node.bits === 1) {
      return x === 0 && node.max === 1 ? 1 : null;
    }
    if (node.min !== null && x < node.min) return node.min;
    const high = Math.floor(x / node.lowSize);
    const low = x - high * node.lowSize;
    const cluster = this.#cluster(node, high);
    if (cluster.max !== null && low < cluster.max) {
      return high * node.lowSize + (this.#successor(cluster, low) as number);
    }
    const next = this.#successor(node.summary as Node, high);
    if (next === null) return null;
    return next * node.lowSize + (this.#cluster(node, next).min as number);
  }

  #predecessor(node: Node, x: number): number | null {
    this.__cost += 1;
    if (node.bits === 1) {
      return x === 1 && node.min === 0 ? 0 : null;
    }
    if (node.max !== null && x > node.max) return node.max;
    const high = Math.floor(x / node.lowSize);
    const low = x - high * node.lowSize;
    const cluster = this.#cluster(node, high);
    if (cluster.min !== null && low > cluster.min) {
      return high * node.lowSize + (this.#predecessor(cluster, low) as number);
    }
    const previous = this.#predecessor(node.summary as Node, high);
    if (previous === null) {
      // 최소는 묶음에 내려보내지 않았으므로 요약에 없다. 그 자리를 여기서 따로 본다.
      return node.min !== null && x > node.min ? node.min : null;
    }
    return (
      previous * node.lowSize + (this.#cluster(node, previous).max as number)
    );
  }
}
// #endregion
