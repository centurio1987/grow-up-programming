import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`coins = [1, 2, 5]` ·
 * `amount = 5`)을 쓴다. 프레임 수는 그 절의 T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `keyValue` 와 `matrix` 를 함께 그린다. 표만 그리면 「지금 어느 동전을 열었고 어느 칸을
 * 정하는 중인가」가 안 보이고, 그 둘이 이 알고리즘에서 갈래를 정하는 값이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const table = {
  view: ["keyValue", "matrix"] as const,
  title: "coinChangeWays([1, 2, 5], 5)",
  result: "4",
  steps: [
    {
      title: "T1 0번째 줄을 깐다",
      detail:
        "dp[i][a] = 앞의 i 종류만 써서 금액 a 를 만드는 조합의 수. 동전이 없으면 만들 수 있는 금액은 0 원뿐이라 첫 칸만 1 이다.",
      entries: [
        { label: "여는 동전", value: "아직 없음" },
        { label: "정한 칸", value: "dp[0][0] = 1" },
        { label: "갈래", value: "①" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: "T2 첫 줄의 a=0 — 1 원짜리를 못 쓰는 칸",
      detail:
        "0 < 1 이라 ②. 윗 줄의 같은 자리를 그대로 옮긴다. dp[1][0] = dp[0][0] = 1.",
      entries: [
        { label: "여는 동전", value: "c = 1" },
        { label: "지금 칸", value: "a = 0" },
        { label: "판정", value: "0 < 1 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T3~T4 첫 줄의 나머지 — 같은 줄 왼쪽을 이어받는다",
      detail:
        "a ≥ 1 이라 ③. dp[1][a] = dp[0][a] + dp[1][a-1] = 0 + 1 이라 전부 1 이다. 1 원짜리로 만드는 방법은 어느 금액에서도 한 가지다.",
      entries: [
        { label: "여는 동전", value: "c = 1" },
        { label: "지금 칸", value: "a = 1 … 5" },
        { label: "읽는 자리", value: "윗 줄 a · 같은 줄 a-1" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [
        [1, 1],
        [1, 5],
      ] as [number, number][],
    },
    {
      title: "T5 둘째 줄의 a=1 — 2 원짜리를 못 쓰는 칸",
      detail: "1 < 2 라 ②. dp[2][1] = dp[1][1] = 1.",
      entries: [
        { label: "여는 동전", value: "c = 2" },
        { label: "지금 칸", value: "a = 1" },
        { label: "판정", value: "1 < 2 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[2, 1]] as [number, number][],
    },
    {
      title: "T6 둘째 줄의 a=2 — 2 원짜리가 처음 들어간다",
      detail:
        "2 ≥ 2 라 ③. dp[2][2] = dp[1][2] + dp[2][0] = 1 + 1 = 2. 1+1 과 2 두 가지다.",
      entries: [
        { label: "여는 동전", value: "c = 2" },
        { label: "지금 칸", value: "a = 2" },
        { label: "윗 줄 dp[1][2]", value: 1 },
        { label: "같은 줄 dp[2][0]", value: 1 },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, null, null, null],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[2, 2]] as [number, number][],
    },
    {
      title: "T7 둘째 줄을 끝까지 — 2 원짜리를 두 개까지 쓴다",
      detail:
        "dp[2][4] = dp[1][4] + dp[2][2] = 1 + 2 = 3. 같은 줄을 읽으므로 2 원짜리를 두 개 쓴 조합이 여기서 세어진다.",
      entries: [
        { label: "여는 동전", value: "c = 2" },
        { label: "지금 칸", value: "a = 3 … 5" },
        { label: "정한 줄", value: "1 1 2 2 3 3" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [
        [2, 4],
        [2, 5],
      ] as [number, number][],
    },
    {
      title: "T8 셋째 줄의 a=0…4 — 5 원짜리는 아직 못 들어간다",
      detail: "a < 5 인 다섯 칸이 전부 ②. 윗 줄이 그대로 옮겨진다.",
      entries: [
        { label: "여는 동전", value: "c = 5" },
        { label: "지금 칸", value: "a = 0 … 4" },
        { label: "판정", value: "a < 5 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [
        [3, 0],
        [3, 4],
      ] as [number, number][],
    },
    {
      title: "T9 셋째 줄의 a=5 — 5 원짜리 한 개짜리 조합이 더해진다",
      detail:
        "5 ≥ 5 라 ③. dp[3][5] = dp[2][5] + dp[3][0] = 3 + 1 = 4. 더해진 1 이 5 원짜리 하나로만 만든 조합이다.",
      entries: [
        { label: "여는 동전", value: "c = 5" },
        { label: "지금 칸", value: "a = 5" },
        { label: "윗 줄 dp[2][5]", value: 3 },
        { label: "같은 줄 dp[3][0]", value: 1 },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, 4],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[3, 5]] as [number, number][],
    },
    {
      title: "T10 오른쪽 아래를 읽는다",
      detail: "dp[3][5] = 4. 5 · 2+2+1 · 2+1+1+1 · 1+1+1+1+1 네 가지다.",
      entries: [
        { label: "반환값", value: 4 },
        { label: "읽는 자리", value: "dp[3][5]" },
      ],
      matrix: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, 4],
      ],
      rowLabels: ["i=0 —", "i=1 c=1", "i=2 c=2", "i=3 c=5"],
      colLabels: ["a=0", "1", "2", "3", "4", "5"],
      cells: [[3, 5]] as [number, number][],
    },
  ] satisfies Frame[],
};
