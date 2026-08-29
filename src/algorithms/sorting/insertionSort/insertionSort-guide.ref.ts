/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/insertionSort/insertionSort.ts` 는 학습자가 채우는 자리라
 * 가이드가 그 파일을 인용하지 않는다. 여기 있는 것이 가이드가 가르치는 절차 — **삽입
 * 정렬**이다. 왼쪽 구역을 오름차순으로 유지하면서, 그 오른쪽 칸의 값 하나를 구역 안의
 * 제 자리에 넣는 일을 되풀이한다.
 *
 * 계약은 원본 문제와 같다 — 오름차순으로 정렬한 **새 배열**을 돌려주고 입력 `A` 는 바꾸지
 * 않는다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **변이는 이 소스에서 기계로 만든다**(`tools/check-proof.ts` 의 `loadMutant`). 아래 세 줄이
 * 변이 대상이라 모양을 바꿀 때 `insertionSort-guide.proof.ts` 의 정규식도 함께 봐야 한다 —
 * 안 맞으면 변이가 0 줄이나 2 줄에 맞아 그 자리에서 실패한다.
 */

/** `A` 를 오름차순으로 정렬한 **새 배열**을 돌려준다. `A` 자체는 바뀌지 않는다. */
export function insertionSort(A: number[]): number[] {
  // ① 원본을 지키려고 복사본을 만든다. 「원본을 바꾸지 않는다」가 이 문제의 계약이다.
  const B = Array.from(A);

  for (let i = 1; i < B.length; i++) {
    // ② 정렬된 구역 `B[0..i-1]` 의 바로 오른쪽 값을 뽑아 둔다. 그 칸은 이제 비어 있는
    //    것으로 다루어도 된다 — 값이 `key` 에 남아 있다.
    const key = B[i] as number;
    let j = i - 1;

    // ③ 왼쪽 값이 `key` 보다 크다 — 한 칸 오른쪽으로 옮기고 한 칸 더 왼쪽을 본다.
    //    `j >= 0` 을 먼저 판정해야 구역 밖을 읽지 않는다.
    while (j >= 0 && (B[j] as number) > key) {
      B[j + 1] = B[j] as number;
      j--;
    }

    // ④ 구역의 왼쪽 끝을 지났거나 왼쪽 값이 `key` 이하다. 비어 있는 `B[j+1]` 이 `key` 의
    //    자리이고, 이것으로 정렬된 구역이 한 칸 늘어난다.
    B[j + 1] = key;
  }

  return B;
}
