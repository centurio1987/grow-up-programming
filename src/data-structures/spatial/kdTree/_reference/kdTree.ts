/**
 * `spatial/kdTree` 정본(규약2).
 *
 * 계약은 `../kdTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고, 계약이 허용하는 유일한 구현이
 * 아니다 — 네 갈래로 나누는 `spatial/quadtree` 정본에 최근접을 붙인 구현도 넣기와 범위 질의 두 행을 같은 계급으로 지킨다
 * (`src/data-structures/_contract/runContract.kdTree.test.ts`). 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이
 * 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **점 하나 · 마디 하나를 지나갈 때마다 1**, 정렬의 비교 한 번마다
 * 1. 배열을 잡는 런타임 비용은 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **담는 모양 — 크기가 2의 거듭제곱인 정적 나무 여럿.** 층 `i` 는 비었거나 점 `2^i` 개로 한 번에 지은 균형 나무 하나다. 넣기는
 * 이진수에 1 을 더하듯 앞에서부터 찬 층을 모아 다음 빈 층에 새로 짓는다. 크기 `m` 인 나무를 짓는 데 `m log m` 이 들고 점 하나가
 * 층을 오를 때마다 한 번씩 다시 지어지므로, 넣기 n 번의 총비용이 `n log² n` 이다 — 헤더 넣기 행의 `amortized O(log² n)` 이 이 셈이다.
 * 한 호출은 모든 층을 합치는 순간 `n log n` 이 들어 `worst` 가 아니다.
 *
 * **나무 하나 — 마디마다 점 하나, 깊이에 따라 x · y 를 번갈아 순위의 가운데로 가른다.** 가르는 기준이 좌표 **값**이 아니라 (x, y,
 * 넣은 차례) 순위라 같은 좌표가 여럿이어도 두 쪽의 크기가 반씩이다. 마디는 제 부분나무 점들의 **경계 상자**를 든다. 범위 질의는
 * 상자가 사각형과 겹치는 마디만 지나는데, 겹치되 사각형 안에 들지 않는 상자는 사각형의 변 하나를 가로지르고, 한 변을 가로지르는
 * 마디는 두 층 내려갈 때 넷 중 둘로만 늘어 크기 `m` 인 나무에서 `O(√m)` 개다. 상자가 사각형 안에 드는 마디는 제 점을 돌려주므로
 * 답의 수 `k` 로 센다. 층마다 `√(2^i)` 를 더하면 `O(√n)` 이다.
 *
 * **최근접은 상자까지의 거리로 가지를 친다 — 그래도 한 호출이 담긴 수에 비례할 수 있다.** 모든 점이 질의점에서 거의 같은 거리에
 * 있으면(원 위의 점) 점 둘 이상을 담은 상자는 전부 가장 가까운 점보다 가깝다. 헤더 최근접 행의 `worst O(n)` 이 그 입력에서 이
 * 정본이 실제로 내는 계급이다. 거리는 제곱을 정수로 비교한다 — 좌표 한도(`2^25`) 안에서 제곱 거리가 `2^53` 을 넘지 않아 부동소수
 * 반올림이 없다. 같은 거리면 x 가 작은 점, 그다음 y 가 작은 점이 이긴다(헤더 「연산 계약」). 그래서 상자 거리가 지금 가장 좋은
 * 거리와 **같으면** 가지를 치지 않는다.
 */

// #region guide:core/tree
export type Point2D = [number, number];

/** 좌표 절댓값의 한도. 헤더 「주입 정책」. */
const LIMIT = 2 ** 25;

function isCoordinate(value: number): boolean {
  return Number.isInteger(value) && Math.abs(value) <= LIMIT;
}

function isCorner(value: number): boolean {
  return typeof value === "number" && !Number.isNaN(value);
}

/** 한 번에 지은 균형 나무 하나. 마디 번호마다 점과 자식과 경계 상자를 나란한 배열에 둔다. */
interface StaticTree {
  /** 이 나무에 든 점. 층을 합칠 때 다시 모은다. */
  readonly xs: number[];
  readonly ys: number[];
  readonly px: number[];
  readonly py: number[];
  readonly left: number[];
  readonly right: number[];
  readonly minX: number[];
  readonly maxX: number[];
  readonly minY: number[];
  readonly maxY: number[];
  root: number;
}

/** 질의점에서 마디 경계 상자까지의 제곱 거리. 상자 안이면 0. 좌표가 정수라 정확하다. */
function boxDistance(
  tree: StaticTree,
  node: number,
  qx: number,
  qy: number,
): number {
  const x0 = tree.minX[node] as number;
  const x1 = tree.maxX[node] as number;
  const y0 = tree.minY[node] as number;
  const y1 = tree.maxY[node] as number;
  const dx = qx < x0 ? x0 - qx : qx > x1 ? qx - x1 : 0;
  const dy = qy < y0 ? y0 - qy : qy > y1 ? qy - y1 : 0;
  return dx * dx + dy * dy;
}
// #endregion

