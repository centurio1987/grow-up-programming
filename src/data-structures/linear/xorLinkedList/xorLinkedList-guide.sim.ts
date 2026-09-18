import type { Frame } from "#guide-sim";

/** 본문의 T1~T12와 대응하며, proof의 walk-viz가 각 프레임을 정본 실행과 대조합니다. */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "XOR 연결 리스트: 10, 0, 30을 붙이고 두 방향으로 읽기",
  result: "[30,0,10]",
  steps: [
    {
      title: "T1 toArray()",
      detail:
        "시작 id가 NIL(0)이므로 읽을 노드가 없습니다. 빈 배열을 반환합니다.",
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
      title: "T2 append(10)",
      detail:
        "빈 수열이므로 새 노드 id 1이 head이자 tail이 됩니다. 이웃이 없어 xorId는 0입니다.",
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
      title: "T3 append(0)",
      detail:
        "새 노드 id 2의 xorId는 앞 이웃 id 1입니다. 기존 마지막 노드 id 1의 xorId는 0 ^ 2 = 2로 바뀝니다.",
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
      title: "T4 append(30)",
      detail:
        "새 노드 id 3의 xorId는 앞 이웃 id 2입니다. 기존 마지막 노드 id 2의 xorId는 1 ^ 3 = 2로 바뀝니다.",
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
      title: "T5 toArray()",
      detail: "id 1의 값을 담고, 다음 id를 2 ^ 0 = 2로 구합니다.",
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
      title: "T6 toArray()",
      detail: "id 2의 값을 담고, 다음 id를 2 ^ 1 = 3으로 구합니다.",
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
      title: "T7 toArray()",
      detail:
        "id 3의 값을 담고, 다음 id를 2 ^ 2 = 0으로 구합니다. 다음 id가 NIL이므로 [10, 0, 30]을 반환합니다.",
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
      title: "T8 toArrayReverse()",
      detail: "id 3의 값을 담고, 다음 id를 2 ^ 0 = 2로 구합니다.",
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
      title: "T9 toArrayReverse()",
      detail: "id 2의 값을 담고, 다음 id를 2 ^ 3 = 1로 구합니다.",
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
      title: "T10 toArrayReverse()",
      detail:
        "id 1의 값을 담고, 다음 id를 2 ^ 2 = 0으로 구합니다. 다음 id가 NIL이므로 [30, 0, 10]을 반환합니다.",
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
