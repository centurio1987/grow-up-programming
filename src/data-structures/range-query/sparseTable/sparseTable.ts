/**
 * SparseTable (희소 테이블 — 정적 RMQ)
 *
 * 불변 배열에서 구간 최솟값/최댓값/GCD 등 멱등(idempotent) 연산을
 * 전처리 O(n log n), 질의 O(1)에 수행하는 자료구조.
 *
 * [스토리] DNS TTL 만료 검사
 * 수백만 개의 캐시 레코드가 있고, 임의 구간의 최소 TTL을
 * 상수 시간에 질의해야 한다. 레코드는 한 번 등록되면 변경되지 않는다.
 * 업데이트가 없고 질의만 빈번할 때 세그먼트 트리보다 우수하다.
 *
 * 요구사항:
 * - constructor(arr, merge): 전처리 O(n log n), 공간 O(n log n)
 * - query(l, r): O(1) (멱등 연산 한정 — min, max, gcd)
 *
 * 시간복잡도:
 * - 빌드: O(n log n)
 * - query: O(1)
 *
 * 공간복잡도: O(n log n)
 *
 * 주의: merge 함수는 멱등(f(f(x,y), y) = f(x,y))해야 O(1) 질의가 보장된다.
 * 구간 합처럼 멱등이 아닌 연산은 O(1) 질의가 불가능하다.
 */
export class SparseTable {
  private _n: number;
  private _log: number[];
  // _table[k][i]: arr[i..i+2^k-1] 구간의 merge 결과
  private _table: number[][];
  private _merge: (a: number, b: number) => number;

  constructor(arr: number[], merge: (a: number, b: number) => number) {
    throw new Error("Not implemented");
  }

  /**
   * [l, r] 구간(inclusive)에 대해 merge 연산 결과를 O(1)에 반환한다.
   * merge는 멱등 연산이어야 한다 (min, max, gcd 등).
   * @param l 왼쪽 경계 (0-indexed, inclusive)
   * @param r 오른쪽 경계 (0-indexed, inclusive)
   * @returns 구간 연산 결과
   */
  query(l: number, r: number): number {
    throw new Error("Not implemented");
  }
}
