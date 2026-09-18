/**
 * `tree/treap` 정본(규약2).
 *
 * 계약은 `../treap.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다 — `tree/redBlackTree` 정본도 이 계약을 지킨다
 * (최악까지 로그면 기댓값도 로그다). 여덟 행이 전부 `expected O(log n)` 이라는 것이 계약의
 * 전부다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — 나란한 계약
 * 둘(`redBlackTree`·`splayTree`)과 같은 단위를 쓴다. 읽기와 쓰기를 따로 세지 않는다
 * (§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **`#nextPrio` 의 난수 한 줄이 이 계약을 지탱한다.** 우선순위를 결정론적으로 만들면 —
 * 삽입 순서 카운터를 아무리 잘 섞어도 — **그 함수를 역산해 사슬을 만드는 입력이 실재한다.**
 * $i$ 번째 삽입의 우선순위가 고정이므로, 우선순위가 큰 자리부터 작은 키를 차례로 배정하면
 * 된다. 실제로 지어 보면 원소 1,024·4,096·16,384 개에서 평균 깊이가 512.5·2,048.5·8,192.5
 * 이고 최대 깊이가 **원소 수와 같다**(완전한 사슬). 같은 입력을 난수 우선순위에 주면
 * 12.3·14.0·17.0 에 머문다. **결정론적 구현은 「호출자가 어떤 입력을 주든」을 지키지
 * 못한다.**
 *
 * 그 대가는 재현성이다 — seed 를 고정하는 쪽은 하네스이고 이 난수는 그 고정 밖에 있다.
 * **재 보니 판정이 흔들리지 않는다**: 계약 스위트를 20회 돌려 전부 통과했고, 마지막 구간의
 * $r$ 이 가장 넓게 흔들린 행에서도 1.047~1.297 로 허용 구간(0.84~1.56)의 3분의 1을 쓴다.
 * `expected` 계약에서 판정이 seed 다섯의 중앙값인 것이 이 흔들림을 흡수한다
 * (§규약2 「무작위를 쓰는 정본과 재현성」).
 *
 * **읽기 연산은 트리를 재구성하지 않는다.** `has`·`min`·`max`·`range` 가 내려가기만 한다.
 * 갈랐다 잇는 것(`#split`·`#merge`)이 답을 내는 데 더 짧게 적히는 자리가 있지만, 읽기가
 * 쓰기 비용을 무는 구현은 계약의 상한을 지키더라도 이 파일이 보일 것을 흐린다 — 이 계약이
 * 기대 로그를 얻는 것은 **트리의 모양**에서이지 접근이 모양을 고쳐서가 아니다
 * (`tree/splayTree` 가 그 반대쪽이다).
 */

// #region guide:core/types
type Comparator<T> = (a: T, b: T) => number;

/**
 * 트리의 자리 하나.
 *
 * 키는 이진 탐색 트리의 순서를, 우선순위는 힙의 순서를 지킨다. 두 순서를 함께 지키는
 * 모양은 **키·우선순위 쌍에 대해 하나뿐이다** — 그래서 넣은 차례가 달라도 같은 집합이면
 * 같은 트리가 나오고, 우선순위가 키와 무관하면 그 모양이 무작위로 지은 것과 같아진다.
 */
interface Node<T> {
  key: T;
  prio: number;
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
export class Treap<T> {
  #root: Node<T> | null = null;
  readonly #compare: Comparator<T>;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compare = comparator ?? defaultComparator;
  }

  insert(item: T): void {
    const [below, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, above] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );

    if (equal !== null) {
      // 동등한 원소가 이미 있다. 갈랐던 것을 그대로 다시 잇는다 — 키와 우선순위가 모양을
      // 하나로 정하므로 되돌린 트리는 가르기 전과 같은 트리다.
      this.#root = this.#merge(this.#merge(below, equal), above);
      return;
    }

