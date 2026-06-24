/**
 * CuckooFilter (뻐꾸기 필터)
 *
 * 지문(fingerprint) 기반의 확률적 멤버십 필터.
 * BloomFilter와 달리 원소 삭제가 가능하며, 조회와 삽입 모두 O(1) 기대 시간복잡도를 가진다.
 * 각 키를 두 개의 후보 버킷에 저장하고, 충돌 시 기존 항목을 밀어내어(뻐꾸기 방식) 재배치한다.
 *
 * 요구사항:
 * - add(item): 항목 삽입. 용량 초과 시 false 반환
 * - has(item): 멤버십 확인. false negative 없음, false positive 가능
 * - delete(item): 항목 삭제. BloomFilter와의 핵심 차이점
 * - size(): 현재 저장된 항목 수
 * - loadFactor(): 현재 부하율 (0~1)
 *
 * 시간복잡도:
 * - add: O(1) 평균, O(용량) 최악 (재배치 체인)
 * - has: O(1)
 * - delete: O(1)
 * - size: O(1)
 * - loadFactor: O(1)
 */
export class CuckooFilter {
  constructor(capacity: number, fingerprintSize: number = 8) {
    throw new Error("Not implemented");
  }

  /** 항목 삽입. 성공 시 true, 용량 초과 시 false */
  add(item: string): boolean {
    throw new Error("Not implemented");
  }

  /** 멤버십 확인 (false negative 없음) */
  has(item: string): boolean {
    throw new Error("Not implemented");
  }

  /** 항목 삭제. 성공 시 true */
  delete(item: string): boolean {
    throw new Error("Not implemented");
  }

  /** 현재 저장된 항목 수 */
  size(): number {
    throw new Error("Not implemented");
  }

  /** 현재 부하율 (0~1) */
  loadFactor(): number {
    throw new Error("Not implemented");
  }
}
