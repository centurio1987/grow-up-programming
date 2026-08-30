import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(7)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `matrix` 단독으로 그린다
 *
 * 이 알고리즘의 상태는 표 하나가 전부다. 배열 패널을 덧붙이면 같은 값을 두 번 보이게 된다.
 *
 * 1. **`matrix` 의 `null` 은 아직 안 채운 칸이다.** 첫 줄과 첫 열은 첫 프레임에서 이미 값이
 *    있다 — 한쪽이 빈 문자열이라 계산 없이 정의에서 나오는 값이기 때문이다.
 * 2. **`rowLabels` 는 `i` 와 그 줄에서 새로 들어온 `s` 의 글자**, `colLabels` 는 `j` 와 그
 *    열에서 새로 들어온 `t` 의 글자다. 본문 기호표의 `i`·`j` 와 글자 그대로 같다.
 * 3. **`cells` 는 그 프레임에서 새로 정해진 칸**이다. 줄 하나가 한 프레임이라 세 칸씩이고,
 *    마지막 프레임만 답을 읽는 칸 하나다.
 */
export const editTable = {
  view: ["matrix"] as const,
  title: 'editDistance("horse", "ros")',
  result: "3",
  steps: [
    {
      title: "T1 표를 깔고 테두리를 채운다",
      detail:
        "dp[i][j] = s 의 앞 i 글자를 t 의 앞 j 글자로 바꾸는 최소 편집 횟수. 첫 열은 t 가 비어 있어 i 번 지우는 비용, 첫 줄은 s 가 비어 있어 j 번 넣는 비용이다.",
      matrix: [
        [0, 1, 2, 3],
        [1, null, null, null],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
      ] as [number, number][],
    },
    {
      title: "T2 첫째 줄 — s 의 'h'",
      detail:
        "세 칸 모두 ⑤ 다. j=1 은 교체가 혼자 가장 작아 대각선 0 에 1 을 더해 1, 나머지 둘은 왼쪽과 대각선이 함께 가장 작아 2 와 3 이 된다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [1, 1],
        [1, 2],
        [1, 3],
      ] as [number, number][],
    },
    {
      title: "T3 둘째 줄 — s 의 'o'",
      detail:
        "j=2 에서 'o' 가 같아 ④ 다. 대각선 dp[1][1] = 1 을 편집 없이 그대로 받는다. j=3 은 삽입이 혼자 가장 작아 왼쪽 1 에 1 을 더해 2 다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [2, 1],
        [2, 2],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T4 셋째 줄 — s 의 'r'",
      detail:
        "j=1 에서 'r' 이 같아 ④ 다. 대각선 dp[2][0] = 2 를 그대로 받는다. j=2 는 삭제가, j=3 은 교체가 혼자 가장 작다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, null, null, null],
        [5, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [3, 1],
        [3, 2],
        [3, 3],
      ] as [number, number][],
    },
    {
      title: "T5 넷째 줄 — s 의 's'",
      detail:
        "j=3 에서 's' 가 같아 ④ 다. 대각선 dp[3][2] = 2 를 그대로 받는다. 이 줄에서 윗줄보다 값이 안 커진 칸은 여기 하나다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [4, 1],
        [4, 2],
        [4, 3],
      ] as [number, number][],
    },
    {
      title: "T6 다섯째 줄 — s 의 'e'",
      detail:
        "'e' 는 t 의 어느 글자와도 다르다. 세 칸 모두 ⑤ 이고, j=3 은 삭제가 혼자 가장 작아 윗칸 2 에 1 을 더해 3 이다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, 4, 3],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [
        [5, 1],
        [5, 2],
        [5, 3],
      ] as [number, number][],
    },
    {
      title: "T7 오른쪽 아래를 읽는다",
      detail:
        "dp[5][3] = 3. h 를 r 로 바꾸고 r 을 지우고 e 를 지운 세 번이 그 값이다.",
      matrix: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, 4, 3],
      ],
      rowLabels: ["i=0 ∅", "i=1 h", "i=2 o", "i=3 r", "i=4 s", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 r", "j=2 o", "j=3 s"],
      cells: [[5, 3]] as [number, number][],
    },
  ] satisfies Frame[],
};
