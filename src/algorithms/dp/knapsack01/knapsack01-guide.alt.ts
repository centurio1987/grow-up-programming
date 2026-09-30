/**
 * `purpose.alt` 의 수치 — L13. 같은 입력에 두 설계를 걸고 **값을 정한 칸** 수를 센다.
 *
 * 대조 상대는 **가치 축 DP** 다. 같은 답을 내지만 표의 축이 다르다 —
 * 이쪽은 `dp[가치] = 그 가치를 만드는 최소 무게` 를 채우고, 마지막에 무게가 `W` 이하인
 * 가장 큰 가치를 읽는다. 무게 축이 `O(nW)`, 가치 축이 `O(n·ΣV)` 라 **어느 쪽이 이기는지가
 * 입력에 달려 있다** — 그래서 대조가 성립한다.
 *
 * 계수는 **값을 정한 칸** — DP 테이블 칸 하나의 값을 정할 때마다 1 이다(0 번째 줄 포함). 답을 읽으려고
 * 표를 훑는 일은 값을 정하지 않으므로 넣지 않는다. 2026-10-01(`KAN-062`)까지는 가치 축만 마지막 훑기
 * 한 줄 `ΣV + 1` 을 더해 이름과 어긋났고, 그것을 빼 가치 축이 617,552 에서 605,676 으로 줄었다.
 * 벽시계가 아니라 실행마다 같은 값이 나온다.
 * 입력은 고정 생성식으로 만든다(난수 없음).
 *
 * **왜 전개 입력을 안 쓰는가**(L20). `input()` 을 전개의 `n=4, W=7` 로 바꿔 돌리면
 * 무게 축 40 · 가치 축 90 이다. 방향은 같지만 2.3배라, 이 과제의 규모(용량 `10^4` ·
 * 가치 합 `10^6`)에서 실제로 벌어지는 차이를 나타내지 못한다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";

/** 고정 입력 — n=50, W=1000, 무게·가치는 결정론적 생성식. */
function input() {
  const n = 50;
  const W = 1000;
  const weights = Array.from({ length: n }, (_, i) => ((i * 17) % 100) + 1);
  const values = Array.from({ length: n }, (_, i) => ((i * 37) % 500) + 1);
  return { n, W, weights, values };
}

/** 무게 축 — 이 가이드가 가르치는 절차. dp[i][c] 를 (n+1)(W+1) 칸 채운다. */
const weightAxis: BenchCase = () => {
  const { n, W, weights, values } = input();
  let cells = 0;
  let prev = new Array<number>(W + 1).fill(0);
  cells += W + 1; // 0 번째 줄
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1] as number;
    const v = values[i - 1] as number;
    const cur = new Array<number>(W + 1).fill(0);
    for (let c = 0; c <= W; c++) {
      cells++;
      if (c < w) cur[c] = prev[c] as number;
      else {
        const skip = prev[c] as number;
        const take = (prev[c - w] as number) + v;
        cur[c] = skip >= take ? skip : take;
      }
    }
    prev = cur;
  }
  return { "값을 정한 칸": cells };
};

/** 가치 축 — dp[가치] = 그 가치를 만드는 최소 무게. (n+1)(ΣV+1) 칸 채운다. */
const valueAxis: BenchCase = () => {
  const { n, weights, values } = input();
  const total = values.reduce((a, b) => a + b, 0);
  let cells = 0;
  const INF = Number.POSITIVE_INFINITY;
  let prev = new Array<number>(total + 1).fill(INF);
  prev[0] = 0;
  cells += total + 1; // 0 번째 줄
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1] as number;
    const v = values[i - 1] as number;
    const cur = new Array<number>(total + 1).fill(INF);
    for (let g = 0; g <= total; g++) {
      cells++;
      const skip = prev[g] as number;
      const take = g >= v ? (prev[g - v] as number) + w : INF;
      cur[g] = skip <= take ? skip : take;
    }
    prev = cur;
  }
  // 무게가 W 이하인 가장 큰 가치를 읽는 마지막 훑기는 값을 정하지 않으므로 세지 않는다.
  return { "값을 정한 칸": cells };
};

export const cases: Record<string, BenchCase> = {
  "무게 축 DP (이 가이드)": weightAxis,
  "가치 축 DP": valueAxis,
};