// #region guide:core/class
export class KDTree {
  /** 층 `i` 는 비었거나 점 `2^i` 개로 지은 나무 하나다. */
  readonly #levels: (StaticTree | null)[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  insert(point: Point2D): void {
    const [x, y] = point;
    if (!isCoordinate(x) || !isCoordinate(y)) {
      throw new RangeError(
        `좌표는 절댓값이 ${LIMIT} 이하인 정수여야 한다 — 받은 점은 [${x}, ${y}] 다`,
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
        const node = stack.pop() as number;
        this.__cost += 1;
        if (
          (tree.maxX[node] as number) < x0 ||
          (tree.minX[node] as number) > x1 ||
          (tree.maxY[node] as number) < y0 ||
          (tree.minY[node] as number) > y1
        ) {
          continue;
        }
        const px = tree.px[node] as number;
        const py = tree.py[node] as number;
        if (px >= x0 && px <= x1 && py >= y0 && py <= y1) found.push([px, py]);
        const l = tree.left[node] as number;
        const r = tree.right[node] as number;
        if (l >= 0) stack.push(l);
        if (r >= 0) stack.push(r);
      }
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    const [qx, qy] = query;
    if (!isCoordinate(qx) || !isCoordinate(qy)) {
      throw new RangeError(
        `좌표는 절댓값이 ${LIMIT} 이하인 정수여야 한다 — 받은 점은 [${qx}, ${qy}] 다`,
      );
    }
    const best = { d: Infinity, x: 0, y: 0 };
    for (const tree of this.#levels) {
      if (tree === null || tree === undefined) continue;
      this.#nearest(tree, tree.root, qx, qy, best);
    }
    return best.d === Infinity ? null : [best.x, best.y];
  }

  #nearest(
    tree: StaticTree,
    node: number,
    qx: number,
    qy: number,
    best: { d: number; x: number; y: number },
  ): void {
    this.__cost += 1;
    if (boxDistance(tree, node, qx, qy) > best.d) return;
    const px = tree.px[node] as number;
    const py = tree.py[node] as number;
    const d = (px - qx) * (px - qx) + (py - qy) * (py - qy);
    if (
      d < best.d ||
      (d === best.d && (px < best.x || (px === best.x && py < best.y)))
    ) {
      best.d = d;
      best.x = px;
      best.y = py;
    }
    const l = tree.left[node] as number;
    const r = tree.right[node] as number;
    const dl = l >= 0 ? boxDistance(tree, l, qx, qy) : Infinity;
    const dr = r >= 0 ? boxDistance(tree, r, qx, qy) : Infinity;
    const [first, second] = dl <= dr ? [l, r] : [r, l];
    if (first >= 0) this.#nearest(tree, first, qx, qy, best);
    if (second >= 0) this.#nearest(tree, second, qx, qy, best);
  }

  /** 점 `m` 개로 균형 나무를 짓는다. x 순 · y 순으로 한 번씩 정렬하고, 층마다 두 순서를 안정 분할로 나눠 내려간다. */
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
    const tree: StaticTree = {
      xs,
      ys,
      px: [],
      py: [],
      left: [],
      right: [],
      minX: [],
      maxX: [],
      minY: [],
      maxY: [],
      root: -1,
    };
    tree.root = this.#split(tree, byX, byY, 0, new Uint8Array(m));
    return tree;
  }

  /** 순위의 가운데 점을 마디로 세우고 두 순서를 같은 쪽끼리 나눈다. 마디 번호를 돌려준다(비었으면 -1). */
  #split(
    tree: StaticTree,
    byX: number[],
    byY: number[],
    depth: number,
    side: Uint8Array,
  ): number {
    const size = byX.length;
    if (size === 0) return -1;
    const primary = depth % 2 === 0 ? byX : byY;
    const other = depth % 2 === 0 ? byY : byX;
    const mid = size >> 1;
    const pivot = primary[mid] as number;
    for (let i = 0; i < size; i++) {
      this.__cost += 1;
      side[primary[i] as number] = i < mid ? 0 : i > mid ? 1 : 2;
    }
    const lowOther: number[] = [];
    const highOther: number[] = [];
    for (let i = 0; i < size; i++) {
      this.__cost += 1;
      const at = other[i] as number;
      const s = side[at];
      if (s === 0) lowOther.push(at);
      else if (s === 1) highOther.push(at);
    }
    const lowPrimary = primary.slice(0, mid);
    const highPrimary = primary.slice(mid + 1);

    const node = tree.px.length;
    const x = tree.xs[pivot] as number;
    const y = tree.ys[pivot] as number;
    tree.px.push(x);
    tree.py.push(y);
    tree.left.push(-1);
    tree.right.push(-1);
    tree.minX.push(x);
    tree.maxX.push(x);
    tree.minY.push(y);
    tree.maxY.push(y);

    const even = depth % 2 === 0;
    const l = this.#split(
      tree,
      even ? lowPrimary : lowOther,
      even ? lowOther : lowPrimary,
      depth + 1,
      side,
    );
    const r = this.#split(
      tree,
      even ? highPrimary : highOther,
      even ? highOther : highPrimary,
      depth + 1,
      side,
    );
    tree.left[node] = l;
    tree.right[node] = r;
    for (const child of [l, r]) {
      if (child < 0) continue;
      tree.minX[node] = Math.min(
        tree.minX[node] as number,
        tree.minX[child] as number,
      );
      tree.maxX[node] = Math.max(
        tree.maxX[node] as number,
        tree.maxX[child] as number,
      );
      tree.minY[node] = Math.min(
        tree.minY[node] as number,
        tree.minY[child] as number,
      );
      tree.maxY[node] = Math.max(
        tree.maxY[node] as number,
        tree.maxY[child] as number,
      );
    }
    return node;
  }
}
// #endregion
