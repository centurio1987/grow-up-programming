/**
 * `tree/splayTree` 계약 스위트(규약2).
 *
 * 계약은 `./splayTree.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * 허용치가 ±30% 다.
 *
 * **이 스위트가 `tree/redBlackTree` 의 것과 갈리는 자리는 한정자 하나뿐이다.** 시나리오의
 * 입력도, 덮는 연산도, 상한도 같다. 갈리는 것은 `qualifier` 이고 그것이 바꾸는 것은
 * **무엇을 통계로 삼는가**다 — `worst` 는 단일 호출 최대 비용, `amortized` 는 시퀀스
 * 평균이다(`_contract/judge.ts` 의 `statistic`).
 *
 * 그래서 **같은 실행이 두 계약에 정반대 판정을 낸다.** 순차 조회 시나리오에서 정본을
 * 재면 연산당 평균은 19.7 → 19.8 → 19.8 로 크기를 네 배씩 올려도 움직이지 않는데, 같은
 * 실행의 단일 호출 최대는 1,540 → 6,148 → 24,580 으로 정확히 네 배씩 자란다. 앞엣값이
 * 이 계약을 통과시키고 뒷값이 저 계약을 떨어뜨린다. **불변 사실 63 이 논증으로만 있던
 * 것에 정본 자신이 낸 수치다.**
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface SplayTreeContract<T> {
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
 * (`_contract/_fixtures/sortedArraySet.ts`). 상각으로 재도 걸린다 — 상각이 구해 주는
 * 것은 「가끔 비싼 호출」이지 「늘 비싼 호출」이 아니다.
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

export const splayTreeContract: ContractSpec<
  SplayTreeContract<number>,
  Model
> = {
  name: "SplayTree",
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
        { op: "toArray" },
        { op: "min" },
        { op: "insert", arg: 8 },
        { op: "min" },
        { op: "max" },
        { op: "toArray" },
      ],
    },
  ],

  // 헤더 불변식 절의 셋. `tree/redBlackTree` 의 셋과 같다 — 한정자는 비용의 성질이라
  // 상태의 성질을 건드리지 않는다.
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
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순 넣기. 균형을 스스로 잡지 않는 탐색 트리가 사슬이 되는 입력이다.
      //
      // **끌어올리는 구현에는 이 입력이 최선이다** — 방금 넣은 자리가 뿌리이고 다음
      // 값이 그 오른쪽이라 연산당 비용이 크기와 무관하게 2 로 고정된다(1024·4096·
      // 16384 에서 전부 2.0). 같은 입력이 균형을 잡는 구현에는 8~11 이 든다.
      // 적대성은 (계약, 구현) 쌍에 대해 정의된다는 것의 실물이다(불변 사실 57).
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
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **순차 조회.** 이 시나리오가 이 계약과 `tree/redBlackTree` 계약이 서로 다른
      // 답을 내는 유일한 자리다.
      //
      // 준비가 오름차순 넣기이므로 끌어올리는 구현의 트리는 사슬이고, 그 상태로 맞는
      // **첫 조회 한 번**이 사슬 끝까지 내려가 n 에 비례한다. 끌어올리기가 곧바로
      // 트리를 납작하게 만들어 뒤 걸음이 급격히 싸지므로(n=1024 에서 1540 → 776 →
      // 397 → 203) **시퀀스 평균은 상수에 머문다.** `worst` 통계는 그 첫 걸음을
      // 그대로 보고하고 `amortized` 통계는 나눠 없앤다 — 두 계약이 갈리는 것이
      // 판정 규격의 이 한 줄이다.
      //
      // 걸음 하나는 `has`·`min`·`max` 세 호출을 함께 감싼 것이다. 세 행이 같은
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
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.delete(i));
      },
    },
    {
      covers: ["range"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // `range` 의 상한은 O(log n + k) 다. 값 범위를 n 에 비례해 넓혀 **k 를 상수로
      // 눌러야** 파라미터가 하나만 남는다(§규약2 다변수 상한 규칙).
      //
      // 이 자리가 「앞에서부터 훑으며 거르는」 구현을 막는다. 그런 구현은 트리를
      // 고쳐 쓰지 않으므로 사슬이 사슬로 남고, 상각으로 봐도 담긴 원소 수에 비례한다.
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
      qualifier: "amortized",
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
  ],
};
