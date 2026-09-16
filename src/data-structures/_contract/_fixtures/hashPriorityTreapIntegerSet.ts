/**
 * 결함 fixture — 키를 **비교로만 견주는** 이진 탐색 트리에 담고, 균형을 키의 곱셈 해시로 정한
 * 우선순위(트립)로 잡는 정수 집합.
 *
 * `heap/vanEmdeBoasTree` 계약(`../../heap/vanEmdeBoasTree/vanEmdeBoasTree.ts`)을 **로그 인수만큼**
 * 어긴다. 모든 연산이 뿌리에서 잎 쪽으로 한 마디씩 내려가고 그 깊이가 담긴 수 n 의 로그이므로
 * $O(\log n)$ 이고, 계약은 $O(\log\log u)$ 를 적었다. n 은 u 까지 자랄 수 있으므로 $\log n$ 과
 * $\log\log u$ 의 비는 끝없이 벌어진다 — **계약 위반이 맞다.** **답은 전부 옳다**(축1·축2 통과).
 *
 * **이 계열이 헤더 「상한」 근거가 겨눈 바로 그 계열이다.** 상한을 $O(\log u)$ 로 약하게 적으면
 * 원소 수가 우주를 넘지 못하므로($\log n \le \log u$) 비교 기반 균형 트리가 전부 계약 안으로
 * 들어오고, 그 계약은 「정수만 받는 정렬 집합」이 된다. 그래서 계약이 배제한 계열인데, **지금
 * 사다리의 축3 은 그 배제를 재지 못한다**(`../../heap/vanEmdeBoasTree/vanEmdeBoasTree.ts` 헤더
 * 「검사 공백」 · `docs/ORD-006-conventions.md` 의 같은 이름 절).
 *
 * **우선순위를 무작위가 아니라 키의 해시로 정한다.** `Math.random` 을 쓰면 같은 입력에 다른 나무가
 * 서서 판정이 실행마다 흔들린다(KAN-027 이 실제로 겪었다 — 한 번은 두 시나리오가 걸리고 한 번은
 * 통과했다). 키 하나에 우선순위 하나를 못박으면 같은 입력이 늘 같은 나무를 세우므로 계측이
 * 재현된다. 균형은 그대로 유지된다 — 해시가 키의 순서와 상관이 없으므로 우선순위의 순위가
 * 무작위 순열처럼 흩어진다.
 *
 * **걸리는 자리와 걸리지 않는 자리**(수치는 `../runContract.vanEmdeBoasTree.test.ts` 가 고정한다).
 *
 * - **걸린다 — 담긴 수를 비트 수로 올리는 사다리.** 담긴 수가 $2^3$ · $2^6$ · $2^{12}$ 로 오르면
 *   $\log n$ 이 두 배씩 올라 비율이 2.0 언저리가 된다 — 15 · 39 · 66($r$ = 2.60 · 1.69).
 * - **통과한다 — 담긴 수나 우주를 4 배씩 올리는 시나리오 다섯.** 세 점이 4 배 간격이면 로그 인수가
 *   비율을 1.2 밖에 못 바꾸고, 그 값이 `O(1)` 판정 구간(0.70~1.30) 안이다(불변 사실 53·62).
 *   **통과를 「계약을 지킨다」로 읽지 않는다** — 자기시험이 통과를 고정하면서 그 사실을 함께 적는다.
 * - 우주를 비트 수로 올리는 사다리도 통과한다(13 · 13 · 14) — 담긴 키가 둘뿐이라 깊이가 우주와
 *   무관하다. 그 사다리가 잡는 것은 우주 쪽 로그이고, 둘이 서로가 못 잡는 자리를 맡는다.
 *
 * 계측 단위는 §규약2 그대로 — 공개 연산 한 번에 1, 내려가거나 되돌아오며 지나간 마디 하나에 1 이다.
 * 마디를 세우는 일은 그 자리를 지나며 이미 세었으므로 따로 세지 않는다.
 */

class Node {
  readonly key: number;
  readonly priority: number;
  left: Node | null = null;
  right: Node | null = null;

  constructor(key: number, priority: number) {
    this.key = key;
    this.priority = priority;
  }
}

