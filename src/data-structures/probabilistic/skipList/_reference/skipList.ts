/**
 * `probabilistic/skipList` 정본(규약2).
 *
 * 계약은 `../skipList.ts` 헤더 한 곳이고, 그 계약은 `tree/treap` 의 계약과 같다. 이 파일은 그 계약을 지키는
 * 구현 **하나**이고 `tree/treap` 정본과 **다른 기법**을 보이려고 따로 둔다(§규약1 「성격 전환은 이렇게 적는다」
 * 산출물 넷) — 저쪽은 우선순위를 뽑아 트리 모양을 무작위로 만들고, 이쪽은 **층을 뽑아 건너뛰는 줄을 무작위로
 * 만든다.**
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"마디 하나를 지나가거나 한 층 내려갈 때마다 1"* 이다 — 나란한 정본들이
 * 「노드 하나를 지나갈 때마다 1」로 세는 것과 같은 단위다. 읽기와 쓰기를 따로 세지 않고 런타임이 배열을 늘리는
 * 일도 세지 않는다(§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **층의 윗끝을 두지 않는다.** 이 이름의 교과서 설계는 최대 층(`MAX_LEVEL = 16`)을 고정하는데, 고정하면 담긴 수가
 * $2^{16}$ 을 넘은 뒤 맨 윗줄에 마디가 $n / 2^{16}$ 개 남아 기대 비용이 담긴 수에 비례한다 — **계약을 어긴다.**
 * 축3 사다리 끝($2^{14}$)이 그 문턱 아래라 16 으로는 안 보이고, 윗끝을 4 로 낮춘 사본이 걸린다
 * (`_contract/_fixtures/cappedLevelSkipList.ts`). 여기서는 동전을 앞면이 안 나올 때까지 던져 층을 정하고 머리를
 * 필요한 만큼 늘린다 — 층의 기대 최댓값이 $\log_2 n$ 에 상수를 더한 값이다.
 *
 * **`#randomHeight` 의 난수 한 줄이 이 계약을 지탱한다.** 층을 넣은 차례나 키의 함수로 정하면 — 씨앗을 고정한
 * 의사 난수도 마찬가지로 — 그 함수를 따라 한 층짜리 마디만 한쪽에 몰아 두는 입력이 실재한다
 * (`_contract/_fixtures/seededLevelSkipList.ts`). `tree/treap` 정본이 우선순위에서 겪은 것과 같은 자리다
 * (§규약2 「무작위를 쓰는 정본과 재현성」). **그 대가로 이 파일의 계측값은 실행마다 다르다** — 관측값을 절대
 * 수치로 적지 않고 여러 번 돌려 얻은 범위로 적는다(같은 절 규칙 3).
 */

// #region guide:core
type Comparator<T> = (a: T, b: T) => number;

/** 줄의 마디 하나. `next[i]` 가 i 층에서 다음 마디다 — 층 수가 곧 `next.length` 다. */
interface Node<T> {
  readonly key: T;
  readonly next: (Node<T> | null)[];
}

/** 머리. 키가 없고 층 수가 지금 가장 높은 마디의 층 수와 같다. */
interface Head<T> {
  readonly next: (Node<T> | null)[];
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export class SkipList<T> {
  readonly #head: Head<T> = { next: [] };
  readonly #compare: Comparator<T>;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator?: Comparator<T>) {
    this.#compare = comparator ?? defaultComparator;
  }

  insert(item: T): void {
    const path = this.#pathBefore(item);
    const found = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    if (found !== null && this.#compare(found.key, item) === 0) return;

    const height = this.#randomHeight();
    const node: Node<T> = { key: item, next: new Array(height).fill(null) };
    for (let level = 0; level < height; level++) {
      // 머리보다 높은 층은 머리 바로 뒤에 붙는다.
      const before = path[level] ?? this.#head;
      node.next[level] = before.next[level] ?? null;
      before.next[level] = node;
      this.__cost += 1;
    }
  }

  delete(item: T): boolean {
    const path = this.#pathBefore(item);
    const found = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    if (found === null || this.#compare(found.key, item) !== 0) return false;

    for (let level = 0; level < found.next.length; level++) {
      (path[level] as Head<T> | Node<T>).next[level] =
        found.next[level] ?? null;
      this.__cost += 1;
    }
    // 비어 버린 맨 윗줄을 머리에서 걷어 낸다 — 다음 내려가기가 빈 줄을 지나지 않게.
    while (
      this.#head.next.length > 0 &&
      this.#head.next[this.#head.next.length - 1] === null
    ) {
      this.#head.next.pop();
      this.__cost += 1;
    }
    return true;
  }

  has(item: T): boolean {
    const path = this.#pathBefore(item);
    const found = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    this.__cost += 1;
    return found !== null && this.#compare(found.key, item) === 0;
  }

  min(): T | null {
    this.__cost += 1;
    return this.#head.next[0]?.key ?? null;
  }

  max(): T | null {
    let at: Head<T> | Node<T> = this.#head;
    for (let level = this.#head.next.length - 1; level >= 0; level--) {
      this.__cost += 1;
      let next: Node<T> | null = at.next[level] ?? null;
      while (next !== null) {
        at = next;
        next = at.next[level] ?? null;
        this.__cost += 1;
      }
    }
    this.__cost += 1;
    return at === this.#head ? null : (at as Node<T>).key;
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    this.__cost += 1;
    if (this.#compare(low, high) > 0) return out;
    const path = this.#pathBefore(low);
    let at = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    while (at !== null && this.#compare(at.key, high) <= 0) {
      out.push(at.key);
      at = at.next[0] ?? null;
      this.__cost += 1;
    }
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    let at = this.#head.next[0] ?? null;
    while (at !== null) {
      out.push(at.key);
      at = at.next[0] ?? null;
      this.__cost += 1;
    }
    this.__cost += 1;
    return out;
  }

  /**
   * 층마다 `item` 보다 작은 마지막 자리를 모은다. `path[i]` 가 i 층의 그 자리이고, 위에서부터 내려가며 한 층
   * 안에서는 다음 키가 `item` 보다 작은 동안만 나아간다. 길이는 적어도 1 이다.
   */
  #pathBefore(item: T): (Head<T> | Node<T>)[] {
    // 빈 줄이면 머리 하나만 든 자리를 돌려준다 — 부르는 쪽이 0 층 자리를 늘 읽을 수 있게.
    const path: (Head<T> | Node<T>)[] = new Array(
      Math.max(1, this.#head.next.length),
    ).fill(this.#head);
    let at: Head<T> | Node<T> = this.#head;
    for (let level = this.#head.next.length - 1; level >= 0; level--) {
      this.__cost += 1;
      let next: Node<T> | null = at.next[level] ?? null;
      while (next !== null && this.#compare(next.key, item) < 0) {
        at = next;
        next = at.next[level] ?? null;
        this.__cost += 1;
      }
      path[level] = at;
    }
    return path;
  }

  /** 앞면이 나오는 동안 한 층씩 올린다. 머리가 모자라면 늘린다. */
  #randomHeight(): number {
    let height = 1;
    while (Math.random() < 0.5) height += 1;
    while (this.#head.next.length < height) this.#head.next.push(null);
    return height;
  }
}
// #endregion
