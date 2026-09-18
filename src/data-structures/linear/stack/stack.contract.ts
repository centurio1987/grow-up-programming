/**
 * `linear/stack` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./stack.ts` 헤더 한 곳이고(규약1), 여기
 * 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다. 헤더가 바뀌면 여기도 바뀐다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`. 축2는 공집합이다 — 헤더의 불변식 절이
 * "없다"이므로 검사할 성질이 없다. **항목이 없는 것과 내용이 없는 것은 다르다.**
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 세 행을 그대로 옮긴 표면. 스텁·정본·결함 fixture 가 모두 만족한다. */
export interface StackContract<T> {
  push(item: T): void;
  pop(): T | null;
  peek(): T | null;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

export const stackContract: ContractSpec<StackContract<number>, Model> = {
  name: "Stack",
  grade: "basic",
  model: () => [],

  ops: [
    {
      name: "push",
      arg: (rng) => Math.floor(rng() * 100),
      onImpl: (impl, arg) => {
        impl.push(arg as number);
      },
      onModel: (model, arg) => {
        model.push(arg as number);
      },
    },
    {
      name: "pop",
      arg: () => undefined,
      onImpl: (impl) => impl.pop(),
      onModel: (model) => (model.length === 0 ? null : (model.pop() as number)),
    },
    {
      name: "peek",
      arg: () => undefined,
      onImpl: (impl) => impl.peek(),
      onModel: (model) =>
        model.length === 0 ? null : (model[model.length - 1] as number),
    },
  ],

  edges: [
    {
      name: "빈 스택에서 pop·peek 은 null 이고 상태를 바꾸지 않는다",
      steps: [{ op: "pop" }, { op: "peek" }, { op: "pop" }, { op: "peek" }],
    },
    {
      name: "꺼내는 순서가 넣은 순서의 역순이다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "push", arg: 3 },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
      ],
    },
    {
      name: "pop 뒤의 peek 은 새 top 을 돌려준다",
      steps: [
        { op: "push", arg: 10 },
        { op: "push", arg: 20 },
        { op: "pop" },
        { op: "peek" },
        { op: "pop" },
        { op: "pop" },
      ],
    },
    {
      name: "비웠다가 다시 채워도 계약이 유지된다",
      steps: [
        { op: "push", arg: 7 },
        { op: "pop" },
        { op: "pop" },
        { op: "push", arg: 8 },
        { op: "peek" },
        { op: "pop" },
        { op: "pop" },
      ],
    },
  ],

  /** 헤더: "불변식. 없다." 공집합이지 미작성이 아니다. */
  invariants: [],

  scenarios: [
    {
      covers: ["push", "pop"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.push(i));
        for (let i = 0; i < n; i++) ctx.step(() => impl.pop());
      },
    },
    {
      covers: ["peek"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.peek();
          });
        }
      },
    },
  ],
};
