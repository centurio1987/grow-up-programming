/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter.ts` 는
 * 학습자 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고,
 * 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이
 * 파일을 부른다.
 *
 * **판정에 배정밀도 값을 그대로 쓰지 않는다.** 좌표가 `±10^9` 이면 제곱 거리가 `8×10^18`
 * 까지 커지는데 배정밀도 정수는 `2^53` 까지만 정확하다. 그래서 제곱 거리는 큰 정수로 내고,
 * 방향 판정은 오차 한계를 넘는 값만 배정밀도 부호로 확정하고 나머지는 큰 정수로 다시 잰다.
 *
 * **`sideOf` 는 `convexHull`·`segmentsIntersect`·`pointInPolygon` 세 편이 세운 것과 같은
 * 판정이다.** 이 편은 그 셋과 달리 **벡터 둘을 직접 받는 층**(`crossSign`)을 한 겹 아래에
 * 두었다 — 껍질을 세울 때는 세 점의 꺾임으로, 캘리퍼스를 전진시킬 때는 변 벡터 둘의 각도
 * 앞뒤로 같은 판정을 쓰기 때문이다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 하나씩 바꾼다 — 제곱 거리를 내는 줄 · 캘리퍼스 전진 판정의 부등호 · 전진 반복문의
 * 머리. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로 다시 적지
 * 않는다.
 */

export type Point = [number, number];

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
 * 벡터 `u = (ux, uy)` 에서 `v = (vx, vy)` 로 갈 때의 방향. 왼쪽으로 꺾이면 1, 오른쪽으로
 * 꺾이면 −1, 두 벡터가 평행하거나 반대 방향이면 0 이다.
 *
 * 값 자체가 아니라 **부호만** 돌려준다 — 이 절차가 쓰는 것이 부호뿐이라, 크기를 정확히
 * 맞추느라 큰 정수 연산을 매번 할 이유가 없다.
 */
export function crossSign(
  ux: number,
  uy: number,
  vx: number,
  vy: number,
): number {
  // ① 먼저 배정밀도로 재고, 값이 오차 한계보다 크면 그 부호를 그대로 쓴다.
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  // ② 오차 한계 안이면 부호를 못 믿는다. 큰 정수로 다시 재서 확정한다.
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

/** 점 `o` 에서 `a` 로 간 다음 `b` 로 갈 때의 방향. 세 점의 꺾임을 재는 자리다. */
export function sideOf(o: Point, a: Point, b: Point): number {
  return crossSign(a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1]);
}

/** 사슬의 끝 두 점과 `p` 가 이루는 방향. 사슬이 두 점보다 짧으면 판정할 것이 없다. */
function turnAtEnd(chain: Point[], p: Point): number {
  const o = chain.at(-2);
  const a = chain.at(-1);
  if (o === undefined || a === undefined) return 1;
  return sideOf(o, a, p);
}

/**
 * 주어진 순서대로 점을 담되, 왼쪽으로 꺾이지 않는 점은 담기 전에 걷어낸다.
 *
 * 아래 사슬과 위 사슬이 이 함수를 순서만 바꿔 두 번 부른다.
 */
function buildChain(seq: Point[]): Point[] {
  const chain: Point[] = [];
  for (const p of seq) {
    while (chain.length >= 2 && turnAtEnd(chain, p) <= 0) chain.pop();
    chain.push(p);
  }
  return chain;
}

/**
 * 점 집합을 감싸는 최소 볼록 다각형의 꼭짓점을 **반시계 방향**으로 돌려준다.
 *
 * 변 위에 있는 공선 중간 점은 꼭짓점이 아니므로 빠지고, 같은 좌표가 여러 번 들어와도 답에는
 * 한 번만 담긴다. 서로 다른 점이 둘 이하이거나 전부 한 직선 위에 있으면 그 끝점만 남는다.
 * 절차의 유도는 [`convexHull`](../convexHull/convexHull-guide.md) 편이 다룬다.
 */
export function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);

  // 정렬해 두면 같은 좌표가 이웃하므로, 앞 점과만 견주어도 중복이 전부 걸러진다.
  const uniq: Point[] = [];
  for (const p of sorted) {
    const last = uniq.at(-1);
    if (last === undefined || last[0] !== p[0] || last[1] !== p[1])
      uniq.push(p);
  }
  if (uniq.length <= 2) return uniq;

  const lower = buildChain(uniq);
  const upper = buildChain([...uniq].reverse());
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/**
 * 두 점 사이 거리의 제곱. 좌표가 정수면 이 값도 정수이므로 큰 정수로 정확히 낸다.
 *
 * 제곱근을 여기서 부르지 않는 것이 이 절차의 전제다 — 제곱근은 두 값의 앞뒤를 바꾸지
 * 않으므로, 제곱한 채로 견주어도 고르는 쌍이 같다.
 */
export function squared(a: Point, b: Point): bigint {
  const dx = BigInt(a[0] - b[0]);
  const dy = BigInt(a[1] - b[1]);
  return dx * dx + dy * dy;
}

/** 둘 중 큰 값. */
function larger(x: bigint, y: bigint): bigint {
  return x > y ? x : y;
}

/**
 * 변 `a→b` 에서 `d` 가 `c` 보다 더 먼가.
 *
 * 두 넓이를 각각 내서 견주지 않는다. 변 `a→b` 를 밑변으로 삼은 두 삼각형의 넓이 차가
 * `(b − a) × (d − c)` 하나로 접히기 때문이다 — 외적 한 번이 그 판정의 전부다.
 */
export function farther(a: Point, b: Point, c: Point, d: Point): boolean {
  return crossSign(b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1]) > 0;
}

/**
 * 점 집합에서 가장 먼 두 점 사이 거리의 **제곱**을 큰 정수로 낸다.
 *
 * 볼록 껍질을 세우고, 변마다 그 변에서 가장 먼 꼭짓점을 캘리퍼스로 찾아 그 꼭짓점과 변의
 * 두 끝점이 만드는 쌍 둘을 후보로 삼는다.
 */
export function diameterSquared(points: Point[]): bigint {
  const hull = convexHull(points);
  const k = hull.length;
  // ③ 서로 다른 점이 둘 미만이면 잴 쌍이 아예 없다.
  if (k < 2) return 0n;

  let best = 0n;
  let far = 1;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    // ④ 다음 꼭짓점이 이 변에서 더 멀면 far 를 전진시킨다. far 는 뒤로 가지 않는다.
    while (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point))
      far = (far + 1) % k;
    const f = hull[far] as Point;
    // ⑤ 이 변의 두 끝점과 가장 먼 꼭짓점이 만드는 쌍 둘이 대척점 쌍이다.
    best = larger(best, squared(a, f));
    best = larger(best, squared(b, f));
  }
  return best;
}

/**
 * 계약이 요구하는 반환 타입에 맞춰 제곱 거리를 배정밀도로 옮긴다.
 *
 * 배정밀도가 정확히 담는 정수는 `2^53` 까지이므로, 답이 그보다 크면 이 한 걸음이 가장 가까운
 * 배정밀도 수로 반올림한다. **고르는 쌍은 그 전에 이미 정해져 있다.**
 */
export function rotatingCalipersDiameter(points: Point[]): number {
  return Number(diameterSquared(points));
}
