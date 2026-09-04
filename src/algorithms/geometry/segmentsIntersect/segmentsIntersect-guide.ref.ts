/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/segmentsIntersect/segmentsIntersect.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾸거나 지운다 — 걸러내기의 빠른 경로 · 양쪽 갈림 검사 · 칸 검사 · `p3` 자리의
 * 끝점 검사. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로 다시
 * 적지 않는다.
 *
 * **`sideOf` 는 `convexHull` 편이 세운 것과 같은 판정이다.** 거기서는 사슬 끝 두 점과 새 점의
 * 꺾임을 쟀고, 여기서는 한 선분의 두 끝점과 상대 끝점 하나의 위치를 잰다. 받는 세 점의 자리가
 * 다를 뿐 값도 부호의 뜻도 같다.
 */

export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 배정밀도 곱셈만으로 부호를 확정할 수 있는 하한.
 *
 * 좌표가 `±10^9` 이면 두 좌표의 차는 `±2×10^9` 이고 곱은 `4×10^18` 까지 커진다. 그 크기의
 * 배정밀도 수는 정수를 통째로 담지 못해서, 곱 두 개와 뺄셈 한 번이 만드는 오차가
 * `C^2 / 2^49` 까지 벌어진다 — `C = 10^9` 에서 1,776.36 이다. 그보다 큰 2 의 거듭제곱을
 * 골라 두면 「이 값보다 크면 부호가 확실하다」가 항상 참이 된다.
 */
const SAFE = 2048;

/**
 * 점 `o` 에서 `a` 로 간 다음 `b` 로 갈 때의 방향. 왼쪽으로 꺾이면 1, 오른쪽으로 꺾이면 −1,
 * 세 점이 한 직선 위에 있으면 0 이다.
 *
 * 값 자체가 아니라 **부호만** 돌려준다 — 이 절차가 쓰는 것이 부호뿐이라, 크기를 정확히
 * 맞추느라 큰 정수 연산을 매번 할 이유가 없다.
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

/**
 * 두 끝점이 상대의 직선을 **사이에 두고** 갈리는가.
 *
 * 판정값이 0 인 끝점은 상대의 직선 위라 「사이에 둔다」가 성립하지 않는다. 그래서 0 을 먼저
 * 걸러내고 부호가 서로 다른지를 본다.
 */
function straddles(da: number, db: number): boolean {
  return da !== 0 && db !== 0 && da !== db;
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
 * 판정값이 0 인 끝점이 상대 **선분** 위에 있는가.
 *
 * 판정값이 0 이라는 것은 그 끝점이 상대의 **직선** 위라는 뜻까지다. 선분 위인지는 좌표 칸이
 * 정한다 — 그 점이 직선 위이면서 칸 안이면 선분 위이고, 칸 밖이면 선분을 지나친 자리다.
 */
function onSegment(a: Point, b: Point, p: Point, d: number): boolean {
  return d === 0 && inBox(a, b, p);
}

/**
 * 두 선분이 한 점이라도 공유하면 `true`, 완전히 떨어져 있으면 `false`.
 *
 * X 자 교차 · 끝점끼리 닿는 L 자 · 한 끝점이 상대 선분 안에 있는 T 자 · 같은 직선 위에서
 * 구간을 공유하는 경우가 전부 `true` 다. 길이 0 인 선분(끝점 둘이 같은 점)도 유효한 입력이고,
 * 갈래를 따로 두지 않아도 같은 코드가 답을 낸다.
 */
export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const d1 = sideOf(p3, p4, p1);
  const d2 = sideOf(p3, p4, p2);
  const d3 = sideOf(p1, p2, p3);
  const d4 = sideOf(p1, p2, p4);

  // ③ 양쪽이 다 갈리면 두 선분이 서로를 가로지른다.
  if (straddles(d1, d2) && straddles(d3, d4)) return true;

  // ④ 판정값이 0 인 끝점이 상대 선분의 칸 안이면 그 점을 공유한다.
  // ⑤ 네 검사가 다 거짓이면 두 선분은 한 점도 공유하지 않는다.
  return (
    onSegment(p3, p4, p1, d1) ||
    onSegment(p3, p4, p2, d2) ||
    onSegment(p1, p2, p3, d3) ||
    onSegment(p1, p2, p4, d4)
  );
}
