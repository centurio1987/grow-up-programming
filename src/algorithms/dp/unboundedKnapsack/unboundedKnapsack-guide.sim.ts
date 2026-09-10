import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`coins = [3, 4, 1]` ·
 * `amount = 6`)을 쓴다. 프레임 수는 그 절의 T# 단계 수(13)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `keyValue` 와 `matrix` 를 함께 그린다. 표만 그리면 「지금 어느 액면가를 열었고 두 후보가
 * 각각 얼마인가」가 안 보이고, 그 둘이 이 알고리즘에서 갈래를 정하는 값이다. 특히 「이번 줄에서
 * 읽은 값」과 「윗 줄에서 읽은 값」을 나란히 적어 두는 자리가 `keyValue` 다.
 *
 * 칸은 최소 동전 개수를 적은 `"0"`~`"2"`, 못 만드는 칸 `"∞"`, 아직 안 정한 칸 `null` 이다.
 * 본문 ascii 는 `null` 자리를 `.` 로 그린다 — 표를 `Infinity` 로 깔고 시작하므로 아직 안 정한
 * 칸의 실제 값이 `∞` 인데, 정해진 `∞` 와 구분하려고 본문이 그 자리에 다른 글자를 쓴다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const table = {
  view: ["keyValue", "matrix"] as const,
  title: "unboundedKnapsack([3, 4, 1], 6)",
  result: "2",
  steps: [
    {
      title: "T1 표를 깔고 첫 칸을 0 으로 둔다",
      detail:
        "dp[i][a] = 앞의 i 종류를 몇 개든 써서 금액 a 를 만드는 최소 동전 개수. 금액 0 은 동전 0 개로 만든다.",
      entries: [
        { label: "여는 액면가", value: "아직 없음" },
        { label: "정한 칸", value: "dp[0][0] = 0" },
        { label: "갈래", value: "①" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: "T2 첫 줄의 a=0…2 — 3 이 들어갈 수 없는 칸",
      detail:
        "세 칸이 전부 3 보다 작아 ②. 윗 줄의 같은 자리를 그대로 옮긴다. dp[1][0] = dp[0][0] = 0 이고 나머지 둘은 ∞ 다.",
      entries: [
        { label: "여는 액면가", value: "c = 3" },
        { label: "지금 칸", value: "a = 0 … 2" },
        { label: "판정", value: "a < 3 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T3 첫 줄의 a=3 — 3 을 한 개 쓴다",
      detail:
        "안 쓰면 dp[0][3] = ∞ 이고, 쓰면 이번 줄의 dp[1][0] = 0 에 한 개를 더해 1 이다. 작은 쪽이 ④.",
      entries: [
        { label: "여는 액면가", value: "c = 3" },
        { label: "지금 칸", value: "a = 3" },
        { label: "안 쓴다 — 윗 줄 dp[0][3]", value: "∞" },
        { label: "한 개 더 — 이번 줄 dp[1][0] + 1", value: "1" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [[1, 3]] as [number, number][],
    },
    {
      title: "T4·T5 첫 줄의 a=4…6 — 방금 정한 칸을 다시 읽는다",
      detail:
        "dp[1][6] 은 이번 줄의 dp[1][3] = 1 에 한 개를 더해 2 다. 방금 3 을 한 개 쓴 칸을 다시 읽었으므로 3 을 두 개 쓴 것이다. a=4·5 는 두 후보가 다 ∞ 라 ③.",
      entries: [
        { label: "여는 액면가", value: "c = 3" },
        { label: "지금 칸", value: "a = 4 · 5 · 6" },
        { label: "안 쓴다 — 윗 줄 dp[0][6]", value: "∞" },
        { label: "한 개 더 — 이번 줄 dp[1][3] + 1", value: "2" },
        { label: "갈래", value: "③ · ④" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [
        [1, 4],
        [1, 5],
        [1, 6],
      ] as [number, number][],
    },
    {
      title: "T6 둘째 줄의 a=0…3 — 4 는 아직 못 들어간다",
      detail: "네 칸이 전부 4 보다 작아 ②. 윗 줄이 그대로 옮겨진다.",
      entries: [
        { label: "여는 액면가", value: "c = 4" },
        { label: "지금 칸", value: "a = 0 … 3" },
        { label: "판정", value: "a < 4 참" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", null, null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [
        [2, 0],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T7 둘째 줄의 a=4 — 4 를 한 개 쓴다",
      detail:
        "안 쓰면 dp[1][4] = ∞ 이고, 쓰면 이번 줄의 dp[2][0] = 0 에 한 개를 더해 1 이다.",
      entries: [
        { label: "여는 액면가", value: "c = 4" },
        { label: "지금 칸", value: "a = 4" },
        { label: "안 쓴다 — 윗 줄 dp[1][4]", value: "∞" },
        { label: "한 개 더 — 이번 줄 dp[2][0] + 1", value: "1" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", "1", null, null],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [[2, 4]] as [number, number][],
    },
    {
      title: "T8 둘째 줄의 a=5·6 — 4 를 쓰지 않는 쪽이 작다",
      detail:
        "안 쓰면 윗 줄의 dp[1][6] = 2 이고, 쓰면 이번 줄의 dp[2][2] = ∞ 에 한 개를 더한 값이다. 작은 쪽이 2 라 ③ 이고, 그 2 가 3+3 이다.",
      entries: [
        { label: "여는 액면가", value: "c = 4" },
        { label: "지금 칸", value: "a = 5 · 6" },
        { label: "안 쓴다 — 윗 줄 dp[1][6]", value: "2" },
        { label: "한 개 더 — 이번 줄 dp[2][2] + 1", value: "∞" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", "1", "∞", "2"],
        [null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [
        [2, 5],
        [2, 6],
      ] as [number, number][],
    },
    {
      title: "T9·T10 셋째 줄의 a=0…2 — 1 이 들어와 ∞ 가 사라진다",
      detail:
        "dp[3][1] 은 이번 줄의 dp[3][0] = 0 에 한 개를 더해 1 이고, dp[3][2] 는 방금 정한 dp[3][1] = 1 에 한 개를 더해 2 다.",
      entries: [
        { label: "여는 액면가", value: "c = 1" },
        { label: "지금 칸", value: "a = 1 · 2" },
        { label: "안 쓴다 — 윗 줄 dp[2][1]", value: "∞" },
        { label: "한 개 더 — 이번 줄 dp[3][0] + 1", value: "1" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", "1", "∞", "2"],
        ["0", "1", "2", null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [
        [3, 1],
        [3, 2],
      ] as [number, number][],
    },
    {
      title: "T11·T12 셋째 줄의 a=3…5 — 윗 줄이 작으면 윗 줄을 쓴다",
      detail:
        "dp[3][3]·dp[3][4] 는 윗 줄의 1 이 이번 줄 후보보다 작아 ③ 이고, dp[3][5] 는 이번 줄의 dp[3][4] = 1 에 한 개를 더한 2 라 ④ 다.",
      entries: [
        { label: "여는 액면가", value: "c = 1" },
        { label: "지금 칸", value: "a = 3 … 5" },
        { label: "안 쓴다 — 윗 줄 dp[2][3]", value: "1" },
        { label: "한 개 더 — 이번 줄 dp[3][2] + 1", value: "3" },
        { label: "갈래", value: "③ · ④" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", "1", "∞", "2"],
        ["0", "1", "2", "1", "1", "2", null],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [
        [3, 3],
        [3, 4],
        [3, 5],
      ] as [number, number][],
    },
    {
      title: "T13 마지막 칸을 정하고 읽는다",
      detail:
        "dp[3][6] 은 윗 줄의 2 와 이번 줄의 dp[3][5] + 1 = 3 중 작은 2 다. 유한한 값이라 그대로 돌려준다. ∞ 로 남았으면 -1 이 된다.",
      entries: [
        { label: "반환값", value: "2" },
        { label: "안 쓴다 — 윗 줄 dp[2][6]", value: "2" },
        { label: "읽는 자리", value: "dp[3][6]" },
        { label: "그 2 가 뜻하는 것", value: "3 + 3" },
      ],
      matrix: [
        ["0", "∞", "∞", "∞", "∞", "∞", "∞"],
        ["0", "∞", "∞", "1", "∞", "∞", "2"],
        ["0", "∞", "∞", "1", "1", "∞", "2"],
        ["0", "1", "2", "1", "1", "2", "2"],
      ],
      rowLabels: ["i=0 —", "i=1 c=3", "i=2 c=4", "i=3 c=1"],
      colLabels: ["a=0", "1", "2", "3", "4", "5", "6"],
      cells: [[3, 6]] as [number, number][],
    },
  ] satisfies Frame[],
};
