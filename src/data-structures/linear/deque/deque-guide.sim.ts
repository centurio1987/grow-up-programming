import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 자료구조) 절의 연산 열 스물세 번을 **같은 순서로** 담는다.
 * 프레임 하나가 걸음 하나(T1~T23)이고, 제목이 `T#` 로 열린다.
 *
 * 프레임의 칸 배치·`head`·`count` 는 사람이 적은 값이라 그것만으로는 실행과 같다는 보장이
 * 없다. `deque-guide.proof.ts` 의 `walk-viz` 블록이 **프레임마다 정본 실행과 맞대고**
 * 어긋나면 던진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "Deque — 칸 8 개에서 head 가 감기고 16 칸으로 늘어나는 스물세 걸음",
  result: "7",
  steps: [
    {
      title: "T1 popFront()",
      detail: "count 가 0 이라 null 을 돌려주고 상태를 바꾸지 않는다",
      array: ["·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 0 },
        { label: "앞 끝부터", value: "[]" },
      ],
    },
    {
      title: "T2 peekBack()",
      detail: "count 가 0 이라 null 을 돌려주고 상태를 바꾸지 않는다",
      array: ["·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 0 },
        { label: "앞 끝부터", value: "[]" },
      ],
    },
    {
      title: "T3 isEmpty()",
      detail: "count 가 0 이라 true 를 돌려준다",
      array: ["·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 0 },
        { label: "앞 끝부터", value: "[]" },
      ],
    },
    {
      title: "T4 pushBack(1)",
      detail: "wrap(0 + 0) = 0 번 칸에 1 을 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, "·", "·", "·", "·", "·", "·", "·"],
      highlight: [0],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 1 },
        { label: "앞 끝부터", value: "[1]" },
      ],
    },
    {
      title: "T5 pushBack(2)",
      detail: "wrap(0 + 1) = 1 번 칸에 2 를 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 2 },
        { label: "앞 끝부터", value: "[1 2]" },
      ],
    },
    {
      title: "T6 pushFront(0)",
      detail:
        "wrap(0 - 1) = 7 번 칸에 0 을 쓴다. 앞 끝이 7 번 칸으로 감기고, 다른 원소는 옮기지 않는다",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [7],
      pointers: { head: 7 },
      entries: [
        { label: "head", value: 7 },
        { label: "count", value: 3 },
        { label: "앞 끝부터", value: "[0 1 2]" },
      ],
    },
    {
      title: "T7 peekFront()",
      detail: "head 가 가리키는 7 번 칸의 0 을 돌려준다. 상태는 그대로다",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [7],
      pointers: { head: 7 },
      entries: [
        { label: "head", value: 7 },
        { label: "count", value: 3 },
        { label: "앞 끝부터", value: "[0 1 2]" },
      ],
    },
    {
      title: "T8 peekBack()",
      detail: "wrap(7 + 3 - 1) = 1 번 칸의 2 를 돌려준다. 상태는 그대로다",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [1],
      pointers: { head: 7 },
      entries: [
        { label: "head", value: 7 },
        { label: "count", value: 3 },
        { label: "앞 끝부터", value: "[0 1 2]" },
      ],
    },
    {
      title: "T9 popFront()",
      detail:
        "head 가 가리키는 7 번 칸의 0 을 꺼내 비우고 head 를 wrap(7 + 1) = 0 으로 옮긴다",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [7],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 2 },
        { label: "앞 끝부터", value: "[1 2]" },
      ],
    },
    {
      title: "T10 popBack()",
      detail: "뒤 끝 칸은 wrap(0 + 2 - 1) = 1 번이다. 그 칸의 2 를 꺼내 비운다",
      array: [1, "·", "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 1 },
        { label: "앞 끝부터", value: "[1]" },
      ],
    },
    {
      title: "T11 pushBack(2)",
      detail: "wrap(0 + 1) = 1 번 칸에 2 를 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 2 },
        { label: "앞 끝부터", value: "[1 2]" },
      ],
    },
    {
      title: "T12 pushBack(3)",
      detail: "wrap(0 + 2) = 2 번 칸에 3 을 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, "·", "·", "·", "·", "·"],
      highlight: [2],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 3 },
        { label: "앞 끝부터", value: "[1 2 3]" },
      ],
    },
    {
      title: "T13 pushBack(4)",
      detail: "wrap(0 + 3) = 3 번 칸에 4 를 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, 4, "·", "·", "·", "·"],
      highlight: [3],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 4 },
        { label: "앞 끝부터", value: "[1 2 3 4]" },
      ],
    },
    {
      title: "T14 pushBack(5)",
      detail: "wrap(0 + 4) = 4 번 칸에 5 를 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, 4, 5, "·", "·", "·"],
      highlight: [4],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 5 },
        { label: "앞 끝부터", value: "[1 2 3 4 5]" },
      ],
    },
    {
      title: "T15 pushBack(6)",
      detail: "wrap(0 + 5) = 5 번 칸에 6 을 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, 4, 5, 6, "·", "·"],
      highlight: [5],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 6 },
        { label: "앞 끝부터", value: "[1 2 3 4 5 6]" },
      ],
    },
    {
      title: "T16 pushBack(7)",
      detail: "wrap(0 + 6) = 6 번 칸에 7 을 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, 4, 5, 6, 7, "·"],
      highlight: [6],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 7 },
        { label: "앞 끝부터", value: "[1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T17 pushFront(0)",
      detail: "wrap(0 - 1) = 7 번 칸에 0 을 쓴다. 다른 원소는 옮기지 않는다",
      array: [1, 2, 3, 4, 5, 6, 7, 0],
      highlight: [7],
      pointers: { head: 7 },
      entries: [
        { label: "head", value: 7 },
        { label: "count", value: 8 },
        { label: "앞 끝부터", value: "[0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T18 size()",
      detail: "count 를 읽어 8 을 돌려준다",
      array: [1, 2, 3, 4, 5, 6, 7, 0],
      highlight: [],
      pointers: { head: 7 },
      entries: [
        { label: "head", value: 7 },
        { label: "count", value: 8 },
        { label: "앞 끝부터", value: "[0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T19 pushFront(-1)",
      detail:
        "칸 8 개가 가득 찼다. 16 칸으로 늘려 원소 8 개를 앞 끝부터 0~7 번 칸에 차례로 옮기고 head 를 0 으로 되돌린 뒤, wrap(0 - 1) = 15 번 칸에 -1 을 쓴다",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [15],
      pointers: { head: 15 },
      entries: [
        { label: "head", value: 15 },
        { label: "count", value: 9 },
        { label: "앞 끝부터", value: "[-1 0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T20 peekFront()",
      detail: "head 가 가리키는 15 번 칸의 -1 을 돌려준다. 상태는 그대로다",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [15],
      pointers: { head: 15 },
      entries: [
        { label: "head", value: 15 },
        { label: "count", value: 9 },
        { label: "앞 끝부터", value: "[-1 0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T21 peekBack()",
      detail: "wrap(15 + 9 - 1) = 7 번 칸의 7 을 돌려준다. 상태는 그대로다",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [7],
      pointers: { head: 15 },
      entries: [
        { label: "head", value: 15 },
        { label: "count", value: 9 },
        { label: "앞 끝부터", value: "[-1 0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T22 popFront()",
      detail:
        "head 가 가리키는 15 번 칸의 -1 을 꺼내 비우고 head 를 wrap(15 + 1) = 0 으로 옮긴다",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [15],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 8 },
        { label: "앞 끝부터", value: "[0 1 2 3 4 5 6 7]" },
      ],
    },
    {
      title: "T23 popBack()",
      detail: "뒤 끝 칸은 wrap(0 + 8 - 1) = 7 번이다. 그 칸의 7 을 꺼내 비운다",
      array: [0, 1, 2, 3, 4, 5, 6, "·", "·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [7],
      pointers: { head: 0 },
      entries: [
        { label: "head", value: 0 },
        { label: "count", value: 7 },
        { label: "앞 끝부터", value: "[0 1 2 3 4 5 6]" },
      ],
    },
  ] satisfies Frame[],
};
