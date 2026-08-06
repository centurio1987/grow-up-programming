/**
 * `tree/scapegoatTree` 계약 스위트(규약2).
 *
 * 계약은 `./scapegoatTree.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * 허용치가 ±30% 다.
 *
 * **`qualifier` 가 시나리오마다 갈리는 첫 스위트다.** 나란한 셋은 일곱 시나리오에 같은
 * 한정자를 붙였는데 여기서는 갱신 둘이 `amortized`, 나머지 다섯이 `worst` 다. 그것이
 * 바꾸는 것은 **무엇을 통계로 삼는가**이고(`_contract/judge.ts` 의 `statistic`), 같은
 * 정본이 두 무리에서 다른 값으로 판정된다.
 *
 * 정본을 재 보면 갈림이 분명하다 — `insert` 오름차순의 시퀀스 평균은 37.2 → 48.9 → 58.6
 * 으로 로그 구간에 있는데 **같은 실행의 단일 호출 최대는 1,905 → 7,940 → 23,141** 로
 * 선형이다. 다시 짓기 한 번이 그 최댓값이고, 갱신 행을 `worst` 로 적었다면 정본이 자기
 * 계약을 어긴다. 조회 쪽은 반대다 — 순차 조회의 **최대**가 33 → 40 → 47 로 로그 안이라
 * `worst` 를 지킨다.
 *
 * **조회 행의 `worst` 가 이 계약을 `tree/splayTree` 와 가르는 자리다**(§규약1 「한정자가
 * 계약을 가른다」 3단계). 접근한 자리를 끌어올리는 계열은 순차 조회의 단일 호출 최대가
 * 원소 수에 비례하므로 그 행에서 걸린다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface ScapegoatTreeContract<T> {
  insert(item: T): void;
  delete(item: T): boolean;
  has(item: T): boolean;
  min(): T | null;
  max(): T | null;
  range(low: T, high: T): T[];
  size(): number;
  toArray(): T[];
}

/**
 * 축1 참조 모델. 정렬된 중복 없는 배열이다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 *
 * 같은 정렬 배열이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/sortedArraySet.ts`). 갱신 행을 약하게 적었는데도 걸린다 — 상각이
 * 구해 주는 것은 「가끔 비싼 호출」이지 「늘 비싼 호출」이 아니다.
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

export const scapegoatTreeContract: ContractSpec<
  ScapegoatTreeContract<number>,
  Model
> = {
  name: "ScapegoatTree",
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
      name: "빈 집합의 조회는 전부 비어 있음을 말하고 상태를 바꾸지 않는다",
      steps: [
        { op: "has", arg: 1 },
        { op: "min" },
        { op: "max" },
        { op: "range", arg: [0, 100] },
        { op: "size" },
        { op: "toArray" },
        { op: "delete", arg: 1 },
        { op: "size" },
      ],
    },
    {
      // 유일성은 `toArray()` 하나로만 읽히므로 불변식이 아니라 축1의 몫이다.
      name: "같은 값을 여러 번 넣어도 한 벌만 담긴다",
      steps: [
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "size" },
        { op: "toArray" },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "size" },
      ],
    },
    {
      // 못 찾은 조회가 담는 모양을 고치는 구현이 있다. 고쳐도 **상태**는 그대로여야
      // 한다는 것을 이 자리가 짚는다(불변 사실 79 와 같은 물음).
      name: "없는 값을 찾거나 지워도 상태가 그대로다",
      steps: [
        { op: "insert", arg: 2 },
        { op: "insert", arg: 4 },
        { op: "has", arg: 3 },
        { op: "toArray" },
        { op: "delete", arg: 3 },
        { op: "toArray" },
        { op: "size" },
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
      // 구간의 두 끝이 담긴 값과 어긋나는 자리를 짚는다. 끝을 끌어올려 잘라 내는
      // 구현은 여기서 「올릴 자리가 없는」 경우를 만난다.
      name: "구간이 담긴 값 바깥으로 벗어나도 답이 맞다",
      steps: [
        { op: "insert", arg: 10 },
        { op: "insert", arg: 20 },
        { op: "insert", arg: 30 },
        { op: "range", arg: [0, 5] },
        { op: "range", arg: [40, 50] },
        { op: "range", arg: [0, 100] },
        { op: "range", arg: [15, 25] },
        { op: "toArray" },
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
        { op: "size" },
        { op: "min" },
        { op: "insert", arg: 8 },
        { op: "min" },
        { op: "max" },
        { op: "toArray" },
      ],
    },
  ],

  // 헤더 불변식 절의 넷. `tree/redBlackTree` 의 넷과 같다 — 한정자는 비용의 성질이라
  // 상태의 성질을 건드리지 않는다.
  invariants: [
    {
      name: "toArray().length 와 size() 가 같다",
      check: (impl) => {
        const listed = impl.toArray().length;
        const counted = impl.size();
        return listed === counted
          ? null
          : `toArray().length=${listed} 인데 size()=${counted} 다`;
      },
    },
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
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순 넣기. 균형을 스스로 잡지 않는 탐색 트리가 사슬이 되는 입력이다.
      //
      // **이 시나리오가 갱신 행의 한정자를 정당화한다.** 가끔 크게 다시 짓는 구현은
      // 여기서 단일 호출 최대가 1,905 → 7,940 → 23,141 로 선형인데 시퀀스 평균은
      // 37.2 → 48.9 → 58.6 으로 로그 안이다. 갱신을 `worst` 로 적었다면 그런 구현이
      // 통째로 나가고, 나갈 이유가 계약의 목적에 없다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(i));
      },
    },
    {
      covers: ["insert"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // 무작위 넣기. 정렬 배열 구현이 매번 뒤쪽을 미는 입력이다 — 오름차순에서는
      // 뒤에 붙이기만 하면 되므로 통과한다.
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
      // **순차 조회. 이 계약이 `tree/splayTree` 와 갈리는 자리다.**
      //
      // 준비가 오름차순 넣기라 접근한 자리를 끌어올리는 계열은 트리가 사슬이고, 그
      // 상태로 맞는 **첫 조회 한 번**이 사슬 끝까지 내려가 n 에 비례한다. 이 계약은
      // 조회 행을 `worst` 로 적었으므로 그 한 번이 그대로 보고되어 걸린다 — 저쪽
      // 계약은 같은 실행을 시퀀스 평균으로 재서 통과시킨다.
      //
      // 트리의 모양을 늘 균형 가까이 유지하는 구현은 조회가 트리를 건드리지 않아도
      // 얕다. 정본을 재면 이 시나리오의 **최대**가 33 → 40 → 47 로 로그 안이다.
      //
      // 걸음 하나는 `has`·`min`·`max` 세 호출을 함께 감싼 것이고, 세 행이 같은
      // 내려가기 한 번이라 갈라 잴 이유가 없다.
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
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순으로 채우고 오름차순으로 지운다. 늘 최솟값을 빼므로 한쪽으로 치우친
      // 구현이 그 자리에서 드러나고, 정렬 배열은 앞을 빼면서 뒤를 전부 당긴다.
      //
      // 지우기 쪽에도 다시 짓기가 있다 — 원소가 많이 빠지면 트리가 성기게 남으므로
      // 크기를 기준으로 한 번 몰아서 짓는다. 정본의 단일 호출 최대가 1,338 → 5,332 →
      // 21,302 로 선형인 것이 그 자리이고, 평균은 10.2 → 11.2 → 12.1 이다.
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
      // 눌러야** 파라미터가 하나만 남는다(§규약2 다변수 상한 규칙).
      //
      // 이 행은 `worst` 다. 트리 높이가 늘 로그에 묶여 있으면 훑는 구현도 상한
      // 안이므로, 여기서 걸리는 것은 높이를 못 묶는 구현이다.
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
      // 호출 하나가 원소 수만큼 드는 연산이다. `worst` 계약이라면 몇 번만 불러도
      // 되지만 **상각 판정은 n 회 측정을 요구하므로**(`runContract.ts`) n 회 부른다 —
      // 시퀀스 평균을 내려면 나눌 시퀀스가 있어야 한다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) ctx.step(() => impl.toArray());
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      // 세어 두지 않고 그때그때 훑는 구현이 걸리는 자리다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) ctx.step(() => impl.size());
      },
    },
  ],
};
