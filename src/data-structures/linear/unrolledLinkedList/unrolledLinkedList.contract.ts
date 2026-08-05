/**
 * `linear/unrolledLinkedList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./unrolledLinkedList.ts` 헤더 한 곳이고
 * (규약1), 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **적대적 시나리오가 넷인 것은 배제해야 할 구현이 둘이고 서로 반대쪽에서 걸리기 때문이다**
 * (불변 사실 24). 배열 하나는 위치 삽입·제거에서 걸리고 위치 읽기는 오히려 상수다.
 * 크기를 고정한 묶음 목록은 위치 연산 전부와 뒤 끝 빼기에서 걸리고 넣기는 상수다.
 * 한쪽만 두면 다른 쪽이 통과한다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 일곱 행을 그대로 옮긴 표면. */
export interface UnrolledLinkedListContract<T> {
  push(item: T): void;
  pop(): T | null;
  get(index: number): T | null;
  insert(index: number, item: T): void;
  remove(index: number): T | null;
  size(): number;
  toArray(): T[];
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

/**
 * 위치 인자의 범위. 음수와 길이 밖을 함께 뽑아 **범위 밖 규약도 교차검증에 걸리게** 한다.
 * 인자 범위를 길이 안으로만 잡으면 `null` 을 돌려주기로 한 줄이 검사되지 않는다.
 */
function position(rng: () => number): number {
  return Math.floor(rng() * 24) - 4;
}

export const unrolledLinkedListContract: ContractSpec<
  UnrolledLinkedListContract<number>,
  Model
> = {
  name: "UnrolledLinkedList",
  grade: "complexity",
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
      name: "get",
      arg: (rng) => position(rng),
      onImpl: (impl, arg) => impl.get(arg as number),
      onModel: (model, arg) => {
        const index = arg as number;
        if (index < 0 || index >= model.length) return null;
        return model[index] as number;
      },
    },
    {
      name: "insert",
      arg: (rng) => [position(rng), Math.floor(rng() * 100)],
      onImpl: (impl, arg) => {
        const [index, item] = arg as [number, number];
        impl.insert(index, item);
      },
      onModel: (model, arg) => {
        const [index, item] = arg as [number, number];
        if (index < 0 || index > model.length) return undefined;
        model.splice(index, 0, item);
        return undefined;
      },
    },
    {
      name: "remove",
      arg: (rng) => position(rng),
      onImpl: (impl, arg) => impl.remove(arg as number),
      onModel: (model, arg) => {
        const index = arg as number;
        if (index < 0 || index >= model.length) return null;
        return model.splice(index, 1)[0] as number;
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
    {
      name: "toArray",
      arg: () => undefined,
      onImpl: (impl) => impl.toArray(),
      onModel: (model) => [...model],
    },
  ],

  edges: [
    {
      name: "빈 수열에서 pop·get·remove 는 null 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "pop" },
        { op: "get", arg: 0 },
        { op: "remove", arg: 0 },
        { op: "size" },
        { op: "toArray" },
      ],
    },
    {
      name: "빈 수열에 insert(0) 은 push 와 같고, insert(1) 은 범위 밖이라 아무것도 안 한다",
      steps: [
        { op: "insert", arg: [1, 9] },
        { op: "size" },
        { op: "insert", arg: [0, 7] },
        { op: "get", arg: 0 },
        { op: "size" },
      ],
    },
    {
      name: "index === size() 는 push 와 같다 — 경계 하나 차이로 무시되면 안 된다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "insert", arg: [2, 3] },
        { op: "toArray" },
        { op: "insert", arg: [4, 4] },
        { op: "toArray" },
      ],
    },
    {
      name: "앞에 끼워 넣으면 뒤 원소의 위치가 한 칸씩 밀린다",
      steps: [
        { op: "push", arg: 10 },
        { op: "push", arg: 20 },
        { op: "push", arg: 30 },
        { op: "insert", arg: [0, 5] },
        { op: "get", arg: 1 },
        { op: "get", arg: 3 },
        { op: "toArray" },
      ],
    },
    {
      name: "가운데를 빼면 뒤가 한 칸씩 당겨진다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "push", arg: 3 },
        { op: "remove", arg: 1 },
        { op: "get", arg: 1 },
        { op: "size" },
        { op: "toArray" },
      ],
    },
    {
      name: "음수 위치는 앞에서부터 세지 않는다 — 전부 범위 밖이다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "get", arg: -1 },
        { op: "remove", arg: -1 },
        { op: "insert", arg: [-1, 9] },
        { op: "toArray" },
      ],
    },
    {
      name: "비웠다가 다시 채워도 위치가 어긋나지 않는다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "insert", arg: [0, 8] },
        { op: "get", arg: 0 },
        { op: "size" },
      ],
    },
  ],

  invariants: [
    {
      name: "세어 둔 수와 늘어놓은 수가 같다",
      check: (impl) => {
        const counted = impl.size();
        const listed = impl.toArray().length;
        if (counted === listed) return null;
        return `size()=${counted} 인데 toArray().length=${listed} 다`;
      },
    },
    {
      name: "위치로 짚은 원소와 늘어놓은 원소가 같다",
      check: (impl) => {
        const listed = impl.toArray();
        for (let index = 0; index < listed.length; index++) {
          const probed = impl.get(index);
          if (probed !== listed[index]) {
            return `get(${index})=${probed} 인데 toArray()[${index}]=${listed[index]} 다`;
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["push"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.push(i));
      },
    },
    {
      // 전부 채우고 전부 뺀다. **진단된 결함이 정확히 이 자리다** — 뒤 끝을 지우고 나서
      // 그 앞을 앞에서부터 찾아야 하는 구현은 묶음 하나가 빌 때마다 묶음 수만큼 밟는다.
      // 묶음 크기를 상수로 고정하면 묶음 수가 n 에 비례하므로 그 값이 O(n) 이 된다.
      covers: ["pop"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.pop());
      },
    },
    {
      // 무작위 위치 읽기. 묶음 수가 n 에 비례하는 구현이 걸린다.
      // 배열 하나에는 최선이다 — 이 시나리오만으로는 배열을 배제하지 못한다.
      covers: ["get"],
      qualifier: "amortized",
      bound: "O(sqrt n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * n);
          ctx.step(() => impl.get(at));
        }
      },
    },
    {
      // 무작위 위치 삽입. **배열 하나가 걸리는 자리다** — 끼운 자리 뒤가 전부 밀린다.
      // 위 읽기 시나리오와 둘 다 필요하다: 배열은 여기서만, 고정 묶음은 위에서도 걸린다.
      covers: ["insert"],
      qualifier: "amortized",
      bound: "O(sqrt n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * (i + 1));
          ctx.step(() => impl.insert(at, i));
        }
      },
    },
    {
      // 무작위 위치 제거. 삽입과 대칭이지만 같은 구현이 같은 이유로 걸린다고 볼 수 없다 —
      // 뒤에서부터 줄어드는 동안 묶음 수가 어떻게 되는지가 삽입과 반대다.
      covers: ["remove"],
      qualifier: "amortized",
      bound: "O(sqrt n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * (n - i));
          ctx.step(() => impl.remove(at));
        }
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n / 4; i++) ctx.step(() => impl.size());
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // 반복 횟수가 n 이 아닌 이유는 O(n) 연산을 n 회 돌면 시나리오가 O(n^2) 이 되기
      // 때문이다. worst 는 최대값으로 판정하므로 표본이 적어도 된다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < 8; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
