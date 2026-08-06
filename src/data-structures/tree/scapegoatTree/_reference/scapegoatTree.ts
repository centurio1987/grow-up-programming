/**
 * `tree/scapegoatTree` 정본(규약2).
 *
 * 계약은 `../scapegoatTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — `tree/redBlackTree` 정본도 이 계약을
 * 지킨다(갱신까지 최악이면 상각도 만족한다). 계약이 요구하는 것은 **조회 넷은 호출
 * 하나하나가, 갱신 둘은 시퀀스 평균이 로그 안**이라는 것뿐이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — 나란한 계약 셋과
 * 같은 단위를 쓴다. 읽기와 쓰기를 따로 세지 않는다(§규약2 계측 단위). `__cost` 는 계약이
 * 아니라 정본의 의무다(불변 사실 23).
 *
 * **균형 인수 `ALPHA` 를 모듈 안에 고정한다.** 물려받은 표면은 이 값을 생성자 인자로 받고
 * 있었는데, 그것은 내부 표현의 누출이다 — 계약의 어느 문장도 「부분트리가 얼마나 치우쳐도
 * 되는가」를 말하지 않고, 말하는 순간 그것이 처방이다(불변 사실 36, §규약1 「금지 — 내부
 * 처방」). 이 구현이 고른 값이지 계약의 일부가 아니다.
 *
 * **이 구현이 조회에서 `worst` 를 주는 방법이 계약의 갈림과 맞닿아 있다.** 모든 부분트리의
 * 치우침을 `ALPHA` 아래로 묶어 두므로 높이가 $\log_{1/\alpha} n$ 을 넘지 않고, 그래서
 * **조회가 트리를 건드리지 않아도** 호출 하나하나가 로그 안이다. 접근한 자리를 끌어올려
 * 균형을 얻는 계열(`tree/splayTree`)은 이 행을 지키지 못한다 — 그 차이가 두 계약을 가른다.
 *
 * **갱신이 `amortized` 인 이유는 다시 짓기 때문이다.** 치우침이 한계를 넘은 자리를 찾으면
 * 그 부분트리를 통째로 **완전히 균형 잡힌 모양으로 다시 짓는다.** 그 한 번이 부분트리
 * 크기에 비례하므로 뿌리 근처가 걸리면 원소 수만큼 든다. 그 대신 다시 짓기 전까지 넣은
 * 원소들이 그 비용을 나눠 갚으므로 시퀀스 평균이 로그 안이다.
 */

// #region guide:core/types
type Comparator<T> = (a: T, b: T) => number;

/**
 * 트리의 자리 하나.
 *
 * 부분트리 크기를 들고 있는 것은 **치우침을 상수 시간에 재기 위해서다.** 매번 세면 판정
 * 자체가 부분트리 크기에 비례해 다시 짓기와 같은 비용이 든다.
 */
interface Node<T> {
  key: T;
  size: number;
  left: Node<T> | null;
  right: Node<T> | null;
}

