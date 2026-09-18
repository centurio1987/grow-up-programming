/**
 * `linear/doublyLinkedList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./doublyLinkedList.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **핸들을 번호로 부른다.** 핸들은 구현이 만든 객체라 참조 모델이 똑같은 것을 만들 수 없고, 하네스의
 * 인자 생성기는 모델을 받지 않는다(`src/data-structures/_contract/runContract.ts:37`). 그래서 양쪽이
 * **같은 규칙으로 번호를 매긴다** — 넣기가 핸들을 돌려줄 때마다 0, 1, 2, … 를 붙이고(돌려주지 않은 호출은
 * 번호를 쓰지 않는다), 인자의 번호 `at` 을 지금까지 매긴 수로 나눈 나머지 번호의 핸들을 쓴다. 구현 쪽은
 * 받은 핸들을 구현마다 목록에 모아 두고(`WeakMap`), 모델 쪽은 번호를 원소 자리에 그대로 적는다. 넣기의
 * 관측값은 그 번호이고 `null` 이면 `null` 이다.
 *
 * - 목록에는 **죽은 핸들도 남는다.** 무작위 시퀀스가 뺀 원소의 핸들을 다시 고르는 것이 「산 핸들이 아니면
 *   `false` · `null`」을 재는 길이다.
 * - `at` 이 음수이거나 아직 매긴 번호가 없으면 **다른 수열이 돌려준 핸들**을 쓴다. 구현 쪽은 같은 클래스의
 *   수열을 하나 더 세워 거기 넣은 핸들을 넘긴다. 무작위로는 열 번에 한 번쯤 고른다.
 *
 * **「다른 핸들은 그대로 유효하다」는 따로 재는 단정이 없다.** 번호로 부른 핸들이 모델과 같은 원소를
 * 가리키는지를 뒤따르는 `insertAfter` · `remove` · `toArray` 가 매번 대조하므로, 한 원소를 뺄 때 이웃 원소의
 * 핸들을 죽이거나 딴 원소로 옮기는 구현은 그 핸들을 다시 고르는 호출에서 갈린다.
 *
 * **`toArray` 는 관측한 뒤 돌려받은 배열을 일부러 망가뜨린다.** 「돌려준 배열을 고쳐도 수열은 바뀌지
 * 않는다」가 다음 관측에서 드러나게 하려는 것이다(`linear/singlyLinkedList` 와 같은 처리).
 *
 * **배제해야 할 계열이 셋이고 서로 다른 자리에서 걸린다.** 앞 원소를 찾아 걷는 단방향 마디는 `remove`
 * 에서, 자리를 찾고 뒤를 미는 언어 배열은 `prepend` · `insertAfter` · `remove` 에서 축3이 잡는다. 다음 원소의
 * 값을 끌어와 덮는 우회는 비용이 전부 상수라 축3을 다 통과하고 축1이 잡는다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/**
 * 헤더 연산 계약 표의 여섯 행을 그대로 옮긴 표면. 핸들은 구현이 정하는 타입이라 `unknown` 으로 받는다 —
 * 메서드 매개변수는 양방향으로 대조되므로 구현이 제 마디 타입으로 받아도 이 표면에 맞는다.
 */
export interface DoublyLinkedListContract<T> {
  prepend(value: T): unknown;
  append(value: T): unknown;
  insertAfter(handle: unknown, value: T): unknown;
  remove(handle: unknown): boolean;
  toArray(): T[];
}

type Surface = DoublyLinkedListContract<number>;

/**
 * 축1 참조 모델. 핸들 번호를 원소 자리에 그대로 적는다 — 축1은 의미만 보고 비용은 보지 않는다.
 * `values[k]` 는 k 번 핸들이 가리키는 원소의 값이고, 그 원소가 수열에 남아 있으면 `order` 에 k 가 있다.
 */
interface Model {
  order: number[];
  values: number[];
}