    const fresh: Node<T> = {
      key: item,
      prio: this.#nextPrio(),
      left: null,
      right: null,
    };
    this.#root = this.#merge(this.#merge(below, fresh), above);
  }

  delete(item: T): boolean {
    const [below, rest] = this.#split(
      this.#root,
      (key) => this.#compare(key, item) < 0,
    );
    const [equal, above] = this.#split(
      rest,
      (key) => this.#compare(key, item) <= 0,
    );

    this.#root = this.#merge(below, above);
    if (equal === null) return false;
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
   * 구간에 드는 원소만 모은다.
   *
   * 양쪽으로 다 내려가지 않는 것이 상한을 지키는 자리다 — 지금 값이 하한 이하면 왼쪽에
   * 구간에 드는 것이 없고, 상한 이상이면 오른쪽에 없다. 그래서 걸음 수가 **내려간 길
   * 둘과 담은 원소 수**의 합에 묶인다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#collect(this.#root, low, high, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    const pending: Node<T>[] = [];
    let at = this.#root;
    while (at !== null || pending.length > 0) {
      while (at !== null) {
        this.__cost += 1;
        pending.push(at);
        at = at.left;
      }
      const node = pending.pop() as Node<T>;
      out.push(node.key);
      at = node.right;
    }
    return out;
  }

  #collect(node: Node<T> | null, low: T, high: T, out: T[]): void {
    if (node === null) return;
    this.__cost += 1;
    const vsLow = this.#compare(node.key, low);
    const vsHigh = this.#compare(node.key, high);
    if (vsLow > 0) this.#collect(node.left, low, high, out);
    if (vsLow >= 0 && vsHigh <= 0) out.push(node.key);
    if (vsHigh < 0) this.#collect(node.right, low, high, out);
  }

  /**
   * `goLeft` 가 참인 키 전부를 왼쪽 조각으로 가른다.
   *
   * `goLeft` 는 정렬 순서에 대해 **단조**여야 한다 — 앞쪽 구간에서만 참이어야 갈라진 두
   * 조각이 각각 정렬 상태를 지킨다. 우선순위는 건드리지 않으므로 두 조각 다 힙 순서를
   * 그대로 물려받는다.
   */
  #split(
    node: Node<T> | null,
    goLeft: (key: T) => boolean,
  ): [Node<T> | null, Node<T> | null] {
    if (node === null) return [null, null];
    this.__cost += 1;
    if (goLeft(node.key)) {
      const [inner, right] = this.#split(node.right, goLeft);
      node.right = inner;
      return [node, right];
    }
    const [left, inner] = this.#split(node.left, goLeft);
    node.left = inner;
    return [left, node];
  }

  /**
   * `a` 의 모든 키가 `b` 의 모든 키보다 앞선다는 전제에서 둘을 잇는다.
   *
   * 우선순위가 큰 쪽이 위로 간다. 그래야 이은 결과도 힙 순서를 지키고, **가르기와 잇기가
   * 서로의 역**이 된다 — 같은 기준으로 갈랐다 다시 이으면 원래 트리가 그대로 돌아온다.
   */
  #merge(a: Node<T> | null, b: Node<T> | null): Node<T> | null {
    if (a === null) return b;
    if (b === null) return a;
    this.__cost += 1;
    if (a.prio > b.prio) {
      a.right = this.#merge(a.right, b);
      return a;
    }
    b.left = this.#merge(a, b.left);
    return b;
  }

  /**
   * 새 자리의 우선순위를 뽑는다.
   *
   * **이 한 줄이 계약의 무게를 전부 진다**(파일 헤더). 여기를 결정론적 함수로 바꾸면
   * 호출자가 그 함수를 역산해 사슬을 만들 수 있고, 그러면 「호출자가 어떤 입력을 주든」이
   * 거짓이 된다. 뽑기가 호출자에게 보이지 않아야 하는 것이지 잘 섞이기만 하면 되는 것이
   * 아니다.
   */
  #nextPrio(): number {
    return Math.random();
  }
}
// #endregion
