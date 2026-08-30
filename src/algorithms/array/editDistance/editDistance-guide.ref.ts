/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/editDistance/editDistance.ts` 는 학습자가 채우는 자리라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 줄을
 * 각각 하나씩 바꾼다 — 첫 열을 채우는 줄과 세 후보의 최솟값을 고르는 줄이다. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 문자열 `s` 를 `t` 로 바꾸는 데 드는 **최소 편집 횟수**를 돌려준다.
 *
 * 허용되는 편집은 삽입 · 삭제 · 교체 셋이고 각각의 비용이 1 이다. 한쪽이 빈 문자열이면
 * 다른 쪽의 길이가 곧 답이다.
 */
export function editDistance(s: string, t: string): number {
  const n = s.length;
  const m = t.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );

  // ① 첫 열 — t 가 빈 문자열인 자리다. s 의 앞 i 글자를 전부 지워야 하므로 비용이 i 다.
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i;

  // ② 첫 줄 — s 가 빈 문자열인 자리다. t 의 앞 j 글자를 전부 넣어야 하므로 비용이 j 다.
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j;

  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[]; // 윗줄 — s 를 앞에서 i-1 글자까지만 본 층
    const cur = dp[i] as number[]; // 이번 줄 — s 를 앞에서 i 글자까지 본 층

    for (let j = 1; j <= m; j++) {
      // ③ 채울 칸이 남았는가 — 남아 있으면 아래 두 갈래 중 하나로 이 칸을 정한다.
      if (s[i - 1] === t[j - 1]) {
        // ④ 두 글자가 같다 — 편집을 하나도 쓰지 않고 대각선 칸의 비용을 그대로 받는다.
        cur[j] = prev[j - 1] as number;
      } else {
        // ⑤ 다르다 — 세 후보 중 가장 작은 비용에 편집 한 번을 더한다.
        const sub = prev[j - 1] as number; // 교체 — 양쪽에서 한 글자씩 지나간다
        const del = prev[j] as number; // 삭제 — s 의 글자 하나를 버린다
        const ins = cur[j - 1] as number; // 삽입 — t 의 글자 하나를 넣는다
        cur[j] = Math.min(sub, del, ins) + 1;
      }
    }
  }

  return (dp[n] as number[])[m] as number;
}
