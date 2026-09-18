/**
 * `tree/redBlackTree` 계약 스위트(규약2).
 *
 * 계약은 `./redBlackTree.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가
 * 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * 허용치가 ±30% 다.
 *
 * **적대적 시나리오가 둘인 것이 이 스위트의 요점이다.** 계약이 여덟 행을 전부 `worst`
 * 로 적었고, 그 한정자가 배제하려는 계열이 **둘이며 서로 다른 입력에서 걸린다**
 * (불변 사실 63).
 * - 오름차순 넣기 — 균형을 스스로 잡지 않는 탐색 트리가 사슬이 된다.
 * - 순차 조회 — **조회가 트리를 고쳐 쓰는 계열**(스플레이)이 단일 호출에서 튄다. 같은
 *   구현이 무작위 조회에서는 통과하므로, 이 시나리오가 없으면 `worst` 와 `amortized`
 *   계약의 스위트가 서로를 통과시킨다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface RedBlackTreeContract<T> {
  insert(item: T): void;
  delete(item: T): boolean;
  has(item: T): boolean;
  min(): T | null;
  max(): T | null;
  range(low: T, high: T): T[];
  toArray(): T[];
}

/**
 * 축1 참조 모델. 정렬된 중복 없는 배열이다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 *
 * 같은 정렬 배열이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/sortedArraySet.ts`). 축이 무엇을 보는지가 다르기 때문이다.
 */
type Model = number[];

/** 이미 담긴 값을 다시 넣는 일과 없는 값을 지우는 일이 자주 나오도록 좁게 잡는다. */
const DOMAIN = 24;

function insertSorted(model: Model, item: number): void {
  let at = 0;
  while (at < model.length && (model[at] as number) < item) at++;
  if (at < model.length && model[at] === item) return;
  model.splice(at, 0, item);
}

export const redBlackTreeContract: ContractSpec<
  RedBlackTreeContract<number>,
  Model
