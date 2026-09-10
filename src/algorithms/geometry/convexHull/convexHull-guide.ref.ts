/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/convexHull/convexHull.ts` 는 학습자 스텁이라 가이드가 그대로
 * 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾼다 — 정렬 비교 함수 · 걸러내기의 빠른 경로 · 사슬에서 걷어내는 조건 ·
 * 아래 사슬의 마지막 점 떼기. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에
 * 같은 모양으로 다시 적지 않는다.
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
  // ② 먼저 배정밀도로 재고, 값이 오차 한계보다 크면 그 부호를 그대로 쓴다.
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  // ③ 오차 한계 안이면 부호를 못 믿는다. 큰 정수로 다시 재서 확정한다.
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
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
    // ④ 끝 두 점과 p 가 왼쪽으로 꺾이지 않으면 끝점을 걷어낸다.
    while (chain.length >= 2 && turnAtEnd(chain, p) <= 0) chain.pop();
    chain.push(p);
  }
  return chain;
}

/**
 * 점 집합을 감싸는 최소 볼록 다각형의 꼭짓점을 **반시계 방향**으로 돌려준다.
 *
 * 변 위에 있는 공선 중간 점은 꼭짓점이 아니므로 빠지고, 같은 좌표가 여러 번 들어와도 답에는
 * 한 번만 담긴다. 점이 둘 이하이거나 전부 한 직선 위에 있으면 그 끝점만 남는다.
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
  // ① 서로 다른 점이 둘 이하면 그 점들이 그대로 답이다. 꺾일 자리가 없다.
  if (uniq.length <= 2) return uniq;

  const lower = buildChain(uniq);
  const upper = buildChain([...uniq].reverse());

  // ⑤ 두 사슬의 마지막 점은 상대 사슬의 첫 점과 같다. 떼고 이어야 한 번씩만 담긴다.
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
