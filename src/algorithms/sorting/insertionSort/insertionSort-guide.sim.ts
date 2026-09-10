import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [5, 2, 4, 6, 1, 3]`.
 * 프레임 수는 그 절의 T# 단계 수를 넘지 않는다(P3 이 그 관계를 잰다).
 *
 * 한 프레임은 **바깥 반복 한 바퀴가 끝난 시점**의 `B` 다. 안쪽 반복이 값을 한 칸씩 옮기는
 * 중간 상태는 그리지 않는다 — 그 자리는 본문의 T5·T6 표가 자리마다 값으로 적는다.
 * `marked` 가 정렬된 구역, `highlight` 가 이번 바퀴에 자리를 찾은 값이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const walk6 = {
  view: "array" as const,
  title: "insertionSort([5, 2, 4, 6, 1, 3])",
  result: "[1, 2, 3, 4, 5, 6]",
  steps: [
    {
      title: "T1 복사본을 만들고 왼쪽 한 칸을 정렬된 구역으로 둔다",
      detail:
        "B = A 의 복사본. 칸이 하나뿐인 B[0..0] 은 견줄 것이 없어 이미 오름차순이다.",
      array: [5, 2, 4, 6, 1, 3],
      marked: [0],
      pointers: { i: 1 },
    },
    {
      title: "T2 key = 2 의 자리를 찾는다",
      detail:
        "5 > 2 라 5 를 오른쪽으로 옮기고 구역의 왼쪽 끝을 지난다. 견주기 1 번 · 이동 1 번.",
      array: [2, 5, 4, 6, 1, 3],
      marked: [0, 1],
      highlight: [0],
      pointers: { i: 1 },
    },
    {
      title: "T3 key = 4 의 자리를 찾는다",
      detail:
        "5 > 4 라 5 를 옮기고, 2 > 4 가 거짓이라 멈춘다. 견주기 2 번 · 이동 1 번.",
      array: [2, 4, 5, 6, 1, 3],
      marked: [0, 1, 2],
      highlight: [1],
      pointers: { i: 2 },
    },
    {
      title: "T4 key = 6 은 제자리다",
      detail:
        "5 > 6 이 첫 견주기에서 거짓이라 아무것도 옮기지 않는다. 견주기 1 번 · 이동 0 번.",
      array: [2, 4, 5, 6, 1, 3],
      marked: [0, 1, 2, 3],
      highlight: [3],
      pointers: { i: 3 },
    },
    {
      title: "T5 key = 1 이 구역 전체를 지나간다",
      detail:
        "6 · 5 · 4 · 2 가 차례로 한 칸씩 오른쪽으로 간다. 견주기 4 번 · 이동 4 번.",
      array: [1, 2, 4, 5, 6, 3],
      marked: [0, 1, 2, 3, 4],
      highlight: [0],
      pointers: { i: 4 },
    },
    {
      title: "T6 key = 3 이 2 와 4 사이에 들어간다",
      detail:
        "6 · 5 · 4 를 옮기고 2 > 3 이 거짓이라 멈춘다. 견주기 4 번 · 이동 3 번.",
      array: [1, 2, 3, 4, 5, 6],
      marked: [0, 1, 2, 3, 4, 5],
      highlight: [2],
      pointers: { i: 5 },
    },
    {
      title: "T7 반환",
      detail:
        "정렬된 구역이 여섯 칸 전체가 됐다. 반환값은 [1, 2, 3, 4, 5, 6] 이고 입력 A 는 그대로다.",
      array: [1, 2, 3, 4, 5, 6],
      marked: [0, 1, 2, 3, 4, 5],
    },
  ] satisfies Frame[],
};
