/**
 * `linear/singlyLinkedList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./singlyLinkedList.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **배제해야 할 계열이 둘이고 서로 반대쪽에서 걸린다.** 뒤 끝을 기억하지 않는 사슬은 뒤에 넣기에서,
 * 앞 끝을 배열 첫 칸에 두는 구현은 앞에 넣기 · 앞에서 빼기에서 걸린다. 넣기 둘을 한 시나리오로 묶지
 * 않고 행마다 따로 둔 이유다(불변 사실 24).
 *
 * **`toArray` 는 관측한 뒤 돌려받은 배열을 일부러 망가뜨린다.** 「돌려준 배열을 고쳐도 수열은 바뀌지
 * 않는다」가 다음 관측에서 드러나게 하려는 것이다(`graph-repr/graphAdjList` 와 같은 처리).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface SinglyLinkedListContract<T> {
  prepend(value: T): void;
  append(value: T): void;
  removeFirst(): T | null;
  toArray(): T[];
  size(): number;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

/** 축1 무작위 값. 0 과 음수가 섞이게 잡는다. */
function someValue(rng: () => number): number {
  return Math.floor(rng() * 100) - 20;
}

export const singlyLinkedListContract: ContractSpec<
  SinglyLinkedListContract<number>,
  Model
> = {
  name: "SinglyLinkedList",
  grade: "invariant",
  model: () => [],

  ops: [
    {
      name: "prepend",
      arg: (rng) => someValue(rng),
      onImpl: (impl, arg) => {
        impl.prepend(arg as number);
      },
      onModel: (model, arg) => {
        model.unshift(arg as number);
      },
    },
    {
      name: "append",
      arg: (rng) => someValue(rng),
      onImpl: (impl, arg) => {
        impl.append(arg as number);
      },
      onModel: (model, arg) => {
        model.push(arg as number);
      },
    },
    {
      name: "removeFirst",
      arg: () => undefined,
      onImpl: (impl) => impl.removeFirst(),
      onModel: (model) =>
        model.length === 0 ? null : (model.shift() as number),
    },
    {
      name: "toArray",
      arg: () => undefined,
      onImpl: (impl) => {
        const listed = impl.toArray();
        const seen = [...listed];
        // 돌려받은 배열을 망가뜨린다. 수열이 그 배열을 그대로 들고 있으면 다음 관측에서 갈린다.
        listed.push(-999);
        if (listed.length > 1) listed[0] = -998;
        return seen;
      },
      onModel: (model) => [...model],
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
      name: "빈 수열에서 removeFirst 는 null 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "removeFirst" },
        { op: "size" },
        { op: "toArray" },
        { op: "removeFirst" },
        { op: "size" },
      ],
    },
    {
      name: "앞에 넣은 것은 앞 끝, 뒤에 넣은 것은 뒤 끝이 된다",
      steps: [
        { op: "append", arg: 2 },
        { op: "prepend", arg: 1 },
        { op: "append", arg: 3 },
        { op: "prepend", arg: 0 },
        { op: "toArray" },
        { op: "size" },
      ],
    },
    {
      // 원소가 하나뿐일 때 빼면 앞 끝과 뒤 끝이 함께 사라져야 한다. 뒤 끝 기억을 안 비우면
      // 다음 append 가 사라진 자리 뒤에 붙는다.
      name: "하나를 넣고 빼서 비운 뒤에 뒤에 넣어도 그 원소 하나만 남는다",
      steps: [
        { op: "append", arg: 1 },
        { op: "removeFirst" },
        { op: "append", arg: 2 },
        { op: "toArray" },
        { op: "append", arg: 3 },
        { op: "toArray" },
        { op: "size" },
      ],
    },
    {
      // 빈 수열에 앞으로 넣으면 그 원소가 뒤 끝이기도 하다. 뒤 끝 기억을 안 채우면 다음
      // append 가 갈린다.
      name: "빈 수열에 앞으로 넣은 원소는 뒤 끝이기도 하다",
      steps: [
        { op: "prepend", arg: 5 },
        { op: "append", arg: 6 },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "prepend", arg: 7 },
        { op: "append", arg: 8 },
        { op: "toArray" },
      ],
    },
    {
      // 넣는 자리를 둘로 나눠 드는 구현이 앞 무더기를 다 쓴 뒤 뒤 무더기를 옮기는 자리다.
      name: "앞과 뒤에 섞어 넣고 앞에서 전부 빼면 늘어놓은 순서대로 나온다",
      steps: [
        { op: "append", arg: 3 },
        { op: "prepend", arg: 2 },
        { op: "append", arg: 4 },
        { op: "prepend", arg: 1 },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "prepend", arg: 9 },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "removeFirst" },
        { op: "size" },
      ],
    },
    {
      name: "돌려받은 배열을 고쳐도 수열은 그대로다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "toArray" },
        { op: "toArray" },
        { op: "size" },
      ],
    },
    {
      name: "같은 값을 여러 번 넣어도 넣은 수만큼 담긴다",
      steps: [
        { op: "append", arg: 0 },
        { op: "prepend", arg: 0 },
        { op: "append", arg: 0 },
        { op: "size" },
        { op: "removeFirst" },
        { op: "toArray" },
      ],
    },
  ],

  invariants: [
    {
      name: "세어 둔 원소 수와 늘어놓은 원소 수가 같다",
      check: (impl) => {
        const counted = impl.size();
        const listed = impl.toArray().length;
        if (counted === listed) return null;
        return `size()=${counted} 인데 toArray().length=${listed} 다`;
      },
    },
  ],

  scenarios: [
    {
      // 상각이므로 n 회 측정한다(§규약2 시나리오 규칙 4). 앞 끝을 배열 첫 칸에 두는 구현이
      // 넣을 때마다 나머지를 민다.
      covers: ["prepend"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.prepend(i));
      },
    },
    {
      // 뒤 끝을 기억하지 않는 사슬이 붙일 때마다 앞에서부터 훑는다.
      covers: ["append"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.append(i));
      },
    },
    {
      // **뒤에 넣어 채우고 앞에서 전부 뺀다.** 앞 끝을 배열 첫 칸에 두는 구현이 뺄 때마다 나머지를
      // 당긴다. 뒤에 넣어 채우는 것은 넣는 자리를 둘로 나눠 드는 구현이 한 번은 옮기게 하려는
      // 것이다 — 그 구현은 옮기는 호출 하나가 O(n) 이어도 평균이 상수라 통과해야 한다(헤더
      // 「`removeFirst` 를 `amortized` 로 적은 것」).
      covers: ["removeFirst"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.append(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.removeFirst());
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          if (i % 2 === 0) impl.append(i);
          else impl.prepend(i);
        }
        for (let i = 0; i < 3; i++) ctx.step(() => impl.toArray());
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.append(i);
        for (let i = 0; i < 8; i++) ctx.step(() => impl.size());
      },
    },
  ],
};
