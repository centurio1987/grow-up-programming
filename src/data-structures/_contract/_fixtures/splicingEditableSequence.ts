/**
 * 결함 fixture — 원소를 배열 하나에 순서대로 들고 커서를 정수 하나로 기억하는 수열.
 *
 * `linear/gapBuffer` 계약의 **자명한 첫 시도**다. 커서를 옮기는 일이 정수 하나를 고치는
 * 것뿐이라 상수인데, 그 대가로 **끼워 넣기와 지우기가 커서 뒤 원소를 전부 민다.**
 *
 * **축1은 전부 통과한다** — 값이 하나도 틀리지 않는다. 어기는 것은 비용 조건이고, 계약이
 * 배제하려는 것이 정확히 이 계열이다(`gapBuffer.ts` 헤더의 필요충분조건 비용 줄).
 *
 * **걸리는 자리가 셋이다.**
 * - `insert` 시나리오 — 커서를 가운데 두고 넣으므로 호출마다 뒤 절반이 밀린다. 상각 평균이
 *   선형이라 `amortized O(1)` 이 이미 배제한다.
 * - `deleteBefore` 시나리오 — 같은 이유로 단일 호출 최대 비용이 선형이다.
 * - **먼 뜀 시나리오 — 여기서는 반대로 「너무 빠르다」로 걸린다.** 커서 이동이 상수라
 *   $r$ 이 1.0 이고 그 시나리오의 기대 계급은 `O(n)` 이다. **계약 위반이 아니다**(상한은
 *   위쪽 경계다). 축3이 계급을 판정하기 때문에 나는 실패이고, 그 사실을 여기 적어 둔다
 *   (불변 사실 49).
 *
 * **가까운 이동 시나리오는 통과한다.** 커서를 한 칸 옮기는 일이 상수이기 때문이다 — 「편집
 * 지역성」을 겨눈 시나리오 하나만으로는 이 계열을 못 잡는다는 뜻이고, 시나리오를 여섯 둔
 * 근거가 여기 있다.
 */

export class SplicingEditableSequence<T> {
  /** 담긴 것을 순서대로 든다. 길이가 곧 원소 수다. */
  #items: T[] = [];
  /** 커서 자리. 원소에 붙어 다니지 않고 순번으로만 산다. */
  #at = 0;

  __cost = 0;

  insert(item: T): void {
    // 끼운 자리 뒤가 전부 한 칸씩 밀린다. 그 비용이 여기서 세어진다.
    this.__cost += this.#items.length - this.#at + 1;
    this.#items.splice(this.#at, 0, item);
    this.#at += 1;
  }

  deleteBefore(): T | null {
    if (this.#at === 0) return null;
    this.#at -= 1;
    this.__cost += this.#items.length - this.#at + 1;
    return this.#items.splice(this.#at, 1)[0] as T;
  }

  moveCursor(position: number): void {
    if (
      !Number.isInteger(position) ||
      position < 0 ||
      position > this.#items.length
    ) {
      throw new RangeError(
        `커서 자리는 0 이상 ${this.#items.length} 이하의 정수여야 한다 — 받은 값은 ${position} 이다`,
      );
    }
    // 옮길 것이 없다. 커서가 원소와 떨어져 있으므로 거리와 무관하게 상수다.
    this.__cost += 1;
    this.#at = position;
  }

  cursor(): number {
    this.__cost += 1;
    return this.#at;
  }

  length(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  toArray(): T[] {
    this.__cost += this.#items.length + 1;
    return [...this.#items];
  }
}
