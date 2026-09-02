import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(23)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const select = {
  view: "array" as const,
  title: "kthSmallest([7, 10, 4, 3, 20, 15], 4) — 네 번 갈라 자리 하나",
  result: "10",
  steps: [
    {
      title: "시작",
      detail: "target = 4 − 1 = 3. 구간은 [0,5] 여섯 칸이다.",
      array: [7, 10, 4, 3, 20, 15],
      pointers: { lo: 0, hi: 5, target: 3 },
    },
    {
      title: "T1 기준값 4 를 끝으로",
      detail: "중앙은 인덱스 2, 값 4. 인덱스 2 와 5 를 맞바꾼다.",
      array: [7, 10, 15, 3, 20, 4],
      highlight: [5],
      pointers: { lo: 0, hi: 5, target: 3 },
    },
    {
      title: "T7 기준값 4 의 자리는 인덱스 1",
      detail: "4 보다 작은 값은 3 하나뿐이라 p = 1 이다.",
      array: [3, 4, 15, 7, 20, 10],
      marked: [1],
      pointers: { p: 1, target: 3 },
    },
    {
      title: "T8 p = 1 < target = 3",
      detail:
        "목표는 더 뒤에 있다. 오른쪽 [2,5] 만 남기고 왼쪽은 다시 안 본다.",
      array: [3, 4, 15, 7, 20, 10],
      marked: [0, 1],
      pointers: { lo: 2, hi: 5, target: 3 },
    },
    {
      title: "T13 기준값 7 의 자리는 인덱스 2",
      detail:
        "구간 [2,5] 의 중앙은 인덱스 3, 값 7. 7 보다 작은 값이 없어 p = 2 다.",
      array: [3, 4, 7, 10, 20, 15],
      marked: [0, 1, 2],
      pointers: { p: 2, target: 3 },
    },
    {
      title: "T14 p = 2 < target = 3",
      detail: "또 오른쪽이다. 구간이 [3,5] 세 칸으로 준다.",
      array: [3, 4, 7, 10, 20, 15],
      marked: [0, 1, 2],
      pointers: { lo: 3, hi: 5, target: 3 },
    },
    {
      title: "T18 기준값 20 의 자리는 인덱스 5",
      detail: "구간의 최댓값이 기준값이 되어 오른쪽 구역이 비었다.",
      array: [3, 4, 7, 10, 15, 20],
      marked: [0, 1, 2, 5],
      pointers: { p: 5, target: 3 },
    },
    {
      title: "T19 p = 5 > target = 3",
      detail: "이번에는 목표가 더 앞이다. 왼쪽 [3,4] 두 칸만 남는다.",
      array: [3, 4, 7, 10, 15, 20],
      marked: [0, 1, 2, 5],
      pointers: { lo: 3, hi: 4, target: 3 },
    },
    {
      title: "T23 p = 3 = target — 반환 10",
      detail: "네 번째 분할에서 확정된 자리가 목표 자리와 같아졌다.",
      array: [3, 4, 7, 10, 15, 20],
      marked: [3],
      pointers: { p: 3, target: 3 },
    },
  ] satisfies Frame[],
};
