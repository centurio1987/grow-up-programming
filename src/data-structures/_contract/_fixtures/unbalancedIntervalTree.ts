/**
 * 결함 fixture — **균형을 스스로 잡지 않는 증강 탐색 트리.**
 *
 * 진단이 `range-query/intervalTree` 에 건 지적이 이것이다(`ORDER.md:44`). 문제 문서는 표
 * 전체를 `O(log n)` 으로 적어 놓고 `maxHigh` 증강만 처방했다 — 회전도 균형도 한 줄 없다.
 * 그러면서 스토리의 예약은 시작 시각 순으로 들어온다. 정렬 입력이 곧 사슬이다.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 가지치기도 정확하고 결과도 빠짐없다.
 * 그리고 **무작위 삽입에서는 축3도 통과한다** — 무작위 순서로 들어온 키는 그 자체로 대체로
 * 균형 잡힌 트리를 만들기 때문이다. 걸리는 자리는 시작점이 오름차순인 입력 하나뿐이다.
 *
 * 재귀가 아니라 반복으로 쓴 이유가 이 fixture 의 요점과 붙어 있다. 사슬이 되는 것이 여기서
 * 보여야 할 결함인데, 재귀로 쓰면 깊이 16384 에서 스택이 먼저 터진다 — 그러면 축3이 아니라
 * 런타임이 잡은 것이 되고, 성장률은 끝내 측정되지 않는다.
 */

interface Node {
  low: number;
  high: number;
  maxHigh: number;
  left: Node | null;
  right: Node | null;
}

function maxHighOf(node: Node | null): number {
  return node === null ? Number.NEGATIVE_INFINITY : node.maxHigh;
}

export class UnbalancedIntervalTree {
  #root: Node | null = null;
  #count = 0;

  __cost = 0;

  insert(low: number, high: number): void {
    this.__cost += 1;
    const fresh: Node = { low, high, maxHigh: high, left: null, right: null };
    if (this.#root === null) {
      this.#root = fresh;
      this.#count = 1;
      return;
    }

    let current = this.#root;
    for (;;) {
      this.__cost += 1;
      // 내려가는 길에 갱신해도 된다. 삽입은 maxHigh 를 늘리기만 하기 때문이다.
      if (current.maxHigh < high) current.maxHigh = high;
      if (this.#compare(current, low, high) > 0) {
        if (current.left === null) {
          current.left = fresh;
          break;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = fresh;
          break;
        }
        current = current.right;
      }
    }
    this.#count += 1;
  }

  delete(low: number, high: number): boolean {
    const path: Node[] = [];
    let target = this.#root;
    while (target !== null) {
      this.__cost += 1;
      const order = this.#compare(target, low, high);
      if (order === 0) break;
      path.push(target);
      target = order > 0 ? target.left : target.right;
    }
    if (target === null) return false;

    let detach = target;
    if (target.left !== null && target.right !== null) {
      path.push(target);
      let successor = target.right;
      this.__cost += 1;
      while (successor.left !== null) {
        this.__cost += 1;
        path.push(successor);
        successor = successor.left;
      }
      target.low = successor.low;
      target.high = successor.high;
      detach = successor;
    }

    const child = detach.left ?? detach.right;
    const parent = path[path.length - 1];
    if (parent === undefined) this.#root = child;
    else if (parent.left === detach) parent.left = child;
    else parent.right = child;

    // 삭제는 maxHigh 를 줄일 수 있으므로 지나온 길을 거꾸로 올라오며 다시 끌어올린다.
    for (let at = path.length - 1; at >= 0; at--) {
      const node = path[at];
      if (node === undefined) continue;
      this.__cost += 1;
      node.maxHigh = Math.max(
        node.high,
        maxHighOf(node.left),
        maxHighOf(node.right),
      );
    }
    this.#count -= 1;
    return true;
  }

  stabQuery(point: number): [number, number][] {
    return this.overlapQuery(point, point);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    const found: [number, number][] = [];
    const stack: Node[] = [];
    if (this.#root !== null) stack.push(this.#root);

    while (stack.length > 0) {
      const node = stack.pop();
      if (node === undefined) break;
      this.__cost += 1;
      if (node.maxHigh < low) continue;
      if (node.left !== null) stack.push(node.left);
      if (node.low > high) continue;
      if (low <= node.high) found.push([node.low, node.high]);
      if (node.right !== null) stack.push(node.right);
    }
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  #compare(node: Node, low: number, high: number): number {
    if (node.low !== low) return node.low < low ? -1 : 1;
    if (node.high !== high) return node.high < high ? -1 : 1;
    return 0;
  }
}
