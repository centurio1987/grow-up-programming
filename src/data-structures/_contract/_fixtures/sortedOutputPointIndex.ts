/**
 * 결함 fixture — `spatial/kdTree` 정본의 범위 질의 답을 **삽입 정렬로 (x, y) 순서에 늘어놓아** 돌려주는 점 색인.
 *
 * 정본(`../../spatial/kdTree/_reference/kdTree.ts`)을 그대로 쓰고 답의 순서만 정한다. 답은 전부 옳다(축1은 순서를 정규화해
 * 견준다). 계약이 답의 순서를 정하지 않는 이유를 재려고 지었다 — 순서를 정하는 일이 답의 수 `k` 에 대해 선형보다 무거우면
 * 범위 행의 `+ k` 가 `× k` 쪽으로 바뀐다.
 *
 * - **걸리는 것 — 전부 묻는 범위 질의**(`k = n`). 삽입 정렬이 `k²` 이다.
 * - 가는 띠 범위 질의(`k` 가 상수)와 넣기 · 최근접은 정본과 같은 값으로 통과한다.
 *
 * 계측은 정본의 `__cost` 에 삽입 정렬이 옮긴 칸 수를 더한 것이다(§규약2 계측 단위 — 칸 하나에 1).
 */

import { KDTree, type Point2D } from "../../spatial/kdTree/_reference/kdTree";

export class SortedOutputPointIndex {
  readonly #inner = new KDTree();
  #own = 0;

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  insert(point: Point2D): void {
    this.#inner.insert(point);
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const found = this.#inner.rangeSearch(min, max);
    for (let i = 1; i < found.length; i++) {
      const item = found[i] as Point2D;
      let at = i;
      for (;;) {
        this.#own += 1;
        const before = found[at - 1];
        if (
          before === undefined ||
          before[0] < item[0] ||
          (before[0] === item[0] && before[1] <= item[1])
        ) {
          break;
        }
        found[at] = before;
        at--;
      }
      found[at] = item;
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    return this.#inner.nearestNeighbor(query);
  }
}
