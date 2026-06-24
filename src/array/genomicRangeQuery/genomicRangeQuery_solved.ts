import type { solution as SolutionType } from "./genomicRangeQuery";

/**
 * ## 성능 목표 예측
 *
 * N ≤ 100,000 / M ≤ 50,000.
 * 브루트포스 O(N·M) ≈ 5×10⁹ → 초과.
 * 목표: O(N + M) — prefix sum 전처리 O(N) + 쿼리 처리 O(M).
 *
 * ## 목표 함수
 *
 * $$\text{answer}[K] = \min_{P[K] \leq i \leq Q[K]} \text{impact}(S[i])$$
 *
 * ## 로직
 *
 * ### 도메인 컨셉과 조건 정의
 *
 * 충격 지수: A=1 < C=2 < G=3 < T=4
 *
 * 구간 [p, q]에서 최솟값을 구하려면, 낮은 충격 지수 순으로 "해당 문자가 구간 내에 존재하는가?"를 판단하면 된다.
 *
 * 뉴클레오타이드 c의 prefix sum 배열:
 * $$\text{prefix}_c[i] = \#\{ j \mid 0 \leq j < i,\; S[j] = c \}$$
 *
 * 구간 [p, q] 내 c의 등장 횟수:
 * $$\text{count}_c(p, q) = \text{prefix}_c[q+1] - \text{prefix}_c[p]$$
 *
 * ### 입력-도메인-출력을 포함한 수도코드
 *
 * ```
 * prefixA, prefixC, prefixG 배열을 각각 길이 N+1로 초기화 (T는 A/C/G 모두 0이면 자동으로 T)
 * for i in 0..N-1:
 *   prefixA[i+1] = prefixA[i] + (S[i] == 'A' ? 1 : 0)
 *   prefixC[i+1] = prefixC[i] + (S[i] == 'C' ? 1 : 0)
 *   prefixG[i+1] = prefixG[i] + (S[i] == 'G' ? 1 : 0)
 *
 * for K in 0..M-1:
 *   p = P[K], q = Q[K]
 *   if prefixA[q+1] - prefixA[p] > 0: answer[K] = 1
 *   else if prefixC[q+1] - prefixC[p] > 0: answer[K] = 2
 *   else if prefixG[q+1] - prefixG[p] > 0: answer[K] = 3
 *   else: answer[K] = 4
 * ```
 *
 * ### 직접 수행으로 바운더리 값 검증
 *
 * S="CAGCCTA" (N=7):
 * prefixA = [0,0,1,1,1,1,1,2]  (A: index 1, 6)
 * prefixC = [0,1,1,1,2,3,3,3]  (C: index 0, 3, 4)
 * prefixG = [0,0,0,1,1,1,1,1]  (G: index 2)
 *
 * K=0 [2,4]: A=1-1=0, C=3-1=2>0 → 2 ✓
 * K=1 [5,5]: A=1-1=0, C=3-3=0, G=1-1=0 → 4 ✓
 * K=2 [0,6]: A=2-0=2>0 → 1 ✓
 */
export const solution: typeof SolutionType = (
  S: string,
  P: number[],
  Q: number[]
): number[] => {
  const N = S.length;
  const M = P.length;

  // prefix sum 배열 (길이 N+1, index 0은 빈 prefix)
  const prefixA = new Int32Array(N + 1);
  const prefixC = new Int32Array(N + 1);
  const prefixG = new Int32Array(N + 1);

  for (let i = 0; i < N; i++) {
    prefixA[i + 1] = prefixA[i]! + (S[i] === "A" ? 1 : 0);
    prefixC[i + 1] = prefixC[i]! + (S[i] === "C" ? 1 : 0);
    prefixG[i + 1] = prefixG[i]! + (S[i] === "G" ? 1 : 0);
  }

  const answer = new Array<number>(M);

  for (let k = 0; k < M; k++) {
    const p = P[k]!;
    const q = Q[k]!;

    if (prefixA[q + 1]! - prefixA[p]! > 0) {
      answer[k] = 1;
    } else if (prefixC[q + 1]! - prefixC[p]! > 0) {
      answer[k] = 2;
    } else if (prefixG[q + 1]! - prefixG[p]! > 0) {
      answer[k] = 3;
    } else {
      answer[k] = 4;
    }
  }

  return answer;
};
