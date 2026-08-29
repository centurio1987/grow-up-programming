/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/countingSort/countingSort.ts` 는 학습자가 채우는 자리라
 * 가이드가 그 파일을 인용하지 않는다. 여기 있는 것이 가이드가 가르치는 절차 — **계수
 * 정렬**이다. 두 값을 견주는 대신 **값을 그대로 배열의 자리로 써서** 개수를 세고, 자리를
 * 오름차순으로 읽어 센 만큼 이어 쓴다.
 *
 * 계약은 원본 문제와 같다 — 오름차순으로 정렬한 **새 배열**을 돌려주고 입력 `A` 는 바꾸지
 * 않는다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **변이는 이 소스에서 기계로 만든다**(`tools/check-proof.ts` 의 `loadMutant`). 아래 두 줄이
 * 변이 대상이라 모양을 바꿀 때 `countingSort-guide.proof.ts` 의 정규식도 함께 봐야 한다 —
 * 안 맞으면 변이가 0 줄이나 2 줄에 맞아 그 자리에서 실패한다.
 */

/**
 * 키 값 공간의 칸 수. 문제의 제약 `0 ≤ A[i] ≤ 1000` 이 정한다 — 값 1000 도 자기 자리를
 * 가져야 하므로 1000 이 아니라 1001 이다.
 */
const K = 1001;

/** `A` 를 오름차순으로 정렬한 **새 배열**을 돌려준다. `A` 자체는 바뀌지 않는다. */
export function countingSort(A: number[]): number[] {
  // ① 값 하나가 칸 하나를 맡는다. 자리 `v` 에 값 `v` 의 개수를 적을 것이라 `K` 칸이다.
  const count = new Array<number>(K).fill(0);

  // ② 입력을 한 번 지나가며 값을 그대로 자리로 써서 센다. 여기에 견주기가 한 번도 없다.
  for (const v of A) count[v] = (count[v] as number) + 1;

  // ③ 자리를 0 부터 오름차순으로 읽는다. 자리가 곧 값이라 이 순서가 정렬 순서다.
  const out: number[] = [];
  for (let v = 0; v < K; v++) {
    // ④ 센 만큼 그 값을 이어 쓴다. 개수가 0 인 자리에서는 한 번도 실행되지 않는다.
    for (let t = count[v] as number; t > 0; t--) out.push(v);
  }

  return out;
}
