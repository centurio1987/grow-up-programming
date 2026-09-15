/**
 * 결함 fixture — 넣을 때마다 뿌리에서 x · y 를 번갈아 견주며 내려가 빈 자리에 매다는, **다시 짓지 않는** 점 나무.
 *
 * 물려받은 `spatial/kdTree` 문제 문서가 그린 넣기 그대로다. 마디마다 경계 상자를 들어 범위 질의·최근접은 정본과 같은 방식으로
 * 가지를 친다. 답은 전부 옳다(축1 통과). 좌표 검사는 하지 않는다.
 *
 * - **걸리는 것 — 대각선으로 넣기.** x 와 y 가 함께 오르면 매번 같은 쪽으로 내려가 사슬이 되고 넣기 한 번이 담긴 수에 비례한다.
 * - 가는 띠 범위 질의(153 · 292 · 543) · 전부 묻기 · 원 위의 최근접은 무작위 차례로 넣어 나무가 얕아 통과한다 — 계약 위반이 드러난
 *   자리는 넣기 행 하나다(무작위 차례에서도 범위 질의가 제곱근 안인지는 판정하지 않았다).
 *
 * 계측은 §규약2 계측 단위 그대로 — 마디 하나를 지날 때마다 1.
 */

export type Point2D = [number, number];

export class UnbalancedPointTree {
  readonly #px: number[] = [];
  readonly #py: number[] = [];
  readonly #left: number[] = [];
  readonly #right: number[] = [];
  readonly #minX: number[] = [];
  readonly #maxX: number[] = [];
  readonly #minY: number[] = [];
  readonly #maxY: number[] = [];
  __cost = 0;

  insert(point: Point2D): void {
    const [x, y] = point;
    const node = this.#px.length;
    this.#px.push(x);
    this.#py.push(y);
    this.#left.push(-1);
    this.#right.push(-1);
    this.#minX.push(x);
    this.#maxX.push(x);
    this.#minY.push(y);
    this.#maxY.push(y);
    if (node === 0) {
      this.__cost += 1;
      return;
    }
    let at = 0;
    let depth = 0;
    for (;;) {
      this.__cost += 1;
      this.#minX[at] = Math.min(this.#minX[at] as number, x);
      this.#maxX[at] = Math.max(this.#maxX[at] as number, x);
      this.#minY[at] = Math.min(this.#minY[at] as number, y);
      this.#maxY[at] = Math.max(this.#maxY[at] as number, y);
      const low =
        depth % 2 === 0
          ? x < (this.#px[at] as number)
          : y < (this.#py[at] as number);
      const links = low ? this.#left : this.#right;
      const next = links[at] as number;
      if (next < 0) {
        links[at] = node;
        return;
      }
      at = next;
      depth++;
    }
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const found: Point2D[] = [];
    if (this.#px.length === 0) return found;
    const stack = [0];
    while (stack.length > 0) {
      const node = stack.pop() as number;
      this.__cost += 1;
      if (
        (this.#maxX[node] as number) < min[0] ||
        (this.#minX[node] as number) > max[0] ||
        (this.#maxY[node] as number) < min[1] ||
        (this.#minY[node] as number) > max[1]
      ) {
        continue;
      }
      const x = this.#px[node] as number;
      const y = this.#py[node] as number;
      if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1]) {
        found.push([x, y]);
      }
      const l = this.#left[node] as number;
      const r = this.#right[node] as number;
      if (l >= 0) stack.push(l);
      if (r >= 0) stack.push(r);
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    if (this.#px.length === 0) return null;
    const best = { d: Infinity, x: 0, y: 0 };
    const stack = [0];
    while (stack.length > 0) {
      const node = stack.pop() as number;
      this.__cost += 1;
      const dx = Math.max(
        (this.#minX[node] as number) - query[0],
        0,
        query[0] - (this.#maxX[node] as number),
      );
      const dy = Math.max(
        (this.#minY[node] as number) - query[1],
        0,
        query[1] - (this.#maxY[node] as number),
      );
      if (dx * dx + dy * dy > best.d) continue;
      const x = this.#px[node] as number;
      const y = this.#py[node] as number;
      const d = (x - query[0]) ** 2 + (y - query[1]) ** 2;
      if (
        d < best.d ||
        (d === best.d && (x < best.x || (x === best.x && y < best.y)))
      ) {
        best.d = d;
        best.x = x;
        best.y = y;
      }
      const l = this.#left[node] as number;
      const r = this.#right[node] as number;
      if (l >= 0) stack.push(l);
      if (r >= 0) stack.push(r);
    }
    return [best.x, best.y];
  }
}
