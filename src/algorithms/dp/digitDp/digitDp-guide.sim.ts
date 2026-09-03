import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`N = 194` · `K = 10`)을 쓴다.
 * 프레임 수(12)가 그 절의 T# 단계 수(12)와 같다 — P3 이 그 관계를 잰다.
 * **T# 하나에 프레임 하나를 둔다.** 본문이 특정 걸음을 이름으로 짚는 자리가 있어서
 * (「T5 와 T10 이 같은 칸을 쓰고 읽는다」) 프레임을 묶으면 그 걸음을 화면에서 찾을 수 없다.
 *
 * `keyValue` 와 `matrix` 조합은 `palindromePartitioningMinCut` 이 표 둘을 쓰는 쪽에서 세워
 * 뒀는데, **이 편은 표가 하나이고 그 표 밖에 상태가 하나 더 있다**(`tight`). 갈라야 했던
 * 자리 셋을 적어 둔다.
 *
 * 1. **`matrix` 가 `memo` 를, `keyValue` 가 `tight` 를 진다.** `tight` 는 표의 첨자가 아니라
 *    표를 쓸지 말지를 정하는 값이라, 행이나 열로 그리면 「칸이 두 겹」으로 읽힌다. 지금
 *    자리·지금 합·지금 tight 를 `entries` 한 줄씩으로 둔다.
 * 2. **칸 상태가 셋이라 표기도 셋이다.** `"-"`(그 자리에 그 합으로 올 수 없다) ·
 *    `null`(올 수는 있는데 아직 안 정했다) · 숫자(정했다)다. `MatrixView` 가 `null` 을 빈
 *    칸으로 그리므로(`src/_guide-sim/index.tsx:344`) 올 수 없는 칸을 `null` 로 두면 두 상태가
 *    화면에서 같아진다. `memo[0][1…10]` 과 `memo[1][10]` 이 `"-"` 인 자리다.
 * 3. **끝까지 `null` 로 남는 칸이 셋 있다.** `memo[0][0]` 과 `memo[2][10]` 은 tight 상태라
 *    적지 않고, `memo[2][0]` 은 갈래 ① 로 돌려주어 적지 않는다. 그 셋이 「정본이 표를 자유
 *    상태에만 쓴다」를 화면에서 말한다.
 *
 * `rowLabels`·`colLabels` 는 본문 ascii 의 머리줄과 글자 그대로 같다 — 그 그림은
 * `.proof.ts` 의 `walkTable` 이 실행해서 만든다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const memo = {
  view: ["keyValue", "matrix"] as const,
  title: "digitDp(194, 10)",
  result: "19",
  steps: [
    {
      title: "T1 N 을 자릿수로 가르고 표를 깐다",
      detail:
        "digits = [1, 9, 4] 이고 L = 3 이다. memo[pos][sum] 은 tight 가 아닌 상태로 자리 pos 에 왔을 때의 답을 적는 칸이고, 아직 하나도 안 정했다. 그 자리에 그 합으로 올 수 없는 칸은 - 로 둔다.",
      entries: [
        { label: "digits", value: "[1, 9, 4]" },
        { label: "L", value: "3" },
        { label: "K", value: "10" },
        { label: "표 크기", value: "3 × 11" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [] as [number, number][],
    },
    {
      title: "T2 맨 왼쪽 자리 — 상한이 1 이라 고를 숫자가 둘뿐이다",
      detail:
        "tight 로 시작하므로 이번 자리의 상한은 digits[0] = 1 이다. 먼저 x = 0 을 고른다. 0 은 1 보다 작으므로 여기서 tight 가 풀리고, 남은 두 자리는 0~9 를 마음대로 쓸 수 있다.",
      entries: [
        { label: "자리 pos", value: "0" },
        { label: "합 sum", value: "0" },
        { label: "tight", value: "참 — 상한은 digits[0] = 1" },
        { label: "고른 숫자", value: "x = 0" },
        { label: "다음 tight", value: "거짓 (0 < 1)" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: "T3 가운데 자리에 자유 상태로 왔다 — 상한이 9 다",
      detail:
        "memo[1][0] 은 아직 -1 이라 표에서 읽을 것이 없다. x 를 0 부터 9 까지 차례로 놓아 보면서 각각의 결과를 더한다. 첫 x = 0 을 놓고 아래 자리로 내려간다.",
      entries: [
        { label: "자리 pos", value: "1" },
        { label: "합 sum", value: "0" },
        { label: "tight", value: "거짓 — 상한은 9" },
        { label: "표 읽기", value: "memo[1][0] = 아직 안 정함" },
        { label: "고른 숫자", value: "x = 0" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T4 갈래 ① — 남은 자리 하나로는 합 10 을 만들 수 없다",
      detail:
        "마지막 자리 하나에 9 를 넣어도 0 + 9 = 9 라 10 에 못 미친다. 0 을 돌려주고 그대로 나온다. 갈래 ① 은 표를 거치기 전에 있으므로 memo[2][0] 은 안 정한 채로 남는다.",
      entries: [
        { label: "자리 pos", value: "2" },
        { label: "합 sum", value: "0" },
        { label: "갈래", value: "① 0 + 9×1 < 10" },
        { label: "돌려준 값", value: "0" },
        { label: "표에 적었는가", value: "아니다" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, null, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[2, 0]] as [number, number][],
    },
    {
      title: "T5 갈래 ⑤ — 마지막 자리에서 한 칸이 정해진다",
      detail:
        "합이 1 인 채로 마지막 자리에 왔다. x = 9 를 놓으면 합이 10 이 되어 갈래 ② 가 1 을 돌려주고, 나머지 x 는 0 을 돌려준다. 더한 값 1 을 memo[2][1] 에 적는다.",
      entries: [
        { label: "자리 pos", value: "2" },
        { label: "합 sum", value: "1" },
        { label: "놓아 본 숫자", value: "0 1 2 3 4 5 6 7 8 9" },
        { label: "합이 10 이 되는 숫자", value: "x = 9" },
        { label: "갈래", value: "⑤ memo[2][1] = 1" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, null, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[2, 1]] as [number, number][],
    },
    {
      title: "T6 갈래 ④ — 합이 K 를 넘는 자리에서 반복을 멈춘다",
      detail:
        "합이 2 인 채로 왔다. x = 8 에서 합이 10 이 되고, x = 9 는 합이 11 이라 K 를 넘는다. x 가 더 커지면 더 넘으므로 거기서 반복을 끊는다 — 갈래 ④ 다.",
      entries: [
        { label: "자리 pos", value: "2" },
        { label: "합 sum", value: "2" },
        { label: "놓아 본 숫자", value: "0 1 2 3 4 5 6 7 8" },
        { label: "멈춘 자리", value: "x = 9 · 2 + 9 = 11 > 10" },
        { label: "갈래", value: "④ 그리고 ⑤ memo[2][2] = 1" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[2, 2]] as [number, number][],
    },
    {
      title: "T7 같은 모양으로 일곱 칸이 더 정해진다",
      detail:
        "합이 3 부터 9 까지인 칸도 같다. 합을 10 으로 만드는 숫자가 7, 6, 5, 4, 3, 2, 1 로 하나씩이라 값이 전부 1 이다. 마지막 자리 줄에서 값이 1 인 칸이 아홉 개가 됐다.",
      entries: [
        { label: "자리 pos", value: "2" },
        { label: "합 sum", value: "3 … 9" },
        { label: "정한 칸", value: "memo[2][3] … memo[2][9]" },
        { label: "값", value: "전부 1" },
        { label: "이 줄에서 정한 칸", value: "아홉 개" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [null, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [
        [2, 3],
        [2, 4],
        [2, 5],
        [2, 6],
        [2, 7],
        [2, 8],
        [2, 9],
      ] as [number, number][],
    },
    {
      title: "T8 가운데 자리의 칸이 정해진다 — 아홉 갈래의 합이다",
      detail:
        "x = 0 은 0 을 냈고 x = 1 부터 9 까지가 각각 1 을 냈다. 더하면 9 다. memo[1][0] = 9 를 적는다 — 이 값이 「맨 앞이 0 이고 뒤 두 자리의 합이 10 인 수」의 개수이고, 곧 두 자리 수 19, 28, …, 91 의 개수다.",
      entries: [
        { label: "자리 pos", value: "1" },
        { label: "합 sum", value: "0" },
        {
          label: "각 x 의 결과",
          value: "0 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 1",
        },
        { label: "갈래", value: "⑤ memo[1][0] = 9" },
        { label: "무엇을 센 값인가", value: "19 28 37 46 55 64 73 82 91" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [9, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[1, 0]] as [number, number][],
    },
    {
      title: "T9 맨 왼쪽 자리로 돌아와 x = 1 을 고른다 — tight 가 남는다",
      detail:
        "x = 1 은 digits[0] 과 같다. 여기까지 고른 숫자가 N 의 앞부분과 그대로 같으므로 tight 가 참인 채로 다음 자리에 간다. 표를 읽지도 쓰지도 않는 경로다.",
      entries: [
        { label: "자리 pos", value: "0" },
        { label: "고른 숫자", value: "x = 1 = digits[0]" },
        { label: "다음 tight", value: "참" },
        { label: "다음 상태", value: "pos=1 · sum=1 · tight" },
        { label: "표", value: "읽지도 쓰지도 않는다" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [9, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: "T10 갈래 ③ — 표를 아홉 번 읽는다",
      detail:
        "tight 인 채로 가운데 자리에 왔고 상한이 digits[1] = 9 다. x 를 0 부터 8 까지 놓으면 그 자리에서 N 보다 작아져 tight 가 풀리고, 마지막 자리의 상태가 sum = 1 … 9 로 T5~T7 이 이미 정해 둔 칸과 같아진다. 아홉 번 다 표에서 1 을 그대로 읽는다.",
      entries: [
        { label: "자리 pos", value: "1" },
        { label: "합 sum", value: "1" },
        { label: "tight", value: "참 — 상한은 digits[1] = 9" },
        { label: "놓은 숫자", value: "x = 0 … 8" },
        { label: "갈래", value: "③ 표를 9 번 읽는다" },
        { label: "읽은 값", value: "전부 1" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [9, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [
        [2, 1],
        [2, 2],
        [2, 3],
        [2, 4],
        [2, 5],
        [2, 6],
        [2, 7],
        [2, 8],
        [2, 9],
      ] as [number, number][],
    },
    {
      title: "T11 tight 를 끝까지 유지한 경로 — 상한이 4 로 좁아진다",
      detail:
        "가운데 자리에 x = 9 를 놓으면 tight 가 남아 마지막 자리의 상한이 digits[2] = 4 가 된다. 합이 10 인 채로 왔으니 x = 0 에서 이미 합이 10 이고, x = 1 은 11 이라 갈래 ④ 로 멈춘다. 수 190 하나를 센 자리다.",
      entries: [
        { label: "자리 pos", value: "2" },
        { label: "합 sum", value: "10" },
        { label: "tight", value: "참 — 상한은 digits[2] = 4" },
        { label: "놓은 숫자", value: "x = 0" },
        { label: "멈춘 자리", value: "x = 1 · 10 + 1 = 11 > 10" },
        { label: "센 수", value: "190" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [9, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[2, 10]] as [number, number][],
    },
    {
      title: "T12 두 갈래를 더해 답을 낸다",
      detail:
        "맨 왼쪽 자리의 x = 0 쪽이 9 를 냈고 x = 1 쪽이 10 을 냈다. 더하면 19 다. K 가 0 이 아니므로 수 0 을 빼는 자리는 실행되지 않는다. 표에 실제로 적힌 칸은 열 개뿐이다.",
      entries: [
        { label: "x = 0 쪽", value: "9 — 두 자리 수" },
        { label: "x = 1 쪽", value: "10 — 100 부터 194 까지" },
        { label: "합", value: "19" },
        { label: "K = 0 인가", value: "아니다 — 빼지 않는다" },
        { label: "표에 적은 칸", value: "10 개" },
        { label: "답", value: "19" },
      ],
      matrix: [
        [null, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
        [9, null, null, null, null, null, null, null, null, null, "-"],
        [null, 1, 1, 1, 1, 1, 1, 1, 1, 1, null],
      ],
      rowLabels: ["pos=0", "pos=1", "pos=2"],
      colLabels: [
        "s=0",
        "s=1",
        "s=2",
        "s=3",
        "s=4",
        "s=5",
        "s=6",
        "s=7",
        "s=8",
        "s=9",
        "s=10",
      ],
      cells: [[0, 0]] as [number, number][],
    },
  ] satisfies Frame[],
};