function sizeOf<T>(node: Node<T> | null): number {
  return node === null ? 0 : node.size;
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * 부분트리 하나가 한쪽으로 얼마나 치우쳐도 되는가.
 *
 * 자식 하나가 부모의 이 비율을 넘으면 그 자리를 다시 짓는다. 값이 0.5 에 가까우면 트리가
 * 낮아지는 대신 다시 짓기가 잦아지고, 1 에 가까우면 반대다.
 *
 * **고를 수 있는 것은 $\frac12 < \alpha < 1$ 안에서다.** $\alpha \le \frac12$ 면 완전히
 * 균형 잡힌 자리도 조건을 어겨 다시 짓기가 끝없이 돌고, $\alpha \ge 1$ 이면 어떤 치우침도
 * 걸리지 않아 사슬을 막지 못한다. 그 구간 **안에서는** 어느 값을 골라도 높이가
 * $\log_{1/\alpha} n$ 에 묶이므로 계약이 값을 말하지 않는다 — 고르는 일은 구현의 몫이다.
 */
const ALPHA = 0.65;
// #endregion

// #region guide:core/class
export class ScapegoatTree<T> {
  #root: Node<T> | null = null;
  #count = 0;
  /** 마지막으로 다시 지은 뒤 최대로 커졌던 원소 수. 지우기 쪽 다시 짓기의 기준이다. */
  #highWater = 0;
  readonly #compare: Comparator<T>;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compare = comparator ?? defaultComparator;
  }

  /**
   * 내려가면서 길을 쌓아 두고, 넣은 뒤 그 길을 거슬러 올라가며 **가장 위쪽의 치우친
   * 자리**를 찾는다. 위쪽을 고르는 것이 요점이다 — 아래쪽을 고치면 곧 다시 걸린다.
   */
  insert(item: T): void {
    const path: Node<T>[] = [];
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      path.push(at);
      const cmp = this.#compare(item, at.key);
      // 동등한 원소가 이미 있으면 상태가 바뀌지 않는다. 크기도 건드리지 않는다.
      if (cmp === 0) return;
      at = cmp < 0 ? at.left : at.right;
    }

    const fresh: Node<T> = { key: item, size: 1, left: null, right: null };
    const parent = path[path.length - 1];
    if (parent === undefined) {
      this.#root = fresh;
    } else if (this.#compare(item, parent.key) < 0) {
      parent.left = fresh;
    } else {
      parent.right = fresh;
    }
    this.#count += 1;
    if (this.#count > this.#highWater) this.#highWater = this.#count;

    for (const node of path) node.size += 1;

    // 위에서부터 훑어 처음 걸리는 자리를 고른다.
    for (let i = 0; i < path.length; i++) {
      const node = path[i] as Node<T>;
      if (this.#tilted(node)) {
        this.#rebuild(node, i === 0 ? null : (path[i - 1] as Node<T>));
        return;
      }
    }
  }

  /**
   * 지우기는 치우침을 보지 않는다. **지운 수가 최대치의 일정 몫을 넘었을 때 뿌리를 통째로
   * 다시 짓는다** — 지우기만 반복하면 크기가 줄어 치우침 판정이 걸리지 않는데도 트리가
   * 성기게 남기 때문이다.
   */
  delete(item: T): boolean {
    const path: Node<T>[] = [];
    let at = this.#root;
    while (at !== null) {
      this.__cost += 1;
      const cmp = this.#compare(item, at.key);
      if (cmp === 0) break;
      path.push(at);
      at = cmp < 0 ? at.left : at.right;
    }
    if (at === null) return false;

    this.#remove(at, path);
    this.#count -= 1;
    for (const node of path) node.size -= 1;

    if (this.#count < ALPHA * this.#highWater) {
      if (this.#root !== null) this.#rebuild(this.#root, null);
      this.#highWater = this.#count;
    }
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
   * 구간에 드는 것이 없고, 상한 이상이면 오른쪽에 없다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#collect(this.#root, low, high, out);
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#flatten(this.#root, out);
    return out;
  }

  /** 자식 하나가 부모의 `ALPHA` 몫을 넘는가. 크기를 들고 있으므로 상수 시간이다. */
  #tilted(node: Node<T>): boolean {
    const limit = ALPHA * node.size;
    return sizeOf(node.left) > limit || sizeOf(node.right) > limit;
  }

  /**
   * `node` 를 뿌리로 하는 부분트리를 **완전히 균형 잡힌 모양**으로 다시 짓는다.
   *
   * 늘어놓고(정렬돼 있다) 가운데를 뿌리로 삼아 반씩 나누면 된다. 비용이 그 부분트리 크기에
   * 비례하고, 이 한 번이 갱신 한정자를 `worst` 에서 `amortized` 로 내리는 자리다.
   */
  #rebuild(node: Node<T>, parent: Node<T> | null): void {
    const items: T[] = [];
    this.#flatten(node, items);
    const rebuilt = this.#build(items, 0, items.length) as Node<T>;
    if (parent === null) this.#root = rebuilt;
    else if (parent.left === node) parent.left = rebuilt;
    else parent.right = rebuilt;
  }

  /** `[from, to)` 구간을 가운데부터 잡아 균형 잡힌 부분트리로 짓는다. */
  #build(items: readonly T[], from: number, to: number): Node<T> | null {
    if (from >= to) return null;
    const mid = (from + to) >> 1;
    this.__cost += 1;
    const left = this.#build(items, from, mid);
    const right = this.#build(items, mid + 1, to);
    return {
      key: items[mid] as T,
      size: to - from,
      left,
      right,
    };
  }

  /** 자리 하나를 트리에서 떼어 낸다. 두 자식이 다 있으면 오른쪽의 최솟값이 자리를 잇는다. */
  #remove(target: Node<T>, path: Node<T>[]): void {
    if (target.left !== null && target.right !== null) {
      // 뒤따르는 자리를 찾아 값을 옮기고, 그 자리를 대신 뗀다.
      const trail: Node<T>[] = [target];
      let heir = target.right;
      while (heir.left !== null) {
        this.__cost += 1;
        trail.push(heir);
        heir = heir.left;
      }
      target.key = heir.key;
      // 크기를 여기서 줄이지 않는다 — 이 자리들을 `path` 에 얹어 두면 호출부가 한 번에
      // 줄인다. **두 곳에서 줄이면 같은 자리가 두 번 깎이고, 그 어긋남은 어느 축에도
      // 안 보인다** — `size()` 는 따로 센 `#count` 를 쓰고 조회 넷은 이 필드를 읽지
      // 않으므로, 틀어지는 것은 다시 짓기 판정뿐이다.
      path.push(...trail);
      this.#detach(heir, trail[trail.length - 1] as Node<T>);
      return;
    }
    const parent = path[path.length - 1] ?? null;
    this.#detach(target, parent);
  }

  /** 자식이 하나 이하인 자리를 부모에서 떼고 그 자식을 붙인다. */
  #detach(node: Node<T>, parent: Node<T> | null): void {
    this.__cost += 1;
    const child = node.left ?? node.right;
    if (parent === null) {
      this.#root = child;
      return;
    }
    if (parent.left === node) parent.left = child;
    else parent.right = child;
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
   * 부분트리를 왼쪽부터 훑어 담는다.
   *
   * 높이가 로그에 묶이므로 **되돌이 호출이 쌓이는 깊이**가 로그다. 훑는 비용 자체는 담긴
   * 원소 수에 비례한다 — 이 둘은 다른 값이고, 여기서 작은 것은 앞엣것뿐이다.
   */
  #flatten(node: Node<T> | null, out: T[]): void {
    if (node === null) return;
    this.__cost += 1;
    this.#flatten(node.left, out);
    out.push(node.key);
    this.#flatten(node.right, out);
  }
}
// #endregion