/** 무작위 인자 `at` 을 뽑는다. 열 번에 한 번쯤 다른 수열의 핸들(-1)을 고른다. */
function someAt(rng: () => number): number {
  return rng() < 0.1 ? -1 : Math.floor(rng() * 1024);
}

/** 축1 무작위 값. 0 과 음수가 섞이게 잡는다. */
function someValue(rng: () => number): number {
  return Math.floor(rng() * 100) - 20;
}

/** 인자 번호를 핸들 번호로 푼다. 다른 수열의 핸들을 써야 하면 `null`. */
function slotOf(at: number, issued: number): number | null {
  if (at < 0 || issued === 0) return null;
  return at % issued;
}

/** 구현마다 넣기가 돌려준 핸들을 번호 순서로 모은다. 죽은 핸들도 남긴다. */
const issuedBy = new WeakMap<object, unknown[]>();

function issued(impl: Surface): unknown[] {
  let handles = issuedBy.get(impl);
  if (handles === undefined) {
    handles = [];
    issuedBy.set(impl, handles);
  }
  return handles;
}

/** 번호 `at` 이 가리키는 핸들. 음수이거나 매긴 번호가 없으면 같은 클래스의 다른 수열이 돌려준 핸들이다. */
function handleAt(impl: Surface, at: number): unknown {
  const handles = issued(impl);
  const slot = slotOf(at, handles.length);
  if (slot !== null) return handles[slot];
  const Other = impl.constructor as new () => Surface;
  return new Other().append(0);
}

/** 넣기가 돌려준 것을 관측값으로 바꾼다 — 핸들이면 새 번호, 아니면 `null`. */
function record(impl: Surface, made: unknown): number | null {
  if (made === null || made === undefined) return null;
  const handles = issued(impl);
  handles.push(made);
  return handles.length - 1;
}

/** 모델에서 번호 `at` 이 산 핸들이면 그 원소의 `order` 안 자리, 아니면 `-1`. */
function liveIndex(model: Model, at: number): number {
  const slot = slotOf(at, model.values.length);
  return slot === null ? -1 : model.order.indexOf(slot);
}

