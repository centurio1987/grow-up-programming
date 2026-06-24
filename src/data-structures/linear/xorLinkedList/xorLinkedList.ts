/**
 * XorLinkedList (XOR 연결 리스트)
 *
 * 임베디드 시스템처럼 메모리가 제한된 환경에서 이중 연결 리스트의
 * prev/next 두 포인터 대신 XOR 연산 하나로 양방향 순회를 구현한다.
 *
 * JavaScript에는 포인터 산술이 없으므로 Map<number, XorNode>를 이용해
 * 노드 ID를 포인터처럼 사용하고 XOR 연산을 시뮬레이션한다.
 *
 * 핵심 원리:
 *   node.xorId = prevId XOR nextId
 *   순방향: nextId = node.xorId XOR prevId
 *   역방향: prevId = node.xorId XOR nextId
 *
 * 요구사항:
 * - append(value): 리스트 맨 뒤에 값을 추가한다. O(1)
 * - toArray(): 앞→뒤 순서로 모든 값을 배열로 반환한다. O(n)
 * - toArrayReverse(): 뒤→앞 순서로 모든 값을 배열로 반환한다. O(n)
 * - size(): 노드 개수를 반환한다. O(1)
 *
 * 시간복잡도:
 * - append: O(1) (tail 포인터 유지)
 * - toArray: O(n)
 * - toArrayReverse: O(n)
 * - size: O(1)
 */

export class XorNode {
  id: number;
  value: number;
  /** prev.id XOR next.id */
  xorId: number;

  constructor(id: number, value: number) {
    this.id = id;
    this.value = value;
    this.xorId = 0; // 초기에는 prev=null(0), next=null(0) → XOR = 0
  }
}

export class XorLinkedList {
  /** 노드 ID → XorNode 매핑. ID=0은 null(경계 센티넬)을 의미한다 */
  private store: Map<number, XorNode>;
  private headId: number; // 0이면 빈 리스트
  private tailId: number; // 0이면 빈 리스트
  private _size: number;
  private nextId: number; // 다음에 생성할 노드 ID (1부터 시작)

  constructor() {
    this.store = new Map();
    this.headId = 0;
    this.tailId = 0;
    this._size = 0;
    this.nextId = 1; // 0은 "null"을 나타내는 센티넬
  }

  /**
   * 리스트 맨 뒤에 값을 추가한다.
   */
  append(value: number): void {
    throw new Error("Not implemented");
  }

  /**
   * head → tail 순서로 모든 값의 배열을 반환한다.
   */
  toArray(): number[] {
    throw new Error("Not implemented");
  }

  /**
   * tail → head 순서로 모든 값의 배열을 반환한다.
   */
  toArrayReverse(): number[] {
    throw new Error("Not implemented");
  }

  /**
   * 리스트의 노드 개수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }
}
