import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`matrixPowerFibonacci(10n)`)을
 * 쓴다. 프레임 수는 그 절의 T# 단계 수(7)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독을 고른 이유
 *
 * ① 입력이 정수 하나뿐이라 그릴 배열이 없고 ② 걸음마다 바뀌는 것이 2×2 행렬 둘과 정수
 * 하나뿐이다. `matrix` 프리셋은 **한 뷰에 표 하나**만 담으므로 행렬 둘을 나란히 놓지
 * 못하는데, 이 절차의 요점이 「누적 행렬과 자리 행렬이 각각 무엇의 거듭제곱인가」라서
 * 둘을 한 화면에 두는 것이 먼저다. 네 칸을 한 줄 문자열로 적으면 그 요구가 채워진다.
 *
 * 항목을 프레임마다 같은 것으로 같은 순서로 두고 값만 바꾼다. 값이 없는 자리도 항목을
 * 빼지 않고 `—` 로 적는다 — 하나가 빠지면 아래가 한 칸씩 올라가 독자가 자리를 다시 센다.
 * 항목 순서는 「지금 실행하는 갈래 → 그 갈래가 보는 값 → 상태 → 답」이고, `label` 은 본문
 * 기호표의 이름과 글자 그대로 같게 쓴다 — `acc` · `step` · `e` 다.
 *
 * 행렬은 본문과 같은 표기 `[[좌상,우상],[좌하,우하]]` 로 적고, 그 행렬이 `M` 의 몇 제곱인지
 * 를 함께 붙인다. 자리 행렬이 무엇의 거듭제곱인지가 이 절차에서 가장 자주 어긋나는 자리다.
 */
export const powMatrix = {
  view: ["keyValue"] as const,
  title: "matrixPowerFibonacci(10n) — 비트 넷으로 M^10 을 만든다",
  result: "55n",
  steps: [
    {
      title: "T1 초기화 — ① 두 행렬과 남은 지수를 세운다",
      detail:
        "acc 를 단위행렬로, step 을 전이 행렬 M 으로, e 를 10 으로 둔다. 아직 바퀴에 들어가지 않았다.",
      entries: [
        { label: "갈래", value: "① 초기화" },
        { label: "이번 비트", value: "—" },
        { label: "비트 자리", value: "—" },
        { label: "acc", value: "[[1,0],[0,1]] = M^0" },
        { label: "step", value: "[[1,1],[1,0]] = M^1" },
        { label: "e", value: "10 (1010)" },
        { label: "누적 행렬 곱", value: 0 },
        { label: "답이 될 칸", value: 0 },
      ],
    },
    {
      title: "T2 비트 자리 0 — ④ 제곱만",
      detail:
        "e = 10 의 최하위 비트가 0 이라 ③ 을 건너뛴다. step 이 M^1 에서 M^2 로 제곱되고 e 가 5 가 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③ 건너뜀 · ④⑤ 실행" },
        { label: "이번 비트", value: 0 },
        { label: "비트 자리", value: 0 },
        { label: "acc", value: "[[1,0],[0,1]] = M^0" },
        { label: "step", value: "[[2,1],[1,1]] = M^2" },
        { label: "e", value: "5 (101)" },
        { label: "누적 행렬 곱", value: 1 },
        { label: "답이 될 칸", value: 0 },
      ],
    },
    {
      title: "T3 비트 자리 1 — ③ 누적 뒤 ④ 제곱",
      detail:
        "e = 5 의 최하위 비트가 1 이라 acc 에 step = M^2 를 곱한다. 그다음 step 이 M^4 가 되고 e 가 2 가 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③④⑤ 실행" },
        { label: "이번 비트", value: 1 },
        { label: "비트 자리", value: 1 },
        { label: "acc", value: "[[2,1],[1,1]] = M^2" },
        { label: "step", value: "[[5,3],[3,2]] = M^4" },
        { label: "e", value: "2 (10)" },
        { label: "누적 행렬 곱", value: 3 },
        { label: "답이 될 칸", value: 1 },
      ],
    },
    {
      title: "T4 비트 자리 2 — ④ 제곱만",
      detail:
        "e = 2 의 최하위 비트가 0 이라 acc 는 M^2 그대로다. step 이 M^4 에서 M^8 로 제곱되고 e 가 1 이 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③ 건너뜀 · ④⑤ 실행" },
        { label: "이번 비트", value: 0 },
        { label: "비트 자리", value: 2 },
        { label: "acc", value: "[[2,1],[1,1]] = M^2" },
        { label: "step", value: "[[34,21],[21,13]] = M^8" },
        { label: "e", value: "1 (1)" },
        { label: "누적 행렬 곱", value: 4 },
        { label: "답이 될 칸", value: 1 },
      ],
    },
    {
      title: "T5 비트 자리 3 — 마지막 1 비트",
      detail:
        "e = 1 의 최하위 비트가 1 이라 acc 가 M^2 · M^8 = M^10 이 된다. e 가 0 이 되어 다음 검사에서 바퀴가 끝난다.",
      entries: [
        { label: "갈래", value: "② 참 · ③④⑤ 실행" },
        { label: "이번 비트", value: 1 },
        { label: "비트 자리", value: 3 },
        { label: "acc", value: "[[89,55],[55,34]] = M^10" },
        { label: "step", value: "[[1597,987],[987,610]] = M^16" },
        { label: "e", value: "0" },
        { label: "누적 행렬 곱", value: 6 },
        { label: "답이 될 칸", value: 55 },
      ],
    },
    {
      title: "T6 종료 검사 — ② 거짓",
      detail:
        "e 가 0 이라 ② 가 거짓이 되고 바퀴를 빠져나온다. 마지막 바퀴가 만든 M^16 은 쓸 자리가 없다.",
      entries: [
        { label: "갈래", value: "② 거짓" },
        { label: "이번 비트", value: "—" },
        { label: "비트 자리", value: "—" },
        { label: "acc", value: "[[89,55],[55,34]] = M^10" },
        { label: "step", value: "[[1597,987],[987,610]] = M^16" },
        { label: "e", value: "0" },
        { label: "누적 행렬 곱", value: 6 },
        { label: "답이 될 칸", value: 55 },
      ],
    },
    {
      title: "T7 반환 — ⑥ 오른쪽 위 칸을 읽는다",
      detail:
        "acc 는 M^10 이고 그 오른쪽 위 칸이 F(10) = 55 다. 누적 행렬 곱 6 은 비트 수 4 와 1 인 비트 2 의 합이다.",
      entries: [
        { label: "갈래", value: "⑥ 반환" },
        { label: "이번 비트", value: "—" },
        { label: "비트 자리", value: "—" },
        { label: "acc", value: "[[89,55],[55,34]] = M^10" },
        { label: "step", value: "—" },
        { label: "e", value: "0" },
        { label: "누적 행렬 곱", value: 6 },
        { label: "답이 될 칸", value: 55 },
      ],
    },
  ] satisfies Frame[],
};
