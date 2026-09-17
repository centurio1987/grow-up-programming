/**
 * `hash/hashSet` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./hashSet.ts` 헤더 한 곳이고(규약1), 여기
 * 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리 하나에 연산을
 * 이어 붙이는데, 이 계약의 세 행은 **집합을 인자로 받는다.** 껍데기가 자리를 셋 든다 —
 * 수신자·인자·마지막 결과. 인자 쪽 준비는 `addOther`·`deleteOther` 로 하고, 결과는
 * `resultSize`·`resultHas` 로 관측한다. 껍데기는 **계약의 일부가 아니다**(구조에도 없고
 * `tools/check-contract.ts` 의 명세↔스텁·정본 대조에도 걸리지 않는다).
 *
 * **결과를 자리에 들어야 독립이 관측된다.** 세 연산이 돌려주는 집합은 두 피연산자와
 * 독립이라고 계약이 적는데, 그 약속은 **연산 뒤에 피연산자를 고쳐 보고 결과를 다시 물어야**
 * 보인다. 반환값을 그 자리에서 배열로 바꿔 버리면 관측할 자리가 사라진다.
 *
 * **껍데기의 `__cost` 는 수신자와 인자의 것을 더한 값이다.** 세 집합 연산의 비용이 두
 * 객체에 나뉘어 쌓이기 때문이다 — 인자에 묻는 몫은 인자 쪽에 쌓인다. 새 집합을 짓는 몫은
 * 정본이 호출 끝에 수신자로 옮긴다(`./_reference/hashSet.ts` 헤더).
 *
 * **열거 순서는 계약이 정하지 않는다.** 그래서 축1이 `values()` 와 세 집합 연산의 결과를
 * 참조 모델과 견줄 때 양쪽을 **정렬해서** 본다. 정렬하지 않으면 자리를 어떻게 정하든 모델과
 * 다른 순서가 나와 모든 구현이 축1에서 걸리고, 그 순간 스위트가 열거 순서를 처방하는 것이
 * 된다.
 *
 * **적대적 입력이 원소 묶음이지 펴기 함수가 아니다**(불변 사실 143). `i * 65536` 은 계약의
 * 용어만으로 적히고 주입 정책이 요구하는 것을 전부 지키는데, 자리 수가 $2^{16}$ 아래인 동안
 * **펴기 값을 그대로 자리로 쓰는 계열 전체**를 한 자리로 몬다.
 *
 * **집합 연산 세 행에는 시나리오가 둘씩이고, 둘이 다른 것을 겨눈다.** 하나는 수신자를 키우고
 * 하나는 **인자를 키운다.** 계약이 `intersection`·`difference` 의 상한에 인자의 크기를 넣지
 * 않았으므로, 인자를 키우는 쪽의 기대 상한은 `O(1)` 이다 — 인자를 훑어 답을 짓는 구현이
 * 정확히 거기서 걸린다. 반대로 수신자를 키우는 쪽은 **작은 쪽을 골라 훑는 구현**을 걸러
 * 낸다(계약 위반이 아니라 계급 아래라서. 불변 사실 49).
 */

import { fixedInput, seededInput } from "../../_contract/expectedRepeat";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **여덟 행**을 그대로 옮긴 표면. 생성자 행은 팩토리가 나른다. */
export interface HashSetContract<T> {
  add(item: T): void;
  has(item: T): boolean;
  delete(item: T): boolean;
  size(): number;
  values(): T[];
  union(other: HashSetContract<T>): HashSetContract<T>;
  intersection(other: HashSetContract<T>): HashSetContract<T>;
  difference(other: HashSetContract<T>): HashSetContract<T>;
}

type Built<T> = HashSetContract<T> & { __cost?: number };

/**
 * 하네스용 껍데기. 집합 셋을 자리로 들고 계약의 여덟 행을 그 위에 편다.
 *
 * `union`·`intersection`·`difference` 는 결과를 자리에 담고 그 원소 배열을 돌려준다. 배열을
 * 돌려주는 것은 축1이 견줄 관측값이 필요해서이고, 자리에 담는 것은 **독립**을 관측하기
 * 위해서다.
 */
export class SetPair<T> {
  readonly #mine: Built<T>;
  readonly #other: Built<T>;
  #result: Built<T>;

  constructor(make: () => Built<T>) {
    this.#mine = make();
    this.#other = make();
    this.#result = make();
  }

