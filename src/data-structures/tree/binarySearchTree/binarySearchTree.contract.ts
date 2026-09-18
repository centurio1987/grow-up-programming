/**
 * `tree/binarySearchTree` 계약 스위트(규약2).
 *
 * 계약은 `./binarySearchTree.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`. 크기는 두 점 $\{2^{10}, 2^{12}\}$ 이고
 * 허용치가 ±60% 이며 적대적 입력이 **선택**이다. 나란한 넷과 갈리는 첫 자리가 이것이다.
 *
 * **이 스위트를 통과하는 것과 이 계약을 만족하는 것은 다르다.** 이 파일에서 가장 중요한
 * 문장이고, 이유가 계약의 느슨함에 있다.
 *
 * 축3은 상한이 아니라 **성장 계급**을 판정한다(불변 사실 49) — 위쪽뿐 아니라 아래쪽으로도
 * 허용치가 있다. 나란한 넷에서는 그것이 문제가 되지 않았다. 로그를 약속하면 그 계약을
 * 만족하는 구현은 전부 로그 계급이기 때문이다(비교로 정렬 집합을 만드는 한 찾기가 로그보다
 * 빨라질 수 없다). **이 계약은 다르다.** 선형만 약속하므로 계급이 O(1) 부터 O(n) 까지
 * 흩어지고, 실제로 흩어진다 — 오름차순 넣기에서 정본은 연산당 최대가 1,023 → 4,095
 * ($r = 4.00$)인데 정렬 배열은 10 → 12($r = 1.20$)다. **어느 계급으로 걸어도 나머지가
 * 걸린다.**
 *
 * 그래서 시나리오는 **정본의 계급**으로 건다(불변 사실 74). 규약2가 축3의 대상을 정본으로
 * 못박고 있으므로 규격 안이지만(§규약2 「네 축과 대상」), 따라 나오는 것을 여기 적어 둔다 —
 * **정렬 배열은 이 계약을 만족하면서 이 스위트의 축3에서 걸린다.** 계약 위반이 아니고,
 * 그렇게 보고해서도 안 된다(불변 사실 49). 지금까지 그 문장은 결함 fixture 에 대한 것이었고,
 * **계약이 이름을 불러 초대한 구현이 걸리는 것은 이 계약이 처음이다.**
 *
 * **반대쪽 한계도 실물로 있다.** `_fixtures/lazySortingSet.ts` 는 필요충분조건의 비용 조건을
 * 어기는데 여섯 시나리오를 **전부 통과한다** — 어기는 폭이 로그 인수 하나뿐이라 축3의
 * 해상도 아래다(불변 사실 53·62). 위아래로 한 자리씩, 이 계약에서 축3이 하는 일은
 * **이차 이상 이탈 감지 하나로** 좁혀진다. 나머지를 지키게 하는 것은 축2다 — 등급이
 * `invariant` 인 것이 그 사실의 다른 이름이다. **원래는 둘이었다** — 상한이 상수인 `size`
 * 행이 위쪽으로 판별력을 갖는 유일한 자리였는데 그 행이 계약에서 빠졌다(`KAN-040` `S4`).
 * 그 행 하나만 걸던 결함 fixture(`_fixtures/recountingSizeSet.ts`)를 이제 축3이 잡지 못하고,
 * 그 사실은 `_contract/runContract.test.ts` 가 시험으로 적는다.
 *
 * **적대적 입력이 선택인데도 넷을 뒀다.** 회귀 수준이 요구하지 않지만, 정본이 O(n) 계급을
 * 실제로 내는 입력이 그것뿐이라 두지 않으면 잴 것이 없다. 같은 정본을 아래 `toArray`
 * 시나리오와 같은 방식으로 뽑은 무작위 값에 물리면 — 즉 매 호출의 인자를 `ctx.rng()` 로
 * 새로 뽑으면 — 단일 호출 최대가 25 → 29(`insert`) · 34 → 40(조회) · 24 → 29(`delete`) ·
 * 26 → 31(`range`)로 **로그 계급**이고, 그 값으로는 `O(n)` 행을 통과시키지 못한다.
 *
 * **`delete` 만 뽑는 방법이 값을 가른다.** 넣은 값을 넣은 순서 그대로 지우면 20 → 27
 * ($r = 1.35$)이다. 계급은 같으므로 판정이 갈리지 않지만, **구성을 안 적으면 재현되지 않는
 * 수치가 된다** — 위 넷은 전부 매 호출 새로 뽑은 값이다. **같은 구현·같은 연산이 입력에 따라 두 계급을 오가고 둘 다
 * 계약 안이다** — 로그를 약속한 나란한 넷에서는 성립하지 않는 일이다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. 나란한 넷과 같다 — 갈리는 것은 상한뿐이다. */
