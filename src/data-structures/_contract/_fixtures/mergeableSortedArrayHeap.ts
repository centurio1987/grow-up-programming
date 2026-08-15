/**
 * 결함 fixture — 원소를 **늘 정렬해** 배열 한 줄에 두고, 합치기를 두 정렬 배열을 훑어 잇는
 * 일로 하는 우선순위 큐. 최우선 원소가 끝에 오도록 내림차순으로 둔다.
 *
 * 검증 등급 항목이 든 **자명한 구현** 둘 중 하나다(다른 하나는 순서 없이 쌓아 두는 쪽).
 * 언어가 내주는 배열의 기본 연산만 쓰고 재균형도 상각 설계도 없다. **답은 전부 옳다**
 * (축1 통과).
 *
 * 걸리는 행이 둘이고 그중 하나는 시나리오 둘에서 함께 걸린다.
 *
 * - **`enqueue` 시나리오 둘 다.** 자리를 지키려면 새 원소 뒤를 통째로 밀어야 하고 그 일이
 *   원소 수에 비례한다. 무작위 넣기는 절반씩 밀어 987 · 3,991 · 16,332 이고, 오름차순
 *   넣기는 **매번 통째로** 밀어 1,024 · 4,096 · 16,384 다. `ascending` 비교자에서
 *   오름차순으로 들어오는 값은 늘 **최우선이 아니라 가장 뒤**이므로 내림차순으로 둔 배열의
 *   맨 앞에 들어간다.
 * - **`merge` 시나리오.** 두 정렬 배열을 잇는 일이 양쪽 길이의 합에 비례한다.
 *
 * **이 행의 두 시나리오가 겨누는 계열이 갈리지 않는다는 것을 여기 적어 둔다.** 담는 쪽
 * 계약(`heap/priorityQueue`)에서는 적대적 입력이 내림차순이라 그것이 이 계열에 최선이었고,
 * 그래서 무작위 시나리오가 이 계열을 혼자 잡았다. 이 계약은 적대적 입력을 오름차순으로
 * 골랐고(합치기로 넣는 계열에서 내림차순이 아무것도 재지 못하기 때문이다) 그 방향은 이
 * 계열에도 최악이다. **적대성은 (계약, 구현) 쌍에 대해 정의된다**(불변 사실 57) — 같은
 * 구현이 두 계약에서 반대쪽 시나리오에 걸린다.
 *
 * `dequeue`·`peek`·`size`·`isEmpty` 는 통과하고 거기에는 위반이 없다 — 최우선 원소가 배열
 * 끝에 있으므로 넷 다 실제로 상수다.
 */

export class MergeableSortedArrayHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 비교자 기준 **내림차순**. 최우선 원소가 끝에 온다. */
  #ordered: T[] = [];

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    const ordered = this.#ordered;
    let at = ordered.length;
    // 뒤에서부터 자리를 찾아 앞으로 민다. 견준 자리와 민 자리를 모두 센다.
    while (at > 0 && this.#compare(ordered[at - 1] as T, item) < 0) {
      this.__cost += 1;
      ordered[at] = ordered[at - 1] as T;
      at -= 1;
    }
    this.__cost += 1;
    ordered[at] = item;
  }

  dequeue(): T | null {
    this.__cost += 1;
    if (this.#ordered.length === 0) return null;
    return this.#ordered.pop() as T;
  }

  merge(other: MergeableSortedArrayHeap<T>): void {
    if (other === this) throw new TypeError("자기 자신과 합칠 수 없다");

    const merged: T[] = [];
    let mine = 0;
    let theirs = 0;
    while (mine < this.#ordered.length || theirs < other.#ordered.length) {
      this.__cost += 1;
      if (theirs >= other.#ordered.length) {
        merged.push(this.#ordered[mine++] as T);
        continue;
      }
      if (mine >= this.#ordered.length) {
        merged.push(other.#ordered[theirs++] as T);
        continue;
      }
      const takeMine =
        this.#compare(this.#ordered[mine] as T, other.#ordered[theirs] as T) <
        0;
      merged.push(
        takeMine
          ? (this.#ordered[mine++] as T)
          : (other.#ordered[theirs++] as T),
      );
    }

    this.#ordered = merged;
    other.#ordered = [];
  }

  peek(): T | null {
    this.__cost += 1;
    if (this.#ordered.length === 0) return null;
    return this.#ordered[this.#ordered.length - 1] as T;
  }

  size(): number {
    this.__cost += 1;
    return this.#ordered.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#ordered.length === 0;
  }
}