export const doublyLinkedListContract: ContractSpec<Surface, Model> = {
  name: "DoublyLinkedList",
  grade: "basic",
  model: () => ({ order: [], values: [] }),

  ops: [
    {
      name: "prepend",
      arg: (rng) => someValue(rng),
      onImpl: (impl, arg) => record(impl, impl.prepend(arg as number)),
      onModel: (model, arg) => {
        model.values.push(arg as number);
        model.order.unshift(model.values.length - 1);
        return model.values.length - 1;
      },
    },
    {
      name: "append",
      arg: (rng) => someValue(rng),
      onImpl: (impl, arg) => record(impl, impl.append(arg as number)),
      onModel: (model, arg) => {
        model.values.push(arg as number);
        model.order.push(model.values.length - 1);
        return model.values.length - 1;
      },
    },
    {
      name: "insertAfter",
      arg: (rng) => [someAt(rng), someValue(rng)],
      onImpl: (impl, arg) => {
        const [at, value] = arg as [number, number];
        return record(impl, impl.insertAfter(handleAt(impl, at), value));
      },
      onModel: (model, arg) => {
        const [at, value] = arg as [number, number];
        const index = liveIndex(model, at);
        if (index < 0) return null;
        model.values.push(value);
        model.order.splice(index + 1, 0, model.values.length - 1);
        return model.values.length - 1;
      },
    },
    {
      name: "remove",
      arg: (rng) => someAt(rng),
      onImpl: (impl, arg) => impl.remove(handleAt(impl, arg as number)),
      onModel: (model, arg) => {
        const index = liveIndex(model, arg as number);
        if (index < 0) return false;
        model.order.splice(index, 1);
        return true;
      },
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
      onModel: (model) => model.order.map((slot) => model.values[slot]),
    },
  ],

  edges: [
    {
      name: "빈 수열에 넣은 원소는 앞 끝이자 뒤 끝이다",
      steps: [
        { op: "toArray" },
        { op: "toArray" },
        { op: "prepend", arg: 1 },
        { op: "append", arg: 2 },
        { op: "prepend", arg: 0 },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 번호 0 · 1 · 2 가 차례로 10 · 20 · 5 를 가리킨다. 앞에 5 가 끼어도 0 번은 여전히 10 이다.
      name: "핸들은 첨자가 아니다 — 앞에 끼워도 같은 원소 뒤에 들어간다",
      steps: [
        { op: "append", arg: 10 },
        { op: "append", arg: 20 },
        { op: "prepend", arg: 5 },
        { op: "insertAfter", arg: [0, 15] },
        { op: "toArray" },
        { op: "insertAfter", arg: [1, 25] },
        { op: "insertAfter", arg: [2, 7] },
        { op: "toArray" },
      ],
    },
    {
      name: "빠진 원소의 핸들은 remove 가 false · insertAfter 가 null 이고 상태는 그대로다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "remove", arg: 0 },
        { op: "remove", arg: 0 },
        { op: "insertAfter", arg: [0, 9] },
        { op: "toArray" },
        { op: "toArray" },
        { op: "append", arg: 1 },
        { op: "remove", arg: 0 },
        { op: "toArray" },
      ],
    },
    {
      // 1 번(값 2)을 빼면 2 번(값 3)의 핸들이 그대로 살아 있어야 한다. 다음 원소의 값을 끌어와 제 마디에
      // 덮는 우회는 여기서 1 번이 살아남고 2 번이 죽는다.
      name: "하나를 빼도 다음 원소의 핸들은 그대로 산다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "append", arg: 3 },
        { op: "remove", arg: 1 },
        { op: "toArray" },
        { op: "remove", arg: 2 },
        { op: "remove", arg: 1 },
        { op: "toArray" },
        { op: "insertAfter", arg: [0, 4] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 앞뒤 원소를 모두 뺀 뒤에도 가운데 원소의 핸들로 양쪽에 붙일 수 있어야 한다.
      name: "양쪽 이웃을 빼도 가운데 원소의 핸들로 끼울 수 있다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "append", arg: 3 },
        { op: "remove", arg: 0 },
        { op: "remove", arg: 2 },
        { op: "insertAfter", arg: [1, 9] },
        { op: "prepend", arg: 0 },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      name: "값이 같은 원소가 여럿이어도 핸들이 가리키는 그 원소가 빠진다",
      steps: [
        { op: "append", arg: 7 },
        { op: "append", arg: 8 },
        { op: "append", arg: 7 },
        { op: "remove", arg: 2 },
        { op: "toArray" },
        { op: "append", arg: 7 },
        { op: "remove", arg: 0 },
        { op: "toArray" },
        { op: "insertAfter", arg: [3, 7] },
        { op: "toArray" },
      ],
    },
    {
      // 뒤 끝을 빼면 그 앞 원소가 뒤 끝이 되어야 다음 append 가 그 뒤에 붙는다. 앞 끝도 같다.
      name: "끝 원소를 빼면 이웃 원소가 새 끝이 된다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "remove", arg: 1 },
        { op: "append", arg: 3 },
        { op: "toArray" },
        { op: "remove", arg: 0 },
        { op: "prepend", arg: 4 },
        { op: "toArray" },
        { op: "remove", arg: 2 },
        { op: "remove", arg: 3 },
        { op: "toArray" },
        { op: "toArray" },
        { op: "append", arg: 5 },
        { op: "toArray" },
      ],
    },
    {
      // 뒤 끝 원소 뒤에 끼우면 그 원소가 새 뒤 끝이어야 다음 append 가 그 뒤에 붙는다.
      name: "뒤 끝 원소 뒤에 끼운 원소가 새 뒤 끝이다",
      steps: [
        { op: "append", arg: 1 },
        { op: "insertAfter", arg: [0, 2] },
        { op: "append", arg: 3 },
        { op: "toArray" },
        { op: "insertAfter", arg: [2, 4] },
        { op: "remove", arg: 3 },
        { op: "append", arg: 5 },
        { op: "toArray" },
      ],
    },
    {
      // 가운데에 끼운 뒤 그 바로 뒤 원소를 빼면 끼운 원소가 남아야 한다. 끼울 때 뒤 원소가 앞을 새 원소로
      // 고쳐 적지 않은 구현은 뒤 원소를 뺄 때 옛 앞 원소에 이어 붙여 끼운 원소를 함께 떨어뜨린다 — 이 경우는
      // 앞 경계들이 짚지 않고 무작위 시퀀스에서야 드러났다(정본 변이로 확인).
      name: "가운데에 끼운 원소는 그 뒤 원소를 빼도 남는다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 3 },
        { op: "insertAfter", arg: [0, 2] },
        { op: "remove", arg: 1 },
        { op: "toArray" },
        { op: "toArray" },
        { op: "append", arg: 4 },
        { op: "toArray" },
      ],
    },
    {
      // 음수 번호는 같은 클래스의 다른 수열이 돌려준 핸들이다. 아직 매긴 번호가 없을 때도 그렇다.
      name: "다른 수열이 돌려준 핸들은 빠진 원소의 핸들과 같게 다룬다",
      steps: [
        { op: "remove", arg: 0 },
        { op: "insertAfter", arg: [0, 5] },
        { op: "append", arg: 1 },
        { op: "remove", arg: -1 },
        { op: "insertAfter", arg: [-1, 5] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      name: "돌려받은 배열을 고쳐도 수열은 그대로다",
      steps: [
        { op: "append", arg: 1 },
        { op: "append", arg: 2 },
        { op: "toArray" },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 세어 둔 수를 읽는 행이 표면에서 빠져 늘어놓은 수와 견줄
  // 둘째 경로가 사라졌고, 남은 조건은 `toArray` 행의 의미라 축1의 몫이다.
  invariants: [],

  scenarios: [
    {
      // 상각이므로 n 회 측정한다(§규약2 시나리오 규칙 4). 앞 끝을 배열 첫 칸에 두는 구현이 넣을 때마다
      // 나머지를 민다.
      covers: ["prepend"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.prepend(i));
      },
    },
    {
      covers: ["append"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.append(i));
      },
    },
    {
      // **n 개를 채운 뒤 그 원소들 가운데 무작위 자리 뒤에 n 번 끼운다.** 핸들의 자리를 찾아 훑거나 그 뒤를
      // 미는 구현은 호출마다 담긴 수에 비례한다. 끝에만 끼우면 뒤를 미는 구현이 통과하므로 가운데를 고른다.
      covers: ["insertAfter"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const handles: unknown[] = [];
        for (let i = 0; i < n; i++) handles.push(impl.append(i));
        for (let i = 0; i < n; i++) {
          const at = handles[Math.floor(ctx.rng() * n)];
          ctx.step(() => impl.insertAfter(at, i));
        }
      },
    },
    {
      // **뒤에 넣어 채우고 뒤 끝부터 앞 끝 쪽으로 전부 뺀다.** 앞 원소를 모르는 단방향 마디는 뺄 원소의 앞
      // 원소를 앞 끝에서부터 걸어 찾으므로 뺄 원소가 앞 끝에서 멀수록 비싸다 — 앞 끝부터 빼면 걸음이 없어
      // 통과한다. 이 입력이 그 계열을 겨눈다(불변 사실 57).
      covers: ["remove"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const handles: unknown[] = [];
        for (let i = 0; i < n; i++) handles.push(impl.append(i));
        for (let i = n - 1; i >= 0; i--) {
          const at = handles[i];
          ctx.step(() => impl.remove(at));
        }
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        let middle = impl.append(0);
        for (let i = 1; i < n; i++) {
          if (i % 3 === 0) impl.prepend(i);
          else if (i % 3 === 1) impl.append(i);
          else middle = impl.insertAfter(middle, i);
        }
        for (let i = 0; i < 3; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
