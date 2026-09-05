/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `divideAndConquerDp.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑦ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **사각 부등식 판정은 이 함수의 직무가 아니다.** 문제가 「비용 행렬은 사각 부등식을
 * 만족한다」를 보장하고, 그 보장이 없으면 아래 재귀가 최적 분할점을 건너뛴 답을 낸다.
 */

/** 아직 확정하지 않은 칸의 값. 어떤 유한한 비용보다 크다. */
export const INF = Number.POSITIVE_INFINITY;

export function divideAndConquerDp(cost: number[][], k: number): number {
  const n = cost.length;

  // ① 기저 계층 — 구간이 하나뿐이면 [0, i] 를 통째로 묶는 것 말고 선택이 없다.
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;

  for (let g = 2; g <= k; g++) {
    // ② 이번 계층의 배열 — 계층마다 새로 만든다. 지난 계층의 값을 고치지 않는다.
    const cur: number[] = new Array<number>(n).fill(INF);

    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
    ): void => {
      // ③ 빈 범위 — 확정할 칸이 없으면 여기서 끝낸다. 재귀의 유일한 종료 조건이다.
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      // ④ 후보 상한 — 분할점은 mid 보다 앞이어야 하므로 mid - 1 로 자른다.
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        // ⑤ 최솟값 갱신 — 값과 그 값을 만든 분할점을 함께 기록한다.
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      // ⑥ 좌우 재귀 — 왼쪽 절반의 후보 상한과 오른쪽 절반의 후보 하한이 둘 다 bestOpt 다.
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };

    solve(0, n - 1, 0, n - 2);
    // ⑦ 계층 교체 — 다음 계층이 이번 계층을 이전 계층으로 읽는다.
    prev = cur;
  }

  return prev[n - 1] as number;
}
