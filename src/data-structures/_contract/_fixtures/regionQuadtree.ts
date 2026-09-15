/**
 * 결함 fixture — 평면을 **같은 크기의 네 칸으로 거듭 나누는** 점 색인. 칸에 점이 넷을 넘으면 네 등분하고, 넣은 점이 뿌리 칸 밖이면
 * 뿌리 칸을 두 배로 키운다.
 *
 * 물려받은 `spatial/quadtree` 문제 문서가 그린 설계에서 고정 경계만 뺀 것이다(경계는 계약에 없다). 칸의 한 변이 1 이하가 되면 더
 * 나누지 않는다 — 같은 점이 여럿이어도 끝난다. 범위 질의는 칸이 사각형과 겹치는 마디만 지난다. 최근접은 칸까지의 거리로 가지를
 * 친다. 답은 전부 옳다(축1 통과). 좌표 검사는 하지 않는다.
 *
 * **나누는 자리가 점이 아니라 칸의 가운데라서, 칸의 깊이가 담긴 수가 아니라 점 사이의 간격과 좌표 폭에 기댄다.**
 *
 * - **걸리는 것 — 가는 띠 범위 질의**(`spatial/kdTree` · `spatial/quadtree` 스위트가 같은 객체로 쓰는 시나리오 — 점 절반이 띠 양옆 두
 *   칸에 몰린다). 띠에 붙은 칸이 한 변 1 까지 쪼개져 있어 층마다 띠를 가로지르는 칸이 늘고 전부 점을 담는다(246 · 728 · 2,632).
 * - 무작위로만 채운 가는 띠(169 · 320 · 597) · 대각선 넣기 · 전부 담는 사각형 · 원 위의 최근접은 통과한다 — 좌표가 정수이고 폭이 n 에
 *   비례하면 깊이가 로그라서다.
 *
 * 계측은 §규약2 계측 단위 그대로 — 마디 하나 · 칸에 든 점 하나를 지날 때마다 1.
 */

export type Point2D = [number, number];

const CAPACITY = 4;

interface Cell {
  x: number;
  y: number;
  size: number;
  xs: number[];
  ys: number[];
  children: Cell[] | null;
}

function cell(x: number, y: number, size: number): Cell {
  return { x, y, size, xs: [], ys: [], children: null };
}

export class RegionQuadtree {
  #root: Cell | null = null;
  __cost = 0;

  insert(point: Point2D): void {
    const [px, py] = point;
    if (this.#root === null)
      this.#root = cell(Math.floor(px), Math.floor(py), 1);
    let root = this.#root;
    while (
      px < root.x ||
      py < root.y ||
      px >= root.x + root.size ||
      py >= root.y + root.size
    ) {
      this.__cost += 1;
      const grown = cell(
        px < root.x ? root.x - root.size : root.x,
        py < root.y ? root.y - root.size : root.y,
        root.size * 2,
      );
      this.#split(grown);
      const children = grown.children as Cell[];
      const at = children.findIndex((c) => c.x === root.x && c.y === root.y);
      children[at] = root;
      root = grown;
    }
    this.#root = root;
    let at = root;
    for (;;) {
      this.__cost += 1;
      if (at.children === null) {
        at.xs.push(px);
        at.ys.push(py);
        if (at.xs.length > CAPACITY && at.size > 1) {
          const xs = at.xs;
          const ys = at.ys;
          at.xs = [];
          at.ys = [];
          this.#split(at);
          for (let i = 0; i < xs.length; i++) {
            this.__cost += 1;
            const child = this.#childOf(at, xs[i] as number, ys[i] as number);
            child.xs.push(xs[i] as number);
            child.ys.push(ys[i] as number);
          }
        }
        return;
      }
      at = this.#childOf(at, px, py);
    }
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const found: Point2D[] = [];
    if (this.#root === null) return found;
    const stack = [this.#root];
    while (stack.length > 0) {
      const at = stack.pop() as Cell;
      this.__cost += 1;
      if (
        at.x + at.size <= min[0] ||
        at.x > max[0] ||
        at.y + at.size <= min[1] ||
        at.y > max[1]
      ) {
        continue;
      }
      if (at.children !== null) {
        stack.push(...at.children);
        continue;
      }
      for (let i = 0; i < at.xs.length; i++) {
        this.__cost += 1;
        const x = at.xs[i] as number;
        const y = at.ys[i] as number;
        if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1]) {
          found.push([x, y]);
        }
      }
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    if (this.#root === null) return null;
    const best = { d: Infinity, x: 0, y: 0 };
    const stack = [this.#root];
    while (stack.length > 0) {
      const at = stack.pop() as Cell;
      this.__cost += 1;
      const dx = Math.max(at.x - query[0], 0, query[0] - (at.x + at.size));
      const dy = Math.max(at.y - query[1], 0, query[1] - (at.y + at.size));
      if (dx * dx + dy * dy > best.d) continue;
      if (at.children !== null) {
        stack.push(...at.children);
        continue;
      }
      for (let i = 0; i < at.xs.length; i++) {
        this.__cost += 1;
        const x = at.xs[i] as number;
        const y = at.ys[i] as number;
        const d = (x - query[0]) ** 2 + (y - query[1]) ** 2;
        if (
          d < best.d ||
          (d === best.d && (x < best.x || (x === best.x && y < best.y)))
        ) {
          best.d = d;
          best.x = x;
          best.y = y;
        }
      }
    }
    return best.d === Infinity ? null : [best.x, best.y];
  }

  #split(at: Cell): void {
    const half = at.size / 2;
    at.children = [
      cell(at.x, at.y, half),
      cell(at.x + half, at.y, half),
      cell(at.x, at.y + half, half),
      cell(at.x + half, at.y + half, half),
    ];
  }

  #childOf(at: Cell, px: number, py: number): Cell {
    const half = at.size / 2;
    const index = (px >= at.x + half ? 1 : 0) + (py >= at.y + half ? 2 : 0);
    return (at.children as Cell[])[index] as Cell;
  }
}
