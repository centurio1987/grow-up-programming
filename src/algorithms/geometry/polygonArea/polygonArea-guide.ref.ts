/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/polygonArea/polygonArea.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을 각각
 * 하나씩 바꾼다 — 항을 더하는 줄(둘) · 절댓값을 취하는 줄 · 반복문의 끝 조건. 맞는 줄이 정확히
 * 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로 다시 적지 않는다.
 *
 * **넓이를 정수 하나로 버틴다.** 항 `x_a·y_b − x_b·y_a` 는 정수의 곱과 차라 정수이고, 그 합인
 * 「넓이의 2 배」도 정수다. 배정밀도는 마지막 두 걸음(`Number` 변환과 2 로 나누기)에서만 쓴다.
 */

export type Point = [number, number];

/**
 * 다각형의 부호 있는 넓이의 **2 배**. 값이 정수라 큰 정수로 정확히 낸다.
 *
 * 부호는 꼭짓점 순서가 정한다 — 반시계 방향이면 양수, 시계 방향이면 음수다. 원점을 공통
 * 꼭짓점으로 두고 변마다 삼각형 하나를 더하는데, 그 삼각형이 다각형 밖을 덮는 자리는 반대
 * 부호의 삼각형이 같은 크기로 함께 더해져 합에서 사라진다.
 */
export function shoelaceTwice(polygon: Point[]): bigint {
  let twice = 0n;
  for (let at = 0; at < polygon.length; at++) {
    const a = polygon[at] as Point;
    const b = polygon[(at + 1) % polygon.length] as Point;
    // ① 원점과 변 하나가 만드는 삼각형의 부호 있는 넓이의 2 배를 더한다.
    twice += BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);
  }
  return twice;
}

/**
 * 자기교차가 없는 단순 다각형 `polygon` 의 넓이. 언제나 0 이상이다.
 *
 * 꼭짓점은 경계를 따라 차례로 주어지고 마지막 꼭짓점과 첫 꼭짓점이 자동으로 이어진다. 시계
 * 방향으로 주어지든 반시계 방향으로 주어지든 답이 같고, 오목한 다각형도 갈래를 더 두지 않는다.
 */
export function polygonArea(polygon: Point[]): number {
  const twice = shoelaceTwice(polygon);
  // ② 부호는 꼭짓점 순서가 정하므로, 다 더한 뒤 한 번만 절댓값을 취한다.
  const size = twice < 0n ? -twice : twice;
  // ③ 정수를 배정밀도로 옮기고 2 로 나눈다. 2 로 나누기는 지수만 1 줄여서 오차를 안 만든다.
  return Number(size) / 2;
}
