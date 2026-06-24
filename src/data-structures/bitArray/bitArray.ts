/**
 * BitArray (비트 배열)
 *
 * 수백만 사용자의 방문 여부를 메모리 효율적으로 저장한다.
 * Set<number> 대비 32배의 메모리 절약을 달성한다.
 *
 * Uint32Array를 내부 저장소로 사용한다.
 * 각 32비트 정수가 32개의 비트(플래그)를 저장한다.
 *
 * 비트 연산:
 *   index번 비트가 속한 워드:  wordIndex = index >>> 5  (= Math.floor(index / 32))
 *   워드 내 비트 위치:         bitIndex  = index & 31   (= index % 32)
 *
 *   set:    words[wordIndex] |= (1 << bitIndex)
 *   clear:  words[wordIndex] &= ~(1 << bitIndex)
 *   get:    (words[wordIndex] >>> bitIndex) & 1
 *   toggle: words[wordIndex] ^= (1 << bitIndex)
 *
 * 요구사항:
 * - set(index): index번 비트를 1로 설정한다.
 * - clear(index): index번 비트를 0으로 설정한다.
 * - get(index): index번 비트 값을 반환한다. (true=1, false=0)
 * - toggle(index): index번 비트를 반전한다.
 * - count(): 1인 비트 개수를 반환한다. (popcount)
 * - size(): 전체 비트 개수를 반환한다.
 *
 * 시간복잡도:
 * - set/clear/get/toggle: O(1)
 * - count: O(n/32) — 워드 수에 비례
 * - size: O(1)
 */

export class BitArray {
  private words: Uint32Array;
  private _size: number;

  /**
   * @param size 비트 개수 (1 이상)
   */
  constructor(size: number) {
    if (size < 1) throw new RangeError("size must be >= 1");
    this._size = size;
    // 필요한 32비트 워드 개수: Math.ceil(size / 32)
    this.words = new Uint32Array(Math.ceil(size / 32));
  }

  /**
   * index번 비트를 1로 설정한다.
   * 범위를 벗어난 index는 무시한다.
   */
  set(index: number): void {
    throw new Error("Not implemented");
  }

  /**
   * index번 비트를 0으로 설정한다.
   * 범위를 벗어난 index는 무시한다.
   */
  clear(index: number): void {
    throw new Error("Not implemented");
  }

  /**
   * index번 비트 값을 반환한다.
   * 범위를 벗어난 index에 대해 false를 반환한다.
   */
  get(index: number): boolean {
    throw new Error("Not implemented");
  }

  /**
   * index번 비트를 반전한다.
   * 범위를 벗어난 index는 무시한다.
   */
  toggle(index: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 1인 비트 개수를 반환한다. (popcount / Hamming weight)
   * O(n/32) — 워드 수에 비례한다.
   */
  count(): number {
    throw new Error("Not implemented");
  }

  /**
   * 전체 비트 개수(생성자에서 지정한 size)를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }
}
