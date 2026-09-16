/**
 * 결함 fixture — 층을 정하는 규칙만 갈아 끼우는 건너뛰기 줄. `probabilistic/skipList`(= `tree/treap` 계약)의 **이 이름의
 * 흔한 결함 셋**과 정당한 사본을 한 파일에서 짓는다. 내려가기 · 잇기 · 걷어 내기는 정본
 * (`probabilistic/skipList/_reference/skipList.ts`)과 같고, 새 마디의 층 수를 생성자가 받은 규칙에서 얻는 것만 다르다.
 * 축1은 어느 규칙에서도 통과한다 — 층은 값에 닿지 않는다.
 *
 * | 규칙 | 무엇 | 이 계약에서 |
 * |---|---|---|
 * | `cappedLevels(16, 0.5)` | 물려받은 문제 문서의 설계 — 윗끝 16 · 승격 확률 0.5 | **어긴다**(담긴 수가 $2^{16}$ 을 넘으면 맨 윗줄에 마디가 $n/2^{16}$ 개쯤 남아 기대 비용이 선형). 사다리 끝 $2^{14}$ 가 문턱 아래라 **스위트가 못 본다** — 계약 위반이 숨은 통과(불변 사실 62) |
 * | `cappedLevels(4, 0.5)` | 같은 결함을 사다리 안으로 끌어온 사본 | 어긴다 — 걸린다 |
 * | `cappedLevels(Infinity, p)` | 승격 확률만 바꾼 정당한 사본 | 지킨다 — p 가 계약 표면에 없다는 실측(불변 사실 80 의 모양) |
 * | `seededLevels(seed)` | 재현성을 위해 **씨앗을 고정한** 의사 난수로 층을 정한다 | **어긴다** — 층의 수열이 넣은 차례의 함수라 한 층짜리 마디를 한쪽에 몰아 두는 입력이 실재한다. 그 입력은 구현을 읽어야 지어지므로 시나리오가 아니고(불변 사실 44) 스위트는 통과시킨다 |
 * | `uniformLevels(16)` | 층을 1~16 에서 **고르게** 뽑는다(승격을 기하 분포가 아니라 한 번에 고른다) | 어긴다 — 높은 층이 줄지 않아 윗줄마다 마디가 n/16 개쯤이다. 걸린다 |
 *
 * 규칙과 따로, 생성자의 `scanDelete` 를 켜면 **지우기가 층마다 머리부터 다시 훑어** 앞 마디를 찾는다(내려가며 모은 길을 쓰지
 * 않는다). 지우는 키의 순위만큼 0 층을 지나므로 기대 비용이 담긴 수에 비례해 **계약을 어기는데, 스위트의 지우기 시나리오가
 * 늘 맨 앞(최솟값)을 지워 그 순위가 0 이라 통과한다** — 이 스위트의 구멍이다(`_contract/runContract.skipList.test.ts`).
 *
 * 수치와 어느 시나리오에서 걸리는지는 `_contract/runContract.skipList.test.ts` 가 고정한다.
 */

type Comparator<T> = (a: T, b: T) => number;

interface Node<T> {
  readonly key: T;
  readonly next: (Node<T> | null)[];
}

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

/** 새 마디의 층 수(1 이상)를 내는 규칙. 부를 때마다 다음 마디의 층을 낸다. */
export type LevelRule = () => number;

/** 앞면이 나오는 동안 `promote` 확률로 한 층씩 올리되 `maxLevel` 을 넘기지 않는다. */
export function cappedLevels(maxLevel: number, promote: number): LevelRule {
  return () => {
    let height = 1;
    while (height < maxLevel && Math.random() < promote) height += 1;
    return height;
  };
}

/**
 * 씨앗을 고정한 선형 합동 수열로 동전을 던진다. 넣은 차례마다 같은 층이 나오므로 `seededHeightSequence` 로 미리 뽑아 볼 수 있다
 * — 자기시험이 그것으로 적대적 입력을 짓는다.
 */
export function seededLevels(seed: number): LevelRule {
  let state = seed >>> 0 || 1;
  const coin = () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return (state >>> 16) / 65536;
  };
  return () => {
    let height = 1;
    while (coin() < 0.5) height += 1;
    return height;
  };
}

/** `seededLevels(seed)` 가 처음 `count` 번 내는 층. 구현을 읽고 짓는 입력을 위한 것이다(불변 사실 44). */
export function seededHeightSequence(seed: number, count: number): number[] {
  const rule = seededLevels(seed);
  return Array.from({ length: count }, () => rule());
}

/** 층을 1 이상 `maxLevel` 이하에서 고르게 뽑는다. */
export function uniformLevels(maxLevel: number): LevelRule {
  return () => 1 + Math.floor(Math.random() * maxLevel);
}

export class LevelRuleSkipList<T> {
  readonly #head: Head<T> = { next: [] };
  #count = 0;
  readonly #compare: Comparator<T>;
  readonly #nextHeight: LevelRule;
  readonly #scanDelete: boolean;

  __cost = 0;

  constructor(
    nextHeight: LevelRule,
    options: { scanDelete?: boolean } = {},
    comparator?: Comparator<T>,
  ) {
    this.#nextHeight = nextHeight;
    this.#scanDelete = options.scanDelete ?? false;
    this.#compare = comparator ?? defaultComparator;
  }

  insert(item: T): void {
    const path = this.#pathBefore(item);
    const found = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    if (found !== null && this.#compare(found.key, item) === 0) return;
    const height = this.#nextHeight();
    while (this.#head.next.length < height) this.#head.next.push(null);
    const node: Node<T> = { key: item, next: new Array(height).fill(null) };
    for (let level = 0; level < height; level++) {
      const before = path[level] ?? this.#head;
      node.next[level] = before.next[level] ?? null;
      before.next[level] = node;
      this.__cost += 1;
    }
    this.#count += 1;
  }

  delete(item: T): boolean {
    const path = this.#pathBefore(item);
    const found = (path[0] as Head<T> | Node<T>).next[0] ?? null;
    if (found === null || this.#compare(found.key, item) !== 0) return false;
    for (let level = 0; level < found.next.length; level++) {
      let before = path[level] as Head<T> | Node<T>;
      if (this.#scanDelete) {
        // 모은 길을 버리고 이 층의 머리부터 다시 훑는다.
        before = this.#head;
        while (before.next[level] !== found) {
          before = before.next[level] as Node<T>;
          this.__cost += 1;
        }
      }
      before.next[level] = found.next[level] ?? null;
      this.__cost += 1;
    }
    while (
      this.#head.next.length > 0 &&
      this.#head.next[this.#head.next.length - 1] === null
    ) {
      this.#head.next.pop();
      this.__cost += 1;
    }
    this.#count -= 1;
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

  size(): number {
    this.__cost += 1;
    return this.#count;
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

  #pathBefore(item: T): (Head<T> | Node<T>)[] {
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
}
