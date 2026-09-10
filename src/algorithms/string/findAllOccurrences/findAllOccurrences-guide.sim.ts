import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(12)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `array` 하나가 아니라 `keyValue` 를 함께 쓰는가
 *
 * 이 절차의 상태는 둘인데 **자리의 종류가 다르다.** `i` 는 텍스트의 칸 번호라 `array` 의
 * `pointers` 로 둘 수 있지만, `j` 는 텍스트의 칸 번호가 아니라 **지금까지 맞은 글자 수**다.
 * 둘을 같은 배열 위에 포인터로 얹으면 같은 눈금이 두 가지를 가리키게 되고, 그것이
 * `FEEDBACK.md` §3 이 잡는 기호 충돌이다. 그래서 자리(`i`)는 `array`, 수(`j`)는 `keyValue`
 * 로 가른다 — `kadane-guide.sim.ts` 가 세운 규약과 같은 자리다.
 *
 * 규약 다섯을 그대로 따른다.
 *
 * 1. **`array` 는 텍스트 `T` 의 글자를 그대로 담는다.** 이 절차는 텍스트를 고치지 않으므로
 *    프레임마다 같은 배열이 실린다. 바뀌는 것은 강조 자리와 두 항목이다.
 * 2. **위치는 `array`, 수는 `keyValue`.**
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 견준 텍스트 칸, `marked` 는 지금까지 찾은 시작 자리.**
 *    `marked` 가 늘어나는 세 걸음(T8·T10·T12)이 이 절차의 핵심 장면이다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 셋이다.
 */
export const kmpWalk = {
  view: ["array", "keyValue"] as const,
  title: 'T = "abacabababab" 에서 P = "abab" 의 시작 자리 전부',
  result: "[4, 6, 8]",
  steps: [
    {
      title: "T1 i=0",
      detail:
        "맞은 길이 j 가 0 이라 물러설 것이 없다. T[0]='a' 와 P[0]='a' 가 같아 j 가 1 이 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [0],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "j — 맞은 글자 수", value: 1 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T2 i=1",
      detail: "T[1]='b' 와 P[1]='b' 가 같아 j 가 2 가 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [1],
      marked: [],
      pointers: { i: 1 },
      entries: [
        { label: "j — 맞은 글자 수", value: 2 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T3 i=2",
      detail: "T[2]='a' 와 P[2]='a' 가 같아 j 가 3 이 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [2],
      marked: [],
      pointers: { i: 2 },
      entries: [
        { label: "j — 맞은 글자 수", value: 3 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T4 i=3",
      detail:
        "T[3]='c' 와 P[3]='b' 가 달라 j 를 fail[2]=1 로 줄이고, 여전히 달라 fail[0]=0 으로 한 번 더 줄인다. i 는 3 그대로다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [3],
      marked: [],
      pointers: { i: 3 },
      entries: [
        { label: "j — 맞은 글자 수", value: 0 },
        { label: "이번 걸음에 한 일", value: "달랐다 — j 를 두 번 줄인다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T5 i=4",
      detail:
        "j 가 0 이라 물러설 것이 없다. T[4]='a' 와 P[0]='a' 가 같아 j 가 1 이 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [4],
      marked: [],
      pointers: { i: 4 },
      entries: [
        { label: "j — 맞은 글자 수", value: 1 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T6 i=5",
      detail: "T[5]='b' 와 P[1]='b' 가 같아 j 가 2 가 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [5],
      marked: [],
      pointers: { i: 5 },
      entries: [
        { label: "j — 맞은 글자 수", value: 2 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T7 i=6",
      detail: "T[6]='a' 와 P[2]='a' 가 같아 j 가 3 이 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [6],
      marked: [],
      pointers: { i: 6 },
      entries: [
        { label: "j — 맞은 글자 수", value: 3 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "없음" },
      ],
    },
    {
      title: "T8 i=7",
      detail:
        "j 가 4 가 되어 패턴 전체가 맞았다. 시작 자리 7−4+1=4 를 적고 j 를 fail[3]=2 로 줄여 겹치는 등장을 이어서 찾는다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [7],
      marked: [4],
      pointers: { i: 7 },
      entries: [
        { label: "j — 맞은 글자 수", value: 2 },
        {
          label: "이번 걸음에 한 일",
          value: "전체가 맞았다 — 자리 4 를 적는다",
        },
        { label: "찾은 시작 자리", value: "4" },
      ],
    },
    {
      title: "T9 i=8",
      detail:
        "T[8]='a' 와 P[2]='a' 가 같아 j 가 3 이 된다. 앞의 두 글자는 다시 안 견준다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [8],
      marked: [4],
      pointers: { i: 8 },
      entries: [
        { label: "j — 맞은 글자 수", value: 3 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "4" },
      ],
    },
    {
      title: "T10 i=9",
      detail:
        "j 가 다시 4 가 되어 시작 자리 9−4+1=6 을 적는다. 자리 4 와 두 글자가 겹치는 등장이다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [9],
      marked: [4, 6],
      pointers: { i: 9 },
      entries: [
        { label: "j — 맞은 글자 수", value: 2 },
        {
          label: "이번 걸음에 한 일",
          value: "전체가 맞았다 — 자리 6 을 적는다",
        },
        { label: "찾은 시작 자리", value: "4 · 6" },
      ],
    },
    {
      title: "T11 i=10",
      detail: "T[10]='a' 와 P[2]='a' 가 같아 j 가 3 이 된다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [10],
      marked: [4, 6],
      pointers: { i: 10 },
      entries: [
        { label: "j — 맞은 글자 수", value: 3 },
        { label: "이번 걸음에 한 일", value: "맞았다 — j 를 1 늘린다" },
        { label: "찾은 시작 자리", value: "4 · 6" },
      ],
    },
    {
      title: "T12 i=11",
      detail:
        "마지막 칸이다. j 가 4 가 되어 시작 자리 11−4+1=8 을 적는다. 답은 4 · 6 · 8 셋이다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      highlight: [11],
      marked: [4, 6, 8],
      pointers: { i: 11 },
      entries: [
        { label: "j — 맞은 글자 수", value: 2 },
        {
          label: "이번 걸음에 한 일",
          value: "전체가 맞았다 — 자리 8 을 적는다",
        },
        { label: "찾은 시작 자리", value: "4 · 6 · 8" },
      ],
    },
  ] satisfies Frame[],
};
