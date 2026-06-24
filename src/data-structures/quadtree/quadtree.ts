/**
 * Quadtree (쿼드트리, 2D 공간 분할)
 *
 * 2차원 공간을 재귀적으로 4분할하여 점을 저장하는 자료구조.
 * 한 노드가 capacity를 초과하면 NW/NE/SW/SE 4개의 자식으로 분할한다.
 * 게임 충돌 감지, 지리 정보 시스템에서 공간 인덱싱에 활용된다.
 *
 * 요구사항:
 * - constructor(boundary: Rect, capacity?: number): 경계와 최대 용량으로 초기화
 * - insert(point: Point2D): boolean: 점 삽입, 경계 밖이면 false 반환
 * - query(range: Rect): Point2D[]: 직사각형 범위 내 모든 점 반환
 * - size(): number: 저장된 총 점의 수 반환
 *
 * 시간복잡도:
 * - insert: O(log n) 평균 (capacity와 공간 분포에 따라 다름)
 * - query: O(log n + k) 평균 (k: 결과 수)
 * - size: O(1)
 */

export type Point2D = [number, number];

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class Quadtree {
  private boundary: Rect;
  private capacity: number;
  private points: Point2D[];
  private divided: boolean;
  private nw: Quadtree | null;
  private ne: Quadtree | null;
  private sw: Quadtree | null;
  private se: Quadtree | null;
  private _size: number;

  constructor(boundary: Rect, capacity: number = 4) {
    throw new Error("Not implemented");
  }

  insert(point: Point2D): boolean {
    throw new Error("Not implemented");
  }

  query(range: Rect): Point2D[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
