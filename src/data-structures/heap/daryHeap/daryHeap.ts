/**
 * DaryHeap (D진 힙)
 *
 * 각 노드가 최대 d개의 자식을 갖는 배열 기반 힙.
 * d=2이면 이진 힙(Binary Heap)과 동일하다.
 * d를 크게 할수록 push(siftUp)가 빨라지고 pop(siftDown)이 느려진다.
 * d=4 또는 d=8 설정 시 캐시 라인 활용률이 높아져 push 중심 워크로드에 유리하다.
 *
 * 요구사항:
 * - push(item): 새 원소를 삽입한다. O(log_d n)
 * - pop(): 최솟값을 꺼내어 반환한다. O(d * log_d n)
 * - peek(): 최솟값을 제거하지 않고 반환한다. O(1)
 * - size(): 원소 개수를 반환한다. O(1)
 * - isEmpty(): 힙이 비어있으면 true를 반환한다. O(1)
 *
 * 시간복잡도:
 * - push: O(log_d n) → log_d n = log n / log d
 * - pop: O(d * log_d n)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 *
 * 인덱스 계산 (0-based):
 * - 부모(i): Math.floor((i - 1) / d)
 * - k번째 자식(i): d * i + k + 1  (k = 0..d-1)
 */

export class DaryHeap<T> {
  private data: T[];
  private d: number;
  private compare: (a: T, b: T) => number;

  constructor(d: number, compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  push(item: T): void {
    throw new Error("Not implemented");
  }

  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }
}