> = {
  name: "RedBlackTree",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "insert",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => {
        impl.insert(arg as number);
      },
      onModel: (model, arg) => {
        insertSorted(model, arg as number);
      },
    },
    {
      name: "delete",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => {
        const at = model.indexOf(arg as number);
        if (at < 0) return false;
        model.splice(at, 1);
        return true;
      },
    },
    {
      name: "has",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.includes(arg as number),
    },
    {
      name: "min",
      arg: () => undefined,
      onImpl: (impl) => impl.min(),
      onModel: (model) => (model.length === 0 ? null : (model[0] as number)),
    },
    {
      name: "max",
      arg: () => undefined,
      onImpl: (impl) => impl.max(),
      onModel: (model) =>
        model.length === 0 ? null : (model[model.length - 1] as number),
    },
    {
      name: "range",
      arg: (rng) => {
        const low = Math.floor(rng() * DOMAIN);
        return [low, low + Math.floor(rng() * 6)];
      },
      onImpl: (impl, arg) => {
        const [low, high] = arg as [number, number];
        return impl.range(low, high);
      },
      onModel: (model, arg) => {
        const [low, high] = arg as [number, number];
        return model.filter((v) => v >= low && v <= high);
      },
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
      name: "빈 집합의 조회는 전부 비어 있음을 말하고 상태를 바꾸지 않는다",
      steps: [
        { op: "has", arg: 1 },
        { op: "min" },
        { op: "max" },
        { op: "range", arg: [0, 100] },
        { op: "toArray" },
        { op: "delete", arg: 1 },
        { op: "toArray" },
      ],
    },
    {
      // 유일성은 `toArray()` 하나로만 읽히므로 불변식이 아니라 축1의 몫이다.
      name: "같은 값을 여러 번 넣어도 한 벌만 담긴다",
      steps: [
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "toArray" },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "toArray" },
      ],
    },
    {
      name: "없는 값을 지우면 false 이고 상태가 그대로다",
      steps: [
        { op: "insert", arg: 2 },
        { op: "insert", arg: 4 },
        { op: "delete", arg: 3 },
        { op: "toArray" },
        { op: "delete", arg: 4 },
        { op: "toArray" },
      ],
    },
    {
      name: "넣은 순서와 무관하게 비내림차순으로 늘어놓는다",
      steps: [
        { op: "insert", arg: 9 },
        { op: "insert", arg: 1 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 7 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "구간은 양 끝을 포함하고, low > high 면 빈 배열이다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 7 },
        { op: "range", arg: [3, 5] },
        { op: "range", arg: [2, 6] },
        { op: "range", arg: [5, 3] },
        { op: "range", arg: [8, 9] },
      ],
    },
    {
      // 두 자식이 다 있는 자리를 지우는 길과 뿌리를 지우는 길을 함께 짚는다.
      name: "가운데를 지우고 다시 채워도 순서가 어긋나지 않는다",
      steps: [
        { op: "insert", arg: 4 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 6 },
        { op: "insert", arg: 1 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 7 },
        { op: "delete", arg: 4 },
        { op: "toArray" },
        { op: "delete", arg: 2 },
        { op: "insert", arg: 4 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "전부 지웠다가 다시 채워도 정상이다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "delete", arg: 1 },
        { op: "delete", arg: 2 },
        { op: "toArray" },
        { op: "min" },
        { op: "insert", arg: 8 },
        { op: "min" },
        { op: "max" },
        { op: "toArray" },
      ],
    },
  ],

  // 헤더 불변식 절의 셋. 셋 다 관측 경로가 둘이라 구현이 따로 유지하면 갈린다.
  invariants: [
    {
      name: "has 는 toArray 에 그 값이 있는가와 같다",
      check: (impl) => {
        const listed = impl.toArray();
        for (let probe = -1; probe <= DOMAIN; probe++) {
          const said = impl.has(probe);
          const actual = listed.includes(probe);
          if (said !== actual)
            return `has(${probe})=${said} 인데 toArray 에는 ${actual} 다`;
        }
        return null;
      },
    },
    {
      name: "min·max 는 toArray 의 양 끝과 같다",
      check: (impl) => {
        const listed = impl.toArray();
        const low = listed.length === 0 ? null : (listed[0] as number);
        const high =
          listed.length === 0 ? null : (listed[listed.length - 1] as number);
        if (impl.min() !== low)
          return `min()=${impl.min()} 인데 첫 원소는 ${low} 다`;
        if (impl.max() !== high)
          return `max()=${impl.max()} 인데 마지막 원소는 ${high} 다`;
        return null;
      },
    },
    {
      name: "range 는 toArray 를 그 구간으로 자른 것과 같다",
      check: (impl) => {
        const listed = impl.toArray();
        for (let low = 0; low < DOMAIN; low += 5) {
          const high = low + 4;
          const said = impl.range(low, high);
          const actual = listed.filter((v) => v >= low && v <= high);
          if (
            said.length !== actual.length ||
            said.some((v, i) => v !== actual[i])
          )
            return `range(${low}, ${high})=[${said}] 인데 잘라 낸 것은 [${actual}] 다`;
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순 넣기. 균형을 스스로 잡지 않는 탐색 트리가 사슬이 되는 입력이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(i));
      },
    },
    {
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // 무작위 넣기. 정렬 배열 구현이 매번 뒤쪽을 미는 입력이다 — 오름차순에서는
      // 뒤에 붙이기만 하면 되므로 통과한다. 적대성은 (계약, 구현) 쌍에 대해
      // 정의되므로 둘 다 있어야 한다(불변 사실 57).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n * 4);
          ctx.step(() => impl.insert(value));
        }
      },
    },
    {
      covers: ["has", "min", "max"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **순차 조회.** 이 시나리오가 `worst` 를 `amortized` 와 가른다.
      //
      // 조회가 트리를 고쳐 쓰는 계열은 찾은 자리를 뿌리로 끌어올린다. 준비 단계가
      // 오름차순 넣기라 그 계열의 트리는 **사슬**이고, 그 상태로 맞는 **첫 조회 한 번**이
      // 사슬 끝까지 내려가 n 에 비례한다. 끌어올리기가 곧바로 트리를 납작하게 만들어
      // 뒤 걸음은 급격히 싸지지만, `worst` 통계가 보는 것은 최댓값이라 그 첫 걸음이
      // 그대로 보고된다. 같은 구현이 무작위 조회에서는 준비 단계부터 사슬이 아니라
      // 통과한다 — 그래서 무작위만 두면 `amortized` 구현이 `worst` 계약을 통과한다.
      //
      // 걸음 하나는 `has`·`min`·`max` 세 호출을 함께 감싼 것이고, 통계는 **걸음별 합의
      // 최댓값**이다. 세 행이 같은 내려가기 한 번이라 갈라 잴 이유가 없다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.has(i);
            impl.min();
            impl.max();
          });
        }
      },
    },
    {
      covers: ["delete"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순으로 채우고 오름차순으로 지운다. 늘 최솟값을 빼므로 한쪽으로 치우친
      // 구현이 그 자리에서 드러나고, 정렬 배열은 앞을 빼면서 뒤를 전부 당긴다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.delete(i));
      },
    },
    {
      covers: ["range"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // `range` 의 상한은 O(log n + k) 다. 값 범위를 n 에 비례해 넓혀 **k 를 상수로
      // 눌러야** 파라미터가 하나만 남는다(§규약2 다변수 상한 규칙). 누르지 않으면
      // 전부 훑는 구현도 그 자리에서 정당해 보인다.
      run: (impl, n, ctx) => {
        const spread = n * 8;
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * spread));
        for (let i = 0; i < n; i++) {
          const low = Math.floor(ctx.rng() * spread);
          ctx.step(() => impl.range(low, low + 4));
        }
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // 호출 하나가 원소 수만큼 드는 연산이다. 반복 호출은 성장률을 바꾸지 않으므로
      // 몇 번만 부른다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < 4; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
