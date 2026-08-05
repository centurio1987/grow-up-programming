/**
 * `range-query/intervalTree` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../intervalTree.ts` 헤더 한 곳이다(규약1). 이 파일이
 * 지는 의무는 둘이다 — 그 계약을 실제로 지키는 것, 그리고 축3이 읽을 `__cost` 를 노출하는 것.
 *
 * `__cost` 가 세는 것: **노드를 하나 들여다볼 때마다 1.** 읽기와 쓰기를 따로 세지 않는다
 * (§규약2 계측 단위). 자르고 붙이는 길에 지나간 노드,
 * 질의가 훑은 노드, 새로 만든 노드가 모두 여기 들어간다. 이 구조에는 주입점이 없어 밖에서
 * 셀 수 있는 양이 없다 — 그래서 자기 보고이고, 무엇을 세는지를 여기 적는 것이 §규약2가
 * 요구하는 전부다.
 *
 * 우선순위는 삽입 순번을 섞어 만든다. `Math.random` 을 쓰지 않는 이유는 실패를 재현할 수
 * 있어야 하기 때문이다. 그 대가로 이 수열을 아는 입력에는 적대적일 수 있다는 점을 적어 둔다.
 *
 * 이 구현이 무엇인지는 계약의 일부가 아니다. 계약이 `expected O(log n)` 을 요구하므로 그것을
 * 만족하는 아무 구현이나 여기 올 수 있고, 바뀌어도 `../intervalTree.ts` 는 그대로다.
 */

// #region guide:core/types
interface Node {
  low: number;
  high: number;
  /** 트리 모양을 정하는 값. 키가 아니라 이것이 균형을 만든다. */
  prio: number;
  /** 이 부분 트리에 든 구간들의 `high` 최댓값. 가지치기의 유일한 근거다. */
  maxHigh: number;
  left: Node | null;
  right: Node | null;
}

/** 빈 부분 트리는 어떤 질의에도 걸리지 않아야 하므로 가장 작은 값으로 둔다. */
function maxHighOf(node: Node | null): number {
  return node === null ? Number.NEGATIVE_INFINITY : node.maxHigh;
}
// #endregion

// #region guide:core/class
export class IntervalTree {
  #root: Node | null = null;
  #count = 0;
  #seq = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  insert(low: number, high: number): void {
    const [smaller, larger] = this.#split(
      this.#root,
      (node) => this.#compare(node, low, high) <= 0,
    );
    this.__cost += 1;
    const node: Node = {
      low,
      high,
      prio: this.#nextPrio(),
      maxHigh: high,
      left: null,
      right: null,
    };
    this.#root = this.#merge(this.#merge(smaller, node), larger);
    this.#count += 1;
  }

  delete(low: number, high: number): boolean {
    const [smaller, rest] = this.#split(
      this.#root,
      (node) => this.#compare(node, low, high) < 0,
    );
    const [same, larger] = this.#split(
      rest,
      (node) => this.#compare(node, low, high) <= 0,
    );
    if (same === null) {
      this.#root = this.#merge(smaller, larger);
      return false;
    }
    // `same` 에는 같은 키만 들어 있다. 그 뿌리 하나를 빼고 좌우를 도로 붙인다.
    const shrunk = this.#merge(same.left, same.right);
    this.#root = this.#merge(this.#merge(smaller, shrunk), larger);
    this.#count -= 1;
    return true;
  }

  /** 점 질의는 폭이 0인 구간 질의다. 따로 쓰면 두 벌의 가지치기가 갈릴 자리를 만든다. */
  stabQuery(point: number): [number, number][] {
    return this.overlapQuery(point, point);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    const found: [number, number][] = [];
    this.#collect(this.#root, low, high, found);
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  #collect(
    node: Node | null,
    low: number,
    high: number,
    found: [number, number][],
  ): void {
    if (node === null) return;
    this.__cost += 1;
    // 이 부분 트리의 구간이 전부 질의보다 먼저 끝난다. 더 내려갈 이유가 없다.
    if (node.maxHigh < low) return;
    this.#collect(node.left, low, high, found);
    // 오른쪽은 시작점이 이 노드 이상이다. 이 노드가 이미 질의 뒤에서 시작하면 오른쪽도 그렇다.
    if (node.low > high) return;
    if (low <= node.high) found.push([node.low, node.high]);
    this.#collect(node.right, low, high, found);
  }

  /** 시작점이 먼저, 같으면 끝점이 다음. 같은 구간을 여러 벌 담을 수 있게 전순서로 둔다. */
  #compare(node: Node, low: number, high: number): number {
    if (node.low !== low) return node.low < low ? -1 : 1;
    if (node.high !== high) return node.high < high ? -1 : 1;
    return 0;
  }

  /** `goesLeft` 를 만족하는 앞쪽과 나머지 뒤쪽으로 가른다. */
  #split(
    node: Node | null,
    goesLeft: (node: Node) => boolean,
  ): [Node | null, Node | null] {
    if (node === null) return [null, null];
    this.__cost += 1;
    if (goesLeft(node)) {
      const [middle, larger] = this.#split(node.right, goesLeft);
      node.right = middle;
      this.#pull(node);
      return [node, larger];
    }
    const [smaller, middle] = this.#split(node.left, goesLeft);
    node.left = middle;
    this.#pull(node);
    return [smaller, node];
  }

  /** 왼쪽 전부가 오른쪽 전부보다 작다는 전제로 잇는다. 모양은 우선순위가 정한다. */
  #merge(left: Node | null, right: Node | null): Node | null {
    if (left === null) return right;
    if (right === null) return left;
    this.__cost += 1;
    if (left.prio > right.prio) {
      left.right = this.#merge(left.right, right);
      this.#pull(left);
      return left;
    }
    right.left = this.#merge(left, right.left);
    this.#pull(right);
    return right;
  }

  /**
   * 자식이 바뀐 노드의 `maxHigh` 를 다시 끌어올린다.
   *
   * 자르고 붙이는 **모든** 자리에서 불러야 한다. 한 자리라도 빠뜨리면 트리 모양은 멀쩡한데
   * 가지치기만 조용히 틀리고, 질의가 있는 구간을 못 찾는다.
   */
  #pull(node: Node): void {
    node.maxHigh = Math.max(
      node.high,
      maxHighOf(node.left),
      maxHighOf(node.right),
    );
  }

  /** 삽입 순번을 섞어 우선순위를 만든다. 입력 순서와 트리 모양을 끊는 자리다. */
  #nextPrio(): number {
    this.#seq = (this.#seq + 1) >>> 0;
    let x = this.#seq;
    x ^= x >>> 16;
    x = Math.imul(x, 0x85ebca6b) >>> 0;
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
  }
}
// #endregion