/**
 * 키 하나의 우선순위. 32 비트 곱셈 해시 하나다(황금비 상수 2,654,435,761 — Knuth 의 값).
 *
 * 뒤에 비트를 더 섞는 변종도 재 봤다. 나무는 더 무작위에 가까워지지만 **가장 깊은 길이 길어져**
 * 조회 시나리오의 `worst` 가 57 · 78 · 111($r$ = 1.37 · 1.42)로 지금 사다리에서 이미 걸린다 —
 * 그러면 「계약을 지키면서 축3만 어기는 계열」이 아니라 지금 스위트가 잡는 계열이 되어 공백의
 * 증거가 못 된다. 곱셈 하나짜리가 깊이를 $2.2 \sim 2.5 \log_2 n$ 에 두어(스크래치 실측 — 원소
 * $2^5$ 에서 12, $2^{20}$ 에서 45) 계급은 그대로 $\Theta(\log n)$ 이면서 흔들림이 작다.
 */
function priorityOf(key: number): number {
  return Math.imul(key + 1, 2654435761) >>> 0;
}

export class HashPriorityTreapIntegerSet {
  readonly #universe: number;
  #root: Node | null = null;

  __cost = 0;

  constructor(universe: number) {
    if (!Number.isSafeInteger(universe) || universe < 1) {
      throw new RangeError(`우주 크기가 잘못됐다 — ${universe}`);
    }
    this.#universe = universe;
  }

  insert(x: number): void {
    this.#check(x);
    this.__cost += 1;
    this.#root = this.#insert(this.#root, x);
  }

  delete(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    if (!this.#find(x)) return false;
    this.#root = this.#delete(this.#root, x);
    return true;
  }

  has(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    return this.#find(x);
  }

  min(): number | null {
    this.__cost += 1;
    return this.#edge(0);
  }

  max(): number | null {
    this.__cost += 1;
    return this.#edge(1);
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

  #find(x: number): boolean {
    let node = this.#root;
    while (node !== null) {
      this.__cost += 1;
      if (x === node.key) return true;
      node = x < node.key ? node.left : node.right;
    }
    return false;
  }

  /** 담긴 키가 있으면 `side` 가 0 일 때 가장 작은 키, 1 일 때 가장 큰 키. */
  #edge(side: 0 | 1): number | null {
    let node = this.#root;
    let found: number | null = null;
    while (node !== null) {
      this.__cost += 1;
      found = node.key;
      node = side === 0 ? node.left : node.right;
    }
    return found;
  }

  /** `side` 가 1 이면 `x` 보다 큰 가장 작은 키, 0 이면 `x` 보다 작은 가장 큰 키. */
  #neighbor(x: number, side: 0 | 1): number | null {
    let node = this.#root;
    let found: number | null = null;
    while (node !== null) {
      this.__cost += 1;
      const beyond = side === 1 ? node.key > x : node.key < x;
      if (beyond) {
        found = node.key;
        node = side === 1 ? node.left : node.right;
      } else {
        node = side === 1 ? node.right : node.left;
      }
    }
    return found;
  }

  /** 같은 키는 한 벌만 담는다 — 이미 있으면 나무가 그대로다. */
  #insert(node: Node | null, x: number): Node {
    this.__cost += 1;
    if (node === null) return new Node(x, priorityOf(x));
    if (x === node.key) return node;
    if (x < node.key) {
      const left = this.#insert(node.left, x);
      node.left = left;
      if (left.priority > node.priority) return this.#rotate(node, 0);
      return node;
    }
    const right = this.#insert(node.right, x);
    node.right = right;
    if (right.priority > node.priority) return this.#rotate(node, 1);
    return node;
  }

  /** `side` 가 0 이면 오른쪽으로(왼쪽 자식이 올라온다), 1 이면 왼쪽으로 돌린다. */
  #rotate(node: Node, side: 0 | 1): Node {
    if (side === 0) {
      const child = node.left as Node;
      node.left = child.right;
      child.right = node;
      return child;
    }
    const child = node.right as Node;
    node.right = child.left;
    child.left = node;
    return child;
  }

  #delete(node: Node | null, x: number): Node | null {
    this.__cost += 1;
    if (node === null) return null;
    if (x < node.key) {
      node.left = this.#delete(node.left, x);
      return node;
    }
    if (x > node.key) {
      node.right = this.#delete(node.right, x);
      return node;
    }
    return this.#join(node.left, node.right);
  }

  /** 왼쪽 나무의 키가 전부 오른쪽 나무의 키보다 작을 때 둘을 하나로 잇는다. */
  #join(left: Node | null, right: Node | null): Node | null {
    this.__cost += 1;
    if (left === null) return right;
    if (right === null) return left;
    if (left.priority > right.priority) {
      left.right = this.#join(left.right, right);
      return left;
    }
    right.left = this.#join(left, right.left);
    return right;
  }
}
