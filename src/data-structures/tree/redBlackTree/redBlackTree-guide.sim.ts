import type { Frame } from "#guide-sim";

/**
 * 수행으로 알아보는 자료구조 절의 레드블랙 트리 호출 열아홉 번을 같은 순서로 담습니다.
 * 프레임 하나가 호출 하나(T1~T20)이고, 트리는 호출이 끝난 뒤의 모양입니다.
 * 빈 자리 노드는 그리지 않고 `null`로 둡니다.
 *
 * `redBlackTree-guide.proof.ts`의 `simulation` 블록이 프레임마다 정본 실행과 비교합니다.
 * `steps`는 인라인 배열 리터럴이어야 합니다.
 */
export const walk = {
  view: ["tree", "keyValue"] as const,
  title:
    "레드블랙 트리 — 넣기 일곱 번과 지우기 세 번으로 고치기의 모든 경우를 지나는 호출 스무 번",
  result: "[30,40,50,90]",
  steps: [
    {
      title: "T1 new RedBlackTree<number>()",
      detail: "빈 트리를 만듭니다. 뿌리는 검은 빈 자리 노드를 가리킵니다.",
      root: null,
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 0 },
        { label: "원소 수", value: 0 },
        { label: "높이", value: 0 },
      ],
    },
    {
      title: "T2 max()",
      detail: "트리가 비어 있으므로 null을 반환합니다.",
      root: null,
      entries: [
        { label: "반환값", value: "null" },
        { label: "지나간 노드", value: 0 },
        { label: "원소 수", value: 0 },
        { label: "높이", value: 0 },
      ],
    },
    {
      title: "T3 insert(10)",
      detail: "빈 트리였으므로 10이 뿌리가 되고 검은색으로 칠해집니다.",
      root: { id: "n10", label: "10 · B" },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 0 },
        { label: "원소 수", value: 1 },
        { label: "높이", value: 1 },
      ],
    },
    {
      title: "T4 insert(90)",
      detail: "90을 빨간 노드로 붙였고 부모가 검은색이므로 고칠 것이 없습니다.",
      root: {
        id: "n10",
        label: "10 · B",
        children: [null, { id: "n90", label: "90 · R" }],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 1 },
        { label: "원소 수", value: 2 },
        { label: "높이", value: 2 },
      ],
    },
    {
      title: "T5 insert(20)",
      detail:
        "새 노드가 부모의 안쪽 자식이므로 부모 90을 오른쪽으로 먼저 회전합니다. 20을 검게, 10을 빨갛게 바꾸고 10을 왼쪽으로 회전합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · R" },
          { id: "n90", label: "90 · R" },
        ],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 5 },
        { label: "원소 수", value: 3 },
        { label: "높이", value: 2 },
      ],
    },
    {
      title: "T6 insert(30)",
      detail:
        "부모 90과 삼촌 10이 모두 빨간색이므로 둘을 검게, 조부모 20을 빨갛게 바꿉니다. 뿌리 20이 빨간색이 되었으므로 다시 검게 칠합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n90",
            label: "90 · B",
            children: [{ id: "n30", label: "30 · R" }, null],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 3 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T7 insert(40)",
      detail:
        "새 노드가 부모의 안쪽 자식이므로 부모 30을 왼쪽으로 먼저 회전합니다. 40을 검게, 90을 빨갛게 바꾸고 90을 오른쪽으로 회전합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · B",
            children: [
              { id: "n30", label: "30 · R" },
              { id: "n90", label: "90 · R" },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 6 },
        { label: "원소 수", value: 5 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T8 insert(50)",
      detail:
        "부모 90과 삼촌 30이 모두 빨간색이므로 둘을 검게, 조부모 40을 빨갛게 바꿉니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 4 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T9 insert(30)",
      detail: "30이 이미 있으므로 트리를 바꾸지 않습니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "—" },
        { label: "지나간 노드", value: 3 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T10 has(40)",
      detail: "40을 찾아 내려가 true를 반환합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "true" },
        { label: "지나간 노드", value: 2 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T11 has(35)",
      detail: "35를 찾아 내려가 false를 반환합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "false" },
        { label: "지나간 노드", value: 3 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T12 range(25, 55)",
      detail: "25 이상 55 이하인 값 [30, 40, 50]을 오름차순으로 반환합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "[30, 40, 50]" },
        { label: "지나간 노드", value: 5 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T13 range(50, 20)",
      detail: "low 50이 high 20보다 크므로 빈 배열을 반환합니다.",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n40",
            label: "40 · R",
            children: [
              { id: "n30", label: "30 · B" },
              {
                id: "n90",
                label: "90 · B",
                children: [{ id: "n50", label: "50 · R" }, null],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "[]" },
        { label: "지나간 노드", value: 0 },
        { label: "원소 수", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T14 delete(20)",
      detail:
        "자식이 둘이므로 오른쪽 부분트리의 최솟값 30이 20의 자리와 색을 잇습니다. 먼 조카가 검은색이고 가까운 조카 50이 빨간색이므로 50을 검게, 형제 90을 빨갛게 바꾸고 형제를 오른쪽으로 회전합니다. 형제 50이 부모의 색을 받고, 부모 40과 먼 조카를 검게 바꾼 뒤 부모를 왼쪽으로 회전하고 끝냅니다.",
      root: {
        id: "n30",
        label: "30 · B",
        children: [
          { id: "n10", label: "10 · B" },
          {
            id: "n50",
            label: "50 · R",
            children: [
              { id: "n40", label: "40 · B" },
              { id: "n90", label: "90 · B" },
            ],
          },
        ],
      },
      entries: [
        { label: "반환값", value: "true" },
        { label: "지나간 노드", value: 8 },
        { label: "원소 수", value: 5 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T15 delete(10)",
      detail:
        "자식이 없는 10을 떼어 냅니다. 형제 50이 빨간색이므로 50을 검게, 부모 30을 빨갛게 바꾸고 부모를 왼쪽으로 회전합니다. 형제 40의 두 자식이 모두 검은색이므로 40을 빨갛게 바꾸고 부모 30에서 다시 확인합니다. 30이 빨간색이므로 검게 바꾸고 끝냅니다.",
      root: {
        id: "n50",
        label: "50 · B",
        children: [
          {
            id: "n30",
            label: "30 · B",
            children: [null, { id: "n40", label: "40 · R" }],
          },
          { id: "n90", label: "90 · B" },
        ],
      },
      entries: [
        { label: "반환값", value: "true" },
        { label: "지나간 노드", value: 5 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T16 delete(35)",
      detail: "35가 없으므로 false를 반환합니다.",
      root: {
        id: "n50",
        label: "50 · B",
        children: [
          {
            id: "n30",
            label: "30 · B",
            children: [null, { id: "n40", label: "40 · R" }],
          },
          { id: "n90", label: "90 · B" },
        ],
      },
      entries: [
        { label: "반환값", value: "false" },
        { label: "지나간 노드", value: 3 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T17 min()",
      detail: "왼쪽으로 끝까지 내려가 30을 반환합니다.",
      root: {
        id: "n50",
        label: "50 · B",
        children: [
          {
            id: "n30",
            label: "30 · B",
            children: [null, { id: "n40", label: "40 · R" }],
          },
          { id: "n90", label: "90 · B" },
        ],
      },
      entries: [
        { label: "반환값", value: "30" },
        { label: "지나간 노드", value: 2 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T18 max()",
      detail: "오른쪽으로 끝까지 내려가 90을 반환합니다.",
      root: {
        id: "n50",
        label: "50 · B",
        children: [
          {
            id: "n30",
            label: "30 · B",
            children: [null, { id: "n40", label: "40 · R" }],
          },
          { id: "n90", label: "90 · B" },
        ],
      },
      entries: [
        { label: "반환값", value: "90" },
        { label: "지나간 노드", value: 2 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T19 toArray()",
      detail:
        "중위 순회로 [30, 40, 50, 90]을 반환합니다. 이것이 마지막 결과입니다.",
      root: {
        id: "n50",
        label: "50 · B",
        children: [
          {
            id: "n30",
            label: "30 · B",
            children: [null, { id: "n40", label: "40 · R" }],
          },
          { id: "n90", label: "90 · B" },
        ],
      },
      entries: [
        { label: "반환값", value: "[30, 40, 50, 90]" },
        { label: "지나간 노드", value: 4 },
        { label: "원소 수", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
  ] satisfies Frame[],
};