  /** 수신자와 인자의 계측을 더한다. 결과 집합의 몫은 정본이 수신자로 옮긴다. */
  get __cost(): number {
    return (this.#mine.__cost ?? 0) + (this.#other.__cost ?? 0);
  }

  add(item: T): void {
    this.#mine.add(item);
  }

  has(item: T): boolean {
    return this.#mine.has(item);
  }

  delete(item: T): boolean {
    return this.#mine.delete(item);
  }

  size(): number {
    return this.#mine.size();
  }

  values(): T[] {
    return this.#mine.values();
  }

  /** 인자 쪽 준비. 계약 표의 행이 아니라 껍데기가 인자를 짓는 길이다. */
  addOther(item: T): void {
    this.#other.add(item);
  }

  deleteOther(item: T): boolean {
    return this.#other.delete(item);
  }

  union(): T[] {
    this.#result = this.#mine.union(this.#other) as Built<T>;
    return this.#result.values();
  }

  intersection(): T[] {
    this.#result = this.#mine.intersection(this.#other) as Built<T>;
    return this.#result.values();
  }

  difference(): T[] {
    this.#result = this.#mine.difference(this.#other) as Built<T>;
    return this.#result.values();
  }

  resultSize(): number {
    return this.#result.size();
  }

  resultHas(item: T): boolean {
    return this.#result.has(item);
  }
}

type Impl = SetPair<number>;

interface Model {
  mine: Set<number>;
  other: Set<number>;
  result: Set<number>;
}

/** 축1 무작위 시퀀스가 쓰는 원소 범위. 좁게 잡아야 같은 원소를 다시 만지는 경로가 자주 돈다. */
const ITEM_SPACE = 64;

/**
 * 적대적 원소의 간격. 낮은 16 비트를 0 으로 만든다.
 *
 * 축3 사다리 맨 위(`n = 2^14`)에서도 자리 수는 `2^15` 를 넘지 않으므로, 펴기 값을 자리 수로
 * 나눈 나머지로 자리를 정하는 구현은 **크기와 무관하게 한 자리**에 전부 몰린다. 곱해서 위쪽
 * 비트를 쓰는 구현에는 아무 일도 일어나지 않는다.
 */
const CLUMP = 1 << 16;

/** 인자를 키우는 시나리오에서 수신자가 서는 크기. 사다리를 안 오르는 쪽이다. */
const FIXED_SIDE = 64;

function sorted(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function item(rng: () => number): number {
  return Math.floor(rng() * ITEM_SPACE);
}

/** `0 … n-1` 을 섞은 배열. 서로 다른 원소 n 개를 무작위 순서로 주는 자리다. */
function shuffledRange(n: number, rng: () => number): number[] {
  const made: number[] = [];
  for (let value = 0; value < n; value++) made.push(value);
  for (let at = n - 1; at > 0; at--) {
    const swap = Math.floor(rng() * (at + 1));
    [made[at], made[swap]] = [made[swap] as number, made[at] as number];
  }
  return made;
}

/** 시나리오 준비. 걸음에 안 들어간다. */
function fill(impl: Impl, n: number, itemAt: (index: number) => number): void {
  for (let index = 0; index < n; index++) impl.add(itemAt(index));
}

function fillOther(
  impl: Impl,
  n: number,
  itemAt: (index: number) => number,
): void {
  for (let index = 0; index < n; index++) impl.addOther(itemAt(index));
}

/** 인자를 키우는 시나리오의 수신자. 사다리와 무관하게 늘 같은 크기다. */
function fillFixedSide(impl: Impl): void {
  for (let index = 0; index < FIXED_SIDE; index++) impl.add(index);
}

/** 집합 연산 시나리오의 측정 횟수. 한 호출이 이미 `n` 에 비례하므로 넷이면 통계가 선다. */
const ROUNDS = 4;

export const hashSetContract: ContractSpec<Impl, Model> = {
  name: "HashSet",
  grade: "complexity",
  model: () => ({
    mine: new Set<number>(),
    other: new Set<number>(),
    result: new Set<number>(),
  }),

  ops: [
    {
      name: "add",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => {
        impl.add(arg as number);
        return undefined;
      },
      onModel: (model, arg) => {
        model.mine.add(arg as number);
        return undefined;
      },
    },
    {
      name: "has",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.mine.has(arg as number),
    },
    {
      name: "delete",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => model.mine.delete(arg as number),
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.mine.size,
    },
    {
      // 순서는 계약이 정하지 않으므로 양쪽을 정렬해서 견준다(파일 헤더).
      name: "values",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.values()),
      onModel: (model) => sorted([...model.mine]),
    },
    {
      name: "addOther",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => {
        impl.addOther(arg as number);
        return undefined;
      },
      onModel: (model, arg) => {
        model.other.add(arg as number);
        return undefined;
      },
    },
    {
      name: "deleteOther",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => impl.deleteOther(arg as number),
      onModel: (model, arg) => model.other.delete(arg as number),
    },
    {
      name: "union",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.union()),
      onModel: (model) => {
        model.result = new Set([...model.mine, ...model.other]);
        return sorted([...model.result]);
      },
    },
    {
      name: "intersection",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.intersection()),
      onModel: (model) => {
        model.result = new Set(
          [...model.mine].filter((value) => model.other.has(value)),
        );
        return sorted([...model.result]);
      },
    },
    {
      name: "difference",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.difference()),
      onModel: (model) => {
        model.result = new Set(
          [...model.mine].filter((value) => !model.other.has(value)),
        );
        return sorted([...model.result]);
      },
    },
    {
      // 결과도 계약을 만족하는 집합이다. 크기와 소속을 따로 물어야 그 사실이 관측된다.
      name: "resultSize",
      arg: () => undefined,
      onImpl: (impl) => impl.resultSize(),
      onModel: (model) => model.result.size,
    },
    {
      name: "resultHas",
      arg: (rng) => item(rng),
      onImpl: (impl, arg) => impl.resultHas(arg as number),
      onModel: (model, arg) => model.result.has(arg as number),
    },
  ],

  edges: [
    {
      name: "빈 집합에서는 무엇을 물어도 없다고 답한다",
      steps: [
        { op: "size" },
        { op: "has", arg: 7 },
        { op: "delete", arg: 7 },
        { op: "values" },
        { op: "union" },
        { op: "intersection" },
        { op: "difference" },
        { op: "resultSize" },
      ],
    },
    {
      // 같은 원소를 다시 넣는 것은 **아무 일도 하지 않는 일**이다. 담긴 수가 그 문장의
      // 관측 지점이다.
      name: "같은 원소를 다시 넣어도 담긴 수가 그대로다",
      steps: [
        { op: "add", arg: 3 },
        { op: "size" },
        { op: "add", arg: 3 },
        { op: "size" },
        { op: "has", arg: 3 },
        { op: "values" },
      ],
    },
    {
      name: "지운 뒤 다시 넣으면 다시 담겨 있다",
      steps: [
        { op: "add", arg: 5 },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "add", arg: 5 },
        { op: "has", arg: 5 },
        { op: "size" },
      ],
    },
    {
      // 없는 원소를 지우는 호출은 상태를 바꾸지 않는다. 옆 원소가 살아 있는지로 확인한다.
      name: "없는 원소를 지우면 거짓이고 상태가 바뀌지 않는다",
      steps: [
        { op: "add", arg: 1 },
        { op: "add", arg: 2 },
        { op: "delete", arg: 9 },
        { op: "size" },
        { op: "has", arg: 1 },
        { op: "has", arg: 2 },
        { op: "values" },
      ],
    },
    {
      // 한 자리로 몰리는 원소 넷. 자리를 어떻게 정하든 넷이 서로를 가리지 않아야 한다.
      name: "같은 자리로 몰리는 원소들도 서로를 가리지 않는다",
      steps: [
        { op: "add", arg: 0 },
        { op: "add", arg: CLUMP },
        { op: "add", arg: 2 * CLUMP },
        { op: "add", arg: 3 * CLUMP },
        { op: "size" },
        { op: "has", arg: 2 * CLUMP },
        { op: "delete", arg: CLUMP },
        { op: "has", arg: CLUMP },
        { op: "has", arg: 2 * CLUMP },
        { op: "has", arg: 3 * CLUMP },
        { op: "values" },
      ],
    },
    {
      // 지우기가 남긴 자리를 지나가야 닿는 원소가 있는 자리. 지운 자리를 「비었다」로만
      // 표시하는 구현이 여기서 갈린다.
      name: "몰린 자리의 가운데를 지워도 뒤엣것이 그대로 찾아진다",
      steps: [
        { op: "add", arg: 0 },
        { op: "add", arg: CLUMP },
        { op: "add", arg: 2 * CLUMP },
        { op: "delete", arg: CLUMP },
        { op: "has", arg: 2 * CLUMP },
        { op: "has", arg: 0 },
        { op: "add", arg: 4 * CLUMP },
        { op: "has", arg: 2 * CLUMP },
        { op: "has", arg: 4 * CLUMP },
        { op: "size" },
      ],
    },
    {
      // 세 연산의 뜻. 겹치는 원소 하나와 양쪽에만 있는 원소를 두어 셋이 서로 다른 답을
      // 내는 자리를 짚는다.
      name: "합집합·교집합·차집합이 각각 다른 답을 낸다",
      steps: [
        { op: "add", arg: 1 },
        { op: "add", arg: 2 },
        { op: "add", arg: 3 },
        { op: "addOther", arg: 3 },
        { op: "addOther", arg: 4 },
        { op: "union" },
        { op: "resultSize" },
        { op: "intersection" },
        { op: "resultSize" },
        { op: "difference" },
        { op: "resultSize" },
        { op: "resultHas", arg: 1 },
        { op: "resultHas", arg: 3 },
      ],
    },
    {
      // 차집합은 대칭이 아니다. 인자 쪽에만 있는 원소는 답에 들어오지 않는다.
      name: "차집합은 인자 쪽에만 있는 원소를 담지 않는다",
      steps: [
        { op: "add", arg: 1 },
        { op: "addOther", arg: 2 },
        { op: "difference" },
        { op: "resultHas", arg: 1 },
        { op: "resultHas", arg: 2 },
        { op: "resultSize" },
      ],
    },
    {
      // 피연산자가 바뀌지 않는다 + 결과가 피연산자와 독립이다. 계약이 적은 두 문장의
      // 관측 지점이 여기 한 자리에 있다.
      name: "결과를 얻은 뒤 피연산자를 고쳐도 결과가 바뀌지 않는다",
      steps: [
        { op: "add", arg: 1 },
        { op: "addOther", arg: 2 },
        { op: "union" },
        { op: "resultSize" },
        { op: "size" },
        { op: "add", arg: 9 },
        { op: "resultHas", arg: 9 },
        { op: "resultSize" },
        { op: "delete", arg: 1 },
        { op: "resultHas", arg: 1 },
        { op: "addOther", arg: 8 },
        { op: "resultHas", arg: 8 },
        { op: "deleteOther", arg: 2 },
        { op: "resultHas", arg: 2 },
        { op: "resultSize" },
      ],
    },
    {
      // 한쪽이 빈 자리. 세 연산의 항등원과 흡수원이 여기서 갈린다.
      name: "인자가 비어 있으면 합집합과 차집합은 그대로이고 교집합은 빈다",
      steps: [
        { op: "add", arg: 1 },
        { op: "add", arg: 2 },
        { op: "union" },
        { op: "resultSize" },
        { op: "intersection" },
        { op: "resultSize" },
        { op: "difference" },
        { op: "resultSize" },
        { op: "resultHas", arg: 2 },
      ],
    },
    {
      // 결과 집합도 계약을 만족하는 집합이라 다시 인자가 될 수 있다 — 는 것을 여기서
      // 직접 짚지는 못한다(껍데기가 자리를 셋만 든다). 대신 결과의 두 관측이 서로 맞는지를
      // 본다: 크기와 소속.
      name: "결과 집합의 크기와 소속이 서로 맞는다",
      steps: [
        { op: "add", arg: 0 },
        { op: "add", arg: CLUMP },
        { op: "addOther", arg: CLUMP },
        { op: "addOther", arg: 2 * CLUMP },
        { op: "union" },
        { op: "resultSize" },
        { op: "resultHas", arg: 0 },
        { op: "resultHas", arg: CLUMP },
        { op: "resultHas", arg: 2 * CLUMP },
        { op: "resultHas", arg: 3 * CLUMP },
      ],
    },
  ],

  invariants: [
    {
      // 담긴 수를 읽는 길이 둘이다 — `size()` 와 `values().length`. 어느 계약 줄도 둘이
      // 같아야 한다고 적지 않으므로 불변식이다(§규약1 「불변식 판별 절차」 2번).
      name: "values().length === size()",
      check: (impl) => {
        const values = impl.values();
        const size = impl.size();
        if (values.length === size) return null;
        return `values() 는 ${values.length} 개인데 size() 는 ${size} 다`;
      },
    },
    {
      // 담김 여부를 읽는 길이 둘이다 — `has(x)` 와 `values()` 안에 x 가 있는가.
      name: "임의의 원소에 대해 has(x) 와 values() 포함이 같다",
      check: (impl) => {
        const listed = new Set(impl.values());
        for (const value of listed) {
          if (!impl.has(value))
            return `values() 에 ${value} 가 있는데 has(${value}) 가 거짓이다`;
        }
        for (let value = 0; value < ITEM_SPACE; value++) {
          if (!listed.has(value) && impl.has(value)) {
            return `values() 에 ${value} 가 없는데 has(${value}) 가 참이다`;
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    seededInput({
      covers: ["add"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // **서로 다른 원소 n 개를 무작위 순서로 넣기.** 담는 자리를 훑어 찾는 계열이 여기서
      // 걸린다. 자리를 나머지로 정하는 계열은 **여기를 통과한다** — 무작위 원소에는
      // 나머지도 잘 흩어진다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.add(items[index] as number));
        }
      },
    }),
    fixedInput({
      covers: ["add"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      // **낮은 비트가 전부 0 인 원소 n 개.** 자리를 펴기 값의 나머지로 정하는 계열을 가르는
      // **유일한** 시나리오다. 위 무작위 시나리오와 짝을 이루는 것이 요점이다(불변 사실 24).
      run: (impl, n, ctx) => {
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.add(index * CLUMP));
        }
      },
    }),
    seededInput({
      covers: ["has"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // 절반은 담긴 원소, 절반은 안 담긴 원소다. 못 찾는 물음도 같은 상한 안에 있어야
      // 한다 — 찾을 때만 싼 구현은 이 계약을 지키는 것이 아니다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        for (let index = 0; index < n; index++) {
          const asked = index % 2 === 0 ? (items[index] as number) : n + index;
          ctx.step(() => impl.has(asked));
        }
      },
    }),
    fixedInput({
      covers: ["has"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n, (index) => index * CLUMP);
        for (let index = 0; index < n; index++) {
          const asked = index % 2 === 0 ? index * CLUMP : (n + index) * CLUMP;
          ctx.step(() => impl.has(asked));
        }
      },
    }),
    seededInput({
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.delete(items[index] as number));
        }
      },
    }),
    fixedInput({
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n, (index) => index * CLUMP);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.delete(index * CLUMP));
        }
      },
    }),
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      // 담긴 수를 세어 두지 않고 그때그때 훑는 구현이 여기서 걸린다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.size());
      },
    },
    {
      covers: ["values"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.values());
      },
    },
    seededInput({
      covers: ["union"],
      qualifier: "expected",
      bound: "O(n)",
      adversarial: false,
      // **수신자를 키운다.** `n + m` 의 앞쪽을 재는 자리다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        fillOther(impl, FIXED_SIDE, (index) => index);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.union());
      },
    }),
    seededInput({
      covers: ["union"],
      qualifier: "expected",
      bound: "O(n)",
      adversarial: false,
      // **인자를 키운다.** `n + m` 의 뒤쪽을 재는 자리이고, 세 연산 중 인자의 크기가
      // 상한에 들어오는 것이 이 행 하나라는 사실이 아래 두 시나리오와의 대비로 드러난다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fillFixedSide(impl);
        fillOther(impl, n, (index) => items[index] as number);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.union());
      },
    }),
    seededInput({
      covers: ["intersection"],
      qualifier: "expected",
      bound: "O(n)",
      adversarial: false,
      // **수신자를 키운다.** 계약이 이 행의 `n` 을 수신자의 크기로 적었으므로 여기서는
      // 선형이어야 한다. **작은 쪽을 골라 훑는 구현이 여기서 걸린다** — 계약을 어겨서가
      // 아니라 계급이 아래라서다(불변 사실 49).
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        fillOther(impl, FIXED_SIDE, (index) => index);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.intersection());
      },
    }),
    seededInput({
      covers: ["intersection"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // **인자를 키운다.** 계약의 상한에 `m` 이 없으므로 기대가 상수다. 인자를 훑어 답을
      // 짓는 구현이 여기서 걸리고, 그것이 이 계약의 `n` 이 무엇인지를 재는 유일한 자리다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fillFixedSide(impl);
        fillOther(impl, n, (index) => items[index] as number);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.intersection());
      },
    }),
    seededInput({
      covers: ["difference"],
      qualifier: "expected",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => items[index] as number);
        fillOther(impl, FIXED_SIDE, (index) => index);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.difference());
      },
    }),
    seededInput({
      covers: ["difference"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // 교집합과 같은 자리다. 차집합은 작은 쪽을 고를 수조차 없으므로 — 답이 수신자의
      // 원소로만 이루어진다 — 여기서 걸리는 것은 인자를 훑는 계열 하나뿐이다.
      run: (impl, n, ctx) => {
        const items = shuffledRange(n, ctx.rng);
        fillFixedSide(impl);
        fillOther(impl, n, (index) => items[index] as number);
        for (let round = 0; round < ROUNDS; round++)
          ctx.step(() => impl.difference());
      },
    }),
  ],
};
