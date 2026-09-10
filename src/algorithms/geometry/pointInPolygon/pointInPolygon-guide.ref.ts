/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/pointInPolygon/pointInPolygon.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을 각각
 * 하나씩 바꾸거나 지운다 — 걸러내기의 빠른 경로 · 변 위 판정 · 높이 판정의 반개구간 · 뒤집기의
 * 방향 보정. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로 다시 적지
 * 않는다.
 *
 * **`sideOf` 는 `convexHull`·`segmentsIntersect` 두 편이 세운 것과 같은 판정이다.** 앞 편은
 * 사슬 끝 두 점과 새 점의 꺾임을 쟀고, 뒤 편은 한 선분의 두 끝점과 상대 끝점의 위치를 쟀다.
 * 이 편은 변의 두 끝점과 **질의 점**을 넣는다 — 받는 세 점의 자리만 다르고 값도 부호의 뜻도 같다.
 */

export type Point = [number, number];

/**
 * 배정밀도 곱셈만으로 부호를 확정할 수 있는 하한.
 *
 * 좌표가 `±10^9` 이면 두 좌표의 차는 `±2×10^9` 이고 곱은 `4×10^18` 까지 커진다. 그 크기의
 * 배정밀도 수는 정수를 통째로 담지 못해서, 곱 두 개와 뺄셈 한 번이 만드는 오차가 `C^2 / 2^49`
 * 까지 벌어진다 — `C = 10^9` 에서 1,776.36 이다. 그보다 큰 2 의 거듭제곱을 골라 두면 「이 값보다
 * 크면 부호가 확실하다」가 항상 참이 된다.
 */
const SAFE = 2048;

/**
 * 점 `o` 에서 `a` 로 간 다음 `b` 로 갈 때의 방향. 왼쪽으로 꺾이면 1, 오른쪽으로 꺾이면 −1,
 * 세 점이 한 직선 위에 있으면 0 이다.
 *
 * 값 자체가 아니라 **부호만** 돌려준다 — 이 절차가 쓰는 것이 부호뿐이라, 크기를 정확히 맞추느라
 * 큰 정수 연산을 매번 할 이유가 없다.
 */
export function sideOf(o: Point, a: Point, b: Point): number {
  const ux = a[0] - o[0];
  const uy = a[1] - o[1];
  const vx = b[0] - o[0];
  const vy = b[1] - o[1];
  // ① 먼저 배정밀도로 재고, 값이 오차 한계보다 크면 그 부호를 그대로 쓴다.
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  // ② 오차 한계 안이면 부호를 못 믿는다. 큰 정수로 다시 재서 확정한다.
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

/** 점 `p` 가 `a`·`b` 두 끝점이 만드는 좌표 칸 안에 있는가. */
function inBox(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a[0], b[0]) <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= p[1] &&
    p[1] <= Math.max(a[1], b[1])
  );
}

/**
 * 점 `p` 가 단순 다각형 `polygon` 의 내부이거나 경계 위이면 `true`, 외부이면 `false`.
 *
 * 꼭짓점은 경계를 따라 차례로 주어지고 마지막 꼭짓점과 첫 꼭짓점이 자동으로 이어진다. 시계
 * 방향으로 주어지든 반시계 방향으로 주어지든 답이 같고, 오목한 다각형도 갈래를 더 두지 않는다.
 */
export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  const py = p[1];
  let inside = false;
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    const a = polygon[prev] as Point;
    const b = polygon[at] as Point;
    const d = sideOf(a, b, p);
    // ③ 점이 변 위에 있으면 그 자리에서 참이다.
    if (d === 0 && inBox(a, b, p)) return true;
    // ④ 아래 끝은 포함하고 위 끝은 빼서, 반직선의 높이를 지나는 변만 남긴다.
    const aboveA = a[1] > py;
    const aboveB = b[1] > py;
    if (aboveA === aboveB) continue;
    // ⑤ 교점이 점의 오른쪽이면 안팎이 뒤집힌다.
    const onLeft = d > 0;
    const goesUp = b[1] > a[1];
    if (onLeft === goesUp) inside = !inside;
  }
  // ⑥ 변을 다 본 뒤의 홀짝이 답이다.
  return inside;
}
