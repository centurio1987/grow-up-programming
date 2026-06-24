/**
 * PersistentSegmentTree (영속 세그먼트 트리)
 *
 * 각 업데이트마다 변경된 노드만 새로 생성하여 이전 버전을 유지하는 세그먼트 트리.
 * O(log n)개의 노드만 새로 생성하므로 버전당 추가 공간이 O(log n)이다.
 * 특정 버전에서의 구간 합 질의와 과거 버전 접근이 모두 가능하다.
 *
 * 요구사항:
 * - constructor(arr: number[]): 초기 배열로 버전 0 구성
 * - update(version: number, i: number, val: number): number
 *     특정 버전을 기반으로 인덱스 i의 값을 val로 변경한 새 버전 생성, 새 버전 번호 반환
 * - query(version: number, l: number, r: number): number
 *     특정 버전의 [l, r] 구간 합 반환
 * - versionCount(): number: 현재 총 버전 수 반환
 *
 * 시간복잡도:
 * - constructor: O(n)
 * - update: O(log n)
 * - query: O(log n)
 * - versionCount: O(1)
 *
 * 공간복잡도:
 * - 초기 구성: O(n)
 * - 버전당 추가 공간: O(log n)
 * - 총 공간: O((n + v) * log n) (v: 버전 수)
 */

interface SegNode {
  sum: number;
  left: SegNode | null;
  right: SegNode | null;
}

export class PersistentSegmentTree {
  private roots: Array<SegNode | null>;
  private n: number;

  constructor(arr: number[]) {
    throw new Error("Not implemented");
  }

  update(version: number, i: number, val: number): number {
    throw new Error("Not implemented");
  }

  query(version: number, l: number, r: number): number {
    throw new Error("Not implemented");
  }

  versionCount(): number {
    throw new Error("Not implemented");
  }
}
