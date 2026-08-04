/**
 * `linear/deque` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./deque.ts` 헤더 한 곳이고(규약1), 여기
 * 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 * 축2는 공집합이다 — 헤더의 불변식 절이 "없다"이기 때문이고, **등급이 낮아서가 아니다.**
 * 규약1의 판정 절차가 상한(2번)을 불변식(3번)보다 먼저 보므로, 불변식이 비어 있어도
 * 상한이 자명하지 않으면 `complexity` 가 된다. 이 구조가 그 첫 사례다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 여덟 행을 그대로 옮긴 표면. */
export interface DequeContract<T> {
  pushFront(item: T): void;
  pushBack(item: T): void;
  popFront(): T | null;
  popBack(): T | null;
  peekFront(): T | null;
  peekBack(): T | null;
  isEmpty(): boolean;
  size(): number;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

export const dequeContract: ContractSpec<DequeContract<number>, Model> = {
  name: "Deque",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "pushFront",
      arg: (rng) => Math.floor(rng() * 100),
      onImpl: (impl, arg) => {
        impl.pushFront(arg as number);
      },
      onModel: (model, arg) => {
        model.unshift(arg as number);
      },
    },
    {
      name: "pushBack",
      arg: (rng) => Math.floor(rng() * 100),
      onImpl: (impl, arg) => {
        impl.pushBack(arg as number);
      },
      onModel: (model, arg) => {
        model.push(arg as number);
      },
    },
    {
      name: "popFront",
      arg: () => undefined,
      onImpl: (impl) => impl.popFront(),
      onModel: (model) =>
        model.length === 0 ? null : (model.shift() as number),
    },
    {
      name: "popBack",
      arg: () => undefined,
      onImpl: (impl) => impl.popBack(),
      onModel: (model) => (model.length === 0 ? null : (model.pop() as number)),
    },
    {
      name: "peekFront",
      arg: () => undefined,
      onImpl: (impl) => impl.peekFront(),
      onModel: (model) => (model.length === 0 ? null : (model[0] as number)),
    },
    {
      name: "peekBack",
      arg: () => undefined,
      onImpl: (impl) => impl.peekBack(),
      onModel: (model) =>
        model.length === 0 ? null : (model[model.length - 1] as number),
    },
    {
      name: "isEmpty",
      arg: () => undefined,
      onImpl: (impl) => impl.isEmpty(),
      onModel: (model) => model.length === 0,
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
  ],

  edges: [
    {
      name: "빈 덱에서 pop·peek 은 양쪽 모두 null 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "popFront" },
        { op: "popBack" },
        { op: "peekFront" },
        { op: "peekBack" },
        { op: "size" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "원소가 하나면 양 끝이 같은 원소를 가리킨다",
      steps: [
        { op: "pushBack", arg: 7 },
        { op: "peekFront" },
        { op: "peekBack" },
        { op: "popBack" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "한쪽으로 넣고 반대쪽으로 빼면 넣은 순서로 나온다 (큐)",
      steps: [
        { op: "pushBack", arg: 1 },
        { op: "pushBack", arg: 2 },
        { op: "pushBack", arg: 3 },
        { op: "popFront" },
        { op: "popFront" },
        { op: "popFront" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "한쪽으로 넣고 같은 쪽으로 빼면 역순으로 나온다 (스택)",
      steps: [
        { op: "pushFront", arg: 1 },
        { op: "pushFront", arg: 2 },
        { op: "pushFront", arg: 3 },
        { op: "popFront" },
        { op: "popFront" },
        { op: "popFront" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "양쪽에서 넣으면 나중에 넣은 앞 원소가 더 앞에 온다",
      steps: [
        { op: "pushBack", arg: 1 },
        { op: "pushBack", arg: 2 },
        { op: "pushFront", arg: 0 },
        { op: "peekFront" },
        { op: "peekBack" },
        { op: "popFront" },
        { op: "popBack" },
        { op: "size" },
      ],
    },
    {
      name: "비웠다가 다시 채워도 양 끝이 어긋나지 않는다",
      steps: [
        { op: "pushFront", arg: 5 },
        { op: "popBack" },
        { op: "popFront" },
        { op: "pushBack", arg: 6 },
        { op: "peekFront" },
        { op: "peekBack" },
        { op: "size" },
      ],
    },
  ],

  /** 헤더: "불변식. 없다." 공집합이지 미작성이 아니다. */
  invariants: [],

  scenarios: [
    {
      covers: ["pushFront", "pushBack"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const front = ctx.rng() < 0.5;
          ctx.step(() => {
            if (front) impl.pushFront(i);
            else impl.pushBack(i);
          });
        }
      },
    },
    {
      // 앞으로만 넣는다. 배열 하나에 `unshift` 를 쓰는 구현에 최악이다.
      covers: ["pushFront"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.pushFront(i));
      },
    },
    {
      // 뒤로 넣고 앞으로 뺀다(큐 패턴). `shift` 를 쓰는 구현에 최악이고,
      // **두 배열 구현에는 최선이다** — 원소마다 한 번만 옮겨진다.
      covers: ["pushBack", "popFront"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.pushBack(i));
        for (let i = 0; i < n; i++) ctx.step(() => impl.popFront());
      },
    },
    {
      // 앞뒤를 번갈아 뺀다. **두 배열 구현이 무너지는 유일한 자리다** — 한쪽이 빌 때마다
      // 반대쪽 전부를 옮기므로 매 연산이 남은 원소 수에 비례한다.
      covers: ["popFront", "popBack"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.pushBack(i);
        for (let i = 0; i < n; i++) {
          const front = i % 2 === 0;
          ctx.step(() => {
            if (front) impl.popFront();
            else impl.popBack();
          });
        }
      },
    },
    {
      covers: ["peekFront", "peekBack", "isEmpty", "size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.pushBack(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.peekFront();
            impl.peekBack();
            impl.isEmpty();
            impl.size();
          });
        }
      },
    },
  ],
};
