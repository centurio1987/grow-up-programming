/**
 * `hash/hashMapChaining` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./hashMapChaining.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **열거 두 연산의 순서는 계약이 정하지 않는다.** 그래서 축1이 `keys()`·`values()` 를
 * 참조 모델과 견줄 때 양쪽을 **정렬해서** 본다. 정렬하지 않으면 자리를 어떻게 정하든
 * 모델과 다른 순서가 나와 모든 구현이 축1에서 걸리고, 그 순간 스위트가 열거 순서를
 * 처방하는 것이 된다. 정렬이 지우는 정보 하나 — **키와 값의 짝** — 는 축2가 받는다
 * (불변식 3번).
 *
 * **적대적 입력이 키 묶음이지 펴기 함수가 아니다.** 계약 스위트의 시나리오는 계약을
 * 겨눈다(불변 사실 44). `i * 65536` 은 계약의 용어만으로 적히는 키 묶음이고 — 주입 정책이
 * 요구하는 것(순수·동등성 일치·정보를 지우지 않을 것)을 전부 지킨다 — 어느 구현의 내부도
 * 읽지 않는다. 그런데도 **펴기 값을 그대로 자리로 쓰는 계열 전체**를 가른다: 낮은 16 비트가
 * 0 이므로 자리 수가 그 아래인 동안 전부 같은 자리로 간다.
 *
 * **`expected` 시나리오의 시행 축이 여기서 실제로 일한다.** 적대적 시나리오의 키 묶음은
 * 결정론적이라 씨앗이 입력을 바꾸지 않는다(그래서 `fixedInput` 이다). 대신 시행마다 정본이 새로 지어지고, 정본은
 * 지을 때 무작위 곱수를 뽑는다 — 그래서 시행 열은 **구현이 뽑는 무작위성** 열 벌이 되고,
 * 중앙값이 그 열에 대한 기댓값의 대표가 된다. 계약이 말하는 기댓값이 바로 그것이다.
 */

import { fixedInput, seededInput } from "../../_contract/expectedRepeat";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **여섯 행**을 그대로 옮긴 표면. 생성자 행은 팩토리가 나른다. */
export interface HashMapChainingContract<K, V> {
  set(key: K, value: V): void;
  get(key: K): V | null;
  has(key: K): boolean;
  delete(key: K): boolean;
  keys(): K[];
  values(): V[];
}

type Impl = HashMapChainingContract<number, number>;
type Model = Map<number, number>;

/** 축1 무작위 시퀀스가 쓰는 키 범위. 좁게 잡아야 같은 키를 다시 만지는 경로가 자주 돈다. */
const KEY_SPACE = 64;

/**
 * 적대적 키의 간격. 낮은 16 비트를 0 으로 만든다.
 *
 * 축3 사다리 맨 위(`n = 2^14`)에서도 자리 수는 `2^15` 를 넘지 않으므로, 펴기 값을 자리 수로
 * 나눈 나머지로 자리를 정하는 구현은 **크기와 무관하게 한 자리**에 전부 몰린다. 곱해서 위쪽
 * 비트를 쓰는 구현에는 아무 일도 일어나지 않는다.
 */
const CLUMP = 1 << 16;

