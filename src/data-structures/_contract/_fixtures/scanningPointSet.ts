/**
 * 결함 fixture — 점을 배열 하나에 붙이고 **질의마다 전부 훑는** 평면 점 집합.
 *
 * `spatial/kdTree` · `spatial/quadtree` 계약 등급(`complexity`)의 반례 자리에 서는 자명한 구현이다. 답은 전부 옳다(축1 통과).
 * 좌표 검사는 하지 않는다 — 두 계약의 정의역이 달라 fixture 는 계측과 답만 본다.
 *
 * - **걸리는 것 — 가는 띠 범위 질의.** 답이 없어도 점 전부를 지난다.
 * - 넣기(붙이기 한 번)는 로그 구간 안이고, 전부를 묻는 범위 질의와 최근접은 계약의 계급(`O(n)`)과 같아 통과한다.
 *
 * 계측은 §규약2 계측 단위 그대로 — 점 하나를 지날 때마다 1.
 */

export type Point2D = [number, number];

export class ScanningPointSet {
  readonly #xs: number[] = [];
  readonly #ys: number[] = [];
  __cost = 0;

  insert(point: Point2D): void {
    this.__cost += 1;
    this.#xs.push(point[0]);
    this.#ys.push(point[1]);
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const found: Point2D[] = [];
    for (let i = 0; i < this.#xs.length; i++) {
      this.__cost += 1;
      const x = this.#xs[i] as number;
      const y = this.#ys[i] as number;
      if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1]) {
        found.push([x, y]);
      }
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    let best: Point2D | null = null;
    let bestD = Infinity;
    for (let i = 0; i < this.#xs.length; i++) {
      this.__cost += 1;
      const x = this.#xs[i] as number;
      const y = this.#ys[i] as number;
      const d = (x - query[0]) ** 2 + (y - query[1]) ** 2;
      if (
        best === null ||
        d < bestD ||
        (d === bestD && (x < best[0] || (x === best[0] && y < best[1])))
      ) {
        best = [x, y];
        bestD = d;
      }
    }
    return best;
  }
}
