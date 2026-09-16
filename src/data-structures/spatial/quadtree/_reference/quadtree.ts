/**
 * `spatial/quadtree` 정본(규약2).
 *
 * 계약은 `../quadtree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고, 계약이 허용하는 유일한 구현이
 * 아니다 — 마디마다 둘로 가르는 `spatial/kdTree` 정본도 두 행을 같은 계급으로 지킨다(정수 좌표에서 —
 * `src/data-structures/_contract/runContract.quadtree.test.ts`). 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이
 * 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **점 하나 · 마디 하나를 지나갈 때마다 1**, 정렬의 비교 한 번마다 1.
 * 배열을 잡는 런타임 비용은 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **담는 모양 — 크기가 2의 거듭제곱인 정적 나무 여럿.** 넣기는 `spatial/kdTree` 정본과 같은 이진수 올림이다(층 `i` 는 비었거나 점
 * `2^i` 개로 한 번에 지은 나무 하나). 넣기 n 번의 총비용이 `n log² n` 이다.
 *
 * **나무 하나 — 마디마다 네 갈래.** 마디는 점을 x 순위의 가운데로 두 쪽으로 나누고, **각 쪽을 제 y 순위의 가운데로** 다시 둘로 나눠
 * 자식 넷을 둔다. 두 쪽의 y 가르는 자리가 서로 다르다 — 칸의 가운데로 네 등분하는 설계와 달리 **점의 순위로** 나누므로 자식 하나에
 * 든 점이 늘 넷에 하나다. 점이 넷 이하가 되면 잎이 점을 그대로 든다. 마디는 제 점들의 경계 상자를 든다.
 *
 * **범위 질의가 제곱근인 이유.** 세로 줄 하나는 x 로 나눈 두 쪽 중 하나만 가로지르고(왼쪽의 x 는 전부 오른쪽의 x 이하다) 그 쪽의
 * 두 자식을 가로지른다. 가로 줄 하나는 두 쪽 각각에서 y 로 나눈 두 자식 중 하나씩만 가로지른다. 어느 쪽이든 넷 중 둘이라, 크기
 * `m` 인 나무에서 줄 하나를 가로지르는 마디가 `O(√m)` 이다. 상자가 사각형 안에 드는 마디는 제 점을 전부 돌려주므로 답의 수로 센다.
 */

// #region guide:core/tree
export type Point2D = [number, number];

/** 잎이 드는 점의 수 상한. 담는 모양의 값이고 계약이 아니다. */
const LEAF = 4;

function isCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

function isCorner(value: number): boolean {
  return typeof value === "number" && !Number.isNaN(value);
}

/** 마디 하나. 잎이면 `kids` 가 비고 점을 들며, 아니면 자식 넷(빈 자식은 빠진다)을 든다. */
interface Node {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  kids: Node[];
  xs: number[];
  ys: number[];
}

/** 한 번에 지은 나무 하나와 그 점들. 층을 합칠 때 점을 다시 모은다. */
interface StaticTree {
  readonly xs: number[];
  readonly ys: number[];
  readonly root: Node;
}
// #endregion

