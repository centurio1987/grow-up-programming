import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — 배열 `[1, 2, 3, 4]` 의
 * 구간 합 제곱을 비용으로 삼아 거점 넷을 세 구역으로 나눈다. 프레임 수(12)가 그 절의 T#
 * 단계 수(12)와 같다 — P3 이 그 관계를 잰다. **T# 하나에 프레임 하나를 둔다.** 본문이 특정
 * 걸음을 이름으로 짚는 자리가 있어서(「T5 가 확정한 52 를 T10 이 다시 쓰지 않는다」)
 * 프레임을 묶으면 그 걸음을 화면에서 찾을 수 없다.
 *
 * `keyValue` 와 `matrix` 조합을 고른 이유를 적어 둔다.
 *
 * 1. **`matrix` 가 계층 표를, `keyValue` 가 지금 하는 일을 진다.** 계층 표는 행이 구역 수
 *    `g` 이고 열이 구간 끝 `i` 라 그대로 격자다. 지금 어느 칸을 확정하는지 · 후보 범위가
 *    어디까지인지 · `bestOpt` 가 얼마인지는 격자의 칸이 아니라 그 옆의 상태라 `entries`
 *    한 줄씩으로 둔다.
 * 2. **`INF` 를 빈 칸으로 적지 않는다.** 코드가 그 칸에 `Number.POSITIVE_INFINITY` 를 실제로
 *    적어 두므로 `null`(아직 만들지 않은 계층)과 갈라 보인다. 본문 증명 블록의 표기와 같다.
 * 3. **계층을 교체하는 걸음도 프레임 하나다.** 값이 안 바뀌는 걸음이지만 그 자리가 「이번
 *    계층이 다음 계층의 이전 계층이 된다」를 뜻하고, 강조를 계층 행 전체에 두어 보인다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const dcdpWalk = {
  view: ["keyValue", "matrix"] as const,
  title: "거점 넷을 세 구역으로 나눈다",
  result: "34",
  steps: [
    {
      title: "T1 기저 계층을 채운다",
      detail:
        "구역이 하나뿐이면 [0, i] 를 통째로 묶는 것 말고 선택이 없다. dp[1][i] 는 cost[0][i] 를 그대로 옮긴 값이다.",
      entries: [
        { label: "확정한 계층", value: "dp[1]" },
        { label: "값", value: "1 · 9 · 36 · 100" },
        { label: "후보 검사", value: "0 — 검사할 분할점이 없다" },
      ],
      matrix: [
        [1, 9, 36, 100],
        [null, null, null, null],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ] as [number, number][],
    },
    {
      title: "T2 계층 2 의 가운데 칸을 확정한다",
      detail:
        "solve(0, 3, 0, 2) 의 mid 는 1 이다. 후보 상한이 min(2, 0) = 0 이라 j = 0 하나만 검사한다: dp[1][0] + cost[1][1] = 1 + 4 = 5.",
      entries: [
        { label: "호출", value: "solve(0, 3, 0, 2)" },
        { label: "mid", value: 1 },
        { label: "후보 범위", value: "[0, 0]" },
        { label: "확정한 값", value: "dp[2][1] = 5" },
        { label: "bestOpt", value: 0 },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, "INF", "INF"],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[1, 1]] as [number, number][],
    },
    {
      title: "T3 후보가 하나도 없는 칸",
      detail:
        "왼쪽 재귀 solve(0, 0, 0, 0) 의 mid 는 0 이다. 상한이 min(0, -1) = -1 이라 반복이 한 번도 실행되지 않고 dp[2][0] 은 INF 로 남는다. 거점 하나를 두 구역으로 나눌 수 없다는 뜻이다.",
      entries: [
        { label: "호출", value: "solve(0, 0, 0, 0)" },
        { label: "mid", value: 0 },
        { label: "후보 범위", value: "[0, -1] — 비어 있다" },
        { label: "확정한 값", value: "dp[2][0] = INF" },
        { label: "bestOpt", value: "고치지 않는다 — optLo 그대로 0" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, "INF", "INF"],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T4 오른쪽 절반의 가운데 칸",
      detail:
        "오른쪽 재귀 solve(2, 3, 0, 2) 의 mid 는 2 다. 상한이 min(2, 1) = 1 이라 j = 0 과 j = 1 을 검사한다: 1 + 25 = 26 과 9 + 9 = 18.",
      entries: [
        { label: "호출", value: "solve(2, 3, 0, 2)" },
        { label: "mid", value: 2 },
        { label: "후보 범위", value: "[0, 1]" },
        { label: "후보 값", value: "j=0: 26 · j=1: 18" },
        { label: "확정한 값", value: "dp[2][2] = 18" },
        { label: "bestOpt", value: 1 },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, "INF"],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[1, 2]] as [number, number][],
    },
    {
      title: "T5 하한이 1 로 올라간 마지막 칸",
      detail:
        "solve(3, 3, 1, 2) 의 하한이 바로 앞 걸음의 bestOpt 인 1 이다. j = 0 은 검사하지 않는다 — 최적 분할점이 뒤로만 가기 때문이다. j=1: 9 + 49 = 58, j=2: 36 + 16 = 52.",
      entries: [
        { label: "호출", value: "solve(3, 3, 1, 2)" },
        { label: "mid", value: 3 },
        { label: "후보 범위", value: "[1, 2] — 하한이 0 에서 1 로" },
        { label: "후보 값", value: "j=1: 58 · j=2: 52" },
        { label: "확정한 값", value: "dp[2][3] = 52" },
        { label: "bestOpt", value: 2 },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[1, 3]] as [number, number][],
    },
    {
      title: "T6 계층 2 를 이전 계층으로 삼는다",
      detail:
        "계층 2 의 네 칸이 다 정해졌다. prev = cur 한 줄이 다음 계층의 읽는 자리를 옮긴다. 값은 하나도 안 바뀐다.",
      entries: [
        { label: "이전 계층", value: "dp[1] → dp[2]" },
        { label: "다음에 채울 계층", value: "dp[3]" },
        { label: "지난 계층", value: "dp[1] 은 다시 읽지 않는다" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        [null, null, null, null],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ] as [number, number][],
    },
    {
      title: "T7 계층 3 의 가운데 칸",
      detail:
        "같은 재귀를 계층 3 에서 되풀이한다. mid = 1 의 유일한 후보 j = 0 이 dp[2][0] = INF 를 읽으므로 값이 INF 로 남는다. 거점 둘을 세 구역으로 나눌 수 없다는 뜻이다.",
      entries: [
        { label: "호출", value: "solve(0, 3, 0, 2)" },
        { label: "mid", value: 1 },
        { label: "후보 범위", value: "[0, 0]" },
        { label: "후보 값", value: "j=0: INF + 4 = INF" },
        { label: "확정한 값", value: "dp[3][1] = INF" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", "INF", "INF"],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[2, 1]] as [number, number][],
    },
    {
      title: "T8 계층 3 에서도 후보가 없는 칸",
      detail:
        "solve(0, 0, 0, 0) 의 상한이 다시 -1 이다. dp[3][0] 은 INF 로 남는다.",
      entries: [
        { label: "호출", value: "solve(0, 0, 0, 0)" },
        { label: "mid", value: 0 },
        { label: "후보 범위", value: "[0, -1] — 비어 있다" },
        { label: "확정한 값", value: "dp[3][0] = INF" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", "INF", "INF"],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[2, 0]] as [number, number][],
    },
    {
      title: "T9 세 구역이 처음으로 성립하는 칸",
      detail:
        "solve(2, 3, 0, 2) 의 mid 는 2 다. j=0 은 dp[2][0] = INF 라 후보가 되지 못하고, j=1 이 dp[2][1] + cost[2][2] = 5 + 9 = 14 를 만든다.",
      entries: [
        { label: "호출", value: "solve(2, 3, 0, 2)" },
        { label: "mid", value: 2 },
        { label: "후보 범위", value: "[0, 1]" },
        { label: "후보 값", value: "j=0: INF · j=1: 14" },
        { label: "확정한 값", value: "dp[3][2] = 14" },
        { label: "bestOpt", value: 1 },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", 14, "INF"],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[2, 2]] as [number, number][],
    },
    {
      title: "T10 답이 되는 칸",
      detail:
        "solve(3, 3, 1, 2) 의 하한이 1 이다. j=1: dp[2][1] + cost[2][3] = 5 + 49 = 54, j=2: dp[2][2] + cost[3][3] = 18 + 16 = 34.",
      entries: [
        { label: "호출", value: "solve(3, 3, 1, 2)" },
        { label: "mid", value: 3 },
        { label: "후보 범위", value: "[1, 2]" },
        { label: "후보 값", value: "j=1: 54 · j=2: 34" },
        { label: "확정한 값", value: "dp[3][3] = 34" },
        { label: "bestOpt", value: 2 },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", 14, 34],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[2, 3]] as [number, number][],
    },
    {
      title: "T11 계층 3 을 이전 계층으로 삼는다",
      detail:
        "마지막 계층이 끝나 prev 가 dp[3] 을 가리킨다. g 가 k = 3 을 넘어 반복이 끝난다.",
      entries: [
        { label: "이전 계층", value: "dp[2] → dp[3]" },
        { label: "남은 계층", value: "없다 — g 가 k = 3 을 넘었다" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", 14, 34],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T12 마지막 칸을 반환한다",
      detail:
        "prev[n-1] = dp[3][3] = 34 가 답이다. 분할은 [0,1] · [2,2] · [3,3] 이고 비용은 9 + 9 + 16 = 34 다.",
      entries: [
        { label: "반환값", value: 34 },
        { label: "분할", value: "[0,1] · [2,2] · [3,3]" },
        { label: "비용", value: "9 + 9 + 16 = 34" },
      ],
      matrix: [
        [1, 9, 36, 100],
        ["INF", 5, 18, 52],
        ["INF", "INF", 14, 34],
      ],
      rowLabels: ["dp[1]", "dp[2]", "dp[3]"],
      colLabels: [0, 1, 2, 3],
      cells: [[2, 3]] as [number, number][],
    },
  ] satisfies Frame[],
};
