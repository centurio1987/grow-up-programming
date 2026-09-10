/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `knuthOptimization.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑥ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **사각 부등식 판정은 이 함수의 직무가 아니다.** 비용이 구간 합이고 `freq[i] ≥ 0` 이라는
 * 문제의 제약이 그 조건을 보장한다. 보장이 없는 비용에서는 아래 후보 범위가 진짜 최적
 * 분할점을 잘라 낸다.
 */

/** 아직 확정하지 않은 칸에 넣어 두는 값. 어떤 유한한 비용보다 크다. */
export const INF = Number.POSITIVE_INFINITY;

export function knuthOptimization(freq: number[]): number {
  const n = freq.length;
  // ① 병합이 없는 입력 — 파일이 하나 이하면 합칠 상대가 없다.
  if (n <= 1) return 0;

  // ② 구간 합 — prefix[j+1] - prefix[i] 가 S(i, j) 다.
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);

  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const opt: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  // ③ 기저 — 길이 1 구간은 합칠 것이 없어 비용이 0 이고 분할점이 자기 번호다.
  for (let i = 0; i < n; i++) (opt[i] as number[])[i] = i;

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = i;
      // ④ 후보 범위 — 하한은 왼쪽 이웃 칸의 최적 분할점이다.
      const lo = (opt[i] as number[])[j - 1] as number;
      // 상한은 아래 이웃 칸의 최적 분할점을 j-1 로 한 번 더 자른 값이다.
      const hi = Math.min((opt[i + 1] as number[])[j] as number, j - 1);
      for (let k = lo; k <= hi; k++) {
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        // ⑤ 최솟값 갱신 — 값과 그 값이 나온 분할점을 함께 남긴다.
        if (val < best) {
          best = val;
          bestK = k;
        }
      }
      // ⑥ 칸 확정 — 구간 합은 분할점과 무관하므로 마지막에 한 번만 더한다.
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
      (opt[i] as number[])[j] = bestK;
    }
  }

  return (dp[0] as number[])[n - 1] as number;
}
