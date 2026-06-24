/**
 * DisjointSetRollback (롤백 지원 분리 집합 / 유니온-파인드)
 *
 * Union by Rank를 사용하고 경로 압축을 의도적으로 사용하지 않습니다.
 * 경로 압축을 쓰면 롤백 시 이전 부모 포인터를 복원하기 어렵기 때문입니다.
 * 대신 union by rank만으로 트리 높이를 O(log n)으로 유지합니다.
 *
 * 주요 활용: 오프라인 간선 추가/삭제 그래프 문제
 * - 간선이 추가되고 제거되는 동적 그래프에서 "이 시점에 u, v는 연결됐나?"
 * - rollback() 또는 restore(version)으로 과거 상태로 되돌아갈 수 있습니다.
 *
 * 요구사항:
 * - find(x): x의 루트를 반환 (경로 압축 없음)
 * - union(x, y): x와 y를 같은 집합으로. 이미 같으면 false
 * - rollback(): 마지막 union 하나 되돌리기
 * - snapshot(): 현재 상태의 버전 번호 저장 및 반환
 * - restore(version): 특정 버전으로 복원
 * - same(x, y): 같은 집합인지 여부
 * - groupCount(): 현재 독립 집합 수
 *
 * 시간복잡도:
 * - find: O(log n) — union by rank로 트리 높이 보장
 * - union: O(log n)
 * - rollback: O(1) — 변경 기록 스택에서 팝
 * - snapshot / restore: O(1)
 */
export class DisjointSetRollback {
  private _parent: number[];
  private _rank: number[];
  private _count: number; // 독립 집합 수

  // 변경 기록: { type, node, oldVal }
  private _history: Array<{ node: number; oldParent: number; otherNode: number; oldRank: number; merged: boolean }>;

  // 버전 스냅샷: 버전 번호 → history 길이
  private _snapshots: number[];

  constructor(n: number) {
    throw new Error("Not implemented");
  }

  /** x의 루트를 찾습니다. 경로 압축 없음. O(log n) */
  find(x: number): number {
    throw new Error("Not implemented");
  }

  /** x와 y를 같은 집합으로 합칩니다. 이미 같으면 false 반환. O(log n) */
  union(x: number, y: number): boolean {
    throw new Error("Not implemented");
  }

  /** 마지막 union 연산을 되돌립니다. O(1) */
  rollback(): void {
    throw new Error("Not implemented");
  }

  /**
   * 현재 상태의 스냅샷을 저장하고 버전 번호를 반환합니다. O(1)
   * 버전 번호는 0부터 시작하며 snapshot()을 호출할 때마다 증가합니다.
   */
  snapshot(): number {
    throw new Error("Not implemented");
  }

  /** 특정 버전으로 복원합니다. O(롤백 횟수) */
  restore(version: number): void {
    throw new Error("Not implemented");
  }

  /** x와 y가 같은 집합인지 반환합니다. O(log n) */
  same(x: number, y: number): boolean {
    throw new Error("Not implemented");
  }

  /** 현재 독립 집합(컴포넌트) 수를 반환합니다. O(1) */
  groupCount(): number {
    throw new Error("Not implemented");
  }
}
