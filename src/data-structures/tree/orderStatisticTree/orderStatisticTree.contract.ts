/**
 * `tree/orderStatisticTree` 계약 스위트(규약2).
 *
 * 계약은 `./orderStatisticTree.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가
 * 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * (하네스가 그 존재를 검사한다) 한정자가 `expected` 인 시나리오는 seed 5개를 돈다.
 *
 * **이 스위트가 `tree/multiset` 의 것과 갈리는 자리는 둘이다.** 불변식 넷째·다섯째와 위치
 * 연산을 겨눈 시나리오 둘이다. 나머지는 같은 판별 절차가 같은 답을 낸 결과이지 베낀 것이
 * 아니다 — 물으면 같은 자리에서 같은 답이 나온다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import { fixedInput, seededInput } from "../../_contract/expectedRepeat";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface OrderStatisticTreeContract<T> {
  add(item: T): void;
  delete(item: T): boolean;
  deleteAll(item: T): number;
  has(item: T): boolean;
  count(item: T): number;
  rankOf(item: T): number;
  at(index: number): T | null;
  toArray(): T[];
}

/**
 * 축1 참조 모델. 정렬 배열이다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 *
 * 위치 연산 둘이 이 모델에서는 색인 하나로 끝난다는 것이 그 자명함의 내용이고, 같은 정렬
 * 배열이 축3에서는 갱신 두 행에서 걸린다. 축이 무엇을 보는지가 다르기 때문이다.
 */
type Model = number[];

/** 중복과 부재가 둘 다 자주 나오도록 값 범위를 좁게 잡는다. */
const DOMAIN = 16;

/** `at` 의 인자 범위. 양쪽 밖(음수·크기 초과)이 무작위 시퀀스에서도 나오도록 넓힌다. */
function someIndex(rng: () => number): number {
  return Math.floor(rng() * (DOMAIN + 2)) - 1;
}

function rankIn(model: Model, item: number): number {
  let count = 0;
  for (const value of model) if (value < item) count++;
  return count;
}

export const orderStatisticTreeContract: ContractSpec<
  OrderStatisticTreeContract<number>,
  Model
