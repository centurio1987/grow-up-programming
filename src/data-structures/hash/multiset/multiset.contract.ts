/**
 * `hash/multiset` 계약 스위트(규약2).
 *
 * 계약은 `./multiset.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * (하네스가 그 존재를 검사한다) 한정자가 `expected` 인 시나리오는 seed 5개를 돈다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface MultisetContract<T> {
  add(item: T): void;
  delete(item: T): boolean;
  deleteAll(item: T): number;
  has(item: T): boolean;
  count(item: T): number;
  min(): T | null;
  max(): T | null;
  size(): number;
  toArray(): T[];
}

/**
 * 축1 참조 모델. 정렬 배열이다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 *
 * 같은 정렬 배열이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/sortedArrayMultiset.ts`). 축이 무엇을 보는지가 다르기 때문이다.
 */
type Model = number[];

/** 중복과 부재가 둘 다 자주 나오도록 값 범위를 좁게 잡는다. */
const DOMAIN = 16;

export const multisetContract: ContractSpec<MultisetContract<number>, Model> = {
  name: "Multiset",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "add",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => {
        impl.add(arg as number);
      },
      onModel: (model, arg) => {
        const item = arg as number;
        let at = 0;
        while (at < model.length && (model[at] as number) <= item) at++;
        model.splice(at, 0, item);
      },
    },
    {
      name: "delete",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => {
        const at = model.indexOf(arg as number);
        if (at === -1) return false;
        model.splice(at, 1);
        return true;
      },
    },
    {
      name: "deleteAll",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.deleteAll(arg as number),
      onModel: (model, arg) => {
        const item = arg as number;
        const before = model.length;
        for (let at = model.length - 1; at >= 0; at--) {
          if (model[at] === item) model.splice(at, 1);
        }
        return before - model.length;
      },
    },
    {
      name: "has",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.includes(arg as number),
    },
    {
      name: "count",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.count(arg as number),
      onModel: (model, arg) => model.filter((value) => value === arg).length,
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
      name: "빈 컬렉션 — min·max 는 null, size 는 0",
      steps: [{ op: "min" }, { op: "max" }, { op: "size" }, { op: "toArray" }],
    },
    {
      name: "중복 다중도가 size 와 count 에 함께 반영된다",
      steps: [
        { op: "add", arg: 5 },
        { op: "add", arg: 5 },
        { op: "add", arg: 5 },
        { op: "count", arg: 5 },
        { op: "size" },
        { op: "delete", arg: 5 },
        { op: "count", arg: 5 },
        { op: "size" },
      ],
    },
    {
      name: "없는 원소의 delete·deleteAll 은 상태를 바꾸지 않는다",
      steps: [
        { op: "add", arg: 1 },
        { op: "delete", arg: 9 },
        { op: "deleteAll", arg: 9 },
        { op: "toArray" },
        { op: "size" },
      ],
    },
    {
      name: "삽입 순서와 무관하게 비내림차순이 유지된다",
      steps: [
        { op: "add", arg: 3 },
        { op: "add", arg: 1 },
        { op: "add", arg: 2 },
        { op: "add", arg: 1 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "deleteAll 은 동등 원소를 전부 지우고 지운 수를 돌려준다",
      steps: [
        { op: "add", arg: 7 },
        { op: "add", arg: 7 },
        { op: "add", arg: 7 },
        { op: "add", arg: 8 },
        { op: "deleteAll", arg: 7 },
        { op: "has", arg: 7 },
        { op: "size" },
        { op: "toArray" },
      ],
    },
    {
      name: "전부 지웠다가 다시 채워도 계약이 유지된다",
      steps: [
        { op: "add", arg: 4 },
        { op: "delete", arg: 4 },
        { op: "min" },
        { op: "add", arg: 6 },
        { op: "add", arg: 2 },
        { op: "toArray" },
      ],
    },
  ],

  /**
   * 헤더 불변식 절의 셋을 그대로 옮긴 것이다.
   *
   * **B10 에서 한 자리가 갈렸다.** 옛 1번(`toArray()` 가 비내림차순)은 정렬을 읽는 경로가
   * `toArray()` 하나뿐이라 불변식이 아니고, 계약 표의 의미 열이 이미 그것을 적고 있다
   * (`src/data-structures/hash/multiset/multiset.ts:29`) — 축1이 참조 모델과 대조한다.
   * `has(x) === (count(x) > 0)` 도 같은 이유로 빠졌다. `has` 의 의미 열이 그 문장이다.
   * 그 자리에 경로가 둘인데 아무도 대조하지 않던 것(`min`·`max` 대 양 끝)이 들어왔다.
   */
  invariants: [
    {
      name: "toArray().length 와 size() 가 같다",
      check: (impl) => {
        const length = impl.toArray().length;
        const size = impl.size();
        return length === size ? null : `toArray ${length} / size ${size}`;
      },
    },
    {
      name: "count(x) 는 toArray() 안의 동등 원소 수와 같다",
      check: (impl) => {
        const items = impl.toArray();
        for (let value = 0; value < DOMAIN; value++) {
          const counted = impl.count(value);
          const actual = items.filter((item) => item === value).length;
          if (counted !== actual)
            return `count(${value})=${counted} 인데 실제 ${actual}`;
        }
        return null;
      },
    },
    {
      name: "min()·max() 가 toArray() 의 양 끝과 동등하다",
      check: (impl) => {
        const items = impl.toArray();
        if (items.length === 0) {
          // 빈 컨테이너에서 둘 다 null 인 것은 계약 표가 적은 의미이므로 축1의 몫이다.
          return null;
        }
        const min = impl.min();
        const max = impl.max();
        if (min !== items[0]) return `min ${min} 인데 첫 원소 ${items[0]}`;
        const last = items[items.length - 1];
        return max === last ? null : `max ${max} 인데 마지막 원소 ${last}`;
      },
    },
  ],

  scenarios: [
    {
      covers: ["add"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      // 무작위 삽입. 정렬 배열 구현이 매 삽입마다 뒤쪽을 밀어야 하는 입력이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n);
          ctx.step(() => impl.add(value));
        }
      },
    },
    {
      covers: ["add"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순 삽입. 균형을 스스로 잡지 않는 탐색 트리가 사슬이 되는 입력이다.
      //
      // 위의 무작위 삽입과 **둘 다** 필요하다. 적대성은 계약이 아니라 구현에 대해
      // 정의되기 때문이다 — 오름차순은 탐색 트리에는 최악이지만 정렬 배열에는 뒤에
      // 붙이기만 하면 되는 최선이다. 시나리오 하나로는 한 종류의 구현만 시험한다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.add(i));
      },
    },
    {
      covers: ["delete", "deleteAll"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      // deleteAll 의 상한은 O(log n + k) 다. 값 범위를 n 으로 잡아 k 를 상수로 눌러야
      // 파라미터가 하나만 남는다(§규약2 다변수 상한 규칙).
      run: (impl, n, ctx) => {
        const values: number[] = [];
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n);
          values.push(value);
          impl.add(value);
        }
        for (let i = 0; i < n / 2; i++)
          ctx.step(() => impl.delete(values[i] as number));
        for (let i = 0; i < n / 4; i++) {
          ctx.step(() => impl.deleteAll(values[n - 1 - i] as number));
        }
      },
    },
    {
      covers: ["has", "count", "min", "max"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.add(Math.floor(ctx.rng() * n));
        for (let i = 0; i < n / 4; i++) {
          const probe = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.has(probe);
            impl.count(probe);
            impl.min();
            impl.max();
          });
        }
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.add(Math.floor(ctx.rng() * n));
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
        for (let i = 0; i < n; i++) impl.add(Math.floor(ctx.rng() * n));
        for (let i = 0; i < 8; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
