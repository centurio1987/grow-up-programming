/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/missingInteger/missingInteger.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 표시할 값을 거르는 조건 둘과, 루프가 끝난 뒤 돌려주는 줄 하나다. 맞는 줄이 정확히
 * 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 정수 배열 `A` 에 없는 가장 작은 양의 정수를 돌려준다.
 *
 * 값을 칸 번호로 쓰는 직접 주소 테이블 `seen` 을 한 번 채우고, 1 부터 차례로 읽어 처음 비어 있는
 * 칸을 답으로 낸다. `A` 는 바꾸지 않는다.
 */
export function missingInteger(A: number[]): number {
  const n = A.length;

  // 칸 `x` 는 값 `x` 가 A 에 있는지를 적는다. 답은 n + 1 을 넘지 않으므로 칸 1 … n 이면
  // 충분하다. 칸 0 은 쓰지 않는다.
  const seen = new Array<boolean>(n + 1).fill(false);
  for (const x of A) {
    if (x >= 1 && x <= n) {
      // ① 표시 — 칸이 있는 값만 제 칸에 표시한다. 같은 값이 또 오면 같은 칸을 다시 쓴다.
      seen[x] = true;
    }
  }

  for (let x = 1; x <= n; x++) {
    if (!seen[x]) {
      // ② 빈 칸 — 1 부터 읽어 처음 만난 빈 칸이 답이다.
      return x;
    }
  }

  // ③ 1 부터 n 까지 모두 있으면 답은 그다음 수다.
  return n + 1;
}