export interface BinarySearchTreeContract<T> {
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
 * **같은 정렬 배열이 나란한 넷에서는 결함 fixture 였는데**(`_contract/_fixtures/
 * sortedArraySet.ts`) 이 계약에서는 결함이 아니다. 계약이 담기·지우기에 로그를 약속하지
 * 않으므로 뒤를 미는 비용이 위반이 되지 않는다.
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

export const binarySearchTreeContract: ContractSpec<
  BinarySearchTreeContract<number>,
  Model
> = {
  name: "BinarySearchTree",
  grade: "invariant",
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
      // **이 계약에서 특히 중요한 자리다.** 오름차순으로만 넣으면 한쪽으로 자라는 구현이
      // 사슬이 되는데, 그것이 이 계약에서는 결함이 아니다. 답이 맞는지만 본다.
      name: "오름차순으로만 넣어도 답이 맞다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 4 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
        { op: "range", arg: [2, 3] },
        { op: "delete", arg: 1 },
        { op: "min" },
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
      // 구간의 두 끝이 담긴 값과 어긋나는 자리를 짚는다. 잘라내며 내려가는 구현은 여기서
      // 「올릴 자리가 없는」 경우를 만난다.
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

  // 헤더 불변식 절의 셋. 나란한 넷의 셋과 같다 — 판별 절차가 상한을 읽지 않기 때문이다.
  // **이 계약에서는 축2가 주 판별기다.** 축3이 위아래로 한 자리씩 눈이 멀어 있으므로
  // (이 파일 헤더) 계약이 실제로 배제하는 것을 잡는 것은 여기다.
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
      bound: "O(n)",
      adversarial: true,
      // 오름차순 넣기. 높이를 스스로 묶지 않는 구현이 사슬이 되는 입력이고, **이 계약은
      // 그것을 허용한다.** 나란한 넷에서는 같은 입력이 결함을 드러내는 자리였는데 여기서는
      // 정본이 서는 계급을 정하는 자리다 — 정본의 단일 호출 최대가 1,023 → 4,095 다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(i));
      },
    },
    {
      covers: ["has", "min", "max"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      // 순차 조회. 준비가 오름차순 넣기라 사슬 위에서 찾는다 — 정본의 최대가
      // 2,049 → 8,193 이다(세 호출을 한 걸음으로 묶었으므로 사슬 길이의 두 배 남짓).
      //
      // 걸음 하나가 `has`·`min`·`max` 세 호출인 것은 셋이 같은 내려가기 한 번이라
      // 갈라 잴 이유가 없어서다.
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
      bound: "O(n)",
      adversarial: true,
      // 오름차순으로 채우고 **내림차순으로** 지운다. 오름차순으로 지우면 사슬의 머리부터
      // 빠져 매번 첫 자리에서 끝나므로($r = 1.00$) 아무것도 재지 못한다 — 같은 준비에
      // 지우는 순서만 뒤집으면 매번 사슬 끝까지 내려가 1,024 → 4,096 이 된다.
      // 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것이 지우는 순서에서도 나온다
      // (불변 사실 57).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = n - 1; i >= 0; i--) ctx.step(() => impl.delete(i));
      },
    },
    {
      covers: ["range"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      // 사슬의 **끝쪽** 좁은 구간을 되풀이해 묻는다. 답 수 k 는 셋으로 고정이므로 파라미터가
      // n 하나만 남고(§규약2 다변수 상한 규칙), 잘라내며 내려가도 사슬에서는 잘라 낼 가지가
      // 없어 끝까지 간다 — 정본이 1,024 → 4,096 이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        const low = n - 4;
        for (let i = 0; i < n; i++) ctx.step(() => impl.range(low, low + 2));
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // 호출 하나가 원소 수만큼 드는 연산이다. **어떤 구현으로 지어도 이 계급이므로**
      // 여섯 중 유일하게 계급이 갈리지 않는 행이고, 그래서 적대적 입력이 필요 없다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
