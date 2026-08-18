import type { Frame } from "#guide-sim";

/**
 * `trace` 절과 **같은 입력**을 굴린다. 프레임 수는 `trace` 의 T# 단계 수(13)를 넘지 않는다
 * — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 trace 가 P3 을 그냥 지나간다.
 */
export const partition = {
  view: "array" as const,
  title: "quickSort([5, 2, 3, 1]) — 첫 분할",
  result: "[1,2,3,5]",
  steps: [
    {
      title: "T1 시작",
      detail: "sort(0,3). 중앙 pivotIdx=1, 값 2.",
      array: [5, 2, 3, 1],
      pointers: { pivot: 1 },
    },
    {
      title: "T2 피벗을 끝으로",
      detail:
        "피벗 2 를 hi=3 으로 옮긴다. 분할 루프가 끝 한 칸만 비켜 두면 된다.",
      array: [5, 1, 3, 2],
      pointers: { pivot: 3 },
    },
    {
      title: "T3 j=0 — ②",
      detail: "5 < 2 가 거짓이라 그대로 둔다. i 는 0 그대로.",
      array: [5, 1, 3, 2],
      pointers: { i: 0, j: 0 },
    },
    {
      title: "T4 j=1 — ①",
      detail: "1 < 2 가 참이라 i 자리와 바꾸고 i 를 0→1 로 넓힌다.",
      array: [1, 5, 3, 2],
      highlight: [0, 1],
      pointers: { i: 1, j: 1 },
    },
    {
      title: "T5 j=2 — ②",
      detail: "3 < 2 가 거짓. i 는 1 그대로.",
      array: [1, 5, 3, 2],
      pointers: { i: 1, j: 2 },
    },
    {
      title: "T6 피벗 제자리",
      detail: "피벗을 i=1 로 되돌린다. 이 자리가 2 의 최종 위치다.",
      array: [1, 2, 3, 5],
      marked: [1],
    },
    {
      title: "T8~T11 오른쪽 구간",
      detail: "sort(2,3) 이 3 을 제자리에 놓는다.",
      array: [1, 2, 3, 5],
      marked: [1, 2],
    },
    {
      title: "T13 완료",
      detail: "남은 구간이 전부 크기 1 이하라 즉시 반환한다.",
      array: [1, 2, 3, 5],
      marked: [0, 1, 2, 3],
    },
  ] satisfies Frame[],
};
