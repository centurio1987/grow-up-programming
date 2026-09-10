import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [1, 3, 5, 7, 9, 11]`,
 * `target = 7`. 프레임 수는 그 절의 T# 단계 수를 넘지 않는다(P3 이 그 관계를 잰다).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const probe = {
  view: "array" as const,
  title: "binarySearch([1, 3, 5, 7, 9, 11], 7)",
  result: "3",
  steps: [
    {
      title: "T1 시작",
      detail: "후보 구간을 배열 전체로 잡는다. lo = 0, hi = 5, 후보 6 개.",
      array: [1, 3, 5, 7, 9, 11],
      pointers: { lo: 0, hi: 5 },
    },
    {
      title: "T2 첫 번째 가운데",
      detail: "lo ≤ hi 가 참이라 반복에 들어간다. mid = 0 + ⌊5/2⌋ = 2.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [2],
      pointers: { lo: 0, mid: 2, hi: 5 },
    },
    {
      title: "T3 A[2] = 5 — ③",
      detail:
        "5 는 7 과 같지 않고 7 보다 작다. 인덱스 0·1·2 를 후보에서 뺀다. lo = 3.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [0, 1, 2],
      pointers: { lo: 3, hi: 5 },
    },
    {
      title: "T4 두 번째 가운데",
      detail: "후보가 3 개 남았다. mid = 3 + ⌊2/2⌋ = 4.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [0, 1, 2],
      highlight: [4],
      pointers: { lo: 3, mid: 4, hi: 5 },
    },
    {
      title: "T5 A[4] = 9 — ②",
      detail: "9 는 7 보다 크다. 인덱스 4·5 를 후보에서 뺀다. hi = 3.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [0, 1, 2, 4, 5],
      pointers: { lo: 3, hi: 3 },
    },
    {
      title: "T6 세 번째 가운데",
      detail: "후보가 1 개 남았다. mid = 3 + ⌊0/2⌋ = 3.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [0, 1, 2, 4, 5],
      highlight: [3],
      pointers: { lo: 3, mid: 3, hi: 3 },
    },
    {
      title: "T7 A[3] = 7 — ①",
      detail: "같다. 인덱스 3 을 반환한다. 비교는 세 번이었다.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [3],
      pointers: { mid: 3 },
    },
  ] satisfies Frame[],
};
