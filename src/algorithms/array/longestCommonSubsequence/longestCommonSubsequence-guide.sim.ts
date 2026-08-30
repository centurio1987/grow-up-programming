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
 * 이 알고리즘의 상태는 표 하나가 전부다. `knapsack01-guide.sim.ts` 가 세운 선례를 그대로
 * 따른다 — 배열 패널을 덧붙이면 같은 값을 두 번 보이게 된다.
 *
 * 1. **`matrix` 의 `null` 은 아직 안 채운 칸이다.** 0 번째 줄과 0 번째 열은 첫 프레임에서
 *    이미 값이 있다 — 계산 결과가 아니라 정의에서 바로 나온 0 이기 때문이다.
 * 2. **`rowLabels` 는 `i` 와 그 줄에서 새로 들어온 `s` 의 글자**, `colLabels` 는 `j` 와 그
 *    열에서 새로 들어온 `t` 의 글자다. 본문 기호표의 `i`·`j` 와 글자 그대로 같다.
 * 3. **`cells` 는 그 프레임에서 새로 정해진 칸**이다. 줄 하나가 한 프레임이라 세 칸씩이고,
 *    마지막 프레임만 답을 읽는 칸 하나다.
 */
export const lcsTable = {
  view: ["matrix"] as const,
  title: 'longestCommonSubsequence("abcde", "ace")',
  result: "3",
  steps: [
    {
      title: "T1 표를 깐다",
      detail:
        "dp[i][j] = s 의 앞 i 글자와 t 의 앞 j 글자의 최장 공통 부분 수열 길이. 0 번째 줄과 0 번째 열은 한쪽이 빈 문자열이라 전부 0 이다.",
      matrix: [
        [0, 0, 0, 0],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
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
      title: "T2 첫째 줄 — s 의 'a'",
      detail:
        "j=1 은 ③ ('a' = 'a') 이라 대각선 0 에 1 을 더해 1. j=2·j=3 은 ④ 라 윗칸 0 과 왼쪽 칸 1 중 큰 1 을 이어받는다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [
        [1, 1],
        [1, 2],
        [1, 3],
      ] as [number, number][],
    },
    {
      title: "T3 둘째 줄 — s 의 'b'",
      detail:
        "'b' 는 t 의 어느 글자와도 다르다. 세 칸 모두 ④ 이고, 윗줄의 값이 그대로 내려온다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [
        [2, 1],
        [2, 2],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T4 셋째 줄 — s 의 'c'",
      detail:
        "j=2 에서 ③ ('c' = 'c') 이 두 번째로 나온다. 대각선 dp[2][1] = 1 에 1 을 더해 2 이고, 그 2 가 오른쪽으로 이어진다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, null, null, null],
        [0, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [
        [3, 1],
        [3, 2],
        [3, 3],
      ] as [number, number][],
    },
    {
      title: "T5 넷째 줄 — s 의 'd'",
      detail:
        "'d' 도 t 에 없다. 세 칸 모두 ④ 이고 윗줄이 그대로 내려온다 — 얻은 2 가 사라지지 않는다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, null, null, null],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [
        [4, 1],
        [4, 2],
        [4, 3],
      ] as [number, number][],
    },
    {
      title: "T6 다섯째 줄 — s 의 'e'",
      detail:
        "j=3 에서 ③ ('e' = 'e') 이 세 번째로 나온다. 대각선 dp[4][2] = 2 에 1 을 더해 3 이다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, 2, 3],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [
        [5, 1],
        [5, 2],
        [5, 3],
      ] as [number, number][],
    },
    {
      title: "T7 오른쪽 아래를 읽는다",
      detail:
        "dp[5][3] = 3. 공통 부분 수열 'ace' 의 길이이고, s 에서는 0·2·4 번, t 에서는 0·1·2 번 자리다.",
      matrix: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, 2, 3],
      ],
      rowLabels: ["i=0 ∅", "i=1 a", "i=2 b", "i=3 c", "i=4 d", "i=5 e"],
      colLabels: ["j=0 ∅", "j=1 a", "j=2 c", "j=3 e"],
      cells: [[5, 3]] as [number, number][],
    },
  ] satisfies Frame[],
};
