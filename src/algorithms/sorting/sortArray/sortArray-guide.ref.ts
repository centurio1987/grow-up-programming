/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/sortArray/sortArray.ts` 는 학습자가 채우는 스텁이라 절차가
 * 비어 있다. 여기 있는 것이 가이드가 가르치는 절차 — **병합 정렬**이다. 반으로 가른 두 조각을
 * 각각 정렬한 다음, 앞에서부터 작은 쪽을 꺼내 합친다.
 *
 * 계약은 원본 문제와 같다 — 오름차순으로 정렬한 **새 배열**을 돌려주고 입력 `A` 는 바꾸지
 * 않는다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * 이미 오름차순인 두 배열을 오름차순 하나로 합친다.
 *
 * 두 배열의 머리만 비교해 작은 쪽을 꺼내는 것을 되풀이한다. 값이 같으면 왼쪽을 먼저 꺼낸다 —
 * 그것이 같은 값의 원래 순서를 지키는 자리다.
 */
function merge(L: number[], R: number[]): number[] {
  const out: number[] = [];
  let i = 0;
  let j = 0;

  while (i < L.length && j < R.length) {
    if ((L[i] as number) <= (R[j] as number)) {
      // ② 왼쪽 머리가 작거나 같다 — 왼쪽을 꺼낸다.
      out.push(L[i++] as number);
    } else {
      // ③ 오른쪽 머리가 더 작다 — 오른쪽을 꺼낸다.
      out.push(R[j++] as number);
    }
  }

  // ④ 오른쪽이 먼저 비었다. 왼쪽에 남은 값은 이미 오름차순이고 전부 out 의 끝보다 크거나 같다.
  while (i < L.length) {
    out.push(L[i++] as number);
  }
  // ⑤ 왼쪽이 먼저 비었다. 오른쪽에 남은 값을 같은 이유로 그대로 이어 붙인다.
  while (j < R.length) {
    out.push(R[j++] as number);
  }

  return out;
}

/** `A` 를 오름차순으로 정렬한 **새 배열**을 돌려준다. `A` 자체는 바뀌지 않는다. */
export function sortArray(A: number[]): number[] {
  // ① 칸이 하나 이하면 이미 정렬돼 있다. 그래도 복사본을 만든다 — 반환 배열은 입력과 다른
  //    배열이어야 한다는 것이 이 문제의 계약이다.
  if (A.length <= 1) {
    return A.slice();
  }

  const mid = A.length >> 1;
  const left = sortArray(A.slice(0, mid));
  const right = sortArray(A.slice(mid));
  return merge(left, right);
}
