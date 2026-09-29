import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [1, 3, 5, 7, 9, 11]`.
 * `probe` 는 있는 값 7 을 찾는 T1~T7, `miss` 는 없는 값 4 를 찾는 T8~T11 이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `binarySearch-guide.test.ts` 가 잰다. `marked` 는 후보 구간 밖의 칸, `highlight` 는 이번에 읽은 칸이다.
 */

export const probe = {
  view: "array" as const,
  title: "binarySearch([1, 3, 5, 7, 9, 11], 7)",
  result: "3",
  steps: [
    {
      title: "T1 후보 [0,5]",
      detail:
        "후보 구간을 배열 전체로 잡습니다. lo = 0, hi = 5, 후보 6 개입니다.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [],
      pointers: {
        lo: 0,
        hi: 5,
      },
    },
    {
      title: "T2 mid = 2",
      detail: "0 <= 5 가 참이라 반복에 들어갑니다. mid = 0 + ⌊5/2⌋ = 2 입니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [2],
      marked: [],
      pointers: {
        lo: 0,
        mid: 2,
        hi: 5,
      },
    },
    {
      title: "T3 A[2] = 5 ③",
      detail:
        "A[2] = 5 를 읽습니다. 5 === 7 은 거짓, 7 < 5 도 거짓이라 ③ lo = 3 입니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [2],
      marked: [0, 1, 2],
      pointers: {
        lo: 3,
        mid: 2,
        hi: 5,
      },
    },
    {
      title: "T4 mid = 4",
      detail: "3 <= 5 가 참이라 반복에 들어갑니다. mid = 3 + ⌊2/2⌋ = 4 입니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [4],
      marked: [0, 1, 2],
      pointers: {
        lo: 3,
        mid: 4,
        hi: 5,
      },
    },
    {
      title: "T5 A[4] = 9 ②",
      detail:
        "A[4] = 9 를 읽습니다. 9 === 7 은 거짓, 7 < 9 는 참이라 ② hi = 3 입니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [4],
      marked: [0, 1, 2, 4, 5],
      pointers: {
        lo: 3,
        mid: 4,
        hi: 3,
      },
    },
    {
      title: "T6 mid = 3",
      detail: "3 <= 3 이 참이라 반복에 들어갑니다. mid = 3 + ⌊0/2⌋ = 3 입니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [3],
      marked: [0, 1, 2, 4, 5],
      pointers: {
        lo: 3,
        mid: 3,
        hi: 3,
      },
    },
    {
      title: "T7 A[3] = 7 ①",
      detail: "A[3] = 7 을 읽습니다. 7 === 7 이 참이라 ① 3 을 돌려줍니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [3],
      marked: [0, 1, 2, 4, 5],
      pointers: {
        mid: 3,
      },
    },
  ] satisfies Frame[],
};

export const miss = {
  view: "array" as const,
  title: "binarySearch([1, 3, 5, 7, 9, 11], 4)",
  result: "-1",
  steps: [
    {
      title: "T8 후보 [0,5] · A[2] = 5 ②",
      detail:
        "mid = 2, A[2] = 5 를 읽습니다. 4 < 5 가 참이라 ② hi = 1 입니다. 후보가 2 개 남습니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [2],
      marked: [2, 3, 4, 5],
      pointers: {
        lo: 0,
        mid: 2,
        hi: 1,
      },
    },
    {
      title: "T9 후보 [0,1] · A[0] = 1 ③",
      detail:
        "mid = 0, A[0] = 1 을 읽습니다. 4 < 1 이 거짓이라 ③ lo = 1 입니다. 후보가 1 개 남습니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [0],
      marked: [0, 2, 3, 4, 5],
      pointers: {
        lo: 1,
        mid: 0,
        hi: 1,
      },
    },
    {
      title: "T10 후보 [1,1] · A[1] = 3 ③",
      detail:
        "mid = 1, A[1] = 3 을 읽습니다. 4 < 3 이 거짓이라 ③ lo = 2 입니다. 후보가 0 개 남습니다.",
      array: [1, 3, 5, 7, 9, 11],
      highlight: [1],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: {
        lo: 2,
        mid: 1,
        hi: 1,
      },
    },
    {
      title: "T11 lo = 2 > hi = 1",
      detail: "lo <= hi 가 거짓이라 반복이 끝나고 -1 을 돌려줍니다.",
      array: [1, 3, 5, 7, 9, 11],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: {
        lo: 2,
        hi: 1,
      },
    },
  ] satisfies Frame[],
};
