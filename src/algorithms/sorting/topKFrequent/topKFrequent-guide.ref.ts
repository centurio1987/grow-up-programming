/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/topKFrequent/topKFrequent.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 자리 수를 정하는 한 줄 · 자리 번호를 내려가며 읽는 한 줄 · 한 자리 안에서
 * 끝내는 한 줄(꼬리 주석의 원문자 ⑤ 로 찾는다). 맞는 줄이 정확히 하나가 아니면 던지므로,
 * 그 세 식을 주석에 다시 적지 않는다.
 */

/**
 * 정수 배열 `A` 에서 등장 횟수가 가장 많은 값 `k` 개를 등장 횟수 내림차순으로 돌려준다.
 *
 * 등장 횟수가 같은 값끼리의 순서는 문제가 임의로 두므로, 이 구현은 `A` 에서 처음 나온
 * 순서를 그대로 쓴다. `k` 는 서로 다른 값의 개수 이하라고 문제가 보장한다.
 */
export function topKFrequent(A: number[], k: number): number[] {
  const n = A.length;

  const freq = new Map<number, number>();
  for (const v of A) {
    freq.set(v, (freq.get(v) ?? 0) + 1); // ① 값마다 등장 횟수를 더한다
  }

  // 등장 횟수는 1 이상 n 이하다. 자리 번호 0 부터 n 까지면 모자라지 않는다.
  const slot: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [v, f] of freq) {
    slot[f]?.push(v); // ② 등장 횟수를 자리 번호로 삼아 값을 담는다
  }

  const result: number[] = [];
  // ③ 자리 번호를 큰 쪽에서 작은 쪽으로 내려간다. k 개가 차면 더 내려가지 않는다
  for (let f = n; f >= 1 && result.length < k; f--) {
    for (const v of slot[f] ?? []) {
      result.push(v); // ④ 답에 값을 담는다
      if (result.length === k) break; // ⑤ 한 자리 안에서도 k 개가 차면 끝낸다
    }
  }
  return result;
}
