import type { Frame } from "#guide-sim";

/** 현재 여섯 연산의 실행 상태. proof에서 실제 내부 배열과 대조한다. */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "원형 버퍼: 양 끝 연산과 용량 확장",
  result: "7",
  steps: [
    {
      title: "T1 popFront()",
      detail: "원소가 없으므로 null을 반환합니다. 덱은 빈 상태로 유지됩니다.",
      array: ["·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 0,
        },
        {
          label: "앞 끝부터",
          value: "[]",
        },
      ],
    },
    {
      title: "T2 peekBack()",
      detail:
        "뒤에서 조회해도 결과는 null입니다. 조회는 상태를 바꾸지 않습니다.",
      array: ["·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 0,
        },
        {
          label: "앞 끝부터",
          value: "[]",
        },
      ],
    },
    {
      title: "T3 pushBack(1)",
      detail: "0번 칸에 1을 넣습니다. head는 0이고 원소 수는 1입니다.",
      array: [1, "·", "·", "·", "·", "·", "·", "·"],
      highlight: [0],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 1,
        },
        {
          label: "앞 끝부터",
          value: "[1]",
        },
      ],
    },
    {
      title: "T4 pushBack(2)",
      detail: "다음 빈칸인 1번 칸에 2를 넣습니다.",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 2,
        },
        {
          label: "앞 끝부터",
          value: "[1 2]",
        },
      ],
    },
    {
      title: "T5 pushFront(0)",
      detail:
        "앞에 빈자리를 만들기 위해 head를 0에서 7로 옮깁니다. 7번 칸에 0을 넣고, 기존 값은 그대로 둡니다.",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [7],
      pointers: {
        head: 7,
      },
      entries: [
        {
          label: "head",
          value: 7,
        },
        {
          label: "count",
          value: 3,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2]",
        },
      ],
    },
    {
      title: "T6 peekFront()",
      detail:
        "head가 가리키는 7번 칸에서 0을 읽습니다. 원소는 제거하지 않습니다.",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [7],
      pointers: {
        head: 7,
      },
      entries: [
        {
          label: "head",
          value: 7,
        },
        {
          label: "count",
          value: 3,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2]",
        },
      ],
    },
    {
      title: "T7 peekBack()",
      detail:
        "뒤 원소의 위치는 (7 + 3 - 1) % 8 = 1입니다. 1번 칸의 2를 반환합니다.",
      array: [1, 2, "·", "·", "·", "·", "·", 0],
      highlight: [1],
      pointers: {
        head: 7,
      },
      entries: [
        {
          label: "head",
          value: 7,
        },
        {
          label: "count",
          value: 3,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2]",
        },
      ],
    },
    {
      title: "T8 popFront()",
      detail:
        "7번 칸의 0을 꺼내고 head를 0으로 옮깁니다. 남은 순서는 [1, 2]입니다.",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [7],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 2,
        },
        {
          label: "앞 끝부터",
          value: "[1 2]",
        },
      ],
    },
    {
      title: "T9 popBack()",
      detail: "1번 칸의 2를 꺼냅니다. 이제 1만 남습니다.",
      array: [1, "·", "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 1,
        },
        {
          label: "앞 끝부터",
          value: "[1]",
        },
      ],
    },
    {
      title: "T10 pushBack(2)",
      detail: "1번 칸에 2를 넣습니다.",
      array: [1, 2, "·", "·", "·", "·", "·", "·"],
      highlight: [1],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 2,
        },
        {
          label: "앞 끝부터",
          value: "[1 2]",
        },
      ],
    },
    {
      title: "T11 pushBack(3)",
      detail: "2번 칸에 3을 넣습니다.",
      array: [1, 2, 3, "·", "·", "·", "·", "·"],
      highlight: [2],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 3,
        },
        {
          label: "앞 끝부터",
          value: "[1 2 3]",
        },
      ],
    },
    {
      title: "T12 pushBack(4)",
      detail: "3번 칸에 4를 넣습니다.",
      array: [1, 2, 3, 4, "·", "·", "·", "·"],
      highlight: [3],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 4,
        },
        {
          label: "앞 끝부터",
          value: "[1 2 3 4]",
        },
      ],
    },
    {
      title: "T13 pushBack(5)",
      detail: "4번 칸에 5를 넣습니다.",
      array: [1, 2, 3, 4, 5, "·", "·", "·"],
      highlight: [4],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 5,
        },
        {
          label: "앞 끝부터",
          value: "[1 2 3 4 5]",
        },
      ],
    },
    {
      title: "T14 pushBack(6)",
      detail: "5번 칸에 6을 넣습니다.",
      array: [1, 2, 3, 4, 5, 6, "·", "·"],
      highlight: [5],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 6,
        },
        {
          label: "앞 끝부터",
          value: "[1 2 3 4 5 6]",
        },
      ],
    },
    {
      title: "T15 pushBack(7)",
      detail: "6번 칸에 7을 넣습니다. 빈칸은 하나 남았습니다.",
      array: [1, 2, 3, 4, 5, 6, 7, "·"],
      highlight: [6],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 7,
        },
        {
          label: "앞 끝부터",
          value: "[1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T16 pushFront(0)",
      detail:
        "head를 7로 옮기고 0을 넣습니다. 원소 8개가 들어 있어 배열이 가득 찼습니다.",
      array: [1, 2, 3, 4, 5, 6, 7, 0],
      highlight: [7],
      pointers: {
        head: 7,
      },
      entries: [
        {
          label: "head",
          value: 7,
        },
        {
          label: "count",
          value: 8,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T17 pushFront(-1)",
      detail:
        "용량을 16으로 늘리고 [0, 1, 2, 3, 4, 5, 6, 7] 순서로 복사합니다. head를 0으로 맞춘 뒤 15번 칸에 -1을 넣습니다.",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [15],
      pointers: {
        head: 15,
      },
      entries: [
        {
          label: "head",
          value: 15,
        },
        {
          label: "count",
          value: 9,
        },
        {
          label: "앞 끝부터",
          value: "[-1 0 1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T18 peekFront()",
      detail: "head가 가리키는 15번 칸의 -1을 반환합니다.",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [15],
      pointers: {
        head: 15,
      },
      entries: [
        {
          label: "head",
          value: 15,
        },
        {
          label: "count",
          value: 9,
        },
        {
          label: "앞 끝부터",
          value: "[-1 0 1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T19 peekBack()",
      detail:
        "뒤 원소는 (15 + 9 - 1) % 16 = 7번 칸에 있습니다. 값 7을 반환합니다.",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", -1],
      highlight: [7],
      pointers: {
        head: 15,
      },
      entries: [
        {
          label: "head",
          value: 15,
        },
        {
          label: "count",
          value: 9,
        },
        {
          label: "앞 끝부터",
          value: "[-1 0 1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T20 popFront()",
      detail: "15번 칸에서 -1을 꺼내고 head를 0으로 옮깁니다.",
      array: [0, 1, 2, 3, 4, 5, 6, 7, "·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [15],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 8,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2 3 4 5 6 7]",
        },
      ],
    },
    {
      title: "T21 popBack()",
      detail: "7번 칸에서 7을 꺼냅니다. 최종 덱은 [0, 1, 2, 3, 4, 5, 6]입니다.",
      array: [0, 1, 2, 3, 4, 5, 6, "·", "·", "·", "·", "·", "·", "·", "·", "·"],
      highlight: [7],
      pointers: {
        head: 0,
      },
      entries: [
        {
          label: "head",
          value: 0,
        },
        {
          label: "count",
          value: 7,
        },
        {
          label: "앞 끝부터",
          value: "[0 1 2 3 4 5 6]",
        },
      ],
    },
  ] satisfies Frame[],
};