// #region guide:core/class
export class Quadtree {
  /** 층 `i` 는 비었거나 점 `2^i` 개로 지은 나무 하나다. */
  readonly #levels: (StaticTree | null)[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  insert(point: Point2D): void {
    const [x, y] = point;
    if (!isCoordinate(x) || !isCoordinate(y)) {
      throw new RangeError(
        `좌표는 유한한 수여야 한다 — 받은 점은 [${x}, ${y}] 다`,
      );
    }
    const xs = [x];
    const ys = [y];
    let level = 0;
    for (;;) {
      const full = this.#levels[level];
      if (full === undefined || full === null) break;
      for (let i = 0; i < full.xs.length; i++) {
        this.__cost += 1;
        xs.push(full.xs[i] as number);
        ys.push(full.ys[i] as number);
      }
      this.#levels[level] = null;
      level++;
    }
    this.#levels[level] = this.#build(xs, ys);
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const [x0, y0] = min;
    const [x1, y1] = max;
    if (!isCorner(x0) || !isCorner(y0) || !isCorner(x1) || !isCorner(y1)) {
      throw new RangeError(
        `사각형의 모서리는 NaN 이 아닌 수여야 한다 — 받은 값은 [${x0}, ${y0}] · [${x1}, ${y1}] 다`,
      );
    }
    const found: Point2D[] = [];
    for (const tree of this.#levels) {
      if (tree === null || tree === undefined) continue;
      const stack = [tree.root];
      while (stack.length > 0) {
        const node = stack.pop() as Node;
        this.__cost += 1;
        if (
          node.maxX < x0 ||
          node.minX > x1 ||
          node.maxY < y0 ||
          node.minY > y1
        ) {
          continue;
        }
        for (const kid of node.kids) stack.push(kid);
        for (let i = 0; i < node.xs.length; i++) {
          this.__cost += 1;
          const px = node.xs[i] as number;
          const py = node.ys[i] as number;
          if (px >= x0 && px <= x1 && py >= y0 && py <= y1) {
            found.push([px, py]);
          }
        }
      }
    }
    return found;
  }

  /** 점 `m` 개로 나무를 짓는다. x 순 · y 순으로 한 번씩 정렬하고, 마디마다 두 순서를 안정 분할로 나눠 내려간다. */
  #build(xs: number[], ys: number[]): StaticTree {
    const m = xs.length;
    const order: number[] = [];
    for (let i = 0; i < m; i++) {
      this.__cost += 1;
      order.push(i);
    }
    const byX = [...order].sort((a, b) => {
      this.__cost += 1;
      return (
        (xs[a] as number) - (xs[b] as number) ||
        (ys[a] as number) - (ys[b] as number) ||
        a - b
      );
    });
    const byY = [...order].sort((a, b) => {
      this.__cost += 1;
      return (
        (ys[a] as number) - (ys[b] as number) ||
        (xs[a] as number) - (xs[b] as number) ||
        a - b
      );
    });
    const side = new Uint8Array(m);
    return { xs, ys, root: this.#split(xs, ys, byX, byY, side) };
  }

  /** 네 갈래 마디 하나를 세운다. `byX` · `byY` 는 같은 점들을 두 순서로 늘어놓은 것이다. */
  #split(
    xs: number[],
    ys: number[],
    byX: number[],
    byY: number[],
    side: Uint8Array,
  ): Node {
    const size = byX.length;
    const node: Node = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      kids: [],
      xs: [],
      ys: [],
    };
    if (size <= LEAF) {
      for (const at of byX) {
        this.__cost += 1;
        const px = xs[at] as number;
        const py = ys[at] as number;
        node.xs.push(px);
        node.ys.push(py);
        node.minX = Math.min(node.minX, px);
        node.maxX = Math.max(node.maxX, px);
        node.minY = Math.min(node.minY, py);
        node.maxY = Math.max(node.maxY, py);
      }
      return node;
    }
    const [leftY, rightY] = this.#halve(byX, byY, side);
    const leftX = byX.slice(0, size >> 1);
    const rightX = byX.slice(size >> 1);
    for (const [hx, hy] of [
      [leftX, leftY],
      [rightX, rightY],
    ] as const) {
      const [lowX, highX] = this.#halve(hy, hx, side);
      const lowY = hy.slice(0, hy.length >> 1);
      const highY = hy.slice(hy.length >> 1);
      for (const [cx, cy] of [
        [lowX, lowY],
        [highX, highY],
      ] as const) {
        if (cx.length === 0) continue;
        const kid = this.#split(xs, ys, cx, cy, side);
        node.kids.push(kid);
        node.minX = Math.min(node.minX, kid.minX);
        node.maxX = Math.max(node.maxX, kid.maxX);
        node.minY = Math.min(node.minY, kid.minY);
        node.maxY = Math.max(node.maxY, kid.maxY);
      }
    }
    return node;
  }

  /** `primary` 의 앞 절반과 뒤 절반에 든 점으로 `other` 를 순서를 지키며 둘로 나눈다. */
  #halve(
    primary: number[],
    other: number[],
    side: Uint8Array,
  ): [number[], number[]] {
    const mid = primary.length >> 1;
    for (let i = 0; i < primary.length; i++) {
      this.__cost += 1;
      side[primary[i] as number] = i < mid ? 0 : 1;
    }
    const low: number[] = [];
    const high: number[] = [];
    for (const at of other) {
      this.__cost += 1;
      if (side[at] === 0) low.push(at);
      else high.push(at);
    }
    return [low, high];
  }
}
// #endregion
