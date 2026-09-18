/**
 * `linear/dynamicArray` 정본(규약2).
 *
 * 계약은 `../dynamicArray.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 헤더가 검증 등급 근거로 든 자명한 구현 — 언어 배열 하나에
 * 넣기 · 빼기를 그대로 맡기는 것 — 도 이 계약을 지킨다.
 *
 * **이 정본은 자명한 구현보다 한 걸음 더 간다 — 칸을 직접 잡고 직접 옮긴다.** 언어 배열에 늘리기를
 * 맡기면 §규약2 계측 단위가 런타임 재할당을 세지 않아 `push` 가 호출마다 1 로 보이고, 계약이
 * `push` · `pop` 을 `amortized` 로 적은 이유가 계측에 드러나지 않는다(불변 사실 197). 여기서는 칸이 모자라면
 * 두 배 칸으로 옮기고, 담긴 수가 칸의 4분의 1 이하로 떨어지면 절반 칸으로 옮기며, **옮긴 원소마다
 * 1 을 센다.** 두 문턱 사이가 벌어져 있어 한 번 옮긴 뒤 다시 옮기려면 그 사이만큼 넣거나 빼야 하므로
 * 넣기 · 빼기의 상각 평균이 상수로 남는다. 절반 이하에서 곧바로 줄이는 구현은 그 사이가 없어 경계에서
 * 호출마다 옮긴다(`_contract/_fixtures/halfShrinkArray.ts`).
 *
 * 칸 수 · 문턱은 계약이 아니다 — 헤더가 `capacity()` 와 정책을 표면에서 뺀 자리다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를 따로 세지
 * 않고**, 언어 런타임이 새 칸 뭉치를 잡는 비용도 세지 않는다(§규약2 계측 단위). 넣기 · 빼기 · 읽기 ·
 * 쓰기는 칸 하나라 1, 옮기기는 옮긴 원소마다 1, `toArray` 는 원소마다 1 이다. 빈 수열의 `pop` 은 지나갈 칸이 없어 0 이다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core
/** 칸을 이 아래로는 줄이지 않는다. 계약이 아니라 이 정본의 선택이다. */
const MIN_SLOTS = 4;

export class DynamicArray<T> {
  /** 칸 뭉치. 길이가 칸 수이고, 앞의 `#count` 칸만 원소가 산다. */
  #slots: (T | undefined)[] = new Array(MIN_SLOTS);
  #count = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  push(item: T): void {
    if (this.#count === this.#slots.length)
      this.#moveTo(this.#slots.length * 2);
    this.__cost += 1;
    this.#slots[this.#count] = item;
    this.#count += 1;
  }

  pop(): T | null {
    if (this.#count === 0) return null;
    this.__cost += 1;
    this.#count -= 1;
    const item = this.#slots[this.#count] as T;
    // 뺀 칸의 참조를 놓아 준다. 칸이 원소를 붙들고 있으면 나간 값이 살아 있다.
    this.#slots[this.#count] = undefined;
    const slots = this.#slots.length;
    if (slots > MIN_SLOTS && this.#count * 4 <= slots) this.#moveTo(slots / 2);
    return item;
  }

  get(index: number): T | null {
    this.__cost += 1;
    if (!this.#holds(index)) return null;
    return this.#slots[index] as T;
  }

  set(index: number, item: T): void {
    this.__cost += 1;
    if (!this.#holds(index))
      throw new RangeError(
        `첨자 ${index} 는 [0, ${this.#count}) 안의 정수가 아니다`,
      );
    this.#slots[index] = item;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let at = 0; at < this.#count; at++) {
      this.__cost += 1;
      out.push(this.#slots[at] as T);
    }
    return out;
  }

  #holds(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.#count;
  }

  /**
   * 칸 수가 `slots` 인 새 뭉치로 원소를 옮긴다.
   *
   * 호출 하나는 담긴 수에 비례한다. 늘린 직후에는 칸의 절반이 차 있어 다시 늘리려면 그만큼 넣어야
   * 하고, 줄인 직후에도 칸의 절반이 차 있어 다시 줄이려면 칸의 4분의 1 만큼 빼야 한다. 옮긴 양이 그
   * 사이의 넣기 · 빼기 수에 비례하므로 계약이 `push` · `pop` 에 적은 `amortized` 가 여기서 선다.
   */
  #moveTo(slots: number): void {
    const next = new Array<T | undefined>(slots);
    for (let at = 0; at < this.#count; at++) {
      this.__cost += 1;
      next[at] = this.#slots[at];
    }
    this.#slots = next;
  }
}
// #endregion
