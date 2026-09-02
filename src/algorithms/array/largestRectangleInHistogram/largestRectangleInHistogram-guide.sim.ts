import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(13)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 이 편에서 `array` 와 `keyValue` 가 각각 무엇을 담는가
 *
 * 화면에 나와야 하는 것이 넷이고 성질이 다르다 — 막대 높이는 칸 번호가 뜻을 가지고, 통은
 * 순서가 뜻을 가지며, 이번 걸음이 낸 넓이는 한 번 나왔다 사라지고, 가장 큰 넓이는 누적된다.
 *
 * 1. **`array` 는 높이 배열 `heights` 만 담는다.** 칸 번호가 본문의 `heights[i]` 와 그대로 맞는다.
 * 2. **`highlight` 는 지금 읽는 자리 `i`, `marked` 는 통에 남아 있는 자리.** 보초 걸음
 *    (T10~T13)에는 읽는 자리가 배열 밖이라 `highlight` 를 비운다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i` 와 `top`.
 * 4. **통 · 넓이 · 가장 큰 넓이는 `keyValue` 가 적는다.** 통은 바닥에서 꼭대기로 적고, 그
 *    아래 줄에 각 자리의 높이를 같은 순서로 적어 「바닥에서 꼭대기로 높이가 커진다」가 한
 *    화면에서 확인된다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 한 걸음에
 *    한 가지 일만 담았다 — 같은 `i` 안에서 꺼내기가 두 번 일어나는 T6·T7 은 프레임을 나눴다.
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "꺼낼 때 넓이를 내는 단조 스택 — heights = [2, 1, 5, 6, 2, 3]",
  result: "10",
  steps: [
    {
      title: "T1 통이 비어 자리 0 을 넣는다",
      detail:
        "통이 비어 맞대 볼 꼭대기가 없다. 자리 0(높이 2)을 오른쪽 경계가 아직 없는 자리로 넣는다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [0],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "지금 하는 일", value: "자리 0 을 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[0]" },
        { label: "통의 높이", value: "2" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "0" },
      ],
    },
    {
      title: "T2 꼭대기 2 가 1 보다 높아 꺼낸다",
      detail:
        "꼭대기는 자리 0 이고 높이가 2 다. 2 > 1 이라 꺼낸다. 통이 비어 왼쪽 경계는 -1, 오른쪽 경계는 지금 자리 1 이므로 폭이 1 − (−1) − 1 = 1 이고 넓이가 2 × 1 = 2 다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [1],
      marked: [],
      pointers: { i: 1, top: 0 },
      entries: [
        { label: "지금 하는 일", value: "자리 0 을 꺼내 넓이 2 를 냈다" },
        { label: "통(바닥→꼭대기)", value: "[]" },
        { label: "통의 높이", value: "—" },
        { label: "이번에 낸 넓이", value: "2 = 높이 2 × 폭 1" },
        { label: "가장 큰 넓이", value: "2" },
      ],
    },
    {
      title: "T3 통이 비어 자리 1 을 넣는다",
      detail: "더 꺼낼 꼭대기가 없어 반복이 끝났다. 자리 1(높이 1)을 넣는다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [1],
      marked: [1],
      pointers: { i: 1 },
      entries: [
        { label: "지금 하는 일", value: "자리 1 을 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[1]" },
        { label: "통의 높이", value: "1" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "2" },
      ],
    },
    {
      title: "T4 꼭대기 1 이 5 보다 높지 않아 멈춘다",
      detail:
        "꼭대기는 자리 1 이고 높이가 1 이다. 1 은 5 보다 높지 않으므로 아무것도 안 꺼내고 자리 2 를 넣는다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [2],
      marked: [1, 2],
      pointers: { i: 2, top: 1 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 2 를 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[1 2]" },
        { label: "통의 높이", value: "1 5" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "2" },
      ],
    },
    {
      title: "T5 꼭대기 5 가 6 보다 높지 않아 멈춘다",
      detail:
        "꼭대기는 자리 2 이고 높이가 5 다. 5 는 6 보다 높지 않으므로 멈추고 자리 3 을 넣는다. 통의 높이가 바닥에서 꼭대기로 1 5 6 으로 커진다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [3],
      marked: [1, 2, 3],
      pointers: { i: 3, top: 2 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 3 을 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[1 2 3]" },
        { label: "통의 높이", value: "1 5 6" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "2" },
      ],
    },
    {
      title: "T6 꼭대기 6 이 2 보다 높아 꺼낸다",
      detail:
        "꼭대기는 자리 3 이고 높이가 6 이다. 6 > 2 라 꺼낸다. 꺼낸 뒤 통의 꼭대기가 자리 2 이므로 왼쪽 경계가 2, 오른쪽 경계가 4 이고 폭이 4 − 2 − 1 = 1 이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [4],
      marked: [1, 2],
      pointers: { i: 4, top: 3 },
      entries: [
        { label: "지금 하는 일", value: "자리 3 을 꺼내 넓이 6 을 냈다" },
        { label: "통(바닥→꼭대기)", value: "[1 2]" },
        { label: "통의 높이", value: "1 5" },
        { label: "이번에 낸 넓이", value: "6 = 높이 6 × 폭 1" },
        { label: "가장 큰 넓이", value: "6" },
      ],
    },
    {
      title: "T7 다음 꼭대기 5 도 2 보다 높아 꺼낸다",
      detail:
        "같은 걸음에서 한 번 더 꺼낸다. 자리 2 의 높이 5 도 2 보다 높다. 왼쪽 경계가 1, 오른쪽 경계가 4 라 폭이 4 − 1 − 1 = 2 이고 넓이가 10 이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [4],
      marked: [1],
      pointers: { i: 4, top: 2 },
      entries: [
        { label: "지금 하는 일", value: "자리 2 를 꺼내 넓이 10 을 냈다" },
        { label: "통(바닥→꼭대기)", value: "[1]" },
        { label: "통의 높이", value: "1" },
        { label: "이번에 낸 넓이", value: "10 = 높이 5 × 폭 2" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T8 꼭대기 1 이 2 보다 높지 않아 멈춘다",
      detail:
        "다음 꼭대기는 자리 1 이고 높이가 1 이다. 1 은 2 보다 높지 않으므로 여기서 멈추고 자리 4 를 넣는다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [4],
      marked: [1, 4],
      pointers: { i: 4, top: 1 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 4 를 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[1 4]" },
        { label: "통의 높이", value: "1 2" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T9 꼭대기 2 가 3 보다 높지 않아 멈춘다",
      detail:
        "꼭대기는 자리 4 이고 높이가 2 다. 2 는 3 보다 높지 않으므로 멈추고 자리 5 를 넣는다. 여기서 배열을 다 읽었다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [5],
      marked: [1, 4, 5],
      pointers: { i: 5, top: 4 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 5 를 넣었다" },
        { label: "통(바닥→꼭대기)", value: "[1 4 5]" },
        { label: "통의 높이", value: "1 2 3" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T10 보초 걸음이 자리 5 를 꺼낸다",
      detail:
        "보초 걸음의 높이는 0 이라 통에 남은 자리를 전부 꺼낸다. 자리 5 는 왼쪽 경계가 4, 오른쪽 경계가 6 이라 폭이 6 − 4 − 1 = 1 이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [],
      marked: [1, 4],
      pointers: { top: 5 },
      entries: [
        { label: "지금 하는 일", value: "자리 5 를 꺼내 넓이 3 을 냈다" },
        { label: "통(바닥→꼭대기)", value: "[1 4]" },
        { label: "통의 높이", value: "1 2" },
        { label: "이번에 낸 넓이", value: "3 = 높이 3 × 폭 1" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T11 보초 걸음이 자리 4 를 꺼낸다",
      detail:
        "자리 4 의 왼쪽 경계는 자리 1, 오른쪽 경계는 6 이다. 폭이 6 − 1 − 1 = 4 이고 넓이가 2 × 4 = 8 이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [],
      marked: [1],
      pointers: { top: 4 },
      entries: [
        { label: "지금 하는 일", value: "자리 4 를 꺼내 넓이 8 을 냈다" },
        { label: "통(바닥→꼭대기)", value: "[1]" },
        { label: "통의 높이", value: "1" },
        { label: "이번에 낸 넓이", value: "8 = 높이 2 × 폭 4" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T12 보초 걸음이 자리 1 을 꺼낸다",
      detail:
        "통이 비어 자리 1 의 왼쪽 경계는 -1 이다. 폭이 6 − (−1) − 1 = 6 으로 배열 전체이고 넓이가 1 × 6 = 6 이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [],
      marked: [],
      pointers: { top: 1 },
      entries: [
        { label: "지금 하는 일", value: "자리 1 을 꺼내 넓이 6 을 냈다" },
        { label: "통(바닥→꼭대기)", value: "[]" },
        { label: "통의 높이", value: "—" },
        { label: "이번에 낸 넓이", value: "6 = 높이 1 × 폭 6" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
    {
      title: "T13 순회가 끝났다",
      detail:
        "통이 비어 반복이 끝났다. 여섯 자리가 모두 한 번씩 꺼내졌고 가장 큰 넓이 10 이 답이다.",
      array: [2, 1, 5, 6, 2, 3],
      highlight: [],
      marked: [],
      pointers: {},
      entries: [
        { label: "지금 하는 일", value: "순회를 마쳤다" },
        { label: "통(바닥→꼭대기)", value: "[]" },
        { label: "통의 높이", value: "—" },
        { label: "이번에 낸 넓이", value: "—" },
        { label: "가장 큰 넓이", value: "10" },
      ],
    },
  ] satisfies Frame[],
};
