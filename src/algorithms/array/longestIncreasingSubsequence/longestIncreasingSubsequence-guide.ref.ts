/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence.ts` 는
 * 학습자 스텁이라 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로**
 * 같은 절차다 — 길이마다 「끝값이 가장 작은 것」 하나만 들고 있고, 원소를 하나씩 보면서 그
 * 목록의 자리를 이분 탐색으로 찾아 붙이거나 갈아 끼운다.
 *
 * **표준 라이브러리의 이분 탐색을 쓰지 않는다.** JavaScript 에는 하한 탐색이 없고, 직접 적어야
 * 「같은 값을 만났을 때 어느 쪽으로 가는가」가 본문에 드러난다. 그 한 글자가 엄격 증가와
 * 비감소를 가르는 자리다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 이분 탐색의 비교를 「작다」에서 「작거나 같다」로 바꾸면 엄격 증가가 비감소가 된다.
 * - 자리를 갈아 끼우는 줄을 지우면 목록이 늘기만 하고 값이 안 내려가, 답이 작아진다.
 */

/**
 * 정수 배열에서 **엄격하게 증가하는** 부분 수열 중 가장 긴 것의 길이를 돌려준다.
 * 원소가 하나뿐이면 언제나 1 이고, 빈 배열이면 0 이다.
 */
export function longestIncreasingSubsequence(A: number[]): number {
  // tails[k] — 길이 k+1 인 증가 부분 수열들의 마지막 값 중 가장 작은 것.
  const tails: number[] = [];

  for (const x of A) {
    // x 이상인 첫 자리를 찾는다. tails 가 증가하므로 이분 탐색이 성립한다.
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      // ① 엄격 증가라 같은 값은 「x 이상」 쪽에 넣는다. 비교를 넓히면 비감소가 된다.
      if ((tails[mid] as number) < x) lo = mid + 1;
      else hi = mid;
    }

    // ② 자리가 목록의 끝이면 더 긴 부분 수열이 처음 만들어진 것이다.
    if (lo === tails.length) tails.push(x);
    // ③ 아니면 그 길이의 끝값을 더 작은 x 로 갈아 끼운다. 길이는 안 바뀐다.
    else tails[lo] = x;
  }

  // ④ 목록의 길이가 곧 가장 긴 증가 부분 수열의 길이다.
  return tails.length;
}
