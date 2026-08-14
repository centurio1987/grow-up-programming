/**
 * 결함 fixture — 넣기를 버퍼에 미뤄 두었다가 읽을 때 한꺼번에 정렬해 합치는 우선순위 큐.
 *
 * 앞의 둘(`scanningPriorityQueue`·`sortedArrayPriorityQueue`)과 다른 계열이다. 저 둘은
 * 계약이 검증 등급 항목에 든 **자명한 구현**이고, 이쪽은 자명하지 않다 — 미뤄 두기와
 * 한꺼번에 갚기라는 상각 설계가 들어가 있다. **답은 전부 옳다**(축1 통과).
 *
 * 걸리는 자리가 둘이고 이유가 다르다.
 *
 * - **`peek`·`size`·`isEmpty` 시나리오.** 세 행이 `worst O(1)` 인데 버퍼가 밀려 있는 상태의
 *   첫 `peek` 하나가 원소 수에 비례한다. `worst` 통계가 최댓값이라 그 한 번이 그대로
 *   보고된다 — 시퀀스 평균으로 재면 묻힌다. **세 행을 `worst` 로 적은 것이 사는 자리다.**
 * - **`dequeue` 적대적 시나리오(크기를 유지하며 번갈아 부르기).** 빼기마다 버퍼에 원소가
 *   하나씩 밀려 있으므로 매번 전체를 다시 합쳐야 하고, 그 일이 원소 수에 비례한다.
 *
 * **`dequeue` 비적대 시나리오는 통과하는데 그 통과에 계약 위반이 숨어 있다**(불변 사실 62).
 * 채운 뒤 전부 빼기만 하면 정렬이 한 번뿐이라 상각이 실제로 성립한다 — 같은 행을 겨눈
 * 시나리오 둘 중 하나만 이 계열을 잡는다.
 *
 * `enqueue` 두 시나리오는 통과하고 거기에는 위반이 없다. 넣기가 실제로 상수다.
 */

export class DeferredSortPriorityQueue<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 비교자 기준 **내림차순**. 최우선 원소가 끝에 온다. */
  #ordered: T[] = [];
  /** 아직 자리를 못 찾은 원소들. 읽는 호출이 올 때까지 그대로 둔다. */
  #pending: T[] = [];

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.#pending.push(item);
    this.__cost += 1;
  }

  dequeue(): T | null {
    this.#settle();
    this.__cost += 1;
    if (this.#ordered.length === 0) return null;
    return this.#ordered.pop() as T;
  }

  peek(): T | null {
    this.#settle();
    this.__cost += 1;
    if (this.#ordered.length === 0) return null;
    return this.#ordered[this.#ordered.length - 1] as T;
  }

  size(): number {
    this.__cost += 1;
    return this.#ordered.length + this.#pending.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#ordered.length + this.#pending.length === 0;
  }

  /** 밀려 있던 원소를 정렬해 본줄에 합친다. 견준 자리와 옮겨 적은 자리를 모두 센다. */
  #settle(): void {
    if (this.#pending.length === 0) return;

    const pending = this.#pending;
    pending.sort((a, b) => {
      this.__cost += 1;
      return this.#compare(b, a);
    });

    const merged: T[] = [];
    let left = 0;
    let right = 0;
    while (left < this.#ordered.length || right < pending.length) {
      this.__cost += 1;
      if (right >= pending.length) {
        merged.push(this.#ordered[left++] as T);
        continue;
      }
      if (left >= this.#ordered.length) {
        merged.push(pending[right++] as T);
        continue;
      }
      const takeOrdered =
        this.#compare(this.#ordered[left] as T, pending[right] as T) > 0;
      merged.push(
        takeOrdered ? (this.#ordered[left++] as T) : (pending[right++] as T),
      );
    }

    this.#ordered = merged;
    this.#pending = [];
  }
}
