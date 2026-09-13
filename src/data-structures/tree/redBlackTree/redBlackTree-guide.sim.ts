import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 자료구조) 절의 연산 열 스무 번을 **같은 순서로** 담는다. 프레임
 * 하나가 호출 하나(T1~T20)이고, 제목이 `T#` 로 열린다. 트리는 **호출이 끝난 뒤의 모양**이고
 * 감시 노드는 그리지 않는다 — 빈 자리는 `null` 이다.
 *
 * 프레임의 값은 사람이 적은 값이라 그것만으로는 실행과 같다는 보장이 없다.
 * `redBlackTree-guide.proof.ts` 의 `walk-viz` 블록이 **프레임마다 정본 실행과 맞대고** 어긋나면
 * 던진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 */
export const walk = {
  view: ["tree", "keyValue"] as const,
  title:
    "RedBlackTree — 넣기 여섯과 지우기 둘로 고치기의 일곱 갈래를 모두 지나는 스무 걸음",
  result: "[30,40,50,90]",
  steps: [
    {
      title: "T1 new RedBlackTree<number>()",
      detail: "갈래 없이 끝난다",
      root: null,
      entries: [
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 0 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 0 },
        { label: "높이", value: 0 },
      ],
    },
    {
      title: "T2 max()",
      detail: "뿌리가 빈 자리다",
      root: null,
      entries: [
        { label: "갈래", value: "⑫" },
        { label: "지나간 노드", value: 0 },
        { label: "돌려준 값", value: "null" },
        { label: "size", value: 0 },
        { label: "높이", value: 0 },
      ],
    },
    {
      title: "T3 insert(10)",
      detail: "갈래 없이 끝난다",
      root: { id: "n10", label: "10 · B" },
      entries: [
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 0 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 1 },
        { label: "높이", value: 1 },
      ],
    },
    {
      title: "T4 insert(90)",
      detail: "갈래 없이 끝난다",
      root: {
        id: "n10",
        label: "10 · B",
        children: [null, { id: "n90", label: "90 · R" }],
      },
      entries: [
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 1 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 2 },
        { label: "높이", value: 2 },
      ],
    },
    {
      title: "T5 insert(20)",
      detail:
        "부모 90 을 오른쪽으로 회전 → 20 검게 · 조부모 10 빨갛게, 10 을 왼쪽으로 회전",
      root: {
        id: "n20",
        label: "20 · B",
        children: [
          { id: "n10", label: "10 · R" },
          { id: "n90", label: "90 · R" },
        ],
      },
      entries: [
        { label: "갈래", value: "③ ④" },
        { label: "지나간 노드", value: 5 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 3 },
        { label: "높이", value: 2 },
      ],
    },
    {
      title: "T6 insert(30)",
      detail: "부모 90 · 삼촌 10 검게, 조부모 20 빨갛게",
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
        { label: "갈래", value: "②" },
        { label: "지나간 노드", value: 3 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T7 insert(40)",
      detail:
        "부모 30 을 왼쪽으로 회전 → 40 검게 · 조부모 90 빨갛게, 90 을 오른쪽으로 회전",
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
        { label: "갈래", value: "③ ④" },
        { label: "지나간 노드", value: 6 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 5 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T8 insert(50)",
      detail: "부모 90 · 삼촌 30 검게, 조부모 40 빨갛게",
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
        { label: "갈래", value: "②" },
        { label: "지나간 노드", value: 4 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T9 insert(30)",
      detail: "30 이 이미 있다",
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
        { label: "갈래", value: "①" },
        { label: "지나간 노드", value: 3 },
        { label: "돌려준 값", value: "—" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T10 has(40)",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 2 },
        { label: "돌려준 값", value: "true" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T11 has(35)",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 3 },
        { label: "돌려준 값", value: "false" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T12 range(25, 55)",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 5 },
        { label: "돌려준 값", value: "[30 40 50]" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T13 range(50, 20)",
      detail: "50 > 20",
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
        { label: "갈래", value: "⑬" },
        { label: "지나간 노드", value: 0 },
        { label: "돌려준 값", value: "[]" },
        { label: "size", value: 6 },
        { label: "높이", value: 4 },
      ],
    },
    {
      title: "T14 delete(20)",
      detail:
        "오른쪽 최솟값 30 이 20 의 자리를 잇는다 → 가까운 조카 50 검게 · 형제 90 빨갛게, 90 을 오른쪽으로 회전 → 형제 50 에 부모 색, 부모 40 을 왼쪽으로 회전하고 끝",
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
        { label: "갈래", value: "⑦ ⑩ ⑪" },
        { label: "지나간 노드", value: 8 },
        { label: "돌려준 값", value: "true" },
        { label: "size", value: 5 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T15 delete(10)",
      detail:
        "10 의 자리를 빈 자리 가 잇는다 → 형제 50 검게 · 부모 30 빨갛게, 30 을 왼쪽으로 회전 → 형제 40 빨갛게, 물음이 30 으로",
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
        { label: "갈래", value: "⑥ ⑧ ⑨" },
        { label: "지나간 노드", value: 5 },
        { label: "돌려준 값", value: "true" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T16 delete(35)",
      detail: "35 가 없다",
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
        { label: "갈래", value: "⑤" },
        { label: "지나간 노드", value: 3 },
        { label: "돌려준 값", value: "false" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T17 min()",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 2 },
        { label: "돌려준 값", value: "30" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T18 max()",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 2 },
        { label: "돌려준 값", value: "90" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T19 size()",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 1 },
        { label: "돌려준 값", value: "4" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
    {
      title: "T20 toArray()",
      detail: "갈래 없이 끝난다",
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
        { label: "갈래", value: "—" },
        { label: "지나간 노드", value: 4 },
        { label: "돌려준 값", value: "[30 40 50 90]" },
        { label: "size", value: 4 },
        { label: "높이", value: 3 },
      ],
    },
  ] satisfies Frame[],
};
