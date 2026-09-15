/**
 * 판정 도구 fixture — **결함이 아니다.** `linear/bitArray` 계약을 자리마다 불리언 하나를 담는 언어 배열로
 * 지키는 구현.
 *
 * 이 구조가 이름을 얻은 이유(자리 하나를 비트 하나에 담는다)를 **무시하는** 구현이다. 자리 하나에 언어
 * 배열의 칸 하나를 쓰므로 비트 배열보다 자리를 여러 배 더 쓴다(수치는 `docs/ORD-006-runbook.md` 불변 사실
 * 206 과 이 fixture 를 쓴 배치의 탐침). 그런데 네 행을 전부 상수에 하고 값도 전부 옳다 — 계약이 공간을
 * 말하지 않고 자리의 폭을 읽는 연산도 없기 때문이다.
 *
 * **이 fixture 가 「공간이 존재 이유」 판별 절차의 셋째 걸음을 이 계약에서 실제로 돌리는 자리다**
 * (`docs/ORD-006-conventions.md:2872-2879` · 셋째 걸음의 축 `:3037-3040`). 공간 제약을 무시한 구현을 어느
 * 축도 갈라내지 못하면 B15 처분(존치 + 성격 전환)이다. 자기시험이 그것을 단정한다. 헤더의 검증 등급이
 * 든 자명한 구현도 바로 이것이다.
 *
 * 계측 단위는 정본과 같다 — 칸 하나를 지나갈 때마다 1(§규약2 계측 단위). 생성자는 칸 n 개를 끄는 몫을
 * 한 번에 더한다.
 */

export class BooleanSlotBits {
  readonly #slots: boolean[];

  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`자리 수 ${n}`);
    this.#slots = new Array<boolean>(n).fill(false);
    this.__cost += n + 1;
  }

  set(index: number): void {
    this.#check(index);
    this.__cost += 1;
    this.#slots[index] = true;
  }

  clear(index: number): void {
    this.#check(index);
    this.__cost += 1;
    this.#slots[index] = false;
  }

  get(index: number): boolean {
    this.#check(index);
    this.__cost += 1;
    return this.#slots[index] as boolean;
  }

  size(): number {
    this.__cost += 1;
    return this.#slots.length;
  }

  #check(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#slots.length)
      throw new RangeError(`첨자 ${index}`);
  }
}
