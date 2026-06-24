/**
 * KDTree (K-D 트리, 2차원 고정)
 *
 * 2차원 공간을 재귀적으로 이분할하여 점(Point2D)을 저장하는 자료구조.
 * 각 레벨마다 x축과 y축을 번갈아 가며 분할 기준으로 사용한다.
 *
 * 요구사항:
 * - constructor(points?: Point2D[]): 점 집합으로 초기 균형 트리 구성
 * - insert(point: Point2D): 새 점 삽입 (O(log n) 평균)
 * - nearestNeighbor(query: Point2D): 가장 가까운 점 반환 (O(log n) 평균)
 * - rangeSearch(min: Point2D, max: Point2D): 직사각형 범위 내 모든 점 반환
 * - size(): 저장된 점의 수 반환
 *
 * 시간복잡도:
 * - insert: O(log n) 평균, O(n) 최악
 * - nearestNeighbor: O(log n) 평균, O(n) 최악
 * - rangeSearch: O(√n + k) 평균 (k: 결과 수)
 * - size: O(1)
 */

export type Point2D = [number, number];

interface KDNode {
  point: Point2D;
  left: KDNode | null;
  right: KDNode | null;
}

export class KDTree {
  private root: KDNode | null;
  private _size: number;

  constructor(points?: Point2D[]) {
    throw new Error("Not implemented");
  }

  insert(point: Point2D): void {
    throw new Error("Not implemented");
  }

  nearestNeighbor(query: Point2D): Point2D | undefined {
    throw new Error("Not implemented");
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
