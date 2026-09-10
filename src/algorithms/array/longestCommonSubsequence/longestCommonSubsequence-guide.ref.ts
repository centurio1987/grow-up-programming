/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence.ts` 는
 * 학습자가 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서
 * 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 줄을
 * 각각 하나씩 바꾼다 — 마지막 글자가 다를 때 값을 정하는 줄과 같을 때 값을 정하는 줄이다.
 * 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 두 문자열 `s` 와 `t` 의 **최장 공통 부분 수열 길이**를 돌려준다.
 *
 * 부분 수열은 원래 순서를 지키며 0 개 이상의 글자를 고른 것이고, 고른 자리가 연속일 필요는
 * 없다. 한쪽이 빈 문자열이면 공통 부분 수열이 빈 문자열뿐이라 답이 0 이다.
 */
export function longestCommonSubsequence(s: string, t: string): number {
  const n = s.length;
  const m = t.length;

  // ① 표를 (n+1) × (m+1) 로 깔고 전부 0 으로 둔다. 0 번째 줄과 0 번째 열은 한쪽이 빈
  //    문자열인 자리라, 그 0 이 계산 결과가 아니라 정의에서 바로 나온 값이다.
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[]; // 윗줄 — s 의 앞 i-1 글자까지만 본 층
    const cur = dp[i] as number[]; // 이번 줄 — s 의 앞 i 글자까지 본 층

    for (let j = 1; j <= m; j++) {
      // ② 채울 칸이 남았는가 — 남아 있으면 아래 두 갈래 중 하나로 이 칸을 정한다.
      if (s[i - 1] === t[j - 1]) {
        // ③ 마지막 글자가 같다 — 그 글자를 쓰고, 남은 것은 대각선 칸의 답이다.
        cur[j] = (prev[j - 1] as number) + 1;
      } else {
        // ④ 마지막 글자가 다르다 — 한쪽의 마지막 글자를 버린 두 답 중 큰 쪽을 이어받는다.
        cur[j] = Math.max(prev[j] as number, cur[j - 1] as number);
      }
    }
  }

  return (dp[n] as number[])[m] as number;
}
