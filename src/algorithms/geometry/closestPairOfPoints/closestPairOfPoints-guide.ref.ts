/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints.ts` 는 학습자
 * 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고,
 * 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이
 * 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾼다 — 기저의 y 정렬 · 두 절반의 최솟값 · 스트립을 뽑는 목록 · 안쪽 반복의
 * 끊는 조건. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로 다시
 * 적지 않는다.
 *
 * **거리를 제곱한 채로 다룬다.** 제곱근은 마지막 한 번만 부른다 — 제곱근은 두 값의 크기
 * 순서를 바꾸지 않으므로, 대조를 제곱 상태에서 해도 고르는 쌍이 같다.
 */

export type Point = [number, number];

/** 두 점 사이 거리의 제곱. 좌표가 정수면 이 값도 정수다. */
function squared(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/** 점이 셋 이하인 구간에서 모든 쌍을 대조한 최소 거리의 제곱. */
function smallest(points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = squared(points[i] as Point, points[j] as Point);
      if (d < best) best = d;
    }
  }
  return best;
}

/** y 오름차순인 두 목록을 합친다. 다시 정렬하지 않는다. */
function mergeByY(left: Point[], right: Point[]): Point[] {
  const out: Point[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const a = left[i] as Point;
    const b = right[j] as Point;
    if (a[1] <= b[1]) {
      out.push(a);
      i++;
    } else {
      out.push(b);
      j++;
    }
  }
  while (i < left.length) {
    out.push(left[i] as Point);
    i++;
  }
  while (j < right.length) {
    out.push(right[j] as Point);
    j++;
  }
  return out;
}

/** 한 구간이 올려 보내는 것 — 그 구간의 최소 거리 제곱과, 그 구간을 y 오름차순으로 담은 목록. */
export interface Half {
  best: number;
  byY: Point[];
}

/**
 * x 오름차순으로 정렬된 `pts` 한 구간을 푼다.
 *
 * 반환하는 `byY` 는 그 구간의 점 전부를 y 오름차순으로 담는다. 위 단계는 그 목록을 정렬이
 * 아니라 합치기로 이어받으므로, 이 약속이 깨지면 스트립의 순서가 어긋난다.
 */
export function solve(pts: Point[]): Half {
  const n = pts.length;
  if (n <= 3) {
    // ① 점이 셋 이하면 모든 쌍을 대조하고, 이 구간의 y 오름차순을 여기서 처음 만든다.
    const byY = [...pts].sort((a, b) => a[1] - b[1]);
    return { best: smallest(pts), byY };
  }
  const mid = n >> 1;
  const splitX = (pts[mid] as Point)[0];
  const left = solve(pts.slice(0, mid));
  const right = solve(pts.slice(mid));
  // ② 두 절반이 낸 값 중 작은 쪽이 지금까지의 최솟값이다.
  let best = Math.min(left.best, right.best);
  // ③ 이미 y 오름차순인 두 목록을 합치기만 한다.
  const byY = mergeByY(left.byY, right.byY);
  // ④ 분할선에서 가로 거리의 제곱이 best 보다 작은 점만 남긴다.
  const strip: Point[] = [];
  for (const p of byY) {
    const dx = p[0] - splitX;
    if (dx * dx < best) strip.push(p);
  }
  for (let i = 0; i < strip.length; i++) {
    for (let j = i + 1; j < strip.length; j++) {
      const dy = (strip[j] as Point)[1] - (strip[i] as Point)[1];
      // ⑤ 세로 거리의 제곱이 best 이상이면 그 뒤 점은 전부 더 멀다.
      if (dy * dy >= best) break;
      const d = squared(strip[i] as Point, strip[j] as Point);
      if (d < best) best = d;
    }
  }
  return { best, byY };
}

/**
 * 평면 위 점 배열에서 가장 가까운 두 점 사이의 유클리드 거리.
 *
 * 같은 좌표의 점이 둘 이상이면 0 이다. x 오름차순 정렬은 전체에서 한 번만 하고, 재귀는 그
 * 순서를 나눠 쓴다.
 */
export function closestPairOfPoints(points: Point[]): number {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  return Math.sqrt(solve(pts).best);
}
