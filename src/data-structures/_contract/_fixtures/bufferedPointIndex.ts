/**
 * 결함 fixture — 넣은 점을 줄에 쌓아 두기만 하다가 **질의가 오면 쌓인 것을 한꺼번에** `spatial/kdTree` 정본에 넣는 점 색인.
 *
 * 정본(`../../spatial/kdTree/_reference/kdTree.ts`)을 그대로 쓰고 넣기만 미룬다. 답은 전부 옳다(질의가 먼저 비우므로 밖에서 보이는
 * 상태가 정본과 같다). **범위 질의 행을 `worst` 로 적어 추가로 배제하는 계열을 재려고 지었다**(§규약1 「강한 한정자의 근거는
 * 추가로 배제되는 계열을 수치로 낸다」) — 쌓인 점 하나가 정본에 들어가는 일은 평생 한 번이라 호출열 전체의 평균은 정본과 같은
 * 계급이다.
 *
 * - **걸리는 것 — 채운 뒤 첫 범위 질의.** n 개를 넣은 뒤 오는 첫 질의 하나가 n 개를 한꺼번에 넣는다.
 * - 넣기 시나리오는 통과한다(줄에 붙이기라 상수다).
 *
 * 계측은 정본의 `__cost` 에 줄에 붙인 횟수를 더한 것이다(§규약2 계측 단위 — 줄의 칸 하나에 1).
 */

import { KDTree, type Point2D } from "../../spatial/kdTree/_reference/kdTree";

export class BufferedPointIndex {
  readonly #inner = new KDTree();
  readonly #pending: Point2D[] = [];
  #own = 0;

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  insert(point: Point2D): void {
    this.#own += 1;
    this.#pending.push([point[0], point[1]]);
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    this.#flush();
    return this.#inner.rangeSearch(min, max);
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    this.#flush();
    return this.#inner.nearestNeighbor(query);
  }

  #flush(): void {
    for (const point of this.#pending) this.#inner.insert(point);
    this.#pending.length = 0;
  }
}
