/**
 * SegmentTree (세그먼트 트리 — Point Update + Range Query)
 *
 * 배열 기반의 세그먼트 트리. 임의의 결합 연산(merge)을 지원하여
 * 구간 합, 구간 최솟값, 구간 최댓값 등을 O(log n)에 질의하고
 * 단일 원소를 O(log n)에 갱신(Point Update)할 수 있다.
 *
 * [스토리] 주식 가격 구간 최솟값
 * 매 초 N개 종목의 가격이 업데이트되고, 임의 구간 [l, r]의
 * 최저가를 O(log n)에 질의해야 한다.
 *
 * 요구사항:
 * - constructor(arr, merge): 배열과 결합 함수로 트리를 초기화, O(n)
 * - query(l, r): [l, r] 구간 연산 결과 반환, O(log n)
 * - update(i, val): 인덱스 i를 val로 갱신, O(log n)
 * - size(): 원본 배열 크기 반환, O(1)
 *
 * 시간복잡도:
 * - 빌드: O(n)
 * - query: O(log n)
 * - update: O(log n)
 *
 * 공간복잡도: O(n)
 */
export class SegmentTree {
  private _n: number;
  private _tree: number[];
  private _merge: (a: number, b: number) => number;

  constructor(arr: number[], merge: (a: number, b: number) => number) {
    throw new Error("Not implemented");
  }

  /**
   * [l, r] 구간(inclusive)에 대해 merge 연산을 적용한 결과를 반환한다.
   * @param l 왼쪽 경계 (0-indexed, inclusive)
   * @param r 오른쪽 경계 (0-indexed, inclusive)
   * @returns 구간 연산 결과
   */
  query(l: number, r: number): number {
    throw new Error("Not implemented");
  }

  /**
   * 인덱스 i의 값을 val로 갱신한다.
   * @param i 갱신할 인덱스 (0-indexed)
   * @param val 새 값
   */
  update(i: number, val: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 원본 배열의 크기를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }
}
