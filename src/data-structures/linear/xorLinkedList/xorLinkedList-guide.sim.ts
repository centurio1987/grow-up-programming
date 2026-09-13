import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 자료구조) 절의 연산 열을 **같은 순서로** 담는다. 프레임 하나가
 * 걸음 하나(T1~T12)이고, 제목이 `T#` 로 열린다. 순회는 노드 하나를 읽을 때마다 한 걸음이다.
 *
 * 칸 하나가 노드 하나이고 id 순서로 놓인다 — `값/x저장값`. 프레임의 값은 사람이 적은 값이라
 * 그것만으로는 실행과 같다는 보장이 없다. `xorLinkedList-guide.proof.ts` 의 `walk-viz` 블록이
 * **프레임마다 정본 실행과 맞대고** 어긋나면 던진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title:
    "XorLinkedList — 10 · 0 · 30 을 붙이고 같은 노드 표를 두 방향으로 읽는 열두 걸음",
  result: "[30,0,10]",
  steps: [
    {
      title: "T1 toArray()",
      detail:
        "시작 id 가 NIL 이라 반복을 한 번도 하지 않고 빈 배열을 돌려준다(④)",
      array: ["·", "·", "·"],
      highlight: [],
      pointers: {},
      entries: [
        { label: "head", value: 0 },
        { label: "tail", value: 0 },
        { label: "count", value: 0 },
        { label: "담은 값", value: "[]" },
      ],
    },
    {
      title: "T2 size()",
      detail: "순회하지 않고 세어 둔 count 0 을 돌려준다",
      array: ["·", "·", "·"],
      highlight: [],
      pointers: {},
      entries: [
        { label: "head", value: 0 },
        { label: "tail", value: 0 },
        { label: "count", value: 0 },
      ],
    },
    {
      title: "T3 append(10)",
      detail:
        "tailId 가 NIL 이라 빈 수열이다(①). 새 노드 id 1 의 x 는 그때의 tailId 0 이고, head 와 tail 이 모두 1 이 된다",
      array: ["10/x0", "·", "·"],
      highlight: [0],
      pointers: { head: 0, tail: 0 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 1 },
        { label: "count", value: 1 },
      ],
    },
    {
      title: "T4 append(0)",
      detail:
        "옛 꼬리 id 1 에 잇는다(②). 새 노드 id 2 의 x 는 1, 옛 꼬리의 x 는 0 ^ 2 = 2",
      array: ["10/x2", "0/x1", "·"],
      highlight: [0, 1],
      pointers: { head: 0, tail: 1 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 2 },
        { label: "count", value: 2 },
      ],
    },
    {
      title: "T5 append(30)",
      detail:
        "옛 꼬리 id 2 에 잇는다(②). 새 노드 id 3 의 x 는 2, 옛 꼬리의 x 는 1 ^ 3 = 2",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [1, 2],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
      ],
    },
    {
      title: "T6 size()",
      detail: "순회하지 않고 세어 둔 count 3 을 돌려준다",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
      ],
    },
    {
      title: "T7 toArray()",
      detail: "id 1 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 0 = 2 로 얻는다",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [0],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 0 },
        { label: "curr", value: 1 },
        { label: "다음 = x ^ prev", value: "2 ^ 0 = 2" },
        { label: "담은 값", value: "[10]" },
      ],
    },
    {
      title: "T8 toArray()",
      detail:
        "id 2 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 1 = 3 으로 얻는다",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [1],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 1 },
        { label: "curr", value: 2 },
        { label: "다음 = x ^ prev", value: "2 ^ 1 = 3" },
        { label: "담은 값", value: "[10 0]" },
      ],
    },
    {
      title: "T9 toArray()",
      detail:
        "id 3 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 2 = 0 으로 얻는다. 다음이 NIL 이라 끝낸다(④)",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [2],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 2 },
        { label: "curr", value: 3 },
        { label: "다음 = x ^ prev", value: "2 ^ 2 = 0" },
        { label: "담은 값", value: "[10 0 30]" },
      ],
    },
    {
      title: "T10 toArrayReverse()",
      detail: "id 3 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 0 = 2 로 얻는다",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [2],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 0 },
        { label: "curr", value: 3 },
        { label: "다음 = x ^ prev", value: "2 ^ 0 = 2" },
        { label: "담은 값", value: "[30]" },
      ],
    },
    {
      title: "T11 toArrayReverse()",
      detail: "id 2 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 3 = 1 로 얻는다",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [1],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 3 },
        { label: "curr", value: 2 },
        { label: "다음 = x ^ prev", value: "2 ^ 3 = 1" },
        { label: "담은 값", value: "[30 0]" },
      ],
    },
    {
      title: "T12 toArrayReverse()",
      detail:
        "id 1 의 값을 담고(③) 다음 id 를 x ^ prev = 2 ^ 2 = 0 으로 얻는다. 다음이 NIL 이라 끝낸다(④)",
      array: ["10/x2", "0/x2", "30/x2"],
      highlight: [0],
      pointers: { head: 0, tail: 2 },
      entries: [
        { label: "head", value: 1 },
        { label: "tail", value: 3 },
        { label: "count", value: 3 },
        { label: "prev", value: 2 },
        { label: "curr", value: 1 },
        { label: "다음 = x ^ prev", value: "2 ^ 2 = 0" },
        { label: "담은 값", value: "[30 0 10]" },
      ],
    },
  ] satisfies Frame[],
};
