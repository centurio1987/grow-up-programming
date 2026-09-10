import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`nums = [3, 34, 4, 12, 5, 2]` ·
 * `target = 9`)을 쓴다. 프레임 수는 그 절의 T# 단계 수(11)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `keyValue` 와 `matrix` 를 함께 그린다. 표만 그리면 「지금 어느 원소를 열었고 어느 칸을
 * 정하는 중인가」가 안 보이고, 그 둘이 이 알고리즘에서 갈래를 정하는 값이다.
 *
 * 칸은 `"O"`(만들 수 있다) · `"."`(못 만든다) · `null`(아직 안 정했다) 셋이다. 본문 ascii 는
 * `null` 자리를 `.` 로 그린다 — 표를 거짓으로 깔고 시작하므로 아직 안 정한 칸의 실제 값이
 * 거짓이기 때문이고, 본문은 그 자리에 「아직 안 정했다」를 글로 붙인다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const table = {
  view: ["keyValue", "matrix"] as const,
  title: "subsetSum([3, 34, 4, 12, 5, 2], 9)",
  result: "참",
  steps: [
    {
      title: "T1 0번째 줄을 깐다",
      detail:
        "dp[i][t] = 앞의 i 개 원소만 써서 합 t 를 정확히 만들 수 있는가. 아무것도 안 고르면 합이 0 이라 첫 칸만 참이다.",
      entries: [
        { label: "여는 원소", value: "아직 없음" },
        { label: "정한 칸", value: "dp[0][0] = 참" },
        { label: "갈래", value: "①" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: "T2 첫 줄의 t=0 — 3 이 들어갈 수 없는 칸",
      detail:
        "0 < 3 이라 ②. 윗 줄의 같은 자리를 그대로 옮긴다. dp[1][0] = dp[0][0] = 참.",
      entries: [
        { label: "여는 원소", value: "a = 3" },
        { label: "지금 칸", value: "t = 0" },
        { label: "판정", value: "0 < 3 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T3·T4 첫 줄의 나머지 — 3 하나로 만들 수 있는 합은 3 뿐이다",
      detail:
        "t ≥ 3 인 칸은 ③. dp[1][3] = dp[0][3] || dp[0][0] = 거짓 || 참 = 참 이고, dp[1][9] = dp[0][9] || dp[0][6] = 거짓 이다.",
      entries: [
        { label: "여는 원소", value: "a = 3" },
        { label: "지금 칸", value: "t = 1 … 9" },
        { label: "읽는 자리", value: "윗 줄 t · 윗 줄 t-3" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [1, 3],
        [1, 9],
      ] as [number, number][],
    },
    {
      title: "T5 둘째 줄 — 34 는 열 개 칸 어디에도 못 들어간다",
      detail:
        "t = 0 … 9 가 전부 34 보다 작아 열 칸이 모두 ②. 윗 줄이 그대로 옮겨진다.",
      entries: [
        { label: "여는 원소", value: "a = 34" },
        { label: "지금 칸", value: "t = 0 … 9" },
        { label: "판정", value: "t < 34 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [2, 0],
        [2, 9],
      ] as [number, number][],
    },
    {
      title: "T6·T7 셋째 줄 — 4 가 들어오면서 합 4 와 7 이 열린다",
      detail:
        "dp[3][4] = dp[2][4] || dp[2][0] = 거짓 || 참 = 참. dp[3][7] = dp[2][7] || dp[2][3] = 거짓 || 참 = 참 이고, 그 참이 3+4 다.",
      entries: [
        { label: "여는 원소", value: "a = 4" },
        { label: "지금 칸", value: "t = 4 · t = 7" },
        { label: "윗 줄 dp[2][3]", value: "참" },
        { label: "새로 열린 합", value: "4 · 7" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [3, 4],
        [3, 7],
      ] as [number, number][],
    },
    {
      title: "T8 넷째 줄 — 12 도 목표보다 커서 줄이 그대로 옮겨진다",
      detail:
        "34 때와 같은 자리다. 목표 합보다 큰 원소는 표를 한 줄 늘리기만 한다.",
      entries: [
        { label: "여는 원소", value: "a = 12" },
        { label: "지금 칸", value: "t = 0 … 9" },
        { label: "판정", value: "t < 12 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [4, 0],
        [4, 9],
      ] as [number, number][],
    },
    {
      title: "T9 다섯째 줄 — 목표 칸이 처음 참이 된다",
      detail:
        "dp[5][9] = dp[4][9] || dp[4][4] = 거짓 || 참 = 참. 읽어 온 dp[4][4] 가 4 이고 거기에 5 를 더한 것이 4+5=9 다.",
      entries: [
        { label: "여는 원소", value: "a = 5" },
        { label: "지금 칸", value: "t = 9" },
        { label: "윗 줄 dp[4][9]", value: "거짓" },
        { label: "윗 줄 dp[4][4]", value: "참" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", "O", ".", "O", "O", "O"],
        [null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [5, 4],
        [5, 9],
      ] as [number, number][],
    },
    {
      title: "T10 여섯째 줄 — 2 가 들어와도 목표 칸은 참 그대로다",
      detail:
        "dp[6][9] = dp[5][9] || dp[5][7] = 참 || 참 = 참. 한 번 참이 된 열은 원소를 더 봐도 참에서 안 내려간다.",
      entries: [
        { label: "여는 원소", value: "a = 2" },
        { label: "지금 칸", value: "t = 2 … 9" },
        { label: "윗 줄 dp[5][9]", value: "참" },
        { label: "윗 줄 dp[5][7]", value: "참" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", "O", ".", "O", "O", "O"],
        ["O", ".", "O", "O", "O", "O", "O", "O", "O", "O"],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [
        [6, 2],
        [6, 9],
      ] as [number, number][],
    },
    {
      title: "T11 오른쪽 아래를 읽는다",
      detail:
        "dp[6][9] = 참. t=1 만 끝까지 거짓인데, 이 배열의 가장 작은 원소가 2 라 합 1 을 만들 방법이 없다.",
      entries: [
        { label: "반환값", value: "참" },
        { label: "읽는 자리", value: "dp[6][9]" },
        { label: "끝까지 거짓인 열", value: "t = 1" },
      ],
      matrix: [
        ["O", ".", ".", ".", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", ".", ".", ".", ".", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", ".", ".", "O", ".", "."],
        ["O", ".", ".", "O", "O", "O", ".", "O", "O", "O"],
        ["O", ".", "O", "O", "O", "O", "O", "O", "O", "O"],
      ],
      rowLabels: [
        "i=0 —",
        "i=1 a=3",
        "i=2 a=34",
        "i=3 a=4",
        "i=4 a=12",
        "i=5 a=5",
        "i=6 a=2",
      ],
      colLabels: ["t=0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      cells: [[6, 9]] as [number, number][],
    },
  ] satisfies Frame[],
};
