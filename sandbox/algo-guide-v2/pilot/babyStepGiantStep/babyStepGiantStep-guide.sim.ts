import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `matrix` 와 `keyValue` 를 함께 그린다 — 아기 걸음 표가 행 하나이고, 큰 걸음은 표에 없는
 * 상태 변수 셋(`stride`·`i`·`giant`)이라 한 패널로는 둘 중 하나가 빠진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const steps58 = {
  view: ["matrix", "keyValue"] as const,
  title: "babyStepGiantStep(5n, 33n, 58n)",
  result: "9",
  steps: [
    {
      title: "T1 조각 크기를 정한다",
      detail: "n = ⌈√58⌉ = 8. 아기 걸음도 큰 걸음도 최대 8 번이 된다.",
      matrix: [[null, null, null, null, null, null, null, null]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      entries: [
        { label: "n", value: 8 },
        { label: "표 칸", value: 0 },
      ],
    },
    {
      title: "T2 아기 걸음 첫 칸",
      detail: "j = 0 은 b 자신이다. 33 을 적는다.",
      matrix: [[33, null, null, null, null, null, null, null]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [[0, 0]] as [number, number][],
      entries: [
        { label: "n", value: 8 },
        { label: "표 칸", value: 1 },
      ],
    },
    {
      title: "T3 아기 걸음 나머지",
      detail: "직전 칸에 5 를 곱해 다음 칸을 만든다. 곱셈 7 번으로 표가 찬다.",
      matrix: [[33, 49, 13, 7, 35, 1, 5, 25]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [[0, 7]] as [number, number][],
      entries: [
        { label: "n", value: 8 },
        { label: "표 칸", value: 8 },
      ],
    },
    {
      title: "T4 큰 걸음의 보폭",
      detail: "stride = 5^8 mod 58 = 53. 큰 걸음 한 번이 지수를 8 씩 올린다.",
      matrix: [[33, 49, 13, 7, 35, 1, 5, 25]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      entries: [
        { label: "stride", value: 53 },
        { label: "i", value: 0 },
        { label: "giant", value: 1 },
      ],
    },
    {
      title: "T5 i=1 — 표에 없다",
      detail: "giant = 53. 표의 여덟 값 어디에도 없어 i 를 하나 늘린다. ②",
      matrix: [[33, 49, 13, 7, 35, 1, 5, 25]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      entries: [
        { label: "i", value: 1 },
        { label: "giant", value: 53 },
        { label: "표에 있는가", value: "없다" },
      ],
    },
    {
      title: "T6~T8 i=2 — 표에 있다",
      detail: "giant = 25 가 j=7 칸과 같다. x = i·n − j = 2·8 − 7 = 9. ①",
      matrix: [[33, 49, 13, 7, 35, 1, 5, 25]],
      rowLabels: ["b·5^j mod 58"],
      colLabels: ["j=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [[0, 7]] as [number, number][],
      entries: [
        { label: "i", value: 2 },
        { label: "giant", value: 25 },
        { label: "x", value: 9 },
      ],
    },
  ] satisfies Frame[],
};
