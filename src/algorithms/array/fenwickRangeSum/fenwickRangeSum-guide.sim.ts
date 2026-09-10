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
 * 이 절차는 배열 둘을 나란히 들고 간다 — 독자가 보는 논리 배열 `arr` 와 저장용 `tree` 다.
 * 둘의 칸 번호가 1 만큼 어긋나 있어서(0 부터 세는 쪽과 1 부터 세는 쪽), 한 패널에 함께
 * 넣으면 화면의 칸 번호가 어느 쪽 것인지 알 수 없게 된다. 그래서 갈라 담는다.
 *
 * 1. **`array` 는 논리 배열 `arr` 만 담는다.** 칸 번호가 본문의 `A[i]` 와 그대로 맞는다.
 *    갱신이 일어난 T8 부터 값이 바뀐다.
 * 2. **`tree` 의 다섯 칸은 `keyValue` 가 적는다.** 라벨에 담당 구간을 함께 달아, 어느 칸이
 *    어느 구간을 들고 있는지가 값과 같은 줄에서 확인된다.
 * 3. **`highlight` 는 지금 보는 `tree` 칸의 담당 구간, `marked` 는 연산이 가리키는 구간.**
 *    둘이 어긋나는 프레임이 「담당 구간을 이어 붙인다」가 실제로 일어나는 자리다.
 * 4. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `l`·`r`·`i`.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 칸을
 *    채우는 두 바퀴를 T1~T4 네 프레임으로 담았다 — 바퀴 안의 걸음을 더 쪼개면 그 구간에서
 *    「지금 보는 칸」이 빈 항목이 되고 규약 5 가 깨진다.
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "최하위 비트로 담당 구간을 정하는 트리 — A = [1, 2, 3, 4, 5]",
  result: "[15, 22, 14]",
  steps: [
    {
      title: "T1 칸마다 자기 몫만 채운다",
      detail:
        "첫 바퀴는 tree[k] 에 arr[k-1] 하나만 넣는다. 아직 어느 칸도 담당 구간 전체의 합이 아니다.",
      array: [1, 2, 3, 4, 5],
      highlight: [],
      marked: [],
      pointers: {},
      entries: [
        { label: "지금 보는 칸", value: "—" },
        { label: "하는 일", value: "자기 몫만 채웠다" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 2 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 4 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T2 칸 1 이 칸 2 에 넘긴다",
      detail:
        "1 + 담당 길이 1 = 2 가 받는 칸이다. 칸 2 가 1 을 받아 담당 구간 [1,2] 의 합 3 이 된다.",
      array: [1, 2, 3, 4, 5],
      highlight: [0, 1],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "지금 보는 칸", value: "칸 2" },
        { label: "하는 일", value: "칸 1 의 1 을 받는다 → 3" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 4 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T3 칸 2 가 칸 4 에 넘긴다",
      detail:
        "2 + 담당 길이 2 = 4 다. 칸 2 는 이미 완성돼 있으므로 넘기는 값이 3 이고, 칸 4 가 7 이 된다.",
      array: [1, 2, 3, 4, 5],
      highlight: [0, 1, 2, 3],
      marked: [],
      pointers: { i: 1 },
      entries: [
        { label: "지금 보는 칸", value: "칸 4" },
        { label: "하는 일", value: "칸 2 의 3 을 받는다 → 7" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 7 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T4 칸 3 이 칸 4 에 넘긴다 — 채우기 끝",
      detail:
        "칸 4 가 3 을 더 받아 10 이 된다. 칸 4 와 칸 5 는 받을 칸이 5 를 넘어 아무 데도 안 넘긴다.",
      array: [1, 2, 3, 4, 5],
      highlight: [0, 1, 2, 3],
      marked: [],
      pointers: { i: 2 },
      entries: [
        { label: "지금 보는 칸", value: "칸 4" },
        { label: "하는 일", value: "칸 3 의 3 을 받는다 → 10" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T5 질의 l=0 r=4 — 접두 합이 칸 5 부터 읽는다",
      detail:
        "구간 [0,4] 의 합은 앞 5 개의 합이다. 칸 5 를 읽어 5 를 얻고, 다음은 5 − 1 = 4 번 칸이다.",
      array: [1, 2, 3, 4, 5],
      highlight: [4],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 칸", value: "칸 5" },
        { label: "하는 일", value: "합 5, 다음은 칸 4" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T6 칸 4 를 더하면 앞 5 개가 채워진다",
      detail:
        "칸 5 가 [5,5] 를, 칸 4 가 [1,4] 를 담당한다. 겹치는 칸도 빠진 칸도 없이 5 + 10 = 15 다.",
      array: [1, 2, 3, 4, 5],
      highlight: [0, 1, 2, 3],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 칸", value: "칸 4" },
        { label: "하는 일", value: "합 15, 다음 칸 번호가 0 이라 끝" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T7 왼쪽 끝이 0 이라 뺄 것이 없다",
      detail:
        "앞 0 개의 합을 묻는 호출은 루프가 한 번도 실행되지 않아 0 이다. 답은 15 − 0 = 15 다.",
      array: [1, 2, 3, 4, 5],
      highlight: [],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 칸", value: "—" },
        { label: "하는 일", value: "15 − 0 = 15" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15]" },
      ],
    },
    {
      title: "T8 갱신 i=2 v=10 — 덮어쓰기를 변화량으로 바꾼다",
      detail:
        "옛 값이 3 이고 새 값이 10 이라 변화량은 7 이다. 논리 배열을 먼저 고치고 칸 3 부터 올라간다.",
      array: [1, 2, 10, 4, 5],
      highlight: [2],
      marked: [2],
      pointers: { i: 2 },
      entries: [
        { label: "지금 보는 칸", value: "—" },
        { label: "하는 일", value: "변화량 10 − 3 = 7" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 3 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15]" },
      ],
    },
    {
      title: "T9 칸 3 에 7 을 더한다",
      detail:
        "칸 3 의 담당 구간 [3,3] 이 고친 자리를 품는다. 다음은 3 + 담당 길이 1 = 4 번 칸이다.",
      array: [1, 2, 10, 4, 5],
      highlight: [2],
      marked: [2],
      pointers: { i: 2 },
      entries: [
        { label: "지금 보는 칸", value: "칸 3" },
        { label: "하는 일", value: "3 + 7 = 10 으로 고친다" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 10 },
        { label: "칸 4 · 담당 [1,4]", value: 10 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15]" },
      ],
    },
    {
      title: "T10 칸 4 에 7 을 더하고 끝난다",
      detail:
        "칸 4 의 담당 구간 [1,4] 도 고친 자리를 품는다. 다음은 4 + 4 = 8 이라 5 를 넘어 멈춘다.",
      array: [1, 2, 10, 4, 5],
      highlight: [0, 1, 2, 3],
      marked: [2],
      pointers: { i: 2 },
      entries: [
        { label: "지금 보는 칸", value: "칸 4" },
        { label: "하는 일", value: "10 + 7 = 17 로 고친다" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 10 },
        { label: "칸 4 · 담당 [1,4]", value: 17 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15]" },
      ],
    },
    {
      title: "T11 같은 질의를 다시 묻는다",
      detail:
        "칸 5 와 칸 4 를 다시 읽어 5 + 17 = 22 다. 같은 질의인데 답이 15 에서 22 로 바뀌었다.",
      array: [1, 2, 10, 4, 5],
      highlight: [0, 1, 2, 3, 4],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 칸", value: "칸 5 · 칸 4" },
        { label: "하는 일", value: "22 − 0 = 22" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 10 },
        { label: "칸 4 · 담당 [1,4]", value: 17 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15, 22]" },
      ],
    },
    {
      title: "T12 질의 l=2 r=3 — 오른쪽 끝까지의 합",
      detail:
        "앞 4 개의 합은 칸 4 하나로 끝난다. 17 이고, 여기서 앞 2 개의 합을 뺄 차례다.",
      array: [1, 2, 10, 4, 5],
      highlight: [0, 1, 2, 3],
      marked: [2, 3],
      pointers: { l: 2, r: 3 },
      entries: [
        { label: "지금 보는 칸", value: "칸 4" },
        { label: "하는 일", value: "앞 4 개의 합 17" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 10 },
        { label: "칸 4 · 담당 [1,4]", value: 17 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15, 22]" },
      ],
    },
    {
      title: "T13 왼쪽 앞부분을 덜어 낸다",
      detail:
        "앞 2 개의 합은 칸 2 하나로 3 이다. 17 − 3 = 14 가 구간 [2,3] 의 합이다.",
      array: [1, 2, 10, 4, 5],
      highlight: [0, 1],
      marked: [2, 3],
      pointers: { l: 2, r: 3 },
      entries: [
        { label: "지금 보는 칸", value: "칸 2" },
        { label: "하는 일", value: "17 − 3 = 14" },
        { label: "칸 1 · 담당 [1,1]", value: 1 },
        { label: "칸 2 · 담당 [1,2]", value: 3 },
        { label: "칸 3 · 담당 [3,3]", value: 10 },
        { label: "칸 4 · 담당 [1,4]", value: 17 },
        { label: "칸 5 · 담당 [5,5]", value: 5 },
        { label: "답", value: "[15, 22, 14]" },
      ],
    },
  ] satisfies Frame[],
};