> = {
  name: "OrderStatisticTree",
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
      name: "rankOf",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.rankOf(arg as number),
      onModel: (model, arg) => rankIn(model, arg as number),
    },
    {
      name: "at",
      arg: someIndex,
      onImpl: (impl, arg) => impl.at(arg as number),
      onModel: (model, arg) => {
        const index = arg as number;
        if (index < 0 || index >= model.length) return null;
        return model[index] as number;
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
      name: "빈 컬렉션 — 위치 질의는 null 과 0 이고 늘어놓기가 빈 배열이다",
      steps: [
        { op: "at", arg: 0 },
        { op: "rankOf", arg: 5 },
        { op: "toArray" },
      ],
    },
    {
      name: "at 은 0-기반이고 범위 밖은 null 이다",
      steps: [
        { op: "add", arg: 2 },
        { op: "add", arg: 5 },
        { op: "add", arg: 8 },
        { op: "at", arg: -1 },
        { op: "at", arg: 0 },
        { op: "at", arg: 2 },
        { op: "at", arg: 3 },
      ],
    },
    {
      name: "동등 원소 무리에서 rankOf 는 무리의 첫 자리를 가리킨다",
      steps: [
        { op: "add", arg: 2 },
        { op: "add", arg: 2 },
        { op: "add", arg: 5 },
        { op: "add", arg: 8 },
        { op: "rankOf", arg: 2 },
        { op: "rankOf", arg: 5 },
        { op: "at", arg: 0 },
        { op: "at", arg: 1 },
      ],
    },
    {
      name: "담기지 않은 값의 rankOf 는 들어갈 자리다",
      steps: [
        { op: "add", arg: 2 },
        { op: "add", arg: 8 },
        { op: "rankOf", arg: 0 },
        { op: "rankOf", arg: 5 },
        { op: "rankOf", arg: 9 },
        { op: "has", arg: 5 },
      ],
    },
    {
      name: "한 벌만 지우면 위치가 하나씩 당겨진다",
      steps: [
        { op: "add", arg: 2 },
        { op: "add", arg: 2 },
        { op: "add", arg: 5 },
        { op: "delete", arg: 2 },
        { op: "toArray" },
        { op: "at", arg: 0 },
        { op: "at", arg: 1 },
        { op: "rankOf", arg: 5 },
      ],
    },
    {
      name: "deleteAll 은 동등 원소를 전부 지우고 순위를 함께 옮긴다",
      steps: [
        { op: "add", arg: 7 },
        { op: "add", arg: 7 },
        { op: "add", arg: 7 },
        { op: "add", arg: 8 },
        { op: "deleteAll", arg: 7 },
        { op: "count", arg: 7 },
        { op: "rankOf", arg: 8 },
        { op: "at", arg: 0 },
        { op: "toArray" },
      ],
    },
    {
      name: "삽입 순서와 무관하게 위치 좌표계가 같다",
      steps: [
        { op: "add", arg: 3 },
        { op: "add", arg: 1 },
        { op: "add", arg: 2 },
        { op: "add", arg: 1 },
        { op: "toArray" },
        { op: "at", arg: 1 },
        { op: "rankOf", arg: 3 },
      ],
    },
    {
      name: "전부 지웠다가 다시 채워도 계약이 유지된다",
      steps: [
        { op: "add", arg: 4 },
        { op: "delete", arg: 4 },
        { op: "at", arg: 0 },
        { op: "rankOf", arg: 4 },
        { op: "add", arg: 6 },
        { op: "add", arg: 2 },
        { op: "at", arg: 0 },
        { op: "toArray" },
      ],
    },
  ],

  /**
   * 헤더 불변식 절의 셋을 그대로 옮긴 것이다.
   *
   * **앞의 하나는 `tree/multiset` 의 하나와 같고 뒤의 둘이 이 계약에서 생겼다.** 위치를 세는
   * 값을 읽는 공개 연산이 생겼기 때문이다 — 나란한 계약들에서는 같은 값이 관측되지 않아
   * 어긋나도 네 축이 통과시킨다(불변 사실 109). **`KAN-040` `S4` 가 앞의 둘을 걷어냈다** —
   * 원소 수와 양 끝을 읽는 행이 계약에서 빠져 두 정합의 경로가 `toArray()` 하나로 줄었다.
   */
  invariants: [
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
      name: "rankOf(x) 는 toArray() 안에서 x 보다 앞선 원소 수와 같다",
      check: (impl) => {
        const items = impl.toArray();
        for (let value = 0; value < DOMAIN; value++) {
          const answered = impl.rankOf(value);
          const actual = rankIn(items, value);
          if (answered !== actual)
            return `rankOf(${value})=${answered} 인데 실제 ${actual}`;
        }
        return null;
      },
    },
    {
      name: "at(i) 가 toArray()[i] 와 동등하다",
      check: (impl) => {
        const items = impl.toArray();
        for (let index = 0; index < items.length; index++) {
          const answered = impl.at(index);
          if (answered !== items[index])
            return `at(${index})=${answered} 인데 toArray()[${index}]=${items[index]}`;
        }
        return null;
      },
    },
  ],

  scenarios: [
    seededInput({
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
    }),
    fixedInput({
      covers: ["add"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순 삽입. 균형을 스스로 잡지 않는 탐색 트리가 사슬이 되는 입력이다.
      // 위의 무작위 삽입과 **둘 다** 필요하다 — 오름차순은 탐색 트리에는 최악이지만 정렬
      // 배열에는 뒤에 붙이기만 하면 되는 최선이다(불변 사실 57).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.add(i));
      },
    }),
    seededInput({
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
    }),
    seededInput({
      covers: ["has", "count"],
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
          });
        }
      },
    }),
    seededInput({
      covers: ["rankOf", "at"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      /**
       * 무작위로 채우고 무작위 자리를 묻는다.
       *
       * **위치를 세는 값을 들지 않은 구현이 여기서 걸린다.** 키마다 다중도만 들고 순위를
       * 물으면 앞선 키를 훑어야 하므로 서로 다른 키의 수에 비례하고, 무작위로 채우면 그
       * 수가 n 에 비례한다. 아래 적대적 시나리오는 다른 계열을 잡는다.
       */
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.add(Math.floor(ctx.rng() * n));
        for (let i = 0; i < n / 4; i++) {
          const value = Math.floor(ctx.rng() * n);
          const index = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.rankOf(value);
            impl.at(index);
          });
        }
      },
    }),
    seededInput({
      covers: ["rankOf", "at"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      /**
       * 오름차순으로 채우고 무작위 자리를 묻는다.
       *
       * **위쪽 시나리오가 못 잡는 계열이 여기서 걸린다** — 부분트리 크기는 제대로 드는데
       * 균형을 잡지 않는 구현이다. 무작위로 채우면 그런 트리도 기대 높이가 로그라 통과하고,
       * 오름차순으로 채우면 사슬이 되어 위치 연산이 원소 수에 비례한다. 적대성이 (계약,
       * 구현) 쌍에 대해 정의된다는 것의 실물이 이 한 쌍이다(불변 사실 57).
       */
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.add(i);
        for (let i = 0; i < n / 4; i++) {
          const value = Math.floor(ctx.rng() * n);
          const index = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.rankOf(value);
            impl.at(index);
          });
        }
      },
    }),
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // 반복 횟수가 n 이 아닌 이유는 O(n) 연산을 n 회 돌면 시나리오가 O(n^2) 이 되기
      // 때문이다. worst 는 최댓값으로 판정하므로 표본이 적어도 된다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.add(Math.floor(ctx.rng() * n));
        for (let i = 0; i < 8; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
