import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — 크기가
 * `[1, 3, 5, 2]` 인 파일 넷을 하나로 합친다. 프레임 수(8)가 그 절의 T# 단계 수(8)와 같다 —
 * P3 이 그 관계를 잰다. **T# 하나에 프레임 하나를 둔다.** 본문이 특정 걸음을 이름으로 짚는
 * 자리가 있어서(「T5 가 확정한 13 을 T7 이 후보에서 뺀다」) 프레임을 묶으면 그 걸음을
 * 화면에서 찾을 수 없다.
 *
 * `matrix` 와 `keyValue` 조합을 고른 이유를 적어 둔다.
 *
 * 1. **`matrix` 가 `dp` 표를, `keyValue` 가 지금 하는 일을 진다.** `dp` 는 행이 구간의 시작
 *    `i` 이고 열이 구간의 끝 `j` 라 그대로 격자다. 지금 어느 칸을 확정하는지 · 후보 범위가
 *    어디까지인지 · 최적 분할점이 얼마인지는 격자의 칸이 아니라 그 옆의 상태라 `entries`
 *    한 줄씩으로 둔다.
 * 2. **하삼각 칸을 빈 칸으로 적지 않는다.** `i > j` 는 문제가 정의하지 않는 자리라 `"."` 로
 *    적고, 아직 확정하지 않은 상삼각 칸은 `null` 로 둔다. 본문 증명 블록의 표기와 같다.
 * 3. **반환 걸음도 프레임 하나다.** 값이 안 바뀌는 걸음이지만 그 자리가 「맨 위 오른쪽 칸이
 *    답이다」를 뜻하고, 강조를 그 칸에 두어 보인다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const knuthWalk = {
  view: ["keyValue", "matrix"] as const,
  title: "파일 넷을 여덟 걸음으로 합친다",
  result: "22",
  steps: [
    {
      title: "T1 구간 합과 기저를 준비한다",
      detail:
        "prefix = [0, 1, 4, 9, 11] 을 만들어 S(i, j) 를 한 번에 얻게 해 둔다. 길이 1 구간은 합칠 것이 없어 dp = 0 이고 최적 분할점이 자기 번호다.",
      entries: [
        { label: "입력", value: "freq = [1, 3, 5, 2]" },
        { label: "구간 합", value: "prefix = [0, 1, 4, 9, 11]" },
        {
          label: "확정한 칸",
          value: "dp(0,0) · dp(1,1) · dp(2,2) · dp(3,3) = 0",
        },
        { label: "후보 검사", value: "0 — 검사할 분할점이 없다" },
      ],
      matrix: [
        [0, null, null, null],
        [".", 0, null, null],
        [".", ".", 0, null],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ] as [number, number][],
    },
    {
      title: "T2 길이 2 구간 [0, 1]",
      detail:
        "하한은 opt(0, 0) = 0 이고 상한은 opt(1, 1) = 1 을 j-1 = 0 으로 자른 값이다. 후보가 k = 0 하나뿐이고 dp(0,0) + dp(1,1) = 0 이라 S(0, 1) = 4 를 더해 4 가 된다.",
      entries: [
        { label: "구간", value: "[0, 1]" },
        { label: "S(0, 1)", value: 4 },
        { label: "후보 범위", value: "[0, 0] — 상한 1 을 j-1 로 잘랐다" },
        { label: "후보 값", value: "k=0: 0" },
        { label: "확정한 값", value: "dp(0, 1) = 4" },
        { label: "opt(0, 1)", value: 0 },
      ],
      matrix: [
        [0, 4, null, null],
        [".", 0, null, null],
        [".", ".", 0, null],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[0, 1]] as [number, number][],
    },
    {
      title: "T3 길이 2 구간 [1, 2]",
      detail:
        "같은 모양이다. 후보가 k = 1 하나뿐이고 S(1, 2) = 3 + 5 = 8 이 그대로 값이 된다.",
      entries: [
        { label: "구간", value: "[1, 2]" },
        { label: "S(1, 2)", value: 8 },
        { label: "후보 범위", value: "[1, 1]" },
        { label: "후보 값", value: "k=1: 0" },
        { label: "확정한 값", value: "dp(1, 2) = 8" },
        { label: "opt(1, 2)", value: 1 },
      ],
      matrix: [
        [0, 4, null, null],
        [".", 0, 8, null],
        [".", ".", 0, null],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[1, 2]] as [number, number][],
    },
    {
      title: "T4 길이 2 구간 [2, 3]",
      detail:
        "길이 2 의 마지막 칸이다. S(2, 3) = 5 + 2 = 7 이고, 이 걸음까지 오면 길이 2 대각선이 다 찬다.",
      entries: [
        { label: "구간", value: "[2, 3]" },
        { label: "S(2, 3)", value: 7 },
        { label: "후보 범위", value: "[2, 2]" },
        { label: "후보 값", value: "k=2: 0" },
        { label: "확정한 값", value: "dp(2, 3) = 7" },
        { label: "opt(2, 3)", value: 2 },
      ],
      matrix: [
        [0, 4, null, null],
        [".", 0, 8, null],
        [".", ".", 0, 7],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[2, 3]] as [number, number][],
    },
    {
      title: "T5 길이 3 구간 [0, 2]",
      detail:
        "하한이 opt(0, 1) = 0 이고 상한이 opt(1, 2) = 1 이다. k=0: dp(0,0) + dp(1,2) = 8, k=1: dp(0,1) + dp(2,2) = 4. 최솟값 4 에 S(0, 2) = 9 를 더해 13 이다.",
      entries: [
        { label: "구간", value: "[0, 2]" },
        { label: "S(0, 2)", value: 9 },
        { label: "후보 범위", value: "[0, 1]" },
        { label: "후보 값", value: "k=0: 8 · k=1: 4" },
        { label: "확정한 값", value: "dp(0, 2) = 13" },
        { label: "opt(0, 2)", value: 1 },
      ],
      matrix: [
        [0, 4, 13, null],
        [".", 0, 8, null],
        [".", ".", 0, 7],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[0, 2]] as [number, number][],
    },
    {
      title: "T6 길이 3 구간 [1, 3]",
      detail:
        "하한이 opt(1, 2) = 1 이고 상한이 opt(2, 3) = 2 다. k=1: dp(1,1) + dp(2,3) = 7, k=2: dp(1,2) + dp(3,3) = 8. 최솟값 7 에 S(1, 3) = 10 을 더해 17 이다.",
      entries: [
        { label: "구간", value: "[1, 3]" },
        { label: "S(1, 3)", value: 10 },
        { label: "후보 범위", value: "[1, 2]" },
        { label: "후보 값", value: "k=1: 7 · k=2: 8" },
        { label: "확정한 값", value: "dp(1, 3) = 17" },
        { label: "opt(1, 3)", value: 1 },
      ],
      matrix: [
        [0, 4, 13, null],
        [".", 0, 8, 17],
        [".", ".", 0, 7],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[1, 3]] as [number, number][],
    },
    {
      title: "T7 범위가 한 자리로 좁아진 칸 [0, 3]",
      detail:
        "하한이 opt(0, 2) = 1 이고 상한도 opt(1, 3) = 1 이다. 후보 셋 중 k = 1 하나만 검사한다: dp(0,1) + dp(2,3) = 4 + 7 = 11. 여기에 S(0, 3) = 11 을 더해 22 다.",
      entries: [
        { label: "구간", value: "[0, 3]" },
        { label: "S(0, 3)", value: 11 },
        { label: "후보 범위", value: "[1, 1] — 하한과 상한이 같은 자리다" },
        { label: "후보 값", value: "k=1: 11" },
        { label: "검사하지 않은 후보", value: "k=0 · k=2" },
        { label: "확정한 값", value: "dp(0, 3) = 22" },
        { label: "opt(0, 3)", value: 1 },
      ],
      matrix: [
        [0, 4, 13, 22],
        [".", 0, 8, 17],
        [".", ".", 0, 7],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[0, 3]] as [number, number][],
    },
    {
      title: "T8 맨 위 오른쪽 칸을 반환한다",
      detail:
        "dp(0, 3) = 22 가 답이다. 병합 순서는 (1+3)=4 · (5+2)=7 · (4+7)=11 이고 비용이 4 + 7 + 11 = 22 다.",
      entries: [
        { label: "반환값", value: 22 },
        { label: "병합 순서", value: "(1+3) → (5+2) → (4+7)" },
        { label: "비용", value: "4 + 7 + 11 = 22" },
        { label: "후보 검사", value: "8 번 — 전부 검사하면 10 번" },
      ],
      matrix: [
        [0, 4, 13, 22],
        [".", 0, 8, 17],
        [".", ".", 0, 7],
        [".", ".", ".", 0],
      ],
      rowLabels: ["i=0", "i=1", "i=2", "i=3"],
      colLabels: ["j=0", "j=1", "j=2", "j=3"],
      cells: [[0, 3]] as [number, number][],
    },
  ] satisfies Frame[],
};
