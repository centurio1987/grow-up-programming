/**
 * 결함 fixture — 크기가 2의 거듭제곱인 **x 순 배열 여럿**에 점을 두는 평면 점 집합.
 *
 * 넣기는 `spatial/kdTree` 정본과 같은 이진수 올림으로 층을 합치되 나무 대신 x 순 배열을 병합으로 짓는다. 범위 질의는 배열마다 x
 * 구간의 왼쪽 끝을 이분 탐색으로 찾고 오른쪽 끝까지 훑으며 y 를 거른다. 최근접은 전부 훑는다. 답은 전부 옳다(축1 통과). 좌표
 * 검사는 하지 않는다.
 *
 * **x 가 좁은 사각형에는 빠르고 y 가 좁은 사각형에는 담긴 수에 비례한다** — 거울상인 두 결함 계열 중 하나를 대표한다(y 순
 * 배열이 다른 하나다). 가는 띠 시나리오가 세로 띠와 가로 띠를 번갈아 묻는 이유가 이 fixture 다(§「거울상인 두 결함 계열은 한
 * 호출열에서 함께 겨눈다」).
 *
 * - **걸리는 것 — 가로 띠가 섞인 가는 띠 범위 질의.**
 * - 넣기(병합 올림 — 상각 로그)와 전부 묻기 · 최근접(`O(n)`)은 통과한다.
 *
 * 계측은 §규약2 계측 단위 그대로 — 점 하나를 지날 때마다 1, 이분 탐색은 들여다본 칸마다 1.
 */

export type Point2D = [number, number];

interface Run {
  xs: number[];
  ys: number[];
}

export class XSortedRunsPointSet {
  readonly #runs: (Run | null)[] = [];
  __cost = 0;

  insert(point: Point2D): void {
    let carry: Run = { xs: [point[0]], ys: [point[1]] };
    let level = 0;
    for (;;) {
      const full = this.#runs[level];
      if (full === undefined || full === null) break;
      carry = this.#merge(full, carry);
      this.#runs[level] = null;
      level++;
    }
    this.#runs[level] = carry;
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    const found: Point2D[] = [];
    for (const run of this.#runs) {
      if (run === null || run === undefined) continue;
      let lo = 0;
      let hi = run.xs.length;
      while (lo < hi) {
        this.__cost += 1;
        const mid = (lo + hi) >> 1;
        if ((run.xs[mid] as number) < min[0]) lo = mid + 1;
        else hi = mid;
      }
      for (let i = lo; i < run.xs.length; i++) {
        this.__cost += 1;
        const x = run.xs[i] as number;
        if (x > max[0]) break;
        const y = run.ys[i] as number;
        if (y >= min[1] && y <= max[1]) found.push([x, y]);
      }
    }
    return found;
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    let best: Point2D | null = null;
    let bestD = Infinity;
    for (const run of this.#runs) {
      if (run === null || run === undefined) continue;
      for (let i = 0; i < run.xs.length; i++) {
        this.__cost += 1;
        const x = run.xs[i] as number;
        const y = run.ys[i] as number;
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
    }
    return best;
  }

  #merge(a: Run, b: Run): Run {
    const xs: number[] = [];
    const ys: number[] = [];
    let i = 0;
    let j = 0;
    while (i < a.xs.length || j < b.xs.length) {
      this.__cost += 1;
      const takeA =
        j >= b.xs.length ||
        (i < a.xs.length && (a.xs[i] as number) <= (b.xs[j] as number));
      if (takeA) {
        xs.push(a.xs[i] as number);
        ys.push(a.ys[i] as number);
        i++;
      } else {
        xs.push(b.xs[j] as number);
        ys.push(b.ys[j] as number);
        j++;
      }
    }
    return { xs, ys };
  }
}
