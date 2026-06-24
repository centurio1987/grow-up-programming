/**
 * HyperLogLog (하이퍼로그로그)
 *
 * 매우 큰 집합의 cardinality(유니크 원소 수)를 메모리 효율적으로 추정하는 확률적 자료구조.
 * 해시값의 선행 0 비트 개수(연속 0의 최댓값)를 버킷별로 추적하여
 * 조화 평균 기반의 보정 공식으로 cardinality를 계산한다.
 * m = 2^precision개의 버킷으로 표준 오차 1.04/sqrt(m)을 달성한다.
 *
 * 요구사항:
 * - add(item): 원소 추가
 * - count(): 추정 cardinality 반환
 * - merge(other): 두 HLL 병합 (새 인스턴스 반환)
 * - error(): 표준 오차율 1.04/sqrt(m) 반환
 *
 * 시간복잡도:
 * - add: O(1)
 * - count: O(m), m = 2^precision
 * - merge: O(m)
 * - error: O(1)
 */
export class HyperLogLog {
  constructor(precision: number = 10) {
    throw new Error("Not implemented");
  }

  /** 원소 추가 */
  add(item: string): void {
    throw new Error("Not implemented");
  }

  /** 추정 cardinality 반환 */
  count(): number {
    throw new Error("Not implemented");
  }

  /** 두 HyperLogLog 병합 (새 인스턴스 반환) */
  merge(other: HyperLogLog): HyperLogLog {
    throw new Error("Not implemented");
  }

  /** 표준 오차율 1.04/sqrt(m) 반환 */
  error(): number {
    throw new Error("Not implemented");
  }
}