function sorted(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function key(rng: () => number): number {
  return Math.floor(rng() * KEY_SPACE);
}

function pair(rng: () => number): [number, number] {
  return [key(rng), Math.floor(rng() * 1000)];
}

/** 시나리오 준비. 걸음에 안 들어간다. */
function fill(impl: Impl, n: number, keyAt: (index: number) => number): void {
  for (let index = 0; index < n; index++) impl.set(keyAt(index), index);
}

export const hashMapChainingContract: ContractSpec<Impl, Model> = {
  name: "HashMapChaining",
  grade: "complexity",
  model: () => new Map<number, number>(),

  ops: [
    {
      name: "set",
      arg: (rng) => pair(rng),
      onImpl: (impl, arg) => {
        const [k, v] = arg as [number, number];
        impl.set(k, v);
        return undefined;
      },
      onModel: (model, arg) => {
        const [k, v] = arg as [number, number];
        model.set(k, v);
        return undefined;
      },
    },
    {
      name: "get",
      arg: (rng) => key(rng),
      onImpl: (impl, arg) => impl.get(arg as number),
      onModel: (model, arg) => model.get(arg as number) ?? null,
    },
    {
      name: "has",
      arg: (rng) => key(rng),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.has(arg as number),
    },
    {
      name: "delete",
      arg: (rng) => key(rng),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => model.delete(arg as number),
    },
    {
      // 순서는 계약이 정하지 않으므로 양쪽을 정렬해서 견준다(파일 헤더).
      name: "keys",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.keys()),
      onModel: (model) => sorted([...model.keys()]),
    },
    {
      name: "values",
      arg: () => undefined,
      onImpl: (impl) => sorted(impl.values()),
      onModel: (model) => sorted([...model.values()]),
    },
  ],

  edges: [
    {
      name: "빈 사전에서는 무엇을 물어도 없다고 답한다",
      steps: [
        { op: "get", arg: 7 },
        { op: "has", arg: 7 },
        { op: "delete", arg: 7 },
        { op: "keys" },
        { op: "values" },
      ],
    },
    {
      // 같은 키를 다시 넣는 것은 **더하는 일이 아니라 바꾸는 일**이다. 담긴 것이 그대로인지가
      // 그 문장의 관측 지점이고, 그것을 `keys()` 가 앞뒤로 보인다.
      name: "같은 키를 다시 넣으면 값만 바뀌고 담긴 키는 그대로다",
      steps: [
        { op: "set", arg: [3, 100] },
        { op: "keys" },
        { op: "set", arg: [3, 200] },
        { op: "keys" },
        { op: "get", arg: 3 },
        { op: "keys" },
        { op: "values" },
      ],
    },
    {
      name: "지운 뒤 다시 넣으면 값이 새것이다",
      steps: [
        { op: "set", arg: [5, 10] },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "get", arg: 5 },
        { op: "set", arg: [5, 20] },
        { op: "get", arg: 5 },
        { op: "keys" },
      ],
    },
    {
      // 없는 키를 지우는 호출은 상태를 바꾸지 않는다. 옆 키가 살아 있는지로 확인한다.
      name: "없는 키를 지우면 거짓이고 상태가 바뀌지 않는다",
      steps: [
        { op: "set", arg: [1, 11] },
        { op: "set", arg: [2, 22] },
        { op: "delete", arg: 9 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "keys" },
      ],
    },
    {
      // 한 자리로 몰리는 키 넷. 자리를 어떻게 정하든 넷이 서로를 가리지 않아야 한다.
      name: "같은 자리로 몰리는 키들도 서로를 가리지 않는다",
      steps: [
        { op: "set", arg: [0, 1] },
        { op: "set", arg: [CLUMP, 2] },
        { op: "set", arg: [2 * CLUMP, 3] },
        { op: "set", arg: [3 * CLUMP, 4] },
        { op: "get", arg: 2 * CLUMP },
        { op: "delete", arg: CLUMP },
        { op: "get", arg: CLUMP },
        { op: "get", arg: 2 * CLUMP },
        { op: "get", arg: 3 * CLUMP },
        { op: "keys" },
      ],
    },
    {
      // 지우기가 남긴 자리를 지나가야 닿는 키가 있는 자리. 지운 자리를 「비었다」로만
      // 표시하는 구현이 여기서 갈린다.
      name: "몰린 자리의 가운데를 지워도 뒤엣것이 그대로 찾아진다",
      steps: [
        { op: "set", arg: [0, 1] },
        { op: "set", arg: [CLUMP, 2] },
        { op: "set", arg: [2 * CLUMP, 3] },
        { op: "delete", arg: CLUMP },
        { op: "has", arg: 2 * CLUMP },
        { op: "has", arg: 0 },
        { op: "set", arg: [4 * CLUMP, 5] },
        { op: "has", arg: 2 * CLUMP },
        { op: "has", arg: 4 * CLUMP },
        { op: "keys" },
      ],
    },
    {
      // 같은 값을 여러 키에 담는 자리. `values()` 는 집합이 아니라 다중집합이다.
      name: "값이 겹쳐도 값 목록은 담긴 수만큼 나온다",
      steps: [
        { op: "set", arg: [1, 7] },
        { op: "set", arg: [2, 7] },
        { op: "set", arg: [3, 7] },
        { op: "values" },
        { op: "delete", arg: 2 },
        { op: "values" },
      ],
    },
    {
      // 넣고 지우기를 되풀이해도 상태가 새지 않는다. 지운 자리를 다시 쓰는 구현이 여기서
      // 갈린다 — 자리를 못 되쓰면 담긴 수는 맞는데 표가 끝없이 자란다.
      name: "넣고 지우기를 되풀이해도 담긴 것은 하나다",
      steps: [
        { op: "set", arg: [8, 1] },
        { op: "delete", arg: 8 },
        { op: "set", arg: [8, 2] },
        { op: "delete", arg: 8 },
        { op: "set", arg: [8, 3] },
        { op: "get", arg: 8 },
        { op: "keys" },
        { op: "values" },
      ],
    },
  ],

  invariants: [
    {
      // 담김 여부를 읽는 길이 둘이다 — `has(k)` 와 `keys()` 안에 k 가 있는가.
      name: "임의의 키에 대해 has(k) 와 keys() 포함이 같다",
      check: (impl) => {
        const listed = new Set(impl.keys());
        for (const k of listed) {
          if (!impl.has(k))
            return `keys() 에 ${k} 가 있는데 has(${k}) 가 거짓이다`;
        }
        for (let k = 0; k < KEY_SPACE; k++) {
          if (!listed.has(k) && impl.has(k)) {
            return `keys() 에 ${k} 가 없는데 has(${k}) 가 참이다`;
          }
        }
        return null;
      },
    },
    {
      // 키와 값의 짝을 읽는 길이 둘이다 — `values()` 와 `get(keys()[i])`. 열거 순서는
      // 계약이 정하지 않지만 **두 열거가 서로 어긋나면 안 된다**는 것은 정한다.
      name: "values() 는 keys() 와 자리마다 짝이 맞는다",
      check: (impl) => {
        const keys = impl.keys();
        const values = impl.values();
        if (keys.length !== values.length) {
          return `keys() 는 ${keys.length} 개, values() 는 ${values.length} 개다`;
        }
        for (let at = 0; at < keys.length; at++) {
          const k = keys[at] as number;
          if (!Object.is(values[at], impl.get(k))) {
            return `${at} 번째 — keys()[${at}]=${k} 의 값은 ${impl.get(k)} 인데 values()[${at}]=${values[at]} 다`;
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    seededInput({
      covers: ["set"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // **서로 다른 키 n 개를 무작위 순서로 넣기.** 담는 자리를 훑어 찾는 계열
      // (`ScanningDictionary`)과 키를 정렬해 두는 계열(`SortedKeyDictionary`)이 여기서
      // 걸린다. 자리를 나머지로 정하는 계열은 **여기를 통과한다** — 무작위 키에는 나머지도
      // 잘 흩어진다.
      run: (impl, n, ctx) => {
        const keys = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.set(keys[index] as number, index));
        }
      },
    }),
    fixedInput({
      covers: ["set"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      // **낮은 비트가 전부 0 인 키 n 개.** 자리를 펴기 값의 나머지로 정하는 계열을 가르는
      // **유일한** 시나리오다. 위 무작위 시나리오와 짝을 이루는 것이 요점이다 — 하나만
      // 두면 세 결함 중 하나는 반드시 놓친다(불변 사실 24).
      run: (impl, n, ctx) => {
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.set(index * CLUMP, index));
        }
      },
    }),
    seededInput({
      covers: ["get"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const keys = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => keys[index] as number);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.get(keys[index] as number));
        }
      },
    }),
    fixedInput({
      covers: ["get"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n, (index) => index * CLUMP);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.get(index * CLUMP));
        }
      },
    }),
    seededInput({
      covers: ["has"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // 절반은 담긴 키, 절반은 안 담긴 키다. 못 찾는 물음도 같은 상한 안에 있어야 한다 —
      // 찾을 때만 싼 구현은 이 계약을 지키는 것이 아니다.
      run: (impl, n, ctx) => {
        const keys = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => keys[index] as number);
        for (let index = 0; index < n; index++) {
          const asked = index % 2 === 0 ? (keys[index] as number) : n + index;
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
        const keys = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => keys[index] as number);
        for (let index = 0; index < n; index++) {
          ctx.step(() => impl.delete(keys[index] as number));
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
      covers: ["keys"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const keys = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => keys[index] as number);
        for (let round = 0; round < 4; round++) ctx.step(() => impl.keys());
      },
    },
    {
      covers: ["values"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const keys = shuffledRange(n, ctx.rng);
        fill(impl, n, (index) => keys[index] as number);
        for (let round = 0; round < 4; round++) ctx.step(() => impl.values());
      },
    },
  ],
};

/** `0 … n-1` 을 섞은 배열. 서로 다른 키 n 개를 무작위 순서로 주는 자리다. */
function shuffledRange(n: number, rng: () => number): number[] {
  const made: number[] = [];
  for (let value = 0; value < n; value++) made.push(value);
  for (let at = n - 1; at > 0; at--) {
    const swap = Math.floor(rng() * (at + 1));
    [made[at], made[swap]] = [made[swap] as number, made[at] as number];
  }
  return made;
}
