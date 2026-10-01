/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 *   bun run tools/bench-alt.ts src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.alt.ts
 *
 * **대조는 구간을 정확히 `k` 개로 나누는 과제에서 한다.** 이 가이드의 과제(인접 병합)에는 같은 전제에서
 * 같은 목표를 노리는 다른 범용 절차가 없다 — 가르는 자리를 전부 넣는 방법은 「아이디어를 떠올리는 과정」이
 * 이미 반박한 단순한 방법이라 세우지 않는다(SPEC §3 `purpose.alt` — 열등한 상대를 세우지 않는다). 이웃 두
 * 칸으로 후보를 가두는 같은 생각을 줄 단위 분할 DP 에 쓰면(`opt(g-1, i) ≤ opt(g, i) ≤ opt(g, i+1)`) 분할 정복
 * 최적화와 같은 과제를 두고 구역 수 `k` 에 따라 우열이 뒤집힌다.
 *
 * **수치는 분할 정복 최적화 편의 `.alt.ts` 에서 그대로 받는다.** 그 편이 같은 대조를 반대쪽에서 적으므로, 두
 * 편이 서로 다른 구현으로 재면 한쪽 수가 다른 쪽과 어긋날 수 있다. 입력(배열 `a = [1, 2, …, 2,000]`, 비용
 * `(a[i] + … + a[j])²`, `n = 2,000`, `k` 만 바꾼다) · 두 설계의 구현 · 답의 대조(`확인()`)가 전부 그 파일에
 * 있고, 여기서는 키 이름만 이 가이드 쪽에서 부른다. 그 편의 「전개 입력」 줄은 이 가이드의 전개 입력(파일
 * 넷의 인접 병합)과 다른 과제의 입력이라 싣지 않는다(L20).
 *
 * **잣대는 원고 전체와 같은 후보 수다.** 가르는 자리 하나를 넣어 값을 만들고 지금까지의 최솟값과 비교한
 * 한 번이 1 이다. 추가 칸은 설계가 입력 밖에 새로 잡아 동시에 들고 있는 칸의 최댓값이다 — 비용 행렬 `n × n` 은
 * 입력이라 두 설계 모두 세지 않고, 분할 정복 최적화의 재귀 호출 틀 하나를 1 칸으로 센다.
 */

import { cases as dcdp } from "../divideAndConquerDp/divideAndConquerDp-guide.alt.ts";

/** 그 편의 결과에서 「전개 입력」 줄만 뺀다. */
function withoutWalk(r: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(r))
    if (!key.startsWith("전개 입력")) out[key] = value;
  return out;
}

export const cases = {
  "크누스 최적화 (이 가이드)": () => withoutWalk(dcdp["크누스 최적화"]()),
  "분할 정복 최적화": () => withoutWalk(dcdp["분할 정복 최적화 (이 가이드)"]()),
  경계: dcdp.경계,
};
