/**
 * DynamicArray (동적 배열)
 *
 * JavaScript의 Array처럼 크기가 자동으로 늘어나고 줄어드는 배열을 직접 구현한다.
 * 내부적으로 고정 크기 배열(Uint8Array 대신 일반 배열 슬롯)을 사용하고,
 * 용량이 부족하면 2배로 확장(doubling), 1/4 이하로 줄면 절반으로 축소한다.
 * 이 전략 덕분에 push는 분할 상환 O(1)이 된다.
 *
 * 요구사항:
 * - push(item): 맨 뒤에 원소를 추가한다. amortized O(1)
 * - pop(): 맨 뒤 원소를 제거하고 반환한다. O(1)
 * - get(index): index번 원소를 반환한다. O(1)
 * - set(index, item): index번 원소를 교체한다. O(1)
 * - size(): 현재 원소 개수를 반환한다. O(1)
 * - capacity(): 현재 내부 배열 크기를 반환한다. O(1)
 * - toArray(): 현재 원소들의 복사 배열을 반환한다. O(n)
 *
 * 시간복잡도:
 * - push: amortized O(1) — 더블링으로 총 복사 횟수가 O(n)에 수렴
 * - pop: O(1)
 * - get/set: O(1)
 * - size/capacity: O(1)
 * - toArray: O(n)
 *
 * 용량 정책:
 * - 초기 capacity = 4
 * - push 시 capacity 초과 → capacity *= 2
 * - pop 시 size <= capacity / 4 이고 capacity > 4 → capacity /= 2
 */

export class DynamicArray<T> {
  private _data: (T | undefined)[];
  private _size: number;
  private _capacity: number;

  constructor() {
    this._capacity = 4;
    this._size = 0;
    this._data = new Array<T | undefined>(this._capacity);
  }

  /**
   * 맨 뒤에 원소를 추가한다.
   * 용량이 부족하면 2배로 확장한다.
   */
  push(item: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 맨 뒤 원소를 제거하고 반환한다.
   * 원소 개수가 capacity의 1/4 이하이고 capacity > 4이면 절반으로 축소한다.
   * 비어있으면 undefined를 반환한다.
   */
  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * index번 원소를 반환한다.
   * 범위를 벗어나면 undefined를 반환한다.
   */
  get(index: number): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * index번 원소를 item으로 교체한다.
   * 유효 범위(0 이상 size 미만)를 벗어나면 아무것도 하지 않는다.
   */
  set(index: number, item: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 현재 원소 개수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 현재 내부 배열(슬롯)의 크기를 반환한다.
   */
  capacity(): number {
    throw new Error("Not implemented");
  }

  /**
   * 현재 원소들의 복사본 배열을 반환한다.
   */
  toArray(): T[] {
    throw new Error("Not implemented");
  }
}
